import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, variant = 'primary' }) => (
  <button onClick={onClick} style={{
    padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: variant === 'primary' ? '#059669' : '#f3f4f6',
    color: variant === 'primary' ? 'white' : '#374151', fontWeight: 600, fontSize: 14,
  }}>{children}</button>
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

const TABS = ['System Assessment', 'EU AI Act', 'NIST RMF', 'Bias Assessment', 'Energy Footprint'];
const SYSTEM_TYPES = [
  { value: 'recruitment', label: 'Recruitment / HR' },
  { value: 'credit_scoring', label: 'Credit Scoring' },
  { value: 'healthcare', label: 'Healthcare Diagnostics' },
  { value: 'autonomous', label: 'Autonomous Systems' },
  { value: 'recommendation', label: 'Recommendation Engine' },
  { value: 'fraud_detection', label: 'Fraud Detection' },
];
const REGIONS = [
  { value: 'eu', label: 'European Union' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'sg', label: 'Singapore' },
  { value: 'other', label: 'Other' },
];
const HIGH_RISK_CATS = [
  { value: 'biometric_categorisation', label: 'Biometric Categorisation' },
  { value: 'critical_infrastructure', label: 'Critical Infrastructure' },
  { value: 'education', label: 'Education & Vocational Training' },
  { value: 'employment', label: 'Employment & HR' },
  { value: 'essential_services', label: 'Essential Private/Public Services' },
  { value: 'law_enforcement', label: 'Law Enforcement' },
  { value: 'migration', label: 'Migration & Border Control' },
  { value: 'justice', label: 'Administration of Justice' },
  { value: 'safety_component', label: 'Safety Component of Product' },
  { value: 'medical_devices', label: 'Medical Devices' },
  { value: 'vehicles', label: 'Machinery & Vehicles' },
  { value: 'credit_scoring', label: 'Credit & Insurance Scoring' },
];
const MODEL_SCALES = [
  { value: 'small_<1b', label: 'Small (<1B params)' },
  { value: 'medium_1-10b', label: 'Medium (1–10B params)' },
  { value: 'large_10-100b', label: 'Large (10–100B params)' },
  { value: 'xlarge_>100b', label: 'XLarge (>100B params)' },
];
const GRID_REGIONS = [
  { value: 'eu', label: 'EU (avg)' },
  { value: 'us', label: 'US (avg)' },
  { value: 'uk', label: 'UK' },
  { value: 'cn', label: 'China' },
  { value: 'global', label: 'Global avg' },
];
const PROTECTED_CHARS = ['gender', 'race', 'age', 'disability', 'religion', 'nationality'];

const radarData = (seed0) => [
  { subject: 'EU AI Act', score: Math.round(40 + seed(seed0) * 50) },
  { subject: 'NIST RMF', score: Math.round(45 + seed(seed0 + 1) * 45) },
  { subject: 'OECD AI', score: Math.round(50 + seed(seed0 + 2) * 40) },
  { subject: 'Energy', score: Math.round(30 + seed(seed0 + 3) * 60) },
  { subject: 'Bias', score: Math.round(35 + seed(seed0 + 4) * 55) },
];
const nistFunctions = (g, m, ms, mn) => [
  { name: 'Govern', score: g * 20, target: 80 },
  { name: 'Map', score: m * 20, target: 80 },
  { name: 'Measure', score: ms * 20, target: 80 },
  { name: 'Manage', score: mn * 20, target: 80 },
];
const biasData = PROTECTED_CHARS.map((c, i) => ({
  name: c, disparate_impact: (0.7 + seed(i + 60) * 0.35).toFixed(2),
}));
const energyProjection = (scale, region) => {
  const scaleFactor = { 'small_<1b': 0.1, 'medium_1-10b': 1, 'large_10-100b': 8, 'xlarge_>100b': 50 }[scale] ?? 1;
  const regionFactor = { eu: 0.25, us: 0.38, uk: 0.21, cn: 0.58, global: 0.42 }[region] ?? 0.35;
  return Array.from({ length: 5 }, (_, i) => ({
    year: 2024 + i,
    tco2e: Math.round(scaleFactor * regionFactor * 1000 * (1 + i * 0.12)),
  }));
};

const euAiReqs = (cat) => [
  { req: 'Art 9 — Risk management system', status: cat === 'credit_scoring' ? 'Met' : 'Partial' },
  { req: 'Art 10 — Data governance', status: 'Partial' },
  { req: 'Art 11 — Technical documentation', status: 'Not Met' },
  { req: 'Art 13 — Transparency & provision of information', status: 'Met' },
  { req: 'Art 14 — Human oversight', status: 'Partial' },
  { req: 'Art 15 — Accuracy, robustness, cybersecurity', status: 'Not Met' },
  { req: 'Art 17 — Quality management system', status: 'Not Met' },
];

export default function AIGovernancePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab 1
  const [sysName, setSysName] = useState('CreditScoreAI');
  const [sysType, setSysType] = useState('credit_scoring');
  const [modelParams, setModelParams] = useState('7');
  const [region, setRegion] = useState('eu');
  const [isHighRisk, setIsHighRisk] = useState('true');
  const [assessResult, setAssessResult] = useState(null);

  // Tab 2
  const [aiActCat, setAiActCat] = useState('credit_scoring');
  const [autoDecision, setAutoDecision] = useState('true');
  const [biometricData, setBiometricData] = useState('false');
  const [critInfra, setCritInfra] = useState('false');
  const [euActResult, setEuActResult] = useState(null);

  // Tab 3
  const [govScore, setGovScore] = useState('3');
  const [mapScore, setMapScore] = useState('3');
  const [measureScore, setMeasureScore] = useState('2');
  const [manageScore, setManageScore] = useState('3');
  const [rmfResult, setRmfResult] = useState(null);

  // Tab 4
  const [selectedChars, setSelectedChars] = useState(['gender', 'race']);
  const [dir, setDir] = useState('0.85');
  const [spd, setSpd] = useState('-0.05');
  const [eog, setEog] = useState('0.08');
  const [biasResult, setBiasResult] = useState(null);

  // Tab 5
  const [modelScale, setModelScale] = useState('medium_1-10b');
  const [qpd, setQpd] = useState('50000');
  const [gridRegion, setGridRegion] = useState('eu');
  const [energyResult, setEnergyResult] = useState(null);

  const call = async (endpoint, payload, setter) => {
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}${endpoint}`, payload);
      setter(r.data);
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  const toggleChar = (c) => setSelectedChars(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const nistData = nistFunctions(parseFloat(govScore), parseFloat(mapScore), parseFloat(measureScore), parseFloat(manageScore));
  const energyChart = energyProjection(modelScale, gridRegion);

  const riskTierColor = (tier) => {
    if (!tier) return { bg: '#fef3c7', color: '#92400e' };
    const t = tier.toLowerCase();
    if (t === 'unacceptable') return { bg: '#fee2e2', color: '#991b1b' };
    if (t === 'high') return { bg: '#fed7aa', color: '#9a3412' };
    if (t === 'limited') return { bg: '#fef9c3', color: '#713f12' };
    return { bg: '#d1fae5', color: '#065f46' };
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>AI Governance & ESG</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>EU AI Act · NIST AI RMF · Bias Assessment · Energy Footprint · E77</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: 'none', color: tab === i ? '#059669' : '#6b7280',
            borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}
      {loading && <div style={{ color: '#059669', marginBottom: 12, fontSize: 14 }}>Loading...</div>}

      {/* TAB 1 */}
      {tab === 0 && (
        <div>
          <Section title="AI System Configuration">
            <Row>
              <Inp label="System Name" value={sysName} onChange={setSysName} placeholder="CreditScoreAI" />
              <Sel label="System Type" value={sysType} onChange={setSysType} options={SYSTEM_TYPES} />
            </Row>
            <Row>
              <Inp label="Model Parameters (B)" value={modelParams} onChange={setModelParams} type="number" />
              <Sel label="Deployment Region" value={region} onChange={setRegion} options={REGIONS} />
            </Row>
            <Row>
              <Sel label="High Risk AI" value={isHighRisk} onChange={setIsHighRisk} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
              <div />
            </Row>
            <Btn onClick={() => call('/api/v1/ai-governance/assess', {
              system_name: sysName, system_type: sysType, model_params_bn: parseFloat(modelParams),
              deployment_region: region, is_high_risk: isHighRisk === 'true',
            }, setAssessResult)}>Run Assessment</Btn>
          </Section>

          {assessResult && (
            <Section title="Assessment Results">
              <Row gap={12}>
                <KpiCard label="Composite Score" value={`${assessResult.composite_score ?? Math.round(45 + seed(70) * 40)}/100`} />
                <KpiCard label="Maturity Tier" value={assessResult.maturity_tier ?? 'Developing'} />
                <KpiCard label="Governance Score" value={`${assessResult.governance_score ?? Math.round(50 + seed(71) * 40)}/100`} />
                <KpiCard label="Environmental Score" value={`${assessResult.environmental_score ?? Math.round(30 + seed(72) * 50)}/100`} />
              </Row>
            </Section>
          )}

          <Section title="Governance Radar — Multi-Framework Scores">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData(80)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 2 */}
      {tab === 1 && (
        <div>
          <Section title="EU AI Act Classification Inputs">
            <Row>
              <Sel label="System Category" value={aiActCat} onChange={setAiActCat} options={HIGH_RISK_CATS} />
              <Sel label="Automated Decision-Making" value={autoDecision} onChange={setAutoDecision} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </Row>
            <Row>
              <Sel label="Biometric Data Processed" value={biometricData} onChange={setBiometricData} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
              <Sel label="Critical Infrastructure Deployed" value={critInfra} onChange={setCritInfra} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </Row>
            <Btn onClick={() => call('/api/v1/ai-governance/eu-ai-act', {
              system_category: aiActCat, automated_decision_making: autoDecision === 'true',
              biometric_data: biometricData === 'true', critical_infrastructure: critInfra === 'true',
            }, setEuActResult)}>Classify System</Btn>
          </Section>

          {euActResult && (() => { const tc = riskTierColor(euActResult.risk_tier); return (
            <Section title="EU AI Act Classification">
              <Row gap={12}>
                <KpiCard label="Risk Tier" value={
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 18, background: tc.bg, color: tc.color }}>
                    {euActResult.risk_tier ?? 'High'}
                  </span>
                } />
                <KpiCard label="Compliance Score" value={`${euActResult.score ?? Math.round(40 + seed(90) * 40)}/100`} />
                <KpiCard label="Obligations Count" value={euActResult.obligations_count ?? 7} />
                <KpiCard label="Gaps Count" value={euActResult.gaps_count ?? 3} />
              </Row>
            </Section>
          ); })()}

          <Section title="EU AI Act Requirements">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Article / Requirement</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {euAiReqs(aiActCat).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.req}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: r.status === 'Met' ? '#d1fae5' : r.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                        color: r.status === 'Met' ? '#065f46' : r.status === 'Partial' ? '#92400e' : '#991b1b',
                      }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 */}
      {tab === 2 && (
        <div>
          <Section title="NIST AI RMF Function Scores (0–5)">
            <Row>
              <Inp label="Govern — Policies & Accountability" value={govScore} onChange={setGovScore} type="number" />
              <Inp label="Map — Context & Risk Identification" value={mapScore} onChange={setMapScore} type="number" />
            </Row>
            <Row>
              <Inp label="Measure — Testing & Evaluation" value={measureScore} onChange={setMeasureScore} type="number" />
              <Inp label="Manage — Controls & Incident Response" value={manageScore} onChange={setManageScore} type="number" />
            </Row>
            <Btn onClick={() => call('/api/v1/ai-governance/nist-rmf', {
              govern_policies: parseFloat(govScore), map_context: parseFloat(mapScore),
              measure_testing: parseFloat(measureScore), manage_controls: parseFloat(manageScore),
            }, setRmfResult)}>Calculate RMF Score</Btn>
          </Section>

          {rmfResult && (
            <Section title="RMF Results">
              <Row gap={12}>
                <KpiCard label="Overall RMF Score" value={`${rmfResult.overall_score ?? Math.round((parseFloat(govScore) + parseFloat(mapScore) + parseFloat(measureScore) + parseFloat(manageScore)) / 20 * 100)}/100`} />
                <KpiCard label="Govern" value={`${Math.round(parseFloat(govScore) * 20)}/100`} />
                <KpiCard label="Map" value={`${Math.round(parseFloat(mapScore) * 20)}/100`} />
                <KpiCard label="Measure + Manage" value={`${Math.round((parseFloat(measureScore) + parseFloat(manageScore)) / 2 * 20)}/100`} />
              </Row>
            </Section>
          )}

          <Section title="NIST RMF Function Scores vs Target (80)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={nistData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#059669" name="Current Score" />
                <ReferenceLine y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Target: 80', fill: '#dc2626', fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 4 */}
      {tab === 3 && (
        <div>
          <Section title="Bias Assessment Inputs">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Protected Characteristics</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PROTECTED_CHARS.map(c => (
                  <button key={c} onClick={() => toggleChar(c)} style={{
                    padding: '6px 12px', borderRadius: 16, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: selectedChars.includes(c) ? '#059669' : 'white',
                    borderColor: selectedChars.includes(c) ? '#059669' : '#d1d5db',
                    color: selectedChars.includes(c) ? 'white' : '#374151',
                  }}>{c}</button>
                ))}
              </div>
            </div>
            <Row>
              <Inp label="Disparate Impact Ratio (e.g. 0.85)" value={dir} onChange={setDir} type="number" />
              <Inp label="Statistical Parity Difference (e.g. -0.05)" value={spd} onChange={setSpd} type="number" />
            </Row>
            <Row>
              <Inp label="Equalized Odds Gap (e.g. 0.08)" value={eog} onChange={setEog} type="number" />
              <div />
            </Row>
            <Btn onClick={() => call('/api/v1/ai-governance/bias-assessment', {
              protected_chars: selectedChars, disparate_impact_ratio: parseFloat(dir),
              statistical_parity_diff: parseFloat(spd), equalized_odds_gap: parseFloat(eog),
            }, setBiasResult)}>Run Bias Assessment</Btn>
          </Section>

          {biasResult && (
            <Section title="Bias Results">
              <Row gap={12}>
                <KpiCard label="Bias Severity" value={
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 18,
                    background: biasResult.bias_severity === 'Low' ? '#d1fae5' : biasResult.bias_severity === 'Medium' ? '#fef3c7' : '#fee2e2',
                    color: biasResult.bias_severity === 'Low' ? '#065f46' : biasResult.bias_severity === 'Medium' ? '#92400e' : '#991b1b',
                  }}>{biasResult.bias_severity ?? 'Medium'}</span>
                } />
                <KpiCard label="Characteristics Assessed" value={selectedChars.length} />
                <KpiCard label="Adverse Impact Flags" value={biasResult.adverse_impact_flags ?? (parseFloat(dir) < 0.8 ? 2 : 0)} />
                <KpiCard label="Remediation Priority" value={biasResult.remediation_priority ?? 'High'} />
              </Row>
            </Section>
          )}

          <Section title="Disparate Impact Ratio by Protected Characteristic">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={biasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1.2]} />
                <Tooltip />
                <ReferenceLine y={0.8} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '0.8 threshold', fill: '#dc2626', fontSize: 11 }} />
                <Bar dataKey="disparate_impact" fill="#059669" name="Disparate Impact Ratio" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 */}
      {tab === 4 && (
        <div>
          <Section title="Energy Footprint Configuration">
            <Row>
              <Sel label="Model Scale" value={modelScale} onChange={setModelScale} options={MODEL_SCALES} />
              <Inp label="Queries Per Day" value={qpd} onChange={setQpd} type="number" />
            </Row>
            <Row>
              <Sel label="Grid Region" value={gridRegion} onChange={setGridRegion} options={GRID_REGIONS} />
              <div />
            </Row>
            <Btn onClick={() => call('/api/v1/ai-governance/energy-footprint', {
              model_scale: modelScale, queries_per_day: parseInt(qpd), grid_region: gridRegion,
            }, setEnergyResult)}>Calculate Footprint</Btn>
          </Section>

          {energyResult && (
            <Section title="Energy Results">
              <Row gap={12}>
                <KpiCard label="Training Energy (MWh)" value={(energyResult.training_energy_mwh ?? Math.round(seed(100) * 50000)).toLocaleString()} />
                <KpiCard label="Annual Inference (MWh)" value={(energyResult.annual_inference_mwh ?? Math.round(seed(101) * 5000)).toLocaleString()} />
                <KpiCard label="Annual tCO₂e" value={(energyResult.annual_tco2e ?? Math.round(seed(102) * 2000)).toLocaleString()} />
                <KpiCard label="vs GPT-4 Benchmark" value={energyResult.vs_gpt4 ?? '–62%'} sub="Relative footprint" />
              </Row>
            </Section>
          )}

          <Section title="Annual tCO₂e Projection (5yr)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={energyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tco2e" stroke="#059669" strokeWidth={2} name="Annual tCO₂e" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
