import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, LineChart, Line, ReferenceLine, ComposedChart, Area,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Financial Modeling Studio (NX2-16 flagship)
// Ultra-detailed project/IPP financial model — ALL math is server-side in
// backend/api/v1/routes/financial_model_engine.py (documented formulas):
//   GET  /api/v1/financial-model/ref/templates   (3 labeled illustrative sets)
//   POST /api/v1/financial-model/run             (waterfall, 3-statement, IRR/DSCR/LLCR/PLCR;
//                                                 optional climate case + baseline + deltas;
//                                                 refi §8 with no-refi comparison; inflation §9
//                                                 real IRR; working capital §10; SLL ratchet §11;
//                                                 sustainability block §12 on every run)
//   POST /api/v1/financial-model/consolidate     (portfolio §13: 2–5 assets, portfolio DSCR,
//                                                 diversification proxy, HoldCo layer)
//   POST /api/v1/financial-model/scenario-matrix (same deal × every NGFS scenario + user-designed
//                                                 custom carbon/GDP paths; per-scenario
//                                                 sustainability block)
//   POST /api/v1/financial-model/sensitivity     (1D/2D grids + tornado)
//   POST /api/v1/financial-model/simulate        (Halton QMC — deterministic, no PRNG)
//   POST /api/v1/financial-model/solve           (goal-seek: 6 instruments × 4 metrics §14)
//   POST /api/v1/financial-model/solve-frontier  (gearing × PPA iso-metric curve §14)
//   GET  /api/v1/ngfs-extract/scenarios          (NGFS Phase 5 seeded extract — picker)
// Climate channels (carbon cost/pass-through/GDP-β transition; chronic/acute/
// insurance/downtime physical) flow THROUGH the engine's own waterfall and
// statements — this page renders engine output only.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const STREAM_COLORS = {
  revenue_ppa: T.navy, revenue_merchant: T.indigo, revenue_capacity: T.purple,
  revenue_rec: T.teal, revenue_carbon: T.green,
};
const STREAM_LABELS = {
  revenue_ppa: 'PPA', revenue_merchant: 'Merchant', revenue_capacity: 'Capacity',
  revenue_rec: 'RECs', revenue_carbon: 'Carbon',
};

const DRIVERS = [
  'ppa_price', 'merchant_price', 'capex', 'gearing', 'capacity_factor',
  'opex_fixed', 'debt_rate', 'degradation', 'carbon_price', 'rec_price',
  'capture_rate',
];
const DRIVER_LABELS = {
  ppa_price: 'PPA price', merchant_price: 'Merchant price', capex: 'Capex',
  gearing: 'Gearing', capacity_factor: 'Capacity factor', opex_fixed: 'Fixed opex',
  debt_rate: 'Debt rate', degradation: 'Degradation', carbon_price: 'Carbon price',
  rec_price: 'REC price', capture_rate: 'Merchant capture rate', refi_year: 'Refi year',
};
const SOLVE_METRICS = {
  equity_irr: 'Equity IRR (fraction)', min_dscr: 'Min senior DSCR',
  llcr: 'LLCR (×)', carbon_adjusted_irr: 'Carbon-adjusted IRR (fraction)',
};

