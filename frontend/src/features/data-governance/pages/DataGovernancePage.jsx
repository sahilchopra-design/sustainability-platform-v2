import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_VENDOR = 'ra_vendor_assessments_v1';
const LS_EXCEPTIONS = 'ra_governance_exceptions_v1';
const LS_MATURITY = 'ra_governance_maturity_v1';
const LS_KEY = 'ep_s5_governance_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const today = new Date('2025-05-15');

/* ═══════════════════════════════════════════════════════════════════════════
   GOVERNANCE POLICIES
   ═══════════════════════════════════════════════════════════════════════════ */
const GOVERNANCE_POLICIES = [
  { id:'GP01', category:'Data Quality', policy:'All companies must pass critical validation rules before inclusion in reports', owner:'Data Quality Team', enforcement:'Automated', status:'active', last_reviewed:'2025-01-15', review_cycle:'Quarterly' },
  { id:'GP02', category:'Data Quality', policy:'ESG scores must be refreshed at least annually', owner:'ESG Analytics Team', enforcement:'Scheduled', status:'active', last_reviewed:'2025-02-01', review_cycle:'Quarterly' },
  { id:'GP03', category:'Data Quality', policy:'GHG emissions data must be third-party verified for Tier 1 PCAF classification', owner:'Climate Team', enforcement:'Manual Review', status:'active', last_reviewed:'2024-11-20', review_cycle:'Semi-Annual' },
  { id:'GP04', category:'Data Lineage', policy:'Every data point must have traceable source and transformation history', owner:'Data Engineering', enforcement:'Automated', status:'active', last_reviewed:'2025-03-10', review_cycle:'Quarterly' },
  { id:'GP05', category:'Data Lineage', policy:'Manual overrides require documented justification', owner:'Compliance', enforcement:'Form Required', status:'active', last_reviewed:'2025-01-05', review_cycle:'Quarterly' },
  { id:'GP06', category:'Data Access', policy:'API keys must be rotated every 90 days', owner:'IT Security', enforcement:'Reminder', status:'active', last_reviewed:'2025-04-01', review_cycle:'Quarterly' },
  { id:'GP07', category:'Data Access', policy:'Client data must not be shared across client portfolios', owner:'Compliance', enforcement:'Architecture', status:'active', last_reviewed:'2025-02-15', review_cycle:'Annual' },
  { id:'GP08', category:'Data Retention', policy:'Data snapshots retained for minimum 7 years for audit trail', owner:'Legal/Compliance', enforcement:'Automated', status:'active', last_reviewed:'2025-01-01', review_cycle:'Annual' },
  { id:'GP09', category:'Data Retention', policy:'Personal data (client contacts) subject to GDPR retention limits', owner:'DPO', enforcement:'Review', status:'active', last_reviewed:'2024-12-01', review_cycle:'Semi-Annual' },
  { id:'GP10', category:'Model Governance', policy:'Quantitative models (VaR, ITR, Copula) require annual validation', owner:'Quant Team', enforcement:'Calendar', status:'active', last_reviewed:'2025-03-01', review_cycle:'Annual' },
  { id:'GP11', category:'Model Governance', policy:'Model assumptions must be documented and disclosed in reports', owner:'Quant Team', enforcement:'Template', status:'active', last_reviewed:'2025-02-20', review_cycle:'Semi-Annual' },
  { id:'GP12', category:'Model Governance', policy:'Back-testing results must be reviewed quarterly', owner:'Risk Committee', enforcement:'Meeting', status:'active', last_reviewed:'2025-04-15', review_cycle:'Quarterly' },
  { id:'GP13', category:'Reporting', policy:'All regulatory reports must be reviewed by compliance before submission', owner:'Compliance', enforcement:'Workflow', status:'active', last_reviewed:'2025-03-25', review_cycle:'Quarterly' },
  { id:'GP14', category:'Reporting', policy:'Client reports must use approved templates only', owner:'Client Services', enforcement:'Template Lock', status:'active', last_reviewed:'2025-01-10', review_cycle:'Semi-Annual' },
  { id:'GP15', category:'Vendor', policy:'Third-party data vendors must pass due diligence assessment', owner:'Procurement', enforcement:'Assessment Form', status:'active', last_reviewed:'2024-10-01', review_cycle:'Annual' },
];

/* ── Data Ownership ──────────────────────────────────────────────────────── */
const DATA_OWNERS = [
  { domain:'Company Fundamentals', owner:'Data Engineering', steward:'Portfolio Analytics', sources:['EODHD','Exchange Files','BRSR'], quality_target:95 },
  { domain:'ESG Scores', owner:'ESG Analytics Team', steward:'Research', sources:['EODHD','Manual Override','BRSR'], quality_target:90 },
  { domain:'GHG Emissions', owner:'Climate Team', steward:'Reporting', sources:['BRSR','Company Reports','Sector Estimates'], quality_target:85 },
  { domain:'Bond Data', owner:'Fixed Income Team', steward:'Portfolio Analytics', sources:['CBI','OpenFIGI','EODHD Bonds'], quality_target:88 },
  { domain:'Sovereign Data', owner:'Macro Research', steward:'Sovereign Analytics', sources:['World Bank','IMF','ND-GAIN'], quality_target:92 },
  { domain:'Real Estate', owner:'RE Team', steward:'Asset Management', sources:['Internal','GRESB','CRREM'], quality_target:85 },
  { domain:'Quantitative Models', owner:'Quant Team', steward:'Risk Committee', sources:['Internal'], quality_target:95 },
  { domain:'Client Data', owner:'Client Services', steward:'Compliance', sources:['CRM','Internal'], quality_target:98 },
];

