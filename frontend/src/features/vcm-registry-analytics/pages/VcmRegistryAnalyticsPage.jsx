import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { VERRA_PROJECTS, VERRA_STATS } from '../../../data/verraRegistryData';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669' };
const fmt = (n, d = 1) => n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`;
const usd = (n, d = 2) => `$${parseFloat(n).toFixed(d)}`;

const REGISTRIES = ['Verra (VCS)', 'Gold Standard', 'ACR', 'CAR', 'ART TREES', 'Plan Vivo'];
const REG_COLORS  = ['#0f766e', '#b45309', '#6d28d9', '#0369a1', '#065f46', '#c2410c'];
const PROJECT_TYPES = ['REDD+', 'Improved Forest Management', 'Renewable Energy', 'Cookstoves', 'Methane Capture', 'Blue Carbon', 'Soil Carbon', 'Industrial Gas', 'Energy Efficiency'];
const PT_COLORS = ['#065f46','#0f766e','#b45309','#c2410c','#6d28d9','#0369a1','#92400e','#374151','#1d4ed8'];
const REGIONS = ['Latin America', 'Sub-Saharan Africa', 'Asia-Pacific', 'North America', 'Europe & CA'];
const VINTAGES = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

// Registry totals
const REGISTRY_DATA = REGISTRIES.map((r, i) => ({
  registry: r.split(' ')[0],
  full: r,
  issued:   Math.round((800 + sr(i * 7) * 1800) * 1e6),
  retired:  Math.round((400 + sr(i * 11) * 900) * 1e6),
  buffer:   Math.round((20 + sr(i * 13) * 80) * 1e6),
  projects: Math.round(200 + sr(i * 17) * 1800),
  color: REG_COLORS[i],
}));
REGISTRY_DATA[0].issued  = 1820e6; REGISTRY_DATA[0].retired = 910e6;  REGISTRY_DATA[0].projects = 2140;
REGISTRY_DATA[1].issued  = 260e6;  REGISTRY_DATA[1].retired = 148e6;  REGISTRY_DATA[1].projects = 320;

// Annual issuance trend
const ISSUANCE_TREND = VINTAGES.map((yr, i) => ({
  year: yr,
  vcs:  Math.round((120 + i * 28 + sr(i * 7) * 40) * 1e6),
  gs:   Math.round((25 + i * 5  + sr(i * 11) * 8) * 1e6),
  acr:  Math.round((15 + i * 3  + sr(i * 13) * 6) * 1e6),
  car:  Math.round((18 + i * 3  + sr(i * 17) * 5) * 1e6),
  art:  Math.round((i > 3 ? 8 + i * 4 + sr(i * 19) * 4 : 0) * 1e6),
  retirements: Math.round((80 + i * 22 + sr(i * 23) * 30) * 1e6),
}));

// Project type distribution
const PT_DATA = PROJECT_TYPES.map((p, i) => ({
  type: p,
  credits: Math.round((50 + sr(i * 5) * 350) * 1e6),
  price:   +(2 + sr(i * 7) * 18).toFixed(2),
  projects: Math.round(80 + sr(i * 9) * 400),
}));
PT_DATA[0].credits = 680e6; PT_DATA[0].price = 4.20;  // REDD+
PT_DATA[2].credits = 420e6; PT_DATA[2].price = 2.80;  // RE
PT_DATA[3].credits = 190e6; PT_DATA[3].price = 8.50;  // Cookstoves

// Top 20 projects
const PROJECTS = Array.from({ length: 20 }, (_, i) => {
  const names = [
    'Madre de Dios REDD+', 'Rimba Raya Biodiversity', 'Alto Mayo Protected Forest', 'Kariba REDD+',
    'Katingan Mentaya', 'Cordillera Azul', 'Kasigau Corridor', 'Tambopata Bahuaja',
    'Guanare Forest', 'Cerrado Biome IFM', 'Acapa Wind Farm', 'Landfill Gas Recov.',
    'Cookstove Ethiopia', 'Kenya Biogas', 'India Solar Rooftop', 'BC Forest Offset',
    'Blue Carbon Senegal', 'Soil Carbon US', 'Methane Coal Mine', 'Industrial HFC'];
  return {
    id: `VCS-${1000 + i * 47}`,
    name: names[i],
    registry: REGISTRIES[i % REGISTRIES.length].split(' ')[0],
    type: PROJECT_TYPES[i % PROJECT_TYPES.length],
    country: ['Peru','Indonesia','Peru','Zimbabwe','Indonesia','Peru','Kenya','Peru','Uruguay','Brazil','Mexico','USA','Ethiopia','Kenya','India','Canada','Senegal','USA','USA','India'][i],
    issued:  Math.round((5 + sr(i * 7) * 45) * 1e6),
    retired: Math.round((2 + sr(i * 11) * 25) * 1e6),
    vintage: 2018 + Math.floor(sr(i * 13) * 6),
    price:   +(2.5 + sr(i * 17) * 20).toFixed(2),
    quality: Math.round(55 + sr(i * 19) * 45),
    sdgs:    Math.round(3 + sr(i * 23) * 12),
    status:  i < 15 ? 'Active' : i < 18 ? 'Under Review' : 'Suspended',
  };
});

// Retirement trend
const RETIREMENT_BY_TYPE = PROJECT_TYPES.slice(0, 5).map((p, i) => ({
  type: p.length > 15 ? p.slice(0, 14) + '…' : p,
  retirements_22: Math.round((20 + sr(i * 5) * 80) * 1e6),
  retirements_23: Math.round((25 + sr(i * 7) * 90) * 1e6),
  retirements_24: Math.round((30 + sr(i * 9) * 100) * 1e6),
}));

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const StatusBadge = ({ s }) => {
  const c = { Active: T.emerald, 'Under Review': '#b45309', Suspended: T.red }[s] || T.gray;
  return <span style={{ background: c, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{s}</span>;
};

export default function VcmRegistryAnalyticsPage() {
  const [tab, setTab] = useState('Market Overview');
  const [regFilter, setRegFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const totalIssued   = REGISTRY_DATA.reduce((a, r) => a + r.issued, 0);
  const totalRetired  = REGISTRY_DATA.reduce((a, r) => a + r.retired, 0);
  const totalProjects = REGISTRY_DATA.reduce((a, r) => a + r.projects, 0);
  const retirePct     = totalIssued ? (totalRetired / totalIssued * 100).toFixed(0) : '0';

  const filtered = PROJECTS.filter(p =>
    (regFilter === 'All' || p.registry === regFilter.split(' ')[0]) &&
    (typeFilter === 'All' || p.type === typeFilter)
  );

  const TABS = ['Market Overview', 'Issuance & Retirements', 'Project Universe', 'By Project Type', 'Regional Breakdown'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BN1</span>
          <span style={{ fontSize: 11, color: T.emerald, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>VCM · REGISTRY</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>VCM Registry Analytics</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Verra · Gold Standard · ACR · CAR · ART TREES · Vintage issuance · Retirements · Project universe · Quality scoring</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Market Overview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Total Credits Issued" value={`${fmt(totalIssued)} tCO₂e`} sub="All registries, all vintages" color={T.navy} />
            <Kpi label="Total Retired" value={`${fmt(totalRetired)} tCO₂e`} sub={`${retirePct}% retirement rate`} color={T.emerald} />
            <Kpi label="Active Projects" value={totalProjects.toLocaleString()} sub="Across 6 registries" color={T.teal} />
            <Kpi label="2024 Issuance" value={`${fmt(ISSUANCE_TREND[8].vcs + ISSUANCE_TREND[8].gs + ISSUANCE_TREND[8].acr)} tCO₂e`} sub="YTD estimate" color={T.gold} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <Section title="Credits Issued vs Retired by Registry" badge="tCO₂e">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REGISTRY_DATA} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="registry" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                  <Bar dataKey="issued"  name="Issued"  fill={T.teal}    radius={[3, 3, 0, 0]} />
                  <Bar dataKey="retired" name="Retired" fill={T.emerald} radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Market Share by Registry">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={REGISTRY_DATA} dataKey="issued" nameKey="registry" cx="50%" cy="50%" outerRadius={100}
                    label={({ registry, percent }) => `${registry} ${(percent * 100).toFixed(0)}%`}>
                    {REGISTRY_DATA.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Registry Comparison Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Registry', 'Total Issued', 'Total Retired', 'Retirement Rate', 'Buffer Pool', 'Active Projects'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGISTRY_DATA.map((r, i) => (
                  <tr key={r.registry} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: r.color }}>{r.full}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(r.issued)}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', color: T.emerald }}>{fmt(r.retired)}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{r.issued ? (r.retired / r.issued * 100).toFixed(1) : '0.0'}%</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', color: T.gray }}>{fmt(r.buffer)}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{r.projects.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Issuance & Retirements' && (
        <>
          <Section title="Annual Issuance Trend by Registry (2016–2024)" badge="Million tCO₂e">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={ISSUANCE_TREND} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                <Area type="monotone" dataKey="vcs" name="Verra VCS"    stroke="#0f766e" fill="#0f766e" fillOpacity={0.2} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="gs"  name="Gold Std"     stroke="#b45309" fill="#b45309" fillOpacity={0.2} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="acr" name="ACR"          stroke="#6d28d9" fill="#6d28d9" fillOpacity={0.2} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="car" name="CAR"          stroke="#0369a1" fill="#0369a1" fillOpacity={0.2} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="art" name="ART TREES"    stroke="#065f46" fill="#065f46" fillOpacity={0.2} strokeWidth={2} stackId="a" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Annual Retirements vs Issuance">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={ISSUANCE_TREND} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                  <Line type="monotone" dataKey={d => d.vcs + d.gs + d.acr + d.car + d.art} name="Total Issuance" stroke={T.teal} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="retirements" name="Retirements" stroke={T.emerald} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Retirements by Project Type (2022–2024)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={RETIREMENT_BY_TYPE} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="type" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                  <Bar dataKey="retirements_22" name="2022" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="retirements_23" name="2023" fill={T.teal}  radius={[2, 2, 0, 0]} />
                  <Bar dataKey="retirements_24" name="2024" fill={T.emerald} radius={[2, 2, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}

      {tab === 'Project Universe' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Registry</div>
              <select value={regFilter} onChange={e => setRegFilter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option>All</option>{REGISTRIES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Project Type</div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option>All</option>{PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 12, color: T.gray }}>{filtered.length} projects</span>
            </div>
          </div>

          <Section title="Top Projects by Credits Issued">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Project Name', 'Registry', 'Type', 'Country', 'Issued', 'Retired', 'Vintage', 'Price', 'Quality', 'SDGs', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.teal }}>{p.id}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.registry}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: T.purple }}>{p.type}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.country}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(p.issued)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.emerald }}>{fmt(p.retired)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{p.vintage}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.gold }}>{usd(p.price)}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 40, height: 6, background: '#e5e0d8', borderRadius: 3 }}>
                            <div style={{ width: `${p.quality}%`, height: 6, background: p.quality > 70 ? T.emerald : p.quality > 50 ? T.gold : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.quality}</span>
                        </div>
                      </td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{p.sdgs}</td>
                      <td style={{ padding: '7px 10px' }}><StatusBadge s={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {tab === 'By Project Type' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Credits Issued by Project Type">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={PT_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 140, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" width={140} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                  <Bar dataKey="credits" name="Credits Issued" radius={[0, 4, 4, 0]}>
                    {PT_DATA.map((_, i) => <Cell key={i} fill={PT_COLORS[i % PT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Average Credit Price by Project Type" badge="USD/tCO₂e">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={PT_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 140, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `$${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" width={140} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v}/tCO₂e`} />
                  <Bar dataKey="price" name="Avg Price ($/tCO₂e)" radius={[0, 4, 4, 0]}>
                    {PT_DATA.map((p, i) => <Cell key={i} fill={p.price > 10 ? T.emerald : p.price > 5 ? T.gold : T.teal} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Price vs Volume Scatter (Project Type)">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="credits" name="Credits (M tCO₂e)" tickFormatter={v => fmt(v)}
                  label={{ value: 'Volume (tCO₂e)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis dataKey="price" name="Price ($/t)" tickFormatter={v => `$${v}`}
                  label={{ value: 'Price ($/t)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n.includes('Price') ? `$${v}` : fmt(v), n]} />
                <Scatter data={PT_DATA} fill={T.teal} opacity={0.75} r={8} />
              </ScatterChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Regional Breakdown' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Credits Issued by Region">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={REGIONS.map((r, i) => ({
                  region: r,
                  issued:  Math.round((200 + sr(i * 5) * 800) * 1e6),
                  retired: Math.round((80  + sr(i * 7) * 400) * 1e6),
                }))} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="region" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${fmt(v)} tCO₂e`} />
                  <Bar dataKey="issued"  name="Issued"  fill={T.teal}    radius={[3, 3, 0, 0]} />
                  <Bar dataKey="retired" name="Retired" fill={T.emerald} radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Top Country Project Hosts">
              {['Brazil', 'Indonesia', 'Peru', 'Kenya', 'India', 'USA', 'Colombia', 'Zimbabwe'].map((c, i) => (
                <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 7 ? '1px solid #f0ece4' : 'none' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.teal }}>{fmt(Math.round((80 + sr(i * 7) * 320) * 1e6))} tCO₂e</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gray }}>{Math.round(40 + sr(i * 11) * 280)} projects</span>
                  </div>
                </div>
              ))}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
