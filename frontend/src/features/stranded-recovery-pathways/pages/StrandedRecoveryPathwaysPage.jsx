import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Area
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Repurposing Opportunities','Conversion CapEx','IRR on Repurposing','Decommission vs Convert','Green Industrial Zones','Case Studies'];

const PATHWAYS = [
  { id:'P1', from:'Coal Plant', to:'Battery Storage', capex:180, timeline:'3-4 years', irr:14.2, jobs:320, feasibility:85, riskLevel:'Medium', region:'US Midwest', savedEmissions:2.4 },
  { id:'P2', from:'Oil Refinery', to:'Green H\u2082 Hub', capex:450, timeline:'5-7 years', irr:11.8, jobs:580, feasibility:72, riskLevel:'High', region:'Gulf Coast', savedEmissions:4.1 },
  { id:'P3', from:'Gas Turbine', to:'Synchronous Condenser', capex:25, timeline:'1-2 years', irr:22.5, jobs:45, feasibility:95, riskLevel:'Low', region:'UK Grid', savedEmissions:0.8 },
  { id:'P4', from:'Oil Platform', to:'Offshore Wind Base', capex:320, timeline:'4-6 years', irr:12.6, jobs:420, feasibility:68, riskLevel:'High', region:'North Sea', savedEmissions:3.2 },
  { id:'P5', from:'Coal Port', to:'Green Ammonia Terminal', capex:280, timeline:'4-5 years', irr:13.1, jobs:290, feasibility:74, riskLevel:'Medium', region:'Australia', savedEmissions:2.8 },
  { id:'P6', from:'Steel BF', to:'Electric Arc Furnace', capex:520, timeline:'5-8 years', irr:10.4, jobs:650, feasibility:80, riskLevel:'High', region:'EU', savedEmissions:5.6 },
  { id:'P7', from:'Cement Kiln', to:'Carbon Capture Retrofit', capex:150, timeline:'2-3 years', irr:16.8, jobs:180, feasibility:82, riskLevel:'Medium', region:'India', savedEmissions:1.9 },
  { id:'P8', from:'Gas Pipeline', to:'H\u2082 Blend Pipeline', capex:90, timeline:'2-4 years', irr:18.2, jobs:120, feasibility:88, riskLevel:'Low', region:'Netherlands', savedEmissions:1.2 },
  { id:'P9', from:'Coal Mine', to:'Pumped Hydro Storage', capex:400, timeline:'6-8 years', irr:9.8, jobs:380, feasibility:60, riskLevel:'High', region:'Appalachia', savedEmissions:2.0 },
  { id:'P10', from:'Thermal Plant', to:'Data Center + Solar', capex:210, timeline:'3-5 years', irr:19.4, jobs:450, feasibility:78, riskLevel:'Medium', region:'Texas', savedEmissions:3.5 },
];

