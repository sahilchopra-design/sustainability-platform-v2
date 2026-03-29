import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_AUDIT = 'ra_audit_trail_v1';
const qualityColor = v => v >= 90 ? T.green : v >= 70 ? T.sage : v >= 50 ? T.amber : T.red;
const ageColor = h => h <= 24 ? T.green : h <= 72 ? T.amber : T.red;

/* ══════════════════════════════════════════════════════════════
   DATA LINEAGE — Field Definitions
   ══════════════════════════════════════════════════════════════ */
const DATA_LINEAGE_FIELDS = [
  { field:'esg_score', label:'ESG Score', sources:['BRSR (India)','EODHD (global)','Manual Override'], priority:'Manual > BRSR > EODHD', transformation:'Normalized 0-100, sector percentile rank', downstream:['ESG Dashboard','Portfolio Manager','Screener','Report Studio','Optimizer'], quality:82, age_hours:12, category:'ESG' },
  { field:'scope1_mt', label:'Scope 1 (Mt CO2e)', sources:['BRSR (India)','Company Reports','Sector Estimate'], priority:'Reported > BRSR > Estimate', transformation:'Converted to Mt CO2e, FX-adjusted', downstream:['GHG Tracker','WACI','PCAF','Carbon Budget','Scope 3 Engine','ITR Model'], quality:75, age_hours:36, category:'Emissions' },
  { field:'scope2_mt', label:'Scope 2 (Mt CO2e)', sources:['BRSR (India)','Company Reports','Sector Estimate'], priority:'Same as Scope 1', transformation:'Location-based default, market-based where available', downstream:['GHG Tracker','WACI','PCAF','Carbon Budget','Scope 3 Engine','ITR Model'], quality:72, age_hours:36, category:'Emissions' },
  { field:'scope3_mt', label:'Scope 3 (Mt CO2e)', sources:['Scope 3 Engine','Company Reports','EEIO Estimates'], priority:'Reported > Engine > EEIO', transformation:'15 category rollup, upstream/downstream split', downstream:['GHG Tracker','Full Carbon Footprint','ITR Model','Supply Chain Risk'], quality:48, age_hours:72, category:'Emissions' },
  { field:'revenue_usd_mn', label:'Revenue (USD Mn)', sources:['EODHD','Company Master (India INR)','Exchange Files'], priority:'EODHD > Exchange > Manual', transformation:'FX conversion to USD Mn (13 currencies)', downstream:['GHG Intensity','Carbon Efficiency','WACI','All financial ratios'], quality:94, age_hours:8, category:'Financial' },
  { field:'market_cap_usd_mn', label:'Market Cap (USD Mn)', sources:['EODHD','Exchange Files','Alpha Vantage'], priority:'EODHD > Exchange > AV', transformation:'FX conversion, daily update', downstream:['PCAF Attribution','Portfolio weights','Size factor'], quality:96, age_hours:6, category:'Financial' },
  { field:'evic_usd_mn', label:'EVIC (USD Mn)', sources:['Computed: MCap + Debt - Cash'], priority:'Always computed', transformation:'market_cap + total_debt - cash_equivalents', downstream:['PCAF Attribution Factor','Financed Emissions'], quality:88, age_hours:8, category:'Financial' },
  { field:'transition_risk_score', label:'Transition Risk Score', sources:['Computed'], priority:'Always computed', transformation:'f(sector, carbon_intensity, sbti, nz_year) -> 0-100', downstream:['Transition Risk module','Composite Risk','Optimizer','Stress Test'], quality:85, age_hours:24, category:'Risk' },
  { field:'physical_risk_score', label:'Physical Risk Score', sources:['Computed','External Climate Models'], priority:'Model > Estimate', transformation:'g(location, sector, acute_risk, chronic_risk) -> 0-100', downstream:['Physical Risk module','Composite Risk','Optimizer','Stress Test'], quality:78, age_hours:48, category:'Risk' },
  { field:'composite_risk_score', label:'Composite Risk Score', sources:['Computed'], priority:'Always computed', transformation:'0.5*transition + 0.3*physical + 0.2*regulatory', downstream:['Executive Dashboard','Portfolio Risk','Screener','Report Studio'], quality:80, age_hours:24, category:'Risk' },
  { field:'sbti_status', label:'SBTi Status', sources:['SBTi Database','Manual Override'], priority:'SBTi DB > Manual', transformation:'Categorical: Committed/Targets Set/Validated/No', downstream:['Paris Alignment','Net Zero Tracker','Transition Risk'], quality:90, age_hours:168, category:'Targets' },
  { field:'net_zero_year', label:'Net Zero Target Year', sources:['Company Disclosure','Net Zero Tracker','Manual'], priority:'Company > Tracker > Manual', transformation:'Year validation, null if not committed', downstream:['Net Zero Tracker','ITR Model','Transition Risk'], quality:85, age_hours:168, category:'Targets' },
  { field:'ghg_intensity', label:'GHG Intensity', sources:['Computed'], priority:'Always computed', transformation:'(S1+S2) * 1,000,000 / Revenue', downstream:['WACI','Carbon Efficiency','Intensity Trend','Screener'], quality:74, age_hours:36, category:'Computed' },
  { field:'waci', label:'WACI (Portfolio)', sources:['Computed'], priority:'Always computed', transformation:'Sum(weight_i * intensity_i)', downstream:['Portfolio Dashboard','TCFD Report','Benchmarking'], quality:72, age_hours:36, category:'Computed' },
  { field:'pcaf_financed', label:'PCAF Financed Emissions', sources:['Computed'], priority:'Always computed', transformation:'Sum(exposure/EVIC * (S1+S2))', downstream:['PCAF Module','TCFD Report','Portfolio Dashboard'], quality:70, age_hours:36, category:'Computed' },
  { field:'board_diversity_pct', label:'Board Diversity %', sources:['BRSR (India)','Manual Override','Proxy Statements'], priority:'Manual > BRSR > Proxy', transformation:'Female directors / Total directors * 100', downstream:['Governance Module','ESG Score','Screener'], quality:68, age_hours:720, category:'Governance' },
  { field:'sector_gics', label:'GICS Sector', sources:['EODHD','Company Master','Manual'], priority:'EODHD > Master > Manual', transformation:'Map to standard GICS L1/L2/L3', downstream:['All sector-based analyses','Benchmarking','Peer Comparison'], quality:95, age_hours:720, category:'Classification' },
  { field:'country_iso2', label:'Country (ISO2)', sources:['Company Master','EODHD'], priority:'Master > EODHD', transformation:'Standardize to ISO 3166-1 alpha-2', downstream:['Geographic analysis','Sovereign risk','Regulatory mapping'], quality:98, age_hours:720, category:'Classification' },
];

/* ══════════════════════════════════════════════════════════════
   TRANSFORMATIONS REGISTRY
   ══════════════════════════════════════════════════════════════ */
