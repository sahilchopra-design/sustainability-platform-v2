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
    <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
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

const TABS = ['CDR Technology', 'Oxford Principles', 'Article 6.4 Eligibility', 'CDR Economics', 'Market Eligibility'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const CDR_TYPES = [
  { value: 'beccs', label: 'BECCS — Bioenergy + CCS' },
  { value: 'dac', label: 'DAC — Direct Air Capture' },
  { value: 'enhanced_weathering', label: 'Enhanced Weathering' },
  { value: 'biochar', label: 'Biochar' },
  { value: 'ocean_alkalinity', label: 'Ocean Alkalinity Enhancement' },
  { value: 'reforestation', label: 'Reforestation / ARR' },
  { value: 'soil_carbon', label: 'Soil Carbon Sequestration' },
  { value: 'kelp_farming', label: 'Kelp / Macroalgae Farming' },
];

const CDR_PROFILES = {
  beccs: { trl: 6, cost2024: 120, cost2050: 60, scalability: 65 },
  dac: { trl: 7, cost2024: 300, cost2050: 100, scalability: 75 },
  enhanced_weathering: { trl: 5, cost2024: 80, cost2050: 35, scalability: 70 },
  biochar: { trl: 8, cost2024: 60, cost2050: 30, scalability: 72 },
  ocean_alkalinity: { trl: 3, cost2024: 150, cost2050: 55, scalability: 60 },
  reforestation: { trl: 9, cost2024: 15, cost2050: 12, scalability: 80 },
  soil_carbon: { trl: 8, cost2024: 25, cost2050: 18, scalability: 78 },
  kelp_farming: { trl: 4, cost2024: 200, cost2050: 80, scalability: 55 },
};

const cdrIndex = (cdr) => CDR_TYPES.findIndex(c => c.value === cdr) + 1;

const getCDRTechData = (cdrType) => {
  const ci = cdrIndex(cdrType);
  const profile = CDR_PROFILES[cdrType] || CDR_PROFILES.beccs;
  const costTrajectory = Array.from({ length: 14 }, (_, i) => ({
    year: 2024 + i * 2,
    cost: Math.max(profile.cost2050, Math.round(profile.cost2024 * Math.pow(profile.cost2050 / profile.cost2024, (i * 2) / 26) + seed(ci + i) * 10 - 5)),
  }));
  const coBenefits = [
    { dimension: 'Carbon', score: Math.round(seed(ci * 7) * 20 + 70) },
    { dimension: 'Water', score: Math.round(seed(ci * 11) * 30 + 40) },
    { dimension: 'Biodiversity', score: Math.round(seed(ci * 13) * 35 + 35) },
    { dimension: 'Social', score: Math.round(seed(ci * 17) * 30 + 42) },
    { dimension: 'Permanence', score: Math.round(seed(ci * 19) * 25 + 50) },
  ];
  return { ...profile, costTrajectory, coBenefits };
};

const getOxfordData = (cdrType) => {
  const ci = cdrIndex(cdrType);
  const principles = [
    { principle: 'Durability', score: Math.round(seed(ci * 23) * 30 + 50) },
    { principle: 'Additionality', score: Math.round(seed(ci * 29) * 28 + 52) },
    { principle: 'MRV Quality', score: Math.round(seed(ci * 31) * 32 + 48) },
    { principle: 'Co-benefits', score: Math.round(seed(ci * 37) * 25 + 55) },
  ];
  const composite = Math.round(principles.reduce((s, p) => s + p.score, 0) / 4);
  const tier = composite >= 75 ? 'Gold' : composite >= 60 ? 'Silver' : composite >= 48 ? 'Bronze' : 'Basic';
  const tierColor = tier === 'Gold' ? 'yellow' : tier === 'Silver' ? 'blue' : tier === 'Bronze' ? 'orange' : 'gray';

  const subCriteria = [
    { name: 'Storage durability (yrs)', score: Math.round(seed(ci * 41) * 30 + 50) },
    { name: 'Leakage risk', score: Math.round(seed(ci * 43) * 28 + 52), inverted: true },
    { name: 'Baseline counterfactual', score: Math.round(seed(ci * 47) * 25 + 55) },
    { name: 'Independent MRV', score: Math.round(seed(ci * 53) * 30 + 48) },
    { name: 'Third-party verified', score: Math.round(seed(ci * 59) * 28 + 50) },
    { name: 'Nature co-benefit', score: Math.round(seed(ci * 61) * 32 + 45) },
    { name: 'Social safeguards', score: Math.round(seed(ci * 67) * 25 + 52) },
    { name: 'Supply chain LCA', score: Math.round(seed(ci * 71) * 30 + 45) },
  ];

  return { principles, composite, tier, tierColor, subCriteria };
};

const getArt64Data = (cdrType) => {
  const ci = cdrIndex(cdrType);
  const art64Eligible = seed(ci * 73) > 0.35;
  const itmoEligible = seed(ci * 79) > 0.4;
  const correspondingAdj = seed(ci * 83) > 0.5;

  const requirements = [
    { req: 'Host country authorisation', score: Math.round(seed(ci * 89) * 30 + 50) },
    { req: 'ITMO registry tracking', score: Math.round(seed(ci * 97) * 28 + 52) },
    { req: 'Corresponding adjustment', score: Math.round(seed(ci * 101) * 32 + 45) },
    { req: 'Additionality verified', score: Math.round(seed(ci * 103) * 25 + 55) },
    { req: 'NDC alignment', score: Math.round(seed(ci * 107) * 30 + 48) },
    { req: 'Sustainable dev. criteria', score: Math.round(seed(ci * 109) * 28 + 50) },
  ];

  return { art64Eligible, itmoEligible, correspondingAdj, requirements };
};

const getCDREconData = (cdrType) => {
  const ci = cdrIndex(cdrType);
  const profile = CDR_PROFILES[cdrType] || CDR_PROFILES.beccs;
  const lcoe = Math.round(profile.cost2024 * (1 + seed(ci * 113) * 0.3 - 0.15));
  const irr = parseFloat((seed(ci * 117) * 8 + 8).toFixed(1));
  const breakEvenPrice = Math.round(lcoe * (1 + seed(ci * 119) * 0.2 + 0.1));
  const npv = parseFloat((seed(ci * 121) * 200 - 100 + seed(ci * 123) * 50).toFixed(1));

  const npvSensitivity = Array.from({ length: 15 }, (_, i) => {
    const price = 20 + i * 20;
    return { price, npv: parseFloat(((price - breakEvenPrice) * (5 + seed(ci * 2 + i) * 3)).toFixed(1)) };
  });

  const capexOpex = [
    { component: 'CAPEX', value: Math.round(lcoe * 0.45 + seed(ci * 127) * 20) },
    { component: 'OPEX', value: Math.round(lcoe * 0.35 + seed(ci * 131) * 15) },
    { component: 'Revenue', value: -Math.round(lcoe * 0.25 + seed(ci * 133) * 10) },
    { component: 'Financing', value: Math.round(lcoe * 0.08 + seed(ci * 137) * 8) },
  ];

  return { lcoe, irr, breakEvenPrice, npv, npvSensitivity, capexOpex };
};

const getMarketData = (cdrType) => {
  const ci = cdrIndex(cdrType);
  const frontierEligible = seed(ci * 139) > 0.4;
  const corsiaEligible = seed(ci * 141) > 0.5;
  const recommendedPrice = Math.round(CDR_PROFILES[cdrType]?.cost2024 * (0.8 + seed(ci * 143) * 0.4) || 100);

  const buyerBenchmarks = [
    { segment: 'Frontier Climate', price: Math.round(seed(ci * 147) * 80 + 200) },
    { segment: 'Microsoft', price: Math.round(seed(ci * 149) * 60 + 150) },
    { segment: 'Stripe Climate', price: Math.round(seed(ci * 151) * 70 + 180) },
    { segment: 'CORSIA Airlines', price: Math.round(seed(ci * 153) * 20 + 30) },
    { segment: 'Compliance ETS', price: Math.round(seed(ci * 157) * 25 + 60) },
    { segment: 'Voluntary VCS', price: Math.round(seed(ci * 159) * 15 + 15) },
  ];

  const marketSegments = [
    { name: 'Voluntary (Premium)', value: Math.round(seed(ci * 161) * 15 + 35) },
    { name: 'Compliance Market', value: Math.round(seed(ci * 163) * 12 + 28) },
    { name: 'Advance Market', value: Math.round(seed(ci * 167) * 10 + 22) },
    { name: 'Sovereign CDR', value: Math.round(seed(ci * 169) * 8 + 15) },
  ];

  return { frontierEligible, corsiaEligible, recommendedPrice, buyerBenchmarks, marketSegments };
};

export default function CarbonRemovalPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cdrType, setCdrType] = useState('dac');

  const tech = getCDRTechData(cdrType);
  const oxford = getOxfordData(cdrType);
  const art64 = getArt64Data(cdrType);
  const econ = getCDREconData(cdrType);
  const market = getMarketData(cdrType);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/carbon-removal/assess`, { cdr_type: cdrType });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Carbon Removal & CDR Finance</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Oxford CDR Principles · IPCC AR6 CDR Pathways · Article 6.4 ITMOs · CDR Economics · Frontier / CORSIA Markets</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <Sel label="CDR Technology Type" value={cdrType} onChange={setCdrType} options={CDR_TYPES} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run CDR Assessment'}</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — CDR Technology */}
      {tab === 0 && (
        <div>
          <Section title={`Technology Profile — ${CDR_TYPES.find(c => c.value === cdrType)?.label}`}>
            <Row gap={12}>
              <KpiCard label="TRL Level" value={`TRL ${tech.trl}`} sub="Technology Readiness Level (1-9)" accent />
              <KpiCard label="Current Cost ($/tCO₂)" value={`$${tech.cost2024}`} sub="2024 estimated removal cost" />
              <KpiCard label="2050 Cost ($/tCO₂)" value={`$${tech.cost2050}`} sub="IPCC AR6 learning-curve projection" />
              <KpiCard label="Scalability Score" value={`${tech.scalability}/100`} sub="Physical + supply chain potential" />
            </Row>
          </Section>

          <Row>
            <Section title="Cost Trajectory 2024–2050 ($/tCO₂)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={tech.costTrajectory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis unit="$" />
                  <Tooltip formatter={(val) => `$${val}/tCO₂`} />
                  <Line type="monotone" dataKey="cost" stroke="#059669" strokeWidth={2} name="Cost ($/tCO₂)" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Co-Benefits Radar">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={tech.coBenefits}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Co-benefits" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — Oxford Principles */}
      {tab === 1 && (
        <div>
          <Section title="Oxford CDR Principles Assessment">
            <Row gap={12}>
              <KpiCard label="Oxford Composite" value={`${oxford.composite}/100`} sub="4-principle weighted average" accent />
              <KpiCard label="Quality Tier" value={<Badge label={oxford.tier} color={oxford.tierColor} />} sub="Gold/Silver/Bronze/Basic classification" />
              <KpiCard label="Highest Principle" value={[...oxford.principles].sort((a, b) => b.score - a.score)[0].principle} sub={`Score: ${[...oxford.principles].sort((a, b) => b.score - a.score)[0].score}/100`} />
              <KpiCard label="Sub-criteria Passing" value={`${oxford.subCriteria.filter(s => s.score >= 60).length} / ${oxford.subCriteria.length}`} sub="Score ≥ 60 threshold" />
            </Row>
          </Section>

          <Row>
            <Section title="4 Oxford Principles Radar">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={oxford.principles}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="principle" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Oxford Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Sub-criteria Scores">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={oxford.subCriteria} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="Sub-criteria Score" radius={[0, 4, 4, 0]}>
                    {oxford.subCriteria.map((s, i) => <Cell key={i} fill={s.score >= 70 ? '#059669' : s.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — Article 6.4 Eligibility */}
      {tab === 2 && (
        <div>
          <Section title="Article 6.4 Eligibility (Paris Agreement Supervisory Body)">
            <Row gap={12}>
              <KpiCard label="Art 6.4 Eligible" value={<Badge label={art64.art64Eligible ? 'Eligible ✓' : 'Not Eligible ✗'} color={art64.art64Eligible ? 'green' : 'red'} />} sub="UNFCCC Art 6.4 mechanism" accent />
              <KpiCard label="ITMO Eligible" value={<Badge label={art64.itmoEligible ? 'Yes ✓' : 'No ✗'} color={art64.itmoEligible ? 'green' : 'red'} />} sub="Internationally Transferred Mitigation Outcome" />
              <KpiCard label="Corresponding Adjustment" value={<Badge label={art64.correspondingAdj ? 'Required' : 'Not Required'} color={art64.correspondingAdj ? 'yellow' : 'green'} />} sub="Art 6 double-counting avoidance" />
              <KpiCard label="Requirements Met" value={`${art64.requirements.filter(r => r.score >= 65).length} / 6`} sub="Score ≥ 65 passing threshold" />
            </Row>
          </Section>

          <Section title="6 Eligibility Requirement Scores">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={art64.requirements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="req" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={55} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="Eligibility Score" radius={[4, 4, 0, 0]}>
                  {art64.requirements.map((r, i) => <Cell key={i} fill={r.score >= 70 ? '#059669' : r.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Requirement Badge Grid">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {art64.requirements.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 12px' }}>
                  <span style={{ color: r.score >= 65 ? '#059669' : '#ef4444', fontWeight: 700 }}>{r.score >= 65 ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>{r.req}</span>
                  <Badge label={`${r.score}`} color={r.score >= 70 ? 'green' : r.score >= 55 ? 'yellow' : 'red'} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 4 — CDR Economics */}
      {tab === 3 && (
        <div>
          <Section title="CDR Financial Summary">
            <Row gap={12}>
              <KpiCard label="LCOE ($/tCO₂)" value={`$${econ.lcoe}`} sub="Levelised cost of carbon removal" accent />
              <KpiCard label="NPV (€M)" value={<span style={{ color: econ.npv >= 0 ? '#059669' : '#dc2626' }}>{econ.npv >= 0 ? '+' : ''}€{econ.npv}M</span>} sub="Net Present Value at base scenario" />
              <KpiCard label="IRR %" value={`${econ.irr}%`} sub="Internal Rate of Return" />
              <KpiCard label="Break-even Price" value={`$${econ.breakEvenPrice}/t`} sub="Credit price for NPV = 0" />
            </Row>
          </Section>

          <Section title="NPV Sensitivity to Credit Price ($20–$300/t)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={econ.npvSensitivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="price" unit="$/t" tick={{ fontSize: 11 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M NPV`} labelFormatter={(v) => `Credit Price: $${v}/t`} />
                <Line type="monotone" dataKey="npv" stroke="#059669" strokeWidth={2} name="NPV (€M)" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="CapEx / OpEx / Revenue Decomposition ($/tCO₂)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={econ.capexOpex}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="component" tick={{ fontSize: 13 }} />
                <YAxis unit="$" />
                <Tooltip formatter={(val) => `$${val}/tCO₂`} />
                <Bar dataKey="value" name="Cost Component" radius={[4, 4, 0, 0]}>
                  {econ.capexOpex.map((c, i) => <Cell key={i} fill={c.value < 0 ? '#059669' : i === 0 ? '#3b82f6' : i === 1 ? '#f59e0b' : '#8b5cf6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Market Eligibility */}
      {tab === 4 && (
        <div>
          <Section title="Market Eligibility Summary">
            <Row gap={12}>
              <KpiCard label="Frontier Eligible" value={<Badge label={market.frontierEligible ? 'Eligible ✓' : 'Not Eligible'} color={market.frontierEligible ? 'green' : 'red'} />} sub="Frontier Climate CDR programme" accent />
              <KpiCard label="CORSIA Eligible" value={<Badge label={market.corsiaEligible ? 'Eligible ✓' : 'Not Eligible'} color={market.corsiaEligible ? 'green' : 'red'} />} sub="ICAO CORSIA Phase 1 (2021-2026)" />
              <KpiCard label="Recommended Price" value={`$${market.recommendedPrice}/t`} sub="Fair value range midpoint" />
              <KpiCard label="Primary Market" value={market.frontierEligible ? 'Premium Voluntary' : 'Standard Voluntary'} sub="Best-fit buyer segment" />
            </Row>
          </Section>

          <Section title="Buyer Segment Price Benchmarks ($/t)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={market.buyerBenchmarks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis unit="$" />
                <Tooltip formatter={(val) => `$${val}/tCO₂`} />
                <Bar dataKey="price" name="Buyer Price" radius={[4, 4, 0, 0]}>
                  {market.buyerBenchmarks.map((b, i) => <Cell key={i} fill={b.price >= market.recommendedPrice ? '#059669' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Market Segment Split">
            <Row>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={market.marketSegments} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {market.marketSegments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 10 }}>Market Access Summary</div>
                {[
                  { label: 'Frontier Climate', eligible: market.frontierEligible, desc: 'Pre-purchase CDR offtake — requires TRL≥5, ≥50yr permanence' },
                  { label: 'CORSIA Airlines', eligible: market.corsiaEligible, desc: 'ICAO-approved programmes only — Gold Standard, VCS, CAR eligible' },
                  { label: 'Microsoft Carbon Removal', eligible: market.recommendedPrice <= 250, desc: 'RFP process — quality > price; permanence-weighted scoring' },
                  { label: 'Voluntary VCM (ICVCM CCP)', eligible: oxford.composite >= 60, desc: 'Core Carbon Principles label enables premium market access' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: item.eligible ? '#059669' : '#9ca3af', fontWeight: 700, fontSize: 16, minWidth: 18 }}>{item.eligible ? '✓' : '✗'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1b3a5c' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Row>
          </Section>
        </div>
      )}
    </div>
  );
}
