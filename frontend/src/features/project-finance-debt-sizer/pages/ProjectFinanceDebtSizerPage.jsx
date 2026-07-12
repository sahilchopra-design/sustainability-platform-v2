import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, ComposedChart, Bar, BarChart, Cell, LabelList,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Project Finance Debt Sizer (NX2-02)
// Multi-metric sculpted debt sizing: CFADS (pasted or derived P50/P90) →
// per-period blended target DSCR (contracted vs merchant revenue mix) →
// sculpted debt service → PV at the debt rate, intersected with the LLCR /
// PLCR / gearing constraint set (binding constraint reported, per period and
// at close). Extension modules, all computed by the live engine:
//   · TRANCHING     senior + mezzanine sized simultaneously on residual CFADS
//   · MINI-PERM     balloon/refi structure, refi-risk metric, hard vs soft
//   · FX            revenue vs debt currency, user FX path + hedged share,
//                   FX-stressed DSCR table (assumption-labeled, no forecast)
//   · BREAKEVENS    bisection: CFADS haircut / merchant price / all-in rate
//                   to min-DSCR 1.00x and the lock-up covenant
//   · SUSTAINABILITY green/SLL margin ratchet on an emissions-intensity KPI,
//                   green-loan margin benefit (labeled observation range),
//                   carbon-cost line deducted from CFADS → carbon-stressed
//                   debt capacity + delta vs base
//   · LENDER REPORT flat exportable summary (CSV) of all metrics & covenants
// Live engines:
//   1. POST /api/v1/pf-debt-sizing/size                (sizing + all modules)
//   2. GET  /api/v1/pf-debt-sizing/ref/dscr-benchmarks (market conventions, labeled)
//   3. POST /api/v1/project-finance/calculate          (optional cross-check)
// No fabricated numbers — every figure traces to the inputs via the solver.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const fmt$ = (v, d = 0) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}`;
const fmtM = (v) => (v == null || isNaN(v)) ? '—' : `$${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
const fmtX = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}x`;
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run sizing</span>;
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
const tdMono = { ...td, fontFamily: T.mono, textAlign: 'right' };
const thR = { ...th, textAlign: 'right' };

const Field = ({ label, children, width = 170 }) => (
  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width }}>
    {label}
    {children}
  </label>
);

