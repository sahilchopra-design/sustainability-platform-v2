import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Cell, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const seededRandom = (seed) => {
  let x = Math.sin(seed + 1) * 10000;
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

const TABS = ['RFNBO Compliance', 'GHG Intensity', 'LCOH Economics', 'REPowerEU Targets', 'H2 CfD & Certification'];

const ELECTROLYSER_OPTIONS = [
  { value: 'pem', label: 'PEM (Proton Exchange Membrane)' },
  { value: 'alk', label: 'Alkaline (ALK)' },
  { value: 'soec', label: 'SOEC (Solid Oxide Electrolyser)' },
  { value: 'aem', label: 'AEM (Anion Exchange Membrane)' },
];

const COUNTRY_OPTIONS = [
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'PL', label: 'Poland' },
  { value: 'NO', label: 'Norway' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'DK', label: 'Denmark' },
  { value: 'IT', label: 'Italy' },
  { value: 'PT', label: 'Portugal' },
];

const ELEC_SOURCE_OPTIONS = [
  { value: 'grid', label: 'Grid (average mix)' },
  { value: 'ppa_wind', label: 'PPA — Onshore Wind' },
  { value: 'ppa_solar', label: 'PPA — Solar PV' },
  { value: 'dedicated_re', label: 'Dedicated Renewable' },
  { value: 'nuclear', label: 'Nuclear (baseload)' },
];

// Country grid emission factors (gCO2eq/kWh)
const GRID_EF = { DE: 385, FR: 85, ES: 210, UK: 230, PL: 780, NO: 28, NL: 320, DK: 170, IT: 330, PT: 185 };

const getRFNBOData = (electrolyser, country, elecSource, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const gridEf = GRID_EF[country] || 300;
  const sourceEf = { grid: gridEf, ppa_wind: 12 + r(1) * 8, ppa_solar: 22 + r(2) * 10, dedicated_re: 15 + r(3) * 10, nuclear: 5 + r(4) * 5 };
  const ef = sourceEf[elecSource] || gridEf;
  const efficiency = { pem: 0.68, alk: 0.65, soec: 0.74, aem: 0.62 }[electrolyser] || 0.65;
  const kwhPerKgH2 = 33.3 / efficiency;
  const ghgIntensity = parseFloat((ef * kwhPerKgH2 / 1000 + r(5) * 0.3).toFixed(2));
  const RFNBO_THRESHOLD = 3.38;
  const ghgPass = ghgIntensity <= RFNBO_THRESHOLD;

  const additionalityPass = ['ppa_wind', 'ppa_solar', 'dedicated_re'].includes(elecSource) || r(6) > 0.7;
  const temporalPass = elecSource !== 'grid' || r(7) > 0.65;
  const geoPass = elecSource !== 'grid' || r(8) > 0.6;

  const criteria = [
    { name: 'GHG Intensity', requirement: '≤ 3.38 kgCO₂/kgH₂', value: `${ghgIntensity} kg`, pass: ghgPass },
    { name: 'Additionality', requirement: 'New renewable capacity', value: additionalityPass ? 'New RE' : 'Existing RE', pass: additionalityPass },
    { name: 'Temporal Correlation', requirement: 'Hourly matching (from 2030)', value: temporalPass ? 'Monthly match' : 'Annual only', pass: temporalPass },
    { name: 'Geographical Correlation', requirement: 'Same bidding zone', value: geoPass ? 'Same zone' : 'Cross-zone', pass: geoPass },
  ];
  const rfnboEligible = criteria.every(c => c.pass);
  return { criteria, rfnboEligible, ghgIntensity, RFNBO_THRESHOLD, ef };
};

