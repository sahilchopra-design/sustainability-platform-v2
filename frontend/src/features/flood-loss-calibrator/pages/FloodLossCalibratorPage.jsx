import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Empirical Flood Loss Calibrator
// Real NFIP flood-insurance claims (FEMA OpenFEMA — free, keyless, public domain)
// aggregated server-side into an empirical paid-loss distribution, then used to
// sanity-check a user-supplied modelled EP curve.
// Live data: GET /api/v1/openfema/claims-summary?state=XX , GET /api/v1/openfema/states
// Observed percentiles are per-claim paid-loss percentiles (building + contents
// + ICC), not a portfolio EP curve — labeled as such. No fabricated numbers.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const STATES = [
  { code: 'FL', name: 'Florida' }, { code: 'TX', name: 'Texas' },
  { code: 'LA', name: 'Louisiana' }, { code: 'NY', name: 'New York' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NC', name: 'North Carolina' },
  { code: 'SC', name: 'South Carolina' }, { code: 'CA', name: 'California' },
  { code: 'MS', name: 'Mississippi' }, { code: 'VA', name: 'Virginia' },
];

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live — OpenFEMA</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Fetching claims</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — API unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — pick a state</span>;
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
const selectStyle = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff' };
const inputStyle = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: 110, boxSizing: 'border-box' };

const usd = (v) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const num = (v) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US');

// Default modelled EP points the user can edit (return period → modelled per-claim loss).
// These are placeholder model inputs the user replaces with their own EP curve — not data.
const DEFAULT_MODEL = [
  { rp: 2, pct: 50, modelled: 8000 },
  { rp: 10, pct: 90, modelled: 45000 },
  { rp: 20, pct: 95, modelled: 80000 },
  { rp: 100, pct: 99, modelled: 200000 },
];

export default function FloodLossCalibratorPage() {
  const [state, setState] = useState('FL');
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [model, setModel] = useState(DEFAULT_MODEL);

  const run = useCallback(async () => {
    setStatus('loading'); setErr(null);
    try {
      const { data: d } = await axios.get('/api/v1/openfema/claims-summary', { params: { state, start_year: 2005, end_year: 2026 } });
      setData(d);
      setStatus('live');
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message);
      setStatus('demo');
      setData(null);
    }
  }, [state]);

  const pcts = data?.percentiles_usd || {};
  const modelRows = useMemo(() => model.map((m) => {
    const key = `P${m.pct}`;
    const observed = pcts[key] != null ? pcts[key] : null;
    const dev = (observed != null && m.modelled) ? ((m.modelled - observed) / observed) * 100 : null;
    return { ...m, observed, dev };
  }), [model, pcts]);

  const updateModel = (i, key, val) => setModel((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: Number(val) } : r));

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Empirical Flood Loss Calibrator</h1>
        <Badge status={status} demoText={err ? 'OpenFEMA unavailable' : undefined} />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 920, marginTop: 4 }}>
        Real NFIP flood-insurance claims from the FEMA OpenFEMA API, aggregated into an empirical
        per-claim paid-loss distribution — then compare it against your own modelled EP-curve points to
        see where a cat model deviates from observed history. Paid loss per claim = building + contents + ICC.
      </p>

      <div style={{ ...card, display: 'flex', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>State</div>
          <select style={selectStyle} value={state} onChange={(e) => setState(e.target.value)}>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <button onClick={run} disabled={status === 'loading'}
          style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: status === 'loading' ? 'wait' : 'pointer', fontFamily: T.font }}>
          {status === 'loading' ? 'Fetching…' : 'Fetch NFIP claims'}
        </button>
        <div style={{ fontSize: 11, color: T.sub }}>Loss years 2005–2026 · large states sampled (most recent first)</div>
      </div>

      {status === 'demo' && <div style={{ ...card, borderColor: '#fde68a', background: '#fffbeb', color: '#92400e', fontSize: 12 }}>OpenFEMA API did not respond ({err}). This module needs the live keyless FEMA API — retry when reachable.</div>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <Kpi label="Matching claims" value={num(data.total_claims_matching)} sub={data.sample_truncated ? `sampled ${num(data.fetched_records)}` : 'full population'} />
            <Kpi label="Paid claims" value={num(data.paid_claims)} sub={`${num(data.zero_paid_or_closed_without_payment)} zero-paid`} />
            <Kpi label="Total paid" value={usd(data.total_paid_usd)} color={T.teal} />
            <Kpi label="Mean paid / claim" value={usd(data.mean_paid_usd)} />
            <Kpi label="Max paid claim" value={usd(data.max_paid_usd)} color={T.red} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(280px, 1fr)', gap: 18 }}>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Empirical loss severity histogram</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.histogram} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="bin" tick={{ fontSize: 9.5, fill: T.sub }} angle={-35} textAnchor="end" interval={0} height={50} />
                  <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v, n) => n === 'paid_claims' ? [num(v), 'Paid claims'] : v} />
                  <Bar dataKey="paid_claims" fill={T.blue} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Observed percentiles (per-claim paid)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Percentile</th><th style={{ ...th, textAlign: 'right' }}>Paid loss</th></tr></thead>
                <tbody>
                  {['P10', 'P25', 'P50', 'P75', 'P90', 'P95', 'P99'].map((p) => (
                    <tr key={p}><td style={{ ...td, fontFamily: T.mono }}>{p}</td><td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{usd(pcts[p])}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>Per-claim paid-loss percentiles, not a portfolio EP curve.</div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Modelled vs observed deviation</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Enter your modelled per-claim loss at each severity percentile. Deviation = (modelled − observed) / observed.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Return period</th><th style={th}>Percentile</th><th style={{ ...th, textAlign: 'right' }}>Modelled ($)</th><th style={{ ...th, textAlign: 'right' }}>Observed ($)</th><th style={{ ...th, textAlign: 'right' }}>Deviation</th></tr></thead>
              <tbody>
                {modelRows.map((r, i) => (
                  <tr key={r.pct}>
                    <td style={{ ...td, fontFamily: T.mono }}>1-in-{r.rp}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>P{r.pct}</td>
                    <td style={{ ...td, textAlign: 'right' }}><input style={inputStyle} type="number" value={r.modelled} onChange={(e) => updateModel(i, 'modelled', e.target.value)} /></td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{usd(r.observed)}</td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: r.dev == null ? T.sub : Math.abs(r.dev) > 50 ? T.red : Math.abs(r.dev) > 20 ? T.amber : T.green }}>
                      {r.dev == null ? '—' : (r.dev > 0 ? '+' : '') + r.dev.toFixed(0) + '%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={modelRows} margin={{ top: 16, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="pct" tickFormatter={(v) => `P${v}`} tick={{ fontSize: 11, fill: T.sub }} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v) => usd(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="observed" name="Observed (NFIP)" stroke={T.teal} strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="modelled" name="Modelled (yours)" stroke={T.purple} strokeWidth={2.2} strokeDasharray="5 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>
            Source: {data.source?.dataset} · {data.source?.license} · {data.source?.disclaimer}
          </div>
        </>
      )}
    </div>
  );
}
