import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Credit Spread Climate Monitor
// Real ICE BofA option-adjusted spreads (via FRED) across rating buckets, the
// IG-vs-HY differential, and a transition-risk pricing panel that joins a
// documented sector→rating-migration mapping against the real OAS curve.
// Live data: GET /api/v1/fred-spreads/catalog , /series , /status
//   FRED needs a free key (env FRED_API_KEY). Without it, the backend returns a
//   labeled seeded real historical sample (mode=demo-seed) shown with a Demo badge.
// The OAS curve is real market data; the sector→rating mapping is a STATED model
// assumption (documented in-panel), not fabricated data. Correlation/fit are
// computed with real least-squares math.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const SERIES_COLOR = {
  BAMLC0A0CM: '#0369a1', BAMLC0A1CAAA: '#15803d', BAMLC0A2CAA: '#0f766e',
  BAMLC0A3CA: '#4f46e5', BAMLC0A4CBBB: '#6d28d9', BAMLH0A0HYM2: '#b45309',
  BAMLH0A1HYBB: '#c2410c', BAMLH0A2HYB: '#b91c1c', BAMLH0A3HYC: '#7f1d1d',
};

// Sector → implied credit rating bucket + platform transition-risk score (0-100).
// STATED MODEL ASSUMPTION, not market data: maps each sector to the rating bucket
// its median issuer trades near, plus a transition-risk score consistent with the
// platform's sector taxonomy (higher = more exposed to a disorderly transition).
const SECTOR_MAP = [
  { sector: 'Thermal Coal & Mining', bucket: 'BB', transition: 92 },
  { sector: 'Oil & Gas (Upstream)', bucket: 'BBB', transition: 84 },
  { sector: 'Integrated Utilities (fossil-heavy)', bucket: 'BBB', transition: 71 },
  { sector: 'Airlines & Aviation', bucket: 'BB', transition: 68 },
  { sector: 'Cement & Steel', bucket: 'BBB', transition: 66 },
  { sector: 'Autos (ICE-weighted)', bucket: 'A', transition: 58 },
  { sector: 'Chemicals', bucket: 'BBB', transition: 52 },
  { sector: 'Real Estate (CRE)', bucket: 'BBB', transition: 44 },
  { sector: 'Diversified Banks', bucket: 'A', transition: 38 },
  { sector: 'Renewables & Clean Power', bucket: 'BBB', transition: 22 },
  { sector: 'Technology & Software', bucket: 'A', transition: 16 },
  { sector: 'Healthcare', bucket: 'A', transition: 12 },
];
const BUCKET_TO_SERIES = { AAA: 'BAMLC0A1CAAA', AA: 'BAMLC0A2CAA', A: 'BAMLC0A3CA', BBB: 'BAMLC0A4CBBB', BB: 'BAMLH0A1HYBB', B: 'BAMLH0A2HYB', CCC: 'BAMLH0A3HYC' };

