/**
 * EP-V4 — Compliance Evidence Manager
 * Sprint V — Governance & Audit Trail
 *
 * Collects, organizes, and packages compliance evidence from across the platform
 * for regulatory audits, client due diligence, and internal reviews.
 * 10 evidence categories, 20+ regulations, auto-collection, audit-ready packages.
 * Reads: ra_portfolio_v1
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, T.amber, T.red, '#8b5cf6', '#06b6d4'];

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = seed => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, off = 0) => seededRandom(seed + off);
const readLS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_EVIDENCE = 'ra_compliance_evidence_v1';
const LS_AUDITS = 'ra_compliance_audits_v1';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '\u2014';
const uid = () => 'EVI-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

/* ── Evidence Categories ──────────────────────────────────────────────────── */
const EVIDENCE_CATEGORIES = [
  { id:'EV01', name:'ESG Integration Evidence', description:'Proof that ESG factors are systematically integrated into investment process', sources:['ESG Screener results','Portfolio constraints','Optimization runs','Factor attribution'], regulations:['SFDR Art 8/9','PRI Principle 1','FCA TCFD'] },
  { id:'EV02', name:'Stewardship & Engagement', description:'Records of active ownership activities', sources:['Engagement log','Proxy voting records','Escalation history','Outcome tracking'], regulations:['UK Stewardship Code','EU SRD II','PRI Principle 2'] },
  { id:'EV03', name:'Climate Risk Assessment', description:'Climate scenario analysis, physical/transition risk, carbon metrics', sources:['NGFS scenarios','Physical risk assessment','Carbon budget tracker','ITR model'], regulations:['TCFD','ISSB S2','ECB climate stress test'] },
  { id:'EV04', name:'Data Quality & Governance', description:'Data sourcing, validation, quality scores, lineage documentation', sources:['Data quality monitor','Validation engine','Source reconciliation','Lineage tracker'], regulations:['CSRD ESRS 2','PCAF data quality','MiFID II best execution'] },
  { id:'EV05', name:'Regulatory Filings', description:'Submitted regulatory reports and disclosures', sources:['Report generator output','Submission tracker','Filing confirmations'], regulations:['SFDR','CSRD','BRSR','SEC','ISSB'] },
  { id:'EV06', name:'Model Validation', description:'Model documentation, validation reports, back-test results', sources:['Model registry','Validation logs','Back-test reports','Assumption reviews'], regulations:['ECB Model Risk','PRA SS 1-13','Basel III'] },
  { id:'EV07', name:'Client Reporting', description:'Client reports delivered, templates used, feedback received', sources:['Report history','Template manager','Client portal delivery log'], regulations:['MiFID II','SFDR periodic','Client mandate'] },
  { id:'EV08', name:'Exclusion & Screening', description:'Evidence of applied investment restrictions and exclusion screens', sources:['ESG screener results','Exclusion list','Exception approvals'], regulations:['SFDR Art 8/9','Client IPS','Ethical guidelines'] },
  { id:'EV09', name:'Human Rights & Supply Chain', description:'Due diligence on human rights, modern slavery, supply chain labor', sources:['Human rights DD checklist','Supply chain map','CSDDD compliance'], regulations:['CSDDD','UK Modern Slavery Act','UNGPs'] },
  { id:'EV10', name:'Nature & Biodiversity', description:'TNFD assessments, biodiversity impact, water stress analysis', sources:['TNFD LEAP','Biodiversity footprint','Water stress analyzer'], regulations:['TNFD','EU Nature Restoration Law','CSRD ESRS E4'] },
];

/* ── All Regulations ──────────────────────────────────────────────────────── */
const ALL_REGULATIONS = [...new Set(EVIDENCE_CATEGORIES.flatMap(c => c.regulations))].sort();

