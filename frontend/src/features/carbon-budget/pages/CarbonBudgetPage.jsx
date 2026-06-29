import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#334155', border: '#334155', borderL: '#475569',
  navy: '#3b82f6', navyL: '#93c5fd', gold: '#f59e0b', goldL: '#fcd34d',
  sage: '#10b981', sageL: '#6ee7b7', teal: '#14b8a6', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#ef4444', green: '#22c55e',
  amber: '#f59e0b', font: 'Inter,sans-serif', mono: 'JetBrains Mono,monospace'
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SECTORS = [
  { id: 'energy', name: 'Energy Systems', emoji: '⚡', budgetGtCO2: 220, usedGtCO2: 198, emissionsGtY: 14.2, reductionTarget2030: 45, netZeroYear: 2045, carbonPrice: 85, techReadiness: 8.2 },
  { id: 'transport', name: 'Transport', emoji: '🚗', budgetGtCO2: 130, usedGtCO2: 112, emissionsGtY: 8.1, reductionTarget2030: 30, netZeroYear: 2050, carbonPrice: 72, techReadiness: 6.8 },
  { id: 'industry', name: 'Industry', emoji: '🏭', budgetGtCO2: 180, usedGtCO2: 158, emissionsGtY: 11.4, reductionTarget2030: 22, netZeroYear: 2060, carbonPrice: 95, techReadiness: 5.4 },
  { id: 'buildings', name: 'Buildings', emoji: '🏢', budgetGtCO2: 80, usedGtCO2: 68, emissionsGtY: 5.2, reductionTarget2030: 40, netZeroYear: 2048, carbonPrice: 68, techReadiness: 7.1 },
  { id: 'agriculture', name: 'Agriculture', emoji: '🌾', budgetGtCO2: 120, usedGtCO2: 108, emissionsGtY: 7.4, reductionTarget2030: 18, netZeroYear: 2065, carbonPrice: 42, techReadiness: 4.8 },
  { id: 'waste', name: 'Waste', emoji: '♻️', budgetGtCO2: 30, usedGtCO2: 24, emissionsGtY: 1.8, reductionTarget2030: 35, netZeroYear: 2050, carbonPrice: 55, techReadiness: 7.6 },
  { id: 'lulucf', name: 'LULUCF', emoji: '🌳', budgetGtCO2: -60, usedGtCO2: -42, emissionsGtY: -2.8, reductionTarget2030: 25, netZeroYear: 2035, carbonPrice: 38, techReadiness: 5.2 },
  { id: 'aviation', name: 'Aviation & Shipping', emoji: '✈️', budgetGtCO2: 40, usedGtCO2: 36, emissionsGtY: 2.6, reductionTarget2030: 20, netZeroYear: 2055, carbonPrice: 110, techReadiness: 4.2 },
];

const REGIONS = [
  { id: 'global', name: 'Global', cumulativeGtCO2: 2900, remainingBudget15: 380, remainingBudget20: 900, annualEmissions: 56.8, reductionNeeded: 43, peakYear: 2025, netZeroYear: 2050 },
  { id: 'oecd', name: 'OECD', cumulativeGtCO2: 1200, remainingBudget15: 120, remainingBudget20: 280, annualEmissions: 18.4, reductionNeeded: 65, peakYear: 2019, netZeroYear: 2045 },
  { id: 'china', name: 'China', cumulativeGtCO2: 620, remainingBudget15: 68, remainingBudget20: 190, annualEmissions: 14.8, reductionNeeded: 55, peakYear: 2030, netZeroYear: 2060 },
  { id: 'india', name: 'India', cumulativeGtCO2: 180, remainingBudget15: 95, remainingBudget20: 220, annualEmissions: 3.8, reductionNeeded: 30, peakYear: 2040, netZeroYear: 2070 },
  { id: 'eu', name: 'EU', cumulativeGtCO2: 340, remainingBudget15: 28, remainingBudget20: 72, annualEmissions: 3.6, reductionNeeded: 75, peakYear: 1990, netZeroYear: 2050 },
  { id: 'usa', name: 'USA', cumulativeGtCO2: 420, remainingBudget15: 38, remainingBudget20: 95, annualEmissions: 6.3, reductionNeeded: 68, peakYear: 2005, netZeroYear: 2050 },
  { id: 'row', name: 'Rest of World', cumulativeGtCO2: 140, remainingBudget15: 31, remainingBudget20: 43, annualEmissions: 9.9, reductionNeeded: 22, peakYear: 2035, netZeroYear: 2065 },
];

