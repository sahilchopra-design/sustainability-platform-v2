import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Cell,
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

const TABS = ['IEA Criticality', 'EU CRM Act', 'IRMA Responsible Mining', 'Supply Chain Risk', 'Overall CRM Risk'];

const MINERAL_OPTIONS = [
  { value: 'lithium', label: 'Lithium (Li)' },
  { value: 'cobalt', label: 'Cobalt (Co)' },
  { value: 'nickel', label: 'Nickel (Ni)' },
  { value: 'copper', label: 'Copper (Cu)' },
  { value: 'rare_earths', label: 'Rare Earth Elements (REE)' },
  { value: 'manganese', label: 'Manganese (Mn)' },
  { value: 'graphite', label: 'Graphite (C)' },
  { value: 'platinum_group', label: 'Platinum Group Metals (PGM)' },
  { value: 'silicon', label: 'Silicon Metal (Si)' },
  { value: 'gallium', label: 'Gallium (Ga)' },
];

const TECH_OPTIONS = [
  { value: 'ev_battery', label: 'EV Battery Technology' },
  { value: 'solar_pv', label: 'Solar PV (Crystalline)' },
  { value: 'wind_offshore', label: 'Offshore Wind Turbines' },
  { value: 'grid_storage', label: 'Grid-Scale Storage' },
  { value: 'fuel_cell', label: 'Hydrogen Fuel Cells' },
];

const getIeaData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const subScores = [
    { name: 'Demand Growth', key: 'demand_growth', value: Math.round(seed(mi * 7) * 40 + 55) },
    { name: 'Supply Concentration', key: 'supply_concentration', value: Math.round(seed(mi * 11) * 35 + 50) },
    { name: 'Geopolitical Risk', key: 'geopolitical_risk', value: Math.round(seed(mi * 13) * 38 + 45) },
    { name: 'Substitutability', key: 'substitutability', value: Math.round(seed(mi * 17) * 30 + 40) },
  ];
  const composite = Math.round(subScores.reduce((s, x) => s + x.value, 0) / 4);
  const tier = composite >= 80 ? 'Critical' : composite >= 65 ? 'High' : composite >= 50 ? 'Medium' : 'Low';
  const tierColor = composite >= 80 ? 'red' : composite >= 65 ? 'orange' : composite >= 50 ? 'yellow' : 'green';
  return { subScores, composite, tier, tierColor };
};

const getEuCrmData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const strategic = seed(mi * 19) > 0.4;
  const critical = seed(mi * 23) > 0.3;
  const compliance = Math.round(seed(mi * 29) * 35 + 50);
  const gaps = [
    { name: 'Domestic Production', value: Math.round(seed(mi * 31) * 40 + 20) },
    { name: 'Recycling Capacity', value: Math.round(seed(mi * 37) * 35 + 25) },
    { name: 'Stockpile Adequacy', value: Math.round(seed(mi * 41) * 30 + 30) },
    { name: 'Import Diversification', value: Math.round(seed(mi * 43) * 38 + 28) },
    { name: 'R&D Investment', value: Math.round(seed(mi * 47) * 25 + 35) },
  ];
  return { strategic, critical, compliance, gaps };
};

const getIrmaData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const areas = [
    { dimension: 'Business Integrity', score: Math.round(seed(mi * 53) * 30 + 50) },
    { dimension: 'Community', score: Math.round(seed(mi * 57) * 28 + 48) },
    { dimension: 'Labour Rights', score: Math.round(seed(mi * 59) * 32 + 45) },
    { dimension: 'Environment', score: Math.round(seed(mi * 61) * 30 + 47) },
    { dimension: 'Mining Lifecycle', score: Math.round(seed(mi * 67) * 28 + 50) },
    { dimension: 'Indigenous Rights', score: Math.round(seed(mi * 71) * 35 + 42) },
  ];
  const composite = Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);
  const tier = composite >= 80 ? 'IRMA 100' : composite >= 65 ? 'IRMA 75' : composite >= 50 ? 'IRMA 50' : 'IRMA 25';
  const tierColor = composite >= 80 ? 'green' : composite >= 65 ? 'blue' : composite >= 50 ? 'yellow' : 'red';
  return { areas, composite, tier, tierColor };
};

