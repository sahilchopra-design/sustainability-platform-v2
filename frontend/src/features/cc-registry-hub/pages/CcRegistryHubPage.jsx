import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669' };
const fmt = (n, d = 1) => n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`;

const REGISTRIES = [
  { id: 'verra', name: 'Verra (VCS)', short: 'Verra', color: '#0f766e', url: 'verra.org' },
  { id: 'gs', name: 'Gold Standard', short: 'GS', color: '#b45309', url: 'goldstandard.org' },
  { id: 'acr', name: 'American Carbon Registry', short: 'ACR', color: '#6d28d9', url: 'americancarbonregistry.org' },
  { id: 'puro', name: 'Puro.earth', short: 'Puro', color: '#0369a1', url: 'puro.earth' },
  { id: 'iso', name: 'Isometric', short: 'Iso', color: '#059669', url: 'isometric.com' },
  { id: 'car', name: 'Climate Action Reserve', short: 'CAR', color: '#c2410c', url: 'climateactionreserve.org' },
];

const METHODOLOGIES = [
  'REDD+', 'Improved Forest Mgmt', 'Renewable Energy', 'Cookstoves', 'Methane Capture',
  'Blue Carbon', 'Soil Carbon', 'Biochar', 'Direct Air Capture', 'Enhanced Weathering',
  'Industrial Gas', 'Energy Efficiency', 'Avoided Deforestation', 'Agroforestry', 'Peatland Restoration'
];

const PROJECTS = Array.from({ length: 15 }, (_, i) => ({
  id: `PRJ-${5000 + i * 113}`,
  name: [
    'Madre de Dios REDD+', 'Rimba Raya Biodiversity', 'Alto Mayo Forest', 'Kariba REDD+',
    'Kenya Biogas Programme', 'India Solar Rooftop', 'BC Forest Offset', 'Blue Carbon Senegal',
    'Nordic Biochar CDR', 'Iceland DAC Alpha', 'Swiss Enhanced Weather.', 'Ghana Biomass Energy',
    'Vietnam Mangrove Restore', 'UK Peatland Programme', 'Chile Wind Corridor'
  ][i],
  registry: REGISTRIES[i % 6].short,
  registry_id: REGISTRIES[i % 6].id,
  methodology: METHODOLOGIES[i % METHODOLOGIES.length],
  country: ['Peru', 'Indonesia', 'Peru', 'Zimbabwe', 'Kenya', 'India', 'Canada', 'Senegal',
    'Finland', 'Iceland', 'Switzerland', 'Ghana', 'Vietnam', 'UK', 'Chile'][i],
  issued: Math.round((5 + sr(i * 7) * 45) * 1e6),
  retired: Math.round((2 + sr(i * 11) * 25) * 1e6),
  vintage: 2018 + Math.floor(sr(i * 13) * 7),
  status: i < 12 ? 'Active' : i < 14 ? 'Under Review' : 'Suspended',
}));

const REGISTRY_DETAILS = REGISTRIES.map((r, i) => ({
  ...r,
  issued_total: Math.round((100 + sr(i * 7) * 1700) * 1e6),
  retired_total: Math.round((50 + sr(i * 11) * 800) * 1e6),
  active_projects: Math.round(50 + sr(i * 13) * 2000),
  methodologies: Math.round(5 + sr(i * 17) * 30),
  countries: Math.round(10 + sr(i * 19) * 80),
  reg_fee: +(500 + sr(i * 23) * 4500).toFixed(0),
  issuance_fee: +(0.05 + sr(i * 29) * 0.25).toFixed(2),
  retirement_fee: +(0.02 + sr(i * 31) * 0.10).toFixed(2),
  avg_timeline_days: Math.round(30 + sr(i * 37) * 180),
  buffer_pool_pct: +(5 + sr(i * 41) * 25).toFixed(1),
}));
REGISTRY_DETAILS[0].issued_total = 1820e6; REGISTRY_DETAILS[0].retired_total = 910e6; REGISTRY_DETAILS[0].active_projects = 2140;
REGISTRY_DETAILS[1].issued_total = 260e6; REGISTRY_DETAILS[1].retired_total = 148e6; REGISTRY_DETAILS[1].active_projects = 320;

// API Health
const API_STATUS = REGISTRIES.map((r, i) => ({
  registry: r.short,
  registry_id: r.id,
  color: r.color,
  status: sr(i * 7) > 0.15 ? 'Connected' : 'Degraded',
  last_sync: `2024-03-${String(28 - Math.floor(sr(i * 11) * 5)).padStart(2, '0')} ${String(8 + Math.floor(sr(i * 13) * 14)).padStart(2, '0')}:${String(Math.floor(sr(i * 17) * 59)).padStart(2, '0')}`,
  pending_ops: Math.round(sr(i * 19) * 12),
  error_count_24h: Math.round(sr(i * 23) * 8),
  latency_ms: Math.round(80 + sr(i * 29) * 400),
  uptime_pct: +(97 + sr(i * 31) * 3).toFixed(2),
  rate_limit_remaining: Math.round(500 + sr(i * 37) * 4500),
}));

// Verra workflow steps
const VERRA_WORKFLOW = [
  { step: 1, name: 'Project Design Document', duration: '30-60 days', status: 'Required' },
  { step: 2, name: 'Validation (3rd Party)', duration: '60-120 days', status: 'Required' },
  { step: 3, name: 'VCS Registration', duration: '15-30 days', status: 'Required' },
  { step: 4, name: 'Monitoring Report', duration: '30-90 days', status: 'Required' },
  { step: 5, name: 'Verification (3rd Party)', duration: '45-90 days', status: 'Required' },
  { step: 6, name: 'Credit Issuance', duration: '5-15 days', status: 'Final' },
  { step: 7, name: 'Retirement / Transfer', duration: '1-5 days', status: 'On-demand' },
];

const GS_WORKFLOW = [
  { step: 1, name: 'Preliminary Review', duration: '10-20 days', status: 'Required' },
  { step: 2, name: 'Design Certification', duration: '40-90 days', status: 'Required' },
  { step: 3, name: 'Performance Review', duration: '30-60 days', status: 'Required' },
  { step: 4, name: 'Issuance Certification', duration: '15-30 days', status: 'Required' },
  { step: 5, name: 'Credit Issuance', duration: '5-10 days', status: 'Final' },
  { step: 6, name: 'Retirement', duration: '1-3 days', status: 'On-demand' },
];

const PURO_WORKFLOW = [
  { step: 1, name: 'Supplier Application', duration: '5-10 days', status: 'Required' },
  { step: 2, name: 'Methodology Compliance', duration: '20-45 days', status: 'Required' },
  { step: 3, name: 'Third-Party Audit', duration: '30-60 days', status: 'Required' },
  { step: 4, name: 'CORC Issuance', duration: '5-15 days', status: 'Final' },
  { step: 5, name: 'Retirement / Transfer', duration: '1-3 days', status: 'On-demand' },
];

const ERROR_LOG = Array.from({ length: 8 }, (_, i) => ({
  id: `ERR-${600 + i}`,
  registry: REGISTRIES[i % 6].short,
  timestamp: `2024-03-${String(25 + Math.floor(sr(i * 7) * 4)).padStart(2, '0')} ${String(8 + Math.floor(sr(i * 11) * 14)).padStart(2, '0')}:${String(Math.floor(sr(i * 13) * 59)).padStart(2, '0')}`,
  type: ['Timeout', 'Auth Failure', '429 Rate Limit', 'Parse Error', 'Network Error', 'Schema Mismatch', 'Timeout', '500 Server Error'][i],
  endpoint: ['/api/v1/retirements', '/api/v1/projects', '/api/v2/credits', '/api/v1/issuance', '/api/v1/sync', '/api/v1/registry', '/api/v1/status', '/api/v1/batch'][i],
  severity: i < 3 ? 'Warning' : i < 6 ? 'Error' : 'Critical',
  resolved: i < 5,
}));

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{ background: color || T.gray, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{text}</span>
);

const WorkflowTable = ({ steps, color }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
    <thead>
      <tr style={{ background: color || T.navy, color: '#fff' }}>
        {['Step', 'Name', 'Duration', 'Status'].map(h => (
          <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {steps.map((s, i) => (
        <tr key={s.step} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
          <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{s.step}</td>
          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{s.name}</td>
          <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{s.duration}</td>
          <td style={{ padding: '6px 10px' }}>
            <Badge text={s.status} color={s.status === 'Required' ? T.navy : s.status === 'Final' ? T.emerald : T.gold} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default function CcRegistryHubPage() {
  const [tab, setTab] = useState('Registry Overview');
  const [selectedRegistry, setSelectedRegistry] = useState('verra');

  const TABS = ['Registry Overview', 'Verra VCS Panel', 'Gold Standard Panel', 'Puro & Isometric Panel', 'Cross-Registry Analytics', 'API Health & Sync'];

  const totalIssued = useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.issued_total, 0), []);
  const totalRetired = useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.retired_total, 0), []);
  const totalProjects = useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.active_projects, 0), []);

  const portfolioByRegistry = useMemo(() => REGISTRY_DETAILS.map(r => ({
    name: r.short,
    value: r.issued_total,
    color: r.color,
  })), []);

  const methodologyCoverage = useMemo(() => METHODOLOGIES.slice(0, 8).map((m, i) => ({
    methodology: m.length > 15 ? m.slice(0, 14) + '..' : m,
    verra: Math.round(sr(i * 7) > 0.3 ? 10 + sr(i * 11) * 90 : 0),
    gs: Math.round(sr(i * 13) > 0.4 ? 10 + sr(i * 17) * 70 : 0),
    acr: Math.round(sr(i * 19) > 0.5 ? 10 + sr(i * 23) * 50 : 0),
    puro: Math.round(sr(i * 29) > 0.6 ? 10 + sr(i * 31) * 40 : 0),
  })), []);

  const feeComparison = useMemo(() => REGISTRY_DETAILS.map(r => ({
    registry: r.short,
    reg_fee: r.reg_fee,
    issuance_fee: r.issuance_fee * 10000,
    retirement_fee: r.retirement_fee * 10000,
    timeline: r.avg_timeline_days,
  })), []);

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BV3</span>
          <span style={{ fontSize: 11, color: T.teal, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>CARBON CREDITS . REGISTRY</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Registry Integration Hub</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Verra . Gold Standard . ACR . Puro . Isometric . CAR . Cross-registry analytics . API health monitoring</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {/* ─── TAB 1: REGISTRY OVERVIEW ─── */}
      {tab === 'Registry Overview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Total Registries" value={REGISTRIES.length} color={T.navy} />
            <Kpi label="Total Issued" value={`${fmt(totalIssued)} tCO2e`} sub="All registries" color={T.teal} />
            <Kpi label="Total Retired" value={`${fmt(totalRetired)} tCO2e`} sub={`${(totalRetired / totalIssued * 100).toFixed(0)}% rate`} color={T.emerald} />
            <Kpi label="Active Projects" value={totalProjects.toLocaleString()} color={T.gold} />
          </div>

          <Section title="Registry Comparison" badge="Fees & Timelines">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Registry', 'Issued', 'Retired', 'Projects', 'Methodologies', 'Countries', 'Reg Fee', 'Issuance $/t', 'Retire $/t', 'Avg Timeline', 'Buffer Pool'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGISTRY_DETAILS.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: r.color }}>{r.short}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{fmt(r.issued_total)}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{fmt(r.retired_total)}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{r.active_projects.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{r.methodologies}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{r.countries}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>${r.reg_fee.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>${r.issuance_fee}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>${r.retirement_fee}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{r.avg_timeline_days}d</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{r.buffer_pool_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Projects Across Registries" badge={`${PROJECTS.length} projects`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'Project', 'Registry', 'Methodology', 'Country', 'Issued', 'Retired', 'Vintage', 'Status'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECTS.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{p.id}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px 10px' }}><Badge text={p.registry} color={REGISTRIES.find(r => r.short === p.registry)?.color} /></td>
                    <td style={{ padding: '6px 10px', fontSize: 10 }}>{p.methodology}</td>
                    <td style={{ padding: '6px 10px' }}>{p.country}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(p.issued)}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(p.retired)}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{p.vintage}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <Badge text={p.status} color={p.status === 'Active' ? T.emerald : p.status === 'Under Review' ? T.orange : T.red} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {/* ─── TAB 2: VERRA VCS PANEL ─── */}
      {tab === 'Verra VCS Panel' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="VCS Issued" value={`${fmt(REGISTRY_DETAILS[0].issued_total)} tCO2e`} color={REGISTRIES[0].color} />
            <Kpi label="VCS Retired" value={`${fmt(REGISTRY_DETAILS[0].retired_total)} tCO2e`} color={T.emerald} />
            <Kpi label="Active Projects" value={REGISTRY_DETAILS[0].active_projects.toLocaleString()} color={T.navy} />
            <Kpi label="Buffer Pool" value={`${REGISTRY_DETAILS[0].buffer_pool_pct}%`} color={T.orange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="VCS Registration Workflow" badge="7 Steps">
              <WorkflowTable steps={VERRA_WORKFLOW} color={REGISTRIES[0].color} />
            </Section>

            <Section title="VCS Fee Structure">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Registration Fee</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>${REGISTRY_DETAILS[0].reg_fee.toLocaleString()}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Issuance Levy</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>${REGISTRY_DETAILS[0].issuance_fee}/t</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Retirement Fee</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>${REGISTRY_DETAILS[0].retirement_fee}/t</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Avg Timeline</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>{REGISTRY_DETAILS[0].avg_timeline_days}d</div>
                </div>
              </div>
            </Section>
          </div>

          <Section title="VCS Projects in Portfolio">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: REGISTRIES[0].color, color: '#fff' }}>
                  {['ID', 'Project', 'Methodology', 'Country', 'Issued', 'Status'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECTS.filter(p => p.registry === 'Verra').map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{p.id}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.methodology}</td>
                    <td style={{ padding: '6px 10px' }}>{p.country}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(p.issued)}</td>
                    <td style={{ padding: '6px 10px' }}><Badge text={p.status} color={p.status === 'Active' ? T.emerald : T.orange} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {/* ─── TAB 3: GOLD STANDARD PANEL ─── */}
      {tab === 'Gold Standard Panel' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="GS Issued" value={`${fmt(REGISTRY_DETAILS[1].issued_total)} tCO2e`} color={REGISTRIES[1].color} />
            <Kpi label="GS Retired" value={`${fmt(REGISTRY_DETAILS[1].retired_total)} tCO2e`} color={T.emerald} />
            <Kpi label="Active Projects" value={REGISTRY_DETAILS[1].active_projects.toLocaleString()} color={T.navy} />
            <Kpi label="Buffer Pool" value={`${REGISTRY_DETAILS[1].buffer_pool_pct}%`} color={T.orange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Gold Standard Certification Workflow" badge="6 Steps">
              <WorkflowTable steps={GS_WORKFLOW} color={REGISTRIES[1].color} />
            </Section>

            <Section title="GS Fee Structure">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Registration Fee</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>${REGISTRY_DETAILS[1].reg_fee.toLocaleString()}</div>
                </div>
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Issuance Levy</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>${REGISTRY_DETAILS[1].issuance_fee}/t</div>
                </div>
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Retirement Fee</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>${REGISTRY_DETAILS[1].retirement_fee}/t</div>
                </div>
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Avg Timeline</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: 'JetBrains Mono, monospace' }}>{REGISTRY_DETAILS[1].avg_timeline_days}d</div>
                </div>
              </div>
            </Section>
          </div>

          <Section title="Gold Standard Projects in Portfolio">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: REGISTRIES[1].color, color: '#fff' }}>
                  {['ID', 'Project', 'Methodology', 'Country', 'Issued', 'Status'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECTS.filter(p => p.registry === 'GS').map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{p.id}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.methodology}</td>
                    <td style={{ padding: '6px 10px' }}>{p.country}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(p.issued)}</td>
                    <td style={{ padding: '6px 10px' }}><Badge text={p.status} color={p.status === 'Active' ? T.emerald : T.orange} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {/* ─── TAB 4: PURO & ISOMETRIC PANEL ─── */}
      {tab === 'Puro & Isometric Panel' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Puro Issued" value={`${fmt(REGISTRY_DETAILS[3].issued_total)} tCO2e`} color={REGISTRIES[3].color} />
            <Kpi label="Isometric Issued" value={`${fmt(REGISTRY_DETAILS[4].issued_total)} tCO2e`} color={REGISTRIES[4].color} />
            <Kpi label="CDR Focus" value="Biochar, DAC, EW" sub="Carbon Dioxide Removal" color={T.navy} />
            <Kpi label="Combined Projects" value={REGISTRY_DETAILS[3].active_projects + REGISTRY_DETAILS[4].active_projects} color={T.gold} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Puro.earth CORC Workflow" badge="5 Steps">
              <WorkflowTable steps={PURO_WORKFLOW} color={REGISTRIES[3].color} />
            </Section>

            <Section title="Isometric Credits (ICR) Process">
              <div style={{ fontSize: 12, color: T.gray, lineHeight: 1.8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px' }}>
                  {[
                    ['1. Application', 'Supplier submits CDR methodology documentation'],
                    ['2. Science Review', 'Independent scientific panel evaluation (30-60d)'],
                    ['3. MRV Verification', 'Measurement, Reporting & Verification audit'],
                    ['4. ICR Issuance', 'Isometric Carbon Removal credits issued'],
                    ['5. Retirement', 'On-demand credit retirement with chain-of-custody'],
                  ].map(([step, desc]) => (
                    <React.Fragment key={step}>
                      <div style={{ fontWeight: 700, color: T.navy, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{step}</div>
                      <div>{desc}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          <Section title="CDR Methodology Comparison">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Methodology', 'Registry', 'Permanence', 'Scalability', 'Cost Range', 'MRV Maturity'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { method: 'Biochar', registry: 'Puro', perm: '100+ years', scale: 'Medium', cost: '$80-200/t', mrv: 'Established' },
                  { method: 'Direct Air Capture', registry: 'Isometric', perm: '1000+ years', scale: 'High (future)', cost: '$400-1000/t', mrv: 'Emerging' },
                  { method: 'Enhanced Weathering', registry: 'Isometric', perm: '10000+ years', scale: 'High', cost: '$50-200/t', mrv: 'Early' },
                  { method: 'Bio-oil Sequestration', registry: 'Puro', perm: '1000+ years', scale: 'Medium', cost: '$150-400/t', mrv: 'Emerging' },
                  { method: 'Ocean Alkalinity', registry: 'Isometric', perm: '10000+ years', scale: 'High (future)', cost: '$100-300/t', mrv: 'Early' },
                ].map((m, i) => (
                  <tr key={m.method} style={{ background: i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: T.navy }}>{m.method}</td>
                    <td style={{ padding: '6px 10px' }}><Badge text={m.registry} color={m.registry === 'Puro' ? REGISTRIES[3].color : REGISTRIES[4].color} /></td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{m.perm}</td>
                    <td style={{ padding: '6px 10px' }}>{m.scale}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{m.cost}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <Badge text={m.mrv} color={m.mrv === 'Established' ? T.emerald : m.mrv === 'Emerging' ? T.orange : T.purple} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {/* ─── TAB 5: CROSS-REGISTRY ANALYTICS ─── */}
      {tab === 'Cross-Registry Analytics' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Portfolio by Registry">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={portfolioByRegistry} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {portfolioByRegistry.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${fmt(v)} tCO2e`} />
                </PieChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Methodology Coverage by Registry" badge="Projects">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={methodologyCoverage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="methodology" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="verra" name="Verra" fill={REGISTRIES[0].color} stackId="s" />
                  <Bar dataKey="gs" name="Gold Standard" fill={REGISTRIES[1].color} stackId="s" />
                  <Bar dataKey="acr" name="ACR" fill={REGISTRIES[2].color} stackId="s" />
                  <Bar dataKey="puro" name="Puro" fill={REGISTRIES[3].color} stackId="s" radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Fee Comparison (Registration $)" badge="USD">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={feeComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="registry" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                  <Bar dataKey="reg_fee" name="Registration Fee ($)" fill={T.navy} radius={[3, 3, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Average Processing Timeline (days)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={feeComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <YAxis dataKey="registry" type="category" width={50} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <XAxis type="number" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                  <Tooltip formatter={v => `${v} days`} />
                  <Bar dataKey="timeline" name="Avg Days" fill={T.teal} radius={[0, 3, 3, 0]}>
                    {feeComparison.map((r, i) => <Cell key={i} fill={REGISTRIES[i]?.color || T.teal} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Issued vs Retired by Registry">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={REGISTRY_DETAILS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="short" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => `${fmt(v)} tCO2e`} />
                <Bar dataKey="issued_total" name="Issued" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar dataKey="retired_total" name="Retired" fill={T.emerald} radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ─── TAB 6: API HEALTH & SYNC ─── */}
      {tab === 'API Health & Sync' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Connected" value={API_STATUS.filter(a => a.status === 'Connected').length} sub={`of ${REGISTRIES.length} registries`} color={T.emerald} />
            <Kpi label="Degraded" value={API_STATUS.filter(a => a.status === 'Degraded').length} color={T.orange} />
            <Kpi label="Pending Ops" value={API_STATUS.reduce((a, s) => a + s.pending_ops, 0)} color={T.navy} />
            <Kpi label="Errors (24h)" value={API_STATUS.reduce((a, s) => a + s.error_count_24h, 0)} color={T.red} />
          </div>

          <Section title="Registry Connection Status" badge="Live">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {API_STATUS.map(a => (
                <div key={a.registry} style={{ border: `2px solid ${a.status === 'Connected' ? '#d1fae5' : '#fed7aa'}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: a.color, fontSize: 14 }}>{a.registry}</span>
                    <Badge text={a.status} color={a.status === 'Connected' ? T.emerald : T.orange} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                    <div><span style={{ color: T.gray }}>Last Sync:</span></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.last_sync}</div>
                    <div><span style={{ color: T.gray }}>Latency:</span></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', color: a.latency_ms > 300 ? T.orange : T.emerald }}>{a.latency_ms}ms</div>
                    <div><span style={{ color: T.gray }}>Uptime:</span></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.uptime_pct}%</div>
                    <div><span style={{ color: T.gray }}>Pending:</span></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.pending_ops}</div>
                    <div><span style={{ color: T.gray }}>Rate Limit:</span></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.rate_limit_remaining} remaining</div>
                    <div><span style={{ color: T.gray }}>Errors (24h):</span></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', color: a.error_count_24h > 3 ? T.red : T.emerald }}>{a.error_count_24h}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Error Log (Recent)" badge={`${ERROR_LOG.length} entries`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Error ID', 'Registry', 'Timestamp', 'Type', 'Endpoint', 'Severity', 'Resolved'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ERROR_LOG.map((e, i) => (
                  <tr key={e.id} style={{ background: e.severity === 'Critical' ? '#fef2f2' : i % 2 ? '#faf9f6' : '#fff', borderBottom: '1px solid #e5e0d8' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{e.id}</td>
                    <td style={{ padding: '6px 10px' }}>{e.registry}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{e.timestamp}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{e.type}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{e.endpoint}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <Badge text={e.severity} color={e.severity === 'Critical' ? T.red : e.severity === 'Error' ? T.orange : T.gold} />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <Badge text={e.resolved ? 'Yes' : 'No'} color={e.resolved ? T.emerald : T.red} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Latency by Registry (ms)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={API_STATUS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="registry" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <Tooltip formatter={v => `${v}ms`} />
                <Bar dataKey="latency_ms" name="Latency (ms)" radius={[3, 3, 0, 0]}>
                  {API_STATUS.map((a, i) => <Cell key={i} fill={a.latency_ms > 300 ? T.orange : a.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff', border: '1px solid #e5e0d8', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>EP-BV3 Registry Integration Hub</span>
        <span>{REGISTRIES.length} registries | {PROJECTS.length} projects | {API_STATUS.filter(a => a.status === 'Connected').length}/{REGISTRIES.length} connected</span>
        <span>Sprint BV - Credit Retirement & Certificates</span>
      </div>
    </div>
  );
}