const PATHWAYS = [
  { name: '1.5°C Orderly', color: '#22c55e', description: 'Rapid decarbonisation, carbon pricing, CCS deployment' },
  { name: '1.5°C Disorderly', color: '#f59e0b', description: 'Delayed action, abrupt policy shifts after 2025' },
  { name: '2°C Orderly', color: '#3b82f6', description: 'Gradual transition with moderate carbon pricing' },
  { name: '2°C Disorderly', color: '#ef4444', description: 'Late mover, stranded assets, social disruption' },
  { name: 'Current Policies', color: '#94a3b8', description: 'NDC-only implementation → ~2.8°C by 2100' },
];

const PATHWAY_DATA = Array.from({ length: 31 }, (_, i) => {
  const yr = 2020 + i;
  const t = i / 30;
  return {
    year: yr,
    '1.5°C Orderly': Math.max(0, 56.8 * (1 - t * 1.18) + sr(i) * 0.4),
    '1.5°C Disorderly': Math.max(0, 56.8 * (i < 5 ? 1 + t * 0.05 : 1 - (t - 0.17) * 1.4) + sr(i + 31) * 0.5),
    '2°C Orderly': Math.max(0, 56.8 * (1 - t * 0.72) + sr(i + 62) * 0.4),
    '2°C Disorderly': Math.max(0, 56.8 * (i < 10 ? 1 + t * 0.08 : 1 - (t - 0.33) * 0.88) + sr(i + 93) * 0.5),
    'Current Policies': 56.8 * (1 - t * 0.22) + sr(i + 124) * 0.6,
  };
});

const BUDGET_REMAINING = SECTORS.map(s => ({
  name: s.name,
  remaining: Math.max(0, s.budgetGtCO2 - s.usedGtCO2),
  used: Math.min(s.budgetGtCO2, s.usedGtCO2),
  exhaustion: s.usedGtCO2 >= s.budgetGtCO2 ? 'Exceeded' : s.usedGtCO2 / s.budgetGtCO2 > 0.85 ? 'Critical' : s.usedGtCO2 / s.budgetGtCO2 > 0.65 ? 'Warning' : 'On Track',
}));

const TABS = ['Overview', 'Sector Budgets', 'Regional Analysis', 'Pathway Analysis', 'Budget Tracker', 'Scenario Planner', 'Carbon Debt'];

