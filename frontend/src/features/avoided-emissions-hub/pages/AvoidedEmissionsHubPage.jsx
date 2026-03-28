import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Tabs ──────────────────────────────────────────────────────────────────── */
const TABS=['Executive Dashboard','Net Climate Impact','Credibility & Governance','Board Report'];
const PERIODS=['Q4 2025','YTD 2025','1Y'];

/* ── 150 companies seeded ──────────────────────────────────────────────────── */
const SECTORS=['Renewable Energy','Energy Storage','EV & Transport','Green Buildings','Sustainable Agriculture','Water & Waste','Carbon Capture','Hydrogen','Grid Modernisation','Circular Economy','Climate Software','Nature-Based Solutions'];
const COMPANY_NAMES=['SolarEdge','Vestas Wind','Orsted','Enphase Energy','First Solar','Plug Power','Bloom Energy','ChargePoint','Rivian','Proterra','Hannon Armstrong','Brookfield Renewable','NextEra Energy','Iberdrola','EDP Renovaveis','Siemens Gamesa','Northland Power','Clearway Energy','Sunnova','Sunrun','Array Technologies','Maxeon Solar','Canadian Solar','JinkoSolar','LONGi Green','TPI Composites','Shoals Tech','Stem Inc','Fluence Energy','EOS Energy','QuantumScape','Solid Power','FREYR Battery','Enovis','Altus Power','Montrose Environ','Clean Harbors','Republic Services','Waste Connections','Casella Waste','Li-Cycle','Redwood Materials','Umicore','Albemarle','Livent','Arcadium Lithium','MP Materials','Piedmont Lithium','ioneer','Standard Lithium','Energy Vault','Highview Power','Form Energy','Malta Inc','Ambri','ESS Tech','Invinity Energy','Primus Power','Zinc8 Energy','EnerVenue','Tesla Energy','BYD','NIO','Xpeng','Lucid Group','Fisker','Arrival','Canoo','Lordstown','Workhorse Group','Lightning eMotors','Blue Bird Corp','NFI Group','New Flyer','Ballard Power','Nikola','Hyzon Motors','Ceres Power','ITM Power','Nel ASA','McPhy Energy','Green Hydrogen Sys','Plug Power EU','HydrogenPro','Elcogen','SunHydrogen','Advent Tech','PowerCell Sweden','AFC Energy','Proton Motor','CarbonCure','Climeworks','Carbon Clean','Global Thermostat','Charm Industrial','Heirloom Carbon','Sustaera','Running Tide','Noya','Graphyte','Verdox','Carbon Engineering','44.01','RepAir','Carbfix','Mission Zero','Aker Carbon','Quest Carbon','Carbon Recycling','Svante','CO2 Solutions','LanzaTech','Twelve','Opus 12','Dimensional Energy','Cemvita Factory','Novamont','Danimer Sci','Origin Materials','Bolt Threads','Ecovative Design','MycoWorks','Solugen','Zymergen','Ginkgo Bioworks','Pivot Bio','Indigo Ag','Apeel Sciences','Plenty Unlimited','AeroFarms','AppHarvest','Bowery Farming','Gotham Greens','BrightFarms','Little Leaf Farms','Revol Greens','Kalera','Infarm','80 Acres Farms','Freight Farms','Iron Ox','Root AI','Mineral (Alphabet)','Blue River Tech','Bear Flag Robotics','Carbon Robotics','Verdant Robotics','Monarch Tractor','Naio Technologies'];

const genCompanies=()=>COMPANY_NAMES.slice(0,150).map((name,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);
  const sector=SECTORS[Math.floor(s*SECTORS.length)];
  const emitted=Math.round(50+s2*500);
  const avoided=Math.round(20+s3*800);
  const net=avoided-emitted;
  const credScore=Math.round(40+s4*55);
  const handprint=Math.round(10+sr(i*19+2)*90);
  const enablement=Math.round(5+sr(i*23+4)*85);
  const solutionRev=Math.round(10+sr(i*29+6)*80);
  const taxonomyPct=Math.round(5+sr(i*31+8)*70);
  const purePlay=sr(i*37+9)>0.55;
  const dqScore=Math.round(50+sr(i*41+10)*45);
  const credTier=credScore>=80?'High':credScore>=60?'Medium':'Low';
  return{id:i+1,name,sector,emitted,avoided,net,credScore,credTier,handprint,enablement,solutionRev,taxonomyPct,purePlay,dqScore,
    scope4:Math.round(avoided*0.85),attribution:Math.round(avoided*(0.5+sr(i*43)*0.4)),
    sdg:[7,9,11,12,13].filter((_,j)=>sr(i*47+j)>0.4),
    country:['US','EU','UK','JP','CN','AU','CA','IN','BR','KR'][Math.floor(sr(i*53)*10)]};
});

/* ── 12 KPIs ──────────────────────────────────────────────────────────────── */
const KPI_DEFS=[
  {id:'totalAvoided',label:'Total Avoided',unit:'MtCO\u2082e',fmt:v=>`${v.toFixed(1)}`},
  {id:'avoidedRatio',label:'Avoided / Emitted',unit:'x',fmt:v=>`${v.toFixed(2)}x`},
  {id:'solutionRev',label:'Climate Solution Revenue',unit:'%',fmt:v=>`${v.toFixed(1)}%`},
  {id:'netImpact',label:'Portfolio Net Impact',unit:'MtCO\u2082e',fmt:v=>`${v>0?'+':''}${v.toFixed(1)}`},
  {id:'handprint',label:'Handprint Score',unit:'/100',fmt:v=>`${v.toFixed(0)}`},
  {id:'enablement',label:'Enablement Ratio',unit:'%',fmt:v=>`${v.toFixed(1)}%`},
  {id:'credibility',label:'Credibility Score',unit:'/100',fmt:v=>`${v.toFixed(0)}`},
  {id:'solutionExp',label:'Solution Exposure',unit:'%',fmt:v=>`${v.toFixed(1)}%`},
  {id:'purePlay',label:'Pure-Play Count',unit:'',fmt:v=>`${v}`},
  {id:'topCategory',label:'Top Avoided Category',unit:'',fmt:v=>v},
  {id:'attrCoverage',label:'Attribution Coverage',unit:'%',fmt:v=>`${v.toFixed(1)}%`},
  {id:'taxAlign',label:'Taxonomy Alignment',unit:'%',fmt:v=>`${v.toFixed(1)}%`},
];

const computeKPIs=(companies,period)=>{
  const pMul=period==='Q4 2025'?0.25:period==='YTD 2025'?0.75:1.0;
  const totalAvoided=companies.reduce((a,c)=>a+c.avoided,0)*pMul/1000;
  const totalEmitted=companies.reduce((a,c)=>a+c.emitted,0)*pMul/1000;
  const avoidedRatio=totalEmitted>0?totalAvoided/totalEmitted:0;
  const avgSolRev=companies.reduce((a,c)=>a+c.solutionRev,0)/companies.length;
  const netImpact=totalAvoided-totalEmitted;
  const avgHandprint=companies.reduce((a,c)=>a+c.handprint,0)/companies.length;
  const avgEnablement=companies.reduce((a,c)=>a+c.enablement,0)/companies.length;
  const avgCred=companies.reduce((a,c)=>a+c.credScore,0)/companies.length;
  const solutionExp=companies.filter(c=>c.solutionRev>50).length/companies.length*100;
  const purePlayCount=companies.filter(c=>c.purePlay).length;
  const cats={};companies.forEach(c=>{cats[c.sector]=(cats[c.sector]||0)+c.avoided;});
  const topCat=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]?.[0]||'N/A';
  const attrCov=companies.filter(c=>c.attribution>0).length/companies.length*100;
  const avgTax=companies.reduce((a,c)=>a+c.taxonomyPct,0)/companies.length;
  return{totalAvoided,avoidedRatio,solutionRev:avgSolRev,netImpact,handprint:avgHandprint,
    enablement:avgEnablement,credibility:avgCred,solutionExp,purePlay:purePlayCount,
    topCategory:topCat,attrCoverage:attrCov,taxAlign:avgTax};
};

