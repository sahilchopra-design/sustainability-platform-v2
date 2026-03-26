import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_VALIDATION = 'ra_validation_rules_v1';
const LS_RECON = 'ra_reconciliation_config_v1';
const LS_SNAPSHOTS = 'ra_data_snapshots_v1';
const LS_ETL = 'ra_etl_schedule_v1';
const LS_VENDOR = 'ra_vendor_assessments_v1';
const LS_KEY = 'ep_s6_dme_hub_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const fmtM = (n) => typeof n === 'number' ? (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n)) : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const today = new Date('2025-05-15');

/* ═══════════════════════════════════════════════════════════════════════════
   DME MODULE DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════════ */
const DME_MODULES = [
  { id:'data-validation', name:'Data Validation Engine', desc:'Rule-based data quality validation', path:'/data-validation', icon:'VAL', color:T.navy },
  { id:'data-reconciliation', name:'Multi-Source Reconciliation', desc:'Cross-source data matching & conflict resolution', path:'/data-reconciliation', icon:'REC', color:T.gold },
  { id:'data-versioning', name:'Data Versioning & Snapshots', desc:'Point-in-time snapshots and change tracking', path:'/data-versioning', icon:'VER', color:T.sage },
  { id:'etl-pipeline', name:'ETL Pipeline Orchestrator', desc:'Automated data ingestion, transformation, loading', path:'/etl-pipeline', icon:'ETL', color:'#4f46e5' },
  { id:'data-governance', name:'Data Governance & Policy', desc:'Governance policies, ownership, access controls', path:'/data-governance', icon:'GOV', color:'#0891b2' },
];

/* ── Synthetic Module Health ─────────────────────────────────────────────── */
const MODULE_HEALTH = [
  { module:'Validation', status:'healthy', score:94, lastRun:'2025-05-15 08:30', issues:2, critical:0, rulesActive:48, rulesPassing:45 },
  { module:'Reconciliation', status:'healthy', score:91, lastRun:'2025-05-15 06:00', issues:3, critical:0, sourcesActive:6, conflictsOpen:4 },
  { module:'Versioning', status:'healthy', score:97, lastRun:'2025-05-14 23:00', issues:0, critical:0, snapshotsStored:24, storageUsedMB:128 },
  { module:'ETL Pipeline', status:'warning', score:85, lastRun:'2025-05-15 07:45', issues:2, critical:1, pipelinesActive:8, avgDurationMin:12 },
  { module:'Governance', status:'healthy', score:92, lastRun:'2025-05-15 09:00', issues:1, critical:0, policiesActive:15, complianceRate:92 },
];

/* ── Quality Trend Data ──────────────────────────────────────────────────── */
const QUALITY_TREND = [
  { month:'Sep 24', overall:78, validation:80, reconciliation:72, versioning:85, etl:75, governance:72, target:85 },
  { month:'Oct 24', overall:80, validation:82, reconciliation:75, versioning:87, etl:77, governance:75, target:85 },
  { month:'Nov 24', overall:82, validation:84, reconciliation:78, versioning:88, etl:79, governance:78, target:85 },
  { month:'Dec 24', overall:84, validation:86, reconciliation:80, versioning:90, etl:81, governance:81, target:88 },
  { month:'Jan 25', overall:86, validation:88, reconciliation:83, versioning:92, etl:83, governance:84, target:88 },
  { month:'Feb 25', overall:88, validation:90, reconciliation:86, versioning:94, etl:85, governance:87, target:90 },
  { month:'Mar 25', overall:90, validation:92, reconciliation:88, versioning:95, etl:86, governance:89, target:90 },
  { month:'Apr 25', overall:91, validation:93, reconciliation:90, versioning:96, etl:85, governance:91, target:92 },
  { month:'May 25', overall:92, validation:94, reconciliation:91, versioning:97, etl:85, governance:92, target:92 },
];

/* ── ETL Pipeline Status ─────────────────────────────────────────────────── */
const ETL_PIPELINES = [
  { id:'PL01', name:'EODHD Market Data', source:'EODHD API', schedule:'Daily 06:00', lastRun:'2025-05-15 06:15', status:'success', duration:8, records:1250, errors:0 },
  { id:'PL02', name:'BRSR Filings', source:'SEBI/BSE', schedule:'Weekly Mon', lastRun:'2025-05-12 07:00', status:'success', duration:22, records:480, errors:3 },
  { id:'PL03', name:'World Bank Indicators', source:'WB API', schedule:'Monthly 1st', lastRun:'2025-05-01 04:00', status:'success', duration:15, records:890, errors:0 },
  { id:'PL04', name:'Bond Universe (CBI)', source:'CBI API', schedule:'Weekly Wed', lastRun:'2025-05-14 05:30', status:'success', duration:11, records:320, errors:1 },
  { id:'PL05', name:'ND-GAIN Sovereign', source:'ND-GAIN', schedule:'Quarterly', lastRun:'2025-04-01 03:00', status:'success', duration:6, records:195, errors:0 },
  { id:'PL06', name:'OpenFIGI Mapping', source:'OpenFIGI', schedule:'Daily 05:00', lastRun:'2025-05-15 05:20', status:'success', duration:4, records:2100, errors:0 },
  { id:'PL07', name:'Manual Data Imports', source:'CSV Upload', schedule:'Ad-hoc', lastRun:'2025-05-14 14:30', status:'warning', duration:3, records:45, errors:2 },
  { id:'PL08', name:'CSRD/iXBRL Transform', source:'Internal', schedule:'On demand', lastRun:'2025-05-13 16:00', status:'failed', duration:0, records:0, errors:5 },
];

