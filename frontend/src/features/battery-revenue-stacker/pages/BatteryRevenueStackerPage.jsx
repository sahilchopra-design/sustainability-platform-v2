import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ComposedChart, Line, LineChart,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Battery Revenue Stacker (NX2-07)
// BESS revenue stacking on the deterministic backend engine (no PRNG anywhere):
//   1. GET  /api/v1/bess-stacking/ref/defaults       documented default shape + params
//   2. GET  /api/v1/bess-stacking/ref/market-menus   GB/PJM-style derating tables + ancillary menu (labeled)
//   3. POST /api/v1/bess-stacking/stack              per-year stack — greedy OR DP-optimal dispatch,
//                                                    calendar+cycle aging, warranty envelope, intraday
//                                                    switching layer, carbon-arbitrage analytics
//   4. POST /api/v1/bess-stacking/dispatch-compare   one-day DP vs greedy (uplift %, SoC path)
//   5. POST /api/v1/bess-stacking/fr-cooptimize      FR MW-reservation sweep (opportunity cost, optimal split)
//   6. POST /api/v1/bess-stacking/structures         toll vs merchant vs hybrid @ P50/P90 (maximin)
//   7. POST /api/v1/bess-stacking/augmentation-optimize  trigger sweep minimising $/MWh retained
//   8. GET  /api/v1/grid-carbon/forecast             OPTIONAL live GB intensity (UK NESO, CC-BY) —
//      used (a) as a labeled price PROXY, (b) as the carbon-intensity shape for the
//      carbon-arbitrage analytics (charge-hour vs discharge-hour intensity).
// Requests use the CRA dev proxy (/api → localhost:8001) + global axios Bearer.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// Static fallback copy of the engine's documented default shape (hand-authored
// modeling convention — used only if GET /ref/defaults is unreachable).
const FALLBACK_SHAPE = [
  42, 38, 35, 33, 32, 33, 45, 62, 75, 68, 55, 48,
  45, 44, 46, 52, 68, 95, 118, 110, 88, 70, 58, 48,
];

// Intensity→price proxy band. The live-GB mode linearly maps hourly carbon
// intensity (gCO2/kWh) into this $/MWh band. LABELED ILLUSTRATION: intensity
// is not a price; the mapping only assumes fossil-marginal (high-intensity)
// hours tend to be high-price hours.
const PROXY_PRICE_MIN = 35;
const PROXY_PRICE_MAX = 118;

const fmtUsd = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `$${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}M`;
const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run the stack</span>;
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
const lbl = { fontSize: 11, color: T.sub, fontWeight: 600, display: 'block', marginBottom: 3 };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const secH = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const chip = { fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' };
const amberNote = { fontSize: 11.5, color: T.amber, background: '#fef3c7', border: `1px solid ${T.gold}66`, borderRadius: 8, padding: '8px 12px', marginBottom: 10 };
const runBtn = (disabled) => ({
  background: disabled ? T.sub : T.navy, color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 20px', fontSize: 12.5, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.font,
});

const Field = ({ label, value, onChange, step = 'any', min, unit, placeholder }) => (
  <div style={{ minWidth: 130, flex: 1 }}>
    <label style={lbl}>{label}{unit ? <span style={{ color: T.gold }}> · {unit}</span> : null}</label>
    <input type="number" step={step} min={min} style={inputStyle} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} />
  </div>
);

const ACTION_COLOR = { charge: T.teal, discharge: T.red, fr_committed: T.purple, idle: '#cbd5e1' };

