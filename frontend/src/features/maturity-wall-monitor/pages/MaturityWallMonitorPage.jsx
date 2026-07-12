import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ReferenceLine, ComposedChart, Line, Scatter,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Maturity Wall Monitor (NX2-10)
// DCM refinancing analytics for energy & utility issuers:
//   1. GET  /api/v1/energy-bonds/ladder            hand-authored REAL-ISSUER bond extract
//   2. GET  /api/v1/fred-spreads/series            REAL ICE BofA rating-bucket OAS via FRED
//   3. GET  /api/v1/energy-bonds/curves            per-issuer OLS spread curves + rich/cheap
//   4. POST /api/v1/energy-bonds/ladder-analytics  duration / DV01 / rate-shock table /
//                                                  EBITDA leverage screen (closed-form)
//   5. POST /api/v1/energy-bonds/refi-economics    greenium, call/make-whole breakeven,
//                                                  tender + new-issue combo
//   6. POST /api/v1/energy-bonds/transition-overlay transition capex funding-gap, green-share
//                                                  trend, climate-spread stressed wall cost
// In-page refi math (documented inline):
//   est. refi coupon % = base rate (user) + rate stress + bucket OAS + spread stress
//   annual interest Δ $M = (refi coupon − existing coupon) × size
// The live bucket-OAS join is forwarded to every backend analytics call so all
// engines price off the same spreads. No PRNG, no fabricated market data.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// FRED series per extract rating bucket (real ICE BofA OAS ids), with the
// grade-level aggregate as a documented fallback when a single bucket is not
// present in the keyless demo seed.
const BUCKET_SERIES = { AA: 'BAMLC0A2CAA', A: 'BAMLC0A3CA', BBB: 'BAMLC0A4CBBB', BB: 'BAMLH0A1HYBB', B: 'BAMLH0A2HYB' };
const FALLBACK_SERIES = { AA: 'BAMLC0A0CM', A: 'BAMLC0A0CM', BBB: 'BAMLC0A0CM', BB: 'BAMLH0A0HYM2', B: 'BAMLH0A0HYM2' };
const ALL_SPREAD_IDS = 'BAMLC0A2CAA,BAMLC0A3CA,BAMLC0A4CBBB,BAMLH0A1HYBB,BAMLH0A2HYB,BAMLC0A0CM,BAMLH0A0HYM2';

const BUCKET_COLOR = { AA: T.green, A: T.teal, BBB: T.blue, BB: T.amber, B: T.red };
const LABEL_COLOR = { green: T.green, slb: T.teal, conventional: T.slate };
const LABEL_NAME = { green: 'Green (UoP)', slb: 'Sustainability-linked', conventional: 'Conventional' };

