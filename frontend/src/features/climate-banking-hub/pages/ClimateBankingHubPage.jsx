import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// eslint-disable-next-line no-unused-vars
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static data ───────────────────────────────────────────────────────────
const EMISSIONS_TRAJECTORY = [
  { year: '2020', actual: 1240, target: null,  netZero: null },
  { year: '2021', actual: 1180, target: null,  netZero: null },
  { year: '2022', actual: 1050, target: null,  netZero: null },
  { year: '2023', actual: 960,  target: null,  netZero: null },
  { year: '2024', actual: 847,  target: null,  netZero: null },
  { year: '2025', actual: null, target: 750,   netZero: null },
  { year: '2030', actual: null, target: 420,   netZero: null },
  { year: '2050', actual: null, target: null,  netZero: 0    },
];

const KPI_CARDS = [
  { id: 1, label: 'Financed Emissions',    value: '847.3',  unit: 'ktCO\u2082e', trend: '\u2193 12% YoY',       sub: 'PCAF DQS 3.2',            status: 'green' },
  { id: 2, label: 'Portfolio Temperature', value: '2.7',    unit: '\u00b0C',     trend: 'Target: 1.5\u00b0C',   sub: 'Gap: 1.2\u00b0C',         status: 'red'   },
  { id: 3, label: 'Green Asset Ratio',     value: '7.3',    unit: '%',           trend: 'Target: 12% (2025)',   sub: '+2.2pp YoY',              status: 'amber' },
  { id: 4, label: 'Climate CET1 Impact',   value: '-1.8',   unit: '%',           trend: 'Delayed Transition',   sub: 'Buffer: 3.0%',            status: 'amber' },
  { id: 5, label: 'Climate ECL Overlay',   value: '\u00a3438M', unit: '',        trend: '+98.6% vs base',       sub: '3 NGFS scenarios',        status: 'red'   },
  { id: 6, label: 'Stranded Assets',       value: '\u00a31.84bn', unit: '',      trend: 'EPC D\u2013G at risk', sub: '2028 MEES trigger',       status: 'amber' },
];

const RAG_METRICS = [
  { metric: 'Financed Emissions',    value: '847 ktCO\u2082e', trend: '\u2193 12%',   status: 'green' },
  { metric: 'Portfolio Temperature', value: '2.7\u00b0C',      trend: '\u2192 flat',  status: 'red'   },
  { metric: 'Green Asset Ratio',     value: '7.3%',            trend: '\u2191 2.2pp', status: 'amber' },
  { metric: 'Climate CET1 Impact',   value: '-1.8%',           trend: '\u2193 0.3pp', status: 'amber' },
  { metric: 'Climate ECL Overlay',   value: '\u00a3438M',      trend: '\u2191 99%',   status: 'red'   },
  { metric: 'Stranded Assets',       value: '\u00a31.84bn',    trend: '\u2191 6%',    status: 'amber' },
];

