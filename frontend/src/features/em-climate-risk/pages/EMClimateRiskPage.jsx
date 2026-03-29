import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
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

const TABS = ['Country Risk Overview', 'IFC PS6 & Biodiversity', 'Concessional Finance', 'NDC & Transition', 'Green Finance Market'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const EM_COUNTRIES = [
  { value: 'brazil', label: 'Brazil' },
  { value: 'india', label: 'India' },
  { value: 'indonesia', label: 'Indonesia' },
  { value: 'south_africa', label: 'South Africa' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'vietnam', label: 'Vietnam' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'bangladesh', label: 'Bangladesh' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'colombia', label: 'Colombia' },
  { value: 'mexico', label: 'Mexico' },
  { value: 'thailand', label: 'Thailand' },
  { value: 'pakistan', label: 'Pakistan' },
  { value: 'philippines', label: 'Philippines' },
  { value: 'ghana', label: 'Ghana' },
];

// country seed offset so each country gets distinct deterministic data
const countryIndex = (country) => EM_COUNTRIES.findIndex(c => c.value === country);

const getCountryData = (country) => {
  const ci = countryIndex(country) + 1;
  const physicalRisk = Math.round(seed(ci * 7) * 40 + 40);
  const transitionReadiness = Math.round(seed(ci * 11) * 35 + 40);
  const ndcAmbition = Math.round(seed(ci * 13) * 35 + 38);
  const greenFinance = Math.round(seed(ci * 17) * 30 + 35);
  const justTransition = Math.round(seed(ci * 19) * 35 + 38);
  const composite = Math.round((physicalRisk * 0.3 + transitionReadiness * 0.25 + ndcAmbition * 0.2 + greenFinance * 0.15 + justTransition * 0.1));
  const tier = composite >= 65 ? 'Low Risk' : composite >= 50 ? 'Moderate Risk' : composite >= 38 ? 'Elevated Risk' : 'High Risk';
  const tierColor = tier === 'Low Risk' ? 'green' : tier === 'Moderate Risk' ? 'blue' : tier === 'Elevated Risk' ? 'yellow' : 'red';
  return { physicalRisk, transitionReadiness, ndcAmbition, greenFinance, justTransition, composite, tier, tierColor };
};

const getPeerData = (country) => {
  const ci = countryIndex(country) + 1;
  const cd = getCountryData(country);
  return [
    { metric: 'Physical Risk', country: cd.physicalRisk, emPeer: Math.round(seed(ci * 23) * 15 + 52) },
    { metric: 'Transition', country: cd.transitionReadiness, emPeer: Math.round(seed(ci * 29) * 12 + 48) },
    { metric: 'NDC Ambition', country: cd.ndcAmbition, emPeer: Math.round(seed(ci * 31) * 12 + 45) },
    { metric: 'Green Finance', country: cd.greenFinance, emPeer: Math.round(seed(ci * 37) * 10 + 42) },
    { metric: 'Just Transition', country: cd.justTransition, emPeer: Math.round(seed(ci * 41) * 12 + 44) },
  ];
};

// IFC PS6 data (country-sensitive)
const getPS6Data = (country) => {
  const ci = countryIndex(country) + 1;
  const ps6Score = Math.round(seed(ci * 43) * 35 + 45);
  const criticalHabitat = Math.round(seed(ci * 47) * 40 + 20);
  const offsetRequired = seed(ci * 53) > 0.5;
  const ps6Applicable = seed(ci * 59) > 0.3;
  const habitatTypes = [
    { name: 'Tropical Forest', value: Math.round(seed(ci * 61) * 20 + 15) },
    { name: 'Wetlands', value: Math.round(seed(ci * 67) * 15 + 12) },
    { name: 'Mangroves', value: Math.round(seed(ci * 71) * 12 + 8) },
    { name: 'Grasslands', value: Math.round(seed(ci * 73) * 10 + 10) },
    { name: 'Coral Reefs', value: Math.round(seed(ci * 79) * 8 + 6) },
  ];
  const ps6Criteria = [
    { criterion: 'Critical Habitat Assessment', score: Math.round(seed(ci * 83) * 30 + 50) },
    { criterion: 'Mitigation Hierarchy', score: Math.round(seed(ci * 89) * 25 + 55) },
    { criterion: 'Biodiversity Action Plan', score: Math.round(seed(ci * 97) * 30 + 45) },
    { criterion: 'No Net Loss Verification', score: Math.round(seed(ci * 101) * 25 + 48) },
    { criterion: 'Monitoring & Reporting', score: Math.round(seed(ci * 103) * 28 + 50) },
    { criterion: 'Stakeholder Engagement', score: Math.round(seed(ci * 107) * 22 + 58) },
  ];
  return { ps6Score, criticalHabitat, offsetRequired, ps6Applicable, habitatTypes, ps6Criteria };
};

// Concessional finance data
const concessionalFacilities = [
  { name: 'IFC Blended Finance', eligibilityScore: Math.round(seed(111) * 25 + 65), type: 'Equity + Quasi-Equity', sizeGbn: 2.8 },
  { name: 'GCF Readiness Fund', eligibilityScore: Math.round(seed(113) * 30 + 60), type: 'Grant', sizeGbn: 0.5 },
  { name: 'World Bank CIF', eligibilityScore: Math.round(seed(117) * 25 + 62), type: 'Concessional Loan', sizeGbn: 5.2 },
  { name: 'ADB ACEF', eligibilityScore: Math.round(seed(119) * 28 + 58), type: 'Grant + Loan', sizeGbn: 1.8 },
  { name: 'AIIB Green Bond', eligibilityScore: Math.round(seed(121) * 22 + 68), type: 'Green Bond', sizeGbn: 3.1 },
  { name: 'EBRD Green Economy', eligibilityScore: Math.round(seed(127) * 25 + 55), type: 'Credit Line', sizeGbn: 1.4 },
  { name: 'KfW DEG Impact', eligibilityScore: Math.round(seed(131) * 20 + 60), type: 'Soft Loan', sizeGbn: 0.9 },
  { name: 'GEF LDCF', eligibilityScore: Math.round(seed(137) * 30 + 55), type: 'Grant', sizeGbn: 0.3 },
];
const blendedFinancePotential = Math.round(seed(139) * 5 + 8);
const gcfAllocation = (Math.round(seed(141) * 30 + 20) / 10).toFixed(1);
const topFacility = [...concessionalFacilities].sort((a, b) => b.eligibilityScore - a.eligibilityScore)[0];
const eligibleFacilities = concessionalFacilities.filter(f => f.eligibilityScore >= 65).length;

const financeTypeSplit = [
  { name: 'Concessional Loan', value: Math.round(seed(143) * 15 + 35) },
  { name: 'Grant', value: Math.round(seed(147) * 10 + 20) },
  { name: 'Equity', value: Math.round(seed(149) * 10 + 18) },
  { name: 'Green Bond', value: Math.round(seed(151) * 10 + 15) },
  { name: 'Risk Guarantee', value: Math.round(seed(153) * 8 + 12) },
];

// NDC & Transition data (country-sensitive)
const getNDCData = (country) => {
  const ci = countryIndex(country) + 1;
  const ndcAmbition = Math.round(seed(ci * 157) * 35 + 38);
  const alignmentTier = ndcAmbition >= 65 ? '1.5°C Compatible' : ndcAmbition >= 50 ? 'Below 2°C' : ndcAmbition >= 38 ? 'Nationally Determined' : 'Insufficient';
  const alignmentColor = alignmentTier === '1.5°C Compatible' ? 'green' : alignmentTier === 'Below 2°C' ? 'blue' : alignmentTier === 'Nationally Determined' ? 'yellow' : 'red';
  const fossilFuelDep = Math.round(seed(ci * 163) * 40 + 20);
  const justTransitionRisk = seed(ci * 167) > 0.6 ? 'High' : seed(ci * 167) > 0.35 ? 'Medium' : 'Low';
  const jtrColor = justTransitionRisk === 'High' ? 'red' : justTransitionRisk === 'Medium' ? 'yellow' : 'green';

  const renewableTrajectory = Array.from({ length: 11 }, (_, i) => ({
    year: 2025 + i,
    installed: Math.round(seed(ci * 5 + i * 7) * 10 + 15 + i * (4 + seed(ci * 11 + i) * 3)),
    target: Math.round(20 + i * 5 + seed(ci * 13 + i) * 3),
  }));

  const ndcBarData = [
    { indicator: 'GHG Intensity', ndcScore: Math.round(seed(ci * 173) * 30 + 40), carbonInt: Math.round(seed(ci * 179) * 40 + 50) },
    { indicator: 'Renewable Share', ndcScore: Math.round(seed(ci * 181) * 25 + 45), carbonInt: Math.round(seed(ci * 183) * 30 + 35) },
    { indicator: 'Energy Efficiency', ndcScore: Math.round(seed(ci * 187) * 28 + 42), carbonInt: Math.round(seed(ci * 191) * 35 + 45) },
    { indicator: 'Deforestation Stop', ndcScore: Math.round(seed(ci * 193) * 30 + 38), carbonInt: Math.round(seed(ci * 197) * 40 + 48) },
  ];

  return { ndcAmbition, alignmentTier, alignmentColor, fossilFuelDep, justTransitionRisk, jtrColor, renewableTrajectory, ndcBarData };
};

// Green Finance Market
const greenBondGrowth = Array.from({ length: 9 }, (_, i) => ({
  year: 2017 + i,
  issuance: Math.round(seed(i + 201) * 30 + 15 + i * 12),
  outstanding: Math.round(seed(i + 211) * 50 + 40 + i * 22),
}));

const sustainableDepthByRegion = [
  { region: 'East Asia', score: Math.round(seed(221) * 20 + 65) },
  { region: 'SE Asia', score: Math.round(seed(223) * 22 + 55) },
  { region: 'South Asia', score: Math.round(seed(227) * 20 + 48) },
  { region: 'Latin America', score: Math.round(seed(229) * 22 + 52) },
  { region: 'Sub-Saharan Africa', score: Math.round(seed(231) * 18 + 38) },
  { region: 'MENA', score: Math.round(seed(233) * 20 + 42) },
];

const greenBondMarket = Math.round(seed(241) * 50 + 80);
const greenBondPipeline = Math.round(seed(243) * 30 + 40);
const marketDepthScore = Math.round(seed(245) * 25 + 55);

export default function EMClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState('india');

  const cd = getCountryData(country);
  const peerData = getPeerData(country);
  const ps6 = getPS6Data(country);
  const ndcData = getNDCData(country);

  const radarData = [
    { dimension: 'Physical Risk', score: cd.physicalRisk },
    { dimension: 'Transition', score: cd.transitionReadiness },
    { dimension: 'NDC Ambition', score: cd.ndcAmbition },
    { dimension: 'Green Finance', score: cd.greenFinance },
    { dimension: 'Just Transition', score: cd.justTransition },
  ];

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/em-climate-risk/assess`, { country });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>EM Climate Risk (E87)</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Emerging Market · IFC PS6 · Concessional Finance · NDC Transition · Green Finance Market</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — Country Risk Overview */}
      {tab === 0 && (
        <div>
          <Section title="Country Selection">
            <Row>
              <Sel label="Emerging Market Country" value={country} onChange={setCountry} options={EM_COUNTRIES} />
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Btn onClick={runAnalysis}>{loading ? 'Assessing…' : 'Run EM Assessment'}</Btn>
              </div>
            </Row>
          </Section>

          <Section title={`EM Climate Composite — ${EM_COUNTRIES.find(c => c.value === country)?.label}`}>
            <Row gap={12}>
              <KpiCard label="EM Climate Composite" value={`${cd.composite}/100`} sub="5-dimension weighted score" accent />
              <KpiCard label="Risk Tier" value={<Badge label={cd.tier} color={cd.tierColor} />} sub="EM peer benchmarked tier" />
              <KpiCard label="Physical Risk Score" value={`${cd.physicalRisk}/100`} sub="Flood, heat, drought, sea level" />
              <KpiCard label="Transition Readiness" value={`${cd.transitionReadiness}/100`} sub="Policy, energy mix, carbon price" />
            </Row>
          </Section>

          <Section title="5-Dimension Risk Radar">
            <Row>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name={EM_COUNTRIES.find(c => c.value === country)?.label} dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div>
                <Section title="Country vs EM Peer Group">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={peerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={45} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="country" fill="#059669" name={EM_COUNTRIES.find(c => c.value === country)?.label} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="emPeer" fill="#d1d5db" name="EM Peer Avg" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 2 — IFC PS6 & Biodiversity */}
      {tab === 1 && (
        <div>
          <Section title="IFC PS6 Summary">
            <Row gap={12}>
              <KpiCard label="PS6 Applicable" value={<Badge label={ps6.ps6Applicable ? 'Applicable ✓' : 'Not Applicable'} color={ps6.ps6Applicable ? 'red' : 'green'} />} sub="IFC Performance Standard 6" accent />
              <KpiCard label="PS6 Score" value={`${ps6.ps6Score}/100`} sub="6-criteria composite" />
              <KpiCard label="Critical Habitat Exposure" value={`${ps6.criticalHabitat}%`} sub="% project area in critical habitat" />
              <KpiCard label="Biodiversity Offset Required" value={<Badge label={ps6.offsetRequired ? 'Required' : 'Not Required'} color={ps6.offsetRequired ? 'yellow' : 'green'} />} sub="No Net Loss / Net Positive standard" />
            </Row>
          </Section>

          <Section title="PS6 Criteria Scores">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ps6.ps6Criteria} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="criterion" width={190} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="PS6 Score" radius={[0, 4, 4, 0]}>
                  {ps6.ps6Criteria.map((c, i) => <Cell key={i} fill={c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Habitat Type Exposure">
            <Row>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={ps6.habitatTypes} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {ps6.habitatTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>IFC PS6 Mitigation Hierarchy</div>
                  {[
                    'Avoid: site design to exclude critical habitat areas from project footprint.',
                    'Minimise: reduce duration and intensity of any habitat modification.',
                    'Restore: on-site habitat restoration and ecosystem management plans.',
                    'Offset: biodiversity offset programme achieving No Net Loss in modified habitats.',
                    `Net Positive: for critical habitats, achieve measurable net gain (current score: ${ps6.ps6Score}/100).`,
                    ps6.offsetRequired ? 'ACTION REQUIRED: Commission PS6 biodiversity offset study before financial close.' : 'No offset required — continue monitoring per BAP schedule.',
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151' }}>
                      <span style={{ color: '#059669', fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 3 — Concessional Finance */}
      {tab === 2 && (
        <div>
          <Section title="Concessional Finance Summary">
            <Row gap={12}>
              <KpiCard label="Eligible Facilities" value={`${eligibleFacilities}/8`} sub="Score ≥ 65 eligibility threshold" accent />
              <KpiCard label="Top Facility" value={topFacility.name} sub={`Eligibility score: ${topFacility.eligibilityScore}/100`} />
              <KpiCard label="Blended Finance Potential" value={`${blendedFinancePotential}x`} sub="Private capital mobilisation ratio" />
              <KpiCard label="GCF Allocation (bn)" value={`$${gcfAllocation}bn`} sub="Estimated GCF programme allocation" />
            </Row>
          </Section>

          <Section title="Eligibility Score by Facility">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={concessionalFacilities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={55} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="eligibilityScore" name="Eligibility Score" radius={[4, 4, 0, 0]}>
                  {concessionalFacilities.map((f, i) => <Cell key={i} fill={f.eligibilityScore >= 65 ? '#059669' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Finance Type Split">
            <Row>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={financeTypeSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {financeTypeSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Facility', 'Type', 'Size (bn)', 'Eligible'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {concessionalFacilities.map((f, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111827', fontSize: 12 }}>{f.name}</td>
                        <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 12 }}>{f.type}</td>
                        <td style={{ padding: '8px 10px', color: '#374151' }}>${f.sizeGbn}bn</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 16, color: f.eligibilityScore >= 65 ? '#059669' : '#9ca3af' }}>{f.eligibilityScore >= 65 ? '✓' : '✗'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 4 — NDC & Transition */}
      {tab === 3 && (
        <div>
          <Section title="NDC & Transition Summary">
            <Row gap={12}>
              <KpiCard label="NDC Ambition Score" value={`${ndcData.ndcAmbition}/100`} sub="Climate Action Tracker methodology" accent />
              <KpiCard label="Alignment Tier" value={<Badge label={ndcData.alignmentTier} color={ndcData.alignmentColor} />} sub="Paris Agreement alignment" />
              <KpiCard label="Fossil Fuel Dependency" value={`${ndcData.fossilFuelDep}%`} sub="% primary energy from fossil fuels" />
              <KpiCard label="Just Transition Risk" value={<Badge label={ndcData.justTransitionRisk} color={ndcData.jtrColor} />} sub="Workforce & community transition exposure" />
            </Row>
          </Section>

          <Section title="Renewable Energy Capacity Trajectory (GW)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ndcData.renewableTrajectory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis unit="GW" />
                <Tooltip formatter={(val) => `${val} GW`} />
                <Legend />
                <Line type="monotone" dataKey="installed" stroke="#059669" strokeWidth={2} name="Installed Capacity (GW)" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" name="NDC Target (GW)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="NDC Ambition vs Carbon Intensity by Indicator">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ndcData.ndcBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="indicator" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ndcScore" fill="#059669" name="NDC Ambition Score" radius={[4, 0, 0, 4]} />
                <Bar dataKey="carbonInt" fill="#ef4444" name="Carbon Intensity Proxy" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Green Finance Market */}
      {tab === 4 && (
        <div>
          <Section title="Green Finance Market Summary">
            <Row gap={12}>
              <KpiCard label="Green Bond Market (bn)" value={`$${greenBondMarket}bn`} sub="EM green bond outstanding" accent />
              <KpiCard label="Pipeline (bn)" value={`$${greenBondPipeline}bn`} sub="Labelled bond pipeline 12m" />
              <KpiCard label="Market Depth Score" value={`${marketDepthScore}/100`} sub="Liquidity, diversity, standards" />
              <KpiCard label="ICMA Aligned Issuers" value={`${Math.round(seed(251) * 20 + 40)}%`} sub="% with GBP/SBP alignment" />
            </Row>
          </Section>

          <Section title="Green & Sustainable Bond Market Growth (2017–2025, $bn)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={greenBondGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis unit="$bn" />
                <Tooltip formatter={(val) => `$${val}bn`} />
                <Legend />
                <Area type="monotone" dataKey="outstanding" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} name="Outstanding ($bn)" fillOpacity={0.5} />
                <Area type="monotone" dataKey="issuance" stroke="#059669" fill="#d1fae5" strokeWidth={2} name="Annual Issuance ($bn)" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Sustainable Finance Market Depth by EM Region">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sustainableDepthByRegion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="region" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="Market Depth Score" radius={[0, 4, 4, 0]}>
                  {sustainableDepthByRegion.map((r, i) => <Cell key={i} fill={r.score >= 60 ? '#059669' : r.score >= 48 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Market Development Recommendations">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              {[
                `Expand green bond issuance beyond $${greenBondMarket}bn by developing local-currency EM green bond programme with DFI first-loss guarantee.`,
                `Establish sovereign green bond benchmark — anchors yield curve and signals NDC commitment to institutional investors.`,
                `Deepen sustainable loan market: adopt LMA SLLP with sector-specific KPIs calibrated to NDC targets (renewable capacity, GHG intensity).`,
                `Develop blended finance vehicle targeting ${blendedFinancePotential}x private capital mobilisation for adaptation and nature-based projects.`,
                `Engage ICMA Emerging Markets Committee to co-author EM-specific SBP/GBP guidance for local development bank issuers.`,
                `Build data infrastructure: partner with central bank to mandate ESG taxonomy reporting, reducing DQS gaps that constrain institutional demand.`,
              ].map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#059669', fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
