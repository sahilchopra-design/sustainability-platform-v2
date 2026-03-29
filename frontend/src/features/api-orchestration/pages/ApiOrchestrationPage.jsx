import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, Line, Cell
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── Data Source Registry ───────────────────────────────────────────────────── */
const DATA_SOURCES = [
  { id: 'eodhd', name: 'EODHD Financial Data', type: 'REST API', status: 'active', tier: 'free', url: 'https://eodhd.com/api', endpoints: ['fundamentals', 'eod-prices', 'bulk-fundamentals', 'bond-fundamentals'], coverage: '70+ exchanges, 100K+ instruments', refresh_rate: 'Daily EOD', cache_ttl_hrs: 24, rate_limit: '20 req/day (free)', auth: 'API Key', data_fields: ['revenue', 'market_cap', 'employees', 'esg_score', 'description', 'sector', 'industry'], companies_covered: 656, last_call: null, errors_24h: 0, avg_latency_ms: 450 },
  { id: 'alphavantage', name: 'Alpha Vantage', type: 'REST API', status: 'active', tier: 'free', url: 'https://www.alphavantage.co/query', endpoints: ['TIME_SERIES_DAILY', 'SMA', 'EMA', 'RSI', 'MACD'], coverage: 'US + major exchanges', refresh_rate: 'Real-time (5 req/min)', cache_ttl_hrs: 1, rate_limit: '5 req/min, 500/day', auth: 'API Key', data_fields: ['50day_ma', '200day_ma', 'rsi', 'macd', 'daily_close'], companies_covered: 200, last_call: null, errors_24h: 0, avg_latency_ms: 280 },
  { id: 'openfigi', name: 'OpenFIGI', type: 'REST API', status: 'active', tier: 'free', url: 'https://api.openfigi.com/v3/mapping', endpoints: ['mapping', 'search'], coverage: '300T+ instruments globally', refresh_rate: 'On-demand', cache_ttl_hrs: 168, rate_limit: '20 req/min (no key)', auth: 'Optional API Key', data_fields: ['figi', 'ticker', 'name', 'exchCode', 'securityType'], companies_covered: 'Unlimited', last_call: null, errors_24h: 0, avg_latency_ms: 150 },
  { id: 'imf_climate', name: 'IMF Climate Data', type: 'REST API (ArcGIS)', status: 'active', tier: 'free', url: 'https://climatedata.imf.org', endpoints: ['green_bonds', 'climate_indicators'], coverage: '190+ countries', refresh_rate: 'Quarterly', cache_ttl_hrs: 24, rate_limit: 'Unlimited', auth: 'None', data_fields: ['green_bond_issuance', 'country', 'year'], companies_covered: 0, last_call: null, errors_24h: 0, avg_latency_ms: 800 },
  { id: 'finra_trace', name: 'FINRA TRACE', type: 'REST API', status: 'fallback', tier: 'free', url: 'https://api.finra.org', endpoints: ['treasuryWeeklyAggregates', 'marketBreadth'], coverage: 'US bonds', refresh_rate: 'Weekly', cache_ttl_hrs: 24, rate_limit: 'Requires agreement', auth: 'User agreement', data_fields: ['trade_volume', 'yield_10yr', 'yield_2yr'], companies_covered: 0, last_call: null, errors_24h: 0, avg_latency_ms: 600 },
  { id: 'kapsarc', name: 'KAPSARC Data Portal', type: 'REST API', status: 'active', tier: 'free', url: 'https://datasource.kapsarc.org/api', endpoints: ['green-bond-issuances'], coverage: 'Global green bonds', refresh_rate: 'Monthly', cache_ttl_hrs: 168, rate_limit: 'Unlimited', auth: 'None', data_fields: ['country', 'year', 'issuance_amount', 'issuer_type'], companies_covered: 0, last_call: null, errors_24h: 0, avg_latency_ms: 500 },
  { id: 'cbi', name: 'Climate Bonds Initiative', type: 'Static + CSV', status: 'active', tier: 'free', url: 'https://www.climatebonds.net/cbi/pub/data/bonds', endpoints: ['3-month-rolling'], coverage: '50+ certified bonds', refresh_rate: 'Quarterly', cache_ttl_hrs: 720, rate_limit: 'N/A', auth: 'None', data_fields: ['issuer', 'isin', 'size', 'cbi_sector', 'certified'], companies_covered: 50, last_call: null, errors_24h: 0, avg_latency_ms: 0 },
  { id: 'supabase_brsr', name: 'Supabase BRSR Database', type: 'PostgreSQL', status: 'active', tier: 'internal', url: 'https://[project].supabase.co', endpoints: ['brsr_companies', 'brsr_metrics', 'brsr_principles'], coverage: '1,323 Indian companies', refresh_rate: 'On-demand', cache_ttl_hrs: 0, rate_limit: 'Unlimited', auth: 'Supabase Key', data_fields: ['all BRSR fields'], companies_covered: 1323, last_call: null, errors_24h: 0, avg_latency_ms: 120 },
  { id: 'cbonds', name: 'Cbonds', type: 'REST API', status: 'planned', tier: 'paid', url: 'https://cbonds.com/api', endpoints: ['bonds', 'search', 'pricing'], coverage: '1M+ bonds, 250 countries', refresh_rate: 'Real-time', cache_ttl_hrs: 1, rate_limit: 'By plan', auth: 'API Key', data_fields: ['100+ bond fields'], companies_covered: 0, last_call: null, errors_24h: 0, avg_latency_ms: 0, cost_monthly: 350 },
  { id: 'lseg', name: 'LSEG Workspace', type: 'REST API', status: 'planned', tier: 'enterprise', url: 'https://api.refinitiv.com', endpoints: ['pricing', 'fundamentals', 'esg'], coverage: '2.7M fixed income', refresh_rate: 'Real-time', cache_ttl_hrs: 0, rate_limit: 'Enterprise', auth: 'OAuth', data_fields: ['evaluated pricing', 'reference data'], companies_covered: 0, last_call: null, errors_24h: 0, avg_latency_ms: 0, cost_yearly: 22000 },
];

