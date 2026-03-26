import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, Cell, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';
const hashStr = (s) => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = (seed) => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, offset = 0) => seededRandom(seed + offset);

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

const TABS = ['NGFS Phase IV Scenarios', 'Sector PD Migration', 'CET1 Stress Results', 'Transmission Channels', 'Regulatory Submission'];

const SCENARIOS = [
  { name: 'Net Zero 2050', temp: '1.5°C', carbonBase: 250 },
  { name: 'Delayed Transition', temp: '1.8°C', carbonBase: 180 },
  { name: 'Divergent Net Zero', temp: '1.6°C', carbonBase: 220 },
  { name: 'Below 2°C', temp: '1.9°C', carbonBase: 150 },
  { name: 'Nationally Determined', temp: '2.5°C', carbonBase: 90 },
  { name: 'Current Policies', temp: '3.0°C', carbonBase: 60 },
  { name: 'Hot House World', temp: '4.0°C', carbonBase: 30 },
];

const NACE_SECTORS = [
  'Agriculture', 'Mining', 'Food & Bev', 'Chemicals', 'Steel/Metals',
  'Electricity', 'Construction', 'Retail', 'Transport', 'Hospitality',
  'IT/Software', 'Finance', 'Real Estate', 'Professional Svcs', 'Admin Svcs',
  'Public Admin', 'Education', 'Healthcare', 'Arts/Entmt', 'Other Svcs',
];

const FRAMEWORKS = [
  { id: 'ECB_2022', label: 'ECB CST 2022', threshold: '8.0%', horizon: '3yr' },
  { id: 'EBA_2023', label: 'EBA 2023', threshold: '8.5%', horizon: '3yr' },
  { id: 'BoE_CBES_2021', label: 'BoE CBES 2021', threshold: '7.0%', horizon: '5yr' },
  { id: 'APRA_2022', label: 'APRA 2022', threshold: '9.0%', horizon: '3yr' },
  { id: 'MAS_2022', label: 'MAS 2022', threshold: '8.5%', horizon: '3yr' },
  { id: 'RBI_2022', label: 'RBI 2022', threshold: '10.5%', horizon: '2yr' },
];

const SUBMISSION_FIELDS = {
  ECB_2022: ['Entity LEI', 'CET1 Baseline', 'Stressed RWA by sector', 'PD migration matrix', 'LGD uplift schedule', 'Scenario narrative', 'Data quality statement'],
  EBA_2023: ['Entity LEI', 'CET1 Baseline', 'Tier 1 Capital', 'Credit risk parameters', 'Market risk shocks', 'Operational risk add-ons', 'Concentration risk memo'],
  BoE_CBES_2021: ['PRA ID', 'Baseline capital ratios', 'Climate scenario selection', 'Physical risk exposures', 'Transition risk exposures', 'Management actions log', 'Board attestation'],
  APRA_2022: ['APRA entity ID', 'ICAAP integration section', 'Climate scenario narrative', 'CET1/Tier1 post-stress', 'Sector concentration', 'Governance attestation'],
  MAS_2022: ['UEN', 'Taxonomy alignment %', 'Green finance KPIs', 'Physical hazard mapping', 'Transition plan summary', 'Data lineage report'],
  RBI_2022: ['CIN/RBI code', 'Baseline CRAR', 'Sector credit book', 'Climate risk classification', 'Stress test methodology note', 'Board approval minute'],
};

