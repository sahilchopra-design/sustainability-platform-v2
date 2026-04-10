import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── KPI data ──────────────────────────────────────────────────────────────
const KPI_CARDS = [
  { label: 'Portfolio Climate VaR', value: '8.7%', sub: 'of AUM · NZ2050 · 10yr', delta: '+1.2%', up: true, color: T.red },
  { label: 'Avg ITR (Implied Temp Rise)', value: '2.4°C', sub: 'vs. 1.5°C target', delta: '−0.3°C', up: false, color: T.orange },
  { label: 'Financed Emissions WACI', value: '182 tCO₂/$M', sub: 'weighted avg carbon intensity', delta: '−14%', up: false, color: T.green },
  { label: 'Stranded Asset Exposure', value: '$2.1B', sub: '14.2% of portfolio AUM', delta: '+$0.3B', up: true, color: T.red },
  { label: 'GFANZ Alignment', value: '61%', sub: 'of portfolio by AUM', delta: '+5pp', up: false, color: T.green },
  { label: 'Green Bond Screened', value: '23 / 38', sub: 'instruments · 60.5% pass rate', delta: '+3', up: false, color: T.teal },
];

// ─── Portfolio transition score time series ─────────────────────────────────
const SCORE_SERIES = [
  { yr: 'Q1-24', score: 48, itr: 2.9, vaR: 11.2 },
  { yr: 'Q2-24', score: 51, itr: 2.8, vaR: 10.8 },
  { yr: 'Q3-24', score: 53, itr: 2.7, vaR: 10.1 },
  { yr: 'Q4-24', score: 55, itr: 2.6, vaR: 9.7 },
  { yr: 'Q1-25', score: 57, itr: 2.5, vaR: 9.3 },
  { yr: 'Q2-25', score: 58, itr: 2.4, vaR: 8.7 },
];

// ─── Sector heat summary ────────────────────────────────────────────────────
const SECTOR_HEAT = [
  { sector: 'Energy', score: 38, itr: 3.4, vaR: 22, stranded: 38, gfanz: 28 },
  { sector: 'Materials', score: 45, itr: 2.9, vaR: 15, stranded: 22, gfanz: 42 },
  { sector: 'Utilities', score: 52, itr: 2.6, vaR: 14, stranded: 18, gfanz: 55 },
  { sector: 'Industrials', score: 55, itr: 2.4, vaR: 11, stranded: 12, gfanz: 61 },
  { sector: 'Real Estate', score: 59, itr: 2.2, vaR: 9, stranded: 8, gfanz: 67 },
  { sector: 'Financials', score: 63, itr: 2.0, vaR: 6, stranded: 4, gfanz: 74 },
  { sector: 'Technology', score: 74, itr: 1.7, vaR: 3, stranded: 1, gfanz: 88 },
  { sector: 'Consumer', score: 61, itr: 2.1, vaR: 7, stranded: 5, gfanz: 71 },
];

// ─── Regulatory submission readiness ────────────────────────────────────────
const REG_STATUS = [
  { framework: 'TCFD', pillars: ['Governance','Strategy','Risk Mgmt','Metrics'], complete: [4,4,4,3], color: T.green },
  { framework: 'ISSB S2', pillars: ['Governance','Strategy','Risk Mgmt','Metrics'], complete: [4,3,4,4], color: T.teal },
  { framework: 'CSRD ESRS E1', pillars: ['Impacts','Risks','Metrics','Targets'], complete: [3,4,3,3], color: T.amber },
  { framework: 'SFDR Art.9', pillars: ['Sustainability Factors','PAI','Taxonomy','Engagement'], complete: [4,4,3,4], color: T.blue },
  { framework: 'UK TPT', pillars: ['Strategy','Governance','Implementation','Engagement'], complete: [3,3,4,3], color: T.purple },
];

import { isIndiaMode, adaptForTransitionRisk } from '../../../data/IndiaDataAdapter';

