import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { EMISSION_FACTORS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11,fontFamily:T.font};
const fmt=v=>typeof v==='number'?v.toLocaleString(undefined,{maximumFractionDigits:1}):v;
const pct=v=>`${v>=0?'+':''}${v.toFixed(1)}%`;

/* ============================================================
   DATA: 6 MODES
   ============================================================ */
const MODES=['Road Freight','Rail','Maritime','Aviation','Last-Mile','Multimodal'];
const MODE_COLORS=['#dc2626','#2c5a8c','#1b3a5c','#d97706','#c5a96a','#5a8a6a'];
const MODE_INTENSITY=[62,22,8,602,180,35]; // gCO2e/tkm baseline
const MODE_ICONS=['Truck','Train','Ship','Plane','Van','Hub'];

/* ============================================================
   DATA: 20 COUNTRIES
   ============================================================ */
const COUNTRIES=['Germany','USA','China','India','Brazil','UK','Japan','France','Netherlands','Australia',
  'Canada','Mexico','Indonesia','South Korea','Italy','Spain','Sweden','Norway','Singapore','UAE'];
const COUNTRY_CODES=['DE','US','CN','IN','BR','GB','JP','FR','NL','AU','CA','MX','ID','KR','IT','ES','SE','NO','SG','AE'];
const COUNTRY_PROFILES=COUNTRIES.map((c,i)=>({
  country:c,code:COUNTRY_CODES[i],
  totalTransportEmissions:Math.round(50+sr(i*167)*800),
  roadShare:parseFloat((35+sr(i*173)*40).toFixed(1)),
  railShare:parseFloat((5+sr(i*179)*25).toFixed(1)),
  maritimeShare:parseFloat((5+sr(i*181)*20).toFixed(1)),
  aviationShare:parseFloat((3+sr(i*187)*15).toFixed(1)),
  electricification:parseFloat((5+sr(i*191)*35).toFixed(1)),
  policy: sr(i*193)>0.5?'Progressive':'Moderate',
}));

/* ============================================================
   DATA: 100 TRANSPORT COMPANIES
   ============================================================ */
const PREFIXES=['Global','Trans','Eco','Swift','Green','Prime','Atlas','Northern','Pacific','Southern',
  'Nordic','Alpine','Continental','Blue','Express','United','Metro','Quantum','Vertex','Stellar'];
const SUFFIXES=['Logistics','Freight','Cargo','Transport','Shipping','Carriers','Lines','Express','Haulage','Fleet'];

const COMPANIES=Array.from({length:100},(_,i)=>{
  const mode=MODES[i%6];
  const mIdx=i%6;
  const cIdx=i%20;
  const baseInt=MODE_INTENSITY[mIdx];
  const intensity=parseFloat((baseInt*(0.6+sr(i*13)*0.8)).toFixed(1));
  const fleet=Math.round(50+sr(i*7)*2000);
  const annualEmissions=Math.round(fleet*intensity*0.4+sr(i*11)*50000);
  const trajectory=sr(i*17)>0.5?'Aligned':'Misaligned';
  const decarb2030=parseFloat((15+sr(i*19)*45).toFixed(1));
  const scope1=parseFloat((30+sr(i*23)*30).toFixed(1));
  const scope2=parseFloat((10+sr(i*29)*20).toFixed(1));
  const scope3=parseFloat((100-scope1-scope2).toFixed(1));
  const revenue=Math.round(50+sr(i*31)*2000);
  const avgAge=parseFloat((3+sr(i*37)*12).toFixed(1));
  const utilisation=parseFloat((55+sr(i*41)*35).toFixed(0));
  return {
    id:i+1,
    name:`${PREFIXES[i%20]} ${SUFFIXES[Math.floor(i/10)%10]}`,
    mode,mIdx,
    country:COUNTRIES[cIdx],
    countryCode:COUNTRY_CODES[cIdx],
    fleet,annualEmissions,intensity,trajectory,decarb2030,
    scope1,scope2,scope3,
    glecScore:parseFloat((40+sr(i*43)*55).toFixed(0)),
    revenue,avgAge,utilisation,
    quarterlyIntensity:Array.from({length:12},(_,q)=>({
      q:`Q${(q%4)+1} ${2022+Math.floor(q/4)}`,
      value:parseFloat((intensity*(1-q*0.015+sr(i*47+q)*0.08)).toFixed(1))
    })),
    fleetComposition:{
      diesel:Math.round(40+sr(i*53)*40),
      lng:Math.round(sr(i*59)*20),
      electric:Math.round(sr(i*61)*25),
      hydrogen:Math.round(sr(i*67)*10),
    },
    levers:Array.from({length:8},(_,l)=>sr(i*71+l)>0.55),
    roadmap:Array.from({length:6},(_,y)=>({
      year:2025+y*2,
      target:parseFloat((annualEmissions*(1-(decarb2030/100)*(y/5))).toFixed(0)),
    })),
    engagementScore:parseFloat((20+sr(i*73)*75).toFixed(0)),
    lastEngagement:sr(i*79)>0.5?'2025-Q4':'2026-Q1',
  };
});

/* ============================================================
   DATA: EMISSIONS BY MODE 2020-2035 (stacked area)
   ============================================================ */
const YEARS=Array.from({length:16},(_,i)=>2020+i);
const MODE_EMISSIONS_STACK=YEARS.map((y,yi)=>{
  const obj={year:y};
  MODES.forEach((m,mi)=>{
    const base=100+sr(mi*83)*200;
    const trend=m==='Aviation'?1.02:m==='Road Freight'?0.97:m==='Rail'?0.95:m==='Maritime'?0.98:m==='Last-Mile'?1.01:0.96;
    obj[m]=parseFloat((base*Math.pow(trend,yi)*(0.9+sr(mi*89+yi)*0.2)).toFixed(1));
  });
  obj.total=MODES.reduce((s,m)=>s+obj[m],0);
  return obj;
});

/* 12 QUARTERS of intensity data per mode */
const QUARTERLY_MODE_INTENSITY=Array.from({length:12},(_,q)=>{
  const obj={quarter:`Q${(q%4)+1} ${2022+Math.floor(q/4)}`};
  MODES.forEach((m,mi)=>{
    obj[m]=parseFloat((MODE_INTENSITY[mi]*(1-q*0.01+sr(mi*97+q)*0.06)).toFixed(1));
  });
  return obj;
});

/* ============================================================
   DATA: 50 FREIGHT ROUTES
   ============================================================ */
const ORIGINS=['Shanghai','Rotterdam','Los Angeles','Hamburg','Singapore','Dubai','Mumbai','Sao Paulo','Tokyo','Sydney',
  'Chicago','London','Bangkok','Istanbul','Lagos','Antwerp','Busan','Ho Chi Minh','Montreal','Jeddah',
  'Melbourne','Gdansk','Shenzhen','Colombo','Mombasa'];
const DESTS=['New York','Berlin','Dallas','Warsaw','Jakarta','Cairo','Chennai','Santiago','Osaka','Auckland',
  'Detroit','Manchester','Hanoi','Athens','Accra','Marseille','Taipei','Manila','Toronto','Riyadh',
  'Perth','Stockholm','Guangzhou','Dhaka','Dar es Salaam'];

const ROUTES=Array.from({length:50},(_,i)=>{
  const origin=ORIGINS[i%25];
  const dest=DESTS[i%25];
  const dist=Math.round(500+sr(i*101)*14000);
  const cModeIdx=Math.floor(sr(i*103)*4);
  const oModeIdx=Math.floor(sr(i*107)*4);
  const currentMode=MODES[cModeIdx];
  const optimalMode=MODES[oModeIdx];
  const vol=Math.round(1000+sr(i*109)*50000);
  const cInt=MODE_INTENSITY[cModeIdx]||62;
  const oInt=MODE_INTENSITY[oModeIdx]||22;
  const ce=parseFloat((vol*dist*cInt/1e6).toFixed(1));
  const oe=parseFloat((vol*dist*oInt/1e6).toFixed(1));
  return {
    id:i+1,route:`${origin} \u2192 ${dest}`,origin,dest,distance:dist,
    volume:vol,currentMode,optimalMode,
    currentEmissions:ce,optimalEmissions:oe,
    savingPct:parseFloat((Math.max(0,(1-oInt/cInt)*100)).toFixed(1)),
    currentCost:Math.round(vol*dist*0.03*(0.8+sr(i*113)*0.5)),
    optimalCost:Math.round(vol*dist*0.03*(0.6+sr(i*127)*0.6)),
    currentTime:Math.round(dist/800*(1+sr(i*131))),
    optimalTime:Math.round(dist/600*(1+sr(i*137)*1.5)),
    reliability:{road:parseFloat((85+sr(i*139)*12).toFixed(0)),rail:parseFloat((88+sr(i*149)*10).toFixed(0)),maritime:parseFloat((75+sr(i*151)*20).toFixed(0)),multimodal:parseFloat((82+sr(i*157)*15).toFixed(0))},
    bottlenecks:sr(i*163)>0.5?['Port congestion','Gauge incompatibility']:sr(i*167)>0.5?['Border delays','Infrastructure gap']:['Capacity constraint'],
    modalComparison:MODES.slice(0,4).map((m,mi)=>({
      mode:m,
      emissions:parseFloat((vol*dist*MODE_INTENSITY[mi]/1e6).toFixed(1)),
      cost:Math.round(vol*dist*0.03*(0.5+mi*0.15+sr(i*173+mi)*0.3)),
      time:Math.round(dist/(600+mi*100)*(1+sr(i*179+mi)*0.8)),
      reliability:parseFloat((78+sr(i*181+mi)*18).toFixed(0)),
    })),
  };
});

