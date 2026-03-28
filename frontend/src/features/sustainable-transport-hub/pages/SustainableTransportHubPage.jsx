import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const MODES=['Maritime','Aviation','Road/EV','Rail','Logistics'];
const REGIONS=['Europe','Asia-Pacific','North America','Middle East','Africa','Latin America'];
const RISK_TIERS=['Low','Medium','High','Critical'];
const SUBSECTORS={Maritime:['Container','Tanker','Bulk Carrier','LNG Carrier','Cruise','Ro-Ro'],Aviation:['Long-Haul','Short-Haul','Cargo','Regional','Business Jet','Helicopter'],'Road/EV':['Heavy Truck','Light Commercial','Bus Fleet','Last-Mile','Passenger EV','Two-Wheeler'],Rail:['Freight','High-Speed','Urban Transit','Intercity','Industrial','Mining'],Logistics:['3PL','Cold Chain','E-Commerce','Warehousing','Port Operations','Intermodal']};

const PERIODS=['Q','YTD','1Y','3Y'];
const AUDIENCES=['Board','IC','Regulator','Lender'];
const STAGES=['Identified','Contacted','Engaged','Action Plan','Monitoring','Resolved'];
const STAGE_COLORS=[T.textMut,T.navyL,T.gold,T.amber,T.sage,T.green];

const REPORT_SECTIONS=['Exec Summary','Maritime Compliance','Aviation Decarbonisation','EV Transition','SAF Markets','Cross-Modal Analysis','Investment Portfolio','Recommendations'];

/* ── Generate 200 transport assets ── */
const genAssets=()=>{
  const assets=[];
  const names=[
    'Maersk Line','CMA CGM','MSC Shipping','Hapag-Lloyd','COSCO Shipping','Evergreen Marine','Yang Ming','ONE Network','ZIM Integrated','HMM Co',
    'Emirates Airlines','Delta Air Lines','United Airlines','Lufthansa Group','Singapore Airlines','Qatar Airways','Cathay Pacific','ANA Holdings','Air France-KLM','IAG Group',
    'Tesla Fleet Ops','BYD Auto Fleet','Rivian Commercial','Arrival EV','Proterra Inc','Lion Electric','Nikola Motor','Daimler Truck EV','Volvo Trucks EV','Scania Electric',
    'DB Cargo','Union Pacific','BNSF Railway','Canadian Pacific','Norfolk Southern','CSX Transport','Indian Railways','SNCF Freight','JR Freight','Aurizon Holdings',
    'DHL Logistics','FedEx Supply','UPS Freight','XPO Logistics','Kuehne+Nagel','DB Schenker','CH Robinson','Expeditors Intl','DSV Panalpina','Nippon Express',
    'Wan Hai Lines','PIL Shipping','IRISL Group','Mitsui OSK','NYK Line','K Line','Pacific Basin','Star Bulk','Diana Shipping','Safe Bulkers',
    'Ryanair Holdings','Southwest Air','JetBlue Airways','Spirit Airlines','Wizz Air','IndiGo Airlines','AirAsia Group','Cebu Pacific','Pegasus Airlines','Volaris',
    'Penske Truck','Ryder System','Werner Enterprises','Schneider National','JB Hunt Transport','Heartland Express','Knight-Swift','USA Truck','Saia Inc','Old Dominion',
    'East Japan Rail','West Japan Rail','Central Japan Rail','MTR Corporation','Trenitalia','Renfe Operadora','Amtrak','Via Rail','SBB Cargo','PKP Cargo',
    'Amazon Logistics','Alibaba Cainiao','JD Logistics','SF Express','Yamato Holdings','Sagawa Express','Royal Mail','PostNord','Poste Italiane','Correos Group',
    'Frontline Ltd','Euronav NV','Teekay Tankers','Scorpio Tankers','DHT Holdings','International Seaways','Nordic American','Torm plc','Ardmore Shipping','Hafnia',
    'Cathay Cargo','Turkish Cargo','Cargolux','Atlas Air','Polar Air Cargo','Kalitta Air','AirBridgeCargo','Silk Way West','Ethiopian Cargo','Saudia Cargo',
    'BYD Bus','Yutong Bus','Solaris Bus','New Flyer','Alexander Dennis','Optare plc','Wrightbus','Van Hool','Irizar Group','CRRC Bus',
    'Genesee Wyoming','Watco Companies','Anacostia Rail','OmniTRAX Inc','RailAmerica','Patriot Rail','Iowa Pacific','Montana Rail Link','Florida East Coast','Pan Am Railways',
    'GXO Logistics','Lineage Logistics','Americold Realty','Geodis Group','Bolloré Logistics','Kerry Logistics','Toll Group','Agility Logistics','CEVA Logistics','Hellmann Worldwide',
    'Pacific Intl Lines','Zhonggu Logistics','Sinotrans Ltd','SITC Intl','TS Lines','Samudera Indonesia','Regional Container','Matson Inc','Crowley Maritime','Tote Maritime',
    'Jetstar Airways','Peach Aviation','Spring Airlines','Scoot Airlines','Norwegian Air','Transavia','Eurowings','Flybe Group','Loganair','SkyWest Airlines',
    'XPeng Fleet','NIO Commercial','Lordstown Motors','Canoo Inc','Bollinger Motors','Lightning eMotors','Workhorse Group','Xos Trucks','REE Automotive','Hyzon Motors',
    'Russian Railways','China Railway','PRASA Rail','KTM Berhad','Philippine NR','Vietnam Railways','Korail','Ukrzaliznytsia','CFR Marfa','MAV Cargo',
    'Flexport Inc','Freightos Ltd','Convoy Inc','Transfix Inc','Uber Freight','Loadsmart Inc','project44','FourKites Inc','Descartes Systems','BluJay Solutions'
  ];
  for(let i=0;i<200;i++){
    const s=sr(i*7+3);const s2=sr(i*11+7);const s3=sr(i*13+2);const s4=sr(i*17+5);
    const modeIdx=Math.floor(s*5);const mode=MODES[modeIdx];
    const subs=SUBSECTORS[mode];
    assets.push({
      id:i+1,name:names[i]||`Transport Co ${i+1}`,mode,
      subSector:subs[Math.floor(s2*subs.length)],
      region:REGIONS[Math.floor(s3*REGIONS.length)],
      emissions:+(0.1+s*4.9).toFixed(2),
      intensity:+(10+s2*190).toFixed(1),
      decarbScore:Math.floor(20+s3*75),
      investmentExp:+(0.05+s4*2.45).toFixed(2),
      riskTier:RISK_TIERS[Math.floor(s4*4)],
      ciiRating:mode==='Maritime'?['A','B','C','D','E'][Math.floor(s2*5)]:null,
      corsiaCompliant:mode==='Aviation'?s3>0.35:null,
      evPenetration:mode==='Road/EV'?Math.floor(5+s*85):null,
      safUsage:mode==='Aviation'?+(s4*12).toFixed(1):null,
      modalShiftScore:Math.floor(30+s2*65),
      yoyChange:+(-15+s3*30).toFixed(1),
    });
  }
  return assets;
};

/* ── Generate 40 engagement companies ── */
const genEngagements=()=>{
  const companies=['Maersk Line','CMA CGM','Emirates Airlines','Delta Air Lines','Tesla Fleet Ops','BYD Auto Fleet','DB Cargo','Union Pacific','DHL Logistics','FedEx Supply',
    'MSC Shipping','Singapore Airlines','Nikola Motor','Volvo Trucks EV','BNSF Railway','Kuehne+Nagel','Ryanair Holdings','Penske Truck','East Japan Rail','Amazon Logistics',
    'Hapag-Lloyd','Qatar Airways','Proterra Inc','Scania Electric','CSX Transport','XPO Logistics','Lufthansa Group','Werner Enterprises','MTR Corporation','JD Logistics',
    'COSCO Shipping','ANA Holdings','Lion Electric','Daimler Truck EV','Indian Railways','DB Schenker','Cathay Pacific','JB Hunt Transport','Trenitalia','SF Express'];
  const issues=['CII Compliance','CORSIA Offset','EV Transition','SAF Procurement','Modal Shift Strategy','Scope 3 Reporting','Fleet Renewal','Green Corridor','Battery Supply Chain','Hydrogen Fueling',
    'CII Rating Improvement','CORSIA MRV','Charging Infrastructure','SAF Blending Mandate','Intermodal Optimization','Net Zero Target','Alternative Fuels','Port Electrification','Route Optimization','Carbon Credits'];
  const analysts=['S. Chen','M. Patel','J. Okafor','A. Lindberg','R. Tanaka','K. Mueller','L. Santos','T. Nakamura'];
  return companies.map((name,i)=>{
    const s=sr(i*23+9);const s2=sr(i*31+4);const s3=sr(i*19+11);
    const modeIdx=Math.floor(i/8);
    return{
      id:i+1,company:name,mode:MODES[modeIdx%5],
      stage:STAGES[Math.floor(s*6)],
      keyIssue:issues[i%issues.length],
      notes:`${s>0.5?'Positive':'Mixed'} response on ${issues[i%issues.length].toLowerCase()} engagement. ${s2>0.5?'Follow-up scheduled.':'Awaiting internal review.'}`,
      nextAction:s3>0.6?'Schedule meeting':'Review action plan',
      analyst:analysts[Math.floor(s2*analysts.length)],
      priority:s>0.7?'High':s>0.35?'Medium':'Low',
      lastContact:`2026-0${1+Math.floor(s3*3)}-${10+Math.floor(s*18)}`,
      daysInStage:Math.floor(5+s2*45),
    };
  });
};