/* ── 20 Alerts ─────────────────────────────────────────────────────────────── */
const INITIAL_ALERTS=[
  {id:1,level:'red',text:'3 companies claim >500ktCO2e avoided without third-party verification',module:'Credibility',ts:'2h ago'},
  {id:2,level:'red',text:'Double-counting detected: Solar panel manufacturer + installer both claiming same avoided emissions',module:'Attribution',ts:'3h ago'},
  {id:3,level:'red',text:'Portfolio net impact turned negative in Q3 scenario stress test',module:'Net Impact',ts:'4h ago'},
  {id:4,level:'amber',text:'Handprint score methodology update pending PCAF guidance v3.0',module:'Handprint',ts:'5h ago'},
  {id:5,level:'amber',text:'12 companies missing Scope 4 data for current reporting period',module:'Calculator',ts:'6h ago'},
  {id:6,level:'amber',text:'Enablement ratio dropped 3.2pp QoQ across transport sector',module:'Enablement',ts:'7h ago'},
  {id:7,level:'amber',text:'Taxonomy alignment below 30% for 18 holdings requiring remediation',module:'Taxonomy',ts:'8h ago'},
  {id:8,level:'amber',text:'Attribution coverage gap: 22 companies using estimated rather than reported data',module:'Attribution',ts:'9h ago'},
  {id:9,level:'green',text:'Pure-play climate solution exposure increased to 42% of portfolio',module:'Portfolio',ts:'10h ago'},
  {id:10,level:'green',text:'Credibility score improved 4.2pts QoQ following enhanced verification',module:'Credibility',ts:'11h ago'},
  {id:11,level:'red',text:'ISSB S2 para 29(c) avoided emissions disclosure gap identified',module:'Taxonomy',ts:'12h ago'},
  {id:12,level:'amber',text:'Hydrogen sector avoided emissions claims under regulatory review',module:'Credibility',ts:'13h ago'},
  {id:13,level:'amber',text:'Carbon capture company reclassified from enabler to direct solution',module:'Enablement',ts:'14h ago'},
  {id:14,level:'green',text:'Board report generated successfully for Q4 2025 with full data coverage',module:'Report',ts:'15h ago'},
  {id:15,level:'red',text:'Peer comparison shows portfolio handprint score 8pts below median',module:'Handprint',ts:'16h ago'},
  {id:16,level:'amber',text:'Nature-based solutions sector showing data quality score <60',module:'Calculator',ts:'17h ago'},
  {id:17,level:'green',text:'SDG 7 contribution mapping completed for all 150 holdings',module:'Portfolio',ts:'18h ago'},
  {id:18,level:'amber',text:'Grid modernisation companies lacking counterfactual baseline documentation',module:'Credibility',ts:'19h ago'},
  {id:19,level:'green',text:'Automated taxonomy screening updated with EU TEG latest criteria',module:'Taxonomy',ts:'20h ago'},
  {id:20,level:'red',text:'Climate solution revenue threshold breach: 5 companies below 20% minimum',module:'Portfolio',ts:'21h ago'},
];

/* ── Quarterly trend data (12 quarters) ────────────────────────────────────── */
const QUARTERS=['Q1 23','Q2 23','Q3 23','Q4 23','Q1 24','Q2 24','Q3 24','Q4 24','Q1 25','Q2 25','Q3 25','Q4 25'];
const genTrend=()=>QUARTERS.map((q,i)=>({
  quarter:q,
  emitted:Math.round(180+sr(i*71)*40-i*4),
  avoided:Math.round(120+sr(i*73)*30+i*8),
  net:0,
})).map(d=>({...d,net:d.avoided-d.emitted}));

/* ── Sector distribution ───────────────────────────────────────────────────── */
const SECTOR_COLORS=[T.navy,T.sage,T.gold,T.navyL,T.sageL,T.goldL,'#8b5e3c','#6a7b8a','#a3816a','#4a7a8a','#7a6a8a','#8a7a5a'];

/* ── Board report sections ─────────────────────────────────────────────────── */
const BOARD_SECTIONS=[
  {id:'exec',label:'Executive Summary',icon:'\u{1F4CA}'},
  {id:'netImpact',label:'Portfolio Net Impact',icon:'\u{1F30D}'},
  {id:'avoidedCat',label:'Avoided Emissions by Category',icon:'\u{1F33F}'},
  {id:'solutionExp',label:'Climate Solution Exposure',icon:'\u2600'},
  {id:'enablement',label:'Enablement Analysis',icon:'\u{1F517}'},
  {id:'credibility',label:'Credibility Assessment',icon:'\u{1F6E1}'},
  {id:'taxonomy',label:'Taxonomy Alignment',icon:'\u{1F4D0}'},
  {id:'recommendations',label:'Recommendations',icon:'\u{1F4DD}'},
];

/* ── Credibility tiers ─────────────────────────────────────────────────────── */
const CRED_METHODS=['ISO 14064-2','GHG Protocol Scope 4','PCAF Avoided','EU Taxonomy Art.18','SBTi FLAG','ISSB S2 para 29','Custom Internal','PAS 2080'];

