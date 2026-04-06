import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  ReferenceLine, ComposedChart
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626',
  green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c',
  purple:'#7c3aed', teal:'#0891b2',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(seed){let x=Math.sin(seed + 1) * 10000;return x-Math.floor(x);}

const FACILITY_TYPES = ['Power Plant','Refinery','Cement Plant','Steel Mill','Chemical Plant','LNG Terminal','Data Center','Smelter','Paper Mill','Fertilizer Plant'];
const FACILITIES = Array.from({length:20},(_,i)=>{
  const type = FACILITY_TYPES[i%10];
  const permit = Math.round(200+sr(i+100)*1800);
  const hourlyRate = (permit/8760*(0.7+sr(i+110)*0.5)).toFixed(1);
  const ytdTotal = Math.round(permit*(0.2+sr(i+120)*0.6));
  const utilPct = (ytdTotal/permit*100).toFixed(1);
  return {
    id:`FAC-${String(i+1).padStart(3,'0')}`, name:`${type} ${String.fromCharCode(65+i%26)}`,
    type, region:['North','South','East','West','Central'][Math.floor(sr(i+130)*5)],
    permitLimit:permit, hourlyRate:parseFloat(hourlyRate), dailyCumulative:Math.round(parseFloat(hourlyRate)*24),
    ytdTotal, utilPct:parseFloat(utilPct),
    scope1:Math.round(ytdTotal*0.85), scope2:Math.round(ytdTotal*0.15),
    gridEF:(0.3+sr(i+140)*0.5).toFixed(3), elecMWh:Math.round(500+sr(i+150)*4500),
    sbtiTarget:Math.round(permit*(0.55+sr(i+160)*0.25)),
    sbtiActual:ytdTotal,
    anomalies:Math.floor(sr(i+170)*4),
    ewmaUCL:(parseFloat(hourlyRate)*1.15).toFixed(1),
    ewmaLCL:(parseFloat(hourlyRate)*0.85).toFixed(1),
  };
});

const complianceColor = pct => pct>100?T.red:pct>95?T.red:pct>80?T.amber:T.green;
const complianceLabel = pct => pct>100?'BREACH':pct>95?'RED':pct>80?'AMBER':'GREEN';

const HOURLY_DATA = Array.from({length:24},(_,i)=>({
  hour:`${String(i).padStart(2,'0')}:00`,
  actual:(12+sr(i+300)*8+Math.sin(i/4)*3).toFixed(1),
  ucl:(22).toFixed(1), lcl:(10).toFixed(1),
  ewma:(14+sr(i+310)*4).toFixed(1),
  scope2:(2+sr(i+320)*3).toFixed(1)
}));

const ANOMALIES = Array.from({length:8},(_,i)=>{
  const f=FACILITIES[Math.floor(sr(i+400)*20)];
  return {
    id:`ANOM-${i+1}`, facility:f.name, type:['Spike','Drift','Step Change','Oscillation'][Math.floor(sr(i+410)*4)],
    detected:`2026-04-${String(1+Math.floor(sr(i+420)*4)).padStart(2,'0')} ${String(8+Math.floor(sr(i+430)*12)).padStart(2,'0')}:${String(Math.floor(sr(i+440)*60)).padStart(2,'0')}`,
    magnitude:(1.2+sr(i+450)*3.8).toFixed(1), status:['Open','Investigating','Resolved'][Math.floor(sr(i+460)*3)],
    cause:['Equipment malfunction','Process deviation','Fuel quality','Weather impact','Startup/shutdown','Unknown'][Math.floor(sr(i+470)*6)]
  };
});

const TABS = ['Emissions Dashboard','Scope 1 Live','Scope 2 Tracking','Anomaly Detector','Compliance Check','Reduction Tracker'];

