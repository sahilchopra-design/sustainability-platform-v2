import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PERILS = ['Flood', 'Wildfire', 'Windstorm', 'Agricultural Drought', 'Extreme Heat'];
const REGIONS = [
  'Northern Europe', 'Southern Europe', 'North America', 'Latin America',
  'Asia Pacific', 'South Asia', 'Middle East', 'Africa', 'Oceania', 'Arctic-Boreal',
];
const NGFS_SCENARIOS = [
  { name: 'Net Zero 2050', freqMult: 1.0, sevMult: 1.0, color: T.green },
  { name: 'Below 2°C', freqMult: 1.2, sevMult: 1.15, color: T.blue },
  { name: 'Delayed Transition', freqMult: 1.5, sevMult: 1.35, color: T.amber },
  { name: 'Hot House World', freqMult: 2.1, sevMult: 1.75, color: T.red },
];
const YEARS = [2025, 2030, 2035, 2040, 2045, 2050];
const PERIL_COLORS = [T.blue, T.orange, T.purple, T.amber, T.red];

// 50 region-peril combinations — all module-level
const COMBOS = Array.from({ length: 50 }, (_, i) => {
  const regionIdx = i % 10;
  const perilIdx = Math.floor(i / 10);
  return {
    id: i,
    region: REGIONS[regionIdx],
    peril: PERILS[perilIdx],
    perilIdx,
    regionIdx,
    baseClaimsFreq: sr(i * 11) * 0.05 + 0.01,
    baseSeverityK: sr(i * 17) * 200 + 20,
    climateFreqTrend: sr(i * 23) * 0.08 + 0.02,
    climateSeverityTrend: sr(i * 29) * 0.05 + 0.01,
    exposureGrowth: sr(i * 31) * 0.03 + 0.01,
    insuranceGap: sr(i * 37) * 0.6 + 0.1,
    lastYearClaims: sr(i * 41) * 50 + 5,
  };
});

function projectClaims(combo, yearOffset, scenario) {
  const { baseClaimsFreq, baseSeverityK, climateFreqTrend, climateSeverityTrend, exposureGrowth } = combo;
  const freqAdj = baseClaimsFreq * Math.pow(1 + climateFreqTrend * scenario.freqMult, yearOffset);
  const sevAdj = baseSeverityK * Math.pow(1 + climateSeverityTrend * scenario.sevMult, yearOffset);
  const expAdj = Math.pow(1 + exposureGrowth, yearOffset);
  return freqAdj * sevAdj * expAdj;
}

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '18px 20px', borderLeft: `4px solid ${color || T.indigo}`,
  }}>
    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: active === t ? T.indigo : T.muted,
        borderBottom: active === t ? `2px solid ${T.indigo}` : '2px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>{children}</div>
);

const TABS = ['Claims Forecast Dashboard', 'Peril Line Analysis', 'Regional Claims Map', 'Frequency × Severity', 'Insurance Gap Analysis'];

export default function ClimateClaimsForecastingPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedScenario, setSelectedScenario] = useState('Net Zero 2050');
  const [selectedYear, setSelectedYear] = useState(2040);

  const scenario = useMemo(() => NGFS_SCENARIOS.find(s => s.name === selectedScenario), [selectedScenario]);

  // Aggregate projections for all scenarios across all years
  const scenarioTimeSeries = useMemo(() => {
    return YEARS.map(yr => {
      const yearOffset = yr - 2025;
      const row = { year: yr };
      NGFS_SCENARIOS.forEach(sc => {
        const total = COMBOS.reduce((sum, c) => sum + projectClaims(c, yearOffset, sc), 0);
        row[sc.name] = Math.round(total);
      });
      return row;
    });
  }, []);

  // KPIs
  const totalProjected2050 = useMemo(() => {
    const yearOffset = 25;
    return COMBOS.reduce((sum, c) => sum + projectClaims(c, yearOffset, scenario), 0);
  }, [scenario]);

  const totalProjected2025 = useMemo(() => {
    return COMBOS.reduce((sum, c) => sum + projectClaims(c, 0, scenario), 0);
  }, [scenario]);

  const claimsCAGR = useMemo(() => {
    if (totalProjected2025 <= 0) return 0;
    return (Math.pow(totalProjected2050 / totalProjected2025, 1 / 25) - 1) * 100;
  }, [totalProjected2025, totalProjected2050]);

  const avgInsuranceGap = useMemo(() => {
    const sum = COMBOS.reduce((s, c) => s + c.insuranceGap, 0);
    return COMBOS.length ? sum / COMBOS.length : 0;
  }, []);

  const avgFreqTrend = useMemo(() => {
    const sum = COMBOS.reduce((s, c) => s + c.climateFreqTrend, 0);
    return COMBOS.length ? sum / COMBOS.length : 0;
  }, []);

  // By peril for selected scenario — 2025, 2040, 2050
  const byPerilData = useMemo(() => {
    return PERILS.map((peril, pi) => {
      const combos = COMBOS.filter(c => c.perilIdx === pi);
      const claims2025 = combos.reduce((s, c) => s + projectClaims(c, 0, scenario), 0);
      const claims2040 = combos.reduce((s, c) => s + projectClaims(c, 15, scenario), 0);
      const claims2050 = combos.reduce((s, c) => s + projectClaims(c, 25, scenario), 0);
      const avgFreq = combos.length ? combos.reduce((s, c) => s + c.climateFreqTrend, 0) / combos.length : 0;
      const avgSev = combos.length ? combos.reduce((s, c) => s + c.climateSeverityTrend, 0) / combos.length : 0;
      return { peril, claims2025: Math.round(claims2025), claims2040: Math.round(claims2040), claims2050: Math.round(claims2050), avgFreq, avgSev };
    });
  }, [scenario]);

  // By region for selected scenario at 2050
  const byRegionData2050 = useMemo(() => {
    return REGIONS.map(region => {
      const combos = COMBOS.filter(c => c.region === region);
      const claims2050 = combos.reduce((s, c) => s + projectClaims(c, 25, scenario), 0);
      return { region: region.replace(' ', '\n'), regionFull: region, claims2050: Math.round(claims2050) };
    }).sort((a, b) => b.claims2050 - a.claims2050);
  }, [scenario]);

  // Scatter data — freq trend vs sev trend for all 50 combos
  const scatterData = useMemo(() => {
    return COMBOS.map(c => ({
      x: +(c.climateFreqTrend * 100).toFixed(2),
      y: +(c.climateSeverityTrend * 100).toFixed(2),
      z: c.lastYearClaims,
      peril: c.peril,
      region: c.region,
      perilIdx: c.perilIdx,
    }));
  }, []);

  // Decomposition for selected year
  const yearOffset = selectedYear - 2025;
  const decompositionData = useMemo(() => {
    return PERILS.map((peril, pi) => {
      const combos = COMBOS.filter(c => c.perilIdx === pi);
      // baseline (no climate trends)
      const baseline = combos.reduce((s, c) => s + c.baseClaimsFreq * c.baseSeverityK * Math.pow(1 + c.exposureGrowth, yearOffset), 0);
      // freq-driven only
      const freqDriven = combos.reduce((s, c) => {
        const full = projectClaims(c, yearOffset, scenario);
        const noFreq = c.baseClaimsFreq * c.baseSeverityK * Math.pow(1 + c.climateSeverityTrend * scenario.sevMult, yearOffset) * Math.pow(1 + c.exposureGrowth, yearOffset);
        return s + Math.max(0, full - noFreq);
      }, 0);
      // sev-driven only
      const sevDriven = combos.reduce((s, c) => {
        const full = projectClaims(c, yearOffset, scenario);
        const noSev = c.baseClaimsFreq * Math.pow(1 + c.climateFreqTrend * scenario.freqMult, yearOffset) * c.baseSeverityK * Math.pow(1 + c.exposureGrowth, yearOffset);
        return s + Math.max(0, full - noSev);
      }, 0);
      const total = combos.reduce((s, c) => s + projectClaims(c, yearOffset, scenario), 0);
      const expDriven = Math.max(0, total - baseline);
      const pctFreq = total > 0 ? (freqDriven / total * 100) : 0;
      const pctSev = total > 0 ? (sevDriven / total * 100) : 0;
      const pctExp = total > 0 ? (expDriven / total * 100) : 0;
      return {
        peril,
        freqDriven: Math.round(freqDriven),
        sevDriven: Math.round(sevDriven),
        expDriven: Math.round(expDriven),
        pctFreq: pctFreq.toFixed(1),
        pctSev: pctSev.toFixed(1),
        pctExp: pctExp.toFixed(1),
      };
    });
  }, [scenario, yearOffset]);

  // Insurance gap data by region
  const gapByRegion = useMemo(() => {
    return REGIONS.map(region => {
      const combos = COMBOS.filter(c => c.region === region);
      const avgGap = combos.length ? combos.reduce((s, c) => s + c.insuranceGap, 0) / combos.length : 0;
      return { region: region.split(' ').slice(-1)[0], regionFull: region, avgGap: +(avgGap * 100).toFixed(1) };
    }).sort((a, b) => b.avgGap - a.avgGap);
  }, []);

  // Insured vs uninsured time series
  const insuredVsUninsured = useMemo(() => {
    return YEARS.map(yr => {
      const yOffset = yr - 2025;
      const totalClaims = COMBOS.reduce((s, c) => s + projectClaims(c, yOffset, scenario), 0);
      const uninsured = COMBOS.reduce((s, c) => s + projectClaims(c, yOffset, scenario) * c.insuranceGap, 0);
      const insured = totalClaims - uninsured;
      return { year: yr, insured: Math.round(insured), uninsured: Math.round(uninsured) };
    });
  }, [scenario]);

  // Top 10 protection gap by region-peril
  const topGaps = useMemo(() => {
    return [...COMBOS]
      .sort((a, b) => (b.lastYearClaims * b.insuranceGap) - (a.lastYearClaims * a.insuranceGap))
      .slice(0, 10)
      .map(c => ({
        label: `${c.region} / ${c.peril}`,
        gap: +(c.insuranceGap * 100).toFixed(1),
        absGap: +(c.lastYearClaims * c.insuranceGap).toFixed(1),
      }));
  }, []);

  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
  const thStyle = { background: T.sub, padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` };
  const tdStyle = { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.text };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          EP-DC5 · Climate Claims Forecasting Suite
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, marginBottom: 4 }}>
          Climate Claims Forecasting Suite
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>
          Forward-looking insurance claims projection 2025–2050 · NGFS scenario conditioning · Frequency × Severity model · 5 perils × 10 regions
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Claims Forecast Dashboard */}
      {activeTab === TABS[0] && (
        <div>
          {/* Scenario selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {NGFS_SCENARIOS.map(sc => (
              <button key={sc.name} onClick={() => setSelectedScenario(sc.name)} style={{
                padding: '7px 14px', borderRadius: 6, border: `1px solid ${selectedScenario === sc.name ? sc.color : T.border}`,
                background: selectedScenario === sc.name ? sc.color : T.card, color: selectedScenario === sc.name ? '#fff' : T.muted,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{sc.name}</button>
            ))}
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Total Projected Claims 2050" value={`$${(totalProjected2050 / 1000).toFixed(1)}B`} sub={`Scenario: ${selectedScenario}`} color={scenario.color} />
            <KpiCard label="Claims CAGR (2025–2050)" value={`${claimsCAGR.toFixed(2)}%`} sub="Compound annual growth rate" color={T.amber} />
            <KpiCard label="Avg Insurance Gap" value={`${(avgInsuranceGap * 100).toFixed(1)}%`} sub="Uninsured fraction across all combos" color={T.red} />
            <KpiCard label="Avg Climate Freq Trend" value={`${(avgFreqTrend * 100).toFixed(2)}%/yr`} sub="Annual frequency increase" color={T.blue} />
          </div>

          <SectionTitle>Total Projected Claims 2025–2050 — All NGFS Scenarios ($M)</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={scenarioTimeSeries} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}B`} />
                <Tooltip formatter={(v, n) => [`$${(v / 1000).toFixed(2)}B`, n]} />
                <Legend />
                {NGFS_SCENARIOS.map(sc => (
                  <Area key={sc.name} type="monotone" dataKey={sc.name} stroke={sc.color} fill={sc.color} fillOpacity={0.12} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>NGFS Scenario Comparison — 2050 Total Claims</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Scenario</th>
                  <th style={thStyle}>Freq Multiplier</th>
                  <th style={thStyle}>Severity Multiplier</th>
                  <th style={thStyle}>2025 Claims ($M)</th>
                  <th style={thStyle}>2050 Claims ($M)</th>
                  <th style={thStyle}>CAGR</th>
                </tr>
              </thead>
              <tbody>
                {NGFS_SCENARIOS.map(sc => {
                  const c2025 = COMBOS.reduce((s, c) => s + projectClaims(c, 0, sc), 0);
                  const c2050 = COMBOS.reduce((s, c) => s + projectClaims(c, 25, sc), 0);
                  const cagr = c2025 > 0 ? (Math.pow(c2050 / c2025, 1 / 25) - 1) * 100 : 0;
                  return (
                    <tr key={sc.name}>
                      <td style={tdStyle}><span style={{ color: sc.color, fontWeight: 700 }}>{sc.name}</span></td>
                      <td style={tdStyle}>{sc.freqMult.toFixed(1)}×</td>
                      <td style={tdStyle}>{sc.sevMult.toFixed(2)}×</td>
                      <td style={tdStyle}>${Math.round(c2025).toLocaleString()}</td>
                      <td style={tdStyle}>${Math.round(c2050).toLocaleString()}</td>
                      <td style={tdStyle}>{cagr.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Peril Line Analysis */}
      {activeTab === TABS[1] && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {NGFS_SCENARIOS.map(sc => (
              <button key={sc.name} onClick={() => setSelectedScenario(sc.name)} style={{
                padding: '7px 14px', borderRadius: 6, border: `1px solid ${selectedScenario === sc.name ? sc.color : T.border}`,
                background: selectedScenario === sc.name ? sc.color : T.card, color: selectedScenario === sc.name ? '#fff' : T.muted,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{sc.name}</button>
            ))}
          </div>

          <SectionTitle>Claims by Peril — 2025 vs 2040 vs 2050 ($M)</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byPerilData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="peril" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={v => `$${v.toLocaleString()}M`} />
                <Legend />
                <Bar dataKey="claims2025" name="2025" fill={T.blue} />
                <Bar dataKey="claims2040" name="2040" fill={T.amber} />
                <Bar dataKey="claims2050" name="2050" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>Peril Line Detail — {selectedScenario}</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Peril</th>
                  <th style={thStyle}>Avg Freq Trend/yr</th>
                  <th style={thStyle}>Avg Sev Trend/yr</th>
                  <th style={thStyle}>2025 Claims ($M)</th>
                  <th style={thStyle}>2040 Claims ($M)</th>
                  <th style={thStyle}>2050 Claims ($M)</th>
                  <th style={thStyle}>Growth ×</th>
                </tr>
              </thead>
              <tbody>
                {byPerilData.map((row, i) => (
                  <tr key={row.peril}>
                    <td style={tdStyle}><span style={{ color: PERIL_COLORS[i], fontWeight: 700 }}>{row.peril}</span></td>
                    <td style={tdStyle}>{(row.avgFreq * 100).toFixed(2)}%</td>
                    <td style={tdStyle}>{(row.avgSev * 100).toFixed(2)}%</td>
                    <td style={tdStyle}>${row.claims2025.toLocaleString()}</td>
                    <td style={tdStyle}>${row.claims2040.toLocaleString()}</td>
                    <td style={tdStyle}>${row.claims2050.toLocaleString()}</td>
                    <td style={tdStyle}>{row.claims2025 > 0 ? (row.claims2050 / row.claims2025).toFixed(2) : '—'}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Regional Claims Map */}
      {activeTab === TABS[2] && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {NGFS_SCENARIOS.map(sc => (
              <button key={sc.name} onClick={() => setSelectedScenario(sc.name)} style={{
                padding: '7px 14px', borderRadius: 6, border: `1px solid ${selectedScenario === sc.name ? sc.color : T.border}`,
                background: selectedScenario === sc.name ? sc.color : T.card, color: selectedScenario === sc.name ? '#fff' : T.muted,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{sc.name}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Projected 2050 Claims by Region — {selectedScenario} ($M)</SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byRegionData2050} layout="vertical" margin={{ top: 4, right: 24, left: 80, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                  <YAxis type="category" dataKey="regionFull" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={v => `$${v.toLocaleString()}M`} />
                  <Bar dataKey="claims2050" fill={T.indigo}>
                    {byRegionData2050.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? T.red : i < 6 ? T.amber : T.blue} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Freq Trend vs Severity Trend — All 50 Region-Peril Combos</SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Freq Trend %" tick={{ fontSize: 10 }} label={{ value: 'Freq Trend %/yr', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Sev Trend %" tick={{ fontSize: 10 }} label={{ value: 'Sev Trend %/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 11 }}>
                        <div style={{ fontWeight: 700 }}>{d?.peril} / {d?.region}</div>
                        <div>Freq: {d?.x}%/yr · Sev: {d?.y}%/yr</div>
                        <div>Last Yr Claims: ${d?.z?.toFixed(1)}M</div>
                      </div>
                    );
                  }} />
                  {PERILS.map((peril, pi) => (
                    <Scatter key={peril} name={peril} data={scatterData.filter(d => d.perilIdx === pi)} fill={PERIL_COLORS[pi]} />
                  ))}
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Frequency × Severity Decomposition */}
      {activeTab === TABS[3] && (
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {NGFS_SCENARIOS.map(sc => (
                <button key={sc.name} onClick={() => setSelectedScenario(sc.name)} style={{
                  padding: '7px 14px', borderRadius: 6, border: `1px solid ${selectedScenario === sc.name ? sc.color : T.border}`,
                  background: selectedScenario === sc.name ? sc.color : T.card, color: selectedScenario === sc.name ? '#fff' : T.muted,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>{sc.name}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 16 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Year:</span>
              {YEARS.map(yr => (
                <button key={yr} onClick={() => setSelectedYear(yr)} style={{
                  padding: '5px 10px', borderRadius: 6, border: `1px solid ${selectedYear === yr ? T.indigo : T.border}`,
                  background: selectedYear === yr ? T.indigo : T.card, color: selectedYear === yr ? '#fff' : T.muted,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>{yr}</button>
              ))}
            </div>
          </div>

          <SectionTitle>Claim Growth Decomposition by Peril — {selectedYear}, {selectedScenario}</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={decompositionData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="peril" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={v => `$${v.toLocaleString()}M`} />
                <Legend />
                <Bar dataKey="freqDriven" name="Frequency-Driven" stackId="a" fill={T.red} />
                <Bar dataKey="sevDriven" name="Severity-Driven" stackId="a" fill={T.amber} />
                <Bar dataKey="expDriven" name="Exposure-Driven" stackId="a" fill={T.blue} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>Decomposition Percentages</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Peril</th>
                  <th style={thStyle}>Freq-Driven ($M)</th>
                  <th style={thStyle}>Freq % of Total</th>
                  <th style={thStyle}>Sev-Driven ($M)</th>
                  <th style={thStyle}>Sev % of Total</th>
                  <th style={thStyle}>Exp-Driven ($M)</th>
                  <th style={thStyle}>Exp % of Total</th>
                </tr>
              </thead>
              <tbody>
                {decompositionData.map(row => (
                  <tr key={row.peril}>
                    <td style={tdStyle}><strong>{row.peril}</strong></td>
                    <td style={tdStyle}>${row.freqDriven.toLocaleString()}</td>
                    <td style={tdStyle}><span style={{ color: T.red }}>{row.pctFreq}%</span></td>
                    <td style={tdStyle}>${row.sevDriven.toLocaleString()}</td>
                    <td style={tdStyle}><span style={{ color: T.amber }}>{row.pctSev}%</span></td>
                    <td style={tdStyle}>${row.expDriven.toLocaleString()}</td>
                    <td style={tdStyle}><span style={{ color: T.blue }}>{row.pctExp}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Insurance Gap Analysis */}
      {activeTab === TABS[4] && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {NGFS_SCENARIOS.map(sc => (
              <button key={sc.name} onClick={() => setSelectedScenario(sc.name)} style={{
                padding: '7px 14px', borderRadius: 6, border: `1px solid ${selectedScenario === sc.name ? sc.color : T.border}`,
                background: selectedScenario === sc.name ? sc.color : T.card, color: selectedScenario === sc.name ? '#fff' : T.muted,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{sc.name}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Insurance Gap % by Region</SectionTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gapByRegion} margin={{ top: 4, right: 16, left: 8, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="avgGap" name="Avg Insurance Gap" fill={T.red}>
                    {gapByRegion.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? T.red : i < 6 ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Insured vs Uninsured Losses 2025–2050 — {selectedScenario} ($M)</SectionTitle>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={insuredVsUninsured} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}B`} />
                  <Tooltip formatter={(v, n) => [`$${(v / 1000).toFixed(2)}B`, n]} />
                  <Legend />
                  <Bar dataKey="insured" name="Insured" stackId="a" fill={T.green} />
                  <Bar dataKey="uninsured" name="Uninsured" stackId="a" fill={T.red} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <SectionTitle>Top 10 Protection Gaps by Region-Peril Combination</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Region / Peril</th>
                  <th style={thStyle}>Insurance Gap %</th>
                  <th style={thStyle}>Absolute Gap ($M)</th>
                  <th style={thStyle}>Gap Severity</th>
                </tr>
              </thead>
              <tbody>
                {topGaps.map((row, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><strong>#{i + 1}</strong></td>
                    <td style={tdStyle}>{row.label}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${Math.min(100, row.gap)}%`, height: '100%', background: row.gap > 60 ? T.red : row.gap > 40 ? T.amber : T.green, borderRadius: 3 }} />
                        </div>
                        {row.gap}%
                      </div>
                    </td>
                    <td style={tdStyle}>${row.absGap}M</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: row.gap > 60 ? '#fee2e2' : row.gap > 40 ? '#fef3c7' : '#dcfce7',
                        color: row.gap > 60 ? T.red : row.gap > 40 ? T.amber : T.green,
                      }}>
                        {row.gap > 60 ? 'Critical' : row.gap > 40 ? 'High' : 'Moderate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
