import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const hashStr = (s) => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = (seed) => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, offset = 0) => seededRandom(seed + offset);
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['Programme Assessment', 'ESG KPI Library', 'Supplier Scorecards', 'Margin Ratchet & Economics', 'CSDDD & OECD DDG'];

const CRITERIA_SCORES = [
  'OECD DDG Step 1', 'OECD DDG Step 2', 'OECD DDG Step 3', 'OECD DDG Step 4', 'OECD DDG Step 5',
  'ICMA GBP Alignment', 'LMA SLLP KPIs', 'Scope 3 Cat1 Coverage',
];

const MOCK_SUPPLIERS = [
  { name: 'AgroTech Latam', country: 'BR', tier: 1, risk: 'Low' },
  { name: 'Shenzhen Parts Co.', country: 'CN', tier: 1, risk: 'High' },
  { name: 'Nordic Textiles', country: 'SE', tier: 2, risk: 'Low' },
  { name: 'Mumbai Fabricators', country: 'IN', tier: 2, risk: 'Medium' },
  { name: 'West Africa Agri', country: 'GH', tier: 3, risk: 'High' },
  { name: 'Pacific Chemicals', country: 'AU', tier: 2, risk: 'Low' },
  { name: 'Balkan Metals', country: 'RS', tier: 3, risk: 'Medium' },
  { name: 'Gulf Logistics', country: 'AE', tier: 1, risk: 'Medium' },
];

const SPTS = [
  { name: 'GHG Intensity Reduction', threshold: '30% by 2027', bps: 15 },
  { name: 'Renewable Energy %', threshold: '60% by 2026', bps: 10 },
  { name: 'Water Intensity Cut', threshold: '25% by 2027', bps: 8 },
  { name: 'Supplier ESG Audit', threshold: '80% coverage by 2025', bps: 12 },
  { name: 'Deforestation-Free', threshold: '100% by 2025', bps: 20 },
];

const ADVERSE_IMPACTS = [
  { impact: 'Forced Labour in Supply Chain', severity: 'High', suppliers: 3 },
  { impact: 'Deforestation Risk (Tier 3)', severity: 'High', suppliers: 5 },
  { impact: 'Water Stress Exposure', severity: 'Medium', suppliers: 7 },
  { impact: 'Excessive Working Hours', severity: 'Medium', suppliers: 4 },
  { impact: 'Toxic Substance Use', severity: 'Low', suppliers: 2 },
  { impact: 'Land Rights Infringement', severity: 'High', suppliers: 2 },
];

