import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669','#0d9488','#f97316','#6366f1'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_KEY = 'ep_r5_regulatory_submission_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const today = new Date('2025-05-15');
const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);

/* ═══════════════════════════════════════════════════════════════════════════
   REGULATORY SUBMISSIONS DATABASE
   ═══════════════════════════════════════════════════════════════════════════ */
const REGULATORY_SUBMISSIONS = [
  { id:'SUB001', regulator:'ESMA', regulation:'SFDR', filing_type:'PAI Statement', jurisdiction:'EU', deadline:'2025-06-30', frequency:'Annual', status:'in_progress', completion_pct:65, assignee:'Compliance Team', data_sources:['sfdr-classification','esg-screener'], format:'XHTML (ESEF)', portal:'https://www.esma.europa.eu/', last_submission:'2024-06-30', notes:'Awaiting finalized PAI data from portfolio analytics' },
  { id:'SUB002', regulator:'ESMA', regulation:'SFDR', filing_type:'Pre-contractual Disclosure (Annex II)', jurisdiction:'EU', deadline:'2025-03-31', frequency:'On Change', status:'submitted', completion_pct:100, assignee:'Legal Team', data_sources:['sfdr-classification'], format:'PDF', portal:'https://www.esma.europa.eu/', last_submission:'2025-03-28', notes:'Submitted ahead of deadline' },
  { id:'SUB003', regulator:'EC', regulation:'EU Taxonomy', filing_type:'Taxonomy Alignment Report', jurisdiction:'EU', deadline:'2025-12-31', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'Sustainability Team', data_sources:['eu-taxonomy-engine','taxonomy-alignment'], format:'XHTML (ESEF)', portal:'https://ec.europa.eu/', last_submission:'2024-12-20', notes:'' },
  { id:'SUB004', regulator:'EFRAG', regulation:'CSRD (ESRS)', filing_type:'ESRS E1 Climate Disclosure', jurisdiction:'EU', deadline:'2026-01-31', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'ESG Analytics', data_sources:['csrd-ixbrl','esrs-mapping'], format:'iXBRL', portal:'https://www.efrag.org/', last_submission:null, notes:'First reporting year under CSRD' },
  { id:'SUB005', regulator:'FCA', regulation:'TCFD', filing_type:'TCFD-aligned Climate Report', jurisdiction:'UK', deadline:'2025-06-30', frequency:'Annual', status:'in_progress', completion_pct:45, assignee:'Risk Team', data_sources:['tcfd-alignment','climate-var'], format:'PDF', portal:'https://www.fca.org.uk/', last_submission:'2024-06-25', notes:'Scenario analysis in progress' },
  { id:'SUB006', regulator:'FCA', regulation:'SDR', filing_type:'Sustainability Disclosure Requirements', jurisdiction:'UK', deadline:'2025-12-02', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'Compliance Team', data_sources:['sdr-labels','esg-screener'], format:'PDF', portal:'https://www.fca.org.uk/', last_submission:null, notes:'New regulation - first filing' },
  { id:'SUB007', regulator:'SEBI', regulation:'BRSR', filing_type:'BRSR Core Report', jurisdiction:'IN', deadline:'2025-09-30', frequency:'Annual', status:'in_progress', completion_pct:70, assignee:'India Ops', data_sources:['brsr-core','brsr-principles'], format:'XBRL', portal:'https://www.sebi.gov.in/', last_submission:'2024-09-28', notes:'Core indicators 70% complete' },
  { id:'SUB008', regulator:'SEBI', regulation:'BRSR', filing_type:'Reasonable Assurance (Top 150)', jurisdiction:'IN', deadline:'2025-09-30', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'Audit Team', data_sources:['brsr-core'], format:'PDF', portal:'https://www.sebi.gov.in/', last_submission:null, notes:'Assurance provider selection pending' },
  { id:'SUB009', regulator:'FSA Japan', regulation:'ISSB/SSBJ', filing_type:'ISSB-aligned Climate Disclosure', jurisdiction:'JP', deadline:'2026-03-31', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'APAC Team', data_sources:['issb-materiality','climate-var'], format:'XBRL', portal:'https://www.fsa.go.jp/', last_submission:null, notes:'SSBJ standards finalized Q1 2025' },
  { id:'SUB010', regulator:'MAS', regulation:'Environmental Risk Management', filing_type:'Climate Risk Report', jurisdiction:'SG', deadline:'2025-06-30', frequency:'Annual', status:'in_progress', completion_pct:30, assignee:'APAC Team', data_sources:['climate-var','stranded-assets'], format:'PDF', portal:'https://www.mas.gov.sg/', last_submission:'2024-06-20', notes:'Physical risk assessment underway' },
  { id:'SUB011', regulator:'SEC', regulation:'Climate Disclosure Rule', filing_type:'Climate Risk in 10-K', jurisdiction:'US', deadline:'2026-12-31', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'US Legal', data_sources:['sec-climate','ghg-emissions'], format:'EDGAR XBRL', portal:'https://www.sec.gov/', last_submission:null, notes:'Rule effective date TBD pending litigation' },
  { id:'SUB012', regulator:'FINMA', regulation:'Swiss Climate Ordinance', filing_type:'Climate Report', jurisdiction:'CH', deadline:'2025-12-31', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'EU Compliance', data_sources:['tcfd-alignment'], format:'PDF', portal:'https://www.finma.ch/', last_submission:null, notes:'' },
  { id:'SUB013', regulator:'HKEX', regulation:'Enhanced Climate Disclosures', filing_type:'ESG Report', jurisdiction:'HK', deadline:'2025-12-31', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'APAC Team', data_sources:['esg-screener','tcfd-alignment'], format:'PDF', portal:'https://www.hkex.com.hk/', last_submission:'2024-12-15', notes:'ISSB-aligned from 2025' },
  { id:'SUB014', regulator:'ASIC/AASB', regulation:'Climate-related Financial Disclosures', filing_type:'ISSB-aligned Report', jurisdiction:'AU', deadline:'2025-06-30', frequency:'Annual', status:'not_started', completion_pct:0, assignee:'APAC Team', data_sources:['issb-materiality','climate-var'], format:'PDF', portal:'https://www.asic.gov.au/', last_submission:null, notes:'Group 1 entities first year' },
  { id:'SUB015', regulator:'EC', regulation:'CBAM', filing_type:'Carbon Border Adjustment Certificates', jurisdiction:'EU', deadline:'2026-01-31', frequency:'Quarterly', status:'not_started', completion_pct:0, assignee:'Trade Compliance', data_sources:['cbam-registry','ghg-emissions'], format:'CBAM Portal', portal:'https://taxation-customs.ec.europa.eu/', last_submission:null, notes:'Transitional reporting phase' },
];

