import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, ReferenceLine,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Project Workbench (NX2-08)
// Co-located solar + wind + BESS: combined P50/P90 generation, HOURLY shared-
// connection curtailment from the 96-point shape engine (coincidence-factor
// screen kept as labeled fallback), BESS charge-from-curtailment recovery,
// connection-sharing value decomposition, multi-offtake allocation (2-3 PPAs +
// merchant + green-H2, greedy by margin — documented), 24/7 CFE + land/water
// sustainability overlay, and a financing handoff that sizes debt on the
// combined CFADS (standard or carbon-adjusted shadow variant).
// Live engines:
//   1. POST /api/v1/renewable-ppa/solar-yield        (GHI/PR yield, P50/P90)
//   2. POST /api/v1/renewable-ppa/wind-yield         (Weibull yield, P50/P90)
//   3. POST /api/v1/ppa-structuring/shape-analysis   (96-pt hybrid shape:
//      hourly curtailment vs the cap, 24/7 CFE, avoided CO2 — NX2-01 engine)
//   4. POST /api/v1/bess-stacking/stack              (BESS revenue stack, NX2-07)
//   5. POST /api/v1/pf-debt-sizing/size              (DSCR debt sizing — probed;
//      built in parallel as NX2-02. If absent, a Demo badge + note is shown;
//      the workbench never hard-fails on it.)
// Local derivations (all closed-form, documented inline; from live responses +
// user inputs only — nothing fabricated): curtailment-recovery via BESS,
// connection-sharing NPV decomposition, greedy offtake allocation, land/water
// intensity, carbon-adjusted CFADS.
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

// Mirrors of the renewable_ppa engine's reference keys (services/
// renewable_project_engine.py) — options only; all numbers come live.
const SOLAR_COUNTRIES = [
  ['DE', 'Germany'], ['FR', 'France'], ['ES', 'Spain'], ['IT', 'Italy'], ['PT', 'Portugal'],
  ['NL', 'Netherlands'], ['GB', 'United Kingdom'], ['SE', 'Sweden'], ['PL', 'Poland'], ['GR', 'Greece'],
  ['US', 'United States (avg)'], ['IN', 'India'], ['AU', 'Australia'], ['BR', 'Brazil'], ['ZA', 'South Africa'],
  ['AE', 'UAE'], ['SA', 'Saudi Arabia'], ['JP', 'Japan'], ['CN', 'China'], ['MX', 'Mexico'],
];
const WIND_REGIONS = [
  ['north_sea', 'North Sea Offshore'], ['baltic_sea', 'Baltic Sea Offshore'], ['atlantic_france', 'Atlantic France'],
  ['mediterranean', 'Mediterranean'], ['northern_europe_onshore', 'N. Europe Onshore'],
  ['central_europe_onshore', 'C. Europe Onshore'], ['iberia_onshore', 'Iberia Onshore'],
  ['uk_offshore', 'UK Offshore'], ['scandinavia_onshore', 'Scandinavia Onshore'],
  ['us_midwest', 'US Midwest Onshore'], ['us_texas', 'US Texas Onshore'],
  ['india_tamil_nadu', 'India Tamil Nadu'], ['brazil_northeast', 'Brazil NE'],
  ['south_africa', 'South Africa'], ['australia_nsw', 'Australia NSW'],
];
const TURBINE_CLASSES = [
  ['onshore_2mw', 'Onshore 2 MW'], ['onshore_4mw', 'Onshore 4 MW'],
  ['offshore_5mw', 'Offshore 5 MW'], ['offshore_8mw', 'Offshore 8 MW'], ['offshore_12mw', 'Offshore 12 MW'],
];
const TURBINE_MW = { onshore_2mw: 2, onshore_4mw: 4, offshore_5mw: 5, offshore_8mw: 8, offshore_12mw: 12 };
const SEASON_COLORS = { Winter: '#0369a1', Spring: '#15803d', Summer: '#c5a96a', Autumn: '#b45309' };
const SEASON_DAYS = { winter: 90, spring: 92, summer: 92, autumn: 91 }; // mirrors shape engine (= 365)
const LOAD_SHAPES = [
  ['flat', 'Flat 24/7 (data-center / electrolyzer)'],
  ['daytime_commercial', 'Daytime commercial (07–19)'],
  ['evening_residential', 'Evening residential (18–22 peak)'],
];
const BESS_RTE = 0.88; // NX2-07 bess-stacking engine default round-trip efficiency (documented)

const fmtUsd = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `$${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}M`;
const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;
const fmtGwh = (v) => (v == null || isNaN(v)) ? '—' : `${fmtNum(v / 1000, 1)} GWh`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle</span>;
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

const Field = ({ label, value, onChange, min, unit, step = 'any' }) => (
  <div style={{ minWidth: 120, flex: 1 }}>
    <label style={lbl}>{label}{unit ? <span style={{ color: T.gold }}> · {unit}</span> : null}</label>
    <input type="number" step={step} min={min} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);
const Select = ({ label, value, onChange, options }) => (
  <div style={{ minWidth: 160, flex: 1.2 }}>
    <label style={lbl}>{label}</label>
    <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
    </select>
  </div>
);

const sectionHead = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const groupLabel = { fontSize: 11, fontWeight: 700, color: T.teal, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };

