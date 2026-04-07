import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = ['Regional Overview', 'Brazil Energy Matrix', 'Amazon Deforestation Finance Risk', 'Chile Lithium & Green H2', 'Colombia Coal Phase-Out', 'Mexico Energy Reform Risk'];

const LATAM_COUNTRIES = [
  { country: 'Brazil', gdp: 2.13, emissions: 1.06, reElectricity: 85, forest: 497, ndcTarget: '-50% by 2030 vs 2005', reddPotential: 'Very High' },
  { country: 'Mexico', gdp: 1.32, emissions: 0.47, reElectricity: 28, forest: 66, ndcTarget: '-35% by 2030 (conditional)', reddPotential: 'Medium' },
  { country: 'Chile', gdp: 0.34, emissions: 0.09, reElectricity: 52, forest: 18, ndcTarget: 'Carbon neutral by 2050', reddPotential: 'Low' },
  { country: 'Colombia', gdp: 0.34, emissions: 0.07, reElectricity: 75, forest: 59, ndcTarget: '-51% by 2030', reddPotential: 'High' },
  { country: 'Argentina', gdp: 0.63, emissions: 0.20, reElectricity: 18, forest: 29, ndcTarget: '349 MtCO2e by 2030', reddPotential: 'Medium' },
  { country: 'Peru', gdp: 0.24, emissions: 0.06, reElectricity: 60, forest: 72, ndcTarget: '-40% by 2030 (conditional)', reddPotential: 'Very High' },
];

const BRAZIL_ENERGY = {
  mix: [
    { source: 'Hydro', share: 55, capacity: 110 },
    { source: 'Wind', share: 14, capacity: 28 },
    { source: 'Solar', share: 8, capacity: 38 },
    { source: 'Biomass/Ethanol', share: 8, capacity: 16 },
    { source: 'Natural Gas', share: 10, capacity: 15 },
    { source: 'Nuclear', share: 2, capacity: 2 },
    { source: 'Coal/Oil', share: 3, capacity: 4 },
  ],
  ethanol: [
    { year: 2018, production: 33.1, blend: 27, priceVsGas: 0.72 },
    { year: 2019, production: 35.6, blend: 27, priceVsGas: 0.70 },
    { year: 2020, production: 32.0, blend: 27, priceVsGas: 0.68 },
    { year: 2021, production: 30.2, blend: 27, priceVsGas: 0.75 },
    { year: 2022, production: 36.5, blend: 27, priceVsGas: 0.65 },
    { year: 2023, production: 38.2, blend: 27, priceVsGas: 0.62 },
    { year: 2024, production: 40.0, blend: 30, priceVsGas: 0.60 },
  ],
};

const DEFORESTATION_DATA = [
  { year: 2018, area: 7536, soyExposure: 12.5, beefExposure: 8.2, palmExposure: 1.8 },
  { year: 2019, area: 10129, soyExposure: 14.2, beefExposure: 9.5, palmExposure: 2.1 },
  { year: 2020, area: 10851, soyExposure: 15.8, beefExposure: 10.1, palmExposure: 2.4 },
  { year: 2021, area: 13235, soyExposure: 18.3, beefExposure: 12.4, palmExposure: 2.8 },
  { year: 2022, area: 11594, soyExposure: 16.1, beefExposure: 11.0, palmExposure: 2.5 },
  { year: 2023, area: 5152, soyExposure: 8.5, beefExposure: 6.2, palmExposure: 1.5 },
  { year: 2024, area: 4300, soyExposure: 7.0, beefExposure: 5.0, palmExposure: 1.2 },
];

const REDD_PIPELINE = [
  { project: 'Jari/Para REDD+', state: 'Para', area: 1.2, credits: 5.5, vintage: '2020-2025', standard: 'VCS/CCB' },
  { project: 'Envira Amazonia', state: 'Acre', area: 0.5, credits: 2.8, vintage: '2019-2024', standard: 'VCS' },
  { project: 'Rio Preto-Jacunda', state: 'Rondonia', area: 0.8, credits: 4.2, vintage: '2021-2026', standard: 'VCS/SOCIALCARBON' },
  { project: 'Maracaibo-Tocantins', state: 'Maranhao', area: 0.3, credits: 1.5, vintage: '2022-2027', standard: 'Gold Standard' },
  { project: 'Amazon Solimoes', state: 'Amazonas', area: 2.1, credits: 8.0, vintage: '2023-2028', standard: 'ART TREES' },
];