/* ── Evidence items per filing ────────────────────────────────────────────── */
const EVIDENCE_ITEMS = {
  SUB001: ['PAI data tables','Portfolio classification','Engagement records','Do No Significant Harm assessment','Taxonomy alignment %','Board sign-off'],
  SUB002: ['Fund prospectus update','Sustainability risk policy','Investment strategy ESG integration','Pre-contractual template','Legal review'],
  SUB003: ['Activity mapping','TSC assessment','Turnover alignment','CapEx alignment','OpEx alignment','DNSH assessment','Minimum safeguards check'],
  SUB004: ['Double materiality assessment','Scope 1/2/3 data','Transition plan','Climate targets','Governance structure','ESRS datapoints mapping'],
  SUB005: ['Governance description','Scenario analysis (2C/4C)','Risk register','Metrics & targets','Board minutes','External verification'],
  SUB007: ['Essential indicators','Leadership indicators','Supply chain data','Employee metrics','Environmental data','Community engagement','Board diversity'],
  SUB010: ['Physical risk assessment','Transition risk assessment','Scenario analysis','Stress test results','Risk appetite statement'],
};

/* ── Historical submissions ───────────────────────────────────────────────── */
const HISTORICAL = [
  { id:'SUB001', year:2024, date:'2024-06-30', outcome:'Accepted', feedback:'Minor formatting issues noted', score:92 },
  { id:'SUB002', year:2024, date:'2024-03-30', outcome:'Accepted', feedback:'Compliant', score:98 },
  { id:'SUB005', year:2024, date:'2024-06-25', outcome:'Accepted', feedback:'Scenario analysis depth could improve', score:85 },
  { id:'SUB007', year:2024, date:'2024-09-28', outcome:'Accepted', feedback:'Strong first submission', score:90 },
  { id:'SUB010', year:2024, date:'2024-06-20', outcome:'Accepted', feedback:'Physical risk section needs expansion', score:82 },
  { id:'SUB013', year:2024, date:'2024-12-15', outcome:'Accepted', feedback:'Good alignment with HKEX guidance', score:88 },
  { id:'SUB001', year:2023, date:'2023-06-28', outcome:'Accepted', feedback:'Compliant', score:88 },
  { id:'SUB005', year:2023, date:'2023-06-29', outcome:'Accepted with conditions', feedback:'Governance section insufficient', score:75 },
  { id:'SUB007', year:2023, date:'2023-09-30', outcome:'Accepted', feedback:'Baseline year', score:80 },
];

