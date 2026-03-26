// EP-P6 -- Data Infrastructure Intelligence Dashboard (Hub)
// Sprint P -- Data Infrastructure & Live Feeds
// Central hub aggregating API orchestration, data quality, live feeds, lineage, and BRSR
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';

/* ── Theme ── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const LS_KEY = 'ra_data_infra_hub_v1';
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; } return Math.abs(h); };
const seeded = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
const fmt = (n) => n == null ? '--' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString()) : String(n);
const pct = (n) => n == null ? '--' : n.toFixed(1) + '%';
const PIE_COLORS = [T.navy, T.sage, T.gold, T.red, T.navyL, T.sageL, T.goldL, '#8b5cf6', '#06b6d4'];

/* ── Data Sources ── */
const DATA_SOURCES = [
  { name: 'Yahoo Finance', type: 'Free API', status: 'Active', fields: 48, companies: 656, latency: 320, calls_today: 2480, errors: 3 },
  { name: 'Open FIGI', type: 'Free API', status: 'Active', fields: 12, companies: 656, latency: 180, calls_today: 890, errors: 0 },
  { name: 'IMF Climate Data', type: 'Free API', status: 'Active', fields: 24, companies: 120, latency: 450, calls_today: 340, errors: 1 },
  { name: 'CBI Taxonomy', type: 'Free Dataset', status: 'Active', fields: 36, companies: 400, latency: 0, calls_today: 0, errors: 0 },
  { name: 'BRSR Supabase', type: 'PostgreSQL', status: 'Active', fields: 92, companies: 1323, latency: 85, calls_today: 1560, errors: 2 },
  { name: 'NSE/BSE India', type: 'Free Scrape', status: 'Active', fields: 28, companies: 200, latency: 520, calls_today: 420, errors: 5 },
  { name: 'Company Master', type: 'Internal', status: 'Active', fields: 64, companies: 656, latency: 5, calls_today: 12400, errors: 0 },
  { name: 'Exchange Data', type: 'Internal', status: 'Active', fields: 32, companies: 656, latency: 8, calls_today: 8900, errors: 0 },
  { name: 'Bloomberg (Planned)', type: 'Paid API', status: 'Planned', fields: 200, companies: 5000, latency: null, calls_today: 0, errors: 0 },
  { name: 'Refinitiv (Planned)', type: 'Paid API', status: 'Planned', fields: 180, companies: 4500, latency: null, calls_today: 0, errors: 0 },
];

const MODULES = [
  { id: 'api-orch', name: 'API Orchestration', status: 'Operational', health: 96, path: '/api-orchestration', desc: 'Rate-limited multi-source API manager', icon: 'A', color: T.navy },
  { id: 'data-quality', name: 'Data Quality', status: 'Operational', health: 91, path: '/esg-data-quality', desc: 'BCBS 239 compliant DQ scoring engine', icon: 'Q', color: T.sage },
  { id: 'live-feeds', name: 'Live Feeds', status: 'Operational', health: 88, path: '/live-feeds', desc: 'Real-time market & ESG data streaming', icon: 'F', color: T.gold },
  { id: 'lineage', name: 'Data Lineage', status: 'Warning', health: 82, path: '/data-lineage', desc: 'Field-level provenance & audit trail', icon: 'L', color: T.amber },
  { id: 'brsr-bridge', name: 'BRSR Bridge', status: 'Operational', health: 94, path: '/brsr-bridge', desc: '1,323 Indian companies SEBI BRSR pipeline', icon: 'B', color: T.navyL },
];

const ACTIVITY_FEED = (() => {
  const actions = ['Sync', 'Enrichment', 'API Call', 'Override', 'Validation', 'Cache Refresh', 'DQ Check', 'Alert'];
  const sources = ['Yahoo Finance', 'BRSR Supabase', 'Open FIGI', 'Company Master', 'IMF Climate', 'NSE/BSE'];
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    time: new Date(Date.now() - (i * 7 + Math.floor(seeded(i * 3) * 15)) * 60000).toLocaleTimeString(),
    action: actions[Math.floor(seeded(i * 7) * actions.length)],
    source: sources[Math.floor(seeded(i * 11) * sources.length)],
    detail: `${Math.floor(10 + seeded(i * 13) * 500)} records processed`,
    status: seeded(i * 17) > 0.15 ? 'Success' : 'Warning',
  }));
})();

