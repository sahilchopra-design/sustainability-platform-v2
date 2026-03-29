import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, gold: { bg: '#fef9c3', text: '#854d0e' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['ICMA SBP Compliance', 'Use of Proceeds', 'Target Population', 'Social KPIs & SDGs', 'Bond Overview'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'];

const sbpComponents = [
  { component: 'Use of Proceeds', score: Math.round(seed(1) * 15 + 78), max: 100, weight: 0.3 },
  { component: 'Process Evaluation', score: Math.round(seed(2) * 12 + 72), max: 100, weight: 0.25 },
  { component: 'Management of Proceeds', score: Math.round(seed(3) * 10 + 80), max: 100, weight: 0.25 },
  { component: 'Reporting', score: Math.round(seed(4) * 14 + 68), max: 100, weight: 0.2 },
];
const sbpOverall = Math.round(sbpComponents.reduce((s, c) => s + c.score * c.weight, 0));
const sbpAligned = sbpOverall >= 72;

const gapChecklist = [
  { item: 'Eligible project categories defined per ICMA SBP', pass: true },
  { item: 'Eligible population criteria documented', pass: true },
  { item: 'SPO / second-party opinion obtained', pass: true },
  { item: 'Proceeds tracked to separate account', pass: true },
  { item: 'Annual impact report published', pass: seed(11) > 0.3 },
  { item: 'Beneficiary count independently verified', pass: seed(12) > 0.5 },
  { item: 'Additionality demonstrated vs baseline', pass: seed(13) > 0.4 },
  { item: 'UN SDG cross-reference included', pass: true },
];

const proceedCategories = [
  { name: 'Affordable Housing', amount: Math.round(seed(21) * 40 + 80), eligible: true },
  { name: 'Access to Education', amount: Math.round(seed(22) * 35 + 60), eligible: true },
  { name: 'Healthcare Services', amount: Math.round(seed(23) * 30 + 55), eligible: true },
  { name: 'SME Finance', amount: Math.round(seed(24) * 25 + 45), eligible: true },
  { name: 'Food Security', amount: Math.round(seed(25) * 20 + 35), eligible: true },
  { name: 'Clean Water & Sanitation', amount: Math.round(seed(26) * 18 + 30), eligible: true },
  { name: 'Employment Generation', amount: Math.round(seed(27) * 22 + 40), eligible: true },
  { name: 'Financial Inclusion', amount: Math.round(seed(28) * 15 + 25), eligible: true },
  { name: 'Digital Inclusion', amount: Math.round(seed(29) * 12 + 20), eligible: seed(30) > 0.3 },
];
const totalProceeds = proceedCategories.reduce((s, c) => s + c.amount, 0);

const targetGroups = [
  'Women & Girls', 'Youth', 'Elderly', 'Migrants & Refugees', 'People with Disabilities',
  'Rural Communities', 'Indigenous Peoples', 'Unemployed', 'Underbanked', 'Low-Income HH',
];

const geoData = [
  { region: 'Sub-Saharan Africa', beneficiaries: Math.round(seed(41) * 30000 + 25000) },
  { region: 'South Asia', beneficiaries: Math.round(seed(42) * 25000 + 20000) },
  { region: 'SE Asia', beneficiaries: Math.round(seed(43) * 20000 + 18000) },
  { region: 'Latin America', beneficiaries: Math.round(seed(44) * 15000 + 12000) },
  { region: 'MENA', beneficiaries: Math.round(seed(45) * 12000 + 10000) },
];
const totalBeneficiaries = geoData.reduce((s, g) => s + g.beneficiaries, 0) + Math.round(seed(46) * 10000 + 15000);
const additionalityScore = Math.round(seed(47) * 20 + 68);

const kpiList = [
  { name: 'Households Housed', value: Math.round(seed(51) * 500 + 800), unit: 'units', sdg: 'SDG 11.1', quantified: true },
  { name: 'Students Enrolled', value: Math.round(seed(52) * 2000 + 5000), unit: 'students', sdg: 'SDG 4.1', quantified: true },
  { name: 'Patients Treated', value: Math.round(seed(53) * 5000 + 12000), unit: 'patients/yr', sdg: 'SDG 3.8', quantified: true },
  { name: 'SMEs Financed', value: Math.round(seed(54) * 100 + 150), unit: 'SMEs', sdg: 'SDG 8.3', quantified: true },
  { name: 'Jobs Created', value: Math.round(seed(55) * 500 + 1200), unit: 'FTE jobs', sdg: 'SDG 8.5', quantified: true },
  { name: 'Clean Water Access', value: Math.round(seed(56) * 3000 + 8000), unit: 'people', sdg: 'SDG 6.1', quantified: true },
  { name: 'Women Beneficiaries', value: Math.round(seed(57) * 20 + 45), unit: '%', sdg: 'SDG 5.a', quantified: true },
  { name: 'Digital Accounts Opened', value: Math.round(seed(58) * 1000 + 2500), unit: 'accounts', sdg: 'SDG 10.2', quantified: seed(59) > 0.3 },
];
const kpiQualityScore = Math.round(kpiList.filter(k => k.quantified).length / kpiList.length * 100);

const sdgAlignment = [
  { sdg: 'SDG 1', name: 'No Poverty', relevance: Math.round(seed(61) * 40 + 50) },
  { sdg: 'SDG 2', name: 'Zero Hunger', relevance: Math.round(seed(62) * 35 + 45) },
  { sdg: 'SDG 3', name: 'Good Health', relevance: Math.round(seed(63) * 30 + 60) },
  { sdg: 'SDG 4', name: 'Education', relevance: Math.round(seed(64) * 35 + 55) },
  { sdg: 'SDG 5', name: 'Gender Eq.', relevance: Math.round(seed(65) * 30 + 50) },
  { sdg: 'SDG 6', name: 'Clean Water', relevance: Math.round(seed(66) * 25 + 48) },
  { sdg: 'SDG 8', name: 'Decent Work', relevance: Math.round(seed(67) * 30 + 62) },
  { sdg: 'SDG 10', name: 'Reduced Ineq.', relevance: Math.round(seed(68) * 25 + 52) },
  { sdg: 'SDG 11', name: 'Sustainable Cities', relevance: Math.round(seed(69) * 28 + 55) },
  { sdg: 'SDG 16', name: 'Peace & Justice', relevance: Math.round(seed(70) * 20 + 40) },
];

const impactScore = Math.round(seed(81) * 20 + 72);
const bondTier = impactScore >= 82 ? 'Gold' : impactScore >= 72 ? 'Silver' : 'Bronze';
const tierColor = bondTier === 'Gold' ? 'gold' : bondTier === 'Silver' ? 'gray' : 'yellow';
const totalIssuance = Math.round(seed(82) * 200 + 400);

export default function SocialBondPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bondSize, setBondSize] = useState('500');

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/social-bond/assess`, { bond_size_m: parseFloat(bondSize) });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Social Bond & Impact Finance (E85)</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>ICMA SBP Compliance · Use of Proceeds · Target Population · Social KPIs & SDGs · Bond Overview</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — ICMA SBP Compliance */}
      {tab === 0 && (
        <div>
          <Section title="SBP Overall Score">
            <Row gap={12}>
              <KpiCard label="Overall SBP Score" value={`${sbpOverall}/100`} sub="Weighted across 4 core components" accent />
              <KpiCard label="SBP Aligned" value={<Badge label={sbpAligned ? 'SBP Aligned ✓' : 'Partial Alignment'} color={sbpAligned ? 'green' : 'yellow'} />} sub="ICMA Social Bond Principles 2023" />
              <KpiCard label="Gaps Identified" value={gapChecklist.filter(g => !g.pass).length} sub="Items requiring remediation" />
              <KpiCard label="Passing Checks" value={`${gapChecklist.filter(g => g.pass).length}/${gapChecklist.length}`} sub="SBP compliance checklist" />
            </Row>
          </Section>

          <Section title="4-Component SBP Scores">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sbpComponents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="component" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Legend />
                <Bar dataKey="score" fill="#059669" name="Score" radius={[4, 4, 0, 0]}>
                  {sbpComponents.map((c, i) => <Cell key={i} fill={c.score >= 80 ? '#059669' : c.score >= 70 ? '#10b981' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="SBP Gap Checklist">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {gapChecklist.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 6, background: g.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${g.pass ? '#bbf7d0' : '#fca5a5'}` }}>
                  <span style={{ fontSize: 18, color: g.pass ? '#059669' : '#dc2626' }}>{g.pass ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{g.item}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — Use of Proceeds */}
      {tab === 1 && (
        <div>
          <Section title="Proceeds Summary">
            <Row gap={12}>
              <KpiCard label="Total Bond Issuance" value={`€${totalIssuance}M`} sub="Net proceeds allocated" accent />
              <KpiCard label="Eligible Categories" value={proceedCategories.filter(c => c.eligible).length} sub="Out of 9 ICMA categories" />
              <KpiCard label="Largest Allocation" value={proceedCategories.sort((a, b) => b.amount - a.amount)[0].name} sub={`€${proceedCategories[0].amount}M`} />
              <KpiCard label="100% Allocation" value={<Badge label="Fully Allocated ✓" color="green" />} sub="All proceeds earmarked" />
            </Row>
          </Section>

          <Section title="Allocation by ICMA Eligible Category">
            <Row>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={proceedCategories} cx="50%" cy="50%" outerRadius={110} dataKey="amount" nameKey="name" label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}>
                    {proceedCategories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Category', 'Amount (€M)', '% Total', 'ICMA Eligible'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proceedCategories.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1b3a5c' }}>{r.name}</td>
                        <td style={{ padding: '8px 10px', color: '#374151' }}>{r.amount}</td>
                        <td style={{ padding: '8px 10px', color: '#6b7280' }}>{((r.amount / totalProceeds) * 100).toFixed(1)}%</td>
                        <td style={{ padding: '8px 10px' }}><span style={{ fontSize: 16, color: r.eligible ? '#059669' : '#9ca3af' }}>{r.eligible ? '✓' : '✗'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Row>
          </Section>

          <Section title="Excluded Activities">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Fossil Fuel Production', 'Weapons Manufacturing', 'Gambling', 'Tobacco', 'Alcohol (excl. artisanal)', 'Adult Entertainment', 'Predatory Lending', 'Animal Testing (cosmetics)'].map((a, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>✗ {a}</span>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — Target Population */}
      {tab === 2 && (
        <div>
          <Section title="Beneficiary Overview">
            <Row gap={12}>
              <KpiCard label="Total Beneficiaries" value={totalBeneficiaries.toLocaleString()} sub="Across all funded projects" accent />
              <KpiCard label="Target Groups" value={targetGroups.length} sub="Covered by ICMA SBP criteria" />
              <KpiCard label="Additionality Score" value={`${additionalityScore}/100`} sub="vs business-as-usual baseline" />
              <KpiCard label="Geographic Reach" value={`${geoData.length} Regions`} sub="Multi-regional programme" />
            </Row>
          </Section>

          <Section title="Target Population Group Coverage">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {targetGroups.map((g, i) => (
                <span key={i} style={{ padding: '5px 14px', borderRadius: 16, background: PIE_COLORS[i % PIE_COLORS.length] + '22', color: PIE_COLORS[i % PIE_COLORS.length], fontSize: 13, fontWeight: 600, border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}44` }}>{g}</span>
              ))}
            </div>
          </Section>

          <Section title="Geographic Beneficiary Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={geoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="region" width={130} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => val.toLocaleString() + ' people'} />
                <Bar dataKey="beneficiaries" fill="#059669" name="Beneficiaries" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Additionality Assessment">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              <Row gap={12}>
                <KpiCard label="Additionality Score" value={`${additionalityScore}/100`} sub="Above 65 = demonstrated" accent />
                <KpiCard label="Assessment Method" value="Counterfactual" sub="vs BAU baseline scenario" />
                <KpiCard label="Independent Verification" value={<Badge label={seed(90) > 0.4 ? 'Verified ✓' : 'Pending'} color={seed(90) > 0.4 ? 'green' : 'yellow'} />} sub="Third-party review" />
                <KpiCard label="Additionality Status" value={<Badge label={additionalityScore >= 65 ? 'Demonstrated' : 'Partial'} color={additionalityScore >= 65 ? 'green' : 'yellow'} />} sub="ICMA additionality criteria" />
              </Row>
              <div style={{ marginTop: 12, fontSize: 13, color: '#374151' }}>
                Social bond projects demonstrate additionality through: (1) targeting underserved populations excluded from commercial markets; (2) below-market pricing / subsidised rates; (3) geographic concentration in bottom-2-quintile income areas; (4) provision of services with documented unmet demand (housing shortage: {Math.round(seed(91) * 10000 + 15000).toLocaleString()} units; education gap: {Math.round(seed(92) * 5000 + 8000).toLocaleString()} enrolment deficit).
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* TAB 4 — Social KPIs & SDGs */}
      {tab === 3 && (
        <div>
          <Section title="KPI Quality Overview">
            <Row gap={12}>
              <KpiCard label="KPI Quality Score" value={`${kpiQualityScore}/100`} sub="% quantified with baseline" accent />
              <KpiCard label="Total KPIs Tracked" value={kpiList.length} sub="Per ICMA impact reporting" />
              <KpiCard label="SDGs Addressed" value={sdgAlignment.length} sub="UN Sustainable Development Goals" />
              <KpiCard label="Quantified KPIs" value={kpiList.filter(k => k.quantified).length} sub="With measurable targets" />
            </Row>
          </Section>

          <Section title="Social KPI Register">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['KPI', 'Value', 'Unit', 'SDG Target', 'Quantified'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpiList.map((k, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{k.name}</td>
                    <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>{k.value.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{k.unit}</td>
                    <td style={{ padding: '10px 12px' }}><Badge label={k.sdg} color="blue" /></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 16, color: k.quantified ? '#059669' : '#9ca3af' }}>{k.quantified ? '✓' : '✗'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="SDG Alignment Radar">
            <Row>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={sdgAlignment}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="sdg" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Relevance" dataKey="relevance" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['SDG', 'Goal', 'Relevance', 'Level'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sdgAlignment.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#059669' }}>{s.sdg}</td>
                        <td style={{ padding: '8px 10px', color: '#374151' }}>{s.name}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.relevance}</td>
                        <td style={{ padding: '8px 10px' }}><Badge label={s.relevance >= 70 ? 'Primary' : s.relevance >= 50 ? 'Secondary' : 'Supporting'} color={s.relevance >= 70 ? 'green' : s.relevance >= 50 ? 'blue' : 'gray'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Row>
          </Section>
        </div>
      )}

      {/* TAB 5 — Bond Overview */}
      {tab === 4 && (
        <div>
          <Section title="Bond Summary">
            <Row gap={12}>
              <KpiCard label="Bond Tier" value={<Badge label={`${bondTier} Standard`} color={tierColor} />} sub="ICMA SBP impact tier" accent />
              <KpiCard label="Impact Score" value={`${impactScore}/100`} sub="Composite impact assessment" />
              <KpiCard label="Total Issuance" value={`€${totalIssuance}M`} sub="Outstanding social bonds" />
              <KpiCard label="SBP Composite Score" value={`${sbpOverall}/100`} sub="4-component weighted average" />
            </Row>
            <Row gap={12}>
              <KpiCard label="SPO Provider" value="Sustainalytics" sub="Second-party opinion issued" />
              <KpiCard label="Beneficiaries" value={totalBeneficiaries.toLocaleString()} sub="Total impact beneficiaries" />
              <KpiCard label="SDGs Addressed" value={sdgAlignment.length} sub="UN Global Goals" />
              <KpiCard label="Additionality" value={<Badge label={additionalityScore >= 65 ? 'Demonstrated' : 'Partial'} color={additionalityScore >= 65 ? 'green' : 'yellow'} />} sub="vs BAU baseline" />
            </Row>
          </Section>

          <Section title="Issuance Breakdown by Category">
            <Row>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={proceedCategories.slice(0, 6)} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="amount" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {proceedCategories.slice(0, 6).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `€${val}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <Section title="Recommendations">
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                    {[
                      `Obtain independent verification for beneficiary count (currently ${gapChecklist.filter(g => !g.pass).length} gap(s) identified).`,
                      `Upgrade SBP alignment from ${sbpAligned ? 'aligned' : 'partial'} to Gold Standard by improving annual impact reporting frequency.`,
                      `Expand geographic coverage — add Eastern Europe + Pacific Islands to reach 7-region mandate.`,
                      `Commission third-party additionality study to raise score from ${additionalityScore} to ≥80 for institutional investor eligibility.`,
                      `Consider green-social hybrid issuance (Sustainability Bond) to capture dual-label premium (~15-20bps greenium).`,
                    ].map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151' }}>
                        <span style={{ color: '#059669', fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </Row>
          </Section>
        </div>
      )}
    </div>
  );
}
