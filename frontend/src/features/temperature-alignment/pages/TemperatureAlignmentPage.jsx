import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';
const hashStr = (s) => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = (seed) => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, offset = 0) => seededRandom(seed + offset);
const PIE_COLORS = ['#ef4444', '#f59e0b', '#059669', '#3b82f6', '#8b5cf6', '#06b6d4'];

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

const TABS = ['Portfolio Temperature', 'WACI by Sector', 'SBTi FI Criteria', 'PACTA Alignment', 'Engagement Priority'];

const SECTORS_8 = ['Energy', 'Utilities', 'Materials', 'Industrials', 'Transport', 'Real Estate', 'Finance', 'Agriculture'];
const PARIS_WACI = [45, 38, 55, 32, 72, 28, 18, 85];

const SBTI_CRITERIA = [
  { criterion: 'Scope 1+2 near-term target', weight: 20 },
  { criterion: 'Scope 3 coverage ≥67%', weight: 20 },
  { criterion: 'Financed emissions baseline', weight: 15 },
  { criterion: 'Sector-specific method (SDA)', weight: 15 },
  { criterion: 'Long-term net-zero target', weight: 20 },
  { criterion: 'Annual progress reporting', weight: 10 },
];

const MOCK_HOLDINGS = [
  { name: 'ExxonMobil', sector: 'Energy' },
  { name: 'NextEra Energy', sector: 'Utilities' },
  { name: 'BASF', sector: 'Materials' },
  { name: 'Siemens', sector: 'Industrials' },
  { name: 'Delta Air Lines', sector: 'Transport' },
  { name: 'Prologis', sector: 'Real Estate' },
  { name: 'JPMorgan Chase', sector: 'Finance' },
  { name: 'Bunge Global', sector: 'Agriculture' },
  { name: 'TotalEnergies', sector: 'Energy' },
  { name: 'Vestas Wind', sector: 'Utilities' },
];

const TRAJECTORY_YEARS = [2025, 2030, 2035, 2040, 2045, 2050];

function buildData(portfolio, fiType, aumStr, methodology) {
  const seed = hashStr(portfolio + fiType + aumStr + methodology);
  const aum = parseFloat(aumStr) || 10;

  const itr = parseFloat((sr(seed, 1) * 1.5 + 1.4).toFixed(2));
  const itrColor = itr < 1.8 ? 'green' : itr <= 2.5 ? 'yellow' : 'red';
  const parisAligned = itr <= 1.8;
  const waci = parseFloat((sr(seed, 3) * 150 + 80).toFixed(1));
  const dqs = parseFloat((sr(seed, 5) * 1.5 + 2.5).toFixed(1));

  const trajectoryData = TRAJECTORY_YEARS.map((yr, i) => {
    const decay = 1 - i * 0.12;
    return {
      year: yr,
      portfolio: parseFloat((itr * (1 - i * 0.05 * sr(seed, i * 7 + 10))).toFixed(2)),
      path15c: parseFloat((1.5 * decay).toFixed(2)),
      path2c: parseFloat((2.0 * decay).toFixed(2)),
      ndc: parseFloat((2.8 * (1 - i * 0.06)).toFixed(2)),
    };
  });

  const waciSectors = SECTORS_8.map((name, i) => ({
    name, waci: parseFloat((sr(seed, i * 11 + 30) * 120 + 20).toFixed(1)),
    parisThreshold: PARIS_WACI[i],
  }));

  const sbtiData = SBTI_CRITERIA.map((c, i) => ({
    ...c,
    score: Math.round(sr(seed, i * 13 + 50) * 40 + 45),
    gap: parseFloat((sr(seed, i * 17 + 55) * 0.4).toFixed(2)),
  }));
  const sbtiOverall = Math.round(sbtiData.reduce((s, c) => s + c.score * c.weight / 100, 0));
  const nearTermTarget = parseFloat((itr * 0.85).toFixed(2));
  const longTermTarget = 1.5;
  const sbtiRadial = [{ name: 'SBTi FI Score', value: sbtiOverall, fill: sbtiOverall >= 70 ? '#059669' : sbtiOverall >= 50 ? '#f59e0b' : '#ef4444' }];

  const pactaSectors = SECTORS_8.map((name, i) => ({
    name,
    aligned: Math.round(sr(seed, i * 19 + 70) * 50 + 20),
    currentPolicy: Math.round(sr(seed, i * 23 + 75) * 40 + 10),
  }));

  const pactaTrajectory = TRAJECTORY_YEARS.map((yr, i) => ({
    year: yr,
    current: parseFloat((100 - i * sr(seed, i * 29 + 80) * 8).toFixed(1)),
    paris: parseFloat((100 - i * 14).toFixed(1)),
  }));

  const holdings = MOCK_HOLDINGS.map((h, i) => {
    const hItr = parseFloat((sr(seed, i * 31 + 90) * 2 + 1.2).toFixed(2));
    const exposure = parseFloat((sr(seed, i * 37 + 95) * 4 + 0.5).toFixed(1));
    const priority = hItr > 2.5 ? 'High' : hItr > 1.8 ? 'Medium' : 'Low';
    return { ...h, itr: hItr, exposure, priority };
  });

  const engagementSplit = [
    { name: 'High Priority', value: Math.round(sr(seed, 101) * 20 + 30) },
    { name: 'Medium Priority', value: Math.round(sr(seed, 103) * 20 + 35) },
    { name: 'Low Priority', value: Math.round(sr(seed, 107) * 15 + 15) },
  ];

  const scope123 = [
    { scope: 'Scope 1', emissions: parseFloat((sr(seed, 111) * 40 + 20).toFixed(1)) },
    { scope: 'Scope 2', emissions: parseFloat((sr(seed, 113) * 25 + 15).toFixed(1)) },
    { scope: 'Scope 3', emissions: parseFloat((sr(seed, 117) * 80 + 40).toFixed(1)) },
  ];

  return { itr, itrColor, parisAligned, waci, dqs, trajectoryData, waciSectors, sbtiData, sbtiOverall, nearTermTarget, longTermTarget, sbtiRadial, pactaSectors, pactaTrajectory, holdings, engagementSplit, scope123 };
}

