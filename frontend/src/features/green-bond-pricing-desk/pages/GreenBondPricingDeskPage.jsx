import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, ReferenceLine, ComposedChart, Scatter,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Green Bond Pricing Desk (NX2-04) — PRIMARY ISSUANCE workbench
// Comp curve:  GET  /api/v1/fred-spreads/series  (real ICE BofA rating-bucket OAS
//              via FRED; key-gated → labeled seeded sample, Live/Demo badge)
// Curve math:  POST /api/v1/green-bond-analytics/curve-spreads   (par bootstrap,
//              G/I/Z-spread by bisection with round-trip check, ASW proxy)
// Rel value:   POST /api/v1/green-bond-analytics/relative-value  (comp OLS,
//              green-dummy regression, matched-pair greenium, cheap/dear)
// Dual FX:     POST /api/v1/green-bond-analytics/dual-tranche    (EUR vs USD,
//              user cross-currency basis, stated sign convention)
// EuGB test:   POST /api/v1/eu-gbs/assess-issuance (Regulation 2023/2631 engine,
//              85/15 flexibility-pocket test — Live/Demo badge)
// Greenium:    hand-authored indicative reference table (labeled, editable input)
// Book build:  IPT → guidance → launch simulation + order-book composition,
//              drop-out sensitivity and allocation optimizer under STATED desk
//              conventions — all frontend display math, every parameter editable.
// UoP impact:  ICMA/CBI harmonized-category impact intensities (hand-authored
//              defaults, labeled) → avoided tCO2e, impact yield, taxonomy roll-up.
// Secondary-portfolio analytics live in green-bond-portfolio-analytics; this
// page is the primary/new-issue desk.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// Rating bucket → real ICE BofA OAS series on FRED (see backend catalog)
const RATING_BUCKETS = [
  { bucket: 'AAA', id: 'BAMLC0A1CAAA', grade: 'IG' },
  { bucket: 'AA', id: 'BAMLC0A2CAA', grade: 'IG' },
  { bucket: 'A', id: 'BAMLC0A3CA', grade: 'IG' },
  { bucket: 'BBB', id: 'BAMLC0A4CBBB', grade: 'IG' },
  { bucket: 'BB', id: 'BAMLH0A1HYBB', grade: 'HY' },
  { bucket: 'B', id: 'BAMLH0A2HYB', grade: 'HY' },
  { bucket: 'CCC', id: 'BAMLH0A3HYC', grade: 'HY' },
];
const ALL_IDS = RATING_BUCKETS.map((r) => r.id).join(',');

const SECTORS = [
  { key: 'utilities', label: 'Utilities / Power' },
  { key: 'financials', label: 'Banks & Financials' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'industrials', label: 'Industrials' },
  { key: 'energy', label: 'Energy (O&G / midstream)' },
  { key: 'autos', label: 'Automotive' },
  { key: 'tmt', label: 'Tech / TMT' },
  { key: 'sovereign_ssa', label: 'Sovereign / SSA' },
];

// ── Hand-authored greenium reference table ──────────────────────────────────
// LABEL (shown in UI): indicative greenium ranges by sector/rating from
// published market studies (e.g. CBI pricing reports) — approximate, refresh
// for production. Negative bp = green bond prices TIGHTER than conventional.
const GREENIUM_TABLE = [
  { sector: 'utilities', IG: [-6, -2], HY: [-8, -1] },
  { sector: 'financials', IG: [-4, -1], HY: [-5, 0] },
  { sector: 'real_estate', IG: [-4, -1], HY: [-6, 0] },
  { sector: 'industrials', IG: [-3, -1], HY: [-5, 0] },
  { sector: 'energy', IG: [-3, 0], HY: [-4, 0] },
  { sector: 'autos', IG: [-4, -1], HY: [-5, 0] },
  { sector: 'tmt', IG: [-3, 0], HY: [-4, 0] },
  { sector: 'sovereign_ssa', IG: [-4, -1], HY: [-4, -1] },
];
const greeniumRange = (sectorKey, grade) => {
  const row = GREENIUM_TABLE.find((r) => r.sector === sectorKey);
  return row ? row[grade] : [-3, 0];
};

// ICMA GBP use-of-proceeds categories → EU Taxonomy objective codes (mapping
// is a stated convention for pre-filling the EuGB payload; editable below).
const UOP_CATEGORIES = [
  { key: 'renewable_energy', label: 'Renewable energy', obj: 'CCM' },
  { key: 'energy_efficiency', label: 'Energy efficiency', obj: 'CCM' },
  { key: 'clean_transport', label: 'Clean transportation', obj: 'CCM' },
  { key: 'green_buildings', label: 'Green buildings', obj: 'CCM' },
  { key: 'water', label: 'Sustainable water & wastewater', obj: 'WMR' },
  { key: 'pollution', label: 'Pollution prevention & control', obj: 'PPE' },
  { key: 'circular', label: 'Circular-economy products', obj: 'CE' },
  { key: 'biodiversity', label: 'Terrestrial & aquatic biodiversity', obj: 'BIO' },
  { key: 'adaptation', label: 'Climate change adaptation', obj: 'CCA' },
  { key: 'land_use', label: 'Sustainable land use & natural resources', obj: 'BIO' },
];

// ── Hand-authored impact-intensity defaults per ICMA/CBI harmonized category ─
// LABEL (shown in UI): indicative ex-ante avoided-emissions factors
// (tCO2e avoided per €M allocated PER YEAR) distilled from published harmonized
// impact reports (ICMA Harmonised Framework for Impact Reporting metrics; CBI /
// NIB / EIB / KfW impact-report ranges). EDITABLE planning defaults, NOT project
// data — replace with project-level ex-ante estimates for a real framework.
const UOP_IMPACT_DEFAULTS = {
  renewable_energy: { factor: 650, tax: 100 },
  energy_efficiency: { factor: 420, tax: 95 },
  clean_transport: { factor: 380, tax: 95 },
  green_buildings: { factor: 250, tax: 85 },
  water: { factor: 120, tax: 90 },
  pollution: { factor: 180, tax: 85 },
  circular: { factor: 150, tax: 75 },
  biodiversity: { factor: 40, tax: 70 },
  adaptation: { factor: 30, tax: 80 },
  land_use: { factor: 90, tax: 70 },
};

// ICMA Harmonised Framework — allocation-report core fields (checklist)
const ALLOC_CHECKLIST = [
  'Total amount of proceeds allocated, by ICMA GBP category',
  'Share of financing vs refinancing (look-back period disclosed)',
  'Balance of unallocated proceeds and temporary-investment policy',
  'Portfolio-basis allocation methodology (if not bond-by-bond)',
  'External review / auditor attestation of the allocation report',
  'Geographic / project-level breakdown (subject to confidentiality)',
  'Expected vs actual full-allocation timeline',
];

