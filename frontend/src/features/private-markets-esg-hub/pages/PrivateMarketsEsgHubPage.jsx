import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',blue:'#2563eb',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'Strategy Overview',
  'Cross-Strategy Risk',
  'LP Reporting Suite',
  'ESG DD Workflow',
  'Regulatory Compliance',
  'Value Creation Playbook',
];

const STRATEGY_CARDS = [
  { code: 'EP-AG1', name: 'PE ESG Diligence', aum: '$2.1T', coverage: 83, keyMetric: 'ILPA compliance 83%', status: 'Active', esgScore: 68, color: '#1b3a5c' },
  { code: 'EP-AG2', name: 'Private Credit Climate', aum: '$1.8T', coverage: 76, keyMetric: 'Climate-adjusted EL +32bps', status: 'Active', esgScore: 64, color: '#2c5a8c' },
  { code: 'EP-AG3', name: 'Infrastructure ESG', aum: '$1.6T', coverage: 89, keyMetric: 'GRESB avg 71.3', status: 'Active', esgScore: 72, color: '#5a8a6a' },
  { code: 'EP-AG4', name: 'Real Assets Climate', aum: '$1.9T', coverage: 71, keyMetric: 'Stranded asset risk 29%', status: 'Active', esgScore: 61, color: '#c5a96a' },
  { code: 'EP-AG5', name: 'VC Impact', aum: '$1.0T', coverage: 68, keyMetric: 'Abatement 248 MtCO2e/yr', status: 'Active', esgScore: 67, color: '#7ba67d' },
];

const ESG_BY_STRATEGY = [
  { strategy: 'PE ESG', score: 68, target: 74 },
  { strategy: 'Priv Credit', score: 64, target: 70 },
  { strategy: 'Infra ESG', score: 72, target: 77 },
  { strategy: 'Real Assets', score: 61, target: 68 },
  { strategy: 'VC Impact', score: 67, target: 73 },
];

const ADOPTION_TREND = [
  { year: '2018', pct: 32 },
  { year: '2020', pct: 54 },
  { year: '2022', pct: 71 },
  { year: '2024', pct: 84 },
];

const RISK_DIMENSIONS = ['Climate Physical', 'Climate Transition', 'Social Licence', 'Governance', 'Liquidity', 'Regulatory'];

const STRATEGY_RISKS = [
  { strategy: 'PE', scores: [55, 62, 48, 39, 71, 58] },
  { strategy: 'Credit', scores: [43, 68, 42, 35, 82, 61] },
  { strategy: 'Infra', scores: [78, 49, 55, 41, 37, 52] },
  { strategy: 'Real Estate', scores: [82, 57, 44, 46, 55, 48] },
  { strategy: 'VC', scores: [31, 38, 62, 53, 89, 44] },
];

const RADAR_DATA = RISK_DIMENSIONS.map((dim, i) => ({
  subject: dim,
  PE: STRATEGY_RISKS[0].scores[i],
  Credit: STRATEGY_RISKS[1].scores[i],
  Infra: STRATEGY_RISKS[2].scores[i],
  RE: STRATEGY_RISKS[3].scores[i],
  VC: STRATEGY_RISKS[4].scores[i],
}));

const TOP_CONCENTRATIONS = [
  { sector: 'Energy N.Am', pe: 72, credit: 65, infra: 58, re: 12, vc: 8 },
  { sector: 'RE Europe', pe: 18, credit: 32, infra: 24, re: 84, vc: 4 },
  { sector: 'Transport Asia', pe: 45, credit: 41, infra: 77, re: 9, vc: 12 },
  { sector: 'Utilities Global', pe: 38, credit: 28, infra: 81, re: 15, vc: 6 },
  { sector: 'Agri/Food EM', pe: 52, credit: 44, infra: 29, re: 31, vc: 38 },
];

