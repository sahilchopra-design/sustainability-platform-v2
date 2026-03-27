import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_REPORT_HISTORY = 'ra_report_history_v1';
const LS_REPORT_TEMPLATES = 'ra_report_templates_v2';
const LS_REPORT_SCHEDULE = 'ra_report_schedule_v1';
const LS_CLIENT_NOTES = 'ra_client_notes_v1';
const LS_KEY = 'ep_r6_reporting_hub_state';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const fmtM = (n) => typeof n === 'number' ? (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`) : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const today = new Date('2025-05-15');

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════════ */
const MODULES = [
  { id: 'report-gen', name: 'Report Generator', desc: 'Generate ESG/climate reports on demand', status: 'active', path: '/report-generator', icon: 'DOC', reportsThisMonth: 12, color: T.navy },
  { id: 'template-mgr', name: 'Template Manager', desc: 'Manage and version report templates', status: 'active', path: '/template-manager', icon: 'TPL', reportsThisMonth: 0, color: T.gold },
  { id: 'client-portal', name: 'Client Portal', desc: 'Client-facing report delivery and feedback', status: 'active', path: '/client-portal', icon: 'USR', reportsThisMonth: 8, color: T.sage },
  { id: 'scheduled-rpt', name: 'Scheduled Reports', desc: 'Automated report generation schedules', status: 'active', path: '/scheduled-reports', icon: 'CLK', reportsThisMonth: 6, color: '#4f46e5' },
  { id: 'reg-submit', name: 'Regulatory Submissions', desc: 'Track & manage regulatory filings', status: 'active', path: '/regulatory-submission', icon: 'REG', reportsThisMonth: 2, color: T.red },
];

/* ── Clients ──────────────────────────────────────────────────────────────── */
const CLIENTS = [
  { id: 'CL01', name: 'Nordic Pension Fund', aum: 42000000000, type: 'Pension', region: 'EU', satisfaction: 4.7, reportsPerYear: 24, frameworks: ['TCFD','SFDR','EU Taxonomy','CSRD'], contactName: 'Lars Andersson', lastDelivery: '2025-05-01' },
  { id: 'CL02', name: 'Thames Asset Management', aum: 18500000000, type: 'Asset Manager', region: 'UK', satisfaction: 4.5, reportsPerYear: 18, frameworks: ['TCFD','SDR','ISSB'], contactName: 'Sarah Mitchell', lastDelivery: '2025-04-28' },
  { id: 'CL03', name: 'Tata Sustainable Fund', aum: 8200000000, type: 'Mutual Fund', region: 'IN', satisfaction: 4.3, reportsPerYear: 12, frameworks: ['BRSR','TCFD'], contactName: 'Priya Sharma', lastDelivery: '2025-05-10' },
  { id: 'CL04', name: 'Pacific Green Capital', aum: 25000000000, type: 'Hedge Fund', region: 'SG', satisfaction: 4.8, reportsPerYear: 30, frameworks: ['MAS ERM','TCFD','ISSB'], contactName: 'Wei Chen', lastDelivery: '2025-05-12' },
  { id: 'CL05', name: 'Helvetia Wealth', aum: 15000000000, type: 'Private Bank', region: 'CH', satisfaction: 4.6, reportsPerYear: 16, frameworks: ['FINMA','TCFD','SFDR'], contactName: 'Martin Berger', lastDelivery: '2025-04-20' },
  { id: 'CL06', name: 'Sydney Superannuation', aum: 31000000000, type: 'Super Fund', region: 'AU', satisfaction: 4.4, reportsPerYear: 20, frameworks: ['ASIC/AASB','ISSB','TCFD'], contactName: 'Emma Thompson', lastDelivery: '2025-05-08' },
  { id: 'CL07', name: 'Manhattan ESG Advisors', aum: 9500000000, type: 'RIA', region: 'US', satisfaction: 4.2, reportsPerYear: 14, frameworks: ['SEC Climate','TCFD'], contactName: 'John Prescott', lastDelivery: '2025-04-15' },
  { id: 'CL08', name: 'Tokyo Green Investments', aum: 22000000000, type: 'Asset Manager', region: 'JP', satisfaction: 4.5, reportsPerYear: 22, frameworks: ['ISSB/SSBJ','TCFD'], contactName: 'Kenji Yamamoto', lastDelivery: '2025-05-05' },
];

/* ── Report types ─────────────────────────────────────────────────────────── */
const REPORT_TYPES = [
  { id: 'RT01', name: 'ESG Portfolio Report', framework: 'Multi', format: 'PDF', avgGenTime: 12, dataCoverage: 94, template: 'TPL-ESG-01' },
  { id: 'RT02', name: 'TCFD Climate Report', framework: 'TCFD', format: 'PDF', avgGenTime: 18, dataCoverage: 91, template: 'TPL-TCFD-01' },
  { id: 'RT03', name: 'SFDR PAI Statement', framework: 'SFDR', format: 'XHTML', avgGenTime: 24, dataCoverage: 88, template: 'TPL-SFDR-01' },
  { id: 'RT04', name: 'EU Taxonomy Report', framework: 'EU Taxonomy', format: 'XHTML', avgGenTime: 20, dataCoverage: 82, template: 'TPL-TAX-01' },
  { id: 'RT05', name: 'BRSR Core Report', framework: 'BRSR', format: 'XBRL', avgGenTime: 16, dataCoverage: 70, template: 'TPL-BRSR-01' },
  { id: 'RT06', name: 'CSRD ESRS Report', framework: 'CSRD', format: 'iXBRL', avgGenTime: 30, dataCoverage: 65, template: 'TPL-CSRD-01' },
  { id: 'RT07', name: 'Climate VaR Summary', framework: 'Internal', format: 'PDF', avgGenTime: 8, dataCoverage: 96, template: 'TPL-VAR-01' },
  { id: 'RT08', name: 'Stranded Assets Report', framework: 'Internal', format: 'PDF', avgGenTime: 10, dataCoverage: 93, template: 'TPL-SA-01' },
  { id: 'RT09', name: 'ISSB S1/S2 Report', framework: 'ISSB', format: 'XBRL', avgGenTime: 22, dataCoverage: 78, template: 'TPL-ISSB-01' },
  { id: 'RT10', name: 'GRI Alignment Report', framework: 'GRI', format: 'PDF', avgGenTime: 14, dataCoverage: 85, template: 'TPL-GRI-01' },
  { id: 'RT11', name: 'Regulatory Gap Analysis', framework: 'Multi', format: 'PDF', avgGenTime: 6, dataCoverage: 98, template: 'TPL-GAP-01' },
  { id: 'RT12', name: 'Client Dashboard Summary', framework: 'Multi', format: 'PDF', avgGenTime: 4, dataCoverage: 99, template: 'TPL-DASH-01' },
];

/* ── Regulatory submissions (abbreviated) ─────────────────────────────────── */
const REG_SUBMISSIONS = [
  { id:'SUB001', regulator:'ESMA', regulation:'SFDR', filing:'PAI Statement', jurisdiction:'EU', deadline:'2025-06-30', status:'in_progress', completion:65 },
  { id:'SUB002', regulator:'ESMA', regulation:'SFDR', filing:'Annex II', jurisdiction:'EU', deadline:'2025-03-31', status:'submitted', completion:100 },
  { id:'SUB003', regulator:'EC', regulation:'EU Taxonomy', filing:'Taxonomy Report', jurisdiction:'EU', deadline:'2025-12-31', status:'not_started', completion:0 },
  { id:'SUB004', regulator:'EFRAG', regulation:'CSRD', filing:'ESRS E1', jurisdiction:'EU', deadline:'2026-01-31', status:'not_started', completion:0 },
  { id:'SUB005', regulator:'FCA', regulation:'TCFD', filing:'Climate Report', jurisdiction:'UK', deadline:'2025-06-30', status:'in_progress', completion:45 },
  { id:'SUB006', regulator:'FCA', regulation:'SDR', filing:'SDR Filing', jurisdiction:'UK', deadline:'2025-12-02', status:'not_started', completion:0 },
  { id:'SUB007', regulator:'SEBI', regulation:'BRSR', filing:'BRSR Core', jurisdiction:'IN', deadline:'2025-09-30', status:'in_progress', completion:70 },
  { id:'SUB008', regulator:'SEBI', regulation:'BRSR', filing:'Assurance', jurisdiction:'IN', deadline:'2025-09-30', status:'not_started', completion:0 },
  { id:'SUB009', regulator:'FSA Japan', regulation:'ISSB/SSBJ', filing:'ISSB Disclosure', jurisdiction:'JP', deadline:'2026-03-31', status:'not_started', completion:0 },
  { id:'SUB010', regulator:'MAS', regulation:'ERM', filing:'Climate Risk', jurisdiction:'SG', deadline:'2025-06-30', status:'in_progress', completion:30 },
  { id:'SUB011', regulator:'SEC', regulation:'Climate Rule', filing:'10-K Climate', jurisdiction:'US', deadline:'2026-12-31', status:'not_started', completion:0 },
  { id:'SUB012', regulator:'FINMA', regulation:'Swiss Climate', filing:'Climate Report', jurisdiction:'CH', deadline:'2025-12-31', status:'not_started', completion:0 },
  { id:'SUB013', regulator:'HKEX', regulation:'Climate Discl.', filing:'ESG Report', jurisdiction:'HK', deadline:'2025-12-31', status:'not_started', completion:0 },
  { id:'SUB014', regulator:'ASIC/AASB', regulation:'ISSB AU', filing:'ISSB Report', jurisdiction:'AU', deadline:'2025-06-30', status:'not_started', completion:0 },
  { id:'SUB015', regulator:'EC', regulation:'CBAM', filing:'CBAM Certs', jurisdiction:'EU', deadline:'2026-01-31', status:'not_started', completion:0 },
];

/* ── Monthly report generation stats ──────────────────────────────────────── */
const MONTHLY_STATS = [
  { month: 'Jul 24', reports: 18, errors: 1 }, { month: 'Aug 24', reports: 22, errors: 0 },
  { month: 'Sep 24', reports: 28, errors: 2 }, { month: 'Oct 24', reports: 24, errors: 1 },
  { month: 'Nov 24', reports: 30, errors: 0 }, { month: 'Dec 24', reports: 35, errors: 1 },
  { month: 'Jan 25', reports: 26, errors: 2 }, { month: 'Feb 25', reports: 32, errors: 0 },
  { month: 'Mar 25', reports: 38, errors: 1 }, { month: 'Apr 25', reports: 34, errors: 0 },
  { month: 'May 25', reports: 28, errors: 0 },
];

/* ── Upcoming deadlines (combined) ────────────────────────────────────────── */
const buildDeadlines = () => {
  const items = [];
  REG_SUBMISSIONS.filter(s => s.status !== 'submitted').forEach(s => {
    items.push({ type: 'regulatory', label: `${s.regulator} ${s.regulation}`, detail: s.filing, deadline: s.deadline, status: s.status, urgency: Math.ceil((new Date(s.deadline) - today) / 86400000) });
  });
  CLIENTS.forEach(c => {
    const nextDate = new Date(c.lastDelivery);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const deadline = nextDate.toISOString().slice(0, 10);
    items.push({ type: 'client', label: c.name, detail: 'Monthly report delivery', deadline, status: 'scheduled', urgency: Math.ceil((nextDate - today) / 86400000) });
  });
  return items.sort((a, b) => a.urgency - b.urgency);
};

/* ── Framework coverage ───────────────────────────────────────────────────── */
const FRAMEWORKS_LIST = ['TCFD', 'SFDR', 'EU Taxonomy', 'CSRD', 'BRSR', 'ISSB', 'GRI', 'SDR', 'MAS ERM', 'FINMA', 'HKEX', 'SEC Climate'];

/* ── Action items ─────────────────────────────────────────────────────────── */
const ACTION_ITEMS = [
  { id: 'A01', module: 'Report Generator', action: 'Update SFDR PAI data tables for Q2', priority: 'high', due: '2025-05-20' },
  { id: 'A02', module: 'Template Manager', action: 'Version CSRD ESRS template to v2.1', priority: 'medium', due: '2025-05-25' },
  { id: 'A03', module: 'Client Portal', action: 'Nordic Pension Fund quarterly review meeting', priority: 'high', due: '2025-05-18' },
  { id: 'A04', module: 'Scheduled Reports', action: 'Fix BRSR schedule timezone issue', priority: 'low', due: '2025-05-30' },
  { id: 'A05', module: 'Regulatory Submissions', action: 'Begin FCA TCFD scenario analysis', priority: 'high', due: '2025-05-22' },
  { id: 'A06', module: 'Report Generator', action: 'Calibrate Climate VaR confidence intervals', priority: 'medium', due: '2025-06-01' },
  { id: 'A07', module: 'Regulatory Submissions', action: 'Engage assurance provider for BRSR', priority: 'high', due: '2025-06-15' },
  { id: 'A08', module: 'Client Portal', action: 'Onboard Tokyo Green Investments to portal v3', priority: 'medium', due: '2025-06-10' },
  { id: 'A09', module: 'Template Manager', action: 'Add ISSB S2 sector-specific metrics template', priority: 'medium', due: '2025-06-20' },
  { id: 'A10', module: 'Scheduled Reports', action: 'Set up Pacific Green monthly auto-delivery', priority: 'low', due: '2025-05-28' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ReportingHubPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || GLOBAL_COMPANY_MASTER, []);
  const reportHistory = useMemo(() => loadLS(LS_REPORT_HISTORY) || [], []);
  const reportTemplates = useMemo(() => loadLS(LS_REPORT_TEMPLATES) || REPORT_TYPES, []);
  const reportSchedule = useMemo(() => loadLS(LS_REPORT_SCHEDULE) || [], []);
  const clientNotes = useMemo(() => loadLS(LS_CLIENT_NOTES) || {}, []);

  /* ── State ────────────────────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState('deadline');
  const [sortDir, setSortDir] = useState('asc');
  const [activeTab, setActiveTab] = useState('all');
  const [actionFilter, setActionFilter] = useState('All');
  const [prioritySlider, setPrioritySlider] = useState(0); // 0=all, 1=medium+high, 2=high only
  const [savedState, setSavedState] = useState(() => loadLS(LS_KEY) || { completedActions: [] });

  useEffect(() => { saveLS(LS_KEY, savedState); }, [savedState]);

  const toggleActionDone = useCallback((id) => {
    setSavedState(prev => {
      const completed = prev.completedActions.includes(id)
        ? prev.completedActions.filter(x => x !== id)
        : [...prev.completedActions, id];
      return { ...prev, completedActions: completed };
    });
  }, []);

  /* ── Derived data ────────────────────────────────────────────────────── */
  const deadlines = useMemo(() => buildDeadlines(), []);

  const totalAUM = useMemo(() => CLIENTS.reduce((a, c) => a + c.aum, 0), []);
  const totalReportsYTD = useMemo(() => MONTHLY_STATS.reduce((a, m) => a + m.reports, 0), []);
  const avgSatisfaction = useMemo(() => (CLIENTS.reduce((a, c) => a + c.satisfaction, 0) / CLIENTS.length).toFixed(1), []);
  const schedulesActive = useMemo(() => CLIENTS.length, []);
  const submissionsDue = useMemo(() => REG_SUBMISSIONS.filter(s => s.status !== 'submitted').length, []);
  const filingsOnTrack = useMemo(() => {
    const relevant = REG_SUBMISSIONS.filter(s => s.status !== 'submitted');
    const onTrack = relevant.filter(s => s.completion > 0 || Math.ceil((new Date(s.deadline) - today) / 86400000) > 90).length;
    return relevant.length ? ((onTrack / relevant.length) * 100).toFixed(0) : 0;
  }, []);
  const avgGenTime = useMemo(() => (REPORT_TYPES.reduce((a, r) => a + r.avgGenTime, 0) / REPORT_TYPES.length).toFixed(0), []);
  const avgDataCov = useMemo(() => (REPORT_TYPES.reduce((a, r) => a + r.dataCoverage, 0) / REPORT_TYPES.length).toFixed(0), []);
  const errorRate = useMemo(() => {
    const total = MONTHLY_STATS.reduce((a, m) => a + m.reports, 0);
    const errors = MONTHLY_STATS.reduce((a, m) => a + m.errors, 0);
    return total ? ((errors / total) * 100).toFixed(1) : 0;
  }, []);
  const reportsPerMonth = useMemo(() => (totalReportsYTD / MONTHLY_STATS.length).toFixed(0), [totalReportsYTD]);
  const fwCovered = useMemo(() => new Set(REPORT_TYPES.map(r => r.framework)).size, []);
  const formatsSupported = useMemo(() => new Set(REPORT_TYPES.map(r => r.format)).size, []);
  const revenueEst = useMemo(() => fmtM(totalAUM * 0.0002), [totalAUM]); // 2bps

  /* ── KPIs ────────────────────────────────────────────────────────────── */
  const kpis = [
    { label: 'Reports YTD', value: totalReportsYTD, color: T.navy },
    { label: 'Templates', value: REPORT_TYPES.length, color: T.gold },
    { label: 'Active Clients', value: CLIENTS.length, color: T.sage },
    { label: 'Total AUM', value: fmtM(totalAUM), color: T.navy },
    { label: 'Schedules Active', value: schedulesActive, color: '#4f46e5' },
    { label: 'Submissions Due', value: submissionsDue, color: T.red },
    { label: 'SLA Compliance', value: '97.2%', color: T.green },
    { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5`, color: T.gold },
    { label: 'Frameworks', value: fwCovered, color: T.sage },
    { label: 'Report Types', value: REPORT_TYPES.length, color: T.navyL },
    { label: 'Formats', value: formatsSupported, color: '#7c3aed' },
    { label: 'Filings On Track', value: `${filingsOnTrack}%`, color: T.green },
    { label: 'Revenue Est.', value: revenueEst, color: T.gold },
    { label: 'Reports/Month', value: reportsPerMonth, color: T.navy },
  ];

  /* ── Client AUM chart ───────────────────────────────────────────────── */
  const clientAumData = useMemo(() => CLIENTS.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), aum: c.aum / 1e9 })), []);

  /* ── Framework coverage radar ───────────────────────────────────────── */
  const fwCoverageData = useMemo(() => {
    return FRAMEWORKS_LIST.map(fw => {
      const hasReport = REPORT_TYPES.some(r => r.framework === fw || r.framework === 'Multi');
      const hasSubmission = REG_SUBMISSIONS.some(s => s.regulation.includes(fw.split(' ')[0]));
      return { framework: fw, reportCoverage: hasReport ? 100 : 0, submissionCoverage: hasSubmission ? 100 : 0 };
    });
  }, []);

  /* ── Jurisdiction pie ───────────────────────────────────────────────── */
  const jurisPie = useMemo(() => {
    const map = {};
    REG_SUBMISSIONS.forEach(s => {
      if (!map[s.jurisdiction]) map[s.jurisdiction] = { submitted: 0, pending: 0, overdue: 0 };
      if (s.status === 'submitted') map[s.jurisdiction].submitted++;
      else if (new Date(s.deadline) < today) map[s.jurisdiction].overdue++;
      else map[s.jurisdiction].pending++;
    });
    return Object.entries(map).map(([j, v]) => ({ jurisdiction: j, ...v }));
  }, []);

  const jurisPieFlat = useMemo(() => {
    const sub = REG_SUBMISSIONS.filter(s => s.status === 'submitted').length;
    const pend = REG_SUBMISSIONS.filter(s => s.status !== 'submitted' && new Date(s.deadline) >= today).length;
    const over = REG_SUBMISSIONS.filter(s => s.status !== 'submitted' && new Date(s.deadline) < today).length;
    return [
      { name: 'Submitted', value: sub, color: T.green },
      { name: 'Pending', value: pend, color: T.amber },
      { name: 'Overdue', value: over, color: T.red },
    ];
  }, []);

  /* ── Combined deliverables table ────────────────────────────────────── */
  const combinedDeliverables = useMemo(() => {
    const items = [];
    REG_SUBMISSIONS.forEach(s => {
      items.push({ id: s.id, type: 'Regulatory', name: `${s.regulator} ${s.regulation}`, detail: s.filing, deadline: s.deadline, status: s.status, completion: s.completion, client: s.jurisdiction });
    });
    CLIENTS.forEach(c => {
      const nextDate = new Date(c.lastDelivery);
      nextDate.setMonth(nextDate.getMonth() + 1);
      items.push({ id: `CR-${c.id}`, type: 'Client Report', name: c.name, detail: 'Monthly ESG Report', deadline: nextDate.toISOString().slice(0, 10), status: 'scheduled', completion: 0, client: c.region });
    });
    return items;
  }, []);

  const filteredDeliverables = useMemo(() => {
    let data = [...combinedDeliverables];
    if (activeTab === 'regulatory') data = data.filter(d => d.type === 'Regulatory');
    if (activeTab === 'client') data = data.filter(d => d.type === 'Client Report');
    if (searchTerm) data = data.filter(d => `${d.name} ${d.detail}`.toLowerCase().includes(searchTerm.toLowerCase()));
    data.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return data;
  }, [combinedDeliverables, activeTab, searchTerm, sortCol, sortDir]);

  /* ── Filtered actions ───────────────────────────────────────────────── */
  const filteredActions = useMemo(() => {
    let data = [...ACTION_ITEMS];
    if (actionFilter !== 'All') data = data.filter(a => a.module === actionFilter);
    if (prioritySlider === 1) data = data.filter(a => a.priority === 'high' || a.priority === 'medium');
    if (prioritySlider === 2) data = data.filter(a => a.priority === 'high');
    return data;
  }, [actionFilter, prioritySlider]);

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortCol(col);
  }, [sortCol]);

  /* ── Exports ─────────────────────────────────────────────────────────── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportDeliverables = useCallback(() => {
    exportCSV(filteredDeliverables.map(d => ({
      ID: d.id, Type: d.type, Name: d.name, Detail: d.detail, Deadline: d.deadline, Status: d.status, Completion: d.completion, Region: d.client,
    })), 'reporting_hub_deliverables.csv');
  }, [exportCSV, filteredDeliverables]);

  const exportClientSummary = useCallback(() => {
    exportCSV(CLIENTS.map(c => ({
      Name: c.name, AUM: c.aum, Type: c.type, Region: c.region, Satisfaction: c.satisfaction, ReportsPerYear: c.reportsPerYear, Frameworks: c.frameworks.join('; '),
    })), 'client_summary.csv');
  }, [exportCSV]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Styles ──────────────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
  const badge = (color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color, background: bg || `${color}18`, marginRight: 4 });
  const statusBadge = (s) => s === 'submitted' ? badge(T.green, '#dcfce7') : s === 'in_progress' ? badge(T.amber, '#fef3c7') : s === 'scheduled' ? badge(T.navyL, '#dbeafe') : badge(T.textMut, '#f3f4f6');
  const btn = (primary) => ({ padding: '8px 16px', borderRadius: 8, border: primary ? 'none' : `1px solid ${T.border}`, background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font });
  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '10px 12px', fontSize: 13, borderBottom: `1px solid ${T.border}`, color: T.text };
  const sectionTitle = { fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 12 };
  const input = { padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: 'none', width: 220 };
  const select = { ...input, width: 180 };
  const tabBtn = (active) => ({ padding: '6px 16px', borderRadius: 8, border: 'none', background: active ? T.navy : 'transparent', color: active ? '#fff' : T.textSec, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font });
  const arrows = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      {/* ── 1. Header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Client & Reporting Intelligence</h1>
          <span style={badge(T.navy, `${T.navy}12`)}>Hub</span>
          <span style={badge(T.sage, `${T.sage}18`)}>{REPORT_TYPES.length} Report Types</span>
          <span style={badge(T.gold, `${T.gold}22`)}>{CLIENTS.length} Clients</span>
          <span style={badge(T.red, `${T.red}15`)}>{REG_SUBMISSIONS.length} Filings</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(false)} onClick={exportDeliverables}>Export Deliverables CSV</button>
          <button style={btn(false)} onClick={exportClientSummary}>Export Clients CSV</button>
          <button style={btn(false)} onClick={handlePrint}>Print</button>
        </div>
      </div>

      {/* ── 2. Module Status Cards ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {MODULES.map(m => (
          <div key={m.id} style={{ ...card, padding: 16, cursor: 'pointer', borderLeft: `4px solid ${m.color}` }} onClick={() => navigate(m.path)} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = T.surface}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.icon}</div>
              <span style={badge(T.green, '#dcfce7')}>{m.status}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginTop: 8 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* ── 3. KPI Cards (2 rows of 7) ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...card, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginTop: 2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── 4. Reporting Pipeline ────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Reporting Pipeline</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['Data Collection', 'Analytics & Scoring', 'Report Generation', 'Template Styling', 'Client Delivery', 'Regulatory Submission'].map((stage, i) => (
            <React.Fragment key={stage}>
              <div style={{ flex: 1, background: COLORS[i % COLORS.length] + '15', border: `2px solid ${COLORS[i % COLORS.length]}`, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS[i % COLORS.length] }}>{stage}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                  {['42 data sources', '12 models', `${REPORT_TYPES.length} types`, `${REPORT_TYPES.length} templates`, `${CLIENTS.length} clients`, `${REG_SUBMISSIONS.length} filings`][i]}
                </div>
              </div>
              {i < 5 && <div style={{ fontSize: 20, color: T.textMut, fontWeight: 800 }}>&rarr;</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── 5. Quick Actions ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Generate Report', path: '/report-generator', color: T.navy },
          { label: 'Manage Templates', path: '/template-manager', color: T.gold },
          { label: 'Client Portal', path: '/client-portal', color: T.sage },
          { label: 'Schedule Reports', path: '/scheduled-reports', color: '#4f46e5' },
          { label: 'Regulatory Tracker', path: '/regulatory-submission', color: T.red },
        ].map(a => (
          <button key={a.path} style={{ ...card, padding: 16, textAlign: 'center', cursor: 'pointer', borderTop: `3px solid ${a.color}`, background: T.surface }} onClick={() => navigate(a.path)}>
            <div style={{ fontSize: 14, fontWeight: 700, color: a.color }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* ── 6. Upcoming Deadlines ────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Upcoming Deadlines</div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {deadlines.slice(0, 15).map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
              <div style={{ width: 60, textAlign: 'center' }}>
                <span style={badge(d.urgency < 30 ? T.red : d.urgency < 60 ? T.amber : T.green)}>{d.urgency}d</span>
              </div>
              <span style={badge(d.type === 'regulatory' ? T.red : T.navy)}>{d.type}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{d.label}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{d.detail}</div>
              </div>
              <div style={{ fontSize: 12, color: T.textMut }}>{d.deadline}</div>
              <span style={statusBadge(d.status)}>{d.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Client Revenue Summary & 8. Framework Coverage ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Client AUM Summary ($ Billions)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={clientAumData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$B', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
              <Tooltip formatter={(v) => [`$${v.toFixed(1)}B`, 'AUM']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
              <Bar dataKey="aum" radius={[6, 6, 0, 0]}>
                {clientAumData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Framework Coverage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FRAMEWORKS_LIST.map((fw, i) => {
              const hasReport = REPORT_TYPES.some(r => r.framework === fw || r.framework === 'Multi');
              const hasSub = REG_SUBMISSIONS.some(s => s.regulation.includes(fw.split(' ')[0]));
              return (
                <div key={fw} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 130, fontSize: 12, fontWeight: 600, color: T.navy }}>{fw}</div>
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    <span style={badge(hasReport ? T.green : T.red, hasReport ? '#dcfce7' : '#fef2f2')}>{hasReport ? 'Report' : 'Gap'}</span>
                    <span style={badge(hasSub ? T.green : T.textMut, hasSub ? '#dcfce7' : '#f3f4f6')}>{hasSub ? 'Filing' : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 9. Report Generation Stats ───────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Report Generation Trend</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={MONTHLY_STATS}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            <Area type="monotone" dataKey="reports" stroke={T.navy} fill={`${T.navy}30`} strokeWidth={2} name="Reports" />
            <Area type="monotone" dataKey="errors" stroke={T.red} fill={`${T.red}20`} strokeWidth={2} name="Errors" />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 10. Quality Metrics ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Avg Data Coverage', value: `${avgDataCov}%`, color: T.green },
          { label: 'Avg Gen Time', value: `${avgGenTime} min`, color: T.navy },
          { label: 'Error Rate', value: `${errorRate}%`, color: errorRate < 3 ? T.green : T.red },
          { label: 'SLA Hit Rate', value: '97.2%', color: T.green },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: 16, textAlign: 'center', borderTop: `3px solid ${m.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, textTransform: 'uppercase' }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── 11. Regulatory Compliance by Jurisdiction ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Regulatory Compliance by Jurisdiction</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={jurisPieFlat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, value }) => `${name}: ${value}`}>
                {jurisPieFlat.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Jurisdiction Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {jurisPie.map((j, i) => (
              <div key={j.jurisdiction} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 40, fontSize: 16, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{j.jurisdiction}</div>
                <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                  {j.submitted > 0 && <span style={badge(T.green, '#dcfce7')}>{j.submitted} submitted</span>}
                  {j.pending > 0 && <span style={badge(T.amber, '#fef3c7')}>{j.pending} pending</span>}
                  {j.overdue > 0 && <span style={badge(T.red, '#fef2f2')}>{j.overdue} overdue</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 12. Action Prioritization ────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={sectionTitle}>Action Prioritization</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={select}>
              <option value="All">All Modules</option>
              {MODULES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
            <div style={{ fontSize: 12, color: T.textSec }}>Priority:</div>
            <input type="range" min={0} max={2} value={prioritySlider} onChange={e => setPrioritySlider(+e.target.value)} style={{ width: 80 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{['All', 'Med+', 'High'][prioritySlider]}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredActions.map(a => {
            const done = savedState.completedActions.includes(a.id);
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: done ? '#f0fdf4' : T.bg, borderRadius: 10, borderLeft: `4px solid ${a.priority === 'high' ? T.red : a.priority === 'medium' ? T.amber : T.sage}`, opacity: done ? 0.6 : 1 }}>
                <input type="checkbox" checked={done} onChange={() => toggleActionDone(a.id)} />
                <span style={badge(a.priority === 'high' ? T.red : a.priority === 'medium' ? T.amber : T.sage)}>{a.priority}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, textDecoration: done ? 'line-through' : 'none' }}>{a.action}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{a.module} | Due: {a.due}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 13. Combined Deliverables Table (sortable) ───────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={sectionTitle}>All Deliverables</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ key: 'all', label: 'All' }, { key: 'regulatory', label: 'Regulatory' }, { key: 'client', label: 'Client' }].map(t => (
                <button key={t.key} style={tabBtn(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>
              ))}
            </div>
            <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={input} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['type','name','detail','deadline','status','completion','client'].map(col => (
                  <th key={col} style={thStyle} onClick={() => handleSort(col)}>
                    {col.replace(/\b\w/g, l => l.toUpperCase())}{arrows(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDeliverables.map(d => (
                <tr key={d.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={tdStyle}><span style={badge(d.type === 'Regulatory' ? T.red : T.navy)}>{d.type}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{d.name}</td>
                  <td style={tdStyle}>{d.detail}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{d.deadline}</td>
                  <td style={tdStyle}><span style={statusBadge(d.status)}>{d.status.replace('_', ' ')}</span></td>
                  <td style={tdStyle}>
                    {d.type === 'Regulatory' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.border }}>
                          <div style={{ width: `${d.completion}%`, height: '100%', borderRadius: 3, background: d.completion === 100 ? T.green : d.completion > 50 ? T.gold : T.amber }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{d.completion}%</span>
                      </div>
                    ) : <span style={{ fontSize: 12, color: T.textMut }}>--</span>}
                  </td>
                  <td style={tdStyle}><span style={badge(T.navy)}>{d.client}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: T.textMut }}>Showing {filteredDeliverables.length} deliverables</div>
      </div>

      {/* ── Client Satisfaction & Engagement ────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Client Satisfaction & Engagement</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Client', 'Type', 'Region', 'AUM', 'Satisfaction', 'Reports/Year', 'Frameworks', 'Contact', 'Last Delivery'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c, i) => (
                <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{c.name}</td>
                  <td style={tdStyle}><span style={badge(COLORS[i % COLORS.length])}>{c.type}</span></td>
                  <td style={tdStyle}>{c.region}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtM(c.aum)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 48, height: 6, borderRadius: 3, background: T.border }}>
                        <div style={{ width: `${(c.satisfaction / 5) * 100}%`, height: '100%', borderRadius: 3, background: c.satisfaction >= 4.5 ? T.green : c.satisfaction >= 4.0 ? T.gold : T.amber }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.satisfaction >= 4.5 ? T.green : T.gold }}>{c.satisfaction}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{c.reportsPerYear}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {c.frameworks.map(fw => <span key={fw} style={{ ...badge(T.navy), fontSize: 10, padding: '1px 6px' }}>{fw}</span>)}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{c.contactName}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{c.lastDelivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Report Type Performance Matrix ────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Report Type Performance Matrix</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Report Type', 'Framework', 'Format', 'Avg Gen Time', 'Data Coverage', 'Template', 'Performance'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {REPORT_TYPES.map((r, i) => (
                <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{r.name}</td>
                  <td style={tdStyle}><span style={badge(COLORS[i % COLORS.length])}>{r.framework}</span></td>
                  <td style={tdStyle}><span style={{ ...badge(T.navy), fontSize: 11 }}>{r.format}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{r.avgGenTime} min</span>
                      {r.avgGenTime <= 10 && <span style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>FAST</span>}
                      {r.avgGenTime > 20 && <span style={{ fontSize: 10, color: T.amber, fontWeight: 700 }}>SLOW</span>}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 3, background: T.border }}>
                        <div style={{ width: `${r.dataCoverage}%`, height: '100%', borderRadius: 3, background: r.dataCoverage >= 90 ? T.green : r.dataCoverage >= 75 ? T.gold : T.amber }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.dataCoverage}%</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'monospace' }}>{r.template}</td>
                  <td style={tdStyle}>
                    <span style={badge(r.dataCoverage >= 90 && r.avgGenTime <= 15 ? T.green : r.dataCoverage >= 75 ? T.gold : T.amber)}>
                      {r.dataCoverage >= 90 && r.avgGenTime <= 15 ? 'Excellent' : r.dataCoverage >= 75 ? 'Good' : 'Needs Work'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Client Region Distribution & Report Volume ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Client Region Distribution</div>
          {(() => {
            const regionMap = {};
            CLIENTS.forEach(c => { regionMap[c.region] = (regionMap[c.region] || 0) + 1; });
            const regionData = Object.entries(regionMap).map(([name, value]) => ({ name, value }));
            return (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Annual Report Volume by Client</div>
          {(() => {
            const volData = CLIENTS.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), reports: c.reportsPerYear })).sort((a, b) => b.reports - a.reports);
            return (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="reports" fill={T.gold} radius={[0, 6, 6, 0]}>
                    {volData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* ── Operational Capacity Gauge ────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Operational Capacity Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Report Throughput', current: totalReportsYTD, target: 400, unit: 'reports/yr' },
            { label: 'Client Capacity', current: CLIENTS.length, target: 12, unit: 'clients' },
            { label: 'Template Coverage', current: REPORT_TYPES.length, target: 15, unit: 'templates' },
            { label: 'Submission Pipeline', current: REG_SUBMISSIONS.filter(s => s.status === 'submitted').length, target: REG_SUBMISSIONS.length, unit: 'filings' },
            { label: 'Data Sources', current: 42, target: 50, unit: 'sources' },
          ].map((g, i) => {
            const pctVal = Math.min(100, (g.current / g.target) * 100);
            return (
              <div key={i} style={{ background: T.bg, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, textTransform: 'uppercase' }}>{g.label}</div>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '12px auto' }}>
                  <svg width={80} height={80} viewBox="0 0 80 80">
                    <circle cx={40} cy={40} r={34} fill="none" stroke={T.border} strokeWidth={6} />
                    <circle cx={40} cy={40} r={34} fill="none" stroke={pctVal >= 80 ? T.green : pctVal >= 50 ? T.gold : T.amber} strokeWidth={6}
                      strokeDasharray={`${pctVal * 2.136} ${213.6 - pctVal * 2.136}`} strokeDashoffset={53.4} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: T.navy }}>{pctVal.toFixed(0)}%</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{g.current} / {g.target}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{g.unit}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SLA & Delivery Performance Trend ────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>SLA & Delivery Performance Trend</div>
        {(() => {
          const slaData = MONTHLY_STATS.map((m, i) => ({
            month: m.month,
            onTime: Math.min(100, 92 + Math.floor(sRand(i + 10) * 8)),
            slaTarget: 95,
            avgDeliveryDays: Math.max(1, 5 - Math.floor(sRand(i + 20) * 3)),
          }));
          return (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={slaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[80, 100]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="onTime" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} name="On-Time %" />
                <ReferenceLine y={95} stroke={T.red} strokeDasharray="5 5" label={{ value: 'SLA Target 95%', fill: T.red, fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── Revenue Breakdown by Client Type ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Revenue Breakdown by Client Type</div>
          {(() => {
            const typeMap = {};
            CLIENTS.forEach(c => {
              if (!typeMap[c.type]) typeMap[c.type] = 0;
              typeMap[c.type] += c.aum * 0.0002;
            });
            const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value: +(value / 1e6).toFixed(2) }));
            return (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({ name, value }) => `${name}: $${value}M`}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${v}M`, 'Est. Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Data Coverage by Report Type</div>
          {(() => {
            const covData = REPORT_TYPES.map(r => ({ name: r.name.split(' ').slice(0, 3).join(' '), coverage: r.dataCoverage })).sort((a, b) => b.coverage - a.coverage);
            return (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={covData} layout="vertical" margin={{ left: 110 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Coverage']} />
                  <ReferenceLine x={90} stroke={T.green} strokeDasharray="3 3" />
                  <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                    {covData.map((d, i) => <Cell key={i} fill={d.coverage >= 90 ? T.green : d.coverage >= 75 ? T.gold : T.amber} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* ── Client Engagement Score Cards ─────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Client Engagement Scores</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {CLIENTS.map((c, i) => {
            const engScore = Math.round(c.satisfaction * 18 + c.reportsPerYear * 0.5);
            const tier = engScore >= 90 ? 'Platinum' : engScore >= 75 ? 'Gold' : engScore >= 60 ? 'Silver' : 'Bronze';
            const tierColor = tier === 'Platinum' ? T.navy : tier === 'Gold' ? T.gold : tier === 'Silver' ? T.textSec : T.amber;
            return (
              <div key={c.id} style={{ background: T.bg, borderRadius: 10, padding: 14, borderLeft: `4px solid ${tierColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{c.name.split(' ').slice(0, 2).join(' ')}</div>
                  <span style={badge(tierColor)}>{tier}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{c.region} | {c.type}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border }}>
                    <div style={{ width: `${engScore}%`, height: '100%', borderRadius: 3, background: tierColor }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tierColor }}>{engScore}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{c.frameworks.length} frameworks | {c.reportsPerYear} reports/yr</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Module Health Radar ───────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Module Health Overview</div>
        {(() => {
          const radarData = MODULES.map(m => ({
            module: m.name.split(' ').slice(0, 2).join(' '),
            uptime: 95 + Math.floor(seed(m.id) % 5),
            performance: 80 + Math.floor(seed(m.id + 'p') % 20),
            userSatisfaction: 75 + Math.floor(seed(m.id + 's') % 25),
            dataQuality: 82 + Math.floor(seed(m.id + 'd') % 18),
            throughput: 70 + Math.floor(seed(m.id + 't') % 30),
          }));
          return (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="module" tick={{ fontSize: 11, fill: T.textSec }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[0, 100]} />
                <Radar name="Uptime" dataKey="uptime" stroke={T.navy} fill={`${T.navy}30`} strokeWidth={2} />
                <Radar name="Performance" dataKey="performance" stroke={T.gold} fill={`${T.gold}20`} strokeWidth={2} />
                <Radar name="Data Quality" dataKey="dataQuality" stroke={T.sage} fill={`${T.sage}15`} strokeWidth={2} />
                <Legend />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── 14. Cross-Navigation ─────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Cross-Navigation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Report Generator', path: '/report-generator', color: T.navy },
            { label: 'Template Manager', path: '/template-manager', color: T.gold },
            { label: 'Client Portal', path: '/client-portal', color: T.sage },
            { label: 'Scheduled Reports', path: '/scheduled-reports', color: '#4f46e5' },
            { label: 'Regulatory Tracker', path: '/regulatory-submission', color: T.red },
            { label: 'Report Studio', path: '/advanced-report-studio', color: '#7c3aed' },
            { label: 'Regulatory Calendar', path: '/regulatory-calendar', color: T.amber },
            { label: 'Regulatory Gap', path: '/regulatory-gap', color: '#0891b2' },
          ].map(n => (
            <button key={n.path} style={{ ...card, padding: 14, textAlign: 'center', cursor: 'pointer', borderTop: `3px solid ${n.color}`, background: T.surface, margin: 0 }} onClick={() => navigate(n.path)}>
              <div style={{ fontSize: 13, fontWeight: 700, color: n.color }}>{n.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