/* ── Model Governance ────────────────────────────────────────────────────── */
const QUANT_MODELS = [
  { id:'QM01', name:'Climate VaR (Monte Carlo)', lastValidation:'2025-01-15', nextDue:'2026-01-15', findings:1, status:'validated', methodology:'Monte Carlo + Copula', coverage:'All equity positions' },
  { id:'QM02', name:'ITR Pathway Alignment', lastValidation:'2025-02-20', nextDue:'2026-02-20', findings:0, status:'validated', methodology:'SDA + Convergence', coverage:'Scope 1,2 emitters' },
  { id:'QM03', name:'Copula Dependency Model', lastValidation:'2024-11-10', nextDue:'2025-11-10', findings:2, status:'review_needed', methodology:'Gaussian Copula', coverage:'Cross-sector correlations' },
  { id:'QM04', name:'Back-testing Framework', lastValidation:'2025-04-01', nextDue:'2025-07-01', findings:0, status:'validated', methodology:'Rolling window + MAE', coverage:'All quant outputs' },
  { id:'QM05', name:'NGFS Scenario Engine', lastValidation:'2025-03-15', nextDue:'2026-03-15', findings:1, status:'validated', methodology:'IAM downscaling', coverage:'6 NGFS scenarios' },
];

/* ── Vendors ─────────────────────────────────────────────────────────────── */
const DEFAULT_VENDORS = [
  { id:'VN01', name:'EODHD', type:'Market Data', quality:88, coverage:92, reliability:95, cost:75, compliance:90, contract_end:'2025-12-31', notes:'' },
  { id:'VN02', name:'Climate Bonds Initiative', type:'Green Bonds', quality:85, coverage:78, reliability:90, cost:80, compliance:88, contract_end:'2026-06-30', notes:'' },
  { id:'VN03', name:'World Bank / IMF', type:'Sovereign', quality:95, coverage:96, reliability:98, cost:100, compliance:100, contract_end:'N/A', notes:'Open data' },
  { id:'VN04', name:'ND-GAIN', type:'Climate Resilience', quality:82, coverage:85, reliability:88, cost:100, compliance:95, contract_end:'N/A', notes:'Open data' },
  { id:'VN05', name:'OpenFIGI', type:'Instrument IDs', quality:90, coverage:88, reliability:92, cost:100, compliance:95, contract_end:'N/A', notes:'Bloomberg open API' },
  { id:'VN06', name:'BRSR/SEBI', type:'Indian ESG', quality:72, coverage:65, reliability:80, cost:100, compliance:100, contract_end:'N/A', notes:'Regulatory filings' },
];

/* ── Data Classification ─────────────────────────────────────────────────── */
const DATA_FIELDS_CLASSIFICATION = [
  { field:'Company Name', domain:'Fundamentals', classification:'Public', sensitivity:'Low' },
  { field:'ISIN / Ticker', domain:'Fundamentals', classification:'Public', sensitivity:'Low' },
  { field:'Market Cap', domain:'Fundamentals', classification:'Internal', sensitivity:'Medium' },
  { field:'ESG Composite Score', domain:'ESG', classification:'Internal', sensitivity:'Medium' },
  { field:'Carbon Emissions (Scope 1)', domain:'Climate', classification:'Internal', sensitivity:'Medium' },
  { field:'Client Portfolio Holdings', domain:'Client', classification:'Confidential', sensitivity:'High' },
  { field:'Client Contact Info', domain:'Client', classification:'Restricted', sensitivity:'Critical' },
  { field:'API Keys / Credentials', domain:'Security', classification:'Restricted', sensitivity:'Critical' },
  { field:'Model Parameters', domain:'Quant', classification:'Confidential', sensitivity:'High' },
  { field:'Bond Pricing Data', domain:'Fixed Income', classification:'Internal', sensitivity:'Medium' },
  { field:'Vendor Contracts', domain:'Procurement', classification:'Confidential', sensitivity:'High' },
  { field:'Audit Findings', domain:'Compliance', classification:'Confidential', sensitivity:'High' },
];

/* ── Regulatory Mapping ──────────────────────────────────────────────────── */
const REG_ALIGNMENT = [
  { regulation:'GDPR', policies:['GP07','GP08','GP09'], coverage:100, notes:'Full coverage via retention & access policies' },
  { regulation:'MiFID II', policies:['GP13','GP14','GP15'], coverage:90, notes:'Report review & vendor assessment aligned' },
  { regulation:'AIFMD', policies:['GP10','GP11','GP12'], coverage:85, notes:'Model governance covers fund risk requirements' },
  { regulation:'SEC Climate', policies:['GP01','GP03','GP13'], coverage:80, notes:'Data quality + verification + review workflow' },
  { regulation:'SFDR/CSRD', policies:['GP01','GP02','GP04','GP13'], coverage:95, notes:'Strong ESG data quality and lineage coverage' },
  { regulation:'BRSR/SEBI', policies:['GP01','GP03','GP05','GP07'], coverage:88, notes:'Indian regulatory alignment through quality & access' },
];

