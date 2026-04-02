import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Scheduler jobs ──────────────────────────────────────────────────────────
const SCHEDULES = [
  { id: 'J01', name: 'gleif_lei_full_sync',     cron: '0 2 * * 0',  interval: 'Weekly Sun 02:00',  source: 'GLEIF API',      priority: 'P1', avgDur: 312, lastStatus: 'success', records: 2_180_000 },
  { id: 'J02', name: 'gleif_lei_delta',          cron: '0 6 * * *',  interval: 'Daily 06:00',       source: 'GLEIF API',      priority: 'P1', avgDur: 48,  lastStatus: 'success', records: 4_200 },
  { id: 'J03', name: 'owid_co2_annual',          cron: '0 4 1 * *',  interval: 'Monthly 1st 04:00', source: 'OWID GitHub',    priority: 'P2', avgDur: 22,  lastStatus: 'success', records: 58_000 },
  { id: 'J04', name: 'owid_energy_mix',          cron: '0 4 2 * *',  interval: 'Monthly 2nd 04:00', source: 'OWID GitHub',    priority: 'P2', avgDur: 18,  lastStatus: 'success', records: 41_000 },
  { id: 'J05', name: 'yfinance_evic_batch',      cron: '30 18 * * 1-5', interval: 'Weekdays 18:30', source: 'yfinance',       priority: 'P1', avgDur: 195, lastStatus: 'success', records: 3_500 },
  { id: 'J06', name: 'yfinance_prices_daily',    cron: '0 22 * * 1-5',  interval: 'Weekdays 22:00', source: 'yfinance',       priority: 'P1', avgDur: 87,  lastStatus: 'success', records: 12_000 },
  { id: 'J07', name: 'bloomberg_esg_scores',     cron: '0 3 * * *',  interval: 'Daily 03:00',       source: 'Bloomberg BQL',  priority: 'P1', avgDur: 420, lastStatus: 'warning', records: 8_700 },
  { id: 'J08', name: 'msci_esg_ratings',         cron: '0 5 * * *',  interval: 'Daily 05:00',       source: 'MSCI API',       priority: 'P1', avgDur: 156, lastStatus: 'success', records: 6_200 },
  { id: 'J09', name: 'refinitiv_esg_delta',      cron: '30 4 * * *', interval: 'Daily 04:30',       source: 'Refinitiv DSS',  priority: 'P2', avgDur: 98,  lastStatus: 'success', records: 5_100 },
  { id: 'J10', name: 'sbti_targets_sync',        cron: '0 3 * * 1',  interval: 'Weekly Mon 03:00',  source: 'SBTi API',       priority: 'P2', avgDur: 35,  lastStatus: 'success', records: 9_300 },
  { id: 'J11', name: 'climate_trace_emissions',  cron: '0 2 1 * *',  interval: 'Monthly 1st 02:00', source: 'Climate TRACE',  priority: 'P2', avgDur: 280, lastStatus: 'failed',  records: 0 },
  { id: 'J12', name: 'ofac_sanctions_delta',     cron: '0 1 * * *',  interval: 'Daily 01:00',       source: 'OFAC SDN',       priority: 'P1', avgDur: 12,  lastStatus: 'success', records: 350 },
  { id: 'J13', name: 'un_sanctions_delta',       cron: '30 1 * * *', interval: 'Daily 01:30',       source: 'UN SC Lists',    priority: 'P1', avgDur: 9,   lastStatus: 'success', records: 120 },
  { id: 'J14', name: 'eu_taxonomy_sectors',      cron: '0 3 1 * *',  interval: 'Monthly 1st 03:00', source: 'EUR-Lex',        priority: 'P3', avgDur: 15,  lastStatus: 'success', records: 800 },
  { id: 'J15', name: 'issb_s2_disclosures',      cron: '0 5 * * 1',  interval: 'Weekly Mon 05:00',  source: 'IFRS Foundation',priority: 'P2', avgDur: 55,  lastStatus: 'success', records: 1_200 },
];

