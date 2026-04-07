import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Regional Heatmap','Hazard Probability Matrix','GDP Impact Transmission','Sector-Specific Impacts','Labor Productivity Loss','Infrastructure Vulnerability'];
const SSP = ['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'];
const PERILS = ['Tropical Cyclone','River Flood','Coastal Flood','Wildfire','Severe Storm','Drought','Winter Storm','Heat Stress'];

const REGIONS = [
  { name:'South Asia', tropCyc:0.82, rivFlood:0.78, coastFlood:0.75, wildfire:0.35, sevStorm:0.60, drought:0.72, winStorm:0.15, heatStr:0.90, gdpImpact:-4.2, agriLoss:18, laborLoss:12.5 },
  { name:'Southeast Asia', tropCyc:0.88, rivFlood:0.80, coastFlood:0.82, wildfire:0.45, sevStorm:0.55, drought:0.55, winStorm:0.10, heatStr:0.85, gdpImpact:-3.8, agriLoss:15, laborLoss:11.2 },
  { name:'East Africa', tropCyc:0.30, rivFlood:0.65, coastFlood:0.50, wildfire:0.40, sevStorm:0.45, drought:0.88, winStorm:0.05, heatStr:0.82, gdpImpact:-5.1, agriLoss:22, laborLoss:14.0 },
  { name:'West Africa', tropCyc:0.25, rivFlood:0.70, coastFlood:0.55, wildfire:0.35, sevStorm:0.40, drought:0.85, winStorm:0.05, heatStr:0.88, gdpImpact:-4.8, agriLoss:20, laborLoss:13.5 },
  { name:'Caribbean', tropCyc:0.92, rivFlood:0.60, coastFlood:0.88, wildfire:0.20, sevStorm:0.72, drought:0.45, winStorm:0.08, heatStr:0.65, gdpImpact:-6.2, agriLoss:12, laborLoss:8.5 },
  { name:'Central America', tropCyc:0.78, rivFlood:0.68, coastFlood:0.62, wildfire:0.42, sevStorm:0.65, drought:0.70, winStorm:0.12, heatStr:0.72, gdpImpact:-3.5, agriLoss:14, laborLoss:10.2 },
  { name:'Mediterranean', tropCyc:0.10, rivFlood:0.55, coastFlood:0.45, wildfire:0.82, sevStorm:0.48, drought:0.78, winStorm:0.30, heatStr:0.72, gdpImpact:-2.1, agriLoss:11, laborLoss:7.8 },
  { name:'US Gulf Coast', tropCyc:0.85, rivFlood:0.72, coastFlood:0.78, wildfire:0.30, sevStorm:0.82, drought:0.55, winStorm:0.35, heatStr:0.68, gdpImpact:-1.8, agriLoss:8, laborLoss:5.5 },
  { name:'Northern Europe', tropCyc:0.05, rivFlood:0.50, coastFlood:0.42, wildfire:0.15, sevStorm:0.55, drought:0.30, winStorm:0.72, heatStr:0.25, gdpImpact:-0.8, agriLoss:4, laborLoss:2.1 },
  { name:'Australia East', tropCyc:0.65, rivFlood:0.72, coastFlood:0.58, wildfire:0.88, sevStorm:0.62, drought:0.82, winStorm:0.15, heatStr:0.75, gdpImpact:-2.5, agriLoss:13, laborLoss:8.0 },
  { name:'Pacific Islands', tropCyc:0.90, rivFlood:0.45, coastFlood:0.95, wildfire:0.10, sevStorm:0.70, drought:0.40, winStorm:0.05, heatStr:0.55, gdpImpact:-8.5, agriLoss:25, laborLoss:9.5 },
  { name:'Middle East', tropCyc:0.12, rivFlood:0.25, coastFlood:0.35, wildfire:0.18, sevStorm:0.22, drought:0.92, winStorm:0.08, heatStr:0.95, gdpImpact:-3.2, agriLoss:16, laborLoss:15.0 },
  { name:'Southern Africa', tropCyc:0.35, rivFlood:0.60, coastFlood:0.40, wildfire:0.55, sevStorm:0.42, drought:0.80, winStorm:0.10, heatStr:0.72, gdpImpact:-3.8, agriLoss:17, laborLoss:11.0 },
  { name:'South America', tropCyc:0.15, rivFlood:0.75, coastFlood:0.40, wildfire:0.65, sevStorm:0.50, drought:0.62, winStorm:0.12, heatStr:0.60, gdpImpact:-2.2, agriLoss:10, laborLoss:7.5 },
  { name:'Northeast US', tropCyc:0.45, rivFlood:0.65, coastFlood:0.58, wildfire:0.12, sevStorm:0.68, drought:0.25, winStorm:0.82, heatStr:0.38, gdpImpact:-0.9, agriLoss:3, laborLoss:2.8 },
  { name:'Central Asia', tropCyc:0.02, rivFlood:0.40, coastFlood:0.10, wildfire:0.30, sevStorm:0.35, drought:0.78, winStorm:0.55, heatStr:0.65, gdpImpact:-2.8, agriLoss:14, laborLoss:9.2 },
  { name:'Japan/Korea', tropCyc:0.75, rivFlood:0.68, coastFlood:0.60, wildfire:0.15, sevStorm:0.58, drought:0.30, winStorm:0.50, heatStr:0.52, gdpImpact:-1.5, agriLoss:6, laborLoss:4.5 },
  { name:'West Coast US', tropCyc:0.08, rivFlood:0.45, coastFlood:0.48, wildfire:0.90, sevStorm:0.35, drought:0.75, winStorm:0.18, heatStr:0.55, gdpImpact:-1.6, agriLoss:9, laborLoss:5.0 },
  { name:'China Coast', tropCyc:0.80, rivFlood:0.85, coastFlood:0.72, wildfire:0.20, sevStorm:0.55, drought:0.50, winStorm:0.35, heatStr:0.62, gdpImpact:-2.0, agriLoss:8, laborLoss:6.5 },
  { name:'Arctic/Sub-Arctic', tropCyc:0.02, rivFlood:0.35, coastFlood:0.55, wildfire:0.42, sevStorm:0.30, drought:0.15, winStorm:0.68, heatStr:0.08, gdpImpact:-1.2, agriLoss:2, laborLoss:1.5 },
];

