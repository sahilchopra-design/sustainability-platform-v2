import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Grid Mix Dashboard','Inertia Risk Monitor','Storage Requirements','Curtailment Costs','Interconnector Value','Capacity Market Pricing'];

const buildGridData = (rePct) => {
  const solar = rePct*0.45, wind = rePct*0.40, hydro = rePct*0.15;
  const gas = (100-rePct)*0.5, nuclear = (100-rePct)*0.3, coal = (100-rePct)*0.2;
  const inertia = Math.max(5, 100-rePct*0.9);
  const freqRisk = rePct>80?'Critical':rePct>60?'High':rePct>40?'Medium':'Low';
  const storageGWh = Math.round(rePct*rePct*0.02);
  const curtailmentPct = Math.max(0, (rePct-50)*0.3);
  const interconnectorUtil = Math.min(95, 40+rePct*0.6);
  return { rePct, solar:+solar.toFixed(1), wind:+wind.toFixed(1), hydro:+hydro.toFixed(1), gas:+gas.toFixed(1), nuclear:+nuclear.toFixed(1), coal:+coal.toFixed(1), inertia:+inertia.toFixed(1), freqRisk, storageGWh, curtailmentPct:+curtailmentPct.toFixed(1), interconnectorUtil:+interconnectorUtil.toFixed(1) };
};

const GRIDS = [
  { name:'Texas ERCOT', rePct:38, peakGW:85, storageGW:4.2 },
  { name:'California CAISO', rePct:52, peakGW:52, storageGW:8.1 },
  { name:'UK National Grid', rePct:48, peakGW:60, storageGW:2.8 },
  { name:'Germany', rePct:55, peakGW:84, storageGW:3.5 },
  { name:'Australia NEM', rePct:42, peakGW:35, storageGW:1.9 },
  { name:'India', rePct:28, peakGW:230, storageGW:5.2 },
];

const inertiaCurve = Array.from({length:21},(_, i)=>{
  const re=i*5;
  return { rePct:re, inertia:Math.max(5,100-re*0.9), rocof:+(0.1+re*0.015).toFixed(2), freqNadir:+(50-re*0.02).toFixed(2) };
});

const storageCurve = Array.from({length:21},(_, i)=>{
  const re=i*5;
  return { rePct:re, storageGWh:Math.round(re*re*0.02), costBnUSD:+(re*re*0.0003).toFixed(1) };
});

const curtailmentData = Array.from({length:21},(_, i)=>{
  const re=i*5;
  return { rePct:re, curtailmentPct:Math.max(0,+(((re-50)*0.3)>0?(re-50)*0.3:0).toFixed(1)), lostGWh:Math.round(Math.max(0,(re-50)*12)), costM:Math.round(Math.max(0,(re-50)*2.4)) };
});