export default function HybridProjectWorkbenchPage() {
  const [inp, setInp] = useState({
    // Solar block
    solar_country: 'ES', solar_mwp: 80, solar_deg_pct_yr: 0.5,
    // Wind block
    turbine_class: 'onshore_4mw', wind_region: 'iberia_onshore', num_turbines: 15,
    wake_loss_pct: 8, availability_pct: 97,
    // Shared connection
    grid_cap_mw: 100, coincidence_factor: 0.35,
    // BESS block (key params; remaining engine params use documented defaults)
    bess_power_mw: 40, bess_energy_mwh: 160, bess_cycles_cap: 1.5,
    // Revenue mix
    ppa_price_usd_mwh: 55, ppa_tenor_years: 12, contracted_share_pct: 70,
    merchant_price_usd_mwh: 48,
    // Opex + horizon
    solar_opex_usd_kw_yr: 12, wind_opex_usd_kw_yr: 32, years: 20,
    // Multi-offtake stack (0 cap = tranche off). PPA1 = the base contract above.
    ppa2_price_usd_mwh: 62, ppa2_cap_gwh_yr: 60, ppa3_price_usd_mwh: 0, ppa3_cap_gwh_yr: 0,
    // Green-H2 offtake (documented user electrolyzer params)
    ely_mw: 20, ely_eff_kwh_kg: 52, h2_price_usd_kg: 4.5, water_l_per_kg: 15,
    // Connection economics (for the sharing decomposition — labeled inputs)
    conn_capex_usd_kw: 120, discount_rate_pct: 7,
    // Sustainability overlay (labeled inputs / benchmarks)
    grid_ef_tco2_mwh: 0.35, shadow_carbon_usd_t: 85, annual_load_gwh: 0,
    solar_mw_per_ha: 0.35, wind_mw_per_ha: 0.03,
    // Debt sizing handoff (NX2-02 finalized contract: capex + cfads_p50)
    capex_usd_m: 182, target_dscr: 1.35, target_dscr_merchant: 1.8, debt_rate_pct: 6.0, debt_tenor_years: 15,
  });
  const set = (k) => (v) => setInp((p) => ({ ...p, [k]: v }));

  const [yieldBasis, setYieldBasis] = useState('p50'); // 'p50' sponsor | 'p90' lender
  const [loadShape, setLoadShape] = useState('flat');
  const [useCarbonCfads, setUseCarbonCfads] = useState(false);

  const [solar, setSolar] = useState({ status: 'idle', data: null, error: null });
  const [wind, setWind] = useState({ status: 'idle', data: null, error: null });
  const [bess, setBess] = useState({ status: 'idle', data: null, error: null });
  const [shape, setShape] = useState({ status: 'idle', data: null, error: null });
  const [debt, setDebt] = useState({ status: 'idle', data: null, error: null, missing: false });

  const windMw = (TURBINE_MW[inp.turbine_class] || 0) * (parseInt(inp.num_turbines, 10) || 0);
  const solarMw = parseFloat(inp.solar_mwp) || 0;
  const combinedMw = windMw + solarMw;
  const gridCap = parseFloat(inp.grid_cap_mw) || 0;

  // Simple coincidence-factor SCREEN (kept as labeled fallback when the hourly
  // shape engine is unreachable — visible + editable):
  //   curtailment% = coincidence_factor × max(0, combined_MW − grid_cap) / combined_MW
  // i.e. only the capacity above the shared connection is at risk, and solar/wind
  // peaks coincide only coincidence_factor of the time (they are partially
  // anti-correlated: solar peaks midday, wind often at night/winter).
  const screenCurtailmentPct = useMemo(() => {
    const cf = parseFloat(inp.coincidence_factor) || 0;
    if (combinedMw <= 0 || gridCap <= 0) return 0;
    return Math.min(95, cf * Math.max(0, combinedMw - gridCap) / combinedMw * 100);
  }, [combinedMw, gridCap, inp.coincidence_factor]);

  // HOURLY curtailment from the NX2-01 96-point shape engine (preferred):
  //   curtailed_hs = max(0, gen_hs − cap), summed season-hour by season-hour.
  const hourlyCurt = shape.status === 'live' && shape.data?.curtailment ? shape.data.curtailment : null;
  const curtailmentPct = hourlyCurt ? hourlyCurt.curtailment_pct_of_gen : screenCurtailmentPct;
  const curtSource = hourlyCurt ? 'hourly' : 'screen';

  const runWorkbench = useCallback(async () => {
    // 1) Solar yield (live)
    setSolar({ status: 'loading', data: null, error: null });
    let sData = null; let wData = null;
    const pSolar = axios.post('/api/v1/renewable-ppa/solar-yield', {
      country: inp.solar_country,
      capacity_kwp: (parseFloat(inp.solar_mwp) || 0) * 1000,
      performance_ratio: 0,     // 0 → engine default PR (0.82)
      degradation_pct_yr: parseFloat(inp.solar_deg_pct_yr) || 0,
    }, { timeout: 25000 })
      .then(({ data }) => { sData = data; setSolar({ status: 'live', data, error: null }); })
      .catch((e) => setSolar({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }));

    // 2) Wind yield (live)
    setWind({ status: 'loading', data: null, error: null });
    const pWind = axios.post('/api/v1/renewable-ppa/wind-yield', {
      turbine_class: inp.turbine_class,
      region: inp.wind_region,
      num_turbines: parseInt(inp.num_turbines, 10) || 1,
      wake_loss_pct: parseFloat(inp.wake_loss_pct) || 0,
      availability_pct: parseFloat(inp.availability_pct) || 97,
    }, { timeout: 25000 })
      .then(({ data }) => { wData = data; setWind({ status: 'live', data, error: null }); })
      .catch((e) => setWind({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }));

    // 3) BESS layer via the NX2-07 stacking engine (live)
    setBess({ status: 'loading', data: null, error: null });
    const pBess = axios.post('/api/v1/bess-stacking/stack', {
      power_mw: parseFloat(inp.bess_power_mw) || 1,
      energy_mwh: parseFloat(inp.bess_energy_mwh) || 1,
      cycles_per_day_cap: parseFloat(inp.bess_cycles_cap) || 1,
      years: parseInt(inp.years, 10) || 20,
      // remaining parameters: engine-documented defaults (RTE 88%, deg 2.5%/1000cyc,
      // trigger 80%, $150/kWh, FR $45k/4h, capacity $30k×0.6, opex $10k+$2)
    }, { timeout: 30000 })
      .then(({ data }) => setBess({ status: 'live', data, error: null }))
      .catch((e) => setBess({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }));

    await Promise.all([pSolar, pWind, pBess]);

    // 4) 96-point hybrid shape → HOURLY curtailment + 24/7 CFE + avoided CO2
    //    (NX2-01 shape engine; CFs taken from the live yield responses)
    if (sData && wData) {
      setShape({ status: 'loading', data: null, error: null });
      try {
        const sMw = parseFloat(inp.solar_mwp) || 0;
        const wMw = (TURBINE_MW[inp.turbine_class] || 0) * (parseInt(inp.num_turbines, 10) || 0);
        const payload = {
          technology: 'hybrid',
          solar_mw: sMw, solar_cf_pct: Math.max(0.1, sData.capacity_factor_pct),
          wind_mw: wMw, wind_cf_pct: Math.max(0.1, wData.capacity_factor_pct),
          merchant_forward_usd_mwh: parseFloat(inp.merchant_price_usd_mwh) || 48,
          connection_cap_mw: parseFloat(inp.grid_cap_mw) || undefined,
          load_shape: loadShape,
          grid_intensity_tco2_mwh: parseFloat(inp.grid_ef_tco2_mwh) || 0.35,
          carbon_shadow_price_usd_t: parseFloat(inp.shadow_carbon_usd_t) || 85,
          ppa_price_usd_mwh: parseFloat(inp.ppa_price_usd_mwh) || 55,
          rec_price_usd_mwh: 0, // hybrid desk: REC economics live in the PPA desk
        };
        const loadGwh = parseFloat(inp.annual_load_gwh) || 0;
        if (loadGwh > 0) payload.annual_load_mwh = loadGwh * 1000;
        const { data } = await axios.post('/api/v1/ppa-structuring/shape-analysis', payload, { timeout: 25000 });
        setShape({ status: 'live', data, error: null });
      } catch (e) {
        setShape({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
      }
    } else {
      setShape({ status: 'demo', data: null, error: 'yield engines unavailable — falling back to the coincidence-factor screen' });
    }
    setDebt({ status: 'idle', data: null, error: null, missing: false });
  }, [inp, loadShape]);

  // ── Combined generation + revenue model (local, from live responses) ──────
  const model = useMemo(() => {
    if (solar.status !== 'live' || wind.status !== 'live') return null;
    const s = solar.data; const w = wind.data;
    const years = parseInt(inp.years, 10) || 20;
    const solarY1 = yieldBasis === 'p90' ? s.p90_generation_mwh_yr1 : s.p50_generation_mwh_yr1;
    const windYr = yieldBasis === 'p90' ? w.p90_generation_mwh : w.p50_generation_mwh;
    const deg = (parseFloat(inp.solar_deg_pct_yr) || 0) / 100;
    const curt = curtailmentPct / 100;
    const share = Math.min(100, Math.max(0, parseFloat(inp.contracted_share_pct) || 0)) / 100;
    const ppaP = parseFloat(inp.ppa_price_usd_mwh) || 0;
    const merchP = parseFloat(inp.merchant_price_usd_mwh) || 0;
    const tenor = parseInt(inp.ppa_tenor_years, 10) || 0;
    const genOpex = (parseFloat(inp.solar_opex_usd_kw_yr) || 0) * solarMw * 1000
      + (parseFloat(inp.wind_opex_usd_kw_yr) || 0) * windMw * 1000;
    const bessYears = bess.status === 'live' ? bess.data.per_year : null;

    const rows = [];
    for (let y = 1; y <= years; y += 1) {
      const solarGen = solarY1 * Math.pow(1 - deg, y - 1); // solar degrades; wind held flat (labeled)
      const gross = solarGen + windYr;
      const curtailed = gross * curt;
      const net = gross - curtailed;
      const inTenor = y <= tenor;
      const contractedMwh = inTenor ? net * share : 0;
      const merchantMwh = net - contractedMwh;
      const ppaRev = contractedMwh * ppaP;
      const merchRev = merchantMwh * merchP;
      const bessNet = bessYears ? (bessYears[y - 1]?.net_margin_usd ?? 0) : 0;
      const cfads = ppaRev + merchRev + bessNet - genOpex;
      rows.push({
        year: y, solarGen, windGen: windYr, curtailed, net,
        contractedMwh, merchantMwh, ppaRev, merchRev, bessNet, genOpex, cfads, inTenor,
      });
    }
    const tot = rows.reduce((a, r) => ({
      ppa: a.ppa + r.ppaRev, merch: a.merch + r.merchRev, bess: a.bess + r.bessNet,
      cfads: a.cfads + r.cfads, curtailed: a.curtailed + r.curtailed, net: a.net + r.net,
    }), { ppa: 0, merch: 0, bess: 0, cfads: 0, curtailed: 0, net: 0 });
    return { rows, tot, solarY1, windYr, genOpex };
  }, [solar, wind, bess, inp, yieldBasis, curtailmentPct, solarMw, windMw]);

  // ── BESS charge-from-curtailment recovery (local, documented) ─────────────
  // Per season: chargeable/day = min(curtailed MWh/day, BESS power × curtailed
  // hours, BESS energy × daily cycle cap); recovered = chargeable × RTE (0.88,
  // NX2-07 engine default); value = recovered × merchant price. Closed-form on
  // the live shape response — no simulation.
  const curtRecovery = useMemo(() => {
    if (!hourlyCurt) return null;
    const p = parseFloat(inp.bess_power_mw) || 0;
    const e = parseFloat(inp.bess_energy_mwh) || 0;
    const cyc = parseFloat(inp.bess_cycles_cap) || 1;
    const merchP = parseFloat(inp.merchant_price_usd_mwh) || 0;
    let charged = 0; let curtTot = 0;
    (hourlyCurt.per_season || []).forEach((s) => {
      const days = SEASON_DAYS[s.season] || 91;
      const chargeable = Math.min(s.daily_curtailed_mwh, p * s.curtailed_hours_per_day, e * cyc);
      charged += chargeable * days;
      curtTot += s.daily_curtailed_mwh * days;
    });
    const delivered = charged * BESS_RTE;
    return {
      curtTot, charged, delivered,
      valueYr: delivered * merchP,
      sharePct: curtTot > 0 ? charged / curtTot * 100 : 0,
    };
  }, [hourlyCurt, inp.bess_power_mw, inp.bess_energy_mwh, inp.bess_cycles_cap, inp.merchant_price_usd_mwh]);

  // ── Connection-sharing value decomposition (local, documented) ────────────
  // Standalone: each block gets its own connection (combined MW, no shared-cap
  // curtailment). Co-located: one grid_cap connection, hourly curtailment, BESS
  // recovery. Delta = connection capex saved − PV(curtailment loss) + PV(BESS
  // recovery value), discounted at the labeled rate. Connection $/kW is a USER
  // input (grid-connection works vary widely by market).
  const connSharing = useMemo(() => {
    if (!model) return null;
    const costPerMw = (parseFloat(inp.conn_capex_usd_kw) || 0) * 1000;
    const r = (parseFloat(inp.discount_rate_pct) || 7) / 100;
    const merchP = parseFloat(inp.merchant_price_usd_mwh) || 0;
    const savedCapex = Math.max(0, combinedMw - gridCap) * costPerMw;
    let pvLoss = 0; let pvRec = 0;
    model.rows.forEach((row) => {
      const df = 1 / Math.pow(1 + r, row.year);
      pvLoss += row.curtailed * merchP * df;
      if (curtRecovery) pvRec += curtRecovery.valueYr * df;
    });
    return { savedCapex, pvLoss, pvRec, net: savedCapex - pvLoss + pvRec, costPerMw };
  }, [model, inp.conn_capex_usd_kw, inp.discount_rate_pct, inp.merchant_price_usd_mwh, combinedMw, gridCap, curtRecovery]);

  // ── Multi-offtake allocation — greedy by unit margin (documented) ─────────
  // Year-1 net export is allocated to tranches in DESCENDING $/MWh margin
  // order, each up to its volume cap: PPA1 (cap = contracted share), PPA2/PPA3
  // (caps in GWh/yr; 0 = off), green-H2 (margin = H2 price ÷ specific energy =
  // $/kg ÷ kWh/kg × 1000; cap = electrolyzer MW × 8760), merchant (uncapped
  // residual). Greedy is optimal here because tranches are independent volume
  // caps with constant unit margins (fractional-knapsack argument).
  const allocation = useMemo(() => {
    if (!model) return null;
    const netY1 = model.rows[0].net;
    const share = Math.min(100, Math.max(0, parseFloat(inp.contracted_share_pct) || 0)) / 100;
    const elyMw = parseFloat(inp.ely_mw) || 0;
    const eff = parseFloat(inp.ely_eff_kwh_kg) || 52;
    const h2Price = parseFloat(inp.h2_price_usd_kg) || 0;
    const h2MarginMwh = eff > 0 ? h2Price / eff * 1000 : 0; // $/MWh-equivalent
    const tranches = [
      { name: 'PPA 1 (base)', margin: parseFloat(inp.ppa_price_usd_mwh) || 0, cap: netY1 * share },
      (parseFloat(inp.ppa2_cap_gwh_yr) || 0) > 0
        ? { name: 'PPA 2', margin: parseFloat(inp.ppa2_price_usd_mwh) || 0, cap: (parseFloat(inp.ppa2_cap_gwh_yr) || 0) * 1000 } : null,
      (parseFloat(inp.ppa3_cap_gwh_yr) || 0) > 0
        ? { name: 'PPA 3', margin: parseFloat(inp.ppa3_price_usd_mwh) || 0, cap: (parseFloat(inp.ppa3_cap_gwh_yr) || 0) * 1000 } : null,
      elyMw > 0 ? { name: 'Green H₂', margin: h2MarginMwh, cap: elyMw * 8760, isH2: true } : null,
      { name: 'Merchant', margin: parseFloat(inp.merchant_price_usd_mwh) || 0, cap: Infinity },
    ].filter(Boolean).sort((a, b) => b.margin - a.margin);
    let remaining = netY1;
    const rows = tranches.map((t) => {
      const alloc = Math.min(remaining, t.cap);
      remaining -= alloc;
      return { ...t, alloc, revenue: alloc * t.margin };
    });
    const totalRev = rows.reduce((a, x) => a + x.revenue, 0);
    // Base case = the 2-stream Y1 split already in the revenue-mix panel
    const baseRev = model.rows[0].ppaRev + model.rows[0].merchRev;
    const h2Row = rows.find((x) => x.isH2);
    const h2Kg = h2Row && eff > 0 ? h2Row.alloc * 1000 / eff : 0;
    const waterM3 = h2Kg * (parseFloat(inp.water_l_per_kg) || 0) / 1000;
    return { rows, totalRev, baseRev, uplift: totalRev - baseRev, netY1, h2MarginMwh, h2Kg, waterM3, elyCapMwh: elyMw * 8760 };
  }, [model, inp.contracted_share_pct, inp.ppa_price_usd_mwh, inp.ppa2_price_usd_mwh, inp.ppa2_cap_gwh_yr,
    inp.ppa3_price_usd_mwh, inp.ppa3_cap_gwh_yr, inp.ely_mw, inp.ely_eff_kwh_kg, inp.h2_price_usd_kg,
    inp.merchant_price_usd_mwh, inp.water_l_per_kg]);

  // ── Sustainability overlay + carbon-adjusted CFADS (local, labeled) ───────
  // Avoided emissions: net export × user grid marginal EF, split by component
  // share of gross generation (annual displacement convention); the hourly-
  // MATCHED variant comes from the shape engine's CFE block. Land: MW ÷ user
  // MW/ha intensity (labeled NREL land-use benchmarks). Carbon-adjusted CFADS:
  // CFADS_t + avoided tCO₂e_t × shadow price — an INTERNAL shadow variant, not
  // lender-grade cash, and labeled as such everywhere it appears.
  const sustain = useMemo(() => {
    if (!model) return null;
    const ef = parseFloat(inp.grid_ef_tco2_mwh) || 0;
    const shadow = parseFloat(inp.shadow_carbon_usd_t) || 0;
    const y1 = model.rows[0];
    const grossY1 = y1.solarGen + y1.windGen;
    const netShare = grossY1 > 0 ? y1.net / grossY1 : 0;
    const solarAvoided = y1.solarGen * netShare * ef;
    const windAvoided = y1.windGen * netShare * ef;
    const bessAvoided = curtRecovery ? curtRecovery.delivered * ef : 0;
    const sHa = (parseFloat(inp.solar_mw_per_ha) || 0) > 0 ? solarMw / parseFloat(inp.solar_mw_per_ha) : 0;
    const wHa = (parseFloat(inp.wind_mw_per_ha) || 0) > 0 ? windMw / parseFloat(inp.wind_mw_per_ha) : 0;
    const carbonRows = model.rows.map((r) => {
      const avoided = r.net * ef;
      return { year: r.year, avoided, credit: avoided * shadow, cfadsAdj: r.cfads + avoided * shadow };
    });
    return {
      solarAvoided, windAvoided, bessAvoided,
      totalAvoidedY1: solarAvoided + windAvoided + bessAvoided,
      sHa, wHa, totalHa: sHa + wHa,
      combinedMwPerHa: (sHa + wHa) > 0 ? combinedMw / (sHa + wHa) : 0,
      carbonRows,
      carbonCreditY1: carbonRows[0]?.credit || 0,
      cfe: shape.status === 'live' && shape.data ? shape.data.sustainability.cfe : null,
      emissions: shape.status === 'live' && shape.data ? shape.data.sustainability.emissions : null,
    };
  }, [model, inp.grid_ef_tco2_mwh, inp.shadow_carbon_usd_t, inp.solar_mw_per_ha, inp.wind_mw_per_ha,
    curtRecovery, solarMw, windMw, combinedMw, shape]);

  // ── Financing handoff: probe /api/v1/pf-debt-sizing/size (parallel build) ──
  const sizeDebt = useCallback(async () => {
    if (!model) return;
    setDebt({ status: 'loading', data: null, error: null, missing: false });
    const cfads = (useCarbonCfads && sustain
      ? sustain.carbonRows.map((r) => r.cfadsAdj)
      : model.rows.map((r) => r.cfads)
    ).map((v) => Math.round(v));
    try {
      // NX2-02 finalized contract: paste-mode cfads_p50 + capex; DSCR targets
      // are split contracted/merchant and blended by the contracted share.
      const { data } = await axios.post('/api/v1/pf-debt-sizing/size', {
        capex_usd: Math.max(1, (parseFloat(inp.capex_usd_m) || 0) * 1e6),
        cfads_p50: cfads,
        contracted_share_pct: Math.min(100, Math.max(0, parseFloat(inp.contracted_share_pct) || 0)),
        target_dscr_contracted: parseFloat(inp.target_dscr) || 1.35,
        target_dscr_merchant: parseFloat(inp.target_dscr_merchant) || 1.8,
        interest_rate_pct: parseFloat(inp.debt_rate_pct) || 6,
        tenor_years: Math.min(parseInt(inp.debt_tenor_years, 10) || 15, cfads.length),
      }, { timeout: 30000 });
      setDebt({ status: 'live', data, error: null, missing: false });
    } catch (e) {
      const is404 = e?.response?.status === 404;
      setDebt({
        status: 'demo', data: null, missing: is404,
        error: is404 ? 'route not yet deployed' : (e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message),
      });
    }
  }, [model, inp.capex_usd_m, inp.contracted_share_pct, inp.target_dscr, inp.target_dscr_merchant,
    inp.debt_rate_pct, inp.debt_tenor_years, useCarbonCfads, sustain]);

  // Extraction against the finalized NX2-02 schema (sizing block + sponsor
  // case), with legacy-key fallbacks kept defensively.
  const debtView = useMemo(() => {
    if (debt.status !== 'live' || !debt.data) return null;
    const d = debt.data.result || debt.data;
    const sz = d.sizing || {};
    const sponsor = d.sponsor_case_p50 || {};
    const cap = sz.max_supportable_debt_usd ?? d.debt_capacity_usd ?? d.debt_capacity ?? d.max_debt_usd ?? d.max_debt ?? d.sized_debt_usd ?? d.sized_debt ?? null;
    const minDscr = sponsor.min_dscr ?? d.min_dscr ?? d.minimum_dscr ?? d.dscr_min ?? null;
    const avgDscr = sponsor.avg_dscr ?? d.avg_dscr ?? d.average_dscr ?? null;
    const gearing = sz.gearing_achieved_pct ?? null;
    const binding = sz.binding_constraint ?? null;
    const equity = sz.equity_usd ?? null;
    return { cap, minDscr, avgDscr, gearing, binding, equity, raw: d };
  }, [debt]);

  const genChart = useMemo(() => model ? model.rows.map((r) => ({
    year: `Y${r.year}`, Solar: r.solarGen / 1000, Wind: r.windGen / 1000, Curtailed: -r.curtailed / 1000,
  })) : [], [model]);

  const revChart = useMemo(() => model ? model.rows.map((r) => ({
    year: `Y${r.year}`, 'PPA (contracted)': r.ppaRev / 1e6, Merchant: r.merchRev / 1e6,
    'BESS stack (net)': r.bessNet / 1e6, cfads: r.cfads / 1e6,
  })) : [], [model]);

  const hourlyShapeChart = useMemo(() => {
    if (shape.status !== 'live' || !shape.data) return [];
    const g = shape.data.shapes.generation_mw;
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h, Winter: g.winter[h], Spring: g.spring[h], Summer: g.summer[h], Autumn: g.autumn[h],
      Load: shape.data.shapes.load_mw ? shape.data.shapes.load_mw.summer[h] : undefined,
    }));
  }, [shape]);

  const anyLoading = [solar, wind, bess, shape].some((x) => x.status === 'loading');

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-08</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Hybrid Project Workbench</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Renewable Yield Engine</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>BESS Stacking Engine (NX2-07)</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PF Debt Sizer Handoff (NX2-02)</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Co-located solar + wind + BESS behind one grid connection. P50/P90 generation comes live from the renewable
        yield engine (Weibull wind, GHI/PR solar); shared-connection curtailment is resolved <b>hourly</b> by the NX2-01
        96-point shape engine (coincidence-factor screen kept as labeled fallback); the BESS layer is the live NX2-07
        revenue stack plus charge-from-curtailment recovery; output is split across a multi-offtake stack (2-3 PPAs +
        merchant + green-H₂, greedy by margin); a sustainability overlay scores 24/7 CFE, avoided carbon, land and
        water; and the combined CFADS — standard or carbon-adjusted shadow variant — hands off one-click into the
        project-finance debt sizer. All aggregation is computed locally from live engine responses — nothing is fabricated.
      </div>

      {/* ── Configuration ───────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Project Configuration</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — illustrative Iberian hybrid, not a live project</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>Yield basis </label>
            <div style={{ display: 'flex', border: `1px solid ${T.navy}66`, borderRadius: 6, overflow: 'hidden' }}>
              {[['p50', 'P50 (sponsor)'], ['p90', 'P90 (lender)']].map(([m, label]) => (
                <button key={m} onClick={() => setYieldBasis(m)} style={{
                  background: yieldBasis === m ? T.navy : 'transparent', color: yieldBasis === m ? '#fff' : T.navy,
                  border: 'none', padding: '5px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.4, minWidth: 300 }}>
            <div style={groupLabel}>Solar block</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Select label="Country (GHI profile)" value={inp.solar_country} onChange={set('solar_country')} options={SOLAR_COUNTRIES} />
              <Field label="Capacity" unit="MWp" value={inp.solar_mwp} onChange={set('solar_mwp')} min={0} />
              <Field label="Degradation" unit="%/yr" value={inp.solar_deg_pct_yr} onChange={set('solar_deg_pct_yr')} min={0} />
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>Wind block</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Select label="Turbine class" value={inp.turbine_class} onChange={set('turbine_class')} options={TURBINE_CLASSES} />
              <Select label="Resource region (Weibull)" value={inp.wind_region} onChange={set('wind_region')} options={WIND_REGIONS} />
              <Field label="Turbines" unit="#" value={inp.num_turbines} onChange={set('num_turbines')} min={1} step="1" />
              <Field label="Wake loss" unit="%" value={inp.wake_loss_pct} onChange={set('wake_loss_pct')} min={0} />
              <Field label="Availability" unit="%" value={inp.availability_pct} onChange={set('availability_pct')} min={50} />
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>BESS block (NX2-07 engine defaults for RTE/degradation/FR/capacity)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Power" unit="MW" value={inp.bess_power_mw} onChange={set('bess_power_mw')} min={1} />
              <Field label="Energy" unit="MWh" value={inp.bess_energy_mwh} onChange={set('bess_energy_mwh')} min={1} />
              <Field label="Cycle cap" unit="cyc/day" value={inp.bess_cycles_cap} onChange={set('bess_cycles_cap')} min={0.1} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={groupLabel}>Shared grid connection</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Connection cap" unit="MW" value={inp.grid_cap_mw} onChange={set('grid_cap_mw')} min={1} />
              <Field label="Coincidence factor" unit="0–1" value={inp.coincidence_factor} onChange={set('coincidence_factor')} min={0} step="0.05" />
            </div>
            <div style={{ fontSize: 11, color: T.amber, background: '#fef3c7', border: `1px solid ${T.gold}66`, borderRadius: 8, padding: '7px 10px', marginTop: 8 }}>
              <b>Curtailment source:</b> the workbench now computes curtailment <b>hourly</b> from the 96-point shape
              engine (max(0, gen − cap) per season-hour). The coincidence-factor screen — curtailment% = coincidence ×
              max(0, {fmtNum(combinedMw, 0)}−{fmtNum(gridCap, 0)})/{fmtNum(combinedMw, 0)} MW = <b>{fmtPct(screenCurtailmentPct)}</b> —
              is kept only as the labeled FALLBACK when the shape engine is unreachable.
              Currently using: <b>{curtSource === 'hourly' ? `hourly engine (${fmtPct(curtailmentPct, 2)})` : 'fallback screen'}</b>.
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>Revenue mix</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="PPA price" unit="$/MWh" value={inp.ppa_price_usd_mwh} onChange={set('ppa_price_usd_mwh')} min={0} />
              <Field label="PPA tenor" unit="yrs" value={inp.ppa_tenor_years} onChange={set('ppa_tenor_years')} min={0} step="1" />
              <Field label="Contracted share" unit="%" value={inp.contracted_share_pct} onChange={set('contracted_share_pct')} min={0} />
              <Field label="Merchant price" unit="$/MWh" value={inp.merchant_price_usd_mwh} onChange={set('merchant_price_usd_mwh')} min={0} />
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>Opex &amp; horizon</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Solar opex" unit="$/kW-yr" value={inp.solar_opex_usd_kw_yr} onChange={set('solar_opex_usd_kw_yr')} min={0} />
              <Field label="Wind opex" unit="$/kW-yr" value={inp.wind_opex_usd_kw_yr} onChange={set('wind_opex_usd_kw_yr')} min={0} />
              <Field label="Horizon" unit="yrs" value={inp.years} onChange={set('years')} min={1} step="1" />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={groupLabel}>Offtake stack — allocation optimizer (0 cap = tranche off)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="PPA 2 price" unit="$/MWh" value={inp.ppa2_price_usd_mwh} onChange={set('ppa2_price_usd_mwh')} min={0} />
              <Field label="PPA 2 cap" unit="GWh/yr" value={inp.ppa2_cap_gwh_yr} onChange={set('ppa2_cap_gwh_yr')} min={0} />
              <Field label="PPA 3 price" unit="$/MWh" value={inp.ppa3_price_usd_mwh} onChange={set('ppa3_price_usd_mwh')} min={0} />
              <Field label="PPA 3 cap" unit="GWh/yr" value={inp.ppa3_cap_gwh_yr} onChange={set('ppa3_cap_gwh_yr')} min={0} />
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>Green-H₂ offtake (user electrolyzer params)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Electrolyzer" unit="MW" value={inp.ely_mw} onChange={set('ely_mw')} min={0} />
              <Field label="Specific energy" unit="kWh/kg" value={inp.ely_eff_kwh_kg} onChange={set('ely_eff_kwh_kg')} min={30} />
              <Field label="H₂ price" unit="$/kg" value={inp.h2_price_usd_kg} onChange={set('h2_price_usd_kg')} min={0} />
              <Field label="Water use" unit="L/kg H₂" value={inp.water_l_per_kg} onChange={set('water_l_per_kg')} min={0} />
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>Sustainability overlay (labeled inputs / benchmarks)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Select label="24/7 CFE load shape" value={loadShape} onChange={setLoadShape} options={LOAD_SHAPES} />
              <Field label="Annual load (0 = gen)" unit="GWh" value={inp.annual_load_gwh} onChange={set('annual_load_gwh')} min={0} />
              <Field label="Grid marginal EF" unit="tCO₂e/MWh" value={inp.grid_ef_tco2_mwh} onChange={set('grid_ef_tco2_mwh')} min={0} step="0.01" />
              <Field label="Shadow carbon" unit="$/t" value={inp.shadow_carbon_usd_t} onChange={set('shadow_carbon_usd_t')} min={0} />
              <Field label="Solar density" unit="MW/ha" value={inp.solar_mw_per_ha} onChange={set('solar_mw_per_ha')} min={0.01} step="0.01" />
              <Field label="Wind density" unit="MW/ha" value={inp.wind_mw_per_ha} onChange={set('wind_mw_per_ha')} min={0.001} step="0.005" />
            </div>
            <div style={{ ...groupLabel, marginTop: 12 }}>Connection economics (sharing decomposition)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Connection capex" unit="$/kW" value={inp.conn_capex_usd_kw} onChange={set('conn_capex_usd_kw')} min={0} />
              <Field label="Discount rate" unit="%" value={inp.discount_rate_pct} onChange={set('discount_rate_pct')} min={0} step="0.25" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={runWorkbench} disabled={anyLoading} style={{
            background: T.navy, color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 26px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            {anyLoading ? 'Calling engines…' : 'Run workbench →'}
          </button>
          <span style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>
            {fmtNum(solarMw, 0)} MWp solar + {fmtNum(windMw, 0)} MW wind + {fmtNum(parseFloat(inp.bess_power_mw), 0)} MW / {fmtNum(parseFloat(inp.bess_energy_mwh), 0)} MWh BESS → {fmtNum(gridCap, 0)} MW connection
          </span>
        </div>
      </div>

      {/* ── Generation panel ────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Combined Generation — {yieldBasis.toUpperCase()} basis</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/renewable-ppa/solar-yield</span>
          <Badge status={solar.status} demoText={solar.error} />
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/renewable-ppa/wind-yield</span>
          <Badge status={wind.status} demoText={wind.error} />
        </div>

        {model && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label={`Solar ${yieldBasis.toUpperCase()} (Y1)`} value={fmtGwh(model.solarY1)} sub={`${solar.data.country_label} · ${fmtNum(solar.data.ghi_kwh_m2_yr, 0)} kWh/m²·yr GHI · PR ${solar.data.performance_ratio}`} color={T.gold} />
              <Kpi label={`Wind ${yieldBasis.toUpperCase()}`} value={fmtGwh(model.windYr)} sub={`${wind.data.turbine_name} × ${wind.data.num_turbines} · CF ${fmtPct(wind.data.capacity_factor_pct)}`} color={T.blue} />
              <Kpi label={curtSource === 'hourly' ? 'Curtailment (hourly)' : 'Curtailment (screen)'} value={fmtPct(curtailmentPct, 2)}
                sub={`${curtSource === 'hourly' ? '96-pt shape overlap' : 'Coincidence fallback'} · ${fmtGwh(model.tot.curtailed / model.rows.length)}/yr avg lost`}
                color={curtailmentPct > 5 ? T.red : T.green} />
              <Kpi label="Net export (Y1)" value={fmtGwh(model.rows[0].net)} sub={`Behind ${fmtNum(gridCap, 0)} MW connection`} color={T.teal} />
              <Kpi label="P90/P50 haircut" value={solar.data && wind.data ? fmtPct((1 - (solar.data.p90_generation_mwh_yr1 + wind.data.p90_generation_mwh) / (solar.data.p50_generation_mwh_yr1 + wind.data.p50_generation_mwh)) * 100) : '—'} sub="Combined lender-case discount" />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Generation by source per year (GWh) — curtailed energy shown below the axis; solar degrades {inp.solar_deg_pct_yr}%/yr, wind held flat (labeled convention)</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={genChart} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${fmtNum(Math.abs(v), 1)} GWh`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Solar" stackId="g" fill={T.gold} />
                <Bar dataKey="Wind" stackId="g" fill={T.blue} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Curtailed" stackId="g" fill={T.red} fillOpacity={0.55} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {!model && solar.status !== 'loading' && wind.status !== 'loading' && (
          <div style={{ fontSize: 12, color: T.sub }}>
            {solar.status === 'demo' || wind.status === 'demo'
              ? `Yield engine unreachable — no generation shown (this page never fabricates results). ${solar.error || ''} ${wind.error || ''}`
              : 'Configure the blocks above and run the workbench. Solar and wind yields are computed live (P50/P75/P90).'}
          </div>
        )}
      </div>

      {/* ── Hourly shape, curtailment & connection sharing ──────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Hourly Shape — Real Curtailment · BESS Recovery · Connection Sharing</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/ppa-structuring/shape-analysis (NX2-01)</span>
          <Badge status={shape.status} demoText={shape.error} />
        </div>

        {shape.status === 'live' && shape.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Peak combined output" value={`${fmtNum(shape.data.curtailment ? shape.data.curtailment.peak_combined_output_mw : 0, 1)} MW`}
                sub={`vs ${fmtNum(gridCap, 0)} MW connection cap`} color={T.navy} />
              <Kpi label="Hourly curtailment" value={fmtPct(hourlyCurt ? hourlyCurt.curtailment_pct_of_gen : 0, 2)}
                sub={`${fmtNum(hourlyCurt ? hourlyCurt.annual_curtailed_mwh : 0, 0)} MWh/yr · max(0, gen−cap) per season-hour`} color={T.red} />
              <Kpi label="Simple screen (fallback)" value={fmtPct(screenCurtailmentPct)}
                sub="Coincidence-factor estimate — replaced by hourly math" color={T.sub} />
              {curtRecovery && (
                <>
                  <Kpi label="BESS charge-from-curtailment" value={`${fmtNum(curtRecovery.delivered, 0)} MWh/yr`}
                    sub={`${fmtPct(curtRecovery.sharePct, 0)} of curtailed captured × RTE ${BESS_RTE}`} color={T.purple} />
                  <Kpi label="Recovery value" value={fmtUsd(curtRecovery.valueYr)}
                    sub={`Recovered MWh × $${inp.merchant_price_usd_mwh}/MWh merchant`} color={T.green} />
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Combined solar+wind output by season (MW, 24h archetypes) vs connection cap{shape.data.shapes.load_mw ? ' · summer load dotted' : ''}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={hourlyShapeChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'MW', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${fmtNum(v, 1)} MW`, n]} labelFormatter={(l) => `Hour ${l}:00`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {['Winter', 'Spring', 'Summer', 'Autumn'].map((s) => (
                      <Line key={s} dataKey={s} stroke={SEASON_COLORS[s]} strokeWidth={2} dot={false} />
                    ))}
                    <Line dataKey="Load" stroke={T.slate} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                    <ReferenceLine y={gridCap} stroke={T.red} strokeDasharray="6 3" label={{ value: `Cap ${fmtNum(gridCap, 0)} MW`, fontSize: 10, fill: T.red, position: 'insideTopRight' }} />
                  </ComposedChart>
                </ResponsiveContainer>
                {hourlyCurt && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead>
                      <tr><th style={th}>Season</th><th style={th}>Curtailed MWh/day</th><th style={th}>Curtailed h/day</th><th style={th}>Peak exceedance</th></tr>
                    </thead>
                    <tbody>
                      {hourlyCurt.per_season.map((s) => (
                        <tr key={s.season}>
                          <td style={{ ...td, fontWeight: 600, color: T.navy, textTransform: 'capitalize' }}>{s.season}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.daily_curtailed_mwh, 2)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{s.curtailed_hours_per_day}</td>
                          <td style={{ ...td, fontFamily: T.mono, color: s.peak_exceedance_mw > 0 ? T.red : T.slate }}>{fmtNum(s.peak_exceedance_mw, 1)} MW</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Connection-sharing value decomposition — standalone vs co-located (documented, closed-form)</div>
                {connSharing ? (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ ...td, fontWeight: 600, color: T.navy }}>Connection capex saved</td>
                          <td style={{ ...td, fontFamily: T.mono, color: T.green, textAlign: 'right' }}>+{fmtUsd(connSharing.savedCapex)}</td>
                          <td style={{ ...td, fontSize: 10.5 }}>({fmtNum(combinedMw - gridCap, 0)} MW avoided × ${fmtNum(connSharing.costPerMw / 1000, 0)}/kW — user input)</td>
                        </tr>
                        <tr>
                          <td style={{ ...td, fontWeight: 600, color: T.navy }}>PV of curtailment losses</td>
                          <td style={{ ...td, fontFamily: T.mono, color: T.red, textAlign: 'right' }}>−{fmtUsd(connSharing.pvLoss)}</td>
                          <td style={{ ...td, fontSize: 10.5 }}>(curtailed MWh × merchant $, {inp.years}y @ {inp.discount_rate_pct}%)</td>
                        </tr>
                        <tr>
                          <td style={{ ...td, fontWeight: 600, color: T.navy }}>PV of BESS recovery</td>
                          <td style={{ ...td, fontFamily: T.mono, color: T.green, textAlign: 'right' }}>+{fmtUsd(connSharing.pvRec)}</td>
                          <td style={{ ...td, fontSize: 10.5 }}>(charge-from-curtailment × RTE {BESS_RTE})</td>
                        </tr>
                        <tr style={{ borderTop: `2px solid ${T.border}` }}>
                          <td style={{ ...td, fontWeight: 800, color: T.navy }}>Co-location NPV delta</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 800, textAlign: 'right', color: connSharing.net >= 0 ? T.green : T.red }}>{fmtUsd(connSharing.net)}</td>
                          <td style={{ ...td, fontSize: 10.5 }}>vs two standalone connections</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 8 }}>
                      Standalone case: each block on its own {fmtNum(solarMw, 0)}+{fmtNum(windMw, 0)} MW connection, zero shared-cap
                      curtailment. Co-located: one {fmtNum(gridCap, 0)} MW connection, hourly curtailment net of BESS recovery.
                      Connection $/kW and discount rate are labeled user inputs.
                    </div>
                  </>
                ) : <div style={{ fontSize: 12, color: T.sub }}>Run the workbench to decompose the sharing value.</div>}
                {curtRecovery && (
                  <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 8 }}>
                    BESS recovery per season-day: min(curtailed MWh, power × curtailed hours, energy × cycle cap) × RTE {BESS_RTE}
                    (NX2-07 engine default RTE) — captures {fmtPct(curtRecovery.sharePct, 0)} of {fmtNum(curtRecovery.curtTot, 0)} MWh/yr curtailed.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {shape.status === 'demo' && (
          <div style={{ fontSize: 12, color: T.sub, background: '#fef3c7', border: `1px solid ${T.gold}66`, borderRadius: 8, padding: '8px 12px' }}>
            Shape engine unreachable ({String(shape.error)}) — the revenue model falls back to the labeled
            coincidence-factor screen ({fmtPct(screenCurtailmentPct)}). No hourly analytics are fabricated.
          </div>
        )}
        {shape.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the workbench — the 96-point hybrid shape (solar bell + wind diurnal archetypes at the live engine CFs) resolves curtailment hourly against the {fmtNum(gridCap, 0)} MW cap and feeds BESS recovery + connection-sharing economics.</div>}
      </div>

      {/* ── Revenue mix ─────────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Revenue Mix — PPA + Merchant Tail + Storage Stack</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/bess-stacking/stack</span>
          <Badge status={bess.status} demoText={bess.error} />
        </div>

        {model && (
          <>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              Contracted share {inp.contracted_share_pct}% at ${inp.ppa_price_usd_mwh}/MWh for {inp.ppa_tenor_years} years;
              remainder (and all volume post-tenor) at the ${inp.merchant_price_usd_mwh}/MWh merchant assumption.
              BESS line is the live NX2-07 net margin (arbitrage + FR + capacity − opex − augmentation
              {bess.status !== 'live' ? ' — engine unreachable, shown as $0 and excluded from CFADS' : ''}).
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label={`PPA revenue (${model.rows.length}y)`} value={fmtUsd(model.tot.ppa)} sub={`Years 1–${inp.ppa_tenor_years} contracted`} color={T.indigo} />
              <Kpi label="Merchant tail" value={fmtUsd(model.tot.merch)} sub="Uncontracted + post-tenor volume" color={T.blue} />
              <Kpi label="BESS stack (net)" value={bess.status === 'live' ? fmtUsd(model.tot.bess) : '—'} sub={bess.status === 'live' ? 'Live NX2-07 engine' : 'Engine unreachable'} color={T.purple} />
              <Kpi label={`CFADS total (${model.rows.length}y)`} value={fmtUsd(model.tot.cfads)} sub="Revenue − generation opex + BESS net" color={T.green} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Annual revenue by stream ($M) + CFADS line</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={revChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`$${fmtNum(v, 2)}M`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="PPA (contracted)" stackId="r" fill={T.indigo} />
                <Bar dataKey="Merchant" stackId="r" fill={T.blue} />
                <Bar dataKey="BESS stack (net)" stackId="r" fill={T.purple} radius={[3, 3, 0, 0]} />
                <Line dataKey="cfads" name="CFADS" stroke={T.green} strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>

            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={th}>Year</th><th style={th}>Solar MWh</th><th style={th}>Wind MWh</th><th style={th}>Curtailed</th>
                    <th style={th}>Net MWh</th><th style={th}>Contracted</th><th style={th}>PPA rev</th><th style={th}>Merchant rev</th>
                    <th style={th}>BESS net</th><th style={th}>Gen opex</th><th style={th}>CFADS</th>
                  </tr>
                </thead>
                <tbody>
                  {model.rows.map((r) => (
                    <tr key={r.year} style={!r.inTenor && r.year === (parseInt(inp.ppa_tenor_years, 10) + 1) ? { borderTop: `2px solid ${T.gold}` } : undefined}>
                      <td style={{ ...td, fontWeight: 700, color: T.navy }}>Y{r.year}{r.inTenor ? '' : ' ·M'}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.solarGen, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.windGen, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.red }}>({fmtNum(r.curtailed, 0)})</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.net, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.contractedMwh, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.indigo }}>{fmtUsd(r.ppaRev)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.blue }}>{fmtUsd(r.merchRev)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.purple }}>{bess.status === 'live' ? fmtUsd(r.bessNet) : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>({fmtUsd(r.genOpex)})</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.cfads >= 0 ? T.green : T.red }}>{fmtUsd(r.cfads)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 4 }}>·M = fully merchant (post-PPA-tenor)</div>
            </div>
          </>
        )}
        {!model && <div style={{ fontSize: 12, color: T.sub }}>Run the workbench to build the revenue mix from live yields and the live BESS stack.</div>}
      </div>

      {/* ── Multi-offtake allocation (greedy by margin, documented) ─────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Multi-Offtake Allocation — 2-3 PPAs + Merchant + Green H₂</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>Local greedy optimizer (documented) on live Y1 net export</span>
        </div>
        {allocation ? (
          <>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              Year-1 net export ({fmtGwh(allocation.netY1)}) allocated to tranches in descending $/MWh margin, each up
              to its cap (greedy = optimal for independent volume caps with constant unit margins — fractional-knapsack
              argument). Green-H₂ margin = ${inp.h2_price_usd_kg}/kg ÷ {inp.ely_eff_kwh_kg} kWh/kg × 1000 =
              <b> ${fmtNum(allocation.h2MarginMwh, 2)}/MWh-equivalent</b>; electrolyzer cap {fmtGwh(allocation.elyCapMwh)}
              ({inp.ely_mw} MW × 8760h). All parameters are user inputs.
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.3, minWidth: 380 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Rank</th><th style={th}>Tranche</th><th style={th}>Margin ($/MWh)</th>
                      <th style={th}>Cap (MWh/yr)</th><th style={th}>Allocated</th><th style={th}>Revenue (Y1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocation.rows.map((r, i) => (
                      <tr key={r.name}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: 600, color: r.isH2 ? T.teal : T.navy }}>{r.name}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.margin, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{Number.isFinite(r.cap) ? fmtNum(r.cap, 0) : '∞ (residual)'}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>
                          {fmtNum(r.alloc, 0)}
                          <div style={{ background: T.cream, borderRadius: 3, height: 5, marginTop: 3 }}>
                            <div style={{ background: r.isH2 ? T.teal : T.indigo, borderRadius: 3, height: 5, width: `${Math.min(100, allocation.netY1 > 0 ? r.alloc / allocation.netY1 * 100 : 0)}%` }} />
                          </div>
                        </td>
                        <td style={{ ...td, fontFamily: T.mono, color: T.green }}>{fmtUsd(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Kpi label="Optimized Y1 revenue" value={fmtUsd(allocation.totalRev)} sub="Greedy allocation across all tranches" color={T.green} />
                  <Kpi label="Uplift vs base 2-stream mix" value={fmtUsd(allocation.uplift)}
                    sub={`Base (PPA1 + merchant): ${fmtUsd(allocation.baseRev)}`} color={allocation.uplift >= 0 ? T.teal : T.red} />
                  {allocation.h2Kg > 0 && (
                    <>
                      <Kpi label="H₂ production" value={`${fmtNum(allocation.h2Kg / 1000, 0)} t/yr`}
                        sub={`Allocated MWh × 1000 ÷ ${inp.ely_eff_kwh_kg} kWh/kg`} color={T.teal} />
                      <Kpi label="H₂ water demand" value={`${fmtNum(allocation.waterM3, 0)} m³/yr`}
                        sub={`${inp.water_l_per_kg} L/kg (labeled: stoichiometric ≈9 + purification)`} color={T.blue} />
                    </>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 10 }}>
                  Screening allocation on Y1 volumes — degradation shifts later-year splits marginally; tranche caps are
                  annual energy caps, not hourly delivery obligations (shape-firmness lives in the PPA desk's /structure).
                </div>
              </div>
            </div>
          </>
        ) : <div style={{ fontSize: 12, color: T.sub }}>Run the workbench first — the optimizer allocates the live Y1 net export across the offtake stack configured above.</div>}
      </div>

      {/* ── Sustainability overlay ──────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Sustainability Overlay — 24/7 CFE · Avoided Emissions · Land &amp; Water</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>Shape engine CFE + local labeled intensities</span>
          <Badge status={shape.status === 'live' ? 'live' : shape.status} demoText={shape.error} />
        </div>
        {sustain ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {sustain.cfe && (
                <Kpi label="Combined 24/7 CFE score" value={fmtPct(sustain.cfe.cfe_score_pct)}
                  sub={`${fmtNum(sustain.cfe.hourly_matched_mwh, 0)} MWh hourly-matched vs ${loadShape.replace(/_/g, ' ')} load`} color={T.teal} />
              )}
              <Kpi label="Avoided emissions (Y1)" value={`${fmtNum(sustain.totalAvoidedY1, 0)} tCO₂e`}
                sub={`Net export × ${inp.grid_ef_tco2_mwh} t/MWh grid EF (annual displacement)`} color={T.green} />
              <Kpi label="Shadow-carbon value (Y1)" value={fmtUsd(sustain.carbonCreditY1)}
                sub={`× $${inp.shadow_carbon_usd_t}/t — internal shadow price, NOT cash`} color={T.purple} />
              <Kpi label="Land footprint" value={`${fmtNum(sustain.totalHa, 0)} ha`}
                sub={`Combined ${fmtNum(sustain.combinedMwPerHa, 2)} MW/ha (user densities)`} color={T.amber} />
              {allocation && allocation.h2Kg > 0 && (
                <Kpi label="H₂ water intensity" value={`${fmtNum(allocation.waterM3, 0)} m³/yr`}
                  sub={`${inp.water_l_per_kg} L/kg × ${fmtNum(allocation.h2Kg / 1000, 0)} t H₂`} color={T.blue} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Avoided emissions by component (Y1, net-export share × grid EF)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Component</th><th style={th}>tCO₂e/yr</th><th style={th}>Basis</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ ...td, fontWeight: 600, color: T.gold }}>Solar</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(sustain.solarAvoided, 0)}</td>
                      <td style={{ ...td, fontSize: 10.5 }}>Solar share of gross × net-export ratio × EF</td>
                    </tr>
                    <tr>
                      <td style={{ ...td, fontWeight: 600, color: T.blue }}>Wind</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(sustain.windAvoided, 0)}</td>
                      <td style={{ ...td, fontSize: 10.5 }}>Wind share of gross × net-export ratio × EF</td>
                    </tr>
                    <tr>
                      <td style={{ ...td, fontWeight: 600, color: T.purple }}>BESS (recovered curtailment)</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(sustain.bessAvoided, 0)}</td>
                      <td style={{ ...td, fontSize: 10.5 }}>Otherwise-lost MWh delivered × EF</td>
                    </tr>
                    <tr style={{ borderTop: `2px solid ${T.border}` }}>
                      <td style={{ ...td, fontWeight: 800, color: T.navy }}>Total</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 800, color: T.green }}>{fmtNum(sustain.totalAvoidedY1, 0)}</td>
                      <td style={{ ...td, fontSize: 10.5 }}>Annual displacement convention (labeled)</td>
                    </tr>
                  </tbody>
                </table>
                {sustain.cfe && (
                  <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 8 }}>
                    Hourly-matched variant (shape engine): {fmtNum(sustain.emissions ? sustain.emissions.avoided_tco2e_yr : 0, 0)} tCO₂e/yr
                    on matched volume only — the stricter 24/7 CFE accounting basis.
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Land-use intensity (user MW/ha vs labeled benchmarks)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Block</th><th style={th}>MW</th><th style={th}>MW/ha (input)</th><th style={th}>Area (ha)</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ ...td, fontWeight: 600, color: T.gold }}>Solar PV</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(solarMw, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{inp.solar_mw_per_ha}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(sustain.sHa, 0)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...td, fontWeight: 600, color: T.blue }}>Wind</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(windMw, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{inp.wind_mw_per_ha}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(sustain.wHa, 0)}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 8 }}>
                  Benchmarks (editable above): solar ≈0.35 MW/ha total-area (NREL 2013 land-use study, ~8.9 ac/MWac);
                  wind ≈0.03 MW/ha total project boundary (NREL 2009, ~34 ha/MW — direct pad/road impact is only
                  ~0.7 ha/MW ≈1.4 MW/ha, and &gt;95% of the boundary typically stays in agricultural dual use).
                  H₂ water: {inp.water_l_per_kg} L/kg (stoichiometric ≈9 L/kg + demin/purification losses — labeled default).
                </div>
              </div>
            </div>
          </>
        ) : <div style={{ fontSize: 12, color: T.sub }}>Run the workbench to score 24/7 CFE against the selected load shape and compute avoided-carbon, land and water intensities from labeled inputs.</div>}
      </div>

      {/* ── Financing handoff ───────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={sectionHead}>Financing Handoff — Size Debt on this CFADS</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/pf-debt-sizing/size (NX2-02)</span>
          <Badge status={debt.status === 'idle' ? 'idle' : debt.status} demoText={debt.missing ? 'debt sizer not yet deployed' : debt.error} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
          <Field label="Project capex" unit="$M" value={inp.capex_usd_m} onChange={set('capex_usd_m')} min={1} />
          <Field label="DSCR (contracted)" unit="×" value={inp.target_dscr} onChange={set('target_dscr')} min={1} step="0.05" />
          <Field label="DSCR (merchant)" unit="×" value={inp.target_dscr_merchant} onChange={set('target_dscr_merchant')} min={1} step="0.05" />
          <Field label="Debt rate" unit="%" value={inp.debt_rate_pct} onChange={set('debt_rate_pct')} min={0} />
          <Field label="Debt tenor" unit="yrs" value={inp.debt_tenor_years} onChange={set('debt_tenor_years')} min={1} step="1" />
          <label style={{ fontSize: 11.5, color: T.navy, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8 }}>
            <input type="checkbox" checked={useCarbonCfads} onChange={(e) => setUseCarbonCfads(e.target.checked)} />
            Carbon-adjusted CFADS variant
          </label>
          <button onClick={sizeDebt} disabled={!model || debt.status === 'loading'} style={{
            background: model ? T.teal : T.sub, color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: model ? 'pointer' : 'not-allowed', fontFamily: T.font,
          }}>
            {debt.status === 'loading' ? 'Sizing…' : `Size debt on ${useCarbonCfads ? 'carbon-adjusted' : 'standard'} CFADS →`}
          </button>
        </div>
        {useCarbonCfads && sustain && (
          <div style={{ fontSize: 11, color: T.amber, background: '#fef3c7', border: `1px solid ${T.gold}66`, borderRadius: 8, padding: '7px 10px', marginBottom: 10 }}>
            <b>Carbon-adjusted variant (labeled):</b> CFADS_t + avoided tCO₂e_t × ${inp.shadow_carbon_usd_t}/t shadow price
            (Y1 uplift {fmtUsd(sustain.carbonCreditY1)}). An INTERNAL sustainability-linked sizing scenario — shadow-carbon
            value is not lender-grade cash; use the standard CFADS for credit committee work.
          </div>
        )}

        {debtView && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="Debt capacity" value={debtView.cap != null ? fmtUsd(debtView.cap) : '— (see raw)'}
              sub={`Sculpted max${debtView.binding ? ` · binding: ${String(debtView.binding).replace(/_/g, ' ')}` : ''}${useCarbonCfads ? ' · CARBON-ADJ CFADS' : ''}`} color={T.green} />
            <Kpi label="Min DSCR (P50)" value={debtView.minDscr != null ? `${fmtNum(debtView.minDscr, 2)}×` : '—'} sub={`Targets ${inp.target_dscr}× ctr / ${inp.target_dscr_merchant}× merch`} color={T.indigo} />
            <Kpi label="Avg DSCR (P50)" value={debtView.avgDscr != null ? `${fmtNum(debtView.avgDscr, 2)}×` : '—'} sub="Across debt tenor" />
            <Kpi label="Gearing" value={debtView.gearing != null ? fmtPct(debtView.gearing) : (debtView.cap != null && model ? fmtPct(debtView.cap / model.tot.cfads * 100) : '—')}
              sub={debtView.gearing != null ? `Debt / $${inp.capex_usd_m}M capex · equity ${debtView.equity != null ? fmtUsd(debtView.equity) : '—'}` : 'Debt / lifetime CFADS'} />
          </div>
        )}
        {debt.status === 'demo' && (
          <div style={{ fontSize: 12, color: T.sub, background: '#fef3c7', border: `1px solid ${T.gold}66`, borderRadius: 8, padding: '8px 12px' }}>
            {debt.missing
              ? <>The project-finance debt sizer (<span style={{ fontFamily: T.mono }}>/api/v1/pf-debt-sizing/size</span>, module NX2-02) is being
                built in parallel and is not deployed yet. No debt figures are shown — this panel never fabricates a sizing.
                Your CFADS array ({model ? model.rows.length : 0} annual periods) is ready and will POST as-is once the route is live.</>
              : <>Debt sizer call failed: {String(debt.error)}. No figures shown.</>}
          </div>
        )}
        {debt.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the workbench first, then hand the combined CFADS array to the DSCR-sculpting debt sizer.</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engines: services/renewable_project_engine.py (Weibull wind + GHI/PR solar, P50/P75/P90) ·
        api/v1/routes/ppa_structuring.py /shape-analysis (NX2-01 96-pt archetypes: hourly curtailment, 24/7 CFE,
        avoided CO2 — no PRNG) · api/v1/routes/bess_stacking.py (NX2-07 greedy dispatch stack) ·
        api/v1/routes/pf_debt_sizing.py (NX2-02, probed).
        Local derivations (closed-form, documented inline): hourly-curtailment fallback screen (coincidence factor),
        BESS charge-from-curtailment (RTE 0.88 = NX2-07 default), connection-sharing NPV decomposition (user $/kW),
        greedy multi-offtake allocation (fractional-knapsack), land/water intensities (NREL land-use benchmarks,
        editable), carbon-adjusted CFADS (labeled shadow variant). Solar degrades per input; wind held flat.
        Related modules: /ppa-structuring-desk (shape/CfD detail) · /battery-revenue-stacker (storage detail) ·
        /project-finance-debt-sizer (full sculpting) · /energy-revenue-split (accounting split).
      </div>
    </div>
  );
}
