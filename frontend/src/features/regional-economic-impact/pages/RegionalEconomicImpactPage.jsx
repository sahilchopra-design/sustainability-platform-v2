import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ComposedChart } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Regional Economy Dashboard','Input-Output Model','Fiscal Impact (Lost Royalties)','Diversification Pathways','Migration Dynamics','Inequality Analysis'];

const REGIONS = [
  { name:'Appalachia US', gdp:42, fossilShare:28, directJobs:18500, indirectJobs:32400, inducedJobs:24800, royaltiesLost:1.8, greenTaxBase:0.4, giniNow:0.42, giniProjected:0.47, migrationRate:-2.8, popWorking:68 },
  { name:'Ruhr Valley DE', gdp:118, fossilShare:8, directJobs:12200, indirectJobs:18600, inducedJobs:15100, royaltiesLost:0.6, greenTaxBase:0.5, giniNow:0.31, giniProjected:0.33, migrationRate:-0.8, popWorking:72 },
  { name:'Silesia PL', gdp:38, fossilShare:22, directJobs:42000, indirectJobs:58000, inducedJobs:35000, royaltiesLost:1.2, greenTaxBase:0.3, giniNow:0.34, giniProjected:0.39, migrationRate:-3.5, popWorking:65 },
  { name:'Queensland AU', gdp:95, fossilShare:18, directJobs:28000, indirectJobs:42000, inducedJobs:31000, royaltiesLost:4.2, greenTaxBase:1.1, giniNow:0.33, giniProjected:0.36, migrationRate:-1.5, popWorking:71 },
  { name:'Alberta CA', gdp:210, fossilShare:25, directJobs:65000, indirectJobs:98000, inducedJobs:72000, royaltiesLost:8.5, greenTaxBase:2.1, giniNow:0.35, giniProjected:0.40, migrationRate:-2.2, popWorking:74 },
  { name:'Mpumalanga ZA', gdp:15, fossilShare:42, directJobs:82000, indirectJobs:110000, inducedJobs:95000, royaltiesLost:1.5, greenTaxBase:0.2, giniNow:0.63, giniProjected:0.68, migrationRate:-5.1, popWorking:52 },
  { name:'Shanxi CN', gdp:68, fossilShare:35, directJobs:320000, indirectJobs:480000, inducedJobs:280000, royaltiesLost:3.8, greenTaxBase:1.5, giniNow:0.38, giniProjected:0.42, migrationRate:-3.8, popWorking:62 },
  { name:'Jharkhand IN', gdp:22, fossilShare:38, directJobs:180000, indirectJobs:250000, inducedJobs:150000, royaltiesLost:0.8, greenTaxBase:0.1, giniNow:0.36, giniProjected:0.43, migrationRate:-4.5, popWorking:55 },
  { name:'Kuznetsk RU', gdp:28, fossilShare:45, directJobs:95000, indirectJobs:140000, inducedJobs:85000, royaltiesLost:2.1, greenTaxBase:0.3, giniNow:0.41, giniProjected:0.48, migrationRate:-4.2, popWorking:58 },
  { name:'Yorkshire UK', gdp:82, fossilShare:4, directJobs:3200, indirectJobs:5800, inducedJobs:4200, royaltiesLost:0.2, greenTaxBase:0.3, giniNow:0.33, giniProjected:0.34, migrationRate:-0.3, popWorking:70 },
];

const MULTIPLIER_DATA = [
  { year:2025, direct:-15, indirect:-22, induced:-12 },
  { year:2028, direct:-35, indirect:-48, induced:-28 },
  { year:2030, direct:-55, indirect:-72, induced:-42 },
  { year:2033, direct:-42, indirect:-55, induced:-30 },
  { year:2035, direct:-30, indirect:-38, induced:-18 },
  { year:2038, direct:-15, indirect:-20, induced:-8 },
  { year:2040, direct:-5, indirect:-8, induced:-2 },
];

const DIVERSIFICATION = [
  { pathway:'Renewable Energy', potential:85, readiness:62, timeline:'2025-2032' },
  { pathway:'Advanced Manufacturing', potential:72, readiness:48, timeline:'2026-2035' },
  { pathway:'Tourism & Heritage', potential:55, readiness:35, timeline:'2025-2030' },
  { pathway:'Data Centres', potential:68, readiness:52, timeline:'2025-2028' },
  { pathway:'Green Hydrogen', potential:78, readiness:28, timeline:'2028-2038' },
  { pathway:'Circular Economy', potential:60, readiness:32, timeline:'2026-2033' },
];

const MIGRATION_PROJ = [
  { year:2025, outflow:1.2, inflow:0.3 },
  { year:2027, outflow:2.8, inflow:0.5 },
  { year:2029, outflow:4.5, inflow:0.8 },
  { year:2031, outflow:5.2, inflow:1.2 },
  { year:2033, outflow:4.8, inflow:1.8 },
  { year:2035, outflow:3.5, inflow:2.5 },
  { year:2037, outflow:2.2, inflow:3.0 },
  { year:2040, outflow:1.5, inflow:3.5 },
];

