import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
} from 'recharts';

/* ─── Theme ─── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Model Registry ─── */
const MODEL_REGISTRY = [
  { id:'M001', name:'PD Exponential (Branch A)', engine:'dme_pd_engine.py', category:'Credit Risk', methodology:'PD = PD_base * exp(alpha * v_transition)', assumptions:['Sector coefficients are stable','Velocity reflects forward-looking transition risk','Alpha calibrated to historical PD migrations'], limitations:['No non-linear regime effects','Single-factor sensitivity'], inputs:['baseline_pd','sector','velocity_transition'], outputs:['adjusted_pd','adjustment_bps'], validation_status:'validated', last_validated:'2025-01-15', next_validation:'2025-07-15', validator:'Quant Team', risk_tier:'Tier 1', regulatory_use:['IFRS 9 monitoring','Internal risk'], backtested:true, backtest_accuracy:0.92, backtest_date:'2025-01-10' },
  { id:'M002', name:'PD Merton DD (Branch B)', engine:'dme_pd_engine.py', category:'Credit Risk', methodology:'Merton distance-to-default with stranded asset haircut', assumptions:['Asset values follow GBM','Market cap proxies asset value','Stranded haircut reflects fossil exposure'], limitations:['Assumes liquid markets','Haircut is sector-average not company-specific'], inputs:['market_cap','debt','volatility','risk_free_rate','fossil_exposure'], outputs:['distance_to_default','pd_merton','stranded_haircut'], validation_status:'validated', last_validated:'2025-01-15', next_validation:'2025-07-15', risk_tier:'Tier 1', regulatory_use:['IFRS 9 ECL','Basel III'], backtested:true, backtest_accuracy:0.89, backtest_date:'2025-01-12' },
  { id:'M003', name:'PD Tabular (Branch C)', engine:'dme_pd_engine.py', category:'Credit Risk', methodology:'ESG band multipliers: low=1.05, medium=1.30, high=2.00, severe=3.25', assumptions:['ESG bands are discretely defined','Multipliers are static across cycles'], limitations:['No continuous sensitivity','No sector differentiation'], inputs:['baseline_pd','esg_band'], outputs:['adjusted_pd'], validation_status:'validated', last_validated:'2025-02-01', next_validation:'2026-02-01', risk_tier:'Tier 2', regulatory_use:['Internal screening'], backtested:true, backtest_accuracy:0.85, backtest_date:'2025-01-28' },
  { id:'M004', name:'PD Multi-factor (Branch D)', engine:'dme_pd_engine.py', category:'Credit Risk', methodology:'PD = PD_base * exp(alpha*v_T + beta*v_P + gamma*v_SG)', assumptions:['Multi-factor velocities are independent','Coefficients are stable through cycles','Factors capture distinct risk dimensions'], limitations:['Multicollinearity risk between factors','Requires complete velocity data'], inputs:['baseline_pd','velocity_transition','velocity_physical','velocity_social_gov'], outputs:['adjusted_pd','factor_contributions'], validation_status:'validated', last_validated:'2025-01-20', next_validation:'2025-07-20', risk_tier:'Tier 1', regulatory_use:['IFRS 9 ECL','Internal capital'], backtested:true, backtest_accuracy:0.91, backtest_date:'2025-01-18' },
  { id:'M005', name:'Monte Carlo Climate VaR', engine:'MonteCarloVarPage.jsx', category:'Market Risk', methodology:'Cholesky-decomposed correlated sector shocks, Box-Muller, 10K iterations', assumptions:['Sector correlations are stationary','Normal marginals via Box-Muller','Climate shocks propagate linearly'], limitations:['Gaussian assumption may underestimate tail','Correlation regime shifts not modeled'], inputs:['portfolio_weights','sector_correlations','climate_shock_params','iterations'], outputs:['var_95','var_99','cvar','loss_distribution'], validation_status:'validated', last_validated:'2025-02-10', next_validation:'2025-08-10', risk_tier:'Tier 1', regulatory_use:['Market risk capital','Client reporting'], backtested:true, backtest_accuracy:0.94, backtest_date:'2025-02-08' },
  { id:'M006', name:'VaR Additive (Reputational)', engine:'dme_financial_risk_engine.py', category:'Market Risk', methodology:'VaR_adj = VaR_base + Exposure * beta_rep * acceleration', assumptions:['Reputational risk is additive to market risk','Beta captures ESG sensitivity','Acceleration reflects momentum'], limitations:['No non-linear contagion effects','Beta estimated from limited history'], inputs:['var_base','exposure','beta_rep','acceleration'], outputs:['var_adjusted','reputational_component'], validation_status:'pending', last_validated:'2024-08-15', next_validation:'2025-02-15', risk_tier:'Tier 2', regulatory_use:['Internal analytics'], backtested:false },
  { id:'M007', name:'WACC ESG-Adjusted', engine:'dme_financial_risk_engine.py', category:'Valuation', methodology:'WACC with ESG equity premium + climate risk premium + debt spread', assumptions:['ESG premium reflects market pricing','Climate premium captures physical + transition risk','Cost of debt adjusts with ESG rating'], limitations:['Premium estimation sensitive to calibration window','No regime-specific adjustments'], inputs:['equity_weight','debt_weight','cost_equity','cost_debt','esg_premium','climate_premium'], outputs:['wacc_adjusted','premium_breakdown'], validation_status:'validated', last_validated:'2025-01-25', next_validation:'2025-07-25', risk_tier:'Tier 1', regulatory_use:['DCF valuations','Internal capital allocation'], backtested:true, backtest_accuracy:0.88, backtest_date:'2025-01-22' },
  { id:'M008', name:'Dynamic Materiality Index', engine:'dme_dmi_engine.py + materialityEngine.js', category:'Materiality', methodology:'DMI = 40% Impact + 40% Risk + 20% Opportunity, concentration-adjusted', assumptions:['Triple-materiality weights are appropriate','Concentration adjustment captures portfolio effects','Velocity captures directional momentum'], limitations:['Weight calibration is subjective','Concentration penalty may be too aggressive'], inputs:['impact_scores','risk_scores','opportunity_scores','concentration_data'], outputs:['dmi_score','component_breakdown','concentration_penalty'], validation_status:'validated', last_validated:'2025-02-20', next_validation:'2025-08-20', risk_tier:'Tier 1', regulatory_use:['CSRD DMA','SFDR classification'], backtested:true, backtest_accuracy:0.87, backtest_date:'2025-02-18' },
  { id:'M009', name:'ITR Regression', engine:'ImpliedTempRegressionPage.jsx', category:'Climate', methodology:'IPCC carbon budget interpolation with OLS regression', assumptions:['Linear emission-temperature relationship','IPCC carbon budgets are accurate','Company targets are credible'], limitations:['Sensitivity to target credibility','No sectoral pathway differentiation'], inputs:['current_emissions','target_emissions','target_year','sector'], outputs:['implied_temperature','confidence_interval','pathway_alignment'], validation_status:'validated', last_validated:'2025-01-30', next_validation:'2026-01-30', risk_tier:'Tier 2', regulatory_use:['PAB/CTB benchmarks','Client reporting'], backtested:true, backtest_accuracy:0.83, backtest_date:'2025-01-28' },
  { id:'M010', name:'Copula Tail Risk', engine:'CopulaTailRiskPage.jsx', category:'Tail Risk', methodology:'Clayton + Gaussian copula with Beasley-Springer-Moro inverse CDF', assumptions:['Clayton captures lower-tail dependence','Gaussian marginals are adequate','Copula parameters are stable'], limitations:['Parameter estimation requires long history','Regime changes not dynamically modeled'], inputs:['return_series','copula_family','confidence_level'], outputs:['tail_var','tail_cvar','joint_exceedance_probability'], validation_status:'pending', last_validated:'2024-09-01', next_validation:'2025-03-01', risk_tier:'Tier 2', regulatory_use:['Internal tail risk'], backtested:false },
  { id:'M011', name:'Sentiment Pipeline', engine:'sentiment_pipeline_engine.py', category:'NLP/Sentiment', methodology:'8-step: ingest > classify > score > weight > decay > aggregate > velocity > alert', assumptions:['NLP model captures ESG-relevant sentiment','Exponential decay is appropriate','Velocity reflects trend momentum'], limitations:['Language coverage limited','Source bias possible','Latency in classification'], inputs:['news_articles','social_media','regulatory_filings'], outputs:['sentiment_score','velocity','alert_level','topic_breakdown'], validation_status:'validated', last_validated:'2025-02-15', next_validation:'2025-08-15', risk_tier:'Tier 2', regulatory_use:['Early warning','Stewardship triggers'], backtested:true, backtest_accuracy:0.81, backtest_date:'2025-02-12' },
  { id:'M012', name:'Greenium M5 Ensemble', engine:'greenium_signal_engine.py', category:'Trading Signals', methodology:'M1(25%)+M2(30%)+RSI(20%)+Volume(10%)+ESG(15%)', assumptions:['Ensemble weights are optimal','Individual model signals are independent','ESG factor adds alpha'], limitations:['Overfitting risk on training period','Transaction costs not modeled','Signal decay in high volatility'], inputs:['price_series','volume','esg_scores','rsi_params'], outputs:['signal_score','confidence','recommended_action'], validation_status:'pending', last_validated:'2024-10-01', next_validation:'2025-04-01', risk_tier:'Tier 1', regulatory_use:['Trading desk','Portfolio optimization'], backtested:false },
  { id:'M013', name:'NGFS Scenario PD', engine:'DmeScenariosPage.jsx', category:'Stress Testing', methodology:'scenarioAdjustedPD with physical/transition weights', assumptions:['NGFS scenarios are representative','Physical and transition risk weights sum to 1','Sector multipliers capture heterogeneity'], limitations:['Scenario pathways may diverge from reality','No company-specific pathway','Point-in-time assessment'], inputs:['baseline_pd','scenario_type','sector','physical_weight','transition_weight'], outputs:['scenario_pd','stress_multiplier','pathway_alignment'], validation_status:'validated', last_validated:'2025-01-05', next_validation:'2025-07-05', risk_tier:'Tier 1', regulatory_use:['ECB climate stress test','Internal ICAAP'], backtested:true, backtest_accuracy:0.86, backtest_date:'2025-01-03' },
  { id:'M014', name:'ESG Factor Backtesting', engine:'EsgBacktestingPage.jsx', category:'Performance', methodology:'7 ESG factors with AR(1) autocorrelation, Sharpe/drawdown', assumptions:['Factor returns are stationary','AR(1) captures autocorrelation','Transaction costs are negligible'], limitations:['In-sample bias possible','Factor crowding not modeled','Drawdown calculation assumes continuous pricing'], inputs:['factor_returns','benchmark_returns','lookback_period'], outputs:['sharpe_ratio','max_drawdown','factor_premia','ar1_coefficient'], validation_status:'pending', last_validated:'2024-11-01', next_validation:'2025-05-01', risk_tier:'Tier 2', regulatory_use:['Performance attribution','Investment committee'], backtested:true, backtest_accuracy:0.79, backtest_date:'2024-10-28' },
  { id:'M015', name:'CRREM Stranding Model', engine:'CRREMPage.jsx', category:'Real Estate', methodology:'Energy/carbon intensity trajectory vs 1.5/WB2/2C pathways', assumptions:['CRREM pathways are appropriate benchmarks','Building-level data is representative','Retrofit assumptions are feasible'], limitations:['Data gaps in emerging markets','Pathway uncertainty post-2030','No occupancy adjustment'], inputs:['energy_intensity','carbon_intensity','building_type','location','pathway'], outputs:['stranding_year','excess_emissions','retrofit_cost_estimate','alignment_score'], validation_status:'validated', last_validated:'2025-03-01', next_validation:'2025-09-01', risk_tier:'Tier 2', regulatory_use:['EU Taxonomy alignment','GRESB reporting'], backtested:true, backtest_accuracy:0.84, backtest_date:'2025-02-26' },
];