export default function CarbonBudgetPage() {
  const [tab, setTab] = useState('Overview');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [pathwayFilter, setPathwayFilter] = useState('1.5°C Orderly');

  const globalBudget15 = REGIONS.find(r => r.id === 'global').remainingBudget15;
  const globalBudget20 = REGIONS.find(r => r.id === 'global').remainingBudget20;
  const globalEmissions = REGIONS.find(r => r.id === 'global').annualEmissions;
  const yearsRemaining15 = (globalBudget15 / globalEmissions).toFixed(1);

  const tabBar = { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 };
  const tabBtn = (t) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none',
    background: tab === t ? T.navy : T.surfaceH, color: tab === t ? '#fff' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });

  const statusColor = (s) => ({ 'On Track': T.green, 'Warning': T.amber, 'Critical': T.red, 'Exceeded': '#dc2626' }[s] || T.textSec);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Carbon Budget Tracker</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Global carbon budget accounting, sectoral pathways & net-zero timeline — EP-DH5</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Remaining 1.5°C Budget" value={`${globalBudget15} GtCO₂`} sub={`~${yearsRemaining15} years at current emissions`} color={T.red} />
        <KpiCard label="Remaining 2.0°C Budget" value={`${globalBudget20} GtCO₂`} sub="from Jan 2024 (IPCC AR6)" color={T.amber} />
        <KpiCard label="Annual Emissions" value={`${globalEmissions} Gt`} sub="GtCO₂eq/yr (2023)" color={T.navy} />
        <KpiCard label="Reduction Needed" value="43%" sub="by 2030 for 1.5°C" color={T.teal} />
        <KpiCard label="Cumulative Since 1850" value="2,900 Gt" sub="of 2,890 Gt historical budget" color={T.gold} />
      </div>

      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Budget Utilisation by Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BUDGET_REMAINING}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={9} angle={-25} textAnchor="end" height={55} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Bar dataKey="used" stackId="a" fill={T.red} name="Used (GtCO₂)" />
                <Bar dataKey="remaining" stackId="a" fill={T.green} name="Remaining (GtCO₂)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global Emissions Pathway Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={PATHWAY_DATA.filter((_, i) => i % 5 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Area type="monotone" dataKey="Current Policies" stroke={T.textSec} fill={T.textSec} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="2°C Orderly" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="1.5°C Orderly" stroke={T.sage} fill={T.sage} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>1.5°C Budget Remaining by Region (GtCO₂)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REGIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="remainingBudget15" fill={T.teal} name="1.5°C Budget Remaining" radius={[4, 4, 0, 0]} />
                <Bar dataKey="remainingBudget20" fill={T.navy} name="2.0°C Budget Remaining" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Sector Budgets' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setSectorFilter('all')} style={{ ...tabBtn('all'), background: sectorFilter === 'all' ? T.teal : T.surfaceH, color: sectorFilter === 'all' ? '#fff' : T.textSec }}>All Sectors</button>
            {SECTORS.map(s => (
              <button key={s.id} onClick={() => setSectorFilter(s.id)} style={{ ...tabBtn(s.id), background: sectorFilter === s.id ? T.teal : T.surfaceH, color: sectorFilter === s.id ? '#fff' : T.textSec }}>{s.emoji} {s.name}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {(sectorFilter === 'all' ? SECTORS : SECTORS.filter(s => s.id === sectorFilter)).map(s => {
              const pct = s.budgetGtCO2 > 0 ? Math.min(100, (s.usedGtCO2 / s.budgetGtCO2) * 100) : 100;
              const status = pct >= 100 ? 'Exceeded' : pct > 85 ? 'Critical' : pct > 65 ? 'Warning' : 'On Track';
              return (
                <div key={s.id} style={{ background: T.surface, borderRadius: 10, padding: 18, border: `1px solid ${statusColor(status)}40` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{s.emoji} {s.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor(status), background: `${statusColor(status)}20`, padding: '2px 8px', borderRadius: 4 }}>{status}</span>
                  </div>
                  <div style={{ background: T.surfaceH, borderRadius: 4, height: 8, marginBottom: 12 }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: statusColor(status), borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { l: 'Budget', v: `${s.budgetGtCO2} GtCO₂` },
                      { l: 'Used', v: `${s.usedGtCO2} GtCO₂`, c: statusColor(status) },
                      { l: 'Annual Emissions', v: `${s.emissionsGtY} Gt/yr` },
                      { l: 'Net Zero Year', v: s.netZeroYear, c: T.gold },
                      { l: '2030 Reduction Target', v: `${s.reductionTarget2030}%`, c: T.teal },
                      { l: 'Carbon Price', v: `$${s.carbonPrice}/tCO₂` },
                    ].map(({ l, v, c }) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c || T.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Regional Analysis' && (
        <div>
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Region', 'Historical (GtCO₂)', '1.5°C Remaining', '2.0°C Remaining', 'Annual (GtCO₂)', 'Reduction 2030', 'Peak Year', 'Net Zero'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{r.cumulativeGtCO2.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: r.remainingBudget15 < 50 ? T.red : T.green }}>{r.remainingBudget15}</td>
                    <td style={{ padding: '10px 12px', color: T.navy }}>{r.remainingBudget20}</td>
                    <td style={{ padding: '10px 12px', color: T.text }}>{r.annualEmissions}</td>
                    <td style={{ padding: '10px 12px', color: T.teal, fontWeight: 600 }}>{r.reductionNeeded}%</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{r.peakYear}</td>
                    <td style={{ padding: '10px 12px', color: T.gold, fontWeight: 600 }}>{r.netZeroYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Annual Emissions by Region (GtCO₂eq)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={REGIONS.filter(r => r.id !== 'global')}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="annualEmissions" fill={T.navy} name="Annual Emissions (Gt)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Pathway Analysis' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {PATHWAYS.map(p => (
              <button key={p.name} onClick={() => setPathwayFilter(p.name)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: `1px solid ${p.color}`, background: pathwayFilter === p.name ? p.color : 'transparent', color: pathwayFilter === p.name ? '#fff' : p.color }}>
                {p.name}
              </button>
            ))}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            {PATHWAYS.filter(p => p.name === pathwayFilter).map(p => (
              <div key={p.name} style={{ marginBottom: 12, padding: 14, background: T.surfaceH, borderRadius: 8, borderLeft: `4px solid ${p.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.name}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{p.description}</div>
              </div>
            ))}
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={PATHWAY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} label={{ value: 'GtCO₂eq/yr', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                {PATHWAYS.map(p => (
                  <Line key={p.name} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={p.name === pathwayFilter ? 3 : 1} dot={false} strokeOpacity={p.name === pathwayFilter ? 1 : 0.3} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Budget Tracker' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Budget Status — All Sectors</div>
            {BUDGET_REMAINING.map(s => {
              const totalBgt = SECTORS.find(sec => sec.name === s.name).budgetGtCO2;
              const pct = totalBgt > 0 ? Math.min(100, (s.used / totalBgt) * 100) : 100;
              return (
                <div key={s.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: statusColor(s.exhaustion), fontWeight: 600 }}>{s.exhaustion} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ background: T.surfaceH, borderRadius: 4, height: 10 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: statusColor(s.exhaustion), borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Net Zero Target Years</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[2030, 2075]} stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={10} width={110} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="netZeroYear" fill={T.gold} name="Net Zero Year" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Scenario Planner' && (
        <div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Scenario Comparison — Budget Exhaustion Year</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { scenario: '1.5°C Orderly', budget15ExhYear: '~2031', budget20ExhYear: '~2047', annualReduction: '7%/yr', carbonPriceBy2030: '$130/tCO₂', color: T.green },
                { scenario: '2°C Orderly', budget15ExhYear: '~2029', budget20ExhYear: '~2056', annualReduction: '4%/yr', carbonPriceBy2030: '$85/tCO₂', color: T.navy },
                { scenario: 'Current Policies', budget15ExhYear: '~2026', budget20ExhYear: '~2035', annualReduction: '1%/yr', carbonPriceBy2030: '$30/tCO₂', color: T.red },
              ].map(sc => (
                <div key={sc.scenario} style={{ background: T.surfaceH, borderRadius: 8, padding: 16, borderTop: `3px solid ${sc.color}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: sc.color, marginBottom: 12 }}>{sc.scenario}</div>
                  {[['1.5°C Budget Exhaustion', sc.budget15ExhYear], ['2.0°C Budget Exhaustion', sc.budget20ExhYear], ['Annual Reduction Required', sc.annualReduction], ['Carbon Price by 2030', sc.carbonPriceBy2030]].map(([l, v]) => (
                    <div key={l} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: T.textSec }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Carbon Debt' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard label="Historical Overshoot" value="510 GtCO₂" sub="above 1.5°C safe corridor" color={T.red} />
            <KpiCard label="Carbon Debt Value" value="$51T" sub="at $100/tCO₂ social cost" color={T.amber} />
            <KpiCard label="CDR Required" value="5–10 Gt/yr" sub="by 2050 for 1.5°C" color={T.navy} />
            <KpiCard label="Current CDR Capacity" value="0.04 Gt/yr" sub="DACCS + BECCS deployed" color={T.teal} />
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Carbon Removal Requirements by Pathway (2025–2050)</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={Array.from({ length: 6 }, (_, i) => {
                const yr = 2025 + i * 5;
                return {
                  year: yr,
                  '1.5°C CDR Need': Math.max(0, (i - 1) * 1.8 + sr(i) * 0.5),
                  '2°C CDR Need': Math.max(0, (i - 2) * 1.2 + sr(i + 10) * 0.3),
                  'Deployed CDR': 0.04 + i * 0.12 + sr(i + 20) * 0.05,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} label={{ value: 'GtCO₂/yr', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Area type="monotone" dataKey="1.5°C CDR Need" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="2°C CDR Need" stroke={T.amber} fill={T.amber} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Deployed CDR" stroke={T.sage} fill={T.sage} fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