const TRANSFORMATIONS = [
  { id:'fx_conversion', name:'FX Currency Conversion', description:'Converts local currency to USD Mn using daily FX rates', input:'revenue_inr_cr / revenue_gbp_mn / etc.', output:'revenue_usd_mn', formula:'value * FX_RATE', category:'Financial' },
  { id:'ghg_intensity', name:'GHG Intensity Calculation', description:'Emissions per unit revenue', input:'scope1_mt + scope2_mt, revenue_usd_mn', output:'ghg_intensity_tco2e_per_mn', formula:'(S1 + S2) * 1,000,000 / Revenue', category:'Emissions' },
  { id:'waci', name:'WACI Computation', description:'Weighted Average Carbon Intensity for portfolio', input:'portfolio weights, company GHG intensity', output:'portfolio_waci', formula:'Sum(weight_i * intensity_i)', category:'Portfolio' },
  { id:'pcaf_af', name:'PCAF Attribution Factor', description:'Investor share of company emissions', input:'exposure_usd_mn, evic_usd_mn', output:'attribution_factor', formula:'Exposure / EVIC', category:'Portfolio' },
  { id:'pcaf_financed', name:'PCAF Financed Emissions', description:'Total financed emissions for portfolio', input:'attribution_factor, scope1_mt, scope2_mt', output:'financed_emissions_tco2e', formula:'Sum(AF_i * (S1_i + S2_i))', category:'Portfolio' },
  { id:'evic', name:'EVIC Calculation', description:'Enterprise Value Including Cash', input:'market_cap, total_debt, cash_equivalents', output:'evic_usd_mn', formula:'MCap + TotalDebt - Cash', category:'Financial' },
  { id:'itr', name:'Implied Temperature Rise', description:'Company alignment to temperature pathway', input:'current_intensity, target_intensity, sector_budget', output:'itr_degrees_c', formula:'Budget_overshoot -> temp mapping via IPCC curves', category:'Climate' },
  { id:'transition_risk', name:'Transition Risk Scoring', description:'Multi-factor transition risk assessment', input:'sector, carbon_intensity, sbti, nz_year, regulatory_exposure', output:'transition_risk_score (0-100)', formula:'w1*sector_risk + w2*intensity_pctile + w3*(1-sbti) + w4*nz_gap', category:'Risk' },
  { id:'physical_risk', name:'Physical Risk Scoring', description:'Location & sector-based physical risk', input:'lat/lon, sector, acute_hazards, chronic_hazards', output:'physical_risk_score (0-100)', formula:'max(acute_components) * sector_sensitivity + chronic_baseline', category:'Risk' },
  { id:'composite_risk', name:'Composite Risk Score', description:'Weighted blend of all risk dimensions', input:'transition_risk, physical_risk, regulatory_risk', output:'composite_risk_score (0-100)', formula:'0.5*T + 0.3*P + 0.2*R', category:'Risk' },
  { id:'carbon_var', name:'Carbon Value-at-Risk', description:'Portfolio financial loss from carbon pricing', input:'holdings, emissions, carbon_price_scenario', output:'carbon_var_usd_mn', formula:'Sum(holding_value * emission_intensity * carbon_price / revenue)', category:'Risk' },
  { id:'sector_percentile', name:'Sector Percentile Rank', description:'Rank within GICS sector', input:'any_metric, sector_peer_group', output:'percentile_rank (0-100)', formula:'rank(value) / count(peers) * 100', category:'Normalization' },
];

/* ══════════════════════════════════════════════════════════════
   FX RATE REGISTRY
   ══════════════════════════════════════════════════════════════ */
const FX_RATES = [
  { from:'INR', to:'USD', rate:0.01203, multiplier:'Cr -> USD Mn: * 0.1203', source:'EODHD', updated:'2025-03-25' },
  { from:'GBP', to:'USD', rate:1.2700, multiplier:'GBP Mn -> USD Mn: * 1.270', source:'EODHD', updated:'2025-03-25' },
  { from:'EUR', to:'USD', rate:1.0910, multiplier:'EUR Mn -> USD Mn: * 1.091', source:'EODHD', updated:'2025-03-25' },
  { from:'JPY', to:'USD', rate:0.007073, multiplier:'JPY Bn -> USD Mn: * 7.073', source:'EODHD', updated:'2025-03-25' },
  { from:'HKD', to:'USD', rate:0.1282, multiplier:'HKD Mn -> USD Mn: * 0.1282', source:'EODHD', updated:'2025-03-25' },
  { from:'AUD', to:'USD', rate:0.6540, multiplier:'AUD Mn -> USD Mn: * 0.654', source:'EODHD', updated:'2025-03-25' },
  { from:'SGD', to:'USD', rate:0.7510, multiplier:'SGD Mn -> USD Mn: * 0.751', source:'EODHD', updated:'2025-03-25' },
  { from:'KRW', to:'USD', rate:0.000752, multiplier:'KRW Bn -> USD Mn: * 0.752', source:'EODHD', updated:'2025-03-25' },
  { from:'CNY', to:'USD', rate:0.1380, multiplier:'CNY Mn -> USD Mn: * 0.138', source:'EODHD', updated:'2025-03-25' },
  { from:'BRL', to:'USD', rate:0.2010, multiplier:'BRL Mn -> USD Mn: * 0.201', source:'EODHD', updated:'2025-03-25' },
  { from:'ZAR', to:'USD', rate:0.0540, multiplier:'ZAR Mn -> USD Mn: * 0.054', source:'EODHD', updated:'2025-03-25' },
  { from:'CAD', to:'USD', rate:0.7380, multiplier:'CAD Mn -> USD Mn: * 0.738', source:'EODHD', updated:'2025-03-25' },
  { from:'CHF', to:'USD', rate:1.1300, multiplier:'CHF Mn -> USD Mn: * 1.130', source:'EODHD', updated:'2025-03-25' },
];

/* ══════════════════════════════════════════════════════════════
   SOURCE PRIORITY MATRIX
   ══════════════════════════════════════════════════════════════ */
const SOURCE_NAMES = ['Manual Override','BRSR','EODHD','Alpha Vantage','Company Reports','Sector Estimate','Computed'];
const PRIORITY_MATRIX = {
  'esg_score':       [1,2,3,null,null,null,null],
  'scope1_mt':       [null,2,null,null,1,3,null],
  'scope2_mt':       [null,2,null,null,1,3,null],
  'scope3_mt':       [null,null,null,null,1,3,2],
  'revenue_usd_mn':  [3,null,1,null,null,2,null],
  'market_cap_usd_mn':[null,null,1,3,null,2,null],
  'evic_usd_mn':     [null,null,null,null,null,null,1],
  'transition_risk_score':[null,null,null,null,null,null,1],
  'physical_risk_score':[null,null,null,null,null,null,1],
  'sbti_status':     [2,null,null,null,1,null,null],
  'net_zero_year':   [3,null,null,null,1,2,null],
  'ghg_intensity':   [null,null,null,null,null,null,1],
  'board_diversity_pct':[1,2,null,null,3,null,null],
  'sector_gics':     [3,null,1,null,2,null,null],
};

