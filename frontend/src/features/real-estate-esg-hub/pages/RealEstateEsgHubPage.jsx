import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Executive Dashboard','Portfolio Overview','Engagement & Capex Pipeline','Board Report'];
const TYPES=['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];
const EPC_RATINGS=['A','B','C','D','E','F','G'];
const EPC_COLORS={'A':'#16a34a','B':'#22c55e','C':'#84cc16','D':'#eab308','E':'#f97316','F':'#ef4444','G':'#dc2626'};
const CITIES=['London','Manchester','Birmingham','Edinburgh','Bristol','Leeds','Glasgow','Cardiff','Amsterdam','Frankfurt','Paris','Dublin','Madrid','Milan','Sydney'];
const SUB_MODULES=[
  {id:'AS1',name:'Building Energy Performance',icon:'⚡',color:T.navy,desc:'EPC, CRREM, energy intensity',status:'Active',kpi:'143 kWh/m² avg'},
  {id:'AS2',name:'Green Building Certification',icon:'🏅',color:T.green,desc:'LEED, BREEAM, WELL, NABERS',status:'Active',kpi:'62% certified'},
  {id:'AS3',name:'Embodied Carbon',icon:'🏗',color:T.gold,desc:'Whole-life carbon, materials, RIBA',status:'Active',kpi:'285 kgCO₂e/m² avg'},
  {id:'AS4',name:'Climate Resilient Design',icon:'🛡',color:T.red,desc:'Physical risk, adaptation, resilience',status:'Active',kpi:'42/100 avg risk'},
  {id:'AS5',name:'Tenant Engagement ESG',icon:'🤝',color:T.sage,desc:'Green leases, Scope 3, engagement',status:'Active',kpi:'65% green lease'},
];

const buildings=Array.from({length:150},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);const s5=sr(i*19+13);const s6=sr(i*23+17);
  const type=TYPES[Math.floor(s*6)];const city=CITIES[Math.floor(s2*CITIES.length)];
  const epcIdx=Math.floor(s3*7);const epc=EPC_RATINGS[epcIdx];
  const area=Math.floor(500+s4*49500);const yearBuilt=Math.floor(1950+s5*73);
  const value=Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:type==='Industrial'?1800:type==='Logistics'?2100:3800)*(0.8+s3*0.4));
  const intensity=Math.floor(({'Office':180,'Retail':220,'Residential':120,'Industrial':280,'Logistics':150,'Mixed-Use':200}[type])*(0.5+s*0.8));
  const crremAligned=intensity<100;const strandingYear=crremAligned?2045+Math.floor(s4*5):2026+Math.floor(s2*12);
  const certified=s6>0.38;const certScheme=certified?['LEED','BREEAM','WELL','NABERS','DGNB'][Math.floor(s*5)]:'None';
  const certLevel=certified?['Gold','Silver','Platinum','Excellent'][Math.floor(s2*4)]:'None';
  const embodiedCarbon=Math.floor(200+s*200);const resilience=Math.floor(30+s2*60);
  const riskScore=Math.floor(20+s3*70);const greenLease=s4>0.35;
  const tenantCount=Math.floor(1+s5*15);const occupancy=Math.floor(70+s6*30);
  const retrofitCost=Math.floor(area*(25+s*75));const retrofitStatus=['Not Started','Planned','In Progress','Completed'][Math.floor(s6*4)];
  const gresbScore=Math.floor(40+s*50);const co2=Math.floor(intensity*area*0.21/1000);
  const insurancePrem=Math.floor(value*0.003*(1+riskScore/100));
  return{id:i+1,name:`${city} ${type} ${i+1}`,type,city,epc,epcIdx,area,yearBuilt,value,intensity,crremAligned,strandingYear,certified,certScheme,certLevel,embodiedCarbon,resilience,riskScore,greenLease,tenantCount,occupancy,retrofitCost,retrofitStatus,gresbScore,co2,insurancePrem};
});