const STRESS_SCENARIO = [
  { strategy: 'VC Climate Tech', impact: 2.3, dir: 'up' },
  { strategy: 'Green Infra', impact: 1.7, dir: 'up' },
  { strategy: 'RE Low-Carbon', impact: 0.9, dir: 'up' },
  { strategy: 'PE Diversified', impact: -0.4, dir: 'down' },
  { strategy: 'Credit Legacy', impact: -0.9, dir: 'down' },
  { strategy: 'PE Energy Sector', impact: -1.8, dir: 'down' },
];

const FRAMEWORK_COMPLETION = [
  { framework: 'ILPA Template', pe: 83, credit: 61, infra: 72, re: 55, vc: 44 },
  { framework: 'INREV ESG', pe: 42, credit: 38, infra: 56, re: 91, vc: 29 },
  { framework: 'PRI LP DDQ', pe: 77, credit: 69, infra: 74, re: 68, vc: 58 },
];

const LP_SATISFACTION = [
  { year: '2022', pct: 62 },
  { year: '2023', pct: 74 },
  { year: '2024', pct: 87 },
];

const REPORTING_TIME = [
  { method: 'Manual', days: 14 },
  { method: 'Platform-Automated', days: 3 },
];

const DD_STAGES = [
  { stage: 1, name: 'Initial Screen', time: '15 min', desc: 'ESG exclusions check — weapons, tobacco, coal thresholds', week: 1 },
  { stage: 2, name: 'Sector Risk Profiling', time: '30 min', desc: 'Physical and transition risk scoring by NAICS sector', week: 1 },
  { stage: 3, name: 'GP/Manager ESG Assessment', time: '2 hrs', desc: 'ESG policy, dedicated team, track record analysis', week: 2 },
  { stage: 4, name: 'Asset-Level DD', time: '4 hrs', desc: 'Site visit data ingestion, IFC Performance Standards check', week: 4 },
  { stage: 5, name: 'Legal Review', time: '1 hr', desc: 'ESG reps and warranties, LPA sustainability clauses', week: 7 },
  { stage: 6, name: 'ESG Value Creation Plan', time: '2 hrs', desc: '100-day plan: quick wins + 3-year improvement roadmap', week: 9 },
  { stage: 7, name: 'IC Approval', time: '30 min', desc: 'ESG section of IC memo — material risks and mitigants', week: 11 },
  { stage: 8, name: 'Monitoring Setup', time: '30 min', desc: 'ILPA data collection cadence, KPI dashboard configuration', week: 13 },
];

const RED_FLAGS = [
  { id: 1, sector: 'Fossil Fuel Midstream', outcome: 'Deal Killed', flag: 'Undisclosed methane leak violations — 3 regulatory penalties in 5 years. Asset stranding probability >60% under NZ2050.' },
  { id: 2, sector: 'Agribusiness SE Asia', outcome: 'Deal Restructured', flag: 'IFC PS6 breach: operations in IUCN Category II protected area. Required land-use covenant before close.' },
  { id: 3, sector: 'Fast Fashion Retail', outcome: 'Deal Killed', flag: 'Supply chain audit revealed Tier 3 suppliers with child labour incidents. GP had no remediation capability.' },
];

const REGULATIONS = [
  { reg: 'SFDR Art 8/9', applicability: ['PE', 'Credit', 'Infra', 'RE', 'VC'], status: 'Partial', deadline: 'Q3 2025', detail: '3 strategies need Article 8 upgrade — PAI indicators not yet collected' },
  { reg: 'AIFMD', applicability: ['PE', 'Credit', 'Infra', 'RE'], status: 'Compliant', deadline: 'Ongoing', detail: 'Sustainability risk disclosures in place across all AIF strategies' },
  { reg: 'ELTIF 2.0', applicability: ['Infra', 'RE'], status: 'Compliant', deadline: 'Jan 2024', detail: 'ESG requirements met; retail marketing approved for 2 funds' },
  { reg: 'SEC PFA Rules', applicability: ['PE', 'Credit', 'VC'], status: 'Partial', deadline: 'Q1 2026', detail: 'ESG disclosure standardisation in progress for US LP reporting' },
  { reg: 'UK FCA SDR', applicability: ['PE', 'Infra', 'RE'], status: 'Non-compliant', deadline: 'Q2 2025', detail: 'Sustainability labels not yet applied — anti-greenwashing review pending' },
  { reg: 'CSRD Portfolio', applicability: ['PE', 'Credit'], status: 'Partial', deadline: 'FY2025', detail: 'Large portfolio cos (>500 employees) data collection initiated' },
];