/* ── Sub-module cards ──────────────────────────────────────────────────────── */
const SUB_MODULES=[
  {id:'calc',name:'Scope 4 Calculator',desc:'Quantify avoided emissions across portfolio',stat:'avoided',statLabel:'Total Avoided (kt)'},
  {id:'handprint',name:'Handprint Analytics',desc:'Positive climate contribution scoring',stat:'handprint',statLabel:'Avg Handprint'},
  {id:'enable',name:'Enablement Mapping',desc:'Enabler vs direct solution classification',stat:'enablement',statLabel:'Avg Enablement %'},
  {id:'portfolio',name:'Portfolio Lens',desc:'Net climate impact & exposure analysis',stat:'solutionExp',statLabel:'Solution Exposure %'},
  {id:'taxonomy',name:'Taxonomy Screening',desc:'EU/ISSB taxonomy alignment scoring',stat:'taxAlign',statLabel:'Avg Alignment %'},
];

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20},
  title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,marginTop:4},
  tabs:{display:'flex',gap:4,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`,marginBottom:20},
  tab:(a)=>({padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:a?600:500,cursor:'pointer',border:'none',
    background:a?T.navy:'transparent',color:a?'#fff':T.textSec,transition:'all 0.2s'}),
  card:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16,marginBottom:16},
  cardH:{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:16,marginBottom:16,cursor:'pointer',transition:'all 0.15s'},
  kpiGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:20},
  kpiCard:(highlight)=>({background:highlight?`${T.sage}08`:T.surface,borderRadius:10,border:`1px solid ${highlight?T.sage:T.border}`,padding:'14px 16px'}),
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textMut,marginTop:2,textTransform:'uppercase',letterSpacing:'0.5px'},
  kpiUnit:{fontSize:11,color:T.textSec,marginLeft:4},
  row:{display:'flex',gap:16,marginBottom:16},
  flex1:{flex:1,minWidth:0},
  sectionTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  badge:(color)=>({display:'inline-block',padding:'2px 8px',borderRadius:8,fontSize:11,fontWeight:600,
    background:color===T.red?'#fef2f2':color===T.amber?'#fffbeb':color===T.green?'#f0fdf4':'#f5f5f5',
    color:color}),
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,textTransform:'uppercase'},
  td:{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12},
  toggle:{display:'flex',gap:2,background:T.surfaceH,borderRadius:8,padding:2},
  toggleBtn:(a)=>({padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:a?600:500,cursor:'pointer',border:'none',
    background:a?T.navy:'transparent',color:a?'#fff':T.textSec}),
  alertRow:(level)=>({display:'flex',alignItems:'flex-start',gap:10,padding:'8px 12px',borderRadius:8,
    background:level==='red'?'#fef2f2':level==='amber'?'#fffbeb':'#f0fdf4',marginBottom:6}),
  alertDot:(level)=>({width:8,height:8,borderRadius:4,marginTop:5,flexShrink:0,
    background:level==='red'?T.red:level==='amber'?T.amber:T.green}),
  slider:{width:'100%',accentColor:T.sage},
  btn:(primary)=>({padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:primary?'none':`1px solid ${T.border}`,
    background:primary?T.navy:T.surface,color:primary?'#fff':T.text,transition:'all 0.15s'}),
  expandBtn:{background:'none',border:'none',cursor:'pointer',fontSize:12,color:T.navyL,fontWeight:600,padding:'4px 0'},
  printHide:'@media print { .no-print { display: none !important; } }',
  checkbox:{width:16,height:16,accentColor:T.sage,cursor:'pointer'},
};

/* ── Tooltip ───────────────────────────────────────────────────────────────── */
const CT=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 12px',fontSize:12,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
    <div style={{fontWeight:600,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}{p.unit||''}</div>)}
  </div>);
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function AvoidedEmissionsHubPage(){
  const [tab,setTab]=useState(0);
  const [period,setPeriod]=useState('YTD 2025');
  const [alerts,setAlerts]=useState(INITIAL_ALERTS);
  const [dismissedAlerts,setDismissedAlerts]=useState(new Set());
  const [expandedCompany,setExpandedCompany]=useState(null);
  const [scenarioSlider,setScenarioSlider]=useState(0);
  const [boardAudience,setBoardAudience]=useState('Board');
  const [boardSections,setBoardSections]=useState(()=>new Set(BOARD_SECTIONS.map(s=>s.id)));
  const [boardExpanded,setBoardExpanded]=useState(new Set());
  const [boardDetailMode,setBoardDetailMode]=useState(false);
  const [boardDateFrom,setBoardDateFrom]=useState('2025-01-01');
  const [boardDateTo,setBoardDateTo]=useState('2025-12-31');
  const [auditRunning,setAuditRunning]=useState(false);
  const [auditComplete,setAuditComplete]=useState(false);
  const [sortCol,setSortCol]=useState('avoided');
  const [sortDir,setSortDir]=useState('desc');
  const [credFilter,setCredFilter]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');

  const companies=useMemo(()=>genCompanies(),[]);
  const kpis=useMemo(()=>computeKPIs(companies,period),[companies,period]);
  const trendData=useMemo(()=>genTrend(),[]);

  const sectorDist=useMemo(()=>{
    const m={};companies.forEach(c=>{m[c.sector]=(m[c.sector]||0)+c.avoided;});
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[companies]);

  const filteredCompanies=useMemo(()=>{
    let f=companies;
    if(searchTerm)f=f.filter(c=>c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(sectorFilter!=='All')f=f.filter(c=>c.sector===sectorFilter);
    if(credFilter!=='All')f=f.filter(c=>c.credTier===credFilter);
    f=[...f].sort((a,b)=>sortDir==='desc'?(b[sortCol]||0)-(a[sortCol]||0):(a[sortCol]||0)-(b[sortCol]||0));
    return f;
  },[companies,searchTerm,sectorFilter,credFilter,sortCol,sortDir]);

  const top10=useMemo(()=>[...companies].sort((a,b)=>b.avoided-a.avoided).slice(0,10),[companies]);

  const [selectedSector,setSelectedSector]=useState('All');
  const [countryView,setCountryView]=useState('All');
  const [auditTrailPage,setAuditTrailPage]=useState(0);

  const visibleAlerts=alerts.filter(a=>!dismissedAlerts.has(a.id));
  const dismissAlert=useCallback((id)=>setDismissedAlerts(prev=>new Set([...prev,id])),[]);

  const handleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const runAudit=useCallback(()=>{
    setAuditRunning(true);setAuditComplete(false);
    setTimeout(()=>{setAuditRunning(false);setAuditComplete(true);},2800);
  },[]);

  const toggleBoardSection=(id)=>{
    setBoardSections(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  };
  const toggleBoardExpand=(id)=>{
    setBoardExpanded(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  };

  const scenarioNetImpact=useMemo(()=>{
    const base=kpis.netImpact;
    const boost=scenarioSlider/100;
    return base+(base*boost*0.6);
  },[kpis.netImpact,scenarioSlider]);

  /* ── Waterfall data ──────────────────────────────────────────────────────── */
  const waterfallData=useMemo(()=>{
    const sectorEmit={};const sectorAvoid={};
    companies.forEach(c=>{
      sectorEmit[c.sector]=(sectorEmit[c.sector]||0)+c.emitted;
      sectorAvoid[c.sector]=(sectorAvoid[c.sector]||0)+c.avoided;
    });
    const sectors=SECTORS.slice(0,8);
    return sectors.map(s=>({name:s.length>15?s.substring(0,14)+'..':s,emitted:-(sectorEmit[s]||0)/1000,avoided:(sectorAvoid[s]||0)/1000}));
  },[companies]);

  /* ── Credibility distribution ────────────────────────────────────────────── */
  const credDist=useMemo(()=>{
    const m={High:0,Medium:0,Low:0};
    companies.forEach(c=>{m[c.credTier]++;});
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[companies]);

  /* ── Radar data for governance ───────────────────────────────────────────── */
  const radarData=useMemo(()=>CRED_METHODS.map((m,i)=>({
    method:m.length>12?m.substring(0,11)+'..':m,
    compliance:Math.round(40+sr(i*91)*55),
    coverage:Math.round(30+sr(i*93)*65),
  })),[]);

  /* ── SDG mapping ─────────────────────────────────────────────────────────── */
  const sdgMap=useMemo(()=>{
    const m={};
    companies.forEach(c=>c.sdg.forEach(s=>{m[s]=(m[s]||0)+1;}));
    return Object.entries(m).map(([sdg,count])=>({sdg:`SDG ${sdg}`,count})).sort((a,b)=>b.count-a.count);
  },[companies]);

  /* ── Peer data ───────────────────────────────────────────────────────────── */
  const peerData=useMemo(()=>[
    {name:'Our Portfolio',avoided:kpis.totalAvoided,credibility:kpis.credibility,handprint:kpis.handprint,highlight:true},
    {name:'Peer Avg',avoided:kpis.totalAvoided*0.82,credibility:kpis.credibility*0.88,handprint:kpis.handprint*0.9,highlight:false},
    {name:'Top Quartile',avoided:kpis.totalAvoided*1.15,credibility:kpis.credibility*1.08,handprint:kpis.handprint*1.12,highlight:false},
    {name:'Benchmark',avoided:kpis.totalAvoided*0.7,credibility:kpis.credibility*0.78,handprint:kpis.handprint*0.8,highlight:false},
  ],[kpis]);

  /* ── Country breakdown ────────────────────────────────────────────────────── */
  const countryBreakdown=useMemo(()=>{
    const m={};
    companies.forEach(c=>{
      if(!m[c.country])m[c.country]={country:c.country,count:0,avoided:0,emitted:0,avgCred:0};
      m[c.country].count++;m[c.country].avoided+=c.avoided;m[c.country].emitted+=c.emitted;m[c.country].avgCred+=c.credScore;
    });
    return Object.values(m).map(d=>({...d,avgCred:Math.round(d.avgCred/d.count),net:d.avoided-d.emitted})).sort((a,b)=>b.avoided-a.avoided);
  },[companies]);

  /* ── Enabler vs Direct breakdown ─────────────────────────────────────────── */
  const enablerBreakdown=useMemo(()=>{
    const direct=companies.filter(c=>c.enablement<50);
    const enablers=companies.filter(c=>c.enablement>=50);
    return[
      {type:'Direct Solutions',count:direct.length,avoided:direct.reduce((a,c)=>a+c.avoided,0),pct:Math.round(direct.length/companies.length*100)},
      {type:'Enablers',count:enablers.length,avoided:enablers.reduce((a,c)=>a+c.avoided,0),pct:Math.round(enablers.length/companies.length*100)},
    ];
  },[companies]);

  /* ── Quarterly KPI deltas ────────────────────────────────────────────────── */
  const kpiDeltas=useMemo(()=>({
    totalAvoided:'+4.2%',avoidedRatio:'+0.08x',solutionRev:'+2.1pp',netImpact:'+8.1%',
    handprint:'+3.4pts',enablement:'-1.2pp',credibility:'+4.2pts',solutionExp:'+2.3pp',
    purePlay:'+3',topCategory:'unchanged',attrCoverage:'+1.8pp',taxAlign:'+3.1pp',
  }),[]);

  /* ── Audit trail ─────────────────────────────────────────────────────────── */
  const auditTrail=useMemo(()=>Array.from({length:40},(_,i)=>({
    id:i+1,
    timestamp:`2025-${String(Math.floor(1+sr(i*131)*12)).padStart(2,'0')}-${String(Math.floor(1+sr(i*137)*28)).padStart(2,'0')} ${String(Math.floor(sr(i*139)*24)).padStart(2,'0')}:${String(Math.floor(sr(i*141)*60)).padStart(2,'0')}`,
    action:['Avoided calc updated','Credibility rescored','Methodology changed','Attribution recalculated','Data source refreshed','Peer benchmark updated','Taxonomy screening run','Double-count check run'][Math.floor(sr(i*143)*8)],
    entity:COMPANY_NAMES[Math.floor(sr(i*147)*50)],
    user:['J. Chen','M. Patel','S. Williams','A. Kumar','L. Thompson'][Math.floor(sr(i*149)*5)],
    oldValue:Math.round(20+sr(i*151)*60),
    newValue:Math.round(25+sr(i*153)*65),
    status:['Approved','Pending','Auto'][Math.floor(sr(i*157)*3)],
  })),[]);

  /* ── Handprint trend by sector ───────────────────────────────────────────── */
  const handprintBySector=useMemo(()=>SECTORS.slice(0,8).map((s,i)=>({
    sector:s.length>14?s.substring(0,13)+'..':s,
    q1:Math.round(30+sr(i*161)*40),
    q2:Math.round(35+sr(i*163)*40),
    q3:Math.round(38+sr(i*167)*42),
    q4:Math.round(40+sr(i*169)*45),
  })),[]);

  /* ── Export / Print helpers ──────────────────────────────────────────────── */
  const exportCSV=useCallback(()=>{
    const header='Company,Sector,Emitted(kt),Avoided(kt),Net,CredScore,Handprint,Enablement%,SolutionRev%,TaxAlignment%\n';
    const rows=filteredCompanies.map(c=>`"${c.name}","${c.sector}",${c.emitted},${c.avoided},${c.net},${c.credScore},${c.handprint},${c.enablement},${c.solutionRev},${c.taxonomyPct}`).join('\n');
    const blob=new Blob([header+rows],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='avoided_emissions_hub.csv';a.click();
  },[filteredCompanies]);

  const handlePrint=useCallback(()=>window.print(),[]);

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 1: EXECUTIVE DASHBOARD
     ══════════════════════════════════════════════════════════════════════════ */
  const renderExecutive=()=>(
    <div>
      {/* Period toggle */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={S.sectionTitle}>Portfolio Overview</div>
        <div style={S.toggle}>
          {PERIODS.map(p=><button key={p} style={S.toggleBtn(period===p)} onClick={()=>setPeriod(p)}>{p}</button>)}
        </div>
      </div>

      {/* 12 KPIs */}
      <div style={S.kpiGrid}>
        {KPI_DEFS.map((k,i)=>{
          const val=kpis[k.id];
          const highlight=i<4;
          return(
            <div key={k.id} style={S.kpiCard(highlight)}>
              <div style={S.kpiLabel}>{k.label}</div>
              <div style={{display:'flex',alignItems:'baseline',marginTop:4}}>
                <span style={S.kpiVal}>{k.fmt(val)}</span>
                <span style={S.kpiUnit}>{k.unit}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
                <span style={{fontSize:10,color:k.id==='netImpact'?(val>0?T.green:T.red):T.textMut}}>
                  {k.id==='netImpact'?(val>0?'Net positive':'Net negative'):
                   k.id==='topCategory'?'Largest contributor':
                   `${period} period`}
                </span>
                <span style={{fontSize:10,fontWeight:600,color:kpiDeltas[k.id]?.startsWith('-')?T.red:kpiDeltas[k.id]?.startsWith('+')?T.green:T.textMut}}>
                  {kpiDeltas[k.id]||''} QoQ
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-module cards */}
      <div style={S.sectionTitle}>Sub-Module Status</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12,marginBottom:20}}>
        {SUB_MODULES.map(m=>{
          const val=m.stat==='avoided'?Math.round(kpis.totalAvoided*1000):
                   m.stat==='handprint'?Math.round(kpis.handprint):
                   m.stat==='enablement'?kpis.enablement.toFixed(1):
                   m.stat==='solutionExp'?kpis.solutionExp.toFixed(1):
                   kpis.taxAlign.toFixed(1);
          return(
            <div key={m.id} style={{...S.card,borderLeft:`3px solid ${T.sage}`}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{m.name}</div>
              <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{m.desc}</div>
              <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <span style={{fontSize:18,fontWeight:700,color:T.sage,fontFamily:T.mono}}>{val}</span>
                <span style={{fontSize:10,color:T.textMut}}>{m.statLabel}</span>
              </div>
              <div style={{marginTop:6,height:4,background:T.surfaceH,borderRadius:2}}>
                <div style={{height:4,borderRadius:2,background:T.sage,width:`${Math.min(100,typeof val==='number'?val/5:parseFloat(val))}%`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div style={S.row}>
        {/* Net climate impact trend */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Net Climate Impact Trend (12Q)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="emitted" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Emitted (kt)"/>
              <Area type="monotone" dataKey="avoided" stroke={T.green} fill={T.green} fillOpacity={0.15} name="Avoided (kt)"/>
              <Line type="monotone" dataKey="net" stroke={T.navy} strokeWidth={2} dot={false} name="Net Impact"/>
              <Legend/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Solution category donut */}
        <div style={{...S.card,width:320,flexShrink:0}}>
          <div style={S.sectionTitle}>Solution Category Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sectorDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                {sectorDist.map((_,i)=><Cell key={i} fill={SECTOR_COLORS[i%SECTOR_COLORS.length]}/>)}
              </Pie>
              <Tooltip content={<CT/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {sectorDist.slice(0,6).map((s,i)=>(
              <span key={s.name} style={{fontSize:10,color:SECTOR_COLORS[i],display:'flex',alignItems:'center',gap:3}}>
                <span style={{width:8,height:8,borderRadius:4,background:SECTOR_COLORS[i],display:'inline-block'}}/>
                {s.name.length>18?s.name.substring(0,17)+'..':s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 table */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.sectionTitle}>Top 10 Climate Solution Companies</div>
          <button style={S.btn(false)} onClick={exportCSV}>Export CSV</button>
        </div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>#</th><th style={S.th}>Company</th><th style={S.th}>Sector</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort('avoided')}>Avoided (kt) {sortCol==='avoided'?(sortDir==='desc'?'\u25BC':'\u25B2'):''}</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort('emitted')}>Emitted (kt)</th>
              <th style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort('net')}>Net</th>
              <th style={S.th}>Cred</th><th style={S.th}>Handprint</th><th style={S.th}>Pure-Play</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((c,i)=>(
              <tr key={c.id} style={{background:i%2===0?'transparent':T.surfaceH,cursor:'pointer'}} onClick={()=>setExpandedCompany(expandedCompany===c.id?null:c.id)}>
                <td style={S.td}>{i+1}</td>
                <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                <td style={S.td}>{c.sector}</td>
                <td style={{...S.td,color:T.green,fontWeight:600,fontFamily:T.mono}}>{c.avoided.toLocaleString()}</td>
                <td style={{...S.td,color:T.red,fontFamily:T.mono}}>{c.emitted.toLocaleString()}</td>
                <td style={{...S.td,color:c.net>0?T.green:T.red,fontWeight:600,fontFamily:T.mono}}>{c.net>0?'+':''}{c.net.toLocaleString()}</td>
                <td style={S.td}><span style={S.badge(c.credTier==='High'?T.green:c.credTier==='Medium'?T.amber:T.red)}>{c.credTier}</span></td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.handprint}</td>
                <td style={S.td}>{c.purePlay?'\u2705':'\u2013'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Expanded company detail */}
        {expandedCompany&&(()=>{
          const c=companies.find(x=>x.id===expandedCompany);
          if(!c)return null;
          return(
            <div style={{marginTop:12,padding:16,borderRadius:10,background:T.surfaceH,border:`1px solid ${T.borderL}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{c.name}</div>
                  <div style={{fontSize:11,color:T.textSec}}>{c.sector} \u00B7 {c.country} \u00B7 {c.purePlay?'Pure-Play':'Diversified'}</div>
                </div>
                <button style={S.btn(false)} onClick={()=>setExpandedCompany(null)}>Close</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
                {[
                  {label:'Avoided',val:`${c.avoided} kt`,color:T.green},
                  {label:'Emitted',val:`${c.emitted} kt`,color:T.red},
                  {label:'Net Impact',val:`${c.net>0?'+':''}${c.net} kt`,color:c.net>0?T.green:T.red},
                  {label:'Credibility',val:`${c.credScore}/100`,color:c.credScore>=80?T.green:c.credScore>=60?T.amber:T.red},
                  {label:'Handprint',val:`${c.handprint}/100`,color:T.sage},
                  {label:'Taxonomy',val:`${c.taxonomyPct}%`,color:T.navyL},
                ].map(m=>(
                  <div key={m.label} style={{textAlign:'center',padding:10,borderRadius:8,background:T.surface,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,color:T.textMut}}>{m.label}</div>
                    <div style={{fontSize:16,fontWeight:700,color:m.color,fontFamily:T.mono,marginTop:2}}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,display:'flex',gap:16}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>SDG Contributions</div>
                  <div style={{display:'flex',gap:6}}>{c.sdg.map(s=>(
                    <span key={s} style={{...S.badge(T.sage),fontSize:10}}>SDG {s}</span>
                  ))}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Attribution</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:8,background:T.surfaceH,borderRadius:4}}>
                      <div style={{height:8,borderRadius:4,background:T.sage,width:`${Math.round(c.attribution/c.avoided*100)}%`}}/>
                    </div>
                    <span style={{fontSize:11,fontFamily:T.mono}}>{Math.round(c.attribution/c.avoided*100)}%</span>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Solution Revenue</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:8,background:T.surfaceH,borderRadius:4}}>
                      <div style={{height:8,borderRadius:4,background:T.gold,width:`${c.solutionRev}%`}}/>
                    </div>
                    <span style={{fontSize:11,fontFamily:T.mono}}>{c.solutionRev}%</span>
                  </div>
                </div>
              </div>
              <div style={{marginTop:10,fontSize:11,color:T.textMut}}>
                Enablement: {c.enablement}% \u00B7 DQ Score: {c.dqScore}/100 \u00B7 Scope 4: {c.scope4} kt \u00B7 Cred Tier: {c.credTier}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Handprint trend by sector */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Handprint Score Trend by Sector (4Q)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={handprintBySector}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip content={<CT/>}/>
            <Bar dataKey="q1" fill={T.border} name="Q1" radius={[2,2,0,0]}/>
            <Bar dataKey="q2" fill={T.gold} name="Q2" radius={[2,2,0,0]}/>
            <Bar dataKey="q3" fill={T.navyL} name="Q3" radius={[2,2,0,0]}/>
            <Bar dataKey="q4" fill={T.sage} name="Q4" radius={[2,2,0,0]}/>
            <Legend/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.sectionTitle}>Alerts & Notifications ({visibleAlerts.length})</div>
          <div style={{display:'flex',gap:6}}>
            {['red','amber','green'].map(l=>(
              <span key={l} style={{...S.badge(l==='red'?T.red:l==='amber'?T.amber:T.green),fontSize:10}}>
                {visibleAlerts.filter(a=>a.level===l).length} {l}
              </span>
            ))}
          </div>
        </div>
        {visibleAlerts.slice(0,8).map(a=>(
          <div key={a.id} style={S.alertRow(a.level)}>
            <div style={S.alertDot(a.level)}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,color:T.text}}>{a.text}</div>
              <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{a.module} \u00B7 {a.ts}</div>
            </div>
            <button style={{...S.btn(false),fontSize:10,padding:'3px 8px'}} onClick={()=>dismissAlert(a.id)}>Dismiss</button>
          </div>
        ))}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 2: NET CLIMATE IMPACT
     ══════════════════════════════════════════════════════════════════════════ */
  const renderNetImpact=()=>(
    <div>
      {/* Waterfall chart */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Emitted vs Avoided Waterfall by Sector</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} label={{value:'MtCO\u2082e',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textMut}}}/>
            <Tooltip content={<CT/>}/>
            <Bar dataKey="emitted" fill={T.red} name="Emitted" radius={[4,4,0,0]}/>
            <Bar dataKey="avoided" fill={T.green} name="Avoided" radius={[4,4,0,0]}/>
            <Legend/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={S.row}>
        {/* Attribution-adjusted impact */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Attribution-Adjusted Impact</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:T.textMut}}>Gross Avoided</div>
              <div style={{fontSize:20,fontWeight:700,color:T.green,fontFamily:T.mono}}>{kpis.totalAvoided.toFixed(1)}</div>
              <div style={{fontSize:10,color:T.textMut}}>MtCO\u2082e</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:T.textMut}}>Attribution Factor</div>
              <div style={{fontSize:20,fontWeight:700,color:T.gold,fontFamily:T.mono}}>{(kpis.attrCoverage/100*0.65).toFixed(2)}x</div>
              <div style={{fontSize:10,color:T.textMut}}>avg weighted</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:T.textMut}}>Net Attributed</div>
              <div style={{fontSize:20,fontWeight:700,color:T.sage,fontFamily:T.mono}}>{(kpis.totalAvoided*kpis.attrCoverage/100*0.65).toFixed(1)}</div>
              <div style={{fontSize:10,color:T.textMut}}>MtCO\u2082e</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="avoided" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="Attributed Avoided"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector contribution */}
        <div style={{...S.card,width:340,flexShrink:0}}>
          <div style={S.sectionTitle}>Sector Contribution Breakdown</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorDist.slice(0,8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.textMut}} width={100}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="value" fill={T.sage} radius={[0,4,4,0]} name="Avoided (kt)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Positive net impact companies */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Companies with Positive Net Impact (Avoided {'>'} Emitted)</div>
        <div style={{marginBottom:12,display:'flex',gap:12,alignItems:'center'}}>
          <input type="text" placeholder="Search company..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,width:200,fontFamily:T.font}}/>
          <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}
            style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{fontSize:11,color:T.textMut}}>{filteredCompanies.filter(c=>c.net>0).length} positive / {filteredCompanies.length} total</span>
        </div>
        <div style={{maxHeight:320,overflowY:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Company</th><th style={S.th}>Sector</th>
                <th style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort('net')}>Net Impact {sortCol==='net'?(sortDir==='desc'?'\u25BC':'\u25B2'):''}</th>
                <th style={S.th}>Avoided</th><th style={S.th}>Emitted</th><th style={S.th}>SDGs</th><th style={S.th}>Country</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.filter(c=>c.net>0).slice(0,20).map((c,i)=>(
                <tr key={c.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
                  <td style={{...S.td,fontWeight:600}}>{c.name}</td>
                  <td style={{...S.td,fontSize:11}}>{c.sector}</td>
                  <td style={{...S.td,color:T.green,fontWeight:700,fontFamily:T.mono}}>+{c.net}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{c.avoided}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{c.emitted}</td>
                  <td style={{...S.td,fontSize:10}}>{c.sdg.map(s=>`SDG${s}`).join(', ')}</td>
                  <td style={S.td}>{c.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario slider */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Scenario: Increase Solution Exposure</div>
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:T.textSec,marginBottom:6}}>
              Increase solution exposure by: <strong>{scenarioSlider}%</strong>
            </div>
            <input type="range" min={0} max={50} value={scenarioSlider} onChange={e=>setScenarioSlider(Number(e.target.value))} style={S.slider}/>
          </div>
          <div style={{textAlign:'center',minWidth:140}}>
            <div style={{fontSize:10,color:T.textMut}}>Projected Net Impact</div>
            <div style={{fontSize:24,fontWeight:700,color:scenarioNetImpact>0?T.green:T.red,fontFamily:T.mono}}>
              {scenarioNetImpact>0?'+':''}{scenarioNetImpact.toFixed(1)}
            </div>
            <div style={{fontSize:10,color:T.textMut}}>MtCO\u2082e</div>
            {scenarioSlider>0&&<div style={{fontSize:10,color:T.sage,marginTop:2}}>
              {((scenarioNetImpact-kpis.netImpact)/Math.abs(kpis.netImpact)*100).toFixed(1)}% vs baseline
            </div>}
          </div>
        </div>
      </div>

      <div style={S.row}>
        {/* Peer comparison */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Peer Comparison</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peerData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="avoided" fill={T.sage} name="Avoided (Mt)" radius={[4,4,0,0]}>
                {peerData.map((p,i)=><Cell key={i} fill={p.highlight?T.navy:T.sage}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SDG contribution */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>SDG Contribution Mapping</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sdgMap}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sdg" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="count" fill={T.gold} name="Companies" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Country breakdown */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.sectionTitle}>Geographic Distribution of Avoided Emissions</div>
          <select value={countryView} onChange={e=>setCountryView(e.target.value)}
            style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
            <option value="All">All Regions</option>
            {countryBreakdown.map(c=><option key={c.country} value={c.country}>{c.country}</option>)}
          </select>
        </div>
        <div style={S.row}>
          <div style={{flex:2}}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryView==='All'?countryBreakdown:countryBreakdown.filter(c=>c.country===countryView)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="country" tick={{fontSize:10,fill:T.textMut}}/>
                <YAxis tick={{fontSize:10,fill:T.textMut}}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="avoided" fill={T.green} name="Avoided (kt)" radius={[4,4,0,0]}/>
                <Bar dataKey="emitted" fill={T.red} name="Emitted (kt)" radius={[4,4,0,0]}/>
                <Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{flex:1}}>
            <table style={S.table}>
              <thead>
                <tr><th style={S.th}>Country</th><th style={S.th}>Cos</th><th style={S.th}>Net (kt)</th><th style={S.th}>Cred</th></tr>
              </thead>
              <tbody>
                {countryBreakdown.map((c,i)=>(
                  <tr key={c.country} style={{background:i%2===0?'transparent':T.surfaceH}}>
                    <td style={{...S.td,fontWeight:600}}>{c.country}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{c.count}</td>
                    <td style={{...S.td,color:c.net>0?T.green:T.red,fontFamily:T.mono}}>{c.net>0?'+':''}{c.net}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{c.avgCred}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enabler vs Direct breakdown */}
      <div style={S.row}>
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Enabler vs Direct Solution Breakdown</div>
          <div style={{display:'flex',gap:16}}>
            {enablerBreakdown.map((e,i)=>(
              <div key={e.type} style={{flex:1,textAlign:'center',padding:16,borderRadius:10,border:`1px solid ${T.border}`,background:i===0?`${T.sage}06`:`${T.gold}06`}}>
                <div style={{fontSize:11,color:T.textMut}}>{e.type}</div>
                <div style={{fontSize:28,fontWeight:700,color:i===0?T.sage:T.gold,fontFamily:T.mono,marginTop:4}}>{e.count}</div>
                <div style={{fontSize:11,color:T.textSec}}>companies ({e.pct}%)</div>
                <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:8,fontFamily:T.mono}}>{(e.avoided/1000).toFixed(1)} Mt</div>
                <div style={{fontSize:10,color:T.textMut}}>avoided</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Net Impact Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                {name:'Net Positive',value:companies.filter(c=>c.net>0).length},
                {name:'Net Negative',value:companies.filter(c=>c.net<=0).length},
              ]} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" paddingAngle={4}>
                <Cell fill={T.green}/><Cell fill={T.red}/>
              </Pie>
              <Tooltip content={<CT/>}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 3: CREDIBILITY & GOVERNANCE
     ══════════════════════════════════════════════════════════════════════════ */
  const renderCredibility=()=>{
    const methodCompliance=CRED_METHODS.map((m,i)=>({
      method:m,
      companies:Math.round(8+sr(i*101)*30),
      compliant:Math.round(5+sr(i*103)*25),
      issues:Math.round(sr(i*107)*8),
      dqAvg:Math.round(55+sr(i*109)*35),
    }));

    const doubleCounting=[
      {id:1,pair:'SolarEdge + Sunrun',type:'Generation vs Installation',amount:'42 kt',severity:'High',status:'Under Review'},
      {id:2,pair:'ChargePoint + BYD',type:'Infrastructure vs Vehicle',amount:'28 kt',severity:'Medium',status:'Resolved'},
      {id:3,pair:'Vestas + Orsted',type:'Manufacture vs Operation',amount:'67 kt',severity:'High',status:'Flagged'},
      {id:4,pair:'Bloom Energy + NextEra',type:'Equipment vs Generation',amount:'31 kt',severity:'Medium',status:'Under Review'},
      {id:5,pair:'Plug Power + Hyzon',type:'Production vs Use',amount:'15 kt',severity:'Low',status:'Resolved'},
    ];

    const redFlags=[
      {id:1,company:'Global Thermostat',flag:'Claimed avoided exceeds theoretical maximum by 2.3x',severity:'Critical'},
      {id:2,company:'Hydrogen sector (3 cos)',flag:'Methodology uses outdated grid emission factor (2018)',severity:'High'},
      {id:3,company:'Graphyte',flag:'Nature-based baseline undocumented',severity:'High'},
      {id:4,company:'Canoo',flag:'Revenue <$1M but claiming 200kt avoided',severity:'Critical'},
      {id:5,company:'Running Tide',flag:'Ocean CDR permanence claim unverified beyond 100yr',severity:'Medium'},
      {id:6,company:'Verdox',flag:'DAC energy source not fully renewable',severity:'Medium'},
      {id:7,company:'Carbon Recycling',flag:'Double-counted with downstream user',severity:'High'},
    ];

    const remediations=[
      {id:1,action:'Commission third-party verification for top 20 avoided emission claims',priority:'P1',deadline:'Q1 2026',owner:'Head of ESG'},
      {id:2,action:'Update grid emission factors to IEA 2025 dataset',priority:'P1',deadline:'Q4 2025',owner:'Data Team'},
      {id:3,action:'Implement automated double-counting detection across value chain',priority:'P2',deadline:'Q2 2026',owner:'Tech Lead'},
      {id:4,action:'Establish avoided emissions governance committee',priority:'P1',deadline:'Q4 2025',owner:'CIO'},
      {id:5,action:'Deploy continuous monitoring for credibility score changes',priority:'P2',deadline:'Q1 2026',owner:'Risk'},
    ];

    return(
    <div>
      <div style={S.row}>
        {/* Credibility tier distribution */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Credibility Tier Distribution</div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={credDist} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" paddingAngle={3}>
                  <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
                </Pie>
                <Tooltip content={<CT/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div>
              {credDist.map((d,i)=>(
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{width:12,height:12,borderRadius:6,background:i===0?T.green:i===1?T.amber:T.red}}/>
                  <span style={{fontSize:13,fontWeight:600}}>{d.name}</span>
                  <span style={{fontSize:12,color:T.textMut}}>({d.value} companies)</span>
                </div>
              ))}
              <div style={{marginTop:12,fontSize:12,color:T.textSec}}>
                Avg score: <strong>{kpis.credibility.toFixed(1)}</strong>/100
              </div>
            </div>
          </div>
        </div>

        {/* Radar: methodology compliance */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Methodology Compliance</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="method" tick={{fontSize:8,fill:T.textMut}}/>
              <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
              <Radar name="Compliance" dataKey="compliance" stroke={T.sage} fill={T.sage} fillOpacity={0.3}/>
              <Radar name="Coverage" dataKey="coverage" stroke={T.gold} fill={T.gold} fillOpacity={0.2}/>
              <Legend/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methodology compliance matrix */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Methodology Compliance Matrix</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Methodology</th><th style={S.th}>Companies Using</th>
              <th style={S.th}>Compliant</th><th style={S.th}>Issues</th><th style={S.th}>Avg DQ</th><th style={S.th}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {methodCompliance.map((m,i)=>{
              const rate=m.companies>0?Math.round(m.compliant/m.companies*100):0;
              return(
              <tr key={m.method} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...S.td,fontWeight:600}}>{m.method}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{m.companies}</td>
                <td style={{...S.td,color:T.green,fontFamily:T.mono}}>{m.compliant}</td>
                <td style={{...S.td,color:m.issues>3?T.red:T.amber,fontFamily:T.mono}}>{m.issues}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{m.dqAvg}/100</td>
                <td style={S.td}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:60,height:6,background:T.surfaceH,borderRadius:3}}>
                      <div style={{width:`${rate}%`,height:6,borderRadius:3,background:rate>80?T.green:rate>60?T.amber:T.red}}/>
                    </div>
                    <span style={{fontSize:10,fontFamily:T.mono}}>{rate}%</span>
                  </div>
                </td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>

      {/* Double-counting detection */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Double-Counting Detection</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Entity Pair</th><th style={S.th}>Type</th><th style={S.th}>Amount</th><th style={S.th}>Severity</th><th style={S.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {doubleCounting.map((d,i)=>(
              <tr key={d.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...S.td,fontWeight:600}}>{d.pair}</td>
                <td style={S.td}>{d.type}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{d.amount}</td>
                <td style={S.td}><span style={S.badge(d.severity==='High'?T.red:d.severity==='Medium'?T.amber:T.green)}>{d.severity}</span></td>
                <td style={S.td}><span style={S.badge(d.status==='Resolved'?T.green:T.amber)}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.row}>
        {/* Red flags */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Red Flags Across Portfolio</div>
          {redFlags.map(f=>(
            <div key={f.id} style={{...S.alertRow(f.severity==='Critical'?'red':f.severity==='High'?'amber':'green'),marginBottom:6}}>
              <div style={S.alertDot(f.severity==='Critical'?'red':f.severity==='High'?'amber':'green')}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600}}>{f.company}</div>
                <div style={{fontSize:11,color:T.textSec}}>{f.flag}</div>
              </div>
              <span style={S.badge(f.severity==='Critical'?T.red:f.severity==='High'?T.amber:T.green)}>{f.severity}</span>
            </div>
          ))}
        </div>

        {/* Governance + Audit */}
        <div style={{...S.card,...S.flex1}}>
          <div style={S.sectionTitle}>Governance & Audit</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>
            Governance framework defines which entities can claim avoided emissions and under what methodology.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
            {['Direct manufacturers','Project developers','Technology enablers','Financial intermediaries'].map((role,i)=>(
              <div key={role} style={{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:11}}>
                <div style={{fontWeight:600,color:T.navy}}>{role}</div>
                <div style={{color:T.textMut,marginTop:2}}>{['ISO 14064-2','GHG Protocol','PCAF Avoided','Attribution only'][i]}</div>
              </div>
            ))}
          </div>
          <button style={{...S.btn(true),width:'100%',padding:'12px 16px',position:'relative',overflow:'hidden'}} onClick={runAudit} disabled={auditRunning}>
            {auditRunning?(
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <span style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                Running Full Audit...
              </span>
            ):auditComplete?'Audit Complete - 7 issues found':'Run Full Audit'}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          {/* Remediations */}
          <div style={{marginTop:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Remediation Recommendations</div>
            {remediations.map(r=>(
              <div key={r.id} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                <span style={S.badge(r.priority==='P1'?T.red:T.amber)}>{r.priority}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12}}>{r.action}</div>
                  <div style={{fontSize:10,color:T.textMut}}>{r.owner} \u00B7 {r.deadline}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit trail */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.sectionTitle}>Calculation Audit Trail</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:11,color:T.textMut}}>{auditTrail.length} entries</span>
            <button style={S.btn(false)} onClick={()=>setAuditTrailPage(Math.max(0,auditTrailPage-1))} disabled={auditTrailPage===0}>Prev</button>
            <span style={{fontSize:11,color:T.textSec}}>Page {auditTrailPage+1}/{Math.ceil(auditTrail.length/10)}</span>
            <button style={S.btn(false)} onClick={()=>setAuditTrailPage(Math.min(Math.ceil(auditTrail.length/10)-1,auditTrailPage+1))} disabled={auditTrailPage>=Math.ceil(auditTrail.length/10)-1}>Next</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>ID</th><th style={S.th}>Timestamp</th><th style={S.th}>Action</th>
                <th style={S.th}>Entity</th><th style={S.th}>User</th><th style={S.th}>Old</th>
                <th style={S.th}>New</th><th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.slice(auditTrailPage*10,(auditTrailPage+1)*10).map((a,i)=>(
                <tr key={a.id} style={{background:i%2===0?'transparent':T.surfaceH}}>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>#{a.id}</td>
                  <td style={{...S.td,fontSize:11,fontFamily:T.mono}}>{a.timestamp}</td>
                  <td style={{...S.td,fontSize:11}}>{a.action}</td>
                  <td style={{...S.td,fontWeight:600,fontSize:11}}>{a.entity}</td>
                  <td style={{...S.td,fontSize:11}}>{a.user}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:11,color:T.textMut}}>{a.oldValue}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:11,color:a.newValue>a.oldValue?T.green:T.red}}>{a.newValue}</td>
                  <td style={S.td}><span style={S.badge(a.status==='Approved'?T.green:a.status==='Pending'?T.amber:T.navyL)}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credibility score trend */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Credibility Score Trend (12Q)</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData.map((d,i)=>({...d,credScore:Math.round(55+sr(i*171)*20+i*1.5),peerAvg:Math.round(50+sr(i*173)*15+i*1.2)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[40,100]}/>
            <Tooltip content={<CT/>}/>
            <Line type="monotone" dataKey="credScore" stroke={T.sage} strokeWidth={2} name="Our Score" dot={{r:3}}/>
            <Line type="monotone" dataKey="peerAvg" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" name="Peer Avg" dot={{r:2}}/>
            <Legend/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 4: BOARD REPORT
     ══════════════════════════════════════════════════════════════════════════ */
  const renderBoardReport=()=>{
    const audiences=['Board','IC','Impact Committee','Regulator'];

    const sectionContent={
      exec:{
        summary:`Portfolio avoided emissions of ${kpis.totalAvoided.toFixed(1)} MtCO\u2082e (${period}), with a net climate impact of ${kpis.netImpact>0?'+':''}${kpis.netImpact.toFixed(1)} MtCO\u2082e. Credibility score at ${kpis.credibility.toFixed(0)}/100. ${kpis.purePlay} pure-play climate solution companies.`,
        delta:'+4.2% QoQ',deltaColor:T.green,
      },
      netImpact:{
        summary:`Net impact: ${kpis.netImpact.toFixed(1)} MtCO\u2082e. Avoided/Emitted ratio: ${kpis.avoidedRatio.toFixed(2)}x. Attribution coverage: ${kpis.attrCoverage.toFixed(1)}%.`,
        delta:'+8.1% QoQ',deltaColor:T.green,
      },
      avoidedCat:{
        summary:`Top category: ${kpis.topCategory}. 12 sectors represented. Renewable Energy and EV/Transport together account for ~45% of total avoided emissions.`,
        delta:'Renewables +12% QoQ',deltaColor:T.green,
      },
      solutionExp:{
        summary:`Solution exposure: ${kpis.solutionExp.toFixed(1)}% of portfolio. Revenue threshold >50%. Climate solution revenue averages ${kpis.solutionRev.toFixed(1)}%.`,
        delta:'+2.3pp QoQ',deltaColor:T.green,
      },
      enablement:{
        summary:`Average enablement ratio: ${kpis.enablement.toFixed(1)}%. Enablers represent 38% of holdings. Direct solutions: 62%.`,
        delta:'-1.2pp QoQ',deltaColor:T.amber,
      },
      credibility:{
        summary:`Average credibility: ${kpis.credibility.toFixed(0)}/100. High tier: ${credDist.find(d=>d.name==='High')?.value||0} companies. ${7} red flags requiring attention.`,
        delta:'+4.2pts QoQ',deltaColor:T.green,
      },
      taxonomy:{
        summary:`Average taxonomy alignment: ${kpis.taxAlign.toFixed(1)}%. EU TEG criteria screening applied to all 150 holdings. ISSB S2 para 29 compliance at 78%.`,
        delta:'+3.1pp QoQ',deltaColor:T.green,
      },
      recommendations:{
        summary:'1) Increase third-party verification coverage to 90%+. 2) Resolve 5 double-counting instances. 3) Improve data quality for nature-based solutions. 4) Establish quarterly credibility review cycle. 5) Expand pure-play allocation by 5pp.',
        delta:'5 action items',deltaColor:T.navy,
      },
    };

    return(
    <div>
      {/* Controls */}
      <div style={{...S.card,display:'flex',flexWrap:'wrap',gap:16,alignItems:'center'}}>
        <div>
          <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Date Range</label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="date" value={boardDateFrom} onChange={e=>setBoardDateFrom(e.target.value)}
              style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
            <span style={{color:T.textMut}}>to</span>
            <input type="date" value={boardDateTo} onChange={e=>setBoardDateTo(e.target.value)}
              style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
          </div>
        </div>
        <div>
          <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Audience</label>
          <div style={S.toggle}>
            {audiences.map(a=><button key={a} style={S.toggleBtn(boardAudience===a)} onClick={()=>setBoardAudience(a)}>{a}</button>)}
          </div>
        </div>
        <div>
          <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Format</label>
          <div style={S.toggle}>
            <button style={S.toggleBtn(!boardDetailMode)} onClick={()=>setBoardDetailMode(false)}>Board Pack</button>
            <button style={S.toggleBtn(boardDetailMode)} onClick={()=>setBoardDetailMode(true)}>Detailed</button>
          </div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button style={S.btn(false)} onClick={exportCSV}>Export CSV</button>
          <button style={S.btn(true)} onClick={handlePrint}>Print Preview</button>
        </div>
      </div>

      {/* Section toggles */}
      <div style={{...S.card}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.sectionTitle}>Report Sections</div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn(false)} onClick={()=>setBoardSections(new Set(BOARD_SECTIONS.map(s=>s.id)))}>Select All</button>
            <button style={S.btn(false)} onClick={()=>setBoardSections(new Set())}>Clear All</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8}}>
          {BOARD_SECTIONS.map(s=>(
            <label key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,border:`1px solid ${boardSections.has(s.id)?T.sage:T.border}`,
              background:boardSections.has(s.id)?`${T.sage}08`:T.surface,cursor:'pointer',fontSize:12}}>
              <input type="checkbox" checked={boardSections.has(s.id)} onChange={()=>toggleBoardSection(s.id)} style={S.checkbox}/>
              <span>{s.icon} {s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Report sections */}
      {BOARD_SECTIONS.filter(s=>boardSections.has(s.id)).map(s=>{
        const content=sectionContent[s.id];
        const expanded=boardExpanded.has(s.id);
        return(
          <div key={s.id} style={{...S.cardH,borderLeft:`3px solid ${T.sage}`}} onClick={()=>toggleBoardExpand(s.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:16}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{s.label}</div>
                  {!expanded&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{content.summary.substring(0,80)}...</div>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{...S.badge(content.deltaColor),fontSize:10}}>{content.delta}</span>
                <span style={{fontSize:12,color:T.textMut}}>{expanded?'\u25B2':'\u25BC'}</span>
              </div>
            </div>
            {expanded&&(
              <div style={{marginTop:16}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:16}}>{content.summary}</div>
                {boardDetailMode&&(
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>Audience: {boardAudience} | Period: {boardDateFrom} to {boardDateTo}</div>
                  </div>
                )}
                {/* Section-specific charts */}
                {s.id==='exec'&&(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                    {KPI_DEFS.slice(0,4).map(k=>(
                      <div key={k.id} style={{padding:12,borderRadius:8,border:`1px solid ${T.border}`,textAlign:'center'}}>
                        <div style={{fontSize:10,color:T.textMut}}>{k.label}</div>
                        <div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono,marginTop:4}}>{k.fmt(kpis[k.id])}</div>
                      </div>
                    ))}
                  </div>
                )}
                {s.id==='netImpact'&&(
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textMut}}/>
                      <YAxis tick={{fontSize:9,fill:T.textMut}}/>
                      <Tooltip content={<CT/>}/>
                      <Area type="monotone" dataKey="avoided" stroke={T.green} fill={T.green} fillOpacity={0.15} name="Avoided"/>
                      <Area type="monotone" dataKey="emitted" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Emitted"/>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {s.id==='avoidedCat'&&(
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={sectorDist.slice(0,6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}}/>
                      <YAxis tick={{fontSize:9,fill:T.textMut}}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="value" fill={T.sage} name="Avoided (kt)" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {s.id==='solutionExp'&&(
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[{name:'Solution >50%',value:Math.round(kpis.solutionExp)},{name:'Below 50%',value:Math.round(100-kpis.solutionExp)}]} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" paddingAngle={3}>
                        <Cell fill={T.sage}/><Cell fill={T.border}/>
                      </Pie>
                      <Tooltip content={<CT/>}/>
                      <Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {s.id==='enablement'&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{textAlign:'center',padding:16,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,color:T.textMut}}>Direct Solutions</div>
                      <div style={{fontSize:24,fontWeight:700,color:T.sage,fontFamily:T.mono}}>62%</div>
                    </div>
                    <div style={{textAlign:'center',padding:16,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,color:T.textMut}}>Enablers</div>
                      <div style={{fontSize:24,fontWeight:700,color:T.gold,fontFamily:T.mono}}>38%</div>
                    </div>
                  </div>
                )}
                {s.id==='credibility'&&(
                  <div style={{display:'flex',gap:16}}>
                    {credDist.map((d,i)=>(
                      <div key={d.name} style={{flex:1,textAlign:'center',padding:12,borderRadius:8,border:`1px solid ${T.border}`}}>
                        <div style={{fontSize:10,color:T.textMut}}>{d.name}</div>
                        <div style={{fontSize:22,fontWeight:700,color:i===0?T.green:i===1?T.amber:T.red,fontFamily:T.mono}}>{d.value}</div>
                        <div style={{fontSize:10,color:T.textMut}}>companies</div>
                      </div>
                    ))}
                  </div>
                )}
                {s.id==='taxonomy'&&(
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textMut}}/>
                      <YAxis tick={{fontSize:9,fill:T.textMut}}/>
                      <Tooltip content={<CT/>}/>
                      <Line type="monotone" dataKey="avoided" stroke={T.sage} strokeWidth={2} name="Alignment Trend" dot={{r:3}}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {s.id==='recommendations'&&(
                  <div>
                    {['Increase third-party verification coverage to 90%+','Resolve 5 double-counting instances by Q1 2026','Improve DQ score for nature-based solutions to >70','Establish quarterly credibility review cycle','Expand pure-play climate solution allocation by 5pp'].map((r,i)=>(
                      <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                        <span style={{...S.badge(i<2?T.red:T.amber),minWidth:24,textAlign:'center'}}>{i+1}</span>
                        <span style={{fontSize:12}}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary footer */}
      <div style={{...S.card,background:`${T.sage}08`,borderColor:T.sage}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>Report Summary</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4}}>
              {boardSections.size} sections selected | Audience: {boardAudience} | Format: {boardDetailMode?'Detailed':'Board Pack'} | Period: {boardDateFrom} to {boardDateTo}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={S.btn(false)} onClick={exportCSV}>Export CSV</button>
            <button style={S.btn(true)} onClick={handlePrint}>Print</button>
          </div>
        </div>
      </div>
    </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return(
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Scope 4 / Avoided Emissions Intelligence Hub</h1>
          <div style={S.subtitle}>EP-AO6 \u00B7 Executive dashboard aggregating all Sprint AO modules \u00B7 150 companies \u00B7 {period}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={S.badge(T.green)}>{visibleAlerts.filter(a=>a.level==='green').length} OK</span>
          <span style={S.badge(T.amber)}>{visibleAlerts.filter(a=>a.level==='amber').length} Watch</span>
          <span style={S.badge(T.red)}>{visibleAlerts.filter(a=>a.level==='red').length} Action</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs} className="no-print">
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {/* Tab content */}
      {tab===0&&renderExecutive()}
      {tab===1&&renderNetImpact()}
      {tab===2&&renderCredibility()}
      {tab===3&&renderBoardReport()}
    </div>
  );
}