const alerts=[
  {id:1,severity:'critical',module:'AS1',msg:'12 buildings stranding by 2028 under 1.5°C pathway',action:'Review CRREM analysis'},
  {id:2,severity:'critical',module:'AS4',msg:'8 properties in Flood Zone 3b require immediate adaptation',action:'Commission flood assessment'},
  {id:3,severity:'high',module:'AS1',msg:'MEES 2027: 34 buildings require EPC upgrade to C',action:'Prioritise retrofit programme'},
  {id:4,severity:'high',module:'AS2',msg:'15 BREEAM certifications expiring in next 12 months',action:'Schedule recertification'},
  {id:5,severity:'high',module:'AS5',msg:'Scope 3 data gap: 23 tenants with no energy data',action:'Launch data collection campaign'},
  {id:6,severity:'medium',module:'AS3',msg:'Portfolio embodied carbon 18% above RIBA 2030 target',action:'Review material specifications'},
  {id:7,severity:'medium',module:'AS4',msg:'Cooling demand projected +35% under RCP4.5 by 2050',action:'Plan HVAC upgrades'},
  {id:8,severity:'medium',module:'AS2',msg:'Green premium opportunity: 38 uncertified high-value assets',action:'Evaluate certification ROI'},
  {id:9,severity:'medium',module:'AS5',msg:'Green lease adoption stalled at 65% — target 80% by 2026',action:'Engage remaining tenants'},
  {id:10,severity:'low',module:'AS1',msg:'Smart meter rollout 72% complete — 42 buildings remaining',action:'Schedule installations'},
  {id:11,severity:'critical',module:'AS4',msg:'3 coastal properties face sea level rise exposure by 2040',action:'Commission coastal risk study'},
  {id:12,severity:'high',module:'AS3',msg:'New construction: 4 projects above embodied carbon benchmark',action:'Require low-carbon materials'},
  {id:13,severity:'medium',module:'AS1',msg:'Solar PV potential identified across 28 rooftops',action:'Commission feasibility studies'},
  {id:14,severity:'low',module:'AS5',msg:'Tenant satisfaction survey response rate below 60%',action:'Improve engagement strategy'},
  {id:15,severity:'high',module:'AS4',msg:'Insurance premiums up 12% YoY due to climate risk repricing',action:'Review adaptation spend'},
  {id:16,severity:'medium',module:'AS2',msg:'WELL certification demand increasing from office tenants',action:'Assess WELL readiness'},
  {id:17,severity:'low',module:'AS3',msg:'Material passport system pilot completing Q2 2026',action:'Evaluate rollout plan'},
  {id:18,severity:'critical',module:'AS1',msg:'EU EPBD recast: 28 EU buildings require zero-emission upgrades',action:'Create compliance roadmap'},
  {id:19,severity:'high',module:'AS5',msg:'Top 10 tenants represent 45% of Scope 3 — engage for SBTs',action:'Arrange executive meetings'},
  {id:20,severity:'medium',module:'AS4',msg:'Urban heat island data shows 4.2°C avg increase in CBD',action:'Green infrastructure plan'},
];

const SEVERITY_COLORS={critical:T.red,high:T.amber,medium:T.gold,low:T.textMut};