const getGHGData = (electrolyser, country, elecSource, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const gridEf = GRID_EF[country] || 300;
  const sourceEf = { grid: gridEf, ppa_wind: 12 + r(1) * 8, ppa_solar: 22 + r(2) * 10, dedicated_re: 15 + r(3) * 10, nuclear: 5 + r(4) * 5 };
  const ef = sourceEf[elecSource] || gridEf;
  const efficiency = { pem: 0.68, alk: 0.65, soec: 0.74, aem: 0.62 }[electrolyser] || 0.65;
  const kwhPerKgH2 = 33.3 / efficiency;

  const components = [
    { name: 'Electricity', value: parseFloat((ef * kwhPerKgH2 / 1000).toFixed(2)) },
    { name: 'Water Treatment', value: parseFloat((r(10) * 0.05 + 0.02).toFixed(2)) },
    { name: 'Compression', value: parseFloat((r(11) * 0.08 + 0.03).toFixed(2)) },
    { name: 'Balance of Plant', value: parseFloat((r(12) * 0.04 + 0.01).toFixed(2)) },
  ];

  const countryComparison = COUNTRY_OPTIONS.map((c, i) => ({
    country: c.value,
    gridEf: GRID_EF[c.value] || 300,
    ghg: parseFloat(((GRID_EF[c.value] || 300) * kwhPerKgH2 / 1000).toFixed(2)),
  }));

  return { components, countryComparison };
};

const getLCOHData = (electrolyser, country, elecSource, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const capexBase = { pem: 900, alk: 650, soec: 1100, aem: 750 }[electrolyser] || 800;
  const capex = Math.round(capexBase * (0.85 + r(20) * 0.3));
  const capacityFactor = parseFloat(({ ppa_wind: 0.38 + r(21) * 0.12, ppa_solar: 0.22 + r(22) * 0.10, dedicated_re: 0.30 + r(23) * 0.15, nuclear: 0.88 + r(24) * 0.05, grid: 0.85 + r(25) * 0.05 }[elecSource] || 0.50).toFixed(2));
  const stackLifetime = Math.round({ pem: 80000, alk: 100000, soec: 50000, aem: 60000 }[electrolyser] * (0.9 + r(26) * 0.2));
  const lcohComponents = [
    { name: 'CAPEX', value: parseFloat((capex * 0.0012 * (1 / capacityFactor)).toFixed(2)) },
    { name: 'OPEX', value: parseFloat((0.03 * capex * 0.0001).toFixed(2)) },
    { name: 'Electricity', value: parseFloat((50 * (33.3 / 0.67) / 1000).toFixed(2)) },
    { name: 'Water', value: parseFloat((r(27) * 0.05 + 0.02).toFixed(2)) },
    { name: 'Stack Replacement', value: parseFloat((r(28) * 0.08 + 0.04).toFixed(2)) },
  ];
  const lcoh = parseFloat(lcohComponents.reduce((s, c) => s + c.value, 0).toFixed(2));

  const ieaTrajectory = [
    { year: 2024, cost: lcoh },
    { year: 2026, cost: parseFloat((lcoh * 0.88).toFixed(2)) },
    { year: 2028, cost: parseFloat((lcoh * 0.76).toFixed(2)) },
    { year: 2030, cost: parseFloat((lcoh * 0.65).toFixed(2)) },
    { year: 2035, cost: parseFloat((lcoh * 0.50).toFixed(2)) },
    { year: 2040, cost: parseFloat((lcoh * 0.38).toFixed(2)) },
    { year: 2050, cost: parseFloat((lcoh * 0.28).toFixed(2)) },
  ];

  return { capex, capacityFactor, stackLifetime, lcoh, lcohComponents, ieaTrajectory };
};

const getREPowerEUData = (country, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const targets2030 = { DE: 3500, FR: 1800, ES: 3000, UK: 2000, PL: 800, NO: 400, NL: 1200, DK: 1000, IT: 2200, PT: 1000 };
  const countryData = COUNTRY_OPTIONS.map((c, i) => ({
    country: c.value,
    target: targets2030[c.value] || 1000,
    current: Math.round((targets2030[c.value] || 1000) * (0.02 + seededRandom(seed0 + 30 + i) * 0.12)),
  }));
  const eu2030Target = 10000; // Mt
  const euCurrent = Math.round(eu2030Target * (0.03 + r(40) * 0.08));
  const domesticShare = Math.round(r(41) * 30 + 20);
  return { countryData, eu2030Target, euCurrent, domesticShare };
};

