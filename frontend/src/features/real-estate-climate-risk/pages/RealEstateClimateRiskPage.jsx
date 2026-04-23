import React, { useState, useMemo } from 'react';
import BuiltEnvironmentAdvancedAnalytics from '../../_shared/BuiltEnvironmentAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', surface: '#ffffff', surfaceH: '#f1ede4',
  border: '#e2ded5', borderL: '#ede9e0',
  navy: '#1e3a5f', gold: '#b8860b',
  sage: '#4d7c5f', teal: '#0f766e',
  text: '#1a1a2e', textSec: '#6b7280', textMut: '#9ca3af',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TYPES   = ['Office','Retail','Industrial','Residential','Logistics','Hotel'];
const REGIONS = ['London','South East','North West','Scotland','Midlands','Yorkshire','Wales','South West'];
const NGFS    = ['Orderly 1.5°C','Disorderly 2°C','Hot House 3°C+'];

const ASSETS = Array.from({ length: 80 }, (_, i) => {
  const type   = TYPES[Math.floor(sr(i*7)  * TYPES.length)];
  const region = REGIONS[Math.floor(sr(i*11) * REGIONS.length)];
  const value  = parseFloat((5 + sr(i*3) * 245).toFixed(1));
  const flood    = parseFloat((sr(i*13)*100).toFixed(1));
  const heat     = parseFloat((sr(i*17)*100).toFixed(1));
  const storm    = parseFloat((sr(i*19)*100).toFixed(1));
  const wildfire = parseFloat((sr(i*23)*100).toFixed(1));
  const coastal  = parseFloat((sr(i*29)*100).toFixed(1));
  const composite= parseFloat((flood*0.30+heat*0.25+storm*0.20+wildfire*0.10+coastal*0.15).toFixed(1));
  const floodZone  = flood > 65;
  const coastZone  = coastal > 60;
  const varOrd  = parseFloat((composite*0.0012 + sr(i*31)*0.015).toFixed(4));
  const varDis  = parseFloat((composite*0.0025 + sr(i*33)*0.025).toFixed(4));
  const varHot  = parseFloat((composite*0.0050 + sr(i*37)*0.040).toFixed(4));
  const spread  = Math.round(10 + composite*0.8 + sr(i*41)*50);
  const adaptCx = parseFloat((value*(composite/100)*0.08 + sr(i*43)*0.5).toFixed(2));
  const band    = composite>=70 ? 'High' : composite>=40 ? 'Medium' : 'Low';
  return { id:i+1,
    name:`${type.slice(0,3)}-${region.slice(0,3)}-${String.fromCharCode(65+(i%26))}`,
    type, region, value, flood, heat, storm, wildfire, coastal, composite,
    floodZone, coastZone, varOrd, varDis, varHot, spread, adaptCx, band };
});

const TABS = ['Overview','Physical Hazard','Flood & Storm','Heat Stress','Coastal Risk','NGFS Scenarios','Portfolio VaR','Advanced Analytics'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', flex:1, minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textSec, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>{sub}</div>}
  </div>
);

const Card = ({ title, children, span }) => (
  <div style={{ background:T.surface, borderRadius:8, padding:20, border:`1px solid ${T.border}`, gridColumn:span?'span 2':undefined }}>
    {title && <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:14 }}>{title}</div>}
    {children}
  </div>
);

const bc = b => b==='High' ? T.red : b==='Medium' ? T.amber : T.green;