const CHILE_DATA = {
  lithium: [
    { year: 2020, production: 18000, reserves: 9200, price: 8.5, evDemand: 35 },
    { year: 2021, production: 26000, reserves: 9200, price: 12.0, evDemand: 52 },
    { year: 2022, production: 39000, reserves: 9200, price: 78.0, evDemand: 75 },
    { year: 2023, production: 44000, reserves: 9200, price: 24.0, evDemand: 95 },
    { year: 2024, production: 48000, reserves: 9200, price: 15.0, evDemand: 120 },
    { year: 2025, production: 52000, reserves: 9200, price: 18.0, evDemand: 150 },
  ],
  hydrogen: [
    { year: 2025, capacity: 0.2, cost: 4.5, exportVolume: 0 },
    { year: 2027, capacity: 0.8, cost: 3.8, exportVolume: 0.2 },
    { year: 2030, capacity: 5.0, cost: 2.5, exportVolume: 2.0 },
    { year: 2035, capacity: 15.0, cost: 1.8, exportVolume: 8.0 },
    { year: 2040, capacity: 25.0, cost: 1.5, exportVolume: 15.0 },
  ],
};

const COLOMBIA_COAL = [
  { year: 2024, production: 60, exports: 55, domestic: 5, employment: 130000, reGrowth: 2 },
  { year: 2026, production: 52, exports: 48, domestic: 4, employment: 115000, reGrowth: 5 },
  { year: 2028, production: 42, exports: 38, domestic: 4, employment: 95000, reGrowth: 10 },
  { year: 2030, production: 30, exports: 26, domestic: 4, employment: 70000, reGrowth: 18 },
  { year: 2035, production: 15, exports: 12, domestic: 3, employment: 35000, reGrowth: 35 },
  { year: 2040, production: 5, exports: 3, domestic: 2, employment: 12000, reGrowth: 55 },
];

const MEXICO_RISK = [
  { factor: 'CFE Dominance', risk: 85, trend: 'Increasing', impact: 'High' },
  { factor: 'RE Permit Delays', risk: 75, trend: 'Stable', impact: 'High' },
  { factor: 'Grid Reliability', risk: 70, trend: 'Increasing', impact: 'Medium' },
  { factor: 'AMLO Energy Reform', risk: 60, trend: 'Stable', impact: 'High' },
  { factor: 'Nearshoring Demand', risk: 30, trend: 'Decreasing', impact: 'Positive' },
  { factor: 'US-Mexico Border RE', risk: 25, trend: 'Decreasing', impact: 'Positive' },
];

const REFERENCES = [
  { id: 'R1', title: 'BNDES Green Finance Annual Report 2024', url: '#' },
  { id: 'R2', title: 'Chilean National Green Hydrogen Strategy (Ministry of Energy)', url: '#' },
  { id: 'R3', title: 'IDB Latin America Climate Finance Report 2024', url: '#' },
  { id: 'R4', title: 'ECLAC Economic Survey of LatAm & Caribbean 2024', url: '#' },
  { id: 'R5', title: 'INPE Amazon Deforestation Monitoring (PRODES/DETER)', url: '#' },
  { id: 'R6', title: 'Colombia JETP Discussion Framework — Presidency', url: '#' },
];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });

