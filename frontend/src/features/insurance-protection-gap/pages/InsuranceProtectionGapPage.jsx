import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend, ReferenceLine, PieChart, Pie
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9' };
const fmt = (n, d = 1) => n >= 1e12 ? `$${(n / 1e12).toFixed(d)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : `$${n.toFixed(d)}`;

const PERILS_GAP = ['Tropical Cyclone', 'Flood', 'Earthquake', 'Wildfire', 'Drought', 'Winter Storm'];
const INCOME_GROUPS = ['High Income', 'Upper-Middle', 'Lower-Middle', 'Low Income'];
const INCOME_COLORS = ['#0f766e', '#b45309', T.orange, T.red];

// Country-level protection gap data
const COUNTRIES = [
  { name: 'USA',         penetration: 82, gap: 18, totalLoss: 1240, insuredLoss: 1017, gdp: 27, region: 'North America',  risk: 'High' },
  { name: 'Germany',     penetration: 74, gap: 26, totalLoss: 380,  insuredLoss: 281,  gdp: 20, region: 'Europe',          risk: 'Medium' },
  { name: 'Japan',       penetration: 68, gap: 32, totalLoss: 520,  insuredLoss: 354,  gdp: 18, region: 'Asia-Pacific',    risk: 'Very High' },
  { name: 'Australia',   penetration: 79, gap: 21, totalLoss: 290,  insuredLoss: 229,  gdp: 25, region: 'Asia-Pacific',    risk: 'High' },
  { name: 'China',       penetration: 22, gap: 78, totalLoss: 1840, insuredLoss: 405,  gdp: 4,  region: 'Asia-Pacific',    risk: 'Very High' },
  { name: 'India',       penetration: 8,  gap: 92, totalLoss: 620,  insuredLoss: 50,   gdp: 1,  region: 'Asia-Pacific',    risk: 'Very High' },
  { name: 'Brazil',      penetration: 31, gap: 69, totalLoss: 340,  insuredLoss: 105,  gdp: 7,  region: 'Latin America',   risk: 'High' },
  { name: 'Mexico',      penetration: 18, gap: 82, totalLoss: 280,  insuredLoss: 50,   gdp: 5,  region: 'Latin America',   risk: 'High' },
  { name: 'Turkey',      penetration: 26, gap: 74, totalLoss: 180,  insuredLoss: 47,   gdp: 4,  region: 'Middle East',     risk: 'Very High' },
  { name: 'Nigeria',     penetration: 4,  gap: 96, totalLoss: 120,  insuredLoss: 5,    gdp: 0,  region: 'Africa',          risk: 'High' },
  { name: 'France',      penetration: 71, gap: 29, totalLoss: 260,  insuredLoss: 185,  gdp: 17, region: 'Europe',          risk: 'Medium' },
  { name: 'UK',          penetration: 76, gap: 24, totalLoss: 210,  insuredLoss: 160,  gdp: 19, region: 'Europe',          risk: 'Medium' },
  { name: 'Philippines', penetration: 11, gap: 89, totalLoss: 310,  insuredLoss: 34,   gdp: 1,  region: 'Asia-Pacific',    risk: 'Very High' },
  { name: 'Bangladesh',  penetration: 5,  gap: 95, totalLoss: 190,  insuredLoss: 10,   gdp: 0,  region: 'Asia-Pacific',    risk: 'Very High' },
  { name: 'Canada',      penetration: 77, gap: 23, totalLoss: 380,  insuredLoss: 293,  gdp: 22, region: 'North America',   risk: 'High' },
];

// Climate trend — growing gap
const GAP_TREND = Array.from({ length: 15 }, (_, i) => ({
  year: 2010 + i,
  totalLoss:   Math.round((150 + i * 18 + sr(i * 7) * 30) * 1e9),
  insuredLoss: Math.round((60  + i * 7  + sr(i * 11) * 15) * 1e9),
  gap:         Math.round((90  + i * 11 + sr(i * 13) * 18) * 1e9),
  gapPct:      (56 + i * 0.5 + sr(i * 17) * 2).toFixed(1),
}));

// Peril penetration by income group
const PERIL_PENETRATION = PERILS_GAP.map((p, pi) => {
  const obj = { peril: p.replace('Tropical Cyclone', 'TC').replace('Winter Storm', 'W.Storm') };
  INCOME_GROUPS.forEach((g, gi) => {
    obj[g.replace(' ', '_')] = Math.round((70 - gi * 18 + sr(pi * 5 + gi * 13) * 20));
  });
  return obj;
});

// Gap by region
const REGION_GAP = [
  { region: 'North America',  gapBn: 420,  penetration: 80, climate_risk: 82 },
  { region: 'Europe',         gapBn: 280,  penetration: 72, climate_risk: 65 },
  { region: 'Asia-Pacific',   gapBn: 1840, penetration: 28, climate_risk: 91 },
  { region: 'Latin America',  gapBn: 560,  penetration: 24, climate_risk: 78 },
  { region: 'Middle East',    gapBn: 320,  penetration: 19, climate_risk: 85 },
  { region: 'Africa',         gapBn: 580,  penetration: 5,  climate_risk: 76 },
];

// Climate stress — gap widening under scenarios
const CLIMATE_STRESS = ['2030 RCP4.5', '2030 RCP8.5', '2050 RCP4.5', '2050 RCP8.5', '2100 RCP8.5'].map((s, i) => ({
  scenario: s,
  gap:           Math.round(900 * (1 + (i + 1) * 0.28) * 1e9),
  insurable:     Math.round(100 * (1 - i * 0.12) * 1e9),
  uninsurable:   Math.round(200 * (i + 1) * 0.35 * 1e9),
  penetration:   Math.max(12, 68 - i * 8).toFixed(0),
}));

// Regulatory / public-private data
const PP_SCHEMES = [
  { name: 'NFIP (USA)',           country: 'USA',    peril: 'Flood',            coverage: 1290, subsidised: true,  year: 1968, model: 'Public' },
  { name: 'CEA (California)',     country: 'USA',    peril: 'Earthquake',        coverage: 22,   subsidised: false, year: 1996, model: 'Public-Private' },
  { name: 'Pool Re (UK)',         country: 'UK',     peril: 'Terrorism',         coverage: 9,    subsidised: true,  year: 1993, model: 'Public-Private' },
  { name: 'Nat Cat CCR (France)', country: 'France', peril: 'Multi-Peril',       coverage: 32,   subsidised: true,  year: 1982, model: 'Public' },
  { name: 'IBRD Cat DDO',         country: 'Multiple', peril: 'Sovereign',       coverage: 6,    subsidised: false, year: 2008, model: 'MDB-Backed' },
  { name: 'ARC (Africa)',         country: 'Africa', peril: 'Drought',           coverage: 3.5,  subsidised: true,  year: 2014, model: 'MDB-Backed' },
  { name: 'CCRIF (Caribbean)',    country: 'Caribbean', peril: 'Cyclone/EQ',     coverage: 1.6,  subsidised: false, year: 2007, model: 'Parametric Pool' },
  { name: 'PCRIC (Pacific)',      country: 'Pacific', peril: 'Cyclone/EQ',       coverage: 0.4,  subsidised: true,  year: 2016, model: 'Parametric Pool' },
];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
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

const RiskBadge = ({ risk }) => {
  const c = { 'Very High': T.red, 'High': T.orange, 'Medium': '#b45309', 'Low': T.teal }[risk] || T.gray;
  return <span style={{ background: c, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{risk}</span>;
};

export default function InsuranceProtectionGapPage() {
  const [tab, setTab] = useState('Protection Gap');
  const [region, setRegion] = useState('All');
  const [sortBy, setSortBy] = useState('gap');

  const globalGap = Math.round(1.8 * 1e12);
  const globalInsured = 0.32;
  const latestTrend = GAP_TREND[GAP_TREND.length - 1];

  const filteredCountries = COUNTRIES
    .filter(c => region === 'All' || c.region === region)
    .sort((a, b) => sortBy === 'gap' ? b.gap - a.gap : sortBy === 'penetration' ? a.penetration - b.penetration : b.totalLoss - a.totalLoss);

  const TABS = ['Protection Gap', 'Country Analysis', 'Penetration Rates', 'Climate Stress', 'Public-Private Schemes'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BM3</span>
          <span style={{ fontSize: 11, color: T.purple, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>PROTECTION GAP</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Physical Risk Insurance Gap Analyser</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Global protection gap · Insurance penetration by country & peril · Climate stress · Public-private schemes</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Protection Gap' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Global Protection Gap" value={fmt(globalGap)} sub="Uninsured economic losses" color={T.red} />
            <Kpi label="Global Penetration" value={`${(globalInsured * 100).toFixed(0)}%`} sub="Insured / total loss" color={T.orange} />
            <Kpi label="2024 Gap (est.)" value={fmt(latestTrend.gap)} sub={`${latestTrend.gapPct}% of total loss uninsured`} color={T.red} />
            <Kpi label="Gap Growth (10Y)" value="+64%" sub="Widening faster than GDP" color={T.purple} />
          </div>

          <Section title="Global Protection Gap Trend (2010–2024)" badge="USD Billions">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={GAP_TREND} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Area type="monotone" dataKey="totalLoss"   name="Total Econ. Loss" stroke={T.navy}  fill={T.navy}  fillOpacity={0.08} strokeWidth={2} />
                <Area type="monotone" dataKey="insuredLoss" name="Insured Loss"      stroke={T.teal}  fill={T.teal}  fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="gap"         name="Protection Gap"    stroke={T.red}   fill={T.red}   fillOpacity={0.2}  strokeWidth={2.5} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Protection Gap by Region" badge="USD Billions (uninsured)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={REGION_GAP} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `$${v}B`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" width={80} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v}B`} />
                  <Bar dataKey="gapBn" name="Uninsured Gap ($B)" fill={T.red} radius={[0, 4, 4, 0]}>
                    {REGION_GAP.map((_, i) => <Cell key={i} fill={[T.teal, '#1d4ed8', T.red, T.orange, T.purple, '#374151'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Climate Risk vs Insurance Penetration" badge="Bubble = Gap Size">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="climate_risk" name="Climate Risk Score" tickFormatter={v => `${v}`}
                    label={{ value: 'Climate Risk Score', position: 'insideBottom', offset: -10, fontSize: 11 }}
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis dataKey="penetration" name="Penetration %" tickFormatter={v => `${v}%`}
                    label={{ value: 'Penetration %', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [n.includes('Risk') ? `${v}` : `${v}%`, n]} />
                  <Scatter data={REGION_GAP} name="Regions" fill={T.red} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Gap % Trend (Uninsured / Total Loss)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={GAP_TREND} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis tickFormatter={v => `${v}%`} domain={[50, 75]} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Line type="monotone" dataKey="gapPct" name="Protection Gap %" stroke={T.red} strokeWidth={2.5} dot={false} />
                <ReferenceLine y={68} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Global Avg 68%', fill: T.gold, fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Country Analysis' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Filter by Region</div>
              <select value={region} onChange={e => setRegion(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option>All</option>
                {['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Africa'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Sort by</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option value="gap">Protection Gap %</option>
                <option value="penetration">Penetration (Low→High)</option>
                <option value="loss">Total Loss</option>
              </select>
            </div>
          </div>

          <Section title="Country Protection Gap Matrix">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Country', 'Region', 'Penetration', 'Gap %', 'Total Econ. Loss', 'Insured Loss', 'Uninsured Loss', 'GDP Pen.', 'Climate Risk'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCountries.map((c, i) => (
                  <tr key={c.name} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: T.gray }}>{c.region}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ background: '#e9e4db', borderRadius: 3, height: 6, width: 60 }}>
                          <div style={{ background: c.penetration > 60 ? T.teal : c.penetration > 30 ? T.orange : T.red, height: 6, width: `${c.penetration}%`, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{c.penetration}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: c.gap > 70 ? T.red : c.gap > 40 ? T.orange : T.teal }}>{c.gap}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>${c.totalLoss}B</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.teal }}>${c.insuredLoss}B</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>${c.totalLoss - c.insuredLoss}B</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{c.gdp}%</td>
                    <td style={{ padding: '8px 12px' }}><RiskBadge risk={c.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Penetration Rate by Country">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filteredCountries} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="name" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} />
                <ReferenceLine y={50} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Global Avg', fill: T.gold, fontSize: 11 }} />
                <Bar dataKey="penetration" name="Insurance Penetration %" radius={[3, 3, 0, 0]}>
                  {filteredCountries.map((c, i) => <Cell key={i} fill={c.penetration > 60 ? T.teal : c.penetration > 30 ? T.orange : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Penetration Rates' && (
        <>
          <Section title="Insurance Penetration by Peril & Income Group" badge="% of Economic Loss Insured">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={PERIL_PENETRATION} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="peril" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} />
                {INCOME_GROUPS.map((g, i) => (
                  <Bar key={g} dataKey={g.replace(' ', '_')} name={g} fill={INCOME_COLORS[i]} radius={[2, 2, 0, 0]} />
                ))}
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Penetration Gap by Income Group">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={INCOME_GROUPS.map((g, i) => ({
                  group: g,
                  avg_pen: Math.round(72 - i * 19 + sr(i * 7) * 8),
                  target:  Math.round(80 - i * 10),
                }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="group" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="avg_pen" name="Actual Penetration" radius={[3, 3, 0, 0]}>
                    {INCOME_GROUPS.map((_, i) => <Cell key={i} fill={INCOME_COLORS[i]} />)}
                  </Bar>
                  <Bar dataKey="target" name="Target Penetration" fill="#e5e0d8" radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Flood Penetration Deep-Dive by Region">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { region: 'N. America', pen: 64, mandated: true  },
                  { region: 'Europe',     pen: 48, mandated: false },
                  { region: 'Asia-Pac',   pen: 18, mandated: false },
                  { region: 'Lat Am',     pen: 12, mandated: false },
                  { region: 'ME & Africa', pen: 6, mandated: false },
                ]} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis type="category" dataKey="region" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="pen" name="Flood Penetration" radius={[0, 4, 4, 0]}>
                    {[64, 48, 18, 12, 6].map((v, i) => <Cell key={i} fill={v > 50 ? T.teal : v > 20 ? T.orange : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}

      {tab === 'Climate Stress' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="2050 RCP8.5 Gap" value={fmt(CLIMATE_STRESS[3].gap)} sub="vs $1.8T today" color={T.red} />
            <Kpi label="Uninsurable by 2050" value={fmt(CLIMATE_STRESS[3].uninsurable)} sub="Risks too large to insure" color={T.purple} />
            <Kpi label="Penetration 2050" value={`${CLIMATE_STRESS[3].penetration}%`} sub="Forecast under RCP 8.5" color={T.orange} />
            <Kpi label="Retreat Scenarios" value="12 regions" sub="Where insurance may exit" color={T.red} />
          </div>

          <Section title="Protection Gap Under Climate Scenarios" badge="USD Billions">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={CLIMATE_STRESS} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="scenario" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="insurable"   name="Insurable Gap"   fill={T.teal}   radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="uninsurable" name="Uninsurable Risk" fill={T.red}    radius={[3, 3, 0, 0]} stackId="a" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Penetration Rate Under Scenarios">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={CLIMATE_STRESS} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="scenario" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} />
                  <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Line type="monotone" dataKey="penetration" name="Penetration %" stroke={T.orange} strokeWidth={2.5} dot={{ r: 5, fill: T.orange }} />
                  <ReferenceLine y={32} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Current 32%', fill: T.red, fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Key Climate-Insurance Retreat Risks" badge="At-Risk Markets">
              {[
                { market: 'Florida Homeowners', risk: 'Hurricane + Flood', trend: 'Insurers exiting' },
                { market: 'California Fire',    risk: 'Wildfire',          trend: 'State FAIR plan only' },
                { market: 'Bangladesh Flood',   risk: 'Flood + Cyclone',   trend: 'Essentially uninsured' },
                { market: 'Australian Coastal', risk: 'Cyclone + Surge',   trend: 'Premium spikes +180%' },
                { market: 'Dutch Delta',        risk: 'Flood',             trend: 'Mandatory scheme' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #e5e0d8' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{r.market}</div>
                    <div style={{ fontSize: 12, color: T.purple }}>{r.risk}</div>
                  </div>
                  <span style={{ fontSize: 11, color: T.red, fontFamily: 'JetBrains Mono, monospace', background: '#fef2f2', padding: '3px 8px', borderRadius: 4 }}>{r.trend}</span>
                </div>
              ))}
            </Section>
          </div>
        </>
      )}

      {tab === 'Public-Private Schemes' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Active Schemes" value={`${PP_SCHEMES.length}`} sub="Global public-private pools" color={T.teal} />
            <Kpi label="Total Coverage" value={fmt(PP_SCHEMES.reduce((a, s) => a + s.coverage, 0) * 1e9)} sub="Combined capacity" color={T.navy} />
            <Kpi label="Parametric Pools" value="2" sub="CCRIF & PCRIC active" color={T.purple} />
            <Kpi label="Subsidised Schemes" value={`${PP_SCHEMES.filter(s => s.subsidised).length} / ${PP_SCHEMES.length}`} sub="Publicly subsidised" color={T.orange} />
          </div>

          <Section title="Global Public-Private Insurance Schemes">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Scheme', 'Country', 'Peril', 'Coverage', 'Model', 'Year Est.', 'Subsidised'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PP_SCHEMES.map((s, i) => (
                  <tr key={s.name} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{s.name}</td>
                    <td style={{ padding: '8px 12px' }}>{s.country}</td>
                    <td style={{ padding: '8px 12px', color: T.purple }}>{s.peril}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.teal }}>{fmt(s.coverage * 1e9)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, background: s.model === 'Public' ? '#dbeafe' : s.model.includes('MDB') ? '#fef3c7' : '#d1fae5', color: T.navy, padding: '2px 8px', borderRadius: 4 }}>{s.model}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{s.year}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: s.subsidised ? T.teal : T.gray, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.subsidised ? 'YES' : 'NO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Coverage Capacity by Scheme">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={PP_SCHEMES} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                <XAxis type="number" tickFormatter={v => fmt(v * 1e9)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <Tooltip formatter={v => fmt(v * 1e9)} />
                <Bar dataKey="coverage" name="Coverage Capacity" radius={[0, 4, 4, 0]}>
                  {PP_SCHEMES.map((s, i) => <Cell key={i} fill={s.subsidised ? T.teal : T.purple} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}
    </div>
  );
}
