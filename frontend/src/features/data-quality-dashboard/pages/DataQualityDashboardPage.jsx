import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ─── Theme ─── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Deterministic seed ─── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,s)=>arr[Math.floor(sr(s)*arr.length)];
const rng=(min,max,s)=>min+sr(s)*(max-min);
const rngI=(min,max,s)=>Math.floor(rng(min,max,s));

/* ─── Tabs ─── */
const TABS = ['Quality Scorecard','Completeness Analyzer','Freshness Monitor','Validation Rules'];

/* ─── Data Source Definitions ─── */
const DOMAINS = ['Climate Risk','ESG Ratings','Emissions','Governance','Social Impact','Biodiversity','Taxonomy','Sovereign','Physical Risk','Transition','Supply Chain','Reporting'];
const QUALITY_DIMS = ['Completeness','Accuracy','Timeliness','Consistency','Uniqueness'];

const DATA_SOURCES = Array.from({length:47},(_, i)=>({
  id:`DS-${String(i+1).padStart(3,'0')}`,
  name:['EODHD Market Data','MSCI ESG Ratings','S&P Trucost Emissions','CDP Climate Disclosures','Bloomberg ESG','Refinitiv ESG','ISS Governance','Glass Lewis Proxy','RepRisk Controversies','Sustainalytics ESG Risk','FTSE Russell Green Revenues','World Bank Climate','IMF Macro Indicators','NGFS Scenarios','ECB Supervisory','BRSR Filings India','CSRD Reports EU','SFDR Disclosures','GHG Protocol Registry','IPCC AR6 Factors','DEFRA Conversion Factors','EU Taxonomy Compass','Science Based Targets','Climate Action 100+','PRI Signatory Data','GRI Standards DB','SASB Metrics','TCFD Implementations','PCAF Methodology','Net Zero Tracker','Global Coal Exit List','Carbon Tracker','Transition Pathway Initiative','Forest 500','Trase Supply Chain','CDP Water Security','WRI Aqueduct','ENCORE Biodiversity','TNFD Pilots','Ocean Risk Index','Copernicus Climate','NASA GISS Temperature','NOAA Sea Level','World Resources Institute','FAO AQUASTAT','IEA Energy Data','IRENA Renewables'][i],
  domain:DOMAINS[i % 12],
  type:['API','File Upload','Database Sync','Web Scrape','Manual Entry','FTP','Webhook','S3 Bucket','REST API','GraphQL'][i%10],
  completeness: Math.min(99.5, 65 + sr(i*31)*35),
  accuracy: Math.min(99.8, 70 + sr(i*37)*30),
  timeliness: Math.min(100, 55 + sr(i*43)*45),
  consistency: Math.min(99.2, 68 + sr(i*53)*32),
  uniqueness: Math.min(100, 80 + sr(i*61)*20),
  recordCount: rngI(1000, 500000, i*71),
  lastRefresh: new Date(Date.now() - rngI(1, 60*24*30, i*17)*60000).toISOString(),
  refreshFreq:['Real-time','Hourly','Daily','Weekly','Monthly','Quarterly','Annual'][rngI(0,7,i*83)],
  fieldCount: rngI(12, 120, i*97),
  owner:['Data Engineering','Risk Analytics','ESG Research','Compliance','Quant Team','Operations'][rngI(0,6,i*101)],
}));

/* ─── DB Tables ─── */
const DB_TABLES = [
  'portfolios_pg','holdings','company_master','esg_scores','emissions','climate_scenarios',
  'pd_results','var_results','stress_tests','taxonomy_assessments','sfdr_pai','csrd_disclosures',
  'tcfd_reports','engagement_records','proxy_votes','controversies','board_composition',
  'executive_pay','supply_chain','biodiversity_metrics','water_risk','physical_risk_scores',
  'transition_scores','sovereign_risk','green_bonds','carbon_credits','sbti_targets',
  'pcaf_positions','decarbonisation_paths','scenario_outputs','alert_rules','audit_log',
  'user_sessions','api_keys','feature_flags','report_templates','data_imports',
  'validation_results','engine_configs','engine_executions','materiality_assessments',
].map((name,i)=>{
  const cols = Array.from({length: rngI(8,35,i*113)},(_,j)=>({
    name:['id','created_at','updated_at','company_id','portfolio_id','score','value','status','type','category','metric_name','metric_value','currency','country_code','sector','industry','year','quarter','source','methodology','confidence','notes','is_active','version','parent_id','weight','benchmark_id','threshold','unit','scope','description','reference','valid_from','valid_to','approved_by'][j%35] + (j>34?`_${j}`:''),
    nullRate: sr(i*200+j*13) < 0.15 ? rng(0.05, 0.65, i*200+j*17) : rng(0, 0.08, i*200+j*19),
    required: j < 5 || sr(i*200+j*23) > 0.6,
    dataType:['uuid','timestamp','varchar','numeric','boolean','jsonb','integer','text'][rngI(0,8,i*200+j*29)],
  }));
  return {
    name, schema:'public', rowCount: rngI(50, 100000, i*127),
    cols,
    avgCompleteness: 100 - cols.reduce((s,c)=>s+c.nullRate,0)/cols.length*100,
  };
});