const REGULATORY_EVENTS = [
  { date: 'Jan 2024', label: 'ECB Pillar 2 Climate Risk Expectations',           status: 'complete', detail: 'ECB thematic review binding supervisory expectations on climate & nature risk' },
  { date: 'Jan 2024', label: 'UK TCFD Mandatory \u2014 All Banks (FCA PS21/24)', status: 'complete', detail: 'FCA mandatory TCFD disclosure for all UK-listed banks and asset managers' },
  { date: 'Mar 2024', label: 'SEC Climate Rule Final',                            status: 'complete', detail: 'SEC final rules on climate-related disclosures for public registrants (Reg S-X / S-K)' },
  { date: 'Jun 2024', label: 'ISSB IFRS S1/S2 \u2014 UK Adoption',               status: 'complete', detail: 'IFRS Foundation endorses S1 (general sustainability) and S2 (climate) for UK use' },
  { date: 'Jan 2025', label: 'CSRD Phase 1 Reporting (FY2024 data)',              status: 'complete', detail: '500+ employee EU companies; mandatory ESRS disclosures including ESRS E1 climate' },
  { date: 'Jan 2025', label: 'UK SDR Implementation (FCA)',                       status: 'complete', detail: 'Sustainability Disclosure Requirements \u2014 product naming, labelling and disclosure rules' },
  { date: 'Mar 2025', label: 'DORA ICT Risk Reporting',                           status: 'complete', detail: 'Digital Operational Resilience Act \u2014 mandatory ICT incident classification and reporting' },
  { date: 'Jun 2025', label: 'EU AI Act \u2014 Full Application',                 status: 'upcoming', detail: 'High-risk AI systems in financial services must comply with Title III/IV requirements' },
  { date: 'Jan 2026', label: 'CSRD Phase 2 \u2014 Financial Sector',              status: 'critical', detail: 'Banks & insurance companies in scope; ~3,500 additional firms; ESRS E1 mandatory' },
  { date: '2026',     label: 'Basel Committee Climate Disclosure Requirements',   status: 'critical', detail: 'BCBS Pillar 3 climate-related financial risk disclosures \u2014 standardised templates' },
  { date: '2028',     label: 'UK MEES EPC C Requirement',                         status: 'upcoming', detail: 'Minimum Energy Efficiency Standards \u2014 all rented commercial & residential properties EPC C+' },
  { date: '2030',     label: 'EU Fit for 55 \u2014 Interim Targets',              status: 'upcoming', detail: '55% net GHG reduction vs 1990; ETS reform, CBAM phase-in, ReFuelEU, FuelEU Maritime' },
];

const APPETITE_ROWS = [
  { metric: 'Financed emissions vs. 2019 baseline', limit: '-30% by 2025',    current: '-31.8%',        status: 'met',    rem: null },
  { metric: 'Coal financing',                        limit: '0% new deals',    current: '\u00a3120M legacy', status: 'runoff', rem: 'Legacy portfolio in managed runoff; no new coal deals since 2022. Full exit by 2030.' },
  { metric: 'Portfolio temperature',                 limit: '<2.5\u00b0C 2025',current: '2.7\u00b0C',   status: 'breach', rem: 'Accelerate sector decarbonisation engagement; review high-carbon sector credit limits H1 2025.' },
  { metric: 'Green Asset Ratio',                     limit: '>10% by 2025',    current: '7.3%',          status: 'breach', rem: 'Increase green lending origination; launch green RMBS securitisation programme Q2 2025.' },
  { metric: 'CET1 climate buffer',                   limit: '>2%',             current: '3.0%',          status: 'met',    rem: null },
  { metric: 'Physical risk ECL',                     limit: '<\u00a3300M',     current: '\u00a3234M',    status: 'met',    rem: null },
];

const PEERS = [
  { name: 'ABN AMRO',      gar: 14.2, temp: 2.2, fe: -35, highlight: false },
  { name: 'ING',           gar: 11.8, temp: 2.4, fe: -28, highlight: false },
  { name: 'BNP Paribas',   gar: 9.4,  temp: 2.5, fe: -22, highlight: false },
  { name: 'HSBC',          gar: 8.2,  temp: 2.8, fe: -18, highlight: false },
  { name: 'Our Bank',      gar: 7.3,  temp: 2.7, fe: -31, highlight: true  },
  { name: 'Santander',     gar: 7.9,  temp: 2.9, fe: -20, highlight: false },
  { name: 'Deutsche Bank', gar: 6.8,  temp: 3.0, fe: -15, highlight: false },
  { name: 'Barclays',      gar: 5.1,  temp: 3.1, fe: -12, highlight: false },
];

const DISCLOSURE_BADGES = [
  { label: 'TCFD',           detail: '100% (all 11 recommendations)' },
  { label: 'CDP Climate',    detail: 'A\u2013 rating (2023)' },
  { label: 'PCAF Signatory', detail: 'Since 2021' },
  { label: 'NZBA Member',    detail: 'Net Zero Banking Alliance' },
  { label: 'PRB',            detail: 'Principles for Responsible Banking (UNEP FI)' },
];

