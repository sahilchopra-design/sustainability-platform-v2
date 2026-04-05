import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Supply-Demand Balance','Price Spike Scenarios','Substitution Elasticity','Recycling Penetration','Geopolitical Supply Shock','Mining Pipeline'];

const MINERALS = [
  { name:'Lithium', unit:'kt LCE', supply2025:180, demand2025:160, demand2030:380, demand2040:720, chinaShare:65, price2024:12500, priceSpike:42000, substitutionElast:0.3, recycleRate2025:5, recycleRate2035:25, recycleRate2045:45, color:T.blue },
  { name:'Cobalt', unit:'kt', supply2025:210, demand2025:190, demand2030:340, demand2040:510, chinaShare:73, price2024:28000, priceSpike:82000, substitutionElast:0.6, recycleRate2025:10, recycleRate2035:35, recycleRate2045:55, color:T.purple },
  { name:'Nickel', unit:'kt', supply2025:3400, demand2025:3100, demand2030:4800, demand2040:7200, chinaShare:42, price2024:16200, priceSpike:48000, substitutionElast:0.4, recycleRate2025:15, recycleRate2035:30, recycleRate2045:50, color:T.green },
  { name:'Copper', unit:'Mt', supply2025:22, demand2025:25, demand2030:32, demand2040:42, chinaShare:38, price2024:8400, priceSpike:15000, substitutionElast:0.2, recycleRate2025:30, recycleRate2035:38, recycleRate2045:48, color:T.orange },
  { name:'Rare Earths', unit:'kt REO', supply2025:350, demand2025:310, demand2030:480, demand2040:680, chinaShare:87, price2024:65000, priceSpike:180000, substitutionElast:0.15, recycleRate2025:1, recycleRate2035:8, recycleRate2045:20, color:T.red },
  { name:'Graphite', unit:'kt', supply2025:1200, demand2025:1100, demand2030:2200, demand2040:4500, chinaShare:79, price2024:650, priceSpike:2200, substitutionElast:0.35, recycleRate2025:3, recycleRate2035:15, recycleRate2045:35, color:T.navy },
  { name:'Manganese', unit:'kt', supply2025:21000, demand2025:19500, demand2030:26000, demand2040:34000, chinaShare:35, price2024:4800, priceSpike:12000, substitutionElast:0.5, recycleRate2025:20, recycleRate2035:32, recycleRate2045:45, color:T.teal },
  { name:'PGMs', unit:'Moz', supply2025:12, demand2025:11, demand2030:9, demand2040:7, chinaShare:12, price2024:950, priceSpike:2800, substitutionElast:0.45, recycleRate2025:25, recycleRate2035:40, recycleRate2045:60, color:T.amber },
];

const PIPELINE = [
  { project:'Thacker Pass (Li)', country:'USA', mineral:'Lithium', capacity:'40 kt/yr', status:'Under Construction', start:2027, investmentBn:2.3 },
  { project:'Simandou (Fe/Mn)', country:'Guinea', mineral:'Manganese', capacity:'60 Mt/yr', status:'Development', start:2028, investmentBn:15.0 },
  { project:'Kabanga (Ni)', country:'Tanzania', mineral:'Nickel', capacity:'40 kt/yr', status:'Permitting', start:2029, investmentBn:1.7 },
  { project:'Resolution (Cu)', country:'USA', mineral:'Copper', capacity:'500 kt/yr', status:'Stalled', start:2032, investmentBn:6.8 },
  { project:'Kvanefjeld (REE)', country:'Greenland', mineral:'Rare Earths', capacity:'10 kt/yr', status:'Permitting', start:2030, investmentBn:0.8 },
  { project:'Weda Bay (Ni)', country:'Indonesia', mineral:'Nickel', capacity:'120 kt/yr', status:'Operational', start:2025, investmentBn:3.2 },
];