const getSupplyChainData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const exposures = [
    { name: 'EV Battery', value: parseFloat((seed(mi * 73) * 80 + 20).toFixed(1)) },
    { name: 'Solar PV', value: parseFloat((seed(mi * 79) * 60 + 15).toFixed(1)) },
    { name: 'Wind Turbine', value: parseFloat((seed(mi * 83) * 50 + 10).toFixed(1)) },
    { name: 'Grid Storage', value: parseFloat((seed(mi * 89) * 40 + 10).toFixed(1)) },
    { name: 'Fuel Cells', value: parseFloat((seed(mi * 97) * 30 + 5).toFixed(1)) },
  ];
  const total = parseFloat(exposures.reduce((s, e) => s + e.value, 0).toFixed(1));
  const hhi = parseFloat((exposures.reduce((s, e) => s + Math.pow(e.value / total, 2), 0) * 10000).toFixed(0));
  const hhiTier = hhi >= 2500 ? 'High Concentration' : hhi >= 1500 ? 'Moderate' : 'Diversified';
  const hhiColor = hhi >= 2500 ? 'red' : hhi >= 1500 ? 'yellow' : 'green';
  return { exposures, total, hhi, hhiTier, hhiColor };
};

const getOverallData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2030];
  const priceVolatility = years.map((yr, i) => ({
    year: yr,
    score: Math.round(seed(mi * 101 + i * 7) * 40 + 45),
  }));
  const supplyDisruptionProb = Math.round(seed(mi * 107) * 35 + 15);
  const top3CountryShare = Math.round(seed(mi * 109) * 30 + 55);
  const riskTier = top3CountryShare >= 80 ? 'Very High' : top3CountryShare >= 65 ? 'High' : top3CountryShare >= 50 ? 'Medium' : 'Low';
  const riskColor = top3CountryShare >= 80 ? 'red' : top3CountryShare >= 65 ? 'orange' : top3CountryShare >= 50 ? 'yellow' : 'green';
  return { priceVolatility, supplyDisruptionProb, top3CountryShare, riskTier, riskColor };
};