// ─── Top-10 holdings transition snapshot ────────────────────────���───────────
const _DEFAULT_HOLDINGS = [
  { name: 'Shell PLC', sector: 'Energy', weight: 4.2, score: 38, itr: 3.8, flag: 'CRITICAL' },
  { name: 'BP PLC', sector: 'Energy', weight: 3.1, score: 42, itr: 3.4, flag: 'HIGH' },
  { name: 'BASF SE', sector: 'Materials', weight: 2.8, score: 47, itr: 2.8, flag: 'HIGH' },
  { name: 'RWE AG', sector: 'Utilities', weight: 2.5, score: 58, itr: 2.2, flag: 'MEDIUM' },
  { name: 'Siemens AG', sector: 'Industrials', weight: 3.4, score: 64, itr: 1.9, flag: 'LOW' },
  { name: 'Vestas Wind', sector: 'Utilities', weight: 2.1, score: 79, itr: 1.4, flag: 'LEADER' },
  { name: 'LVMH', sector: 'Consumer', weight: 2.9, score: 62, itr: 2.0, flag: 'MEDIUM' },
  { name: 'Microsoft', sector: 'Technology', weight: 4.8, score: 81, itr: 1.3, flag: 'LEADER' },
  { name: 'Deutsche Bank', sector: 'Financials', weight: 1.9, score: 57, itr: 2.3, flag: 'MEDIUM' },
  { name: 'Lufthansa', sector: 'Industrials', weight: 1.4, score: 34, itr: 3.9, flag: 'CRITICAL' },
];
// ── India Dataset Integration ─���
const HOLDINGS = isIndiaMode() ? adaptForTransitionRisk().slice(0, 10).map(c => ({
  name: c.name, sector: c.sector, weight: +(100 / 10).toFixed(1), score: Math.round(c.transitionScore),
  itr: +c.temperatureAlignment_c, flag: c.flag,
})) : _DEFAULT_HOLDINGS;

const flagColor = f => ({ CRITICAL: T.red, HIGH: T.orange, MEDIUM: T.amber, LOW: T.green, LEADER: T.teal }[f] || T.textMut);

// ─── Radar for multi-pillar readiness ──────────────────────────────────────
const RADAR_DATA = [
  { axis: 'Carbon Exp', val: 62 },
  { axis: 'Tech Ready', val: 71 },
  { axis: 'Policy Risk', val: 55 },
  { axis: 'Market Dyn', val: 68 },
  { axis: 'Capital', val: 74 },
  { axis: 'Social Lic', val: 80 },
];

// ─── Engagement pipeline ────────────────────────────────────────────────────
const ENGAGEMENT = [
  { company: 'Shell PLC', action: 'Board-level escalation', due: '2026-06-30', status: 'OPEN', priority: 'P1' },
  { company: 'Lufthansa', action: 'SBTi commitment letter request', due: '2026-04-30', status: 'IN PROGRESS', priority: 'P1' },
  { company: 'BP PLC', action: 'Net Zero pathway audit', due: '2026-05-15', status: 'IN PROGRESS', priority: 'P2' },
  { company: 'BASF SE', action: 'CBAM exposure disclosure', due: '2026-07-01', status: 'OPEN', priority: 'P2' },
  { company: 'Deutsche Bank', action: 'PCAF financed emissions data quality', due: '2026-08-15', status: 'PLANNED', priority: 'P3' },
];

const TABS = ['Executive Summary', 'Sector Heatmap', 'Holdings Monitor', 'Regulatory Readiness', 'Engagement Pipeline'];

function Kpi({ card }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: '16px 20px', flex: 1, minWidth: 180
    }}>
      <div style={{ color: T.textSec, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{card.label}</div>
      <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 700, color: card.color }}>{card.value}</div>
      <div style={{ color: T.textMut, fontSize: 11, marginTop: 2 }}>{card.sub}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: card.up ? T.red : T.green }}>
          {card.up ? '▲' : '▼'} {card.delta}
        </span>
        <span style={{ fontSize: 11, color: T.textMut }}>QoQ</span>
      </div>
    </div>
  );
}

function sectorRiskColor(score) {
  if (score < 40) return T.red;
  if (score < 50) return T.orange;
  if (score < 60) return T.amber;
  if (score < 70) return T.green;
  return T.teal;
}

