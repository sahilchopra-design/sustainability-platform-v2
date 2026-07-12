import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, ReferenceLine, ComposedChart, Line, Scatter,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Infrastructure Private Debt Portfolio Manager (NX2-03)
// Aladdin-style infra private-debt book: positions ledger → duration/spread-
// duration, rating & sector concentration, expected loss (PF default-study PD
// × LGD × EAD), 1-yr ratings-migration stress, climate transition overlay,
// and a live repricing-gap join onto real ICE BofA rating-bucket OAS.
//
// Live engines:
//   GET  /api/v1/fred-spreads/series          real ICE BofA OAS via FRED (Live/Demo)
//   POST /api/v1/infra-portfolio/analyze      book engine: per-position cash-flow
//        projection + portfolio ladder + reinvestment horizon return, analytic
//        one-factor Vasicek/ASRF credit VaR (Acklam inverse-normal, documented),
//        HHI concentration (sector/country/single-name + granularity note),
//        migration-adjusted pricing alpha vs the live OAS join, PCAF-proxy
//        financed emissions + intensity-vs-spread OLS + classification mix
//   POST /api/v1/infra-portfolio/ngfs-overlay NGFS Phase 5 scenario overlay —
//        sector PD multipliers from scenario carbon price + GDP (documented
//        mapping table shown below, labeled model assumption) → EL/VaR ×6
//   GET  /api/v1/ngfs-extract/scenarios       seeded NGFS Phase 5 extract
//        (IIASA Scenario Explorer, CC BY 4.0) — provenance badge
// The quick-view analytics (duration, EL, migration, climate multiplier,
// repricing gap) remain computed IN THIS PAGE with documented closed-form math
// from the editable ledger — no PRNG, no fabricated numbers. Every table
// (PD, migration matrix, sector transition scores) is hand-authored, labeled
// approximate, and displayed in the UI with its study basis.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const CURRENT_YEAR = new Date().getFullYear();

const SECTORS = ['solar', 'wind', 'transmission', 'airport', 'toll road', 'social'];
const RATINGS = ['BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B'];
const SENIORITIES = ['Senior Secured', 'Senior Unsecured', 'HoldCo', 'Mezzanine'];

// Hand-authored editable default positions — realistic ILLUSTRATIVE project-
// finance debt positions (names are fictional projects; terms are typical of
// the asset class). NOT live positions; fully editable. intensity = financed-
// emissions intensity override (tCO2e/$M debt; blank = engine sector proxy).
const DEFAULT_POSITIONS = [
  { id: 1,  name: 'Helios Andalucía Solar Portfolio', sector: 'solar',        country: 'Spain',     rating: 'BBB-', notionalM: 85,  couponPct: 4.6, maturityYear: 2034, seniority: 'Senior Secured',   contractedPct: 92,  amortPct: 0, intensity: '' },
  { id: 2,  name: 'Borealis Offshore Wind TL',        sector: 'wind',         country: 'UK',        rating: 'BBB',  notionalM: 120, couponPct: 5.1, maturityYear: 2036, seniority: 'Senior Secured',   contractedPct: 85,  amortPct: 0, intensity: '' },
  { id: 3,  name: 'Great Plains Wind HoldCo',         sector: 'wind',         country: 'US',        rating: 'BB+',  notionalM: 95,  couponPct: 6.3, maturityYear: 2031, seniority: 'HoldCo',           contractedPct: 70,  amortPct: 0, intensity: '' },
  { id: 4,  name: 'TransMountain Grid Link',          sector: 'transmission', country: 'Canada',    rating: 'BBB+', notionalM: 110, couponPct: 4.2, maturityYear: 2038, seniority: 'Senior Unsecured', contractedPct: 100, amortPct: 2, intensity: '' },
  { id: 5,  name: 'Aegean Airport Concession',        sector: 'airport',      country: 'Greece',    rating: 'BB',   notionalM: 75,  couponPct: 7.1, maturityYear: 2033, seniority: 'Senior Secured',   contractedPct: 55,  amortPct: 3, intensity: '' },
  { id: 6,  name: 'Via Lusitana Toll Road',           sector: 'toll road',    country: 'Portugal',  rating: 'BBB-', notionalM: 90,  couponPct: 5.4, maturityYear: 2035, seniority: 'Senior Secured',   contractedPct: 60,  amortPct: 3, intensity: '' },
  { id: 7,  name: 'Midwest Social Housing PPP',       sector: 'social',       country: 'US',        rating: 'BBB+', notionalM: 60,  couponPct: 4.0, maturityYear: 2040, seniority: 'Senior Unsecured', contractedPct: 100, amortPct: 2, intensity: '' },
  { id: 8,  name: 'Cerro Verde Solar + Storage',      sector: 'solar',        country: 'Chile',     rating: 'BB+',  notionalM: 70,  couponPct: 6.8, maturityYear: 2032, seniority: 'Senior Secured',   contractedPct: 80,  amortPct: 0, intensity: '' },
  { id: 9,  name: 'Nordsee Interconnector',           sector: 'transmission', country: 'Germany',   rating: 'BBB+', notionalM: 130, couponPct: 3.8, maturityYear: 2041, seniority: 'Senior Unsecured', contractedPct: 100, amortPct: 2, intensity: '' },
  { id: 10, name: 'Serra Azul Wind Repowering',       sector: 'wind',         country: 'Brazil',    rating: 'BB-',  notionalM: 55,  couponPct: 8.2, maturityYear: 2030, seniority: 'Senior Secured',   contractedPct: 75,  amortPct: 0, intensity: '' },
  { id: 11, name: 'Gateway Airport TopCo Mezz',       sector: 'airport',      country: 'Australia', rating: 'B+',   notionalM: 45,  couponPct: 9.0, maturityYear: 2029, seniority: 'Mezzanine',        contractedPct: 50,  amortPct: 0, intensity: '' },
  { id: 12, name: 'Autopista del Sol Refinancing',    sector: 'toll road',    country: 'Mexico',    rating: 'BB',   notionalM: 65,  couponPct: 7.6, maturityYear: 2031, seniority: 'Senior Secured',   contractedPct: 65,  amortPct: 3, intensity: '' },
];

// ── Hand-authored cumulative PD table (%, by rating notch × tenor) ───────────
// APPROXIMATE, hand-authored to be consistent with published project-finance
// default studies (Moody's "Default and Recovery Rates for Project Finance
// Bank Loans" and S&P annual PF default studies): marginal default rates
// decline with seasoning and 10-yr cumulative rates sit between corporate
// investment-grade and speculative-grade equivalents. Displayed in-UI below.
// The same table drives the backend engine (see /api/v1/infra-portfolio/ref/mappings).
const PD_TENORS = [1, 3, 5, 7, 10];
const PD_TABLE = {
  'BBB+': [0.10, 0.45, 0.90, 1.40, 2.00],
  'BBB':  [0.16, 0.65, 1.30, 2.00, 2.90],
  'BBB-': [0.25, 1.00, 1.95, 2.95, 4.20],
  'BB+':  [0.45, 1.70, 3.20, 4.70, 6.50],
  'BB':   [0.70, 2.60, 4.80, 6.90, 9.30],
  'BB-':  [1.10, 3.90, 7.00, 9.90, 13.00],
  'B+':   [1.80, 6.00, 10.30, 14.00, 17.80],
  'B':    [2.60, 8.40, 13.90, 18.40, 22.70],
  'CCC':  [4.50, 13.00, 20.00, 25.50, 30.50],
};