/* ─── Validation Rules ─── */
const VALIDATION_RULES = [
  {id:'VR-001',name:'Scope 1 emissions positive for non-financial companies',field:'emissions.scope1',condition:'scope1 > 0 WHERE sector != Finance',severity:'critical'},
  {id:'VR-002',name:'ESG score range 0-100',field:'esg_scores.overall_score',condition:'0 <= score <= 100',severity:'critical'},
  {id:'VR-003',name:'EVIC >= market_cap * 0.5',field:'company_master.evic',condition:'evic >= market_cap * 0.5',severity:'high'},
  {id:'VR-004',name:'PD between 0 and 1',field:'pd_results.pd_value',condition:'0 < pd < 1',severity:'critical'},
  {id:'VR-005',name:'VaR negative (loss convention)',field:'var_results.var_95',condition:'var_95 < 0',severity:'high'},
  {id:'VR-006',name:'Temperature alignment 1.0-6.0C',field:'transition_scores.temp_alignment',condition:'1.0 <= temp <= 6.0',severity:'high'},
  {id:'VR-007',name:'Green bond label present',field:'green_bonds.label',condition:'label IS NOT NULL',severity:'medium'},
  {id:'VR-008',name:'Country code ISO-3166 valid',field:'company_master.country_code',condition:'LENGTH(country_code) = 2',severity:'medium'},
  {id:'VR-009',name:'Currency code ISO-4217 valid',field:'company_master.currency',condition:'currency IN valid_currencies',severity:'medium'},
  {id:'VR-010',name:'Board size 3-30 members',field:'board_composition.board_size',condition:'3 <= board_size <= 30',severity:'medium'},
  {id:'VR-011',name:'Executive pay > 0',field:'executive_pay.total_comp',condition:'total_comp > 0',severity:'low'},
  {id:'VR-012',name:'Emission year >= 2015',field:'emissions.reporting_year',condition:'year >= 2015',severity:'medium'},
  {id:'VR-013',name:'Scope 2 <= Scope 1 * 10',field:'emissions.scope2',condition:'scope2 <= scope1 * 10',severity:'high'},
  {id:'VR-014',name:'SFDR PAI indicators complete',field:'sfdr_pai.indicator_count',condition:'indicator_count >= 14',severity:'critical'},
  {id:'VR-015',name:'Taxonomy alignment 0-100%',field:'taxonomy_assessments.alignment_pct',condition:'0 <= pct <= 100',severity:'critical'},
  {id:'VR-016',name:'Physical risk score 0-10',field:'physical_risk_scores.composite',condition:'0 <= score <= 10',severity:'high'},
  {id:'VR-017',name:'SBTi target year > current year',field:'sbti_targets.target_year',condition:'target_year > 2026',severity:'medium'},
  {id:'VR-018',name:'Carbon credit vintage >= 2020',field:'carbon_credits.vintage',condition:'vintage >= 2020',severity:'medium'},
  {id:'VR-019',name:'Portfolio weights sum to 1.0',field:'holdings.weight',condition:'SUM(weight) BETWEEN 0.99 AND 1.01 PER portfolio',severity:'critical'},
  {id:'VR-020',name:'PCAF data quality score 1-5',field:'pcaf_positions.dq_score',condition:'1 <= dq_score <= 5',severity:'high'},
  {id:'VR-021',name:'Water stress index 0-5',field:'water_risk.stress_index',condition:'0 <= idx <= 5',severity:'medium'},
  {id:'VR-022',name:'Biodiversity MSA 0-1',field:'biodiversity_metrics.msa',condition:'0 <= msa <= 1',severity:'high'},
  {id:'VR-023',name:'Controversy severity 1-5',field:'controversies.severity',condition:'severity IN (1,2,3,4,5)',severity:'medium'},
  {id:'VR-024',name:'Proxy vote direction valid',field:'proxy_votes.direction',condition:'direction IN (For,Against,Abstain,Withhold)',severity:'low'},
  {id:'VR-025',name:'Engagement status valid',field:'engagement_records.status',condition:'status IN (Initiated,In Progress,Escalated,Resolved)',severity:'low'},
  {id:'VR-026',name:'Scenario temperature valid',field:'climate_scenarios.temp_target',condition:'temp_target IN (1.5,2.0,3.0,4.0)',severity:'high'},
  {id:'VR-027',name:'CSRD double materiality flags',field:'csrd_disclosures.dm_flag',condition:'dm_flag IS NOT NULL',severity:'critical'},
  {id:'VR-028',name:'Green asset ratio 0-100%',field:'green_bonds.gar',condition:'0 <= gar <= 100',severity:'high'},
  {id:'VR-029',name:'Stress test loss < 100%',field:'stress_tests.loss_pct',condition:'loss_pct < 100',severity:'critical'},
  {id:'VR-030',name:'Decarbonisation base year exists',field:'decarbonisation_paths.base_year',condition:'base_year IS NOT NULL',severity:'high'},
  {id:'VR-031',name:'Alert threshold positive',field:'alert_rules.threshold',condition:'threshold > 0',severity:'low'},
  {id:'VR-032',name:'Report template version valid',field:'report_templates.version',condition:'version MATCHES semver',severity:'low'},
  {id:'VR-033',name:'ISIN format valid (12 chars)',field:'company_master.isin',condition:'LENGTH(isin) = 12',severity:'critical'},
  {id:'VR-034',name:'Sector GICS code 8 digits',field:'company_master.gics_code',condition:'LENGTH(gics_code) = 8',severity:'medium'},
  {id:'VR-035',name:'Materiality score 0-100',field:'materiality_assessments.score',condition:'0 <= score <= 100',severity:'high'},
  {id:'VR-036',name:'GWP factor > 0',field:'emissions.gwp_factor',condition:'gwp_factor > 0',severity:'critical'},
  {id:'VR-037',name:'DEFRA year matches reporting year',field:'emissions.defra_year',condition:'defra_year = reporting_year OR defra_year = reporting_year - 1',severity:'medium'},
  {id:'VR-038',name:'Sovereign risk rating A-D scale',field:'sovereign_risk.rating',condition:'rating IN (AAA,AA,A,BBB,BB,B,CCC,CC,C,D)',severity:'medium'},
  {id:'VR-039',name:'Supply chain tier 1-4',field:'supply_chain.tier',condition:'tier IN (1,2,3,4)',severity:'low'},
  {id:'VR-040',name:'Feature flag boolean',field:'feature_flags.enabled',condition:'enabled IN (true,false)',severity:'low'},
  {id:'VR-041',name:'Engine execution duration > 0ms',field:'engine_executions.duration_ms',condition:'duration_ms > 0',severity:'medium'},
  {id:'VR-042',name:'Data import row count matches',field:'data_imports.expected_rows',condition:'actual_rows = expected_rows',severity:'high'},
  {id:'VR-043',name:'API key not expired',field:'api_keys.expires_at',condition:'expires_at > NOW()',severity:'critical'},
  {id:'VR-044',name:'User session duration < 24h',field:'user_sessions.duration_min',condition:'duration_min < 1440',severity:'low'},
  {id:'VR-045',name:'Emission factor source documented',field:'emissions.factor_source',condition:'factor_source IS NOT NULL',severity:'high'},
  {id:'VR-046',name:'Net zero target year <= 2050',field:'sbti_targets.nz_year',condition:'nz_year <= 2050',severity:'medium'},
  {id:'VR-047',name:'Transition plan present for high emitters',field:'decarbonisation_paths.plan_id',condition:'plan_id IS NOT NULL WHERE sector IN high_emitters',severity:'critical'},
  {id:'VR-048',name:'TCFD pillar scores populated',field:'tcfd_reports.governance_score',condition:'ALL 4 pillars NOT NULL',severity:'high'},
  {id:'VR-049',name:'Carbon credit retirement date valid',field:'carbon_credits.retirement_date',condition:'retirement_date <= NOW()',severity:'medium'},
  {id:'VR-050',name:'Holdings quantity positive',field:'holdings.quantity',condition:'quantity > 0',severity:'critical'},
].map((r,i)=>({
  ...r,
  passRate: Math.min(99.9, 75 + sr(i*131)*25),
  failingEntities: rngI(0, 85, i*137),
  lastRun: new Date(Date.now() - rngI(1,48,i*139)*3600000).toISOString(),
  trend: Array.from({length:12},(_,m)=>({ month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m], rate: Math.min(99.9, 75 + sr(i*131+m*7)*25 + m*0.3) })),
  enabled: sr(i*143) > 0.1,
}));

