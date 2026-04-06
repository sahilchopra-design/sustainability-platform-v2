import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  AreaChart, Area, PieChart, Pie, Legend, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORT = 'ra_portfolio_v1';
const LS_CLIENTS = 'ra_clients_v1';
const LS_NOTES = 'ra_client_notes_v1';
const LS_DELIVERY = 'ra_delivery_log_v1';

const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const sr = (seed, off = 0) => { let x = Math.sin(seed + off + 1) * 10000; return x - Math.floor(x); };
const fmtD = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtN = n => n == null ? '—' : typeof n === 'number' ? n.toLocaleString() : n;
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/* ══════════════════════════════════════════════════════════════
   CLIENT DATABASE
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_CLIENTS = [
  { id:'C001', name:'Nordic Pension Fund', type:'Pension', aum_bn:85, contact:'Lars Eriksson', email:'lars@nordicpension.fi', jurisdiction:'EU', frameworks:['SFDR','TCFD','EU Taxonomy'], sfdr_article:'Article 9', reporting_frequency:'Quarterly', last_report:'2025-01-15', next_due:'2025-04-15', status:'Active', portfolios:['Nordic ESG Leaders'], satisfaction:92, reports_delivered:12, sla_days:15, fee_bps:3.2 },
  { id:'C002', name:'CalPERS ESG Mandate', type:'Public Pension', aum_bn:52, contact:'Sarah Chen', email:'schen@calpers.ca.gov', jurisdiction:'US', frameworks:['TCFD','PRI','SEC'], sfdr_article:null, reporting_frequency:'Quarterly', last_report:'2025-01-20', next_due:'2025-04-20', status:'Active', portfolios:['US Climate Transition'], satisfaction:88, reports_delivered:8, sla_days:20, fee_bps:2.5 },
  { id:'C003', name:'Swiss Re Insurance', type:'Insurance', aum_bn:120, contact:'Thomas Mueller', email:'tmueller@swissre.com', jurisdiction:'CH', frameworks:['TCFD','PCAF','TNFD'], sfdr_article:null, reporting_frequency:'Semi-Annual', last_report:'2024-12-01', next_due:'2025-06-01', status:'Active', portfolios:['Global Multi-Asset'], satisfaction:95, reports_delivered:6, sla_days:30, fee_bps:2.0 },
  { id:'C004', name:'SEBI Compliance Fund', type:'Mutual Fund', aum_bn:8, contact:'Priya Sharma', email:'priya@sebifund.in', jurisdiction:'IN', frameworks:['BRSR','SEBI ESG'], sfdr_article:null, reporting_frequency:'Annual', last_report:'2025-03-01', next_due:'2026-03-01', status:'Active', portfolios:['India ESG 50'], satisfaction:85, reports_delivered:3, sla_days:45, fee_bps:4.0 },
  { id:'C005', name:'Green Bond Investors Ltd', type:'Asset Manager', aum_bn:15, contact:'Emma Wilson', email:'ewilson@greeninv.co.uk', jurisdiction:'UK', frameworks:['SFDR','TCFD','GRI','CBI'], sfdr_article:'Article 8+', reporting_frequency:'Quarterly', last_report:'2025-01-10', next_due:'2025-04-10', status:'Active', portfolios:['Global Green Bonds'], satisfaction:90, reports_delivered:10, sla_days:15, fee_bps:3.5 },
  { id:'C006', name:'Tokyo ESG Partners', type:'Family Office', aum_bn:3, contact:'Kenji Tanaka', email:'ktanaka@tokyoesg.jp', jurisdiction:'JP', frameworks:['ISSB','TCFD'], sfdr_article:null, reporting_frequency:'Semi-Annual', last_report:null, next_due:null, status:'Onboarding', portfolios:[], satisfaction:null, reports_delivered:0, sla_days:30, fee_bps:5.0 },
  { id:'C007', name:'Sovereign Wealth Fund (Abu Dhabi)', type:'SWF', aum_bn:250, contact:'Ahmed Al-Rashid', email:'ahmed@adswf.ae', jurisdiction:'AE', frameworks:['TCFD','PRI'], sfdr_article:null, reporting_frequency:'Annual', last_report:null, next_due:null, status:'Prospect', portfolios:[], satisfaction:null, reports_delivered:0, sla_days:60, fee_bps:1.5 },
  { id:'C008', name:'Impact Ventures Europe', type:'VC/PE', aum_bn:2, contact:'Maria Garcia', email:'maria@impactvc.eu', jurisdiction:'EU', frameworks:['SFDR','EU Taxonomy','EDCI'], sfdr_article:'Article 9', reporting_frequency:'Quarterly', last_report:'2025-02-01', next_due:'2025-05-01', status:'Active', portfolios:['EU Impact Fund'], satisfaction:91, reports_delivered:5, sla_days:15, fee_bps:6.0 },
];

const ALL_FRAMEWORKS = ['SFDR','TCFD','EU Taxonomy','PRI','SEC','PCAF','TNFD','BRSR','SEBI ESG','GRI','CBI','ISSB','EDCI','CSRD'];
const CLIENT_TYPES = ['Pension','Public Pension','Insurance','Mutual Fund','Asset Manager','Family Office','SWF','VC/PE','Endowment','Foundation'];
const STATUS_COLORS = { Active:T.green, Onboarding:T.amber, Prospect:T.navyL, Churned:T.red };
const FREQ_OPTIONS = ['Weekly','Monthly','Quarterly','Semi-Annual','Annual'];
const JURISDICTIONS = ['EU','US','UK','CH','IN','JP','AE','SG','AU','CA','BR'];
const KANBAN_COLS = ['Prospect','Onboarding','Active','Renewal'];

/* delivery log seed */
const SEED_DELIVERY = [
  { client_id:'C001', report:'SFDR PAI Statement Q4-2024', date:'2025-01-15', format:'PDF', sla_met:true, satisfaction:94 },
  { client_id:'C001', report:'EU Taxonomy Alignment Q4', date:'2025-01-15', format:'HTML', sla_met:true, satisfaction:91 },
  { client_id:'C002', report:'TCFD Climate Report Q4-2024', date:'2025-01-20', format:'PDF', sla_met:true, satisfaction:88 },
  { client_id:'C003', report:'PCAF Financed Emissions H2-2024', date:'2024-12-01', format:'PDF', sla_met:true, satisfaction:96 },
  { client_id:'C004', report:'BRSR Annual Report FY2025', date:'2025-03-01', format:'PDF+XBRL', sla_met:true, satisfaction:85 },
  { client_id:'C005', report:'Green Bond Impact Report Q4', date:'2025-01-10', format:'PDF', sla_met:true, satisfaction:90 },
  { client_id:'C005', report:'CBI Verification Q4', date:'2025-01-12', format:'PDF', sla_met:false, satisfaction:82 },
  { client_id:'C008', report:'SFDR Article 9 Periodic Q4', date:'2025-02-01', format:'HTML', sla_met:true, satisfaction:91 },
];

