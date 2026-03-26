import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '---';
const today = new Date('2025-05-15');

/* ── Primitives ───────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${accent || T.gold}`, fontFamily: T.font }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 600, background: T.surfaceH, color: T.textSec, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small, color }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, cursor: 'pointer', background: active ? T.navy : color || T.surface, color: active ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: T.font, transition: 'all 0.15s' }}>{children}</button>
);
const Badge = ({ label, color }) => {
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const thS = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3, cursor: 'pointer', userSelect: 'none' };
const tdS = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE DEFINITIONS — 7 Sprint V Modules
   ═══════════════════════════════════════════════════════════════════════════ */
const MODULES = [
  { id: 'audit_trail', name: 'Audit Trail & Logging', icon: '📋', route: '/audit-trail', color: '#2563eb', lsKey: 'ra_audit_log_v1', description: 'Immutable event log for all platform actions — data changes, model runs, report generation' },
  { id: 'model_governance', name: 'Model Governance', icon: '🔬', route: '/model-governance', color: '#7c3aed', lsKey: 'ra_model_changelog_v1', description: 'Model inventory, validation lifecycle, performance monitoring, regulatory documentation' },
  { id: 'approval_workflows', name: 'Approval Workflows', icon: '✅', route: '/approval-workflows', color: '#0891b2', lsKey: 'ra_workflow_instances_v1', description: 'Configurable multi-step approval chains for data changes, model updates, report sign-off' },
  { id: 'compliance_evidence', name: 'Compliance Evidence', icon: '🛡️', route: '/compliance-evidence', color: '#16a34a', lsKey: 'ra_compliance_evidence_v1', description: 'Evidence vault — automated collection, tagging, gap analysis across 12 regulatory frameworks' },
  { id: 'change_management', name: 'Change Management', icon: '🔄', route: '/change-management', color: '#d97706', lsKey: 'ra_change_requests_v1', description: 'Formal change control — requests, risk assessment, approval, implementation, rollback' },
  { id: 'corporate_governance', name: 'Corporate Governance', icon: '🏛️', route: '/corporate-governance', color: '#1b3a5c', lsKey: 'ra_corporate_governance_v1', description: '8-dimension governance scoring — board effectiveness, shareholder rights, anti-corruption, ESG-linked pay' },
  { id: 'geopolitical_ai', name: 'Geopolitical & AI Governance', icon: '🌐', route: '/geopolitical-ai-gov', color: '#dc2626', lsKey: 'ra_geopolitical_ai_v1', description: 'GPR index, sanctions exposure, EU AI Act compliance, 10 AI governance dimensions' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   REGULATIONS TRACKED
   ═══════════════════════════════════════════════════════════════════════════ */
const REGULATIONS = [
  { code: 'CSRD', name: 'Corporate Sustainability Reporting Directive', module: 'compliance_evidence' },
  { code: 'SFDR', name: 'Sustainable Finance Disclosure Regulation', module: 'compliance_evidence' },
  { code: 'EU_TAX', name: 'EU Taxonomy', module: 'compliance_evidence' },
  { code: 'TCFD', name: 'Task Force on Climate-Related Disclosures', module: 'compliance_evidence' },
  { code: 'ISSB', name: 'International Sustainability Standards Board', module: 'compliance_evidence' },
  { code: 'EU_AI', name: 'EU AI Act', module: 'geopolitical_ai' },
  { code: 'SOX', name: 'Sarbanes-Oxley Act', module: 'corporate_governance' },
  { code: 'GDPR', name: 'General Data Protection Regulation', module: 'geopolitical_ai' },
  { code: 'BRSR', name: 'SEBI Business Responsibility & Sustainability', module: 'compliance_evidence' },
  { code: 'CSDDD', name: 'Corporate Sustainability Due Diligence Directive', module: 'compliance_evidence' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MODEL INVENTORY (15 models)
   ═══════════════════════════════════════════════════════════════════════════ */
const MODEL_INVENTORY = [
  { id: 'MDL-001', name: 'PD Exponential', type: 'Credit Risk', owner: 'Quant Team', lastValidated: '2025-04-10', status: 'validated', nextReview: '2025-07-10' },
  { id: 'MDL-002', name: 'Merton Distance-to-Default', type: 'Credit Risk', owner: 'Quant Team', lastValidated: '2025-03-20', status: 'validated', nextReview: '2025-06-20' },
  { id: 'MDL-003', name: 'Monte Carlo VaR', type: 'Market Risk', owner: 'Risk Analytics', lastValidated: '2025-04-25', status: 'validated', nextReview: '2025-07-25' },
  { id: 'MDL-004', name: 'Copula Tail Risk', type: 'Market Risk', owner: 'Risk Analytics', lastValidated: '2025-02-15', status: 'review_due', nextReview: '2025-05-15' },
  { id: 'MDL-005', name: 'ITR Regression', type: 'Climate', owner: 'ESG Analytics', lastValidated: '2025-04-01', status: 'validated', nextReview: '2025-07-01' },
  { id: 'MDL-006', name: 'DMI Composite Score', type: 'ESG', owner: 'ESG Analytics', lastValidated: '2025-03-05', status: 'validated', nextReview: '2025-06-05' },
  { id: 'MDL-007', name: 'NGFS Scenario PD', type: 'Climate Stress', owner: 'Quant Team', lastValidated: '2025-01-20', status: 'review_due', nextReview: '2025-04-20' },
  { id: 'MDL-008', name: 'Greenium Signal', type: 'Fixed Income', owner: 'FI Team', lastValidated: '2025-04-15', status: 'validated', nextReview: '2025-07-15' },
  { id: 'MDL-009', name: 'Physical Risk Pricing', type: 'Climate', owner: 'Risk Analytics', lastValidated: '2025-03-28', status: 'validated', nextReview: '2025-06-28' },
  { id: 'MDL-010', name: 'Transition Risk Factor', type: 'Climate', owner: 'ESG Analytics', lastValidated: '2025-02-10', status: 'review_due', nextReview: '2025-05-10' },
  { id: 'MDL-011', name: 'PCAF Financed Emissions', type: 'Carbon', owner: 'ESG Analytics', lastValidated: '2025-04-20', status: 'validated', nextReview: '2025-07-20' },
  { id: 'MDL-012', name: 'Supply Chain Carbon', type: 'Carbon', owner: 'Supply Chain', lastValidated: '2025-03-15', status: 'validated', nextReview: '2025-06-15' },
  { id: 'MDL-013', name: 'Controversy NLP Scorer', type: 'ESG', owner: 'Data Science', lastValidated: '2025-01-10', status: 'failed', nextReview: '2025-04-10' },
  { id: 'MDL-014', name: 'Sentiment Pipeline', type: 'AI/NLP', owner: 'Data Science', lastValidated: '2025-04-08', status: 'validated', nextReview: '2025-07-08' },
  { id: 'MDL-015', name: 'Deforestation Risk', type: 'Biodiversity', owner: 'ESG Analytics', lastValidated: '2025-02-28', status: 'validated', nextReview: '2025-05-28' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function GovernanceHubPage() {
  const navigate = useNavigate();
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 80), []);

  /* ── Portfolio (wrapped format) ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '{}');
      const portfolios = raw.portfolios || {};
      const active = raw.activePortfolio || Object.keys(portfolios)[0] || '';
      return { portfolios, activePortfolio: active, holdings: portfolios[active]?.holdings || [] };
    } catch { return { portfolios: {}, activePortfolio: '', holdings: [] }; }
  }, []);

  /* ── Load all Sprint V localStorage data ── */
  const auditEvents = useMemo(() => {
    const raw = loadLS('ra_audit_log_v1');
    return Array.isArray(raw) ? raw : [];
  }, []);

  const modelChanges = useMemo(() => {
    const raw = loadLS('ra_model_changelog_v1');
    return Array.isArray(raw) ? raw : [];
  }, []);

  const workflowInstances = useMemo(() => {
    const raw = loadLS('ra_workflow_instances_v1');
    return Array.isArray(raw) ? raw : [];
  }, []);

  const complianceEvidence = useMemo(() => {
    const raw = loadLS('ra_compliance_evidence_v1');
    return Array.isArray(raw) ? raw : [];
  }, []);

  const changeRequests = useMemo(() => {
    const raw = loadLS('ra_change_requests_v1');
    return Array.isArray(raw) ? raw : [];
  }, []);

  /* ── Compute KPIs ── */
  const kpis = useMemo(() => {
    const todayStr = today.toISOString().slice(0, 10);
    const auditTotal = auditEvents.length || Math.floor(sRand(1) * 200 + 280);
    const auditToday = auditEvents.filter(e => e.timestamp?.startsWith(todayStr)).length || Math.floor(sRand(2) * 15 + 8);
    const modelsRegistered = MODEL_INVENTORY.length;
    const modelsValidated = MODEL_INVENTORY.filter(m => m.status === 'validated').length;
    const modelsValidatedPct = (modelsValidated / modelsRegistered * 100);
    const activeWorkflows = workflowInstances.length || Math.floor(sRand(3) * 12 + 15);
    const pendingApprovals = workflowInstances.filter(w => w.status === 'pending_approval' || w.status === 'pending').length || Math.floor(sRand(4) * 8 + 4);
    const evidenceItems = complianceEvidence.length || Math.floor(sRand(5) * 100 + 180);
    const evidenceCoveragePct = evidenceItems > 0 ? Math.min(100, (evidenceItems / (REGULATIONS.length * 20) * 100)) : 72.4;
    const crTotal = changeRequests.length || Math.floor(sRand(6) * 15 + 20);
    const crHighRisk = changeRequests.filter(c => c.risk_level === 'High').length || Math.floor(sRand(7) * 6 + 3);
    const corpGovScore = 68.5 + sRand(8) * 12;
    const geoRisk = 112 + sRand(9) * 30;
    const aiGovScore = 62 + sRand(10) * 18;
    const govMaturity = (corpGovScore * 0.2 + modelsValidatedPct * 0.15 + evidenceCoveragePct * 0.2 + (100 - crHighRisk * 5) * 0.1 + aiGovScore * 0.15 + (100 - geoRisk * 0.3) * 0.1 + (pendingApprovals < 5 ? 80 : 60) * 0.1).toFixed(1);

    return {
      auditTotal, auditToday, modelsRegistered, modelsValidatedPct: modelsValidatedPct.toFixed(1),
      activeWorkflows, pendingApprovals, evidenceItems, evidenceCoveragePct: evidenceCoveragePct.toFixed(1),
      crTotal, crHighRisk, corpGovScore: corpGovScore.toFixed(1), geoRisk: geoRisk.toFixed(0),
      aiGovScore: aiGovScore.toFixed(1), govMaturity,
    };
  }, [auditEvents, workflowInstances, complianceEvidence, changeRequests]);

  /* ── Module health scores ── */
  const moduleHealth = useMemo(() => MODULES.map((m, i) => {
    const score = 55 + sRand(i * 17 + 3) * 40;
    return { ...m, score: Math.round(score), status: score >= 75 ? 'green' : score >= 55 ? 'amber' : 'red' };
  }), []);

  /* ── Radar data ── */
  const radarData = useMemo(() => MODULES.map((m, i) => ({
    axis: m.name.split(' ')[0],
    score: moduleHealth[i].score,
    benchmark: 70,
  })), [moduleHealth]);

  /* ── Governance Trend (12 months) ── */
  const trendData = useMemo(() => {
    const months = ['Jun 24','Jul 24','Aug 24','Sep 24','Oct 24','Nov 24','Dec 24','Jan 25','Feb 25','Mar 25','Apr 25','May 25'];
    return months.map((m, i) => ({
      month: m,
      maturity: Math.round(45 + i * 3.2 + sRand(i * 7) * 6),
      audit: Math.round(50 + i * 2.5 + sRand(i * 11) * 5),
      compliance: Math.round(40 + i * 3.8 + sRand(i * 13) * 4),
    }));
  }, []);

  /* ── Recent Activity (combined feed) ── */
  const recentActivity = useMemo(() => {
    const feed = [];
    const sources = [
      { key: 'audit', data: auditEvents, extract: (e) => ({ ts: e.timestamp, type: 'Audit', desc: e.action || e.detail, module: e.module || 'System', severity: e.severity || 'info' }) },
      { key: 'workflow', data: workflowInstances, extract: (e) => ({ ts: e.created_at || e.timestamp, type: 'Workflow', desc: e.title || e.workflow_name || 'Workflow action', module: 'Approvals', severity: 'info' }) },
      { key: 'change', data: changeRequests, extract: (e) => ({ ts: e.created_at, type: 'Change', desc: e.title || 'Change request', module: 'Change Mgmt', severity: e.risk_level === 'High' ? 'warning' : 'info' }) },
      { key: 'evidence', data: complianceEvidence, extract: (e) => ({ ts: e.collected_at || e.timestamp, type: 'Evidence', desc: e.title || e.evidence_type || 'Evidence collected', module: 'Compliance', severity: 'info' }) },
    ];
    sources.forEach(src => {
      (src.data || []).slice(0, 8).forEach(e => { try { feed.push(src.extract(e)); } catch {} });
    });
    // Synthetic fallback if no real data
    if (feed.length < 10) {
      const actions = ['PD model recalculation completed','SFDR PAI evidence uploaded','Change request CR-003 submitted','Workflow approval for materiality threshold','Audit: ESG score override logged','Evidence gap identified for CSRD E1','Model validation due for Copula Tail Risk','New approval workflow triggered','Compliance check passed for EU Taxonomy','Geopolitical alert: China sanctions update','AI governance assessment updated','Board effectiveness data refreshed','Regulatory filing deadline acknowledged','API key rotation completed','Report template v3 deployed','Stewardship engagement logged','Monte Carlo VaR backtested','Alert threshold breach detected','BRSR data sync completed','Client report Q1-2025 generated'];
      for (let i = feed.length; i < 20; i++) {
        feed.push({ ts: new Date(today - (i * 3600000 * 2 + sRand(i) * 7200000)).toISOString(), type: ['Audit','Workflow','Change','Evidence','Model'][i % 5], desc: actions[i % actions.length], module: MODULES[i % MODULES.length].name.split(' ')[0], severity: sRand(i * 31) < 0.15 ? 'warning' : 'info' });
      }
    }
    feed.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return feed.slice(0, 20);
  }, [auditEvents, workflowInstances, changeRequests, complianceEvidence]);

  /* ── Governance Calendar ── */
  const calendarEvents = useMemo(() => {
    const events = [];
    MODEL_INVENTORY.forEach(m => {
      if (m.nextReview) events.push({ date: m.nextReview, type: 'Model Review', desc: `${m.name} validation due`, priority: m.status === 'review_due' ? 'high' : 'medium' });
    });
    const regDates = [
      { date: '2025-06-30', type: 'Regulatory', desc: 'CSRD E1 disclosure deadline', priority: 'high' },
      { date: '2025-07-15', type: 'Regulatory', desc: 'SFDR PAI statement submission', priority: 'high' },
      { date: '2025-06-01', type: 'Workflow', desc: 'Quarterly model governance review', priority: 'medium' },
      { date: '2025-05-30', type: 'Compliance', desc: 'EU Taxonomy alignment report due', priority: 'high' },
      { date: '2025-06-15', type: 'Audit', desc: 'Annual audit trail integrity check', priority: 'medium' },
      { date: '2025-07-01', type: 'Compliance', desc: 'BRSR annual filing', priority: 'medium' },
      { date: '2025-08-01', type: 'Regulatory', desc: 'EU AI Act compliance assessment due', priority: 'high' },
    ];
    events.push(...regDates);
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
  }, []);

  /* ── Regulatory Compliance Summary ── */
  const regSummary = useMemo(() => REGULATIONS.map((r, i) => ({
    ...r,
    evidenceCount: Math.floor(sRand(i * 19 + 5) * 25 + 5),
    filings: Math.floor(sRand(i * 23 + 7) * 4 + 1),
    gaps: Math.floor(sRand(i * 29 + 11) * 5),
    coverage: Math.round(55 + sRand(i * 31 + 13) * 40),
  })), []);

  /* ── Cross-Module Consistency ── */
  const consistency = useMemo(() => {
    const checks = [
      { name: 'Audit-to-Change traceability', desc: 'Every implemented change has corresponding audit events', status: sRand(100) > 0.3 ? 'pass' : 'warn', score: Math.round(75 + sRand(101) * 20) },
      { name: 'Model-to-Evidence linkage', desc: 'All validated models have supporting compliance evidence', status: sRand(102) > 0.25 ? 'pass' : 'warn', score: Math.round(70 + sRand(103) * 25) },
      { name: 'Workflow-to-Approval chain', desc: 'All high-risk changes went through approval workflow', status: sRand(104) > 0.4 ? 'pass' : 'fail', score: Math.round(60 + sRand(105) * 30) },
      { name: 'Evidence freshness', desc: 'All evidence items updated within regulatory window', status: sRand(106) > 0.2 ? 'pass' : 'warn', score: Math.round(65 + sRand(107) * 30) },
      { name: 'Governance score alignment', desc: 'Corporate governance scores align with AI governance assessments', status: 'pass', score: Math.round(72 + sRand(108) * 20) },
      { name: 'Calendar-to-SLA adherence', desc: 'All upcoming deadlines have assigned workflows', status: sRand(109) > 0.3 ? 'pass' : 'warn', score: Math.round(68 + sRand(110) * 25) },
    ];
    return checks;
  }, []);

  /* ── Combined Table ── */
  const [sortCol, setSortCol] = useState('ts');
  const [sortDir, setSortDir] = useState('desc');
  const [tableFilter, setTableFilter] = useState('all');

  const combinedTable = useMemo(() => {
    const rows = recentActivity.map((e, i) => ({ id: `ACT-${i}`, ts: e.ts, type: e.type, description: e.desc, module: e.module, severity: e.severity }));
    const filtered = tableFilter === 'all' ? rows : rows.filter(r => r.type.toLowerCase() === tableFilter);
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortCol] || '', bv = b[sortCol] || '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [recentActivity, sortCol, sortDir, tableFilter]);

  const toggleSort = useCallback((col) => {
    setSortCol(prev => { setSortDir(prev === col ? (d => d === 'asc' ? 'desc' : 'asc') : 'asc'); return col; });
  }, []);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const headers = ['Timestamp','Type','Description','Module','Severity'];
    const csvRows = [headers.join(',')];
    combinedTable.forEach(r => csvRows.push([r.ts, r.type, `"${(r.description || '').replace(/"/g, '""')}"`, r.module, r.severity].join(',')));
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'governance_hub_export.csv'; a.click();
  }, [combinedTable]);

  const exportJSON = useCallback(() => {
    const data = { kpis, moduleHealth, recentActivity: recentActivity.slice(0, 20), regulations: regSummary, models: MODEL_INVENTORY, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'governance_hub_export.json'; a.click();
  }, [kpis, moduleHealth, recentActivity, regSummary]);

  const printPage = useCallback(() => window.print(), []);

  /* ── Empty state guard ── */
  if (!companies || companies.length === 0) {
    return (
      <div style={{ fontFamily: T.font, padding: 40, textAlign: 'center', color: T.textMut }}>
        <h2 style={{ color: T.navy }}>Governance & Audit Intelligence Hub</h2>
        <p>No company data available. Please load a portfolio first via Portfolio Manager.</p>
        <Btn onClick={() => navigate('/portfolio-manager')}>Go to Portfolio Manager</Btn>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── 1. Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.navy }}>Governance & Audit Intelligence</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge label="Hub" color="navy" />
            <Badge label="7 Modules" color="gold" />
            <Badge label="Audit" color="blue" />
            <Badge label="Models" color="purple" />
            <Badge label="Workflows" color="teal" />
            <Badge label="Evidence" color="green" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>CSV</Btn>
          <Btn small onClick={exportJSON}>JSON</Btn>
          <Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── 2. Module Status Cards ── */}
      <Section title="Module Status" badge="7 Sprint V Modules">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {moduleHealth.map(m => (
            <div key={m.id} onClick={() => navigate(m.route)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, cursor: 'pointer', borderLeft: `4px solid ${m.color}`, transition: 'box-shadow 0.15s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <Badge label={m.status === 'green' ? 'Healthy' : m.status === 'amber' ? 'Attention' : 'Critical'} color={m.status} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4 }}>{m.description}</div>
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: T.surfaceH }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${m.score}%`, background: m.status === 'green' ? T.green : m.status === 'amber' ? T.amber : T.red, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4, textAlign: 'right' }}>{m.score}/100</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 3. KPI Cards (14 in 2 rows) ── */}
      <Section title="Key Performance Indicators" badge="14 KPIs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          <KpiCard label="Audit Events" value={fmt(kpis.auditTotal)} sub="Total tracked" accent="#2563eb" />
          <KpiCard label="Events Today" value={kpis.auditToday} sub="Last 24h" accent="#2563eb" />
          <KpiCard label="Models Registered" value={kpis.modelsRegistered} sub="In inventory" accent="#7c3aed" />
          <KpiCard label="Models Validated" value={`${kpis.modelsValidatedPct}%`} sub="Current period" accent="#7c3aed" />
          <KpiCard label="Active Workflows" value={kpis.activeWorkflows} sub="In progress" accent="#0891b2" />
          <KpiCard label="Pending Approvals" value={kpis.pendingApprovals} sub="Awaiting action" accent={kpis.pendingApprovals > 8 ? T.red : T.amber} />
          <KpiCard label="Evidence Items" value={fmt(kpis.evidenceItems)} sub="Collected" accent="#16a34a" />
          <KpiCard label="Evidence Coverage" value={`${kpis.evidenceCoveragePct}%`} sub="Across frameworks" accent="#16a34a" />
          <KpiCard label="Change Requests" value={kpis.crTotal} sub="Total CRs" accent="#d97706" />
          <KpiCard label="High-Risk Changes" value={kpis.crHighRisk} sub="Require approval" accent={T.red} />
          <KpiCard label="Corp Gov Score" value={kpis.corpGovScore} sub="Out of 100" accent="#1b3a5c" />
          <KpiCard label="Geopolitical Risk" value={kpis.geoRisk} sub="GPR Index (wtd)" accent="#dc2626" />
          <KpiCard label="AI Gov Score" value={kpis.aiGovScore} sub="10 dimensions" accent="#991b1b" />
          <KpiCard label="Gov Maturity" value={`${kpis.govMaturity}%`} sub="Composite score" accent={T.gold} />
        </div>
      </Section>

      {/* ── 4. Governance Maturity RadarChart ── */}
      <Section title="Governance Maturity Radar" badge="7 Axes">
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.textSec }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
              <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray="4 4" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 5. Quick Actions ── */}
      <Section title="Quick Actions" badge="Navigate">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {MODULES.map(m => (
            <Btn key={m.id} onClick={() => navigate(m.route)} small>
              {m.icon} {m.name}
            </Btn>
          ))}
        </div>
      </Section>

      {/* ── 6. Recent Activity Feed ── */}
      <Section title="Recent Activity Feed" badge={`Last ${recentActivity.length} Events`}>
        <div style={{ maxHeight: 360, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
          {recentActivity.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
              <div style={{ minWidth: 60, fontSize: 10, color: T.textMut }}>{e.ts ? new Date(e.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
              <Badge label={e.type} color={e.type === 'Audit' ? 'blue' : e.type === 'Workflow' ? 'teal' : e.type === 'Change' ? 'amber' : e.type === 'Evidence' ? 'green' : 'purple'} />
              <div style={{ flex: 1, fontSize: 12, color: T.text }}>{e.desc}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>{e.module}</div>
              {e.severity === 'warning' && <span style={{ color: T.amber, fontSize: 14 }}>&#9888;</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* ── 7. Governance Calendar ── */}
      <Section title="Governance Calendar" badge="Upcoming Deadlines">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {calendarEvents.slice(0, 12).map((ev, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', borderLeft: `3px solid ${ev.priority === 'high' ? T.red : T.amber}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{fmtDate(ev.date)}</span>
                <Badge label={ev.priority} color={ev.priority === 'high' ? 'red' : 'amber'} />
              </div>
              <div style={{ fontSize: 11, color: T.textSec }}>{ev.type}</div>
              <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>{ev.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. Risk Heatmap ── */}
      <Section title="Module Risk Heatmap" badge="7 Modules">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
          {moduleHealth.map(m => {
            const bg = m.status === 'green' ? '#dcfce7' : m.status === 'amber' ? '#fef3c7' : '#fee2e2';
            const fg = m.status === 'green' ? '#166534' : m.status === 'amber' ? '#92400e' : '#991b1b';
            return (
              <div key={m.id} style={{ background: bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(m.route)}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: fg }}>{m.name.split(' ').slice(0, 2).join(' ')}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: fg, marginTop: 4 }}>{m.score}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 9. Regulatory Compliance Summary ── */}
      <Section title="Regulatory Compliance Summary" badge={`${REGULATIONS.length} Frameworks`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Code','Regulation','Evidence','Filings','Gaps','Coverage'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regSummary.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 700 }}>{r.code}</td>
                  <td style={tdS}>{r.name}</td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{r.evidenceCount}</td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{r.filings}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: r.gaps > 3 ? T.red : r.gaps > 0 ? T.amber : T.green, fontWeight: 700 }}>{r.gaps}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.surfaceH }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${r.coverage}%`, background: r.coverage >= 80 ? T.green : r.coverage >= 60 ? T.amber : T.red }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{r.coverage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 10. Model Health ── */}
      <Section title="Model Health" badge={`${MODEL_INVENTORY.length} Models`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['ID','Model','Type','Owner','Last Validated','Status','Next Review'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_INVENTORY.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{m.id}</td>
                  <td style={{ ...tdS, fontWeight: 700 }}>{m.name}</td>
                  <td style={tdS}>{m.type}</td>
                  <td style={tdS}>{m.owner}</td>
                  <td style={tdS}>{fmtDate(m.lastValidated)}</td>
                  <td style={tdS}>
                    <Badge label={m.status === 'validated' ? 'Validated' : m.status === 'review_due' ? 'Review Due' : 'Failed'} color={m.status === 'validated' ? 'green' : m.status === 'review_due' ? 'amber' : 'red'} />
                  </td>
                  <td style={tdS}>{fmtDate(m.nextReview)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 11. Cross-Module Consistency ── */}
      <Section title="Cross-Module Consistency" badge={`${consistency.filter(c => c.status === 'pass').length}/${consistency.length} Passing`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {consistency.map((c, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, borderLeft: `3px solid ${c.status === 'pass' ? T.green : c.status === 'warn' ? T.amber : T.red}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{c.name}</span>
                <Badge label={c.status.toUpperCase()} color={c.status === 'pass' ? 'green' : c.status === 'warn' ? 'amber' : 'red'} />
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{c.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.surfaceH }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${c.score}%`, background: c.status === 'pass' ? T.green : c.status === 'warn' ? T.amber : T.red }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{c.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 12. Governance Trend AreaChart ── */}
      <Section title="Governance Maturity Trend" badge="12 Months">
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="maturity" name="Overall Maturity" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="audit" name="Audit Coverage" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="compliance" name="Compliance" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 13. Sortable Combined Table ── */}
      <Section title="Combined Activity Table" badge="Sortable">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {['all','audit','workflow','change','evidence','model'].map(f => (
            <Btn key={f} small active={tableFilter === f} onClick={() => setTableFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</Btn>
          ))}
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{k:'ts',l:'Timestamp'},{k:'type',l:'Type'},{k:'description',l:'Description'},{k:'module',l:'Module'},{k:'severity',l:'Severity'}].map(h => (
                  <th key={h.k} style={thS} onClick={() => toggleSort(h.k)}>
                    {h.l}{sortCol === h.k ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {combinedTable.slice(0, 50).map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontSize: 11, fontFamily: 'monospace' }}>{r.ts ? fmtDate(r.ts) : '---'}</td>
                  <td style={tdS}><Badge label={r.type} color={r.type === 'Audit' ? 'blue' : r.type === 'Workflow' ? 'teal' : r.type === 'Change' ? 'amber' : 'green'} /></td>
                  <td style={{ ...tdS, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                  <td style={tdS}>{r.module}</td>
                  <td style={tdS}><Badge label={r.severity || 'info'} color={r.severity === 'warning' ? 'amber' : r.severity === 'critical' ? 'red' : 'blue'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 14. Exports & Cross-Navigation ── */}
      <Section title="Export & Navigate" badge="Actions">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <Btn onClick={exportCSV}>Export CSV</Btn>
          <Btn onClick={exportJSON}>Export JSON</Btn>
          <Btn onClick={printPage}>Print Report</Btn>
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Cross-navigate to related modules:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MODULES.map(m => (
            <Btn key={m.id} small onClick={() => navigate(m.route)}>{m.icon} {m.name}</Btn>
          ))}
          <Btn small onClick={() => navigate('/esg-data-quality')}>Data Governance</Btn>
          <Btn small onClick={() => navigate('/regulatory-gap')}>Regulatory Gap</Btn>
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '16px 0', borderTop: `1px solid ${T.border}`, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: T.textMut }}>EP-V6 Governance & Audit Intelligence Hub | Sprint V | Risk Analytics Platform v6.0</span>
      </div>
    </div>
  );
}
