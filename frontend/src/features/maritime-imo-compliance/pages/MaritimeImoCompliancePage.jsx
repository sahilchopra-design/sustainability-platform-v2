import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SHIP_TYPES=['Bulk Carrier','Container','Tanker','LNG Carrier','Car Carrier','Cruise','RoRo','Offshore'];
const CII_GRADES=['A','B','C','D','E'];
const CII_COLORS={A:T.green,B:'#22c55e',C:T.amber,D:'#f97316',E:T.red};
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const FLAG_STATES=['Panama','Liberia','Marshall Islands','Hong Kong','Singapore','Bahamas','Malta','Greece','Cyprus','Norway'];

const COMPANIES=Array.from({length:20},(_,i)=>{
  const names=['Maersk Line','MSC Shipping','CMA CGM','Hapag-Lloyd','COSCO Shipping',
    'Evergreen Marine','ONE Network','Yang Ming','ZIM Integrated','HMM Co',
    'Euronav NV','Frontline Ltd','Teekay Corp','Stena Bulk','BW Group',
    'Torm PLC','Scorpio Tankers','Star Bulk','Diana Shipping','Navios Maritime'];
  const hqs=['Copenhagen','Geneva','Marseille','Hamburg','Shanghai',
    'Taipei','Singapore','Keelung','Haifa','Seoul',
    'Antwerp','Oslo','Hamilton','Gothenburg','Singapore',
    'Copenhagen','Monaco','Athens','Athens','Piraeus'];
  return{id:i,name:names[i],hq:hqs[i],fleetSize:Math.floor(sr(i*99)*12)+3,
    avgCII:['B','B','C','B','C','B','C','C','B','C','B','C','B','B','C','C','C','B','C','C'][i],
    revenue:Math.floor(sr(i*103)*15000+2000),
    carbonIntensity:Math.floor(sr(i*107)*30+10)};
});

const VESSEL_NAMES=['Pacific Voyager','Atlantic Spirit','Nordic Star','Eastern Promise','Southern Cross',
  'Ocean Titan','Sea Fortune','Golden Wave','Bright Horizon','Crystal Bay',
  'Iron Phoenix','Silver Dawn','Emerald Breeze','Coral Princess','Blue Navigator',
  'Jade Emperor','Ruby Quest','Sapphire Wing','Diamond Peak','Arctic Glory',
  'Polar Venture','Storm Rider','Wind Chaser','Sun Mariner','Moon Harbour',
  'Star Pathfinder','Neptune Rising','Thunder Bay','Harbour Light','Cape Frontier',
  'Deep Current','Tidal Force','Reef Guardian','Gulf Stream','Channel Master',
  'Island Hopper','Port Royal','Marina Crest','Dock Pioneer','Bay Explorer',
  'River Monarch','Lake Superior','Fjord Spirit','Delta Queen','Strait Runner',
  'Cove Keeper','Lagoon Drift','Estuary Falcon','Shore Sentinel','Tide Walker',
  'Coral Venture','Wave Pioneer','Storm Breaker','Sea Eagle','Ocean Crest',
  'Marine Spirit','Aqua Fortune','Deep Horizon','Blue Phoenix','Silver Tide',
  'Golden Compass','Iron Wave','Crystal Spirit','Emerald Star','Ruby Ocean',
  'Sapphire Bay','Diamond Drift','Arctic Flame','Polar Light','Thunder Peak',
  'Neptune Quest','Gulf Pioneer','Cape Storm','Harbour Dawn','Port Sentinel',
  'Bay Monarch','River Fortune','Island Spirit','Channel Hawk','Strait Pioneer',
  'Cove Falcon','Lagoon Star','Estuary Dawn','Shore Pioneer','Tide Monarch',
  'Delta Spirit','Fjord Light','Lake Fortune','Marina Dawn','Dock Sentinel',
  'Pacific Star','Atlantic Dawn','Nordic Wave','Eastern Star','Southern Light',
  'Ocean Dawn','Sea Pioneer','Golden Star','Bright Wave','Crystal Dawn',
  'Iron Star','Silver Wave','Emerald Dawn','Coral Star','Blue Wave',
  'Jade Dawn','Ruby Star','Sapphire Dawn','Diamond Wave','Arctic Star',
  'Polar Dawn','Storm Star','Wind Wave','Sun Star','Moon Dawn',
  'Star Wave','Neptune Star','Thunder Dawn','Bay Star','Cape Wave',
  'Deep Star','Tidal Dawn','Reef Star','Gulf Wave','Channel Star',
  'Island Dawn','Port Star','Marina Wave','Dock Star','River Dawn',
  'Lake Star','Fjord Wave','Delta Star','Strait Dawn','Cove Star',
  'Lagoon Wave','Estuary Star','Shore Dawn','Tide Star','Coral Wave',
  'Wave Star','Storm Dawn','Sea Star','Ocean Wave','Marine Star',
  'Aqua Dawn','Deep Wave','Blue Star','Silver Star','Golden Dawn',
  'Iron Dawn','Crystal Wave','Emerald Wave','Ruby Dawn','Sapphire Star'];

const genVessels=()=>Array.from({length:150},(_,i)=>{
  const typeIdx=Math.floor(sr(i*13)*8);
  const compIdx=Math.floor(sr(i*17)*20);
  const gradeIdx=Math.min(4,Math.floor(sr(i*23)*5));
  const dwt=Math.floor(sr(i*31)*180000)+20000;
  const aer=Math.floor(sr(i*37)*15)+3+gradeIdx*2;
  const eexiComp=sr(i*41)>0.25;
  const built=Math.floor(sr(i*43)*25)+2000;
  const speed=Math.floor(sr(i*47)*10)+10;
  const flagIdx=Math.floor(sr(i*51)*10);
  const ciiHist=QUARTERS.map((q,qi)=>{
    const base=gradeIdx;
    const drift=sr(i*53+qi*7)*1.5-0.5;
    return{q,grade:CII_GRADES[Math.max(0,Math.min(4,Math.round(base+drift)))],
      aer:Math.max(1,aer+Math.floor(sr(i*59+qi*11)*6)-3)};
  });
  const voyages=Math.floor(sr(i*61)*40)+5;
  const lastDrydock=2021+Math.floor(sr(i*63)*4);
  return{id:i,name:VESSEL_NAMES[i],imo:9100000+i*137,type:SHIP_TYPES[typeIdx],
    dwt,company:COMPANIES[compIdx].name,companyIdx:compIdx,
    ciiGrade:CII_GRADES[gradeIdx],eexiCompliant:eexiComp,aer,built,speed,
    flag:FLAG_STATES[flagIdx],ciiHistory:ciiHist,
    retrofitCost:Math.floor(sr(i*65)*8+2)*1e6,
    fuelSavings:Math.floor(sr(i*67)*20+5),
    co2Reduction:Math.floor(sr(i*71)*30+10),
    voyages,lastDrydock,
    mainEngine:['MAN B&W','Wartsila','Mitsubishi','Hyundai HiMSEN','Rolls-Royce'][Math.floor(sr(i*73)*5)],
    fuelType:['HFO','VLSFO','MGO','LNG','Methanol'][Math.floor(sr(i*79)*5)],
    annualEmissions:Math.floor(sr(i*81)*50000+5000),
    classSociety:['DNV','Lloyds','Bureau Veritas','ClassNK','ABS'][Math.floor(sr(i*83)*5)],
  };
});

const FUELS=[
  {name:'LNG',cost:65,availability:72,emReduction:25,infraReady:68,safety:75,scalability:70,color:'#3b82f6'},
  {name:'Methanol',cost:58,availability:55,emReduction:35,infraReady:45,safety:80,scalability:65,color:'#8b5cf6'},
  {name:'Ammonia',cost:72,availability:40,emReduction:90,infraReady:25,safety:45,scalability:80,color:'#ef4444'},
  {name:'Green Hydrogen',cost:88,availability:20,emReduction:100,infraReady:15,safety:40,scalability:55,color:'#06b6d4'},
  {name:'Biofuel',cost:55,availability:60,emReduction:45,infraReady:70,safety:85,scalability:40,color:'#22c55e'},
  {name:'Wind Assist',cost:30,availability:80,emReduction:15,infraReady:75,safety:90,scalability:50,color:'#6366f1'},
  {name:'Nuclear',cost:95,availability:10,emReduction:100,infraReady:5,safety:30,scalability:35,color:'#f59e0b'},
  {name:'Battery Hybrid',cost:70,availability:45,emReduction:30,infraReady:40,safety:70,scalability:30,color:'#10b981'},
  {name:'E-Methanol',cost:82,availability:15,emReduction:85,infraReady:12,safety:78,scalability:60,color:'#ec4899'},
  {name:'Synthetic Diesel',cost:78,availability:18,emReduction:75,infraReady:20,safety:82,scalability:45,color:'#f97316'},
];

