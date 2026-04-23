import React, { useState, useMemo } from 'react';
import BuiltEnvironmentAdvancedAnalytics from '../../_shared/BuiltEnvironmentAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area, CartesianGrid, Legend, LineChart, Line,
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

const ASSET_TYPES = ['Bridge','Road Network','Power Grid','Water Treatment','Port','Airport','Dam','Pipeline','Rail','Data Centre'];
const REGIONS     = ['UK','Western Europe','North America','Asia-Pacific','Middle East','Emerging Markets'];
const SCENARIOS   = ['Orderly 1.5°C','Disorderly 2°C','Hot House 3°C+'];
const HAZARDS     = ['Flood','Heat','Storm','Sea Level Rise','Drought'];

const ASSETS = Array.from({ length: 60 }, (_, i) => {
  const type   = ASSET_TYPES[Math.floor(sr(i*7)  * ASSET_TYPES.length)];
  const region = REGIONS[Math.floor(sr(i*11) * REGIONS.length)];
  const assetVal = parseFloat((10 + sr(i*3) * 490).toFixed(1));  // £M
  const age    = Math.round(5 + sr(i*5) * 55);                   // years

  // Hazard exposure scores 0-100
  const flood  = parseFloat((sr(i*13)*100).toFixed(1));
  const heat   = parseFloat((sr(i*17)*100).toFixed(1));
  const storm  = parseFloat((sr(i*19)*100).toFixed(1));
  const slr    = parseFloat((sr(i*23)*100).toFixed(1));
  const drought= parseFloat((sr(i*29)*100).toFixed(1));
  const hazard = parseFloat((flood*0.28+heat*0.22+storm*0.22+slr*0.18+drought*0.10).toFixed(1));

  // Adaptive capacity 0-100 (higher = more resilient)
  const adaptCap= parseFloat((20 + sr(i*31)*70 - age*0.4).toFixed(1));
  const adaptCapClamped = Math.max(5, Math.min(95, adaptCap));

  // Resilience score = 100 - hazard × (1 - adaptCap/100)
  const resilience = parseFloat(Math.max(0, 100 - hazard * (1 - adaptCapClamped/100)).toFixed(1));

  // TCFD scenario losses (% of asset value)
  const loss15 = parseFloat((hazard * 0.0008 + sr(i*37)*0.012).toFixed(4));
  const loss20 = parseFloat((hazard * 0.0018 + sr(i*41)*0.020).toFixed(4));
  const loss30 = parseFloat((hazard * 0.0035 + sr(i*43)*0.035).toFixed(4));

  // Adaptation investment to reach resilience ≥ 70
  const targetResilience = 70;
  const resGap   = Math.max(0, targetResilience - resilience);
  const adaptNeed= parseFloat((assetVal * resGap/100 * 0.12 + sr(i*47)*2).toFixed(1));

  // Climate-adjusted discount rate: WACC + climate spread
  const baseWacc  = parseFloat((5.5 + sr(i*53)*3.0).toFixed(2));
  const climSpread= parseFloat((hazard * 0.02 + sr(i*59)*0.5).toFixed(2));
  const cadr      = parseFloat((baseWacc + climSpread).toFixed(2));

  const band = resilience >= 70 ? 'Resilient' : resilience >= 45 ? 'Vulnerable' : 'Critical';
  return {
    id:i+1, name:`${type.slice(0,5)}-${region.slice(0,3)}-${String.fromCharCode(65+(i%26))}`,
    type, region, assetVal, age, flood, heat, storm, slr, drought, hazard,
    adaptCap:adaptCapClamped, resilience, loss15, loss20, loss30, adaptNeed, baseWacc, climSpread, cadr, band,
  };
});

