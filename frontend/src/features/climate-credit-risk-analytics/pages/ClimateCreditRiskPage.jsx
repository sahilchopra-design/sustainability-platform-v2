import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie,
  ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { NGFS_SCENARIOS, CARBON_PRICES, SECTOR_BENCHMARKS, EMISSION_FACTORS } from '../../../data/referenceData';
import { SECURITY_UNIVERSE, MOCK_PORTFOLIO } from '../../../data/securityUniverse';

/* ═══════════════════════════════════════════════════════════════════════════════
 * ClimateCreditRiskPage.jsx
 * Framework: IFRS 9 + ECB Climate Overlay + BoE CBES + EBA GL ESG Risk Mgmt
 * 7 Tabs · 80 borrowers · Full ECL engine · Physical + Transition overlays
 * ═══════════════════════════════════════════════════════════════════════════════ */

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(a,s)=>a[Math.floor(sr(s)*a.length)];
const range=(lo,hi,s)=>+(lo+sr(s)*(hi-lo)).toFixed(2);
const rangeInt=(lo,hi,s)=>Math.floor(lo+sr(s)*(hi-lo+1));
const fmt=(n,d=1)=>n>=1e9?(n/1e9).toFixed(d)+'bn':n>=1e6?(n/1e6).toFixed(d)+'M':n>=1e3?(n/1e3).toFixed(d)+'k':n.toFixed(d);
const fmtPct=(n,d=2)=>(n*100).toFixed(d)+'%';
const fmtGBP=(n)=>'£'+fmt(n);

/* ── Tab definitions ──────────────────────────────────────────────────────── */
const TABS=[
  {id:'portfolio',label:'Borrower Portfolio',icon:'📋'},
  {id:'transition',label:'Transition Risk',icon:'🔄'},
  {id:'physical',label:'Physical Risk',icon:'🌊'},
  {id:'ecl',label:'IFRS 9 ECL Engine',icon:'📊'},
  {id:'scenario',label:'Scenario Analysis',icon:'🎯'},
  {id:'epc',label:'EPC & Real Estate',icon:'🏗️'},
  {id:'regulatory',label:'Regulatory & Export',icon:'📑'},
];