export default function RealTimeEmissionsMonitorPage(){
  const [tab,setTab]=useState(0);
  const [tick,setTick]=useState(0);
  const [selFacility,setSelFacility]=useState(null);
  const [regionFilter,setRegionFilter]=useState('ALL');

  useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),5000);return()=>clearInterval(iv);},[]);

  const liveFacilities = useMemo(()=>FACILITIES.map((f,i)=>({
    ...f, hourlyRate:parseFloat((f.hourlyRate+(sr(tick*20+i)*2-1)).toFixed(1)),
    ytdTotal:f.ytdTotal+Math.round(sr(tick*21+i)*5)
  })),[tick]);

  const filtered = regionFilter==='ALL'?liveFacilities:liveFacilities.filter(f=>f.region===regionFilter);
  const kpis = useMemo(()=>{
    const totalYtd = liveFacilities.reduce((a,f)=>a+f.ytdTotal,0);
    const monitored = liveFacilities.length;
    const anomTotal = ANOMALIES.filter(a=>a.status!=='Resolved').length;
    const compRate = (liveFacilities.filter(f=>f.utilPct<=95).length/monitored*100).toFixed(0);
    return {totalYtd,monitored,anomTotal,compRate};
  },[liveFacilities]);

  const badge = {display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:700,fontFamily:T.mono,color:'#fff'};
  const card = {background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
  const kpiBox = {background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center',flex:1,minWidth:140};
  const th = {padding:'8px 12px',textAlign:'left',fontSize:12,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`};
  const td = {padding:'8px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`};

  const renderDashboard = () => (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        {[{l:'Portfolio Emissions (YTD)',v:`${(kpis.totalYtd/1000).toFixed(0)}k tCO\u2082`,c:T.navy},{l:'Facilities Monitored',v:kpis.monitored,c:T.blue},{l:'Open Anomalies',v:kpis.anomTotal,c:kpis.anomTotal>3?T.red:T.amber},{l:'Compliance Rate',v:`${kpis.compRate}%`,c:parseFloat(kpis.compRate)>=95?T.green:T.amber}].map((k,i)=>(
          <div key={i} style={kpiBox}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:k.c,fontFamily:T.mono}}>{k.v}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
          <option value="ALL">All Regions</option>
          {['North','South','East','West','Central'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Facility Emissions Overview</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={filtered.map(f=>({name:f.id,ytd:f.ytdTotal,permit:f.permitLimit,pct:f.utilPct}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} interval={1}/>
            <YAxis/><Tooltip/><Legend/>
            <Bar dataKey="ytd" name="YTD Emissions (tCO\u2082)">{filtered.map((f,i)=><Cell key={i} fill={complianceColor(f.utilPct)}/>)}</Bar>
            <Bar dataKey="permit" name="Permit Limit" fill={T.textMut+'40'}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{marginTop:8,fontSize:11,color:T.textMut,fontFamily:T.mono}}>Auto-refresh every 5s | Tick #{tick} | {new Date().toLocaleTimeString()}</div>
    </div>
  );

  const renderScope1 = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Scope 1 Emissions — Hourly CEM Data</div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={HOURLY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="hour" tick={{fontSize:10,fontFamily:T.mono}}/>
            <YAxis label={{value:'tCO\u2082/hr',angle:-90,position:'insideLeft'}}/>
            <Tooltip/><Legend/>
            <Area type="monotone" dataKey="actual" name="Actual" fill={T.blue+'30'} stroke={T.blue} strokeWidth={2}/>
            <Line type="monotone" dataKey="ewma" name="EWMA" stroke={T.purple} strokeWidth={2} dot={false} strokeDasharray="5 3"/>
            <ReferenceLine y={22} stroke={T.red} strokeDasharray="4 4" label="UCL"/>
            <ReferenceLine y={10} stroke={T.amber} strokeDasharray="4 4" label="LCL"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Facility-Level Scope 1 Summary</div>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:11}}>
          <thead><tr>{['Facility','Type','Rate (tCO\u2082/hr)','Daily','YTD','Permit','Util %','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map((f,i)=>(
            <tr key={i} style={{cursor:'pointer',background:selFacility===f.id?'#f0f4ff':'transparent'}} onClick={()=>setSelFacility(f.id)}>
              <td style={{...td,fontWeight:600}}>{f.name}</td><td style={td}>{f.type}</td>
              <td style={{...td,fontFamily:T.mono}}>{f.hourlyRate}</td>
              <td style={{...td,fontFamily:T.mono}}>{f.dailyCumulative}</td>
              <td style={{...td,fontFamily:T.mono}}>{f.ytdTotal.toLocaleString()}</td>
              <td style={{...td,fontFamily:T.mono}}>{f.permitLimit.toLocaleString()}</td>
              <td style={{...td,fontFamily:T.mono,color:complianceColor(f.utilPct),fontWeight:700}}>{f.utilPct}%</td>
              <td style={td}><span style={{...badge,background:complianceColor(f.utilPct)}}>{complianceLabel(f.utilPct)}</span></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderScope2 = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Scope 2 — Grid Emission Factor x Electricity Consumption</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={filtered.map(f=>({name:f.id,scope2:f.scope2,elec:f.elecMWh,gridEF:parseFloat(f.gridEF)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} interval={1}/>
            <YAxis yAxisId="left"/><YAxis yAxisId="right" orientation="right"/>
            <Tooltip/><Legend/>
            <Bar yAxisId="left" dataKey="scope2" name="Scope 2 (tCO\u2082)" fill={T.teal} radius={[4,4,0,0]}/>
            <Bar yAxisId="right" dataKey="elec" name="Electricity (MWh)" fill={T.amber+'60'} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Hourly Scope 2 Tracking</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={HOURLY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="hour" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis/>
            <Tooltip/><Area type="monotone" dataKey="scope2" name="Scope 2 (tCO\u2082/hr)" fill={T.teal+'30'} stroke={T.teal} strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={{marginTop:12,fontSize:11,color:T.textSec}}>Scope 2 = Grid Emission Factor (tCO\u2082/MWh) x Electricity Consumption (MWh). Location-based method per GHG Protocol. Hourly granularity enables time-of-use optimization.</div>
      </div>
    </div>
  );

  const anomStatColor = s => s==='Open'?T.red:s==='Investigating'?T.amber:T.green;
  const renderAnomaly = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>EWMA Control Chart — Statistical Process Control</div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={HOURLY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="hour" tick={{fontSize:10,fontFamily:T.mono}}/><YAxis/>
            <Tooltip/><Legend/>
            <Line type="monotone" dataKey="actual" name="Actual" stroke={T.blue} strokeWidth={2}/>
            <Line type="monotone" dataKey="ewma" name="EWMA" stroke={T.purple} strokeWidth={2} dot={false}/>
            <ReferenceLine y={22} stroke={T.red} strokeDasharray="4 4" label="UCL"/>
            <ReferenceLine y={10} stroke={T.amber} strokeDasharray="4 4" label="LCL"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Detected Anomalies ({ANOMALIES.length})</div>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
          <thead><tr>{['ID','Facility','Type','Detected','Magnitude','Cause','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{ANOMALIES.map((a,i)=>(
            <tr key={i}>
              <td style={{...td,fontFamily:T.mono,color:T.textMut}}>{a.id}</td>
              <td style={{...td,fontWeight:600}}>{a.facility}</td>
              <td style={td}>{a.type}</td>
              <td style={{...td,fontFamily:T.mono}}>{a.detected}</td>
              <td style={{...td,fontFamily:T.mono,color:parseFloat(a.magnitude)>3?T.red:T.amber,fontWeight:700}}>{a.magnitude}x</td>
              <td style={td}>{a.cause}</td>
              <td style={td}><span style={{...badge,background:anomStatColor(a.status)}}>{a.status}</span></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Compliance Traffic Light — All Facilities</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          {filtered.map((f,i)=>{
            const c=complianceColor(f.utilPct);
            return (
              <div key={i} style={{padding:14,borderRadius:10,border:`1px solid ${c}30`,background:c+'08'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{f.name}</span>
                  <span style={{...badge,background:c}}>{complianceLabel(f.utilPct)}</span>
                </div>
                <div style={{height:8,borderRadius:4,background:T.border,overflow:'hidden',marginBottom:6}}>
                  <div style={{width:`${Math.min(f.utilPct,100)}%`,height:'100%',background:c,transition:'width 0.5s'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:T.mono,color:T.textSec}}>
                  <span>{f.ytdTotal.toLocaleString()} tCO\u2082</span>
                  <span>{f.utilPct}% of {f.permitLimit.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderReduction = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>SBTi Target vs Actual Trajectory</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filtered.slice(0,12).map(f=>({name:f.id,target:f.sbtiTarget,actual:f.sbtiActual,gap:f.sbtiActual-f.sbtiTarget}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}}/><YAxis/>
            <Tooltip/><Legend/>
            <Bar dataKey="target" name="SBTi Target" fill={T.green+'60'} radius={[4,4,0,0]}/>
            <Bar dataKey="actual" name="Actual YTD" fill={T.blue} radius={[4,4,0,0]}>{filtered.slice(0,12).map((f,i)=><Cell key={i} fill={f.sbtiActual>f.sbtiTarget?T.red:T.green}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Reduction Tracker Detail</div>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:11}}>
          <thead><tr>{['Facility','SBTi Target','Actual YTD','Gap','On Track','Anomalies'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map((f,i)=>{const gap=f.sbtiActual-f.sbtiTarget;const onTrack=gap<=0;return(
            <tr key={i}>
              <td style={{...td,fontWeight:600}}>{f.name}</td>
              <td style={{...td,fontFamily:T.mono}}>{f.sbtiTarget.toLocaleString()}</td>
              <td style={{...td,fontFamily:T.mono}}>{f.sbtiActual.toLocaleString()}</td>
              <td style={{...td,fontFamily:T.mono,color:onTrack?T.green:T.red,fontWeight:700}}>{gap>0?'+':''}{gap.toLocaleString()}</td>
              <td style={td}><span style={{...badge,background:onTrack?T.green:T.red}}>{onTrack?'ON TRACK':'BEHIND'}</span></td>
              <td style={{...td,fontFamily:T.mono,color:f.anomalies>0?T.red:T.green}}>{f.anomalies}</td>
            </tr>);})}</tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <div style={{background:T.navy,color:'#fff',padding:'6px 16px',borderRadius:10,fontFamily:T.mono,fontSize:13,fontWeight:700,border:`2px solid ${T.gold}`}}>EP-CY5</div>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Real-Time Emissions Monitor</h1>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Continuous emissions monitoring & anomaly detection | 20 facilities | SPC/EWMA</p>
        </div>
        <div style={{marginLeft:'auto',padding:'6px 14px',borderRadius:8,background:tick%2===0?T.green+'20':T.green+'40',border:`1px solid ${T.green}`,fontSize:11,fontFamily:T.mono,color:T.green,fontWeight:700}}>CEM LIVE</div>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,fontFamily:T.font}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderScope1()}
      {tab===2&&renderScope2()}
      {tab===3&&renderAnomaly()}
      {tab===4&&renderCompliance()}
      {tab===5&&renderReduction()}
      <div style={{marginTop:24,padding:14,borderRadius:10,background:T.navy+'08',border:`1px solid ${T.navy}20`,fontSize:11,color:T.textSec}}>
        <strong>Methodology:</strong> CEM data simulated at hourly resolution. EWMA control chart: lambda=0.2, L=3 sigma. Traffic light: GREEN (&lt;80% permit), AMBER (80-95%), RED (&gt;95%), BREACH (&gt;100%). Scope 2 location-based: tCO2 = Grid EF (tCO2/MWh) x Electricity (MWh). SBTi targets per SBTi Corporate Net-Zero Standard v1.2. Anomaly detection via Shewhart + EWMA dual control chart system.
      </div>
    </div>
  );
}