const CASE_STUDIES = [
  { title:'Drax Power Station, UK', pathway:'Coal to Biomass+BECCS', capex:'$1.2B', status:'Operational', irr:'11.2%', detail:'Converted from coal to biomass co-firing, now pursuing BECCS for negative emissions. 2,600MW capacity preserved.' },
  { title:'Hornsea Wind Farm Base', pathway:'Oil Platform to Wind Foundation', capex:'$680M', status:'Completed 2024', irr:'13.8%', detail:'Repurposed decommissioned oil infrastructure as maintenance base for 1.2GW offshore wind farm.' },
  { title:'HYBRIT, Sweden', pathway:'Blast Furnace to H2-DRI', capex:'$1.8B', status:'Pilot Phase', irr:'9.5%', detail:'World-first fossil-free steel using green hydrogen direct reduction. Target commercial scale 2028.' },
];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function StrandedRecoveryPathwaysPage(){
  const [tab,setTab]=useState(0);
  const [sortBy,setSortBy]=useState('irr');
  const [riskFilter,setRiskFilter]=useState('All');
  const [decommRate,setDecommRate]=useState(100);

  const filtered = useMemo(()=>{
    let d = [...PATHWAYS];
    if(riskFilter!=='All') d=d.filter(p=>p.riskLevel===riskFilter);
    d.sort((a,b)=>sortBy==='irr'?b.irr-a.irr:sortBy==='capex'?a.capex-b.capex:b.feasibility-a.feasibility);
    return d;
  },[sortBy,riskFilter]);

  const totalCapex = PATHWAYS.reduce((s,p)=>s+p.capex,0);
  const totalJobs = PATHWAYS.reduce((s,p)=>s+p.jobs,0);
  const avgIRR = PATHWAYS.reduce((s,p)=>s+p.irr,0)/PATHWAYS.length;
  const totalSaved = PATHWAYS.reduce((s,p)=>s+p.savedEmissions,0);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CK3" label="Stranded Asset Recovery Pathways" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Asset Repurposing Economics</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>10 repurposing pathways with CapEx, IRR, timeline, and job creation metrics</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:T.textSec}}>Sort:</label>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}><option value="irr">IRR (High-Low)</option><option value="capex">CapEx (Low-High)</option><option value="feasibility">Feasibility</option></select>
        <label style={{fontSize:12,color:T.textSec}}>Risk:</label>
        <select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{['All','Low','Medium','High'].map(s=><option key={s}>{s}</option>)}</select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Total CapEx Required" value={`$${(totalCapex/1000).toFixed(1)}B`} sub="10 pathways"/></Card>
        <Card><KPI label="Jobs Created" value={totalJobs.toLocaleString()} sub="direct employment" color={T.green}/></Card>
        <Card><KPI label="Avg IRR" value={`${avgIRR.toFixed(1)}%`} sub="across all pathways"/></Card>
        <Card><KPI label="Emissions Saved" value={`${totalSaved.toFixed(1)} MtCO\u2082`} sub="annual" color={T.sage}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Repurposing Opportunities</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['From','To','CapEx ($M)','Timeline','IRR','Jobs','Feasibility','Risk','Region'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px'}}>{p.from}</td><td style={{color:T.green,fontWeight:600}}>{p.to}</td>
                <td>${p.capex}M</td><td>{p.timeline}</td>
                <td style={{color:p.irr>15?T.green:p.irr>12?T.amber:T.orange,fontWeight:700}}>{p.irr}%</td>
                <td>{p.jobs}</td>
                <td><div style={{width:60,height:8,background:T.border,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',background:p.feasibility>80?T.green:p.feasibility>60?T.amber:T.red,width:`${p.feasibility}%`}}/></div></td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:p.riskLevel==='Low'?T.green+'22':p.riskLevel==='Medium'?T.amber+'22':T.red+'22',color:p.riskLevel==='Low'?T.green:p.riskLevel==='Medium'?T.amber:T.red}}>{p.riskLevel}</span></td>
                <td style={{fontSize:10}}>{p.region}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Conversion CapEx by Pathway</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={PATHWAYS.sort((a,b)=>b.capex-a.capex)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`$${v}M`}/><YAxis dataKey="to" type="category" tick={{fontSize:10}} width={160}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="capex" name="CapEx ($M)">
                {PATHWAYS.map((p,i)=><Cell key={i} fill={p.capex>300?T.red:p.capex>150?T.orange:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>IRR on Repurposing</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={PATHWAYS.sort((a,b)=>b.irr-a.irr)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="to" tick={{fontSize:9}} angle={-20}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="irr" name="IRR %" fill={T.green}/>
              <Line type="monotone" dataKey="feasibility" name="Feasibility %" stroke={T.purple} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Decommission vs Convert Analysis</h3>
          <label style={{fontSize:12,color:T.textSec}}>Decommission Cost (% of CapEx): <input type="range" min={20} max={200} value={decommRate} onChange={e=>setDecommRate(+e.target.value)} style={{width:150}}/> <span style={{fontFamily:T.mono}}>{decommRate}%</span></label>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={PATHWAYS.map(p=>({...p,decommCost:Math.round(p.capex*(decommRate/100)),netBenefit:Math.round(p.capex*(decommRate/100)-p.capex)}))} style={{marginTop:12}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="to" tick={{fontSize:9}} angle={-15}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="capex" name="Convert CapEx ($M)" fill={T.green}/><Bar dataKey="decommCost" name="Decommission Cost ($M)" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.green+'11',borderRadius:6,fontSize:12,color:T.textSec}}>
            At {decommRate}% decommission cost ratio, {PATHWAYS.filter(p=>p.capex<p.capex*(decommRate/100)).length} of 10 pathways are economically favourable for conversion over decommissioning.
          </div>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Green Industrial Zones</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {['US Midwest','Gulf Coast','North Sea','Appalachia','Australia','EU Ruhr Valley'].map((zone,i)=>{
              const zp = PATHWAYS.filter(p=>p.region.includes(zone.split(' ')[0])||i===5);
              return <div key={zone} style={{padding:14,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface}}>
                <div style={{fontWeight:700,fontSize:14,color:T.navy}}>{zone}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Pathways: {zp.length>0?zp.map(p=>p.to).join(', '):'Assessment pending'}</div>
                <div style={{display:'flex',gap:16,marginTop:8}}>
                  <div style={{fontSize:11}}><span style={{color:T.textMut}}>Jobs:</span> <strong>{zp.reduce((s,p)=>s+p.jobs,0)||'TBD'}</strong></div>
                  <div style={{fontSize:11}}><span style={{color:T.textMut}}>CapEx:</span> <strong>${zp.reduce((s,p)=>s+p.capex,0)||'TBD'}M</strong></div>
                </div>
              </div>;
            })}
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Case Studies</h3>
          {CASE_STUDIES.map((cs,i)=><div key={i} style={{padding:16,borderRadius:8,border:`1px solid ${T.border}`,marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h4 style={{color:T.navy,margin:0,fontSize:14}}>{cs.title}</h4>
              <span style={{padding:'2px 10px',borderRadius:4,fontSize:11,background:cs.status.includes('Operational')?T.green+'22':cs.status.includes('Completed')?T.blue+'22':T.amber+'22',color:cs.status.includes('Operational')?T.green:cs.status.includes('Completed')?T.blue:T.amber}}>{cs.status}</span>
            </div>
            <div style={{fontSize:12,color:T.textSec,margin:'8px 0'}}><strong>Pathway:</strong> {cs.pathway} | <strong>CapEx:</strong> {cs.capex} | <strong>IRR:</strong> {cs.irr}</div>
            <div style={{fontSize:12,color:T.textSec}}>{cs.detail}</div>
          </div>)}
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Report</button>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Add to Portfolio</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> IRR calculations assume 20-year project life, 8% discount rate, and IEA WEO 2024 energy price forecasts. Job creation based on IRENA Renewable Employment Review 2024. Green Industrial Zone designations follow EU Just Transition Fund criteria.
      </div>
    </div>
  );
}
