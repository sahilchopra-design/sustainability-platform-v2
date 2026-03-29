import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── LocalStorage Keys ─────────────────────────────────────────────────────── */
const LS_CUSTOM = 'ra_etl_custom_v1';
const LS_SCHED = 'ra_etl_schedule_v1';
const LS_LOG = 'ra_etl_run_log_v1';
const LS_PORT = 'ra_portfolio_v1';

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const loadJSON = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) || fb; } catch { return fb; } };
const saveJSON = (key, v) => localStorage.setItem(key, JSON.stringify(v));
const fmt = v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);
const fmtPct = v => v == null ? '--' : `${v.toFixed(1)}%`;
const fmtMs = v => v == null ? '--' : v < 1000 ? `${v}ms` : `${(v / 1000).toFixed(1)}s`;
const fmtDate = iso => iso ? new Date(iso).toLocaleString() : 'Never';
const nowISO = () => new Date().toISOString();

/* ── ETL Stages ─────────────────────────────────────────────────────────────── */
const ETL_STAGES = {
  extract: [
    { id: 'E01', name: 'EODHD Fundamentals', source: 'eodhd', endpoint: '/fundamentals', records: 656, status: 'active', avg_duration_ms: 4200, error_rate: 0.5 },
    { id: 'E02', name: 'EODHD EOD Prices', source: 'eodhd', endpoint: '/eod', records: 656, status: 'active', avg_duration_ms: 3800, error_rate: 0.3 },
    { id: 'E03', name: 'Alpha Vantage Technicals', source: 'alphavantage', endpoint: '/query', records: 200, status: 'active', avg_duration_ms: 6500, error_rate: 2.1 },
    { id: 'E04', name: 'BRSR Supabase Sync', source: 'supabase', endpoint: 'brsr_*', records: 1323, status: 'active', avg_duration_ms: 2100, error_rate: 0.1 },
    { id: 'E05', name: 'OpenFIGI Resolution', source: 'openfigi', endpoint: '/mapping', records: 656, status: 'active', avg_duration_ms: 3200, error_rate: 1.2 },
    { id: 'E06', name: 'CBI Bond Universe', source: 'cbi', endpoint: 'static', records: 50, status: 'active', avg_duration_ms: 800, error_rate: 0 },
    { id: 'E07', name: 'IMF Climate Data', source: 'imf', endpoint: '/arcgis', records: 20, status: 'active', avg_duration_ms: 5500, error_rate: 3.5 },
    { id: 'E08', name: 'World Bank Indicators', source: 'worldbank', endpoint: '/v2', records: 40, status: 'active', avg_duration_ms: 4800, error_rate: 1.8 },
  ],
  transform: [
    { id: 'T01', name: 'FX Conversion', description: 'Convert 13 currencies to USD Mn', input: 'E01,E04', output: 'revenue_usd_mn, market_cap_usd_mn, evic_usd_mn', records: 656, avg_duration_ms: 1200, error_rate: 0.2 },
    { id: 'T02', name: 'GHG Intensity Calc', description: '(S1+S2)\u00d71e6/Revenue', input: 'E01,E04', output: 'ghg_intensity_tco2e_per_mn', records: 400, avg_duration_ms: 800, error_rate: 0.5 },
    { id: 'T03', name: 'WACI Computation', description: '\u03a3(weight\u00d7intensity)', input: 'T02,Portfolio', output: 'portfolio_waci', records: 1, avg_duration_ms: 200, error_rate: 0 },
    { id: 'T04', name: 'ESG Normalization', description: 'Normalize ESG to 0-100 percentile', input: 'E01,E04', output: 'esg_score_normalized', records: 656, avg_duration_ms: 600, error_rate: 0.1 },
    { id: 'T05', name: 'PCAF Attribution', description: 'Exposure/EVIC', input: 'E01,Portfolio', output: 'attribution_factor', records: 'dynamic', avg_duration_ms: 400, error_rate: 0.3 },
    { id: 'T06', name: 'Transition Risk Score', description: 'f(sector, intensity, SBTi, NZ year)', input: 'E01,T02', output: 'transition_risk_score', records: 656, avg_duration_ms: 1500, error_rate: 0.4 },
    { id: 'T07', name: 'ITR Regression', description: 'IPCC budget interpolation', input: 'T02', output: 'implied_temperature', records: 656, avg_duration_ms: 2200, error_rate: 1.1 },
    { id: 'T08', name: 'Bond Enrichment', description: 'CBI + FIGI + Sovereign ESG', input: 'E05,E06,E07', output: 'enriched_bonds', records: 80, avg_duration_ms: 900, error_rate: 0.6 },
    { id: 'T09', name: 'Sovereign Composite', description: 'Climate+Social+Governance average', input: 'E07,E08', output: 'sovereign_esg_score', records: 40, avg_duration_ms: 300, error_rate: 0 },
    { id: 'T10', name: 'Sector Benchmarks', description: 'Percentile ranks within sector', input: 'T04,T06', output: 'sector_percentile', records: 656, avg_duration_ms: 700, error_rate: 0.2 },
  ],
  load: [
    { id: 'L01', name: 'Global Company Master', target: 'globalCompanyMaster.js', records: 656, format: 'JS Object', avg_duration_ms: 500, error_rate: 0 },
    { id: 'L02', name: 'Portfolio localStorage', target: 'ra_portfolio_v1', records: 'dynamic', format: 'JSON', avg_duration_ms: 100, error_rate: 0 },
    { id: 'L03', name: 'Bond Reference DB', target: 'bondReferenceDB', records: 80, format: 'JS Array', avg_duration_ms: 200, error_rate: 0 },
    { id: 'L04', name: 'Sovereign ESG DB', target: 'SOVEREIGN_ESG_DB', records: 40, format: 'JS Array', avg_duration_ms: 150, error_rate: 0 },
    { id: 'L05', name: 'Module KPI Cache', target: 'ra_module_cache_*', records: 'dynamic', format: 'localStorage', avg_duration_ms: 80, error_rate: 0 },
  ],
};