const s = {
  page:{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.navy },
  header:{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' },
  badge:{ background:T.navy, color:'#fff', padding:'4px 12px', borderRadius:4, fontFamily:T.mono, fontSize:13, marginRight:12 },
  title:{ fontSize:22, fontWeight:700, margin:0 },
  subtitle:{ fontSize:13, color:T.textSec, marginTop:2, fontFamily:T.mono },
  tabs:{ display:'flex', gap:4, marginBottom:24, flexWrap:'wrap' },
  tab:(a)=>({ padding:'8px 16px', borderRadius:6, border:`1px solid ${a?T.gold:T.border}`, background:a?T.navy:'#fff', color:a?'#fff':T.textSec, cursor:'pointer', fontSize:13, fontWeight:a?600:400 }),
  card:{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 },
  cardTitle:{ fontSize:15, fontWeight:700, marginBottom:12, color:T.navy },
  grid2:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  grid3:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 },
  kpi:{ textAlign:'center', padding:16, background:T.bg, borderRadius:8, border:`1px solid ${T.border}` },
  kpiVal:{ fontSize:26, fontWeight:700, fontFamily:T.mono },
  kpiLbl:{ fontSize:11, color:T.textSec, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 },
  ref:{ background:'#fef9ee', border:`1px solid ${T.gold}40`, borderRadius:8, padding:14, fontSize:12, color:T.textSec, marginTop:12, lineHeight:1.6 },
  select:{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font },
  btn:(c=T.navy)=>({ padding:'7px 16px', borderRadius:6, border:'none', background:c, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }),
  tbl:{ width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:{ textAlign:'left', padding:'6px 8px', borderBottom:`2px solid ${T.border}`, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:0.4, color:T.textSec },
  td:{ padding:'6px 8px', borderBottom:`1px solid ${T.border}` },
  heatCell:(v)=>({ padding:'6px 8px', borderBottom:`1px solid ${T.border}`, background: v>0.8?'#fecaca': v>0.6?'#fed7aa': v>0.4?'#fef08a': v>0.2?'#bbf7d0':'#dcfce7', fontFamily:T.mono, fontSize:11, textAlign:'center', fontWeight:600 }),
};

export default function RegionalClimateImpactPage() {
  const [tab, setTab] = useState(0);
  const [ssp, setSsp] = useState(1);
  const [sortBy, setSortBy] = useState('gdpImpact');
  const [compare, setCompare] = useState([0, 1]);
  const [alertRegions, setAlertRegions] = useState(new Set(['South Asia','Caribbean','Pacific Islands']));

  const sspMult = [0.6, 1.0, 1.4, 1.8][ssp];
  const regionsAdj = useMemo(() => REGIONS.map(r => ({
    ...r,
    gdpImpact: +(r.gdpImpact * sspMult).toFixed(1),
    agriLoss: +(r.agriLoss * sspMult).toFixed(1),
    laborLoss: +(r.laborLoss * sspMult).toFixed(1),
    avgHazard: +((r.tropCyc + r.rivFlood + r.coastFlood + r.wildfire + r.sevStorm + r.drought + r.winStorm + r.heatStr) / 8).toFixed(2),
  })), [ssp]);

  const sorted = useMemo(() => [...regionsAdj].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a[sortBy] - b[sortBy]), [regionsAdj, sortBy]);
  const top10Gdp = [...regionsAdj].sort((a, b) => a.gdpImpact - b.gdpImpact).slice(0, 10);

  const toggleAlert = (n) => setAlertRegions(p => { const s = new Set(p); s.has(n) ? s.delete(n) : s.add(n); return s; });

  const gdpTransmission = [
    { channel:'Direct Asset Damage', share:35 },
    { channel:'Supply Chain Disruption', share:25 },
    { channel:'Insurance Gap / Uninsured', share:18 },
    { channel:'Fiscal Cost (Govt)', share:12 },
    { channel:'Productivity Loss', share:10 },
  ];

  const sectorImpacts = [
    { sector:'Agriculture', metric:'Yield Loss %', SA:18*sspMult, SEA:15*sspMult, EA:22*sspMult, MED:11*sspMult },
    { sector:'Hydro Power', metric:'Output Reduction %', SA:12*sspMult, SEA:8*sspMult, EA:15*sspMult, MED:18*sspMult },
    { sector:'Tourism', metric:'Revenue Impact %', SA:8*sspMult, SEA:12*sspMult, EA:6*sspMult, MED:15*sspMult },
    { sector:'Construction', metric:'Disruption Days', SA:45*sspMult, SEA:38*sspMult, EA:32*sspMult, MED:22*sspMult },
    { sector:'Manufacturing', metric:'Output Loss %', SA:6*sspMult, SEA:8*sspMult, EA:4*sspMult, MED:3*sspMult },
  ];

  const laborData = regionsAdj.slice(0, 12).map(r => ({ name: r.name.length > 12 ? r.name.slice(0, 12) + '..' : r.name, loss: r.laborLoss }));

  const infraData = [
    { type:'Roads & Bridges', exposure:78, criticality:85, adaptGap:62 },
    { type:'Power Grid', exposure:82, criticality:95, adaptGap:55 },
    { type:'Water Systems', exposure:88, criticality:90, adaptGap:70 },
    { type:'Ports', exposure:75, criticality:80, adaptGap:48 },
    { type:'Telecom', exposure:55, criticality:72, adaptGap:35 },
    { type:'Hospitals', exposure:65, criticality:98, adaptGap:58 },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.badge}>EP-CG2</span>
            <h1 style={s.title}>Regional Climate Impact Engine</h1>
          </div>
          <p style={s.subtitle}>20 regions x 8 perils x 4 SSP scenarios | IPCC AR6 calibration</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select style={s.select} value={ssp} onChange={e => setSsp(+e.target.value)}>
            {SSP.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
          <button style={s.btn(T.gold)} onClick={() => alert('Regional report exported')}>Export Report</button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (<div>
        <div style={{ ...s.grid3, marginBottom:16 }}>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.red }}>{Math.min(...regionsAdj.map(r => r.gdpImpact))}%</div><div style={s.kpiLbl}>Worst GDP Impact</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.navy }}>20</div><div style={s.kpiLbl}>Regions Modelled</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.amber }}>160</div><div style={s.kpiLbl}>Region-Peril Combinations</div></div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Regional Hazard Heatmap ({SSP[ssp]})</div>
          <div style={{ overflowX:'auto' }}>
            <table style={s.tbl}>
              <thead><tr><th style={s.th}>Region</th>{PERILS.map((p, i) => <th key={i} style={{ ...s.th, fontSize:10, textAlign:'center' }}>{p}</th>)}<th style={s.th}>Alert</th></tr></thead>
              <tbody>{sorted.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, fontWeight:600, whiteSpace:'nowrap' }}>{r.name}</td>
                  <td style={s.heatCell(r.tropCyc)}>{(r.tropCyc * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.rivFlood)}>{(r.rivFlood * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.coastFlood)}>{(r.coastFlood * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.wildfire)}>{(r.wildfire * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.sevStorm)}>{(r.sevStorm * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.drought)}>{(r.drought * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.winStorm)}>{(r.winStorm * 100).toFixed(0)}</td>
                  <td style={s.heatCell(r.heatStr)}>{(r.heatStr * 100).toFixed(0)}</td>
                  <td style={s.td}><button style={s.btn(alertRegions.has(r.name)?T.gold:T.textMut)} onClick={() => toggleAlert(r.name)}>{alertRegions.has(r.name)?'ON':'OFF'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <span style={{ fontSize:11, color:T.textMut }}>Sort by:</span>
            {['name','gdpImpact','avgHazard'].map(k => (
              <button key={k} style={s.btn(sortBy===k?T.navy:T.textMut)} onClick={() => setSortBy(k)}>{k === 'name' ? 'Name' : k === 'gdpImpact' ? 'GDP Impact' : 'Avg Hazard'}</button>
            ))}
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Top 10 GDP Impact Regions</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10Gdp} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="gdpImpact" name="GDP Impact %">
                {top10Gdp.map((d, i) => <Cell key={i} fill={d.gdpImpact < -4 ? T.red : d.gdpImpact < -2 ? T.orange : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.ref}><strong>References:</strong> IPCC AR6 WGI Table 12.12 regional climate projections; World Bank Climate Change Portal; Swiss Re sigma catastrophe data; EM-DAT International Disaster Database.</div>
      </div>)}

      {tab === 1 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Hazard Probability Matrix — Top 10 Regions by Risk</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={regionsAdj.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="tropCyc" fill={T.red} name="Tropical Cyclone" />
              <Bar dataKey="drought" fill={T.amber} name="Drought" />
              <Bar dataKey="heatStr" fill={T.orange} name="Heat Stress" />
              <Bar dataKey="coastFlood" fill={T.blue} name="Coastal Flood" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Peril Frequency by SSP</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={SSP.map((n, i) => ({ ssp: n, cyclone: 12 + i * 4, flood: 18 + i * 5, wildfire: 8 + i * 6, drought: 15 + i * 7 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ssp" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="cyclone" fill={T.red} stroke={T.red} fillOpacity={0.2} name="Cyclone events/yr" />
                <Area type="monotone" dataKey="flood" fill={T.blue} stroke={T.blue} fillOpacity={0.2} name="Flood events/yr" />
                <Area type="monotone" dataKey="wildfire" fill={T.orange} stroke={T.orange} fillOpacity={0.2} name="Wildfire events/yr" />
                <Area type="monotone" dataKey="drought" fill={T.amber} stroke={T.amber} fillOpacity={0.2} name="Drought events/yr" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Region Comparison</div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <select style={s.select} value={compare[0]} onChange={e => setCompare([+e.target.value, compare[1]])}>{REGIONS.map((r, i) => <option key={i} value={i}>{r.name}</option>)}</select>
              <span style={{ padding:'6px 0' }}>vs</span>
              <select style={s.select} value={compare[1]} onChange={e => setCompare([compare[0], +e.target.value])}>{REGIONS.map((r, i) => <option key={i} value={i}>{r.name}</option>)}</select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={PERILS.map((p, i) => {
                const keys = ['tropCyc','rivFlood','coastFlood','wildfire','sevStorm','drought','winStorm','heatStr'];
                return { peril: p.slice(0, 10), r1: REGIONS[compare[0]][keys[i]], r2: REGIONS[compare[1]][keys[i]] };
              })}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="peril" tick={{ fontSize:9 }} />
                <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize:9 }} />
                <Radar name={REGIONS[compare[0]].name} dataKey="r1" stroke={T.blue} fill={T.blue} fillOpacity={0.2} />
                <Radar name={REGIONS[compare[1]].name} dataKey="r2" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize:10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 2 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>GDP Impact Transmission Channels</div>
          <div style={s.grid2}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gdpTransmission}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="channel" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'Share of GDP Loss %', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Bar dataKey="share" fill={T.navy}>
                  {gdpTransmission.map((_, i) => <Cell key={i} fill={[T.red, T.orange, T.amber, T.blue, T.purple][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div>
              <div style={{ background:T.bg, padding:16, borderRadius:8, fontFamily:T.mono, fontSize:12, lineHeight:1.8 }}>
                GDP_shock = Direct_loss<br/>
                &nbsp;&nbsp;+ SupplyChain_disruption<br/>
                &nbsp;&nbsp;+ Insurance_gap<br/>
                &nbsp;&nbsp;+ Fiscal_cost<br/>
                &nbsp;&nbsp;+ Productivity_loss<br/><br/>
                Typical amplification: 1.8-2.5x direct loss
              </div>
              <div style={s.ref}><strong>Source:</strong> Hsiang et al. (2017) GDP-temperature relationship; Burke et al. (2015) global nonlinear temperature effects on economic production.</div>
            </div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>GDP Impact by Region ({SSP[ssp]})</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionsAdj.sort((a, b) => a.gdpImpact - b.gdpImpact).slice(0, 15)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:11 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="gdpImpact" name="GDP Impact %">
                {regionsAdj.slice(0, 15).map((d, i) => <Cell key={i} fill={d.gdpImpact < -4 ? T.red : d.gdpImpact < -2 ? T.orange : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {tab === 3 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Sector-Specific Climate Impacts ({SSP[ssp]})</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Sector</th><th style={s.th}>Metric</th><th style={s.th}>South Asia</th><th style={s.th}>SE Asia</th><th style={s.th}>East Africa</th><th style={s.th}>Mediterranean</th></tr></thead>
            <tbody>{sectorImpacts.map((d, i) => (
              <tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{d.sector}</td><td style={s.td}>{d.metric}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: d.SA > 15 ? T.red : T.navy }}>{d.SA.toFixed(1)}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: d.SEA > 15 ? T.red : T.navy }}>{d.SEA.toFixed(1)}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: d.EA > 15 ? T.red : T.navy }}>{d.EA.toFixed(1)}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color: d.MED > 15 ? T.red : T.navy }}>{d.MED.toFixed(1)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Agriculture Yield Loss by Region</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionsAdj.sort((a, b) => b.agriLoss - a.agriLoss).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="agriLoss" name="Yield Loss %" fill={T.sage}>
                  {regionsAdj.slice(0, 10).map((d, i) => <Cell key={i} fill={d.agriLoss > 18 ? T.red : d.agriLoss > 12 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Tourism Revenue Impact</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={Array.from({ length: 6 }, (_, i) => ({ year: 2025 + i * 5, caribbean: -2 - i * 2.5 * sspMult, seAsia: -1.5 - i * 2 * sspMult, med: -1 - i * 1.8 * sspMult, pacific: -3 - i * 3 * sspMult }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="caribbean" stroke={T.red} name="Caribbean" strokeWidth={2} />
                <Line type="monotone" dataKey="seAsia" stroke={T.blue} name="SE Asia" strokeWidth={2} />
                <Line type="monotone" dataKey="med" stroke={T.orange} name="Mediterranean" strokeWidth={2} />
                <Line type="monotone" dataKey="pacific" stroke={T.purple} name="Pacific Islands" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.ref}><strong>References:</strong> FAO crop yield projections under climate scenarios; IEA hydropower sensitivity analysis; UNWTO climate-tourism studies; IPCC AR6 WGII sector-specific impacts.</div>
      </div>)}

      {tab === 4 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Labor Productivity Loss — WBGT Threshold Analysis ({SSP[ssp]})</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={laborData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Productivity Loss %', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="loss" name="Productivity Loss %">
                {laborData.map((d, i) => <Cell key={i} fill={d.loss > 12 ? T.red : d.loss > 8 ? T.orange : d.loss > 4 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>WBGT Threshold Exceedance Days/Year</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={Array.from({ length: 6 }, (_, i) => ({ year: 2025 + i * 5, middleEast: 45 + i * 12 * sspMult, southAsia: 35 + i * 10 * sspMult, westAfrica: 30 + i * 9 * sspMult, seAsia: 28 + i * 8 * sspMult }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="middleEast" fill={T.red} stroke={T.red} fillOpacity={0.2} name="Middle East" />
                <Area type="monotone" dataKey="southAsia" fill={T.orange} stroke={T.orange} fillOpacity={0.2} name="South Asia" />
                <Area type="monotone" dataKey="westAfrica" fill={T.amber} stroke={T.amber} fillOpacity={0.2} name="West Africa" />
                <Area type="monotone" dataKey="seAsia" fill={T.blue} stroke={T.blue} fillOpacity={0.2} name="SE Asia" />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Key Formula</div>
            <div style={{ background:T.bg, padding:16, borderRadius:8, fontFamily:T.mono, fontSize:12, lineHeight:2 }}>
              WBGT = 0.7 x T_wet + 0.2 x T_globe + 0.1 x T_dry<br/><br/>
              Productivity_loss = f(WBGT, work_intensity)<br/>
              Heavy labor: 100% loss at WBGT &gt; 32C<br/>
              Light labor: 50% loss at WBGT &gt; 35C<br/><br/>
              Annual GDP loss = Sum[sector_share x hours_lost x wage]
            </div>
            <div style={s.ref}><strong>Source:</strong> ILO (2019) Working on a Warmer Planet; Kjellstrom et al. (2018) heat stress occupational health; Lancet Countdown (2023).</div>
          </div>
        </div>
      </div>)}

      {tab === 5 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Infrastructure Vulnerability Assessment</div>
          <div style={s.grid2}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={infraData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="type" tick={{ fontSize:10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Exposure" dataKey="exposure" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                <Radar name="Criticality" dataKey="criticality" stroke={T.blue} fill={T.blue} fillOpacity={0.15} />
                <Radar name="Adaptation Gap" dataKey="adaptGap" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize:11 }} />
              </RadarChart>
            </ResponsiveContainer>
            <div>
              <table style={s.tbl}>
                <thead><tr><th style={s.th}>Infrastructure</th><th style={s.th}>Exposure</th><th style={s.th}>Criticality</th><th style={s.th}>Adapt Gap</th><th style={s.th}>Priority</th></tr></thead>
                <tbody>{infraData.map((d, i) => {
                  const priority = d.exposure * 0.3 + d.criticality * 0.4 + d.adaptGap * 0.3;
                  return (<tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{d.type}</td>
                    <td style={{ ...s.td, fontFamily:T.mono }}>{d.exposure}</td>
                    <td style={{ ...s.td, fontFamily:T.mono }}>{d.criticality}</td>
                    <td style={{ ...s.td, fontFamily:T.mono }}>{d.adaptGap}</td>
                    <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color: priority > 75 ? T.red : T.navy }}>{priority.toFixed(0)}</td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Infrastructure Investment Gap by Region</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionsAdj.slice(0, 10).map(r => ({ name: r.name, investGap: +(Math.abs(r.gdpImpact) * 12 + r.avgHazard * 30).toFixed(0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:11 }} label={{ value:'Investment Gap ($B)', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="investGap" name="Investment Gap ($B)" fill={T.teal} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btn(T.navy)} onClick={() => alert('Infrastructure report exported')}>Export Infrastructure Report</button>
          <button style={s.btn(T.gold)} onClick={() => alert('Custom region builder opened')}>Custom Region Builder</button>
        </div>
        <div style={s.ref}><strong>References:</strong> Global Infrastructure Hub (2021) infrastructure gap analysis; OECD (2022) climate-resilient infrastructure investment; UNEP (2023) Adaptation Gap Report.</div>
      </div>)}
    </div>
  );
}