function buildData(entity, entityType, jurisdiction, framework) {
  const seed = hashStr(entity + entityType + jurisdiction + framework);
  const baselineCET1 = 12 + sr(seed, 1) * 4;
  const thresholdNum = parseFloat(FRAMEWORKS.find(f => f.id === framework)?.threshold || '8.0');

  const scenarios = SCENARIOS.map((s, i) => {
    const depletion = parseFloat((sr(seed, i * 7 + 3) * 4 + 0.5).toFixed(2));
    const stressed = parseFloat((baselineCET1 - depletion).toFixed(2));
    const pass = stressed >= thresholdNum;
    return { ...s, depletion, stressed, pass, gdpShock: -(sr(seed, i * 11 + 5) * 5 + 0.5).toFixed(1), carbonPrice: Math.round(s.carbonBase + sr(seed, i * 13) * 80) };
  });

  const sectors = NACE_SECTORS.map((name, i) => {
    const pdUplift = parseFloat((sr(seed, i * 17 + 9) * 80 + 5).toFixed(1));
    const color = pdUplift > 50 ? '#ef4444' : pdUplift > 25 ? '#f59e0b' : '#059669';
    return { name, pdUplift, color };
  });

  const worstScenario = [...scenarios].sort((a, b) => b.depletion - a.depletion)[0];
  const stressedCET1 = worstScenario.stressed;
  const depletion = worstScenario.depletion;
  const passes = stressedCET1 >= thresholdNum;

  const channels = [
    { subject: 'Carbon Price', value: Math.round(sr(seed, 101) * 40 + 50), desc: 'ETS price shock → transition cost uplift on credit book' },
    { subject: 'Asset Stranding', value: Math.round(sr(seed, 103) * 35 + 45), desc: 'Fossil/RE stranded asset write-down on balance sheet' },
    { subject: 'Physical Damage', value: Math.round(sr(seed, 107) * 30 + 40), desc: 'NatCat physical risk losses → collateral impairment' },
    { subject: 'Macro/GDP', value: Math.round(sr(seed, 109) * 38 + 42), desc: 'GDP contraction → broad PD uplift across all sectors' },
    { subject: 'Tech Transition', value: Math.round(sr(seed, 113) * 28 + 35), desc: 'Disruption of incumbent models in energy/transport' },
  ];

  const totalEl = channels.reduce((s, c) => s + c.value, 0);
  const channelsWithPct = channels.map(c => ({ ...c, pct: ((c.value / totalEl) * 100).toFixed(1) }));

  const radialCET1 = [{ name: 'Stressed CET1', value: parseFloat(stressedCET1.toFixed(2)), fill: passes ? '#059669' : '#ef4444' }];

  return { scenarios, sectors, baselineCET1: parseFloat(baselineCET1.toFixed(2)), stressedCET1: parseFloat(stressedCET1.toFixed(2)), depletion: parseFloat(depletion.toFixed(2)), thresholdNum, passes, channels: channelsWithPct, radialCET1 };
}

