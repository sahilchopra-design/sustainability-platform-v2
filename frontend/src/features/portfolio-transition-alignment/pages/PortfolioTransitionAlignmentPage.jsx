import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', sage: '#5a8a6a', text: '#1b3a5c',
  textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a',
  amber: '#d97706', blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  teal: '#0891b2',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const PORTFOLIOS = [
  {
    id: 'equity', name: 'Global Equity Fund', aum: 12400, itr: 2.8, gfanz: 'Transitioning',
    nz_year: 2045, interim_2030: 38, tpt_strategy: 62, tpt_governance: 71, tpt_metrics: 58,
    pacta_aligned: 42, pacta_misaligned: 35, engagement_cov: 78,
    sectors: [
      { name: 'Energy', itr: 3.8, weight: 8.2, aum: 1017 },
      { name: 'Materials', itr: 2.9, weight: 12.4, aum: 1538 },
      { name: 'Industrials', itr: 2.4, weight: 18.6, aum: 2306 },
      { name: 'Utilities', itr: 2.1, weight: 9.8, aum: 1215 },
      { name: 'Real Estate', itr: 2.6, weight: 6.4, aum: 794 },
      { name: 'Financials', itr: 2.3, weight: 22.1, aum: 2740 },
      { name: 'Technology', itr: 1.8, weight: 14.2, aum: 1761 },
      { name: 'Consumer', itr: 2.2, weight: 8.3, aum: 1030 },
    ],
    escalation: [
      { company: 'Glencore', status: 'Engagement Active', action: 'Vote against board', deadline: '2025-05' },
      { company: 'RWE', status: 'Committed', action: 'Monitor coal exit', deadline: '2024-12' },
      { company: 'ArcelorMittal', status: 'Under Review', action: 'Escalate to exclusion', deadline: '2025-03' },
    ],
  },
  {
    id: 'fixed_income', name: 'Corporate Bond Portfolio', aum: 8200, itr: 2.5, gfanz: 'Committed',
    nz_year: 2040, interim_2030: 50, tpt_strategy: 74, tpt_governance: 80, tpt_metrics: 68,
    pacta_aligned: 58, pacta_misaligned: 22, engagement_cov: 88,
    sectors: [
      { name: 'Energy', itr: 3.2, weight: 14.8, aum: 1214 },
      { name: 'Industrials', itr: 2.2, weight: 24.6, aum: 2017 },
      { name: 'Utilities', itr: 1.9, weight: 18.4, aum: 1509 },
      { name: 'Financials', itr: 2.1, weight: 26.8, aum: 2198 },
      { name: 'Real Estate', itr: 2.8, weight: 8.2, aum: 672 },
      { name: 'Technology', itr: 1.7, weight: 7.2, aum: 590 },
    ],
    escalation: [
      { company: 'BP', status: 'Engagement Active', action: 'Climate resolution support', deadline: '2025-04' },
      { company: 'Petrobras', status: 'Watch List', action: 'Divest if no SBTi by Q2', deadline: '2025-06' },
    ],
  },
];

const TABS = ['ITR Overview', 'GFANZ/TPT Alignment', 'PACTA Analysis', 'Engagement & Escalation', 'Sector Drill-Down'];

