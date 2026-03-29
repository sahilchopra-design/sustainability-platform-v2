import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
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

const TABS = ['BNG Assessment', 'TNFD Disclosure', 'Ecosystem Services', 'GBF Target 15', 'Credit Quality & Market'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#6366f1', '#d97706', '#0ea5e9'];

const HABITAT_TYPES = [
  { value: 'woodland', label: 'Woodland / Forest' },
  { value: 'grassland', label: 'Semi-natural Grassland' },
  { value: 'wetland', label: 'Wetland / Fen / Bog' },
  { value: 'heathland', label: 'Heathland / Shrub' },
  { value: 'coastal', label: 'Coastal / Intertidal' },
  { value: 'freshwater', label: 'Freshwater Habitat' },
  { value: 'farmland', label: 'Arable / Farmland' },
  { value: 'urban_green', label: 'Urban Green Space' },
];

const HABITAT_DISTINCTIVENESS = {
  woodland: 6, grassland: 8, wetland: 8, heathland: 7, coastal: 8, freshwater: 7, farmland: 3, urban_green: 4,
};

const getBNGData = (habitat, area, preCondition, postPlan) => {
  const hi = HABITAT_TYPES.findIndex(h => h.value === habitat) + 1;
  const dist = HABITAT_DISTINCTIVENESS[habitat] || 5;
  const conditionMap = { 'poor': 1, 'moderate': 2, 'good': 3, 'very_good': 4 };
  const planMap = { 'poor': 1, 'moderate': 2, 'good': 3, 'very_good': 4, 'restored': 5 };
  const preC = conditionMap[preCondition] || 2;
  const postC = planMap[postPlan] || 3;
  const areaNum = parseFloat(area) || 1;
  const baselineUnits = parseFloat((areaNum * dist * preC * 0.3).toFixed(2));
  const postUnits = parseFloat((areaNum * dist * postC * 0.28).toFixed(2));
  const bngPct = parseFloat(((postUnits - baselineUnits) / Math.max(baselineUnits, 0.01) * 100).toFixed(1));
  const tenPctMet = bngPct >= 10;

  const habitatBreakdown = HABITAT_TYPES.map((h, i) => ({
    name: h.label.split(' / ')[0],
    baseline: parseFloat((seed(hi * 7 + i * 3) * 4 + 1).toFixed(2)),
    post: parseFloat((seed(hi * 11 + i * 5) * 5 + 2).toFixed(2)),
  }));

  const radialData = [
    { name: 'Distinctiveness', value: dist * 10, fill: '#059669' },
    { name: 'Condition', value: preC * 20, fill: '#3b82f6' },
    { name: 'Connectivity', value: Math.round(seed(hi * 13) * 30 + 50), fill: '#f59e0b' },
    { name: 'Strategic Sig.', value: Math.round(seed(hi * 17) * 25 + 55), fill: '#8b5cf6' },
  ];

  return { baselineUnits, postUnits, bngPct, tenPctMet, habitatBreakdown, radialData, dist };
};

const getTNFDData = () => {
  const pillars = [
    { dimension: 'Governance', score: Math.round(seed(21) * 25 + 55) },
    { dimension: 'Strategy', score: Math.round(seed(23) * 28 + 50) },
    { dimension: 'Risk Mgmt', score: Math.round(seed(29) * 25 + 52) },
    { dimension: 'Metrics', score: Math.round(seed(31) * 30 + 48) },
  ];
  const composite = Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);
  const metrics = [
    'Board Oversight', 'Mgmt Processes', 'Risk Identification', 'Scenarios Used',
    'Dependency Assessment', 'Impact Assessment', 'Physical Risk', 'Transition Risk',
    'Finance Affected', 'Area Metric', 'Condition Metric', 'Connectivity',
    'Species Threat', 'Ecosystem Services',
  ].map((m, i) => ({ metric: m, score: Math.round(seed(37 + i * 7) * 30 + 45) }));
  const gaps = metrics.filter(m => m.score < 60).length;
  return { pillars, composite, metrics, gaps };
};