// ── Hand-authored 1-yr ratings-migration matrix (%, letter-level) ────────────
// APPROXIMATE, PF-flavored (project ratings are stickier than corporates and
// migrate mostly one letter at a time). Rows sum to 100. Displayed in-UI.
const MIG_STATES = ['A_or_above', 'BBB', 'BB', 'B', 'CCC', 'D'];
const MIG_MATRIX = {
  BBB: { A_or_above: 1.5, BBB: 91.0, BB: 5.6, B: 1.2, CCC: 0.4, D: 0.3 },
  BB:  { A_or_above: 0.1, BBB: 4.9,  BB: 84.3, B: 7.5, CCC: 2.0, D: 1.2 },
  B:   { A_or_above: 0.0, BBB: 0.9,  BB: 6.0, B: 80.6, CCC: 8.0, D: 4.5 },
};

// ── Documented sector → transition-risk score mapping (0–100) ────────────────
// Stated model assumption (not data): scores rank sectors by exposure of cash
// flows to transition policy/demand shifts — contracted renewables lowest
// (revenue upside from decarbonization), regulated networks low (rate-based),
// availability-based social lowest-mid (no volume risk), demand-exposed
// transport highest (aviation demand + fuel-cost pass-through risk).
const SECTOR_TRANSITION = {
  solar: 12, wind: 15, transmission: 28, social: 35, 'toll road': 55, airport: 68,
};

// Map a rating notch to the ICE BofA OAS bucket + the letter used by the
// PD/migration tables. Order matters: test 'BBB' before 'BB'.
const letterOf = (r) => (r.indexOf('BBB') === 0 ? 'BBB' : r.indexOf('BB') === 0 ? 'BB' : 'B');
// FRED series id per letter bucket (real ICE BofA OAS). HY single buckets are
// not in the demo seed → falls back to the seeded HY aggregate, marked proxy.
const BUCKET_SERIES = { BBB: 'BAMLC0A4CBBB', BB: 'BAMLH0A1HYBB', B: 'BAMLH0A2HYB' };
const FALLBACK_SERIES = { BBB: 'BAMLC0A0CM', BB: 'BAMLH0A0HYM2', B: 'BAMLH0A0HYM2' };
const ALL_SPREAD_IDS = 'BAMLC0A4CBBB,BAMLH0A1HYBB,BAMLH0A2HYB,BAMLC0A0CM,BAMLH0A0HYM2';

// ── Closed-form bond math (documented) ───────────────────────────────────────
// Annual-pay bullet at flat discount rate y (decimal), n = round(ttm) years:
//   Price P     = Σ_{t=1..n} C/(1+y)^t + 100/(1+y)^n            (C = coupon, face 100)
//   Macaulay D  = [ Σ_{t=1..n} t · CF_t/(1+y)^t ] / P
//   Modified D  = Macaulay / (1+y)
//   Spread duration ≈ Modified duration (fixed-rate bullet: ∂P/∂s = ∂P/∂y)
function bondMath(couponPct, ttmYears, yieldPct) {
  const y = yieldPct / 100;
  const n = Math.max(1, Math.round(ttmYears));
  let pv = 0; let tw = 0;
  for (let t = 1; t <= n; t += 1) {
    const cf = couponPct + (t === n ? 100 : 0);
    const disc = cf / Math.pow(1 + y, t);
    pv += disc; tw += t * disc;
  }
  const mac = tw / pv;
  return { price: pv, mac, mod: mac / (1 + y) };
}

// Linear interpolation of the cumulative PD table at horizon h (years).
function cumPD(ratingOrLetter, h) {
  const row = PD_TABLE[ratingOrLetter];
  if (!row) return null;
  const y = Math.max(1, Math.min(h, 10));
  if (y <= PD_TENORS[0]) return row[0];
  for (let i = 1; i < PD_TENORS.length; i += 1) {
    if (y <= PD_TENORS[i]) {
      const t0 = PD_TENORS[i - 1]; const t1 = PD_TENORS[i];
      return row[i - 1] + ((row[i] - row[i - 1]) * (y - t0)) / (t1 - t0);
    }
  }
  return row[row.length - 1];
}

// PD assigned to each post-migration state (documented approximations):
// A_or_above → 0.5 × PD(BBB+) (state above table range); D → 100%.
function statePD(state, h) {
  if (state === 'D') return 100;
  if (state === 'A_or_above') return 0.5 * cumPD('BBB+', h);
  return cumPD(state, h);
}