/* ─── Monthly quality trend ─── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthlyQuality = MONTHS.map((m,i)=>({
  month:m,
  completeness: 82 + sr(i*201)*8 + i*0.4,
  accuracy: 85 + sr(i*211)*7 + i*0.3,
  timeliness: 70 + sr(i*221)*12 + i*0.5,
  consistency: 78 + sr(i*231)*10 + i*0.35,
  overall: 80 + sr(i*241)*6 + i*0.4,
}));

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
  pbar:(pct,color)=>({height:6,borderRadius:3,background:T.borderL,position:'relative',overflow:'hidden',width:'100%'}),
  pbarFill:(pct,color)=>({position:'absolute',left:0,top:0,height:'100%',width:`${Math.min(100,pct)}%`,borderRadius:3,background:color,transition:'width 0.5s'}),
  heatCell:(val)=>({width:40,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,fontSize:10,fontWeight:600,fontFamily:T.mono,color:'#fff',background: val>=90?T.green : val>=75?T.sage : val>=60?T.amber : T.red}),
  tag:(color)=>({display:'inline-block',padding:'1px 6px',borderRadius:3,fontSize:10,fontWeight:600,background:color+'15',color}),
};

const qualityColor = (v) => v >= 90 ? T.green : v >= 75 ? T.sage : v >= 60 ? T.amber : T.red;
const severityColor = (s) => s === 'critical' ? T.red : s === 'high' ? T.amber : s === 'medium' ? T.gold : T.textMut;
const fmtPct = (v) => v.toFixed(1) + '%';
const fmtK = (v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(1)+'K' : String(v);
const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime())/60000);
  if(mins < 60) return `${mins}m ago`;
  if(mins < 1440) return `${Math.floor(mins/60)}h ago`;
  return `${Math.floor(mins/1440)}d ago`;
};

/* ─────────────────────────────────────────────────────────────────────── */
/*  COMPONENT                                                            */
/* ─────────────────────────────────────────────────────────────────────── */
export default function DataQualityDashboardPage() {
  const [tab, setTab] = useState(0);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [qualityThreshold, setQualityThreshold] = useState(80);
  const [freshnessFilter, setFreshnessFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [scanRunning, setScanRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [customRules, setCustomRules] = useState([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleField, setNewRuleField] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [sortCol, setSortCol] = useState('completeness');
  const [sortDir, setSortDir] = useState('asc');

  /* Overall platform quality */
  const overallQuality = useMemo(()=>{
    const avg = (arr, fn) => arr.reduce((s,x)=>s+fn(x),0)/arr.length;
    return {
      completeness: avg(DATA_SOURCES, s=>s.completeness),
      accuracy: avg(DATA_SOURCES, s=>s.accuracy),
      timeliness: avg(DATA_SOURCES, s=>s.timeliness),
      consistency: avg(DATA_SOURCES, s=>s.consistency),
      uniqueness: avg(DATA_SOURCES, s=>s.uniqueness),
      overall: avg(DATA_SOURCES, s=>(s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5),
    };
  },[]);

  /* Sorted sources */
  const sortedSources = useMemo(()=>{
    let arr = [...DATA_SOURCES];
    if(searchQ) arr = arr.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.domain.toLowerCase().includes(searchQ.toLowerCase()));
    arr.sort((a,b)=> sortDir==='asc' ? a[sortCol]-b[sortCol] : b[sortCol]-a[sortCol]);
    return arr;
  },[searchQ, sortCol, sortDir]);

  /* Domain quality heatmap */
  const domainHeatmap = useMemo(()=>{
    return DOMAINS.map(domain => {
      const sources = DATA_SOURCES.filter(s=>s.domain===domain);
      if(!sources.length) return { domain, completeness:0, accuracy:0, timeliness:0, consistency:0, uniqueness:0 };
      const avg = (fn) => sources.reduce((s,x)=>s+fn(x),0)/sources.length;
      return { domain, completeness:avg(s=>s.completeness), accuracy:avg(s=>s.accuracy), timeliness:avg(s=>s.timeliness), consistency:avg(s=>s.consistency), uniqueness:avg(s=>s.uniqueness) };
    });
  },[]);

  /* Radar chart data */
  const radarData = useMemo(()=> QUALITY_DIMS.map(d=>({ dim:d, value:overallQuality[d.toLowerCase()] })),[overallQuality]);

  /* Alerts: sources below threshold */
  const qualityAlerts = useMemo(()=>{
    return DATA_SOURCES.filter(s=>{
      const avg = (s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5;
      return avg < qualityThreshold;
    }).sort((a,b)=>{
      const aAvg = (a.completeness+a.accuracy+a.timeliness+a.consistency+a.uniqueness)/5;
      const bAvg = (b.completeness+b.accuracy+b.timeliness+b.consistency+b.uniqueness)/5;
      return aAvg - bAvg;
    });
  },[qualityThreshold]);

  /* Freshness filtered sources */
  const freshnessSources = useMemo(()=>{
    let arr = [...DATA_SOURCES];
    if(freshnessFilter === 'stale_24h') arr = arr.filter(s=> (Date.now()-new Date(s.lastRefresh).getTime()) > 86400000);
    else if(freshnessFilter === 'stale_7d') arr = arr.filter(s=> (Date.now()-new Date(s.lastRefresh).getTime()) > 604800000);
    else if(freshnessFilter === 'stale_30d') arr = arr.filter(s=> (Date.now()-new Date(s.lastRefresh).getTime()) > 2592000000);
    return arr.sort((a,b)=> new Date(b.lastRefresh) - new Date(a.lastRefresh));
  },[freshnessFilter]);

  /* Critical gaps */
  const criticalGaps = useMemo(()=>{
    const gaps = [];
    DB_TABLES.forEach(tbl => {
      tbl.cols.forEach(col => {
        if(col.required && col.nullRate > 0.20) {
          gaps.push({ table:tbl.name, column:col.name, nullRate:col.nullRate, dataType:col.dataType, rows:tbl.rowCount, affectedRows:Math.floor(tbl.rowCount*col.nullRate) });
        }
      });
    });
    return gaps.sort((a,b)=>b.nullRate-a.nullRate);
  },[]);

  /* Validation filtered */
  const filteredRules = useMemo(()=>{
    let arr = [...VALIDATION_RULES, ...customRules];
    if(severityFilter !== 'all') arr = arr.filter(r=>r.severity===severityFilter);
    return arr;
  },[severityFilter, customRules]);

  /* Scan animation */
  const runScan = useCallback(()=>{
    setScanRunning(true);
    setScanProgress(0);
    let p = 0;
    const iv = setInterval(()=>{
      p += 2 + sr(p)*3;
      if(p >= 100) { p=100; clearInterval(iv); setTimeout(()=>{ setScanRunning(false); setScanProgress(0); },500); }
      setScanProgress(Math.min(100,p));
    }, 60);
  },[]);

  /* Add custom rule */
  const addCustomRule = useCallback(()=>{
    if(!newRuleName || !newRuleField || !newRuleCondition) return;
    const newRule = {
      id:`VR-C${customRules.length+1}`, name:newRuleName, field:newRuleField, condition:newRuleCondition,
      severity:'medium', passRate:85+sr(customRules.length*777)*15, failingEntities:rngI(0,30,customRules.length*888),
      lastRun:new Date().toISOString(), trend:Array.from({length:12},(_,m)=>({month:MONTHS[m],rate:80+sr(customRules.length*999+m)*20})), enabled:true,
    };
    setCustomRules(prev=>[...prev, newRule]);
    setNewRuleName(''); setNewRuleField(''); setNewRuleCondition('');
  },[newRuleName, newRuleField, newRuleCondition, customRules]);

  /* Toggle sort */
  const toggleSort = (col) => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ─── PIE colors ─── */
  const PIE_COLORS = [T.green, T.sage, T.gold, T.amber, T.red, T.navyL, T.teal, '#7c3aed', '#0d9488', '#dc2626', '#2563eb', '#d97706'];

  /* ─── Freshness SLA data ─── */
  const freshnessSLA = useMemo(()=>{
    const types = ['Real-time','Hourly','Daily','Weekly','Monthly','Quarterly','Annual'];
    return types.map(t => {
      const sources = DATA_SOURCES.filter(s=>s.refreshFreq===t);
      const maxLag = t==='Real-time'?5:t==='Hourly'?60:t==='Daily'?1440:t==='Weekly'?10080:t==='Monthly'?43200:t==='Quarterly'?129600:525600;
      const onSLA = sources.filter(s=> (Date.now()-new Date(s.lastRefresh).getTime())/60000 <= maxLag*1.5).length;
      return { type:t, total:sources.length, onSLA, pct:sources.length?onSLA/sources.length*100:0 };
    });
  },[]);

  /* ─── Refresh timeline ─── */
  const refreshTimeline = useMemo(()=>{
    return Array.from({length:24},(_, h)=>({
      hour:`${String(h).padStart(2,'0')}:00`,
      refreshes: DATA_SOURCES.filter(s=> new Date(s.lastRefresh).getHours() === h).length,
    }));
  },[]);

  return (
    <div style={sty.page}>
      {/* Header */}
      <div style={sty.header}>
        <h1 style={sty.title}>Data Quality Dashboard</h1>
        <div style={sty.subtitle}>PLATFORM ADMINISTRATION :: 47 DATA SOURCES :: {DB_TABLES.length} DATABASE TABLES :: {VALIDATION_RULES.length + customRules.length} VALIDATION RULES</div>
      </div>

      {/* Tab bar */}
      <div style={sty.tabBar}>
        {TABS.map((t,i)=><button key={t} style={sty.tab(tab===i)} onClick={()=>{setTab(i);setSelectedSource(null);setSelectedTable(null);setSelectedRule(null);}}>{t}</button>)}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 0 — QUALITY SCORECARD                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===0 && (
        <div>
          {/* Overall score banner */}
          <div style={{...sty.card, background:`linear-gradient(135deg, ${T.navy}, ${T.navyL})`, color:'#fff', display:'flex', alignItems:'center', gap:32}}>
            <div style={{textAlign:'center', minWidth:140}}>
              <div style={{fontSize:56,fontWeight:800,fontFamily:T.mono,lineHeight:1}}>{overallQuality.overall.toFixed(1)}</div>
              <div style={{fontSize:12,opacity:0.7,marginTop:4}}>PLATFORM QUALITY SCORE</div>
            </div>
            <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
              {QUALITY_DIMS.map(d=>(
                <div key={d} style={{textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>{overallQuality[d.toLowerCase()].toFixed(1)}%</div>
                  <div style={{fontSize:10,opacity:0.6,textTransform:'uppercase'}}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={sty.grid2}>
            {/* Quality trend area chart */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Quality Trend (12 Months)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyQuality}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis domain={[60,100]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Area type="monotone" dataKey="completeness" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2} name="Completeness"/>
                  <Area type="monotone" dataKey="accuracy" stroke={T.navyL} fill={T.navyL} fillOpacity={0.1} strokeWidth={2} name="Accuracy"/>
                  <Area type="monotone" dataKey="timeliness" stroke={T.amber} fill={T.amber} fillOpacity={0.1} strokeWidth={2} name="Timeliness"/>
                  <Area type="monotone" dataKey="consistency" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} name="Consistency"/>
                  <Legend iconType="line" wrapperStyle={{fontSize:10}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Radar */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Quality Dimensions Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL}/>
                  <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.textSec}}/>
                  <PolarRadiusAxis domain={[60,100]} tick={{fontSize:9,fill:T.textMut}}/>
                  <Radar name="Score" dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.3} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Domain heatmap */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Domain Quality Heatmap (12 Domains x 5 Dimensions)</h3>
            <div style={{overflowX:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>Domain</th>
                    {QUALITY_DIMS.map(d=><th key={d} style={{...sty.th,textAlign:'center'}}>{d}</th>)}
                    <th style={{...sty.th,textAlign:'center'}}>Average</th>
                  </tr>
                </thead>
                <tbody>
                  {domainHeatmap.map(row=>{
                    const avg = (row.completeness+row.accuracy+row.timeliness+row.consistency+row.uniqueness)/5;
                    return (
                      <tr key={row.domain} style={{cursor:'default'}}>
                        <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{row.domain}</td>
                        {['completeness','accuracy','timeliness','consistency','uniqueness'].map(dim=>(
                          <td key={dim} style={{...sty.td,textAlign:'center'}}>
                            <div style={sty.heatCell(row[dim])}>{row[dim].toFixed(0)}</div>
                          </td>
                        ))}
                        <td style={{...sty.td,textAlign:'center'}}><span style={sty.badge(qualityColor(avg))}>{avg.toFixed(1)}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alert threshold */}
          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{...sty.cardTitle,margin:0}}>Quality Threshold Alerts</h3>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:11,color:T.textMut}}>Threshold:</span>
                <input type="range" min={50} max={95} value={qualityThreshold} onChange={e=>setQualityThreshold(Number(e.target.value))} style={{width:120}}/>
                <span style={{...sty.mono,fontWeight:600}}>{qualityThreshold}%</span>
              </div>
            </div>
            {qualityAlerts.length === 0 ? (
              <div style={{textAlign:'center',padding:24,color:T.green,fontWeight:600}}>All sources above threshold</div>
            ) : (
              <div style={{maxHeight:300,overflowY:'auto'}}>
                {qualityAlerts.map(s=>{
                  const avg = (s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5;
                  return (
                    <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',borderBottom:`1px solid ${T.borderL}`,cursor:'pointer',background:selectedSource===s.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedSource(selectedSource===s.id?null:s.id)}>
                      <span style={sty.badge(T.red)}>{avg.toFixed(1)}%</span>
                      <span style={{fontWeight:600,fontSize:13}}>{s.name}</span>
                      <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{s.domain}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Source ranking */}
          <div style={sty.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{...sty.cardTitle,margin:0}}>All 47 Sources Ranked</h3>
              <input style={{...sty.input,width:240}} placeholder="Search sources..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            </div>
            <div style={{maxHeight:400,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>#</th>
                    <th style={sty.th}>Source</th>
                    <th style={sty.th}>Domain</th>
                    {['completeness','accuracy','timeliness','consistency'].map(c=>(
                      <th key={c} style={{...sty.th,cursor:'pointer',textDecoration:sortCol===c?'underline':'none'}} onClick={()=>toggleSort(c)}>{c.slice(0,4).toUpperCase()}{sortCol===c?(sortDir==='asc'?' ^':' v'):''}</th>
                    ))}
                    <th style={sty.th}>AVG</th>
                    <th style={sty.th}>Records</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSources.map((s,i)=>{
                    const avg = (s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5;
                    const isSelected = selectedSource===s.id;
                    return (
                      <React.Fragment key={s.id}>
                        <tr style={{cursor:'pointer',background:isSelected?T.surfaceH:'transparent'}} onClick={()=>setSelectedSource(isSelected?null:s.id)}>
                          <td style={sty.td}>{i+1}</td>
                          <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{s.name}</td>
                          <td style={sty.td}><span style={sty.tag(T.navyL)}>{s.domain}</span></td>
                          <td style={sty.td}><span style={{color:qualityColor(s.completeness)}}>{fmtPct(s.completeness)}</span></td>
                          <td style={sty.td}><span style={{color:qualityColor(s.accuracy)}}>{fmtPct(s.accuracy)}</span></td>
                          <td style={sty.td}><span style={{color:qualityColor(s.timeliness)}}>{fmtPct(s.timeliness)}</span></td>
                          <td style={sty.td}><span style={{color:qualityColor(s.consistency)}}>{fmtPct(s.consistency)}</span></td>
                          <td style={sty.td}><span style={sty.badge(qualityColor(avg))}>{avg.toFixed(1)}</span></td>
                          <td style={sty.td}>{fmtK(s.recordCount)}</td>
                        </tr>
                        {/* Drill-down */}
                        {isSelected && (
                          <tr>
                            <td colSpan={9} style={{padding:0}}>
                              <div style={{background:T.surfaceH,padding:16,borderTop:`2px solid ${T.gold}`}}>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:12}}>
                                  <div><span style={{fontSize:11,color:T.textMut}}>Type:</span> <span style={sty.mono}>{s.type}</span></div>
                                  <div><span style={{fontSize:11,color:T.textMut}}>Refresh:</span> <span style={sty.mono}>{s.refreshFreq}</span></div>
                                  <div><span style={{fontSize:11,color:T.textMut}}>Owner:</span> <span style={sty.mono}>{s.owner}</span></div>
                                  <div><span style={{fontSize:11,color:T.textMut}}>Fields:</span> <span style={sty.mono}>{s.fieldCount}</span></div>
                                  <div><span style={{fontSize:11,color:T.textMut}}>Last Refresh:</span> <span style={sty.mono}>{timeAgo(s.lastRefresh)}</span></div>
                                  <div><span style={{fontSize:11,color:T.textMut}}>Uniqueness:</span> <span style={{...sty.mono,color:qualityColor(s.uniqueness)}}>{fmtPct(s.uniqueness)}</span></div>
                                </div>
                                <h4 style={{fontSize:12,fontWeight:600,marginBottom:8}}>Per-Field Quality Metrics (sample)</h4>
                                <table style={sty.tbl}>
                                  <thead>
                                    <tr>
                                      <th style={sty.th}>Field</th><th style={sty.th}>Type</th><th style={sty.th}>Null %</th><th style={sty.th}>Quality</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Array.from({length:Math.min(10,s.fieldCount)},(_, fi)=>{
                                      const nullR = sr(s.recordCount*31+fi*17)*0.3;
                                      const q = 100 - nullR*100;
                                      return (
                                        <tr key={fi}>
                                          <td style={sty.td}>{['isin','name','sector','country','score','value','date','status','type','source'][fi]}</td>
                                          <td style={sty.td}>{'varchar,varchar,varchar,varchar,numeric,numeric,timestamp,varchar,varchar,varchar'.split(',')[fi]}</td>
                                          <td style={sty.td}><span style={{color:qualityColor(100-nullR*100)}}>{(nullR*100).toFixed(1)}%</span></td>
                                          <td style={sty.td}>
                                            <div style={sty.pbar(q,qualityColor(q))}>
                                              <div style={sty.pbarFill(q,qualityColor(q))}/>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
      {/*  TAB 1 — COMPLETENESS ANALYZER                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===1 && (
        <div>
          {/* Stats row */}
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{DB_TABLES.length}</div><div style={sty.statLbl}>Database Tables</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{(DB_TABLES.reduce((s,t)=>s+t.avgCompleteness,0)/DB_TABLES.length).toFixed(1)}%</div><div style={sty.statLbl}>Avg Completeness</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.red}}>{criticalGaps.length}</div><div style={sty.statLbl}>Critical Gaps</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.gold}}>{DB_TABLES.reduce((s,t)=>s+t.cols.length,0)}</div><div style={sty.statLbl}>Total Columns</div></div>
          </div>

          <div style={sty.grid2}>
            {/* Column null distribution */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Column Null Rate Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  {range:'0-1%', count: DB_TABLES.reduce((s,t)=>s+t.cols.filter(c=>c.nullRate<=0.01).length,0)},
                  {range:'1-5%', count: DB_TABLES.reduce((s,t)=>s+t.cols.filter(c=>c.nullRate>0.01&&c.nullRate<=0.05).length,0)},
                  {range:'5-10%', count: DB_TABLES.reduce((s,t)=>s+t.cols.filter(c=>c.nullRate>0.05&&c.nullRate<=0.10).length,0)},
                  {range:'10-20%', count: DB_TABLES.reduce((s,t)=>s+t.cols.filter(c=>c.nullRate>0.10&&c.nullRate<=0.20).length,0)},
                  {range:'20-50%', count: DB_TABLES.reduce((s,t)=>s+t.cols.filter(c=>c.nullRate>0.20&&c.nullRate<=0.50).length,0)},
                  {range:'>50%', count: DB_TABLES.reduce((s,t)=>s+t.cols.filter(c=>c.nullRate>0.50).length,0)},
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="range" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="count" fill={T.navyL} radius={[4,4,0,0]} name="Columns"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Completeness by geography */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Data Coverage by Geography</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={['North America','Europe','Asia Pacific','Latin America','Middle East','Africa'].map((g,i)=>({
                  geo:g, completeness:70+sr(i*301)*25, sources:rngI(5,20,i*311),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="geo" tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="completeness" fill={T.sage} radius={[4,4,0,0]} name="Completeness %"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completeness trend by table */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Completeness Trend (Top 6 Tables)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={MONTHS.map((m,mi)=>({
                month:m,
                ...Object.fromEntries(DB_TABLES.slice(0,6).map((t,ti)=>[t.name, Math.min(100, t.avgCompleteness - 8 + mi*0.7 + sr(ti*400+mi)*3)])),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                <YAxis domain={[60,100]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                {DB_TABLES.slice(0,6).map((t,i)=>(
                  <Line key={t.name} type="monotone" dataKey={t.name} stroke={PIE_COLORS[i]} strokeWidth={2} dot={false}/>
                ))}
                <Legend wrapperStyle={{fontSize:9}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Critical gaps */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Critical Gaps (Required Columns with &gt;20% Nulls) &mdash; {criticalGaps.length} issues</h3>
            <div style={{maxHeight:350,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>Priority</th><th style={sty.th}>Table</th><th style={sty.th}>Column</th><th style={sty.th}>Type</th><th style={sty.th}>Null Rate</th><th style={sty.th}>Affected Rows</th><th style={sty.th}>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalGaps.slice(0,40).map((g,i)=>(
                    <tr key={i} style={{background:i<5?T.red+'08':'transparent'}}>
                      <td style={sty.td}><span style={sty.badge(i<5?T.red:i<15?T.amber:T.gold)}>P{i<5?1:i<15?2:3}</span></td>
                      <td style={{...sty.td,fontWeight:600}}>{g.table}</td>
                      <td style={sty.td}>{g.column}</td>
                      <td style={sty.td}>{g.dataType}</td>
                      <td style={sty.td}><span style={{color:T.red,fontWeight:600}}>{(g.nullRate*100).toFixed(1)}%</span></td>
                      <td style={sty.td}>{fmtK(g.affectedRows)}</td>
                      <td style={sty.td}><div style={sty.pbar(g.nullRate*100,T.red)}><div style={sty.pbarFill(g.nullRate*100,T.red)}/></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-table breakdown */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Per-Table Completeness</h3>
            <div style={{maxHeight:500,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>Table</th><th style={sty.th}>Rows</th><th style={sty.th}>Columns</th><th style={sty.th}>Avg Completeness</th><th style={sty.th}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {DB_TABLES.map((t,i)=>(
                    <React.Fragment key={t.name}>
                      <tr style={{cursor:'pointer',background:selectedTable===t.name?T.surfaceH:'transparent'}} onClick={()=>setSelectedTable(selectedTable===t.name?null:t.name)}>
                        <td style={{...sty.td,fontWeight:600}}>{t.name}</td>
                        <td style={sty.td}>{fmtK(t.rowCount)}</td>
                        <td style={sty.td}>{t.cols.length}</td>
                        <td style={sty.td}><span style={{color:qualityColor(t.avgCompleteness),fontWeight:600}}>{t.avgCompleteness.toFixed(1)}%</span></td>
                        <td style={{...sty.td,width:120}}><div style={sty.pbar(t.avgCompleteness,qualityColor(t.avgCompleteness))}><div style={sty.pbarFill(t.avgCompleteness,qualityColor(t.avgCompleteness))}/></div></td>
                      </tr>
                      {selectedTable===t.name && (
                        <tr>
                          <td colSpan={5} style={{padding:0}}>
                            <div style={{background:T.surfaceH,padding:12,borderTop:`2px solid ${T.gold}`}}>
                              <table style={sty.tbl}>
                                <thead><tr><th style={sty.th}>Column</th><th style={sty.th}>Type</th><th style={sty.th}>Required</th><th style={sty.th}>Null %</th><th style={sty.th}>Fill Rate</th></tr></thead>
                                <tbody>
                                  {t.cols.map((c,ci)=>{
                                    const fill = 100 - c.nullRate*100;
                                    return (
                                      <tr key={ci}>
                                        <td style={sty.td}>{c.name}</td>
                                        <td style={sty.td}>{c.dataType}</td>
                                        <td style={sty.td}>{c.required ? <span style={sty.badge(T.red)}>REQ</span> : <span style={{color:T.textMut}}>opt</span>}</td>
                                        <td style={sty.td}><span style={{color:qualityColor(fill)}}>{(c.nullRate*100).toFixed(1)}%</span></td>
                                        <td style={{...sty.td,width:100}}><div style={sty.pbar(fill,qualityColor(fill))}><div style={sty.pbarFill(fill,qualityColor(fill))}/></div></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coverage by sector */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Data Coverage by Sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={['Energy','Materials','Industrials','Consumer Disc.','Consumer Staples','Healthcare','Financials','IT','Telecom','Utilities','Real Estate'].map((s,i)=>({
                sector:s, coverage:65+sr(i*501)*35, companies:rngI(20,200,i*511),
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                <YAxis dataKey="sector" type="category" tick={{fontSize:9,fill:T.textMut}} width={100} stroke={T.borderL}/>
                <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                <Bar dataKey="coverage" fill={T.sage} radius={[0,4,4,0]} name="Coverage %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 2 — FRESHNESS MONITOR                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===2 && (
        <div>
          {/* Staleness stats */}
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{DATA_SOURCES.filter(s=>(Date.now()-new Date(s.lastRefresh).getTime())<3600000).length}</div><div style={sty.statLbl}>Fresh (&lt;1h)</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.amber}}>{DATA_SOURCES.filter(s=>{const d=Date.now()-new Date(s.lastRefresh).getTime();return d>=86400000&&d<604800000;}).length}</div><div style={sty.statLbl}>Stale (1-7d)</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.red}}>{DATA_SOURCES.filter(s=>(Date.now()-new Date(s.lastRefresh).getTime())>=604800000).length}</div><div style={sty.statLbl}>Very Stale (&gt;7d)</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navyL}}>{freshnessSLA.filter(s=>s.pct>=90).length}/{freshnessSLA.length}</div><div style={sty.statLbl}>SLAs Met</div></div>
          </div>

          {/* Filters */}
          <div style={{...sty.card,display:'flex',gap:8,padding:12}}>
            {['all','stale_24h','stale_7d','stale_30d'].map(f=>(
              <button key={f} style={sty.btn(freshnessFilter===f)} onClick={()=>setFreshnessFilter(f)}>
                {f==='all'?'All Sources':f==='stale_24h'?'Stale >24h':f==='stale_7d'?'Stale >7d':'Stale >30d'}
              </button>
            ))}
          </div>

          <div style={sty.grid2}>
            {/* Freshness SLA dashboard */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Freshness SLA Dashboard</h3>
              <table style={sty.tbl}>
                <thead>
                  <tr><th style={sty.th}>Data Type</th><th style={sty.th}>Sources</th><th style={sty.th}>On SLA</th><th style={sty.th}>SLA %</th><th style={sty.th}>Status</th></tr>
                </thead>
                <tbody>
                  {freshnessSLA.map(s=>(
                    <tr key={s.type}>
                      <td style={{...sty.td,fontWeight:600}}>{s.type}</td>
                      <td style={sty.td}>{s.total}</td>
                      <td style={sty.td}>{s.onSLA}</td>
                      <td style={sty.td}><span style={{color:qualityColor(s.pct),fontWeight:600}}>{s.pct.toFixed(0)}%</span></td>
                      <td style={sty.td}><span style={sty.badge(s.pct>=90?T.green:s.pct>=70?T.amber:T.red)}>{s.pct>=90?'OK':s.pct>=70?'WARN':'BREACH'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Refresh timeline */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Refresh Activity (Last 24h)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={refreshTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="hour" tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL} interval={2}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="refreshes" fill={T.navyL} radius={[4,4,0,0]} name="Refreshes"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Freshness by data type */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Expected Freshness by Data Type</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                {type:'Market Prices',expected:'Real-time',icon:'$',color:T.green},
                {type:'ESG Ratings',expected:'Quarterly',icon:'R',color:T.navyL},
                {type:'Emissions Data',expected:'Annual',icon:'E',color:T.sage},
                {type:'Regulatory Filings',expected:'Semi-annual',icon:'F',color:T.gold},
                {type:'Controversy Alerts',expected:'Daily',icon:'!',color:T.red},
                {type:'Climate Scenarios',expected:'Annual',icon:'S',color:T.teal},
                {type:'Board/Governance',expected:'Annual',icon:'G',color:T.amber},
                {type:'Supply Chain',expected:'Quarterly',icon:'C',color:'#7c3aed'},
              ].map((dt,i)=>(
                <div key={dt.type} style={{padding:12,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <div style={{width:28,height:28,borderRadius:6,background:dt.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:dt.color}}>{dt.icon}</div>
                    <div style={{fontSize:12,fontWeight:600}}>{dt.type}</div>
                  </div>
                  <div style={{fontSize:11,color:T.textMut}}>Expected: <span style={{color:dt.color,fontWeight:600}}>{dt.expected}</span></div>
                  <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Sources: {rngI(2,8,i*601)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Data lag analysis */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Data Lag Analysis</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={DATA_SOURCES.slice(0,20).map(s=>({
                name:s.name.length>18?s.name.slice(0,18)+'...':s.name,
                lagHours:Math.floor((Date.now()-new Date(s.lastRefresh).getTime())/3600000),
              })).sort((a,b)=>b.lagHours-a.lagHours)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL} label={{value:'Hours Behind',fontSize:10,fill:T.textMut}}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:8,fill:T.textMut}} width={130} stroke={T.borderL}/>
                <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                <Bar dataKey="lagHours" fill={T.amber} radius={[0,4,4,0]} name="Lag (hours)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Source-by-source refresh list */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Source Refresh Status ({freshnessSources.length} sources)</h3>
            <div style={{maxHeight:400,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>Source</th><th style={sty.th}>Type</th><th style={sty.th}>Frequency</th><th style={sty.th}>Last Refresh</th><th style={sty.th}>Age</th><th style={sty.th}>Status</th><th style={sty.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {freshnessSources.map(s=>{
                    const ageMins = Math.floor((Date.now()-new Date(s.lastRefresh).getTime())/60000);
                    const status = ageMins < 60 ? 'fresh' : ageMins < 1440 ? 'ok' : ageMins < 10080 ? 'stale' : 'critical';
                    const statusColor = status==='fresh'?T.green:status==='ok'?T.sage:status==='stale'?T.amber:T.red;
                    return (
                      <tr key={s.id}>
                        <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{s.name}</td>
                        <td style={sty.td}><span style={sty.tag(T.navyL)}>{s.type}</span></td>
                        <td style={sty.td}>{s.refreshFreq}</td>
                        <td style={sty.td}>{new Date(s.lastRefresh).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                        <td style={sty.td}>{timeAgo(s.lastRefresh)}</td>
                        <td style={sty.td}><span style={sty.badge(statusColor)}>{status.toUpperCase()}</span></td>
                        <td style={sty.td}><button style={sty.btn(false)} onClick={()=>{}}>Refresh</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Automated refresh config */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Automated Refresh Configuration</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {['Real-time Feeds','Daily Batch','Weekly ETL','Monthly Reports','Quarterly Filings','Annual Updates'].map((cfg,i)=>(
                <div key={cfg} style={{padding:12,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600}}>{cfg}</span>
                    <span style={sty.badge(sr(i*701)>0.3?T.green:T.amber)}>{sr(i*701)>0.3?'ACTIVE':'PAUSED'}</span>
                  </div>
                  <div style={{fontSize:11,color:T.textMut}}>Sources: {rngI(2,12,i*711)} | Next: {rngI(1,48,i*721)}h</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:2}}>Retry policy: {rngI(1,5,i*731)}x backoff</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 3 — VALIDATION RULES                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===3 && (
        <div>
          {/* Stats */}
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{VALIDATION_RULES.length + customRules.length}</div><div style={sty.statLbl}>Total Rules</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{VALIDATION_RULES.filter(r=>r.passRate>=95).length}</div><div style={sty.statLbl}>Passing (&gt;95%)</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.red}}>{VALIDATION_RULES.filter(r=>r.passRate<80).length}</div><div style={sty.statLbl}>Failing (&lt;80%)</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.gold}}>{(VALIDATION_RULES.reduce((s,r)=>s+r.passRate,0)/VALIDATION_RULES.length).toFixed(1)}%</div><div style={sty.statLbl}>Avg Pass Rate</div></div>
          </div>

          {/* Run scan + filter */}
          <div style={{...sty.card,display:'flex',alignItems:'center',gap:12,padding:12}}>
            <button style={sty.btn(true)} onClick={runScan} disabled={scanRunning}>
              {scanRunning ? `Scanning... ${scanProgress.toFixed(0)}%` : 'Run Validation Scan'}
            </button>
            {scanRunning && (
              <div style={{flex:1}}>
                <div style={sty.pbar(scanProgress,T.gold)}><div style={sty.pbarFill(scanProgress,T.gold)}/></div>
              </div>
            )}
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              {['all','critical','high','medium','low'].map(f=>(
                <button key={f} style={sty.btn(severityFilter===f)} onClick={()=>setSeverityFilter(f)}>
                  {f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Pass rate by severity */}
          <div style={sty.grid2}>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Pass Rate by Rule Severity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={['critical','high','medium','low'].map(sev=>({
                  severity:sev.charAt(0).toUpperCase()+sev.slice(1),
                  avgPassRate: VALIDATION_RULES.filter(r=>r.severity===sev).reduce((s,r)=>s+r.passRate,0) / (VALIDATION_RULES.filter(r=>r.severity===sev).length||1),
                  count: VALIDATION_RULES.filter(r=>r.severity===sev).length,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="severity" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis domain={[70,100]} tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="avgPassRate" fill={T.navyL} radius={[4,4,0,0]} name="Avg Pass %"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Error Rate by Engine Area</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={['Emissions','ESG Scores','Portfolio','Risk Models','Governance','Taxonomy'].map((a,i)=>({
                    name:a, value:rngI(5,40,i*801),
                  }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {Array.from({length:6},(_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rules table */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Validation Rules ({filteredRules.length})</h3>
            <div style={{maxHeight:500,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr>
                    <th style={sty.th}>ID</th><th style={sty.th}>Rule</th><th style={sty.th}>Field</th><th style={sty.th}>Severity</th><th style={sty.th}>Pass %</th><th style={sty.th}>Failing</th><th style={sty.th}>Last Run</th><th style={sty.th}>On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map(r=>{
                    const isSelected = selectedRule===r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr style={{cursor:'pointer',background:isSelected?T.surfaceH:'transparent'}} onClick={()=>setSelectedRule(isSelected?null:r.id)}>
                          <td style={{...sty.td,fontWeight:600}}>{r.id}</td>
                          <td style={{...sty.td,fontFamily:T.font,maxWidth:280}}>{r.name}</td>
                          <td style={sty.td}>{r.field}</td>
                          <td style={sty.td}><span style={sty.badge(severityColor(r.severity))}>{r.severity.toUpperCase()}</span></td>
                          <td style={sty.td}><span style={{color:qualityColor(r.passRate),fontWeight:600}}>{r.passRate.toFixed(1)}%</span></td>
                          <td style={sty.td}>{r.failingEntities}</td>
                          <td style={sty.td}>{timeAgo(r.lastRun)}</td>
                          <td style={sty.td}><span style={{color:r.enabled?T.green:T.textMut}}>{r.enabled?'ON':'OFF'}</span></td>
                        </tr>
                        {isSelected && (
                          <tr>
                            <td colSpan={8} style={{padding:0}}>
                              <div style={{background:T.surfaceH,padding:16,borderTop:`2px solid ${T.gold}`}}>
                                <div style={{marginBottom:12}}>
                                  <span style={{fontSize:11,color:T.textMut}}>Condition: </span>
                                  <code style={{fontSize:12,fontFamily:T.mono,background:T.surface,padding:'2px 6px',borderRadius:4,border:`1px solid ${T.borderL}`}}>{r.condition}</code>
                                </div>
                                <h4 style={{fontSize:12,fontWeight:600,marginBottom:8}}>Pass Rate Trend (12 Months)</h4>
                                <ResponsiveContainer width="100%" height={150}>
                                  <LineChart data={r.trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                                    <XAxis dataKey="month" tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL}/>
                                    <YAxis domain={[70,100]} tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL}/>
                                    <Tooltip contentStyle={{fontSize:10,fontFamily:T.mono,borderRadius:6}}/>
                                    <Line type="monotone" dataKey="rate" stroke={T.gold} strokeWidth={2} dot={{r:3,fill:T.gold}}/>
                                  </LineChart>
                                </ResponsiveContainer>
                                <div style={{marginTop:12}}>
                                  <h4 style={{fontSize:12,fontWeight:600,marginBottom:4}}>Sample Failing Entities</h4>
                                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                                    {Array.from({length:Math.min(8,r.failingEntities)},(_,fi)=>(
                                      <span key={fi} style={sty.tag(T.red)}>Entity-{rngI(1000,9999,fi*901+r.id.charCodeAt(3))}</span>
                                    ))}
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

          {/* Add custom rule */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Add Custom Validation Rule</h3>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 2fr auto',gap:12,alignItems:'end'}}>
              <div>
                <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Rule Name</label>
                <input style={sty.input} placeholder="e.g., Revenue > 0 for active companies" value={newRuleName} onChange={e=>setNewRuleName(e.target.value)}/>
              </div>
              <div>
                <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Field</label>
                <input style={sty.input} placeholder="e.g., company_master.revenue" value={newRuleField} onChange={e=>setNewRuleField(e.target.value)}/>
              </div>
              <div>
                <label style={{fontSize:11,color:T.textMut,display:'block',marginBottom:4}}>Condition</label>
                <input style={sty.input} placeholder="e.g., revenue > 0" value={newRuleCondition} onChange={e=>setNewRuleCondition(e.target.value)}/>
              </div>
              <button style={sty.btn(true)} onClick={addCustomRule}>Add Rule</button>
            </div>
          </div>

          {/* Cross-field consistency checks */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Cross-Field Consistency Checks</h3>
            <table style={sty.tbl}>
              <thead>
                <tr><th style={sty.th}>Check</th><th style={sty.th}>Fields</th><th style={sty.th}>Pass Rate</th><th style={sty.th}>Violations</th><th style={sty.th}>Status</th></tr>
              </thead>
              <tbody>
                {[
                  {check:'Scope 1+2+3 = Total Emissions',fields:'emissions.scope1, scope2, scope3, total',pass:92.4,violations:38},
                  {check:'Market Cap < EVIC',fields:'company_master.market_cap, evic',pass:96.1,violations:12},
                  {check:'Target Year > Base Year (SBTi)',fields:'sbti_targets.target_year, base_year',pass:99.2,violations:3},
                  {check:'Portfolio Weights Sum = 1.0',fields:'holdings.weight per portfolio_id',pass:97.8,violations:8},
                  {check:'Emission Intensity = Emissions / Revenue',fields:'emissions.intensity, scope1, revenue',pass:88.5,violations:54},
                  {check:'GAR Numerator <= Denominator',fields:'green_bonds.gar_num, gar_denom',pass:99.5,violations:2},
                  {check:'Physical Risk Score Components Sum',fields:'physical_risk_scores.flood + heat + storm',pass:94.3,violations:22},
                  {check:'Board Gender % + Rest = 100%',fields:'board_composition.female_pct + male_pct',pass:98.1,violations:7},
                ].map((c,i)=>(
                  <tr key={i}>
                    <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{c.check}</td>
                    <td style={sty.td}>{c.fields}</td>
                    <td style={sty.td}><span style={{color:qualityColor(c.pass),fontWeight:600}}>{c.pass}%</span></td>
                    <td style={sty.td}>{c.violations}</td>
                    <td style={sty.td}><span style={sty.badge(c.pass>=95?T.green:c.pass>=85?T.amber:T.red)}>{c.pass>=95?'PASS':c.pass>=85?'WARN':'FAIL'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export */}
          <div style={{...sty.card,display:'flex',gap:12,justifyContent:'flex-end'}}>
            <button style={sty.btn(false)}>Export Validation Report (CSV)</button>
            <button style={sty.btn(false)}>Export Validation Report (PDF)</button>
            <button style={sty.btn(true)}>Schedule Daily Validation</button>
          </div>
        </div>
      )}
    </div>
  );
}
