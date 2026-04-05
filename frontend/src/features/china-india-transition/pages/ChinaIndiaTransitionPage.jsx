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
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = ['Dual Market Overview', 'China National ETS', 'India Green Hydrogen Mission', 'Coal Phase-Down Timelines', 'RE Deployment Curves', 'Carbon Price Trajectories'];

const CHINA_ETS_SECTORS = [
  { sector: 'Power', status: 'Active', entities: 2162, coverage: '4.5 GtCO2', startYear: 2021, allocation: 'Free (intensity)' },
  { sector: 'Steel', status: 'Phase 2', entities: 480, coverage: '1.8 GtCO2', startYear: 2025, allocation: 'Free + Auction' },
  { sector: 'Cement', status: 'Phase 2', entities: 320, coverage: '1.4 GtCO2', startYear: 2025, allocation: 'Free + Auction' },
  { sector: 'Aluminium', status: 'Phase 3', entities: 110, coverage: '0.6 GtCO2', startYear: 2026, allocation: 'TBD' },
  { sector: 'Petrochemical', status: 'Phase 3', entities: 200, coverage: '0.5 GtCO2', startYear: 2027, allocation: 'TBD' },
  { sector: 'Paper & Pulp', status: 'Phase 4', entities: 90, coverage: '0.2 GtCO2', startYear: 2028, allocation: 'TBD' },
  { sector: 'Aviation', status: 'Phase 4', entities: 45, coverage: '0.1 GtCO2', startYear: 2029, allocation: 'TBD' },
  { sector: 'Chemicals', status: 'Phase 4', entities: 160, coverage: '0.3 GtCO2', startYear: 2029, allocation: 'TBD' },
];

const INDIA_H2_DATA = [
  { year: 2024, production: 0.02, demand: 6.0, greenShare: 0.3, cost: 5.2, target: 5 },
  { year: 2025, production: 0.15, demand: 6.5, greenShare: 2.3, cost: 4.8, target: 5 },
  { year: 2026, production: 0.5, demand: 7.0, greenShare: 7.1, cost: 4.2, target: 5 },
  { year: 2027, production: 1.2, demand: 7.5, greenShare: 16, cost: 3.6, target: 5 },
  { year: 2028, production: 2.5, demand: 8.0, greenShare: 31, cost: 3.1, target: 5 },
  { year: 2029, production: 3.8, demand: 8.5, greenShare: 45, cost: 2.6, target: 5 },
  { year: 2030, production: 5.0, demand: 9.0, greenShare: 56, cost: 2.0, target: 5 },
];

const COAL_RETIREMENT = {
  china: [
    { year: 2024, capacity: 1100, retired: 0, scenario_fast: 1100, scenario_base: 1100, scenario_slow: 1100 },
    { year: 2030, capacity: 1050, retired: 50, scenario_fast: 950, scenario_base: 1050, scenario_slow: 1100 },
    { year: 2035, capacity: 900, retired: 200, scenario_fast: 700, scenario_base: 900, scenario_slow: 1050 },
    { year: 2040, capacity: 700, retired: 400, scenario_fast: 450, scenario_base: 700, scenario_slow: 950 },
    { year: 2045, capacity: 500, retired: 600, scenario_fast: 250, scenario_base: 500, scenario_slow: 850 },
    { year: 2050, capacity: 300, retired: 800, scenario_fast: 100, scenario_base: 300, scenario_slow: 700 },
    { year: 2055, capacity: 150, retired: 950, scenario_fast: 20, scenario_base: 150, scenario_slow: 550 },
    { year: 2060, capacity: 50, retired: 1050, scenario_fast: 0, scenario_base: 50, scenario_slow: 400 },
  ],
  india: [
    { year: 2024, capacity: 210, retired: 0, scenario_fast: 210, scenario_base: 210, scenario_slow: 210 },
    { year: 2030, capacity: 230, retired: 0, scenario_fast: 200, scenario_base: 230, scenario_slow: 240 },
    { year: 2035, capacity: 220, retired: 10, scenario_fast: 160, scenario_base: 220, scenario_slow: 245 },
    { year: 2040, capacity: 180, retired: 50, scenario_fast: 110, scenario_base: 180, scenario_slow: 230 },
    { year: 2045, capacity: 130, retired: 100, scenario_fast: 60, scenario_base: 130, scenario_slow: 210 },
    { year: 2050, capacity: 80, retired: 150, scenario_fast: 20, scenario_base: 80, scenario_slow: 180 },
    { year: 2055, capacity: 40, retired: 190, scenario_fast: 5, scenario_base: 40, scenario_slow: 140 },
    { year: 2060, capacity: 10, retired: 220, scenario_fast: 0, scenario_base: 10, scenario_slow: 100 },
  ]
};

