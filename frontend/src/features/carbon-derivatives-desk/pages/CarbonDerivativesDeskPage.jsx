import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, Bar, Area,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Carbon Derivatives Desk — EUA compliance hedging (NX2-11)
// Cost-of-carry forward pricing F = S·e^{(r+u)τ}, Black-76 options on carbon
// futures (real formula, in ../lib/deskMath.js with a documented normal-CDF
// approximation), a user-editable strike×tenor implied-vol surface with
// bilinear interpolation, a multi-leg strategy builder (collar / spreads /
// straddle / calendar) with payoff + net greeks, EUA–UKA / EUA–CCA cross-market
// spread analytics, EU MSR intake/release mechanics (Decision (EU) 2015/1814 as
// amended), an IFRS 9 own-use / hedge-accounting decision tree, a compliance
// hedge program priced off the EU ETS scenario forecast engine with quarterly
// auction cash-flow planning and cost-averaging, a margin panel, and a
// sustainability×financial overlay (ICP consistency, abatement-linked hedge
// need, cost-of-delay).
// Live engines:
//   1. GET  /api/v1/climate-derivatives/ref/eua-market      (spot/vol/rate prefill)
//   2. POST /api/v1/climate-derivatives/price-eua-option    (engine BSM cross-check)
//   3. POST /api/v1/carbon-price-ets/eu-ets-forecast        (scenario price path)
// All desk math (forward curve, Black-76 + greeks, vol-surface interpolation,
// strategy payoffs, MSR rules, hedge cost projection, margin estimates) is
// computed locally (../lib/deskMath.js + this file) from user inputs; UKA/CCA
// levels, MSR TNAC path and quarterly weights are labeled user inputs.
// Mechanism-level compliance analytics live at /compliance-carbon-desk.
// Requests use the CRA dev proxy (/api → localhost:8001) + global axios Bearer.
// ─────────────────────────────────────────────────────────────────────────────
import {
  black76, cocForward, bilinearVol, defaultSurface, legPayoff,
  MSR_PARAMS, msrAction,
} from '../lib/deskMath';

