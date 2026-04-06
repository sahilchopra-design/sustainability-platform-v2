import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import DataUploadPanel from '../../../components/DataUploadPanel';
import { useTestData } from '../../../context/TestDataContext';

const API = 'http://localhost:8001';
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const STATUS_COLOR = { success: T.green, failed: T.red, running: T.blue, partial: T.amber, skipped: '#9ca3af' };
const BADGE = (label, color) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 6px' }}>{label}</span>
);

const DEFAULT_PIPELINES = [
  { id: 'brsr-enrichment',    label: 'BRSR Enrichment',    schedule: 'Daily 02:00 IST',    domain: 'SEBI BRSR',   expectedMs: 5000 },
  { id: 'iea-pathways-sync',  label: 'IEA Pathways Sync',  schedule: 'Weekly Sun 00:00',   domain: 'IEA WEO',     expectedMs: 2000 },
  { id: 'ngfs-seed',          label: 'NGFS Scenario Seed', schedule: 'Manual / on deploy', domain: 'NGFS P3',     expectedMs: 1500 },
  { id: 'nature-risk-loader', label: 'Nature Risk Loader', schedule: 'Weekly Sat 01:00',   domain: 'TNFD/GBF',    expectedMs: 4000 },
  { id: 'pcaf-waci-calc',     label: 'PCAF WACI Calc',     schedule: 'Daily 03:30 IST',    domain: 'PCAF v2',     expectedMs: 6000 },
  { id: 'regulatory-monitor', label: 'Regulatory Monitor', schedule: 'Daily 06:00 UTC',    domain: 'Multi-FW',    expectedMs: 3000 },
];

const DEMO_STATS = {
  total_runs_30d: 186, success_rate_pct: 94.6, avg_duration_ms: 4320, p95_duration_ms: 12800,
  total_records_30d: 482000, data_source: 'memory_fallback',
};

const DEMO_HISTORY = Array.from({ length: 20 }, (_, i) => ({
  run_id: `run-${String(i).padStart(3,'0')}`,
  pipeline_id: DEFAULT_PIPELINES[i % DEFAULT_PIPELINES.length].id,
  started_at: new Date(Date.now() - i * 86400000 / 4).toISOString(),
  status: i === 2 ? 'failed' : i === 5 ? 'partial' : i === 9 ? 'failed' : 'success',
  records_processed: 1200 + Math.round((sr(i * 10) * 2 - 1) * 300),
  duration_ms: 3000 + Math.round((sr(i * 510) * 2 - 1) * 1500),
  error_count: i === 2 ? 3 : i === 9 ? 1 : 0,
}));

// Simulate log lines
function genLogLines(pipelineId, status) {
  const ts = () => new Date().toISOString().slice(11, 19);
  return [
    `[${ts()}] INFO  Starting ${pipelineId}…`,
    `[${ts()}] INFO  Connecting to database…`,
    `[${ts()}] INFO  Fetching records batch 1/3…`,
    `[${ts()}] INFO  Processing 420 records…`,
    `[${ts()}] INFO  Batch 1/3 done.`,
    `[${ts()}] INFO  Fetching records batch 2/3…`,
    status === 'failed'
      ? `[${ts()}] ERROR Connection timeout after 30s — retrying once…`
      : `[${ts()}] INFO  Batch 2/3 done.`,
    `[${ts()}] INFO  Fetching records batch 3/3…`,
    `[${ts()}] INFO  Writing to pipeline_run_log…`,
    `[${ts()}] ${status === 'failed' ? 'ERROR Run FAILED — see error_count' : 'INFO  Run COMPLETE ✓'}`,
  ];
}

const MANUAL_FIELDS = [
  { key: 'pipeline_id',       label: 'Pipeline ID',          type: 'text',   defaultValue: 'custom-pipeline' },
  { key: 'label',             label: 'Label',                type: 'text',   defaultValue: 'Custom Pipeline' },
  { key: 'schedule',          label: 'Schedule',             type: 'text',   defaultValue: 'Manual' },
  { key: 'domain',            label: 'Domain',               type: 'text',   defaultValue: 'Custom' },
  { key: 'expected_duration_ms', label: 'Expected Duration (ms)', type: 'number', defaultValue: 3000 },
];

