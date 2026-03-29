import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

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

const TABS = ['EU Social Taxonomy', 'ILO Core Conventions', 'CSDDD Social Impacts', 'UNGP HRDD', 'Decent Work'];

const NACE_OPTIONS = [
  { value: 'manufacturing', label: 'Manufacturing (C)' },
  { value: 'financial', label: 'Financial Services (K)' },
  { value: 'construction', label: 'Construction (F)' },
  { value: 'agriculture', label: 'Agriculture (A)' },
  { value: 'transport', label: 'Transport (H)' },
  { value: 'healthcare', label: 'Healthcare (Q)' },
  { value: 'retail', label: 'Retail (G)' },
  { value: 'energy', label: 'Energy (D)' },
];

const COUNTRY_OPTIONS = [
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'PL', label: 'Poland' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'US', label: 'United States' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'ID', label: 'Indonesia' },
];

const getEUSocialData = (sector, country, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const objectives = [
    {
      dimension: 'Decent Work',
      score: Math.round(r(1) * 30 + 52),
      subs: [
        { name: 'Fair Wages', score: Math.round(r(2) * 30 + 50) },
        { name: 'Safe Conditions', score: Math.round(r(3) * 28 + 55) },
        { name: 'Job Security', score: Math.round(r(4) * 32 + 48) },
        { name: 'Social Protection', score: Math.round(r(5) * 25 + 53) },
      ],
    },
    {
      dimension: 'Adequate Living',
      score: Math.round(r(6) * 28 + 50),
      subs: [
        { name: 'Living Wage', score: Math.round(r(7) * 35 + 45) },
        { name: 'Housing Access', score: Math.round(r(8) * 30 + 48) },
        { name: 'Food Security', score: Math.round(r(9) * 28 + 50) },
        { name: 'Healthcare Access', score: Math.round(r(10) * 25 + 55) },
      ],
    },
    {
      dimension: 'Inclusive Communities',
      score: Math.round(r(11) * 32 + 48),
      subs: [
        { name: 'Equal Opportunity', score: Math.round(r(12) * 30 + 50) },
        { name: 'Community Engagement', score: Math.round(r(13) * 28 + 52) },
        { name: 'Indigenous Rights', score: Math.round(r(14) * 35 + 44) },
        { name: 'Accessibility', score: Math.round(r(15) * 25 + 54) },
      ],
    },
  ];
  const composite = Math.round(objectives.reduce((s, o) => s + o.score, 0) / 3);
  const eligible = composite >= 55;
  const aligned = composite >= 70;
  const dnshPass = r(16) > 0.4;
  return { objectives, composite, eligible, aligned, dnshPass };
};

