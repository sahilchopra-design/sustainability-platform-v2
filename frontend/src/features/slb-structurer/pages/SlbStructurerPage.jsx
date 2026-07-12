import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, Cell, ReferenceLine, ComposedChart, ReferenceDot,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// SLB Structurer (NX2-05) — Sustainability-Linked Bond structuring desk
// Live backend: /api/v1/slb-structuring
//   GET  /ref/pathways           — hand-authored sector pathway slopes (cited basis)
//   GET  /ref/spo-checklist      — ICMA SLB Principles five components
//   GET  /ref/step-up-benchmarks — published SLB step-up structures (hand-authored, labeled)
//   POST /calibrate              — ambition vs pathway + step-up valuation
//   POST /structure-multi        — up to 3 KPIs, independent + joint-trigger valuation
//   POST /step-down-call         — two-way coupon structures + call-to-avoid-step-up
//   POST /calibrate-history      — OLS trend on actual KPI history → data-driven p(miss) blend
//   POST /ambition-analytics     — cost-of-ambition sweep, greenium×step-up, capex/MACC link
//   POST /spo-preassessment      — structured SLBP pre-screen → RAG summary
// ALL calculation happens in the backend engine (documented closed-form math,
// every model parameter exposed). Scoring-style SLB views live in sll-slb-v2;
// this page is the instrument-structuring desk.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const fmtNum = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;
const fmtBp = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)} bp`;
const num = (v, fb = 0) => { const x = parseFloat(v); return isNaN(x) ? fb : x; };

const VERDICT_STYLE = {
  ahead: { bg: '#dcfce7', fg: '#166534', label: 'AHEAD OF PATHWAY' },
  aligned: { bg: '#e0f2fe', fg: '#075985', label: 'ALIGNED WITH PATHWAY' },
  behind: { bg: '#fee2e2', fg: '#991b1b', label: 'BEHIND PATHWAY' },
};
const RAG_STYLE = {
  GREEN: { bg: '#dcfce7', fg: '#166534' },
  AMBER: { bg: '#fef3c7', fg: '#92400e' },
  RED: { bg: '#fee2e2', fg: '#991b1b' },
};

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const inputStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px',
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };
const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18, ...style }}>{children}</div>
);
const Lbl = ({ children }) => (
  <label style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>{children}</label>
);
const RunBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
    {children}
  </button>
);
const ModelNote = ({ children }) => (
  <div style={{ fontSize: 10.5, color: T.amber, background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginBottom: 10 }}>{children}</div>
);
const CheckChip = ({ ok, label }) => (
  <span style={{ background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, fontFamily: T.mono }}>
    {ok ? '✓' : '✗'} {label}
  </span>
);

const apiErr = (e) => {
  const det = e?.response?.data?.detail;
  return typeof det === 'string' ? det : (det ? JSON.stringify(det) : e.message);
};

// Default multi-KPI set (mandated trio: intensity, absolute scope 1+2, renewable
// share). The renewable-share KPI is tracked as the RESIDUAL NON-RENEWABLE share
// (100 − renewable %), which DECLINES as renewables grow — the engine models
// reduction KPIs, so this stated transformation keeps the math consistent.
const DEFAULT_MULTI_KPIS = [
  { on: true, name: 'Scope 1+2 GHG intensity', unit: 'tCO2e/GWh', by: 2023, bv: 320, ty: 2030, tv: 180, sector: 'power_generation', step: 12.5 },
  { on: true, name: 'Absolute scope 1+2 emissions', unit: 'MtCO2e', by: 2023, bv: 42, ty: 2030, tv: 28, sector: 'general_corporate', step: 12.5 },
  { on: false, name: 'Non-renewable generation share (100 − RES %)', unit: '% of MWh', by: 2023, bv: 55, ty: 2030, tv: 25, sector: 'power_generation', step: 10 },
];

// Hand-authored default MACC measures — EDITABLE PLANNING INPUTS, not engineering
// data. Costs/potentials are indicative for a utility decarbonization program.
const DEFAULT_MACC = [
  { id: 1, name: 'Heat-rate / efficiency program', cost: -12, kt: 90 },
  { id: 2, name: 'Wind repowering', cost: 18, kt: 220 },
  { id: 3, name: 'Coal→gas peaker conversion', cost: 24, kt: 310 },
  { id: 4, name: 'Solar + storage buildout', cost: 32, kt: 400 },
  { id: 5, name: 'Grid-scale battery flexibility', cost: 55, kt: 150 },
  { id: 6, name: 'Green hydrogen co-firing pilot', cost: 140, kt: 60 },
];

export default function SlbStructurerPage() {
  // ── Reference data (live) ─────────────────────────────────────────────────
  const [pathways, setPathways] = useState({ status: 'loading', data: null, error: null });
  const [spo, setSpo] = useState({ status: 'loading', data: null, error: null });
  const [bench, setBench] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let alive = true;
    axios.get('/api/v1/slb-structuring/ref/pathways', { timeout: 15000 })
      .then(({ data }) => alive && setPathways({ status: 'live', data, error: null }))
      .catch((e) => alive && setPathways({ status: 'demo', data: null, error: apiErr(e) }));
    axios.get('/api/v1/slb-structuring/ref/spo-checklist', { timeout: 15000 })
      .then(({ data }) => alive && setSpo({ status: 'live', data, error: null }))
      .catch((e) => alive && setSpo({ status: 'demo', data: null, error: apiErr(e) }));
    axios.get('/api/v1/slb-structuring/ref/step-up-benchmarks', { timeout: 15000 })
      .then(({ data }) => alive && setBench({ status: 'live', data, error: null }))
      .catch((e) => alive && setBench({ status: 'demo', data: null, error: apiErr(e) }));
    return () => { alive = false; };
  }, []);

  // ── KPI / SPT inputs ──────────────────────────────────────────────────────
  const [kpiName, setKpiName] = useState('Scope 1+2 GHG intensity');
  const [kpiUnit, setKpiUnit] = useState('tCO2e/GWh');
  const [baselineYear, setBaselineYear] = useState(2023);
  const [baselineValue, setBaselineValue] = useState(320);
  const [targetYear, setTargetYear] = useState(2030);
  const [targetValue, setTargetValue] = useState(180);
  const [sector, setSector] = useState('power_generation');
  const [slopeOverride, setSlopeOverride] = useState('');
  const [stepUpBp, setStepUpBp] = useState(25);
  const [obsDate, setObsDate] = useState('2026-07-04');
  const [tenorY, setTenorY] = useState(8);
  const [couponPct, setCouponPct] = useState(4.75);
  const [sizeMn, setSizeMn] = useState(500);
  const [discPct, setDiscPct] = useState(4.0);
  // Logistic p(miss) model parameters — exposed, editable
  const [pFloor, setPFloor] = useState(0.05);
  const [pCap, setPCap] = useState(0.95);
  const [midPp, setMidPp] = useState(1.0);
  const [slopePp, setSlopePp] = useState(0.75);

  const logisticPayload = useCallback(() => ({
    p_floor: num(pFloor), p_cap: num(pCap), midpoint_pp: num(midPp), slope_pp: num(slopePp),
  }), [pFloor, pCap, midPp, slopePp]);

  const [calib, setCalib] = useState({ status: 'idle', data: null, error: null });

  const runCalibrate = useCallback(async () => {
    setCalib({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        kpi_name: kpiName, kpi_unit: kpiUnit,
        baseline_year: parseInt(baselineYear, 10), baseline_value: num(baselineValue),
        spt_target_year: parseInt(targetYear, 10), spt_target_value: num(targetValue),
        sector,
        coupon_step_up_bp: num(stepUpBp),
        observation_date: obsDate,
        bond_tenor_years: parseInt(tenorY, 10),
        coupon_pct: num(couponPct),
        issue_size_mn: num(sizeMn),
        discount_rate_pct: num(discPct),
        logistic: logisticPayload(),
      };
      if (slopeOverride !== '' && !isNaN(parseFloat(slopeOverride))) payload.pathway_slope_pct_per_yr = parseFloat(slopeOverride);
      const { data } = await axios.post('/api/v1/slb-structuring/calibrate', payload, { timeout: 20000 });
      setCalib({ status: 'live', data, error: null });
      setSpoGap(String(data?.ambition?.ambition_gap_pp_per_yr ?? ''));  // pre-fill SPO ambition gap
    } catch (e) {
      setCalib({ status: 'demo', data: null, error: apiErr(e) });
    }
  }, [kpiName, kpiUnit, baselineYear, baselineValue, targetYear, targetValue, sector, slopeOverride,
    stepUpBp, obsDate, tenorY, couponPct, sizeMn, discPct, logisticPayload]);

  // ── 1) Multi-KPI structuring ──────────────────────────────────────────────
  const [mkpis, setMkpis] = useState(DEFAULT_MULTI_KPIS);
  const [jointOn, setJointOn] = useState(true);
  const [multi, setMulti] = useState({ status: 'idle', data: null, error: null });
  const updMk = (i, key, v) => setMkpis((prev) => prev.map((k, j) => (j === i ? { ...k, [key]: v } : k)));

  const runMulti = useCallback(async () => {
    setMulti({ status: 'loading', data: null, error: null });
    try {
      const kpis = mkpis.filter((k) => k.on).map((k) => ({
        kpi_name: k.name, kpi_unit: k.unit,
        baseline_year: parseInt(k.by, 10), baseline_value: num(k.bv),
        spt_target_year: parseInt(k.ty, 10), spt_target_value: num(k.tv),
        sector: k.sector, coupon_step_up_bp: num(k.step),
      }));
      if (!kpis.length) throw new Error('enable at least one KPI');
      const { data } = await axios.post('/api/v1/slb-structuring/structure-multi', {
        kpis, observation_date: obsDate, bond_tenor_years: parseInt(tenorY, 10),
        issue_size_mn: num(sizeMn), discount_rate_pct: num(discPct),
        logistic: logisticPayload(), joint_trigger: jointOn,
      }, { timeout: 20000 });
      setMulti({ status: 'live', data, error: null });
    } catch (e) { setMulti({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [mkpis, obsDate, tenorY, sizeMn, discPct, jointOn, logisticPayload]);

  // ── 2) Step-down + call interaction ───────────────────────────────────────
  const [sdPmiss, setSdPmiss] = useState('');           // blank = use /calibrate p(miss)
  const [sdDownBp, setSdDownBp] = useState(12.5);
  const [sdPrice, setSdPrice] = useState(100.0);
  const [calls, setCalls] = useState([
    { id: 1, yr: 4, px: 101.0 }, { id: 2, yr: 5, px: 100.5 }, { id: 3, yr: 6, px: 100.0 },
  ]);
  const [sdc, setSdc] = useState({ status: 'idle', data: null, error: null });
  const updCall = (id, key, v) => setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: v } : c)));
  const addCall = () => setCalls((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1, yr: 3, px: 100.0 }]);
  const rmCall = (id) => setCalls((prev) => prev.filter((c) => c.id !== id));

  const effPmiss = sdPmiss !== '' && !isNaN(parseFloat(sdPmiss))
    ? parseFloat(sdPmiss) : (calib.data?.probability_of_miss?.p_miss ?? null);

  const runStepDownCall = useCallback(async () => {
    setSdc({ status: 'loading', data: null, error: null });
    try {
      if (effPmiss == null) throw new Error('run Calibrate first (or type a p(miss) override)');
      const { data } = await axios.post('/api/v1/slb-structuring/step-down-call', {
        p_miss: effPmiss, coupon_pct: num(couponPct), step_up_bp: num(stepUpBp),
        step_down_bp: num(sdDownBp), spt_target_year: parseInt(targetYear, 10),
        observation_date: obsDate, bond_tenor_years: parseInt(tenorY, 10),
        discount_rate_pct: num(discPct), issue_size_mn: num(sizeMn),
        market_price_per_100: num(sdPrice, 100),
        call_schedule: calls.map((c) => ({ years_from_observation: parseInt(c.yr, 10), call_price: num(c.px, 100) })),
      }, { timeout: 20000 });
      setSdc({ status: 'live', data, error: null });
    } catch (e) { setSdc({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [effPmiss, couponPct, stepUpBp, sdDownBp, targetYear, obsDate, tenorY, discPct, sizeMn, sdPrice, calls]);

  // ── 3) Historical-trajectory calibration ──────────────────────────────────
  const [hist, setHist] = useState([
    { id: 1, year: 2021, value: 365 }, { id: 2, year: 2022, value: 348 },
    { id: 3, year: 2023, value: 320 }, { id: 4, year: 2024, value: 301 },
    { id: 5, year: 2025, value: 288 },
  ]);
  const [blendW, setBlendW] = useState(0.5);
  const [hcal, setHcal] = useState({ status: 'idle', data: null, error: null });
  const updHist = (id, key, v) => setHist((prev) => prev.map((h) => (h.id === id ? { ...h, [key]: v } : h)));
  const addHist = () => setHist((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((h) => h.id)) + 1 : 1, year: 2026, value: 280 }]);
  const rmHist = (id) => setHist((prev) => prev.filter((h) => h.id !== id));

  const runHistory = useCallback(async () => {
    setHcal({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        history: hist.map((h) => ({ year: parseInt(h.year, 10), value: num(h.value) })),
        spt_target_year: parseInt(targetYear, 10), spt_target_value: num(targetValue),
        sector, logistic: logisticPayload(), blend_weight_history: num(blendW, 0.5),
      };
      if (slopeOverride !== '' && !isNaN(parseFloat(slopeOverride))) payload.pathway_slope_pct_per_yr = parseFloat(slopeOverride);
      const { data } = await axios.post('/api/v1/slb-structuring/calibrate-history', payload, { timeout: 20000 });
      setHcal({ status: 'live', data, error: null });
    } catch (e) { setHcal({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [hist, targetYear, targetValue, sector, slopeOverride, blendW, logisticPayload]);

  // ── 4) Ambition analytics (cost-of-ambition, greenium×step-up, MACC) ─────
  const [greeniumBp, setGreeniumBp] = useState(-4);
  const [baseEmisT, setBaseEmisT] = useState(2500000);
  const [capexMn, setCapexMn] = useState(120);
  const [macc, setMacc] = useState(DEFAULT_MACC);
  const [amb, setAmb] = useState({ status: 'idle', data: null, error: null });
  const updMacc = (id, key, v) => setMacc((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: v } : m)));
  const addMacc = () => setMacc((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((m) => m.id)) + 1 : 1, name: 'New measure', cost: 50, kt: 50 }]);
  const rmMacc = (id) => setMacc((prev) => prev.filter((m) => m.id !== id));

  const runAmbition = useCallback(async () => {
    setAmb({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        baseline_year: parseInt(baselineYear, 10), baseline_value: num(baselineValue),
        spt_target_year: parseInt(targetYear, 10), spt_target_value: num(targetValue),
        sector, coupon_step_up_bp: num(stepUpBp), observation_date: obsDate,
        bond_tenor_years: parseInt(tenorY, 10), discount_rate_pct: num(discPct),
        issue_size_mn: num(sizeMn), logistic: logisticPayload(),
        greenium_bp: num(greeniumBp), base_annual_emissions_t: num(baseEmisT),
        capex_budget_mn: num(capexMn),
        macc_measures: macc.map((m) => ({ name: m.name || 'measure', cost_usd_per_t: num(m.cost), abatement_kt_per_yr: Math.max(num(m.kt), 0.001) })),
      };
      if (slopeOverride !== '' && !isNaN(parseFloat(slopeOverride))) payload.pathway_slope_pct_per_yr = parseFloat(slopeOverride);
      const { data } = await axios.post('/api/v1/slb-structuring/ambition-analytics', payload, { timeout: 25000 });
      setAmb({ status: 'live', data, error: null });
    } catch (e) { setAmb({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [baselineYear, baselineValue, targetYear, targetValue, sector, stepUpBp, obsDate, tenorY,
    discPct, sizeMn, greeniumBp, baseEmisT, capexMn, macc, slopeOverride, logisticPayload]);

  // ── 5) SPO pre-assessment ─────────────────────────────────────────────────
  const [spoGap, setSpoGap] = useState('');
  const [spoHistYrs, setSpoHistYrs] = useState(5);
  const [spoFlags, setSpoFlags] = useState({
    kpi_core_business: true, kpi_measurable: true, kpi_externally_verifiable: true, kpi_benchmarkable: true,
    spt_beyond_bau: true, observation_dates_defined: true,
    annual_external_verification: true, qualified_reviewer: true, verification_public: true, pre_issuance_spo_planned: true,
    step_up_meaningful: true, fallback_mechanisms_defined: false, annual_reporting: true,
  });
  const [spoRes, setSpoRes] = useState({ status: 'idle', data: null, error: null });
  const flag = (k, label) => (
    <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11.5, color: spoFlags[k] ? T.navy : T.sub, border: `1px solid ${spoFlags[k] ? T.teal : T.border}`, background: spoFlags[k] ? T.teal + '11' : '#fff', borderRadius: 14, padding: '4px 10px', cursor: 'pointer', fontWeight: spoFlags[k] ? 700 : 500 }}>
      <input type="checkbox" checked={!!spoFlags[k]} onChange={(e) => setSpoFlags((p) => ({ ...p, [k]: e.target.checked }))} /> {label}
    </label>
  );

  const runSpo = useCallback(async () => {
    setSpoRes({ status: 'loading', data: null, error: null });
    try {
      const gap = spoGap !== '' && !isNaN(parseFloat(spoGap)) ? parseFloat(spoGap)
        : (calib.data?.ambition?.ambition_gap_pp_per_yr ?? null);
      if (gap == null) throw new Error('run Calibrate first (or type the ambition gap)');
      const { data } = await axios.post('/api/v1/slb-structuring/spo-preassessment', {
        ...spoFlags, ambition_gap_pp_per_yr: gap, history_years_disclosed: parseInt(spoHistYrs, 10) || 0,
      }, { timeout: 15000 });
      setSpoRes({ status: 'live', data, error: null });
    } catch (e) { setSpoRes({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [spoFlags, spoGap, spoHistYrs, calib.data]);

  const d = calib.data;
  const verdict = d?.ambition?.verdict;
  const vs = verdict ? VERDICT_STYLE[verdict] : null;
  const su = d?.step_up_valuation;

  const md = multi.data;
  const sd = sdc.data;
  const hd = hcal.data;
  const ad = amb.data;
  const pd = spoRes.data;

  const sectorOptions = pathways.data?.pathways || [{ sector: 'power_generation', label: 'Power generation', slope_pct_per_yr: 7.0 }];

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-05</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>SLB Structurer — Multi-KPI Calibration, Step-Up/Step-Down & Ambition Economics</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Sector Pathways</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Digital-Option Step-Up</span>
          <span style={{ background: T.indigo + '22', color: T.indigo, border: `1px solid ${T.indigo}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Multi-KPI + Call</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>ICMA SLB Principles</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1120 }}>
        Full SLB structuring desk: single- and multi-KPI SPT calibration against cited sector decarbonization pathways,
        probability-weighted step-up/step-down valuation with an exposed logistic miss-probability model, issuer-call
        interaction (call-to-avoid-step-up incentive), a data-driven p(miss) from the issuer's own KPI history (OLS trend,
        visible blend weights), cost-of-ambition and greenium×step-up economics with a MACC-linked capex sensitivity, and
        a structured SPO pre-assessment. All math runs in the backend engine — documented closed-form, no simulation.
      </div>

      {/* ── Inputs ──────────────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>KPI / SPT & Bond Terms</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/slb-structuring/calibrate</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={calib.status} demoText={calib.error} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 12, marginBottom: 10 }}>
          <div><Lbl>KPI</Lbl><input style={inputStyle} value={kpiName} onChange={(e) => setKpiName(e.target.value)} /></div>
          <div><Lbl>Unit</Lbl><input style={inputStyle} value={kpiUnit} onChange={(e) => setKpiUnit(e.target.value)} /></div>
          <div><Lbl>Baseline year</Lbl><input type="number" style={inputStyle} value={baselineYear} onChange={(e) => setBaselineYear(e.target.value)} /></div>
          <div><Lbl>Baseline value</Lbl><input type="number" style={inputStyle} value={baselineValue} onChange={(e) => setBaselineValue(e.target.value)} /></div>
          <div><Lbl>SPT target year</Lbl><input type="number" style={inputStyle} value={targetYear} onChange={(e) => setTargetYear(e.target.value)} /></div>
          <div><Lbl>SPT target value</Lbl><input type="number" style={inputStyle} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} /></div>
          <div><Lbl>Sector pathway</Lbl>
            <select style={inputStyle} value={sector} onChange={(e) => setSector(e.target.value)}>
              {sectorOptions.map((p) => (
                <option key={p.sector} value={p.sector}>{p.label} (−{p.slope_pct_per_yr}%/yr)</option>
              ))}
            </select>
          </div>
          <div><Lbl>Slope override (%/yr, blank = table)</Lbl><input type="number" step="0.1" style={inputStyle} value={slopeOverride} onChange={(e) => setSlopeOverride(e.target.value)} placeholder="use table" /></div>
          <div><Lbl>Coupon step-up (bp)</Lbl><input type="number" style={inputStyle} value={stepUpBp} onChange={(e) => setStepUpBp(e.target.value)} /></div>
          <div><Lbl>Observation date</Lbl><input type="date" style={inputStyle} value={obsDate} onChange={(e) => setObsDate(e.target.value)} /></div>
          <div><Lbl>Remaining tenor (yrs)</Lbl><input type="number" style={inputStyle} value={tenorY} onChange={(e) => setTenorY(e.target.value)} /></div>
          <div><Lbl>Coupon (%)</Lbl><input type="number" step="0.05" style={inputStyle} value={couponPct} onChange={(e) => setCouponPct(e.target.value)} /></div>
          <div><Lbl>Size (mn)</Lbl><input type="number" style={inputStyle} value={sizeMn} onChange={(e) => setSizeMn(e.target.value)} /></div>
          <div><Lbl>Discount rate (%)</Lbl><input type="number" step="0.05" style={inputStyle} value={discPct} onChange={(e) => setDiscPct(e.target.value)} /></div>
        </div>
        <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 6 }}>
            p(miss) logistic model — MODEL ASSUMPTION, all four parameters exposed and editable:
            p_miss = p_floor + (p_cap − p_floor) / (1 + exp(−(gap − midpoint)/slope))
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div><Lbl>p_floor</Lbl><input type="number" step="0.01" min="0" max="1" style={inputStyle} value={pFloor} onChange={(e) => setPFloor(e.target.value)} /></div>
            <div><Lbl>p_cap</Lbl><input type="number" step="0.01" min="0" max="1" style={inputStyle} value={pCap} onChange={(e) => setPCap(e.target.value)} /></div>
            <div><Lbl>midpoint (pp/yr)</Lbl><input type="number" step="0.1" style={inputStyle} value={midPp} onChange={(e) => setMidPp(e.target.value)} /></div>
            <div><Lbl>slope (pp/yr)</Lbl><input type="number" step="0.05" min="0.05" style={inputStyle} value={slopePp} onChange={(e) => setSlopePp(e.target.value)} /></div>
          </div>
        </div>
        <RunBtn onClick={runCalibrate}>Calibrate SLB →</RunBtn>
        {calib.status === 'demo' && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>Engine error — no figures shown (this page never fabricates results): {String(calib.error)}</div>}
      </Card>

      {/* ── Calibrate results ───────────────────────────────────────────── */}
      {calib.status === 'live' && d && (
        <>
          {/* Ambition */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Ambition Assessment</h2>
              {vs && <span style={{ background: vs.bg, color: vs.fg, padding: '4px 14px', borderRadius: 14, fontSize: 12, fontWeight: 800, fontFamily: T.mono }}>{vs.label}</span>}
              <div style={{ marginLeft: 'auto' }}><Badge status="live" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="SPT implied reduction" value={fmtPct(d.ambition.spt_implied_annual_reduction_pct)} sub="geometric (CAGR) %/yr, baseline → SPT" color={T.teal} />
              <Kpi label="Sector pathway slope" value={fmtPct(d.ambition.sector_pathway_slope_pct)} sub={d.ambition.pathway_slope_source} color={T.blue} />
              <Kpi label="Ambition gap" value={`${d.ambition.ambition_gap_pp_per_yr > 0 ? '+' : ''}${fmtNum(d.ambition.ambition_gap_pp_per_yr)} pp/yr`} sub={`bands: ${d.ambition.verdict_bands.aligned}`} color={vs ? vs.fg : T.navy} />
              <Kpi label="On-track KPI today" value={d.on_track_check.on_track_kpi_value != null ? fmtNum(d.on_track_check.on_track_kpi_value) : '—'} sub={`${kpiUnit} @ ${d.on_track_check.observation_date}`} />
            </div>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 6, padding: '8px 10px', marginBottom: 14 }}>
              {d.ambition.math}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>KPI trajectory — issuer baseline→SPT path vs sector pathway ({kpiUnit})</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => `${fmtNum(v)} ${kpiUnit}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="issuer_target_path" name="Issuer baseline → SPT" stroke={T.teal} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="sector_pathway_path" name="Sector pathway (same baseline)" stroke={T.slate} strokeWidth={2} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Step-up valuation */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Coupon Step-Up Valuation</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>p(miss) is a labeled model assumption — parameters above</span>
              <div style={{ marginLeft: 'auto' }}><Badge status="live" /></div>
            </div>
            <div style={{ fontSize: 11.5, fontFamily: T.mono, color: T.navy, background: T.cream, borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
              {su.formula} · window: {su.step_up_window_rule}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="p(miss)" value={fmtNum(su.p_miss, 4)} sub={d.probability_of_miss.monotonicity.slice(0, 60) + '…'} color={T.purple} />
              <Kpi label="Step-up" value={fmtBp(su.step_up_bp, 0)} sub={`discount rate ${fmtPct(su.discount_rate_pct)}`} />
              <Kpi label="Annuity (step-up window)" value={fmtNum(su.annuity_factor_step_up_window, 4)} sub={`full life: ${fmtNum(su.annuity_factor_full_life, 4)}`} />
              <Kpi label="PV per 100 face" value={fmtNum(su.pv_per_100_face, 4)} sub={`= ${fmtNum(su.p_miss, 3)} × ${fmtNum(su.step_up_bp / 100, 3)} × ${fmtNum(su.annuity_factor_step_up_window, 3)}`} color={T.teal} />
              <Kpi label="Value (mn)" value={fmtNum(su.value_mn, 3)} sub={`on ${fmtNum(sizeMn, 0)}mn`} color={T.navy} />
              <Kpi label="BPV of SLB feature" value={fmtBp(su.bp_running_equivalent)} sub="running-spread equivalent, full life" color={T.indigo} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Period-by-period expected step-up cash flows (per 100 face)</div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.2, minWidth: 340 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={su.schedule}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="payment_calendar_year" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <ReferenceLine x={d.inputs.spt_target_year} stroke={T.gold} strokeDasharray="4 3" label={{ value: 'SPT obs', fontSize: 9, fill: T.amber }} />
                    <Bar dataKey="pv_expected_step_up_per_100" name="PV expected step-up / 100" radius={[3, 3, 0, 0]}>
                      {su.schedule.map((row, i) => <Cell key={i} fill={row.in_step_up_window ? T.purple : T.border} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.4, minWidth: 380, maxHeight: 240, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Period</th><th style={th}>Pay year</th><th style={th}>DF</th><th style={th}>In window</th><th style={th}>E[step-up]/100</th><th style={th}>PV/100</th></tr>
                  </thead>
                  <tbody>
                    {su.schedule.map((row) => (
                      <tr key={row.period}>
                        <td style={{ ...td, fontFamily: T.mono }}>{row.period}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{row.payment_calendar_year}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(row.discount_factor, 4)}</td>
                        <td style={{ ...td, color: row.in_step_up_window ? T.purple : T.sub, fontWeight: 700 }}>{row.in_step_up_window ? 'yes' : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(row.expected_step_up_cash_per_100, 4)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(row.pv_expected_step_up_per_100, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── 1) Multi-KPI structuring ────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Multi-KPI Structure — Independent vs Joint Trigger</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/slb-structuring/structure-multi</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={multi.status} demoText={multi.error} /></div>
        </div>
        <ModelNote>
          Up to 3 KPIs, each with its own SPT, pathway and step-up. Independent mode sums the per-KPI probability-weighted
          step-up values; joint mode applies the FULL combined step-up only if ALL KPIs are missed, with
          p_joint = ∏ p(miss)ᵢ under a documented INDEPENDENCE ASSUMPTION (real KPIs are typically positively correlated —
          the product is a stated lower bound). Increasing KPIs (e.g. renewable share) are entered as their declining
          residual (100 − share), stated convention.
        </ModelNote>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 960, borderCollapse: 'collapse', marginBottom: 10 }}>
            <thead>
              <tr><th style={th}>On</th><th style={th}>KPI</th><th style={th}>Unit</th><th style={th}>Base yr</th><th style={th}>Base val</th><th style={th}>SPT yr</th><th style={th}>SPT val</th><th style={th}>Sector pathway</th><th style={th}>Step-up (bp)</th></tr>
            </thead>
            <tbody>
              {mkpis.map((k, i) => (
                <tr key={i} style={{ opacity: k.on ? 1 : 0.45 }}>
                  <td style={td}><input type="checkbox" checked={k.on} onChange={(e) => updMk(i, 'on', e.target.checked)} /></td>
                  <td style={{ ...td, minWidth: 200 }}><input style={inputStyle} value={k.name} onChange={(e) => updMk(i, 'name', e.target.value)} /></td>
                  <td style={{ ...td, minWidth: 110 }}><input style={inputStyle} value={k.unit} onChange={(e) => updMk(i, 'unit', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 70 }} value={k.by} onChange={(e) => updMk(i, 'by', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 80 }} value={k.bv} onChange={(e) => updMk(i, 'bv', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 70 }} value={k.ty} onChange={(e) => updMk(i, 'ty', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 80 }} value={k.tv} onChange={(e) => updMk(i, 'tv', e.target.value)} /></td>
                  <td style={{ ...td, minWidth: 170 }}>
                    <select style={inputStyle} value={k.sector} onChange={(e) => updMk(i, 'sector', e.target.value)}>
                      {sectorOptions.map((p) => <option key={p.sector} value={p.sector}>{p.label}</option>)}
                    </select>
                  </td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 70 }} value={k.step} onChange={(e) => updMk(i, 'step', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: T.navy, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={jointOn} onChange={(e) => setJointOn(e.target.checked)} />
            Joint trigger (full combined step-up only if ALL KPIs missed)
          </label>
          <RunBtn onClick={runMulti}>Value multi-KPI structure →</RunBtn>
        </div>
        {multi.status === 'demo' && <div style={{ fontSize: 12, color: T.red }}>Engine error: {String(multi.error)}</div>}
        {multi.status === 'live' && md && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Independent Σ PV/100" value={fmtNum(md.combined_independent.pv_per_100_face, 4)} sub={`${fmtNum(md.combined_independent.value_mn, 2)} mn · ${fmtBp(md.combined_independent.bp_running_equivalent)}`} color={T.teal} />
              <Kpi label={`Joint PV/100 ${md.combined_joint.enabled ? '(selected)' : '(shown for reference)'}`} value={fmtNum(md.combined_joint.pv_per_100_face, 4)} sub={`p_joint ${fmtNum(md.combined_joint.p_joint, 4)} · ${fmtBp(md.combined_joint.bp_running_equivalent)}`} color={T.purple} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckChip ok={!!md.structural_check?.joint_leq_sum_of_independent} label="joint ≤ Σ independent" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.5, minWidth: 420, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>KPI</th><th style={th}>Reqd %/yr</th><th style={th}>Gap pp/yr</th><th style={th}>Verdict</th><th style={th}>p(miss)</th><th style={th}>Step (bp)</th><th style={th}>PV/100</th><th style={th}>bp equiv</th></tr></thead>
                  <tbody>
                    {md.per_kpi.map((k, i) => {
                      const kv = VERDICT_STYLE[k.verdict] || {};
                      return (
                        <tr key={i}>
                          <td style={{ ...td, fontWeight: 700, color: T.navy }}>{k.kpi_name}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(k.spt_implied_annual_reduction_pct, 2)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{k.ambition_gap_pp_per_yr > 0 ? '+' : ''}{fmtNum(k.ambition_gap_pp_per_yr, 2)}</td>
                          <td style={td}><span style={{ background: kv.bg, color: kv.fg, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>{k.verdict}</span></td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(k.p_miss, 4)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(k.step_up_bp, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(k.pv_per_100_face, 4)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(k.bp_running_equivalent, 2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Per-KPI PV vs combined (per 100 face)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    ...md.per_kpi.map((k) => ({ name: k.kpi_name.slice(0, 18), pv: k.pv_per_100_face })),
                    { name: 'Σ independent', pv: md.combined_independent.pv_per_100_face },
                    { name: 'Joint (all missed)', pv: md.combined_joint.pv_per_100_face },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 8.5 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmtNum(v, 4)} />
                    <Bar dataKey="pv" name="PV / 100" radius={[3, 3, 0, 0]}>
                      {[...md.per_kpi.map(() => T.blue), T.teal, T.purple].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>{md.combined_joint.assumption}</div>
          </>
        )}
      </Card>

      {/* ── 2) Step-down + call interaction ─────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Step-Down Structure & Issuer Call Interaction</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/slb-structuring/step-down-call</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={sdc.status} demoText={sdc.error} /></div>
        </div>
        <ModelNote>
          Two-way structure: E[cost]/100 = p·(up/100)·A_w − (1−p)·(down/100)·A_w. Call analysis: yield-to-call is solved by
          bisection on the STEPPED coupon path (conditional on a miss) at each call date and compared to stepped-path YTM;
          the call-to-avoid-step-up incentive is p(miss) × [PV of stepped coupons avoided after the call − call premium PV],
          refinancing at the unchanged base yield (stated simplification).
        </ModelNote>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 10 }}>
          <div><Lbl>p(miss) — blank = from calibrate</Lbl><input type="number" step="0.01" min="0" max="1" style={inputStyle} value={sdPmiss} placeholder={calib.data ? `auto: ${fmtNum(calib.data.probability_of_miss.p_miss, 4)}` : 'run calibrate'} onChange={(e) => setSdPmiss(e.target.value)} /></div>
          <div><Lbl>Step-DOWN if SPT met (bp)</Lbl><input type="number" style={inputStyle} value={sdDownBp} onChange={(e) => setSdDownBp(e.target.value)} /></div>
          <div><Lbl>Market price / 100</Lbl><input type="number" step="0.05" style={inputStyle} value={sdPrice} onChange={(e) => setSdPrice(e.target.value)} /></div>
          <div style={{ alignSelf: 'end' }}><RunBtn onClick={runStepDownCall}>Value step-down + calls →</RunBtn></div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <Lbl>Issuer call schedule (years from observation date, on coupon dates)</Lbl>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {calls.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 8px', background: T.cream }}>
                <span style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>yr</span>
                <input type="number" style={{ ...inputStyle, width: 56 }} value={c.yr} onChange={(e) => updCall(c.id, 'yr', e.target.value)} />
                <span style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>@</span>
                <input type="number" step="0.25" style={{ ...inputStyle, width: 72 }} value={c.px} onChange={(e) => updCall(c.id, 'px', e.target.value)} />
                <button onClick={() => rmCall(c.id)} style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ))}
            <button onClick={addCall} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 14px' }}>+ Add call date</button>
          </div>
        </div>
        {sdc.status === 'demo' && <div style={{ fontSize: 12, color: T.red }}>Engine error: {String(sdc.error)}</div>}
        {sdc.status === 'live' && sd && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="PV step-up cost / 100" value={fmtNum(sd.expected_cost.pv_step_up_cost_per_100, 4)} sub="p × (up/100) × A_w" color={T.red} />
              <Kpi label="PV step-down benefit / 100" value={fmtNum(sd.expected_cost.pv_step_down_benefit_per_100, 4)} sub="(1−p) × (down/100) × A_w" color={T.green} />
              <Kpi label="Net expected cost / 100" value={fmtNum(sd.expected_cost.net_expected_cost_per_100, 4)} sub={`${fmtNum(sd.expected_cost.net_cost_mn, 3)} mn on ${fmtNum(sizeMn, 0)}mn`} color={T.navy} />
              <Kpi label="Stepped-path YTM" value={fmtPct(sd.call_analysis.yield_to_maturity_stepped_pct)} sub="bisection, conditional on a miss" color={T.indigo} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckChip ok={!!sd.expected_cost.structural_check?.step_down_reduces_cost_vs_step_up_only} label="step-down ≤ step-up-only cost" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Coupon paths (%) — expected vs stepped (miss) path</div>
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={sd.coupon_paths}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="payment_calendar_year" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip formatter={(v) => fmtPct(v, 3)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine x={parseInt(targetYear, 10)} stroke={T.gold} strokeDasharray="4 3" label={{ value: 'SPT obs', fontSize: 9, fill: T.amber }} />
                    <Line type="stepAfter" dataKey="expected_coupon_pct" name="Expected coupon (two-way)" stroke={T.teal} strokeWidth={2.5} dot={false} />
                    <Line type="stepAfter" dataKey="stepped_coupon_pct" name="Stepped coupon (miss)" stroke={T.red} strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Call-to-avoid-step-up incentive by call date (per 100 face)</div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={sd.call_analysis.calls}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="years_from_observation" tick={{ fontSize: 10 }} label={{ value: 'Call date (yrs)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmtNum(v, 4)} />
                    <ReferenceLine y={0} stroke={T.slate} />
                    <Bar dataKey="call_to_avoid_step_up_incentive_per_100" name="Incentive / 100" radius={[3, 3, 0, 0]}>
                      {sd.call_analysis.calls.map((c, i) => <Cell key={i} fill={c.call_to_avoid_step_up_incentive_per_100 > 0 ? T.amber : T.slate} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead><tr><th style={th}>Call yr</th><th style={th}>Call price</th><th style={th}>YTC stepped (%)</th><th style={th}>YTM stepped (%)</th><th style={th}>YTC − YTM (bp)</th><th style={th}>Stepped annuity after call</th><th style={th}>Incentive / 100</th><th style={th}>Incentive (mn)</th></tr></thead>
                <tbody>
                  {sd.call_analysis.calls.map((c, i) => (
                    <tr key={i} style={sd.call_analysis.best_call && c.years_from_observation === sd.call_analysis.best_call.years_from_observation ? { background: T.gold + '22' } : undefined}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{c.years_from_observation}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.call_price, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.yield_to_call_stepped_pct, 3)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.yield_to_maturity_stepped_pct, 3)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: c.ytc_minus_ytm_bp >= 0 ? T.amber : T.teal }}>{c.ytc_minus_ytm_bp > 0 ? '+' : ''}{fmtNum(c.ytc_minus_ytm_bp, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.stepped_annuity_after_call, 4)}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: c.call_to_avoid_step_up_incentive_per_100 > 0 ? T.amber : T.slate }}>{fmtNum(c.call_to_avoid_step_up_incentive_per_100, 4)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.incentive_value_mn, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub }}>{sd.call_analysis.reading}</div>
          </>
        )}
      </Card>

      {/* ── 3) Historical-trajectory calibration ─────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Historical-Trajectory Test — Data-Driven p(miss)</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/slb-structuring/calibrate-history</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={hcal.status} demoText={hcal.error} /></div>
        </div>
        <ModelNote>
          OLS on ln(KPI) vs year over the issuer's ACTUAL history → trend extrapolation to the SPT year with the standard
          OLS prediction std error; p_history = Φ((ln extrap − ln SPT)/s_proj) under a log-normal residual assumption.
          Blended with the logistic ambition mapping at a VISIBLE user weight: p_blend = w·p_history + (1−w)·p_logistic.
        </ModelNote>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ minWidth: 300 }}>
            <Lbl>Actual KPI history ({kpiUnit}) — ≥3 points, 5yr typical</Lbl>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Year</th><th style={th}>Value</th><th style={{ ...th, width: 36 }} /></tr></thead>
              <tbody>
                {hist.map((h) => (
                  <tr key={h.id}>
                    <td style={td}><input type="number" style={{ ...inputStyle, width: 84 }} value={h.year} onChange={(e) => updHist(h.id, 'year', e.target.value)} /></td>
                    <td style={td}><input type="number" style={{ ...inputStyle, width: 96 }} value={h.value} onChange={(e) => updHist(h.id, 'value', e.target.value)} /></td>
                    <td style={td}><button onClick={() => rmHist(h.id)} style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12 }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addHist} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginTop: 8 }}>+ Add year</button>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Lbl>Blend weight on p_history: {fmtNum(num(blendW), 2)} (logistic gets {fmtNum(1 - num(blendW), 2)})</Lbl>
            <input type="range" min="0" max="1" step="0.05" value={blendW} onChange={(e) => setBlendW(e.target.value)} style={{ width: '100%', maxWidth: 340 }} />
            <div style={{ fontSize: 11, color: T.sub, marginTop: 6, marginBottom: 12 }}>
              SPT: {fmtNum(num(targetValue))} {kpiUnit} by {targetYear} · sector pathway & logistic parameters from the main inputs above.
            </div>
            <RunBtn onClick={runHistory}>Run trajectory test →</RunBtn>
            {hcal.status === 'demo' && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>Engine error: {String(hcal.error)}</div>}
          </div>
        </div>
        {hcal.status === 'live' && hd && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Historical trend" value={`${hd.trend.trend_pct_per_yr > 0 ? '+' : ''}${fmtNum(hd.trend.trend_pct_per_yr, 2)}%/yr`} sub={`ln-OLS on ${hd.trend.n_points} points · R² ${fmtNum(hd.trend.r_squared, 3)}`} color={T.blue} />
              <Kpi label={`Extrapolated ${hd.extrapolation.target_year}`} value={fmtNum(hd.extrapolation.extrapolated_kpi)} sub={`vs SPT ${fmtNum(hd.extrapolation.spt_target_value)} → gap ${fmtNum(hd.extrapolation.gap_vs_spt_pct, 1)}%`} color={T.navy} />
              <Kpi label="p(miss) — history" value={fmtNum(hd.probability_of_miss.p_history, 4)} sub="Φ((ln extrap − ln SPT)/s_proj)" color={T.indigo} />
              <Kpi label="p(miss) — logistic" value={fmtNum(hd.probability_of_miss.p_logistic, 4)} sub={`gap ${fmtNum(hd.probability_of_miss.p_logistic_basis.ambition_gap_pp_per_yr, 2)} pp/yr (${hd.probability_of_miss.p_logistic_basis.verdict})`} color={T.purple} />
              <Kpi label="p(miss) — BLENDED" value={fmtNum(hd.probability_of_miss.blend.p_blended, 4)} sub={`w_hist ${fmtNum(hd.probability_of_miss.blend.weight_history, 2)} / w_logistic ${fmtNum(hd.probability_of_miss.blend.weight_logistic, 2)} — visible`} color={T.teal} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>History, ln-OLS trend & ±1 prediction-SE band → SPT ({kpiUnit})</div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={hd.series}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => `${fmtNum(v)} ${kpiUnit}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="actual" name="Actual KPI" stroke={T.navy} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="trend" name="ln-OLS trend / extrapolation" stroke={T.teal} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="band_hi" name="+1 pred SE" stroke={T.gold} strokeWidth={1} strokeDasharray="4 3" dot={false} connectNulls />
                <Line type="monotone" dataKey="band_lo" name="−1 pred SE" stroke={T.gold} strokeWidth={1} strokeDasharray="4 3" dot={false} connectNulls />
                <ReferenceDot x={hd.extrapolation.target_year} y={hd.extrapolation.spt_target_value} r={6} fill={T.red} stroke="#fff" label={{ value: 'SPT', fontSize: 10, fill: T.red, position: 'top' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>

      {/* ── 4) Ambition economics: cost-of-ambition, greenium×step-up, MACC ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Ambition Economics — Cost-of-Ambition, Greenium × Step-Up, Capex / MACC Link</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/slb-structuring/ambition-analytics</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={amb.status} demoText={amb.error} /></div>
        </div>
        <ModelNote>
          Sustainability × financial overlay. Capex→trajectory convention (stated): merit-order MACC allocation of the
          annualized budget → funded abatement A (tCO2e/yr); funded_reduction_pp = (A / base emissions × 100) / years-to-target;
          residual_gap = ambition gap − funded_pp; p_miss_eff = logistic(residual_gap). Planning approximation, not an
          engineering model. MACC measures below are editable planning inputs, hand-authored defaults.
        </ModelNote>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 10 }}>
          <div><Lbl>Greenium earned by label (bp, − = tighter)</Lbl><input type="number" step="0.5" style={inputStyle} value={greeniumBp} onChange={(e) => setGreeniumBp(e.target.value)} /></div>
          <div><Lbl>Base annual emissions (tCO2e/yr)</Lbl><input type="number" style={inputStyle} value={baseEmisT} onChange={(e) => setBaseEmisT(e.target.value)} /></div>
          <div><Lbl>Decarb capex budget (mn/yr, annualized)</Lbl><input type="number" style={inputStyle} value={capexMn} onChange={(e) => setCapexMn(e.target.value)} /></div>
          <div style={{ alignSelf: 'end' }}><RunBtn onClick={runAmbition}>Run ambition analytics →</RunBtn></div>
        </div>
        <div style={{ marginBottom: 10, overflowX: 'auto' }}>
          <Lbl>Abatement measures (MACC) — $/tCO2e vs ktCO2e/yr, user-editable</Lbl>
          <table style={{ borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th style={th}>Measure</th><th style={th}>Cost ($/tCO2e)</th><th style={th}>Potential (kt/yr)</th><th style={{ ...th, width: 36 }} /></tr></thead>
            <tbody>
              {macc.map((m) => (
                <tr key={m.id}>
                  <td style={{ ...td, minWidth: 240 }}><input style={inputStyle} value={m.name} onChange={(e) => updMacc(m.id, 'name', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 100 }} value={m.cost} onChange={(e) => updMacc(m.id, 'cost', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 100 }} value={m.kt} onChange={(e) => updMacc(m.id, 'kt', e.target.value)} /></td>
                  <td style={td}><button onClick={() => rmMacc(m.id)} style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12 }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addMacc} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginTop: 8 }}>+ Add measure</button>
        </div>
        {amb.status === 'demo' && <div style={{ fontSize: 12, color: T.red }}>Engine error: {String(amb.error)}</div>}
        {amb.status === 'live' && ad && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Step-up cost @ actual SPT" value={fmtBp(ad.greenium_vs_step_up.at_actual_spt.step_up_bp_equivalent)} sub={`p(miss) ${fmtNum(ad.greenium_vs_step_up.at_actual_spt.p_miss, 4)} · gap ${fmtNum(ad.greenium_vs_step_up.at_actual_spt.ambition_gap_pp_per_yr, 2)} pp/yr`} color={T.red} />
              <Kpi label="Greenium" value={fmtBp(ad.greenium_vs_step_up.greenium_bp, 1)} sub="label funding benefit (input)" color={T.green} />
              <Kpi label="Net label economics" value={fmtBp(ad.greenium_vs_step_up.net_label_economics_bp)} sub={ad.greenium_vs_step_up.net_label_economics_bp <= 0 ? 'label SAVES money in expectation' : 'contingent step-up outweighs greenium'} color={ad.greenium_vs_step_up.net_label_economics_bp <= 0 ? T.green : T.amber} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckChip ok={!!ad.capex_sensitivity.structural_check?.p_miss_monotonically_nonincreasing_in_capex} label="p(miss) ↓ monotonically in capex" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Cost-of-ambition curve — step-up cost (bp equiv, left) & p(miss) (right) vs SPT stringency</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={ad.cost_of_ambition.sweep}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="target_vs_baseline_pct" tick={{ fontSize: 10 }} label={{ value: 'SPT as % of baseline (tighter →)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis yAxisId="bp" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="p" orientation="right" domain={[0, 1]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="bp" type="monotone" dataKey="step_up_bp_equivalent" name="Step-up cost (bp equiv)" stroke={T.red} strokeWidth={2.5} dot={false} />
                    <Line yAxisId="p" type="monotone" dataKey="p_miss" name="p(miss)" stroke={T.purple} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Capex sensitivity — funded MACC abatement lowers residual gap → p(miss)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={ad.capex_sensitivity.curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="capex_mn_per_yr" tick={{ fontSize: 10 }} label={{ value: 'Capex (mn/yr)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis yAxisId="p" domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="kt" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="kt" dataKey="funded_abatement_kt_per_yr" name="Funded abatement (kt/yr)" fill={T.teal + '55'} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="p" type="monotone" dataKey="p_miss_effective" name="p(miss) effective" stroke={T.purple} strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>MACC — merit-order abatement cost curve ($/tCO2e, sorted; tooltip shows cumulative kt)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ad.macc.curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 8.5 }} interval={0} angle={-12} height={48} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                        <b>{payload[0].payload.name}</b><br />
                        {fmtNum(payload[0].payload.cost_usd_per_t, 0)} $/tCO2e · {fmtNum(payload[0].payload.abatement_kt_per_yr, 0)} kt/yr<br />
                        cumulative: {fmtNum(payload[0].payload.cum_from_kt, 0)}–{fmtNum(payload[0].payload.cum_to_kt, 0)} kt/yr
                      </div>
                    ) : null} />
                    <ReferenceLine y={0} stroke={T.slate} />
                    <Bar dataKey="cost_usd_per_t" name="$/tCO2e" radius={[3, 3, 0, 0]}>
                      {ad.macc.curve.map((m, i) => <Cell key={i} fill={m.cost_usd_per_t <= 0 ? T.green : T.navy} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 340, overflowX: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Budget allocation at full capex ({fmtNum(num(capexMn), 0)} mn/yr) — merit order</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Measure</th><th style={th}>$/t</th><th style={th}>Potential kt</th><th style={th}>Funded kt</th><th style={th}>Spend (mn)</th></tr></thead>
                  <tbody>
                    {ad.macc.allocation_at_full_budget.steps.map((s, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 700, color: T.navy }}>{s.name}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: s.cost_usd_per_t <= 0 ? T.green : T.slate }}>{fmtNum(s.cost_usd_per_t, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.potential_kt, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(s.funded_kt, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.spend_usd_mn, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                  Total funded: {fmtNum(ad.macc.allocation_at_full_budget.total_abatement_t_per_yr / 1000, 1)} kt/yr ·
                  budget left: {fmtNum(ad.macc.allocation_at_full_budget.budget_left_usd_mn, 2)} mn ·
                  {' '}{ad.macc.convention}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── 5) SPO pre-assessment ────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>SPO Pre-Assessment — Structured SLBP Screen → RAG</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/slb-structuring/spo-preassessment</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={spoRes.status} demoText={spoRes.error} /></div>
        </div>
        <ModelNote>
          Desk pre-screen against the ICMA SLBP five components using a STATED scoring convention (weights shown in the
          result) — not an SPO. Engage an accredited second-party-opinion provider for issuance.
        </ModelNote>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 10 }}>
          <div>
            <Lbl>Materiality — KPI selection (SLBP 1)</Lbl>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {flag('kpi_core_business', 'core & material to business')}
              {flag('kpi_measurable', 'measurable / consistent basis')}
              {flag('kpi_externally_verifiable', 'externally verifiable')}
              {flag('kpi_benchmarkable', 'benchmarkable')}
            </div>
          </div>
          <div>
            <Lbl>Ambition — SPT calibration (SLBP 2)</Lbl>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {flag('spt_beyond_bau', 'beyond business-as-usual')}
              {flag('observation_dates_defined', 'observation dates defined')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div><Lbl>Gap pp/yr (auto from calibrate)</Lbl><input type="number" step="0.01" style={{ ...inputStyle, width: 110 }} value={spoGap} placeholder="run calibrate" onChange={(e) => setSpoGap(e.target.value)} /></div>
              <div><Lbl>History yrs disclosed</Lbl><input type="number" min="0" style={{ ...inputStyle, width: 90 }} value={spoHistYrs} onChange={(e) => setSpoHistYrs(e.target.value)} /></div>
            </div>
          </div>
          <div>
            <Lbl>Verification plan (SLBP 5)</Lbl>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {flag('annual_external_verification', 'annual external verification')}
              {flag('qualified_reviewer', 'qualified reviewer')}
              {flag('verification_public', 'verification public')}
              {flag('pre_issuance_spo_planned', 'pre-issuance SPO planned')}
            </div>
          </div>
          <div>
            <Lbl>Structure & reporting (SLBP 3–4)</Lbl>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {flag('step_up_meaningful', 'step-up commensurate/meaningful')}
              {flag('fallback_mechanisms_defined', 'fallback mechanics defined')}
              {flag('annual_reporting', 'annual reporting')}
            </div>
          </div>
        </div>
        <RunBtn onClick={runSpo}>Score SPO readiness →</RunBtn>
        {spoRes.status === 'demo' && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>Engine error: {String(spoRes.error)}</div>}
        {spoRes.status === 'live' && pd && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 12px' }}>
              {Object.entries(pd.dimensions).map(([k, v]) => {
                const rs = RAG_STYLE[v.rag] || {};
                return (
                  <div key={k} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 170 }}>
                    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{k.replace('_', ' & ')} <span style={{ color: T.gold }}>w={pd.weights[k]}</span></div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color: T.navy }}>{fmtNum(v.score, 1)}</span>
                      <span style={{ background: rs.bg, color: rs.fg, padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{v.rag}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{v.basis}</div>
                  </div>
                );
              })}
              <div style={{ background: RAG_STYLE[pd.overall.rag]?.bg, border: `2px solid ${RAG_STYLE[pd.overall.rag]?.fg}44`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 170 }}>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Overall</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: T.mono, color: RAG_STYLE[pd.overall.rag]?.fg }}>{fmtNum(pd.overall.score, 1)} · {pd.overall.rag}</div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{pd.overall.thresholds}</div>
              </div>
            </div>
            {pd.priority_gaps?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 4 }}>Priority gaps</div>
                {pd.priority_gaps.map((g, i) => <div key={i} style={{ fontSize: 11.5, color: T.slate, padding: '2px 0' }}>→ {g}</div>)}
              </div>
            )}
            <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>{pd.disclaimer}</div>
          </>
        )}
      </Card>

      {/* ── Published step-up benchmarks (hand-authored, labeled) ────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Published SLB Step-Up Benchmarks</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/slb-structuring/ref/step-up-benchmarks</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={bench.status} demoText={bench.error} /></div>
        </div>
        {bench.data && (
          <>
            <ModelNote>{bench.data.label}</ModelNote>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Issuer</th><th style={th}>Year</th><th style={th}>Structure</th><th style={th}>Step (bp)</th><th style={th}>KPI</th><th style={th}>Note</th></tr></thead>
              <tbody>
                {bench.data.benchmarks.map((b, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 700, color: T.navy }}>{b.issuer}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{b.year}</td>
                    <td style={td}>{b.structure}</td>
                    <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: b.step_bp > 25 ? T.amber : T.slate }}>{b.step_bp}</td>
                    <td style={{ ...td, fontSize: 11 }}>{b.kpi}</td>
                    <td style={{ ...td, fontSize: 11 }}>{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {bench.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Benchmark reference unreachable: {String(bench.error)}</div>}
      </Card>

      {/* ── Sector pathway reference table ──────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Sector Decarbonization-Pathway Reference</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/slb-structuring/ref/pathways</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={pathways.status} demoText={pathways.error} /></div>
        </div>
        {pathways.data && (
          <>
            <div style={{ fontSize: 10.5, color: T.amber, background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginBottom: 10 }}>{pathways.data.label}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Sector</th><th style={th}>Slope (%/yr)</th><th style={th}>Benchmark metric</th><th style={th}>Cited basis</th></tr></thead>
              <tbody>
                {pathways.data.pathways.map((p) => (
                  <tr key={p.sector} style={p.sector === sector ? { background: T.gold + '22' } : undefined}>
                    <td style={{ ...td, fontWeight: p.sector === sector ? 700 : 500, color: T.navy }}>{p.label}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>−{p.slope_pct_per_yr}</td>
                    <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{p.metric}</td>
                    <td style={{ ...td, fontSize: 11 }}>{p.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {pathways.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Pathway reference unreachable: {String(pathways.error)}</div>}
      </Card>

      {/* ── SPO checklist ───────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>SPO Checklist — ICMA SLB Principles</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/slb-structuring/ref/spo-checklist</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={spo.status} demoText={spo.error} /></div>
        </div>
        {spo.data && (
          <>
            <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 12 }}>{spo.data.standard} — {spo.data.note}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {spo.data.components.map((c) => (
                <div key={c.component} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, background: T.cream }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>
                    <span style={{ fontFamily: T.mono, color: T.gold, marginRight: 6 }}>{c.component}.</span>{c.name}
                  </div>
                  {c.items.map((it, i) => (
                    <label key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: T.slate, padding: '3px 0', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ marginTop: 2 }} /> {it}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
        {spo.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>SPO checklist unreachable: {String(spo.error)}</div>}
      </Card>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/slb_structuring.py — SPT CAGR vs cited sector pathway slopes (hand-authored table, IEA NZE /
        SBTi / CRREM / IMO basis) · logistic p(miss) model assumption (parameters exposed) · multi-KPI independent/joint
        valuation (documented independence assumption) · step-down + call-to-avoid-step-up (bisection YTC/YTM) · ln-OLS
        history trend with visible p(miss) blend · cost-of-ambition sweep, greenium×step-up, merit-order MACC capex link ·
        SPO pre-screen (stated scoring convention) · published step-up benchmark table (hand-authored, labeled).
        Scoring views: sll-slb-v2 modules.
      </div>
    </div>
  );
}
