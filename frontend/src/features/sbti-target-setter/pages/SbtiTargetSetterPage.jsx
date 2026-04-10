// EP-AI1 — SBTi Target Setter
// Route: /sbti-target-setter
// Framework: SBTi Criteria v5.1 + Net-Zero Standard + FLAG Guidance
// Reference: Science Based Targets initiative (2024)
import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Legend,ScatterChart,Scatter,ZAxis} from 'recharts';
import {SECTOR_BENCHMARKS,TEMPERATURE_PATHWAYS} from '../../../data/referenceData';
import {SECURITY_UNIVERSE} from '../../../data/securityUniverse';

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME + HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#059669';
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};
const PIECLRS=[ACCENT,T.navy,T.gold,T.sage,T.amber,T.green,T.red,'#0891b2','#be185d','#ea580c'];
const PAGE_SIZE=15;

const badge=(v,th)=>{const[lo,mid,hi]=th;const bg=v>=hi?'rgba(22,163,74,0.12)':v>=mid?'rgba(197,169,106,0.12)':v>=lo?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)';const c=v>=hi?T.green:v>=mid?T.gold:v>=lo?T.amber:T.red;return{background:bg,color:c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono};};
const statusBadge=(s)=>{const m={'Net-Zero Validated':{bg:'rgba(5,150,105,0.12)',c:ACCENT},'Targets Validated':{bg:'rgba(22,163,74,0.12)',c:T.green},'Targets Set':{bg:'rgba(90,138,106,0.12)',c:T.sage},'Committed':{bg:'rgba(197,169,106,0.15)',c:T.gold},'Removed':{bg:'rgba(220,38,38,0.12)',c:T.red},'Under Review':{bg:'rgba(217,119,6,0.12)',c:T.amber},'Not Submitted':{bg:'rgba(156,163,174,0.12)',c:T.textMut}};const st=m[s]||m['Committed'];return{background:st.bg,color:st.c,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600};};
const csvExport=(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name+'.csv';a.click();URL.revokeObjectURL(u);};

const TABS=['Target Setting','Sector Pathways','FLAG Targets','Portfolio Alignment','Validation Status','Carbon Budget','Export'];

const KPI=({label,value,sub,color,cite})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:'1 1 180px',minWidth:150}}>
    <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono,marginTop:4}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
    {cite&&<div style={{fontSize:9,color:T.textMut,fontFamily:T.mono,marginTop:2}}>{cite}</div>}
  </div>
);
const SectionHead=({children,cite})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
    <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{children}</div>
    {cite&&<span style={{fontSize:9,color:T.textMut,fontFamily:T.mono}}>{cite}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   TARGET METHODS — SBTi Criteria v5.1
   ═══════════════════════════════════════════════════════════════════════════════ */
const METHODS=[
  {id:'abs',name:'Absolute Contraction',desc:'Reduce absolute emissions by a fixed % per year. Minimum 4.2% linear annual reduction for 1.5C. Applicable to all sectors. Simplest approach.',ambition:'1.5°C',minRate:4.2,scope:'All sectors',formula:'Target = Base Emissions * (1 - r)^t, where r >= 4.2% p.a.',pros:['Simple to communicate','Clear accountability','Works for all sectors'],cons:['Penalizes growing companies','Does not account for sector specifics']},
  {id:'sda',name:'Sectoral Decarbonisation (SDA)',desc:'Convergence approach: company intensity converges to sector benchmark by target year. Based on IEA sector pathways. More nuanced for heavy industry.',ambition:'Well-below 2°C / 1.5°C',minRate:0,scope:'Homogeneous sectors (power, steel, cement, transport, buildings)',formula:'Target Intensity = Current Intensity + (Benchmark - Current) * (t / T)',pros:['Accounts for sector physics','Fair for heavy industry','IEA pathway aligned'],cons:['Complex calculation','Limited to specific sectors','Data-intensive']},
  {id:'temp',name:'Temperature Rating',desc:'SBTi for Financial Institutions: portfolio temperature score based on company targets. Used by asset managers and banks.',ambition:'1.5°C',minRate:0,scope:'Financial institutions',formula:'Portfolio Temp = sum(weight_i * temp_score_i)',pros:['Applicable to financial portfolios','Forward-looking','Integrates multiple companies'],cons:['Dependent on company target quality','Model uncertainty']},
  {id:'coverage',name:'Portfolio Coverage',desc:'SBTi for Financial Institutions: % of portfolio by AUM that has set SBTi-validated targets. Minimum thresholds apply.',ambition:'1.5°C / WB2C',minRate:0,scope:'Financial institutions',formula:'Coverage = sum(AUM_with_SBTi) / total_AUM',pros:['Engagement-focused','Clear metric','Drives real-economy action'],cons:['Binary (target set or not)','Does not assess ambition quality']},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTOR PATHWAYS — SDA methodology per SBTi/IEA
   ═══════════════════════════════════════════════════════════════════════════════ */
const SECTOR_PATHS=[
  {sector:'Power Generation',unit:'gCO2/kWh',base2020:450,target2030:138,target2050:0,pathway:'IEA NZE',convergenceYear:2040,method:'SDA',
    milestones:[{year:2025,val:310},{year:2030,val:138},{year:2035,val:68},{year:2040,val:20},{year:2045,val:5},{year:2050,val:0}]},
  {sector:'Steel',unit:'tCO2/t steel',base2020:1.85,target2030:1.18,target2050:0.04,pathway:'IEA NZE + MPP',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:1.55},{year:2030,val:1.18},{year:2035,val:0.82},{year:2040,val:0.45},{year:2045,val:0.15},{year:2050,val:0.04}]},
  {sector:'Cement',unit:'tCO2/t cement',base2020:0.61,target2030:0.42,target2050:0.04,pathway:'IEA NZE + GCCA',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:0.52},{year:2030,val:0.42},{year:2035,val:0.30},{year:2040,val:0.18},{year:2045,val:0.08},{year:2050,val:0.04}]},
  {sector:'Road Transport',unit:'gCO2/vkm',base2020:192,target2030:108,target2050:0,pathway:'IEA NZE',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:155},{year:2030,val:108},{year:2035,val:65},{year:2040,val:30},{year:2045,val:8},{year:2050,val:0}]},
  {sector:'Aviation',unit:'gCO2/RPK',base2020:90,target2030:72,target2050:18,pathway:'IEA NZE + ICAO LTAG',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:82},{year:2030,val:72},{year:2035,val:58},{year:2040,val:42},{year:2045,val:28},{year:2050,val:18}]},
  {sector:'Shipping',unit:'gCO2/dwt-nm',base2020:8.2,target2030:6.1,target2050:0.8,pathway:'IMO GHG Strategy',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:7.2},{year:2030,val:6.1},{year:2035,val:4.5},{year:2040,val:2.8},{year:2045,val:1.5},{year:2050,val:0.8}]},
  {sector:'Buildings (Residential)',unit:'kgCO2/m2',base2020:22,target2030:12,target2050:0,pathway:'IEA NZE + CRREM',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:17},{year:2030,val:12},{year:2035,val:7},{year:2040,val:3},{year:2045,val:1},{year:2050,val:0}]},
  {sector:'Buildings (Commercial)',unit:'kgCO2/m2',base2020:35,target2030:20,target2050:0,pathway:'IEA NZE + CRREM',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:28},{year:2030,val:20},{year:2035,val:12},{year:2040,val:5},{year:2045,val:1.5},{year:2050,val:0}]},
  {sector:'Aluminium',unit:'tCO2/t aluminium',base2020:11.5,target2030:7.8,target2050:0.5,pathway:'IAI Roadmap',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:9.8},{year:2030,val:7.8},{year:2035,val:5.2},{year:2040,val:2.8},{year:2045,val:1.2},{year:2050,val:0.5}]},
  {sector:'Pulp & Paper',unit:'tCO2/t product',base2020:0.55,target2030:0.38,target2050:0.05,pathway:'CEPI Roadmap',convergenceYear:2050,method:'SDA',
    milestones:[{year:2025,val:0.48},{year:2030,val:0.38},{year:2035,val:0.25},{year:2040,val:0.15},{year:2045,val:0.08},{year:2050,val:0.05}]},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   FLAG TARGETS — Forest, Land & Agriculture Guidance
   ═══════════════════════════════════════════════════════════════════════════════ */
