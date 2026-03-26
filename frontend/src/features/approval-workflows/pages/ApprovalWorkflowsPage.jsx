/**
 * EP-V3 — Approval Workflows & Decision Governance
 * Sprint V — Governance & Audit Trail
 *
 * Manages approval processes for key platform decisions — portfolio changes,
 * model updates, report publications, manual overrides, and regulatory submissions.
 * 8 pre-configured templates, Kanban board, SLA tracking, evidence-based workflows.
 * Reads: ra_portfolio_v1
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, T.amber, T.red];

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = seed => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, off = 0) => seededRandom(seed + off);
const readLS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_WORKFLOWS = 'ra_workflow_instances_v1';
const LS_TEMPLATES = 'ra_workflow_templates_v1';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDateTime = d => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const uid = () => 'WFI-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

/* ── Workflow Templates ───────────────────────────────────────────────────── */
const DEFAULT_TEMPLATES = [
  { id:'WF01', name:'Portfolio Rebalance Approval', trigger:'Optimized weights applied', approvers:['Portfolio Manager','Risk Committee'], steps:['Review proposed changes','Impact assessment','Risk check','Final approval'], sla_hours:48, category:'Portfolio', required_evidence:['Before/after comparison','Risk metrics delta','Compliance check'] },
  { id:'WF02', name:'Manual Data Override', trigger:'Manual override of ESG/emissions data', approvers:['Data Steward','Compliance'], steps:['Document justification','Source verification','Approve override'], sla_hours:24, category:'Data', required_evidence:['Original value','Override rationale'] },
  { id:'WF03', name:'Report Publication', trigger:'Client or regulatory report ready for delivery', approvers:['Report Author','Compliance','Client Manager'], steps:['Content review','Compliance check','Quality assurance','Client approval'], sla_hours:72, category:'Reporting', required_evidence:['Draft report','Compliance checklist'] },
  { id:'WF04', name:'Model Parameter Change', trigger:'Update to model coefficients, thresholds, or methodology', approvers:['Quant Team','Risk Committee'], steps:['Document change','Impact analysis','Back-test comparison','Approval'], sla_hours:120, category:'Model', required_evidence:['Change documentation','Back-test results'] },
  { id:'WF05', name:'Regulatory Submission', trigger:'Filing ready for submission to regulator', approvers:['Compliance Officer','Legal','Senior Management'], steps:['Data completeness check','Regulatory format verification','Legal review','Sign-off'], sla_hours:168, category:'Compliance', required_evidence:['Filing draft','Completeness report'] },
  { id:'WF06', name:'New Client Onboarding', trigger:'New client added to platform', approvers:['Client Manager','Compliance','Operations'], steps:['KYC/AML check','Mandate review','Framework mapping','System setup'], sla_hours:240, category:'Client', required_evidence:['KYC documents','Client mandate'] },
  { id:'WF07', name:'ESG Screen Exception', trigger:'Request to override exclusion screen result', approvers:['ESG Analyst','Investment Committee'], steps:['Exception rationale','Peer comparison','Fiduciary assessment','Committee vote'], sla_hours:120, category:'Investment', required_evidence:['Exception request','Peer analysis'] },
  { id:'WF08', name:'Alert Escalation', trigger:'Critical/Extreme alert requires action beyond acknowledgment', approvers:['Risk Manager','Portfolio Manager'], steps:['Alert assessment','Impact quantification','Action plan','Implementation'], sla_hours:24, category:'Risk', required_evidence:['Alert details','Impact estimate'] },
];

const STATUS_LIST = ['draft','pending','in_review','approved','rejected','expired'];
const STATUS_COLORS = { draft:T.textMut, pending:T.amber, in_review:T.navyL, approved:T.green, rejected:T.red, expired:T.textMut };
const SLA_COLORS = { on_track:T.green, at_risk:T.amber, breached:T.red };
const KANBAN_COLS = ['draft','pending','in_review','approved','rejected'];
const KANBAN_LABELS = { draft:'Draft', pending:'Pending', in_review:'In Review', approved:'Approved', rejected:'Rejected' };