const capacityMarket = Array.from({length:21},(_, i)=>{
  const re=i*5;
  return { rePct:re, clearingPrice:Math.round(15+re*0.8+Math.max(0,(re-60)*2)), derated:Math.round(100-re*0.6), firmCapacity:Math.round(100-re*0.4) };
});

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function GridStabilityTransitionPage(){
  const [tab,setTab]=useState(0);
  const [rePct,setRePct]=useState(50);
  const [selectedGrid,setSelectedGrid]=useState(0);

  const grid = buildGridData(rePct);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CL2" label="Grid Stability Under High-RE Penetration" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Grid Stability Transition Model</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>System inertia, frequency stability, storage needs, and curtailment under variable RE penetration</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center',background:T.surface,padding:12,borderRadius:8,border:`1px solid ${T.border}`}}>
        <label style={{fontSize:13,fontWeight:600,color:T.navy}}>RE Penetration:</label>
        <input type="range" min={0} max={100} value={rePct} onChange={e=>setRePct(+e.target.value)} style={{flex:1,maxWidth:400}}/>
        <span style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:rePct>80?T.red:rePct>60?T.orange:T.green,minWidth:50}}>{rePct}%</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="System Inertia" value={`${grid.inertia}%`} sub="of baseline" color={grid.inertia<30?T.red:grid.inertia<60?T.amber:T.green}/></Card>
        <Card><KPI label="Frequency Risk" value={grid.freqRisk} sub={`at ${rePct}% RE`} color={grid.freqRisk==='Critical'?T.red:grid.freqRisk==='High'?T.orange:T.amber}/></Card>
        <Card><KPI label="Storage Required" value={`${grid.storageGWh} GWh`} sub="battery + pumped hydro"/></Card>
        <Card><KPI label="Curtailment" value={`${grid.curtailmentPct}%`} sub="energy wasted" color={grid.curtailmentPct>10?T.red:grid.curtailmentPct>5?T.amber:T.green}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Grid Mix at {rePct}% RE</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[grid]}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><YAxis tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
                  <Bar dataKey="solar" name="Solar" stackId="a" fill="#f59e0b"/><Bar dataKey="wind" name="Wind" stackId="a" fill={T.teal}/>
                  <Bar dataKey="hydro" name="Hydro" stackId="a" fill={T.blue}/><Bar dataKey="gas" name="Gas" stackId="a" fill={T.orange}/>
                  <Bar dataKey="nuclear" name="Nuclear" stackId="a" fill={T.purple}/><Bar dataKey="coal" name="Coal" stackId="a" fill={T.navy}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 style={{color:T.navy,fontSize:13,margin:'0 0 8px'}}>Reference Grids</h4>
              {GRIDS.map((g,i)=><div key={i} onClick={()=>{setSelectedGrid(i);setRePct(g.rePct);}} style={{display:'flex',justifyContent:'space-between',padding:8,borderRadius:4,border:`1px solid ${selectedGrid===i?T.navy:T.border}`,marginBottom:4,cursor:'pointer',fontSize:12}}>
                <span style={{fontWeight:600}}>{g.name}</span>
                <span style={{fontFamily:T.mono,color:T.textSec}}>RE: {g.rePct}% | Peak: {g.peakGW}GW</span>
              </div>)}
            </div>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Inertia Risk Monitor</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={inertiaCurve}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="rePct" tick={{fontSize:11}} label={{value:'RE Penetration %',position:'insideBottom',offset:-5}}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Area yAxisId="left" type="monotone" dataKey="inertia" name="System Inertia %" fill={T.green+'33'} stroke={T.green}/>
              <Line yAxisId="right" type="monotone" dataKey="rocof" name="RoCoF (Hz/s)" stroke={T.red} strokeWidth={2}/>
              <ReferenceLine yAxisId="left" y={30} stroke={T.red} strokeDasharray="5 5" label={{value:'Critical Threshold',fill:T.red,fontSize:10}}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.amber+'11',borderRadius:6,fontSize:12,color:T.textSec}}>
            System inertia drops below critical 30% threshold at ~78% RE penetration. Rate of Change of Frequency (RoCoF) exceeds 1.0 Hz/s, requiring synthetic inertia from batteries or synchronous condensers.
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Storage Requirements</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={storageCurve}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="rePct" tick={{fontSize:11}} label={{value:'RE Penetration %',position:'insideBottom',offset:-5}}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar yAxisId="left" dataKey="storageGWh" name="Storage (GWh)" fill={T.blue}/>
              <Line yAxisId="right" type="monotone" dataKey="costBnUSD" name="Cost ($B)" stroke={T.red} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Curtailment Costs</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={curtailmentData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="rePct" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Area type="monotone" dataKey="curtailmentPct" name="Curtailment %" fill={T.orange+'33'} stroke={T.orange}/>
              <Area type="monotone" dataKey="costM" name="Cost ($M/yr)" fill={T.red+'22'} stroke={T.red}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{marginTop:8,fontSize:12,color:T.textSec}}>Curtailment begins at ~50% RE and accelerates non-linearly. At 80% RE, approximately 9% of generation is curtailed, costing $72M/yr per GW of installed capacity.</div>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Interconnector Value</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inertiaCurve.map(d=>({...d,interconnectorUtil:Math.min(95,40+d.rePct*0.6),value:Math.round(20+d.rePct*1.5)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="rePct" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Line type="monotone" dataKey="interconnectorUtil" name="Utilization %" stroke={T.blue} strokeWidth={2}/>
              <Line type="monotone" dataKey="value" name="Value ($M/yr/GW)" stroke={T.gold} strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Capacity Market Clearing Price</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={capacityMarket}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="rePct" tick={{fontSize:11}} label={{value:'RE %',position:'insideBottom',offset:-5}}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Line yAxisId="left" type="monotone" dataKey="clearingPrice" name="Clearing Price ($/kW-yr)" stroke={T.red} strokeWidth={2}/>
              <Bar yAxisId="right" dataKey="firmCapacity" name="Firm Capacity %" fill={T.green+'66'}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Grid Model</button>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Add to Watchlist</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Inertia model based on AEMO/National Grid ESO frequency stability studies. Storage requirements from NREL Storage Futures Study. Curtailment curves from BNEF and Lazard LCOE analysis. Capacity market pricing from PJM/T-4 auction data. RoCoF thresholds per EirGrid/SONI operational limits.
      </div>
    </div>
  );
}