/* ── Auto-collection keys to scan ─────────────────────────────────────────── */
const AUTO_SCAN_KEYS = [
  { key:'ra_portfolio_v1', category:'EV01', desc:'Portfolio optimization & ESG constraints', regulation:'SFDR Art 8/9' },
  { key:'ra_esg_screener_v1', category:'EV01', desc:'ESG screening results', regulation:'PRI Principle 1' },
  { key:'ra_engagement_log_v1', category:'EV02', desc:'Stewardship engagement records', regulation:'UK Stewardship Code' },
  { key:'ra_ngfs_scenarios_v1', category:'EV03', desc:'NGFS climate scenario outputs', regulation:'TCFD' },
  { key:'ra_physical_risk_v1', category:'EV03', desc:'Physical risk assessment data', regulation:'ISSB S2' },
  { key:'ra_carbon_budget_v1', category:'EV03', desc:'Carbon budget & ITR tracking', regulation:'ECB climate stress test' },
  { key:'ra_data_quality_v1', category:'EV04', desc:'Data quality monitoring scores', regulation:'CSRD ESRS 2' },
  { key:'ra_validation_engine_v1', category:'EV04', desc:'Validation engine results', regulation:'PCAF data quality' },
  { key:'ra_reports_generated_v1', category:'EV05', desc:'Regulatory filings generated', regulation:'CSRD' },
  { key:'ra_sfdr_report_v1', category:'EV05', desc:'SFDR disclosure reports', regulation:'SFDR' },
  { key:'ra_brsr_data_v1', category:'EV05', desc:'BRSR disclosure data', regulation:'BRSR' },
  { key:'ra_model_registry_v1', category:'EV06', desc:'Model registry documentation', regulation:'ECB Model Risk' },
  { key:'ra_backtest_v1', category:'EV06', desc:'Model back-test results', regulation:'PRA SS 1-13' },
  { key:'ra_client_reports_v1', category:'EV07', desc:'Client report delivery log', regulation:'MiFID II' },
  { key:'ra_exclusion_list_v1', category:'EV08', desc:'Exclusion screening lists', regulation:'SFDR Art 8/9' },
  { key:'ra_workflow_instances_v1', category:'EV08', desc:'Workflow approval evidence', regulation:'Client IPS' },
  { key:'ra_human_rights_dd_v1', category:'EV09', desc:'Human rights due diligence', regulation:'CSDDD' },
  { key:'ra_tnfd_assessment_v1', category:'EV10', desc:'TNFD LEAP assessment', regulation:'TNFD' },
  { key:'ra_biodiversity_v1', category:'EV10', desc:'Biodiversity footprint analysis', regulation:'CSRD ESRS E4' },
];

/* ── Generate seed evidence items ─────────────────────────────────────────── */
function generateEvidence() {
  const items = [];
  const now = Date.now();
  EVIDENCE_CATEGORIES.forEach((cat, ci) => {
    cat.sources.forEach((src, si) => {
      const h = hashStr(cat.id + src);
      const daysAgo = Math.floor(sr(h, 1) * 60);
      const reviewed = sr(h, 2) > 0.35;
      items.push({
        id: `EVI-${cat.id}-${si}`,
        category_id: cat.id,
        category_name: cat.name,
        description: `${src} — ${cat.description.slice(0, 50)}`,
        source_module: src,
        collected_at: new Date(now - daysAgo * 86400000).toISOString(),
        collection_type: sr(h, 3) > 0.4 ? 'auto' : 'manual',
        regulation: cat.regulations[si % cat.regulations.length],
        reviewed,
        reviewer: reviewed ? ['Arun Sharma','Priya Patel','Ravi Reddy','Sanjay Gupta'][si % 4] : null,
        review_date: reviewed ? new Date(now - (daysAgo - 3) * 86400000).toISOString() : null,
        review_comment: reviewed ? ['Verified and complete','Cross-checked with source','Meets regulatory requirement','Minor gaps noted'][si % 4] : null,
        quality_score: Math.round(60 + sr(h, 4) * 40),
        attachment_ref: `ATT-${cat.id}-${si}`,
      });
    });
  });
  return items;
}

/* ── Generate seed audit records ──────────────────────────────────────────── */
function generateAudits() {
  return [
    { id:'AUD-001', date:'2024-11-15', scope:'SFDR Annual Disclosure', auditor:'PwC External', findings:2, resolved:2, status:'closed' },
    { id:'AUD-002', date:'2024-09-20', scope:'Internal ESG Integration Review', auditor:'Internal Audit Team', findings:4, resolved:3, status:'in_progress' },
    { id:'AUD-003', date:'2025-01-10', scope:'CSRD Readiness Assessment', auditor:'Deloitte Advisory', findings:6, resolved:2, status:'in_progress' },
    { id:'AUD-004', date:'2024-06-05', scope:'Data Quality Annual Review', auditor:'Internal Compliance', findings:1, resolved:1, status:'closed' },
    { id:'AUD-005', date:'2025-02-28', scope:'TCFD Client Disclosure Audit', auditor:'KPMG External', findings:3, resolved:0, status:'pending' },
  ];
}

/* ── Sortable Table Header ────────────────────────────────────────────────── */
const SortHeader = ({ label, field, sortField, sortDir, onSort }) => {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)} style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:T.textSec, cursor:'pointer', userSelect:'none', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap', background:T.surfaceH }}>
      {label} {active ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD'}
    </th>
  );
};

