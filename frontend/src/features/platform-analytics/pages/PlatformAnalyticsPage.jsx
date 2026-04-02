import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, ReferenceLine,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── 90-day usage time-series ──────────────────────────────────────────────────
const USAGE_90D = Array.from({ length: 90 }, (_, i) => {
  const date = new Date('2026-04-01'); date.setDate(date.getDate() - (89 - i));
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseUsers = isWeekend ? 12 : 42;
  const trend = i / 90 * 15;  // growing trend
  return {
    date: date.toISOString().slice(0, 10),
    dau: Math.max(1, Math.round(baseUsers + trend + (sr(i * 7) - 0.5) * 12)),
    apiCalls: Math.round((isWeekend ? 8000 : 28000) * (1 + trend/100) * (0.85 + sr(i*7+1)*0.3)),
    pageViews: Math.round((isWeekend ? 320 : 1240) * (1 + trend/100) * (0.9 + sr(i*7+2)*0.2)),
    p95Latency: Math.round(180 + sr(i*7+3)*140),
    errors: Math.round(sr(i*7+4) * 8),
  };
});

// ── Module adoption (top 25 modules by usage) ─────────────────────────────────
const MODULE_USAGE = [
  { module: 'Portfolio Manager',       code: 'EP-F1',  views: 4820, sessions: 1240, avgTime: 8.4, domain: 'Portfolio' },
  { module: 'ESG Screener',            code: 'EP-F2',  views: 3960, sessions: 980,  avgTime: 6.2, domain: 'ESG' },
  { module: 'Scenario Stress Tester',  code: 'EP-G2',  views: 3640, sessions: 890,  avgTime: 9.8, domain: 'Climate' },
  { module: 'SFDR v2 Reporting',       code: 'EP-AH2', views: 3120, sessions: 780,  avgTime: 7.1, domain: 'Regulatory' },
  { module: 'Carbon Budget Tracker',   code: 'EP-G3',  views: 2980, sessions: 720,  avgTime: 5.8, domain: 'Climate' },
  { module: 'CSRD/ESRS Automation',    code: 'EP-AH1', views: 2840, sessions: 690,  avgTime: 11.2,domain: 'Regulatory' },
  { module: 'Board Composition',       code: 'EP-AE1', views: 2620, sessions: 640,  avgTime: 4.9, domain: 'Governance' },
  { module: 'Greenium Signal Engine',  code: 'EP-BD1', views: 2480, sessions: 610,  avgTime: 7.6, domain: 'Quant' },
  { module: 'SBTi Registry',           code: 'EP-BG1', views: 2340, sessions: 580,  avgTime: 6.3, domain: 'Climate' },
  { module: 'PCAF Financed Emissions', code: 'EP-AJ1', views: 2180, sessions: 540,  avgTime: 8.9, domain: 'Climate' },
  { module: 'ESG Ratings Comparator',  code: 'EP-AK1', views: 2040, sessions: 510,  avgTime: 5.4, domain: 'ESG' },
  { module: 'Sanctions Watchlist',     code: 'EP-BG2', views: 1920, sessions: 480,  avgTime: 4.2, domain: 'Compliance' },
  { module: 'DME Financial Risk',      code: 'EP-BE1', views: 1840, sessions: 460,  avgTime: 10.1,domain: 'DME' },
  { module: 'Credit Risk Analytics',   code: 'EP-BI1', views: 1780, sessions: 440,  avgTime: 9.2, domain: 'Risk' },
  { module: 'Transition Plan Builder', code: 'EP-AL1', views: 1640, sessions: 410,  avgTime: 7.8, domain: 'Climate' },
  { module: 'XBRL Ingestion',          code: 'EP-BC2', views: 1520, sessions: 380,  avgTime: 5.1, domain: 'Data' },
  { module: 'PE Deal Pipeline',        code: 'EP-BB1', views: 1440, sessions: 360,  avgTime: 6.7, domain: 'Private Mkts' },
  { module: 'GLEIF LEI Registry',      code: 'EP-BF1', views: 1380, sessions: 340,  avgTime: 3.9, domain: 'Data' },
  { module: 'Physical Risk Pricing',   code: 'EP-36',  views: 1260, sessions: 310,  avgTime: 8.4, domain: 'Climate' },
  { module: 'Entity 360°',             code: 'EP-AY3', views: 1180, sessions: 290,  avgTime: 12.3,domain: 'AI/ML' },
].sort((a,b)=>b.views-a.views);