/* ── 25 alerts ── */
const genAlerts=()=>{
  const templates=[
    {title:'IMO CII threshold breach',mode:'Maritime',severity:'Critical'},
    {title:'CORSIA offset shortfall detected',mode:'Aviation',severity:'High'},
    {title:'EV charging utilization < 30%',mode:'Road/EV',severity:'Medium'},
    {title:'SAF supply contract expiring',mode:'Aviation',severity:'High'},
    {title:'Rail electrification delay',mode:'Rail',severity:'Medium'},
    {title:'Maritime fleet avg CII degraded to D',mode:'Maritime',severity:'Critical'},
    {title:'Aviation Scope 3 data gap',mode:'Aviation',severity:'High'},
    {title:'Battery cost above target',mode:'Road/EV',severity:'Medium'},
    {title:'Modal shift index declining',mode:'Logistics',severity:'Low'},
    {title:'New EU ETS maritime compliance deadline',mode:'Maritime',severity:'High'},
    {title:'CORSIA Phase 2 reporting due',mode:'Aviation',severity:'High'},
    {title:'EV fleet TCO exceeding ICE baseline',mode:'Road/EV',severity:'Medium'},
    {title:'Green corridor certification gap',mode:'Maritime',severity:'Medium'},
    {title:'Hydrogen fueling infrastructure delay',mode:'Rail',severity:'Low'},
    {title:'Cold chain emissions spike',mode:'Logistics',severity:'High'},
    {title:'Ammonia fuel safety incident report',mode:'Maritime',severity:'Critical'},
    {title:'SAF production target missed by 15%',mode:'Aviation',severity:'High'},
    {title:'Charging grid capacity constraint',mode:'Road/EV',severity:'Medium'},
    {title:'Cross-border rail interoperability issue',mode:'Rail',severity:'Low'},
    {title:'Last-mile delivery emissions up 8% QoQ',mode:'Logistics',severity:'Medium'},
    {title:'LNG carrier methane slip above 3%',mode:'Maritime',severity:'High'},
    {title:'Sustainable aviation fuel price +22%',mode:'Aviation',severity:'Medium'},
    {title:'Battery degradation above forecast',mode:'Road/EV',severity:'Medium'},
    {title:'Freight modal shift target off-track',mode:'Rail',severity:'Low'},
    {title:'Warehouse energy audit overdue',mode:'Logistics',severity:'Low'},
  ];
  return templates.map((t,i)=>({id:i+1,...t,date:`2026-03-${(28-i%28).toString().padStart(2,'0')}`,acknowledged:sr(i*7)>0.6}));
};

/* ── KPI definitions ── */
const KPI_DEFS=[
  {key:'totalCO2',label:'Total Transport CO2',unit:'GtCO2',base:8.7,delta:-0.04},
  {key:'ciiFleet',label:'Maritime CII Fleet Avg',unit:'Rating',base:2.8,delta:-0.1,fmt:v=>['A','B','C','D','E'][Math.min(4,Math.floor(v))]||'C'},
  {key:'corsiaCov',label:'CORSIA Coverage',unit:'%',base:72,delta:3.2},
  {key:'evPen',label:'EV Fleet Penetration',unit:'%',base:18.5,delta:4.1},
  {key:'safProd',label:'SAF Production',unit:'Mt',base:1.8,delta:0.6},
  {key:'modalShift',label:'Modal Shift Index',unit:'pts',base:54,delta:2.8},
  {key:'investTotal',label:'Transport Investment',unit:'$bn',base:50.2,delta:5.1},
  {key:'decarbRate',label:'Decarbonisation Rate',unit:'%/yr',base:3.2,delta:0.4},
  {key:'imoCompl',label:'IMO Compliance',unit:'%',base:81,delta:2.5},
  {key:'corsiaOffset',label:'CORSIA Offset Demand',unit:'MtCO2',base:142,delta:18},
  {key:'chargingInfra',label:'Charging Infrastructure',unit:'GW',base:4.8,delta:1.2},
  {key:'batteryCost',label:'Battery Cost',unit:'$/kWh',base:118,delta:-12},
];

const periodMultipliers={Q:1,YTD:1.3,'1Y':1.8,'3Y':4.2};

const SUB_MODULES=[
  {key:'maritime',label:'Maritime Decarbonisation',icon:'\u2693',color:T.navy,stats:['CII Fleet Avg: C+','IMO 2030 Target: On Track','Green Corridors: 12 active','EU ETS Coverage: 78%','Ammonia-Ready Vessels: 34']},
  {key:'aviation',label:'Aviation & CORSIA',icon:'\u2708',color:T.navyL,stats:['CORSIA Coverage: 72%','SAF Blend Rate: 2.1%','Offset Portfolio: 142 MtCO2','Fleet Efficiency: +3.2%','Cargo Modal Shift: 8%']},
  {key:'evfleet',label:'EV Fleet Transition',icon:'\u26A1',color:T.sage,stats:['EV Penetration: 18.5%','Charging Points: 48,200','TCO Parity: 2027 est.','Battery Degradation: 4.2%/yr','Grid Load: 4.8 GW']},
  {key:'saf',label:'SAF & Alt Fuels',icon:'\u2B50',color:T.gold,stats:['SAF Production: 1.8 Mt','Price Premium: +180%','Feedstock Diversity: 6 types','e-Fuel Capacity: 0.2 Mt','Mandate Coverage: 45%']},
  {key:'decarb',label:'Transport Decarbonisation',icon:'\uD83C\uDF0D',color:T.teal,stats:['Decarb Rate: 3.2%/yr','Net Zero Aligned: 38%','Scope 3 Coverage: 62%','SBTi Committed: 45 firms','Modal Shift Index: 54']},
];

/* ── Emissions by mode time series ── */
const genEmissionsSeries=()=>{
  const years=['2020','2021','2022','2023','2024','2025','2026E'];
  return years.map((yr,i)=>({
    year:yr,
    Maritime:+(2.8-i*0.05+sr(i*3)*0.1).toFixed(2),
    Aviation:+(0.9-i*0.02+sr(i*5)*0.05).toFixed(2),
    'Road/EV':+(3.8-i*0.12+sr(i*7)*0.08).toFixed(2),
    Rail:+(0.4-i*0.01+sr(i*11)*0.02).toFixed(2),
    Logistics:+(0.8-i*0.03+sr(i*13)*0.04).toFixed(2),
  }));
};

/* ── Tech readiness radar ── */
const genRadarData=()=>[
  {tech:'Battery Electric',Maritime:20,Aviation:10,'Road/EV':75,Rail:60,Logistics:45},
  {tech:'Hydrogen',Maritime:25,Aviation:15,'Road/EV':20,Rail:35,Logistics:15},
  {tech:'Ammonia/Methanol',Maritime:40,Aviation:5,'Road/EV':5,Rail:10,Logistics:5},
  {tech:'SAF/Biofuels',Maritime:15,Aviation:55,'Road/EV':10,Rail:5,Logistics:20},
  {tech:'Electrification',Maritime:10,Aviation:8,'Road/EV':80,Rail:70,Logistics:35},
  {tech:'Efficiency Gains',Maritime:65,Aviation:60,'Road/EV':50,Rail:55,Logistics:55},
];

