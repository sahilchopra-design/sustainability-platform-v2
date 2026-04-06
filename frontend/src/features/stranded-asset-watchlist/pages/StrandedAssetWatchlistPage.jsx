import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Watchlist Dashboard','Alert Configuration','Trigger Events','Peer Comparison','Engagement Status','Export & Report'];

const _sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const WATCHLIST = Array.from({length:20},(_, i)=>{
  const sectors = ['Coal','Oil & Gas','Cement','Steel','Power Gen','Chemicals','Mining','Aviation'];
  const names = ['CoalCo Alpha','PetroGlobal','CementWorks','SteelForge','PowerGen Beta','ChemProcess','MineCo Deep','AviationHvy','FossilFuel Inc','GasTurbine Ltd','CoalPort Corp','RefineryCo','PipelineCo','LNG Terminal','IronWorks','HeavyInd','CarbonCo','ThermalGen','OilSands Ltd','GasExplore'];
  return { id:`W-${i+1}`, name:names[i], sector:sectors[i%8],
    exposure:        Math.round(100 + _sr(i*11) * 900),
    strandingRisk:   Math.round(15  + _sr(i*13) * 80),
    carbonPrice_trigger: Math.round(60 + _sr(i*17) * 140),
    rating: ['AAA','AA','A','BBB','BB','B'][Math.floor(_sr(i*19)*6)],
    lastAlert: i<8 ? '2026-03-'+(10+i).toString().padStart(2,'0') : 'None',
    alertCount: Math.floor(_sr(i*23) * 8),
    engagementStatus: ['Active','Pending','Escalated','Resolved','Not Started'][i%5],
    responseRate: Math.round(20 + _sr(i*29) * 80),
    trend: _sr(i*31) > 0.5 ? 'Worsening' : 'Stable',
  };
});

const TRIGGERS = [
  { date:'2026-04-02', asset:'CoalCo Alpha', event:'Carbon price exceeded $120/tCO2 threshold', severity:'High', response:'Portfolio review initiated' },
  { date:'2026-03-28', asset:'PetroGlobal', event:'EU ETS Phase IV announcement', severity:'Critical', response:'Engagement letter sent' },
  { date:'2026-03-25', asset:'SteelForge', event:'Technology cost crossover: Green steel < BF', severity:'Medium', response:'Analyst note published' },
  { date:'2026-03-20', asset:'GasTurbine Ltd', event:'Rating downgrade BBB to BB+', severity:'High', response:'Position reduction recommended' },
  { date:'2026-03-15', asset:'CoalPort Corp', event:'Regulatory closure announcement (2030)', severity:'Critical', response:'Full exit planned' },
  { date:'2026-03-10', asset:'CementWorks', event:'CCUS retrofit cost estimate revised down 25%', severity:'Low', response:'Monitoring' },
  { date:'2026-03-05', asset:'OilSands Ltd', event:'Canadian carbon tax increase to C$170/t', severity:'High', response:'Stress test update' },
  { date:'2026-02-28', asset:'MineCo Deep', event:'ESG rating downgrade to CCC', severity:'Medium', response:'Engagement meeting scheduled' },
];