/* ============================================================
   DATA: 8 DECARBONISATION LEVERS
   ============================================================ */
const LEVERS=[
  {id:0,name:'Electrification',desc:'Battery-electric vehicles and electric rail traction systems for zero-emission operations',modes:['Road Freight','Rail','Last-Mile'],adoption:18,potential2030:45,investment:'$2.1T',cost:72,reduction:85,maturity:65,scalability:70,timeframe:55,infrastructure:40,color:'#2c5a8c'},
  {id:1,name:'Hydrogen',desc:'Green hydrogen fuel cells for heavy-duty long-haul transport and maritime propulsion',modes:['Road Freight','Maritime','Aviation'],adoption:3,potential2030:20,investment:'$1.8T',cost:35,reduction:90,maturity:30,scalability:55,timeframe:35,infrastructure:25,color:'#5a8a6a'},
  {id:2,name:'Biofuels',desc:'Sustainable aviation fuel (SAF), biodiesel, and renewable natural gas blending',modes:['Aviation','Maritime','Road Freight'],adoption:12,potential2030:35,investment:'$0.8T',cost:55,reduction:65,maturity:70,scalability:50,timeframe:70,infrastructure:65,color:'#c5a96a'},
  {id:3,name:'Modal Shift',desc:'Strategic freight migration from road to rail and maritime, intermodal hub development',modes:['Road Freight','Rail','Maritime','Multimodal'],adoption:22,potential2030:40,investment:'$1.5T',cost:80,reduction:70,maturity:80,scalability:60,timeframe:65,infrastructure:35,color:'#d97706'},
  {id:4,name:'Efficiency',desc:'Aerodynamic retrofits, eco-driving programmes, tyre pressure monitoring, route optimization',modes:MODES,adoption:35,potential2030:55,investment:'$0.3T',cost:90,reduction:30,maturity:85,scalability:90,timeframe:85,infrastructure:90,color:'#16a34a'},
  {id:5,name:'Logistics Optimization',desc:'AI-driven load consolidation, network design, predictive demand, shared warehousing',modes:['Road Freight','Last-Mile','Multimodal'],adoption:28,potential2030:50,investment:'$0.5T',cost:85,reduction:25,maturity:75,scalability:85,timeframe:80,infrastructure:85,color:'#7c3aed'},
  {id:6,name:'Carbon Capture',desc:'Onboard CO2 capture for ships and aircraft, point-source capture at depots and ports',modes:['Maritime','Aviation'],adoption:1,potential2030:10,investment:'$1.2T',cost:20,reduction:40,maturity:15,scalability:30,timeframe:20,infrastructure:20,color:'#dc2626'},
  {id:7,name:'Demand Reduction',desc:'Nearshoring strategies, circular economy, digital freight matching, virtual alternatives',modes:MODES,adoption:15,potential2030:30,investment:'$0.2T',cost:95,reduction:35,maturity:60,scalability:70,timeframe:90,infrastructure:95,color:'#0f766e'},
];

/* ============================================================
   DATA: 30 GREEN LOANS/BONDS
   ============================================================ */
const INSTRUMENTS=['Green Bond','Sustainability-Linked Loan','Green Loan','Transition Bond','Climate Bond'];
const ISSUERS=['DHL Green Finance','Maersk Climate Bond','DB Schenker SLL','CMA CGM Green','FedEx Transition',
  'UPS Climate','SNCF Green Rail','JR East Bond','CSX Green','Hapag-Lloyd SLL',
  'DSV Panalpina','Kuehne+Nagel SLL','XPO Logistics Green','Ryder Green Bond','NFI Green Loan',
  'Werner Enterprises SLL','Saia Climate Bond','Old Dominion Green','ArcBest Green Bond','YRC Transition',
  'ZIM Shipping Bond','Evergreen SLL','Yang Ming Green','HMM Green Bond','MSC Climate Bond',
  'Cosco Shipping SLL','ONE Green Bond','PIL Climate','WanHai SLL','Matson Green Bond'];

const FINANCE=Array.from({length:30},(_,i)=>({
  id:i+1,
  name:ISSUERS[i],
  type:INSTRUMENTS[i%5],
  amount:Math.round(100+sr(i*191)*900),
  currency:'$M',
  rate:parseFloat((2.5+sr(i*193)*3.5).toFixed(2)),
  tenor:Math.round(3+sr(i*197)*12),
  glecAligned:sr(i*199)>0.35,
  scope3Cat4:parseFloat((1000+sr(i*211)*9000).toFixed(0)),
  scope3Cat9:parseFloat((500+sr(i*223)*5000).toFixed(0)),
  carbonIntensity:parseFloat((15+sr(i*227)*80).toFixed(1)),
  wtwMultiplier:parseFloat((1.15+sr(i*229)*0.25).toFixed(2)),
  mode:MODES[i%6],
  country:COUNTRIES[i%20],
  issued:`202${Math.floor(sr(i*233)*4)}`,
  couponType:sr(i*239)>0.5?'Fixed':'Step-down',
  kpiTarget:parseFloat((5+sr(i*241)*20).toFixed(1)),
}));

/* ============================================================
   DATA: REGULATIONS
   ============================================================ */
const REGULATIONS=[
  {name:'EU Mobility Package',status:'Active',deadline:'2025',impact:'High',desc:'Emissions standards for HDVs, combined transport directive, road charging reform',sector:'Road',region:'EU'},
  {name:'US EPA Phase 3 GHG',status:'Proposed',deadline:'2027',impact:'High',desc:'Heavy-duty vehicle GHG Phase 3 standards for MY2027+',sector:'Road',region:'US'},
  {name:'IMO GHG Strategy',status:'Active',deadline:'2050',impact:'Critical',desc:'Net-zero by or around 2050, checkpoints at 2030 and 2040',sector:'Maritime',region:'Global'},
  {name:'CORSIA Phase 2',status:'Active',deadline:'2027',impact:'Medium',desc:'Carbon offsetting and reduction scheme for international aviation',sector:'Aviation',region:'Global'},
  {name:'EU FuelEU Maritime',status:'Active',deadline:'2025',impact:'High',desc:'GHG intensity limits for maritime fuels, shore power requirements',sector:'Maritime',region:'EU'},
  {name:'UK ZEV Mandate',status:'Active',deadline:'2035',impact:'Medium',desc:'100% zero-emission new vehicle sales mandate by 2035',sector:'Road',region:'UK'},
  {name:'China NEV Mandate',status:'Active',deadline:'2025',impact:'High',desc:'New energy vehicle production credit requirements for manufacturers',sector:'Road',region:'China'},
  {name:'EU ETS Maritime',status:'Active',deadline:'2024',impact:'High',desc:'Maritime shipping included in EU Emissions Trading System',sector:'Maritime',region:'EU'},
];

/* ============================================================
   DATA: GLEC METHODOLOGY ALIGNMENT
   ============================================================ */
const GLEC_CRITERIA=[
  {criterion:'Scope Definition',desc:'WTW including upstream fuel production',weight:20,portfolioScore:78},
  {criterion:'Emission Factors',desc:'GLEC-approved emission factor database used',weight:20,portfolioScore:82},
  {criterion:'Distance Calculation',desc:'Great circle with routing factors applied',weight:15,portfolioScore:91},
  {criterion:'Allocation Method',desc:'Tonne-km based allocation for shared loads',weight:15,portfolioScore:74},
  {criterion:'Hub Operations',desc:'Terminal and warehouse emissions included',weight:10,portfolioScore:65},
  {criterion:'Data Quality',desc:'Primary data for >60% of movements',weight:10,portfolioScore:58},
  {criterion:'Verification',desc:'Third-party assurance of calculations',weight:10,portfolioScore:45},
];

/* ============================================================
   DATA: COUNTRY TRANSPORT EMISSION PROFILES
   ============================================================ */
const COUNTRY_EMISSION_MIX=COUNTRIES.map((c,i)=>({
  country:c,
  road:parseFloat((35+sr(i*263)*40).toFixed(1)),
  rail:parseFloat((5+sr(i*269)*20).toFixed(1)),
  maritime:parseFloat((10+sr(i*271)*25).toFixed(1)),
  aviation:parseFloat((5+sr(i*277)*15).toFixed(1)),
  lastMile:parseFloat((3+sr(i*281)*12).toFixed(1)),
  total:Math.round(50+sr(i*283)*500),
  electrificationRate:parseFloat((3+sr(i*293)*30).toFixed(1)),
  hIndex:parseFloat((0.3+sr(i*307)*0.5).toFixed(2)),
}));

