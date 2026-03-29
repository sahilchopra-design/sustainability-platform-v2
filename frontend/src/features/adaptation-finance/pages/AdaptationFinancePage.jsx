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
  const colors = {
    green: { bg: '#d1fae5', text: '#065f46' },
    yellow: { bg: '#fef3c7', text: '#92400e' },
    red: { bg: '#fee2e2', text: '#991b1b' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    gray: { bg: '#f3f4f6', text: '#374151' },
    purple: { bg: '#ede9fe', text: '#5b21b6' },
  };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['GFMA Alignment', 'Resilience Delta', 'GARI Scoring', 'Investment Sizing & NPV', 'Portfolio Overview'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
const RCP_SCENARIOS = [
  { value: '1.5c', label: '1.5°C (Paris Target)' },
  { value: '2c', label: '2°C (Below 2°C)' },
  { value: '3c', label: '3°C (Delayed Action)' },
  { value: '4c', label: '4°C (Current Policies)' },
];
const PROJECT_CATEGORIES = [
  { value: 'coastal_protection', label: 'Coastal & Flood Protection' },
  { value: 'water_security', label: 'Water Security' },
  { value: 'agriculture', label: 'Climate-Smart Agriculture' },
  { value: 'health', label: 'Health System Resilience' },
  { value: 'ecosystems', label: 'Ecosystem-Based Adaptation' },
  { value: 'urban', label: 'Urban Resilience' },
  { value: 'infrastructure', label: 'Climate-Resilient Infrastructure' },
  { value: 'drr', label: 'Disaster Risk Reduction' },
];

// Seed data
const gfmaCategoryData = [
  { name: 'Coastal & Flood', value: Math.round(seed(1) * 10 + 18) },
  { name: 'Water Security', value: Math.round(seed(2) * 10 + 15) },
  { name: 'Climate-Smart Ag.', value: Math.round(seed(3) * 8 + 14) },
  { name: 'Health Resilience', value: Math.round(seed(4) * 8 + 10) },
  { name: 'Ecosystem-Based', value: Math.round(seed(5) * 7 + 12) },
  { name: 'Urban Resilience', value: Math.round(seed(6) * 8 + 11) },
  { name: 'Resilient Infra.', value: Math.round(seed(7) * 9 + 13) },
  { name: 'DRR', value: Math.round(seed(8) * 6 + 7) },
];
const projectAlignmentData = gfmaCategoryData.map((c, i) => ({
  category: c.name.substring(0, 14),
  alignmentScore: Math.round(seed(i + 10) * 35 + 55),
}));
const coBenefits = [
  { category: 'Coastal & Flood', ecosystemServices: 'Mangrove restoration, blue carbon', social: 'Flood-protected households', economic: 'Prevented asset losses' },
  { category: 'Water Security', ecosystemServices: 'Aquifer recharge, wetland health', social: 'Clean water access', economic: 'Agricultural productivity' },
  { category: 'Climate-Smart Ag.', ecosystemServices: 'Soil carbon, biodiversity', social: 'Food security, livelihoods', economic: 'Yield stability, export value' },
  { category: 'Urban Resilience', ecosystemServices: 'Urban greening, heat island', social: 'Vulnerable community protection', economic: 'Reduced cooling costs' },
];
const hazardResilienceData = [
  { hazard: 'Coastal Flooding', baseline: 72, postInvest: 41, reduction: 43 },
  { hazard: 'River Flooding', baseline: 68, postInvest: 38, reduction: 44 },
  { hazard: 'Extreme Heat', baseline: 61, postInvest: 45, reduction: 26 },
  { hazard: 'Drought', baseline: 75, postInvest: 48, reduction: 36 },
  { hazard: 'Storm Surge', baseline: 80, postInvest: 52, reduction: 35 },
  { hazard: 'Wildfire', baseline: 55, postInvest: 40, reduction: 27 },
  { hazard: 'Landslide', baseline: 63, postInvest: 44, reduction: 30 },
  { hazard: 'Sea Level Rise', baseline: 70, postInvest: 55, reduction: 21 },
  { hazard: 'Salinisation', baseline: 58, postInvest: 42, reduction: 28 },
  { hazard: 'Vector Diseases', baseline: 65, postInvest: 46, reduction: 29 },
];
const rcpSensitivity = {
  '1.5c': hazardResilienceData.map(h => ({ ...h, postInvest: h.postInvest - 5 })),
  '2c': hazardResilienceData,
  '3c': hazardResilienceData.map(h => ({ ...h, postInvest: Math.min(h.postInvest + 8, h.baseline - 2) })),
  '4c': hazardResilienceData.map(h => ({ ...h, postInvest: Math.min(h.postInvest + 18, h.baseline - 1) })),
};
const gariCriteria = [
  { criterion: 'Additionality', score: Math.round(seed(31) * 30 + 55) },
  { criterion: 'Effectiveness', score: Math.round(seed(32) * 35 + 50) },
  { criterion: 'Sustainability', score: Math.round(seed(33) * 30 + 52) },
  { criterion: 'Scalability', score: Math.round(seed(34) * 35 + 45) },
  { criterion: 'Co-benefits', score: Math.round(seed(35) * 30 + 58) },
  { criterion: 'Governance', score: Math.round(seed(36) * 25 + 60) },
];
const npvByRate = [
  { rate: '3%', npv: Math.round(seed(41) * 50 + 120) },
  { rate: '5%', npv: Math.round(seed(42) * 40 + 85) },
  { rate: '8%', npv: Math.round(seed(43) * 30 + 55) },
];
const mdbFacilities = [
  { name: 'World Bank PPCR', tier: 'Concessional', minSize: 5, eligible: true },
  { name: 'ADB ACEF', tier: 'Grant+Loan', minSize: 10, eligible: true },
  { name: 'EBRD GEFF', tier: 'Credit Line', minSize: 15, eligible: seed(51) > 0.3 },
  { name: 'IFC DCAF', tier: 'Equity+Debt', minSize: 20, eligible: seed(52) > 0.4 },
  { name: 'GCF Readiness', tier: 'Grant', minSize: 2, eligible: true },
  { name: 'GEF LDCF', tier: 'Grant', minSize: 3, eligible: true },
  { name: 'IADB PROGREEN', tier: 'Loan', minSize: 25, eligible: seed(53) > 0.45 },
  { name: 'KfW CLIM. INV.', tier: 'Soft Loan', minSize: 30, eligible: seed(54) > 0.5 },
];
const portfolioBreakdown = gfmaCategoryData.map((c, i) => ({
  category: c.name.substring(0, 12),
  BR: Math.round(seed(i + 61) * 30 + 10),
  IN: Math.round(seed(i + 71) * 25 + 8),
  PH: Math.round(seed(i + 81) * 20 + 5),
}));
const bankabilityDist = [
  { tier: 'Bankable', count: Math.round(seed(91) * 5 + 6) },
  { tier: 'Nearly Bankable', count: Math.round(seed(92) * 4 + 4) },
  { tier: 'Requires TA', count: Math.round(seed(93) * 3 + 3) },
  { tier: 'Pre-Bankable', count: Math.round(seed(94) * 2 + 2) },
];

export default function AdaptationFinancePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rcpScenario, setRcpScenario] = useState('2c');
  const [projectCategory, setProjectCategory] = useState('coastal_protection');
  const [investmentSize, setInvestmentSize] = useState('50');
  const [result, setResult] = useState(null);

  const gfmaTotal = gfmaCategoryData.reduce((s, c) => s + c.value, 0);
  const gfmaAlignment = Math.round(seed(101) * 20 + 72);
  const gariComposite = Math.round(gariCriteria.reduce((s, c) => s + c.score, 0) / gariCriteria.length);
  const gariTier = gariComposite >= 70 ? 'Tier 1' : gariComposite >= 55 ? 'Tier 2' : 'Tier 3';
  const gariTierColor = gariTier === 'Tier 1' ? 'green' : gariTier === 'Tier 2' ? 'blue' : 'yellow';
  const avgRiskReduction = Math.round(hazardResilienceData.reduce((s, h) => s + h.reduction, 0) / hazardResilienceData.length);
  const activeSensitivity = rcpSensitivity[rcpScenario] || hazardResilienceData;
  const bcrValue = (Math.round(seed(102) * 20 + 18) / 10).toFixed(1);
  const costPerBeneficiary = Math.round(seed(103) * 200 + 150);
  const livesProtected = Math.round(seed(104) * 80000 + 40000);
  const totalInvestment = Math.round(seed(105) * 200 + 150);
  const blendedRatio = Math.round(seed(106) * 30 + 40);
  const napAlignment = Math.round(seed(107) * 20 + 72);
  const portfolioScore = Math.round((gfmaAlignment + gariComposite) / 2);
  const portfolioTier = portfolioScore >= 70 ? 'Strong' : portfolioScore >= 55 ? 'Developing' : 'Nascent';

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}/api/v1/adaptation-finance/assess`, {
        project_category: projectCategory, investment_size_m: parseFloat(investmentSize), rcp_scenario: rcpScenario,
      });
      setResult(r.data);
    } catch {
      void 0 /* API fallback to seed data */; setResult({});
    } finally { setLoading(false); }
  };

  const bcrWaterfallData = [
    { name: 'Base Benefit', value: 2.8, color: '#059669' },
    { name: 'Climate Uplift', value: 0.6, color: '#3b82f6' },
    { name: 'Co-benefits', value: 0.4, color: '#f59e0b' },
    { name: 'Transaction Cost', value: -0.3, color: '#ef4444' },
    { name: 'BCR Total', value: parseFloat(bcrValue), color: '#059669' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Adaptation Finance</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>GFMA · GARI · Resilience Delta · MDB Facilities · NAP/NDC Alignment · E83</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: 'none', color: tab === i ? '#059669' : '#6b7280',
            borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — GFMA Alignment */}
      {tab === 0 && (
        <div>
          <Section title="GFMA Adaptation Category Analysis">
            <Row gap={12}>
              <KpiCard label="GFMA Alignment %" value={`${gfmaAlignment}%`} sub="Against GFMA 2023 taxonomy" accent />
              <KpiCard label="Total Portfolio (€M)" value={`€ ${gfmaTotal}M`} sub="Committed + pipeline" />
              <KpiCard label="Categories Active" value={gfmaCategoryData.length} sub="Across 8 GFMA sectors" />
              <KpiCard label="Top Category" value={gfmaCategoryData.sort((a, b) => b.value - a.value)[0].name} sub="By portfolio weight" />
            </Row>
          </Section>

          <Section title="Adaptation Portfolio by GFMA Category">
            <Row>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={gfmaCategoryData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, value }) => `${name}: €${value}M`}>
                    {gfmaCategoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `€ ${val}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <Section title="Project Alignment Scores by Category">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={projectAlignmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="alignmentScore" fill="#059669" name="Alignment Score" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              </div>
            </Row>
          </Section>

          <Section title="Co-Benefits by Category">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Category', 'Ecosystem Services', 'Social Co-Benefits', 'Economic Co-Benefits'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coBenefits.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.category}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.ecosystemServices}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.social}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.economic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 2 — Resilience Delta */}
      {tab === 1 && (
        <div>
          <Section title="RCP Scenario Selector">
            <Row>
              <Sel label="RCP / Warming Scenario" value={rcpScenario} onChange={setRcpScenario} options={RCP_SCENARIOS} />
              <div />
            </Row>
          </Section>

          <Section title={`Resilience Delta — Baseline vs Post-Investment (${rcpScenario.toUpperCase()})`}>
            <Row gap={12}>
              <KpiCard label="Avg Risk Reduction" value={`${avgRiskReduction}%`} sub="Across 10 hazards" accent />
              <KpiCard label="RCP Scenario" value={rcpScenario.toUpperCase()} sub="Climate scenario sensitivity" />
              <KpiCard label="Largest Reduction" value={`${Math.max(...activeSensitivity.map(h => h.baseline - h.postInvest))}pts`} sub="Best-performing hazard" />
              <KpiCard label="Residual Risk" value={`${Math.round(activeSensitivity.reduce((s, h) => s + h.postInvest, 0) / activeSensitivity.length)}/100`} sub="Post-investment avg" />
            </Row>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activeSensitivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hazard" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#ef4444" name="Baseline Risk Score" opacity={0.7} />
                <Bar dataKey="postInvest" fill="#059669" name="Post-Investment Risk" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Hazard-Specific Resilience Delta">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Hazard', 'Baseline Risk', 'Post-Investment', 'Risk Reduction', 'Effectiveness'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSensitivity.map((r, i) => {
                  const reduction = r.baseline - r.postInvest;
                  const pct = Math.round((reduction / r.baseline) * 100);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.hazard}</td>
                      <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: 600 }}>{r.baseline}</td>
                      <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 600 }}>{r.postInvest}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>↓ {reduction} pts ({pct}%)</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={pct >= 40 ? 'High' : pct >= 28 ? 'Medium' : 'Low'} color={pct >= 40 ? 'green' : pct >= 28 ? 'blue' : 'yellow'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — GARI Scoring */}
      {tab === 2 && (
        <div>
          <Section title="GARI Composite Score">
            <Row gap={12}>
              <KpiCard label="GARI Composite Score" value={`${gariComposite}/100`} sub="6-criteria weighted average" accent />
              <KpiCard label="GARI Tier" value={<Badge label={gariTier} color={gariTierColor} />} sub="Grant Allocation & Access criteria" />
              <KpiCard label="Highest Criterion" value={gariCriteria.sort((a, b) => b.score - a.score)[0].criterion} sub={`Score: ${gariCriteria[0].score}/100`} />
              <KpiCard label="Gap Criteria" value={gariCriteria.filter(c => c.score < 55).length} sub="Below threshold (55/100)" />
            </Row>
          </Section>

          <Section title="GARI 6-Criteria Radar">
            <Row>
              <div>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={gariCriteria}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="GARI Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <Section title="Gap Analysis vs Benchmark">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Criterion', 'Score', 'Benchmark', 'Gap'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gariCriteria.map((c, i) => {
                        const benchmark = 70;
                        const gap = benchmark - c.score;
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px', color: '#374151', fontWeight: 500 }}>{c.criterion}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444' }}>{c.score}</td>
                            <td style={{ padding: '8px 10px', color: '#6b7280' }}>{benchmark}</td>
                            <td style={{ padding: '8px 10px', color: gap > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                              {gap > 0 ? `–${gap}` : `+${Math.abs(gap)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Section>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 4 — Investment Sizing & NPV */}
      {tab === 3 && (
        <div>
          <Section title="Investment Parameters">
            <Row>
              <Sel label="Project Category" value={projectCategory} onChange={setProjectCategory} options={PROJECT_CATEGORIES} />
              <Inp label="Investment Size (€M)" value={investmentSize} onChange={setInvestmentSize} type="number" placeholder="50" />
            </Row>
            <Btn onClick={runAnalysis}>Calculate NPV & BCR</Btn>
          </Section>

          <Section title="Benefit-Cost Ratio Decomposition">
            <Row gap={12}>
              <KpiCard label="Benefit-Cost Ratio" value={`${bcrValue}x`} sub="Social + economic benefits" accent />
              <KpiCard label="Cost per Beneficiary" value={`€ ${costPerBeneficiary}`} sub="Per person protected" />
              <KpiCard label="Lives Protected" value={livesProtected.toLocaleString()} sub="Estimated beneficiaries" />
              <KpiCard label="NPV (5% rate)" value={`€ ${npvByRate[1].npv}M`} sub="Net Present Value" />
            </Row>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bcrWaterfallData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="x" />
                <Tooltip formatter={(val) => `${val}x`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="BCR Component">
                  {bcrWaterfallData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="NPV Sensitivity by Discount Rate">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={npvByRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rate" />
                <YAxis unit="M€" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="npv" stroke="#059669" strokeWidth={2} dot={{ r: 6 }} name="NPV (€M)" />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="MDB Facility Eligibility">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Facility', 'Finance Type', 'Min. Project Size', 'Eligible', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mdbFacilities.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: r.eligible ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.name}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{r.tier}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>€ {r.minSize}M</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 18, color: r.eligible ? '#059669' : '#9ca3af' }}>{r.eligible ? '✓' : '✗'}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={r.eligible ? 'Apply' : 'Ineligible'} color={r.eligible ? 'green' : 'gray'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Portfolio Overview */}
      {tab === 4 && (
        <div>
          <Section title="Portfolio Adaptation Score">
            <Row gap={12}>
              <KpiCard label="Portfolio Adaptation Score" value={`${portfolioScore}/100`} sub="GFMA + GARI composite" accent />
              <KpiCard label="Portfolio Tier" value={<Badge label={portfolioTier} color={portfolioTier === 'Strong' ? 'green' : portfolioTier === 'Developing' ? 'blue' : 'yellow'} />} sub="Adaptation maturity" />
              <KpiCard label="Total Investment" value={`€ ${totalInvestment}M`} sub="Committed + pipeline" />
              <KpiCard label="Blended Finance Ratio" value={`${blendedRatio}%`} sub="MDB + private co-finance" />
            </Row>
            <div style={{ marginTop: 12 }}>
              <Row gap={12}>
                <KpiCard label="NAP/NDC Alignment" value={`${napAlignment}%`} sub="National Adaptation Plan coverage" />
                <KpiCard label="GFMA Alignment" value={`${gfmaAlignment}%`} sub="Global Adaptation taxonomy" />
                <KpiCard label="GARI Score" value={`${gariComposite}/100`} sub="Grant Access & Quality" />
                <KpiCard label="Lives Protected" value={livesProtected.toLocaleString()} sub="Beneficiary estimate" />
              </Row>
            </div>
          </Section>

          <Section title="Project Breakdown by Category and Region">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={portfolioBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={45} />
                <YAxis unit="M€" />
                <Tooltip />
                <Legend />
                <Bar dataKey="BR" stackId="a" fill="#059669" name="Brazil" />
                <Bar dataKey="IN" stackId="a" fill="#3b82f6" name="India" />
                <Bar dataKey="PH" stackId="a" fill="#f59e0b" name="Philippines" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Project Bankability Tier Distribution">
            <Row>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={bankabilityDist} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="tier" label={({ tier, count }) => `${tier}: ${count}`}>
                    {bankabilityDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>Portfolio Enhancement Priorities</div>
                  {[
                    `Strengthen NAP integration: target ${Math.min(napAlignment + 10, 95)}% alignment through country partnership agreements`,
                    `Blended finance: increase private co-investment ratio from ${blendedRatio}% to ${Math.min(blendedRatio + 12, 70)}% via GCF and IFC mobilisation`,
                    `GARI improvement: Scalability (${gariCriteria.find(c => c.criterion === 'Scalability')?.score}/100) requires technical assistance programme`,
                    `Bankability: ${bankabilityDist.find(t => t.tier === 'Pre-Bankable')?.count} pre-bankable projects need capacity building support`,
                    `MDB pipeline: ${mdbFacilities.filter(f => f.eligible).length}/8 facilities eligible — submit applications for GCF Readiness (shortest lead time)`,
                    `Lives protected target: scale to ${(livesProtected * 1.4).toLocaleString()} by 2027 through DRR category expansion`,
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151' }}>
                      <span style={{ color: '#059669', fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Row>
          </Section>
        </div>
      )}
    </div>
  );
}
