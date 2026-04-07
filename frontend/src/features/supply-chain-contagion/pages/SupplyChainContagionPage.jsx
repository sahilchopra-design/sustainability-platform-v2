import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Supply Chain Map','Contagion Network Graph','Tier 1/2/3 Exposure','Chokepoint Analysis','Cascade Simulation','Risk Mitigation Strategies'];

const COMPANIES = [
  { name:'AutoCorp Global', sector:'Automotive', t1:8, t2:24, t3:65, hazardZones:3, exposure:85, revImpact:420 },
  { name:'TechParts Inc', sector:'Technology', t1:5, t2:18, t3:42, hazardZones:2, exposure:62, revImpact:180 },
  { name:'GreenEnergy Co', sector:'Renewables', t1:6, t2:15, t3:38, hazardZones:4, exposure:78, revImpact:310 },
  { name:'PharmaChem Ltd', sector:'Pharma', t1:4, t2:12, t3:28, hazardZones:2, exposure:55, revImpact:145 },
  { name:'GlobalRetail PLC', sector:'Retail', t1:12, t2:45, t3:120, hazardZones:5, exposure:92, revImpact:680 },
  { name:'MegaFoods Corp', sector:'Food & Bev', t1:10, t2:35, t3:88, hazardZones:4, exposure:88, revImpact:520 },
  { name:'ConstructBuild AG', sector:'Construction', t1:7, t2:22, t3:55, hazardZones:3, exposure:72, revImpact:280 },
  { name:'AeroSpace Dyn', sector:'Aerospace', t1:6, t2:20, t3:52, hazardZones:3, exposure:68, revImpact:350 },
  { name:'ChemProcess Intl', sector:'Chemicals', t1:5, t2:16, t3:40, hazardZones:3, exposure:65, revImpact:210 },
  { name:'MiningRes Corp', sector:'Mining', t1:4, t2:10, t3:22, hazardZones:5, exposure:82, revImpact:380 },
  { name:'TextileWorks Ltd', sector:'Textiles', t1:8, t2:30, t3:75, hazardZones:4, exposure:80, revImpact:190 },
  { name:'SemiConductor Co', sector:'Semiconductors', t1:3, t2:8, t3:18, hazardZones:2, exposure:95, revImpact:850 },
  { name:'SteelForge PLC', sector:'Steel', t1:5, t2:14, t3:32, hazardZones:3, exposure:70, revImpact:240 },
  { name:'LogiTrans Corp', sector:'Logistics', t1:15, t2:50, t3:130, hazardZones:6, exposure:90, revImpact:560 },
  { name:'AgriGlobal Ltd', sector:'Agriculture', t1:9, t2:28, t3:70, hazardZones:5, exposure:85, revImpact:410 },
];

const CHOKEPOINTS = [
  { name:'Suez Canal', hazard:'Drought/Low Water', prob:0.15, tradeVol:'$9.4T/yr', affectedCo:8, altRoute:'+10 days via Cape', impact:'HIGH', details:'Drought-induced low water levels; Ever Given-type blockage risk' },
  { name:'Malacca Strait', hazard:'Tropical Cyclone', prob:0.08, tradeVol:'$5.3T/yr', affectedCo:6, altRoute:'+5 days via Lombok', impact:'HIGH', details:'40% of global trade; cyclone season June-November' },
  { name:'Panama Canal', hazard:'Drought', prob:0.22, tradeVol:'$3.8T/yr', affectedCo:7, altRoute:'+15 days via Cape Horn', impact:'CRITICAL', details:'2023 drought reduced daily transits from 38 to 24; Gatun Lake levels' },
  { name:'Taiwan Strait', hazard:'Typhoon + Geopolitical', prob:0.12, tradeVol:'$2.5T/yr', affectedCo:5, altRoute:'Limited alternatives', impact:'CRITICAL', details:'90% advanced semiconductors; TSMC concentration risk' },
  { name:'Rhine River', hazard:'Drought/Low Water', prob:0.18, tradeVol:'$1.2T/yr', affectedCo:4, altRoute:'Rail +40% cost', impact:'MEDIUM', details:'2022 drought reduced barge capacity to 25%; chemical/energy transport' },
];