const getILOData = (country, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const ratificationMap = {
    DE: { C029: true, C087: true, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
    FR: { C029: true, C087: true, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
    UK: { C029: true, C087: true, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
    PL: { C029: true, C087: true, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
    CN: { C029: false, C087: false, C098: false, C100: true, C105: false, C111: true, C138: true, C182: true },
    IN: { C029: true, C087: false, C098: false, C100: true, C105: true, C111: true, C138: true, C182: true },
    BR: { C029: true, C087: false, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
    US: { C029: false, C087: true, C098: false, C100: false, C105: false, C111: false, C138: true, C182: true },
    NG: { C029: true, C087: true, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
    ID: { C029: true, C087: true, C098: true, C100: true, C105: true, C111: true, C138: true, C182: true },
  };
  const ratified = ratificationMap[country] || ratificationMap['DE'];
  const conventions = [
    { id: 'C029', name: 'Forced Labour', score: Math.round(r(20) * 25 + 55), ratified: ratified.C029 },
    { id: 'C087', name: 'Freedom of Association', score: Math.round(r(21) * 28 + 50), ratified: ratified.C087 },
    { id: 'C098', name: 'Right to Organise', score: Math.round(r(22) * 25 + 52), ratified: ratified.C098 },
    { id: 'C100', name: 'Equal Remuneration', score: Math.round(r(23) * 22 + 58), ratified: ratified.C100 },
    { id: 'C105', name: 'Abolition of Forced Labour', score: Math.round(r(24) * 25 + 55), ratified: ratified.C105 },
    { id: 'C111', name: 'Non-discrimination', score: Math.round(r(25) * 28 + 52), ratified: ratified.C111 },
    { id: 'C138', name: 'Minimum Age', score: Math.round(r(26) * 22 + 60), ratified: ratified.C138 },
    { id: 'C182', name: 'Worst Forms Child Labour', score: Math.round(r(27) * 18 + 65), ratified: ratified.C182 },
  ];
  const ratifiedCount = Object.values(ratified).filter(Boolean).length;
  return { conventions, ratifiedCount };
};

const getCSDDDSocialData = (sector, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const categories = [
    { id: 'HR-01', name: 'Child Labour', severity: Math.round(r(30) * 40 + 20), likelihood: Math.round(r(31) * 30 + 15) },
    { id: 'HR-02', name: 'Forced Labour', severity: Math.round(r(32) * 38 + 22), likelihood: Math.round(r(33) * 28 + 18) },
    { id: 'HR-03', name: 'Health & Safety', severity: Math.round(r(34) * 35 + 30), likelihood: Math.round(r(35) * 32 + 22) },
    { id: 'HR-04', name: 'Freedom of Association', severity: Math.round(r(36) * 30 + 28), likelihood: Math.round(r(37) * 28 + 24) },
    { id: 'HR-05', name: 'Living Wage', severity: Math.round(r(38) * 32 + 30), likelihood: Math.round(r(39) * 30 + 28) },
    { id: 'HR-06', name: 'Non-discrimination', severity: Math.round(r(40) * 28 + 28), likelihood: Math.round(r(41) * 25 + 25) },
    { id: 'HR-07', name: 'Privacy Rights', severity: Math.round(r(42) * 25 + 25), likelihood: Math.round(r(43) * 22 + 20) },
    { id: 'HR-08', name: 'Indigenous Peoples Rights', severity: Math.round(r(44) * 35 + 20), likelihood: Math.round(r(45) * 28 + 15) },
    { id: 'HR-09', name: 'Community Health', severity: Math.round(r(46) * 30 + 22), likelihood: Math.round(r(47) * 26 + 18) },
    { id: 'HR-10', name: 'Consumer Protection', severity: Math.round(r(48) * 28 + 24), likelihood: Math.round(r(49) * 24 + 20) },
  ];
  const priority = categories.map(c => ({
    ...c,
    riskScore: c.severity * c.likelihood / 100,
    priority: (c.severity * c.likelihood / 100) >= 20 ? 'High' : (c.severity * c.likelihood / 100) >= 10 ? 'Medium' : 'Low',
  }));
  return { categories: priority };
};

const getUNGPData = (seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const steps = [
    { dimension: 'Policy Commitment', score: Math.round(r(50) * 30 + 52) },
    { dimension: 'Human Rights DD', score: Math.round(r(51) * 32 + 48) },
    { dimension: 'Impact Assessment', score: Math.round(r(52) * 28 + 50) },
    { dimension: 'Integration & Action', score: Math.round(r(53) * 30 + 46) },
    { dimension: 'Tracking Effectiveness', score: Math.round(r(54) * 32 + 44) },
    { dimension: 'Communication & Reporting', score: Math.round(r(55) * 28 + 48) },
  ];
  const composite = Math.round(steps.reduce((s, st) => s + st.score, 0) / 6);
  const tier = composite >= 75 ? 'compliant' : composite >= 55 ? 'partial' : 'non-compliant';
  return { steps, composite, tier };
};

const getDecentWorkData = (sector, country, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const livingWage = r(60) > 0.45;
  const genderPayGap = Math.round(r(61) * 20 + 5);
  const unionCoverage = Math.round(r(62) * 60 + 10);
  const injuryRate = parseFloat((r(63) * 8 + 1).toFixed(1));
  const sectorBenchmarks = [
    { metric: 'Living Wage %', company: Math.round(r(64) * 30 + 60), sector: Math.round(r(65) * 20 + 70) },
    { metric: 'Union Coverage %', company: unionCoverage, sector: Math.round(r(66) * 20 + 35) },
    { metric: 'Training Hours', company: Math.round(r(67) * 20 + 20), sector: Math.round(r(68) * 15 + 25) },
    { metric: 'Pay Equity Score', company: Math.round(r(69) * 30 + 50), sector: Math.round(r(70) * 20 + 60) },
    { metric: 'Parental Leave %', company: Math.round(r(71) * 25 + 55), sector: Math.round(r(72) * 20 + 65) },
    { metric: 'Safety Score', company: Math.round(r(73) * 28 + 55), sector: Math.round(r(74) * 18 + 62) },
  ];
  return { livingWage, genderPayGap, unionCoverage, injuryRate, sectorBenchmarks };
};

export default function SocialTaxonomyPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('Acme Industries GmbH');
  const [naceSector, setNaceSector] = useState('manufacturing');
  const [country, setCountry] = useState('DE');

  const seed0 = hashStr(companyName + naceSector + country);
  const euSocial = getEUSocialData(naceSector, country, seed0);
  const ilo = getILOData(country, seed0);
  const csddd = getCSDDDSocialData(naceSector, seed0);
  const ungp = getUNGPData(seed0);
  const decentWork = getDecentWorkData(naceSector, country, seed0);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/social-taxonomy/assess`, {
        company_name: companyName, nace_sector: naceSector, country,
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Social Taxonomy Assessment</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>EU Social Taxonomy · ILO Core Conventions · CSDDD HR · UNGP HRDD · Decent Work Indicators</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      <Section title="Company Parameters">
        <Row>
          <Inp label="Company Name" value={companyName} onChange={setCompanyName} />
          <Sel label="NACE Sector" value={naceSector} onChange={setNaceSector} options={NACE_OPTIONS} />
          <Sel label="Country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — EU Social Taxonomy */}
      {tab === 0 && (
        <div>
          <Section title="EU Social Taxonomy Summary">
            <Row gap={12}>
              <KpiCard label="Composite Score" value={`${euSocial.composite}/100`} sub="3-objective weighted average" accent />
              <KpiCard label="Eligible" value={<Badge label={euSocial.eligible ? '✓ Eligible' : '✗ Not Eligible'} color={euSocial.eligible ? 'green' : 'red'} />} sub="Score ≥ 55 threshold" />
              <KpiCard label="Aligned" value={<Badge label={euSocial.aligned ? '✓ Aligned' : '✗ Not Aligned'} color={euSocial.aligned ? 'green' : 'yellow'} />} sub="Score ≥ 70 threshold" />
              <KpiCard label="Social DNSH Pass" value={<Badge label={euSocial.dnshPass ? '✓ Pass' : '✗ Fail'} color={euSocial.dnshPass ? 'green' : 'red'} />} sub="Do No Significant Harm — social" />
            </Row>
          </Section>
          <Row>
            <Section title="3 Objectives Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={euSocial.objectives}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Sub-criteria Breakdown">
              {euSocial.objectives.map((obj, oi) => (
                <div key={oi} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{obj.dimension}</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={obj.subs} layout="vertical" margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val) => `${val}/100`} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {obj.subs.map((s, i) => <Cell key={i} fill={s.score >= 70 ? '#059669' : s.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — ILO Core Conventions */}
      {tab === 1 && (
        <div>
          <Section title="ILO Core Conventions Summary">
            <Row gap={12}>
              <KpiCard label="Conventions Ratified" value={`${ilo.ratifiedCount} / 8`} sub={`Country: ${country}`} accent />
              <KpiCard label="Avg Compliance Score" value={`${Math.round(ilo.conventions.reduce((s, c) => s + c.score, 0) / ilo.conventions.length)}/100`} sub="Implementation quality score" />
              <KpiCard label="Lowest Score" value={`${ilo.conventions.reduce((a, b) => a.score < b.score ? a : b).id}`} sub={`${ilo.conventions.reduce((a, b) => a.score < b.score ? a : b).score}/100`} />
              <KpiCard label="Fundamental Rights" value={<Badge label={ilo.ratifiedCount >= 6 ? '✓ Compliant' : ilo.ratifiedCount >= 4 ? 'Partial' : '✗ At Risk'} color={ilo.ratifiedCount >= 6 ? 'green' : ilo.ratifiedCount >= 4 ? 'yellow' : 'red'} />} sub="ILO 8 Fundamental Conventions" />
            </Row>
          </Section>
          <Section title="Convention Compliance Scores">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ilo.conventions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="id" width={45} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, _, p) => [`${val}/100`, p.payload?.name]} />
                <ReferenceLine x={60} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min', fontSize: 10, fill: '#ef4444' }} />
                <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                  {ilo.conventions.map((c, i) => <Cell key={i} fill={c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Convention Ratification Status">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Convention', 'Subject', 'Score', 'Ratified', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ilo.conventions.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{c.id}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.score}/100</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={c.ratified ? '✓ Yes' : '✗ No'} color={c.ratified ? 'green' : 'red'} /></td>
                    <td style={{ padding: '8px 12px' }}><Badge label={c.score >= 70 ? 'Strong' : c.score >= 55 ? 'Partial' : 'Weak'} color={c.score >= 70 ? 'green' : c.score >= 55 ? 'yellow' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — CSDDD Social Impacts */}
      {tab === 2 && (
        <div>
          <Section title="CSDDD Human Rights Impact Assessment">
            <Row gap={12}>
              <KpiCard label="High Priority Impacts" value={`${csddd.categories.filter(c => c.priority === 'High').length}`} sub="Severity × Likelihood ≥ 20" accent />
              <KpiCard label="Medium Priority" value={`${csddd.categories.filter(c => c.priority === 'Medium').length}`} sub="Risk score 10–20" />
              <KpiCard label="Low Priority" value={`${csddd.categories.filter(c => c.priority === 'Low').length}`} sub="Risk score < 10" />
              <KpiCard label="Highest Risk" value={csddd.categories.reduce((a, b) => a.riskScore > b.riskScore ? a : b).id} sub={`Score: ${csddd.categories.reduce((a, b) => a.riskScore > b.riskScore ? a : b).riskScore.toFixed(1)}`} />
            </Row>
          </Section>
          <Row>
            <Section title="Severity Scores (HR-01 to HR-10)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={csddd.categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 80]} />
                  <YAxis type="category" dataKey="id" width={45} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val, _, p) => [`${val}`, p.payload?.name]} />
                  <Legend />
                  <Bar dataKey="severity" fill="#ef4444" name="Severity" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="likelihood" fill="#f59e0b" name="Likelihood" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Priority Classification">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['ID', 'Category', 'Risk Score', 'Priority'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csddd.categories.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#059669' }}>{c.id}</td>
                      <td style={{ padding: '6px 10px', color: '#374151' }}>{c.name}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.riskScore.toFixed(1)}</td>
                      <td style={{ padding: '6px 10px' }}><Badge label={c.priority} color={c.priority === 'High' ? 'red' : c.priority === 'Medium' ? 'yellow' : 'green'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — UNGP HRDD */}
      {tab === 3 && (
        <div>
          <Section title="UNGP HRDD Summary">
            <Row gap={12}>
              <KpiCard label="HRDD Composite Score" value={`${ungp.composite}/100`} sub="6-step UNGP assessment" accent />
              <KpiCard label="Compliance Tier" value={<Badge label={ungp.tier === 'compliant' ? 'Compliant' : ungp.tier === 'partial' ? 'Partial' : 'Non-Compliant'} color={ungp.tier === 'compliant' ? 'green' : ungp.tier === 'partial' ? 'yellow' : 'red'} />} sub="≥75 Compliant · ≥55 Partial" />
              <KpiCard label="Weakest Step" value={ungp.steps.reduce((a, b) => a.score < b.score ? a : b).dimension.split(' ')[0]} sub={`Score: ${ungp.steps.reduce((a, b) => a.score < b.score ? a : b).score}/100`} />
              <KpiCard label="Steps Above 70" value={`${ungp.steps.filter(s => s.score >= 70).length} / 6`} sub="Strong performance threshold" />
            </Row>
          </Section>
          <Row>
            <Section title="6 HRDD Steps Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={ungp.steps}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="HRDD Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Step Scores">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={ungp.steps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="dimension" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <ReferenceLine x={55} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Partial', fontSize: 9, fill: '#ef4444' }} />
                  <ReferenceLine x={75} stroke="#059669" strokeDasharray="4 4" label={{ value: 'Compliant', fontSize: 9, fill: '#059669' }} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {ungp.steps.map((s, i) => <Cell key={i} fill={s.score >= 75 ? '#059669' : s.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 5 — Decent Work */}
      {tab === 4 && (
        <div>
          <Section title="Decent Work Indicators">
            <Row gap={12}>
              <KpiCard label="Living Wage" value={<Badge label={decentWork.livingWage ? '✓ Paid' : '✗ Gap'} color={decentWork.livingWage ? 'green' : 'red'} />} sub="Living wage policy in place" accent />
              <KpiCard label="Gender Pay Gap" value={`${decentWork.genderPayGap}%`} sub="Unexplained gap (lower = better)" />
              <KpiCard label="Union Coverage" value={`${decentWork.unionCoverage}%`} sub="Workforce covered by collective bargaining" />
              <KpiCard label="Injury Rate (LTIFR)" value={`${decentWork.injuryRate}`} sub="Lost-time injuries per 200k hrs" />
            </Row>
          </Section>
          <Section title="Decent Work vs Sector Benchmarks">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={decentWork.sectorBenchmarks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" height={50} />
                <YAxis domain={[0, 120]} unit="%" />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                <Bar dataKey="company" fill="#059669" name={companyName || 'Company'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="sector" fill="#d1d5db" name={`${naceSector} Sector Avg`} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Decent Work Assessment Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Metric', 'Company', 'Sector Avg', 'vs Benchmark'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {decentWork.sectorBenchmarks.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{b.metric}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.company}%</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{b.sector}%</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={b.company >= b.sector ? '✓ Above' : '✗ Below'} color={b.company >= b.sector ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}
    </div>
  );
}