export default function TransitionRiskDashboardPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('Net Zero 2050');
  const [sortField, setSortField] = useState('weight');

  const sortedHoldings = useMemo(
    () => [...HOLDINGS].sort((a, b) => b[sortField] - a[sortField]),
    [sortField]
  );

  const regReadinessPct = fw => {
    const total = fw.pillars.length * 4;
    const done = fw.complete.reduce((a, b) => a + b, 0);
    return Math.round((done / total) * 100);
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CE2 · TRANSITION RISK DASHBOARD</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Climate Transition Risk — Executive Command Centre</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Portfolio KPIs · Sector Heatmap · Holdings Monitor · Regulatory Readiness · Engagement Pipeline
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Current Policies', 'Below 2°C', 'Net Zero 2050'].map(s => (
              <button key={s} onClick={() => setScenario(s)} style={{
                padding: '8px 14px', borderRadius: 8, border: `2px solid ${scenario === s ? T.gold : 'transparent'}`,
                background: scenario === s ? 'rgba(197,169,106,0.15)' : 'rgba(255,255,255,0.08)',
                color: scenario === s ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* ══ TAB 0: Executive Summary ══ */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* KPI row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {KPI_CARDS.map(c => <Kpi key={c.label} card={c} />)}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Portfolio transition score trend */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 14 }}>Portfolio Transition Score — Quarterly Trend</h3>
                <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 14px' }}>Composite 6-pillar score (0–100 best)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={SCORE_SERIES}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
                    <YAxis domain={[40, 70]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" name="Transition Score" stroke={T.teal} fill={T.teal + '22'} strokeWidth={2} />
                    <ReferenceLine y={60} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Target 60', fill: T.green, fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* ITR + VaR dual axis */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 14 }}>ITR vs. Climate VaR — Quarterly</h3>
                <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 14px' }}>Implied Temperature Rise (°C) · VaR % AUM</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={SCORE_SERIES}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="l" domain={[1.5, 3.5]} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="r" orientation="right" domain={[7, 13]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="l" type="monotone" dataKey="itr" name="ITR (°C)" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="r" type="monotone" dataKey="vaR" name="CVaR (%)" stroke={T.orange} strokeWidth={2} dot={{ r: 3 }} />
                    <ReferenceLine yAxisId="l" y={1.5} stroke={T.teal} strokeDasharray="4 4" label={{ value: '1.5°C', fill: T.teal, fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Multi-pillar radar + top risks */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Portfolio Pillar Radar</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="val" stroke={T.teal} fill={T.teal} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Alert feed */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Active Risk Alerts</h3>
                {[
                  { level: 'CRITICAL', msg: 'Shell PLC — transition score 38 · stranded CAPEX $0.9B under NZ2050 · ITR 3.8°C', time: '2h ago' },
                  { level: 'HIGH', msg: 'Lufthansa — CORSIA Phase II liability €340M · no SBTi commitment · ITR 3.9°C', time: '4h ago' },
                  { level: 'HIGH', msg: 'CBAM implementation 2026 — Materials exposure €180M p.a. in portfolio', time: '6h ago' },
                  { level: 'MEDIUM', msg: 'BASF SE — EU ETS allowance shortfall projected 2027 at €45/tCO₂', time: '1d ago' },
                  { level: 'MEDIUM', msg: 'Portfolio ITR 2.4°C — 0.9°C above Paris target · peer median 2.2°C', time: '1d ago' },
                  { level: 'INFO', msg: 'Vestas Wind — upgraded to LEADER tier · green CAPEX ratio 94%', time: '2d ago' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < 5 ? `1px solid ${T.border}` : 'none' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: flagColor(a.level) + '22', color: flagColor(a.level), whiteSpace: 'nowrap'
                    }}>{a.level}</span>
                    <div style={{ flex: 1, fontSize: 12, color: T.navy, lineHeight: 1.5 }}>{a.msg}</div>
                    <div style={{ fontSize: 10, color: T.textMut, whiteSpace: 'nowrap' }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 1: Sector Heatmap ══ */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Sector Transition Score</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...SECTOR_HEAT].sort((a, b) => a.score - b.score)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={v => [`${v}`, 'Transition Score']} />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                      {[...SECTOR_HEAT].sort((a, b) => a.score - b.score).map((e, i) => (
                        <Cell key={i} fill={sectorRiskColor(e.score)} />
                      ))}
                    </Bar>
                    <ReferenceLine x={60} stroke={T.teal} strokeDasharray="4 4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Sector Climate VaR (%)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...SECTOR_HEAT].sort((a, b) => b.vaR - a.vaR)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v}%`, 'Climate VaR']} />
                    <Bar dataKey="vaR" radius={[6, 6, 0, 0]}>
                      {[...SECTOR_HEAT].sort((a, b) => b.vaR - a.vaR).map((e, i) => (
                        <Cell key={i} fill={e.vaR > 15 ? T.red : e.vaR > 10 ? T.orange : e.vaR > 7 ? T.amber : T.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sector table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Sector Metrics Summary</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Sector', 'Trans. Score', 'ITR (°C)', 'Climate VaR', 'Stranded %', 'GFANZ %'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: h === 'Sector' ? 'left' : 'center', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTOR_HEAT.map((s, i) => {
                    const sc = sectorRiskColor(s.score);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.surface }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{s.sector}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ background: sc + '22', color: sc, fontFamily: T.mono, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{s.score}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono, color: s.itr > 3 ? T.red : s.itr > 2.5 ? T.orange : T.green, fontWeight: 700 }}>{s.itr}°C</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono, color: s.vaR > 15 ? T.red : s.vaR > 10 ? T.orange : T.green, fontWeight: 700 }}>{s.vaR}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono, color: T.textSec }}>{s.stranded}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, maxWidth: 80 }}>
                              <div style={{ width: `${s.gfanz}%`, height: '100%', background: s.gfanz > 70 ? T.green : s.gfanz > 50 ? T.amber : T.red, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{s.gfanz}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Holdings Monitor ══ */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: T.navy, margin: 0, fontSize: 15 }}>Top Holdings — Transition Risk Monitor</h3>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ color: T.textSec }}>Sort by:</span>
                  {['weight', 'score', 'itr'].map(f => (
                    <button key={f} onClick={() => setSortField(f)} style={{
                      padding: '4px 10px', borderRadius: 6, border: `1px solid ${sortField === f ? T.navy : T.border}`,
                      background: sortField === f ? T.navy : 'transparent', color: sortField === f ? '#fff' : T.textSec,
                      cursor: 'pointer', fontSize: 11, fontWeight: 600
                    }}>{f === 'weight' ? 'Weight' : f === 'score' ? 'Score' : 'ITR'}</button>
                  ))}
                </div>
              </div>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Company', 'Sector', 'Weight', 'Trans. Score', 'ITR (°C)', 'Risk Flag', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: h === 'Company' || h === 'Sector' ? 'left' : 'center', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((h, i) => {
                    const fc = flagColor(h.flag);
                    const sc = sectorRiskColor(h.score);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{h.name}</td>
                        <td style={{ padding: '10px 14px', color: T.textSec }}>{h.sector}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono }}>{h.weight}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ background: sc + '22', color: sc, fontFamily: T.mono, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{h.score}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: h.itr > 3.0 ? T.red : h.itr > 2.5 ? T.orange : h.itr > 2.0 ? T.amber : T.green }}>{h.itr}°C</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ background: fc + '22', color: fc, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{h.flag}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button style={{
                            padding: '3px 10px', borderRadius: 5, border: `1px solid ${fc}`, background: 'transparent',
                            color: fc, fontSize: 10, fontWeight: 700, cursor: 'pointer'
                          }}>{h.flag === 'CRITICAL' || h.flag === 'HIGH' ? 'ESCALATE' : 'MONITOR'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 3: Regulatory Readiness ══ */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {REG_STATUS.map(fw => {
                const pct = regReadinessPct(fw);
                return (
                  <div key={fw.framework} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ color: T.navy, margin: 0, fontSize: 14 }}>{fw.framework}</h3>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 18, color: pct >= 90 ? T.green : pct >= 75 ? T.amber : T.red }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, marginBottom: 16 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: fw.color, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    {fw.pillars.map((p, pi) => (
                      <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: T.textSec, width: 130 }}>{p}</span>
                        <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${(fw.complete[pi] / 4) * 100}%`, height: '100%', background: fw.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textSec, width: 30 }}>{fw.complete[pi]}/4</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Overall readiness bar */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Overall Regulatory Readiness</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={REG_STATUS.map(fw => ({ name: fw.framework, pct: regReadinessPct(fw) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v}%`, 'Readiness']} />
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                      {REG_STATUS.map((fw, i) => <Cell key={i} fill={fw.color} />)}
                    </Bar>
                    <ReferenceLine y={90} stroke={T.green} strokeDasharray="4 4" label={{ value: '90% target', fill: T.green, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Submission timeline */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Submission Timeline & Deadlines</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { fw: 'TCFD', deadline: '2026-06-30', status: 'ON TRACK', color: T.green, note: 'Annual integrated report deadline' },
                  { fw: 'CSRD ESRS E1', deadline: '2026-03-31', status: 'OVERDUE', color: T.red, note: 'First disclosure year — remediation required' },
                  { fw: 'ISSB S2', deadline: '2026-09-30', status: 'ON TRACK', color: T.green, note: 'Financial year-end disclosure' },
                  { fw: 'SFDR Art.9', deadline: '2026-04-30', status: 'AT RISK', color: T.amber, note: 'Periodic report · PAI data gap on Scope 3 Cat 15' },
                  { fw: 'UK TPT', deadline: '2026-12-31', status: 'IN PROGRESS', color: T.teal, note: 'Transition plan first submission' },
                ].map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 14px', background: T.bg, borderRadius: 8 }}>
                    <span style={{ fontWeight: 700, color: T.navy, width: 120 }}>{d.fw}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec, width: 100 }}>{d.deadline}</span>
                    <span style={{ background: d.color + '22', color: d.color, padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, width: 90, textAlign: 'center' }}>{d.status}</span>
                    <span style={{ fontSize: 12, color: T.textSec, flex: 1 }}>{d.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: Engagement Pipeline ══ */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Open Engagements', value: '12', color: T.navy },
                { label: 'P1 Critical Actions', value: '3', color: T.red },
                { label: 'P2 High Priority', value: '4', color: T.orange },
                { label: 'Escalations This Quarter', value: '2', color: T.amber },
                { label: 'Closed (YTD)', value: '7', color: T.green },
              ].map(s => (
                <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Engagement table */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Active Engagement Register</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Company', 'Action Required', 'Due Date', 'Priority', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: 'left', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ENGAGEMENT.map((e, i) => {
                    const pc = { P1: T.red, P2: T.orange, P3: T.amber }[e.priority] || T.textMut;
                    const sc = e.status === 'OPEN' ? T.red : e.status === 'IN PROGRESS' ? T.amber : T.teal;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{e.company}</td>
                        <td style={{ padding: '10px 14px', color: T.textSec }}>{e.action}</td>
                        <td style={{ padding: '10px 14px', fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{e.due}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: pc + '22', color: pc, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{e.priority}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: sc + '22', color: sc, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{e.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Escalation framework */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 14 }}>Escalation Framework</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { stage: '1. Dialogue', desc: 'Bilateral letter · Management meeting · Data request', color: T.teal },
                  { stage: '2. Enhanced Engagement', desc: 'Board-level contact · Shareholder resolution filing · Coalition join', color: T.amber },
                  { stage: '3. Escalation', desc: 'Voting against board · Public statement · Regulatory referral', color: T.orange },
                  { stage: '4. Divestment', desc: 'Partial exit · Full liquidation · Exclusion list placement', color: T.red },
                ].map((s, i) => (
                  <div key={i} style={{ padding: 16, background: s.color + '11', border: `1px solid ${s.color}33`, borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, color: s.color, marginBottom: 8, fontSize: 12 }}>{s.stage}</div>
                    <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