const MODULE_LINKS = [
  { code: 'EP-AJ1', title: 'PCAF Financed Emissions',  desc: 'Scope 3 Cat 15 attribution & DQS scoring', color: T.green  },
  { code: 'EP-AJ2', title: 'Climate Stress Test',       desc: 'NGFS Phase IV \u2014 orderly, disorderly, hot-house', color: T.sage   },
  { code: 'EP-AJ3', title: 'Green Asset Ratio',         desc: 'EU Taxonomy-aligned asset classification',  color: T.amber  },
  { code: 'EP-AJ4', title: 'Portfolio Temperature Score', desc: 'PACTA / SBTi sector decarbonisation alignment', color: '#a855f7' },
  { code: 'EP-AJ5', title: 'Climate Credit Risk',       desc: 'Climate-adjusted PD/LGD & ECL overlays',   color: T.red    },
];

const TABS = ['Executive Dashboard', 'Regulatory Calendar', 'Risk Appetite', 'Peer Benchmarking'];

// ── Helpers ───────────────────────────────────────────────────────────────
const ragColor  = s => (s === 'green' || s === 'met')     ? T.green
                     : (s === 'red'   || s === 'breach')  ? T.red
                     : T.amber;

const ragLabel  = s => s === 'met'     ? '\u2705 Met'
                     : s === 'breach'  ? '\u274c Breach'
                     : s === 'runoff'  ? '\u26a0 Runoff'
                     : s === 'complete'? 'Complete'
                     : s === 'upcoming'? 'Upcoming'
                     : 'Critical';

const statusBg  = s => {
  if (s === 'met' || s === 'complete' || s === 'green') return 'rgba(6,200,150,0.12)';
  if (s === 'breach' || s === 'red')                    return 'rgba(240,64,96,0.12)';
  if (s === 'critical')                                  return 'rgba(240,64,96,0.18)';
  return 'rgba(240,168,40,0.12)';
};

const COLOR_MAP = { complete: T.green, upcoming: T.sage, critical: T.red };
const LABEL_MAP = { complete: 'Complete', upcoming: 'Upcoming', critical: 'Critical' };

// ── Custom tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: T.textSec, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text }}>
          {p.name}: <strong>{p.value != null ? p.value.toLocaleString() : '\u2014'}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Tab 1 sub-components ───────────────────────────────────────────────────
function KpiGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
      {KPI_CARDS.map(k => (
        <div key={k.id} style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '18px 20px', boxShadow: T.card, borderLeft: `3px solid ${ragColor(k.status)}`,
        }}>
          <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {k.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{k.value}</span>
            {k.unit && <span style={{ fontSize: 14, color: T.textSec }}>{k.unit}</span>}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: ragColor(k.status), fontWeight: 600 }}>{k.trend}</span>
            <span style={{ fontSize: 11, color: T.textMut }}>\u00b7</span>
            <span style={{ fontSize: 11, color: T.textSec }}>{k.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RagTable() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderL}` }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Board Climate KPI Summary \u2014 RAG Status</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: T.surfaceH }}>
            {['Metric', 'Current Value', 'YoY Trend', 'Board Status'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textSec, fontWeight: 500, borderBottom: `1px solid ${T.borderL}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RAG_METRICS.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
              <td style={{ padding: '10px 16px', color: T.text }}>{r.metric}</td>
              <td style={{ padding: '10px 16px', color: T.text, fontWeight: 600 }}>{r.value}</td>
              <td style={{ padding: '10px 16px', color: T.textSec }}>{r.trend}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                  background: statusBg(r.status), color: ragColor(r.status), fontWeight: 600, fontSize: 11,
                }}>
                  {r.status === 'green' ? '\u25cf On Track' : r.status === 'red' ? '\u25cf Off Track' : '\u25cf Monitor'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmissionsChart() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>Financed Emissions Trajectory (2020\u20132050)</div>
      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>ktCO\u2082e \u00b7 PCAF-attributed \u00b7 Scope 1+2+3 partial</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={EMISSIONS_TRAJECTORY} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.green} stopOpacity={0.3} />
              <stop offset="95%" stopColor={T.green} stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.sage} stopOpacity={0.2} />
              <stop offset="95%" stopColor={T.sage} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
          <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} />
          <YAxis tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} unit=" kt" />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="actual" name="Actual"   stroke={T.green} fill="url(#gradActual)" strokeWidth={2} connectNulls dot={{ r: 3, fill: T.green }} />
          <Area type="monotone" dataKey="target" name="Target"   stroke={T.sage}  fill="url(#gradTarget)" strokeWidth={2} strokeDasharray="5 3" connectNulls dot={{ r: 3, fill: T.sage }} />
          <Line  type="monotone" dataKey="netZero" name="Net Zero" stroke={T.amber} strokeWidth={1.5} strokeDasharray="3 3" connectNulls dot={{ r: 3, fill: T.amber }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModuleLinks() {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Sprint AJ \u2014 Module Navigator</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {MODULE_LINKS.map(m => (
          <div key={m.code} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '14px', cursor: 'pointer', borderTop: `2px solid ${m.color}`,
          }}>
            <div style={{ fontSize: 10, color: m.color, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>{m.code}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutiveDashboard() {
  return (
    <div>
      <KpiGrid />
      <RagTable />
      <EmissionsChart />
      <ModuleLinks />
    </div>
  );
}

// ── Tab 2: Regulatory Calendar ─────────────────────────────────────────────
function RegulatoryCalendar() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {Object.entries(LABEL_MAP).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_MAP[k], display: 'inline-block' }} />
            <span style={{ color: T.textSec }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 119, top: 0, bottom: 0, width: 2, background: T.border, zIndex: 0 }} />
        {REGULATORY_EVENTS.map((e, i) => (
          <div key={i} style={{ display: 'flex', marginBottom: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 112, flexShrink: 0, textAlign: 'right', paddingRight: 16, paddingTop: 10 }}>
              <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{e.date}</span>
            </div>
            <div style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'flex-start', paddingTop: 12 }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: COLOR_MAP[e.status], border: `2px solid ${T.bg}`,
                display: 'inline-block', boxShadow: `0 0 0 2px ${COLOR_MAP[e.status]}44`,
              }} />
            </div>
            <div style={{
              flex: 1, marginLeft: 16, background: T.surface,
              border: `1px solid ${T.border}`, borderLeft: `3px solid ${COLOR_MAP[e.status]}`,
              borderRadius: 8, padding: '10px 14px', boxShadow: T.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: statusBg(e.status), color: COLOR_MAP[e.status],
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {LABEL_MAP[e.status]}
                </span>
              </div>
              <div style={{ fontSize: 11, color: T.textSec }}>{e.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 3: Risk Appetite ───────────────────────────────────────────────────
function RiskAppetite() {
  const breaches = APPETITE_ROWS.filter(r => r.rem);
  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 12, color: T.textSec }}>
        Board-approved climate risk appetite limits vs. current exposure as at Q4 2024.
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Risk Appetite Framework \u2014 Climate Metrics</span>
          <span style={{ fontSize: 11, color: T.textSec }}>Board approved Feb 2024 \u00b7 Next review Feb 2025</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Metric', 'Board Limit', 'Current Exposure', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textSec, fontWeight: 500, borderBottom: `1px solid ${T.borderL}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APPETITE_ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                <td style={{ padding: '12px 16px', color: T.text, fontWeight: 500 }}>{r.metric}</td>
                <td style={{ padding: '12px 16px', color: T.textSec }}>{r.limit}</td>
                <td style={{ padding: '12px 16px', color: T.text, fontWeight: 600 }}>{r.current}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 10px', borderRadius: 99,
                    background: statusBg(r.status), color: ragColor(r.status), fontWeight: 700, fontSize: 11,
                  }}>
                    {ragLabel(r.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Remediation Actions \u2014 Breach & Runoff Metrics</div>
        {breaches.map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: '12px 0',
            borderBottom: i < breaches.length - 1 ? `1px solid ${T.borderL}` : 'none',
          }}>
            <span style={{
              flexShrink: 0, padding: '3px 10px', borderRadius: 99,
              background: statusBg(r.status), color: ragColor(r.status),
              fontWeight: 700, fontSize: 10, height: 'fit-content', marginTop: 2,
            }}>
              {ragLabel(r.status)}
            </span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{r.metric}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{r.rem}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Peer Benchmarking ───────────────────────────────────────────────
function PeerBenchmarking() {
  const sortedGar  = [...PEERS].sort((a, b) => b.gar  - a.gar);
  const sortedTemp = [...PEERS].sort((a, b) => a.temp - b.temp);
  const sortedFe   = [...PEERS].sort((a, b) => a.fe   - b.fe);

  const barFill = (name, base) => name === 'Our Bank' ? T.amber : base;

  const ranked = [...PEERS]
    .map(p => ({ ...p, score: p.gar * 2 + (4 - p.temp) * 10 + (-p.fe) * 0.5 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      {/* Three bar charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>Green Asset Ratio (%)</div>
          <div style={{ fontSize: 10, color: T.textSec, marginBottom: 14 }}>EU Taxonomy-aligned \u00b7 Higher is better</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sortedGar} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 10 }} axisLine={{ stroke: T.border }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fill: T.textSec, fontSize: 10 }} width={88} axisLine={{ stroke: T.border }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gar" name="GAR %" radius={[0, 3, 3, 0]}>
                {sortedGar.map((e, i) => <Cell key={i} fill={barFill(e.name, T.green)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>Portfolio Temperature (\u00b0C)</div>
          <div style={{ fontSize: 10, color: T.textSec, marginBottom: 14 }}>Implied warming \u00b7 Lower is better</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sortedTemp} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 10 }} axisLine={{ stroke: T.border }} unit="\u00b0C" domain={[1.5, 3.5]} />
              <YAxis dataKey="name" type="category" tick={{ fill: T.textSec, fontSize: 10 }} width={88} axisLine={{ stroke: T.border }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="temp" name="Temp \u00b0C" radius={[0, 3, 3, 0]}>
                {sortedTemp.map((e, i) => <Cell key={i} fill={barFill(e.name, T.sage)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>Financed Emissions Reduction (%)</div>
          <div style={{ fontSize: 10, color: T.textSec, marginBottom: 14 }}>vs. 2019 baseline \u00b7 More negative is better</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sortedFe} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 10 }} axisLine={{ stroke: T.border }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fill: T.textSec, fontSize: 10 }} width={88} axisLine={{ stroke: T.border }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fe" name="FE Change %" radius={[0, 3, 3, 0]}>
                {sortedFe.map((e, i) => <Cell key={i} fill={barFill(e.name, '#a855f7')} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* League table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Peer League Table \u2014 Climate Performance</span>
          <span style={{ fontSize: 11, color: T.textSec }}>Illustrative / publicly-reported data \u00b7 FY 2023/24</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Rank', 'Bank', 'GAR %', 'Portfolio Temp', 'FE Reduction', 'Score'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: T.textSec, fontWeight: 500, borderBottom: `1px solid ${T.borderL}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, i) => (
              <tr key={p.name} style={{
                borderBottom: `1px solid ${T.borderL}`,
                background: p.highlight ? 'rgba(240,168,40,0.06)' : 'transparent',
              }}>
                <td style={{ padding: '10px 16px', color: T.textSec, fontWeight: 700 }}>#{i + 1}</td>
                <td style={{ padding: '10px 16px', color: p.highlight ? T.amber : T.text, fontWeight: p.highlight ? 700 : 500 }}>
                  {p.name}{p.highlight ? ' \u2605' : ''}
                </td>
                <td style={{ padding: '10px 16px', color: p.gar >= 10 ? T.green : p.gar >= 7 ? T.amber : T.red, fontWeight: 600 }}>{p.gar}%</td>
                <td style={{ padding: '10px 16px', color: p.temp <= 2.4 ? T.green : p.temp <= 2.8 ? T.amber : T.red, fontWeight: 600 }}>{p.temp}\u00b0C</td>
                <td style={{ padding: '10px 16px', color: p.fe <= -25 ? T.green : p.fe <= -15 ? T.amber : T.red, fontWeight: 600 }}>{p.fe}%</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ background: T.borderL, borderRadius: 4, height: 6, width: 80 }}>
                    <div style={{
                      width: `${Math.min(100, (p.score / 80) * 100)}%`,
                      height: '100%', borderRadius: 4,
                      background: p.highlight ? T.amber : T.green,
                    }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclosure readiness */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Climate Disclosure Readiness</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {DISCLOSURE_BADGES.map(b => (
            <div key={b.label} style={{
              background: 'rgba(6,200,150,0.10)', border: '1px solid rgba(6,200,150,0.25)',
              borderRadius: 10, padding: '12px 16px', minWidth: 175,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>\u2713</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{b.label}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textSec }}>{b.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ClimateBankingHubPage() {
  const [activeTab, setActiveTab] = useState(0);

  const TAB_CONTENT = [
    <ExecutiveDashboard   key="exec"     />,
    <RegulatoryCalendar   key="reg"      />,
    <RiskAppetite         key="appetite" />,
    <PeerBenchmarking     key="peer"     />,
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>

      {/* Sticky header */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: '20px 32px 0', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: T.amber, background: 'rgba(240,168,40,0.12)', padding: '3px 8px', borderRadius: 4,
              }}>
                EP-AJ6 \u00b7 Sprint AJ
              </span>
              <span style={{ fontSize: 10, color: T.textMut }}>Financed Emissions &amp; Climate Banking Analytics</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>
              Climate Banking Hub
              <span style={{ fontSize: 14, fontWeight: 400, color: T.textSec, marginLeft: 10 }}>Board Dashboard</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: T.textMut, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Data as at</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Q4 2024 \u00b7 Verified</div>
            </div>
            <div style={{
              background: 'rgba(6,200,150,0.12)', border: '1px solid rgba(6,200,150,0.3)',
              borderRadius: 8, padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>847</div>
              <div style={{ fontSize: 9, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ktCO\u2082e Total</div>
            </div>
            <div style={{
              background: 'rgba(240,168,40,0.10)', border: '1px solid rgba(240,168,40,0.28)',
              borderRadius: 8, padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.amber }}>2.7\u00b0C</div>
              <div style={{ fontSize: 9, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portfolio Temp</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex' }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 13, fontWeight: 500,
                color: activeTab === i ? T.amber : T.textSec,
                borderBottom: activeTab === i ? `2px solid ${T.amber}` : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s', fontFamily: T.font,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {TAB_CONTENT[activeTab]}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.border}`, padding: '14px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: T.textMut }}>
          EP-AJ6 \u00b7 Climate Banking Hub \u00b7 Sprint AJ \u2014 Financed Emissions &amp; Climate Banking Analytics
        </span>
        <span style={{ fontSize: 11, color: T.textMut }}>
          PCAF \u00b7 TCFD \u00b7 ISSB IFRS S2 \u00b7 CSRD ESRS E1 \u00b7 Basel III \u00b7 NGFS Phase IV
        </span>
      </div>
    </div>
  );
}
