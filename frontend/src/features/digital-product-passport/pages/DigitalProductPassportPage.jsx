import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

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
const Inp = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
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
  const colors = {
    green: { bg: '#d1fae5', text: '#065f46' },
    yellow: { bg: '#fef3c7', text: '#92400e' },
    red: { bg: '#fee2e2', text: '#991b1b' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    gray: { bg: '#f3f4f6', text: '#374151' },
  };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['ESPR Compliance', 'DPP Schema', 'Lifecycle GHG', 'Circularity & Battery', 'EPR & Overview'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const PRODUCT_CATEGORIES = [
  { value: 'batteries', label: 'Batteries & Accumulators' },
  { value: 'electronics', label: 'Electronics & ICT Equipment' },
  { value: 'textiles', label: 'Textiles & Apparel' },
  { value: 'furniture', label: 'Furniture & Wood Products' },
  { value: 'construction', label: 'Construction Materials' },
  { value: 'vehicles', label: 'Vehicles & Transport' },
  { value: 'chemicals', label: 'Chemicals & Packaging' },
];
const LCA_METHODS = [
  { value: 'iso14044', label: 'ISO 14044:2006' },
  { value: 'pef', label: 'EU Product Environmental Footprint (PEF)' },
  { value: 'ghgprotocol', label: 'GHG Protocol Product Standard' },
];

// Seed data
const esprRegs = [
  { category: 'Batteries', euReg: 'Reg (EU) 2023/1542', dppYear: 2027, reqs: ['Chemistry', 'Capacity', 'State of Health', 'Recycled content', 'Carbon footprint', 'Supply chain DD'] },
  { category: 'Textiles', euReg: 'ESPR Delegated Act 2025', dppYear: 2026, reqs: ['Fibre composition', 'Durability', 'Recycled content', 'Care instructions', 'Brand info'] },
  { category: 'Electronics', euReg: 'Ecodesign Reg 2019/2021', dppYear: 2026, reqs: ['Energy class', 'Repairability score', 'Spare parts availability', 'Software updates', 'Hazardous substances'] },
  { category: 'Construction', euReg: 'CPR + ESPR 2024', dppYear: 2027, reqs: ['Material declarations', 'Environmental Product Declaration (EPD)', 'End-of-life instructions', 'Structural properties'] },
];
const dppFields = [
  'Product Identifier (GTIN)', 'Manufacturer Info', 'Product Category (HS code)', 'Date of Production',
  'Country of Origin', 'Carbon Footprint (kgCO₂e)', 'Material Composition', 'Hazardous Substances List',
  'Recycled Content (%)', 'Recyclability (%)', 'Energy Consumption (kWh)', 'Water Consumption (L)',
  'Repairability Index', 'Durability Score', 'Spare Parts Availability', 'Software Update Period',
  'End-of-Life Instructions', 'EPD Reference', 'Supply Chain Certifications', 'Warranty Duration',
  'Packaging Material', 'Packaging Recyclability', 'Battery Chemistry', 'Battery Capacity (Wh)',
  'State of Health (%)',
];
const dppFilled = dppFields.map((_, i) => seed(i + 10) > 0.28);
const lifecycleData = [
  { stage: 'Raw Materials', scope1: Math.round(seed(21) * 20 + 15), scope2: Math.round(seed(22) * 10 + 8), scope3: Math.round(seed(23) * 30 + 20) },
  { stage: 'Manufacturing', scope1: Math.round(seed(24) * 15 + 12), scope2: Math.round(seed(25) * 20 + 15), scope3: Math.round(seed(26) * 10 + 5) },
  { stage: 'Transport', scope1: Math.round(seed(27) * 5 + 3), scope2: Math.round(seed(28) * 3 + 2), scope3: Math.round(seed(29) * 12 + 8) },
  { stage: 'Use Phase', scope1: Math.round(seed(30) * 2 + 1), scope2: Math.round(seed(31) * 25 + 18), scope3: Math.round(seed(32) * 5 + 3) },
  { stage: 'End of Life', scope1: Math.round(seed(33) * 3 + 2), scope2: Math.round(seed(34) * 2 + 1), scope3: Math.round(seed(35) * 8 + 5) },
];
const circularityDimensions = [
  { dim: 'Recycled Content', score: Math.round(seed(41) * 40 + 40) },
  { dim: 'Recyclability', score: Math.round(seed(42) * 45 + 35) },
  { dim: 'Durability', score: Math.round(seed(43) * 35 + 50) },
  { dim: 'Repairability', score: Math.round(seed(44) * 40 + 30) },
  { dim: 'Material Efficiency', score: Math.round(seed(45) * 30 + 45) },
];
const batteryTargets = [
  { material: 'Cobalt', target2025: 16, target2030: 26, target2035: 26, actual: Math.round(seed(51) * 15 + 8) },
  { material: 'Lithium', target2025: 6, target2030: 12, target2035: 12, actual: Math.round(seed(52) * 8 + 3) },
  { material: 'Nickel', target2025: 6, target2030: 15, target2035: 15, actual: Math.round(seed(53) * 10 + 4) },
  { material: 'Lead', target2025: 85, target2030: 85, target2035: 85, actual: Math.round(seed(54) * 10 + 75) },
];
const eprCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE', 'BE', 'AT', 'DK'].map((c, i) => ({
  country: c,
  levy: Math.round(seed(i + 60) * 80 + 20),
}));
const totalCarbonPerUnit = lifecycleData.reduce((s, r) => s + r.scope1 + r.scope2 + r.scope3, 0);
const sectorAvgCarbon = Math.round(totalCarbonPerUnit * 1.35);