/* ── Regulatory changes ───────────────────────────────────────────────────── */
const REG_CHANGES = [
  { date:'2025-04-15', regulator:'EC', regulation:'CSRD', change:'EFRAG adopted sector-specific ESRS for mining & oil/gas', impact:'high', affects:['SUB004'] },
  { date:'2025-03-20', regulator:'FCA', regulation:'SDR', change:'Anti-greenwashing rule enforcement begins', impact:'medium', affects:['SUB006'] },
  { date:'2025-02-10', regulator:'SEBI', regulation:'BRSR', change:'Reasonable assurance mandate extended to top 250', impact:'high', affects:['SUB007','SUB008'] },
  { date:'2025-01-15', regulator:'SEC', regulation:'Climate Disclosure', change:'Stay lifted; phased compliance begins FY2026', impact:'high', affects:['SUB011'] },
  { date:'2025-05-01', regulator:'HKEX', regulation:'Enhanced Climate', change:'ISSB-aligned disclosures mandatory for Main Board issuers', impact:'medium', affects:['SUB013'] },
  { date:'2025-04-20', regulator:'EC', regulation:'CBAM', change:'Definitive CBAM certificates regime starts Jan 2026', impact:'medium', affects:['SUB015'] },
  { date:'2025-03-01', regulator:'MAS', regulation:'ERM', change:'Updated guidelines include nature-related risks', impact:'low', affects:['SUB010'] },
];

/* ── Cross-framework dependencies ─────────────────────────────────────────── */
const CROSS_DEPS = [
  { source:'SUB001', target:'SUB003', shared:'Taxonomy alignment data, sustainable investment %', strength:'strong' },
  { source:'SUB004', target:'SUB003', shared:'EU Taxonomy activity mapping, DNSH assessment', strength:'strong' },
  { source:'SUB004', target:'SUB001', shared:'PAI indicators, Scope 1/2/3 data', strength:'strong' },
  { source:'SUB005', target:'SUB009', shared:'TCFD-aligned governance, scenario analysis', strength:'medium' },
  { source:'SUB005', target:'SUB010', shared:'Climate risk assessment methodology', strength:'medium' },
  { source:'SUB005', target:'SUB014', shared:'ISSB S2 climate disclosures', strength:'strong' },
  { source:'SUB007', target:'SUB005', shared:'GHG emissions data, energy metrics', strength:'medium' },
  { source:'SUB009', target:'SUB013', shared:'ISSB S1/S2 aligned disclosures', strength:'strong' },
  { source:'SUB009', target:'SUB014', shared:'ISSB framework data', strength:'strong' },
  { source:'SUB011', target:'SUB005', shared:'Climate risk in financial filings', strength:'medium' },
  { source:'SUB015', target:'SUB003', shared:'Embedded emissions data, carbon certificates', strength:'medium' },
];

