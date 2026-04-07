import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const COUNTRY_NAMES = [
  'UK','Germany','France','Italy','Spain','Netherlands','Belgium','Sweden',
  'Norway','Denmark','USA','Canada','Australia','Japan','Singapore',
  'Brazil','India','South Africa','Mexico','New Zealand',
];

const COUNTRIES = COUNTRY_NAMES.map((name, i) => ({
  name,
  baseQ60: sr(i * 11) * 0.008 + 0.012,
  heatExcessMortPct: sr(i * 17) * 3.5 + 0.5,
  coldExcessMortPct: sr(i * 23) * -1.5 - 0.2,
  floodExcessMortPct: sr(i * 29) * 0.8 + 0.1,
  urbanHeatIsland: sr(i * 31) * 2.5 + 0.5,
  adaptationCapacity: sr(i * 37) * 60 + 30,
  longevityImprovement: sr(i * 41) * 0.015 + 0.005,
  reserveImpact: sr(i * 43) * 8 + 1,
}));

const NGFS_SCENARIOS = [
  { name: 'Net Zero 2050', loadings: [1.02, 1.05, 1.08], color: T.green },
  { name: 'Below 2°C', loadings: [1.04, 1.09, 1.15], color: T.blue },
  { name: 'Delayed Transition', loadings: [1.07, 1.16, 1.28], color: T.amber },
  { name: 'Hot House World', loadings: [1.12, 1.28, 1.52], color: T.red },
];

const HORIZONS = ['2030', '2040', '2050'];
const WARMING = { '2030': 1.1, '2040': 1.8, '2050': 2.5 };

const AGE_BANDS = ['50-54','55-59','60-64','65-69','70-74','75-79','80-84','85+'];
const AGE_BASE_MORT = AGE_BANDS.map((_, j) => sr(j * 7) * 0.02 + 0.005 * (j + 1));

const TABS = [
  'Mortality Dashboard',
  'Climate Life Tables',
  'Country Deep Dive',
  'Reserve Impact',
  'Longevity Risk Attribution',
];

const kpiCard = (label, value, sub, color = T.indigo) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const sectionTitle = title => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
);

export default function ClimateMortalityLongevityPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [selectedHorizon, setSelectedHorizon] = useState(2);
  const [selectedCountry, setSelectedCountry] = useState(0);

  const warming = WARMING[HORIZONS[selectedHorizon]];
  const scenarioMultiplier = NGFS_SCENARIOS[selectedScenario].loadings[selectedHorizon];

  const computedCountries = useMemo(() => {
    return COUNTRIES.map(c => {
      const climateMortalityRate = c.baseQ60 * scenarioMultiplier * (1 + c.heatExcessMortPct / 100 * warming);
      const netLongevityImpact = c.longevityImprovement - (c.heatExcessMortPct * warming / 100);
      const excessDeathsPer100k = c.heatExcessMortPct * 1000;
      return { ...c, climateMortalityRate, netLongevityImpact, excessDeathsPer100k };
    });
  }, [selectedScenario, selectedHorizon, scenarioMultiplier, warming]);

  const kpis = useMemo(() => {
    if (!computedCountries.length) return { avgHeatExcess: 0, avgReserveImpact: 0, pctAtRisk: 0, avgLongevityImprovement: 0 };
    const avgHeatExcess = computedCountries.reduce((s, c) => s + c.heatExcessMortPct, 0) / computedCountries.length;
    const avgReserveImpact = computedCountries.reduce((s, c) => s + c.reserveImpact, 0) / computedCountries.length;
    const atRisk = computedCountries.filter(c => c.climateMortalityRate > c.baseQ60 * 1.1);
    const pctAtRisk = computedCountries.length ? (atRisk.length / computedCountries.length) * 100 : 0;
    const avgLongevityImprovement = computedCountries.reduce((s, c) => s + c.longevityImprovement, 0) / computedCountries.length;
    return { avgHeatExcess, avgReserveImpact, pctAtRisk, avgLongevityImprovement };
  }, [computedCountries]);

  const sortedByHeat = useMemo(() =>
    [...computedCountries].sort((a, b) => b.heatExcessMortPct - a.heatExcessMortPct).slice(0, 15),
    [computedCountries]
  );

  const ageBandData = useMemo(() => {
    return AGE_BANDS.map((band, j) => {
      const base = AGE_BASE_MORT[j];
      const adj = {};
      NGFS_SCENARIOS.forEach((scen, si) => {
        const mult = scen.loadings[selectedHorizon];
        const w = WARMING[HORIZONS[selectedHorizon]];
        const c = COUNTRIES[selectedCountry];
        adj[scen.name] = base * mult * (1 + c.heatExcessMortPct / 100 * w);
      });
      return { band, base, ...adj };
    });
  }, [selectedHorizon, selectedCountry]);

  const mortalityTrajectory = useMemo(() => {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    const c = COUNTRIES[selectedCountry];
    return years.map((yr, yi) => {
      const progress = (yr - 2025) / 25;
      const row = { year: yr };
      NGFS_SCENARIOS.forEach((scen, si) => {
        const idx = Math.min(2, Math.floor(progress * 3));
        const mult = scen.loadings[idx] ?? scen.loadings[2];
        const w = 1.1 + progress * 1.4;
        row[scen.name] = c.baseQ60 * mult * (1 + c.heatExcessMortPct / 100 * w);
      });
      return row;
    });
  }, [selectedCountry]);

  const reserveChartData = useMemo(() =>
    [...computedCountries].sort((a, b) => b.reserveImpact - a.reserveImpact),
    [computedCountries]
  );

  const radarData = useMemo(() => {
    const c = computedCountries[selectedCountry];
    const avgHeat = computedCountries.length ? computedCountries.reduce((s, x) => s + x.heatExcessMortPct, 0) / computedCountries.length : 0;
    const avgCold = computedCountries.length ? computedCountries.reduce((s, x) => s + Math.abs(x.coldExcessMortPct), 0) / computedCountries.length : 0;
    const avgFlood = computedCountries.length ? computedCountries.reduce((s, x) => s + x.floodExcessMortPct, 0) / computedCountries.length : 0;
    const avgUHI = computedCountries.length ? computedCountries.reduce((s, x) => s + x.urbanHeatIsland, 0) / computedCountries.length : 0;
    const avgAdaptGap = computedCountries.length ? computedCountries.reduce((s, x) => s + (100 - x.adaptationCapacity), 0) / computedCountries.length : 0;
    return [
      { dim: 'Heat Risk', country: c.heatExcessMortPct * 20, average: avgHeat * 20 },
      { dim: 'Cold Mitigation', country: Math.abs(c.coldExcessMortPct) * 30, average: avgCold * 30 },
      { dim: 'Flood Risk', country: c.floodExcessMortPct * 60, average: avgFlood * 60 },
      { dim: 'Urban Heat', country: c.urbanHeatIsland * 15, average: avgUHI * 15 },
      { dim: 'Adaptation Gap', country: 100 - c.adaptationCapacity, average: avgAdaptGap },
    ];
  }, [computedCountries, selectedCountry]);

  const longevityRanking = useMemo(() =>
    [...computedCountries].sort((a, b) => b.netLongevityImpact - a.netLongevityImpact),
    [computedCountries]
  );

  const country = computedCountries[selectedCountry];

  const tabStyle = (i) => ({
    padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
    color: activeTab === i ? T.indigo : T.muted,
    background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
    whiteSpace: 'nowrap',
  });

  const selectStyle = {
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
    padding: '6px 10px', fontSize: 12, color: T.text, cursor: 'pointer',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 28px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.gold, color: T.navy, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.1em' }}>EP-DC1</span>
          <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>climate-mortality-longevity</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Climate Mortality &amp; Longevity Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Actuarial climate-adjusted life tables · Excess mortality risk · Reserve adequacy under NGFS scenarios</div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 0, padding: '0 28px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} style={tabStyle(i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>

        {/* Scenario / Horizon controls — always visible */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>NGFS Scenario:</div>
          {NGFS_SCENARIOS.map((s, i) => (
            <button key={s.name} onClick={() => setSelectedScenario(i)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: selectedScenario === i ? s.color : T.sub,
              color: selectedScenario === i ? '#fff' : T.muted,
              border: `1px solid ${selectedScenario === i ? s.color : T.border}`,
            }}>{s.name}</button>
          ))}
          <div style={{ marginLeft: 12, fontSize: 12, color: T.muted, fontWeight: 600 }}>Horizon:</div>
          {HORIZONS.map((h, i) => (
            <button key={h} onClick={() => setSelectedHorizon(i)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: selectedHorizon === i ? T.indigo : T.sub,
              color: selectedHorizon === i ? '#fff' : T.muted,
              border: `1px solid ${selectedHorizon === i ? T.indigo : T.border}`,
            }}>{h}</button>
          ))}
        </div>

        {/* TAB 0: MORTALITY DASHBOARD */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              {kpiCard('Avg Heat Excess Mortality', `${kpis.avgHeatExcess.toFixed(2)}%`, 'per 1°C warming at age 60+', T.red)}
              {kpiCard('Avg Reserve Impact', `${kpis.avgReserveImpact.toFixed(1)}%`, 'strengthening under 3°C scenario', T.amber)}
              {kpiCard('Countries at Risk', `${kpis.pctAtRisk.toFixed(0)}%`, `mortality rate > 110% of baseline`, T.orange)}
              {kpiCard('Avg Longevity Improvement', `${(kpis.avgLongevityImprovement * 100).toFixed(2)}%`, 'annual rate before climate drag', T.green)}
            </div>
            {sectionTitle('Heat Excess Mortality by Country (Top 15) — colored by adaptation capacity')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedByHeat} margin={{ left: 10, right: 20, top: 4, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${v.toFixed(1)}%`} label={{ value: 'Excess Mort %', angle: -90, position: 'insideLeft', fill: T.muted, fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, 'Heat Excess Mortality']} />
                  <Bar dataKey="heatExcessMortPct" name="Heat Excess Mortality %" radius={[3, 3, 0, 0]}>
                    {sortedByHeat.map((c, i) => {
                      const adapt = c.adaptationCapacity;
                      const color = adapt > 70 ? T.green : adapt > 50 ? T.amber : T.red;
                      return <Cell key={i} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
                {[['High Adaptation (>70)', T.green], ['Medium Adaptation (50-70)', T.amber], ['Low Adaptation (<50)', T.red]].map(([l, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.muted }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />{l}
                  </div>
                ))}
              </div>
            </div>
            {sectionTitle('Country Summary — Climate Mortality Parameters')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Country','Base Q60','Climate Mort Rate','Heat Excess %','Adapt Capacity','Reserve Impact %','Net Longevity'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {computedCountries.map((c, i) => (
                    <tr key={c.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{(c.baseQ60 * 1000).toFixed(2)}‰</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.climateMortalityRate > c.baseQ60 * 1.1 ? T.red : T.green }}>{(c.climateMortalityRate * 1000).toFixed(2)}‰</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.heatExcessMortPct.toFixed(2)}%</td>
                      <td style={{ padding: '8px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${c.adaptationCapacity}%`, height: '100%', background: c.adaptationCapacity > 70 ? T.green : c.adaptationCapacity > 50 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: T.muted }}>{c.adaptationCapacity.toFixed(0)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.amber }}>{c.reserveImpact.toFixed(1)}%</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.netLongevityImpact > 0 ? T.green : T.red }}>{(c.netLongevityImpact * 100).toFixed(3)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 1: CLIMATE LIFE TABLES */}
        {activeTab === 1 && (
          <div>
            {sectionTitle('Base vs Climate-Adjusted Mortality Rate by Age Band')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={ageBandData} margin={{ left: 10, right: 20, top: 4, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="band" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${(v * 1000).toFixed(1)}‰`} />
                  <Tooltip formatter={(v, n) => [`${(v * 1000).toFixed(3)}‰`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="base" name="Baseline" fill={T.border} opacity={0.8} />
                  {NGFS_SCENARIOS.map(s => (
                    <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3, fill: s.color }} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Age-Band Mortality Adjustment Table')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>Age Band</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>Baseline (‰)</th>
                    {NGFS_SCENARIOS.map(s => (
                      <th key={s.name} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: s.color, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{s.name} (‰)</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ageBandData.map((row, i) => (
                    <tr key={row.band} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{row.band}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{(row.base * 1000).toFixed(3)}</td>
                      {NGFS_SCENARIOS.map(s => (
                        <td key={s.name} style={{ padding: '8px 14px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: s.color }}>
                          {((row[s.name] ?? 0) * 1000).toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sectionTitle('Net Longevity Impact by NGFS Scenario')}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {NGFS_SCENARIOS.map((s, si) => {
                const mult = s.loadings[selectedHorizon];
                const w = WARMING[HORIZONS[selectedHorizon]];
                const c = COUNTRIES[selectedCountry];
                const netImpact = c.longevityImprovement - (c.heatExcessMortPct * w * mult / 100);
                return (
                  <div key={s.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 6 }}>{s.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: netImpact > 0 ? T.green : T.red }}>
                      {(netImpact * 100).toFixed(3)}%
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>net annual longevity trend for {COUNTRY_NAMES[selectedCountry]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: COUNTRY DEEP DIVE */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Country:</div>
              <select value={selectedCountry} onChange={e => setSelectedCountry(Number(e.target.value))} style={selectStyle}>
                {COUNTRY_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              {kpiCard('Heat Excess Mortality', `${country.heatExcessMortPct.toFixed(2)}%`, 'per 1°C at age 60+', T.red)}
              {kpiCard('Cold Mitigation', `${country.coldExcessMortPct.toFixed(2)}%`, 'mortality reduction milder winters', T.blue)}
              {kpiCard('Flood Risk', `${country.floodExcessMortPct.toFixed(2)}%`, 'flood-related excess mortality', T.teal)}
              {kpiCard('Urban Heat Island', `+${country.urbanHeatIsland.toFixed(2)}°C`, 'above national average', T.orange)}
              {kpiCard('Adaptation Capacity', `${country.adaptationCapacity.toFixed(0)}/100`, 'climate adaptation score', T.indigo)}
            </div>
            {sectionTitle(`Mortality Trajectory 2025-2050 — ${COUNTRY_NAMES[selectedCountry]}`)}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mortalityTrajectory} margin={{ left: 10, right: 20, top: 4, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${(v * 1000).toFixed(2)}‰`} />
                  <Tooltip formatter={(v, n) => [`${(v * 1000).toFixed(3)}‰`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  {NGFS_SCENARIOS.map(s => (
                    <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Risk Profile Summary')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {[
                { label: 'Base Mortality Rate (Q60)', value: `${(country.baseQ60 * 1000).toFixed(3)}‰`, icon: '📊' },
                { label: 'Climate-Adjusted Rate', value: `${(country.climateMortalityRate * 1000).toFixed(3)}‰`, icon: '🌡️', color: T.red },
                { label: 'Reserve Strengthening Needed', value: `${country.reserveImpact.toFixed(1)}%`, icon: '🏦', color: T.amber },
                { label: 'Annual Longevity Improvement', value: `${(country.longevityImprovement * 100).toFixed(3)}%`, icon: '📈', color: T.green },
                { label: 'Net Longevity Impact', value: `${(country.netLongevityImpact * 100).toFixed(3)}%`, icon: '⚖️', color: country.netLongevityImpact > 0 ? T.green : T.red },
                { label: 'Excess Deaths per 100k', value: `${country.excessDeathsPer100k.toFixed(0)}`, icon: '📉', color: T.red },
              ].map(item => (
                <div key={item.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: item.color || T.text }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RESERVE IMPACT */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              {kpiCard('Total Reserve Exposure', `${computedCountries.reduce((s, c) => s + c.reserveImpact, 0).toFixed(0)}%`, 'aggregate reserve strengthening ΣΔ', T.red)}
              {kpiCard('Avg Reserve Impact', `${kpis.avgReserveImpact.toFixed(1)}%`, 'mean strengthening under 3°C', T.amber)}
              {kpiCard('Max Country Reserve Impact', `${Math.max(...computedCountries.map(c => c.reserveImpact)).toFixed(1)}%`, 'worst-case country', T.orange)}
              {kpiCard('Min Reserve Impact', `${Math.min(...computedCountries.map(c => c.reserveImpact)).toFixed(1)}%`, 'best-case country', T.green)}
            </div>
            {sectionTitle('Reserve Strengthening Required by Country')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0 8px', marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reserveChartData} margin={{ left: 10, right: 20, top: 4, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `${v.toFixed(1)}%`} />
                  <Tooltip formatter={v => [`${v.toFixed(2)}%`, 'Reserve Impact']} />
                  <ReferenceLine y={kpis.avgReserveImpact} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Average', fill: T.amber, fontSize: 10 }} />
                  <Bar dataKey="reserveImpact" name="Reserve Impact %" radius={[3, 3, 0, 0]}>
                    {reserveChartData.map((c, i) => (
                      <Cell key={i} fill={c.reserveImpact > kpis.avgReserveImpact * 1.2 ? T.red : c.reserveImpact > kpis.avgReserveImpact ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {sectionTitle('Reserve Impact vs Adaptation Capacity')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Country','Reserve Impact %','Adaptation Capacity','Heat Excess %','Climate Mort Rate','Risk Tier'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...reserveChartData].map((c, i) => {
                    const tier = c.reserveImpact > 6 ? 'HIGH' : c.reserveImpact > 4 ? 'MEDIUM' : 'LOW';
                    const tierColor = tier === 'HIGH' ? T.red : tier === 'MEDIUM' ? T.amber : T.green;
                    return (
                      <tr key={c.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.amber }}>{c.reserveImpact.toFixed(2)}%</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.adaptationCapacity.toFixed(0)}</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.heatExcessMortPct.toFixed(2)}%</td>
                        <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{(c.climateMortalityRate * 1000).toFixed(3)}‰</td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{ background: tierColor, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{tier}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LONGEVITY RISK ATTRIBUTION */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Country for Radar:</div>
              <select value={selectedCountry} onChange={e => setSelectedCountry(Number(e.target.value))} style={selectStyle}>
                {COUNTRY_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div>
                {sectionTitle(`Risk Dimensions — ${COUNTRY_NAMES[selectedCountry]} vs Average`)}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 0' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: T.muted }} />
                      <PolarRadiusAxis angle={90} tick={{ fontSize: 9, fill: T.muted }} />
                      <Radar name={COUNTRY_NAMES[selectedCountry]} dataKey="country" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                      <Radar name="Portfolio Average" dataKey="average" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                {sectionTitle('Net Longevity Impact — Top 5 & Bottom 5')}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: T.green + '15', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.green }}>TOP 5 — Strongest Longevity Outlook</div>
                  {longevityRanking.slice(0, 5).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <span style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{i + 1}. {c.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.green, fontWeight: 700 }}>+{(c.netLongevityImpact * 100).toFixed(3)}%</span>
                    </div>
                  ))}
                  <div style={{ padding: '10px 14px', background: T.red + '15', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.red }}>BOTTOM 5 — Highest Climate Longevity Risk</div>
                  {longevityRanking.slice(-5).reverse().map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <span style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{i + 1}. {c.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.red, fontWeight: 700 }}>{(c.netLongevityImpact * 100).toFixed(3)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {sectionTitle('Full Longevity Risk Attribution Table')}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Rank','Country','Heat Exposure','Cold Mitigation','Flood Risk','UHI Effect','Adapt Gap','Net Longevity'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {longevityRanking.map((c, i) => (
                    <tr key={c.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 14px', color: T.muted, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red }}>{c.heatExcessMortPct.toFixed(2)}%</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.blue }}>{c.coldExcessMortPct.toFixed(2)}%</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.teal }}>{c.floodExcessMortPct.toFixed(2)}%</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.orange }}>{c.urbanHeatIsland.toFixed(2)}°C</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{(100 - c.adaptationCapacity).toFixed(0)}</td>
                      <td style={{ padding: '8px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: c.netLongevityImpact > 0 ? T.green : T.red }}>
                        {(c.netLongevityImpact * 100).toFixed(3)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
