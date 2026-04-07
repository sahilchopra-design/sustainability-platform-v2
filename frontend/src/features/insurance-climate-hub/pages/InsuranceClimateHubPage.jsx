import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const DOMAINS = [
  'Mortality & Longevity', 'P&C Pricing', 'Reserve Adequacy',
  'Solvency Capital', 'Claims Forecast', 'Regulatory Compliance',
];

const domainColor = score => score >= 75 ? T.green : score >= 60 ? T.amber : T.red;

const DOMAIN_DATA = DOMAINS.map((d, i) => ({
  domain: d,
  score: +(sr(i * 13) * 40 + 50).toFixed(1),
  trend: sr(i * 17) > 0.5 ? 'Improving' : 'Deteriorating',
  alertCount: Math.floor(sr(i * 23) * 5),
}));

const REG_JURISDICTIONS = [
  { body: 'IAIS', title: 'IAIS Field Testing', deadline: '2025 Q1', ref: 'IAIS-FT-2025' },
  { body: 'PRA', title: 'PRA SS3/19 Annual Review', deadline: '2025 Q2', ref: 'SS3/19' },
  { body: "Lloyd's", title: "Lloyd's Climate Exposure Mgmt", deadline: '2025 Q2', ref: 'LCEM-2025' },
  { body: 'APRA', title: 'APRA Climate Vulnerability Assessment', deadline: '2025 Q3', ref: 'CVA-2025' },
  { body: 'NAIC', title: 'NAIC Climate Risk Disclosure', deadline: '2025 Q3', ref: 'CRD-2025' },
  { body: 'BaFin', title: 'BaFin Climate Stress Test', deadline: '2025 Q4', ref: 'CST-2025' },
  { body: 'ACPR', title: 'ACPR France Scenarios', deadline: '2025 Q4', ref: 'ACPR-CS25' },
  { body: 'DNB', title: 'DNB NL Climate Stress Test', deadline: '2026 Q1', ref: 'DNB-CST-26' },
  { body: 'EIOPA', title: 'EIOPA Nat Cat Stress', deadline: '2026 Q1', ref: 'EIOPA-NCS' },
  { body: 'PIC', title: 'PIC Pillar 2 Add-On', deadline: '2026 Q1', ref: 'PIC-P2-26' },
  { body: 'OSFI', title: 'OSFI LICAT Climate', deadline: '2026 Q2', ref: 'OSFI-LICAT' },
  { body: 'FCA', title: 'FCA Insurance Market Climate', deadline: '2026 Q2', ref: 'FCA-IMC-26' },
];

const REG_MILESTONES = REG_JURISDICTIONS.map((r, i) => ({
  ...r,
  status: sr(i * 31) > 0.65 ? 'Completed' : sr(i * 31) > 0.35 ? 'Due Soon' : 'Upcoming',
}));

const KRI_NAMES = [
  ['Heat Mortality Loading', 'Mortality & Longevity', '%', 0.15],
  ['Longevity Tail Factor', 'Mortality & Longevity', 'x', 0.12],
  ['Rate Adequacy Ratio', 'P&C Pricing', '%', 0.90],
  ['Combined Ratio Climate Adj', 'P&C Pricing', '%', 1.05],
  ['Loss Ratio Trend', 'P&C Pricing', '%', 0.75],
  ['IBNR Climate Gap', 'Reserve Adequacy', '$M', 250],
  ['Reserve Redundancy Ratio', 'Reserve Adequacy', '%', 0.95],
  ['Nat Cat Reserve Factor', 'Reserve Adequacy', 'x', 1.20],
  ['SCR Climate Add-On', 'Solvency Capital', '%', 0.15],
  ['SCR Ratio', 'Solvency Capital', '%', 1.50],
  ['Tier 1 Capital Ratio', 'Solvency Capital', '%', 0.12],
  ['Claims CAGR 2050', 'Claims Forecast', '%', 0.06],
  ['Physical Risk PML', 'Claims Forecast', '$B', 12],
  ['Climate VaR 99th pct', 'Claims Forecast', '%', 0.18],
  ['SFCR Climate Disclosure', 'Regulatory Compliance', 'score', 0.75],
  ['ORSA Climate Scenario', 'Regulatory Compliance', 'score', 0.80],
  ['Greenwashing Risk Score', 'Regulatory Compliance', 'score', 0.35],
  ['Nat Cat Exposure Ratio', 'Claims Forecast', '%', 0.40],
  ['Pandemic-Climate Nexus', 'Mortality & Longevity', 'x', 1.05],
  ['Climate Litigation Exposure', 'Regulatory Compliance', '$M', 85],
];