const RISK_TIERS = [
  { tier:'Tier 1', description:'High-impact models used for regulatory capital, IFRS 9, or client-facing decisions', validation_frequency:'Semi-annual', governance:'Board/Risk Committee approval required', examples:'PD models, VaR, WACC, NGFS scenarios', color:'#dc2626' },
  { tier:'Tier 2', description:'Medium-impact models used for internal analytics, benchmarking, or screening', validation_frequency:'Annual', governance:'Quant Team approval', examples:'ITR regression, copula, sentiment, CRREM', color:'#d97706' },
  { tier:'Tier 3', description:'Low-impact models used for reference, visualization, or exploratory analysis', validation_frequency:'Biennial', governance:'Self-assessment', examples:'Sector benchmarks, data quality scores', color:'#16a34a' },
];

const CHANGELOG_KEY = 'ra_model_changelog_v1';

const REVIEW_ITEMS = [
  'Methodology reviewed and documented',
  'Input data sources verified',
  'Output accuracy assessed',
  'Assumptions reviewed for continued validity',
  'Limitations documented with mitigations',
  'Back-test results within acceptable thresholds',
  'Regulatory alignment confirmed',
  'Documentation updated to current version',
  'Stakeholder sign-off obtained',
  'Next validation date scheduled',
];

const REGULATORY_FRAMEWORKS = [
  { id:'ecb', name:'ECB Guide on Internal Models', scope:'EU banks — model risk for ICAAP/SREP', models:['M001','M002','M004','M005','M007','M013'] },
  { id:'pra', name:'PRA SS 1-13 (Model Risk Management)', scope:'UK firms — sound model risk management practices', models:['M001','M002','M004','M005','M006','M007','M012','M013'] },
  { id:'mas', name:'MAS Circular on Model Risk', scope:'Singapore-regulated institutions', models:['M001','M005','M007','M013'] },
  { id:'basel', name:'Basel III/IV (SA & IRB)', scope:'Global — standardised and internal ratings-based approaches', models:['M001','M002','M003','M004','M005','M006','M013'] },
  { id:'ifrs9', name:'IFRS 9 (ECL)', scope:'Expected credit loss provisioning', models:['M001','M002','M003','M004','M013'] },
  { id:'tcfd', name:'TCFD / ISSB S2', scope:'Climate-related financial disclosures', models:['M005','M008','M009','M013','M015'] },
];