/* ── Sector definitions ───────────────────────────────────────────────────── */
const SECTORS=['Oil & Gas','Utilities','Mining','Steel & Metals','Chemicals','Cement','Transport','Agriculture','Real Estate','Technology','Healthcare','Financial Services','Consumer Goods','Telecoms','Construction','Aerospace','Automotive','Retail','Food & Beverage','Shipping'];
const COUNTRIES=['UK','Germany','France','USA','Japan','India','Brazil','China','Australia','Canada','Netherlands','Italy','Spain','Norway','South Africa','Singapore','South Korea','Mexico','Indonesia','Nigeria'];
const RATINGS=['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];
const EPC_BANDS=['A','B','C','D','E','F','G'];
const HAZARDS=['Flood','Wildfire','Cyclone','Heat Stress','Sea Level Rise','Drought','Water Stress','Permafrost'];

/* ── Sector-level transition sensitivity parameters ───────────────────────── */
const SECTOR_SENSITIVITY={
  'Oil & Gas':{transSens:0.85,carbonIntBase:520,ebitdaMargin:0.22,physRiskBase:3.2},
  'Utilities':{transSens:0.72,carbonIntBase:480,ebitdaMargin:0.28,physRiskBase:2.8},
  'Mining':{transSens:0.68,carbonIntBase:380,ebitdaMargin:0.18,physRiskBase:3.5},
  'Steel & Metals':{transSens:0.75,carbonIntBase:620,ebitdaMargin:0.12,physRiskBase:2.1},
  'Chemicals':{transSens:0.58,carbonIntBase:340,ebitdaMargin:0.15,physRiskBase:2.4},
  'Cement':{transSens:0.70,carbonIntBase:720,ebitdaMargin:0.20,physRiskBase:1.9},
  'Transport':{transSens:0.55,carbonIntBase:280,ebitdaMargin:0.10,physRiskBase:3.0},
  'Agriculture':{transSens:0.30,carbonIntBase:120,ebitdaMargin:0.08,physRiskBase:4.2},
  'Real Estate':{transSens:0.25,carbonIntBase:45,ebitdaMargin:0.35,physRiskBase:3.8},
  'Technology':{transSens:0.08,carbonIntBase:8,ebitdaMargin:0.25,physRiskBase:1.2},
  'Healthcare':{transSens:0.10,carbonIntBase:15,ebitdaMargin:0.18,physRiskBase:1.5},
  'Financial Services':{transSens:0.05,carbonIntBase:4,ebitdaMargin:0.30,physRiskBase:1.0},
  'Consumer Goods':{transSens:0.20,carbonIntBase:35,ebitdaMargin:0.14,physRiskBase:2.0},
  'Telecoms':{transSens:0.12,carbonIntBase:20,ebitdaMargin:0.32,physRiskBase:2.5},
  'Construction':{transSens:0.35,carbonIntBase:85,ebitdaMargin:0.09,physRiskBase:2.8},
  'Aerospace':{transSens:0.42,carbonIntBase:180,ebitdaMargin:0.11,physRiskBase:1.8},
  'Automotive':{transSens:0.50,carbonIntBase:55,ebitdaMargin:0.08,physRiskBase:1.6},
  'Retail':{transSens:0.15,carbonIntBase:22,ebitdaMargin:0.06,physRiskBase:2.2},
  'Food & Beverage':{transSens:0.28,carbonIntBase:65,ebitdaMargin:0.13,physRiskBase:3.4},
  'Shipping':{transSens:0.62,carbonIntBase:350,ebitdaMargin:0.16,physRiskBase:3.6},
};

/* ── EPC → LGD haircut mapping (UK MEES framework) ───────────────────────── */
const EPC_LGD_HAIRCUT={A:0,B:0.02,C:0.05,D:0.08,E:0.12,F:0.18,G:0.25};
const EPC_MEES_RISK={A:'Compliant all horizons',B:'Compliant all horizons',C:'Compliant to 2027',D:'At risk post-2027',E:'Non-compliant post-2025',F:'Non-compliant now (grace period)',G:'Non-compliant — stranded risk'};
const EPC_RETROFIT_COST={A:0,B:15000,C:35000,D:65000,E:110000,F:175000,G:250000};

/* ── Generate 80 borrowers deterministically ──────────────────────────────── */
const generateBorrowers=()=>{
  const borrowers=[];
  const names=[
    'Meridian Energy plc','Nordic Hydro AS','Tata Steel Europe','BASF Chemicals GmbH','Lafarge Holcim AG',
    'Rio Tinto Mining','Shell International','BP Upstream','TotalEnergies SE','Eni SpA',
    'Iberdrola SA','EDF Group','RWE AG','National Grid plc','SSE plc',
    'Anglo American plc','Glencore International','BHP Group','Vale SA','Freeport-McMoRan',
    'ArcelorMittal SA','ThyssenKrupp AG','Nippon Steel Corp','POSCO Holdings','Nucor Corp',
    'HeidelbergCement AG','CRH plc','Cemex SAB','Holcim Group','Buzzi Unicem',
    'Maersk Group','CMA CGM SA','Hapag-Lloyd AG','MSC Mediterranean','Yang Ming Marine',
    'Cargill Inc','Archer Daniels Midland','Bunge Limited','Louis Dreyfus Co','Wilmar International',
    'British Land Co','Land Securities','Segro plc','Derwent London','Hammerson plc',
    'Microsoft Corp','Apple Inc','Alphabet Inc','SAP SE','Siemens AG',
    'Pfizer Inc','AstraZeneca plc','Novartis AG','Roche Holding','GSK plc',
    'HSBC Holdings','Barclays plc','Deutsche Bank AG','BNP Paribas SA','UBS Group AG',
    'Unilever plc','Nestle SA','P&G Company','L\'Oreal SA','Henkel AG',
    'Vodafone Group','Deutsche Telekom','Orange SA','Telefonica SA','BT Group plc',
    'Balfour Beatty','Vinci SA','Skanska AB','Bouygues SA','Ferrovial SA',
    'Airbus SE','Boeing Company','Rolls-Royce plc','Safran SA','BAE Systems plc',
    'Toyota Motor','Volkswagen AG','BMW Group','Mercedes-Benz AG','Stellantis NV',
    'Tesco plc','Carrefour SA','Walmart Inc','Amazon.com Inc','Ahold Delhaize',
    'Danone SA','AB InBev NV','Diageo plc','Mondelez Intl','JBS SA',
    'AP Moller-Maersk','Cosco Shipping','Evergreen Marine','ZIM Integrated','Pacific Basin Shipping',
  ];
  for(let i=0;i<80;i++){
    const seed=i*137+42;
    const sector=SECTORS[i%20];
    const ss=SECTOR_SENSITIVITY[sector]||SECTOR_SENSITIVITY['Consumer Goods'];
    const country=COUNTRIES[i%20];
    const exposure=range(10,800,seed)*1e6;
    const basePD=range(0.001,0.085,seed+1);
    const baseLGD=range(0.25,0.65,seed+2);
    const ead=exposure*range(0.85,1.05,seed+3);
    const ratingIdx=Math.min(17,Math.max(0,Math.floor(basePD*200)));
    const scope1=range(500,ss.carbonIntBase*2000,seed+4);
    const scope2=scope1*range(0.08,0.35,seed+5);
    const carbonIntensity=range(ss.carbonIntBase*0.5,ss.carbonIntBase*1.8,seed+6);
    const ebitda=exposure*ss.ebitdaMargin*range(0.6,1.4,seed+7);
    const epc=(sector==='Real Estate')?EPC_BANDS[rangeInt(0,6,seed+8)]:null;
    const physScores=HAZARDS.map((_,hi)=>rangeInt(1,5,seed+10+hi));
    const physRiskScore=+(physScores.reduce((a,b)=>a+b,0)/HAZARDS.length).toFixed(1);
    const collateralValue=(sector==='Real Estate')?exposure*range(1.1,1.8,seed+20):exposure*range(0.3,0.8,seed+20);
    const sbti=pick(['Committed','Target Set — 1.5°C','Target Set — WB2C','None','None'],seed+21);
    const dqs=rangeInt(1,5,seed+22);
    borrowers.push({
      id:i+1,
      name:names[i]||`Borrower ${i+1}`,
      sector,country,
      exposure,basePD,baseLGD,ead,
      rating:RATINGS[ratingIdx],
      scope1,scope2,
      carbonIntensity,ebitda,epc,
      physScores,physRiskScore,
      collateralValue,sbti,dqs,
      transSensitivity:ss.transSens*range(0.7,1.3,seed+23),
      ebitdaMargin:ss.ebitdaMargin,
      stage:basePD<0.02?1:basePD<0.05?2:3,
      maturityYears:rangeInt(1,15,seed+24),
      loanType:pick(['Term Loan','Revolving','Project Finance','Mortgage','Trade Finance'],seed+25),
      hasCollateral:sr(seed+26)>0.3,
      collateralType:pick(['Property','Equipment','Receivables','Inventory','None'],seed+27),
      industry:sector,
      lastReview:pick(['2024-Q4','2024-Q3','2024-Q2','2024-Q1','2023-Q4'],seed+28),
      watchlist:basePD>0.04,
    });
  }
  return borrowers;
};

/* ── Generate 40 CRE properties ───────────────────────────────────────────── */
const generateProperties=()=>{
  const props=[];
  const propNames=['City Tower','Riverside House','Victoria Plaza','Canary Wharf Unit','Manchester Central','Birmingham Gateway','Leeds Commerce','Bristol Harbourside','Edinburgh New Town','Glasgow Waterfront','Regent Street Block','Covent Garden Unit','Shoreditch Hub','Stratford Office','Battersea Power','King\'s Cross Quarter','Paddington Basin','Liverpool ONE','Sheffield Digital','Cardiff Bay','Docklands Suite','Angel Court','Moorgate Place','Finsbury Square','Aldgate East','Whitechapel Hub','Mile End Studios','Hoxton Works','Clerkenwell Green','Farringdon Point','Southbank Centre','Lambeth Walk','Vauxhall Cross','Pimlico Gardens','Chelsea Wharf','Fulham Reach','Hammersmith Grove','Chiswick Park','Richmond Gate','Twickenham Court'];
  for(let i=0;i<40;i++){
    const seed=i*193+77;
    const epc=EPC_BANDS[rangeInt(0,6,seed)];
    const value=range(5,120,seed+1)*1e6;
    const ltv=range(0.45,0.85,seed+2);
    const yearBuilt=rangeInt(1960,2022,seed+3);
    const sqm=rangeInt(800,25000,seed+4);
    const annualRent=value*range(0.04,0.08,seed+5);
    const occupancy=range(0.65,0.99,seed+6);
    props.push({
      id:i+1,
      name:propNames[i],
      type:pick(['Office','Retail','Industrial','Residential','Mixed-Use'],seed+7),
      epc,value,ltv,yearBuilt,sqm,annualRent,occupancy,
      location:pick(['London','Manchester','Birmingham','Leeds','Bristol','Edinburgh','Glasgow','Liverpool','Sheffield','Cardiff'],seed+8),
      lgdHaircut:EPC_LGD_HAIRCUT[epc],
      meesRisk:EPC_MEES_RISK[epc],
      retrofitCost:EPC_RETROFIT_COST[epc],
      floodZone:pick(['Zone 1 (Low)','Zone 2 (Medium)','Zone 3a (High)','Zone 3b (Functional)'],seed+9),
      energyCost:range(15,85,seed+10)*sqm,
      crremTarget:range(25,45,seed+11),
      crremActual:range(30,120,seed+12),
      strandedYear:epc>'D'?rangeInt(2025,2035,seed+13):null,
      nbsRating:pick(['A','B+','B','C+','C','D'],seed+14),
    });
  }
  return props;
};

const BORROWERS=generateBorrowers();
const PROPERTIES=generateProperties();

/* ── NGFS scenario weights for probability-weighted ECL ───────────────────── */
const SCENARIO_WEIGHTS={net_zero_2050:0.15,below_2c:0.25,delayed_transition:0.35,current_policies:0.25};

/* ── IFRS 9 ECL calculation helpers ───────────────────────────────────────── */
const calcClimatePD=(basePD,transSens,carbonPrice,scenario)=>{
  const scen=NGFS_SCENARIOS.find(s=>s.id===scenario)||NGFS_SCENARIOS[0];
  const priceShock=carbonPrice/100;
  const physMult=1+(scen.peakWarming_c-1.5)*0.05;
  const climatePD=Math.min(0.99,basePD*(1+transSens*priceShock)*physMult);
  return climatePD;
};

const calcClimateLGD=(baseLGD,epc,physRiskScore,scenario)=>{
  const scen=NGFS_SCENARIOS.find(s=>s.id===scenario)||NGFS_SCENARIOS[0];
  const epcHaircut=epc?EPC_LGD_HAIRCUT[epc]:0;
  const physHaircut=(physRiskScore-2.5)*0.02;
  const warmingHaircut=(scen.peakWarming_c-1.5)*0.03;
  return Math.min(0.99,baseLGD+epcHaircut+physHaircut+warmingHaircut);
};

const calcECL=(pd,lgd,ead,stage,maturity,discountRate=0.04)=>{
  if(stage===1){
    return pd*lgd*ead/(1+discountRate);
  }else{
    let lifetime=0;
    for(let y=1;y<=maturity;y++){
      const survProb=Math.pow(1-pd,y-1);
      const df=1/Math.pow(1+discountRate,y);
      lifetime+=pd*survProb*lgd*ead*df;
    }
    return lifetime;
  }
};

/* ── Regulatory items ─────────────────────────────────────────────────────── */
const REGULATORY_ITEMS=[
  {id:1,regulator:'ECB',ref:'ECB Guide on C&E Risks',section:'§ 4.3 — Credit risk',requirement:'Integrate climate factors into credit risk assessment including PD/LGD overlays',deadline:'2024-12-31',status:'Implemented',compliance:92},
  {id:2,regulator:'ECB',ref:'ECB SSM Expectations',section:'Expectation 7',requirement:'Incorporate climate risks in ICAAP and credit risk frameworks',deadline:'2024-06-30',status:'Implemented',compliance:88},
  {id:3,regulator:'ECB',ref:'ECB Climate Stress Test',section:'2022 CST',requirement:'Complete bottom-up climate stress test across lending book',deadline:'2024-03-31',status:'Completed',compliance:95},
  {id:4,regulator:'BoE',ref:'SS3/19',section:'§ 3.1-3.4',requirement:'Embed climate risk in governance, risk management, scenario analysis and disclosure',deadline:'2025-06-30',status:'In Progress',compliance:75},
  {id:5,regulator:'BoE',ref:'CBES',section:'Methodology § 3.2',requirement:'Climate Biennial Exploratory Scenario — physical & transition risk modelling',deadline:'2025-12-31',status:'In Progress',compliance:68},
  {id:6,regulator:'EBA',ref:'GL/2020/06',section:'ESG Risk Management',requirement:'ESG factors in credit risk policies, procedures and systems',deadline:'2024-12-31',status:'Implemented',compliance:85},
  {id:7,regulator:'EBA',ref:'CRR3 / ITS Pillar 3',section:'Art. 449a',requirement:'Pillar 3 ESG disclosures including banking book climate risk',deadline:'2025-06-30',status:'In Progress',compliance:62},
  {id:8,regulator:'ECB',ref:'C&E Risk Dashboard',section:'Annual SREP',requirement:'Climate risk materialisation dashboard with forward-looking indicators',deadline:'Ongoing',status:'Operational',compliance:80},
  {id:9,regulator:'BCBS',ref:'BCBS Principles',section:'Principle 4-6',requirement:'Climate risk in credit risk management and ICAAP',deadline:'2025-12-31',status:'In Progress',compliance:55},
  {id:10,regulator:'EBA',ref:'EBA Discussion Paper',section:'Role of Environmental Risks',requirement:'Integration of environmental risks in prudential framework',deadline:'2025-12-31',status:'Planning',compliance:35},
  {id:11,regulator:'BoE',ref:'CP16/22',section:'Climate Disclosures',requirement:'TCFD-aligned disclosures for banking book climate exposures',deadline:'2025-03-31',status:'Implemented',compliance:90},
  {id:12,regulator:'ECB',ref:'Fit-for-55 Assessment',section:'Sector assessment',requirement:'Assess Fit-for-55 policy package impact on credit portfolios',deadline:'2025-06-30',status:'In Progress',compliance:58},
];

/* ── Peer bank data for benchmarking ──────────────────────────────────────── */
const PEER_BANKS=[
  {name:'HSBC Holdings',gar:8.2,fe:920,tempScore:2.8,cet1Impact:-1.9,eclOverlay:420},
  {name:'Barclays plc',gar:6.5,fe:1050,tempScore:3.0,cet1Impact:-2.2,eclOverlay:380},
  {name:'Standard Chartered',gar:5.8,fe:880,tempScore:2.9,cet1Impact:-1.7,eclOverlay:290},
  {name:'Lloyds Banking',gar:7.1,fe:760,tempScore:2.6,cet1Impact:-1.5,eclOverlay:350},
  {name:'NatWest Group',gar:9.4,fe:640,tempScore:2.4,cet1Impact:-1.2,eclOverlay:280},
  {name:'Deutsche Bank',gar:5.2,fe:1180,tempScore:3.1,cet1Impact:-2.5,eclOverlay:510},
  {name:'BNP Paribas',gar:7.8,fe:980,tempScore:2.7,cet1Impact:-2.0,eclOverlay:460},
  {name:'Societe Generale',gar:6.9,fe:890,tempScore:2.8,cet1Impact:-1.8,eclOverlay:370},
  {name:'ING Group',gar:10.2,fe:550,tempScore:2.3,cet1Impact:-1.0,eclOverlay:220},
  {name:'UBS Group',gar:6.1,fe:720,tempScore:2.5,cet1Impact:-1.4,eclOverlay:310},
];

/* ═══════════════════════════════════════════════════════════════════════════════
 * STYLES
 * ═══════════════════════════════════════════════════════════════════════════════ */
const S={
  page:{background:T.bg,minHeight:'100vh',fontFamily:T.font,color:T.text,padding:0,margin:0},
  header:{background:T.navy,padding:'20px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:20,fontWeight:700,margin:0,letterSpacing:'-0.3px'},
  headerSub:{color:T.goldL,fontSize:12,fontFamily:T.mono,marginTop:2},
  headerRight:{display:'flex',gap:8,alignItems:'center'},
  badge:{background:'rgba(197,169,106,0.15)',color:T.gold,fontSize:10,fontFamily:T.mono,padding:'3px 8px',borderRadius:4,fontWeight:600},
  tabBar:{display:'flex',gap:0,background:T.surface,borderBottom:`2px solid ${T.border}`,padding:'0 24px',overflowX:'auto'},
  tab:{padding:'12px 18px',cursor:'pointer',fontSize:13,fontWeight:500,color:T.textSec,borderBottom:'2px solid transparent',transition:'all 0.15s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6},
  tabActive:{color:T.navy,borderBottom:`2px solid ${T.gold}`,fontWeight:700},
  content:{padding:'24px 32px',maxWidth:1600,margin:'0 auto'},
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:20},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:4},
  cardSub:{fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:16},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16},
  kpi:{background:T.surface,borderRadius:8,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center'},
  kpiValue:{fontSize:22,fontWeight:800,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textSec,marginTop:4},
  kpiSub:{fontSize:10,color:T.textMut,fontFamily:T.mono,marginTop:2},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:T.textSec,borderBottom:`2px solid ${T.border}`,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px',position:'sticky',top:0,background:T.surface,whiteSpace:'nowrap'},
  td:{padding:'8px 12px',borderBottom:`1px solid ${T.border}`,fontSize:12,whiteSpace:'nowrap'},
  input:{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,outline:'none',background:T.surface},
  select:{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,cursor:'pointer'},
  btn:{padding:'8px 16px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s'},
  btnPrimary:{background:T.navy,color:'#fff'},
  btnGold:{background:T.gold,color:'#fff'},
  btnOutline:{background:'transparent',border:`1px solid ${T.border}`,color:T.text},
  slider:{width:'100%',accentColor:T.gold},
  sidePanel:{position:'fixed',top:0,right:0,width:480,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24},
  tag:(color)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,fontFamily:T.mono,background:`${color}18`,color}),
  cite:{fontSize:10,color:T.textMut,fontFamily:T.mono,fontStyle:'italic',marginTop:8,display:'block'},
  heatCell:(v,max=5)=>{const pct=v/max;const r=Math.round(220-pct*180);const g=Math.round(220-pct*40);return{background:`rgb(${r},${g},${Math.round(220-pct*100)})`,color:pct>0.6?'#fff':T.text,padding:'6px 10px',textAlign:'center',fontSize:11,fontWeight:600,fontFamily:T.mono};},
  scrollTable:{overflowX:'auto',overflowY:'auto',maxHeight:520},
  filterBar:{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16,alignItems:'center'},
  pillActive:{background:T.navy,color:'#fff',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',border:'none'},
  pill:{background:T.surfaceH,color:T.textSec,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',border:`1px solid ${T.border}`},
  progressBar:(pct,color=T.sage)=>({position:'relative',height:8,borderRadius:4,background:T.surfaceH,overflow:'hidden','::after':{content:'""',position:'absolute',left:0,top:0,height:'100%',width:`${pct}%`,background:color,borderRadius:4}}),
  summary:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20},
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 1: BORROWER PORTFOLIO
 * ═══════════════════════════════════════════════════════════════════════════════ */
const BorrowerPortfolioTab=({borrowers,onSelect})=>{
  const [sectorFilter,setSectorFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [ratingFilter,setRatingFilter]=useState('All');
  const [stageFilter,setStageFilter]=useState('All');
  const [watchlistOnly,setWatchlistOnly]=useState(false);
  const [searchTerm,setSearchTerm]=useState('');
  const [sortCol,setSortCol]=useState('exposure');
  const [sortDir,setSortDir]=useState('desc');

  const filtered=useMemo(()=>{
    let d=[...borrowers];
    if(sectorFilter!=='All')d=d.filter(b=>b.sector===sectorFilter);
    if(countryFilter!=='All')d=d.filter(b=>b.country===countryFilter);
    if(ratingFilter!=='All')d=d.filter(b=>b.rating===ratingFilter);
    if(stageFilter!=='All')d=d.filter(b=>b.stage===parseInt(stageFilter));
    if(watchlistOnly)d=d.filter(b=>b.watchlist);
    if(searchTerm)d=d.filter(b=>b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    d.sort((a,b)=>{
      const m=sortDir==='asc'?1:-1;
      if(typeof a[sortCol]==='number')return(a[sortCol]-b[sortCol])*m;
      return String(a[sortCol]).localeCompare(String(b[sortCol]))*m;
    });
    return d;
  },[borrowers,sectorFilter,countryFilter,ratingFilter,stageFilter,watchlistOnly,searchTerm,sortCol,sortDir]);

  const toggleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const totalExposure=filtered.reduce((s,b)=>s+b.exposure,0);
  const avgPD=filtered.length?filtered.reduce((s,b)=>s+b.basePD,0)/filtered.length:0;
  const avgLGD=filtered.length?filtered.reduce((s,b)=>s+b.baseLGD,0)/filtered.length:0;
  const stage1=filtered.filter(b=>b.stage===1).length;
  const stage2=filtered.filter(b=>b.stage===2).length;
  const stage3=filtered.filter(b=>b.stage===3).length;
  const watchCount=filtered.filter(b=>b.watchlist).length;

  const sectorConcentration=useMemo(()=>{
    const map={};
    filtered.forEach(b=>{map[b.sector]=(map[b.sector]||0)+b.exposure;});
    return Object.entries(map).map(([s,v])=>({sector:s,exposure:v,pct:totalExposure?v/totalExposure*100:0})).sort((a,b)=>b.exposure-a.exposure);
  },[filtered,totalExposure]);

  const ratingDist=useMemo(()=>{
    const map={};
    filtered.forEach(b=>{map[b.rating]=(map[b.rating]||0)+1;});
    return RATINGS.filter(r=>map[r]).map(r=>({rating:r,count:map[r]||0}));
  },[filtered]);

  return(
    <div>
      {/* Summary KPIs */}
      <div style={S.summary}>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{fmtGBP(totalExposure)}</div>
          <div style={S.kpiLabel}>Total Exposure</div>
          <div style={S.kpiSub}>{filtered.length} borrowers</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:avgPD>0.03?T.red:T.navy}}>{fmtPct(avgPD)}</div>
          <div style={S.kpiLabel}>Weighted Avg PD</div>
          <div style={S.kpiSub}>Portfolio basis</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{fmtPct(avgLGD)}</div>
          <div style={S.kpiLabel}>Weighted Avg LGD</div>
          <div style={S.kpiSub}>Before climate overlay</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,fontSize:16}}>
            <span style={{color:T.green}}>{stage1}</span> / <span style={{color:T.amber}}>{stage2}</span> / <span style={{color:T.red}}>{stage3}</span>
          </div>
          <div style={S.kpiLabel}>Stage 1 / 2 / 3</div>
          <div style={S.kpiSub}>IFRS 9 classification</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{watchCount}</div>
          <div style={S.kpiLabel}>Watchlist</div>
          <div style={S.kpiSub}>Elevated climate risk</div>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filterBar}>
        <input style={{...S.input,width:200}} placeholder="Search borrower..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
        <select style={S.select} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.select} value={countryFilter} onChange={e=>setCountryFilter(e.target.value)}>
          <option value="All">All Countries</option>
          {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select style={S.select} value={ratingFilter} onChange={e=>setRatingFilter(e.target.value)}>
          <option value="All">All Ratings</option>
          {RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select style={S.select} value={stageFilter} onChange={e=>setStageFilter(e.target.value)}>
          <option value="All">All Stages</option>
          <option value="1">Stage 1</option>
          <option value="2">Stage 2</option>
          <option value="3">Stage 3</option>
        </select>
        <label style={{fontSize:11,display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
          <input type="checkbox" checked={watchlistOnly} onChange={e=>setWatchlistOnly(e.target.checked)}/>
          Watchlist only
        </label>
        <span style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginLeft:'auto'}}>{filtered.length} of {borrowers.length} shown</span>
      </div>

      <div style={S.grid2}>
        {/* Sector Concentration */}
        <div style={S.card}>
          <div style={S.cardTitle}>Sector Concentration</div>
          <div style={S.cardSub}>Top sectors by exposure</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sectorConcentration.slice(0,10)} layout="vertical" margin={{left:100}}>
              <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>fmt(v)}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:10}} width={95}/>
              <Tooltip formatter={v=>[fmtGBP(v),'Exposure']}/>
              <Bar dataKey="exposure" radius={[0,4,4,0]}>
                {sectorConcentration.slice(0,10).map((e,i)=><Cell key={i} fill={i<3?T.red:i<6?T.amber:T.sage}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div style={S.card}>
          <div style={S.cardTitle}>Rating Distribution</div>
          <div style={S.cardSub}>Count of borrowers by external rating</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ratingDist}>
              <XAxis dataKey="rating" tick={{fontSize:10,fontFamily:T.mono}}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {ratingDist.map((e,i)=>{
                  const idx=RATINGS.indexOf(e.rating);
                  return <Cell key={i} fill={idx<=6?T.green:idx<=12?T.amber:T.red}/>;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Borrower Table */}
      <div style={{...S.card,padding:0}}>
        <div style={{padding:'16px 20px 0'}}>
          <div style={S.cardTitle}>Borrower Book — {filtered.length} Counterparties</div>
          <div style={S.cardSub}>Click any row for detailed credit profile + climate overlay</div>
        </div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                {[
                  {key:'name',label:'Borrower'},{key:'sector',label:'Sector'},{key:'country',label:'Country'},
                  {key:'exposure',label:'Exposure (£M)'},{key:'basePD',label:'PD (%)'},{key:'baseLGD',label:'LGD (%)'},
                  {key:'ead',label:'EAD (£M)'},{key:'rating',label:'Rating'},{key:'scope1',label:'Scope 1 (tCO₂e)'},
                  {key:'scope2',label:'Scope 2 (tCO₂e)'},{key:'carbonIntensity',label:'Carbon Int.'},
                  {key:'epc',label:'EPC'},{key:'stage',label:'Stage'},{key:'watchlist',label:'Watch'},
                ].map(c=>(
                  <th key={c.key} style={{...S.th,cursor:'pointer'}} onClick={()=>toggleSort(c.key)}>
                    {c.label}{sortCol===c.key?(sortDir==='asc'?' ▲':' ▼'):''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b=>(
                <tr key={b.id} style={{cursor:'pointer',background:b.watchlist?'#fef2f208':'transparent'}} onClick={()=>onSelect(b)}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH} onMouseLeave={e=>e.currentTarget.style.background=b.watchlist?'#fef2f208':'transparent'}>
                  <td style={{...S.td,fontWeight:600,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{b.name}</td>
                  <td style={S.td}>{b.sector}</td>
                  <td style={S.td}>{b.country}</td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right'}}>{(b.exposure/1e6).toFixed(1)}</td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right',color:b.basePD>0.04?T.red:b.basePD>0.02?T.amber:T.green}}>{(b.basePD*100).toFixed(2)}</td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right'}}>{(b.baseLGD*100).toFixed(1)}</td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right'}}>{(b.ead/1e6).toFixed(1)}</td>
                  <td style={S.td}><span style={S.tag(RATINGS.indexOf(b.rating)<=6?T.green:RATINGS.indexOf(b.rating)<=12?T.amber:T.red)}>{b.rating}</span></td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right'}}>{fmt(b.scope1,0)}</td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right'}}>{fmt(b.scope2,0)}</td>
                  <td style={{...S.td,fontFamily:T.mono,textAlign:'right'}}>{b.carbonIntensity.toFixed(0)}</td>
                  <td style={S.td}>{b.epc?<span style={S.tag(b.epc<='C'?T.green:b.epc<='E'?T.amber:T.red)}>{b.epc}</span>:'—'}</td>
                  <td style={S.td}><span style={S.tag(b.stage===1?T.green:b.stage===2?T.amber:T.red)}>S{b.stage}</span></td>
                  <td style={S.td}>{b.watchlist?'⚠️':''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Side Panel for selected borrower ─────────────────────────────────────── */
const BorrowerSidePanel=({borrower,onClose,carbonPrice})=>{
  if(!borrower)return null;
  const b=borrower;
  const climatePDs=NGFS_SCENARIOS.slice(0,4).map(scen=>({
    scenario:scen.name,
    basePD:b.basePD,
    climatePD:calcClimatePD(b.basePD,b.transSensitivity,carbonPrice,scen.id),
    uplift:calcClimatePD(b.basePD,b.transSensitivity,carbonPrice,scen.id)/b.basePD-1,
    color:scen.color,
  }));
  const climateLGDs=NGFS_SCENARIOS.slice(0,4).map(scen=>({
    scenario:scen.name,
    baseLGD:b.baseLGD,
    climateLGD:calcClimateLGD(b.baseLGD,b.epc,b.physRiskScore,scen.id),
    color:scen.color,
  }));
  const ebitdaImpact=(b.scope1*carbonPrice/1000)/b.ebitda;

  return(
    <div style={S.sidePanel}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{b.name}</div>
          <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{b.sector} · {b.country} · {b.rating}</div>
        </div>
        <button onClick={onClose} style={{...S.btn,background:T.surfaceH,border:`1px solid ${T.border}`}}>✕ Close</button>
      </div>

      {/* Credit Profile */}
      <div style={{...S.card,background:T.surfaceH}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Credit Profile</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[
            ['Exposure',fmtGBP(b.exposure)],['EAD',fmtGBP(b.ead)],['Base PD',fmtPct(b.basePD)],
            ['Base LGD',fmtPct(b.baseLGD)],['Rating',b.rating],['Stage',`Stage ${b.stage}`],
            ['Maturity',`${b.maturityYears}Y`],['Loan Type',b.loanType],['Collateral',b.hasCollateral?'Yes':'No'],
            ['Last Review',b.lastReview],['DQS',`${b.dqs}/5`],['SBTi',b.sbti],
          ].map(([l,v],i)=>(
            <div key={i} style={{padding:8,background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.textMut}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,fontFamily:T.mono}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Profile */}
      <div style={{...S.card,background:T.surfaceH}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Carbon Profile</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            ['Scope 1',fmt(b.scope1,0)+' tCO₂e'],['Scope 2',fmt(b.scope2,0)+' tCO₂e'],
            ['Carbon Intensity',b.carbonIntensity.toFixed(0)+' tCO₂e/£M'],['EBITDA Impact @ £'+carbonPrice+'/t',(ebitdaImpact*100).toFixed(1)+'%'],
            ['Transition Sensitivity',(b.transSensitivity*100).toFixed(0)+'%'],['Physical Risk Score',b.physRiskScore+'/5'],
          ].map(([l,v],i)=>(
            <div key={i} style={{padding:8,background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.textMut}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,fontFamily:T.mono}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PD Uplift by Scenario */}
      <div style={{...S.card,background:T.surfaceH}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Climate PD Overlay by Scenario</div>
        <div style={{fontSize:10,color:T.textMut,marginBottom:12}}>Formula: Climate_PD = Base_PD × (1 + trans_sensitivity × carbon_price_shock) × phys_multiplier</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Scenario</th><th style={S.th}>Base PD</th><th style={S.th}>Climate PD</th><th style={S.th}>Uplift</th>
            </tr>
          </thead>
          <tbody>
            {climatePDs.map((r,i)=>(
              <tr key={i}>
                <td style={S.td}><span style={{color:r.color,fontWeight:600}}>{r.scenario}</span></td>
                <td style={{...S.td,fontFamily:T.mono}}>{fmtPct(r.basePD)}</td>
                <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:r.climatePD>0.05?T.red:T.navy}}>{fmtPct(r.climatePD)}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.red}}>+{(r.uplift*100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <span style={S.cite}>Ref: ECB Guide on C&E Risks § 4.3 — Credit risk assessment methodology</span>
      </div>

      {/* Physical Risk Heatmap */}
      <div style={{...S.card,background:T.surfaceH}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Physical Risk Heatmap</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
          {HAZARDS.map((h,i)=>(
            <div key={i} style={{...S.heatCell(b.physScores[i]),borderRadius:4}}>
              <div style={{fontSize:9}}>{h}</div>
              <div style={{fontSize:14,fontWeight:700}}>{b.physScores[i]}</div>
            </div>
          ))}
        </div>
        <span style={S.cite}>Ref: BoE CBES Methodology § 3.2 — Physical risk scoring</span>
      </div>

      {/* EPC (if Real Estate) */}
      {b.epc&&(
        <div style={{...S.card,background:T.surfaceH}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>EPC & MEES Assessment</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{padding:8,background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.textMut}}>EPC Rating</div>
              <div style={{fontSize:20,fontWeight:800,color:b.epc<='C'?T.green:b.epc<='E'?T.amber:T.red}}>{b.epc}</div>
            </div>
            <div style={{padding:8,background:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.textMut}}>LGD Haircut</div>
              <div style={{fontSize:16,fontWeight:700,fontFamily:T.mono}}>+{(EPC_LGD_HAIRCUT[b.epc]*100).toFixed(0)}%</div>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:11,color:T.textSec}}>{EPC_MEES_RISK[b.epc]}</div>
          <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Est. retrofit cost: £{(EPC_RETROFIT_COST[b.epc]/1000).toFixed(0)}k</div>
          <span style={S.cite}>Ref: UK MEES Regulations — Energy Efficiency (Private Rented Property) Order 2015</span>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 2: TRANSITION RISK OVERLAY
 * ═══════════════════════════════════════════════════════════════════════════════ */
const TransitionRiskTab=({borrowers,carbonPrice,setCarbonPrice})=>{
  const [selScenario,setSelScenario]=useState('net_zero_2050');
  const scenObj=NGFS_SCENARIOS.find(s=>s.id===selScenario)||NGFS_SCENARIOS[0];

  const transData=useMemo(()=>borrowers.map(b=>{
    const ebitdaImpact=(b.scope1*carbonPrice/1000)/b.ebitda;
    const climatePD=calcClimatePD(b.basePD,b.transSensitivity,carbonPrice,selScenario);
    const pdUplift=climatePD/b.basePD-1;
    const eclBase=calcECL(b.basePD,b.baseLGD,b.ead,b.stage,b.maturityYears);
    const eclClimate=calcECL(climatePD,b.baseLGD,b.ead,Math.min(3,b.stage+(pdUplift>0.5?1:0)),b.maturityYears);
    return{...b,ebitdaImpact,climatePD,pdUplift,eclBase,eclClimate,eclDelta:eclClimate-eclBase};
  }).sort((a,b)=>b.ebitdaImpact-a.ebitdaImpact),[borrowers,carbonPrice,selScenario]);

  const sectorHeatmap=useMemo(()=>{
    const map={};
    transData.forEach(b=>{
      if(!map[b.sector])map[b.sector]={sector:b.sector,avgImpact:0,avgPDUplift:0,totalExposure:0,count:0,totalEclDelta:0};
      map[b.sector].avgImpact+=b.ebitdaImpact;
      map[b.sector].avgPDUplift+=b.pdUplift;
      map[b.sector].totalExposure+=b.exposure;
      map[b.sector].totalEclDelta+=b.eclDelta;
      map[b.sector].count++;
    });
    return Object.values(map).map(s=>({...s,avgImpact:s.avgImpact/s.count,avgPDUplift:s.avgPDUplift/s.count})).sort((a,b)=>b.avgImpact-a.avgImpact);
  },[transData]);

  const totalEclDelta=transData.reduce((s,b)=>s+b.eclDelta,0);
  const avgPDUplift=transData.reduce((s,b)=>s+b.pdUplift,0)/transData.length;
  const highImpactCount=transData.filter(b=>b.ebitdaImpact>0.10).length;

  /* Carbon price sensitivity curve */
  const sensitivityCurve=useMemo(()=>{
    const prices=[0,50,100,150,200,300,400,500,750,1000];
    return prices.map(p=>{
      let totalEcl=0;
      borrowers.forEach(b=>{
        const cpd=calcClimatePD(b.basePD,b.transSensitivity,p,selScenario);
        totalEcl+=calcECL(cpd,b.baseLGD,b.ead,b.stage,b.maturityYears);
      });
      return{price:p,ecl:totalEcl};
    });
  },[borrowers,selScenario]);

  return(
    <div>
      {/* Controls */}
      <div style={{...S.card,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:4}}>Carbon Price (£/tCO₂e)</div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <input type="range" min={0} max={1000} step={5} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{...S.slider,width:240}}/>
            <span style={{fontFamily:T.mono,fontWeight:700,fontSize:16,color:T.navy,minWidth:60}}>£{carbonPrice}</span>
          </div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textSec,marginBottom:4}}>NGFS Scenario</div>
          <select style={S.select} value={selScenario} onChange={e=>setSelScenario(e.target.value)}>
            {NGFS_SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
          </select>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:10,color:T.textMut}}>Selected scenario peak warming</div>
          <div style={{fontSize:18,fontWeight:800,color:scenObj.color}}>{scenObj.peakWarming_c}°C</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>+{fmtGBP(totalEclDelta)}</div>
          <div style={S.kpiLabel}>ECL Climate Overlay</div>
          <div style={S.kpiSub}>Additional provision at £{carbonPrice}/t</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.amber}}>+{(avgPDUplift*100).toFixed(0)}%</div>
          <div style={S.kpiLabel}>Avg PD Uplift</div>
          <div style={S.kpiSub}>Across full portfolio</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{highImpactCount}</div>
          <div style={S.kpiLabel}>High Impact Borrowers</div>
          <div style={S.kpiSub}>&gt;10% EBITDA impact</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>£{carbonPrice}/t</div>
          <div style={S.kpiLabel}>Carbon Price Applied</div>
          <div style={S.kpiSub}>{scenObj.name}</div>
        </div>
      </div>

      <div style={S.grid2}>
        {/* Sector Heatmap */}
        <div style={S.card}>
          <div style={S.cardTitle}>Sector Transition Heatmap</div>
          <div style={S.cardSub}>Avg EBITDA impact by sector at £{carbonPrice}/tCO₂e</div>
          <div style={S.scrollTable}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Sector</th><th style={S.th}>Avg EBITDA Impact</th><th style={S.th}>Avg PD Uplift</th><th style={S.th}>Exposure</th><th style={S.th}>ECL Delta</th>
                </tr>
              </thead>
              <tbody>
                {sectorHeatmap.map((s,i)=>(
                  <tr key={i}>
                    <td style={S.td}>{s.sector}</td>
                    <td style={{...S.td,...S.heatCell(s.avgImpact*20,5)}}>{(s.avgImpact*100).toFixed(1)}%</td>
                    <td style={{...S.td,...S.heatCell(s.avgPDUplift*5,5)}}>{(s.avgPDUplift*100).toFixed(0)}%</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(s.totalExposure)}</td>
                    <td style={{...S.td,fontFamily:T.mono,color:T.red}}>+{fmtGBP(s.totalEclDelta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: ECB Guide on C&E Risks § 4.3 — Transition risk transmission channels</span>
        </div>

        {/* Carbon Price Sensitivity Curve */}
        <div style={S.card}>
          <div style={S.cardTitle}>Carbon Price Sensitivity Curve</div>
          <div style={S.cardSub}>Portfolio ECL at varying carbon prices</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sensitivityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="price" tick={{fontSize:10,fontFamily:T.mono}} label={{value:'£/tCO₂e',position:'bottom',fontSize:10}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>fmt(v)}/>
              <Tooltip formatter={v=>[fmtGBP(v),'Portfolio ECL']}/>
              <ReferenceLine x={carbonPrice} stroke={T.gold} strokeDasharray="5 5" label={{value:`£${carbonPrice}`,fontSize:10}}/>
              <Area type="monotone" dataKey="ecl" stroke={T.red} fill={T.red} fillOpacity={0.15}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 20 most impacted borrowers */}
      <div style={S.card}>
        <div style={S.cardTitle}>Top 20 Most Impacted Borrowers</div>
        <div style={S.cardSub}>Ranked by EBITDA impact at £{carbonPrice}/tCO₂e — {scenObj.name} scenario</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th><th style={S.th}>Borrower</th><th style={S.th}>Sector</th><th style={S.th}>Exposure</th>
                <th style={S.th}>EBITDA Impact</th><th style={S.th}>Base PD</th><th style={S.th}>Climate PD</th><th style={S.th}>PD Uplift</th>
                <th style={S.th}>ECL Base</th><th style={S.th}>ECL Climate</th><th style={S.th}>ECL Delta</th>
              </tr>
            </thead>
            <tbody>
              {transData.slice(0,20).map((b,i)=>(
                <tr key={b.id}>
                  <td style={{...S.td,fontFamily:T.mono}}>{i+1}</td>
                  <td style={{...S.td,fontWeight:600}}>{b.name}</td>
                  <td style={S.td}>{b.sector}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(b.exposure)}</td>
                  <td style={{...S.td,...S.heatCell(b.ebitdaImpact*10,5)}}>{(b.ebitdaImpact*100).toFixed(1)}%</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtPct(b.basePD)}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:b.climatePD>0.05?T.red:T.navy}}>{fmtPct(b.climatePD)}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:T.red}}>+{(b.pdUplift*100).toFixed(0)}%</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(b.eclBase)}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(b.eclClimate)}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:T.red,fontWeight:700}}>+{fmtGBP(b.eclDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span style={S.cite}>Formula: EBITDA_Impact = (Scope1_tCO2e × Carbon_Price) / EBITDA · Climate_PD = Base_PD × (1 + trans_sensitivity × carbon_price/100) × phys_multiplier</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 3: PHYSICAL RISK OVERLAY
 * ═══════════════════════════════════════════════════════════════════════════════ */
const PhysicalRiskTab=({borrowers})=>{
  const [hazardFilter,setHazardFilter]=useState('All');
  const [threshold,setThreshold]=useState(3);

  const physData=useMemo(()=>borrowers.map(b=>{
    const avgScore=b.physRiskScore;
    const maxHazard=Math.max(...b.physScores);
    const maxHazardName=HAZARDS[b.physScores.indexOf(maxHazard)];
    const lgdPhysHaircut=Math.max(0,(avgScore-2.5)*0.02);
    const collateralImpact=b.collateralValue*lgdPhysHaircut;
    return{...b,avgScore,maxHazard,maxHazardName,lgdPhysHaircut,collateralImpact};
  }).sort((a,b)=>b.avgScore-a.avgScore),[borrowers]);

  const filtered=useMemo(()=>{
    let d=physData;
    if(hazardFilter!=='All'){
      const idx=HAZARDS.indexOf(hazardFilter);
      d=d.filter(b=>b.physScores[idx]>=threshold);
    }else{
      d=d.filter(b=>b.avgScore>=threshold*0.6);
    }
    return d;
  },[physData,hazardFilter,threshold]);

  const hazardSummary=useMemo(()=>HAZARDS.map((h,i)=>{
    const exposed=borrowers.filter(b=>b.physScores[i]>=3);
    const totalExp=exposed.reduce((s,b)=>s+b.exposure,0);
    const avgScore=borrowers.reduce((s,b)=>s+b.physScores[i],0)/borrowers.length;
    return{hazard:h,count:exposed.length,totalExp,avgScore};
  }),[borrowers]);

  const countryRisk=useMemo(()=>{
    const map={};
    borrowers.forEach(b=>{
      if(!map[b.country])map[b.country]={country:b.country,avgPhys:0,count:0,exposure:0};
      map[b.country].avgPhys+=b.physRiskScore;
      map[b.country].exposure+=b.exposure;
      map[b.country].count++;
    });
    return Object.values(map).map(c=>({...c,avgPhys:c.avgPhys/c.count})).sort((a,b)=>b.avgPhys-a.avgPhys);
  },[borrowers]);

  return(
    <div>
      {/* Hazard Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:8,marginBottom:20}}>
        {hazardSummary.map((h,i)=>(
          <div key={i} style={{...S.kpi,cursor:'pointer',border:hazardFilter===h.hazard?`2px solid ${T.gold}`:`1px solid ${T.border}`}} onClick={()=>setHazardFilter(hazardFilter===h.hazard?'All':h.hazard)}>
            <div style={{fontSize:10,color:T.textMut,marginBottom:4}}>{h.hazard}</div>
            <div style={{fontSize:18,fontWeight:800,color:h.avgScore>3?T.red:h.avgScore>2?T.amber:T.green}}>{h.avgScore.toFixed(1)}</div>
            <div style={{fontSize:10,color:T.textSec}}>{h.count} exposed</div>
            <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{fmtGBP(h.totalExp)}</div>
          </div>
        ))}
      </div>

      <div style={{...S.filterBar}}>
        <label style={{fontSize:11,color:T.textSec}}>Risk threshold: </label>
        <input type="range" min={1} max={5} step={0.5} value={threshold} onChange={e=>setThreshold(+e.target.value)} style={{width:120,accentColor:T.gold}}/>
        <span style={{fontFamily:T.mono,fontSize:12}}>{threshold}/5</span>
        <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} borrowers shown</span>
      </div>

      <div style={S.grid2}>
        {/* Physical Risk Heatmap */}
        <div style={S.card}>
          <div style={S.cardTitle}>Physical Risk Heatmap — All Borrowers</div>
          <div style={S.cardSub}>Score 1 (low) to 5 (extreme) per hazard</div>
          <div style={{...S.scrollTable,maxHeight:400}}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Borrower</th>
                  {HAZARDS.map(h=><th key={h} style={{...S.th,textAlign:'center',fontSize:9}}>{h}</th>)}
                  <th style={S.th}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0,30).map(b=>(
                  <tr key={b.id}>
                    <td style={{...S.td,fontWeight:600,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis'}}>{b.name}</td>
                    {b.physScores.map((s,i)=><td key={i} style={S.heatCell(s)}>{s}</td>)}
                    <td style={{...S.td,fontFamily:T.mono,fontWeight:700,color:b.avgScore>3.5?T.red:T.navy}}>{b.avgScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span style={S.cite}>Ref: BoE CBES Methodology § 3.2 — 8-hazard physical risk scoring framework</span>
        </div>

        {/* Country risk summary */}
        <div style={S.card}>
          <div style={S.cardTitle}>Country Physical Risk Profile</div>
          <div style={S.cardSub}>Average physical risk by country of operations</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={countryRisk.slice(0,15)} layout="vertical" margin={{left:80}}>
              <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} domain={[0,5]}/>
              <YAxis dataKey="country" type="category" tick={{fontSize:10}} width={75}/>
              <Tooltip formatter={v=>[v.toFixed(2),'Avg Score']}/>
              <Bar dataKey="avgPhys" radius={[0,4,4,0]}>
                {countryRisk.slice(0,15).map((c,i)=><Cell key={i} fill={c.avgPhys>3.5?T.red:c.avgPhys>2.5?T.amber:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collateral Impact Table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Collateral & LGD Physical Risk Overlay</div>
        <div style={S.cardSub}>LGD haircut = max(0, (phys_score - 2.5) × 2pp) · Collateral impact on secured exposures</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Borrower</th><th style={S.th}>Sector</th><th style={S.th}>Country</th>
                <th style={S.th}>Phys Score</th><th style={S.th}>Max Hazard</th><th style={S.th}>Base LGD</th>
                <th style={S.th}>LGD Haircut</th><th style={S.th}>Adj LGD</th><th style={S.th}>Collateral Value</th>
                <th style={S.th}>Collateral Impact</th><th style={S.th}>EPC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,25).map(b=>(
                <tr key={b.id}>
                  <td style={{...S.td,fontWeight:600}}>{b.name}</td>
                  <td style={S.td}>{b.sector}</td>
                  <td style={S.td}>{b.country}</td>
                  <td style={S.heatCell(b.avgScore)}>{b.avgScore.toFixed(1)}</td>
                  <td style={S.td}>{b.maxHazardName} ({b.maxHazard})</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtPct(b.baseLGD)}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:T.red}}>+{(b.lgdPhysHaircut*100).toFixed(1)}%</td>
                  <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{fmtPct(b.baseLGD+b.lgdPhysHaircut)}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(b.collateralValue)}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:T.red}}>{b.collateralImpact>0?'-'+fmtGBP(b.collateralImpact):'—'}</td>
                  <td style={S.td}>{b.epc?<span style={S.tag(b.epc<='C'?T.green:T.red)}>{b.epc}</span>:'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span style={S.cite}>Ref: BoE CBES § 3.2 — Physical risk impact on collateral values and LGD</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 4: IFRS 9 ECL ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════ */
const IFRS9ECLTab=({borrowers,carbonPrice})=>{
  const [scenarioWeights,setScenarioWeights]=useState(SCENARIO_WEIGHTS);
  const [showFormulas,setShowFormulas]=useState(false);

  const scenarios=['net_zero_2050','below_2c','delayed_transition','current_policies'];
  const scenarioNames={net_zero_2050:'Net Zero 2050',below_2c:'Below 2°C',delayed_transition:'Delayed Transition',current_policies:'Current Policies'};

  const eclData=useMemo(()=>{
    const results=borrowers.map(b=>{
      const baseECL=calcECL(b.basePD,b.baseLGD,b.ead,b.stage,b.maturityYears);
      const scenarioECLs={};
      let weightedECL=0;

      scenarios.forEach(scen=>{
        const climatePD=calcClimatePD(b.basePD,b.transSensitivity,carbonPrice,scen);
        const climateLGD=calcClimateLGD(b.baseLGD,b.epc,b.physRiskScore,scen);
        const sicrTriggered=climatePD/b.basePD>1.5||b.physRiskScore>3.5;
        const climateStage=sicrTriggered?Math.min(3,b.stage+1):b.stage;
        const scenECL=calcECL(climatePD,climateLGD,b.ead,climateStage,b.maturityYears);
        scenarioECLs[scen]={climatePD,climateLGD,climateStage,ecl:scenECL,sicrTriggered};
        weightedECL+=scenECL*scenarioWeights[scen];
      });

      const overlay=weightedECL-baseECL;
      return{...b,baseECL,scenarioECLs,weightedECL,overlay,overlayPct:overlay/baseECL};
    });
    return results.sort((a,b)=>b.overlay-a.overlay);
  },[borrowers,carbonPrice,scenarioWeights]);

  const totals=useMemo(()=>{
    const t={baseECL:0,weightedECL:0,overlay:0};
    const stageTotals={1:{base:0,climate:0,count:0},2:{base:0,climate:0,count:0},3:{base:0,climate:0,count:0}};
    const sicrCount={net_zero_2050:0,below_2c:0,delayed_transition:0,current_policies:0};
    eclData.forEach(b=>{
      t.baseECL+=b.baseECL;t.weightedECL+=b.weightedECL;t.overlay+=b.overlay;
      stageTotals[b.stage].base+=b.baseECL;stageTotals[b.stage].count++;
      scenarios.forEach(s=>{
        stageTotals[b.scenarioECLs[s].climateStage].climate+=b.scenarioECLs[s].ecl*scenarioWeights[s];
        if(b.scenarioECLs[s].sicrTriggered)sicrCount[s]++;
      });
    });
    return{...t,stageTotals,sicrCount};
  },[eclData,scenarioWeights]);

  const stageTransition=useMemo(()=>{
    const matrix=[[0,0,0],[0,0,0],[0,0,0]];
    eclData.forEach(b=>{
      const worstStage=Math.max(...scenarios.map(s=>b.scenarioECLs[s].climateStage));
      matrix[b.stage-1][worstStage-1]++;
    });
    return matrix;
  },[eclData]);

  return(
    <div>
      {/* ECL KPIs */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{fmtGBP(totals.baseECL)}</div>
          <div style={S.kpiLabel}>Base ECL (Pre-Climate)</div>
          <div style={S.kpiSub}>IFRS 9 § 5.5.1</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{fmtGBP(totals.weightedECL)}</div>
          <div style={S.kpiLabel}>Probability-Weighted ECL</div>
          <div style={S.kpiSub}>4-scenario weighted</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>+{fmtGBP(totals.overlay)}</div>
          <div style={S.kpiLabel}>Climate ECL Overlay</div>
          <div style={S.kpiSub}>Additional provision</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.amber}}>{(totals.overlay/(totals.baseECL||1)*100).toFixed(1)}%</div>
          <div style={S.kpiLabel}>Overlay as % of Base</div>
          <div style={S.kpiSub}>P&L impact</div>
        </div>
      </div>

      {/* Scenario Weights */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={S.cardTitle}>Scenario Probability Weights</div>
            <div style={S.cardSub}>Adjust weights for probability-weighted ECL calculation (must sum to 100%)</div>
          </div>
          <button style={{...S.btn,...S.btnOutline}} onClick={()=>setShowFormulas(!showFormulas)}>
            {showFormulas?'Hide':'Show'} Formulas
          </button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {scenarios.map(s=>{
            const scen=NGFS_SCENARIOS.find(n=>n.id===s);
            return(
              <div key={s} style={{padding:12,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:11,fontWeight:700,color:scen?.color}}>{scenarioNames[s]}</div>
                <div style={{fontSize:10,color:T.textMut}}>{scen?.category}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                  <input type="range" min={0} max={100} step={5} value={scenarioWeights[s]*100}
                    onChange={e=>{const v=+e.target.value/100;setScenarioWeights(p=>({...p,[s]:v}));}}
                    style={{width:'100%',accentColor:scen?.color||T.gold}}/>
                  <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,minWidth:40}}>{(scenarioWeights[s]*100).toFixed(0)}%</span>
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:4}}>SICR triggers: {totals.sicrCount[s]}</div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:8,fontSize:11,color:scenarioWeights.net_zero_2050+scenarioWeights.below_2c+scenarioWeights.delayed_transition+scenarioWeights.current_policies!==1?T.red:T.green}}>
          Total weight: {((scenarioWeights.net_zero_2050+scenarioWeights.below_2c+scenarioWeights.delayed_transition+scenarioWeights.current_policies)*100).toFixed(0)}%
          {Math.abs(scenarioWeights.net_zero_2050+scenarioWeights.below_2c+scenarioWeights.delayed_transition+scenarioWeights.current_policies-1)>0.01?' ⚠️ Must sum to 100%':''}
        </div>
      </div>

      {/* Formulas Panel */}
      {showFormulas&&(
        <div style={{...S.card,background:'#1b3a5c08',fontFamily:T.mono,fontSize:11,lineHeight:1.8}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8,fontFamily:T.font}}>IFRS 9 ECL Calculation Methodology</div>
          <div><strong>Stage 1 (12-month ECL):</strong> ECL = PD_12m × LGD × EAD × DF</div>
          <div><strong>Stage 2 (Lifetime ECL):</strong> ECL = Σ(t=1→T) [PD_t × Survival(t-1) × LGD × EAD × DF(t)]</div>
          <div><strong>Stage 3 (Credit-impaired):</strong> Same as Stage 2 with PD=1 for current period</div>
          <div style={{marginTop:8}}><strong>Climate PD Overlay:</strong> Climate_PD = Base_PD × (1 + transition_sensitivity × carbon_price/100) × (1 + (warming - 1.5) × 0.05)</div>
          <div><strong>Climate LGD Overlay:</strong> Climate_LGD = Base_LGD + EPC_haircut + phys_haircut + warming_haircut</div>
          <div><strong>SICR Trigger:</strong> Climate_PD/Base_PD &gt; 1.5 OR phys_risk_score &gt; 3.5 → stage migration</div>
          <div><strong>Probability-Weighted ECL:</strong> PW_ECL = Σ(s=1→4) [w_s × ECL_s]</div>
          <div><strong>Climate Overlay:</strong> Overlay = PW_ECL_climate - ECL_base</div>
          <span style={{...S.cite,fontFamily:T.mono}}>Ref: IFRS 9 § 5.5.1-5.5.20 — Expected credit loss measurement</span>
        </div>
      )}

      {/* Stage Transition Matrix */}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>IFRS 9 Stage Migration Matrix</div>
          <div style={S.cardSub}>From (base) → To (worst-case climate scenario)</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>From \ To</th>
                <th style={{...S.th,textAlign:'center'}}>Stage 1</th>
                <th style={{...S.th,textAlign:'center'}}>Stage 2</th>
                <th style={{...S.th,textAlign:'center'}}>Stage 3</th>
              </tr>
            </thead>
            <tbody>
              {[0,1,2].map(r=>(
                <tr key={r}>
                  <td style={{...S.td,fontWeight:700}}>Stage {r+1}</td>
                  {[0,1,2].map(c=>(
                    <td key={c} style={{...S.td,textAlign:'center',fontFamily:T.mono,fontWeight:r===c?700:400,background:r!==c&&stageTransition[r][c]>0?'#dc262618':'transparent',color:r!==c&&stageTransition[r][c]>0?T.red:T.text}}>
                      {stageTransition[r][c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <span style={S.cite}>Ref: IFRS 9 § 5.5.3-5.5.9 — Significant increase in credit risk (SICR)</span>
        </div>

        {/* ECL by Stage */}
        <div style={S.card}>
          <div style={S.cardTitle}>ECL by IFRS 9 Stage</div>
          <div style={S.cardSub}>Base vs climate overlay by stage classification</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              {stage:'Stage 1',base:totals.stageTotals[1].base,climate:totals.stageTotals[1].climate},
              {stage:'Stage 2',base:totals.stageTotals[2].base,climate:totals.stageTotals[2].climate},
              {stage:'Stage 3',base:totals.stageTotals[3].base,climate:totals.stageTotals[3].climate},
            ]}>
              <XAxis dataKey="stage" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>fmt(v)}/>
              <Tooltip formatter={v=>[fmtGBP(v)]}/>
              <Legend/>
              <Bar dataKey="base" name="Base ECL" fill={T.navyL} radius={[4,4,0,0]}/>
              <Bar dataKey="climate" name="Climate ECL" fill={T.red} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed ECL table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Detailed ECL by Borrower × Scenario</div>
        <div style={S.cardSub}>Probability-weighted expected credit losses with climate overlay</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Borrower</th><th style={S.th}>Stage</th><th style={S.th}>Base ECL</th>
                {scenarios.map(s=><th key={s} style={S.th}>{scenarioNames[s]}</th>)}
                <th style={S.th}>PW ECL</th><th style={S.th}>Overlay</th><th style={S.th}>Overlay %</th>
              </tr>
            </thead>
            <tbody>
              {eclData.slice(0,30).map(b=>(
                <tr key={b.id}>
                  <td style={{...S.td,fontWeight:600,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis'}}>{b.name}</td>
                  <td style={S.td}><span style={S.tag(b.stage===1?T.green:b.stage===2?T.amber:T.red)}>S{b.stage}</span></td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(b.baseECL)}</td>
                  {scenarios.map(s=>(
                    <td key={s} style={{...S.td,fontFamily:T.mono,color:b.scenarioECLs[s].sicrTriggered?T.red:T.text}}>
                      {fmtGBP(b.scenarioECLs[s].ecl)}
                      {b.scenarioECLs[s].sicrTriggered?<span style={{fontSize:8,color:T.red}}> SICR</span>:''}
                    </td>
                  ))}
                  <td style={{...S.td,fontFamily:T.mono,fontWeight:700}}>{fmtGBP(b.weightedECL)}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:T.red,fontWeight:700}}>+{fmtGBP(b.overlay)}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:b.overlayPct>0.5?T.red:T.amber}}>+{(b.overlayPct*100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 5: SCENARIO ANALYSIS
 * ═══════════════════════════════════════════════════════════════════════════════ */
const ScenarioAnalysisTab=({borrowers,carbonPrice})=>{
  const [showWhatIf,setShowWhatIf]=useState(false);
  const [removedIds,setRemovedIds]=useState(new Set());

  const activeBorrowers=useMemo(()=>borrowers.filter(b=>!removedIds.has(b.id)),[borrowers,removedIds]);

  const scenarioResults=useMemo(()=>NGFS_SCENARIOS.slice(0,4).map(scen=>{
    let totalBaseECL=0,totalClimateECL=0,totalExposure=0;
    const sectorImpact={};
    const borrowerImpacts=[];

    activeBorrowers.forEach(b=>{
      const baseECL=calcECL(b.basePD,b.baseLGD,b.ead,b.stage,b.maturityYears);
      const climatePD=calcClimatePD(b.basePD,b.transSensitivity,scen.carbonPrice2030_usd,scen.id);
      const climateLGD=calcClimateLGD(b.baseLGD,b.epc,b.physRiskScore,scen.id);
      const climateStage=climatePD/b.basePD>1.5?Math.min(3,b.stage+1):b.stage;
      const climateECL=calcECL(climatePD,climateLGD,b.ead,climateStage,b.maturityYears);
      totalBaseECL+=baseECL;totalClimateECL+=climateECL;totalExposure+=b.exposure;

      if(!sectorImpact[b.sector])sectorImpact[b.sector]={base:0,climate:0,exposure:0};
      sectorImpact[b.sector].base+=baseECL;
      sectorImpact[b.sector].climate+=climateECL;
      sectorImpact[b.sector].exposure+=b.exposure;

      borrowerImpacts.push({...b,baseECL,climateECL,delta:climateECL-baseECL,climatePD,climateStage});
    });

    const cet1Impact=totalExposure?(totalClimateECL-totalBaseECL)/totalExposure*100*-1:0;
    return{
      ...scen,totalBaseECL,totalClimateECL,overlay:totalClimateECL-totalBaseECL,
      overlayPct:totalBaseECL?(totalClimateECL-totalBaseECL)/totalBaseECL*100:0,
      cet1Impact,sectorImpact:Object.entries(sectorImpact).map(([s,v])=>({sector:s,...v,delta:v.climate-v.base})).sort((a,b)=>b.delta-a.delta),
      topBorrowers:borrowerImpacts.sort((a,b)=>b.delta-a.delta).slice(0,10),
    };
  }),[activeBorrowers]);

  const worstBorrowers=useMemo(()=>{
    const delayedScen=scenarioResults.find(s=>s.id==='delayed_transition')||scenarioResults[0];
    return delayedScen.topBorrowers;
  },[scenarioResults]);

  return(
    <div>
      {/* Scenario Comparison Table */}
      <div style={S.card}>
        <div style={S.cardTitle}>NGFS Scenario Comparison — Portfolio Impact</div>
        <div style={S.cardSub}>4-scenario stress test results across {activeBorrowers.length} active borrowers</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginTop:16}}>
          {scenarioResults.map((s,i)=>(
            <div key={i} style={{padding:16,borderRadius:8,border:`2px solid ${s.color}20`,background:`${s.color}08`}}>
              <div style={{fontSize:13,fontWeight:700,color:s.color}}>{s.name}</div>
              <div style={{fontSize:10,color:T.textMut,marginBottom:12}}>{s.category} · Peak {s.peakWarming_c}°C</div>
              <div style={{display:'grid',gap:8}}>
                <div><span style={{fontSize:10,color:T.textSec}}>Base ECL</span><div style={{fontFamily:T.mono,fontWeight:700}}>{fmtGBP(s.totalBaseECL)}</div></div>
                <div><span style={{fontSize:10,color:T.textSec}}>Climate ECL</span><div style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>{fmtGBP(s.totalClimateECL)}</div></div>
                <div><span style={{fontSize:10,color:T.textSec}}>Climate Overlay</span><div style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>+{fmtGBP(s.overlay)} (+{s.overlayPct.toFixed(0)}%)</div></div>
                <div><span style={{fontSize:10,color:T.textSec}}>CET1 Impact</span><div style={{fontFamily:T.mono,fontWeight:800,color:s.cet1Impact<-1.5?T.red:T.amber}}>{s.cet1Impact.toFixed(2)}pp</div></div>
                <div><span style={{fontSize:10,color:T.textSec}}>Carbon Price 2030</span><div style={{fontFamily:T.mono}}>${s.carbonPrice2030_usd}/t</div></div>
              </div>
            </div>
          ))}
        </div>
        <span style={S.cite}>Ref: NGFS Phase IV Scenarios — Portfolio-level stress test application</span>
      </div>

      <div style={S.grid2}>
        {/* Sector Concentration Risk */}
        <div style={S.card}>
          <div style={S.cardTitle}>Sector Concentration Risk — Delayed Transition</div>
          <div style={S.cardSub}>ECL delta by sector under worst-case scenario</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={(scenarioResults.find(s=>s.id==='delayed_transition')||scenarioResults[0]).sectorImpact.slice(0,12)} layout="vertical" margin={{left:100}}>
              <XAxis type="number" tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>fmt(v)}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:10}} width={95}/>
              <Tooltip formatter={v=>[fmtGBP(v)]}/>
              <Bar dataKey="delta" name="ECL Delta" radius={[0,4,4,0]}>
                {(scenarioResults.find(s=>s.id==='delayed_transition')||scenarioResults[0]).sectorImpact.slice(0,12).map((e,i)=><Cell key={i} fill={i<3?T.red:i<6?T.amber:T.sage}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CET1 Impact Chart */}
        <div style={S.card}>
          <div style={S.cardTitle}>CET1 Ratio Impact by Scenario</div>
          <div style={S.cardSub}>Basis points impact on Common Equity Tier 1</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scenarioResults.map(s=>({name:s.name,cet1:s.cet1Impact,color:s.color}))}>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10,fontFamily:T.mono}} domain={['auto','auto']}/>
              <Tooltip formatter={v=>[v.toFixed(2)+'pp','CET1 Impact']}/>
              <ReferenceLine y={-2} stroke={T.red} strokeDasharray="5 5" label={{value:'Board limit: -2pp',fontSize:9,fill:T.red}}/>
              <Bar dataKey="cet1" radius={[4,4,0,0]}>
                {scenarioResults.map((s,i)=><Cell key={i} fill={s.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What-If Analysis */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={S.cardTitle}>What-If Analysis — Remove High-Risk Borrowers</div>
            <div style={S.cardSub}>Toggle borrowers to see portfolio improvement</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...S.btn,...(showWhatIf?S.btnPrimary:S.btnOutline)}} onClick={()=>setShowWhatIf(!showWhatIf)}>
              {showWhatIf?'Hide':'Show'} What-If
            </button>
            {removedIds.size>0&&<button style={{...S.btn,...S.btnOutline}} onClick={()=>setRemovedIds(new Set())}>Reset</button>}
          </div>
        </div>
        {showWhatIf&&(
          <>
            <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>
              {removedIds.size} borrowers removed · Portfolio improvement shown in scenario cards above
            </div>
            <div style={S.scrollTable}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Remove</th><th style={S.th}>Borrower</th><th style={S.th}>Sector</th>
                    <th style={S.th}>Exposure</th><th style={S.th}>ECL Delta (Delayed)</th><th style={S.th}>Climate PD</th>
                  </tr>
                </thead>
                <tbody>
                  {worstBorrowers.map(b=>(
                    <tr key={b.id} style={{background:removedIds.has(b.id)?'#dc262612':'transparent'}}>
                      <td style={S.td}>
                        <input type="checkbox" checked={removedIds.has(b.id)} onChange={()=>{
                          const next=new Set(removedIds);
                          next.has(b.id)?next.delete(b.id):next.add(b.id);
                          setRemovedIds(next);
                        }}/>
                      </td>
                      <td style={{...S.td,fontWeight:600}}>{b.name}</td>
                      <td style={S.td}>{b.sector}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(b.exposure)}</td>
                      <td style={{...S.td,fontFamily:T.mono,color:T.red}}>+{fmtGBP(b.delta)}</td>
                      <td style={{...S.td,fontFamily:T.mono}}>{fmtPct(b.climatePD)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 6: EPC & REAL ESTATE
 * ═══════════════════════════════════════════════════════════════════════════════ */
const EPCRealEstateTab=({properties})=>{
  const [meesYear,setMeesYear]=useState('2025');

  const epcDistribution=useMemo(()=>{
    const map={};
    EPC_BANDS.forEach(b=>{map[b]=properties.filter(p=>p.epc===b);});
    return EPC_BANDS.map(b=>({band:b,count:map[b].length,value:map[b].reduce((s,p)=>s+p.value,0),avgLTV:map[b].length?map[b].reduce((s,p)=>s+p.ltv,0)/map[b].length:0}));
  },[properties]);

  const meesThresholds={2025:'E',2027:'D',2030:'C'};
  const meesThreshold=meesThresholds[meesYear]||'E';
  const nonCompliant=properties.filter(p=>p.epc>meesThreshold);
  const strandedValue=nonCompliant.reduce((s,p)=>s+p.value,0);
  const totalRetrofitCost=nonCompliant.reduce((s,p)=>s+p.retrofitCost,0);

  const strandedTimeline=useMemo(()=>[
    {year:'2025',threshold:'E',nonCompliant:properties.filter(p=>p.epc>'E').length,value:properties.filter(p=>p.epc>'E').reduce((s,p)=>s+p.value,0)},
    {year:'2027',threshold:'D',nonCompliant:properties.filter(p=>p.epc>'D').length,value:properties.filter(p=>p.epc>'D').reduce((s,p)=>s+p.value,0)},
    {year:'2030',threshold:'C',nonCompliant:properties.filter(p=>p.epc>'C').length,value:properties.filter(p=>p.epc>'C').reduce((s,p)=>s+p.value,0)},
    {year:'2035',threshold:'B',nonCompliant:properties.filter(p=>p.epc>'B').length,value:properties.filter(p=>p.epc>'B').reduce((s,p)=>s+p.value,0)},
  ],[properties]);

  const crremAnalysis=useMemo(()=>properties.map(p=>({
    ...p,crremGap:p.crremActual-p.crremTarget,strandedByTarget:p.crremActual>p.crremTarget,
    retrofitROI:p.retrofitCost>0?(p.energyCost*0.3*10)/p.retrofitCost:0,
  })),[properties]);

  return(
    <div>
      {/* EPC Distribution KPIs */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{properties.length}</div>
          <div style={S.kpiLabel}>CRE Properties</div>
          <div style={S.kpiSub}>Total book</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiValue}>{fmtGBP(properties.reduce((s,p)=>s+p.value,0))}</div>
          <div style={S.kpiLabel}>Total Portfolio Value</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{nonCompliant.length}</div>
          <div style={S.kpiLabel}>MEES Non-Compliant ({meesYear})</div>
          <div style={S.kpiSub}>Below EPC {meesThreshold}</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{fmtGBP(strandedValue)}</div>
          <div style={S.kpiLabel}>Stranded Asset Value</div>
          <div style={S.kpiSub}>At risk of write-down</div>
        </div>
      </div>

      {/* MEES year selector */}
      <div style={{...S.filterBar}}>
        <span style={{fontSize:11,fontWeight:600}}>MEES Threshold Year:</span>
        {['2025','2027','2030'].map(y=>(
          <button key={y} style={meesYear===y?S.pillActive:S.pill} onClick={()=>setMeesYear(y)}>
            {y} (EPC {meesThresholds[y]})
          </button>
        ))}
      </div>

      <div style={S.grid2}>
        {/* EPC Distribution */}
        <div style={S.card}>
          <div style={S.cardTitle}>EPC Rating Distribution</div>
          <div style={S.cardSub}>Property count and value by EPC band</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={epcDistribution}>
              <XAxis dataKey="band" tick={{fontSize:12,fontWeight:700}}/>
              <YAxis yAxisId="count" tick={{fontSize:10}}/>
              <YAxis yAxisId="value" orientation="right" tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>fmt(v)}/>
              <Tooltip/>
              <Legend/>
              <Bar yAxisId="count" dataKey="count" name="Properties" radius={[4,4,0,0]}>
                {epcDistribution.map((e,i)=><Cell key={i} fill={e.band<='C'?T.green:e.band<='E'?T.amber:T.red}/>)}
              </Bar>
              <Bar yAxisId="value" dataKey="value" name="Value (£)" radius={[4,4,0,0]} fill={T.navyL} fillOpacity={0.4}/>
            </BarChart>
          </ResponsiveContainer>
          <span style={S.cite}>Ref: UK MEES Regulations — Minimum energy efficiency standards for commercial property</span>
        </div>

        {/* Stranded Asset Timeline */}
        <div style={S.card}>
          <div style={S.cardTitle}>Stranded Asset Timeline</div>
          <div style={S.cardSub}>Properties becoming non-compliant as MEES thresholds tighten</div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={strandedTimeline}>
              <XAxis dataKey="year" tick={{fontSize:11}}/>
              <YAxis yAxisId="count" tick={{fontSize:10}}/>
              <YAxis yAxisId="value" orientation="right" tick={{fontSize:10,fontFamily:T.mono}} tickFormatter={v=>fmt(v)}/>
              <Tooltip/>
              <Legend/>
              <Bar yAxisId="count" dataKey="nonCompliant" name="Non-Compliant Count" fill={T.red} radius={[4,4,0,0]}/>
              <Line yAxisId="value" type="monotone" dataKey="value" name="At-Risk Value (£)" stroke={T.amber} strokeWidth={2} dot={{fill:T.amber}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retrofit Cost-Benefit */}
      <div style={S.card}>
        <div style={S.cardTitle}>Retrofit Cost-Benefit Analysis</div>
        <div style={S.cardSub}>Est. retrofit cost vs energy savings (10yr NPV) · Total retrofit cost: {fmtGBP(totalRetrofitCost)}</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Property</th><th style={S.th}>Type</th><th style={S.th}>Location</th><th style={S.th}>EPC</th>
                <th style={S.th}>Value</th><th style={S.th}>LTV</th><th style={S.th}>LGD Haircut</th>
                <th style={S.th}>Retrofit Cost</th><th style={S.th}>Annual Energy</th><th style={S.th}>ROI (10yr)</th>
                <th style={S.th}>CRREM Gap</th><th style={S.th}>Flood Zone</th><th style={S.th}>MEES Status</th>
              </tr>
            </thead>
            <tbody>
              {crremAnalysis.sort((a,b)=>(b.epc||'').localeCompare(a.epc||'')).map(p=>(
                <tr key={p.id}>
                  <td style={{...S.td,fontWeight:600}}>{p.name}</td>
                  <td style={S.td}>{p.type}</td>
                  <td style={S.td}>{p.location}</td>
                  <td style={S.td}><span style={S.tag(p.epc<='C'?T.green:p.epc<='E'?T.amber:T.red)}>{p.epc}</span></td>
                  <td style={{...S.td,fontFamily:T.mono}}>{fmtGBP(p.value)}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{(p.ltv*100).toFixed(0)}%</td>
                  <td style={{...S.td,fontFamily:T.mono,color:p.lgdHaircut>0?T.red:T.green}}>+{(p.lgdHaircut*100).toFixed(0)}%</td>
                  <td style={{...S.td,fontFamily:T.mono}}>{p.retrofitCost>0?'£'+(p.retrofitCost/1000).toFixed(0)+'k':'—'}</td>
                  <td style={{...S.td,fontFamily:T.mono}}>£{(p.energyCost/1000).toFixed(0)}k/yr</td>
                  <td style={{...S.td,fontFamily:T.mono,color:p.retrofitROI>1?T.green:T.red}}>{p.retrofitROI>0?p.retrofitROI.toFixed(1)+'x':'—'}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:p.strandedByTarget?T.red:T.green}}>{p.crremGap>0?'+'+p.crremGap.toFixed(0):p.crremGap.toFixed(0)} kgCO₂/m²</td>
                  <td style={S.td}>{p.floodZone}</td>
                  <td style={S.td}><span style={S.tag(p.epc<=meesThreshold?T.green:T.red)}>{p.epc<=meesThreshold?'Compliant':'Non-Compliant'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span style={S.cite}>Ref: CRREM — Carbon Risk Real Estate Monitor v2.0 · UK MEES thresholds: 2025 (E), 2027 (D), 2030 (C)</span>
      </div>

      {/* LGD Haircut Schedule */}
      <div style={S.card}>
        <div style={S.cardTitle}>EPC → LGD Haircut Schedule</div>
        <div style={S.cardSub}>Additional LGD applied to CRE exposures by EPC band</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
          {EPC_BANDS.map(b=>(
            <div key={b} style={{padding:16,textAlign:'center',borderRadius:8,background:b<='B'?'#16a34a12':b<='D'?'#d9770612':'#dc262612',border:`1px solid ${b<='B'?T.green:b<='D'?T.amber:T.red}40`}}>
              <div style={{fontSize:24,fontWeight:800,color:b<='B'?T.green:b<='D'?T.amber:T.red}}>{b}</div>
              <div style={{fontSize:14,fontFamily:T.mono,fontWeight:700,marginTop:4}}>+{(EPC_LGD_HAIRCUT[b]*100).toFixed(0)}%</div>
              <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Retrofit: £{(EPC_RETROFIT_COST[b]/1000).toFixed(0)}k</div>
              <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{EPC_MEES_RISK[b].split('—')[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * TAB 7: REGULATORY & EXPORT
 * ═══════════════════════════════════════════════════════════════════════════════ */
const RegulatoryExportTab=({borrowers,properties,carbonPrice})=>{
  const [exportFormat,setExportFormat]=useState('csv');
  const [viewMode,setViewMode]=useState('checklist');

  const complianceScore=useMemo(()=>{
    const total=REGULATORY_ITEMS.reduce((s,r)=>s+r.compliance,0);
    return(total/REGULATORY_ITEMS.length).toFixed(1);
  },[]);

  const byStatus=useMemo(()=>{
    const map={Completed:0,'Implemented':0,'In Progress':0,'Operational':0,'Planning':0};
    REGULATORY_ITEMS.forEach(r=>{map[r.status]=(map[r.status]||0)+1;});
    return Object.entries(map).filter(([,v])=>v>0).map(([status,count])=>({status,count}));
  },[]);

  const byRegulator=useMemo(()=>{
    const map={};
    REGULATORY_ITEMS.forEach(r=>{
      if(!map[r.regulator])map[r.regulator]={regulator:r.regulator,items:0,avgCompliance:0};
      map[r.regulator].items++;
      map[r.regulator].avgCompliance+=r.compliance;
    });
    return Object.values(map).map(r=>({...r,avgCompliance:r.avgCompliance/r.items}));
  },[]);

  return(
    <div>
      {/* Compliance Summary */}
      <div style={S.grid4}>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:parseFloat(complianceScore)>70?T.green:T.amber}}>{complianceScore}%</div>
          <div style={S.kpiLabel}>Overall Compliance</div>
          <div style={S.kpiSub}>Across {REGULATORY_ITEMS.length} requirements</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.green}}>{REGULATORY_ITEMS.filter(r=>r.compliance>=80).length}</div>
          <div style={S.kpiLabel}>Substantially Compliant</div>
          <div style={S.kpiSub}>≥ 80% completion</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.amber}}>{REGULATORY_ITEMS.filter(r=>r.compliance>=50&&r.compliance<80).length}</div>
          <div style={S.kpiLabel}>In Progress</div>
          <div style={S.kpiSub}>50-80% completion</div>
        </div>
        <div style={S.kpi}>
          <div style={{...S.kpiValue,color:T.red}}>{REGULATORY_ITEMS.filter(r=>r.compliance<50).length}</div>
          <div style={S.kpiLabel}>Gaps Identified</div>
          <div style={S.kpiSub}>&lt; 50% completion</div>
        </div>
      </div>

      {/* View toggles */}
      <div style={{...S.filterBar}}>
        {['checklist','timeline','regulator'].map(v=>(
          <button key={v} style={viewMode===v?S.pillActive:S.pill} onClick={()=>setViewMode(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
        ))}
      </div>

      {/* Compliance Checklist */}
      <div style={S.card}>
        <div style={S.cardTitle}>Regulatory Compliance Checklist</div>
        <div style={S.cardSub}>ECB SSM expectations · BoE SS3/19 · EBA GL ESG · BCBS Principles</div>
        <div style={S.scrollTable}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Regulator</th><th style={S.th}>Reference</th><th style={S.th}>Section</th>
                <th style={S.th}>Requirement</th><th style={S.th}>Deadline</th><th style={S.th}>Status</th>
                <th style={{...S.th,width:80}}>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {REGULATORY_ITEMS.map(r=>(
                <tr key={r.id}>
                  <td style={S.td}><span style={S.tag(r.regulator==='ECB'?T.navyL:r.regulator==='BoE'?T.sage:r.regulator==='EBA'?T.gold:T.textSec)}>{r.regulator}</span></td>
                  <td style={{...S.td,fontWeight:600,fontSize:11}}>{r.ref}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{r.section}</td>
                  <td style={{...S.td,maxWidth:300}}>{r.requirement}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{r.deadline}</td>
                  <td style={S.td}>
                    <span style={S.tag(r.status==='Completed'||r.status==='Implemented'||r.status==='Operational'?T.green:r.status==='In Progress'?T.amber:T.red)}>
                      {r.status}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,height:6,borderRadius:3,background:T.surfaceH,overflow:'hidden'}}>
                        <div style={{width:`${r.compliance}%`,height:'100%',borderRadius:3,background:r.compliance>=80?T.green:r.compliance>=50?T.amber:T.red}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:10,minWidth:30}}>{r.compliance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ECB SSM Expectations Detail */}
      <div style={S.card}>
        <div style={S.cardTitle}>ECB SSM Supervisory Expectations — Climate Risk in Credit</div>
        <div style={S.cardSub}>13 expectations mapped to credit risk management framework</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[
            {exp:'Exp 1: Business environment',desc:'Monitor climate-related developments in business environment',status:'Met'},
            {exp:'Exp 2: Business strategy',desc:'Climate risk integrated into business strategy and risk appetite',status:'Met'},
            {exp:'Exp 3: Board oversight',desc:'Board has adequate oversight of climate-related risks',status:'Met'},
            {exp:'Exp 4: Risk appetite',desc:'Explicit climate risk limits in risk appetite framework',status:'Partial'},
            {exp:'Exp 5: Organisation',desc:'Clear responsibilities for climate risk management',status:'Met'},
            {exp:'Exp 6: Risk reporting',desc:'Internal reporting includes climate risk metrics',status:'Met'},
            {exp:'Exp 7: Credit risk',desc:'Climate factors in credit risk assessment & monitoring',status:'Met'},
            {exp:'Exp 8: Market risk',desc:'Climate in market risk assessment',status:'Partial'},
            {exp:'Exp 9: Liquidity risk',desc:'Climate impact on liquidity buffers assessed',status:'Partial'},
            {exp:'Exp 10: Operational risk',desc:'Climate events in operational risk framework',status:'Met'},
            {exp:'Exp 11: Stress testing',desc:'Climate scenarios in stress testing programme',status:'Met'},
            {exp:'Exp 12: ICAAP/ILAAP',desc:'Climate risks in capital and liquidity adequacy',status:'Partial'},
            {exp:'Exp 13: Disclosure',desc:'Meaningful climate disclosures published',status:'Met'},
          ].map((e,i)=>(
            <div key={i} style={{padding:10,borderRadius:6,border:`1px solid ${T.border}`,background:e.status==='Met'?'#16a34a08':'#d9770608'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700}}>{e.exp}</span>
                <span style={S.tag(e.status==='Met'?T.green:T.amber)}>{e.status}</span>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{e.desc}</div>
            </div>
          ))}
        </div>
        <span style={S.cite}>Ref: ECB Guide on climate-related and environmental risks — Supervisory expectations (Nov 2020)</span>
      </div>

      {/* Export Panel */}
      <div style={S.card}>
        <div style={S.cardTitle}>Export & Regulatory Submission</div>
        <div style={S.cardSub}>Generate reports for regulatory submission and internal governance</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginTop:12}}>
          {[
            {fmt:'CSV',desc:'ECL tables with climate overlay',icon:'📊'},
            {fmt:'PDF',desc:'Board report with charts',icon:'📄'},
            {fmt:'EBA XML',desc:'Pillar 3 ESG template format',icon:'📋'},
            {fmt:'XBRL',desc:'Structured regulatory filing',icon:'🏛️'},
            {fmt:'Excel',desc:'Stress test workbook',icon:'📈'},
            {fmt:'JSON',desc:'API-ready data export',icon:'🔗'},
          ].map((f,i)=>(
            <button key={i} style={{...S.btn,...S.btnOutline,padding:16,textAlign:'left',display:'flex',gap:12,alignItems:'center'}} onClick={()=>setExportFormat(f.fmt)}>
              <span style={{fontSize:24}}>{f.icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:12}}>{f.fmt}</div>
                <div style={{fontSize:10,color:T.textMut,fontWeight:400}}>{f.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{marginTop:16,padding:12,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Export Contents:</div>
          <div style={{fontSize:10,color:T.textSec,lineHeight:1.8}}>
            • ECL Summary: {borrowers.length} borrowers × 4 NGFS scenarios × probability-weighted overlay<br/>
            • Stress Test Results: CET1 impact, sector concentration, top-20 most affected<br/>
            • Physical Risk: 8-hazard scoring, collateral impacts, LGD haircuts<br/>
            • Transition Risk: Carbon price sensitivity, EBITDA impacts, PD migration<br/>
            • EPC & MEES: {properties.length} properties, stranded asset timeline, retrofit cost-benefit<br/>
            • Regulatory Compliance: {REGULATORY_ITEMS.length} items across ECB/BoE/EBA/BCBS<br/>
            • Audit Trail: Methodology documentation, data lineage, model version
          </div>
          <button style={{...S.btn,...S.btnGold,marginTop:12}}>Export {exportFormat} Report</button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */
export default function ClimateCreditRiskPage(){
  const [tab,setTab]=useState('portfolio');
  const [selectedBorrower,setSelectedBorrower]=useState(null);
  const [carbonPrice,setCarbonPrice]=useState(150);

  return(
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.headerTitle}>Climate Credit Risk Analytics</h1>
          <div style={S.headerSub}>IFRS 9 + ECB Climate Overlay + BoE CBES + EBA GL ESG Risk Management</div>
        </div>
        <div style={S.headerRight}>
          <span style={S.badge}>IFRS 9 § 5.5</span>
          <span style={S.badge}>ECB C&E § 4.3</span>
          <span style={S.badge}>BoE SS3/19</span>
          <span style={S.badge}>EBA GL/2020/06</span>
          <span style={S.badge}>{BORROWERS.length} Borrowers · {PROPERTIES.length} Properties</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(t=>(
          <div key={t.id} style={{...S.tab,...(tab===t.id?S.tabActive:{})}} onClick={()=>setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>
        {tab==='portfolio'&&<BorrowerPortfolioTab borrowers={BORROWERS} onSelect={setSelectedBorrower}/>}
        {tab==='transition'&&<TransitionRiskTab borrowers={BORROWERS} carbonPrice={carbonPrice} setCarbonPrice={setCarbonPrice}/>}
        {tab==='physical'&&<PhysicalRiskTab borrowers={BORROWERS}/>}
        {tab==='ecl'&&<IFRS9ECLTab borrowers={BORROWERS} carbonPrice={carbonPrice}/>}
        {tab==='scenario'&&<ScenarioAnalysisTab borrowers={BORROWERS} carbonPrice={carbonPrice}/>}
        {tab==='epc'&&<EPCRealEstateTab properties={PROPERTIES}/>}
        {tab==='regulatory'&&<RegulatoryExportTab borrowers={BORROWERS} properties={PROPERTIES} carbonPrice={carbonPrice}/>}
      </div>

      {/* Side Panel */}
      {selectedBorrower&&<BorrowerSidePanel borrower={selectedBorrower} onClose={()=>setSelectedBorrower(null)} carbonPrice={carbonPrice}/>}

      {/* Footer */}
      <div style={{padding:'16px 32px',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,color:T.textMut,fontFamily:T.mono}}>
        <span>Climate Credit Risk Analytics v3.2 · IFRS 9 + ECB/BoE/EBA framework · {BORROWERS.length} borrowers · {PROPERTIES.length} CRE properties</span>
        <span>Data as at Q4 2024 · Carbon price: £{carbonPrice}/tCO₂e · Model version: CCR-2024-Q4</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * EXTENDED DATA SECTION — ADDITIONAL BORROWER ANALYTICS
 * ═══════════════════════════════════════════════════════════════════════════════ */

/* ── Credit Migration Matrix — Historical PD transitions (5Y) ─────────────── */
const CREDIT_MIGRATION_MATRIX = {
  'AAA': { 'AAA': 87.4, 'AA': 9.2, 'A': 2.1, 'BBB': 0.8, 'BB': 0.3, 'B': 0.1, 'CCC': 0.05, 'D': 0.05 },
  'AA':  { 'AAA': 1.2, 'AA': 85.8, 'A': 9.5, 'BBB': 2.2, 'BB': 0.8, 'B': 0.3, 'CCC': 0.1, 'D': 0.1 },
  'A':   { 'AAA': 0.1, 'AA': 2.5, 'A': 84.2, 'BBB': 9.8, 'BB': 2.1, 'B': 0.8, 'CCC': 0.3, 'D': 0.2 },
  'BBB': { 'AAA': 0.0, 'AA': 0.3, 'A': 3.8, 'BBB': 82.5, 'BB': 8.5, 'B': 3.2, 'CCC': 1.2, 'D': 0.5 },
  'BB':  { 'AAA': 0.0, 'AA': 0.1, 'A': 0.5, 'BBB': 5.2, 'BB': 76.8, 'B': 10.5, 'CCC': 4.2, 'D': 2.7 },
  'B':   { 'AAA': 0.0, 'AA': 0.0, 'A': 0.2, 'BBB': 0.8, 'BB': 5.5, 'B': 72.4, 'CCC': 12.8, 'D': 8.3 },
  'CCC': { 'AAA': 0.0, 'AA': 0.0, 'A': 0.0, 'BBB': 0.3, 'BB': 1.5, 'B': 8.2, 'CCC': 55.5, 'D': 34.5 },
};

/* ── Climate-adjusted migration multipliers by scenario ───────────────────── */
const CLIMATE_MIGRATION_MULT = {
  net_zero_2050:     { downgrade: 1.15, upgrade: 0.92 },
  below_2c:          { downgrade: 1.08, upgrade: 0.95 },
  delayed_transition:{ downgrade: 1.35, upgrade: 0.78 },
  current_policies:  { downgrade: 1.45, upgrade: 0.72 },
};

/* ── Concentration limits by sector ───────────────────────────────────────── */
const CONCENTRATION_LIMITS = {
  'Oil & Gas':          { limit: 8.0, warning: 6.5 },
  'Utilities':          { limit: 12.0, warning: 10.0 },
  'Mining':             { limit: 6.0, warning: 5.0 },
  'Steel & Metals':     { limit: 5.0, warning: 4.0 },
  'Chemicals':          { limit: 5.0, warning: 4.0 },
  'Cement':             { limit: 3.0, warning: 2.5 },
  'Transport':          { limit: 8.0, warning: 6.5 },
  'Agriculture':        { limit: 6.0, warning: 5.0 },
  'Real Estate':        { limit: 15.0, warning: 12.0 },
  'Technology':         { limit: 12.0, warning: 10.0 },
  'Healthcare':         { limit: 10.0, warning: 8.0 },
  'Financial Services': { limit: 15.0, warning: 12.0 },
  'Consumer Goods':     { limit: 8.0, warning: 6.5 },
  'Telecoms':           { limit: 6.0, warning: 5.0 },
  'Construction':       { limit: 6.0, warning: 5.0 },
  'Aerospace':          { limit: 5.0, warning: 4.0 },
  'Automotive':         { limit: 8.0, warning: 6.5 },
  'Retail':             { limit: 8.0, warning: 6.5 },
  'Food & Beverage':    { limit: 8.0, warning: 6.5 },
  'Shipping':           { limit: 5.0, warning: 4.0 },
};

/* ── Vintage analysis data (loan origination year → default rate) ─────────── */
const VINTAGE_DATA = [
  { year: 2018, originations: 2800, defaultRate: 3.2, climateAdjDefault: 4.1, lossRate: 1.8, avgPD: 0.028, avgLGD: 0.42 },
  { year: 2019, originations: 3200, defaultRate: 2.8, climateAdjDefault: 3.6, lossRate: 1.5, avgPD: 0.024, avgLGD: 0.40 },
  { year: 2020, originations: 2100, defaultRate: 4.5, climateAdjDefault: 5.8, lossRate: 2.9, avgPD: 0.038, avgLGD: 0.45 },
  { year: 2021, originations: 3800, defaultRate: 2.1, climateAdjDefault: 2.9, lossRate: 1.1, avgPD: 0.019, avgLGD: 0.38 },
  { year: 2022, originations: 3500, defaultRate: 1.8, climateAdjDefault: 2.5, lossRate: 0.9, avgPD: 0.016, avgLGD: 0.36 },
  { year: 2023, originations: 4200, defaultRate: 1.5, climateAdjDefault: 2.2, lossRate: 0.7, avgPD: 0.014, avgLGD: 0.35 },
  { year: 2024, originations: 3900, defaultRate: 0.8, climateAdjDefault: 1.4, lossRate: 0.4, avgPD: 0.010, avgLGD: 0.34 },
];

/* ── SICR Trigger definitions ─────────────────────────────────────────────── */
const SICR_TRIGGERS = [
  { id: 'T1', trigger: 'PD ratio > 1.5x baseline', type: 'Quantitative', category: 'Transition Risk', description: 'Climate-adjusted PD exceeds 1.5x the through-the-cycle baseline PD', threshold: 1.5, unit: 'ratio' },
  { id: 'T2', trigger: 'Physical risk score >= 4.0', type: 'Quantitative', category: 'Physical Risk', description: 'Composite physical risk score (8-hazard weighted average) reaches high-risk threshold', threshold: 4.0, unit: 'score' },
  { id: 'T3', trigger: 'EPC downgrade to F/G', type: 'Qualitative', category: 'Property Risk', description: 'CRE collateral EPC rating downgraded to F or G band (MEES non-compliance)', threshold: 'F', unit: 'band' },
  { id: 'T4', trigger: 'EBITDA impact > 15%', type: 'Quantitative', category: 'Transition Risk', description: 'Carbon price impact on borrower EBITDA exceeds 15% under selected scenario', threshold: 15, unit: '%' },
  { id: 'T5', trigger: 'Rating downgrade >= 2 notches', type: 'Quantitative', category: 'Credit Risk', description: 'External or internal credit rating downgraded by 2 or more notches', threshold: 2, unit: 'notches' },
  { id: 'T6', trigger: 'Sector on watchlist', type: 'Qualitative', category: 'Sector Risk', description: 'Borrower sector placed on climate risk watchlist by credit committee', threshold: null, unit: 'binary' },
  { id: 'T7', trigger: 'Collateral flood zone 3a/3b', type: 'Qualitative', category: 'Physical Risk', description: 'Collateral property located in Environment Agency Flood Zone 3a or 3b', threshold: '3a', unit: 'zone' },
  { id: 'T8', trigger: 'No transition plan by 2025', type: 'Qualitative', category: 'Transition Risk', description: 'High-carbon borrower has no credible transition plan by end-2025', threshold: null, unit: 'binary' },
  { id: 'T9', trigger: 'Stranded asset exposure > 30%', type: 'Quantitative', category: 'Asset Risk', description: 'More than 30% of borrower assets at risk of stranding under Net Zero scenario', threshold: 30, unit: '%' },
  { id: 'T10', trigger: 'Regulatory non-compliance', type: 'Qualitative', category: 'Regulatory', description: 'Borrower found non-compliant with applicable environmental regulations', threshold: null, unit: 'binary' },
];

/* ── ECL Backtesting data ─────────────────────────────────────────────────── */
const ECL_BACKTEST = [
  { quarter: 'Q1 2022', predicted: 285, actual: 298, variance: 4.6, coverage: 95.7, pass: true },
  { quarter: 'Q2 2022', predicted: 312, actual: 305, variance: -2.2, coverage: 102.3, pass: true },
  { quarter: 'Q3 2022', predicted: 328, actual: 342, variance: 4.3, coverage: 95.9, pass: true },
  { quarter: 'Q4 2022', predicted: 345, actual: 368, variance: 6.7, coverage: 93.8, pass: true },
  { quarter: 'Q1 2023', predicted: 362, actual: 378, variance: 4.4, coverage: 95.8, pass: true },
  { quarter: 'Q2 2023', predicted: 388, actual: 395, variance: 1.8, coverage: 98.2, pass: true },
  { quarter: 'Q3 2023', predicted: 405, actual: 412, variance: 1.7, coverage: 98.3, pass: true },
  { quarter: 'Q4 2023', predicted: 418, actual: 425, variance: 1.7, coverage: 98.4, pass: true },
  { quarter: 'Q1 2024', predicted: 425, actual: 432, variance: 1.6, coverage: 98.4, pass: true },
  { quarter: 'Q2 2024', predicted: 432, actual: 438, variance: 1.4, coverage: 98.6, pass: true },
  { quarter: 'Q3 2024', predicted: 438, actual: 445, variance: 1.6, coverage: 98.4, pass: true },
  { quarter: 'Q4 2024', predicted: 445, actual: 448, variance: 0.7, coverage: 99.3, pass: true },
];

/* ── Model validation metrics ─────────────────────────────────────────────── */
const MODEL_VALIDATION = {
  discriminatory_power: { auroc: 0.842, gini: 0.684, ks_stat: 0.412, benchmark: 'AUROC > 0.7 (EBA GL)' },
  calibration: { hosmer_lemeshow: 0.342, chi_sq_pvalue: 0.28, brier_score: 0.058, benchmark: 'HL p-value > 0.05' },
  stability: { psi: 0.048, csi: 0.032, benchmark: 'PSI < 0.1 (Green)' },
  concentration: { hhi: 0.082, top10_pct: 34.5, top20_pct: 52.8 },
  data_quality: { missing_rate: 2.3, outlier_rate: 0.8, dqs_weighted: 3.2 },
};

/* ── Covenant monitoring data ─────────────────────────────────────────────── */
const COVENANT_DATA = [
  { borrower: 'Shell International', covenant: 'Scope 1 reduction 30% by 2030', baseline: 82e6, current: 68e6, target: 57e6, status: 'On Track', nextReview: '2025-Q1' },
  { borrower: 'BP Upstream', covenant: 'Capex 40% low-carbon by 2025', baseline: 15, current: 28, target: 40, status: 'Behind', nextReview: '2025-Q2' },
  { borrower: 'TotalEnergies SE', covenant: 'Methane intensity < 0.1%', baseline: 0.18, current: 0.12, target: 0.10, status: 'On Track', nextReview: '2025-Q1' },
  { borrower: 'RWE AG', covenant: 'Coal exit by 2030', baseline: 100, current: 45, target: 0, status: 'On Track', nextReview: '2025-Q2' },
  { borrower: 'Maersk Group', covenant: 'Green methanol fleet 25% by 2030', baseline: 0, current: 8, target: 25, status: 'Behind', nextReview: '2025-Q1' },
  { borrower: 'ArcelorMittal SA', covenant: 'EAF route 40% by 2030', baseline: 15, current: 22, target: 40, status: 'On Track', nextReview: '2025-Q2' },
  { borrower: 'Lafarge Holcim AG', covenant: 'Clinker ratio < 0.65 by 2028', baseline: 0.75, current: 0.70, target: 0.65, status: 'On Track', nextReview: '2025-Q1' },
  { borrower: 'British Land Co', covenant: 'Portfolio EPC B by 2030', baseline: 'D', current: 'C', target: 'B', status: 'On Track', nextReview: '2025-Q2' },
  { borrower: 'Tata Steel Europe', covenant: 'DRI-EAF transition 50% by 2032', baseline: 0, current: 12, target: 50, status: 'Behind', nextReview: '2025-Q1' },
  { borrower: 'BASF Chemicals GmbH', covenant: 'Carbon mgmt programme 100% by 2026', baseline: 30, current: 72, target: 100, status: 'On Track', nextReview: '2025-Q2' },
  { borrower: 'Rio Tinto Mining', covenant: 'Tailings zero-discharge by 2030', baseline: 12, current: 5, target: 0, status: 'On Track', nextReview: '2025-Q1' },
  { borrower: 'Glencore International', covenant: 'Thermal coal revenue < 15% by 2028', baseline: 28, current: 20, target: 15, status: 'On Track', nextReview: '2025-Q2' },
];

/* ── Collateral valuation adjustments ─────────────────────────────────────── */
const COLLATERAL_ADJUSTMENTS = {
  physical_risk: {
    flood_zone_1: { haircut: 0, description: 'No adjustment — low flood risk' },
    flood_zone_2: { haircut: 0.05, description: '5% haircut — medium flood risk' },
    flood_zone_3a: { haircut: 0.12, description: '12% haircut — high flood risk' },
    flood_zone_3b: { haircut: 0.25, description: '25% haircut — functional floodplain' },
    coastal_erosion: { haircut: 0.15, description: '15% haircut — coastal erosion zone' },
    subsidence: { haircut: 0.08, description: '8% haircut — subsidence risk area' },
  },
  transition_risk: {
    fossil_infrastructure: { haircut: 0.20, description: '20% haircut — fossil fuel infrastructure' },
    ice_automotive: { haircut: 0.15, description: '15% haircut — ICE manufacturing plant' },
    high_epc: { haircut: 0.10, description: '10% haircut — EPC F/G commercial property' },
    coal_assets: { haircut: 0.35, description: '35% haircut — coal mining/power assets' },
    shipping_fossil: { haircut: 0.18, description: '18% haircut — fossil-fuel shipping fleet' },
  },
};

/* ── Extended sector analysis — carbon price impact curves ────────────────── */
const SECTOR_CARBON_CURVES = SECTORS.map((sector, i) => {
  const ss = SECTOR_SENSITIVITY[sector] || SECTOR_SENSITIVITY['Consumer Goods'];
  return {
    sector,
    transSensitivity: ss.transSens,
    carbonIntBase: ss.carbonIntBase,
    ebitdaMargin: ss.ebitdaMargin,
    impact_50: ss.carbonIntBase * 50 / 1000 / (ss.ebitdaMargin * 100) * 100,
    impact_100: ss.carbonIntBase * 100 / 1000 / (ss.ebitdaMargin * 100) * 100,
    impact_200: ss.carbonIntBase * 200 / 1000 / (ss.ebitdaMargin * 100) * 100,
    impact_500: ss.carbonIntBase * 500 / 1000 / (ss.ebitdaMargin * 100) * 100,
    impact_1000: ss.carbonIntBase * 1000 / 1000 / (ss.ebitdaMargin * 100) * 100,
    pdUplift_base: range(0.02, 0.15, i * 53 + 1),
    pdUplift_stress: range(0.08, 0.45, i * 53 + 2),
    lgdAdj: range(0, 0.08, i * 53 + 3),
    strandedAssetRisk: range(0, 85, i * 53 + 4),
    transitionPlan: pick(['Strong', 'Moderate', 'Weak', 'None'], i * 53 + 5),
    sbtiAlignment: pick(['1.5°C', 'WB2C', '2°C', 'None'], i * 53 + 6),
    taxonomyEligible: range(0, 60, i * 53 + 7),
    greenRevenue: range(0, 45, i * 53 + 8),
  };
});

/* ── Climate VaR by scenario ──────────────────────────────────────────────── */
const CLIMATE_VAR_DATA = NGFS_SCENARIOS.slice(0, 4).map((scen, i) => ({
  scenario: scen.name,
  category: scen.category,
  color: scen.color,
  var_95: range(50, 800, i * 97 + 1) * 1e6,
  var_99: range(100, 1500, i * 97 + 2) * 1e6,
  expected_shortfall: range(150, 2000, i * 97 + 3) * 1e6,
  cet1_impact_bp: range(-50, -350, i * 97 + 4),
  rwa_increase_pct: range(1.5, 12.5, i * 97 + 5),
  provision_charge: range(20, 250, i * 97 + 6) * 1e6,
  profit_impact_pct: range(-2, -18, i * 97 + 7),
  gdp_shock_pct: scen.gdpImpact2050_pct,
  peak_warming: scen.peakWarming_c,
}));

/* ── Time horizon analysis — ECL by maturity bucket ───────────────────────── */
const MATURITY_BUCKET_ECL = [
  { bucket: '0-1Y', exposure: 4200e6, ecl_base: 42e6, ecl_climate: 55e6, pd_avg: 0.018, lgd_avg: 0.38, count: 22 },
  { bucket: '1-3Y', exposure: 8500e6, ecl_base: 145e6, ecl_climate: 198e6, pd_avg: 0.025, lgd_avg: 0.42, count: 28 },
  { bucket: '3-5Y', exposure: 6800e6, ecl_base: 168e6, ecl_climate: 238e6, pd_avg: 0.032, lgd_avg: 0.45, count: 15 },
  { bucket: '5-10Y', exposure: 3200e6, ecl_base: 112e6, ecl_climate: 178e6, pd_avg: 0.042, lgd_avg: 0.48, count: 10 },
  { bucket: '10Y+', exposure: 1800e6, ecl_base: 85e6, ecl_climate: 152e6, pd_avg: 0.055, lgd_avg: 0.52, count: 5 },
];

/* ── Country risk premiums for climate ────────────────────────────────────── */
const COUNTRY_CLIMATE_PREMIUM = COUNTRIES.map((c, i) => ({
  country: c,
  physicalRiskPremium: range(0, 0.08, i * 71 + 1),
  transitionRiskPremium: range(0, 0.06, i * 71 + 2),
  regulatoryRiskPremium: range(0, 0.04, i * 71 + 3),
  compositeClimPremium: 0,
  ndGainScore: range(35, 80, i * 71 + 4),
  carbonPolicyStrength: pick(['Strong', 'Moderate', 'Weak', 'None'], i * 71 + 5),
  parisCompliant: sr(i * 71 + 6) > 0.5,
  climateVulnerability: pick(['Low', 'Medium', 'High', 'Very High'], i * 71 + 7),
})).map(c => ({
  ...c,
  compositeClimPremium: c.physicalRiskPremium + c.transitionRiskPremium + c.regulatoryRiskPremium,
}));

/* ── Stress testing — sector-level PD migration under each scenario ───────── */
const SECTOR_PD_MIGRATION = SECTORS.map((sector, i) => {
  const ss = SECTOR_SENSITIVITY[sector] || SECTOR_SENSITIVITY['Consumer Goods'];
  return {
    sector,
    base_pd: range(0.005, 0.06, i * 83 + 1),
    nz2050_pd: range(0.008, 0.09, i * 83 + 2),
    below2c_pd: range(0.006, 0.07, i * 83 + 3),
    delayed_pd: range(0.012, 0.14, i * 83 + 4),
    current_pd: range(0.015, 0.18, i * 83 + 5),
    nz2050_stage_shift: rangeInt(0, 3, i * 83 + 6),
    delayed_stage_shift: rangeInt(1, 8, i * 83 + 7),
    current_stage_shift: rangeInt(2, 12, i * 83 + 8),
    carbonIntensity: ss.carbonIntBase,
    transSensitivity: (ss.transSens * 100).toFixed(0) + '%',
  };
});

/* ── Loan Loss Provision waterfall ────────────────────────────────────────── */
const LLP_WATERFALL = [
  { item: 'Opening ECL (FY 2023)', value: 361e6, cumulative: 361e6, type: 'base' },
  { item: 'New originations', value: 28e6, cumulative: 389e6, type: 'increase' },
  { item: 'Repayments / maturities', value: -42e6, cumulative: 347e6, type: 'decrease' },
  { item: 'Model recalibration', value: 12e6, cumulative: 359e6, type: 'increase' },
  { item: 'PD parameter update', value: 15e6, cumulative: 374e6, type: 'increase' },
  { item: 'LGD parameter update', value: 8e6, cumulative: 382e6, type: 'increase' },
  { item: 'Stage migrations', value: 22e6, cumulative: 404e6, type: 'increase' },
  { item: 'Climate PD overlay', value: 18e6, cumulative: 422e6, type: 'climate' },
  { item: 'Climate LGD overlay', value: 8e6, cumulative: 430e6, type: 'climate' },
  { item: 'Physical risk overlay', value: 5e6, cumulative: 435e6, type: 'climate' },
  { item: 'Management overlay', value: 3e6, cumulative: 438e6, type: 'mgmt' },
  { item: 'Closing ECL (Q4 2024)', value: 438e6, cumulative: 438e6, type: 'total' },
];

/* ── Data quality scoring framework ───────────────────────────────────────── */
const DQS_FRAMEWORK = [
  { score: 5, label: 'Verified', description: 'Audited, third-party verified emissions data with assurance statement', pctPortfolio: 12, exposure: 2.8e9 },
  { score: 4, label: 'Reported', description: 'Company-reported emissions data from sustainability report or CDP', pctPortfolio: 28, exposure: 6.5e9 },
  { score: 3, label: 'Estimated — Activity', description: 'Estimated from physical activity data (energy consumption, production)', pctPortfolio: 32, exposure: 7.4e9 },
  { score: 2, label: 'Estimated — Revenue', description: 'Estimated from revenue-based emission factors (PCAF methodology)', pctPortfolio: 20, exposure: 4.6e9 },
  { score: 1, label: 'Sector Average', description: 'Sector-average emission factors applied (highest uncertainty)', pctPortfolio: 8, exposure: 1.9e9 },
];

/* ── Forward-looking indicator data ───────────────────────────────────────── */
const FORWARD_LOOKING_INDICATORS = [
  { indicator: 'EU ETS carbon price (€/t)', current: 65, forecast_2025: 80, forecast_2030: 130, trend: 'Rising', impact: 'Negative — increases borrower costs', signal: 'Amber' },
  { indicator: 'UK carbon price (£/t)', current: 45, forecast_2025: 55, forecast_2030: 95, trend: 'Rising', impact: 'Negative — UK-specific exposure', signal: 'Amber' },
  { indicator: 'Oil price ($/bbl)', current: 78, forecast_2025: 72, forecast_2030: 55, trend: 'Declining', impact: 'Mixed — O&G revenue vs cost', signal: 'Amber' },
  { indicator: 'Renewable LCOE ($/MWh)', current: 38, forecast_2025: 32, forecast_2030: 22, trend: 'Declining', impact: 'Positive — utility transition', signal: 'Green' },
  { indicator: 'EV market share (%)', current: 18, forecast_2025: 25, forecast_2030: 45, trend: 'Rising', impact: 'Negative — ICE auto exposure', signal: 'Red' },
  { indicator: 'Green bond issuance ($bn)', current: 550, forecast_2025: 720, forecast_2030: 1200, trend: 'Rising', impact: 'Positive — financing opportunity', signal: 'Green' },
  { indicator: 'Physical loss events (count)', current: 142, forecast_2025: 155, forecast_2030: 185, trend: 'Rising', impact: 'Negative — collateral values', signal: 'Red' },
  { indicator: 'CBAM implementation phase', current: 1, forecast_2025: 2, forecast_2030: 3, trend: 'Expanding', impact: 'Negative — import-exposed sectors', signal: 'Amber' },
  { indicator: 'MEES minimum EPC standard', current: 'E', forecast_2025: 'E', forecast_2030: 'C', trend: 'Tightening', impact: 'Negative — CRE collateral', signal: 'Red' },
  { indicator: 'SBTi commitments (portfolio %)', current: 42, forecast_2025: 55, forecast_2030: 75, trend: 'Rising', impact: 'Positive — lower transition risk', signal: 'Green' },
];

/* ── ECL sensitivity by parameter ─────────────────────────────────────────── */
const ECL_SENSITIVITY = [
  { parameter: 'Base PD +10%', eclChange: 32e6, pctChange: 7.3, direction: 'Adverse' },
  { parameter: 'Base PD -10%', eclChange: -28e6, pctChange: -6.4, direction: 'Favourable' },
  { parameter: 'LGD +5pp', eclChange: 45e6, pctChange: 10.3, direction: 'Adverse' },
  { parameter: 'LGD -5pp', eclChange: -42e6, pctChange: -9.6, direction: 'Favourable' },
  { parameter: 'Carbon price +50%', eclChange: 28e6, pctChange: 6.4, direction: 'Adverse' },
  { parameter: 'Carbon price -50%', eclChange: -18e6, pctChange: -4.1, direction: 'Favourable' },
  { parameter: 'Physical risk score +1', eclChange: 22e6, pctChange: 5.0, direction: 'Adverse' },
  { parameter: 'EPC downgrade 1 band', eclChange: 15e6, pctChange: 3.4, direction: 'Adverse' },
  { parameter: 'Scenario weight shift (more adverse)', eclChange: 38e6, pctChange: 8.7, direction: 'Adverse' },
  { parameter: 'Stage 2 threshold -20%', eclChange: 52e6, pctChange: 11.9, direction: 'Adverse' },
  { parameter: 'Maturity extension +2Y', eclChange: 25e6, pctChange: 5.7, direction: 'Adverse' },
  { parameter: 'Discount rate +1%', eclChange: -12e6, pctChange: -2.7, direction: 'Favourable' },
];

/* ── Borrower engagement tracker ──────────────────────────────────────────── */
const ENGAGEMENT_TRACKER = [
  { borrower: 'Shell International', engagementType: 'Transition Plan Review', date: '2024-10-15', outcome: 'Plan updated — 2030 interim target added', status: 'Positive', nextStep: 'Annual review Q4 2025' },
  { borrower: 'ArcelorMittal SA', engagementType: 'Technology Pathway', date: '2024-09-22', outcome: 'DRI-EAF pilot announced for Dunkirk', status: 'Positive', nextStep: 'Monitor capex allocation' },
  { borrower: 'Maersk Group', engagementType: 'Fleet Transition', date: '2024-11-05', outcome: 'Green methanol vessel orders confirmed', status: 'Positive', nextStep: 'Review fuel sourcing strategy' },
  { borrower: 'BP Upstream', engagementType: 'Capital Allocation', date: '2024-08-18', outcome: 'Low-carbon capex below target', status: 'Negative', nextStep: 'Escalation to credit committee' },
  { borrower: 'British Land Co', engagementType: 'EPC Upgrade Programme', date: '2024-07-30', outcome: 'Retrofit programme on schedule', status: 'Positive', nextStep: 'H1 2025 EPC reassessment' },
  { borrower: 'Lafarge Holcim AG', engagementType: 'CCUS Project', date: '2024-10-02', outcome: 'Brevik CCS project progressing', status: 'Positive', nextStep: 'Commissioning review 2025' },
  { borrower: 'Tata Steel Europe', engagementType: 'DRI Transition', date: '2024-09-15', outcome: 'Port Talbot BF closure delayed', status: 'Negative', nextStep: 'Revised timeline assessment' },
  { borrower: 'Glencore International', engagementType: 'Coal Phase-Down', date: '2024-11-12', outcome: 'Responsible closure plan tabled', status: 'Neutral', nextStep: 'Community impact assessment' },
  { borrower: 'RWE AG', engagementType: 'Renewable Expansion', date: '2024-10-28', outcome: 'Offshore wind capacity on track', status: 'Positive', nextStep: 'Grid connection review' },
  { borrower: 'National Grid plc', engagementType: 'Grid Readiness', date: '2024-11-20', outcome: 'RIIO-3 investment plan filed', status: 'Positive', nextStep: 'Ofgem determination review' },
];

/* ── Methodology documentation ────────────────────────────────────────────── */
const METHODOLOGY_DOCS = [
  { id: 'M01', title: 'Climate PD Overlay Methodology', version: '3.2', lastReview: '2024-09-30', approver: 'Model Validation Committee', nextReview: '2025-09-30', pages: 48 },
  { id: 'M02', title: 'Climate LGD Adjustment Framework', version: '2.1', lastReview: '2024-06-30', approver: 'Model Validation Committee', nextReview: '2025-06-30', pages: 35 },
  { id: 'M03', title: 'SICR Trigger Calibration — Climate Events', version: '1.4', lastReview: '2024-09-30', approver: 'Credit Risk Committee', nextReview: '2025-09-30', pages: 22 },
  { id: 'M04', title: 'Physical Risk Scoring Methodology', version: '2.0', lastReview: '2024-03-31', approver: 'Model Validation Committee', nextReview: '2025-03-31', pages: 41 },
  { id: 'M05', title: 'EPC-to-LGD Haircut Calibration', version: '1.2', lastReview: '2024-06-30', approver: 'Property Valuation Committee', nextReview: '2025-06-30', pages: 18 },
  { id: 'M06', title: 'NGFS Scenario Application Guide', version: '4.0', lastReview: '2024-09-30', approver: 'Scenario Analysis Working Group', nextReview: '2025-09-30', pages: 56 },
  { id: 'M07', title: 'Carbon Price Sensitivity Framework', version: '2.3', lastReview: '2024-09-30', approver: 'Market Risk Committee', nextReview: '2025-09-30', pages: 28 },
  { id: 'M08', title: 'Probability-Weighted ECL Methodology', version: '3.0', lastReview: '2024-06-30', approver: 'Model Validation Committee', nextReview: '2025-06-30', pages: 38 },
  { id: 'M09', title: 'Collateral Valuation — Climate Adjustment', version: '1.5', lastReview: '2024-09-30', approver: 'Property Valuation Committee', nextReview: '2025-09-30', pages: 24 },
  { id: 'M10', title: 'Climate Covenant Framework', version: '1.0', lastReview: '2024-03-31', approver: 'Credit Committee', nextReview: '2025-03-31', pages: 16 },
];

/* ── Extended EPC analysis — retrofit programme tracker ────────────────────── */
const RETROFIT_PROGRAMME = [
  { property: 'City Tower', currentEPC: 'E', targetEPC: 'C', workType: 'Fabric insulation + LED lighting', cost: 185000, startDate: '2025-Q1', endDate: '2025-Q3', contractor: 'Balfour Beatty', status: 'Approved', energySaving: 32, co2Reduction: 28 },
  { property: 'Riverside House', currentEPC: 'F', targetEPC: 'C', workType: 'Heat pump + double glazing + insulation', cost: 320000, startDate: '2025-Q2', endDate: '2026-Q1', contractor: 'Skanska', status: 'Tendered', energySaving: 48, co2Reduction: 42 },
  { property: 'Victoria Plaza', currentEPC: 'D', targetEPC: 'B', workType: 'Solar PV + BMS upgrade + LED', cost: 145000, startDate: '2025-Q1', endDate: '2025-Q2', contractor: 'ISG', status: 'In Progress', energySaving: 25, co2Reduction: 22 },
  { property: 'Manchester Central', currentEPC: 'E', targetEPC: 'C', workType: 'Cavity wall + roof insulation + controls', cost: 210000, startDate: '2025-Q2', endDate: '2025-Q4', contractor: 'Morgan Sindall', status: 'Approved', energySaving: 35, co2Reduction: 30 },
  { property: 'Birmingham Gateway', currentEPC: 'G', targetEPC: 'D', workType: 'Full fabric upgrade + ASHP + PV', cost: 480000, startDate: '2025-Q1', endDate: '2026-Q2', contractor: 'Bouygues', status: 'Planning', energySaving: 55, co2Reduction: 50 },
  { property: 'Leeds Commerce', currentEPC: 'D', targetEPC: 'B', workType: 'MVHR + LED + solar PV', cost: 125000, startDate: '2025-Q3', endDate: '2025-Q4', contractor: 'Wates', status: 'Tendered', energySaving: 22, co2Reduction: 18 },
  { property: 'Edinburgh New Town', currentEPC: 'F', targetEPC: 'C', workType: 'Listed building sensitive retrofit', cost: 420000, startDate: '2025-Q2', endDate: '2026-Q3', contractor: 'Sir Robert McAlpine', status: 'Heritage consent', energySaving: 42, co2Reduction: 38 },
  { property: 'Glasgow Waterfront', currentEPC: 'E', targetEPC: 'C', workType: 'External wall insulation + ASHP', cost: 275000, startDate: '2025-Q3', endDate: '2026-Q1', contractor: 'Galliford Try', status: 'Approved', energySaving: 38, co2Reduction: 34 },
  { property: 'Bristol Harbourside', currentEPC: 'D', targetEPC: 'B', workType: 'Triple glazing + PV + smart controls', cost: 198000, startDate: '2025-Q1', endDate: '2025-Q3', contractor: 'Willmott Dixon', status: 'In Progress', energySaving: 28, co2Reduction: 24 },
  { property: 'Cardiff Bay', currentEPC: 'G', targetEPC: 'D', workType: 'Full deep retrofit', cost: 550000, startDate: '2025-Q2', endDate: '2026-Q4', contractor: 'Kier Group', status: 'Planning', energySaving: 60, co2Reduction: 55 },
];

/* ── CRREM pathway analysis by property type ──────────────────────────────── */
const CRREM_PATHWAYS = [
  { propertyType: 'Office — Prime City', crremTarget2025: 75, crremTarget2030: 45, crremTarget2050: 0, currentIntensity: 82, strandingYear: 2028, gapToTarget: 37 },
  { propertyType: 'Office — Suburban', crremTarget2025: 80, crremTarget2030: 50, crremTarget2050: 0, currentIntensity: 95, strandingYear: 2026, gapToTarget: 45 },
  { propertyType: 'Retail — High Street', crremTarget2025: 120, crremTarget2030: 72, crremTarget2050: 0, currentIntensity: 105, strandingYear: 2030, gapToTarget: 33 },
  { propertyType: 'Retail — Warehouse', crremTarget2025: 95, crremTarget2030: 58, crremTarget2050: 0, currentIntensity: 88, strandingYear: 2031, gapToTarget: 30 },
  { propertyType: 'Industrial — Logistics', crremTarget2025: 65, crremTarget2030: 40, crremTarget2050: 0, currentIntensity: 58, strandingYear: 2032, gapToTarget: 18 },
  { propertyType: 'Industrial — Manufacturing', crremTarget2025: 110, crremTarget2030: 68, crremTarget2050: 0, currentIntensity: 125, strandingYear: 2024, gapToTarget: 57 },
  { propertyType: 'Residential — Multi-Family', crremTarget2025: 55, crremTarget2030: 32, crremTarget2050: 0, currentIntensity: 48, strandingYear: 2033, gapToTarget: 16 },
  { propertyType: 'Mixed-Use — Urban', crremTarget2025: 85, crremTarget2030: 52, crremTarget2050: 0, currentIntensity: 78, strandingYear: 2029, gapToTarget: 26 },
];

/* ── Stress test time horizon analysis ────────────────────────────────────── */
const STRESS_HORIZONS = [
  { horizon: '1 Year', nz2050_ecl: 48e6, below2c_ecl: 38e6, delayed_ecl: 62e6, current_ecl: 72e6, base_ecl: 35e6 },
  { horizon: '3 Years', nz2050_ecl: 125e6, below2c_ecl: 98e6, delayed_ecl: 178e6, current_ecl: 205e6, base_ecl: 95e6 },
  { horizon: '5 Years', nz2050_ecl: 215e6, below2c_ecl: 168e6, delayed_ecl: 320e6, current_ecl: 385e6, base_ecl: 155e6 },
  { horizon: '10 Years', nz2050_ecl: 380e6, below2c_ecl: 295e6, delayed_ecl: 580e6, current_ecl: 720e6, base_ecl: 265e6 },
  { horizon: '30 Years', nz2050_ecl: 520e6, below2c_ecl: 425e6, delayed_ecl: 850e6, current_ecl: 1250e6, base_ecl: 380e6 },
];

/* ── Portfolio climate VaR by confidence level ────────────────────────────── */
const CLIMATE_VAR_CONFIDENCE = [
  { confidence: '90%', var_transition: 185e6, var_physical: 92e6, var_combined: 248e6, es_combined: 312e6 },
  { confidence: '95%', var_transition: 265e6, var_physical: 138e6, var_combined: 368e6, es_combined: 452e6 },
  { confidence: '97.5%', var_transition: 342e6, var_physical: 185e6, var_combined: 488e6, es_combined: 598e6 },
  { confidence: '99%', var_transition: 445e6, var_physical: 248e6, var_combined: 648e6, es_combined: 795e6 },
  { confidence: '99.5%', var_transition: 528e6, var_physical: 305e6, var_combined: 785e6, es_combined: 968e6 },
  { confidence: '99.9%', var_transition: 720e6, var_physical: 425e6, var_combined: 1085e6, es_combined: 1342e6 },
];

/* ── Sector-level expected loss by NGFS scenario (detailed) ───────────────── */
const SECTOR_EXPECTED_LOSS = SECTORS.map((sector, i) => {
  const ss = SECTOR_SENSITIVITY[sector] || SECTOR_SENSITIVITY['Consumer Goods'];
  const baseEL = range(0.5, 8.5, i * 67 + 1);
  return {
    sector,
    baseExpLoss: baseEL,
    nz2050_el: baseEL * (1 + ss.transSens * 0.8),
    below2c_el: baseEL * (1 + ss.transSens * 0.5),
    delayed_el: baseEL * (1 + ss.transSens * 1.5),
    current_el: baseEL * (1 + ss.transSens * 0.3 + (SECTOR_SENSITIVITY[sector]?.physRiskBase || 2) * 0.1),
    exposureConc: range(1, 15, i * 67 + 2),
    concentrationLimit: CONCENTRATION_LIMITS[sector]?.limit || 10,
    breached: false,
    sbtiCoverage: range(10, 75, i * 67 + 3),
    avgTransPlan: pick(['Strong', 'Moderate', 'Weak', 'None'], i * 67 + 4),
    avgMaturity: range(2, 12, i * 67 + 5),
    stageDistribution: {
      stage1: rangeInt(40, 85, i * 67 + 6),
      stage2: rangeInt(10, 40, i * 67 + 7),
      stage3: rangeInt(0, 15, i * 67 + 8),
    },
  };
}).map(s => ({ ...s, breached: s.exposureConc > s.concentrationLimit }));

/* ── Interest rate sensitivity under climate scenarios ─────────────────────── */
const IR_SENSITIVITY = [
  { scenario: 'Net Zero 2050', irShift_bp: 50, nii_impact_pct: -2.1, eva_impact_pct: -3.5, duration_gap: 1.8 },
  { scenario: 'Below 2°C', irShift_bp: 30, nii_impact_pct: -1.2, eva_impact_pct: -2.0, duration_gap: 1.5 },
  { scenario: 'Delayed Transition', irShift_bp: 120, nii_impact_pct: -5.5, eva_impact_pct: -8.2, duration_gap: 2.4 },
  { scenario: 'Current Policies', irShift_bp: 80, nii_impact_pct: -3.8, eva_impact_pct: -5.5, duration_gap: 2.1 },
];

/* ── Recovery rate analysis by climate factor ─────────────────────────────── */
const RECOVERY_ANALYSIS = [
  { factor: 'Baseline (no climate)', avgRecovery: 58.2, min: 35, max: 82, sample: 450 },
  { factor: 'Transition risk — moderate', avgRecovery: 52.5, min: 28, max: 75, sample: 180 },
  { factor: 'Transition risk — high', avgRecovery: 42.8, min: 18, max: 65, sample: 85 },
  { factor: 'Physical risk — moderate', avgRecovery: 55.0, min: 32, max: 78, sample: 120 },
  { factor: 'Physical risk — high', avgRecovery: 45.5, min: 22, max: 68, sample: 55 },
  { factor: 'EPC E or below', avgRecovery: 48.2, min: 25, max: 72, sample: 95 },
  { factor: 'Flood Zone 3a/3b', avgRecovery: 40.5, min: 15, max: 62, sample: 42 },
  { factor: 'Stranded asset exposure', avgRecovery: 35.8, min: 10, max: 55, sample: 28 },
  { factor: 'No transition plan', avgRecovery: 44.0, min: 20, max: 68, sample: 65 },
  { factor: 'Carbon-intensive (>300 tCO₂e/£M)', avgRecovery: 46.5, min: 22, max: 70, sample: 110 },
];

/* ── Watch list rationale detail ──────────────────────────────────────────── */
const WATCHLIST_REASONS = [
  { reason: 'High carbon intensity with no transition plan', count: 8, sectors: ['Oil & Gas', 'Steel & Metals', 'Cement'], avgExposure: 285e6 },
  { reason: 'Physical risk score >= 4.0 with material collateral', count: 6, sectors: ['Agriculture', 'Real Estate', 'Tourism'], avgExposure: 125e6 },
  { reason: 'EPC F/G with MEES non-compliance', count: 5, sectors: ['Real Estate'], avgExposure: 48e6 },
  { reason: 'PD uplift >100% under Delayed Transition', count: 7, sectors: ['Oil & Gas', 'Mining', 'Shipping', 'Cement'], avgExposure: 195e6 },
  { reason: 'SICR triggered — multiple climate factors', count: 4, sectors: ['Oil & Gas', 'Utilities'], avgExposure: 420e6 },
  { reason: 'Covenant breach risk — climate KPI', count: 3, sectors: ['Oil & Gas', 'Steel & Metals'], avgExposure: 310e6 },
  { reason: 'Stranded asset exposure >40% of book value', count: 5, sectors: ['Oil & Gas', 'Mining', 'Utilities'], avgExposure: 245e6 },
  { reason: 'Country risk — high physical vulnerability (ND-GAIN <40)', count: 4, sectors: ['Agriculture', 'Mining'], avgExposure: 85e6 },
];

/* ── Portfolio decarbonisation pathway ─────────────────────────────────────── */
const DECARB_PATHWAY = [
  { year: 2022, finEmissions: 960, target: 960, sbtiPath: 960, iea_nze: 960, gap: 0 },
  { year: 2023, finEmissions: 847, target: 850, sbtiPath: 870, iea_nze: 840, gap: 7 },
  { year: 2024, finEmissions: 812, target: 750, sbtiPath: 790, iea_nze: 720, gap: 92 },
  { year: 2025, finEmissions: null, target: 660, sbtiPath: 710, iea_nze: 600, gap: null },
  { year: 2026, finEmissions: null, target: 580, sbtiPath: 640, iea_nze: 500, gap: null },
  { year: 2027, finEmissions: null, target: 510, sbtiPath: 570, iea_nze: 420, gap: null },
  { year: 2028, finEmissions: null, target: 450, sbtiPath: 510, iea_nze: 350, gap: null },
  { year: 2029, finEmissions: null, target: 400, sbtiPath: 450, iea_nze: 280, gap: null },
  { year: 2030, finEmissions: null, target: 350, sbtiPath: 400, iea_nze: 220, gap: null },
  { year: 2035, finEmissions: null, target: 180, sbtiPath: 220, iea_nze: 110, gap: null },
  { year: 2040, finEmissions: null, target: 80, sbtiPath: 100, iea_nze: 40, gap: null },
  { year: 2050, finEmissions: null, target: 0, sbtiPath: 0, iea_nze: 0, gap: null },
];

/* ── Audit and governance trail ───────────────────────────────────────────── */
const AUDIT_TRAIL = [
  { date: '2024-11-22', event: 'ECL model recalibration', user: 'Model Risk Team', detail: 'PD/LGD parameters updated with Q3 2024 data', approval: 'Model Validation Committee' },
  { date: '2024-11-15', event: 'Climate overlay update', user: 'Climate Risk Team', detail: 'Carbon price sensitivity recalculated at £150/t', approval: 'CRO' },
  { date: '2024-11-01', event: 'SICR trigger review', user: 'Credit Committee', detail: 'Physical risk SICR threshold confirmed at 4.0', approval: 'Credit Committee' },
  { date: '2024-10-30', event: 'EPC data refresh', user: 'Property Risk', detail: '40 CRE properties EPC re-assessed', approval: 'Property Valuation Committee' },
  { date: '2024-10-15', event: 'NGFS scenario update', user: 'Risk Analytics', detail: 'Phase IV scenarios calibrated for UK portfolio', approval: 'Scenario Working Group' },
  { date: '2024-10-01', event: 'Borrower engagement review', user: 'Sustainability Team', detail: '10 high-carbon borrowers engagement status updated', approval: 'Credit Committee' },
  { date: '2024-09-30', event: 'Model validation annual review', user: 'Model Validation', detail: 'Full backtesting and discrimination analysis completed', approval: 'Audit Committee' },
  { date: '2024-09-15', event: 'Board risk appetite reaffirmed', user: 'Board Secretary', detail: '15 climate risk metrics limits confirmed for FY2025', approval: 'Board of Directors' },
  { date: '2024-08-31', event: 'Regulatory submission', user: 'Regulatory Reporting', detail: 'ECB C&E risk dashboard Q2 2024 submitted', approval: 'CFO' },
  { date: '2024-08-15', event: 'Peer benchmarking update', user: 'Strategy Team', detail: '10 peer banks H1 2024 climate metrics collected', approval: 'Strategy Committee' },
  { date: '2024-07-31', event: 'Physical risk model v2.0 deployed', user: 'Risk Analytics', detail: '8-hazard scoring model with IPCC AR6 data', approval: 'Model Validation Committee' },
  { date: '2024-07-15', event: 'Climate covenant framework approved', user: 'Credit Committee', detail: 'New climate covenant template for high-carbon borrowers', approval: 'Credit Committee' },
];