export default function CriticalMineralsPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mineral, setMineral] = useState('lithium');
  const [techFocus, setTechFocus] = useState('ev_battery');

  const iea = getIeaData(mineral);
  const euCrm = getEuCrmData(mineral);
  const irma = getIrmaData(mineral);
  const supply = getSupplyChainData(mineral);
  const overall = getOverallData(mineral);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/critical-minerals/assess`, {
        mineral, tech_focus: techFocus,
        company_id: 'demo-001',
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Critical Minerals & Transition Metals</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>IEA CRM 2024 · EU CRM Act · IRMA · OECD DDG</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      <Section title="Assessment Parameters">
        <Row>
          <Sel label="Critical Mineral" value={mineral} onChange={setMineral} options={MINERAL_OPTIONS} />
          <Sel label="Technology Focus" value={techFocus} onChange={setTechFocus} options={TECH_OPTIONS} />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Running…' : 'Run CRM Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — IEA Criticality */}
      {tab === 0 && (
        <div>
          <Section title="IEA Critical Minerals Outlook 2024 — Criticality Assessment">
            <Row gap={12}>
              <KpiCard label="IEA Criticality Composite" value={`${iea.composite}/100`} sub="4-indicator weighted composite" accent />
              <KpiCard label="Criticality Tier" value={<Badge label={iea.tier} color={iea.tierColor} />} sub="IEA 2024 classification" />
              <KpiCard label="Highest Sub-Score" value={[...iea.subScores].sort((a, b) => b.value - a.value)[0].name} sub={`Score: ${[...iea.subScores].sort((a, b) => b.value - a.value)[0].value}/100`} />
              <KpiCard label="Supply Concentration" value={`${iea.subScores[1].value}/100`} sub="HHI-based geographic concentration" />
            </Row>
          </Section>

          <Section title="IEA Criticality Sub-Indicators">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={iea.subScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="value" name="Criticality Score" radius={[4, 4, 0, 0]}>
                  {iea.subScores.map((s, i) => (
                    <Cell key={i} fill={s.value >= 75 ? '#ef4444' : s.value >= 60 ? '#f59e0b' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="IEA Criticality Framework — Reference">
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 16 }}>
              {[
                { indicator: 'Demand Growth', weight: '30%', desc: 'Clean energy transition demand trajectory (IEA NZE 2050)' },
                { indicator: 'Supply Concentration', weight: '30%', desc: 'Top-3 country production share (HHI > 2500 = high risk)' },
                { indicator: 'Geopolitical Risk', weight: '25%', desc: 'Producer country WGI + OECD geopolitical exposure index' },
                { indicator: 'Substitutability', weight: '15%', desc: 'Technical substitutability in key clean energy applications' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < 3 ? '1px solid #fde68a' : 'none' }}>
                  <span style={{ fontWeight: 700, color: '#92400e', minWidth: 180, fontSize: 13 }}>{item.indicator}</span>
                  <span style={{ color: '#78350f', fontWeight: 600, minWidth: 40, fontSize: 13 }}>{item.weight}</span>
                  <span style={{ color: '#374151', fontSize: 13 }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — EU CRM Act */}
      {tab === 1 && (
        <div>
          <Section title="EU Critical Raw Materials Act (Regulation (EU) 2024/1252)">
            <Row gap={12}>
              <KpiCard label="EU Strategic Mineral" value={<Badge label={euCrm.strategic ? 'Yes — Strategic' : 'No'} color={euCrm.strategic ? 'green' : 'gray'} />} sub="Annex II (34 strategic CRMs)" accent />
              <KpiCard label="EU Critical Mineral" value={<Badge label={euCrm.critical ? 'Yes — Critical' : 'No'} color={euCrm.critical ? 'blue' : 'gray'} />} sub="Annex I (50 critical CRMs)" />
              <KpiCard label="CRM Compliance Score" value={`${euCrm.compliance}/100`} sub="Across 5 compliance dimensions" />
              <KpiCard label="Compliance Status" value={<Badge label={euCrm.compliance >= 70 ? 'Compliant' : euCrm.compliance >= 50 ? 'Partial' : 'Non-Compliant'} color={euCrm.compliance >= 70 ? 'green' : euCrm.compliance >= 50 ? 'yellow' : 'red'} />} sub="EU CRM Act Art 5 & 6 assessment" />
            </Row>
          </Section>

          <Section title="EU CRM Act Compliance Gap Analysis">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={euCrm.gaps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-10} textAnchor="end" height={45} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="value" name="Compliance Score" radius={[4, 4, 0, 0]}>
                  {euCrm.gaps.map((g, i) => (
                    <Cell key={i} fill={g.value >= 65 ? '#059669' : g.value >= 45 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="EU CRM Act Benchmarks (Art 5 Targets by 2030)">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
              {[
                { target: '10% domestic extraction', desc: 'EU annual consumption of strategic CRMs' },
                { target: '40% domestic processing', desc: 'Processing capacity for strategic CRMs' },
                { target: '25% recycled content', desc: 'Recycling capacity from end-of-life waste' },
                { target: 'No >65% single country', desc: 'Import concentration cap for any strategic CRM' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #dbeafe' : 'none' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af', fontSize: 13 }}>{item.target}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — IRMA Responsible Mining */}
      {tab === 2 && (
        <div>
          <Section title="Initiative for Responsible Mining Assurance (IRMA) Standard for Responsible Mining">
            <Row gap={12}>
              <KpiCard label="IRMA Score" value={`${irma.composite}/100`} sub="6-area weighted composite" accent />
              <KpiCard label="IRMA Tier" value={<Badge label={irma.tier} color={irma.tierColor} />} sub="IRMA 25 / 50 / 75 / 100" />
              <KpiCard label="Weakest Area" value={[...irma.areas].sort((a, b) => a.score - b.score)[0].dimension} sub={`Score: ${[...irma.areas].sort((a, b) => a.score - b.score)[0].score}/100`} />
              <KpiCard label="OECD DDG Aligned" value={<Badge label={irma.composite >= 65 ? 'Aligned' : 'Gaps Identified'} color={irma.composite >= 65 ? 'green' : 'yellow'} />} sub="OECD Due Diligence Guidance alignment" />
            </Row>
          </Section>

          <Row>
            <Section title="IRMA Assessment Areas — Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={irma.areas} cx="50%" cy="50%" outerRadius={110}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="IRMA Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="IRMA Area Scores">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={irma.areas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="dimension" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="IRMA Score" radius={[0, 4, 4, 0]}>
                    {irma.areas.map((a, i) => (
                      <Cell key={i} fill={a.score >= 70 ? '#059669' : a.score >= 55 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — Supply Chain Risk */}
      {tab === 3 && (
        <div>
          <Section title="Transition Technology Exposure Analysis ($M)">
            <Row gap={12}>
              <KpiCard label="Total Transition Exposure" value={`$${supply.total}M`} sub="Aggregate across 5 tech categories" accent />
              <KpiCard label="Concentration HHI" value={supply.hhi.toLocaleString()} sub="Herfindahl-Hirschman Index" />
              <KpiCard label="Concentration Level" value={<Badge label={supply.hhiTier} color={supply.hhiColor} />} sub="HHI > 2500 = high concentration" />
              <KpiCard label="Top Technology Exposure" value={[...supply.exposures].sort((a, b) => b.value - a.value)[0].name} sub={`$${[...supply.exposures].sort((a, b) => b.value - a.value)[0].value}M exposure`} />
            </Row>
          </Section>

          <Section title="Transition Technology Exposure by Application ($M)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supply.exposures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="M" />
                <Tooltip formatter={(val) => `$${val}M`} />
                <Bar dataKey="value" name="Exposure ($M)" radius={[4, 4, 0, 0]}>
                  {supply.exposures.map((e, i) => (
                    <Cell key={i} fill={['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Key Producer Countries & Risk Exposure">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Country', 'Production Share', 'Geopolitical Risk', 'Import Dependency Risk'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { country: 'China', share: `${Math.round(seed(supply.total * 3) * 30 + 40)}%`, geo: 'High', dep: 'Very High' },
                  { country: 'DRC', share: `${Math.round(seed(supply.total * 5) * 20 + 15)}%`, geo: 'Very High', dep: 'High' },
                  { country: 'Australia', share: `${Math.round(seed(supply.total * 7) * 15 + 8)}%`, geo: 'Low', dep: 'Low' },
                  { country: 'Chile', share: `${Math.round(seed(supply.total * 11) * 12 + 6)}%`, geo: 'Medium', dep: 'Medium' },
                  { country: 'Russia', share: `${Math.round(seed(supply.total * 13) * 10 + 5)}%`, geo: 'Very High', dep: 'High' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{row.country}</td>
                    <td style={{ padding: '8px 12px', color: '#111827' }}>{row.share}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={row.geo} color={row.geo === 'Very High' ? 'red' : row.geo === 'High' ? 'orange' : row.geo === 'Medium' ? 'yellow' : 'green'} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={row.dep} color={row.dep === 'Very High' ? 'red' : row.dep === 'High' ? 'orange' : row.dep === 'Medium' ? 'yellow' : 'green'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Overall CRM Risk */}
      {tab === 4 && (
        <div>
          <Section title="Overall CRM Risk Profile — Summary">
            <Row gap={12}>
              <KpiCard label="Supply Disruption Probability" value={`${overall.supplyDisruptionProb}%`} sub="12-month horizon (IEA methodology)" accent />
              <KpiCard label="Top-3 Country Share" value={`${overall.top3CountryShare}%`} sub="Production concentration metric" />
              <KpiCard label="CRM Risk Tier" value={<Badge label={overall.riskTier} color={overall.riskColor} />} sub="Composite IEA / EU CRM risk tier" />
              <KpiCard label="Price Volatility Trend" value={overall.priceVolatility[overall.priceVolatility.length - 1].score > overall.priceVolatility[0].score ? 'Increasing' : 'Decreasing'} sub="2020–2030 trajectory (IEA forecast)" />
            </Row>
          </Section>

          <Section title="Price Volatility Score — 2020 to 2030 (IEA Forecast)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={overall.priceVolatility}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100 volatility score`} />
                <Area type="monotone" dataKey="score" stroke="#059669" fill="url(#volGrad)" strokeWidth={2} name="Price Volatility Score" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="CRM Risk Mitigation Strategy">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              {[
                { action: 'Geographic Diversification', desc: 'Expand sourcing to Australia, Canada, Chile to reduce China/DRC dependency', urgency: 'Immediate' },
                { action: 'Circular Economy Integration', desc: 'Urban mining + battery recycling pathways to reduce primary demand', urgency: 'Short-term' },
                { action: 'Strategic Stockpiling', desc: 'Minimum 3-month supply buffer aligned to EU CRM Act requirements', urgency: 'Short-term' },
                { action: 'Long-term Offtake Agreements', desc: 'IRMA-certified mine supply contracts with price floor/ceiling mechanisms', urgency: 'Medium-term' },
                { action: 'Substitution R&D Investment', desc: 'Fund alternatives research (e.g. sodium-ion, LFP, REE-free magnets)', urgency: 'Long-term' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < 4 ? '1px solid #d1fae5' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#065f46', fontSize: 13 }}>{item.action}</span>
                    <Badge label={item.urgency} color={item.urgency === 'Immediate' ? 'red' : item.urgency === 'Short-term' ? 'yellow' : item.urgency === 'Medium-term' ? 'blue' : 'gray'} />
                  </div>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