// ── GLEIF LEI entities ───────────────────────────────────────────────────────
const ENTITIES = Array.from({ length: 40 }, (_, i) => {
  const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'CH', 'NL', 'SE'];
  const types = ['LEGAL_ENTITY', 'FUND', 'BRANCH', 'SOLE_PROPRIETOR'];
  const statuses = ['ISSUED', 'ISSUED', 'ISSUED', 'LAPSED', 'PENDING_TRANSFER'];
  const categories = ['Corporate', 'Financial Institution', 'Fund', 'SPV', 'Branch'];
  const suffix = String.fromCharCode(65 + (i % 26));
  return {
    lei: `${('254900' + String(1e10 + i * 137).slice(1)).slice(0, 18)}00`,
    name: `Entity ${suffix}${i + 1} ${categories[i % 5]}`,
    country: countries[i % 10],
    type: types[i % 4],
    status: statuses[i % 5],
    category: categories[i % 5],
    regAuthority: `RA${String(500000 + Math.floor(sr(i + 10) * 9999)).slice(0, 6)}`,
    nextRenewal: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    lastUpdated: `2026-0${(i % 3) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    parent: i % 6 === 0 ? null : `Entity ${String.fromCharCode(65 + ((i - 1) % 26))}${i} Corporate`,
  };
});

// ── Run history (last 30 days) ────────────────────────────────────────────────
const RUN_HISTORY = Array.from({ length: 30 }, (_, d) => {
  const date = new Date('2026-04-01');
  date.setDate(date.getDate() - (29 - d));
  const total = 12 + Math.floor(sr(d) * 3);
  const failed = sr(d + 50) > 0.9 ? 1 : 0;
  const warning = sr(d + 100) > 0.85 ? 1 : 0;
  return {
    date: date.toISOString().slice(0, 10),
    success: total - failed - warning,
    warning,
    failed,
    totalRecords: Math.round((800_000 + sr(d + 200) * 400_000)),
  };
});

const STATUS_COLOR = { success: T.green, warning: T.amber, failed: T.red };
const PRIORITY_COLOR = { P1: T.red, P2: T.amber, P3: T.teal };

const pill = (label, color, bg) => (
  <span style={{ background: bg || color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

export default function DataHubIngesterPage() {
  const [tab, setTab] = useState(0);
  const [searchLei, setSearchLei] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const tabs = ['Scheduler Dashboard', 'GLEIF LEI Registry', 'Run History', 'Source Reference'];

  const filteredJobs = useMemo(() => SCHEDULES.filter(j => {
    if (filterStatus !== 'ALL' && j.lastStatus !== filterStatus) return false;
    if (filterPriority !== 'ALL' && j.priority !== filterPriority) return false;
    return true;
  }), [filterStatus, filterPriority]);

  const filteredEntities = useMemo(() => ENTITIES.filter(e =>
    searchLei === '' || e.lei.includes(searchLei.toUpperCase()) ||
    e.name.toLowerCase().includes(searchLei.toLowerCase())
  ), [searchLei]);

  const stats = useMemo(() => ({
    success: SCHEDULES.filter(j => j.lastStatus === 'success').length,
    warning: SCHEDULES.filter(j => j.lastStatus === 'warning').length,
    failed: SCHEDULES.filter(j => j.lastStatus === 'failed').length,
    totalRecords: SCHEDULES.reduce((s, j) => s + j.records, 0),
  }), []);

  const pieData = [
    { name: 'Success', value: stats.success },
    { name: 'Warning', value: stats.warning },
    { name: 'Failed', value: stats.failed },
  ];
  const pieColors = [T.green, T.amber, T.red];

  const sourceBreakdown = useMemo(() => {
    const map = {};
    SCHEDULES.forEach(j => { map[j.source] = (map[j.source] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
      padding: '14px 18px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BF1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Data Hub Ingester Monitor
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('APScheduler', T.teal)}
          {pill('15 Jobs', T.navy)}
          {pill('BaseIngester', T.purple)}
          {pill('GLEIF · OWID · yfinance', T.amber)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.teal : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Scheduler Dashboard ── */}
      {tab === 0 && (
        <div>
          {/* KPI row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {card('Total Jobs', 15, 'Registered in APScheduler')}
            {card('Successful', stats.success, 'Last run passed', T.green)}
            {card('Warning', stats.warning, 'Degraded / slow', T.amber)}
            {card('Failed', stats.failed, 'Needs attention', T.red)}
            {card('Records Today', (stats.totalRecords / 1e6).toFixed(2) + 'M', 'Across all sources')}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {['ALL', 'success', 'warning', 'failed'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                background: filterStatus === s ? (STATUS_COLOR[s] || T.navy) : '#fff',
                color: filterStatus === s ? '#fff' : T.slate,
                border: `1px solid ${STATUS_COLOR[s] || T.navy}44`,
                borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              }}>{s.toUpperCase()}</button>
            ))}
            <div style={{ width: 1, background: T.navy + '22' }} />
            {['ALL', 'P1', 'P2', 'P3'].map(p => (
              <button key={p} onClick={() => setFilterPriority(p)} style={{
                background: filterPriority === p ? (PRIORITY_COLOR[p] || T.navy) : '#fff',
                color: filterPriority === p ? '#fff' : T.slate,
                border: `1px solid ${PRIORITY_COLOR[p] || T.navy}44`,
                borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>

          {/* Jobs table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID','Job Name','Schedule','Source','Priority','Avg Dur (s)','Records','Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j, i) => (
                  <tr key={j.id} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, color: T.slate }}>{j.id}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>{j.name}</td>
                    <td style={{ padding: '9px 12px', color: T.slate }}>{j.interval}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(j.source, T.purple)}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(j.priority, PRIORITY_COLOR[j.priority])}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{j.avgDur}s</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{j.records.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(j.lastStatus.toUpperCase(), STATUS_COLOR[j.lastStatus])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pie + Source bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Last-Run Status Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Jobs by Data Source</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sourceBreakdown} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.teal} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: GLEIF LEI Registry ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input value={searchLei} onChange={e => setSearchLei(e.target.value)}
              placeholder="Search LEI or entity name…"
              style={{ flex: 1, maxWidth: 380, padding: '8px 12px', border: `1px solid ${T.navy}33`,
                borderRadius: 6, fontFamily: T.mono, fontSize: 12 }} />
            <div style={{ color: T.slate, fontSize: 12 }}>
              Showing {filteredEntities.length} of {ENTITIES.length} entities (sample — full sync: 2.18M)
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['LEI','Entity Name','Country','Type','Category','Status','Reg Authority','Next Renewal','Parent'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntities.map((e, i) => (
                  <tr key={e.lei} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10, color: T.teal }}>{e.lei}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{e.name}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{e.country}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10 }}>{e.type}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(e.category, T.purple)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {pill(e.status, e.status === 'ISSUED' ? T.green : e.status === 'LAPSED' ? T.red : T.amber)}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10 }}>{e.regAuthority}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10 }}>{e.nextRenewal}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: T.slate }}>{e.parent ? '✓ Has parent' : '— Root'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GLEIF stats */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {[
              { label: 'Total LEIs (Global)', value: '2.18M', sub: 'GLEIF full sync weekly' },
              { label: 'ISSUED', value: '1.84M', sub: '84.4% of total', color: T.green },
              { label: 'LAPSED', value: '0.29M', sub: '13.3% — renewal needed', color: T.amber },
              { label: 'Pending / Other', value: '0.05M', sub: '2.3% in transition', color: T.red },
              { label: 'Jurisdictions', value: '246', sub: 'Countries covered' },
            ].map(s => card(s.label, s.value, s.sub, s.color))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Run History ── */}
      {tab === 2 && (
        <div>
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>30-Day Job Run Outcomes</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={RUN_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: T.mono }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
                <Bar dataKey="success" stackId="a" fill={T.green} name="Success" />
                <Bar dataKey="warning" stackId="a" fill={T.amber} name="Warning" />
                <Bar dataKey="failed"  stackId="a" fill={T.red}   name="Failed"  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Daily Records Ingested (000s)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={RUN_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: T.mono }} interval={4} />
                <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'K'} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [(v / 1000).toFixed(1) + 'K', 'Records']} />
                <Line type="monotone" dataKey="totalRecords" stroke={T.teal} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {card('30-Day Runs', RUN_HISTORY.reduce((s, r) => s + r.success + r.warning + r.failed, 0).toLocaleString(), 'Total job executions')}
            {card('Success Rate', (RUN_HISTORY.reduce((s,r)=>s+r.success,0) / RUN_HISTORY.reduce((s,r)=>s+r.success+r.warning+r.failed,0) * 100).toFixed(1) + '%', 'Clean completions', T.green)}
            {card('Total Records', (RUN_HISTORY.reduce((s,r)=>s+r.totalRecords,0)/1e6).toFixed(1) + 'M', '30-day aggregate', T.teal)}
          </div>
        </div>
      )}

      {/* ── Tab 3: Source Reference ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                source: 'GLEIF API', code: 'BaseIngester → GleifIngester',
                endpoints: ['/api/v1/lei-records', '/api/v1/lei-records/{lei}', '/api/v1/autocomplete'],
                auth: 'None (public API)', rateLimit: '60 req/min',
                fields: ['LEI', 'legalName', 'jurisdiction', 'status', 'registration', 'relationships'],
                notes: 'Full sync weekly (2.18M records), delta daily via lastUpdated filter. Stored in gleif_lei table.',
                color: T.teal,
              },
              {
                source: 'OWID CO₂ Data', code: 'BaseIngester → OwIdCo2Ingester',
                endpoints: ['github.com/owid/co2-data/raw/master/owid-co2-data.csv'],
                auth: 'None (public GitHub)', rateLimit: 'No limit',
                fields: ['country','iso_code','year','co2','co2_per_capita','ghg_total','energy_per_capita','share_global_co2'],
                notes: 'Annual CSV download. ~58K rows (207 countries × 270 years). Stored in owid_co2_annual table.',
                color: T.green,
              },
              {
                source: 'yfinance EVIC', code: 'BaseIngester → YfinanceEvicIngester',
                endpoints: ['yfinance.Ticker.info', 'yfinance.Ticker.balance_sheet'],
                auth: 'None (Yahoo Finance API)', rateLimit: '~2000 req/hr',
                fields: ['marketCap','totalDebt','cashAndCashEquivalents','enterpriseValue','EVIC','shares_outstanding'],
                notes: 'EVIC = Market Cap + Total Debt + Minority Interest − Cash. Batch per 500 tickers. Weekday 18:30.',
                color: T.amber,
              },
              {
                source: 'Bloomberg BQL', code: 'BaseIngester → BloombergIngester',
                endpoints: ['BQL: data(univ, fields, dates)'],
                auth: 'Bloomberg Terminal API key (B-PIPE)', rateLimit: 'Per contract',
                fields: ['ESG_DISCLOSURE_SCORE','CARBON_EMISSIONS_SCOPE_1','CARBON_EMISSIONS_SCOPE_2','BOARD_INDEPENDENCE_PCT'],
                notes: 'Requires Bloomberg Terminal licence. Daily at 03:00. Uses bql Python library. P1 priority.',
                color: T.purple,
              },
              {
                source: 'MSCI ESG Ratings', code: 'BaseIngester → MsciIngester',
                endpoints: ['/esg/v1/issuers', '/esg/v1/issuers/{id}/history'],
                auth: 'OAuth 2.0 (client_credentials)', rateLimit: '1000 req/hr',
                fields: ['ivaRating','ivaScore','environmentPillar','socialPillar','governancePillar','controversyScore'],
                notes: 'Daily delta sync at 05:00. Full reload quarterly. Covers ~9,000 issuers. P1.',
                color: T.navy,
              },
              {
                source: 'APScheduler Config', code: 'apscheduler.schedulers.asyncio.AsyncIOScheduler',
                endpoints: ['N/A — in-process scheduler'],
                auth: 'N/A', rateLimit: 'N/A',
                fields: ['job_id','trigger','next_run_time','misfire_grace_time','max_instances','coalesce'],
                notes: 'Persistent job store via PostgreSQL JobStore. misfire_grace_time=3600s. All jobs use cron trigger.',
                color: T.slate,
              },
            ].map(src => (
              <div key={src.source} style={{ background: '#fff', borderRadius: 10,
                border: `2px solid ${src.color}33`, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, color: src.color, fontSize: 14 }}>{src.source}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.slate }}>{src.code}</div>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.slate }}>Endpoints: </span>
                  {src.endpoints.map(e => (
                    <div key={e} style={{ fontFamily: T.mono, fontSize: 10, color: src.color, marginLeft: 8 }}>{e}</div>
                  ))}
                </div>
                <div style={{ fontSize: 11, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: T.slate }}>Auth: </span>{src.auth}
                </div>
                <div style={{ fontSize: 11, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: T.slate }}>Rate Limit: </span>{src.rateLimit}
                </div>
                <div style={{ marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {src.fields.map(f => (
                    <span key={f} style={{ background: src.color + '15', color: src.color,
                      borderRadius: 3, padding: '1px 5px', fontSize: 10, fontFamily: T.mono }}>{f}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.slate, fontStyle: 'italic', lineHeight: 1.4 }}>{src.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