/* ══════════════════════════════════════════════════════════════
   HELPERS / SHARED UI
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20, ...style }}>{children}</div>
);
const Badge = ({ label, color, bg }) => (
  <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, color:color||T.surface, background:bg||T.navy, marginRight:4, marginBottom:2 }}>{label}</span>
);
const SortHeader = ({ label, field, sortBy, sortDir, onSort, style }) => (
  <th style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:.5, cursor:'pointer', userSelect:'none', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap', ...style }} onClick={() => onSort(field)}>
    {label} {sortBy === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:'16px 18px', minWidth:140, flex:1 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, primary, small, disabled, style }) => (
  <button disabled={disabled} onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:6, border:primary?'none':`1px solid ${T.border}`, background:primary?T.navy:T.surface, color:primary?'#fff':T.text, fontWeight:600, fontSize:small?11:12, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, fontFamily:T.font, ...style }}>{children}</button>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:4, borderBottom:`2px solid ${T.border}`, marginBottom:16 }}>
    {tabs.map(t => (
      <div key={t} onClick={() => onChange(t)} style={{ padding:'8px 18px', cursor:'pointer', fontWeight:600, fontSize:13, color:active===t?T.navy:T.textMut, borderBottom:active===t?`2px solid ${T.gold}`:'2px solid transparent', marginBottom:-2, transition:'all .2s' }}>{t}</div>
    ))}
  </div>
);
const Input = ({ label, value, onChange, type, options, placeholder, style, textarea }) => (
  <div style={{ marginBottom:12, ...style }}>
    {label && <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>}
    {options ? (
      <select value={value||''} onChange={e => onChange(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : textarea ? (
      <textarea value={value||''} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13, resize:'vertical' }} />
    ) : (
      <input type={type||'text'} value={value||''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }} />
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
export default function ClientPortalPage() {
  const navigate = useNavigate();
  const portfolio = loadLS(LS_PORT);

  /* ── State ── */
  const [clients, setClients] = useState(() => loadLS(LS_CLIENTS) || DEFAULT_CLIENTS);
  const [notes, setNotes] = useState(() => loadLS(LS_NOTES) || {});
  const [deliveryLog] = useState(SEED_DELIVERY);
  const [tab, setTab] = useState('Dashboard');
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [deliverySortBy, setDeliverySortBy] = useState('date');
  const [deliverySortDir, setDeliverySortDir] = useState('desc');
  const [satisfactionSlider, setSatisfactionSlider] = useState(0);

  useEffect(() => { saveLS(LS_CLIENTS, clients); }, [clients]);
  useEffect(() => { saveLS(LS_NOTES, notes); }, [notes]);

  /* ── Derived ── */
  const activeClients = useMemo(() => clients.filter(c => c.status === 'Active'), [clients]);
  const totalAUM = useMemo(() => clients.reduce((s, c) => s + (c.aum_bn || 0), 0), [clients]);
  const totalReportsYTD = useMemo(() => clients.reduce((s, c) => s + (c.reports_delivered || 0), 0), [clients]);
  const avgSatisfaction = useMemo(() => { const sc = clients.filter(c => c.satisfaction); return sc.length ? Math.round(sc.reduce((s, c) => s + c.satisfaction, 0) / sc.length) : 0; }, [clients]);
  const frameworkSet = useMemo(() => new Set(clients.flatMap(c => c.frameworks || [])), [clients]);
  const typeSet = useMemo(() => new Set(clients.map(c => c.type)), [clients]);
  const onboarding = useMemo(() => clients.filter(c => c.status === 'Onboarding').length, [clients]);
  const estRevenue = useMemo(() => clients.reduce((s, c) => s + ((c.aum_bn || 0) * (c.fee_bps || 3) * 10000), 0), [clients]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return clients.filter(c => c.next_due && new Date(c.next_due) > now).sort((a, b) => new Date(a.next_due) - new Date(b.next_due));
  }, [clients]);

  const slaCompliance = useMemo(() => {
    const withSla = deliveryLog.filter(d => d.sla_met !== undefined);
    return withSla.length ? Math.round((withSla.filter(d => d.sla_met).length / withSla.length) * 100) : 100;
  }, [deliveryLog]);

  /* ── Filtered + sorted client list ── */
  const filtered = useMemo(() => {
    let res = [...clients];
    if (searchQ) { const q = searchQ.toLowerCase(); res = res.filter(c => c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.jurisdiction.toLowerCase().includes(q)); }
    if (filterStatus !== 'All') res = res.filter(c => c.status === filterStatus);
    if (filterType !== 'All') res = res.filter(c => c.type === filterType);
    if (satisfactionSlider > 0) res = res.filter(c => (c.satisfaction || 0) >= satisfactionSlider);
    res.sort((a, b) => { let va = a[sortBy], vb = b[sortBy]; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
    return res;
  }, [clients, searchQ, filterStatus, filterType, sortBy, sortDir, satisfactionSlider]);

  /* ── Sort handler ── */
  const handleSort = useCallback((f) => { setSortBy(prev => { if (prev === f) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return f; } setSortDir('asc'); return f; }); }, []);
  const handleDeliverySort = useCallback((f) => { setDeliverySortBy(prev => { if (prev === f) { setDeliverySortDir(d => d === 'asc' ? 'desc' : 'asc'); return f; } setDeliverySortDir('desc'); return f; }); }, []);

  /* ── CRUD ── */
  const saveClient = useCallback((c) => {
    setClients(prev => { const idx = prev.findIndex(x => x.id === c.id); if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; } return [...prev, c]; });
    setShowForm(false); setEditClient(null);
  }, []);
  const deleteClient = useCallback((id) => { setClients(prev => prev.filter(c => c.id !== id)); setSelectedClient(null); }, []);

  const addNote = useCallback((clientId) => {
    if (!newNote.trim()) return;
    const entry = { text: newNote.trim(), date: new Date().toISOString(), type: 'note' };
    setNotes(prev => ({ ...prev, [clientId]: [...(prev[clientId] || []), entry] }));
    setNewNote('');
  }, [newNote]);

  /* ── Delivery calendar data ── */
  const calendarData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, i) => {
      const due = clients.filter(c => c.next_due && new Date(c.next_due).getMonth() === i).length;
      const delivered = deliveryLog.filter(d => new Date(d.date).getMonth() === i).length;
      return { month: m, due, delivered };
    });
  }, [clients, deliveryLog]);

  /* ── Satisfaction trend ── */
  const satisfactionTrend = useMemo(() => {
    const quarters = ['Q1-2024','Q2-2024','Q3-2024','Q4-2024','Q1-2025'];
    return quarters.map((q, qi) => {
      const vals = {};
      activeClients.forEach(c => { const h = hashStr(c.id); vals[c.name] = Math.min(100, Math.max(60, Math.round((c.satisfaction || 80) + (sr(h, qi) - 0.5) * 15))); });
      return { quarter: q, ...vals, avg: Math.round(Object.values(vals).reduce((s, v) => s + v, 0) / (Object.keys(vals).length || 1)) };
    });
  }, [activeClients]);

  /* ── Sorted delivery log ── */
  const sortedDelivery = useMemo(() => {
    const mapped = deliveryLog.map(d => ({ ...d, clientName: (clients.find(c => c.id === d.client_id) || {}).name || d.client_id }));
    return mapped.sort((a, b) => { let va = a[deliverySortBy], vb = b[deliverySortBy]; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return deliverySortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
  }, [deliveryLog, clients, deliverySortBy, deliverySortDir]);

  /* ── Export handlers ── */
  const exportClientCSV = useCallback(() => {
    const cols = [
      { label:'ID', get:r=>r.id }, { label:'Name', get:r=>r.name }, { label:'Type', get:r=>r.type },
      { label:'AUM ($Bn)', get:r=>r.aum_bn }, { label:'Contact', get:r=>r.contact }, { label:'Email', get:r=>r.email },
      { label:'Jurisdiction', get:r=>r.jurisdiction }, { label:'Frameworks', get:r=>(r.frameworks||[]).join('; ') },
      { label:'SFDR Article', get:r=>r.sfdr_article||'' }, { label:'Frequency', get:r=>r.reporting_frequency },
      { label:'Status', get:r=>r.status }, { label:'Satisfaction', get:r=>r.satisfaction||'' },
      { label:'Reports Delivered', get:r=>r.reports_delivered||0 }, { label:'SLA Days', get:r=>r.sla_days },
    ];
    downloadCSV(toCSV(filtered, cols), `client_list_${new Date().toISOString().slice(0,10)}.csv`);
  }, [filtered]);

  const exportDeliveryCSV = useCallback(() => {
    const cols = [
      { label:'Client', get:r=>r.clientName }, { label:'Report', get:r=>r.report },
      { label:'Date', get:r=>r.date }, { label:'Format', get:r=>r.format },
      { label:'SLA Met', get:r=>r.sla_met?'Yes':'No' }, { label:'Satisfaction', get:r=>r.satisfaction||'' },
    ];
    downloadCSV(toCSV(sortedDelivery, cols), `delivery_log_${new Date().toISOString().slice(0,10)}.csv`);
  }, [sortedDelivery]);

  /* ── Urgency color ── */
  const urgencyColor = (dateStr) => {
    if (!dateStr) return T.textMut;
    const days = daysBetween(new Date(), new Date(dateStr));
    if (days < 0) return T.red;
    if (days <= 14) return T.amber;
    if (days <= 30) return T.gold;
    return T.green;
  };

  /* ── Framework Matrix Data ── */
  const fwMatrix = useMemo(() => ALL_FRAMEWORKS.map(fw => {
    const row = { framework: fw };
    clients.forEach(c => { row[c.id] = (c.frameworks || []).includes(fw) ? 1 : 0; });
    return row;
  }), [clients]);

  /* ── Revenue per client ── */
  const revenueData = useMemo(() => clients.filter(c => c.status === 'Active').map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + '..' : c.name,
    revenue: Math.round((c.aum_bn || 0) * (c.fee_bps || 3) * 10000),
    aum: c.aum_bn,
  })).sort((a, b) => b.revenue - a.revenue), [clients]);

  const TABS = ['Dashboard','Clients','Delivery','SLA','Calendar','Onboarding','Framework Matrix','Satisfaction','Revenue','Communication','Manage'];

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.text }}>
      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:700, color:T.navy, margin:0 }}>Client Portal & Delivery Dashboard</h1>
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            <Badge label={`${clients.length} Clients`} bg={T.navy} />
            <Badge label="SLA Tracking" bg={T.sage} />
            <Badge label="Multi-Framework" bg={T.gold} color={T.navy} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn small onClick={exportClientCSV}>Export Clients CSV</Btn>
          <Btn small onClick={exportDeliveryCSV}>Export Delivery CSV</Btn>
          <Btn small onClick={printPage}>Print</Btn>
          <Btn small onClick={() => navigate('/report-generator')}>Report Generator</Btn>
          <Btn small onClick={() => navigate('/template-manager')}>Templates</Btn>
          <Btn small onClick={() => navigate('/regulatory-calendar')}>Reg Calendar</Btn>
          <Btn small onClick={() => navigate('/scheduled-reports')}>Schedules</Btn>
        </div>
      </div>

      {/* ── 10 KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        <KPI label="Active Clients" value={activeClients.length} sub={`of ${clients.length} total`} color={T.navy} />
        <KPI label="Total AUM ($Bn)" value={`$${totalAUM}`} sub="Under service" color={T.gold} />
        <KPI label="Reports Delivered (YTD)" value={totalReportsYTD} sub={`${deliveryLog.length} in log`} color={T.sage} />
        <KPI label="Upcoming Deadlines" value={upcomingDeadlines.length} sub={upcomingDeadlines[0] ? `Next: ${fmtD(upcomingDeadlines[0].next_due)}` : ''} color={T.amber} />
        <KPI label="Avg Satisfaction" value={`${avgSatisfaction}%`} sub={avgSatisfaction >= 90 ? 'Excellent' : avgSatisfaction >= 80 ? 'Good' : 'Needs Improvement'} color={avgSatisfaction >= 90 ? T.green : avgSatisfaction >= 80 ? T.amber : T.red} />
        <KPI label="SLA Compliance" value={`${slaCompliance}%`} sub={slaCompliance >= 95 ? 'On Track' : 'At Risk'} color={slaCompliance >= 95 ? T.green : T.amber} />
        <KPI label="Frameworks Covered" value={frameworkSet.size} sub={`of ${ALL_FRAMEWORKS.length} tracked`} color={T.navyL} />
        <KPI label="Client Types" value={typeSet.size} sub={`${CLIENT_TYPES.length} possible`} color={T.textSec} />
        <KPI label="Onboarding Pipeline" value={onboarding} sub={`${clients.filter(c => c.status === 'Prospect').length} prospects`} color={T.amber} />
        <KPI label="Revenue (Est.)" value={`$${(estRevenue / 1e6).toFixed(1)}M`} sub="Annual fee estimate" color={T.gold} />
      </div>

      {/* ── TAB BAR ── */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ════════════════════════════ DASHBOARD ════════════════════════════ */}
      {tab === 'Dashboard' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Client Cards */}
          <Card style={{ gridColumn:'1 / -1' }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Client Overview Cards</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280, 1fr))', gap:12 }}>
              {clients.map(c => (
                <div key={c.id} onClick={() => { setSelectedClient(c); setTab('Clients'); }} style={{ background:T.surfaceH, borderRadius:8, padding:14, cursor:'pointer', border:`1px solid ${T.border}`, transition:'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>{c.name}</div>
                    <Badge label={c.status} bg={STATUS_COLORS[c.status] || T.textMut} />
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                    <Badge label={c.type} bg={T.navyL} />
                    {c.sfdr_article && <Badge label={c.sfdr_article} bg={T.sage} />}
                  </div>
                  <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>AUM: <strong>${c.aum_bn}Bn</strong> | {c.jurisdiction}</div>
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:6 }}>
                    {(c.frameworks || []).map(f => <span key={f} style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:T.surface, border:`1px solid ${T.borderL}`, color:T.textSec }}>{f}</span>)}
                  </div>
                  {c.next_due && <div style={{ fontSize:11, color:urgencyColor(c.next_due), fontWeight:600 }}>Next Due: {fmtD(c.next_due)} ({daysBetween(new Date(), new Date(c.next_due))}d)</div>}
                  {c.satisfaction != null && (
                    <div style={{ marginTop:6 }}>
                      <div style={{ fontSize:10, color:T.textMut, marginBottom:2 }}>Satisfaction: {c.satisfaction}%</div>
                      <div style={{ height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${c.satisfaction}%`, background:c.satisfaction >= 90 ? T.green : c.satisfaction >= 80 ? T.amber : T.red, borderRadius:3 }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Delivery Calendar mini */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Report Delivery Calendar</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={calendarData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="month" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} /><Tooltip /><Bar dataKey="delivered" fill={T.sage} name="Delivered" radius={[4,4,0,0]} /><Bar dataKey="due" fill={T.gold} name="Due" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </Card>

          {/* SLA Quick View */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>SLA Status</div>
            {upcomingDeadlines.slice(0, 6).map(c => {
              const days = daysBetween(new Date(), new Date(c.next_due));
              const pct = Math.min(100, Math.max(0, ((c.sla_days - days) / c.sla_days) * 100));
              return (
                <div key={c.id} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ fontWeight:600 }}>{c.name}</span>
                    <span style={{ color:urgencyColor(c.next_due), fontWeight:600 }}>{days}d remaining</span>
                  </div>
                  <div style={{ height:6, background:T.border, borderRadius:3, overflow:'hidden', marginTop:3 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:days < 7 ? T.red : days < 14 ? T.amber : T.green, borderRadius:3, transition:'width .5s' }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ════════════════════════════ CLIENTS LIST + DETAIL ════════════════════════════ */}
      {tab === 'Clients' && (
        <div style={{ display:'grid', gridTemplateColumns: selectedClient ? '1fr 1fr' : '1fr', gap:16 }}>
          {/* Left: list */}
          <Card>
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
              <input placeholder="Search clients..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ flex:1, minWidth:180, padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}>
                <option value="All">All Status</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding:'8px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}>
                <option value="All">All Types</option>
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Btn small primary onClick={() => { setEditClient(null); setShowForm(true); setTab('Manage'); }}>+ Add Client</Btn>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Min Satisfaction: {satisfactionSlider}%</div>
              <input type="range" min={0} max={100} value={satisfactionSlider} onChange={e => setSatisfactionSlider(Number(e.target.value))} style={{ width:'100%' }} />
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="AUM ($Bn)" field="aum_bn" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Satisfaction" field="satisfaction" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Next Due" field="next_due" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} onClick={() => setSelectedClient(c)} style={{ cursor:'pointer', background:selectedClient?.id === c.id ? T.surfaceH : 'transparent', transition:'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = selectedClient?.id === c.id ? T.surfaceH : 'transparent'}>
                      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{c.name}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}><Badge label={c.type} bg={T.navyL} /></td>
                      <td style={{ padding:'10px 12px', fontSize:13, borderBottom:`1px solid ${T.border}` }}>${c.aum_bn}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}><Badge label={c.status} bg={STATUS_COLORS[c.status]} /></td>
                      <td style={{ padding:'10px 12px', fontSize:13, borderBottom:`1px solid ${T.border}`, color:c.satisfaction >= 90 ? T.green : c.satisfaction >= 80 ? T.amber : T.red, fontWeight:600 }}>{c.satisfaction != null ? `${c.satisfaction}%` : '—'}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}`, color:urgencyColor(c.next_due), fontWeight:600 }}>{fmtD(c.next_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Showing {filtered.length} of {clients.length} clients</div>
          </Card>

          {/* Right: detail */}
          {selectedClient && (
            <Card>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{selectedClient.name}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <Btn small onClick={() => { setEditClient(selectedClient); setShowForm(true); setTab('Manage'); }}>Edit</Btn>
                  <Btn small style={{ color:T.red, borderColor:T.red }} onClick={() => deleteClient(selectedClient.id)}>Delete</Btn>
                  <Btn small onClick={() => setSelectedClient(null)}>Close</Btn>
                </div>
              </div>
              <Badge label={selectedClient.status} bg={STATUS_COLORS[selectedClient.status]} />
              <Badge label={selectedClient.type} bg={T.navyL} />
              {selectedClient.sfdr_article && <Badge label={selectedClient.sfdr_article} bg={T.sage} />}
              <Badge label={selectedClient.jurisdiction} bg={T.gold} color={T.navy} />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14, fontSize:13 }}>
                <div><span style={{ color:T.textMut }}>Contact:</span> <strong>{selectedClient.contact}</strong></div>
                <div><span style={{ color:T.textMut }}>Email:</span> {selectedClient.email}</div>
                <div><span style={{ color:T.textMut }}>AUM:</span> <strong>${selectedClient.aum_bn}Bn</strong></div>
                <div><span style={{ color:T.textMut }}>Frequency:</span> {selectedClient.reporting_frequency}</div>
                <div><span style={{ color:T.textMut }}>SLA Target:</span> {selectedClient.sla_days} days</div>
                <div><span style={{ color:T.textMut }}>Fee (bps):</span> {selectedClient.fee_bps}</div>
                <div><span style={{ color:T.textMut }}>Last Report:</span> {fmtD(selectedClient.last_report)}</div>
                <div><span style={{ color:T.textMut }}>Next Due:</span> <span style={{ color:urgencyColor(selectedClient.next_due), fontWeight:700 }}>{fmtD(selectedClient.next_due)}</span></div>
                <div><span style={{ color:T.textMut }}>Reports Delivered:</span> {selectedClient.reports_delivered || 0}</div>
                <div><span style={{ color:T.textMut }}>Satisfaction:</span> <span style={{ fontWeight:700, color:selectedClient.satisfaction >= 90 ? T.green : T.amber }}>{selectedClient.satisfaction ?? '—'}%</span></div>
              </div>

              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>Frameworks Required</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {(selectedClient.frameworks || []).map(f => <Badge key={f} label={f} bg={T.surface} color={T.navy} />)}
                </div>
              </div>

              {(selectedClient.portfolios || []).length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:4 }}>Portfolios</div>
                  {selectedClient.portfolios.map(p => <Badge key={p} label={p} bg={T.goldL} color={T.navy} />)}
                </div>
              )}

              {/* Delivery history for this client */}
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>Report History</div>
                {deliveryLog.filter(d => d.client_id === selectedClient.id).map((d, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>
                    <span>{d.report}</span>
                    <span style={{ color:T.textMut }}>{fmtD(d.date)} | {d.format} | SLA: {d.sla_met ? <span style={{ color:T.green }}>Met</span> : <span style={{ color:T.red }}>Missed</span>}</span>
                  </div>
                ))}
                {deliveryLog.filter(d => d.client_id === selectedClient.id).length === 0 && <div style={{ fontSize:12, color:T.textMut }}>No reports delivered yet.</div>}
              </div>

              {/* Notes */}
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>Communication Notes</div>
                {(notes[selectedClient.id] || []).map((n, i) => (
                  <div key={i} style={{ fontSize:12, padding:6, background:T.surfaceH, borderRadius:4, marginBottom:4 }}>
                    <span style={{ color:T.textMut, fontSize:10 }}>{fmtD(n.date)}</span> {n.text}
                  </div>
                ))}
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add note..." style={{ flex:1, padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }} onKeyDown={e => e.key === 'Enter' && addNote(selectedClient.id)} />
                  <Btn small primary onClick={() => addNote(selectedClient.id)}>Add</Btn>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════ DELIVERY LOG ════════════════════════════ */}
      {tab === 'Delivery' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Report Delivery Log</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <SortHeader label="Client" field="clientName" sortBy={deliverySortBy} sortDir={deliverySortDir} onSort={handleDeliverySort} />
                  <SortHeader label="Report" field="report" sortBy={deliverySortBy} sortDir={deliverySortDir} onSort={handleDeliverySort} />
                  <SortHeader label="Date" field="date" sortBy={deliverySortBy} sortDir={deliverySortDir} onSort={handleDeliverySort} />
                  <SortHeader label="Format" field="format" sortBy={deliverySortBy} sortDir={deliverySortDir} onSort={handleDeliverySort} />
                  <SortHeader label="SLA Met" field="sla_met" sortBy={deliverySortBy} sortDir={deliverySortDir} onSort={handleDeliverySort} />
                  <SortHeader label="Satisfaction" field="satisfaction" sortBy={deliverySortBy} sortDir={deliverySortDir} onSort={handleDeliverySort} />
                </tr>
              </thead>
              <tbody>
                {sortedDelivery.map((d, i) => (
                  <tr key={i} style={{ transition:'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{d.clientName}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{d.report}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{fmtD(d.date)}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}><Badge label={d.format} bg={T.surfaceH} color={T.navy} /></td>
                    <td style={{ padding:'10px 12px', fontSize:12, borderBottom:`1px solid ${T.border}` }}>{d.sla_met ? <Badge label="Met" bg={T.green} /> : <Badge label="Missed" bg={T.red} />}</td>
                    <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, borderBottom:`1px solid ${T.border}`, color:d.satisfaction >= 90 ? T.green : T.amber }}>{d.satisfaction || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ════════════════════════════ SLA MONITOR ════════════════════════════ */}
      {tab === 'SLA' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>SLA Monitor</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320, 1fr))', gap:12 }}>
            {clients.filter(c => c.next_due).map(c => {
              const days = daysBetween(new Date(), new Date(c.next_due));
              const pct = c.sla_days ? Math.min(100, Math.max(0, (days / c.sla_days) * 100)) : 50;
              const status = days < 0 ? 'Overdue' : days <= 7 ? 'At Risk' : 'On Track';
              const statusColor = days < 0 ? T.red : days <= 7 ? T.amber : T.green;
              return (
                <div key={c.id} style={{ background:T.surfaceH, borderRadius:8, padding:14, border:`1px solid ${T.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{c.name}</div>
                    <Badge label={status} bg={statusColor} />
                  </div>
                  <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>SLA Target: {c.sla_days} days | Due: {fmtD(c.next_due)}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span>{days}d remaining</span>
                    <span>{c.reporting_frequency}</span>
                  </div>
                  <div style={{ height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: statusColor, borderRadius:4, transition:'width .5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ════════════════════════════ CALENDAR ════════════════════════════ */}
      {tab === 'Calendar' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Delivery Calendar — Full Year</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={calendarData}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="month" tick={{ fontSize:12 }} /><YAxis tick={{ fontSize:12 }} /><Tooltip /><Legend /><Bar dataKey="delivered" fill={T.sage} name="Delivered" radius={[4,4,0,0]} /><Bar dataKey="due" fill={T.gold} name="Due" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:16, fontSize:13, fontWeight:700, color:T.navy }}>Upcoming Deadlines</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250, 1fr))', gap:8, marginTop:8 }}>
            {upcomingDeadlines.map(c => (
              <div key={c.id} style={{ padding:10, background:T.surfaceH, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
                <div style={{ fontWeight:700, color:T.navy }}>{c.name}</div>
                <div style={{ color:urgencyColor(c.next_due), fontWeight:600 }}>{fmtD(c.next_due)} ({daysBetween(new Date(), new Date(c.next_due))}d away)</div>
                <div style={{ color:T.textMut }}>{c.reporting_frequency} | {(c.frameworks || []).join(', ')}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ════════════════════════════ ONBOARDING KANBAN ════════════════════════════ */}
      {tab === 'Onboarding' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Client Onboarding Workflow</div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${KANBAN_COLS.length}, 1fr)`, gap:12 }}>
            {KANBAN_COLS.map(col => (
              <div key={col} style={{ background:T.surfaceH, borderRadius:8, padding:12, minHeight:200 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10, borderBottom:`2px solid ${STATUS_COLORS[col] || T.border}`, paddingBottom:6 }}>
                  {col} ({clients.filter(c => c.status === col || (col === 'Renewal' && c.status === 'Active' && c.next_due && daysBetween(new Date(), new Date(c.next_due)) < 30)).length})
                </div>
                {clients.filter(c => col === 'Renewal' ? (c.status === 'Active' && c.next_due && daysBetween(new Date(), new Date(c.next_due)) < 30) : c.status === col).map(c => (
                  <div key={c.id} style={{ background:T.surface, borderRadius:6, padding:10, marginBottom:8, border:`1px solid ${T.border}`, cursor:'pointer' }} onClick={() => { setSelectedClient(c); setTab('Clients'); }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{c.name}</div>
                    <div style={{ fontSize:11, color:T.textMut }}>{c.type} | ${c.aum_bn}Bn</div>
                    <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{c.contact}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ════════════════════════════ FRAMEWORK MATRIX ════════════════════════════ */}
      {tab === 'Framework Matrix' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Framework Requirements Matrix</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}`, position:'sticky', left:0, background:T.surface, zIndex:1 }}>Framework</th>
                  {clients.map(c => <th key={c.id} style={{ padding:'8px 6px', textAlign:'center', fontWeight:600, color:T.navy, borderBottom:`2px solid ${T.border}`, fontSize:10, maxWidth:90, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name.length > 12 ? c.name.slice(0,10)+'..' : c.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {fwMatrix.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding:'6px 10px', fontWeight:600, borderBottom:`1px solid ${T.border}`, position:'sticky', left:0, background:T.surface, zIndex:1 }}>{row.framework}</td>
                    {clients.map(c => (
                      <td key={c.id} style={{ padding:'6px', textAlign:'center', borderBottom:`1px solid ${T.border}` }}>
                        {row[c.id] ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:4, background:T.green, color:'#fff', fontSize:11, lineHeight:'18px', textAlign:'center' }}>&#10003;</span> : <span style={{ color:T.textMut }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ════════════════════════════ SATISFACTION TREND ════════════════════════════ */}
      {tab === 'Satisfaction' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Client Satisfaction Trend</div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{ fontSize:12 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize:12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="avg" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="Portfolio Avg" />
              {activeClients.slice(0, 5).map((c, i) => {
                const colors = [T.gold, T.sage, T.navyL, T.amber, T.red];
                return <Area key={c.id} type="monotone" dataKey={c.name} stroke={colors[i]} fill="none" strokeWidth={1.5} strokeDasharray={i > 0 ? '4 2' : undefined} />;
              })}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ════════════════════════════ REVENUE ════════════════════════════ */}
      {tab === 'Revenue' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Revenue by Client (Est. Annual)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize:11 }} /><Tooltip formatter={v => `$${(v/1e6).toFixed(2)}M`} /><Bar dataKey="revenue" fill={T.gold} radius={[0,4,4,0]}>{revenueData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? T.gold : T.goldL} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Revenue Breakdown</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr>
                <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, color:T.textSec }}>Client</th>
                <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}`, color:T.textSec }}>AUM ($Bn)</th>
                <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}`, color:T.textSec }}>Fee (bps)</th>
                <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}`, color:T.textSec }}>Est. Revenue</th>
                <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}`, color:T.textSec }}>Reports/Yr</th>
              </tr></thead>
              <tbody>
                {clients.filter(c => c.status === 'Active').sort((a, b) => (b.aum_bn * b.fee_bps) - (a.aum_bn * a.fee_bps)).map(c => {
                  const rev = (c.aum_bn || 0) * (c.fee_bps || 3) * 10000;
                  const rpy = c.reporting_frequency === 'Quarterly' ? 4 : c.reporting_frequency === 'Semi-Annual' ? 2 : c.reporting_frequency === 'Monthly' ? 12 : 1;
                  return (
                    <tr key={c.id}><td style={{ padding:'8px 10px', borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{c.name}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', borderBottom:`1px solid ${T.border}` }}>${c.aum_bn}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', borderBottom:`1px solid ${T.border}` }}>{c.fee_bps}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', borderBottom:`1px solid ${T.border}`, fontWeight:700, color:T.gold }}>${(rev/1e6).toFixed(2)}M</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', borderBottom:`1px solid ${T.border}` }}>{rpy * (c.frameworks || []).length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:12, fontSize:13, fontWeight:700, color:T.navy }}>Total Est. Revenue: <span style={{ color:T.gold }}>${(estRevenue / 1e6).toFixed(2)}M</span></div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════ COMMUNICATION LOG ════════════════════════════ */}
      {tab === 'Communication' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>Client Communication Log</div>
          {clients.filter(c => c.status === 'Active').map(c => (
            <div key={c.id} style={{ marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:6 }}>{c.name} <span style={{ fontSize:11, color:T.textMut, fontWeight:400 }}>({c.contact})</span></div>
              {(notes[c.id] || []).length === 0 && <div style={{ fontSize:12, color:T.textMut }}>No notes yet.</div>}
              {(notes[c.id] || []).map((n, i) => (
                <div key={i} style={{ fontSize:12, padding:6, background:T.surfaceH, borderRadius:4, marginBottom:4 }}>
                  <span style={{ color:T.textMut, fontSize:10, marginRight:6 }}>{fmtD(n.date)}</span>{n.text}
                </div>
              ))}
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <input id={`note-${c.id}`} placeholder={`Add note for ${c.name}...`} style={{ flex:1, padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }} onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const entry = { text: e.target.value.trim(), date: new Date().toISOString(), type: 'note' };
                    setNotes(prev => ({ ...prev, [c.id]: [...(prev[c.id] || []), entry] }));
                    e.target.value = '';
                  }
                }} />
                <Btn small primary onClick={() => {
                  const el = document.getElementById(`note-${c.id}`);
                  if (el && el.value.trim()) {
                    const entry = { text: el.value.trim(), date: new Date().toISOString(), type: 'note' };
                    setNotes(prev => ({ ...prev, [c.id]: [...(prev[c.id] || []), entry] }));
                    el.value = '';
                  }
                }}>Add</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ════════════════════════════ MANAGE / ADD / EDIT ════════════════════════════ */}
      {tab === 'Manage' && (
        <Card>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:12 }}>{editClient ? 'Edit Client' : 'Add New Client'}</div>
          <ClientForm client={editClient} onSave={saveClient} onCancel={() => { setShowForm(false); setEditClient(null); setTab('Clients'); }} />
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CLIENT FORM
   ══════════════════════════════════════════════════════════════ */
function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState(() => client || {
    id: `C${String(Date.now()).slice(-3)}`,
    name: '', type: '', aum_bn: '', contact: '', email: '', jurisdiction: '',
    frameworks: [], sfdr_article: '', reporting_frequency: '', status: 'Prospect',
    portfolios: [], satisfaction: '', reports_delivered: 0, sla_days: 15, fee_bps: 3,
    last_report: '', next_due: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleFW = (fw) => set('frameworks', (form.frameworks || []).includes(fw) ? form.frameworks.filter(f => f !== fw) : [...(form.frameworks || []), fw]);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <Input label="Client Name" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Nordic Pension Fund" />
      <Input label="Client Type" value={form.type} onChange={v => set('type', v)} options={CLIENT_TYPES} />
      <Input label="AUM ($Bn)" type="number" value={form.aum_bn} onChange={v => set('aum_bn', Number(v))} />
      <Input label="Contact Name" value={form.contact} onChange={v => set('contact', v)} />
      <Input label="Email" type="email" value={form.email} onChange={v => set('email', v)} />
      <Input label="Jurisdiction" value={form.jurisdiction} onChange={v => set('jurisdiction', v)} options={JURISDICTIONS} />
      <Input label="SFDR Article" value={form.sfdr_article} onChange={v => set('sfdr_article', v)} options={['','Article 6','Article 8','Article 8+','Article 9']} />
      <Input label="Reporting Frequency" value={form.reporting_frequency} onChange={v => set('reporting_frequency', v)} options={FREQ_OPTIONS} />
      <Input label="Status" value={form.status} onChange={v => set('status', v)} options={Object.keys(STATUS_COLORS)} />
      <Input label="SLA Days" type="number" value={form.sla_days} onChange={v => set('sla_days', Number(v))} />
      <Input label="Fee (bps)" type="number" value={form.fee_bps} onChange={v => set('fee_bps', Number(v))} />
      <Input label="Satisfaction %" type="number" value={form.satisfaction} onChange={v => set('satisfaction', Number(v))} />
      <Input label="Last Report Date" type="date" value={form.last_report} onChange={v => set('last_report', v)} />
      <Input label="Next Due Date" type="date" value={form.next_due} onChange={v => set('next_due', v)} />
      <div style={{ gridColumn:'1 / -1' }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Frameworks</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {ALL_FRAMEWORKS.map(fw => (
            <div key={fw} onClick={() => toggleFW(fw)} style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${(form.frameworks || []).includes(fw) ? T.sage : T.border}`, background:(form.frameworks || []).includes(fw) ? T.sage : T.surface, color:(form.frameworks || []).includes(fw) ? '#fff' : T.text }}>{fw}</div>
          ))}
        </div>
      </div>
      <Input label="Portfolios (comma-separated)" value={(form.portfolios || []).join(', ')} onChange={v => set('portfolios', v.split(',').map(s => s.trim()).filter(Boolean))} style={{ gridColumn:'1 / -1' }} />
      <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn primary onClick={() => onSave(form)} disabled={!form.name}>Save Client</Btn>
      </div>
    </div>
  );
}