function buildData(buyer, progType, framework, sizeStr) {
  const seed = hashStr(buyer + progType + framework + sizeStr);
  const size = parseFloat(sizeStr) || 100;

  const overallScore = Math.round(sr(seed, 1) * 25 + 60);
  const oecdStep = Math.min(5, Math.ceil(sr(seed, 3) * 5));
  const scope3Coverage = Math.round(sr(seed, 5) * 30 + 45);
  const eligible = overallScore >= 65;

  const criteriaData = CRITERIA_SCORES.map((name, i) => ({
    name, score: Math.round(sr(seed, i * 7 + 10) * 35 + 50),
  }));

  const kpiCategories = [
    { category: 'Environmental', score: Math.round(sr(seed, 21) * 30 + 50) },
    { category: 'Social', score: Math.round(sr(seed, 23) * 28 + 48) },
    { category: 'Governance', score: Math.round(sr(seed, 29) * 25 + 55) },
    { category: 'Labour', score: Math.round(sr(seed, 31) * 30 + 45) },
    { category: 'Human Rights', score: Math.round(sr(seed, 37) * 32 + 42) },
    { category: 'Community', score: Math.round(sr(seed, 41) * 28 + 47) },
  ];

  const topKPIs = [
    'GHG Scope 1+2', 'Scope 3 Cat1', 'Renewable Energy %', 'Water Intensity',
    'Waste to Landfill', 'Female Leadership %', 'Safety Incidents', 'Living Wage %',
    'Supplier Audits', 'Deforestation-free',
  ].map((kpi, i) => ({ kpi, score: Math.round(sr(seed, i * 11 + 50) * 40 + 40) }));

  const suppliers = MOCK_SUPPLIERS.map((s, i) => ({
    ...s,
    esgScore: Math.round(sr(seed, i * 13 + 70) * 40 + 40),
    discountBps: Math.round(sr(seed, i * 17 + 80) * 100 + 20),
  }));

  const baseRate = 5.25 + sr(seed, 91) * 1.5;
  const ratchetYears = ['2024', '2025', '2026', '2027'].map((yr, i) => {
    const sptAdjust = -(sr(seed, i * 19 + 95) * 0.3 + 0.05);
    return { year: yr, baseRate: parseFloat(baseRate.toFixed(2)), adjustedRate: parseFloat((baseRate + sptAdjust * (i + 1)).toFixed(2)) };
  });

  const sptData = SPTS.map((spt, i) => ({
    ...spt, currentPerf: `${Math.round(sr(seed, i * 23 + 100) * 30 + 10)}%`,
  }));

  const discountSplit = [
    { name: 'Buyer Savings', value: Math.round(sr(seed, 111) * 15 + 40) },
    { name: 'Supplier Benefit', value: Math.round(sr(seed, 113) * 15 + 35) },
    { name: 'Bank Margin', value: Math.round(sr(seed, 117) * 10 + 15) },
  ];

  const oecdSteps = [
    { subject: 'Step 1 — Policy', value: Math.round(sr(seed, 121) * 30 + 50) },
    { subject: 'Step 2 — DD', value: Math.round(sr(seed, 123) * 35 + 45) },
    { subject: 'Step 3 — Cease', value: Math.round(sr(seed, 127) * 28 + 42) },
    { subject: 'Step 4 — Track', value: Math.round(sr(seed, 129) * 32 + 48) },
    { subject: 'Step 5 — Comm.', value: Math.round(sr(seed, 131) * 30 + 45) },
  ];

  const csdddScore = Math.round(oecdSteps.reduce((s, o) => s + o.value, 0) / 5);

  return { overallScore, oecdStep, scope3Coverage, eligible, criteriaData, kpiCategories, topKPIs, suppliers, ratchetYears, sptData, discountSplit, oecdSteps, csdddScore };
}