const FLAG_COMMODITIES=[
  {commodity:'Cattle (Beef)',unit:'tCO2e/t product',base:45.0,target2030:30.0,flagRate:3.3,deforestationTarget:'Zero net deforestation by 2025',landUse:'Pasture & feed crops',scope:'Scope 1+2+3 (FLAG)'},
  {commodity:'Cattle (Dairy)',unit:'tCO2e/t milk',base:2.8,target2030:2.0,flagRate:2.8,deforestationTarget:'Zero net deforestation by 2025',landUse:'Pasture & feed crops',scope:'Scope 1+2+3 (FLAG)'},
  {commodity:'Palm Oil',unit:'tCO2e/t FFB',base:3.2,target2030:1.8,flagRate:4.4,deforestationTarget:'NDPE policy compliance by 2025',landUse:'Plantation expansion control',scope:'Scope 1+2+3 (FLAG)'},
  {commodity:'Soy',unit:'tCO2e/t product',base:1.1,target2030:0.7,flagRate:3.6,deforestationTarget:'Amazon Soy Moratorium compliance',landUse:'Conversion-free sourcing',scope:'Scope 3 (purchased goods)'},
  {commodity:'Pulp & Paper',unit:'tCO2e/t product',base:0.9,target2030:0.6,flagRate:3.3,deforestationTarget:'FSC/PEFC certification 100%',landUse:'Sustainable forest management',scope:'Scope 1+2+3 (FLAG)'},
  {commodity:'Rice',unit:'tCO2e/t paddy',base:2.5,target2030:1.8,flagRate:2.8,deforestationTarget:'N/A',landUse:'Wetland management',scope:'Scope 1+3 (FLAG)'},
  {commodity:'Cocoa',unit:'tCO2e/t product',base:4.5,target2030:2.8,flagRate:3.8,deforestationTarget:'Cocoa & Forests Initiative',landUse:'Agroforestry transition',scope:'Scope 3 (FLAG)'},
  {commodity:'Rubber',unit:'tCO2e/t product',base:3.8,target2030:2.4,flagRate:3.7,deforestationTarget:'Zero deforestation commitment',landUse:'Smallholder engagement',scope:'Scope 3 (FLAG)'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   80 COMPANIES WITH SBTi TARGETS + PROGRESS
   ═══════════════════════════════════════════════════════════════════════════════ */
const COMPANIES=(()=>{
  const equities=SECURITY_UNIVERSE.filter(s=>s.assetType==='Equity').slice(0,80);
  const statuses=['Net-Zero Validated','Targets Validated','Targets Set','Committed','Removed','Under Review'];
  const methods=['Absolute Contraction','Sectoral Decarbonisation','Temperature Rating','Portfolio Coverage'];
  return equities.map((sec,i)=>{
    const base=i*149;
    const status=statuses[Math.floor(sr(base)*5.5)]; // bias toward validated
    const method=methods[Math.floor(sr(base+1)*4)];
    const baseYear=2018+Math.floor(sr(base+3)*4);
    const scope1=Math.round(50000+sr(base+5)*9950000);
    const scope2=Math.round(20000+sr(base+7)*2000000);
    const scope3=Math.round(scope1*2+sr(base+9)*scope1*5);
    const nearTermS12=Math.round(25+sr(base+11)*30); // 25-55% by 2030
    const nearTermS3=Math.round(10+sr(base+13)*30);
    const longTermS12=90; // SBTi requires 90%+
    const longTermS3=Math.round(60+sr(base+15)*10); // 67% per NZ Standard
    const tempScore=+(1.3+sr(base+17)*2.0).toFixed(1);
    const annualRate=+(nearTermS12/(2030-baseYear)).toFixed(1);
    // Progress: emissions trajectory
    const currentReduction=Math.round(nearTermS12*0.4+sr(base+19)*nearTermS12*0.3); // 40-70% of target
    const onTrack=currentReduction>=(nearTermS12*(2026-baseYear)/(2030-baseYear))*0.85;
    const commitDate=`20${20+Math.floor(sr(base+21)*4)}-${String(1+Math.floor(sr(base+23)*12)).padStart(2,'0')}-${String(1+Math.floor(sr(base+25)*28)).padStart(2,'0')}`;
    const validationDeadline=`20${22+Math.floor(sr(base+27)*3)}-${String(1+Math.floor(sr(base+29)*12)).padStart(2,'0')}`;
    const flagExposure=sr(base+31)<0.3;
    return{
      id:sec.id||i+1,name:sec.name||`Company_${i+1}`,ticker:sec.ticker||'',
      sector:sec.sector||'Industrials',country:sec.country||'US',
      status,method,baseYear,scope1,scope2,scope3,
      nearTermS12,nearTermS3,longTermS12,longTermS3,
      tempScore,annualRate,currentReduction,onTrack,
      commitDate,validationDeadline,flagExposure,
      totalEmissions:scope1+scope2+scope3,
      netZeroYear:status.includes('Net-Zero')?2050:status==='Targets Validated'?2050:null,
      residualTarget:10, // SBTi: max 10% residual
      neutralization:status.includes('Net-Zero')?Math.round(scope1*0.08):'N/A',
    };
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   CARBON BUDGET DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const CARBON_BUDGETS=[
  {pathway:'1.5°C (50% probability)',remainingGt:400,usedGt:2400,totalGt:2800,yearExhausted:2030,annualBudgetGt:40,perCapitaT:5.0,source:'IPCC AR6 WG1 Table SPM.2'},
  {pathway:'1.5°C (67% probability)',remainingGt:300,usedGt:2400,totalGt:2700,yearExhausted:2028,annualBudgetGt:30,perCapitaT:3.8,source:'IPCC AR6 WG1'},
  {pathway:'2°C (50% probability)',remainingGt:1150,usedGt:2400,totalGt:3550,yearExhausted:2046,annualBudgetGt:72,perCapitaT:14.4,source:'IPCC AR6 WG1'},
  {pathway:'2°C (67% probability)',remainingGt:900,usedGt:2400,totalGt:3300,yearExhausted:2041,annualBudgetGt:56,perCapitaT:11.3,source:'IPCC AR6 WG1'},
  {pathway:'2.5°C (50% probability)',remainingGt:2300,usedGt:2400,totalGt:4700,yearExhausted:2067,annualBudgetGt:115,perCapitaT:28.8,source:'IPCC AR6 WG1'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function SbtiTargetSetterPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[secF,setSecF]=useState('All');
  const[statusF,setStatusF]=useState('All');
  const[sortCol,setSortCol]=useState('tempScore');
  const[sortDir,setSortDir]=useState('asc');
  const[page,setPage]=useState(1);
  const[expanded,setExpanded]=useState(null);
  const[selMethod,setSelMethod]=useState(0);
  const[selSector,setSelSector]=useState(0);
  const[selBudget,setSelBudget]=useState(0);
  const[portView,setPortView]=useState('coverage');
  const[exportFormat,setExportFormat]=useState('SBTi Submission');

  const sectors=['All',...new Set(COMPANIES.map(c=>c.sector))].sort();
  const allStatuses=['All','Net-Zero Validated','Targets Validated','Targets Set','Committed','Removed','Under Review'];
  const doSort=useCallback((col)=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'asc');setPage(1);},[sortCol]);

  const filtered=useMemo(()=>{
    let d=[...COMPANIES];
    if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));
    if(secF!=='All')d=d.filter(r=>r.sector===secF);
    if(statusF!=='All')d=d.filter(r=>r.status===statusF);
    d.sort((a,b)=>{const av=a[sortCol]??0;const bv=b[sortCol]??0;return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1);});
    return d;
  },[search,secF,statusF,sortCol,sortDir]);
  const paged=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);

  const validated=COMPANIES.filter(c=>c.status.includes('Validated'));
  const nzValidated=COMPANIES.filter(c=>c.status==='Net-Zero Validated');
  const committed=COMPANIES.filter(c=>c.status==='Committed');
  const onTrackCount=COMPANIES.filter(c=>c.onTrack).length;
  const avgTemp=+(COMPANIES.reduce((s,c)=>s+c.tempScore,0)/ Math.max(1, COMPANIES.length)).toFixed(1);

  const ss={
    wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text},
    header:{fontSize:22,fontWeight:700,color:T.navy,marginBottom:4},
    sub:{fontSize:13,color:T.textSec,marginBottom:20},
    tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'},
    tab:(a)=>({padding:'10px 16px',fontSize:12,fontWeight:a?700:500,color:a?ACCENT:T.textSec,background:a?`${ACCENT}10`:'transparent',border:'none',borderBottom:a?`2px solid ${ACCENT}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2,whiteSpace:'nowrap'}),
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:20},
    grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20},
    flex:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16,alignItems:'center'},
    td:{padding:'10px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`,fontFamily:T.font},
    th:(col)=>({padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:sortCol===col?ACCENT:T.textMut,cursor:'pointer',borderBottom:`2px solid ${T.border}`,userSelect:'none',textTransform:'uppercase',letterSpacing:0.5,whiteSpace:'nowrap'}),
    btn:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.surface,background:ACCENT,border:'none',borderRadius:6,cursor:'pointer',fontFamily:T.font},
    btnSec:{padding:'6px 16px',fontSize:12,fontWeight:600,color:T.textSec,background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font},
    pg:{display:'flex',gap:8,alignItems:'center',justifyContent:'center',marginTop:16},
    select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
    input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220},
    cite:{fontSize:9,color:T.textMut,fontFamily:T.mono,marginTop:4},
  };
  const TH=({col,label})=><th style={ss.th(col)} onClick={()=>doSort(col)}>{label}{sortCol===col?(sortDir==='asc'?' \u25B2':' \u25BC'):''}</th>;

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 0: TARGET SETTING — absolute vs SDA, near/long-term, net-zero
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderTargetSetting=()=>{
    const m=METHODS[selMethod];
    // Trajectory for absolute contraction
    const trajData=Array.from({length:31},(_,i)=>{
      const yr=2020+i;
      return{
        year:yr,
        sbti15:Math.round(100*Math.pow(1-0.042,yr-2020)),
        sbtiWB2:Math.round(100*Math.pow(1-0.025,yr-2020)),
        bau:Math.round(100*Math.pow(1.02,yr-2020)),
        nzResidual:yr>=2045?10:null,
      };
    });
    return(<>
      <SectionHead cite="SBTi Criteria v5.1 — Target Setting Approaches">Target Setting Engine</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Companies" value={COMPANIES.length} color={T.navy}/>
        <KPI label="Validated" value={validated.length} sub={`${Math.round(validated.length/ Math.max(1, COMPANIES.length)*100)}%`} color={ACCENT}/>
        <KPI label="Net-Zero" value={nzValidated.length} color={T.green}/>
        <KPI label="Avg Temp" value={avgTemp+'°C'} color={avgTemp<=1.8?T.green:avgTemp<=2.2?T.amber:T.red} cite="SBTi Temp Rating"/>
        <KPI label="On Track" value={`${onTrackCount}/${COMPANIES.length}`} color={T.sage}/>
        <KPI label="Min Rate" value="4.2% p.a." sub="for 1.5°C" color={ACCENT} cite="SBTi C6"/>
      </div>
      {/* Method Selector */}
      <div style={ss.flex}>
        {METHODS.map((mt,i)=><button key={i} style={selMethod===i?ss.btn:ss.btnSec} onClick={()=>setSelMethod(i)}>{mt.name}</button>)}
      </div>
      <div style={ss.card}>
        <SectionHead cite="SBTi Criteria v5.1 §C5-C8">{m.name} Approach</SectionHead>
        <div style={{fontSize:12,color:T.textSec,lineHeight:1.6,marginBottom:12}}>{m.desc}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
          <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>AMBITION</div>
            <div style={{fontSize:13,fontWeight:600,color:ACCENT,marginTop:4}}>{m.ambition}</div>
          </div>
          <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>MIN ANNUAL RATE</div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:4}}>{m.minRate>0?m.minRate+'% p.a.':'Sector-specific'}</div>
          </div>
          <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>SCOPE</div>
            <div style={{fontSize:13,fontWeight:600,color:T.text,marginTop:4}}>{m.scope}</div>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,padding:'8px 12px',background:T.surfaceH,borderRadius:6}}>{m.formula}</div>
        </div>
        <div style={ss.grid2}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Advantages</div>
            {m.pros.map((p,i)=><div key={i} style={{fontSize:11,color:T.textSec,padding:'3px 0'}}><span style={{color:T.green,marginRight:6}}>+</span>{p}</div>)}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>Limitations</div>
            {m.cons.map((c,i)=><div key={i} style={{fontSize:11,color:T.textSec,padding:'3px 0'}}><span style={{color:T.red,marginRight:6}}>-</span>{c}</div>)}
          </div>
        </div>
      </div>
      {/* SBTi criteria summary */}
      <div style={ss.card}>
        <SectionHead cite="SBTi Net-Zero Standard v1.0">SBTi Target Architecture</SectionHead>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          {[
            {title:'Near-Term (5-10yr)',color:T.amber,items:['Scope 1+2: 4.2% p.a. linear (1.5°C)','Scope 3: if >40% of total, required','2.5% p.a. minimum for WB2C','Base year: within 2 years','Target year: 5-10 years from submission']},
            {title:'Long-Term (>10yr)',color:ACCENT,items:['90%+ absolute reduction by 2050','Covers Scope 1+2+3','Sector-specific pathways allowed','Must be validated alongside near-term','1.5°C alignment required (NZ Standard)']},
            {title:'Net-Zero Residual',color:T.navy,items:['Residual emissions max 10% of base','Neutralization: permanent carbon removal','CDR quality: durable storage >100yr','No forestry offsets for neutralization','Separate from compensation/offsetting']},
          ].map((s,i)=>(
            <div key={i} style={{padding:16,borderRadius:8,border:`1px solid ${T.border}`,borderTop:`4px solid ${s.color}`}}>
              <div style={{fontSize:13,fontWeight:700,color:s.color,marginBottom:8}}>{s.title}</div>
              {s.items.map((item,j)=><div key={j} style={{fontSize:11,color:T.textSec,padding:'3px 0'}}>- {item}</div>)}
            </div>
          ))}
        </div>
      </div>
      {/* Trajectory Chart */}
      <div style={ss.card}>
        <SectionHead>Emissions Reduction Pathways (% of base year)</SectionHead>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trajData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:9,fill:T.textMut}} interval={5}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} domain={[0,150]}/>
            <Tooltip {...tip}/>
            <Area type="monotone" dataKey="bau" stroke={T.red} fill="rgba(220,38,38,0.08)" name="BAU (+2% p.a.)"/>
            <Area type="monotone" dataKey="sbtiWB2" stroke={T.amber} fill="rgba(217,119,6,0.08)" name="WB2°C (-2.5% p.a.)"/>
            <Area type="monotone" dataKey="sbti15" stroke={ACCENT} fill="rgba(5,150,105,0.1)" name="1.5°C (-4.2% p.a.)"/>
            <Line type="monotone" dataKey="nzResidual" stroke={T.navy} strokeDasharray="5 5" dot={false} name="NZ Residual (10%)"/>
            <Legend/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={ss.cite}>SBTi Criteria v5.1: 1.5°C requires 4.2% linear annual reduction. WB2°C requires 2.5%. Net-zero residual max 10% of base year.</div>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 1: SECTOR PATHWAYS — SDA per sector
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderSectorPathways=()=>{
    const sp=SECTOR_PATHS[selSector];
    return(<>
      <SectionHead cite="SBTi SDA Methodology — IEA NZE Sector Pathways">Sector Decarbonisation Pathways</SectionHead>
      <div style={ss.flex}>
        {SECTOR_PATHS.map((s,i)=><button key={i} style={selSector===i?ss.btn:ss.btnSec} onClick={()=>setSelSector(i)}>{s.sector}</button>)}
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Sector" value={sp.sector} color={ACCENT}/>
        <KPI label="Base (2020)" value={sp.base2020} sub={sp.unit} color={T.navy}/>
        <KPI label="Target 2030" value={sp.target2030} sub={sp.unit} color={T.amber}/>
        <KPI label="Target 2050" value={sp.target2050} sub={sp.unit} color={T.green}/>
        <KPI label="Convergence" value={sp.convergenceYear} color={T.sage}/>
      </div>
      <div style={ss.card}>
        <SectionHead>Intensity Pathway — {sp.sector}</SectionHead>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sp.milestones}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:10,fill:T.textMut}}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}} label={{value:sp.unit,angle:-90,position:'left',fontSize:9,fill:T.textSec}}/>
            <Tooltip {...tip}/>
            <Area type="monotone" dataKey="val" stroke={ACCENT} fill="rgba(5,150,105,0.12)" name={sp.unit}/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Source: {sp.pathway}</span>
          <span style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Method: {sp.method}</span>
        </div>
      </div>
      {/* All Sectors Summary */}
      <div style={ss.card}>
        <SectionHead>All Sector Pathways Summary</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['Sector','Unit','Base 2020','Target 2030','Target 2050','Reduction %','Pathway','Convergence'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{SECTOR_PATHS.map((s,i)=>{
            const redPct=Math.round((1-s.target2030/s.base2020)*100);
            return(<tr key={i} style={{background:selSector===i?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelSector(i)}>
              <td style={{...ss.td,fontWeight:600}}>{s.sector}</td>
              <td style={{...ss.td,fontFamily:T.mono,fontSize:10}}>{s.unit}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{s.base2020}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{s.target2030}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{s.target2050}</td>
              <td style={ss.td}><span style={badge(redPct,[20,40,60])}>{redPct}%</span></td>
              <td style={{...ss.td,fontSize:10}}>{s.pathway}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{s.convergenceYear}</td>
            </tr>);
          })}</tbody></table>
        </div>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 2: FLAG TARGETS
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderFLAG=()=>(
    <>
      <SectionHead cite="SBTi FLAG Guidance (Sep 2022) — Forest, Land & Agriculture">FLAG Targets</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Commodities" value={FLAG_COMMODITIES.length} color={ACCENT}/>
        <KPI label="FLAG Companies" value={COMPANIES.filter(c=>c.flagExposure).length} sub="in portfolio" color={T.navy}/>
        <KPI label="Avg FLAG Rate" value={+(FLAG_COMMODITIES.reduce((s,c)=>s+c.flagRate,0)/ Math.max(1, FLAG_COMMODITIES.length)).toFixed(1)+'%'} sub="p.a. reduction" color={T.sage}/>
      </div>
      <div style={ss.card}>
        <SectionHead>FLAG Commodity Pathways</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['Commodity','Unit','Base','Target 2030','Annual Rate','Deforestation Target','Land Use','Scope'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{FLAG_COMMODITIES.map((c,i)=>(
            <tr key={i}>
              <td style={{...ss.td,fontWeight:600}}>{c.commodity}</td>
              <td style={{...ss.td,fontFamily:T.mono,fontSize:10}}>{c.unit}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{c.base}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{c.target2030}</td>
              <td style={ss.td}><span style={badge(c.flagRate*10,[20,35,45])}>{c.flagRate}% p.a.</span></td>
              <td style={{...ss.td,fontSize:10,maxWidth:180}}>{c.deforestationTarget}</td>
              <td style={{...ss.td,fontSize:10}}>{c.landUse}</td>
              <td style={{...ss.td,fontSize:10,fontFamily:T.mono}}>{c.scope}</td>
            </tr>
          ))}</tbody></table>
        </div>
        <div style={ss.cite}>SBTi FLAG Guidance: Companies with FLAG emissions &gt;20% of total must set separate FLAG targets. Sector-specific intensity pathways required.</div>
      </div>
      <div style={ss.card}>
        <SectionHead>FLAG Commodity Reduction Targets</SectionHead>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={FLAG_COMMODITIES.map(c=>({name:c.commodity,base:c.base,target:c.target2030,reduction:Math.round((1-c.target2030/c.base)*100)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textMut}} angle={-20} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textMut}}/>
            <Tooltip {...tip}/>
            <Bar dataKey="base" fill={T.border} name="Base" radius={[4,4,0,0]}/>
            <Bar dataKey="target" fill={ACCENT} name="2030 Target" radius={[4,4,0,0]}/>
            <Legend/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 3: PORTFOLIO ALIGNMENT — SBTi for Financial Institutions
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderPortfolio=()=>{
    const validatedPct=Math.round(validated.length/ Math.max(1, COMPANIES.length)*100);
    const nzPct=Math.round(nzValidated.length/ Math.max(1, COMPANIES.length)*100);
    const statusDist={};COMPANIES.forEach(c=>{statusDist[c.status]=(statusDist[c.status]||0)+1;});
    const tempBuckets={'<1.5°C':0,'1.5-2°C':0,'2-3°C':0,'>3°C':0};
    COMPANIES.forEach(c=>{if(c.tempScore<1.5)tempBuckets['<1.5°C']++;else if(c.tempScore<2)tempBuckets['1.5-2°C']++;else if(c.tempScore<3)tempBuckets['2-3°C']++;else tempBuckets['>3°C']++;});
    const sectorTemp={};
    COMPANIES.forEach(c=>{if(!sectorTemp[c.sector])sectorTemp[c.sector]={sector:c.sector,sum:0,n:0};sectorTemp[c.sector].sum+=c.tempScore;sectorTemp[c.sector].n++;});
    const sectorTempData=Object.values(sectorTemp).map(s=>({...s,avg:+(s.sum/s.n).toFixed(1)})).sort((a,b)=>a.avg-b.avg);

    return(<>
      <SectionHead cite="SBTi for Financial Institutions — Portfolio Alignment">Portfolio Alignment</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Coverage" value={validatedPct+'%'} sub="SBTi-validated" color={validatedPct>=50?T.green:T.amber}/>
        <KPI label="Net-Zero" value={nzPct+'%'} color={nzPct>=20?T.green:T.amber}/>
        <KPI label="Avg Temp" value={avgTemp+'°C'} color={avgTemp<=1.8?T.green:avgTemp<=2.2?T.amber:T.red}/>
        <KPI label="On Track" value={`${onTrackCount}/${COMPANIES.length}`} color={T.sage}/>
      </div>
      <div style={ss.flex}>
        <button style={portView==='coverage'?ss.btn:ss.btnSec} onClick={()=>setPortView('coverage')}>Portfolio Coverage</button>
        <button style={portView==='temperature'?ss.btn:ss.btnSec} onClick={()=>setPortView('temperature')}>Temperature Rating</button>
      </div>
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Status Distribution</SectionHead>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={Object.entries(statusDist).map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
              {Object.keys(statusDist).map((_,i)=><Cell key={i} fill={PIECLRS[i%PIECLRS.length]}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead>Temperature Score Distribution</SectionHead>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(tempBuckets).map(([name,value])=>({name,value}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="value" name="Companies" radius={[4,4,0,0]}>
                {Object.keys(tempBuckets).map((_,i)=><Cell key={i} fill={[T.green,T.sage,T.amber,T.red][i]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Sector Temperature */}
      <div style={ss.card}>
        <SectionHead>Temperature Score by Sector</SectionHead>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorTempData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" domain={[0,3.5]} tick={{fontSize:9,fill:T.textMut}}/>
            <YAxis dataKey="sector" type="category" tick={{fontSize:9,fill:T.textSec}} width={140}/>
            <Tooltip {...tip}/>
            <Bar dataKey="avg" name="Avg Temp °C" radius={[0,4,4,0]}>
              {sectorTempData.map((_,i)=><Cell key={i} fill={sectorTempData[i].avg<=1.8?T.green:sectorTempData[i].avg<=2.2?T.amber:T.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 4: VALIDATION STATUS — 80 companies progress
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderValidation=()=>(
    <>
      <SectionHead cite="SBTi Validation Process — 24-month deadline">Validation Status ({COMPANIES.length} companies)</SectionHead>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Validated" value={validated.length} color={T.green}/>
        <KPI label="Net-Zero" value={nzValidated.length} color={ACCENT}/>
        <KPI label="Committed" value={committed.length} sub="24-mo deadline" color={T.gold}/>
        <KPI label="On Track" value={onTrackCount} color={T.sage}/>
        <KPI label="Removed" value={COMPANIES.filter(c=>c.status==='Removed').length} color={T.red}/>
      </div>
      <div style={ss.card}>
        <div style={ss.flex}>
          <input style={ss.input} placeholder="Search companies..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          <select style={ss.select} value={secF} onChange={e=>{setSecF(e.target.value);setPage(1);}}>{sectors.map(s=><option key={s}>{s}</option>)}</select>
          <select style={ss.select} value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>{allStatuses.map(s=><option key={s}>{s}</option>)}</select>
          <div style={{flex:1}}/><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} companies</span>
          <button style={ss.btn} onClick={()=>csvExport(filtered.map(c=>({name:c.name,sector:c.sector,status:c.status,method:c.method,tempScore:c.tempScore,nearTermS12:c.nearTermS12,nearTermS3:c.nearTermS3,scope1:c.scope1,scope2:c.scope2,scope3:c.scope3,onTrack:c.onTrack?'Yes':'No',commitDate:c.commitDate})),'sbti_validation')}>Export CSV</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            <TH col="name" label="Company"/><TH col="sector" label="Sector"/>
            <TH col="status" label="Status"/><TH col="method" label="Method"/>
            <TH col="tempScore" label="Temp °C"/><TH col="nearTermS12" label="Near S1+2"/>
            <TH col="nearTermS3" label="Near S3"/><TH col="annualRate" label="Rate %/yr"/>
            <TH col="onTrack" label="Track"/><TH col="commitDate" label="Commit Date"/>
          </tr></thead><tbody>{paged.map(r=>(
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer',background:expanded===r.id?T.surfaceH:'transparent'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td style={{...ss.td,fontWeight:600}}>{r.name}</td>
                <td style={{...ss.td,fontSize:11}}>{r.sector}</td>
                <td style={ss.td}><span style={statusBadge(r.status)}>{r.status}</span></td>
                <td style={{...ss.td,fontSize:10}}>{r.method}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono,background:r.tempScore<=1.5?'rgba(5,150,105,0.12)':r.tempScore<=2?'rgba(22,163,74,0.12)':r.tempScore<=2.5?'rgba(217,119,6,0.12)':'rgba(220,38,38,0.12)',color:r.tempScore<=1.5?ACCENT:r.tempScore<=2?T.green:r.tempScore<=2.5?T.amber:T.red}}>{r.tempScore}°C</span></td>
                <td style={{...ss.td,fontFamily:T.mono}}>{r.nearTermS12}%</td>
                <td style={{...ss.td,fontFamily:T.mono}}>{r.nearTermS3}%</td>
                <td style={{...ss.td,fontFamily:T.mono,color:r.annualRate>=4.2?T.green:r.annualRate>=2.5?T.amber:T.red}}>{r.annualRate}%</td>
                <td style={ss.td}>{r.onTrack?<span style={{color:T.green,fontWeight:600}}>On Track</span>:<span style={{color:T.red}}>Behind</span>}</td>
                <td style={{...ss.td,fontFamily:T.mono,fontSize:10}}>{r.commitDate}</td>
              </tr>
              {expanded===r.id&&<tr><td colSpan={10} style={{padding:16,background:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                  <div>
                    {[['Base Year',r.baseYear],['Scope 1',fmt(r.scope1)+' tCO2e'],['Scope 2',fmt(r.scope2)+' tCO2e'],['Scope 3',fmt(r.scope3)+' tCO2e'],['Total',fmt(r.totalEmissions)+' tCO2e'],['Current Reduction',r.currentReduction+'%'],['Long-term S1+2',r.longTermS12+'%'],['Long-term S3',r.longTermS3+'%'],['Validation Deadline',r.validationDeadline],['FLAG Exposure',r.flagExposure?'Yes':'No']].map(([l,v])=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,borderBottom:`1px solid ${T.border}`}}>
                        <span style={{color:T.textSec}}>{l}</span><span style={{fontFamily:T.mono,fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Progress vs Target</div>
                    <div style={{height:12,background:T.surfaceH,borderRadius:6,overflow:'hidden',marginBottom:8}}>
                      <div style={{width:`${r.currentReduction}%`,height:'100%',background:r.onTrack?ACCENT:T.red,borderRadius:6}}/>
                    </div>
                    <div style={{fontSize:10,color:T.textSec}}>Current: {r.currentReduction}% | Target: {r.nearTermS12}% by 2030</div>
                    {r.netZeroYear&&<div style={{marginTop:8,fontSize:11,color:ACCENT,fontWeight:600}}>Net-Zero target: {r.netZeroYear}</div>}
                    {r.neutralization!=='N/A'&&<div style={{fontSize:10,color:T.textSec}}>Neutralization budget: {fmt(r.neutralization)} tCO2e/yr</div>}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={[{d:'S1+2 Near',v:r.nearTermS12},{d:'S3 Near',v:r.nearTermS3},{d:'S1+2 Long',v:r.longTermS12},{d:'S3 Long',v:r.longTermS3},{d:'Progress',v:r.currentReduction},{d:'Temp',v:Math.round((3-r.tempScore)/3*100)}]} cx="50%" cy="50%" outerRadius={60}>
                      <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="d" tick={{fontSize:8,fill:T.textSec}}/>
                      <PolarRadiusAxis tick={false} domain={[0,100]}/>
                      <Radar dataKey="v" stroke={ACCENT} fill="rgba(5,150,105,0.15)" strokeWidth={2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </td></tr>}
            </React.Fragment>
          ))}</tbody></table>
        </div>
        <div style={ss.pg}><button style={ss.btnSec} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button><span style={{fontSize:12,fontFamily:T.mono,color:T.textSec}}>{page}/{totalPages}</span><button style={ss.btnSec} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 5: CARBON BUDGET
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderBudget=()=>{
    const cb=CARBON_BUDGETS[selBudget];
    // Company fair-share allocation
    const totalPortEmissions=COMPANIES.reduce((s,c)=>s+c.totalEmissions,0);
    const globalEmissions=40e9; // ~40 GtCO2e/yr
    const portfolioShare=totalPortEmissions/globalEmissions;
    const portfolioBudget=Math.round(cb.remainingGt*1e9*portfolioShare);

    return(<>
      <SectionHead cite="IPCC AR6 WG1 Table SPM.2 — Carbon Budget">Carbon Budget Analysis</SectionHead>
      <div style={ss.flex}>
        {CARBON_BUDGETS.map((b,i)=><button key={i} style={selBudget===i?ss.btn:ss.btnSec} onClick={()=>setSelBudget(i)}>{b.pathway}</button>)}
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <KPI label="Remaining Budget" value={cb.remainingGt+' Gt'} sub={`CO2 from Jan 2020`} color={cb.remainingGt<500?T.red:T.amber} cite={cb.source}/>
        <KPI label="Year Exhausted" value={cb.yearExhausted} sub="at current rates" color={cb.yearExhausted<2035?T.red:T.amber}/>
        <KPI label="Annual Budget" value={cb.annualBudgetGt+' Gt/yr'} color={T.navy}/>
        <KPI label="Per Capita" value={cb.perCapitaT+' t/yr'} sub="global average" color={T.sage}/>
        <KPI label="Portfolio Share" value={fmt(portfolioBudget)+' tCO2e'} sub="fair-share allocation" color={ACCENT}/>
      </div>
      <div style={ss.grid2}>
        <div style={ss.card}>
          <SectionHead>Carbon Budget Comparison</SectionHead>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CARBON_BUDGETS.map(b=>({pathway:b.pathway.split(' (')[0],remaining:b.remainingGt,used:b.usedGt}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="pathway" tick={{fontSize:8,fill:T.textMut}} angle={-15} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textMut}} label={{value:'GtCO2',angle:-90,position:'left',fontSize:10}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="used" fill={T.red} name="Used" stackId="a"/>
              <Bar dataKey="remaining" fill={ACCENT} name="Remaining" stackId="a" radius={[4,4,0,0]}/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <SectionHead>Budget Exhaustion Timeline</SectionHead>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CARBON_BUDGETS.map(b=>({pathway:b.pathway.split(' (')[0],year:b.yearExhausted}))} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[2025,2075]} tick={{fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="pathway" type="category" tick={{fontSize:8,fill:T.textSec}} width={80}/>
              <Tooltip {...tip}/>
              <Bar dataKey="year" name="Exhaustion Year" radius={[0,4,4,0]}>
                {CARBON_BUDGETS.map((_,i)=><Cell key={i} fill={CARBON_BUDGETS[i].yearExhausted<2035?T.red:CARBON_BUDGETS[i].yearExhausted<2050?T.amber:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={ss.card}>
        <SectionHead>All Pathways Detail</SectionHead>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>
            {['Pathway','Remaining (Gt)','Total (Gt)','Year Exhausted','Annual (Gt/yr)','Per Capita (t/yr)','Source'].map(h=><th key={h} style={{...ss.td,fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h}</th>)}
          </tr></thead><tbody>{CARBON_BUDGETS.map((b,i)=>(
            <tr key={i} style={{background:selBudget===i?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelBudget(i)}>
              <td style={{...ss.td,fontWeight:600}}>{b.pathway}</td>
              <td style={{...ss.td,fontFamily:T.mono,color:b.remainingGt<500?T.red:T.amber}}>{b.remainingGt}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{b.totalGt}</td>
              <td style={{...ss.td,fontFamily:T.mono,fontWeight:600,color:b.yearExhausted<2035?T.red:T.amber}}>{b.yearExhausted}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{b.annualBudgetGt}</td>
              <td style={{...ss.td,fontFamily:T.mono}}>{b.perCapitaT}</td>
              <td style={{...ss.td,fontSize:10}}>{b.source}</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </>);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     TAB 6: EXPORT
     ═══════════════════════════════════════════════════════════════════════════════ */
  const renderExport=()=>(
    <>
      <SectionHead cite="SBTi Target Submission & Reporting">Export Centre</SectionHead>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {[
          {name:'SBTi Submission',desc:'Target submission form for SBTi validation: company info, base year, targets, methodology. Formatted for online portal.',ext:'.xlsx'},
          {name:'Progress Report',desc:'Annual progress report: emissions trajectory vs target, on-track status, actions taken. Board-ready format.',ext:'.pdf'},
          {name:'Board Summary',desc:'Executive summary for Board: portfolio SBTi coverage, temperature rating, key risks, FLAG exposure.',ext:'.pptx'},
          {name:'Portfolio Alignment',desc:'SBTi for Financial Institutions: portfolio coverage %, temperature score, sector breakdown.',ext:'.xlsx'},
          {name:'Carbon Budget',desc:'Carbon budget allocation per company: fair-share methodology, remaining budget, annual allowance.',ext:'.xlsx'},
          {name:'FLAG Report',desc:'Forest, Land & Agriculture targets: commodity pathways, deforestation commitments, progress.',ext:'.pdf'},
        ].map((f,i)=>(
          <div key={i} style={{...ss.card,cursor:'pointer',background:exportFormat===f.name?`${ACCENT}08`:T.surface}} onClick={()=>setExportFormat(f.name)}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>{f.name}</div>
            <div style={{fontSize:11,color:T.textSec}}>{f.desc}</div>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginTop:4}}>{f.ext}</div>
          </div>
        ))}
      </div>
      <div style={ss.card}>
        <div style={{display:'flex',gap:12}}>
          <button style={ss.btn} onClick={()=>csvExport(COMPANIES.map(c=>({name:c.name,sector:c.sector,status:c.status,method:c.method,baseYear:c.baseYear,tempScore:c.tempScore,nearTermS12:c.nearTermS12,nearTermS3:c.nearTermS3,longTermS12:c.longTermS12,longTermS3:c.longTermS3,scope1:c.scope1,scope2:c.scope2,scope3:c.scope3,annualRate:c.annualRate,currentReduction:c.currentReduction,onTrack:c.onTrack?'Yes':'No',commitDate:c.commitDate,flagExposure:c.flagExposure?'Yes':'No'})),'sbti_export')}>Generate {exportFormat}</button>
          <button style={ss.btnSec}>Preview</button>
        </div>
      </div>
    </>
  );

  return(
    <div style={ss.wrap}>
      <div style={ss.header}>SBTi Target Setter</div>
      <div style={ss.sub}>Science Based Targets initiative — Criteria v5.1 + Net-Zero Standard + FLAG Guidance — {COMPANIES.length} companies, {SECTOR_PATHS.length} sector pathways, {FLAG_COMMODITIES.length} FLAG commodities</div>
      <div style={ss.tabs}>{TABS.map((t,i)=><button key={i} style={ss.tab(tab===i)} onClick={()=>{setTab(i);setPage(1);}}>{t}</button>)}</div>
      {tab===0&&renderTargetSetting()}
      {tab===1&&renderSectorPathways()}
      {tab===2&&renderFLAG()}
      {tab===3&&renderPortfolio()}
      {tab===4&&renderValidation()}
      {tab===5&&renderBudget()}
      {tab===6&&renderExport()}
    </div>
  );
}
