import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['H\u2082 Cost Parity Timeline','Electrolyzer Learning Curves','Infrastructure Buildout','Demand by Sector','Export Hub Viability','Investment Opportunity Map'];

const H2_TYPES = [
  { type:'Green H\u2082', desc:'Electrolysis + renewables', color:T.green, cost2024:4.5, cost2030:2.8, cost2040:1.5, cost2050:1.0 },
  { type:'Blue H\u2082', desc:'SMR + CCS', color:T.blue, cost2024:2.0, cost2030:1.8, cost2040:1.6, cost2050:1.5 },
  { type:'Gray H\u2082', desc:'SMR no CCS', color:'#9ca3af', cost2024:1.2, cost2030:1.5, cost2040:2.0, cost2050:2.8 },
];

const costTimeline = [2024,2026,2028,2030,2035,2040,2045,2050].map(yr=>({
  year:yr,
  ...Object.fromEntries(H2_TYPES.map(h=>{
    const t = (yr-2024)/(2050-2024);
    const cost = h.cost2024 + (h.cost2050-h.cost2024)*t + (h.cost2030-h.cost2024-(h.cost2050-h.cost2024)*((2030-2024)/(2050-2024)))*Math.sin(Math.PI*t);
    return [h.type, +Math.max(0.5,cost).toFixed(2)];
  }))
}));

const ELECTROLYZERS = [
  { tech:'Alkaline (AEL)', cost2024:700, cost2030:400, cost2040:250, efficiency:65, lifetime:80000, trl:9, maturity:'Commercial' },
  { tech:'PEM', cost2024:1200, cost2030:600, cost2040:350, efficiency:60, lifetime:60000, trl:8, maturity:'Early Commercial' },
  { tech:'SOEC', cost2024:2500, cost2030:1000, cost2040:500, efficiency:80, lifetime:40000, trl:6, maturity:'Demonstration' },
];

const learningCurve = [2024,2026,2028,2030,2033,2036,2040,2045,2050].map(yr=>({
  year:yr,
  ...Object.fromEntries(ELECTROLYZERS.map(e=>{
    const t=(yr-2024)/(2050-2024);
    return [e.tech, Math.round(e.cost2024*(1-t)+e.cost2040*t*(t>0.6?1:0)+(e.cost2040)*(t<=0.6?t/0.6:0))];
  }))
}));

const INFRA = [
  { item:'Pipeline (km)', needed2030:15000, needed2040:75000, needed2050:200000, costPerUnit:1.5, unit:'$M/km' },
  { item:'Storage (TWh)', needed2030:0.5, needed2040:3.0, needed2050:12.0, costPerUnit:500, unit:'$M/TWh' },
  { item:'Terminals', needed2030:5, needed2040:25, needed2050:80, costPerUnit:800, unit:'$M/unit' },
  { item:'Electrolyzers (GW)', needed2030:100, needed2040:550, needed2050:1500, costPerUnit:600, unit:'$M/GW' },
];

const DEMAND_SECTORS = [
  { sector:'Steel (DRI-H\u2082)', demand2030:8, demand2040:28, demand2050:65, color:T.navy },
  { sector:'Ammonia/Fertilizer', demand2030:12, demand2040:25, demand2050:45, color:T.green },
  { sector:'Transport (Heavy)', demand2030:3, demand2040:18, demand2050:40, color:T.orange },
  { sector:'Power (Turbines)', demand2030:2, demand2040:12, demand2050:35, color:T.purple },
  { sector:'Refining', demand2030:15, demand2040:10, demand2050:5, color:T.amber },
  { sector:'Chemicals', demand2030:5, demand2040:15, demand2050:30, color:T.teal },
];