export default function TemperatureAlignmentPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState('Global Climate Fund');
  const [fiType, setFiType] = useState('asset_manager');
  const [aum, setAum] = useState('25');
  const [methodology, setMethodology] = useState('PCAF_SBTI');

  const d = buildData(portfolio, fiType, aum, methodology);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/temperature-alignment/assess`, { portfolio_name: portfolio, fi_type: fiType, total_aum_bn: parseFloat(aum), methodology });
    } catch { setError('API unavailable — demo mode.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Temperature Alignment & Paris Pathway</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>PCAF-SBTi FI · PACTA · WACI · SDA · Implied Temperature Rise · Portfolio Decarbonisation Trajectory</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      <Section title="Inputs">
        <Row>
          <Inp label="Portfolio Name" value={portfolio} onChange={setPortfolio} />
          <Sel label="FI Type" value={fiType} onChange={setFiType} options={[{ value: 'bank', label: 'Bank' }, { value: 'insurer', label: 'Insurer' }, { value: 'asset_manager', label: 'Asset Manager' }, { value: 'pension', label: 'Pension Fund' }, { value: 'sovereign_wealth', label: 'Sovereign Wealth' }]} />
          <Inp label="Total AUM $bn" value={aum} onChange={setAum} type="number" />
          <Sel label="Methodology" value={methodology} onChange={setMethodology} options={[{ value: 'PCAF_SBTI', label: 'PCAF-SBTi' }, { value: 'PACTA', label: 'PACTA' }, { value: 'WACI', label: 'WACI' }, { value: 'SDA', label: 'SDA' }]} />
        </Row>
        <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Temperature Assessment'}</Btn>
      </Section>

      {tab === 0 && (
        <div>
          <Section title="Portfolio Temperature Summary">
            <Row gap={12}>
              <KpiCard label="Portfolio ITR (°C)" value={<span style={{ color: d.itrColor === 'green' ? '#059669' : d.itrColor === 'yellow' ? '#d97706' : '#dc2626' }}>{d.itr}°C</span>} sub="Implied Temperature Rise" accent />
              <KpiCard label="WACI (tCO₂/$mn)" value={`${d.waci}`} sub="Weighted Average Carbon Intensity" />
              <KpiCard label="Paris Aligned" value={<Badge label={d.parisAligned ? 'Aligned ≤1.8°C' : 'Not Aligned'} color={d.parisAligned ? 'green' : 'red'} />} sub="1.5°C / 2°C pathway" />
              <KpiCard label="PCAF DQS" value={`${d.dqs}/5`} sub="Data Quality Score (1=best)" />
            </Row>
          </Section>
          <Section title="Portfolio ITR Trajectory vs Paris Pathways (2025–2050)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={d.trajectoryData}>
                <defs>
                  <linearGradient id="gradPort" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis unit="°C" domain={[1, 3.5]} />
                <Tooltip formatter={(val) => `${val}°C`} />
                <Legend />
                <Area type="monotone" dataKey="portfolio" stroke="#6366f1" fill="url(#gradPort)" name="Portfolio ITR" strokeWidth={2} />
                <Line type="monotone" dataKey="path15c" stroke="#059669" name="1.5°C Pathway" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="path2c" stroke="#f59e0b" name="2°C Pathway" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="ndc" stroke="#ef4444" name="NDC Pathway" strokeDasharray="2 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {tab === 1 && (
        <div>
          <Section title="WACI by Sector vs Paris-Aligned Threshold (tCO₂/$mn)">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={d.waciSectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit=" t" />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => [`${val} tCO₂/$mn`, name]} />
                <Legend />
                <Bar dataKey="waci" name="Portfolio WACI" radius={[0, 4, 4, 0]}>
                  {d.waciSectors.map((s, i) => <Cell key={i} fill={s.waci <= s.parisThreshold ? '#059669' : s.waci <= s.parisThreshold * 1.5 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
                <Bar dataKey="parisThreshold" name="Paris Threshold" fill="#d1d5db" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {tab === 2 && (
        <div>
          <Row>
            <Section title="SBTi FI Score Gauge">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart innerRadius={50} outerRadius={130} data={d.sbtiRadial} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={10} dataKey="value" nameKey="name" label={{ fill: '#374151', fontSize: 13 }} background={{ fill: '#f3f4f6' }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: -4 }}>
                Near-term target: <strong style={{ color: '#059669' }}>{d.nearTermTarget}°C</strong> · Long-term: <strong style={{ color: '#059669' }}>{d.longTermTarget}°C</strong>
              </div>
            </Section>
            <Section title="SBTi FI Criteria Detail">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Criterion', 'Score', 'Status', 'Gap %'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {d.sbtiData.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', color: '#374151', fontSize: 12 }}>{c.criterion}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: c.score >= 70 ? '#059669' : c.score >= 50 ? '#d97706' : '#dc2626' }}>{c.score}/100</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={c.score >= 70 ? 'Met' : c.score >= 50 ? 'Partial' : 'Gap'} color={c.score >= 70 ? 'green' : c.score >= 50 ? 'yellow' : 'red'} /></td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{(c.gap * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Row>
        </div>
      )}

      {tab === 3 && (
        <div>
          <Section title="PACTA Sector Alignment — % Aligned with NZE vs Current Policy">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={d.pactaSectors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-12} textAnchor="end" height={45} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                <Bar dataKey="aligned" name="NZE Aligned %" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentPolicy" name="Current Policy %" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Sector Pathway — Current vs Paris Target 2025–2050 (Index)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.pactaTrajectory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis unit="" domain={[0, 110]} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Net Zero', position: 'right', fontSize: 11 }} />
                <Line type="monotone" dataKey="current" stroke="#6366f1" name="Current Trajectory" strokeWidth={2} />
                <Line type="monotone" dataKey="paris" stroke="#059669" name="Paris Target" strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {tab === 4 && (
        <div>
          <Section title="Top Holdings — Engagement Priority">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Holding', 'Sector', 'ITR (°C)', 'Exposure %', 'Priority'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {d.holdings.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{h.name}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{h.sector}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: h.itr > 2.5 ? '#dc2626' : h.itr > 1.8 ? '#d97706' : '#059669' }}>{h.itr}°C</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{h.exposure}%</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={h.priority} color={h.priority === 'High' ? 'red' : h.priority === 'Medium' ? 'yellow' : 'green'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Row>
            <Section title="Engagement Priority Split (AUM)">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={d.engagementSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {d.engagementSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Financed Emissions — Scope 1/2/3 (MtCO₂e)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.scope123}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scope" />
                  <YAxis unit=" Mt" />
                  <Tooltip formatter={(val) => `${val} MtCO₂e`} />
                  <Bar dataKey="emissions" name="Financed Emissions" radius={[4, 4, 0, 0]}>
                    {d.scope123.map((_, i) => <Cell key={i} fill={['#059669', '#3b82f6', '#f59e0b'][i]} />)}
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