const Badge = ({ mode }) => {
  if (mode === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live — FRED</span>;
  if (mode === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Loading</span>;
  if (mode === 'demo-seed') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo — seeded OAS (set FRED_API_KEY)</span>;
  return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Backend unavailable</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };

const bps = (v) => (v == null || isNaN(v)) ? '—' : `${(v * 100).toFixed(0)} bps`;

// Ordinary least squares: returns {slope, intercept, r2}
function ols(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  points.forEach((p) => { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) ** 2; });
  if (sxx === 0 || syy === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, r2: r * r, r };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve Instrument panel — instrument (FIGI, via OpenFIGI) -> issuer (LEI,
// via GLEIF) identification chain for a single ISIN/CUSIP/ticker. Both legs
// hit real, free, keyless APIs (see backend/api/v1/routes/openfigi.py); no
// seeded fallback exists for this panel — a failed lookup is shown as an
// explicit error, not silently replaced with fabricated data.
// ─────────────────────────────────────────────────────────────────────────────
const ResolveInstrumentBadge = ({ status }) => {
  if (status === 'loading') return <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Resolving</span>;
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live — OpenFIGI + GLEIF</span>;
  if (status === 'error') return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Lookup failed</span>;
  return null;
};

function ResolveInstrumentPanel() {
  const [isin, setIsin] = useState('US0378331005');
  const [status, setStatus] = useState('idle'); // idle | loading | live | error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const resolve = useCallback(async () => {
    const clean = isin.trim().toUpperCase();
    if (clean.length !== 12) { setStatus('error'); setErrMsg('ISIN must be a 12-character alphanumeric code.'); setResult(null); return; }
    setStatus('loading'); setErrMsg('');
    try {
      const { data } = await axios.get(`/api/v1/openfigi/isin-to-issuer/${clean}`, { timeout: 20000 });
      setResult(data);
      setStatus('live');
    } catch (e) {
      setResult(null);
      setStatus('error');
      setErrMsg(e?.response?.data?.detail || e.message || 'Lookup failed.');
    }
  }, [isin]);

  const figiMatches = result?.instrument?.figi_matches || [];
  const issuer = result?.issuer;

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Resolve instrument → issuer</div>
        <ResolveInstrumentBadge status={status} />
      </div>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>
        Enter an ISIN to chain instrument identification (OpenFIGI: FIGI, ticker, exchange, security type)
        into issuer identification (GLEIF: legal entity behind the ISIN, if resolvable). Instrument-level
        and entity-level identifiers are otherwise unlinked on this platform.
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={isin}
          onChange={(e) => setIsin(e.target.value)}
          placeholder="ISIN, e.g. US0378331005"
          style={{ fontFamily: T.mono, fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, width: 220 }}
          onKeyDown={(e) => { if (e.key === 'Enter') resolve(); }}
        />
        <button
          onClick={resolve}
          disabled={status === 'loading'}
          style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: T.indigo, color: '#fff', opacity: status === 'loading' ? 0.6 : 1 }}
        >
          Resolve
        </button>
      </div>

      {status === 'error' && <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 8 }}>{errMsg}</div>}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Instrument (FIGI · OpenFIGI)</div>
            {figiMatches.length === 0 && <div style={{ fontSize: 12, color: T.sub }}>{result.instrument.figi_error || 'No FIGI match.'}</div>}
            {figiMatches.map((m) => (
              <div key={m.figi} style={{ fontSize: 12, marginBottom: 6, padding: '6px 8px', background: T.cream, borderRadius: 6 }}>
                <div style={{ fontWeight: 700 }}>{m.name} <span style={{ color: T.sub, fontWeight: 400 }}>({m.ticker} · {m.exch_code})</span></div>
                <div style={{ fontFamily: T.mono, color: T.sub }}>FIGI {m.figi} · {m.security_type} · {m.market_sector}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Issuer (LEI · GLEIF)</div>
            {issuer?.resolved ? (
              <div style={{ fontSize: 12, padding: '6px 8px', background: T.cream, borderRadius: 6 }}>
                <div style={{ fontWeight: 700 }}>{issuer.entity.name}</div>
                <div style={{ fontFamily: T.mono, color: T.sub }}>LEI {issuer.entity.lei} · {issuer.entity.jurisdiction} · {issuer.entity.entity_status}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.sub }}>{issuer?.error || 'Not resolvable — GLEIF has no LEI record linked to this ISIN.'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreditSpreadClimateMonitorPage() {
  const [mode, setMode] = useState('loading');
  const [series, setSeries] = useState([]);
  const [latest, setLatest] = useState({}); // series id -> latest value
  const [source, setSource] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ids = ['BAMLC0A0CM', 'BAMLC0A4CBBB', 'BAMLH0A0HYM2', 'BAMLH0A3HYC', 'BAMLH0A1HYBB', 'BAMLC0A3CA'];
        const { data } = await axios.get('/api/v1/fred-spreads/series', { params: { ids: ids.join(','), observation_start: '2020-01-01' } });
        if (!alive) return;
        setSeries(data.series || []);
        setSource(data.source || '');
        const lt = {};
        (data.series || []).forEach((s) => { const obs = s.observations || []; if (obs.length) lt[s.id] = obs[obs.length - 1].value; });
        setLatest(lt);
        setMode(data.mode === 'live' ? 'live' : 'demo-seed');
      } catch { if (alive) setMode('error'); }
    })();
    return () => { alive = false; };
  }, []);

  // Merge series into one time-indexed frame for the chart
  const chartData = useMemo(() => {
    const byDate = {};
    series.forEach((s) => (s.observations || []).forEach((o) => {
      byDate[o.date] = byDate[o.date] || { date: o.date };
      byDate[o.date][s.id] = o.value;
    }));
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [series]);

  const igHy = useMemo(() => chartData.map((r) => ({
    date: r.date,
    diff: (r.BAMLH0A0HYM2 != null && r.BAMLC0A0CM != null) ? r.BAMLH0A0HYM2 - r.BAMLC0A0CM : null,
  })).filter((r) => r.diff != null), [chartData]);

  // Transition-risk scatter: x = transition score, y = current OAS of mapped rating bucket
  const scatter = useMemo(() => SECTOR_MAP.map((s) => {
    const sid = BUCKET_TO_SERIES[s.bucket];
    const oas = latest[sid];
    return { ...s, oas, x: s.transition, y: oas };
  }).filter((s) => s.oas != null), [latest]);

  const fit = useMemo(() => ols(scatter.map((s) => ({ x: s.x, y: s.y }))), [scatter]);
  const fitLine = useMemo(() => {
    if (!fit || !scatter.length) return [];
    const xs = scatter.map((s) => s.x);
    const min = Math.min(...xs), max = Math.max(...xs);
    return [{ x: min, y: fit.intercept + fit.slope * min }, { x: max, y: fit.intercept + fit.slope * max }];
  }, [fit, scatter]);

  const igLatest = latest.BAMLC0A0CM, hyLatest = latest.BAMLH0A0HYM2;

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Credit Spread Climate Monitor</h1>
        <Badge mode={mode} />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 940, marginTop: 4 }}>
        Real ICE BofA option-adjusted spreads by rating bucket, the investment-grade vs high-yield risk
        premium, and a transition-risk pricing lens that maps sector transition scores onto the live OAS
        curve. The spread data is real market data; the sector→rating mapping is a stated model assumption.
      </p>

      {mode === 'error' && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>The FRED spreads backend did not respond. Start the backend to load /api/v1/fred-spreads.</div>}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <Kpi label="IG Corp Master OAS" value={bps(igLatest)} color={T.blue} sub="ICE BofA US Corporate" />
        <Kpi label="HY Master II OAS" value={bps(hyLatest)} color={T.amber} sub="ICE BofA US High Yield" />
        <Kpi label="HY − IG differential" value={(igLatest != null && hyLatest != null) ? bps(hyLatest - igLatest) : '—'} color={T.red} sub="risk premium" />
        <Kpi label="Transition–spread R²" value={fit ? fit.r2.toFixed(2) : '—'} color={T.purple} sub={fit ? `slope ${(fit.slope * 100).toFixed(1)} bps/pt` : ''} />
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Option-adjusted spreads by rating bucket (%)</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.sub }} minTickGap={30} />
            <YAxis tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {series.map((s) => (
              <Line key={s.id} type="monotone" dataKey={s.id} name={s.label || s.id} stroke={SERIES_COLOR[s.id] || T.slate} strokeWidth={1.7} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(340px, 1.1fr)', gap: 18 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>HY − IG differential (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={igHy} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.sub }} minTickGap={30} />
              <YAxis tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v) => `${v.toFixed(2)}%`} />
              <Line type="monotone" dataKey="diff" name="HY − IG" stroke={T.red} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Transition risk vs spread</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Each point = a sector at its mapped rating bucket's live OAS. Line = least-squares fit.</div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="Transition score" domain={[0, 100]} tick={{ fontSize: 11, fill: T.sub }} label={{ value: 'Transition score', position: 'insideBottom', offset: -2, fontSize: 10, fill: T.sub }} />
              <YAxis type="number" dataKey="y" name="OAS %" tick={{ fontSize: 11, fill: T.sub }} />
              <ZAxis range={[80, 80]} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v, n) => n === 'OAS %' ? `${v}%` : v} labelFormatter={() => ''} />
              <Scatter data={scatter} fill={T.purple} />
              {fitLine.length === 2 && <Scatter data={fitLine} line={{ stroke: T.slate, strokeWidth: 1.5, strokeDasharray: '5 3' }} shape={() => null} legendType="none" />}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Sector → rating → spread mapping</div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Stated model assumption: each sector maps to the rating bucket its median issuer trades near; the OAS column is that bucket's live ICE BofA spread. FRED does not publish free sector-level OAS, so this join is explicit, not a fabricated per-sector series.</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Sector</th><th style={th}>Transition score</th><th style={th}>Mapped rating</th><th style={{ ...th, textAlign: 'right' }}>Live OAS</th></tr></thead>
          <tbody>
            {scatter.sort((a, b) => b.transition - a.transition).map((s) => (
              <tr key={s.sector}>
                <td style={td}>{s.sector}</td>
                <td style={{ ...td, fontFamily: T.mono }}>
                  <span style={{ display: 'inline-block', width: 44, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${T.green}, ${T.red})`, marginRight: 6, verticalAlign: 'middle', opacity: 0.4 }} />
                  {s.transition}
                </td>
                <td style={{ ...td, fontFamily: T.mono }}>{s.bucket}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{bps(s.oas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResolveInstrumentPanel />

      <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>Source: {source || 'ICE BofA OAS via FRED'} · Spreads in percentage points (1% = 100 bps).</div>
    </div>
  );
}
