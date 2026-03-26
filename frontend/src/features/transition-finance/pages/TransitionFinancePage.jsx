import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line, Cell, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';

const seededRandom = (seed) => {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const hashStr = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
};

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

const TABS = ['TPT Credibility', 'SBTi Validation', 'Race to Zero', 'Portfolio Temperature', 'TNFD & Instrument'];

const SECTOR_OPTIONS = [
  { value: 'power', label: 'Power & Utilities' },
  { value: 'oil_gas', label: 'Oil & Gas' },
  { value: 'steel', label: 'Steel / Metals' },
  { value: 'cement', label: 'Cement / Materials' },
  { value: 'aviation', label: 'Aviation' },
  { value: 'shipping', label: 'Shipping / Maritime' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'banking', label: 'Banking / Finance' },
  { value: 'automotive', label: 'Automotive' },
];

const INSTRUMENT_OPTIONS = [
  { value: 'transition_bond', label: 'Transition Bond' },
  { value: 'sll', label: 'Sustainability-Linked Loan (SLL)' },
  { value: 'tlf', label: 'Transition-Linked Finance (TLF)' },
  { value: 'blended', label: 'Blended Finance' },
  { value: 'equity', label: 'Transition Equity' },
];

const getTPTData = (sector, instrument, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const elements = [
    { dimension: 'Foundations', score: Math.round(r(1) * 30 + 52) },
    { dimension: 'Implementation', score: Math.round(r(2) * 32 + 48) },
    { dimension: 'Engagement', score: Math.round(r(3) * 28 + 50) },
    { dimension: 'Metrics', score: Math.round(r(4) * 30 + 50) },
    { dimension: 'Governance', score: Math.round(r(5) * 25 + 55) },
    { dimension: 'Finance', score: Math.round(r(6) * 28 + 52) },
  ];
  const composite = Math.round(elements.reduce((s, e) => s + e.score, 0) / 6);
  const qualityTier = composite >= 80 ? 'leading' : composite >= 65 ? 'advanced' : composite >= 50 ? 'developing' : 'initial';
  const sbtStatus = r(7) > 0.5 ? 'Committed' : r(7) > 0.25 ? 'Validated' : 'Not Committed';
  const rtzMember = r(8) > 0.45;
  return { elements, composite, qualityTier, sbtStatus, rtzMember };
};

const getSBTiData = (sector, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const nearTerm = Math.round(r(10) * 30 + 50);
  const longTerm = Math.round(r(11) * 32 + 45);
  const netZero = Math.round(r(12) * 28 + 48);
  const alignment15c = parseFloat((r(13) * 0.4 + 0.3).toFixed(2));

  const sectorBaselines = { power: 800, oil_gas: 1200, steel: 1800, cement: 750, aviation: 650, shipping: 500, agriculture: 400, real_estate: 250, banking: 180, automotive: 300 };
  const baseline = sectorBaselines[sector] || 500;

  const pathway = [
    { year: 2024, current: baseline, paris: Math.round(baseline * 0.98) },
    { year: 2026, current: Math.round(baseline * (0.92 + r(14) * 0.04)), paris: Math.round(baseline * 0.88) },
    { year: 2028, current: Math.round(baseline * (0.82 + r(15) * 0.06)), paris: Math.round(baseline * 0.76) },
    { year: 2030, current: Math.round(baseline * (0.70 + r(16) * 0.08)), paris: Math.round(baseline * 0.62) },
    { year: 2035, current: Math.round(baseline * (0.52 + r(17) * 0.10)), paris: Math.round(baseline * 0.42) },
    { year: 2040, current: Math.round(baseline * (0.35 + r(18) * 0.12)), paris: Math.round(baseline * 0.25) },
    { year: 2045, current: Math.round(baseline * (0.20 + r(19) * 0.10)), paris: Math.round(baseline * 0.10) },
    { year: 2050, current: Math.round(baseline * (0.08 + r(20) * 0.08)), paris: 0 },
  ];

  const targets = [
    { name: 'Near-term (2030)', score: nearTerm },
    { name: 'Long-term (2040)', score: longTerm },
    { name: 'Net Zero (2050)', score: netZero },
  ];

  return { nearTerm, longTerm, netZero, alignment15c, pathway, targets };
};