/* ── Top risks & opportunities ── */
const RISKS=[
  {title:'IMO 2030 target non-compliance risk across 38% of fleet',mode:'Maritime',impact:'High'},
  {title:'CORSIA Phase 2 offset supply insufficient',mode:'Aviation',impact:'Critical'},
  {title:'EV charging grid constraints in EU corridors',mode:'Road/EV',impact:'Medium'},
  {title:'SAF feedstock competition with food/energy sectors',mode:'Aviation',impact:'High'},
  {title:'Stranded asset risk for non-compliant vessels',mode:'Maritime',impact:'Critical'},
];
const OPPORTUNITIES=[
  {title:'Green corridor first-mover advantage in Pacific routes',mode:'Maritime',impact:'High'},
  {title:'SAF production scaling — 5x capacity by 2030',mode:'Aviation',impact:'High'},
  {title:'EV TCO crossover accelerating to 2026',mode:'Road/EV',impact:'Medium'},
  {title:'Rail modal shift incentives in EU Green Deal',mode:'Rail',impact:'Medium'},
  {title:'Digital logistics optimization — 15% emission reduction',mode:'Logistics',impact:'High'},
];

/* ── Styles ── */
const S={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24},
  h1:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,marginTop:4},
  badge:{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600},
  tabs:{display:'flex',gap:2,background:T.surface,borderRadius:10,padding:3,border:`1px solid ${T.border}`,marginBottom:20},
  tab:{padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'none',transition:'all 0.15s'},
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:16,marginBottom:12},
  kpiGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:20},
  kpiCard:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:'14px 16px'},
  kpiLabel:{fontSize:11,color:T.textSec,fontWeight:500,marginBottom:4},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy},
  kpiUnit:{fontSize:11,color:T.textMut,marginLeft:4},
  kpiDelta:{fontSize:11,fontWeight:600,marginTop:2},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12},
  btn:{padding:'6px 14px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontSize:12,fontWeight:500,color:T.text,transition:'all 0.15s'},
  btnPrimary:{padding:'6px 14px',borderRadius:6,border:'none',background:T.navy,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600},
  select:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.text,cursor:'pointer'},
  input:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.text,width:'100%',boxSizing:'border-box'},
  textarea:{padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.text,width:'100%',boxSizing:'border-box',minHeight:60,resize:'vertical',fontFamily:T.font},
  chip:{display:'inline-block',padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600},
  sectionTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  row:{display:'flex',gap:12,marginBottom:12},
  col:{flex:1},
  alert:{padding:'8px 12px',borderRadius:8,borderLeft:'4px solid',marginBottom:6,fontSize:12},
  funnel:{display:'flex',alignItems:'flex-end',gap:4,height:120,marginBottom:12},
  funnelBar:{borderRadius:'4px 4px 0 0',display:'flex',alignItems:'flex-end',justifyContent:'center',fontSize:10,fontWeight:600,color:'#fff',paddingBottom:4,transition:'height 0.3s'},
};

const severityColor=s=>s==='Critical'?T.red:s==='High'?T.amber:s==='Medium'?T.gold:T.sage;
const riskColor=r=>r==='Critical'?T.red:r==='High'?T.amber:r==='Medium'?T.gold:T.green;
const priorityColor=p=>p==='High'?T.red:p==='Medium'?T.amber:T.green;
const CHART_COLORS=[T.navy,T.navyL,T.sage,T.gold,T.teal,'#8b5cf6'];