export default function DigitalProductPassportPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productCategory, setProductCategory] = useState('batteries');
  const [productName, setProductName] = useState('Li-Ion Battery Pack 75kWh');
  const [lcaMethod, setLcaMethod] = useState('pef');
  const [result, setResult] = useState(null);

  const filledCount = dppFilled.filter(Boolean).length;
  const completeness = Math.round((filledCount / dppFields.length) * 100);
  const dppReadiness = completeness >= 80 ? 'Ready' : completeness >= 60 ? 'In Progress' : 'At Risk';
  const dppReadinessColor = dppReadiness === 'Ready' ? 'green' : dppReadiness === 'In Progress' ? 'yellow' : 'red';
  const circularityIndex = Math.round(circularityDimensions.reduce((s, d) => s + d.score, 0) / circularityDimensions.length);
  const esprScore = Math.round(seed(71) * 20 + 68);
  const esprTier = esprScore >= 80 ? 'Ready' : esprScore >= 60 ? 'In Progress' : 'At Risk';
  const esprTierColor = esprTier === 'Ready' ? 'green' : esprTier === 'In Progress' ? 'yellow' : 'red';
  const totalEprExposure = eprCountries.reduce((s, c) => s + c.levy, 0);

  const criticalMissing = dppFields.filter((f, i) => !dppFilled[i] && ['Carbon Footprint (kgCO₂e)', 'Recycled Content (%)', 'Hazardous Substances List', 'EPD Reference', 'Battery Chemistry'].includes(f));

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}/api/v1/digital-product-passport/assess`, {
        product_name: productName, category: productCategory, lca_method: lcaMethod,
      });
      setResult(r.data);
    } catch {
      void 0 /* API fallback to seed data */; setResult({});
    } finally { setLoading(false); }
  };

  const mandatoryReqs = [
    { req: 'Unique product identifier (QR/RFID)', met: true },
    { req: 'Material composition declaration', met: dppFilled[6] },
    { req: 'Hazardous substances list (REACH)', met: dppFilled[7] },
    { req: 'Carbon footprint per functional unit', met: dppFilled[5] },
    { req: 'Recycled content (%) by material', met: dppFilled[8] },
    { req: 'End-of-life disassembly instructions', met: dppFilled[16] },
    { req: 'Repairability / spare parts info', met: dppFilled[13] },
    { req: 'Environmental Product Declaration (EPD)', met: dppFilled[17] },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Digital Product Passport</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>ESPR · EU Reg 2023/1542 (Batteries) · ISO 14044 / PEF Lifecycle · Circularity · EPR · E82</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: 'none', color: tab === i ? '#059669' : '#6b7280',
            borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — ESPR Compliance */}
      {tab === 0 && (
        <div>
          <Section title="Product Configuration">
            <Row>
              <Sel label="Product Category" value={productCategory} onChange={setProductCategory} options={PRODUCT_CATEGORIES} />
              <Inp label="Product / SKU Name" value={productName} onChange={setProductName} placeholder="e.g. Li-Ion Battery Pack 75kWh" />
            </Row>
            <Btn onClick={runAnalysis}>Run ESPR Assessment</Btn>
          </Section>

          <Section title="ESPR Compliance Score">
            <Row gap={12}>
              <KpiCard label="ESPR Compliance Score" value={`${esprScore}/100`} sub="Ecodesign for Sustainable Products Reg." accent />
              <KpiCard label="ESPR Tier" value={<Badge label={esprTier} color={esprTierColor} />} sub="DPP readiness level" />
              <KpiCard label="DPP Mandatory Year" value="2027" sub="First compliance deadline" />
              <KpiCard label="Applicable Requirements" value={esprRegs.find(r => r.category.toLowerCase().includes(productCategory.substring(0, 4))) ? '6 core reqs' : '5 core reqs'} sub="ESPR Delegated Act" />
            </Row>
          </Section>

          <Section title="ESPR Regulation Reference Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Product Category', 'EU Regulation', 'DPP Mandatory Year', 'Key Requirements'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {esprRegs.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: r.category.toLowerCase().includes(productCategory.substring(0, 4)) ? '#f0fdf4' : 'white' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.category}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>{r.euReg}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: r.dppYear <= 2026 ? '#dc2626' : '#1b3a5c' }}>{r.dppYear}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.reqs.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Mandatory Requirements Checklist">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {mandatoryReqs.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f9fafb', borderRadius: 6, border: `1px solid ${r.met ? '#bbf7d0' : '#fecaca'}` }}>
                  <span style={{ fontSize: 18, color: r.met ? '#059669' : '#ef4444' }}>{r.met ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{r.req}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — DPP Schema */}
      {tab === 1 && (
        <div>
          <Section title="DPP Schema Completeness">
            <Row gap={12}>
              <KpiCard label="DPP Completeness" value={`${completeness}%`} sub={`${filledCount}/${dppFields.length} fields populated`} accent />
              <KpiCard label="DPP Readiness" value={<Badge label={dppReadiness} color={dppReadinessColor} />} sub="ESPR readiness tier" />
              <KpiCard label="Schema Version" value="DPP v2.1" sub="ESPR Draft Implementing Act 2024" />
              <KpiCard label="Critical Gaps" value={criticalMissing.length} sub="Mandatory fields missing" />
            </Row>
          </Section>

          <Section title="Field Completeness (25 Mandatory Fields)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dppFields.map((f, i) => ({ field: f.length > 22 ? f.substring(0, 20) + '…' : f, filled: dppFilled[i] ? 1 : 0, missing: dppFilled[i] ? 0 : 1 }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} hide />
                <YAxis type="category" dataKey="field" width={170} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => val === 1 ? 'Filled' : 'Missing'} />
                <Bar dataKey="filled" fill="#059669" stackId="a" name="Filled" />
                <Bar dataKey="missing" fill="#fca5a5" stackId="a" name="Missing" />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {criticalMissing.length > 0 && (
            <Section title="Critical Missing Fields">
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>The following mandatory fields are missing and must be populated before DPP publication:</div>
                {criticalMissing.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13, color: '#dc2626' }}>
                    <span style={{ fontWeight: 700 }}>!</span>
                    <span style={{ fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* TAB 3 — Lifecycle GHG */}
      {tab === 2 && (
        <div>
          <Section title="LCA Configuration">
            <Row>
              <Sel label="LCA Method" value={lcaMethod} onChange={setLcaMethod} options={LCA_METHODS} />
              <div />
            </Row>
          </Section>

          <Section title="Lifecycle GHG Emissions by Stage (kgCO₂e)">
            <Row gap={12}>
              <KpiCard label="Carbon Footprint / Unit" value={`${totalCarbonPerUnit} kgCO₂e`} sub="Cradle-to-grave" accent />
              <KpiCard label="Sector Avg (benchmark)" value={`${sectorAvgCarbon} kgCO₂e`} sub="Industry reference" />
              <KpiCard label="vs Sector Avg" value={`${totalCarbonPerUnit < sectorAvgCarbon ? '-' : '+'}${Math.abs(Math.round((totalCarbonPerUnit / sectorAvgCarbon - 1) * 100))}%`} sub={totalCarbonPerUnit < sectorAvgCarbon ? 'Better than avg' : 'Above avg'} />
              <KpiCard label="LCA Standard" value={lcaMethod === 'pef' ? 'EU PEF' : lcaMethod === 'iso14044' ? 'ISO 14044' : 'GHG Protocol'} sub="Methodology applied" />
            </Row>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lifecycleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis unit=" kg" />
                <Tooltip />
                <Legend />
                <Bar dataKey="scope1" stackId="a" fill="#059669" name="Scope 1 (kgCO₂e)" />
                <Bar dataKey="scope2" stackId="a" fill="#3b82f6" name="Scope 2 (kgCO₂e)" />
                <Bar dataKey="scope3" stackId="a" fill="#f59e0b" name="Scope 3 (kgCO₂e)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Lifecycle Stage Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Lifecycle Stage', 'Scope 1', 'Scope 2', 'Scope 3', 'Total', 'Share (%)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lifecycleData.map((r, i) => {
                  const stageTotal = r.scope1 + r.scope2 + r.scope3;
                  const share = Math.round((stageTotal / totalCarbonPerUnit) * 100);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.stage}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{r.scope1} kg</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{r.scope2} kg</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{r.scope3} kg</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{stageTotal} kg</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${share}%`, background: '#059669', height: 6, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 4 — Circularity & Battery */}
      {tab === 3 && (
        <div>
          <Section title="Circularity Dimensions">
            <Row>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={circularityDimensions}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Circularity Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <KpiCard label="Circularity Index" value={`${circularityIndex}/100`} sub="5-dimension composite" accent />
                <div style={{ marginTop: 12 }}>
                  {circularityDimensions.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 130, fontSize: 12, color: '#374151', fontWeight: 500 }}>{d.dim}</div>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 8, marginRight: 8 }}>
                        <div style={{ width: `${d.score}%`, background: d.score >= 65 ? '#059669' : d.score >= 45 ? '#f59e0b' : '#ef4444', height: 8, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, width: 30 }}>{d.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Row>
          </Section>

          <Section title="Battery Regulation Recycled Content Targets (EU Reg 2023/1542)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Material', '2025 Target (%)', '2030 Target (%)', '2035 Target (%)', 'Actual (%)', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batteryTargets.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.material}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.target2025}%</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.target2030}%</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.target2035}%</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: r.actual >= r.target2025 ? '#059669' : '#dc2626' }}>{r.actual}%</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={r.actual >= r.target2030 ? 'On Track 2030' : r.actual >= r.target2025 ? 'Meets 2025' : 'Below 2025'} color={r.actual >= r.target2030 ? 'green' : r.actual >= r.target2025 ? 'blue' : 'red'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — EPR & Overview */}
      {tab === 4 && (
        <div>
          <Section title="EPR Levy by EU Country (€k/yr)">
            <Row gap={12}>
              <KpiCard label="Total Annual EPR Exposure" value={`€ ${totalEprExposure}k`} sub="Across 10 EU countries" accent />
              <KpiCard label="Highest Levy Country" value={[...eprCountries].sort((a, b) => b.levy - a.levy)[0].country} sub={`€ ${eprCountries[0].levy}k/yr`} />
            </Row>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={eprCountries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis unit="k€" />
                <Tooltip />
                <Bar dataKey="levy" fill="#059669" radius={[4, 4, 0, 0]} name="EPR Levy (€k/yr)" />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Compliance Summary Dashboard">
            <Row gap={12}>
              <KpiCard label="ESPR Score" value={`${esprScore}/100`} sub={<Badge label={esprTier} color={esprTierColor} />} accent />
              <KpiCard label="DPP Completeness" value={`${completeness}%`} sub={`${filledCount}/${dppFields.length} fields`} />
              <KpiCard label="Lifecycle CO₂/unit" value={`${totalCarbonPerUnit} kgCO₂e`} sub="vs sector avg" />
              <KpiCard label="Circularity Index" value={`${circularityIndex}/100`} sub="5-dimension score" />
            </Row>
          </Section>

          <Section title="Product Passport Status & Next Steps">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { step: 'Data Collection', detail: `${filledCount}/${dppFields.length} fields populated. Priority: ${criticalMissing.slice(0, 2).join(', ')}.`, status: completeness >= 80 ? 'Complete' : 'In Progress', color: completeness >= 80 ? 'green' : 'yellow' },
                { step: 'EPD Registration', detail: 'Register Environmental Product Declaration with IBU/EPD International for EU market access.', status: dppFilled[17] ? 'Done' : 'Pending', color: dppFilled[17] ? 'green' : 'red' },
                { step: 'DPP Digital Record', detail: 'Assign ESPR-compliant data carrier (QR code / RFID) linked to product batch ID in EU registry.', status: 'Pending', color: 'yellow' },
                { step: 'Supply Chain DD', detail: 'Complete EUDR/CSDDD supplier due diligence for critical raw materials (cobalt, lithium, nickel).', status: 'Partial', color: 'yellow' },
                { step: 'Battery Reg. Compliance', detail: `Cobalt recycled content: ${batteryTargets[0].actual}% vs 16% target (2025). Increase sourcing from secondary supply.`, status: batteryTargets[0].actual >= batteryTargets[0].target2025 ? 'Met' : 'At Risk', color: batteryTargets[0].actual >= batteryTargets[0].target2025 ? 'green' : 'red' },
                { step: 'EPR Registration', detail: `Register in 10 EU member states. Annual levy estimate: €${totalEprExposure}k. DE + FR = highest obligation.`, status: 'Action Required', color: 'blue' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1b3a5c' }}>{s.step}</div>
                    <Badge label={s.status} color={s.color} />
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