const TABS=['Cross-Modal Emissions','Modal Shift Analyzer','Decarbonisation Levers','Logistics Finance'];

/* ============================================================
   STYLES
   ============================================================ */
const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
const cardSm={...card,padding:14};
const pill=(active)=>({padding:'7px 16px',borderRadius:20,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.textSec,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,transition:'all 0.15s'});
const badge=(color)=>({display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:color+'18',color,fontFamily:T.font});
const input={padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,outline:'none'};
const btn=(primary)=>({padding:'8px 18px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font});
const sliderS={width:'100%',accentColor:T.navy};
const thStyle={padding:'10px 10px',textAlign:'left',fontWeight:600,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',fontSize:11};
const tdStyle={padding:'8px 10px'};

/* ============================================================
   COMPONENT
   ============================================================ */
export default function TransportDecarbonisationPage(){
  const [tab,setTab]=useState(0);
  const [modeFilter,setModeFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [trajectoryFilter,setTrajectoryFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('annualEmissions');
  const [sortDir,setSortDir]=useState(-1);
  const [selCompany,setSelCompany]=useState(null);
  const [selRoute,setSelRoute]=useState(null);
  const [routeSearch,setRouteSearch]=useState('');
  const [shiftPcts,setShiftPcts]=useState({road:40,rail:25,maritime:25,multimodal:10});
  const [selLever,setSelLever]=useState(null);
  const [roadmapCo,setRoadmapCo]=useState(null);
  const [roadmapLevers,setRoadmapLevers]=useState([]);
  const [wtwToggle,setWtwToggle]=useState(false);
  const [carbonPrice,setCarbonPrice]=useState(50);
  const [passThrough,setPassThrough]=useState(60);
  const [finSearch,setFinSearch]=useState('');
  const [finTypeFilter,setFinTypeFilter]=useState('All');
  const [page,setPage]=useState(0);
  const [intensityView,setIntensityView]=useState('bar'); // bar | trend
  const PAGE_SIZE=15;

  /* FILTERED COMPANIES */
  const filtered=useMemo(()=>{
    let c=[...COMPANIES];
    if(modeFilter!=='All')c=c.filter(x=>x.mode===modeFilter);
    if(countryFilter!=='All')c=c.filter(x=>x.country===countryFilter);
    if(trajectoryFilter!=='All')c=c.filter(x=>x.trajectory===trajectoryFilter);
    if(search)c=c.filter(x=>x.name.toLowerCase().includes(search.toLowerCase())||x.country.toLowerCase().includes(search.toLowerCase()));
    c.sort((a,b)=>(a[sortCol]>b[sortCol]?1:-1)*sortDir);
    return c;
  },[modeFilter,countryFilter,trajectoryFilter,search,sortCol,sortDir]);

  const pagedCompanies=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const handleSort=useCallback(col=>{if(sortCol===col)setSortDir(d=>d*-1);else{setSortCol(col);setSortDir(-1);}},[sortCol]);

  /* MODE SUMMARY KPIs */
  const modeSummary=useMemo(()=>MODES.map((m,mi)=>{
    const cos=COMPANIES.filter(c=>c.mode===m);
    const totalEm=cos.reduce((s,c)=>s+c.annualEmissions,0);
    const avgInt=cos.length?cos.reduce((s,c)=>s+c.intensity,0)/cos.length:0;
    const aligned=cos.filter(c=>c.trajectory==='Aligned').length;
    const totalFleet=cos.reduce((s,c)=>s+c.fleet,0);
    return {mode:m,count:cos.length,totalEmissions:totalEm,avgIntensity:parseFloat(avgInt.toFixed(1)),aligned,totalFleet,color:MODE_COLORS[mi]};
  }),[]);

  /* PORTFOLIO TOTALS */
  const portfolioTotals=useMemo(()=>{
    const total=COMPANIES.reduce((s,c)=>s+c.annualEmissions,0);
    const avgInt=COMPANIES.reduce((s,c)=>s+c.intensity,0)/100;
    const alignedPct=(COMPANIES.filter(c=>c.trajectory==='Aligned').length);
    const totalFleet=COMPANIES.reduce((s,c)=>s+c.fleet,0);
    return {total,avgInt:parseFloat(avgInt.toFixed(1)),alignedPct,totalFleet};
  },[]);

  /* SHIFT SIMULATOR */
  const shiftResult=useMemo(()=>{
    const base=ROUTES.reduce((s,r)=>s+r.currentEmissions,0);
    const shifted=ROUTES.reduce((s,r)=>{
      const vol=r.volume*r.distance/1e6;
      return s+(vol*(MODE_INTENSITY[0]*shiftPcts.road/100+MODE_INTENSITY[1]*shiftPcts.rail/100+MODE_INTENSITY[2]*shiftPcts.maritime/100+MODE_INTENSITY[5]*shiftPcts.multimodal/100));
    },0);
    const costBase=ROUTES.reduce((s,r)=>s+r.currentCost,0);
    const costShifted=ROUTES.reduce((s,r)=>s+r.optimalCost,0);
    return {baseline:parseFloat(base.toFixed(0)),shifted:parseFloat(shifted.toFixed(0)),saving:parseFloat((base-shifted).toFixed(0)),pct:parseFloat(((1-shifted/base)*100).toFixed(1)),costBase,costShifted};
  },[shiftPcts]);

  /* ROADMAP PROJECTION */
  const roadmapProjection=useMemo(()=>{
    if(!roadmapCo)return[];
    const co=COMPANIES.find(c=>c.id===roadmapCo);
    if(!co)return[];
    return Array.from({length:11},(_,y)=>{
      const year=2025+y;
      let reduction=0;
      roadmapLevers.forEach(l=>{reduction+=LEVERS[l].reduction*0.008*y;});
      reduction=Math.min(reduction,92);
      return {year,emissions:parseFloat((co.annualEmissions*(1-reduction/100)).toFixed(0)),reduction:parseFloat(reduction.toFixed(1)),baseline:co.annualEmissions};
    });
  },[roadmapCo,roadmapLevers]);

  /* WATERFALL cost-benefit */
  const waterfall=useMemo(()=>roadmapLevers.map(l=>{
    const lever=LEVERS[l];
    const costNum=parseFloat(lever.investment.replace('$','').replace('T',''))*100;
    return {name:lever.name,cost:-Math.abs(costNum),benefit:lever.reduction*10,color:lever.color};
  }),[roadmapLevers]);

  /* FILTERED FINANCE */
  const filteredFinance=useMemo(()=>{
    let f=[...FINANCE];
    if(finSearch)f=f.filter(x=>x.name.toLowerCase().includes(finSearch.toLowerCase())||x.type.toLowerCase().includes(finSearch.toLowerCase()));
    if(finTypeFilter!=='All')f=f.filter(x=>x.type===finTypeFilter);
    return f;
  },[finSearch,finTypeFilter]);

  /* FILTERED ROUTES */
  const filteredRoutes=useMemo(()=>{
    if(!routeSearch)return ROUTES;
    return ROUTES.filter(r=>r.route.toLowerCase().includes(routeSearch.toLowerCase()));
  },[routeSearch]);

  /* EXPORT CSV */
  const exportCSV=useCallback(()=>{
    const headers=['Instrument','Type','Amount ($M)','Rate (%)','Tenor (yr)','GLEC Aligned','Mode','Country','Scope3 Cat4 (tCO2)','Scope3 Cat9 (tCO2)','Carbon Intensity','WTW Multiplier','Issued','Coupon','KPI Target'];
    const rows=filteredFinance.map(f=>[f.name,f.type,f.amount,f.rate,f.tenor,f.glecAligned?'Yes':'No',f.mode,f.country,f.scope3Cat4,f.scope3Cat9,f.carbonIntensity,f.wtwMultiplier,f.issued,f.couponType,f.kpiTarget+'%'].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='logistics_emissions_report.csv';a.click();URL.revokeObjectURL(url);
  },[filteredFinance]);

  /* =================== RENDER =================== */
  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      {/* HEADER */}
      <div style={{padding:'28px 32px 0',maxWidth:1480,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,margin:0,color:T.navy}}>Transport Decarbonisation Analytics</h1>
            <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>EP-AN5 -- Cross-modal transport emissions, modal shift analysis, freight logistics, GLEC Framework</p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={badge(T.green)}>GLEC v3.1</span>
            <span style={badge(T.navy)}>100 Companies</span>
            <span style={badge(T.gold)}>50 Routes</span>
            <span style={badge(T.sage)}>6 Modes</span>
          </div>
        </div>

        {/* PORTFOLIO KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
          {[
            {l:'Total Portfolio Emissions',v:`${(portfolioTotals.total/1e6).toFixed(2)}M tCO2e`,c:T.navy},
            {l:'Avg Intensity',v:`${portfolioTotals.avgInt} gCO2e/tkm`,c:T.gold},
            {l:'Companies Aligned',v:`${portfolioTotals.alignedPct}/100`,c:T.green},
            {l:'Total Fleet',v:portfolioTotals.totalFleet.toLocaleString(),c:T.sage},
            {l:'Countries Covered',v:'20',c:T.navyL},
          ].map((k,i)=>(
            <div key={i} style={{...cardSm,padding:12}}>
              <div style={{fontSize:10,color:T.textMut}}>{k.l}</div>
              <div style={{fontSize:17,fontWeight:700,color:k.c,marginTop:2}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
          {TABS.map((t,i)=><button key={t} onClick={()=>{setTab(i);setSelCompany(null);setSelRoute(null);setPage(0);}} style={pill(tab===i)}>{t}</button>)}
        </div>
      </div>

      <div style={{padding:'0 32px 40px',maxWidth:1480,margin:'0 auto'}}>

        {/* ============ TAB 0: CROSS-MODAL EMISSIONS ============ */}
        {tab===0 && (<div>
          {/* MODE KPI ROW */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
            {modeSummary.map(m=>(
              <div key={m.mode} style={{...cardSm,borderLeft:`3px solid ${m.color}`,padding:12}}>
                <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>{m.mode}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.color}}>{m.avgIntensity}</div>
                <div style={{fontSize:10,color:T.textSec}}>gCO2e/tkm avg</div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:T.textSec}}>
                  <span>{m.count} cos</span>
                  <span style={{color:T.green}}>{m.aligned} aligned</span>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>Fleet: {m.totalFleet.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* CHARTS ROW */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            {/* STACKED AREA CHART */}
            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Transport Emissions by Mode (MtCO2e)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MODE_EMISSIONS_STACK}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                  <Tooltip contentStyle={tip}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  {MODES.map((m,mi)=><Area key={m} type="monotone" dataKey={m} stackId="1" fill={MODE_COLORS[mi]} stroke={MODE_COLORS[mi]} fillOpacity={0.7}/>)}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* INTENSITY VIEW TOGGLE */}
            <div style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>Emissions Intensity by Mode</div>
                <div style={{display:'flex',gap:4}}>
                  {['bar','trend'].map(v=><button key={v} onClick={()=>setIntensityView(v)} style={{padding:'3px 10px',borderRadius:6,border:`1px solid ${intensityView===v?T.navy:T.border}`,background:intensityView===v?T.navy+'15':'transparent',color:intensityView===v?T.navy:T.textMut,fontSize:10,cursor:'pointer',fontFamily:T.font}}>{v==='bar'?'Current':'12Q Trend'}</button>)}
                </div>
              </div>
              {intensityView==='bar'?(
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={MODES.map((m,mi)=>({mode:m,intensity:MODE_INTENSITY[mi],color:MODE_COLORS[mi]}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="mode" tick={{fontSize:9,fill:T.textSec}} stroke={T.border}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec}} stroke={T.border} label={{value:'gCO2e/tkm',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={tip}/>
                    <Bar dataKey="intensity" radius={[6,6,0,0]} name="gCO2e/tkm">
                      {MODES.map((_,mi)=><Cell key={mi} fill={MODE_COLORS[mi]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ):(
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={QUARTERLY_MODE_INTENSITY}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}} stroke={T.border} interval={2}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                    <Tooltip contentStyle={tip}/>
                    <Legend wrapperStyle={{fontSize:10}}/>
                    {MODES.map((m,mi)=><Line key={m} type="monotone" dataKey={m} stroke={MODE_COLORS[mi]} strokeWidth={2} dot={false}/>)}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* GLEC FRAMEWORK ALIGNMENT + COUNTRY PROFILES */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>GLEC Framework Alignment Score</div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Portfolio alignment with Global Logistics Emissions Council methodology</div>
              {GLEC_CRITERIA.map(g=>(
                <div key={g.criterion} style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                    <span style={{fontWeight:600}}>{g.criterion} <span style={{fontWeight:400,color:T.textMut}}>({g.weight}%)</span></span>
                    <span style={{fontWeight:700,color:g.portfolioScore>=80?T.green:g.portfolioScore>=60?T.amber:T.red}}>{g.portfolioScore}%</span>
                  </div>
                  <div style={{height:6,borderRadius:3,background:T.border}}>
                    <div style={{height:6,borderRadius:3,background:g.portfolioScore>=80?T.green:g.portfolioScore>=60?T.amber:T.red,width:`${g.portfolioScore}%`,transition:'width 0.3s'}}/>
                  </div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{g.desc}</div>
                </div>
              ))}
              <div style={{marginTop:12,padding:10,borderRadius:8,background:T.surfaceH,textAlign:'center'}}>
                <div style={{fontSize:10,color:T.textMut}}>Weighted Portfolio GLEC Score</div>
                <div style={{fontSize:22,fontWeight:700,color:T.navy}}>{parseFloat((GLEC_CRITERIA.reduce((s,g)=>s+g.portfolioScore*g.weight,0)/100).toFixed(1))}%</div>
              </div>
            </div>

            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>Country Transport Emission Profiles</div>
              <div style={{overflow:'auto',maxHeight:380}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{background:T.surfaceH}}>
                      {['Country','Total MtCO2','Road %','Rail %','Maritime %','Aviation %','Electrif.'].map(h=>(
                        <th key={h} style={{padding:'6px 6px',textAlign:'left',fontWeight:600,color:T.textSec,fontSize:9,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COUNTRY_EMISSION_MIX.map(c=>(
                      <tr key={c.country} style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:'5px 6px',fontWeight:500}}>{c.country}</td>
                        <td style={{padding:'5px 6px',fontFamily:T.mono}}>{c.total}</td>
                        <td style={{padding:'5px 6px',fontFamily:T.mono,color:c.road>60?T.red:T.text}}>{c.road}</td>
                        <td style={{padding:'5px 6px',fontFamily:T.mono}}>{c.rail}</td>
                        <td style={{padding:'5px 6px',fontFamily:T.mono}}>{c.maritime}</td>
                        <td style={{padding:'5px 6px',fontFamily:T.mono}}>{c.aviation}</td>
                        <td style={{padding:'5px 6px',fontFamily:T.mono,color:c.electrificationRate>20?T.green:T.amber}}>{c.electrificationRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <select value={modeFilter} onChange={e=>{setModeFilter(e.target.value);setPage(0);}} style={input}>
              <option value="All">All Modes</option>
              {MODES.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <select value={countryFilter} onChange={e=>{setCountryFilter(e.target.value);setPage(0);}} style={input}>
              <option value="All">All Countries</option>
              {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={trajectoryFilter} onChange={e=>{setTrajectoryFilter(e.target.value);setPage(0);}} style={input}>
              <option value="All">All Trajectories</option>
              <option value="Aligned">Aligned</option>
              <option value="Misaligned">Misaligned</option>
            </select>
            <input placeholder="Search company or country..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{...input,width:220}}/>
            <span style={{fontSize:11,color:T.textMut,marginLeft:4}}>{filtered.length} companies</span>
          </div>

          {/* COMPANY TABLE + SIDE PANEL */}
          <div style={{display:'flex',gap:16}}>
            <div style={{flex:selCompany?'0 0 60%':'1',overflow:'auto'}}>
              <div style={{...card,padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:T.surfaceH}}>
                      {[{k:'name',l:'Company'},{k:'mode',l:'Mode'},{k:'country',l:'Country'},{k:'fleet',l:'Fleet'},{k:'annualEmissions',l:'Annual tCO2e'},{k:'intensity',l:'gCO2e/tkm'},{k:'trajectory',l:'Trajectory'},{k:'glecScore',l:'GLEC %'},{k:'engagementScore',l:'Engage'}].map(h=>(
                        <th key={h.k} onClick={()=>handleSort(h.k)} style={thStyle}>
                          {h.l}{sortCol===h.k?(sortDir===1?' \u25B2':' \u25BC'):''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedCompanies.map(c=>(
                      <tr key={c.id} onClick={()=>setSelCompany(selCompany===c.id?null:c.id)} style={{cursor:'pointer',background:selCompany===c.id?T.surfaceH:'transparent',borderBottom:`1px solid ${T.border}`,transition:'background 0.1s'}}>
                        <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
                        <td style={tdStyle}><span style={badge(MODE_COLORS[c.mIdx])}>{c.mode}</span></td>
                        <td style={tdStyle}>{c.country}</td>
                        <td style={{...tdStyle,fontFamily:T.mono}}>{c.fleet.toLocaleString()}</td>
                        <td style={{...tdStyle,fontFamily:T.mono}}>{c.annualEmissions.toLocaleString()}</td>
                        <td style={{...tdStyle,fontFamily:T.mono,fontWeight:600,color:c.intensity>100?T.red:c.intensity>40?T.amber:T.green}}>{c.intensity}</td>
                        <td style={tdStyle}><span style={badge(c.trajectory==='Aligned'?T.green:T.red)}>{c.trajectory}</span></td>
                        <td style={{...tdStyle,fontFamily:T.mono}}>{c.glecScore}%</td>
                        <td style={{...tdStyle,fontFamily:T.mono}}>{c.engagementScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* PAGINATION */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderTop:`1px solid ${T.border}`,background:T.surfaceH}}>
                  <span style={{fontSize:11,color:T.textMut}}>Page {page+1} of {totalPages} ({filtered.length} total)</span>
                  <div style={{display:'flex',gap:6}}>
                    <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{...btn(false),opacity:page===0?0.4:1}}>Prev</button>
                    <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} style={{...btn(false),opacity:page>=totalPages-1?0.4:1}}>Next</button>
                  </div>
                </div>
              </div>
            </div>

            {/* SIDE PANEL */}
            {selCompany && (()=>{
              const co=COMPANIES.find(c=>c.id===selCompany);
              if(!co)return null;
              return (
                <div style={{flex:'0 0 38%'}}>
                  <div style={{...card,position:'sticky',top:20}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:700}}>{co.name}</div>
                        <div style={{fontSize:11,color:T.textSec}}>{co.mode} -- {co.country} -- Fleet: {co.fleet.toLocaleString()}</div>
                      </div>
                      <button onClick={()=>setSelCompany(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:T.textMut}}>x</button>
                    </div>

                    {/* MINI KPIs */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                      {[{l:'Revenue',v:`$${co.revenue}M`,c:T.navy},{l:'Avg Fleet Age',v:`${co.avgAge}yr`,c:T.gold},{l:'Utilisation',v:`${co.utilisation}%`,c:T.sage}].map(k=>(
                        <div key={k.l} style={{padding:'6px 8px',borderRadius:8,background:T.surfaceH,textAlign:'center'}}>
                          <div style={{fontSize:9,color:T.textMut}}>{k.l}</div>
                          <div style={{fontSize:13,fontWeight:700,color:k.c}}>{k.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* 12Q INTENSITY TREND */}
                    <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Emissions Intensity Trend (12Q)</div>
                    <ResponsiveContainer width="100%" height={130}>
                      <LineChart data={co.quarterlyIntensity}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                        <XAxis dataKey="q" tick={{fontSize:8,fill:T.textSec}} stroke={T.border} interval={2}/>
                        <YAxis tick={{fontSize:8,fill:T.textSec}} stroke={T.border}/>
                        <Tooltip contentStyle={tip}/>
                        <Line type="monotone" dataKey="value" stroke={T.navy} strokeWidth={2} dot={{r:2,fill:T.navy}}/>
                      </LineChart>
                    </ResponsiveContainer>

                    {/* FLEET COMPOSITION */}
                    <div style={{fontSize:12,fontWeight:600,marginTop:10,marginBottom:6}}>Fleet Composition</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                      {Object.entries(co.fleetComposition).map(([k,v])=>(
                        <div key={k} style={{padding:'5px 8px',borderRadius:6,background:T.surfaceH,textAlign:'center'}}>
                          <div style={{fontSize:9,color:T.textMut,textTransform:'capitalize'}}>{k}</div>
                          <div style={{fontSize:13,fontWeight:700}}>{v}%</div>
                        </div>
                      ))}
                    </div>

                    {/* SCOPE BREAKDOWN */}
                    <div style={{fontSize:12,fontWeight:600,marginTop:10,marginBottom:6}}>Scope Breakdown</div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'Scope 1',v:co.scope1,c:T.red},{l:'Scope 2',v:co.scope2,c:T.amber},{l:'Scope 3',v:co.scope3,c:T.navy}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'5px',borderRadius:6,background:s.c+'10'}}>
                          <div style={{fontSize:9,color:T.textSec}}>{s.l}</div>
                          <div style={{fontSize:13,fontWeight:700,color:s.c}}>{s.v}%</div>
                        </div>
                      ))}
                    </div>

                    {/* DECARB TARGET */}
                    <div style={{fontSize:12,fontWeight:600,marginTop:10,marginBottom:4}}>Decarbonisation Target 2030</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <div style={{flex:1,height:6,borderRadius:3,background:T.border}}>
                        <div style={{height:6,borderRadius:3,background:co.trajectory==='Aligned'?T.green:T.amber,width:`${co.decarb2030}%`,transition:'width 0.3s'}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700}}>{co.decarb2030}%</span>
                    </div>

                    {/* ROADMAP MILESTONES */}
                    <div style={{fontSize:12,fontWeight:600,marginTop:10,marginBottom:6}}>Decarbonisation Roadmap</div>
                    <div style={{display:'flex',gap:4,overflowX:'auto'}}>
                      {co.roadmap.map(r=>(
                        <div key={r.year} style={{minWidth:55,padding:'4px 6px',borderRadius:6,background:T.surfaceH,textAlign:'center',fontSize:10}}>
                          <div style={{fontWeight:700}}>{r.year}</div>
                          <div style={{color:T.textSec}}>{(r.target/1000).toFixed(0)}k</div>
                        </div>
                      ))}
                    </div>

                    {/* LEVERS */}
                    <div style={{fontSize:12,fontWeight:600,marginTop:10,marginBottom:6}}>Active Levers</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {LEVERS.map((l,li)=>co.levers[li]&&<span key={li} style={{...badge(l.color),fontSize:9}}>{l.name}</span>)}
                    </div>

                    <div style={{fontSize:10,color:T.textMut,marginTop:10}}>Last engagement: {co.lastEngagement} -- Score: {co.engagementScore}/100</div>

                    <div style={{display:'flex',gap:8,marginTop:12}}>
                      <button onClick={()=>{setTab(2);setRoadmapCo(co.id);}} style={{...btn(true),flex:1}}>Build Roadmap</button>
                      <button style={{...btn(false),flex:1,color:T.sage}}>Engage</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>)}

        {/* ============ TAB 1: MODAL SHIFT ANALYZER ============ */}
        {tab===1 && (<div>
          <div style={{display:'flex',gap:16}}>
            {/* ROUTE LIST */}
            <div style={{flex:'0 0 42%'}}>
              <input placeholder="Search routes..." value={routeSearch} onChange={e=>setRouteSearch(e.target.value)} style={{...input,width:'100%',marginBottom:8}}/>
              <div style={{...card,padding:0,maxHeight:540,overflow:'auto'}}>
                <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,background:T.surfaceH,fontSize:12,fontWeight:700}}>Freight Routes ({filteredRoutes.length})</div>
                {filteredRoutes.map(r=>(
                  <div key={r.id} onClick={()=>setSelRoute(r.id)} style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,cursor:'pointer',background:selRoute===r.id?T.surfaceH:'transparent',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'background 0.1s'}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600}}>{r.route}</div>
                      <div style={{fontSize:10,color:T.textSec}}>{r.distance.toLocaleString()} km -- {r.volume.toLocaleString()} t -- {r.currentMode}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <span style={badge(r.savingPct>50?T.green:r.savingPct>20?T.amber:T.textMut)}>{r.savingPct}% saving</span>
                      <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{r.currentEmissions.toLocaleString()} tCO2e</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROUTE DETAIL */}
            <div style={{flex:1}}>
              {selRoute?(()=>{
                const r=ROUTES.find(x=>x.id===selRoute);
                if(!r)return null;
                const radarData=[
                  {metric:'Low Emissions',current:Math.max(5,100-r.currentEmissions/(r.currentEmissions+1)*100),optimal:Math.max(5,100-r.optimalEmissions/(r.currentEmissions+1)*100)},
                  {metric:'Low Cost',current:Math.max(5,100-r.currentCost/(r.currentCost+1)*100),optimal:Math.max(5,100-r.optimalCost/(r.currentCost+1)*100)},
                  {metric:'Speed',current:Math.max(10,100-r.currentTime/(r.currentTime+r.optimalTime+1)*100),optimal:Math.max(10,100-r.optimalTime/(r.currentTime+r.optimalTime+1)*100)},
                  {metric:'Reliability',current:r.reliability.road,optimal:r.reliability.rail},
                  {metric:'Flexibility',current:parseFloat((70+sr(r.id*251)*25).toFixed(0)),optimal:parseFloat((55+sr(r.id*257)*30).toFixed(0))},
                ];
                return (<div>
                  <div style={{...card,marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:700}}>{r.route}</div>
                        <div style={{fontSize:11,color:T.textSec}}>{r.distance.toLocaleString()} km -- {r.volume.toLocaleString()} tonnes/year</div>
                      </div>
                      <button onClick={()=>setSelRoute(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:T.textMut}}>x</button>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                      <div style={{padding:14,borderRadius:10,background:T.red+'08',border:`1px solid ${T.red}18`}}>
                        <div style={{fontSize:10,color:T.textMut}}>Current Mode</div>
                        <div style={{fontSize:16,fontWeight:700,color:T.red}}>{r.currentMode}</div>
                        <div style={{marginTop:4,fontSize:12}}>{r.currentEmissions.toLocaleString()} tCO2e</div>
                        <div style={{fontSize:11,color:T.textSec}}>${r.currentCost.toLocaleString()} -- {r.currentTime}h transit</div>
                      </div>
                      <div style={{padding:14,borderRadius:10,background:T.green+'08',border:`1px solid ${T.green}18`}}>
                        <div style={{fontSize:10,color:T.textMut}}>Optimal Mode</div>
                        <div style={{fontSize:16,fontWeight:700,color:T.green}}>{r.optimalMode}</div>
                        <div style={{marginTop:4,fontSize:12}}>{r.optimalEmissions.toLocaleString()} tCO2e</div>
                        <div style={{fontSize:11,color:T.textSec}}>${r.optimalCost.toLocaleString()} -- {r.optimalTime}h transit</div>
                      </div>
                    </div>

                    {/* MODAL COMPARISON TABLE */}
                    <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>All-Mode Comparison</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:14}}>
                      <thead><tr style={{background:T.surfaceH}}>
                        {['Mode','Emissions (tCO2e)','Cost ($)','Time (h)','Reliability (%)'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',fontWeight:600,color:T.textSec,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {r.modalComparison.map(mc=>(
                          <tr key={mc.mode} style={{borderBottom:`1px solid ${T.border}`,background:mc.mode===r.optimalMode?T.green+'08':'transparent'}}>
                            <td style={{padding:'6px 8px',fontWeight:500}}>{mc.mode}</td>
                            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{mc.emissions.toLocaleString()}</td>
                            <td style={{padding:'6px 8px',fontFamily:T.mono}}>${mc.cost.toLocaleString()}</td>
                            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{mc.time}</td>
                            <td style={{padding:'6px 8px',fontFamily:T.mono,color:mc.reliability>=90?T.green:mc.reliability>=80?T.amber:T.red}}>{mc.reliability}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* RADAR */}
                    <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Current vs Optimal Radar</div>
                    <ResponsiveContainer width="100%" height={230}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke={T.border}/>
                        <PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:T.textSec}}/>
                        <PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/>
                        <Radar name="Current" dataKey="current" stroke={T.red} fill={T.red} fillOpacity={0.15}/>
                        <Radar name="Optimal" dataKey="optimal" stroke={T.green} fill={T.green} fillOpacity={0.15}/>
                        <Legend wrapperStyle={{fontSize:10}}/>
                      </RadarChart>
                    </ResponsiveContainer>

                    {/* BOTTLENECKS */}
                    <div style={{fontSize:12,fontWeight:600,marginTop:6,marginBottom:6}}>Infrastructure Bottlenecks</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                      {r.bottlenecks.map((b,bi)=><span key={bi} style={badge(T.amber)}>{b}</span>)}
                    </div>

                    {/* RELIABILITY */}
                    <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Reliability by Mode (%)</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                      {Object.entries(r.reliability).map(([k,v])=>(
                        <div key={k} style={{textAlign:'center',padding:6,borderRadius:6,background:T.surfaceH}}>
                          <div style={{fontSize:9,color:T.textMut,textTransform:'capitalize'}}>{k}</div>
                          <div style={{fontSize:13,fontWeight:700,color:v>=90?T.green:v>=80?T.amber:T.red}}>{v}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RECOMMENDATION */}
                  <div style={{...cardSm,background:T.green+'08',borderColor:T.green+'33'}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:4}}>Optimisation Recommendation</div>
                    <div style={{fontSize:12,color:T.textSec}}>
                      Shift from <strong>{r.currentMode}</strong> to <strong>{r.optimalMode}</strong> to save {r.savingPct}% emissions ({(r.currentEmissions-r.optimalEmissions).toLocaleString()} tCO2e/yr). Cost delta: ${(r.currentCost-r.optimalCost).toLocaleString()}. Transit time change: {r.optimalTime-r.currentTime>0?'+':''}{r.optimalTime-r.currentTime}h.
                    </div>
                  </div>
                </div>);
              })():(
                <div style={{...card,textAlign:'center',padding:60,color:T.textMut}}>Select a route to analyze modal comparison</div>
              )}
            </div>
          </div>

          {/* SHIFT SIMULATOR */}
          <div style={{...card,marginTop:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>System Modal Shift Simulator</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:14}}>Adjust modal mix to see total system emissions and cost impact across all 50 routes</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:16}}>
              {[{k:'road',l:'Road %',c:MODE_COLORS[0]},{k:'rail',l:'Rail %',c:MODE_COLORS[1]},{k:'maritime',l:'Maritime %',c:MODE_COLORS[2]},{k:'multimodal',l:'Multimodal %',c:MODE_COLORS[5]}].map(s=>(
                <div key={s.k}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:4}}>
                    <span>{s.l}</span><span style={{fontWeight:700,color:s.c}}>{shiftPcts[s.k]}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={shiftPcts[s.k]} onChange={e=>{
                    const val=Number(e.target.value);
                    const others=Object.keys(shiftPcts).filter(x=>x!==s.k);
                    const remaining=100-val;
                    const oldSum=others.reduce((sum,k2)=>sum+shiftPcts[k2],0)||1;
                    const np={...shiftPcts,[s.k]:val};
                    others.forEach(k2=>{np[k2]=Math.round(shiftPcts[k2]/oldSum*remaining);});
                    const diff=100-Object.values(np).reduce((a,b)=>a+b,0);
                    np[others[0]]+=diff;
                    setShiftPcts(np);
                  }} style={sliderS}/>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
              {[
                {l:'Baseline Emissions',v:shiftResult.baseline.toLocaleString(),u:'tCO2e',c:T.text,bg:T.surfaceH},
                {l:'Shifted Emissions',v:shiftResult.shifted.toLocaleString(),u:'tCO2e',c:T.navy,bg:T.surfaceH},
                {l:'Emissions Saved',v:shiftResult.saving.toLocaleString(),u:'tCO2e',c:T.green,bg:T.green+'08'},
                {l:'Reduction',v:`${shiftResult.pct}%`,u:'vs baseline',c:T.green,bg:T.green+'08'},
                {l:'Cost Saving',v:`$${((shiftResult.costBase-shiftResult.costShifted)/1e6).toFixed(1)}M`,u:'estimated',c:T.gold,bg:T.gold+'08'},
              ].map((k,i)=>(
                <div key={i} style={{padding:12,borderRadius:8,background:k.bg,textAlign:'center'}}>
                  <div style={{fontSize:10,color:T.textMut}}>{k.l}</div>
                  <div style={{fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
                  <div style={{fontSize:10,color:T.textSec}}>{k.u}</div>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ============ TAB 2: DECARBONISATION LEVERS ============ */}
        {tab===2 && (<div>
          {/* LEVER RADAR + ADOPTION */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Lever Comparison Radar</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={[
                  {dim:'Cost Efficiency',...Object.fromEntries(LEVERS.map(l=>[l.name,l.cost]))},
                  {dim:'Emissions Reduction',...Object.fromEntries(LEVERS.map(l=>[l.name,l.reduction]))},
                  {dim:'Technology Maturity',...Object.fromEntries(LEVERS.map(l=>[l.name,l.maturity]))},
                  {dim:'Scalability',...Object.fromEntries(LEVERS.map(l=>[l.name,l.scalability]))},
                  {dim:'Implementation Speed',...Object.fromEntries(LEVERS.map(l=>[l.name,l.timeframe]))},
                  {dim:'Infrastructure Readiness',...Object.fromEntries(LEVERS.map(l=>[l.name,l.infrastructure]))},
                ]}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/>
                  <PolarRadiusAxis tick={{fontSize:8}} domain={[0,100]}/>
                  {LEVERS.map(l=><Radar key={l.name} name={l.name} dataKey={l.name} stroke={l.color} fill={l.color} fillOpacity={0.06}/>)}
                  <Legend wrapperStyle={{fontSize:9}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Current Adoption vs 2030 Potential</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={LEVERS.map(l=>({name:l.name,current:l.adoption,potential:l.potential2030}))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,60]} unit="%"/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={130}/>
                  <Tooltip contentStyle={tip}/>
                  <Bar dataKey="current" fill={T.navy} radius={[0,4,4,0]} name="Current Adoption %"/>
                  <Bar dataKey="potential" fill={T.gold} radius={[0,4,4,0]} name="2030 Potential %"/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LEVER CARDS */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {LEVERS.map(l=>(
              <div key={l.id} onClick={()=>setSelLever(selLever===l.id?null:l.id)} style={{...cardSm,cursor:'pointer',borderLeft:`3px solid ${l.color}`,background:selLever===l.id?T.surfaceH:T.surface,transition:'all 0.15s'}}>
                <div style={{fontSize:13,fontWeight:700,color:l.color,marginBottom:4}}>{l.name}</div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:8,minHeight:36,lineHeight:'14px'}}>{l.desc}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:8}}>
                  {l.modes.map(m=><span key={m} style={{...badge(T.navy),fontSize:8}}>{m}</span>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:10}}>
                  <div><span style={{color:T.textMut}}>Adoption:</span> <strong>{l.adoption}%</strong></div>
                  <div><span style={{color:T.textMut}}>2030:</span> <strong style={{color:T.green}}>{l.potential2030}%</strong></div>
                  <div><span style={{color:T.textMut}}>Invest:</span> <strong>{l.investment}</strong></div>
                  <div><span style={{color:T.textMut}}>Reduction:</span> <strong style={{color:T.green}}>{l.reduction}%</strong></div>
                </div>
                {selLever===l.id && (
                  <div style={{marginTop:10,padding:10,borderRadius:8,background:T.bg,fontSize:10,color:T.textSec}}>
                    <div style={{fontWeight:600,color:T.text,marginBottom:4}}>Detailed Metrics</div>
                    <div>Cost Efficiency: {l.cost}/100 -- Maturity: {l.maturity}/100</div>
                    <div>Scalability: {l.scalability}/100 -- Infrastructure: {l.infrastructure}/100</div>
                    <div>Timeframe: {l.timeframe}/100</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* COMPANY LEVER ADOPTION TRACKER */}
          <div style={{...card,marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Company Lever Adoption Tracker (Top 30)</div>
            <div style={{overflow:'auto',maxHeight:340}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead>
                  <tr style={{background:T.surfaceH}}>
                    <th style={{padding:'8px 10px',textAlign:'left',fontWeight:600,color:T.textSec,borderBottom:`1px solid ${T.border}`,position:'sticky',left:0,background:T.surfaceH,zIndex:1,minWidth:140}}>Company</th>
                    <th style={{padding:'8px 6px',textAlign:'left',fontWeight:600,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontSize:10}}>Mode</th>
                    {LEVERS.map(l=><th key={l.id} style={{padding:'8px 4px',textAlign:'center',fontWeight:600,color:l.color,borderBottom:`1px solid ${T.border}`,fontSize:9,whiteSpace:'nowrap'}}>{l.name}</th>)}
                    <th style={{padding:'8px 6px',textAlign:'center',fontWeight:600,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontSize:10}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPANIES.slice(0,30).map(c=>{
                    const total=c.levers.filter(Boolean).length;
                    return (
                      <tr key={c.id} style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:'5px 10px',fontWeight:500,whiteSpace:'nowrap',position:'sticky',left:0,background:T.surface,zIndex:1}}>{c.name}</td>
                        <td style={{padding:'5px 6px'}}><span style={{...badge(MODE_COLORS[c.mIdx]),fontSize:8}}>{c.mode}</span></td>
                        {LEVERS.map((l,li)=>(
                          <td key={li} style={{padding:'5px 4px',textAlign:'center'}}>
                            {c.levers[li]?<span style={{color:T.green,fontWeight:700,fontSize:12}}>&#10003;</span>:<span style={{color:T.borderL}}>-</span>}
                          </td>
                        ))}
                        <td style={{padding:'5px 6px',textAlign:'center',fontWeight:700,color:total>=5?T.green:total>=3?T.amber:T.textMut}}>{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BUILD ROADMAP TOOL */}
          <div style={card}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Build Decarbonisation Roadmap</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:14}}>Select a company and levers to project emissions reduction trajectory to 2035</div>
            <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap',alignItems:'flex-end'}}>
              <div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Select Company</div>
                <select value={roadmapCo||''} onChange={e=>setRoadmapCo(Number(e.target.value))} style={{...input,width:240}}>
                  <option value="">Choose company...</option>
                  {COMPANIES.map(c=><option key={c.id} value={c.id}>{c.name} ({c.mode})</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Select Levers</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {LEVERS.map(l=>(
                    <button key={l.id} onClick={()=>setRoadmapLevers(prev=>prev.includes(l.id)?prev.filter(x=>x!==l.id):[...prev,l.id])} style={{padding:'4px 10px',borderRadius:14,fontSize:10,fontWeight:600,border:`1px solid ${l.color}`,background:roadmapLevers.includes(l.id)?l.color+'20':'transparent',color:l.color,cursor:'pointer',fontFamily:T.font}}>
                      {roadmapLevers.includes(l.id)?'\u2713 ':''}{l.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {roadmapCo && roadmapLevers.length>0 ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Projected Emissions Curve (2025-2035)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={roadmapProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                      <YAxis tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                      <Tooltip contentStyle={tip} formatter={v=>fmt(v)}/>
                      <Area type="monotone" dataKey="baseline" fill={T.red} stroke={T.red} fillOpacity={0.05} strokeDasharray="5 5" name="Baseline"/>
                      <Area type="monotone" dataKey="emissions" fill={T.navy} stroke={T.navy} fillOpacity={0.15} name="With Levers"/>
                      <Legend wrapperStyle={{fontSize:10}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{fontSize:11,color:T.textSec,marginTop:6}}>
                    Final reduction by 2035: <strong style={{color:T.green}}>{roadmapProjection[roadmapProjection.length-1]?.reduction}%</strong> from baseline
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Cost-Benefit Waterfall by Lever</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={waterfall}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} stroke={T.border}/>
                      <YAxis tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                      <Tooltip contentStyle={tip}/>
                      <Bar dataKey="benefit" name="Benefit (emissions pts)" radius={[4,4,0,0]}>
                        {waterfall.map((w,i)=><Cell key={i} fill={w.color||T.green}/>)}
                      </Bar>
                      <Bar dataKey="cost" fill={T.red} radius={[4,4,0,0]} name="Cost ($bn equiv)"/>
                      <Legend wrapperStyle={{fontSize:10}}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div style={{color:T.textMut,fontSize:12,padding:30,textAlign:'center'}}>
                {!roadmapCo?'Select a company to start building a roadmap':'Select at least one lever to project emissions'}
              </div>
            )}
          </div>
        </div>)}

        {/* ============ TAB 3: LOGISTICS FINANCE ============ */}
        {tab===3 && (<div>
          {/* KPI ROW */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
            {[
              {l:'Green Instruments',v:FINANCE.length,c:T.navy},
              {l:'Total Volume',v:`$${FINANCE.reduce((s,f)=>s+f.amount,0).toLocaleString()}M`,c:T.gold},
              {l:'GLEC Aligned',v:`${FINANCE.filter(f=>f.glecAligned).length}/${FINANCE.length}`,c:T.green},
              {l:'Avg Intensity',v:`${parseFloat((FINANCE.reduce((s,f)=>s+f.carbonIntensity,0)/30).toFixed(1))} gCO2e/tkm`,c:T.amber},
              {l:'Avg WTW Multiplier',v:`${parseFloat((FINANCE.reduce((s,f)=>s+f.wtwMultiplier,0)/30).toFixed(2))}x`,c:T.navy},
            ].map((k,i)=>(
              <div key={i} style={cardSm}>
                <div style={{fontSize:10,color:T.textMut}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:k.c,marginTop:2}}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:16,marginBottom:20}}>
            {/* FINANCE TABLE */}
            <div style={{flex:'0 0 58%'}}>
              <div style={{display:'flex',gap:10,marginBottom:10,alignItems:'center'}}>
                <input placeholder="Search instruments..." value={finSearch} onChange={e=>setFinSearch(e.target.value)} style={{...input,width:200}}/>
                <select value={finTypeFilter} onChange={e=>setFinTypeFilter(e.target.value)} style={input}>
                  <option value="All">All Types</option>
                  {INSTRUMENTS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{display:'flex',gap:6,alignItems:'center',marginLeft:'auto'}}>
                  <span style={{fontSize:11,color:T.textSec}}>Well-to-Wheel</span>
                  <button onClick={()=>setWtwToggle(!wtwToggle)} style={{width:38,height:20,borderRadius:10,border:'none',background:wtwToggle?T.navy:T.border,cursor:'pointer',position:'relative'}}>
                    <div style={{width:16,height:16,borderRadius:8,background:'#fff',position:'absolute',top:2,left:wtwToggle?20:2,transition:'left 0.15s'}}/>
                  </button>
                  <span style={{fontSize:11,color:T.textSec}}>Tank-to-Wheel</span>
                </div>
                <button onClick={exportCSV} style={btn(true)}>Export CSV</button>
              </div>
              <div style={{...card,padding:0,overflow:'auto',maxHeight:480}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{background:T.surfaceH}}>
                      {['Instrument','Type','$M','Rate','Tenor','GLEC','Mode','Intensity','Cat4','Cat9','KPI'].map(h=>(
                        <th key={h} style={{padding:'8px 7px',textAlign:'left',fontWeight:600,color:T.textSec,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',fontSize:10}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinance.map(f=>{
                      const intVal=wtwToggle?parseFloat((f.carbonIntensity/f.wtwMultiplier).toFixed(1)):f.carbonIntensity;
                      return (
                        <tr key={f.id} style={{borderBottom:`1px solid ${T.border}`}}>
                          <td style={{padding:'7px',fontWeight:500,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</td>
                          <td style={{padding:'7px'}}><span style={badge(f.type.includes('Bond')?T.navy:T.sage)}>{f.type}</span></td>
                          <td style={{padding:'7px',fontFamily:T.mono}}>{f.amount}</td>
                          <td style={{padding:'7px',fontFamily:T.mono}}>{f.rate}%</td>
                          <td style={{padding:'7px',fontFamily:T.mono}}>{f.tenor}y</td>
                          <td style={{padding:'7px'}}>{f.glecAligned?<span style={{color:T.green,fontWeight:700}}>&#10003;</span>:<span style={{color:T.red}}>&#10007;</span>}</td>
                          <td style={{padding:'7px',fontSize:9}}>{f.mode}</td>
                          <td style={{padding:'7px',fontFamily:T.mono,color:intVal>60?T.red:intVal>30?T.amber:T.green}}>{intVal}</td>
                          <td style={{padding:'7px',fontFamily:T.mono,fontSize:10}}>{f.scope3Cat4.toLocaleString()}</td>
                          <td style={{padding:'7px',fontFamily:T.mono,fontSize:10}}>{f.scope3Cat9.toLocaleString()}</td>
                          <td style={{padding:'7px',fontFamily:T.mono}}>{f.kpiTarget}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{fontSize:10,color:T.textMut,marginTop:6}}>{filteredFinance.length} instruments shown -- {wtwToggle?'Tank-to-Wheel':'Well-to-Wheel'} intensity</div>
            </div>

            {/* RIGHT COLUMN: CALCULATOR + MODEL */}
            <div style={{flex:1}}>
              {/* SCOPE 3 CAT 4/9 CALCULATOR */}
              <div style={{...card,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Scope 3 Category 4/9 Calculator</div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:12}}>Upstream (Cat 4) and Downstream (Cat 9) transport emissions for logistics portfolio</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  <div style={{padding:10,borderRadius:8,background:T.surfaceH}}>
                    <div style={{fontSize:10,color:T.textMut}}>Total Cat 4 (Upstream)</div>
                    <div style={{fontSize:17,fontWeight:700,color:T.navy}}>{FINANCE.reduce((s,f)=>s+f.scope3Cat4,0).toLocaleString()}</div>
                    <div style={{fontSize:10,color:T.textSec}}>tCO2e across portfolio</div>
                  </div>
                  <div style={{padding:10,borderRadius:8,background:T.surfaceH}}>
                    <div style={{fontSize:10,color:T.textMut}}>Total Cat 9 (Downstream)</div>
                    <div style={{fontSize:17,fontWeight:700,color:T.gold}}>{FINANCE.reduce((s,f)=>s+f.scope3Cat9,0).toLocaleString()}</div>
                    <div style={{fontSize:10,color:T.textSec}}>tCO2e across portfolio</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={FINANCE.slice(0,12).map(f=>({name:f.name.split(' ')[0],cat4:f.scope3Cat4,cat9:f.scope3Cat9}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} stroke={T.border}/>
                    <YAxis tick={{fontSize:9,fill:T.textSec}} stroke={T.border}/>
                    <Tooltip contentStyle={tip}/>
                    <Bar dataKey="cat4" fill={T.navy} name="Cat 4 (Upstream)" radius={[3,3,0,0]}/>
                    <Bar dataKey="cat9" fill={T.gold} name="Cat 9 (Downstream)" radius={[3,3,0,0]}/>
                    <Legend wrapperStyle={{fontSize:9}}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* CARBON COST PASS-THROUGH MODEL */}
              <div style={{...card,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Carbon Cost Pass-Through Model</div>
                <div style={{fontSize:11,color:T.textSec,marginBottom:10}}>Estimate carbon pricing impact on logistics portfolio</div>
                <div style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}>
                    <span>Carbon Price ($/tCO2e)</span><span style={{fontWeight:700,color:T.navy,fontFamily:T.mono}}>${carbonPrice}</span>
                  </div>
                  <input type="range" min={10} max={200} value={carbonPrice} onChange={e=>setCarbonPrice(Number(e.target.value))} style={sliderS}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:3}}>
                    <span>Pass-Through Rate</span><span style={{fontWeight:700,color:T.navy,fontFamily:T.mono}}>{passThrough}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={passThrough} onChange={e=>setPassThrough(Number(e.target.value))} style={sliderS}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div style={{padding:10,borderRadius:8,background:T.red+'08',textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.textMut}}>Total Carbon Cost</div>
                    <div style={{fontSize:16,fontWeight:700,color:T.red}}>${(FINANCE.reduce((s,f)=>s+(f.scope3Cat4+f.scope3Cat9),0)*carbonPrice/1e6).toFixed(1)}M</div>
                  </div>
                  <div style={{padding:10,borderRadius:8,background:T.amber+'08',textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.textMut}}>Passed to Clients</div>
                    <div style={{fontSize:16,fontWeight:700,color:T.amber}}>${(FINANCE.reduce((s,f)=>s+(f.scope3Cat4+f.scope3Cat9),0)*carbonPrice*passThrough/100/1e6).toFixed(1)}M</div>
                  </div>
                </div>
                <div style={{marginTop:8,padding:8,borderRadius:6,background:T.surfaceH,textAlign:'center'}}>
                  <div style={{fontSize:10,color:T.textMut}}>Absorbed by Portfolio</div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>${(FINANCE.reduce((s,f)=>s+(f.scope3Cat4+f.scope3Cat9),0)*carbonPrice*(100-passThrough)/100/1e6).toFixed(1)}M</div>
                </div>
              </div>

              {/* SUPPLY CHAIN HOTSPOT PIE */}
              <div style={card}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Emission Hotspots by Mode</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={MODES.map((m,mi)=>({name:m,value:Math.round(FINANCE.filter(f=>f.mode===m).reduce((s,f)=>s+f.scope3Cat4+f.scope3Cat9,0))}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.border}} style={{fontSize:9}}>
                      {MODES.map((_,mi)=><Cell key={mi} fill={MODE_COLORS[mi]}/>)}
                    </Pie>
                    <Tooltip contentStyle={tip}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* GLEC CARBON ACCOUNTING FOR LOGISTICS PORTFOLIO */}
          <div style={{...card,marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>GLEC-Aligned Carbon Accounting</div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:14}}>Portfolio-level logistics emissions accounting aligned with GLEC Framework v3.1</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
              {GLEC_CRITERIA.map(g=>(
                <div key={g.criterion} style={{textAlign:'center',padding:10,borderRadius:8,background:g.portfolioScore>=80?T.green+'08':g.portfolioScore>=60?T.amber+'08':T.red+'08'}}>
                  <div style={{fontSize:20,fontWeight:700,color:g.portfolioScore>=80?T.green:g.portfolioScore>=60?T.amber:T.red}}>{g.portfolioScore}%</div>
                  <div style={{fontSize:9,color:T.textSec,marginTop:2,lineHeight:'12px'}}>{g.criterion}</div>
                  <div style={{fontSize:8,color:T.textMut,marginTop:1}}>wt: {g.weight}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* MODE EMISSIONS BREAKDOWN PIE + FINANCE BY TYPE */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            <div style={card}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Portfolio by Instrument Type</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={INSTRUMENTS.map((t,ti)=>({name:t,value:FINANCE.filter(f=>f.type===t).reduce((s,f)=>s+f.amount,0)}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.border}} style={{fontSize:9}}>
                    {INSTRUMENTS.map((_,ti)=><Cell key={ti} fill={[T.navy,T.sage,T.gold,T.amber,T.navyL][ti]}/>)}
                  </Pie>
                  <Tooltip contentStyle={tip}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Emissions Intensity Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {range:'0-20',count:FINANCE.filter(f=>f.carbonIntensity<=20).length},
                  {range:'20-40',count:FINANCE.filter(f=>f.carbonIntensity>20&&f.carbonIntensity<=40).length},
                  {range:'40-60',count:FINANCE.filter(f=>f.carbonIntensity>40&&f.carbonIntensity<=60).length},
                  {range:'60-80',count:FINANCE.filter(f=>f.carbonIntensity>60&&f.carbonIntensity<=80).length},
                  {range:'80+',count:FINANCE.filter(f=>f.carbonIntensity>80).length},
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="range" tick={{fontSize:10,fill:T.textSec}} stroke={T.border} label={{value:'gCO2e/tkm',position:'insideBottom',offset:-2,style:{fontSize:9,fill:T.textMut}}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}} stroke={T.border}/>
                  <Tooltip contentStyle={tip}/>
                  <Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]} name="Instruments">
                    {[T.green,T.sage,T.amber,T.red,T.red].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* REGULATORY TRACKER */}
          <div style={card}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Transport Regulatory Tracker</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {REGULATIONS.map((r,i)=>(
                <div key={i} style={{...cardSm,borderTop:`3px solid ${r.impact==='Critical'?T.red:r.impact==='High'?T.amber:T.sage}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,lineHeight:'14px'}}>{r.name}</div>
                    <span style={badge(r.status==='Active'?T.green:T.amber)}>{r.status}</span>
                  </div>
                  <div style={{fontSize:11,color:T.textSec,marginBottom:6,lineHeight:'14px'}}>{r.desc}</div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10}}>
                    <span style={{color:T.textMut}}>Deadline: <strong>{r.deadline}</strong></span>
                    <span style={{color:r.impact==='Critical'?T.red:r.impact==='High'?T.amber:T.sage,fontWeight:600}}>Impact: {r.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