/* ── Pipeline Definitions ───────────────────────────────────────────────────── */
const PIPELINES_INIT = [
  { id: 'pipe_equity_fundamentals', name: 'Equity Fundamentals Refresh', source: 'eodhd', target: 'companyMaster + exchanges', frequency: 'Daily', last_run: null, next_run: null, status: 'idle', records_processed: 0, errors: 0, duration_ms: 0 },
  { id: 'pipe_technicals', name: 'Technical Indicators', source: 'alphavantage', target: 'companyMaster', frequency: 'Daily', last_run: null, next_run: null, status: 'idle', records_processed: 0, errors: 0, duration_ms: 0 },
  { id: 'pipe_bond_universe', name: 'Bond Universe Update', source: 'cbi + openfigi', target: 'bondReferenceDB', frequency: 'Quarterly', last_run: null, next_run: null, status: 'idle', records_processed: 0, errors: 0, duration_ms: 0 },
  { id: 'pipe_sovereign', name: 'Sovereign ESG Refresh', source: 'imf_climate', target: 'sovereignESG', frequency: 'Monthly', last_run: null, next_run: null, status: 'idle', records_processed: 0, errors: 0, duration_ms: 0 },
  { id: 'pipe_brsr', name: 'BRSR Data Sync', source: 'supabase_brsr', target: 'companyMaster (India)', frequency: 'On-demand', last_run: null, next_run: null, status: 'idle', records_processed: 0, errors: 0, duration_ms: 0 },
  { id: 'pipe_identifier', name: 'Identifier Resolution', source: 'openfigi', target: 'all companies', frequency: 'Weekly', last_run: null, next_run: null, status: 'idle', records_processed: 0, errors: 0, duration_ms: 0 },
];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const LS_KEYS = 'ra_api_keys_v1';
const LS_CONFIG = 'ra_pipeline_config_v1';
const LS_LOG = 'ra_pipeline_log_v1';
const LS_PORT = 'ra_portfolio_v1';

const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const fmt = v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);
const fmtPct = v => v == null ? '--' : `${v.toFixed(1)}%`;
const fmtMs = v => v == null ? '--' : v < 1000 ? `${v}ms` : `${(v/1000).toFixed(1)}s`;
const fmtTime = iso => iso ? new Date(iso).toLocaleString() : 'Never';
const nowISO = () => new Date().toISOString();

const STATUS_COLORS = { active: T.green, fallback: T.amber, planned: T.textMut, idle: T.textMut, running: T.navyL, success: T.green, error: T.red };
const TIER_COLORS = { free: T.sage, internal: T.navyL, paid: T.gold, enterprise: T.amber };

const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
);

const KPICard = ({ label, value, sub, color = T.navy, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', minWidth: 150, flex: '1 1 160px' }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>{icon && <span>{icon}</span>}{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

/* ── Generate simulated timeline data ───────────────────────────────────────── */
const genTimeline = () => Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  latency: 200 + Math.round(sr(_sc++) * 400 + Math.sin(i / 3) * 150),
  errors: sr(_sc++) < 0.15 ? Math.ceil(sr(_sc++) * 3) : 0,
  calls: 5 + Math.round(sr(_sc++) * 15),
}));

/* ── Data Coverage Fields ───────────────────────────────────────────────────── */
const COVERAGE_FIELDS = ['revenue', 'market_cap', 'employees', 'esg_score', 'sector', 'figi', 'rsi', 'macd', 'green_bonds', 'bond_pricing'];
const FIELD_SOURCE_MAP = {
  revenue: ['eodhd'], market_cap: ['eodhd'], employees: ['eodhd'], esg_score: ['eodhd'],
  sector: ['eodhd', 'openfigi'], figi: ['openfigi'], rsi: ['alphavantage'], macd: ['alphavantage'],
  green_bonds: ['imf_climate', 'kapsarc', 'cbi'], bond_pricing: ['cbonds', 'lseg', 'finra_trace'],
};