const EXPORT_HUBS = [
  { hub:'Chile (Atacama)', advantage:'Best solar resource globally', greenCost:1.8, exportCapacity:5, readiness:72 },
  { hub:'Australia (Pilbara)', advantage:'Solar+wind, proximity to Asia', greenCost:2.0, exportCapacity:8, readiness:68 },
  { hub:'Saudi Arabia (NEOM)', advantage:'Low-cost solar, export infra', greenCost:2.2, exportCapacity:4, readiness:65 },
  { hub:'Morocco', advantage:'Solar+wind, proximity to EU', greenCost:2.5, exportCapacity:3, readiness:55 },
  { hub:'Namibia', advantage:'Exceptional wind/solar combo', greenCost:2.3, exportCapacity:2, readiness:40 },
  { hub:'Norway', advantage:'Hydropower, CCS capability', greenCost:3.0, exportCapacity:3, readiness:78 },
];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function HydrogenEconomyModelerPage(){
  const [tab,setTab]=useState(0);
  const [parityYear,setParityYear]=useState(2030);

  const totalDemand2030 = DEMAND_SECTORS.reduce((s,d)=>s+d.demand2030,0);
  const totalDemand2050 = DEMAND_SECTORS.reduce((s,d)=>s+d.demand2050,0);
  const totalInfraInvest = INFRA.reduce((s,inf)=>s+inf.needed2040*inf.costPerUnit,0);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CL3" label="Hydrogen Economy Deep-Dive" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Hydrogen Economy Modeler</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>Green/blue/gray H&#8322; cost curves, electrolyzer learning rates, infrastructure buildout, and demand scenarios</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Green H\u2082 Cost 2024" value="$4.50/kg" sub="vs $1.20 gray"/></Card>
        <Card><KPI label="Parity Year" value="~2032" sub="green vs gray + carbon tax" color={T.green}/></Card>
        <Card><KPI label="2050 Demand" value={`${totalDemand2050} Mt/yr`} sub="clean hydrogen"/></Card>
        <Card><KPI label="Infra Investment" value={`$${(totalInfraInvest/1000).toFixed(0)}B`} sub="needed by 2040" color={T.blue}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>H&#8322; Cost Parity Timeline</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={costTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis domain={[0,5]} tick={{fontSize:11}} label={{value:'$/kg H\u2082',angle:-90,position:'insideLeft'}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              {H2_TYPES.map(h=><Line key={h.type} type="monotone" dataKey={h.type} stroke={h.color} strokeWidth={2.5} dot={{r:3}}/>)}
              <ReferenceLine y={2.0} stroke={T.navy} strokeDasharray="5 5" label={{value:'$2/kg target',fill:T.navy,fontSize:10}}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:12}}>
            {H2_TYPES.map((h,i)=><div key={i} style={{padding:12,borderRadius:6,border:`1px solid ${h.color}33`,background:h.color+'08'}}>
              <div style={{fontWeight:700,color:h.color}}>{h.type}</div>
              <div style={{fontSize:11,color:T.textSec}}>{h.desc}</div>
              <div style={{fontFamily:T.mono,fontSize:13,marginTop:4}}>${h.cost2024} &rarr; ${h.cost2050}/kg</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Electrolyzer Learning Curves</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={learningCurve}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} label={{value:'$/kW',angle:-90,position:'insideLeft'}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              {ELECTROLYZERS.map((e,i)=><Line key={e.tech} type="monotone" dataKey={e.tech} stroke={[T.green,T.blue,T.purple][i]} strokeWidth={2}/>)}
            </LineChart>
          </ResponsiveContainer>
          <div style={{overflowX:'auto',marginTop:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Technology','Cost 2024','Cost 2030','Cost 2040','Efficiency','Lifetime (hrs)','TRL'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec}}>{h}</th>)}</tr></thead>
              <tbody>{ELECTROLYZERS.map((e,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px',fontWeight:600}}>{e.tech}</td><td>${e.cost2024}/kW</td><td>${e.cost2030}/kW</td><td>${e.cost2040}/kW</td>
                <td>{e.efficiency}%</td><td>{e.lifetime.toLocaleString()}</td><td>{e.trl}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Infrastructure Buildout Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={INFRA}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="item" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="needed2030" name="2030" fill={T.amber}/><Bar dataKey="needed2040" name="2040" fill={T.orange}/><Bar dataKey="needed2050" name="2050" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {INFRA.map((inf,i)=><div key={i} style={{padding:10,borderRadius:6,border:`1px solid ${T.border}`,textAlign:'center'}}>
              <div style={{fontWeight:700,fontSize:12,color:T.navy}}>{inf.item}</div>
              <div style={{fontSize:11,color:T.textMut}}>Cost: {inf.costPerUnit} {inf.unit}</div>
              <div style={{fontSize:11,color:T.textSec}}>2040 need: {inf.needed2040.toLocaleString()}</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Demand by Sector (Mt H&#8322;/yr)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[{year:2030,...Object.fromEntries(DEMAND_SECTORS.map(d=>[d.sector,d.demand2030]))},{year:2040,...Object.fromEntries(DEMAND_SECTORS.map(d=>[d.sector,d.demand2040]))},{year:2050,...Object.fromEntries(DEMAND_SECTORS.map(d=>[d.sector,d.demand2050]))}]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              {DEMAND_SECTORS.map(d=><Bar key={d.sector} dataKey={d.sector} stackId="a" fill={d.color}/>)}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Export Hub Viability</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={EXPORT_HUBS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="hub" tick={{fontSize:10}} angle={-10}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar yAxisId="left" dataKey="greenCost" name="Green H\u2082 Cost ($/kg)" fill={T.green}/>
              <Line yAxisId="right" type="monotone" dataKey="readiness" name="Readiness %" stroke={T.purple} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{overflowX:'auto',marginTop:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Hub','Advantage','Cost ($/kg)','Export (Mt/yr)','Readiness'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{EXPORT_HUBS.map((h,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px',fontWeight:600}}>{h.hub}</td><td style={{fontSize:11}}>{h.advantage}</td><td style={{fontFamily:T.mono}}>${h.greenCost}</td>
                <td>{h.exportCapacity} Mt</td><td><div style={{width:50,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:h.readiness>70?T.green:h.readiness>50?T.amber:T.orange,width:`${h.readiness}%`}}/></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Investment Opportunity Map</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[{title:'Electrolyzer Manufacturing',value:'$120B',horizon:'2025-2035',risk:'Medium',return:'12-18% IRR'},{title:'H\u2082 Pipeline Infrastructure',value:'$80B',horizon:'2028-2040',risk:'Low-Medium',return:'8-12% IRR'},{title:'Green Steel (DRI-H\u2082)',value:'$150B',horizon:'2027-2040',risk:'High',return:'15-25% IRR'},{title:'H\u2082 Export Terminals',value:'$45B',horizon:'2028-2035',risk:'Medium',return:'10-15% IRR'},{title:'Ammonia-H\u2082 Shipping',value:'$60B',horizon:'2030-2045',risk:'High',return:'12-20% IRR'},{title:'H\u2082 Storage (Salt Caverns)',value:'$25B',horizon:'2026-2035',risk:'Low',return:'8-11% IRR'}].map((opp,i)=><div key={i} style={{padding:14,borderRadius:8,border:`1px solid ${T.border}`}}>
              <div style={{fontWeight:700,fontSize:14,color:T.navy}}>{opp.title}</div>
              <div style={{fontSize:22,fontFamily:T.mono,fontWeight:700,color:T.green,margin:'8px 0'}}>{opp.value}</div>
              <div style={{fontSize:11,color:T.textSec}}>Horizon: {opp.horizon}</div>
              <div style={{fontSize:11,color:T.textSec}}>Risk: {opp.risk} | Return: {opp.return}</div>
            </div>)}
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Full Report</button>
            <button style={{padding:'8px 16px',background:T.green+'22',color:T.green,border:`1px solid ${T.green}33`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Add to Portfolio</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> H&#8322; cost curves from IRENA Green Hydrogen Cost Reduction (2024) and IEA Global Hydrogen Review 2024. Electrolyzer learning rates based on BNEF Hydrogen Economy Outlook. Infrastructure needs from Hydrogen Council Scaling Up report. Demand projections aligned with IEA NZE scenario.
      </div>
    </div>
  );
}