const CASCADE_STEPS = [
  { step:1, event:'Tier 2 supplier (Thailand) — severe flooding', day:0, status:'TRIGGER', lossM:0 },
  { step:2, event:'Auto parts production halted — 3 Thai factories', day:2, status:'SPREADING', lossM:15 },
  { step:3, event:'Tier 1 supplier (Japan) — inventory buffer depleted', day:12, status:'SPREADING', lossM:45 },
  { step:4, event:'OEM assembly line paused — European plant', day:18, status:'IMPACT', lossM:120 },
  { step:5, event:'Delayed vehicle deliveries — 4,200 units', day:25, status:'IMPACT', lossM:280 },
  { step:6, event:'Dealer inventory shortage — revenue impact', day:35, status:'LOSS', lossM:420 },
  { step:7, event:'Alternative supplier qualification + ramp-up', day:60, status:'RECOVERY', lossM:380 },
  { step:8, event:'Full production restored', day:90, status:'RESOLVED', lossM:180 },
];

const MITIGATIONS = [
  { strategy:'Dual-sourcing critical components', cost:'$2-5M/yr', riskReduction:35, timeline:'6-12 months', priority:'HIGH' },
  { strategy:'Strategic inventory buffer (30-day)', cost:'$8-15M capex', riskReduction:25, timeline:'3-6 months', priority:'HIGH' },
  { strategy:'Nearshoring Tier 1 suppliers', cost:'$15-30M capex', riskReduction:40, timeline:'18-24 months', priority:'MEDIUM' },
  { strategy:'Climate-resilient logistics routes', cost:'$1-3M/yr', riskReduction:15, timeline:'3-6 months', priority:'MEDIUM' },
  { strategy:'Supplier climate risk audits', cost:'$0.5-1M/yr', riskReduction:10, timeline:'1-3 months', priority:'LOW' },
  { strategy:'Parametric insurance for disruption', cost:'$2-4M/yr', riskReduction:20, timeline:'1-2 months', priority:'HIGH' },
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
  sevBadge:(s)=>({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700, color:'#fff', background:s==='CRITICAL'?T.red:s==='HIGH'?T.orange:s==='MEDIUM'?T.amber:T.blue }),
  stepBadge:(s)=>({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700, color:'#fff', background:s==='TRIGGER'?T.red:s==='SPREADING'?T.orange:s==='IMPACT'?T.amber:s==='LOSS'?T.purple:s==='RECOVERY'?T.blue:T.green }),
  node:{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', fontSize:11, fontWeight:700, color:'#fff', margin:2 },
};

export default function SupplyChainContagionPage() {
  const [tab, setTab] = useState(0);
  const [selectedCo, setSelectedCo] = useState(0);
  const [cascadeSpeed, setCascadeSpeed] = useState(1.0);
  const [watchlist, setWatchlist] = useState(new Set(['SemiConductor Co','GlobalRetail PLC','LogiTrans Corp']));

  const toggleWatch = (n) => setWatchlist(p => { const ns = new Set(p); ns.has(n) ? ns.delete(n) : ns.add(n); return ns; });
  const co = COMPANIES[selectedCo];

  const tierData = COMPANIES.map(c => ({ name: c.name.length > 14 ? c.name.slice(0, 14) + '..' : c.name, t1: c.t1, t2: c.t2, t3: c.t3 }));

  const networkNodes = COMPANIES.slice(0, 8).map((c, i) => ({
    x: 100 + Math.cos(i * Math.PI / 4) * 200 + sr(i * 37 + 10) * 40,
    y: 150 + Math.sin(i * Math.PI / 4) * 120 + sr(i * 29 + 20) * 40,
    name: c.name.split(' ')[0], exposure: c.exposure, size: c.revImpact / 20,
  }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.badge}>EP-CG3</span>
            <h1 style={s.title}>Supply Chain Climate Contagion</h1>
          </div>
          <p style={s.subtitle}>Tier 1/2/3 cascade modelling | 15 portfolio companies | 5 global chokepoints</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select style={s.select} value={selectedCo} onChange={e => setSelectedCo(+e.target.value)}>
            {COMPANIES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
          </select>
          <button style={s.btn(T.gold)} onClick={() => alert('Supply chain report exported')}>Export Report</button>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {tab === 0 && (<div>
        <div style={{ ...s.grid3, marginBottom:16 }}>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.navy }}>15</div><div style={s.kpiLbl}>Portfolio Companies</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.red }}>{COMPANIES.reduce((s, c) => s + c.t1 + c.t2 + c.t3, 0)}</div><div style={s.kpiLbl}>Total Suppliers (T1/T2/T3)</div></div>
          <div style={s.kpi}><div style={{ ...s.kpiVal, color:T.amber }}>${(COMPANIES.reduce((s, c) => s + c.revImpact, 0) / 1000).toFixed(1)}B</div><div style={s.kpiLbl}>Total Revenue at Risk</div></div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Portfolio Supply Chain Exposure Overview</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Company</th><th style={s.th}>Sector</th><th style={s.th}>T1</th><th style={s.th}>T2</th><th style={s.th}>T3</th><th style={s.th}>Hazard Zones</th><th style={s.th}>Exposure</th><th style={s.th}>Rev Impact ($M)</th><th style={s.th}>Watch</th></tr></thead>
            <tbody>{COMPANIES.map((c, i) => (
              <tr key={i} style={{ background: c.exposure > 85 ? '#fef2f2' : 'transparent' }}>
                <td style={{ ...s.td, fontWeight:600 }}>{c.name}</td>
                <td style={s.td}>{c.sector}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{c.t1}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{c.t2}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{c.t3}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{c.hazardZones}</td>
                <td style={{ ...s.td, fontFamily:T.mono, fontWeight:700, color: c.exposure > 85 ? T.red : T.navy }}>{c.exposure}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>${c.revImpact}M</td>
                <td style={s.td}><button style={s.btn(watchlist.has(c.name)?T.gold:T.textMut)} onClick={() => toggleWatch(c.name)}>{watchlist.has(c.name)?'★':'☆'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Exposure vs Revenue Impact</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="exposure" name="Exposure Score" tick={{ fontSize:11 }} label={{ value:'Exposure Score', position:'bottom', fontSize:11 }} />
              <YAxis dataKey="revImpact" name="Revenue Impact" tick={{ fontSize:11 }} label={{ value:'Revenue Impact ($M)', angle:-90, position:'insideLeft', fontSize:11 }} />
              <Tooltip content={({ payload }) => payload?.[0] ? (
                <div style={{ background:'#fff', border:`1px solid ${T.border}`, padding:8, borderRadius:6, fontSize:12 }}>
                  <div style={{ fontWeight:700 }}>{payload[0].payload.name}</div>
                  <div>Exposure: {payload[0].payload.exposure} | Impact: ${payload[0].payload.revImpact}M</div>
                </div>
              ) : null} />
              <Scatter data={COMPANIES} fill={T.navy}>
                {COMPANIES.map((c, i) => <Cell key={i} fill={c.exposure > 85 ? T.red : c.exposure > 70 ? T.orange : T.blue} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={s.ref}><strong>References:</strong> INFORM Risk Index (2024); EM-DAT International Disaster Database; World Economic Forum Global Risks Report 2024; McKinsey Global Institute supply chain analysis.</div>
      </div>)}

      {tab === 1 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Contagion Network — Node Size = Revenue Impact, Color = Exposure Level</div>
          <div style={{ background:T.bg, borderRadius:8, padding:20, minHeight:300, position:'relative' }}>
            {networkNodes.map((n, i) => (
              <div key={i} style={{ position:'absolute', left: n.x, top: n.y, ...s.node, width: 30 + n.size / 2, height: 30 + n.size / 2, background: n.exposure > 85 ? T.red : n.exposure > 70 ? T.orange : T.blue, fontSize: 9 }}>{n.name}</div>
            ))}
            <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              {networkNodes.slice(0, -1).map((n, i) => (
                <line key={i} x1={n.x + 20} y1={n.y + 20} x2={networkNodes[i + 1].x + 20} y2={networkNodes[i + 1].y + 20} stroke={T.border} strokeWidth={1} strokeDasharray="4 4" />
              ))}
            </svg>
          </div>
          <p style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Node-link representation. Red = critical exposure (&gt;85), Orange = high (&gt;70), Blue = moderate. Line thickness indicates trade volume.</p>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Network Centrality — Contagion Potential</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={COMPANIES.slice(0, 10).sort((a, b) => b.exposure - a.exposure).map(c => ({ name: c.name.split(' ')[0], centrality: c.exposure * 0.6 + (c.t1 + c.t2) * 0.1, exposure: c.exposure }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="centrality" name="Contagion Centrality" fill={T.navy}>
                {COMPANIES.slice(0, 10).map((c, i) => <Cell key={i} fill={c.exposure > 85 ? T.red : T.blue} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {tab === 2 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Tier 1 / 2 / 3 Supplier Distribution</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={tierData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:9 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip />
              <Bar dataKey="t1" stackId="a" fill={T.red} name="Tier 1" />
              <Bar dataKey="t2" stackId="a" fill={T.orange} name="Tier 2" />
              <Bar dataKey="t3" stackId="a" fill={T.amber} name="Tier 3" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Selected: {co.name}</div>
            <div style={{ ...s.grid3, marginBottom:12 }}>
              <div style={s.kpi}><div style={{ ...s.kpiVal, fontSize:20, color:T.red }}>{co.t1}</div><div style={s.kpiLbl}>Tier 1</div></div>
              <div style={s.kpi}><div style={{ ...s.kpiVal, fontSize:20, color:T.orange }}>{co.t2}</div><div style={s.kpiLbl}>Tier 2</div></div>
              <div style={s.kpi}><div style={{ ...s.kpiVal, fontSize:20, color:T.amber }}>{co.t3}</div><div style={s.kpiLbl}>Tier 3</div></div>
            </div>
            <p style={{ fontSize:12, color:T.textSec }}>Exposure Score: <strong style={{ color:T.red }}>{co.exposure}/100</strong> | Hazard Zones: <strong>{co.hazardZones}</strong> | Revenue at Risk: <strong>${co.revImpact}M</strong></p>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Tier Concentration Risk</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={COMPANIES.slice(0, 8).map(c => ({ name: c.name.split(' ')[0], ratio: +((c.t3 / (c.t1 + c.t2 + c.t3)) * 100).toFixed(0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'T3 Concentration %', angle:-90, position:'insideLeft', fontSize:10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="ratio" fill={T.purple} stroke={T.purple} fillOpacity={0.3} name="Tier 3 %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab === 3 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Global Supply Chain Chokepoints</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Chokepoint</th><th style={s.th}>Hazard</th><th style={s.th}>Annual Prob</th><th style={s.th}>Trade Vol</th><th style={s.th}>Co. Affected</th><th style={s.th}>Alt Route</th><th style={s.th}>Impact</th></tr></thead>
            <tbody>{CHOKEPOINTS.map((cp, i) => (
              <tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{cp.name}</td>
                <td style={s.td}>{cp.hazard}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{(cp.prob * 100).toFixed(0)}%</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{cp.tradeVol}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{cp.affectedCo}</td>
                <td style={{ ...s.td, fontSize:11 }}>{cp.altRoute}</td>
                <td style={s.td}><span style={s.sevBadge(cp.impact)}>{cp.impact}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Chokepoint Disruption Probability</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={CHOKEPOINTS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} />
                <YAxis domain={[0, 0.3]} tick={{ fontSize:11 }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <Tooltip formatter={v => `${(v*100).toFixed(1)}%`} />
                <Bar dataKey="prob" name="Annual Disruption Probability">
                  {CHOKEPOINTS.map((cp, i) => <Cell key={i} fill={cp.impact === 'CRITICAL' ? T.red : cp.impact === 'HIGH' ? T.orange : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Chokepoint Details</div>
            {CHOKEPOINTS.map((cp, i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <strong>{cp.name}:</strong> <span style={{ color:T.textSec }}>{cp.details}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.ref}><strong>References:</strong> UNCTAD Review of Maritime Transport (2023); Lloyd's List Intelligence; INFORM Risk Index shipping vulnerability; Climate Central sea-level/coastal analysis.</div>
      </div>)}

      {tab === 4 && (<div>
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={s.cardTitle}>Cascade Simulation: Thailand Flood → Auto Supply Chain</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <label style={{ fontSize:12 }}>Cascade Speed: {cascadeSpeed}x</label>
              <input type="range" min={0.5} max={2.0} step={0.1} value={cascadeSpeed} onChange={e => setCascadeSpeed(+e.target.value)} style={{ width:120, accentColor:T.gold }} />
            </div>
          </div>
          {CASCADE_STEPS.map((cs, i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontFamily:T.mono, fontSize:12, minWidth:50, color:T.textMut }}>Day {Math.round(cs.day / cascadeSpeed)}</span>
              <span style={s.stepBadge(cs.status)}>{cs.status}</span>
              <span style={{ flex:1, fontSize:13 }}>{cs.event}</span>
              <span style={{ fontFamily:T.mono, fontSize:12, color: cs.lossM > 200 ? T.red : T.navy }}>${cs.lossM}M</span>
            </div>
          ))}
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Cumulative Loss Trajectory</div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={CASCADE_STEPS.map(cs => ({ day: Math.round(cs.day / cascadeSpeed), loss: cs.lossM }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fontSize:11 }} label={{ value:'Day', position:'bottom', fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} label={{ value:'Loss ($M)', angle:-90, position:'insideLeft', fontSize:11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="loss" fill={T.red} stroke={T.red} fillOpacity={0.2} name="Cumulative Loss $M" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Loss by Cascade Phase</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { phase:'Trigger', loss:15 }, { phase:'Spreading', loss:45 }, { phase:'Impact', loss:280 }, { phase:'Peak Loss', loss:420 }, { phase:'Recovery', loss:180 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="phase" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="loss" name="Loss ($M)">
                  {[T.amber, T.orange, T.red, T.purple, T.blue].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <button style={s.btn(T.navy)} onClick={() => alert('Cascade alert triggers configured')}>Configure Cascade Alerts</button>
      </div>)}

      {tab === 5 && (<div>
        <div style={s.card}>
          <div style={s.cardTitle}>Risk Mitigation Strategies</div>
          <table style={s.tbl}>
            <thead><tr><th style={s.th}>Strategy</th><th style={s.th}>Est. Cost</th><th style={s.th}>Risk Reduction</th><th style={s.th}>Timeline</th><th style={s.th}>Priority</th></tr></thead>
            <tbody>{MITIGATIONS.map((m, i) => (
              <tr key={i}><td style={{ ...s.td, fontWeight:600 }}>{m.strategy}</td>
                <td style={{ ...s.td, fontFamily:T.mono }}>{m.cost}</td>
                <td style={{ ...s.td, fontFamily:T.mono, color:T.green }}>-{m.riskReduction}%</td>
                <td style={s.td}>{m.timeline}</td>
                <td style={s.td}><span style={s.sevBadge(m.priority)}>{m.priority}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Cost vs Risk Reduction Trade-off</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MITIGATIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="strategy" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="riskReduction" name="Risk Reduction %" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Cumulative Risk Reduction</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={MITIGATIONS.sort((a, b) => b.riskReduction - a.riskReduction).reduce((acc, m, i) => {
                const prev = i > 0 ? acc[i - 1].cumulative : 0;
                acc.push({ name: m.strategy.slice(0, 20), cumulative: Math.min(100, prev + m.riskReduction) });
                return acc;
              }, [])}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize:11 }} />
                <Tooltip />
                <Line type="stepAfter" dataKey="cumulative" stroke={T.green} strokeWidth={2} name="Cumulative Reduction %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.btn(T.navy)} onClick={() => alert('Mitigation plan exported')}>Export Mitigation Plan</button>
          <button style={s.btn(T.gold)} onClick={() => alert('Scenario shared')}>Share Scenario</button>
        </div>
        <div style={s.ref}><strong>References:</strong> World Economic Forum (2024) supply chain resilience; McKinsey Global Institute (2020) risk, resilience and rebalancing in global value chains; OECD (2023) due diligence guidance for responsible supply chains.</div>
      </div>)}
    </div>
  );
}