const ALERTS = [
  { id: 1, severity: 'High', type: 'Stale Data', desc: 'IMF Climate dataset >48h old', module: 'Live Feeds', time: '2h ago' },
  { id: 2, severity: 'Medium', type: 'Error Rate', desc: 'NSE/BSE scraper 2.4% error rate (threshold 2%)', module: 'API Orchestration', time: '35m ago' },
  { id: 3, severity: 'Low', type: 'Low DQ Score', desc: '12 companies below DQ threshold of 50', module: 'Data Quality', time: '1h ago' },
  { id: 4, severity: 'Medium', type: 'Rate Limit', desc: 'Yahoo Finance at 82% of daily limit', module: 'API Orchestration', time: '15m ago' },
  { id: 5, severity: 'Low', type: 'Lineage Gap', desc: '8 fields missing provenance metadata', module: 'Data Lineage', time: '3h ago' },
];

const MODULE_DATA_DEPS = [
  { module: 'PCAF Financed Emissions', sources: 'Company Master, Yahoo Finance', fields: 24, dq_dep: 'High' },
  { module: 'Portfolio Climate VaR', sources: 'Company Master, NGFS Scenarios', fields: 18, dq_dep: 'Critical' },
  { module: 'TCFD Reporting', sources: 'Company Master, BRSR Supabase', fields: 32, dq_dep: 'High' },
  { module: 'Carbon Budget', sources: 'Company Master, IMF Climate', fields: 14, dq_dep: 'Medium' },
  { module: 'Stranded Assets', sources: 'Company Master, Exchange Data', fields: 20, dq_dep: 'High' },
  { module: 'ESG Screener', sources: 'Company Master, Yahoo Finance, BRSR', fields: 42, dq_dep: 'Critical' },
  { module: 'SFDR PAI', sources: 'Company Master, BRSR Supabase', fields: 28, dq_dep: 'Critical' },
  { module: 'Sector Benchmarking', sources: 'Company Master, Exchange Data', fields: 22, dq_dep: 'Medium' },
  { module: 'Stewardship Tracker', sources: 'Company Master, Yahoo Finance', fields: 16, dq_dep: 'Low' },
  { module: 'CSRD DMA', sources: 'Company Master, BRSR, CBI Taxonomy', fields: 36, dq_dep: 'Critical' },
];

const UPGRADE_RECS = [
  { source: 'Bloomberg Terminal', benefit: '+4,344 companies, real-time pricing', cost: '$24K/yr', priority: 'High', coverage_delta: '+662%' },
  { source: 'Refinitiv ESG', benefit: 'Institutional-grade ESG scores', cost: '$18K/yr', priority: 'High', coverage_delta: '+180 fields' },
  { source: 'CDP Climate Data', benefit: 'Verified Scope 1-3 emissions', cost: '$8K/yr', priority: 'Medium', coverage_delta: '+3,200 cos' },
  { source: 'Sustainalytics', benefit: 'Controversy monitoring, ESG risk', cost: '$12K/yr', priority: 'Medium', coverage_delta: '+120 fields' },
  { source: 'MSCI ESG Ratings', benefit: 'Industry-standard ratings', cost: '$15K/yr', priority: 'Low', coverage_delta: '+1 rating field' },
];

/* ── UI Primitives ── */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? T.gold : T.border}`, borderRadius: 10, padding: '14px 18px', borderLeft: accent ? `4px solid ${T.gold}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, id }) => (
  <div id={id} style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>{title}</div>
    {children}
  </div>
);

const Badge = ({ label, color }) => {
  const mp = { green: { bg: '#dcfce7', fg: T.green }, amber: { bg: '#fef3c7', fg: T.amber }, red: { bg: '#fee2e2', fg: T.red }, blue: { bg: '#dbeafe', fg: '#2563eb' }, navy: { bg: '#e0e7ef', fg: T.navy }, gold: { bg: '#fef3c7', fg: '#92400e' }, sage: { bg: '#dcfce7', fg: '#166534' }, purple: { bg: '#f3e8ff', fg: '#7c3aed' } };
  const c = mp[color] || mp.blue;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg }}>{label}</span>;
};

