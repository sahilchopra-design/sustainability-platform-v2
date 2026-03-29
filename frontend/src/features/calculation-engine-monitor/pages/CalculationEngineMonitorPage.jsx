import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

/* ─── Theme ─── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Deterministic seed ─── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,s)=>arr[Math.floor(sr(s)*arr.length)];
const rng=(min,max,s)=>min+sr(s)*(max-min);
const rngI=(min,max,s)=>Math.floor(rng(min,max,s));

/* ─── Tabs ─── */
const TABS = ['Engine Status','Execution History','Shadow Model Comparison','Engine Configuration'];

/* ─── Engine Definitions ─── */
const STATUSES = ['idle','running','error'];
const STATUS_COLORS = {idle:T.sage,running:T.navyL,error:T.red};
const TRIGGERS = ['manual','scheduled','API','webhook','dependency'];

const CORE_ENGINES = [
  {id:'E-001',name:'PD Exponential',desc:'Probability of Default via exponential model',category:'Credit Risk',inputs:['company_master','esg_scores','financial_data'],outputs:['pd_results'],depIds:[]},
  {id:'E-002',name:'Merton Distance-to-Default',desc:'Structural credit model using equity volatility',category:'Credit Risk',inputs:['company_master','market_data'],outputs:['pd_results'],depIds:['E-001']},
  {id:'E-003',name:'Monte Carlo VaR',desc:'Value-at-Risk via 10K Monte Carlo simulation',category:'Market Risk',inputs:['holdings','market_data','correlation_matrix'],outputs:['var_results'],depIds:[]},
  {id:'E-004',name:'Dynamic Materiality',desc:'DMI scoring across ESG dimensions',category:'Materiality',inputs:['company_master','esg_scores','sector_weights'],outputs:['materiality_assessments'],depIds:[]},
  {id:'E-005',name:'ITR Temperature Alignment',desc:'Implied Temperature Rise regression model',category:'Climate',inputs:['emissions','sbti_targets','company_master'],outputs:['transition_scores'],depIds:['E-007']},
  {id:'E-006',name:'NGFS Climate Scenarios',desc:'Scenario-based stress testing (NGFS 6 scenarios)',category:'Climate',inputs:['climate_scenarios','holdings','pd_results'],outputs:['stress_tests'],depIds:['E-001','E-002']},
  {id:'E-007',name:'GHG Emissions Calculator',desc:'Scope 1/2/3 computation with DEFRA/GWP factors',category:'Emissions',inputs:['raw_activity_data','defra_factors','gwp_factors'],outputs:['emissions'],depIds:[]},
  {id:'E-008',name:'EU Taxonomy Alignment',desc:'Technical screening criteria assessment',category:'Taxonomy',inputs:['company_master','financial_data','activity_data'],outputs:['taxonomy_assessments'],depIds:[]},
  {id:'E-009',name:'PCAF Financed Emissions',desc:'Portfolio financed emissions (PCAF methodology)',category:'Climate',inputs:['holdings','emissions','financial_data'],outputs:['pcaf_positions'],depIds:['E-007']},
  {id:'E-010',name:'Copula Tail Risk',desc:'Tail dependence via Clayton/Gumbel copulas',category:'Market Risk',inputs:['holdings','market_data','correlation_matrix'],outputs:['var_results'],depIds:['E-003']},
];

const SECONDARY_ENGINES = Array.from({length:20},(_, i)=>({
  id:`E-${String(i+11).padStart(3,'0')}`,
  name:['SFDR PAI Calculator','CSRD Data Compiler','Green Bond Verifier','SBTi Progress Tracker','TCFD Disclosure Mapper','Physical Risk Scorer','Transition Risk Scorer','Biodiversity Impact','Water Stress Calculator','Supply Chain Tracer','Sovereign ESG Scorer','Carbon Credit Validator','Board Diversity Scorer','Executive Pay Analyzer','Controversy Tracker','ESG Momentum Signal','Greenium Estimator','CRREM Pathway','Net Zero Tracker','Engagement Scorer'][i],
  desc:['Compute SFDR PAI indicators','Compile CSRD E1-E5 disclosures','Verify green bond alignment','Track SBTi target progress','Map TCFD pillar disclosures','Score physical climate risk','Score transition climate risk','Assess biodiversity impact','Calculate water stress index','Trace supply chain ESG','Score sovereign ESG','Validate carbon credit integrity','Score board diversity metrics','Analyze executive compensation','Track controversy severity','Generate ESG momentum signals','Estimate green premium','Compute CRREM pathways','Track net zero commitments','Score engagement effectiveness'][i],
  category:['Regulatory','Regulatory','Green Finance','Climate','Regulatory','Physical Risk','Transition','Nature','Nature','Supply Chain','Sovereign','Carbon','Governance','Governance','Controversy','Quant','Quant','Real Estate','Climate','Stewardship'][i],
  inputs:[['holdings','esg_scores'],['company_master','csrd_disclosures'],['green_bonds','taxonomy_assessments'],['sbti_targets','emissions'],['tcfd_reports','company_master'],['company_master','climate_data'],['company_master','emissions'],['biodiversity_metrics','company_master'],['water_risk','company_master'],['supply_chain','company_master'],['sovereign_risk','macro_data'],['carbon_credits','registry_data'],['board_composition','company_master'],['executive_pay','company_master'],['controversies','news_data'],['esg_scores','market_data'],['green_bonds','market_data'],['company_master','building_data'],['sbti_targets','emissions','decarbonisation_paths'],['engagement_records','company_master']][i],
  outputs:[['sfdr_pai'],['csrd_disclosures'],['green_bonds'],['sbti_targets'],['tcfd_reports'],['physical_risk_scores'],['transition_scores'],['biodiversity_metrics'],['water_risk'],['supply_chain'],['sovereign_risk'],['carbon_credits'],['board_composition'],['executive_pay'],['controversies'],['esg_momentum'],['greenium_signals'],['crrem_paths'],['net_zero_status'],['engagement_scores']][i],
  depIds: i<5 ? ['E-007'] : [],
}));