const ALL_STAGES = [
  ...ETL_STAGES.extract.map(s => ({ ...s, type: 'Extract' })),
  ...ETL_STAGES.transform.map(s => ({ ...s, type: 'Transform' })),
  ...ETL_STAGES.load.map(s => ({ ...s, type: 'Load' })),
];

const STAGE_TYPE_COLORS = { Extract: T.navyL, Transform: T.gold, Load: T.sage };

/* ── Dependency Map ─────────────────────────────────────────────────────────── */
const buildDependencies = () => {
  const deps = [];
  [...ETL_STAGES.transform, ...ETL_STAGES.load].forEach(stage => {
    const inputs = (stage.input || '').split(',').map(s => s.trim()).filter(Boolean);
    inputs.forEach(inp => {
      const source = ALL_STAGES.find(s => s.id === inp);
      if (source) deps.push({ from: source.id, fromName: source.name, to: stage.id, toName: stage.name, fromType: source.type || (source.id.startsWith('E') ? 'Extract' : 'Transform'), toType: stage.type || (stage.id.startsWith('T') ? 'Transform' : 'Load') });
    });
  });
  return deps;
};

/* ── Seed Run Logs ──────────────────────────────────────────────────────────── */
const buildSeedLogs = () => {
  const runs = [];
  for (let r = 0; r < 10; r++) {
    const ts = new Date(Date.now() - (10 - r) * 86400000).toISOString();
    const stageRuns = ALL_STAGES.map(s => ({
      run_id: `run_${r}`,
      stage_id: s.id,
      stage_name: s.name,
      type: s.type,
      started: ts,
      duration_ms: Math.round((s.avg_duration_ms || 500) * (0.7 + sr(_sc++) * 0.6)),
      records_in: typeof s.records === 'number' ? s.records : 50,
      records_out: typeof s.records === 'number' ? s.records - Math.floor(sr(_sc++) * 3) : 48,
      status: sr(_sc++) < (s.error_rate || 0) / 100 * 3 ? 'error' : 'success',
      error_msg: null,
    }));
    stageRuns.filter(s => s.status === 'error').forEach(s => {
      s.error_msg = ['Timeout after 30s', 'Rate limit exceeded', 'Invalid response format', 'Connection refused', 'Data validation failed'][Math.floor(sr(_sc++) * 5)];
    });
    runs.push(...stageRuns);
  }
  return runs;
};

/* ── Components ─────────────────────────────────────────────────────────────── */
const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
);

const KPICard = ({ label, value, sub, color = T.navy, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', minWidth: 140, flex: '1 1 140px' }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>{icon && <span>{icon}</span>}{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SortHeader = ({ label, field, sortCol, sortDir, onSort, style = {} }) => (
  <th onClick={() => onSort(field)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, cursor: 'pointer', userSelect: 'none', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, whiteSpace: 'nowrap', ...style }}>
    {label} {sortCol === field ? (sortDir === 'asc' ? ' \u25b2' : ' \u25bc') : ' \u21c5'}
  </th>
);

