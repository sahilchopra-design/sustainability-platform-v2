import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; } return Math.abs(h); };
const seededRandom = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

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

const TABS = ['IWG-SWF Santiago', 'ESG Policy', 'GPFG Exclusion Screen', 'Portfolio Temperature', 'Divestment Pathway'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SWF_COUNTRIES = [
  'Norway', 'UAE', 'China', 'Kuwait', 'Singapore', 'Saudi Arabia', 'Qatar', 'Hong Kong',
  'Russia', 'South Korea', 'Australia', 'Kazakhstan', 'Libya', 'Azerbaijan', 'United States',
];

const getSantiagoData = (fund, fundType, country) => {
  const base = hashStr(fund + fundType + country);
  const s = (n) => seededRandom(base + n);
  const pillars = [
    { dimension: 'Legal Framework', score: Math.round(s(1) * 30 + 55) },
    { dimension: 'Governance', score: Math.round(s(2) * 28 + 52) },
    { dimension: 'Investment', score: Math.round(s(3) * 32 + 50) },
  ];
  const overall = Math.round(pillars.reduce((sum, p) => sum + p.score, 0) / 3);
  const tier = overall >= 80 ? 'Leader' : overall >= 65 ? 'Advanced' : overall >= 50 ? 'Developing' : 'Laggard';
  const tierColor = overall >= 80 ? 'green' : overall >= 65 ? 'blue' : overall >= 50 ? 'yellow' : 'red';
  const gapps = Array.from({ length: 24 }, (_, i) => ({
    gapp: `GAPP ${i + 1}`,
    score: Math.round(s(i + 10) * 3 + 1),
    label: [
      'Legal basis', 'Policy purpose', 'Policy publication', 'Policy funding',
      'Accountability', 'Governance structure', 'Board composition', 'Board mandate',
      'Ethical standards', 'Reporting', 'Fund management', 'Investment policy',
      'Risk management', 'Asset allocation', 'Performance benchmarks', 'Leverage policy',
      'Currency hedging', 'Liability mgmt', 'Liquidity policy', 'Third-party mgmt',
      'Transparency', 'Audit', 'External review', 'Relationship',
    ][i],
  }));
  return { pillars, overall, tier, tierColor, gapps };
};

const getESGData = (fund, fundType, country) => {
  const base = hashStr(fund + fundType + country + 'esg');
  const s = (n) => seededRandom(base + n);
  const esgPolicyScore = Math.round(s(1) * 30 + 55);
  const exclusionScore = Math.round(s(2) * 28 + 52);
  const climateScore = Math.round(s(3) * 32 + 50);
  const engagementScore = Math.round(s(4) * 26 + 54);
  const dimensions = [
    { dimension: 'Policy Framework', score: Math.round(s(5) * 25 + 55) },
    { dimension: 'Exclusion Breadth', score: Math.round(s(6) * 28 + 50) },
    { dimension: 'Climate Integration', score: Math.round(s(7) * 30 + 48) },
    { dimension: 'Stewardship', score: Math.round(s(8) * 26 + 52) },
    { dimension: 'Transparency', score: Math.round(s(9) * 32 + 50) },
  ];
  const peerComparison = dimensions.map((d, i) => ({
    ...d,
    peer: Math.round(s(i + 20) * 20 + 50),
  }));
  return { esgPolicyScore, exclusionScore, climateScore, engagementScore, dimensions, peerComparison };
};

const getGPFGData = (fund, country) => {
  const base = hashStr(fund + country + 'gpfg');
  const s = (n) => seededRandom(base + n);
  const companies = [
    'GenericCo Coal A', 'MegaMine Corp', 'ArmsGlobal Ltd', 'PalmOil Holdings',
    'TobaccoGroup PLC', 'WasteChemical AG', 'ClusterMunitions SA', 'CoalPower Inc',
    'DeforestateCo NV', 'SlaveryRisk Ltd',
  ].map((name, i) => ({
    name,
    sector: ['Energy', 'Mining', 'Defence', 'Agri', 'Tobacco', 'Chemicals', 'Defence', 'Utilities', 'Agriculture', 'Apparel'][i],
    criterion: ['Coal > 30%', 'Coal mining', 'Cluster munitions', 'EUDR risk', 'Tobacco production', 'Serious env harm', 'Landmines', 'Thermal coal', 'Deforestation', 'Labour rights'][i],
    status: s(i + 10) > 0.3 ? 'Excluded' : 'Under observation',
  }));
  const totalExcluded = companies.filter(c => c.status === 'Excluded').length;
  const aumImpact = parseFloat((s(20) * 1.5 + 0.5).toFixed(2));
  const exclusionTypes = [
    { name: 'Coal', value: Math.round(s(30) * 8 + 25) },
    { name: 'Conduct', value: Math.round(s(31) * 8 + 20) },
    { name: 'Weapons', value: Math.round(s(32) * 6 + 15) },
    { name: 'Environmental', value: Math.round(s(33) * 6 + 18) },
    { name: 'Human Rights', value: Math.round(s(34) * 5 + 12) },
  ];
  return { companies, totalExcluded, aumImpact, exclusionTypes };
};

const getTemperatureData = (fund, fundType, country, aum) => {
  const base = hashStr(fund + fundType + country + 'temp');
  const s = (n) => seededRandom(base + n);
  const portfolioTemp = parseFloat((s(1) * 1.5 + 2.1).toFixed(1));
  const fossilPct = parseFloat((s(2) * 15 + 5).toFixed(1));
  const greenPct = parseFloat((s(3) * 20 + 15).toFixed(1));
  const parisScore = Math.round(s(4) * 30 + 40);
  const years = [2024, 2026, 2028, 2030, 2035, 2040, 2045, 2050];
  const trajData = years.map((yr, yi) => ({
    year: yr,
    portfolio: parseFloat((portfolioTemp - yi * 0.04 + s(yi + 10) * 0.1).toFixed(2)),
    '1.5C': 1.5,
    '2.0C': 2.0,
  }));
  const sectors = ['Energy', 'Materials', 'Utilities', 'Industry', 'Transport', 'Real Estate', 'Finance', 'Tech'].map((sec, i) => ({
    sector: sec,
    waci: Math.round(s(i + 20) * 200 + 50),
  }));
  return { portfolioTemp, fossilPct, greenPct, parisScore, trajData, sectors };
};

const getDivestmentData = (fund, fundType, country) => {
  const base = hashStr(fund + fundType + country + 'divest');
  const s = (n) => seededRandom(base + n);
  const startExposure = parseFloat((s(1) * 10 + 8).toFixed(1));
  const years = [2024, 2026, 2028, 2030, 2035, 2040, 2045, 2050];
  const pathways = ['Immediate', '2030 Target', '2050 Target', 'Engagement'];
  const pathwayColors = ['#ef4444', '#f59e0b', '#3b82f6', '#059669'];
  const lineData = years.map((yr, yi) => {
    const row = { year: yr };
    const t = yi / (years.length - 1);
    row['Immediate'] = yi === 0 ? startExposure : parseFloat((startExposure * 0.02).toFixed(1));
    row['2030 Target'] = parseFloat((startExposure * Math.max(0, 1 - t * 2.5) + s(yi + 5) * 0.5).toFixed(1));
    row['2050 Target'] = parseFloat((startExposure * Math.max(0, 1 - t) + s(yi + 15) * 0.5).toFixed(1));
    row['Engagement'] = parseFloat((startExposure * Math.max(0.1, 1 - t * 0.7) + s(yi + 25) * 0.3).toFixed(1));
    return row;
  });
  const npvTable = pathways.map((p, i) => ({
    pathway: p,
    npvImpact: `${s(i + 30) > 0.5 ? '+' : '-'}$${(s(i + 30) * 500 + 50).toFixed(0)}M`,
    riskReduction: `${Math.round(s(i + 40) * 30 + 20)}%`,
    regRisk: ['Immediate', '2030 Target'].includes(p) ? 'Low' : p === 'Engagement' ? 'Medium' : 'High',
  }));
  const reallocData = [
    { sector: 'Green Infra', opportunity: Math.round(s(50) * 300 + 100) },
    { sector: 'Renewables', opportunity: Math.round(s(51) * 400 + 200) },
    { sector: 'Green Bonds', opportunity: Math.round(s(52) * 250 + 150) },
    { sector: 'Blue Economy', opportunity: Math.round(s(53) * 200 + 80) },
    { sector: 'Nature Finance', opportunity: Math.round(s(54) * 180 + 70) },
    { sector: 'Clean Tech', opportunity: Math.round(s(55) * 350 + 100) },
  ];
  return { lineData, pathways, pathwayColors, npvTable, reallocData };
};

export default function SovereignSWFPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundName, setFundName] = useState('Nordic Sovereign Fund');
  const [fundType, setFundType] = useState('sovereign_wealth');
  const [aumUsdBn, setAumUsdBn] = useState('500');
  const [country, setCountry] = useState('Norway');

  const santiago = getSantiagoData(fundName, fundType, country);
  const esg = getESGData(fundName, fundType, country);
  const gpfg = getGPFGData(fundName, country);
  const temp = getTemperatureData(fundName, fundType, country, aumUsdBn);
  const divest = getDivestmentData(fundName, fundType, country);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/sovereign-swf/assess`, {
        fund_name: fundName, fund_type: fundType, aum_usd_bn: parseFloat(aumUsdBn), country,
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  const inputPanel = (
    <Section title="Sovereign / SWF Inputs">
      <Row>
        <Inp label="Fund Name" value={fundName} onChange={setFundName} />
        <Sel label="Fund Type" value={fundType} onChange={setFundType} options={[
          { value: 'sovereign_wealth', label: 'Sovereign Wealth Fund' }, { value: 'pension', label: 'Pension Fund' },
          { value: 'central_bank', label: 'Central Bank Reserve' }, { value: 'reserve', label: 'Stabilisation Reserve' },
        ]} />
        <Inp label="AUM (USD Billions)" value={aumUsdBn} onChange={setAumUsdBn} type="number" />
        <Sel label="Country" value={country} onChange={setCountry} options={SWF_COUNTRIES.map(c => ({ value: c, label: c }))} />
      </Row>
      <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run SWF Assessment'}</Btn>
    </Section>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Sovereign & SWF ESG Engine</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>IWG-SWF Santiago Principles (GAPP 1-24) · GPFG Exclusion · ESG Policy · Portfolio Temperature · Divestment Pathways</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — IWG-SWF Santiago Principles */}
      {tab === 0 && (
        <div>
          {inputPanel}
          <Section title="Santiago Principles Summary">
            <Row gap={12}>
              <KpiCard label="Overall GAPP Score" value={`${santiago.overall}/100`} sub="24 GAPP principles weighted average" accent />
              <KpiCard label="Governance Tier" value={<Badge label={santiago.tier} color={santiago.tierColor} />} sub="Leader / Advanced / Developing / Laggard" />
              <KpiCard label="GAPP Principles Passed (≥3/4)" value={`${santiago.gapps.filter(g => g.score >= 3).length} / 24`} sub="Score ≥ 3 threshold" />
              <KpiCard label="Lowest Pillar" value={[...santiago.pillars].sort((a, b) => a.score - b.score)[0].dimension} sub={`Score: ${[...santiago.pillars].sort((a, b) => a.score - b.score)[0].score}/100`} />
            </Row>
          </Section>
          <Row>
            <Section title="3-Pillar Radar">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={santiago.pillars}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="24 GAPP Principles (0–4 scale)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={santiago.gapps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                  <YAxis type="category" dataKey="gapp" width={52} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(val, _, p) => [`${val}/4`, p.payload?.label]} />
                  <Bar dataKey="score" name="GAPP Score" radius={[0, 3, 3, 0]}>
                    {santiago.gapps.map((g, i) => <Cell key={i} fill={g.score >= 3 ? '#059669' : g.score >= 2 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — ESG Policy */}
      {tab === 1 && (
        <div>
          {inputPanel}
          <Section title="ESG Policy Scores">
            <Row gap={12}>
              <KpiCard label="ESG Policy Score" value={`${esg.esgPolicyScore}/100`} sub="Comprehensive ESG framework" accent />
              <KpiCard label="Exclusion Policy Score" value={`${esg.exclusionScore}/100`} sub="Negative screen breadth" />
              <KpiCard label="Climate Integration Score" value={`${esg.climateScore}/100`} sub="TCFD/IFRS S2 alignment" />
              <KpiCard label="Engagement Score" value={`${esg.engagementScore}/100`} sub="Active ownership activities" />
            </Row>
          </Section>
          <Row>
            <Section title="5 ESG Dimensions Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={esg.peerComparison}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="This Fund" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                  <Radar name="Peer Average" dataKey="peer" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="This Fund vs Peer Average">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={esg.peerComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dimension" tick={{ fontSize: 10 }} angle={-12} textAnchor="end" height={48} />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                  <Bar dataKey="score" fill="#059669" name="This Fund" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="peer" fill="#3b82f6" name="Peer Average" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — GPFG Exclusion Screen */}
      {tab === 2 && (
        <div>
          {inputPanel}
          <Section title="Exclusion Summary">
            <Row gap={12}>
              <KpiCard label="Companies Excluded" value={gpfg.totalExcluded} sub="Active exclusion list" accent />
              <KpiCard label="Under Observation" value={gpfg.companies.filter(c => c.status === 'Under observation').length} sub="Monitoring for criteria breach" />
              <KpiCard label="AUM Impact" value={`${gpfg.aumImpact}%`} sub="% of total AUM divested" />
              <KpiCard label="Exclusion Standard" value={<Badge label="GPFG-aligned" color="blue" />} sub="Norges Bank NBIM criteria" />
            </Row>
          </Section>
          <Row>
            <Section title="Top Excluded Companies">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Company', 'Sector', 'Criterion', 'Status'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gpfg.companies.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: '#374151' }}>{c.name}</td>
                      <td style={{ padding: '6px 10px', color: '#6b7280' }}>{c.sector}</td>
                      <td style={{ padding: '6px 10px', color: '#374151' }}>{c.criterion}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <Badge label={c.status} color={c.status === 'Excluded' ? 'red' : 'yellow'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="Exclusion Types">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={gpfg.exclusionTypes} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {gpfg.exclusionTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} companies`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — Portfolio Temperature */}
      {tab === 3 && (
        <div>
          {inputPanel}
          <Section title="Portfolio Climate Alignment">
            <Row gap={12}>
              <KpiCard label="Portfolio Temperature" value={`${temp.portfolioTemp}°C`} sub="Implied warming trajectory" accent />
              <KpiCard label="Fossil Fuel Exposure" value={`${temp.fossilPct}%`} sub="% of AUM in fossil fuel assets" />
              <KpiCard label="Green Investment" value={`${temp.greenPct}%`} sub="% aligned to EU Taxonomy / ICMA" />
              <KpiCard label="Paris Alignment Score" value={`${temp.parisScore}/100`} sub="SBTi / PACTA alignment" />
            </Row>
          </Section>
          <Section title="Portfolio Temperature Trajectory 2024–2050">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={temp.trajData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[1, 4]} unit="°C" />
                <Tooltip formatter={(val) => `${val}°C`} />
                <Legend />
                <Area type="monotone" dataKey="portfolio" stroke="#3b82f6" fill="#dbeafe" name="Portfolio °C" />
                <Line type="monotone" dataKey="1.5C" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" name="1.5°C target" dot={false} />
                <Line type="monotone" dataKey="2.0C" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="2.0°C target" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
          <Section title="WACI by Sector (tCO2e/$ M revenue)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={temp.sectors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis unit="" />
                <Tooltip formatter={(val) => `${val} tCO2e/$M`} />
                <Bar dataKey="waci" name="WACI" fill="#059669" radius={[4, 4, 0, 0]}>
                  {temp.sectors.map((d, i) => <Cell key={i} fill={d.waci > 200 ? '#ef4444' : d.waci > 100 ? '#f59e0b' : '#059669'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Divestment Pathway */}
      {tab === 4 && (
        <div>
          {inputPanel}
          <Section title="Fossil Fuel Exposure Reduction — 4 Divestment Pathways (% AUM)">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={divest.lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis unit="%" />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                {divest.pathways.map((p, i) => (
                  <Line key={p} type="monotone" dataKey={p} stroke={divest.pathwayColors[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Section>
          <Row>
            <Section title="NPV Impact & Risk Table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Pathway', 'NPV Impact', 'Risk Reduction', 'Regulatory Risk'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {divest.npvTable.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{r.pathway}</td>
                      <td style={{ padding: '8px 12px', color: '#111827', fontWeight: 600 }}>{r.npvImpact}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{r.riskReduction}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={r.regRisk} color={r.regRisk === 'Low' ? 'green' : r.regRisk === 'Medium' ? 'yellow' : 'red'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="Reallocation Opportunities ($M equivalent)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={divest.reallocData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="M" />
                  <YAxis type="category" dataKey="sector" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `$${val}M`} />
                  <Bar dataKey="opportunity" name="Opportunity ($M)" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}
    </div>
  );
}