export default function LatamTransitionPage() {
  const [tab, setTab] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('Brazil');
  const [commodityExposure, setCommodityExposure] = useState('soyExposure');
  const [investmentMin, setInvestmentMin] = useState(1);

  const countryData = LATAM_COUNTRIES.find(c => c.country === selectedCountry) || LATAM_COUNTRIES[0];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ4 · LATIN AMERICA TRANSITION ENGINE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Latin America Transition Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Brazil Energy Matrix · Amazon Deforestation Risk · Chile Lithium & H2 · Colombia Coal · Mexico Reform
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'LatAm GDP', val: '$5.0T', col: T.gold },
              { label: 'Brazil RE %', val: '85%', col: T.green },
              { label: 'Chile Lithium Reserves', val: '9.2 Mt', col: T.blue },
            ].map(x => (
              <div key={x.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                <div style={{ color: x.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {LATAM_COUNTRIES.map(c => (
            <button key={c.country} onClick={() => setSelectedCountry(c.country)} style={{
              padding: '5px 12px', borderRadius: 16, border: `2px solid ${selectedCountry === c.country ? T.gold : 'transparent'}`,
              background: selectedCountry === c.country ? T.gold + '18' : 'rgba(255,255,255,0.06)',
              color: selectedCountry === c.country ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600
            }}>{c.country}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* Tab 0 — Regional Overview */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'GDP', val: `$${countryData.gdp}T`, col: T.gold },
                { label: 'Emissions', val: `${countryData.emissions} GtCO2`, col: T.red },
                { label: 'RE Electricity', val: `${countryData.reElectricity}%`, col: T.green },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Country Investment Screener</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec }}>Min RE Electricity %:</label>
                <input type="range" min={0} max={90} value={investmentMin} onChange={e => setInvestmentMin(+e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
                <span style={{ fontFamily: T.mono, fontSize: 13 }}>{investmentMin}%</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Country', 'GDP ($T)', 'Emissions (Gt)', 'RE %', 'Forest (M ha)', 'NDC Target', 'REDD+ Potential'].map(h => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LATAM_COUNTRIES.filter(c => c.reElectricity >= investmentMin).map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: c.country === selectedCountry ? T.gold + '08' : 'transparent' }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600 }}>{c.country}</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>{c.gdp}</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>{c.emissions}</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono, color: c.reElectricity > 50 ? T.green : T.amber }}>{c.reElectricity}%</td>
                      <td style={{ padding: '8px 8px', fontFamily: T.mono }}>{c.forest}</td>
                      <td style={{ padding: '8px 8px', fontSize: 10, color: T.textSec }}>{c.ndcTarget}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span style={badge(c.reddPotential === 'Very High' ? T.green : c.reddPotential === 'High' ? T.blue : c.reddPotential === 'Medium' ? T.amber : T.textMut)}>
                          {c.reddPotential}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1 — Brazil Energy Matrix */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Brazil Electricity Mix (%)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={BRAZIL_ENERGY.mix} cx="50%" cy="50%" outerRadius={100} dataKey="share" nameKey="source"
                      label={({ source, share }) => `${source} ${share}%`}>
                      {[T.blue, T.teal, T.gold, T.green, T.orange, T.purple, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Ethanol Production & Cost Parity</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={BRAZIL_ENERGY.ethanol}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0.5, 0.8]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="production" fill={T.green} name="Production (BL)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="priceVsGas" stroke={T.red} strokeWidth={2} name="Price vs Gasoline" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 — Amazon Deforestation Finance Risk */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'soyExposure', label: 'Soy', col: T.green },
                { key: 'beefExposure', label: 'Beef', col: T.red },
                { key: 'palmExposure', label: 'Palm', col: T.orange },
              ].map(c => (
                <button key={c.key} onClick={() => setCommodityExposure(c.key)} style={{
                  padding: '5px 14px', borderRadius: 16, border: `2px solid ${commodityExposure === c.key ? c.col : 'transparent'}`,
                  background: commodityExposure === c.key ? c.col + '18' : T.surface, color: commodityExposure === c.key ? c.col : T.textSec,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{c.label}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Amazon Deforestation (km2/yr)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={DEFORESTATION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="area" fill={T.red + '40'} stroke={T.red} name="Deforestation (km2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Commodity Exposure Calculator ($B at risk)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={DEFORESTATION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey={commodityExposure} fill={commodityExposure === 'soyExposure' ? T.green : commodityExposure === 'beefExposure' ? T.red : T.orange}
                      name={`${commodityExposure.replace('Exposure', '')} Exposure ($B)`} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>REDD+ Project Pipeline</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Project', 'State', 'Area (M ha)', 'Credits (MtCO2)', 'Vintage', 'Standard'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REDD_PIPELINE.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.project}</td>
                      <td style={{ padding: '8px 10px' }}>{p.state}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{p.area}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{p.credits}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{p.vintage}</td>
                      <td style={{ padding: '8px 10px' }}><span style={badge(T.green)}>{p.standard}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3 — Chile Lithium & Green H2 */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Lithium Reserves', val: '9.2 Mt', col: T.blue },
                { label: '2030 H2 Target', val: '5 GW', col: T.green },
                { label: 'Copper for Electrification', val: '5.8 Mt/yr', col: T.orange },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Lithium Production & EV Demand</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={CHILE_DATA.lithium}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="production" fill={T.blue} name="Production (tonnes)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="evDemand" stroke={T.green} strokeWidth={2} name="EV Demand Index" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Green H2 Capacity & Cost Trajectory</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={CHILE_DATA.hydrogen}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="capacity" fill={T.teal + '40'} stroke={T.teal} name="Capacity (GW)" />
                    <Line yAxisId="right" type="monotone" dataKey="cost" stroke={T.red} strokeWidth={2} name="Cost ($/kg)" />
                    <ReferenceLine yAxisId="right" y={2.0} stroke={T.green} strokeDasharray="5 5" label={{ value: 'Parity', fontSize: 10, fill: T.green }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4 — Colombia Coal Phase-Out */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Colombia Coal Production & RE Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={COLOMBIA_COAL}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="production" fill={T.red} name="Coal Prod (Mt)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="exports" fill={T.orange + '80'} name="Coal Exports (Mt)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="reGrowth" stroke={T.green} strokeWidth={2} name="RE Capacity (GW)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Employment Transition Impact</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={COLOMBIA_COAL}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                  <Area type="monotone" dataKey="employment" fill={T.amber + '40'} stroke={T.amber} name="Coal Employment" />
                </AreaChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Biodiversity credits potential: Colombia ranks 2nd globally in biodiversity, with emerging frameworks for REDD+ and biodiversity offset credits.</p>
            </div>
          </div>
        )}

        {/* Tab 5 — Mexico Energy Reform Risk */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Mexico Energy Reform Risk Matrix</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Risk Factor', 'Risk Score', 'Trend', 'Impact'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEXICO_RISK.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.factor}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 100, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${r.risk}%`, height: '100%', background: r.risk > 60 ? T.red : r.risk > 40 ? T.amber : T.green, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontFamily: T.mono, fontSize: 12 }}>{r.risk}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={badge(r.trend === 'Increasing' ? T.red : r.trend === 'Decreasing' ? T.green : T.amber)}>{r.trend}</span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={badge(r.impact === 'High' ? T.red : r.impact === 'Medium' ? T.amber : T.green)}>{r.impact}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Mexico RE vs CFE Dispatch Share</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={[
                  { year: 2020, re: 22, cfe: 78 }, { year: 2022, re: 25, cfe: 75 },
                  { year: 2024, re: 28, cfe: 72 }, { year: 2026, re: 32, cfe: 68 },
                  { year: 2028, re: 38, cfe: 62 }, { year: 2030, re: 45, cfe: 55 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="re" stackId="1" fill={T.green + '60'} stroke={T.green} name="RE Share %" />
                  <Area type="monotone" dataKey="cfe" stackId="1" fill={T.red + '40'} stroke={T.red} name="CFE/Fossil Share %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 15 }}>References</h3>
              {REFERENCES.map(r => (
                <div key={r.id} style={{ fontSize: 12, padding: '4px 0', color: T.textSec }}>
                  <span style={{ fontFamily: T.mono, color: T.navy, marginRight: 8 }}>[{r.id}]</span>{r.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