const getRtZData = (seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const checklist = [
    { step: 'Pledge', desc: 'Commit to net-zero by 2050 latest', met: r(20) > 0.3 },
    { step: 'Plan', desc: '1.5°C-aligned transition plan published', met: r(21) > 0.4 },
    { step: 'Proceed', desc: 'Near-term actions underway', met: r(22) > 0.35 },
    { step: 'Publish', desc: 'Annual progress disclosure', met: r(23) > 0.38 },
    { step: 'Account', desc: 'Independent verification of claims', met: r(24) > 0.45 },
  ];
  const metCount = checklist.filter(c => c.met).length;
  const rtzScore = Math.round(metCount * 20);
  const initiatives = [
    { name: 'GFANZ', member: r(25) > 0.5 },
    { name: 'NZBA', member: r(26) > 0.55 },
    { name: 'NZAM', member: r(27) > 0.6 },
    { name: 'NZI', member: r(28) > 0.58 },
    { name: 'NZAOA', member: r(29) > 0.62 },
    { name: 'RE100', member: r(30) > 0.45 },
  ];
  const scoreData = checklist.map(c => ({ step: c.step, score: c.met ? 100 : Math.round(r(31 + checklist.indexOf(c)) * 40 + 20) }));
  return { checklist, metCount, rtzScore, initiatives, scoreData };
};

const getPortfolioTempData = (sector, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const portfolioTemp = parseFloat((1.8 + r(40) * 1.8).toFixed(1));
  const waci = Math.round(r(41) * 300 + 50);
  const engagementCoverage = Math.round(r(42) * 40 + 40);
  const parisAligned = Math.round(r(43) * 35 + 20);

  const trajectory = [
    { year: 2024, temp: portfolioTemp },
    { year: 2026, temp: parseFloat((portfolioTemp * (0.97 + r(44) * 0.02)).toFixed(1)) },
    { year: 2028, temp: parseFloat((portfolioTemp * (0.93 + r(45) * 0.03)).toFixed(1)) },
    { year: 2030, temp: parseFloat((portfolioTemp * (0.88 + r(46) * 0.04)).toFixed(1)) },
    { year: 2035, temp: parseFloat((portfolioTemp * (0.78 + r(47) * 0.05)).toFixed(1)) },
    { year: 2040, temp: parseFloat((portfolioTemp * (0.65 + r(48) * 0.06)).toFixed(1)) },
    { year: 2050, temp: parseFloat((portfolioTemp * (0.45 + r(49) * 0.08)).toFixed(1)) },
  ];

  const holdings = [
    { sector: 'High Emitters', aligned: Math.round(r(50) * 25 + 10), not_aligned: Math.round(r(51) * 30 + 30) },
    { sector: 'Transitioning', aligned: Math.round(r(52) * 30 + 25), not_aligned: Math.round(r(53) * 20 + 20) },
    { sector: 'Low Carbon', aligned: Math.round(r(54) * 20 + 35), not_aligned: Math.round(r(55) * 15 + 10) },
    { sector: 'RE & Tech', aligned: Math.round(r(56) * 25 + 40), not_aligned: Math.round(r(57) * 12 + 8) },
  ];

  return { portfolioTemp, waci, engagementCoverage, parisAligned, trajectory, holdings };
};