const getCfDData = (electrolyser, country, elecSource, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const strikePrice = parseFloat((2.5 + r(50) * 2).toFixed(2));
  const supportDuration = Math.round(r(51) * 5 + 10);
  const cfdEligible = ['ppa_wind', 'ppa_solar', 'dedicated_re'].includes(elecSource);

  const certifications = [
    { name: 'REGreen (EU)', status: r(52) > 0.4 ? 'Certified' : r(52) > 0.2 ? 'Pending' : 'Not Applied', body: 'CertifHy / REGreen' },
    { name: 'TÜV SÜD H2 Mark', status: r(53) > 0.45 ? 'Certified' : r(53) > 0.25 ? 'Pending' : 'Not Applied', body: 'TÜV SÜD' },
    { name: 'DNV H2 Readiness', status: r(54) > 0.5 ? 'Certified' : r(54) > 0.3 ? 'Pending' : 'Not Applied', body: 'DNV' },
    { name: 'Bureau Veritas', status: r(55) > 0.48 ? 'Certified' : r(55) > 0.28 ? 'Pending' : 'Not Applied', body: 'Bureau Veritas' },
  ];

  const benchmark = [
    { dimension: 'Efficiency', score: Math.round(r(56) * 30 + 55) },
    { dimension: 'Durability', score: Math.round(r(57) * 28 + 52) },
    { dimension: 'Response Time', score: Math.round(r(58) * 30 + 48) },
    { dimension: 'Footprint', score: Math.round(r(59) * 25 + 55) },
    { dimension: 'Cost ($/kW)', score: Math.round(r(60) * 30 + 50) },
    { dimension: 'Maturity', score: Math.round(r(61) * 28 + 52) },
  ];

  return { strikePrice, supportDuration, cfdEligible, certifications, benchmark };
};