export default function RealEstateClimateRiskPage() {
  const [tab,       setTab]      = useState('Overview');
  const [fType,     setFType]    = useState('All');
  const [fRegion,   setFRegion]  = useState('All');
  const [fBand,     setFBand]    = useState('All');
  const [scenario,  setScenario] = useState('Disorderly 2°C');

  const filtered = useMemo(() => ASSETS.filter(a => {
    if (fType!=='All'   && a.type!==fType)     return false;
    if (fRegion!=='All' && a.region!==fRegion) return false;
    if (fBand!=='All'   && a.band!==fBand)     return false;
    return true;
  }), [fType, fRegion, fBand]);

  const n          = filtered.length;
  const avgComp    = n ? (filtered.reduce((s,a)=>s+a.composite,0)/n).toFixed(1) : '0';
  const totalVal   = filtered.reduce((s,a)=>s+a.value,0).toFixed(0);
  const highRisk   = filtered.filter(a=>a.band==='High').length;
  const floodCount = filtered.filter(a=>a.floodZone).length;
  const vk         = scenario.includes('1.5') ? 'varOrd' : scenario.includes('2°') ? 'varDis' : 'varHot';
  const totalVaR   = filtered.reduce((s,a)=>s+a.value*a[vk],0).toFixed(1);
  const avgSpread  = n ? Math.round(filtered.reduce((s,a)=>s+a.spread,0)/n) : 0;

  const radarData = useMemo(() => {
    const avg = k => n ? parseFloat((filtered.reduce((s,a)=>s+a[k],0)/n).toFixed(1)) : 0;
    const hrAvg = k => { const hr=filtered.filter(a=>a.band==='High'); return hr.length ? parseFloat((hr.reduce((s,a)=>s+a[k],0)/hr.length).toFixed(1)) : 0; };
    return [
      { hazard:'Flood',   'Portfolio':avg('flood'),   'High-Risk':hrAvg('flood')   },
      { hazard:'Heat',    'Portfolio':avg('heat'),    'High-Risk':hrAvg('heat')    },
      { hazard:'Storm',   'Portfolio':avg('storm'),   'High-Risk':hrAvg('storm')   },
      { hazard:'Wildfire','Portfolio':avg('wildfire'),'High-Risk':hrAvg('wildfire')},
      { hazard:'Coastal', 'Portfolio':avg('coastal'), 'High-Risk':hrAvg('coastal') },
    ];
  }, [filtered, n]);

  const regionRisk = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(x=>x.region===r);
    return { name:r.slice(0,10), Composite: a.length ? parseFloat((a.reduce((s,x)=>s+x.composite,0)/a.length).toFixed(1)):0 };
  }), [filtered]);

  const ngfsVaR = useMemo(() => TYPES.map(t => {
    const a = filtered.filter(x=>x.type===t);
    return { name:t,
      'Orderly 1.5°C':  parseFloat(a.reduce((s,x)=>s+x.value*x.varOrd,0).toFixed(1)),
      'Disorderly 2°C': parseFloat(a.reduce((s,x)=>s+x.value*x.varDis,0).toFixed(1)),
      'Hot House 3°C+': parseFloat(a.reduce((s,x)=>s+x.value*x.varHot,0).toFixed(1)),
    };
  }), [filtered]);

  const hazardByType = useMemo(() => TYPES.map(t => {
    const a = filtered.filter(x=>x.type===t);
    const avg = k => a.length ? parseFloat((a.reduce((s,x)=>s+x[k],0)/a.length).toFixed(1)):0;
    return { name:t, Flood:avg('flood'), Heat:avg('heat'), Storm:avg('storm'), Wildfire:avg('wildfire'), Coastal:avg('coastal') };
  }), [filtered]);

  const varTimeline = useMemo(() => [2025,2030,2035,2040,2045,2050].map((yr,i) => ({
    year: yr,
    'Orderly 1.5°C':  parseFloat(filtered.reduce((s,a)=>s+a.value*a.varOrd *Math.pow(1.03,i),0).toFixed(1)),
    'Disorderly 2°C': parseFloat(filtered.reduce((s,a)=>s+a.value*a.varDis *Math.pow(1.07,i),0).toFixed(1)),
    'Hot House 3°C+': parseFloat(filtered.reduce((s,a)=>s+a.value*a.varHot *Math.pow(1.12,i),0).toFixed(1)),
  })), [filtered]);

  const floodData = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(x=>x.region===r);
    return { name:r.slice(0,8), 'Flood Score': a.length ? parseFloat((a.reduce((s,x)=>s+x.flood,0)/a.length).toFixed(1)):0, 'Flood Zone %': a.length ? parseFloat((a.filter(x=>x.floodZone).length/a.length*100).toFixed(0)):0 };
  }), [filtered]);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontSize:11, color:T.gold, fontFamily:T.mono, letterSpacing:2, marginBottom:4 }}>EP-DE2 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Real Estate Physical Climate Risk</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>80 assets · 5 hazards (Flood/Heat/Storm/Wildfire/Coastal) · NGFS 3-scenario VaR · Risk-adjusted yield spreads · Adaptation capex</div>
      </div>

      <div style={{ background:T.surfaceH, borderBottom:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
        {[['Type',fType,setFType,['All',...TYPES]],['Region',fRegion,setFRegion,['All',...REGIONS]],['Risk Band',fBand,setFBand,['All','High','Medium','Low']]].map(([lbl,val,set,opts]) => (
          <label key={lbl} style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
            {lbl}: <select value={val} onChange={e=>set(e.target.value)} style={{ fontSize:12, padding:'3px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
          Scenario: <select value={scenario} onChange={e=>setScenario(e.target.value)} style={{ fontSize:12, padding:'3px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
            {NGFS.map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>{n}/{ASSETS.length} assets</span>
      </div>

      <div style={{ display:'flex', gap:14, padding:'20px 32px', flexWrap:'wrap' }}>
        <KpiCard label="Avg Composite Risk" value={`${avgComp}/100`} sub="5-hazard weighted score" color={parseFloat(avgComp)>=70?T.red:parseFloat(avgComp)>=40?T.amber:T.green} />
        <KpiCard label="High-Risk Assets"   value={highRisk}         sub="composite ≥70"           color={T.red} />
        <KpiCard label="Flood Zone Assets"  value={floodCount}       sub="flood score >65"          color={T.amber} />
        <KpiCard label="Portfolio Value"    value={`£${Number(totalVal).toLocaleString()}M`} sub={`${n} assets`} color={T.navy} />
        <KpiCard label="Climate VaR"        value={`£${totalVaR}M`} sub={scenario}                 color={T.red} />
        <KpiCard label="Avg Risk Spread"    value={`${avgSpread} bps`} sub="physical risk premium"  color={T.teal} />
      </div>

      <div style={{ display:'flex', gap:0, padding:'0 32px', borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 18px', fontSize:13, fontWeight:tab===t?700:400, background:'none', border:'none', borderBottom:tab===t?`3px solid ${T.gold}`:'3px solid transparent', color:tab===t?T.navy:T.textSec, cursor:'pointer', whiteSpace:'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:'24px 32px' }}>

        {tab==='Overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Composite Risk by Region">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionRisk}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Composite" fill={T.amber} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Hazard Profile — Portfolio vs High-Risk Assets">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL} /><PolarAngleAxis dataKey="hazard" tick={{fontSize:11}} />
                  <Radar name="Portfolio" dataKey="Portfolio" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  <Radar name="High-Risk" dataKey="High-Risk" stroke={T.red}  fill={T.red}  fillOpacity={0.2} />
                  <Legend /><Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Risk Band by Asset Type">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={TYPES.map(t=>{const a=filtered.filter(x=>x.type===t);return{name:t,High:a.filter(x=>x.band==='High').length,Medium:a.filter(x=>x.band==='Medium').length,Low:a.filter(x=>x.band==='Low').length};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="High" fill={T.red} stackId="a" /><Bar dataKey="Medium" fill={T.amber} stackId="a" /><Bar dataKey="Low" fill={T.green} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Adaptation Capex Need by Type (£M)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={TYPES.map(t=>{const a=filtered.filter(x=>x.type===t);return{name:t,'Adapt £M':parseFloat(a.reduce((s,x)=>s+x.adaptCx,0).toFixed(1))};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip />
                  <Bar dataKey="Adapt £M" fill={T.sage} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Physical Hazard' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Avg Hazard Scores by Asset Type (0–100)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hazardByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Flood"    fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="Heat"     fill={T.red}   radius={[4,4,0,0]} />
                  <Bar dataKey="Storm"    fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar dataKey="Wildfire" fill={T.amber} radius={[4,4,0,0]} />
                  <Bar dataKey="Coastal"  fill={T.teal}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Composite Risk Ranking by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...regionRisk].sort((a,b)=>b.Composite-a.Composite)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" domain={[0,100]} tick={{fontSize:11}} /><YAxis dataKey="name" type="category" tick={{fontSize:11}} width={100} /><Tooltip />
                  <Bar dataKey="Composite" fill={T.amber} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Full Asset Risk Inventory" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Asset','Type','Region','Flood','Heat','Storm','Wildfire','Coastal','Composite','Band','Value £M','Spread bps','Adapt £M'].map(h=>(
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontSize:11, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.composite-a.composite).slice(0,25).map(a=>(
                      <tr key={a.id} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11 }}>{a.name}</td>
                        <td style={{ padding:'6px 10px' }}>{a.type}</td>
                        <td style={{ padding:'6px 10px' }}>{a.region}</td>
                        {['flood','heat','storm','wildfire','coastal'].map(k=>(
                          <td key={k} style={{ padding:'6px 10px', fontFamily:T.mono, color:a[k]>=70?T.red:a[k]>=40?T.amber:T.green }}>{a[k]}</td>
                        ))}
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, fontWeight:700, color:bc(a.band) }}>{a.composite}</td>
                        <td style={{ padding:'6px 10px' }}><span style={{ background:bc(a.band), color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11 }}>{a.band}</span></td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{a.value}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.amber }}>{a.spread}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.teal }}>{a.adaptCx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Flood & Storm' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Flood Risk Score & Zone % by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={floodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} />
                  <YAxis yAxisId="l" domain={[0,100]} tick={{fontSize:11}} /><YAxis yAxisId="r" orientation="right" domain={[0,100]} tick={{fontSize:11}} />
                  <Tooltip /><Legend />
                  <Bar yAxisId="l" dataKey="Flood Score"  fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Flood Zone %" fill={T.navy}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Storm Surge Risk by Asset Type">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={TYPES.map(t=>{const a=filtered.filter(x=>x.type===t);return{name:t,'Storm Score':a.length?parseFloat((a.reduce((s,x)=>s+x.storm,0)/a.length).toFixed(1)):0};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip />
                  <Bar dataKey="Storm Score" fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Flood Risk Exposure Summary" span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { lbl:'Flood Zone Assets', val:filtered.filter(a=>a.floodZone).length, sub:`of ${n}`, c:T.red },
                  { lbl:'Flood Zone Value',  val:`£${filtered.filter(a=>a.floodZone).reduce((s,a)=>s+a.value,0).toFixed(0)}M`, sub:'at risk', c:T.red },
                  { lbl:'Avg Flood Score',   val:n ? (filtered.reduce((s,a)=>s+a.flood,0)/n).toFixed(1):0, sub:'0–100', c:T.amber },
                  { lbl:'Flood VaR',         val:`£${filtered.filter(a=>a.floodZone).reduce((s,a)=>s+a.value*a[vk],0).toFixed(1)}M`, sub:scenario, c:T.amber },
                ].map(k=>(
                  <div key={k.lbl} style={{ background:T.surfaceH, borderRadius:6, padding:12, textAlign:'center' }}>
                    <div style={{ fontSize:10, color:T.textSec, marginBottom:4 }}>{k.lbl}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:k.c, fontFamily:T.mono }}>{k.val}</div>
                    <div style={{ fontSize:10, color:T.textMut }}>{k.sub}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Heat Stress' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Heat Stress Score by Asset Type">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={TYPES.map(t=>{const a=filtered.filter(x=>x.type===t);return{name:t,'Heat Score':a.length?parseFloat((a.reduce((s,x)=>s+x.heat,0)/a.length).toFixed(1)):0};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip />
                  <Bar dataKey="Heat Score" fill={T.red} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Heat Stress Score by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={REGIONS.map(r=>{const a=filtered.filter(x=>x.region===r);return{name:r.slice(0,8),'Heat Score':a.length?parseFloat((a.reduce((s,x)=>s+x.heat,0)/a.length).toFixed(1)):0};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip />
                  <Bar dataKey="Heat Score" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Heat Stress Financial Impact Drivers" span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {[
                  { title:'HVAC Cost Uplift', body:'High heat score assets face 15–25% higher cooling opex per 10-point score increase. Operational efficiency degrades linearly.', stat:`${n?(filtered.reduce((s,a)=>s+a.heat,0)/n*0.18).toFixed(0):0}% avg uplift` },
                  { title:'Productivity Loss', body:'Temperature ≥35°C days increase absenteeism 2.3% per °C for logistics & industrial workers per IPCC AR6 assessment.', stat:`${filtered.filter(a=>a.type==='Logistics'||a.type==='Industrial').length} high-risk industrial assets` },
                  { title:'Overheating Compliance', body:'UK Future Homes Standard TM59 compliance for residential. High heat-score assets face mandatory passive cooling upgrades.', stat:`${filtered.filter(a=>a.type==='Residential'&&a.heat>60).length} at-risk residential assets` },
                ].map(item=>(
                  <div key={item.title} style={{ background:T.surfaceH, borderRadius:6, padding:16, border:`1px solid ${T.borderL}` }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:6 }}>{item.title}</div>
                    <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5, marginBottom:10 }}>{item.body}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:T.red, fontFamily:T.mono }}>{item.stat}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Coastal Risk' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Coastal Erosion Score & Zone % by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={REGIONS.map(r=>{const a=filtered.filter(x=>x.region===r);return{name:r.slice(0,8),'Coastal Score':a.length?parseFloat((a.reduce((s,x)=>s+x.coastal,0)/a.length).toFixed(1)):0,'Coast Zone %':a.length?parseFloat((a.filter(x=>x.coastZone).length/a.length*100).toFixed(0)):0};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} />
                  <YAxis yAxisId="l" domain={[0,100]} tick={{fontSize:11}} /><YAxis yAxisId="r" orientation="right" domain={[0,100]} tick={{fontSize:11}} />
                  <Tooltip /><Legend />
                  <Bar yAxisId="l" dataKey="Coastal Score"  fill={T.teal} radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Coast Zone %"   fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Coastal Zone Asset Summary by Region">
              {REGIONS.map(r=>{
                const a=filtered.filter(x=>x.region===r&&x.coastZone);
                const all=filtered.filter(x=>x.region===r);
                const pct=all.length?(a.length/all.length*100).toFixed(0):0;
                return(
                  <div key={r} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.borderL}` }}>
                    <span style={{ fontSize:13, color:T.text }}>{r}</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:T.mono, fontSize:13, color:T.teal, fontWeight:600 }}>{a.length} assets · £{a.reduce((s,x)=>s+x.value,0).toFixed(0)}M</div>
                      <div style={{ fontSize:11, color:T.textMut }}>{pct}% coastal zone</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {tab==='NGFS Scenarios' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="NGFS Scenario VaR by Asset Type (£M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ngfsVaR}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Orderly 1.5°C"  fill={T.green} radius={[4,4,0,0]} />
                  <Bar dataKey="Disorderly 2°C" fill={T.amber} radius={[4,4,0,0]} />
                  <Bar dataKey="Hot House 3°C+" fill={T.red}   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="VaR Trajectory 2025–2050 (£M)">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={varTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Area type="monotone" dataKey="Orderly 1.5°C"  stroke={T.green} fill={T.green} fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="Disorderly 2°C" stroke={T.amber} fill={T.amber} fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="Hot House 3°C+" stroke={T.red}   fill={T.red}   fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="NGFS Scenario Comparison" span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {[
                  { s:'Orderly 1.5°C',  temp:'1.5°C',  phys:'Low',       tran:'High',      color:T.green },
                  { s:'Disorderly 2°C', temp:'2.0°C',  phys:'Moderate',  tran:'Very High', color:T.amber },
                  { s:'Hot House 3°C+', temp:'>3.0°C', phys:'Very High', tran:'Low',       color:T.red   },
                ].map(row=>(
                  <div key={row.s} style={{ background:T.surfaceH, borderRadius:6, padding:16, border:`2px solid ${row.color}30` }}>
                    <div style={{ fontSize:14, fontWeight:700, color:row.color, marginBottom:10 }}>{row.s}</div>
                    {[['Warming',row.temp],['Physical Risk',row.phys],['Transition Risk',row.tran]].map(([k,v])=>(
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
                        <span style={{ color:T.textSec }}>{k}</span><span style={{ color:T.text, fontWeight:600 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:10, padding:'8px 12px', background:`${row.color}18`, borderRadius:4 }}>
                      <div style={{ fontSize:10, color:T.textMut }}>Portfolio VaR</div>
                      <div style={{ fontSize:18, fontWeight:700, color:row.color, fontFamily:T.mono }}>
                        £{filtered.reduce((s,a)=>s+a.value*(row.s.includes('1.5')?a.varOrd:row.s.includes('2°')?a.varDis:a.varHot),0).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Portfolio VaR' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="VaR Trajectory All Scenarios 2025–2050" span>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={varTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Area type="monotone" dataKey="Orderly 1.5°C"  stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Disorderly 2°C" stroke={T.amber} fill={T.amber} fillOpacity={0.15} strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Hot House 3°C+" stroke={T.red}   fill={T.red}   fillOpacity={0.15} strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Top 20 Assets by VaR" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Asset','Type','Region','Band','Value £M','VaR 1.5°C','VaR 2°C','VaR 3°C+','Adapt Capex £M'].map(h=>(
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontSize:11, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.value*b.varDis-a.value*a.varDis).slice(0,20).map(a=>(
                      <tr key={a.id} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, fontSize:11 }}>{a.name}</td>
                        <td style={{ padding:'6px 10px' }}>{a.type}</td>
                        <td style={{ padding:'6px 10px' }}>{a.region}</td>
                        <td style={{ padding:'6px 10px' }}><span style={{ background:bc(a.band), color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11 }}>{a.band}</span></td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono }}>{a.value}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.green }}>{(a.value*a.varOrd).toFixed(2)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.amber }}>{(a.value*a.varDis).toFixed(2)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.red   }}>{(a.value*a.varHot).toFixed(2)}</td>
                        <td style={{ padding:'6px 10px', fontFamily:T.mono, color:T.teal  }}>{a.adaptCx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Advanced Analytics' && (
          <div style={{ padding:'0 0 24px' }}>
            <BuiltEnvironmentAdvancedAnalytics T={T} moduleId="DE2" moduleName="Real Estate Climate Risk" />
          </div>
        )}

      </div>
    </div>
  );
}