const TABS = ['Overview','Asset Resilience','Hazard Exposure','TCFD Scenarios','Adaptation Investment','Regulatory Compliance','Asset Detail','Advanced Analytics'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', flex:1, minWidth:140 }}>
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

const bc = b => b==='Critical' ? T.red : b==='Vulnerable' ? T.amber : T.green;

export default function InfrastructureClimateResiliencePage() {
  const [tab,     setTab]     = useState('Overview');
  const [fType,   setFType]   = useState('All');
  const [fRegion, setFRegion] = useState('All');
  const [fBand,   setFBand]   = useState('All');
  const [scenario, setScenario] = useState('Disorderly 2°C');

  const filtered = useMemo(() => ASSETS.filter(a => {
    if (fType   !== 'All' && a.type   !== fType)   return false;
    if (fRegion !== 'All' && a.region !== fRegion) return false;
    if (fBand   !== 'All' && a.band   !== fBand)   return false;
    return true;
  }), [fType, fRegion, fBand]);

  const n             = filtered.length;
  const avgResilience = n ? (filtered.reduce((s,a)=>s+a.resilience,0)/n).toFixed(1) : '0';
  const criticalCount = filtered.filter(a=>a.band==='Critical').length;
  const totalVal      = filtered.reduce((s,a)=>s+a.assetVal,0).toFixed(0);
  const lk            = scenario.includes('1.5') ? 'loss15' : scenario.includes('2°') ? 'loss20' : 'loss30';
  const totalLoss     = filtered.reduce((s,a)=>s+a.assetVal*a[lk],0).toFixed(1);
  const totalAdapt    = filtered.reduce((s,a)=>s+a.adaptNeed,0).toFixed(1);
  const avgCadr       = n ? (filtered.reduce((s,a)=>s+a.cadr,0)/n).toFixed(2) : '0';

  const typeResilience = useMemo(() => ASSET_TYPES.map(t => {
    const a = filtered.filter(x=>x.type===t);
    return { name:t.slice(0,12), Resilience: a.length ? parseFloat((a.reduce((s,x)=>s+x.resilience,0)/a.length).toFixed(1)):0 };
  }), [filtered]);

  const regionResilience = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(x=>x.region===r);
    return { name:r.slice(0,12), Resilience: a.length ? parseFloat((a.reduce((s,x)=>s+x.resilience,0)/a.length).toFixed(1)):0, Count: a.length };
  }), [filtered]);

  const hazardByType = useMemo(() => ASSET_TYPES.map(t => {
    const a = filtered.filter(x=>x.type===t);
    const avg = k => a.length ? parseFloat((a.reduce((s,x)=>s+x[k],0)/a.length).toFixed(1)):0;
    return { name:t.slice(0,8), Flood:avg('flood'), Heat:avg('heat'), Storm:avg('storm'), SLR:avg('slr'), Drought:avg('drought') };
  }), [filtered]);

  const tcfdByType = useMemo(() => ASSET_TYPES.map(t => {
    const a = filtered.filter(x=>x.type===t);
    return { name:t.slice(0,10),
      'Loss 1.5°C £M': parseFloat(a.reduce((s,x)=>s+x.assetVal*x.loss15,0).toFixed(1)),
      'Loss 2°C £M':   parseFloat(a.reduce((s,x)=>s+x.assetVal*x.loss20,0).toFixed(1)),
      'Loss 3°C+ £M':  parseFloat(a.reduce((s,x)=>s+x.assetVal*x.loss30,0).toFixed(1)),
    };
  }), [filtered]);

  const adaptByType = useMemo(() => ASSET_TYPES.map(t => {
    const a = filtered.filter(x=>x.type===t);
    return { name:t.slice(0,10), 'Adapt Need £M': parseFloat(a.reduce((s,x)=>s+x.adaptNeed,0).toFixed(1)) };
  }), [filtered]);

  const lossTimeline = useMemo(() => [2025,2030,2035,2040,2045,2050].map((yr,i)=>({
    year:yr,
    'Orderly 1.5°C £M':  parseFloat(filtered.reduce((s,a)=>s+a.assetVal*a.loss15*Math.pow(1.025,i),0).toFixed(1)),
    'Disorderly 2°C £M': parseFloat(filtered.reduce((s,a)=>s+a.assetVal*a.loss20*Math.pow(1.055,i),0).toFixed(1)),
    'Hot House 3°C+ £M': parseFloat(filtered.reduce((s,a)=>s+a.assetVal*a.loss30*Math.pow(1.10,i),0).toFixed(1)),
  })), [filtered]);

  const radarData = useMemo(() => {
    const avg = k => n ? parseFloat((filtered.reduce((s,a)=>s+a[k],0)/n).toFixed(1)):0;
    return HAZARDS.map(h => ({ hazard:h, 'Portfolio':avg(h.toLowerCase().replace(' ','').replace('sealevelrise','slr')), 'Critical':(() => { const c=filtered.filter(a=>a.band==='Critical'); return c.length ? parseFloat((c.reduce((s,a)=>s+a[h.toLowerCase().replace(' ','').replace('sealevelrise','slr')],0)/c.length).toFixed(1)):0; })() }));
  }, [filtered, n]);

  const regulatoryFrameworks = [
    { fw:'UK National Infrastructure Commission', req:'Resilience Standard — 1-in-200yr design', status:'Mandatory', deadline:'2030' },
    { fw:'TCFD Physical Risk Disclosure',          req:'Scenario analysis for all infrastructure assets', status:'Comply or Explain', deadline:'2026' },
    { fw:'EU Taxonomy Technical Criteria',         req:'DNSH — Climate change adaptation for infra investments', status:'Mandatory for EU funds', deadline:'2026' },
    { fw:'PRA Supervisory Statement SS3/19',       req:'Climate scenario analysis in own risk assessment', status:'Mandatory (banks)', deadline:'Ongoing' },
    { fw:'ISO 14090 Adaptation to Climate Change', req:'Adaptation principles, requirements and guidelines', status:'Voluntary best practice', deadline:'—' },
    { fw:'Infrastructure Resilience Framework',    req:'5 pillars: Absorb, Adapt, Anticipate, Recover, Transform', status:'Guidance', deadline:'—' },
  ];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontSize:11, color:T.gold, fontFamily:T.mono, letterSpacing:2, marginBottom:4 }}>EP-DE4 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Infrastructure Climate Resilience</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
          60 assets · 10 infrastructure types · 5 climate hazards · Resilience scoring · TCFD scenarios · Adaptation investment NPV · CADR
        </div>
      </div>

      <div style={{ background:T.surfaceH, borderBottom:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
        {[['Type',fType,setFType,['All',...ASSET_TYPES]],['Region',fRegion,setFRegion,['All',...REGIONS]],['Band',fBand,setFBand,['All','Resilient','Vulnerable','Critical']]].map(([lbl,val,set,opts])=>(
          <label key={lbl} style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
            {lbl}: <select value={val} onChange={e=>set(e.target.value)} style={{ fontSize:12, padding:'3px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
          TCFD Scenario: <select value={scenario} onChange={e=>setScenario(e.target.value)} style={{ fontSize:12, padding:'3px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
            {SCENARIOS.map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>{n}/{ASSETS.length} assets</span>
      </div>

      <div style={{ display:'flex', gap:14, padding:'20px 32px', flexWrap:'wrap' }}>
        <KpiCard label="Avg Resilience Score" value={`${avgResilience}/100`} sub="composite resilience" color={parseFloat(avgResilience)>=70?T.green:parseFloat(avgResilience)>=45?T.amber:T.red} />
        <KpiCard label="Critical Assets"      value={criticalCount}          sub="resilience <45"       color={T.red} />
        <KpiCard label="Portfolio Value"       value={`£${Number(totalVal).toLocaleString()}M`} sub={`${n} assets`} color={T.navy} />
        <KpiCard label="Climate Loss"          value={`£${totalLoss}M`}      sub={scenario}             color={T.red} />
        <KpiCard label="Adapt Investment Need" value={`£${totalAdapt}M`}     sub="to reach resilience 70" color={T.amber} />
        <KpiCard label="Avg CADR"              value={`${avgCadr}%`}         sub="WACC + climate spread"  color={T.teal} />
      </div>

      <div style={{ display:'flex', gap:0, padding:'0 32px', borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 18px', fontSize:13, fontWeight:tab===t?700:400, background:'none', border:'none', borderBottom:tab===t?`3px solid ${T.gold}`:'3px solid transparent', color:tab===t?T.navy:T.textSec, cursor:'pointer', whiteSpace:'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:'24px 32px' }}>

        {tab==='Overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Resilience Score by Asset Type">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeResilience}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Resilience" fill={T.teal} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Resilience Band Distribution by Type">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ASSET_TYPES.map(t=>{const a=filtered.filter(x=>x.type===t);return{name:t.slice(0,8),Critical:a.filter(x=>x.band==='Critical').length,Vulnerable:a.filter(x=>x.band==='Vulnerable').length,Resilient:a.filter(x=>x.band==='Resilient').length};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Critical"  fill={T.red}   stackId="a" />
                  <Bar dataKey="Vulnerable" fill={T.amber} stackId="a" />
                  <Bar dataKey="Resilient" fill={T.green} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="TCFD Loss by Asset Type (£M)" >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tcfdByType}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Loss 1.5°C £M" fill={T.green} radius={[4,4,0,0]} />
                  <Bar dataKey="Loss 2°C £M"   fill={T.amber} radius={[4,4,0,0]} />
                  <Bar dataKey="Loss 3°C+ £M"  fill={T.red}   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Adaptation Investment Need by Type (£M)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={adaptByType}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Adapt Need £M" fill={T.sage} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Asset Resilience' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Resilience by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionResilience}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Resilience" fill={T.teal} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Hazard Profile — Portfolio vs Critical">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL} /><PolarAngleAxis dataKey="hazard" tick={{fontSize:11}} />
                  <Radar name="Portfolio" dataKey="Portfolio" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  <Radar name="Critical"  dataKey="Critical"  stroke={T.red}  fill={T.red}  fillOpacity={0.2} />
                  <Legend /><Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Critical & Vulnerable Assets" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Asset','Type','Region','Age','Resilience','Band','Hazard','Adapt Cap','Loss(2°C)£M','Adapt Need £M','CADR%'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].filter(a=>a.band!=='Resilient').sort((a,b)=>a.resilience-b.resilience).slice(0,22).map(a=>(
                      <tr key={a.id} style={{ borderBottom:`1px solid ${T.borderL}`, background:a.band==='Critical'?'#fef2f2':'transparent' }}>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, fontSize:10 }}>{a.name}</td>
                        <td style={{ padding:'5px 8px' }}>{a.type}</td>
                        <td style={{ padding:'5px 8px' }}>{a.region}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.age}yr</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, fontWeight:700, color:bc(a.band) }}>{a.resilience}</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:bc(a.band), color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10 }}>{a.band}</span></td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.red }}>{a.hazard}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.amber }}>{a.adaptCap}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.amber }}>{(a.assetVal*a.loss20).toFixed(2)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.teal }}>{a.adaptNeed}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.cadr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Hazard Exposure' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Avg Hazard Scores by Asset Type (0–100)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hazardByType}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Flood"   fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="Heat"    fill={T.red}   radius={[4,4,0,0]} />
                  <Bar dataKey="Storm"   fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar dataKey="SLR"     fill={T.teal}  radius={[4,4,0,0]} />
                  <Bar dataKey="Drought" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Composite Hazard vs Resilience">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeResilience.map((r,i) => ({ ...r, Hazard: ASSET_TYPES[i] ? parseFloat((ASSETS.filter(a=>a.type===ASSET_TYPES[i]).reduce((s,a)=>s+a.hazard,0)/Math.max(1,ASSETS.filter(a=>a.type===ASSET_TYPES[i]).length)).toFixed(1)) : 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Hazard"     fill={T.red}  radius={[4,4,0,0]} />
                  <Bar dataKey="Resilience" fill={T.teal} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='TCFD Scenarios' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="TCFD Loss by Asset Type (£M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tcfdByType}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Loss 1.5°C £M" fill={T.green} radius={[4,4,0,0]} />
                  <Bar dataKey="Loss 2°C £M"   fill={T.amber} radius={[4,4,0,0]} />
                  <Bar dataKey="Loss 3°C+ £M"  fill={T.red}   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Loss Trajectory 2025–2050 (£M)">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={lossTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Area type="monotone" dataKey="Orderly 1.5°C £M"  stroke={T.green} fill={T.green} fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="Disorderly 2°C £M" stroke={T.amber} fill={T.amber} fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="Hot House 3°C+ £M" stroke={T.red}   fill={T.red}   fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Scenario Comparison Summary" span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {[
                  { s:'Orderly 1.5°C',  lk:'loss15', color:T.green },
                  { s:'Disorderly 2°C', lk:'loss20',  color:T.amber },
                  { s:'Hot House 3°C+', lk:'loss30',  color:T.red   },
                ].map(row=>(
                  <div key={row.s} style={{ background:T.surfaceH, borderRadius:6, padding:16, border:`2px solid ${row.color}30` }}>
                    <div style={{ fontSize:14, fontWeight:700, color:row.color, marginBottom:10 }}>{row.s}</div>
                    <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>Portfolio Loss (£M)</div>
                    <div style={{ fontSize:24, fontWeight:700, color:row.color, fontFamily:T.mono }}>{filtered.reduce((s,a)=>s+a.assetVal*a[row.lk],0).toFixed(1)}</div>
                    <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>
                      {filtered.reduce((s,a)=>s+a.assetVal,0)>0?((filtered.reduce((s,a)=>s+a.assetVal*a[row.lk],0)/filtered.reduce((s,a)=>s+a.assetVal,0)*100).toFixed(2)):0}% of portfolio
                    </div>
                    <div style={{ marginTop:10, fontSize:11, color:T.textSec }}>Critical assets: <strong style={{ color:T.red }}>{filtered.filter(a=>a.band==='Critical').length}</strong></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Adaptation Investment' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Adaptation Need by Asset Type (£M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={adaptByType}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Adapt Need £M" fill={T.sage} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="CADR — Climate-Adjusted Discount Rate">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ASSET_TYPES.map(t=>{const a=filtered.filter(x=>x.type===t);return{name:t.slice(0,10),'Base WACC':a.length?parseFloat((a.reduce((s,x)=>s+x.baseWacc,0)/a.length).toFixed(2)):0,'Climate Spread':a.length?parseFloat((a.reduce((s,x)=>s+x.climSpread,0)/a.length).toFixed(2)):0};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Base WACC"      fill={T.navy} stackId="a" />
                  <Bar dataKey="Climate Spread" fill={T.red}  stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Top Priority Adaptation Projects" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Asset','Type','Resilience','Resilience Gap','Adapt Need £M','Loss Avoided (2°C)','ROI%','CADR%'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.adaptNeed-a.adaptNeed).slice(0,18).map(a=>{
                      const gap=Math.max(0,70-a.resilience);
                      const lossAvoided=(a.assetVal*a.loss20-a.assetVal*a.loss15).toFixed(2);
                      const roi=a.adaptNeed>0?((parseFloat(lossAvoided)-a.adaptNeed)/a.adaptNeed*100).toFixed(0):'N/A';
                      return(
                        <tr key={a.id} style={{ borderBottom:`1px solid ${T.borderL}`, background:a.band==='Critical'?'#fef2f2':'transparent' }}>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono, fontSize:10 }}>{a.name}</td>
                          <td style={{ padding:'5px 8px' }}>{a.type}</td>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono, color:bc(a.band), fontWeight:700 }}>{a.resilience}</td>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono, color:gap>20?T.red:T.amber }}>{gap.toFixed(0)}</td>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.teal, fontWeight:700 }}>{a.adaptNeed}</td>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.amber }}>{lossAvoided}</td>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono, color:Number(roi)>0?T.green:T.red }}>{roi}%</td>
                          <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.cadr}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Regulatory Compliance' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:24 }}>
            <Card title="Regulatory Framework Overview">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  { lbl:'Frameworks Applicable', val:regulatoryFrameworks.length, c:T.navy },
                  { lbl:'Mandatory Requirements',  val:regulatoryFrameworks.filter(f=>f.status==='Mandatory').length, c:T.red },
                  { lbl:'Assets Need TCFD Review',  val:filtered.filter(a=>a.assetVal>50).length, c:T.amber },
                  { lbl:'EU Taxonomy Eligible',     val:filtered.filter(a=>a.resilience>=70).length, c:T.green },
                ].map(k=>(
                  <div key={k.lbl} style={{ background:T.surfaceH, borderRadius:6, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:10, color:T.textSec, marginBottom:4 }}>{k.lbl}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:k.c, fontFamily:T.mono }}>{k.val}</div>
                  </div>
                ))}
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:T.surfaceH }}>
                  {['Framework','Requirement','Status','Deadline'].map(h=>(
                    <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {regulatoryFrameworks.map((f,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                      <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy }}>{f.fw}</td>
                      <td style={{ padding:'8px 10px', color:T.textSec, fontSize:11 }}>{f.req}</td>
                      <td style={{ padding:'8px 10px' }}><span style={{ background:f.status==='Mandatory'?T.red:f.status.includes('Mandatory')?T.amber:T.teal, color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11 }}>{f.status}</span></td>
                      <td style={{ padding:'8px 10px', fontFamily:T.mono, color:T.textSec }}>{f.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {tab==='Asset Detail' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:24 }}>
            <Card title="Full Asset Resilience Inventory">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['Asset','Type','Region','Age','Value £M','Hazard','Adapt Cap','Resilience','Band','Loss 1.5°C','Loss 2°C','Loss 3°C+','Adapt Need','CADR%'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>a.resilience-b.resilience).map(a=>(
                      <tr key={a.id} style={{ borderBottom:`1px solid ${T.borderL}`, background:a.band==='Critical'?'#fef2f2':a.band==='Vulnerable'?'#fffbeb':'transparent' }}>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, fontSize:10 }}>{a.name}</td>
                        <td style={{ padding:'5px 8px' }}>{a.type}</td>
                        <td style={{ padding:'5px 8px' }}>{a.region}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.age}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.assetVal}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:a.hazard>=70?T.red:a.hazard>=40?T.amber:T.green }}>{a.hazard}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.adaptCap}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, fontWeight:700, color:bc(a.band) }}>{a.resilience}</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:bc(a.band), color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10 }}>{a.band}</span></td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.green, fontSize:10 }}>{(a.assetVal*a.loss15).toFixed(2)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.amber, fontSize:10 }}>{(a.assetVal*a.loss20).toFixed(2)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.red,   fontSize:10 }}>{(a.assetVal*a.loss30).toFixed(2)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.teal }}>{a.adaptNeed}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{a.cadr}%</td>
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
            <BuiltEnvironmentAdvancedAnalytics T={T} moduleId="DE4" moduleName="Infrastructure Climate Resilience" />
          </div>
        )}

      </div>
    </div>
  );
}