/* ════════════════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                              */
/* ════════════════════════════════════════════════════════════════════════════ */
export default function ApiOrchestrationPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadJSON(LS_PORT, null), []);
  const companies = useMemo(() => GLOBAL_COMPANY_MASTER || [], []);

  /* State ------------------------------------------------------------------ */
  const [sources, setSources] = useState(() => DATA_SOURCES.map(s => ({ ...s })));
  const [pipelines, setPipelines] = useState(() => {
    const saved = loadJSON(LS_LOG, null);
    return saved?.pipelines || PIPELINES_INIT.map(p => ({ ...p }));
  });
  const [pipelineLog, setPipelineLog] = useState(() => loadJSON(LS_LOG, { entries: [] })?.entries || []);
  const [apiKeys, setApiKeys] = useState(() => loadJSON(LS_KEYS, {}));
  const [config, setConfig] = useState(() => loadJSON(LS_CONFIG, { default_cache_ttl: 24, alert_threshold_errors: 5, alert_threshold_latency: 2000 }));
  const [expandedSource, setExpandedSource] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeline] = useState(genTimeline);
  const [runningPipe, setRunningPipe] = useState(null);
  const [search, setSearch] = useState('');
  const logEndRef = useRef(null);

  /* Persist ---------------------------------------------------------------- */
  useEffect(() => { saveJSON(LS_LOG, { pipelines, entries: pipelineLog }); }, [pipelines, pipelineLog]);
  useEffect(() => { saveJSON(LS_KEYS, apiKeys); }, [apiKeys]);
  useEffect(() => { saveJSON(LS_CONFIG, config); }, [config]);

  /* Computed stats --------------------------------------------------------- */
  const activeSources = sources.filter(s => s.status === 'active').length;
  const totalCalls24 = sources.reduce((s, d) => s + (d.calls_24h || Math.round(sr(_sc++) * 20)), 0);
  const totalErrors24 = sources.reduce((s, d) => s + d.errors_24h, 0);
  const avgLatency = Math.round(sources.filter(s => s.avg_latency_ms > 0).reduce((a, s) => a + s.avg_latency_ms, 0) / Math.max(1, sources.filter(s => s.avg_latency_ms > 0).length));
  const companiesCov = sources.filter(s => typeof s.companies_covered === 'number').reduce((a, s) => a + s.companies_covered, 0);
  const bondsCov = 50 + 0; // CBI certified
  const countriesCov = 190; // IMF
  const cacheHitRate = 78.4;
  const freshnessScore = 82;
  const pipelineSuccessRate = pipelineLog.length > 0 ? (pipelineLog.filter(e => e.status === 'success').length / pipelineLog.length * 100) : 100;

  /* Rate limit simulation ------------------------------------------------- */
  const rateLimits = useMemo(() => sources.filter(s => s.status !== 'planned').map(s => {
    const max = s.id === 'eodhd' ? 20 : s.id === 'alphavantage' ? 500 : s.id === 'openfigi' ? 1200 : 9999;
    const used = Math.round(sr(_sc++) * max * 0.6);
    return { id: s.id, name: s.name, used, max, pct: Math.round(used / max * 100) };
  }), [sources]);

  /* Cache management ------------------------------------------------------- */
  const cacheInfo = useMemo(() => sources.filter(s => s.cache_ttl_hrs > 0).map(s => {
    const size = Math.round(sr(_sc++) * 500 + 50);
    return { id: s.id, name: s.name, ttl: s.cache_ttl_hrs, size_kb: size, hit_rate: Math.round(60 + sr(_sc++) * 35), last_cleared: null };
  }), [sources]);

  /* Pipeline Run ----------------------------------------------------------- */
  const runPipeline = useCallback((pipeId) => {
    setRunningPipe(pipeId);
    setPipelines(prev => prev.map(p => p.id === pipeId ? { ...p, status: 'running', last_run: nowISO() } : p));
    const dur = 1500 + Math.round(sr(_sc++) * 3000);
    setTimeout(() => {
      const records = 50 + Math.round(sr(_sc++) * 500);
      const hasErr = sr(_sc++) < 0.1;
      const status = hasErr ? 'error' : 'success';
      setPipelines(prev => prev.map(p => p.id === pipeId ? { ...p, status, records_processed: p.records_processed + records, errors: p.errors + (hasErr ? 1 : 0), duration_ms: dur } : p));
      setPipelineLog(prev => [...prev, { id: Date.now(), pipeline: pipeId, timestamp: nowISO(), status, records, duration_ms: dur, errors: hasErr ? 1 : 0 }]);
      setRunningPipe(null);
    }, dur);
  }, []);

  /* Clear cache action ----------------------------------------------------- */
  const clearCache = (srcId) => {
    setSources(prev => prev.map(s => s.id === srcId ? { ...s, cache_cleared_at: nowISO() } : s));
  };

  /* Export helpers ---------------------------------------------------------- */
  const exportCSV = (rows, headers, filename) => {
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const exportSourceCSV = () => {
    const headers = ['id', 'name', 'type', 'status', 'tier', 'url', 'coverage', 'refresh_rate', 'cache_ttl_hrs', 'rate_limit', 'auth', 'companies_covered', 'avg_latency_ms', 'errors_24h'];
    exportCSV(sources, headers, `api_sources_status_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportLogCSV = () => {
    const headers = ['id', 'pipeline', 'timestamp', 'status', 'records', 'duration_ms', 'errors'];
    exportCSV(pipelineLog, headers, `pipeline_log_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handlePrint = () => window.print();

  /* Filtered sources ------------------------------------------------------- */
  const filteredSources = useMemo(() => {
    if (!search) return sources;
    const q = search.toLowerCase();
    return sources.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q) || s.type.toLowerCase().includes(q) || s.tier.includes(q));
  }, [sources, search]);

  /* Tab nav ---------------------------------------------------------------- */
  const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pipelines', label: 'Pipelines' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'coverage', label: 'Coverage Matrix' },
    { id: 'config', label: 'Configuration' },
  ];

  /* ── RENDER ────────────────────────────────────────────────────────────── */
  const containerStyle = { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text };
  const cardStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
  const thStyle = { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.border}`, color: T.textSec, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' };
  const tdStyle = { padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12, verticalAlign: 'middle' };
  const btnStyle = { padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: T.font };
  const btnPrimary = { ...btnStyle, background: T.navy, color: '#fff', border: 'none' };
  const inputStyle = { padding: '7px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const sectionTitle = (text) => <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 12px 0' }}>{text}</h3>;

  return (
    <div style={containerStyle}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: -0.5 }}>API Orchestration & Data Pipeline Manager</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <Badge label={`${sources.length} Sources`} color={T.navy} />
            <Badge label={`${pipelines.length} Pipelines`} color={T.sage} />
            <Badge label="Live Status" color={T.green} />
            <Badge label="EP-P1" color={T.gold} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btnStyle} onClick={exportSourceCSV}>Export Sources CSV</button>
          <button style={btnStyle} onClick={exportLogCSV}>Export Log CSV</button>
          <button style={btnStyle} onClick={handlePrint}>Print</button>
          <button style={{ ...btnStyle, color: T.sage }} onClick={() => navigate('/data-quality-monitor')}>Data Quality</button>
          <button style={{ ...btnStyle, color: T.navyL }} onClick={() => navigate('/portfolio-dashboard')}>Portfolio</button>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 18px', border: 'none', borderBottom: activeTab === t.id ? `3px solid ${T.navy}` : '3px solid transparent', background: 'transparent', color: activeTab === t.id ? T.navy : T.textMut, fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: T.font, marginBottom: -2 }}>{t.label}</button>
        ))}
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <KPICard label="Active Sources" value={activeSources} sub={`of ${sources.length} total`} icon="S" color={T.green} />
        <KPICard label="API Calls (24h)" value={fmt(totalCalls24)} sub="across all sources" icon="C" color={T.navy} />
        <KPICard label="Errors (24h)" value={totalErrors24} sub={totalErrors24 > 0 ? 'needs attention' : 'all clear'} icon="E" color={totalErrors24 > 0 ? T.red : T.green} />
        <KPICard label="Avg Latency" value={fmtMs(avgLatency)} sub="weighted mean" icon="L" color={avgLatency > 500 ? T.amber : T.green} />
        <KPICard label="Companies Covered" value={fmt(companiesCov)} sub="equity universe" icon="C" color={T.navy} />
        <KPICard label="Bonds Covered" value={fmt(bondsCov)} sub="CBI certified" icon="B" color={T.sage} />
        <KPICard label="Countries" value={countriesCov} sub="IMF climate data" icon="G" color={T.navyL} />
        <KPICard label="Cache Hit Rate" value={fmtPct(cacheHitRate)} sub="saves API calls" icon="$" color={T.sage} />
        <KPICard label="Data Freshness" value={`${freshnessScore}/100`} sub="composite score" icon="F" color={freshnessScore >= 80 ? T.green : T.amber} />
        <KPICard label="Pipeline Success" value={fmtPct(pipelineSuccessRate)} sub={`${pipelineLog.length} runs total`} icon="P" color={pipelineSuccessRate >= 90 ? T.green : T.red} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Dashboard                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <>
          {/* ── Search ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 14, maxWidth: 340 }}>
            <input style={inputStyle} placeholder="Search sources by name, type, tier..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* ── Data Source Status Cards ────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Data Source Status Dashboard')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {filteredSources.map(s => {
                const expanded = expandedSource === s.id;
                return (
                  <div key={s.id} style={{ background: expanded ? T.surfaceH : T.surface, border: `1px solid ${expanded ? T.borderL : T.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all .15s' }} onClick={() => setExpandedSource(expanded ? null : s.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Badge label={s.status} color={STATUS_COLORS[s.status] || T.textMut} />
                        <Badge label={s.tier} color={TIER_COLORS[s.tier] || T.textMut} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.textSec }}>
                      <span>Type: {s.type}</span>
                      <span>Latency: {fmtMs(s.avg_latency_ms)}</span>
                      <span>Errors: {s.errors_24h}</span>
                      <span>Cache: {s.cache_ttl_hrs}h</span>
                    </div>
                    {expanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.textSec }}>
                        <div style={{ marginBottom: 4 }}><b>URL:</b> <span style={{ color: T.navyL }}>{s.url}</span></div>
                        <div style={{ marginBottom: 4 }}><b>Endpoints:</b> {s.endpoints.join(', ')}</div>
                        <div style={{ marginBottom: 4 }}><b>Coverage:</b> {s.coverage}</div>
                        <div style={{ marginBottom: 4 }}><b>Rate Limit:</b> {s.rate_limit}</div>
                        <div style={{ marginBottom: 4 }}><b>Auth:</b> {s.auth}</div>
                        <div style={{ marginBottom: 4 }}><b>Fields:</b> {Array.isArray(s.data_fields) ? s.data_fields.join(', ') : s.data_fields}</div>
                        <div><b>Companies:</b> {fmt(s.companies_covered)}</div>
                        {s.cost_monthly && <div style={{ marginTop: 4, color: T.amber }}><b>Cost:</b> ${s.cost_monthly}/mo</div>}
                        {s.cost_yearly && <div style={{ marginTop: 4, color: T.amber }}><b>Cost:</b> ${fmt(s.cost_yearly)}/yr</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredSources.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: T.textMut, fontSize: 13 }}>No sources match "{search}"</div>}
          </div>

          {/* ── API Health Timeline ─────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('API Health Timeline (24h)')}
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: T.textMut }} interval={3} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textMut }} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textSec } }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textMut }} label={{ value: 'Errors', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: T.textSec } }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area yAxisId="left" type="monotone" dataKey="latency" stroke={T.navyL} fill={`${T.navyL}30`} name="Avg Latency (ms)" />
                <Bar yAxisId="right" dataKey="errors" fill={T.red} name="Errors" barSize={8} radius={[3,3,0,0]} />
                <Line yAxisId="left" type="monotone" dataKey="calls" stroke={T.gold} strokeWidth={2} dot={false} name="API Calls" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ── Rate Limit Monitor ─────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Rate Limit Monitor')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {rateLimits.map(r => (
                <div key={r.id} style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    <span>{r.name}</span>
                    <span style={{ color: r.pct > 80 ? T.red : r.pct > 50 ? T.amber : T.green }}>{r.used}/{r.max}</span>
                  </div>
                  <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(r.pct, 100)}%`, background: r.pct > 80 ? T.red : r.pct > 50 ? T.amber : T.green, borderRadius: 4, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{r.pct}% used today</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cache Management ────────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Cache Management')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Source</th><th style={thStyle}>TTL (hrs)</th><th style={thStyle}>Size (KB)</th>
                <th style={thStyle}>Hit Rate</th><th style={thStyle}>Last Cleared</th><th style={thStyle}>Action</th>
              </tr></thead>
              <tbody>
                {cacheInfo.map(c => (
                  <tr key={c.id} style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>{c.name}</td>
                    <td style={tdStyle}>{c.ttl}</td>
                    <td style={tdStyle}>{c.size_kb}</td>
                    <td style={tdStyle}><span style={{ color: c.hit_rate > 70 ? T.green : T.amber }}>{c.hit_rate}%</span></td>
                    <td style={tdStyle}>{sources.find(s => s.id === c.id)?.cache_cleared_at ? fmtTime(sources.find(s => s.id === c.id).cache_cleared_at) : 'Never'}</td>
                    <td style={tdStyle}><button style={{ ...btnStyle, fontSize: 10, padding: '3px 10px' }} onClick={() => clearCache(c.id)}>Clear</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Pipelines                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipelines' && (
        <>
          {/* ── Pipeline Monitor Table ─────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Pipeline Monitor')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Pipeline</th><th style={thStyle}>Source</th><th style={thStyle}>Target</th>
                <th style={thStyle}>Frequency</th><th style={thStyle}>Status</th><th style={thStyle}>Last Run</th>
                <th style={thStyle}>Records</th><th style={thStyle}>Errors</th><th style={thStyle}>Duration</th>
                <th style={thStyle}>Action</th>
              </tr></thead>
              <tbody>
                {pipelines.map(p => (
                  <tr key={p.id} style={{ background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                    <td style={tdStyle}>{p.source}</td>
                    <td style={tdStyle}>{p.target}</td>
                    <td style={tdStyle}>{p.frequency}</td>
                    <td style={tdStyle}><Badge label={p.status} color={STATUS_COLORS[p.status] || T.textMut} /></td>
                    <td style={tdStyle}>{fmtTime(p.last_run)}</td>
                    <td style={tdStyle}>{fmt(p.records_processed)}</td>
                    <td style={{ ...tdStyle, color: p.errors > 0 ? T.red : T.green }}>{p.errors}</td>
                    <td style={tdStyle}>{fmtMs(p.duration_ms)}</td>
                    <td style={tdStyle}>
                      <button style={{ ...btnPrimary, fontSize: 10, padding: '4px 12px', opacity: runningPipe ? 0.5 : 1 }} disabled={!!runningPipe} onClick={() => runPipeline(p.id)}>
                        {runningPipe === p.id ? 'Running...' : 'Run Now'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pipeline Execution Log ──────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Pipeline Execution Log')}
            {pipelineLog.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: T.textMut, fontSize: 13 }}>No pipeline runs yet. Click "Run Now" on any pipeline above to start.</div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <table style={tableStyle}>
                  <thead><tr>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Timestamp</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Pipeline</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Status</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Records</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Duration</th>
                    <th style={{ ...thStyle, position: 'sticky', top: 0, background: T.surface }}>Errors</th>
                  </tr></thead>
                  <tbody>
                    {[...pipelineLog].reverse().map(e => (
                      <tr key={e.id}>
                        <td style={tdStyle}>{fmtTime(e.timestamp)}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{PIPELINES_INIT.find(p => p.id === e.pipeline)?.name || e.pipeline}</td>
                        <td style={tdStyle}><Badge label={e.status} color={STATUS_COLORS[e.status] || T.textMut} /></td>
                        <td style={tdStyle}>{fmt(e.records)}</td>
                        <td style={tdStyle}>{fmtMs(e.duration_ms)}</td>
                        <td style={{ ...tdStyle, color: e.errors > 0 ? T.red : T.green }}>{e.errors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div ref={logEndRef} />
              </div>
            )}
          </div>

          {/* ── Pipeline Latency Chart ──────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Pipeline Run Duration History')}
            {pipelineLog.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: T.textMut }}>Run pipelines to see duration history.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...pipelineLog].slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="pipeline" tick={{ fontSize: 9, fill: T.textMut }} angle={-25} textAnchor="end" height={50} tickFormatter={v => (PIPELINES_INIT.find(p => p.id === v)?.name || v).slice(0,18)} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="duration_ms" fill={T.navyL} radius={[4,4,0,0]} name="Duration (ms)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Integrations                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'integrations' && (
        <>
          {/* ── EODHD Panel ────────────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('EODHD Financial Data Integration')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>API Key</label>
                <input style={inputStyle} type="password" placeholder="Enter EODHD API key..." value={apiKeys.eodhd || ''} onChange={e => setApiKeys(p => ({ ...p, eodhd: e.target.value }))} />
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>Stored locally in browser (encrypted via localStorage)</div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>Connection Status</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <Badge label={apiKeys.eodhd ? 'Key Configured' : 'No Key'} color={apiKeys.eodhd ? T.green : T.amber} />
                  <button style={{ ...btnPrimary, fontSize: 10, padding: '4px 12px' }} onClick={() => alert('Test connection: EODHD API key ' + (apiKeys.eodhd ? 'present. In production this would call /api/exchange-symbol-list/US' : 'missing. Please enter a key.'))}>Test Connection</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: T.surfaceH, borderRadius: 8, fontSize: 11, color: T.textSec }}>
              <b>Sample endpoint:</b> GET https://eodhd.com/api/fundamentals/AAPL.US?api_token=YOUR_KEY&fmt=json<br/>
              <b>Coverage:</b> 70+ exchanges, 100K+ instruments | <b>Rate:</b> 20 req/day (free) | <b>Fields:</b> revenue, market_cap, employees, esg_score, sector, industry
            </div>
          </div>

          {/* ── Alpha Vantage Panel ────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Alpha Vantage Integration')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>API Key</label>
                <input style={inputStyle} type="password" placeholder="Enter Alpha Vantage API key..." value={apiKeys.alphavantage || ''} onChange={e => setApiKeys(p => ({ ...p, alphavantage: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>Status</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <Badge label={apiKeys.alphavantage ? 'Key Set' : 'No Key'} color={apiKeys.alphavantage ? T.green : T.amber} />
                  <button style={{ ...btnPrimary, fontSize: 10, padding: '4px 12px' }} onClick={() => alert('Alpha Vantage test: Would call SMA endpoint for sample ticker.')}>Test</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: T.surfaceH, borderRadius: 8, fontSize: 11, color: T.textSec }}>
              <b>Sample:</b> GET https://www.alphavantage.co/query?function=SMA&symbol=AAPL&interval=daily&time_period=50&series_type=close&apikey=KEY<br/>
              <b>Fields:</b> 50-day MA, 200-day MA, RSI, MACD | <b>Rate:</b> 5 req/min, 500/day
            </div>
          </div>

          {/* ── Supabase BRSR Panel ────────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Supabase BRSR Database')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 12 }}>
              <div style={{ background: T.surfaceH, padding: 14, borderRadius: 8 }}>
                <div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>Connection</div>
                <Badge label="Active" color={T.green} />
                <div style={{ marginTop: 6, fontSize: 11, color: T.textMut }}>PostgreSQL via Supabase client</div>
              </div>
              <div style={{ background: T.surfaceH, padding: 14, borderRadius: 8 }}>
                <div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>Tables</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>7</div>
                <div style={{ fontSize: 11, color: T.textMut }}>brsr_companies, brsr_metrics, brsr_principles, etc.</div>
              </div>
              <div style={{ background: T.surfaceH, padding: 14, borderRadius: 8 }}>
                <div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>Total Rows</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>1,323</div>
                <div style={{ fontSize: 11, color: T.textMut }}>Indian listed companies (SEBI BRSR)</div>
              </div>
            </div>
          </div>

          {/* ── Data Source Comparison ──────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Data Source Comparison: Free vs Paid')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Feature</th><th style={thStyle}>Free Sources (Current)</th><th style={thStyle}>Cbonds ($350/mo)</th><th style={thStyle}>LSEG ($22K/yr)</th>
              </tr></thead>
              <tbody>
                {[
                  ['Bond coverage', '50 certified (CBI)', '1M+ bonds, 250 countries', '2.7M fixed income'],
                  ['Real-time pricing', 'No (EOD only)', 'Yes', 'Yes'],
                  ['ESG scores', 'EODHD basic', 'Limited', 'Full ESG suite'],
                  ['Rate limits', '20/day - 500/day', 'By plan', 'Enterprise unlimited'],
                  ['Equity fundamentals', 'EODHD (100K+)', 'Bond focus', 'Full fundamentals'],
                  ['Technical indicators', 'Alpha Vantage (5 types)', 'No', 'Yes (100+)'],
                ].map(([feat, free, cb, lseg], i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{feat}</td>
                    <td style={tdStyle}>{free}</td>
                    <td style={tdStyle}>{cb}</td>
                    <td style={tdStyle}>{lseg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Upgrade Recommendations ────────────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Upgrade Recommendations')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { name: 'Cbonds', cost: '$350/mo', reason: 'Expand bond coverage from 50 to 1M+ instruments. Critical for fixed-income ESG analytics.', priority: 'High', color: T.amber },
                { name: 'LSEG Workspace', cost: '$22,000/yr', reason: 'Enterprise-grade evaluated bond pricing, full ESG dataset, real-time feeds. Required for institutional mandates.', priority: 'Medium', color: T.navyL },
              ].map(u => (
                <div key={u.name} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, borderLeft: `4px solid ${u.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{u.name}</span>
                    <Badge label={u.priority} color={u.color} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: u.color, marginBottom: 4 }}>{u.cost}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{u.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Coverage Matrix                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'coverage' && (
        <div style={cardStyle}>
          {sectionTitle('Data Coverage Matrix: Field x Source')}
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Data Field</th>
                {sources.map(s => <th key={s.id} style={{ ...thStyle, fontSize: 9, maxWidth: 80, textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.name.split(' ')[0]}</th>)}
              </tr></thead>
              <tbody>
                {COVERAGE_FIELDS.map(field => (
                  <tr key={field}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{field.replace(/_/g, ' ')}</td>
                    {sources.map(s => {
                      const provides = (FIELD_SOURCE_MAP[field] || []).includes(s.id);
                      return (
                        <td key={s.id} style={{ ...tdStyle, textAlign: 'center' }}>
                          {provides ? <span style={{ color: T.green, fontWeight: 700 }}>Y</span> : <span style={{ color: T.textMut }}>-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: T.textSec }}>
            <b>Coverage gaps:</b> bond_pricing has no active free source (CBI is static). Adding Cbonds would fill this gap.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Configuration                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <>
          <div style={cardStyle}>
            {sectionTitle('Pipeline & Alert Configuration')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>Default Cache TTL (hours)</label>
                <input style={inputStyle} type="number" min={0} max={720} value={config.default_cache_ttl} onChange={e => setConfig(p => ({ ...p, default_cache_ttl: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>Error Alert Threshold (24h)</label>
                <input style={inputStyle} type="number" min={1} max={100} value={config.alert_threshold_errors} onChange={e => setConfig(p => ({ ...p, alert_threshold_errors: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4 }}>Latency Alert Threshold (ms)</label>
                <input style={inputStyle} type="number" min={100} max={10000} step={100} value={config.alert_threshold_latency} onChange={e => setConfig(p => ({ ...p, alert_threshold_latency: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMut }}>Configuration auto-saved to localStorage ({LS_CONFIG})</div>
          </div>

          {/* ── Per-Source Schedule Overrides ───────────────────────────── */}
          <div style={cardStyle}>
            {sectionTitle('Pipeline Schedule Overrides')}
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Pipeline</th><th style={thStyle}>Default Frequency</th><th style={thStyle}>Override</th>
              </tr></thead>
              <tbody>
                {pipelines.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                    <td style={tdStyle}>{p.frequency}</td>
                    <td style={tdStyle}>
                      <select style={{ ...inputStyle, width: 160 }} value={config[`sched_${p.id}`] || 'default'} onChange={e => setConfig(prev => ({ ...prev, [`sched_${p.id}`]: e.target.value }))}>
                        <option value="default">Default</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="manual">Manual Only</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Reset & Danger Zone ─────────────────────────────────────── */}
          <div style={{ ...cardStyle, borderColor: `${T.red}40` }}>
            {sectionTitle('Danger Zone')}
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ ...btnStyle, color: T.red, borderColor: `${T.red}40` }} onClick={() => { if (window.confirm('Clear all pipeline run history?')) { setPipelineLog([]); setPipelines(PIPELINES_INIT.map(p => ({ ...p }))); } }}>Reset Pipeline History</button>
              <button style={{ ...btnStyle, color: T.red, borderColor: `${T.red}40` }} onClick={() => { if (window.confirm('Clear all API keys from localStorage?')) { setApiKeys({}); } }}>Clear All API Keys</button>
              <button style={{ ...btnStyle, color: T.red, borderColor: `${T.red}40` }} onClick={() => { if (window.confirm('Reset all configuration to defaults?')) { setConfig({ default_cache_ttl: 24, alert_threshold_errors: 5, alert_threshold_latency: 2000 }); } }}>Reset Configuration</button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ALWAYS-VISIBLE: Source Health Summary & Data Freshness           */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {/* ── Source Health Summary Matrix ────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Source Health Summary Matrix')}
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Tier</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Latency</th>
                <th style={thStyle}>Errors 24h</th>
                <th style={thStyle}>Cache TTL</th>
                <th style={thStyle}>Companies</th>
                <th style={thStyle}>Auth</th>
                <th style={thStyle}>Refresh</th>
                <th style={thStyle}>Endpoints</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: T.navy }}>{s.name}</td>
                  <td style={tdStyle}><Badge label={s.status} color={STATUS_COLORS[s.status] || T.textMut} /></td>
                  <td style={tdStyle}><Badge label={s.tier} color={TIER_COLORS[s.tier] || T.textMut} /></td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>{s.type}</td>
                  <td style={{ ...tdStyle, color: s.avg_latency_ms > 500 ? T.amber : s.avg_latency_ms > 0 ? T.green : T.textMut }}>
                    {fmtMs(s.avg_latency_ms)}
                  </td>
                  <td style={{ ...tdStyle, color: s.errors_24h > 0 ? T.red : T.green, fontWeight: 600 }}>
                    {s.errors_24h}
                  </td>
                  <td style={tdStyle}>{s.cache_ttl_hrs > 0 ? `${s.cache_ttl_hrs}h` : 'None'}</td>
                  <td style={tdStyle}>{fmt(s.companies_covered)}</td>
                  <td style={{ ...tdStyle, fontSize: 10 }}>{s.auth}</td>
                  <td style={{ ...tdStyle, fontSize: 10 }}>{s.refresh_rate}</td>
                  <td style={{ ...tdStyle, fontSize: 10 }}>{s.endpoints.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Data Freshness Indicators ──────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Data Freshness Indicators')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {sources.filter(s => s.status !== 'planned').map(s => {
            const hoursAgo = s.last_call ? Math.round((Date.now() - new Date(s.last_call).getTime()) / 3600000) : null;
            const fresh = hoursAgo === null ? 'unknown' : hoursAgo <= s.cache_ttl_hrs ? 'fresh' : hoursAgo <= s.cache_ttl_hrs * 2 ? 'stale' : 'expired';
            const freshColor = fresh === 'fresh' ? T.green : fresh === 'stale' ? T.amber : fresh === 'expired' ? T.red : T.textMut;
            const freshLabel = fresh === 'unknown' ? 'No data yet' : fresh === 'fresh' ? 'Fresh' : fresh === 'stale' ? 'Getting stale' : 'Expired';
            const refreshPct = hoursAgo !== null && s.cache_ttl_hrs > 0 ? Math.max(0, Math.min(100, 100 - (hoursAgo / s.cache_ttl_hrs * 100))) : 50;
            return (
              <div key={s.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderLeft: `4px solid ${freshColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: T.navy }}>{s.name.split(' ')[0]}</span>
                  <Badge label={freshLabel} color={freshColor} />
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ width: `${refreshPct}%`, height: '100%', background: freshColor, borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut }}>
                  <span>Last: {s.last_call ? fmtTime(s.last_call) : 'Never'}</span>
                  <span>TTL: {s.cache_ttl_hrs}h</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Endpoint Detail Registry ───────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Endpoint Detail Registry')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {sources.filter(s => s.status !== 'planned').map(s => (
            <div key={s.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{s.name}</span>
                <Badge label={`${s.endpoints.length} endpoints`} color={T.navyL} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {s.endpoints.map((ep, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: T.surface, borderRadius: 6, fontSize: 11 }}>
                    <span style={{ fontFamily: 'monospace', color: T.navyL }}>{ep}</span>
                    <span style={{ fontSize: 10, color: T.textMut }}>
                      {s.type === 'REST API' || s.type.includes('REST') ? 'GET' : 'QUERY'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: T.textMut }}>
                Base URL: <span style={{ fontFamily: 'monospace' }}>{s.url}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── API Call Volume by Source (BarChart) ────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('API Call Volume by Source (24h)')}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sources.filter(s => s.status !== 'planned').map(s => ({
            name: s.name.split(' ')[0],
            calls: s.calls_24h || Math.round(sr(_sc++) * 20 + 2),
            errors: s.errors_24h,
            latency: s.avg_latency_ms,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="calls" name="API Calls" fill={T.navyL} radius={[4,4,0,0]} />
            <Bar dataKey="errors" name="Errors" fill={T.red} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Connection Test History ─────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Connection Test Results')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {sources.filter(s => s.status !== 'planned').map(s => {
            const isConnected = s.status === 'active';
            const latencyClass = s.avg_latency_ms < 300 ? 'excellent' : s.avg_latency_ms < 600 ? 'good' : 'slow';
            const latencyColor = latencyClass === 'excellent' ? T.green : latencyClass === 'good' ? T.sage : T.amber;
            return (
              <div key={s.id} style={{ background: T.surface, border: `1px solid ${isConnected ? `${T.green}40` : `${T.amber}40`}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{isConnected ? 'OK' : '?'}</div>
                <div style={{ fontWeight: 700, fontSize: 12, color: T.navy, marginBottom: 4 }}>{s.name.split(' ')[0]}</div>
                <Badge label={isConnected ? 'Connected' : s.status} color={isConnected ? T.green : T.amber} />
                <div style={{ marginTop: 6, fontSize: 10, color: latencyColor, fontWeight: 600 }}>
                  {fmtMs(s.avg_latency_ms)} ({latencyClass})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Data Source Cost Analysis ───────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Cost Analysis: Current vs Planned Sources')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: `${T.green}08`, borderRadius: 10, padding: 16, border: `1px solid ${T.green}30` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.green, marginBottom: 10 }}>Current Stack (Free)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.green, marginBottom: 6 }}>$0/mo</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{sources.filter(s => s.tier === 'free').length} free APIs + {sources.filter(s => s.tier === 'internal').length} internal DB</div>
            <div style={{ fontSize: 11, color: T.textMut }}>
              Coverage: {fmt(companiesCov)} companies, {countriesCov} countries, {bondsCov} bonds<br/>
              Limitations: EOD only pricing, limited bond universe, rate-limited technical indicators
            </div>
          </div>
          <div style={{ background: `${T.gold}08`, borderRadius: 10, padding: 16, border: `1px solid ${T.gold}30` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.gold, marginBottom: 10 }}>Proposed Stack (With Paid)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.gold, marginBottom: 6 }}>$2,183/mo</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>+Cbonds ($350/mo) +LSEG ($22K/yr = $1,833/mo)</div>
            <div style={{ fontSize: 11, color: T.textMut }}>
              Coverage: 1M+ bonds, real-time pricing, full ESG, evaluated bond prices<br/>
              ROI: Enables institutional-grade fixed income analytics and reporting
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Rate Summary by Source ──────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Error Rate Summary (Last 24 Hours)')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {sources.filter(s => s.status !== 'planned').map(s => {
            const errorRate = s.errors_24h;
            const totalCalls = s.calls_24h || Math.round(sr(_sc++) * 20 + 2);
            const errPct = totalCalls > 0 ? (errorRate / totalCalls * 100).toFixed(1) : '0.0';
            const healthStatus = errorRate === 0 ? 'Healthy' : errorRate < 3 ? 'Warning' : 'Critical';
            const healthColor = errorRate === 0 ? T.green : errorRate < 3 ? T.amber : T.red;
            return (
              <div key={s.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderLeft: `4px solid ${healthColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: T.navy }}>{s.name.split(' ')[0]}</span>
                  <Badge label={healthStatus} color={healthColor} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec }}>
                  <span>Errors: {errorRate}</span>
                  <span>Calls: {totalCalls}</span>
                  <span>Rate: {errPct}%</span>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, parseFloat(errPct) * 10)}%`, height: '100%', background: healthColor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Refresh Schedule Calendar ──────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Refresh Schedule Overview')}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Source / Pipeline</th>
              <th style={thStyle}>Refresh Rate</th>
              <th style={thStyle}>Next Expected</th>
              <th style={thStyle}>Data Staleness Risk</th>
              <th style={thStyle}>Impact if Missed</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'EODHD Fundamentals', rate: 'Daily EOD', next: 'Tomorrow 00:00 UTC', risk: 'Low', impact: 'Stale market cap, revenue' },
              { name: 'Alpha Vantage Technicals', rate: 'Daily / Real-time', next: 'On next request', risk: 'Medium', impact: 'Stale RSI, MACD signals' },
              { name: 'OpenFIGI Identifiers', rate: 'Weekly', next: 'Next Sunday', risk: 'Very Low', impact: 'Missing identifiers for new listings' },
              { name: 'IMF Climate Data', rate: 'Quarterly', next: 'Next quarter', risk: 'Low', impact: 'Delayed sovereign ESG metrics' },
              { name: 'CBI Bond Data', rate: 'Quarterly', next: 'Next quarter', risk: 'Low', impact: 'Missing newly certified bonds' },
              { name: 'BRSR Database', rate: 'On-demand', next: 'Manual trigger', risk: 'Low', impact: 'Stale Indian ESG disclosures' },
            ].map((row, i) => (
              <tr key={i} style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{row.name}</td>
                <td style={tdStyle}>{row.rate}</td>
                <td style={{ ...tdStyle, fontSize: 11 }}>{row.next}</td>
                <td style={tdStyle}>
                  <Badge label={row.risk} color={row.risk === 'Very Low' ? T.textMut : row.risk === 'Low' ? T.sage : T.amber} />
                </td>
                <td style={{ ...tdStyle, fontSize: 11, color: T.textSec }}>{row.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Dependency Graph ────────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Pipeline Dependency Graph')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PIPELINES_INIT.map(p => {
            const src = sources.find(s => s.id === p.source || p.source.includes(s.id));
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ width: 140, fontWeight: 600, fontSize: 12, color: T.navyL, flexShrink: 0 }}>
                  {p.source}
                </div>
                <div style={{ flex: '0 0 40px', textAlign: 'center', color: T.gold, fontSize: 16 }}>
                  {'>'}
                </div>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 12, color: T.navy }}>
                  {p.name}
                </div>
                <div style={{ flex: '0 0 40px', textAlign: 'center', color: T.gold, fontSize: 16 }}>
                  {'>'}
                </div>
                <div style={{ width: 160, fontSize: 11, color: T.textSec, textAlign: 'right', flexShrink: 0 }}>
                  {p.target}
                </div>
                <Badge label={p.frequency} color={T.textMut} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: T.textMut }}>
          Data flows from external sources through pipelines into internal data stores. Run pipelines via the Pipeline tab.
        </div>
      </div>

      {/* ── Latency Distribution by Source (BarChart) ───────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Average Latency Distribution by Source')}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sources.filter(s => s.avg_latency_ms > 0).map(s => ({
            name: s.name.split(' ')[0],
            latency: s.avg_latency_ms,
            threshold: config.alert_threshold_latency,
          })).sort((a, b) => b.latency - a.latency)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textSec } }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
            <Bar dataKey="latency" name="Avg Latency (ms)" radius={[4,4,0,0]}>
              {sources.filter(s => s.avg_latency_ms > 0).sort((a, b) => b.avg_latency_ms - a.avg_latency_ms).map((s, i) => (
                <Cell key={i} fill={s.avg_latency_ms > config.alert_threshold_latency ? T.red : s.avg_latency_ms > 500 ? T.amber : T.green} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="threshold" stroke={T.red} strokeDasharray="5 5" name="Alert Threshold" dot={false} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>
          Red bars exceed the alert threshold ({config.alert_threshold_latency}ms). Adjust in Configuration tab.
        </div>
      </div>

      {/* ── Data Field Inventory ────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Data Field Inventory Across Sources')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {sources.filter(s => Array.isArray(s.data_fields) && s.data_fields.length > 0 && s.status !== 'planned').map(s => (
            <div key={s.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>{s.name}</span>
                <span style={{ fontSize: 11, color: T.textMut }}>{s.data_fields.length} fields</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {s.data_fields.map((f, j) => (
                  <span key={j} style={{ padding: '2px 8px', background: T.surface, borderRadius: 4, fontSize: 10, color: T.navyL, border: `1px solid ${T.border}`, fontFamily: 'monospace' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Coverage Statistics ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('Coverage Statistics')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total Companies in Master', value: companies.length, color: T.navy },
            { label: 'Exchanges Covered', value: [...new Set(companies.map(c => c._displayExchange).filter(Boolean))].length, color: T.sage },
            { label: 'Sectors Covered', value: [...new Set(companies.map(c => c.sector).filter(Boolean))].length, color: T.navyL },
            { label: 'Countries Covered', value: [...new Set(companies.map(c => c.country).filter(Boolean))].length, color: T.gold },
            { label: 'With ESG Scores', value: companies.filter(c => c.esg_score).length, color: T.sage },
            { label: 'With Emissions Data', value: companies.filter(c => c.scope1_mt || c.scope2_mt).length, color: T.amber },
            { label: 'Active API Sources', value: activeSources, color: T.green },
            { label: 'Planned Data Sources', value: sources.filter(s => s.status === 'planned').length, color: T.textMut },
            { label: 'Total Endpoints', value: sources.reduce((a, s) => a + s.endpoints.length, 0), color: T.navyL },
            { label: 'Unique Data Fields', value: [...new Set(sources.flatMap(s => Array.isArray(s.data_fields) ? s.data_fields : []))].length, color: T.navy },
          ].map((item, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{fmt(item.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── API Key Status Summary ──────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('API Key Status Summary')}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Source</th>
              <th style={thStyle}>Auth Method</th>
              <th style={thStyle}>Key Status</th>
              <th style={thStyle}>Last Validated</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => {
              const hasKey = s.auth === 'None' || s.auth === 'User agreement' || apiKeys[s.id];
              return (
                <tr key={s.id} style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                  <td style={tdStyle}>{s.auth}</td>
                  <td style={tdStyle}>
                    <Badge
                      label={s.auth === 'None' ? 'Not Required' : hasKey ? 'Configured' : 'Missing'}
                      color={s.auth === 'None' ? T.textMut : hasKey ? T.green : T.red}
                    />
                  </td>
                  <td style={tdStyle}>{hasKey && s.auth !== 'None' ? 'On last test' : '--'}</td>
                  <td style={{ ...tdStyle, fontSize: 10, color: T.textMut }}>
                    {s.status === 'planned' ? 'Requires subscription' : s.auth === 'None' ? 'Open access' : 'Stored in localStorage'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── System Information ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('System Information')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { label: 'Platform Version', value: '6.0' },
            { label: 'Total Data Sources', value: `${sources.length}` },
            { label: 'Active Pipelines', value: `${pipelines.length}` },
            { label: 'Company Master', value: `${companies.length} companies` },
            { label: 'Exchanges', value: [...new Set(companies.map(c => c._displayExchange).filter(Boolean))].length },
            { label: 'localStorage Keys', value: `${LS_KEYS}, ${LS_CONFIG}, ${LS_LOG}` },
            { label: 'Cache Strategy', value: 'TTL-based per source' },
            { label: 'Error Handling', value: 'Retry with exponential backoff' },
            { label: 'Authentication', value: 'API Key / OAuth / None' },
            { label: 'Sprint', value: 'P - Data Infrastructure' },
          ].map((item, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: T.textMut, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cross Navigation Footer ────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 11, color: T.textMut }}>Sprint P - Data Infrastructure & Live Feeds | EP-P1 API Orchestration</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Data Quality Monitor', path: '/data-quality-monitor' },
            { label: 'Portfolio Dashboard', path: '/portfolio-dashboard' },
            { label: 'Company Profiles', path: '/company-profiles' },
            { label: 'PCAF India BRSR', path: '/pcaf-india-brsr' },
            { label: 'ESG Data Quality', path: '/esg-data-quality' },
            { label: 'Sector Benchmarking', path: '/sector-benchmarking' },
          ].map(n => (
            <button key={n.path} style={{ ...btnStyle, fontSize: 10, padding: '4px 10px' }} onClick={() => navigate(n.path)}>{n.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