const projections = (m) => [2025,2028,2030,2035,2040].map(yr=>{
  const supply = yr===2025?m.supply2025:Math.round(m.supply2025*(1+0.04*(yr-2025)));
  const demand = yr<=2030?m.demand2025+(m.demand2030-m.demand2025)*((yr-2025)/5):m.demand2030+(m.demand2040-m.demand2030)*((yr-2030)/10);
  return { year:yr, supply, demand:Math.round(demand), gap:Math.round(supply-demand) };
});

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function CriticalMineralConstraintPage(){
  const [tab,setTab]=useState(0);
  const [selectedMineral,setSelectedMineral]=useState(0);
  const [shockPct,setShockPct]=useState(30);

  const mineral = MINERALS[selectedMineral];
  const deficitMinerals = MINERALS.filter(m=>m.demand2030>m.supply2025*1.2).length;
  const avgChinaShare = Math.round(MINERALS.reduce((s,m)=>s+m.chinaShare,0)/MINERALS.length);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CL1" label="Critical Mineral Constraint Modelling" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Critical Mineral Bottleneck Analysis</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>Supply-demand gap projections 2025-2040 for 8 transition-critical minerals</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:T.textSec}}>Mineral:</label>
        <select value={selectedMineral} onChange={e=>setSelectedMineral(+e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{MINERALS.map((m,i)=><option key={i} value={i}>{m.name}</option>)}</select>
        <label style={{fontSize:12,color:T.textSec}}>Supply Shock: <input type="range" min={10} max={80} value={shockPct} onChange={e=>setShockPct(+e.target.value)} style={{width:120}}/> <span style={{fontFamily:T.mono}}>{shockPct}%</span></label>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Minerals Tracked" value={MINERALS.length} sub="transition-critical"/></Card>
        <Card><KPI label="Deficit by 2030" value={deficitMinerals} sub="demand exceeds supply growth" color={T.red}/></Card>
        <Card><KPI label="Avg China Share" value={`${avgChinaShare}%`} sub="processing dominance" color={T.orange}/></Card>
        <Card><KPI label={`${mineral.name} Gap 2030`} value={`${Math.round(mineral.demand2030-mineral.supply2025*1.2)} ${mineral.unit}`} sub="supply deficit" color={T.red}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Supply-Demand Balance: {mineral.name}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={projections(mineral)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="supply" name={`Supply (${mineral.unit})`} fill={T.green}/>
              <Bar dataKey="demand" name={`Demand (${mineral.unit})`} fill={T.red+'88'}/>
              <Line type="monotone" dataKey="gap" name="Gap" stroke={T.navy} strokeWidth={2} strokeDasharray="5 5"/>
              <ReferenceLine y={0} stroke={T.navy}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:12}}>
            {MINERALS.map((m,i)=><div key={i} onClick={()=>setSelectedMineral(i)} style={{padding:8,borderRadius:6,border:`2px solid ${selectedMineral===i?m.color:T.border}`,cursor:'pointer',textAlign:'center',background:selectedMineral===i?m.color+'08':T.surface}}>
              <div style={{fontWeight:700,fontSize:12,color:m.color}}>{m.name}</div>
              <div style={{fontSize:10,color:T.textMut}}>China: {m.chinaShare}%</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Price Spike Scenarios</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={MINERALS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v>=1000?(v/1000).toFixed(0)+'k':v}`}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="price2024" name="Current Price ($/t)" fill={T.green}/>
              <Bar dataKey="priceSpike" name="Spike Scenario ($/t)" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.red+'08',borderRadius:6,fontSize:12,color:T.textSec}}>
            Price spike scenarios model 2-3x baseline based on 2021-2022 lithium/nickel events. Rare earths show highest spike vulnerability due to 87% Chinese processing dominance.
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Substitution Elasticity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MINERALS.sort((a,b)=>a.substitutionElast-b.substitutionElast)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,1]} tick={{fontSize:11}}/><YAxis dataKey="name" type="category" tick={{fontSize:11}} width={100}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
              <Bar dataKey="substitutionElast" name="Elasticity (0-1)">
                {MINERALS.map((m,i)=><Cell key={i} fill={m.substitutionElast<0.25?T.red:m.substitutionElast<0.4?T.orange:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:8,fontSize:12,color:T.textSec}}>Lower elasticity = harder to substitute. Rare earths (0.15) and copper (0.20) have the least substitutable demand profiles.</div>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Recycling Penetration Curves</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={[{year:2025},{year:2030},{year:2035},{year:2040},{year:2045}].map(d=>({...d,...Object.fromEntries(MINERALS.map(m=>[m.name,d.year===2025?m.recycleRate2025:d.year<=2035?m.recycleRate2025+(m.recycleRate2035-m.recycleRate2025)*((d.year-2025)/10):m.recycleRate2035+(m.recycleRate2045-m.recycleRate2035)*((d.year-2035)/10)]))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11}}/><YAxis domain={[0,70]} tick={{fontSize:11}} tickFormatter={v=>`${v}%`}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              {MINERALS.map(m=><Line key={m.name} type="monotone" dataKey={m.name} stroke={m.color} strokeWidth={2} dot={{r:3}}/>)}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Geopolitical Supply Shock: {shockPct}% China Export Control</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={MINERALS.map(m=>({...m,impactPct:Math.round(m.chinaShare*(shockPct/100)),residualSupply:Math.round(m.supply2025*(1-m.chinaShare/100*(shockPct/100)))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="supply2025" name="Normal Supply" fill={T.green}/><Bar dataKey="residualSupply" name="Post-Shock Supply" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {MINERALS.filter(m=>m.chinaShare>60).map((m,i)=><div key={i} style={{padding:8,borderRadius:6,background:T.red+'08',border:`1px solid ${T.red}22`,textAlign:'center'}}>
              <div style={{fontWeight:700,fontSize:12,color:T.red}}>{m.name}</div>
              <div style={{fontSize:10,color:T.textMut}}>China: {m.chinaShare}% | Impact: {Math.round(m.chinaShare*(shockPct/100))}%</div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Mining Pipeline</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Project','Country','Mineral','Capacity','Status','Start Year','Investment ($B)'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{PIPELINE.map((p,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{p.project}</td><td>{p.country}</td><td>{p.mineral}</td><td style={{fontFamily:T.mono,fontSize:11}}>{p.capacity}</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:p.status==='Operational'?T.green+'22':p.status==='Under Construction'?T.blue+'22':p.status==='Stalled'?T.red+'22':T.amber+'22',color:p.status==='Operational'?T.green:p.status==='Under Construction'?T.blue:p.status==='Stalled'?T.red:T.amber}}>{p.status}</span></td>
                <td>{p.start}</td><td>${p.investmentBn}B</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Analysis</button>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Set Price Alerts</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Supply-demand projections based on IEA Critical Minerals Report 2024 and USGS Mineral Commodity Summaries. China processing shares from Benchmark Mineral Intelligence. Substitution elasticity from MIT/NREL technology assessment literature. Recycling penetration curves from IRENA Circular Economy for Renewables.
      </div>
    </div>
  );
}
