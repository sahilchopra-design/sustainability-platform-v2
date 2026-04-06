import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_CHANGES = 'ra_change_requests_v1';
const LS_KEY = 'ep_v5_change_mgmt_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
const today = new Date('2025-05-15');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '---';
const riskColor = (r) => r === 'High' ? T.red : r === 'Medium' ? T.amber : T.green;

/* ═══════════════════════════════════════════════════════════════════════════
   CHANGE CATEGORIES
   ═══════════════════════════════════════════════════════════════════════════ */
const CHANGE_CATEGORIES = [
  { id:'CC01', name:'Data Schema Change', risk:'High', examples:['New company field added','Exchange data format changed','BRSR mapping updated'], requires_approval:true, impact_scope:'All modules using affected data' },
  { id:'CC02', name:'Model Parameter Update', risk:'High', examples:['PD alpha coefficient changed','DMI weights adjusted','VaR confidence level modified'], requires_approval:true, impact_scope:'All dependent calculations + reports' },
  { id:'CC03', name:'Threshold Configuration', risk:'Medium', examples:['Materiality threshold 50 to 60','Alert z-score trigger changed','ESG screen criteria updated'], requires_approval:true, impact_scope:'Affected screening/alerting modules' },
  { id:'CC04', name:'Report Template', risk:'Low', examples:['TCFD template section added','Client template branding updated','New framework template created'], requires_approval:false, impact_scope:'Report output format' },
  { id:'CC05', name:'API Integration', risk:'Medium', examples:['EODHD endpoint added','New data source connected','Cache TTL modified'], requires_approval:true, impact_scope:'Data freshness + quality' },
  { id:'CC06', name:'Regulatory Update', risk:'High', examples:['CSRD ESRS standard updated','SFDR RTS amended','New ISSB requirement'], requires_approval:true, impact_scope:'Compliance modules + reports' },
  { id:'CC07', name:'Workflow Change', risk:'Medium', examples:['New approval workflow added','SLA modified','Approver role changed'], requires_approval:true, impact_scope:'Governance process' },
  { id:'CC08', name:'User/Access Change', risk:'Medium', examples:['API key rotation','Permission change','Client access updated'], requires_approval:true, impact_scope:'Security + access control' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DEFAULT CHANGE REQUESTS
   ═══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_CHANGES = [
  { id:'CR-001', title:'Update PD alpha for Energy sector', category:'CC02', risk_level:'High', description:'Recalibrate alpha_transition for Energy from 0.45 to 0.52 based on 2024 PD migration data', before_state:'alpha_transition: 0.45', after_state:'alpha_transition: 0.52', impact_assessment:'Affects 108 US + 30 India Energy companies. PD increases avg 15 bps.', requester:'Quant Team', status:'approved', created_at:'2025-04-01', approved_at:'2025-04-05', implemented_at:null, rollback_available:true },
  { id:'CR-002', title:'Add CBAM field to company schema', category:'CC01', risk_level:'High', description:'New boolean field cbam_exposed for EU CBAM scope tracking', before_state:'schema: no cbam_exposed field', after_state:'schema: cbam_exposed BOOLEAN DEFAULT false', impact_assessment:'All company queries updated. 14 reports affected. CSRD module needs update.', requester:'Data Engineering', status:'implemented', created_at:'2025-03-15', approved_at:'2025-03-18', implemented_at:'2025-03-20', rollback_available:true },
  { id:'CR-003', title:'Increase materiality threshold to 60', category:'CC03', risk_level:'Medium', description:'Raise ESG materiality from 50 to 60 to reduce noise in screening', before_state:'materiality_threshold: 50', after_state:'materiality_threshold: 60', impact_assessment:'ESG screener will flag 22% fewer companies. Sector benchmark recalc needed.', requester:'ESG Analytics', status:'submitted', created_at:'2025-05-01', approved_at:null, implemented_at:null, rollback_available:false },
  { id:'CR-004', title:'Update TCFD report template v3', category:'CC04', risk_level:'Low', description:'Add Scope 3 estimation section and ISSB S2 alignment table', before_state:'TCFD template v2', after_state:'TCFD template v3 with Scope 3 + ISSB S2', impact_assessment:'Report format change only. No data impact.', requester:'Reporting Team', status:'implemented', created_at:'2025-02-20', approved_at:null, implemented_at:'2025-02-22', rollback_available:true },
  { id:'CR-005', title:'Add new EODHD bonds endpoint', category:'CC05', risk_level:'Medium', description:'Connect EODHD /bonds/v2 API for enhanced fixed income coverage', before_state:'EODHD bonds v1 endpoint', after_state:'EODHD bonds v2 endpoint with expanded fields', impact_assessment:'Fixed income data coverage improves by 35%. Cache invalidation needed.', requester:'Fixed Income Team', status:'draft', created_at:'2025-05-10', approved_at:null, implemented_at:null, rollback_available:false },
  { id:'CR-006', title:'CSRD ESRS E1 standard update', category:'CC06', risk_level:'High', description:'Update ESRS E1 mapping per 2025 delegated act amendments', before_state:'ESRS E1 v2024', after_state:'ESRS E1 v2025 with amended metrics', impact_assessment:'CSRD iXBRL module and DMA both affected. 12 data points change.', requester:'Regulatory Team', status:'approved', created_at:'2025-04-20', approved_at:'2025-05-02', implemented_at:null, rollback_available:false },
  { id:'CR-007', title:'Modify approval workflow SLA to 3 days', category:'CC07', risk_level:'Medium', description:'Reduce max approval SLA from 5 to 3 business days', before_state:'approval_sla: 5 days', after_state:'approval_sla: 3 days', impact_assessment:'All pending approvals affected. May increase escalation rate.', requester:'Governance Team', status:'implemented', created_at:'2025-01-10', approved_at:'2025-01-12', implemented_at:'2025-01-15', rollback_available:true },
  { id:'CR-008', title:'Rotate EODHD API key Q2', category:'CC08', risk_level:'Medium', description:'Scheduled quarterly rotation of EODHD API credentials', before_state:'API key: ...a4f2', after_state:'API key: ...b7c9', impact_assessment:'Brief data interruption during rotation. All EODHD-dependent modules affected.', requester:'IT Security', status:'implemented', created_at:'2025-04-01', approved_at:'2025-04-01', implemented_at:'2025-04-02', rollback_available:true },
  { id:'CR-009', title:'Adjust VaR confidence from 95% to 99%', category:'CC02', risk_level:'High', description:'Regulatory requirement to report 99% VaR alongside 95%', before_state:'VaR confidence: [95%]', after_state:'VaR confidence: [95%, 99%]', impact_assessment:'Monte Carlo module: additional run. Report adds new column. No data loss.', requester:'Risk Committee', status:'submitted', created_at:'2025-05-05', approved_at:null, implemented_at:null, rollback_available:false },
  { id:'CR-010', title:'DMI weight recalibration Q2', category:'CC02', risk_level:'High', description:'Recalibrate DMI transition + physical weights based on backtesting', before_state:'w_trans:0.40, w_phys:0.35, w_reg:0.25', after_state:'w_trans:0.38, w_phys:0.37, w_reg:0.25', impact_assessment:'All DMI scores shift. 1,323 companies affected. Portfolio rankings may change.', requester:'Quant Team', status:'draft', created_at:'2025-05-12', approved_at:null, implemented_at:null, rollback_available:false },
  { id:'CR-011', title:'Add client access for Fund Beta', category:'CC08', risk_level:'Medium', description:'Provision read-only access for new client Fund Beta to their portfolio module', before_state:'No access for Fund Beta', after_state:'Read-only access: Portfolio Dashboard, Client Report', impact_assessment:'New client access. Isolated to their portfolio only.', requester:'Client Services', status:'approved', created_at:'2025-05-08', approved_at:'2025-05-10', implemented_at:null, rollback_available:false },
  { id:'CR-012', title:'Update SFDR PAI indicator mapping', category:'CC06', risk_level:'High', description:'Align PAI indicators with RTS 2025 amendment', before_state:'SFDR PAI v2024 mapping', after_state:'SFDR PAI v2025 mapping', impact_assessment:'SFDR reporting module + 8 PAI indicators affected.', requester:'Regulatory Team', status:'rolled_back', created_at:'2025-03-01', approved_at:'2025-03-05', implemented_at:'2025-03-08', rollback_available:false },
];

/* ═══════════════════════════════════════════════════════════════════════════
   VERSION HISTORY
   ═══════════════════════════════════════════════════════════════════════════ */
const VERSION_HISTORY = [
  { version:'1.0', sprint:'Sprint A', date:'2024-06-01', description:'Core portfolio analytics, PCAF alignment, India BRSR' },
  { version:'2.0', sprint:'Sprint B', date:'2024-08-01', description:'Global exchange coverage (13 exchanges), ESG composite scoring' },
  { version:'3.0', sprint:'Sprint C', date:'2024-10-01', description:'Advanced quant models: Monte Carlo VaR, Copula, ITR, Stochastic' },
  { version:'4.0', sprint:'Sprint D', date:'2024-12-01', description:'Regulatory deep-dive: CSRD DMA, EU Taxonomy, SFDR, ISSB/TCFD' },
  { version:'5.0', sprint:'Sprint E', date:'2025-02-01', description:'Real estate, private markets, supply chain, ESG controversy' },
  { version:'5.5', sprint:'Sprint F-T', date:'2025-04-01', description:'165+ modules: climate derivatives, social taxonomy, AI governance' },
  { version:'6.0', sprint:'Sprint V', date:'2025-05-15', description:'Governance & Audit Trail: audit log, model governance, workflows, compliance evidence, change management' },
];

const KANBAN_COLS = ['draft','submitted','approved','implemented','rolled_back'];
const KANBAN_LABELS = { draft:'Draft', submitted:'Submitted', approved:'Approved', implemented:'Implemented', rolled_back:'Rolled Back' };
const KANBAN_COLORS = { draft:T.textMut, submitted:T.navyL, approved:T.gold, implemented:T.green, rolled_back:T.red };

/* ── Shared UI Components ─────────────────────────────────────────────────── */
const Badge = ({ children, color = T.navy }) => (
  <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:9999, background:`${color}18`, color, letterSpacing:0.3 }}>{children}</span>
);
const KpiCard = ({ label, value, sub, accent = T.navy }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 18px', borderTop:`3px solid ${accent}` }}>
    <div style={{ fontSize:12, color:T.textSec, marginBottom:4, fontWeight:500 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.text }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textMut, marginTop:3 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, variant = 'primary', small, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:small ? '5px 10px' : '8px 16px', borderRadius:6, border:variant === 'outline' ? `1px solid ${T.border}` : 'none', cursor:disabled ? 'not-allowed' : 'pointer', opacity:disabled ? 0.5 : 1, background:variant === 'primary' ? T.navy : variant === 'danger' ? T.red : variant === 'gold' ? T.gold : T.surfaceH, color:(variant === 'primary' || variant === 'danger' || variant === 'gold') ? '#fff' : T.text, fontWeight:600, fontSize:small ? 12 : 13, fontFamily:T.font, transition:'all 0.15s' }}>{children}</button>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${T.gold}` }}>
      <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{title}</span>
      {badge && <Badge color={T.sage}>{badge}</Badge>}
    </div>
    {children}
  </div>
);
const EmptyState = ({ message }) => (
  <div style={{ padding:40, textAlign:'center', color:T.textMut, fontSize:14, background:T.surfaceH, borderRadius:8, border:`1px dashed ${T.border}` }}>{message}</div>
);
const Th = ({ children, sortKey, sortCol, sortDir, onSort }) => (
  <th onClick={() => onSort && onSort(sortKey)} style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, cursor:onSort ? 'pointer' : 'default', userSelect:'none', whiteSpace:'nowrap', background:T.surfaceH }}>
    {children}{sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const Td = ({ children, style }) => (
  <td style={{ padding:'9px 12px', fontSize:13, color:T.text, borderBottom:`1px solid ${T.border}`, ...style }}>{children}</td>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ChangeManagementPage() {
  const navigate = useNavigate();
  const portfolioRaw = useMemo(() => {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const data = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);
  const companies = useMemo(() => {
    if (portfolioRaw.length) {
      const tickers = new Set(portfolioRaw.map(p => p.ticker || p.symbol).filter(Boolean));
      return GLOBAL_COMPANY_MASTER.filter(c => tickers.has(c.ticker));
    }
    return GLOBAL_COMPANY_MASTER.slice(0, 200);
  }, [portfolioRaw]);

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [changes, setChanges] = useState(() => loadLS(LS_CHANGES) || DEFAULT_CHANGES);
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [selectedCR, setSelectedCR] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCR, setNewCR] = useState({ title:'', category:'CC01', risk_level:'Medium', description:'', before_state:'', after_state:'', impact_assessment:'', requester:'' });

  useEffect(() => { saveLS(LS_CHANGES, changes); }, [changes]);

  /* ── Sorting ────────────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  /* ── Filtered & Sorted ──────────────────────────────────────────────────── */
  const filteredChanges = useMemo(() => {
    let arr = [...changes];
    if (filterCat !== 'All') arr = arr.filter(c => c.category === filterCat);
    if (filterStatus !== 'All') arr = arr.filter(c => c.status === filterStatus);
    if (filterRisk !== 'All') arr = arr.filter(c => c.risk_level === filterRisk);
    arr.sort((a, b) => {
      let va = a[sortCol] || '', vb = b[sortCol] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return arr;
  }, [changes, filterCat, filterStatus, filterRisk, sortCol, sortDir]);

  /* ── KPI Computations ───────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const active = changes.filter(c => ['draft','submitted','approved'].includes(c.status)).length;
    const pending = changes.filter(c => c.status === 'submitted').length;
    const implemented30d = changes.filter(c => c.status === 'implemented' && c.implemented_at && (today - new Date(c.implemented_at)) / 86400000 <= 30).length;
    const rolledBack = changes.filter(c => c.status === 'rolled_back').length;
    const highRisk = changes.filter(c => c.risk_level === 'High').length;
    const implTimes = changes.filter(c => c.implemented_at && c.created_at).map(c => (new Date(c.implemented_at) - new Date(c.created_at)) / 86400000);
    const avgImpl = implTimes.length ? (implTimes.reduce((a, b) => a + b, 0) / implTimes.length).toFixed(1) : '---';
    const totalImpl = changes.filter(c => c.status === 'implemented' || c.status === 'rolled_back').length;
    const rollbackRate = totalImpl ? ((rolledBack / totalImpl) * 100).toFixed(1) : '0.0';
    const monthCounts = {};
    changes.forEach(c => { const m = c.created_at?.substring(0, 7); if (m) monthCounts[m] = (monthCounts[m] || 0) + 1; });
    const months = Object.keys(monthCounts).sort();
    const trend = months.length >= 2 ? (monthCounts[months[months.length - 1]] > monthCounts[months[months.length - 2]] ? 'Up' : 'Down') : 'Stable';
    return { active, pending, implemented30d, rolledBack, highRisk, avgImpl, trend, rollbackRate };
  }, [changes]);

  /* ── Create Change ──────────────────────────────────────────────────────── */
  const handleCreateCR = useCallback(() => {
    if (!newCR.title.trim()) return;
    const id = `CR-${String(changes.length + 1).padStart(3, '0')}`;
    const cat = CHANGE_CATEGORIES.find(c => c.id === newCR.category);
    const cr = { ...newCR, id, status:'draft', created_at:today.toISOString().split('T')[0], approved_at:null, implemented_at:null, rollback_available:false, risk_level:newCR.risk_level || cat?.risk || 'Medium' };
    setChanges(prev => [cr, ...prev]);
    setNewCR({ title:'', category:'CC01', risk_level:'Medium', description:'', before_state:'', after_state:'', impact_assessment:'', requester:'' });
    setShowCreateForm(false);
  }, [newCR, changes]);

  /* ── Status Transitions ─────────────────────────────────────────────────── */
  const advanceStatus = useCallback((crId) => {
    setChanges(prev => prev.map(c => {
      if (c.id !== crId) return c;
      const transitions = { draft:'submitted', submitted:'approved', approved:'implemented' };
      const next = transitions[c.status];
      if (!next) return c;
      const updates = { status:next };
      if (next === 'approved') updates.approved_at = today.toISOString().split('T')[0];
      if (next === 'implemented') { updates.implemented_at = today.toISOString().split('T')[0]; updates.rollback_available = true; }
      return { ...c, ...updates };
    }));
  }, []);

  const rollbackCR = useCallback((crId) => {
    if (!window.confirm('Are you sure you want to rollback this change? This will restore the previous state.')) return;
    setChanges(prev => prev.map(c => c.id === crId ? { ...c, status:'rolled_back', rollback_available:false } : c));
  }, []);

  /* ── Charts Data ────────────────────────────────────────────────────────── */
  const riskPieData = useMemo(() => {
    const counts = { High:0, Medium:0, Low:0 };
    changes.forEach(c => { if (counts[c.risk_level] !== undefined) counts[c.risk_level]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [changes]);
  const riskPieColors = [T.red, T.amber, T.green];

  const categoryTrendData = useMemo(() => {
    const months = {};
    changes.forEach(c => {
      const m = c.created_at?.substring(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = {};
      const catName = CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name || c.category;
      months[m][catName] = (months[m][catName] || 0) + 1;
    });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).map(([month, cats]) => ({ month:month.substring(5), ...cats }));
  }, [changes]);
  const catNames = useMemo(() => [...new Set(changes.map(c => CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name).filter(Boolean))], [changes]);

  /* ── Exports ────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const headers = ['ID','Title','Category','Risk','Status','Requester','Created','Approved','Implemented','Impact'];
    const rows = changes.map(c => [c.id, c.title, CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name || c.category, c.risk_level, c.status, c.requester, c.created_at || '', c.approved_at || '', c.implemented_at || '', `"${(c.impact_assessment || '').replace(/"/g, '""')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'change_log.csv'; a.click();
  }, [changes]);

  const exportJSON = useCallback(() => {
    const report = { generated:today.toISOString(), total:changes.length, high_risk:changes.filter(c => c.risk_level === 'High').length, changes:changes.map(c => ({ ...c, category_name:CHANGE_CATEGORIES.find(cc => cc.id === c.category)?.name })) };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'impact_report.json'; a.click();
  }, [changes]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Calendar Data ──────────────────────────────────────────────────────── */
  const calendarData = useMemo(() => {
    const events = [];
    changes.forEach(c => {
      if (c.created_at) events.push({ date:c.created_at, label:`Created: ${c.title}`, risk:c.risk_level, type:'created' });
      if (c.approved_at) events.push({ date:c.approved_at, label:`Approved: ${c.title}`, risk:c.risk_level, type:'approved' });
      if (c.implemented_at) events.push({ date:c.implemented_at, label:`Deployed: ${c.title}`, risk:c.risk_level, type:'implemented' });
    });
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [changes]);

  /* ── Config Snapshot ────────────────────────────────────────────────────── */
  const configSnapshot = useMemo(() => [
    { key:'materiality_threshold', value:'50', module:'ESG Screener' },
    { key:'var_confidence', value:'[95%]', module:'Monte Carlo VaR' },
    { key:'alpha_transition_energy', value:'0.45', module:'Climate Transition Risk' },
    { key:'dmi_weights', value:'trans:0.40, phys:0.35, reg:0.25', module:'DMI Scoring' },
    { key:'approval_sla_days', value:'3', module:'Approval Workflows' },
    { key:'eodhd_cache_ttl', value:'24h', module:'Data Pipeline' },
    { key:'esrs_version', value:'E1 v2024', module:'CSRD iXBRL' },
    { key:'sfdr_pai_version', value:'RTS v2024', module:'SFDR PAI' },
    { key:'pcaf_data_quality_min', value:'3', module:'PCAF India BRSR' },
    { key:'portfolio_rebalance_freq', value:'Monthly', module:'Portfolio Manager' },
  ], []);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>Change Management</h1>
          <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
            <Badge color={T.navy}>8 Categories</Badge><Badge color={T.gold}>Impact Assessment</Badge>
            <Badge color={T.sage}>Rollback</Badge><Badge color={T.navyL}>Version Control</Badge>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={exportCSV} variant="outline" small>Export CSV</Btn>
          <Btn onClick={exportJSON} variant="outline" small>Export JSON</Btn>
          <Btn onClick={handlePrint} variant="outline" small>Print</Btn>
        </div>
      </div>

      {/* ── 2. KPI Cards ───────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:12, marginBottom:24 }}>
        <KpiCard label="Active Changes" value={kpis.active} accent={T.navy} sub="Draft+Submitted+Approved" />
        <KpiCard label="Pending Approval" value={kpis.pending} accent={T.amber} sub="Awaiting review" />
        <KpiCard label="Implemented (30d)" value={kpis.implemented30d} accent={T.green} sub="Last 30 days" />
        <KpiCard label="Rolled Back" value={kpis.rolledBack} accent={T.red} sub="Total reversions" />
        <KpiCard label="High-Risk Changes" value={kpis.highRisk} accent={T.red} sub={`of ${changes.length} total`} />
        <KpiCard label="Avg Impl Time" value={`${kpis.avgImpl}d`} accent={T.navyL} sub="Days to deploy" />
        <KpiCard label="Volume Trend" value={kpis.trend} accent={T.sage} sub="vs. prior month" />
        <KpiCard label="Rollback Rate" value={`${kpis.rollbackRate}%`} accent={kpis.rollbackRate > 10 ? T.red : T.green} sub="Impl that reverted" />
      </div>

      {/* ── 3. Change Request Kanban ───────────────────────────────────────── */}
      <Section title="Change Request Kanban" badge={`${changes.length} requests`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {KANBAN_COLS.map(col => {
            const items = changes.filter(c => c.status === col);
            return (
              <div key={col} style={{ background:T.surfaceH, borderRadius:8, padding:12, minHeight:120 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:KANBAN_COLORS[col] }}>{KANBAN_LABELS[col]}</span>
                  <Badge color={KANBAN_COLORS[col]}>{items.length}</Badge>
                </div>
                {items.length === 0 && <div style={{ fontSize:12, color:T.textMut, textAlign:'center', padding:16 }}>No items</div>}
                {items.map(cr => (
                  <div key={cr.id} onClick={() => setSelectedCR(cr)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 10px', marginBottom:6, cursor:'pointer', borderLeft:`3px solid ${riskColor(cr.risk_level)}`, transition:'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:3 }}>{cr.id}</div>
                    <div style={{ fontSize:11, color:T.textSec, lineHeight:1.3 }}>{cr.title.length > 40 ? cr.title.substring(0, 40) + '...' : cr.title}</div>
                    <div style={{ fontSize:10, color:T.textMut, marginTop:3 }}>{cr.requester}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 4. Change Request Table (Sortable) ─────────────────────────────── */}
      <Section title="All Change Requests" badge={`${filteredChanges.length} shown`}>
        <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            <option value="All">All Categories</option>
            {CHANGE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            <option value="All">All Statuses</option>
            {KANBAN_COLS.map(s => <option key={s} value={s}>{KANBAN_LABELS[s]}</option>)}
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            <option value="All">All Risk Levels</option>
            <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
          <Btn onClick={() => setShowCreateForm(true)} small>+ New Change Request</Btn>
        </div>
        {filteredChanges.length === 0 ? <EmptyState message="No change requests match the current filters." /> : (
          <div style={{ overflowX:'auto', borderRadius:8, border:`1px solid ${T.border}` }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <Th sortKey="id" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>ID</Th>
                  <Th sortKey="title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Title</Th>
                  <Th sortKey="category" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Category</Th>
                  <Th sortKey="risk_level" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Risk</Th>
                  <Th sortKey="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Status</Th>
                  <Th sortKey="requester" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Requester</Th>
                  <Th sortKey="created_at" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Created</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredChanges.map(cr => {
                  const cat = CHANGE_CATEGORIES.find(c => c.id === cr.category);
                  return (
                    <tr key={cr.id} onClick={() => setSelectedCR(cr)} style={{ cursor:'pointer', background:selectedCR?.id === cr.id ? T.surfaceH : T.surface, transition:'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                      onMouseLeave={e => e.currentTarget.style.background = selectedCR?.id === cr.id ? T.surfaceH : T.surface}>
                      <Td style={{ fontWeight:600 }}>{cr.id}</Td>
                      <Td>{cr.title}</Td>
                      <Td><Badge color={riskColor(cat?.risk || 'Medium')}>{cat?.name || cr.category}</Badge></Td>
                      <Td><Badge color={riskColor(cr.risk_level)}>{cr.risk_level}</Badge></Td>
                      <Td><Badge color={KANBAN_COLORS[cr.status]}>{KANBAN_LABELS[cr.status]}</Badge></Td>
                      <Td>{cr.requester}</Td>
                      <Td>{fmtDate(cr.created_at)}</Td>
                      <Td>
                        <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
                          {['draft','submitted','approved'].includes(cr.status) && <Btn onClick={() => advanceStatus(cr.id)} small variant="primary">{cr.status === 'draft' ? 'Submit' : cr.status === 'submitted' ? 'Approve' : 'Deploy'}</Btn>}
                          {cr.status === 'implemented' && cr.rollback_available && <Btn onClick={() => rollbackCR(cr.id)} small variant="danger">Rollback</Btn>}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── 5. Create Change Request Form ──────────────────────────────────── */}
      {showCreateForm && (
        <Section title="Create Change Request">
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Title *</label>
                <input value={newCR.title} onChange={e => setNewCR(p => ({ ...p, title:e.target.value }))} placeholder="Brief description of change" style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Category</label>
                <select value={newCR.category} onChange={e => setNewCR(p => ({ ...p, category:e.target.value }))} style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, background:'#fff' }}>
                  {CHANGE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name} ({c.risk})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Risk Level</label>
                <select value={newCR.risk_level} onChange={e => setNewCR(p => ({ ...p, risk_level:e.target.value }))} style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, background:'#fff' }}>
                  <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Requester</label>
                <input value={newCR.requester} onChange={e => setNewCR(p => ({ ...p, requester:e.target.value }))} placeholder="Team or person" style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Description</label>
                <textarea value={newCR.description} onChange={e => setNewCR(p => ({ ...p, description:e.target.value }))} rows={3} placeholder="Detailed description of the change" style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Before State</label>
                <textarea value={newCR.before_state} onChange={e => setNewCR(p => ({ ...p, before_state:e.target.value }))} rows={2} placeholder="Current configuration / value" style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>After State</label>
                <textarea value={newCR.after_state} onChange={e => setNewCR(p => ({ ...p, after_state:e.target.value }))} rows={2} placeholder="Proposed new value" style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={{ fontSize:12, fontWeight:600, color:T.textSec, display:'block', marginBottom:4 }}>Impact Assessment</label>
                <textarea value={newCR.impact_assessment} onChange={e => setNewCR(p => ({ ...p, impact_assessment:e.target.value }))} rows={2} placeholder="Which modules, data, reports are affected?" style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Btn onClick={handleCreateCR}>Create Draft</Btn>
              <Btn onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Btn>
            </div>
          </div>
        </Section>
      )}

      {/* ── 6. Impact Assessment Panel ─────────────────────────────────────── */}
      <Section title="Impact Assessment" badge={selectedCR ? selectedCR.id : 'Select a CR'}>
        {!selectedCR ? <EmptyState message="Select a change request from the table or Kanban to view its impact assessment." /> : (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
              <div>
                <div style={{ fontSize:12, color:T.textMut, marginBottom:2 }}>Change Request</div>
                <div style={{ fontSize:14, fontWeight:700 }}>{selectedCR.id} - {selectedCR.title}</div>
              </div>
              <div>
                <div style={{ fontSize:12, color:T.textMut, marginBottom:2 }}>Category</div>
                <Badge color={riskColor(selectedCR.risk_level)}>{CHANGE_CATEGORIES.find(c => c.id === selectedCR.category)?.name}</Badge>
              </div>
              <div>
                <div style={{ fontSize:12, color:T.textMut, marginBottom:2 }}>Impact Scope</div>
                <div style={{ fontSize:13 }}>{CHANGE_CATEGORIES.find(c => c.id === selectedCR.category)?.impact_scope}</div>
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Impact Assessment</div>
              <div style={{ fontSize:13, lineHeight:1.5 }}>{selectedCR.impact_assessment || 'No impact assessment provided.'}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Affected Modules</div>
                {(CHANGE_CATEGORIES.find(c => c.id === selectedCR.category)?.impact_scope || '').split('+').map((m, i) => (
                  <div key={i} style={{ fontSize:12, color:T.text, padding:'2px 0' }}>{m.trim()}</div>
                ))}
              </div>
              <div style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Estimated Downstream Impact</div>
                <div style={{ fontSize:12, color:T.text }}>Companies affected: {selectedCR.impact_assessment?.match(/\d+/)?.[0] || 'TBD'}</div>
                <div style={{ fontSize:12, color:T.text }}>Approval required: {CHANGE_CATEGORIES.find(c => c.id === selectedCR.category)?.requires_approval ? 'Yes' : 'No'}</div>
                <div style={{ fontSize:12, color:T.text }}>Risk: <span style={{ color:riskColor(selectedCR.risk_level), fontWeight:600 }}>{selectedCR.risk_level}</span></div>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── 7. Before/After Comparison ─────────────────────────────────────── */}
      <Section title="Before / After Comparison" badge={selectedCR ? selectedCR.id : 'Select a CR'}>
        {!selectedCR ? <EmptyState message="Select a change request to compare before and after states." /> : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'#fef2f2', border:`1px solid ${T.red}30`, borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:18 }}>-</span>
                <span style={{ fontSize:13, fontWeight:700, color:T.red }}>Before State</span>
              </div>
              <pre style={{ fontSize:12, color:T.text, background:'#fff5f5', padding:12, borderRadius:6, whiteSpace:'pre-wrap', margin:0, lineHeight:1.5, fontFamily:'monospace' }}>{selectedCR.before_state || 'Not documented'}</pre>
            </div>
            <div style={{ background:'#f0fdf4', border:`1px solid ${T.green}30`, borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:18 }}>+</span>
                <span style={{ fontSize:13, fontWeight:700, color:T.green }}>After State</span>
              </div>
              <pre style={{ fontSize:12, color:T.text, background:'#f0fdf0', padding:12, borderRadius:6, whiteSpace:'pre-wrap', margin:0, lineHeight:1.5, fontFamily:'monospace' }}>{selectedCR.after_state || 'Not documented'}</pre>
            </div>
          </div>
        )}
      </Section>

      {/* ── 8. Rollback Panel ──────────────────────────────────────────────── */}
      <Section title="Rollback Panel" badge="Implemented changes only">
        {(() => {
          const rollbackable = changes.filter(c => c.status === 'implemented' && c.rollback_available);
          if (rollbackable.length === 0) return <EmptyState message="No implemented changes with rollback available." />;
          return (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {rollbackable.map(cr => (
                <div key={cr.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{cr.id} - {cr.title}</div>
                  <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>Deployed: {fmtDate(cr.implemented_at)}</div>
                  <div style={{ fontSize:11, color:T.textMut, marginBottom:8 }}>Will restore: {cr.before_state?.substring(0, 60) || 'previous state'}...</div>
                  <Btn onClick={() => rollbackCR(cr.id)} small variant="danger">Rollback to Previous</Btn>
                </div>
              ))}
            </div>
          );
        })()}
      </Section>

      {/* ── 9. Change Calendar ─────────────────────────────────────────────── */}
      <Section title="Change Calendar" badge={`${calendarData.length} events`}>
        {calendarData.length === 0 ? <EmptyState message="No change events recorded." /> : (
          <div style={{ maxHeight:320, overflowY:'auto', background:T.surface, border:`1px solid ${T.border}`, borderRadius:8 }}>
            {calendarData.slice(0, 30).map((ev, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:`1px solid ${T.border}` }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:riskColor(ev.risk), flexShrink:0 }} />
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, minWidth:80 }}>{fmtDate(ev.date)}</div>
                <Badge color={ev.type === 'created' ? T.textMut : ev.type === 'approved' ? T.gold : T.green}>{ev.type}</Badge>
                <div style={{ fontSize:12, color:T.text, flex:1 }}>{ev.label}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── 10 & 11. Charts Row ────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20, marginBottom:28 }}>
        {/* 10. Risk Distribution Pie */}
        <Section title="Risk Distribution">
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {riskPieData.map((_, i) => <Cell key={i} fill={riskPieColors[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* 11. Category Trend */}
        <Section title="Category Trend by Month">
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            {categoryTrendData.length === 0 ? <EmptyState message="No trend data available." /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  {catNames.map((name, i) => <Bar key={name} dataKey={name} stackId="a" fill={COLORS[i % COLORS.length]} />)}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      {/* ── 12. Platform Version History ───────────────────────────────────── */}
      <Section title="Platform Version History" badge={`v${VERSION_HISTORY[VERSION_HISTORY.length - 1].version}`}>
        <div style={{ overflowX:'auto', borderRadius:8, border:`1px solid ${T.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Version','Sprint','Date','Description'].map(h => <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, background:T.surfaceH }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {VERSION_HISTORY.map((v, i) => (
                <tr key={v.version} style={{ background:i === VERSION_HISTORY.length - 1 ? `${T.gold}10` : T.surface }}>
                  <Td style={{ fontWeight:700 }}>v{v.version}</Td>
                  <Td><Badge color={i === VERSION_HISTORY.length - 1 ? T.gold : T.navy}>{v.sprint}</Badge></Td>
                  <Td>{fmtDate(v.date)}</Td>
                  <Td>{v.description}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 13. Configuration Snapshot ─────────────────────────────────────── */}
      <Section title="Configuration Snapshot" badge="Current state">
        <div style={{ overflowX:'auto', borderRadius:8, border:`1px solid ${T.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Config Key','Current Value','Module'].map(h => <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, background:T.surfaceH }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {configSnapshot.map(cfg => (
                <tr key={cfg.key}>
                  <Td style={{ fontFamily:'monospace', fontSize:12 }}>{cfg.key}</Td>
                  <Td style={{ fontFamily:'monospace', fontWeight:600, fontSize:12 }}>{cfg.value}</Td>
                  <Td>{cfg.module}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 14. Cross-Navigation ───────────────────────────────────────────── */}
      <Section title="Related Modules">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { label:'Governance Hub', path:'/governance-hub' },
            { label:'Audit Trail', path:'/audit-trail' },
            { label:'Model Governance', path:'/model-governance' },
            { label:'Approval Workflows', path:'/approval-workflows' },
            { label:'Compliance Evidence', path:'/compliance-evidence' },
            { label:'Data Governance', path:'/data-governance' },
          ].map(link => (
            <Btn key={link.path} onClick={() => navigate(link.path)} variant="outline" small>{link.label}</Btn>
          ))}
        </div>
      </Section>
    </div>
  );
}
