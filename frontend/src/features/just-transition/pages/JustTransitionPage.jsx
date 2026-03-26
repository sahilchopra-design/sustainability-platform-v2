import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const API = 'http://localhost:8001';
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

const TABS = ['Overview', 'Workforce Transition', 'EU JTF Eligibility', 'Community Resilience', 'CIF Facilities'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const SECTORS = [
  { value: 'coal_mining', label: 'Coal Mining' },
  { value: 'oil_gas', label: 'Oil & Gas Extraction' },
  { value: 'fossil_power', label: 'Fossil Power Generation' },
  { value: 'steel', label: 'Steel / Iron' },
  { value: 'cement', label: 'Cement / Building Materials' },
  { value: 'petrochemicals', label: 'Petrochemicals' },
  { value: 'automotive', label: 'Automotive (ICE)' },
  { value: 'aviation', label: 'Aviation' },
];

const sectorIndex = (sector) => SECTORS.findIndex(s => s.value === sector) + 1;

const getOverviewData = (sector) => {
  const si = sectorIndex(sector);
  const jtScore = Math.round(seed(si * 7) * 30 + 45);
  const iloComposite = Math.round(seed(si * 11) * 28 + 48);
  const jtfEligible = seed(si * 13) > 0.4;
  const tier = jtScore >= 65 ? 'Low Transition Risk' : jtScore >= 50 ? 'Moderate' : jtScore >= 38 ? 'Elevated' : 'High Risk';
  const tierColor = tier === 'Low Transition Risk' ? 'green' : tier === 'Moderate' ? 'blue' : tier === 'Elevated' ? 'yellow' : 'red';
  const iloPrinciples = [
    { principle: 'Decent Work', score: Math.round(seed(si * 17) * 30 + 50) },
    { principle: 'Social Dialogue', score: Math.round(seed(si * 19) * 28 + 48) },
    { principle: 'Social Protection', score: Math.round(seed(si * 23) * 32 + 45) },
    { principle: 'Rights & Equity', score: Math.round(seed(si * 29) * 25 + 52) },
    { principle: 'Low-Carbon Dev.', score: Math.round(seed(si * 31) * 30 + 47) },
  ];
  const benchmarkData = [
    { metric: 'JT Score', sector: jtScore, benchmark: Math.round(seed(si * 37) * 15 + 52) },
    { metric: 'ILO Composite', sector: iloComposite, benchmark: Math.round(seed(si * 41) * 12 + 50) },
    { metric: 'Social Dialogue', sector: iloPrinciples[1].score, benchmark: Math.round(seed(si * 43) * 14 + 53) },
    { metric: 'Reskilling', sector: Math.round(seed(si * 47) * 28 + 45), benchmark: Math.round(seed(si * 53) * 12 + 48) },
  ];
  return { jtScore, iloComposite, jtfEligible, tier, tierColor, iloPrinciples, benchmarkData };
};

const getWorkforceData = (sector) => {
  const si = sectorIndex(sector);
  const affectedWorkers = Math.round(seed(si * 57) * 50000 + 10000);
  const greenJobsCreated = Math.round(seed(si * 59) * 30000 + 5000);
  const netImpact = greenJobsCreated - affectedWorkers;
  const wageGap = parseFloat((seed(si * 61) * 20 + 5).toFixed(1));

  const fossilVsGreen = [
    { sector: 'Wind', fossil: Math.round(seed(si * 67) * 5000 + 2000), green: Math.round(seed(si * 71) * 8000 + 3000) },
    { sector: 'Solar', fossil: Math.round(seed(si * 73) * 4000 + 1500), green: Math.round(seed(si * 79) * 7000 + 2500) },
    { sector: 'Grid', fossil: Math.round(seed(si * 83) * 3000 + 2000), green: Math.round(seed(si * 89) * 5000 + 2000) },
    { sector: 'EVs', fossil: Math.round(seed(si * 97) * 6000 + 3000), green: Math.round(seed(si * 101) * 9000 + 4000) },
    { sector: 'H2', fossil: Math.round(seed(si * 103) * 2000 + 1000), green: Math.round(seed(si * 107) * 4000 + 1500) },
    { sector: 'Retrofit', fossil: Math.round(seed(si * 109) * 3000 + 1500), green: Math.round(seed(si * 113) * 5500 + 2000) },
  ];

  const trajectory = Array.from({ length: 16 }, (_, i) => ({
    year: 2025 + i,
    fossil: Math.max(0, Math.round(affectedWorkers * (1 - i * 0.065 - seed(si + i) * 0.02))),
    green: Math.round(greenJobsCreated * (i * 0.07 + 0.05 + seed(si * 2 + i) * 0.03)),
  }));

  return { affectedWorkers, greenJobsCreated, netImpact, wageGap, fossilVsGreen, trajectory };
};

const getJTFData = (sector) => {
  const si = sectorIndex(sector);
  const jtfEligible = seed(si * 13) > 0.4;
  const jtfAllocation = parseFloat((seed(si * 117) * 500 + 100).toFixed(1));
  const planScore = Math.round(seed(si * 119) * 30 + 50);
  const criteria = [
    { criterion: 'Fossil Fuel Dependency', score: Math.round(seed(si * 121) * 30 + 50) },
    { criterion: 'GHG Intensity', score: Math.round(seed(si * 123) * 28 + 48) },
    { criterion: 'Employment Concentration', score: Math.round(seed(si * 127) * 32 + 45) },
    { criterion: 'Regional GDP Exposure', score: Math.round(seed(si * 129) * 25 + 52) },
    { criterion: 'Just Transition Plan', score: planScore },
    { criterion: 'Stakeholder Engagement', score: Math.round(seed(si * 131) * 28 + 50) },
    { criterion: 'Reskilling Programme', score: Math.round(seed(si * 133) * 30 + 48) },
    { criterion: 'Community Investment', score: Math.round(seed(si * 137) * 25 + 47) },
  ];
  return { jtfEligible, jtfAllocation, planScore, criteria };
};

const getCommunityData = (sector) => {
  const si = sectorIndex(sector);
  const gdpDep = parseFloat((seed(si * 139) * 30 + 15).toFixed(1));
  const strandedInfra = parseFloat((seed(si * 141) * 2000 + 200).toFixed(0));
  const reskillingCost = parseFloat((seed(si * 143) * 500 + 50).toFixed(0));

  const vulnerabilityFactors = [
    { factor: 'Single-Industry Dep.', score: Math.round(seed(si * 147) * 35 + 45) },
    { factor: 'Income Inequality', score: Math.round(seed(si * 149) * 30 + 40) },
    { factor: 'Education Gap', score: Math.round(seed(si * 151) * 32 + 42) },
    { factor: 'Infrastructure Age', score: Math.round(seed(si * 153) * 28 + 48) },
    { factor: 'Health Outcomes', score: Math.round(seed(si * 157) * 25 + 50) },
    { factor: 'Migration Risk', score: Math.round(seed(si * 159) * 30 + 45) },
  ];

  const financeSplit = [
    { name: 'Public (EU JTF)', value: Math.round(seed(si * 161) * 15 + 40) },
    { name: 'Private Investment', value: Math.round(seed(si * 163) * 12 + 25) },
    { name: 'Concessional DFI', value: Math.round(seed(si * 167) * 10 + 20) },
    { name: 'National Budget', value: Math.round(seed(si * 169) * 8 + 15) },
  ];

  return { gdpDep, strandedInfra, reskillingCost, vulnerabilityFactors, financeSplit };
};

const getCIFData = () => {
  const facilities = [
    { name: 'CTF Clean Technology', score: Math.round(seed(171) * 25 + 60), financeM: Math.round(seed(173) * 400 + 200), type: 'Concessional Loan' },
    { name: 'SREP Renewable Energy', score: Math.round(seed(177) * 28 + 58), financeM: Math.round(seed(179) * 300 + 150), type: 'Grant + Loan' },
    { name: 'PPCR Climate Resilience', score: Math.round(seed(181) * 22 + 55), financeM: Math.round(seed(183) * 250 + 100), type: 'Grant' },
    { name: 'FIP Forest Investment', score: Math.round(seed(187) * 30 + 52), financeM: Math.round(seed(189) * 200 + 80), type: 'Grant' },
  ];
  const eligibleFacilities = facilities.filter(f => f.score >= 60).length;
  const totalFinance = facilities.reduce((s, f) => s + f.financeM, 0);
  const topFacility = [...facilities].sort((a, b) => b.score - a.score)[0];

  const financeTypeSplit = [
    { name: 'Concessional Loan', value: Math.round(seed(191) * 15 + 38) },
    { name: 'Grant', value: Math.round(seed(193) * 12 + 28) },
    { name: 'Risk Guarantee', value: Math.round(seed(197) * 10 + 18) },
    { name: 'Equity', value: Math.round(seed(199) * 8 + 16) },
  ];

  return { facilities, eligibleFacilities, totalFinance, topFacility, financeTypeSplit };
};

export default function JustTransitionPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sector, setSector] = useState('coal_mining');
  const [region, setRegion] = useState('silesia');

  const overview = getOverviewData(sector);
  const workforce = getWorkforceData(sector);
  const jtf = getJTFData(sector);
  const community = getCommunityData(sector);
  const cif = getCIFData();

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/just-transition/assess`, { sector, region });
    } catch {
      setError('API unavailable — demo mode.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Just Transition Finance</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>ILO Just Transition Principles · EU JTF Reg. 2021/1056 · CIF Facilities · Community Resilience · Workforce Impact</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        <Sel label="Sector" value={sector} onChange={setSector} options={SECTORS} />
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 12, marginLeft: 8 }}>
          <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run JT Assessment'}</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — Overview */}
      {tab === 0 && (
        <div>
          <Section title="Just Transition Summary">
            <Row gap={12}>
              <KpiCard label="JT Score" value={`${overview.jtScore}/100`} sub="ILO JT Guidelines composite" accent />
              <KpiCard label="Transition Risk Tier" value={<Badge label={overview.tier} color={overview.tierColor} />} sub="5-factor transition risk tier" />
              <KpiCard label="ILO Composite" value={`${overview.iloComposite}/100`} sub="5 ILO Just Transition principles" />
              <KpiCard label="EU JTF Eligible" value={<Badge label={overview.jtfEligible ? 'Eligible ✓' : 'Not Eligible'} color={overview.jtfEligible ? 'green' : 'red'} />} sub="EU JTF Regulation 2021/1056" />
            </Row>
          </Section>

          <Row>
            <Section title="ILO Just Transition Principles Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={overview.iloPrinciples}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="principle" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="JT Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Score vs Sector Benchmark">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sector" fill="#059669" name={SECTORS.find(s => s.value === sector)?.label} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" fill="#d1d5db" name="Sector Benchmark" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — Workforce Transition */}
      {tab === 1 && (
        <div>
          <Section title="Workforce Transition Summary">
            <Row gap={12}>
              <KpiCard label="Affected Workers" value={workforce.affectedWorkers.toLocaleString()} sub="Fossil fuel / high-carbon jobs at risk" accent />
              <KpiCard label="Green Jobs Created" value={workforce.greenJobsCreated.toLocaleString()} sub="Estimated new low-carbon positions" />
              <KpiCard label="Net Impact" value={<span style={{ color: workforce.netImpact >= 0 ? '#059669' : '#dc2626' }}>{workforce.netImpact >= 0 ? '+' : ''}{workforce.netImpact.toLocaleString()}</span>} sub="Net employment change" />
              <KpiCard label="Wage Gap %" value={`${workforce.wageGap}%`} sub="Fossil vs green job wage differential" />
            </Row>
          </Section>

          <Section title="Fossil vs Green Employment by Sector">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workforce.fossilVsGreen}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(val) => val.toLocaleString() + ' workers'} />
                <Legend />
                <Bar dataKey="fossil" fill="#ef4444" name="Fossil Employment" radius={[4, 4, 0, 0]} />
                <Bar dataKey="green" fill="#059669" name="Green Employment" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Employment Transition Trajectory (2025–2040)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={workforce.trajectory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(val) => val.toLocaleString() + ' workers'} />
                <Legend />
                <Line type="monotone" dataKey="fossil" stroke="#ef4444" strokeWidth={2} name="Fossil Jobs" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="green" stroke="#059669" strokeWidth={2} name="Green Jobs" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 3 — EU JTF Eligibility */}
      {tab === 2 && (
        <div>
          <Section title="EU JTF Eligibility Summary">
            <Row gap={12}>
              <KpiCard label="JTF Eligible" value={<Badge label={jtf.jtfEligible ? 'Eligible ✓' : 'Not Eligible ✗'} color={jtf.jtfEligible ? 'green' : 'red'} />} sub="EU Reg. 2021/1056 Article 3" accent />
              <KpiCard label="JTF Allocation (€M)" value={`€${jtf.jtfAllocation.toLocaleString()}M`} sub="Estimated territorial JTF envelope" />
              <KpiCard label="Territorial Plan Score" value={`${jtf.planScore}/100`} sub="TJTP quality assessment" />
              <KpiCard label="Criteria Passing" value={`${jtf.criteria.filter(c => c.score >= 60).length} / 8`} sub="Score ≥ 60 threshold" />
            </Row>
          </Section>

          <Section title="8 JTF Eligibility Criteria Scores">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={jtf.criteria} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="criterion" width={200} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="Eligibility Score" radius={[0, 4, 4, 0]}>
                  {jtf.criteria.map((c, i) => <Cell key={i} fill={c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="JTF Status">
            <div style={{ background: jtf.jtfEligible ? '#f0fdf4' : '#fef2f2', border: `1px solid ${jtf.jtfEligible ? '#bbf7d0' : '#fca5a5'}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: jtf.jtfEligible ? '#065f46' : '#dc2626', marginBottom: 8 }}>
                {jtf.jtfEligible ? 'Eligible for EU Just Transition Fund support' : 'Does not currently meet EU JTF eligibility thresholds'}
              </div>
              <div style={{ fontSize: 13, color: '#374151' }}>
                {jtf.jtfEligible
                  ? `Estimated JTF territorial allocation: €${jtf.jtfAllocation}M. A Territorial Just Transition Plan (TJTP) scoring ${jtf.planScore}/100 must be approved by the European Commission before disbursement.`
                  : `${jtf.criteria.filter(c => c.score < 60).length} criteria require improvement. Focus areas: ${jtf.criteria.filter(c => c.score < 60).slice(0, 2).map(c => c.criterion).join(', ')}.`}
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* TAB 4 — Community Resilience */}
      {tab === 3 && (
        <div>
          <Section title="Community Resilience Summary">
            <Row gap={12}>
              <KpiCard label="GDP Dependency %" value={`${community.gdpDep}%`} sub="Regional GDP from target sector" accent />
              <KpiCard label="Stranded Infrastructure (€M)" value={`€${Number(community.strandedInfra).toLocaleString()}M`} sub="Assets at risk of stranding" />
              <KpiCard label="Reskilling Cost (€M)" value={`€${Number(community.reskillingCost).toLocaleString()}M`} sub="Estimated workforce reskilling cost" />
              <KpiCard label="Vulnerability Tier" value={<Badge label={community.gdpDep >= 35 ? 'High' : community.gdpDep >= 20 ? 'Medium' : 'Low'} color={community.gdpDep >= 35 ? 'red' : community.gdpDep >= 20 ? 'yellow' : 'green'} />} sub="ILO community vulnerability index" />
            </Row>
          </Section>

          <Row>
            <Section title="Community Vulnerability Factors">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={community.vulnerabilityFactors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="factor" width={175} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="Vulnerability Score" radius={[0, 4, 4, 0]}>
                    {community.vulnerabilityFactors.map((f, i) => <Cell key={i} fill={f.score >= 60 ? '#ef4444' : f.score >= 45 ? '#f59e0b' : '#059669'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Finance Source Split">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={community.financeSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {community.financeSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 5 — CIF Facilities */}
      {tab === 4 && (
        <div>
          <Section title="CIF (Climate Investment Funds) Summary">
            <Row gap={12}>
              <KpiCard label="Eligible Facilities" value={`${cif.eligibleFacilities} / 4`} sub="Score ≥ 60 CIF eligibility threshold" accent />
              <KpiCard label="Concessional Finance (€M)" value={`€${cif.totalFinance.toLocaleString()}M`} sub="Total across eligible CIF facilities" />
              <KpiCard label="Top Facility" value={cif.topFacility.name.split(' ').slice(0, 2).join(' ')} sub={`Score: ${cif.topFacility.score}/100`} />
              <KpiCard label="Finance Type" value={cif.topFacility.type} sub="Dominant CIF instrument type" />
            </Row>
          </Section>

          <Section title="CIF Facility Eligibility Scores">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cif.facilities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="Eligibility Score" radius={[4, 4, 0, 0]}>
                  {cif.facilities.map((f, i) => <Cell key={i} fill={f.score >= 65 ? '#059669' : f.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Row>
            <Section title="Finance Type Breakdown">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={cif.financeTypeSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {cif.financeTypeSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Facility Detail">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Facility', 'Type', 'Finance (€M)', 'Eligible'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cif.facilities.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111827', fontSize: 12 }}>{f.name}</td>
                      <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 12 }}>{f.type}</td>
                      <td style={{ padding: '8px 10px', color: '#374151' }}>€{f.financeM}M</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: 16, color: f.score >= 60 ? '#059669' : '#9ca3af' }}>{f.score >= 60 ? '✓' : '✗'}</span>
                      </td>
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