const Btn = ({ children, onClick, color = T.navy, disabled, small, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: small ? '4px 10px' : '8px 16px', fontSize: small ? 11 : 12, fontWeight: 700, color: '#fff', background: disabled ? T.textMut : color, border: 'none', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, letterSpacing: 0.3, ...style }}>{children}</button>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>{title}</div>
      {badge && <Badge label={badge} color={T.gold} />}
    </div>
    {children}
  </div>
);

const StatusDot = ({ status }) => {
  const colors = { active: T.green, success: T.green, running: T.navyL, error: T.red, idle: T.textMut, paused: T.amber };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || T.textMut, marginRight: 6 }} />;
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function EtlPipelinePage() {
  const navigate = useNavigate();

  /* ── State ────────────────────────────────────────────────────────────────── */
  const [runLog, setRunLog] = useState(() => {
    const stored = loadJSON(LS_LOG, null);
    if (stored && stored.length) return stored;
    const seed = buildSeedLogs();
    saveJSON(LS_LOG, seed);
    return seed;
  });
  const [customStages, setCustomStages] = useState(() => loadJSON(LS_CUSTOM, []));
  const [schedule, setSchedule] = useState(() => loadJSON(LS_SCHED, { frequency: 'daily', hour: '02:00', enabled: true, on_import: true, on_enrichment: true }));
  const [tab, setTab] = useState('overview');
  const [selectedStage, setSelectedStage] = useState(null);
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [healthSlider, setHealthSlider] = useState(80);

  /* ── Custom stage builder state ───────────────────────────────────────────── */
  const [newStageName, setNewStageName] = useState('');
  const [newStageInput, setNewStageInput] = useState('');
  const [newStageFormula, setNewStageFormula] = useState('');
  const [newStageOutput, setNewStageOutput] = useState('');

  const portfolio = useMemo(() => loadJSON(LS_PORT, []), []);
  const dependencies = useMemo(() => buildDependencies(), []);

  /* ── Persist ──────────────────────────────────────────────────────────────── */
  useEffect(() => { saveJSON(LS_LOG, runLog); }, [runLog]);
  useEffect(() => { saveJSON(LS_CUSTOM, customStages); }, [customStages]);
  useEffect(() => { saveJSON(LS_SCHED, schedule); }, [schedule]);

  /* ── Sorting ──────────────────────────────────────────────────────────────── */
  const onSort = useCallback(col => { setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); setSortCol(col); }, [sortCol]);

  const sortedStages = useMemo(() => {
    const arr = [...ALL_STAGES, ...customStages.map(c => ({ ...c, type: 'Custom' }))];
    const filtered = searchTerm ? arr.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())) : arr;
    filtered.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [sortCol, sortDir, customStages, searchTerm]);

  /* ── KPIs ─────────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const totalRecords = ALL_STAGES.reduce((s, st) => s + (typeof st.records === 'number' ? st.records : 0), 0);
    const latestRuns = runLog.filter(r => r.run_id === 'run_9');
    const successRate = latestRuns.length ? (latestRuns.filter(r => r.status === 'success').length / latestRuns.length * 100) : 100;
    const avgDuration = latestRuns.length ? latestRuns.reduce((s, r) => s + r.duration_ms, 0) / latestRuns.length : 0;
    const errorCount = latestRuns.filter(r => r.status === 'error').length;
    const lastRunDate = runLog.length ? runLog[runLog.length - 1].started : null;
    const freshness = lastRunDate ? Math.round((Date.now() - new Date(lastRunDate).getTime()) / 3600000) : null;
    return {
      extractSources: ETL_STAGES.extract.length,
      transformSteps: ETL_STAGES.transform.length + customStages.length,
      loadTargets: ETL_STAGES.load.length,
      totalRecords,
      successRate: fmtPct(successRate),
      avgDuration: fmtMs(avgDuration),
      lastRun: fmtDate(lastRunDate),
      nextScheduled: schedule.enabled ? `Today ${schedule.hour}` : 'Disabled',
      errorCount,
      freshness: freshness != null ? `${freshness}h ago` : '--',
    };
  }, [runLog, customStages, schedule]);

  /* ── Run Pipeline Simulation ──────────────────────────────────────────────── */
  const runFullPipeline = useCallback(() => {
    if (runningPipeline) return;
    setRunningPipeline(true);
    setRunProgress(0);
    const total = ALL_STAGES.length;
    let current = 0;
    const iv = setInterval(() => {
      current++;
      setRunProgress(Math.round(current / total * 100));
      if (current >= total) {
        clearInterval(iv);
        const newRun = ALL_STAGES.map(s => ({
          run_id: `run_${Date.now()}`,
          stage_id: s.id,
          stage_name: s.name,
          type: s.type,
          started: nowISO(),
          duration_ms: Math.round((s.avg_duration_ms || 500) * (0.8 + sr(_sc++) * 0.4)),
          records_in: typeof s.records === 'number' ? s.records : 50,
          records_out: typeof s.records === 'number' ? s.records : 48,
          status: sr(_sc++) < 0.05 ? 'error' : 'success',
          error_msg: null,
        }));
        newRun.filter(r => r.status === 'error').forEach(r => { r.error_msg = 'Simulated error during pipeline run'; });
        setRunLog(prev => [...prev.slice(-200), ...newRun]);
        setRunningPipeline(false);
      }
    }, 120);
  }, [runningPipeline]);

  /* ── Execution Timeline Data ──────────────────────────────────────────────── */
  const timelineData = useMemo(() => {
    const runs = [...new Set(runLog.map(r => r.run_id))].slice(-10);
    return runs.map((rid, i) => {
      const stages = runLog.filter(r => r.run_id === rid);
      const totalMs = stages.reduce((s, r) => s + r.duration_ms, 0);
      const errors = stages.filter(s => s.status === 'error').length;
      return { run: `Run ${i + 1}`, duration_s: +(totalMs / 1000).toFixed(1), errors, stages: stages.length, success_rate: +((stages.length - errors) / stages.length * 100).toFixed(0) };
    });
  }, [runLog]);

  /* ── Data Flow Metrics ────────────────────────────────────────────────────── */
  const flowMetrics = useMemo(() => {
    const latestRun = [...new Set(runLog.map(r => r.run_id))].pop();
    if (!latestRun) return [];
    return runLog.filter(r => r.run_id === latestRun).map(r => ({
      stage: r.stage_id,
      name: r.stage_name.slice(0, 18),
      records_in: r.records_in,
      records_out: r.records_out,
      loss: r.records_in - r.records_out,
      loss_pct: r.records_in > 0 ? +((r.records_in - r.records_out) / r.records_in * 100).toFixed(1) : 0,
    }));
  }, [runLog]);

  /* ── Error Log ────────────────────────────────────────────────────────────── */
  const errorLog = useMemo(() => runLog.filter(r => r.status === 'error').slice(-30).reverse(), [runLog]);

  /* ── Error Rate by Stage ──────────────────────────────────────────────────── */
  const errorRateByStage = useMemo(() => {
    const stageMap = {};
    runLog.forEach(r => {
      if (!stageMap[r.stage_id]) stageMap[r.stage_id] = { total: 0, errors: 0, name: r.stage_name };
      stageMap[r.stage_id].total++;
      if (r.status === 'error') stageMap[r.stage_id].errors++;
    });
    return Object.entries(stageMap).map(([id, d]) => ({
      stage: id,
      name: d.name.slice(0, 16),
      error_rate: d.total > 0 ? +(d.errors / d.total * 100).toFixed(1) : 0,
      errors: d.errors,
      total: d.total,
    })).sort((a, b) => b.error_rate - a.error_rate);
  }, [runLog]);

  /* ── Pipeline Health Score ────────────────────────────────────────────────── */
  const healthScore = useMemo(() => {
    const latest = [...new Set(runLog.map(r => r.run_id))].pop();
    if (!latest) return 100;
    const stages = runLog.filter(r => r.run_id === latest);
    const successPct = stages.length ? stages.filter(s => s.status === 'success').length / stages.length * 100 : 100;
    const avgLatency = stages.length ? stages.reduce((s, r) => s + r.duration_ms, 0) / stages.length : 0;
    const latencyPenalty = avgLatency > 5000 ? 15 : avgLatency > 3000 ? 8 : 0;
    return Math.max(0, Math.min(100, Math.round(successPct - latencyPenalty)));
  }, [runLog]);

  /* ── Add Custom Stage ─────────────────────────────────────────────────────── */
  const addCustomStage = useCallback(() => {
    if (!newStageName) return;
    const newStage = {
      id: `C${String(customStages.length + 1).padStart(2, '0')}`,
      name: newStageName,
      description: newStageFormula || 'Custom transform',
      input: newStageInput,
      output: newStageOutput || 'custom_field',
      records: 'dynamic',
      avg_duration_ms: 500,
      error_rate: 0,
      status: 'active',
      type: 'Custom',
      created: nowISO()
    };
    setCustomStages(prev => [...prev, newStage]);
    setNewStageName(''); setNewStageInput(''); setNewStageFormula(''); setNewStageOutput('');
  }, [newStageName, newStageInput, newStageFormula, newStageOutput, customStages]);

  /* ── Exports ──────────────────────────────────────────────────────────────── */
  const exportConfigJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ stages: ETL_STAGES, custom: customStages, schedule, exported: nowISO() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `etl_config_${Date.now()}.json`; a.click();
  }, [customStages, schedule]);

  const exportRunLogCSV = useCallback(() => {
    const headers = ['Run ID', 'Stage ID', 'Stage Name', 'Type', 'Started', 'Duration ms', 'Records In', 'Records Out', 'Status', 'Error'];
    const rows = runLog.map(r => [r.run_id, r.stage_id, r.stage_name, r.type, r.started, r.duration_ms, r.records_in, r.records_out, r.status, r.error_msg || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `etl_run_log_${Date.now()}.csv`; a.click();
  }, [runLog]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Tabs ──────────────────────────────────────────────────────────────────── */
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'flow', label: 'Visual Flow' },
    { id: 'stages', label: 'Stage Table' },
    { id: 'errors', label: 'Errors' },
    { id: 'builder', label: 'Pipeline Builder' },
    { id: 'schedule', label: 'Schedule' },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T.navy, margin: 0, letterSpacing: -0.5 }}>ETL Pipeline Visual Manager</h1>
            <Badge label="EP-S4" color={T.gold} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {['8 Extract', '10 Transform', '5 Load', 'Visual Flow'].map(b => <Badge key={b} label={b} color={T.sage} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportConfigJSON} color={T.navy} small>Export Config JSON</Btn>
          <Btn onClick={exportRunLogCSV} color={T.sage} small>Export Run Log CSV</Btn>
          <Btn onClick={exportPrint} color={T.gold} small>Print</Btn>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPICard label="Extract Sources" value={kpis.extractSources} icon="📥" color={T.navyL} />
        <KPICard label="Transform Steps" value={kpis.transformSteps} icon="⚙️" color={T.gold} />
        <KPICard label="Load Targets" value={kpis.loadTargets} icon="📤" color={T.sage} />
        <KPICard label="Total Records" value={fmt(kpis.totalRecords)} icon="📊" color={T.navy} />
        <KPICard label="Success Rate" value={kpis.successRate} icon="✅" color={T.green} />
        <KPICard label="Avg Duration" value={kpis.avgDuration} icon="⏱️" color={T.navyL} />
        <KPICard label="Last Run" value={kpis.lastRun.split(',')[0] || '--'} sub={kpis.lastRun.split(',')[1] || ''} icon="🕐" color={T.gold} />
        <KPICard label="Next Scheduled" value={kpis.nextScheduled} icon="📅" color={T.sage} />
        <KPICard label="Error Count" value={kpis.errorCount} icon="❌" color={kpis.errorCount > 0 ? T.red : T.green} />
        <KPICard label="Data Freshness" value={kpis.freshness} icon="🔄" color={T.amber} />
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: `2px solid ${T.border}`, paddingBottom: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 18px', fontSize: 12, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? T.navy : T.textMut, background: tab === t.id ? T.surface : 'transparent', border: tab === t.id ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === t.id ? `2px solid ${T.gold}` : 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────────────────── */}
      {tab === 'overview' && <>
        {/* Pipeline Run Panel */}
        <Section title="Pipeline Execution" badge={runningPipeline ? 'Running' : 'Idle'}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Btn onClick={runFullPipeline} color={T.sage} disabled={runningPipeline}>{runningPipeline ? `Running... ${runProgress}%` : 'Run Full Pipeline'}</Btn>
            {runningPipeline && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ height: 8, background: T.border, borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${runProgress}%`, background: T.sage, borderRadius: 4, transition: 'width 0.2s' }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>Processing stage {Math.ceil(runProgress / 100 * ALL_STAGES.length)} of {ALL_STAGES.length}</div>
              </div>
            )}
          </div>
        </Section>

        {/* Pipeline Execution Timeline */}
        <Section title="Pipeline Execution Timeline" badge="Last 10 runs">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="run" fontSize={10} tick={{ fill: T.textSec }} />
              <YAxis yAxisId="left" fontSize={10} tick={{ fill: T.textSec }} label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
              <YAxis yAxisId="right" orientation="right" fontSize={10} tick={{ fill: T.textSec }} label={{ value: 'Success %', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: T.textMut } }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="duration_s" fill={T.navy} name="Duration (s)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="success_rate" stroke={T.sage} strokeWidth={2} name="Success %" dot={{ r: 3 }} />
              <Bar yAxisId="left" dataKey="errors" fill={T.red} name="Errors" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        {/* Data Flow Metrics */}
        <Section title="Data Flow Metrics" badge="Latest run">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={flowMetrics.slice(0, 15)} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" angle={-40} textAnchor="end" fontSize={10} tick={{ fill: T.textSec }} interval={0} />
              <YAxis fontSize={10} tick={{ fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="records_in" fill={T.navyL} name="Records In" radius={[4, 4, 0, 0]} />
              <Bar dataKey="records_out" fill={T.sage} name="Records Out" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Pipeline Health Summary */}
        <Section title="Pipeline Health Summary" badge={`Score: ${healthScore}/100`}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: `6px solid ${healthScore >= 80 ? T.green : healthScore >= 60 ? T.amber : T.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: healthScore >= 80 ? T.green : healthScore >= 60 ? T.amber : T.red }}>{healthScore}</div>
              <div style={{ fontSize: 9, color: T.textMut }}>HEALTH</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Health threshold slider: {healthSlider}</div>
              <input type="range" min={50} max={100} value={healthSlider} onChange={e => setHealthSlider(+e.target.value)} style={{ width: '100%', accentColor: T.gold }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
                {[
                  { label: 'Overall Status', value: healthScore >= healthSlider ? 'Healthy' : 'Degraded', color: healthScore >= healthSlider ? T.green : T.red },
                  { label: 'Bottleneck', value: errorRateByStage[0]?.name || 'None', color: T.amber },
                  { label: 'Recommendation', value: healthScore >= 90 ? 'All systems nominal' : healthScore >= 70 ? 'Monitor error-prone stages' : 'Investigate failing stages', color: T.textSec },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </>}

      {/* ── VISUAL FLOW TAB ─────────────────────────────────────────────────── */}
      {tab === 'flow' && (
        <Section title="Visual Pipeline Flow" badge="E \u2192 T \u2192 L">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, minHeight: 400 }}>
            {/* Extract Column */}
            <div>
              <div style={{ textAlign: 'center', padding: '8px 0', marginBottom: 12 }}>
                <Badge label="EXTRACT" color={T.navyL} />
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{ETL_STAGES.extract.length} sources</div>
              </div>
              {ETL_STAGES.extract.map(s => (
                <div key={s.id} onClick={() => setSelectedStage(s)} style={{ padding: '10px 14px', background: selectedStage?.id === s.id ? `${T.navyL}18` : T.surfaceH, border: `1px solid ${selectedStage?.id === s.id ? T.navyL : T.border}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${T.navyL}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{s.id}</div>
                    <StatusDot status={s.status} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{fmt(s.records)} records \u2022 {s.source}</div>
                </div>
              ))}
            </div>

            {/* Transform Column */}
            <div>
              <div style={{ textAlign: 'center', padding: '8px 0', marginBottom: 12 }}>
                <Badge label="TRANSFORM" color={T.gold} />
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{ETL_STAGES.transform.length} steps</div>
              </div>
              {ETL_STAGES.transform.map(s => (
                <div key={s.id} onClick={() => setSelectedStage(s)} style={{ padding: '10px 14px', background: selectedStage?.id === s.id ? `${T.gold}18` : T.surfaceH, border: `1px solid ${selectedStage?.id === s.id ? T.gold : T.border}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${T.gold}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{s.id}</div>
                    <span style={{ fontSize: 10, color: T.textMut }}>{s.input}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{s.description}</div>
                </div>
              ))}
            </div>

            {/* Load Column */}
            <div>
              <div style={{ textAlign: 'center', padding: '8px 0', marginBottom: 12 }}>
                <Badge label="LOAD" color={T.sage} />
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{ETL_STAGES.load.length} targets</div>
              </div>
              {ETL_STAGES.load.map(s => (
                <div key={s.id} onClick={() => setSelectedStage(s)} style={{ padding: '10px 14px', background: selectedStage?.id === s.id ? `${T.sage}18` : T.surfaceH, border: `1px solid ${selectedStage?.id === s.id ? T.sage : T.border}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${T.sage}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{s.id}</div>
                    <Badge label={s.format} color={T.sage} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{s.target} \u2022 {fmt(s.records)} records</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Detail Panel */}
          {selectedStage && (
            <div style={{ marginTop: 16, padding: '16px 20px', background: T.surfaceH, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>{selectedStage.id} — {selectedStage.name}</div>
                <Btn small color={T.sage} onClick={() => setSelectedStage(null)}>Close</Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Type', value: selectedStage.type || (selectedStage.id.startsWith('E') ? 'Extract' : selectedStage.id.startsWith('T') ? 'Transform' : 'Load') },
                  { label: 'Records', value: fmt(selectedStage.records) },
                  { label: 'Avg Duration', value: fmtMs(selectedStage.avg_duration_ms) },
                  { label: 'Error Rate', value: `${selectedStage.error_rate || 0}%` },
                  { label: 'Source/Target', value: selectedStage.source || selectedStage.target || '--' },
                  { label: 'Endpoint', value: selectedStage.endpoint || '--' },
                  { label: 'Input', value: selectedStage.input || '--' },
                  { label: 'Output', value: (selectedStage.output || '--').slice(0, 40) },
                  { label: 'Description', value: selectedStage.description || '--' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '8px 12px', background: T.surface, borderRadius: 6, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMut }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependency Graph */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 10 }}>Dependency Graph (DAG)</div>
            <div style={{ overflowX: 'auto', maxHeight: 350, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['From', 'Type', '\u2192', 'To', 'Type'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dependencies.map((d, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{d.from} — {d.fromName}</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={d.fromType} color={STAGE_TYPE_COLORS[d.fromType]} /></td>
                      <td style={{ padding: '8px 12px', fontSize: 16, color: T.gold, fontWeight: 700, borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>\u2192</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{d.to} — {d.toName}</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={d.toType} color={STAGE_TYPE_COLORS[d.toType]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {/* ── STAGE TABLE TAB ─────────────────────────────────────────────────── */}
      {tab === 'stages' && (
        <Section title="Pipeline Stage Table" badge={`${sortedStages.length} stages`}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search stages..." style={{ padding: '8px 14px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 12, width: 300, fontFamily: T.font }} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <SortHeader label="ID" field="id" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Name" field="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Type" field="type" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>Source/Target</th>
                  <SortHeader label="Records" field="records" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Status" field="status" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Avg Duration" field="avg_duration_ms" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <SortHeader label="Error Rate" field="error_rate" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStages.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${T.gold}12`} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? T.surface : T.surfaceH}>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontFamily: 'monospace' }}>{s.id}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{s.name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={s.type} color={STAGE_TYPE_COLORS[s.type] || T.textMut} /></td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{s.source || s.target || s.input || '--'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{fmt(s.records)}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}><StatusDot status={s.status || 'active'} /><span style={{ fontSize: 11, color: T.textSec }}>{s.status || 'active'}</span></td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}` }}>{fmtMs(s.avg_duration_ms)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, color: (s.error_rate || 0) > 2 ? T.red : (s.error_rate || 0) > 0.5 ? T.amber : T.green, borderBottom: `1px solid ${T.border}` }}>{s.error_rate || 0}%</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}>
                      <Btn small color={T.navyL} onClick={() => { setSelectedStage(s); setTab('flow'); }}>Details</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── ERRORS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'errors' && <>
        {/* Error Rate by Stage */}
        <Section title="Error Rate by Stage" badge={`${errorRateByStage.filter(s => s.errors > 0).length} stages with errors`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={errorRateByStage.filter(s => s.errors > 0).slice(0, 12)} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" angle={-40} textAnchor="end" fontSize={10} tick={{ fill: T.textSec }} interval={0} />
              <YAxis fontSize={10} tick={{ fill: T.textSec }} label={{ value: 'Error %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="error_rate" fill={T.red} name="Error Rate %" radius={[4, 4, 0, 0]}>
                {errorRateByStage.map((_, i) => <Cell key={i} fill={i < 3 ? T.red : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Error Log Table */}
        <Section title="Error & Retry Management" badge={`${errorLog.length} errors`}>
          {errorLog.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    {['Run', 'Stage', 'Type', 'Duration', 'Error Message', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {errorLog.map((e, i) => (
                    <tr key={`${e.run_id}_${e.stage_id}_${i}`} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textMut, borderBottom: `1px solid ${T.border}`, fontFamily: 'monospace' }}>{e.run_id.slice(0, 12)}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{e.stage_id} — {e.stage_name}</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}><Badge label={e.type} color={STAGE_TYPE_COLORS[e.type] || T.textMut} /></td>
                      <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}` }}>{fmtMs(e.duration_ms)}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: T.red, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{e.error_msg || 'Unknown error'}</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
                        <Btn small color={T.amber} onClick={() => {}}>Retry</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: T.green, fontSize: 13, fontWeight: 600 }}>No errors recorded. All stages running cleanly.</div>
          )}
        </Section>
      </>}

      {/* ── BUILDER TAB ─────────────────────────────────────────────────────── */}
      {tab === 'builder' && (
        <Section title="Pipeline Builder" badge={`${customStages.length} custom stages`}>
          <div style={{ padding: '16px 20px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Add Custom Transform Stage</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Stage Name *</div>
                <input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="e.g. Carbon Price Adjustment" style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Input Fields</div>
                <input value={newStageInput} onChange={e => setNewStageInput(e.target.value)} placeholder="e.g. T02,E01" style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Formula / Logic</div>
                <input value={newStageFormula} onChange={e => setNewStageFormula(e.target.value)} placeholder="e.g. revenue * carbon_price_factor" style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Output Field</div>
                <input value={newStageOutput} onChange={e => setNewStageOutput(e.target.value)} placeholder="e.g. carbon_adjusted_revenue" style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Btn onClick={addCustomStage} color={T.sage} disabled={!newStageName}>Add Custom Stage</Btn>
            </div>
          </div>

          {/* Custom Stages List */}
          {customStages.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['ID', 'Name', 'Input', 'Formula', 'Output', 'Created', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, background: T.surfaceH }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customStages.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: T.navy, borderBottom: `1px solid ${T.border}` }}>{s.id}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{s.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{s.input || '--'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{s.description}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{s.output}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{fmtDate(s.created)}</td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
                        <Btn small color={T.red} onClick={() => setCustomStages(prev => prev.filter(cs => cs.id !== s.id))}>Remove</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ── SCHEDULE TAB ────────────────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <Section title="Schedule Manager" badge="Persistent">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
            {[
              { key: 'enabled', label: 'Scheduled Pipeline Runs', desc: `Runs ${schedule.frequency} at ${schedule.hour}` },
              { key: 'on_import', label: 'Run on Data Import', desc: 'Auto-trigger pipeline when new data is imported' },
              { key: 'on_enrichment', label: 'Run on Enrichment', desc: 'Auto-trigger pipeline after enrichment completes' },
            ].map(item => (
              <div key={item.key} style={{ padding: '16px 18px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{item.label}</div>
                  <div onClick={() => setSchedule(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={{ width: 42, height: 22, borderRadius: 11, background: schedule[item.key] ? T.sage : T.textMut, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: schedule[item.key] ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textMut }}>{item.desc}</div>
              </div>
            ))}
          </div>
          {schedule.enabled && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Frequency</div>
                <select value={schedule.frequency} onChange={e => setSchedule(prev => ({ ...prev, frequency: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                  {['hourly', 'every_6h', 'daily', 'weekly', 'monthly'].map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Time</div>
                <select value={schedule.hour} onChange={e => setSchedule(prev => ({ ...prev, hour: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font }}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Cross-Navigation ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, alignSelf: 'center' }}>Navigate:</div>
        {[
          { label: 'API Orchestration', path: '/api-orchestration' },
          { label: 'Data Quality', path: '/data-quality' },
          { label: 'Live Feed Manager', path: '/live-feed-manager' },
          { label: 'BRSR Bridge', path: '/brsr-bridge' },
          { label: 'Data Versioning', path: '/data-versioning' },
          { label: 'Enrichment Hub', path: '/enrichment-hub' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: T.navy, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>{n.label}</button>
        ))}
      </div>
    </div>
  );
}