/* ── Badge ────────────────────────────────────────────────────────────────── */
const Badge = ({ text, color, bg }) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600, color: color || '#fff', background: bg || T.navy }}>{text}</span>
);

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function ComplianceEvidencePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [sortField, setSortField] = useState('collected_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterCat, setFilterCat] = useState('all');
  const [filterReviewed, setFilterReviewed] = useState('all');
  const [filterReg, setFilterReg] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCat, setManualCat] = useState('EV01');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSource, setManualSource] = useState('');
  const [manualReg, setManualReg] = useState('');
  const [manualAttach, setManualAttach] = useState('');
  const [packageReg, setPackageReg] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [freshSlider, setFreshSlider] = useState(30);
  const [auditPage, setAuditPage] = useState(0);

  /* ── Portfolio read ─────────────────────────────────────────────────────── */
  const portfolioRaw = useMemo(() => {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const data = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);
  const companies = useMemo(() => {
    if (portfolioRaw.length) return portfolioRaw.map(h => {
      const master = GLOBAL_COMPANY_MASTER.find(m => m.ticker === h.ticker) || {};
      return { ...master, ...h };
    });
    return GLOBAL_COMPANY_MASTER.slice(0, 40);
  }, [portfolioRaw]);

  /* ── Evidence & audits state ────────────────────────────────────────────── */
  const [evidence, setEvidence] = useState(() => readLS(LS_EVIDENCE) || generateEvidence());
  const [audits, setAudits] = useState(() => readLS(LS_AUDITS) || generateAudits());

  useEffect(() => { writeLS(LS_EVIDENCE, evidence); }, [evidence]);
  useEffect(() => { writeLS(LS_AUDITS, audits); }, [audits]);

  const onSort = useCallback(field => {
    setSortDir(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortField(field);
  }, [sortField]);

  /* ── Auto-collection scan ───────────────────────────────────────────────── */
  const handleAutoCollect = useCallback(() => {
    const now = new Date().toISOString();
    let added = 0;
    AUTO_SCAN_KEYS.forEach(scan => {
      const data = readLS(scan.key);
      if (data) {
        const exists = evidence.some(e => e.source_module === scan.desc && e.collection_type === 'auto');
        if (!exists) {
          setEvidence(prev => [...prev, {
            id: uid(), category_id: scan.category, category_name: EVIDENCE_CATEGORIES.find(c => c.id === scan.category)?.name || '',
            description: scan.desc, source_module: scan.key, collected_at: now, collection_type:'auto',
            regulation: scan.regulation, reviewed: false, reviewer:null, review_date:null, review_comment:null,
            quality_score: 70, attachment_ref: `AUTO-${scan.key}`,
          }]);
          added++;
        }
      }
    });
    if (added === 0) {
      // Update timestamps on existing auto items
      setEvidence(prev => prev.map(e => e.collection_type === 'auto' ? { ...e, collected_at: now } : e));
    }
  }, [evidence]);

  /* ── KPIs ───────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const cats = new Set(evidence.map(e => e.category_id));
    const regs = new Set(evidence.map(e => e.regulation));
    const avgDays = evidence.reduce((s, e) => s + (Date.now() - new Date(e.collected_at).getTime()) / 86400000, 0) / (evidence.length || 1);
    const autoPct = evidence.length ? Math.round(evidence.filter(e => e.collection_type === 'auto').length / evidence.length * 100) : 0;
    const manual = evidence.filter(e => e.collection_type === 'manual').length;
    const pending = evidence.filter(e => !e.reviewed).length;
    const lastAudit = audits.length ? audits.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null;
    const avgQuality = evidence.length ? Math.round(evidence.reduce((s, e) => s + e.quality_score, 0) / evidence.length) : 0;
    return [
      { label:'Evidence Items', value: evidence.length, color:T.navy },
      { label:'Categories Covered', value: `${cats.size} / 10`, color:T.sage },
      { label:'Regulations Mapped', value: regs.size, color:T.gold },
      { label:'Avg Freshness (days)', value: Math.round(avgDays), color: avgDays > 30 ? T.amber : T.green },
      { label:'Auto-Collected %', value: autoPct + '%', color:T.navyL },
      { label:'Manual Items', value: manual, color:T.textSec },
      { label:'Pending Review', value: pending, color: pending > 10 ? T.amber : T.green },
      { label:'Audit Packages', value: audits.length, color:T.gold },
      { label:'Last Audit', value: lastAudit ? fmtDate(lastAudit) : '\u2014', color:T.navyL },
      { label:'Compliance Score', value: avgQuality + '%', color: avgQuality >= 80 ? T.green : avgQuality >= 60 ? T.amber : T.red },
    ];
  }, [evidence, audits]);

  /* ── Filtered & sorted ──────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let arr = [...evidence];
    if (filterCat !== 'all') arr = arr.filter(e => e.category_id === filterCat);
    if (filterReviewed === 'yes') arr = arr.filter(e => e.reviewed);
    if (filterReviewed === 'no') arr = arr.filter(e => !e.reviewed);
    if (filterReg !== 'all') arr = arr.filter(e => e.regulation === filterReg);
    arr.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [evidence, filterCat, filterReviewed, filterReg, sortField, sortDir]);

  /* ── Chart data ─────────────────────────────────────────────────────────── */
  const catDistribution = useMemo(() => {
    const map = {};
    evidence.forEach(e => { map[e.category_name] = (map[e.category_name] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 22 ? name.slice(0,20)+'..' : name, value }));
  }, [evidence]);

  const freshnessData = useMemo(() => {
    return EVIDENCE_CATEGORIES.map(cat => {
      const items = evidence.filter(e => e.category_id === cat.id);
      const avgDays = items.length ? Math.round(items.reduce((s, e) => s + (Date.now() - new Date(e.collected_at).getTime()) / 86400000, 0) / items.length) : 0;
      return { name: cat.name.length > 18 ? cat.name.slice(0,16)+'..' : cat.name, days: avgDays, fill: avgDays > freshSlider ? T.red : avgDays > freshSlider * 0.6 ? T.amber : T.green };
    });
  }, [evidence, freshSlider]);

  const qualityRadar = useMemo(() => {
    return EVIDENCE_CATEGORIES.map(cat => {
      const items = evidence.filter(e => e.category_id === cat.id);
      const completeness = items.length ? Math.round(items.length / 4 * 25) : 0; // 4 sources = 100%
      const freshness = items.length ? Math.round(100 - items.reduce((s, e) => s + Math.min(60, (Date.now() - new Date(e.collected_at).getTime()) / 86400000), 0) / items.length * 100 / 60) : 0;
      const coverage = items.length ? Math.round(new Set(items.map(e => e.regulation)).size / cat.regulations.length * 100) : 0;
      return { category: cat.name.slice(0, 12), completeness: Math.min(100, completeness), freshness: Math.max(0, freshness), coverage: Math.min(100, coverage) };
    });
  }, [evidence]);

  /* ── Regulatory Mapping Matrix ──────────────────────────────────────────── */
  const regMatrix = useMemo(() => {
    return ALL_REGULATIONS.map(reg => {
      const row = { regulation: reg };
      EVIDENCE_CATEGORIES.forEach(cat => {
        const hasMapping = cat.regulations.includes(reg);
        const hasEvidence = evidence.some(e => e.category_id === cat.id && e.regulation === reg);
        row[cat.id] = hasMapping ? (hasEvidence ? 'covered' : 'gap') : 'na';
      });
      return row;
    });
  }, [evidence]);

  /* ── Gap Analysis ───────────────────────────────────────────────────────── */
  const gaps = useMemo(() => {
    const gapList = [];
    ALL_REGULATIONS.forEach(reg => {
      const cats = EVIDENCE_CATEGORIES.filter(c => c.regulations.includes(reg));
      const covered = cats.filter(c => evidence.some(e => e.category_id === c.id && e.regulation === reg));
      if (covered.length < cats.length) {
        const missing = cats.filter(c => !covered.includes(c));
        gapList.push({ regulation: reg, total: cats.length, covered: covered.length, gap: cats.length - covered.length, missing_categories: missing.map(c => c.name), priority: cats.length - covered.length > 2 ? 'High' : cats.length - covered.length > 1 ? 'Medium' : 'Low' });
      }
    });
    return gapList.sort((a, b) => b.gap - a.gap);
  }, [evidence]);

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleManualAdd = useCallback(() => {
    if (!manualDesc.trim()) return;
    const cat = EVIDENCE_CATEGORIES.find(c => c.id === manualCat) || EVIDENCE_CATEGORIES[0];
    setEvidence(prev => [...prev, {
      id: uid(), category_id: cat.id, category_name: cat.name, description: manualDesc.trim(),
      source_module: manualSource || 'Manual Entry', collected_at: new Date().toISOString(),
      collection_type:'manual', regulation: manualReg || cat.regulations[0], reviewed:false,
      reviewer:null, review_date:null, review_comment:null, quality_score:50,
      attachment_ref: manualAttach || 'MANUAL-' + Date.now(),
    }]);
    setManualDesc(''); setManualSource(''); setManualReg(''); setManualAttach(''); setShowManualForm(false);
  }, [manualCat, manualDesc, manualSource, manualReg, manualAttach]);

  const handleReview = useCallback((itemId) => {
    if (!reviewComment.trim()) return;
    setEvidence(prev => prev.map(e => e.id === itemId ? {
      ...e, reviewed:true, reviewer:'Current User', review_date:new Date().toISOString(), review_comment:reviewComment, quality_score: Math.min(100, e.quality_score + 10),
    } : e));
    setReviewComment(''); setSelectedItem(null);
  }, [reviewComment]);

  /* ── Audit Package Builder ──────────────────────────────────────────────── */
  const auditPackage = useMemo(() => {
    if (!packageReg) return null;
    const cats = EVIDENCE_CATEGORIES.filter(c => c.regulations.includes(packageReg));
    const items = evidence.filter(e => cats.some(c => c.id === e.category_id) && e.regulation === packageReg);
    return { regulation: packageReg, categories: cats, items, completeness: cats.length ? Math.round(items.length / (cats.length * 2) * 100) : 0 };
  }, [packageReg, evidence]);

  /* ── Exports ────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportJSON = useCallback((data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportEvidenceCSV = () => exportCSV(filtered.map(e => ({
    id:e.id, category:e.category_name, description:e.description, source:e.source_module,
    collected:e.collected_at, type:e.collection_type, regulation:e.regulation,
    reviewed:e.reviewed?'Yes':'No', reviewer:e.reviewer||'', quality:e.quality_score,
  })), 'compliance_evidence.csv');

  const exportAuditJSON = () => {
    if (!auditPackage) return;
    exportJSON({ ...auditPackage, exported_at: new Date().toISOString(), items: auditPackage.items }, `audit_package_${packageReg.replace(/\s+/g,'_')}.json`);
  };

  const handlePrint = () => window.print();

  /* ── Styles ─────────────────────────────────────────────────────────────── */
  const s = {
    page: { fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text },
    card: { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:20 },
    kpiRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(148px,1fr))', gap:12, marginBottom:24 },
    kpi: (c) => ({ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:'14px 16px', borderLeft:`4px solid ${c}` }),
    btn: (bg, fg) => ({ padding:'8px 18px', borderRadius:8, border:'none', background:bg||T.navy, color:fg||'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font }),
    btnSm: (bg, fg) => ({ padding:'5px 12px', borderRadius:6, border:'none', background:bg||T.surfaceH, color:fg||T.text, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:T.font }),
    input: { padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, width:'100%', boxSizing:'border-box' },
    select: { padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, background:T.surface },
    tabBar: { display:'flex', gap:4, marginBottom:20, background:T.surfaceH, borderRadius:10, padding:4, flexWrap:'wrap' },
    tabBtn: (active) => ({ padding:'8px 18px', borderRadius:8, border:'none', background:active?T.navy:'transparent', color:active?'#fff':T.textSec, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font }),
    table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
    td: { padding:'10px 12px', borderBottom:`1px solid ${T.border}`, verticalAlign:'middle' },
    emptyState: { textAlign:'center', padding:'48px 20px', color:T.textMut },
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, margin:0, color:T.navy }}>Compliance Evidence Manager</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <Badge text="10 Categories" bg={T.navy} /><Badge text={`${ALL_REGULATIONS.length} Regulations`} bg={T.gold} color={T.navy} />
            <Badge text="Audit-Ready Packages" bg={T.sage} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={s.btn(T.sage)} onClick={() => setShowManualForm(true)}>+ Add Evidence</button>
          <button style={s.btn(T.navyL)} onClick={handleAutoCollect}>Refresh Auto-Collect</button>
          <button style={s.btn(T.gold, T.navy)} onClick={exportEvidenceCSV}>Export CSV</button>
          <button style={s.btn(T.surfaceH, T.text)} onClick={handlePrint}>Print</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={s.kpiRow}>
        {kpis.map((k, i) => (
          <div key={i} style={s.kpi(k.color)}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:3, fontWeight:500 }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={s.tabBar}>
        {[['dashboard','Dashboard'],['table','Evidence Table'],['matrix','Reg Matrix'],['package','Audit Packages'],['gaps','Gap Analysis'],['quality','Quality Score'],['history','Audit History'],['charts','Analytics']].map(([id, label]) => (
          <button key={id} style={s.tabBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Filters for table/matrix */}
      {['table','matrix'].includes(tab) && (
        <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <select style={s.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {EVIDENCE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={s.select} value={filterReviewed} onChange={e => setFilterReviewed(e.target.value)}>
            <option value="all">All Review Status</option>
            <option value="yes">Reviewed</option><option value="no">Pending Review</option>
          </select>
          <select style={s.select} value={filterReg} onChange={e => setFilterReg(e.target.value)}>
            <option value="all">All Regulations</option>
            {ALL_REGULATIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* ── Evidence Dashboard ─────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {EVIDENCE_CATEGORIES.map(cat => {
            const items = evidence.filter(e => e.category_id === cat.id);
            const reviewed = items.filter(e => e.reviewed).length;
            const avgDays = items.length ? Math.round(items.reduce((s, e) => s + (Date.now() - new Date(e.collected_at).getTime()) / 86400000, 0) / items.length) : 0;
            return (
              <div key={cat.id} style={{ ...s.card, marginBottom:0, cursor:'pointer', transition:'box-shadow 0.15s' }}
                onClick={() => { setFilterCat(cat.id); setTab('table'); }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(27,58,92,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, lineHeight:1.3, maxWidth:'75%' }}>{cat.name}</div>
                  <Badge text={`${items.length} items`} bg={items.length > 0 ? T.sage : T.textMut} />
                </div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:10, lineHeight:1.4 }}>{cat.description}</div>
                <div style={{ display:'flex', gap:12, fontSize:11, color:T.textMut, marginBottom:8 }}>
                  <span>Freshness: <strong style={{ color: avgDays > 30 ? T.red : T.green }}>{avgDays}d</strong></span>
                  <span>Reviewed: <strong>{reviewed}/{items.length}</strong></span>
                </div>
                <div style={{ fontSize:11, marginBottom:6 }}>
                  <strong>Sources:</strong> {cat.sources.join(', ')}
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {cat.regulations.map(r => <Badge key={r} text={r} bg={T.surfaceH} color={T.text} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Evidence Collection Table ──────────────────────────────────────── */}
      {tab === 'table' && (
        <div style={{ ...s.card, overflowX:'auto' }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Evidence Collection ({filtered.length} items)</h3>
          {filtered.length === 0 ? (
            <div style={s.emptyState}><div style={{ fontSize:36, marginBottom:8 }}>--</div><div>No evidence matches your filters.</div></div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <SortHeader label="Category" field="category_name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Description" field="description" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Source" field="source_module" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Collected" field="collected_at" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Type" field="collection_type" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Regulation" field="regulation" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Reviewed" field="reviewed" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Quality" field="quality_score" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}
                    onMouseEnter={ev => ev.currentTarget.style.background = T.surfaceH}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...s.td, fontSize:12 }}>{e.category_name.length > 20 ? e.category_name.slice(0,18)+'..' : e.category_name}</td>
                    <td style={{ ...s.td, maxWidth:200 }}>{e.description}</td>
                    <td style={s.td}>{e.source_module}</td>
                    <td style={s.td}>{fmtDate(e.collected_at)}</td>
                    <td style={s.td}><Badge text={e.collection_type} bg={e.collection_type === 'auto' ? T.navyL : T.gold} color={e.collection_type === 'auto' ? '#fff' : T.navy} /></td>
                    <td style={s.td}><Badge text={e.regulation} bg={T.surfaceH} color={T.text} /></td>
                    <td style={s.td}>{e.reviewed ? <span style={{ color:T.green, fontWeight:700 }}>Reviewed</span> : <span style={{ color:T.amber }}>Pending</span>}</td>
                    <td style={s.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:40, height:6, borderRadius:3, background:T.surfaceH, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${e.quality_score}%`, background: e.quality_score >= 80 ? T.green : e.quality_score >= 60 ? T.amber : T.red, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:600 }}>{e.quality_score}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      {!e.reviewed && <button style={s.btnSm(T.sage, '#fff')} onClick={() => setSelectedItem(e)}>Review</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Regulatory Mapping Matrix ─────────────────────────────────────── */}
      {tab === 'matrix' && (
        <div style={{ ...s.card, overflowX:'auto' }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Regulatory Mapping Matrix</h3>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>
            <span style={{ display:'inline-block', width:12, height:12, background:T.green, borderRadius:3, marginRight:4, verticalAlign:'middle' }} /> Covered
            <span style={{ display:'inline-block', width:12, height:12, background:T.red, borderRadius:3, marginLeft:12, marginRight:4, verticalAlign:'middle' }} /> Gap
            <span style={{ display:'inline-block', width:12, height:12, background:T.surfaceH, borderRadius:3, marginLeft:12, marginRight:4, verticalAlign:'middle' }} /> N/A
          </div>
          <table style={{ ...s.table, fontSize:11 }}>
            <thead>
              <tr>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:11, fontWeight:600, position:'sticky', left:0, zIndex:1 }}>Regulation</th>
                {EVIDENCE_CATEGORIES.map(c => (
                  <th key={c.id} style={{ ...s.td, background:T.surfaceH, fontSize:10, fontWeight:600, textAlign:'center', minWidth:70, writingMode:'vertical-rl', height:100 }}>{c.name.slice(0,16)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regMatrix.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ ...s.td, fontWeight:600, fontSize:11, position:'sticky', left:0, background:T.surface, zIndex:1 }}>{row.regulation}</td>
                  {EVIDENCE_CATEGORIES.map(c => {
                    const v = row[c.id];
                    const bg = v === 'covered' ? `${T.green}25` : v === 'gap' ? `${T.red}25` : T.surfaceH;
                    const icon = v === 'covered' ? '\u2705' : v === 'gap' ? '\u26A0\uFE0F' : '\u2014';
                    return <td key={c.id} style={{ ...s.td, textAlign:'center', background:bg, fontSize:14 }}>{icon}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Audit Package Builder ─────────────────────────────────────────── */}
      {tab === 'package' && (
        <div style={s.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Audit Package Builder</h3>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', marginBottom:20 }}>
            <div style={{ flex:1, maxWidth:300 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Select Regulation</label>
              <select style={{ ...s.select, width:'100%' }} value={packageReg} onChange={e => setPackageReg(e.target.value)}>
                <option value="">Choose a regulation...</option>
                {ALL_REGULATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {auditPackage && <button style={s.btn(T.sage)} onClick={exportAuditJSON}>Export Audit Package JSON</button>}
          </div>
          {!packageReg ? (
            <div style={s.emptyState}>Select a regulation to build an audit-ready evidence package.</div>
          ) : auditPackage && (
            <div>
              <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
                <div style={s.kpi(T.navy)}><div style={{ fontSize:11, color:T.textMut }}>Evidence Items</div><div style={{ fontSize:20, fontWeight:700 }}>{auditPackage.items.length}</div></div>
                <div style={s.kpi(T.sage)}><div style={{ fontSize:11, color:T.textMut }}>Categories</div><div style={{ fontSize:20, fontWeight:700 }}>{auditPackage.categories.length}</div></div>
                <div style={s.kpi(auditPackage.completeness >= 80 ? T.green : T.amber)}><div style={{ fontSize:11, color:T.textMut }}>Completeness</div><div style={{ fontSize:20, fontWeight:700 }}>{auditPackage.completeness}%</div></div>
              </div>
              {auditPackage.categories.map(cat => {
                const items = auditPackage.items.filter(e => e.category_id === cat.id);
                return (
                  <div key={cat.id} style={{ padding:12, borderRadius:10, border:`1px solid ${T.border}`, marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>{cat.name}</div>
                    {items.length === 0 ? (
                      <div style={{ fontSize:12, color:T.red }}>No evidence collected for this category.</div>
                    ) : items.map(e => (
                      <div key={e.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:`1px solid ${T.surfaceH}` }}>
                        <span>{e.description}</span>
                        <span>{e.reviewed ? <span style={{ color:T.green }}>Reviewed</span> : <span style={{ color:T.amber }}>Pending</span>}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Gap Analysis ──────────────────────────────────────────────────── */}
      {tab === 'gaps' && (
        <div style={s.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Compliance Gap Analysis ({gaps.length} gaps identified)</h3>
          {gaps.length === 0 ? (
            <div style={s.emptyState}><div style={{ fontSize:36, marginBottom:8 }}>--</div><div>No evidence gaps detected. Full regulatory coverage achieved.</div></div>
          ) : (
            <table style={s.table}>
              <thead><tr>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Regulation</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Required Categories</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Covered</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Gaps</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Priority</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Missing Evidence</th>
              </tr></thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...s.td, fontWeight:600 }}>{g.regulation}</td>
                    <td style={s.td}>{g.total}</td>
                    <td style={s.td}><span style={{ color:T.green, fontWeight:700 }}>{g.covered}</span></td>
                    <td style={s.td}><span style={{ color:T.red, fontWeight:700 }}>{g.gap}</span></td>
                    <td style={s.td}><Badge text={g.priority} bg={g.priority === 'High' ? T.red : g.priority === 'Medium' ? T.amber : T.textMut} /></td>
                    <td style={{ ...s.td, fontSize:11 }}>{g.missing_categories.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Evidence Quality Score (Radar) ────────────────────────────────── */}
      {tab === 'quality' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Evidence Quality by Category</h3>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart outerRadius={110} data={qualityRadar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="category" tick={{ fontSize:10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize:10 }} />
                <Radar name="Completeness" dataKey="completeness" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                <Radar name="Freshness" dataKey="freshness" stroke={T.sage} fill={T.sage} fillOpacity={0.2} />
                <Radar name="Reg Coverage" dataKey="coverage" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Category Quality Breakdown</h3>
            <div style={{ maxHeight:340, overflowY:'auto' }}>
              {EVIDENCE_CATEGORIES.map(cat => {
                const items = evidence.filter(e => e.category_id === cat.id);
                const avgQ = items.length ? Math.round(items.reduce((s, e) => s + e.quality_score, 0) / items.length) : 0;
                const revPct = items.length ? Math.round(items.filter(e => e.reviewed).length / items.length * 100) : 0;
                return (
                  <div key={cat.id} style={{ padding:'10px 12px', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ fontWeight:600 }}>{cat.name}</span>
                      <span style={{ fontWeight:700, color: avgQ >= 80 ? T.green : avgQ >= 60 ? T.amber : T.red }}>{avgQ}%</span>
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:11, color:T.textMut }}>
                      <span>{items.length} items</span><span>Reviewed: {revPct}%</span><span>Regs: {cat.regulations.length}</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:T.surfaceH, marginTop:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${avgQ}%`, borderRadius:3, background: avgQ >= 80 ? T.green : avgQ >= 60 ? T.amber : T.red }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Audit History ─────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={s.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Historical Audits ({audits.length})</h3>
          {audits.length === 0 ? (
            <div style={s.emptyState}><div style={{ fontSize:36, marginBottom:8 }}>--</div><div>No audit records yet.</div></div>
          ) : (
            <table style={s.table}>
              <thead><tr>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Date</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Scope</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Auditor</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Findings</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Resolved</th>
                <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Status</th>
              </tr></thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={s.td}>{fmtDate(a.date)}</td>
                    <td style={{ ...s.td, fontWeight:600 }}>{a.scope}</td>
                    <td style={s.td}>{a.auditor}</td>
                    <td style={s.td}><span style={{ color: a.findings > 3 ? T.red : T.amber, fontWeight:700 }}>{a.findings}</span></td>
                    <td style={s.td}><span style={{ color:T.green, fontWeight:700 }}>{a.resolved}</span> / {a.findings}</td>
                    <td style={s.td}><Badge text={a.status} bg={a.status === 'closed' ? T.green : a.status === 'in_progress' ? T.amber : T.textMut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Analytics Charts ──────────────────────────────────────────────── */}
      {tab === 'charts' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Category Distribution */}
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Evidence by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke:T.border }}>
                  {catDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Freshness BarChart */}
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Evidence Freshness by Category (days)</h3>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontSize:11, color:T.textMut }}>Threshold: {freshSlider}d</span>
              <input type="range" min={7} max={90} value={freshSlider} onChange={e => setFreshSlider(Number(e.target.value))} style={{ flex:1 }} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={freshnessData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:11 }} /><YAxis dataKey="name" type="category" width={130} tick={{ fontSize:10 }} />
                <Tooltip /><Bar dataKey="days" radius={[0,6,6,0]}>
                  {freshnessData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Review Workflow Modal ─────────────────────────────────────────── */}
      {selectedItem && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setSelectedItem(null)}>
          <div style={{ background:T.surface, borderRadius:16, padding:28, width:480, maxWidth:'90vw', boxShadow:'0 16px 48px rgba(27,58,92,0.18)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Review Evidence Item</h3>
            <div style={{ fontSize:13, marginBottom:8 }}><strong>Category:</strong> {selectedItem.category_name}</div>
            <div style={{ fontSize:13, marginBottom:8 }}><strong>Description:</strong> {selectedItem.description}</div>
            <div style={{ fontSize:13, marginBottom:8 }}><strong>Source:</strong> {selectedItem.source_module}</div>
            <div style={{ fontSize:13, marginBottom:8 }}><strong>Regulation:</strong> {selectedItem.regulation}</div>
            <div style={{ fontSize:13, marginBottom:8 }}><strong>Collected:</strong> {fmtDate(selectedItem.collected_at)} ({selectedItem.collection_type})</div>
            <div style={{ fontSize:13, marginBottom:8 }}><strong>Quality Score:</strong> {selectedItem.quality_score}%</div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Review Comment *</label>
              <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Enter review notes..." />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button style={s.btn(T.surfaceH, T.text)} onClick={() => setSelectedItem(null)}>Cancel</button>
              <button style={s.btn(T.green)} onClick={() => handleReview(selectedItem.id)} disabled={!reviewComment.trim()}>Mark as Reviewed</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Evidence Entry Modal ───────────────────────────────────── */}
      {showManualForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowManualForm(false)}>
          <div style={{ background:T.surface, borderRadius:16, padding:28, width:520, maxWidth:'90vw', boxShadow:'0 16px 48px rgba(27,58,92,0.18)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Add Manual Evidence</h3>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Category</label>
              <select style={{ ...s.select, width:'100%' }} value={manualCat} onChange={e => setManualCat(e.target.value)}>
                {EVIDENCE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Description *</label>
              <textarea style={{ ...s.input, minHeight:50, resize:'vertical' }} value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Describe the evidence..." />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Source Module</label>
              <input style={s.input} value={manualSource} onChange={e => setManualSource(e.target.value)} placeholder="e.g. External auditor report" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Regulation</label>
                <select style={{ ...s.select, width:'100%' }} value={manualReg} onChange={e => setManualReg(e.target.value)}>
                  <option value="">Select...</option>
                  {ALL_REGULATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Attachment Ref</label>
                <input style={s.input} value={manualAttach} onChange={e => setManualAttach(e.target.value)} placeholder="e.g. DOC-2025-001" />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button style={s.btn(T.surfaceH, T.text)} onClick={() => setShowManualForm(false)}>Cancel</button>
              <button style={s.btn(T.sage)} onClick={handleManualAdd} disabled={!manualDesc.trim()}>Add Evidence</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cross-navigation ─────────────────────────────────────────────── */}
      <div style={{ ...s.card, marginTop:8 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Related Modules</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['Audit Trail', '/audit-trail'],
            ['Regulatory Gap', '/regulatory-gap'],
            ['Regulatory Submission', '/regulatory-submission'],
            ['Data Governance', '/data-governance'],
            ['Approval Workflows', '/approval-workflows'],
          ].map(([label, path]) => (
            <button key={path} style={s.btnSm(T.surfaceH, T.navy)} onClick={() => navigate(path)}>{label} &rarr;</button>
          ))}
        </div>
      </div>
    </div>
  );
}
