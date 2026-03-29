import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORT = 'ra_portfolio_v1';
const LS_SCHEDULES = 'ra_schedules_v1';
const LS_EXEC_LOG = 'ra_schedule_exec_log_v1';
const LS_NOTIFICATIONS = 'ra_schedule_notifications_v1';

const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const sr = (seed, off = 0) => { let x = Math.sin(Math.abs(seed + off) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const fmtD = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtDT = d => d ? new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/* ══════════════════════════════════════════════════════════════
   CLIENT REFERENCE (mirror from Client Portal)
   ══════════════════════════════════════════════════════════════ */
const CLIENT_MAP = {
  C001: { name:'Nordic Pension Fund', type:'Pension', jurisdiction:'EU', frameworks:['SFDR','TCFD','EU Taxonomy'], sla_days:15 },
  C002: { name:'CalPERS ESG Mandate', type:'Public Pension', jurisdiction:'US', frameworks:['TCFD','PRI','SEC'], sla_days:20 },
  C003: { name:'Swiss Re Insurance', type:'Insurance', jurisdiction:'CH', frameworks:['TCFD','PCAF','TNFD'], sla_days:30 },
  C004: { name:'SEBI Compliance Fund', type:'Mutual Fund', jurisdiction:'IN', frameworks:['BRSR','SEBI ESG'], sla_days:45 },
  C005: { name:'Green Bond Investors Ltd', type:'Asset Manager', jurisdiction:'UK', frameworks:['SFDR','TCFD','GRI','CBI'], sla_days:15 },
  C006: { name:'Tokyo ESG Partners', type:'Family Office', jurisdiction:'JP', frameworks:['ISSB','TCFD'], sla_days:30 },
  C007: { name:'Sovereign Wealth Fund (Abu Dhabi)', type:'SWF', jurisdiction:'AE', frameworks:['TCFD','PRI'], sla_days:60 },
  C008: { name:'Impact Ventures Europe', type:'VC/PE', jurisdiction:'EU', frameworks:['SFDR','EU Taxonomy','EDCI'], sla_days:15 },
};
const clientName = id => (CLIENT_MAP[id] || {}).name || id;

/* ══════════════════════════════════════════════════════════════
   SCHEDULE DATABASE
   ══════════════════════════════════════════════════════════════ */
const REPORT_TYPES = [
  { value:'sfdr_pai', label:'SFDR PAI Statement' },
  { value:'client_quarterly', label:'Client Quarterly Review' },
  { value:'tcfd', label:'TCFD Climate Report' },
  { value:'pcaf', label:'PCAF Financed Emissions' },
  { value:'csrd_e1', label:'CSRD E1 Climate' },
  { value:'csrd_full', label:'CSRD Full Disclosure' },
  { value:'eu_taxonomy', label:'EU Taxonomy Alignment' },
  { value:'brsr', label:'BRSR Annual Report' },
  { value:'tnfd', label:'TNFD Nature Report' },
  { value:'gri', label:'GRI Standards Report' },
  { value:'issb', label:'ISSB S1/S2 Report' },
  { value:'custom', label:'Custom Report' },
];
const TEMPLATES = ['regulatory','client','classic','executive','detailed'];
const FREQUENCIES = ['Weekly','Monthly','Quarterly','Semi-Annual','Annual'];
const FORMATS = ['PDF','HTML','PDF+XBRL','Excel','Interactive'];
const STATUS_COLORS = { scheduled:T.sage, running:T.amber, completed:T.green, failed:T.red, paused:T.textMut, skipped:T.textSec };

const DEFAULT_SCHEDULES = [
  { id:'SCH001', client_id:'C001', report_type:'sfdr_pai', template:'regulatory', frequency:'Annual', next_run:'2025-04-15', last_run:'2025-01-15', status:'scheduled', auto_send:false, recipients:['lars@nordicpension.fi'], format:'HTML', sections:14, data_check:true, sla_buffer:5, created:'2024-06-01' },
  { id:'SCH002', client_id:'C001', report_type:'client_quarterly', template:'client', frequency:'Quarterly', next_run:'2025-04-15', last_run:'2025-01-15', status:'scheduled', auto_send:true, recipients:['lars@nordicpension.fi'], format:'PDF', sections:8, data_check:true, sla_buffer:3, created:'2024-06-01' },
  { id:'SCH003', client_id:'C002', report_type:'tcfd', template:'classic', frequency:'Quarterly', next_run:'2025-04-20', last_run:'2025-01-20', status:'scheduled', auto_send:false, recipients:['schen@calpers.ca.gov'], format:'PDF', sections:12, data_check:true, sla_buffer:5, created:'2024-07-15' },
  { id:'SCH004', client_id:'C003', report_type:'pcaf', template:'regulatory', frequency:'Semi-Annual', next_run:'2025-06-01', last_run:'2024-12-01', status:'scheduled', auto_send:true, recipients:['tmueller@swissre.com'], format:'PDF+XBRL', sections:10, data_check:true, sla_buffer:10, created:'2024-03-01' },
  { id:'SCH005', client_id:'C004', report_type:'brsr', template:'regulatory', frequency:'Annual', next_run:'2026-03-01', last_run:'2025-03-01', status:'scheduled', auto_send:false, recipients:['priya@sebifund.in'], format:'PDF+XBRL', sections:16, data_check:true, sla_buffer:15, created:'2024-01-01' },
  { id:'SCH006', client_id:'C005', report_type:'eu_taxonomy', template:'regulatory', frequency:'Quarterly', next_run:'2025-04-10', last_run:'2025-01-10', status:'scheduled', auto_send:true, recipients:['ewilson@greeninv.co.uk'], format:'PDF', sections:9, data_check:true, sla_buffer:3, created:'2024-09-01' },
  { id:'SCH007', client_id:'C005', report_type:'gri', template:'detailed', frequency:'Annual', next_run:'2025-12-31', last_run:'2024-12-31', status:'scheduled', auto_send:false, recipients:['ewilson@greeninv.co.uk'], format:'HTML', sections:20, data_check:true, sla_buffer:10, created:'2024-01-01' },
  { id:'SCH008', client_id:'C008', report_type:'sfdr_pai', template:'regulatory', frequency:'Quarterly', next_run:'2025-05-01', last_run:'2025-02-01', status:'scheduled', auto_send:true, recipients:['maria@impactvc.eu'], format:'HTML', sections:14, data_check:true, sla_buffer:5, created:'2024-10-01' },
  { id:'SCH009', client_id:'C003', report_type:'tnfd', template:'executive', frequency:'Annual', next_run:'2025-12-01', last_run:null, status:'scheduled', auto_send:false, recipients:['tmueller@swissre.com'], format:'PDF', sections:11, data_check:true, sla_buffer:15, created:'2025-01-15' },
  { id:'SCH010', client_id:'C002', report_type:'issb', template:'regulatory', frequency:'Annual', next_run:'2025-12-31', last_run:null, status:'paused', auto_send:false, recipients:['schen@calpers.ca.gov'], format:'PDF', sections:13, data_check:true, sla_buffer:20, created:'2025-02-01' },
];

/* seed execution log */
const SEED_EXEC_LOG = [
  { schedule_id:'SCH001', timestamp:'2025-01-15T09:30:00', status:'completed', duration_sec:142, report_size_kb:2480, error:null },
  { schedule_id:'SCH002', timestamp:'2025-01-15T10:00:00', status:'completed', duration_sec:88, report_size_kb:1200, error:null },
  { schedule_id:'SCH003', timestamp:'2025-01-20T08:15:00', status:'completed', duration_sec:165, report_size_kb:3100, error:null },
  { schedule_id:'SCH004', timestamp:'2024-12-01T07:00:00', status:'completed', duration_sec:210, report_size_kb:4500, error:null },
  { schedule_id:'SCH005', timestamp:'2025-03-01T06:00:00', status:'completed', duration_sec:320, report_size_kb:8200, error:null },
  { schedule_id:'SCH006', timestamp:'2025-01-10T09:00:00', status:'completed', duration_sec:95, report_size_kb:1800, error:null },
  { schedule_id:'SCH007', timestamp:'2024-12-31T07:30:00', status:'completed', duration_sec:280, report_size_kb:6500, error:null },
  { schedule_id:'SCH008', timestamp:'2025-02-01T08:00:00', status:'completed', duration_sec:135, report_size_kb:2200, error:null },
  { schedule_id:'SCH001', timestamp:'2024-10-15T09:30:00', status:'completed', duration_sec:150, report_size_kb:2400, error:null },
  { schedule_id:'SCH003', timestamp:'2024-10-20T08:20:00', status:'failed', duration_sec:45, report_size_kb:0, error:'Data source timeout — TCFD metrics not available' },
  { schedule_id:'SCH006', timestamp:'2024-10-10T09:00:00', status:'skipped', duration_sec:0, report_size_kb:0, error:'Data quality check failed — Taxonomy alignment data stale' },
];

/* data modules for readiness check */
const DATA_MODULES = [
  { id:'M01', name:'Scope 1 Emissions', last_updated:'2025-03-20', freshness_days:7 },
  { id:'M02', name:'Scope 2 Emissions', last_updated:'2025-03-18', freshness_days:7 },
  { id:'M03', name:'Scope 3 Estimates', last_updated:'2025-03-10', freshness_days:14 },
  { id:'M04', name:'EU Taxonomy Alignment', last_updated:'2025-03-22', freshness_days:30 },
  { id:'M05', name:'PCAF Financed Emissions', last_updated:'2025-03-15', freshness_days:14 },
  { id:'M06', name:'Physical Risk Scores', last_updated:'2025-03-01', freshness_days:30 },
  { id:'M07', name:'Transition Risk Scores', last_updated:'2025-03-05', freshness_days:30 },
  { id:'M08', name:'BRSR Core Metrics', last_updated:'2025-03-23', freshness_days:7 },
  { id:'M09', name:'SFDR PAI Indicators', last_updated:'2025-03-21', freshness_days:7 },
  { id:'M10', name:'Portfolio Holdings', last_updated:'2025-03-25', freshness_days:1 },
  { id:'M11', name:'Company Fundamentals', last_updated:'2025-03-24', freshness_days:7 },
  { id:'M12', name:'GRI Disclosures', last_updated:'2025-02-28', freshness_days:30 },
];

/* ══════════════════════════════════════════════════════════════
   SHARED UI
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20, ...style }}>{children}</div>
);
const Badge = ({ label, color, bg }) => (
  <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, color:color||'#fff', background:bg||T.navy, marginRight:4, marginBottom:2 }}>{label}</span>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:'16px 18px', minWidth:130, flex:1 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, primary, small, danger, disabled, style }) => (
  <button disabled={disabled} onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:6, border:primary||danger?'none':`1px solid ${T.border}`, background:danger?T.red:primary?T.navy:T.surface, color:primary||danger?'#fff':T.text, fontWeight:600, fontSize:small?11:12, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, fontFamily:T.font, ...style }}>{children}</button>
);
const SortHeader = ({ label, field, sortBy, sortDir, onSort, style }) => (
  <th style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:.5, cursor:'pointer', userSelect:'none', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap', ...style }} onClick={() => onSort(field)}>
    {label} {sortBy === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:4, borderBottom:`2px solid ${T.border}`, marginBottom:16, flexWrap:'wrap' }}>
    {tabs.map(t => (
      <div key={t} onClick={() => onChange(t)} style={{ padding:'8px 16px', cursor:'pointer', fontWeight:600, fontSize:13, color:active===t?T.navy:T.textMut, borderBottom:active===t?`2px solid ${T.gold}`:'2px solid transparent', marginBottom:-2, transition:'all .2s' }}>{t}</div>
    ))}
  </div>
);
const Input = ({ label, value, onChange, type, options, placeholder, style, disabled }) => (
  <div style={{ marginBottom:12, ...style }}>
    {label && <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>}
    {options ? (
      <select value={value||''} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
        <option value="">Select...</option>
        {options.map(o => typeof o === 'object' ? <option key={o.value} value={o.value}>{o.label}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type||'text'} value={value||''} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13, opacity:disabled?.6:1 }} />
    )}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   EXPORT HELPERS
   ══════════════════════════════════════════════════════════════ */
const toCSV = (rows, cols) => {
  const hdr = cols.map(c => c.label).join(',');
  const body = rows.map(r => cols.map(c => `"${String(c.get(r)||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  return hdr + '\n' + body;
};
const downloadCSV = (csv, name) => {
  const b = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click();
};
const printPage = () => window.print();

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ScheduledReportsPage() {
  const navigate = useNavigate();
  const portfolio = loadLS(LS_PORT);

  /* ── State ── */
  const [schedules, setSchedules] = useState(() => loadLS(LS_SCHEDULES) || DEFAULT_SCHEDULES);
  const [execLog, setExecLog] = useState(() => loadLS(LS_EXEC_LOG) || SEED_EXEC_LOG);
  const [notifications, setNotifications] = useState(() => loadLS(LS_NOTIFICATIONS) || { report_generated:true, sla_at_risk:true, data_quality:true, failed_gen:true });
  const [tab, setTab] = useState('Dashboard');
  const [sortBy, setSortBy] = useState('next_run');
  const [sortDir, setSortDir] = useState('asc');
  const [logSortBy, setLogSortBy] = useState('timestamp');
  const [logSortDir, setLogSortDir] = useState('desc');
  const [filterClient, setFilterClient] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [slaDaysSlider, setSlaDaysSlider] = useState(90);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  useEffect(() => { saveLS(LS_SCHEDULES, schedules); }, [schedules]);
  useEffect(() => { saveLS(LS_EXEC_LOG, execLog); }, [execLog]);
  useEffect(() => { saveLS(LS_NOTIFICATIONS, notifications); }, [notifications]);

  /* ── Derived ── */
  const now = new Date();
  const activeSchedules = useMemo(() => schedules.filter(s => s.status !== 'paused'), [schedules]);
  const dueThisMonth = useMemo(() => schedules.filter(s => { const d = new Date(s.next_run); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }), [schedules]);
  const dueThisWeek = useMemo(() => schedules.filter(s => { const days = daysBetween(now, new Date(s.next_run)); return days >= 0 && days <= 7; }), [schedules]);
  const overdue = useMemo(() => schedules.filter(s => s.next_run && new Date(s.next_run) < now && s.status === 'scheduled'), [schedules]);
  const autoSendCount = useMemo(() => schedules.filter(s => s.auto_send).length, [schedules]);
  const avgGenTime = useMemo(() => { const completed = execLog.filter(e => e.status === 'completed' && e.duration_sec); return completed.length ? Math.round(completed.reduce((s, e) => s + e.duration_sec, 0) / completed.length) : 0; }, [execLog]);
  const successRate = useMemo(() => { const runs = execLog.filter(e => e.status !== 'skipped'); return runs.length ? Math.round((runs.filter(e => e.status === 'completed').length / runs.length) * 100) : 100; }, [execLog]);
  const totalReportsYear = useMemo(() => schedules.reduce((s, sch) => { const f = { Weekly:52, Monthly:12, Quarterly:4, 'Semi-Annual':2, Annual:1 }; return s + (f[sch.frequency] || 1); }, 0), [schedules]);

  /* ── Filtered + sorted schedules ── */
  const filtered = useMemo(() => {
    let res = [...schedules];
    if (filterClient !== 'All') res = res.filter(s => s.client_id === filterClient);
    if (filterStatus !== 'All') res = res.filter(s => s.status === filterStatus);
    res.sort((a, b) => { let va = a[sortBy] || '', vb = b[sortBy] || ''; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
    return res;
  }, [schedules, filterClient, filterStatus, sortBy, sortDir]);

  const handleSort = useCallback((f) => { setSortBy(prev => { if (prev === f) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return f; } setSortDir('asc'); return f; }); }, []);
  const handleLogSort = useCallback((f) => { setLogSortBy(prev => { if (prev === f) { setLogSortDir(d => d === 'asc' ? 'desc' : 'asc'); return f; } setLogSortDir('desc'); return f; }); }, []);

  /* ── Sorted exec log ── */
  const sortedLog = useMemo(() => {
    let res = execLog.map(e => ({ ...e, clientName: clientName(schedules.find(s => s.id === e.schedule_id)?.client_id || ''), reportType: (REPORT_TYPES.find(r => r.value === (schedules.find(s => s.id === e.schedule_id) || {}).report_type) || {}).label || '' }));
    return res.sort((a, b) => { let va = a[logSortBy] || '', vb = b[logSortBy] || ''; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return logSortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
  }, [execLog, schedules, logSortBy, logSortDir]);

  /* ── Calendar data ── */
  const calendarData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, i) => {
      const scheds = schedules.filter(s => new Date(s.next_run).getMonth() === i);
      const clients = {};
      scheds.forEach(s => { clients[s.client_id] = (clients[s.client_id] || 0) + 1; });
      return { month: m, total: scheds.length, ...Object.fromEntries(Object.entries(clients).map(([k, v]) => [clientName(k), v])) };
    });
  }, [schedules]);

  /* ── Data readiness ── */
  const dataReadiness = useMemo(() => DATA_MODULES.map(m => {
    const daysSince = daysBetween(new Date(m.last_updated), now);
    const fresh = daysSince <= m.freshness_days;
    return { ...m, daysSince, fresh, pct: Math.min(100, Math.max(0, Math.round(((m.freshness_days - daysSince) / m.freshness_days) * 100))) };
  }), []);

  /* ── SLA dashboard ── */
  const slaDash = useMemo(() => schedules.filter(s => s.next_run && s.status === 'scheduled').map(s => {
    const client = CLIENT_MAP[s.client_id] || {};
    const days = daysBetween(now, new Date(s.next_run));
    const slaTarget = client.sla_days || 30;
    const buffer = s.sla_buffer || 5;
    const risk = days < 0 ? 'overdue' : days <= buffer ? 'at_risk' : 'safe';
    return { ...s, clientName: clientName(s.client_id), days, slaTarget, buffer, risk, reportLabel: (REPORT_TYPES.find(r => r.value === s.report_type) || {}).label || s.report_type };
  }).filter(s => s.days <= slaDaysSlider).sort((a, b) => a.days - b.days), [schedules, slaDaysSlider]);

  /* ── Actions ── */
  const runNow = useCallback((schedId) => {
    const entry = { schedule_id: schedId, timestamp: new Date().toISOString(), status: 'completed', duration_sec: Math.round(60 + sr(_sc++) * 200), report_size_kb: Math.round(1000 + sr(_sc++) * 5000), error: null };
    setExecLog(prev => [entry, ...prev]);
    setSchedules(prev => prev.map(s => s.id === schedId ? { ...s, last_run: new Date().toISOString(), status: 'scheduled' } : s));
  }, []);

  const togglePause = useCallback((schedId) => {
    setSchedules(prev => prev.map(s => s.id === schedId ? { ...s, status: s.status === 'paused' ? 'scheduled' : 'paused' } : s));
  }, []);

  const deleteSchedule = useCallback((schedId) => {
    setSchedules(prev => prev.filter(s => s.id !== schedId));
  }, []);

  const saveSchedule = useCallback((sch) => {
    setSchedules(prev => {
      const idx = prev.findIndex(s => s.id === sch.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = sch; return next; }
      return [...prev, sch];
    });
    setShowCreateForm(false); setEditSchedule(null);
  }, []);

  const batchRunDue = useCallback(() => { dueThisWeek.forEach(s => runNow(s.id)); }, [dueThisWeek, runNow]);
  const batchPauseAll = useCallback(() => { setSchedules(prev => prev.map(s => ({ ...s, status:'paused' }))); }, []);
  const batchResumeAll = useCallback(() => { setSchedules(prev => prev.map(s => s.status === 'paused' ? { ...s, status:'scheduled' } : s)); }, []);

  /* ── Export ── */
  const exportScheduleCSV = useCallback(() => {
    const cols = [
      { label:'ID', get:r=>r.id }, { label:'Client', get:r=>clientName(r.client_id) },
      { label:'Report Type', get:r=>(REPORT_TYPES.find(t=>t.value===r.report_type)||{}).label||r.report_type },
      { label:'Template', get:r=>r.template }, { label:'Frequency', get:r=>r.frequency },
      { label:'Next Run', get:r=>r.next_run }, { label:'Last Run', get:r=>r.last_run },
      { label:'Status', get:r=>r.status }, { label:'Format', get:r=>r.format }, { label:'Auto-Send', get:r=>r.auto_send?'Yes':'No' },
    ];
    downloadCSV(toCSV(filtered, cols), `schedules_${new Date().toISOString().slice(0,10)}.csv`);
  }, [filtered]);

  const exportLogCSV = useCallback(() => {
    const cols = [
      { label:'Schedule', get:r=>r.schedule_id }, { label:'Client', get:r=>r.clientName },
      { label:'Report', get:r=>r.reportType }, { label:'Timestamp', get:r=>r.timestamp },
      { label:'Status', get:r=>r.status }, { label:'Duration (s)', get:r=>r.duration_sec },
      { label:'Size (KB)', get:r=>r.report_size_kb }, { label:'Error', get:r=>r.error||'' },
    ];
    downloadCSV(toCSV(sortedLog, cols), `execution_log_${new Date().toISOString().slice(0,10)}.csv`);
  }, [sortedLog]);

  const TABS = ['Dashboard','Schedules','Create','Execution Log','SLA','Data Readiness','Notifications','Batch Ops','Calendar'];

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.text }}>
      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:700, color:T.navy, margin:0 }}>Scheduled Report Automation</h1>
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            <Badge label="Auto-Generate" bg={T.sage} />
            <Badge label="SLA" bg={T.gold} color={T.navy} />
            <Badge label="Multi-Client" bg={T.navy} />
            <Badge label="Calendar" bg={T.navyL} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn small onClick={exportScheduleCSV}>Export Schedules CSV</Btn>
          <Btn small onClick={exportLogCSV}>Export Log CSV</Btn>
          <Btn small onClick={printPage}>Print</Btn>
          <Btn small onClick={() => navigate('/report-generator')}>Report Generator</Btn>
          <Btn small onClick={() => navigate('/client-portal')}>Client Portal</Btn>
          <Btn small onClick={() => navigate('/template-manager')}>Templates</Btn>
          <Btn small onClick={() => navigate('/regulatory-calendar')}>Reg Calendar</Btn>
        </div>
      </div>

      {/* ── 8 KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KPI label="Active Schedules" value={activeSchedules.length} sub={`${schedules.length} total`} color={T.navy} />
        <KPI label="Due This Month" value={dueThisMonth.length} sub={`${dueThisMonth.filter(s=>s.auto_send).length} auto-send`} color={T.gold} />
        <KPI label="Due This Week" value={dueThisWeek.length} sub={dueThisWeek.length > 0 ? 'Action needed' : 'Clear'} color={T.amber} />
        <KPI label="Overdue" value={overdue.length} sub={overdue.length > 0 ? 'Requires attention' : 'None'} color={overdue.length > 0 ? T.red : T.green} />
        <KPI label="Auto-Send Enabled" value={autoSendCount} sub={`${Math.round((autoSendCount/schedules.length)*100)}% of schedules`} color={T.sage} />
        <KPI label="Avg Gen Time" value={`${avgGenTime}s`} sub={`${(avgGenTime/60).toFixed(1)} min`} color={T.textSec} />
        <KPI label="Success Rate" value={`${successRate}%`} sub={`${execLog.filter(e=>e.status==='completed').length} successful`} color={successRate >= 95 ? T.green : T.amber} />
        <KPI label="Total Reports/Year" value={totalReportsYear} sub={`Across ${schedules.length} schedules`} color={T.navyL} />
      </div>

      {/* ── TAB BAR ── */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ════════════════════════════ DASHBOARD ════════════════════════════ */}
      {tab === 'Dashboard' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Calendar mini */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Schedule Calendar Overview</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={calendarData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="month" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} /><Tooltip /><Bar dataKey="total" fill={T.navy} radius={[4,4,0,0]}>{calendarData.map((d, i) => <Cell key={i} fill={i === now.getMonth() ? T.gold : T.navy} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Success rate trend */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Execution Success Rate</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[{ name:'Completed', value:execLog.filter(e=>e.status==='completed').length }, { name:'Failed', value:execLog.filter(e=>e.status==='failed').length }, { name:'Skipped', value:execLog.filter(e=>e.status==='skipped').length }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  <Cell fill={T.green} /><Cell fill={T.red} /><Cell fill={T.textMut} />
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Upcoming this week */}
          <Card style={{ gridColumn:'1 / -1' }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Due This Week ({dueThisWeek.length})</div>
            {dueThisWeek.length === 0 && <div style={{ fontSize:13, color:T.textMut }}>No reports due this week.</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260, 1fr))', gap:10 }}>
              {dueThisWeek.map(s => (
                <div key={s.id} style={{ background:T.surfaceH, borderRadius:8, padding:12, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{clientName(s.client_id)}</div>
                  <div style={{ fontSize:12, color:T.textSec }}>{(REPORT_TYPES.find(r=>r.value===s.report_type)||{}).label} | {s.format}</div>
                  <div style={{ fontSize:11, color:T.amber, fontWeight:600, marginTop:4 }}>Due: {fmtD(s.next_run)} ({daysBetween(now, new Date(s.next_run))}d)</div>
                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                    <Btn small primary onClick={() => runNow(s.id)}>Run Now</Btn>
                    <Btn small onClick={() => togglePause(s.id)}>{s.status==='paused'?'Resume':'Pause'}</Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════ SCHEDULE LIST ════════════════════════════ */}
      {tab === 'Schedules' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>All Schedules</div>
            <Btn small primary onClick={() => { setEditSchedule(null); setShowCreateForm(true); setTab('Create'); }}>+ New Schedule</Btn>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}>
              <option value="All">All Clients</option>
              {Object.entries(CLIENT_MAP).map(([id, c]) => <option key={id} value={id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}>
              <option value="All">All Status</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <SortHeader label="Client" field="client_id" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Report" field="report_type" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Template" field="template" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Frequency" field="frequency" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Next Run" field="next_run" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Last Run" field="last_run" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Format" field="format" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <th style={{ padding:'10px 12px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const days = s.next_run ? daysBetween(now, new Date(s.next_run)) : null;
                  return (
                    <tr key={s.id} style={{ transition:'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{clientName(s.client_id)}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{(REPORT_TYPES.find(r=>r.value===s.report_type)||{}).label || s.report_type}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}><Badge label={s.template} bg={T.surfaceH} color={T.navy} /></td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{s.frequency}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}`, color:days!=null&&days<0?T.red:days!=null&&days<=7?T.amber:T.textSec, fontWeight:600 }}>{fmtD(s.next_run)}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{fmtD(s.last_run)}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}><Badge label={s.status} bg={STATUS_COLORS[s.status]} /></td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{s.format}</td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <Btn small primary onClick={() => runNow(s.id)}>Run</Btn>
                          <Btn small onClick={() => togglePause(s.id)}>{s.status==='paused'?'Resume':'Pause'}</Btn>
                          <Btn small onClick={() => { setEditSchedule(s); setTab('Create'); }}>Edit</Btn>
                          <Btn small danger onClick={() => deleteSchedule(s.id)}>Del</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Showing {filtered.length} of {schedules.length} schedules</div>
        </Card>
      )}

      {/* ════════════════════════════ CREATE / EDIT FORM ════════════════════════════ */}
      {tab === 'Create' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>{editSchedule ? 'Edit Schedule' : 'Create New Schedule'}</div>
          <ScheduleForm schedule={editSchedule} onSave={saveSchedule} onCancel={() => { setShowCreateForm(false); setEditSchedule(null); setTab('Schedules'); }} />
        </Card>
      )}

      {/* ════════════════════════════ EXECUTION LOG ════════════════════════════ */}
      {tab === 'Execution Log' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Schedule Execution Log</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <SortHeader label="Schedule" field="schedule_id" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <SortHeader label="Client" field="clientName" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <SortHeader label="Report" field="reportType" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <SortHeader label="Timestamp" field="timestamp" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <SortHeader label="Status" field="status" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <SortHeader label="Duration" field="duration_sec" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <SortHeader label="Size (KB)" field="report_size_kb" sortBy={logSortBy} sortDir={logSortDir} onSort={handleLogSort} />
                  <th style={{ padding:'10px 12px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {sortedLog.map((e, i) => (
                  <tr key={i} style={{ transition:'background .15s' }} onMouseEnter={ev => ev.currentTarget.style.background = T.surfaceH} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'10px 12px', fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{e.schedule_id}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{e.clientName}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{e.reportType}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{fmtDT(e.timestamp)}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}><Badge label={e.status} bg={STATUS_COLORS[e.status]} /></td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{e.duration_sec ? `${e.duration_sec}s` : '—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{e.report_size_kb ? `${(e.report_size_kb/1024).toFixed(1)}MB` : '—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:11, borderBottom:`1px solid ${T.border}`, color:T.red, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ════════════════════════════ SLA DASHBOARD ════════════════════════════ */}
      {tab === 'SLA' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>SLA Dashboard</div>
            <div style={{ fontSize:11, color:T.textMut }}>Showing next {slaDaysSlider} days</div>
          </div>
          <div style={{ marginBottom:14 }}>
            <input type="range" min={7} max={365} value={slaDaysSlider} onChange={e => setSlaDaysSlider(Number(e.target.value))} style={{ width:'100%' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300, 1fr))', gap:12 }}>
            {slaDash.map(s => {
              const pct = s.slaTarget ? Math.min(100, Math.max(0, (s.days / s.slaTarget) * 100)) : 50;
              const riskColor = s.risk === 'overdue' ? T.red : s.risk === 'at_risk' ? T.amber : T.green;
              return (
                <div key={s.id} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{s.clientName}</div>
                    <Badge label={s.risk === 'overdue' ? 'OVERDUE' : s.risk === 'at_risk' ? 'AT RISK' : 'ON TRACK'} bg={riskColor} />
                  </div>
                  <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>{s.reportLabel} | {s.frequency}</div>
                  <div style={{ fontSize:12, marginBottom:4 }}>
                    <span style={{ color:T.textMut }}>Due:</span> <strong>{fmtD(s.next_run)}</strong> | <span style={{ color:riskColor, fontWeight:700 }}>{s.days}d remaining</span>
                  </div>
                  <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>SLA Target: {s.slaTarget}d | Buffer: {s.buffer}d</div>
                  <div style={{ height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:riskColor, borderRadius:4, transition:'width .5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {slaDash.length === 0 && <div style={{ fontSize:13, color:T.textMut, textAlign:'center', padding:20 }}>No schedules in this time range.</div>}
        </Card>
      )}

      {/* ════════════════════════════ DATA READINESS ════════════════════════════ */}
      {tab === 'Data Readiness' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Data Readiness Check</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:14 }}>Module data freshness required before scheduled report generation.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260, 1fr))', gap:12 }}>
            {dataReadiness.map(m => (
              <div key={m.id} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${m.fresh ? T.border : T.red}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{m.name}</div>
                  <Badge label={m.fresh ? 'FRESH' : 'STALE'} bg={m.fresh ? T.green : T.red} />
                </div>
                <div style={{ fontSize:12, color:T.textMut, marginBottom:4 }}>Last Updated: {fmtD(m.last_updated)} ({m.daysSince}d ago)</div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Max Age: {m.freshness_days} days</div>
                <div style={{ height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.max(0, m.pct)}%`, background:m.fresh ? T.green : T.red, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, padding:12, background:T.surfaceH, borderRadius:8, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:6 }}>Summary</div>
            <div style={{ fontSize:12 }}>
              <span style={{ color:T.green, fontWeight:600 }}>{dataReadiness.filter(m=>m.fresh).length} Fresh</span> | <span style={{ color:T.red, fontWeight:600 }}>{dataReadiness.filter(m=>!m.fresh).length} Stale</span> | Total: {dataReadiness.length} modules
            </div>
            {dataReadiness.filter(m=>!m.fresh).length > 0 && (
              <div style={{ fontSize:12, color:T.red, marginTop:6 }}>
                Stale modules: {dataReadiness.filter(m=>!m.fresh).map(m=>m.name).join(', ')}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ════════════════════════════ NOTIFICATIONS ════════════════════════════ */}
      {tab === 'Notifications' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Notification Settings</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:14 }}>Configure email alerts for schedule events.</div>
          {[
            { key:'report_generated', label:'Report Generated', desc:'Receive notification when a scheduled report is successfully generated.' },
            { key:'sla_at_risk', label:'SLA At Risk', desc:'Alert when a report deadline is approaching within buffer window.' },
            { key:'data_quality', label:'Data Quality Issue', desc:'Warn when required data modules are stale before scheduled generation.' },
            { key:'failed_gen', label:'Failed Generation', desc:'Alert when a scheduled report generation fails.' },
          ].map(n => (
            <div key={n.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:14, background:T.surfaceH, borderRadius:8, marginBottom:8, border:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{n.label}</div>
                <div style={{ fontSize:12, color:T.textSec }}>{n.desc}</div>
              </div>
              <div onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))} style={{ width:48, height:26, borderRadius:13, background:notifications[n.key] ? T.green : T.border, cursor:'pointer', position:'relative', transition:'background .2s' }}>
                <div style={{ width:22, height:22, borderRadius:11, background:'#fff', position:'absolute', top:2, left:notifications[n.key] ? 24 : 2, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.15)' }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ════════════════════════════ BATCH OPERATIONS ════════════════════════════ */}
      {tab === 'Batch Ops' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Batch Operations</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:20, textAlign:'center', border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:36, marginBottom:8 }}>{dueThisWeek.length}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:10 }}>Due This Week</div>
              <Btn primary onClick={batchRunDue} disabled={dueThisWeek.length === 0}>Run All Due This Week</Btn>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:20, textAlign:'center', border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:36, marginBottom:8 }}>{activeSchedules.length}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:10 }}>Active Schedules</div>
              <Btn danger onClick={batchPauseAll}>Pause All</Btn>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:20, textAlign:'center', border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:36, marginBottom:8 }}>{schedules.filter(s=>s.status==='paused').length}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:10 }}>Paused Schedules</div>
              <Btn primary onClick={batchResumeAll} disabled={schedules.filter(s=>s.status==='paused').length === 0}>Resume All</Btn>
            </div>
          </div>
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Regulatory Deadline Integration</div>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:10 }}>Pull from Regulatory Calendar to auto-create schedules for regulatory reports.</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240, 1fr))', gap:8 }}>
              {[
                { framework:'SFDR PAI', deadline:'30 Jun', auto:true },
                { framework:'CSRD E1', deadline:'31 Mar', auto:true },
                { framework:'EU Taxonomy', deadline:'30 Jun', auto:false },
                { framework:'BRSR', deadline:'31 Mar', auto:true },
                { framework:'TCFD', deadline:'Quarterly', auto:false },
              ].map((rd, i) => (
                <div key={i} style={{ padding:10, background:T.surface, borderRadius:6, border:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{rd.framework}</div>
                    <div style={{ fontSize:11, color:T.textMut }}>Deadline: {rd.deadline}</div>
                  </div>
                  <Badge label={rd.auto ? 'Auto-Sched' : 'Manual'} bg={rd.auto ? T.sage : T.textMut} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════════════════ CALENDAR ════════════════════════════ */}
      {tab === 'Calendar' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>Schedule Calendar</div>
            <div style={{ display:'flex', gap:6 }}>
              <Btn small onClick={() => setCalendarMonth(p => Math.max(0, p - 1))}>&lt; Prev</Btn>
              <span style={{ padding:'5px 12px', fontSize:13, fontWeight:600, color:T.navy }}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'][calendarMonth]} 2025
              </span>
              <Btn small onClick={() => setCalendarMonth(p => Math.min(11, p + 1))}>Next &gt;</Btn>
            </div>
          </div>
          {/* month grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} style={{ padding:6, textAlign:'center', fontSize:11, fontWeight:700, color:T.textMut }}>{d}</div>
            ))}
            {(() => {
              const firstDay = new Date(2025, calendarMonth, 1).getDay();
              const offset = firstDay === 0 ? 6 : firstDay - 1;
              const daysInMonth = new Date(2025, calendarMonth + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `2025-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const scheds = schedules.filter(s => s.next_run && s.next_run.startsWith(dateStr));
                cells.push(
                  <div key={d} style={{ padding:6, minHeight:60, background:scheds.length > 0 ? T.surfaceH : 'transparent', borderRadius:6, border:`1px solid ${scheds.length > 0 ? T.gold : T.border}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.navy, marginBottom:2 }}>{d}</div>
                    {scheds.map(s => (
                      <div key={s.id} style={{ fontSize:9, padding:'1px 4px', background:T.navy, color:'#fff', borderRadius:3, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {clientName(s.client_id).slice(0, 10)}
                      </div>
                    ))}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
          {/* legend below */}
          <div style={{ marginTop:14, fontSize:12, color:T.textSec }}>
            Schedules this month: <strong>{schedules.filter(s => new Date(s.next_run).getMonth() === calendarMonth).length}</strong>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCHEDULE FORM
   ══════════════════════════════════════════════════════════════ */
function ScheduleForm({ schedule, onSave, onCancel }) {
  const [form, setForm] = useState(() => schedule || {
    id: `SCH${String(Date.now()).slice(-3)}`,
    client_id: '', report_type: '', template: 'regulatory', frequency: 'Quarterly',
    next_run: '', last_run: null, status: 'scheduled', auto_send: false,
    recipients: [], format: 'PDF', sections: 10, data_check: true,
    sla_buffer: 5, created: new Date().toISOString().slice(0, 10),
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <Input label="Client" value={form.client_id} onChange={v => set('client_id', v)} options={Object.entries(CLIENT_MAP).map(([id, c]) => ({ value:id, label:c.name }))} />
      <Input label="Report Type" value={form.report_type} onChange={v => set('report_type', v)} options={REPORT_TYPES} />
      <Input label="Template" value={form.template} onChange={v => set('template', v)} options={TEMPLATES} />
      <Input label="Frequency" value={form.frequency} onChange={v => set('frequency', v)} options={FREQUENCIES} />
      <Input label="Start / Next Run Date" type="date" value={form.next_run ? form.next_run.slice(0, 10) : ''} onChange={v => set('next_run', v)} />
      <Input label="Format" value={form.format} onChange={v => set('format', v)} options={FORMATS} />
      <Input label="SLA Buffer (days)" type="number" value={form.sla_buffer} onChange={v => set('sla_buffer', Number(v))} />
      <Input label="Sections Count" type="number" value={form.sections} onChange={v => set('sections', Number(v))} />
      <Input label="Recipients (comma-separated)" value={(form.recipients || []).join(', ')} onChange={v => set('recipients', v.split(',').map(s => s.trim()).filter(Boolean))} style={{ gridColumn:'1 / -1' }} />
      <div style={{ display:'flex', gap:20, alignItems:'center', gridColumn:'1 / -1' }}>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
          <input type="checkbox" checked={form.auto_send} onChange={e => set('auto_send', e.target.checked)} />
          Auto-Send on Generation
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
          <input type="checkbox" checked={form.data_check} onChange={e => set('data_check', e.target.checked)} />
          Data Quality Check Before Run
        </label>
      </div>
      <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn primary onClick={() => onSave(form)} disabled={!form.client_id || !form.report_type}>Save Schedule</Btn>
      </div>
    </div>
  );
}