function buildSCurve(startYear, startCap, peakCap, midYear, k, endYear) {
  const data = [];
  for (let y = startYear; y <= endYear; y++) {
    const val = startCap + (peakCap - startCap) / (1 + Math.exp(-k * (y - midYear)));
    data.push({ year: y, value: Math.round(val) });
  }
  return data;
}

const RE_CURVES = {
  china_solar: buildSCurve(2020, 250, 2500, 2030, 0.3, 2040),
  china_wind: buildSCurve(2020, 280, 1800, 2032, 0.25, 2040),
  india_solar: buildSCurve(2020, 50, 500, 2028, 0.35, 2035),
  india_wind: buildSCurve(2020, 42, 250, 2030, 0.28, 2035),
};

const CARBON_PRICE_PATHS = [
  { year: 2021, china_actual: 7, china_proj: null, india_actual: null, india_proj: null },
  { year: 2022, china_actual: 9, china_proj: null, india_actual: null, india_proj: null },
  { year: 2023, china_actual: 10, china_proj: null, india_actual: null, india_proj: null },
  { year: 2024, china_actual: 12, china_proj: null, india_actual: null, india_proj: null },
  { year: 2025, china_actual: null, china_proj: 15, india_actual: null, india_proj: 3 },
  { year: 2026, china_actual: null, china_proj: 20, india_actual: null, india_proj: 5 },
  { year: 2027, china_actual: null, china_proj: 28, india_actual: null, india_proj: 8 },
  { year: 2028, china_actual: null, china_proj: 35, india_actual: null, india_proj: 12 },
  { year: 2029, china_actual: null, china_proj: 45, india_actual: null, india_proj: 16 },
  { year: 2030, china_actual: null, china_proj: 60, india_actual: null, india_proj: 22 },
  { year: 2035, china_actual: null, china_proj: 100, india_actual: null, india_proj: 40 },
  { year: 2040, china_actual: null, china_proj: 150, india_actual: null, india_proj: 65 },
];

const OVERVIEW_METRICS = {
  china: { gdp: 17.8, emissions: 12.4, reShare: 32, etsPrice: 12, coalGW: 1100, solarGW: 680, ndcTarget: '2060 Carbon Neutral' },
  india: { gdp: 3.7, emissions: 2.9, reShare: 43, etsPrice: 0, coalGW: 210, solarGW: 73, ndcTarget: '2070 Net Zero' },
};

const REFERENCES = [
  { id: 'R1', title: 'China MEE National ETS Regulations (2024 Amendment)', url: '#' },
  { id: 'R2', title: 'India MNRE 500 GW RE Target — Strategic Roadmap', url: '#' },
  { id: 'R3', title: 'IEA India Energy Outlook 2025', url: '#' },
  { id: 'R4', title: 'BloombergNEF China Energy Transition Outlook 2025', url: '#' },
  { id: 'R5', title: 'India BRSR Framework — SEBI Circular', url: '#' },
  { id: 'R6', title: 'CCER Methodology Guidance — China MEE', url: '#' },
];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });

export default function ChinaIndiaTransitionPage() {
  const [tab, setTab] = useState(0);
  const [country, setCountry] = useState('china');
  const [coalScenario, setCoalScenario] = useState('scenario_base');
  const [investmentThreshold, setInvestmentThreshold] = useState(50);
  const [alerts, setAlerts] = useState([
    { id: 1, date: '2026-03-15', text: 'China MEE expands ETS to steel & cement sectors', severity: 'high' },
    { id: 2, date: '2026-03-01', text: 'India raises solar PLI allocation to $4.2B', severity: 'medium' },
    { id: 3, date: '2026-02-20', text: 'CCER restart: first batch of 200 project methodologies approved', severity: 'high' },
  ]);

  const m = OVERVIEW_METRICS[country];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ1 · CHINA & INDIA TRANSITION ENGINE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>China & India Deep-Dive Transition Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              National ETS Mechanics · Green Hydrogen Mission · Coal Phase-Down · RE S-Curves · Carbon Price Trajectories
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Combined GDP', val: '$21.5T', col: T.gold },
              { label: 'Combined Emissions', val: '15.3 GtCO2', col: T.red },
              { label: 'Coal Fleet', val: '1,310 GW', col: T.orange },
            ].map(x => (
              <div key={x.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                <div style={{ color: x.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['china', 'india'].map(c => (
            <button key={c} onClick={() => setCountry(c)} style={{
              padding: '6px 16px', borderRadius: 20, border: `2px solid ${country === c ? T.gold : 'transparent'}`,
              background: country === c ? T.gold + '22' : 'rgba(255,255,255,0.06)',
              color: country === c ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize'
            }}>{c === 'china' ? 'China' : 'India'}</button>
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
        {/* Tab 0 — Dual Market Overview */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'GDP', val: `$${m.gdp}T`, col: T.gold },
                { label: 'GHG Emissions', val: `${m.emissions} GtCO2`, col: T.red },
                { label: 'RE Share of Power', val: `${m.reShare}%`, col: T.green },
                { label: 'NDC Target', val: m.ndcTarget, col: T.blue },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={{ ...card, marginTop: 20 }}>
              <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Market Comparison — Key Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { metric: 'GDP ($T)', China: 17.8, India: 3.7 },
                  { metric: 'Emissions (Gt)', China: 12.4, India: 2.9 },
                  { metric: 'Coal (GW)', China: 1100, India: 210 },
                  { metric: 'Solar (GW)', China: 680, India: 73 },
                  { metric: 'RE Share (%)', China: 32, India: 43 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="China" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="India" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...card, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Investment Opportunity Scanner</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec }}>Min. Investment ($B):</label>
                <input type="range" min={10} max={200} value={investmentThreshold} onChange={e => setInvestmentThreshold(+e.target.value)}
                  style={{ flex: 1 }} />
                <span style={{ fontFamily: T.mono, fontSize: 13, color: T.navy }}>${investmentThreshold}B</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Sector', 'Country', 'Opportunity ($B)', 'Risk', 'Timeline'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { sector: 'Solar Manufacturing', country: 'China', size: 180, risk: 'Low', timeline: '2024-2030' },
                    { sector: 'Green Hydrogen', country: 'India', size: 120, risk: 'Medium', timeline: '2025-2035' },
                    { sector: 'EV Battery Chain', country: 'China', size: 250, risk: 'Low', timeline: '2024-2032' },
                    { sector: 'Offshore Wind', country: 'China', size: 95, risk: 'Medium', timeline: '2025-2035' },
                    { sector: 'Grid Modernization', country: 'India', size: 75, risk: 'High', timeline: '2025-2040' },
                    { sector: 'Coal Retrofit/CCS', country: 'China', size: 60, risk: 'High', timeline: '2028-2045' },
                    { sector: 'Solar PLI Scheme', country: 'India', size: 45, risk: 'Medium', timeline: '2024-2030' },
                  ].filter(r => r.size >= investmentThreshold).map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.sector}</td>
                      <td style={{ padding: '8px 12px' }}>{r.country}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>${r.size}B</td>
                      <td style={{ padding: '8px 12px' }}><span style={badge(r.risk === 'Low' ? T.green : r.risk === 'Medium' ? T.amber : T.red)}>{r.risk}</span></td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{r.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1 — China National ETS */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Sector Expansion Roadmap</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['Sector', 'Status', 'Entities', 'Coverage', 'Start', 'Allocation'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.textSec }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHINA_ETS_SECTORS.map((s, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{s.sector}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={badge(s.status === 'Active' ? T.green : s.status === 'Phase 2' ? T.blue : s.status === 'Phase 3' ? T.amber : T.textMut)}>{s.status}</span>
                        </td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{s.entities.toLocaleString()}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{s.coverage}</td>
                        <td style={{ padding: '6px 8px' }}>{s.startYear}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10, color: T.textSec }}>{s.allocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Free Allocation vs. Auction Timeline</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={[
                    { year: 2021, free: 100, auction: 0 },
                    { year: 2023, free: 97, auction: 3 },
                    { year: 2025, free: 90, auction: 10 },
                    { year: 2027, free: 80, auction: 20 },
                    { year: 2030, free: 65, auction: 35 },
                    { year: 2035, free: 40, auction: 60 },
                    { year: 2040, free: 20, auction: 80 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="free" stackId="1" fill={T.blue + '60'} stroke={T.blue} name="Free Allocation %" />
                    <Area type="monotone" dataKey="auction" stackId="1" fill={T.gold + '60'} stroke={T.gold} name="Auction %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>CCER (China Certified Emission Reductions) Market</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { category: 'Forestry', projects: 85, credits: 32 },
                  { category: 'Solar', projects: 120, credits: 45 },
                  { category: 'Wind', projects: 98, credits: 38 },
                  { category: 'Biogas', projects: 45, credits: 15 },
                  { category: 'Ocean Carbon', projects: 12, credits: 4 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="projects" fill={T.navy} name="Projects" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="credits" fill={T.green} name="Credits (MtCO2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2 — India Green Hydrogen Mission */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Mission Budget', val: '$2.3B', col: T.green },
                { label: '2030 Target', val: '5 MMTPA', col: T.blue },
                { label: '500 GW RE Target', val: '2030', col: T.teal },
                { label: 'PLI Solar/Battery', val: '$4.2B', col: T.gold },
              ].map(x => (
                <div key={x.label} style={card}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: x.col, fontFamily: T.mono, marginTop: 4 }}>{x.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Green Hydrogen Production vs. Target (MMTPA)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={INDIA_H2_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="production" fill={T.green} name="Green H2 Production" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="target" stroke={T.red} strokeDasharray="5 5" name="2030 Target" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Green H2 Cost Trajectory ($/kg)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={INDIA_H2_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 6]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="cost" fill={T.teal + '40'} stroke={T.teal} name="Cost $/kg" />
                    <ReferenceLine y={2.0} stroke={T.green} strokeDasharray="5 5" label={{ value: 'Parity $2/kg', fontSize: 10, fill: T.green }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>India BRSR Reporting Landscape</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { title: 'BRSR Core (Mandatory)', firms: '1000+ listed', status: 'Active', desc: 'Top 1000 listed entities by market cap — 9 ESG principles' },
                  { title: 'BRSR Lite (Voluntary)', firms: '5000+ listed', status: 'Scaling', desc: 'Simplified reporting for smaller listed entities' },
                  { title: 'Reasonable Assurance', firms: 'Top 150', status: 'Phase-in', desc: 'Third-party assurance mandate for top 150 by FY2027' },
                ].map(r => (
                  <div key={r.title} style={{ background: T.bg, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{r.title}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: T.blue, margin: '4px 0' }}>{r.firms}</div>
                    <span style={badge(r.status === 'Active' ? T.green : T.amber)}>{r.status}</span>
                    <p style={{ fontSize: 11, color: T.textSec, margin: '6px 0 0' }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 — Coal Phase-Down Timelines */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Scenario:</label>
              {[
                { key: 'scenario_fast', label: 'Accelerated', col: T.green },
                { key: 'scenario_base', label: 'Baseline', col: T.blue },
                { key: 'scenario_slow', label: 'Delayed', col: T.red },
              ].map(s => (
                <button key={s.key} onClick={() => setCoalScenario(s.key)} style={{
                  padding: '5px 14px', borderRadius: 16, border: `2px solid ${coalScenario === s.key ? s.col : 'transparent'}`,
                  background: coalScenario === s.key ? s.col + '18' : T.surface, color: coalScenario === s.key ? s.col : T.textSec,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}>{s.label}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {['china', 'india'].map(c => (
                <div key={c} style={card}>
                  <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>{c === 'china' ? 'China' : 'India'} Coal Capacity (GW) — {coalScenario.replace('scenario_', '').charAt(0).toUpperCase() + coalScenario.replace('scenario_', '').slice(1)}</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={COAL_RETIREMENT[c]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey={coalScenario} fill={c === 'china' ? T.red + '40' : T.orange + '40'} stroke={c === 'china' ? T.red : T.orange} name="Capacity (GW)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 15 }}>Stranded Asset Risk — Coal Fleet Age Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { age: '<5 yr', china: 180, india: 35 },
                  { age: '5-10 yr', china: 250, india: 50 },
                  { age: '10-20 yr', china: 350, india: 65 },
                  { age: '20-30 yr', china: 200, india: 40 },
                  { age: '30+ yr', china: 120, india: 20 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="china" fill={T.red} name="China (GW)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="india" fill={T.orange} name="India (GW)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4 — RE Deployment Curves */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { title: 'China Solar S-Curve (GW)', data: RE_CURVES.china_solar, color: T.gold },
                { title: 'China Wind S-Curve (GW)', data: RE_CURVES.china_wind, color: T.blue },
                { title: 'India Solar S-Curve (GW)', data: RE_CURVES.india_solar, color: T.orange },
                { title: 'India Wind S-Curve (GW)', data: RE_CURVES.india_wind, color: T.teal },
              ].map(c => (
                <div key={c.title} style={card}>
                  <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 14 }}>{c.title}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={c.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" fill={c.color + '30'} stroke={c.color} strokeWidth={2} name="Capacity GW" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Cost Parity Timeline — LCOE ($/MWh)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[
                  { year: 2020, cn_solar: 37, cn_coal: 50, in_solar: 38, in_coal: 65 },
                  { year: 2022, cn_solar: 32, cn_coal: 52, in_solar: 34, in_coal: 62 },
                  { year: 2024, cn_solar: 27, cn_coal: 54, in_solar: 30, in_coal: 60 },
                  { year: 2026, cn_solar: 23, cn_coal: 56, in_solar: 26, in_coal: 58 },
                  { year: 2028, cn_solar: 20, cn_coal: 58, in_solar: 22, in_coal: 56 },
                  { year: 2030, cn_solar: 18, cn_coal: 60, in_solar: 20, in_coal: 55 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cn_solar" stroke={T.gold} strokeWidth={2} name="CN Solar" />
                  <Line type="monotone" dataKey="cn_coal" stroke={T.red} strokeDasharray="5 5" name="CN Coal" />
                  <Line type="monotone" dataKey="in_solar" stroke={T.orange} strokeWidth={2} name="IN Solar" />
                  <Line type="monotone" dataKey="in_coal" stroke={T.purple} strokeDasharray="5 5" name="IN Coal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5 — Carbon Price Trajectories */}
        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Carbon Price Trajectories ($/tCO2)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={CARBON_PRICE_PATHS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="china_actual" stroke={T.red} strokeWidth={2} name="China ETS (Actual)" dot />
                  <Line type="monotone" dataKey="china_proj" stroke={T.red} strokeDasharray="5 5" name="China ETS (Projected)" dot={false} />
                  <Line type="monotone" dataKey="india_proj" stroke={T.teal} strokeDasharray="5 5" name="India CCTS (Projected)" dot={false} />
                  <ReferenceLine y={75} stroke={T.green} strokeDasharray="5 5" label={{ value: 'IEA NZE 2030 benchmark', fontSize: 10, fill: T.green }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Regulatory Change Alerts</h3>
              {alerts.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={badge(a.severity === 'high' ? T.red : T.amber)}>{a.severity.toUpperCase()}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{a.date}</span>
                  <span style={{ fontSize: 12, color: T.navy }}>{a.text}</span>
                </div>
              ))}
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