const ALL_ENGINES = [...CORE_ENGINES, ...SECONDARY_ENGINES].map((e,i)=>({
  ...e,
  status: sr(i*151) > 0.92 ? 'error' : sr(i*157) > 0.85 ? 'running' : 'idle',
  lastExec: new Date(Date.now() - rngI(1,72,i*161)*3600000).toISOString(),
  avgDuration: rngI(200, 45000, i*167),
  successRate: Math.min(100, 85 + sr(i*173)*15),
  inputReady: sr(i*179) > 0.15,
  outputFreshHours: rngI(0, 48, i*181),
  version: `${rngI(1,4,i*183)}.${rngI(0,12,i*187)}.${rngI(0,30,i*191)}`,
  executionCount: rngI(50, 2000, i*193),
}));

/* ─── Execution History ─── */
const EXEC_HISTORY = Array.from({length:200},(_, i)=>{
  const eng = ALL_ENGINES[i % ALL_ENGINES.length];
  const status = sr(i*201) > 0.92 ? 'error' : sr(i*203) > 0.04 ? 'success' : 'warning';
  const dur = rngI(100, 60000, i*207);
  const inCount = rngI(10, 50000, i*211);
  return {
    id:`EX-${String(i+1).padStart(4,'0')}`,
    engineId:eng.id, engineName:eng.name,
    trigger:TRIGGERS[rngI(0,5,i*213)],
    startTime:new Date(Date.now()-rngI(1,168,i*217)*3600000).toISOString(),
    duration:dur, inputRecords:inCount, outputRecords:Math.floor(inCount*rng(0.5,1.2,i*219)),
    status, errors:status==='error'?rngI(1,10,i*221):0,
    warnings:status==='warning'?rngI(1,5,i*223):0,
    memory:rngI(64,2048,i*227)+'MB',
    params:{ portfolio:sr(i*229)>0.5?`PF-${rngI(1,20,i*231)}`:'ALL', scenario:pick(['Baseline','NGFS_Orderly','NGFS_Disorderly','Hot_House'],i*233), confidence:pick([0.95,0.99,0.999],i*237) },
  };
});

/* ─── Shadow Model Test Cases ─── */
const SHADOW_TESTS = Array.from({length:40},(_, i)=>({
  id:`ST-${String(i+1).padStart(3,'0')}`,
  engineId:ALL_ENGINES[i%10].id,
  engineName:ALL_ENGINES[i%10].name,
  testCase:`TC-${rngI(100,999,i*301)}`,
  entity:`Company-${rngI(1,200,i*303)}`,
  metric:['PD','VaR_95','VaR_99','DMI_Score','Temp_Alignment','Scope1','Scope2','EU_Tax_Align','PCAF_Intensity','Copula_ES'][i%10],
  expected: rng(0.01, 95.0, i*307),
  actual: rng(0.01, 95.0, i*311),
  delta:0,
  pass:false,
  tolerance:pick([0.01,0.05,0.1,0.5,1.0],i*313),
  date:new Date(Date.now()-rngI(0,30,i*317)*86400000).toISOString(),
})).map(t=>({...t, delta:Math.abs(t.actual-t.expected), pass:Math.abs(t.actual-t.expected) <= t.expected*t.tolerance}));

/* ─── Engine Configs ─── */
const ENGINE_CONFIGS = ALL_ENGINES.slice(0,10).map((eng,i)=>({
  engineId:eng.id, engineName:eng.name,
  methodologyVersion:`v${rngI(1,4,i*401)}.${rngI(0,9,i*403)}`,
  refDataVersion:pick(['DEFRA-2025','GWP-AR6','IPCC-AR6','NGFS-v4.2','PCAF-v3','EU-Tax-DR-2024'],i*405),
  estimationPathway:pick(['Direct','Estimated','Modelled','Hybrid','Conservative'],i*407),
  roundingRule:pick(['4dp','2dp','6dp','nearest_int','sig_figs_4'],i*409),
  nullHandling:pick(['Exclude','Zero-fill','Mean-impute','Median-impute','Last-known'],i*411),
  timeout:rngI(30,600,i*413)+'s',
  batchSize:rngI(100,5000,i*415),
  parallelism:rngI(1,8,i*417),
  cacheEnabled:sr(i*419)>0.3,
  lastDeployed:new Date(Date.now()-rngI(1,90,i*421)*86400000).toISOString(),
  changelog:[
    {version:`v${rngI(1,4,i*423)}.${rngI(0,9,i*425)}`,date:new Date(Date.now()-rngI(30,180,i*427)*86400000).toISOString(),change:'Updated methodology coefficients'},
    {version:`v${rngI(1,3,i*429)}.${rngI(0,9,i*431)}`,date:new Date(Date.now()-rngI(180,365,i*433)*86400000).toISOString(),change:'Added null handling for missing sectors'},
    {version:`v${rngI(1,2,i*435)}.${rngI(0,9,i*437)}`,date:new Date(Date.now()-rngI(365,500,i*439)*86400000).toISOString(),change:'Initial production release'},
  ],
  factorVersions:{
    defra:pick(['2024','2025'],i*441),
    gwp:pick(['AR5','AR6'],i*443),
    ipcc:pick(['AR5','AR6'],i*445),
    ngfs:pick(['v3.4','v4.0','v4.2'],i*447),
  },
}));