const kpis=[
  {label:'Portfolio Value',value:`£${(buildings.reduce((s,b)=>s+b.value,0)/1e9).toFixed(1)}B`,trend:'+2.1%'},
  {label:'Avg EPC',value:EPC_RATINGS[Math.floor(buildings.reduce((s,b)=>s+b.epcIdx,0)/Math.max(1,buildings.length))],trend:'Improving'},
  {label:'CRREM Aligned',value:`${Math.floor(buildings.filter(b=>b.crremAligned).length/buildings.length*100)}%`,trend:'+5% YoY'},
  {label:'Certification Rate',value:`${Math.floor(buildings.filter(b=>b.certified).length/buildings.length*100)}%`,trend:'+8% YoY'},
  {label:'Avg Resilience',value:`${Math.floor(buildings.reduce((s,b)=>s+b.resilience,0)/Math.max(1,buildings.length))}/100`,trend:'+3 pts'},
  {label:'Green Lease Rate',value:`${Math.floor(buildings.filter(b=>b.greenLease).length/buildings.length*100)}%`,trend:'+12% YoY'},
  {label:'Total CO₂',value:`${Math.floor(buildings.reduce((s,b)=>s+b.co2,0)/1000)}k tCO₂`,trend:'-7% YoY'},
  {label:'GRESB Score',value:`${Math.floor(buildings.reduce((s,b)=>s+b.gresbScore,0)/Math.max(1,buildings.length))}/100`,trend:'+4 pts'},
  {label:'Avg Intensity',value:`${Math.floor(buildings.reduce((s,b)=>s+b.intensity,0)/Math.max(1,buildings.length))} kWh/m²`,trend:'-5% YoY'},
  {label:'Embodied Carbon',value:`${Math.floor(buildings.reduce((s,b)=>s+b.embodiedCarbon,0)/Math.max(1,buildings.length))} kgCO₂e/m²`,trend:'-3% YoY'},
  {label:'Retrofit Pipeline',value:`£${Math.floor(buildings.filter(b=>b.retrofitStatus!=='Completed').reduce((s,b)=>s+b.retrofitCost,0)/1e6)}M`,trend:'Active'},
  {label:'Buildings',value:buildings.length,trend:'Stable'},
];

