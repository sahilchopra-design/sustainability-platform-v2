import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626',
  green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c',
  purple:'#7c3aed', teal:'#0891b2',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(seed){let x=Math.sin(seed + 1) * 10000;return x-Math.floor(x);}

const SECTORS = ['Energy','Utilities','Materials','Industrials','Financials','Tech','Healthcare','Consumer','Real Estate','Transport'];
const HOLDINGS = Array.from({length:30},(_,i)=>{
  const s=sr(i+1); const sec=SECTORS[Math.floor(sr(i+10)*SECTORS.length)];
  return {
    id:`H-${String(i+1).padStart(3,'0')}`, name:`${sec} Corp ${String.fromCharCode(65+i%26)}${i>25?'2':''}`,
    sector:sec, weight:(2+sr(i+20)*6).toFixed(1), exposure:(50+sr(i+30)*450).toFixed(0),
    transScore:Math.round(25+sr(i+40)*70), physScore:Math.round(10+sr(i+50)*60),
    geoScore:Math.round(5+sr(i+60)*50), creditScore:Math.round(15+sr(i+70)*55),
    cvar:(-(0.5+sr(i+80)*4.5)).toFixed(2), itr:(1.2+sr(i+90)*1.8).toFixed(1),
    waci:Math.round(50+sr(i+100)*600)
  };
});

const HOURS = Array.from({length:8},(_,i)=>({hour:`${9+i}:00`,var95:-(1.2+sr(i+200)*2.8).toFixed(2),var99:-(2.0+sr(i+210)*4.0).toFixed(2),es:-(2.5+sr(i+220)*5.0).toFixed(2)}));

const SEVERITIES = ['CRITICAL','HIGH','MEDIUM','LOW'];
const ALERTS = Array.from({length:10},(_,i)=>{
  const sev = SEVERITIES[Math.min(3,Math.floor(sr(i+300)*4))];
  const h = HOLDINGS[Math.floor(sr(i+310)*30)];
  const types=['CVaR Breach','ITR Exceedance','WACI Spike','Score Deterioration','Exposure Limit'];
  return { id:`ALT-${i+1}`, severity:sev, holding:h.name, type:types[Math.floor(sr(i+320)*types.length)],
    message:`${h.name} ${types[Math.floor(sr(i+320)*types.length)]} detected`, timestamp:`2026-04-04 ${String(9+Math.floor(sr(i+330)*8)).padStart(2,'0')}:${String(Math.floor(sr(i+340)*60)).padStart(2,'0')}`,
    acknowledged:sr(i+350)>0.6 };
});

const ACTIONS = Array.from({length:8},(_,i)=>{
  const statuses=['Pending','In Progress','Escalated','Completed'];
  const h = HOLDINGS[Math.floor(sr(i+400)*30)];
  return { id:`ACT-${i+1}`, holding:h.name, action:['Engage Management','Request Disclosure','Reduce Exposure','Hedge Position','Escalate to CIO','Peer Benchmark','Set Watch','Divest Review'][i],
    status:statuses[Math.floor(sr(i+410)*4)], priority:SEVERITIES[Math.floor(sr(i+420)*4)], due:`2026-04-${String(5+Math.floor(sr(i+430)*25)).padStart(2,'0')}`, assignee:['A. Smith','J. Chen','M. Kumar','S. Patel','L. Dubois'][Math.floor(sr(i+440)*5)] };
});

const sevColor = s => s==='CRITICAL'?T.red:s==='HIGH'?T.orange:s==='MEDIUM'?T.amber:T.green;
const riskColor = v => v>=70?T.red:v>=50?T.orange:v>=30?T.amber:T.green;
const statColor = s => s==='Completed'?T.green:s==='Escalated'?T.red:s==='In Progress'?T.blue:T.amber;

const TABS = ['Pulse Dashboard','Risk Heatmap Live','Position Monitor','Intraday VaR','Alert Feed','Action Queue'];