const fmtBn = (v, d = 2) => ((v == null || isNaN(v)) ? '—' : `$${Number(v).toFixed(d)}bn`);
const fmtM = (v, d = 1) => ((v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`);
const fmtPct = (v, d = 2) => ((v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`);
const fmtBps = (v, d = 0) => ((v == null || isNaN(v)) ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(d)} bps`);
const fmtNum = (v, d = 1) => ((v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  if (status === 'extract') return <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>◆ Seeded extract — approximate real-issuer terms</span>;
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
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', boxSizing: 'border-box',
};
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const secH = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const chip = { fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' };
const runBtn = { background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font };
const lblStyle = { fontSize: 11, color: T.sub, fontWeight: 600 };

export default function MaturityWallMonitorPage() {
  // ladder: { status, bonds, label, asOf, error }
  const [ladder, setLadder] = useState({ status: 'loading', bonds: null, label: null, asOf: null, error: null });
  // fred: { status, byBucket: {AA:{oasPp, asOf, proxy}}, error }
  const [fred, setFred] = useState({ status: 'loading', byBucket: null, error: null });

  const [issuerFilter, setIssuerFilter] = useState('All issuers');
  const [ccyFilter, setCcyFilter] = useState('All');
  const [stackBy, setStackBy] = useState('bucket'); // 'bucket' | 'label'
  const [horizonYear, setHorizonYear] = useState(2030);
  const [baseRatePct, setBaseRatePct] = useState(4.25);
  const [rateStressBp, setRateStressBp] = useState(0);
  const [spreadStressBp, setSpreadStressBp] = useState(0);
  const [gapThresholdBp, setGapThresholdBp] = useState(150);

  // ── New analytics panels ───────────────────────────────────────────────────
  const [curves, setCurves] = useState({ status: 'idle', data: null, error: null });
  const [ladderAn, setLadderAn] = useState({ status: 'idle', data: null, error: null });
  const [refiEco, setRefiEco] = useState({ status: 'idle', data: null, error: null });
  const [transOv, setTransOv] = useState({ status: 'idle', data: null, error: null });

  // Refi-economics inputs
  const [greeniumBp, setGreeniumBp] = useState(5);
  const [callPricePct, setCallPricePct] = useState(103);
  const [expFutureRatePct, setExpFutureRatePct] = useState(6.0);
  const [tenderPricePct, setTenderPricePct] = useState(101);
  const [tenderPartPct, setTenderPartPct] = useState(60);
  // EBITDA leverage-screen inputs (per issuer, $bn — blank = not screened)
  const [ebitdaMap, setEbitdaMap] = useState({});
  // Transition-overlay per-issuer inputs { issuer: {capex, score} }
  const [transMap, setTransMap] = useState({});
  const [slopeBpPerPoint, setSlopeBpPerPoint] = useState(1.5);
  const [transHorizon, setTransHorizon] = useState(2032);

  useEffect(() => {
    let mounted = true;
    axios.get('/api/v1/energy-bonds/ladder', { timeout: 20000 })
      .then(({ data }) => { if (mounted) setLadder({ status: 'extract', bonds: data.bonds || [], label: data.label, asOf: data.as_of, error: null }); })
      .catch((e) => { if (mounted) setLadder({ status: 'demo', bonds: null, label: null, asOf: null, error: e?.response?.data?.detail || e.message }); });
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
          else if (byId[FALLBACK_SERIES[bk]]) byBucket[bk] = { ...byId[FALLBACK_SERIES[bk]], proxy: FALLBACK_SERIES[bk] === 'BAMLC0A0CM' ? 'IG aggregate' : 'HY aggregate' };
        });
        setFred({ status: data.mode === 'live' ? 'live' : 'demo', byBucket, error: data.mode === 'live' ? null : 'seeded FRED sample — set FRED_API_KEY' });
      })
      .catch((e) => { if (mounted) setFred({ status: 'demo', byBucket: null, error: e?.response?.data?.detail || e.message }); });
    return () => { mounted = false; };
  }, []);

  const issuers = useMemo(() => (ladder.bonds ? ['All issuers', ...Array.from(new Set(ladder.bonds.map((b) => b.issuer))).sort()] : ['All issuers']), [ladder.bonds]);

  const filtered = useMemo(() => {
    if (!ladder.bonds) return null;
    return ladder.bonds.filter((b) => (issuerFilter === 'All issuers' || b.issuer === issuerFilter)
      && (ccyFilter === 'All' || b.currency === ccyFilter));
  }, [ladder.bonds, issuerFilter, ccyFilter]);

  // OAS map (pp) forwarded to every backend analytics call so all engines
  // price off the SAME live spreads the in-page refi math uses.
  const oasMap = useMemo(() => {
    if (!fred.byBucket) return null;
    const m = {};
    Object.keys(fred.byBucket).forEach((bk) => { m[bk] = fred.byBucket[bk].oasPp; });
    return Object.keys(m).length ? m : null;
  }, [fred.byBucket]);

  // ── Ladder chart data: per-year stacked by rating bucket or by label ──────
  const wall = useMemo(() => {
    if (!filtered || !filtered.length) return null;
    const years = [];
    const minY = Math.min(...filtered.map((b) => b.maturity_year));
    const maxY = Math.max(...filtered.map((b) => b.maturity_year));
    for (let y = minY; y <= maxY; y += 1) years.push(y);
    const buckets = Array.from(new Set(filtered.map((b) => b.rating_bucket)));
    const labels = Array.from(new Set(filtered.map((b) => b.label)));
    const rows = years.map((y) => {
      const inYear = filtered.filter((b) => b.maturity_year === y);
      const row = { year: y, total: inYear.reduce((s, b) => s + b.size_bn, 0) };
      buckets.forEach((bk) => { row[`bk_${bk}`] = Number(inYear.filter((b) => b.rating_bucket === bk).reduce((s, b) => s + b.size_bn, 0).toFixed(3)); });
      labels.forEach((lb) => { row[`lb_${lb}`] = Number(inYear.filter((b) => b.label === lb).reduce((s, b) => s + b.size_bn, 0).toFixed(3)); });
      return row;
    });
    return { rows, buckets, labels, total: filtered.reduce((s, b) => s + b.size_bn, 0) };
  }, [filtered]);

  // ── Refi cost panel: bonds maturing ≤ horizon at stressed base + OAS ──────
  const refi = useMemo(() => {
    if (!filtered || !fred.byBucket) return null;
    const base = parseFloat(baseRatePct) || 0;
    const maturing = filtered.filter((b) => b.maturity_year <= horizonYear);
    const rows = maturing.map((b) => {
      const mkt = fred.byBucket[b.rating_bucket];
      if (!mkt) return { ...b, refiCoupon: null, deltaPp: null, deltaBp: null, interestDeltaM: null, flagged: false, proxy: null };
      // est refi coupon % = base + rate stress + bucket OAS + spread stress
      const refiCoupon = base + rateStressBp / 100 + mkt.oasPp + spreadStressBp / 100;
      const deltaPp = refiCoupon - b.coupon_pct;
      const deltaBp = deltaPp * 100;
      // annual interest Δ $M = Δcoupon(pp)/100 × size($bn) × 1000
      const interestDeltaM = (deltaPp / 100) * b.size_bn * 1000;
      return { ...b, refiCoupon, deltaPp, deltaBp, interestDeltaM, flagged: deltaBp > (parseFloat(gapThresholdBp) || 0), proxy: mkt.proxy, oasPp: mkt.oasPp };
    }).sort((a, b) => (a.maturity_year - b.maturity_year) || (b.size_bn - a.size_bn));
    const priced = rows.filter((r) => r.refiCoupon != null);
    const wallBn = maturing.reduce((s, b) => s + b.size_bn, 0);
    const pricedBn = priced.reduce((s, b) => s + b.size_bn, 0);
    const wavgOld = pricedBn ? priced.reduce((s, r) => s + r.coupon_pct * r.size_bn, 0) / pricedBn : null;
    const wavgNew = pricedBn ? priced.reduce((s, r) => s + r.refiCoupon * r.size_bn, 0) / pricedBn : null;
    const totalInterestDeltaM = priced.reduce((s, r) => s + r.interestDeltaM, 0);
    const greenBn = maturing.filter((b) => b.label !== 'conventional').reduce((s, b) => s + b.size_bn, 0);
    const flagged = priced.filter((r) => r.flagged);
    const years = Array.from(new Set(priced.map((r) => r.maturity_year))).sort();
    const byYear = years.map((y) => ({
      year: y,
      deltaM: Number(priced.filter((r) => r.maturity_year === y).reduce((s, r) => s + r.interestDeltaM, 0).toFixed(1)),
    }));
    return { rows, wallBn, pricedBn, wavgOld, wavgNew, totalInterestDeltaM, greenBn, flagged, byYear, count: maturing.length };
  }, [filtered, fred.byBucket, horizonYear, baseRatePct, rateStressBp, spreadStressBp, gapThresholdBp]);

  const horizonOptions = useMemo(() => {
    const out = [];
    for (let y = 2026; y <= 2040; y += 1) out.push(y);
    return out;
  }, []);

  // ── Backend analytics runners ──────────────────────────────────────────────
  const runCurves = useCallback(async () => {
    setCurves({ status: 'loading', data: null, error: null });
    try {
      const params = { base_rate_pct: parseFloat(baseRatePct) || 0 };
      if (ccyFilter !== 'All') params.currency = ccyFilter;
      const { data } = await axios.get('/api/v1/energy-bonds/curves', { params, timeout: 30000 });
      setCurves({ status: 'live', data, error: null });
    } catch (e) { setCurves({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); }
  }, [baseRatePct, ccyFilter]);

  const runLadderAnalytics = useCallback(async () => {
    setLadderAn({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        base_rate_pct: parseFloat(baseRatePct) || 0,
        horizon_year: horizonYear,
        bucket_oas_pp: oasMap || undefined,
        issuer: issuerFilter === 'All issuers' ? undefined : issuerFilter,
        currency: ccyFilter === 'All' ? undefined : ccyFilter,
      };
      const eb = {};
      Object.keys(ebitdaMap).forEach((k) => { const v = parseFloat(ebitdaMap[k]); if (v > 0) eb[k] = v; });
      if (Object.keys(eb).length) payload.issuer_ebitda_bn = eb;
      const { data } = await axios.post('/api/v1/energy-bonds/ladder-analytics', payload, { timeout: 30000 });
      setLadderAn({ status: 'live', data, error: null });
    } catch (e) { setLadderAn({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }); }
  }, [baseRatePct, horizonYear, oasMap, issuerFilter, ccyFilter, ebitdaMap]);

  const runRefiEconomics = useCallback(async () => {
    setRefiEco({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        base_rate_pct: parseFloat(baseRatePct) || 0,
        bucket_oas_pp: oasMap || undefined,
        horizon_year: horizonYear,
        rate_stress_bp: rateStressBp, spread_stress_bp: spreadStressBp,
        greenium_bp: parseFloat(greeniumBp) || 0,
        call_price_pct: parseFloat(callPricePct) || 100,
        expected_future_rate_pct: expFutureRatePct === '' ? undefined : parseFloat(expFutureRatePct),
        tender_price_pct: parseFloat(tenderPricePct) || 100,
        tender_participation_pct: parseFloat(tenderPartPct) || 0,
        issuer: issuerFilter === 'All issuers' ? undefined : issuerFilter,
        currency: ccyFilter === 'All' ? undefined : ccyFilter,
      };
      const { data } = await axios.post('/api/v1/energy-bonds/refi-economics', payload, { timeout: 30000 });
      setRefiEco({ status: 'live', data, error: null });
    } catch (e) { setRefiEco({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }); }
  }, [baseRatePct, oasMap, horizonYear, rateStressBp, spreadStressBp, greeniumBp, callPricePct, expFutureRatePct, tenderPricePct, tenderPartPct, issuerFilter, ccyFilter]);

  const runTransitionOverlay = useCallback(async () => {
    setTransOv({ status: 'loading', data: null, error: null });
    try {
      const it = {};
      Object.keys(transMap).forEach((k) => {
        const capex = parseFloat(transMap[k]?.capex);
        const score = parseFloat(transMap[k]?.score);
        if (!isNaN(capex) || !isNaN(score)) it[k] = { capex_bn: isNaN(capex) ? 0 : capex, risk_score: isNaN(score) ? 50 : score };
      });
      const payload = {
        base_rate_pct: parseFloat(baseRatePct) || 0,
        bucket_oas_pp: oasMap || undefined,
        horizon_year: parseInt(transHorizon, 10),
        spread_slope_bp_per_point: parseFloat(slopeBpPerPoint) || 0,
        issuer_transition: Object.keys(it).length ? it : undefined,
      };
      const { data } = await axios.post('/api/v1/energy-bonds/transition-overlay', payload, { timeout: 30000 });
      setTransOv({ status: 'live', data, error: null });
    } catch (e) { setTransOv({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message }); }
  }, [baseRatePct, oasMap, transHorizon, slopeBpPerPoint, transMap]);

  // Issuers in the current wall for the EBITDA / transition input grids
  const wallIssuers = useMemo(() => {
    if (!ladder.bonds) return [];
    return Array.from(new Set(ladder.bonds.map((b) => b.issuer))).sort();
  }, [ladder.bonds]);

  const curveScatter = useMemo(() => {
    if (curves.status !== 'live' || !curves.data) return [];
    return curves.data.bonds.map((b) => ({
      x: b.tenor_years, y: b.spread_bp, fitted: b.fitted_bp, name: `${b.ticker} ${b.coupon_pct}% '${String(b.maturity_year).slice(2)}`,
      rc: b.rich_cheap_bp, bucket: b.rating_bucket,
    }));
  }, [curves]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.indigo, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-10</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Maturity Wall Monitor — Energy &amp; Utility DCM</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>ICE BofA OAS via FRED (live join)</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Issuer Curves · DV01 · Rate Shocks</span>
          <span style={{ background: T.green + '22', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Greenium · Transition Capex</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Rate / Spread Stress</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Issuer-level refinancing risk for the energy &amp; utility bond complex: a maturity ladder built from a
        hand-authored extract of real issuers' benchmark bonds (approximate terms, labeled), joined onto <b>live
        rating-bucket OAS</b> for refi coupons, interest deltas and gap flags under user rate/spread stress — now with
        per-issuer <b>spread-curve construction and rich/cheap</b>, portfolio <b>duration / DV01 and full-repricing rate
        shocks</b>, <b>green-refi / call / tender economics</b>, and a <b>transition-capex funding-gap + climate-spread
        overlay</b>. Adjacent module: /climate-capital-markets (macro views) — this page is issuer-level refi risk.
      </div>

      {/* ── Controls ────────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={lblStyle}>
            Issuer
            <select style={{ ...inputStyle, width: 240, display: 'block', marginTop: 3 }} value={issuerFilter} onChange={(e) => setIssuerFilter(e.target.value)}>
              {issuers.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <label style={lblStyle}>
            Currency
            <select style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={ccyFilter} onChange={(e) => setCcyFilter(e.target.value)}>
              {['All', 'USD', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={lblStyle}>
            Stack ladder by
            <select style={{ ...inputStyle, width: 150, display: 'block', marginTop: 3 }} value={stackBy} onChange={(e) => setStackBy(e.target.value)}>
              <option value="bucket">Rating bucket</option>
              <option value="label">Green / SLB flag</option>
            </select>
          </label>
          <label style={lblStyle}>
            Refi horizon (maturing ≤)
            <select style={{ ...inputStyle, width: 100, display: 'block', marginTop: 3 }} value={horizonYear} onChange={(e) => setHorizonYear(parseInt(e.target.value, 10))}>
              {horizonOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label style={lblStyle}>
            Base rate % <span style={{ fontWeight: 400 }}>(user input — e.g. relevant govt/swap yield)</span>
            <input type="number" min="0" max="15" step="0.25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={baseRatePct} onChange={(e) => setBaseRatePct(e.target.value)} />
          </label>
          <label style={lblStyle}>
            Rate stress {fmtBps(rateStressBp)}
            <input type="range" min="0" max="300" step="25" style={{ display: 'block', width: 160, marginTop: 6 }} value={rateStressBp} onChange={(e) => setRateStressBp(parseInt(e.target.value, 10))} />
          </label>
          <label style={lblStyle}>
            Spread stress {fmtBps(spreadStressBp)}
            <input type="range" min="0" max="300" step="25" style={{ display: 'block', width: 160, marginTop: 6 }} value={spreadStressBp} onChange={(e) => setSpreadStressBp(parseInt(e.target.value, 10))} />
          </label>
          <label style={lblStyle}>
            Refi-gap flag threshold (bp coupon jump)
            <input type="number" min="0" max="1000" step="25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={gapThresholdBp} onChange={(e) => setGapThresholdBp(e.target.value)} />
          </label>
        </div>
      </div>

      {/* ── Maturity ladder ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={secH}>Maturity Ladder ($bn per year)</h2>
          <span style={chip}>GET /api/v1/energy-bonds/ladder</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={ladder.status} demoText={ladder.error} /></div>
        </div>
        {ladder.label && (
          <div style={{ background: '#fef3c7', color: '#92400e', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
            {ladder.label} (extract as of {ladder.asOf})
          </div>
        )}
        {wall ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={wall.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$bn maturing', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [fmtBn(v), n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {stackBy === 'bucket'
                  ? wall.buckets.map((bk) => (
                    <Bar key={bk} dataKey={`bk_${bk}`} stackId="wall" name={`${bk} bucket`} fill={BUCKET_COLOR[bk] || T.slate} />
                  ))
                  : wall.labels.map((lb) => (
                    <Bar key={lb} dataKey={`lb_${lb}`} stackId="wall" name={LABEL_NAME[lb] || lb} fill={LABEL_COLOR[lb] || T.slate} />
                  ))}
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
              {filtered.length} bonds · {fmtBn(wall.total)} outstanding in view · stacked by {stackBy === 'bucket' ? 'ICE BofA rating bucket (joins the live OAS feed)' : 'green / sustainability-linked / conventional flag'}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: T.sub }}>
            {ladder.status === 'loading' ? 'Loading bond extract…' : `Bond-ladder backend unreachable — nothing shown (this page never fabricates data). ${ladder.error ? `Error: ${String(ladder.error)}` : ''}`}
          </div>
        )}
      </div>

      {/* ── Refinancing cost panel ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={secH}>Refinancing Cost — Bonds Maturing ≤ {horizonYear}</h2>
          <span style={chip}>GET /api/v1/fred-spreads/series (ICE BofA OAS join)</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={fred.status} demoText={fred.error} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
          Est. refi coupon = base rate ({fmtPct(parseFloat(baseRatePct))}) + rate stress ({fmtBps(rateStressBp)}) + latest
          bucket OAS + spread stress ({fmtBps(spreadStressBp)}). Annual interest Δ = coupon Δ × size. The OAS indices are
          USD corporate/HY series — applied to EUR bonds as a stated proxy (no free EUR bucket OAS on FRED). Buckets missing
          from the keyless demo seed fall back to the grade aggregate, marked "proxy".
        </div>

        {refi && refi.count > 0 ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label={`Wall ≤ ${horizonYear}`} value={fmtBn(refi.wallBn)} sub={`${refi.count} bonds · green/SLB ${fmtBn(refi.greenBn)} (${refi.wallBn ? ((refi.greenBn / refi.wallBn) * 100).toFixed(0) : 0}%)`} />
              <Kpi label="Wavg existing coupon" value={fmtPct(refi.wavgOld)} sub="Size-weighted, maturing bonds" />
              <Kpi label="Wavg est. refi coupon" value={fmtPct(refi.wavgNew)} sub="Base + stress + bucket OAS" color={refi.wavgNew > refi.wavgOld ? T.red : T.green} />
              <Kpi label="Annual interest Δ" value={fmtM(refi.totalInterestDeltaM, 0)} sub="If entire wall refinanced at est. coupons" color={refi.totalInterestDeltaM > 0 ? T.red : T.green} />
              <Kpi label="Refinancing-gap flags" value={`${refi.flagged.length}`} sub={`Coupon jump > ${fmtBps(parseFloat(gapThresholdBp))}`} color={refi.flagged.length ? T.amber : T.green} />
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Annual interest Δ by maturity year ($M) under current stress</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={refi.byYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [fmtM(v, 1), 'Annual interest Δ']} />
                    <ReferenceLine y={0} stroke={T.slate} />
                    <Bar dataKey="deltaM" radius={[3, 3, 0, 0]}>
                      {refi.byYear.map((d, i) => <Cell key={i} fill={d.deltaM >= 0 ? T.red : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 0.8, minWidth: 280 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Current bucket OAS (latest observation)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Bucket</th><th style={th}>OAS</th><th style={th}>As of</th><th style={th}>Series</th></tr></thead>
                  <tbody>
                    {Object.keys(BUCKET_SERIES).map((bk) => {
                      const m = fred.byBucket ? fred.byBucket[bk] : null;
                      return (
                        <tr key={bk}>
                          <td style={{ ...td, fontWeight: 700, color: BUCKET_COLOR[bk] }}>{bk}</td>
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

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={th}>Issuer</th><th style={th}>Bond</th><th style={th}>Ccy</th><th style={th}>Rating</th>
                    <th style={th}>Flag</th><th style={th}>Size $bn</th><th style={th}>Matures</th>
                    <th style={th}>Coupon</th><th style={th}>Est. refi coupon</th><th style={th}>Δ coupon</th>
                    <th style={th}>Annual interest Δ</th><th style={th}>Gap flag</th>
                  </tr>
                </thead>
                <tbody>
                  {refi.rows.map((r) => (
                    <tr key={r.id} style={r.flagged ? { background: '#fef3c7' } : undefined}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.issuer}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.coupon_pct.toFixed(2)}% '{String(r.maturity_year).slice(2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.currency}</td>
                      <td style={td}><span style={{ background: (BUCKET_COLOR[r.rating_bucket] || T.slate) + '22', color: BUCKET_COLOR[r.rating_bucket] || T.slate, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>{r.rating}</span></td>
                      <td style={td}><span style={{ color: LABEL_COLOR[r.label], fontWeight: 700, fontSize: 11 }}>{r.label}</span></td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.size_bn.toFixed(2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.maturity_year}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.coupon_pct)}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.refiCoupon != null ? fmtPct(r.refiCoupon) : '—'}{r.proxy ? ' *' : ''}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: (r.deltaBp || 0) > 0 ? T.red : T.green }}>{r.deltaBp != null ? fmtBps(r.deltaBp) : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: (r.interestDeltaM || 0) > 0 ? T.red : T.green }}>{r.interestDeltaM != null ? fmtM(r.interestDeltaM, 1) : '—'}</td>
                      <td style={td}>{r.flagged ? <span style={{ background: '#fee2e2', color: T.red, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>REFI GAP</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>* refi coupon computed off a grade-aggregate OAS proxy (single bucket not in demo seed).</div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: T.sub }}>
            {(!filtered || !fred.byBucket) ? 'Waiting for the bond extract and the OAS feed — refi math requires both.' : `No bonds in the current view mature on or before ${horizonYear}. Extend the horizon or clear filters.`}
          </div>
        )}
      </div>

      {/* ── Issuer credit curves ────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={secH}>Issuer Credit Curves — OLS Spread vs Tenor + Rich/Cheap</h2>
          <button onClick={runCurves} disabled={curves.status === 'loading'} style={runBtn}>{curves.status === 'loading' ? 'Fitting…' : 'Build curves →'}</button>
          <span style={chip}>GET /api/v1/energy-bonds/curves</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={curves.status === 'idle' ? undefined : curves.status} demoText={curves.error} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
          Spread proxy: (coupon − base rate {fmtPct(parseFloat(baseRatePct))}) × 100 — an at-issue coupon-over-base screening
          convention (the extract has no prices), LABELED. Issuers with ≥3 bonds get their own OLS line; smaller curves fall
          back to the pooled sector fit. Rich/cheap = actual − fitted: positive = wide of own curve (cheap on this screen).
        </div>
        {curves.status === 'live' && curves.data && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.4, minWidth: 380 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Bond universe: spread (bp) vs tenor (y) — dots = bonds, dashes = fitted values</div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={curveScatter}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} label={{ value: 'Tenor (years)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'Spread (bp)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [fmtBps(v), n]} labelFormatter={(x) => `${Number(x).toFixed(1)}y`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Scatter dataKey="y" name="Actual spread" fill={T.indigo} />
                  <Scatter dataKey="fitted" name="Fitted (own/sector curve)" fill={T.gold} shape="diamond" />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Issuer</th><th style={th}>Curve</th><th style={th}>Intercept</th><th style={th}>Slope bp/yr</th><th style={th}>R²</th><th style={th}>Bonds</th></tr></thead>
                  <tbody>
                    {curves.data.curves.filter((c) => c.curve_source === 'issuer_ols').map((c) => (
                      <tr key={c.issuer}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{c.issuer}</td>
                        <td style={{ ...td, fontSize: 10.5 }}>{c.curve_source}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtBps(c.intercept_bp)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.slope_bp_per_yr, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{c.r2 != null ? c.r2.toFixed(2) : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{c.bonds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
                  {curves.data.curves.filter((c) => c.curve_source !== 'issuer_ols').length} issuers with &lt;3 bonds priced off their sector curve (documented fallback).
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 340 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Rich / cheap vs own curve (top 10 widest residuals)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Bond</th><th style={th}>Tenor</th><th style={th}>Spread</th><th style={th}>Fitted</th><th style={th}>Rich/cheap</th></tr></thead>
                <tbody>
                  {curves.data.bonds.slice(0, 10).map((b) => (
                    <tr key={b.id}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{b.ticker} {b.coupon_pct}% '{String(b.maturity_year).slice(2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(b.tenor_years, 1)}y</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtBps(b.spread_bp)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtBps(b.fitted_bp)}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: (b.rich_cheap_bp || 0) >= 0 ? T.green : T.red }}>
                        {fmtBps(b.rich_cheap_bp)} {(b.rich_cheap_bp || 0) >= 0 ? 'cheap' : 'rich'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{curves.data.methodology}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Portfolio ladder analytics: duration / DV01 / shocks / leverage ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={secH}>Wall Duration &amp; DV01 — Rate-Shock Table + Leverage Screen</h2>
          <button onClick={runLadderAnalytics} disabled={ladderAn.status === 'loading'} style={runBtn}>{ladderAn.status === 'loading' ? 'Pricing…' : 'Run ladder analytics →'}</button>
          <span style={chip}>POST /api/v1/energy-bonds/ladder-analytics</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={ladderAn.status === 'idle' ? undefined : ladderAn.status} demoText={ladderAn.error} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
          Each bond priced closed-form (annual-pay bullet) at ytm = base rate + bucket OAS ({oasMap ? 'live join forwarded' : 'engine defaults, labeled'}).
          DV01 = modified duration × MV × 1bp. Rate shocks reprice FULLY at the shocked yield (not the duration
          approximation); steepener = ≤5y −50bp / &gt;5y +50bp (labeled convention). Optional: enter issuer EBITDA ($bn)
          below for the wall/EBITDA leverage screen (labeled — extract is a partial curve).
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {wallIssuers.slice(0, 8).map((iss) => (
            <label key={iss} style={{ ...lblStyle, width: 150 }}>
              {iss.length > 20 ? `${iss.slice(0, 19)}…` : iss} EBITDA $bn
              <input type="number" min="0" step="0.5" placeholder="blank = skip" style={{ ...inputStyle, width: '100%', display: 'block', marginTop: 3 }}
                value={ebitdaMap[iss] || ''} onChange={(e) => setEbitdaMap((prev) => ({ ...prev, [iss]: e.target.value }))} />
            </label>
          ))}
        </div>
        {ladderAn.status === 'live' && ladderAn.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Wall market value" value={fmtM(ladderAn.data.aggregate.mv_usd_m, 0)} sub={`${ladderAn.data.bond_count} bonds, closed-form pricing`} />
              <Kpi label="Aggregate DV01" value={`$${fmtNum(ladderAn.data.aggregate.dv01_usd, 0)}`} sub="Σ per-bond ModD × MV × 1bp" color={T.indigo} />
              <Kpi label="Wavg modified duration" value={fmtNum(ladderAn.data.aggregate.wavg_mod_duration, 2)} sub="MV-weighted" color={T.indigo} />
              <Kpi label="+100bp parallel" value={fmtM(ladderAn.data.rate_shock_table.find((s) => s.shock === '+100bp parallel')?.mv_delta_usd_m, 0)}
                sub={`${fmtPct(ladderAn.data.rate_shock_table.find((s) => s.shock === '+100bp parallel')?.mv_delta_pct)} of MV — full repricing`} color={T.red} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Rate-shock table (full repricing, ΔMV $M)</div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={ladderAn.data.rate_shock_table}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="shock" tick={{ fontSize: 9 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [fmtM(v, 0), 'ΔMV']} />
                    <ReferenceLine y={0} stroke={T.slate} />
                    <Bar dataKey="mv_delta_usd_m" radius={[3, 3, 0, 0]}>
                      {ladderAn.data.rate_shock_table.map((s, i) => <Cell key={i} fill={s.mv_delta_usd_m >= 0 ? T.green : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.4, minWidth: 380, overflowX: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Top 10 DV01 contributors</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Bond</th><th style={th}>YTM</th><th style={th}>Price</th><th style={th}>Mod dur</th><th style={th}>DV01 $</th></tr></thead>
                  <tbody>
                    {[...ladderAn.data.bonds].sort((a, b) => b.dv01_usd - a.dv01_usd).slice(0, 10).map((b) => (
                      <tr key={b.id}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{b.ticker} {b.coupon_pct}% '{String(b.maturity_year).slice(2)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(b.ytm_pct)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(b.price, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(b.mod_duration, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>${fmtNum(b.dv01_usd, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ladderAn.data.leverage_screen && (
                <div style={{ flex: 1, minWidth: 320 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Refi capacity vs EBITDA (labeled screen)</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>Issuer</th><th style={th}>Wall ≤ {horizonYear}</th><th style={th}>Wall/EBITDA</th><th style={th}>Screen</th></tr></thead>
                    <tbody>
                      {ladderAn.data.leverage_screen.rows.map((r) => (
                        <tr key={r.issuer}>
                          <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.issuer}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtBn(r.wall_to_horizon_bn)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{r.wall_to_ebitda_x != null ? `${r.wall_to_ebitda_x}×` : '—'}</td>
                          <td style={td}>{r.screen === 'elevated'
                            ? <span style={{ background: '#fee2e2', color: T.red, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>ELEVATED</span>
                            : <span style={{ background: '#dcfce7', color: T.green, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>OK</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{ladderAn.data.leverage_screen.note}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Refi economics: greenium / call / tender ────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={secH}>Refi Economics — Greenium, Call/Make-Whole Breakeven, Tender Combo</h2>
          <button onClick={runRefiEconomics} disabled={refiEco.status === 'loading'} style={runBtn}>{refiEco.status === 'loading' ? 'Computing…' : 'Run refi economics →'}</button>
          <span style={chip}>POST /api/v1/energy-bonds/refi-economics</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={refiEco.status === 'idle' ? undefined : refiEco.status} demoText={refiEco.error} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <label style={lblStyle}>Greenium (bp) <span style={{ fontWeight: 400 }}>— labeled observation, 2–8bp IG typical</span>
            <input type="number" min="0" max="50" step="1" style={{ ...inputStyle, width: 80, display: 'block', marginTop: 3 }} value={greeniumBp} onChange={(e) => setGreeniumBp(e.target.value)} />
          </label>
          <label style={lblStyle}>Call price (per 100)
            <input type="number" min="100" max="130" step="0.5" style={{ ...inputStyle, width: 80, display: 'block', marginTop: 3 }} value={callPricePct} onChange={(e) => setCallPricePct(e.target.value)} />
          </label>
          <label style={lblStyle}>Expected future refi rate %
            <input type="number" min="0" max="20" step="0.25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={expFutureRatePct} onChange={(e) => setExpFutureRatePct(e.target.value)} />
          </label>
          <label style={lblStyle}>Tender price (per 100)
            <input type="number" min="90" max="125" step="0.5" style={{ ...inputStyle, width: 80, display: 'block', marginTop: 3 }} value={tenderPricePct} onChange={(e) => setTenderPricePct(e.target.value)} />
          </label>
          <label style={lblStyle}>Tender participation %
            <input type="number" min="0" max="100" step="5" style={{ ...inputStyle, width: 80, display: 'block', marginTop: 3 }} value={tenderPartPct} onChange={(e) => setTenderPartPct(e.target.value)} />
          </label>
        </div>
        {refiEco.status === 'live' && refiEco.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Wall analysed" value={fmtBn(refiEco.data.totals.size_bn)} sub={`${refiEco.data.bond_count} bonds ≤ ${horizonYear}`} />
              <Kpi label="Greenium saving" value={`${fmtM(refiEco.data.totals.green_saving_musd_yr, 1)}/yr`} sub={`If green/SLB-eligible refi at −${greeniumBp}bp (labeled)`} color={T.green} />
              <Kpi label="Tender combo upfront" value={fmtM(refiEco.data.totals.tender_upfront_musd, 0)} sub={`@ ${tenderPricePct} px, ${tenderPartPct}% participation`} color={T.amber} />
              <Kpi label="Tender annual saving" value={`${fmtM(refiEco.data.totals.tender_saving_musd_yr, 0)}/yr`} sub="Old coupon − refi coupon on tendered amount" color={refiEco.data.totals.tender_saving_musd_yr >= 0 ? T.green : T.red} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
                <thead>
                  <tr>
                    <th style={th}>Bond</th><th style={th}>Flag</th><th style={th}>Coupon</th>
                    <th style={th}>Refi (conv)</th><th style={th}>Refi (green)</th><th style={th}>Greenium $/yr</th>
                    <th style={th}>Call b/e rate r*</th><th style={th}>Call verdict</th>
                    <th style={th}>Tender upfront</th><th style={th}>Payback</th>
                  </tr>
                </thead>
                <tbody>
                  {refiEco.data.bonds.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.ticker} {r.coupon_pct}% '{String(r.maturity_year).slice(2)}</td>
                      <td style={td}><span style={{ color: LABEL_COLOR[r.label], fontWeight: 700, fontSize: 11 }}>{r.label}</span></td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.coupon_pct)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.refi_coupon_conventional_pct)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: r.green_eligible ? T.green : T.slate }}>{r.green_eligible ? fmtPct(r.refi_coupon_green_pct) : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.green }}>{r.green_eligible ? `${fmtM(r.greenium_saving_musd_yr, 2)}/yr` : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.call.breakeven_future_rate_pct)}</td>
                      <td style={td}>{r.call.verdict ? (
                        <span style={{ background: r.call.verdict === 'refi_now' ? '#fee2e2' : '#dcfce7', color: r.call.verdict === 'refi_now' ? T.red : T.green, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>
                          {r.call.verdict === 'refi_now' ? 'REFI NOW' : 'WAIT'}
                        </span>) : '—'}
                      </td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.tender_combo.upfront_cost_musd, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.tender_combo.payback_years != null ? `${fmtNum(r.tender_combo.payback_years, 1)}y` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              {refiEco.data.methodology.call_breakeven} · {refiEco.data.methodology.green_refi}
            </div>
          </>
        )}
      </div>

      {/* ── Transition capex / climate-spread overlay ───────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={secH}>Transition Capex × Refi Wall — Funding Gap, Green-Share Trend, Climate-Spread Overlay</h2>
          <button onClick={runTransitionOverlay} disabled={transOv.status === 'loading'} style={runBtn}>{transOv.status === 'loading' ? 'Computing…' : 'Run overlay →'}</button>
          <span style={chip}>POST /api/v1/energy-bonds/transition-overlay</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={transOv.status === 'idle' ? undefined : transOv.status} demoText={transOv.error} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
          Enter each issuer's transition capex plan ($bn to horizon) and a transition-risk score (0–100, your assessment).
          Stressed refi spread = bucket spread + score × {slopeBpPerPoint}bp/point (LABELED MODEL ASSUMPTION — the slope
          is user-adjustable, not a market calibration). Issuers left blank default to score 50 / capex 0.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-end' }}>
          <label style={lblStyle}>Overlay horizon
            <select style={{ ...inputStyle, width: 100, display: 'block', marginTop: 3 }} value={transHorizon} onChange={(e) => setTransHorizon(e.target.value)}>
              {horizonOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label style={lblStyle}>Spread slope (bp per score point)
            <input type="number" min="0" max="10" step="0.25" style={{ ...inputStyle, width: 90, display: 'block', marginTop: 3 }} value={slopeBpPerPoint} onChange={(e) => setSlopeBpPerPoint(e.target.value)} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {wallIssuers.slice(0, 8).map((iss) => (
            <div key={iss} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', minWidth: 170 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{iss.length > 24 ? `${iss.slice(0, 23)}…` : iss}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <label style={{ ...lblStyle, fontSize: 10 }}>Capex $bn
                  <input type="number" min="0" step="0.5" style={{ ...inputStyle, width: 70, display: 'block', marginTop: 2 }}
                    value={transMap[iss]?.capex || ''} onChange={(e) => setTransMap((prev) => ({ ...prev, [iss]: { ...prev[iss], capex: e.target.value } }))} />
                </label>
                <label style={{ ...lblStyle, fontSize: 10 }}>Risk 0–100
                  <input type="number" min="0" max="100" step="5" style={{ ...inputStyle, width: 70, display: 'block', marginTop: 2 }}
                    value={transMap[iss]?.score || ''} onChange={(e) => setTransMap((prev) => ({ ...prev, [iss]: { ...prev[iss], score: e.target.value } }))} />
                </label>
              </div>
            </div>
          ))}
        </div>
        {transOv.status === 'live' && transOv.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Total funding gap" value={fmtBn(transOv.data.totals.funding_gap_bn)} sub="Σ max(0, capex − refi-fundable) across issuers with plans" color={transOv.data.totals.funding_gap_bn > 0 ? T.amber : T.green} />
              <Kpi label="Stressed wall cost Δ" value={`${fmtM(transOv.data.totals.stressed_cost_delta_musd_yr, 0)}/yr`} sub={`Climate-spread overlay @ ${slopeBpPerPoint}bp/point (labeled)`} color={T.red} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.5, minWidth: 420, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={th}>Issuer</th><th style={th}>Wall ≤ {transOv.data.inputs.horizon_year}</th><th style={th}>Green/SLB %</th>
                      <th style={th}>Capex plan</th><th style={th}>Funding gap</th><th style={th}>Score</th>
                      <th style={th}>Spread add-on</th><th style={th}>Cost Δ $M/yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...transOv.data.issuers].sort((a, b) => b.stressed_cost_delta_musd_yr - a.stressed_cost_delta_musd_yr).map((r) => (
                      <tr key={r.issuer} style={r.funding_gap_bn > 0 ? { background: '#fffbeb' } : undefined}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.issuer}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtBn(r.wall_to_horizon_bn)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: r.green_slb_share_pct > 50 ? T.green : T.slate }}>{fmtPct(r.green_slb_share_pct, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{r.transition_capex_bn ? fmtBn(r.transition_capex_bn) : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.funding_gap_bn > 0 ? T.amber : T.green }}>{r.transition_capex_bn ? fmtBn(r.funding_gap_bn) : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono }} title={r.score_source}>{fmtNum(r.risk_score, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtBps(r.stressed_spread_addon_bp)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.red }}>+{fmtNum(r.stressed_cost_delta_musd_yr, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Green/SLB share of the maturity ladder by year (%)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={transOv.data.green_share_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="bn" tick={{ fontSize: 10 }} label={{ value: '$bn', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [n === 'Green share %' ? fmtPct(v, 0) : fmtBn(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="bn" dataKey="total_bn" name="Maturing $bn" fill={T.slate} fillOpacity={0.35} radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="bn" dataKey="green_slb_bn" name="Green/SLB $bn" fill={T.green} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                    <Line yAxisId="pct" dataKey="green_share_pct" name="Green share %" stroke={T.teal} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{transOv.data.methodology}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Backends: api/v1/routes/energy_bond_ladder.py (hand-authored real-issuer extract + issuer OLS curves, duration/DV01
        with full-repricing rate shocks, greenium/call/tender refi economics, transition-capex overlay — all documented
        in-response) · api/v1/routes/fred_spreads.py (real ICE BofA OAS via FRED, Live/Demo; the live join is forwarded to
        every analytics call). In-page refi coupon math documented above. No PRNG anywhere.
      </div>
    </div>
  );
}