const gresbTrend=Array.from({length:6},(_,i)=>({year:2020+i,score:Math.floor(52+i*4.5+sr(i*13)*3),benchmark:Math.floor(55+i*2.5),peer:Math.floor(50+i*3)}));
const crremTrend=Array.from({length:6},(_,i)=>({year:2020+i,aligned:Math.floor(20+i*8+sr(i*17)*5),intensity:Math.floor(180-i*7)}));
const certTrend=Array.from({length:6},(_,i)=>({year:2020+i,leed:Math.floor(10+i*4),breeam:Math.floor(8+i*5),well:Math.floor(2+i*3),total:Math.floor(20+i*12)}));

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{marginBottom:20},title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,fontFamily:T.mono,marginTop:4},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`},
  tab:(a)=>({padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',background:a?T.surfaceH:'transparent',transition:'all 0.2s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  kpiRow:{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16},
  kpi:{flex:'1 1 140px',background:T.surfaceH,border:`1px solid ${T.borderL}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:20,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:10,color:T.textMut,marginTop:3},
  kpiTrend:{fontSize:10,color:T.green,fontFamily:T.mono,marginTop:2},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`},
  badge:(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'22',color:c}),
  filterRow:{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'},
  select:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  scrollBox:{maxHeight:440,overflowY:'auto'},
  pill:(a)=>({padding:'4px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:a?700:500,background:a?T.navy:T.surfaceH,color:a?'#fff':T.text,border:`1px solid ${a?T.navy:T.border}`}),
  exportBtn:{padding:'8px 18px',borderRadius:6,background:T.navy,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600},
  moduleCard:(color)=>({background:T.surface,border:`1px solid ${T.border}`,borderTop:`3px solid ${color}`,borderRadius:8,padding:16,cursor:'pointer',transition:'all 0.2s'}),
  alertRow:(sev)=>({display:'flex',gap:12,padding:'10px 14px',borderLeft:`4px solid ${SEVERITY_COLORS[sev]}`,background:SEVERITY_COLORS[sev]+'08',marginBottom:6,borderRadius:'0 6px 6px 0',alignItems:'center'}),
};

export default function RealEstateEsgHubPage(){
  const[tab,setTab]=useState(0);
  const[typeFilter,setTypeFilter]=useState('All');
  const[cityFilter,setCityFilter]=useState('All');
  const[sortCol,setSortCol]=useState('gresbScore');
  const[sortDir,setSortDir]=useState('desc');
  const[alertSeverity,setAlertSeverity]=useState('All');
  const[boardAudience,setBoardAudience]=useState('Board');
  const[searchTerm,setSearchTerm]=useState('');
  const[retrofitFilter,setRetrofitFilter]=useState('All');

  const filtered=useMemo(()=>{
    let d=[...buildings];
    if(typeFilter!=='All')d=d.filter(b=>b.type===typeFilter);
    if(cityFilter!=='All')d=d.filter(b=>b.city===cityFilter);
    if(searchTerm)d=d.filter(b=>b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(retrofitFilter!=='All')d=d.filter(b=>b.retrofitStatus===retrofitFilter);
    d.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return d;
  },[typeFilter,cityFilter,sortCol,sortDir,searchTerm,retrofitFilter]);

  const filteredAlerts=useMemo(()=>alertSeverity==='All'?alerts:alerts.filter(a=>a.severity===alertSeverity),[alertSeverity]);

  const epcDist=useMemo(()=>EPC_RATINGS.map(r=>({rating:r,count:filtered.filter(b=>b.epc===r).length})),[filtered]);
  const typeDist=useMemo(()=>TYPES.map(t=>({type:t,count:filtered.filter(b=>b.type===t).length})),[filtered]);

  const retrofitPipeline=useMemo(()=>{
    const statuses=['Not Started','Planned','In Progress','Completed'];
    return statuses.map(s=>({status:s,count:filtered.filter(b=>b.retrofitStatus===s).length,cost:Math.floor(filtered.filter(b=>b.retrofitStatus===s).reduce((sum,b)=>sum+b.retrofitCost,0)/1e6)}));
  },[filtered]);

  const certPipeline=useMemo(()=>{
    const schemes=['LEED','BREEAM','WELL','NABERS','DGNB','None'];
    return schemes.map(s=>({scheme:s,count:filtered.filter(b=>b.certScheme===s).length}));
  },[filtered]);

  const portfolioRadar=useMemo(()=>[
    {metric:'Energy',score:Math.floor(100-buildings.reduce((s,b)=>s+b.intensity,0)/buildings.length/3)},
    {metric:'Certification',score:Math.floor(buildings.filter(b=>b.certified).length/buildings.length*100)},
    {metric:'Resilience',score:Math.floor(buildings.reduce((s,b)=>s+b.resilience,0)/Math.max(1,buildings.length))},
    {metric:'Green Lease',score:Math.floor(buildings.filter(b=>b.greenLease).length/buildings.length*100)},
    {metric:'GRESB',score:Math.floor(buildings.reduce((s,b)=>s+b.gresbScore,0)/Math.max(1,buildings.length))},
    {metric:'Carbon',score:Math.floor(100-buildings.reduce((s,b)=>s+b.embodiedCarbon,0)/buildings.length/4)},
  ],[]);

  const boardSections=useMemo(()=>[
    {title:'Portfolio Summary',content:`${buildings.length} buildings, £${(buildings.reduce((s,b)=>s+b.value,0)/1e9).toFixed(1)}B value, ${CITIES.filter(c=>buildings.some(b=>b.city===c)).length} cities`},
    {title:'Energy & Carbon',content:`Avg intensity ${Math.floor(buildings.reduce((s,b)=>s+b.intensity,0)/Math.max(1,buildings.length))} kWh/m², ${Math.floor(buildings.reduce((s,b)=>s+b.co2,0)/1000)}k tCO₂ total, ${Math.floor(buildings.filter(b=>b.crremAligned).length/buildings.length*100)}% CRREM aligned`},
    {title:'Certification',content:`${Math.floor(buildings.filter(b=>b.certified).length/buildings.length*100)}% certified, green premium +8-12%, ${buildings.filter(b=>b.certScheme==='LEED').length} LEED + ${buildings.filter(b=>b.certScheme==='BREEAM').length} BREEAM`},
    {title:'Climate Resilience',content:`Avg resilience ${Math.floor(buildings.reduce((s,b)=>s+b.resilience,0)/Math.max(1,buildings.length))}/100, ${buildings.filter(b=>b.riskScore>70).length} critical risk, £${Math.floor(buildings.reduce((s,b)=>s+b.insurancePrem,0)/1e6)}M insurance`},
    {title:'Tenant Engagement',content:`${Math.floor(buildings.filter(b=>b.greenLease).length/buildings.length*100)}% green leases, ${buildings.reduce((s,b)=>s+b.tenantCount,0)} tenants across portfolio`},
    {title:'Regulatory Compliance',content:`MEES 2027: ${buildings.filter(b=>b.epcIdx>=2).length} buildings need upgrade, EPBD recast readiness ongoing`},
    {title:'Capex Pipeline',content:`£${Math.floor(buildings.filter(b=>b.retrofitStatus!=='Completed').reduce((s,b)=>s+b.retrofitCost,0)/1e6)}M total pipeline, ${retrofitPipeline.find(r=>r.status==='In Progress')?.count||0} in progress`},
    {title:'GRESB Performance',content:`Score ${Math.floor(buildings.reduce((s,b)=>s+b.gresbScore,0)/Math.max(1,buildings.length))}/100, top quartile target, +4 pts YoY improvement`},
  ],[retrofitPipeline]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  return(
    <div style={sty.page}>
      <div style={sty.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 style={sty.title}>Real Estate ESG Hub</h1>
            <div style={sty.subtitle}>EP-AS6 / Portfolio Intelligence / {buildings.length} buildings · 5 sub-modules</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={sty.exportBtn} onClick={()=>{}}>Export CSV</button>
            <button style={{...sty.exportBtn,background:T.gold}} onClick={()=>{}}>GRESB Submit</button>
          </div>
        </div>
      </div>

      <div style={sty.tabs}>{TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}</div>

      {tab===0&&(
        <div>
          <div style={sty.kpiRow}>
            {kpis.map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.value}</div><div style={sty.kpiLabel}>{k.label}</div><div style={sty.kpiTrend}>{k.trend}</div></div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
            {SUB_MODULES.map(m=>(
              <div key={m.id} style={sty.moduleCard(m.color)}>
                <div style={{fontSize:20,marginBottom:6}}>{m.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{m.name}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{m.desc}</div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:T.mono,color:m.color,marginTop:8}}>{m.kpi}</div>
                <div style={{marginTop:6}}><span style={sty.badge(T.green)}>{m.status}</span></div>
              </div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>EPC Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={epcDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="rating" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" radius={[4,4,0,0]}>{epcDist.map((e,i)=><Cell key={i} fill={EPC_COLORS[e.rating]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>CRREM Alignment Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={crremTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="aligned" name="% Aligned" stroke={T.green} fill={T.green+'22'} strokeWidth={2}/><Line type="monotone" dataKey="intensity" name="Avg kWh/m²" stroke={T.navy} strokeWidth={2}/></AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={sty.cardTitle}>Active Alerts ({filteredAlerts.length})</div>
              <div style={{display:'flex',gap:6}}>
                {['All','critical','high','medium','low'].map(s=><span key={s} style={{...sty.pill(alertSeverity===s),fontSize:11,padding:'3px 10px'}} onClick={()=>setAlertSeverity(s)}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>)}
              </div>
            </div>
            <div style={{maxHeight:300,overflowY:'auto'}}>
              {filteredAlerts.map(a=>(
                <div key={a.id} style={sty.alertRow(a.severity)}>
                  <span style={{...sty.badge(SEVERITY_COLORS[a.severity]),minWidth:60,textAlign:'center'}}>{a.severity}</span>
                  <span style={{fontSize:11,fontFamily:T.mono,color:T.textSec,minWidth:30}}>{a.module}</span>
                  <span style={{fontSize:12,flex:1}}>{a.msg}</span>
                  <span style={{fontSize:11,color:T.navyL,fontWeight:600,whiteSpace:'nowrap'}}>{a.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab===1&&(
        <div>
          <div style={sty.filterRow}>
            <select style={sty.select} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="All">All Types</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select style={sty.select} value={cityFilter} onChange={e=>setCityFilter(e.target.value)}><option value="All">All Cities</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select>
            <input style={{...sty.select,width:200}} placeholder="Search buildings..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Portfolio ESG Radar</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={portfolioRadar}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="metric" tick={{fontSize:11,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/><Radar name="Portfolio" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/></RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>GRESB Score Trend</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={gresbTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis domain={[40,80]} tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="score" name="Our Score" stroke={T.navy} strokeWidth={2}/><Line type="monotone" dataKey="benchmark" name="Benchmark" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5"/><Line type="monotone" dataKey="peer" name="Peer Avg" stroke={T.textMut} strokeWidth={1}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Unified Building Portfolio ({filtered.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr>{['Name','Type','City','EPC','kWh/m²','CRREM','Cert','Resilience','GRESB','Value','Green Lease','Retrofit'].map((h,i)=>{
                  const cols=['name','type','city','epcIdx','intensity','strandingYear','certified','resilience','gresbScore','value','greenLease','retrofitStatus'];
                  return <th key={i} style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort(cols[i])}>{h}</th>;
                })}</tr></thead>
                <tbody>{filtered.slice(0,80).map(b=>(
                  <tr key={b.id}>
                    <td style={sty.td}>{b.name}</td><td style={sty.td}>{b.type}</td><td style={sty.td}>{b.city}</td>
                    <td style={sty.td}><span style={sty.badge(EPC_COLORS[b.epc])}>{b.epc}</span></td>
                    <td style={sty.td}>{b.intensity}</td>
                    <td style={sty.td}><span style={sty.badge(b.strandingYear>2040?T.green:b.strandingYear>2030?T.amber:T.red)}>{b.strandingYear}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.certified?T.green:T.textMut)}>{b.certified?b.certScheme:'None'}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.resilience>60?T.green:b.resilience>40?T.amber:T.red)}>{b.resilience}</span></td>
                    <td style={sty.td}>{b.gresbScore}</td>
                    <td style={sty.td}>£{(b.value/1e6).toFixed(1)}M</td>
                    <td style={sty.td}><span style={sty.badge(b.greenLease?T.green:T.textMut)}>{b.greenLease?'Yes':'No'}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.retrofitStatus==='Completed'?T.green:b.retrofitStatus==='In Progress'?T.amber:T.textMut)}>{b.retrofitStatus}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Retrofit Status:</span>
            <select style={sty.select} value={retrofitFilter} onChange={e=>setRetrofitFilter(e.target.value)}>
              <option value="All">All</option>{['Not Started','Planned','In Progress','Completed'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={sty.kpiRow}>
            {[{v:`£${Math.floor(buildings.filter(b=>b.retrofitStatus!=='Completed').reduce((s,b)=>s+b.retrofitCost,0)/1e6)}M`,l:'Total Retrofit Pipeline'},{v:retrofitPipeline.find(r=>r.status==='In Progress')?.count||0,l:'In Progress'},{v:retrofitPipeline.find(r=>r.status==='Planned')?.count||0,l:'Planned'},{v:retrofitPipeline.find(r=>r.status==='Completed')?.count||0,l:'Completed'},{v:`${Math.floor(buildings.filter(b=>b.greenLease).length/buildings.length*100)}%`,l:'Green Lease Rate'},{v:`${Math.floor(buildings.filter(b=>b.certified).length/buildings.length*100)}%`,l:'Certification Rate'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Retrofit Pipeline by Status</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={retrofitPipeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="status" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="count" name="Buildings" fill={T.navy} radius={[4,4,0,0]}/><Bar dataKey="cost" name="Cost (£M)" fill={T.gold} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Certification Pipeline</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={certPipeline.filter(c=>c.count>0)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="scheme" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" name="Buildings" radius={[4,4,0,0]}>{certPipeline.filter(c=>c.count>0).map((_,i)=><Cell key={i} fill={[T.green,T.navyL,'#7c3aed','#ea580c','#0891b2',T.textMut][i]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Certification Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={certTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Area type="monotone" dataKey="leed" name="LEED" stroke={T.green} fill={T.green+'22'} stackId="1"/><Area type="monotone" dataKey="breeam" name="BREEAM" stroke={T.navyL} fill={T.navyL+'22'} stackId="1"/><Area type="monotone" dataKey="well" name="WELL" stroke="#7c3aed" fill="#7c3aed22" stackId="1"/></AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Tenant Engagement Overview</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={[{name:'Green Lease',value:filtered.filter(b=>b.greenLease).length},{name:'Standard Lease',value:filtered.filter(b=>!b.greenLease).length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  <Cell fill={T.green}/><Cell fill={T.textMut}/>
                </Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Retrofit Project Details</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr><th style={sty.th}>Building</th><th style={sty.th}>Type</th><th style={sty.th}>EPC</th><th style={sty.th}>Status</th><th style={sty.th}>Cost</th><th style={sty.th}>Intensity</th><th style={sty.th}>CRREM Year</th><th style={sty.th}>Priority</th></tr></thead>
                <tbody>{filtered.filter(b=>b.retrofitStatus!=='Completed').slice(0,40).map(b=>(
                  <tr key={b.id}><td style={sty.td}>{b.name}</td><td style={sty.td}>{b.type}</td>
                    <td style={sty.td}><span style={sty.badge(EPC_COLORS[b.epc])}>{b.epc}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.retrofitStatus==='In Progress'?T.amber:T.textMut)}>{b.retrofitStatus}</span></td>
                    <td style={sty.td}>£{(b.retrofitCost/1e6).toFixed(2)}M</td><td style={sty.td}>{b.intensity} kWh/m²</td>
                    <td style={sty.td}><span style={sty.badge(b.strandingYear<=2030?T.red:T.amber)}>{b.strandingYear}</span></td>
                    <td style={sty.td}><span style={sty.badge(b.strandingYear<=2028?T.red:b.strandingYear<=2035?T.amber:T.green)}>{b.strandingYear<=2028?'Critical':b.strandingYear<=2035?'High':'Medium'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===3&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Audience:</span>
            {['Board','Investment Committee','Sustainability Team','GRESB Assessor'].map(a=><span key={a} style={sty.pill(boardAudience===a)} onClick={()=>setBoardAudience(a)}>{a}</span>)}
            <button style={{...sty.exportBtn,marginLeft:'auto'}} onClick={()=>{}}>Export Report</button>
          </div>

          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={sty.cardTitle}>Real Estate ESG Board Report — {boardAudience}</div>
              <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Generated: {new Date().toISOString().split('T')[0]}</div>
            </div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:16,padding:'8px 12px',background:T.surfaceH,borderRadius:6}}>
              {boardAudience==='Board'&&'Executive summary for non-executive directors. Focus on strategic risks, regulatory compliance, and value protection.'}
              {boardAudience==='Investment Committee'&&'Detailed analysis for investment decisions. Focus on valuation impact, capex returns, and portfolio optimisation.'}
              {boardAudience==='Sustainability Team'&&'Operational detail for ESG team. Full metrics, programme progress, and improvement opportunities.'}
              {boardAudience==='GRESB Assessor'&&'GRESB submission format. Performance indicators, management approach, and year-on-year improvement.'}
            </div>
          </div>

          {boardSections.map((s,i)=>(
            <div key={i} style={sty.card}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color:T.gold,fontFamily:T.mono}}>0{i+1}</span>
                <div style={sty.cardTitle}>{s.title}</div>
              </div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>{s.content}</div>
            </div>
          ))}

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>GRESB Score Trajectory</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={gresbTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis domain={[40,80]} tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="score" name="Score" stroke={T.navy} strokeWidth={2}/><Line type="monotone" dataKey="benchmark" name="Benchmark" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5"/></LineChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Portfolio Type Mix</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={typeDist} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({type,count})=>`${type}: ${count}`}>
                  {typeDist.map((_,i)=><Cell key={i} fill={[T.navy,T.gold,T.sage,T.navyL,T.amber,T.teal][i]}/>)}
                </Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Key Performance Metrics</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {kpis.slice(0,8).map((k,i)=>(
                <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{k.value}</div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:4}}>{k.label}</div>
                  <div style={{fontSize:10,color:T.green,fontFamily:T.mono,marginTop:2}}>{k.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