/* ── Generate seed workflow instances ─────────────────────────────────────── */
function generateInstances(templates, companies) {
  const instances = [];
  const titles = [
    'Rebalance Global ESG Portfolio — Q1 2025','Override Scope 3 for HDFCBANK','Publish SFDR PAI Report Q4',
    'Update ITR Model v3.2 Coefficients','CSRD Filing — FY 2024','Onboard Nordic Pension Fund',
    'Exception — Screen Override for RELIANCE','Escalate Critical Alert — Coal Exposure',
    'Rebalance Low-Carbon Sleeve','Override Water Stress Data — INFY','Publish Client Report — Sovereign Fund',
    'Model Recalibration — NGFS Phase IV','BRSR Filing — Annual Disclosure','Onboard Japan ESG Mandate',
    'ESG Screen Exception — TCS Controversy','Escalate Amber Alert — Deforestation',
  ];
  const now = Date.now();
  titles.forEach((title, i) => {
    const tpl = templates[i % templates.length];
    const h = hashStr(title);
    const statusIdx = Math.floor(sr(h, 1) * 5);
    const status = STATUS_LIST[statusIdx];
    const created = new Date(now - (30 - i) * 86400000 - sr(h, 2) * 86400000 * 10).toISOString();
    const slaDeadline = new Date(new Date(created).getTime() + tpl.sla_hours * 3600000).toISOString();
    const hoursLeft = (new Date(slaDeadline) - now) / 3600000;
    const sla_status = status === 'approved' || status === 'rejected' ? 'on_track' : hoursLeft < 0 ? 'breached' : hoursLeft < tpl.sla_hours * 0.2 ? 'at_risk' : 'on_track';
    const currentStep = status === 'approved' ? tpl.steps.length : status === 'rejected' ? Math.max(1, Math.floor(sr(h, 3) * tpl.steps.length)) : Math.floor(sr(h, 4) * tpl.steps.length) + 1;
    const approvers = tpl.approvers.map((role, ai) => ({
      name: `${['Arun','Priya','Ravi','Sanjay','Deepa','Meera'][ai % 6]} ${['Sharma','Patel','Reddy','Gupta','Nair','Iyer'][ai % 6]}`,
      role,
      status: ai < currentStep - 1 ? (sr(h, 5 + ai) > 0.15 ? 'approved' : 'rejected') : ai === currentStep - 1 && status === 'in_review' ? 'pending' : 'pending',
      timestamp: ai < currentStep ? new Date(new Date(created).getTime() + (ai + 1) * 8 * 3600000).toISOString() : null,
      comment: ai < currentStep - 1 ? ['Looks good','Approved with minor note','Risk acceptable','No concerns'][ai % 4] : '',
    }));
    const evidence = (tpl.required_evidence || []).map((ev, ei) => ({ type: 'document', description: ev, attachment_ref: `ATT-${i}-${ei}` }));
    instances.push({
      id: `WFI-${1710000000000 + i * 100000}`, template_id: tpl.id, title, status,
      created_at: created, created_by: i % 3 === 0 ? 'System' : 'Manual',
      current_step: Math.min(currentStep, tpl.steps.length), total_steps: tpl.steps.length,
      approvers, evidence, sla_deadline: slaDeadline, sla_status, category: tpl.category,
      template_name: tpl.name,
    });
  });
  return instances;
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

/* ── Status Badge ─────────────────────────────────────────────────────────── */
const Badge = ({ text, color, bg }) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600, color: color || '#fff', background: bg || T.navy }}>{text}</span>
);

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function ApprovalWorkflowsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('kanban');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedWf, setSelectedWf] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTemplate, setCreateTemplate] = useState('WF01');
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [slaFilter, setSlaFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(0);

  /* ── Portfolio read ─────────────────────────────────────────────────────── */
  const portfolio = useMemo(() => readLS(LS_PORTFOLIO), []);
  const companies = useMemo(() => {
    if (portfolio && Array.isArray(portfolio.holdings)) return portfolio.holdings.map(h => {
      const master = GLOBAL_COMPANY_MASTER.find(m => m.ticker === h.ticker) || {};
      return { ...master, ...h };
    });
    return GLOBAL_COMPANY_MASTER.slice(0, 40);
  }, [portfolio]);

  /* ── Templates & instances ──────────────────────────────────────────────── */
  const [templates, setTemplates] = useState(() => readLS(LS_TEMPLATES) || DEFAULT_TEMPLATES);
  const [instances, setInstances] = useState(() => readLS(LS_WORKFLOWS) || generateInstances(templates, companies));

  useEffect(() => { writeLS(LS_WORKFLOWS, instances); }, [instances]);
  useEffect(() => { writeLS(LS_TEMPLATES, templates); }, [templates]);

  const onSort = useCallback(field => {
    setSortDir(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortField(field);
  }, [sortField]);

  /* ── KPIs ───────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const active = instances.filter(w => !['approved','rejected','expired'].includes(w.status));
    const pending = instances.filter(w => w.status === 'pending');
    const approved30 = instances.filter(w => w.status === 'approved' && (Date.now() - new Date(w.created_at).getTime()) < 30 * 86400000);
    const rejected = instances.filter(w => w.status === 'rejected');
    const breached = instances.filter(w => w.sla_status === 'breached');
    const avgHours = instances.filter(w => w.status === 'approved').reduce((s, w) => {
      const dur = (new Date(w.approvers.filter(a => a.timestamp).pop()?.timestamp || w.created_at) - new Date(w.created_at)) / 3600000;
      return s + dur;
    }, 0) / (approved30.length || 1);
    const onTrack = instances.filter(w => w.sla_status === 'on_track').length;
    const cats = new Set(instances.map(w => w.category));
    return [
      { label:'Active Workflows', value: active.length, color:T.navy },
      { label:'Pending Approval', value: pending.length, color:T.amber },
      { label:'Approved (30d)', value: approved30.length, color:T.green },
      { label:'Rejected', value: rejected.length, color:T.red },
      { label:'SLA Breached', value: breached.length, color:T.red },
      { label:'Avg Approval (hrs)', value: Math.round(avgHours), color:T.navyL },
      { label:'On-Track %', value: instances.length ? Math.round(onTrack / instances.length * 100) + '%' : '—', color:T.sage },
      { label:'Categories', value: cats.size + ' / 8', color:T.gold },
    ];
  }, [instances]);

  /* ── Filtered & sorted instances ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let arr = [...instances];
    if (filterStatus !== 'all') arr = arr.filter(w => w.status === filterStatus);
    if (filterCategory !== 'all') arr = arr.filter(w => w.category === filterCategory);
    if (slaFilter !== 'all') arr = arr.filter(w => w.sla_status === slaFilter);
    arr.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [instances, filterStatus, filterCategory, slaFilter, sortField, sortDir]);

  /* ── Chart data ─────────────────────────────────────────────────────────── */
  const categoryDist = useMemo(() => {
    const map = {};
    instances.forEach(w => { map[w.category] = (map[w.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [instances]);

  const monthlyVolume = useMemo(() => {
    const map = {};
    instances.forEach(w => {
      const m = new Date(w.created_at).toLocaleDateString('en-GB', { month:'short', year:'2-digit' });
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count }));
  }, [instances]);

  const slaDist = useMemo(() => {
    const map = { on_track:0, at_risk:0, breached:0 };
    instances.forEach(w => { map[w.sla_status] = (map[w.sla_status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status: status.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase()), count, fill: SLA_COLORS[status] }));
  }, [instances]);

  const turnaroundByTemplate = useMemo(() => {
    const map = {};
    instances.filter(w => w.status === 'approved').forEach(w => {
      const dur = (new Date(w.approvers.filter(a => a.timestamp).pop()?.timestamp || w.created_at) - new Date(w.created_at)) / 3600000;
      if (!map[w.template_name]) map[w.template_name] = { total: 0, count: 0 };
      map[w.template_name].total += dur;
      map[w.template_name].count += 1;
    });
    return Object.entries(map).map(([name, { total, count }]) => ({ name: name.length > 20 ? name.slice(0, 18) + '..' : name, avg_hours: Math.round(total / count) }));
  }, [instances]);

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleCreate = useCallback(() => {
    if (!createTitle.trim()) return;
    const tpl = templates.find(t => t.id === createTemplate) || templates[0];
    const now = new Date().toISOString();
    const inst = {
      id: uid(), template_id: tpl.id, title: createTitle.trim(), status:'draft',
      created_at: now, created_by:'Manual', current_step:0, total_steps:tpl.steps.length,
      approvers: tpl.approvers.map(role => ({ name:'—', role, status:'pending', timestamp:null, comment:'' })),
      evidence: [], sla_deadline: new Date(Date.now() + tpl.sla_hours * 3600000).toISOString(),
      sla_status:'on_track', category: tpl.category, template_name: tpl.name, description: createDesc,
    };
    setInstances(prev => [inst, ...prev]);
    setCreateTitle(''); setCreateDesc(''); setShowCreateForm(false);
  }, [createTitle, createDesc, createTemplate, templates]);

  const handleApprove = useCallback((wfId) => {
    if (!actionComment.trim()) return;
    setInstances(prev => prev.map(w => {
      if (w.id !== wfId) return w;
      const newApprovers = w.approvers.map((a, i) => i === w.current_step - 1 ? { ...a, status:'approved', timestamp: new Date().toISOString(), comment: actionComment } : a);
      const nextStep = w.current_step + 1;
      const newStatus = nextStep > w.total_steps ? 'approved' : 'in_review';
      return { ...w, approvers: newApprovers, current_step: Math.min(nextStep, w.total_steps), status: newStatus };
    }));
    setActionComment('');
  }, [actionComment]);

  const handleReject = useCallback((wfId) => {
    if (!actionComment.trim()) return;
    setInstances(prev => prev.map(w => {
      if (w.id !== wfId) return w;
      const newApprovers = w.approvers.map((a, i) => i === w.current_step - 1 ? { ...a, status:'rejected', timestamp: new Date().toISOString(), comment: actionComment } : a);
      return { ...w, approvers: newApprovers, status:'rejected' };
    }));
    setActionComment('');
  }, [actionComment]);

  const handleSubmit = useCallback((wfId) => {
    setInstances(prev => prev.map(w => w.id === wfId && w.status === 'draft' ? { ...w, status:'pending', current_step:1 } : w));
  }, []);

  /* ── Exports ────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }, []);

  const exportActive = () => exportCSV(filtered.map(w => ({ id:w.id, title:w.title, template:w.template_name, status:w.status, category:w.category, step:`${w.current_step}/${w.total_steps}`, sla_status:w.sla_status, created:w.created_at, created_by:w.created_by })), 'approval_workflows_active.csv');
  const exportHistory = () => exportCSV(instances.filter(w => ['approved','rejected'].includes(w.status)).map(w => ({ id:w.id, title:w.title, template:w.template_name, outcome:w.status, category:w.category, created:w.created_at, sla:w.sla_status })), 'approval_workflows_history.csv');
  const handlePrint = () => window.print();

  /* ── Styles ─────────────────────────────────────────────────────────────── */
  const s = {
    page: { fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text },
    card: { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:20 },
    kpiRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 },
    kpi: (c) => ({ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:'16px 18px', borderLeft:`4px solid ${c}` }),
    btn: (bg, fg) => ({ padding:'8px 18px', borderRadius:8, border:'none', background:bg||T.navy, color:fg||'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font }),
    btnSm: (bg, fg) => ({ padding:'5px 12px', borderRadius:6, border:'none', background:bg||T.surfaceH, color:fg||T.text, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:T.font }),
    input: { padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, width:'100%', boxSizing:'border-box' },
    select: { padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, background:T.surface },
    tabBar: { display:'flex', gap:4, marginBottom:20, background:T.surfaceH, borderRadius:10, padding:4 },
    tabBtn: (active) => ({ padding:'8px 20px', borderRadius:8, border:'none', background:active?T.navy:'transparent', color:active?'#fff':T.textSec, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font }),
    table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
    td: { padding:'10px 12px', borderBottom:`1px solid ${T.border}`, verticalAlign:'middle' },
    kanbanCol: { flex:1, minWidth:200, background:T.surfaceH, borderRadius:12, padding:12, maxHeight:480, overflowY:'auto' },
    kanbanCard: { background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:12, marginBottom:10, cursor:'pointer', transition:'box-shadow 0.15s', fontSize:12 },
    emptyState: { textAlign:'center', padding:'48px 20px', color:T.textMut },
    stepBar: (pct) => ({ height:6, borderRadius:3, background:T.surfaceH, position:'relative', overflow:'hidden' }),
    stepFill: (pct, color) => ({ height:'100%', width:`${pct}%`, borderRadius:3, background:color || T.sage, transition:'width 0.3s' }),
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  const categories = [...new Set(instances.map(w => w.category))].sort();

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, margin:0, color:T.navy }}>Approval Workflows</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <Badge text="8 Templates" bg={T.navy} /><Badge text="SLA Tracking" bg={T.gold} color={T.navy} />
            <Badge text="Multi-Step" bg={T.sage} /><Badge text="Evidence-Based" bg={T.navyL} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={s.btn(T.sage)} onClick={() => setShowCreateForm(true)}>+ New Workflow</button>
          <button style={s.btn(T.gold, T.navy)} onClick={exportActive}>Export Active CSV</button>
          <button style={s.btn(T.surfaceH, T.text)} onClick={exportHistory}>Export History CSV</button>
          <button style={s.btn(T.surfaceH, T.text)} onClick={handlePrint}>Print</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={s.kpiRow}>
        {kpis.map((k, i) => (
          <div key={i} style={s.kpi(k.color)}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4, fontWeight:500 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={s.tabBar}>
        {[['kanban','Kanban Board'],['table','Workflows Table'],['sla','SLA Dashboard'],['templates','Templates'],['history','History'],['charts','Analytics']].map(([id, label]) => (
          <button key={id} style={s.tabBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      {['kanban','table','sla'].includes(tab) && (
        <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUS_LIST.map(st => <option key={st} value={st}>{st.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select style={s.select} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {tab === 'sla' && (
            <select style={s.select} value={slaFilter} onChange={e => setSlaFilter(e.target.value)}>
              <option value="all">All SLA</option>
              <option value="on_track">On Track</option><option value="at_risk">At Risk</option><option value="breached">Breached</option>
            </select>
          )}
        </div>
      )}

      {/* ── Kanban Board ───────────────────────────────────────────────────── */}
      {tab === 'kanban' && (
        <div style={{ ...s.card, padding:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Workflow Kanban</h3>
          <div style={{ display:'flex', gap:14, overflowX:'auto' }}>
            {KANBAN_COLS.map(col => {
              const items = filtered.filter(w => w.status === col);
              return (
                <div key={col} style={s.kanbanCol}>
                  <div style={{ fontSize:12, fontWeight:700, color:STATUS_COLORS[col], marginBottom:10, display:'flex', justifyContent:'space-between' }}>
                    <span>{KANBAN_LABELS[col]}</span><Badge text={items.length} bg={STATUS_COLORS[col]} />
                  </div>
                  {items.length === 0 && <div style={{ fontSize:11, color:T.textMut, textAlign:'center', padding:16 }}>No items</div>}
                  {items.map(w => {
                    const hoursLeft = Math.max(0, (new Date(w.sla_deadline) - Date.now()) / 3600000);
                    return (
                      <div key={w.id} style={s.kanbanCard} onClick={() => { setSelectedWf(w); setTab('detail'); }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(27,58,92,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <div style={{ fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{w.title}</div>
                        <div style={{ color:T.textMut, marginBottom:6 }}>{w.template_name}</div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:10, color:T.textSec }}>Step {w.current_step}/{w.total_steps}</span>
                          <Badge text={w.sla_status === 'breached' ? 'SLA Breached' : `${Math.round(hoursLeft)}h left`} bg={SLA_COLORS[w.sla_status]} />
                        </div>
                        <div style={{ marginTop:6, ...s.stepBar() }}>
                          <div style={s.stepFill(w.total_steps ? (w.current_step / w.total_steps) * 100 : 0, STATUS_COLORS[w.status])} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Workflows Table ─────────────────────────────────────────── */}
      {tab === 'table' && (
        <div style={{ ...s.card, overflowX:'auto' }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Active Workflows</h3>
          {filtered.length === 0 ? (
            <div style={s.emptyState}><div style={{ fontSize:36, marginBottom:8 }}>--</div><div>No workflows match your filters.</div></div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <SortHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Template" field="template_name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Step" field="current_step" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="SLA" field="sla_status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Created" field="created_at" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600, color:T.textSec }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id} style={{ cursor:'pointer' }} onClick={() => { setSelectedWf(w); setTab('detail'); }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...s.td, fontWeight:600, maxWidth:240 }}>{w.title}</td>
                    <td style={s.td}>{w.template_name}</td>
                    <td style={s.td}><Badge text={w.status.replace('_',' ')} bg={STATUS_COLORS[w.status]} /></td>
                    <td style={s.td}>{w.current_step}/{w.total_steps}</td>
                    <td style={s.td}><Badge text={w.category} bg={T.surfaceH} color={T.text} /></td>
                    <td style={s.td}><Badge text={w.sla_status.replace('_',' ')} bg={SLA_COLORS[w.sla_status]} /></td>
                    <td style={s.td}>{fmtDate(w.created_at)}</td>
                    <td style={s.td}>
                      {w.status === 'draft' && <button style={s.btnSm(T.sage, '#fff')} onClick={e => { e.stopPropagation(); handleSubmit(w.id); }}>Submit</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Workflow Detail Panel ──────────────────────────────────────────── */}
      {tab === 'detail' && selectedWf && (() => {
        const w = instances.find(i => i.id === selectedWf.id) || selectedWf;
        const tpl = templates.find(t => t.id === w.template_id) || templates[0];
        const hoursLeft = Math.max(0, (new Date(w.sla_deadline) - Date.now()) / 3600000);
        return (
          <div style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:8 }}>
              <div>
                <button style={s.btnSm()} onClick={() => setTab('kanban')}>Back to Board</button>
                <h3 style={{ fontSize:18, fontWeight:700, margin:'12px 0 4px' }}>{w.title}</h3>
                <div style={{ fontSize:13, color:T.textSec }}>{w.template_name} | {w.category} | Created {fmtDateTime(w.created_at)} by {w.created_by}</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Badge text={w.status.replace('_',' ').toUpperCase()} bg={STATUS_COLORS[w.status]} />
                <Badge text={w.sla_status === 'breached' ? 'SLA BREACHED' : `${Math.round(hoursLeft)}h remaining`} bg={SLA_COLORS[w.sla_status]} />
              </div>
            </div>

            {/* Step Progress */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Step Progress ({w.current_step}/{w.total_steps})</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {tpl.steps.map((step, i) => {
                  const done = i < w.current_step;
                  const current = i === w.current_step - 1 && !['approved','rejected'].includes(w.status);
                  return (
                    <div key={i} style={{ flex:1, minWidth:120, padding:12, borderRadius:10, background: done ? `${T.green}15` : current ? `${T.amber}15` : T.surfaceH, border:`1px solid ${done ? T.green : current ? T.amber : T.border}`, textAlign:'center' }}>
                      <div style={{ fontSize:10, color:T.textMut, marginBottom:4 }}>Step {i + 1}</div>
                      <div style={{ fontSize:12, fontWeight:600, color: done ? T.green : current ? T.amber : T.textSec }}>{step}</div>
                      <div style={{ fontSize:10, marginTop:4 }}>{done ? 'Complete' : current ? 'Current' : 'Pending'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approvers */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Approvers</div>
              <table style={s.table}>
                <thead><tr>
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Role</th>
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Approver</th>
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Status</th>
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Timestamp</th>
                  <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Comment</th>
                </tr></thead>
                <tbody>
                  {w.approvers.map((a, i) => (
                    <tr key={i}>
                      <td style={s.td}>{a.role}</td>
                      <td style={s.td}>{a.name}</td>
                      <td style={s.td}><Badge text={a.status} bg={a.status === 'approved' ? T.green : a.status === 'rejected' ? T.red : T.amber} /></td>
                      <td style={s.td}>{fmtDateTime(a.timestamp)}</td>
                      <td style={{ ...s.td, fontSize:12, color:T.textSec }}>{a.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Evidence */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Evidence ({w.evidence.length} items)</div>
              {w.evidence.length === 0 ? <div style={{ fontSize:12, color:T.textMut }}>No evidence attached yet.</div> : (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {w.evidence.map((ev, i) => (
                    <div key={i} style={{ padding:'8px 14px', borderRadius:8, background:T.surfaceH, border:`1px solid ${T.border}`, fontSize:12 }}>
                      <div style={{ fontWeight:600 }}>{ev.description}</div>
                      <div style={{ fontSize:10, color:T.textMut }}>{ev.type} | {ev.attachment_ref}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval Action Panel */}
            {(w.status === 'in_review' || w.status === 'pending') && (
              <div style={{ padding:16, background:`${T.gold}10`, borderRadius:10, border:`1px solid ${T.gold}` }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Approval Action Required</div>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <label style={{ fontSize:11, color:T.textSec, display:'block', marginBottom:4 }}>Comment (required)</label>
                    <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={actionComment} onChange={e => setActionComment(e.target.value)} placeholder="Enter approval/rejection rationale..." />
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button style={s.btn(T.green)} onClick={() => handleApprove(w.id)} disabled={!actionComment.trim()}>Approve</button>
                    <button style={s.btn(T.red)} onClick={() => handleReject(w.id)} disabled={!actionComment.trim()}>Reject</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── SLA Dashboard ─────────────────────────────────────────────────── */}
      {tab === 'sla' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>SLA Status Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={slaDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="status" tick={{ fontSize:12 }} /><YAxis tick={{ fontSize:12 }} />
                <Tooltip /><Bar dataKey="count" radius={[6,6,0,0]}>
                  {slaDist.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>SLA Countdown — Active Workflows</h3>
            {filtered.filter(w => !['approved','rejected'].includes(w.status)).length === 0 ? (
              <div style={s.emptyState}>No active workflows.</div>
            ) : (
              <div style={{ maxHeight:260, overflowY:'auto' }}>
                {filtered.filter(w => !['approved','rejected'].includes(w.status)).map(w => {
                  const hoursLeft = (new Date(w.sla_deadline) - Date.now()) / 3600000;
                  const pct = Math.max(0, Math.min(100, hoursLeft > 0 ? (hoursLeft / (templates.find(t => t.id === w.template_id)?.sla_hours || 48)) * 100 : 0));
                  return (
                    <div key={w.id} style={{ padding:'8px 12px', borderBottom:`1px solid ${T.border}`, cursor:'pointer' }} onClick={() => { setSelectedWf(w); setTab('detail'); }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                        <span style={{ fontWeight:600 }}>{w.title.slice(0, 40)}{w.title.length > 40 ? '..' : ''}</span>
                        <Badge text={hoursLeft < 0 ? 'Breached' : `${Math.round(hoursLeft)}h`} bg={SLA_COLORS[w.sla_status]} />
                      </div>
                      <div style={s.stepBar()}><div style={s.stepFill(pct, SLA_COLORS[w.sla_status])} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Template Manager ──────────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div style={s.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Workflow Templates ({templates.length})</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
            {templates.map(tpl => (
              <div key={tpl.id} style={{ padding:16, borderRadius:12, border:`1px solid ${T.border}`, background:T.surface }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{tpl.name}</div>
                  <Badge text={tpl.category} bg={T.surfaceH} color={T.text} />
                </div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>{tpl.trigger}</div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>
                  <strong>Steps:</strong> {tpl.steps.join(' \u2192 ')}
                </div>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>
                  <strong>Approvers:</strong> {tpl.approvers.join(', ')}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginTop:8 }}>
                  <span>SLA: <strong>{tpl.sla_hours}h</strong></span>
                  <span>{tpl.steps.length} steps | {tpl.approvers.length} approvers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Workflow History ──────────────────────────────────────────────── */}
      {tab === 'history' && (() => {
        const completed = instances.filter(w => ['approved','rejected'].includes(w.status));
        const pageSize = 10;
        const totalPages = Math.ceil(completed.length / pageSize);
        const page = completed.slice(historyPage * pageSize, (historyPage + 1) * pageSize);
        return (
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Workflow History ({completed.length} completed)</h3>
            {completed.length === 0 ? (
              <div style={s.emptyState}><div style={{ fontSize:36, marginBottom:8 }}>--</div><div>No completed workflows yet.</div></div>
            ) : (
              <>
                <table style={s.table}>
                  <thead><tr>
                    <SortHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                    <SortHeader label="Template" field="template_name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                    <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Outcome</th>
                    <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Duration</th>
                    <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Approvers</th>
                    <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>SLA</th>
                    <th style={{ ...s.td, background:T.surfaceH, fontSize:12, fontWeight:600 }}>Evidence</th>
                  </tr></thead>
                  <tbody>
                    {page.map(w => {
                      const lastTs = w.approvers.filter(a => a.timestamp).pop()?.timestamp;
                      const durHrs = lastTs ? Math.round((new Date(lastTs) - new Date(w.created_at)) / 3600000) : '—';
                      return (
                        <tr key={w.id} style={{ cursor:'pointer' }} onClick={() => { setSelectedWf(w); setTab('detail'); }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...s.td, fontWeight:600 }}>{w.title}</td>
                          <td style={s.td}>{w.template_name}</td>
                          <td style={s.td}><Badge text={w.status} bg={w.status === 'approved' ? T.green : T.red} /></td>
                          <td style={s.td}>{durHrs}{typeof durHrs === 'number' ? 'h' : ''}</td>
                          <td style={s.td}>{w.approvers.length}</td>
                          <td style={s.td}><Badge text={w.sla_status.replace('_',' ')} bg={SLA_COLORS[w.sla_status]} /></td>
                          <td style={s.td}>{w.evidence.length} items</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:12 }}>
                    <button style={s.btnSm()} disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)}>Prev</button>
                    <span style={{ fontSize:12, padding:'6px 12px', color:T.textSec }}>Page {historyPage + 1} of {totalPages}</span>
                    <button style={s.btnSm()} disabled={historyPage >= totalPages - 1} onClick={() => setHistoryPage(p => p + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* ── Analytics Charts ──────────────────────────────────────────────── */}
      {tab === 'charts' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Category Distribution */}
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Category Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryDist} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke:T.border }}>
                  {categoryDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Volume */}
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Monthly Workflow Volume</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyVolume}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize:11 }} /><YAxis tick={{ fontSize:11 }} />
                <Tooltip /><Bar dataKey="count" fill={T.navy} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Approval Turnaround */}
          <div style={{ ...s.card, gridColumn:'1 / -1' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Avg Approval Turnaround by Template (hours)</h3>
            {turnaroundByTemplate.length === 0 ? (
              <div style={s.emptyState}>No completed approvals to analyze.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={turnaroundByTemplate} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:11 }} /><YAxis dataKey="name" type="category" width={160} tick={{ fontSize:11 }} />
                  <Tooltip /><Bar dataKey="avg_hours" fill={T.gold} radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Create Workflow Modal ─────────────────────────────────────────── */}
      {showCreateForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowCreateForm(false)}>
          <div style={{ background:T.surface, borderRadius:16, padding:28, width:520, maxWidth:'90vw', boxShadow:'0 16px 48px rgba(27,58,92,0.18)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Create New Workflow</h3>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Template</label>
              <select style={{ ...s.select, width:'100%' }} value={createTemplate} onChange={e => setCreateTemplate(e.target.value)}>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Title *</label>
              <input style={s.input} value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder="e.g. Rebalance ESG Fund — Q2 2025" />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Description</label>
              <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="Describe the approval request..." />
            </div>
            {/* Preview template details */}
            {(() => {
              const tpl = templates.find(t => t.id === createTemplate);
              return tpl ? (
                <div style={{ padding:12, background:T.surfaceH, borderRadius:8, fontSize:12, marginBottom:16 }}>
                  <div><strong>Steps:</strong> {tpl.steps.join(' \u2192 ')}</div>
                  <div style={{ marginTop:4 }}><strong>Approvers:</strong> {tpl.approvers.join(', ')}</div>
                  <div style={{ marginTop:4 }}><strong>SLA:</strong> {tpl.sla_hours} hours | <strong>Category:</strong> {tpl.category}</div>
                </div>
              ) : null;
            })()}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button style={s.btn(T.surfaceH, T.text)} onClick={() => setShowCreateForm(false)}>Cancel</button>
              <button style={s.btn(T.sage)} onClick={handleCreate} disabled={!createTitle.trim()}>Create Workflow</button>
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
            ['Model Governance', '/model-governance'],
            ['Regulatory Submission', '/regulatory-submission'],
            ['Data Governance', '/data-governance'],
            ['Compliance Evidence', '/compliance-evidence'],
          ].map(([label, path]) => (
            <button key={path} style={s.btnSm(T.surfaceH, T.navy)} onClick={() => navigate(path)}>{label} &rarr;</button>
          ))}
        </div>
      </div>
    </div>
  );
}