const KRI_DATA = KRI_NAMES.map(([name, domain, unit, threshold], i) => {
  const value = threshold * (0.7 + sr(i * 13) * 0.7);
  const change = (sr(i * 19) - 0.5) * 20;
  const breached = value > threshold;
  return { name, domain, unit, threshold: +threshold.toFixed(3), value: +value.toFixed(3), change: +change.toFixed(1), breached };
});

const MARKET_EVENTS = [
  {
    headline: 'Lloyd\'s Nat Cat Claims Surge 34% in Q1 2025',
    source: 'Lloyd\'s of London Market Update',
    date: 'Mar 2025',
    summary: 'Atlantic windstorm season and European flood events drove a 34% YoY increase in nat-cat claims. Lloyd\'s syndicates are revising cat model assumptions and increasing ILW (industry loss warranty) attachment points.',
    tag: 'Catastrophe',
    tagColor: T.red,
  },
  {
    headline: 'EIOPA Publishes Revised Nat Cat Stress Test Scenarios',
    source: 'EIOPA Official Publication',
    date: 'Feb 2025',
    summary: 'EIOPA released its 2025 insurance stress test incorporating SSP3-7.0 physical hazard overlays. Aggregate European solvency capital shortfall estimated at €45B under the extreme scenario, with flood and coastal flooding as primary drivers.',
    tag: 'Regulatory',
    tagColor: T.indigo,
  },
  {
    headline: 'Parametric Wildfire Products See 300% Growth in Western US',
    source: 'Swiss Re Sigma Report',
    date: 'Jan 2025',
    summary: 'Demand for parametric wildfire insurance tripled as traditional indemnity capacity retreated from high-risk ZIP codes. Index triggers linked to satellite FRP (Fire Radiative Power) gaining regulatory acceptance in California and Oregon.',
    tag: 'Market Trend',
    tagColor: T.teal,
  },
  {
    headline: 'ILS Market Reaches $105B AUM Amid Climate-Driven Demand',
    source: 'Aon Capital Markets Review',
    date: 'Dec 2024',
    summary: 'Insurance-linked securities market hit record $105B assets under management, with climate peril cat bonds now comprising 68% of new issuances. Pension funds increasing ILS allocations as uncorrelated return source amid climate volatility.',
    tag: 'Capital Markets',
    tagColor: T.amber,
  },
  {
    headline: 'PRA Issues Dear CEO Letter on Climate Assumptions in Pricing',
    source: 'Bank of England / PRA',
    date: 'Nov 2024',
    summary: 'PRA flagged systematic under-pricing of climate risk in UK motor and property lines, citing inadequate forward-looking trend factors. Firms required to submit revised climate assumptions by Q3 2025 under SS3/19 update requirements.',
    tag: 'Supervisory',
    tagColor: T.purple,
  },
];

// Industry benchmark seeded scores (60-80 per domain)
const BENCHMARK = DOMAINS.map((_, i) => +(sr(i * 47) * 20 + 60).toFixed(1));