const getTNFDInstrumentData = (instrument, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const leapStages = [
    { stage: 'L1: Locate', desc: 'Identify interfaces with nature', complete: r(60) > 0.3 },
    { stage: 'L2: Evaluate', desc: 'Evaluate dependencies & impacts', complete: r(61) > 0.4 },
    { stage: 'A1: Assess', desc: 'Assess material risks & opportunities', complete: r(62) > 0.45 },
    { stage: 'P1: Prepare', desc: 'Prepare response strategy', complete: r(63) > 0.5 },
  ];
  const sbtnSteps = [
    { step: 'Step 1: Assess', complete: r(64) > 0.35 },
    { step: 'Step 2: Interpret & Prioritise', complete: r(65) > 0.45 },
    { step: 'Step 3: Measure & Set Targets', complete: r(66) > 0.55 },
    { step: 'Step 4: Act', complete: r(67) > 0.6 },
    { step: 'Step 5: Track & Disclose', complete: r(68) > 0.65 },
  ];

  const instrumentScore = [
    { name: 'KPI Ambition', score: Math.round(r(69) * 32 + 50) },
    { name: 'SPT Calibration', score: Math.round(r(70) * 28 + 52) },
    { name: 'Greenwash Flags', score: Math.round(r(71) * 30 + 48) },
    { name: 'Reporting Quality', score: Math.round(r(72) * 25 + 55) },
    { name: 'Third-party Verify', score: Math.round(r(73) * 28 + 50) },
  ];
  const credibilityScore = Math.round(instrumentScore.reduce((s, i) => s + i.score, 0) / instrumentScore.length);
  const credibilityTier = credibilityScore >= 75 ? 'high' : credibilityScore >= 58 ? 'medium' : 'low';

  return { leapStages, sbtnSteps, instrumentScore, credibilityScore, credibilityTier };
};

