import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend, LineChart, Line, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', bg: '#f0ede8',
  red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c',
  blue: '#1d4ed8', teal: '#0f766e', purple: '#6d28d9', amber: '#b45309',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5',
  lightNavy: '#e8eef5', border: '#d6cfc4', text: '#1b3a5c'
};

const PERILS = [
  { id: 'flood_riverine', label: 'Riverine Flood', icon: '🌊', color: '#1d4ed8', standard: 'JRC EFAS · IPCC AR6 WG1 Ch11' },
  { id: 'flood_coastal',  label: 'Coastal Flood',  icon: '🌊', color: '#0369a1', standard: 'IPCC AR6 SLR · NOAA · EU CoastFlood' },
  { id: 'flood_pluvial',  label: 'Pluvial Flood',  icon: '🌧', color: '#0891b2', standard: 'JRC PESETA IV · Copernicus Climate Change' },
  { id: 'wildfire',       label: 'Wildfire',        icon: '🔥', color: '#c2410c', standard: 'FIRMS NASA · GWIS · IPCC AR6 Ch12' },
  { id: 'extreme_heat',   label: 'Extreme Heat',    icon: '🌡', color: '#dc2626', standard: 'WBGT OSHA · Copernicus · NOAA NCEI' },
  { id: 'wind_cyclone',   label: 'Wind / Cyclone',  icon: '🌀', color: '#7c3aed', standard: 'IBTrACS · STORM · IPCC AR6 Ch11' },
  { id: 'drought',        label: 'Drought',         icon: '🏜', color: '#a16207', standard: 'SPEI · SPI · WRI Aqueduct 4.0' },
  { id: 'sea_level_rise', label: 'Sea Level Rise',  icon: '📈', color: '#0f766e', standard: 'IPCC AR6 Ch9 · NASA SLR · PSMSL' },
];

const SCENARIOS = [
  { id: 'current',   label: 'Current Climate',  year: 2024, mult: 1.00, color: T.green,  desc: 'Baseline observed hazard intensity' },
  { id: 'ssp1_26',   label: 'SSP1-2.6 (2050)',  year: 2050, mult: 1.15, color: T.blue,   desc: 'Low emissions — 1.5–2°C warming' },
  { id: 'ssp2_45',   label: 'SSP2-4.5 (2050)',  year: 2050, mult: 1.35, color: T.amber,  desc: 'Intermediate — 2–3°C warming' },
  { id: 'ssp5_85',   label: 'SSP5-8.5 (2050)',  year: 2050, mult: 1.68, color: T.orange, desc: 'High emissions — 3–4°C warming' },
  { id: 'ssp5_2100', label: 'SSP5-8.5 (2100)',  year: 2100, mult: 2.42, color: T.red,    desc: 'Worst-case — 4–5°C warming by 2100' },
];

const ASSET_CLASSES = ['Residential RE', 'Commercial RE', 'Infrastructure', 'Agriculture', 'Energy Assets', 'Industrial'];

const COUNTRIES = [
  'United States', 'Germany', 'United Kingdom', 'Japan', 'Australia',
  'India', 'Brazil', 'Netherlands', 'Bangladesh', 'Philippines',
  'Indonesia', 'South Africa', 'Canada', 'France', 'China'
];