const PORTS=['Singapore','Rotterdam','Shanghai','Fujairah','Houston','Antwerp','Busan','Hong Kong',
  'Los Angeles','Yokohama','Hamburg','Durban','Santos','Mumbai','Jeddah','Piraeus',
  'Algeciras','Colombo','Tanjung Pelepas','Kaohsiung'];

const LOANS=Array.from({length:20},(_,i)=>{
  const amt=Math.floor(sr(i*89)*400+50);
  const align=Math.floor(sr(i*91)*40+40);
  const pd=sr(i*93)*8+0.5;
  const ciiCov=CII_GRADES[Math.floor(sr(i*97)*3)];
  const breached=sr(i*101)>0.7;
  const fuelEU=sr(i*103)>0.35;
  return{id:i,borrower:COMPANIES[i].name,
    facility:`SF-${2024+Math.floor(i/7)}-${String(i+1).padStart(3,'0')}`,
    amount:amt,currency:'USD',alignment:align,pd:pd.toFixed(2),
    ciiCovenant:ciiCov,breached,fuelEUCompliant:fuelEU,
    maturity:2027+Math.floor(sr(i*107)*8),
    vessels:Math.floor(sr(i*109)*10)+1,
    lender:['DNB Markets','ING Group','ABN AMRO','Nordea','SEB','Credit Agricole','BNP Paribas','Citi Marine','HSBC Shipping','Deutsche Bank'][i%10],
    collateral:Math.floor(amt*1.3),
    interestRate:(sr(i*111)*3+2).toFixed(2),
    drawdown:Math.floor(amt*sr(i*113)*0.4+amt*0.5),
    trajectory:Array.from({length:8},(_,j)=>({yr:2023+j,score:Math.min(100,Math.max(0,align+Math.floor(sr(i*117+j*7)*20)-10))}))}
});

const IMO_PATHWAY=Array.from({length:31},(_,i)=>{
  const yr=2020+i;
  const base=100;
  const ambition=yr<=2030?base-(i/10)*20:yr<=2040?80-((yr-2030)/10)*50:30-((yr-2040)/10)*30;
  const wb2=yr<=2030?base-(i/10)*25:yr<=2040?75-((yr-2030)/10)*55:20-((yr-2040)/10)*20;
  const bau=base-(i/30)*15;
  return{year:yr,ambition:Math.max(0,Math.round(ambition)),wb2:Math.max(0,Math.round(wb2)),bau:Math.max(0,Math.round(bau))};
});

/* ─── Shared UI Components ─── */
const KPI=({label,value,sub,color})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:160}}>
    <div style={{fontSize:12,color:T.textMut,fontFamily:T.font,marginBottom:4}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.font}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginTop:2}}>{sub}</div>}
  </div>
);

const Badge=({text,color,bg})=>(
  <span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,
    fontFamily:T.font,color:color||T.surface,background:bg||T.navy}}>{text}</span>
);

const ProgressBar=({value,max=100,color})=>(
  <div style={{display:'flex',alignItems:'center',gap:6}}>
    <div style={{width:60,height:6,borderRadius:3,background:T.border}}>
      <div style={{width:`${Math.min(100,value/max*100)}%`,height:'100%',borderRadius:3,
        background:color||(value/max>=0.7?T.green:value/max>=0.5?T.amber:T.red)}}/>
    </div>
    <span style={{fontFamily:T.mono,fontSize:11}}>{value}{max===100?'%':''}</span>
  </div>
);