// ── API endpoint performance ──────────────────────────────────────────────────
const API_ENDPOINTS = [
  { endpoint: '/api/v1/portfolio/holdings',    calls: 48200, p50: 42,  p95: 180, p99: 340, errors: 12,  status: 'healthy' },
  { endpoint: '/api/v1/esg/scores',            calls: 38400, p50: 38,  p95: 165, p99: 290, errors: 8,   status: 'healthy' },
  { endpoint: '/api/v1/climate/emissions',     calls: 29800, p50: 55,  p95: 240, p99: 480, errors: 24,  status: 'healthy' },
  { endpoint: '/api/v1/scenario/run',          calls: 18200, p50: 180, p95: 820, p99: 1840,errors: 45,  status: 'degraded' },
  { endpoint: '/api/v1/dme/pd/calculate',      calls: 14600, p50: 92,  p95: 380, p99: 720, errors: 18,  status: 'healthy' },
  { endpoint: '/api/v1/reports/generate',      calls: 8400,  p50: 2400,p95: 8200,p99:14200,errors: 62,  status: 'degraded' },
  { endpoint: '/api/v1/gleif/lei-lookup',      calls: 22800, p50: 28,  p95: 98,  p99: 210, errors: 4,   status: 'healthy' },
  { endpoint: '/api/v1/sbti/targets',          calls: 9600,  p50: 45,  p95: 180, p99: 340, errors: 6,   status: 'healthy' },
  { endpoint: '/api/v1/sanctions/screen',      calls: 12400, p50: 62,  p95: 240, p99: 480, errors: 28,  status: 'healthy' },
  { endpoint: '/api/v1/auth/token',            calls: 68400, p50: 18,  p95: 72,  p99: 140, errors: 2,   status: 'healthy' },
];

// ── Domain breakdown ──────────────────────────────────────────────────────────
const DOMAIN_VIEWS = useMemo ? null : null;
const domainBreakdown = (() => {
  const map = {};
  MODULE_USAGE.forEach(m => { map[m.domain] = (map[m.domain]||0) + m.views; });
  return Object.entries(map).map(([d,v])=>({domain:d,views:v})).sort((a,b)=>b.views-a.views);
})();

const DOMAIN_PIE_COLORS = ['#1b3a5c','#0f766e','#15803d','#b45309','#6d28d9','#b91c1c','#0284c7','#9333ea','#dc2626','#0891b2'];

const pill = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