const REG_TIMELINE = [
  { period: 'Q1 2024', event: 'ELTIF 2.0 in force', type: 'enacted' },
  { period: 'Q2 2025', event: 'UK SDR private fund labels', type: 'upcoming' },
  { period: 'Q3 2025', event: 'SFDR Art 8 upgrade deadline', type: 'critical' },
  { period: 'Q4 2025', event: 'CSRD large portfolio cos', type: 'upcoming' },
  { period: 'Q1 2026', event: 'SEC PFA ESG disclosure', type: 'upcoming' },
  { period: 'Q3 2026', event: 'AIFMD 2.0 ESG provisions', type: 'horizon' },
  { period: 'Q1 2027', event: 'SEC climate disclosure PE-backed', type: 'horizon' },
  { period: 'Q2 2027', event: 'UK SDR private markets extension', type: 'horizon' },
];

const VALUE_LEVERS = [
  { lever: 'Energy efficiency', category: 'E', impact: '+0.4x MOIC', score: 85 },
  { lever: 'Carbon reduction', category: 'E', impact: '+0.3x MOIC', score: 72 },
  { lever: 'Water stewardship', category: 'E', impact: '+0.2x MOIC', score: 58 },
  { lever: 'Labour practices', category: 'S', impact: '+0.5x MOIC', score: 79 },
  { lever: 'Supply chain ESG', category: 'S', impact: '+0.3x MOIC', score: 64 },
  { lever: 'Board diversity', category: 'G', impact: '+0.6x MOIC', score: 71 },
];

const ESG_CHAMPIONS = [
  { asset: 'Nordic Wind Portfolio (Infra)', intervention: 'GRESB certification + turbine efficiency upgrade', result: 'GRESB score 58 to 79; refinancing at SOFR+85bps vs +145bps pre-ESG' },
  { asset: 'LogiCo Distribution (PE)', intervention: 'Fleet electrification 100-day plan', result: 'Scope 1 emissions -42%; exit multiple 9.2x vs sector avg 7.1x' },
  { asset: 'Urban Office REIT (RE)', intervention: 'BREEAM Excellent retrofit programme', result: 'Vacancy rate -8pp; 12% rent premium vs non-certified comparable' },
  { asset: 'SolarTech Series B (VC)', intervention: 'Impact measurement framework (IRIS+)', result: '248 MtCO2e/yr abatement verified; Series C at 3.1x Series B valuation' },
  { asset: 'AgriFinance Credit', intervention: 'Climate-linked loan KPIs (regenerative farming)', result: 'Default rate 40bps lower than non-ESG linked book; LP oversubscription 2.3x' },
];

const SCORE_IMPROVEMENT = [
  { month: 'Now', score: 66.8 },
  { month: 'Q2 2026', score: 68.1 },
  { month: 'Q4 2026', score: 69.7 },
  { month: 'Q2 2027', score: 71.0 },
  { month: 'Q4 2027', score: 72.0 },
];

const EVIDENCE = [
  { source: 'McKinsey', finding: 'PE funds with strong ESG integration achieve 1.2x higher exit multiples vs peers without', metric: '1.2x exit multiple' },
  { source: 'Preqin', finding: 'ESG-rated infrastructure assets achieve 60bps lower yield — the greenium is real and growing', metric: '60bps greenium' },
  { source: 'MSCI', finding: 'Real estate assets with top ESG ratings trade at an 8-12% valuation premium at transaction', metric: '8-12% premium' },
  { source: 'Cambridge Associates', finding: 'Impact-focused VC funds deliver 1.4x MOIC premium over comparable non-impact vintage cohorts', metric: '1.4x MOIC delta' },
];