// Generate 40 synthetic assets across geographies
const ASSETS = Array.from({ length: 40 }, (_, i) => {
  const country = COUNTRIES[i % COUNTRIES.length];
  const assetClass = ASSET_CLASSES[i % ASSET_CLASSES.length];
  const base = sr(i * 13);
  const hazardScores = PERILS.reduce((acc, p) => {
    acc[p.id] = Math.round(sr(i * 7 + PERILS.indexOf(p)) * 85 + 10);
    return acc;
  }, {});
  const composite = Math.round(Object.values(hazardScores).reduce((a, b) => a + b, 0) / PERILS.length);
  return {
    id: i + 1,
    name: `${assetClass} Asset ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
    country,
    assetClass,
    value: Math.round((base * 450 + 50) * 1e6),
    ...hazardScores,
    composite,
    riskTier: composite > 65 ? 'High' : composite > 40 ? 'Medium' : 'Low',
  };
});

const RISK_COLOR = { High: T.red, Medium: T.amber, Low: T.green };
const RISK_BG = { High: '#fef2f2', Medium: '#fffbeb', Low: '#f0fdf4' };

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: active === t ? T.navy : T.gray, fontFamily: 'inherit',
          borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
          marginBottom: -2, transition: 'all 0.15s' }}>
        {t}
      </button>
    ))}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 130 }}>
    <div style={{ fontSize: 11, color: T.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function PhysicalHazardMapPage() {
  const [tab, setTab] = useState('Overview');
  const [scenario, setScenario] = useState('current');
  const [selectedPeril, setSelectedPeril] = useState('flood_riverine');
  const [filterClass, setFilterClass] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  const scenarioMult = SCENARIOS.find(s => s.id === scenario)?.mult || 1;
  const scenarioObj = SCENARIOS.find(s => s.id === scenario);

  const filteredAssets = useMemo(() => ASSETS.filter(a =>
    (filterClass === 'All' || a.assetClass === filterClass) &&
    (filterRisk === 'All' || a.riskTier === filterRisk)
  ), [filterClass, filterRisk]);

  const highRisk = filteredAssets.filter(a => a.riskTier === 'High').length;
  const avgComposite = filteredAssets.length ? Math.round(filteredAssets.reduce((s, a) => s + a.composite, 0) / filteredAssets.length * scenarioMult) : 0;
  const totalExposure = filteredAssets.reduce((s, a) => s + a.value, 0);

  // Peril comparison data for selected scenario
  const perilData = PERILS.map(p => ({
    peril: p.label.replace(/ Flood$/, '').replace(/^Flood /, ''),
    score: filteredAssets.length ? Math.round(filteredAssets.reduce((s, a) => s + (a[p.id] || 0), 0) / filteredAssets.length * scenarioMult) : 0,
    color: p.color,
  }));

  // Country heatmap data
  const countryData = COUNTRIES.map((c, i) => {
    const assets = filteredAssets.filter(a => a.country === c);
    const avgScore = assets.length ? Math.round(assets.reduce((s, a) => s + a.composite, 0) / assets.length * scenarioMult) : 0;
    return { country: c.replace('United ', 'U. '), score: avgScore, assetCount: assets.length };
  }).filter(c => c.assetCount > 0).sort((a, b) => b.score - a.score);

  // Scenario comparison for radar
  const radarData = PERILS.map(p => {
    const row = { peril: p.label.split(' ')[0] };
    SCENARIOS.forEach(s => {
      row[s.id] = filteredAssets.length ? Math.round(filteredAssets.reduce((acc, a) => acc + (a[p.id] || 0), 0) / filteredAssets.length * s.mult) : 0;
    });
    return row;
  });

  return (
    <div style={{ padding: '24px 28px', background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>EP-BX1</span>
          <span style={{ fontSize: 11, color: T.gray }}>·</span>
          <span style={{ fontSize: 11, color: T.gray }}>IPCC AR6 · SSP1-2.6 → SSP5-8.5 · 6 Perils · 40 Assets · JRC / HAZUS / FIRMS</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Physical Hazard Mapping Dashboard</h1>
            <div style={{ fontSize: 12, color: T.gray, marginTop: 3 }}>Multi-peril climate hazard scoring · IPCC AR6 scenario pathways · Asset-level exposure analysis</div>
          </div>
          {/* Scenario selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setScenario(s.id)}
                style={{ padding: '5px 12px', borderRadius: 6, border: `1.5px solid ${scenario === s.id ? s.color : T.border}`,
                  background: scenario === s.id ? s.color : '#fff', color: scenario === s.id ? '#fff' : T.navy,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {scenarioObj && (
          <div style={{ marginTop: 8, padding: '7px 14px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6,
            fontSize: 12, color: T.navy, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: scenarioObj.color, fontWeight: 700 }}>●</span>
            <strong>{scenarioObj.label}</strong> — {scenarioObj.desc}
            <span style={{ color: T.gray }}>· Hazard intensity multiplier: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{scenarioObj.mult.toFixed(2)}×</strong></span>
          </div>
        )}
      </div>

      <TabBar tabs={['Overview', 'Peril Analysis', 'Asset Exposure', 'Scenario Comparison', 'GIS Heat Map']} active={tab} onChange={setTab} />

      {/* --- OVERVIEW --- */}
      {tab === 'Overview' && (
        <div>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <KpiCard label="Assets Monitored" value={filteredAssets.length} sub="Across 15 countries" />
            <KpiCard label="Total Exposure" value={`$${(totalExposure / 1e9).toFixed(1)}B`} sub="Across all asset classes" />
            <KpiCard label="Avg Composite Hazard" value={`${avgComposite}/100`} sub={`${scenarioObj?.label}`} color={avgComposite > 60 ? T.red : avgComposite > 40 ? T.amber : T.green} />
            <KpiCard label="High Risk Assets" value={highRisk} sub={`${((highRisk / filteredAssets.length) * 100).toFixed(0)}% of portfolio`} color={T.red} />
            <KpiCard label="Perils Modelled" value="8" sub="IPCC AR6 aligned" color={T.blue} />
            <KpiCard label="Scenarios" value="5" sub="Current → SSP5-8.5 (2100)" color={T.teal} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Peril score bar */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <SectionTitle title="Average Hazard Score by Peril" sub={`${scenarioObj?.label} · 0–100 scale`} />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={perilData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="peril" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(v) => [`${v}/100`, 'Hazard Score']} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {perilData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk tier distribution */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <SectionTitle title="Asset Risk Tier Distribution" sub="Composite score: High >65, Medium 40–65, Low <40" />
              {['High', 'Medium', 'Low'].map(tier => {
                const count = filteredAssets.filter(a => {
                  const adj = Math.min(100, Math.round(a.composite * scenarioMult));
                  return tier === 'High' ? adj > 65 : tier === 'Medium' ? adj >= 40 && adj <= 65 : adj < 40;
                }).length;
                const pct = ((count / filteredAssets.length) * 100).toFixed(0);
                return (
                  <div key={tier} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: RISK_COLOR[tier] }}>{tier} Risk</span>
                      <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: T.navy }}>{count} assets ({pct}%)</span>
                    </div>
                    <div style={{ height: 10, background: T.bg, borderRadius: 5 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: RISK_COLOR[tier], borderRadius: 5, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 18 }}>
                <SectionTitle title="Data Sources & Standards" />
                {[
                  { peril: 'Flood', standard: 'JRC EFAS, Copernicus CDS, IPCC AR6 WG1 Ch.11' },
                  { peril: 'Wildfire', standard: 'NASA FIRMS, GWIS, IPCC AR6 Ch.12.3' },
                  { peril: 'Heat', standard: 'WBGT OSHA/ISO 7933, NOAA NCEI, ERA5' },
                  { peril: 'Wind', standard: 'IBTrACS NOAA, STORM dataset v3, IPCC AR6' },
                  { peril: 'Drought', standard: 'SPEI-3/12, WRI Aqueduct 4.0, SPI NOAA' },
                  { peril: 'SLR', standard: 'IPCC AR6 Ch.9, NASA SLR projections, PSMSL' },
                ].map(s => (
                  <div key={s.peril} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 11 }}>
                    <span style={{ fontWeight: 600, color: T.navy, minWidth: 50 }}>{s.peril}</span>
                    <span style={{ color: T.gray }}>{s.standard}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PERIL ANALYSIS --- */}
      {tab === 'Peril Analysis' && (
        <div>
          {/* Peril selector */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {PERILS.map(p => (
              <button key={p.id} onClick={() => setSelectedPeril(p.id)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${selectedPeril === p.id ? p.color : T.border}`,
                  background: selectedPeril === p.id ? p.color : '#fff', color: selectedPeril === p.id ? '#fff' : T.navy,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {(() => {
            const peril = PERILS.find(p => p.id === selectedPeril);
            const scores = filteredAssets.map(a => Math.min(100, Math.round((a[selectedPeril] || 0) * scenarioMult)));
            const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            const maxScore = Math.max(...scores);
            const highCount = scores.filter(s => s > 65).length;

            // Score distribution buckets
            const buckets = [
              { range: '0–20', count: scores.filter(s => s <= 20).length, color: '#dcfce7' },
              { range: '21–40', count: scores.filter(s => s > 20 && s <= 40).length, color: '#fef9c3' },
              { range: '41–60', count: scores.filter(s => s > 40 && s <= 60).length, color: '#fed7aa' },
              { range: '61–80', count: scores.filter(s => s > 60 && s <= 80).length, color: '#fecaca' },
              { range: '81–100', count: scores.filter(s => s > 80).length, color: '#fca5a5' },
            ];

            // Scenario progression for this peril
            const scenarioProgression = SCENARIOS.map(s => ({
              scenario: s.label.split('(')[0].trim(),
              score: Math.round(avgScore / scenarioMult * s.mult),
            }));

            return (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                  <KpiCard label={`${peril?.label} Avg Score`} value={`${avgScore}/100`}
                    sub={scenarioObj?.label} color={avgScore > 65 ? T.red : avgScore > 40 ? T.amber : T.green} />
                  <KpiCard label="Peak Exposure" value={`${maxScore}/100`} sub="Highest single asset" color={T.red} />
                  <KpiCard label="High Risk Assets" value={highCount} sub={`Score > 65`} color={T.orange} />
                  <KpiCard label="Standard" value="IPCC AR6" sub={peril?.standard.split('·')[0]} color={T.blue} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  {/* Score distribution */}
                  <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                    <SectionTitle title={`${peril?.label} Score Distribution`} sub="Asset count by hazard severity band" />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={buckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [v, 'Assets']} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {buckets.map((b, i) => <Cell key={i} fill={peril?.color || T.navy} opacity={0.4 + i * 0.12} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Scenario progression */}
                  <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                    <SectionTitle title={`${peril?.label} Across Scenarios`} sub="Average portfolio hazard score by IPCC pathway" />
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={scenarioProgression}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`${v}/100`, 'Avg Score']} />
                        <ReferenceLine y={65} stroke={T.red} strokeDasharray="5 5" label={{ value: 'High Risk', position: 'right', fontSize: 10, fill: T.red }} />
                        <ReferenceLine y={40} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'Medium', position: 'right', fontSize: 10, fill: T.amber }} />
                        <Line type="monotone" dataKey="score" stroke={peril?.color || T.navy} strokeWidth={2.5} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top exposed assets */}
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginTop: 18 }}>
                  <SectionTitle title={`Top 10 Assets by ${peril?.label} Exposure`} sub={`${scenarioObj?.label} · Score descending`} />
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.lightNavy }}>
                        {['Asset', 'Country', 'Class', 'Value', `${peril?.icon} Score`, 'Risk Tier'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredAssets]
                        .sort((a, b) => (b[selectedPeril] || 0) - (a[selectedPeril] || 0))
                        .slice(0, 10)
                        .map((a, i) => {
                          const score = Math.min(100, Math.round((a[selectedPeril] || 0) * scenarioMult));
                          const tier = score > 65 ? 'High' : score > 40 ? 'Medium' : 'Low';
                          return (
                            <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : T.bg }}>
                              <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{a.name}</td>
                              <td style={{ padding: '7px 10px', color: T.gray }}>{a.country}</td>
                              <td style={{ padding: '7px 10px', color: T.gray }}>{a.assetClass}</td>
                              <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>${(a.value / 1e6).toFixed(0)}M</td>
                              <td style={{ padding: '7px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 4 }}>
                                    <div style={{ width: `${score}%`, height: '100%', background: peril?.color, borderRadius: 4 }} />
                                  </div>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minWidth: 28 }}>{score}</span>
                                </div>
                              </td>
                              <td style={{ padding: '7px 10px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 10, background: RISK_BG[tier], color: RISK_COLOR[tier], fontSize: 11, fontWeight: 600 }}>{tier}</span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* --- ASSET EXPOSURE --- */}
      {tab === 'Asset Exposure' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 11, color: T.gray, marginRight: 6 }}>Asset Class</label>
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
                <option>All</option>
                {ASSET_CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.gray, marginRight: 6 }}>Risk Tier</label>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <span style={{ fontSize: 11, color: T.gray }}>Showing {filteredAssets.length} assets</span>
          </div>

          {/* Asset table */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
            <SectionTitle title="Asset Hazard Exposure Matrix" sub={`All perils · ${scenarioObj?.label} · Score 0–100`} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.lightNavy }}>
                    {['Asset', 'Country', 'Class', 'Value ($M)', ...PERILS.map(p => p.icon), 'Composite', 'Tier'].map(h => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((a, i) => {
                    const adjScore = Math.min(100, Math.round(a.composite * scenarioMult));
                    const tier = adjScore > 65 ? 'High' : adjScore > 40 ? 'Medium' : 'Low';
                    return (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : T.bg }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{a.name}</td>
                        <td style={{ padding: '6px 8px', color: T.gray }}>{a.country}</td>
                        <td style={{ padding: '6px 8px', color: T.gray, whiteSpace: 'nowrap' }}>{a.assetClass}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{(a.value / 1e6).toFixed(0)}</td>
                        {PERILS.map(p => {
                          const score = Math.min(100, Math.round((a[p.id] || 0) * scenarioMult));
                          const bg = score > 65 ? '#fee2e2' : score > 40 ? '#fef9c3' : '#f0fdf4';
                          return (
                            <td key={p.id} style={{ padding: '6px 8px', background: bg, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                              {score}
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                          color: adjScore > 65 ? T.red : adjScore > 40 ? T.amber : T.green }}>
                          {adjScore}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ padding: '2px 7px', borderRadius: 10, background: RISK_BG[tier], color: RISK_COLOR[tier], fontWeight: 600 }}>{tier}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SCENARIO COMPARISON --- */}
      {tab === 'Scenario Comparison' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Radar chart */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <SectionTitle title="All-Peril Radar — Scenario Overlay" sub="Average hazard score per peril across SSP pathways" />
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="peril" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  {SCENARIOS.map(s => (
                    <Radar key={s.id} name={s.label} dataKey={s.id}
                      stroke={s.color} fill={s.color} fillOpacity={0.08} strokeWidth={1.8} />
                  ))}
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Scenario intensity multipliers */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <SectionTitle title="Scenario Intensity Multipliers" sub="IPCC AR6 SSP-derived hazard scaling factors" />
              {SCENARIOS.map(s => (
                <div key={s.id} style={{ marginBottom: 14, padding: '10px 14px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: s.color, fontSize: 13 }}>{s.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: T.navy }}>{s.mult.toFixed(2)}×</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.gray, marginBottom: 6 }}>{s.desc}</div>
                  <div style={{ height: 8, background: '#fff', borderRadius: 4, border: `1px solid ${T.border}` }}>
                    <div style={{ width: `${(s.mult / 2.42) * 100}%`, height: '100%', background: s.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High risk count by scenario */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginTop: 18 }}>
            <SectionTitle title="Portfolio Risk Profile Change Across Scenarios" sub="High-risk asset count and avg composite score per IPCC pathway" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SCENARIOS.map(s => ({
                scenario: s.label.split(' (')[0],
                highRisk: ASSETS.filter(a => Math.round(a.composite * s.mult) > 65).length,
                avgScore: Math.round(ASSETS.reduce((sum, a) => sum + a.composite, 0) / ASSETS.length * s.mult),
                fill: s.color,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="highRisk" name="High Risk Assets" radius={[4, 4, 0, 0]}>
                  {SCENARIOS.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="avgScore" name="Avg Score" stroke={T.navy} strokeWidth={2.5} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- GIS HEAT MAP --- */}
      {tab === 'GIS Heat Map' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            {/* Country risk grid */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <SectionTitle title="Country-Level Hazard Heat Map" sub={`Avg composite hazard score · ${scenarioObj?.label}`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {countryData.map(c => {
                  const pct = c.score;
                  const tier = pct > 65 ? 'High' : pct > 40 ? 'Medium' : 'Low';
                  const intensity = pct / 100;
                  const bg = tier === 'High' ? `rgba(153,27,27,${0.1 + intensity * 0.5})` :
                             tier === 'Medium' ? `rgba(180,83,9,${0.1 + intensity * 0.4})` :
                             `rgba(6,95,70,${0.08 + intensity * 0.3})`;
                  return (
                    <div key={c.country} style={{ padding: '10px 12px', borderRadius: 8, background: bg, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.country}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                          color: tier === 'High' ? T.red : tier === 'Medium' ? T.amber : T.green }}>{pct}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: T.gray }}>{c.assetCount} assets</div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: RISK_COLOR[tier] }}>{tier}</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: '#fff', borderRadius: 2, marginTop: 6 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: RISK_COLOR[tier], borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-peril country leader */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <SectionTitle title="Highest Exposure by Peril" sub="Top country per peril type" />
              {PERILS.map(p => {
                const best = countryData.sort((a, b) => {
                  const aAssets = ASSETS.filter(x => x.country.replace('United ', 'U. ') === a.country);
                  const bAssets = ASSETS.filter(x => x.country.replace('United ', 'U. ') === b.country);
                  const aScore = aAssets.length ? aAssets.reduce((s, x) => s + (x[p.id] || 0), 0) / aAssets.length : 0;
                  const bScore = bAssets.length ? bAssets.reduce((s, x) => s + (x[p.id] || 0), 0) / bAssets.length : 0;
                  return bScore - aScore;
                })[0];
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12 }}>{p.icon} {p.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{best?.country}</span>
                  </div>
                );
              })}

              <div style={{ marginTop: 18 }}>
                <SectionTitle title="IPCC AR6 Reference" />
                {[
                  'WG1 Ch.11 — Weather/Climate Extremes',
                  'WG1 Ch.12 — Climate Change Info for Regional Risk',
                  'WG2 Ch.16 — Key Risks Across Sectors & Regions',
                  'SRCCL — Land Use & Land Cover Change',
                  'SROCC — Ocean & Cryosphere in a Changing Climate',
                ].map(ref => (
                  <div key={ref} style={{ fontSize: 10, color: T.gray, marginBottom: 3 }}>• {ref}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