/* ── Active Issues (Combined) ────────────────────────────────────────────── */
const ACTIVE_ISSUES = [
  { id:'ISS01', module:'Validation', severity:'critical', description:'14 companies missing Scope 1 emissions for PCAF Tier 1', field:'ghg_scope1', count:14, created:'2025-05-14', status:'open' },
  { id:'ISS02', module:'Validation', severity:'warning', description:'ESG scores stale (>12 months) for 8 companies', field:'esg_composite', count:8, created:'2025-05-10', status:'open' },
  { id:'ISS03', module:'Reconciliation', severity:'warning', description:'Market cap mismatch >5% between EODHD and Exchange for 4 companies', field:'market_cap', count:4, created:'2025-05-15', status:'open' },
  { id:'ISS04', module:'Reconciliation', severity:'info', description:'Sector classification differs in 3 sources for 6 companies', field:'sector', count:6, created:'2025-05-12', status:'investigating' },
  { id:'ISS05', module:'ETL', severity:'critical', description:'CSRD/iXBRL transformation pipeline failed - schema mismatch', field:'pipeline', count:1, created:'2025-05-13', status:'open' },
  { id:'ISS06', module:'ETL', severity:'warning', description:'Manual CSV import had 2 parsing errors', field:'pipeline', count:2, created:'2025-05-14', status:'open' },
  { id:'ISS07', module:'Governance', severity:'warning', description:'Policy GP03 exception nearing expiry', field:'policy', count:1, created:'2025-05-10', status:'monitoring' },
  { id:'ISS08', module:'Versioning', severity:'info', description:'Storage approaching 80% of allocated capacity', field:'storage', count:1, created:'2025-05-15', status:'monitoring' },
  { id:'ISS09', module:'Validation', severity:'warning', description:'Bond ISIN mapping incomplete for 12 instruments', field:'isin', count:12, created:'2025-05-11', status:'open' },
  { id:'ISS10', module:'Reconciliation', severity:'warning', description:'Currency conversion rate discrepancy for INR pairs', field:'fx_rate', count:3, created:'2025-05-14', status:'investigating' },
];

/* ── Improvement Roadmap ─────────────────────────────────────────────────── */
const ROADMAP = [
  { id:'RM01', priority:'P1', action:'Resolve CSRD pipeline schema mismatch', module:'ETL', impact:'High', effort:'Medium', owner:'Data Engineering', status:'in_progress', eta:'2025-05-20' },
  { id:'RM02', priority:'P1', action:'Fill Scope 1 emissions gaps for PCAF compliance', module:'Validation', impact:'High', effort:'High', owner:'Climate Team', status:'in_progress', eta:'2025-06-01' },
  { id:'RM03', priority:'P2', action:'Automate market cap reconciliation with tolerance rules', module:'Reconciliation', impact:'Medium', effort:'Low', owner:'Data Engineering', status:'planned', eta:'2025-06-15' },
  { id:'RM04', priority:'P2', action:'Increase snapshot storage allocation to 256MB', module:'Versioning', impact:'Low', effort:'Low', owner:'IT', status:'planned', eta:'2025-05-25' },
  { id:'RM05', priority:'P2', action:'Refresh stale ESG scores via scheduled pipeline', module:'ETL', impact:'Medium', effort:'Medium', owner:'ESG Analytics', status:'planned', eta:'2025-06-10' },
  { id:'RM06', priority:'P3', action:'Implement automated governance exception reminders', module:'Governance', impact:'Medium', effort:'Low', owner:'Compliance', status:'backlog', eta:'2025-07-01' },
  { id:'RM07', priority:'P3', action:'Add real-time validation for manual data imports', module:'Validation', impact:'Medium', effort:'Medium', owner:'Data Engineering', status:'backlog', eta:'2025-07-15' },
  { id:'RM08', priority:'P3', action:'Standardize sector classification across all sources', module:'Reconciliation', impact:'High', effort:'High', owner:'Research', status:'backlog', eta:'2025-08-01' },
];