/* ─── Monthly trend data ─── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── Styles ─── */
const sty = {
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{marginBottom:24},
  title:{fontSize:28,fontWeight:700,color:T.navy,margin:0,letterSpacing:'-0.5px'},
  subtitle:{fontSize:13,color:T.textMut,marginTop:4,fontFamily:T.mono},
  tabBar:{display:'flex',gap:2,background:T.surface,borderRadius:8,padding:3,border:`1px solid ${T.border}`,marginBottom:24,flexWrap:'wrap'},
  tab:(a)=>({padding:'10px 20px',borderRadius:6,border:'none',cursor:'pointer',fontSize:13,fontWeight:a?600:400,fontFamily:T.font,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,transition:'all 0.2s'}),
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:600,color:T.navy,margin:'0 0 12px 0'},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  stat:{textAlign:'center',padding:16,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`},
  statVal:{fontSize:28,fontWeight:700,fontFamily:T.mono},
  statLbl:{fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:'0.5px'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:c+'18',color:c,fontFamily:T.mono}),
  tbl:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:T.mono},
  td:{padding:'8px 10px',borderBottom:`1px solid ${T.borderL}`,fontFamily:T.mono,fontSize:12},
  btn:(primary)=>({padding:'8px 16px',borderRadius:6,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
  input:{padding:'7px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,background:T.surface,color:T.text,width:'100%',boxSizing:'border-box'},
  mono:{fontFamily:T.mono,fontSize:12},
  tag:(color)=>({display:'inline-block',padding:'1px 6px',borderRadius:3,fontSize:10,fontWeight:600,background:color+'15',color}),
  statusDot:(color)=>({display:'inline-block',width:8,height:8,borderRadius:'50%',background:color,marginRight:6}),
  pbar:(pct,color)=>({height:6,borderRadius:3,background:T.borderL,position:'relative',overflow:'hidden',width:'100%'}),
  pbarFill:(pct,color)=>({position:'absolute',left:0,top:0,height:'100%',width:`${Math.min(100,pct)}%`,borderRadius:3,background:color,transition:'width 0.5s'}),
};

const fmtMs = (ms) => ms < 1000 ? `${ms}ms` : ms < 60000 ? `${(ms/1000).toFixed(1)}s` : `${(ms/60000).toFixed(1)}m`;
const timeAgo = (iso) => { const m=Math.floor((Date.now()-new Date(iso).getTime())/60000); return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`; };
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const fmtK = (v) => v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':String(v);
const PIE_COLORS = [T.green,T.sage,T.gold,T.amber,T.red,T.navyL,T.teal,'#7c3aed','#0d9488','#dc2626','#2563eb','#d97706'];