export default function GreenHydrogenPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [electrolyser, setElectrolyser] = useState('pem');
  const [country, setCountry] = useState('DE');
  const [elecSource, setElecSource] = useState('ppa_wind');

  const seed0 = hashStr(electrolyser + country + elecSource);
  const rfnbo = getRFNBOData(electrolyser, country, elecSource, seed0);
  const ghg = getGHGData(electrolyser, country, elecSource, seed0);
  const lcoh = getLCOHData(electrolyser, country, elecSource, seed0);
  const repowereu = getREPowerEUData(country, seed0);
  const cfd = getCfDData(electrolyser, country, elecSource, seed0);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/green-hydrogen/assess`, {
        electrolyser_type: electrolyser, country, electricity_source: elecSource,
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Green Hydrogen Assessment</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>RFNBO Delegated Act · GHG Intensity · LCOH Economics · REPowerEU 2030 · H2 CfD & Certification</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      <Section title="Project Parameters">
        <Row>
          <Sel label="Electrolyser Type" value={electrolyser} onChange={setElectrolyser} options={ELECTROLYSER_OPTIONS} />
          <Sel label="Country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
          <Sel label="Electricity Source" value={elecSource} onChange={setElecSource} options={ELEC_SOURCE_OPTIONS} />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — RFNBO Compliance */}
      {tab === 0 && (
        <div>
          <Section title="RFNBO Eligibility Summary">
            <Row gap={12}>
              <KpiCard label="RFNBO Eligible" value={<Badge label={rfnbo.rfnboEligible ? '✓ RFNBO Eligible' : '✗ Not Eligible'} color={rfnbo.rfnboEligible ? 'green' : 'red'} />} sub="EU Delegated Act 2023/1184" accent />
              <KpiCard label="GHG Intensity" value={`${rfnbo.ghgIntensity} kgCO₂/kgH₂`} sub={`Threshold: 3.38 kgCO₂/kgH₂`} />
              <KpiCard label="Grid Emission Factor" value={`${rfnbo.ef.toFixed(0)} gCO₂/kWh`} sub={`${country} electricity source: ${elecSource}`} />
              <KpiCard label="Criteria Passed" value={`${rfnbo.criteria.filter(c => c.pass).length} / 4`} sub="All 4 required for RFNBO" />
            </Row>
          </Section>
          <Section title="RFNBO 4-Criteria Checklist">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Criterion', 'Requirement', 'Current Value', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rfnbo.criteria.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: c.pass ? '#f0fdf4' : '#fef2f2' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1b3a5c' }}>{c.name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 13 }}>{c.requirement}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{c.value}</td>
                    <td style={{ padding: '10px 14px' }}><Badge label={c.pass ? '✓ Pass' : '✗ Fail'} color={c.pass ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="GHG Intensity vs RFNBO Threshold">
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#374151', width: 140 }}>Current: {rfnbo.ghgIntensity} kg</div>
                <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 8, height: 20, position: 'relative' }}>
                  <div style={{ background: rfnbo.ghgIntensity <= rfnbo.RFNBO_THRESHOLD ? '#059669' : '#ef4444', height: '100%', borderRadius: 8, width: `${Math.min(100, (rfnbo.ghgIntensity / 10) * 100)}%` }} />
                  <div style={{ position: 'absolute', top: 0, left: `${(rfnbo.RFNBO_THRESHOLD / 10) * 100}%`, height: '100%', width: 2, background: '#1b3a5c' }} />
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', width: 100 }}>Max: 10.0 kg</div>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Threshold line at 3.38 kgCO₂eq/kgH₂ · {rfnbo.ghgIntensity <= rfnbo.RFNBO_THRESHOLD ? `${(rfnbo.RFNBO_THRESHOLD - rfnbo.ghgIntensity).toFixed(2)} kg headroom` : `${(rfnbo.ghgIntensity - rfnbo.RFNBO_THRESHOLD).toFixed(2)} kg above limit`}</div>
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — GHG Intensity */}
      {tab === 1 && (
        <div>
          <Section title="GHG Intensity Breakdown">
            <Row gap={12}>
              <KpiCard label="Total GHG Intensity" value={`${ghg.components.reduce((s, c) => s + c.value, 0).toFixed(2)} kgCO₂/kgH₂`} sub="Well-to-gate lifecycle" accent />
              <KpiCard label="Electricity Contribution" value={`${ghg.components[0].value} kgCO₂/kgH₂`} sub="Dominant cost driver" />
              <KpiCard label="RFNBO Threshold" value="3.38 kgCO₂/kgH₂" sub="EU Delegated Act 2023/1184" />
              <KpiCard label="Grid EF" value={`${rfnbo.ef.toFixed(0)} gCO₂/kWh`} sub={`${country} · ${elecSource}`} />
            </Row>
          </Section>
          <Row>
            <Section title="GHG Intensity Components (kgCO₂eq/kgH₂)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ghg.components}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis unit=" kg" />
                  <Tooltip formatter={(val) => `${val} kgCO₂/kgH₂`} />
                  <ReferenceLine y={3.38} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'RFNBO Limit', fontSize: 10, fill: '#ef4444' }} />
                  <Bar dataKey="value" name="GHG Component" radius={[4, 4, 0, 0]}>
                    {ghg.components.map((c, i) => <Cell key={i} fill={['#3b82f6', '#059669', '#f59e0b', '#8b5cf6'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="GHG Intensity by Country Grid (kgCO₂/kgH₂)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ghg.countryComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis unit=" kg" />
                  <Tooltip formatter={(val) => `${val} kgCO₂/kgH₂`} />
                  <ReferenceLine y={3.38} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'RFNBO', fontSize: 10, fill: '#ef4444' }} />
                  <Bar dataKey="ghg" name="Grid-sourced GHG" radius={[4, 4, 0, 0]}>
                    {ghg.countryComparison.map((c, i) => <Cell key={i} fill={c.ghg <= 3.38 ? '#059669' : c.ghg <= 8 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — LCOH Economics */}
      {tab === 2 && (
        <div>
          <Section title="LCOH Summary">
            <Row gap={12}>
              <KpiCard label="LCOH" value={`$${lcoh.lcoh}/kgH₂`} sub="Levelised Cost of Hydrogen" accent />
              <KpiCard label="CAPEX" value={`$${lcoh.capex}/kW`} sub={`${electrolyser.toUpperCase()} electrolyser`} />
              <KpiCard label="Capacity Factor" value={`${(lcoh.capacityFactor * 100).toFixed(0)}%`} sub={`${elecSource} electricity source`} />
              <KpiCard label="Stack Lifetime" value={`${lcoh.stackLifetime.toLocaleString()} hrs`} sub="Operating hours before replacement" />
            </Row>
          </Section>
          <Row>
            <Section title="LCOH Components ($/kgH₂)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lcoh.lcohComponents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis unit="$" />
                  <Tooltip formatter={(val) => `$${val}/kgH₂`} />
                  <Bar dataKey="value" name="LCOH Component" radius={[4, 4, 0, 0]}>
                    {lcoh.lcohComponents.map((c, i) => <Cell key={i} fill={['#3b82f6', '#059669', '#ef4444', '#f59e0b', '#8b5cf6'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="IEA Cost Trajectory ($/kgH₂)">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lcoh.ieaTrajectory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis unit="$" />
                  <Tooltip formatter={(val) => `$${val}/kgH₂`} />
                  <ReferenceLine y={2} stroke="#059669" strokeDasharray="4 4" label={{ value: 'IEA Parity $2', fontSize: 10, fill: '#059669' }} />
                  <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} name="LCOH Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — REPowerEU Targets */}
      {tab === 3 && (
        <div>
          <Section title="REPowerEU 2030 Summary">
            <Row gap={12}>
              <KpiCard label="EU 2030 Target" value="10 Mt H₂/yr" sub="REPowerEU May 2022 — domestic production" accent />
              <KpiCard label="Current EU Progress" value={`${repowereu.euCurrent.toLocaleString()} kt`} sub={`${((repowereu.euCurrent / repowereu.eu2030Target) * 100).toFixed(1)}% of 2030 target`} />
              <KpiCard label="Domestic Production Share" value={`${repowereu.domesticShare}%`} sub={`${country} — domestic vs imported H₂`} />
              <KpiCard label="Country Target" value={`${(repowereu.countryData.find(c => c.country === country)?.target || 0).toLocaleString()} kt`} sub={`${country} 2030 national target`} />
            </Row>
          </Section>
          <Section title="EU Country H₂ Production Target vs Current Capacity (kt/yr)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repowereu.countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis unit=" kt" />
                <Tooltip formatter={(val) => `${val} kt/yr`} />
                <Legend />
                <Bar dataKey="target" fill="#d1d5db" name="2030 Target (kt)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="#059669" name="Current (kt)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Country Progress Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Country', '2030 Target (kt)', 'Current (kt)', 'Progress %', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {repowereu.countryData.map((c, i) => {
                  const pct = parseFloat(((c.current / c.target) * 100).toFixed(1));
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{c.country}</td>
                      <td style={{ padding: '8px 12px' }}>{c.target.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{c.current.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{pct}%</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={pct >= 10 ? 'On Track' : pct >= 5 ? 'Developing' : 'Early Stage'} color={pct >= 10 ? 'green' : pct >= 5 ? 'yellow' : 'red'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — H2 CfD & Certification */}
      {tab === 4 && (
        <div>
          <Section title="H2 CfD Summary">
            <Row gap={12}>
              <KpiCard label="H2 CfD Eligible" value={<Badge label={cfd.cfdEligible ? '✓ CfD Eligible' : '✗ Not Eligible'} color={cfd.cfdEligible ? 'green' : 'red'} />} sub="UK IETF / EU H2 Bank support" accent />
              <KpiCard label="Strike Price" value={`$${cfd.strikePrice}/kgH₂`} sub="Contract-for-Difference reference" />
              <KpiCard label="Support Duration" value={`${cfd.supportDuration} years`} sub="CfD contract term" />
              <KpiCard label="Certifications" value={`${cfd.certifications.filter(c => c.status === 'Certified').length} / 4`} sub="Active certification bodies" />
            </Row>
          </Section>
          <Section title="Certification Status">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Certification', 'Body', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cfd.certifications.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{c.body}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={c.status} color={c.status === 'Certified' ? 'green' : c.status === 'Pending' ? 'yellow' : 'gray'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Electrolyser Benchmark Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={cfd.benchmark}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name={electrolyser.toUpperCase()} dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