/* ══════════════════════════════════════════════════════════════
   AUDIT TRAIL ENTRIES (simulated + persisted)
   ══════════════════════════════════════════════════════════════ */
const generateAuditEntries = () => {
  const entries = [];
  const companies = ['Reliance Industries','Tata Consultancy','HDFC Bank','Apple Inc','Microsoft Corp','Shell PLC','Nestle SA','Toyota Motor','BHP Group','Samsung Electronics'];
  const fields = ['esg_score','scope1_mt','revenue_usd_mn','transition_risk_score','net_zero_year','board_diversity_pct'];
  const sources = ['BRSR Sync','EODHD API','Manual Override','Computed','Alpha Vantage'];
  const baseDate = new Date('2025-03-25T12:00:00Z');
  for (let i = 0; i < 40; i++) {
    const d = new Date(baseDate.getTime() - i * 3600000 * (sr(_sc++)*12+1));
    const field = fields[Math.floor(sr(_sc++)*fields.length)];
    const prevVal = (sr(_sc++)*80+10).toFixed(1);
    const newVal = (parseFloat(prevVal) + (sr(_sc++)-0.5)*20).toFixed(1);
    entries.push({ timestamp:d.toISOString(), company:companies[Math.floor(sr(_sc++)*companies.length)], field, source:sources[Math.floor(sr(_sc++)*sources.length)], prev_value:prevVal, new_value:newVal, change_pct:((newVal-prevVal)/prevVal*100).toFixed(1) });
  }
  return entries.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/* ══════════════════════════════════════════════════════════════
   MANUAL OVERRIDE TRACKER data
   ══════════════════════════════════════════════════════════════ */
const MANUAL_OVERRIDES = [
  { company:'Reliance Industries', field:'esg_score', original:68, override:74, reason:'Updated post-BRSR filing review', user:'Analyst A', date:'2025-03-20', source_key:'ra_manual_overrides' },
  { company:'Tata Steel', field:'scope1_mt', original:28.5, override:26.2, reason:'Corrected conversion factor', user:'Analyst B', date:'2025-03-18', source_key:'ra_manual_overrides' },
  { company:'ICICI Bank', field:'board_diversity_pct', original:15, override:22, reason:'New board appointment Q1 2025', user:'Analyst A', date:'2025-03-15', source_key:'ra_board_diversity_v1' },
  { company:'Infosys', field:'net_zero_year', original:null, override:2040, reason:'Announced at AGM', user:'Analyst C', date:'2025-03-10', source_key:'ra_manual_overrides' },
  { company:'HDFC Bank', field:'transition_risk_score', original:42, override:38, reason:'Sector reclassification', user:'Analyst B', date:'2025-03-08', source_key:'ra_manual_overrides' },
  { company:'Wipro', field:'esg_score', original:62, override:67, reason:'New sustainability report data', user:'Analyst A', date:'2025-03-05', source_key:'ra_manual_overrides' },
];

/* ══════════════════════════════════════════════════════════════
   IMPACT ANALYSIS — dependency tree
   ══════════════════════════════════════════════════════════════ */
const IMPACT_MAP = {
  'scope1_mt':['ghg_intensity','waci','pcaf_financed','carbon_budget_remaining','itr_degrees','transition_risk_score','composite_risk_score','carbon_var','scope3_upstream_total','intensity_trend','sector_percentile_emissions','portfolio_carbon_footprint','stress_test_results','tcfd_metrics','net_zero_gap'],
  'revenue_usd_mn':['ghg_intensity','carbon_efficiency','waci','pe_ratio','ev_revenue','revenue_growth','all_intensity_metrics','sector_ranking','financial_ratios','portfolio_weights_revenue','benchmarking_metrics','report_financials','screener_filters'],
  'market_cap_usd_mn':['evic_usd_mn','pcaf_attribution_factor','pcaf_financed','portfolio_weight','size_factor','mv_return','benchmark_tracking','portfolio_nav','concentration_risk','liquidity_score','rebalancing_signals'],
  'esg_score':['portfolio_esg_average','esg_momentum','screener_ranking','best_in_class_selection','exclusion_screening','report_esg_summary','optimizer_constraints','peer_comparison','engagement_priority','risk_premium_adjustment'],
  'transition_risk_score':['composite_risk_score','portfolio_transition_risk','stress_test_transition','optimizer_risk_budget','engagement_priority','stranded_asset_flag','carbon_var_adjustment','scenario_analysis','tcfd_transition_metrics','report_risk_section'],
};

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, cursor:onClick?'pointer':'default', transition:'box-shadow .15s', ...style }}
    onMouseEnter={e => { if(onClick) e.currentTarget.style.boxShadow='0 4px 16px rgba(27,58,92,.10)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}>
    {children}
  </div>
);
const Badge = ({ children, color = T.navy, bg }) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, color, background:bg || (color + '18'), whiteSpace:'nowrap', letterSpacing:'.3px' }}>{children}</span>
);
const Btn = ({ children, onClick, primary, small, disabled, style }) => (
  <button disabled={disabled} onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:7, border:primary?'none':`1px solid ${T.border}`, background:primary?T.navy:T.surface, color:primary?'#fff':T.text, fontSize:small?11:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, fontFamily:T.font, transition:'all .15s', ...style }}>{children}</button>
);
const SortIcon = ({ col, sortCol, sortDir }) => col === sortCol ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD';

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function DataLineagePage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || [], []);
  const companies = useMemo(() => GLOBAL_COMPANY_MASTER || [], []);

  /* Sort state */
  const [sortCol, setSortCol] = useState('field');
  const [sortDir, setSortDir] = useState('asc');
  const toggleSort = col => { setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'); setSortCol(col); };

  /* Selected field for detail */
  const [selField, setSelField] = useState('esg_score');
  const selectedLineage = useMemo(() => DATA_LINEAGE_FIELDS.find(f => f.field === selField) || DATA_LINEAGE_FIELDS[0], [selField]);

  /* Impact analysis field */
  const [impactField, setImpactField] = useState('scope1_mt');
  const impactTargets = useMemo(() => IMPACT_MAP[impactField] || [], [impactField]);

  /* Audit trail (persisted) */
  const [auditTrail, setAuditTrail] = useState(() => loadLS(LS_AUDIT) || generateAuditEntries());
  useEffect(() => { saveLS(LS_AUDIT, auditTrail.slice(0, 200)); }, [auditTrail]);

  /* Category filter */
  const [catFilter, setCatFilter] = useState('All');
  const categories = useMemo(() => ['All', ...new Set(DATA_LINEAGE_FIELDS.map(f => f.category))], []);

  /* Sorted & filtered fields */
  const sortedFields = useMemo(() => {
    let data = catFilter === 'All' ? DATA_LINEAGE_FIELDS : DATA_LINEAGE_FIELDS.filter(f => f.category === catFilter);
    return [...data].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortCol, sortDir, catFilter]);

  /* Transformation sort */
  const [txSortCol, setTxSortCol] = useState('name');
  const [txSortDir, setTxSortDir] = useState('asc');
  const toggleTxSort = col => { setTxSortDir(txSortCol === col && txSortDir === 'asc' ? 'desc' : 'asc'); setTxSortCol(col); };
  const sortedTransformations = useMemo(() => {
    return [...TRANSFORMATIONS].sort((a, b) => {
      let va = a[txSortCol], vb = b[txSortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
      return txSortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
  }, [txSortCol, txSortDir]);

  /* ── KPIs ── */
  const avgQuality = Math.round(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.quality, 0) / DATA_LINEAGE_FIELDS.length);
  const avgAge = Math.round(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.age_hours, 0) / DATA_LINEAGE_FIELDS.length);
  const allSources = new Set(DATA_LINEAGE_FIELDS.flatMap(f => f.sources));
  const allDownstream = new Set(DATA_LINEAGE_FIELDS.flatMap(f => f.downstream));
  const lineageCoverage = Math.round(DATA_LINEAGE_FIELDS.filter(f => f.sources.length > 0 && f.downstream.length > 0).length / DATA_LINEAGE_FIELDS.length * 100);

  /* Freshness bar chart data */
  const freshnessData = useMemo(() => DATA_LINEAGE_FIELDS.map(f => ({ field:f.label.length > 14 ? f.label.slice(0,12)+'...' : f.label, hours:f.age_hours, fullLabel:f.label })), []);

  /* ── Exports ── */
  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return `"${Array.isArray(v) ? v.join('; ') : (v ?? '')}"`; }).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const printPage = () => window.print();

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  const thStyle = { padding:'10px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:12, fontWeight:700, color:T.textSec, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' };
  const tdStyle = { padding:'10px 12px', borderBottom:`1px solid ${T.border}`, fontSize:13 };
  const arrowBox = { display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, fontSize:18, color:T.navy, flexShrink:0 };

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* ── S1: Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, color:T.navy, margin:0 }}>Data Lineage & Audit Trail</h1>
          <p style={{ color:T.textSec, fontSize:13, margin:'4px 0 0' }}>Trace every field from source through transformation to consuming module</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <Badge color={T.navy}>Every Field Traced</Badge>
          <Badge color={T.sage}>Source &rarr; Transform &rarr; Output</Badge>
          <Btn small onClick={() => exportCSV(DATA_LINEAGE_FIELDS.map(f => ({...f, sources:f.sources.join('; '), downstream:f.downstream.join('; ')})), 'lineage_report.csv')}>Lineage CSV</Btn>
          <Btn small onClick={() => exportCSV(auditTrail, 'audit_trail.csv')}>Audit CSV</Btn>
          <Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── S2: KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:28 }}>
        {[
          { label:'Fields Tracked', value:DATA_LINEAGE_FIELDS.length, color:T.navy },
          { label:'Data Sources', value:allSources.size, color:T.sage },
          { label:'Transformations', value:TRANSFORMATIONS.length, color:T.navyL },
          { label:'Downstream Modules', value:allDownstream.size, color:T.gold },
          { label:'Manual Overrides Active', value:MANUAL_OVERRIDES.length, color:T.amber },
          { label:'Audit Trail Entries', value:auditTrail.length, color:T.navy },
          { label:'Data Age (avg)', value:`${avgAge}h`, color:ageColor(avgAge) },
          { label:'Lineage Coverage %', value:`${lineageCoverage}%`, color:qualityColor(lineageCoverage) },
        ].map((kpi, i) => (
          <Card key={i} style={{ padding:16, textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:700, color:kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* ── S3: Field Lineage Table ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>Field Lineage Table</h2>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {categories.map(c => (
              <Btn key={c} small primary={catFilter===c} onClick={() => setCatFilter(c)}>{c}</Btn>
            ))}
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {[{k:'field',l:'Field'},{k:'category',l:'Category'},{k:'quality',l:'Quality'},{k:'age_hours',l:'Age (h)'}].map(c => (
                <th key={c.k} style={thStyle} onClick={() => toggleSort(c.k)}>{c.l}<SortIcon col={c.k} sortCol={sortCol} sortDir={sortDir}/></th>
              ))}
              <th style={{...thStyle, cursor:'default'}}>Sources</th>
              <th style={{...thStyle, cursor:'default'}}>Priority</th>
              <th style={{...thStyle, cursor:'default'}}>Downstream</th>
              <th style={{...thStyle, cursor:'default'}}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {sortedFields.map((f, i) => (
              <tr key={i} style={{ background:selField===f.field ? T.navy+'08' : i%2===0 ? 'transparent' : T.surfaceH }}>
                <td style={{...tdStyle, fontFamily:'monospace', fontWeight:600, fontSize:12}}>{f.field}</td>
                <td style={tdStyle}><Badge color={T.navyL}>{f.category}</Badge></td>
                <td style={tdStyle}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:50, height:5, background:T.border, borderRadius:3 }}>
                      <div style={{ width:`${f.quality}%`, height:5, background:qualityColor(f.quality), borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:qualityColor(f.quality) }}>{f.quality}%</span>
                  </div>
                </td>
                <td style={{...tdStyle, color:ageColor(f.age_hours), fontWeight:600, fontSize:12}}>{f.age_hours}h</td>
                <td style={{...tdStyle, fontSize:11}}>{f.sources.slice(0,2).join(', ')}{f.sources.length>2 && ` +${f.sources.length-2}`}</td>
                <td style={{...tdStyle, fontSize:11, color:T.textSec}}>{f.priority}</td>
                <td style={{...tdStyle, fontSize:11}}>{f.downstream.length} modules</td>
                <td style={tdStyle}><Btn small onClick={() => setSelField(f.field)}>View</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S4: Lineage Flow Visualization ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Lineage Flow: <span style={{ color:T.navyL, fontFamily:'monospace' }}>{selectedLineage.field}</span></h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 16px' }}>{selectedLineage.label} &mdash; {selectedLineage.transformation}</p>
        <div style={{ display:'flex', alignItems:'stretch', gap:0, overflowX:'auto', paddingBottom:8 }}>
          {/* Sources */}
          <div style={{ flex:'0 0 200px', minWidth:180 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Sources</div>
            {selectedLineage.sources.map((s, i) => (
              <div key={i} style={{ padding:'8px 12px', background:T.sage+'12', border:`1px solid ${T.sage}30`, borderRadius:6, marginBottom:6, fontSize:12, fontWeight:500 }}>
                <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', background:T.sage, color:'#fff', fontSize:10, textAlign:'center', lineHeight:'18px', marginRight:6 }}>{i+1}</span>
                {s}
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div style={arrowBox}>&rarr;</div>
          {/* Transformation */}
          <div style={{ flex:'0 0 240px', minWidth:220 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Transformation</div>
            <div style={{ padding:12, background:T.gold+'12', border:`1px solid ${T.gold}30`, borderRadius:6, fontSize:12 }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>{selectedLineage.transformation.split(',')[0]}</div>
              <div style={{ fontSize:11, color:T.textSec }}>{selectedLineage.transformation}</div>
              <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>Priority: {selectedLineage.priority}</div>
            </div>
          </div>
          {/* Arrow */}
          <div style={arrowBox}>&rarr;</div>
          {/* Output */}
          <div style={{ flex:'0 0 140px', minWidth:130 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Output Field</div>
            <div style={{ padding:12, background:T.navy+'10', border:`1px solid ${T.navy}25`, borderRadius:6, textAlign:'center' }}>
              <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:13, color:T.navy }}>{selectedLineage.field}</div>
              <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>Quality: <span style={{ color:qualityColor(selectedLineage.quality), fontWeight:600 }}>{selectedLineage.quality}%</span></div>
            </div>
          </div>
          {/* Arrow */}
          <div style={arrowBox}>&rarr;</div>
          {/* Consumers */}
          <div style={{ flex:'1 1 200px', minWidth:180 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Consuming Modules ({selectedLineage.downstream.length})</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {selectedLineage.downstream.map((d, i) => (
                <Badge key={i} color={T.navyL}>{d}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── S5: Transformation Registry ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Transformation Registry</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {[{k:'name',l:'Name'},{k:'category',l:'Category'},{k:'input',l:'Inputs'},{k:'output',l:'Output'},{k:'formula',l:'Formula'}].map(c => (
                <th key={c.k} style={thStyle} onClick={() => toggleTxSort(c.k)}>{c.l}<SortIcon col={c.k} sortCol={txSortCol} sortDir={txSortDir}/></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTransformations.map((tx, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{tx.name}</td>
                <td style={tdStyle}><Badge color={T.navyL}>{tx.category}</Badge></td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', color:T.textSec, maxWidth:200}}>{tx.input}</td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', fontWeight:600}}>{tx.output}</td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', color:T.navy, background:T.surfaceH}}>{tx.formula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S6: Audit Trail Log ── */}
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>Audit Trail Log</h2>
          <div style={{ display:'flex', gap:8 }}>
            <Btn small onClick={() => exportCSV(auditTrail, 'audit_trail.csv')}>Export</Btn>
            <Btn small onClick={() => { setAuditTrail([]); saveLS(LS_AUDIT, []); }}>Clear</Btn>
          </div>
        </div>
        <div style={{ maxHeight:280, overflowY:'auto', border:`1px solid ${T.border}`, borderRadius:6 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, background:T.surface }}>
              <tr>{['Timestamp','Company','Field','Source','Prev','New','Change %'].map(h => <th key={h} style={{...thStyle, fontSize:10, padding:'8px 10px'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {auditTrail.slice(0, 50).map((e, i) => (
                <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                  <td style={{...tdStyle, fontSize:10, fontFamily:'monospace', padding:'6px 10px'}}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{...tdStyle, fontSize:11, fontWeight:600, padding:'6px 10px'}}>{e.company}</td>
                  <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', padding:'6px 10px'}}>{e.field}</td>
                  <td style={{...tdStyle, fontSize:11, padding:'6px 10px'}}><Badge color={T.navyL}>{e.source}</Badge></td>
                  <td style={{...tdStyle, fontSize:11, textAlign:'right', padding:'6px 10px', color:T.textMut}}>{e.prev_value}</td>
                  <td style={{...tdStyle, fontSize:11, textAlign:'right', padding:'6px 10px', fontWeight:600}}>{e.new_value}</td>
                  <td style={{...tdStyle, fontSize:11, textAlign:'right', padding:'6px 10px', color:parseFloat(e.change_pct) > 0 ? T.green : T.red, fontWeight:600}}>{parseFloat(e.change_pct) > 0 ? '+' : ''}{e.change_pct}%</td>
                </tr>
              ))}
              {auditTrail.length === 0 && <tr><td colSpan={7} style={{...tdStyle, textAlign:'center', color:T.textMut}}>No audit entries</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── S7: Source Priority Matrix ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Source Priority Matrix</h2>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              <th style={{...thStyle, fontSize:11, minWidth:120}}>Field</th>
              {SOURCE_NAMES.map(s => <th key={s} style={{...thStyle, fontSize:10, textAlign:'center', padding:'8px 6px'}}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PRIORITY_MATRIX).map(([field, priorities], ri) => (
              <tr key={ri} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontFamily:'monospace', fontWeight:600, fontSize:11}}>{field}</td>
                {priorities.map((p, ci) => (
                  <td key={ci} style={{
                    ...tdStyle, textAlign:'center', padding:'6px',
                    background:p === 1 ? T.green+'18' : p === 2 ? T.sage+'12' : p === 3 ? T.amber+'10' : 'transparent',
                    color:p ? (p === 1 ? T.green : p === 2 ? T.sage : T.amber) : T.textMut,
                    fontWeight:p ? 700 : 400
                  }}>
                    {p ? `P${p}` : '--'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:T.textMut }}>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.green+'18', border:`1px solid ${T.green}40`, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> P1 (Highest)</span>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.sage+'12', border:`1px solid ${T.sage}40`, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> P2</span>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.amber+'10', border:`1px solid ${T.amber}40`, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> P3</span>
        </div>
      </Card>

      {/* ── S8: Manual Override Tracker ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Manual Override Tracker ({MANUAL_OVERRIDES.length} active)</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Company','Field','Original','Override','Reason','User','Date','Source Key'].map(h => <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {MANUAL_OVERRIDES.map((o, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{o.company}</td>
                <td style={{...tdStyle, fontFamily:'monospace', fontSize:11}}>{o.field}</td>
                <td style={{...tdStyle, fontSize:12, textAlign:'right', color:T.textMut}}>{o.original ?? 'null'}</td>
                <td style={{...tdStyle, fontSize:12, textAlign:'right', fontWeight:600, color:T.navy}}>{o.override}</td>
                <td style={{...tdStyle, fontSize:11, color:T.textSec, maxWidth:200}}>{o.reason}</td>
                <td style={{...tdStyle, fontSize:11}}>{o.user}</td>
                <td style={{...tdStyle, fontSize:11}}>{o.date}</td>
                <td style={{...tdStyle, fontSize:10, fontFamily:'monospace', color:T.textMut}}>{o.source_key}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S9: Data Freshness BarChart ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Freshness per Field</h2>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={freshnessData} margin={{ top:10, right:20, bottom:60, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="field" tick={{ fontSize:9, fill:T.textSec }} angle={-45} textAnchor="end" height={80}/>
            <YAxis tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Hours Since Update', angle:-90, position:'insideLeft', style:{ fontSize:11, fill:T.textSec } }}/>
            <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} formatter={(v, name, props) => [`${v} hours`, props.payload.fullLabel || 'Age']}/>
            <Bar dataKey="hours" radius={[4,4,0,0]}>
              {freshnessData.map((f, i) => <Cell key={i} fill={f.hours > 168 ? T.red : f.hours > 48 ? T.amber : T.sage}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, fontSize:11, color:T.textMut }}>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.sage, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> &lt;48h (Fresh)</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.amber, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> 48-168h (Aging)</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.red, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> &gt;168h (Stale)</span>
        </div>
      </Card>

      {/* ── S10: Impact Analysis ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Impact Analysis</h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>Select a field to see all downstream calculations affected by a change.</p>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex:'0 0 220px' }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Source Field</label>
            <select value={impactField} onChange={e => setImpactField(e.target.value)} style={{ display:'block', marginTop:4, padding:'8px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, width:'100%' }}>
              {Object.keys(IMPACT_MAP).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <div style={{ marginTop:8, fontSize:12 }}>
              <strong style={{ color:T.navy }}>{impactTargets.length}</strong> <span style={{ color:T.textSec }}>downstream dependencies</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textSec, marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Dependency Tree for <span style={{ fontFamily:'monospace', color:T.navy }}>{impactField}</span></div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {impactTargets.map((t, i) => (
                <div key={i} style={{ padding:'6px 12px', background:T.red+'08', border:`1px solid ${T.red}20`, borderRadius:6, fontSize:11, fontFamily:'monospace', color:T.text }}>
                  <span style={{ color:T.red, marginRight:4 }}>{i+1}.</span>{t}
                </div>
              ))}
            </div>
            {impactTargets.length > 0 && (
              <div style={{ marginTop:12, padding:10, background:T.amber+'08', border:`1px solid ${T.amber}20`, borderRadius:6, fontSize:11, color:T.amber }}>
                Warning: A change to <strong>{impactField}</strong> will trigger recalculation of {impactTargets.length} downstream metrics. Consider running a full portfolio recompute.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── S11: FX Rate Registry ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>FX Rate Registry ({FX_RATES.length} currencies)</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['From','To','Rate','Conversion','Source','Last Updated'].map(h => <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {FX_RATES.map((fx, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:700, fontFamily:'monospace', fontSize:13}}>{fx.from}</td>
                <td style={{...tdStyle, fontWeight:700, fontFamily:'monospace', fontSize:13}}>{fx.to}</td>
                <td style={{...tdStyle, fontFamily:'monospace', fontSize:12}}>{fx.rate}</td>
                <td style={{...tdStyle, fontSize:11, color:T.textSec}}>{fx.multiplier}</td>
                <td style={tdStyle}><Badge color={T.sage}>{fx.source}</Badge></td>
                <td style={{...tdStyle, fontSize:11}}>{fx.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S12: Data Quality Score by Category ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Quality by Category</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
          {categories.filter(c => c !== 'All').map((cat, i) => {
            const catFields = DATA_LINEAGE_FIELDS.filter(f => f.category === cat);
            const catAvgQuality = Math.round(catFields.reduce((s,f) => s + f.quality, 0) / catFields.length);
            const catAvgAge = Math.round(catFields.reduce((s,f) => s + f.age_hours, 0) / catFields.length);
            return (
              <div key={i} style={{ padding:16, border:`1px solid ${qualityColor(catAvgQuality)}30`, borderRadius:10, background:qualityColor(catAvgQuality)+'06', textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>{cat}</div>
                <div style={{ fontSize:28, fontWeight:700, color:qualityColor(catAvgQuality) }}>{catAvgQuality}%</div>
                <div style={{ fontSize:10, color:T.textMut, marginBottom:8 }}>Avg Quality</div>
                <div style={{ height:4, background:T.border, borderRadius:2, marginBottom:8 }}>
                  <div style={{ height:4, background:qualityColor(catAvgQuality), borderRadius:2, width:`${catAvgQuality}%` }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textSec }}>
                  <span>{catFields.length} fields</span>
                  <span style={{ color:ageColor(catAvgAge) }}>~{catAvgAge}h avg</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── S13: Lineage Coverage Matrix ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Lineage Coverage Matrix</h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>Shows which consuming modules depend on which data fields.</p>
        {(() => {
          const allModules = [...new Set(DATA_LINEAGE_FIELDS.flatMap(f => f.downstream))].sort();
          const displayModules = allModules.slice(0, 12);
          return (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
              <thead>
                <tr>
                  <th style={{...thStyle, fontSize:10, minWidth:110, position:'sticky', left:0, background:T.surface, zIndex:1}}>Field</th>
                  {displayModules.map(m => <th key={m} style={{...thStyle, fontSize:9, textAlign:'center', padding:'6px 3px', minWidth:55, maxWidth:70, wordBreak:'break-word', lineHeight:'1.2'}}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {DATA_LINEAGE_FIELDS.slice(0, 14).map((f, ri) => (
                  <tr key={ri} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdStyle, fontFamily:'monospace', fontWeight:600, fontSize:10, padding:'5px 8px', position:'sticky', left:0, background:ri%2===0?T.surface:T.surfaceH, zIndex:1}}>{f.field}</td>
                    {displayModules.map((m, ci) => {
                      const has = f.downstream.includes(m);
                      return (
                        <td key={ci} style={{...tdStyle, textAlign:'center', padding:'4px 2px', background:has ? T.sage+'15' : 'transparent'}}>
                          {has ? <span style={{ color:T.sage, fontSize:14 }}>&#x25CF;</span> : <span style={{ color:T.textMut+'40', fontSize:10 }}>--</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
        <div style={{ marginTop:8, fontSize:11, color:T.textMut }}>
          <span style={{ color:T.sage, marginRight:4 }}>&#x25CF;</span> Dependency exists | Showing top 12 modules of {[...new Set(DATA_LINEAGE_FIELDS.flatMap(f => f.downstream))].length} total
        </div>
      </Card>

      {/* ── S14: Data Staleness Alerts ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px', color:T.amber }}>Data Staleness Alerts</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {DATA_LINEAGE_FIELDS.filter(f => f.age_hours > 48).map((f, i) => (
            <div key={i} style={{ padding:14, border:`1px solid ${ageColor(f.age_hours)}30`, borderRadius:8, background:ageColor(f.age_hours)+'06' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:600, fontFamily:'monospace' }}>{f.field}</span>
                <Badge color={ageColor(f.age_hours)}>{f.age_hours}h old</Badge>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Category: {f.category} | Quality: {f.quality}%</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>Sources: {f.sources.join(', ')}</div>
              <div style={{ fontSize:11, color:ageColor(f.age_hours) }}>
                {f.age_hours > 168 ? 'Critical: Data over 7 days old. Schedule immediate refresh.' :
                 f.age_hours > 72 ? 'Warning: Data over 3 days old. Consider refreshing.' :
                 'Notice: Data aging. Next scheduled refresh recommended.'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S15: Transformation Dependency Graph ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Transformation Dependency Graph</h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>How transformations feed into each other, from raw inputs to final portfolio metrics.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[
            { tier:'Tier 1: Raw Data', items:['revenue_local','emissions_reported','market_cap_local','debt_total','cash_equivalents','board_composition'], color:T.sage },
            { tier:'Tier 2: Normalized', items:['revenue_usd_mn','scope1_mt','scope2_mt','market_cap_usd_mn','evic_usd_mn','board_diversity_pct'], color:T.navyL },
            { tier:'Tier 3: Derived Metrics', items:['ghg_intensity','carbon_efficiency','esg_score','transition_risk_score','physical_risk_score'], color:T.gold },
            { tier:'Tier 4: Portfolio Aggregates', items:['waci','pcaf_financed','portfolio_esg','composite_risk_score','carbon_var','itr_portfolio'], color:T.navy },
          ].map((tier, ti) => (
            <div key={ti}>
              <div style={{ fontSize:12, fontWeight:700, color:tier.color, marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'inline-block', width:20, height:20, borderRadius:'50%', background:tier.color, color:'#fff', fontSize:10, textAlign:'center', lineHeight:'20px' }}>{ti+1}</span>
                {tier.tier}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, paddingLeft:28 }}>
                {tier.items.map((item, ii) => (
                  <span key={ii} style={{ padding:'5px 10px', background:tier.color+'12', border:`1px solid ${tier.color}25`, borderRadius:6, fontSize:11, fontFamily:'monospace', color:T.text }}>{item}</span>
                ))}
              </div>
              {ti < 3 && <div style={{ textAlign:'center', fontSize:18, color:T.textMut, margin:'4px 0' }}>&darr;</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* ── S16: Data Completeness per Company Type ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Completeness by Company Segment</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Segment','Companies','ESG','Emissions','Financial','Risk','Targets','Governance','Overall'].map(h => <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { segment:'BRSR-Reporting (India)', count:30, esg:92, emissions:88, financial:95, risk:85, targets:78, governance:82, overall:87 },
              { segment:'Large Cap (US/EU)', count:178, esg:65, emissions:48, financial:96, risk:82, targets:55, governance:60, overall:68 },
              { segment:'Mid Cap (Global)', count:195, esg:45, emissions:32, financial:90, risk:70, targets:35, governance:42, overall:52 },
              { segment:'Small Cap / EM', count:288, esg:30, emissions:18, financial:82, risk:55, targets:20, governance:28, overall:39 },
            ].map((row, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{row.segment}</td>
                <td style={{...tdStyle, textAlign:'center', fontSize:12}}>{row.count}</td>
                {['esg','emissions','financial','risk','targets','governance','overall'].map(k => (
                  <td key={k} style={{...tdStyle, textAlign:'center'}}>
                    <span style={{ fontSize:12, fontWeight:k==='overall'?700:600, color:qualityColor(row[k]) }}>{row[k]}%</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S17: Recent Override Activity Timeline ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Recent Override Activity</h2>
        <div style={{ position:'relative', paddingLeft:24 }}>
          <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2, background:T.border }}/>
          {MANUAL_OVERRIDES.map((o, i) => (
            <div key={i} style={{ position:'relative', marginBottom:16, paddingLeft:20 }}>
              <div style={{ position:'absolute', left:-20, top:4, width:12, height:12, borderRadius:'50%', background:T.navy, border:`2px solid ${T.surface}`, zIndex:1 }}/>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>{o.date} &mdash; {o.user}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{o.company}: <span style={{ fontFamily:'monospace', color:T.navyL }}>{o.field}</span></div>
              <div style={{ fontSize:12, color:T.textSec }}>
                <span style={{ color:T.red, textDecoration:'line-through' }}>{o.original ?? 'null'}</span>
                <span style={{ margin:'0 6px', color:T.textMut }}>&rarr;</span>
                <span style={{ color:T.green, fontWeight:600 }}>{o.override}</span>
              </div>
              <div style={{ fontSize:11, color:T.textMut, fontStyle:'italic', marginTop:2 }}>{o.reason}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S18: Data Reconciliation Summary ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Reconciliation Summary</h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>Comparison of values across different sources for key fields. Discrepancies highlighted.</p>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Company','Field','Source A','Value A','Source B','Value B','Discrepancy','Resolution'].map(h => <th key={h} style={{...thStyle, fontSize:10}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { company:'Reliance Industries', field:'revenue_usd_mn', srcA:'BRSR', valA:'$108,234', srcB:'EODHD', valB:'$107,850', disc:'0.35%', resolution:'Use BRSR (more recent filing)' },
              { company:'Tata Consultancy', field:'esg_score', srcA:'BRSR', valA:74, srcB:'EODHD', valB:68, disc:'8.1%', resolution:'Manual review triggered' },
              { company:'Shell PLC', field:'scope1_mt', srcA:'Company Report', valA:68.2, srcB:'Sector Estimate', valB:72.5, disc:'5.9%', resolution:'Use Company Report (P1)' },
              { company:'Apple Inc', field:'market_cap_usd_mn', srcA:'EODHD', valA:'$3,420,000', srcB:'Alpha Vantage', valB:'$3,418,500', disc:'0.04%', resolution:'Within tolerance (auto-resolved)' },
              { company:'Toyota Motor', field:'scope2_mt', srcA:'EODHD', valA:5.8, srcB:'Sector Estimate', valB:7.2, disc:'19.4%', resolution:'Flagged for analyst review' },
            ].map((row, i) => {
              const discVal = parseFloat(row.disc);
              return (
                <tr key={i} style={{ background:discVal > 10 ? T.red+'06' : i%2===0 ? 'transparent' : T.surfaceH }}>
                  <td style={{...tdStyle, fontWeight:600, fontSize:11}}>{row.company}</td>
                  <td style={{...tdStyle, fontFamily:'monospace', fontSize:10}}>{row.field}</td>
                  <td style={{...tdStyle, fontSize:10}}><Badge color={T.sage}>{row.srcA}</Badge></td>
                  <td style={{...tdStyle, fontSize:11, textAlign:'right'}}>{row.valA}</td>
                  <td style={{...tdStyle, fontSize:10}}><Badge color={T.navyL}>{row.srcB}</Badge></td>
                  <td style={{...tdStyle, fontSize:11, textAlign:'right'}}>{row.valB}</td>
                  <td style={{...tdStyle, fontSize:11, fontWeight:600, color:discVal > 10 ? T.red : discVal > 5 ? T.amber : T.green, textAlign:'center'}}>{row.disc}</td>
                  <td style={{...tdStyle, fontSize:10, color:T.textSec}}>{row.resolution}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* ── S19: Data Governance Compliance Checklist ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Governance Compliance</h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>Regulatory and internal governance requirements for data lineage tracking.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {[
            { framework:'TCFD', requirement:'Disclose data sources for climate metrics', status:'compliant', coverage:'92%', fields:['scope1_mt','scope2_mt','transition_risk_score','physical_risk_score','waci'], color:T.green },
            { framework:'PCAF', requirement:'Trace financed emissions to source data', status:'compliant', coverage:'88%', fields:['pcaf_financed','evic_usd_mn','market_cap_usd_mn','scope1_mt','scope2_mt'], color:T.green },
            { framework:'EU Taxonomy', requirement:'Full lineage for taxonomy-aligned activities', status:'partial', coverage:'65%', fields:['revenue_usd_mn','sector_gics','transition_risk_score'], color:T.amber },
            { framework:'CSRD / ESRS', requirement:'Double materiality data traceability', status:'partial', coverage:'58%', fields:['esg_score','scope1_mt','scope2_mt','scope3_mt','board_diversity_pct'], color:T.amber },
            { framework:'BRSR (India)', requirement:'SEBI-mandated ESG disclosure audit trail', status:'compliant', coverage:'95%', fields:['esg_score','scope1_mt','scope2_mt','revenue_usd_mn','board_diversity_pct'], color:T.green },
            { framework:'Internal Policy', requirement:'All manual overrides must be logged and approved', status:'compliant', coverage:'100%', fields:['All override-capable fields'], color:T.green },
          ].map((item, i) => (
            <div key={i} style={{ padding:14, border:`1px solid ${item.color}30`, borderRadius:8, background:item.color+'05' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:T.navy }}>{item.framework}</span>
                <Badge color={item.color}>{item.status}</Badge>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>{item.requirement}</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:6 }}>
                <span style={{ color:T.textMut }}>Coverage</span>
                <span style={{ fontWeight:600, color:item.color }}>{item.coverage}</span>
              </div>
              <div style={{ height:4, background:T.border, borderRadius:2, marginBottom:8 }}>
                <div style={{ height:4, background:item.color, borderRadius:2, width:item.coverage }}/>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {item.fields.map((f, fi) => (
                  <span key={fi} style={{ fontSize:9, padding:'2px 5px', background:T.surfaceH, borderRadius:3, fontFamily:'monospace', color:T.textSec }}>{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S20: Source Reliability Scoring ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Source Reliability Scoring</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Source','Reliability %','Coverage','Timeliness','Accuracy','Consistency','Update Freq','Notes'].map(h => <th key={h} style={{...thStyle, fontSize:10}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { source:'EODHD Fundamentals', reliability:92, coverage:88, timeliness:95, accuracy:93, consistency:91, freq:'Daily', notes:'Best for financial data' },
              { source:'EODHD EOD Prices', reliability:97, coverage:99, timeliness:98, accuracy:96, consistency:97, freq:'Daily', notes:'Highest reliability source' },
              { source:'Alpha Vantage', reliability:85, coverage:72, timeliness:88, accuracy:90, consistency:82, freq:'Daily', notes:'Good for US technical data' },
              { source:'BRSR (Supabase)', reliability:88, coverage:95, timeliness:70, accuracy:92, consistency:85, freq:'Quarterly', notes:'Comprehensive India ESG' },
              { source:'Company Reports', reliability:94, coverage:45, timeliness:55, accuracy:98, consistency:90, freq:'Annual/Bi-annual', notes:'Most accurate but least timely' },
              { source:'Sector Estimates', reliability:62, coverage:100, timeliness:90, accuracy:55, consistency:72, freq:'Monthly', notes:'Gap-filler, lower accuracy' },
              { source:'Manual Overrides', reliability:95, coverage:5, timeliness:99, accuracy:95, consistency:88, freq:'Ad-hoc', notes:'Analyst-verified corrections' },
            ].map((row, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{row.source}</td>
                <td style={tdStyle}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:50, height:5, background:T.border, borderRadius:3 }}>
                      <div style={{ width:`${row.reliability}%`, height:5, background:qualityColor(row.reliability), borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:qualityColor(row.reliability) }}>{row.reliability}%</span>
                  </div>
                </td>
                {['coverage','timeliness','accuracy','consistency'].map(k => (
                  <td key={k} style={{...tdStyle, textAlign:'center', fontSize:11, fontWeight:600, color:qualityColor(row[k])}}>{row[k]}%</td>
                ))}
                <td style={{...tdStyle, fontSize:11}}>{row.freq}</td>
                <td style={{...tdStyle, fontSize:10, color:T.textMut}}>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S21: Lineage Statistics Summary ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Lineage Statistics Summary</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {[
            { label:'Total Source-to-Output Paths', value:DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.sources.length * f.downstream.length, 0), desc:'Unique data flow paths traced in the platform', color:T.navy },
            { label:'Highest Quality Field', value:DATA_LINEAGE_FIELDS.reduce((best,f) => f.quality > best.quality ? f : best).label, desc:`${DATA_LINEAGE_FIELDS.reduce((best,f) => f.quality > best.quality ? f : best).quality}% quality score`, color:T.green },
            { label:'Most Connected Field', value:DATA_LINEAGE_FIELDS.reduce((best,f) => f.downstream.length > best.downstream.length ? f : best).label, desc:`Feeds ${DATA_LINEAGE_FIELDS.reduce((best,f) => f.downstream.length > best.downstream.length ? f : best).downstream.length} downstream modules`, color:T.sage },
            { label:'Stalest Field', value:DATA_LINEAGE_FIELDS.reduce((worst,f) => f.age_hours > worst.age_hours ? f : worst).label, desc:`${DATA_LINEAGE_FIELDS.reduce((worst,f) => f.age_hours > worst.age_hours ? f : worst).age_hours} hours since last update`, color:T.red },
            { label:'Avg Sources per Field', value:(DATA_LINEAGE_FIELDS.reduce((s,f) => s + f.sources.length, 0) / DATA_LINEAGE_FIELDS.length).toFixed(1), desc:'Data redundancy / resilience measure', color:T.navyL },
            { label:'Computed vs Sourced', value:`${DATA_LINEAGE_FIELDS.filter(f => f.sources.includes('Computed')).length} / ${DATA_LINEAGE_FIELDS.filter(f => !f.sources.includes('Computed')).length}`, desc:'Derived metrics vs raw data fields', color:T.gold },
          ].map((stat, i) => (
            <div key={i} style={{ padding:14, background:stat.color+'06', border:`1px solid ${stat.color}20`, borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:6 }}>{stat.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:stat.color }}>{stat.value}</div>
              <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>{stat.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S22: Cross-Navigation ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Related Modules</h2>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {[
            { label:'Data Quality Engine', path:'/data-quality', desc:'Validation rules & quality scoring' },
            { label:'API Orchestration', path:'/api-orchestration', desc:'API endpoints & rate management' },
            { label:'Data Enrichment', path:'/data-enrichment', desc:'Field enrichment & gap filling' },
            { label:'Live Feed Manager', path:'/live-feed-manager', desc:'Real-time exchange data feeds' },
            { label:'Portfolio Manager', path:'/portfolio', desc:'Holdings, weights & rebalancing' },
          ].map((m, i) => (
            <div key={i} onClick={() => navigate(m.path)} style={{ flex:'1 1 180px', padding:14, border:`1px solid ${T.border}`, borderRadius:8, cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{m.label}</div>
              <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
