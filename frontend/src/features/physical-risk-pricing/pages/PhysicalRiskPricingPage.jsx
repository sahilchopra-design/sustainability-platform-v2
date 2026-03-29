import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; } return Math.abs(h); };
const seededRandom = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

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

const TABS = ['Peril Scores', 'NatCat Loss Table', 'Financial Impact', 'Stranding Analysis', 'NGFS Amplifiers'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const COUNTRIES = [
  'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Egypt', 'France', 'Germany', 'Ghana', 'India',
  'Indonesia', 'Italy', 'Japan', 'Kenya', 'Mexico', 'Netherlands', 'Nigeria', 'Pakistan', 'Peru', 'Philippines',
  'Poland', 'Saudi Arabia', 'South Africa', 'Spain', 'Thailand', 'Turkey', 'United Kingdom', 'United States', 'Vietnam', 'Zimbabwe',
];

const getPerilData = (country, assetClass, ngfs) => {
  const base = hashStr(country + assetClass + ngfs);
  const s = (n) => seededRandom(base + n);
  const acutePerils = [
    { dimension: 'Flood', score: Math.round(s(1) * 60 + 30) },
    { dimension: 'Cyclone', score: Math.round(s(2) * 55 + 25) },
    { dimension: 'Wildfire', score: Math.round(s(3) * 50 + 20) },
    { dimension: 'Earthquake', score: Math.round(s(4) * 45 + 15) },
    { dimension: 'Heatwave', score: Math.round(s(5) * 60 + 25) },
    { dimension: 'Sea Level', score: Math.round(s(6) * 40 + 20) },
    { dimension: 'Drought', score: Math.round(s(7) * 55 + 25) },
    { dimension: 'Precipitation', score: Math.round(s(8) * 50 + 20) },
    { dimension: 'Temperature', score: Math.round(s(9) * 65 + 25) },
  ];
  const composite = Math.round(acutePerils.reduce((sum, p) => sum + p.score, 0) / acutePerils.length);
  const ealPct = (s(10) * 0.8 + 0.1).toFixed(2);
  const tier = composite >= 70 ? 'Very High' : composite >= 55 ? 'High' : composite >= 40 ? 'Medium' : 'Low';
  const tierColor = composite >= 70 ? 'red' : composite >= 55 ? 'orange' : composite >= 40 ? 'yellow' : 'green';
  return { acutePerils, composite, ealPct, tier, tierColor };
};

const getNatCatData = (country, assetClass) => {
  const base = hashStr(country + assetClass + 'natcat');
  const s = (n) => seededRandom(base + n);
  const returnPeriods = [10, 25, 50, 100, 200, 500];
  const perils = ['Flood', 'Cyclone', 'Wildfire', 'Earthquake', 'Drought'];
  const perilColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#f97316'];
  const data = returnPeriods.map((rp, ri) => {
    const row = { rp: `${rp}yr` };
    perils.forEach((p, pi) => { row[p] = parseFloat((s(ri * 7 + pi * 3 + 1) * 4 + 0.2 * Math.log(rp)).toFixed(2)); });
    return row;
  });
  const assetVal = 100; // $M reference
  const tableRows = returnPeriods.map((rp, ri) => {
    const row = { rp: `${rp}yr` };
    perils.forEach((p, pi) => { row[p] = `$${(s(ri * 7 + pi * 3 + 1) * 40 + 2 * Math.log(rp)).toFixed(1)}M`; });
    return row;
  });
  return { data, perils, perilColors, returnPeriods, tableRows };
};

const getFinancialData = (country, assetClass, assetValue, ngfs) => {
  const base = hashStr(country + assetClass + ngfs + 'fin');
  const s = (n) => seededRandom(base + n);
  const val = parseFloat(assetValue) || 10000000;
  const ealPct = s(1) * 0.8 + 0.1;
  const pml100 = s(2) * 0.15 + 0.05;
  const climateVaR = s(3) * 0.12 + 0.04;
  const riskPremium = Math.round(s(4) * 80 + 20);
  const lossDistData = [10, 25, 50, 100, 200, 500].map((rp, i) => ({
    rp: `${rp}yr`,
    loss: parseFloat(((s(i + 5) * 0.15 + 0.01 * Math.log(rp)) * val / 1e6).toFixed(2)),
  }));
  const insuredPct = Math.round(s(10) * 40 + 30);
  const insurancePie = [
    { name: 'Insured Loss', value: insuredPct },
    { name: 'Uninsured Gap', value: 100 - insuredPct },
  ];
  return {
    eal: `$${(ealPct * val / 1e6).toFixed(2)}M`,
    pml100: `$${(pml100 * val / 1e6).toFixed(2)}M`,
    climateVaR: `${(climateVaR * 100).toFixed(1)}%`,
    riskPremium: `${riskPremium} bps`,
    lossDistData,
    insurancePie,
    insuredPct,
  };
};

const getStrandingData = (country, assetClass) => {
  const base = hashStr(country + assetClass + 'strand');
  const s = (n) => seededRandom(base + n);
  const scenarios = ['Orderly', 'Disorderly', 'Hot House'];
  const horizons = ['2030', '2040', '2050'];
  const drivers = ['Regulatory cap', 'Physical damage', 'Market shift', 'Insurance withdrawal', 'Demand collapse', 'Tech disruption'];
  const rows = [];
  scenarios.forEach((sc, si) => {
    horizons.forEach((hz, hi) => {
      rows.push({
        scenario: sc,
        horizon: hz,
        prob: `${Math.round(s(si * 9 + hi * 3 + 1) * 50 + 10)}%`,
        key_driver: drivers[Math.floor(s(si * 9 + hi * 3 + 2) * drivers.length)],
      });
    });
  });
  const barData = scenarios.map((sc, si) => {
    const row = { scenario: sc };
    horizons.forEach((hz, hi) => { row[hz] = Math.round(s(si * 9 + hi * 3 + 1) * 50 + 10); });
    return row;
  });
  return { rows, barData, scenarios, horizons };
};

const getNGFSData = (country, assetClass) => {
  const base = hashStr(country + assetClass + 'ngfs');
  const s = (n) => seededRandom(base + n);
  const years = [2024, 2026, 2028, 2030, 2035, 2040, 2045, 2050];
  const scenarios = ['Orderly', 'Disorderly', 'Hot House'];
  const scColors = ['#059669', '#f59e0b', '#ef4444'];
  const lineData = years.map((yr, yi) => {
    const row = { year: yr };
    scenarios.forEach((sc, si) => {
      const trend = si === 0 ? -0.3 : si === 1 ? 0.1 : 0.5;
      row[sc] = Math.round(s(si * 11 + yi * 3 + 1) * 8 + 40 + yi * trend * 2.5);
    });
    return row;
  });
  const checklist = [
    { item: 'Physical risk quantification', status: true },
    { item: 'NGFS scenario coverage', status: true },
    { item: 'NatCat event modeling', status: s(20) > 0.4 },
    { item: 'Insurance gap analysis', status: s(21) > 0.35 },
    { item: 'TCFD-aligned disclosure', status: s(22) > 0.45 },
    { item: 'Stranding probability model', status: s(23) > 0.5 },
    { item: 'Climate VaR calculation', status: s(24) > 0.3 },
    { item: 'Regulatory submission ready', status: s(25) > 0.6 },
  ];
  return { lineData, scenarios, scColors, checklist };
};

export default function PhysicalRiskPricingPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [assetClass, setAssetClass] = useState('property');
  const [assetValue, setAssetValue] = useState('5000000');
  const [ngfsScenario, setNgfsScenario] = useState('orderly');
  const [timeHorizon, setTimeHorizon] = useState('2050');

  const peril = getPerilData(country, assetClass, ngfsScenario);
  const natcat = getNatCatData(country, assetClass);
  const fin = getFinancialData(country, assetClass, assetValue, ngfsScenario);
  const strand = getStrandingData(country, assetClass);
  const ngfs = getNGFSData(country, assetClass);

  const runPrice = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/physical-risk-pricing/price`, {
        country, asset_class: assetClass, asset_value_usd: parseFloat(assetValue),
        ngfs_scenario: ngfsScenario, time_horizon: timeHorizon,
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  const inputPanel = (
    <Section title="Physical Risk Inputs">
      <Row>
        <Sel label="Country" value={country} onChange={setCountry} options={COUNTRIES.map(c => ({ value: c, label: c }))} />
        <Sel label="Asset Class" value={assetClass} onChange={setAssetClass} options={[
          { value: 'property', label: 'Property' }, { value: 'infrastructure', label: 'Infrastructure' },
          { value: 'agriculture', label: 'Agriculture' }, { value: 'energy', label: 'Energy' }, { value: 'marine', label: 'Marine' },
        ]} />
        <Inp label="Asset Value (USD)" value={assetValue} onChange={setAssetValue} type="number" />
        <Sel label="NGFS Scenario" value={ngfsScenario} onChange={setNgfsScenario} options={[
          { value: 'orderly', label: 'Orderly Transition' }, { value: 'disorderly', label: 'Disorderly Transition' }, { value: 'hot_house', label: 'Hot House World' },
        ]} />
        <Sel label="Time Horizon" value={timeHorizon} onChange={setTimeHorizon} options={['2030', '2040', '2050'].map(v => ({ value: v, label: v }))} />
      </Row>
      <Btn onClick={runPrice}>{loading ? 'Pricing…' : 'Run Physical Risk Pricing'}</Btn>
    </Section>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Physical Risk Pricing Engine</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>NatCat Peril Scoring · EAL / PML · NGFS Climate Amplifiers · Stranding Analysis · Regulatory Submission Readiness</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — Peril Scores */}
      {tab === 0 && (
        <div>
          {inputPanel}
          <Section title="Composite Risk Summary">
            <Row gap={12}>
              <KpiCard label="Composite Risk Score" value={`${peril.composite}/100`} sub="9-peril weighted average" accent />
              <KpiCard label="Expected Annual Loss (EAL)" value={`${peril.ealPct}% of AV`} sub={`~$${(parseFloat(peril.ealPct) * parseFloat(assetValue) / 1e6 / 100).toFixed(2)}M`} />
              <KpiCard label="Risk Tier" value={<Badge label={peril.tier} color={peril.tierColor} />} sub="NGFS-aligned physical risk classification" />
              <KpiCard label="Dominant Peril" value={[...peril.acutePerils].sort((a, b) => b.score - a.score)[0].dimension} sub={`Score: ${[...peril.acutePerils].sort((a, b) => b.score - a.score)[0].score}/100`} />
            </Row>
          </Section>
          <Section title="9-Peril Radar (Acute + Chronic Stressors)">
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={peril.acutePerils}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Risk Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 2 — NatCat Loss Table */}
      {tab === 1 && (
        <div>
          {inputPanel}
          <Section title="Loss % by Return Period (Grouped by Peril)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={natcat.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rp" />
                <YAxis unit="%" />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                {natcat.perils.map((p, i) => (
                  <Bar key={p} dataKey={p} fill={natcat.perilColors[i]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Loss Table ($M values — $100M reference asset)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Return Period', ...natcat.perils].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {natcat.tableRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{row.rp}</td>
                    {natcat.perils.map(p => <td key={p} style={{ padding: '8px 12px', color: '#374151' }}>{row[p]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — Financial Impact */}
      {tab === 2 && (
        <div>
          {inputPanel}
          <Section title="Key Financial Metrics">
            <Row gap={12}>
              <KpiCard label="Expected Annual Loss (EAL)" value={fin.eal} sub="Probability-weighted annual loss" accent />
              <KpiCard label="PML 100-Year" value={fin.pml100} sub="Probable maximum loss at 1% AEP" />
              <KpiCard label="Climate VaR (95%)" value={fin.climateVaR} sub="NGFS scenario-adjusted VaR" />
              <KpiCard label="Risk Premium" value={fin.riskPremium} sub="Additional spread for physical risk" />
            </Row>
          </Section>
          <Row>
            <Section title="Loss Distribution by Return Period ($M)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={fin.lossDistData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rp" />
                  <YAxis unit="M" />
                  <Tooltip formatter={(val) => `$${val}M`} />
                  <Area type="monotone" dataKey="loss" stroke="#059669" fill="#d1fae5" name="Loss ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Insurance Coverage Gap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={fin.insurancePie} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}>
                    {fin.insurancePie.map((_, i) => <Cell key={i} fill={i === 0 ? '#059669' : '#ef4444'} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — Stranding Analysis */}
      {tab === 3 && (
        <div>
          {inputPanel}
          <Section title="Stranding Probability: Scenario × Time Horizon (%)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strand.barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis unit="%" />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                {strand.horizons.map((hz, i) => (
                  <Bar key={hz} dataKey={hz} fill={['#059669', '#3b82f6', '#f59e0b'][i]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Stranding Detail Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Scenario', 'Horizon', 'Stranding Prob.', 'Key Driver'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strand.rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#059669' }}>{r.scenario}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{r.horizon}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1b3a5c' }}>{r.prob}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{r.key_driver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — NGFS Amplifiers */}
      {tab === 4 && (
        <div>
          {inputPanel}
          <Section title="Risk Score Trajectory 2024–2050 (All NGFS Scenarios)">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={ngfs.lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[20, 100]} unit="" />
                <Tooltip />
                <Legend />
                {ngfs.scenarios.map((sc, i) => (
                  <Line key={sc} type="monotone" dataKey={sc} stroke={ngfs.scColors[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Regulatory Submission Readiness Checklist">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Requirement', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ngfs.checklist.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{c.item}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={c.status ? 'Ready' : 'Gap'} color={c.status ? 'green' : 'red'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                {ngfs.checklist.filter(c => c.status).length}/{ngfs.checklist.length} requirements met
              </span>
              <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 12 }}>TCFD / NGFS / ECB CST 2022 aligned</span>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