const fmtM = (v) => ((v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`);
const fmtNum = (v, d = 1) => ((v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }));
const fmtPct = (v, d = 1) => ((v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`);
const fmtBps = (v, d = 0) => ((v == null || isNaN(v)) ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(d)} bps`);
const fmtT = (v) => ((v == null || isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })} t`);

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  if (status === 'extract') return <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>◆ Seeded extract (IIASA, CC BY 4.0)</span>;
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
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const noteTag = { background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 };
const secH = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const chip = { fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' };
const runBtn = { background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font };
const lblStyle = { fontSize: 11, color: T.sub, fontWeight: 600 };

const SECTOR_COLOR = {
  solar: T.gold, wind: T.teal, transmission: T.blue, airport: T.red, 'toll road': T.amber, social: T.purple,
};
const LETTER_COLOR = { BBB: T.teal, BB: T.amber, B: T.red };
const CLASS_COLOR = { green: T.green, transition: T.teal, neutral: T.slate };
const SCENARIO_COLOR = {
  net_zero_2050: T.green, below_2c: T.teal, delayed_transition: T.amber,
  fragmented_world: T.purple, ndcs: T.blue, current_policies: T.red,
};

export default function InfraDebtPortfolioManagerPage() {
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [lgdPct, setLgdPct] = useState(25);          // Moody's PF study basis (see label)
  const [baseRatePct, setBaseRatePct] = useState(4.25); // user input: funding/base curve proxy
  const [discRatePct, setDiscRatePct] = useState(6.0);  // flat discount for duration math
  const [elHorizon, setElHorizon] = useState(5);
  const [climateMult, setClimateMult] = useState(1.5);
  // Engine inputs (Vasicek / cash flows / NGFS)
  const [reinvRatePct, setReinvRatePct] = useState(4.0);
  const [assetCorr, setAssetCorr] = useState(0.24);   // labeled Basel PF convention
  const [anchorYear, setAnchorYear] = useState(2035);
  const [ngfsRegion, setNgfsRegion] = useState('World');

  // FRED spreads: { status, byBucket: {BBB:{oasPp, asOf, proxy}}, mode, error }
  const [fred, setFred] = useState({ status: 'loading', byBucket: null, mode: null, error: null });
  // NGFS extract provenance (GET /api/v1/ngfs-extract/scenarios)
  const [ngfsMeta, setNgfsMeta] = useState({ status: 'loading', meta: null, error: null });
  // Engine results
  const [engine, setEngine] = useState({ status: 'idle', data: null, error: null });   // POST /analyze
  const [overlay, setOverlay] = useState({ status: 'idle', data: null, error: null }); // POST /ngfs-overlay

  useEffect(() => {
    let mounted = true;
    axios.get(`/api/v1/fred-spreads/series?ids=${ALL_SPREAD_IDS}`, { timeout: 20000 })
      .then(({ data }) => {
        if (!mounted) return;
        const byId = {};
        (data.series || []).forEach((s) => {
          const obs = s.observations || [];
          if (obs.length) byId[s.id] = { oasPp: obs[obs.length - 1].value, asOf: obs[obs.length - 1].date };
        });
        const byBucket = {};
        Object.keys(BUCKET_SERIES).forEach((bk) => {
          if (byId[BUCKET_SERIES[bk]]) byBucket[bk] = { ...byId[BUCKET_SERIES[bk]], proxy: null };
          else if (byId[FALLBACK_SERIES[bk]]) byBucket[bk] = { ...byId[FALLBACK_SERIES[bk]], proxy: bk === 'BBB' ? 'IG aggregate' : 'HY aggregate' };
        });
        setFred({ status: data.mode === 'live' ? 'live' : 'demo', byBucket, mode: data.mode, error: data.mode === 'live' ? null : 'seeded FRED sample — set FRED_API_KEY' });
      })
      .catch((e) => { if (mounted) setFred({ status: 'demo', byBucket: null, mode: null, error: e?.response?.data?.detail || e.message }); });
    axios.get('/api/v1/ngfs-extract/scenarios', { params: { region: 'World', variable: 'carbon_price' }, timeout: 20000 })
      .then(({ data }) => { if (mounted) setNgfsMeta({ status: 'extract', meta: data.meta, error: null }); })
      .catch((e) => { if (mounted) setNgfsMeta({ status: 'demo', meta: null, error: e?.response?.data?.detail || e.message }); });
    return () => { mounted = false; };
  }, []);

  const updatePosition = (id, key, value) => setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  const addPosition = () => setPositions((prev) => [...prev, {
    id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
    name: 'New Position', sector: 'solar', country: 'US', rating: 'BBB',
    notionalM: 50, couponPct: 5.0, maturityYear: CURRENT_YEAR + 8, seniority: 'Senior Secured', contractedPct: 80, amortPct: 0, intensity: '',
  }]);
  const removePosition = (id) => setPositions((prev) => prev.filter((p) => p.id !== id));

  const valid = useMemo(() => positions.filter((p) => p.name && RATINGS.indexOf(p.rating) >= 0
    && parseFloat(p.notionalM) > 0 && parseFloat(p.couponPct) >= 0 && parseInt(p.maturityYear, 10) > CURRENT_YEAR), [positions]);

  // ── Core book analytics (all closed-form, from the ledger) ────────────────
  const book = useMemo(() => {
    if (!valid.length) return null;
    const lgd = Math.min(100, Math.max(0, parseFloat(lgdPct) || 0)) / 100;
    const y = Math.max(0.1, parseFloat(discRatePct) || 6);
    const rows = valid.map((p) => {
      const notional = parseFloat(p.notionalM);
      const coupon = parseFloat(p.couponPct);
      const ttm = Math.max(1, parseInt(p.maturityYear, 10) - CURRENT_YEAR);
      const bm = bondMath(coupon, ttm, y);
      const mv = (notional * bm.price) / 100;
      const hEff = Math.min(elHorizon, ttm);
      const pd = cumPD(p.rating, hEff);                       // cumulative %, table above
      const el = (pd / 100) * lgd * notional;                 // EL = PD × LGD × EAD (EAD = notional, bullet)
      // 1-yr migration stress: expected EL over same horizon after applying the matrix
      const letter = letterOf(p.rating);
      const mig = MIG_MATRIX[letter];
      let elMig = 0;
      MIG_STATES.forEach((s) => { elMig += (mig[s] / 100) * (statePD(s, hEff) / 100) * lgd * notional; });
      // climate transition overlay: stressed PD = PD × (1 + score/100 × (mult − 1))
      const score = SECTOR_TRANSITION[p.sector] != null ? SECTOR_TRANSITION[p.sector] : 40;
      const pdClimate = pd * (1 + (score / 100) * (climateMult - 1));
      const elClimate = (pdClimate / 100) * lgd * notional;
      return {
        ...p, notional, coupon, ttm, hEff, letter,
        price: bm.price, mv, mac: bm.mac, mod: bm.mod, sprDur: bm.mod,
        pd, el, elMig, score, pdClimate, elClimate,
        elDeltaMig: elMig - el, elDeltaClimate: elClimate - el,
      };
    });
    const totalNotional = rows.reduce((s, r) => s + r.notional, 0);
    const totalMV = rows.reduce((s, r) => s + r.mv, 0);
    const wMac = rows.reduce((s, r) => s + r.mac * r.mv, 0) / totalMV;
    const wMod = rows.reduce((s, r) => s + r.mod * r.mv, 0) / totalMV;
    const wCoupon = rows.reduce((s, r) => s + r.coupon * r.notional, 0) / totalNotional;
    const wContracted = rows.reduce((s, r) => s + (parseFloat(r.contractedPct) || 0) * r.notional, 0) / totalNotional;
    const totalEL = rows.reduce((s, r) => s + r.el, 0);
    const totalELMig = rows.reduce((s, r) => s + r.elMig, 0);
    const totalELClimate = rows.reduce((s, r) => s + r.elClimate, 0);
    const bySector = SECTORS.map((sec) => ({
      sector: sec, notional: rows.filter((r) => r.sector === sec).reduce((s, r) => s + r.notional, 0),
    })).filter((d) => d.notional > 0).map((d) => ({ ...d, pct: (d.notional / totalNotional) * 100 }));
    const byRating = RATINGS.map((rt) => ({
      rating: rt, notional: rows.filter((r) => r.rating === rt).reduce((s, r) => s + r.notional, 0),
    })).filter((d) => d.notional > 0).map((d) => ({ ...d, pct: (d.notional / totalNotional) * 100, letter: letterOf(d.rating) }));
    const hhiSector = bySector.reduce((s, d) => s + Math.pow(d.pct, 2), 0);
    return {
      rows, totalNotional, totalMV, wMac, wMod, wCoupon, wContracted,
      totalEL, totalELMig, totalELClimate, bySector, byRating, hhiSector,
      lgd: lgd * 100,
    };
  }, [valid, lgdPct, discRatePct, elHorizon, climateMult]);

  // ── Repricing gap (migration-adjusted pricing alpha) vs live OAS ──────────
  const repricing = useMemo(() => {
    if (!book || !fred.byBucket) return null;
    const base = parseFloat(baseRatePct) || 0;
    const rows = book.rows.map((r) => {
      const mkt = fred.byBucket[r.letter];
      if (!mkt) return { ...r, oasBps: null, bookSprBps: null, gapBps: null, proxy: null };
      const oasBps = mkt.oasPp * 100;
      const bookSprBps = (r.coupon - base) * 100;
      return { ...r, oasBps, bookSprBps, gapBps: bookSprBps - oasBps, proxy: mkt.proxy, oasAsOf: mkt.asOf };
    });
    const withGap = rows.filter((r) => r.gapBps != null);
    const wGap = withGap.length ? withGap.reduce((s, r) => s + r.gapBps * r.notional, 0) / withGap.reduce((s, r) => s + r.notional, 0) : null;
    return { rows, wGap };
  }, [book, fred, baseRatePct]);

  const elChartData = useMemo(() => (book ? book.rows.map((r) => ({
    name: r.name.length > 22 ? `${r.name.slice(0, 21)}…` : r.name,
    'Base EL': Number(r.el.toFixed(2)),
    'Climate-stressed EL': Number(r.elClimate.toFixed(2)),
    'Migration-stressed EL': Number(r.elMig.toFixed(2)),
  })) : []), [book]);

  // ── Engine payload (shared by /analyze and /ngfs-overlay) ─────────────────
  const enginePayload = useCallback(() => {
    const oasMap = {};
    if (fred.byBucket) Object.keys(fred.byBucket).forEach((bk) => { oasMap[bk] = fred.byBucket[bk].oasPp; });
    return {
      positions: valid.map((p) => ({
        name: p.name, sector: p.sector, country: p.country, rating: p.rating,
        notional_m: parseFloat(p.notionalM), coupon_pct: parseFloat(p.couponPct),
        maturity_year: parseInt(p.maturityYear, 10),
        amort_pct_per_yr: parseFloat(p.amortPct) || 0,
        contracted_pct: parseFloat(p.contractedPct) || undefined,
        intensity_tco2e_per_musd: p.intensity !== '' && !isNaN(parseFloat(p.intensity)) ? parseFloat(p.intensity) : undefined,
      })),
      as_of_year: CURRENT_YEAR,
      base_rate_pct: parseFloat(baseRatePct) || 0,
      discount_rate_pct: parseFloat(discRatePct) || 6,
      reinvestment_rate_pct: parseFloat(reinvRatePct) || 0,
      horizon_years: elHorizon,
      lgd_pct: parseFloat(lgdPct) || 0,
      asset_correlation: Math.min(0.99, Math.max(0.01, parseFloat(assetCorr) || 0.24)),
      bucket_oas_pp: Object.keys(oasMap).length ? oasMap : undefined,
    };
  }, [valid, fred.byBucket, baseRatePct, discRatePct, reinvRatePct, elHorizon, lgdPct, assetCorr]);

  const runEngine = useCallback(async () => {
    if (!valid.length) return;
    setEngine({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/infra-portfolio/analyze', enginePayload(), { timeout: 45000 });
      setEngine({ status: 'live', data, error: null });
    } catch (e) { setEngine({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }); }
  }, [valid.length, enginePayload]);

  const runOverlay = useCallback(async () => {
    if (!valid.length) return;
    setOverlay({ status: 'loading', data: null, error: null });
    try {
      const payload = { ...enginePayload(), anchor_year: parseInt(anchorYear, 10), region: ngfsRegion };
      const { data } = await axios.post('/api/v1/infra-portfolio/ngfs-overlay', payload, { timeout: 45000 });
      setOverlay({ status: 'live', data, error: null });
    } catch (e) { setOverlay({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }); }
  }, [valid.length, enginePayload, anchorYear, ngfsRegion]);

  // Intensity-vs-spread scatter + OLS line points (from engine output)
  const emissionsScatter = useMemo(() => {
    if (engine.status !== 'live' || !engine.data) return null;
    const pts = engine.data.positions.map((p) => ({
      x: p.intensity_tco2e_per_musd, y: p.spread_bp, name: p.name, cls: p.classification,
    }));
    const ols = engine.data.financed_emissions.intensity_vs_spread_ols;
    let line = null;
    if (ols) {
      const xs = pts.map((p) => p.x);
      const x0 = Math.min(...xs); const x1 = Math.max(...xs);
      line = [
        { x: x0, yfit: ols.intercept_bp + ols.slope_bp_per_tco2e_musd * x0 },
        { x: x1, yfit: ols.intercept_bp + ols.slope_bp_per_tco2e_musd * x1 },
      ];
    }
    return { pts, ols, line };
  }, [engine]);

  const scenarioChart = useMemo(() => {
    if (overlay.status !== 'live' || !overlay.data) return [];
    return overlay.data.scenarios.map((s) => ({
      name: s.scenario_name || s.scenario, id: s.scenario,
      EL: s.el_m, VaR99: s.var99_m, 'VaR99.9': s.var999_m,
    }));
  }, [overlay]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-03</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Infrastructure Debt Portfolio Manager</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>ICE BofA OAS via FRED</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Vasicek Credit VaR (ASRF)</span>
          <span style={{ background: T.green + '22', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>NGFS ×6 Scenario Overlay</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PCAF-Proxy Financed CO2e</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Private infrastructure-debt book manager: an editable positions ledger drives duration / spread-duration
        (annual-pay bullet, closed-form), rating &amp; sector concentration, expected loss from a hand-authored
        project-finance cumulative PD table (labeled approximate) × user LGD × EAD, a 1-yr ratings-migration stress and
        per-sector climate multiplier — plus the <b>book engine</b>: per-position cash-flow projection with reinvestment
        horizon return, analytic one-factor <b>Vasicek/ASRF credit VaR</b> (99% / 99.9%, EL-vs-UL decomposition),
        multi-axis <b>HHI concentration</b>, <b>migration-adjusted pricing alpha</b> vs live ICE BofA OAS,
        <b> PCAF-proxy financed emissions</b> (does the book price carbon risk? OLS + R²) and the <b>NGFS Phase 5
        scenario overlay</b> repricing EL/VaR across all six scenarios. Nothing is fabricated.
      </div>

      {/* ── Positions ledger ────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={secH}>Positions Ledger</h2>
          <span style={noteTag}>Editable defaults — hand-authored illustrative positions (fictional projects, typical asset-class terms), not live holdings</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={th}>Position</th><th style={th}>Sector</th><th style={th}>Country</th><th style={th}>Rating</th>
                <th style={th}>Notional $M</th><th style={th}>Coupon %</th><th style={th}>Maturity</th>
                <th style={th}>Amort %/yr</th>
                <th style={th}>Seniority</th><th style={th}>Contracted rev %</th>
                <th style={th}>tCO2e/$M (blank = proxy)</th><th style={{ ...th, width: 46 }} />
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...td, minWidth: 180 }}><input style={inputStyle} value={p.name} onChange={(e) => updatePosition(p.id, 'name', e.target.value)} /></td>
                  <td style={td}>
                    <select style={inputStyle} value={p.sector} onChange={(e) => updatePosition(p.id, 'sector', e.target.value)}>
                      {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ ...td, minWidth: 88 }}><input style={inputStyle} value={p.country} onChange={(e) => updatePosition(p.id, 'country', e.target.value)} /></td>
                  <td style={td}>
                    <select style={inputStyle} value={p.rating} onChange={(e) => updatePosition(p.id, 'rating', e.target.value)}>
                      {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={td}><input type="number" min="0" style={inputStyle} value={p.notionalM} onChange={(e) => updatePosition(p.id, 'notionalM', e.target.value)} /></td>
                  <td style={td}><input type="number" min="0" step="0.1" style={inputStyle} value={p.couponPct} onChange={(e) => updatePosition(p.id, 'couponPct', e.target.value)} /></td>
                  <td style={td}><input type="number" min={CURRENT_YEAR + 1} max="2060" style={inputStyle} value={p.maturityYear} onChange={(e) => updatePosition(p.id, 'maturityYear', e.target.value)} /></td>
                  <td style={td}><input type="number" min="0" max="20" step="0.5" style={inputStyle} value={p.amortPct} onChange={(e) => updatePosition(p.id, 'amortPct', e.target.value)} /></td>
                  <td style={td}>
                    <select style={inputStyle} value={p.seniority} onChange={(e) => updatePosition(p.id, 'seniority', e.target.value)}>
                      {SENIORITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={td}><input type="number" min="0" max="100" style={inputStyle} value={p.contractedPct} onChange={(e) => updatePosition(p.id, 'contractedPct', e.target.value)} /></td>
                  <td style={td}><input type="number" min="0" placeholder="proxy" style={inputStyle} value={p.intensity} onChange={(e) => updatePosition(p.id, 'intensity', e.target.value)} /></td>
                  <td style={td}>
                    <button onClick={() => removePosition(p.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <button onClick={addPosition} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 16px' }}>+ Add position</button>
          <label style={lblStyle}>
            LGD % <span style={{ fontWeight: 400 }}>(basis: Moody's PF study — senior-secured PF ultimate recoveries ≈ 75–80% → LGD 20–25%)</span>
            <input type="number" min="0" max="100" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={lgdPct} onChange={(e) => setLgdPct(e.target.value)} />
          </label>
          <label style={lblStyle}>
            Discount rate % <span style={{ fontWeight: 400 }}>(flat yield for pricing/duration)</span>
            <input type="number" min="0.1" max="25" step="0.25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={discRatePct} onChange={(e) => setDiscRatePct(e.target.value)} />
          </label>
          <label style={lblStyle}>
            EL horizon (yrs, cumulative PD)
            <select style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={elHorizon} onChange={(e) => setElHorizon(parseInt(e.target.value, 10))}>
              {PD_TENORS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={lblStyle}>
            Base rate % <span style={{ fontWeight: 400 }}>(user input — funding-curve proxy for spread decomposition)</span>
            <input type="number" min="0" max="15" step="0.25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={baseRatePct} onChange={(e) => setBaseRatePct(e.target.value)} />
          </label>
          <label style={lblStyle}>
            Reinvestment rate % <span style={{ fontWeight: 400 }}>(horizon-return calc)</span>
            <input type="number" min="0" max="20" step="0.25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={reinvRatePct} onChange={(e) => setReinvRatePct(e.target.value)} />
          </label>
          <label style={lblStyle}>
            Asset correlation ρ <span style={{ fontWeight: 400 }}>(0.24 = Basel PF convention, labeled)</span>
            <input type="number" min="0.01" max="0.99" step="0.01" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={assetCorr} onChange={(e) => setAssetCorr(e.target.value)} />
          </label>
          <label style={lblStyle}>
            Climate stress multiplier ×{Number(climateMult).toFixed(2)}
            <input type="range" min="1" max="3" step="0.25" style={{ display: 'block', width: 180, marginTop: 6 }} value={climateMult} onChange={(e) => setClimateMult(parseFloat(e.target.value))} />
          </label>
        </div>
      </div>

      {/* ── Book KPIs (in-page quick view) ──────────────────────────────────── */}
      {book && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <Kpi label="Book notional" value={fmtM(book.totalNotional)} sub={`${book.rows.length} positions · MV ${fmtM(book.totalMV)} @ ${fmtPct(parseFloat(discRatePct), 2)} flat`} />
            <Kpi label="Macaulay / modified duration" value={`${fmtNum(book.wMac, 2)} / ${fmtNum(book.wMod, 2)}`} sub="MV-weighted · annual-pay bullet, closed-form" color={T.indigo} />
            <Kpi label="Spread duration" value={fmtNum(book.wMod, 2)} sub="≈ modified duration (fixed-rate bullet)" color={T.indigo} />
            <Kpi label={`Expected loss (${elHorizon}y)`} value={fmtM(book.totalEL)} sub={`${fmtPct((book.totalEL / book.totalNotional) * 100, 2)} of notional · PD × LGD ${fmtPct(book.lgd, 0)} × EAD`} color={T.red} />
            <Kpi label="Migration-stressed EL" value={fmtM(book.totalELMig)} sub={`Δ ${fmtM(book.totalELMig - book.totalEL)} vs base · 1-yr PF matrix`} color={T.amber} />
            <Kpi label={`Climate-stressed EL (×${Number(climateMult).toFixed(2)})`} value={fmtM(book.totalELClimate)} sub={`Δ ${fmtM(book.totalELClimate - book.totalEL)} vs base · sector transition scores`} color={T.purple} />
            <Kpi label="Wavg coupon / contracted" value={`${fmtPct(book.wCoupon, 2)} / ${fmtPct(book.wContracted, 0)}`} sub="Notional-weighted" />
          </div>

          {/* ── Concentration + EL charts ─────────────────────────────────── */}
          <div style={card}>
            <h2 style={{ ...secH, marginBottom: 12 }}>Concentration &amp; Expected Loss</h2>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.1, minWidth: 260 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Sector concentration (% of notional) · HHI {fmtNum(book.hhiSector, 0)} {book.hhiSector > 2500 ? '(concentrated)' : book.hhiSector > 1500 ? '(moderate)' : '(diversified)'}
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={book.bySector} dataKey="notional" nameKey="sector" cx="50%" cy="50%" outerRadius={78} label={(d) => `${d.sector} ${d.pct.toFixed(0)}%`}>
                      {book.bySector.map((d, i) => <Cell key={i} fill={SECTOR_COLOR[d.sector] || T.slate} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtM(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Rating concentration (notional $M, coloured by letter bucket)</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={book.byRating}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n, pr) => [`${fmtM(v)} (${fmtPct(pr?.payload?.pct)})`, 'Notional']} />
                    <Bar dataKey="notional" radius={[3, 3, 0, 0]}>
                      {book.byRating.map((d, i) => <Cell key={i} fill={LETTER_COLOR[d.letter]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.6, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Expected loss per position ($M): base vs migration vs climate overlay</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={elChartData} margin={{ bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 8.5 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} verticalAlign="top" />
                    <Bar dataKey="Base EL" fill={T.teal} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Migration-stressed EL" fill={T.amber} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Climate-stressed EL" fill={T.purple} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Position analytics table ──────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={secH}>Position Analytics</h2>
              <span style={chip}>
                Price = Σ C/(1+y)^t + 100/(1+y)^n · D_mac = Σ t·CF_t/(1+y)^t / P · D_mod = D_mac/(1+y) · EL = PD_cum(min(h, ttm)) × LGD × EAD
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
                <thead>
                  <tr>
                    <th style={th}>Position</th><th style={th}>Rating</th><th style={th}>TTM</th><th style={th}>Price</th>
                    <th style={th}>Mac dur</th><th style={th}>Mod dur</th><th style={th}>PD {elHorizon}y</th>
                    <th style={th}>EL $M</th><th style={th}>Migration EL Δ</th><th style={th}>Transition score</th>
                    <th style={th}>Climate PD</th><th style={th}>Climate EL Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {book.rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.name}</td>
                      <td style={td}><span style={{ background: LETTER_COLOR[r.letter] + '22', color: LETTER_COLOR[r.letter], borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>{r.rating}</span></td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.ttm}y</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.price, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.mac, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.mod, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.pd, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.red }}>{fmtNum(r.el, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: r.elDeltaMig >= 0 ? T.amber : T.green }}>{r.elDeltaMig >= 0 ? '+' : ''}{fmtNum(r.elDeltaMig, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.score}/100</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.pdClimate, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: r.elDeltaClimate > 0 ? T.purple : T.green }}>{r.elDeltaClimate >= 0 ? '+' : ''}{fmtNum(r.elDeltaClimate, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ Book engine: cash flows + Vasicek VaR + concentration + emissions ══ */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secH}>Book Engine — Cash Flows · Vasicek Credit VaR · Concentration · Financed Emissions</h2>
              <button onClick={runEngine} disabled={engine.status === 'loading' || !valid.length} style={runBtn}>
                {engine.status === 'loading' ? 'Analyzing…' : 'Run book engine →'}
              </button>
              <span style={chip}>POST /api/v1/infra-portfolio/analyze</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={engine.status === 'idle' ? undefined : engine.status} demoText={engine.error} /></div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
              Sends the ledger + LGD {fmtPct(parseFloat(lgdPct), 0)} + ρ {Number(assetCorr).toFixed(2)} + the live OAS join to the
              deterministic backend engine. Credit VaR is the analytic one-factor Vasicek/ASRF formula — VaR_q = Σ EAD × LGD ×
              Φ((Φ⁻¹(PD) + √ρ·Φ⁻¹(q))/√(1−ρ)) — with the inverse normal via the Acklam rational approximation (documented in-engine).
              ρ = 0.24 default is labeled: Basel-convention high band for project finance / specialised lending.
            </div>

            {engine.status === 'live' && engine.data && (
              <>
                {/* Credit VaR + horizon return KPIs */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label={`EL (${engine.data.inputs.horizon_years}y)`} value={fmtM(engine.data.credit_var.el_m)} sub="Σ EAD × LGD × PD — priced, expected" color={T.slate} />
                  <Kpi label="Credit VaR 99%" value={fmtM(engine.data.credit_var.var99_m)} sub={`UL99 ${fmtM(engine.data.credit_var.ul99_m)} above EL`} color={T.amber} />
                  <Kpi label="Credit VaR 99.9%" value={fmtM(engine.data.credit_var.var999_m)} sub={`UL99.9 ${fmtM(engine.data.credit_var.ul999_m)} — capital-style tail`} color={T.red} />
                  <Kpi label="Capital multiple" value={engine.data.credit_var.capital_multiple != null ? `${fmtNum(engine.data.credit_var.capital_multiple, 1)}×` : '—'} sub="UL99.9 ÷ EL — how many ELs of capital the tail needs" color={T.purple} />
                  <Kpi label="Horizon return" value={`${fmtNum(engine.data.book.horizon_return_pct_pa, 2)}%/yr`} sub={`CFs → reinvested @ ${fmtPct(parseFloat(reinvRatePct), 2)} to Y${engine.data.book.horizon_years}; residual PV @ ${fmtPct(parseFloat(discRatePct), 2)}`} color={T.green} />
                </div>

                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
                  {/* Cash-flow ladder */}
                  <div style={{ flex: 1.5, minWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Portfolio cash-flow ladder ($M/yr): coupons + amortisation/principal</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={engine.data.cashflow_ladder}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtM(v), n]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="coupon_m" name="Coupons" stackId="cf" fill={T.teal} />
                        <Bar dataKey="principal_m" name="Principal" stackId="cf" fill={T.indigo} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{engine.data.cashflow_methodology}</div>
                  </div>
                  {/* Concentration block */}
                  <div style={{ flex: 1, minWidth: 320 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Concentration (HHI, 0–10000)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Axis</th><th style={th}>HHI</th><th style={th}>Read</th></tr></thead>
                      <tbody>
                        {[['Sector', engine.data.concentration.by_sector.hhi], ['Country', engine.data.concentration.by_country.hhi], ['Single name', engine.data.concentration.single_name.hhi]].map(([axis, hhi]) => (
                          <tr key={axis}>
                            <td style={{ ...td, fontWeight: 600, color: T.navy }}>{axis}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(hhi, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: hhi > 2500 ? T.red : hhi > 1500 ? T.amber : T.green }}>
                              {hhi > 2500 ? 'concentrated' : hhi > 1500 ? 'moderate' : 'diversified'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11.5, color: T.slate, marginTop: 8, fontFamily: T.mono }}>
                      Largest name {fmtPct(engine.data.concentration.single_name.largest_1_pct)} · top-3 {fmtPct(engine.data.concentration.single_name.largest_3_pct)} ·
                      top-5 {fmtPct(engine.data.concentration.single_name.largest_5_pct)} · effective N ≈ {fmtNum(engine.data.concentration.single_name.effective_n, 1)}
                    </div>
                    <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{engine.data.concentration.granularity_note}</div>
                    {engine.data.pricing.book_alpha_bp != null && (
                      <div style={{ marginTop: 10, background: T.cream, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>Migration-adjusted pricing alpha</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, color: engine.data.pricing.book_alpha_bp >= 0 ? T.green : T.red }}>
                          {fmtBps(engine.data.pricing.book_alpha_bp)} book alpha
                        </div>
                        <div style={{ fontSize: 10.5, color: T.sub }}>{engine.data.pricing.note}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financed emissions */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <Kpi label="Financed emissions" value={fmtT(engine.data.financed_emissions.total_tco2e)} sub={`Wavg intensity ${fmtNum(engine.data.financed_emissions.wavg_intensity_tco2e_per_musd, 0)} tCO2e/$M — PCAF proxy, labeled`} color={T.slate} />
                    <Kpi label="Does the book price carbon?" value={engine.data.financed_emissions.intensity_vs_spread_ols ? `R² ${fmtNum(engine.data.financed_emissions.intensity_vs_spread_ols.r2, 2)}` : '—'}
                      sub={engine.data.financed_emissions.intensity_vs_spread_ols ? `Slope ${fmtNum(engine.data.financed_emissions.intensity_vs_spread_ols.slope_bp_per_tco2e_musd, 3)} bp per tCO2e/$M (OLS, n=${engine.data.financed_emissions.intensity_vs_spread_ols.n})` : 'OLS unavailable'} color={T.indigo} />
                    <Kpi label="Paris-alignment share" value={fmtPct(engine.data.financed_emissions.paris_alignment_share_pct.strict_green_only, 0)}
                      sub={`Strict (green only) · broad green+transition ${fmtPct(engine.data.financed_emissions.paris_alignment_share_pct.broad_green_plus_transition, 0)} — labeled conventions`} color={T.green} />
                  </div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1.4, minWidth: 380 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Intensity (tCO2e/$M) vs spread (bp) — dots = positions, line = OLS fit</div>
                      {emissionsScatter && (
                        <ResponsiveContainer width="100%" height={230}>
                          <ComposedChart data={[...emissionsScatter.pts, ...(emissionsScatter.line || [])]}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} label={{ value: 'tCO2e / $M debt', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Spread (bp)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                            <Tooltip formatter={(v, n) => [n === 'OLS fit' ? fmtBps(v) : fmtBps(v), n]} labelFormatter={(x) => `${fmtNum(x, 0)} tCO2e/$M`} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Scatter dataKey="y" name="Positions" fill={T.indigo} />
                            <Line dataKey="yfit" name="OLS fit" stroke={T.amber} strokeWidth={2} dot={false} connectNulls />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div style={{ flex: 0.9, minWidth: 260 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Green / transition / neutral mix (% of notional, sector defaults labeled)</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={Object.entries(engine.data.financed_emissions.classification_mix_pct).map(([k, v]) => ({ name: k, value: v }))}
                            dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(d) => `${d.name} ${d.value.toFixed(0)}%`}>
                            {Object.keys(engine.data.financed_emissions.classification_mix_pct).map((k, i) => <Cell key={i} fill={CLASS_COLOR[k] || T.slate} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmtPct(v, 1)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ fontSize: 10.5, color: T.sub }}>{engine.data.financed_emissions.methodology}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ══ NGFS scenario overlay ══ */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={secH}>NGFS Phase 5 Scenario Overlay — Climate × Credit</h2>
              <button onClick={runOverlay} disabled={overlay.status === 'loading' || !valid.length} style={runBtn}>
                {overlay.status === 'loading' ? 'Repricing ×6…' : 'Run scenario overlay →'}
              </button>
              <span style={chip}>POST /api/v1/infra-portfolio/ngfs-overlay · GET /api/v1/ngfs-extract/scenarios</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge status={ngfsMeta.status} demoText={ngfsMeta.error} />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              {ngfsMeta.meta ? `${ngfsMeta.meta.source || 'NGFS Phase 5 seeded extract (IIASA Scenario Explorer, CC BY 4.0)'} — ` : ''}
              scenario carbon price + GDP impact at the anchor year map to sector PD multipliers via the documented
              sensitivity table below (LABELED MODEL ASSUMPTION — transition channel only, physical risk not modeled),
              then EL / VaR99 / VaR99.9 are re-run through the same Vasicek block for all six scenarios.
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <label style={lblStyle}>Anchor year
                <select style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={anchorYear} onChange={(e) => setAnchorYear(e.target.value)}>
                  {[2025, 2030, 2035, 2040, 2045, 2050].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label style={lblStyle}>Region
                <select style={{ ...inputStyle, width: 100, display: 'block', marginTop: 3 }} value={ngfsRegion} onChange={(e) => setNgfsRegion(e.target.value)}>
                  {['World', 'EU', 'US', 'CN'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </div>

            {overlay.status === 'live' && overlay.data && (
              <>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ flex: 1.5, minWidth: 420 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      EL / VaR99 / VaR99.9 ($M) by scenario @ {overlay.data.anchor_year}, {overlay.data.region} — base EL {fmtM(overlay.data.base.el_m)}
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={scenarioChart} margin={{ bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtM(v), n]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" />
                        <ReferenceLine y={overlay.data.base.el_m} stroke={T.slate} strokeDasharray="5 4" label={{ value: 'base EL', fontSize: 9, fill: T.sub }} />
                        <Bar dataKey="EL" fill={T.teal} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="VaR99" fill={T.amber} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="VaR99.9" fill={T.red} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: 360, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr><th style={th}>Scenario</th><th style={th}>CO2 $/t</th><th style={th}>GDP %</th><th style={th}>EL $M</th><th style={th}>Δ vs base</th><th style={th}>VaR99.9</th></tr>
                      </thead>
                      <tbody>
                        {overlay.data.scenarios.map((s) => (
                          <tr key={s.scenario}>
                            <td style={{ ...td, fontWeight: 600, color: SCENARIO_COLOR[s.scenario] || T.navy }}>{s.scenario_name || s.scenario}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.carbon_price_usd_t, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.gdp_impact_pct, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(s.el_m, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: s.el_delta_vs_base_m > 0 ? T.red : T.green }}>{s.el_delta_vs_base_m >= 0 ? '+' : ''}{fmtNum(s.el_delta_vs_base_m, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.var999_m, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{overlay.data.methodology}</div>
                  </div>
                </div>
                {/* Sector multiplier mapping table (shown in-UI, labeled) */}
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                    Sector PD multipliers by scenario (documented mapping — LABELED MODEL ASSUMPTION: 1 + β_cp×CO2/100 + β_gdp×max(0,−GDP), clip [{overlay.data.sensitivity_table.clip[0]}, {overlay.data.sensitivity_table.clip[1]}])
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>Sector (β_cp / β_gdp)</th>
                        {overlay.data.scenarios.map((s) => <th style={th} key={s.scenario}>{(s.scenario_name || s.scenario).split(' ').slice(0, 2).join(' ')}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(overlay.data.sensitivity_table.per_sector).map((sec) => (
                        <tr key={sec}>
                          <td style={{ ...td, fontWeight: 600, color: SECTOR_COLOR[sec] || T.navy }}>
                            {sec} ({overlay.data.sensitivity_table.per_sector[sec].beta_cp} / {overlay.data.sensitivity_table.per_sector[sec].beta_gdp})
                          </td>
                          {overlay.data.scenarios.map((s) => {
                            const m = s.sector_pd_multipliers[sec];
                            return <td key={s.scenario} style={{ ...td, fontFamily: T.mono, fontWeight: m > 1.3 ? 700 : 400, color: m > 1.3 ? T.red : m < 1 ? T.green : T.slate }}>×{fmtNum(m, 2)}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{overlay.data.sensitivity_table.basis}</div>
                </div>
              </>
            )}
          </div>

          {/* ── Repricing gap vs live OAS ─────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={secH}>Repricing Gap / Pricing Alpha — Book Coupons vs Current Rating-Bucket OAS</h2>
              <span style={chip}>GET /api/v1/fred-spreads/series (ICE BofA OAS)</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={fred.status} demoText={fred.error} /></div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              Book spread = coupon − base rate ({fmtPct(parseFloat(baseRatePct), 2)}, user input). Market spread = latest ICE BofA OAS for the
              position's letter bucket (BBB / BB / B; in demo-seed mode single HY buckets fall back to the seeded HY aggregate, marked "proxy").
              Positive gap = alpha: the book earns spread above the rating-implied public level (illiquidity premium + selection);
              negative = repricing risk on refinancing. Public corporate OAS is an imperfect proxy for private infra-debt — stated model assumption.
            </div>
            {repricing ? (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 1.4, minWidth: 340 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={repricing.rows.filter((r) => r.gapBps != null).map((r) => ({ name: r.name.length > 22 ? `${r.name.slice(0, 21)}…` : r.name, gap: Number(r.gapBps.toFixed(0)), letter: r.letter }))} margin={{ bottom: 52 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 8.5 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [fmtBps(v), 'Book spread − market OAS (alpha)']} />
                      <ReferenceLine y={0} stroke={T.slate} />
                      <Bar dataKey="gap" radius={[3, 3, 0, 0]}>
                        {repricing.rows.filter((r) => r.gapBps != null).map((r, i) => <Cell key={i} fill={r.gapBps >= 0 ? T.green : T.red} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
                    Notional-weighted book alpha: <b style={{ fontFamily: T.mono, color: repricing.wGap >= 0 ? T.green : T.red }}>{fmtBps(repricing.wGap)}</b>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr><th style={th}>Bucket</th><th style={th}>ICE BofA OAS</th><th style={th}>As of</th><th style={th}>Series</th></tr>
                    </thead>
                    <tbody>
                      {Object.keys(BUCKET_SERIES).map((bk) => {
                        const m = fred.byBucket ? fred.byBucket[bk] : null;
                        return (
                          <tr key={bk}>
                            <td style={{ ...td, fontWeight: 700, color: LETTER_COLOR[bk] }}>{bk}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{m ? fmtBps(m.oasPp * 100) : '—'}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{m ? m.asOf : '—'}</td>
                            <td style={{ ...td, fontSize: 10.5 }}>{m ? (m.proxy ? `${m.proxy} proxy` : BUCKET_SERIES[bk]) : 'unavailable'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.sub }}>Spread engine unreachable — no repricing figures shown (this page never fabricates market data). {fred.error ? `Error: ${String(fred.error)}` : ''}</div>
            )}
          </div>
        </>
      )}

      {/* ── Methodology: displayed reference tables ─────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={secH}>Methodology — Reference Tables (hand-authored, approximate)</h2>
          <span style={noteTag}>Approximate — hand-authored to be consistent with Moody's / S&amp;P project-finance default studies; replace with licensed study data for production</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.2, minWidth: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Cumulative PD table (%, by rating × tenor) — linear interpolation between tenors (same table drives the backend engine)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={th}>Rating</th>{PD_TENORS.map((t) => <th style={th} key={t}>{t}y</th>)}</tr>
              </thead>
              <tbody>
                {Object.keys(PD_TABLE).map((r) => (
                  <tr key={r}>
                    <td style={{ ...td, fontWeight: 700 }}>{r}</td>
                    {PD_TABLE[r].map((v, i) => <td style={{ ...td, fontFamily: T.mono }} key={i}>{v.toFixed(2)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1.2, minWidth: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>1-yr migration matrix (%, letter-level, PF-flavored) — rows sum to 100</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={th}>From \ To</th>{MIG_STATES.map((s) => <th style={th} key={s}>{s === 'A_or_above' ? 'A+↑' : s}</th>)}</tr>
              </thead>
              <tbody>
                {Object.keys(MIG_MATRIX).map((r) => (
                  <tr key={r}>
                    <td style={{ ...td, fontWeight: 700 }}>{r}</td>
                    {MIG_STATES.map((s) => <td style={{ ...td, fontFamily: T.mono }} key={s}>{MIG_MATRIX[r][s].toFixed(1)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Migration-stressed EL = Σ p(state) × PD_state(h) × LGD × EAD, with p(D) × LGD × EAD for default;
              "A+↑" uses 0.5 × PD(BBB+) (stated approximation). Stylized 1-yr-forward measure.
            </div>
          </div>
          <div style={{ flex: 0.9, minWidth: 260 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Sector → transition score mapping (stated model assumption)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Sector</th><th style={th}>Score /100</th></tr></thead>
              <tbody>
                {SECTORS.map((s) => (
                  <tr key={s}>
                    <td style={{ ...td, fontWeight: 600, color: SECTOR_COLOR[s] }}>{s}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{SECTOR_TRANSITION[s]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Climate overlay: stressed PD = PD × (1 + score/100 × (multiplier − 1)).
              At ×{Number(climateMult).toFixed(2)}, an airport (68) sees PD scaled ×{(1 + (68 / 100) * (climateMult - 1)).toFixed(2)};
              solar (12) ×{(1 + (12 / 100) * (climateMult - 1)).toFixed(2)}.
              The NGFS overlay above replaces this single multiplier with scenario-specific sector multipliers
              derived from the seeded NGFS carbon price + GDP paths (engine table /api/v1/infra-portfolio/ref/mappings).
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Live data: api/v1/routes/fred_spreads.py (real ICE BofA OAS via FRED, Live/Demo) · api/v1/routes/ngfs_scenarios_extract.py
        (NGFS Phase 5 seeded extract, IIASA CC BY 4.0). Book engine: api/v1/routes/infra_portfolio_analytics.py — cash-flow
        ladder + reinvestment horizon return, analytic one-factor Vasicek/ASRF credit VaR (Acklam inverse normal, documented),
        HHI concentration + granularity note, pricing alpha vs live OAS, PCAF-proxy financed emissions + OLS, NGFS ×6 scenario
        overlay. Quick-view analytics (duration, EL, migration, climate multiplier, repricing gap) computed in-page with the
        documented closed-form math. Adjacent module: /infrastructure-debt-utility-bonds — this page is the multi-asset book view.
      </div>
    </div>
  );
}