const MODEL_DEPENDENCIES = [
  { from:'M001', to:'M013', label:'PD feeds Scenario PD' },
  { from:'M002', to:'M013', label:'Merton feeds Scenario PD' },
  { from:'M004', to:'M013', label:'Multi-factor feeds Scenario PD' },
  { from:'M005', to:'M006', label:'VaR base feeds VaR Additive' },
  { from:'M008', to:'M011', label:'DMI uses Sentiment velocity' },
  { from:'M011', to:'M008', label:'Sentiment feeds DMI' },
  { from:'M009', to:'M015', label:'ITR informs CRREM pathways' },
  { from:'M012', to:'M005', label:'Signal informs VaR scenarios' },
];

/* ─── Helpers ─── */
const hash = s => { let h=0; for(let i=0;i<s.length;i++) h=Math.imul(31,h)+s.charCodeAt(i)|0; return Math.abs(h); };
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'N/A';
const daysDiff = (a,b) => Math.floor((new Date(b)-new Date(a))/86400000);
const monthsDiff = (a,b) => Math.round(daysDiff(a,b)/30.44);

/* ─── Shared UI ─── */
const KpiCard = ({label,value,sub,color}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',minWidth:120,borderTop:`3px solid ${color||T.gold}`}}>
    <div style={{fontSize:11,color:T.textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{value}</div>
    {sub && <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);
const Btn = ({children,onClick,active,small,color}) => (
  <button onClick={onClick} style={{padding:small?'4px 10px':'7px 16px',borderRadius:6,border:`1px solid ${active?color||T.navy:T.border}`,background:active?color||T.navy:'transparent',color:active?'#fff':T.text,fontWeight:600,fontSize:small?11:13,cursor:'pointer',fontFamily:T.font,transition:'all .15s'}}>{children}</button>
);
const Badge = ({text,color,bg}) => (
  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,color:color||'#fff',background:bg||T.navy,letterSpacing:0.3}}>{text}</span>
);
const Section = ({title,badge,children}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:24,marginBottom:20}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
      <h3 style={{margin:0,fontSize:16,fontWeight:700,color:T.navy}}>{title}</h3>
      {badge && <Badge text={badge} bg={T.gold} color={T.navy}/>}
    </div>
    {children}
  </div>
);

const StatusBadge = ({status}) => {
  const m = {validated:{t:'Validated',bg:'#dcfce7',c:'#16a34a',i:'checkmark'},pending:{t:'Pending',bg:'#fef3c7',c:'#d97706',i:'clock'},overdue:{t:'Overdue',bg:'#fee2e2',c:'#dc2626',i:'alert'}};
  const s = m[status]||m.pending;
  return <Badge text={s.t} bg={s.bg} color={s.c}/>;
};

const TierBadge = ({tier}) => {
  const t = RISK_TIERS.find(r=>r.tier===tier);
  return <Badge text={tier} bg={t?t.color+'20':T.border} color={t?t.color:T.textMut}/>;
};

