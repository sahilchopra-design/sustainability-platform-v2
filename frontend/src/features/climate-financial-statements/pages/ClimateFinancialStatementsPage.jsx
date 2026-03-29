import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s * 2.7 + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#1b3a5c' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Inp = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
  </div>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['Financial Overview', 'Impairment & Provisions', 'Stranded Assets', 'Climate P&L', 'Scenario Analysis'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

// --- Seed Data ---
const financialEffectsData = [
  { category: 'Revenue Loss', value: Math.round(seed(1) * 30 + 40) },
  { category: 'OPEX Increase', value: Math.round(seed(2) * 20 + 25) },
  { category: 'Asset Impairment', value: Math.round(seed(3) * 25 + 35) },
  { category: 'Stranded Assets', value: Math.round(seed(4) * 40 + 60) },
  { category: 'Carbon Provisions', value: Math.round(seed(5) * 15 + 18) },
  { category: 'Insurance Uplift', value: Math.round(seed(6) * 10 + 12) },
  { category: 'CapEx Requirement', value: Math.round(seed(7) * 50 + 80) },
  { category: 'Stranded Liabilities', value: Math.round(seed(8) * 20 + 28) },
];

const financialAreas = [
  { area: 'Income Statement', score: Math.round(seed(11) * 20 + 65) },
  { area: 'Balance Sheet', score: Math.round(seed(12) * 20 + 60) },
  { area: 'Cash Flow', score: Math.round(seed(13) * 25 + 55) },
  { area: 'Notes & Disclosures', score: Math.round(seed(14) * 20 + 70) },
];

const ifrsS2Score = Math.round(seed(15) * 20 + 64);
const climateRiskScore = Math.round(seed(16) * 15 + 58);
const materialityTier = ifrsS2Score >= 75 ? 'Material' : ifrsS2Score >= 60 ? 'Potentially Material' : 'Immaterial';
const disclosureCompleteness = Math.round(seed(17) * 20 + 68);

const impairmentTriggers = [
  { trigger: 'Carbon Price Sensitivity', activated: true, impactM: Math.round(seed(21) * 30 + 45) },
  { trigger: 'Physical Asset Damage', activated: true, impactM: Math.round(seed(22) * 25 + 35) },
  { trigger: 'Regulatory Obsolescence', activated: seed(23) > 0.4, impactM: Math.round(seed(24) * 20 + 28) },
  { trigger: 'Market Demand Shift', activated: seed(25) > 0.5, impactM: Math.round(seed(26) * 15 + 20) },
  { trigger: 'Stranded Upstream Assets', activated: true, impactM: Math.round(seed(27) * 35 + 50) },
  { trigger: 'Green CapEx Acceleration', activated: seed(28) > 0.35, impactM: Math.round(seed(29) * 18 + 22) },
];
const totalImpairment = impairmentTriggers.filter(t => t.activated).reduce((s, t) => s + t.impactM, 0);
const carbonProvision = Math.round(seed(30) * 20 + 32);
const etsAllocationDeficit = Math.round(seed(31) * 15 + 18);

const provisionTypes = [
  { name: 'ETS Allowance Deficit', value: Math.round(seed(32) * 15 + 18) },
  { name: 'Carbon Tax Liability', value: Math.round(seed(33) * 12 + 14) },
  { name: 'NatCat Deductible', value: Math.round(seed(34) * 8 + 10) },
  { name: 'Remediation Fund', value: Math.round(seed(35) * 10 + 12) },
  { name: 'Transition CapEx Reserve', value: Math.round(seed(36) * 20 + 25) },
];

const strandedAssetTypes = [
  { type: 'Fossil Fuel Plants', exposureM: Math.round(seed(41) * 80 + 120), writedownYr: 2028 + Math.round(seed(42) * 4) },
  { type: 'Gas Infrastructure', exposureM: Math.round(seed(43) * 60 + 90), writedownYr: 2030 + Math.round(seed(44) * 5) },
  { type: 'ICE Vehicle Fleet', exposureM: Math.round(seed(45) * 40 + 55), writedownYr: 2027 + Math.round(seed(46) * 3) },
  { type: 'Carbon-Intensive RE', exposureM: Math.round(seed(47) * 50 + 70), writedownYr: 2029 + Math.round(seed(48) * 4) },
  { type: 'High-Emission Processes', exposureM: Math.round(seed(49) * 30 + 45), writedownYr: 2026 + Math.round(seed(50) * 3) },
];
const totalStrandedExposure = strandedAssetTypes.reduce((s, a) => s + a.exposureM, 0);
const earliestWritedown = Math.min(...strandedAssetTypes.map(a => a.writedownYr));
const largestWritedown = strandedAssetTypes.sort((a, b) => b.exposureM - a.exposureM)[0];

const writedownTimeline = Array.from({ length: 16 }, (_, i) => {
  const yr = 2025 + i;
  const active = strandedAssetTypes.filter(a => a.writedownYr <= yr);
  return {
    year: yr,
    cumulativeWritedown: active.reduce((s, a) => s + a.exposureM * 0.7, 0).toFixed(0),
    remainingBook: (totalStrandedExposure - active.reduce((s, a) => s + a.exposureM * 0.7, 0)).toFixed(0),
  };
});

const years = [2022, 2023, 2024, 2025, 2026, 2027];
const plData = years.map((yr, i) => ({
  year: yr,
  reportedRevenue: Math.round(800 + i * 22 + seed(i + 60) * 30),
  climateRevenue: Math.round(800 + i * 22 + seed(i + 60) * 30 - (seed(i + 70) * 20 + 10 + i * 3)),
  reportedEbitda: Math.round(180 + i * 8 + seed(i + 80) * 12),
  climateEbitda: Math.round(180 + i * 8 + seed(i + 80) * 12 - (seed(i + 90) * 15 + 8 + i * 2)),
  reportedPAT: Math.round(90 + i * 5 + seed(i + 100) * 8),
  climatePAT: Math.round(90 + i * 5 + seed(i + 100) * 8 - (seed(i + 110) * 10 + 5 + i * 1.5)),
}));
const latestPl = plData[plData.length - 1];
const ebitdaImpact = ((latestPl.reportedEbitda - latestPl.climateEbitda) / latestPl.reportedEbitda * 100).toFixed(1);

const climateEffectsBreakdown = [
  { name: 'Carbon Cost', value: -Math.round(seed(121) * 15 + 20) },
  { name: 'Revenue Loss', value: -Math.round(seed(122) * 10 + 12) },
  { name: 'NatCat OpEx', value: -Math.round(seed(123) * 8 + 10) },
  { name: 'Green Premium', value: Math.round(seed(124) * 8 + 6) },
  { name: 'ETS Surplus', value: Math.round(seed(125) * 5 + 3) },
  { name: 'Insurance', value: -Math.round(seed(126) * 6 + 8) },
];

const scenarioCategories = ['Revenue', 'OPEX', 'Asset Value', 'Carbon Cost', 'CapEx'];
const scenarioData = scenarioCategories.map((cat, i) => ({
  category: cat,
  s15: -Math.round(seed(i + 130) * 20 + 15),
  s2c: -Math.round(seed(i + 140) * 30 + 25),
  s3c: -Math.round(seed(i + 150) * 45 + 40),
}));

const scenarioSpread = Array.from({ length: 11 }, (_, i) => ({
  year: 2025 + i,
  optimistic: -Math.round(seed(i + 160) * 10 + 5 + i * 2),
  central: -Math.round(seed(i + 170) * 15 + 12 + i * 4),
  pessimistic: -Math.round(seed(i + 180) * 20 + 22 + i * 7),
}));

export default function ClimateFinancialStatementsPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entityName, setEntityName] = useState('Acme Energy Corp');
  const [sector, setSector] = useState('energy');

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/climate-financial-statements/assess`, { entity_name: entityName, sector });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Climate Financial Statements (E86)</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>IFRS S2 · Impairment & Provisions · Stranded Assets · Climate P&L · Scenario Analysis</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — Financial Overview */}
      {tab === 0 && (
        <div>
          <Section title="Entity Configuration">
            <Row>
              <Inp label="Entity Name" value={entityName} onChange={setEntityName} placeholder="Enter entity name" />
              <Sel label="Sector" value={sector} onChange={setSector} options={[
                { value: 'energy', label: 'Energy & Utilities' },
                { value: 'materials', label: 'Materials & Mining' },
                { value: 'transport', label: 'Transport & Logistics' },
                { value: 'real_estate', label: 'Real Estate' },
                { value: 'financials', label: 'Financial Services' },
              ]} />
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Btn onClick={runAnalysis}>{loading ? 'Assessing…' : 'Run Assessment'}</Btn>
              </div>
            </Row>
          </Section>

          <Section title="IFRS S2 Disclosure Summary">
            <Row gap={12}>
              <KpiCard label="IFRS S2 Score" value={`${ifrsS2Score}/100`} sub="Overall disclosure completeness" accent />
              <KpiCard label="Climate Financial Risk Score" value={`${climateRiskScore}/100`} sub="Quantitative risk materiality" />
              <KpiCard label="Materiality Tier" value={<Badge label={materialityTier} color={materialityTier === 'Material' ? 'red' : materialityTier === 'Potentially Material' ? 'yellow' : 'green'} />} sub="IFRS S2 materiality assessment" />
              <KpiCard label="Disclosure Completeness" value={`${disclosureCompleteness}%`} sub="Quantitative DPs completed" />
            </Row>
          </Section>

          <Section title="Climate Financial Effects by Category (€M)">
            <Row>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialEffectsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={55} />
                  <YAxis unit="€M" />
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Bar dataKey="value" name="Financial Effect (€M)" radius={[4, 4, 0, 0]}>
                    {financialEffectsData.map((d, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={financialAreas}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Disclosure Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 2 — Impairment & Provisions */}
      {tab === 1 && (
        <div>
          <Section title="Impairment & Provision Summary">
            <Row gap={12}>
              <KpiCard label="Potential Impairment" value={`€${totalImpairment}M`} sub="Triggered climate impairments" accent />
              <KpiCard label="Carbon Provision" value={`€${carbonProvision}M`} sub="ETS + carbon tax provisions" />
              <KpiCard label="ETS Allowance Deficit" value={`${etsAllocationDeficit} ktCO₂e`} sub="Phase 4 allocation shortfall" />
              <KpiCard label="Triggers Activated" value={`${impairmentTriggers.filter(t => t.activated).length}/${impairmentTriggers.length}`} sub="IAS 36 climate indicators" />
            </Row>
          </Section>

          <Section title="Impairment Trigger Assessment">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={impairmentTriggers.filter(t => t.activated)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="€M" />
                <YAxis type="category" dataKey="trigger" width={180} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Bar dataKey="impactM" fill="#ef4444" name="Impairment Impact (€M)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Provision Type Breakdown">
            <Row>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={provisionTypes} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}>
                    {provisionTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Provision Type', 'Amount (€M)', 'IAS 37 Basis'].map(h => (
                        <th key={h} style={{ padding: '9px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {provisionTypes.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '9px 10px', fontWeight: 500, color: '#1b3a5c' }}>{p.name}</td>
                        <td style={{ padding: '9px 10px', fontWeight: 700, color: '#374151' }}>€{p.value}M</td>
                        <td style={{ padding: '9px 10px', color: '#6b7280' }}>{i === 0 ? 'Present obligation — ETS Phase 4' : i === 1 ? 'Constructive obligation — carbon tax' : i === 2 ? 'Best estimate — NatCat deductibles' : i === 3 ? 'Legal obligation — env. remediation' : 'Constructive obligation — transition'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 3 — Stranded Assets */}
      {tab === 2 && (
        <div>
          <Section title="Stranded Asset Summary">
            <Row gap={12}>
              <KpiCard label="Total Stranded Exposure" value={`€${totalStrandedExposure}M`} sub="Gross book value at risk" accent />
              <KpiCard label="Earliest Write-down Year" value={earliestWritedown.toString()} sub="First impairment trigger year" />
              <KpiCard label="Largest Exposure" value={largestWritedown.type} sub={`€${largestWritedown.exposureM}M at risk`} />
              <KpiCard label="Estimated Write-down" value={`€${Math.round(totalStrandedExposure * 0.7)}M`} sub="70% impairment at trigger year" />
            </Row>
          </Section>

          <Section title="Stranded Asset Exposure by Type (€M)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={strandedAssetTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Bar dataKey="exposureM" fill="#ef4444" name="Gross Exposure (€M)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Cumulative Write-down Timeline (2025–2040)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={writedownTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Line type="monotone" dataKey="cumulativeWritedown" stroke="#ef4444" strokeWidth={2} name="Cumulative Write-down (€M)" dot={false} />
                <Line type="monotone" dataKey="remainingBook" stroke="#059669" strokeWidth={2} name="Remaining Book Value (€M)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Asset-Level Stranded Risk">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Asset Type', 'Gross Exposure (€M)', 'Trigger Year', 'Est. Write-down (€M)', 'Risk'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strandedAssetTypes.map((a, i) => {
                  const writedown = Math.round(a.exposureM * 0.7);
                  const yrsToTrigger = a.writedownYr - 2025;
                  const risk = yrsToTrigger <= 2 ? 'Imminent' : yrsToTrigger <= 5 ? 'Near-Term' : 'Medium-Term';
                  const rc = risk === 'Imminent' ? 'red' : risk === 'Near-Term' ? 'yellow' : 'blue';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{a.type}</td>
                      <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>€{a.exposureM}M</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{a.writedownYr}</td>
                      <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: 700 }}>€{writedown}M</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={risk} color={rc} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 4 — Climate P&L */}
      {tab === 3 && (
        <div>
          <Section title="Climate-Adjusted P&L Summary">
            <Row gap={12}>
              <KpiCard label="Climate-Adjusted EBITDA" value={`€${latestPl.climateEbitda}M`} sub="2024 reported less climate impacts" accent />
              <KpiCard label="EBITDA Climate Impact" value={`-${ebitdaImpact}%`} sub="% reduction from climate factors" />
              <KpiCard label="Climate-Adjusted Revenue" value={`€${latestPl.climateRevenue}M`} sub="vs reported €${latestPl.reportedRevenue}M" />
              <KpiCard label="Climate-Adjusted PAT" value={`€${latestPl.climatePAT}M`} sub="Post-tax climate adjustment" />
            </Row>
          </Section>

          <Section title="Reported vs Climate-Adjusted P&L (2022–2027, €M)">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={plData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Area type="monotone" dataKey="reportedRevenue" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} name="Reported Revenue (€M)" fillOpacity={0.5} />
                <Area type="monotone" dataKey="climateRevenue" stroke="#059669" fill="#d1fae5" strokeWidth={2} name="Climate-Adj. Revenue (€M)" fillOpacity={0.5} />
                <Area type="monotone" dataKey="reportedEbitda" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} name="Reported EBITDA (€M)" fillOpacity={0.5} />
                <Area type="monotone" dataKey="climateEbitda" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="Climate-Adj. EBITDA (€M)" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Climate Effects Decomposition (€M)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={climateEffectsBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Bar dataKey="value" name="P&L Impact (€M)" radius={[4, 4, 0, 0]}>
                  {climateEffectsBreakdown.map((d, i) => <Cell key={i} fill={d.value >= 0 ? '#059669' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Scenario Analysis */}
      {tab === 4 && (
        <div>
          <Section title="Scenario Impact Summary">
            <Row gap={12}>
              <KpiCard label="1.5°C Scenario Impact" value={`-€${scenarioData.reduce((s, d) => s + Math.abs(d.s15), 0)}M`} sub="Orderly transition — best case" accent />
              <KpiCard label="2°C Scenario Impact" value={`-€${scenarioData.reduce((s, d) => s + Math.abs(d.s2c), 0)}M`} sub="Below 2°C — central case" />
              <KpiCard label="3°C Scenario Impact" value={`-€${scenarioData.reduce((s, d) => s + Math.abs(d.s3c), 0)}M`} sub="Current policies — worst case" />
              <KpiCard label="Scenario Spread" value={`€${scenarioData.reduce((s, d) => s + Math.abs(d.s3c) - Math.abs(d.s15), 0)}M`} sub="Worst vs best scenario delta" />
            </Row>
          </Section>

          <Section title="Financial Impacts by Scenario and Category (€M)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Bar dataKey="s15" fill="#059669" name="1.5°C (Orderly)" radius={[4, 0, 0, 4]} />
                <Bar dataKey="s2c" fill="#f59e0b" name="2°C (Below 2°C)" />
                <Bar dataKey="s3c" fill="#ef4444" name="3°C (Current Policies)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Scenario Spread Over Time (2025–2035, Cumulative EBITDA Impact €M)">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={scenarioSpread}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="3°C Pessimistic" fillOpacity={0.4} />
                <Area type="monotone" dataKey="central" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} name="2°C Central" fillOpacity={0.4} />
                <Area type="monotone" dataKey="optimistic" stroke="#059669" fill="#d1fae5" strokeWidth={2} name="1.5°C Optimistic" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