const Btn = ({ children, onClick, variant, small, disabled }) => {
  const isPrimary = variant === 'primary';
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 7, border: isPrimary ? 'none' : `1px solid ${T.border}`, background: disabled ? T.border : isPrimary ? T.navy : T.surface, color: disabled ? T.textMut : isPrimary ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.font }}>{children}</button>
  );
};

const SortHeader = ({ label, sortKey, sortState, onSort }) => (
  <th onClick={() => onSort(sortKey)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', userSelect: 'none', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, whiteSpace: 'nowrap' }}>
    {label} {sortState.key === sortKey ? (sortState.dir === 'asc' ? ' ^' : ' v') : ''}
  </th>
);

const Slider = ({ label, min, max, value, onChange, fmtFn }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec, marginBottom: 2 }}>
      <span>{label}</span><span style={{ fontWeight: 600 }}>{fmtFn ? fmtFn(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} style={{ width: '100%', accentColor: T.navy }} />
  </div>
);

const StatusDot = ({ status }) => {
  const colors = { Operational: T.green, Warning: T.amber, Error: T.red, Planned: T.textMut };
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors[status] || T.textMut, marginRight: 6 }} />;
};

/* ── Export Helpers ── */
const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const exportJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
const printPage = () => window.print();

/* ══════════════════════════════════════════════════════════════════════════════ */
const DataInfraHubPage = () => {
  const navigate = useNavigate();
  const portfolio = useMemo(() => GLOBAL_COMPANY_MASTER.slice(0, 656), []);

  const [activeTab, setActiveTab] = useState(0);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [alertFilter, setAlertFilter] = useState('All');
  const [refreshInterval, setRefreshInterval] = useState(() => load(LS_KEY + '_refresh', 30));
  const [apiUsageSlider, setApiUsageSlider] = useState(82);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => { save(LS_KEY + '_refresh', refreshInterval); }, [refreshInterval]);

  const handleSort = useCallback((key) => setSort(p => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' })), []);
  const sortFn = useCallback((a, b) => {
    const v1 = a[sort.key], v2 = b[sort.key];
    const cmp = typeof v1 === 'number' ? v1 - v2 : String(v1 || '').localeCompare(String(v2 || ''));
    return sort.dir === 'asc' ? cmp : -cmp;
  }, [sort]);

  const TABS = ['Overview & Health', 'Data Sources & Flow', 'Monitoring & Alerts', 'Capacity & Upgrades'];
  const totalCalls = DATA_SOURCES.reduce((s, d) => s + d.calls_today, 0);
  const totalErrors = DATA_SOURCES.reduce((s, d) => s + d.errors, 0);
  const avgLatency = Math.round(DATA_SOURCES.filter(d => d.latency > 0).reduce((s, d) => s + d.latency, 0) / DATA_SOURCES.filter(d => d.latency > 0).length);
  const activeSources = DATA_SOURCES.filter(d => d.status === 'Active').length;
  const totalFields = DATA_SOURCES.reduce((s, d) => s + d.fields, 0);
  const errorRate = totalCalls > 0 ? (totalErrors / totalCalls * 100) : 0;

  const coverageData = [
    { name: 'Fully Covered', value: 478 },
    { name: 'Partially Covered', value: 142 },
    { name: 'Gap', value: 36 },
  ];

  const costBenefitData = DATA_SOURCES.map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '..' : d.name,
    fields: d.fields,
    companies: Math.min(d.companies, 1400),
    type: d.type,
  }));

  const latencyTrend = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    api: Math.round(200 + seeded(i * 7) * 300),
    db: Math.round(50 + seeded(i * 11) * 100),
    cache: Math.round(2 + seeded(i * 13) * 15),
  }));

  const capacityData = [
    { label: 'Yahoo Finance', used: 2480, limit: 5000, unit: 'calls/day' },
    { label: 'Open FIGI', used: 890, limit: 2500, unit: 'calls/day' },
    { label: 'IMF Climate', used: 340, limit: 1000, unit: 'calls/day' },
    { label: 'Supabase DB', used: 1560, limit: 10000, unit: 'queries/day' },
    { label: 'NSE/BSE Scrape', used: 420, limit: 800, unit: 'requests/day' },
  ];

  const growthData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    apiCalls: Math.round(15000 + i * 2200 + seeded(i * 19) * 3000),
    storage: +(1.2 + i * 0.35 + seeded(i * 23) * 0.2).toFixed(1),
    companies: Math.round(400 + i * 24),
  }));

  const filteredAlerts = alertFilter === 'All' ? ALERTS : ALERTS.filter(a => a.severity === alertFilter);

  const crossNavItems = [
    { label: 'API Orchestration', path: '/api-orchestration' },
    { label: 'Data Quality', path: '/esg-data-quality' },
    { label: 'Live Feeds', path: '/live-feeds' },
    { label: 'Data Lineage', path: '/data-lineage' },
    { label: 'BRSR Bridge', path: '/brsr-bridge' },
    { label: 'Portfolio Suite', path: '/portfolio-suite' },
    { label: 'Company Profiles', path: '/company-profiles' },
    { label: 'ESG Enrichment', path: '/esg-enrichment' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>
      {/* ── 1. Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>Data Infrastructure Intelligence</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Badge label="Hub" color="navy" /><Badge label="10 Sources" color="sage" />
            <Badge label="656 Companies" color="gold" /><Badge label="13 Exchanges" color="blue" /><Badge label="BRSR" color="purple" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => exportCSV(DATA_SOURCES, 'data_sources_export.csv')} small>CSV</Btn>
          <Btn onClick={() => exportJSON({ sources: DATA_SOURCES, modules: MODULES, alerts: ALERTS, deps: MODULE_DATA_DEPS }, 'infra_hub_config.json')} small>JSON</Btn>
          <Btn onClick={printPage} small>Print</Btn>
        </div>
      </div>

      {/* ── Cross-Nav ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {crossNavItems.map(n => <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>)}
      </div>

      {/* ── 2. Module Status Cards (5) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {MODULES.map(m => (
          <div key={m.id} onClick={() => navigate(m.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', borderTop: `3px solid ${m.color}`, transition: 'box-shadow 0.2s' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'} onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{m.icon}</div>
              <StatusDot status={m.status} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{m.desc}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3 }}>
                <div style={{ width: `${m.health}%`, height: 5, background: m.health >= 90 ? T.green : m.health >= 80 ? T.amber : T.red, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: m.health >= 90 ? T.green : T.amber }}>{m.health}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. KPI Cards (14, 2 rows) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Active Data Sources" value={activeSources} sub={`${DATA_SOURCES.length} total`} accent />
        <KpiCard label="API Calls Today" value={fmt(totalCalls)} sub="Across all sources" />
        <KpiCard label="Error Rate" value={pct(errorRate)} sub={`${totalErrors} errors`} />
        <KpiCard label="Avg Latency" value={`${avgLatency}ms`} sub="Active sources" />
        <KpiCard label="Companies Covered" value="656" sub="13 exchanges" />
        <KpiCard label="DQ Score (Portfolio)" value="78.4" sub="BCBS 239 aligned" />
        <KpiCard label="Completeness %" value="83.2%" sub="All fields tracked" accent />
        <KpiCard label="Fields Tracked" value={totalFields} sub="Across 10 sources" />
        <KpiCard label="Exchanges Connected" value="13" sub="Global coverage" />
        <KpiCard label="BRSR Companies" value="1,323" sub="Indian listed entities" />
        <KpiCard label="Cache Hit Rate" value="94.7%" sub="Redis in-memory" />
        <KpiCard label="Pipeline Success" value="97.8%" sub="Last 24h" />
        <KpiCard label="Manual Overrides" value="23" sub="Pending review" />
        <KpiCard label="Data Age (Avg)" value="4.2h" sub="Freshness target <6h" accent />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === i ? `3px solid ${T.navy}` : '3px solid transparent', background: 'none', fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.navy : T.textSec, cursor: 'pointer', fontSize: 13, fontFamily: T.font }}>{t}</button>
        ))}
      </div>

      {/* ══ TAB 0: Overview & Health ══ */}
      {activeTab === 0 && (
        <>
          {/* ── 4. System Health Dashboard ── */}
          <Section title="System Health Dashboard">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {[
                { label: 'API Layer', metric: '96%', status: 'Operational', detail: `${totalCalls} calls, ${avgLatency}ms avg`, statusColor: T.green },
                { label: 'Data Quality', metric: '78.4', status: 'Operational', detail: 'BCBS 239 score portfolio-wide', statusColor: T.green },
                { label: 'Feed Freshness', metric: '4.2h', status: 'Warning', detail: 'IMF Climate >48h, others <6h', statusColor: T.amber },
                { label: 'Lineage Coverage', metric: '82%', status: 'Warning', detail: '8 fields missing provenance', statusColor: T.amber },
                { label: 'BRSR Sync', metric: 'Active', status: 'Operational', detail: '1,323 cos, last sync 2h ago', statusColor: T.green },
              ].map(h => (
                <div key={h.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${h.statusColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{h.label}</span>
                    <StatusDot status={h.status} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.navy, marginTop: 8 }}>{h.metric}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{h.detail}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 5. Data Flow Architecture Diagram ── */}
          <Section title="Data Flow Architecture">
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 900, justifyContent: 'center' }}>
                {/* External Sources */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['Yahoo Finance', 'Open FIGI', 'IMF Climate', 'BRSR Supabase', 'NSE/BSE India', 'CBI Taxonomy'].map(s => (
                    <div key={s} style={{ padding: '6px 12px', background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{s}</div>
                  ))}
                </div>
                {/* Arrow */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 60, height: 2, background: T.navy }} />
                  <div style={{ fontSize: 10, color: T.textMut }}>API / DB</div>
                </div>
                {/* API Layer */}
                <div style={{ padding: '16px 20px', background: T.navy, color: '#fff', borderRadius: 10, textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>API Layer</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>Rate Limit</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>Auth / Retry</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 40, height: 2, background: T.sage }} />
                  <div style={{ fontSize: 10, color: T.textMut }}>Cache</div>
                </div>
                {/* Cache */}
                <div style={{ padding: '16px 20px', background: T.sage, color: '#fff', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Cache</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>Redis 94.7%</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 40, height: 2, background: T.gold }} />
                  <div style={{ fontSize: 10, color: T.textMut }}>Enrich</div>
                </div>
                {/* Enrichment */}
                <div style={{ padding: '16px 20px', background: T.gold, color: '#fff', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Enrichment</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>DQ + Lineage</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 40, height: 2, background: T.navyL }} />
                  <div style={{ fontSize: 10, color: T.textMut }}>Store</div>
                </div>
                {/* Company Master */}
                <div style={{ padding: '16px 20px', background: T.navyL, color: '#fff', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Company Master</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>656 entities</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 40, height: 2, background: T.border }} />
                  <div style={{ fontSize: 10, color: T.textMut }}>Serve</div>
                </div>
                {/* Modules */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['PCAF', 'Climate VaR', 'TCFD', 'SFDR PAI', 'Carbon Budget', 'ESG Screener'].map(m => (
                    <div key={m} style={{ padding: '6px 12px', background: '#f0fdf4', border: `1px solid ${T.sageL}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: T.sage, whiteSpace: 'nowrap' }}>{m}</div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* ── 6. Coverage Summary ── */}
          <Section title="Portfolio Data Coverage">
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={coverageData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                    <Cell fill={T.green} /><Cell fill={T.amber} /><Cell fill={T.red} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.green }}>478</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.green }}>Fully Covered</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>All critical ESG, financial, and risk fields populated</div>
                </div>
                <div style={{ background: '#fef3c7', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>142</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.amber }}>Partially Covered</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Missing 1-5 non-critical fields, enrichment possible</div>
                </div>
                <div style={{ background: '#fee2e2', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>36</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.red }}>Gap</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Missing critical data fields, manual override or new source needed</div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 7. Quick Actions ── */}
          <Section title="Quick Actions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {MODULES.map(m => (
                <button key={m.id} onClick={() => navigate(m.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 14px', cursor: 'pointer', textAlign: 'left', borderTop: `3px solid ${m.color}`, fontFamily: T.font }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Open module {'>'}</div>
                </button>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ══ TAB 1: Data Sources & Flow ══ */}
      {activeTab === 1 && (
        <>
          {/* ── Data Source Table ── */}
          <Section title="Data Source Registry">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <SortHeader label="Source" sortKey="name" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Type" sortKey="type" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Status" sortKey="status" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Fields" sortKey="fields" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Companies" sortKey="companies" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Latency (ms)" sortKey="latency" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Calls Today" sortKey="calls_today" sortState={sort} onSort={handleSort} />
                    <SortHeader label="Errors" sortKey="errors" sortState={sort} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {[...DATA_SOURCES].sort(sortFn).map((d, i) => (
                    <tr key={d.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, opacity: d.status === 'Planned' ? 0.6 : 1 }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{d.name}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={d.type} color={d.type.includes('Free') ? 'sage' : d.type === 'Internal' ? 'navy' : d.type === 'PostgreSQL' ? 'blue' : 'amber'} /></td>
                      <td style={{ padding: '10px 12px' }}><StatusDot status={d.status === 'Active' ? 'Operational' : d.status} /><span style={{ fontSize: 12 }}>{d.status}</span></td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{d.fields}</td>
                      <td style={{ padding: '10px 12px' }}>{fmt(d.companies)}</td>
                      <td style={{ padding: '10px 12px', color: d.latency > 400 ? T.amber : d.latency > 0 ? T.green : T.textMut }}>{d.latency || '--'}</td>
                      <td style={{ padding: '10px 12px' }}>{fmt(d.calls_today)}</td>
                      <td style={{ padding: '10px 12px', color: d.errors > 0 ? T.red : T.green, fontWeight: d.errors > 0 ? 700 : 400 }}>{d.errors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── 8. Data Source Cost-Benefit ── */}
          <Section title="Data Source Cost-Benefit Analysis">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Fields per Source</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={costBenefitData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Bar dataKey="fields" fill={T.navy} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Free vs Paid Sources</div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: T.green }}>8</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>Free / Internal Sources</div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{DATA_SOURCES.filter(d => d.status === 'Active').reduce((s, d) => s + d.fields, 0)} fields | {DATA_SOURCES.filter(d => d.status === 'Active').reduce((s, d) => Math.max(s, d.companies), 0)} max cos</div>
                    </div>
                    <div style={{ background: '#fef3c7', padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: T.amber }}>2</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>Planned Paid Sources</div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>+380 fields | +5,000 cos coverage</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, padding: 10, background: T.surfaceH, borderRadius: 6 }}>
                    Current free-tier coverage handles 656 companies across 13 exchanges with {totalFields} fields. Adding Bloomberg + Refinitiv would increase coverage to ~5,000 companies.
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 12. Platform Data Summary Table ── */}
          <Section title="Platform Module Data Dependencies">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['Module', 'Data Sources Used', 'Fields Consumed', 'DQ Dependency'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {MODULE_DATA_DEPS.map((m, i) => (
                    <tr key={m.module} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{m.module}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{m.sources}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.fields}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={m.dq_dep} color={m.dq_dep === 'Critical' ? 'red' : m.dq_dep === 'High' ? 'amber' : m.dq_dep === 'Medium' ? 'gold' : 'sage'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {/* ══ TAB 2: Monitoring & Alerts ══ */}
      {activeTab === 2 && (
        <>
          {/* ── 9. Recent Activity Feed ── */}
          <Section title="Recent Activity Feed (Last 20 Operations)">
            <Slider label="Auto-Refresh Interval (seconds)" min={5} max={120} value={refreshInterval} onChange={setRefreshInterval} fmtFn={v => `${v}s`} />
            <div style={{ maxHeight: 400, overflowY: 'auto', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['#', 'Time', 'Action', 'Source', 'Detail', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, position: 'sticky', top: 0 }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {ACTIVITY_FEED.map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', color: T.textMut, fontSize: 11 }}>{a.id}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{a.time}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{a.action}</td>
                      <td style={{ padding: '8px 12px' }}>{a.source}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 12 }}>{a.detail}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={a.status} color={a.status === 'Success' ? 'green' : 'amber'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── 10. Alerting Panel ── */}
          <Section title="Active Alerts">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['All', 'High', 'Medium', 'Low'].map(f => (
                <Btn key={f} onClick={() => setAlertFilter(f)} variant={alertFilter === f ? 'primary' : undefined} small>{f} ({f === 'All' ? ALERTS.length : ALERTS.filter(a => a.severity === f).length})</Btn>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredAlerts.map(a => (
                <div key={a.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', borderLeft: `4px solid ${a.severity === 'High' ? T.red : a.severity === 'Medium' ? T.amber : T.navyL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Badge label={a.severity} color={a.severity === 'High' ? 'red' : a.severity === 'Medium' ? 'amber' : 'blue'} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{a.type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{a.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>{a.time}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{a.module}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Latency Trend ── */}
          <Section title="Latency Trend (24h)">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={latencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: T.textSec }} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="api" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="API (ms)" strokeWidth={2} />
                <Area type="monotone" dataKey="db" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="DB (ms)" strokeWidth={2} />
                <Area type="monotone" dataKey="cache" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Cache (ms)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ══ TAB 3: Capacity & Upgrades ══ */}
      {activeTab === 3 && (
        <>
          {/* ── 11. Capacity Planning ── */}
          <Section title="API Rate Limit & Capacity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {capacityData.map(c => {
                const pctUsed = (c.used / c.limit * 100);
                return (
                  <div key={c.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{c.label}</span>
                      <span style={{ fontSize: 12, color: pctUsed > 80 ? T.red : pctUsed > 60 ? T.amber : T.textSec, fontWeight: 600 }}>{fmt(c.used)} / {fmt(c.limit)} {c.unit} ({pctUsed.toFixed(1)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: T.border, borderRadius: 5 }}>
                      <div style={{ width: `${Math.min(pctUsed, 100)}%`, height: 10, background: pctUsed > 80 ? T.red : pctUsed > 60 ? T.amber : T.green, borderRadius: 5, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Growth Trajectory ── */}
          <Section title="Growth Trajectory (12-Month)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="apiCalls" stroke={T.navy} name="API Calls" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="storage" stroke={T.sage} name="Storage (GB)" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="companies" stroke={T.gold} name="Companies" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          {/* ── 13. Upgrade Path Recommendations ── */}
          <Section title="Upgrade Path Recommendations">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['Data Source', 'Benefit', 'Est. Cost', 'Priority', 'Coverage Delta'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {UPGRADE_RECS.map((u, i) => (
                    <tr key={u.source} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{u.source}</td>
                      <td style={{ padding: '10px 12px', color: T.textSec, fontSize: 12 }}>{u.benefit}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{u.cost}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={u.priority} color={u.priority === 'High' ? 'red' : u.priority === 'Medium' ? 'amber' : 'sage'} /></td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.green }}>{u.coverage_delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── ROI Summary ── */}
          <Section title="Investment ROI Summary">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Tier 1: Bloomberg + Refinitiv</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.gold }}>$42K/yr</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>+5,000 companies, +380 fields</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Real-time pricing & institutional ESG</div>
                <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 6, fontSize: 11, color: T.sage, fontWeight: 600 }}>Recommended for institutional clients</div>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Tier 2: + CDP + Sustainalytics</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.gold }}>$62K/yr</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>Verified emissions, controversy monitoring</div>
                <div style={{ fontSize: 12, color: T.textSec }}>+3,200 cos w/ verified Scope 1-3</div>
                <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 6, fontSize: 11, color: T.navyL, fontWeight: 600 }}>Best for regulatory compliance</div>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Full Suite (All Planned)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.gold }}>$77K/yr</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>Maximum coverage and capability</div>
                <div style={{ fontSize: 12, color: T.textSec }}>~5,000 companies, 900+ fields</div>
                <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 6, fontSize: 11, color: T.amber, fontWeight: 600 }}>Enterprise-grade platform</div>
              </div>
            </div>
          </Section>

          {/* ── Storage Projection ── */}
          <Section title="Storage & Pipeline Metrics">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Current Storage', value: '4.8 GB', detail: 'PostgreSQL + Redis', color: T.navy },
                { label: 'Projected (12mo)', value: '8.2 GB', detail: '+70% growth expected', color: T.sage },
                { label: 'Pipeline Runs/Day', value: '48', detail: 'Automated + manual', color: T.gold },
                { label: 'Avg Pipeline Duration', value: '4.2 min', detail: 'Full sync cycle', color: T.navyL },
              ].map(m => (
                <div key={m.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, borderTop: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, marginTop: 6 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{m.detail}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
        <span>EP-P6 Data Infrastructure Intelligence Hub | Sprint P</span>
        <span>10 Sources | 656 Companies | 13 Exchanges | BRSR 1,323 | Pipeline v6.0</span>
      </div>
    </div>
  );
};

export default DataInfraHubPage;