export default function PipelineDashboardPage() {
  const ctx = useTestData();
  const [pipelines, setPipelines]   = useState(DEFAULT_PIPELINES);
  const [stats, setStats]           = useState(DEMO_STATS);
  const [history, setHistory]       = useState(DEMO_HISTORY);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [triggering, setTriggering] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [successThreshold, setSuccessThreshold] = useState(90);
  const [durationThreshold, setDurationThreshold] = useState(10000);
  const [logLines, setLogLines]     = useState([]);
  const [logPipeline, setLogPipeline] = useState(null);
  const [showPiplineFilter, setShowPipelineFilter] = useState(new Set());
  const [inputOpen, setInputOpen]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const logRef = useRef(null);
  const autoRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, hi] = await Promise.all([
        axios.get(`${API}/api/v1/data-pipeline/dashboard`),
        axios.get(`${API}/api/v1/data-pipeline/history?limit=50`),
      ]);
      if (st.data?.total_runs_30d) setStats({ ...DEMO_STATS, ...st.data });
      if (hi.data?.runs?.length)   setHistory(hi.data.runs);
    } catch {}
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      autoRef.current = setInterval(load, 30000);
    } else {
      clearInterval(autoRef.current);
    }
    return () => clearInterval(autoRef.current);
  }, [autoRefresh, load]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const trigger = async (pipelineId) => {
    setTriggering(pipelineId);
    setLogPipeline(pipelineId);
    setLogLines([]);
    ctx.setPipelineTrigger(pipelineId);

    // Simulate log stream
    const fakeStatus = sr(_sc++) > 0.15 ? 'success' : 'failed';
    const lines = genLogLines(pipelineId, fakeStatus);
    for (let i = 0; i < lines.length; i++) {
      await new Promise(r => setTimeout(r, 350 + sr(_sc++) * 200));
      setLogLines(prev => [...prev, lines[i]]);
    }

    try {
      await axios.post(`${API}/api/v1/data-pipeline/${pipelineId}/trigger`);
    } catch {}

    // Add to history
    const newRun = {
      run_id: `run-${Date.now()}`, pipeline_id: pipelineId,
      started_at: new Date().toISOString(),
      status: fakeStatus,
      records_processed: Math.round(800 + sr(_sc++) * 600),
      duration_ms: Math.round(2000 + sr(_sc++) * 4000),
      error_count: fakeStatus === 'failed' ? 1 : 0,
    };
    setHistory(prev => [newRun, ...prev]);
    setTriggering(null);
  };

  const handleDataParsed = (rows) => {
    const parsed = rows.map(r => ({
      id: r.pipeline_id || r.id || `p-${Date.now()}`,
      label: r.label || r.pipeline_id || 'Custom',
      schedule: r.schedule || 'Manual',
      domain: r.domain || 'Custom',
      expectedMs: Number(r.expected_duration_ms || 3000),
    }));
    setPipelines(prev => {
      const ids = new Set(prev.map(p => p.id));
      return [...prev, ...parsed.filter(p => !ids.has(p.id))];
    });
  };

  // Compute live stats from history
  const filtHistBase = history.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (showPiplineFilter.size > 0 && !showPiplineFilter.has(r.pipeline_id)) return false;
    if (dateFrom && new Date(r.started_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.started_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });
  const liveSuccessRate = filtHistBase.length > 0
    ? (filtHistBase.filter(r=>r.status==='success').length / filtHistBase.length * 100).toFixed(1)
    : stats.success_rate_pct;
  const sortedDurations = [...filtHistBase].filter(r=>r.duration_ms).map(r=>r.duration_ms).sort((a,b)=>a-b);
  const liveP95 = sortedDurations.length > 0
    ? sortedDurations[Math.floor(sortedDurations.length * 0.95)]
    : stats.p95_duration_ms;
  const slowRuns = filtHistBase.filter(r => r.duration_ms > durationThreshold).length;

  // Area chart: runs per day
  const dayBuckets = {};
  history.forEach(r => {
    const day = r.started_at.slice(0, 10);
    if (!dayBuckets[day]) dayBuckets[day] = { day, success: 0, failed: 0, records: 0 };
    dayBuckets[day][r.status === 'success' ? 'success' : 'failed']++;
    dayBuckets[day].records += r.records_processed || 0;
  });
  const trendData = Object.values(dayBuckets).sort((a,b) => a.day.localeCompare(b.day)).slice(-14);

  // Per-pipeline last status
  const pipelineStatus = {};
  history.forEach(r => {
    if (!pipelineStatus[r.pipeline_id]) pipelineStatus[r.pipeline_id] = r;
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Pipeline Monitor</h1>
          <p style={{ color: T.sub, fontSize: 12, margin: '4px 0 0' }}>
            Trigger runs · Live log stream · Threshold alerts · pipeline_run_log · P95 latency · EP-D4
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ctx.dataLoadedAt && (
            <div style={{ fontSize: 11, color: T.amber, background: '#fffbeb', padding: '4px 10px',
              borderRadius: 6, border: '1px solid #fde68a', fontWeight: 600 }}>
              📊 Portfolio data loaded — BRSR Enrichment recommended
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.sub, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh (30s)
          </label>
          <span style={{ fontSize: 11, color: T.sub }}>{lastRefresh.toLocaleTimeString()}</span>
          <button onClick={load} disabled={loading} style={{
            padding: '7px 14px', background: T.navy, color: '#fff', border: 'none',
            borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1,
          }}>{loading ? '↻…' : '↻ Refresh'}</button>
        </div>
      </div>

      {/* Regulatory Context Bar */}
      <div style={{
        background: `${T.navy}08`, border: `1px solid ${T.navy}20`,
        borderLeft: `3px solid ${T.navy}`, borderRadius: 8,
        padding: '8px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>REGULATORY BASIS</span>
          {[
            { label: 'RBI Data Governance Guidelines 2021', color: T.navy },
            { label: 'SEBI BRSR Filing SLA Deadlines', color: T.amber },
            { label: 'PCAF WACI Data Lineage', color: T.blue },
          ].map(r => (
            <span key={r.label} style={{ fontSize: 10, fontWeight: 700, color: r.color,
              background: `${r.color}12`, border: `1px solid ${r.color}30`,
              borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{r.label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>METHOD</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>Pipeline Orchestration · Audit Lineage · P95 SLA Monitoring</span>
          <span style={{ fontSize: 9, color: T.sage, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3, padding: '1px 6px' }}>Live</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>PRIMARY USER</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, background: `${T.gold}22`, border: `1px solid ${T.gold}44`, borderRadius: 4, padding: '2px 8px' }}>Data Operations / Risk Technology</span>
        </div>
      </div>

      {/* Data Input Panel */}
      <DataUploadPanel
        isOpen={inputOpen}
        onToggle={() => setInputOpen(o => !o)}
        title={`Pipeline Configuration — ${pipelines.length} pipelines`}
        manualFields={MANUAL_FIELDS}
        csvTemplate="pipeline_id,label,schedule,domain,expected_duration_ms"
        onDataParsed={handleDataParsed}
      />

      {/* Alert Controls */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              Success Threshold: <strong style={{ color: Number(liveSuccessRate) < successThreshold ? T.red : T.green }}>{successThreshold}%</strong>
            </label>
            <input type="range" min={80} max={100} step={1} value={successThreshold}
              onChange={e => setSuccessThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.red }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              Duration Alert: <strong style={{ color: T.amber }}>{(durationThreshold/1000).toFixed(0)}s</strong>
            </label>
            <input type="range" min={1000} max={30000} step={500} value={durationThreshold}
              onChange={e => setDurationThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.amber }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: `1px solid ${T.border}`,
                fontSize: 12, color: T.navy, background: T.card, fontFamily: T.font }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: `1px solid ${T.border}`,
                fontSize: 12, color: T.navy, background: T.card, fontFamily: T.font }} />
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('all'); setShowPipelineFilter(new Set()); }} style={{
            padding: '8px 14px', background: T.card, color: T.sub, border: `1px solid ${T.border}`,
            borderRadius: 7, fontSize: 11, cursor: 'pointer',
          }}>Clear Filters</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Runs (30d)',      value: stats.total_runs_30d,              sub: '6 active pipelines',            color: T.navy  },
          { label: 'Live Success %',  value: `${liveSuccessRate}%`,             sub: Number(liveSuccessRate) < successThreshold ? '⚠ Below threshold' : '✓ OK', color: Number(liveSuccessRate) < successThreshold ? T.red : T.sage },
          { label: 'Avg Duration',    value: `${(stats.avg_duration_ms/1000).toFixed(1)}s`, sub: 'Mean run time',   color: T.amber },
          { label: 'P95 Duration',    value: `${(liveP95/1000).toFixed(1)}s`,   sub: 'Live from filtered history',    color: T.amber },
          { label: 'Slow Runs',       value: slowRuns,                          sub: `>${(durationThreshold/1000).toFixed(0)}s threshold`, color: slowRuns > 0 ? T.red : T.sage },
          { label: 'Records (30d)',   value: `${(stats.total_records_30d/1000).toFixed(0)}k`, sub: stats.data_source, color: T.gold },
        ].map((k, i) => (
          <div key={i} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            borderTop: `3px solid ${k.color}`, padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(27,58,92,0.06)',
          }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: k.label === 'Live Success %' && Number(liveSuccessRate) < successThreshold ? T.red : T.sage, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Trend Area */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
            Daily Run Volume — success vs failed (last 14 days)
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="success" stroke={T.sage}  fill={T.sage}  fillOpacity={0.25} stackId="a" name="Success" strokeWidth={1.5} />
              <Area type="monotone" dataKey="failed"  stroke={T.red}   fill={T.red}   fillOpacity={0.25} stackId="a" name="Failed"  strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Records vs Duration */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Records Processed vs Duration (daily)</div>
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={trendData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 8 }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 8 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar  yAxisId="left"  dataKey="records" fill={T.navy} name="Records" radius={[2,2,0,0]} opacity={0.8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline Health Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Pipeline Health Status</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {pipelines.map(p => (
              <button key={p.id} onClick={() => setShowPipelineFilter(prev => {
                const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n;
              })} style={{
                padding: '3px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                background: showPiplineFilter.has(p.id) ? T.navy : T.card,
                color: showPiplineFilter.has(p.id) ? '#fff' : T.sub,
                border: `1px solid ${showPiplineFilter.has(p.id) ? T.navy : T.border}`,
              }}>{p.label.split(' ')[0]}</button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {['Pipeline','Domain','Schedule','Last Status','Last Run','Records','Duration','Regulatory Impact','SLA Status','Trigger'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600,
                  color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pipelines.map((p, i) => {
              const pp = pipelineStatus[p.id];
              const sc = STATUS_COLOR[pp?.status] || T.sub;
              const durationAlert = pp?.duration_ms > durationThreshold;
              const rowTriggering = triggering === p.id;
              return (
                <tr key={p.id} style={{
                  background: rowTriggering ? '#f0f9ff' : i%2===0?'#fff':'#fafaf8',
                  borderBottom: `1px solid ${T.border}`,
                  outline: rowTriggering ? `2px solid ${T.blue}` : 'none',
                }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy }}>{p.label}</td>
                  <td style={{ padding: '8px 10px', color: T.sub, fontSize: 10 }}>{p.domain}</td>
                  <td style={{ padding: '8px 10px', color: T.sub, fontSize: 9 }}>{p.schedule}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {pp ? BADGE(pp.status, sc) : <span style={{ color: T.sub, fontSize: 10 }}>No runs</span>}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 10, color: T.sub }}>
                    {pp ? new Date(pp.started_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{pp?.records_processed?.toLocaleString() || '—'}</td>
                  <td style={{ padding: '8px 10px', color: durationAlert ? T.red : T.sub }}>
                    {pp?.duration_ms ? `${(pp.duration_ms/1000).toFixed(1)}s` : '—'}
                    {durationAlert && ' ⚠'}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 10, color: T.sub }}>
                    {({
                      'brsr-enrichment':    'SEBI BRSR Core P6 data freshness',
                      'iea-pathways-sync':  'TCFD Fwd Scenario / EP-D1 inputs',
                      'ngfs-seed':          'ECB/EBA scenario alignment / EP-D6',
                      'nature-risk-loader': 'TNFD / GBF Kunming-Montreal',
                      'pcaf-waci-calc':     'PCAF v2 WACI for BRSR/CSRD',
                      'regulatory-monitor': 'Multi-framework change alerts',
                    })[p.id] || '—'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {pp?.status === 'failed'
                      ? <span style={{ fontSize: 10, color: T.red, fontWeight: 700 }}>⚠ SLA BREACH RISK</span>
                      : pp?.status === 'success'
                      ? <span style={{ fontSize: 10, color: T.sage }}>✓ {
                          ({ 'brsr-enrichment': '24h', 'iea-pathways-sync': 'Weekly', 'ngfs-seed': 'On-deploy', 'nature-risk-loader': 'Weekly', 'pcaf-waci-calc': 'Daily', 'regulatory-monitor': 'Daily' })[p.id] || p.schedule
                        }</span>
                      : <span style={{ fontSize: 10, color: T.sub }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <button onClick={() => trigger(p.id)} disabled={!!triggering} style={{
                      fontSize: 10, padding: '4px 10px', borderRadius: 4, cursor: triggering ? 'not-allowed' : 'pointer',
                      background: rowTriggering ? T.blue : T.navy, color: '#fff', border: 'none', fontWeight: 600,
                      opacity: triggering && !rowTriggering ? 0.5 : 1,
                    }}>{rowTriggering ? '▶ Running…' : '▶ Trigger'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Log Viewer */}
      {logLines.length > 0 && (
        <div style={{ background: '#1e293b', border: `1px solid #334155`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            Live Log — {logPipeline}
            {triggering === logPipeline && (
              <span style={{ marginLeft: 8, fontSize: 10, color: '#60a5fa' }}>● RUNNING</span>
            )}
          </div>
          <div ref={logRef} style={{ maxHeight: 200, overflowY: 'auto', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.7 }}>
            {logLines.map((line, i) => (
              <div key={i} style={{
                color: line.includes('ERROR') ? '#f87171' : line.includes('COMPLETE') ? '#86efac' : '#94a3b8'
              }}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Run History Log */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Run History — pipeline_run_log
            <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>{filtHistBase.length} rows</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['all','success','failed','partial'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: statusFilter === s ? T.navy : T.card, color: statusFilter === s ? '#fff' : T.sub,
                border: `1px solid ${statusFilter === s ? T.navy : T.border}`,
              }}>{s}</button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {['Run ID','Pipeline','Started At','Status','Records','Duration','Errors','Alert'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600,
                  color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtHistBase.slice(0, 12).map((run, i) => (
              <tr key={run.run_id} style={{ background: i%2===0?'#fff':'#fafaf8', borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontSize: 9, color: T.blue, fontFamily: 'monospace' }}>
                  {run.run_id.slice(0, 10)}
                </td>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 600, fontSize: 10 }}>
                  {run.pipeline_id.replace(/-/g,' ')}
                </td>
                <td style={{ padding: '6px 10px', color: T.sub, fontSize: 10 }}>
                  {new Date(run.started_at).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', month:'short', day:'numeric' })}
                </td>
                <td style={{ padding: '6px 10px' }}>{BADGE(run.status, STATUS_COLOR[run.status] || T.sub)}</td>
                <td style={{ padding: '6px 10px', color: T.text }}>{run.records_processed?.toLocaleString()}</td>
                <td style={{ padding: '6px 10px', color: run.duration_ms > durationThreshold ? T.red : T.sub }}>
                  {run.duration_ms ? `${(run.duration_ms/1000).toFixed(1)}s` : '—'}
                </td>
                <td style={{ padding: '6px 10px', color: run.error_count > 0 ? T.red : T.sage, fontWeight: run.error_count > 0 ? 700 : 400 }}>
                  {run.error_count ?? 0}
                </td>
                <td style={{ padding: '6px 10px' }}>
                  {run.duration_ms > durationThreshold && <span style={{ fontSize: 9, color: T.amber }}>⚠ Slow</span>}
                  {run.status === 'failed' && <span style={{ fontSize: 9, color: T.red, marginLeft: 2 }}>✗ Failed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: T.sub, marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        pipeline_run_log · Live log simulation · Threshold alerts · Date range filter · Auto-refresh · data_pipeline_scheduler.py · EP-D4
      </div>
    </div>
  );
}