export { black76 }; // kept as a named page export for backward compatibility

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const fmt = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmt0 = (v) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtEur = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `€${Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}`;
const fmtEurM = (v) => (v == null || isNaN(v)) ? '—' : `€${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

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
const tdM = { ...td, fontFamily: T.mono };
const lbl = { fontSize: 11, color: T.sub, fontWeight: 600, display: 'block', marginBottom: 3 };
const Field = ({ label, children, note, width = 160 }) => (
  <div style={{ width }}>
    <span style={lbl}>{label}</span>
    {children}
    {note && <span style={{ fontSize: 9.5, color: T.sub }}>{note}</span>}
  </div>
);
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };

const FWD_TENORS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5];
const SCENARIOS = [
  { id: 'NZE', label: 'NZE — Net Zero 2050 (1.5°C)' },
  { id: 'APS', label: 'APS — Announced Pledges (~1.7°C)' },
  { id: 'SDS', label: 'SDS — Sustainable Development' },
  { id: 'STEPS', label: 'STEPS — Stated Policies (~2.4°C)' },
  { id: 'current_policies', label: 'Current Policies' },
];
const HEDGE_YEARS = 5;

// ── Vol-surface grid axes: 5 strike-moneyness × 4 tenors (user-editable) ────
const SURF_MONEYS = [0.8, 0.9, 1, 1.1, 1.2];   // K/S
const SURF_TENORS = [0.5, 1, 2, 3];            // yrs

// ── Strategy-builder presets (strikes as % of spot; qty in tonnes) ───────────
// Collar here is the PROTECTIVE collar of a holder of allowances/credits:
// long put (floor) + short call (cap) — the aggregate payoff is by construction
// the pointwise sum of those two legs (asserted in the verification script).
const STRATEGY_PRESETS = {
  collar: { label: 'Collar (long put + short call)', legs: [{ type: 'put', side: 1, kPct: 90, tenor: 1 }, { type: 'call', side: -1, kPct: 110, tenor: 1 }] },
  put_spread: { label: 'Put spread (long 100 / short 85)', legs: [{ type: 'put', side: 1, kPct: 100, tenor: 1 }, { type: 'put', side: -1, kPct: 85, tenor: 1 }] },
  call_spread: { label: 'Call spread (long 100 / short 120)', legs: [{ type: 'call', side: 1, kPct: 100, tenor: 1 }, { type: 'call', side: -1, kPct: 120, tenor: 1 }] },
  straddle: { label: 'Straddle (long ATM call + put)', legs: [{ type: 'call', side: 1, kPct: 100, tenor: 1 }, { type: 'put', side: 1, kPct: 100, tenor: 1 }] },
  calendar: { label: 'Calendar (short 0.5y / long 2y ATM call)', legs: [{ type: 'call', side: -1, kPct: 100, tenor: 0.5 }, { type: 'call', side: 1, kPct: 100, tenor: 2 }] },
};
const DEFAULT_LEG_QTY = 100000; // tonnes per leg (editable)

// ── Cross-market spread notes — LABELED historical-range observations ────────
// Hand-authored desk notes as of the model's knowledge cutoff, NOT live data;
// both legs of every spread are user price inputs.
const XM_NOTES = {
  uka: 'UKA has traded at a persistent discount to EUA since 2022 (roughly £15–35/t below on FX-adjusted basis at times); the 2025 UK–EU linkage announcement narrowed it — verify against current screens.',
  cca: 'CCA (California cap-and-trade, WCI) has traded well below EUA (~$25–45/t vs €60–90/t), supported by the auction reserve price floor escalating at 5% + CPI annually.',
};

// ── MSR illustrative TNAC path (Mt) — user-editable, LABELED illustrative ────
// Shape only (declining surplus as the LRF tightens the cap); not a forecast.
const MSR_DEFAULT_PATH = [
  { year: 2025, tnac: 1050 }, { year: 2026, tnac: 980 }, { year: 2027, tnac: 920 },
  { year: 2028, tnac: 870 }, { year: 2029, tnac: 830 }, { year: 2030, tnac: 790 },
  { year: 2031, tnac: 750 }, { year: 2032, tnac: 720 },
];

// Quarterly auction-purchase weights default (equal quarters, editable).
const DEFAULT_Q_WEIGHTS = [25, 25, 25, 25];

export default function CarbonDerivativesDeskPage() {
  // ── Market inputs ──────────────────────────────────────────────────────
  // Labeled defaults: spot €65/t, vol 35%, r 3.5% — the platform climate-
  // derivatives engine's EUA reference data (prefilled live from /ref/eua-market
  // when reachable; always user-editable).
  const [mkt, setMkt] = useState({ spot: 65, ratePct: 3.5, carryPct: 0.0, volPct: 35 });
  const setM = (k, v) => setMkt((p) => ({ ...p, [k]: v }));
  const [ref, setRef] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let alive = true;
    axios.get('/api/v1/climate-derivatives/ref/eua-market', { timeout: 15000 })
      .then(({ data }) => {
        if (!alive) return;
        const d = data?.data || {};
        setRef({ status: 'live', data: d, error: null });
        setMkt((p) => ({
          ...p,
          spot: d.spot_eur_t ?? p.spot,
          volPct: d.historical_vol_pct != null ? d.historical_vol_pct * 100 : p.volPct,
          ratePct: d.risk_free_rate != null ? d.risk_free_rate * 100 : p.ratePct,
        }));
      })
      .catch((e) => { if (alive) setRef({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); });
    return () => { alive = false; };
  }, []);

  const S = parseFloat(mkt.spot) || 0;
  const r = (parseFloat(mkt.ratePct) || 0) / 100;
  const u = (parseFloat(mkt.carryPct) || 0) / 100;
  const sigma = (parseFloat(mkt.volPct) || 0) / 100;

  // ── Forward curve ──────────────────────────────────────────────────────
  const fwdCurve = useMemo(() => {
    if (S <= 0) return [];
    return FWD_TENORS.map((tau) => {
      const F = cocForward(S, r, u, tau);
      return { tau, label: `${tau}y`, F, carryBps: (F / S - 1) * 10000, engineDec: null };
    });
  }, [S, r, u]);

  // ── Implied-vol surface (strike-moneyness × tenor, 5×4, user-editable) ──
  // Default smile is a LABELED market-typical shape (OTM puts rich — carbon
  // downside/compliance-demand skew; smile flattens with tenor); every node is
  // editable. Pricing reads the surface via documented bilinear interpolation
  // (clamped at the hull; node values reproduced exactly).
  const [surfGrid, setSurfGrid] = useState(() => defaultSurface(35, SURF_MONEYS, SURF_TENORS));
  const setSurfNode = (i, j, v) => setSurfGrid((g) => g.map((row, a) => (a === i ? row.map((x, b) => (b === j ? v : x)) : row)));
  const resetSurface = useCallback(() => setSurfGrid(defaultSurface(parseFloat(mkt.volPct) || 35, SURF_MONEYS, SURF_TENORS)), [mkt.volPct]);
  const surfNum = useMemo(() => surfGrid.map((row) => row.map((v) => parseFloat(v) || 0)), [surfGrid]);
  // σ(K, τ) in DECIMAL from the surface (strike passed absolute, moneyness = K/S).
  const sigmaAt = useCallback((strike, tenorYrs) => {
    if (S <= 0) return null;
    return bilinearVol(SURF_MONEYS, SURF_TENORS, surfNum, strike / S, tenorYrs) / 100;
  }, [S, surfNum]);
  const smileData = useMemo(() => SURF_MONEYS.map((m, i) => {
    const row = { m, label: `${Math.round(m * 100)}%` };
    SURF_TENORS.forEach((tn, j) => { row[`t${tn}`] = surfNum[i][j]; });
    return row;
  }), [surfNum]);

  // ── Option pricer ──────────────────────────────────────────────────────
  const [opt, setOpt] = useState({ strike: 70, tenor: 1, volSource: 'surface' });
  const K = parseFloat(opt.strike) || 0;
  const tau = parseFloat(opt.tenor) || 0;
  const Fopt = S > 0 && tau > 0 ? cocForward(S, r, u, tau) : null;
  const surfSigma = K > 0 && tau > 0 ? sigmaAt(K, tau) : null;
  const sigmaUsed = opt.volSource === 'surface' && surfSigma != null && surfSigma > 0 ? surfSigma : sigma;
  const b76 = useMemo(() => (Fopt != null && K > 0 && sigmaUsed > 0 && tau > 0 ? black76(Fopt, K, sigmaUsed, tau, r) : null), [Fopt, K, sigmaUsed, tau, r]);
  const parity = b76 != null ? (b76.call - b76.put) - Math.exp(-r * tau) * (Fopt - K) : null;

  // Engine cross-check (climate_derivatives engine prices BSM on SPOT; with
  // u = 0 the two coincide because F = S·e^{rτ} makes Black-76 ≡ BSM).
  const [xcheck, setXcheck] = useState({ status: 'idle', call: null, put: null, error: null });
  const runXcheck = useCallback(async () => {
    setXcheck({ status: 'loading', call: null, put: null, error: null });
    try {
      const body = (option_type) => ({
        option_type, strike: K, spot: S, tenor_years: tau,
        volatility: sigmaUsed, risk_free_rate: r,   // same σ the desk pricer used (flat or surface)
      });
      const [c, p] = await Promise.all([
        axios.post('/api/v1/climate-derivatives/price-eua-option', body('call'), { timeout: 15000 }),
        axios.post('/api/v1/climate-derivatives/price-eua-option', body('put'), { timeout: 15000 }),
      ]);
      setXcheck({ status: 'live', call: c.data?.data, put: p.data?.data, error: null });
    } catch (e) {
      setXcheck({ status: 'demo', call: null, put: null, error: e?.response?.data?.detail || e.message });
    }
  }, [K, S, tau, sigmaUsed, r]);

  // ── Compliance hedge program ───────────────────────────────────────────
  const [hedge, setHedge] = useState({
    emissions: 1000000,        // tCO2/yr expected emissions (user)
    allocation: 350000,        // free allocation year 1 (user)
    allocDeclinePct: 4.3,      // %/yr — default = EU ETS Phase 4 linear reduction factor 4.3% (Directive 2023/958), editable
    ratios: [90, 70, 50, 30, 10], // hedge ratio %/yr forward (editable ladder)
    instrument: 'futures',     // futures | collar
    collarCapPct: 115,         // call strike as % of spot
    collarFloorPct: 90,        // put strike as % of spot
    scenario: 'APS',
  });
  const setH = (k, v) => setHedge((p) => ({ ...p, [k]: v }));
  const setRatio = (i, v) => setHedge((p) => ({ ...p, ratios: p.ratios.map((x, j) => (j === i ? v : x)) }));

  const [fc, setFc] = useState({ status: 'idle', pricePath: null, meta: null, error: null });
  const runForecast = useCallback(async () => {
    setFc({ status: 'loading', pricePath: null, meta: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/carbon-price-ets/eu-ets-forecast', {
        entity_id: 'derivatives-desk', horizon_years: HEDGE_YEARS + 1, scenario: hedge.scenario,
      }, { timeout: 20000 });
      setFc({
        status: 'live',
        pricePath: data?.price_path || null,
        meta: { base: data?.base_price_eur, p2030: data?.price_2030_eur, ciLow: data?.confidence_interval_low, ciHigh: data?.confidence_interval_high, drivers: data?.key_drivers },
        error: null,
      });
    } catch (e) {
      setFc({ status: 'demo', pricePath: null, meta: null, error: e?.response?.data?.detail || e.message });
    }
  }, [hedge.scenario]);

  const startYear = new Date().getFullYear();
  const hedgeRows = useMemo(() => {
    const em = parseFloat(hedge.emissions) || 0;
    const alloc0 = parseFloat(hedge.allocation) || 0;
    const dec = (parseFloat(hedge.allocDeclinePct) || 0) / 100;
    if (em <= 0 || S <= 0) return null;
    const Kc = S * (parseFloat(hedge.collarCapPct) || 0) / 100;
    const Kp = S * (parseFloat(hedge.collarFloorPct) || 0) / 100;

    return hedge.ratios.map((ratioRaw, i) => {
      const y = i + 1;
      const year = startYear + y;
      const alloc = alloc0 * ((1 - dec) ** i);
      const netShort = Math.max(em - alloc, 0);
      const ratio = Math.max(0, Math.min(100, parseFloat(ratioRaw) || 0)) / 100;
      const hedged = netShort * ratio;
      const open = netShort - hedged;

      const F = cocForward(S, r, u, y);                     // futures lock for year y
      // Scenario price from live engine path (keyed by calendar year); no fallback value is fabricated.
      const scen = fc.status === 'live' && fc.pricePath ? (fc.pricePath[year] ?? fc.pricePath[String(year)] ?? null) : null;

      // Collar: buy call (cap Kc), sell put (floor Kp) on futures — net premium via Black-76
      const bCap = black76(F, Kc, sigma, y, r);
      const bFlr = black76(F, Kp, sigma, y, r);
      const netPrem = bCap && bFlr ? bCap.call - bFlr.put : null; // €/t paid today
      const collarEff = scen != null ? Math.min(Math.max(scen, Kp), Kc) : null; // purchase cost bounded by collar

      const hedgedCostPerT = hedge.instrument === 'futures' ? F : (collarEff != null && netPrem != null ? collarEff + netPrem : null);
      const hedgedCost = hedgedCostPerT != null ? hedged * hedgedCostPerT : null;
      const openCost = scen != null ? open * scen : null;
      const totalCost = hedgedCost != null && openCost != null ? hedgedCost + openCost : null;
      const unhedgedCost = scen != null ? netShort * scen : null;
      return {
        y, year, alloc, netShort, ratio: ratio * 100, hedged, open, F, scen,
        Kc, Kp, netPrem, collarEff, hedgedCostPerT, hedgedCost, openCost, totalCost, unhedgedCost,
        saving: totalCost != null && unhedgedCost != null ? unhedgedCost - totalCost : null,
      };
    });
  }, [hedge, S, r, u, sigma, fc, startYear]);

  const hedgeTotals = useMemo(() => {
    if (!hedgeRows) return null;
    const sum = (k) => (hedgeRows.every((x) => x[k] != null) ? hedgeRows.reduce((s, x) => s + x[k], 0) : null);
    return { netShort: sum('netShort'), hedged: sum('hedged'), totalCost: sum('totalCost'), unhedgedCost: sum('unhedgedCost'), saving: sum('saving') };
  }, [hedgeRows]);

  // ── Margin panel ───────────────────────────────────────────────────────
  // ⚠ Labeled convention assumptions (editable): exchange IM for EUA futures is
  // volatility-scaled and changes with margin-model recalibration; the default
  // here is a documented desk planning convention, NOT an exchange schedule.
  const [margin, setMargin] = useState({ imPct: 25, vmMovePct: 5 });
  const marginRows = useMemo(() => {
    if (!hedgeRows || hedge.instrument !== 'futures') return null;
    const imF = (parseFloat(margin.imPct) || 0) / 100;
    const vmF = (parseFloat(margin.vmMovePct) || 0) / 100;
    return hedgeRows.map((rw) => {
      const notional = rw.hedged * rw.F;
      return { ...rw, notional, im: notional * imF, vm: notional * vmF };
    });
  }, [hedgeRows, margin, hedge.instrument]);
  const marginTotals = useMemo(() => {
    if (!marginRows) return null;
    return {
      notional: marginRows.reduce((s, x) => s + x.notional, 0),
      im: marginRows.reduce((s, x) => s + x.im, 0),
      vm: marginRows.reduce((s, x) => s + x.vm, 0),
    };
  }, [marginRows]);

  // ── Strategy builder (multi-leg, priced off the vol surface) ────────────
  const [stratName, setStratName] = useState('collar');
  const [legs, setLegs] = useState(() => STRATEGY_PRESETS.collar.legs.map((l) => ({
    type: l.type, side: l.side, strike: Math.round(65 * l.kPct) / 100, tenor: l.tenor, qty: DEFAULT_LEG_QTY,
  })));
  const loadPreset = useCallback((name) => {
    setStratName(name);
    const base = S > 0 ? S : 65;
    setLegs(STRATEGY_PRESETS[name].legs.map((l) => ({
      type: l.type, side: l.side, strike: Math.round(base * l.kPct) / 100, tenor: l.tenor, qty: DEFAULT_LEG_QTY,
    })));
  }, [S]);
  const setLeg = (i, k, v) => setLegs((p) => p.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const addLeg = () => setLegs((p) => [...p, { type: 'call', side: 1, strike: S > 0 ? Math.round(S) : 70, tenor: 1, qty: DEFAULT_LEG_QTY }]);
  const rmLeg = (i) => setLegs((p) => p.filter((_, j) => j !== i));

  const strat = useMemo(() => {
    if (S <= 0 || !legs.length) return null;
    const L = legs.map((l) => ({
      type: l.type, side: Number(l.side), strike: parseFloat(l.strike) || 0,
      tenor: parseFloat(l.tenor) || 0, qty: parseFloat(l.qty) || 0,
    }));
    // Any invalid leg voids the whole strategy (keeps table rows ↔ priced legs
    // index-aligned; the UI then shows the "enter valid legs" prompt).
    if (!L.length || L.some((l) => !(l.strike > 0 && l.tenor > 0 && l.qty > 0 && (l.side === 1 || l.side === -1)))) return null;
    // Price each leg with Black-76 on F(τ) at the SURFACE vol σ(K,τ).
    const priced = [];
    for (const l of L) {
      const F = cocForward(S, r, u, l.tenor);
      const sv = sigmaAt(l.strike, l.tenor);
      const b = sv != null && sv > 0 ? black76(F, l.strike, sv, l.tenor, r) : null;
      if (!b) return null;
      priced.push({
        ...l, F, sigmaPct: sv * 100,
        premPerT: l.type === 'call' ? b.call : b.put,          // €/t (long pays)
        delta: l.side * l.qty * (l.type === 'call' ? b.deltaCall : b.deltaPut),
        gamma: l.side * l.qty * b.gamma,
        vega: l.side * l.qty * b.vega,
        theta: l.side * l.qty * (l.type === 'call' ? b.thetaCall : b.thetaPut),
      });
    }
    // Net premium € (positive = strategy costs money today; short legs offset).
    const netPremium = priced.reduce((s, l) => s + l.side * l.premPerT * l.qty, 0);
    const horizon = Math.min(...priced.map((l) => l.tenor));
    const isCalendar = priced.some((l) => l.tenor > horizon + 1e-9);
    // Payoff grid at the NEAREST expiry: expiring legs at intrinsic (legPayoff);
    // longer-dated legs re-marked with Black-76 at remaining tenor and the same
    // surface vol (documented static-vol simplification for calendars).
    const grid = [];
    for (let k2 = 0; k2 <= 60; k2 += 1) {
      const ST = S * (0.4 + 0.02 * k2);
      let val = 0;
      for (const l of priced) {
        if (l.tenor <= horizon + 1e-9) val += legPayoff(l, ST);
        else {
          const rem = l.tenor - horizon;
          const Frem = cocForward(ST, r, u, rem);
          const sv = sigmaAt(l.strike, rem);
          const b = sv != null && sv > 0 ? black76(Frem, l.strike, sv, rem, r) : null;
          val += b ? l.side * l.qty * (l.type === 'call' ? b.call : b.put) : 0;
        }
      }
      grid.push({ ST, payoff: val, pnl: val - netPremium });
    }
    // Breakevens: linear interpolation at sign changes of net P&L.
    const breakevens = [];
    for (let k2 = 1; k2 < grid.length; k2 += 1) {
      const a = grid[k2 - 1]; const b = grid[k2];
      if ((a.pnl <= 0 && b.pnl > 0) || (a.pnl >= 0 && b.pnl < 0)) {
        if (b.pnl !== a.pnl) breakevens.push(a.ST + (0 - a.pnl) * (b.ST - a.ST) / (b.pnl - a.pnl));
      }
    }
    const net = (k2) => priced.reduce((s, l) => s + l[k2], 0);
    return {
      legs: priced, netPremium, horizon, isCalendar, grid, breakevens,
      netDelta: net('delta'), netGamma: net('gamma'), netVega: net('vega'), netTheta: net('theta'),
    };
  }, [S, r, u, legs, sigmaAt]);

  // ── Cross-market spreads: EUA–UKA, EUA–CCA (both legs user inputs) ──────
  const [xm, setXm] = useState({ uka: 42, gbpEur: 1.17, cca: 32, usdEur: 0.92, tonnes: 100000, dir: 'convergence' });
  const setX = (k, v) => setXm((p) => ({ ...p, [k]: v }));
  const xmModel = useMemo(() => {
    if (S <= 0) return null;
    const ukaEur = (parseFloat(xm.uka) || 0) * (parseFloat(xm.gbpEur) || 0);
    const ccaEur = (parseFloat(xm.cca) || 0) * (parseFloat(xm.usdEur) || 0);
    const q = parseFloat(xm.tonnes) || 0;
    const dir = xm.dir === 'convergence' ? -1 : 1;   // −1: short EUA/long other (bets spread narrows)
    const mk = (other, otherLabel) => {
      const spr = S - other;
      // Deterministic convergence ladder: scenario spread = spread × (1 − c),
      // c ∈ {−50% … +100%}; P&L = dir × (scenario − current) × tonnes. No PRNG.
      const ladder = [-0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].map((c) => {
        const sprScen = spr * (1 - c);
        return { c: c * 100, sprScen, pnl: dir * (sprScen - spr) * q };
      });
      return { otherLabel, other, spr, ladder };
    };
    return { ukaEur, ccaEur, q, dir, uka: mk(ukaEur, 'UKA (€-conv.)'), cca: mk(ccaEur, 'CCA (€-conv.)') };
  }, [S, xm]);

  // ── EU MSR mechanics — published rules applied to a user TNAC path ──────
  const [tnacPath, setTnacPath] = useState(MSR_DEFAULT_PATH.map((rw) => ({ ...rw })));
  const setTnac = (i, v) => setTnacPath((p) => p.map((rw, j) => (j === i ? { ...rw, tnac: v } : rw)));
  const msrRows = useMemo(() => {
    let cumIntake = 0; let cumRelease = 0;
    return tnacPath.map((rw) => {
      const tnac = parseFloat(rw.tnac) || 0;
      const a = msrAction(tnac, rw.year);
      cumIntake += a.intakeMt; cumRelease += a.releaseMt;
      return { year: rw.year, tnac, ...a, net: a.releaseMt - a.intakeMt, cumIntake, cumRelease };
    });
  }, [tnacPath]);

  // ── IFRS 9: own-use vs derivative decision tree (documented) ────────────
  const [ifrs, setIfrs] = useState({ netSettle: 'no', ownUse: 'yes', writtenOpt: 'no' });
  const setI = (k, v) => setIfrs((p) => ({ ...p, [k]: v }));
  const ifrsResult = useMemo(() => {
    if (ifrs.writtenOpt === 'yes') {
      return {
        cls: 'Derivative at FVTPL — and NOT designatable as a hedging instrument on its own',
        basis: 'IFRS 9 B6.2.4: a written option does not qualify as a hedging instrument unless designated as an offset to a purchased option.',
        color: T.red,
      };
    }
    if (ifrs.netSettle === 'no' && ifrs.ownUse === 'yes') {
      return {
        cls: 'Own-use exemption — executory contract, NOT fair-valued through P&L',
        basis: 'IFRS 9 2.4: contracts to buy a non-financial item (allowances for own compliance surrender) entered into and held for the entity\'s expected purchase/usage requirements stay outside IFRS 9 — unless the own-use FVTPL option (2.5) is elected.',
        color: T.green,
      };
    }
    if (ifrs.netSettle === 'yes') {
      return {
        cls: 'Derivative at FVTPL — unless designated in a qualifying hedge relationship',
        basis: 'IFRS 9 2.4/BA.2: net settlement (in cash, by exchanging instruments, or a practice of net-settling similar contracts) breaks the own-use exemption; the contract is accounted for as a derivative. Cash-flow hedge designation (6.5.11) can park effective changes in OCI.',
        color: T.amber,
      };
    }
    return {
      cls: 'Derivative at FVTPL — not held for own requirements',
      basis: 'Held for trading/resale rather than own compliance usage: IFRS 9 applies in full; consider hedge designation only if a documented compliance exposure exists.',
      color: T.amber,
    };
  }, [ifrs]);

  // Prospective effectiveness sketch — critical-terms match on the hedge program.
  const effTest = useMemo(() => {
    if (!hedgeRows) return null;
    const rows = hedgeRows.map((rw) => ({
      year: rw.year, netShort: rw.netShort, hedged: rw.hedged,
      ratio: rw.netShort > 0 ? (rw.hedged / rw.netShort) * 100 : 0,
      overHedged: rw.hedged > rw.netShort,
    }));
    return { rows, anyOver: rows.some((rw) => rw.overHedged) };
  }, [hedgeRows]);

  // ── Auction-calendar cash-flow planner (quarterly purchase schedule) ────
  const [qw, setQw] = useState([...DEFAULT_Q_WEIGHTS]);
  const setQwI = (i, v) => setQw((p) => p.map((x, j) => (j === i ? v : x)));
  const auction = useMemo(() => {
    if (!hedgeRows) return null;
    const w = qw.map((x) => Math.max(0, parseFloat(x) || 0));
    const wSum = w.reduce((a, b) => a + b, 0);
    if (wSum <= 0) return null;
    const rows = [];
    hedgeRows.forEach((rw) => {
      w.forEach((wq, qi) => {
        const tons = rw.hedged * (wq / wSum);
        const tauQ = rw.y - 1 + (qi + 0.5) / 4;              // mid-quarter execution time
        const px = cocForward(S, r, u, tauQ);
        rows.push({ key: `${rw.year}Q${qi + 1}`, year: rw.year, q: `Q${qi + 1}`, tons, tauQ, px, cash: tons * px });
      });
    });
    const totCash = rows.reduce((s, rw) => s + rw.cash, 0);
    const totTons = rows.reduce((s, rw) => s + rw.tons, 0);
    const peak = rows.reduce((m, rw) => (rw.cash > m.cash ? rw : m), rows[0]);
    return { rows, totCash, totTons, avgPx: totTons > 0 ? totCash / totTons : null, peak };
  }, [hedgeRows, qw, S, r, u]);

  // Cost-averaging: cumulative average locked €/t vs scenario spot path.
  const costAvg = useMemo(() => {
    if (!hedgeRows) return null;
    let cumT = 0; let cumCost = 0;
    return hedgeRows.map((rw) => {
      cumT += rw.hedged; cumCost += rw.hedged * rw.F;
      return { year: rw.year, F: rw.F, scen: rw.scen, avgLocked: cumT > 0 ? cumCost / cumT : null };
    });
  }, [hedgeRows]);

  // ── Sustainability × financial overlay ──────────────────────────────────
  const [sfx, setSfx] = useState({ icp: 90, abatePct: 6 });
  const setS_ = (k, v) => setSfx((p) => ({ ...p, [k]: v }));
  const icpCheck = useMemo(() => {
    if (!hedgeRows) return null;
    const hedgedT = hedgeRows.reduce((s, rw) => s + rw.hedged, 0);
    const lockedCost = hedgeRows.reduce((s, rw) => s + rw.hedged * rw.F, 0);
    const lockedPerT = hedgedT > 0 ? lockedCost / hedgedT : null;
    const icp = parseFloat(sfx.icp) || 0;
    const blendedPerT = hedgeTotals?.totalCost != null && hedgeTotals.netShort > 0 ? hedgeTotals.totalCost / hedgeTotals.netShort : null;
    return {
      icp, lockedPerT, blendedPerT,
      lockedDelta: lockedPerT != null ? icp - lockedPerT : null,
      blendedDelta: blendedPerT != null ? icp - blendedPerT : null,
    };
  }, [hedgeRows, hedgeTotals, sfx.icp]);

  // Emissions-trajectory-linked hedge need: emissions decline at the user
  // abatement rate; hedge need = max(emissions_t − allocation_t, 0) shrinks.
  const abate = useMemo(() => {
    const em0 = parseFloat(hedge.emissions) || 0;
    const a = Math.max(0, Math.min(100, parseFloat(sfx.abatePct) || 0)) / 100;
    const alloc0 = parseFloat(hedge.allocation) || 0;
    const dec = (parseFloat(hedge.allocDeclinePct) || 0) / 100;
    if (em0 <= 0) return null;
    return hedge.ratios.map((ratioRaw, i) => {
      const year = startYear + i + 1;
      const emAb = em0 * ((1 - a) ** (i + 1));
      const alloc = alloc0 * ((1 - dec) ** i);
      const needFlat = Math.max(em0 - alloc, 0);
      const needAb = Math.max(emAb - alloc, 0);
      const ratio = Math.max(0, Math.min(100, parseFloat(ratioRaw) || 0)) / 100;
      return {
        year, emAb, alloc, needFlat, needAb,
        hedgeFlat: needFlat * ratio, hedgeAb: needAb * ratio,
        freed: (needFlat - needAb) * ratio,
      };
    });
  }, [hedge, sfx.abatePct, startYear]);

  // Cost of delay: lock year-y volume today at F(y) vs buying it at the
  // engine scenario price in year y (requires the live forecast — nothing fabricated).
  const delay = useMemo(() => {
    if (!hedgeRows) return null;
    if (fc.status !== 'live') return { live: false };
    const rows = hedgeRows.map((rw) => ({
      year: rw.year, hedged: rw.hedged, F: rw.F, scen: rw.scen,
      nowCost: rw.hedged * rw.F,
      delayCost: rw.scen != null ? rw.hedged * rw.scen : null,
      delta: rw.scen != null ? rw.hedged * rw.scen - rw.hedged * rw.F : null,
    }));
    const tot = rows.every((rw) => rw.delta != null) ? rows.reduce((s, rw) => s + rw.delta, 0) : null;
    return { live: true, rows, tot };
  }, [hedgeRows, fc.status]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-11</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Carbon Derivatives Desk — EUA Compliance Hedging</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Black-76 (local)</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>EU ETS Forecast Engine</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Climate Derivatives Engine</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Compliance-hedging desk for EU Allowances: cost-of-carry forwards F = S·e^{'{'}(r+u)τ{'}'}, a user-editable strike×tenor
        implied-vol surface feeding Black-76 via bilinear interpolation (Abramowitz–Stegun normal CDF, cross-checkable against the
        platform derivatives engine), a multi-leg strategy builder with payoff and net greeks, EUA–UKA / EUA–CCA cross-market spread
        ladders, EU MSR intake/release mechanics on a user TNAC path, a hedge program priced off the live EU ETS scenario forecast
        with IFRS 9 classification, quarterly auction cash-flow planning and cost-averaging, a futures-book margin estimate, and a
        sustainability overlay (ICP consistency, abatement-linked hedge need, cost of delay).
      </div>

      {/* ── Market inputs ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>1 · Market Inputs & Forward Curve</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/climate-derivatives/ref/eua-market → prefill</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={ref.status} demoText={ref.error} /></div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
          <Field label="EUA spot S (€/t)" note={ref.status === 'live' ? 'prefilled from live engine ref (editable)' : 'labeled default near engine ref €65 — editable'}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={mkt.spot} onChange={(e) => setM('spot', e.target.value)} />
          </Field>
          <Field label="Risk-free rate r (%/yr)" note={ref.status === 'live' ? 'engine ref (editable)' : 'labeled default 3.5% — editable'}>
            <input type="number" step="0.1" style={inputStyle} value={mkt.ratePct} onChange={(e) => setM('ratePct', e.target.value)} />
          </Field>
          <Field label="Carry cost u (%/yr)" note="EUAs are registry entries: storage ≈ 0; u = funding/holding spread (user)">
            <input type="number" step="0.1" style={inputStyle} value={mkt.carryPct} onChange={(e) => setM('carryPct', e.target.value)} />
          </Field>
          <Field label="Volatility σ (%/yr)" width={200} note="user-supplied; default 35% = engine historical-vol ref. Carbon realized vol has historically been high and regime-dependent — treat as a wide range, not a precise number">
            <input type="number" min="0" step="1" style={inputStyle} value={mkt.volPct} onChange={(e) => setM('volPct', e.target.value)} />
          </Field>
          {ref.status === 'live' && ref.data?.vol_surface && (
            <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, alignSelf: 'flex-end', paddingBottom: 14 }}>
              engine ATM vol surface: {Object.entries(ref.data.vol_surface).map(([k, v]) => `${k} ${(v.ATM * 100).toFixed(0)}%`).join(' · ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 340 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Tenor τ</th><th style={th}>F = S·e^(r+u)τ (€/t)</th><th style={th}>Carry vs spot</th>{ref.status === 'live' && <th style={th}>Engine Dec-curve (ref)</th>}</tr></thead>
              <tbody>
                {fwdCurve.map((rw) => {
                  const decKey = ref.status === 'live' && ref.data?.futures_curve ? `Dec${startYear + Math.round(rw.tau)}` : null;
                  const engF = decKey ? ref.data.futures_curve[decKey] : null;
                  return (
                    <tr key={rw.tau}>
                      <td style={tdM}>{rw.label}</td>
                      <td style={{ ...tdM, fontWeight: 700, color: T.navy }}>{fmtEur(rw.F)}</td>
                      <td style={tdM}>+{fmt0(rw.carryBps)} bps</td>
                      {ref.status === 'live' && <td style={tdM}>{engF != null ? fmtEur(engF) : '—'}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Cost-of-carry model: allowances pay no yield, so the fair forward is the funded spot. The engine Dec-contract
              column (when live) is the platform's reference curve — a fundamentals-based curve, not a cost-of-carry curve; the gap is the implied risk premium.
            </div>
          </div>
          <div style={{ flex: 1.2, minWidth: 380 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Forward curve to 5y (€/t)</div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={fwdCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => fmtEur(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="F" name="Cost-of-carry forward" stroke={T.navy} strokeWidth={2.5} dot />
                <Line dataKey={() => S} name="Spot" stroke={T.gold} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Vol surface ───────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>2 · Implied-Vol Surface — Strike × Tenor</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Default smile = labeled market-typical skew (OTM puts rich), NOT quotes — all 20 nodes editable</span>
          <button onClick={resetSurface} style={{ marginLeft: 'auto', background: '#fff', color: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
            ↺ Rebuild default smile from σ = {mkt.volPct}%
          </button>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.1, minWidth: 420 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={th}>K/S ↓ · τ →</th>
                  {SURF_TENORS.map((tn) => <th style={th} key={tn}>{tn}y</th>)}
                </tr>
              </thead>
              <tbody>
                {SURF_MONEYS.map((m, i) => (
                  <tr key={m}>
                    <td style={{ ...tdM, fontWeight: 700, color: T.navy }}>
                      {Math.round(m * 100)}%{S > 0 ? ` (€${(m * S).toFixed(1)})` : ''}
                      <span style={{ color: T.sub, fontWeight: 400 }}>{m < 1 ? ' · OTM put' : m > 1 ? ' · OTM call' : ' · ATM'}</span>
                    </td>
                    {SURF_TENORS.map((tn, j) => (
                      <td key={tn} style={{ ...td, padding: '3px 6px' }}>
                        <input type="number" min="1" step="0.5" style={{ ...inputStyle, width: 72 }}
                          value={surfGrid[i][j]} onChange={(e) => setSurfNode(i, j, e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub }}>
              σ(K, τ) is read by BILINEAR interpolation between the four surrounding nodes (weights ∝ distance on each axis;
              queries outside the grid are clamped flat to the hull). At a node the weights collapse to 1/0, so quoted node
              values are reproduced exactly (verified). The option pricer below and every strategy leg price off this surface.
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 360 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Smile by tenor — vol % vs strike moneyness</div>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={smileData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => fmtPct(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {SURF_TENORS.map((tn, j) => (
                  <Line key={tn} dataKey={`t${tn}`} name={`${tn}y`} stroke={[T.navy, T.teal, T.gold, T.purple][j % 4]} strokeWidth={2} dot />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
              Skew rationale (documented): compliance entities are structurally short — downside puts on the hedge book and
              policy-shock upside calls both bid the wings; the put wing is typically richer. Smile flattens with tenor.
              {ref.status === 'live' && ref.data?.vol_surface ? ' Engine ATM refs shown in panel 1.' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── Options ───────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>3 · Options on Carbon Futures — Black-76</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>local pricing · Black (1976) · A&S 26.2.17 normal CDF</span>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <Field label="Strike K (€/t)"><input type="number" min="0" step="0.5" style={inputStyle} value={opt.strike} onChange={(e) => setOpt((p) => ({ ...p, strike: e.target.value }))} /></Field>
          <Field label="Expiry τ (yrs)"><input type="number" min="0.05" step="0.25" style={inputStyle} value={opt.tenor} onChange={(e) => setOpt((p) => ({ ...p, tenor: e.target.value }))} /></Field>
          <Field label="Vol source" width={200}>
            <select style={inputStyle} value={opt.volSource} onChange={(e) => setOpt((p) => ({ ...p, volSource: e.target.value }))}>
              <option value="surface">Surface σ(K,τ) — bilinear (panel 2)</option>
              <option value="flat">Flat σ (panel 1 input)</option>
            </select>
          </Field>
          <div style={{ fontSize: 11.5, color: T.sub, paddingBottom: 8 }}>
            Underlying futures F(τ) = <b style={{ fontFamily: T.mono, color: T.navy }}>{Fopt != null ? fmtEur(Fopt) : '—'}</b> from the cost-of-carry curve ·
            σ used = <b style={{ fontFamily: T.mono, color: T.navy }}>{fmtPct(sigmaUsed * 100)}</b>
            {opt.volSource === 'surface' && surfSigma != null ? ` (surface @ K/S ${(S > 0 ? K / S : 0).toFixed(2)}, τ ${tau}y)` : ' (flat)'}
          </div>
          <button onClick={runXcheck} disabled={!b76} style={{ marginLeft: 'auto', background: b76 ? T.navy : T.sub, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12.5, fontWeight: 700, cursor: b76 ? 'pointer' : 'not-allowed', fontFamily: T.font }}>
            Cross-check vs engine →
          </button>
        </div>

        {b76 && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Call premium" value={fmtEur(b76.call)} sub={`d1 ${fmt(b76.d1, 4)} · d2 ${fmt(b76.d2, 4)}`} color={T.green} />
              <Kpi label="Put premium" value={fmtEur(b76.put)} sub="Black-76 on F(τ)" color={T.red} />
              <Kpi label="Δ call / Δ put" value={`${fmt(b76.deltaCall, 3)} / ${fmt(b76.deltaPut, 3)}`} sub="∂V/∂F, discounted" />
              <Kpi label="Vega" value={fmtEur(b76.vega, 3)} sub="per 1 vol-point" color={T.indigo} />
              <Kpi label="Gamma" value={fmt(b76.gamma, 5)} sub="∂²V/∂F²" />
              <Kpi label="Put-call parity gap" value={parity != null ? parity.toExponential(2) : '—'} sub="C−P−e^(−rτ)(F−K) → 0" color={Math.abs(parity ?? 1) < 1e-9 ? T.green : T.red} />
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 8 }}>
              Formula: d1 = [ln(F/K) + σ²τ/2]/(σ√τ); d2 = d1 − σ√τ; C = e^(−rτ)[F·N(d1) − K·N(d2)]; P = e^(−rτ)[K·N(−d2) − F·N(−d1)].
              N(·) uses Abramowitz & Stegun 26.2.17 (max error 7.5×10⁻⁸). Theta (per day): call {fmtEur(b76.thetaCall, 4)} · put {fmtEur(b76.thetaPut, 4)}.
            </div>
          </>
        )}

        {/* Engine cross-check */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 8px' }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.navy }}>Engine cross-check</h3>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/climate-derivatives/price-eua-option × call+put</span>
          <Badge status={xcheck.status} demoText={xcheck.error} />
        </div>
        {xcheck.status === 'live' && xcheck.call && b76 && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 760 }}>
              <thead><tr><th style={th}>Leg</th><th style={th}>Desk Black-76 (€/t)</th><th style={th}>Engine BSM-on-spot (€/t)</th><th style={th}>Δ</th><th style={th}>Engine delta</th></tr></thead>
              <tbody>
                <tr>
                  <td style={{ ...td, fontWeight: 700, color: T.navy }}>Call {fmtEur(K, 0)}</td>
                  <td style={tdM}>{fmt(b76.call, 4)}</td>
                  <td style={tdM}>{fmt(xcheck.call.bsm_fair_value_eur_t, 4)}</td>
                  <td style={{ ...tdM, color: Math.abs(b76.call - xcheck.call.bsm_fair_value_eur_t) < 0.01 ? T.green : T.amber }}>{fmt(b76.call - xcheck.call.bsm_fair_value_eur_t, 4)}</td>
                  <td style={tdM}>{fmt(xcheck.call.greeks?.delta, 4)}</td>
                </tr>
                <tr>
                  <td style={{ ...td, fontWeight: 700, color: T.navy }}>Put {fmtEur(K, 0)}</td>
                  <td style={tdM}>{fmt(b76.put, 4)}</td>
                  <td style={tdM}>{fmt(xcheck.put?.bsm_fair_value_eur_t, 4)}</td>
                  <td style={{ ...tdM, color: Math.abs(b76.put - (xcheck.put?.bsm_fair_value_eur_t ?? NaN)) < 0.01 ? T.green : T.amber }}>{fmt(b76.put - (xcheck.put?.bsm_fair_value_eur_t ?? NaN), 4)}</td>
                  <td style={tdM}>{fmt(xcheck.put?.greeks?.delta, 4)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              The engine prices BSM on spot; with u = 0 the desk's Black-76 on F = S·e^(rτ) is mathematically identical, so Δ ≈ 0
              validates both implementations. With u ≠ 0 the desk price reflects the carry-adjusted forward and will differ — that difference is the carry effect, not an error.
            </div>
          </>
        )}
      </div>

      {/* ── Strategy builder ──────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>4 · Strategy Builder — Multi-Leg Positions</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>legs priced Black-76 on F(τ) at surface σ(K,τ) · payoff at nearest expiry</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(STRATEGY_PRESETS).map(([id, p]) => (
            <button key={id} onClick={() => loadPreset(id)} style={{
              background: stratName === id ? T.navy : '#fff', color: stratName === id ? '#fff' : T.navy,
              border: `1px solid ${stratName === id ? T.navy : T.border}`, borderRadius: 8, padding: '7px 12px',
              fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>{p.label}</button>
          ))}
          <button onClick={addLeg} style={{ marginLeft: 'auto', background: '#fff', color: T.teal, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>+ Add leg</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <thead>
            <tr>
              <th style={th}>Leg</th><th style={th}>Side</th><th style={th}>Type</th><th style={th}>Strike €/t</th><th style={th}>Tenor (yrs)</th><th style={th}>Qty (t)</th>
              <th style={th}>F(τ)</th><th style={th}>σ surface</th><th style={th}>Premium €/t</th><th style={th}>Δ</th><th style={th}>Γ</th><th style={th}>Vega</th><th style={th}>Θ/day</th><th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {legs.map((l, i) => {
              const pl = strat?.legs?.[i];
              return (
                <tr key={i}>
                  <td style={tdM}>{i + 1}</td>
                  <td style={{ ...td, padding: '3px 6px' }}>
                    <select style={{ ...inputStyle, width: 84 }} value={l.side} onChange={(e) => setLeg(i, 'side', Number(e.target.value))}>
                      <option value={1}>Long</option><option value={-1}>Short</option>
                    </select>
                  </td>
                  <td style={{ ...td, padding: '3px 6px' }}>
                    <select style={{ ...inputStyle, width: 76 }} value={l.type} onChange={(e) => setLeg(i, 'type', e.target.value)}>
                      <option value="call">Call</option><option value="put">Put</option>
                    </select>
                  </td>
                  <td style={{ ...td, padding: '3px 6px' }}><input type="number" min="0" step="0.5" style={{ ...inputStyle, width: 86 }} value={l.strike} onChange={(e) => setLeg(i, 'strike', e.target.value)} /></td>
                  <td style={{ ...td, padding: '3px 6px' }}><input type="number" min="0.05" step="0.25" style={{ ...inputStyle, width: 76 }} value={l.tenor} onChange={(e) => setLeg(i, 'tenor', e.target.value)} /></td>
                  <td style={{ ...td, padding: '3px 6px' }}><input type="number" min="0" step="1000" style={{ ...inputStyle, width: 100 }} value={l.qty} onChange={(e) => setLeg(i, 'qty', e.target.value)} /></td>
                  <td style={tdM}>{pl ? fmtEur(pl.F) : '—'}</td>
                  <td style={tdM}>{pl ? fmtPct(pl.sigmaPct) : '—'}</td>
                  <td style={{ ...tdM, fontWeight: 700, color: pl ? (l.side === 1 ? T.red : T.green) : T.slate }}>{pl ? `${l.side === 1 ? '−' : '+'}${fmt(pl.premPerT)}` : '—'}</td>
                  <td style={tdM}>{pl ? fmt0(pl.delta) : '—'}</td>
                  <td style={tdM}>{pl ? fmt(pl.gamma, 1) : '—'}</td>
                  <td style={tdM}>{pl ? fmt0(pl.vega) : '—'}</td>
                  <td style={tdM}>{pl ? fmt0(pl.theta) : '—'}</td>
                  <td style={td}>{legs.length > 1 && <button onClick={() => rmLeg(i)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {strat ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Net premium" value={`${strat.netPremium >= 0 ? '−' : '+'}${fmtEurM(Math.abs(strat.netPremium))}`} sub={strat.netPremium >= 0 ? 'paid (net long optionality)' : 'received (net short optionality)'} color={strat.netPremium >= 0 ? T.red : T.green} />
              <Kpi label="Breakeven(s)" value={strat.breakevens.length ? strat.breakevens.map((b) => fmtEur(b)).join(' · ') : 'none in ±60% grid'} sub={`at the ${strat.horizon}y horizon`} color={T.indigo} />
              <Kpi label="Net Δ (t-equiv)" value={fmt0(strat.netDelta)} sub="Σ leg deltas × qty" />
              <Kpi label="Net Γ" value={fmt(strat.netGamma, 1)} sub="per €/t move²" />
              <Kpi label="Net vega" value={fmt0(strat.netVega)} sub="€ per 1 vol-pt" color={T.purple} />
              <Kpi label="Net Θ" value={fmt0(strat.netTheta)} sub="€/day decay" color={strat.netTheta >= 0 ? T.green : T.amber} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
              Payoff at the nearest expiry ({strat.horizon}y) vs terminal price — intrinsic (solid) and net P&L after premium
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={strat.grid}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ST" tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v.toFixed(0)}`} type="number" domain={['dataMin', 'dataMax']} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${(v / 1e6).toFixed(1)}M`} />
                <Tooltip formatter={(v) => fmtEurM(v)} labelFormatter={(v) => `S_T = €${Number(v).toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="payoff" name="Aggregate payoff" fill={T.gold + '33'} stroke={T.gold} strokeWidth={1.5} />
                <Line dataKey="pnl" name="Net P&L (payoff − net premium)" stroke={T.navy} strokeWidth={2.5} dot={false} />
                <Line dataKey={() => 0} name="Zero" stroke={T.border} dot={false} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Aggregate payoff = Σ leg payoffs pointwise (a collar IS long put + short call — the identity is asserted in the
              verification suite). {strat.isCalendar ? 'Calendar legs beyond the nearest expiry are re-marked with Black-76 at their remaining tenor and the same surface vol — a documented static-vol simplification, not a stochastic-vol calendar model. ' : ''}
              Premium cash flows are undiscounted (paid/received today); greeks are at inception.
            </div>
          </>
        ) : <div style={{ fontSize: 12, color: T.sub }}>Enter valid legs (strike, tenor, qty &gt; 0) with a positive spot to price the strategy.</div>}
      </div>

      {/* ── Cross-market spreads ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>5 · Cross-Market Spreads — EUA–UKA · EUA–CCA</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>UKA/CCA levels + FX are user inputs; range notes are labeled desk observations, not data</span>
          <a href="/compliance-carbon-desk" style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, color: T.blue }}>
            Mechanism-level analytics → Compliance Carbon Desk
          </a>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <Field label="UKA (£/t, user)" width={120}><input type="number" min="0" step="0.5" style={inputStyle} value={xm.uka} onChange={(e) => setX('uka', e.target.value)} /></Field>
          <Field label="GBP→EUR" width={100}><input type="number" min="0" step="0.01" style={inputStyle} value={xm.gbpEur} onChange={(e) => setX('gbpEur', e.target.value)} /></Field>
          <Field label="CCA ($/t, user)" width={120}><input type="number" min="0" step="0.5" style={inputStyle} value={xm.cca} onChange={(e) => setX('cca', e.target.value)} /></Field>
          <Field label="USD→EUR" width={100}><input type="number" min="0" step="0.01" style={inputStyle} value={xm.usdEur} onChange={(e) => setX('usdEur', e.target.value)} /></Field>
          <Field label="Position size (t per leg)" width={160}><input type="number" min="0" step="1000" style={inputStyle} value={xm.tonnes} onChange={(e) => setX('tonnes', e.target.value)} /></Field>
          <Field label="Position view" width={230}>
            <select style={inputStyle} value={xm.dir} onChange={(e) => setX('dir', e.target.value)}>
              <option value="convergence">Convergence — short EUA / long other</option>
              <option value="divergence">Divergence — long EUA / short other</option>
            </select>
          </Field>
        </div>
        {xmModel ? (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[xmModel.uka, xmModel.cca].map((sp) => (
              <div key={sp.otherLabel} style={{ flex: 1, minWidth: 380 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Kpi label={`EUA − ${sp.otherLabel.startsWith('UKA') ? 'UKA' : 'CCA'} spread`} value={fmtEur(sp.spr)} sub={`EUA ${fmtEur(S)} vs ${sp.otherLabel} ${fmtEur(sp.other)}`} color={T.navy} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Scenario</th><th style={th}>Spread €/t</th><th style={th}>Position P&L €</th></tr></thead>
                  <tbody>
                    {sp.ladder.map((ld) => (
                      <tr key={ld.c} style={ld.c === 0 ? { background: T.gold + '18' } : undefined}>
                        <td style={tdM}>{ld.c === 0 ? 'unchanged' : ld.c > 0 ? `${fmt0(ld.c)}% convergence` : `${fmt0(-ld.c)}% widening`}</td>
                        <td style={tdM}>{fmtEur(ld.sprScen)}</td>
                        <td style={{ ...tdM, fontWeight: 700, color: ld.pnl > 0 ? T.green : ld.pnl < 0 ? T.red : T.slate }}>{ld.pnl === 0 ? '—' : `${ld.pnl > 0 ? '+' : ''}${fmt0(ld.pnl)}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: T.amber, marginTop: 6 }}>⚠ {sp.otherLabel.startsWith('UKA') ? XM_NOTES.uka : XM_NOTES.cca}</div>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 12, color: T.sub }}>Enter a positive EUA spot in panel 1.</div>}
        <div style={{ marginTop: 12, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 11, color: T.slate }}>
          <b style={{ color: T.navy }}>Compliance-arbitrage note:</b> EUA, UKA and CCA are NOT fungible — a UKA cannot be surrendered
          in the EU ETS and vice versa, so the spread cannot be arbitraged by physical delivery; convergence trades are policy bets.
          The 2025 UK–EU announcement of intent to link the two ETSs is the main structural compression driver for EUA–UKA
          (pre-linkage Swiss ETS linking, 2020, is the precedent); CCA sits in a different architecture entirely (WCI price floor
          escalating at 5% + CPI, USD-denominated). P&L above = view-direction × (scenario spread − current spread) × tonnes —
          deterministic scenario ladder, no simulation.
        </div>
      </div>

      {/* ── MSR mechanics ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>6 · EU Market Stability Reserve — Intake / Release Mechanics</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>{MSR_PARAMS.legalBasis}</span>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 360 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Published rules (legal values)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={td}>TNAC &gt; {fmt0(MSR_PARAMS.bufferTopMt)} Mt</td><td style={tdM}>intake = {MSR_PARAMS.intakeRateTo2030 * 100}% of TNAC (2019–2030) · {MSR_PARAMS.intakeRateAfter2030 * 100}% after 2030</td></tr>
                <tr><td style={td}>{fmt0(MSR_PARAMS.upperThresholdMt)}–{fmt0(MSR_PARAMS.bufferTopMt)} Mt (buffer band)</td><td style={tdM}>intake = TNAC − {fmt0(MSR_PARAMS.upperThresholdMt)} Mt (2023/959 anti-cliff rule)</td></tr>
                <tr><td style={td}>{fmt0(MSR_PARAMS.lowerThresholdMt)}–{fmt0(MSR_PARAMS.upperThresholdMt)} Mt</td><td style={tdM}>no action</td></tr>
                <tr><td style={td}>TNAC &lt; {fmt0(MSR_PARAMS.lowerThresholdMt)} Mt</td><td style={tdM}>{fmt0(MSR_PARAMS.releaseMt)} Mt released to auction volumes</td></tr>
                <tr><td style={td}>Invalidation (from 2023)</td><td style={tdM}>reserve holdings above previous year's auction volume are cancelled</td></tr>
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Basis: Decision (EU) 2015/1814 (12% intake, 833/400 Mt thresholds) as amended by Decision (EU) 2018/410
              (intake doubled to 24% from 2019) and Decision (EU) 2023/959 (24% extended to 2030; 833–1,096 Mt buffer band).
              Intake is deducted from Member State auction volumes over the following 12 months.
            </div>
          </div>
          <div style={{ flex: 1.4, minWidth: 460 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Supply-adjustment projection on your TNAC path
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8 }}>TNAC path = user input, defaults ILLUSTRATIVE</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Year</th><th style={th}>TNAC (Mt, user)</th><th style={th}>Band</th><th style={th}>Intake (Mt)</th><th style={th}>Release (Mt)</th><th style={th}>Net supply Δ (Mt)</th><th style={th}>Cum intake</th></tr></thead>
              <tbody>
                {msrRows.map((rw, i) => (
                  <tr key={rw.year}>
                    <td style={tdM}>{rw.year}</td>
                    <td style={{ ...td, padding: '3px 6px' }}><input type="number" min="0" step="10" style={{ ...inputStyle, width: 86 }} value={tnacPath[i].tnac} onChange={(e) => setTnac(i, e.target.value)} /></td>
                    <td style={{ ...tdM, fontSize: 10.5 }}>{rw.band}{rw.ratePct != null ? ` @ ${fmt0(rw.ratePct)}%` : ''}</td>
                    <td style={{ ...tdM, color: rw.intakeMt > 0 ? T.red : T.slate, fontWeight: rw.intakeMt > 0 ? 700 : 400 }}>{rw.intakeMt > 0 ? `−${fmt(rw.intakeMt, 1)}` : '—'}</td>
                    <td style={{ ...tdM, color: rw.releaseMt > 0 ? T.green : T.slate }}>{rw.releaseMt > 0 ? `+${fmt0(rw.releaseMt)}` : '—'}</td>
                    <td style={{ ...tdM, fontWeight: 700, color: rw.net < 0 ? T.red : rw.net > 0 ? T.green : T.slate }}>{rw.net === 0 ? '0' : `${rw.net > 0 ? '+' : ''}${fmt(rw.net, 1)}`}</td>
                    <td style={tdM}>{fmt(rw.cumIntake, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              The rules are applied year-by-year to YOUR TNAC path (each year's TNAC is your input — in reality the intake itself
              shrinks next year's TNAC, so a self-consistent path already nets that feedback). Projection is ILLUSTRATIVE.
            </div>
          </div>
        </div>
        <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 11, color: T.slate }}>
          <b style={{ color: T.navy }}>Price-impact reading (qualitative):</b> intake withdraws auction supply with a ~12-month lag —
          historically supportive of prices when TNAC is high (the 2019 start of 24% intake preceded the 2019–2021 repricing);
          the buffer band makes the withdrawal taper smoothly as TNAC approaches 833 Mt rather than cliff-edge. A release
          (TNAC &lt; 400 Mt) adds 100 Mt of supply and is the mechanism's bearish safety valve. The invalidation rule caps the
          reserve's overhang permanently — cancelled allowances can never return. None of this is a price forecast; use the
          scenario engine in panel 7 for price paths.
        </div>
      </div>

      {/* ── Hedge calculator ──────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>7 · Compliance Hedge Program</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/carbon-price-ets/eu-ets-forecast → scenario prices for the open position</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={fc.status} demoText={fc.error} /></div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <Field label="Expected emissions (tCO2/yr)"><input type="number" min="0" style={inputStyle} value={hedge.emissions} onChange={(e) => setH('emissions', e.target.value)} /></Field>
          <Field label="Free allocation yr 1 (t)"><input type="number" min="0" style={inputStyle} value={hedge.allocation} onChange={(e) => setH('allocation', e.target.value)} /></Field>
          <Field label="Allocation decline (%/yr)" width={180} note="default 4.3% = EU ETS Phase 4 LRF (Directive 2023/958); editable">
            <input type="number" step="0.1" style={inputStyle} value={hedge.allocDeclinePct} onChange={(e) => setH('allocDeclinePct', e.target.value)} />
          </Field>
          <Field label="Instrument" width={140}>
            <select style={inputStyle} value={hedge.instrument} onChange={(e) => setH('instrument', e.target.value)}>
              <option value="futures">Futures (lock F)</option>
              <option value="collar">Collar (call cap / put floor)</option>
            </select>
          </Field>
          {hedge.instrument === 'collar' && (
            <>
              <Field label="Cap strike (% of spot)" width={140}><input type="number" style={inputStyle} value={hedge.collarCapPct} onChange={(e) => setH('collarCapPct', e.target.value)} /></Field>
              <Field label="Floor strike (% of spot)" width={140}><input type="number" style={inputStyle} value={hedge.collarFloorPct} onChange={(e) => setH('collarFloorPct', e.target.value)} /></Field>
            </>
          )}
          <Field label="Price scenario" width={230}>
            <select style={inputStyle} value={hedge.scenario} onChange={(e) => setH('scenario', e.target.value)}>
              {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <button onClick={runForecast} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
            Fetch scenario prices →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          {hedge.ratios.map((rt, i) => (
            <Field key={i} label={`Hedge ratio Y${i + 1} (%)`} width={110}>
              <input type="number" min="0" max="100" style={inputStyle} value={rt} onChange={(e) => setRatio(i, e.target.value)} />
            </Field>
          ))}
          <div style={{ fontSize: 10.5, color: T.sub, alignSelf: 'flex-end', paddingBottom: 10 }}>Declining ladder is an editable program choice, not a recommendation.</div>
        </div>

        {hedgeRows && (
          <>
            {fc.status === 'live' && hedgeTotals && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <Kpi label="Cumulative net short" value={`${fmt0(hedgeTotals.netShort)} t`} sub={`${HEDGE_YEARS} compliance years`} />
                <Kpi label="Hedged volume" value={`${fmt0(hedgeTotals.hedged)} t`} sub={hedge.instrument === 'futures' ? 'via futures' : 'via collars'} color={T.teal} />
                <Kpi label="Program cost" value={fmtEurM(hedgeTotals.totalCost)} sub={`hedged @ ${hedge.instrument === 'futures' ? 'locked forwards' : 'collared scenario'} + open @ ${hedge.scenario}`} color={T.indigo} />
                <Kpi label="Fully-unhedged cost" value={fmtEurM(hedgeTotals.unhedgedCost)} sub={`all volume @ ${hedge.scenario} scenario path`} />
                <Kpi label="Hedge P&L vs unhedged" value={hedgeTotals.saving != null ? `${hedgeTotals.saving >= 0 ? '+' : ''}${fmtEurM(hedgeTotals.saving)}` : '—'} sub="positive = program cheaper under this scenario" color={(hedgeTotals.saving ?? 0) >= 0 ? T.green : T.red} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={th}>Year</th><th style={th}>Allocation (t)</th><th style={th}>Net short (t)</th><th style={th}>Hedge %</th>
                  <th style={th}>Hedged (t)</th><th style={th}>Open (t)</th><th style={th}>Lock F(τ) €/t</th>
                  {hedge.instrument === 'collar' && <th style={th}>Collar net prem €/t</th>}
                  <th style={th}>Scenario €/t</th><th style={th}>Hedged cost €</th><th style={th}>Open cost €</th><th style={th}>Total €</th><th style={th}>vs unhedged €</th>
                </tr>
              </thead>
              <tbody>
                {hedgeRows.map((rw) => (
                  <tr key={rw.y}>
                    <td style={tdM}>{rw.year}</td>
                    <td style={tdM}>{fmt0(rw.alloc)}</td>
                    <td style={{ ...tdM, fontWeight: 700, color: T.red }}>{fmt0(rw.netShort)}</td>
                    <td style={tdM}>{fmtPct(rw.ratio, 0)}</td>
                    <td style={{ ...tdM, color: T.teal, fontWeight: 700 }}>{fmt0(rw.hedged)}</td>
                    <td style={tdM}>{fmt0(rw.open)}</td>
                    <td style={tdM}>{fmtEur(rw.F)}</td>
                    {hedge.instrument === 'collar' && <td style={tdM}>{rw.netPrem != null ? fmtEur(rw.netPrem) : '—'}</td>}
                    <td style={{ ...tdM, color: T.purple }}>{rw.scen != null ? fmtEur(rw.scen) : '—'}</td>
                    <td style={tdM}>{rw.hedgedCost != null ? fmt0(rw.hedgedCost) : '—'}</td>
                    <td style={tdM}>{rw.openCost != null ? fmt0(rw.openCost) : '—'}</td>
                    <td style={{ ...tdM, fontWeight: 700, color: T.navy }}>{rw.totalCost != null ? fmt0(rw.totalCost) : '—'}</td>
                    <td style={{ ...tdM, color: (rw.saving ?? 0) >= 0 ? T.green : T.red }}>{rw.saving != null ? `${rw.saving >= 0 ? '+' : ''}${fmt0(rw.saving)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fc.status === 'live' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 1.3, minWidth: 400 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Net short, hedged vs open (t) — cost lines (€M)</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={hedgeRows}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="v" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="c" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `€${(v / 1e6).toFixed(0)}M`} />
                      <Tooltip formatter={(v, n) => (n.includes('cost') ? fmtEurM(v) : `${fmt0(v)} t`)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="v" dataKey="hedged" name="Hedged (t)" stackId="a" fill={T.teal} />
                      <Bar yAxisId="v" dataKey="open" name="Open (t)" stackId="a" fill={T.gold} />
                      <Line yAxisId="c" dataKey="totalCost" name="Program cost" stroke={T.navy} strokeWidth={2.5} dot />
                      <Line yAxisId="c" dataKey="unhedgedCost" name="Unhedged cost" stroke={T.red} strokeDasharray="5 4" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {fc.meta && (
                  <div style={{ flex: 1, minWidth: 300, fontSize: 11.5, color: T.slate }}>
                    <div style={{ fontWeight: 800, color: T.navy, marginBottom: 6 }}>Scenario path — engine metadata</div>
                    <div style={{ fontFamily: T.mono, fontSize: 11 }}>base {fmtEur(fc.meta.base)} · 2030 {fmtEur(fc.meta.p2030)}</div>
                    {(fc.meta.drivers || []).slice(0, 4).map((d, i) => <div key={i} style={{ marginTop: 4 }}>• {d}</div>)}
                    <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
                      Hedged tonnes lock today's cost-of-carry forward; open tonnes are marked to the engine's {hedge.scenario} path.
                      Collar hedges settle at min(max(scenario, floor), cap) + net option premium (Black-76, paid upfront, shown undiscounted).
                    </div>
                  </div>
                )}
              </div>
            )}
            {fc.status !== 'live' && (
              <div style={{ fontSize: 12, color: T.sub }}>
                Fetch scenario prices to project the cost of the open (unhedged) position — no scenario figures are shown without the live engine (this page never fabricates a price path). Locked-forward columns above are already computable from your market inputs.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Hedge accounting & program execution ──────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>8 · Hedge Accounting & Program Execution — IFRS 9 · Cost Averaging · Auction Calendar</h2>
        </div>

        {/* IFRS 9 decision tree */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1.1, minWidth: 400 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              IFRS 9 classification — own-use vs derivative
              <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>documented decision tree — not accounting advice</span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              <Field label="1 · Written option?" width={180}>
                <select style={inputStyle} value={ifrs.writtenOpt} onChange={(e) => setI('writtenOpt', e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes (sold optionality)</option>
                </select>
              </Field>
              <Field label="2 · Net-settled (cash / practice)?" width={200}>
                <select style={inputStyle} value={ifrs.netSettle} onChange={(e) => setI('netSettle', e.target.value)}>
                  <option value="no">No — physical delivery only</option>
                  <option value="yes">Yes / practice of net-settling</option>
                </select>
              </Field>
              <Field label="3 · Held for own compliance usage?" width={210}>
                <select style={inputStyle} value={ifrs.ownUse} onChange={(e) => setI('ownUse', e.target.value)}>
                  <option value="yes">Yes — expected surrender needs</option>
                  <option value="no">No — trading / resale</option>
                </select>
              </Field>
            </div>
            <div style={{ background: ifrsResult.color + '15', border: `1px solid ${ifrsResult.color}55`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: ifrsResult.color }}>{ifrsResult.cls}</div>
              <div style={{ fontSize: 11, color: T.slate, marginTop: 4 }}>{ifrsResult.basis}</div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Futures and options in the program above are financial instruments (derivatives) regardless — the tree governs
              PHYSICAL forward allowance purchase contracts. EUAs themselves are typically carried as intangibles or inventory
              (IAS 38 / IAS 2 policy choice); IFRIC 3 was withdrawn, so practice varies and should be disclosed.
            </div>
          </div>

          {/* Effectiveness sketch */}
          <div style={{ flex: 1, minWidth: 380 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Prospective effectiveness — critical-terms match sketch
              <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>IFRS 9 6.4.1(c) economic relationship</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <tbody>
                <tr><td style={td}>Hedged item</td><td style={tdM}>highly probable EUA purchases for surrender (cash-flow hedge)</td></tr>
                <tr><td style={td}>Hedging instrument</td><td style={tdM}>{hedge.instrument === 'futures' ? 'ICE/EEX EUA futures (Dec expiries)' : 'EUA collar (purchased call, no net written option)'}</td></tr>
                <tr><td style={td}>Underlying match</td><td style={{ ...tdM, color: T.green, fontWeight: 700 }}>✓ same underlying (EUA) — critical terms match</td></tr>
                <tr><td style={td}>Currency match</td><td style={{ ...tdM, color: T.green, fontWeight: 700 }}>✓ EUR / EUR</td></tr>
                <tr><td style={td}>Timing</td><td style={tdM}>Dec futures expiry vs Sep 30 surrender of the following compliance year — document the roll/basis</td></tr>
                <tr><td style={td}>Hedge ratio ladder</td><td style={{ ...tdM, color: effTest?.anyOver ? T.red : T.green, fontWeight: 700 }}>{effTest ? (effTest.anyOver ? '⚠ a year exceeds 100% of the exposure — trim to avoid ineffectiveness' : `✓ ${effTest.rows.map((rw) => `${fmt0(rw.ratio)}%`).join(' / ')} of net short — no over-hedge`) : 'enter program inputs above'}</td></tr>
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub }}>
              With matching underlying, currency and notional ≤ exposure, the economic relationship is demonstrable
              qualitatively (critical-terms match); residual ineffectiveness sources to document: Dec-contract basis vs the
              purchase dates, roll timing, and counterparty/CCP credit. IFRS 9 replaced the IAS 39 80–125% bright line with
              this qualitative + hedge-ratio requirement.
            </div>
          </div>
        </div>

        {/* Cost averaging */}
        {costAvg && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1.2, minWidth: 420 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                Cost-averaging — cumulative locked €/t vs scenario spot path
                <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>scenario path = live carbon_price_ets engine (panel 7)</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={costAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => `€${v.toFixed(0)}`} />
                  <Tooltip formatter={(v) => fmtEur(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="F" name="Year lock F(τ)" stroke={T.teal} strokeWidth={2} dot />
                  <Line dataKey="avgLocked" name="Cumulative avg locked" stroke={T.navy} strokeWidth={2.5} dot />
                  {fc.status === 'live' && <Line dataKey="scen" name={`${hedge.scenario} scenario spot`} stroke={T.purple} strokeDasharray="5 4" dot />}
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
                Laddered buying averages the entry: cumulative avg = Σ(hedged×F)/Σhedged across years bought so far.
                {fc.status !== 'live' ? ' Fetch scenario prices in panel 7 to overlay the engine spot path (never fabricated).' : ' Where the scenario line sits above the average-locked line, the ladder beat that scenario.'}
              </div>
            </div>

            {/* Auction calendar */}
            {auction && (
              <div style={{ flex: 1.3, minWidth: 460 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                  Auction-calendar cash-flow planner — quarterly purchase schedule
                  <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>priced at F(mid-quarter τ) — user weights</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
                  {qw.map((wq, i) => (
                    <Field key={i} label={`Q${i + 1} weight (%)`} width={92}>
                      <input type="number" min="0" style={inputStyle} value={wq} onChange={(e) => setQwI(i, e.target.value)} />
                    </Field>
                  ))}
                  <Kpi label="Total program cash" value={fmtEurM(auction.totCash)} sub={`avg ${fmtEur(auction.avgPx)}/t · peak quarter ${auction.peak.key} ${fmtEurM(auction.peak.cash)}`} color={T.indigo} />
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={auction.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="key" tick={{ fontSize: 8.5 }} interval={1} angle={-38} textAnchor="end" height={44} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${(v / 1e6).toFixed(1)}M`} />
                    <Tooltip formatter={(v, n) => (n === 'Cash out' ? fmtEurM(v) : `${fmt0(v)} t`)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cash" name="Cash out" fill={T.teal} radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
                  Splits each program year's hedged tonnes across quarters at your weights and prices each clip at the
                  cost-of-carry forward for its mid-quarter execution date. EEX runs EUA auctions ~3×/week (Mon/Tue/Thu) on the
                  published EUA auction calendar — align clips with auction density and your treasury cycle; weights are a
                  planning input, not a recommendation.
                </div>
              </div>
            )}
          </div>
        )}
        {!costAvg && <div style={{ fontSize: 12, color: T.sub }}>Enter hedge-program inputs in panel 7 (emissions, allocation, spot) to plan execution.</div>}
      </div>

      {/* ── Margin panel ──────────────────────────────────────────────────── */}
      {hedge.instrument === 'futures' && marginRows && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>9 · Futures-Book Margin Estimate</h2>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Convention assumptions — editable, NOT an exchange margin schedule</span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
            <Field label="Initial margin (% notional)" width={180} note="desk planning convention; exchange IM is vol-scaled and recalibrated — verify against the CCP schedule">
              <input type="number" min="0" max="100" style={inputStyle} value={margin.imPct} onChange={(e) => setMargin((p) => ({ ...p, imPct: e.target.value }))} />
            </Field>
            <Field label="VM stress: 1-day move (%)" width={180} note="variation-margin call on an adverse daily price move of this size (user stress assumption)">
              <input type="number" min="0" max="100" style={inputStyle} value={margin.vmMovePct} onChange={(e) => setMargin((p) => ({ ...p, vmMovePct: e.target.value }))} />
            </Field>
            {marginTotals && (
              <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 420 }}>
                <Kpi label="Book notional" value={fmtEurM(marginTotals.notional)} sub="Σ hedged × F(τ)" />
                <Kpi label="Initial margin" value={fmtEurM(marginTotals.im)} sub={`@ ${margin.imPct}% of notional`} color={T.indigo} />
                <Kpi label="VM on stress day" value={fmtEurM(marginTotals.vm)} sub={`${margin.vmMovePct}% adverse move`} color={T.red} />
              </div>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Contract year</th><th style={th}>Hedged (t)</th><th style={th}>F(τ) €/t</th><th style={th}>Notional €</th><th style={th}>Initial margin €</th><th style={th}>VM stress €</th></tr></thead>
            <tbody>
              {marginRows.map((rw) => (
                <tr key={rw.y}>
                  <td style={tdM}>{rw.year}</td>
                  <td style={tdM}>{fmt0(rw.hedged)}</td>
                  <td style={tdM}>{fmtEur(rw.F)}</td>
                  <td style={tdM}>{fmt0(rw.notional)}</td>
                  <td style={{ ...tdM, color: T.indigo, fontWeight: 700 }}>{fmt0(rw.im)}</td>
                  <td style={{ ...tdM, color: T.red }}>{fmt0(rw.vm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
            Liquidity planning view: initial margin is posted at inception and scales with notional; variation margin is the
            cash call if the market moves against the long-futures hedge in one day. Rolling shorter contracts forward changes τ and notional — re-run after restructuring the ladder.
          </div>
        </div>
      )}

      {/* ── Sustainability × financial overlay ────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>10 · Sustainability × Financial — ICP Consistency · Abatement-Linked Hedge · Cost of Delay</h2>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <Field label="Internal carbon price (€/t, user)" width={190}>
            <input type="number" min="0" step="1" style={inputStyle} value={sfx.icp} onChange={(e) => setS_('icp', e.target.value)} />
          </Field>
          <Field label="Abatement rate (%/yr, user)" width={180}>
            <input type="number" min="0" max="100" step="0.5" style={inputStyle} value={sfx.abatePct} onChange={(e) => setS_('abatePct', e.target.value)} />
            <span style={{ fontSize: 9.5, color: T.sub }}>emissions decline along your abatement path</span>
          </Field>
          {icpCheck && (
            <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 480, flexWrap: 'wrap' }}>
              <Kpi label="Locked hedge cost" value={icpCheck.lockedPerT != null ? `${fmtEur(icpCheck.lockedPerT)}/t` : '—'} sub="Σ hedged×F / Σ hedged (futures legs)" />
              <Kpi label="Program blended cost" value={icpCheck.blendedPerT != null ? `${fmtEur(icpCheck.blendedPerT)}/t` : 'needs live scenario'} sub="hedged + open @ scenario (panel 7)" color={T.purple} />
              <Kpi label="ICP headroom vs locked" value={icpCheck.lockedDelta != null ? `${icpCheck.lockedDelta >= 0 ? '+' : ''}${fmtEur(icpCheck.lockedDelta)}/t` : '—'}
                sub={icpCheck.lockedDelta != null && icpCheck.lockedDelta >= 0 ? 'hedged carbon costs less than your ICP — consistent' : 'hedged cost exceeds your ICP — revisit ICP or abate harder'}
                color={(icpCheck.lockedDelta ?? 0) >= 0 ? T.green : T.red} />
            </div>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 14 }}>
          Consistency logic: an internal carbon price BELOW the market cost you actually lock in means internal project
          appraisal under-charges carbon relative to reality; an ICP above it means every abatement project cheaper than the
          hedge cost is money-positive before the ICP even binds.
        </div>

        {abate && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ flex: 1.3, minWidth: 440 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Emissions-trajectory-linked hedge need — flat vs abating (t)</div>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={abate}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${fmt0(v)} t`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="hedgeFlat" name="Hedge volume — flat emissions" fill={T.border} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="hedgeAb" name={`Hedge volume — abating ${sfx.abatePct}%/yr`} fill={T.teal} radius={[3, 3, 0, 0]} />
                  <Line dataKey="needAb" name="Net short (abating)" stroke={T.navy} strokeWidth={2} dot />
                  <Line dataKey="needFlat" name="Net short (flat)" stroke={T.red} strokeDasharray="5 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
                Hedge need = max(emissions_t − allocation_t, 0) at your ladder ratios; abatement at {sfx.abatePct}%/yr frees
                {' '}{fmt0(abate.reduce((s, rw) => s + rw.freed, 0))} t of hedging over the program — over-hedging a declining
                emissions path creates a speculative long, so re-size the ladder as abatement delivers.
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 380 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                Cost of delay — lock today vs buy at scenario prices
                <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>scenario = live engine path only</span>
              </div>
              {delay?.live ? (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
                    <thead><tr><th style={th}>Year</th><th style={th}>Hedged (t)</th><th style={th}>Lock now F(τ)</th><th style={th}>Scenario €/t</th><th style={th}>Delay cost €</th></tr></thead>
                    <tbody>
                      {delay.rows.map((rw) => (
                        <tr key={rw.year}>
                          <td style={tdM}>{rw.year}</td>
                          <td style={tdM}>{fmt0(rw.hedged)}</td>
                          <td style={tdM}>{fmtEur(rw.F)}</td>
                          <td style={{ ...tdM, color: T.purple }}>{rw.scen != null ? fmtEur(rw.scen) : '—'}</td>
                          <td style={{ ...tdM, fontWeight: 700, color: (rw.delta ?? 0) > 0 ? T.red : T.green }}>{rw.delta != null ? `${rw.delta > 0 ? '+' : ''}${fmt0(rw.delta)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Kpi label="Total cost of delaying the whole program" value={delay.tot != null ? `${delay.tot > 0 ? '+' : ''}${fmtEurM(delay.tot)}` : '—'}
                    sub={`waiting and buying spot along the ${hedge.scenario} path vs locking forwards today`}
                    color={(delay.tot ?? 0) > 0 ? T.red : T.green} />
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                    Positive = the scenario path is above today's forwards (delay is expensive under that scenario);
                    negative = the scenario expects cheaper carbon later. This compares ONE scenario against the lockable
                    curve — it is scenario arithmetic, not an expected value.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: T.sub }}>
                  Fetch scenario prices in panel 7 — the cost-of-delay panel only prices off the live EU ETS forecast engine
                  (nothing is fabricated when it is offline).
                </div>
              )}
            </div>
          </div>
        )}
        {!abate && <div style={{ fontSize: 12, color: T.sub }}>Enter expected emissions in panel 7 to link the hedge to your abatement trajectory.</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engines wired: services/climate_derivatives_engine.py (EUA market ref + BSM option cross-check — its cat-bond/weather endpoints
        are out of scope for a compliance desk) · services/carbon_price_ets_engine.py (EU ETS Phase 4 scenario forecast, also feeding
        cost-averaging + cost-of-delay). Black-76, bilinear vol-surface interpolation, strategy payoffs/greeks, cross-market spread
        ladders, MSR rule arithmetic (Decision (EU) 2015/1814 as amended), cost-of-carry forwards, auction cash-flow planning and
        margin arithmetic are computed locally (lib/deskMath.js + this page); IM/VM percentages, carry cost, vol-surface nodes,
        UKA/CCA prices, TNAC path, ICP and abatement rate are labeled user assumptions / convention defaults.
        Mechanism-level compliance analytics: /compliance-carbon-desk.
      </div>
    </div>
  );
}