/* ─────────────────────────────────────────────────────────────────────── */
export default function CalculationEngineMonitorPage() {
  const [tab, setTab] = useState(0);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [selectedExec, setSelectedExec] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [filterEngine, setFilterEngine] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('7d');
  const [runningEngines, setRunningEngines] = useState({});
  const [batchRunning, setBatchRunning] = useState(false);
  const [shadowFilter, setShadowFilter] = useState('all');
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [configDiffEngine, setConfigDiffEngine] = useState(null);

  /* ─── Engine stats ─── */
  const engineStats = useMemo(()=>({
    total:ALL_ENGINES.length,
    running:ALL_ENGINES.filter(e=>e.status==='running').length + Object.keys(runningEngines).length,
    errors:ALL_ENGINES.filter(e=>e.status==='error').length,
    avgSuccess:(ALL_ENGINES.reduce((s,e)=>s+e.successRate,0)/ALL_ENGINES.length).toFixed(1),
  }),[runningEngines]);

  /* ─── Filtered history ─── */
  const filteredHistory = useMemo(()=>{
    let arr = [...EXEC_HISTORY];
    if(filterEngine !== 'all') arr = arr.filter(e=>e.engineId===filterEngine);
    if(filterStatus !== 'all') arr = arr.filter(e=>e.status===filterStatus);
    const days = filterDate==='24h'?1:filterDate==='7d'?7:filterDate==='30d'?30:90;
    arr = arr.filter(e=>(Date.now()-new Date(e.startTime).getTime())<days*86400000);
    return arr.sort((a,b)=>new Date(b.startTime)-new Date(a.startTime));
  },[filterEngine,filterStatus,filterDate]);

  /* ─── Execution time trend ─── */
  const execTimeTrend = useMemo(()=>{
    return MONTHS.map((m,mi)=>({
      month:m,
      avgDuration:rngI(500,8000,mi*501),
      p95Duration:rngI(8000,30000,mi*503),
      execCount:rngI(50,200,mi*505),
    }));
  },[]);

  /* ─── Error rate by engine ─── */
  const errorRateData = useMemo(()=>{
    return ALL_ENGINES.slice(0,15).map(e=>({
      name:e.name.length>16?e.name.slice(0,16)+'...':e.name,
      errorRate:100-e.successRate,
    })).sort((a,b)=>b.errorRate-a.errorRate);
  },[]);

  /* ─── Shadow model filtered ─── */
  const filteredShadow = useMemo(()=>{
    let arr = [...SHADOW_TESTS];
    if(shadowFilter !== 'all') arr = arr.filter(t=>t.pass === (shadowFilter==='pass'));
    return arr;
  },[shadowFilter]);

  /* ─── Shadow accuracy trend ─── */
  const shadowTrend = useMemo(()=>{
    return MONTHS.map((m,mi)=>({
      month:m,
      accuracy: 90 + sr(mi*601)*8 + mi*0.2,
      tests:rngI(20,60,mi*603),
    }));
  },[]);

  /* ─── Run engine simulation ─── */
  const runEngine = useCallback((engineId)=>{
    setRunningEngines(prev=>({...prev,[engineId]:true}));
    setTimeout(()=>{ setRunningEngines(prev=>{const n={...prev};delete n[engineId];return n;}); }, 3000+sr(engineId.charCodeAt(2))*2000);
  },[]);

  /* ─── Batch run ─── */
  const runBatch = useCallback(()=>{
    setBatchRunning(true);
    ALL_ENGINES.slice(0,10).forEach((eng,i)=>{
      setTimeout(()=>runEngine(eng.id), i*500);
    });
    setTimeout(()=>setBatchRunning(false), 8000);
  },[runEngine]);

  /* ─── Dependency graph (simple text representation) ─── */
  const depGraph = useMemo(()=>{
    const levels = [];
    const placed = new Set();
    // Level 0: no deps
    levels.push(ALL_ENGINES.filter(e=>!e.depIds.length).map(e=>e.id));
    ALL_ENGINES.filter(e=>!e.depIds.length).forEach(e=>placed.add(e.id));
    // Subsequent levels
    for(let l=1;l<4;l++){
      const next = ALL_ENGINES.filter(e=>!placed.has(e.id)&&e.depIds.every(d=>placed.has(d))).map(e=>e.id);
      if(!next.length) break;
      levels.push(next);
      next.forEach(id=>placed.add(id));
    }
    // Remaining
    const remaining = ALL_ENGINES.filter(e=>!placed.has(e.id)).map(e=>e.id);
    if(remaining.length) levels.push(remaining);
    return levels;
  },[]);

  return (
    <div style={sty.page}>
      <div style={sty.header}>
        <h1 style={sty.title}>Calculation Engine Monitor</h1>
        <div style={sty.subtitle}>PLATFORM ADMINISTRATION :: {ALL_ENGINES.length} ENGINES :: {EXEC_HISTORY.length} RECENT EXECUTIONS :: REAL-TIME STATUS</div>
      </div>

      <div style={sty.tabBar}>
        {TABS.map((t,i)=><button key={t} style={sty.tab(tab===i)} onClick={()=>{setTab(i);setSelectedEngine(null);setSelectedExec(null);}}>{t}</button>)}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 0 — ENGINE STATUS                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===0 && (
        <div>
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{engineStats.total}</div><div style={sty.statLbl}>Total Engines</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navyL}}>{engineStats.running}</div><div style={sty.statLbl}>Running Now</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.red}}>{engineStats.errors}</div><div style={sty.statLbl}>In Error</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{engineStats.avgSuccess}%</div><div style={sty.statLbl}>Avg Success Rate</div></div>
          </div>

          {/* Batch run button */}
          <div style={{...sty.card,display:'flex',gap:12,padding:12,alignItems:'center'}}>
            <button style={sty.btn(true)} onClick={runBatch} disabled={batchRunning}>{batchRunning?'Batch Running...':'Run All Portfolio Engines'}</button>
            <span style={{fontSize:11,color:T.textMut}}>Executes E-001 through E-010 in dependency order</span>
          </div>

          {/* Core Engines */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Core Engines (E-001 to E-010)</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
              {CORE_ENGINES.map(eng=>{
                const isRunning = runningEngines[eng.id];
                const status = isRunning ? 'running' : eng.status;
                const isSelected = selectedEngine===eng.id;
                return (
                  <div key={eng.id} style={{padding:14,borderRadius:8,border:`1px solid ${isSelected?T.gold:T.borderL}`,background:isSelected?T.surfaceH:T.surface,cursor:'pointer'}} onClick={()=>setSelectedEngine(isSelected?null:eng.id)}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={sty.statusDot(STATUS_COLORS[status])}/>
                        <span style={{fontWeight:700,fontSize:13}}>{eng.id}</span>
                        <span style={{fontSize:12,color:T.textSec}}>{eng.name}</span>
                      </div>
                      <span style={sty.badge(STATUS_COLORS[status])}>{(status||'idle').toUpperCase()}</span>
                    </div>
                    <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>{eng.desc}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,fontSize:10}}>
                      <div><span style={{color:T.textMut}}>Avg: </span><span style={sty.mono}>{fmtMs(eng.avgDuration)}</span></div>
                      <div><span style={{color:T.textMut}}>Success: </span><span style={{color:(eng.successRate||0)>=95?T.green:(eng.successRate||0)>=85?T.amber:T.red,fontWeight:600}}>{(eng.successRate||0).toFixed(1)}%</span></div>
                      <div><span style={{color:T.textMut}}>Last: </span><span style={sty.mono}>{timeAgo(eng.lastExec)}</span></div>
                      <div><span style={{color:T.textMut}}>Input: </span><span style={{color:eng.inputReady?T.green:T.red}}>{eng.inputReady?'Ready':'Stale'}</span></div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                      <span style={{fontSize:10,color:T.textMut}}>Output fresh: {eng.outputFreshHours}h ago | v{eng.version}</span>
                      <button style={{...sty.btn(false),padding:'4px 10px',fontSize:11}} onClick={(e)=>{e.stopPropagation();runEngine(eng.id);}} disabled={isRunning}>{isRunning?'Running...':'Run'}</button>
                    </div>
                    {/* Expanded details */}
                    {isSelected && (
                      <div style={{marginTop:12,padding:12,background:T.surface,borderRadius:6,border:`1px solid ${T.borderL}`}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:11}}>
                          <div><span style={{color:T.textMut}}>Category:</span> {eng.category}</div>
                          <div><span style={{color:T.textMut}}>Executions:</span> {fmtK(eng.executionCount)}</div>
                          <div><span style={{color:T.textMut}}>Inputs:</span> {eng.inputs.join(', ')}</div>
                          <div><span style={{color:T.textMut}}>Outputs:</span> {eng.outputs.join(', ')}</div>
                          <div><span style={{color:T.textMut}}>Dependencies:</span> {eng.depIds.length?eng.depIds.join(', '):'None'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary engines table */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Secondary Engines (E-011 to E-030)</h3>
            <div style={{maxHeight:400,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr><th style={sty.th}>ID</th><th style={sty.th}>Name</th><th style={sty.th}>Category</th><th style={sty.th}>Status</th><th style={sty.th}>Success</th><th style={sty.th}>Avg Time</th><th style={sty.th}>Last Run</th><th style={sty.th}>Action</th></tr>
                </thead>
                <tbody>
                  {SECONDARY_ENGINES.map(eng=>{
                    const isRunning = runningEngines[eng.id];
                    const status = isRunning?'running':eng.status;
                    return (
                      <tr key={eng.id}>
                        <td style={{...sty.td,fontWeight:600}}>{eng.id}</td>
                        <td style={{...sty.td,fontFamily:T.font}}>{eng.name}</td>
                        <td style={sty.td}><span style={sty.tag(T.navyL)}>{eng.category}</span></td>
                        <td style={sty.td}><span style={sty.badge(STATUS_COLORS[status])}>{status}</span></td>
                        <td style={sty.td}><span style={{color:(eng.successRate||0)>=95?T.green:T.amber}}>{(eng.successRate||0).toFixed(1)}%</span></td>
                        <td style={sty.td}>{fmtMs(eng.avgDuration)}</td>
                        <td style={sty.td}>{timeAgo(eng.lastExec)}</td>
                        <td style={sty.td}><button style={{...sty.btn(false),padding:'3px 8px',fontSize:10}} onClick={()=>runEngine(eng.id)} disabled={isRunning}>{isRunning?'...':'Run'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dependency graph */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Engine Dependency Graph</h3>
            <div style={{display:'flex',gap:24,overflowX:'auto',padding:'12px 0'}}>
              {depGraph.map((level,li)=>(
                <div key={li} style={{minWidth:140}}>
                  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:8,fontFamily:T.mono}}>Level {li}</div>
                  {level.map(id=>{
                    const eng = ALL_ENGINES.find(e=>e.id===id);
                    return (
                      <div key={id} style={{padding:8,marginBottom:6,borderRadius:6,background:T.surfaceH,border:`1px solid ${T.borderL}`,fontSize:11}}>
                        <div style={{fontWeight:700,color:T.navy}}>{id}</div>
                        <div style={{fontSize:10,color:T.textMut}}>{eng?.name?.slice(0,20)}</div>
                        {eng?.depIds.length>0 && <div style={{fontSize:9,color:T.gold,marginTop:2}}>deps: {eng.depIds.join(',')}</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:T.textMut,marginTop:8}}>Engines execute left-to-right: Level 0 (no dependencies) first, then Level 1 (depends on Level 0), etc.</div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 1 — EXECUTION HISTORY                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===1 && (
        <div>
          {/* Filters */}
          <div style={{...sty.card,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',padding:12}}>
            <select style={{...sty.input,width:180}} value={filterEngine} onChange={e=>setFilterEngine(e.target.value)}>
              <option value="all">All Engines</option>
              {ALL_ENGINES.map(e=><option key={e.id} value={e.id}>{e.id} - {e.name}</option>)}
            </select>
            <select style={{...sty.input,width:120}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
            </select>
            {['24h','7d','30d','90d'].map(d=>(
              <button key={d} style={sty.btn(filterDate===d)} onClick={()=>setFilterDate(d)}>{d}</button>
            ))}
            <span style={{marginLeft:'auto',fontSize:11,color:T.textMut}}>{filteredHistory.length} executions</span>
          </div>

          <div style={sty.grid2}>
            {/* Execution time trend */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Execution Time Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={execTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Line type="monotone" dataKey="avgDuration" stroke={T.navyL} strokeWidth={2} name="Avg (ms)" dot={false}/>
                  <Line type="monotone" dataKey="p95Duration" stroke={T.amber} strokeWidth={2} strokeDasharray="5 5" name="P95 (ms)" dot={false}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Error rate bar */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Error Rate by Engine</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={errorRateData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis type="number" domain={[0,20]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis dataKey="name" type="category" tick={{fontSize:8,fill:T.textMut}} width={120} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="errorRate" fill={T.red} radius={[0,4,4,0]} name="Error %"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History table */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Execution History ({filteredHistory.length})</h3>
            <div style={{maxHeight:500,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>ID</th><th style={sty.th}>Engine</th><th style={sty.th}>Trigger</th><th style={sty.th}>Start</th><th style={sty.th}>Duration</th><th style={sty.th}>In Rec</th><th style={sty.th}>Out Rec</th><th style={sty.th}>Status</th><th style={sty.th}>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.slice(0,80).map(ex=>{
                    const statusColor = ex.status==='success'?T.green:ex.status==='error'?T.red:T.amber;
                    const isSelected = selectedExec===ex.id;
                    return (
                      <React.Fragment key={ex.id}>
                        <tr style={{cursor:'pointer',background:isSelected?T.surfaceH:'transparent'}} onClick={()=>setSelectedExec(isSelected?null:ex.id)}>
                          <td style={{...sty.td,fontWeight:600}}>{ex.id}</td>
                          <td style={{...sty.td,fontFamily:T.font}}>{ex.engineName}</td>
                          <td style={sty.td}><span style={sty.tag(T.navyL)}>{ex.trigger}</span></td>
                          <td style={sty.td}>{new Date(ex.startTime).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                          <td style={sty.td}>{fmtMs(ex.duration)}</td>
                          <td style={sty.td}>{fmtK(ex.inputRecords)}</td>
                          <td style={sty.td}>{fmtK(ex.outputRecords)}</td>
                          <td style={sty.td}><span style={sty.badge(statusColor)}>{ex.status}</span></td>
                          <td style={sty.td}>{ex.errors>0?<span style={{color:T.red,fontWeight:600}}>{ex.errors}</span>:'-'}</td>
                        </tr>
                        {isSelected && (
                          <tr>
                            <td colSpan={9} style={{padding:0}}>
                              <div style={{background:T.surfaceH,padding:16,borderTop:`2px solid ${T.gold}`}}>
                                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,fontSize:11,marginBottom:12}}>
                                  <div><span style={{color:T.textMut}}>Memory:</span> {ex.memory}</div>
                                  <div><span style={{color:T.textMut}}>Warnings:</span> {ex.warnings}</div>
                                  <div><span style={{color:T.textMut}}>Engine ID:</span> {ex.engineId}</div>
                                </div>
                                <h4 style={{fontSize:12,fontWeight:600,marginBottom:8}}>Input Parameters</h4>
                                <div style={{background:T.surface,padding:10,borderRadius:6,border:`1px solid ${T.borderL}`,fontFamily:T.mono,fontSize:11}}>
                                  {Object.entries(ex.params).map(([k,v])=>(
                                    <div key={k}><span style={{color:T.textMut}}>{k}:</span> <span style={{color:T.navy}}>{String(v)}</span></div>
                                  ))}
                                </div>
                                {ex.status==='error' && (
                                  <div style={{marginTop:12}}>
                                    <h4 style={{fontSize:12,fontWeight:600,color:T.red,marginBottom:4}}>Error Log</h4>
                                    <div style={{background:'#fef2f2',padding:10,borderRadius:6,border:`1px solid ${T.red}30`,fontFamily:T.mono,fontSize:11,color:T.red}}>
                                      {Array.from({length:ex.errors},(_,ei)=>(
                                        <div key={ei}>ERR-{rngI(1000,9999,ex.id.charCodeAt(3)+ei)}: {pick(['NullPointerException in factor lookup','Division by zero in ratio calc','Timeout exceeded (30s)','Missing reference data for sector','Invalid ISIN format detected','Correlation matrix not positive definite'],ex.id.charCodeAt(3)+ei*7)}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div style={{marginTop:12}}>
                                  <h4 style={{fontSize:12,fontWeight:600,marginBottom:4}}>Output Summary</h4>
                                  <div style={{fontSize:11,color:T.textSec}}>
                                    Processed {fmtK(ex.inputRecords)} input records in {fmtMs(ex.duration)}. Generated {fmtK(ex.outputRecords)} output records ({((ex.outputRecords/ex.inputRecords)*100).toFixed(1)}% yield). Throughput: {fmtK(Math.floor(ex.inputRecords/(ex.duration/1000)))}/sec.
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 2 — SHADOW MODEL COMPARISON                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===2 && (
        <div>
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{SHADOW_TESTS.length}</div><div style={sty.statLbl}>Test Cases</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{SHADOW_TESTS.filter(t=>t.pass).length}</div><div style={sty.statLbl}>Passing</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.red}}>{SHADOW_TESTS.filter(t=>!t.pass).length}</div><div style={sty.statLbl}>Failing</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.gold}}>{(SHADOW_TESTS.filter(t=>t.pass).length/SHADOW_TESTS.length*100).toFixed(1)}%</div><div style={sty.statLbl}>Accuracy</div></div>
          </div>

          {/* Filter + run */}
          <div style={{...sty.card,display:'flex',gap:12,padding:12,alignItems:'center'}}>
            <button style={sty.btn(true)}>Run Shadow Comparison</button>
            {['all','pass','fail'].map(f=>(
              <button key={f} style={sty.btn(shadowFilter===f)} onClick={()=>setShadowFilter(f)}>
                {f==='all'?'All':f==='pass'?'Passing':'Failing'}
              </button>
            ))}
            <label style={{marginLeft:'auto',fontSize:11,display:'flex',alignItems:'center',gap:4}}>
              <input type="checkbox" checked={showDiffOnly} onChange={e=>setShowDiffOnly(e.target.checked)}/> Show diff only
            </label>
          </div>

          <div style={sty.grid2}>
            {/* Accuracy trend */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Historical Accuracy Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={shadowTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis domain={[80,100]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Area type="monotone" dataKey="accuracy" stroke={T.gold} fill={T.gold} fillOpacity={0.2} strokeWidth={2} name="Accuracy %"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Drift detection */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Drift Detection by Engine</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ALL_ENGINES.slice(0,10).map((e,i)=>({
                  name:e.id,
                  drift: sr(i*701)*5,
                  threshold:2.0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="name" tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="drift" fill={T.amber} radius={[4,4,0,0]} name="Drift %"/>
                  <Bar dataKey="threshold" fill={T.red+'40'} radius={[4,4,0,0]} name="Threshold"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison table */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Shadow Model Test Results ({filteredShadow.length})</h3>
            <div style={{maxHeight:500,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>ID</th><th style={sty.th}>Engine</th><th style={sty.th}>Entity</th><th style={sty.th}>Metric</th><th style={sty.th}>Expected</th><th style={sty.th}>Actual</th><th style={sty.th}>Delta</th><th style={sty.th}>Tolerance</th><th style={sty.th}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShadow.map(t=>(
                    <tr key={t.id} style={{background:!t.pass?T.red+'06':'transparent'}}>
                      <td style={{...sty.td,fontWeight:600}}>{t.id}</td>
                      <td style={{...sty.td,fontFamily:T.font}}>{t.engineName}</td>
                      <td style={sty.td}>{t.entity}</td>
                      <td style={sty.td}><span style={sty.tag(T.navyL)}>{t.metric}</span></td>
                      <td style={sty.td}>{(t.expected||0).toFixed(4)}</td>
                      <td style={sty.td}>{(t.actual||0).toFixed(4)}</td>
                      <td style={sty.td}><span style={{color:t.pass?T.green:T.red,fontWeight:600}}>{(t.delta||0).toFixed(4)}</span></td>
                      <td style={sty.td}>{(t.tolerance*100).toFixed(0)}%</td>
                      <td style={sty.td}><span style={sty.badge(t.pass?T.green:T.red)}>{t.pass?'PASS':'FAIL'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regression alerts */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Regression Alert System</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                {engine:'E-001 PD Exponential',alert:'Accuracy dropped 2.3% this month',severity:'warning',since:'5d ago'},
                {engine:'E-003 Monte Carlo VaR',alert:'P95 execution time increased 40%',severity:'warning',since:'3d ago'},
                {engine:'E-005 ITR Temperature',alert:'Shadow test failure rate >10%',severity:'critical',since:'1d ago'},
                {engine:'E-007 GHG Calculator',alert:'Output drift detected (DEFRA update)',severity:'info',since:'12h ago'},
                {engine:'E-009 PCAF Financed',alert:'All tests passing consistently',severity:'ok',since:'30d'},
                {engine:'E-010 Copula Tail',alert:'Memory usage trending up',severity:'warning',since:'7d ago'},
              ].map((a,i)=>(
                <div key={i} style={{padding:12,borderRadius:8,border:`1px solid ${a.severity==='critical'?T.red:a.severity==='warning'?T.amber:a.severity==='ok'?T.green:T.navyL}30`,background:a.severity==='critical'?T.red+'06':T.surface}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{a.engine}</div>
                  <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>{a.alert}</div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={sty.badge(a.severity==='critical'?T.red:a.severity==='warning'?T.amber:a.severity==='ok'?T.green:T.navyL)}>{(a.severity||'info').toUpperCase()}</span>
                    <span style={{fontSize:10,color:T.textMut}}>{a.since}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 3 — ENGINE CONFIGURATION                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===3 && (
        <div>
          {/* Config cards */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Engine Configurations (Core Engines)</h3>
            <div style={{maxHeight:600,overflowY:'auto'}}>
              {ENGINE_CONFIGS.map(cfg=>{
                const isSelected = selectedConfig===cfg.engineId;
                return (
                  <div key={cfg.engineId} style={{border:`1px solid ${isSelected?T.gold:T.borderL}`,borderRadius:8,marginBottom:12,overflow:'hidden'}}>
                    <div style={{padding:14,background:isSelected?T.surfaceH:T.surface,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}} onClick={()=>setSelectedConfig(isSelected?null:cfg.engineId)}>
                      <div>
                        <span style={{fontWeight:700,fontSize:13}}>{cfg.engineId}</span>
                        <span style={{fontSize:12,color:T.textSec,marginLeft:8}}>{cfg.engineName}</span>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <span style={sty.tag(T.navyL)}>v{cfg.methodologyVersion}</span>
                        <span style={sty.tag(T.sage)}>{cfg.refDataVersion}</span>
                        <span style={{fontSize:10,color:T.textMut}}>Deployed {timeAgo(cfg.lastDeployed)}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{padding:16,borderTop:`2px solid ${T.gold}`,background:T.surfaceH}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Methodology</div>
                            <div style={sty.mono}>{cfg.methodologyVersion}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Reference Data</div>
                            <div style={sty.mono}>{cfg.refDataVersion}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Estimation Pathway</div>
                            <div style={sty.mono}>{cfg.estimationPathway}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Rounding</div>
                            <div style={sty.mono}>{cfg.roundingRule}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Null Handling</div>
                            <div style={sty.mono}>{cfg.nullHandling}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Timeout</div>
                            <div style={sty.mono}>{cfg.timeout}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Batch Size</div>
                            <div style={sty.mono}>{cfg.batchSize}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Parallelism</div>
                            <div style={sty.mono}>{cfg.parallelism} threads</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Cache</div>
                            <div style={sty.mono}>{cfg.cacheEnabled?'Enabled':'Disabled'}</div>
                          </div>
                        </div>

                        {/* Factor version locks */}
                        <h4 style={{fontSize:12,fontWeight:600,marginBottom:8}}>Factor Version Locks</h4>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
                          {Object.entries(cfg.factorVersions).map(([k,v])=>(
                            <div key={k} style={{padding:8,background:T.surface,borderRadius:6,border:`1px solid ${T.borderL}`}}>
                              <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase'}}>{k}</div>
                              <div style={{fontSize:13,fontWeight:600,fontFamily:T.mono}}>{v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Changelog */}
                        <h4 style={{fontSize:12,fontWeight:600,marginBottom:8}}>Methodology Changelog</h4>
                        <table style={sty.tbl}>
                          <thead><tr><th style={sty.th}>Version</th><th style={sty.th}>Date</th><th style={sty.th}>Change</th></tr></thead>
                          <tbody>
                            {cfg.changelog.map((cl,ci)=>(
                              <tr key={ci}>
                                <td style={{...sty.td,fontWeight:600}}>{cl.version}</td>
                                <td style={sty.td}>{fmtDate(cl.date)}</td>
                                <td style={{...sty.td,fontFamily:T.font}}>{cl.change}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Config diff */}
                        <div style={{marginTop:12,display:'flex',gap:8}}>
                          <button style={sty.btn(false)} onClick={()=>setConfigDiffEngine(configDiffEngine===cfg.engineId?null:cfg.engineId)}>
                            {configDiffEngine===cfg.engineId?'Hide Diff':'Show Config Diff (Current vs Last)'}
                          </button>
                          <button style={sty.btn(false)}>Export Config (JSON)</button>
                        </div>

                        {configDiffEngine===cfg.engineId && (
                          <div style={{marginTop:12,background:T.surface,padding:12,borderRadius:6,border:`1px solid ${T.borderL}`,fontFamily:T.mono,fontSize:11}}>
                            <div style={{color:T.green}}>+ methodologyVersion: {cfg.methodologyVersion}</div>
                            <div style={{color:T.red}}>- methodologyVersion: v{rngI(1,3,cfg.engineId.charCodeAt(2))}.{rngI(0,8,cfg.engineId.charCodeAt(3))}</div>
                            <div style={{color:T.green}}>+ refDataVersion: {cfg.refDataVersion}</div>
                            <div style={{color:T.red}}>- refDataVersion: {pick(['DEFRA-2024','GWP-AR5','IPCC-AR5'],cfg.engineId.charCodeAt(2))}</div>
                            <div style={{color:T.textMut}}>  estimationPathway: {cfg.estimationPathway} (unchanged)</div>
                            <div style={{color:T.textMut}}>  roundingRule: {cfg.roundingRule} (unchanged)</div>
                            <div style={{color:T.green}}>+ timeout: {cfg.timeout}</div>
                            <div style={{color:T.red}}>- timeout: {rngI(20,300,cfg.engineId.charCodeAt(2)*7)}s</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Factor version lock manager */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Factor Version Lock Manager</h3>
            <table style={sty.tbl}>
              <thead>
                <tr><th style={sty.th}>Factor Set</th><th style={sty.th}>Current Version</th><th style={sty.th}>Latest Available</th><th style={sty.th}>Engines Using</th><th style={sty.th}>Status</th><th style={sty.th}>Action</th></tr>
              </thead>
              <tbody>
                {[
                  {name:'DEFRA Emission Factors',current:'2025',latest:'2025',engines:4},
                  {name:'GWP (Global Warming Potential)',current:'AR6',latest:'AR6',engines:6},
                  {name:'IPCC Assessment Report',current:'AR6',latest:'AR6',engines:5},
                  {name:'NGFS Scenarios',current:'v4.0',latest:'v4.2',engines:3},
                  {name:'PCAF Methodology',current:'v3',latest:'v3',engines:2},
                  {name:'EU Taxonomy Delegated Regs',current:'2024',latest:'2025',engines:2},
                  {name:'SFDR PAI Definitions',current:'RTS v2',latest:'RTS v3',engines:1},
                  {name:'CSRD ESRS Standards',current:'Set 1',latest:'Set 1',engines:1},
                ].map((f,i)=>{
                  const upToDate = f.current===f.latest;
                  return (
                    <tr key={i}>
                      <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{f.name}</td>
                      <td style={sty.td}><span style={sty.tag(upToDate?T.green:T.amber)}>{f.current}</span></td>
                      <td style={sty.td}>{f.latest}</td>
                      <td style={sty.td}>{f.engines}</td>
                      <td style={sty.td}><span style={sty.badge(upToDate?T.green:T.amber)}>{upToDate?'CURRENT':'UPDATE AVAILABLE'}</span></td>
                      <td style={sty.td}>{!upToDate && <button style={{...sty.btn(false),padding:'3px 8px',fontSize:10}}>Upgrade</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audit export */}
          <div style={{...sty.card,display:'flex',gap:12,justifyContent:'flex-end'}}>
            <button style={sty.btn(false)}>Export All Configs (JSON)</button>
            <button style={sty.btn(false)}>Export Audit Package</button>
            <button style={sty.btn(true)}>Deploy Config Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