// Stress test scenarios
const STRESS_SCENARIOS = [
  { name: 'Moderate', reserveImpact: 8.5, scrImpact: 12.3, claimsImpact: 18.7 },
  { name: 'Severe', reserveImpact: 22.4, scrImpact: 31.8, claimsImpact: 45.2 },
  { name: 'Tail (1-in-200)', reserveImpact: 58.1, scrImpact: 87.6, claimsImpact: 121.4 },
];

const TABS = ['Executive Overview', 'KRI Monitor', 'Regulatory Calendar', 'Market Intelligence', 'Board Report Summary'];

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: active === t ? T.indigo : T.muted,
        borderBottom: active === t ? `2px solid ${T.indigo}` : '2px solid transparent',
        marginBottom: -2, whiteSpace: 'nowrap',
      }}>{t}</button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>{children}</div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    'Completed': { bg: '#dcfce7', color: T.green },
    'Due Soon': { bg: '#fef3c7', color: T.amber },
    'Upcoming': { bg: '#dbeafe', color: T.blue },
  }[status] || { bg: T.sub, color: T.muted };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{status}</span>
  );
};

export default function InsuranceClimateHubPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [domainFilter, setDomainFilter] = useState('All');

  const overallScore = useMemo(() => {
    const sum = DOMAIN_DATA.reduce((s, d) => s + d.score, 0);
    return DOMAIN_DATA.length ? sum / DOMAIN_DATA.length : 0;
  }, []);

  const totalAlerts = useMemo(() => DOMAIN_DATA.reduce((s, d) => s + d.alertCount, 0), []);

  const filteredKRIs = useMemo(() => {
    if (domainFilter === 'All') return KRI_DATA;
    return KRI_DATA.filter(k => k.domain === domainFilter);
  }, [domainFilter]);

  const breachedKRIs = useMemo(() => KRI_DATA.filter(k => k.breached), []);

  // Completion % by jurisdiction
  const completionByJurisdiction = useMemo(() => {
    const map = {};
    REG_MILESTONES.forEach(m => {
      if (!map[m.body]) map[m.body] = { body: m.body, total: 0, completed: 0 };
      map[m.body].total++;
      if (m.status === 'Completed') map[m.body].completed++;
    });
    return Object.values(map).map(j => ({
      body: j.body,
      pct: j.total ? Math.round(j.completed / j.total * 100) : 0,
    }));
  }, []);

  // Radar data: platform vs benchmark
  const radarData = useMemo(() => {
    return DOMAINS.map((d, i) => ({
      subject: d.split(' ')[0] + (d.split(' ')[1] ? ' ' + d.split(' ')[1].slice(0, 4) : ''),
      platform: DOMAIN_DATA[i].score,
      benchmark: BENCHMARK[i],
    }));
  }, []);

  // Top 3 risks for board summary
  const top3Risks = useMemo(() => {
    return [...DOMAIN_DATA].sort((a, b) => a.score - b.score).slice(0, 3);
  }, []);

  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
  const thStyle = { background: T.sub, padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` };
  const tdStyle = { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.text };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          EP-DC6 · Insurance Climate Intelligence Hub
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, marginBottom: 4 }}>
          Insurance Climate Intelligence Hub
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>
          Executive climate risk dashboard · CRO/CFO board reporting · IAIS/PRA/FCA supervisory submissions · 6 actuarial domains · 20 KRIs · 12 regulatory milestones
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Executive Overview */}
      {activeTab === TABS[0] && (
        <div>
          {/* Top KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px',
              borderLeft: `6px solid ${domainColor(overallScore)}`, gridColumn: 'span 1',
            }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Overall Climate Risk Score</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: domainColor(overallScore) }}>{overallScore.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: T.muted }}>Weighted avg across 6 domains (100 = best)</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', borderLeft: `4px solid ${T.amber}` }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Active Alerts</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.amber }}>{totalAlerts}</div>
              <div style={{ fontSize: 12, color: T.muted }}>Across all domains</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', borderLeft: `4px solid ${T.red}` }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>KRI Breaches</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.red }}>{breachedKRIs.length}</div>
              <div style={{ fontSize: 12, color: T.muted }}>of 20 KRIs above threshold</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', borderLeft: `4px solid ${T.indigo}` }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Regulatory Milestones</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.indigo }}>{REG_MILESTONES.filter(m => m.status === 'Completed').length}/{REG_MILESTONES.length}</div>
              <div style={{ fontSize: 12, color: T.muted }}>Completed</div>
            </div>
          </div>

          {/* Domain score cards */}
          <SectionTitle>Actuarial Domain Risk Scores</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {DOMAIN_DATA.map(d => (
              <div key={d.domain} style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: 20, borderLeft: `4px solid ${domainColor(d.score)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{d.domain}</div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: d.alertCount > 3 ? '#fee2e2' : d.alertCount > 1 ? '#fef3c7' : '#dcfce7',
                    color: d.alertCount > 3 ? T.red : d.alertCount > 1 ? T.amber : T.green,
                  }}>{d.alertCount} alerts</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: domainColor(d.score), marginBottom: 6 }}>{d.score}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3 }}>
                    <div style={{ width: `${d.score}%`, height: '100%', background: domainColor(d.score), borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: d.trend === 'Improving' ? T.green : T.red, fontWeight: 600 }}>
                    {d.trend === 'Improving' ? '↑' : '↓'} {d.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Domain scores chart */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>Domain Scores vs Thresholds</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={DOMAIN_DATA.map(d => ({ name: d.domain.split(' ')[0], score: d.score }))} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={75} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Good (75)', fontSize: 10, fill: T.green }} />
                <ReferenceLine y={60} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Warn (60)', fontSize: 10, fill: T.amber }} />
                <Bar dataKey="score" name="Score">
                  {DOMAIN_DATA.map((d, i) => (
                    <Cell key={i} fill={domainColor(d.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: KRI Monitor */}
      {activeTab === TABS[1] && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['All', ...DOMAINS].map(d => (
              <button key={d} onClick={() => setDomainFilter(d)} style={{
                padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${domainFilter === d ? T.indigo : T.border}`,
                background: domainFilter === d ? T.indigo : T.card,
                color: domainFilter === d ? '#fff' : T.muted,
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}>{d === 'All' ? 'All Domains' : d.split(' ')[0]}</button>
            ))}
          </div>

          {/* KRI Bar Chart */}
          {filteredKRIs.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <SectionTitle>KRI Values vs Thresholds — {domainFilter}</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={filteredKRIs.slice(0, 10).map(k => ({ name: k.name.split(' ').slice(0, 2).join(' '), value: k.value, threshold: k.threshold }))}
                  margin={{ top: 8, right: 24, left: 8, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Current Value">
                    {filteredKRIs.slice(0, 10).map((k, i) => (
                      <Cell key={i} fill={k.breached ? T.red : T.green} />
                    ))}
                  </Bar>
                  <Bar dataKey="threshold" name="Threshold" fill={T.border} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Breach Heatmap — 3×7 grid */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <SectionTitle>KRI Breach Heatmap (20 Indicators)</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {KRI_DATA.map((k, i) => (
                <div key={i} title={`${k.name}: ${k.value} (threshold: ${k.threshold})`} style={{
                  background: k.breached ? '#fee2e2' : '#dcfce7',
                  border: `1px solid ${k.breached ? T.red : T.green}`,
                  borderRadius: 4, padding: '8px 4px', textAlign: 'center', cursor: 'default',
                }}>
                  <div style={{ fontSize: 9, color: k.breached ? T.red : T.green, fontWeight: 700, lineHeight: 1.2 }}>
                    {k.name.split(' ').slice(0, 2).join('\n')}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: k.breached ? T.red : T.green, marginTop: 2 }}>
                    {k.breached ? 'BREACH' : 'OK'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KRI Table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>KRI Detail — {domainFilter === 'All' ? 'All Domains' : domainFilter}</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>KRI Name</th>
                  <th style={thStyle}>Domain</th>
                  <th style={thStyle}>Current Value</th>
                  <th style={thStyle}>Threshold</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Change</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredKRIs.map((k, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><strong>{k.name}</strong></td>
                    <td style={tdStyle}><span style={{ fontSize: 11, color: T.muted }}>{k.domain}</span></td>
                    <td style={tdStyle}>{k.value}</td>
                    <td style={tdStyle}>{k.threshold}</td>
                    <td style={tdStyle}>{k.unit}</td>
                    <td style={tdStyle}>
                      <span style={{ color: k.change > 0 ? T.red : T.green }}>
                        {k.change > 0 ? '+' : ''}{k.change}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: k.breached ? '#fee2e2' : '#dcfce7',
                        color: k.breached ? T.red : T.green,
                      }}>
                        {k.breached ? 'BREACH' : 'PASS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Regulatory Calendar */}
      {activeTab === TABS[2] && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Completion % by Jurisdiction</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={completionByJurisdiction} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="body" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="pct" name="Completion %">
                    {completionByJurisdiction.map((j, i) => (
                      <Cell key={i} fill={j.pct === 100 ? T.green : j.pct > 50 ? T.amber : T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Upcoming & Due Soon</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REG_MILESTONES.filter(m => m.status !== 'Completed').map((m, i) => (
                  <div key={i} style={{ background: T.sub, borderRadius: 6, padding: '8px 12px', borderLeft: `3px solid ${m.status === 'Due Soon' ? T.amber : T.blue}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{m.body} · {m.deadline}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SectionTitle>Full Regulatory Milestone Calendar</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Regulatory Body</th>
                  <th style={thStyle}>Requirement</th>
                  <th style={thStyle}>Reference</th>
                  <th style={thStyle}>Deadline</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {REG_MILESTONES.map((m, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><strong>{m.body}</strong></td>
                    <td style={tdStyle}>{m.title}</td>
                    <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{m.ref}</td>
                    <td style={tdStyle}>{m.deadline}</td>
                    <td style={tdStyle}><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Market Intelligence */}
      {activeTab === TABS[3] && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
            {/* Market event cards */}
            <div>
              <SectionTitle>Recent Market & Supervisory Intelligence</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {MARKET_EVENTS.map((ev, i) => (
                  <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, borderLeft: `4px solid ${ev.tagColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, flex: 1 }}>{ev.headline}</div>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: ev.tagColor + '22', color: ev.tagColor, marginLeft: 12, whiteSpace: 'nowrap' }}>{ev.tag}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 8 }}>{ev.summary}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{ev.source} · {ev.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar: platform vs benchmark */}
            <div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <SectionTitle>Platform vs Industry Benchmark — 6 Domains</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 4, right: 20, left: 20, bottom: 4 }}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Platform" dataKey="platform" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                    <Radar name="Industry Benchmark" dataKey="benchmark" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Competitive positioning table */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <SectionTitle>Competitive Positioning</SectionTitle>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Domain</th>
                      <th style={thStyle}>Platform</th>
                      <th style={thStyle}>Benchmark</th>
                      <th style={thStyle}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarData.map((r, i) => {
                      const delta = DOMAIN_DATA[i].score - BENCHMARK[i];
                      return (
                        <tr key={i}>
                          <td style={{ ...tdStyle, fontSize: 11 }}>{DOMAINS[i].split(' ').slice(0, 2).join(' ')}</td>
                          <td style={tdStyle}>{DOMAIN_DATA[i].score}</td>
                          <td style={tdStyle}>{BENCHMARK[i]}</td>
                          <td style={tdStyle}>
                            <span style={{ color: delta >= 0 ? T.green : T.red, fontWeight: 700 }}>
                              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                            </span>
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
      )}

      {/* TAB 5: Board Report Summary */}
      {activeTab === TABS[4] && (
        <div>
          {/* Overall risk score hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
            <div style={{
              background: T.card, border: `2px solid ${domainColor(overallScore)}`, borderRadius: 12,
              padding: 32, textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Overall Climate Risk Score</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: domainColor(overallScore), lineHeight: 1 }}>{overallScore.toFixed(0)}</div>
              <div style={{ fontSize: 14, color: T.muted, marginTop: 8 }}>out of 100</div>
              <div style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, background: domainColor(overallScore) + '15' }}>
                <div style={{ fontSize: 12, color: domainColor(overallScore), fontWeight: 700 }}>
                  {overallScore >= 75 ? 'STRONG — Climate risk well-managed' : overallScore >= 60 ? 'MODERATE — Targeted improvements needed' : 'ELEVATED — Immediate action required'}
                </div>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
              <SectionTitle>Top 3 Risk Priorities</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {top3Risks.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: T.sub, borderRadius: 8, borderLeft: `4px solid ${domainColor(d.score)}` }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: domainColor(d.score), width: 32 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{d.domain}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Score: {d.score} · {d.alertCount} alerts · {d.trend}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: domainColor(d.score) }}>{d.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key decisions */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <SectionTitle>Key Decisions Required — Board Agenda Items</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { title: 'Climate SCR Add-On Approval', desc: 'Approve 15% SCR climate add-on for P&C portfolio; quantified under EIOPA nat cat stress at €12.3B impact. Requires board resolution under Solvency II Article 37.', urgency: 'High', color: T.red },
                { title: 'Reserve Strengthening Programme', desc: 'Increase IBNR reserves by $22M for climate-exposed P&C lines; actuarial opinion supports 8.5% uplift under moderate scenario. CFO to propose Q2 timeline.', urgency: 'Medium', color: T.amber },
                { title: 'Parametric ILS Issuance', desc: 'Approve $500M catastrophe bond issuance to transfer wildfire and flood tail risk. Target pricing at 6.5% above risk-free rate. Board sign-off required before Q3 roadshow.', urgency: 'Medium', color: T.blue },
              ].map((item, i) => (
                <div key={i} style={{ background: T.sub, borderRadius: 8, padding: 16, borderTop: `3px solid ${item.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{item.title}</div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: item.color + '22', color: item.color,
                    }}>{item.urgency}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stress test results */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Climate Stress Test Results — 3 Scenarios</SectionTitle>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Scenario</th>
                    <th style={thStyle}>Reserve Impact ($B)</th>
                    <th style={thStyle}>SCR Impact ($B)</th>
                    <th style={thStyle}>Claims Impact ($B)</th>
                    <th style={thStyle}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {STRESS_SCENARIOS.map((sc, i) => (
                    <tr key={i}>
                      <td style={tdStyle}><strong>{sc.name}</strong></td>
                      <td style={tdStyle}>${sc.reserveImpact}B</td>
                      <td style={tdStyle}>${sc.scrImpact}B</td>
                      <td style={tdStyle}>${sc.claimsImpact}B</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                          background: i === 2 ? '#fee2e2' : i === 1 ? '#fef3c7' : '#dcfce7',
                          color: i === 2 ? T.red : i === 1 ? T.amber : T.green,
                        }}>
                          {i === 2 ? 'Tail' : i === 1 ? 'Severe' : 'Moderate'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionTitle>Stress Impact Comparison</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={STRESS_SCENARIOS} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}B`} />
                  <Tooltip formatter={v => `$${v}B`} />
                  <Legend />
                  <Bar dataKey="reserveImpact" name="Reserve" fill={T.blue} />
                  <Bar dataKey="scrImpact" name="SCR" fill={T.amber} />
                  <Bar dataKey="claimsImpact" name="Claims" fill={T.red} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