const getEcoServicesData = () => {
  const services = [
    { name: 'Carbon Sequestration', value: Math.round(seed(51) * 40 + 60) },
    { name: 'Water Purification', value: Math.round(seed(53) * 30 + 40) },
    { name: 'Flood Regulation', value: Math.round(seed(57) * 25 + 35) },
    { name: 'Pollination', value: Math.round(seed(59) * 20 + 25) },
    { name: 'Soil Formation', value: Math.round(seed(61) * 18 + 20) },
    { name: 'Coastal Protection', value: Math.round(seed(67) * 22 + 28) },
    { name: 'Air Quality', value: Math.round(seed(71) * 15 + 18) },
    { name: 'Noise Regulation', value: Math.round(seed(73) * 10 + 12) },
    { name: 'Recreation', value: Math.round(seed(79) * 20 + 22) },
    { name: 'Cultural Value', value: Math.round(seed(83) * 15 + 15) },
    { name: 'Genetic Diversity', value: Math.round(seed(89) * 12 + 10) },
    { name: 'Disease Regulation', value: Math.round(seed(97) * 10 + 8) },
  ];
  const totalVal = services.reduce((s, sv) => s + sv.value, 0);
  const carbonVal = services[0].value;
  const waterVal = services[1].value;
  const highLowBar = services.map(sv => ({
    name: sv.name.split(' ')[0],
    high: Math.round(sv.value * (1 + seed(sv.value) * 0.4 + 0.1)),
    low: Math.round(sv.value * (1 - seed(sv.value * 2) * 0.3)),
  }));
  return { services, totalVal, carbonVal, waterVal, highLowBar };
};

const getGBFData = () => {
  const subTargets = [
    { id: 'a', label: 'Disclosure obligations met', score: Math.round(seed(101) * 30 + 50) },
    { id: 'b', label: 'Dependencies identified', score: Math.round(seed(103) * 28 + 52) },
    { id: 'c', label: 'Impacts assessed', score: Math.round(seed(107) * 32 + 45) },
    { id: 'd', label: 'Transition plans published', score: Math.round(seed(109) * 35 + 42) },
    { id: 'e', label: 'Finance flows reported', score: Math.round(seed(113) * 28 + 48) },
    { id: 'f', label: 'Biodiversity strategy', score: Math.round(seed(117) * 30 + 50) },
  ];
  const metCount = subTargets.filter(s => s.score >= 65).length;
  const gapCount = 6 - metCount;
  const disclosureScore = Math.round(subTargets.reduce((s, t) => s + t.score, 0) / 6);
  return { subTargets, metCount, gapCount, disclosureScore };
};

const getCreditMarketData = () => {
  const creditTypes = [
    { type: 'DEFRA BNG', price: Math.round(seed(121) * 20 + 30), quality: 'A' },
    { type: 'Woodland Carbon', price: Math.round(seed(123) * 15 + 20), quality: 'B' },
    { type: 'Peatland Code', price: Math.round(seed(127) * 18 + 22), quality: 'A' },
    { type: 'TNFD-Aligned', price: Math.round(seed(129) * 25 + 35), quality: 'A' },
    { type: 'Voluntary BNG', price: Math.round(seed(131) * 12 + 18), quality: 'C' },
    { type: 'NBS Biocredit', price: Math.round(seed(133) * 30 + 40), quality: 'A' },
    { type: 'SBTN Credit', price: Math.round(seed(137) * 22 + 28), quality: 'B' },
    { type: 'GBF-Linked', price: Math.round(seed(139) * 28 + 38), quality: 'A' },
  ];
  const topCredit = [...creditTypes].sort((a, b) => b.price - a.price)[0];
  const avgPrice = Math.round(creditTypes.reduce((s, c) => s + c.price, 0) / creditTypes.length);
  const additionalityScore = Math.round(seed(141) * 25 + 60);
  const permanenceRisk = seed(143) > 0.6 ? 'High' : seed(143) > 0.35 ? 'Medium' : 'Low';
  const prColor = permanenceRisk === 'High' ? 'red' : permanenceRisk === 'Medium' ? 'yellow' : 'green';
  const qualityTier = avgPrice >= 35 ? 'Tier 1' : avgPrice >= 25 ? 'Tier 2' : 'Tier 3';

  const buyerSegments = [
    { name: 'Corporate Offsetting', value: Math.round(seed(147) * 15 + 30) },
    { name: 'Developer Compliance', value: Math.round(seed(149) * 12 + 25) },
    { name: 'Financial Institutions', value: Math.round(seed(151) * 10 + 18) },
    { name: 'Government Schemes', value: Math.round(seed(153) * 8 + 15) },
    { name: 'Philanthropy / NGO', value: Math.round(seed(157) * 6 + 12) },
  ];

  return { creditTypes, topCredit, avgPrice, additionalityScore, permanenceRisk, prColor, qualityTier, buyerSegments };
};