export default function PortfolioClimatePulsePage(){
  const [tab,setTab]=useState(0);
  const [tick,setTick]=useState(0);
  const [selHolding,setSelHolding]=useState(null);
  const [sevFilter,setSevFilter]=useState('ALL');
  const [sortCol,setSortCol]=useState('transScore');
  const [sortDir,setSortDir]=useState('desc');

  useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),5000);return()=>clearInterval(iv);},[]);

  const liveHoldings = useMemo(()=>HOLDINGS.map((h,i)=>({
    ...h, cvar:(parseFloat(h.cvar)-(sr(tick*30+i)*0.3-0.15)).toFixed(2),
    itr:(parseFloat(h.itr)+(sr(tick*31+i)*0.1-0.05)).toFixed(1),
    transScore:Math.max(0,Math.min(100,h.transScore+Math.round(sr(tick*32+i)*6-3)))
  })),[tick]);

  const sorted = useMemo(()=>[...liveHoldings].sort((a,b)=>{
    const av=parseFloat(a[sortCol])||0, bv=parseFloat(b[sortCol])||0;
    return sortDir==='desc'?bv-av:av-bv;
  }),[liveHoldings,sortCol,sortDir]);

  const kpis = useMemo(()=>{
    const avgCvar=(liveHoldings.reduce((s,h)=>s+parseFloat(h.cvar),0)/30).toFixed(2);
    const avgItr=(liveHoldings.reduce((s,h)=>s+parseFloat(h.itr),0)/30).toFixed(1);
    const avgWaci=Math.round(liveHoldings.reduce((s,h)=>s+h.waci,0)/30);
    const critical=liveHoldings.filter(h=>h.transScore>=70).length;
    const engQ=ACTIONS.filter(a=>a.status!=='Completed').length;
    return {avgCvar,avgItr,avgWaci,critical,engQ};
  },[liveHoldings]);

  const filteredAlerts = sevFilter==='ALL'?ALERTS:ALERTS.filter(a=>a.severity===sevFilter);

  const badge = {display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:700,fontFamily:T.mono,color:'#fff'};
  const card = {background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
  const kpiBox = {background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center',flex:1,minWidth:140};
  const th = {padding:'8px 12px',textAlign:'left',fontSize:12,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none'};
  const td = {padding:'8px 12px',fontSize:13,borderBottom:`1px solid ${T.border}`};

  const renderPulse = () => (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        {[{label:'Portfolio CVaR',value:`${kpis.avgCvar}%`,color:T.red},{label:'Avg ITR',value:`${kpis.avgItr}\u00B0C`,color:parseFloat(kpis.avgItr)>2?T.red:T.amber},{label:'Avg WACI',value:`${kpis.avgWaci} tCO\u2082/$M`,color:T.navy},{label:'Holdings at CRITICAL',value:kpis.critical,color:kpis.critical>5?T.red:T.amber},{label:'Engagement Queue',value:kpis.engQ,color:T.blue}].map((k,i)=>(
          <div key={i} style={kpiBox}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:k.color,fontFamily:T.mono}}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{...card,flex:2,minWidth:400}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Live Transition Score Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={liveHoldings.map(h=>({name:h.id,score:h.transScore,sector:h.sector}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}} interval={2}/>
              <YAxis domain={[0,100]}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <ReferenceLine y={70} stroke={T.red} strokeDasharray="4 4" label="CRITICAL"/>
              <Bar dataKey="score">{liveHoldings.map((h,i)=><Cell key={i} fill={riskColor(h.transScore)}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{...card,flex:1,minWidth:300}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector CVaR Breakdown</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SECTORS.map(s=>{const hs=liveHoldings.filter(h=>h.sector===s);return {sector:s,cvar:hs.length?(hs.reduce((a,h)=>a+Math.abs(parseFloat(h.cvar)),0)/hs.length).toFixed(2):0};})} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number"/><YAxis dataKey="sector" type="category" width={80} tick={{fontSize:10}}/>
              <Tooltip/><Bar dataKey="cvar" fill={T.red} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{marginTop:8,fontSize:11,color:T.textMut,fontFamily:T.mono}}>Auto-refresh every 5s | Tick #{tick} | {new Date().toLocaleTimeString()}</div>
    </div>
  );

  const DIMS = ['Transition','Physical','Geopolitical','Credit'];
  const dimKey = d => d==='Transition'?'transScore':d==='Physical'?'physScore':d==='Geopolitical'?'geoScore':'creditScore';
  const renderHeatmap = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Heatmap: 30 Holdings x 4 Dimensions</div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',fontFamily:T.mono,fontSize:11}}>
          <thead><tr><th style={th}>Holding</th><th style={th}>Sector</th>{DIMS.map(d=><th key={d} style={th}>{d}</th>)}<th style={th}>Composite</th></tr></thead>
          <tbody>{sorted.map((h,i)=>{const comp=Math.round((h.transScore+h.physScore+h.geoScore+h.creditScore)/4);return(
            <tr key={i} style={{cursor:'pointer',background:selHolding===h.id?'#f0f4ff':'transparent'}} onClick={()=>setSelHolding(h.id)}>
              <td style={td}>{h.name}</td><td style={td}>{h.sector}</td>
              {DIMS.map(d=>{const v=d==='Transition'?h.transScore:d==='Physical'?h.physScore:d==='Geopolitical'?h.geoScore:h.creditScore;return <td key={d} style={{...td,background:riskColor(v)+'20',color:riskColor(v),fontWeight:700,textAlign:'center'}}>{v}</td>;})}
              <td style={{...td,background:riskColor(comp)+'20',color:riskColor(comp),fontWeight:700,textAlign:'center'}}>{comp}</td>
            </tr>);})}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPositions = () => (
    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Position Monitor</div>
        <div style={{display:'flex',gap:8}}>
          {['transScore','cvar','itr','waci','exposure'].map(c=>(
            <button key={c} onClick={()=>{if(sortCol===c)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortCol(c);setSortDir('desc');}}}
              style={{padding:'4px 10px',borderRadius:8,border:`1px solid ${sortCol===c?T.gold:T.border}`,background:sortCol===c?T.gold+'20':T.surface,fontSize:11,fontFamily:T.mono,cursor:'pointer',color:T.navy}}>
              {c.replace('Score','')}{sortCol===c?(sortDir==='desc'?' \u25BC':' \u25B2'):''}
            </button>
          ))}
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
          <thead><tr>{['Holding','Sector','Weight %','Exposure $M','Trans Score','CVaR %','ITR \u00B0C','WACI'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{sorted.map((h,i)=>(
            <tr key={i} style={{background:i%2===0?'transparent':T.bg+'80'}}>
              <td style={{...td,fontWeight:600}}>{h.name}</td><td style={td}>{h.sector}</td>
              <td style={td}>{h.weight}%</td><td style={{...td,fontFamily:T.mono}}>${h.exposure}M</td>
              <td style={{...td,color:riskColor(h.transScore),fontWeight:700}}>{h.transScore}</td>
              <td style={{...td,color:T.red,fontFamily:T.mono}}>{h.cvar}%</td>
              <td style={{...td,color:parseFloat(h.itr)>2?T.red:T.amber,fontFamily:T.mono}}>{h.itr}</td>
              <td style={{...td,fontFamily:T.mono}}>{h.waci}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderIntradayVaR = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Intraday VaR Snapshots (Hourly)</div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={HOURS}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="hour" tick={{fontSize:11,fontFamily:T.mono}}/>
          <YAxis tick={{fontSize:11}} label={{value:'VaR %',angle:-90,position:'insideLeft'}}/>
          <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
          <Legend/>
          <Area type="monotone" dataKey="es" name="Expected Shortfall" fill={T.red+'30'} stroke={T.red} strokeWidth={2}/>
          <Area type="monotone" dataKey="var99" name="VaR 99%" fill={T.orange+'30'} stroke={T.orange} strokeWidth={2}/>
          <Area type="monotone" dataKey="var95" name="VaR 95%" fill={T.amber+'30'} stroke={T.amber} strokeWidth={2}/>
        </AreaChart>
      </ResponsiveContainer>
      <div style={{marginTop:12,display:'flex',gap:20,flexWrap:'wrap'}}>
        {[{l:'Peak VaR 99%',v:'-5.21%',c:T.red},{l:'Current VaR 95%',v:'-2.87%',c:T.orange},{l:'ES (CVaR)',v:'-6.14%',c:T.red},{l:'VaR Utilization',v:'78%',c:T.amber}].map((k,i)=>(
          <div key={i} style={{padding:'10px 16px',borderRadius:10,border:`1px solid ${T.border}`,background:k.c+'08'}}>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.l}</div>
            <div style={{fontSize:20,fontWeight:700,color:k.c,fontFamily:T.mono}}>{k.v}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Alert Feed ({filteredAlerts.length})</div>
        <div style={{display:'flex',gap:6}}>
          {['ALL',...SEVERITIES].map(s=>(
            <button key={s} onClick={()=>setSevFilter(s)} style={{padding:'4px 12px',borderRadius:8,border:`1px solid ${sevFilter===s?T.gold:T.border}`,background:sevFilter===s?T.gold+'20':T.surface,fontSize:11,fontFamily:T.mono,cursor:'pointer',color:s==='ALL'?T.navy:sevColor(s)}}>{s}</button>
          ))}
        </div>
      </div>
      {filteredAlerts.map((a,i)=>(
        <div key={i} style={{padding:'12px 16px',borderRadius:10,border:`1px solid ${sevColor(a.severity)}30`,background:sevColor(a.severity)+'08',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{flex:1}}>
            <span style={{...badge,background:sevColor(a.severity),marginRight:8}}>{a.severity}</span>
            <span style={{fontSize:13,fontWeight:600,color:T.navy}}>{a.type}</span>
            <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{a.message} | {a.holding}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{a.timestamp}</div>
            <span style={{...badge,background:a.acknowledged?T.green:T.amber,marginTop:4}}>{a.acknowledged?'ACK':'PENDING'}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActions = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Engagement & Escalation Queue</div>
      <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
        <thead><tr>{['ID','Holding','Action','Status','Priority','Due','Assignee'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{ACTIONS.map((a,i)=>(
          <tr key={i}>
            <td style={{...td,fontFamily:T.mono,color:T.textMut}}>{a.id}</td>
            <td style={{...td,fontWeight:600}}>{a.holding}</td>
            <td style={td}>{a.action}</td>
            <td style={td}><span style={{...badge,background:statColor(a.status)}}>{a.status}</span></td>
            <td style={td}><span style={{...badge,background:sevColor(a.priority)}}>{a.priority}</span></td>
            <td style={{...td,fontFamily:T.mono}}>{a.due}</td>
            <td style={td}>{a.assignee}</td>
          </tr>))}</tbody>
      </table>
      <div style={{marginTop:16,padding:14,borderRadius:10,background:T.blue+'08',border:`1px solid ${T.blue}30`}}>
        <div style={{fontSize:12,fontWeight:700,color:T.blue,marginBottom:6}}>Queue Summary</div>
        <div style={{display:'flex',gap:16,fontSize:12,fontFamily:T.mono}}>
          {['Pending','In Progress','Escalated','Completed'].map(s=>(
            <span key={s} style={{color:statColor(s)}}>{s}: {ACTIONS.filter(a=>a.status===s).length}</span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <div style={{background:T.navy,color:'#fff',padding:'6px 16px',borderRadius:10,fontFamily:T.mono,fontSize:13,fontWeight:700,border:`2px solid ${T.gold}`}}>EP-CY2</div>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Portfolio Climate Pulse</h1>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Real-time portfolio climate risk pulse monitor | 30 holdings | 5s auto-refresh</p>
        </div>
        <div style={{marginLeft:'auto',padding:'6px 14px',borderRadius:8,background:tick%2===0?T.green+'20':T.green+'40',border:`1px solid ${T.green}`,fontSize:11,fontFamily:T.mono,color:T.green,fontWeight:700}}>LIVE</div>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,fontFamily:T.font}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderPulse()}
      {tab===1&&renderHeatmap()}
      {tab===2&&renderPositions()}
      {tab===3&&renderIntradayVaR()}
      {tab===4&&renderAlerts()}
      {tab===5&&renderActions()}
      <div style={{marginTop:24,padding:14,borderRadius:10,background:T.navy+'08',border:`1px solid ${T.navy}20`,fontSize:11,color:T.textSec}}>
        <strong>Methodology:</strong> CVaR = weighted conditional loss at 95% confidence. ITR = Implied Temperature Rise per TCFD/SBTi. WACI = Weighted Average Carbon Intensity (tCO2/$M revenue). Transition scores composite: policy readiness (25%), technology alignment (25%), market positioning (25%), carbon trajectory (25%). Alerts auto-generated from configurable threshold matrix. Action queue follows engagement escalation protocol: Watch &#8594; Engage &#8594; Escalate &#8594; Divest Review.
      </div>
    </div>
  );
}