export default function PortfolioTransitionAlignmentPage() {
  const [tab, setTab] = useState(0);
  const [selectedPort, setSelectedPort] = useState('equity');

  const port = PORTFOLIOS.find(p => p.id === selectedPort);
  const tptOverall = ((port.tpt_strategy + port.tpt_governance + port.tpt_metrics) / 3).toFixed(1);

  const itrHistory = [
    { year: 2020, itr: 3.4 }, { year: 2021, itr: 3.2 }, { year: 2022, itr: 3.0 },
    { year: 2023, itr: 2.9 }, { year: 2024, itr: port.itr },
    { year: 2025, itr: null }, { year: 2028, itr: null }, { year: 2030, itr: 2.2 },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CC1 · PORTFOLIO TRANSITION ALIGNMENT</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Portfolio Climate Transition Alignment — GFANZ · TPT · PACTA</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              ITR Scoring · GFANZ Net-Zero Commitments · TPT Pillars · PACTA Technology Alignment · Engagement Tracking
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PORTFOLIOS.map(p => (
              <button key={p.id} onClick={() => setSelectedPort(p.id)} style={{
                padding: '8px 16px', borderRadius: 8, border: `2px solid ${selectedPort === p.id ? T.gold : 'transparent'}`,
                background: selectedPort === p.id ? 'rgba(197,169,106,0.15)' : 'rgba(255,255,255,0.08)',
                color: selectedPort === p.id ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{p.name}</button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[
            { label: 'AUM', val: `$${(port.aum/1000).toFixed(1)}B` },
            { label: 'Portfolio ITR', val: `${port.itr}°C`, col: port.itr < 2 ? T.green : port.itr < 2.5 ? T.amber : T.red },
            { label: 'GFANZ Status', val: port.gfanz, col: port.gfanz === 'Committed' ? T.green : T.amber },
            { label: '2030 Reduction', val: `−${port.interim_2030}%`, col: T.blue },
            { label: 'PACTA Aligned', val: `${port.pacta_aligned}%`, col: T.teal },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px' }}>
              <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
              <div style={{ color: m.col || T.gold, fontSize: 16, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
            </div>
          ))}
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

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Portfolio ITR — Historical Trend & 2030 Target</h3>
                <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                  Implied Temperature Rise (ITR) per MSCI/TCFD methodology. 2°C Paris-aligned target requires ITR ≤ 2.0°C by 2030.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={itrHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1.5, 4]} tickFormatter={v => `${v}°C`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v ? [`${v}°C`, 'ITR'] : ['Target', 'ITR']} />
                    <Line dataKey="itr" stroke={T.red} strokeWidth={2.5} connectNulls dot={{ r: 4 }} name="Portfolio ITR" />
                    <ReferenceLine y={2.0} stroke={T.green} strokeDasharray="6 3" label={{ value: 'Paris 2°C', fill: T.green, fontSize: 11 }} />
                    <ReferenceLine y={1.5} stroke={T.teal} strokeDasharray="4 4" label={{ value: '1.5°C', fill: T.teal, fontSize: 11 }} />
                    <ReferenceLine y={2.5} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'NDCs 2.5°C', fill: T.amber, fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Current ITR', val: `${port.itr}°C`, sub: 'Portfolio-weighted', col: port.itr < 2 ? T.green : port.itr < 2.5 ? T.amber : T.red },
                  { label: 'ITR Method', val: 'MSCI/TCFD', sub: 'Financed emissions + targets' },
                  { label: 'Net Zero Year', val: port.nz_year, sub: 'Committed target' },
                  { label: '2030 Reduction', val: `−${port.interim_2030}%`, sub: 'vs. 2020 baseline', col: T.blue },
                  { label: 'Engagement Cover', val: `${port.engagement_cov}%`, sub: 'of AUM by emissions' },
                ].map(m => (
                  <div key={m.label} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: m.col || T.navy, marginTop: 4 }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>TPT Framework — 3 Pillars</h3>
                <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>Taskforce on Nature framework. Overall: {tptOverall}/100</p>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={[
                    { subject: 'Strategy', score: port.tpt_strategy, fullMark: 100 },
                    { subject: 'Governance', score: port.tpt_governance, fullMark: 100 },
                    { subject: 'Metrics', score: port.tpt_metrics, fullMark: 100 },
                  ]}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSec, fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="score" stroke={T.blue} fill={T.blue} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>GFANZ Commitment — {port.gfanz}</h3>
                {[
                  { label: 'Net Zero Target Year', val: port.nz_year, col: T.green },
                  { label: '2030 Interim Reduction', val: `${port.interim_2030}%`, col: T.blue },
                  { label: 'GFANZ Membership', val: 'NZAM Alliance', col: T.teal },
                  { label: 'Portfolio Decarbonization Rate', val: '7.8%/yr required', col: T.amber },
                  { label: 'Current Decarbonization', val: '4.2%/yr actual', col: T.red },
                  { label: 'Engagement Priority AUM', val: `$${((port.aum * (100 - port.pacta_aligned)) / 100 / 1000).toFixed(1)}B`, col: T.orange },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 13, color: T.textSec }}>{m.label}</span>
                    <span style={{ fontFamily: T.mono, fontWeight: 700, color: m.col }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Aligned', val: `${port.pacta_aligned}%`, desc: 'Tech aligned with Paris 2°C', col: T.green },
                { label: 'Misaligned', val: `${port.pacta_misaligned}%`, desc: 'Tech exceeds Paris budget', col: T.red },
                { label: 'Not Assessed', val: `${100 - port.pacta_aligned - port.pacta_misaligned}%`, desc: 'Insufficient data', col: T.textMut },
              ].map(m => (
                <div key={m.label} style={{ background: T.surface, borderRadius: 10, border: `2px solid ${m.col}44`, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: m.col }}>{m.val}</div>
                  <div style={{ fontWeight: 700, color: T.navy, marginTop: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{m.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>PACTA Technology Alignment by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={port.sectors.map(s => ({ name: s.name, aligned: port.pacta_aligned * (0.8 + Math.random() * 0.4), misaligned: port.pacta_misaligned * (0.8 + Math.random() * 0.4) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}%`]} />
                  <Legend />
                  <Bar dataKey="aligned" name="Aligned" fill={T.green} opacity={0.8} stackId="a" />
                  <Bar dataKey="misaligned" name="Misaligned" fill={T.red} opacity={0.7} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Engagement & Escalation Register</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Company', 'Engagement Status', 'Planned Action', 'Deadline', 'Priority'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {port.escalation.map((e, i) => {
                    const priority = e.status === 'Watch List' ? 'HIGH' : e.status === 'Under Review' ? 'MEDIUM' : 'LOW';
                    const pc = priority === 'HIGH' ? T.red : priority === 'MEDIUM' ? T.amber : T.green;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{e.company}</td>
                        <td style={{ padding: '10px 12px', color: T.textSec }}>{e.status}</td>
                        <td style={{ padding: '10px 12px', color: T.navy }}>{e.action}</td>
                        <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.amber }}>{e.deadline}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: pc + '22', color: pc, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{priority}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Sector ITR vs. Portfolio Weight</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={port.sectors}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={v => `${v}°C`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="itr" name="ITR (°C)" radius={[4,4,0,0]}>
                    {port.sectors.map((s, i) => <Cell key={i} fill={s.itr < 2 ? T.green : s.itr < 2.5 ? T.amber : T.red} />)}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="weight" name="Weight (%)" stroke={T.navy} strokeWidth={2} dot={{ r: 4 }} />
                  <ReferenceLine yAxisId="left" y={2.0} stroke={T.green} strokeDasharray="4 4" label={{ value: '2°C', fill: T.green, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