export default function SustainableTransportHubPage(){
  const [tab,setTab]=useState(0);
  const [period,setPeriod]=useState('YTD');

  /* Tab 1 */
  const assets=useMemo(genAssets,[]);
  const alerts=useMemo(genAlerts,[]);
  const emissionsSeries=useMemo(genEmissionsSeries,[]);
  const radarData=useMemo(genRadarData,[]);

  /* Tab 2 */
  const [modeFilter,setModeFilter]=useState('All');
  const [riskFilter,setRiskFilter]=useState('All');
  const [regionFilter,setRegionFilter]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [selectedAsset,setSelectedAsset]=useState(null);
  const [sortCol,setSortCol]=useState('emissions');
  const [sortDir,setSortDir]=useState('desc');

  /* Tab 3 */
  const [engagements,setEngagements]=useState(()=>genEngagements());
  const [engModeFilter,setEngModeFilter]=useState('All');
  const [showAddForm,setShowAddForm]=useState(false);
  const [newEng,setNewEng]=useState({company:'',mode:'Maritime',keyIssue:'',priority:'Medium'});

  /* Tab 4 */
  const [reportRange,setReportRange]=useState({from:'2026-01-01',to:'2026-03-28'});
  const [audience,setAudience]=useState('Board');
  const [activeSections,setActiveSections]=useState(()=>REPORT_SECTIONS.reduce((a,s)=>({...a,[s]:true}),{}));
  const [expandedSections,setExpandedSections]=useState({});
  const [reportMode,setReportMode]=useState('Board Pack');
  const [alertFilter,setAlertFilter]=useState('All');
  const [alertAck,setAlertAck]=useState(()=>new Set());
  const [selectedEngagement,setSelectedEngagement]=useState(null);
  const [investBreakdownMode,setInvestBreakdownMode]=useState('mode');

  const tabs=['Executive Dashboard','Cross-Modal Portfolio','Engagement Pipeline','Board Report'];

  /* ── KPI values by period ── */
  const kpiValues=useMemo(()=>{
    const m=periodMultipliers[period];
    return KPI_DEFS.map(k=>{
      const val=k.key==='batteryCost'?k.base+k.delta*(m-1):k.base+(k.delta*(m-1));
      const delta=k.delta*(m>1?m*0.3:1);
      return{...k,val:k.fmt?k.fmt(val):+val.toFixed(k.unit==='GtCO2'||k.unit==='Mt'||k.unit==='$bn'||k.unit==='%/yr'||k.unit==='GW'?1:0),delta};
    });
  },[period]);

  /* ── Filtered assets ── */
  const filteredAssets=useMemo(()=>{
    let f=assets;
    if(modeFilter!=='All')f=f.filter(a=>a.mode===modeFilter);
    if(riskFilter!=='All')f=f.filter(a=>a.riskTier===riskFilter);
    if(regionFilter!=='All')f=f.filter(a=>a.region===regionFilter);
    if(searchTerm)f=f.filter(a=>a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    f=[...f].sort((a,b)=>{
      const av=a[sortCol],bv=b[sortCol];
      if(typeof av==='number')return sortDir==='asc'?av-bv:bv-av;
      return sortDir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
    });
    return f;
  },[assets,modeFilter,riskFilter,regionFilter,searchTerm,sortCol,sortDir]);

  /* ── Scatter data for allocation vs emissions ── */
  const scatterData=useMemo(()=>{
    const byMode={};
    assets.forEach(a=>{
      if(!byMode[a.mode])byMode[a.mode]={mode:a.mode,investment:0,emissions:0,count:0};
      byMode[a.mode].investment+=a.investmentExp;
      byMode[a.mode].emissions+=a.emissions;
      byMode[a.mode].count++;
    });
    return Object.values(byMode);
  },[assets]);

  /* ── Engagement pipeline counts ── */
  const filteredEngagements=useMemo(()=>{
    if(engModeFilter==='All')return engagements;
    return engagements.filter(e=>e.mode===engModeFilter);
  },[engagements,engModeFilter]);

  const stageCounts=useMemo(()=>STAGES.map(st=>({stage:st,count:filteredEngagements.filter(e=>e.stage===st).length})),[filteredEngagements]);

  const handleStageAdvance=useCallback((id)=>{
    setEngagements(prev=>prev.map(e=>{
      if(e.id!==id)return e;
      const idx=STAGES.indexOf(e.stage);
      if(idx<STAGES.length-1)return{...e,stage:STAGES[idx+1],daysInStage:0};
      return e;
    }));
  },[]);

  const handleStageRevert=useCallback((id)=>{
    setEngagements(prev=>prev.map(e=>{
      if(e.id!==id)return e;
      const idx=STAGES.indexOf(e.stage);
      if(idx>0)return{...e,stage:STAGES[idx-1],daysInStage:0};
      return e;
    }));
  },[]);

  const handleAddEngagement=useCallback(()=>{
    if(!newEng.company)return;
    setEngagements(prev=>[...prev,{id:prev.length+1,company:newEng.company,mode:newEng.mode,stage:'Identified',keyIssue:newEng.keyIssue||'General Assessment',notes:'New engagement',nextAction:'Initial outreach',analyst:'Unassigned',priority:newEng.priority,lastContact:'2026-03-28',daysInStage:0}]);
    setNewEng({company:'',mode:'Maritime',keyIssue:'',priority:'Medium'});
    setShowAddForm(false);
  },[newEng]);

  const handleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const toggleSection=(s)=>setActiveSections(p=>({...p,[s]:!p[s]}));
  const toggleExpand=(s)=>setExpandedSections(p=>({...p,[s]:!p[s]}));

  /* ── Coverage gap analysis ── */
  const coverageGaps=useMemo(()=>{
    const gaps=[];
    const modeCounts={};
    assets.forEach(a=>{modeCounts[a.mode]=(modeCounts[a.mode]||0)+1;});
    MODES.forEach(m=>{
      const count=modeCounts[m]||0;
      const target=m==='Maritime'?50:m==='Aviation'?45:m==='Road/EV'?40:m==='Rail'?35:30;
      if(count<target)gaps.push({mode:m,current:count,target,gap:target-count});
    });
    return gaps;
  },[assets]);

  /* ── Engagement by mode pie ── */
  const engByMode=useMemo(()=>{
    const counts={};
    filteredEngagements.forEach(e=>{counts[e.mode]=(counts[e.mode]||0)+1;});
    return Object.entries(counts).map(([mode,count])=>({mode,count}));
  },[filteredEngagements]);

  /* ── Board report section content generators ── */
  const reportContent=useMemo(()=>({
    'Exec Summary':{
      text:`Transport portfolio of $${(50.2).toFixed(1)}bn across ${assets.length} entities. Overall decarbonisation rate of 3.2%/yr. ${alerts.filter(a=>a.severity==='Critical').length} critical alerts requiring immediate attention.`,
      deltaQ:'+2.1% portfolio allocation QoQ',
    },
    'Maritime Compliance':{
      text:`Fleet average CII rating: C+. ${assets.filter(a=>a.mode==='Maritime'&&a.ciiRating==='D').length+assets.filter(a=>a.mode==='Maritime'&&a.ciiRating==='E').length} vessels at D/E rating. IMO compliance at 81%. EU ETS maritime phase-in on track.`,
      deltaQ:'CII avg improved from D- to C+',
    },
    'Aviation Decarbonisation':{
      text:`CORSIA coverage at 72%. SAF blend rate at 2.1% against 2030 target of 10%. Offset portfolio of 142 MtCO2. ${assets.filter(a=>a.mode==='Aviation'&&a.corsiaCompliant).length} carriers CORSIA-compliant.`,
      deltaQ:'SAF blend +0.4pp QoQ',
    },
    'EV Transition':{
      text:`EV fleet penetration at 18.5%. Battery cost at $118/kWh (-12 YoY). Charging infrastructure at 4.8 GW installed. TCO parity expected 2027 for heavy trucks.`,
      deltaQ:'EV penetration +4.1pp YTD',
    },
    'SAF Markets':{
      text:`SAF production at 1.8 Mt annually. Price premium of +180% over Jet-A1. 6 feedstock pathways active. e-Fuel capacity scaling to 0.2 Mt. Mandate coverage across 45% of markets.`,
      deltaQ:'Production +0.3 Mt QoQ',
    },
    'Cross-Modal Analysis':{
      text:`Modal shift index at 54 points. Rail freight share increasing +2.8pp. Road-to-rail incentives driving 8% shift in EU corridors. Intermodal terminal capacity expanding 12%.`,
      deltaQ:'Modal shift index +2.8 pts QoQ',
    },
    'Investment Portfolio':{
      text:`Total transport investment exposure: $50.2bn. Maritime: $18.4bn (37%), Aviation: $12.1bn (24%), Road/EV: $9.8bn (20%), Rail: $5.6bn (11%), Logistics: $4.3bn (8%).`,
      deltaQ:'+$5.1bn YTD net inflows',
    },
    'Recommendations':{
      text:`1) Increase maritime green corridor investments. 2) Accelerate SAF offtake agreements. 3) Expand EV charging partnerships. 4) Engage D/E-rated CII vessels for improvement plans. 5) Hedge CORSIA offset exposure.`,
      deltaQ:'5 new recommendations this quarter',
    },
  }),[assets,alerts]);

  /* ── Board section charts ── */
  const sectionChartData=useMemo(()=>({
    'Maritime Compliance':assets.filter(a=>a.mode==='Maritime').reduce((acc,a)=>{
      const r=a.ciiRating||'C';acc[r]=(acc[r]||0)+1;return acc;
    },{}),
    'Aviation Decarbonisation':[
      {label:'Compliant',value:assets.filter(a=>a.mode==='Aviation'&&a.corsiaCompliant).length},
      {label:'Non-Compliant',value:assets.filter(a=>a.mode==='Aviation'&&!a.corsiaCompliant).length},
    ],
    'EV Transition':assets.filter(a=>a.mode==='Road/EV').slice(0,10).map(a=>({name:a.name.split(' ')[0],pen:a.evPenetration||0})),
    'Investment Portfolio':MODES.map((m,i)=>({mode:m,value:+assets.filter(a=>a.mode===m).reduce((s,a)=>s+a.investmentExp,0).toFixed(1)})),
  }),[assets]);

  /* ── CSV export ── */
  const handleExportCSV=useCallback(()=>{
    const headers=['Section','Content','Quarterly Delta'];
    const rows=REPORT_SECTIONS.filter(s=>activeSections[s]).map(s=>[s,reportContent[s]?.text||'',reportContent[s]?.deltaQ||'']);
    const csv=[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`transport_board_report_${audience.toLowerCase()}_${reportRange.from}_${reportRange.to}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  },[activeSections,reportContent,audience,reportRange]);

  const handlePrint=useCallback(()=>window.print(),[]);

  const handleAckAlert=useCallback((id)=>{
    setAlertAck(prev=>{const n=new Set(prev);n.add(id);return n;});
  },[]);

  /* ── Investment breakdown data ── */
  const investBreakdown=useMemo(()=>{
    if(investBreakdownMode==='mode'){
      return MODES.map((m,i)=>({
        name:m,
        value:+assets.filter(a=>a.mode===m).reduce((s,a)=>s+a.investmentExp,0).toFixed(1),
        color:CHART_COLORS[i],
      }));
    }
    return REGIONS.map((r,i)=>({
      name:r,
      value:+assets.filter(a=>a.region===r).reduce((s,a)=>s+a.investmentExp,0).toFixed(1),
      color:CHART_COLORS[i%CHART_COLORS.length],
    }));
  },[assets,investBreakdownMode]);

  /* ── Filtered alerts ── */
  const filteredAlerts=useMemo(()=>{
    let a=alerts.map(al=>({...al,acknowledged:al.acknowledged||alertAck.has(al.id)}));
    if(alertFilter==='Unacknowledged')a=a.filter(x=>!x.acknowledged);
    else if(alertFilter!=='All')a=a.filter(x=>x.severity===alertFilter);
    return a;
  },[alerts,alertFilter,alertAck]);

  /* ── Quarterly performance metrics for Exec Summary ── */
  const qtrMetrics=useMemo(()=>[
    {label:'Portfolio Return',q1:'+2.1%',q2:'+1.8%',q3:'+3.2%',q4:'+2.7%',trend:'up'},
    {label:'Emissions Reduction',q1:'-1.2%',q2:'-1.8%',q3:'-2.1%',q4:'-2.5%',trend:'up'},
    {label:'Engagement Success',q1:'68%',q2:'71%',q3:'74%',q4:'78%',trend:'up'},
    {label:'Compliance Rate',q1:'76%',q2:'79%',q3:'81%',q4:'84%',trend:'up'},
    {label:'Data Coverage',q1:'82%',q2:'85%',q3:'88%',q4:'91%',trend:'up'},
    {label:'Risk Incidents',q1:'12',q2:'9',q3:'7',q4:'5',trend:'down'},
  ],[]);

  /* ── Mode performance comparison ── */
  const modePerformance=useMemo(()=>MODES.map((m,i)=>{
    const modeAssets=assets.filter(a=>a.mode===m);
    const avgDecarb=modeAssets.length?+(modeAssets.reduce((s,a)=>s+a.decarbScore,0)/modeAssets.length).toFixed(0):0;
    const totalEmissions=+modeAssets.reduce((s,a)=>s+a.emissions,0).toFixed(1);
    const totalInvest=+modeAssets.reduce((s,a)=>s+a.investmentExp,0).toFixed(1);
    const highRisk=modeAssets.filter(a=>a.riskTier==='High'||a.riskTier==='Critical').length;
    return{mode:m,count:modeAssets.length,avgDecarb,totalEmissions,totalInvest,highRisk,color:CHART_COLORS[i]};
  }),[assets]);

  /* ═══════════════════════════════════════════ RENDER ═══════════════════════════════════════════ */
  return(
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Sustainable Transport & Logistics Hub</h1>
          <div style={S.subtitle}>EP-AN6 | Cross-modal transport decarbonisation intelligence | {assets.length} entities | ${(50.2).toFixed(1)}bn portfolio</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{...S.badge,background:'#fef2f2',color:T.red}}>{alerts.filter(a=>a.severity==='Critical').length} Critical</span>
          <span style={{...S.badge,background:'#fffbeb',color:T.amber}}>{alerts.filter(a=>a.severity==='High').length} High</span>
          <span style={{...S.badge,background:'#f0fdf4',color:T.green}}>{alerts.filter(a=>!a.acknowledged).length} Unacknowledged</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {tabs.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            style={{...S.tab,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,fontWeight:tab===i?600:500}}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════ TAB 1: Executive Dashboard ══════════ */}
      {tab===0&&(
        <div>
          {/* Period toggle */}
          <div style={{display:'flex',gap:4,marginBottom:16}}>
            {PERIODS.map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                style={{...S.btn,...(period===p?{background:T.navy,color:'#fff',borderColor:T.navy}:{})}}>
                {p}
              </button>
            ))}
          </div>

          {/* 12 KPIs */}
          <div style={S.kpiGrid}>
            {kpiValues.map(k=>(
              <div key={k.key} style={S.kpiCard}>
                <div style={S.kpiLabel}>{k.label}</div>
                <div style={{display:'flex',alignItems:'baseline'}}>
                  <span style={S.kpiVal}>{typeof k.val==='number'?k.val.toLocaleString():k.val}</span>
                  <span style={S.kpiUnit}>{k.unit}</span>
                </div>
                <div style={{...S.kpiDelta,color:k.delta>0?(k.key==='batteryCost'?T.red:T.green):(k.key==='batteryCost'?T.green:T.red)}}>
                  {k.delta>0?'+':''}{k.delta.toFixed(1)} {k.unit} vs prior
                </div>
              </div>
            ))}
          </div>

          {/* Sub-module cards */}
          <div style={S.sectionTitle}>Sub-Module Status</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12,marginBottom:20}}>
            {SUB_MODULES.map(m=>(
              <div key={m.key} style={{...S.card,borderLeft:`4px solid ${m.color}`}}>
                <div style={{fontSize:14,fontWeight:700,color:m.color,marginBottom:8}}>{m.icon} {m.label}</div>
                {m.stats.map((s,i)=>(
                  <div key={i} style={{fontSize:11,color:T.textSec,marginBottom:3,paddingLeft:8,borderLeft:`2px solid ${T.border}`}}>{s}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={S.row}>
            <div style={{...S.card,flex:2}}>
              <div style={S.sectionTitle}>Transport Emissions by Mode (GtCO2)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={emissionsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                  <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                  <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  {MODES.map((m,i)=>(
                    <Area key={m} type="monotone" dataKey={m} stackId="1" stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.6}/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{...S.card,flex:1}}>
              <div style={S.sectionTitle}>Technology Readiness Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="tech" tick={{fontSize:9,fill:T.textSec}}/>
                  <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
                  {MODES.map((m,i)=>(
                    <Radar key={m} name={m} dataKey={m} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.15}/>
                  ))}
                  <Legend wrapperStyle={{fontSize:10}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risks & Opportunities */}
          <div style={S.row}>
            <div style={{...S.card,...S.col}}>
              <div style={S.sectionTitle}>Top 5 Risks</div>
              {RISKS.map((r,i)=>(
                <div key={i} style={{...S.alert,borderColor:riskColor(r.impact),background:r.impact==='Critical'?'#fef2f2':r.impact==='High'?'#fffbeb':'#f0fdf4'}}>
                  <div style={{fontWeight:600,marginBottom:2}}>{r.title}</div>
                  <div style={{fontSize:10,color:T.textMut}}>{r.mode} | Impact: {r.impact}</div>
                </div>
              ))}
            </div>
            <div style={{...S.card,...S.col}}>
              <div style={S.sectionTitle}>Top 5 Opportunities</div>
              {OPPORTUNITIES.map((o,i)=>(
                <div key={i} style={{...S.alert,borderColor:T.sage,background:'#f0fdf4'}}>
                  <div style={{fontWeight:600,marginBottom:2}}>{o.title}</div>
                  <div style={{fontSize:10,color:T.textMut}}>{o.mode} | Impact: {o.impact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment portfolio breakdown */}
          <div style={S.row}>
            <div style={{...S.card,flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={S.sectionTitle}>Investment Portfolio Breakdown ($50.2bn)</div>
                <div style={{display:'flex',gap:4}}>
                  {['mode','region'].map(m=>(
                    <button key={m} onClick={()=>setInvestBreakdownMode(m)}
                      style={{...S.btn,padding:'3px 10px',fontSize:10,...(investBreakdownMode===m?{background:T.navy,color:'#fff',borderColor:T.navy}:{})}}>
                      By {m.charAt(0).toUpperCase()+m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={investBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,value})=>`${name}: $${value}bn`} labelLine={true}>
                    {investBreakdown.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>`$${v}bn`} contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{...S.card,flex:1}}>
              <div style={S.sectionTitle}>Mode Performance Comparison</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Mode','Entities','Avg Decarb','Emissions','Investment','High Risk'].map(h=>(
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modePerformance.map(m=>(
                    <tr key={m.mode}>
                      <td style={{...S.td,fontWeight:600}}><span style={{color:m.color}}>{'\u25CF'} </span>{m.mode}</td>
                      <td style={S.td}>{m.count}</td>
                      <td style={S.td}>
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          <div style={{width:32,height:5,borderRadius:3,background:T.border}}>
                            <div style={{width:`${m.avgDecarb}%`,height:5,borderRadius:3,background:m.avgDecarb>55?T.green:m.avgDecarb>35?T.amber:T.red}}/>
                          </div>
                          <span>{m.avgDecarb}</span>
                        </div>
                      </td>
                      <td style={S.td}>{m.totalEmissions} Mt</td>
                      <td style={S.td}>${m.totalInvest}bn</td>
                      <td style={S.td}><span style={{color:m.highRisk>5?T.red:m.highRisk>2?T.amber:T.green,fontWeight:600}}>{m.highRisk}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts */}
          <div style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={S.sectionTitle}>Active Alerts ({alerts.length})</div>
              <div style={{display:'flex',gap:4}}>
                {['All','Critical','High','Medium','Unacknowledged'].map(f=>(
                  <button key={f} onClick={()=>setAlertFilter(f)}
                    style={{...S.btn,padding:'3px 10px',fontSize:10,...(alertFilter===f?{background:T.navy,color:'#fff',borderColor:T.navy}:{})}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{maxHeight:280,overflowY:'auto'}}>
              {filteredAlerts.map(a=>(
                <div key={a.id} style={{...S.alert,borderColor:severityColor(a.severity),background:a.acknowledged?T.surfaceH:a.severity==='Critical'?'#fef2f2':'#fffbeb',opacity:a.acknowledged?0.7:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:600}}>{a.title}</span>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{...S.chip,background:severityColor(a.severity)+'20',color:severityColor(a.severity)}}>{a.severity}</span>
                      {!a.acknowledged&&(
                        <button style={{...S.btn,padding:'2px 8px',fontSize:9}} onClick={()=>handleAckAlert(a.id)}>Acknowledge</button>
                      )}
                    </div>
                  </div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{a.mode} | {a.date} {a.acknowledged?' | \u2713 Acknowledged':''}</div>
                </div>
              ))}
              {filteredAlerts.length===0&&<div style={{textAlign:'center',padding:20,color:T.textMut,fontSize:12}}>No alerts match current filter</div>}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB 2: Cross-Modal Portfolio ══════════ */}
      {tab===1&&(
        <div>
          {/* Filters */}
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
            <select style={S.select} value={modeFilter} onChange={e=>setModeFilter(e.target.value)}>
              <option value="All">All Modes</option>
              {MODES.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <select style={S.select} value={riskFilter} onChange={e=>setRiskFilter(e.target.value)}>
              <option value="All">All Risk Tiers</option>
              {RISK_TIERS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <select style={S.select} value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
              <option value="All">All Regions</option>
              {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <input style={{...S.input,width:200}} placeholder="Search entity..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            <span style={{fontSize:12,color:T.textMut,marginLeft:'auto'}}>{filteredAssets.length} of {assets.length} entities</span>
          </div>

          <div style={S.row}>
            {/* Table */}
            <div style={{...S.card,flex:3,overflow:'auto',maxHeight:520}}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {[{k:'name',l:'Entity'},{k:'mode',l:'Mode'},{k:'subSector',l:'Sub-Sector'},{k:'emissions',l:'Emissions (MtCO2)'},{k:'intensity',l:'Intensity'},{k:'decarbScore',l:'Decarb Score'},{k:'investmentExp',l:'Exposure ($bn)'},{k:'riskTier',l:'Risk Tier'}].map(c=>(
                      <th key={c.k} style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort(c.k)}>
                        {c.l}{sortCol===c.k?(sortDir==='asc'?' \u25B2':' \u25BC'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.slice(0,100).map(a=>(
                    <tr key={a.id} onClick={()=>setSelectedAsset(a)} style={{cursor:'pointer',background:selectedAsset?.id===a.id?T.surfaceH:'transparent'}}>
                      <td style={{...S.td,fontWeight:600,color:T.navy}}>{a.name}</td>
                      <td style={S.td}><span style={{...S.chip,background:CHART_COLORS[MODES.indexOf(a.mode)]+'20',color:CHART_COLORS[MODES.indexOf(a.mode)]}}>{a.mode}</span></td>
                      <td style={S.td}>{a.subSector}</td>
                      <td style={S.td}>{a.emissions}</td>
                      <td style={S.td}>{a.intensity}</td>
                      <td style={S.td}>
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          <div style={{width:40,height:6,borderRadius:3,background:T.border}}>
                            <div style={{width:`${a.decarbScore}%`,height:6,borderRadius:3,background:a.decarbScore>60?T.green:a.decarbScore>35?T.amber:T.red}}/>
                          </div>
                          <span>{a.decarbScore}</span>
                        </div>
                      </td>
                      <td style={S.td}>${a.investmentExp}bn</td>
                      <td style={S.td}><span style={{...S.chip,background:riskColor(a.riskTier)+'20',color:riskColor(a.riskTier)}}>{a.riskTier}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAssets.length>100&&<div style={{fontSize:11,color:T.textMut,padding:8,textAlign:'center'}}>Showing 100 of {filteredAssets.length} — refine filters to see more</div>}
            </div>

            {/* Cross-reference panel */}
            <div style={{...S.card,flex:1,minWidth:260}}>
              {selectedAsset?(
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>{selectedAsset.name}</div>
                  <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>{selectedAsset.mode} | {selectedAsset.subSector} | {selectedAsset.region}</div>
                  <div style={{borderTop:`1px solid ${T.border}`,paddingTop:8}}>
                    {[
                      ['Emissions',`${selectedAsset.emissions} MtCO2`],
                      ['Intensity',`${selectedAsset.intensity} gCO2/tkm`],
                      ['Decarb Score',`${selectedAsset.decarbScore}/100`],
                      ['Investment',`$${selectedAsset.investmentExp}bn`],
                      ['Risk Tier',selectedAsset.riskTier],
                      ['YoY Change',`${selectedAsset.yoyChange>0?'+':''}${selectedAsset.yoyChange}%`],
                      ['Modal Shift',`${selectedAsset.modalShiftScore}/100`],
                    ].map(([l,v])=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                        <span style={{color:T.textSec}}>{l}</span>
                        <span style={{fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                    {selectedAsset.ciiRating&&(
                      <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                        <span style={{color:T.textSec}}>CII Rating</span>
                        <span style={{fontWeight:600,color:selectedAsset.ciiRating==='A'||selectedAsset.ciiRating==='B'?T.green:selectedAsset.ciiRating==='C'?T.amber:T.red}}>{selectedAsset.ciiRating}</span>
                      </div>
                    )}
                    {selectedAsset.corsiaCompliant!==null&&(
                      <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                        <span style={{color:T.textSec}}>CORSIA</span>
                        <span style={{fontWeight:600,color:selectedAsset.corsiaCompliant?T.green:T.red}}>{selectedAsset.corsiaCompliant?'Compliant':'Non-Compliant'}</span>
                      </div>
                    )}
                    {selectedAsset.evPenetration!==null&&(
                      <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                        <span style={{color:T.textSec}}>EV Penetration</span>
                        <span style={{fontWeight:600}}>{selectedAsset.evPenetration}%</span>
                      </div>
                    )}
                    {selectedAsset.safUsage!==null&&(
                      <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                        <span style={{color:T.textSec}}>SAF Usage</span>
                        <span style={{fontWeight:600}}>{selectedAsset.safUsage} Mt</span>
                      </div>
                    )}
                  </div>
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:6}}>Sub-Module Relevance</div>
                    {SUB_MODULES.filter(m=>m.key==='decarb'||m.label.toLowerCase().includes(selectedAsset.mode.toLowerCase().split('/')[0])).map(m=>(
                      <div key={m.key} style={{...S.chip,background:m.color+'20',color:m.color,marginRight:4,marginBottom:4}}>{m.icon} {m.label}</div>
                    ))}
                  </div>
                </div>
              ):(
                <div style={{textAlign:'center',padding:40,color:T.textMut,fontSize:13}}>Select an entity to view cross-reference data</div>
              )}
            </div>
          </div>

          {/* Sector allocation vs emissions + Coverage gaps */}
          <div style={S.row}>
            <div style={{...S.card,flex:1}}>
              <div style={S.sectionTitle}>Sector Allocation vs Emissions Contribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scatterData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
                  <YAxis dataKey="mode" type="category" tick={{fontSize:11,fill:T.textSec}} width={80}/>
                  <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="investment" name="Investment ($bn)" fill={T.navy} radius={[0,4,4,0]}/>
                  <Bar dataKey="emissions" name="Emissions (MtCO2)" fill={T.gold} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{...S.card,flex:1}}>
              <div style={S.sectionTitle}>Coverage Gap Analysis</div>
              {coverageGaps.length>0?(
                <div>
                  {coverageGaps.map(g=>(
                    <div key={g.mode} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                        <span style={{fontWeight:600}}>{g.mode}</span>
                        <span style={{color:T.textMut}}>{g.current}/{g.target} entities ({g.gap} gap)</span>
                      </div>
                      <div style={{width:'100%',height:8,borderRadius:4,background:T.border}}>
                        <div style={{width:`${(g.current/g.target)*100}%`,height:8,borderRadius:4,background:g.gap>10?T.red:g.gap>5?T.amber:T.sage}}/>
                      </div>
                    </div>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center',padding:20,color:T.green,fontSize:13}}>All modes meet coverage targets</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB 3: Engagement Pipeline ══════════ */}
      {tab===2&&(
        <div>
          {/* Controls */}
          <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
            <select style={S.select} value={engModeFilter} onChange={e=>setEngModeFilter(e.target.value)}>
              <option value="All">All Modes</option>
              {MODES.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <button style={S.btnPrimary} onClick={()=>setShowAddForm(!showAddForm)}>
              {showAddForm?'Cancel':'+ Add Engagement'}
            </button>
            <span style={{fontSize:12,color:T.textMut,marginLeft:'auto'}}>{filteredEngagements.length} engagements</span>
          </div>

          {/* Add form */}
          {showAddForm&&(
            <div style={{...S.card,marginBottom:16,borderLeft:`4px solid ${T.navy}`}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>New Engagement</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,alignItems:'end'}}>
                <div>
                  <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Company</label>
                  <input style={S.input} value={newEng.company} onChange={e=>setNewEng(p=>({...p,company:e.target.value}))} placeholder="Company name"/>
                </div>
                <div>
                  <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Mode</label>
                  <select style={S.select} value={newEng.mode} onChange={e=>setNewEng(p=>({...p,mode:e.target.value}))}>
                    {MODES.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Key Issue</label>
                  <input style={S.input} value={newEng.keyIssue} onChange={e=>setNewEng(p=>({...p,keyIssue:e.target.value}))} placeholder="Issue"/>
                </div>
                <div>
                  <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Priority</label>
                  <select style={S.select} value={newEng.priority} onChange={e=>setNewEng(p=>({...p,priority:e.target.value}))}>
                    {['High','Medium','Low'].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button style={S.btnPrimary} onClick={handleAddEngagement}>Add</button>
              </div>
            </div>
          )}

          {/* Funnel + Mode breakdown */}
          <div style={S.row}>
            <div style={{...S.card,flex:2}}>
              <div style={S.sectionTitle}>Pipeline Funnel</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {stageCounts.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{...S.card,flex:1}}>
              <div style={S.sectionTitle}>Engagement by Mode</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={engByMode} dataKey="count" nameKey="mode" cx="50%" cy="50%" outerRadius={70} label={({mode,count})=>`${mode}: ${count}`} labelLine={false}>
                    {engByMode.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engagement table */}
          <div style={{...S.card,overflow:'auto',maxHeight:480}}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Company','Mode','Stage','Key Issue','Priority','Analyst','Days in Stage','Last Contact','Actions'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEngagements.map(e=>(
                  <tr key={e.id} onClick={()=>setSelectedEngagement(e)} style={{cursor:'pointer',background:selectedEngagement?.id===e.id?T.surfaceH:'transparent'}}>
                    <td style={{...S.td,fontWeight:600,color:T.navy}}>{e.company}</td>
                    <td style={S.td}><span style={{...S.chip,background:CHART_COLORS[MODES.indexOf(e.mode)]+'20',color:CHART_COLORS[MODES.indexOf(e.mode)]}}>{e.mode}</span></td>
                    <td style={S.td}><span style={{...S.chip,background:STAGE_COLORS[STAGES.indexOf(e.stage)]+'20',color:STAGE_COLORS[STAGES.indexOf(e.stage)]}}>{e.stage}</span></td>
                    <td style={S.td}>{e.keyIssue}</td>
                    <td style={S.td}><span style={{...S.chip,background:priorityColor(e.priority)+'20',color:priorityColor(e.priority)}}>{e.priority}</span></td>
                    <td style={S.td}>{e.analyst}</td>
                    <td style={S.td}>{e.daysInStage}d</td>
                    <td style={S.td}>{e.lastContact}</td>
                    <td style={{...S.td,whiteSpace:'nowrap'}}>
                      <button style={{...S.btn,padding:'3px 8px',fontSize:10,marginRight:4}} onClick={()=>handleStageRevert(e.id)} disabled={STAGES.indexOf(e.stage)===0} title="Revert stage">
                        \u25C0
                      </button>
                      <button style={{...S.btnPrimary,padding:'3px 8px',fontSize:10}} onClick={()=>handleStageAdvance(e.id)} disabled={STAGES.indexOf(e.stage)===STAGES.length-1} title="Advance stage">
                        \u25B6
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected engagement detail */}
          {selectedEngagement&&(
            <div style={{...S.card,marginTop:12,borderLeft:`4px solid ${T.gold}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{selectedEngagement.company}</div>
                  <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{selectedEngagement.mode} | {selectedEngagement.keyIssue}</div>
                </div>
                <button style={S.btn} onClick={()=>setSelectedEngagement(null)}>Close</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:12}}>
                <div>
                  <div style={{fontSize:10,color:T.textMut,marginBottom:2}}>Current Stage</div>
                  <span style={{...S.chip,background:STAGE_COLORS[STAGES.indexOf(selectedEngagement.stage)]+'20',color:STAGE_COLORS[STAGES.indexOf(selectedEngagement.stage)],fontSize:13,padding:'4px 12px'}}>{selectedEngagement.stage}</span>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMut,marginBottom:2}}>Priority</div>
                  <span style={{...S.chip,background:priorityColor(selectedEngagement.priority)+'20',color:priorityColor(selectedEngagement.priority),fontSize:13,padding:'4px 12px'}}>{selectedEngagement.priority}</span>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMut,marginBottom:2}}>Assigned Analyst</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{selectedEngagement.analyst}</div>
                </div>
              </div>
              <div style={{marginTop:12,padding:10,background:T.surfaceH,borderRadius:6}}>
                <div style={{fontSize:10,fontWeight:600,color:T.textSec,marginBottom:4}}>Notes</div>
                <div style={{fontSize:12,color:T.text,lineHeight:1.6}}>{selectedEngagement.notes}</div>
              </div>
              <div style={{display:'flex',gap:12,marginTop:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:T.textMut}}>Next Action</div>
                  <div style={{fontSize:12,fontWeight:500}}>{selectedEngagement.nextAction}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:T.textMut}}>Last Contact</div>
                  <div style={{fontSize:12,fontWeight:500}}>{selectedEngagement.lastContact}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:T.textMut}}>Days in Stage</div>
                  <div style={{fontSize:12,fontWeight:500,color:selectedEngagement.daysInStage>30?T.amber:T.text}}>{selectedEngagement.daysInStage} days</div>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontSize:10,fontWeight:600,color:T.textSec,marginBottom:6}}>Stage History</div>
                <div style={{display:'flex',gap:2}}>
                  {STAGES.map((st,i)=>{
                    const current=STAGES.indexOf(selectedEngagement.stage);
                    const done=i<=current;
                    return(
                      <div key={st} style={{flex:1,textAlign:'center'}}>
                        <div style={{height:4,borderRadius:2,background:done?STAGE_COLORS[i]:T.border,marginBottom:4}}/>
                        <div style={{fontSize:8,color:done?STAGE_COLORS[i]:T.textMut}}>{st}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notes panel for active engagements */}
          <div style={{...S.card,marginTop:12}}>
            <div style={S.sectionTitle}>Engagement Notes Summary</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:8}}>
              {filteredEngagements.filter(e=>e.stage==='Engaged'||e.stage==='Action Plan').slice(0,6).map(e=>(
                <div key={e.id} style={{padding:10,borderRadius:8,background:T.surfaceH,border:`1px solid ${T.border}`,cursor:'pointer'}} onClick={()=>setSelectedEngagement(e)}>
                  <div style={{fontWeight:600,fontSize:12,color:T.navy,marginBottom:4}}>{e.company}</div>
                  <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{e.notes}</div>
                  <div style={{fontSize:10,color:T.textMut}}>Next: {e.nextAction} | {e.analyst}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage duration analysis */}
          <div style={{...S.card,marginTop:12}}>
            <div style={S.sectionTitle}>Average Days in Stage</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={STAGES.map((st,i)=>{
                const inStage=filteredEngagements.filter(e=>e.stage===st);
                const avg=inStage.length?+(inStage.reduce((s,e)=>s+e.daysInStage,0)/inStage.length).toFixed(0):0;
                return{stage:st,avgDays:avg};
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Days',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textMut}}}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
                <Bar dataKey="avgDays" name="Avg Days" radius={[4,4,0,0]}>
                  {STAGES.map((_,i)=><Cell key={i} fill={STAGE_COLORS[i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════ TAB 4: Board Report ══════════ */}
      {tab===3&&(
        <div>
          {/* Controls */}
          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
            <div>
              <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>From</label>
              <input type="date" style={S.input} value={reportRange.from} onChange={e=>setReportRange(p=>({...p,from:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>To</label>
              <input type="date" style={S.input} value={reportRange.to} onChange={e=>setReportRange(p=>({...p,to:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Audience</label>
              <div style={{display:'flex',gap:2}}>
                {AUDIENCES.map(a=>(
                  <button key={a} onClick={()=>setAudience(a)}
                    style={{...S.btn,...(audience===a?{background:T.navy,color:'#fff',borderColor:T.navy}:{}),padding:'5px 12px'}}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Format</label>
              <div style={{display:'flex',gap:2}}>
                {['Board Pack','Detailed'].map(m=>(
                  <button key={m} onClick={()=>setReportMode(m)}
                    style={{...S.btn,...(reportMode===m?{background:T.gold,color:'#fff',borderColor:T.gold}:{}),padding:'5px 12px'}}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <button style={S.btnPrimary} onClick={handleExportCSV}>Export CSV</button>
              <button style={S.btn} onClick={handlePrint}>Print Preview</button>
            </div>
          </div>

          {/* Section toggles */}
          <div style={{...S.card,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:8}}>Report Sections</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {REPORT_SECTIONS.map(s=>(
                <button key={s} onClick={()=>toggleSection(s)}
                  style={{...S.btn,padding:'4px 12px',fontSize:11,...(activeSections[s]?{background:T.navy,color:'#fff',borderColor:T.navy}:{opacity:0.5})}}>
                  {activeSections[s]?'\u2713 ':''}{s}
                </button>
              ))}
            </div>
          </div>

          {/* Report sections */}
          {REPORT_SECTIONS.filter(s=>activeSections[s]).map(s=>(
            <div key={s} style={{...S.card,marginBottom:12,borderLeft:`4px solid ${s==='Exec Summary'?T.navy:s.includes('Maritime')?T.navyL:s.includes('Aviation')?T.gold:s.includes('EV')?T.sage:s.includes('SAF')?T.amber:T.teal}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>toggleExpand(s)}>
                <div>
                  <span style={{fontSize:14,fontWeight:700,color:T.navy}}>{s}</span>
                  {reportContent[s]?.deltaQ&&(
                    <span style={{...S.chip,background:'#f0fdf4',color:T.green,marginLeft:8}}>{reportContent[s].deltaQ}</span>
                  )}
                </div>
                <span style={{fontSize:16,color:T.textMut}}>{expandedSections[s]?'\u25BC':'\u25B6'}</span>
              </div>

              {(expandedSections[s]||reportMode==='Detailed')&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                  <div style={{fontSize:12,color:T.textSec,lineHeight:1.7,marginBottom:12}}>{reportContent[s]?.text}</div>

                  {/* Section-specific charts */}
                  {s==='Maritime Compliance'&&sectionChartData[s]&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>CII Rating Distribution</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={Object.entries(sectionChartData[s]).map(([rating,count])=>({rating,count}))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis dataKey="rating" tick={{fontSize:11,fill:T.textSec}}/>
                          <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                          <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                          <Bar dataKey="count" radius={[4,4,0,0]}>
                            {Object.entries(sectionChartData[s]).map(([r],i)=>(
                              <Cell key={i} fill={r==='A'||r==='B'?T.green:r==='C'?T.amber:T.red}/>
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {s==='Aviation Decarbonisation'&&sectionChartData[s]&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>CORSIA Compliance Status</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={sectionChartData[s]} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60} label>
                            <Cell fill={T.green}/>
                            <Cell fill={T.red}/>
                          </Pie>
                          <Tooltip/>
                          <Legend wrapperStyle={{fontSize:11}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {s==='EV Transition'&&sectionChartData[s]&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>Top EV Operators — Penetration %</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={sectionChartData[s]} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
                          <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={60}/>
                          <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                          <Bar dataKey="pen" name="EV %" fill={T.sage} radius={[0,4,4,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {s==='Investment Portfolio'&&sectionChartData[s]&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>Investment by Transport Mode ($bn)</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={sectionChartData[s]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis dataKey="mode" tick={{fontSize:10,fill:T.textSec}}/>
                          <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                          <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                          <Bar dataKey="value" name="$bn" radius={[4,4,0,0]}>
                            {sectionChartData[s].map((_,i)=><Cell key={i} fill={CHART_COLORS[i]}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {s==='Cross-Modal Analysis'&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>Emissions Trend by Mode</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={emissionsSeries}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                          <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                          <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                          {MODES.map((m,i)=>(
                            <Line key={m} type="monotone" dataKey={m} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{r:3}}/>
                          ))}
                          <Legend wrapperStyle={{fontSize:10}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {s==='SAF Markets'&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>SAF Production Trajectory (Mt)</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={[
                          {year:'2023',production:0.5,target:0.8},
                          {year:'2024',production:0.9,target:1.2},
                          {year:'2025',production:1.4,target:1.8},
                          {year:'2026E',production:1.8,target:2.5},
                          {year:'2027E',production:2.8,target:3.5},
                          {year:'2030E',production:8.0,target:10.0},
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                          <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                          <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                          <Area type="monotone" dataKey="target" name="Target" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeDasharray="5 5"/>
                          <Area type="monotone" dataKey="production" name="Actual" stroke={T.sage} fill={T.sage} fillOpacity={0.3}/>
                          <Legend wrapperStyle={{fontSize:10}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {s==='Recommendations'&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:8}}>Priority Actions</div>
                      {[
                        {action:'Increase maritime green corridor investments',priority:'High',timeline:'Q2 2026',owner:'Maritime Team'},
                        {action:'Accelerate SAF offtake agreements',priority:'High',timeline:'Q2 2026',owner:'Aviation Team'},
                        {action:'Expand EV charging partnerships',priority:'Medium',timeline:'Q3 2026',owner:'EV Fleet Team'},
                        {action:'Engage D/E-rated CII vessels',priority:'Critical',timeline:'Immediate',owner:'Engagement Lead'},
                        {action:'Hedge CORSIA offset exposure',priority:'High',timeline:'Q2 2026',owner:'Risk Team'},
                      ].map((r,i)=>(
                        <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                          <span style={{...S.chip,background:priorityColor(r.priority)+'20',color:priorityColor(r.priority),minWidth:50,textAlign:'center'}}>{r.priority}</span>
                          <span style={{flex:2,fontWeight:500}}>{r.action}</span>
                          <span style={{flex:1,color:T.textMut}}>{r.timeline}</span>
                          <span style={{flex:1,color:T.textSec}}>{r.owner}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audience-specific notes */}
                  {audience==='Regulator'&&(
                    <div style={{marginTop:8,padding:8,background:'#eff6ff',borderRadius:6,fontSize:11,color:T.navyL}}>
                      Regulatory view: Compliance metrics highlighted. Voluntary targets excluded.
                    </div>
                  )}
                  {audience==='Lender'&&(
                    <div style={{marginTop:8,padding:8,background:'#fefce8',borderRadius:6,fontSize:11,color:T.amber}}>
                      Lender view: Credit risk and asset stranding metrics prioritised.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Quarterly performance table */}
          <div style={{...S.card,marginBottom:12}}>
            <div style={S.sectionTitle}>Quarterly Performance Summary</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Metric</th>
                  <th style={S.th}>Q1 2026</th>
                  <th style={S.th}>Q2 2025</th>
                  <th style={S.th}>Q3 2025</th>
                  <th style={S.th}>Q4 2025</th>
                  <th style={S.th}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {qtrMetrics.map(m=>(
                  <tr key={m.label}>
                    <td style={{...S.td,fontWeight:600}}>{m.label}</td>
                    <td style={S.td}>{m.q1}</td>
                    <td style={S.td}>{m.q2}</td>
                    <td style={S.td}>{m.q3}</td>
                    <td style={S.td}>{m.q4}</td>
                    <td style={S.td}><span style={{color:m.trend==='up'?T.green:m.trend==='down'?T.green:T.amber,fontWeight:600}}>{m.trend==='up'?'\u25B2':m.trend==='down'?'\u25BC':'\u25C6'} {m.trend==='up'?'Improving':m.trend==='down'?'Improving':'Stable'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Portfolio risk heatmap by mode/region */}
          <div style={{...S.card,marginBottom:12}}>
            <div style={S.sectionTitle}>Risk Heatmap: Mode vs Region</div>
            <div style={{overflowX:'auto'}}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Mode \ Region</th>
                    {REGIONS.map(r=><th key={r} style={{...S.th,textAlign:'center'}}>{r}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MODES.map(m=>(
                    <tr key={m}>
                      <td style={{...S.td,fontWeight:600}}>{m}</td>
                      {REGIONS.map(r=>{
                        const count=assets.filter(a=>a.mode===m&&a.region===r&&(a.riskTier==='High'||a.riskTier==='Critical')).length;
                        const total=assets.filter(a=>a.mode===m&&a.region===r).length;
                        const pct=total?Math.round((count/total)*100):0;
                        return(
                          <td key={r} style={{...S.td,textAlign:'center',background:pct>50?'#fef2f2':pct>25?'#fffbeb':pct>0?'#fefce8':'transparent'}}>
                            <div style={{fontWeight:600,color:pct>50?T.red:pct>25?T.amber:pct>0?T.gold:T.textMut,fontSize:13}}>{pct}%</div>
                            <div style={{fontSize:9,color:T.textMut}}>{count}/{total}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report metadata */}
          <div style={{...S.card,background:T.surfaceH}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut,flexWrap:'wrap',gap:8}}>
              <span>Report period: {reportRange.from} to {reportRange.to}</span>
              <span>Audience: {audience} | Format: {reportMode}</span>
              <span>Sections: {REPORT_SECTIONS.filter(s=>activeSections[s]).length}/{REPORT_SECTIONS.length} active</span>
              <span>Data sources: 5 sub-modules | {assets.length} entities</span>
              <span>Generated: 2026-03-28 | Classification: {audience==='Board'?'Confidential':'Internal'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