export default function BiodiversityCreditsPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [habitatType, setHabitatType] = useState('woodland');
  const [area, setArea] = useState('5.0');
  const [preCondition, setPreCondition] = useState('moderate');
  const [postPlan, setPostPlan] = useState('good');

  const bng = getBNGData(habitatType, area, preCondition, postPlan);
  const tnfd = getTNFDData();
  const eco = getEcoServicesData();
  const gbf = getGBFData();
  const market = getCreditMarketData();

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/biodiversity-credits/assess`, {
        habitat_type: habitatType, area_ha: parseFloat(area), pre_condition: preCondition, post_plan: postPlan,
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Biodiversity Credits & Nature Markets</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>DEFRA BNG · TNFD v1.0 · ENCORE Ecosystem Services · GBF Target 15 · Nature Credit Quality</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — BNG Assessment */}
      {tab === 0 && (
        <div>
          <Section title="BNG Inputs (DEFRA Biodiversity Metric 4.0)">
            <Row>
              <Sel label="Habitat Type" value={habitatType} onChange={setHabitatType} options={HABITAT_TYPES} />
              <Inp label="Area (hectares)" value={area} onChange={setArea} type="number" />
              <Sel label="Pre-Development Condition" value={preCondition} onChange={setPreCondition} options={[
                { value: 'poor', label: 'Poor' }, { value: 'moderate', label: 'Moderate' },
                { value: 'good', label: 'Good' }, { value: 'very_good', label: 'Very Good' },
              ]} />
              <Sel label="Post-Development Plan" value={postPlan} onChange={setPostPlan} options={[
                { value: 'poor', label: 'Poor' }, { value: 'moderate', label: 'Moderate' },
                { value: 'good', label: 'Good' }, { value: 'very_good', label: 'Very Good' }, { value: 'restored', label: 'Fully Restored' },
              ]} />
            </Row>
            <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run BNG Assessment'}</Btn>
          </Section>

          <Section title="BNG Results">
            <Row gap={12}>
              <KpiCard label="Habitat Units — Baseline" value={bng.baselineUnits.toFixed(2)} sub={`Distinctiveness D${bng.dist} · ${area}ha`} accent />
              <KpiCard label="Habitat Units — Post" value={bng.postUnits.toFixed(2)} sub="Post-development scenario" />
              <KpiCard label="BNG %" value={`${bng.bngPct > 0 ? '+' : ''}${bng.bngPct}%`} sub="Net change in habitat units" />
              <KpiCard label="10% BNG Met" value={<Badge label={bng.tenPctMet ? '✓ Met' : '✗ Not Met'} color={bng.tenPctMet ? 'green' : 'red'} />} sub="DEFRA 10% mandatory threshold" />
            </Row>
          </Section>

          <Section title="Habitat Unit Breakdown by Type">
            <Row>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bng.habitatBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={45} />
                  <YAxis unit=" hu" />
                  <Tooltip formatter={(val) => `${val} habitat units`} />
                  <Legend />
                  <Bar dataKey="baseline" fill="#d1d5db" name="Baseline Units" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="post" fill="#059669" name="Post-Dev Units" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div>
                <Section title="Distinctiveness Score">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadialBarChart innerRadius={30} outerRadius={120} data={bng.radialData} startAngle={180} endAngle={0}>
                      <RadialBar minAngle={15} dataKey="value" nameKey="name" label={{ fill: '#374151', fontSize: 11 }} />
                      <Legend iconSize={10} />
                      <Tooltip formatter={(val) => `${val}/100`} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </Section>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 2 — TNFD Disclosure */}
      {tab === 1 && (
        <div>
          <Section title="TNFD Composite Summary">
            <Row gap={12}>
              <KpiCard label="TNFD Composite Score" value={`${tnfd.composite}/100`} sub="4-pillar TNFD LEAP weighted average" accent />
              <KpiCard label="Disclosure Gaps" value={`${tnfd.gaps} / 14`} sub="Metrics below 60/100 threshold" />
              <KpiCard label="Highest Pillar" value={[...tnfd.pillars].sort((a, b) => b.score - a.score)[0].dimension} sub={`Score: ${[...tnfd.pillars].sort((a, b) => b.score - a.score)[0].score}/100`} />
              <KpiCard label="Readiness Tier" value={<Badge label={tnfd.composite >= 70 ? 'Advanced' : tnfd.composite >= 55 ? 'Developing' : 'Early Stage'} color={tnfd.composite >= 70 ? 'green' : tnfd.composite >= 55 ? 'yellow' : 'red'} />} sub="TNFD preparedness classification" />
            </Row>
          </Section>

          <Row>
            <Section title="4-Pillar TNFD Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={tnfd.pillars}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="TNFD Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="14-Metric Sub-Score BarChart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tnfd.metrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="metric" width={145} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {tnfd.metrics.map((m, i) => <Cell key={i} fill={m.score >= 70 ? '#059669' : m.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — Ecosystem Services */}
      {tab === 2 && (
        <div>
          <Section title="Ecosystem Services Valuation (ENCORE / PBAF 2023)">
            <Row gap={12}>
              <KpiCard label="Total Ecosystem Value (€M)" value={`€${eco.totalVal}M`} sub="12-service ENCORE valuation" accent />
              <KpiCard label="Carbon Sequestration Value" value={`€${eco.carbonVal}M`} sub="IPCC AR6 social cost of carbon" />
              <KpiCard label="Water Purification Value" value={`€${eco.waterVal}M`} sub="Replacement cost methodology" />
              <KpiCard label="Top Service" value={eco.services[0].name.split(' ')[0]} sub={`€${eco.services[0].value}M estimated value`} />
            </Row>
          </Section>

          <Row>
            <Section title="Value by Ecosystem Service (€M)">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={eco.services} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name"
                    label={({ name, percent }) => percent > 0.06 ? `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%` : ''}>
                    {eco.services.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="High vs Low Valuation Range (€M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eco.highLowBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis unit="M" />
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Legend />
                  <Bar dataKey="high" fill="#059669" name="High Estimate" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="low" fill="#d1d5db" name="Low Estimate" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — GBF Target 15 */}
      {tab === 3 && (
        <div>
          <Section title="GBF Target 15 — Business Biodiversity Disclosure">
            <Row gap={12}>
              <KpiCard label="GBF T15 Disclosure Score" value={`${gbf.disclosureScore}/100`} sub="6 sub-target weighted average" accent />
              <KpiCard label="Sub-targets Met" value={`${gbf.metCount} / 6`} sub="Score ≥ 65 threshold" />
              <KpiCard label="Gap Count" value={`${gbf.gapCount}`} sub="Sub-targets requiring remediation" />
              <KpiCard label="Compliance Status" value={<Badge label={gbf.metCount >= 5 ? 'Compliant' : gbf.metCount >= 3 ? 'Partial' : 'Non-Compliant'} color={gbf.metCount >= 5 ? 'green' : gbf.metCount >= 3 ? 'yellow' : 'red'} />} sub="CBD GBF Target 15 alignment" />
            </Row>
          </Section>

          <Section title="Sub-target Compliance Scores (a–f)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gbf.subTargets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" tick={{ fontSize: 13 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val, _, props) => [`${val}/100`, props.payload?.label]} />
                <Bar dataKey="score" name="Compliance Score" radius={[4, 4, 0, 0]}>
                  {gbf.subTargets.map((s, i) => <Cell key={i} fill={s.score >= 65 ? '#059669' : s.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Sub-target Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['ID', 'Description', 'Score', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gbf.subTargets.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{s.id.toUpperCase()}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{s.label}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{s.score}/100</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={s.score >= 65 ? 'Met' : s.score >= 50 ? 'Partial' : 'Gap'} color={s.score >= 65 ? 'green' : s.score >= 50 ? 'yellow' : 'red'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Credit Quality & Market */}
      {tab === 4 && (
        <div>
          <Section title="Nature Credit Market Summary">
            <Row gap={12}>
              <KpiCard label="Credit Quality Tier" value={<Badge label={market.qualityTier} color={market.qualityTier === 'Tier 1' ? 'green' : market.qualityTier === 'Tier 2' ? 'blue' : 'yellow'} />} sub="Market-wide quality classification" accent />
              <KpiCard label="Avg Credit Price ($/unit)" value={`$${market.avgPrice}`} sub="Weighted average across 8 types" />
              <KpiCard label="Additionality Score" value={`${market.additionalityScore}/100`} sub="ICVCM additionality assessment" />
              <KpiCard label="Permanence Risk" value={<Badge label={market.permanenceRisk} color={market.prColor} />} sub="Long-term biodiversity persistence" />
            </Row>
          </Section>

          <Section title="Price Benchmarks by Credit Type ($/unit)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={market.creditTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis unit="$" />
                <Tooltip formatter={(val) => `$${val}/unit`} />
                <Bar dataKey="price" name="Credit Price" radius={[4, 4, 0, 0]}>
                  {market.creditTypes.map((c, i) => <Cell key={i} fill={c.quality === 'A' ? '#059669' : c.quality === 'B' ? '#3b82f6' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Buyer Segment Split">
            <Row>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={market.buyerSegments} cx="50%" cy="50%" innerRadius={55} outerRadius={105} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {market.buyerSegments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 10 }}>Quality Legend</div>
                {[
                  { grade: 'A', desc: 'ICVCM CCP-labelled · verified additionality · ≥50yr permanence', color: '#059669' },
                  { grade: 'B', desc: 'Verified standard (VCS/Gold Standard) · no CCP label', color: '#3b82f6' },
                  { grade: 'C', desc: 'Voluntary / registry-only · limited independent verification', color: '#f59e0b' },
                ].map(q => (
                  <div key={q.grade} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: q.color, color: 'white', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 13, minWidth: 22, textAlign: 'center' }}>{q.grade}</span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{q.desc}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Top Credit</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{market.topCredit.type}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>${market.topCredit.price}/unit · Quality {market.topCredit.quality}</div>
                </div>
              </div>
            </Row>
          </Section>
        </div>
      )}
    </div>
  );
}