export default function BatteryRevenueStackerPage() {
  // ── Inputs (engine-documented defaults; every value editable) ─────────────
  const [inp, setInp] = useState({
    power_mw: 100, energy_mwh: 400, round_trip_efficiency_pct: 88,
    cycles_per_day_cap: 1.5, degradation_pct_per_1000_cycles: 2.5,
    calendar_fade_pct_per_year: 0,
    augmentation_trigger_pct: 80, augmentation_cost_usd_per_kwh: 150,
    fr_price_usd_per_mw_yr: 45000, fr_committed_hours_per_day: 4,
    capacity_price_usd_per_mw_yr: 30000, capacity_derating_factor: 0.6,
    fixed_opex_usd_per_mw_yr: 10000, variable_opex_usd_per_mwh: 2, years: 15,
  });
  const set = (k) => (v) => setInp((p) => ({ ...p, [k]: v }));

  // Dispatch method: 'greedy' (legacy screening) | 'dp_optimal' (SoC-grid DP)
  const [dispatchMethod, setDispatchMethod] = useState('dp_optimal');
  // Warranty envelope (blank = not checked)
  const [warrantyCycles, setWarrantyCycles] = useState('');
  const [warrantyDod, setWarrantyDod] = useState('');
  // Intraday switching layer
  const [intradayOn, setIntradayOn] = useState(false);
  const [idMult, setIdMult] = useState(1.15);
  const [idCapture, setIdCapture] = useState(60);
  // Carbon-arbitrage analytics (needs the live GB intensity shape)
  const [carbonOn, setCarbonOn] = useState(false);
  const [greenTollPrem, setGreenTollPrem] = useState(2); // $/kW-yr, labeled observation

  // Price shape: 'default' | 'custom' | 'live_gb'
  const [shapeMode, setShapeMode] = useState('default');
  const [customShape, setCustomShape] = useState(FALLBACK_SHAPE.map(String));

  const [refDefaults, setRefDefaults] = useState({ status: 'loading', data: null, error: null });
  const [menus, setMenus] = useState({ status: 'loading', data: null, error: null });
  const [gb, setGb] = useState({ status: 'idle', hourlyIntensity: null, proxyShape: null, from: null, error: null });
  const [res, setRes] = useState({ status: 'idle', data: null, error: null });

  // Optimization-lab panels (each on demand)
  const [cmp, setCmp] = useState({ status: 'idle', data: null, error: null });      // /dispatch-compare
  const [frOpt, setFrOpt] = useState({ status: 'idle', data: null, error: null });  // /fr-cooptimize
  const [structRes, setStructRes] = useState({ status: 'idle', data: null, error: null }); // /structures
  const [augOpt, setAugOpt] = useState({ status: 'idle', data: null, error: null }); // /augmentation-optimize

  // Structure terms (toll / hybrid)
  const [structure, setStructure] = useState('merchant'); // 'merchant' | 'tolled'
  const [tollFeeUsdKwYr, setTollFeeUsdKwYr] = useState(85);
  const [floorUsdKwYr, setFloorUsdKwYr] = useState(50);
  const [upsideSharePct, setUpsideSharePct] = useState(50);
  const [p90Scalar, setP90Scalar] = useState(0.7);

  useEffect(() => {
    let alive = true;
    axios.get('/api/v1/bess-stacking/ref/defaults', { timeout: 15000 })
      .then(({ data }) => { if (alive) { setRefDefaults({ status: 'live', data, error: null }); setCustomShape(data.price_shape_usd_mwh.map(String)); } })
      .catch((e) => { if (alive) setRefDefaults({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); });
    axios.get('/api/v1/bess-stacking/ref/market-menus', { timeout: 15000 })
      .then(({ data }) => { if (alive) setMenus({ status: 'live', data, error: null }); })
      .catch((e) => { if (alive) setMenus({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); });
    return () => { alive = false; };
  }, []);

  const defaultShape = refDefaults.data?.price_shape_usd_mwh || FALLBACK_SHAPE;

  const loadGbShape = useCallback(async () => {
    setGb({ status: 'loading', hourlyIntensity: null, proxyShape: null, from: null, error: null });
    try {
      const { data } = await axios.get('/api/v1/grid-carbon/forecast', { params: { hours: 24 }, timeout: 25000 });
      const periods = data?.periods || [];
      if (periods.length < 2) throw new Error('empty forecast');
      // 48 half-hour periods → 24 hourly means, indexed by the period's UTC hour
      const buckets = Array.from({ length: 24 }, () => []);
      periods.slice(0, 48).forEach((p) => {
        const h = new Date(p.from).getUTCHours();
        if (p.forecast != null && !isNaN(h)) buckets[h].push(p.forecast);
      });
      const hourly = buckets.map((b) => (b.length ? b.reduce((s, x) => s + x, 0) / b.length : null));
      const known = hourly.filter((x) => x != null);
      const mean = known.reduce((s, x) => s + x, 0) / known.length;
      const filled = hourly.map((x) => (x == null ? mean : x));
      const iMin = Math.min(...filled); const iMax = Math.max(...filled);
      const proxy = filled.map((i) => iMax > iMin
        ? PROXY_PRICE_MIN + ((i - iMin) / (iMax - iMin)) * (PROXY_PRICE_MAX - PROXY_PRICE_MIN)
        : (PROXY_PRICE_MIN + PROXY_PRICE_MAX) / 2);
      setGb({
        status: 'live', hourlyIntensity: filled.map((x) => Math.round(x)),
        proxyShape: proxy.map((x) => Math.round(x * 100) / 100),
        from: periods[0]?.from, error: null,
      });
    } catch (e) {
      setGb({ status: 'demo', hourlyIntensity: null, proxyShape: null, from: null, error: e?.response?.data?.detail || e.message });
    }
  }, []);

  useEffect(() => { if ((shapeMode === 'live_gb' || carbonOn) && gb.status === 'idle') loadGbShape(); }, [shapeMode, carbonOn, gb.status, loadGbShape]);

  const activeShape = useMemo(() => {
    if (shapeMode === 'custom') return customShape.map((s) => parseFloat(s) || 0);
    if (shapeMode === 'live_gb') return gb.proxyShape; // null until loaded
    return defaultShape;
  }, [shapeMode, customShape, gb.proxyShape, defaultShape]);

  const shapePreview = useMemo(() => (activeShape || defaultShape).map((p, h) => ({
    hour: h, price: p, intensity: (shapeMode === 'live_gb' || carbonOn) ? gb.hourlyIntensity?.[h] : undefined,
  })), [activeShape, defaultShape, shapeMode, carbonOn, gb.hourlyIntensity]);

  // Shared payload builder for every engine POST (single source of truth).
  const buildPayload = useCallback(() => {
    const payload = {
      power_mw: parseFloat(inp.power_mw), energy_mwh: parseFloat(inp.energy_mwh),
      round_trip_efficiency_pct: parseFloat(inp.round_trip_efficiency_pct),
      cycles_per_day_cap: parseFloat(inp.cycles_per_day_cap),
      degradation_pct_per_1000_cycles: parseFloat(inp.degradation_pct_per_1000_cycles),
      calendar_fade_pct_per_year: parseFloat(inp.calendar_fade_pct_per_year) || 0,
      augmentation_trigger_pct: parseFloat(inp.augmentation_trigger_pct),
      augmentation_cost_usd_per_kwh: parseFloat(inp.augmentation_cost_usd_per_kwh),
      fr_price_usd_per_mw_yr: parseFloat(inp.fr_price_usd_per_mw_yr),
      fr_committed_hours_per_day: parseFloat(inp.fr_committed_hours_per_day),
      capacity_price_usd_per_mw_yr: parseFloat(inp.capacity_price_usd_per_mw_yr),
      capacity_derating_factor: parseFloat(inp.capacity_derating_factor),
      fixed_opex_usd_per_mw_yr: parseFloat(inp.fixed_opex_usd_per_mw_yr),
      variable_opex_usd_per_mwh: parseFloat(inp.variable_opex_usd_per_mwh),
      years: parseInt(inp.years, 10),
      dispatch_method: dispatchMethod,
    };
    if (shapeMode !== 'default' && activeShape) payload.price_shape_usd_mwh = activeShape;
    if (warrantyCycles !== '' && parseFloat(warrantyCycles) > 0) payload.warranty_max_cycles_per_year = parseFloat(warrantyCycles);
    if (warrantyDod !== '' && parseFloat(warrantyDod) > 0) payload.warranty_max_dod_pct = parseFloat(warrantyDod);
    if (intradayOn) {
      payload.intraday_spread_multiplier = parseFloat(idMult) || 1.15;
      payload.intraday_capture_pct = parseFloat(idCapture) || 60;
    }
    if (carbonOn && gb.hourlyIntensity) payload.intensity_shape_gco2_kwh = gb.hourlyIntensity;
    return payload;
  }, [inp, dispatchMethod, shapeMode, activeShape, warrantyCycles, warrantyDod, intradayOn, idMult, idCapture, carbonOn, gb.hourlyIntensity]);

  const runStack = useCallback(async () => {
    if (shapeMode === 'live_gb' && !gb.proxyShape) return;
    setRes({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/bess-stacking/stack', buildPayload(), { timeout: 60000 });
      setRes({ status: 'live', data, error: null });
    } catch (e) {
      setRes({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [shapeMode, gb.proxyShape, buildPayload]);

  const runLab = useCallback(async (kind) => {
    const setters = { compare: setCmp, fr: setFrOpt, structures: setStructRes, aug: setAugOpt };
    const setter = setters[kind];
    setter({ status: 'loading', data: null, error: null });
    try {
      const payload = buildPayload();
      let url = '';
      if (kind === 'compare') url = '/api/v1/bess-stacking/dispatch-compare';
      if (kind === 'fr') { url = '/api/v1/bess-stacking/fr-cooptimize'; payload.fr_sweep_points = 11; }
      if (kind === 'aug') url = '/api/v1/bess-stacking/augmentation-optimize';
      if (kind === 'structures') {
        url = '/api/v1/bess-stacking/structures';
        payload.toll_fee_usd_per_kw_yr = parseFloat(tollFeeUsdKwYr) || 0;
        payload.floor_usd_per_kw_yr = parseFloat(floorUsdKwYr) || 0;
        payload.upside_share_pct = parseFloat(upsideSharePct) || 0;
        payload.p90_spread_scalar = Math.min(1, Math.max(0.05, parseFloat(p90Scalar) || 0.7));
      }
      const { data } = await axios.post(url, payload, { timeout: 90000 });
      setter({ status: 'live', data, error: null });
    } catch (e) {
      setter({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [buildPayload, tollFeeUsdKwYr, floorUsdKwYr, upsideSharePct, p90Scalar]);

  // ── Derived: merchant vs tolled per-year view (local, from live stack) ────
  const view = useMemo(() => {
    if (res.status !== 'live' || !res.data) return null;
    const d = res.data;
    const tollRevYr = parseFloat(tollFeeUsdKwYr || 0) * parseFloat(inp.power_mw || 0) * 1000; // $/kW-yr × kW
    const rows = d.per_year.map((y) => {
      const tolledNet = tollRevYr - y.opex_usd - y.augmentation_cost_usd;
      return { ...y, toll_revenue_usd: tollRevYr, tolled_net_usd: tolledNet };
    });
    const merchantTotal = d.totals_usd.net;
    const tolledTotal = rows.reduce((s, r) => s + r.tolled_net_usd, 0);
    return {
      rows, merchantTotal, tolledTotal, tollRevYr, totals: d.totals_usd, aug: d.augmentation_years,
      y1: d.year1_dispatch, method: d.methodology, shapeUsed: d.price_shape_used,
      dispatchComparison: d.dispatch_comparison || null, warranty: d.warranty_check || null,
      intraday: d.intraday_layer || null, carbon: d.carbon_analytics || null,
      derating: d.derating_reference || null,
    };
  }, [res, tollFeeUsdKwYr, inp.power_mw]);

  const stackChart = useMemo(() => view ? view.rows.map((y) => ({
    year: `Y${y.year}`,
    Arbitrage: y.arbitrage_revenue_usd / 1e6,
    Intraday: (y.intraday_revenue_usd || 0) / 1e6,
    'Frequency response': y.fr_revenue_usd / 1e6,
    'Capacity market': y.capacity_revenue_usd / 1e6,
    'Tolling fee': y.toll_revenue_usd / 1e6,
    net: y.net_margin_usd / 1e6,
    tollednet: y.tolled_net_usd / 1e6,
  })) : [], [view]);

  const degChart = useMemo(() => view ? view.rows.map((y) => ({
    year: `Y${y.year}`, soh: y.soh_start_pct, usable: y.usable_mwh,
    aug: y.augmentation_cost_usd > 0 ? y.soh_start_pct : null,
    breach: y.warranty_breach ? y.soh_start_pct : null,
  })) : [], [view]);

  const durationH = (parseFloat(inp.energy_mwh) || 0) / (parseFloat(inp.power_mw) || 1);

  // Carbon panel derivations (display-level, from live carbon block + user premium input)
  const carbonView = useMemo(() => {
    if (!view || !view.carbon || !view.carbon.year1) return null;
    const c = view.carbon;
    const premYr = (parseFloat(greenTollPrem) || 0) * parseFloat(inp.power_mw || 0) * 1000; // $/kW-yr × kW
    const y1 = c.year1;
    return {
      ...c,
      greenTollRevYr: premYr,
      greenTollPerT: y1.net_displaced_tco2e_yr > 0 ? premYr / y1.net_displaced_tco2e_yr : null,
    };
  }, [view, greenTollPrem, inp.power_mw]);

  const socChart = useMemo(() => {
    if (cmp.status !== 'live' || !cmp.data) return [];
    const soc = cmp.data.dp_optimal?.soc_path_mwh || [];
    return cmp.data.dp_hourly_plan.map((r, h) => ({
      hour: h, price: r.price_usd_mwh,
      dpMwh: r.mwh, greedyMwh: cmp.data.greedy_hourly_plan[h]?.mwh || 0,
      soc: soc[h + 1] != null ? soc[h + 1] : null,
    }));
  }, [cmp]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-07</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Battery Revenue Stacker</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>BESS Stacking Engine</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>DP-Optimal + Greedy Dispatch</span>
          <span style={{ background: T.green + '22', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Carbon Arbitrage</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>UK NESO Shape (optional)</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Per-year BESS revenue stack on the deterministic engine: energy arbitrage from either the greedy screening
        dispatch or the <b>SoC-grid dynamic-programming optimum</b> (intra-day SoC bounds, power limits, efficiency and
        cycle budget all enforced — algorithm documented in-response), frequency-response and capacity streams, an
        optional intraday switching layer, calendar + cycle aging with warranty-envelope checks and an augmentation
        schedule, toll / merchant / hybrid structures at P50/P90, and carbon-arbitrage analytics off the live GB grid
        intensity. All math is backend calculation — no fabricated numbers. Feeds{' '}
        <span style={{ fontFamily: T.mono }}>/bess-project-finance</span> and the Hybrid Project Workbench.
      </div>

      {/* ── Battery + market inputs ─────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={secH}>System &amp; Market Parameters</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
            Editable defaults — engine-documented modeling conventions (NREL ATB / GB market ranges), not live quotes
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={chip}>GET /api/v1/bess-stacking/ref/defaults</span>
            <Badge status={refDefaults.status === 'loading' ? 'loading' : refDefaults.status} demoText={refDefaults.error} />
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Battery</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="Power" unit="MW" value={inp.power_mw} onChange={set('power_mw')} min={1} />
          <Field label="Energy" unit="MWh" value={inp.energy_mwh} onChange={set('energy_mwh')} min={1} />
          <Field label="Round-trip efficiency" unit="%" value={inp.round_trip_efficiency_pct} onChange={set('round_trip_efficiency_pct')} min={50} />
          <Field label="Cycle cap" unit="cycles/day" value={inp.cycles_per_day_cap} onChange={set('cycles_per_day_cap')} min={0.1} />
          <Field label="Cycle fade" unit="%/1000 cyc" value={inp.degradation_pct_per_1000_cycles} onChange={set('degradation_pct_per_1000_cycles')} min={0} />
          <Field label="Calendar fade" unit="% SoH/yr" value={inp.calendar_fade_pct_per_year} onChange={set('calendar_fade_pct_per_year')} min={0} />
          <Field label="Augmentation trigger" unit="% SoH" value={inp.augmentation_trigger_pct} onChange={set('augmentation_trigger_pct')} min={50} />
          <Field label="Augmentation cost" unit="$/kWh" value={inp.augmentation_cost_usd_per_kwh} onChange={set('augmentation_cost_usd_per_kwh')} min={0} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Ancillary · Capacity · Opex · Horizon</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="FR / ancillary rate" unit="$/MW-yr (24/7)" value={inp.fr_price_usd_per_mw_yr} onChange={set('fr_price_usd_per_mw_yr')} min={0} />
          <Field label="FR committed hours" unit="h/day" value={inp.fr_committed_hours_per_day} onChange={set('fr_committed_hours_per_day')} min={0} />
          <Field label="Capacity price" unit="$/MW-yr" value={inp.capacity_price_usd_per_mw_yr} onChange={set('capacity_price_usd_per_mw_yr')} min={0} />
          <Field label="Derating factor" unit="0–1" value={inp.capacity_derating_factor} onChange={set('capacity_derating_factor')} min={0} step="0.01" />
          <Field label="Fixed opex" unit="$/MW-yr" value={inp.fixed_opex_usd_per_mw_yr} onChange={set('fixed_opex_usd_per_mw_yr')} min={0} />
          <Field label="Variable opex" unit="$/MWh" value={inp.variable_opex_usd_per_mwh} onChange={set('variable_opex_usd_per_mwh')} min={0} />
          <Field label="Horizon" unit="years" value={inp.years} onChange={set('years')} min={1} step="1" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Dispatch · Warranty · Layers</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 220 }}>
            <label style={lbl}>Arbitrage dispatch method</label>
            <div style={{ display: 'flex', gap: 0, border: `1px solid ${T.navy}66`, borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
              {[['dp_optimal', 'DP optimal (SoC grid)'], ['greedy', 'Greedy (screening)']].map(([m, label]) => (
                <button key={m} onClick={() => setDispatchMethod(m)} style={{
                  background: dispatchMethod === m ? T.navy : 'transparent', color: dispatchMethod === m ? '#fff' : T.navy,
                  border: 'none', padding: '6px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
                }}>{label}</button>
              ))}
            </div>
          </div>
          <Field label="Warranty cycle cap (blank = off)" unit="cycles/yr" value={warrantyCycles} onChange={setWarrantyCycles} min={1} placeholder="e.g. 365" />
          <Field label="Warranty DoD cap (blank = off)" unit="%" value={warrantyDod} onChange={setWarrantyDod} min={1} placeholder="e.g. 90" />
          <div style={{ minWidth: 260 }}>
            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={intradayOn} onChange={(e) => setIntradayOn(e.target.checked)} />
              Intraday switching layer (DA→ID, documented)
            </label>
            {intradayOn && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Field label="ID spread multiplier" unit="×DA" value={idMult} onChange={setIdMult} min={0.1} step="0.05" />
                <Field label="Capture" unit="%" value={idCapture} onChange={setIdCapture} min={0} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 240 }}>
            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={carbonOn} onChange={(e) => setCarbonOn(e.target.checked)} />
              Carbon-arbitrage analytics (live GB intensity)
            </label>
            {carbonOn && <div style={{ fontSize: 10.5, color: T.sub }}>Uses the UK NESO 24h intensity forecast (CC-BY) as the gCO2/kWh shape. {gb.status === 'loading' ? 'Loading…' : gb.status === 'demo' ? 'Feed unreachable — carbon block will be omitted.' : gb.hourlyIntensity ? '● shape loaded' : ''}</div>}
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginTop: 10, fontFamily: T.mono }}>
          Duration {fmtNum(durationH, 1)} h · FR rate prorated by committed hours (h/24), hours removed from the arbitrage window ·
          total fade = calendar %/yr + cycle %/1000 EFC (additive convention) · DP quantization: quantum = P×RTE/8 (documented)
        </div>
      </div>

      {/* ── Price shape ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={secH}>Daily Price Shape (24 h, $/MWh)</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['default', 'Documented default'], ['custom', 'Custom 24h array'], ['live_gb', 'Live GB intensity proxy']].map(([m, label]) => (
              <button key={m} onClick={() => setShapeMode(m)} style={{
                background: shapeMode === m ? T.navy : 'transparent', color: shapeMode === m ? '#fff' : T.navy,
                border: `1px solid ${T.navy}66`, borderRadius: 6, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
              }}>{label}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {shapeMode === 'live_gb' && <span style={chip}>GET /api/v1/grid-carbon/forecast (UK NESO, CC-BY)</span>}
            {shapeMode === 'live_gb' && <Badge status={gb.status === 'idle' ? 'loading' : gb.status} demoText={gb.error} />}
            {shapeMode === 'default' && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Modeling convention — not market data</span>}
            {shapeMode === 'custom' && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ User-supplied</span>}
          </div>
        </div>

        {shapeMode === 'live_gb' && (
          <div style={amberNote}>
            <b>Stated proxy assumption (illustration, not real prices):</b> the live GB grid carbon-intensity forecast
            (gCO2/kWh, UK NESO) is linearly rescaled into a ${PROXY_PRICE_MIN}–${PROXY_PRICE_MAX}/MWh band —
            price(h) = {PROXY_PRICE_MIN} + (I(h) − I<sub>min</sub>)/(I<sub>max</sub> − I<sub>min</sub>) × {PROXY_PRICE_MAX - PROXY_PRICE_MIN}.
            Carbon intensity is <b>not</b> a market price; the mapping only assumes fossil-marginal (high-intensity) hours
            tend to be high-price hours. Use the custom array for actual site prices.
            {gb.from && <span style={{ fontFamily: T.mono }}> Forecast window starts {gb.from}.</span>}
            {gb.status === 'demo' && <div style={{ marginTop: 4 }}>NESO feed unreachable — no proxy shape generated (nothing is fabricated). Error: {String(gb.error)} <button onClick={loadGbShape} style={{ marginLeft: 6, fontSize: 11, cursor: 'pointer' }}>Retry</button></div>}
          </div>
        )}
        {shapeMode === 'default' && (
          <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
            {refDefaults.data?.price_shape_basis || 'Hand-authored two-peak day-ahead shape (overnight trough, morning ramp, midday solar depression, evening peak); levels indicative of 2023–2025 GB/ERCOT day-ahead averages. Labeled modeling convention for screening — not live or historical market data.'}
          </div>
        )}

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={shapePreview}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: 'Hour of day', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [fmtNum(v, 1), n === 'price' ? '$/MWh' : 'gCO2/kWh']} labelFormatter={(h) => `Hour ${h}:00`} />
            <Bar dataKey="price" name="price" fill={T.indigo} fillOpacity={0.75} radius={[2, 2, 0, 0]} />
            {(shapeMode === 'live_gb' || carbonOn) && gb.hourlyIntensity && <Line dataKey="intensity" name="intensity" stroke={T.amber} strokeWidth={2} dot={false} />}
          </ComposedChart>
        </ResponsiveContainer>

        {shapeMode === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, marginTop: 10 }}>
            {customShape.map((v, h) => (
              <div key={h}>
                <div style={{ fontSize: 9.5, color: T.sub, fontFamily: T.mono, textAlign: 'center' }}>h{h}</div>
                <input type="number" step="any" style={{ ...inputStyle, padding: '4px 4px', fontSize: 11, textAlign: 'center' }} value={v}
                  onChange={(e) => setCustomShape((prev) => prev.map((x, i) => (i === h ? e.target.value : x)))} />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={runStack} disabled={res.status === 'loading' || (shapeMode === 'live_gb' && !gb.proxyShape)} style={{
            ...runBtn(shapeMode === 'live_gb' && !gb.proxyShape), padding: '10px 26px', fontSize: 13,
          }}>
            {res.status === 'loading' ? 'Dispatching…' : `Run revenue stack (${dispatchMethod === 'dp_optimal' ? 'DP optimal' : 'greedy'}) →`}
          </button>
          <span style={chip}>POST /api/v1/bess-stacking/stack</span>
          <Badge status={res.status} demoText={res.error} />
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {res.status === 'live' && view && (
        <>
          {/* Structure toggle + KPIs */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={secH}>Revenue Stack — {parseFloat(inp.power_mw)} MW / {parseFloat(inp.energy_mwh)} MWh</h2>
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${T.navy}66`, borderRadius: 6, overflow: 'hidden' }}>
                {[['merchant', 'Merchant'], ['tolled', 'Tolled']].map(([m, label]) => (
                  <button key={m} onClick={() => setStructure(m)} style={{
                    background: structure === m ? T.navy : 'transparent', color: structure === m ? '#fff' : T.navy,
                    border: 'none', padding: '5px 16px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
                  }}>{label}</button>
                ))}
              </div>
              {structure === 'tolled' && (
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Tolling fee ($/kW-yr)
                  <input type="number" step="any" min="0" style={{ ...inputStyle, width: 90 }} value={tollFeeUsdKwYr} onChange={(e) => setTollFeeUsdKwYr(e.target.value)} />
                </label>
              )}
              <div style={{ marginLeft: 'auto' }}><Badge status="live" /></div>
            </div>
            {structure === 'tolled' && (
              <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
                Tolled structure: a fixed availability payment of <b>${fmtNum(view.tollRevYr / 1e6, 2)}M/yr</b> (fee × MW) replaces
                all merchant streams (arbitrage, FR, capacity — the toller takes that market risk). The owner retains opex and
                augmentation costs. Display-level derivation from the live engine stack; the P50/P90 structure lab below runs the
                full engine comparison including the floor + upside-share hybrid.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {structure === 'merchant' ? (
                <>
                  <Kpi label={`Net margin (${view.rows.length}y)`} value={fmtUsd(view.merchantTotal)} sub={`Arbitrage ${view.intraday ? '+ intraday ' : ''}+ FR + capacity − opex − augmentation`} color={T.green} />
                  <Kpi label="Arbitrage total" value={fmtUsd(view.totals.arbitrage)} sub={`Avg spread captured Y1: $${fmtNum((view.rows[0].avg_discharge_price_usd_mwh || 0) - (view.rows[0].avg_charge_price_usd_mwh || 0), 1)}/MWh`} color={T.indigo} />
                  {view.intraday && <Kpi label="Intraday uplift" value={fmtUsd(view.totals.intraday || 0)} sub={`Capture ${fmtPct(view.intraday.capture_pct, 0)} of best-market switching (labeled)`} color={T.purple} />}
                  <Kpi label="FR + capacity total" value={fmtUsd(view.totals.fr + view.totals.capacity)} sub={`FR ${fmtUsd(view.totals.fr)} · capacity ${fmtUsd(view.totals.capacity)}`} color={T.blue} />
                </>
              ) : (
                <>
                  <Kpi label={`Tolled net (${view.rows.length}y)`} value={fmtUsd(view.tolledTotal)} sub="Tolling fee − opex − augmentation" color={T.green} />
                  <Kpi label={`Merchant net (${view.rows.length}y)`} value={fmtUsd(view.merchantTotal)} sub="For comparison" color={T.indigo} />
                  <Kpi label="Toll vs merchant Δ" value={fmtUsd(view.tolledTotal - view.merchantTotal)} sub={view.tolledTotal >= view.merchantTotal ? 'Toll richer — take the fixed fee' : 'Merchant richer — keep market risk'} color={view.tolledTotal >= view.merchantTotal ? T.green : T.amber} />
                </>
              )}
              {view.dispatchComparison && (
                <Kpi label="DP vs greedy uplift" value={fmtPct(view.dispatchComparison.uplift_pct, 2)}
                  sub={`$${fmtNum(view.dispatchComparison.dp_margin_usd_day, 0)} vs $${fmtNum(view.dispatchComparison.greedy_margin_usd_day, 0)} per day (Y1)`} color={T.teal} />
              )}
              <Kpi label="Cycles / year (Y1)" value={fmtNum(view.rows[0].annual_cycles, 0)} sub={`${fmtNum(view.rows[0].cycles_per_day, 2)} equivalent full cycles/day`} />
              <Kpi label="Augmentations" value={view.aug.length} sub={view.aug.length ? view.aug.map((a) => `Y${a.year}: ${fmtUsd(a.cost_usd)}`).join(' · ') : 'None within horizon'} color={view.aug.length ? T.amber : T.navy} />
              {view.warranty && (
                <Kpi label="Warranty envelope" value={view.warranty.any_breach ? `BREACH ×${view.warranty.breach_years.length}` : 'Within terms'}
                  sub={`Caps: ${view.warranty.cycles_cap_per_year != null ? `${fmtNum(view.warranty.cycles_cap_per_year, 0)} cyc/yr` : '—'} · ${view.warranty.dod_cap_pct != null ? `${fmtNum(view.warranty.dod_cap_pct, 0)}% DoD` : '—'}`}
                  color={view.warranty.any_breach ? T.red : T.green} />
              )}
            </div>

            {view.warranty && view.warranty.any_breach && (
              <div style={amberNote}>
                <b>Warranty breach years:</b>{' '}
                {view.warranty.breach_years.map((b) => `Y${b.year} (${b.breach_cycles ? `${fmtNum(b.annual_cycles, 0)} cyc vs cap ${fmtNum(b.cycles_cap, 0)}` : ''}${b.breach_cycles && b.breach_dod ? ' · ' : ''}${b.breach_dod ? `DoD ${fmtNum(b.max_dod_pct, 0)}% vs cap ${fmtNum(b.dod_cap_pct, 0)}%` : ''})`).join(' · ')}.{' '}
                {view.warranty.note}
              </div>
            )}

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 420 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  {structure === 'merchant' ? 'Revenue by stream per year ($M) + net margin line' : 'Tolling fee per year ($M) + tolled net line (merchant net dashed)'}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={stackChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`$${fmtNum(v, 2)}M`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {structure === 'merchant' ? (
                      <>
                        <Bar dataKey="Arbitrage" stackId="s" fill={T.indigo} />
                        {view.intraday && <Bar dataKey="Intraday" stackId="s" fill={T.purple} />}
                        <Bar dataKey="Frequency response" stackId="s" fill={T.teal} />
                        <Bar dataKey="Capacity market" stackId="s" fill={T.gold} radius={[3, 3, 0, 0]} />
                        <Line dataKey="net" name="Net margin" stroke={T.navy} strokeWidth={2} dot={{ r: 2 }} />
                      </>
                    ) : (
                      <>
                        <Bar dataKey="Tolling fee" fill={T.purple} radius={[3, 3, 0, 0]} />
                        <Line dataKey="tollednet" name="Tolled net" stroke={T.navy} strokeWidth={2} dot={{ r: 2 }} />
                        <Line dataKey="net" name="Merchant net (comp)" stroke={T.slate} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.4, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Degradation (calendar + cycle) &amp; augmentation — SoH % (line), usable MWh (bars), amber dot = augmentation, red dot = warranty breach
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={degChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="mwh" tick={{ fontSize: 10 }} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <YAxis yAxisId="soh" orientation="right" domain={[50, 100]} tick={{ fontSize: 10 }} label={{ value: 'SoH %', angle: 90, position: 'insideRight', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [fmtNum(v, 1), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="mwh" dataKey="usable" name="Usable MWh" fill={T.teal} fillOpacity={0.45} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="soh" dataKey="soh" name="SoH % (start of year)" stroke={T.red} strokeWidth={2} dot={{ r: 2 }} />
                    <Line yAxisId="soh" dataKey="aug" name="Augmentation" stroke="transparent" dot={{ r: 6, fill: T.amber }} legendType="circle" />
                    <Line yAxisId="soh" dataKey="breach" name="Warranty breach" stroke="transparent" dot={{ r: 5, fill: T.red }} legendType="circle" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Carbon-arbitrage analytics */}
          {carbonView && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <h2 style={secH}>Carbon-Arbitrage Analytics — Storage as a Decarbonisation Service</h2>
                <span style={chip}>engine carbon_analytics block · intensity: UK NESO forecast (CC-BY)</span>
                <div style={{ marginLeft: 'auto' }}><Badge status="live" /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <Kpi label="Net tCO2e displaced (Y1)" value={fmtNum(carbonView.year1.net_displaced_tco2e_yr, 0)} sub={`Charge @ ${fmtNum(carbonView.year1.charge_wavg_intensity_g_kwh, 0)} g/kWh → discharge @ ${fmtNum(carbonView.year1.discharge_wavg_intensity_g_kwh, 0)} g/kWh`} color={carbonView.year1.net_displaced_tco2e_yr > 0 ? T.green : T.red} />
                <Kpi label="Round-trip-loss emissions (Y1)" value={`${fmtNum(carbonView.year1.round_trip_loss_tco2e_yr, 0)} tCO2e`} sub="Losses carry charge-hour intensity (inside the net figure)" color={T.amber} />
                <Kpi label="Carbon value of arbitrage" value={carbonView.year1.carbon_value_usd_per_tco2e != null ? `$${fmtNum(carbonView.year1.carbon_value_usd_per_tco2e, 0)}/t` : '—'} sub="Arbitrage margin ÷ net tCO2e displaced — value metric, not abatement cost" color={T.teal} />
                <Kpi label={`Lifetime net displaced (${view.rows.length}y)`} value={`${fmtNum(carbonView.lifetime_net_displaced_tco2e, 0)} t`} sub={`Lifetime carbon value ${carbonView.lifetime_carbon_value_usd_per_tco2e != null ? `$${fmtNum(carbonView.lifetime_carbon_value_usd_per_tco2e, 0)}/t` : '—'}`} />
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1.2, minWidth: 320 }}>
                  <div style={{ fontSize: 11.5, color: T.sub }}>{carbonView.methodology}</div>
                </div>
                <div style={{ flex: 1, minWidth: 300, background: T.cream, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>"Green toll" premium panel — labeled emerging-market observation</div>
                  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Premium ($/kW-yr) over conventional toll
                    <input type="number" step="0.5" min="0" style={{ ...inputStyle, width: 80 }} value={greenTollPrem} onChange={(e) => setGreenTollPrem(e.target.value)} />
                  </label>
                  <div style={{ fontSize: 11.5, color: T.slate, marginTop: 8, fontFamily: T.mono }}>
                    Premium revenue: {fmtUsd(carbonView.greenTollRevYr, 2)}/yr
                    {carbonView.greenTollPerT != null && <> · implied ${fmtNum(carbonView.greenTollPerT, 1)}/tCO2e displaced</>}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                    Offtakers in several markets have begun paying availability premia for storage charged in low-carbon windows
                    ("green toll") — an EMERGING, unstandardised observation, not a quoted market. The panel prices YOUR premium
                    input against the engine's net displacement; nothing here is a market quote.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Year-1 dispatch inspection */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secH}>Year-1 Daily Dispatch Plan (engine output — {view.y1.method === 'dp_optimal' ? 'DP optimal' : 'greedy'})</h2>
              <span style={chip}>
                delivered {fmtNum(view.y1.delivered_mwh, 0)} MWh/day · charged {fmtNum(view.y1.charged_mwh, 0)} MWh/day · gross ${fmtNum(view.y1.gross_margin_usd, 0)}/day
                {view.y1.max_dod_pct != null ? ` · max DoD ${fmtNum(view.y1.max_dod_pct, 0)}%` : ''}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 8 }}>{view.method.arbitrage_dispatch}</div>
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={view.y1.hourly_plan}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                {view.y1.method === 'dp_optimal' && <YAxis yAxisId="soc" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'SoC MWh', angle: 90, position: 'insideRight', fontSize: 10 }} />}
                <Tooltip formatter={(v, n, p) => n === 'SoC (MWh)' ? [fmtNum(v, 0), n] : [`$${fmtNum(v, 1)}/MWh — ${p?.payload?.action}${p?.payload?.mwh ? ` (${fmtNum(p.payload.mwh, 0)} MWh)` : ''}`, `Hour ${p?.payload?.hour}`]} labelFormatter={() => ''} />
                <Bar dataKey="price_usd_mwh" radius={[2, 2, 0, 0]}>
                  {view.y1.hourly_plan.map((h, i) => <Cell key={i} fill={ACTION_COLOR[h.action] || T.slate} />)}
                </Bar>
                {view.y1.method === 'dp_optimal' && <Line yAxisId="soc" dataKey="soc_mwh" name="SoC (MWh)" stroke={T.navy} strokeWidth={2} dot={false} />}
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: T.sub }}>
              {Object.entries({ charge: 'Charge', discharge: 'Discharge', fr_committed: 'FR committed', idle: 'Idle' }).map(([k, label]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: ACTION_COLOR[k], borderRadius: 2, display: 'inline-block' }} />{label}
                </span>
              ))}
              {view.y1.method === 'dp_optimal' && <span>— navy line = intra-day state of charge (bounds asserted by the engine at every hour)</span>}
            </div>
          </div>

          {/* Per-year table */}
          <div style={{ ...card, overflowX: 'auto' }}>
            <h2 style={{ ...secH, marginBottom: 10 }}>Per-Year Stack Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1020 }}>
              <thead>
                <tr>
                  <th style={th}>Year</th><th style={th}>SoH %</th><th style={th}>Usable MWh</th><th style={th}>Cycles</th>
                  <th style={th}>Delivered MWh</th><th style={th}>Avg chg→dis $/MWh</th><th style={th}>Arbitrage</th>
                  {view.intraday && <th style={th}>Intraday</th>}
                  <th style={th}>FR</th><th style={th}>Capacity</th>
                  {structure === 'tolled' && <th style={th}>Tolling fee</th>}
                  <th style={th}>Opex</th><th style={th}>Augmentation</th>
                  {view.warranty && <th style={th}>Warranty</th>}
                  <th style={th}>{structure === 'tolled' ? 'Tolled net' : 'Net margin'}</th>
                </tr>
              </thead>
              <tbody>
                {view.rows.map((y) => (
                  <tr key={y.year} style={y.warranty_breach ? { background: '#fee2e2' } : y.augmentation_cost_usd > 0 ? { background: '#fffbeb' } : undefined}>
                    <td style={{ ...td, fontWeight: 700, color: T.navy }}>Y{y.year}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.soh_start_pct, 1)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.usable_mwh, 0)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.annual_cycles, 0)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.annual_delivered_mwh, 0)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.avg_charge_price_usd_mwh, 0)} → {fmtNum(y.avg_discharge_price_usd_mwh, 0)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(y.arbitrage_revenue_usd)}</td>
                    {view.intraday && <td style={{ ...td, fontFamily: T.mono, color: T.purple }}>{fmtUsd(y.intraday_revenue_usd || 0)}</td>}
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(y.fr_revenue_usd)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(y.capacity_revenue_usd)}</td>
                    {structure === 'tolled' && <td style={{ ...td, fontFamily: T.mono, color: T.purple }}>{fmtUsd(y.toll_revenue_usd)}</td>}
                    <td style={{ ...td, fontFamily: T.mono }}>({fmtUsd(y.opex_usd)})</td>
                    <td style={{ ...td, fontFamily: T.mono, color: y.augmentation_cost_usd > 0 ? T.amber : T.slate }}>{y.augmentation_cost_usd > 0 ? `(${fmtUsd(y.augmentation_cost_usd)})` : '—'}</td>
                    {view.warranty && <td style={td}>{y.warranty_breach ? <span style={{ background: '#fee2e2', color: T.red, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>BREACH</span> : '—'}</td>}
                    <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: (structure === 'tolled' ? y.tolled_net_usd : y.net_margin_usd) >= 0 ? T.green : T.red }}>
                      {fmtUsd(structure === 'tolled' ? y.tolled_net_usd : y.net_margin_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {res.status === 'demo' && (
        <div style={{ ...card, fontSize: 12, color: T.sub }}>
          BESS stacking engine unreachable — no figures shown (this page never fabricates results). Error: {String(res.error)}
        </div>
      )}

      {/* ══ Optimization Lab — DP-vs-greedy, FR split, structures, augmentation ══ */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h2 style={secH}>Optimization Lab</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
            Four deterministic engine solvers — each documents its method in-response
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 14 }}>
          Uses the SAME inputs and price shape as the stack above. Run each solver independently.
        </div>

        {/* 1. Dispatch compare */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>1 · Optimal (DP) vs Greedy Dispatch — one day</div>
            <button onClick={() => runLab('compare')} disabled={cmp.status === 'loading'} style={runBtn(false)}>{cmp.status === 'loading' ? 'Solving…' : 'Compare dispatches →'}</button>
            <span style={chip}>POST /api/v1/bess-stacking/dispatch-compare</span>
            <Badge status={cmp.status === 'idle' ? undefined : cmp.status} demoText={cmp.error} />
          </div>
          {cmp.status === 'live' && cmp.data && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="DP margin / day" value={`$${fmtNum(cmp.data.dp_optimal.gross_margin_usd, 0)}`} sub={`${fmtNum(cmp.data.dp_optimal.delivered_mwh, 0)} MWh delivered`} color={T.teal} />
                <Kpi label="Greedy margin / day" value={`$${fmtNum(cmp.data.greedy.gross_margin_usd, 0)}`} sub={`${fmtNum(cmp.data.greedy.delivered_mwh, 0)} MWh delivered`} />
                <Kpi label="Uplift" value={fmtPct(cmp.data.uplift_pct, 2)} sub={`≈ ${fmtUsd(cmp.data.annualized_uplift_usd)} annualized`} color={cmp.data.uplift_pct >= 0 ? T.green : T.red} />
                <Kpi label="DP grid" value={cmp.data.dp_optimal.grid ? `${cmp.data.dp_optimal.grid.soc_steps} SoC steps` : '—'} sub={cmp.data.dp_optimal.grid ? `quantum ${fmtNum(cmp.data.dp_optimal.grid.quantum_mwh, 2)} MWh · ${cmp.data.dp_optimal.grid.budget_steps} budget steps` : ''} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Hourly schedule: DP vs greedy energy (MWh, − = charge) + DP state of charge (line, right axis)</div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={socChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'MWh (±)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <YAxis yAxisId="soc" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'SoC MWh', angle: 90, position: 'insideRight', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [fmtNum(v, 1), n]} labelFormatter={(h) => `Hour ${h}:00`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="dpMwh" name="DP MWh" fill={T.teal} />
                  <Bar dataKey="greedyMwh" name="Greedy MWh" fill={T.slate} fillOpacity={0.5} />
                  <Line yAxisId="soc" dataKey="soc" name="DP SoC" stroke={T.navy} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{cmp.data.methodology.dp_optimal}</div>
            </>
          )}
        </div>

        {/* 2. FR co-optimization */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>2 · FR Co-Optimization — MW reservation sweep</div>
            <button onClick={() => runLab('fr')} disabled={frOpt.status === 'loading'} style={runBtn(false)}>{frOpt.status === 'loading' ? 'Sweeping…' : 'Find optimal FR split →'}</button>
            <span style={chip}>POST /api/v1/bess-stacking/fr-cooptimize</span>
            <Badge status={frOpt.status === 'idle' ? undefined : frOpt.status} demoText={frOpt.error} />
          </div>
          {frOpt.status === 'live' && frOpt.data && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Optimal FR reservation" value={`${fmtNum(frOpt.data.optimal.fr_mw, 0)} MW`} sub={`${fmtNum(frOpt.data.optimal.arb_mw, 0)} MW left for arbitrage`} color={T.purple} />
                <Kpi label="Total at optimum" value={fmtUsd(frOpt.data.optimal.total_usd_yr)} sub={`FR ${fmtUsd(frOpt.data.optimal.fr_usd_yr)} + arb ${fmtUsd(frOpt.data.optimal.arbitrage_usd_yr)}`} color={T.green} />
                <Kpi label="Opportunity cost at optimum" value={fmtUsd(frOpt.data.optimal.opportunity_cost_usd_yr)} sub="Forgone arbitrage vs 0 MW reserved" color={T.amber} />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={frOpt.data.sweep}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="fr_mw" tick={{ fontSize: 10 }} label={{ value: 'MW reserved for FR', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip formatter={(v, n) => [fmtUsd(v), n]} labelFormatter={(x) => `${x} MW reserved`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="arbitrage_usd_yr" name="Arbitrage $/yr" stackId="a" fill={T.indigo} />
                  <Bar dataKey="fr_usd_yr" name="FR $/yr" stackId="a" fill={T.purple} radius={[3, 3, 0, 0]} />
                  <Line dataKey="total_usd_yr" name="Total $/yr" stroke={T.navy} strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{frOpt.data.methodology}</div>
            </>
          )}
        </div>

        {/* 3. Structures */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>3 · Toll vs Merchant vs Hybrid — P50 / P90 spread scenarios</div>
            <button onClick={() => runLab('structures')} disabled={structRes.status === 'loading'} style={runBtn(false)}>{structRes.status === 'loading' ? 'Comparing…' : 'Compare structures →'}</button>
            <span style={chip}>POST /api/v1/bess-stacking/structures</span>
            <Badge status={structRes.status === 'idle' ? undefined : structRes.status} demoText={structRes.error} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, maxWidth: 760 }}>
            <Field label="Toll fee" unit="$/kW-yr" value={tollFeeUsdKwYr} onChange={setTollFeeUsdKwYr} min={0} />
            <Field label="Hybrid floor" unit="$/kW-yr" value={floorUsdKwYr} onChange={setFloorUsdKwYr} min={0} />
            <Field label="Upside share" unit="%" value={upsideSharePct} onChange={setUpsideSharePct} min={0} />
            <Field label="P90 spread scalar" unit="× P50 deviations" value={p90Scalar} onChange={setP90Scalar} min={0.05} step="0.05" />
          </div>
          {structRes.status === 'live' && structRes.data && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Maximin recommendation" value={structRes.data.recommended_structure_maximin.toUpperCase()} sub="Best worst-case across P50/P90 (conservative screen)" color={T.green} />
                <Kpi label="Merchant P50 / P90" value={`${fmtUsd(structRes.data.p50.merchant_net_usd)} / ${fmtUsd(structRes.data.p90.merchant_net_usd)}`} color={T.indigo} />
                <Kpi label="Toll P50 / P90" value={`${fmtUsd(structRes.data.p50.toll_net_usd)} / ${fmtUsd(structRes.data.p90.toll_net_usd)}`} color={T.purple} />
                <Kpi label="Hybrid P50 / P90" value={`${fmtUsd(structRes.data.p50.hybrid_net_usd)} / ${fmtUsd(structRes.data.p90.hybrid_net_usd)}`} sub={`Floor $${floorUsdKwYr}/kW-yr + ${upsideSharePct}% of gross above`} color={T.teal} />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Merchant', P50: structRes.data.p50.merchant_net_usd / 1e6, P90: structRes.data.p90.merchant_net_usd / 1e6 },
                  { name: 'Toll', P50: structRes.data.p50.toll_net_usd / 1e6, P90: structRes.data.p90.toll_net_usd / 1e6 },
                  { name: 'Hybrid', P50: structRes.data.p50.hybrid_net_usd / 1e6, P90: structRes.data.p90.hybrid_net_usd / 1e6 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: `$M net (${inp.years}y)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [`$${fmtNum(v, 1)}M`, n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="P50" fill={T.indigo} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="P90" fill={T.amber} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{structRes.data.methodology}</div>
            </>
          )}
        </div>

        {/* 4. Augmentation optimizer */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>4 · Augmentation Optimizer — trigger sweep minimising $/MWh retained</div>
            <button onClick={() => runLab('aug')} disabled={augOpt.status === 'loading'} style={runBtn(false)}>{augOpt.status === 'loading' ? 'Sweeping…' : 'Optimize augmentation →'}</button>
            <span style={chip}>POST /api/v1/bess-stacking/augmentation-optimize</span>
            <Badge status={augOpt.status === 'idle' ? undefined : augOpt.status} demoText={augOpt.error} />
          </div>
          {augOpt.status === 'live' && augOpt.data && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Best trigger (net margin)" value={augOpt.data.optimal_by_net_margin.label} sub={`Net ${fmtUsd(augOpt.data.optimal_by_net_margin.net_margin_usd)} · ${augOpt.data.optimal_by_net_margin.augmentations} augmentation(s)`} color={T.green} />
                {augOpt.data.optimal_by_cost_per_mwh && <Kpi label="Best trigger ($/MWh retained)" value={augOpt.data.optimal_by_cost_per_mwh.label} sub={`$${fmtNum(augOpt.data.optimal_by_cost_per_mwh.aug_usd_per_mwh_delivered, 2)}/MWh delivered`} color={T.teal} />}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={augOpt.data.sweep.filter((r) => r.trigger_pct != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="trigger_pct" tick={{ fontSize: 10 }} label={{ value: 'Augmentation trigger (% SoH)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} label={{ value: 'Net $', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <YAxis yAxisId="m" orientation="right" tick={{ fontSize: 10 }} label={{ value: '$/MWh', angle: 90, position: 'insideRight', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [n === 'Aug $/MWh delivered' ? `$${fmtNum(v, 2)}` : fmtUsd(v), n]} labelFormatter={(x) => `Trigger ${x}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="net_margin_usd" name="Net margin $" fill={T.teal} fillOpacity={0.6} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="m" dataKey="aug_usd_per_mwh_delivered" name="Aug $/MWh delivered" stroke={T.amber} strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{augOpt.data.methodology}</div>
            </>
          )}
        </div>
      </div>

      {/* ── Market menus: derating tables + ancillary product menu ─────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={secH}>Market Reference Menus — Capacity Derating &amp; Ancillary Products</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Hand-authored, labeled — approximate GB T-4 / PJM ELCC class ranges, not auction results</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={chip}>GET /api/v1/bess-stacking/ref/market-menus</span>
            <Badge status={menus.status} demoText={menus.error} />
          </div>
        </div>
        {menus.status === 'live' && menus.data && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.2, minWidth: 340 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                Derating factor by storage duration — your asset: {fmtNum(durationH, 1)}h
                {view?.derating && <> → GB-style {fmtNum((view.derating.gb_t4_style_factor || 0) * 100, 0)}% · PJM-style {fmtNum((view.derating.pjm_elcc_style_factor || 0) * 100, 0)}% (stack used {fmtNum((view.derating.used_factor || 0) * 100, 0)}%)</>}
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={
                  Object.entries(menus.data.capacity_derating_tables.GB_T4_style.by_duration_h).map(([d, f]) => ({
                    duration: parseFloat(d), GB: f * 100,
                    PJM: (menus.data.capacity_derating_tables.PJM_ELCC_style.by_duration_h[d] || null) != null ? menus.data.capacity_derating_tables.PJM_ELCC_style.by_duration_h[d] * 100 : null,
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="duration" tick={{ fontSize: 10 }} label={{ value: 'Duration (h)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: 'Derating %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [fmtPct(v, 0), n]} labelFormatter={(x) => `${x}h duration`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="GB" name="GB T-4 style" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line dataKey="PJM" name="PJM ELCC style" stroke={T.purple} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10.5, color: T.sub }}>{menus.data.capacity_derating_tables.GB_T4_style.basis}</div>
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Ancillary product menu ($/MW-yr availability conventions)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Product</th><th style={th}>$/MW-yr</th><th style={th}>@ {fmtNum(parseFloat(inp.power_mw), 0)} MW</th></tr></thead>
                <tbody>
                  {menus.data.ancillary_product_menu.map((p) => (
                    <tr key={p.product} title={p.basis}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{p.name}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>${fmtNum(p.usd_per_mw_yr, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(p.usd_per_mw_yr * (parseFloat(inp.power_mw) || 0), 2)}/yr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{menus.data.note}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/bess_stacking.py — greedy screening AND SoC-grid dynamic-programming dispatch (per-hour SoC
        bounds asserted by the engine), calendar + cycle aging, warranty envelope checks, start-of-year augmentation +
        trigger optimizer, intraday switching layer, FR MW co-optimisation sweep, toll/merchant/hybrid structures at
        P50/P90, carbon-arbitrage analytics; defaults are labeled modeling conventions (NREL ATB 2024, GB capacity-market /
        Dynamic Containment ranges). Optional live shape + intensity: UK NESO Carbon Intensity forecast (CC-BY 4.0), price
        PROXY under the stated illustration assumption. No PRNG anywhere.
      </div>
    </div>
  );
}