export default function StressTestOrchestratorPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entity, setEntity] = useState('Eurobank AG');
  const [entityType, setEntityType] = useState('bank');
  const [jurisdiction, setJurisdiction] = useState('EU');
  const [framework, setFramework] = useState('ECB_2022');

  const d = buildData(entity, entityType, jurisdiction, framework);
  const fwInfo = FRAMEWORKS.find(f => f.id === framework) || FRAMEWORKS[0];

  const runStress = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/stress-test-orchestrator/run`, { entity_name: entity, entity_type: entityType, jurisdiction, regulatory_framework: framework });
    } catch { setError('API unavailable — demo mode.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Climate Stress Test Orchestrator</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>ECB CST 2022 · EBA 2023 · BoE CBES 2021 · APRA · MAS · RBI — NGFS Phase IV Scenarios · CET1 Depletion · Sector PD Migration</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      <Section title="Inputs">
        <Row>
          <Inp label="Entity Name" value={entity} onChange={setEntity} />
          <Sel label="Entity Type" value={entityType} onChange={setEntityType} options={[{ value: 'bank', label: 'Bank' }, { value: 'insurer', label: 'Insurer' }, { value: 'pension', label: 'Pension Fund' }, { value: 'asset_manager', label: 'Asset Manager' }]} />
          <Sel label="Jurisdiction" value={jurisdiction} onChange={setJurisdiction} options={['EU', 'UK', 'AU', 'SG', 'IN', 'US'].map(v => ({ value: v, label: v }))} />
          <Sel label="Regulatory Framework" value={framework} onChange={setFramework} options={FRAMEWORKS.map(f => ({ value: f.id, label: f.label }))} />
        </Row>
        <Btn onClick={runStress}>{loading ? 'Running…' : 'Run Stress Test'}</Btn>
      </Section>

      {tab === 0 && (
        <div>
          <Section title="NGFS Phase IV — CET1 Depletion by Scenario (pp)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d.scenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-12} textAnchor="end" height={50} />
                <YAxis unit="pp" />
                <Tooltip formatter={(val) => `${val}pp`} />
                <Bar dataKey="depletion" name="CET1 Depletion (pp)" radius={[4, 4, 0, 0]}>
                  {d.scenarios.map((s, i) => <Cell key={i} fill={s.pass ? '#059669' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Scenario Detail Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Scenario', 'Temp', 'Carbon Price $/t', 'GDP Shock %', 'CET1 Depletion pp', 'Pass/Fail'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {d.scenarios.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{s.name}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{s.temp}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>${s.carbonPrice}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{s.gdpShock}%</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: s.depletion > 3 ? '#dc2626' : '#111827' }}>{s.depletion}pp</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={s.pass ? 'Pass' : 'Fail'} color={s.pass ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {tab === 1 && (
        <div>
          <Section title="NACE Sector PD Uplift % — Worst-Case Climate Scenario">
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={d.sectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}% PD uplift`} />
                <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'High Risk', position: 'top', fontSize: 10 }} />
                <ReferenceLine x={25} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Amber', position: 'top', fontSize: 10 }} />
                <Bar dataKey="pdUplift" name="PD Uplift %" radius={[0, 4, 4, 0]}>
                  {d.sectors.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {tab === 2 && (
        <div>
          <Section title="CET1 Stress Test Summary">
            <Row gap={12}>
              <KpiCard label="Baseline CET1 %" value={`${d.baselineCET1.toFixed(2)}%`} sub="Pre-stress capital ratio" accent />
              <KpiCard label="Stressed CET1 %" value={`${d.stressedCET1.toFixed(2)}%`} sub="Worst-case NGFS scenario" />
              <KpiCard label="CET1 Depletion" value={`${d.depletion.toFixed(2)}pp`} sub="Peak depletion across scenarios" />
              <KpiCard label={`Pass Threshold (${fwInfo.threshold})`} value={<Badge label={d.passes ? 'PASS' : 'FAIL'} color={d.passes ? 'green' : 'red'} />} sub={`${fwInfo.label} · ${fwInfo.horizon} horizon`} />
            </Row>
          </Section>
          <Row>
            <Section title="Stressed CET1 Gauge">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart innerRadius={50} outerRadius={130} data={d.radialCET1} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={10} dataKey="value" nameKey="name" label={{ fill: '#374151', fontSize: 13 }} background={{ fill: '#f3f4f6' }} />
                  <Tooltip formatter={(val) => `${val}% CET1`} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: -8 }}>
                Threshold: <strong>{d.thresholdNum}%</strong> · Stressed: <strong style={{ color: d.passes ? '#059669' : '#dc2626' }}>{d.stressedCET1.toFixed(2)}%</strong>
              </div>
            </Section>
            <Section title="Scenario Pass/Fail Overview">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Scenario', 'Stressed CET1', 'Threshold', 'Result'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {d.scenarios.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{s.name}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: s.pass ? '#059669' : '#dc2626' }}>{s.stressed.toFixed(2)}%</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280' }}>{d.thresholdNum}%</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={s.pass ? 'Pass' : 'Fail'} color={s.pass ? 'green' : 'red'} /></td>
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
          <Row>
            <Section title="Transmission Channel Impact Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={d.channels}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Impact Score" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Channel Contribution to Total Expected Loss">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Channel', 'Impact Score', 'EL Contribution', 'Description'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {d.channels.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#059669' }}>{c.subject}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{c.value}/100</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{c.pct}%</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 12 }}>{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Row>
        </div>
      )}

      {tab === 4 && (
        <div>
          <Section title="Framework Comparison — All 6 Regulatory Regimes">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Framework', 'Min CET1 Threshold', 'Horizon', 'Submission Ready'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {FRAMEWORKS.map((f, i) => {
                  const isCurrent = f.id === framework;
                  const ready = d.passes || i % 3 !== 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: isCurrent ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '8px 12px', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#059669' : '#374151' }}>{f.label}{isCurrent && ' ●'}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{f.threshold}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{f.horizon}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={ready ? 'Ready' : 'Gaps'} color={ready ? 'green' : 'yellow'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
          <Section title={`Required Submission Fields — ${fwInfo.label}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {(SUBMISSION_FIELDS[framework] || []).map((field, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                  <span style={{ color: '#059669', fontWeight: 700, fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{field}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