export default function SSCFPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buyer, setBuyer] = useState('Siemens AG');
  const [progType, setProgType] = useState('reverse_factoring');
  const [framework, setFramework] = useState('LMA_SSCF_2023');
  const [size, setSize] = useState('500');

  const d = buildData(buyer, progType, framework, size);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/sscf/assess`, { buyer_name: buyer, programme_type: progType, sscf_framework: framework, programme_size_mn: parseFloat(size) });
    } catch { void 0 /* API fallback to seed data */; }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Sustainable Supply Chain Finance (SSCF)</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>LMA SSCF 2023 · ICC SCF 2022 · GSCFF 2023 · OECD DDG · CSDDD Cascade · Margin Ratchet Modelling</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      <Section title="Inputs">
        <Row>
          <Inp label="Buyer Name" value={buyer} onChange={setBuyer} />
          <Sel label="Programme Type" value={progType} onChange={setProgType} options={[{ value: 'reverse_factoring', label: 'Reverse Factoring' }, { value: 'dynamic_discounting', label: 'Dynamic Discounting' }, { value: 'supply_chain_loan', label: 'Supply Chain Loan' }, { value: 'scf_platform', label: 'SCF Platform' }]} />
          <Sel label="SSCF Framework" value={framework} onChange={setFramework} options={[{ value: 'LMA_SSCF_2023', label: 'LMA SSCF 2023' }, { value: 'ICC_SCF_2022', label: 'ICC SCF 2022' }, { value: 'GSCFF_2023', label: 'GSCFF 2023' }]} />
          <Inp label="Programme Size $mn" value={size} onChange={setSize} type="number" />
        </Row>
        <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run SSCF Assessment'}</Btn>
      </Section>

      {tab === 0 && (
        <div>
          <Section title="Programme Assessment Summary">
            <Row gap={12}>
              <KpiCard label="Overall SSCF Score" value={`${d.overallScore}/100`} sub={`${framework} framework`} accent />
              <KpiCard label="OECD DDG Step Achieved" value={`Step ${d.oecdStep} / 5`} sub="OECD MNE DD Guidance progress" />
              <KpiCard label="Scope 3 Cat1 Coverage" value={`${d.scope3Coverage}%`} sub="Purchased goods & services" />
              <KpiCard label="Eligible for SSCF" value={<Badge label={d.eligible ? 'Eligible' : 'Not Eligible'} color={d.eligible ? 'green' : 'red'} />} sub="Framework minimum threshold" />
            </Row>
          </Section>
          <Section title="Framework Eligibility Criteria Scores">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={d.criteriaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="Criteria Score" radius={[4, 4, 0, 0]}>
                  {d.criteriaData.map((c, i) => <Cell key={i} fill={c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {tab === 1 && (
        <div>
          <Row>
            <Section title="ESG KPI Category Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={d.kpiCategories}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Category Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Top 10 Material KPIs">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={d.topKPIs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="kpi" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {d.topKPIs.map((k, i) => <Cell key={i} fill={k.score >= 70 ? '#059669' : k.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {tab === 2 && (
        <div>
          <Section title="Supplier Scorecard Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Supplier', 'Country', 'Tier', 'ESG Score', 'Risk Tier', 'Discount Rate (bps)'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {d.suppliers.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{s.country}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>Tier {s.tier}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: s.esgScore >= 70 ? '#059669' : s.esgScore >= 50 ? '#d97706' : '#dc2626' }}>{s.esgScore}/100</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={s.risk} color={s.risk === 'Low' ? 'green' : s.risk === 'Medium' ? 'yellow' : 'red'} /></td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{s.discountBps} bps</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Supplier ESG Score Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={d.suppliers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="esgScore" name="ESG Score" radius={[4, 4, 0, 0]}>
                  {d.suppliers.map((s, i) => <Cell key={i} fill={s.esgScore >= 70 ? '#059669' : s.esgScore >= 50 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {tab === 3 && (
        <div>
          <Section title="Base Rate vs SPT-Adjusted Rate (%)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.ratchetYears}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis unit="%" domain={['dataMin - 0.2', 'dataMax + 0.1']} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                <Line type="monotone" dataKey="baseRate" stroke="#6b7280" name="Base Rate %" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="adjustedRate" stroke="#059669" name="SPT-Adjusted Rate %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
          <Row>
            <Section title="SPT Targets & Margin Ratchet">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['SPT Name', 'Threshold', 'Current Perf', 'bps Adjustment'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {d.sptData.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{s.threshold}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{s.currentPerf}</td>
                      <td style={{ padding: '8px 12px', color: '#059669', fontWeight: 700 }}>-{s.bps} bps</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="Discount Savings Split">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={d.discountSplit} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}>
                    {d.discountSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {tab === 4 && (
        <div>
          <Row>
            <Section title="OECD DDG 5-Step Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={d.oecdSteps}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="DDG Score" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="CSDDD Cascade Compliance">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Overall CSDDD Score</div>
                <div style={{ background: '#f3f4f6', borderRadius: 8, height: 20, overflow: 'hidden' }}>
                  <div style={{ width: `${d.csdddScore}%`, height: '100%', background: d.csdddScore >= 70 ? '#059669' : d.csdddScore >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 8, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{d.csdddScore}/100 — <Badge label={d.csdddScore >= 70 ? 'Compliant' : d.csdddScore >= 50 ? 'Partial' : 'Non-Compliant'} color={d.csdddScore >= 70 ? 'green' : d.csdddScore >= 50 ? 'yellow' : 'red'} /></div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Adverse Impact', 'Severity', 'Suppliers Flagged'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {ADVERSE_IMPACTS.map((ai, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{ai.impact}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={ai.severity} color={ai.severity === 'High' ? 'red' : ai.severity === 'Medium' ? 'yellow' : 'gray'} /></td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{ai.suppliers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Row>
        </div>
      )}
    </div>
  );
}