/* ─── Main Component ─── */
export default function MaritimeImoCompliancePage(){
  const [tab,setTab]=useState(0);
  const tabs=['Fleet CII Dashboard','IMO 2023 Pathway Tracker','Alternative Fuel Explorer','Poseidon Principles & Finance'];

  const vessels=useMemo(()=>genVessels(),[]);

  /* Tab 1 state */
  const [filterType,setFilterType]=useState('All');
  const [filterGrade,setFilterGrade]=useState('All');
  const [filterCompany,setFilterCompany]=useState('All');
  const [filterEEXI,setFilterEEXI]=useState('All');
  const [filterFlag,setFilterFlag]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [sortCol,setSortCol]=useState('name');
  const [sortDir,setSortDir]=useState(1);
  const [page,setPage]=useState(0);
  const [drawerVessel,setDrawerVessel]=useState(null);
  const [vesselNotes,setVesselNotes]=useState({});
  const [flagged,setFlagged]=useState({});
  const [drawerTab,setDrawerTab]=useState(0);

  /* Tab 2 state */
  const [scenario,setScenario]=useState('ambition');
  const [yearHorizon,setYearHorizon]=useState(2050);
  const [expandedCompany,setExpandedCompany]=useState(null);
  const [showAllMilestones,setShowAllMilestones]=useState(false);
  const [companySearch,setCompanySearch]=useState('');

  /* Tab 3 state */
  const [selectedFuels,setSelectedFuels]=useState([0,1,2]);
  const [simVessels,setSimVessels]=useState([]);
  const [simFuel,setSimFuel]=useState(0);
  const [fuelPriceAdj,setFuelPriceAdj]=useState(100);
  const [carbonPrice,setCarbonPrice]=useState(50);
  const [fuelPortView,setFuelPortView]=useState(0);
  const [simVesselSearch,setSimVesselSearch]=useState('');
  const [fuelDetailIdx,setFuelDetailIdx]=useState(null);
  const [showFleetCalc,setShowFleetCalc]=useState(false);

  /* Tab 4 state */
  const [loanSort,setLoanSort]=useState('borrower');
  const [loanDir,setLoanDir]=useState(1);
  const [loanExpanded,setLoanExpanded]=useState(null);
  const [loanScenario,setLoanScenario]=useState('ambition');
  const [loanSearch,setLoanSearch]=useState('');
  const [showLeague,setShowLeague]=useState(true);
  const [covenantFilter,setCovenantFilter]=useState('All');

  /* Tab 1 computed */
  const filtered=useMemo(()=>{
    let v=[...vessels];
    if(filterType!=='All')v=v.filter(x=>x.type===filterType);
    if(filterGrade!=='All')v=v.filter(x=>x.ciiGrade===filterGrade);
    if(filterCompany!=='All')v=v.filter(x=>x.company===filterCompany);
    if(filterEEXI!=='All')v=v.filter(x=>filterEEXI==='Yes'?x.eexiCompliant:!x.eexiCompliant);
    if(filterFlag!=='All')v=v.filter(x=>x.flag===filterFlag);
    if(searchTerm)v=v.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase())||String(x.imo).includes(searchTerm));
    v.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];
      if(typeof av==='string')return av.localeCompare(bv)*sortDir;
      return(av-bv)*sortDir;});
    return v;
  },[vessels,filterType,filterGrade,filterCompany,filterEEXI,filterFlag,searchTerm,sortCol,sortDir]);

  const pageCount=Math.ceil(filtered.length/25);
  const pageData=filtered.slice(page*25,(page+1)*25);

  const fleetStats=useMemo(()=>{
    const avg={'A':5,'B':4,'C':3,'D':2,'E':1};
    const total=vessels.length;
    const sumCII=vessels.reduce((a,v)=>a+avg[v.ciiGrade],0);
    const acRate=vessels.filter(v=>['A','B','C'].includes(v.ciiGrade)).length/total*100;
    const eexiRate=vessels.filter(v=>v.eexiCompliant).length/total*100;
    const totalEmissions=vessels.reduce((a,v)=>a+v.annualEmissions,0);
    const gradeDist=CII_GRADES.map(g=>({grade:g,count:vessels.filter(v=>v.ciiGrade===g).length,color:CII_COLORS[g]}));
    const typeDist=SHIP_TYPES.map(t=>({type:t,count:vessels.filter(v=>v.type===t).length}));
    const flagDist=FLAG_STATES.map(f=>({flag:f,count:vessels.filter(v=>v.flag===f).length}));
    return{avgCII:(sumCII/total).toFixed(1),acRate:acRate.toFixed(0),eexiRate:eexiRate.toFixed(0),
      totalEmissions,gradeDist,typeDist,flagDist,flaggedCount:Object.values(flagged).filter(Boolean).length};
  },[vessels,flagged]);

  const companyComparison=useMemo(()=>COMPANIES.map(c=>{
    const cv=vessels.filter(v=>v.company===c.name);
    if(!cv.length)return null;
    const avg={'A':5,'B':4,'C':3,'D':2,'E':1};
    const score=cv.reduce((a,v)=>a+avg[v.ciiGrade],0)/cv.length;
    return{name:c.name.length>14?c.name.slice(0,14)+'..':c.name,fullName:c.name,score:parseFloat(score.toFixed(2)),fleet:cv.length};
  }).filter(Boolean),[vessels]);

  const handleSort=useCallback((col)=>{
    if(sortCol===col)setSortDir(d=>d*-1);else{setSortCol(col);setSortDir(1);}
    setPage(0);
  },[sortCol]);

  const toggleFuel=useCallback((idx)=>{
    setSelectedFuels(prev=>prev.includes(idx)?prev.filter(x=>x!==idx):[...prev,idx]);
  },[]);

  const fuelPriceProjections=useMemo(()=>QUARTERS.map((q,qi)=>({
    q,...FUELS.reduce((a,f,fi)=>({...a,[f.name]:Math.round(f.cost*(0.85+sr(fi*131+qi*17)*0.35)*(fuelPriceAdj/100))}),{})
  })),[fuelPriceAdj]);

  const simResults=useMemo(()=>{
    if(!simVessels.length)return null;
    const fuel=FUELS[simFuel];
    const selected=simVessels.map(id=>vessels.find(v=>v.id===id)).filter(Boolean);
    const totalConvCost=selected.reduce((a,v)=>a+v.retrofitCost*(fuel.cost/60),0);
    const totalEmRed=selected.reduce((a,v)=>a+v.co2Reduction*(fuel.emReduction/50),0)/selected.length;
    const annualSavings=selected.reduce((a,v)=>a+v.fuelSavings*10000*(fuelPriceAdj/100),0)+carbonPrice*100*selected.length;
    const payback=annualSavings>0?totalConvCost/annualSavings:99;
    const strandedRisk=fuel.infraReady<30?'High':fuel.infraReady<60?'Medium':'Low';
    return{totalConvCost,totalEmRed:totalEmRed.toFixed(0),payback:payback.toFixed(1),
      strandedRisk,count:selected.length,fuelName:fuel.name,annualSavings};
  },[simVessels,simFuel,vessels,fuelPriceAdj,carbonPrice]);

  const fleetConvTotal=useMemo(()=>{
    const fuel=FUELS[simFuel];
    return{total:vessels.reduce((a,v)=>a+v.retrofitCost*(fuel.cost/60),0),
      avgEmRed:vessels.reduce((a,v)=>a+v.co2Reduction*(fuel.emReduction/50),0)/vessels.length};
  },[vessels,simFuel]);

  const portFuelData=useMemo(()=>PORTS.map((p,pi)=>({
    port:p,...FUELS.reduce((a,f,fi)=>({...a,[f.name]:Math.round(sr(pi*137+fi*23)*100)}),{})
  })),[]);

  const companyAlignments=useMemo(()=>{
    let ca=COMPANIES.map((c,ci)=>{
      const cv=vessels.filter(v=>v.company===c.name);
      if(!cv.length)return null;
      const currentEm=cv.reduce((a,v)=>a+v.aer,0)/cv.length;
      const target2030=currentEm*0.8;const target2040=currentEm*0.3;
      const gap2030=Math.max(0,currentEm-target2030);const gap2040=Math.max(0,currentEm-target2040);
      const aligned=gap2030<2;
      const techNeeds=SHIP_TYPES.slice(0,Math.floor(sr(ci*149)*4)+2).map((t,ti)=>({
        type:t,fuel:FUELS[Math.floor(sr(ci*151+ti*7)*10)].name,
        by:2028+Math.floor(sr(ci*153+ti*11)*8)}));
      return{...c,currentEm:currentEm.toFixed(1),target2030:target2030.toFixed(1),
        target2040:target2040.toFixed(1),gap2030:gap2030.toFixed(1),gap2040:gap2040.toFixed(1),
        aligned,fleetCount:cv.length,techNeeds};
    }).filter(Boolean);
    if(companySearch)ca=ca.filter(c=>c.name.toLowerCase().includes(companySearch.toLowerCase()));
    return ca;
  },[vessels,companySearch]);

  const milestones=[
    {label:'IMO MEPC 80 adopted 2023 GHG Strategy',date:'Jul 2023',done:true,detail:'Revised strategy adopted with enhanced ambition levels'},
    {label:'CII Regulations entered into force',date:'Jan 2023',done:true,detail:'Annual operational CII rating required for all ships >5000 GT'},
    {label:'EEXI technical file required',date:'Jan 2023',done:true,detail:'One-time certification for energy efficiency design'},
    {label:'FuelEU Maritime regulation adopted',date:'Jul 2023',done:true,detail:'GHG intensity targets for energy used on-board'},
    {label:'Mid-term GHG measures basket adoption',date:'2025',done:false,detail:'Technical element (goal-based fuel standard) + economic element (GHG pricing)'},
    {label:'FuelEU Maritime Phase 1 enforcement',date:'Jan 2025',done:false,detail:'-2% GHG intensity vs 2020 reference value'},
    {label:'-20% GHG vs 2008 levels',date:'2030',done:false,detail:'First checkpoint: striving for -30%'},
    {label:'FuelEU Phase 2: -6% intensity',date:'2030',done:false,detail:'Increasing stringency with sub-target for RFNBOs'},
    {label:'-70% GHG vs 2008 levels',date:'2040',done:false,detail:'Second checkpoint: striving for -80%'},
    {label:'FuelEU Phase 4: -80% intensity',date:'2050',done:false,detail:'Full decarbonisation of maritime energy'},
    {label:'Net-zero / close to zero GHG',date:'~2050',done:false,detail:'Complete sector decarbonisation by or around 2050'},
  ];
  const visibleMilestones=showAllMilestones?milestones:milestones.slice(0,7);

  const sortedLoans=useMemo(()=>{
    let l=[...LOANS];
    if(loanSearch)l=l.filter(x=>x.borrower.toLowerCase().includes(loanSearch.toLowerCase())||x.facility.toLowerCase().includes(loanSearch.toLowerCase()));
    if(covenantFilter!=='All')l=l.filter(x=>covenantFilter==='Breached'?x.breached:!x.breached);
    l.sort((a,b)=>{const av=a[loanSort],bv=b[loanSort];
      if(typeof av==='string')return av.localeCompare(bv)*loanDir;return(av-bv)*loanDir;});
    return l;
  },[loanSort,loanDir,loanSearch,covenantFilter]);

  const lenderLeague=useMemo(()=>{
    const lenders=['DNB Markets','ING Group','ABN AMRO','Nordea','SEB',
      'Credit Agricole','BNP Paribas','Citi Marine','HSBC Shipping','Deutsche Bank'];
    return lenders.map((l,i)=>({name:l,aum:Math.floor(sr(i*157)*3000+500),
      avgAlign:Math.floor(sr(i*163)*35+45),loans:Math.floor(sr(i*167)*8)+2,
      greenShare:Math.floor(sr(i*173)*40+10),
      poseidonSignatory:sr(i*179)>0.3,
      totalExposure:Math.floor(sr(i*181)*800+200)})).sort((a,b)=>b.avgAlign-a.avgAlign);
  },[]);

  const portfolioStats=useMemo(()=>{
    const total=LOANS.reduce((a,l)=>a+l.amount,0);
    const aligned=LOANS.filter(l=>l.alignment>=60);
    const avgPD=(LOANS.reduce((a,l)=>a+parseFloat(l.pd),0)/LOANS.length).toFixed(2);
    return{total,alignedPct:Math.round(aligned.length/LOANS.length*100),avgPD,
      breachCount:LOANS.filter(l=>l.breached).length,
      fuelEUPct:Math.round(LOANS.filter(l=>l.fuelEUCompliant).length/LOANS.length*100)};
  },[]);

  const exportCSV=useCallback(()=>{
    const headers=['Borrower','Facility','Amount_M','Alignment','PD','CII_Covenant','Breached','FuelEU','Maturity','Lender','Collateral_M','Interest_Rate','Drawdown_M'];
    const rows=LOANS.map(l=>[l.borrower,l.facility,l.amount,l.alignment,l.pd,l.ciiCovenant,l.breached,l.fuelEUCompliant,l.maturity,l.lender,l.collateral,l.interestRate,l.drawdown].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='poseidon_principles_report.csv';a.click();URL.revokeObjectURL(url);
  },[]);

  const sty={
    page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24},
    h1:{fontSize:28,fontWeight:700,color:T.navy,margin:0},
    sub:{fontSize:13,color:T.textSec,marginTop:4},
    tabBar:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginTop:20,marginBottom:20},
    tabBtn:(active)=>({padding:'10px 20px',fontSize:13,fontWeight:active?700:500,color:active?T.navy:T.textSec,
      background:'none',border:'none',borderBottom:active?`3px solid ${T.navy}`:'3px solid transparent',
      cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}),
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16},
    filterRow:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'},
    select:{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,cursor:'pointer'},
    input:{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.surface,outline:'none'},
    th:(col)=>({padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',cursor:'pointer',
      borderBottom:`2px solid ${T.border}`,background:sortCol===col?T.surfaceH:'transparent',
      fontFamily:T.font,userSelect:'none',whiteSpace:'nowrap'}),
    td:{padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},
    btn:(primary)=>({padding:'8px 16px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,
      background:primary?T.navy:T.surface,color:primary?T.surface:T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
    btnSm:(primary)=>({padding:'4px 10px',borderRadius:6,border:primary?'none':`1px solid ${T.border}`,
      background:primary?T.navy:T.surface,color:primary?T.surface:T.text,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
    drawer:{position:'fixed',top:0,right:0,width:520,height:'100vh',background:T.surface,
      borderLeft:`2px solid ${T.border}`,zIndex:1000,overflowY:'auto',padding:24,
      boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},
    overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},
    slider:{width:'100%',accentColor:T.navy},
    chip:(active)=>({padding:'4px 12px',borderRadius:16,fontSize:11,fontWeight:active?700:500,
      border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:T.surface,
      color:active?T.surface:T.text,cursor:'pointer',fontFamily:T.font}),
  };

  return(
    <div style={sty.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h1 style={sty.h1}>Maritime IMO Compliance & Shipping Decarbonisation</h1>
          <p style={sty.sub}>EP-AN1 -- IMO 2023 GHG Strategy | CII Ratings | EEXI | FuelEU Maritime | Poseidon Principles</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Badge text={`${Object.values(flagged).filter(Boolean).length} Flagged`} bg={T.amber}/>
          <Badge text="150 Vessels" bg={T.navy}/>
          <Badge text="20 Companies" bg={T.sage}/>
        </div>
      </div>

      <div style={sty.tabBar}>
        {tabs.map((t,i)=><button key={i} style={sty.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {/* ═══════════════ TAB 1: Fleet CII Dashboard ═══════════════ */}
      {tab===0&&(
        <div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
            <KPI label="Fleet Avg CII Score" value={fleetStats.avgCII} sub="5.0=A, 1.0=E" color={T.navy}/>
            <KPI label="A-C Rated Vessels" value={`${fleetStats.acRate}%`} sub={`${Math.round(vessels.length*fleetStats.acRate/100)} of ${vessels.length}`} color={T.green}/>
            <KPI label="EEXI Compliance" value={`${fleetStats.eexiRate}%`} sub="Technical energy efficiency" color={T.sage}/>
            <KPI label="Fleet Emissions" value={`${(fleetStats.totalEmissions/1e6).toFixed(2)} Mt`} sub="Annual CO2 equivalent" color={T.amber}/>
            <KPI label="Flagged Vessels" value={fleetStats.flaggedCount} sub="Intervention required" color={T.red}/>
          </div>

          <div style={{display:'flex',gap:16,marginBottom:20}}>
            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>CII Grade Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={fleetStats.gradeDist} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                    label={({grade,count})=>`${grade}: ${count}`}>
                    {fleetStats.gradeDist.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>[v,'Vessels']}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fleet by Ship Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fleetStats.typeDist} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" fontSize={10}/>
                  <YAxis type="category" dataKey="type" fontSize={9} width={85}/>
                  <Tooltip/>
                  <Bar dataKey="count" fill={T.navyL} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{...sty.card,flex:1.5}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Company Fleet CII Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={companyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" fontSize={8} angle={-35} textAnchor="end" height={65}/>
                  <YAxis domain={[0,5]} fontSize={10} ticks={[1,2,3,4,5]} tickFormatter={v=>({1:'E',2:'D',3:'C',4:'B',5:'A'}[v]||v)}/>
                  <Tooltip formatter={(v)=>[v.toFixed(2),'Avg CII Score']}/>
                  <Bar dataKey="score" radius={[4,4,0,0]}>
                    {companyComparison.map((d,i)=><Cell key={i} fill={d.score>=4?T.green:d.score>=3?T.amber:T.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.filterRow}>
              <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>Filters:</span>
              <input style={{...sty.input,width:160}} placeholder="Search vessel / IMO..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}}/>
              <select style={sty.select} value={filterType} onChange={e=>{setFilterType(e.target.value);setPage(0);}}>
                <option value="All">All Types</option>
                {SHIP_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select style={sty.select} value={filterGrade} onChange={e=>{setFilterGrade(e.target.value);setPage(0);}}>
                <option value="All">All Grades</option>
                {CII_GRADES.map(g=><option key={g} value={g}>Grade {g}</option>)}
              </select>
              <select style={sty.select} value={filterCompany} onChange={e=>{setFilterCompany(e.target.value);setPage(0);}}>
                <option value="All">All Companies</option>
                {COMPANIES.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select style={sty.select} value={filterEEXI} onChange={e=>{setFilterEEXI(e.target.value);setPage(0);}}>
                <option value="All">EEXI: All</option>
                <option value="Yes">Compliant</option>
                <option value="No">Non-Compliant</option>
              </select>
              <select style={sty.select} value={filterFlag} onChange={e=>{setFilterFlag(e.target.value);setPage(0);}}>
                <option value="All">All Flags</option>
                {FLAG_STATES.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
              <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} vessels</span>
            </div>

            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    {[['name','Vessel Name'],['imo','IMO #'],['type','Type'],['dwt','DWT'],['company','Company'],
                      ['ciiGrade','CII'],['eexiCompliant','EEXI'],['aer','AER'],['flag','Flag'],['built','Built']].map(([col,label])=>(
                      <th key={col} style={sty.th(col)} onClick={()=>handleSort(col)}>
                        {label}{sortCol===col?(sortDir===1?' \u25B2':' \u25BC'):''}
                      </th>
                    ))}
                    <th style={{...sty.th(''),cursor:'default'}}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(v=>(
                    <tr key={v.id} onClick={()=>{setDrawerVessel(v);setDrawerTab(0);}}
                      style={{cursor:'pointer',background:flagged[v.id]?'#fef3c7':'transparent',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=flagged[v.id]?'#fde68a':T.surfaceH}
                      onMouseLeave={e=>e.currentTarget.style.background=flagged[v.id]?'#fef3c7':'transparent'}>
                      <td style={sty.td}><span style={{fontWeight:600}}>{v.name}</span>{flagged[v.id]&&<span style={{color:T.amber,marginLeft:4}} title="Flagged">&#9873;</span>}</td>
                      <td style={{...sty.td,fontFamily:T.mono,fontSize:11}}>{v.imo}</td>
                      <td style={sty.td}>{v.type}</td>
                      <td style={{...sty.td,fontFamily:T.mono}}>{v.dwt.toLocaleString()}</td>
                      <td style={sty.td}>{v.company}</td>
                      <td style={sty.td}><Badge text={v.ciiGrade} bg={CII_COLORS[v.ciiGrade]}/></td>
                      <td style={sty.td}><Badge text={v.eexiCompliant?'Yes':'No'} bg={v.eexiCompliant?T.green:T.red}/></td>
                      <td style={{...sty.td,fontFamily:T.mono}}>{v.aer}</td>
                      <td style={{...sty.td,fontSize:11}}>{v.flag}</td>
                      <td style={{...sty.td,fontFamily:T.mono}}>{v.built}</td>
                      <td style={sty.td}>
                        <svg width={60} height={20}>{v.ciiHistory.slice(-6).map((h,hi,arr)=>{
                          const x=hi*(60/5);const vals={'A':2,'B':6,'C':10,'D':14,'E':18};const y=vals[h.grade];
                          return hi>0?<line key={hi} x1={(hi-1)*(60/5)} y1={vals[arr[hi-1].grade]} x2={x} y2={y}
                            stroke={CII_COLORS[h.grade]} strokeWidth={1.5}/>:null;
                        })}</svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
              <span style={{fontSize:11,color:T.textMut}}>Page {page+1} of {pageCount} ({filtered.length} results)</span>
              <div style={{display:'flex',gap:4}}>
                <button style={sty.btnSm(false)} disabled={page===0} onClick={()=>setPage(0)}>First</button>
                <button style={sty.btnSm(false)} disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</button>
                {Array.from({length:Math.min(pageCount,7)},(_,i)=>{
                  const p=pageCount<=7?i:page<3?i:page>pageCount-4?pageCount-7+i:page-3+i;
                  return <button key={p} style={{...sty.btnSm(p===page),minWidth:28}} onClick={()=>setPage(p)}>{p+1}</button>;
                })}
                <button style={sty.btnSm(false)} disabled={page>=pageCount-1} onClick={()=>setPage(p=>p+1)}>Next</button>
                <button style={sty.btnSm(false)} disabled={page>=pageCount-1} onClick={()=>setPage(pageCount-1)}>Last</button>
              </div>
            </div>
          </div>

          {/* ── Vessel Side Drawer ── */}
          {drawerVessel&&(
            <>
              <div style={sty.overlay} onClick={()=>setDrawerVessel(null)}/>
              <div style={sty.drawer}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <h2 style={{fontSize:20,fontWeight:700,color:T.navy,margin:0}}>{drawerVessel.name}</h2>
                  <button onClick={()=>setDrawerVessel(null)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:T.textMut,fontWeight:700}}>&#215;</button>
                </div>

                <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:16}}>
                  {['Overview','CII History','Retrofit','Operations'].map((dt,di)=>(
                    <button key={di} style={{...sty.tabBtn(drawerTab===di),padding:'8px 14px',fontSize:12}} onClick={()=>setDrawerTab(di)}>{dt}</button>
                  ))}
                </div>

                {drawerTab===0&&(
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                      {[['IMO',drawerVessel.imo],['Type',drawerVessel.type],['DWT',drawerVessel.dwt.toLocaleString()],
                        ['Company',drawerVessel.company],['Flag',drawerVessel.flag],['Built',drawerVessel.built],
                        ['Speed',`${drawerVessel.speed} kn`],['Engine',drawerVessel.mainEngine],
                        ['Fuel',drawerVessel.fuelType],['Class',drawerVessel.classSociety],
                        ['Voyages/yr',drawerVessel.voyages],['Last Drydock',drawerVessel.lastDrydock],
                      ].map(([k,v],i)=>(
                        <div key={i} style={{fontSize:11,color:T.textMut}}>{k}: <span style={{fontFamily:typeof v==='number'?T.mono:T.font,color:T.text,fontWeight:500}}>{v}</span></div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8,marginBottom:16}}>
                      <div style={{flex:1,padding:10,borderRadius:8,background:CII_COLORS[drawerVessel.ciiGrade]+'18',textAlign:'center'}}>
                        <div style={{fontSize:10,color:T.textMut}}>CII Grade</div>
                        <div style={{fontSize:28,fontWeight:800,color:CII_COLORS[drawerVessel.ciiGrade]}}>{drawerVessel.ciiGrade}</div>
                      </div>
                      <div style={{flex:1,padding:10,borderRadius:8,background:drawerVessel.eexiCompliant?T.green+'18':T.red+'18',textAlign:'center'}}>
                        <div style={{fontSize:10,color:T.textMut}}>EEXI</div>
                        <div style={{fontSize:16,fontWeight:700,color:drawerVessel.eexiCompliant?T.green:T.red}}>{drawerVessel.eexiCompliant?'Compliant':'Non-Compliant'}</div>
                      </div>
                      <div style={{flex:1,padding:10,borderRadius:8,background:T.navy+'10',textAlign:'center'}}>
                        <div style={{fontSize:10,color:T.textMut}}>AER</div>
                        <div style={{fontSize:18,fontWeight:700,color:T.navy}}>{drawerVessel.aer}</div>
                        <div style={{fontSize:9,color:T.textMut}}>gCO2/dwt-nm</div>
                      </div>
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>EEXI Technical File Summary</div>
                    <div style={{padding:12,borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,marginBottom:16}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span>Required EEXI:</span><b>{(drawerVessel.aer*0.85).toFixed(1)} gCO2/dwt-nm</b>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span>Attained EEXI:</span><b>{drawerVessel.aer} gCO2/dwt-nm</b>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <span>Annual Emissions:</span><b>{drawerVessel.annualEmissions.toLocaleString()} tCO2</b>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab===1&&(
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>12-Quarter CII Rating & AER History</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={drawerVessel.ciiHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                        <XAxis dataKey="q" fontSize={9} angle={-30} textAnchor="end" height={45}/>
                        <YAxis dataKey="aer" fontSize={10} label={{value:'AER (gCO2/dwt-nm)',angle:-90,position:'insideLeft',fontSize:9}}/>
                        <Tooltip content={({active,payload})=>active&&payload?.[0]?(
                          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:8,fontSize:11}}>
                            <div><b>{payload[0].payload.q}</b></div>
                            <div>AER: {payload[0].payload.aer} gCO2/dwt-nm</div>
                            <div>Grade: <Badge text={payload[0].payload.grade} bg={CII_COLORS[payload[0].payload.grade]}/></div>
                          </div>
                        ):null}/>
                        <Line type="monotone" dataKey="aer" stroke={T.navy} strokeWidth={2} dot={{r:3,fill:T.navy}}/>
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:12}}>
                      {drawerVessel.ciiHistory.map((h,hi)=>(
                        <div key={hi} style={{padding:'3px 8px',borderRadius:6,background:CII_COLORS[h.grade]+'20',fontSize:10,textAlign:'center'}}>
                          <div style={{color:T.textMut}}>{h.q}</div>
                          <div style={{fontWeight:700,color:CII_COLORS[h.grade]}}>{h.grade}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {drawerTab===2&&(
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Speed Optimisation Potential</div>
                    <div style={{padding:12,borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,marginBottom:16}}>
                      <div>Current service speed: <b>{drawerVessel.speed} kn</b></div>
                      <div>Optimal slow-steam: <b>{Math.max(8,drawerVessel.speed-3)} kn</b></div>
                      <div>Estimated fuel saving: <b style={{color:T.green}}>{Math.floor(sr(drawerVessel.id*179)*12+8)}%</b></div>
                      <div>CII improvement: <b style={{color:T.green}}>{Math.floor(sr(drawerVessel.id*181)*8+3)}%</b></div>
                      <div>Revenue impact: <b style={{color:T.amber}}>-{Math.floor(sr(drawerVessel.id*183)*5+2)}%</b></div>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Retrofit Options (Cost / CO2 Reduction / Payback)</div>
                    {['Hull coating upgrade','Propeller boss cap fin','Air lubrication system','Waste heat recovery','Shaft generator','Wind rotor (Flettner)','Exhaust gas cleaning','LED lighting conversion'].map((r,ri)=>(
                      <div key={ri} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,marginBottom:6,fontSize:12}}>
                        <span style={{fontWeight:500}}>{r}</span>
                        <div style={{display:'flex',gap:12,fontSize:11}}>
                          <span style={{fontFamily:T.mono}}>${(sr(drawerVessel.id*187+ri*13)*3+0.5).toFixed(1)}M</span>
                          <Badge text={`${Math.floor(sr(drawerVessel.id*191+ri*17)*8+2)}% CO2`} bg={T.green}/>
                          <span style={{color:T.textMut}}>{(sr(drawerVessel.id*193+ri*19)*4+1).toFixed(1)}yr</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {drawerTab===3&&(
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Operational Summary</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                      {[['Annual Voyages',drawerVessel.voyages],['Days at Sea',Math.floor(drawerVessel.voyages*7.5)],
                        ['Fuel Consumption',`${Math.floor(drawerVessel.annualEmissions*0.32).toLocaleString()} t/yr`],
                        ['Port Calls',Math.floor(drawerVessel.voyages*2.1)],
                        ['Avg Speed',`${drawerVessel.speed} kn`],['Utilization',`${Math.floor(sr(drawerVessel.id*197)*20+70)}%`],
                      ].map(([k,v],idx)=>(
                        <div key={idx} style={{padding:8,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11}}>
                          <div style={{color:T.textMut}}>{k}</div>
                          <div style={{fontWeight:700,color:T.navy,fontFamily:T.mono}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{display:'flex',gap:8,marginTop:16,borderTop:`1px solid ${T.border}`,paddingTop:16}}>
                  <button style={sty.btn(!flagged[drawerVessel.id])} onClick={()=>setFlagged(p=>({...p,[drawerVessel.id]:!p[drawerVessel.id]}))}>
                    {flagged[drawerVessel.id]?'Remove Flag':'Flag for Intervention'}
                  </button>
                </div>
                <div style={{marginTop:12}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Notes</div>
                  <textarea value={vesselNotes[drawerVessel.id]||''} onChange={e=>setVesselNotes(p=>({...p,[drawerVessel.id]:e.target.value}))}
                    placeholder="Add vessel notes, observations, action items..."
                    style={{width:'100%',minHeight:80,padding:8,borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12,resize:'vertical',boxSizing:'border-box'}}/>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: IMO 2023 Pathway Tracker ═══════════════ */}
      {tab===1&&(
        <div>
          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:T.navy}}>IMO GHG Reduction Pathway (2020-2050)</div>
              <div style={{display:'flex',gap:8}}>
                {[['ambition','IMO Ambition'],['wb2','Well-Below 2\u00B0C'],['bau','Business-as-Usual']].map(([k,l])=>(
                  <button key={k} style={sty.chip(scenario===k)} onClick={()=>setScenario(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
              <label style={{fontSize:11,color:T.textMut}}>Year Horizon:</label>
              <input type="range" min={2025} max={2050} value={yearHorizon} onChange={e=>setYearHorizon(Number(e.target.value))} style={{...sty.slider,width:300}}/>
              <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy}}>{yearHorizon}</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={IMO_PATHWAY.filter(d=>d.year<=yearHorizon)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="year" fontSize={11}/>
                <YAxis domain={[0,100]} fontSize={10} label={{value:'% of 2008 baseline',angle:-90,position:'insideLeft',fontSize:10}}/>
                <Tooltip/>
                <Legend/>
                {scenario==='ambition'&&<Area type="monotone" dataKey="ambition" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="IMO Ambition" strokeWidth={2}/>}
                {scenario==='wb2'&&<Area type="monotone" dataKey="wb2" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="Well-Below 2\u00B0C" strokeWidth={2}/>}
                {scenario==='bau'&&<Area type="monotone" dataKey="bau" stroke={T.red} fill={T.red} fillOpacity={0.15} name="Business-as-Usual" strokeWidth={2}/>}
              </AreaChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
              <div style={{padding:'8px 14px',borderRadius:8,background:'#fef3c7',fontSize:12,color:T.amber,fontWeight:600}}>2030: -20% GHG (striving for -30%)</div>
              <div style={{padding:'8px 14px',borderRadius:8,background:'#fce7f3',fontSize:12,color:'#be185d',fontWeight:600}}>2040: -70% GHG (striving for -80%)</div>
              <div style={{padding:'8px 14px',borderRadius:8,background:'#dbeafe',fontSize:12,color:'#1d4ed8',fontWeight:600}}>~2050: Net-Zero Emissions</div>
              <div style={{padding:'8px 14px',borderRadius:8,background:'#f0fdf4',fontSize:12,color:T.green,fontWeight:600}}>FuelEU: -2% (2025) to -80% (2050)</div>
            </div>
          </div>

          <div style={{display:'flex',gap:16}}>
            <div style={{...sty.card,flex:2}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Per-Company Alignment & Gap Analysis</div>
                <input style={{...sty.input,width:180}} placeholder="Search company..." value={companySearch} onChange={e=>setCompanySearch(e.target.value)}/>
              </div>
              <div style={{overflowX:'auto',maxHeight:450,overflowY:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr>
                      {['Company','HQ','Fleet','Current AER','2030 Target','Gap 2030','2040 Target','Gap 2040','Status'].map(h=>(
                        <th key={h} style={{padding:'6px 10px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',position:'sticky',top:0,background:T.surface}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companyAlignments.map((c,i)=>(
                      <React.Fragment key={i}>
                        <tr onClick={()=>setExpandedCompany(expandedCompany===i?null:i)}
                          style={{cursor:'pointer',background:expandedCompany===i?T.surfaceH:'transparent'}}>
                          <td style={sty.td}><span style={{fontWeight:600}}>{c.name}</span></td>
                          <td style={{...sty.td,fontSize:11}}>{c.hq}</td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{c.fleetCount}</td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{c.currentEm}</td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{c.target2030}</td>
                          <td style={sty.td}><span style={{color:parseFloat(c.gap2030)>2?T.red:T.green,fontWeight:600,fontFamily:T.mono}}>{c.gap2030}</span></td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{c.target2040}</td>
                          <td style={sty.td}><span style={{color:parseFloat(c.gap2040)>5?T.red:T.amber,fontWeight:600,fontFamily:T.mono}}>{c.gap2040}</span></td>
                          <td style={sty.td}><Badge text={c.aligned?'On Track':'Off Track'} bg={c.aligned?T.green:T.red}/></td>
                        </tr>
                        {expandedCompany===i&&(
                          <tr>
                            <td colSpan={9} style={{padding:16,background:T.surfaceH}}>
                              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Technology Roadmap by Ship Type</div>
                              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                                {c.techNeeds.map((tn,ti)=>(
                                  <div key={ti} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,fontSize:11}}>
                                    <div style={{fontWeight:700,marginBottom:2}}>{tn.type}</div>
                                    <div style={{color:T.textSec}}>Fuel: <b>{tn.fuel}</b></div>
                                    <div style={{color:T.textSec}}>Target: <b>{tn.by}</b></div>
                                  </div>
                                ))}
                              </div>
                              <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Recommended Actions</div>
                              <ul style={{margin:0,paddingLeft:16,fontSize:12,color:T.textSec}}>
                                <li>Prioritise {c.techNeeds[0]?.fuel||'LNG'} conversion for largest tonnage vessels</li>
                                <li>Implement slow-steaming across fleet to close {c.gap2030} AER gap by 2030</li>
                                <li>Engage with {c.techNeeds.length>1?c.techNeeds[1].fuel:'ammonia'} bunkering infrastructure for 2040 compliance</li>
                                <li>Consider carbon offset procurement for transitional period</li>
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{...sty.card,flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Regulatory Milestones</div>
                <button style={sty.btnSm(false)} onClick={()=>setShowAllMilestones(p=>!p)}>{showAllMilestones?'Show Less':'Show All'}</button>
              </div>
              {visibleMilestones.map((m,i)=>(
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 0',borderBottom:i<visibleMilestones.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${m.done?T.green:T.border}`,background:m.done?T.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                    {m.done&&<span style={{color:'#fff',fontSize:12,fontWeight:700}}>&#10003;</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:m.done?T.textMut:T.text,textDecoration:m.done?'line-through':'none'}}>{m.label}</div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:1}}>{m.date}</div>
                    <div style={{fontSize:10,color:T.textSec,marginTop:2}}>{m.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 3: Alternative Fuel Explorer ═══════════════ */}
      {tab===2&&(
        <div>
          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fuel Comparison Radar</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                {FUELS.map((f,i)=>(
                  <button key={i} style={{...sty.chip(selectedFuels.includes(i)),borderColor:selectedFuels.includes(i)?f.color:T.border,
                    background:selectedFuels.includes(i)?f.color:'transparent',
                    color:selectedFuels.includes(i)?'#fff':T.text}} onClick={()=>toggleFuel(i)}>{f.name}</button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[{axis:'Cost Efficiency',key:'cost'},{axis:'Availability',key:'availability'},
                  {axis:'Emissions Reduction',key:'emReduction'},{axis:'Infrastructure',key:'infraReady'},
                  {axis:'Safety',key:'safety'},{axis:'Scalability',key:'scalability'}].map(d=>({
                  ...d,...FUELS.reduce((a,f)=>({...a,[f.name]:f[d.key]}),{})}))}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="axis" fontSize={10}/>
                  <PolarRadiusAxis domain={[0,100]} fontSize={9}/>
                  {selectedFuels.map(fi=>(
                    <Radar key={fi} name={FUELS[fi].name} dataKey={FUELS[fi].name} stroke={FUELS[fi].color} fill={FUELS[fi].color} fillOpacity={0.08} strokeWidth={2}/>
                  ))}
                  <Legend/><Tooltip/>
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fuel Price Projections (12Q)</div>
              <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                <label style={{fontSize:11,color:T.textMut}}>Price Adj:</label>
                <input type="range" min={50} max={200} value={fuelPriceAdj} onChange={e=>setFuelPriceAdj(Number(e.target.value))} style={{...sty.slider,width:180}}/>
                <span style={{fontFamily:T.mono,fontSize:12,fontWeight:600}}>{fuelPriceAdj}%</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={fuelPriceProjections}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="q" fontSize={9} angle={-30} textAnchor="end" height={45}/>
                  <YAxis fontSize={10} label={{value:'$/MWh',angle:-90,position:'insideLeft',fontSize:10}}/>
                  <Tooltip/><Legend/>
                  {selectedFuels.map(fi=>(
                    <Line key={fi} type="monotone" dataKey={FUELS[fi].name} stroke={FUELS[fi].color} strokeWidth={2} dot={false}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fuel Detail Cards */}
          <div style={sty.card}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Fuel Technology Cards (click to expand)</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
              {FUELS.map((f,fi)=>(
                <div key={fi} onClick={()=>setFuelDetailIdx(fuelDetailIdx===fi?null:fi)}
                  style={{padding:12,borderRadius:10,border:`2px solid ${fuelDetailIdx===fi?f.color:T.border}`,cursor:'pointer',
                    background:fuelDetailIdx===fi?f.color+'10':T.surface,transition:'all 0.2s'}}>
                  <div style={{fontSize:12,fontWeight:700,color:f.color,marginBottom:4}}>{f.name}</div>
                  <div style={{fontSize:10,color:T.textMut}}>Emissions: -{f.emReduction}%</div>
                  <div style={{fontSize:10,color:T.textMut}}>Readiness: {f.infraReady}%</div>
                  <div style={{fontSize:10,color:T.textMut}}>Cost idx: {f.cost}</div>
                </div>
              ))}
            </div>
            {fuelDetailIdx!==null&&(
              <div style={{marginTop:12,padding:16,borderRadius:10,border:`1px solid ${FUELS[fuelDetailIdx].color}40`,background:FUELS[fuelDetailIdx].color+'08'}}>
                <div style={{fontSize:14,fontWeight:700,color:FUELS[fuelDetailIdx].color,marginBottom:8}}>{FUELS[fuelDetailIdx].name} -- Detailed Profile</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {[['Cost Index',FUELS[fuelDetailIdx].cost],['Availability',FUELS[fuelDetailIdx].availability+'%'],['Emissions Reduction',FUELS[fuelDetailIdx].emReduction+'%'],
                    ['Infrastructure Readiness',FUELS[fuelDetailIdx].infraReady+'%'],['Safety Score',FUELS[fuelDetailIdx].safety],['Scalability',FUELS[fuelDetailIdx].scalability+'%']].map(([k,v],i)=>(
                    <div key={i} style={{fontSize:12}}>
                      <span style={{color:T.textMut}}>{k}: </span><b>{v}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:T.navy}}>Fleet Conversion Simulator</div>
              <button style={sty.btn(false)} onClick={()=>setShowFleetCalc(p=>!p)}>
                {showFleetCalc?'Hide':'Show'} Full Fleet Calculator
              </button>
            </div>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
              <div style={{flex:1,minWidth:280}}>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Select Vessels</div>
                <input style={{...sty.input,width:'100%',marginBottom:6}} placeholder="Filter vessels..."
                  value={simVesselSearch} onChange={e=>setSimVesselSearch(e.target.value)}/>
                <div style={{maxHeight:220,overflowY:'auto',border:`1px solid ${T.border}`,borderRadius:8,padding:4}}>
                  {vessels.filter(v=>!simVesselSearch||v.name.toLowerCase().includes(simVesselSearch.toLowerCase())).slice(0,60).map(v=>(
                    <div key={v.id} onClick={()=>setSimVessels(p=>p.includes(v.id)?p.filter(x=>x!==v.id):[...p,v.id])}
                      style={{padding:'4px 8px',fontSize:11,cursor:'pointer',borderRadius:4,
                        background:simVessels.includes(v.id)?T.navy+'15':'transparent',
                        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span>{simVessels.includes(v.id)?'\u2611':'\u2610'} {v.name}</span>
                      <span style={{color:T.textMut,fontSize:10}}>{v.type}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:4}}>{simVessels.length} selected
                  {simVessels.length>0&&<button style={{...sty.btnSm(false),marginLeft:8,padding:'2px 8px'}} onClick={()=>setSimVessels([])}>Clear</button>}
                </div>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:6}}>Configuration</div>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:2}}>Target Fuel</label>
                  <select style={{...sty.select,width:'100%'}} value={simFuel} onChange={e=>setSimFuel(Number(e.target.value))}>
                    {FUELS.map((f,i)=><option key={i} value={i}>{f.name} (Cost: {f.cost}, ER: -{f.emReduction}%)</option>)}
                  </select>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:11,color:T.textMut}}>Carbon Price: <b>${carbonPrice}/tCO2</b></label>
                  <input type="range" min={10} max={200} value={carbonPrice} onChange={e=>setCarbonPrice(Number(e.target.value))} style={sty.slider}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:T.textMut}}>Fuel Price Adj: <b>{fuelPriceAdj}%</b></label>
                  <input type="range" min={50} max={200} value={fuelPriceAdj} onChange={e=>setFuelPriceAdj(Number(e.target.value))} style={sty.slider}/>
                </div>
              </div>
              <div style={{flex:1,minWidth:220}}>
                {simResults?(
                  <div style={{background:T.surfaceH,borderRadius:10,padding:16}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:10}}>Simulation Results</div>
                    <div style={{display:'grid',gap:6,fontSize:12}}>
                      <div>Vessels Selected: <b>{simResults.count}</b></div>
                      <div>Target Fuel: <b style={{color:FUELS[simFuel].color}}>{simResults.fuelName}</b></div>
                      <div>Total Conversion Cost: <b style={{color:T.navy}}>${(simResults.totalConvCost/1e6).toFixed(1)}M</b></div>
                      <div>Avg Emissions Reduction: <b style={{color:T.green}}>{simResults.totalEmRed}%</b></div>
                      <div>Annual Savings: <b style={{color:T.sage}}>${(simResults.annualSavings/1e6).toFixed(2)}M</b></div>
                      <div>Payback Period: <b>{simResults.payback} years</b></div>
                      <div>Stranded Asset Risk: <Badge text={simResults.strandedRisk} bg={simResults.strandedRisk==='Low'?T.green:simResults.strandedRisk==='Medium'?T.amber:T.red}/></div>
                    </div>
                  </div>
                ):(
                  <div style={{background:T.surfaceH,borderRadius:10,padding:20,textAlign:'center',color:T.textMut,fontSize:12}}>
                    Select vessels and configure parameters to see conversion simulation results
                  </div>
                )}
              </div>
            </div>
            {showFleetCalc&&(
              <div style={{padding:16,borderRadius:10,border:`1px solid ${T.border}`,background:T.surfaceH}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Full Fleet Conversion Estimate ({FUELS[simFuel].name})</div>
                <div style={{display:'flex',gap:16}}>
                  <div style={{fontSize:12}}>Total Cost (all 150 vessels): <b style={{color:T.navy}}>${(fleetConvTotal.total/1e9).toFixed(2)}B</b></div>
                  <div style={{fontSize:12}}>Avg Fleet Emissions Reduction: <b style={{color:T.green}}>{fleetConvTotal.avgEmRed.toFixed(0)}%</b></div>
                  <div style={{fontSize:12}}>Cost per Vessel: <b>${(fleetConvTotal.total/150/1e6).toFixed(1)}M</b></div>
                </div>
              </div>
            )}
          </div>

          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Fuel Availability by Port (Readiness Score 0-100)</div>
              <select style={sty.select} value={fuelPortView} onChange={e=>setFuelPortView(Number(e.target.value))}>
                {FUELS.map((f,i)=><option key={i} value={i}>{f.name}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={portFuelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" domain={[0,100]} fontSize={10}/>
                <YAxis type="category" dataKey="port" fontSize={9} width={120}/>
                <Tooltip/><Legend/>
                <Bar dataKey={FUELS[fuelPortView].name} fill={FUELS[fuelPortView].color} radius={[0,4,4,0]} name={`${FUELS[fuelPortView].name} Readiness`}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 4: Poseidon Principles & Finance ═══════════════ */}
      {tab===3&&(
        <div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
            <KPI label="Total Exposure" value={`$${portfolioStats.total.toLocaleString()}M`} sub="20 shipping facilities" color={T.navy}/>
            <KPI label="Aligned (>60%)" value={`${portfolioStats.alignedPct}%`} sub="Poseidon Principles" color={T.sage}/>
            <KPI label="Avg PD" value={`${portfolioStats.avgPD}%`} sub="Climate-adjusted" color={T.navyL}/>
            <KPI label="Covenant Breaches" value={portfolioStats.breachCount} sub={`of ${LOANS.length} facilities`} color={T.red}/>
            <KPI label="FuelEU Compliant" value={`${portfolioStats.fuelEUPct}%`} sub="Fleet coverage" color={T.green}/>
          </div>

          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Portfolio Alignment Trajectory</div>
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                {[['ambition','IMO Ambition'],['wb2','Well-Below 2\u00B0C'],['bau','BAU']].map(([k,l])=>(
                  <button key={k} style={sty.chip(loanScenario===k)} onClick={()=>setLoanScenario(k)}>{l}</button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={Array.from({length:8},(_,i)=>({yr:2023+i,
                  portfolio:Math.min(100,Math.max(0,55+i*5.5+sr(i*197)*8)),
                  target:loanScenario==='ambition'?Math.round(100-i*7):loanScenario==='wb2'?Math.round(100-i*8.5):Math.round(100-i*2)}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="yr" fontSize={11}/><YAxis domain={[0,100]} fontSize={10}/>
                  <Tooltip/><Legend/>
                  <Area type="monotone" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.12} name="Portfolio Alignment" strokeWidth={2}/>
                  <Area type="monotone" dataKey="target" stroke={T.red} fill={T.red} fillOpacity={0.08} name="Required Pathway" strokeDasharray="5 5" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Climate-Adjusted PD vs Alignment</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="alignment" name="Alignment %" domain={[0,100]} fontSize={10} label={{value:'Poseidon Alignment %',position:'bottom',fontSize:10}}/>
                  <YAxis dataKey="pd" name="PD %" domain={[0,10]} fontSize={10} label={{value:'Probability of Default %',angle:-90,position:'insideLeft',fontSize:10}}/>
                  <Tooltip content={({active,payload})=>active&&payload?.[0]?(
                    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:8,fontSize:11}}>
                      <div style={{fontWeight:600}}>{payload[0].payload.borrower}</div>
                      <div>Alignment: {payload[0].payload.alignment}%</div>
                      <div>PD: {payload[0].payload.pd}%</div>
                    </div>
                  ):null}/>
                  <Scatter name="Loans" data={LOANS.map(l=>({alignment:l.alignment,pd:parseFloat(l.pd),borrower:l.borrower}))} fill={T.navyL}>
                    {LOANS.map((l,i)=><Cell key={i} fill={l.breached?T.red:parseFloat(l.pd)>5?T.amber:T.sage}/>)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Shipping Loan Portfolio -- Covenant Monitoring</div>
              <div style={{display:'flex',gap:8}}>
                <input style={{...sty.input,width:160}} placeholder="Search borrower..." value={loanSearch} onChange={e=>setLoanSearch(e.target.value)}/>
                <select style={sty.select} value={covenantFilter} onChange={e=>setCovenantFilter(e.target.value)}>
                  <option value="All">All Covenants</option>
                  <option value="Breached">Breached Only</option>
                  <option value="OK">No Breach</option>
                </select>
                <button style={sty.btn(true)} onClick={exportCSV}>Export Poseidon CSV</button>
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    {[['borrower','Borrower'],['facility','Facility'],['amount','Amt ($M)'],['alignment','Alignment'],['pd','PD %'],
                      ['ciiCovenant','CII Cov.'],['breached','Status'],['fuelEUCompliant','FuelEU'],['lender','Lender'],
                      ['maturity','Maturity'],['vessels','Vessels']].map(([col,label])=>(
                      <th key={col} style={{padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',
                        borderBottom:`2px solid ${T.border}`,cursor:'pointer',whiteSpace:'nowrap',
                        background:loanSort===col?T.surfaceH:'transparent'}}
                        onClick={()=>{if(loanSort===col)setLoanDir(d=>d*-1);else{setLoanSort(col);setLoanDir(1);}}}>
                        {label}{loanSort===col?(loanDir===1?' \u25B2':' \u25BC'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLoans.map((l,i)=>(
                    <React.Fragment key={i}>
                      <tr onClick={()=>setLoanExpanded(loanExpanded===i?null:i)}
                        style={{cursor:'pointer',background:l.breached?'#fef2f2':'transparent'}}
                        onMouseEnter={e=>e.currentTarget.style.background=l.breached?'#fee2e2':T.surfaceH}
                        onMouseLeave={e=>e.currentTarget.style.background=l.breached?'#fef2f2':'transparent'}>
                        <td style={sty.td}><span style={{fontWeight:600}}>{l.borrower}</span></td>
                        <td style={{...sty.td,fontFamily:T.mono,fontSize:11}}>{l.facility}</td>
                        <td style={{...sty.td,fontFamily:T.mono}}>{l.amount}</td>
                        <td style={sty.td}><ProgressBar value={l.alignment}/></td>
                        <td style={{...sty.td,fontFamily:T.mono,color:parseFloat(l.pd)>5?T.red:T.text}}>{l.pd}%</td>
                        <td style={sty.td}><Badge text={l.ciiCovenant} bg={CII_COLORS[l.ciiCovenant]}/></td>
                        <td style={sty.td}><Badge text={l.breached?'BREACH':'OK'} bg={l.breached?T.red:T.green}/></td>
                        <td style={sty.td}><Badge text={l.fuelEUCompliant?'Yes':'No'} bg={l.fuelEUCompliant?T.green:T.amber}/></td>
                        <td style={{...sty.td,fontSize:11}}>{l.lender}</td>
                        <td style={{...sty.td,fontFamily:T.mono}}>{l.maturity}</td>
                        <td style={{...sty.td,fontFamily:T.mono}}>{l.vessels}</td>
                      </tr>
                      {loanExpanded===i&&(
                        <tr>
                          <td colSpan={11} style={{padding:16,background:T.surfaceH}}>
                            <div style={{display:'flex',gap:16}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Facility Details</div>
                                <div style={{fontSize:12,display:'grid',gap:4}}>
                                  <div>Collateral: <b>${l.collateral}M</b></div>
                                  <div>Interest Rate: <b>{l.interestRate}%</b></div>
                                  <div>Drawdown: <b>${l.drawdown}M</b> / ${l.amount}M</div>
                                  <div>LTV: <b>{Math.round(l.drawdown/l.collateral*100)}%</b></div>
                                </div>
                              </div>
                              <div style={{flex:2}}>
                                <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Alignment Trajectory</div>
                                <ResponsiveContainer width="100%" height={140}>
                                  <LineChart data={l.trajectory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                                    <XAxis dataKey="yr" fontSize={10}/><YAxis domain={[0,100]} fontSize={10}/>
                                    <Tooltip/>
                                    <Line type="monotone" dataKey="score" stroke={T.navy} strokeWidth={2} dot={{r:3}}/>
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            {l.breached&&(
                              <div style={{marginTop:10,padding:'10px 14px',borderRadius:8,background:'#fef2f2',border:'1px solid #fecaca',fontSize:12,color:T.red}}>
                                <b>Covenant Breach Alert:</b> CII grade {l.ciiCovenant} covenant violated. Fleet average below required threshold.
                                Remediation plan required within 90 days. Potential margin step-up of 25bps if unresolved.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{display:'flex',gap:16}}>
            <div style={{...sty.card,flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>Lender League Table</div>
                <button style={sty.btnSm(false)} onClick={()=>setShowLeague(p=>!p)}>{showLeague?'Collapse':'Expand'}</button>
              </div>
              {showLeague&&(
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr>
                        {['#','Lender','AuM ($M)','Avg Align.','Loans','Green %','Poseidon','Exposure ($M)'].map(h=>(
                          <th key={h} style={{padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lenderLeague.map((l,i)=>(
                        <tr key={i} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{...sty.td,fontWeight:700,color:i<3?T.gold:T.text}}>{i+1}</td>
                          <td style={{...sty.td,fontWeight:600}}>{l.name}</td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{l.aum.toLocaleString()}</td>
                          <td style={sty.td}><ProgressBar value={l.avgAlign}/></td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{l.loans}</td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{l.greenShare}%</td>
                          <td style={sty.td}><Badge text={l.poseidonSignatory?'Signatory':'Non-Signatory'} bg={l.poseidonSignatory?T.sage:T.textMut}/></td>
                          <td style={{...sty.td,fontFamily:T.mono}}>{l.totalExposure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{...sty.card,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>FuelEU Maritime Compliance Summary</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    {name:'Compliant',value:LOANS.filter(l=>l.fuelEUCompliant).length,color:T.green},
                    {name:'Non-Compliant',value:LOANS.filter(l=>!l.fuelEUCompliant).length,color:T.red}
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                    label={({name,value})=>`${name}: ${value}`}>
                    <Cell fill={T.green}/><Cell fill={T.red}/>
                  </Pie>
                  <Tooltip/><Legend/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{marginTop:12,padding:12,borderRadius:8,background:T.surfaceH,fontSize:12}}>
                <div style={{fontWeight:600,color:T.navy,marginBottom:6}}>FuelEU Maritime Key Dates</div>
                <div>2025: -2% GHG intensity vs 2020 reference</div>
                <div>2030: -6% with RFNBO sub-target</div>
                <div>2035: -14.5% | 2040: -31% | 2045: -62%</div>
                <div>2050: -80% GHG intensity target</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}