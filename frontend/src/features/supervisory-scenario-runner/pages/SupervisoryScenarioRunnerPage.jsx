import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Supervisory Scenario Runner
// Real NGFS Phase 5 scenario paths (carbon price, GDP, emissions, energy mix)
// per scenario × region × year, driving a stress-delta view vs Current Policies.
// Live data: GET /api/v1/ngfs-extract/scenarios , /variables
//   (backend serves backend/data/ngfs_phase5_extract.json — a labeled real
//    seeded extract; IIASA NGFS Scenario Explorer, CC BY 4.0).
// No fabricated numbers: every series comes from the extract; deltas are
// computed locally from those series.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const SCEN_COLOR = {
  net_zero_2050: T.green, below_2c: T.teal, delayed_transition: T.amber,
  divergent_net_zero: T.purple, nationally_determined: T.blue,
  fragmented_world: '#9a3412', current_policies: T.red, ndcs: T.blue,
};
const colorFor = (id, i) => SCEN_COLOR[id] || ['#1b3a5c', '#6d28d9', '#0f766e', '#b45309', '#b91c1c', '#0369a1'][i % 6];

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Loading extract</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — extract unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle</span>;
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
const selectStyle = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff' };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };

const fmt = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });

const BASELINE = 'current_policies';

export default function SupervisoryScenarioRunnerPage() {
  const [status, setStatus] = useState('loading');
  const [extract, setExtract] = useState(null);
  const [region, setRegion] = useState('World');
  const [variable, setVariable] = useState('carbon_price');
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get('/api/v1/ngfs-extract/scenarios');
        if (!alive) return;
        setExtract(data);
        setStatus('live');
        if (data.regions?.length && !data.regions.find((r) => r.id === 'World')) setRegion(data.regions[0].id);
        if (data.variables?.length) setVariable(data.variables[0].id);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e.message);
        setStatus('demo');
      }
    })();
    return () => { alive = false; };
  }, []);

  const varDef = useMemo(
    () => extract?.variables?.find((v) => v.id === variable) || null,
    [extract, variable]
  );

  // Build the per-scenario trajectory for the chosen region+variable
  const chartData = useMemo(() => {
    if (!extract) return [];
    const years = extract.years || [];
    return years.map((yr, i) => {
      const row = { year: yr };
      extract.scenarios.forEach((s) => {
        const series = extract.data?.[s.id]?.[region]?.[variable];
        row[s.id] = Array.isArray(series) ? series[i] : null;
      });
      return row;
    });
  }, [extract, region, variable]);

  // Stress delta at final year vs Current Policies baseline
  const deltaRows = useMemo(() => {
    if (!extract) return [];
    const years = extract.years || [];
    const lastIdx = years.length - 1;
    const base = extract.data?.[BASELINE]?.[region]?.[variable];
    const baseVal = Array.isArray(base) ? base[lastIdx] : null;
    return extract.scenarios
      .filter((s) => s.id !== BASELINE)
      .map((s) => {
        const series = extract.data?.[s.id]?.[region]?.[variable];
        const val = Array.isArray(series) ? series[lastIdx] : null;
        const abs = (val != null && baseVal != null) ? val - baseVal : null;
        const pct = (abs != null && baseVal) ? (abs / Math.abs(baseVal)) * 100 : null;
        return { id: s.id, name: s.name || s.id, endValue: val, baseValue: baseVal, abs, pct };
      });
  }, [extract, region, variable]);

  const lastYear = extract?.years?.[extract.years.length - 1];

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Supervisory Scenario Runner</h1>
        <Badge status={status} demoText={err ? 'extract unavailable' : undefined} />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 900, marginTop: 4 }}>
        Real NGFS Phase 5 scenario paths — carbon price, GDP impact, emissions and primary-energy mix —
        across scenarios and regions, with a supervisory "stress delta" measured against the
        Current Policies (hot-house) baseline. {extract?.meta?.title ? '' : ''}
      </p>
      {extract?.meta && (
        <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, marginBottom: 14 }}>
          Source: {extract.meta.source || 'NGFS Phase 5, IIASA Scenario Explorer'} · {extract.meta.disclaimer || extract.meta.release || ''}
        </div>
      )}

      {/* Controls */}
      <div style={{ ...card, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Region</div>
          <select style={selectStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
            {(extract?.regions || []).map((r) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Variable</div>
          <select style={selectStyle} value={variable} onChange={(e) => setVariable(e.target.value)}>
            {(extract?.variables || []).map((v) => <option key={v.id} value={v.id}>{v.name || v.id}</option>)}
          </select>
        </div>
        {varDef && (
          <div style={{ fontSize: 11, color: T.sub }}>
            <div><strong style={{ color: T.navy }}>Unit:</strong> {varDef.unit || '—'}</div>
            <div><strong style={{ color: T.navy }}>NGFS path:</strong> <span style={{ fontFamily: T.mono }}>{varDef.ngfs_variable_path || varDef.ngfs_variable || varDef.path || '—'}</span></div>
          </div>
        )}
      </div>

      {/* Trajectory chart */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
          {varDef?.name || variable} — {region} <span style={{ color: T.sub, fontWeight: 400, fontSize: 12 }}>({varDef?.unit || ''})</span>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
            <YAxis tick={{ fontSize: 11, fill: T.sub }} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {(extract?.scenarios || []).map((s, i) => (
              <Line key={s.id} type="monotone" dataKey={s.id} name={s.name || s.id}
                stroke={colorFor(s.id, i)} strokeWidth={s.id === BASELINE ? 2.5 : 1.8}
                strokeDasharray={s.id === BASELINE ? '5 3' : undefined} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stress delta table + bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: 18 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Stress delta @ {lastYear || '—'}</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Change vs Current Policies baseline for {varDef?.name || variable}, {region}.</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Scenario</th><th style={{ ...th, textAlign: 'right' }}>End value</th><th style={{ ...th, textAlign: 'right' }}>Δ abs</th><th style={{ ...th, textAlign: 'right' }}>Δ %</th></tr></thead>
            <tbody>
              {deltaRows.map((r) => (
                <tr key={r.id}>
                  <td style={td}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: SCEN_COLOR[r.id] || T.slate, marginRight: 6 }} />{r.name}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{fmt(r.endValue)}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, color: r.abs > 0 ? T.red : T.green }}>{r.abs == null ? '—' : (r.abs > 0 ? '+' : '') + fmt(r.abs)}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, color: r.pct > 0 ? T.red : T.green }}>{r.pct == null ? '—' : (r.pct > 0 ? '+' : '') + fmt(r.pct) + '%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Δ vs baseline @ {lastYear || '—'}</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deltaRows} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: T.sub }} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} />
              <Bar dataKey="abs" name={`Δ ${varDef?.unit || ''}`}>
                {deltaRows.map((r) => <Cell key={r.id} fill={SCEN_COLOR[r.id] || T.slate} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ fontSize: 11, color: T.sub, marginTop: 8, fontFamily: T.mono }}>
        {status === 'demo'
          ? 'NGFS extract endpoint unavailable — showing empty state; start the backend to load /api/v1/ngfs-extract.'
          : `${extract?.scenarios?.length || 0} scenarios × ${extract?.regions?.length || 0} regions × ${extract?.variables?.length || 0} variables from the seeded NGFS Phase 5 extract.`}
      </div>
    </div>
  );
}
