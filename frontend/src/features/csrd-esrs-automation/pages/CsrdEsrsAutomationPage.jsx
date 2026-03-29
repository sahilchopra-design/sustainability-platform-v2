import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, Label,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'CSRD Compliance Dashboard',
  'ESRS Topic Navigator',
  'KPI Data Collection Engine',
  'Double Materiality Assessment',
  'iXBRL Tagging Engine',
  'Assurance & Audit Trail',
];

// ─── Shared helpers ────────────────────────────────────────────────────────────

const card = (extra = {}) => ({
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: '18px 20px',
  boxShadow: T.card,
  ...extra,
});

const pill = (color, bg) => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
  color,
  background: bg,
});

const Badge = ({ label, color, bg }) => (
  <span style={pill(color, bg)}>{label}</span>
);

const SeverityBadge = ({ s }) => {
  const map = {
    Critical: { color: '#fff', bg: T.red },
    High:     { color: '#fff', bg: T.amber },
    Medium:   { color: '#fff', bg: T.gold },
    Low:      { color: T.navy, bg: '#e0f0e8' },
  };
  const m = map[s] || map.Low;
  return <Badge label={s} color={m.color} bg={m.bg} />;
};

const KpiCard = ({ label, value, sub, color }) => (
  <div style={card({ flex: 1, minWidth: 160 })}>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{sub}</div>}
  </div>
);

const PillarRing = ({ label, pct, color }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={90} height={90}>
        <circle cx={45} cy={45} r={r} fill="none" stroke={T.border} strokeWidth={8} />
        <circle
          cx={45} cy={45} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x={45} y={50} textAnchor="middle" fontSize={15} fontWeight={800} fill={color}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, textAlign: 'center', maxWidth: 90 }}>{label}</div>
    </div>
  );
};

const ProgressBar = ({ pct, color }) => (
  <div style={{ background: T.border, borderRadius: 4, height: 7, flex: 1 }}>
    <div style={{ width: `${pct}%`, background: color || T.navy, borderRadius: 4, height: '100%' }} />
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12, borderBottom: `2px solid ${T.gold}`, paddingBottom: 6 }}>
    {children}
  </div>
);

// ─── Tab 1: CSRD Compliance Dashboard ──────────────────────────────────────────

const pillars = [
  { label: 'General\n(ESRS 1+2)', pct: 84, color: T.navyL },
  { label: 'Environment\n(E1–E5)', pct: 71, color: T.sage },
  { label: 'Social\n(S1–S4)', pct: 68, color: T.amber },
  { label: 'Governance\n(G1)', pct: 78, color: T.gold },
  { label: 'Cross-cutting', pct: 82, color: '#8b5cf6' },
];

const timeline = [
  { year: '2025', scope: '500+ employees', fy: 'FY2024', status: 'Active' },
  { year: '2026', scope: '250+ employees', fy: 'FY2025', status: 'Upcoming' },
  { year: '2028', scope: 'SMEs (listed)', fy: 'FY2027', status: 'Planned' },
];

const dataGaps = [
  { topic: 'Scope 3 Category 11 (Use of sold products)', severity: 'Critical', daysToClose: 45 },
  { topic: 'Biodiversity baseline measurement', severity: 'Critical', daysToClose: 62 },
  { topic: 'Value chain worker survey data', severity: 'High', daysToClose: 30 },
  { topic: 'Water withdrawal by source type', severity: 'High', daysToClose: 21 },
  { topic: 'Transition plan financial assumptions', severity: 'Medium', daysToClose: 14 },
];