const ModuleCard = ({ title, tag, enabled, onToggle, children, note }) => (
  <div style={{
    background: enabled ? '#fff' : '#fbfaf7', border: `1px solid ${enabled ? T.indigo + '66' : T.border}`,
    borderRadius: 10, padding: 14, flex: 1, minWidth: 330,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: enabled ? 10 : 0, flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: T.navy }}>
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        {title}
      </label>
      <span style={{ fontSize: 9.5, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 7px' }}>{tag}</span>
    </div>
    {enabled && children}
    {enabled && note && <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>{note}</div>}
  </div>
);

const num = (v) => { const x = parseFloat(v); return isNaN(x) ? null : x; };
const numOrU = (v) => { const x = parseFloat(v); return isNaN(x) ? undefined : x; };
const parseArray = (text) => text.split(/[\s,;]+/).map((s) => parseFloat(s)).filter((x) => !isNaN(x));

const SECTION_COLOR = {
  Sizing: T.navy, Covenants: T.indigo, 'Coverage (P50)': T.teal, 'Coverage (P90)': T.red,
  Coverage: T.teal, Sponsor: T.green, Breakevens: T.amber, Tranching: T.purple,
  'Mini-perm': T.blue, FX: T.slate, Sustainability: T.green,
};
const METRIC_LABEL = { dscr_sculpting: 'DSCR sculpting', gearing_cap: 'Gearing cap', llcr: 'LLCR', plcr: 'PLCR', dscr: 'DSCR' };

// Hand-authored editable defaults — illustrative 100 MW solar with 70%-contracted
// 15-year PPA and merchant tail. NOT live data; every field editable.
const DEFAULT_DERIVE = {
  capacity_mw: 100, capacity_factor_p50: 0.28, capacity_factor_p90: 0.24,
  degradation_pct_yr: 0.4, curtailment_pct: 3.0,
  contracted_price_usd_mwh: 52, contracted_escalation_pct: 1.5,
  contracted_tenor_years: 15, contracted_volume_share_pct: 70,
  merchant_price_usd_mwh: 38, merchant_escalation_pct: 2.0,
  opex_usd_yr: 1600000, opex_escalation_pct: 2.0,
  tax_rate_pct: 21, project_life_years: 25,
};
const DEFAULT_SIZING = {
  capex_usd: 110000000, target_dscr_contracted: 1.30, target_dscr_merchant: 1.80,
  target_llcr: '', target_plcr: '', lockup_dscr: 1.15,
  sizing_basis: 'p50', max_gearing_pct: 75, tenor_years: 18,
  interest_rate_pct: 6.5, dsra_months: 6, cash_sweep_pct: 25,
};
const DEFAULT_MEZZ = { target_dscr: 2.5, interest_rate_pct: 11.0, tenor_years: '', max_total_gearing_pct: 90 };
const DEFAULT_MINIPERM = { balloon_year: 7, refi_spread_bps: 75, refi_tenor_years: '' };
const DEFAULT_FX = {
  revenue_currency: 'LOCAL', debt_currency: 'USD', fx_initial: 1.0,
  fx_annual_drift_pct: -2.0, fx_path_text: '', hedged_share_pct: 60, stress_text: '10, 20, 30',
};
const DEFAULT_SUST = {
  emissions_intensity_initial: 0.012, emissions_intensity_decline_pct_yr: 3.0,
  emissions_intensity_target: 0.010, ratchet_bps: 5, green_loan_margin_benefit_bps: 4,
  carbon_price_initial: 60, carbon_price_growth_pct_yr: 4, emissions_tco2e_yr: '',
};

export default function ProjectFinanceDebtSizerPage() {
  const [mode, setMode] = useState('derive'); // 'derive' | 'paste'
  const [dv, setDv] = useState(DEFAULT_DERIVE);
  const [sz, setSz] = useState(DEFAULT_SIZING);
  const [p50Text, setP50Text] = useState('8600000, 8700000, 8800000, 8900000, 9000000, 9100000, 9200000, 9300000, 9400000, 9500000, 9600000, 9700000, 9800000, 9900000, 10000000, 8300000, 8400000, 8500000');
  const [p90Text, setP90Text] = useState('');
  const [pasteContractedPct, setPasteContractedPct] = useState(70);

  // Extension module state (all optional — legacy payloads unchanged when off)
  const [mezzOn, setMezzOn] = useState(false);
  const [mezz, setMezz] = useState(DEFAULT_MEZZ);
  const [mpOn, setMpOn] = useState(false);
  const [mp, setMp] = useState(DEFAULT_MINIPERM);
  const [fxOn, setFxOn] = useState(false);
  const [fx, setFx] = useState(DEFAULT_FX);
  const [suOn, setSuOn] = useState(false);
  const [su, setSu] = useState(DEFAULT_SUST);

  const [sizing, setSizing] = useState({ status: 'idle', data: null, error: null });
  const [bench, setBench] = useState({ status: 'loading', data: null, error: null });
  const [xcheck, setXcheck] = useState({ status: 'idle', data: null, error: null });
  const [dscrCase, setDscrCase] = useState('p50'); // chart toggle
  const [covenant, setCovenant] = useState(1.10);

  const setD = (k, v) => setDv((p) => ({ ...p, [k]: v }));
  const setS = (k, v) => setSz((p) => ({ ...p, [k]: v }));
  const setMz = (k, v) => setMezz((p) => ({ ...p, [k]: v }));
  const setMpF = (k, v) => setMp((p) => ({ ...p, [k]: v }));
  const setFxF = (k, v) => setFx((p) => ({ ...p, [k]: v }));
  const setSuF = (k, v) => setSu((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    axios.get('/api/v1/pf-debt-sizing/ref/dscr-benchmarks', { timeout: 15000 })
      .then(({ data }) => setBench({ status: 'live', data, error: null }))
      .catch((e) => setBench({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
  }, []);

  const runSizing = useCallback(async () => {
    setSizing({ status: 'loading', data: null, error: null });
    setXcheck({ status: 'idle', data: null, error: null });
    const base = {
      capex_usd: num(sz.capex_usd),
      target_dscr_contracted: num(sz.target_dscr_contracted),
      target_dscr_merchant: num(sz.target_dscr_merchant),
      sizing_basis: sz.sizing_basis,
      max_gearing_pct: num(sz.max_gearing_pct),
      tenor_years: parseInt(sz.tenor_years, 10),
      interest_rate_pct: num(sz.interest_rate_pct),
      dsra_months: parseInt(sz.dsra_months, 10),
      cash_sweep_pct: num(sz.cash_sweep_pct),
      lockup_dscr: num(sz.lockup_dscr) ?? 1.15,
    };
    if (numOrU(sz.target_llcr) !== undefined) base.target_llcr = num(sz.target_llcr);
    if (numOrU(sz.target_plcr) !== undefined) base.target_plcr = num(sz.target_plcr);
    if (mezzOn) {
      base.mezzanine = {
        target_dscr: num(mezz.target_dscr), interest_rate_pct: num(mezz.interest_rate_pct),
        max_total_gearing_pct: num(mezz.max_total_gearing_pct),
        ...(numOrU(mezz.tenor_years) !== undefined ? { tenor_years: parseInt(mezz.tenor_years, 10) } : {}),
      };
    }
    if (mpOn) {
      base.mini_perm = {
        balloon_year: parseInt(mp.balloon_year, 10), refi_spread_bps: num(mp.refi_spread_bps),
        ...(numOrU(mp.refi_tenor_years) !== undefined ? { refi_tenor_years: parseInt(mp.refi_tenor_years, 10) } : {}),
      };
    }
    if (fxOn) {
      const fxPath = parseArray(fx.fx_path_text);
      base.fx = {
        revenue_currency: fx.revenue_currency || 'LOCAL', debt_currency: fx.debt_currency || 'USD',
        fx_initial: num(fx.fx_initial), fx_annual_drift_pct: num(fx.fx_annual_drift_pct) ?? 0,
        hedged_share_pct: num(fx.hedged_share_pct) ?? 0,
        stress_depreciation_pcts: parseArray(fx.stress_text).length ? parseArray(fx.stress_text) : [10, 20, 30],
        ...(fxPath.length ? { fx_path: fxPath } : {}),
      };
    }
    if (suOn) {
      base.sustainability = {
        emissions_intensity_initial: num(su.emissions_intensity_initial),
        emissions_intensity_decline_pct_yr: num(su.emissions_intensity_decline_pct_yr) ?? 0,
        emissions_intensity_target: num(su.emissions_intensity_target),
        ratchet_bps: num(su.ratchet_bps) ?? 5,
        green_loan_margin_benefit_bps: num(su.green_loan_margin_benefit_bps) ?? 0,
        carbon_price_initial: num(su.carbon_price_initial),
        carbon_price_growth_pct_yr: num(su.carbon_price_growth_pct_yr) ?? 0,
        ...(numOrU(su.emissions_tco2e_yr) !== undefined ? { emissions_tco2e_yr: num(su.emissions_tco2e_yr) } : {}),
      };
    }
    const payload = mode === 'derive'
      ? {
        ...base,
        derive: {
          ...Object.fromEntries(Object.entries(dv).map(([k, v]) => [k, num(v)])),
          contracted_tenor_years: parseInt(dv.contracted_tenor_years, 10),
          project_life_years: parseInt(dv.project_life_years, 10),
        },
      }
      : {
        ...base,
        cfads_p50: parseArray(p50Text),
        cfads_p90: parseArray(p90Text).length ? parseArray(p90Text) : null,
        contracted_share_pct: num(pasteContractedPct),
      };
    try {
      const { data } = await axios.post('/api/v1/pf-debt-sizing/size', payload, { timeout: 30000 });
      setSizing({ status: 'live', data, error: null });
    } catch (e) {
      setSizing({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [mode, dv, sz, p50Text, p90Text, pasteContractedPct, mezzOn, mezz, mpOn, mp, fxOn, fx, suOn, su]);

  // Optional cross-check vs the platform project-finance engine (derive mode only:
  // it needs generation parameters). Payload mapped to ProjectFinanceRequest —
  // fields read from backend/schemas/project_finance.py.
  const runCrossCheck = useCallback(async () => {
    if (mode !== 'derive' || sizing.status !== 'live' || !sizing.data) return;
    setXcheck({ status: 'loading', data: null, error: null });
    const debt = sizing.data.sizing.max_supportable_debt_usd;
    const capex = num(sz.capex_usd);
    try {
      const { data } = await axios.post('/api/v1/project-finance/calculate', {
        asset_name: 'Debt Sizer cross-check',
        total_capex_usd: capex,
        debt_equity_ratio: Math.min(0.95, Math.max(0.01, debt / capex)),
        loan_tenor_years: Math.min(40, Math.max(1, parseInt(sz.tenor_years, 10))),
        interest_rate_pct: num(sz.interest_rate_pct),
        grace_period_months: 0,
        ppa_price_usd_mwh: num(dv.contracted_price_usd_mwh),
        ppa_tenor_years: Math.min(30, Math.max(1, parseInt(dv.contracted_tenor_years, 10) || 1)),
        price_escalation_pct: num(dv.contracted_escalation_pct),
        capacity_mw: num(dv.capacity_mw),
        capacity_factor_p50: num(dv.capacity_factor_p50),
        capacity_factor_p90: num(dv.capacity_factor_p90),
        curtailment_pct: Math.min(0.49, num(dv.curtailment_pct) / 100),
        opex_usd_year: num(dv.opex_usd_yr),
        opex_escalation_pct: num(dv.opex_escalation_pct),
        project_life_years: Math.min(50, Math.max(5, parseInt(dv.project_life_years, 10))),
        tax_rate_pct: num(dv.tax_rate_pct),
        include_etc_revenue: false,
      }, { timeout: 30000 });
      setXcheck({ status: 'live', data, error: null });
    } catch (e) {
      setXcheck({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [mode, sizing, sz, dv]);

  const chartData = useMemo(() => {
    if (sizing.status !== 'live' || !sizing.data) return [];
    return sizing.data.schedule.map((r) => ({
      period: r.period,
      dscr: dscrCase === 'p50' ? r.dscr_p50 : r.dscr_p90,
      target: r.target_dscr,
      llcr: r.llcr, plcr: r.plcr,
      cfads: (dscrCase === 'p50' ? r.cfads_p50 : r.cfads_p90) / 1e6,
      ds: r.debt_service / 1e6,
    }));
  }, [sizing, dscrCase]);

  const res = sizing.status === 'live' ? sizing.data : null;
  const mm = res?.multi_metric || null;
  const bindingLabel = res ? (METRIC_LABEL[res.sizing.binding_constraint] || res.sizing.binding_constraint) : null;

  const constraintChart = useMemo(() => {
    if (!mm) return [];
    return Object.entries(mm.constraint_debts_usd).map(([k, v]) => ({
      name: METRIC_LABEL[k] || k, key: k, debt: v / 1e6, binding: k === mm.binding_constraint,
    })).sort((a, b) => a.debt - b.debt);
  }, [mm]);

  const bindingCounts = useMemo(() => {
    if (!mm?.per_period_binding?.length) return null;
    const c = {};
    mm.per_period_binding.forEach((p) => { c[p.metric] = (c[p.metric] || 0) + 1; });
    return Object.entries(c).map(([k, n]) => `${METRIC_LABEL[k] || k}: ${n} periods`).join(' · ');
  }, [mm]);

  const exportLenderCsv = useCallback(() => {
    if (!res?.lender_report) return;
    const rows = [['Section', 'Metric', 'Value', 'Basis'],
      ...res.lender_report.map((r) => [r.section, r.metric, String(r.value ?? ''), r.basis || ''])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pf_debt_sizer_lender_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [res]);

  const be = res?.breakevens || null;
  const tr = res?.tranching || null;
  const mpr = res?.mini_perm || null;
  const fxr = res?.fx || null;
  const sur = res?.sustainability || null;

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-02</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Project Finance Debt Sizer</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>DSCR / LLCR / PLCR Multi-Metric</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Senior + Mezz Tranching</span>
          <span style={{ background: T.amber + '22', color: T.amber, border: `1px solid ${T.amber}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Mini-Perm / FX / Breakevens</span>
          <span style={{ background: T.green + '22', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Green / SLL Overlay</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1120 }}>
        Lender-grade debt sizing: per-period debt service is sculpted as CFADS ÷ target DSCR (targets blended by each
        period's contracted/merchant revenue mix); max debt = min over the DSCR-sculpted PV, the LLCR and PLCR caps and
        the gearing cap — the binding constraint is reported at close and per period. Optional structuring modules add a
        mezzanine tranche sized on residual CFADS, a mini-perm balloon/refi analysis, multi-currency FX conversion and
        stress, breakeven bisections, and a green/SLL sustainability overlay with a carbon-stressed debt capacity.
        Sponsor economics on P50, lender coverage on P90.
      </div>

      {/* ── 1 · CFADS builder ─────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>1 · CFADS — P50 &amp; P90 cases</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — hand-authored illustrative 100 MW solar, not live data</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 0 }}>
            {['derive', 'paste'].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                background: mode === m ? T.navy : '#fff', color: mode === m ? '#fff' : T.navy,
                border: `1px solid ${T.navy}`, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                borderRadius: m === 'derive' ? '6px 0 0 6px' : '0 6px 6px 0', fontFamily: T.font,
              }}>
                {m === 'derive' ? 'Derive from generation' : 'Paste CFADS array'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'derive' ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Field label="Capacity (MW)"><input type="number" style={inputStyle} value={dv.capacity_mw} onChange={(e) => setD('capacity_mw', e.target.value)} /></Field>
            <Field label="Capacity factor P50 (frac)"><input type="number" step="0.01" style={inputStyle} value={dv.capacity_factor_p50} onChange={(e) => setD('capacity_factor_p50', e.target.value)} /></Field>
            <Field label="Capacity factor P90 (frac)"><input type="number" step="0.01" style={inputStyle} value={dv.capacity_factor_p90} onChange={(e) => setD('capacity_factor_p90', e.target.value)} /></Field>
            <Field label="Degradation %/yr"><input type="number" step="0.1" style={inputStyle} value={dv.degradation_pct_yr} onChange={(e) => setD('degradation_pct_yr', e.target.value)} /></Field>
            <Field label="Curtailment %"><input type="number" step="0.5" style={inputStyle} value={dv.curtailment_pct} onChange={(e) => setD('curtailment_pct', e.target.value)} /></Field>
            <Field label="Contracted price $/MWh"><input type="number" style={inputStyle} value={dv.contracted_price_usd_mwh} onChange={(e) => setD('contracted_price_usd_mwh', e.target.value)} /></Field>
            <Field label="Contracted escalation %/yr"><input type="number" step="0.25" style={inputStyle} value={dv.contracted_escalation_pct} onChange={(e) => setD('contracted_escalation_pct', e.target.value)} /></Field>
            <Field label="Contracted tenor (yrs)"><input type="number" style={inputStyle} value={dv.contracted_tenor_years} onChange={(e) => setD('contracted_tenor_years', e.target.value)} /></Field>
            <Field label="Contracted volume share %"><input type="number" style={inputStyle} value={dv.contracted_volume_share_pct} onChange={(e) => setD('contracted_volume_share_pct', e.target.value)} /></Field>
            <Field label="Merchant price $/MWh (yr 1)"><input type="number" style={inputStyle} value={dv.merchant_price_usd_mwh} onChange={(e) => setD('merchant_price_usd_mwh', e.target.value)} /></Field>
            <Field label="Merchant escalation %/yr"><input type="number" step="0.25" style={inputStyle} value={dv.merchant_escalation_pct} onChange={(e) => setD('merchant_escalation_pct', e.target.value)} /></Field>
            <Field label="Opex $/yr"><input type="number" style={inputStyle} value={dv.opex_usd_yr} onChange={(e) => setD('opex_usd_yr', e.target.value)} /></Field>
            <Field label="Opex escalation %/yr"><input type="number" step="0.25" style={inputStyle} value={dv.opex_escalation_pct} onChange={(e) => setD('opex_escalation_pct', e.target.value)} /></Field>
            <Field label="Cash tax rate % (0 = pre-tax)"><input type="number" style={inputStyle} value={dv.tax_rate_pct} onChange={(e) => setD('tax_rate_pct', e.target.value)} /></Field>
            <Field label="Project life (yrs)"><input type="number" style={inputStyle} value={dv.project_life_years} onChange={(e) => setD('project_life_years', e.target.value)} /></Field>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, flex: 2, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 4 }}>
              Annual P50 CFADS (USD, comma/space separated — one value per year)
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={p50Text} onChange={(e) => setP50Text(e.target.value)} />
            </label>
            <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, flex: 2, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 4 }}>
              Annual P90 CFADS (optional — blank ⇒ P90 = P50, flagged by the engine)
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={p90Text} onChange={(e) => setP90Text(e.target.value)} />
            </label>
            <Field label="Contracted revenue share % (all periods)"><input type="number" style={inputStyle} value={pasteContractedPct} onChange={(e) => setPasteContractedPct(e.target.value)} /></Field>
            <div style={{ fontSize: 11, color: T.sub, alignSelf: 'flex-end' }}>
              {parseArray(p50Text).length} P50 periods parsed{parseArray(p90Text).length ? ` · ${parseArray(p90Text).length} P90 periods` : ''}
            </div>
          </div>
        )}
      </div>

      {/* ── 2 · Sizing inputs (multi-metric constraint set) ───────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>2 · Sizing parameters — DSCR / LLCR / PLCR constraint set</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>
            debt = min( PV(CFADS÷targetDSCR), PV(CFADS,tenor)÷LLCR, PV(CFADS,life)÷PLCR, gearing%×capex )
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Total capex (USD)"><input type="number" style={inputStyle} value={sz.capex_usd} onChange={(e) => setS('capex_usd', e.target.value)} /></Field>
          <Field label="Target DSCR — contracted" width={140}><input type="number" step="0.05" style={inputStyle} value={sz.target_dscr_contracted} onChange={(e) => setS('target_dscr_contracted', e.target.value)} /></Field>
          <Field label="Target DSCR — merchant" width={140}><input type="number" step="0.05" style={inputStyle} value={sz.target_dscr_merchant} onChange={(e) => setS('target_dscr_merchant', e.target.value)} /></Field>
          <Field label="Target LLCR (blank = off)" width={140}><input type="number" step="0.05" style={inputStyle} value={sz.target_llcr} placeholder="e.g. 1.40" onChange={(e) => setS('target_llcr', e.target.value)} /></Field>
          <Field label="Target PLCR (blank = off)" width={140}><input type="number" step="0.05" style={inputStyle} value={sz.target_plcr} placeholder="e.g. 1.60" onChange={(e) => setS('target_plcr', e.target.value)} /></Field>
          <Field label="Lock-up DSCR (covenant)" width={140}><input type="number" step="0.05" style={inputStyle} value={sz.lockup_dscr} onChange={(e) => setS('lockup_dscr', e.target.value)} /></Field>
          <Field label="Sizing basis" width={110}>
            <select style={inputStyle} value={sz.sizing_basis} onChange={(e) => setS('sizing_basis', e.target.value)}>
              <option value="p50">P50 CFADS</option>
              <option value="p90">P90 CFADS</option>
            </select>
          </Field>
          <Field label="Max gearing %" width={110}><input type="number" style={inputStyle} value={sz.max_gearing_pct} onChange={(e) => setS('max_gearing_pct', e.target.value)} /></Field>
          <Field label="Tenor (yrs)" width={100}><input type="number" style={inputStyle} value={sz.tenor_years} onChange={(e) => setS('tenor_years', e.target.value)} /></Field>
          <Field label="All-in rate % (base + margin)" width={150}><input type="number" step="0.125" style={inputStyle} value={sz.interest_rate_pct} onChange={(e) => setS('interest_rate_pct', e.target.value)} /></Field>
          <Field label="DSRA (months of DS)" width={130}><input type="number" style={inputStyle} value={sz.dsra_months} onChange={(e) => setS('dsra_months', e.target.value)} /></Field>
          <Field label="Cash sweep % of excess" width={140}><input type="number" style={inputStyle} value={sz.cash_sweep_pct} onChange={(e) => setS('cash_sweep_pct', e.target.value)} /></Field>
        </div>
      </div>

      {/* ── 3 · Structuring & sustainability modules ─────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>3 · Structuring &amp; sustainability modules</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>All optional — enable per module; math documented in the engine docstring</span>
          <button onClick={runSizing} style={{
            marginLeft: 'auto', background: T.navy, color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 26px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            Size the debt →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ModuleCard title="Mezzanine tranche" tag="sized on residual CFADS" enabled={mezzOn} onToggle={setMezzOn}
            note="Mezz DS_t = (CFADS_t − senior DS_t) ÷ mezz target DSCR, PV'd at the mezz rate — senior schedule untouched, so senior DSCRs are unchanged.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Mezz target DSCR (residual)" width={140}><input type="number" step="0.1" style={inputStyle} value={mezz.target_dscr} onChange={(e) => setMz('target_dscr', e.target.value)} /></Field>
              <Field label="Mezz rate %" width={100}><input type="number" step="0.25" style={inputStyle} value={mezz.interest_rate_pct} onChange={(e) => setMz('interest_rate_pct', e.target.value)} /></Field>
              <Field label="Mezz tenor (blank = senior)" width={150}><input type="number" style={inputStyle} value={mezz.tenor_years} onChange={(e) => setMz('tenor_years', e.target.value)} /></Field>
              <Field label="Max total gearing %" width={130}><input type="number" style={inputStyle} value={mezz.max_total_gearing_pct} onChange={(e) => setMz('max_total_gearing_pct', e.target.value)} /></Field>
            </div>
          </ModuleCard>
          <ModuleCard title="Mini-perm / balloon refi" tag="refi-risk metric" enabled={mpOn} onToggle={setMpOn}
            note="Refi rate = current all-in + spread-at-refi (USER ASSUMPTION, labeled). Refi-risk = balloon ÷ PV(post-balloon CFADS) — ≤ 1 means covered. Hard vs soft compared.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Balloon year" width={100}><input type="number" style={inputStyle} value={mp.balloon_year} onChange={(e) => setMpF('balloon_year', e.target.value)} /></Field>
              <Field label="Spread at refi (bps, assumed)" width={170}><input type="number" style={inputStyle} value={mp.refi_spread_bps} onChange={(e) => setMpF('refi_spread_bps', e.target.value)} /></Field>
              <Field label="Refi tenor (blank = auto)" width={150}><input type="number" style={inputStyle} value={mp.refi_tenor_years} onChange={(e) => setMpF('refi_tenor_years', e.target.value)} /></Field>
            </div>
          </ModuleCard>
          <ModuleCard title="Multi-currency (FX)" tag="user FX path — labeled assumption" enabled={fxOn} onToggle={setFxOn}
            note="CFADS converted at h·fx₀ + (1−h)·fx_t before sizing (h = hedged share). Stress table shocks the UNHEDGED share only, debt service held fixed. No FX forecast is fabricated.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Revenue ccy" width={90}><input style={inputStyle} value={fx.revenue_currency} onChange={(e) => setFxF('revenue_currency', e.target.value)} /></Field>
              <Field label="Debt ccy" width={90}><input style={inputStyle} value={fx.debt_currency} onChange={(e) => setFxF('debt_currency', e.target.value)} /></Field>
              <Field label="FX at close (debt/rev)" width={130}><input type="number" step="0.001" style={inputStyle} value={fx.fx_initial} onChange={(e) => setFxF('fx_initial', e.target.value)} /></Field>
              <Field label="Flat drift %/yr (user)" width={130}><input type="number" step="0.5" style={inputStyle} value={fx.fx_annual_drift_pct} onChange={(e) => setFxF('fx_annual_drift_pct', e.target.value)} /></Field>
              <Field label="Hedged share %" width={110}><input type="number" style={inputStyle} value={fx.hedged_share_pct} onChange={(e) => setFxF('hedged_share_pct', e.target.value)} /></Field>
              <Field label="Per-year FX path (optional, overrides drift)" width={260}><input style={inputStyle} placeholder="e.g. 1.0, 0.97, 0.95, …" value={fx.fx_path_text} onChange={(e) => setFxF('fx_path_text', e.target.value)} /></Field>
              <Field label="Stress depreciation points %" width={170}><input style={inputStyle} value={fx.stress_text} onChange={(e) => setFxF('stress_text', e.target.value)} /></Field>
            </div>
          </ModuleCard>
          <ModuleCard title="Sustainability overlay (green / SLL)" tag="margin ratchet + carbon-stressed capacity" enabled={suOn} onToggle={setSuOn}
            note="Two-way SLL ratchet (±bps) on the emissions-intensity KPI vs target; green-loan benefit is a USER INPUT (labeled market observation ~0–10 bps). Carbon cost = intensity-derived (or flat) emissions × user carbon price path, deducted from CFADS and the debt re-sized.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Intensity yr-1 (e.g. tCO2e/MWh)" width={160}><input type="number" step="0.001" style={inputStyle} value={su.emissions_intensity_initial} onChange={(e) => setSuF('emissions_intensity_initial', e.target.value)} /></Field>
              <Field label="Intensity decline %/yr" width={130}><input type="number" step="0.5" style={inputStyle} value={su.emissions_intensity_decline_pct_yr} onChange={(e) => setSuF('emissions_intensity_decline_pct_yr', e.target.value)} /></Field>
              <Field label="Intensity SPT target" width={120}><input type="number" step="0.001" style={inputStyle} value={su.emissions_intensity_target} onChange={(e) => setSuF('emissions_intensity_target', e.target.value)} /></Field>
              <Field label="Ratchet ± bps" width={100}><input type="number" step="0.5" style={inputStyle} value={su.ratchet_bps} onChange={(e) => setSuF('ratchet_bps', e.target.value)} /></Field>
              <Field label="Green-loan benefit bps (user)" width={160}><input type="number" step="0.5" style={inputStyle} value={su.green_loan_margin_benefit_bps} onChange={(e) => setSuF('green_loan_margin_benefit_bps', e.target.value)} /></Field>
              <Field label="Carbon price yr-1 $/t (user path)" width={170}><input type="number" style={inputStyle} value={su.carbon_price_initial} onChange={(e) => setSuF('carbon_price_initial', e.target.value)} /></Field>
              <Field label="Carbon price growth %/yr" width={150}><input type="number" step="0.5" style={inputStyle} value={su.carbon_price_growth_pct_yr} onChange={(e) => setSuF('carbon_price_growth_pct_yr', e.target.value)} /></Field>
              <Field label="Flat emissions tCO2e/yr (optional)" width={180}><input type="number" style={inputStyle} placeholder="blank ⇒ intensity × generation" value={su.emissions_tco2e_yr} onChange={(e) => setSuF('emissions_tco2e_yr', e.target.value)} /></Field>
            </div>
          </ModuleCard>
        </div>
      </div>

      {/* ── 4 · Results ───────────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>4 · Sizing result, binding constraint &amp; debt schedule</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/pf-debt-sizing/size</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={sizing.status} demoText={sizing.error} /></div>
        </div>

        {sizing.status === 'live' && res && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Max supportable debt" value={fmtM(res.sizing.max_supportable_debt_usd)} sub={`Sculpted ${fmtM(res.sizing.dscr_sculpted_debt_usd)} · gearing cap ${fmtM(res.sizing.gearing_cap_debt_usd)}`} color={T.teal} />
              <Kpi label="Binding constraint" value={bindingLabel} sub={bindingCounts ? `Per-period: ${bindingCounts}` : 'min over the provided constraint set'} color={res.sizing.binding_constraint === 'dscr_sculpting' ? T.indigo : T.amber} />
              <Kpi label="LLCR / PLCR at close" value={`${fmtX(mm?.llcr_at_close)} / ${fmtX(mm?.plcr_at_close)}`} sub={`Min over tenor: LLCR ${fmtX(mm?.min_llcr)} · PLCR ${fmtX(mm?.min_plcr)}`} color={T.blue} />
              <Kpi label="Gearing achieved" value={fmtPct(res.sizing.gearing_achieved_pct)} sub={`vs ${fmtPct(parseFloat(sz.max_gearing_pct), 0)} max · equity ${fmtM(res.sizing.equity_usd)}`} />
              <Kpi label="Sponsor P50 equity IRR" value={fmtPct(res.sponsor_case_p50.equity_irr_pct, 2)} sub={`P50 min/avg DSCR ${fmtX(res.sponsor_case_p50.min_dscr)} / ${fmtX(res.sponsor_case_p50.avg_dscr)}`} color={T.green} />
              <Kpi label="Lender P90 min / avg DSCR" value={`${fmtX(res.lender_case_p90.min_dscr)} / ${fmtX(res.lender_case_p90.avg_dscr)}`} sub={res.lender_case_p90.p90_is_p50_proxy ? 'P90 = P50 proxy (no P90 supplied)' : 'True P90 case'} color={T.red} />
              <Kpi label="DSRA at close" value={fmtM(res.sizing.dsra_initial_usd)} sub={`${sz.dsra_months} months of forward DS · equity-funded`} color={T.purple} />
            </div>
            {(res.flags.sweep_note || res.flags.p90_proxy || res.flags.tax_note || res.flags.fx_note) && (
              <div style={{ fontSize: 11, color: T.amber, marginBottom: 12, fontFamily: T.mono }}>
                {res.flags.sweep_note && <div>⚑ {res.flags.sweep_note}</div>}
                {res.flags.p90_proxy && <div>⚑ No P90 CFADS supplied — lender case uses P50 as proxy</div>}
                {res.flags.tax_note && <div>⚑ {res.flags.tax_note}</div>}
                {res.flags.fx_note && <div>⚑ {res.flags.fx_note}</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {/* Constraint debts bar chart */}
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>
                  Max debt per constraint ($M) — binding = lowest bar
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={constraintChart} layout="vertical" margin={{ left: 30, right: 55, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={95} />
                    <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}M`, 'Max debt']} />
                    <Bar dataKey="debt" radius={[0, 3, 3, 0]}>
                      {constraintChart.map((d, i) => <Cell key={i} fill={d.binding ? T.red : T.teal} />)}
                      <LabelList dataKey="debt" position="right" formatter={(v) => `$${Number(v).toFixed(1)}M`} style={{ fontSize: 10, fontFamily: T.mono }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>{mm?.note}</div>
              </div>

              {/* DSCR / coverage-ratio chart */}
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>DSCR / LLCR / PLCR over time vs target and covenant</div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex' }}>
                      {['p50', 'p90'].map((c) => (
                        <button key={c} onClick={() => setDscrCase(c)} style={{
                          background: dscrCase === c ? T.indigo : '#fff', color: dscrCase === c ? '#fff' : T.indigo,
                          border: `1px solid ${T.indigo}`, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          borderRadius: c === 'p50' ? '5px 0 0 5px' : '0 5px 5px 0',
                        }}>{c.toUpperCase()}</button>
                      ))}
                    </div>
                    <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      Covenant
                      <input type="number" step="0.05" style={{ ...inputStyle, width: 70 }} value={covenant} onChange={(e) => setCovenant(e.target.value)} />
                    </label>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} label={{ value: 'Period (year)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} tickFormatter={(v) => `${v}x`} />
                    <Tooltip formatter={(v, n) => [v == null ? '—' : `${Number(v).toFixed(3)}x`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={parseFloat(covenant) || 0} stroke={T.red} strokeDasharray="6 3" label={{ value: `Covenant ${covenant}x`, fontSize: 10, fill: T.red, position: 'insideTopRight' }} />
                    <Line type="monotone" dataKey="dscr" name={`DSCR (${dscrCase.toUpperCase()})`} stroke={T.indigo} strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls={false} />
                    <Line type="monotone" dataKey="target" name="Target DSCR (blended)" stroke={T.gold} strokeWidth={1.6} strokeDasharray="4 3" dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="llcr" name="LLCR_t" stroke={T.teal} strokeWidth={1.4} strokeDasharray="2 3" dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="plcr" name="PLCR_t" stroke={T.purple} strokeWidth={1.4} strokeDasharray="2 3" dot={false} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Waterfall table */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, margin: '14px 0 6px' }}>
              Period-by-period waterfall (sculpted schedule · sweep as prepayment · DSRA movements · per-period binding metric; all USD)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1250 }}>
                <thead>
                  <tr>
                    <th style={th}>Yr</th><th style={thR}>CFADS P50</th><th style={thR}>CFADS P90</th>
                    <th style={thR}>Contr. %</th><th style={thR}>Target DSCR</th><th style={thR}>Opening</th>
                    <th style={thR}>Interest</th><th style={thR}>Principal</th><th style={thR}>Debt service</th>
                    <th style={thR}>Sweep</th><th style={thR}>Closing</th><th style={thR}>DSRA mvmt</th>
                    <th style={thR}>DSCR P50</th><th style={thR}>DSCR P90</th>
                    <th style={thR}>LLCR</th><th style={thR}>PLCR</th><th style={thR}>Binding</th>
                  </tr>
                </thead>
                <tbody>
                  {res.schedule.map((r) => (
                    <tr key={r.period} style={{ background: r.debt_service > 0 ? 'transparent' : '#fafaf7' }}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.period}</td>
                      <td style={tdMono}>{fmt$(r.cfads_p50)}</td>
                      <td style={tdMono}>{fmt$(r.cfads_p90)}</td>
                      <td style={tdMono}>{fmtPct(r.contracted_share_pct, 0)}</td>
                      <td style={tdMono}>{r.target_dscr != null ? fmtX(r.target_dscr) : '—'}</td>
                      <td style={tdMono}>{fmt$(r.opening_balance)}</td>
                      <td style={tdMono}>{fmt$(r.interest)}</td>
                      <td style={tdMono}>{fmt$(r.principal_scheduled)}</td>
                      <td style={{ ...tdMono, fontWeight: 700, color: T.navy }}>{fmt$(r.debt_service)}</td>
                      <td style={{ ...tdMono, color: r.cash_sweep > 0 ? T.purple : T.sub }}>{fmt$(r.cash_sweep)}</td>
                      <td style={tdMono}>{fmt$(r.closing_balance)}</td>
                      <td style={{ ...tdMono, color: r.dsra_movement < 0 ? T.green : T.sub }}>{fmt$(r.dsra_movement)}</td>
                      <td style={{ ...tdMono, fontWeight: 700, color: r.dscr_p50 != null && r.dscr_p50 < parseFloat(covenant) ? T.red : T.teal }}>{r.dscr_p50 != null ? fmtX(r.dscr_p50) : '—'}</td>
                      <td style={{ ...tdMono, fontWeight: 700, color: r.dscr_p90 != null && r.dscr_p90 < parseFloat(covenant) ? T.red : T.slate }}>{r.dscr_p90 != null ? fmtX(r.dscr_p90) : '—'}</td>
                      <td style={tdMono}>{r.llcr != null ? fmtX(r.llcr) : '—'}</td>
                      <td style={tdMono}>{r.plcr != null ? fmtX(r.plcr) : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontSize: 10.5, color: T.amber }}>{r.binding_metric ? `${METRIC_LABEL[r.binding_metric] || r.binding_metric} (${r.binding_headroom != null ? r.binding_headroom.toFixed(2) : '—'})` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6, fontFamily: T.mono }}>
              {res.methodology} Per-period binding = argmin(metric ÷ target headroom) across the constraints with targets.
            </div>
          </>
        )}
        {sizing.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Sizing engine unreachable or inputs rejected — no figures shown (this page never fabricates results). Error: {String(sizing.error)}</div>}
        {sizing.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Configure CFADS, sizing parameters and any structuring modules above, then size the debt. The full sculpted schedule is returned period-by-period.</div>}
      </div>

      {/* ── 5 · Tranching / mini-perm / FX results ────────────────────────── */}
      {res && (tr || mpr || fxr) && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: T.navy }}>5 · Structuring results</h2>

          {tr && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.purple, marginBottom: 8 }}>Tranching — senior + mezzanine (mezz sized on residual CFADS; senior schedule untouched)</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Senior / mezz / total debt" value={`${fmtM(tr.senior_debt_usd)} + ${fmtM(tr.mezz_debt_usd)}`} sub={`Total ${fmtM(tr.total_debt_usd)} · ${fmtPct(tr.total_gearing_pct)} gearing · mezz binding: ${tr.mezz_binding_constraint}`} color={T.purple} />
                <Kpi label="Attachment / detachment" value={`${fmtPct(tr.attachment_pct_of_capex)} / ${fmtPct(tr.detachment_pct_of_capex)}`} sub="% of capex — senior detaches where mezz attaches" />
                <Kpi label="Blended cost of debt" value={fmtPct(tr.blended_cost_of_debt_pct, 2)} sub={`Balance-weighted coupon vs senior ${fmtPct(parseFloat(sz.interest_rate_pct), 2)}`} color={T.indigo} />
                <Kpi label="Coverage at each level" value={`${fmtX(tr.senior_min_dscr_p50)} / ${fmtX(tr.total_min_dscr_p50)}`} sub={`Senior-only vs total-stack min DSCR (P50) · P90 total ${fmtX(tr.total_min_dscr_p90)} · mezz-on-residual ${fmtX(tr.mezz_min_dscr_on_residual)}`} color={T.teal} />
                <Kpi label="Sponsor IRR with mezz" value={fmtPct(tr.sponsor_p50_equity_irr_with_mezz_pct, 2)} sub={`vs ${fmtPct(res.sponsor_case_p50.equity_irr_pct, 2)} senior-only · equity ${fmtM(tr.equity_usd_with_mezz)}`} color={T.green} />
              </div>
              {tr.mezz_schedule?.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr>
                        <th style={th}>Yr</th><th style={thR}>Mezz opening</th><th style={thR}>Interest</th><th style={thR}>Principal</th>
                        <th style={thR}>Mezz DS</th><th style={thR}>Closing</th><th style={thR}>Residual CFADS</th><th style={thR}>Mezz DSCR (residual)</th><th style={thR}>Total DSCR P50</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tr.mezz_schedule.map((r) => (
                        <tr key={r.period}>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.period}</td>
                          <td style={tdMono}>{fmt$(r.opening_balance)}</td>
                          <td style={tdMono}>{fmt$(r.interest)}</td>
                          <td style={tdMono}>{fmt$(r.principal)}</td>
                          <td style={{ ...tdMono, fontWeight: 700 }}>{fmt$(r.debt_service)}</td>
                          <td style={tdMono}>{fmt$(r.closing_balance)}</td>
                          <td style={tdMono}>{fmt$(r.residual_cfads_p50)}</td>
                          <td style={tdMono}>{r.mezz_dscr_on_residual != null ? fmtX(r.mezz_dscr_on_residual) : '—'}</td>
                          <td style={{ ...tdMono, fontWeight: 700, color: T.purple }}>{r.total_dscr_p50 != null ? fmtX(r.total_dscr_p50) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6, fontFamily: T.mono }}>{tr.note}</div>
            </div>
          )}

          {mpr && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.blue, marginBottom: 8 }}>Mini-perm / balloon refinancing</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label={`Balloon at year ${mpr.balloon_year}`} value={fmtM(mpr.balloon_usd)} sub={`${fmtPct(mpr.balloon_pct_of_debt)} of sized debt`} color={T.blue} />
                <Kpi label="Refi-risk metric" value={mpr.refi_risk_metric != null ? mpr.refi_risk_metric.toFixed(3) : '—'}
                  sub="balloon ÷ PV(post-balloon CFADS) — ≤ 1.0 covered, lower is safer"
                  color={mpr.refi_risk_metric != null && mpr.refi_risk_metric > 1 ? T.red : T.green} />
                <Kpi label="Assumed spread at refi" value={`+${mpr.refi_spread_bps_assumed} bps`} sub="USER ASSUMPTION — labeled, not a forecast" color={T.amber} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {mpr.hard_vs_soft.map((s, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 300, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: T.navy, marginBottom: 6 }}>{s.structure}</div>
                    {i === 0 ? (
                      <div style={{ fontSize: 11.5, color: T.slate, fontFamily: T.mono, lineHeight: 1.8 }}>
                        Refi rate (assumed): {fmtPct(s.refi_rate_pct_assumed, 2)} · tenor {s.refi_tenor_years}y<br />
                        Post-refi annuity DS: {fmt$(s.post_refi_annuity_ds_usd)}<br />
                        Post-refi min / avg DSCR (P50): {fmtX(s.post_refi_min_dscr_p50)} / {fmtX(s.post_refi_avg_dscr_p50)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: T.slate, fontFamily: T.mono, lineHeight: 1.8 }}>
                        Balance at sweep switch: {fmt$(s.balance_at_switch_usd)}<br />
                        Full-sweep payoff year: {s.full_sweep_payoff_year ?? 'not repaid within life'}<br />
                        Repaid within project life: {s.repaid_within_life ? 'yes' : `no — residual ${fmt$(s.residual_balance_at_life_end_usd)}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6, fontFamily: T.mono }}>{mpr.refi_risk_definition}</div>
            </div>
          )}

          {fxr && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.slate, marginBottom: 8 }}>
                Multi-currency — {fxr.revenue_currency} revenue vs {fxr.debt_currency} debt ({fxr.fx_path_basis})
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Effective FX yr-1 / final" value={`${fxr.effective_fx_year1} / ${fxr.effective_fx_final}`} sub={`Hedged share ${fmtPct(fxr.hedged_share_pct, 0)} locked at closing spot`} />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 760 }}>
                <thead>
                  <tr>
                    <th style={thR}>Extra depreciation (unhedged leg)</th><th style={thR}>Min DSCR P50</th>
                    <th style={thR}>Avg DSCR P50</th><th style={thR}>Periods &lt; 1.00x</th><th style={thR}>Periods &lt; lock-up</th>
                  </tr>
                </thead>
                <tbody>
                  {fxr.stressed_dscr_table.map((r, i) => (
                    <tr key={i}>
                      <td style={tdMono}>−{fmtPct(r.depreciation_pct, 0)}</td>
                      <td style={{ ...tdMono, fontWeight: 700, color: r.min_dscr_p50 != null && r.min_dscr_p50 < 1 ? T.red : T.teal }}>{fmtX(r.min_dscr_p50)}</td>
                      <td style={tdMono}>{fmtX(r.avg_dscr_p50)}</td>
                      <td style={{ ...tdMono, color: r.periods_below_1x > 0 ? T.red : T.sub }}>{r.periods_below_1x}</td>
                      <td style={{ ...tdMono, color: r.periods_below_lockup > 0 ? T.amber : T.sub }}>{r.periods_below_lockup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6, fontFamily: T.mono }}>{fxr.note}</div>
            </div>
          )}
        </div>
      )}

      {/* ── 6 · Breakevens panel ──────────────────────────────────────────── */}
      {res && be && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>6 · Breakevens — solved by bisection on the final schedule</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>thresholds: min DSCR 1.00x and lock-up {be.lockup_dscr}x · debt service held fixed</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="CFADS haircut breakeven" value={be.cfads_haircut_pct.to_1_00x != null ? `−${fmtPct(be.cfads_haircut_pct.to_1_00x)}` : '—'}
              sub={`Uniform P50 haircut to 1.00x · to lock-up: ${be.cfads_haircut_pct.to_lockup != null ? `−${fmtPct(be.cfads_haircut_pct.to_lockup)}` : '—'}`} color={T.amber} />
            <Kpi label="Merchant price breakeven" value={be.merchant_price_usd_mwh.available ? (be.merchant_price_usd_mwh.to_1_00x != null ? `$${be.merchant_price_usd_mwh.to_1_00x}/MWh` : '—') : 'derive mode only'}
              sub={be.merchant_price_usd_mwh.available
                ? `To 1.00x (0 = covered by contract alone) · to lock-up: ${be.merchant_price_usd_mwh.to_lockup != null ? `$${be.merchant_price_usd_mwh.to_lockup}/MWh` : '—'}`
                : String(be.merchant_price_usd_mwh.note)} color={T.indigo} />
            <Kpi label="All-in rate breakeven" value={be.interest_rate_pct.to_1_00x != null ? fmtPct(be.interest_rate_pct.to_1_00x, 2) : '> 50%'}
              sub={`Rate at which min DSCR hits 1.00x · to lock-up: ${be.interest_rate_pct.to_1_00x != null || be.interest_rate_pct.to_lockup != null ? (be.interest_rate_pct.to_lockup != null ? fmtPct(be.interest_rate_pct.to_lockup, 2) : '> 50%') : '—'} (balance path held, interest recomputed)`} color={T.red} />
          </div>
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8, fontFamily: T.mono }}>{be.method}</div>
        </div>
      )}

      {/* ── 7 · Sustainability overlay results ────────────────────────────── */}
      {res && sur && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>7 · Sustainability overlay — green/SLL terms &amp; carbon-stressed capacity</h2>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Greenium input + carbon price path are USER assumptions — labeled, not market feeds</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Kpi label="Sustainability-adjusted cost of debt" value={fmtPct(sur.sustainability_adjusted_cost_of_debt_pct, 3)}
              sub={`Base ${fmtPct(sur.base_cost_of_debt_pct, 3)} + ratchet avg ${sur.margin_ratchet.avg_margin_adjustment_bps != null ? `${sur.margin_ratchet.avg_margin_adjustment_bps > 0 ? '+' : ''}${sur.margin_ratchet.avg_margin_adjustment_bps} bps` : '—'} − green benefit ${sur.green_loan_margin_benefit_bps} bps`} color={T.green} />
            <Kpi label="SLL KPI test" value={sur.margin_ratchet.available ? `${sur.margin_ratchet.periods_kpi_met} / ${sur.margin_ratchet.periods_total} met` : 'off'}
              sub={sur.margin_ratchet.available ? `Two-way ratchet ±${sur.margin_ratchet.ratchet_bps} bps on intensity vs SPT target` : String(sur.margin_ratchet.note)} color={T.teal} />
            {sur.carbon_stress && (
              <>
                <Kpi label="Carbon-stressed debt capacity" value={fmtM(sur.carbon_stress.carbon_stressed_debt_capacity_usd)}
                  sub={`Binding: ${METRIC_LABEL[sur.carbon_stress.binding_constraint] || sur.carbon_stress.binding_constraint} · ${sur.carbon_stress.carbon_price_basis}`} color={T.amber} />
                <Kpi label="Δ capacity vs base" value={`${fmtM(sur.carbon_stress.delta_vs_base_usd)} (${fmtPct(sur.carbon_stress.delta_vs_base_pct, 2)})`}
                  sub={`Carbon cost yr-1 ${fmt$(sur.carbon_stress.carbon_cost_year1_usd)} · total ${fmt$(sur.carbon_stress.carbon_cost_total_usd)} (${sur.carbon_stress.emissions_basis})`} color={T.red} />
              </>
            )}
          </div>
          {sur.margin_ratchet.rows?.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={th}>Yr</th><th style={thR}>Intensity KPI</th><th style={thR}>SPT target</th>
                    <th style={th}>KPI met</th><th style={thR}>Margin adj (bps)</th><th style={thR}>Adjusted rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {sur.margin_ratchet.rows.map((r) => (
                    <tr key={r.period}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.period}</td>
                      <td style={tdMono}>{r.intensity}</td>
                      <td style={tdMono}>{r.target}</td>
                      <td style={{ ...td, fontWeight: 700, color: r.kpi_met ? T.green : T.red }}>{r.kpi_met ? '✓ met' : '✗ missed'}</td>
                      <td style={{ ...tdMono, color: r.margin_adjustment_bps < 0 ? T.green : T.red }}>{r.margin_adjustment_bps > 0 ? '+' : ''}{r.margin_adjustment_bps}</td>
                      <td style={tdMono}>{fmtPct(r.adjusted_rate_pct, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sur.carbon_stress && <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6, fontFamily: T.mono }}>{sur.carbon_stress.note}</div>}
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{sur.green_benefit_basis}</div>
        </div>
      )}

      {/* ── 8 · Lender report ─────────────────────────────────────────────── */}
      {res && res.lender_report && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>8 · Lender report — all metrics, covenants &amp; breakevens</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>{res.lender_report.length} rows</span>
            <button onClick={exportLenderCsv} style={{
              marginLeft: 'auto', background: T.teal, color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              ⭳ Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={th}>Section</th><th style={th}>Metric</th><th style={thR}>Value</th><th style={th}>Basis</th></tr>
            </thead>
            <tbody>
              {res.lender_report.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: SECTION_COLOR[r.section] || T.slate }}>{r.section}</td>
                  <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.metric}</td>
                  <td style={{ ...tdMono, fontWeight: 700 }}>{typeof r.value === 'number' ? Number(r.value).toLocaleString('en-US', { maximumFractionDigits: 4 }) : String(r.value ?? '—')}</td>
                  <td style={{ ...td, fontSize: 11, color: T.sub }}>{r.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Cross-check vs platform project-finance engine ───────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Cross-check — platform Project Finance engine</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/project-finance/calculate (sized debt → debt/equity ratio)</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Badge status={xcheck.status} demoText={xcheck.error} />
            <button onClick={runCrossCheck} disabled={mode !== 'derive' || sizing.status !== 'live'} style={{
              background: (mode === 'derive' && sizing.status === 'live') ? T.teal : T.sub, color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700,
              cursor: (mode === 'derive' && sizing.status === 'live') ? 'pointer' : 'not-allowed', fontFamily: T.font,
            }}>
              Run cross-check →
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
          Directional sanity check only (derive mode): the sized debt is passed to the platform's project-finance engine
          as a debt/equity ratio. Methodologies differ by design — that engine amortises annuity-style with a full tax model,
          this sizer sculpts to DSCR with a simplified cash tax — so expect close-but-not-identical IRR and DSCR.
        </div>
        {xcheck.status === 'live' && xcheck.data && res && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="Equity IRR — this sizer (P50)" value={fmtPct(res.sponsor_case_p50.equity_irr_pct, 2)} sub="Sculpted schedule, sweep + DSRA" color={T.green} />
            <Kpi label="Equity IRR — PF engine (P50)" value={fmtPct(xcheck.data.equity_irr_pct, 2)} sub="Annuity amortisation, full tax model" color={T.teal} />
            <Kpi label="Min DSCR — PF engine (P50)" value={fmtX(xcheck.data.min_dscr)} sub={`LLCR ${fmtX(xcheck.data.llcr)} · bankable: ${xcheck.data.is_bankable ? 'yes' : 'no'}`} />
            <Kpi label="Min DSCR — PF engine (P90)" value={fmtX(xcheck.data.stress_min_dscr)} sub={`vs this sizer P90 min ${fmtX(res.lender_case_p90.min_dscr)}`} color={T.red} />
          </div>
        )}
        {xcheck.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>{mode === 'derive' ? 'Run the sizing first, then cross-check.' : 'Cross-check requires derive mode (the PF engine needs generation parameters).'}</div>}
        {xcheck.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Project-finance engine unreachable — cross-check unavailable. Error: {String(xcheck.error)}</div>}
      </div>

      {/* ── Benchmarks ────────────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Market DSCR / gearing / tenor / structuring benchmarks</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/pf-debt-sizing/ref/dscr-benchmarks</span>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Hand-authored market conventions — not live quotes</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={bench.status} demoText={bench.error} /></div>
        </div>
        {bench.status === 'live' && bench.data && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Contract type</th><th style={thR}>DSCR contracted</th><th style={thR}>DSCR merchant</th>
                  <th style={thR}>Max gearing</th><th style={th}>Typical tenor</th><th style={th}>Note</th>
                </tr>
              </thead>
              <tbody>
                {bench.data.benchmarks.map((b, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600, color: T.navy }}>{b.contract_type}</td>
                    <td style={tdMono}>{b.target_dscr_contracted != null ? fmtX(b.target_dscr_contracted) : '—'}</td>
                    <td style={tdMono}>{b.target_dscr_merchant != null ? fmtX(b.target_dscr_merchant) : '—'}</td>
                    <td style={tdMono}>{fmtPct(b.max_gearing_pct, 0)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{b.typical_tenor_years}</td>
                    <td style={td}>{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bench.data.structure_benchmarks && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
                {[['llcr_plcr_conventions', 'LLCR / PLCR conventions', ['metric', 'typical_target', 'note']],
                  ['mezz_conventions', 'Mezzanine conventions', ['item', 'typical', 'note']],
                  ['mini_perm_conventions', 'Mini-perm conventions', ['item', 'typical', 'note']],
                  ['sustainability_conventions', 'Sustainability conventions', ['item', 'typical', 'note']]].map(([key, title, cols]) => (
                  <div key={key} style={{ flex: 1, minWidth: 300 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>{title}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {(bench.data.structure_benchmarks[key] || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ ...td, fontWeight: 600, color: T.navy, fontSize: 11 }}>{r[cols[0]]}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{r[cols[1]]}</td>
                            <td style={{ ...td, fontSize: 10.5, color: T.sub }}>{r[cols[2]]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>{bench.data.basis_note} (as of {bench.data.as_of})</div>
          </>
        )}
        {bench.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Benchmark reference unavailable. Error: {String(bench.error)}</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/pf_debt_sizing.py — multi-metric sculpting (DS_t = CFADS_t / target_t blended by revenue mix;
        debt = min of DSCR-sculpted PV, LLCR cap, PLCR cap, gearing cap; sweep as prepayment; DSRA = months of forward DS,
        equity-funded) + mezz-on-residual tranching, mini-perm refi-risk, user-FX-path conversion &amp; stress, bisection
        breakevens, and the green/SLL overlay with carbon-stressed re-sizing. Cross-check: services/project_finance_engine.py
        via /api/v1/project-finance/calculate. Deterministic — no PRNG.
      </div>
    </div>
  );
}