const card = (label, value, sub, color = T.navy) => (
  <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

const STATUS_COLOR = { healthy: T.green, degraded: T.amber, down: T.red };

// Computed weekly rollup from 90d
const WEEKLY = Array.from({ length: 13 }, (_, w) => {
  const slice = USAGE_90D.slice(w * 7, (w+1) * 7);
  return {
    week: `W${w+1}`,
    dau: Math.round(slice.reduce((s,d)=>s+d.dau,0)/slice.length),
    apiCalls: slice.reduce((s,d)=>s+d.apiCalls,0),
    errors: slice.reduce((s,d)=>s+d.errors,0),
  };
});

export default function PlatformAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState(30);

  const tabs = ['Usage Overview', 'Module Adoption', 'API Performance', 'System Health'];

  const slicedUsage = useMemo(() => USAGE_90D.slice(90 - range), [range]);

  const totalDau    = Math.round(slicedUsage.reduce((s,d)=>s+d.dau,0)/slicedUsage.length);
  const totalApi    = slicedUsage.reduce((s,d)=>s+d.apiCalls,0);
  const totalErrors = slicedUsage.reduce((s,d)=>s+d.errors,0);
  const avgLatency  = Math.round(slicedUsage.reduce((s,d)=>s+d.p95Latency,0)/slicedUsage.length);
  const errorRate   = (totalErrors / totalApi * 100).toFixed(3);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.purple, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BI2</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Platform Analytics Dashboard
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('~283 Modules', T.navy)}
          {pill('90-Day Trend', T.teal)}
          {pill('10 API Endpoints', T.green)}
          {pill('DAU · API · Latency', T.amber)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.purple : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Usage Overview ── */}
      {tab === 0 && (
        <div>
          {/* Range selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[7, 14, 30, 60, 90].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                background: range === r ? T.purple : '#fff', color: range === r ? '#fff' : T.slate,
                border: `1px solid ${T.purple}44`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
              }}>{r}d</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Avg DAU', totalDau, `Over last ${range} days`)}
            {card('Total API Calls', (totalApi/1000).toFixed(0)+'K', `Last ${range} days`, T.teal)}
            {card('Error Rate', errorRate + '%', 'API errors / total calls', totalErrors > 50 ? T.amber : T.green)}
            {card('Avg P95 Latency', avgLatency + 'ms', 'API response time', avgLatency > 400 ? T.amber : T.green)}
            {card('Active Modules', '~283', 'Routed in App.js', T.navy)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Daily Active Users — {range}-day window</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={slicedUsage}>
                <defs>
                  <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.purple} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: T.mono }} interval={Math.floor(range/8)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="dau" stroke={T.purple} strokeWidth={2}
                  fill="url(#dauGrad)" name="DAU" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>API Calls per Day</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={slicedUsage.filter((_,i)=>i%Math.max(1,Math.floor(range/20))===0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: T.mono }} interval={0} />
                  <YAxis tickFormatter={v=>(v/1000).toFixed(0)+'K'} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v=>[(v/1000).toFixed(1)+'K','API Calls']} />
                  <Bar dataKey="apiCalls" fill={T.teal} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>P95 API Latency (ms)</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={slicedUsage.filter((_,i)=>i%Math.max(1,Math.floor(range/20))===0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: T.mono }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v=>[v+'ms','P95 Latency']} />
                  <ReferenceLine y={400} stroke={T.amber} strokeDasharray="4 2" label={{ value:'SLA 400ms', fontSize:9, fill:T.amber }} />
                  <Line type="monotone" dataKey="p95Latency" stroke={T.amber} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Module Adoption ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Module Views', MODULE_USAGE.reduce((s,m)=>s+m.views,0).toLocaleString(), 'Top 20 modules (90d)')}
            {card('Avg Session Time', (MODULE_USAGE.reduce((s,m)=>s+m.avgTime,0)/MODULE_USAGE.length).toFixed(1)+'min', 'Across top modules', T.teal)}
            {card('Top Module', 'Portfolio Manager', '4,820 views / 90d', T.navy)}
            {card('Highest Engagement', 'Entity 360°', '12.3 min avg session', T.purple)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top 20 Modules by Page Views (90d)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={MODULE_USAGE} layout="vertical" margin={{ left: 180 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="module" tick={{ fontSize: 10, fontFamily: T.mono }} width={180} />
                <Tooltip formatter={v=>[v.toLocaleString(),'Views']} />
                <Bar dataKey="views" fill={T.navy} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Views by Domain</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={domainBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="views"
                    label={({ domain, percent }) => `${domain} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {domainBreakdown.map((_,i) => <Cell key={i} fill={DOMAIN_PIE_COLORS[i%DOMAIN_PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v=>[v.toLocaleString(),'Views']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Avg Session Time by Module (min)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...MODULE_USAGE].sort((a,b)=>b.avgTime-a.avgTime).slice(0,10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 9, fontFamily: T.mono }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v=>[v+'min','Avg Time']} />
                  <Bar dataKey="avgTime" fill={T.teal} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: API Performance ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Endpoints Monitored', API_ENDPOINTS.length, 'Core API routes')}
            {card('Healthy', API_ENDPOINTS.filter(e=>e.status==='healthy').length, 'Within SLA', T.green)}
            {card('Degraded', API_ENDPOINTS.filter(e=>e.status==='degraded').length, 'P95 > 500ms', T.amber)}
            {card('Total Calls (90d)', (API_ENDPOINTS.reduce((s,e)=>s+e.calls,0)/1000).toFixed(0)+'K', 'All endpoints')}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Endpoint','Calls (90d)','P50 (ms)','P95 (ms)','P99 (ms)','Errors','Error %','Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {API_ENDPOINTS.sort((a,b)=>b.calls-a.calls).map((e, i) => (
                  <tr key={e.endpoint} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontSize: 10, color: T.teal }}>{e.endpoint}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{e.calls.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right', color: T.green }}>{e.p50}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right',
                      color: e.p95 > 500 ? T.amber : T.slate }}>{e.p95}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right',
                      color: e.p99 > 2000 ? T.red : T.slate }}>{e.p99}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{e.errors}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right',
                      color: e.errors/e.calls > 0.001 ? T.amber : T.green }}>
                      {(e.errors / e.calls * 100).toFixed(3)}%
                    </td>
                    <td style={{ padding: '9px 12px' }}>{pill(e.status.toUpperCase(), STATUS_COLOR[e.status])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>P95 Latency by Endpoint</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={API_ENDPOINTS.sort((a,b)=>b.p95-a.p95)} layout="vertical" margin={{ left: 260 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="endpoint" tick={{ fontSize: 9, fontFamily: T.mono }} width={260} />
                <Tooltip formatter={v=>[v+'ms','P95']} />
                <ReferenceLine x={500} stroke={T.amber} strokeDasharray="4 2" />
                <Bar dataKey="p95" radius={[0,3,3,0]}>
                  {API_ENDPOINTS.sort((a,b)=>b.p95-a.p95).map((e,i) => (
                    <Cell key={i} fill={e.p95 > 500 ? T.amber : T.teal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 3: System Health ── */}
      {tab === 3 && (
        <div>
          {/* Status indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { service: 'FastAPI Backend',      status: 'operational', uptime: '99.98%', latency: '42ms' },
              { service: 'Supabase PostgreSQL',   status: 'operational', uptime: '99.95%', latency: '8ms'  },
              { service: 'Supabase Auth',         status: 'operational', uptime: '99.99%', latency: '18ms' },
              { service: 'APScheduler Jobs',      status: 'degraded',    uptime: '99.20%', latency: 'N/A'  },
              { service: 'GLEIF API (external)',   status: 'operational', uptime: '99.80%', latency: '85ms' },
              { service: 'OWID GitHub (external)', status: 'operational', uptime: '99.90%', latency: '120ms'},
              { service: 'Climate TRACE API',     status: 'down',        uptime: '87.40%', latency: 'N/A'  },
              { service: 'Bloomberg BQL',         status: 'operational', uptime: '99.75%', latency: '420ms'},
            ].map(s => (
              <div key={s.service} style={{ background: '#fff', borderRadius: 8,
                border: `2px solid ${STATUS_COLOR[s.status]}44`, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{s.service}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%',
                    background: STATUS_COLOR[s.status], display: 'inline-block' }} />
                </div>
                <div style={{ fontSize: 11, color: T.slate }}>Uptime: <strong>{s.uptime}</strong></div>
                <div style={{ fontSize: 11, color: T.slate }}>Latency: <strong>{s.latency}</strong></div>
                <div style={{ marginTop: 6 }}>{pill(s.status.toUpperCase(), STATUS_COLOR[s.status])}</div>
              </div>
            ))}
          </div>

          {/* Weekly trend */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Weekly API Volume & Error Count (13 weeks)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis yAxisId="left"  tickFormatter={v=>(v/1000).toFixed(0)+'K'} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left"  dataKey="apiCalls" name="API Calls" fill={T.teal} opacity={0.8} radius={[3,3,0,0]} />
                <Bar yAxisId="right" dataKey="errors"   name="Errors"   fill={T.red}  opacity={0.9} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.amber+'12', border:`1px solid ${T.amber}44`, borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontWeight:700, color:T.amber, marginBottom:6 }}>⚠ Active Alerts</div>
            <ul style={{ margin:0, paddingLeft:18 }}>
              <li style={{ fontSize:12, color:T.slate, marginBottom:4 }}><strong>Climate TRACE API</strong> — authentication token expired. Ingester J11 last succeeded never. Action: renew API key at climatetrace.org/dashboard</li>
              <li style={{ fontSize:12, color:T.slate, marginBottom:4 }}><strong>APScheduler</strong> — job J07 (bloomberg_esg_scores) completed with WARNING status. P95 latency 420ms exceeds 300ms threshold. Monitor for SLA breach.</li>
              <li style={{ fontSize:12, color:T.slate }}><strong>Report Generation</strong> — /api/v1/reports/generate P99 at 14,200ms. Consider async queue for large PDF exports (Celery task + presigned S3 URL callback).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