const LP_METRICS = [
  { label: 'Weighted ESG Score', value: '66.8', unit: '/100' },
  { label: 'Portfolio Carbon Intensity', value: '148', unit: 'tCO2e/$M revenue' },
  { label: 'PAI GHG Scope 1+2', value: '2.3M', unit: 'tCO2e (weighted)' },
  { label: 'Gender Pay Gap Reported', value: '4/5', unit: 'strategies' },
  { label: 'Incidents (material)', value: '2', unit: 'YTD — both remediated' },
  { label: 'ESG Score Target (24m)', value: '72.0', unit: '/100' },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.surface, borderRadius: 10, padding: '18px 22px', boxShadow: T.card, border: '1px solid ' + T.border, flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Compliant: { bg: '#dcfce7', color: T.green },
    Partial: { bg: '#fef9c3', color: T.amber },
    'Non-compliant': { bg: '#fee2e2', color: T.red },
    Active: { bg: '#dbeafe', color: T.navyL },
    enacted: { bg: '#dcfce7', color: T.green },
    upcoming: { bg: '#fef9c3', color: T.amber },
    critical: { bg: '#fee2e2', color: T.red },
    horizon: { bg: '#ede9fe', color: '#7c3aed' },
  };
  const s = map[status] || { bg: T.surfaceH, color: T.textSec };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{status}</span>
  );
}

// ── Tab 1: Strategy Overview ──────────────────────────────────────────────────