export default function RegionalEconomicImpactPage() {
  const [tab, setTab] = useState(0);
  const [selRegion, setSelRegion] = useState('All');
  const [multiplier, setMultiplier] = useState(1.8);
  const [watchlist, setWatchlist] = useState(false);

  const filtered = useMemo(() => selRegion === 'All' ? REGIONS : REGIONS.filter(r => r.name === selRegion), [selRegion]);

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:150 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  const totalDirect = filtered.reduce((s, r) => s + r.directJobs, 0);
  const totalRoyalties = filtered.reduce((s, r) => s + r.royaltiesLost, 0);

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CO3</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>REGIONAL ECONOMIC IMPACT</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Regional Economic Impact Model</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>I/O multiplier effects, fiscal impact & diversification for fossil-dependent regions</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 4 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      <div style={{ marginBottom:12, display:'flex', gap:12, alignItems:'center' }}>
        <select value={selRegion} onChange={e => setSelRegion(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Direct Fossil Jobs', totalDirect.toLocaleString(), 'At risk of displacement', T.red)}
            {card('Total Royalties at Risk', '$' + totalRoyalties.toFixed(1) + 'B', 'Annual fiscal impact', T.amber)}
            {card('Regions Tracked', filtered.length, 'Fossil-dependent', T.navy)}
            {card('Avg Fossil GDP Share', (filtered.length ? Math.round(filtered.reduce((s, r) => s + r.fossilShare, 0) / filtered.length) : 0) + '%', 'Regional dependency', T.orange)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Fossil GDP Share by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={70} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="fossilShare" fill={T.orange} name="Fossil GDP Share %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ marginBottom:12, display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ fontSize:12, color:T.textSec }}>I/O Multiplier:</label>
            <input type="range" min="1.0" max="3.0" step="0.1" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} />
            <span style={{ fontFamily:T.mono, fontSize:13, color:T.navy }}>{multiplier.toFixed(1)}x</span>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Job Loss Cascade: Direct → Indirect → Induced (000s)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={MULTIPLIER_DATA.map(d => ({ ...d, indirect: Math.round(d.indirect * multiplier / 1.8), induced: Math.round(d.induced * multiplier / 1.8) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="direct" stackId="1" fill={T.red} stroke={T.red} name="Direct" />
                <Area type="monotone" dataKey="indirect" stackId="1" fill={T.orange} stroke={T.orange} name="Indirect (Supply Chain)" />
                <Area type="monotone" dataKey="induced" stackId="1" fill={T.amber} stroke={T.amber} name="Induced (Consumer)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Job Impact by Region (Direct + Indirect + Induced)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Bar dataKey="directJobs" stackId="a" fill={T.red} name="Direct" />
                <Bar dataKey="indirectJobs" stackId="a" fill={T.orange} name="Indirect" />
                <Bar dataKey="inducedJobs" stackId="a" fill={T.amber} name="Induced" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Lost Royalties vs New Green Tax Base ($B)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip formatter={v => '$' + v + 'B'} /><Legend />
                <Bar dataKey="royaltiesLost" fill={T.red} name="Lost Royalties ($B)" />
                <Bar dataKey="greenTaxBase" fill={T.green} name="Green Tax Base ($B)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Fiscal Gap (Royalties Lost - Green Tax)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered.map(r => ({ name:r.name, gap: +(r.royaltiesLost - r.greenTaxBase).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip formatter={v => '$' + v + 'B'} />
                <Bar dataKey="gap" name="Fiscal Gap ($B)">{filtered.map((_, i) => <Cell key={i} fill={T.red} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Diversification Pathways: Potential vs Readiness</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DIVERSIFICATION}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="pathway" tick={{ fontSize:10, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
                <Tooltip /><Legend />
                <Bar dataKey="potential" fill={T.navy} name="Economic Potential" />
                <Bar dataKey="readiness" fill={T.green} name="Implementation Readiness" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {DIVERSIFICATION.map((d, i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{d.pathway}</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, marginTop:4 }}>Potential: {d.potential}/100</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>Readiness: {d.readiness}/100</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, marginTop:4 }}>Timeline: {d.timeline}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Working-Age Population Migration Projection (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={MIGRATION_PROJ}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="outflow" fill={T.red+'30'} stroke={T.red} name="Outflow %" />
                <Area type="monotone" dataKey="inflow" fill={T.green+'30'} stroke={T.green} name="Inflow (Green Jobs) %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Net Migration Rate by Region</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="migrationRate" name="Net Migration %">{filtered.map((r, i) => <Cell key={i} fill={r.migrationRate < -3 ? T.red : r.migrationRate < -1 ? T.amber : T.green} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Gini Coefficient: Current vs Projected Under Transition</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0.2, 0.7]} />
                <Tooltip /><Legend />
                <Bar dataKey="giniNow" fill={T.navy} name="Gini (Current)" />
                <Bar dataKey="giniProjected" fill={T.red} name="Gini (Projected 2035)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Working-Age Population Share (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[40, 80]} />
                <Tooltip />
                <Bar dataKey="popWorking" name="Working-Age %">{filtered.map((r, i) => <Cell key={i} fill={r.popWorking >= 70 ? T.green : r.popWorking >= 60 ? T.amber : T.red} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          World Bank Input-Output Multiplier Tables · OECD Regional Outlook · ILO Just Transition Guidelines · IMF Fiscal Monitor: Climate Crossroads · UN World Inequality Database
        </div>
      </div>
    </div>
  );
}