/* ── Cross-Module Health ─────────────────────────────────────────────────── */
const CROSS_MODULE_FEED = [
  { target:'Portfolio Analytics', dmeInput:'Validated company data, reconciled fundamentals', qualityImpact:'Direct', score:94 },
  { target:'Report Studio', dmeInput:'Governance-approved data, versioned snapshots', qualityImpact:'Direct', score:91 },
  { target:'Quant Models (VaR, ITR)', dmeInput:'Clean emissions data, validated ESG scores', qualityImpact:'Critical', score:88 },
  { target:'Regulatory Submissions', dmeInput:'Audit-trail data, lineage documentation', qualityImpact:'Critical', score:90 },
  { target:'Client Portal', dmeInput:'Template-locked reports, quality-assured data', qualityImpact:'High', score:93 },
  { target:'API Orchestration', dmeInput:'ETL pipeline outputs, vendor data', qualityImpact:'Direct', score:86 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════ */
const S = {
  page: { fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 },
  title: { fontSize:28, fontWeight:700, color:T.navy, margin:0 },
  badge: { display:'inline-block', background:`${T.gold}18`, color:T.gold, padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:600, marginTop:6 },
  card: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:16 },
  kpi: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', textAlign:'center', minWidth:120, flex:'1 1 120px' },
  kpiVal: { fontSize:22, fontWeight:700, color:T.navy },
  kpiLbl: { fontSize:10, color:T.textMut, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 },
  grid: { display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 },
  sectionTitle: { fontSize:16, fontWeight:700, color:T.navy, marginBottom:12, display:'flex', alignItems:'center', gap:8 },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'10px 12px', borderBottom:`2px solid ${T.border}`, color:T.textSec, fontWeight:600, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', fontSize:12 },
  td: { padding:'9px 12px', borderBottom:`1px solid ${T.border}`, fontSize:13 },
  btn: { padding:'7px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy },
  btnP: { padding:'7px 16px', borderRadius:8, border:'none', background:T.navy, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 },
  statusDot: (c) => ({ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block', marginRight:6 }),
  tag: (bg, fg) => ({ display:'inline-block', padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:bg, color:fg }),
  moduleCard: (color) => ({
    background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:20,
    borderLeft:`4px solid ${color}`, cursor:'pointer', transition:'all 0.15s',
    minWidth:180, flex:'1 1 180px',
  }),
  healthBar: (pct, color) => ({
    width:'100%', height:8, background:T.border, borderRadius:4, overflow:'hidden', position:'relative',
  }),
  healthFill: (pct, color) => ({
    width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.3s',
  }),
  input: { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font },
  gauge: (score) => ({
    width:64, height:64, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
    background:`conic-gradient(${score >= 90 ? T.green : score >= 75 ? T.amber : T.red} ${score * 3.6}deg, ${T.border} 0deg)`,
    position:'relative',
  }),
  gaugeInner: { width:50, height:50, borderRadius:'50%', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 },
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DmeHubPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || [], []);
  const validationRules = useMemo(() => loadLS(LS_VALIDATION) || [], []);
  const reconConfig = useMemo(() => loadLS(LS_RECON) || [], []);
  const snapshots = useMemo(() => loadLS(LS_SNAPSHOTS) || [], []);
  const etlSchedule = useMemo(() => loadLS(LS_ETL) || [], []);
  const vendorData = useMemo(() => loadLS(LS_VENDOR) || [], []);

  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [issueFilter, setIssueFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [activeSection, setActiveSection] = useState('overview');

  /* ── Sort handler ─────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortCol(col);
  }, [sortCol]);
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';

  /* ── Derived KPIs ─────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const valHealth = MODULE_HEALTH.find(m => m.module === 'Validation');
    const reconHealth = MODULE_HEALTH.find(m => m.module === 'Reconciliation');
    const verHealth = MODULE_HEALTH.find(m => m.module === 'Versioning');
    const etlHealth = MODULE_HEALTH.find(m => m.module === 'ETL Pipeline');
    const govHealth = MODULE_HEALTH.find(m => m.module === 'Governance');
    const critIssues = ACTIVE_ISSUES.filter(i => i.severity === 'critical').length;
    const totalConflicts = ACTIVE_ISSUES.filter(i => i.module === 'Reconciliation').length;
    const storageMB = verHealth?.storageUsedMB || 128;
    return {
      validationPass: valHealth?.score || 0, criticalViolations: critIssues,
      conflictsDetected: totalConflicts, reconRate: reconHealth?.score || 0,
      snapshotsStored: verHealth?.snapshotsStored || 0, latestSnapshot: '2025-05-14',
      etlSuccessRate: Math.round((ETL_PIPELINES.filter(p => p.status === 'success').length / ETL_PIPELINES.length) * 100),
      pipelineDuration: Math.round(ETL_PIPELINES.reduce((s, p) => s + p.duration, 0) / ETL_PIPELINES.length),
      govCompliance: govHealth?.complianceRate || 0, policiesActive: govHealth?.policiesActive || 0,
      dataDomains: 8, modelValidations: 2, openExceptions: 1, storageUsed: `${storageMB}MB`,
    };
  }, []);

  /* ── Data Maturity Score ──────────────────────────────────────────────── */
  const maturityScore = useMemo(() => {
    const scores = MODULE_HEALTH.map(m => m.score);
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }, []);

  /* ── Sorted issues ────────────────────────────────────────────────────── */
  const sortedIssues = useMemo(() => {
    let items = [...ACTIVE_ISSUES];
    if (issueFilter !== 'All') items = items.filter(i => i.module === issueFilter);
    if (severityFilter !== 'All') items = items.filter(i => i.severity === severityFilter);
    items.sort((a, b) => {
      const av = a[sortCol] || '', bv = b[sortCol] || '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [issueFilter, severityFilter, sortCol, sortDir]);

  /* ── localStorage usage ───────────────────────────────────────────────── */
  const lsUsage = useMemo(() => {
    const keys = [LS_PORTFOLIO, LS_VALIDATION, LS_RECON, LS_SNAPSHOTS, LS_ETL, LS_VENDOR];
    return keys.map(k => {
      const val = localStorage.getItem(k);
      return { key: k.replace('ra_', '').replace('_v1', '').replace('_v2', ''), sizeKB: val ? Math.round(new Blob([val]).size / 1024 * 10) / 10 : 0 };
    });
  }, []);
  const totalStorageKB = useMemo(() => lsUsage.reduce((s, l) => s + l.sizeKB, 0), [lsUsage]);

  /* ── Exports ──────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['ID','Module','Severity','Description','Field','Count','Created','Status']];
    ACTIVE_ISSUES.forEach(i => rows.push([i.id, i.module, i.severity, `"${i.description}"`, i.field, i.count, i.created, i.status]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dme_issues.csv'; a.click();
  }, []);

  const exportJSON = useCallback(() => {
    const report = {
      exportDate: new Date().toISOString(), maturityScore, moduleHealth: MODULE_HEALTH,
      kpis, activeIssues: ACTIVE_ISSUES, etlPipelines: ETL_PIPELINES, roadmap: ROADMAP,
      qualityTrend: QUALITY_TREND, crossModuleFeed: CROSS_MODULE_FEED,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dme_hub_report.json'; a.click();
  }, [maturityScore, kpis]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Section tabs ─────────────────────────────────────────────────────── */
  const SECTIONS = [
    { id:'overview', label:'Overview' },
    { id:'issues', label:'Active Issues' },
    { id:'etl', label:'ETL Pipelines' },
    { id:'roadmap', label:'Improvement Roadmap' },
    { id:'cross', label:'Cross-Module Health' },
    { id:'storage', label:'Storage & Performance' },
  ];

  const tabStyle = (a) => ({
    padding:'8px 18px', borderRadius:'8px 8px 0 0', border:`1px solid ${a ? T.navy : T.border}`,
    borderBottom:a ? `2px solid ${T.gold}` : `1px solid ${T.border}`, background:a ? T.surface : T.surfaceH,
    color:a ? T.navy : T.textSec, cursor:'pointer', fontSize:13, fontWeight:a ? 700 : 500,
  });

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={S.page}>
      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Data Management Engine</h1>
          <div style={S.badge}>Hub &middot; Validation &middot; Reconciliation &middot; Versioning &middot; ETL &middot; Governance</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={S.btn} onClick={exportCSV}>Export CSV</button>
          <button style={S.btn} onClick={exportJSON}>Export JSON</button>
          <button style={S.btn} onClick={exportPrint}>Print</button>
          <button style={S.btnP} onClick={() => navigate('/data-quality')}>Data Quality</button>
          <button style={S.btnP} onClick={() => navigate('/api-orchestration')}>API Orchestration</button>
          <button style={S.btnP} onClick={() => navigate('/data-lineage')}>Data Lineage</button>
        </div>
      </div>

      {/* ── 2. Module Status Cards ─────────────────────────────────────────── */}
      <div style={S.grid}>
        {DME_MODULES.map(mod => {
          const health = MODULE_HEALTH.find(h => h.module.toLowerCase().includes(mod.id.split('-')[1] || mod.id));
          const hScore = health?.score || 85;
          const hStatus = health?.status || 'healthy';
          const statusColor = hStatus === 'healthy' ? T.green : hStatus === 'warning' ? T.amber : T.red;
          return (
            <div key={mod.id} style={S.moduleCard(mod.color)} onClick={() => navigate(mod.path)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:800, color:mod.color, letterSpacing:1 }}>{mod.icon}</div>
                <span style={S.statusDot(statusColor)} />
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>{mod.name}</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>{mod.desc}</div>
              <div style={S.healthBar(hScore, statusColor)}>
                <div style={S.healthFill(hScore, statusColor)} />
              </div>
              <div style={{ fontSize:11, fontWeight:600, color:statusColor, marginTop:4 }}>{hScore}% Health</div>
            </div>
          );
        })}
      </div>

      {/* ── 3. 14 KPI Cards ────────────────────────────────────────────────── */}
      <div style={S.grid}>
        {[
          { label:'Validation Pass Rate', value:`${kpis.validationPass}%`, color: kpis.validationPass >= 90 ? T.green : T.amber },
          { label:'Critical Violations', value:kpis.criticalViolations, color: kpis.criticalViolations > 0 ? T.red : T.green },
          { label:'Conflicts Detected', value:kpis.conflictsDetected, color: kpis.conflictsDetected > 3 ? T.red : T.amber },
          { label:'Reconciliation Rate', value:`${kpis.reconRate}%`, color: kpis.reconRate >= 90 ? T.green : T.amber },
          { label:'Snapshots Stored', value:kpis.snapshotsStored, color:T.navy },
          { label:'Latest Snapshot', value:kpis.latestSnapshot, color:T.sage },
          { label:'ETL Success Rate', value:`${kpis.etlSuccessRate}%`, color: kpis.etlSuccessRate >= 85 ? T.green : T.amber },
          { label:'Avg Pipeline Duration', value:`${kpis.pipelineDuration} min`, color:T.navyL },
          { label:'Governance Compliance', value:`${kpis.govCompliance}%`, color: kpis.govCompliance >= 90 ? T.green : T.amber },
          { label:'Policies Active', value:kpis.policiesActive, color:T.navy },
          { label:'Data Domains', value:kpis.dataDomains, color:T.sage },
          { label:'Model Validations', value:kpis.modelValidations, color:T.gold },
          { label:'Open Exceptions', value:kpis.openExceptions, color: kpis.openExceptions > 2 ? T.red : T.amber },
          { label:'Storage Used', value:kpis.storageUsed, color:T.navyL },
        ].map((kpi, i) => (
          <div key={i} style={S.kpi}>
            <div style={{ ...S.kpiVal, color:kpi.color, fontSize:20 }}>{kpi.value}</div>
            <div style={S.kpiLbl}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── 4. DME System Health ────────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={S.sectionTitle}>System Health Overview</div>
          <div style={S.gauge(maturityScore)}>
            <div style={S.gaugeInner}>{maturityScore}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {MODULE_HEALTH.map((m, i) => {
            const color = m.status === 'healthy' ? T.green : m.status === 'warning' ? T.amber : T.red;
            return (
              <div key={i} style={{ flex:'1 1 170px', padding:14, background:T.surfaceH, borderRadius:10, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={S.statusDot(color)} />
                  <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{m.module}</span>
                </div>
                <div style={S.healthBar(m.score, color)}><div style={S.healthFill(m.score, color)} /></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:T.textSec }}>
                  <span>{m.score}%</span>
                  <span>{m.issues} issues</span>
                </div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>Last: {m.lastRun}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Data Quality Trend ──────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Data Quality Trend</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={QUALITY_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize:11 }} />
            <YAxis domain={[60, 100]} tick={{ fontSize:11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="overall" stroke={T.navy} fill={`${T.navy}20`} strokeWidth={2} name="Overall" />
            <Area type="monotone" dataKey="target" stroke={T.gold} fill="none" strokeDasharray="5 5" strokeWidth={2} name="Target" />
            <Area type="monotone" dataKey="validation" stroke={T.sage} fill="none" strokeWidth={1} name="Validation" />
            <Area type="monotone" dataKey="etl" stroke="#4f46e5" fill="none" strokeWidth={1} name="ETL" />
            <Area type="monotone" dataKey="governance" stroke="#0891b2" fill="none" strokeWidth={1} name="Governance" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 7. Quick Actions ───────────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Quick Actions</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {DME_MODULES.map(mod => (
            <button key={mod.id} style={{ ...S.btnP, background:mod.color, padding:'10px 20px' }} onClick={() => navigate(mod.path)}>
              {mod.icon} &mdash; {mod.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Tabs ───────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, marginBottom:16, flexWrap:'wrap' }}>
        {SECTIONS.map(s => (
          <div key={s.id} style={tabStyle(activeSection === s.id)} onClick={() => setActiveSection(s.id)}>{s.label}</div>
        ))}
      </div>

      {/* ── Overview: ETL Summary + Maturity ────────────────────────────────── */}
      {activeSection === 'overview' && (
        <>
          {/* ── 6. ETL Pipeline Summary ────────────────────────────────────── */}
          <div style={S.card}>
            <div style={S.sectionTitle}>ETL Pipeline Summary</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {ETL_PIPELINES.map(p => {
                const statusColor = p.status === 'success' ? T.green : p.status === 'warning' ? T.amber : T.red;
                return (
                  <div key={p.id} style={{ flex:'1 1 160px', padding:12, background:T.surfaceH, borderRadius:10, border:`1px solid ${T.border}`, borderTop:`3px solid ${statusColor}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize:10, color:T.textSec }}>{p.source} &middot; {p.schedule}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                      <span style={S.tag(`${statusColor}18`, statusColor)}>{p.status}</span>
                      <span style={{ fontSize:10, color:T.textMut }}>{p.duration > 0 ? `${p.duration}min` : '--'}</span>
                    </div>
                    <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>{fmt(p.records)} records &middot; {p.errors} errors</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 9. Data Maturity Score ─────────────────────────────────────── */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Data Maturity Composite Score</div>
            <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ textAlign:'center' }}>
                <div style={S.gauge(maturityScore)}>
                  <div style={S.gaugeInner}>{maturityScore}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginTop:6 }}>Overall Maturity</div>
              </div>
              <div style={{ flex:1, minWidth:300 }}>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>Component Breakdown (20% each)</div>
                {MODULE_HEALTH.map((m, i) => {
                  const color = m.score >= 90 ? T.green : m.score >= 75 ? T.amber : T.red;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <div style={{ width:110, fontSize:12, fontWeight:600 }}>{m.module}</div>
                      <div style={{ flex:1, ...S.healthBar(m.score, color) }}><div style={S.healthFill(m.score, color)} /></div>
                      <div style={{ width:40, fontSize:12, fontWeight:700, color, textAlign:'right' }}>{m.score}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ width:280 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={MODULE_HEALTH.map(m => ({ module: m.module, score: m.score, fullMark: 100 }))}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="module" tick={{ fontSize:10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize:9 }} />
                    <Radar dataKey="score" stroke={T.navy} fill={`${T.navy}30`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 8. Active Issues Panel (Combined Sortable Table) ───────────────── */}
      {activeSection === 'issues' && (
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
            <div style={S.sectionTitle}>Active Issues ({sortedIssues.length})</div>
            <div style={{ display:'flex', gap:8 }}>
              <select style={S.input} value={issueFilter} onChange={e => setIssueFilter(e.target.value)}>
                <option value="All">All Modules</option>
                {['Validation','Reconciliation','ETL','Governance','Versioning'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select style={S.input} value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                <option value="All">All Severities</option>
                {['critical','warning','info'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[['id','ID'],['module','Module'],['severity','Severity'],['description','Description'],['count','Count'],['created','Created'],['status','Status']].map(([col, label]) => (
                    <th key={col} style={S.th} onClick={() => handleSort(col)}>{label}{sortIcon(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map(i => {
                  const sevColor = { critical: T.red, warning: T.amber, info: T.navyL };
                  const statColor = { open: T.red, investigating: T.amber, monitoring: T.navyL, resolved: T.green };
                  return (
                    <tr key={i.id} style={{ background: i.severity === 'critical' ? `${T.red}06` : 'transparent' }}>
                      <td style={S.td}><strong>{i.id}</strong></td>
                      <td style={S.td}><span style={S.tag(`${T.navyL}12`, T.navy)}>{i.module}</span></td>
                      <td style={S.td}><span style={S.tag(`${sevColor[i.severity]}18`, sevColor[i.severity])}>{i.severity}</span></td>
                      <td style={{ ...S.td, maxWidth:340, fontSize:12 }}>{i.description}</td>
                      <td style={S.td}><span style={{ fontWeight:700 }}>{i.count}</span></td>
                      <td style={S.td}>{i.created}</td>
                      <td style={S.td}><span style={S.tag(`${statColor[i.status]}18`, statColor[i.status])}>{i.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ETL Pipelines Detail ───────────────────────────────────────────── */}
      {activeSection === 'etl' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>ETL Pipeline Detail</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Pipeline</th><th style={S.th}>Source</th><th style={S.th}>Schedule</th><th style={S.th}>Last Run</th><th style={S.th}>Status</th><th style={S.th}>Duration</th><th style={S.th}>Records</th><th style={S.th}>Errors</th>
                </tr>
              </thead>
              <tbody>
                {ETL_PIPELINES.map(p => {
                  const sc = p.status === 'success' ? T.green : p.status === 'warning' ? T.amber : T.red;
                  return (
                    <tr key={p.id}>
                      <td style={S.td}><strong>{p.name}</strong></td>
                      <td style={S.td}>{p.source}</td>
                      <td style={S.td}>{p.schedule}</td>
                      <td style={S.td}>{p.lastRun}</td>
                      <td style={S.td}><span style={S.tag(`${sc}18`, sc)}>{p.status}</span></td>
                      <td style={S.td}>{p.duration > 0 ? `${p.duration} min` : '--'}</td>
                      <td style={S.td}>{fmt(p.records)}</td>
                      <td style={{ ...S.td, fontWeight:700, color: p.errors > 0 ? T.red : T.green }}>{p.errors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ETL_PIPELINES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="records" fill={T.navy} name="Records Processed" radius={[4,4,0,0]} />
                <Bar dataKey="duration" fill={T.gold} name="Duration (min)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 10. Improvement Roadmap ────────────────────────────────────────── */}
      {activeSection === 'roadmap' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Data Quality Improvement Roadmap</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Priority</th><th style={S.th}>Action</th><th style={S.th}>Module</th><th style={S.th}>Impact</th><th style={S.th}>Effort</th><th style={S.th}>Owner</th><th style={S.th}>Status</th><th style={S.th}>ETA</th>
                </tr>
              </thead>
              <tbody>
                {ROADMAP.map(r => {
                  const pColor = { P1: T.red, P2: T.amber, P3: T.navyL };
                  const sColor = { in_progress: T.amber, planned: T.navyL, backlog: T.textMut };
                  return (
                    <tr key={r.id}>
                      <td style={S.td}><span style={{ ...S.tag(`${pColor[r.priority]}18`, pColor[r.priority]), fontWeight:700 }}>{r.priority}</span></td>
                      <td style={{ ...S.td, maxWidth:300, fontSize:12 }}>{r.action}</td>
                      <td style={S.td}><span style={S.tag(`${T.navyL}12`, T.navy)}>{r.module}</span></td>
                      <td style={S.td}>{r.impact}</td>
                      <td style={S.td}>{r.effort}</td>
                      <td style={S.td}>{r.owner}</td>
                      <td style={S.td}><span style={S.tag(`${sColor[r.status]}18`, sColor[r.status])}>{r.status.replace('_', ' ')}</span></td>
                      <td style={{ ...S.td, fontWeight:600 }}>{r.eta}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 12. Cross-Module Data Health ────────────────────────────────────── */}
      {activeSection === 'cross' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Cross-Module Data Health Feed</div>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Target Module</th><th style={S.th}>DME Input</th><th style={S.th}>Quality Impact</th><th style={S.th}>Health Score</th>
                </tr>
              </thead>
              <tbody>
                {CROSS_MODULE_FEED.map((f, i) => {
                  const impColor = { Critical: T.red, Direct: T.navy, High: T.amber };
                  return (
                    <tr key={i}>
                      <td style={S.td}><strong>{f.target}</strong></td>
                      <td style={{ ...S.td, fontSize:12 }}>{f.dmeInput}</td>
                      <td style={S.td}><span style={S.tag(`${impColor[f.qualityImpact]}18`, impColor[f.qualityImpact])}>{f.qualityImpact}</span></td>
                      <td style={S.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:80, ...S.healthBar(f.score, f.score >= 90 ? T.green : T.amber) }}>
                            <div style={S.healthFill(f.score, f.score >= 90 ? T.green : f.score >= 80 ? T.amber : T.red)} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color: f.score >= 90 ? T.green : f.score >= 80 ? T.amber : T.red }}>{f.score}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CROSS_MODULE_FEED} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[70, 100]} tick={{ fontSize:11 }} />
                <YAxis type="category" dataKey="target" width={140} tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="score" fill={T.navy} radius={[0,4,4,0]} name="Health Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 11. Storage & Performance ──────────────────────────────────────── */}
      {activeSection === 'storage' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Storage & Performance</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:300 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:10 }}>localStorage Usage ({totalStorageKB.toFixed(1)} KB total)</div>
              <table style={S.table}>
                <thead>
                  <tr><th style={S.th}>Store</th><th style={S.th}>Size (KB)</th><th style={S.th}>Usage</th></tr>
                </thead>
                <tbody>
                  {lsUsage.map((l, i) => (
                    <tr key={i}>
                      <td style={S.td}>{l.key}</td>
                      <td style={S.td}>{l.sizeKB}</td>
                      <td style={S.td}>
                        <div style={{ width:100, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${Math.min(l.sizeKB / 50 * 100, 100)}%`, height:'100%', background: l.sizeKB > 30 ? T.amber : T.sage, borderRadius:3 }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ flex:1, minWidth:300 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:10 }}>ETL Processing Times</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ETL_PIPELINES.filter(p => p.duration > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:9 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize:11 }} label={{ value:'Minutes', angle:-90, position:'insideLeft', style:{ fontSize:11 } }} />
                  <Tooltip />
                  <Bar dataKey="duration" fill={T.gold} radius={[4,4,0,0]} name="Duration (min)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Storage: Snapshot History ─────────────────────────────────────── */}
      {activeSection === 'storage' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Snapshot History & Versioning Stats</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:300 }}>
              <table style={S.table}>
                <thead>
                  <tr><th style={S.th}>Snapshot ID</th><th style={S.th}>Date</th><th style={S.th}>Type</th><th style={S.th}>Companies</th><th style={S.th}>Size</th><th style={S.th}>Status</th></tr>
                </thead>
                <tbody>
                  {[
                    { id:'SNP-024', date:'2025-05-14', type:'Full Portfolio', companies:portfolio.length || 150, sizeMB:5.2, status:'complete' },
                    { id:'SNP-023', date:'2025-05-07', type:'Full Portfolio', companies:portfolio.length || 150, sizeMB:5.1, status:'complete' },
                    { id:'SNP-022', date:'2025-04-30', type:'Full Portfolio', companies:portfolio.length || 148, sizeMB:5.0, status:'complete' },
                    { id:'SNP-021', date:'2025-04-23', type:'Full Portfolio', companies:portfolio.length || 148, sizeMB:4.9, status:'complete' },
                    { id:'SNP-020', date:'2025-04-16', type:'Incremental', companies:32, sizeMB:1.2, status:'complete' },
                    { id:'SNP-019', date:'2025-04-09', type:'Full Portfolio', companies:portfolio.length || 145, sizeMB:4.8, status:'complete' },
                    { id:'SNP-018', date:'2025-04-02', type:'ESG Only', companies:portfolio.length || 145, sizeMB:2.1, status:'complete' },
                    { id:'SNP-017', date:'2025-03-26', type:'Full Portfolio', companies:portfolio.length || 142, sizeMB:4.6, status:'complete' },
                    { id:'SNP-016', date:'2025-03-19', type:'Incremental', companies:28, sizeMB:0.9, status:'complete' },
                    { id:'SNP-015', date:'2025-03-12', type:'Full Portfolio', companies:portfolio.length || 140, sizeMB:4.5, status:'complete' },
                  ].map((s, i) => (
                    <tr key={i}>
                      <td style={S.td}><strong>{s.id}</strong></td>
                      <td style={S.td}>{s.date}</td>
                      <td style={S.td}><span style={S.tag(s.type === 'Full Portfolio' ? `${T.navy}15` : s.type === 'Incremental' ? `${T.sage}15` : `${T.gold}15`, s.type === 'Full Portfolio' ? T.navy : s.type === 'Incremental' ? T.sage : T.gold)}>{s.type}</span></td>
                      <td style={S.td}>{s.companies}</td>
                      <td style={S.td}>{s.sizeMB} MB</td>
                      <td style={S.td}><span style={S.tag(`${T.green}18`, T.green)}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ flex:1, minWidth:280 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:10 }}>Snapshot Size Trend</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={[
                  { snap:'SNP-15', size:4.5 },{ snap:'SNP-16', size:0.9 },{ snap:'SNP-17', size:4.6 },
                  { snap:'SNP-18', size:2.1 },{ snap:'SNP-19', size:4.8 },{ snap:'SNP-20', size:1.2 },
                  { snap:'SNP-21', size:4.9 },{ snap:'SNP-22', size:5.0 },{ snap:'SNP-23', size:5.1 },{ snap:'SNP-24', size:5.2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="snap" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:11 }} label={{ value:'MB', angle:-90, position:'insideLeft', style:{ fontSize:11 } }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="size" stroke={T.navy} strokeWidth={2} dot={{ r:4, fill:T.navy }} name="Size (MB)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview: Module Comparison Chart ──────────────────────────────── */}
      {activeSection === 'overview' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Module Performance Comparison</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:2, minWidth:400 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={MODULE_HEALTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="module" tick={{ fontSize:11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize:11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill={T.navy} name="Health Score" radius={[4,4,0,0]} />
                  <Bar dataKey="issues" fill={T.amber} name="Open Issues" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, minWidth:220 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:12 }}>Issue Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={(() => {
                      const m = {};
                      ACTIVE_ISSUES.forEach(i => { m[i.module] = (m[i.module] || 0) + 1; });
                      return Object.entries(m).map(([name, value]) => ({ name, value }));
                    })()}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Object.keys(ACTIVE_ISSUES.reduce((a, i) => ({ ...a, [i.module]:1 }), {})).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview: Recent Activity Timeline ─────────────────────────────── */}
      {activeSection === 'overview' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Recent DME Activity</div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {[
              { time:'2025-05-15 09:00', module:'Governance', event:'Daily compliance check completed', severity:'info' },
              { time:'2025-05-15 08:30', module:'Validation', event:'Full validation run: 94% pass rate', severity:'info' },
              { time:'2025-05-15 07:45', module:'ETL', event:'EODHD market data pipeline completed (1,250 records)', severity:'info' },
              { time:'2025-05-15 06:00', module:'Reconciliation', event:'Multi-source reconciliation run: 4 new conflicts', severity:'warning' },
              { time:'2025-05-15 05:20', module:'ETL', event:'OpenFIGI mapping pipeline completed (2,100 records)', severity:'info' },
              { time:'2025-05-14 23:00', module:'Versioning', event:'Nightly snapshot SNP-024 created (5.2 MB)', severity:'info' },
              { time:'2025-05-14 14:30', module:'ETL', event:'Manual CSV import: 2 parsing errors detected', severity:'warning' },
              { time:'2025-05-13 16:00', module:'ETL', event:'CSRD/iXBRL pipeline failed - schema mismatch', severity:'critical' },
              { time:'2025-05-12 07:00', module:'ETL', event:'BRSR filings pipeline completed (480 records, 3 errors)', severity:'warning' },
              { time:'2025-05-11 10:15', module:'Validation', event:'Bond ISIN mapping gaps identified: 12 instruments', severity:'warning' },
            ].map((ev, i) => {
              const sevColor = { critical: T.red, warning: T.amber, info: T.sage };
              return (
                <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${T.border}`, alignItems:'flex-start' }}>
                  <div style={{ width:130, fontSize:11, color:T.textMut, flexShrink:0, paddingTop:2 }}>{ev.time}</div>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:sevColor[ev.severity], flexShrink:0, marginTop:4 }} />
                  <div style={{ flex:1 }}>
                    <span style={{ ...S.tag(`${T.navyL}12`, T.navy), marginRight:8 }}>{ev.module}</span>
                    <span style={{ fontSize:12, color:T.text }}>{ev.event}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Roadmap: Priority Distribution ─────────────────────────────────── */}
      {activeSection === 'roadmap' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Roadmap Priority Distribution & Module Coverage</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:250 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name:'P1 - Critical', value: ROADMAP.filter(r => r.priority === 'P1').length },
                      { name:'P2 - Important', value: ROADMAP.filter(r => r.priority === 'P2').length },
                      { name:'P3 - Nice-to-have', value: ROADMAP.filter(r => r.priority === 'P3').length },
                    ]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill={T.red} />
                    <Cell fill={T.amber} />
                    <Cell fill={T.navyL} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, minWidth:250 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:10 }}>Status Summary</div>
              {['in_progress','planned','backlog'].map(st => {
                const count = ROADMAP.filter(r => r.status === st).length;
                const stColor = { in_progress: T.amber, planned: T.navyL, backlog: T.textMut };
                return (
                  <div key={st} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:100, fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{st.replace('_', ' ')}</div>
                    <div style={{ flex:1, height:20, background:T.border, borderRadius:6, overflow:'hidden' }}>
                      <div style={{ width:`${(count / ROADMAP.length) * 100}%`, height:'100%', background:stColor[st], borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{ ...S.card, background:T.surfaceH, marginTop:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:12, color:T.textSec }}>
            Portfolio: {portfolio.length || GLOBAL_COMPANY_MASTER?.length || 0} companies &middot; DME Maturity: {maturityScore}/100 &middot; Last refresh: {today.toISOString().split('T')[0]}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {DME_MODULES.map(mod => (
              <button key={mod.id} style={{ ...S.btn, fontSize:11 }} onClick={() => navigate(mod.path)}>{mod.icon}</button>
            ))}
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/data-quality')}>Data Quality</button>
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/api-orchestration')}>API Orch.</button>
            <button style={{ ...S.btn, fontSize:11 }} onClick={() => navigate('/data-lineage')}>Lineage</button>
          </div>
        </div>
      </div>
    </div>
  );
}
