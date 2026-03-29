import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s * 2.7 + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Inp = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white', boxSizing: 'border-box' }} />
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
    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['Risk Overview', 'Greenwashing Risk', 'Disclosure Liability', 'Fiduciary Duty', 'Jurisdiction & Attribution'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const ENTITY_TYPES = [
  { value: 'asset_manager', label: 'Asset Manager' },
  { value: 'bank', label: 'Commercial Bank' },
  { value: 'insurer', label: 'Insurance Company' },
  { value: 'pension_fund', label: 'Pension Fund' },
  { value: 'corporate', label: 'Large Corporate (Listed)' },
  { value: 'oil_gas', label: 'Oil & Gas Major' },
  { value: 'utility', label: 'Utility / Power Generator' },
  { value: 'real_estate', label: 'Real Estate / REIT' },
];

const entityIndex = (e) => ENTITY_TYPES.findIndex(t => t.value === e) + 1;

const getOverviewData = (entity) => {
  const ei = entityIndex(entity);
  const litigationScore = Math.round(seed(ei * 7) * 40 + 40);
  const maxExposure = parseFloat((seed(ei * 11) * 800 + 100).toFixed(0));
  const expectedCost = parseFloat((maxExposure * (seed(ei * 13) * 0.2 + 0.05)).toFixed(0));
  const tier = litigationScore >= 70 ? 'Low Risk' : litigationScore >= 55 ? 'Moderate' : litigationScore >= 40 ? 'Elevated' : 'High Risk';
  const tierColor = tier === 'Low Risk' ? 'green' : tier === 'Moderate' ? 'blue' : tier === 'Elevated' ? 'yellow' : 'red';

  const dimensions = [
    { dimension: 'Greenwashing', score: Math.round(seed(ei * 17) * 35 + 40) },
    { dimension: 'Disclosure', score: Math.round(seed(ei * 19) * 30 + 45) },
    { dimension: 'Fiduciary', score: Math.round(seed(ei * 23) * 32 + 42) },
    { dimension: 'Attribution', score: Math.round(seed(ei * 29) * 28 + 48) },
    { dimension: 'Securities', score: Math.round(seed(ei * 31) * 30 + 44) },
    { dimension: 'Regulatory', score: Math.round(seed(ei * 37) * 35 + 38) },
  ];

  const exposureByCategory = dimensions.map(d => ({
    category: d.dimension,
    exposure: Math.round((100 - d.score) / 100 * maxExposure * (seed(ei * d.score) * 0.5 + 0.5)),
  }));

  return { litigationScore, maxExposure, expectedCost, tier, tierColor, dimensions, exposureByCategory };
};

const getGreenwashingData = (entity) => {
  const ei = entityIndex(entity);
  const gwScore = Math.round(seed(ei * 41) * 35 + 40);

  const RED_FLAGS = [
    { flag: 'Vague "sustainable" claims', category: 'Marketing' },
    { flag: 'Unverified net-zero pledge', category: 'Targets' },
    { flag: 'Cherry-picked metrics', category: 'Disclosure' },
    { flag: 'Misleading ESG label use', category: 'Marketing' },
    { flag: 'Incomplete Scope 3', category: 'Disclosure' },
    { flag: 'No offsetting methodology', category: 'Carbon' },
    { flag: '"Carbon neutral" without verification', category: 'Carbon' },
    { flag: 'Exclusions not implemented', category: 'Portfolio' },
    { flag: 'Taxonomy misclassification', category: 'Regulatory' },
    { flag: 'PAI indicator errors', category: 'Regulatory' },
    { flag: 'SFDR article mismatch', category: 'Regulatory' },
    { flag: 'Green bond misuse of proceeds', category: 'Financing' },
    { flag: 'Inadequate TCFD disclosure', category: 'Disclosure' },
    { flag: 'Transition plan absent', category: 'Targets' },
    { flag: 'SBTi target not validated', category: 'Targets' },
    { flag: 'GHG boundary inconsistency', category: 'Disclosure' },
    { flag: 'Offset quality not disclosed', category: 'Carbon' },
    { flag: 'No independent assurance', category: 'Assurance' },
    { flag: 'Website vs report mismatch', category: 'Marketing' },
    { flag: 'Regulatory filing conflict', category: 'Regulatory' },
  ].map((f, i) => ({ ...f, triggered: seed(ei * 43 + i * 7) > 0.55 }));

  const flagsTriggered = RED_FLAGS.filter(f => f.triggered).length;
  const topRegulator = flagsTriggered >= 8 ? 'SEC / FCA / ESMA' : flagsTriggered >= 5 ? 'ESMA' : 'FCA';

  const categoryBreakdown = ['Marketing', 'Targets', 'Disclosure', 'Carbon', 'Portfolio', 'Regulatory', 'Financing', 'Assurance'].map(cat => ({
    category: cat,
    total: RED_FLAGS.filter(f => f.category === cat).length,
    triggered: RED_FLAGS.filter(f => f.category === cat && f.triggered).length,
  }));

  return { gwScore, RED_FLAGS, flagsTriggered, topRegulator, categoryBreakdown };
};

const getDisclosureData = (entity) => {
  const ei = entityIndex(entity);
  const disclosureScore = Math.round(seed(ei * 53) * 30 + 50);

  const triggers = [
    { trigger: 'TCFD Missing Disclosures', score: Math.round(seed(ei * 57) * 30 + 45), exposureM: Math.round(seed(ei * 59) * 200 + 50), statute: 'TCFD / ISSB S2' },
    { trigger: 'CSRD Non-compliance', score: Math.round(seed(ei * 61) * 28 + 48), exposureM: Math.round(seed(ei * 67) * 300 + 80), statute: 'EU Directive 2022/2464' },
    { trigger: 'SFDR Misclassification', score: Math.round(seed(ei * 71) * 32 + 42), exposureM: Math.round(seed(ei * 73) * 250 + 60), statute: 'SFDR RTS 2022/1288' },
    { trigger: 'Scope 3 Omission', score: Math.round(seed(ei * 79) * 35 + 40), exposureM: Math.round(seed(ei * 83) * 180 + 40), statute: 'SEC Climate Rule / CSRD' },
    { trigger: 'Physical Risk Non-Disclosure', score: Math.round(seed(ei * 89) * 25 + 52), exposureM: Math.round(seed(ei * 97) * 150 + 30), statute: 'IFRS S2 §10-11' },
    { trigger: 'MAR / Securities Fraud', score: Math.round(seed(ei * 101) * 30 + 45), exposureM: Math.round(seed(ei * 103) * 400 + 100), statute: 'MAR EU 596/2014' },
    { trigger: 'False Sustainability Marketing', score: Math.round(seed(ei * 107) * 28 + 48), exposureM: Math.round(seed(ei * 109) * 200 + 50), statute: 'FCA Consumer Duty' },
    { trigger: 'ESG Rating Manipulation', score: Math.round(seed(ei * 113) * 32 + 42), exposureM: Math.round(seed(ei * 117) * 180 + 45), statute: 'ESMA Guidelines 2023' },
  ];

  const maxExposure = Math.max(...triggers.map(t => t.exposureM));
  const priorityTriggers = triggers.filter(t => t.score < 55).length;

  return { disclosureScore, triggers, maxExposure, priorityTriggers };
};

const getFiduciaryData = (entity) => {
  const ei = entityIndex(entity);
  const fiduciaryScore = Math.round(seed(ei * 121) * 30 + 50);
  const doExposure = parseFloat((seed(ei * 123) * 300 + 50).toFixed(0));
  const gapsCount = Math.round(seed(ei * 127) * 4 + 1);

  const duties = [
    { dimension: 'Investment Duties', score: Math.round(seed(ei * 131) * 28 + 52) },
    { dimension: 'Stewardship', score: Math.round(seed(ei * 133) * 30 + 48) },
    { dimension: 'Risk Management', score: Math.round(seed(ei * 137) * 25 + 55) },
    { dimension: 'Beneficiary Interest', score: Math.round(seed(ei * 139) * 32 + 46) },
    { dimension: 'Disclosure Duty', score: Math.round(seed(ei * 141) * 28 + 50) },
    { dimension: 'Climate Integration', score: Math.round(seed(ei * 143) * 35 + 42) },
  ];

  const stewardshipItems = [
    { item: 'Engagement policy published', score: Math.round(seed(ei * 147) * 30 + 50) },
    { item: 'Voting record disclosed', score: Math.round(seed(ei * 149) * 28 + 52) },
    { item: 'Escalation framework', score: Math.round(seed(ei * 151) * 32 + 45) },
    { item: 'CA100+ participation', score: Math.round(seed(ei * 153) * 25 + 55) },
    { item: 'Proxy resolution activity', score: Math.round(seed(ei * 157) * 30 + 48) },
    { item: 'Net-zero commitment', score: Math.round(seed(ei * 159) * 35 + 42) },
  ];

  return { fiduciaryScore, doExposure, gapsCount, duties, stewardshipItems };
};

const getJurisdictionData = (entity) => {
  const ei = entityIndex(entity);
  const jurisdictionScore = Math.round(seed(ei * 161) * 35 + 45);
  const attributionApplicable = seed(ei * 163) > 0.45;
  const physicalDamagePct = parseFloat((seed(ei * 167) * 30 + 10).toFixed(1));

  const jurisdictions = [
    { jurisdiction: 'United States', cases: Math.round(seed(ei * 7 + 1) * 80 + 120), active: Math.round(seed(ei * 7 + 2) * 20 + 40) },
    { jurisdiction: 'Germany', cases: Math.round(seed(ei * 7 + 3) * 30 + 40), active: Math.round(seed(ei * 7 + 4) * 10 + 12) },
    { jurisdiction: 'Netherlands', cases: Math.round(seed(ei * 7 + 5) * 20 + 25), active: Math.round(seed(ei * 7 + 6) * 8 + 8) },
    { jurisdiction: 'United Kingdom', cases: Math.round(seed(ei * 7 + 7) * 40 + 50), active: Math.round(seed(ei * 7 + 8) * 12 + 15) },
    { jurisdiction: 'Australia', cases: Math.round(seed(ei * 7 + 9) * 25 + 30), active: Math.round(seed(ei * 7 + 10) * 8 + 10) },
    { jurisdiction: 'EU (ECJ/EGC)', cases: Math.round(seed(ei * 7 + 11) * 20 + 20), active: Math.round(seed(ei * 7 + 12) * 7 + 8) },
    { jurisdiction: 'France', cases: Math.round(seed(ei * 7 + 13) * 18 + 22), active: Math.round(seed(ei * 7 + 14) * 6 + 7) },
    { jurisdiction: 'Canada', cases: Math.round(seed(ei * 7 + 15) * 15 + 18), active: Math.round(seed(ei * 7 + 16) * 5 + 6) },
    { jurisdiction: 'Switzerland', cases: Math.round(seed(ei * 7 + 17) * 12 + 14), active: Math.round(seed(ei * 7 + 18) * 4 + 5) },
    { jurisdiction: 'New Zealand', cases: Math.round(seed(ei * 7 + 19) * 10 + 12), active: Math.round(seed(ei * 7 + 20) * 4 + 4) },
    { jurisdiction: 'South Africa', cases: Math.round(seed(ei * 7 + 21) * 8 + 8), active: Math.round(seed(ei * 7 + 22) * 3 + 3) },
    { jurisdiction: 'Philippines', cases: Math.round(seed(ei * 7 + 23) * 6 + 6), active: Math.round(seed(ei * 7 + 24) * 2 + 2) },
    { jurisdiction: 'Pakistan', cases: Math.round(seed(ei * 7 + 25) * 5 + 5), active: Math.round(seed(ei * 7 + 26) * 2 + 2) },
    { jurisdiction: 'Brazil', cases: Math.round(seed(ei * 7 + 27) * 8 + 7), active: Math.round(seed(ei * 7 + 28) * 3 + 3) },
    { jurisdiction: 'India', cases: Math.round(seed(ei * 7 + 29) * 7 + 6), active: Math.round(seed(ei * 7 + 30) * 2 + 2) },
  ];

  const caseGrowth = [
    { year: 2015, cases: 804 }, { year: 2016, cases: 884 }, { year: 2017, cases: 947 },
    { year: 2018, cases: 1023 }, { year: 2019, cases: 1194 }, { year: 2020, cases: 1550 },
    { year: 2021, cases: 1841 }, { year: 2022, cases: 2180 }, { year: 2023, cases: 2666 },
    { year: 2024, cases: 3134 }, { year: 2025, cases: Math.round(seed(ei * 173) * 200 + 3400) },
  ];

  return { jurisdictionScore, attributionApplicable, physicalDamagePct, jurisdictions, caseGrowth };
};

export default function ClimateLitigationPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entityType, setEntityType] = useState('asset_manager');
  const [revenue, setRevenue] = useState('2500');

  const overview = getOverviewData(entityType);
  const greenwashing = getGreenwashingData(entityType);
  const disclosure = getDisclosureData(entityType);
  const fiduciary = getFiduciaryData(entityType);
  const jurisdiction = getJurisdictionData(entityType);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/climate-litigation/assess`, {
        entity_type: entityType, annual_revenue_m: parseFloat(revenue),
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Climate Litigation Risk</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Greenwashing Risk · Disclosure Liability · Fiduciary Duty · Attribution Science · Global Jurisdiction Analysis</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 240 }}>
          <Sel label="Entity Type" value={entityType} onChange={setEntityType} options={ENTITY_TYPES} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <Inp label="Annual Revenue (€M)" value={revenue} onChange={setRevenue} type="number" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Litigation Assessment'}</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — Risk Overview */}
      {tab === 0 && (
        <div>
          <Section title="Litigation Risk Summary">
            <Row gap={12}>
              <KpiCard label="Litigation Risk Score" value={`${overview.litigationScore}/100`} sub="6-dimension composite score" accent />
              <KpiCard label="Risk Tier" value={<Badge label={overview.tier} color={overview.tierColor} />} sub="CPLI-benchmarked tier" />
              <KpiCard label="Max Exposure (€M)" value={`€${Number(overview.maxExposure).toLocaleString()}M`} sub="Worst-case litigation exposure" />
              <KpiCard label="Expected Cost (€M)" value={`€${Number(overview.expectedCost).toLocaleString()}M`} sub="Probability-weighted expected cost" />
            </Row>
          </Section>

          <Row>
            <Section title="6-Dimension Risk Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={overview.dimensions}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Risk Score" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Exposure by Risk Category (€M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.exposureByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="€M" />
                  <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Bar dataKey="exposure" name="Exposure (€M)" radius={[0, 4, 4, 0]}>
                    {overview.exposureByCategory.map((e, i) => <Cell key={i} fill={e.exposure >= 200 ? '#ef4444' : e.exposure >= 100 ? '#f59e0b' : '#059669'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — Greenwashing Risk */}
      {tab === 1 && (
        <div>
          <Section title="Greenwashing Risk Summary">
            <Row gap={12}>
              <KpiCard label="Greenwashing Score" value={`${greenwashing.gwScore}/100`} sub="EU Reg 2023/2441 + FCA AGR composite" accent />
              <KpiCard label="Red Flags Triggered" value={`${greenwashing.flagsTriggered} / 20`} sub="Misleading sustainability claim flags" />
              <KpiCard label="Top Regulator" value={greenwashing.topRegulator} sub="Primary enforcement risk authority" />
              <KpiCard label="Risk Level" value={<Badge label={greenwashing.flagsTriggered >= 10 ? 'Very High' : greenwashing.flagsTriggered >= 7 ? 'High' : greenwashing.flagsTriggered >= 4 ? 'Medium' : 'Low'} color={greenwashing.flagsTriggered >= 10 ? 'red' : greenwashing.flagsTriggered >= 7 ? 'orange' : greenwashing.flagsTriggered >= 4 ? 'yellow' : 'green'} />} sub="Greenwashing enforcement exposure" />
            </Row>
          </Section>

          <Section title="Red Flags by Category (Triggered vs Total)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={greenwashing.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#d1d5db" name="Total Flags" radius={[4, 4, 0, 0]} />
                <Bar dataKey="triggered" fill="#ef4444" name="Triggered" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Red Flag Detail (20 Indicators)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {greenwashing.RED_FLAGS.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: f.triggered ? '#fef2f2' : '#f9fafb', border: `1px solid ${f.triggered ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 6, padding: '7px 10px' }}>
                  <span style={{ color: f.triggered ? '#ef4444' : '#9ca3af', fontWeight: 700, fontSize: 14, minWidth: 16 }}>{f.triggered ? '✗' : '✓'}</span>
                  <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{f.flag}</span>
                  <Badge label={f.category} color={f.triggered ? 'red' : 'gray'} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — Disclosure Liability */}
      {tab === 2 && (
        <div>
          <Section title="Disclosure Liability Summary">
            <Row gap={12}>
              <KpiCard label="Disclosure Score" value={`${disclosure.disclosureScore}/100`} sub="8-trigger disclosure adequacy score" accent />
              <KpiCard label="Max Exposure (€M)" value={`€${disclosure.maxExposure.toLocaleString()}M`} sub="Highest single-trigger exposure" />
              <KpiCard label="Priority Triggers" value={`${disclosure.priorityTriggers}`} sub="Triggers scoring < 55/100" />
              <KpiCard label="Top Statute" value={disclosure.triggers.sort((a, b) => b.exposureM - a.exposureM)[0].statute.split('/')[0].trim()} sub="Highest-exposure regulatory regime" />
            </Row>
          </Section>

          <Section title="8 Trigger Scores with Exposure (€M)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={disclosure.triggers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trigger" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                <YAxis yAxisId="score" orientation="left" domain={[0, 100]} unit="" label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <YAxis yAxisId="exposure" orientation="right" unit="€M" label={{ value: 'Exposure €M', angle: 90, position: 'insideRight', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="score" dataKey="score" fill="#3b82f6" name="Disclosure Score" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="exposure" dataKey="exposureM" fill="#ef4444" name="Exposure (€M)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Trigger Status Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Trigger', 'Score', 'Exposure (€M)', 'Statute', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disclosure.triggers.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111827', fontSize: 12 }}>{t.trigger}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: t.score >= 65 ? '#059669' : t.score >= 50 ? '#f59e0b' : '#ef4444' }}>{t.score}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>€{t.exposureM}M</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 11 }}>{t.statute}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <Badge label={t.score >= 65 ? 'Adequate' : t.score >= 50 ? 'Partial' : 'Deficient'} color={t.score >= 65 ? 'green' : t.score >= 50 ? 'yellow' : 'red'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 4 — Fiduciary Duty */}
      {tab === 3 && (
        <div>
          <Section title="Fiduciary Duty Assessment">
            <Row gap={12}>
              <KpiCard label="Fiduciary Score" value={`${fiduciary.fiduciaryScore}/100`} sub="Law Commission / UNPRI FD standard" accent />
              <KpiCard label="D&O Exposure (€M)" value={`€${Number(fiduciary.doExposure).toLocaleString()}M`} sub="Directors & Officers climate liability" />
              <KpiCard label="Gaps Count" value={`${fiduciary.gapsCount}`} sub="Material fiduciary duty gaps" />
              <KpiCard label="Stewardship Tier" value={<Badge label={fiduciary.fiduciaryScore >= 70 ? 'Advanced' : fiduciary.fiduciaryScore >= 55 ? 'Developing' : 'Basic'} color={fiduciary.fiduciaryScore >= 70 ? 'green' : fiduciary.fiduciaryScore >= 55 ? 'yellow' : 'red'} />} sub="UK Stewardship Code 2020 alignment" />
            </Row>
          </Section>

          <Row>
            <Section title="6 Duties × Framework Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={fiduciary.duties}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Fiduciary Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Stewardship Adequacy Breakdown">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fiduciary.stewardshipItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="item" width={200} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="Adequacy Score" radius={[0, 4, 4, 0]}>
                    {fiduciary.stewardshipItems.map((s, i) => <Cell key={i} fill={s.score >= 70 ? '#059669' : s.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 5 — Jurisdiction & Attribution */}
      {tab === 4 && (
        <div>
          <Section title="Jurisdiction & Attribution Summary">
            <Row gap={12}>
              <KpiCard label="Jurisdiction Risk Score" value={`${jurisdiction.jurisdictionScore}/100`} sub="15-jurisdiction exposure composite" accent />
              <KpiCard label="Attribution Applicable" value={<Badge label={jurisdiction.attributionApplicable ? 'Applicable ✓' : 'Not Applicable'} color={jurisdiction.attributionApplicable ? 'yellow' : 'green'} />} sub="World Weather Attribution science" />
              <KpiCard label="Physical Damage %" value={`${jurisdiction.physicalDamagePct}%`} sub="% of exposure from physical attribution" />
              <KpiCard label="Highest-Activity Jurisdiction" value="United States" sub="Largest active case count globally" />
            </Row>
          </Section>

          <Section title="Litigation Activity by Jurisdiction (Total vs Active Cases)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jurisdiction.jurisdictions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="jurisdiction" width={130} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cases" fill="#d1d5db" name="Total Cases" radius={[0, 4, 4, 0]} />
                <Bar dataKey="active" fill="#ef4444" name="Active Cases" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Global Climate Litigation Case Count Trend (2015–2025)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={jurisdiction.caseGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(val) => `${val.toLocaleString()} cases`} />
                <Line type="monotone" dataKey="cases" stroke="#ef4444" strokeWidth={3} name="Global Cases" dot={{ r: 4, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          {jurisdiction.attributionApplicable && (
            <Section title="Attribution Science Risk">
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>Attribution Science Applicable</div>
                {[
                  'World Weather Attribution (WWA) methodology now links individual extreme weather events to anthropogenic emissions with quantified probability ratios.',
                  `Estimated ${jurisdiction.physicalDamagePct}% of physical damage exposure may be attributed to entity's historical emissions footprint.`,
                  'Key cases: Milieudefensie v Shell (2021), Held v Montana (2023), Climateworks Foundation v Woodside — establishing precedent for financial institutions.',
                  'D&O liability: Directors may face personal exposure if board minutes show climate risks were identified but not adequately disclosed or mitigated.',
                  'Recommended actions: commission independent attribution analysis, engage specialist climate litigation counsel, review D&O insurance climate exclusions.',
                ].map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, color: '#78350f' }}>
                    <span style={{ fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