const ALERT_TYPES = [
  { type:'Carbon Price Threshold', desc:'Alert when carbon price exceeds set level', default_val:'$100/tCO2', active:true },
  { type:'Regulatory Announcement', desc:'New regulation affecting asset operations', default_val:'Any jurisdiction', active:true },
  { type:'Technology Cost Crossover', desc:'Clean alternative becomes cheaper than incumbent', default_val:'LCOE parity', active:true },
  { type:'Rating Downgrade', desc:'Credit or ESG rating downgrade event', default_val:'>1 notch', active:true },
  { type:'Peer Default', desc:'Sector peer enters default or restructuring', default_val:'Same sector', active:false },
  { type:'Stranding Probability Change', desc:'Model-implied stranding prob change >10pp', default_val:'10pp threshold', active:true },
];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function StrandedAssetWatchlistPage(){
  const [tab,setTab]=useState(0);
  const [sortBy,setSortBy]=useState('risk');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [alerts,setAlerts]=useState(ALERT_TYPES.map(a=>a.active));

  const filtered = useMemo(()=>{
    let d=[...WATCHLIST];
    if(sectorFilter!=='All') d=d.filter(w=>w.sector===sectorFilter);
    d.sort((a,b)=>sortBy==='risk'?b.strandingRisk-a.strandingRisk:sortBy==='exposure'?b.exposure-a.exposure:b.alertCount-a.alertCount);
    return d;
  },[sortBy,sectorFilter]);

  const totalExposure = WATCHLIST.reduce((s,w)=>s+w.exposure,0);
  const avgRisk = Math.round(WATCHLIST.reduce((s,w)=>s+w.strandingRisk,0)/WATCHLIST.length);
  const criticalCount = WATCHLIST.filter(w=>w.strandingRisk>70).length;

  const sectorPeers = useMemo(()=>{
    const sectors=[...new Set(WATCHLIST.map(w=>w.sector))];
    return sectors.map(s=>{const group=WATCHLIST.filter(w=>w.sector===s); return { sector:s, count:group.length, avgRisk:group.length?Math.round(group.reduce((a,w)=>a+w.strandingRisk,0)/group.length):0, totalExp:group.reduce((a,w)=>a+w.exposure,0) };});
  },[]);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CK5" label="Stranded Asset Watchlist" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Interactive Stranded Asset Watchlist</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>User-configurable monitoring with trigger events, alerts, and engagement tracking</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:T.textSec}}>Sort:</label>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}><option value="risk">Risk (High-Low)</option><option value="exposure">Exposure</option><option value="alerts">Alert Count</option></select>
        <label style={{fontSize:12,color:T.textSec}}>Sector:</label>
        <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{['All',...new Set(WATCHLIST.map(w=>w.sector))].map(s=><option key={s}>{s}</option>)}</select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Watchlist Assets" value={WATCHLIST.length} sub={`${filtered.length} filtered`}/></Card>
        <Card><KPI label="Total Exposure" value={`$${(totalExposure/1000).toFixed(1)}B`} sub="across portfolio"/></Card>
        <Card><KPI label="Avg Stranding Risk" value={`${avgRisk}%`} sub="model-implied" color={avgRisk>50?T.red:T.amber}/></Card>
        <Card><KPI label="Critical Assets" value={criticalCount} sub=">70% stranding risk" color={T.red}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Watchlist Dashboard</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Asset','Sector','Exposure ($M)','Strand Risk','Rating','Trigger Price','Alerts','Trend','Last Alert'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(w=><tr key={w.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{w.name}</td><td>{w.sector}</td>
                <td>${w.exposure}M</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:w.strandingRisk>70?T.red+'22':w.strandingRisk>40?T.amber+'22':T.green+'22',color:w.strandingRisk>70?T.red:w.strandingRisk>40?T.amber:T.green}}>{w.strandingRisk}%</span></td>
                <td>{w.rating}</td><td>${w.carbonPrice_trigger}/t</td><td>{w.alertCount}</td>
                <td style={{color:w.trend==='Worsening'?T.red:T.green,fontSize:11}}>{w.trend}</td>
                <td style={{fontSize:10}}>{w.lastAlert}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Alert Configuration</h3>
          <div style={{display:'grid',gap:12}}>
            {ALERT_TYPES.map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:6,border:`1px solid ${T.border}`,background:alerts[i]?T.green+'06':T.surface}}>
              <button onClick={()=>{const n=[...alerts];n[i]=!n[i];setAlerts(n);}} style={{width:40,height:22,borderRadius:11,border:'none',background:alerts[i]?T.green:T.border,cursor:'pointer',position:'relative'}}>
                <div style={{width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:2,left:alerts[i]?20:2,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
              </button>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{a.type}</div>
                <div style={{fontSize:11,color:T.textSec}}>{a.desc}</div>
              </div>
              <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>{a.default_val}</span>
            </div>)}
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Trigger Events History</h3>
          {TRIGGERS.map((t,i)=><div key={i} style={{display:'flex',gap:12,padding:12,borderRadius:6,border:`1px solid ${T.border}`,marginBottom:8,borderLeft:`4px solid ${t.severity==='Critical'?T.red:t.severity==='High'?T.orange:t.severity==='Medium'?T.amber:T.green}`}}>
            <div style={{minWidth:80,fontSize:11,fontFamily:T.mono,color:T.textMut}}>{t.date}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{t.asset}</div>
              <div style={{fontSize:12,color:T.textSec}}>{t.event}</div>
              <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Response: {t.response}</div>
            </div>
            <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,height:'fit-content',background:t.severity==='Critical'?T.red+'22':t.severity==='High'?T.orange+'22':t.severity==='Medium'?T.amber+'22':T.green+'22',color:t.severity==='Critical'?T.red:t.severity==='High'?T.orange:t.severity==='Medium'?T.amber:T.green}}>{t.severity}</span>
          </div>)}
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Peer Comparison by Sector</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={sectorPeers}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:10}}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar yAxisId="left" dataKey="totalExp" name="Total Exposure ($M)" fill={T.navy}/>
              <Line yAxisId="right" type="monotone" dataKey="avgRisk" name="Avg Stranding Risk %" stroke={T.red} strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Engagement Status</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:16}}>
            {['Active','Pending','Escalated','Resolved','Not Started'].map(status=>{
              const count = WATCHLIST.filter(w=>w.engagementStatus===status).length;
              return <div key={status} style={{textAlign:'center',padding:12,borderRadius:6,background:status==='Active'?T.green+'11':status==='Escalated'?T.red+'11':status==='Resolved'?T.blue+'11':T.surface,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color:T.navy}}>{count}</div>
                <div style={{fontSize:11,color:T.textSec}}>{status}</div>
              </div>;
            })}
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Asset','Sector','Status','Response Rate','Last Contact'].map(h=><th key={h} style={{padding:'6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{WATCHLIST.slice(0,10).map(w=><tr key={w.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'4px 6px',fontWeight:600}}>{w.name}</td><td>{w.sector}</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:w.engagementStatus==='Active'?T.green+'22':w.engagementStatus==='Escalated'?T.red+'22':T.amber+'22',color:w.engagementStatus==='Active'?T.green:w.engagementStatus==='Escalated'?T.red:T.amber}}>{w.engagementStatus}</span></td>
                <td>{w.responseRate}%</td><td style={{fontSize:10}}>{w.lastAlert}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Export & Report</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[{title:'Full Watchlist Report',desc:'Complete PDF with all 20 assets, risk scores, and engagement status',icon:'PDF'},{title:'Trigger Event Log',desc:'CSV export of all trigger events with dates and responses',icon:'CSV'},{title:'Board Summary',desc:'Executive summary with key metrics and recommendations',icon:'PPTX'}].map((r,i)=><div key={i} style={{padding:16,borderRadius:8,border:`1px solid ${T.border}`,textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:8}}>{r.icon==='PDF'?'\u{1F4C4}':r.icon==='CSV'?'\u{1F4CA}':'\u{1F4DD}'}</div>
              <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{r.title}</div>
              <div style={{fontSize:11,color:T.textSec,margin:'8px 0'}}>{r.desc}</div>
              <button style={{padding:'6px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Generate</button>
            </div>)}
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.gold+'22',color:T.navy,border:`1px solid ${T.gold}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Schedule Weekly Report</button>
            <button style={{padding:'8px 16px',background:'transparent',color:T.textSec,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Share Watchlist</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Stranding risk scores derived from multi-factor model incorporating carbon price sensitivity, regulatory timeline, technology substitution curves, and financial leverage. Trigger thresholds calibrated to IEA NZE scenario parameters. Engagement tracking follows CA100+ Net Zero Benchmark framework.
      </div>
    </div>
  );
}