/* ─── Main Component ─── */
export default function ModelGovernancePage() {
  const navigate = useNavigate();
  const companies = useMemo(()=>(GLOBAL_COMPANY_MASTER||[]).slice(0,80),[]);

  // Portfolio (wrapped format)
  const portfolio = useMemo(()=>{
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1')||'{}');
      const portfolios = raw.portfolios || {};
      const active = raw.activePortfolio || Object.keys(portfolios)[0] || '';
      return { portfolios, activePortfolio: active, holdings: portfolios[active]?.holdings || [] };
    } catch { return { portfolios:{}, activePortfolio:'', holdings:[] }; }
  },[]);

  // Changelog state
  const [changelog, setChangelog] = useState(()=>{
    try { return JSON.parse(localStorage.getItem(CHANGELOG_KEY)||'[]'); }
    catch { return []; }
  });
  const saveChangelog = useCallback((cl)=>{
    setChangelog(cl);
    localStorage.setItem(CHANGELOG_KEY, JSON.stringify(cl));
  },[]);

  // UI state
  const [tab, setTab] = useState('registry');
  const [selectedModel, setSelectedModel] = useState(null);
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [kanbanStatus, setKanbanStatus] = useState(()=>{
    const m = {};
    MODEL_REGISTRY.forEach(mod=>{
      m[mod.id] = mod.validation_status === 'validated' ? 'validated' : 'scheduled';
    });
    return m;
  });

  // Annual review checklist state
  const [reviewChecks, setReviewChecks] = useState(()=>{
    const m = {};
    MODEL_REGISTRY.forEach(mod => { m[mod.id] = new Array(REVIEW_ITEMS.length).fill(false); });
    return m;
  });

  // Change log form
  const [clModelId, setClModelId] = useState('M001');
  const [clChange, setClChange] = useState('');
  const [clReason, setClReason] = useState('');

  // Compute model statuses with overdue logic
  const modelsWithStatus = useMemo(()=>{
    const now = new Date();
    return MODEL_REGISTRY.map(m => {
      let status = m.validation_status;
      if (m.next_validation && new Date(m.next_validation) < now && status !== 'validated') {
        status = 'overdue';
      }
      // For demo, mark some pending as overdue if next_validation passed
      if (m.next_validation && new Date(m.next_validation) < now) {
        status = m.validation_status === 'pending' ? 'overdue' : 'validated';
      }
      const validationAge = m.last_validated ? monthsDiff(m.last_validated, now.toISOString()) : null;
      return { ...m, computed_status: status, validation_age: validationAge };
    });
  },[]);

  // Sorted registry
  const sortedModels = useMemo(()=>{
    return [...modelsWithStatus].sort((a,b)=>{
      let va = a[sortCol]||'', vb = b[sortCol]||'';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  },[modelsWithStatus,sortCol,sortDir]);

  // KPIs
  const kpis = useMemo(()=>{
    const validated = modelsWithStatus.filter(m=>m.computed_status==='validated').length;
    const pending = modelsWithStatus.filter(m=>m.computed_status==='pending').length;
    const overdue = modelsWithStatus.filter(m=>m.computed_status==='overdue').length;
    const t1 = modelsWithStatus.filter(m=>m.risk_tier==='Tier 1').length;
    const t2 = modelsWithStatus.filter(m=>m.risk_tier==='Tier 2').length;
    const ages = modelsWithStatus.filter(m=>m.validation_age!=null).map(m=>m.validation_age);
    const avgAge = ages.length ? (ages.reduce((a,b)=>a+b,0)/ages.length).toFixed(1) : 'N/A';
    const nextDue = modelsWithStatus.filter(m=>m.next_validation).sort((a,b)=>new Date(a.next_validation)-new Date(b.next_validation))[0];
    const categories = new Set(modelsWithStatus.map(m=>m.category));
    const backtested = modelsWithStatus.filter(m=>m.backtested).length;
    return { total:MODEL_REGISTRY.length, validated, pending, overdue, t1, t2, avgAge, nextDue: nextDue?fmtDate(nextDue.next_validation):'N/A', categories:categories.size, backtested_pct: Math.round(backtested/MODEL_REGISTRY.length*100) };
  },[modelsWithStatus]);

  // Validation status pie
  const valStatusData = useMemo(()=>[
    {name:'Validated',value:kpis.validated,color:T.green},
    {name:'Pending',value:kpis.pending,color:T.amber},
    {name:'Overdue',value:kpis.overdue,color:T.red},
  ].filter(d=>d.value>0),[kpis]);

  // Category distribution bar
  const categoryDist = useMemo(()=>{
    const m = {};
    modelsWithStatus.forEach(mod=>{
      m[mod.category] = (m[mod.category]||0)+1;
    });
    return Object.entries(m).map(([k,v])=>({category:k,count:v})).sort((a,b)=>b.count-a.count);
  },[modelsWithStatus]);

  // All assumptions flat
  const allAssumptions = useMemo(()=>{
    const arr = [];
    MODEL_REGISTRY.forEach(m=>{
      (m.assumptions||[]).forEach((a,i)=>{
        arr.push({ model:m.name, modelId:m.id, assumption:a, tier:m.risk_tier, category:m.category, index:i });
      });
    });
    return arr;
  },[]);

  // All limitations flat
  const allLimitations = useMemo(()=>{
    const arr = [];
    MODEL_REGISTRY.forEach(m=>{
      (m.limitations||[]).forEach((l,i)=>{
        arr.push({ model:m.name, modelId:m.id, limitation:l, tier:m.risk_tier, category:m.category });
      });
    });
    return arr;
  },[]);

  // Sort handler
  const handleSort = col => {
    if (sortCol === col) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Kanban helpers
  const kanbanCols = ['scheduled','in_review','validated','archived'];
  const kanbanLabels = {scheduled:'Scheduled',in_review:'In Review',validated:'Validated',archived:'Archived'};
  const moveKanban = (modelId, newStatus) => {
    setKanbanStatus(prev=>({...prev,[modelId]:newStatus}));
  };

  // Add changelog entry
  const addChangelogEntry = () => {
    if (!clChange.trim()) return;
    const entry = { id:`CL-${Date.now()}`, modelId:clModelId, change:clChange, reason:clReason, timestamp:new Date().toISOString(), user:'Quant Team' };
    saveChangelog([entry,...changelog]);
    setClChange(''); setClReason('');
  };

  // Toggle review check
  const toggleReview = (modelId, idx) => {
    setReviewChecks(prev=>{
      const next = {...prev};
      next[modelId] = [...(next[modelId]||new Array(REVIEW_ITEMS.length).fill(false))];
      next[modelId][idx] = !next[modelId][idx];
      return next;
    });
  };

  // Exports
  const exportCSV = () => {
    const headers = ['ID','Name','Engine','Category','Tier','Status','Last Validated','Next Validation','Regulatory Use','Backtested','Accuracy'];
    const rows = MODEL_REGISTRY.map(m=>[m.id,m.name,m.engine,m.category,m.risk_tier,m.validation_status,m.last_validated||'',m.next_validation||'',(m.regulatory_use||[]).join('; '),m.backtested?'Yes':'No',m.backtest_accuracy||'']);
    const csv = [headers.join(','),...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`model_registry_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const pkg = { exported:new Date().toISOString(), platform:'Risk Analytics v6.0', type:'Model Validation Report', models:MODEL_REGISTRY.map(m=>({...m,computed_status:modelsWithStatus.find(x=>x.id===m.id)?.computed_status})), changelog:changelog.slice(0,50), regulatory_alignment:REGULATORY_FRAMEWORKS };
    const blob = new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`model_validation_report_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const exportPrint = () => window.print();

  // Generate documentation for a model
  const generateDocs = (model) => {
    const doc = `MODEL DOCUMENTATION — ${model.name}\n${'='.repeat(60)}\n\nModel ID: ${model.id}\nEngine: ${model.engine}\nCategory: ${model.category}\nRisk Tier: ${model.risk_tier}\nValidation Status: ${model.validation_status}\nLast Validated: ${model.last_validated||'N/A'}\nNext Validation: ${model.next_validation||'N/A'}\n\nMETHODOLOGY\n${'-'.repeat(40)}\n${model.methodology}\n\nASSUMPTIONS\n${'-'.repeat(40)}\n${(model.assumptions||[]).map((a,i)=>`${i+1}. ${a}`).join('\n')}\n\nLIMITATIONS\n${'-'.repeat(40)}\n${(model.limitations||[]).map((l,i)=>`${i+1}. ${l}`).join('\n')}\n\nINPUTS: ${(model.inputs||[]).join(', ')}\nOUTPUTS: ${(model.outputs||[]).join(', ')}\nREGULATORY USE: ${(model.regulatory_use||[]).join(', ')}\n\nBACK-TEST RESULTS\n${'-'.repeat(40)}\nBack-tested: ${model.backtested?'Yes':'No'}\nAccuracy: ${model.backtest_accuracy||'N/A'}\nLast Back-test: ${model.backtest_date||'N/A'}\n\nGenerated: ${new Date().toISOString()}\nPlatform: Risk Analytics v6.0`;
    const blob = new Blob([doc],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`model_doc_${model.id}_${new Date().toISOString().slice(0,10)}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  // Empty state
  if (MODEL_REGISTRY.length === 0) return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:60,background:T.surface,borderRadius:16,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:48,marginBottom:16}}>🔬</div>
        <h2 style={{color:T.navy,margin:'0 0 8px'}}>No Models Registered</h2>
        <p style={{color:T.textSec}}>Register quantitative models to track validation, governance, and regulatory alignment.</p>
      </div>
    </div>
  );

  const TABS = [{id:'registry',l:'Model Registry'},{id:'detail',l:'Model Detail'},{id:'validation',l:'Validation'},{id:'kanban',l:'Workflow'},{id:'assumptions',l:'Assumptions'},{id:'limitations',l:'Limitations'},{id:'backtest',l:'Back-Tests'},{id:'regulatory',l:'Regulatory'},{id:'changelog',l:'Change Log'},{id:'review',l:'Annual Review'},{id:'docs',l:'Documentation'}];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      {/* ── 1. Header ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Model Governance & Validation Registry</h1>
            <Badge text="15 Models" bg={T.gold} color={T.navy}/>
            <Badge text="SR 11-7" bg={T.sage} color="#fff"/>
            <Badge text="3 Tiers" bg={T.navyL}/>
            <Badge text="Validation Tracking" bg={T.navy}/>
          </div>
          <p style={{margin:'6px 0 0',fontSize:13,color:T.textSec}}>Comprehensive model risk management aligned with ECB, PRA SS 1-13, MAS, and Basel III/IV standards</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn onClick={exportCSV} color={T.sage}>Registry CSV</Btn>
          <Btn onClick={exportJSON} color={T.navyL}>Validation JSON</Btn>
          <Btn onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* ── 2. KPI Cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        <KpiCard label="Models Registered" value={kpis.total} color={T.navy}/>
        <KpiCard label="Validated" value={kpis.validated} sub={`${Math.round(kpis.validated/kpis.total*100)}%`} color={T.green}/>
        <KpiCard label="Pending Validation" value={kpis.pending} color={T.amber}/>
        <KpiCard label="Overdue" value={kpis.overdue} color={T.red}/>
        <KpiCard label="Tier 1 Count" value={kpis.t1} sub="High-impact" color="#dc2626"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <KpiCard label="Tier 2 Count" value={kpis.t2} sub="Medium-impact" color="#d97706"/>
        <KpiCard label="Avg Validation Age" value={`${kpis.avgAge} mo`} color={T.gold}/>
        <KpiCard label="Next Validation Due" value={kpis.nextDue} color={T.sage}/>
        <KpiCard label="Risk Categories" value={kpis.categories} color={T.navyL}/>
        <KpiCard label="Back-tested %" value={`${kpis.backtested_pct}%`} color={T.navy}/>
      </div>

      {/* ── 6. Risk Tier Distribution ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {RISK_TIERS.map(rt=>{
          const count = modelsWithStatus.filter(m=>m.risk_tier===rt.tier).length;
          return (
            <div key={rt.tier} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18,borderLeft:`4px solid ${rt.color}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:16,fontWeight:800,color:rt.color}}>{rt.tier}</span>
                <span style={{fontSize:24,fontWeight:800,color:T.navy}}>{count}</span>
              </div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:6}}>{rt.description}</div>
              <div style={{fontSize:11,color:T.textMut}}>Validation: {rt.validation_frequency} | {rt.governance}</div>
            </div>
          );
        })}
      </div>

      {/* ── Tab Nav ── */}
      <div style={{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`,overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'8px 14px',border:'none',borderBottom:tab===t.id?`3px solid ${T.navy}`:'3px solid transparent',background:'transparent',color:tab===t.id?T.navy:T.textMut,fontWeight:tab===t.id?700:500,fontSize:12,cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap'}}>{t.l}</button>
        ))}
      </div>

      {/* ── 3. Model Registry Table ── */}
      {tab==='registry' && (
        <Section title="Model Registry" badge={`${MODEL_REGISTRY.length} models`}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH}}>
                  {[{k:'id',l:'ID'},{k:'name',l:'Name'},{k:'engine',l:'Engine'},{k:'category',l:'Category'},{k:'risk_tier',l:'Tier'},{k:'validation_status',l:'Status'},{k:'last_validated',l:'Last Validated'},{k:'next_validation',l:'Next Due'}].map(col=>(
                    <th key={col.k} onClick={()=>handleSort(col.k)} style={{textAlign:'left',padding:'8px 10px',fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      {col.l} {sortCol===col.k ? (sortDir==='asc'?'↑':'↓') : ''}
                    </th>
                  ))}
                  <th style={{padding:'8px 10px',fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.border}`}}>Regulatory</th>
                  <th style={{padding:'8px 10px',fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.border}`}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedModels.map((m,i)=>(
                  <tr key={m.id} style={{borderBottom:`1px solid ${T.border}22`,background:i%2?T.surfaceH:'transparent'}}>
                    <td style={{padding:'6px 10px',fontWeight:700,color:T.navyL}}>{m.id}</td>
                    <td style={{padding:'6px 10px',fontWeight:600,color:T.navy,maxWidth:200}}>{m.name}</td>
                    <td style={{padding:'6px 10px',fontSize:11,color:T.textSec,fontFamily:'monospace'}}>{m.engine}</td>
                    <td style={{padding:'6px 10px'}}><Badge text={m.category} bg={T.navy+'20'} color={T.navy}/></td>
                    <td style={{padding:'6px 10px'}}><TierBadge tier={m.risk_tier}/></td>
                    <td style={{padding:'6px 10px'}}><StatusBadge status={m.computed_status}/></td>
                    <td style={{padding:'6px 10px',fontSize:11,color:T.textSec}}>{fmtDate(m.last_validated)}</td>
                    <td style={{padding:'6px 10px',fontSize:11,color:m.next_validation && new Date(m.next_validation)<new Date()?T.red:T.textSec}}>{fmtDate(m.next_validation)}</td>
                    <td style={{padding:'6px 10px',fontSize:10,maxWidth:140}}>{(m.regulatory_use||[]).join(', ')}</td>
                    <td style={{padding:'6px 10px'}}><Btn small onClick={()=>{setSelectedModel(m);setTab('detail')}}>Detail</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 4. Model Detail Panel ── */}
      {tab==='detail' && (
        <Section title={selectedModel ? `Model Detail: ${selectedModel.name}` : 'Select a Model'}>
          {selectedModel ? (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Model ID</div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{selectedModel.id}</div>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Engine</div>
                  <div style={{fontSize:13,fontFamily:'monospace',color:T.navyL}}>{selectedModel.engine}</div>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Category / Tier</div>
                  <div style={{display:'flex',gap:8}}><Badge text={selectedModel.category} bg={T.navy+'20'} color={T.navy}/><TierBadge tier={selectedModel.risk_tier}/></div>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Methodology</div>
                  <div style={{fontSize:13,color:T.text,lineHeight:1.5,padding:12,background:T.surfaceH,borderRadius:8,fontFamily:'monospace',fontSize:12}}>{selectedModel.methodology}</div>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Regulatory Use</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{(selectedModel.regulatory_use||[]).map(r=><Badge key={r} text={r} bg={T.sage+'20'} color={T.sage}/>)}</div>
                </div>
              </div>
              <div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Validation Status</div>
                  <StatusBadge status={selectedModel.computed_status||selectedModel.validation_status}/>
                  <span style={{marginLeft:8,fontSize:12,color:T.textSec}}>Last: {fmtDate(selectedModel.last_validated)} | Next: {fmtDate(selectedModel.next_validation)}</span>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Assumptions</div>
                  {(selectedModel.assumptions||[]).map((a,i)=>(
                    <div key={i} style={{fontSize:12,color:T.text,padding:'4px 0',borderBottom:`1px solid ${T.border}22`}}>
                      <span style={{color:T.gold,fontWeight:700,marginRight:6}}>{i+1}.</span>{a}
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Limitations</div>
                  {(selectedModel.limitations||[]).map((l,i)=>(
                    <div key={i} style={{fontSize:12,color:T.red,padding:'4px 0',borderBottom:`1px solid ${T.border}22`}}>
                      <span style={{fontWeight:700,marginRight:6}}>{i+1}.</span>{l}
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Inputs</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{(selectedModel.inputs||[]).map(inp=><Badge key={inp} text={inp} bg={T.navy+'15'} color={T.navy}/>)}</div>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMut,textTransform:'uppercase',marginBottom:4}}>Outputs</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{(selectedModel.outputs||[]).map(out=><Badge key={out} text={out} bg={T.sage+'15'} color={T.sage}/>)}</div>
                </div>
                {selectedModel.backtested && (
                  <div style={{padding:12,background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0'}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.green}}>Back-Test Results</div>
                    <div style={{fontSize:13,color:T.text,marginTop:4}}>Accuracy: <strong>{(selectedModel.backtest_accuracy*100).toFixed(1)}%</strong> | Date: {fmtDate(selectedModel.backtest_date)}</div>
                  </div>
                )}
                <div style={{marginTop:12}}><Btn onClick={()=>generateDocs(selectedModel)} active color={T.sage}>Generate Documentation</Btn></div>
              </div>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:40,color:T.textMut}}>
              Select a model from the Registry tab to view full details.
              <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:16,flexWrap:'wrap'}}>
                {MODEL_REGISTRY.map(m=><Btn key={m.id} small onClick={()=>setSelectedModel(m)}>{m.id}</Btn>)}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── 5. Validation Status Dashboard ── */}
      {tab==='validation' && (<>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <Section title="Validation Status Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={valStatusData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:11}}>
                  {valStatusData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Category Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" tick={{fontSize:10}}/>
                <YAxis dataKey="category" type="category" tick={{fontSize:10}} width={100}/>
                <Tooltip/>
                <Bar dataKey="count" fill={T.navy} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
        <Section title="Validation Schedule Timeline">
          <div style={{overflowX:'auto'}}>
            {modelsWithStatus.filter(m=>m.next_validation).sort((a,b)=>new Date(a.next_validation)-new Date(b.next_validation)).map(m=>{
              const isOverdue = new Date(m.next_validation) < new Date();
              return (
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:`1px solid ${T.border}22`}}>
                  <span style={{fontWeight:700,color:T.navyL,minWidth:50}}>{m.id}</span>
                  <span style={{flex:1,fontSize:13,fontWeight:600,color:T.navy}}>{m.name}</span>
                  <TierBadge tier={m.risk_tier}/>
                  <span style={{fontSize:12,fontWeight:700,color:isOverdue?T.red:T.sage,minWidth:100}}>{fmtDate(m.next_validation)}</span>
                  <StatusBadge status={m.computed_status}/>
                </div>
              );
            })}
          </div>
        </Section>
      </>)}

      {/* ── 7. Validation Workflow Kanban ── */}
      {tab==='kanban' && (
        <Section title="Validation Workflow" badge="Kanban">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {kanbanCols.map(col=>(
              <div key={col} style={{background:T.surfaceH,borderRadius:10,padding:12,minHeight:200}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12,textTransform:'uppercase',letterSpacing:0.5}}>{kanbanLabels[col]}</div>
                {MODEL_REGISTRY.filter(m=>kanbanStatus[m.id]===col).map(m=>(
                  <div key={m.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:10,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,color:T.navyL}}>{m.id}</span>
                      <TierBadge tier={m.risk_tier}/>
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:6}}>{m.name}</div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {kanbanCols.filter(c=>c!==col).map(c=>(
                        <button key={c} onClick={()=>moveKanban(m.id,c)} style={{padding:'2px 6px',borderRadius:4,border:`1px solid ${T.border}`,background:'transparent',fontSize:9,cursor:'pointer',color:T.textMut,fontFamily:T.font}}>→ {kanbanLabels[c]}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {MODEL_REGISTRY.filter(m=>kanbanStatus[m.id]===col).length===0 && <div style={{fontSize:11,color:T.textMut,textAlign:'center',padding:20}}>No models</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 8. Model Dependency Graph ── */}
      {tab==='kanban' && (
        <Section title="Model Dependency Graph" badge={`${MODEL_DEPENDENCIES.length} links`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
            {MODEL_DEPENDENCIES.map((dep,i)=>{
              const fromModel = MODEL_REGISTRY.find(m=>m.id===dep.from);
              const toModel = MODEL_REGISTRY.find(m=>m.id===dep.to);
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:T.surfaceH,borderRadius:8}}>
                  <Badge text={dep.from} bg={T.navy}/>
                  <span style={{fontSize:11,fontWeight:600,color:T.navy}}>{fromModel?.name?.split('(')[0]}</span>
                  <span style={{color:T.gold,fontSize:16}}>→</span>
                  <Badge text={dep.to} bg={T.sage}/>
                  <span style={{fontSize:11,fontWeight:600,color:T.navy}}>{toModel?.name?.split('(')[0]}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── 9. Assumption Register ── */}
      {tab==='assumptions' && (
        <Section title="Assumption Register" badge={`${allAssumptions.length} assumptions`}>
          <div style={{maxHeight:500,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH,position:'sticky',top:0}}>
                  <th style={{textAlign:'left',padding:'8px 10px',fontWeight:700,color:T.navy}}>Model</th>
                  <th style={{textAlign:'left',padding:'8px 10px',fontWeight:700,color:T.navy}}>Tier</th>
                  <th style={{textAlign:'left',padding:'8px 10px',fontWeight:700,color:T.navy}}>Category</th>
                  <th style={{textAlign:'left',padding:'8px 10px',fontWeight:700,color:T.navy}}>Assumption</th>
                </tr>
              </thead>
              <tbody>
                {allAssumptions.map((a,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}22`,background:i%2?T.surfaceH:'transparent'}}>
                    <td style={{padding:'6px 10px',fontWeight:600,color:T.navyL}}>{a.modelId}</td>
                    <td style={{padding:'6px 10px'}}><TierBadge tier={a.tier}/></td>
                    <td style={{padding:'6px 10px',fontSize:11,color:T.textSec}}>{a.category}</td>
                    <td style={{padding:'6px 10px',color:T.text}}>{a.assumption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 10. Limitation Tracker ── */}
      {tab==='limitations' && (
        <Section title="Limitation Tracker" badge={`${allLimitations.length} limitations`}>
          <div style={{maxHeight:500,overflowY:'auto'}}>
            {allLimitations.map((l,i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.border}22`}}>
                <div style={{minWidth:50}}><Badge text={l.modelId} bg={T.navy}/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:T.text}}>{l.limitation}</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{l.model} | {l.category}</div>
                </div>
                <TierBadge tier={l.tier}/>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 11. Back-Test Results ── */}
      {tab==='backtest' && (
        <Section title="Back-Test Results Summary" badge={`${modelsWithStatus.filter(m=>m.backtested).length} tested`}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH}}>
                  <th style={{textAlign:'left',padding:'8px 10px',fontWeight:700,color:T.navy}}>Model</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Back-tested</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Accuracy</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Last Test</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Pass/Fail</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Accuracy Bar</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_REGISTRY.map((m,i)=>(
                  <tr key={m.id} style={{borderBottom:`1px solid ${T.border}22`,background:i%2?T.surfaceH:'transparent'}}>
                    <td style={{padding:'6px 10px'}}>
                      <span style={{fontWeight:700,color:T.navyL}}>{m.id}</span>
                      <span style={{marginLeft:8,fontSize:12,color:T.navy}}>{m.name}</span>
                    </td>
                    <td style={{textAlign:'center'}}>{m.backtested ? <Badge text="Yes" bg="#dcfce7" color={T.green}/> : <Badge text="No" bg="#fee2e2" color={T.red}/>}</td>
                    <td style={{textAlign:'center',fontWeight:700,color:m.backtest_accuracy>=0.9?T.green:m.backtest_accuracy>=0.8?T.amber:T.red}}>{m.backtest_accuracy ? `${(m.backtest_accuracy*100).toFixed(1)}%` : 'N/A'}</td>
                    <td style={{textAlign:'center',fontSize:11,color:T.textSec}}>{fmtDate(m.backtest_date)}</td>
                    <td style={{textAlign:'center'}}>{m.backtest_accuracy ? (m.backtest_accuracy>=0.8 ? <Badge text="PASS" bg="#dcfce7" color={T.green}/> : <Badge text="FAIL" bg="#fee2e2" color={T.red}/>) : <Badge text="N/A" bg={T.border} color={T.textMut}/>}</td>
                    <td style={{padding:'6px 10px'}}>
                      {m.backtest_accuracy ? (
                        <div style={{background:T.border,borderRadius:4,height:14,width:'100%',overflow:'hidden'}}>
                          <div style={{width:`${m.backtest_accuracy*100}%`,height:'100%',background:m.backtest_accuracy>=0.9?T.green:m.backtest_accuracy>=0.8?T.amber:T.red,borderRadius:4,transition:'width .3s'}}/>
                        </div>
                      ) : <span style={{fontSize:10,color:T.textMut}}>No data</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 12. Regulatory Alignment ── */}
      {tab==='regulatory' && (
        <Section title="Regulatory Alignment" badge={`${REGULATORY_FRAMEWORKS.length} frameworks`}>
          {REGULATORY_FRAMEWORKS.map(rf=>(
            <div key={rf.id} style={{marginBottom:16,padding:14,background:T.surfaceH,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{rf.name}</div>
                  <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{rf.scope}</div>
                </div>
                <Badge text={`${rf.models.length} models`} bg={T.navy}/>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {rf.models.map(mid=>{
                  const m = MODEL_REGISTRY.find(x=>x.id===mid);
                  const status = modelsWithStatus.find(x=>x.id===mid)?.computed_status;
                  return (
                    <div key={mid} style={{padding:'4px 10px',borderRadius:6,background:T.surface,border:`1px solid ${T.border}`,fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                      <span style={{fontWeight:700,color:T.navyL}}>{mid}</span>
                      <span style={{color:T.textSec}}>{m?.name?.split('(')[0]?.trim()}</span>
                      <StatusBadge status={status}/>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── 13. Model Change Log ── */}
      {tab==='changelog' && (
        <Section title="Model Change Log" badge={`${changelog.length} entries`}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 2fr auto',gap:8,marginBottom:16,alignItems:'end'}}>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Model</label>
              <select value={clModelId} onChange={e=>setClModelId(e.target.value)} style={{width:'100%',padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font}}>
                {MODEL_REGISTRY.map(m=><option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Change Description *</label>
              <input value={clChange} onChange={e=>setClChange(e.target.value)} placeholder="Parameter updated, methodology revised..." style={{width:'100%',padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Reason</label>
              <input value={clReason} onChange={e=>setClReason(e.target.value)} placeholder="Regulatory requirement, performance improvement..." style={{width:'100%',padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}}/>
            </div>
            <Btn onClick={addChangelogEntry} active color={T.sage}>Add Entry</Btn>
          </div>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            {changelog.length > 0 ? changelog.map((cl,i)=>(
              <div key={cl.id} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.border}22`}}>
                <div style={{minWidth:60,fontSize:10,color:T.textMut}}>{fmtDate(cl.timestamp)}</div>
                <Badge text={cl.modelId} bg={T.navy}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{cl.change}</div>
                  {cl.reason && <div style={{fontSize:11,color:T.textSec,marginTop:2}}>Reason: {cl.reason}</div>}
                </div>
                <span style={{fontSize:10,color:T.textMut}}>{cl.user}</span>
              </div>
            )) : <div style={{textAlign:'center',padding:30,color:T.textMut}}>No change log entries yet. Add the first entry above.</div>}
          </div>
        </Section>
      )}

      {/* ── 14. Annual Model Review ── */}
      {tab==='review' && (
        <Section title="Annual Model Review Checklist">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {MODEL_REGISTRY.slice(0,9).map(m=>{
              const checks = reviewChecks[m.id]||new Array(REVIEW_ITEMS.length).fill(false);
              const completed = checks.filter(Boolean).length;
              const pct = Math.round(completed/REVIEW_ITEMS.length*100);
              return (
                <div key={m.id} style={{background:T.surfaceH,borderRadius:10,padding:14,border:`1px solid ${T.border}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div>
                      <span style={{fontWeight:700,color:T.navyL,fontSize:12}}>{m.id}</span>
                      <div style={{fontSize:11,fontWeight:600,color:T.navy,marginTop:2}}>{m.name.split('(')[0].trim()}</div>
                    </div>
                    <div style={{fontSize:18,fontWeight:800,color:pct===100?T.green:pct>=50?T.amber:T.red}}>{pct}%</div>
                  </div>
                  <div style={{background:T.border,borderRadius:4,height:6,marginBottom:8,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:pct===100?T.green:pct>=50?T.amber:T.red,borderRadius:4,transition:'width .3s'}}/>
                  </div>
                  {REVIEW_ITEMS.map((item,idx)=>(
                    <label key={idx} style={{display:'flex',gap:6,alignItems:'flex-start',padding:'3px 0',cursor:'pointer',fontSize:11,color:checks[idx]?T.green:T.textSec}}>
                      <input type="checkbox" checked={checks[idx]} onChange={()=>toggleReview(m.id,idx)} style={{marginTop:1}}/>
                      <span style={{textDecoration:checks[idx]?'line-through':'none'}}>{item}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── 15. Documentation Generator ── */}
      {tab==='docs' && (
        <Section title="Documentation Generator" badge="Auto-generate model docs">
          <p style={{fontSize:12,color:T.textSec,marginBottom:16}}>Generate comprehensive model documentation for any registered model. Output includes methodology, assumptions, limitations, validation status, and back-test results.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {MODEL_REGISTRY.map(m=>(
              <div key={m.id} style={{padding:12,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.navyL}}>{m.id}</div>
                  <div style={{fontSize:11,color:T.navy}}>{m.name.split('(')[0].trim()}</div>
                </div>
                <Btn small onClick={()=>generateDocs(m)} active color={T.sage}>Generate</Btn>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 16. Cross-Navigation ── */}
      <div style={{display:'flex',gap:12,marginTop:8}}>
        <button onClick={()=>navigate('/audit-trail')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>Audit Trail →</button>
        <button onClick={()=>navigate('/regulatory-gap')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>Regulatory Gap →</button>
        <button onClick={()=>navigate('/quant-dashboard')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>Quant Dashboard →</button>
        <button onClick={()=>navigate('/csrd-ixbrl')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>CSRD Compliance →</button>
      </div>
    </div>
  );
}