const fmtM = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`;
const fmtNum = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${(Number(v) * 100).toFixed(d)}%`;
const fmtX = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}x`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live — server-side model</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Chip = ({ ok, textOk, textBad }) => (
  <span style={{
    background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b',
    padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: T.mono,
  }}>{ok ? textOk : textBad}</span>
);

const inputStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px',
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' };
const td = { fontSize: 11.5, color: T.slate, padding: '5px 8px', borderBottom: `1px solid ${T.border}`, fontFamily: T.mono, whiteSpace: 'nowrap' };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const secTitle = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const btn = (active = true) => ({
  background: active ? T.navy : T.sub, color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed', fontFamily: T.font,
});

// Ensure the newer engine config blocks exist on template inputs (older
// cached payloads) — refinancing §8, WC §10, inflation §9, sustainability §12,
// per-tranche SLL §11. Values mirror the engine's Pydantic defaults.
const SLL_DEFAULT = {
  enabled: false, kpi: 'emissions_intensity', target_start: 0.05, target_end: 0.02,
  step_up_bp: 25, step_down_bp: 10,
};
const withEngineDefaults = (raw) => {
  const inp = withClimateDefaults(raw);
  return {
    ...inp,
    refinancing: inp.refinancing || {
      enabled: false, year: 7, new_rate_pct: 4.5, new_tenor_years: 12,
      new_gearing_pct: null, fees_pct: 1.5, new_amort_type: 'annuity', new_target_dscr: 1.3,
    },
    working_capital: inp.working_capital || { receivable_days: 0, payable_days: 0 },
    inflation: inp.inflation || { enabled: false, mode: 'nominal', flat_pct: 2.0, curve_pct: null },
    sustainability: inp.sustainability || { shadow_carbon_price_usd_t: 50, grid_baseline_intensity_t_per_mwh: 0.45 },
    tranches: inp.tranches.map((t) => (t.sll ? t : { ...t, sll: { ...SLL_DEFAULT } })),
  };
};

// Ensure a climate block exists on template inputs (older cached payloads)
const withClimateDefaults = (inp) => (inp.climate ? inp : {
  ...inp,
  climate: {
    enabled: false, start_year: 2027,
    transition: {
      carbon_price_mode: 'none', ngfs_scenario: 'net_zero_2050', ngfs_region: 'World',
      custom_carbon_price_path: null, emissions_intensity_t_per_mwh: 0, fixed_emissions_t_per_yr: 0,
      merchant_passthrough_pct: 0, grid_marginal_intensity_t_per_mwh: 0.35,
      index_carbon_revenue_to_path: false, gdp_beta_merchant: 0,
    },
    physical: {
      chronic_derate_pct_yr: 0, acute_eal_pct_of_capex: 0, acute_escalation_pct_yr: 0,
      insurance_escalation_pct_yr: 0, downtime_days_per_yr: 0,
    },
  },
});

// deep set on a JSON-cloned inputs object
const setIn = (obj, path, value) => {
  const clone = JSON.parse(JSON.stringify(obj));
  let cur = clone;
  for (let i = 0; i < path.length - 1; i += 1) cur = cur[path[i]];
  cur[path[path.length - 1]] = value;
  return clone;
};

const Num = ({ inputs, path, onChange, step = 'any', width = 110 }) => {
  const val = path.reduce((o, k) => (o == null ? o : o[k]), inputs);
  return (
    <input type="number" step={step} style={{ ...inputStyle, width }} value={val ?? ''}
      onChange={(e) => onChange(setIn(inputs, path, e.target.value === '' ? 0 : parseFloat(e.target.value)))} />
  );
};

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, color: T.sub, fontWeight: 600, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
    {label}
    {children}
  </label>
);

const Panel = ({ title, note, children }) => (
  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, background: '#fdfcfa' }}>
    <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 2 }}>{title}</div>
    {note && <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>{note}</div>}
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>
  </div>
);

// IRR heat colour: red (low) → cream → green (high), display-level only
const heatColor = (v, lo, hi) => {
  if (v == null || isNaN(v)) return '#f1f5f9';
  const x = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
  const lerp = (a, b) => Math.round(a + (b - a) * x);
  return `rgb(${lerp(239, 21)}, ${lerp(154, 128)}, ${lerp(154, 61)}, 0.55)`;
};

export default function FinancialModelingStudioPage() {
  const [tab, setTab] = useState('setup');
  const [templates, setTemplates] = useState({ status: 'loading', list: [], error: null });
  const [templateId, setTemplateId] = useState('solar_100mw');
  const [inputs, setInputs] = useState(null);

  const [run, setRun] = useState({ status: 'idle', result: null, error: null });
  const [sens, setSens] = useState({ status: 'idle', data: null, error: null });
  const [sim, setSim] = useState({ status: 'idle', data: null, error: null });
  const [solve, setSolve] = useState({ status: 'idle', data: null, error: null });

  const [stmtView, setStmtView] = useState('income');
  const [scenarios, setScenarios] = useState([]);           // saved locally: {name, metrics}
  const [scenName, setScenName] = useState('');
  const [sensCfg, setSensCfg] = useState({ param_x: 'ppa_price', range_x_pct: 30, steps_x: 7, param_y: 'capex', range_y_pct: 20, steps_y: 5, tornado_pct: 10 });
  const [uncertain, setUncertain] = useState([
    { param: 'ppa_price', dist: 'triangular', low: 0.85, mode: 1.0, high: 1.10 },
    { param: 'merchant_price', dist: 'triangular', low: 0.60, mode: 1.0, high: 1.40 },
    { param: 'capex', dist: 'triangular', low: 0.92, mode: 1.0, high: 1.15 },
    { param: 'capacity_factor', dist: 'triangular', low: 0.92, mode: 1.0, high: 1.05 },
    { param: 'opex_fixed', dist: 'uniform', low: 0.90, mode: 1.0, high: 1.20 },
  ]);
  const [simCfg, setSimCfg] = useState({ n_scenarios: 500, hurdle_irr_pct: 10 });
  const [solveCfg, setSolveCfg] = useState({ solve_for: 'ppa_price', target_metric: 'equity_irr', target_value: 0.10 });

  // Climate & scenario-matrix state
  const [ngfs, setNgfs] = useState({ status: 'loading', scenarios: [], error: null });
  const [matrix, setMatrix] = useState({ status: 'idle', data: null, error: null });
  const [stmtSide, setStmtSide] = useState('climate');   // statements toggle: climate ↔ baseline
  // Custom scenario designer (climate tab): paths entered as comma-separated $/t
  const [customScens, setCustomScens] = useState([]);   // {name, cp:'20,40,60', gdp:''}
  // Portfolio (POST /consolidate) state
  const [portAssets, setPortAssets] = useState([
    { name: 'Solar A', template_id: 'solar_100mw' },
    { name: 'BESS B', template_id: 'bess_400mwh' },
  ]);
  const [holdco, setHoldco] = useState({ enabled: true, debt_musd: 30, rate_pct: 7.5, tenor_years: 10, lockup_dscr: 1.2 });
  const [port, setPort] = useState({ status: 'idle', data: null, error: null });
  // Solve-frontier state
  const [frontCfg, setFrontCfg] = useState({ target_metric: 'equity_irr', target_value: 0.12, gearing_min_pct: 45, gearing_max_pct: 85, gearing_steps: 7 });
  const [frontier, setFrontier] = useState({ status: 'idle', data: null, error: null });

  // ── Templates ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    axios.get('/api/v1/financial-model/ref/templates', { timeout: 20000 })
      .then(({ data }) => {
        if (!alive) return;
        setTemplates({ status: 'live', list: data.templates || [], error: null });
        const t = (data.templates || []).find((x) => x.id === 'solar_100mw') || (data.templates || [])[0];
        if (t) setInputs(withEngineDefaults(t.inputs));
      })
      .catch((e) => alive && setTemplates({ status: 'demo', list: [], error: e?.response?.data?.detail || e.message }));
    return () => { alive = false; };
  }, []);

  // ── NGFS Phase 5 scenario list (live from the platform extract) ────────────
  useEffect(() => {
    let alive = true;
    axios.get('/api/v1/ngfs-extract/scenarios', { timeout: 20000 })
      .then(({ data }) => alive && setNgfs({ status: 'live', scenarios: data.scenarios || [], error: null }))
      .catch((e) => alive && setNgfs({ status: 'demo', scenarios: [], error: e?.response?.data?.detail || e.message }));
    return () => { alive = false; };
  }, []);

  const pickTemplate = (id) => {
    setTemplateId(id);
    const t = templates.list.find((x) => x.id === id);
    if (t) {
      setInputs(withEngineDefaults(JSON.parse(JSON.stringify(t.inputs))));
      setRun({ status: 'idle', result: null, error: null });
      setSens({ status: 'idle', data: null, error: null });
      setSim({ status: 'idle', data: null, error: null });
      setSolve({ status: 'idle', data: null, error: null });
      setMatrix({ status: 'idle', data: null, error: null });
    }
  };

  // ── Engine calls ───────────────────────────────────────────────────────────
  const runModel = useCallback(async () => {
    if (!inputs) return null;
    setRun({ status: 'loading', result: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/financial-model/run', inputs, { timeout: 60000 });
      setRun({ status: 'live', result: data.result, error: null });
      return data.result;
    } catch (e) {
      setRun({ status: 'demo', result: null, error: e?.response?.data?.detail || e.message });
      return null;
    }
  }, [inputs]);

  const runSensitivity = useCallback(async () => {
    if (!inputs) return;
    setSens({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/financial-model/sensitivity', {
        inputs, param_x: sensCfg.param_x, range_x_pct: sensCfg.range_x_pct, steps_x: sensCfg.steps_x,
        param_y: sensCfg.param_y || null, range_y_pct: sensCfg.range_y_pct, steps_y: sensCfg.steps_y,
        tornado_pct: sensCfg.tornado_pct,
      }, { timeout: 120000 });
      setSens({ status: 'live', data, error: null });
    } catch (e) {
      setSens({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [inputs, sensCfg]);

  const runSimulate = useCallback(async () => {
    if (!inputs) return;
    setSim({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/financial-model/simulate', {
        inputs, n_scenarios: simCfg.n_scenarios, hurdle_irr_pct: simCfg.hurdle_irr_pct, uncertain,
      }, { timeout: 180000 });
      setSim({ status: 'live', data, error: null });
    } catch (e) {
      setSim({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [inputs, simCfg, uncertain]);

  const runSolve = useCallback(async () => {
    if (!inputs) return;
    setSolve({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/financial-model/solve', { inputs, ...solveCfg }, { timeout: 120000 });
      setSolve({ status: 'live', data, error: null });
    } catch (e) {
      setSolve({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [inputs, solveCfg]);

  // Parse '20, 40, 60' → [20,40,60]; null when empty/invalid
  const parsePath = (s) => {
    const v = String(s || '').split(',').map((x) => parseFloat(x.trim())).filter((x) => !isNaN(x));
    return v.length ? v : null;
  };

  const runMatrix = useCallback(async () => {
    if (!inputs) return;
    setMatrix({ status: 'loading', data: null, error: null });
    try {
      const custom_scenarios = customScens
        .filter((c) => c.name.trim() && parsePath(c.cp))
        .map((c) => ({
          name: c.name.trim(),
          carbon_price_path: parsePath(c.cp),
          gdp_impact_pct_path: parsePath(c.gdp),
        }));
      const { data } = await axios.post('/api/v1/financial-model/scenario-matrix',
        { inputs, custom_scenarios }, { timeout: 180000 });
      setMatrix({ status: 'live', data, error: null });
    } catch (e) {
      setMatrix({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [inputs, customScens]);

  const runPortfolio = useCallback(async () => {
    setPort({ status: 'loading', data: null, error: null });
    try {
      const assets = portAssets.map((a) => (
        a.template_id === '__current__'
          ? { name: a.name || inputs.project_name, inputs }
          : { name: a.name, template_id: a.template_id }));
      const { data } = await axios.post('/api/v1/financial-model/consolidate',
        { assets, holdco, discount_rate_pct: inputs?.discount_rate_pct ?? 8 }, { timeout: 180000 });
      setPort({ status: 'live', data, error: null });
    } catch (e) {
      setPort({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [portAssets, holdco, inputs]);

  const runFrontier = useCallback(async () => {
    if (!inputs) return;
    setFrontier({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/financial-model/solve-frontier',
        { inputs, ...frontCfg }, { timeout: 300000 });
      setFrontier({ status: 'live', data, error: null });
    } catch (e) {
      setFrontier({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [inputs, frontCfg]);

  const saveScenario = async () => {
    const name = scenName.trim() || `Scenario ${scenarios.length + 1}`;
    const result = run.status === 'live' && run.result ? run.result : await runModel();
    if (!result) return;
    setScenarios((prev) => [...prev, {
      name, metrics: result.metrics, sizing: result.sizing,
      minDscr: result.metrics.min_dscr_senior, lockups: result.covenants.lockup_periods.length,
    }]);
    setScenName('');
  };

  // ── Derived display data (display-level only; all model math is server-side) ─
  const res = run.result;
  // When a climate run is active, the statements tab can toggle between the
  // climate case (primary result) and the engine's no-climate baseline rerun.
  const climateActive = !!(res && res.climate && res.climate.enabled && res.baseline);
  const viewRes = useMemo(
    () => ((climateActive && stmtSide === 'baseline') ? res.baseline : res),
    [res, stmtSide, climateActive],
  );
  const revChart = useMemo(() => (viewRes ? viewRes.periods.map((p) => ({
    period: p.period, revenue_ppa: p.revenue_ppa, revenue_merchant: p.revenue_merchant,
    revenue_capacity: p.revenue_capacity, revenue_rec: p.revenue_rec, revenue_carbon: p.revenue_carbon,
  })) : []), [viewRes]);
  const dscrChart = useMemo(() => (viewRes ? viewRes.periods.map((p) => ({
    period: p.period, dscr: p.dscr_by_tranche[0], cfads: p.cfads,
    ds: p.ds_by_tranche.reduce((s, x) => s + x, 0),
  })) : []), [viewRes]);
  // period → climate CFADS delta (for the waterfall table's Δ column)
  const cfadsDelta = useMemo(() => {
    if (!res || !res.climate_impact) return null;
    return Object.fromEntries(res.climate_impact.per_year.map((r) => [r.period, r.cfads_delta]));
  }, [res]);
  // Baseline vs climate senior DSCR overlay (Climate & Scenarios tab)
  const climDscrChart = useMemo(() => {
    if (!climateActive) return null;
    return res.periods.map((p, i) => ({
      period: p.period,
      climate: p.dscr_by_tranche[0],
      baseline: res.baseline.periods[i] ? res.baseline.periods[i].dscr_by_tranche[0] : null,
      locked: p.locked_up,
    }));
  }, [res, climateActive]);
  // Channel decomposition chart (costs negative, uplift positive) + EBITDA Δ line
  const climChannelChart = useMemo(() => {
    if (!res || !res.climate_impact) return null;
    return res.climate_impact.per_year.map((r) => ({
      year: r.calendar_year,
      carbon_cost: -r.carbon_cost, acute_eal: -r.acute_eal, insurance_extra: -r.insurance_extra,
      uplift_revenue: r.merchant_uplift_revenue, ebitda_delta: r.ebitda_delta,
    }));
  }, [res]);
  // Scenario-matrix DSCR paths, one series per scenario
  const matrixDscrChart = useMemo(() => {
    if (!matrix.data) return null;
    const out = [];
    for (let t = 0; t < matrix.data.periods; t += 1) {
      const row = { period: t + 1 };
      matrix.data.rows.forEach((r) => { row[r.label] = r.dscr_path[t]; });
      out.push(row);
    }
    return out;
  }, [matrix.data]);
  const SCEN_COLORS = [T.slate, T.green, T.teal, T.amber, T.red, T.purple, T.indigo];

  const gridBounds = useMemo(() => {
    if (!sens.data) return null;
    const vals = sens.data.grid.cells.flat().map((c) => c.equity_irr).filter((v) => v != null);
    return vals.length ? { lo: Math.min(...vals), hi: Math.max(...vals) } : null;
  }, [sens.data]);

  // ── Refinancing tab: with/without-refi DSCR + distribution overlays ────────
  const refiChart = useMemo(() => {
    if (!res || !res.refinancing) return null;
    return res.periods.map((p, i) => ({
      period: p.period,
      with_refi: p.dscr_by_tranche[0],
      without_refi: res.refinancing.no_refi_dscr_path[i],
      dist_with: p.distribution,
      dist_without: res.refinancing.no_refi_distributions[i],
    }));
  }, [res]);

  // ── Sustainability tab: intensity vs SLL target path + ratchet events ──────
  const sllTranche = inputs ? inputs.tranches.find((t) => t.sll && t.sll.enabled) : null;
  const intensityChart = useMemo(() => {
    if (!res || !res.sustainability) return null;
    const Y = res.sustainability.per_year.length;
    return res.sustainability.per_year.map((row, i) => {
      const p = res.periods[i];
      const tgt = sllTranche && sllTranche.sll.kpi === 'emissions_intensity'
        ? sllTranche.sll.target_start + (sllTranche.sll.target_end - sllTranche.sll.target_start) * (i / Math.max(Y - 1, 1))
        : null;
      const adj = p && p.sll_adj_bp_by_tranche ? p.sll_adj_bp_by_tranche[0] : 0;
      return {
        period: row.period, intensity: row.emissions_intensity_t_per_mwh, target: tgt,
        stepUp: adj > 0, stepDown: adj < 0, adj_bp: adj,
        carbon_cost_share: row.carbon_cost_share_of_opex,
        avoided: row.avoided_emissions_tco2e,
      };
    });
  }, [res, sllTranche]);
  const irrBridge = useMemo(() => {
    if (!res) return null;
    const m = res.metrics;
    const bars = [{ name: 'Nominal equity IRR', v: m.equity_irr, color: T.navy }];
    if (m.real_equity_irr != null) bars.push({ name: 'Real (deflated) IRR', v: m.real_equity_irr, color: T.indigo });
    if (m.carbon_adjusted_equity_irr != null) bars.push({ name: 'Carbon-adjusted IRR', v: m.carbon_adjusted_equity_irr, color: T.teal });
    return bars.filter((b) => b.v != null);
  }, [res]);

  // ── Portfolio tab: combined CFADS/DS + portfolio DSCR chart ────────────────
  const portChart = useMemo(() => {
    if (!port.data) return null;
    return port.data.combined.map((c) => ({
      period: c.period, cfads: c.cfads, ds: c.debt_service, dscr: c.portfolio_dscr,
      lo: c.constituent_dscr_min, hi: c.constituent_dscr_max, dist: c.distributions,
    }));
  }, [port.data]);

  // ── Frontier chart data ─────────────────────────────────────────────────────
  const frontierChart = useMemo(() => {
    if (!frontier.data) return null;
    return frontier.data.points.filter((p) => p.attainable).map((p) => ({
      gearing: p.gearing_pct, ppa: p.ppa_price_usd_mwh, achieved: p.achieved_metric,
    }));
  }, [frontier.data]);

  const nTr = inputs ? inputs.tranches.length : 0;

  if (!inputs) {
    return (
      <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>Financial Modeling Studio</h1>
        {templates.status === 'loading' && <div style={{ fontSize: 13, color: T.sub }}>Loading templates from the model engine…</div>}
        {templates.status === 'demo' && (
          <div style={{ ...card, background: '#fdf4f4', border: `1px solid ${T.red}33` }}>
            <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>Model engine unreachable — no figures shown (this page never fabricates results).</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>GET /api/v1/financial-model/ref/templates failed: {String(templates.error)}</div>
          </div>
        )}
      </div>
    );
  }

  const TABS = [
    ['setup', 'Model Setup'], ['statements', 'Statements & Waterfall'],
    ['climate', 'Climate & Scenarios'], ['refi', 'Refinancing'],
    ['portfolio', 'Portfolio'], ['sustain', 'Sustainability'],
    ['sensitivity', 'Sensitivity'], ['risk', 'Risk (QMC)'], ['solver', 'Solver'],
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-16</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Financial Modeling Studio</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Period-by-period waterfall</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>3-statement, circularity iterated</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Halton QMC — no PRNG</span>
          <span style={{ background: T.green + '22', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>NGFS climate channels in-model</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 14, maxWidth: 1080 }}>
        Full project/IPP financial model at bank project-finance level: monthly construction S-curve with IDC, multi-stream revenue
        (PPA / merchant / capacity / REC / carbon), 1–2 debt tranches (sculpted / annuity / bullet, fixed or floating + pay-fixed swap),
        DSRA/MRA reserves, priority-of-payments waterfall with cash sweep and DSCR lock-up trap, MACRS or straight-line tax with
        loss-carryforward, and IDC/DSRA/sculpting circularity resolved by fixed-point iteration. <b>All computation is server-side</b>;
        every formula is documented in <span style={{ fontFamily: T.mono, fontSize: 11 }}>financial_model_engine.py</span>.
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? T.navy : T.card, color: tab === id ? '#fff' : T.navy,
            border: `1px solid ${tab === id ? T.navy : T.border}`, borderRadius: 8,
            padding: '8px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge status={run.status} demoText={run.error} />
          <button onClick={runModel} style={btn(true)}>Run model →</button>
        </div>
      </div>

      {/* ═══ TAB: MODEL SETUP ═══════════════════════════════════════════════ */}
      {tab === 'setup' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Starting Template</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Hand-authored illustrative defaults — editable, not market quotes</span>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/financial-model/ref/templates</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={templates.status} demoText={templates.error} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {templates.list.map((t) => (
                <button key={t.id} onClick={() => pickTemplate(t.id)} style={{
                  flex: 1, minWidth: 220, textAlign: 'left', cursor: 'pointer',
                  background: templateId === t.id ? T.navy : '#fdfcfa', color: templateId === t.id ? '#fff' : T.navy,
                  border: `1px solid ${templateId === t.id ? T.navy : T.border}`, borderRadius: 8, padding: '12px 14px',
                }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{t.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3, fontFamily: T.mono }}>{t.id}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Model Inputs — {inputs.project_name}</h2>
              <span style={{ fontSize: 11, color: T.sub }}>every input editable; the engine recomputes everything on Run</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
              <Panel title="Timeline" note="Annual operations; quarterly is a period-scaling parameter in the engine">
                <Field label="Construction (months)"><Num inputs={inputs} path={['timeline', 'construction_months']} onChange={setInputs} width={90} /></Field>
                <Field label="Operations (years)"><Num inputs={inputs} path={['timeline', 'operations_years']} onChange={setInputs} width={90} /></Field>
                <Field label="Discount rate %"><Num inputs={inputs} path={['discount_rate_pct']} onChange={setInputs} width={90} /></Field>
              </Panel>
              <Panel title="Capex & drawdown S-curve" note="IDC is computed and capitalized by the engine (circularity iterated)">
                <Field label="Total capex $M"><Num inputs={inputs} path={['capex', 'total_capex_musd']} onChange={setInputs} /></Field>
                <Field label="Curve">
                  <select style={{ ...inputStyle, width: 110 }} value={inputs.capex.drawdown_curve}
                    onChange={(e) => setInputs(setIn(inputs, ['capex', 'drawdown_curve'], e.target.value))}>
                    <option value="logistic">logistic</option><option value="linear">linear</option>
                  </select>
                </Field>
                <Field label="Logistic steepness k"><Num inputs={inputs} path={['capex', 'logistic_steepness']} onChange={setInputs} width={90} /></Field>
              </Panel>
              <Panel title="Generation" note="Volume = MW × NCF × 8760 × (1 − degradation)^t">
                <Field label="Capacity MW"><Num inputs={inputs} path={['generation', 'capacity_mw']} onChange={setInputs} width={90} /></Field>
                <Field label="NCF P50"><Num inputs={inputs} path={['generation', 'capacity_factor_p50']} onChange={setInputs} width={80} step="0.005" /></Field>
                <Field label="NCF P90"><Num inputs={inputs} path={['generation', 'capacity_factor_p90']} onChange={setInputs} width={80} step="0.005" /></Field>
                <Field label="NCF P99"><Num inputs={inputs} path={['generation', 'capacity_factor_p99']} onChange={setInputs} width={80} step="0.005" /></Field>
                <Field label="Case">
                  <select style={{ ...inputStyle, width: 80 }} value={inputs.generation.production_case}
                    onChange={(e) => setInputs(setIn(inputs, ['generation', 'production_case'], e.target.value))}>
                    <option>P50</option><option>P90</option><option>P99</option>
                  </select>
                </Field>
                <Field label="Degradation %/yr"><Num inputs={inputs} path={['generation', 'degradation_pct_yr']} onChange={setInputs} width={90} step="0.1" /></Field>
              </Panel>

              {[
                ['ppa', 'PPA', [['price_usd_mwh', '$/MWh'], ['escalation_pct', 'Esc %'], ['contracted_pct', 'Contracted %'], ['tenor_years', 'Tenor yrs']]],
                ['merchant', 'Merchant', [['price_usd_mwh', '$/MWh'], ['escalation_pct', 'Esc %'], ['capture_rate_pct', 'Capture %']]],
                ['capacity', 'Capacity', [['usd_per_mw_yr', '$/MW-yr'], ['escalation_pct', 'Esc %']]],
                ['rec', 'RECs', [['usd_per_mwh', '$/MWh'], ['tenor_years', 'Tenor yrs']]],
                ['carbon', 'Carbon credits', [['tonnes_per_yr', 't/yr'], ['usd_per_tonne', '$/t'], ['escalation_pct', 'Esc %']]],
              ].map(([key, label, fields]) => (
                <Panel key={key} title={`Revenue — ${label}`}>
                  <Field label="Enabled">
                    <input type="checkbox" checked={inputs.revenue[key].enabled}
                      onChange={(e) => setInputs(setIn(inputs, ['revenue', key, 'enabled'], e.target.checked))}
                      style={{ width: 18, height: 18 }} />
                  </Field>
                  {fields.map(([f, fl]) => (
                    <Field key={f} label={fl}><Num inputs={inputs} path={['revenue', key, f]} onChange={setInputs} width={90} /></Field>
                  ))}
                </Panel>
              ))}

              <Panel title="Opex & reserves" note="MRA funds major-maintenance events; maintenance is paid from the MRA balance">
                <Field label="Fixed $/MW-yr"><Num inputs={inputs} path={['opex', 'fixed_usd_per_mw_yr']} onChange={setInputs} /></Field>
                <Field label="Fixed esc %"><Num inputs={inputs} path={['opex', 'fixed_escalation_pct']} onChange={setInputs} width={70} /></Field>
                <Field label="Variable $/MWh"><Num inputs={inputs} path={['opex', 'variable_usd_per_mwh']} onChange={setInputs} width={80} /></Field>
                <Field label="Insurance % capex/yr"><Num inputs={inputs} path={['opex', 'insurance_pct_capex_yr']} onChange={setInputs} width={80} step="0.1" /></Field>
                <Field label="Land lease k$/yr"><Num inputs={inputs} path={['opex', 'land_lease_kusd_yr']} onChange={setInputs} width={80} /></Field>
                <Field label="MRA $M/yr"><Num inputs={inputs} path={['opex', 'mra_annual_contribution_musd']} onChange={setInputs} width={70} step="0.1" /></Field>
                <Field label="MRA funding yrs"><Num inputs={inputs} path={['opex', 'mra_funding_years']} onChange={setInputs} width={70} /></Field>
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Major-maintenance events</div>
                  {inputs.opex.major_maintenance.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.sub }}>Year</span>
                      <Num inputs={inputs} path={['opex', 'major_maintenance', i, 'year']} onChange={setInputs} width={64} />
                      <span style={{ fontSize: 11, color: T.sub }}>Cost $M</span>
                      <Num inputs={inputs} path={['opex', 'major_maintenance', i, 'cost_musd']} onChange={setInputs} width={72} step="0.5" />
                      <button onClick={() => setInputs(setIn(inputs, ['opex', 'major_maintenance'], inputs.opex.major_maintenance.filter((_, j) => j !== i)))}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setInputs(setIn(inputs, ['opex', 'major_maintenance'], [...inputs.opex.major_maintenance, { year: 10, cost_musd: 5 }]))}
                    style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 6, color: T.navy, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '4px 10px' }}>+ event</button>
                </div>
              </Panel>

              {inputs.tranches.map((tr, i) => (
                <Panel key={i} title={`Debt tranche ${i + 1} — ${tr.name}`}
                  note="Sculpted: DS = CFADS / target DSCR · Annuity: level payment · Bullet: interest-only">
                  <Field label="Name">
                    <input style={{ ...inputStyle, width: 110 }} value={tr.name}
                      onChange={(e) => setInputs(setIn(inputs, ['tranches', i, 'name'], e.target.value))} />
                  </Field>
                  <Field label="Sizing">
                    <select style={{ ...inputStyle, width: 100 }} value={tr.sizing}
                      onChange={(e) => setInputs(setIn(inputs, ['tranches', i, 'sizing'], e.target.value))}>
                      <option value="gearing">gearing %</option><option value="amount">amount $M</option>
                    </select>
                  </Field>
                  {tr.sizing === 'gearing'
                    ? <Field label="Gearing %"><Num inputs={inputs} path={['tranches', i, 'gearing_pct']} onChange={setInputs} width={70} /></Field>
                    : <Field label="Amount $M"><Num inputs={inputs} path={['tranches', i, 'amount_musd']} onChange={setInputs} width={80} /></Field>}
                  <Field label="Amortization">
                    <select style={{ ...inputStyle, width: 100 }} value={tr.amort_type}
                      onChange={(e) => setInputs(setIn(inputs, ['tranches', i, 'amort_type'], e.target.value))}>
                      <option value="sculpted">sculpted</option><option value="annuity">annuity</option><option value="bullet">bullet</option>
                    </select>
                  </Field>
                  {tr.amort_type === 'sculpted' && <Field label="Target DSCR"><Num inputs={inputs} path={['tranches', i, 'target_dscr']} onChange={setInputs} width={70} step="0.05" /></Field>}
                  <Field label="Rate type">
                    <select style={{ ...inputStyle, width: 90 }} value={tr.rate_type}
                      onChange={(e) => setInputs(setIn(inputs, ['tranches', i, 'rate_type'], e.target.value))}>
                      <option value="fixed">fixed</option><option value="floating">floating</option>
                    </select>
                  </Field>
                  {tr.rate_type === 'fixed'
                    ? <Field label="Fixed rate %"><Num inputs={inputs} path={['tranches', i, 'fixed_rate_pct']} onChange={setInputs} width={70} step="0.05" /></Field>
                    : (
                      <>
                        <Field label="Base %"><Num inputs={inputs} path={['tranches', i, 'base_rate_pct']} onChange={setInputs} width={64} step="0.05" /></Field>
                        <Field label="Margin %"><Num inputs={inputs} path={['tranches', i, 'margin_pct']} onChange={setInputs} width={64} step="0.05" /></Field>
                        <Field label="Swap % notional"><Num inputs={inputs} path={['tranches', i, 'swap_notional_pct']} onChange={setInputs} width={70} /></Field>
                        <Field label="Swap fixed %"><Num inputs={inputs} path={['tranches', i, 'swap_fixed_rate_pct']} onChange={setInputs} width={70} step="0.05" /></Field>
                      </>
                    )}
                  <Field label="Tenor yrs"><Num inputs={inputs} path={['tranches', i, 'tenor_years']} onChange={setInputs} width={64} /></Field>
                  <Field label="DSRA months"><Num inputs={inputs} path={['tranches', i, 'dsra_months']} onChange={setInputs} width={64} /></Field>
                  <div style={{ width: '100%', borderTop: `1px dashed ${T.border}`, paddingTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', fontSize: 10.5, color: T.teal, fontFamily: T.mono, fontWeight: 700 }}>
                      SUSTAINABILITY-LINKED MARGIN RATCHET — Int = B × (r + adj_bp/10⁴); adj = +step-up bp when KPI worse than the linear target path, −step-down when better (KPI from the model's OWN emissions/generation)
                    </div>
                    <Field label="SLL enabled">
                      <input type="checkbox" checked={!!(tr.sll && tr.sll.enabled)} style={{ width: 18, height: 18 }}
                        onChange={(e) => setInputs(setIn(inputs, ['tranches', i, 'sll', 'enabled'], e.target.checked))} />
                    </Field>
                    <Field label="KPI">
                      <select style={{ ...inputStyle, width: 160 }} value={tr.sll ? tr.sll.kpi : 'emissions_intensity'}
                        onChange={(e) => setInputs(setIn(inputs, ['tranches', i, 'sll', 'kpi'], e.target.value))}>
                        <option value="emissions_intensity">emissions intensity t/MWh</option>
                        <option value="renewable_share">renewable share %</option>
                      </select>
                    </Field>
                    <Field label="Target yr 1"><Num inputs={inputs} path={['tranches', i, 'sll', 'target_start']} onChange={setInputs} width={70} step="0.005" /></Field>
                    <Field label="Target final yr"><Num inputs={inputs} path={['tranches', i, 'sll', 'target_end']} onChange={setInputs} width={70} step="0.005" /></Field>
                    <Field label="Step-up bp"><Num inputs={inputs} path={['tranches', i, 'sll', 'step_up_bp']} onChange={setInputs} width={64} /></Field>
                    <Field label="Step-down bp"><Num inputs={inputs} path={['tranches', i, 'sll', 'step_down_bp']} onChange={setInputs} width={64} /></Field>
                  </div>
                  {nTr > 1 && (
                    <button onClick={() => setInputs(setIn(inputs, ['tranches'], inputs.tranches.filter((_, j) => j !== i)))}
                      style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 10px' }}>Remove tranche</button>
                  )}
                </Panel>
              ))}
              {nTr < 2 && (
                <Panel title="Add mezzanine tranche">
                  <button onClick={() => setInputs(setIn(inputs, ['tranches'], [...inputs.tranches, {
                    name: 'Mezzanine', sizing: 'gearing', gearing_pct: 8, amount_musd: 0, amort_type: 'annuity',
                    target_dscr: 1.2, rate_type: 'fixed', fixed_rate_pct: 8.5, base_rate_pct: 4, base_rate_curve_pct: null,
                    margin_pct: 4.5, swap_notional_pct: 0, swap_fixed_rate_pct: 3.8, tenor_years: 10, dsra_months: 0,
                  }]))} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '8px 16px' }}>
                    + Add tranche 2
                  </button>
                </Panel>
              )}

              <Panel title="Waterfall, tax & covenants"
                note="Waterfall: rev → opex → tax → MRA → senior DS → senior DSRA → mezz DS → sweep → lock-up → distributions">
                <Field label="Cash sweep %"><Num inputs={inputs} path={['waterfall', 'cash_sweep_pct']} onChange={setInputs} width={70} /></Field>
                <Field label="Tax rate %"><Num inputs={inputs} path={['tax', 'rate_pct']} onChange={setInputs} width={64} /></Field>
                <Field label="Depreciation">
                  <select style={{ ...inputStyle, width: 130 }} value={inputs.tax.depreciation}
                    onChange={(e) => setInputs(setIn(inputs, ['tax', 'depreciation'], e.target.value))}>
                    <option value="straight_line">straight-line</option><option value="macrs">MACRS 5-yr</option>
                  </select>
                </Field>
                {inputs.tax.depreciation === 'straight_line' && <Field label="SL years"><Num inputs={inputs} path={['tax', 'sl_years']} onChange={setInputs} width={64} /></Field>}
                <Field label="Lock-up DSCR"><Num inputs={inputs} path={['covenants', 'lockup_dscr']} onChange={setInputs} width={70} step="0.05" /></Field>
                <Field label="Default DSCR"><Num inputs={inputs} path={['covenants', 'default_dscr']} onChange={setInputs} width={70} step="0.05" /></Field>
              </Panel>

              <Panel title="Refinancing event (§8)"
                note="Executed at END of year N after DS/DSRA/sweep, BEFORE the lock-up test. NewDebt = gearing%×C_total (blank = balance only); CashOut = NewDebt − balance − fee → distributions">
                <Field label="Enabled">
                  <input type="checkbox" checked={!!inputs.refinancing.enabled} style={{ width: 18, height: 18 }}
                    onChange={(e) => setInputs(setIn(inputs, ['refinancing', 'enabled'], e.target.checked))} />
                </Field>
                <Field label="Refi year"><Num inputs={inputs} path={['refinancing', 'year']} onChange={setInputs} width={60} /></Field>
                <Field label="New rate %"><Num inputs={inputs} path={['refinancing', 'new_rate_pct']} onChange={setInputs} width={70} step="0.05" /></Field>
                <Field label="New tenor yrs"><Num inputs={inputs} path={['refinancing', 'new_tenor_years']} onChange={setInputs} width={64} /></Field>
                <Field label="New gearing % (blank = balance)">
                  <input type="number" step="0.5" style={{ ...inputStyle, width: 90 }}
                    value={inputs.refinancing.new_gearing_pct ?? ''}
                    onChange={(e) => setInputs(setIn(inputs, ['refinancing', 'new_gearing_pct'],
                      e.target.value === '' ? null : parseFloat(e.target.value)))} />
                </Field>
                <Field label="Fees % of new debt"><Num inputs={inputs} path={['refinancing', 'fees_pct']} onChange={setInputs} width={64} step="0.05" /></Field>
                <Field label="New amortization">
                  <select style={{ ...inputStyle, width: 100 }} value={inputs.refinancing.new_amort_type}
                    onChange={(e) => setInputs(setIn(inputs, ['refinancing', 'new_amort_type'], e.target.value))}>
                    <option value="annuity">annuity</option><option value="sculpted">sculpted</option>
                  </select>
                </Field>
                {inputs.refinancing.new_amort_type === 'sculpted'
                  && <Field label="New target DSCR"><Num inputs={inputs} path={['refinancing', 'new_target_dscr']} onChange={setInputs} width={70} step="0.05" /></Field>}
              </Panel>

              <Panel title="Working capital & inflation (§9–§10)"
                note="AR = Rev×rec days/365, AP = Opex×pay days/365, ΔWC in CFADS & BS (terminal unwind). Inflation: I_t indexes merchant/capacity/fixed & var opex/lease in real-inputs mode; real IRR = IRR(CF_t / I_t)">
                <Field label="Receivable days"><Num inputs={inputs} path={['working_capital', 'receivable_days']} onChange={setInputs} width={64} /></Field>
                <Field label="Payable days"><Num inputs={inputs} path={['working_capital', 'payable_days']} onChange={setInputs} width={64} /></Field>
                <Field label="Inflation on">
                  <input type="checkbox" checked={!!inputs.inflation.enabled} style={{ width: 18, height: 18 }}
                    onChange={(e) => setInputs(setIn(inputs, ['inflation', 'enabled'], e.target.checked))} />
                </Field>
                <Field label="Mode">
                  <select style={{ ...inputStyle, width: 110 }} value={inputs.inflation.mode}
                    onChange={(e) => setInputs(setIn(inputs, ['inflation', 'mode'], e.target.value))}>
                    <option value="nominal">nominal</option><option value="real_inputs">real inputs</option>
                  </select>
                </Field>
                <Field label="Flat %/yr"><Num inputs={inputs} path={['inflation', 'flat_pct']} onChange={setInputs} width={64} step="0.1" /></Field>
                <Field label="Curve %/yr (comma, optional)">
                  <input style={{ ...inputStyle, width: 170 }} placeholder="e.g. 4, 3, 2.5, 2"
                    value={(inputs.inflation.curve_pct || []).join(', ')}
                    onChange={(e) => {
                      const v = e.target.value.split(',').map((x) => parseFloat(x.trim())).filter((x) => !isNaN(x));
                      setInputs(setIn(inputs, ['inflation', 'curve_pct'], v.length ? v : null));
                    }} />
                </Field>
              </Panel>

              <Panel title="Sustainability assumptions (§12)"
                note="Own emissions intensity lives under Climate → transition (used even when climate channels are off). Both parameters below are labeled user assumptions">
                <Field label="Shadow carbon price $/t"><Num inputs={inputs} path={['sustainability', 'shadow_carbon_price_usd_t']} onChange={setInputs} width={80} /></Field>
                <Field label="Grid baseline t/MWh"><Num inputs={inputs} path={['sustainability', 'grid_baseline_intensity_t_per_mwh']} onChange={setInputs} width={80} step="0.01" /></Field>
                <Field label="Own emissions t/MWh"><Num inputs={inputs} path={['climate', 'transition', 'emissions_intensity_t_per_mwh']} onChange={setInputs} width={80} step="0.01" /></Field>
                <Field label="Fixed emissions t/yr"><Num inputs={inputs} path={['climate', 'transition', 'fixed_emissions_t_per_yr']} onChange={setInputs} width={80} /></Field>
                <Field label="Renewable share %"><Num inputs={inputs} path={['generation', 'renewable_share_pct']} onChange={setInputs} width={70} /></Field>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB: STATEMENTS & WATERFALL ════════════════════════════════════ */}
      {tab === 'statements' && (
        <>
          {run.status === 'demo' && (
            <div style={{ ...card, background: '#fdf4f4', border: `1px solid ${T.red}33` }}>
              <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>Model engine unreachable — no figures shown (this page never fabricates results).</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>POST /api/v1/financial-model/run failed: {String(run.error)}</div>
            </div>
          )}
          {run.status === 'idle' && <div style={card}><div style={{ fontSize: 12.5, color: T.sub }}>Configure inputs in Model Setup and press <b>Run model</b>. The full period-by-period waterfall, three statements and metrics appear here.</div></div>}
          {run.status === 'loading' && <div style={card}><Badge status="loading" /></div>}
          {run.status === 'live' && viewRes && (
            <>
              {climateActive && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: T.teal + '22', color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 4, padding: '2px 8px', fontSize: 10.5, fontFamily: T.mono, fontWeight: 700 }}>
                    Climate run active — {res.climate.ngfs_scenario ? `NGFS ${res.climate.ngfs_scenario}` : res.climate.carbon_price_mode} · channels flow through these statements
                  </span>
                  {['climate', 'baseline'].map((side) => (
                    <button key={side} onClick={() => setStmtSide(side)} style={{
                      background: stmtSide === side ? T.navy : T.card, color: stmtSide === side ? '#fff' : T.navy,
                      border: `1px solid ${stmtSide === side ? T.navy : T.border}`, borderRadius: 6,
                      padding: '4px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    }}>{side === 'climate' ? 'Climate case' : 'No-climate baseline'}</button>
                  ))}
                  {res.climate_impact && (
                    <span style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>
                      IRR Δ {res.climate_impact.metric_deltas.equity_irr == null ? 'n/a (climate IRR undefined)' : fmtPct(res.climate_impact.metric_deltas.equity_irr)} ·
                      min DSCR Δ {fmtNum(res.climate_impact.metric_deltas.min_dscr_senior)}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Kpi label="Equity IRR" value={fmtPct(viewRes.metrics.equity_irr)} sub="XIRR on draws + distributions" color={T.teal} />
                <Kpi label="Project IRR" value={fmtPct(viewRes.metrics.project_irr)} sub="Unlevered (levered tax, documented)" />
                <Kpi label="Equity NPV" value={fmtM(viewRes.metrics.equity_npv_musd)} sub={`@ ${viewRes.metrics.discount_rate_pct}% discount rate`} color={viewRes.metrics.equity_npv_musd >= 0 ? T.green : T.red} />
                <Kpi label="Min / Avg DSCR" value={`${fmtNum(viewRes.metrics.min_dscr_senior)} / ${fmtNum(viewRes.metrics.avg_dscr_senior)}`} sub="Senior tranche" color={viewRes.metrics.min_dscr_senior >= inputs.covenants.lockup_dscr ? T.navy : T.amber} />
                <Kpi label="LLCR" value={fmtX(viewRes.metrics.llcr)} sub="PV(CFADS, loan life) ÷ debt" />
                <Kpi label="PLCR" value={fmtX(viewRes.metrics.plcr)} sub="PV(CFADS, project life) ÷ debt" />
                <Kpi label="Payback" value={viewRes.metrics.payback_year ? `Yr ${viewRes.metrics.payback_year}` : '—'} sub="Cum. distributions ≥ equity" />
                {viewRes.metrics.real_equity_irr != null && (
                  <Kpi label="Real equity IRR" value={fmtPct(viewRes.metrics.real_equity_irr)} sub="Deflated by the inflation index (§9)" color={T.indigo} />
                )}
                {viewRes.metrics.carbon_adjusted_equity_irr != null && viewRes.metrics.carbon_adjusted_equity_irr !== viewRes.metrics.equity_irr && (
                  <Kpi label="Carbon-adj. IRR" value={fmtPct(viewRes.metrics.carbon_adjusted_equity_irr)} sub="Shadow-priced externality charge (§12)" color={T.teal} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                <Chip ok={viewRes.balance_sheet_ok} textOk={`✓ Balance sheet balances every period (max gap ${viewRes.max_balance_sheet_gap_musd.toExponential(1)} $M)`} textBad="✗ BALANCE SHEET DOES NOT BALANCE" />
                <Chip ok={viewRes.convergence.converged} textOk={`✓ Circularity converged in ${viewRes.convergence.iterations} fixed-point iterations`} textBad={`✗ NOT converged after ${viewRes.convergence.iterations} iterations`} />
                <Chip ok={viewRes.covenants.lockup_periods.length === 0} textOk="✓ No lock-up periods" textBad={`Lock-up in periods [${viewRes.covenants.lockup_periods.join(', ')}] — cash trapped`} />
                <Chip ok={viewRes.covenants.payment_defaults.length === 0} textOk="✓ No payment defaults" textBad={`${viewRes.covenants.payment_defaults.length} payment default(s)`} />
              </div>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <h2 style={secTitle}>Funding & Sizing</h2>
                  <Badge status="live" />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Kpi label="Total capex" value={fmtM(viewRes.sizing.total_capex_musd)} />
                  <Kpi label="IDC (capitalized)" value={fmtM(viewRes.sizing.idc_musd)} sub="Interest during construction" />
                  <Kpi label="Initial DSRA" value={fmtM(viewRes.sizing.dsra_initial_musd)} sub="Funded at COD" />
                  <Kpi label="Total funded cost" value={fmtM(viewRes.sizing.total_funded_cost_musd)} />
                  <Kpi label="Debt" value={viewRes.sizing.debt_by_tranche_musd.map((d) => fmtM(d)).join(' + ')} sub={inputs.tranches.map((t) => t.name).join(' + ')} />
                  <Kpi label="Equity" value={fmtM(viewRes.sizing.equity_musd)} sub={`Effective gearing ${fmtNum(viewRes.sizing.effective_gearing_pct, 1)}%`} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 4 }}>
                <div style={{ ...card, flex: 2, minWidth: 420 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Revenue by stream ($M/yr, stacked)</div>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={revChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtM(v), STREAM_LABELS[n] || n]} />
                      <Legend formatter={(v) => STREAM_LABELS[v] || v} wrapperStyle={{ fontSize: 11 }} />
                      {Object.keys(STREAM_COLORS).map((k) => (
                        <Bar key={k} dataKey={k} stackId="rev" fill={STREAM_COLORS[k]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ ...card, flex: 2, minWidth: 420 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>
                    Senior DSCR vs covenant lines · CFADS & total DS ($M)
                  </div>
                  <ResponsiveContainer width="100%" height={230}>
                    <ComposedChart data={dscrChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="l" tick={{ fontSize: 10 }} label={{ value: 'DSCR', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} label={{ value: '$M', angle: 90, position: 'insideRight', fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtNum(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area yAxisId="r" dataKey="cfads" name="CFADS $M" fill={T.teal + '33'} stroke={T.teal} />
                      <Bar yAxisId="r" dataKey="ds" name="Debt service $M" fill={T.gold} fillOpacity={0.65} />
                      <Line yAxisId="l" dataKey="dscr" name="Senior DSCR" stroke={T.navy} strokeWidth={2} dot={false} />
                      <ReferenceLine yAxisId="l" y={inputs.covenants.lockup_dscr} stroke={T.amber} strokeDasharray="5 3" label={{ value: `lock-up ${inputs.covenants.lockup_dscr}`, fontSize: 10, fill: T.amber }} />
                      <ReferenceLine yAxisId="l" y={inputs.covenants.default_dscr} stroke={T.red} strokeDasharray="5 3" label={{ value: `default ${inputs.covenants.default_dscr}`, fontSize: 10, fill: T.red }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <h2 style={secTitle}>Period-by-Period Cash Waterfall</h2>
                  <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>
                    rev → opex → tax → MRA → senior DS → DSRA → mezz DS → sweep → lock-up → distributions
                  </span>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, background: T.card, zIndex: 1 }}>
                      <tr>
                        <th style={th}>Yr</th><th style={th}>MWh</th><th style={th}>Revenue</th><th style={th}>Opex</th>
                        <th style={th}>EBITDA</th><th style={th}>Tax</th><th style={th}>MRA c.</th><th style={th}>CFADS</th>
                        {cfadsDelta && <th style={{ ...th, color: T.teal }}>Δ CFADS (climate)</th>}
                        {inputs.tranches.map((t, i) => <th key={i} style={th}>{t.name} DS</th>)}
                        <th style={th}>Sr DSCR</th><th style={th}>DSRA</th><th style={th}>MRA bal</th>
                        <th style={th}>Sweep</th><th style={th}>Debt bal</th><th style={th}>Lock</th><th style={th}>Trapped</th><th style={th}>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewRes.periods.map((p) => (
                        <tr key={p.period} style={p.locked_up ? { background: '#fef3c7' } : undefined}>
                          <td style={{ ...td, fontWeight: 700 }}>{p.period}</td>
                          <td style={td}>{fmtNum(p.energy_mwh, 0)}</td>
                          <td style={td}>{fmtNum(p.revenue_total)}</td>
                          <td style={td}>{fmtNum(p.opex)}</td>
                          <td style={{ ...td, fontWeight: 700 }}>{fmtNum(p.ebitda)}</td>
                          <td style={td}>{fmtNum(p.tax)}</td>
                          <td style={td}>{fmtNum(p.mra_contribution)}</td>
                          <td style={{ ...td, fontWeight: 700, color: T.teal }}>{fmtNum(p.cfads)}</td>
                          {cfadsDelta && (
                            <td style={{ ...td, color: (cfadsDelta[p.period] ?? 0) < 0 ? T.red : T.green }}>
                              {cfadsDelta[p.period] == null ? '—' : `${cfadsDelta[p.period] >= 0 ? '+' : ''}${fmtNum(cfadsDelta[p.period])}`}
                            </td>
                          )}
                          {p.ds_by_tranche.map((d, i) => <td key={i} style={td}>{fmtNum(d)}</td>)}
                          <td style={{ ...td, color: (p.dscr_by_tranche[0] ?? 99) < inputs.covenants.lockup_dscr ? T.red : T.slate, fontWeight: 700 }}>
                            {p.dscr_by_tranche[0] == null ? '—' : fmtNum(p.dscr_by_tranche[0])}
                          </td>
                          <td style={td}>{fmtNum(p.dsra_balance_by_tranche.reduce((s, x) => s + x, 0))}</td>
                          <td style={td}>{fmtNum(p.mra_balance)}</td>
                          <td style={td}>{fmtNum(p.sweep_prepay)}</td>
                          <td style={td}>{fmtNum(p.debt_balance_by_tranche.reduce((s, x) => s + x, 0))}</td>
                          <td style={td}>{p.locked_up ? '🔒' : ''}</td>
                          <td style={td}>{fmtNum(p.trapped_cash)}</td>
                          <td style={{ ...td, fontWeight: 700, color: T.navy }}>{fmtNum(p.distribution)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
                  All $M. Amber rows are lock-up periods (DSCR &lt; {inputs.covenants.lockup_dscr}) — cash is trapped, not distributed.
                  Final year includes DSRA/MRA/trapped release ({fmtM(viewRes.periods[viewRes.periods.length - 1].terminal_release)}).
                </div>
              </div>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <h2 style={secTitle}>Three-Statement View</h2>
                  {['income', 'cashflow', 'balance'].map((v) => (
                    <button key={v} onClick={() => setStmtView(v)} style={{
                      background: stmtView === v ? T.navy : T.card, color: stmtView === v ? '#fff' : T.navy,
                      border: `1px solid ${stmtView === v ? T.navy : T.border}`, borderRadius: 6,
                      padding: '5px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    }}>{{ income: 'Income Statement', cashflow: 'Cash Flow', balance: 'Balance Sheet' }[v]}</button>
                  ))}
                  <Chip ok={viewRes.balance_sheet_ok} textOk="Assets = Liabilities + Equity ∀ periods" textBad="BS imbalance!" />
                </div>
                <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, background: T.card, zIndex: 1 }}>
                      <tr>
                        {stmtView === 'income' && ['Yr', 'Revenue', 'Opex', 'EBITDA', 'D&A', 'Maint.', 'EBIT', 'Interest', 'Pre-tax', 'Tax', 'Net income'].map((h) => <th key={h} style={th}>{h}</th>)}
                        {stmtView === 'cashflow' && ['Yr', 'Operating (NI+D&A−ΔWC)', 'Investing', 'Financing (incl. refi draw)', 'Δ Cash'].map((h) => <th key={h} style={th}>{h}</th>)}
                        {stmtView === 'balance' && ['Yr', 'PP&E net', 'DSRA', 'MRA', 'Trapped', 'AR', 'Total assets', ...inputs.tranches.map((t) => `${t.name} debt`), 'AP', 'Paid-in eq.', 'Ret. earnings', 'Total L+E', 'Gap'].map((h) => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {stmtView === 'income' && viewRes.statements.income.map((r) => (
                        <tr key={r.period}>
                          <td style={{ ...td, fontWeight: 700 }}>{r.period}</td>
                          <td style={td}>{fmtNum(r.revenue)}</td><td style={td}>{fmtNum(r.opex)}</td>
                          <td style={{ ...td, fontWeight: 700 }}>{fmtNum(r.ebitda)}</td>
                          <td style={td}>{fmtNum(r.depreciation)}</td><td style={td}>{fmtNum(r.major_maintenance)}</td>
                          <td style={td}>{fmtNum(r.ebit)}</td><td style={td}>{fmtNum(r.interest)}</td>
                          <td style={td}>{fmtNum(r.pretax_income)}</td><td style={td}>{fmtNum(r.tax)}</td>
                          <td style={{ ...td, fontWeight: 700, color: r.net_income >= 0 ? T.green : T.red }}>{fmtNum(r.net_income)}</td>
                        </tr>
                      ))}
                      {stmtView === 'cashflow' && viewRes.statements.cashflow.map((r) => (
                        <tr key={r.period}>
                          <td style={{ ...td, fontWeight: 700 }}>{r.period}</td>
                          <td style={td}>{fmtNum(r.operating)}</td><td style={td}>{fmtNum(r.investing)}</td>
                          <td style={td}>{fmtNum(r.financing)}</td>
                          <td style={{ ...td, fontWeight: 700 }}>{fmtNum(r.net_change_in_cash)}</td>
                        </tr>
                      ))}
                      {stmtView === 'balance' && viewRes.statements.balance.map((r) => (
                        <tr key={r.period}>
                          <td style={{ ...td, fontWeight: 700 }}>{r.period}</td>
                          <td style={td}>{fmtNum(r.ppe_net)}</td><td style={td}>{fmtNum(r.dsra)}</td>
                          <td style={td}>{fmtNum(r.mra)}</td><td style={td}>{fmtNum(r.trapped_cash)}</td>
                          <td style={td}>{fmtNum(r.accounts_receivable ?? 0)}</td>
                          <td style={{ ...td, fontWeight: 700 }}>{fmtNum(r.total_assets)}</td>
                          {r.debt_by_tranche.map((b, i) => <td key={i} style={td}>{fmtNum(b)}</td>)}
                          <td style={td}>{fmtNum(r.accounts_payable ?? 0)}</td>
                          <td style={td}>{fmtNum(r.paid_in_equity)}</td><td style={td}>{fmtNum(r.retained_earnings)}</td>
                          <td style={{ ...td, fontWeight: 700 }}>{fmtNum(r.total_liab_equity)}</td>
                          <td style={{ ...td, color: Math.abs(r.imbalance) < 1e-6 ? T.green : T.red }}>{r.imbalance.toExponential(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ TAB: CLIMATE & SCENARIOS ═══════════════════════════════════════ */}
      {tab === 'climate' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Climate Risk Channels — integrated into the model</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/ngfs-extract/scenarios</span>
              <Badge status={ngfs.status} demoText={ngfs.error} />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={run.status} demoText={run.error} />
                <button onClick={runModel} style={btn(true)}>Run climate case →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12, maxWidth: 1060 }}>
              These channels flow <b>through the engine's own waterfall, statements and covenant tests</b> — not a bolt-on
              panel. Transition: NGFS carbon-price path → carbon-cost opex line (own emissions), merchant price uplift
              (marginal-unit pass-through), carbon-revenue indexation, GDP-β demand channel. Physical: chronic derate,
              acute expected annual loss, insurance escalation, downtime. Every parameter below is a labeled model
              assumption; NGFS paths are the platform's seeded Phase 5 extract (IIASA Scenario Explorer), 5-yr steps
              interpolated to annual server-side.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 12 }}>
              <Panel title="Scenario & path" note="Operating year 1 maps to Start year on the NGFS path">
                <Field label="Climate enabled">
                  <input type="checkbox" checked={inputs.climate.enabled} style={{ width: 18, height: 18 }}
                    onChange={(e) => setInputs(setIn(inputs, ['climate', 'enabled'], e.target.checked))} />
                </Field>
                <Field label="Start year"><Num inputs={inputs} path={['climate', 'start_year']} onChange={setInputs} width={76} /></Field>
                <Field label="Carbon price mode">
                  <select style={{ ...inputStyle, width: 100 }} value={inputs.climate.transition.carbon_price_mode}
                    onChange={(e) => setInputs(setIn(inputs, ['climate', 'transition', 'carbon_price_mode'], e.target.value))}>
                    <option value="none">none</option><option value="ngfs">NGFS</option><option value="custom">custom</option>
                  </select>
                </Field>
                <Field label="NGFS scenario">
                  <select style={{ ...inputStyle, width: 180 }} value={inputs.climate.transition.ngfs_scenario}
                    onChange={(e) => setInputs(setIn(inputs, ['climate', 'transition', 'ngfs_scenario'], e.target.value))}>
                    {(ngfs.scenarios.length ? ngfs.scenarios : [
                      { id: 'net_zero_2050', name: 'Net Zero 2050' }, { id: 'below_2c', name: 'Below 2°C' },
                      { id: 'delayed_transition', name: 'Delayed Transition' }, { id: 'fragmented_world', name: 'Fragmented World' },
                      { id: 'ndcs', name: 'NDCs' }, { id: 'current_policies', name: 'Current Policies' },
                    ]).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Region">
                  <select style={{ ...inputStyle, width: 90 }} value={inputs.climate.transition.ngfs_region}
                    onChange={(e) => setInputs(setIn(inputs, ['climate', 'transition', 'ngfs_region'], e.target.value))}>
                    {['World', 'EU', 'US', 'CN'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </Panel>
              <Panel title="Transition channels"
                note="Carbon cost = (MWh × intensity + fixed t/yr) × CP_t · uplift = CP_t × grid intensity × pass-through%">
                <Field label="Own emissions t/MWh"><Num inputs={inputs} path={['climate', 'transition', 'emissions_intensity_t_per_mwh']} onChange={setInputs} width={80} step="0.05" /></Field>
                <Field label="Fixed t/yr"><Num inputs={inputs} path={['climate', 'transition', 'fixed_emissions_t_per_yr']} onChange={setInputs} width={80} /></Field>
                <Field label="Pass-through %"><Num inputs={inputs} path={['climate', 'transition', 'merchant_passthrough_pct']} onChange={setInputs} width={70} /></Field>
                <Field label="Grid marginal t/MWh"><Num inputs={inputs} path={['climate', 'transition', 'grid_marginal_intensity_t_per_mwh']} onChange={setInputs} width={80} step="0.05" /></Field>
                <Field label="Index carbon revenue">
                  <input type="checkbox" checked={inputs.climate.transition.index_carbon_revenue_to_path} style={{ width: 18, height: 18 }}
                    onChange={(e) => setInputs(setIn(inputs, ['climate', 'transition', 'index_carbon_revenue_to_path'], e.target.checked))} />
                </Field>
                <Field label="GDP β (merchant)"><Num inputs={inputs} path={['climate', 'transition', 'gdp_beta_merchant']} onChange={setInputs} width={70} step="0.1" /></Field>
              </Panel>
              <Panel title="Physical channels"
                note="Chronic derate compounds on top of degradation · EAL is % of capex/yr, escalating · downtime → ×(1 − days/365)">
                <Field label="Chronic derate %/yr"><Num inputs={inputs} path={['climate', 'physical', 'chronic_derate_pct_yr']} onChange={setInputs} width={76} step="0.05" /></Field>
                <Field label="Acute EAL % capex/yr"><Num inputs={inputs} path={['climate', 'physical', 'acute_eal_pct_of_capex']} onChange={setInputs} width={76} step="0.05" /></Field>
                <Field label="EAL esc %/yr"><Num inputs={inputs} path={['climate', 'physical', 'acute_escalation_pct_yr']} onChange={setInputs} width={70} step="0.5" /></Field>
                <Field label="Insurance esc %/yr"><Num inputs={inputs} path={['climate', 'physical', 'insurance_escalation_pct_yr']} onChange={setInputs} width={70} step="0.5" /></Field>
                <Field label="Downtime days/yr"><Num inputs={inputs} path={['climate', 'physical', 'downtime_days_per_yr']} onChange={setInputs} width={70} step="0.5" /></Field>
              </Panel>
            </div>
          </div>

          {res && res.climate_impact && (
            <>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1.5, minWidth: 440 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 2 }}>
                    Climate impact by channel ($M/yr) — what each channel costs
                  </div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>
                    Bars below zero are costs (carbon cost, acute EAL, insurance escalation); above zero the merchant
                    carbon pass-through uplift. Line = net EBITDA Δ vs the no-climate baseline (includes volume & GDP effects).
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={climChannelChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtM(Math.abs(v)) + (v < 0 ? ' cost' : ''), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <ReferenceLine y={0} stroke={T.slate} />
                      <Bar dataKey="carbon_cost" name="Carbon cost" stackId="c" fill={T.red} fillOpacity={0.8} />
                      <Bar dataKey="acute_eal" name="Acute EAL" stackId="c" fill={T.amber} fillOpacity={0.8} />
                      <Bar dataKey="insurance_extra" name="Insurance esc." stackId="c" fill={T.purple} fillOpacity={0.7} />
                      <Bar dataKey="uplift_revenue" name="Merchant uplift rev." stackId="c" fill={T.green} fillOpacity={0.8} />
                      <Line dataKey="ebitda_delta" name="EBITDA Δ (net)" stroke={T.navy} strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>
                    Totals over life: carbon cost {fmtM(res.climate_impact.totals.carbon_cost)} · EAL {fmtM(res.climate_impact.totals.acute_eal)} ·
                    insurance {fmtM(res.climate_impact.totals.insurance_extra)} · uplift +{fmtM(res.climate_impact.totals.merchant_uplift_revenue)} ·
                    net CFADS Δ {fmtM(res.climate_impact.totals.cfads)}
                  </div>
                </div>
                <div style={{ ...card, flex: 1.5, minWidth: 440 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>
                    Senior DSCR — baseline vs climate case (breaches marked)
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={climDscrChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtNum(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line dataKey="baseline" name="No-climate baseline" stroke={T.slate} strokeWidth={2} strokeDasharray="6 3" dot={false} />
                      <Line dataKey="climate" name="Climate case" stroke={T.teal} strokeWidth={2}
                        dot={(p) => (p.payload && p.payload.locked
                          ? <circle key={`bp-${p.payload.period}`} cx={p.cx} cy={p.cy} r={4} fill={T.red} stroke="#fff" strokeWidth={1} />
                          : <circle key={`np-${p.payload && p.payload.period}`} cx={p.cx} cy={p.cy} r={0} fill="none" />)} />
                      <ReferenceLine y={inputs.covenants.lockup_dscr} stroke={T.amber} strokeDasharray="5 3" label={{ value: `lock-up ${inputs.covenants.lockup_dscr}`, fontSize: 10, fill: T.amber }} />
                      <ReferenceLine y={inputs.covenants.default_dscr} stroke={T.red} strokeDasharray="5 3" label={{ value: `default ${inputs.covenants.default_dscr}`, fontSize: 10, fill: T.red }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                    Red markers = lock-up periods in the climate case (cash trapped in the waterfall).
                  </div>
                </div>
              </div>
            </>
          )}
          {res && inputs.climate.enabled && !res.climate_impact && (
            <div style={card}><div style={{ fontSize: 12, color: T.sub }}>Climate config changed since the last run — press <b>Run climate case</b> to recompute with channels applied.</div></div>
          )}

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Scenario Matrix — same deal, every NGFS climate future</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/financial-model/scenario-matrix</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={matrix.status} demoText={matrix.error} />
                <button onClick={runMatrix} style={btn(true)}>Run scenario matrix →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              Reruns the full model once per NGFS scenario (carbon-price + GDP paths swapped; your channel parameters above
              held constant) plus a no-climate baseline — and your <b>own designed scenarios</b> below. Covenant tests run
              identically in every scenario; each row carries a sustainability block (cumulative emissions, carbon-cost PV).
            </div>
            <div style={{ border: `1px dashed ${T.teal}66`, borderRadius: 8, padding: 12, marginBottom: 12, background: '#f6faf9' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.teal, marginBottom: 4 }}>Custom scenario designer</div>
              <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>
                Name + carbon-price path ($/tCO2e per operating year, comma-separated, last value held flat) + optional GDP-impact
                path (% vs baseline — feeds the same GDP-β merchant channel). Runs through the identical model code path as NGFS.
              </div>
              {customScens.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6, flexWrap: 'wrap' }}>
                  <Field label="Name">
                    <input style={{ ...inputStyle, width: 150 }} value={c.name}
                      onChange={(e) => setCustomScens(customScens.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  </Field>
                  <Field label="Carbon price path $/t">
                    <input style={{ ...inputStyle, width: 240 }} placeholder="e.g. 20, 35, 50, 80, 120" value={c.cp}
                      onChange={(e) => setCustomScens(customScens.map((x, j) => (j === i ? { ...x, cp: e.target.value } : x)))} />
                  </Field>
                  <Field label="GDP impact % path (optional)">
                    <input style={{ ...inputStyle, width: 200 }} placeholder="e.g. 0, -0.5, -1.5" value={c.gdp}
                      onChange={(e) => setCustomScens(customScens.map((x, j) => (j === i ? { ...x, gdp: e.target.value } : x)))} />
                  </Field>
                  <button onClick={() => setCustomScens(customScens.filter((_, j) => j !== i))}
                    style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 10px' }}>✕</button>
                </div>
              ))}
              {customScens.length < 8 && (
                <button onClick={() => setCustomScens([...customScens, { name: `Custom ${customScens.length + 1}`, cp: '25, 40, 60, 90', gdp: '' }])}
                  style={{ background: 'transparent', border: `1px dashed ${T.teal}88`, borderRadius: 6, color: T.teal, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '5px 12px' }}>
                  + design a scenario
                </button>
              )}
            </div>
            {matrix.status === 'demo' && (
              <div style={{ padding: '10px 14px', background: '#fdf4f4', border: `1px solid ${T.red}33`, borderRadius: 8 }}>
                <div style={{ fontSize: 12.5, color: T.red, fontWeight: 700 }}>Scenario-matrix call failed — no figures shown.</div>
                <div style={{ fontSize: 11.5, color: T.sub, marginTop: 3 }}>{String(matrix.error)}</div>
              </div>
            )}
            {matrix.status === 'live' && matrix.data && (
              <>
                <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>Scenario</th><th style={th}>Equity IRR</th><th style={th}>Equity NPV</th>
                        <th style={th}>Min DSCR</th><th style={th}>Avg DSCR</th><th style={th}>LLCR</th>
                        <th style={th}>PV distributions</th><th style={th}>First lock-up</th><th style={th}>First default test</th>
                        <th style={th}>Pmt defaults</th>
                        <th style={{ ...th, color: T.teal }}>Cum. tCO2e</th>
                        <th style={{ ...th, color: T.teal }}>Carbon cost PV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.data.rows.map((r, i) => (
                        <tr key={i} style={r.scenario == null ? { background: T.cream } : undefined}>
                          <td style={{ ...td, fontWeight: 700, color: SCEN_COLORS[i % SCEN_COLORS.length], fontFamily: T.font }}>{r.label}</td>
                          <td style={{ ...td, fontWeight: 700 }}>{r.equity_irr == null ? 'n/a (wiped out)' : fmtPct(r.equity_irr)}</td>
                          <td style={td}>{fmtM(r.equity_npv_musd)}</td>
                          <td style={{ ...td, color: (r.min_dscr_senior ?? 99) < inputs.covenants.default_dscr ? T.red : T.slate }}>{fmtNum(r.min_dscr_senior)}</td>
                          <td style={td}>{fmtNum(r.avg_dscr_senior)}</td>
                          <td style={td}>{fmtX(r.llcr)}</td>
                          <td style={td}>{fmtM(r.distributions_pv_musd)}</td>
                          <td style={{ ...td, color: r.first_lockup_year ? T.amber : T.slate, fontWeight: r.first_lockup_year ? 700 : 400 }}>
                            {r.first_lockup_year ? `${r.first_lockup_year} (yr ${r.first_lockup_period})` : '—'}
                          </td>
                          <td style={{ ...td, color: r.first_default_year ? T.red : T.slate, fontWeight: r.first_default_year ? 700 : 400 }}>
                            {r.first_default_year ? `${r.first_default_year} (yr ${r.first_default_period})` : '—'}
                          </td>
                          <td style={td}>{r.payment_default_count || '—'}</td>
                          <td style={{ ...td, color: T.teal }}>{r.sustainability ? fmtNum(r.sustainability.cumulative_emissions_tco2e, 0) : '—'}</td>
                          <td style={{ ...td, color: T.teal }}>{r.sustainability ? fmtM(r.sustainability.carbon_cost_pv_musd) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Senior DSCR paths by scenario</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={matrixDscrChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} label={{ value: 'Operating year', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [fmtNum(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {matrix.data.rows.map((r, i) => (
                      <Line key={r.label} dataKey={r.label} stroke={SCEN_COLORS[i % SCEN_COLORS.length]}
                        strokeWidth={r.scenario == null ? 2.5 : 1.7} strokeDasharray={r.scenario == null ? '6 3' : undefined} dot={false} />
                    ))}
                    <ReferenceLine y={inputs.covenants.lockup_dscr} stroke={T.amber} strokeDasharray="5 3" />
                    <ReferenceLine y={inputs.covenants.default_dscr} stroke={T.red} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>
                  {matrix.data.provenance?.source} · {matrix.data.provenance?.release} · start year {matrix.data.start_year} ·
                  dashed = no-climate baseline · covenant lines at {inputs.covenants.lockup_dscr} / {inputs.covenants.default_dscr}
                </div>
              </>
            )}
            {matrix.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the channel parameters above (they apply in every scenario), then run the matrix.</div>}
          </div>
        </>
      )}

      {/* ═══ TAB: REFINANCING ═══════════════════════════════════════════════ */}
      {tab === 'refi' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Refinancing Event — with / without comparison</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>engine §8 — configured in Model Setup</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={run.status} demoText={run.error} />
                <button onClick={runModel} style={btn(true)}>Run model →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, maxWidth: 1060 }}>
              At the end of year N the senior balance is refinanced: <span style={{ fontFamily: T.mono, fontSize: 10.5 }}>
              NewDebt = new gearing% × C_total (or the outstanding balance) · Fee = fees% × NewDebt ·
              CashOut = NewDebt − balance − fee → flows to equity THROUGH the lock-up test (covenant continuity)</span>.
              The engine reruns the full no-refi model through the identical code path for the comparison below.
              {!inputs.refinancing.enabled && <b> Refinancing is currently disabled — enable it in Model Setup → Refinancing event.</b>}
            </div>
          </div>
          {run.status === 'live' && res && !res.refinancing && (
            <div style={card}><div style={{ fontSize: 12, color: T.sub }}>The last run had refinancing disabled. Enable it in Model Setup and rerun.</div></div>
          )}
          {run.status === 'live' && res && res.refinancing && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Kpi label="Equity IRR — with refi" value={fmtPct(res.refinancing.with_refi.equity_irr)} color={T.teal} sub="Primary result" />
                <Kpi label="Equity IRR — without" value={fmtPct(res.refinancing.without_refi.equity_irr)} sub="Full no-refi rerun" />
                <Kpi label="IRR uplift" value={res.refinancing.deltas.equity_irr == null ? '—' : `${res.refinancing.deltas.equity_irr >= 0 ? '+' : ''}${fmtPct(res.refinancing.deltas.equity_irr)}`}
                  color={(res.refinancing.deltas.equity_irr ?? 0) >= 0 ? T.green : T.red} sub="with − without" />
                <Kpi label="NPV Δ" value={fmtM(res.refinancing.deltas.equity_npv_musd)} color={(res.refinancing.deltas.equity_npv_musd ?? 0) >= 0 ? T.green : T.red} />
                <Kpi label="Min DSCR Δ" value={fmtNum(res.refinancing.deltas.min_dscr_senior)} sub="Covenant tests unchanged on the new schedule" />
              </div>
              {res.refinancing.event && (
                <div style={card}>
                  <h2 style={{ ...secTitle, marginBottom: 8 }}>Event — end of operating year {res.refinancing.event.year}</h2>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Kpi label="Balance refinanced" value={fmtM(res.refinancing.event.balance_refinanced_musd)} />
                    <Kpi label="New debt" value={fmtM(res.refinancing.event.new_debt_musd)} sub={`${res.refinancing.event.new_amort_type} @ ${res.refinancing.event.new_rate_pct}% · ${res.refinancing.event.new_tenor_years} yrs`} />
                    <Kpi label="Fees (expensed yr N)" value={fmtM(res.refinancing.event.fee_musd)} color={T.amber} />
                    <Kpi label={res.refinancing.event.cash_out_musd >= 0 ? 'Cash-out to equity' : 'Equity injection'}
                      value={fmtM(Math.abs(res.refinancing.event.cash_out_musd))}
                      color={res.refinancing.event.cash_out_musd >= 0 ? T.green : T.red}
                      sub="Through the waterfall lock-up test" />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1, minWidth: 440 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Senior DSCR — with vs without refi</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={refiChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtNum(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line dataKey="without_refi" name="Without refi" stroke={T.slate} strokeWidth={2} strokeDasharray="6 3" dot={false} />
                      <Line dataKey="with_refi" name="With refi" stroke={T.teal} strokeWidth={2} dot={false} />
                      <ReferenceLine x={inputs.refinancing.year} stroke={T.purple} strokeDasharray="4 3" label={{ value: `refi yr ${inputs.refinancing.year}`, fontSize: 10, fill: T.purple }} />
                      <ReferenceLine y={inputs.covenants.lockup_dscr} stroke={T.amber} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ ...card, flex: 1, minWidth: 440 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Distributions to equity ($M/yr) — cash-out visible at the refi year</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={refiChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtM(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="dist_with" name="With refi" fill={T.teal} fillOpacity={0.8} />
                      <Line dataKey="dist_without" name="Without refi" stroke={T.slate} strokeWidth={2} strokeDasharray="6 3" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
          {run.status === 'idle' && <div style={card}><div style={{ fontSize: 12.5, color: T.sub }}>Enable refinancing in Model Setup, then press <b>Run model</b>.</div></div>}
        </>
      )}

      {/* ═══ TAB: PORTFOLIO ═════════════════════════════════════════════════ */}
      {tab === 'portfolio' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Portfolio Consolidation — 2–5 assets + HoldCo layer</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/financial-model/consolidate</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={port.status} demoText={port.error} />
                <button onClick={runPortfolio} style={btn(portAssets.length >= 2)}>Consolidate →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10, maxWidth: 1080 }}>
              Each asset runs through the FULL model, then consolidates: portfolio DSCR = ΣCFADS/ΣDS (aggregate — always between the
              constituents), a documented diversification proxy (revenue-mix cosine overlap, CFADS-weighted — <b>not</b> an estimated
              covariance), and a HoldCo debt layer serviced ONLY from asset equity distributions (structural subordination).
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 6 }}>Assets (2–5)</div>
                {portAssets.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6, flexWrap: 'wrap' }}>
                    <Field label="Name">
                      <input style={{ ...inputStyle, width: 130 }} value={a.name}
                        onChange={(e) => setPortAssets(portAssets.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                    </Field>
                    <Field label="Input set">
                      <select style={{ ...inputStyle, width: 230 }} value={a.template_id}
                        onChange={(e) => setPortAssets(portAssets.map((x, j) => (j === i ? { ...x, template_id: e.target.value } : x)))}>
                        <option value="__current__">← current Model Setup inputs</option>
                        {templates.list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </Field>
                    {portAssets.length > 2 && (
                      <button onClick={() => setPortAssets(portAssets.filter((_, j) => j !== i))}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 10px' }}>✕</button>
                    )}
                  </div>
                ))}
                {portAssets.length < 5 && (
                  <button onClick={() => setPortAssets([...portAssets, { name: `Asset ${portAssets.length + 1}`, template_id: 'wind_50mw_carbon' }])}
                    style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 6, color: T.navy, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '5px 12px' }}>+ asset</button>
                )}
              </div>
              <Panel title="HoldCo debt layer" note="Serviced only from asset distributions — never from asset CFADS (structural subordination)">
                <Field label="Enabled">
                  <input type="checkbox" checked={holdco.enabled} style={{ width: 18, height: 18 }}
                    onChange={(e) => setHoldco({ ...holdco, enabled: e.target.checked })} />
                </Field>
                <Field label="Debt $M"><input type="number" style={{ ...inputStyle, width: 76 }} value={holdco.debt_musd}
                  onChange={(e) => setHoldco({ ...holdco, debt_musd: parseFloat(e.target.value) || 0 })} /></Field>
                <Field label="Rate %"><input type="number" step="0.1" style={{ ...inputStyle, width: 64 }} value={holdco.rate_pct}
                  onChange={(e) => setHoldco({ ...holdco, rate_pct: parseFloat(e.target.value) || 0 })} /></Field>
                <Field label="Tenor yrs"><input type="number" style={{ ...inputStyle, width: 60 }} value={holdco.tenor_years}
                  onChange={(e) => setHoldco({ ...holdco, tenor_years: parseInt(e.target.value, 10) || 1 })} /></Field>
                <Field label="Lock-up DSCR"><input type="number" step="0.05" style={{ ...inputStyle, width: 70 }} value={holdco.lockup_dscr}
                  onChange={(e) => setHoldco({ ...holdco, lockup_dscr: parseFloat(e.target.value) || 1 })} /></Field>
              </Panel>
            </div>
          </div>

          {port.status === 'demo' && (
            <div style={{ ...card, background: '#fdf4f4', border: `1px solid ${T.red}33` }}>
              <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>Consolidation call failed — no figures shown.</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{String(port.error)}</div>
            </div>
          )}
          {port.status === 'live' && port.data && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Kpi label="Portfolio equity IRR" value={fmtPct(port.data.portfolio_metrics.portfolio_equity_irr)} color={T.teal} sub="COD-aligned aggregation" />
                {port.data.holdco.enabled && port.data.holdco.holdco_equity_irr != null && (
                  <Kpi label="HoldCo-levered IRR" value={fmtPct(port.data.holdco.holdco_equity_irr)} color={T.purple} sub="After HoldCo debt service" />
                )}
                <Kpi label="Min / Avg portfolio DSCR" value={`${fmtNum(port.data.portfolio_metrics.min_portfolio_dscr)} / ${fmtNum(port.data.portfolio_metrics.avg_portfolio_dscr)}`} sub="ΣCFADS ÷ ΣDS" />
                <Kpi label="Diversification score" value={fmtNum(port.data.diversification.diversification_score, 3)} sub={`1 − ρ̄ (revenue-mix proxy) · ρ̄ = ${fmtNum(port.data.diversification.rho_bar, 3)}`} color={T.indigo} />
                <Kpi label="Total equity / debt" value={`${fmtM(port.data.portfolio_metrics.total_equity_musd, 0)} / ${fmtM(port.data.portfolio_metrics.total_debt_musd, 0)}`} />
                <Kpi label="Portfolio emissions" value={`${fmtNum(port.data.portfolio_metrics.cumulative_emissions_tco2e, 0)} t`} sub="Lifetime own emissions, all assets" color={T.green} />
              </div>

              <div style={card}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Constituent assets</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Asset</th><th style={th}>Ops yrs</th><th style={th}>Equity IRR</th><th style={th}>Min DSCR</th>
                      <th style={th}>Gearing</th><th style={th}>Lock-ups</th><th style={th}>Emissions t</th><th style={th}>BS</th></tr>
                  </thead>
                  <tbody>
                    {port.data.assets.map((a, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 700, fontFamily: T.font }}>{a.name}</td>
                        <td style={td}>{a.operations_years}</td>
                        <td style={td}>{fmtPct(a.metrics.equity_irr)}</td>
                        <td style={td}>{fmtNum(a.metrics.min_dscr_senior)}</td>
                        <td style={td}>{fmtNum(a.sizing.effective_gearing_pct, 1)}%</td>
                        <td style={td}>{a.covenants.lockup_periods.length || '—'}</td>
                        <td style={td}>{fmtNum(a.cumulative_emissions_tco2e, 0)}</td>
                        <td style={td}><Chip ok={a.balance_sheet_ok} textOk="✓" textBad="✗" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1.5, minWidth: 460 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>
                    Portfolio CFADS vs total DS ($M) · portfolio DSCR band (min↔max constituents)
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={portChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="l" tick={{ fontSize: 10 }} label={{ value: 'DSCR', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} label={{ value: '$M', angle: 90, position: 'insideRight', fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtNum(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area yAxisId="r" dataKey="cfads" name="Σ CFADS $M" fill={T.teal + '33'} stroke={T.teal} />
                      <Bar yAxisId="r" dataKey="ds" name="Σ DS $M" fill={T.gold} fillOpacity={0.6} />
                      <Line yAxisId="l" dataKey="dscr" name="Portfolio DSCR" stroke={T.navy} strokeWidth={2.2} dot={false} />
                      <Line yAxisId="l" dataKey="lo" name="Min constituent" stroke={T.red} strokeWidth={1} strokeDasharray="4 3" dot={false} />
                      <Line yAxisId="l" dataKey="hi" name="Max constituent" stroke={T.green} strokeWidth={1} strokeDasharray="4 3" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                    Mediant property: the portfolio ratio always lies between the min and max constituent DSCR while every asset has debt service.
                  </div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: 380 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Diversification proxy (documented)</div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>{port.data.diversification.method}</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>Pair</th><th style={th}>Mix overlap ρ</th></tr></thead>
                    <tbody>
                      {port.data.diversification.pairwise.map((p, i) => (
                        <tr key={i}>
                          <td style={{ ...td, fontFamily: T.font }}>{p.a} ↔ {p.b}</td>
                          <td style={td}>{fmtNum(p.revenue_mix_correlation_proxy, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {port.data.holdco.enabled && port.data.holdco.schedule && (
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h2 style={secTitle}>HoldCo debt schedule — structural subordination</h2>
                    <Chip ok={port.data.holdco.payment_shortfalls.length === 0}
                      textOk="✓ No HoldCo payment shortfalls" textBad={`${port.data.holdco.payment_shortfalls.length} HoldCo shortfall period(s)`} />
                    <Chip ok={port.data.holdco.lockup_breach_periods.length === 0}
                      textOk="✓ No HoldCo lock-up breaches" textBad={`HoldCo lock-up breach in [${port.data.holdco.lockup_breach_periods.join(', ')}]`} />
                  </div>
                  <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: T.card }}>
                        <tr><th style={th}>Yr</th><th style={th}>Upstream CF</th><th style={th}>Interest</th><th style={th}>Principal</th>
                          <th style={th}>DS</th><th style={th}>HoldCo DSCR</th><th style={th}>Balance</th><th style={th}>Net to equity</th></tr>
                      </thead>
                      <tbody>
                        {port.data.holdco.schedule.map((r2) => (
                          <tr key={r2.period} style={(r2.holdco_dscr != null && r2.holdco_dscr < holdco.lockup_dscr) ? { background: '#fef3c7' } : undefined}>
                            <td style={{ ...td, fontWeight: 700 }}>{r2.period}</td>
                            <td style={td}>{fmtNum(r2.upstream_cf)}</td>
                            <td style={td}>{fmtNum(r2.interest)}</td>
                            <td style={td}>{fmtNum(r2.principal)}</td>
                            <td style={td}>{fmtNum(r2.ds)}</td>
                            <td style={{ ...td, fontWeight: 700, color: (r2.holdco_dscr ?? 99) < holdco.lockup_dscr ? T.red : T.slate }}>{r2.holdco_dscr == null ? '—' : fmtNum(r2.holdco_dscr)}</td>
                            <td style={td}>{fmtNum(r2.balance)}</td>
                            <td style={{ ...td, color: r2.net_to_equity >= 0 ? T.slate : T.red }}>{fmtNum(r2.net_to_equity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          {port.status === 'idle' && <div style={card}><div style={{ fontSize: 12.5, color: T.sub }}>Pick 2–5 assets (templates or the current Model Setup inputs), set the HoldCo layer, then press <b>Consolidate</b>.</div></div>}
        </>
      )}

      {/* ═══ TAB: SUSTAINABILITY ════════════════════════════════════════════ */}
      {tab === 'sustain' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Sustainability × Financial Overlay</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>engine §11–§12 — computed on every /run</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={run.status} demoText={run.error} />
                <button onClick={runModel} style={btn(true)}>Run model →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, maxWidth: 1080 }}>
              Emissions come from the model's OWN generation × intensity (Setup → Sustainability assumptions). The SLL margin
              ratchet prices the intensity path into the debt; the carbon-adjusted IRR charges a <b>labeled shadow price</b> to the
              equity flows (an analytical adjustment, not a cash flow); avoided emissions are vs your stated grid baseline; PCAF
              financed-emissions outputs are attribution-ready.
            </div>
          </div>
          {run.status === 'idle' && <div style={card}><div style={{ fontSize: 12.5, color: T.sub }}>Press <b>Run model</b> — the sustainability block is computed on every run.</div></div>}
          {run.status === 'live' && res && res.sustainability && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Kpi label="Lifetime emissions" value={`${fmtNum(res.sustainability.totals.cumulative_emissions_tco2e, 0)} t`} sub={`avg intensity ${fmtNum(res.sustainability.totals.avg_intensity_t_per_mwh, 4)} t/MWh`} />
                <Kpi label="Avoided emissions" value={`${fmtNum(res.sustainability.totals.cumulative_avoided_tco2e, 0)} t`} color={T.green}
                  sub={`vs grid baseline ${inputs.sustainability.grid_baseline_intensity_t_per_mwh} t/MWh (stated)`} />
                <Kpi label="Equity cost of avoidance" value={res.sustainability.totals.equity_cost_per_t_avoided_usd == null ? '—' : `$${fmtNum(res.sustainability.totals.equity_cost_per_t_avoided_usd)}/t`}
                  sub="Equity invested ÷ lifetime avoided (undiscounted, labeled)" color={T.teal} />
                <Kpi label="Lifetime carbon cost" value={fmtM(res.sustainability.totals.lifetime_carbon_cost_musd)} sub="Carbon-cost opex line (climate case)" color={T.amber} />
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1.5, minWidth: 460 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 2 }}>
                    Emissions intensity path vs SLL target — ratchet events marked
                  </div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>
                    {sllTranche
                      ? `SLL on ${sllTranche.name}: +${sllTranche.sll.step_up_bp}bp when intensity above the linear target path, −${sllTranche.sll.step_down_bp}bp when below — flows into interest, statements and DSCR.`
                      : 'No SLL ratchet enabled — enable it on a tranche in Model Setup to price the intensity path into the debt.'}
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={intensityChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: 'tCO2e/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtNum(v, 4), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line dataKey="intensity" name="Own intensity" stroke={T.navy} strokeWidth={2}
                        dot={(p) => (p.payload && p.payload.stepUp
                          ? <circle key={`su-${p.payload.period}`} cx={p.cx} cy={p.cy} r={4.5} fill={T.red} stroke="#fff" strokeWidth={1} />
                          : p.payload && p.payload.stepDown
                            ? <circle key={`sd-${p.payload.period}`} cx={p.cx} cy={p.cy} r={3.5} fill={T.green} stroke="#fff" strokeWidth={1} />
                            : <circle key={`n-${p.payload && p.payload.period}`} cx={p.cx} cy={p.cy} r={0} fill="none" />)} />
                      {sllTranche && <Line dataKey="target" name="SLL target path (linear)" stroke={T.gold} strokeWidth={2} strokeDasharray="6 3" dot={false} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
                    ● red = margin step-UP period (+bp) · ● green = step-down (−bp) · markers stop when the tranche is repaid.
                    {res.sll && res.sll.length > 0 && ` ${res.sll[0].tranche}: ${res.sll[0].periods_stepped_up} step-ups / ${res.sll[0].periods_stepped_down} step-downs.`}
                  </div>
                </div>

                <div style={{ ...card, flex: 1, minWidth: 380 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 2 }}>IRR bridge — nominal → adjusted views</div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>
                    Carbon-adjusted = equity flows − Em_t × ${inputs.sustainability.shadow_carbon_price_usd_t}/t shadow price (labeled, not a cash flow).
                    Real = deflated by the inflation index{inputs.inflation.enabled ? '' : ' (enable inflation in Setup)'}.
                  </div>
                  {irrBridge && irrBridge.map((b) => (
                    <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 160, fontSize: 11, fontFamily: T.mono, color: T.slate, textAlign: 'right' }}>{b.name}</div>
                      <div style={{ flex: 1, position: 'relative', height: 22, background: '#f1f5f9', borderRadius: 4 }}>
                        <div style={{ position: 'absolute', left: 0, width: `${Math.max(0, Math.min(100, (b.v / 0.2) * 100))}%`, top: 2, bottom: 2, background: b.color, borderRadius: 3, opacity: 0.85 }} />
                      </div>
                      <div style={{ width: 70, fontSize: 12, fontFamily: T.mono, fontWeight: 700, color: b.color }}>{fmtPct(b.v)}</div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, margin: '14px 0 2px' }}>Carbon cost share of opex</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={intensityChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      <Tooltip formatter={(v) => [fmtPct(v), 'share of opex']} />
                      <Bar dataKey="carbon_cost_share" fill={T.amber} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <h2 style={secTitle}>PCAF attribution-ready financed emissions</h2>
                  <span style={{ fontSize: 10.5, color: T.sub }}>{res.sustainability.assumptions.labels.pcaf}</span>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: T.card }}>
                      <tr><th style={th}>Yr</th><th style={th}>Emissions t</th><th style={th}>Intensity t/MWh</th>
                        <th style={th}>Avoided t</th><th style={th}>Attribution factor (debt)</th>
                        <th style={th}>Financed — debt t</th><th style={th}>Financed — equity t</th><th style={th}>Carbon cost $M</th></tr>
                    </thead>
                    <tbody>
                      {res.sustainability.per_year.map((r2) => (
                        <tr key={r2.period}>
                          <td style={{ ...td, fontWeight: 700 }}>{r2.period}</td>
                          <td style={td}>{fmtNum(r2.emissions_tco2e, 0)}</td>
                          <td style={td}>{fmtNum(r2.emissions_intensity_t_per_mwh, 4)}</td>
                          <td style={{ ...td, color: T.green }}>{fmtNum(r2.avoided_emissions_tco2e, 0)}</td>
                          <td style={td}>{fmtNum(r2.pcaf_attribution_factor_debt, 3)}</td>
                          <td style={td}>{fmtNum(r2.financed_emissions_debt_tco2e, 0)}</td>
                          <td style={td}>{fmtNum(r2.financed_emissions_equity_tco2e, 0)}</td>
                          <td style={td}>{fmtNum(r2.carbon_cost_musd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ TAB: SENSITIVITY ═══════════════════════════════════════════════ */}
      {tab === 'sensitivity' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Sensitivity Configuration</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/financial-model/sensitivity</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={sens.status} demoText={sens.error} />
                <button onClick={runSensitivity} style={btn(true)}>Run sensitivity →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Field label="Axis X driver">
                <select style={{ ...inputStyle, width: 150 }} value={sensCfg.param_x} onChange={(e) => setSensCfg({ ...sensCfg, param_x: e.target.value })}>
                  {DRIVERS.map((d) => <option key={d} value={d}>{DRIVER_LABELS[d]}</option>)}
                </select>
              </Field>
              <Field label="±% X"><input type="number" style={{ ...inputStyle, width: 70 }} value={sensCfg.range_x_pct} onChange={(e) => setSensCfg({ ...sensCfg, range_x_pct: parseFloat(e.target.value) || 10 })} /></Field>
              <Field label="Axis Y driver">
                <select style={{ ...inputStyle, width: 150 }} value={sensCfg.param_y || ''} onChange={(e) => setSensCfg({ ...sensCfg, param_y: e.target.value || null })}>
                  <option value="">— (1D)</option>
                  {DRIVERS.map((d) => <option key={d} value={d}>{DRIVER_LABELS[d]}</option>)}
                </select>
              </Field>
              <Field label="±% Y"><input type="number" style={{ ...inputStyle, width: 70 }} value={sensCfg.range_y_pct} onChange={(e) => setSensCfg({ ...sensCfg, range_y_pct: parseFloat(e.target.value) || 10 })} /></Field>
              <Field label="Tornado shock ±%"><input type="number" style={{ ...inputStyle, width: 70 }} value={sensCfg.tornado_pct} onChange={(e) => setSensCfg({ ...sensCfg, tornado_pct: parseFloat(e.target.value) || 10 })} /></Field>
            </div>
          </div>

          {sens.status === 'demo' && (
            <div style={{ ...card, background: '#fdf4f4', border: `1px solid ${T.red}33` }}>
              <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>Sensitivity engine call failed — no figures shown.</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{String(sens.error)}</div>
            </div>
          )}
          {sens.status === 'live' && sens.data && (
            <>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1.4, minWidth: 440 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 2 }}>
                    Tornado — equity IRR at ±{sens.data.tornado.shock_pct}% per driver (one-at-a-time)
                  </div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 10 }}>
                    Base equity IRR {fmtPct(sens.data.base_equity_irr)} — bars show the IRR range each driver alone produces.
                  </div>
                  {(() => {
                    const bars = sens.data.tornado.bars;
                    const allVals = bars.flatMap((b) => [b.irr_low, b.irr_high]).filter((v) => v != null);
                    const lo = Math.min(...allVals), hi = Math.max(...allVals);
                    const span = hi - lo || 1;
                    return bars.map((b) => {
                      const l = Math.min(b.irr_low ?? 0, b.irr_high ?? 0);
                      const r = Math.max(b.irr_low ?? 0, b.irr_high ?? 0);
                      return (
                        <div key={b.param} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 120, fontSize: 11, fontFamily: T.mono, color: T.slate, textAlign: 'right' }}>{DRIVER_LABELS[b.param] || b.param}</div>
                          <div style={{ flex: 1, position: 'relative', height: 20, background: '#f1f5f9', borderRadius: 4 }}>
                            <div style={{
                              position: 'absolute', left: `${((l - lo) / span) * 100}%`,
                              width: `${((r - l) / span) * 100}%`, top: 2, bottom: 2,
                              background: `linear-gradient(90deg, ${T.red}bb, ${T.green}bb)`, borderRadius: 3,
                            }} />
                            <div style={{
                              position: 'absolute', left: `${((sens.data.base_equity_irr - lo) / span) * 100}%`,
                              top: 0, bottom: 0, width: 2, background: T.navy,
                            }} />
                          </div>
                          <div style={{ width: 150, fontSize: 10.5, fontFamily: T.mono, color: T.sub }}>
                            {fmtPct(b.irr_low, 1)} → {fmtPct(b.irr_high, 1)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div style={{ ...card, flex: 1.6, minWidth: 460 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>
                    Equity IRR grid — {DRIVER_LABELS[sens.data.grid.param_x]}{sens.data.grid.param_y ? ` × ${DRIVER_LABELS[sens.data.grid.param_y]}` : ''}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={th}>{sens.data.grid.param_y ? `${DRIVER_LABELS[sens.data.grid.param_y]} \\ ${DRIVER_LABELS[sens.data.grid.param_x]}` : DRIVER_LABELS[sens.data.grid.param_x]}</th>
                          {sens.data.grid.x_values.map((x, i) => <th key={i} style={th}>{fmtNum(x, 1)}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {sens.data.grid.cells.map((row, yi) => (
                          <tr key={yi}>
                            <td style={{ ...td, fontWeight: 700 }}>{sens.data.grid.param_y ? fmtNum(sens.data.grid.y_values[yi], 1) : '—'}</td>
                            {row.map((c, xi) => (
                              <td key={xi} style={{ ...td, background: gridBounds ? heatColor(c.equity_irr, gridBounds.lo, gridBounds.hi) : undefined, fontWeight: 700 }}>
                                {c.equity_irr == null ? '—' : fmtPct(c.equity_irr, 1)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
                    Cell colour scales red → green over the observed IRR range. Each cell is a full model rerun server-side.
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Scenario Compare (local)</h2>
              <span style={{ fontSize: 11, color: T.sub }}>saves the current inputs' run KPIs under a name — session-local, nothing persisted</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ ...inputStyle, width: 160 }} placeholder="Scenario name" value={scenName} onChange={(e) => setScenName(e.target.value)} />
                <button onClick={saveScenario} style={btn(true)}>Save current as scenario</button>
              </div>
            </div>
            {scenarios.length === 0
              ? <div style={{ fontSize: 12, color: T.sub }}>No saved scenarios yet. Adjust inputs in Model Setup, run, then save to compare side by side.</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Scenario</th><th style={th}>Equity IRR</th><th style={th}>Project IRR</th><th style={th}>NPV</th>
                      <th style={th}>Min DSCR</th><th style={th}>LLCR</th><th style={th}>PLCR</th><th style={th}>Gearing</th>
                      <th style={th}>Lock-ups</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{s.name}</td>
                        <td style={td}>{fmtPct(s.metrics.equity_irr)}</td>
                        <td style={td}>{fmtPct(s.metrics.project_irr)}</td>
                        <td style={td}>{fmtM(s.metrics.equity_npv_musd)}</td>
                        <td style={td}>{fmtNum(s.metrics.min_dscr_senior)}</td>
                        <td style={td}>{fmtX(s.metrics.llcr)}</td>
                        <td style={td}>{fmtX(s.metrics.plcr)}</td>
                        <td style={td}>{fmtNum(s.sizing.effective_gearing_pct, 1)}%</td>
                        <td style={td}>{s.lockups}</td>
                        <td style={td}>
                          <button onClick={() => setScenarios((prev) => prev.filter((_, j) => j !== i))}
                            style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}

      {/* ═══ TAB: RISK (QMC) ════════════════════════════════════════════════ */}
      {tab === 'risk' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={secTitle}>Uncertain Inputs — deterministic quasi-Monte Carlo</h2>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/financial-model/simulate</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={sim.status} demoText={sim.error} />
                <button onClick={runSimulate} style={btn(true)}>Run simulation →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              Multipliers on base inputs, sampled by a <b>Halton low-discrepancy sequence</b> (prime bases, inverse-CDF mapped).
              Deterministic — same inputs, same results. No pseudo-random generator anywhere.
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead>
                <tr><th style={th}>Driver</th><th style={th}>Distribution</th><th style={th}>Min ×</th><th style={th}>Mode ×</th><th style={th}>Max ×</th><th style={th} /></tr>
              </thead>
              <tbody>
                {uncertain.map((u, i) => (
                  <tr key={i}>
                    <td style={td}>
                      <select style={{ ...inputStyle, width: 150 }} value={u.param}
                        onChange={(e) => setUncertain(uncertain.map((x, j) => (j === i ? { ...x, param: e.target.value } : x)))}>
                        {DRIVERS.map((d) => <option key={d} value={d}>{DRIVER_LABELS[d]}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <select style={{ ...inputStyle, width: 110 }} value={u.dist}
                        onChange={(e) => setUncertain(uncertain.map((x, j) => (j === i ? { ...x, dist: e.target.value } : x)))}>
                        <option value="triangular">triangular</option><option value="uniform">uniform</option>
                      </select>
                    </td>
                    {['low', 'mode', 'high'].map((k) => (
                      <td key={k} style={td}>
                        <input type="number" step="0.01" style={{ ...inputStyle, width: 72 }} value={u[k]}
                          disabled={k === 'mode' && u.dist === 'uniform'}
                          onChange={(e) => setUncertain(uncertain.map((x, j) => (j === i ? { ...x, [k]: parseFloat(e.target.value) || 0 } : x)))} />
                      </td>
                    ))}
                    <td style={td}>
                      <button onClick={() => setUncertain(uncertain.filter((_, j) => j !== i))}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <button onClick={() => uncertain.length < 10 && setUncertain([...uncertain, { param: 'debt_rate', dist: 'uniform', low: 0.9, mode: 1.0, high: 1.2 }])}
                style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 6, color: T.navy, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 12px' }}>+ uncertain input</button>
              <Field label="Scenarios (≤2000)"><input type="number" style={{ ...inputStyle, width: 90 }} value={simCfg.n_scenarios}
                onChange={(e) => setSimCfg({ ...simCfg, n_scenarios: Math.min(2000, Math.max(16, parseInt(e.target.value, 10) || 500)) })} /></Field>
              <Field label="IRR hurdle %"><input type="number" style={{ ...inputStyle, width: 80 }} value={simCfg.hurdle_irr_pct}
                onChange={(e) => setSimCfg({ ...simCfg, hurdle_irr_pct: parseFloat(e.target.value) || 10 })} /></Field>
            </div>
          </div>

          {sim.status === 'demo' && (
            <div style={{ ...card, background: '#fdf4f4', border: `1px solid ${T.red}33` }}>
              <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>Simulation engine call failed — no figures shown.</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{String(sim.error)}</div>
            </div>
          )}
          {sim.status === 'live' && sim.data && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Kpi label="IRR P5 / P50 / P95" value={`${fmtPct(sim.data.equity_irr.p5, 1)} / ${fmtPct(sim.data.equity_irr.p50, 1)} / ${fmtPct(sim.data.equity_irr.p95, 1)}`} sub={`mean ${fmtPct(sim.data.equity_irr.mean, 1)} · deterministic ${fmtPct(sim.data.deterministic.equity_irr, 1)}`} color={T.teal} />
                <Kpi label="Min-DSCR P5 / P50 / P95" value={`${fmtNum(sim.data.min_dscr.p5)} / ${fmtNum(sim.data.min_dscr.p50)} / ${fmtNum(sim.data.min_dscr.p95)}`} sub={`deterministic ${fmtNum(sim.data.deterministic.min_dscr)}`} />
                <Kpi label={`P(IRR < ${simCfg.hurdle_irr_pct}%)`} value={fmtPct(sim.data.prob_irr_below_hurdle, 1)} color={sim.data.prob_irr_below_hurdle > 0.5 ? T.red : T.navy} sub={`${sim.data.n_scenarios} Halton scenarios`} />
                <Kpi label="P(min DSCR < 1.0)" value={fmtPct(sim.data.prob_dscr_below_1, 1)} color={sim.data.prob_dscr_below_1 > 0.1 ? T.red : T.green} sub="Debt-service break probability" />
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                {[['equity_irr', 'Equity IRR distribution', (v) => fmtPct(v, 1), T.teal],
                  ['min_dscr', 'Min senior DSCR distribution', (v) => fmtNum(v, 2), T.indigo]].map(([key, title, fmt, color]) => {
                  const h = sim.data[key].histogram;
                  const data = h ? h.counts.map((c, i) => ({ bin: fmt((h.bin_edges[i] + h.bin_edges[i + 1]) / 2), count: c })) : [];
                  return (
                    <div key={key} style={{ ...card, flex: 1, minWidth: 420 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>{title}</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={Math.ceil(data.length / 10)} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill={color} radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginBottom: 18 }}>
                {sim.data.method.note} Sequence: {sim.data.method.sequence}, first {sim.data.method.skip} points skipped.
                {sim.data.n_failed > 0 && ` ${sim.data.n_failed} scenario(s) had undefined IRR (excluded).`}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ TAB: SOLVER ════════════════════════════════════════════════════ */}
      {tab === 'solver' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={secTitle}>Goal-Seek Solver (bisection)</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/financial-model/solve</span>
            <div style={{ marginLeft: 'auto' }}><Badge status={solve.status} demoText={solve.error} /></div>
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
            Solves the chosen input for a target metric by bisection on the input multiplier (tolerance 1e-6, ≤80 iterations).
            Each trial point is a full model evaluation server-side.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
            <Field label="Solve for">
              <select style={{ ...inputStyle, width: 190 }} value={solveCfg.solve_for} onChange={(e) => setSolveCfg({ ...solveCfg, solve_for: e.target.value })}>
                <option value="ppa_price">PPA price</option><option value="capex">Capex</option>
                <option value="gearing">Gearing</option><option value="merchant_price">Merchant price</option>
                <option value="capture_rate">Merchant capture rate</option>
                <option value="refi_year">Refi year (discrete scan)</option>
              </select>
            </Field>
            <Field label="Target metric">
              <select style={{ ...inputStyle, width: 200 }} value={solveCfg.target_metric} onChange={(e) => setSolveCfg({ ...solveCfg, target_metric: e.target.value })}>
                {Object.entries(SOLVE_METRICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label={solveCfg.target_metric.includes('irr') ? 'Target (e.g. 0.10 = 10%)' : 'Target value'}>
              <input type="number" step="0.005" style={{ ...inputStyle, width: 110 }} value={solveCfg.target_value}
                onChange={(e) => setSolveCfg({ ...solveCfg, target_value: parseFloat(e.target.value) || 0 })} />
            </Field>
            <button onClick={runSolve} style={btn(true)}>Solve →</button>
          </div>
          {solve.status === 'demo' && (
            <div style={{ padding: '10px 14px', background: '#fdf4f4', border: `1px solid ${T.red}33`, borderRadius: 8 }}>
              <div style={{ fontSize: 12.5, color: T.red, fontWeight: 700 }}>Solver failed or target unattainable.</div>
              <div style={{ fontSize: 11.5, color: T.sub, marginTop: 3 }}>{String(solve.error)}</div>
            </div>
          )}
          {solve.status === 'live' && solve.data && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Kpi label={`Solved ${DRIVER_LABELS[solve.data.solve_for] || solve.data.solve_for}`}
                value={solve.data.solve_for === 'gearing' || solve.data.solve_for === 'capture_rate' ? `${fmtNum(solve.data.solved_value, 2)}%`
                  : solve.data.solve_for === 'capex' ? fmtM(solve.data.solved_value)
                    : solve.data.solve_for === 'refi_year' ? `Year ${solve.data.solved_value}`
                      : `$${fmtNum(solve.data.solved_value, 2)}/MWh`}
                sub={solve.data.solved_multiplier != null
                  ? `× ${fmtNum(solve.data.solved_multiplier, 4)} of base (${fmtNum(solve.data.base_value, 2)})`
                  : String(solve.data.method)} color={T.teal} />
              <Kpi label="Achieved metric"
                value={solve.data.target_metric.includes('irr') ? fmtPct(solve.data.achieved_value) : fmtNum(solve.data.achieved_value)}
                sub={`target ${solve.data.target_metric.includes('irr') ? fmtPct(solve.data.target_value) : fmtNum(solve.data.target_value)} · ${SOLVE_METRICS[solve.data.target_metric] || solve.data.target_metric}`} />
              <Kpi label={solve.data.solve_for === 'refi_year' ? 'Years scanned' : 'Bisection iterations'} value={solve.data.iterations} sub={`${solve.data.model_evaluations} full model evaluations`} />
              <div style={{ flex: 2, minWidth: 260, display: 'flex', alignItems: 'center' }}>
                <button onClick={() => {
                  const path = {
                    ppa_price: ['revenue', 'ppa', 'price_usd_mwh'], merchant_price: ['revenue', 'merchant', 'price_usd_mwh'],
                    capex: ['capex', 'total_capex_musd'], gearing: ['tranches', 0, 'gearing_pct'],
                    capture_rate: ['revenue', 'merchant', 'capture_rate_pct'], refi_year: ['refinancing', 'year'],
                  }[solve.data.solve_for];
                  if (path) setInputs(setIn(inputs, path, solve.data.solved_value));
                }} style={{ ...btn(true), background: T.teal }}>Apply solved value to inputs ←</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ SOLVER TAB PART 2: ISO-METRIC FRONTIER ═════════════════════════ */}
      {tab === 'solver' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={secTitle}>Iso-Metric Frontier — gearing × PPA price</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/financial-model/solve-frontier</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Badge status={frontier.status} demoText={frontier.error} />
              <button onClick={runFrontier} style={btn(true)}>Trace frontier →</button>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
            Grid-scan over gearing; at each level the PPA-price multiplier is bisected in [0.2, 5.0] to hold the target metric —
            the curve answers "what PPA price do I need at each gearing to keep the same {SOLVE_METRICS[frontCfg.target_metric]}?".
            Slope shows whether leverage is accretive (falling) or dilutive (rising) at your debt cost.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
            <Field label="Target metric">
              <select style={{ ...inputStyle, width: 200 }} value={frontCfg.target_metric} onChange={(e) => setFrontCfg({ ...frontCfg, target_metric: e.target.value })}>
                {Object.entries(SOLVE_METRICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Target value"><input type="number" step="0.005" style={{ ...inputStyle, width: 90 }} value={frontCfg.target_value}
              onChange={(e) => setFrontCfg({ ...frontCfg, target_value: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Gearing min %"><input type="number" style={{ ...inputStyle, width: 70 }} value={frontCfg.gearing_min_pct}
              onChange={(e) => setFrontCfg({ ...frontCfg, gearing_min_pct: parseFloat(e.target.value) || 5 })} /></Field>
            <Field label="Gearing max %"><input type="number" style={{ ...inputStyle, width: 70 }} value={frontCfg.gearing_max_pct}
              onChange={(e) => setFrontCfg({ ...frontCfg, gearing_max_pct: parseFloat(e.target.value) || 95 })} /></Field>
            <Field label="Steps (3–15)"><input type="number" style={{ ...inputStyle, width: 60 }} value={frontCfg.gearing_steps}
              onChange={(e) => setFrontCfg({ ...frontCfg, gearing_steps: Math.min(15, Math.max(3, parseInt(e.target.value, 10) || 7)) })} /></Field>
          </div>
          {frontier.status === 'demo' && (
            <div style={{ padding: '10px 14px', background: '#fdf4f4', border: `1px solid ${T.red}33`, borderRadius: 8 }}>
              <div style={{ fontSize: 12.5, color: T.red, fontWeight: 700 }}>Frontier call failed — no figures shown.</div>
              <div style={{ fontSize: 11.5, color: T.sub, marginTop: 3 }}>{String(frontier.error)}</div>
            </div>
          )}
          {frontier.status === 'live' && frontierChart && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 440 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={frontierChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="gearing" tick={{ fontSize: 10 }} label={{ value: 'Gearing %', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'PPA $/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [n === 'ppa' ? `$${fmtNum(v, 2)}/MWh` : fmtNum(v, 4), n === 'ppa' ? 'Required PPA price' : n]} />
                    <Line dataKey="ppa" name="Required PPA price" stroke={T.navy} strokeWidth={2.4} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Gearing %</th><th style={th}>PPA $/MWh</th><th style={th}>Achieved</th><th style={th}>Min DSCR</th></tr></thead>
                  <tbody>
                    {frontier.data.points.map((p, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 700 }}>{fmtNum(p.gearing_pct, 1)}</td>
                        <td style={td}>{p.attainable ? `$${fmtNum(p.ppa_price_usd_mwh, 2)}` : 'not attainable'}</td>
                        <td style={td}>{p.attainable ? (frontCfg.target_metric.includes('irr') ? fmtPct(p.achieved_metric) : fmtNum(p.achieved_metric)) : '—'}</td>
                        <td style={td}>{p.attainable ? fmtNum(p.min_dscr_senior) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>
                  {frontier.data.model_evaluations} full model evaluations · {frontier.data.method}
                </div>
              </div>
            </div>
          )}
          {frontier.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the target and gearing range, then trace the frontier.</div>}
        </div>
      )}

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/financial_model_engine.py — all formulas documented in the module docstring (S-curve/IDC,
        waterfall priority, sculpting, MACRS, carryforward ledger, XIRR Newton+bisection, LLCR/PLCR, Halton QMC inverse-CDF,
        bisection goal-seek, climate transmission channels §7, refinancing §8, inflation & real IRR §9, working capital §10,
        SLL margin ratchet §11, sustainability analytics & PCAF §12, portfolio consolidation + HoldCo §13, solver expansion
        & iso-metric frontier §14). Fixed-point circularity ≤50 iters @ 1e-6. Climate paths: seeded NGFS Phase 5 extract
        (IIASA Scenario Explorer), 5-yr steps interpolated to annual server-side; shadow price / grid baseline / diversification
        proxy are labeled user assumptions. Templates are hand-authored illustrative defaults. This page renders engine
        output only — no financial math in the browser beyond display formatting.
      </div>
    </div>
  );
}