/* ── Governance Trend Data ───────────────────────────────────────────────── */
const TREND_DATA = [
  { month:'Sep 24', compliance:72, target:85, policies:10, exceptions:5 },
  { month:'Oct 24', compliance:75, target:85, policies:11, exceptions:4 },
  { month:'Nov 24', compliance:78, target:85, policies:12, exceptions:4 },
  { month:'Dec 24', compliance:81, target:90, policies:13, exceptions:3 },
  { month:'Jan 25', compliance:84, target:90, policies:14, exceptions:3 },
  { month:'Feb 25', compliance:87, target:90, policies:15, exceptions:2 },
  { month:'Mar 25', compliance:89, target:90, policies:15, exceptions:2 },
  { month:'Apr 25', compliance:91, target:92, policies:15, exceptions:2 },
  { month:'May 25', compliance:92, target:92, policies:15, exceptions:1 },
];

/* ── Maturity Dimensions ─────────────────────────────────────────────────── */
const MATURITY_DIMS = [
  'Policy Coverage','Data Ownership','Access Controls','Data Quality','Lineage Tracking',
  'Model Governance','Retention Management','Vendor Oversight','Regulatory Alignment','Incident Response',
];
const DEFAULT_MATURITY = MATURITY_DIMS.map(d => ({ dimension: d, score: 3 }));

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */
const S = {
  page: { fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 },
  title: { fontSize:28, fontWeight:700, color:T.navy, margin:0 },
  badge: { display:'inline-block', background:`${T.gold}18`, color:T.gold, padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:600, marginTop:6 },
  card: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:16 },
  kpi: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 18px', textAlign:'center', minWidth:130, flex:'1 1 130px' },
  kpiVal: { fontSize:24, fontWeight:700, color:T.navy },
  kpiLbl: { fontSize:11, color:T.textMut, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 },
  grid: { display:'flex', flexWrap:'wrap', gap:12, marginBottom:16 },
  sectionTitle: { fontSize:16, fontWeight:700, color:T.navy, marginBottom:12, display:'flex', alignItems:'center', gap:8 },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'10px 12px', borderBottom:`2px solid ${T.border}`, color:T.textSec, fontWeight:600, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', fontSize:12 },
  td: { padding:'9px 12px', borderBottom:`1px solid ${T.border}`, fontSize:13 },
  btn: { padding:'7px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy },
  btnP: { padding:'7px 16px', borderRadius:8, border:'none', background:T.navy, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 },
  statusDot: (c) => ({ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block', marginRight:6 }),
  tag: (bg, fg) => ({ display:'inline-block', padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:bg, color:fg }),
  input: { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, width:'100%', boxSizing:'border-box' },
  slider: { width:'100%', accentColor:T.navy },
  tabBar: { display:'flex', gap:4, marginBottom:16, flexWrap:'wrap' },
  tab: (a) => ({ padding:'8px 18px', borderRadius:'8px 8px 0 0', border:`1px solid ${a ? T.navy : T.border}`, borderBottom:a ? `2px solid ${T.gold}` : `1px solid ${T.border}`, background:a ? T.surface : T.surfaceH, color:a ? T.navy : T.textSec, cursor:'pointer', fontSize:13, fontWeight:a ? 700 : 500 }),
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DataGovernancePage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || [], []);

  /* ── Persisted state ──────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('policies');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [catFilter, setCatFilter] = useState('All');
  const [exceptions, setExceptions] = useState(() => loadLS(LS_EXCEPTIONS) || [
    { id:'EX01', policy:'GP03', reason:'Tier 2 companies pending verification backlog', approver:'Risk Committee', granted:'2025-03-01', expiry:'2025-06-30', status:'active' },
    { id:'EX02', policy:'GP06', reason:'API migration in progress, extended rotation window', approver:'IT Security Lead', granted:'2025-04-01', expiry:'2025-05-31', status:'active' },
  ]);
  const [vendors, setVendors] = useState(() => loadLS(LS_VENDOR) || DEFAULT_VENDORS);
  const [maturity, setMaturity] = useState(() => loadLS(LS_MATURITY) || DEFAULT_MATURITY);
  const [newException, setNewException] = useState({ policy:'', reason:'', approver:'', expiry:'' });
  const [complianceOverrides, setComplianceOverrides] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { saveLS(LS_EXCEPTIONS, exceptions); }, [exceptions]);
  useEffect(() => { saveLS(LS_VENDOR, vendors); }, [vendors]);
  useEffect(() => { saveLS(LS_MATURITY, maturity); }, [maturity]);

  /* ── Sorting ──────────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortCol(col);
  }, [sortCol]);

  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';

  const sortedPolicies = useMemo(() => {
    let items = [...GOVERNANCE_POLICIES];
    if (catFilter !== 'All') items = items.filter(p => p.category === catFilter);
    if (searchTerm) items = items.filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())));
    items.sort((a, b) => {
      const av = a[sortCol] || '', bv = b[sortCol] || '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [catFilter, searchTerm, sortCol, sortDir]);

  /* ── KPIs ─────────────────────────────────────────────────────────────── */
  const categories = useMemo(() => ['All', ...new Set(GOVERNANCE_POLICIES.map(p => p.category))], []);
  const complianceRate = useMemo(() => {
    const total = GOVERNANCE_POLICIES.length;
    const compliant = GOVERNANCE_POLICIES.filter(p => {
      const rev = new Date(p.last_reviewed);
      const cycleMonths = p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;
      const nextDue = new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);
      return nextDue >= today;
    }).length;
    return Math.round((compliant / total) * 100);
  }, []);
  const policiesDueReview = useMemo(() => GOVERNANCE_POLICIES.filter(p => {
    const rev = new Date(p.last_reviewed);
    const cycleMonths = p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;
    const nextDue = new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);
    return nextDue < today;
  }).length, []);
  const modelValidationsDue = useMemo(() => QUANT_MODELS.filter(m => new Date(m.nextDue) <= new Date(today.getTime() + 90*86400000)).length, []);
  const openExceptions = exceptions.filter(e => e.status === 'active').length;
  const auditFindings = QUANT_MODELS.reduce((s, m) => s + m.findings, 0);

  /* ── Policy compliance detail ─────────────────────────────────────────── */
  const policyCompliance = useMemo(() => GOVERNANCE_POLICIES.map(p => {
    const rev = new Date(p.last_reviewed);
    const cycleMonths = p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;
    const nextDue = new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);
    const isCompliant = complianceOverrides[p.id] !== undefined ? complianceOverrides[p.id] : nextDue >= today;
    return { ...p, nextDue: nextDue.toISOString().split('T')[0], compliant: isCompliant };
  }), [complianceOverrides]);

  /* ── Category distribution for pie chart ──────────────────────────────── */
  const catDist = useMemo(() => {
    const m = {}; GOVERNANCE_POLICIES.forEach(p => { m[p.category] = (m[p.category] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, []);

  /* ── Review calendar ──────────────────────────────────────────────────── */
  const reviewCalendar = useMemo(() => {
    const events = [];
    GOVERNANCE_POLICIES.forEach(p => {
      const rev = new Date(p.last_reviewed);
      const cycleMonths = p.review_cycle === 'Quarterly' ? 3 : p.review_cycle === 'Semi-Annual' ? 6 : 12;
      const nextDue = new Date(rev); nextDue.setMonth(nextDue.getMonth() + cycleMonths);
      events.push({ type:'Policy Review', item:p.id + ' - ' + p.category, date:nextDue.toISOString().split('T')[0], owner:p.owner });
    });
    QUANT_MODELS.forEach(m => {
      events.push({ type:'Model Validation', item:m.name, date:m.nextDue, owner:'Quant Team' });
    });
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, []);

  /* ── Maturity radar data ──────────────────────────────────────────────── */
  const radarData = useMemo(() => maturity.map(m => ({ dimension: m.dimension, score: m.score, fullMark: 5 })), [maturity]);
  const maturityAvg = useMemo(() => maturity.reduce((s, m) => s + m.score, 0) / maturity.length, [maturity]);

  /* ── Exports ──────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['ID','Category','Policy','Owner','Enforcement','Status','Last Reviewed','Review Cycle']];
    GOVERNANCE_POLICIES.forEach(p => rows.push([p.id, p.category, `"${p.policy}"`, p.owner, p.enforcement, p.status, p.last_reviewed, p.review_cycle]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'governance_policies.csv'; a.click();
  }, []);

  const exportJSON = useCallback(() => {
    const report = {
      exportDate: new Date().toISOString(), complianceRate, activePolicies: GOVERNANCE_POLICIES.length,
      domains: DATA_OWNERS, models: QUANT_MODELS, vendors, exceptions, maturity,
      regulatoryAlignment: REG_ALIGNMENT, trendData: TREND_DATA,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'governance_report.json'; a.click();
  }, [complianceRate, vendors, exceptions, maturity]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Add exception ────────────────────────────────────────────────────── */
  const addException = useCallback(() => {
    if (!newException.policy || !newException.reason) return;
    const ex = { ...newException, id: 'EX' + String(exceptions.length + 1).padStart(2, '0'), granted: today.toISOString().split('T')[0], status: 'active' };
    setExceptions(prev => [...prev, ex]);
    setNewException({ policy:'', reason:'', approver:'', expiry:'' });
  }, [newException, exceptions]);

  const removeException = useCallback((id) => {
    setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'closed' } : e));
  }, []);

  /* ── Vendor update ────────────────────────────────────────────────────── */
  const updateVendor = useCallback((id, field, val) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: field === 'notes' ? val : Number(val) } : v));
  }, []);

  /* ── Maturity update ──────────────────────────────────────────────────── */
  const updateMaturity = useCallback((dim, score) => {
    setMaturity(prev => prev.map(m => m.dimension === dim ? { ...m, score: Number(score) } : m));
  }, []);

  /* ── TABS ──────────────────────────────────────────────────────────────── */
  const TABS = [
    { id:'policies', label:'Policy Registry' },
    { id:'compliance', label:'Compliance Dashboard' },
    { id:'ownership', label:'Data Ownership' },
    { id:'models', label:'Model Governance' },
    { id:'exceptions', label:'Exceptions' },
    { id:'classification', label:'Classification' },
    { id:'vendors', label:'Vendor Assessment' },
    { id:'maturity', label:'Maturity' },
    { id:'regulatory', label:'Regulatory' },
    { id:'calendar', label:'Review Calendar' },
  ];

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={S.page}>
      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Data Governance & Policy Manager</h1>
          <div style={S.badge}>15 Policies &middot; 8 Domains &middot; Ownership &middot; Compliance</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={S.btn} onClick={exportCSV}>Export CSV</button>
          <button style={S.btn} onClick={exportJSON}>Export JSON</button>
          <button style={S.btn} onClick={exportPrint}>Print</button>
          <button style={S.btnP} onClick={() => navigate('/data-quality')}>Data Quality</button>
          <button style={S.btnP} onClick={() => navigate('/data-lineage')}>Data Lineage</button>
          <button style={S.btnP} onClick={() => navigate('/audit-trail')}>Audit Trail</button>
          <button style={S.btnP} onClick={() => navigate('/regulatory-gap')}>Regulatory Gap</button>
          <button style={S.btnP} onClick={() => navigate('/dme-hub')}>DME Hub</button>
        </div>
      </div>

      {/* ── 2. KPI Cards ───────────────────────────────────────────────────── */}
      <div style={S.grid}>
        {[
          { label:'Active Policies', value:GOVERNANCE_POLICIES.length, color:T.navy },
          { label:'Compliance Rate', value:`${complianceRate}%`, color: complianceRate >= 90 ? T.green : complianceRate >= 75 ? T.amber : T.red },
          { label:'Data Domains', value:DATA_OWNERS.length, color:T.sage },
          { label:'Owners Assigned', value: new Set(DATA_OWNERS.map(d => d.owner)).size, color:T.gold },
          { label:'Due for Review', value:policiesDueReview, color: policiesDueReview > 2 ? T.red : T.amber },
          { label:'Model Validations Due', value:modelValidationsDue, color: modelValidationsDue > 2 ? T.red : T.amber },
          { label:'Open Exceptions', value:openExceptions, color: openExceptions > 3 ? T.red : T.amber },
          { label:'Audit Findings', value:auditFindings, color: auditFindings > 3 ? T.red : T.amber },
        ].map((kpi, i) => (
          <div key={i} style={S.kpi}>
            <div style={{ ...S.kpiVal, color:kpi.color }}>{kpi.value}</div>
            <div style={S.kpiLbl}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Governance Trend AreaChart ──────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Governance Compliance Trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={TREND_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize:11 }} />
            <YAxis domain={[60,100]} tick={{ fontSize:11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="compliance" stroke={T.sage} fill={`${T.sage}30`} name="Compliance %" />
            <Area type="monotone" dataKey="target" stroke={T.gold} fill={`${T.gold}20`} strokeDasharray="5 5" name="Target %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <div key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {/* ── 3. Policy Registry Table (sortable) ────────────────────────────── */}
      {activeTab === 'policies' && (
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
            <div style={S.sectionTitle}>Policy Registry ({sortedPolicies.length})</div>
            <div style={{ display:'flex', gap:8 }}>
              <select style={{ ...S.input, width:160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={{ ...S.input, width:200 }} placeholder="Search policies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[['id','ID'],['category','Category'],['policy','Policy'],['owner','Owner'],['enforcement','Enforcement'],['status','Status'],['last_reviewed','Last Reviewed'],['review_cycle','Cycle']].map(([col, label]) => (
                    <th key={col} style={S.th} onClick={() => handleSort(col)}>{label}{sortIcon(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPolicies.map(p => (
                  <tr key={p.id} style={{ background: p.status === 'active' ? 'transparent' : `${T.red}08` }}>
                    <td style={S.td}><span style={{ fontWeight:700, color:T.navy }}>{p.id}</span></td>
                    <td style={S.td}><span style={S.tag(`${T.navyL}15`, T.navy)}>{p.category}</span></td>
                    <td style={{ ...S.td, maxWidth:320, fontSize:12 }}>{p.policy}</td>
                    <td style={S.td}>{p.owner}</td>
                    <td style={S.td}><span style={S.tag(p.enforcement === 'Automated' ? `${T.green}18` : `${T.amber}18`, p.enforcement === 'Automated' ? T.green : T.amber)}>{p.enforcement}</span></td>
                    <td style={S.td}><span style={S.statusDot(p.status === 'active' ? T.green : T.red)} />{p.status}</td>
                    <td style={S.td}>{p.last_reviewed}</td>
                    <td style={S.td}>{p.review_cycle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Policy Compliance Dashboard ─────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Policy Compliance Status</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginBottom:16 }}>
            <div style={{ flex:1, minWidth:300 }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Policy</th><th style={S.th}>Category</th><th style={S.th}>Status</th><th style={S.th}>Next Due</th><th style={S.th}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {policyCompliance.map(p => (
                    <tr key={p.id}>
                      <td style={S.td}><strong>{p.id}</strong></td>
                      <td style={S.td}>{p.category}</td>
                      <td style={S.td}>
                        <span style={S.tag(p.compliant ? `${T.green}18` : `${T.red}18`, p.compliant ? T.green : T.red)}>
                          {p.compliant ? 'Compliant' : 'Non-Compliant'}
                        </span>
                      </td>
                      <td style={S.td}>{p.nextDue}</td>
                      <td style={S.td}>
                        <button style={{ ...S.btn, fontSize:10, padding:'3px 8px' }} onClick={() => setComplianceOverrides(prev => ({ ...prev, [p.id]: !p.compliant }))}>
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ width:280, textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:8 }}>By Category</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={catDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {catDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Data Ownership Matrix ───────────────────────────────────────── */}
      {activeTab === 'ownership' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Data Ownership Matrix</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Domain</th><th style={S.th}>Owner</th><th style={S.th}>Steward</th><th style={S.th}>Sources</th><th style={S.th}>Quality Target</th><th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {DATA_OWNERS.map((d, i) => {
                  const actual = d.quality_target - Math.floor(sRand(seed(d.domain)) * 8);
                  const met = actual >= d.quality_target;
                  return (
                    <tr key={i}>
                      <td style={S.td}><strong>{d.domain}</strong></td>
                      <td style={S.td}>{d.owner}</td>
                      <td style={S.td}>{d.steward}</td>
                      <td style={S.td}>{d.sources.map((s, j) => <span key={j} style={{ ...S.tag(`${T.navyL}12`, T.navy), marginRight:4, marginBottom:2 }}>{s}</span>)}</td>
                      <td style={S.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                            <div style={{ width:`${actual}%`, height:'100%', background: met ? T.green : T.amber, borderRadius:4 }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600 }}>{actual}% / {d.quality_target}%</span>
                        </div>
                      </td>
                      <td style={S.td}><span style={S.tag(met ? `${T.green}18` : `${T.amber}18`, met ? T.green : T.amber)}>{met ? 'On Target' : 'Below Target'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Model Governance Panel ──────────────────────────────────────── */}
      {activeTab === 'models' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Model Governance</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Model</th><th style={S.th}>Methodology</th><th style={S.th}>Coverage</th><th style={S.th}>Last Validation</th><th style={S.th}>Next Due</th><th style={S.th}>Findings</th><th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {QUANT_MODELS.map(m => (
                  <tr key={m.id}>
                    <td style={S.td}><strong>{m.name}</strong></td>
                    <td style={S.td}><span style={S.tag(`${T.navyL}12`, T.navy)}>{m.methodology}</span></td>
                    <td style={S.td}>{m.coverage}</td>
                    <td style={S.td}>{m.lastValidation}</td>
                    <td style={{ ...S.td, color: new Date(m.nextDue) <= new Date(today.getTime() + 90*86400000) ? T.red : T.text }}>{m.nextDue}</td>
                    <td style={S.td}><span style={{ fontWeight:700, color: m.findings > 0 ? T.amber : T.green }}>{m.findings}</span></td>
                    <td style={S.td}>
                      <span style={S.tag(m.status === 'validated' ? `${T.green}18` : `${T.amber}18`, m.status === 'validated' ? T.green : T.amber)}>
                        {m.status === 'validated' ? 'Validated' : 'Review Needed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 7. Exception Tracker ───────────────────────────────────────────── */}
      {activeTab === 'exceptions' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Policy Exception Tracker</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>ID</th><th style={S.th}>Policy</th><th style={S.th}>Reason</th><th style={S.th}>Approver</th><th style={S.th}>Granted</th><th style={S.th}>Expiry</th><th style={S.th}>Status</th><th style={S.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(e => (
                <tr key={e.id} style={{ background: e.status === 'closed' ? `${T.textMut}08` : 'transparent' }}>
                  <td style={S.td}><strong>{e.id}</strong></td>
                  <td style={S.td}>{e.policy}</td>
                  <td style={{ ...S.td, maxWidth:240, fontSize:12 }}>{e.reason}</td>
                  <td style={S.td}>{e.approver}</td>
                  <td style={S.td}>{e.granted}</td>
                  <td style={{ ...S.td, color: e.expiry && new Date(e.expiry) < today ? T.red : T.text }}>{e.expiry}</td>
                  <td style={S.td}><span style={S.tag(e.status === 'active' ? `${T.amber}18` : `${T.green}18`, e.status === 'active' ? T.amber : T.green)}>{e.status}</span></td>
                  <td style={S.td}>
                    {e.status === 'active' && <button style={{ ...S.btn, fontSize:10, padding:'3px 8px' }} onClick={() => removeException(e.id)}>Close</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:16, padding:16, background:T.surfaceH, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>New Exception</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div style={{ flex:1, minWidth:120 }}>
                <label style={{ fontSize:11, color:T.textSec }}>Policy</label>
                <select style={S.input} value={newException.policy} onChange={e => setNewException(p => ({ ...p, policy: e.target.value }))}>
                  <option value="">Select...</option>
                  {GOVERNANCE_POLICIES.map(p => <option key={p.id} value={p.id}>{p.id} - {p.category}</option>)}
                </select>
              </div>
              <div style={{ flex:2, minWidth:200 }}>
                <label style={{ fontSize:11, color:T.textSec }}>Reason</label>
                <input style={S.input} value={newException.reason} onChange={e => setNewException(p => ({ ...p, reason: e.target.value }))} placeholder="Justification..." />
              </div>
              <div style={{ flex:1, minWidth:120 }}>
                <label style={{ fontSize:11, color:T.textSec }}>Approver</label>
                <input style={S.input} value={newException.approver} onChange={e => setNewException(p => ({ ...p, approver: e.target.value }))} placeholder="Name..." />
              </div>
              <div style={{ flex:1, minWidth:120 }}>
                <label style={{ fontSize:11, color:T.textSec }}>Expiry</label>
                <input type="date" style={S.input} value={newException.expiry} onChange={e => setNewException(p => ({ ...p, expiry: e.target.value }))} />
              </div>
              <button style={S.btnP} onClick={addException}>Add Exception</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Data Classification ─────────────────────────────────────────── */}
      {activeTab === 'classification' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Data Field Classification</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Field</th><th style={S.th}>Domain</th><th style={S.th}>Classification</th><th style={S.th}>Sensitivity</th>
              </tr>
            </thead>
            <tbody>
              {DATA_FIELDS_CLASSIFICATION.map((f, i) => {
                const clsColors = { Public: T.green, Internal: T.navyL, Confidential: T.amber, Restricted: T.red };
                const senColors = { Low: T.green, Medium: T.amber, High: T.red, Critical: '#7c3aed' };
                return (
                  <tr key={i}>
                    <td style={S.td}><strong>{f.field}</strong></td>
                    <td style={S.td}>{f.domain}</td>
                    <td style={S.td}><span style={S.tag(`${clsColors[f.classification]}18`, clsColors[f.classification])}>{f.classification}</span></td>
                    <td style={S.td}><span style={S.tag(`${senColors[f.sensitivity]}18`, senColors[f.sensitivity])}>{f.sensitivity}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop:12, display:'flex', gap:16 }}>
            {['Public','Internal','Confidential','Restricted'].map(c => {
              const cnt = DATA_FIELDS_CLASSIFICATION.filter(f => f.classification === c).length;
              const clsColors = { Public: T.green, Internal: T.navyL, Confidential: T.amber, Restricted: T.red };
              return <div key={c} style={{ ...S.kpi, flex:'0 1 auto', padding:12 }}><div style={{ ...S.kpiVal, fontSize:20, color:clsColors[c] }}>{cnt}</div><div style={S.kpiLbl}>{c}</div></div>;
            })}
          </div>
        </div>
      )}

      {/* ── 9. Vendor Assessment ────────────────────────────────────────────── */}
      {activeTab === 'vendors' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Data Vendor Assessment</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Vendor</th><th style={S.th}>Type</th>
                  <th style={S.th}>Quality</th><th style={S.th}>Coverage</th><th style={S.th}>Reliability</th><th style={S.th}>Cost</th><th style={S.th}>Compliance</th>
                  <th style={S.th}>Avg</th><th style={S.th}>Contract End</th><th style={S.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => {
                  const avg = Math.round((v.quality + v.coverage + v.reliability + v.cost + v.compliance) / 5);
                  return (
                    <tr key={v.id}>
                      <td style={S.td}><strong>{v.name}</strong></td>
                      <td style={S.td}><span style={S.tag(`${T.navyL}12`, T.navy)}>{v.type}</span></td>
                      {['quality','coverage','reliability','cost','compliance'].map(f => (
                        <td key={f} style={S.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <input type="range" min={0} max={100} value={v[f]} onChange={e => updateVendor(v.id, f, e.target.value)} style={{ ...S.slider, width:60 }} />
                            <span style={{ fontSize:12, fontWeight:600, color: v[f] >= 85 ? T.green : v[f] >= 70 ? T.amber : T.red }}>{v[f]}</span>
                          </div>
                        </td>
                      ))}
                      <td style={S.td}><span style={{ fontWeight:700, color: avg >= 85 ? T.green : avg >= 70 ? T.amber : T.red }}>{avg}</span></td>
                      <td style={S.td}>{v.contract_end}</td>
                      <td style={S.td}>
                        <input style={{ ...S.input, width:120 }} value={v.notes} onChange={e => updateVendor(v.id, 'notes', e.target.value)} placeholder="Notes..." />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:12, display:'flex', gap:16, flexWrap:'wrap' }}>
            {vendors.map(v => {
              const avg = Math.round((v.quality + v.coverage + v.reliability + v.cost + v.compliance) / 5);
              return (
                <div key={v.id} style={{ ...S.kpi, padding:12 }}>
                  <div style={{ ...S.kpiVal, fontSize:20, color: avg >= 85 ? T.green : avg >= 70 ? T.amber : T.red }}>{avg}</div>
                  <div style={S.kpiLbl}>{v.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 10. Governance Maturity Assessment ─────────────────────────────── */}
      {activeTab === 'maturity' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Governance Maturity Assessment (Avg: {maturityAvg.toFixed(1)} / 5.0)</div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:300 }}>
              {maturity.map((m, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:180, fontSize:12, fontWeight:600, color:T.navy }}>{m.dimension}</div>
                  <input type="range" min={1} max={5} step={1} value={m.score} onChange={e => updateMaturity(m.dimension, e.target.value)} style={{ ...S.slider, flex:1 }} />
                  <div style={{ width:30, fontWeight:700, color: m.score >= 4 ? T.green : m.score >= 3 ? T.amber : T.red, textAlign:'center' }}>{m.score}</div>
                </div>
              ))}
            </div>
            <div style={{ flex:1, minWidth:300, display:'flex', justifyContent:'center' }}>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize:10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize:10 }} />
                  <Radar name="Maturity" dataKey="score" stroke={T.navy} fill={`${T.navy}30`} fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── 11. Regulatory Alignment ───────────────────────────────────────── */}
      {activeTab === 'regulatory' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Regulatory Alignment Map</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:2, minWidth:400 }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Regulation</th><th style={S.th}>Mapped Policies</th><th style={S.th}>Coverage</th><th style={S.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {REG_ALIGNMENT.map((r, i) => (
                    <tr key={i}>
                      <td style={S.td}><strong>{r.regulation}</strong></td>
                      <td style={S.td}>{r.policies.map(p => <span key={p} style={{ ...S.tag(`${T.navyL}12`, T.navy), marginRight:4 }}>{p}</span>)}</td>
                      <td style={S.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:80, height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                            <div style={{ width:`${r.coverage}%`, height:'100%', background: r.coverage >= 90 ? T.green : r.coverage >= 80 ? T.amber : T.red, borderRadius:4 }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600 }}>{r.coverage}%</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontSize:12, color:T.textSec }}>{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ flex:1, minWidth:220 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={REG_ALIGNMENT} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11 }} />
                  <YAxis type="category" dataKey="regulation" width={80} tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Bar dataKey="coverage" fill={T.navy} radius={[0,4,4,0]} name="Coverage %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── 12. Review Calendar ────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Review & Validation Calendar</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Type</th><th style={S.th}>Item</th><th style={S.th}>Due Date</th><th style={S.th}>Owner</th><th style={S.th}>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {reviewCalendar.slice(0, 25).map((ev, i) => {
                  const daysUntil = Math.round((new Date(ev.date) - today) / 86400000);
                  const urgency = daysUntil < 0 ? 'Overdue' : daysUntil <= 30 ? 'Urgent' : daysUntil <= 90 ? 'Upcoming' : 'Scheduled';
                  const urgColor = { Overdue: T.red, Urgent: T.amber, Upcoming: T.navyL, Scheduled: T.green };
                  return (
                    <tr key={i} style={{ background: urgency === 'Overdue' ? `${T.red}06` : 'transparent' }}>
                      <td style={S.td}><span style={S.tag(ev.type === 'Policy Review' ? `${T.navy}15` : `${T.sage}15`, ev.type === 'Policy Review' ? T.navy : T.sage)}>{ev.type}</span></td>
                      <td style={S.td}>{ev.item}</td>
                      <td style={{ ...S.td, fontWeight:600, color: urgency === 'Overdue' ? T.red : T.text }}>{ev.date}</td>
                      <td style={S.td}>{ev.owner}</td>
                      <td style={S.td}><span style={S.tag(`${urgColor[urgency]}18`, urgColor[urgency])}>{urgency} {daysUntil >= 0 ? `(${daysUntil}d)` : `(${Math.abs(daysUntil)}d ago)`}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Governance Enforcement Statistics ──────────────────────────────── */}
      {activeTab === 'policies' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Enforcement Method Distribution</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:280 }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={(() => {
                      const m = {};
                      GOVERNANCE_POLICIES.forEach(p => { m[p.enforcement] = (m[p.enforcement] || 0) + 1; });
                      return Object.entries(m).map(([name, value]) => ({ name, value }));
                    })()}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Array.from({ length: 12 }).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, minWidth:280 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:10 }}>Owner Responsibility Map</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(() => {
                  const m = {};
                  GOVERNANCE_POLICIES.forEach(p => { m[p.owner] = (m[p.owner] || 0) + 1; });
                  return Object.entries(m).map(([owner, count]) => ({ owner, count })).sort((a, b) => b.count - a.count);
                })()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:11 }} />
                  <YAxis type="category" dataKey="owner" width={120} tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.navy} radius={[0,4,4,0]} name="Policies Owned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Vendor Assessment: Radar Comparison ────────────────────────────── */}
      {activeTab === 'vendors' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Vendor Composite Rating Radar</div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { metric:'Quality', ...vendors.reduce((a, v) => ({ ...a, [v.name]: v.quality }), {}) },
                { metric:'Coverage', ...vendors.reduce((a, v) => ({ ...a, [v.name]: v.coverage }), {}) },
                { metric:'Reliability', ...vendors.reduce((a, v) => ({ ...a, [v.name]: v.reliability }), {}) },
                { metric:'Cost Value', ...vendors.reduce((a, v) => ({ ...a, [v.name]: v.cost }), {}) },
                { metric:'Compliance', ...vendors.reduce((a, v) => ({ ...a, [v.name]: v.compliance }), {}) },
              ]}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize:11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                {vendors.slice(0, 4).map((v, i) => (
                  <Radar key={v.id} name={v.name} dataKey={v.name} stroke={COLORS[i]} fill={`${COLORS[i]}20`} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Regulatory: Coverage BarChart ───────────────────────────────────── */}
      {activeTab === 'regulatory' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Regulatory Gap Summary</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {REG_ALIGNMENT.map((r, i) => {
              const gap = 100 - r.coverage;
              return (
                <div key={i} style={{ flex:'1 1 140px', padding:14, background:T.surfaceH, borderRadius:10, border:`1px solid ${T.border}`, textAlign:'center' }}>
                  <div style={{ fontSize:24, fontWeight:700, color: r.coverage >= 90 ? T.green : r.coverage >= 80 ? T.amber : T.red }}>{r.coverage}%</div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginTop:4 }}>{r.regulation}</div>
                  <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>{gap > 0 ? `${gap}% gap remaining` : 'Fully aligned'}</div>
                  <div style={{ marginTop:8, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${r.coverage}%`, height:'100%', background: r.coverage >= 90 ? T.green : r.coverage >= 80 ? T.amber : T.red, borderRadius:3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer: Portfolio context ──────────────────────────────────────── */}
      <div style={{ ...S.card, background:T.surfaceH, marginTop:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:12, color:T.textSec }}>
            Portfolio: {portfolio.length || GLOBAL_COMPANY_MASTER?.length || 0} companies loaded &middot; Last governance check: {today.toISOString().split('T')[0]}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/data-validation')}>Data Validation</button>
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/data-reconciliation')}>Reconciliation</button>
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/data-versioning')}>Versioning</button>
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/etl-pipeline')}>ETL Pipeline</button>
          </div>
        </div>
      </div>
    </div>
  );
}