export default function TransitionFinancePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('Atlas Energy Corp');
  const [sector, setSector] = useState('power');
  const [instrument, setInstrument] = useState('transition_bond');

  const seed0 = hashStr(companyName + sector + instrument);
  const tpt = getTPTData(sector, instrument, seed0);
  const sbti = getSBTiData(sector, seed0);
  const rtz = getRtZData(seed0);
  const portTemp = getPortfolioTempData(sector, seed0);
  const tnfdInst = getTNFDInstrumentData(instrument, seed0);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/transition-finance/assess`, {
        company_name: companyName, sector, instrument_type: instrument,
      });
    } catch {
      setError('API unavailable — demo mode.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Transition Finance Assessment</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>TPT Disclosure Framework · SBTi Validation · Race to Zero · Portfolio Temperature · TNFD LEAP</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      <Section title="Company Parameters">
        <Row>
          <Inp label="Company Name" value={companyName} onChange={setCompanyName} />
          <Sel label="Sector" value={sector} onChange={setSector} options={SECTOR_OPTIONS} />
          <Sel label="Instrument Type" value={instrument} onChange={setInstrument} options={INSTRUMENT_OPTIONS} />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — TPT Credibility */}
      {tab === 0 && (
        <div>
          <Section title="TPT Framework Summary">
            <Row gap={12}>
              <KpiCard label="TPT Composite Score" value={`${tpt.composite}/100`} sub="6-element TPT Disclosure Framework" accent />
              <KpiCard label="Quality Tier" value={<Badge label={tpt.qualityTier} color={tpt.qualityTier === 'leading' ? 'green' : tpt.qualityTier === 'advanced' ? 'blue' : tpt.qualityTier === 'developing' ? 'yellow' : 'gray'} />} sub="initial → developing → advanced → leading" />
              <KpiCard label="SBTi Status" value={<Badge label={tpt.sbtStatus} color={tpt.sbtStatus === 'Validated' ? 'green' : tpt.sbtStatus === 'Committed' ? 'blue' : 'gray'} />} sub="Science-Based Targets initiative" />
              <KpiCard label="Race to Zero" value={<Badge label={tpt.rtzMember ? '✓ Member' : '✗ Not Member'} color={tpt.rtzMember ? 'green' : 'gray'} />} sub="UNFCCC Race to Zero campaign" />
            </Row>
          </Section>
          <Row>
            <Section title="6 TPT Elements Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={tpt.elements}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="TPT Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Element Scores">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={tpt.elements} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="dimension" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <ReferenceLine x={65} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Advanced', fontSize: 9, fill: '#f59e0b' }} />
                  <ReferenceLine x={80} stroke="#059669" strokeDasharray="4 4" label={{ value: 'Leading', fontSize: 9, fill: '#059669' }} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {tpt.elements.map((e, i) => <Cell key={i} fill={e.score >= 80 ? '#059669' : e.score >= 65 ? '#3b82f6' : e.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — SBTi Validation */}
      {tab === 1 && (
        <div>
          <Section title="SBTi Target Assessment">
            <Row gap={12}>
              <KpiCard label="Near-term Score" value={`${sbti.nearTerm}/100`} sub="2025–2030 target ambition" accent />
              <KpiCard label="Long-term Score" value={`${sbti.longTerm}/100`} sub="2030–2040 target ambition" />
              <KpiCard label="Net Zero Score" value={`${sbti.netZero}/100`} sub="2050 net zero target" />
              <KpiCard label="1.5°C Alignment" value={<Badge label={sbti.alignment15c >= 0.6 ? '✓ 1.5°C Aligned' : sbti.alignment15c >= 0.4 ? 'Well Below 2°C' : '✗ Below 2°C'} color={sbti.alignment15c >= 0.6 ? 'green' : sbti.alignment15c >= 0.4 ? 'yellow' : 'red'} />} sub={`Alignment score: ${(sbti.alignment15c * 100).toFixed(0)}%`} />
            </Row>
          </Section>
          <Row>
            <Section title="Target Ambition Scores">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sbti.targets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <ReferenceLine y={65} stroke="#059669" strokeDasharray="4 4" label={{ value: 'SBTi Min', fontSize: 10, fill: '#059669' }} />
                  <Bar dataKey="score" name="Target Score" radius={[4, 4, 0, 0]}>
                    {sbti.targets.map((t, i) => <Cell key={i} fill={t.score >= 65 ? '#059669' : t.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title={`${sector.replace('_', ' ')} Sector Pathway (kgCO₂e — Current vs Paris)`}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={sbti.pathway}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis unit=" kg" />
                  <Tooltip formatter={(val) => `${val} kgCO₂e`} />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Current Trajectory" />
                  <Line type="monotone" dataKey="paris" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Paris 1.5°C Pathway" />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — Race to Zero */}
      {tab === 2 && (
        <div>
          <Section title="Race to Zero Assessment">
            <Row gap={12}>
              <KpiCard label="RtZ Score" value={`${rtz.rtzScore}/100`} sub="5-criterion Race to Zero framework" accent />
              <KpiCard label="Criteria Met" value={`${rtz.metCount} / 5`} sub="Pledge / Plan / Proceed / Publish / Account" />
              <KpiCard label="Initiative Memberships" value={`${rtz.initiatives.filter(i => i.member).length} / 6`} sub="GFANZ/NZBA/NZAM/NZI/NZAOA/RE100" />
              <KpiCard label="RtZ Status" value={<Badge label={rtz.metCount >= 4 ? '✓ RtZ Member' : rtz.metCount >= 2 ? 'Partial' : '✗ Not Eligible'} color={rtz.metCount >= 4 ? 'green' : rtz.metCount >= 2 ? 'yellow' : 'red'} />} sub="Race to Zero membership criteria" />
            </Row>
          </Section>
          <Row>
            <Section title="5P Checklist (Pledge / Plan / Proceed / Publish / Account)">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Step', 'Description', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rtz.checklist.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: c.met ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#059669' }}>{c.step}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{c.desc}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={c.met ? '✓ Met' : '✗ Gap'} color={c.met ? 'green' : 'red'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <div>
              <Section title="Step Score Breakdown">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rtz.scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(val) => `${val}/100`} />
                    <Bar dataKey="score" name="Score" radius={[4, 4, 0, 0]}>
                      {rtz.scoreData.map((d, i) => <Cell key={i} fill={d.score >= 80 ? '#059669' : d.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Initiative Memberships">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
                  {rtz.initiatives.map((ini, i) => (
                    <Badge key={i} label={`${ini.member ? '✓' : '○'} ${ini.name}`} color={ini.member ? 'green' : 'gray'} />
                  ))}
                </div>
              </Section>
            </div>
          </Row>
        </div>
      )}

      {/* TAB 4 — Portfolio Temperature */}
      {tab === 3 && (
        <div>
          <Section title="Portfolio Temperature Summary">
            <Row gap={12}>
              <KpiCard label="Portfolio Temperature" value={`${portTemp.portfolioTemp}°C`} sub="Implied warming potential (IWP)" accent />
              <KpiCard label="WACI" value={`${portTemp.waci} tCO₂e/M$`} sub="Weighted Average Carbon Intensity" />
              <KpiCard label="Engagement Coverage" value={`${portTemp.engagementCoverage}%`} sub="Portfolio covered by active engagement" />
              <KpiCard label="Paris-Aligned" value={`${portTemp.parisAligned}%`} sub="Holdings with 1.5°C-aligned targets" />
            </Row>
          </Section>
          <Row>
            <Section title="Temperature Trajectory (2024→2050)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={portTemp.trajectory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 4]} unit="°C" />
                  <Tooltip formatter={(val) => `${val}°C`} />
                  <ReferenceLine y={1.5} stroke="#059669" strokeDasharray="4 4" label={{ value: '1.5°C', fontSize: 10, fill: '#059669' }} />
                  <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '2°C', fontSize: 10, fill: '#f59e0b' }} />
                  <Area type="monotone" dataKey="temp" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.4} strokeWidth={2} name="Portfolio Temp (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Holdings Breakdown — Aligned vs Not Aligned">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={portTemp.holdings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" height={45} />
                  <YAxis unit="%" />
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                  <Bar dataKey="aligned" fill="#059669" name="Paris-Aligned %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="not_aligned" fill="#ef4444" name="Not Aligned %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 5 — TNFD & Instrument */}
      {tab === 4 && (
        <div>
          <Section title="Instrument Credibility Summary">
            <Row gap={12}>
              <KpiCard label="Credibility Score" value={`${tnfdInst.credibilityScore}/100`} sub="5-dimension instrument assessment" accent />
              <KpiCard label="Credibility Tier" value={<Badge label={tnfdInst.credibilityTier === 'high' ? 'High' : tnfdInst.credibilityTier === 'medium' ? 'Medium' : 'Low'} color={tnfdInst.credibilityTier === 'high' ? 'green' : tnfdInst.credibilityTier === 'medium' ? 'yellow' : 'red'} />} sub={`${instrument.replace('_', ' ')} credibility tier`} />
              <KpiCard label="TNFD LEAP Stages" value={`${tnfdInst.leapStages.filter(s => s.complete).length} / 4`} sub="L1 Locate · E Evaluate · A Assess · P Prepare" />
              <KpiCard label="SBTN Steps" value={`${tnfdInst.sbtnSteps.filter(s => s.complete).length} / 5`} sub="Science Based Targets for Nature" />
            </Row>
          </Section>
          <Row>
            <div>
              <Section title="TNFD LEAP Stages">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Stage', 'Description', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tnfdInst.leapStages.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{s.stage}</td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontSize: 12 }}>{s.desc}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={s.complete ? '✓ Complete' : '○ Pending'} color={s.complete ? 'green' : 'gray'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
              <Section title="SBTN Steps Completed">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {tnfdInst.sbtnSteps.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{s.step}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={s.complete ? '✓' : '○'} color={s.complete ? 'green' : 'gray'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            </div>
            <Section title="Instrument Credibility Score Breakdown">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tnfdInst.instrumentScore} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <ReferenceLine x={58} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Medium', fontSize: 9, fill: '#f59e0b' }} />
                  <ReferenceLine x={75} stroke="#059669" strokeDasharray="4 4" label={{ value: 'High', fontSize: 9, fill: '#059669' }} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {tnfdInst.instrumentScore.map((s, i) => <Cell key={i} fill={s.score >= 75 ? '#059669' : s.score >= 58 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 6 }}>Instrument: {instrument.replace(/_/g, ' ').toUpperCase()}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>Overall credibility: <strong>{tnfdInst.credibilityTier.charAt(0).toUpperCase() + tnfdInst.credibilityTier.slice(1)}</strong> ({tnfdInst.credibilityScore}/100)</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Assessed against TPT Oct 2023 · ICMA TBP · LMA SLLP 2023 · SBTi FLAG/NZAM requirements</div>
              </div>
            </Section>
          </Row>
        </div>
      )}
    </div>
  );
}