/* ── Preparation checklist template ───────────────────────────────────────── */
const PREP_STEPS = [
  'Data collection & validation', 'Internal review (first draft)', 'Legal/compliance review',
  'External assurance engagement', 'Board/management sign-off', 'Format conversion & tagging',
  'Portal upload & submission', 'Post-submission confirmation',
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function RegulatorySubmissionPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || GLOBAL_COMPANY_MASTER, []);

  /* ── State ────────────────────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortCol, setSortCol] = useState('deadline');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [kanbanData, setKanbanData] = useState(() => {
    const saved = loadLS(LS_KEY);
    if (saved?.kanban) return saved.kanban;
    const cols = { not_started: [], in_progress: [], under_review: [], submitted: [] };
    REGULATORY_SUBMISSIONS.forEach(s => {
      const col = s.status === 'submitted' ? 'submitted' : s.status === 'in_progress' ? 'in_progress' : 'not_started';
      cols[col].push(s.id);
    });
    return cols;
  });
  const [checklistState, setChecklistState] = useState(() => {
    const saved = loadLS(LS_KEY);
    if (saved?.checklist) return saved.checklist;
    const state = {};
    REGULATORY_SUBMISSIONS.forEach(s => { state[s.id] = PREP_STEPS.map(() => s.status === 'submitted'); });
    return state;
  });
  const [evidenceState, setEvidenceState] = useState(() => {
    const saved = loadLS(LS_KEY);
    return saved?.evidence || {};
  });
  const [completionSlider, setCompletionSlider] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');

  /* ── Persist ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    saveLS(LS_KEY, { kanban: kanbanData, checklist: checklistState, evidence: evidenceState });
  }, [kanbanData, checklistState, evidenceState]);

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const jurisdictions = useMemo(() => ['All', ...new Set(REGULATORY_SUBMISSIONS.map(s => s.jurisdiction))], []);
  const statuses = ['All', 'submitted', 'in_progress', 'not_started'];

  const filtered = useMemo(() => {
    let data = [...REGULATORY_SUBMISSIONS];
    if (jurisdictionFilter !== 'All') data = data.filter(s => s.jurisdiction === jurisdictionFilter);
    if (statusFilter !== 'All') data = data.filter(s => s.status === statusFilter);
    if (searchTerm) data = data.filter(s => `${s.regulator} ${s.regulation} ${s.filing_type}`.toLowerCase().includes(searchTerm.toLowerCase()));
    if (completionSlider > 0) data = data.filter(s => s.completion_pct >= completionSlider);
    data.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [jurisdictionFilter, statusFilter, searchTerm, sortCol, sortDir, completionSlider]);

  /* ── KPIs ────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const all = REGULATORY_SUBMISSIONS;
    const submitted = all.filter(s => s.status === 'submitted').length;
    const inProgress = all.filter(s => s.status === 'in_progress').length;
    const notStarted = all.filter(s => s.status === 'not_started').length;
    const overdue = all.filter(s => s.status !== 'submitted' && new Date(s.deadline) < today).length;
    const thisQ = all.filter(s => { const d = new Date(s.deadline); return d >= today && d <= new Date('2025-06-30'); }).length;
    const juris = new Set(all.map(s => s.jurisdiction)).size;
    const regs = new Set(all.map(s => s.regulator)).size;
    const avgComp = all.reduce((a, s) => a + s.completion_pct, 0) / all.length;
    const onTrack = all.filter(s => s.status === 'submitted' || (s.completion_pct > 0 && daysBetween(today, s.deadline) > 30)).length;
    return [
      { label: 'Total Filings', value: all.length, color: T.navy },
      { label: 'Submitted', value: submitted, color: T.green },
      { label: 'In Progress', value: inProgress, color: T.amber },
      { label: 'Not Started', value: notStarted, color: T.textMut },
      { label: 'Overdue', value: overdue, color: T.red },
      { label: 'Due This Quarter', value: thisQ, color: T.gold },
      { label: 'Jurisdictions', value: juris, color: T.navyL },
      { label: 'Regulators', value: regs, color: T.sage },
      { label: 'Avg Completion', value: pct(avgComp), color: T.gold },
      { label: 'On Track', value: pct((onTrack / all.length) * 100), color: T.green },
    ];
  }, []);

  /* ── Jurisdiction dashboard ──────────────────────────────────────────── */
  const jurisDash = useMemo(() => {
    const map = {};
    REGULATORY_SUBMISSIONS.forEach(s => {
      if (!map[s.jurisdiction]) map[s.jurisdiction] = { jurisdiction: s.jurisdiction, count: 0, totalComp: 0, nextDeadline: '2099-12-31' };
      map[s.jurisdiction].count++;
      map[s.jurisdiction].totalComp += s.completion_pct;
      if (s.deadline < map[s.jurisdiction].nextDeadline) map[s.jurisdiction].nextDeadline = s.deadline;
    });
    return Object.values(map).map(j => ({ ...j, avgComp: j.totalComp / j.count })).sort((a, b) => a.nextDeadline.localeCompare(b.nextDeadline));
  }, []);

  /* ── Filing calendar data ───────────────────────────────────────────── */
  const calendarData = useMemo(() => {
    const months = [];
    for (let m = 0; m < 18; m++) {
      const d = new Date(2025, m, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const filings = REGULATORY_SUBMISSIONS.filter(s => {
        const sd = new Date(s.deadline);
        return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      months.push({ label, filings: filings.length, names: filings.map(f => f.id).join(', ') });
    }
    return months;
  }, []);

  /* ── Status pie ─────────────────────────────────────────────────────── */
  const statusPie = useMemo(() => [
    { name: 'Submitted', value: REGULATORY_SUBMISSIONS.filter(s => s.status === 'submitted').length, color: T.green },
    { name: 'In Progress', value: REGULATORY_SUBMISSIONS.filter(s => s.status === 'in_progress').length, color: T.amber },
    { name: 'Not Started', value: REGULATORY_SUBMISSIONS.filter(s => s.status === 'not_started').length, color: T.textMut },
  ], []);

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortCol(col);
  }, [sortCol]);

  const moveKanban = useCallback((id, from, to) => {
    setKanbanData(prev => {
      const next = { ...prev };
      next[from] = prev[from].filter(x => x !== id);
      next[to] = [...prev[to], id];
      return next;
    });
  }, []);

  const toggleChecklist = useCallback((filingId, stepIdx) => {
    setChecklistState(prev => {
      const next = { ...prev };
      next[filingId] = [...(prev[filingId] || PREP_STEPS.map(() => false))];
      next[filingId][stepIdx] = !next[filingId][stepIdx];
      return next;
    });
  }, []);

  const toggleEvidence = useCallback((filingId, item) => {
    setEvidenceState(prev => {
      const next = { ...prev };
      if (!next[filingId]) next[filingId] = {};
      next[filingId][item] = !next[filingId][item];
      return next;
    });
  }, []);

  /* ── Exports ─────────────────────────────────────────────────────────── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportSubmissionStatus = useCallback(() => {
    exportCSV(REGULATORY_SUBMISSIONS.map(s => ({
      ID: s.id, Regulator: s.regulator, Regulation: s.regulation, Filing: s.filing_type,
      Jurisdiction: s.jurisdiction, Deadline: s.deadline, Status: s.status, Completion: s.completion_pct,
      Assignee: s.assignee, Format: s.format,
    })), 'regulatory_submissions_status.csv');
  }, [exportCSV]);

  const exportCalendar = useCallback(() => {
    exportCSV(calendarData.map(c => ({ Month: c.label, Filings: c.filings, Details: c.names })), 'regulatory_filing_calendar.csv');
  }, [exportCSV, calendarData]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Styles ──────────────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
  const badge = (color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color, background: bg || `${color}18`, marginRight: 4 });
  const statusBadge = (s) => s === 'submitted' ? badge(T.green, '#dcfce7') : s === 'in_progress' ? badge(T.amber, '#fef3c7') : badge(T.textMut, '#f3f4f6');
  const btn = (primary) => ({ padding: '8px 16px', borderRadius: 8, border: primary ? 'none' : `1px solid ${T.border}`, background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font });
  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '10px 12px', fontSize: 13, borderBottom: `1px solid ${T.border}`, color: T.text };
  const sectionTitle = { fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 12 };
  const input = { padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: 'none', width: 220 };
  const select = { ...input, width: 160 };

  const kanbanCols = [
    { key: 'not_started', label: 'Not Started', color: T.textMut },
    { key: 'in_progress', label: 'In Progress', color: T.amber },
    { key: 'under_review', label: 'Under Review', color: T.navyL },
    { key: 'submitted', label: 'Submitted', color: T.green },
  ];

  const arrows = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      {/* ── 1. Header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Regulatory Submission Tracker</h1>
          <span style={badge(T.navy, `${T.navy}12`)}>15 Filings</span>
          <span style={badge(T.sage, `${T.sage}18`)}>10 Regulators</span>
          <span style={badge(T.gold, `${T.gold}22`)}>8 Jurisdictions</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(false)} onClick={exportSubmissionStatus}>Export Status CSV</button>
          <button style={btn(false)} onClick={exportCalendar}>Export Calendar CSV</button>
          <button style={btn(false)} onClick={handlePrint}>Print</button>
        </div>
      </div>

      {/* ── 2. KPI Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...card, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── 3. Submission Status Kanban ───────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Submission Status Kanban</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {kanbanCols.map(col => (
            <div key={col.key} style={{ background: T.bg, borderRadius: 10, padding: 12, minHeight: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: col.color, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                {col.label}
                <span style={badge(col.color)}>{(kanbanData[col.key] || []).length}</span>
              </div>
              {(kanbanData[col.key] || []).map(id => {
                const sub = REGULATORY_SUBMISSIONS.find(s => s.id === id);
                if (!sub) return null;
                const colIdx = kanbanCols.findIndex(c => c.key === col.key);
                return (
                  <div key={id} style={{ background: T.surface, borderRadius: 8, padding: 10, marginBottom: 8, border: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={() => setSelectedFiling(sub)}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{sub.regulator} - {sub.regulation}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub.filing_type}</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Due: {sub.deadline}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {colIdx > 0 && <button style={{ ...btn(false), padding: '2px 8px', fontSize: 10 }} onClick={(e) => { e.stopPropagation(); moveKanban(id, col.key, kanbanCols[colIdx - 1].key); }}>Move Left</button>}
                      {colIdx < 3 && <button style={{ ...btn(true), padding: '2px 8px', fontSize: 10 }} onClick={(e) => { e.stopPropagation(); moveKanban(id, col.key, kanbanCols[colIdx + 1].key); }}>Move Right</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Submission Timeline (Gantt) ────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Submission Timeline</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={REGULATORY_SUBMISSIONS.map(s => ({ name: `${s.regulator} ${s.regulation}`, days: Math.max(0, daysBetween(today, s.deadline)), status: s.status }))} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" label={{ value: 'Days until deadline', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: T.textSec } }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={120} />
            <Tooltip formatter={(v) => [`${v} days`, 'Time Remaining']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            <Bar dataKey="days" radius={[0, 6, 6, 0]} fill={T.navy}>
              {REGULATORY_SUBMISSIONS.map((s, i) => (
                <Cell key={i} fill={s.status === 'submitted' ? T.green : s.status === 'in_progress' ? T.amber : daysBetween(today, s.deadline) < 60 ? T.red : T.navy} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 5. Detail Table (sortable) ───────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={sectionTitle}>Submission Detail Table</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search filings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={input} />
            <select value={jurisdictionFilter} onChange={e => setJurisdictionFilter(e.target.value)} style={select}>
              {jurisdictions.map(j => <option key={j} value={j}>{j === 'All' ? 'All Jurisdictions' : j}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={select}>
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
            </select>
            <div style={{ fontSize: 12, color: T.textSec }}>Min Completion:</div>
            <input type="range" min={0} max={100} value={completionSlider} onChange={e => setCompletionSlider(+e.target.value)} style={{ width: 100 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{completionSlider}%</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['regulator','regulation','filing_type','jurisdiction','deadline','status','completion_pct','assignee','format'].map(col => (
                  <th key={col} style={thStyle} onClick={() => handleSort(col)}>
                    {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}{arrows(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFiling(s)} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>{s.regulator}</span></td>
                  <td style={tdStyle}>{s.regulation}</td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>{s.filing_type}</td>
                  <td style={tdStyle}><span style={badge(T.navy)}>{s.jurisdiction}</span></td>
                  <td style={{ ...tdStyle, color: daysBetween(today, s.deadline) < 30 ? T.red : T.text, fontWeight: daysBetween(today, s.deadline) < 30 ? 700 : 400 }}>{s.deadline}</td>
                  <td style={tdStyle}><span style={statusBadge(s.status)}>{s.status.replace('_', ' ')}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border }}>
                        <div style={{ width: `${s.completion_pct}%`, height: '100%', borderRadius: 3, background: s.completion_pct === 100 ? T.green : s.completion_pct > 50 ? T.gold : T.amber }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{s.completion_pct}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{s.assignee}</td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>{s.format}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: T.textMut }}>Showing {filtered.length} of {REGULATORY_SUBMISSIONS.length} filings</div>
      </div>

      {/* ── 6. Jurisdiction Compliance Dashboard ─────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Jurisdiction Compliance Dashboard</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {jurisDash.map((j, i) => (
            <div key={j.jurisdiction} style={{ background: T.bg, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{j.jurisdiction}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{j.count} filings</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border }}>
                  <div style={{ width: `${j.avgComp}%`, height: '100%', borderRadius: 3, background: j.avgComp > 60 ? T.green : j.avgComp > 30 ? T.amber : T.red }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{j.avgComp.toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>Next: {j.nextDeadline}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Evidence Collection Tracker ────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Evidence Collection Tracker</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {Object.entries(EVIDENCE_ITEMS).map(([filingId, items]) => {
            const sub = REGULATORY_SUBMISSIONS.find(s => s.id === filingId);
            const collected = items.filter(item => evidenceState[filingId]?.[item]).length;
            return (
              <div key={filingId} style={{ background: T.bg, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{sub?.regulator} - {sub?.filing_type}</div>
                  <span style={badge(collected === items.length ? T.green : T.amber)}>{collected}/{items.length}</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                    <input type="checkbox" checked={!!evidenceState[filingId]?.[item]} onChange={() => toggleEvidence(filingId, item)} />
                    <span style={{ fontSize: 12, color: evidenceState[filingId]?.[item] ? T.green : T.textSec, textDecoration: evidenceState[filingId]?.[item] ? 'line-through' : 'none' }}>{item}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 8. Regulator Portal Links ────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Regulator Portal Links</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[...new Map(REGULATORY_SUBMISSIONS.map(s => [s.regulator, s])).values()].map(s => (
            <div key={s.regulator} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{s.regulator}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{s.jurisdiction}</div>
              <a href={s.portal} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 6, background: T.navy, color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>Open Portal</a>
            </div>
          ))}
        </div>
      </div>

      {/* ── 9. Filing Preparation Checklist ───────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Filing Preparation Checklist</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {REGULATORY_SUBMISSIONS.filter(s => s.status !== 'submitted').slice(0, 6).map(sub => {
            const steps = checklistState[sub.id] || PREP_STEPS.map(() => false);
            const done = steps.filter(Boolean).length;
            return (
              <div key={sub.id} style={{ background: T.bg, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{sub.regulator} - {sub.regulation}</span>
                  <span style={badge(done === PREP_STEPS.length ? T.green : T.amber)}>{done}/{PREP_STEPS.length}</span>
                </div>
                {PREP_STEPS.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                    <input type="checkbox" checked={steps[idx]} onChange={() => toggleChecklist(sub.id, idx)} />
                    <span style={{ fontSize: 12, color: steps[idx] ? T.green : T.textSec }}>{step}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 10. Cross-Framework Dependencies ──────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Cross-Framework Dependencies</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Source Filing', 'Target Filing', 'Shared Data', 'Strength'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {CROSS_DEPS.map((d, i) => {
              const src = REGULATORY_SUBMISSIONS.find(s => s.id === d.source);
              const tgt = REGULATORY_SUBMISSIONS.find(s => s.id === d.target);
              return (
                <tr key={i} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>{src?.regulator}</span> {src?.regulation}</td>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>{tgt?.regulator}</span> {tgt?.regulation}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{d.shared}</td>
                  <td style={tdStyle}><span style={badge(d.strength === 'strong' ? T.green : T.amber)}>{d.strength}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 11. Historical Submission Archive ─────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Historical Submission Archive</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Filing', 'Year', 'Date', 'Outcome', 'Score', 'Feedback'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {HISTORICAL.map((h, i) => {
              const sub = REGULATORY_SUBMISSIONS.find(s => s.id === h.id);
              return (
                <tr key={i} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>{sub?.regulator}</span> - {sub?.regulation}</td>
                  <td style={tdStyle}>{h.year}</td>
                  <td style={tdStyle}>{h.date}</td>
                  <td style={tdStyle}><span style={badge(h.outcome === 'Accepted' ? T.green : T.amber)}>{h.outcome}</span></td>
                  <td style={tdStyle}><span style={{ fontWeight: 700, color: h.score >= 90 ? T.green : h.score >= 80 ? T.gold : T.amber }}>{h.score}</span></td>
                  <td style={{ ...tdStyle, fontSize: 12, color: T.textSec }}>{h.feedback}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 12. Regulatory Change Monitor ─────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Regulatory Change Monitor</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REG_CHANGES.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 12, background: T.bg, borderRadius: 10, borderLeft: `4px solid ${c.impact === 'high' ? T.red : c.impact === 'medium' ? T.amber : T.sage}` }}>
              <div style={{ minWidth: 90, fontSize: 12, fontWeight: 600, color: T.textSec }}>{c.date}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: T.navy }}>{c.regulator} - {c.regulation}</span>
                  <span style={badge(c.impact === 'high' ? T.red : c.impact === 'medium' ? T.amber : T.sage)}>{c.impact}</span>
                </div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{c.change}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Affects: {c.affects.map(a => { const s = REGULATORY_SUBMISSIONS.find(x => x.id === a); return s ? `${s.regulator} ${s.regulation}` : a; }).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 13. Filing Calendar by Jurisdiction ───────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Filing Calendar by Jurisdiction</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={calendarData} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            <Bar dataKey="filings" fill={T.navy} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12 }}>
          {jurisDash.map((j, i) => {
            const filings = REGULATORY_SUBMISSIONS.filter(s => s.jurisdiction === j.jurisdiction);
            return (
              <div key={j.jurisdiction} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS[i % COLORS.length], marginBottom: 4 }}>{j.jurisdiction}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {filings.map(f => (
                    <span key={f.id} style={{ ...badge(COLORS[i % COLORS.length]), fontSize: 11 }}>{f.regulation} - {f.deadline}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 14. Status Distribution Pie + Cross-nav ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Status Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Cross-Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Regulatory Gap Analysis', path: '/regulatory-gap' },
              { label: 'Regulatory Calendar', path: '/regulatory-calendar' },
              { label: 'Framework Interoperability', path: '/framework-interop' },
              { label: 'CSRD iXBRL Engine', path: '/csrd-ixbrl' },
              { label: 'Reporting Hub', path: '/reporting-hub' },
              { label: 'Report Generator', path: '/report-generator' },
            ].map(n => (
              <button key={n.path} style={{ ...btn(false), textAlign: 'left', width: '100%' }} onClick={() => navigate(n.path)}>{n.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Compliance Risk Heatmap ────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Compliance Risk Heatmap by Jurisdiction</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Jurisdiction</th>
                <th style={thStyle}>Regulatory Complexity</th>
                <th style={thStyle}>Deadline Pressure</th>
                <th style={thStyle}>Data Readiness</th>
                <th style={thStyle}>Assurance Req.</th>
                <th style={thStyle}>Overall Risk</th>
              </tr>
            </thead>
            <tbody>
              {jurisDash.map((j, i) => {
                const filings = REGULATORY_SUBMISSIONS.filter(s => s.jurisdiction === j.jurisdiction);
                const complexity = Math.min(100, filings.length * 25 + (j.jurisdiction === 'EU' ? 30 : 0));
                const deadlinePressure = filings.some(f => daysBetween(today, f.deadline) < 45) ? 85 : filings.some(f => daysBetween(today, f.deadline) < 90) ? 55 : 25;
                const dataReady = j.avgComp;
                const assurance = filings.some(f => f.filing_type.includes('Assurance') || f.format?.includes('XBRL') || f.format?.includes('iXBRL')) ? 75 : 30;
                const overall = Math.round((complexity * 0.25 + deadlinePressure * 0.3 + (100 - dataReady) * 0.3 + assurance * 0.15));
                const riskColor = (v) => v > 65 ? T.red : v > 40 ? T.amber : T.green;
                const riskBar = (v) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.border }}>
                      <div style={{ width: `${v}%`, height: '100%', borderRadius: 4, background: riskColor(v) }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(v), minWidth: 30 }}>{v}</span>
                  </div>
                );
                return (
                  <tr key={j.jurisdiction} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...tdStyle, fontWeight: 700, fontSize: 15 }}>{j.jurisdiction}</td>
                    <td style={tdStyle}>{riskBar(complexity)}</td>
                    <td style={tdStyle}>{riskBar(deadlinePressure)}</td>
                    <td style={tdStyle}>{riskBar(100 - dataReady)}</td>
                    <td style={tdStyle}>{riskBar(assurance)}</td>
                    <td style={tdStyle}>{riskBar(overall)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Assignee Workload ─────────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Assignee Workload Distribution</div>
        {(() => {
          const assigneeMap = {};
          REGULATORY_SUBMISSIONS.forEach(s => {
            if (!assigneeMap[s.assignee]) assigneeMap[s.assignee] = { total: 0, submitted: 0, inProgress: 0, notStarted: 0, filings: [] };
            assigneeMap[s.assignee].total++;
            if (s.status === 'submitted') assigneeMap[s.assignee].submitted++;
            else if (s.status === 'in_progress') assigneeMap[s.assignee].inProgress++;
            else assigneeMap[s.assignee].notStarted++;
            assigneeMap[s.assignee].filings.push(s.id);
          });
          const assigneeData = Object.entries(assigneeMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);
          return (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={assigneeData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textSec }} width={120} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="submitted" stackId="a" fill={T.green} name="Submitted" />
                <Bar dataKey="inProgress" stackId="a" fill={T.amber} name="In Progress" />
                <Bar dataKey="notStarted" stackId="a" fill={T.textMut} name="Not Started" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── Format & Frequency Distribution ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Filing Format Distribution</div>
          {(() => {
            const fmtMap = {};
            REGULATORY_SUBMISSIONS.forEach(s => { fmtMap[s.format] = (fmtMap[s.format] || 0) + 1; });
            const fmtData = Object.entries(fmtMap).map(([name, value]) => ({ name, value }));
            return (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={fmtData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {fmtData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Filing Frequency Breakdown</div>
          {(() => {
            const freqMap = {};
            REGULATORY_SUBMISSIONS.forEach(s => { freqMap[s.frequency] = (freqMap[s.frequency] || 0) + 1; });
            const freqData = Object.entries(freqMap).map(([name, value]) => ({ name, value }));
            return (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={freqData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, value }) => `${name}: ${value}`}>
                    {freqData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* ── Completion Trend Projection ───────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Completion Trend Projection</div>
        {(() => {
          const projData = [];
          for (let w = 0; w <= 26; w++) {
            const weekDate = new Date(today.getTime() + w * 7 * 86400000);
            const label = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            let projected = 0;
            REGULATORY_SUBMISSIONS.forEach(s => {
              const daysTotal = Math.max(1, daysBetween('2025-01-01', s.deadline));
              const daysElapsed = daysBetween('2025-01-01', weekDate);
              const pctTime = Math.min(100, (daysElapsed / daysTotal) * 100);
              if (s.status === 'submitted') projected += 100;
              else projected += Math.min(100, s.completion_pct + (pctTime - s.completion_pct) * 0.6);
            });
            projData.push({ week: label, avgCompletion: +(projected / REGULATORY_SUBMISSIONS.length).toFixed(1) });
          }
          return (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={projData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: T.textSec }} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Avg Completion']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <ReferenceLine y={100} stroke={T.green} strokeDasharray="3 3" label={{ value: 'Target', fill: T.green, fontSize: 11 }} />
                <Area type="monotone" dataKey="avgCompletion" stroke={T.navy} fill={`${T.navy}25`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── Data Source Coverage Matrix ───────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Data Source Coverage Matrix</div>
        {(() => {
          const allSources = [...new Set(REGULATORY_SUBMISSIONS.flatMap(s => s.data_sources || []))];
          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Filing</th>
                    {allSources.map(ds => <th key={ds} style={{ ...thStyle, fontSize: 10, writing: 'vertical', maxWidth: 80 }}>{ds}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {REGULATORY_SUBMISSIONS.map(s => (
                    <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...tdStyle, fontWeight: 600, fontSize: 12 }}>{s.regulator} {s.regulation}</td>
                      {allSources.map(ds => (
                        <td key={ds} style={{ ...tdStyle, textAlign: 'center' }}>
                          {(s.data_sources || []).includes(ds)
                            ? <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: T.green }} />
                            : <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: T.border }} />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* ── Selected Filing Detail Modal ──────────────────────────────────── */}
      {selectedFiling && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setSelectedFiling(null)}>
          <div style={{ background: T.surface, borderRadius: 16, padding: 28, maxWidth: 620, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: T.navy, margin: 0 }}>{selectedFiling.regulator} - {selectedFiling.regulation}</h2>
                <div style={{ fontSize: 14, color: T.textSec, marginTop: 4 }}>{selectedFiling.filing_type}</div>
              </div>
              <button style={{ ...btn(false), padding: '4px 12px' }} onClick={() => setSelectedFiling(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Jurisdiction', selectedFiling.jurisdiction], ['Deadline', selectedFiling.deadline],
                ['Frequency', selectedFiling.frequency], ['Status', selectedFiling.status],
                ['Completion', `${selectedFiling.completion_pct}%`], ['Assignee', selectedFiling.assignee],
                ['Format', selectedFiling.format], ['Last Submission', selectedFiling.last_submission || 'N/A'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{v}</div>
                </div>
              ))}
            </div>
            {selectedFiling.notes && (
              <div style={{ marginTop: 16, padding: 12, background: T.bg, borderRadius: 8, fontSize: 13, color: T.textSec }}>{selectedFiling.notes}</div>
            )}
            {selectedFiling.data_sources && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Data Sources</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedFiling.data_sources.map(ds => <span key={ds} style={badge(T.sage)}>{ds}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