const fmtBp = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)} bp`;
const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;
const num = (v, fb = 0) => { const x = parseFloat(v); return isNaN(x) ? fb : x; };

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
const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18, ...style }}>{children}</div>
);
const Lbl = ({ children }) => (
  <label style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>{children}</label>
);
const RunBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
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

// Compact editable curve-point editor (tenor / rate rows) — reused by the curve
// analytics panel and both dual-tranche legs. Values are EDITABLE PLACEHOLDER
// levels, not market data (labels below each panel).
const CurveEditor = ({ title, pts, setPts, rateLabel }) => {
  const upd = (id, key, v) => setPts((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: v } : p)));
  const add = () => setPts((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1, t: 15, r: 3.0 }]);
  const rm = (id) => setPts((prev) => prev.filter((p) => p.id !== id));
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, background: T.cream, minWidth: 210 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, marginBottom: 6 }}>{title}</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>Tenor (y)</th><th style={th}>{rateLabel}</th><th style={{ ...th, width: 28 }} /></tr></thead>
        <tbody>
          {pts.map((p) => (
            <tr key={p.id}>
              <td style={{ ...td, padding: '3px 6px' }}><input type="number" step="0.5" style={{ ...inputStyle, width: 62, padding: '4px 6px' }} value={p.t} onChange={(e) => upd(p.id, 't', e.target.value)} /></td>
              <td style={{ ...td, padding: '3px 6px' }}><input type="number" step="0.01" style={{ ...inputStyle, width: 74, padding: '4px 6px' }} value={p.r} onChange={(e) => upd(p.id, 'r', e.target.value)} /></td>
              <td style={{ ...td, padding: '3px 6px' }}><button onClick={() => rm(p.id)} style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 11 }}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={add} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 6, color: T.navy, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '4px 10px', marginTop: 6 }}>+ point</button>
    </div>
  );
};

const curvePayload = (pts, key) => pts
  .map((p) => ({ tenor_y: num(p.t), [key]: num(p.r) }))
  .filter((p) => p.tenor_y > 0);

export default function GreenBondPricingDeskPage() {
  // ── Issuer / deal inputs ───────────────────────────────────────────────────
  const [issuerName, setIssuerName] = useState('Verdant Grid Utilities plc');
  const [rating, setRating] = useState('BBB');
  const [sector, setSector] = useState('utilities');
  const [tenorY, setTenorY] = useState(10);
  const [sizeMn, setSizeMn] = useState(500);
  const [currency, setCurrency] = useState('EUR');
  const [uop, setUop] = useState({ renewable_energy: true, energy_efficiency: true, green_buildings: false });

  // ── FRED comp curve ────────────────────────────────────────────────────────
  const [fred, setFred] = useState({ status: 'loading', mode: null, series: null, error: null });
  useEffect(() => {
    let alive = true;
    axios.get(`/api/v1/fred-spreads/series?ids=${ALL_IDS}`, { timeout: 25000 })
      .then(({ data }) => { if (alive) setFred({ status: data.mode === 'live' ? 'live' : 'demo', mode: data.mode, series: data.series, error: data.mode === 'live' ? null : 'seeded real historical sample (no FRED_API_KEY)' }); })
      .catch((e) => { if (alive) setFred({ status: 'demo', mode: null, series: null, error: e?.response?.data?.detail || e.message }); });
    return () => { alive = false; };
  }, []);

  // Latest OAS (bp) per rating bucket, from the live/seeded series
  const curve = useMemo(() => {
    if (!fred.series) return null;
    const byId = Object.fromEntries(fred.series.map((s) => [s.id, s]));
    return RATING_BUCKETS.map((rb) => {
      const s = byId[rb.id];
      const obs = s?.observations || [];
      const last = obs.length ? obs[obs.length - 1] : null;
      return { ...rb, oasBp: last ? last.value * 100 : null, asOf: last?.date || null, history: obs };
    });
  }, [fred.series]);

  const grade = RATING_BUCKETS.find((r) => r.bucket === rating)?.grade || 'IG';
  const compRow = curve?.find((c) => c.bucket === rating) || null;
  const compOasBp = compRow?.oasBp ?? null;

  // ── Greenium input (bp adjustment, negative = tighter) ────────────────────
  const [gRange, setGRange] = useState(greeniumRange('utilities', 'IG'));
  const [greeniumBp, setGreeniumBp] = useState(-4);
  useEffect(() => {
    const rg = greeniumRange(sector, grade);
    setGRange(rg);
    setGreeniumBp(Math.round((rg[0] + rg[1]) / 2));
  }, [sector, grade]);

  // ── Pricing build: IPT → guidance → launch (stated convention) ────────────
  const [baseRatePct, setBaseRatePct] = useState(4.25);
  const [iptSpreadBp, setIptSpreadBp] = useState(null);       // null = auto (comp + greenium + 15)
  const [bookMult, setBookMult] = useState(3.0);
  const [bpPerTurn, setBpPerTurn] = useState(2.5);            // bp tightening per 1x oversubscription above 1x
  const [tightenCapBp, setTightenCapBp] = useState(20);

  const fairValueBp = compOasBp != null ? compOasBp + greeniumBp : null; // greenium-adjusted secondary fair value
  const autoIpt = fairValueBp != null ? Math.round(fairValueBp + 15) : null; // convention: IPT ≈ fair value + 15bp starting cushion
  const ipt = iptSpreadBp != null && iptSpreadBp !== '' ? parseFloat(iptSpreadBp) : autoIpt;

  const pricing = useMemo(() => {
    if (ipt == null || fairValueBp == null) return null;
    const tightening = Math.min(tightenCapBp, Math.max(0, (bookMult - 1) * bpPerTurn));
    const guidance = ipt - tightening / 2;
    const finalSpread = ipt - tightening;
    const nip = finalSpread - fairValueBp;
    const coupon = baseRatePct + finalSpread / 100;
    const buildCurve = [];
    for (let m = 1; m <= 10; m += 0.5) {
      const t = Math.min(tightenCapBp, Math.max(0, (m - 1) * bpPerTurn));
      buildCurve.push({ mult: m, finalSpread: +(ipt - t).toFixed(1) });
    }
    return { tightening, guidance, finalSpread, nip, coupon, buildCurve };
  }, [ipt, fairValueBp, bookMult, bpPerTurn, tightenCapBp, baseRatePct]);

  const stageData = pricing ? [
    { stage: 'IPT', spread: +ipt.toFixed(1) },
    { stage: 'Guidance', spread: +pricing.guidance.toFixed(1) },
    { stage: 'Launch / final', spread: +pricing.finalSpread.toFixed(1) },
    { stage: 'Fair value (comp + greenium)', spread: +fairValueBp.toFixed(1) },
  ] : [];

  // ── Curve analytics (backend: /green-bond-analytics/curve-spreads) ────────
  // Editable placeholder curve levels (NOT market data — user inputs).
  const [benchPts, setBenchPts] = useState([
    { id: 1, t: 1, r: 2.20 }, { id: 2, t: 2, r: 2.15 }, { id: 3, t: 5, r: 2.30 },
    { id: 4, t: 7, r: 2.42 }, { id: 5, t: 10, r: 2.55 }, { id: 6, t: 30, r: 2.85 },
  ]);
  const [swapPts, setSwapPts] = useState([
    { id: 1, t: 1, r: 2.55 }, { id: 2, t: 2, r: 2.48 }, { id: 3, t: 5, r: 2.60 },
    { id: 4, t: 7, r: 2.72 }, { id: 5, t: 10, r: 2.85 }, { id: 6, t: 30, r: 3.05 },
  ]);
  const [caCoupon, setCaCoupon] = useState(3.125);
  const [caMat, setCaMat] = useState(10);
  const [caPrice, setCaPrice] = useState(98.75);
  const [ca, setCa] = useState({ status: 'idle', data: null, error: null });

  const runCurve = useCallback(async () => {
    setCa({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/green-bond-analytics/curve-spreads', {
        benchmark_curve: curvePayload(benchPts, 'par_rate_pct'),
        swap_curve: curvePayload(swapPts, 'rate_pct'),
        bond: { coupon_pct: num(caCoupon), maturity_y: num(caMat), price_per_100: num(caPrice, 100) },
      }, { timeout: 20000 });
      setCa({ status: 'live', data, error: null });
    } catch (e) { setCa({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [benchPts, swapPts, caCoupon, caMat, caPrice]);

  const curveChart = useMemo(() => {
    if (!ca.data) return null;
    const grid = ca.data.curve.zero_grid.map((g) => ({ tenor: g.tenor_y, zero: g.zero_pct }));
    const pillars = ca.data.curve.zero_pillars.map((p) => ({ tenor: p.tenor_y, par: p.par_rate_pct, zeroPillar: p.zero_pct }));
    return { grid, pillars };
  }, [ca.data]);

  // ── Relative value (backend: /green-bond-analytics/relative-value) ────────
  // Comp names are EDITABLE PLACEHOLDERS — replace with the live comp set.
  const [comps, setComps] = useState([
    { id: 1, name: 'Utility A 3.0% 2031 (green)', tenor: 5.2, spread: 78, green: true },
    { id: 2, name: 'Utility B 3.375% 2033 (green)', tenor: 7.1, spread: 95, green: true },
    { id: 3, name: 'Utility C 3.25% 2036 (green)', tenor: 9.8, spread: 112, green: true },
    { id: 4, name: 'Utility D 3.5% 2030', tenor: 4.6, spread: 84, green: false },
    { id: 5, name: 'Utility E 3.6% 2034', tenor: 8.0, spread: 106, green: false },
    { id: 6, name: 'Grid Co F 3.75% 2035', tenor: 9.2, spread: 121, green: false },
    { id: 7, name: 'Gen Co G 4.0% 2040', tenor: 14.1, spread: 142, green: false },
  ]);
  const [niTenor, setNiTenor] = useState('');
  const [niSpread, setNiSpread] = useState('');
  const [pairTol, setPairTol] = useState(2.0);
  const [rv, setRv] = useState({ status: 'idle', data: null, error: null });
  const updComp = (id, key, v) => setComps((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: v } : c)));
  const addComp = () => setComps((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1, name: 'New comp', tenor: 7, spread: 100, green: false }]);
  const rmComp = (id) => setComps((prev) => prev.filter((c) => c.id !== id));

  const effNiTenor = niTenor !== '' ? num(niTenor) : num(tenorY, 10);
  const effNiSpread = niSpread !== '' ? num(niSpread) : (pricing ? pricing.finalSpread : null);

  const runRv = useCallback(async () => {
    setRv({ status: 'loading', data: null, error: null });
    try {
      if (effNiSpread == null) throw new Error('no new-issue spread — wait for the comp curve or type an override');
      const { data } = await axios.post('/api/v1/green-bond-analytics/relative-value', {
        comps: comps.map((c) => ({ name: c.name || 'comp', tenor_y: num(c.tenor, 1), spread_bp: num(c.spread), green: !!c.green })),
        new_issue_tenor_y: effNiTenor,
        new_issue_spread_bp: effNiSpread,
        pair_tenor_tolerance_y: num(pairTol, 2),
      }, { timeout: 20000 });
      setRv({ status: 'live', data, error: null });
    } catch (e) { setRv({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [comps, effNiTenor, effNiSpread, pairTol]);

  const rvChart = useMemo(() => {
    if (!rv.data) return null;
    const o = rv.data.ols;
    const ts = [...rv.data.comps.map((c) => c.tenor_y), rv.data.new_issue.tenor_y];
    const tMax = Math.max(...ts) * 1.1;
    const line = [];
    for (let t = 0; t <= tMax + 1e-9; t += tMax / 24) line.push({ tenor: +t.toFixed(2), fit: +(o.alpha_bp + o.beta_bp_per_y * t).toFixed(2) });
    return {
      line,
      greens: rv.data.comps.filter((c) => c.green).map((c) => ({ tenor: c.tenor_y, spread: c.spread_bp, name: c.name })),
      convs: rv.data.comps.filter((c) => !c.green).map((c) => ({ tenor: c.tenor_y, spread: c.spread_bp, name: c.name })),
      ni: [{ tenor: rv.data.new_issue.tenor_y, spread: rv.data.new_issue.spread_bp, name: 'NEW ISSUE' }],
    };
  }, [rv.data]);

  // ── Order book composition & allocation optimizer (frontend desk math) ────
  const [bookDist, setBookDist] = useState([
    { id: 1, type: 'Asset managers', pct: 46, tier: 1.0 },
    { id: 2, type: 'Insurance & pension', pct: 22, tier: 1.3 },
    { id: 3, type: 'Central banks / official inst.', pct: 8, tier: 1.5 },
    { id: 4, type: 'Banks & private banks', pct: 14, tier: 0.8 },
    { id: 5, type: 'Hedge funds', pct: 10, tier: 0.4 },
  ]);
  const [dropPerBp, setDropPerBp] = useState(1.5); // % of peak book lost per bp tightened (stated linear convention)
  const updBook = (id, key, v) => setBookDist((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: v } : r)));

  const book = useMemo(() => {
    const size = num(sizeMn);
    if (!pricing || size <= 0) return null;
    const peakBook = bookMult * size;                                   // mn at IPT
    const drop = num(dropPerBp);
    const survive = (tBp) => Math.max(0, 1 - (drop * tBp) / 100);       // stated linear drop-out
    const finalBook = peakBook * survive(pricing.tightening);
    const cover = finalBook / size;
    const rows = bookDist.map((r) => ({ ...r, pctN: Math.max(num(r.pct), 0), w: Math.max(num(r.tier), 0) }));
    const totPct = rows.reduce((s, r) => s + r.pctN, 0) || 1;
    const demand = rows.map((r) => (finalBook * r.pctN) / totPct);
    // Pro-rata: every account gets the same fill rate = size / finalBook (capped at 100%)
    const fillPro = finalBook > 0 ? Math.min(1, size / finalBook) : 0;
    const proRata = demand.map((dm) => dm * fillPro);
    // Preferred tiering: weight demand by tier, cap at demand, redistribute to
    // uncapped accounts (documented iterative waterfall, ≤6 passes)
    const alloc = new Array(rows.length).fill(0);
    let remaining = Math.min(size, finalBook);
    let active = rows.map((_, i) => i);
    for (let it = 0; it < 6 && remaining > 1e-9 && active.length; it++) {
      const wsum = active.reduce((s, i) => s + rows[i].pctN * rows[i].w, 0);
      if (wsum <= 0) break;
      const next = [];
      let placed = 0;
      for (const i of active) {
        const share = (remaining * rows[i].pctN * rows[i].w) / wsum;
        const room = demand[i] - alloc[i];
        const take = Math.min(share, room);
        alloc[i] += take; placed += take;
        if (alloc[i] < demand[i] - 1e-9) next.push(i);
      }
      remaining -= placed;
      active = next;
    }
    const table = rows.map((r, i) => ({
      type: r.type, pct: r.pctN, demand: demand[i],
      proRata: proRata[i], tiered: alloc[i],
      fillPro: demand[i] > 0 ? (proRata[i] / demand[i]) * 100 : 0,
      fillTier: demand[i] > 0 ? (alloc[i] / demand[i]) * 100 : 0,
    }));
    const dyn = [];
    for (let t = 0; t <= Math.max(num(tightenCapBp), 1); t += 1) {
      dyn.push({ tighten: t, cover: +((peakBook * survive(t)) / size).toFixed(2) });
    }
    return { peakBook, finalBook, cover, table, dyn, undersubscribed: finalBook < size };
  }, [pricing, bookMult, sizeMn, bookDist, dropPerBp, tightenCapBp]);

  // ── EuGB 85/15 panel (live engine) ─────────────────────────────────────────
  const [taxonomyPct, setTaxonomyPct] = useState(80);
  const [pocketPct, setPocketPct] = useState(12);
  const [pocketOk, setPocketOk] = useState(true);
  const [dnsh, setDnsh] = useState(true);
  const [safeguards, setSafeguards] = useState(true);
  const [hasEr, setHasEr] = useState(true);
  const [erName, setErName] = useState('Sustainalytics (ESMA-registered)');
  const [preReview, setPreReview] = useState(true);
  const [refiPct, setRefiPct] = useState(20);
  const [eugb, setEugb] = useState({ status: 'idle', data: null, error: null });

  const runEugb = useCallback(async () => {
    setEugb({ status: 'loading', data: null, error: null });
    const objectives = [...new Set(UOP_CATEGORIES.filter((c) => uop[c.key]).map((c) => c.obj))];
    try {
      const { data } = await axios.post('/api/v1/eu-gbs/assess-issuance', {
        bond_id: `GBPD-${Date.now()}`,
        issuer_name: issuerName,
        bond_type: sector === 'sovereign_ssa' ? 'sovereign' : 'senior_unsecured',
        principal_amount: Math.max(1, parseFloat(sizeMn) || 1) * 1e6,
        currency,
        taxonomy_alignment_pct: parseFloat(taxonomyPct) || 0,
        flexibility_pocket_pct: parseFloat(pocketPct) || 0,
        flexibility_pocket_conditions_met: pocketOk,
        dnsh_confirmed: dnsh,
        min_safeguards_confirmed: safeguards,
        environmental_objectives: objectives.length ? objectives : ['CCM'],
        has_external_reviewer: hasEr,
        er_name: hasEr ? erName : '',
        has_pre_issuance_review: preReview,
        refinancing_share_pct: parseFloat(refiPct) || 0,
        is_sovereign: sector === 'sovereign_ssa',
      }, { timeout: 20000 });
      setEugb({ status: 'live', data, error: null });
    } catch (e) {
      setEugb({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [issuerName, sector, sizeMn, currency, taxonomyPct, pocketPct, pocketOk, dnsh, safeguards, uop, hasEr, erName, preReview, refiPct]);

  // ── Use-of-proceeds impact analytics (sustainability × financial core) ────
  const [uopRows, setUopRows] = useState([]);
  useEffect(() => {
    setUopRows((prev) => {
      const sel = UOP_CATEGORIES.filter((c) => uop[c.key]);
      const n = sel.length || 1;
      const even = +(num(sizeMn) / n).toFixed(1);
      return sel.map((c) => {
        const ex = prev.find((r) => r.key === c.key);
        const dflt = UOP_IMPACT_DEFAULTS[c.key] || { factor: 100, tax: 80 };
        return ex || { key: c.key, alloc: even, factor: dflt.factor, tax: dflt.tax };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uop]);
  const updUopRow = (key, field, v) => setUopRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: v } : r)));

  const impact = useMemo(() => {
    const rows = uopRows.map((r) => {
      const alloc = num(r.alloc);
      const factor = num(r.factor);
      const tax = num(r.tax);
      return {
        ...r, allocN: alloc, factorN: factor, taxN: tax,
        co2: alloc * factor,                       // tCO2e avoided / yr
        label: UOP_CATEGORIES.find((c) => c.key === r.key)?.label || r.key,
      };
    });
    const allocTot = rows.reduce((s, r) => s + r.allocN, 0);
    const co2Tot = rows.reduce((s, r) => s + r.co2, 0);
    const size = num(sizeMn);
    const intensity = allocTot > 0 ? co2Tot / allocTot : null;                 // tCO2e / yr / €M
    const couponPctEff = pricing ? pricing.coupon : null;
    const couponCash = couponPctEff != null ? size * 1e6 * (couponPctEff / 100) : null; // annual coupon (currency units)
    const perCoupon1k = couponCash > 0 ? co2Tot / (couponCash / 1000) : null;  // tCO2e per 1,000 of annual coupon
    // Impact yield (documented): annual tCO2e avoided per bp of greenium GIVEN UP
    // by investors (only defined when greenium < 0, i.e. the label priced tighter).
    const impactYield = greeniumBp < 0 ? co2Tot / Math.abs(greeniumBp) : null;
    const taxRollup = allocTot > 0 ? rows.reduce((s, r) => s + r.allocN * r.taxN, 0) / allocTot : null;
    return { rows, allocTot, co2Tot, intensity, couponCash, perCoupon1k, impactYield, taxRollup, unalloc: size - allocTot };
  }, [uopRows, sizeMn, pricing, greeniumBp]);

  // ── Dual-tranche EUR/USD (backend: /green-bond-analytics/dual-tranche) ────
  const [eurBench, setEurBench] = useState([
    { id: 1, t: 1, r: 2.20 }, { id: 2, t: 2, r: 2.15 }, { id: 3, t: 5, r: 2.30 },
    { id: 4, t: 10, r: 2.55 }, { id: 5, t: 30, r: 2.85 },
  ]);
  const [eurSwap, setEurSwap] = useState([
    { id: 1, t: 1, r: 2.55 }, { id: 2, t: 2, r: 2.48 }, { id: 3, t: 5, r: 2.60 },
    { id: 4, t: 10, r: 2.85 }, { id: 5, t: 30, r: 3.05 },
  ]);
  const [usdBench, setUsdBench] = useState([
    { id: 1, t: 1, r: 4.10 }, { id: 2, t: 2, r: 3.95 }, { id: 3, t: 5, r: 3.90 },
    { id: 4, t: 10, r: 4.05 }, { id: 5, t: 30, r: 4.35 },
  ]);
  const [usdSwap, setUsdSwap] = useState([
    { id: 1, t: 1, r: 4.15 }, { id: 2, t: 2, r: 3.90 }, { id: 3, t: 5, r: 3.80 },
    { id: 4, t: 10, r: 3.92 }, { id: 5, t: 30, r: 4.05 },
  ]);
  const [dtEur, setDtEur] = useState({ coupon: 3.125, mat: 10, price: 98.75 });
  const [dtUsd, setDtUsd] = useState({ coupon: 5.125, mat: 10, price: 98.60 });
  const [xccyBp, setXccyBp] = useState(-18);
  const [dt, setDt] = useState({ status: 'idle', data: null, error: null });

  const runDual = useCallback(async () => {
    setDt({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/green-bond-analytics/dual-tranche', {
        eur_leg: {
          label: `${issuerName} EUR tranche`, currency: 'EUR',
          bond: { coupon_pct: num(dtEur.coupon), maturity_y: num(dtEur.mat), price_per_100: num(dtEur.price, 100) },
          benchmark_curve: curvePayload(eurBench, 'par_rate_pct'), swap_curve: curvePayload(eurSwap, 'rate_pct'),
        },
        usd_leg: {
          label: `${issuerName} USD tranche`, currency: 'USD',
          bond: { coupon_pct: num(dtUsd.coupon), maturity_y: num(dtUsd.mat), price_per_100: num(dtUsd.price, 100) },
          benchmark_curve: curvePayload(usdBench, 'par_rate_pct'), swap_curve: curvePayload(usdSwap, 'rate_pct'),
        },
        xccy_basis_bp: num(xccyBp),
      }, { timeout: 25000 });
      setDt({ status: 'live', data, error: null });
    } catch (e) { setDt({ status: 'demo', data: null, error: apiErr(e) }); }
  }, [issuerName, dtEur, dtUsd, eurBench, eurSwap, usdBench, usdSwap, xccyBp]);

  // ── Post-issuance spread performance (user-entered secondary levels) ──────
  const [perfRows, setPerfRows] = useState([
    { id: 1, label: 'Break (T+1)', issueBp: '', compBp: '' },
    { id: 2, label: '+1 week', issueBp: '', compBp: '' },
    { id: 3, label: '+1 month', issueBp: '', compBp: '' },
    { id: 4, label: '+3 months', issueBp: '', compBp: '' },
  ]);
  const updPerf = (id, key, v) => setPerfRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: v } : r)));
  const addPerf = () => setPerfRows((prev) => [...prev, { id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1, label: 'New obs', issueBp: '', compBp: '' }]);
  const rmPerf = (id) => setPerfRows((prev) => prev.filter((r) => r.id !== id));
  const perfCalc = perfRows.map((r) => {
    const ib = parseFloat(r.issueBp); const cb = parseFloat(r.compBp);
    const reoffer = pricing?.finalSpread;
    return {
      ...r,
      vsReoffer: !isNaN(ib) && reoffer != null ? ib - reoffer : null,   // negative = tightened (outperformed)
      vsComp: !isNaN(ib) && !isNaN(cb) ? ib - cb : null,                // realized greenium in secondary
    };
  });
  const perfChart = perfCalc.filter((r) => r.vsReoffer != null || r.vsComp != null)
    .map((r) => ({ label: r.label, 'Issue vs reoffer (bp)': r.vsReoffer, 'Issue vs comp (bp)': r.vsComp }));

  // Greenium-realization KPI: latest observed secondary greenium vs the at-issue input
  const realizedGreenium = useMemo(() => {
    const withComp = perfCalc.filter((r) => r.vsComp != null);
    return withComp.length ? withComp[withComp.length - 1].vsComp : null;
  }, [perfCalc]);

  const [allocChecks, setAllocChecks] = useState({});

  const selHistory = compRow?.history?.map((o) => ({ date: o.date, oasBp: +(o.value * 100).toFixed(1) })) || [];

  const spreadRows = ca.data ? [
    { metric: 'YTM', value: fmtPct(ca.data.ytm_pct, 3), note: 'bisection on the annual-coupon cashflows' },
    { metric: 'G-spread', value: fmtBp(ca.data.spreads_bp.g_spread), note: ca.data.conventions.g_spread },
    { metric: 'I-spread', value: fmtBp(ca.data.spreads_bp.i_spread), note: ca.data.conventions.i_spread },
    { metric: 'Z-spread', value: fmtBp(ca.data.spreads_bp.z_spread), note: 'bisection over the bootstrapped zero curve' },
    { metric: 'ASW (par-par proxy)', value: fmtBp(ca.data.spreads_bp.asw_proxy), note: ca.data.conventions.asw_proxy },
  ] : [];

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-04</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Green Bond Pricing Desk — Primary Issuance, Curve & Impact Analytics</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>FRED ICE BofA OAS</span>
          <span style={{ background: T.teal + '22', color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>G/I/Z/ASW Curve Engine</span>
          <span style={{ background: T.indigo + '22', color: T.indigo, border: `1px solid ${T.indigo}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Comp OLS RV</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>EuGB Reg 2023/2631</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>ICMA GBP UoP</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1120 }}>
        Primary-issuance workbench: conventional comp from the real rating-bucket OAS curve with a labeled greenium
        adjustment; full curve analytics (par-curve bootstrap, G/I/Z-spread and ASW proxy with a Z-spread round-trip check);
        comparable-bond relative value (OLS cheap/dear, tenor-controlled greenium regression, matched pairs); an
        IPT → guidance → launch book simulation with order-book composition, drop-out sensitivity and an allocation
        optimizer; use-of-proceeds impact analytics (avoided tCO2e per €M, impact yield per bp of greenium, taxonomy
        roll-up); the wired EuGB 85/15 test; an EUR/USD dual-tranche comparison; and post-issuance surveillance with a
        greenium-realization KPI, ICMA allocation-report checklist and an impact-report generator.
      </div>

      {/* ── Issuer & deal inputs ────────────────────────────────────────── */}
      <Card>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: T.navy }}>Issuer & Deal Setup</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div><Lbl>Issuer</Lbl><input style={inputStyle} value={issuerName} onChange={(e) => setIssuerName(e.target.value)} /></div>
          <div><Lbl>Rating bucket</Lbl>
            <select style={inputStyle} value={rating} onChange={(e) => setRating(e.target.value)}>
              {RATING_BUCKETS.map((r) => <option key={r.bucket} value={r.bucket}>{r.bucket} ({r.grade})</option>)}
            </select>
          </div>
          <div><Lbl>Sector</Lbl>
            <select style={inputStyle} value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div><Lbl>Tenor (yrs)</Lbl><input type="number" min="1" style={inputStyle} value={tenorY} onChange={(e) => setTenorY(e.target.value)} /></div>
          <div><Lbl>Size (mn)</Lbl><input type="number" min="1" style={inputStyle} value={sizeMn} onChange={(e) => setSizeMn(e.target.value)} /></div>
          <div><Lbl>Currency</Lbl>
            <select style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {['EUR', 'USD', 'GBP', 'SEK', 'JPY'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Lbl>Green framework — ICMA GBP use-of-proceeds categories (drives EuGB objective codes & impact analytics)</Lbl>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {UOP_CATEGORIES.map((c) => (
              <label key={c.key} style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: uop[c.key] ? T.navy : T.sub,
                border: `1px solid ${uop[c.key] ? T.teal : T.border}`, background: uop[c.key] ? T.teal + '11' : '#fff',
                borderRadius: 14, padding: '4px 10px', cursor: 'pointer', fontWeight: uop[c.key] ? 700 : 500,
              }}>
                <input type="checkbox" checked={!!uop[c.key]} onChange={(e) => setUop((p) => ({ ...p, [c.key]: e.target.checked }))} />
                {c.label} <span style={{ fontFamily: T.mono, fontSize: 9.5, color: T.sub }}>{c.obj}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Comp curve (FRED) + greenium ───────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Conventional Comp Curve & Greenium</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/fred-spreads/series — ICE BofA rating-bucket OAS</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={fred.status === 'loading' ? 'loading' : fred.status} demoText={fred.error} /></div>
        </div>

        {curve && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label={`Comp OAS (${rating})`} value={fmtBp(compOasBp)} sub={compRow?.asOf ? `as of ${compRow.asOf} · ${compRow.id}` : ''} color={T.blue} />
              <Kpi label="Greenium input" value={fmtBp(greeniumBp, 0)} sub={`indicative range ${gRange[0]} to ${gRange[1]} bp (${sector} / ${grade})`} color={T.green} />
              <Kpi label="Green fair value" value={fmtBp(fairValueBp)} sub="Comp OAS + greenium" color={T.teal} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Rating-bucket OAS curve (bp) — selected bucket highlighted</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmtBp(v)} />
                    <Bar dataKey="oasBp" name="OAS (bp)" radius={[3, 3, 0, 0]}>
                      {curve.map((c, i) => <Cell key={i} fill={c.bucket === rating ? T.gold : (c.grade === 'IG' ? T.navy : T.indigo)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.4, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>{rating} OAS history (bp) — {fred.mode === 'live' ? 'FRED live' : 'seeded real sample'}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={selHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmtBp(v)} />
                    <Line type="monotone" dataKey="oasBp" stroke={T.blue} dot={false} strokeWidth={2} name="OAS (bp)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Greenium adjustment (bp)</div>
                <input type="number" step="0.5" style={{ ...inputStyle, width: 120, marginBottom: 8 }} value={greeniumBp} onChange={(e) => setGreeniumBp(parseFloat(e.target.value) || 0)} />
                <div style={{ fontSize: 10.5, color: T.amber, background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
                  Indicative greenium ranges by sector/rating from published market studies (e.g. CBI pricing reports) — approximate, refresh for production.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Sector</th><th style={th}>IG (bp)</th><th style={th}>HY (bp)</th></tr></thead>
                  <tbody>
                    {GREENIUM_TABLE.map((r) => (
                      <tr key={r.sector} style={r.sector === sector ? { background: T.gold + '22' } : undefined}>
                        <td style={{ ...td, fontWeight: r.sector === sector ? 700 : 500 }}>{SECTORS.find((s) => s.key === r.sector)?.label || r.sector}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{r.IG[0]} to {r.IG[1]}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{r.HY[0]} to {r.HY[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {fred.status === 'demo' && !curve && <div style={{ fontSize: 12, color: T.sub }}>FRED spreads engine unreachable — no comp curve shown (this page never fabricates market levels). Error: {String(fred.error)}</div>}
      </Card>

      {/* ── Curve analytics — bootstrap + G/I/Z/ASW ─────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Curve Analytics — Bootstrap, G / I / Z-Spread & ASW</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/green-bond-analytics/curve-spreads</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={ca.status} demoText={ca.error} /></div>
        </div>
        <ModelNote>
          Benchmark PAR points are bootstrapped to a zero curve (sequential par→zero solve, LINEAR interpolation ON ZERO
          RATES, flat extrapolation, DF(t)=(1+z(t))⁻ᵗ). Z-spread solved by BISECTION over that zero curve with a round-trip
          repricing check shown below. Curve levels here are EDITABLE PLACEHOLDER inputs — enter live benchmark/swap points.
        </ModelNote>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <CurveEditor title="Benchmark PAR curve (govvies)" pts={benchPts} setPts={setBenchPts} rateLabel="Par (%)" />
          <CurveEditor title="Swap curve" pts={swapPts} setPts={setSwapPts} rateLabel="Swap (%)" />
          <div style={{ minWidth: 220 }}>
            <Lbl>New-issue bond terms (annual coupons)</Lbl>
            <div style={{ display: 'grid', gap: 8 }}>
              <div><Lbl>Coupon (%)</Lbl><input type="number" step="0.125" style={inputStyle} value={caCoupon} onChange={(e) => setCaCoupon(e.target.value)} /></div>
              <div><Lbl>Maturity (yrs)</Lbl><input type="number" step="0.5" style={inputStyle} value={caMat} onChange={(e) => setCaMat(e.target.value)} /></div>
              <div><Lbl>Price / 100</Lbl><input type="number" step="0.05" style={inputStyle} value={caPrice} onChange={(e) => setCaPrice(e.target.value)} /></div>
              <RunBtn onClick={runCurve}>Solve spreads →</RunBtn>
            </div>
          </div>
          {ca.status === 'live' && ca.data && (
            <div style={{ flex: 1, minWidth: 340 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Bootstrapped zero curve vs quoted par pillars (%)</div>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={curveChart.grid}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tenor" type="number" domain={[0, 'auto']} tick={{ fontSize: 10 }} label={{ value: 'Tenor (y)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip formatter={(v) => fmtPct(v, 3)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="zero" name="Zero curve (bootstrapped)" stroke={T.teal} strokeWidth={2.5} dot={false} />
                  <Scatter data={curveChart.pillars} dataKey="par" name="Quoted par pillars" fill={T.gold} />
                  <ReferenceLine x={num(caMat)} stroke={T.slate} strokeDasharray="4 3" label={{ value: 'bond maturity', fontSize: 9, fill: T.slate }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {ca.status === 'demo' && <div style={{ fontSize: 12, color: T.red }}>Engine error — no spreads shown (this page never fabricates results): {String(ca.error)}</div>}
        {ca.status === 'live' && ca.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="YTM" value={fmtPct(ca.data.ytm_pct, 3)} color={T.navy} sub="annual-coupon convention" />
              <Kpi label="G-spread" value={fmtBp(ca.data.spreads_bp.g_spread)} sub={`vs par ${fmtPct(ca.data.curve.benchmark_par_at_maturity_pct)} @ ${fmtNum(num(caMat), 1)}y`} color={T.blue} />
              <Kpi label="I-spread" value={fmtBp(ca.data.spreads_bp.i_spread)} sub={`vs swap ${fmtPct(ca.data.curve.swap_rate_at_maturity_pct)} @ ${fmtNum(num(caMat), 1)}y`} color={T.indigo} />
              <Kpi label="Z-spread" value={fmtBp(ca.data.spreads_bp.z_spread)} sub="bisection over bootstrapped zeros" color={T.teal} />
              <Kpi label="ASW proxy (par-par)" value={fmtBp(ca.data.spreads_bp.asw_proxy)} sub={`swap annuity ${fmtNum(ca.data.curve.swap_annuity_factor, 3)}`} color={T.purple} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckChip ok={!!ca.data.z_spread_round_trip.passes_pm_0_01} label={`Z round-trip |err| ${fmtNum(ca.data.z_spread_round_trip.abs_error, 8)} ≤ 0.01`} />
              </div>
            </div>
            <table style={{ width: '100%', maxWidth: 940, borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Metric</th><th style={th}>Value</th><th style={th}>Convention (stated)</th></tr></thead>
              <tbody>
                {spreadRows.map((r) => (
                  <tr key={r.metric}>
                    <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.metric}</td>
                    <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.value}</td>
                    <td style={{ ...td, fontSize: 11 }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 8 }}>
              round-trip: reprice @ solved Z = {fmtNum(ca.data.z_spread_round_trip.reprice_at_solved_z, 6)} vs market {fmtNum(ca.data.z_spread_round_trip.market_price, 4)} · {ca.data.z_spread_round_trip.solver}
            </div>
          </>
        )}
      </Card>

      {/* ── Relative value — comp OLS, greenium regression, matched pairs ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Relative Value — Comp Curve OLS & Greenium Pair Analysis</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/green-bond-analytics/relative-value</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={rv.status} demoText={rv.error} /></div>
        </div>
        <ModelNote>
          Closed-form OLS spread = α + β·tenor over the user comp set; the new issue's residual vs ±1 residual-SE gives the
          cheap / fair / dear verdict. A tenor-controlled green-dummy regression estimates the greenium; matched pairs
          (nearest-tenor green vs conventional within tolerance) give a model-free cross-check. Comp names/levels are
          EDITABLE PLACEHOLDERS — enter the live comp set.
        </ModelNote>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ flex: 1.3, minWidth: 420, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Comp</th><th style={th}>Tenor (y)</th><th style={th}>Spread (bp)</th><th style={th}>Green</th><th style={{ ...th, width: 36 }} /></tr></thead>
              <tbody>
                {comps.map((c) => (
                  <tr key={c.id}>
                    <td style={{ ...td, minWidth: 200 }}><input style={inputStyle} value={c.name} onChange={(e) => updComp(c.id, 'name', e.target.value)} /></td>
                    <td style={td}><input type="number" step="0.1" style={{ ...inputStyle, width: 76 }} value={c.tenor} onChange={(e) => updComp(c.id, 'tenor', e.target.value)} /></td>
                    <td style={td}><input type="number" style={{ ...inputStyle, width: 80 }} value={c.spread} onChange={(e) => updComp(c.id, 'spread', e.target.value)} /></td>
                    <td style={td}><input type="checkbox" checked={!!c.green} onChange={(e) => updComp(c.id, 'green', e.target.checked)} /></td>
                    <td style={td}><button onClick={() => rmComp(c.id)} style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12 }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addComp} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginTop: 8 }}>+ Add comp</button>
          </div>
          <div style={{ minWidth: 240 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div><Lbl>New-issue tenor (y) — blank = deal tenor</Lbl><input type="number" step="0.1" style={inputStyle} value={niTenor} placeholder={`auto: ${fmtNum(num(tenorY, 10), 1)}`} onChange={(e) => setNiTenor(e.target.value)} /></div>
              <div><Lbl>New-issue spread (bp) — blank = launch spread</Lbl><input type="number" style={inputStyle} value={niSpread} placeholder={pricing ? `auto: ${fmtNum(pricing.finalSpread, 1)}` : 'run pricing build'} onChange={(e) => setNiSpread(e.target.value)} /></div>
              <div><Lbl>Pair tenor tolerance (y)</Lbl><input type="number" step="0.5" style={inputStyle} value={pairTol} onChange={(e) => setPairTol(e.target.value)} /></div>
              <RunBtn onClick={runRv}>Run relative value →</RunBtn>
            </div>
          </div>
        </div>
        {rv.status === 'demo' && <div style={{ fontSize: 12, color: T.red }}>Engine error: {String(rv.error)}</div>}
        {rv.status === 'live' && rv.data && rvChart && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="OLS fit" value={`α ${fmtNum(rv.data.ols.alpha_bp, 1)} + β ${fmtNum(rv.data.ols.beta_bp_per_y, 2)}·t`} sub={`R² ${fmtNum(rv.data.ols.r_squared, 3)} · resid SE ${fmtBp(rv.data.ols.residual_std_error_bp)} · n=${rv.data.ols.n_comps}`} color={T.blue} />
              <Kpi label="New issue vs comp curve" value={`${rv.data.new_issue.residual_bp > 0 ? '+' : ''}${fmtBp(rv.data.new_issue.residual_bp)}`} sub={`fitted ${fmtBp(rv.data.new_issue.fitted_bp)} @ ${fmtNum(rv.data.new_issue.tenor_y, 1)}y`} color={rv.data.new_issue.residual_bp > 0 ? T.green : T.amber} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: rv.data.new_issue.verdict === 'cheap' ? '#dcfce7' : (rv.data.new_issue.verdict === 'dear' ? '#fee2e2' : '#e0f2fe'),
                  color: rv.data.new_issue.verdict === 'cheap' ? '#166534' : (rv.data.new_issue.verdict === 'dear' ? '#991b1b' : '#075985'),
                  padding: '6px 18px', borderRadius: 16, fontSize: 14, fontWeight: 800, fontFamily: T.mono, textTransform: 'uppercase',
                }}>{rv.data.new_issue.verdict}</span>
              </div>
              {rv.data.green_dummy_regression && (
                <Kpi label="Regression greenium (γ)" value={fmtBp(rv.data.green_dummy_regression.greenium_coefficient_bp)} sub={`tenor-controlled dummy · R² ${fmtNum(rv.data.green_dummy_regression.r_squared, 3)}`} color={T.green} />
              )}
              <Kpi label="Matched-pair greenium" value={rv.data.matched_pair_greenium.mean_greenium_bp != null ? fmtBp(rv.data.matched_pair_greenium.mean_greenium_bp) : '—'} sub={`${rv.data.matched_pair_greenium.pairs.length} pair(s), tol ${fmtNum(num(pairTol), 1)}y`} color={T.teal} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.3, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Spread vs tenor — comps, OLS fit & new issue</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={rvChart.line}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="tenor" type="number" domain={[0, 'auto']} tick={{ fontSize: 10 }} label={{ value: 'Tenor (y)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip formatter={(v) => fmtBp(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="fit" name="OLS fit" stroke={T.slate} strokeWidth={2} strokeDasharray="6 4" dot={false} />
                    <Scatter data={rvChart.greens} dataKey="spread" name="Green comps" fill={T.green} />
                    <Scatter data={rvChart.convs} dataKey="spread" name="Conventional comps" fill={T.indigo} />
                    <Scatter data={rvChart.ni} dataKey="spread" name="New issue" fill={T.gold} shape="diamond" legendType="diamond" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 340, overflowX: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Per-comp residuals & matched pairs</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead><tr><th style={th}>Comp</th><th style={th}>Fitted</th><th style={th}>Residual</th></tr></thead>
                  <tbody>
                    {rv.data.comps.map((c, i) => (
                      <tr key={i}>
                        <td style={{ ...td, color: c.green ? T.green : T.slate, fontWeight: c.green ? 700 : 500 }}>{c.name}{c.green ? ' 🌿' : ''}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtBp(c.fitted_bp)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: c.residual_bp > 0 ? T.green : T.amber }}>{c.residual_bp > 0 ? '+' : ''}{fmtBp(c.residual_bp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rv.data.matched_pair_greenium.pairs.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>Green</th><th style={th}>Conventional</th><th style={th}>Δtenor</th><th style={th}>Greenium</th></tr></thead>
                    <tbody>
                      {rv.data.matched_pair_greenium.pairs.map((p, i) => (
                        <tr key={i}>
                          <td style={{ ...td, fontSize: 11 }}>{p.green}</td>
                          <td style={{ ...td, fontSize: 11 }}>{p.conventional}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.tenor_gap_y, 1)}y</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: p.greenium_bp <= 0 ? T.green : T.amber }}>{p.greenium_bp > 0 ? '+' : ''}{fmtBp(p.greenium_bp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
              {rv.data.new_issue.verdict_rule} · {rv.data.matched_pair_greenium.method}
            </div>
          </>
        )}
      </Card>

      {/* ── Pricing build simulation ────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Pricing Build — IPT → Guidance → Launch</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Simulation — stated tightening convention, all parameters editable</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div><Lbl>Base rate (%, e.g. {tenorY}y benchmark)</Lbl><input type="number" step="0.01" style={inputStyle} value={baseRatePct} onChange={(e) => setBaseRatePct(parseFloat(e.target.value) || 0)} /></div>
          <div><Lbl>IPT spread (bp) — blank = fair value + 15</Lbl><input type="number" style={inputStyle} value={iptSpreadBp ?? ''} placeholder={autoIpt != null ? `auto: ${autoIpt}` : 'auto'} onChange={(e) => setIptSpreadBp(e.target.value === '' ? null : e.target.value)} /></div>
          <div>
            <Lbl>Order book multiple: {fmtNum(bookMult, 1)}×</Lbl>
            <input type="range" min="0.5" max="10" step="0.1" value={bookMult} onChange={(e) => setBookMult(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div><Lbl>Tightening per 1× oversubscription (bp)</Lbl><input type="number" step="0.5" style={inputStyle} value={bpPerTurn} onChange={(e) => setBpPerTurn(parseFloat(e.target.value) || 0)} /></div>
          <div><Lbl>Tightening cap (bp)</Lbl><input type="number" style={inputStyle} value={tightenCapBp} onChange={(e) => setTightenCapBp(parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          Convention (stated, not market data): total tightening = min(cap, max(0, (book multiple − 1) × bp-per-1×)).
          Guidance = IPT − ½ × tightening; launch/final = IPT − tightening. NIP = final spread − (comp OAS + greenium).
          All-in coupon = base rate + final spread.
        </div>

        {pricing && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="IPT" value={fmtBp(ipt, 0)} sub={iptSpreadBp == null ? 'auto: fair value + 15bp cushion' : 'user set'} />
              <Kpi label="Guidance" value={fmtBp(pricing.guidance)} sub="IPT − ½ tightening" />
              <Kpi label="Launch / final spread" value={fmtBp(pricing.finalSpread)} sub={`tightened ${fmtBp(pricing.tightening)} on ${fmtNum(bookMult, 1)}× book`} color={T.teal} />
              <Kpi label="NIP vs secondary" value={fmtBp(pricing.nip)} sub="final − green fair value" color={pricing.nip >= 0 ? T.amber : T.green} />
              <Kpi label="All-in coupon" value={fmtPct(pricing.coupon)} sub={`${fmtPct(baseRatePct)} base + ${fmtBp(pricing.finalSpread)}`} color={T.navy} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Spread by stage (bp)</div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={stageData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="stage" tick={{ fontSize: 9 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip formatter={(v) => fmtBp(v)} />
                    <Bar dataKey="spread" radius={[3, 3, 0, 0]}>
                      {stageData.map((s, i) => <Cell key={i} fill={[T.slate, T.indigo, T.teal, T.gold][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Final spread vs book multiple (tightening rule)</div>
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={pricing.buildCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="mult" tick={{ fontSize: 10 }} label={{ value: 'Book multiple (×)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip formatter={(v) => fmtBp(v)} labelFormatter={(l) => `${l}× book`} />
                    <ReferenceLine x={bookMult} stroke={T.gold} strokeDasharray="4 3" />
                    <ReferenceLine y={fairValueBp} stroke={T.green} strokeDasharray="4 3" label={{ value: 'fair value', fontSize: 9, fill: T.green }} />
                    <Line type="monotone" dataKey="finalSpread" stroke={T.teal} dot={false} strokeWidth={2} name="Final spread (bp)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        {!pricing && <div style={{ fontSize: 12, color: T.sub }}>Comp curve not yet available — the pricing build activates once the FRED comp OAS loads.</div>}
      </Card>

      {/* ── Order book composition & allocation optimizer ───────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Order Book — Composition, Drop-Out Sensitivity & Allocation Optimizer</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Frontend desk math — stated conventions, all parameters editable</span>
        </div>
        <ModelNote>
          Conventions (stated): the peak book at IPT = book multiple × deal size, split by the editable investor-type
          distribution; price sensitivity is LINEAR drop-out — each bp tightened from IPT sheds {fmtNum(num(dropPerBp), 1)}%
          of the peak book. Pro-rata allocation applies a uniform fill rate; preferred tiering weights demand by the tier
          factor (capped at each type's demand, iterative redistribution — documented waterfall).
        </ModelNote>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ minWidth: 360, overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Investor type</th><th style={th}>% of book</th><th style={th}>Tier weight</th></tr></thead>
              <tbody>
                {bookDist.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...td, minWidth: 190 }}><input style={inputStyle} value={r.type} onChange={(e) => updBook(r.id, 'type', e.target.value)} /></td>
                    <td style={td}><input type="number" style={{ ...inputStyle, width: 72 }} value={r.pct} onChange={(e) => updBook(r.id, 'pct', e.target.value)} /></td>
                    <td style={td}><input type="number" step="0.1" style={{ ...inputStyle, width: 72 }} value={r.tier} onChange={(e) => updBook(r.id, 'tier', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8, maxWidth: 300 }}>
              <Lbl>Drop-out per bp tightened (% of peak book)</Lbl>
              <input type="number" step="0.1" style={{ ...inputStyle, width: 110 }} value={dropPerBp} onChange={(e) => setDropPerBp(e.target.value)} />
            </div>
          </div>
          {book && (
            <div style={{ flex: 1, minWidth: 340 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Peak book @ IPT" value={`${fmtNum(book.peakBook, 0)} mn`} sub={`${fmtNum(bookMult, 1)}× cover`} color={T.blue} />
                <Kpi label={`Book @ launch (−${fmtBp(pricing?.tightening ?? 0, 1)})`} value={`${fmtNum(book.finalBook, 0)} mn`} sub={`${fmtNum(book.cover, 2)}× cover after drop-out`} color={book.undersubscribed ? T.red : T.teal} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Oversubscription dynamics — book cover vs bp tightened (linear drop-out rule)</div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={book.dyn}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tighten" tick={{ fontSize: 10 }} label={{ value: 'bp tightened from IPT', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${fmtNum(v, 2)}×`} labelFormatter={(l) => `−${l} bp`} />
                  <ReferenceLine y={1} stroke={T.red} strokeDasharray="4 3" label={{ value: '1× (fully covered)', fontSize: 9, fill: T.red }} />
                  {pricing && <ReferenceLine x={Math.round(pricing.tightening)} stroke={T.gold} strokeDasharray="4 3" label={{ value: 'launch', fontSize: 9, fill: T.amber }} />}
                  <Line type="monotone" dataKey="cover" name="Book cover (×)" stroke={T.teal} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {book && (
          <>
            {book.undersubscribed && (
              <div style={{ fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 8 }}>
                ⚠ Book after drop-out ({fmtNum(book.finalBook, 0)}mn) is below deal size ({fmtNum(num(sizeMn), 0)}mn) — the launch level over-tightens the book under the stated drop-out rule.
              </div>
            )}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.2, minWidth: 420, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Investor type</th><th style={th}>% book</th><th style={th}>Demand (mn)</th><th style={th}>Pro-rata (mn)</th><th style={th}>Tiered (mn)</th><th style={th}>Fill pro-rata</th><th style={th}>Fill tiered</th></tr></thead>
                  <tbody>
                    {book.table.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.type}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.pct, 0)}%</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.demand, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.proRata, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(r.tiered, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.fillPro, 0)}%</td>
                        <td style={{ ...td, fontFamily: T.mono, color: r.fillTier > r.fillPro ? T.green : (r.fillTier < r.fillPro ? T.amber : T.slate) }}>{fmtNum(r.fillTier, 0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Allocation by investor type — pro-rata vs preferred tiering (mn)</div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={book.table}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 8.5 }} interval={0} angle={-10} height={44} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${fmtNum(v, 1)} mn`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="proRata" name="Pro-rata" fill={T.slate} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="tiered" name="Preferred tiering" fill={T.teal} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        {!book && <div style={{ fontSize: 12, color: T.sub }}>Order-book analytics activate once the pricing build is live (needs the comp curve).</div>}
      </Card>

      {/* ── Use-of-proceeds impact analytics ─────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Use-of-Proceeds Impact Analytics — Avoided Emissions × Pricing</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Sustainability × financial overlay — factors labeled & editable</span>
        </div>
        <ModelNote>
          Impact factors (tCO2e avoided per €M allocated per YEAR) are hand-authored indicative defaults distilled from
          published harmonized impact reports (ICMA Harmonised Framework for Impact Reporting metrics; CBI / development-bank
          impact-report ranges) — replace with project-level ex-ante estimates for a real framework. Impact yield
          (documented) = annual tCO2e avoided per bp of greenium GIVEN UP by investors (defined when greenium &lt; 0).
          Taxonomy roll-up = allocation-weighted taxonomy-aligned share, pushable into the EuGB test below.
        </ModelNote>
        {uopRows.length === 0 && <div style={{ fontSize: 12, color: T.sub }}>Select at least one ICMA GBP category in the deal setup to build the allocation table.</div>}
        {uopRows.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1.3, minWidth: 460, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>ICMA GBP category</th><th style={th}>Allocated (mn)</th><th style={th}>tCO2e/€M/yr</th><th style={th}>Taxonomy %</th><th style={th}>tCO2e avoided/yr</th></tr></thead>
                  <tbody>
                    {impact.rows.map((r) => (
                      <tr key={r.key}>
                        <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.label}</td>
                        <td style={td}><input type="number" style={{ ...inputStyle, width: 90 }} value={r.alloc} onChange={(e) => updUopRow(r.key, 'alloc', e.target.value)} /></td>
                        <td style={td}><input type="number" style={{ ...inputStyle, width: 84 }} value={r.factor} onChange={(e) => updUopRow(r.key, 'factor', e.target.value)} /></td>
                        <td style={td}><input type="number" min="0" max="100" style={{ ...inputStyle, width: 72 }} value={r.tax} onChange={(e) => updUopRow(r.key, 'tax', e.target.value)} /></td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(r.co2, 0)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ ...td, fontWeight: 800, color: T.navy }}>TOTAL</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 800, color: Math.abs(impact.unalloc) > 0.5 ? T.amber : T.navy }}>{fmtNum(impact.allocTot, 1)}{Math.abs(impact.unalloc) > 0.5 ? ` (${impact.unalloc > 0 ? 'unallocated ' : 'over by '}${fmtNum(Math.abs(impact.unalloc), 1)})` : ''}</td>
                      <td style={td} />
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 800 }}>{impact.taxRollup != null ? fmtPct(impact.taxRollup, 1) : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 800 }}>{fmtNum(impact.co2Tot, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Avoided emissions by category (tCO2e/yr)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={impact.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 8.5 }} interval={0} angle={-12} height={52} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${fmtNum(v, 0)} tCO2e/yr`} />
                    <Bar dataKey="co2" name="tCO2e avoided / yr" radius={[3, 3, 0, 0]}>
                      {impact.rows.map((r, i) => <Cell key={i} fill={[T.teal, T.green, T.blue, T.indigo, T.purple, T.gold, T.slate, T.amber, T.navy, T.red][i % 10]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <Kpi label="Portfolio impact intensity" value={impact.intensity != null ? `${fmtNum(impact.intensity, 0)}` : '—'} sub="tCO2e avoided / yr per €M allocated" color={T.teal} />
              <Kpi label="Avoided tCO2e per 1k coupon" value={impact.perCoupon1k != null ? fmtNum(impact.perCoupon1k, 2) : '—'} sub={impact.couponCash != null ? `annual coupon ${fmtNum(impact.couponCash / 1e6, 1)}mn (all-in ${fmtPct(pricing?.coupon)})` : 'needs pricing build'} color={T.navy} />
              <Kpi label="Impact yield" value={impact.impactYield != null ? `${fmtNum(impact.impactYield, 0)} t/bp` : '—'} sub={greeniumBp < 0 ? `tCO2e/yr per bp of greenium given up (${fmtBp(greeniumBp, 0)})` : 'undefined — greenium ≥ 0 (no spread given up)'} color={T.green} />
              <Kpi label="EU Taxonomy roll-up" value={impact.taxRollup != null ? fmtPct(impact.taxRollup, 1) : '—'} sub="allocation-weighted aligned share" color={T.purple} />
            </div>
            <button onClick={() => impact.taxRollup != null && setTaxonomyPct(+impact.taxRollup.toFixed(1))} style={{ background: 'transparent', border: `1px solid ${T.purple}66`, borderRadius: 8, color: T.purple, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 16px' }}>
              Push {impact.taxRollup != null ? fmtPct(impact.taxRollup, 1) : '—'} roll-up into the EuGB 85/15 test ↓
            </button>
          </>
        )}
      </Card>

      {/* ── EuGB 85/15 panel ────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>EuGB Compliance — 85/15 Use-of-Proceeds Flexibility Test</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/eu-gbs/assess-issuance — Regulation (EU) 2023/2631 engine</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={eugb.status} demoText={eugb.error} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 10 }}>
          <div><Lbl>Taxonomy-aligned proceeds (%)</Lbl><input type="number" min="0" max="100" style={inputStyle} value={taxonomyPct} onChange={(e) => setTaxonomyPct(e.target.value)} /></div>
          <div><Lbl>Art 5 flexibility pocket (%)</Lbl><input type="number" min="0" max="100" style={inputStyle} value={pocketPct} onChange={(e) => setPocketPct(e.target.value)} /></div>
          <div><Lbl>Refinancing share (%)</Lbl><input type="number" min="0" max="100" style={inputStyle} value={refiPct} onChange={(e) => setRefiPct(e.target.value)} /></div>
          <div><Lbl>External reviewer</Lbl><input style={inputStyle} value={erName} onChange={(e) => setErName(e.target.value)} disabled={!hasEr} /></div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 12, color: T.slate }}>
          <label><input type="checkbox" checked={pocketOk} onChange={(e) => setPocketOk(e.target.checked)} /> Art 5(1) pocket conditions met</label>
          <label><input type="checkbox" checked={dnsh} onChange={(e) => setDnsh(e.target.checked)} /> DNSH confirmed</label>
          <label><input type="checkbox" checked={safeguards} onChange={(e) => setSafeguards(e.target.checked)} /> Minimum safeguards (Art 18)</label>
          <label><input type="checkbox" checked={hasEr} onChange={(e) => setHasEr(e.target.checked)} /> ESMA-registered ER engaged</label>
          <label><input type="checkbox" checked={preReview} onChange={(e) => setPreReview(e.target.checked)} /> Pre-issuance GBFS review</label>
          <button onClick={runEugb} style={{ marginLeft: 'auto', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
            Run EuGB assessment →
          </button>
        </div>

        {eugb.status === 'live' && eugb.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Overall" value={eugb.data.overall_compliant ? 'COMPLIANT' : 'NOT COMPLIANT'} color={eugb.data.overall_compliant ? T.green : T.red} sub={`score ${fmtNum(eugb.data.compliance_score, 1)}/100`} />
              <Kpi label="Effective taxonomy alignment" value={fmtPct(eugb.data.effective_taxonomy_alignment_pct, 1)} sub={`aligned ${fmtPct(eugb.data.taxonomy_alignment_pct, 1)} + pocket credited ${fmtPct(eugb.data.flexibility_pocket_pct_credited, 1)} (cap 15%)`} color={T.teal} />
              <Kpi label="85% threshold" value={fmtPct(eugb.data.taxonomy_threshold_pct, 0)} sub="Art 4-5 Regulation 2023/2631" />
              <Kpi label="GBFS completeness" value={fmtPct(eugb.data.gbfs_completeness_pct, 0)} sub={`DNSH: ${eugb.data.dnsh_status} · ER: ${eugb.data.er_status}`} />
            </div>
            {(eugb.data.blocking_gaps?.length > 0) && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 4 }}>Blocking gaps</div>
                {eugb.data.blocking_gaps.map((g, i) => <div key={i} style={{ fontSize: 11.5, color: T.red, padding: '2px 0' }}>• {g}</div>)}
              </div>
            )}
            {(eugb.data.priority_actions?.length > 0) && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Priority actions</div>
                {eugb.data.priority_actions.slice(0, 6).map((a, i) => <div key={i} style={{ fontSize: 11.5, color: T.slate, padding: '2px 0' }}>→ {typeof a === 'string' ? a : JSON.stringify(a)}</div>)}
              </div>
            )}
          </>
        )}
        {eugb.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>EU GBS engine unreachable — no compliance verdict shown (this page never fabricates one). Error: {String(eugb.error)}</div>}
        {eugb.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the allocation split and run the assessment — the 85/15 test (taxonomy-aligned ≥ 85%, Art 5 flexibility pocket capped at 15%) is computed by the live EU GBS engine.</div>}
      </Card>

      {/* ── Dual-tranche EUR/USD comparison ─────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Dual-Tranche Comparison — EUR vs USD, Same Credit</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/green-bond-analytics/dual-tranche</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={dt.status} demoText={dt.error} /></div>
        </div>
        <ModelNote>
          Each leg gets the full bootstrap + G/I/Z/ASW treatment on its OWN curves. The user cross-currency basis is added
          to the USD-leg Z-spread to express it in EUR terms (stated sign convention: eur_equivalent = z_usd + basis; the
          EUR/USD basis is typically quoted negative). All curve levels and the basis are EDITABLE PLACEHOLDER inputs.
        </ModelNote>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <CurveEditor title="EUR benchmark par (govvies)" pts={eurBench} setPts={setEurBench} rateLabel="Par (%)" />
          <CurveEditor title="EUR swap curve" pts={eurSwap} setPts={setEurSwap} rateLabel="Swap (%)" />
          <CurveEditor title="USD benchmark par (USTs)" pts={usdBench} setPts={setUsdBench} rateLabel="Par (%)" />
          <CurveEditor title="USD swap curve (SOFR)" pts={usdSwap} setPts={setUsdSwap} rateLabel="Swap (%)" />
          <div style={{ minWidth: 240 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, background: T.cream }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, marginBottom: 6 }}>EUR tranche</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div><Lbl>Cpn %</Lbl><input type="number" step="0.125" style={{ ...inputStyle, width: 70 }} value={dtEur.coupon} onChange={(e) => setDtEur((p) => ({ ...p, coupon: e.target.value }))} /></div>
                  <div><Lbl>Mat y</Lbl><input type="number" step="0.5" style={{ ...inputStyle, width: 58 }} value={dtEur.mat} onChange={(e) => setDtEur((p) => ({ ...p, mat: e.target.value }))} /></div>
                  <div><Lbl>Px</Lbl><input type="number" step="0.05" style={{ ...inputStyle, width: 72 }} value={dtEur.price} onChange={(e) => setDtEur((p) => ({ ...p, price: e.target.value }))} /></div>
                </div>
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, background: T.cream }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, marginBottom: 6 }}>USD tranche</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div><Lbl>Cpn %</Lbl><input type="number" step="0.125" style={{ ...inputStyle, width: 70 }} value={dtUsd.coupon} onChange={(e) => setDtUsd((p) => ({ ...p, coupon: e.target.value }))} /></div>
                  <div><Lbl>Mat y</Lbl><input type="number" step="0.5" style={{ ...inputStyle, width: 58 }} value={dtUsd.mat} onChange={(e) => setDtUsd((p) => ({ ...p, mat: e.target.value }))} /></div>
                  <div><Lbl>Px</Lbl><input type="number" step="0.05" style={{ ...inputStyle, width: 72 }} value={dtUsd.price} onChange={(e) => setDtUsd((p) => ({ ...p, price: e.target.value }))} /></div>
                </div>
              </div>
              <div><Lbl>EUR/USD xccy basis (bp, user input)</Lbl><input type="number" step="0.5" style={{ ...inputStyle, width: 110 }} value={xccyBp} onChange={(e) => setXccyBp(e.target.value)} /></div>
              <RunBtn onClick={runDual}>Compare tranches →</RunBtn>
            </div>
          </div>
        </div>
        {dt.status === 'demo' && <div style={{ fontSize: 12, color: T.red }}>Engine error: {String(dt.error)}</div>}
        {dt.status === 'live' && dt.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="EUR Z-spread" value={fmtBp(dt.data.cross_currency.eur_z_bp)} sub={`${dt.data.legs.eur.label}`} color={T.blue} />
              <Kpi label="USD Z-spread" value={fmtBp(dt.data.legs.usd.spreads_bp.z_spread)} sub={`${dt.data.legs.usd.label}`} color={T.indigo} />
              <Kpi label="USD Z in EUR equiv" value={fmtBp(dt.data.cross_currency.usd_z_in_eur_equiv_bp)} sub={`z_usd + basis (${fmtBp(dt.data.cross_currency.xccy_basis_bp, 0)})`} color={T.purple} />
              <Kpi label="EUR − USD (EUR terms)" value={fmtBp(dt.data.cross_currency.eur_minus_usd_equiv_bp)} sub={dt.data.cross_currency.issuer_funding_verdict} color={dt.data.cross_currency.eur_minus_usd_equiv_bp < 0 ? T.green : T.amber} />
            </div>
            <table style={{ width: '100%', maxWidth: 760, borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead><tr><th style={th}>Metric</th><th style={th}>EUR tranche</th><th style={th}>USD tranche</th></tr></thead>
              <tbody>
                {[
                  ['YTM (%)', dt.data.legs.eur.ytm_pct, dt.data.legs.usd.ytm_pct, 3],
                  ['G-spread (bp)', dt.data.legs.eur.spreads_bp.g_spread, dt.data.legs.usd.spreads_bp.g_spread, 1],
                  ['I-spread (bp)', dt.data.legs.eur.spreads_bp.i_spread, dt.data.legs.usd.spreads_bp.i_spread, 1],
                  ['Z-spread (bp)', dt.data.legs.eur.spreads_bp.z_spread, dt.data.legs.usd.spreads_bp.z_spread, 1],
                  ['ASW proxy (bp)', dt.data.legs.eur.spreads_bp.asw_proxy, dt.data.legs.usd.spreads_bp.asw_proxy, 1],
                ].map(([m, e, u, dd]) => (
                  <tr key={m}>
                    <td style={{ ...td, fontWeight: 700, color: T.navy }}>{m}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(e, dd)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(u, dd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <CheckChip ok={!!dt.data.legs.eur.z_spread_round_trip.passes_pm_0_01} label={`EUR Z round-trip ±0.01`} />
              <CheckChip ok={!!dt.data.legs.usd.z_spread_round_trip.passes_pm_0_01} label={`USD Z round-trip ±0.01`} />
              <span style={{ fontSize: 10.5, color: T.sub }}>{dt.data.cross_currency.convention}</span>
            </div>
          </>
        )}
      </Card>

      {/* ── Post-issuance surveillance ───────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Post-Issuance Surveillance — Spread, Greenium Realization & Reporting</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>User-entered secondary levels — no fabricated marks</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <Kpi label="At-issue greenium (input)" value={fmtBp(greeniumBp, 0)} sub="from the comp-curve panel" color={T.green} />
          <Kpi label="Latest realized greenium" value={realizedGreenium != null ? fmtBp(realizedGreenium) : '—'} sub="latest issue-vs-comp observation below" color={realizedGreenium != null && realizedGreenium <= 0 ? T.green : T.amber} />
          <Kpi label="Greenium realization" value={realizedGreenium != null ? `${realizedGreenium - greeniumBp > 0 ? '+' : ''}${fmtBp(realizedGreenium - greeniumBp)}` : '—'} sub="realized − at-issue (negative = MORE greenium realized than priced)" color={realizedGreenium != null && realizedGreenium - greeniumBp <= 0 ? T.green : T.amber} />
        </div>
        <table style={{ width: '100%', maxWidth: 860, borderCollapse: 'collapse', marginBottom: 10 }}>
          <thead>
            <tr>
              <th style={th}>Observation</th>
              <th style={th}>New issue spread (bp)</th>
              <th style={th}>Comp spread (bp)</th>
              <th style={th}>Vs reoffer ({pricing ? fmtBp(pricing.finalSpread) : '—'})</th>
              <th style={th}>Vs comp (realized greenium)</th>
              <th style={{ ...th, width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {perfCalc.map((r) => (
              <tr key={r.id}>
                <td style={td}><input style={inputStyle} value={r.label} onChange={(e) => updPerf(r.id, 'label', e.target.value)} /></td>
                <td style={td}><input type="number" style={inputStyle} value={r.issueBp} onChange={(e) => updPerf(r.id, 'issueBp', e.target.value)} /></td>
                <td style={td}><input type="number" style={inputStyle} value={r.compBp} onChange={(e) => updPerf(r.id, 'compBp', e.target.value)} /></td>
                <td style={{ ...td, fontFamily: T.mono, color: r.vsReoffer == null ? T.sub : (r.vsReoffer <= 0 ? T.green : T.red), fontWeight: 700 }}>{r.vsReoffer == null ? '—' : `${r.vsReoffer > 0 ? '+' : ''}${fmtNum(r.vsReoffer, 1)} bp`}</td>
                <td style={{ ...td, fontFamily: T.mono, color: r.vsComp == null ? T.sub : (r.vsComp <= 0 ? T.green : T.amber), fontWeight: 700 }}>{r.vsComp == null ? '—' : `${r.vsComp > 0 ? '+' : ''}${fmtNum(r.vsComp, 1)} bp`}</td>
                <td style={td}><button onClick={() => rmPerf(r.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addPerf} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 16px', marginBottom: 12 }}>+ Add observation</button>
        {perfChart.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={perfChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => fmtBp(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke={T.slate} />
              <Line type="monotone" dataKey="Issue vs reoffer (bp)" stroke={T.teal} strokeWidth={2} />
              <Line type="monotone" dataKey="Issue vs comp (bp)" stroke={T.indigo} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16 }}>
          <div style={{ flex: 1, minWidth: 340 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Allocation-report checklist — ICMA Harmonised Framework core fields</div>
            {ALLOC_CHECKLIST.map((item, i) => (
              <label key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: allocChecks[i] ? T.navy : T.slate, padding: '3px 0', cursor: 'pointer', fontWeight: allocChecks[i] ? 700 : 500 }}>
                <input type="checkbox" style={{ marginTop: 2 }} checked={!!allocChecks[i]} onChange={(e) => setAllocChecks((p) => ({ ...p, [i]: e.target.checked }))} /> {item}
              </label>
            ))}
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              {Object.values(allocChecks).filter(Boolean).length}/{ALLOC_CHECKLIST.length} fields covered — field list paraphrases the ICMA Harmonised Framework for Impact Reporting (allocation section).
            </div>
          </div>
          <div style={{ flex: 1.4, minWidth: 420, overflowX: 'auto' }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Impact-report generator — from the UoP allocation table above</div>
            {impact.rows.length === 0 && <div style={{ fontSize: 11.5, color: T.sub }}>Select UoP categories to generate the impact-report rows.</div>}
            {impact.rows.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Category</th><th style={th}>Allocated (mn)</th><th style={th}>Impact metric</th><th style={th}>Methodology note</th></tr></thead>
                <tbody>
                  {impact.rows.map((r) => (
                    <tr key={r.key}>
                      <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.label}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.allocN, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.co2, 0)} tCO2e avoided/yr</td>
                      <td style={{ ...td, fontSize: 10.5 }}>ex-ante factor {fmtNum(r.factorN, 0)} tCO2e/€M/yr — hand-authored indicative default; replace with project-level ex-ante estimate per ICMA Harmonised Framework</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...td, fontWeight: 800, color: T.navy }}>TOTAL</td>
                    <td style={{ ...td, fontFamily: T.mono, fontWeight: 800 }}>{fmtNum(impact.allocTot, 1)}</td>
                    <td style={{ ...td, fontFamily: T.mono, fontWeight: 800 }}>{fmtNum(impact.co2Tot, 0)} tCO2e/yr</td>
                    <td style={{ ...td, fontSize: 10.5 }}>portfolio intensity {impact.intensity != null ? fmtNum(impact.intensity, 0) : '—'} tCO2e/€M/yr</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Sources: FRED ICE BofA OAS indices (rating-bucket comp curve, Live/Demo per FRED_API_KEY) ·
        api/v1/routes/green_bond_analytics.py (par bootstrap, G/I/Z-spread bisection + round-trip check, ASW proxy,
        comp OLS / green-dummy / matched-pair greenium, EUR-USD dual tranche with user xccy basis) ·
        services/eu_gbs_engine.py (Regulation 2023/2631 — 85/15 flexibility pocket, GBFS, ER) ·
        greenium & impact-intensity reference tables hand-authored from published pricing/impact studies (approximate,
        labeled) · book-build tightening, drop-out and allocation-tiering are stated desk conventions, fully parameterized.
      </div>
    </div>
  );
}
