import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// VCM Cross-Registry Tracker
// Issuance / retirement analytics across 6 voluntary-carbon registries beyond
// Verra (Verra, Gold Standard, ACR, CAR, ART TREES, Puro.earth).
// Data: GET /api/v1/vcm-registry/summary , /registries , /annual , /status
//   Backend serves a labeled real aggregate extract (Berkeley VROD / CarbonPlan
//   OffsetsDB public reporting — the OffsetsDB API is key-gated, so this is a
//   hand-authored real aggregate, not a live pull). Shown with a Demo badge and
//   explicit provenance. No sr()/PRNG data.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const REG_COLOR = { verra: '#1b3a5c', gold_standard: '#c5a96a', acr: '#0f766e', car: '#6d28d9', art: '#b45309', puro: '#0369a1' };
const CAT_COLORS = ['#1b3a5c', '#0f766e', '#c5a96a', '#6d28d9', '#b45309', '#0369a1', '#9a3412', '#15803d'];

const Badge = ({ status }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live — OffsetsDB</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Loading</span>;
  if (status === 'extract') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Seeded real extract — OffsetsDB API key-gated</span>;
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
const selectStyle = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff' };

const mt = (v) => (v == null || isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })} Mt`;

export default function VcmCrossRegistryTrackerPage() {
  const [status, setStatus] = useState('loading');
  const [summary, setSummary] = useState(null);
  const [registries, setRegistries] = useState([]);
  const [annual, setAnnual] = useState(null);
  const [provenance, setProvenance] = useState(null);
  const [focusReg, setFocusReg] = useState('verra');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, r, a] = await Promise.all([
          axios.get('/api/v1/vcm-registry/summary'),
          axios.get('/api/v1/vcm-registry/registries'),
          axios.get('/api/v1/vcm-registry/annual'),
        ]);
        if (!alive) return;
        setSummary(s.data);
        setRegistries(r.data.registries || []);
        setAnnual(a.data.annual || null);
        setProvenance(r.data.provenance || s.data.provenance || null);
        setStatus(s.data.provenance?.live ? 'live' : 'extract');
      } catch (e) {
        if (alive) setStatus('error');
      }
    })();
    return () => { alive = false; };
  }, []);

  const issRetData = useMemo(() => registries.map((r) => ({
    name: r.name, issued: r.cumulative_issued_mt, retired: r.cumulative_retired_mt,
    outstanding: r.outstanding_mt, rate: r.retirement_rate_pct, key: r.key,
  })), [registries]);

  const annualSeries = useMemo(() => {
    if (!annual) return [];
    return annual.years.map((yr, i) => {
      const row = { year: yr };
      Object.keys(annual.issued_mt || {}).forEach((k) => { row[k] = annual.issued_mt[k][i]; });
      return row;
    });
  }, [annual]);

  const focusCategories = useMemo(() => {
    const reg = registries.find((r) => r.key === focusReg);
    if (!reg?.categories) return [];
    return Object.entries(reg.categories).map(([name, value]) => ({ name, value }));
  }, [registries, focusReg]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>VCM Cross-Registry Tracker</h1>
        <Badge status={status} />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 920, marginTop: 4 }}>
        Issuance, retirement and outstanding-credit analytics across six voluntary-carbon registries —
        the whole market, not just Verra. Retirement rate (retired ÷ issued) is the key quality signal:
        credits issued but never retired sit as unused supply.
      </p>
      {provenance && (
        <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, marginBottom: 14 }}>
          {provenance.kind} · data as of {provenance.data_as_of} · {provenance.caveat}
        </div>
      )}

      {status === 'error' && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>The VCM registry backend did not respond. Start the backend to load /api/v1/vcm-registry.</div>}

      {summary && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <Kpi label="Registries" value={summary.registry_count} />
          <Kpi label="Cumulative issued" value={mt(summary.total_issued_mt)} color={T.blue} />
          <Kpi label="Cumulative retired" value={mt(summary.total_retired_mt)} color={T.teal} />
          <Kpi label="Overall retirement rate" value={`${summary.overall_retirement_rate_pct}%`} color={T.gold} sub="retired ÷ issued" />
        </div>
      )}

      {registries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.3fr) minmax(300px, 1fr)', gap: 18 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Cumulative issued vs retired (Mt CO₂e)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issRetData} margin={{ top: 8, right: 16, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: T.sub }} angle={-20} textAnchor="end" height={45} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v) => mt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="issued" name="Issued" fill={T.blue} />
                <Bar dataKey="retired" name="Retired" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Retirement rate by registry</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Registry</th><th style={{ ...th, textAlign: 'right' }}>Issued</th><th style={{ ...th, textAlign: 'right' }}>Outstanding</th><th style={{ ...th, textAlign: 'right' }}>Retire %</th></tr></thead>
              <tbody>
                {issRetData.map((r) => (
                  <tr key={r.key}>
                    <td style={td}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: REG_COLOR[r.key] || T.slate, marginRight: 6 }} />{r.name}</td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{mt(r.issued)}</td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{mt(r.outstanding)}</td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: r.rate > 60 ? T.green : r.rate > 40 ? T.amber : T.red }}>{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {annualSeries.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Annual issuance trend by registry (Mt CO₂e)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={annualSeries} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis tick={{ fontSize: 11, fill: T.sub }} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.keys(annual.issued_mt || {}).map((k) => (
                <Line key={k} type="monotone" dataKey={k} name={(registries.find((r) => r.key === k) || {}).name || k} stroke={REG_COLOR[k] || T.slate} strokeWidth={1.8} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {registries.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Project category mix</div>
            <select style={selectStyle} value={focusReg} onChange={(e) => setFocusReg(e.target.value)}>
              {registries.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={focusCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.value}%`} labelLine={false}>
                  {focusCategories.map((c, i) => <Cell key={c.name} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: T.mono }} formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Category</th><th style={{ ...th, textAlign: 'right' }}>Share of issuance</th></tr></thead>
              <tbody>
                {focusCategories.map((c, i) => (
                  <tr key={c.name}><td style={td}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: CAT_COLORS[i % CAT_COLORS.length], marginRight: 6 }} />{c.name}</td><td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{c.value}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {provenance?.sources && (
        <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>Sources: {provenance.sources.join(' · ')}</div>
      )}
    </div>
  );
}