function Tab1() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <KpiCard label="Combined AUM" value="$8.4T" sub="Preqin 2024 — all private markets" />
        <KpiCard label="Avg ESG Score" value="66.8/100" sub="Across all 5 strategies" color={T.amber} />
        <KpiCard label="Climate Risk Coverage" value="78%" sub="Assets with full climate DD" color={T.sage} />
        <KpiCard label="LP ESG Compliance" value="71%" sub="LP reporting frameworks met" color={T.navyL} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14, marginBottom: 28 }}>
        {STRATEGY_CARDS.map(s => (
          <div key={s.code} style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border, borderLeft: '4px solid ' + s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600 }}>{s.code}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 2 }}>{s.name}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: T.textMut }}>AUM</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.aum}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMut }}>ESG Coverage</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{s.coverage}%</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px', background: T.surfaceH, borderRadius: 6, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.textSec }}>{s.keyMetric}</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, marginBottom: 4 }}>
                <span>ESG Score</span><span>{s.esgScore}/100</span>
              </div>
              <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                <div style={{ height: 4, width: s.esgScore + '%', background: s.color, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="Current vs 12-month target">ESG Score by Strategy</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ESG_BY_STRATEGY} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="strategy" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis domain={[50, 85]} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="score" name="Current" fill={T.navy} radius={[3, 3, 0, 0]} />
              <Bar dataKey="target" name="Target" fill={T.goldL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="% of GPs with formal ESG policy — Preqin">Private Markets ESG Adoption</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ADOPTION_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis domain={[20, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip formatter={v => v + '%'} contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="pct" name="GPs with ESG Policy" stroke={T.sage} strokeWidth={3} dot={{ r: 5, fill: T.sage }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Cross-Strategy Risk ────────────────────────────────────────────────

function Tab2() {
  function riskColor(v) {
    if (v >= 75) return T.red;
    if (v >= 55) return T.amber;
    return T.green;
  }

  return (
    <div>
      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border, marginBottom: 20 }}>
        <SectionTitle sub="Risk score 0-100 (higher = greater risk exposure)">Cross-Strategy Risk Heatmap</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>Dimension</th>
                {STRATEGY_RISKS.map(s => (
                  <th key={s.strategy} style={{ padding: '10px 14px', textAlign: 'center', color: T.textSec, fontWeight: 600 }}>{s.strategy}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_DIMENSIONS.map((dim, i) => (
                <tr key={dim} style={{ borderTop: '1px solid ' + T.border }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: T.navy }}>{dim}</td>
                  {STRATEGY_RISKS.map(s => (
                    <td key={s.strategy} style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ background: riskColor(s.scores[i]) + '22', color: riskColor(s.scores[i]), fontWeight: 700, borderRadius: 5, padding: '3px 10px' }}>{s.scores[i]}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="Aggregate risk profile by strategy — PE, Infra, Real Estate overlay">Multi-Dimensional Risk Overlay</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: T.textSec }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
              <Radar name="PE" dataKey="PE" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Infra" dataKey="Infra" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2} />
              <Radar name="RE" dataKey="RE" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="Net Zero 2050 accelerated transition — IRR delta vs base case">Stress Scenario: Net Zero 2050</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {STRESS_SCENARIO.map(s => (
              <div key={s.strategy} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 140, fontSize: 12, color: T.textSec, flexShrink: 0 }}>{s.strategy}</div>
                <div style={{ flex: 1, height: 22, background: T.surfaceH, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: s.dir === 'up' ? '50%' : (50 - Math.abs(s.impact) * 12) + '%',
                    width: (Math.abs(s.impact) * 12) + '%',
                    background: s.dir === 'up' ? T.green : T.red,
                    borderRadius: 2,
                  }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: T.borderL }} />
                </div>
                <div style={{ width: 70, fontSize: 12, fontWeight: 700, color: s.dir === 'up' ? T.green : T.red, textAlign: 'right' }}>
                  {s.dir === 'up' ? '+' : ''}{s.impact}% IRR
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
        <SectionTitle sub="Aggregate climate exposure score — top sector/geography pairs across all strategies">Top 5 Cross-Strategy Risk Concentrations</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={TOP_CONCENTRATIONS} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="pe" name="PE" stackId="a" fill={T.navy} />
            <Bar dataKey="infra" name="Infra" stackId="a" fill={T.sage} />
            <Bar dataKey="re" name="RE" stackId="a" fill={T.gold} />
            <Bar dataKey="credit" name="Credit" stackId="a" fill={T.navyL} />
            <Bar dataKey="vc" name="VC" stackId="a" fill={T.sageL} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Tab 3: LP Reporting Suite ─────────────────────────────────────────────────

function Tab3() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="LP Satisfaction Good/Excellent" value="87%" sub="Up from 62% in 2022" color={T.green} />
        <KpiCard label="Report Prep Automated" value="3 days" sub="vs 14 days manual (78% saving)" color={T.sage} />
        <KpiCard label="PAI Indicators Covered" value="18/18" sub="SFDR Article 8 mandatory PAIs" color={T.navy} />
        <KpiCard label="LP ESG DDQ Completion" value="71%" sub="Across active LP relationships" color={T.amber} />
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border, marginBottom: 20 }}>
        <SectionTitle sub="Framework completion rate % across strategies — ILPA, INREV, PRI">Reporting Framework Coverage</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={FRAMEWORK_COMPLETION} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="framework" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip formatter={v => v + '%'} contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="pe" name="PE" fill={T.navy} radius={[3, 3, 0, 0]} />
            <Bar dataKey="credit" name="Credit" fill={T.navyL} radius={[3, 3, 0, 0]} />
            <Bar dataKey="infra" name="Infra" fill={T.sage} radius={[3, 3, 0, 0]} />
            <Bar dataKey="re" name="Real Estate" fill={T.gold} radius={[3, 3, 0, 0]} />
            <Bar dataKey="vc" name="VC" fill={T.sageL} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="% of LPs rating ESG reporting quality Good or Excellent">LP Satisfaction Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={LP_SATISFACTION}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis domain={[50, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip formatter={v => v + '%'} contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="pct" name="Satisfaction %" stroke={T.green} strokeWidth={3} dot={{ r: 5, fill: T.green }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="Working days to prepare full LP ESG report — manual vs platform">Reporting Automation Efficiency</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={REPORTING_TIME} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="method" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="days" name="Days" radius={[4, 4, 0, 0]}>
                <Cell fill={T.red} />
                <Cell fill={T.green} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
        <SectionTitle sub="Sample $1bn cross-strategy commitment — SFDR Article 8 compliant report">LP ESG Report — Key Metrics ($1bn Commitment)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
          {LP_METRICS.map(m => (
            <div key={m.label} style={{ padding: '14px 16px', background: T.surfaceH, borderRadius: 8, border: '1px solid ' + T.border }}>
              <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>
                {m.value}<span style={{ fontSize: 11, color: T.textSec, marginLeft: 2 }}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: ESG DD Workflow ────────────────────────────────────────────────────

function Tab4() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Platform ESG DD Time" value="4 days" sub="Down from 14 days (71% faster)" color={T.green} />
        <KpiCard label="DD Stages" value="8" sub="Fully integrated into deal process" color={T.navy} />
        <KpiCard label="Deals Screened 2024" value="342" sub="47 flagged, 9 killed on ESG" color={T.amber} />
        <KpiCard label="IFC PS Compliance Rate" value="94%" sub="Of assets post-close DD" color={T.sage} />
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border, marginBottom: 20 }}>
        <SectionTitle sub="8-stage workflow integrated into 90-day PE deal process — time and deal week indicated">ESG Due Diligence Workflow</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DD_STAGES.map(s => (
            <div key={s.stage} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: T.surfaceH, borderRadius: 8, border: '1px solid ' + T.border }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.stage}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.textMut, background: T.border, borderRadius: 4, padding: '2px 8px' }}>{s.time}</span>
                    <span style={{ fontSize: 11, color: T.navyL, background: '#dbeafe', borderRadius: 4, padding: '2px 8px' }}>Week {s.week}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
        <SectionTitle sub="Real deal case studies — ESG red flags that terminated or restructured investments">ESG DD Red Flags — Case Studies</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {RED_FLAGS.map(f => (
            <div key={f.id} style={{ padding: 16, borderRadius: 8, border: '1px solid ' + T.border, borderLeft: '4px solid ' + (f.outcome === 'Deal Killed' ? T.red : T.amber), background: T.surfaceH }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{f.sector}</div>
                <StatusBadge status={f.outcome === 'Deal Killed' ? 'Non-compliant' : 'Partial'} />
              </div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{f.flag}</div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: f.outcome === 'Deal Killed' ? T.red : T.amber }}>Outcome: {f.outcome}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Regulatory Compliance ──────────────────────────────────────────────

function Tab5() {
  const dotColor = { enacted: T.green, critical: T.red, upcoming: T.amber, horizon: '#7c3aed' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Compliant" value={REGULATIONS.filter(r => r.status === 'Compliant').length} sub="of 6 key regulations" color={T.green} />
        <KpiCard label="Partial Compliance" value={REGULATIONS.filter(r => r.status === 'Partial').length} sub="Remediation underway" color={T.amber} />
        <KpiCard label="Non-Compliant" value={REGULATIONS.filter(r => r.status === 'Non-compliant').length} sub="Action required urgently" color={T.red} />
        <KpiCard label="SFDR Upgrade Deadline" value="Q3 2025" sub="3 strategies — Article 8 required" color={T.navyL} />
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border, marginBottom: 20 }}>
        <SectionTitle sub="Applicability, compliance status, and deadline by regulation">Regulatory Compliance Matrix</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REGULATIONS.map(r => (
            <div key={r.reg} style={{ padding: '14px 16px', background: T.surfaceH, borderRadius: 8, border: '1px solid ' + T.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{r.reg}</div>
                <StatusBadge status={r.status} />
                <span style={{ fontSize: 11, color: T.textMut, background: T.border, borderRadius: 4, padding: '2px 8px' }}>Deadline: {r.deadline}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>{r.detail}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.applicability.map(a => (
                  <span key={a} style={{ fontSize: 11, background: '#dbeafe', color: T.navyL, borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{a}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
        <SectionTitle sub="Colour-coded: enacted (green), upcoming (amber), critical deadline (red), horizon (purple)">Regulation Timeline 2024-2027</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REG_TIMELINE.map(e => (
            <div key={e.period} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: T.textSec, flexShrink: 0 }}>{e.period}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor[e.type], flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12, color: T.text }}>{e.event}</div>
              <StatusBadge status={e.type} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 6: Value Creation Playbook ────────────────────────────────────────────

function Tab6() {
  const leverColor = cat => cat === 'E' ? T.sage : cat === 'S' ? T.navyL : T.gold;

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Portfolio ESG Score Now" value="66.8" sub="Avg across all strategies" color={T.amber} />
        <KpiCard label="ESG Score Target 24m" value="72.0" sub="+5.2 points improvement plan" color={T.green} />
        <KpiCard label="ESG Champions Identified" value="5" sub="Assets with verified value creation" color={T.navy} />
        <KpiCard label="Est. Financial Impact" value="+0.8pp IRR" sub="From ESG value creation levers" color={T.sage} />
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border, marginBottom: 20 }}>
        <SectionTitle sub="Academic and industry research supporting ESG integration in private markets">Evidence Base for ESG Value Creation</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {EVIDENCE.map(e => (
            <div key={e.source} style={{ padding: 16, borderRadius: 8, border: '1px solid ' + T.border, background: T.surfaceH, borderLeft: '4px solid ' + T.navy }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 4 }}>{e.source}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 8 }}>{e.finding}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{e.metric}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="6 ESG value creation levers — E/S/G categories with estimated MOIC impact">ESG Value Creation Levers</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VALUE_LEVERS.map(l => (
              <div key={l.lever} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: 5, background: leverColor(l.category), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{l.category}</span>
                <div style={{ flex: 1, fontSize: 12, color: T.text }}>{l.lever}</div>
                <div style={{ width: 100, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: 8, width: l.score + '%', background: leverColor(l.category), borderRadius: 4 }} />
                </div>
                <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: T.green, textAlign: 'right' }}>{l.impact}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
          <SectionTitle sub="Portfolio avg ESG score trajectory — 66.8 to 72.0 over 24 months">ESG Score Improvement Roadmap</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={SCORE_IMPROVEMENT} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis domain={[64, 74]} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="score" name="ESG Score" stroke={T.green} strokeWidth={3} dot={{ r: 5, fill: T.green }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.surface, borderRadius: 10, padding: 20, boxShadow: T.card, border: '1px solid ' + T.border }}>
        <SectionTitle sub="5 portfolio assets where targeted ESG intervention created measurable financial value">ESG Champions — Verified Value Creation</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ESG_CHAMPIONS.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: T.surfaceH, borderRadius: 8, border: '1px solid ' + T.border, borderLeft: '4px solid ' + T.sage }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.sage, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 3 }}>{c.asset}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}><strong>Intervention:</strong> {c.intervention}</div>
                <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>{c.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PrivateMarketsHubPage() {
  const [activeTab, setActiveTab] = useState(0);
  const BADGE_ITEMS = ['Hub', 'PE + Credit + Infra + RE + VC', '$8.4T AUM', 'ESG DD Engine', 'LP Reporting'];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textMut, letterSpacing: '0.08em' }}>EP-AG6</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.textMut, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: T.textMut }}>AA Impact Risk Analytics Platform</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Private Markets ESG Hub</h1>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
              Unified ESG intelligence across PE, Private Credit, Infrastructure, Real Assets and Venture Capital
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BADGE_ITEMS.map(b => (
              <span key={b} style={{ background: T.navy, color: '#fff', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: T.surface, borderRadius: 10, padding: 4, border: '1px solid ' + T.border, boxShadow: T.card, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            style={{
              flex: '0 0 auto', padding: '9px 16px', borderRadius: 7,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: activeTab === i ? T.navy : 'transparent',
              color: activeTab === i ? '#fff' : T.textSec,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 0 && <Tab1 />}
        {activeTab === 1 && <Tab2 />}
        {activeTab === 2 && <Tab3 />}
        {activeTab === 3 && <Tab4 />}
        {activeTab === 4 && <Tab5 />}
        {activeTab === 5 && <Tab6 />}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid ' + T.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 11, color: T.textMut }}>EP-AG6 · Private Markets ESG Hub · AA Impact Risk Analytics Platform</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Preqin 2024', 'ILPA Reporting Template', 'INREV ESG Guidelines', 'PRI LP DDQ', 'SFDR RTS'].map(s => (
            <span key={s} style={{ fontSize: 10, color: T.textMut }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
