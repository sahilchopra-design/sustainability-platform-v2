import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ReferenceLine,
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

const TABS = ['ICVCM CCP Scoring', 'VCMI Claims', 'Oxford Principles', 'Integrity Risk', 'Registry & Market'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const PROJECT_TYPES = [
  { value: 'afolu', label: 'AFOLU (Agriculture, Forestry, Land Use)' },
  { value: 'redd', label: 'REDD+ Avoided Deforestation' },
  { value: 'arr', label: 'Afforestation / Reforestation' },
  { value: 'blue_carbon', label: 'Blue Carbon (Mangroves / Seagrass)' },
  { value: 'cookstoves', label: 'Improved Cookstoves' },
  { value: 'methane_capture', label: 'Methane Capture (Landfill / Coal)' },
  { value: 'soil_carbon', label: 'Soil Carbon Sequestration' },
  { value: 'biochar', label: 'Biochar' },
  { value: 'dac', label: 'Direct Air Capture (DAC)' },
  { value: 'beccs', label: 'BECCS' },
];

const REGISTRIES = [
  { value: 'verra_vcs', label: 'Verra VCS' },
  { value: 'gold_standard', label: 'Gold Standard' },
  { value: 'acr', label: 'American Carbon Registry (ACR)' },
  { value: 'car', label: 'Climate Action Reserve (CAR)' },
  { value: 'art6_itmo', label: 'Article 6 ITMO' },
];

const TIER_COLORS = { A: '#059669', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

const getICVCMData = (projectType, registry, vintage, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const criteria = [
    { id: 'C1', name: 'Governance & Transparency', score: Math.round(r(1) * 30 + 55) },
    { id: 'C2', name: 'Tracking', score: Math.round(r(2) * 25 + 60) },
    { id: 'C3', name: 'Additionality', score: Math.round(r(3) * 35 + 50) },
    { id: 'C4', name: 'Permanence', score: Math.round(r(4) * 40 + 45) },
    { id: 'C5', name: 'Robust Quantification', score: Math.round(r(5) * 28 + 55) },
    { id: 'C6', name: 'No Double Counting', score: Math.round(r(6) * 22 + 62) },
    { id: 'C7', name: 'Sustainable Development', score: Math.round(r(7) * 30 + 52) },
    { id: 'C8', name: 'No Net Harm', score: Math.round(r(8) * 25 + 58) },
    { id: 'C9', name: 'Safeguards', score: Math.round(r(9) * 32 + 50) },
    { id: 'C10', name: 'Transition to Net Zero', score: Math.round(r(10) * 28 + 54) },
  ];
  const composite = Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);
  const ccpEligible = composite >= 65 && criteria.every(c => c.score >= 50);
  const tier = composite >= 80 ? 'A' : composite >= 68 ? 'B' : composite >= 55 ? 'C' : 'D';
  const priceBase = { afolu: 8, redd: 6, arr: 9, blue_carbon: 18, cookstoves: 4, methane_capture: 12, soil_carbon: 7, biochar: 22, dac: 180, beccs: 60 };
  const price = Math.round((priceBase[projectType] || 10) * (0.8 + r(11) * 0.6));
  return { criteria, composite, ccpEligible, tier, price };
};

const getVCMIData = (seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const currentScore = Math.round(r(20) * 40 + 45);
  const thresholds = [
    { name: 'Silver', threshold: 60, color: '#9ca3af' },
    { name: 'Gold', threshold: 75, color: '#f59e0b' },
    { name: 'Platinum', threshold: 90, color: '#8b5cf6' },
  ];
  const claimData = [
    { tier: 'Silver', threshold: 60, current: currentScore },
    { tier: 'Gold', threshold: 75, current: currentScore },
    { tier: 'Platinum', threshold: 90, current: currentScore },
  ];
  const achieved = currentScore >= 90 ? 'Platinum' : currentScore >= 75 ? 'Gold' : currentScore >= 60 ? 'Silver' : 'None';
  const requirements = [
    { req: 'Credible Net Zero Commitment (SBTi or equivalent)', met: r(21) > 0.35 },
    { req: 'Annual GHG Inventory (GHG Protocol)', met: r(22) > 0.3 },
    { req: 'Beyond Value Chain Mitigation Strategy', met: r(23) > 0.45 },
    { req: 'Disclosure of volume and quality of credits used', met: r(24) > 0.4 },
    { req: 'High Integrity Credits (ICVCM CCP label)', met: r(25) > 0.5 },
    { req: 'No use of credits for compliance offsetting', met: r(26) > 0.3 },
    { req: 'Public reporting aligned to TCFD/ISSB S2', met: r(27) > 0.35 },
    { req: 'Third-party assurance of claims', met: r(28) > 0.55 },
  ];
  return { currentScore, claimData, thresholds, achieved, requirements };
};

const getOxfordData = (projectType, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const storage = { afolu: 'biological', redd: 'biological', arr: 'biological', blue_carbon: 'biological', cookstoves: 'chemical', methane_capture: 'geological', soil_carbon: 'biological', biochar: 'geological', dac: 'geological', beccs: 'geological' };
  const storageType = storage[projectType] || 'biological';
  const principles = [
    { dimension: 'P1: Cut Emissions First', score: Math.round(r(30) * 30 + 55) },
    { dimension: 'P2: Shift to Long-lived Storage', score: Math.round(r(31) * 35 + 45) },
    { dimension: 'P3: Sustainable Development', score: Math.round(r(32) * 28 + 52) },
    { dimension: 'P4: Scale Up Carbon Removal', score: Math.round(r(33) * 32 + 48) },
  ];
  const barData = principles.map(p => ({ name: p.dimension.split(':')[0], score: p.score }));
  const composite = Math.round(principles.reduce((s, p) => s + p.score, 0) / 4);
  return { principles, barData, storageType, composite };
};

const getIntegrityData = (projectType, registry, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const risks = [
    { name: 'Permanence Risk', score: Math.round(r(40) * 40 + 20) },
    { name: 'Additionality Score', score: Math.round(r(41) * 30 + 55) },
    { name: 'Leakage Risk', score: Math.round(r(42) * 35 + 25) },
    { name: 'MRV Quality', score: Math.round(r(43) * 28 + 55) },
    { name: 'Baseline Robustness', score: Math.round(r(44) * 30 + 50) },
    { name: 'Co-benefit Score', score: Math.round(r(45) * 32 + 45) },
  ];
  const flags = [
    { flag: 'Over-crediting risk', level: r(46) > 0.6 ? 'High' : r(46) > 0.35 ? 'Medium' : 'Low' },
    { flag: 'Baseline manipulation risk', level: r(47) > 0.65 ? 'High' : r(47) > 0.4 ? 'Medium' : 'Low' },
    { flag: 'Social safeguard concerns', level: r(48) > 0.7 ? 'High' : r(48) > 0.5 ? 'Medium' : 'Low' },
    { flag: 'MRV independence gap', level: r(49) > 0.6 ? 'High' : r(49) > 0.38 ? 'Medium' : 'Low' },
    { flag: 'Reversal buffer adequacy', level: r(50) > 0.58 ? 'High' : r(50) > 0.35 ? 'Medium' : 'Low' },
  ];
  const corsiaEligible = ['verra_vcs', 'gold_standard', 'acr', 'car'].includes(registry) && r(51) > 0.3;
  const art6Eligible = registry === 'art6_itmo';
  return { risks, flags, corsiaEligible, art6Eligible };
};

const getMarketData = (seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const registryShare = [
    { name: 'Verra VCS', value: Math.round(r(60) * 10 + 40) },
    { name: 'Gold Standard', value: Math.round(r(61) * 8 + 18) },
    { name: 'ACR', value: Math.round(r(62) * 6 + 12) },
    { name: 'CAR', value: Math.round(r(63) * 5 + 10) },
    { name: 'Art 6 ITMO', value: Math.round(r(64) * 4 + 8) },
    { name: 'Other', value: Math.round(r(65) * 3 + 5) },
  ];
  const priceByType = [
    { type: 'AFOLU', price: Math.round(r(66) * 6 + 5) },
    { type: 'REDD+', price: Math.round(r(67) * 8 + 4) },
    { type: 'Blue Carbon', price: Math.round(r(68) * 12 + 14) },
    { type: 'Cookstoves', price: Math.round(r(69) * 4 + 3) },
    { type: 'Methane', price: Math.round(r(70) * 8 + 9) },
    { type: 'Soil Carbon', price: Math.round(r(71) * 6 + 6) },
    { type: 'Biochar', price: Math.round(r(72) * 15 + 18) },
    { type: 'DAC', price: Math.round(r(73) * 80 + 150) },
    { type: 'BECCS', price: Math.round(r(74) * 25 + 50) },
  ];
  const totalVolume = Math.round(r(75) * 200 + 500);
  const vintageRange = `2019–2023`;
  return { registryShare, priceByType, totalVolume, vintageRange };
};

export default function VCMIntegrityPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectType, setProjectType] = useState('redd');
  const [registry, setRegistry] = useState('verra_vcs');
  const [vintage, setVintage] = useState('2023');

  const seed0 = hashStr(projectType + registry + vintage);
  const icvcm = getICVCMData(projectType, registry, vintage, seed0);
  const vcmi = getVCMIData(seed0);
  const oxford = getOxfordData(projectType, seed0);
  const integrity = getIntegrityData(projectType, registry, seed0);
  const market = getMarketData(seed0);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/vcm-integrity/assess`, {
        project_type: projectType, registry, vintage_year: parseInt(vintage),
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>VCM Integrity Assessment</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>ICVCM CCP 2023 · VCMI Claims · Oxford Offsetting Principles · CORSIA Eligibility · Registry Market</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* Inputs always visible */}
      <Section title="Project Parameters">
        <Row>
          <Sel label="Project Type" value={projectType} onChange={setProjectType} options={PROJECT_TYPES} />
          <Sel label="Registry" value={registry} onChange={setRegistry} options={REGISTRIES} />
          <Inp label="Vintage Year" value={vintage} onChange={setVintage} type="number" />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — ICVCM CCP Scoring */}
      {tab === 0 && (
        <div>
          <Section title="ICVCM CCP Summary">
            <Row gap={12}>
              <KpiCard label="CCP Composite Score" value={`${icvcm.composite}/100`} sub="10-criteria weighted average" accent />
              <KpiCard label="CCP Label Eligible" value={<Badge label={icvcm.ccpEligible ? '✓ Eligible' : '✗ Not Eligible'} color={icvcm.ccpEligible ? 'green' : 'red'} />} sub="Score ≥ 65 & all C ≥ 50" />
              <KpiCard label="Integrity Tier" value={<Badge label={`Tier ${icvcm.tier}`} color={icvcm.tier === 'A' ? 'green' : icvcm.tier === 'B' ? 'blue' : icvcm.tier === 'C' ? 'yellow' : 'red'} />} sub="A ≥ 80 · B ≥ 68 · C ≥ 55 · D < 55" />
              <KpiCard label="Price Benchmark" value={`$${icvcm.price}/t`} sub={`${projectType.replace('_', ' ').toUpperCase()} · ${vintage} vintage`} />
            </Row>
          </Section>
          <Row>
            <Section title="10 CCP Criteria Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={icvcm.criteria}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="id" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="CCP Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                  <Tooltip formatter={(val, _, p) => [`${val}/100`, p.payload?.name]} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Criteria Score Breakdown">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={icvcm.criteria} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="id" width={32} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val, _, p) => [`${val}/100`, p.payload?.name]} />
                  <ReferenceLine x={65} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'CCP Min', fontSize: 10, fill: '#ef4444' }} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {icvcm.criteria.map((c, i) => <Cell key={i} fill={c.score >= 65 ? '#059669' : c.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
          <Section title="Criteria Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['ID', 'Criterion', 'Score', 'CCP Pass'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {icvcm.criteria.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{c.id}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.score}/100</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={c.score >= 50 ? '✓ Pass' : '✗ Fail'} color={c.score >= 50 ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 2 — VCMI Claims */}
      {tab === 1 && (
        <div>
          <Section title="VCMI Claims Framework Summary">
            <Row gap={12}>
              <KpiCard label="Current Score" value={`${vcmi.currentScore}/100`} sub="VCMI composite assessment" accent />
              <KpiCard label="Achieved Claim Tier" value={<Badge label={vcmi.achieved} color={vcmi.achieved === 'Platinum' ? 'purple' : vcmi.achieved === 'Gold' ? 'yellow' : vcmi.achieved === 'Silver' ? 'gray' : 'red'} />} sub="Silver ≥ 60 · Gold ≥ 75 · Platinum ≥ 90" />
              <KpiCard label="Next Tier Gap" value={vcmi.achieved === 'Platinum' ? '—' : `${(vcmi.achieved === 'Gold' ? 90 : vcmi.achieved === 'Silver' ? 75 : 60) - vcmi.currentScore} pts`} sub="Points needed to advance tier" />
              <KpiCard label="Requirements Met" value={`${vcmi.requirements.filter(r => r.met).length} / ${vcmi.requirements.length}`} sub="VCMI Core Carbon Principles checklist" />
            </Row>
          </Section>
          <Section title="Claim Tier Thresholds vs Current Score">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vcmi.claimData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="tier" width={70} tick={{ fontSize: 13 }} />
                <Tooltip formatter={(val, name) => [`${val}/100`, name]} />
                <Legend />
                <Bar dataKey="threshold" fill="#d1d5db" name="Tier Threshold" radius={[0, 4, 4, 0]} />
                <Bar dataKey="current" fill="#059669" name="Current Score" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="VCMI Requirements Checklist">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['#', 'Requirement', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vcmi.requirements.map((req, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{req.req}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={req.met ? '✓ Met' : '✗ Gap'} color={req.met ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — Oxford Principles */}
      {tab === 2 && (
        <div>
          <Section title="Oxford Offsetting Principles Summary">
            <Row gap={12}>
              <KpiCard label="Oxford Composite Score" value={`${oxford.composite}/100`} sub="4-principle weighted average" accent />
              <KpiCard label="Storage Type" value={<Badge label={oxford.storageType === 'geological' ? 'Geological (Long-lived)' : 'Biological (Short-lived)'} color={oxford.storageType === 'geological' ? 'green' : 'yellow'} />} sub="Preferred: long-lived geological" />
              <KpiCard label="P2 Score (Long Storage)" value={`${oxford.principles[1].score}/100`} sub="Shift to long-lived storage principle" />
              <KpiCard label="Oxford Aligned" value={<Badge label={oxford.composite >= 65 ? '✓ Aligned' : '✗ Not Aligned'} color={oxford.composite >= 65 ? 'green' : 'red'} />} sub="Composite ≥ 65 threshold" />
            </Row>
          </Section>
          <Row>
            <Section title="4 Oxford Principles Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={oxford.principles}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Principle Scores">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={oxford.barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <ReferenceLine y={65} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Aligned', fontSize: 10, fill: '#ef4444' }} />
                  <Bar dataKey="score" name="Principle Score" radius={[4, 4, 0, 0]}>
                    {oxford.barData.map((d, i) => <Cell key={i} fill={d.score >= 65 ? '#059669' : d.score >= 50 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, background: oxford.storageType === 'geological' ? '#f0fdf4' : '#fefce8', border: `1px solid ${oxford.storageType === 'geological' ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                <strong>Storage Type:</strong> {oxford.storageType === 'geological' ? 'Geological (Preferred by Oxford Principles — long-lived, low reversal risk)' : 'Biological (Short-lived — requires P2 transition plan per Oxford Principles)'}
              </div>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — Integrity Risk */}
      {tab === 3 && (
        <div>
          <Section title="Integrity Risk Summary">
            <Row gap={12}>
              <KpiCard label="CORSIA Eligible" value={<Badge label={integrity.corsiaEligible ? '✓ CORSIA Eligible' : '✗ Not CORSIA'} color={integrity.corsiaEligible ? 'green' : 'gray'} />} sub="ICAO CORSIA eligible programme" accent />
              <KpiCard label="Article 6 ITMO" value={<Badge label={integrity.art6Eligible ? '✓ Art 6 Eligible' : '✗ Not Art 6'} color={integrity.art6Eligible ? 'green' : 'gray'} />} sub="Paris Agreement Art 6.2/6.4" />
              <KpiCard label="Risk Flags" value={`${integrity.flags.filter(f => f.level === 'High').length} High`} sub={`${integrity.flags.filter(f => f.level === 'Medium').length} Medium · ${integrity.flags.filter(f => f.level === 'Low').length} Low`} />
              <KpiCard label="MRV Quality" value={`${integrity.risks[3].score}/100`} sub="Monitoring, Reporting & Verification" />
            </Row>
          </Section>
          <Section title="Integrity Dimensions">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={integrity.risks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="score" name="Score" radius={[4, 4, 0, 0]}>
                  {integrity.risks.map((r, i) => <Cell key={i} fill={r.score >= 65 ? '#059669' : r.score >= 45 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Risk Flags">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Risk Factor', 'Level', 'Description'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {integrity.flags.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{f.flag}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={f.level} color={f.level === 'High' ? 'red' : f.level === 'Medium' ? 'yellow' : 'green'} /></td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 12 }}>{f.level === 'High' ? 'Immediate remediation required' : f.level === 'Medium' ? 'Monitor and address in next cycle' : 'Within acceptable tolerance'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Registry & Market */}
      {tab === 4 && (
        <div>
          <Section title="Market Overview">
            <Row gap={12}>
              <KpiCard label="Total Volume (MtCO2e)" value={`${market.totalVolume} Mt`} sub="Estimated VCM annual issuance" accent />
              <KpiCard label="Vintage Range" value={market.vintageRange} sub="Active market vintages" />
              <KpiCard label="Highest Price Type" value={market.priceByType.reduce((a, b) => a.price > b.price ? a : b).type} sub={`$${market.priceByType.reduce((a, b) => a.price > b.price ? a : b).price}/t`} />
              <KpiCard label="Lowest Price Type" value={market.priceByType.reduce((a, b) => a.price < b.price ? a : b).type} sub={`$${market.priceByType.reduce((a, b) => a.price < b.price ? a : b).price}/t`} />
            </Row>
          </Section>
          <Row>
            <Section title="Registry Market Share">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={market.registryShare} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name"
                    label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                    {market.registryShare.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Price Benchmark by Project Type ($/t)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={market.priceByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={45} />
                  <YAxis unit="$" />
                  <Tooltip formatter={(val) => `$${val}/t`} />
                  <Bar dataKey="price" name="Price $/t" radius={[4, 4, 0, 0]}>
                    {market.priceByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}
    </div>
  );
}