const Tab1 = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <KpiCard label="Overall CSRD Readiness" value="72%" sub="Target: 100% by Dec 2025" color={T.amber} />
      <KpiCard label="ESRS Topics Material" value="14 / 30" sub="Assessment complete" color={T.navyL} />
      <KpiCard label="Data Points Collected" value="847 / 1,144" sub="74% completion rate" color={T.sage} />
      <KpiCard label="iXBRL Tags Validated" value="634" sub="47 warnings · 12 errors" color={T.gold} />
    </div>

    <div style={card()}>
      <SectionTitle>ESRS Pillar Readiness</SectionTitle>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'space-around' }}>
        {pillars.map(p => <PillarRing key={p.label} label={p.label} pct={p.pct} color={p.color} />)}
      </div>
    </div>

    <div style={card()}>
      <SectionTitle>CSRD Reporting Timeline</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeline.map(t => (
          <div key={t.year} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.navy, minWidth: 48 }}>{t.year}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{t.scope}</div>
              <div style={{ color: T.textMut, fontSize: 11 }}>Reports for {t.fy}</div>
            </div>
            <Badge
              label={t.status}
              color={t.status === 'Active' ? '#fff' : T.navy}
              bg={t.status === 'Active' ? T.green : t.status === 'Upcoming' ? T.goldL : T.border}
            />
          </div>
        ))}
      </div>
    </div>

    <div style={card()}>
      <SectionTitle>Top 5 Data Gaps</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: T.bg }}>
            {['Topic', 'Severity', 'Est. Days to Close'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataGaps.map((g, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: '8px 10px', color: T.text }}>{g.topic}</td>
              <td style={{ padding: '8px 10px' }}><SeverityBadge s={g.severity} /></td>
              <td style={{ padding: '8px 10px', color: T.textSec, fontWeight: 600 }}>{g.daysToClose} days</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Tab 2: ESRS Topic Navigator ───────────────────────────────────────────────

const esrsStandards = [
  { code: 'ESRS 1', name: 'General Requirements', drs: 6,  collected: 6,  status: 'Material',   deadline: 'Jan 2025', phaseIn: null },
  { code: 'ESRS 2', name: 'General Disclosures',  drs: 12, collected: 11, status: 'Material',   deadline: 'Jan 2025', phaseIn: null },
  { code: 'ESRS E1', name: 'Climate Change',       drs: 11, collected: 9,  status: 'Material',   deadline: 'Jun 2025', phaseIn: '1-year (Scope 3 cat 11,13,14,15)' },
  { code: 'ESRS E2', name: 'Pollution',            drs: 5,  collected: 3,  status: 'Material',   deadline: 'Jun 2025', phaseIn: '1-year (air pollutants)' },
  { code: 'ESRS E3', name: 'Water & Marine',       drs: 5,  collected: 3,  status: 'Material',   deadline: 'Jun 2025', phaseIn: null },
  { code: 'ESRS E4', name: 'Biodiversity',         drs: 6,  collected: 2,  status: 'Pending',    deadline: 'Jun 2025', phaseIn: '3-year phase-in for SMEs' },
  { code: 'ESRS E5', name: 'Resource Use & CE',    drs: 6,  collected: 4,  status: 'Material',   deadline: 'Jun 2025', phaseIn: null },
  { code: 'ESRS S1', name: 'Own Workforce',        drs: 17, collected: 13, status: 'Material',   deadline: 'Jun 2025', phaseIn: '1-year (some HR metrics)' },
  { code: 'ESRS S2', name: 'Workers in Value Chain', drs: 5, collected: 2, status: 'Material',  deadline: 'Jun 2025', phaseIn: '1-year' },
  { code: 'ESRS S3', name: 'Affected Communities', drs: 5,  collected: 2,  status: 'Pending',    deadline: 'Jun 2025', phaseIn: '1-year' },
  { code: 'ESRS S4', name: 'Consumers & End-users', drs: 5, collected: 2,  status: 'Not Material', deadline: 'N/A',    phaseIn: null },
  { code: 'ESRS G1', name: 'Business Conduct',     drs: 6,  collected: 5,  status: 'Material',   deadline: 'Jan 2025', phaseIn: null },
];

const barData = esrsStandards.map(s => ({
  name: s.code,
  pct: s.drs > 0 ? Math.round((s.collected / s.drs) * 100) : 0,
}));

const statusColor = s => s === 'Material' ? T.sage : s === 'Not Material' ? T.textMut : T.amber;

const Tab2 = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={card()}>
      <SectionTitle>Completion by ESRS Standard</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.textSec }} />
          <Tooltip formatter={v => [`${v}%`, 'Completion']} />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {barData.map((d, i) => (
              <Cell key={i} fill={d.pct >= 80 ? T.sage : d.pct >= 60 ? T.gold : T.amber} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={card()}>
      <SectionTitle>ESRS Disclosure Requirements Detail</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Standard', 'Topic', 'Status', 'DRs Req.', 'Collected', 'Completion', 'Deadline', 'Phase-in Relief'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {esrsStandards.map((s, i) => {
              const pct = s.drs > 0 ? Math.round((s.collected / s.drs) * 100) : 0;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy }}>{s.code}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{s.name}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={pill('#fff', statusColor(s.status))}>{s.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec }}>{s.drs}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec }}>{s.collected}</td>
                  <td style={{ padding: '8px 10px', minWidth: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ProgressBar pct={pct} color={pct >= 80 ? T.sage : pct >= 60 ? T.gold : T.amber} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec, minWidth: 30 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', color: T.textMut, whiteSpace: 'nowrap' }}>{s.deadline}</td>
                  <td style={{ padding: '8px 10px', color: s.phaseIn ? T.amber : T.textMut, fontSize: 11 }}>{s.phaseIn || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ─── Tab 3: KPI Data Collection Engine ─────────────────────────────────────────

const e1DataPoints = [
  { id: 'E1-1', name: 'GHG reduction target (2030)', source: 'Temperature Alignment', auto: 'Auto', value: '-42% vs 2019', prior: '-35% vs 2019', assurance: 'Limited', ixbrl: 'esrs:GHGReductionTarget2030', quality: 96 },
  { id: 'E1-1b', name: 'GHG reduction target (2050)', source: 'Temperature Alignment', auto: 'Auto', value: 'Net Zero', prior: 'Net Zero', assurance: 'Limited', ixbrl: 'esrs:GHGReductionTarget2050', quality: 95 },
  { id: 'E1-2', name: 'Climate mitigation policies', source: 'Policy Tracker', auto: 'Semi-auto', value: '7 policies', prior: '5 policies', assurance: 'None', ixbrl: 'esrs:ClimateMitigationPolicies', quality: 82 },
  { id: 'E1-3', name: 'Climate actions & resources (€M)', source: 'Capex Planner', auto: 'Semi-auto', value: '€142M', prior: '€98M', assurance: 'Limited', ixbrl: 'esrs:ClimateActionsCapex', quality: 88 },
  { id: 'E1-4', name: 'Climate-related targets', source: 'Target Manager', auto: 'Auto', value: '12 targets', prior: '9 targets', assurance: 'Limited', ixbrl: 'esrs:ClimateRelatedTargets', quality: 91 },
  { id: 'E1-5', name: 'Total energy consumption (MWh)', source: 'Energy Analytics', auto: 'Auto', value: '486,200 MWh', prior: '512,400 MWh', assurance: 'Reasonable', ixbrl: 'esrs:TotalEnergyConsumption', quality: 98 },
  { id: 'E1-5b', name: 'Renewable energy mix (%)', source: 'Energy Analytics', auto: 'Auto', value: '34%', prior: '21%', assurance: 'Reasonable', ixbrl: 'esrs:RenewableEnergyPct', quality: 97 },
  { id: 'E1-6', name: 'Scope 1 GHG emissions (tCO2e)', source: 'Carbon Accounting', auto: 'Auto', value: '48,200', prior: '53,100', assurance: 'Reasonable', ixbrl: 'esrs:GrossScope1GHGEmissions', quality: 99 },
  { id: 'E1-7a', name: 'Scope 2 (location-based) tCO2e', source: 'Carbon Accounting', auto: 'Auto', value: '22,800', prior: '26,400', assurance: 'Reasonable', ixbrl: 'esrs:Scope2LocationBasedGHG', quality: 99 },
  { id: 'E1-7b', name: 'Scope 2 (market-based) tCO2e', source: 'Carbon Accounting', auto: 'Auto', value: '14,600', prior: '19,200', assurance: 'Reasonable', ixbrl: 'esrs:Scope2MarketBasedGHG', quality: 99 },
  { id: 'E1-8a', name: 'Scope 3 Cat 1-6 (tCO2e)', source: 'Supply Chain Analytics', auto: 'Semi-auto', value: '312,000', prior: '298,000', assurance: 'Limited', ixbrl: 'esrs:Scope3UpstreamGHG', quality: 78 },
  { id: 'E1-8b', name: 'Scope 3 Cat 11 Use of products', source: 'Product Lifecycle', auto: 'Manual', value: 'Not collected', prior: 'N/A', assurance: 'None', ixbrl: 'esrs:Scope3Cat11GHG', quality: 0 },
  { id: 'E1-8c', name: 'Scope 3 Cat 15 Investments', source: 'Carbon-Aware Allocation', auto: 'Auto', value: '1,240,000', prior: '1,380,000', assurance: 'Limited', ixbrl: 'esrs:Scope3Cat15GHG', quality: 84 },
  { id: 'E1-9', name: 'Financed emissions (tCO2e)', source: 'Carbon-Aware Allocation', auto: 'Auto', value: '1,240,000', prior: '1,380,000', assurance: 'Limited', ixbrl: 'esrs:FinancedEmissions', quality: 87 },
];

const autoColor = a => a === 'Auto' ? T.sage : a === 'Semi-auto' ? T.amber : T.red;

const Tab3 = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <KpiCard label="Auto-populated" value="9 / 14" sub="ESRS E1 data points" color={T.sage} />
      <KpiCard label="Semi-automated" value="3 / 14" sub="Require partial input" color={T.amber} />
      <KpiCard label="Manual" value="2 / 14" sub="No automation available" color={T.red} />
      <KpiCard label="Avg Data Quality" value="86%" sub="Weighted by assurance level" color={T.navyL} />
    </div>

    <div style={card()}>
      <SectionTitle>ESRS E1 — Climate Change Data Collection Pipeline</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { module: 'Temperature Alignment', feeds: ['E1-1', 'E1-4', 'E1-6', 'E1-7'] },
          { module: 'Energy Analytics', feeds: ['E1-5'] },
          { module: 'Carbon Accounting', feeds: ['E1-6', 'E1-7'] },
          { module: 'Supply Chain Analytics', feeds: ['E1-8a/b'] },
          { module: 'Carbon-Aware Allocation', feeds: ['E1-8c', 'E1-9'] },
        ].map((m, i) => (
          <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.module}</div>
            <div style={{ color: T.textSec }}>Feeds: <span style={{ color: T.sage, fontWeight: 600 }}>{m.feeds.join(', ')}</span></div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Data Point', 'Metric', 'Source Module', 'Auto-pop', 'Current Value', 'Prior Year', 'Assurance', 'Quality', 'iXBRL Tag'].map(h => (
                <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {e1DataPoints.map((d, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: T.navy, whiteSpace: 'nowrap' }}>{d.id}</td>
                <td style={{ padding: '7px 8px', color: T.text, maxWidth: 180 }}>{d.name}</td>
                <td style={{ padding: '7px 8px', color: T.textSec, whiteSpace: 'nowrap' }}>{d.source}</td>
                <td style={{ padding: '7px 8px' }}>
                  <span style={pill('#fff', autoColor(d.auto))}>{d.auto}</span>
                </td>
                <td style={{ padding: '7px 8px', color: d.value === 'Not collected' ? T.red : T.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{d.value}</td>
                <td style={{ padding: '7px 8px', color: T.textMut, whiteSpace: 'nowrap' }}>{d.prior}</td>
                <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
                  <span style={pill(T.navy, d.assurance === 'Reasonable' ? '#d1fae5' : d.assurance === 'Limited' ? T.goldL : T.border)}>{d.assurance}</span>
                </td>
                <td style={{ padding: '7px 8px', minWidth: 80 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ProgressBar pct={d.quality} color={d.quality >= 90 ? T.sage : d.quality >= 70 ? T.gold : T.red} />
                    <span style={{ fontSize: 10, color: T.textSec }}>{d.quality}%</span>
                  </div>
                </td>
                <td style={{ padding: '7px 8px', color: T.navyL, fontSize: 10, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{d.ixbrl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ─── Tab 4: Double Materiality Assessment ──────────────────────────────────────

const dmTopics = [
  { topic: 'Climate change mitigation', x: 4.8, y: 4.9, material: true },
  { topic: 'Climate change adaptation', x: 4.2, y: 4.1, material: true },
  { topic: 'Biodiversity & ecosystems', x: 3.6, y: 4.5, material: true },
  { topic: 'Water & marine resources', x: 3.2, y: 3.8, material: true },
  { topic: 'Pollution - air', x: 2.8, y: 3.4, material: true },
  { topic: 'Circular economy', x: 3.5, y: 3.1, material: true },
  { topic: 'Own workforce - health & safety', x: 4.1, y: 4.7, material: true },
  { topic: 'Own workforce - fair wages', x: 3.7, y: 4.0, material: true },
  { topic: 'Supply chain labour rights', x: 3.9, y: 4.3, material: true },
  { topic: 'Communities - indigenous rights', x: 2.4, y: 3.6, material: true },
  { topic: 'Anti-corruption & bribery', x: 4.0, y: 3.2, material: true },
  { topic: 'Consumers - data privacy', x: 3.1, y: 3.0, material: true },
  { topic: 'Tax transparency', x: 3.4, y: 2.8, material: true },
  { topic: 'Political engagement', x: 2.0, y: 3.5, material: true },
  { topic: 'Animal welfare', x: 1.4, y: 2.2, material: false },
  { topic: 'Ocean plastic pollution', x: 1.8, y: 2.5, material: false },
  { topic: 'Noise pollution', x: 1.2, y: 1.8, material: false },
  { topic: 'Soil contamination', x: 2.4, y: 2.1, material: false },
  { topic: 'Light pollution', x: 1.0, y: 1.4, material: false },
  { topic: 'Supplier diversity', x: 2.2, y: 2.4, material: false },
];

const iroe = [
  { topic: 'Climate change mitigation', type: 'Risk', description: 'Physical asset stranding from >2°C scenario', horizon: 'MT/LT', magnitude: '€2.4B' },
  { topic: 'Own workforce safety', type: 'Impact', description: 'Fatalities and injuries in operations', horizon: 'ST', magnitude: '€180M' },
  { topic: 'Biodiversity', type: 'Risk', description: 'Regulatory moratorium on land use', horizon: 'MT', magnitude: '€640M' },
  { topic: 'Supply chain labour', type: 'Impact', description: 'Forced labour in Tier 2 suppliers', horizon: 'ST/MT', magnitude: '€320M' },
  { topic: 'Anti-corruption', type: 'Opportunity', description: 'Clean-supply premium contract pipeline', horizon: 'MT', magnitude: '€95M' },
];

const Tab4 = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <KpiCard label="Material Topics" value="14 / 20" sub="Score ≥ 3 on either axis" color={T.sage} />
      <KpiCard label="Not Material" value="6 / 20" sub="Both axes < 3" color={T.textMut} />
      <KpiCard label="IROes Identified" value="47" sub="Impacts, Risks, Opportunities" color={T.navyL} />
      <KpiCard label="Stakeholder Inputs" value="312" sub="Survey responses processed" color={T.gold} />
    </div>

    <div style={card()}>
      <SectionTitle>Double Materiality Matrix</SectionTitle>
      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>
        X-axis = Financial Materiality (ESG risks affecting company) · Y-axis = Impact Materiality (company's impacts on environment/people) · Threshold = 3.0
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" dataKey="x" domain={[0, 5.5]} tick={{ fontSize: 10 }}>
            <Label value="Financial Materiality →" position="insideBottom" offset={-15} fontSize={11} fill={T.textSec} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[0, 5.5]} tick={{ fontSize: 10 }}>
            <Label value="Impact Materiality →" angle={-90} position="insideLeft" offset={10} fontSize={11} fill={T.textSec} />
          </YAxis>
          <ReferenceLine x={3} stroke={T.red} strokeDasharray="4 4" strokeWidth={1.5} />
          <ReferenceLine y={3} stroke={T.red} strokeDasharray="4 4" strokeWidth={1.5} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{d.topic}</div>
                  <div style={{ color: T.textSec }}>Financial: {d.x} · Impact: {d.y}</div>
                  <div style={{ marginTop: 4 }}>
                    <Badge label={d.material ? 'Material' : 'Not Material'} color="#fff" bg={d.material ? T.sage : T.textMut} />
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={dmTopics}>
            {dmTopics.map((d, i) => (
              <Cell key={i} fill={d.material ? T.sage : T.textMut} opacity={d.material ? 0.85 : 0.45} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>

    <div style={card()}>
      <SectionTitle>Top 5 IROes — Impacts, Risks & Opportunities</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: T.bg }}>
            {['Topic', 'IRO Type', 'Description', 'Time Horizon', 'Financial Magnitude'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {iroe.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{r.topic}</td>
              <td style={{ padding: '8px 10px' }}>
                <Badge
                  label={r.type}
                  color="#fff"
                  bg={r.type === 'Risk' ? T.red : r.type === 'Impact' ? T.amber : T.sage}
                />
              </td>
              <td style={{ padding: '8px 10px', color: T.textSec }}>{r.description}</td>
              <td style={{ padding: '8px 10px', color: T.textSec, textAlign: 'center' }}>{r.horizon}</td>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy }}>{r.magnitude}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Tab 5: iXBRL Tagging Engine ───────────────────────────────────────────────

const ixbrlTags = [
  { std: 'ESRS E1', name: 'Gross Scope 1 GHG Emissions', element: 'esrs:GrossScope1GHGEmissions', dtype: 'decimal', unit: 'tCO2e', value: '48,200', status: 'Valid' },
  { std: 'ESRS E1', name: 'Scope 2 Location-based GHG', element: 'esrs:Scope2LocationBasedGHGEmissions', dtype: 'decimal', unit: 'tCO2e', value: '22,800', status: 'Valid' },
  { std: 'ESRS E1', name: 'Scope 2 Market-based GHG', element: 'esrs:Scope2MarketBasedGHGEmissions', dtype: 'decimal', unit: 'tCO2e', value: '14,600', status: 'Valid' },
  { std: 'ESRS E1', name: 'Total Energy Consumption', element: 'esrs:TotalEnergyConsumption', dtype: 'decimal', unit: 'MWh', value: '486,200', status: 'Valid' },
  { std: 'ESRS E1', name: 'Renewable Energy Share', element: 'esrs:ShareOfRenewableEnergy', dtype: 'decimal', unit: '%', value: '34', status: 'Valid' },
  { std: 'ESRS E1', name: 'GHG Intensity per Revenue', element: 'esrs:GHGIntensityPerNetRevenue', dtype: 'decimal', unit: 'tCO2e/€M', value: '42.8', status: 'Warning' },
  { std: 'ESRS E2', name: 'Air Pollutant NOx', element: 'esrs:AirPollutantsNOx', dtype: 'decimal', unit: 'tonnes', value: '124', status: 'Valid' },
  { std: 'ESRS E3', name: 'Total Water Withdrawal', element: 'esrs:TotalWaterWithdrawal', dtype: 'decimal', unit: 'ML', value: '2,840', status: 'Warning' },
  { std: 'ESRS S1', name: 'Total Employees', element: 'esrs:TotalNumberOfEmployees', dtype: 'decimal', unit: 'persons', value: '18,420', status: 'Valid' },
  { std: 'ESRS S1', name: 'Gender Pay Gap', element: 'esrs:UnadjustedGenderPayGap', dtype: 'decimal', unit: '%', value: '12.4', status: 'Valid' },
  { std: 'ESRS S1', name: 'LTIFR', element: 'esrs:LostTimeInjuryFrequencyRate', dtype: 'decimal', unit: 'per 1M hrs', value: '1.8', status: 'Valid' },
  { std: 'ESRS G1', name: 'Anti-corruption Training', element: 'esrs:AntiCorruptionTrainingEmployees', dtype: 'decimal', unit: '%', value: '94', status: 'Valid' },
  { std: 'ESRS E1', name: 'Carbon Offsets Used', element: 'esrs:CarbonCreditsUsed', dtype: 'monetary', unit: '€', value: '2,400,000', status: 'Error' },
  { std: 'ESRS E5', name: 'Waste to Landfill', element: 'esrs:WasteDirectedToLandfill', dtype: 'decimal', unit: 'tonnes', value: '3,280', status: 'Valid' },
  { std: 'ESRS E4', name: 'Sites in or near Biodiversity-sensitive Areas', element: 'esrs:SitesInBiodiversityArea', dtype: 'decimal', unit: 'count', value: '3', status: 'Warning' },
];

const tagStatusColor = s => s === 'Valid' ? T.sage : s === 'Warning' ? T.amber : T.red;

const Tab5 = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <KpiCard label="Tags Validated" value="634" sub="94% auto-tagged correctly" color={T.sage} />
      <KpiCard label="Warnings" value="47" sub="Unit mismatch / sign convention" color={T.amber} />
      <KpiCard label="Errors" value="12" sub="Missing mandatory tags" color={T.red} />
      <KpiCard label="Auto-tag Accuracy" value="94%" sub="Quantitative data points" color={T.navyL} />
    </div>

    <div style={card()}>
      <SectionTitle>iXBRL Tag Table — ESRS XBRL Taxonomy Mapping</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Standard', 'Data Point Name', 'iXBRL Element', 'Data Type', 'Unit', 'Value', 'Validation'].map(h => (
                <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ixbrlTags.map((t, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: T.navy }}>{t.std}</td>
                <td style={{ padding: '7px 8px', color: T.text }}>{t.name}</td>
                <td style={{ padding: '7px 8px', color: T.navyL, fontFamily: 'monospace', fontSize: 10 }}>{t.element}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{t.dtype}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{t.unit}</td>
                <td style={{ padding: '7px 8px', fontWeight: 600, color: T.text }}>{t.value}</td>
                <td style={{ padding: '7px 8px' }}>
                  <span style={pill('#fff', tagStatusColor(t.status))}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={card({ flex: 1, minWidth: 280 })}>
        <SectionTitle>EFRAG ESRS XBRL Taxonomy Structure</SectionTitle>
        {[
          { level: 'Module', name: 'esrs-all — Master linkbase' },
          { level: 'Dimensions', name: 'ESRS Standard · Topic · Phase-in' },
          { level: 'Labels', name: 'EN / DE / FR / ES / PL / IT' },
          { level: 'Calculations', name: 'Roll-up rules for GHG totals' },
          { level: 'Version', name: 'EFRAG ESRS 2024-01-10' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: T.navy, minWidth: 90 }}>{r.level}</div>
            <div style={{ color: T.textSec }}>{r.name}</div>
          </div>
        ))}
      </div>

      <div style={card({ flex: 1, minWidth: 280 })}>
        <SectionTitle>ESAP Submission Workflow</SectionTitle>
        {[
          { step: '1', label: 'Prepare iXBRL HTML report' },
          { step: '2', label: 'Validate against EFRAG taxonomy' },
          { step: '3', label: 'Resolve all errors (0 tolerance)' },
          { step: '4', label: 'Submit via ESMA OAM portal' },
          { step: '5', label: 'Receive ESAP accession number' },
          { step: '6', label: 'Public disclosure on ESAP platform' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{s.step}</div>
            <div style={{ color: T.text }}>{s.label}</div>
          </div>
        ))}
        <button style={{ marginTop: 14, padding: '10px 20px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
          Generate iXBRL Report
        </button>
      </div>
    </div>
  </div>
);

// ─── Tab 6: Assurance & Audit Trail ────────────────────────────────────────────

const assuranceChecklist = [
  { item: 'Data collection procedures documented', status: true },
  { item: 'Calculation methodologies disclosed', status: true },
  { item: 'Prior year comparatives available (2023)', status: true },
  { item: 'Boundary definition documented (org + op)', status: true },
  { item: 'Scope 3 category inclusion/exclusion rationale', status: true },
  { item: 'GHG protocol version specified (GHG Protocol 2015)', status: true },
  { item: 'Emission factors sourced and versioned', status: true },
  { item: 'Data quality procedures and internal controls', status: false },
  { item: 'Responsible data owners assigned per metric', status: true },
  { item: 'Review and approval sign-off documented', status: false },
  { item: 'External assurance engagement letter signed', status: false },
  { item: 'Management representation letter prepared', status: false },
];

const providers = [
  { name: 'Deloitte', capability: 'CSRD + ESRS Full Suite', tier: 'Big 4' },
  { name: 'PwC', capability: 'CSRD + Climate Assurance', tier: 'Big 4' },
  { name: 'EY', capability: 'CSRD + iXBRL validation', tier: 'Big 4' },
  { name: 'KPMG', capability: 'CSRD + Supply chain', tier: 'Big 4' },
  { name: 'Bureau Veritas', capability: 'GHG + Environmental', tier: 'Specialist' },
  { name: 'DNV', capability: 'Climate + Energy', tier: 'Specialist' },
];

const priorYear = [
  { kpi: 'Scope 1 GHG (tCO2e)', y2023: '53,100', y2024: '48,200', chg: '-9.2%', explain: false },
  { kpi: 'Scope 2 (market-based)', y2023: '19,200', y2024: '14,600', chg: '-24.0%', explain: true },
  { kpi: 'Total Energy (MWh)', y2023: '512,400', y2024: '486,200', chg: '-5.1%', explain: false },
  { kpi: 'Renewable Energy (%)', y2023: '21%', y2024: '34%', chg: '+61.9%', explain: true },
  { kpi: 'Total Employees', y2023: '17,840', y2024: '18,420', chg: '+3.3%', explain: false },
  { kpi: 'Gender Pay Gap (%)', y2023: '14.8%', y2024: '12.4%', chg: '-16.2%', explain: false },
  { kpi: 'LTIFR (per 1M hrs)', y2023: '2.4', y2024: '1.8', chg: '-25.0%', explain: true },
  { kpi: 'Water withdrawal (ML)', y2023: '3,210', y2024: '2,840', chg: '-11.5%', explain: false },
  { kpi: 'Waste to landfill (t)', y2023: '4,120', y2024: '3,280', chg: '-20.4%', explain: true },
  { kpi: 'Anti-corruption training (%)', y2023: '88%', y2024: '94%', chg: '+6.8%', explain: false },
];

const Tab6 = () => {
  const passed = assuranceChecklist.filter(c => c.status).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Assurance Checklist" value={`${passed} / ${assuranceChecklist.length}`} sub="Items ready for assurer" color={passed >= 10 ? T.sage : T.amber} />
        <KpiCard label="Assurance Standard" value="ISAE 3000" sub="Limited assurance mandatory Y1" color={T.navyL} />
        <KpiCard label="Reasonable Assurance" value="From 2028" sub="Phase-in per CSRD Art. 26a" color={T.gold} />
        <KpiCard label="Audit Log Entries" value="14,840" sub="Timestamped data-point trails" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={card({ flex: 1, minWidth: 300 })}>
          <SectionTitle>Assurance Readiness Checklist</SectionTitle>
          {assuranceChecklist.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.status ? T.sage : T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {c.status ? '✓' : '✗'}
              </div>
              <div style={{ color: c.status ? T.text : T.red }}>{c.item}</div>
            </div>
          ))}
        </div>

        <div style={card({ flex: 1, minWidth: 280 })}>
          <SectionTitle>Assurance Provider Selection</SectionTitle>
          {providers.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: T.navy, minWidth: 120 }}>{p.name}</div>
              <div style={{ flex: 1, color: T.textSec }}>{p.capability}</div>
              <Badge label={p.tier} color={T.navy} bg={p.tier === 'Big 4' ? T.goldL : T.border} />
            </div>
          ))}
          <button style={{ marginTop: 14, padding: '10px 20px', background: T.sage, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
            Generate Assurance Pack
          </button>
        </div>
      </div>

      <div style={card()}>
        <SectionTitle>Prior Year Comparison — Top 10 Material KPIs (2023 vs 2024)</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['KPI', '2023 Value', '2024 Value', 'YoY Change', 'Explanation Required (>20% variance)'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priorYear.map((r, i) => {
              const isNeg = r.chg.startsWith('-');
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{r.kpi}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec }}>{r.y2023}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>{r.y2024}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: isNeg ? T.red : T.green }}>{r.chg}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {r.explain
                      ? <span style={pill('#fff', T.amber)}>Required</span>
                      : <span style={pill(T.textMut, T.border)}>Not Required</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={card()}>
        <SectionTitle>Audit Trail — Sample Data Point Log</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { ts: '2025-03-15 09:14:22', dp: 'ESRS E1-6 Scope 1 GHG', src: 'Carbon Accounting Engine', calc: 'GHG Protocol Scope 1 — stationary combustion', user: 'j.smith@company.com', review: 'Approved' },
            { ts: '2025-03-14 16:32:08', dp: 'ESRS S1 Gender Pay Gap', src: 'HR Information System', calc: 'Unadjusted median pay ratio', user: 'a.jones@company.com', review: 'Pending' },
            { ts: '2025-03-13 11:07:55', dp: 'ESRS E3 Water Withdrawal', src: 'Utility Metering API', calc: 'Sum of metered consumption by facility', user: 'k.lee@company.com', review: 'Approved' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '10px 14px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11 }}>
              <div style={{ color: T.textMut, minWidth: 140 }}>{l.ts}</div>
              <div style={{ fontWeight: 700, color: T.navy, minWidth: 200 }}>{l.dp}</div>
              <div style={{ color: T.textSec, minWidth: 180 }}>{l.src}</div>
              <div style={{ color: T.textSec, flex: 1 }}>{l.calc}</div>
              <div style={{ color: T.textMut }}>{l.user}</div>
              <Badge label={l.review} color="#fff" bg={l.review === 'Approved' ? T.sage : T.amber} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function CsrdEsrsAutomationPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabComponents = [Tab1, Tab2, Tab3, Tab4, Tab5, Tab6];
  const ActiveComponent = tabComponents[activeTab];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 28px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                CSRD ESRS Automation Suite
              </h1>
              <span style={pill(T.navy, T.gold)}>EP-AH1</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['CSRD 2025', 'ESRS E1–S4–G1', 'iXBRL', '50,000 Companies', 'Materiality→KPI'].map(b => (
                <span key={b} style={pill('#bcd4ee', 'rgba(255,255,255,0.12)')}>{b}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>AA Impact Risk Analytics</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>FY2024 Reporting Cycle</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontFamily: T.font,
                fontSize: 12,
                fontWeight: activeTab === i ? 700 : 500,
                whiteSpace: 'nowrap',
                background: activeTab === i ? T.surface : 'transparent',
                color: activeTab === i ? T.navy : 'rgba(255,255,255,0.65)',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
