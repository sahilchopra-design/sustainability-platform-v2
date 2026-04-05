/**
 * EP-CT4 — FI Regulatory Capital Climate Overlay
 * Sprint CT · Financial Institution Profiler
 *
 * Regulatory capital overlay with capital requirements, RWA, Pillar 2 add-on,
 * stress capital buffer, ECB/BoE alignment, and Basel IV timeline.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Capital Requirements', 'Risk-Weighted Assets', 'Pillar 2 Climate Add-on', 'Stress Capital Buffer', 'ECB/BoE Alignment', 'Timeline'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_CLASSES = [
  { name: 'Corporate', rwa: 18200, climateAdj: 1820, adjPct: 10, weight: 100 },
  { name: 'Sovereign', rwa: 4200, climateAdj: 210, adjPct: 5, weight: 0 },
  { name: 'Retail', rwa: 8400, climateAdj: 420, adjPct: 5, weight: 75 },
  { name: 'Real Estate', rwa: 6800, climateAdj: 1360, adjPct: 20, weight: 35 },
  { name: 'Infrastructure', rwa: 3200, climateAdj: 480, adjPct: 15, weight: 50 },
  { name: 'Equity', rwa: 2400, climateAdj: 360, adjPct: 15, weight: 250 },
  { name: 'Securitisation', rwa: 1800, climateAdj: 180, adjPct: 10, weight: 20 },
];

const TOTAL_RWA = ASSET_CLASSES.reduce((s, a) => s + a.rwa, 0);
const TOTAL_ADJ = ASSET_CLASSES.reduce((s, a) => s + a.climateAdj, 0);

const NGFS_STRESS = [
  { scenario: 'Current Policies', rwaImpact: 2.1, capitalRatio: -0.4, scb: 0 },
  { scenario: 'NDCs Only', rwaImpact: 3.8, capitalRatio: -0.7, scb: 25 },
  { scenario: 'Below 2°C', rwaImpact: 5.2, capitalRatio: -1.1, scb: 50 },
  { scenario: 'Net Zero 2050', rwaImpact: 6.8, capitalRatio: -1.5, scb: 75 },
  { scenario: 'Delayed Transition', rwaImpact: 9.4, capitalRatio: -2.2, scb: 125 },
  { scenario: 'Divergent NZ', rwaImpact: 8.1, capitalRatio: -1.8, scb: 100 },
];

const TIMELINE = [
  { year: 2025, event: 'Basel IV: Phase-in begins', ecb: 'SREP climate integration', boe: 'SS3/19 expectations finalized', status: 'ACTIVE' },
  { year: 2025, event: 'EU CRR3 output floor 50%', ecb: 'Climate stress test follow-up', boe: 'Climate scenario exercise', status: 'ACTIVE' },
  { year: 2026, event: 'Basel IV: Output floor 55%', ecb: 'Pillar 2 climate add-on pilots', boe: 'Green supporting factor review', status: 'UPCOMING' },
  { year: 2027, event: 'Basel IV: Output floor 60%', ecb: 'Mandatory climate P2R', boe: 'Transition plan requirements', status: 'PLANNED' },
  { year: 2028, event: 'Basel IV: Full implementation', ecb: 'Full Pillar 3 climate disclosure', boe: 'Capital regime revision', status: 'PLANNED' },
];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: T.font, fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
      }}>{t}</button>
    ))}
  </div>
);

const Card = ({ title, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16, ...style }}>
    {title && <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

export default function FiRegulatoryCapitalOverlayPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [selectedScenario, setSelectedScenario] = useState('Net Zero 2050');

  const capitalStack = useMemo(() => [
    { component: 'CET1 Minimum', pct: 4.5, value: Math.round(TOTAL_RWA * 0.045), color: T.navy },
    { component: 'Capital Conservation', pct: 2.5, value: Math.round(TOTAL_RWA * 0.025), color: T.blue },
    { component: 'Countercyclical', pct: 0.5, value: Math.round(TOTAL_RWA * 0.005), color: T.teal },
    { component: 'G-SIB Buffer', pct: 1.5, value: Math.round(TOTAL_RWA * 0.015), color: T.purple },
    { component: 'Pillar 2 (P2R)', pct: 2.0, value: Math.round(TOTAL_RWA * 0.020), color: T.amber },
    { component: 'Climate Add-on (est.)', pct: 0.8, value: Math.round(TOTAL_RWA * 0.008), color: T.red },
  ], []);

  const ecbBoeComparison = useMemo(() => [
    { area: 'Supervisory Expectations', ecb: 'Mandatory (2024)', boe: 'SS3/19 (2022)', ecbScore: 85, boeScore: 80 },
    { area: 'Climate Stress Testing', ecb: 'Biennial (2022, 2024)', boe: 'CBES (2021), planned 2025', ecbScore: 90, boeScore: 85 },
    { area: 'Pillar 2 Climate', ecb: 'P2R qualitative, P2G planned', boe: 'Under consideration', ecbScore: 75, boeScore: 60 },
    { area: 'Pillar 3 Disclosure', ecb: 'CRR3 Art. 449a mandatory', boe: 'TCFD aligned, enhancing', ecbScore: 80, boeScore: 75 },
    { area: 'Green Supporting Factor', ecb: 'Under EBA review', boe: 'Not adopted', ecbScore: 40, boeScore: 20 },
    { area: 'Transition Plans', ecb: 'Expected in SREP', boe: 'Mandatory from 2025', ecbScore: 70, boeScore: 90 },
  ], []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CT4 · SPRINT CT</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>FI Regulatory Capital Climate Overlay</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            ${(TOTAL_RWA / 1000).toFixed(1)}B RWA · ${(TOTAL_ADJ / 1000).toFixed(1)}B climate adjustment · ECB & BoE alignment
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total RWA', value: `$${(TOTAL_RWA / 1000).toFixed(1)}B` },
            { label: 'Climate Adj', value: `$${(TOTAL_ADJ / 1000).toFixed(1)}B`, color: T.red },
            { label: 'Adj % of RWA', value: `${((TOTAL_ADJ / TOTAL_RWA) * 100).toFixed(1)}%`, color: T.amber },
            { label: 'Est. Climate P2R', value: '80 bps', color: T.purple },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color || T.navy }}>{k.value}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {tab === TABS[0] && (
          <Card title="Capital Requirement Stack">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={capitalStack} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis dataKey="component" type="category" width={150} tick={{ fontFamily: T.font, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => `$${v}M`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {capitalStack.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
              Total capital requirement: <span style={{ fontFamily: T.mono, fontWeight: 700 }}>{capitalStack.reduce((s, c) => s + c.pct, 0).toFixed(1)}%</span> of RWA =
              <span style={{ fontFamily: T.mono, fontWeight: 700 }}> ${capitalStack.reduce((s, c) => s + c.value, 0).toLocaleString()}M</span>
            </div>
          </Card>
        )}

        {tab === TABS[1] && (
          <Card title="Risk-Weighted Assets by Asset Class with Climate Adjustment">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ASSET_CLASSES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontFamily: T.font, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="rwa" stackId="a" fill={T.navy} name="Base RWA $M" />
                <Bar dataKey="climateAdj" stackId="a" fill={T.red} name="Climate Adj $M" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {tab === TABS[2] && (
          <Card title="Pillar 2 Climate Add-on Estimation (ECB SREP Methodology)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Asset Class</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>RWA $M</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Climate Adj $M</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Adj %</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {ASSET_CLASSES.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{a.rwa.toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{a.climateAdj.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontWeight: 700 }}>{a.adjPct}%</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#fff',
                        background: a.adjPct >= 15 ? T.red : a.adjPct >= 10 ? T.amber : T.green }}>
                        {a.adjPct >= 15 ? 'HIGH' : a.adjPct >= 10 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: 12, background: '#fffbeb', borderRadius: 6, fontSize: 12, color: T.navy }}>
              <strong>Methodology:</strong> Climate P2R estimated using ECB SREP qualitative assessment framework: governance, risk management, strategy, disclosure quality. Quantitative component based on sectoral heatmap exposures and scenario sensitivity.
            </div>
          </Card>
        )}

        {tab === TABS[3] && (
          <Card title="Stress Capital Buffer under NGFS Scenarios">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={NGFS_STRESS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontFamily: T.font, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="rwaImpact" fill={T.red} name="RWA Impact %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scb" fill={T.amber} name="SCB (bps)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {tab === TABS[4] && (
          <Card title="ECB vs BoE Regulatory Alignment">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ecbBoeComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="area" tick={{ fontFamily: T.font, fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="ecbScore" fill={T.navy} name="ECB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="boeScore" fill={T.gold} name="BoE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font, marginTop: 12 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: 5 }}>Area</th><th style={{ textAlign: 'left', padding: 5 }}>ECB</th><th style={{ textAlign: 'left', padding: 5 }}>BoE</th>
              </tr></thead>
              <tbody>{ecbBoeComparison.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 5, fontWeight: 600 }}>{r.area}</td>
                  <td style={{ padding: 5, color: T.textSec }}>{r.ecb}</td>
                  <td style={{ padding: 5, color: T.textSec }}>{r.boe}</td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}

        {tab === TABS[5] && (
          <Card title="Basel IV Climate Implementation Timeline (2025-2028)">
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {TIMELINE.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -24, top: 0, width: 16, height: 16, borderRadius: '50%',
                    background: t.status === 'ACTIVE' ? T.green : t.status === 'UPCOMING' ? T.amber : T.textMut, border: `2px solid ${T.surface}` }} />
                  {i < TIMELINE.length - 1 && <div style={{ position: 'absolute', left: -17, top: 16, width: 2, height: 'calc(100% + 4px)', background: T.border }} />}
                  <div style={{ flex: 1, background: '#f0f4f8', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{t.year}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#fff',
                        background: t.status === 'ACTIVE' ? T.green : t.status === 'UPCOMING' ? T.amber : T.textMut }}>{t.status}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.event}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                      <div><span style={{ color: T.textMut }}>ECB:</span> {t.ecb}</div>
                      <div><span style={{ color: T.textMut }}>BoE:</span> {t.boe}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CT4 · FI Regulatory Capital Climate Overlay</span>
          <span>Sprint CT · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
