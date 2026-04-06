import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669', amber: '#92400e' };
const usd = (n, d = 0) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: d })}`;

const CHEMISTRIES = [
  // key_use: primary critical minerals per IEA Global EV Outlook 2024 / BloombergNEF Battery Price Survey
  { name: 'LFP',            full: 'LiFePO₄',      color: '#0f766e', energy: 160, cost2024: 68,  cost2030: 42,  cycle: 4000, safety: 98, maturity: 'Commercial', key_use: 'Iron, Phosphate' },
  { name: 'NMC 811',        full: 'NMC 811',       color: '#1d4ed8', energy: 270, cost2024: 82,  cost2030: 54,  cycle: 1500, safety: 80, maturity: 'Commercial', key_use: 'Nickel, Manganese, Cobalt' },
  { name: 'NMC 622',        full: 'NMC 622',       color: '#6d28d9', energy: 240, cost2024: 92,  cost2030: 62,  cycle: 2000, safety: 84, maturity: 'Commercial', key_use: 'Nickel, Manganese, Cobalt' },
  { name: 'NCA',            full: 'NCA (Tesla)',    color: '#c2410c', energy: 260, cost2024: 88,  cost2030: 58,  cycle: 1200, safety: 78, maturity: 'Commercial', key_use: 'Nickel, Cobalt, Aluminium' },
  { name: 'LMFP',           full: 'LMFP (Mn-rich)',color: '#b45309', energy: 190, cost2024: 72,  cost2030: 45,  cycle: 3000, safety: 95, maturity: 'Scaling',    key_use: 'Manganese, Iron, Phosphate' },
  { name: 'Solid State',    full: 'Solid State',   color: '#059669', energy: 400, cost2024: 280, cost2030: 100, cycle: 5000, safety: 99, maturity: 'Pilot',       key_use: 'Lithium (solid electrolyte)' },
  { name: 'Na-Ion',         full: 'Sodium-Ion',    color: '#374151', energy: 140, cost2024: 55,  cost2030: 38,  cycle: 3500, safety: 97, maturity: 'Commercial', key_use: 'Sodium, Manganese' },
];

// Battery cost learning curve ($/kWh)
const COST_CURVE = [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({
  year: yr,
  pack_avg:      Math.round(1100 * Math.pow(0.82, i)),
  nmc:           Math.round(1050 * Math.pow(0.81, i)),
  lfp:           Math.round(980  * Math.pow(0.80, i)),
  solid_state:   i < 7 ? null : Math.round(380 - (i - 7) * 60),
}));

// Global EV sales & forecast
const EV_SALES = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2030].map((yr, i) => ({
  year: yr,
  bev:   Math.round([1.0, 1.2, 2.0, 4.4, 7.8, 10.2, 13.8, 17.4, 21.2, 26.0, 31.5, 45.0][i]),
  phev:  Math.round([1.2, 1.4, 1.8, 3.2, 4.1, 4.8,  5.6,  6.8,  7.9,  9.4,  11.0, 14.0][i]),
  total: Math.round([2.2, 2.6, 3.8, 7.6, 11.9,15.0, 19.4, 24.2, 29.1, 35.4, 42.5, 59.0][i]),
}));

// Regional EV penetration
const EV_PENETRATION = [
  { region: 'China',          pen2024: 38, pen2030: 72, sales_m: 9.1,  target: 'Non-binding 40% by 2030' },
  { region: 'Europe',         pen2024: 22, pen2030: 55, sales_m: 2.8,  target: 'ICE ban 2035' },
  { region: 'USA',            pen2024: 9,  pen2030: 28, sales_m: 1.4,  target: 'IRA 50% ZEV by 2030' },
  { region: 'India',          pen2024: 4,  pen2030: 18, sales_m: 0.4,  target: 'FAME III, 30% by 2030' },
  { region: 'SE Asia',        pen2024: 3,  pen2030: 12, sales_m: 0.2,  target: 'Various' },
  { region: 'Rest of World',  pen2024: 5,  pen2030: 15, sales_m: 0.5,  target: 'NDC dependent' },
];

// Gigafactory capacity
const GIGAFACTORIES = [
  { name: 'CATL (Global)',        country: 'China/Int',  gwh: 660, status: 'Operating',    chemistry: 'LFP/NMC' },
  { name: 'BYD',                  country: 'China',      gwh: 380, status: 'Operating',    chemistry: 'LFP/NMC' },
  { name: 'Tesla Gigafactories',  country: 'USA/DE/CN',  gwh: 270, status: 'Operating',    chemistry: 'NCA/LFP' },
  { name: 'LG Energy Solution',   country: 'Korea/EU',   gwh: 200, status: 'Operating',    chemistry: 'NMC 811' },
  { name: 'Panasonic',            country: 'Japan/USA',  gwh: 120, status: 'Operating',    chemistry: 'NCA' },
  { name: 'SK On',                country: 'Korea/EU',   gwh: 110, status: 'Operating',    chemistry: 'NMC' },
  { name: 'Samsung SDI',          country: 'Korea/EU',   gwh: 100, status: 'Operating',    chemistry: 'NMC' },
  { name: 'Northvolt',            country: 'Sweden',     gwh: 60,  status: 'Distressed',   chemistry: 'NMC 811' },
  { name: 'Freyr',                country: 'Norway',     gwh: 40,  status: 'Construction', chemistry: 'LFP' },
  { name: 'ACC (Stellantis/TotalEnergies)', country: 'France', gwh: 120, status: 'Construction', chemistry: 'NMC' },
  { name: 'PowerCo (VW)',         country: 'Germany',    gwh: 200, status: 'Construction', chemistry: 'Unified' },
];

const STATUS_C = { Operating: T.emerald, Construction: T.teal, Distressed: T.red, Planned: T.gray };

// Chemistry mix forecast
const CHEM_MIX = [2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({
  year: yr, lfp: [20,32,42,48,52,56][i], nmc: [62,54,44,38,32,28][i], nca: [12,8,6,4,3,2][i],
  lmfp: [0,2,4,6,8,8][i], solid: [0,0,0,1,2,3][i], naion: [0,0,2,3,3,3][i],
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

export default function BatteryEVAnalyticsPage() {
  const [tab, setTab] = useState('Battery Cost Curves');

  const TABS = ['Battery Cost Curves', 'EV Adoption', 'Chemistry Mix', 'Gigafactories', 'Chemistry Comparison'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BO2</span>
          <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>BATTERY · EV · TECHNOLOGY</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Battery Technology & EV Analytics</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>LCOB learning curves · LFP / NMC / Solid-State · EV adoption by region · Chemistry mix · Gigafactory capacity</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Battery Cost Curves' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Pack Cost 2024" value="$118/kWh" sub="Blended average (all chemistries)" color={T.navy} />
            <Kpi label="LFP Cost 2024"  value="$68/kWh"  sub="Cheapest commercial chemistry"   color={T.teal} />
            <Kpi label="Cost Target 2030" value="$55/kWh" sub="BloombergNEF baseline"           color={T.emerald} />
            <Kpi label="Learning Rate"   value="~18%"    sub="Cost decline per doubling volume" color={T.gold} />
          </div>

          <Section title="Battery Pack Cost Learning Curve (2010–2030)" badge="$/kWh">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={COST_CURVE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => v ? `$${v}/kWh` : 'N/A'} />
                <ReferenceLine y={100} stroke={T.gold} strokeDasharray="4 4" label={{ value: '$100/kWh parity', fill: T.gold, fontSize: 10 }} />
                <ReferenceLine x={2024} stroke={T.gray} strokeDasharray="4 4" label={{ value: 'Today', fill: T.gray, fontSize: 10 }} />
                <Line dataKey="pack_avg"    name="Pack Avg"    stroke={T.navy}   strokeWidth={2.5} dot={false} />
                <Line dataKey="nmc"         name="NMC"         stroke="#1d4ed8"  strokeWidth={2}   dot={false} strokeDasharray="5 3" />
                <Line dataKey="lfp"         name="LFP"         stroke="#0f766e"  strokeWidth={2}   dot={false} strokeDasharray="4 2" />
                <Line dataKey="solid_state" name="Solid State" stroke="#059669"  strokeWidth={2}   dot={false} strokeDasharray="3 1" connectNulls={false} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Chemistry Cost Comparison (2024 vs 2030)" badge="$/kWh">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CHEMISTRIES} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="name" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `$${v}/kWh`} />
                <ReferenceLine y={100} stroke={T.gold} strokeDasharray="4 4" />
                <Bar dataKey="cost2024" name="2024 Cost" fill={T.gray}    radius={[3, 3, 0, 0]} />
                <Bar dataKey="cost2030" name="2030 Est." fill={T.teal}    radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'EV Adoption' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="2024 Global EV Sales" value="19.4M" sub="BEV + PHEV combined" color={T.teal} />
            <Kpi label="2030 Forecast" value="59M" sub="+204% vs 2024 (base case)" color={T.emerald} />
            <Kpi label="China Market Share" value="67%" sub="Of global EV sales 2024" color={T.orange} />
            <Kpi label="Global Penetration 2024" value="~20%" sub="Of new car sales" color={T.gold} />
          </div>

          <Section title="Global EV Sales — BEV + PHEV (Millions)" badge="2018–2030">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={EV_SALES} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis tickFormatter={v => `${v}M`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}M units`} />
                <ReferenceLine x={2024} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Forecast →', fill: T.gold, fontSize: 10 }} />
                <Area type="monotone" dataKey="bev"  name="BEV"  stroke={T.teal}  fill={T.teal}  fillOpacity={0.25} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="phev" name="PHEV" stroke={T.amber} fill={T.amber} fillOpacity={0.2}  strokeWidth={2} stackId="a" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="EV Penetration by Region (2024 vs 2030 Target)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Region', '2024 Penetration', '2030 Target', '2024 Sales', 'Policy Anchor'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EV_PENETRATION.map((r, i) => (
                  <tr key={r.region} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700 }}>{r.region}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: '#e5e0d8', borderRadius: 3 }}>
                          <div style={{ width: `${r.pen2024}%`, height: 6, background: r.pen2024 > 25 ? T.emerald : r.pen2024 > 10 ? T.teal : T.orange, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{r.pen2024}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', color: T.teal, fontWeight: 700 }}>{r.pen2030}%</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{r.sales_m}M</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: T.purple }}>{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Chemistry Mix' && (
        <>
          <Section title="Battery Chemistry Mix — Global Market Share (2020–2030)" badge="% of GWh shipped">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={CHEM_MIX} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Area type="monotone" dataKey="lfp"   name="LFP"         stroke="#0f766e" fill="#0f766e" fillOpacity={0.25} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="nmc"   name="NMC"         stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2}  strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="nca"   name="NCA"         stroke="#c2410c" fill="#c2410c" fillOpacity={0.2}  strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="lmfp"  name="LMFP"        stroke="#b45309" fill="#b45309" fillOpacity={0.2}  strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="naion" name="Na-Ion"       stroke="#374151" fill="#374151" fillOpacity={0.15} strokeWidth={2} stackId="a" />
                <Area type="monotone" dataKey="solid" name="Solid State"  stroke="#059669" fill="#059669" fillOpacity={0.2}  strokeWidth={2} stackId="a" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="2024 Chemistry Mix">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={CHEMISTRIES.map((c, i) => ({ name: c.name, value: CHEM_MIX[2][Object.keys(CHEM_MIX[2]).slice(1)[i]] || 2 }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, value }) => value > 2 ? `${name} ${value}%` : ''}>
                    {CHEMISTRIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="2030 Projected Chemistry Mix">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    { name: 'LFP',   value: 56 }, { name: 'NMC', value: 28 }, { name: 'NCA', value: 2 },
                    { name: 'LMFP',  value: 8  }, { name: 'Na-Ion', value: 3 }, { name: 'Solid', value: 3 },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, value }) => `${name} ${value}%`}>
                    {CHEMISTRIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}

      {tab === 'Gigafactories' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Total Announced Capacity" value={`${GIGAFACTORIES.reduce((a, g) => a + g.gwh, 0).toLocaleString()} GWh`} sub="Global pipeline" color={T.navy} />
            <Kpi label="Operating Capacity" value={`${GIGAFACTORIES.filter(g => g.status === 'Operating').reduce((a, g) => a + g.gwh, 0).toLocaleString()} GWh`} sub="Currently operational" color={T.emerald} />
            <Kpi label="Under Construction" value={`${GIGAFACTORIES.filter(g => g.status === 'Construction').reduce((a, g) => a + g.gwh, 0).toLocaleString()} GWh`} sub="In construction phase" color={T.teal} />
            <Kpi label="CATL Market Share" value="31%" sub="Of global cell production" color={T.orange} />
          </div>

          <Section title="Gigafactory Capacity by Manufacturer" badge="GWh">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={GIGAFACTORIES} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `${v} GWh`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} />
                <Tooltip formatter={v => `${v} GWh`} />
                <Bar dataKey="gwh" name="Capacity (GWh)" radius={[0, 4, 4, 0]}>
                  {GIGAFACTORIES.map((g, i) => <Cell key={i} fill={STATUS_C[g.status] || T.gray} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Gigafactory Details">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Manufacturer', 'Location', 'Capacity (GWh)', 'Status', 'Chemistry'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GIGAFACTORIES.map((g, i) => (
                  <tr key={g.name} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 700, color: T.navy }}>{g.name}</td>
                    <td style={{ padding: '7px 12px', color: T.gray }}>{g.country}</td>
                    <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{g.gwh.toLocaleString()}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ background: STATUS_C[g.status] || T.gray, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{g.status}</span>
                    </td>
                    <td style={{ padding: '7px 12px', color: T.purple }}>{g.chemistry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Chemistry Comparison' && (
        <>
          <Section title="Battery Chemistry Comparison Matrix">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Chemistry', 'Full Name', 'Energy Density', '2024 Cost', '2030 Est.', 'Cycle Life', 'Safety Score', 'Key Use Case', 'Maturity'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHEMISTRIES.map((c, i) => (
                  <tr key={c.name} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: c.color }}>{c.name}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{c.full}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{c.energy} Wh/kg</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>${c.cost2024}/kWh</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.emerald }}>${c.cost2030}/kWh</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{c.cycle.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 40, height: 5, background: '#e5e0d8', borderRadius: 3 }}>
                          <div style={{ width: `${c.safety}%`, height: 5, background: c.safety > 90 ? T.emerald : c.safety > 75 ? T.teal : T.orange, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{c.safety}</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: T.purple }}>{c.key_use}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: c.maturity === 'Commercial' ? T.emerald : c.maturity === 'Scaling' ? T.teal : T.orange, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{c.maturity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}
    </div>
  );
}
