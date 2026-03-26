import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER, globalSearch } from '../../../data/globalCompanyMaster';

/* ── Theme ───────────────────────────────────────────────────────────────────── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  blue:'#2563eb', teal:'#0d9488', indigo:'#4f46e5', purple:'#7c3aed',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const ESC_COLORS = { 1: '#16a34a', 2: '#65a30d', 3: '#d97706', 4: '#ea580c', 5: '#dc2626' };
const ESC_LABELS = { 1: 'Monitoring', 2: 'Watching', 3: 'Engaging', 4: 'Escalating', 5: 'Divest-Ready' };

const OUTCOME_STYLES = {
  'Pending':    { bg: '#f0f9ff', color: '#0369a1' },
  'Positive':   { bg: '#dcfce7', color: '#16a34a' },
  'Partial':    { bg: '#fef9c3', color: '#92400e' },
  'No Change':  { bg: '#fee2e2', color: '#dc2626' },
  'Escalated':  { bg: '#fef3c7', color: '#d97706' },
  'Resolved':   { bg: '#e0e7ff', color: '#4338ca' },
  'Negative':   { bg: '#fce4ec', color: '#c62828' },
};

const STATUS_PIPELINE = ['Draft', 'Sent', 'Acknowledged', 'In Progress', 'Resolved'];
const STATUS_COLORS = { Draft: T.textMut, Sent: T.blue, Acknowledged: T.amber, 'In Progress': T.sage, Resolved: T.green };

const TOPICS = ['Climate Target Setting', 'Coal Phase-Out', 'Board Diversity', 'Supply Chain Labor', 'Deforestation', 'Water Stewardship', 'Executive Remuneration', 'GHG Disclosure'];
const ENG_TYPES = ['Letter', 'Meeting', 'Public Statement', 'Collaborative', 'Vote Against', 'Co-filing'];
const MILESTONES = ['Initial Contact', 'Response Received', 'Commitment Made', 'Implementation', 'Verified', 'Closed'];
const OUTCOMES = ['Pending', 'Positive', 'Partial', 'No Change', 'Escalated', 'Resolved', 'Negative'];
const PIE_COLORS = ['#1b3a5c', '#c5a96a', '#5a8a6a', '#dc2626', '#d97706', '#2563eb', '#7c3aed', '#0d9488'];

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Sample engagements (15+) ────────────────────────────────────────────────── */
const SAMPLE_ENGAGEMENTS = [
  { id: uid(), companyName: 'NTPC Limited', ticker: 'NTPC', sector: 'Utilities', topic: 'Coal Phase-Out', engagementType: 'Letter', date: '2024-02-10', milestone: 'Response Received', escalationLevel: 3, outcome: 'Partial', status: 'In Progress', notes: 'Requested coal phase-down timeline by 2035; received partial response acknowledging transition need.', nextAction: 'Follow-up meeting on RE capacity targets', nextDate: '2024-04-15', esgScore: 38, sbtiCommitted: false },
  { id: uid(), companyName: 'Coal India Limited', ticker: 'COALINDIA', sector: 'Energy', topic: 'GHG Disclosure', engagementType: 'Meeting', date: '2024-01-22', milestone: 'Initial Contact', escalationLevel: 5, outcome: 'No Change', status: 'Sent', notes: 'CEO meeting on Scope 3 emissions and thermal coal expansion. No commitment received.', nextAction: 'File shareholder resolution on climate risk disclosure', nextDate: '2024-05-01', esgScore: 22, sbtiCommitted: false },
  { id: uid(), companyName: 'ExxonMobil', ticker: 'XOM', sector: 'Energy', topic: 'Climate Target Setting', engagementType: 'Collaborative', date: '2024-03-05', milestone: 'Commitment Made', escalationLevel: 2, outcome: 'Positive', status: 'In Progress', notes: 'Climate Action 100+ collaborative engagement. Company committed to absolute Scope 1&2 reduction targets aligned with Paris.', nextAction: 'Monitor FY2024 GHG report for progress', nextDate: '2024-09-30', esgScore: 48, sbtiCommitted: true },
  { id: uid(), companyName: 'Tata Steel', ticker: 'TATASTEEL', sector: 'Materials', topic: 'Climate Target Setting', engagementType: 'Letter', date: '2024-02-28', milestone: 'Implementation', escalationLevel: 1, outcome: 'Positive', status: 'In Progress', notes: 'Green steel transition plan endorsed. EAF transition roadmap confirmed for UK operations by 2027.', nextAction: 'Verify capex allocation in annual report', nextDate: '2024-07-20', esgScore: 55, sbtiCommitted: true },
  { id: uid(), companyName: 'JSW Steel', ticker: 'JSWSTEEL', sector: 'Materials', topic: 'GHG Disclosure', engagementType: 'Vote Against', date: '2024-01-15', milestone: 'Response Received', escalationLevel: 4, outcome: 'Escalated', status: 'Sent', notes: 'Voted against board reappointment due to insufficient climate governance disclosure.', nextAction: 'Engage board sustainability committee', nextDate: '2024-06-10', esgScore: 42, sbtiCommitted: false },
  { id: uid(), companyName: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Financials', topic: 'Board Diversity', engagementType: 'Letter', date: '2024-03-12', milestone: 'Response Received', escalationLevel: 2, outcome: 'Positive', status: 'Acknowledged', notes: 'Requested board gender diversity improvement. Bank committed to 33% female board representation by 2026.', nextAction: 'Review next board appointment', nextDate: '2024-08-01', esgScore: 61, sbtiCommitted: false },
  { id: uid(), companyName: 'Infosys', ticker: 'INFY', sector: 'Information Technology', topic: 'Board Diversity', engagementType: 'Meeting', date: '2024-01-30', milestone: 'Verified', escalationLevel: 1, outcome: 'Positive', status: 'Resolved', notes: 'Board diversity targets met ahead of schedule. 40% independent directors with relevant ESG expertise.', nextAction: 'Annual review', nextDate: '2025-01-30', esgScore: 72, sbtiCommitted: true },
  { id: uid(), companyName: 'Apple Inc.', ticker: 'AAPL', sector: 'Information Technology', topic: 'Supply Chain Labor', engagementType: 'Collaborative', date: '2024-02-20', milestone: 'Commitment Made', escalationLevel: 2, outcome: 'Partial', status: 'In Progress', notes: 'Investor coalition engagement on supply chain labor conditions in Foxconn facilities. Apple committed to enhanced auditing.', nextAction: 'Request Q3 audit results', nextDate: '2024-10-15', esgScore: 68, sbtiCommitted: true },
  { id: uid(), companyName: 'Samsung Electronics', ticker: '005930', sector: 'Information Technology', topic: 'Supply Chain Labor', engagementType: 'Letter', date: '2024-03-01', milestone: 'Initial Contact', escalationLevel: 3, outcome: 'Pending', status: 'Sent', notes: 'Letter sent regarding cobalt mining supply chain due diligence and child labor risk management.', nextAction: 'Follow up if no response by April', nextDate: '2024-04-30', esgScore: 52, sbtiCommitted: false },
  { id: uid(), companyName: 'Nestle SA', ticker: 'NESN', sector: 'Consumer Staples', topic: 'Deforestation', engagementType: 'Public Statement', date: '2024-01-18', milestone: 'Response Received', escalationLevel: 3, outcome: 'Partial', status: 'Acknowledged', notes: 'Co-signed public statement on palm oil deforestation. Nestle updated zero-deforestation commitment timeline.', nextAction: 'Verify satellite monitoring implementation', nextDate: '2024-06-30', esgScore: 56, sbtiCommitted: true },
  { id: uid(), companyName: 'Adani Enterprises', ticker: 'ADANIENT', sector: 'Energy', topic: 'Coal Phase-Out', engagementType: 'Vote Against', date: '2024-02-05', milestone: 'Initial Contact', escalationLevel: 5, outcome: 'No Change', status: 'Sent', notes: 'Voted against all board resolutions due to Carmichael mine expansion contradicting Paris alignment.', nextAction: 'Escalate to collaborative engagement platform', nextDate: '2024-05-15', esgScore: 18, sbtiCommitted: false },
  { id: uid(), companyName: 'Rio Tinto', ticker: 'RIO', sector: 'Materials', topic: 'Water Stewardship', engagementType: 'Meeting', date: '2024-03-18', milestone: 'Commitment Made', escalationLevel: 2, outcome: 'Positive', status: 'In Progress', notes: 'Engagement on water usage in Pilbara operations. Rio committed to 15% water intensity reduction by 2030.', nextAction: 'Review water audit report Q4', nextDate: '2024-12-01', esgScore: 58, sbtiCommitted: true },
  { id: uid(), companyName: 'Shell plc', ticker: 'SHEL', sector: 'Energy', topic: 'Executive Remuneration', engagementType: 'Co-filing', date: '2024-02-14', milestone: 'Response Received', escalationLevel: 3, outcome: 'Escalated', status: 'In Progress', notes: 'Co-filed resolution linking 30% of executive pay to Scope 3 reduction targets. Board engagement ongoing.', nextAction: 'AGM vote preparation', nextDate: '2024-05-20', esgScore: 45, sbtiCommitted: true },
  { id: uid(), companyName: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Energy', topic: 'Climate Target Setting', engagementType: 'Meeting', date: '2024-01-28', milestone: 'Commitment Made', escalationLevel: 2, outcome: 'Positive', status: 'Acknowledged', notes: 'Engagement on net-zero 2035 commitment for O2C business. Green hydrogen capex plan presented.', nextAction: 'Review FY2024 sustainability report', nextDate: '2024-08-15', esgScore: 52, sbtiCommitted: true },
  { id: uid(), companyName: 'TCS', ticker: 'TCS', sector: 'Information Technology', topic: 'GHG Disclosure', engagementType: 'Letter', date: '2024-03-22', milestone: 'Verified', escalationLevel: 1, outcome: 'Positive', status: 'Resolved', notes: 'TCFD-aligned disclosure verified. Scope 1,2,3 reporting with SBTi-validated targets in place.', nextAction: 'Annual monitoring', nextDate: '2025-03-01', esgScore: 68, sbtiCommitted: true },
  { id: uid(), companyName: 'BP plc', ticker: 'BP', sector: 'Energy', topic: 'Climate Target Setting', engagementType: 'Collaborative', date: '2024-02-22', milestone: 'Response Received', escalationLevel: 3, outcome: 'Partial', status: 'In Progress', notes: 'Climate Action 100+ engagement. BP revised down 2030 emissions cut target from 35-40% to 20-30%.', nextAction: 'Escalation review with coalition partners', nextDate: '2024-06-15', esgScore: 46, sbtiCommitted: false },
];

const BLANK_FORM = { companyName: '', ticker: '', sector: '', topic: '', engagementType: '', date: '', milestone: '', escalationLevel: 3, outcome: 'Pending', status: 'Draft', notes: '', nextAction: '', nextDate: '', esgScore: null, sbtiCommitted: false };
const LS_KEY = 'ra_stewardship_v1';

/* ── Export helpers ───────────────────────────────────────────────────────────── */
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */
export default function StewardshipTrackerPage() {
  const navigate = useNavigate();

  const [engagements, setEngagements] = useState(() => {
    try { const saved = localStorage.getItem(LS_KEY); if (saved) return JSON.parse(saved); } catch {}
    return SAMPLE_ENGAGEMENTS;
  });

  const [form, setForm] = useState(BLANK_FORM);
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [filterEscHigh, setFilterEscHigh] = useState(false);
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [companySearch, setCompanySearch] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(engagements)); } catch {}
  }, [engagements]);

  /* ── Company autocomplete from GLOBAL_COMPANY_MASTER ───────────────────── */
  useEffect(() => {
    if (companySearch.length < 2) { setCompanySuggestions([]); return; }
    try {
      const results = globalSearch(companySearch, 8);
      setCompanySuggestions(results);
    } catch {
      const q = companySearch.toLowerCase();
      const results = GLOBAL_COMPANY_MASTER.filter(c => (c.name || '').toLowerCase().includes(q) || (c.ticker || '').toLowerCase().includes(q)).slice(0, 8);
      setCompanySuggestions(results);
    }
  }, [companySearch]);

  const selectCompany = (c) => {
    setForm(prev => ({
      ...prev,
      companyName: c.name || '',
      ticker: c.ticker || '',
      sector: c.sector || '',
      esgScore: c.esg_score || null,
      sbtiCommitted: c.sbti_committed || false,
    }));
    setCompanySearch(c.name || '');
    setShowSuggestions(false);
  };

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLog = () => {
    if (!form.companyName.trim()) return;
    const newEng = { ...form, id: uid(), escalationLevel: Number(form.escalationLevel) };
    setEngagements(prev => [newEng, ...prev]);
    setForm(BLANK_FORM);
    setCompanySearch('');
  };

  const handleDelete = (id) => setEngagements(prev => prev.filter(e => e.id !== id));

  /* ── Sort handler ──────────────────────────────────────────────────────── */
  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);
  const sortArrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Filtered & sorted ─────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let rows = engagements;
    if (search) { const q = search.toLowerCase(); rows = rows.filter(e => e.companyName.toLowerCase().includes(q) || (e.ticker || '').toLowerCase().includes(q)); }
    if (filterOutcome !== 'All') rows = rows.filter(e => e.outcome === filterOutcome);
    if (filterEscHigh) rows = rows.filter(e => e.escalationLevel >= 3);

    rows = [...rows].sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'date': av = a.date || ''; bv = b.date || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'company': av = a.companyName.toLowerCase(); bv = b.companyName.toLowerCase(); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'topic': av = (a.topic || '').toLowerCase(); bv = (b.topic || '').toLowerCase(); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'escalation': av = a.escalationLevel; bv = b.escalationLevel; return sortDir === 'asc' ? av - bv : bv - av;
        case 'outcome': av = a.outcome; bv = b.outcome; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'nextDate': av = a.nextDate || ''; bv = b.nextDate || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        default: return 0;
      }
    });
    return rows;
  }, [engagements, search, filterOutcome, filterEscHigh, sortCol, sortDir]);

  /* ── Analytics KPIs ────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const completed = engagements.filter(e => ['Positive', 'Partial', 'No Change', 'Resolved', 'Negative'].includes(e.outcome));
    const positive = engagements.filter(e => e.outcome === 'Positive').length;
    const active = engagements.filter(e => ['Pending', 'Escalated'].includes(e.outcome) || !['Resolved', 'Closed'].includes(e.milestone)).length;
    const avgEsc = engagements.length > 0 ? +(engagements.reduce((s, e) => s + e.escalationLevel, 0) / engagements.length).toFixed(1) : 0;

    // Most engaged sector
    const sectorCount = {};
    engagements.forEach(e => { sectorCount[e.sector] = (sectorCount[e.sector] || 0) + 1; });
    const topSector = Object.entries(sectorCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Most engaged topic
    const topicCount = {};
    engagements.forEach(e => { if (e.topic) topicCount[e.topic] = (topicCount[e.topic] || 0) + 1; });
    const topTopic = Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: engagements.length,
      active,
      successRate: completed.length > 0 ? +((positive / completed.length) * 100).toFixed(0) : 0,
      avgEsc,
      topSector,
      topTopic,
    };
  }, [engagements]);

  /* ── Chart data ────────────────────────────────────────────────────────── */
  const topicChartData = useMemo(() => {
    const map = {};
    engagements.forEach(e => { const t = e.topic || 'Other'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [engagements]);

  const escalationChartData = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    engagements.forEach(e => { counts[e.escalationLevel] = (counts[e.escalationLevel] || 0) + 1; });
    return Object.entries(counts).map(([level, count]) => ({ level: `L${level} ${ESC_LABELS[level]}`, count, fill: ESC_COLORS[level] }));
  }, [engagements]);

  const outcomeChartData = useMemo(() => {
    const map = {};
    engagements.forEach(e => { map[e.outcome] = (map[e.outcome] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [engagements]);

  const monthlyTrendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const yy = d.getFullYear(); const mm = d.getMonth();
      const count = engagements.filter(e => {
        if (!e.date) return false;
        const ed = new Date(e.date);
        return ed.getFullYear() === yy && ed.getMonth() === mm;
      }).length;
      months.push({ month: label, count });
    }
    return months;
  }, [engagements]);

  /* ── Export handlers ────────────────────────────────────────────────────── */
  const exportCSV = () => {
    const rows = engagements.map(e => ({
      Company: e.companyName, Ticker: e.ticker, Sector: e.sector, Topic: e.topic || '',
      Type: e.engagementType, Date: e.date, Milestone: e.milestone,
      Escalation: e.escalationLevel, Outcome: e.outcome, Status: e.status || '',
      Notes: e.notes, 'Next Action': e.nextAction, 'Next Date': e.nextDate,
      ESG: e.esgScore || '', SBTi: e.sbtiCommitted ? 'Yes' : 'No',
    }));
    downloadCSV('stewardship_engagements.csv', rows);
  };

  const exportPRI = () => {
    const data = {
      reportingPeriod: '2024',
      totalEngagements: engagements.length,
      engagementsByType: {},
      engagementsByOutcome: {},
      escalationSummary: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
      engagements: engagements.map(e => ({
        company: e.companyName, topic: e.topic, type: e.engagementType,
        date: e.date, escalation: e.escalationLevel, outcome: e.outcome,
        milestone: e.milestone,
      })),
    };
    engagements.forEach(e => {
      data.engagementsByType[e.engagementType] = (data.engagementsByType[e.engagementType] || 0) + 1;
      data.engagementsByOutcome[e.outcome] = (data.engagementsByOutcome[e.outcome] || 0) + 1;
      data.escalationSummary[`level${e.escalationLevel}`]++;
    });
    downloadJSON('pri_report_data.json', data);
  };

  /* ── Sortable TH ───────────────────────────────────────────────────────── */
  const TH = ({ col, label }) => (
    <th onClick={() => handleSort(col)} style={{
      padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 11,
      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
      background: sortCol === col ? '#2c5a8c' : T.navy,
    }}>{label}{sortArrow(col)}</th>
  );

  /* ── Mini status pipeline ──────────────────────────────────────────────── */
  const StatusPipeline = ({ status }) => {
    const idx = STATUS_PIPELINE.indexOf(status || 'Draft');
    return (
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {STATUS_PIPELINE.map((s, i) => (
          <div key={s} title={s} style={{
            width: 18, height: 6, borderRadius: 3,
            background: i <= idx ? (STATUS_COLORS[s] || T.textMut) : T.border,
            transition: 'background 0.2s',
          }} />
        ))}
        <span style={{ fontSize: 10, color: STATUS_COLORS[status] || T.textMut, fontWeight: 700, marginLeft: 4 }}>{status || 'Draft'}</span>
      </div>
    );
  };

  /* ── Check if company is in portfolio ──────────────────────────────────── */
  const portfolioTickers = useMemo(() => {
    try {
      const raw = localStorage.getItem('ra_portfolio_v1');
      if (!raw) return new Set();
      const outer = JSON.parse(raw);
      if (outer && outer.portfolios && outer.activePortfolio) {
        const h = outer.portfolios[outer.activePortfolio]?.holdings || [];
        return new Set(h.map(x => x.company?.ticker).filter(Boolean));
      }
    } catch {}
    return new Set();
  }, []);

  /* ── Tooltip for charts ────────────────────────────────────────────────── */
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 700, color: T.navy }}>{label || payload[0]?.name}</div>
        <div style={{ color: T.textSec }}>{payload[0]?.value} engagements</div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                    */
  /* ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '24px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Stewardship & Engagement Tracker</h1>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, background: '#c5a96a18', border: '1px solid #c5a96a44', borderRadius: 4, padding: '2px 8px' }}>EP-F3</span>
          {['PRI Active Ownership', 'UK Stewardship Code 2020', 'EFAMA Stewardship'].map(b => (
            <span key={b} style={{ padding: '3px 10px', borderRadius: 20, background: T.indigo, color: '#fff', fontSize: 11, fontWeight: 600 }}>{b}</span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>Log, monitor and escalate investor engagements. Data persisted locally.</p>
      </div>

      {/* ── Export & Nav Bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { label: 'Export Engagements CSV', fn: exportCSV },
          { label: 'Export PRI Report JSON', fn: exportPRI },
          { label: 'Print Engagement Summary', fn: () => window.print() },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{btn.label}</button>
        ))}
      </div>

      {/* ── KPI Strip (6 Analytics KPIs) ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total Engagements', value: kpis.total, color: T.navy, bg: '#eff6ff' },
          { label: 'Active', value: kpis.active, color: T.blue, bg: '#dbeafe' },
          { label: 'Success Rate', value: `${kpis.successRate}%`, color: T.green, bg: '#dcfce7' },
          { label: 'Avg Escalation', value: kpis.avgEsc, color: T.amber, bg: '#fef3c7' },
          { label: 'Top Sector', value: kpis.topSector, color: T.navy, bg: '#f0ede7', small: true },
          { label: 'Top Topic', value: kpis.topTopic, color: T.navy, bg: '#f0ede7', small: true },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: k.small ? 14 : 24, fontWeight: 800, color: k.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Charts (2x2 grid) ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        {/* Engagement by Topic Pie */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Engagement by Topic</div>
          {topicChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={topicChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {topicChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No data</div>}
        </div>

        {/* Escalation Level Bar */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Escalation Level Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={escalationChartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="level" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {escalationChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Outcome Distribution Pie */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Outcome Distribution</div>
          {outcomeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={outcomeChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine style={{ fontSize: 10 }}>
                  {outcomeChartData.map((d, i) => <Cell key={i} fill={OUTCOME_STYLES[d.name]?.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: T.textMut, padding: 40 }}>No data</div>}
        </div>

        {/* Monthly Trend Area */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Monthly Engagement Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.navy} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.navy} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" stroke={T.navy} strokeWidth={2} fill="url(#trendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Main content: Form + Table ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* LEFT: Enhanced Form with company autocomplete */}
        <div style={{ width: 330, flexShrink: 0 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.navy }}>New Engagement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Company Search Autocomplete */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Company * (search master list)</label>
                <input type="text" value={companySearch} placeholder="Type company name or ticker..."
                  onChange={e => { setCompanySearch(e.target.value); setShowSuggestions(true); handleFormChange('companyName', e.target.value); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg, boxSizing: 'border-box' }} />
                {showSuggestions && companySuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, maxHeight: 220, overflowY: 'auto' }}>
                    {companySuggestions.map((c, i) => (
                      <div key={i} onMouseDown={() => selectCompany(c)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                        onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                        <div style={{ fontWeight: 600, color: T.navy }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: T.textMut }}>{c.ticker} · {c.sector} · ESG: {c.esg_score || 'N/A'} {c.sbti_committed ? '· SBTi' : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-populated fields indicator */}
              {form.esgScore != null && (
                <div style={{ padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11, color: '#166534' }}>
                  Auto-filled: {form.sector} · ESG {form.esgScore} {form.sbtiCommitted ? '· SBTi Committed' : ''}
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Topic</label>
                <select value={form.topic} onChange={e => handleFormChange('topic', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg }}>
                  <option value="">Select topic...</option>
                  {TOPICS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Engagement Type</label>
                <select value={form.engagementType} onChange={e => handleFormChange('engagementType', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg }}>
                  <option value="">Select...</option>
                  {ENG_TYPES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Date</label>
                <input type="date" value={form.date} onChange={e => handleFormChange('date', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Status</label>
                <select value={form.status} onChange={e => handleFormChange('status', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg }}>
                  {STATUS_PIPELINE.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Milestone</label>
                <select value={form.milestone} onChange={e => handleFormChange('milestone', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg }}>
                  <option value="">Select...</option>
                  {MILESTONES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>
                  Escalation: <span style={{ fontWeight: 800, color: ESC_COLORS[form.escalationLevel] }}>{form.escalationLevel} \u2014 {ESC_LABELS[form.escalationLevel]}</span>
                </label>
                <input type="range" min={1} max={5} step={1} value={form.escalationLevel} onChange={e => handleFormChange('escalationLevel', Number(e.target.value))} style={{ width: '100%', accentColor: ESC_COLORS[form.escalationLevel] }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Outcome</label>
                <select value={form.outcome} onChange={e => handleFormChange('outcome', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg }}>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Notes</label>
                <textarea value={form.notes} onChange={e => handleFormChange('notes', e.target.value)} rows={3} placeholder="Engagement context..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Next Action</label>
                <input type="text" value={form.nextAction} onChange={e => handleFormChange('nextAction', e.target.value)} placeholder="e.g. Follow-up call" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 3 }}>Next Date</label>
                <input type="date" value={form.nextDate} onChange={e => handleFormChange('nextDate', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: T.bg, boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleLog} disabled={!form.companyName.trim()} style={{ padding: '11px', borderRadius: 8, background: !form.companyName.trim() ? T.border : T.navy, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: form.companyName.trim() ? 'pointer' : 'not-allowed', marginTop: 4 }}>
                Log Engagement
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Filter + Sortable Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or ticker..."
              style={{ flex: 1, minWidth: 180, padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text, background: T.surface }} />
            <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text, background: T.surface }}>
              <option>All</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.text, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={filterEscHigh} onChange={e => setFilterEscHigh(e.target.checked)} style={{ accentColor: T.red }} />
              Escalation \u2265 3
            </label>
          </div>

          {/* Sortable Engagements Table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 22 }}>
            <div style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, position: 'sticky', top: 0, zIndex: 2 }}>
                    <TH col="company" label="Company" />
                    <TH col="topic" label="Topic" />
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Type</th>
                    <TH col="date" label="Date" />
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                    <TH col="escalation" label="Esc." />
                    <TH col="outcome" label="Outcome" />
                    <TH col="nextDate" label="Next" />
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center', color: T.textSec }}>No engagements match current filters.</td></tr>
                  )}
                  {filtered.map((e, i) => {
                    const escColor = ESC_COLORS[e.escalationLevel] || T.textSec;
                    const outStyle = OUTCOME_STYLES[e.outcome] || { bg: T.bg, color: T.textSec };
                    const inPortfolio = portfolioTickers.has(e.ticker);
                    return (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: T.text }}>
                          <div style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.companyName}</div>
                          <div style={{ fontSize: 10, color: T.textSec }}>
                            {e.ticker} · {e.sector}
                            {inPortfolio && <span style={{ marginLeft: 4, padding: '1px 5px', borderRadius: 3, background: '#dcfce7', color: T.green, fontSize: 9, fontWeight: 700 }}>In Portfolio</span>}
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 11 }}>{e.topic || '\u2014'}</td>
                        <td style={{ padding: '9px 12px', color: T.textSec, whiteSpace: 'nowrap' }}>{e.engagementType}</td>
                        <td style={{ padding: '9px 12px', color: T.textSec, whiteSpace: 'nowrap' }}>{e.date || '\u2014'}</td>
                        <td style={{ padding: '9px 12px' }}><StatusPipeline status={e.status} /></td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: escColor, color: '#fff', fontSize: 11, fontWeight: 800 }}>{e.escalationLevel}</span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: outStyle.bg, color: outStyle.color, whiteSpace: 'nowrap' }}>{e.outcome}</span>
                        </td>
                        <td style={{ padding: '9px 12px', color: T.textSec, whiteSpace: 'nowrap', fontSize: 11 }}>{e.nextDate || '\u2014'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button onClick={() => navigate(`/controversy-monitor?company=${encodeURIComponent(e.companyName)}`)} title="View Controversies" style={{ padding: '3px 6px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, color: T.navyL, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Controversies</button>
                            <button onClick={() => navigate(`/holdings-deep-dive?ticker=${e.ticker}`)} title="Deep-Dive" style={{ padding: '3px 6px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, color: T.navyL, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Deep-Dive</button>
                            <button onClick={() => handleDelete(e.id)} title="Delete" style={{ background: '#fee2e2', border: 'none', borderRadius: 4, color: T.red, cursor: 'pointer', padding: '3px 6px', fontSize: 10, fontWeight: 700 }}>\u2715</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, padding: '12px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: T.textMut }}>AA Impact Risk Analytics Platform \u2014 EP-F3 Stewardship & Engagement Tracker</span>
        <span style={{ fontSize: 11, color: T.textMut }}>{engagements.length} engagements tracked \u00B7 {kpis.active} active \u00B7 {kpis.successRate}% success rate</span>
      </div>
    </div>
  );
}
