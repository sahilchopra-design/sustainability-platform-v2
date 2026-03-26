import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const API = 'http://localhost:8001';
const seed = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
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
    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);

const TABS = ['IAIS Assessment', 'Parametric Design', 'NatCat Loss', 'Climate VaR', 'Protection Gap'];
const INSURER_TYPES = [
  { value: 'life', label: 'Life Insurer' },
  { value: 'pc', label: 'P&C Insurer' },
  { value: 'composite', label: 'Composite Insurer' },
  { value: 'reinsurer', label: 'Reinsurer' },
];
const INDEX_TYPES = [
  { value: 'rainfall_deficit', label: 'Rainfall Deficit' },
  { value: 'wind_speed', label: 'Wind Speed' },
  { value: 'temperature_anomaly', label: 'Temperature Anomaly' },
  { value: 'flood_depth', label: 'Flood Depth' },
  { value: 'soil_moisture', label: 'Soil Moisture' },
  { value: 'cat_model_score', label: 'CAT Model Score' },
];
const PERILS = [
  { value: 'flood', label: 'Flood' },
  { value: 'wind', label: 'Wind / Storm' },
  { value: 'drought', label: 'Drought' },
  { value: 'earthquake', label: 'Earthquake' },
];
const COUNTRIES_15 = ['US', 'JP', 'DE', 'IN', 'CN', 'BR', 'AU', 'PH', 'BD', 'MZ', 'HT', 'PK', 'NG', 'KE', 'CO'];
const RCP_SCENARIOS = [
  { value: 'rcp26', label: 'RCP 2.6 (Low)' },
  { value: 'rcp45', label: 'RCP 4.5 (Medium)' },
  { value: 'rcp85', label: 'RCP 8.5 (High)' },
];
const PORTFOLIO_TYPES = [
  { value: 'pc', label: 'P&C Portfolio' },
  { value: 'life', label: 'Life Portfolio' },
  { value: 'health', label: 'Health Portfolio' },
  { value: 'reinsurance', label: 'Reinsurance Portfolio' },
];

const iaisRadarData = (g, s, r, d) => [
  { subject: 'Governance', score: g },
  { subject: 'Strategy', score: s },
  { subject: 'Risk Mgmt', score: r },
  { subject: 'Disclosure', score: d },
];

const pmlData = (country, peril, rcp) => {
  const base = { flood: 0.8, wind: 0.6, earthquake: 1.2, drought: 0.4 }[peril] ?? 0.7;
  const rcpMult = { rcp26: 1.0, rcp45: 1.25, rcp85: 1.6 }[rcp] ?? 1.0;
  const ci = seed(COUNTRIES_15.indexOf(country) + 200);
  return [
    { rp: '1-in-10', pml: +(base * rcpMult * (0.3 + ci * 0.3) * 100).toFixed(1) },
    { rp: '1-in-25', pml: +(base * rcpMult * (0.5 + ci * 0.4) * 100).toFixed(1) },
    { rp: '1-in-50', pml: +(base * rcpMult * (0.7 + ci * 0.5) * 100).toFixed(1) },
    { rp: '1-in-100', pml: +(base * rcpMult * (1.0 + ci * 0.6) * 100).toFixed(1) },
    { rp: '1-in-200', pml: +(base * rcpMult * (1.4 + ci * 0.7) * 100).toFixed(1) },
    { rp: '1-in-250', pml: +(base * rcpMult * (1.6 + ci * 0.8) * 100).toFixed(1) },
  ];
};

const climatVarDecomp = (physBn, transBn, lifeBn) => [
  { scenario: 'Orderly', physical: +(physBn * 0.08).toFixed(2), transition: +(transBn * 0.06).toFixed(2), liability: +(lifeBn * 0.04).toFixed(2) },
  { scenario: 'Disorderly', physical: +(physBn * 0.14).toFixed(2), transition: +(transBn * 0.18).toFixed(2), liability: +(lifeBn * 0.07).toFixed(2) },
  { scenario: 'Hot House', physical: +(physBn * 0.24).toFixed(2), transition: +(transBn * 0.05).toFixed(2), liability: +(lifeBn * 0.12).toFixed(2) },
];

const protectionGapData = COUNTRIES_15.map((c, i) => {
  const econLoss = +(5 + seed(i + 300) * 120).toFixed(1);
  const insuredLoss = +(econLoss * (0.15 + seed(i + 301) * 0.5)).toFixed(1);
  const gap = +(100 - (insuredLoss / econLoss * 100)).toFixed(1);
  return {
    country: c,
    econ_loss: econLoss,
    insured_loss: insuredLoss,
    protection_gap: gap,
    insured_ratio: +(insuredLoss / econLoss * 100).toFixed(1),
  };
});

const parametricPayout = (trigger, exit, maxPayout, indexType) => {
  const steps = 8;
  const range = exit - trigger;
  return Array.from({ length: steps }, (_, i) => {
    const indexVal = +(trigger + (range / (steps - 1)) * i).toFixed(2);
    const fraction = Math.min(1, (indexVal - trigger) / range);
    return { index: indexVal, payout: +(fraction * maxPayout).toFixed(0) };
  });
};

export default function ClimateInsurancePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab 1 — IAIS
  const [insurerName, setInsurerName] = useState('ClimateRe Ltd');
  const [insurerType, setInsurerType] = useState('pc');
  const [totalAssets, setTotalAssets] = useState('12.5');
  const [natCatExp, setNatCatExp] = useState('3.2');
  const [iaisGov, setIaisGov] = useState('72');
  const [iaisStrategy, setIaisStrategy] = useState('65');
  const [iaisRisk, setIaisRisk] = useState('58');
  const [iaisDisc, setIaisDisc] = useState('70');
  const [iaisResult, setIaisResult] = useState(null);

  // Tab 2 — Parametric
  const [indexType, setIndexType] = useState('rainfall_deficit');
  const [triggerVal, setTriggerVal] = useState('200');
  const [exitVal, setExitVal] = useState('50');
  const [maxPayout, setMaxPayout] = useState('5000000');
  const [paramCountry, setParamCountry] = useState('IN');
  const [peril, setPeril] = useState('drought');
  const [paramResult, setParamResult] = useState(null);

  // Tab 3 — NatCat
  const [natCatCountry, setNatCatCountry] = useState('JP');
  const [natCatPeril, setNatCatPeril] = useState('earthquake');
  const [totalExposure, setTotalExposure] = useState('50');
  const [rcpScenario, setRcpScenario] = useState('rcp45');
  const [natCatResult, setNatCatResult] = useState(null);

  // Tab 4 — Climate VaR
  const [portType, setPortType] = useState('pc');
  const [physExp, setPhysExp] = useState('8.0');
  const [transLiab, setTransLiab] = useState('4.5');
  const [lifeExp, setLifeExp] = useState('6.0');
  const [varResult, setVarResult] = useState(null);

  // Tab 5 — Protection Gap
  const [pgData, setPgData] = useState(protectionGapData);
  const [pgLoading, setPgLoading] = useState(false);

  useEffect(() => {
    setPgLoading(true);
    axios.get(`${API}/api/v1/climate-insurance/ref/protection-gap`)
      .then(r => setPgData(r.data))
      .catch(() => setPgData(protectionGapData))
      .finally(() => setPgLoading(false));
  }, []);

  const call = async (endpoint, payload, setter) => {
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}${endpoint}`, payload);
      setter(r.data);
    } catch {
      setError('API unavailable — demo mode.');
    } finally { setLoading(false); }
  };

  const iaisOverall = Math.round((parseFloat(iaisGov) + parseFloat(iaisStrategy) + parseFloat(iaisRisk) + parseFloat(iaisDisc)) / 4);
  const iaisStatus = iaisOverall >= 70 ? 'Compliant' : iaisOverall >= 50 ? 'Amber' : 'Red';
  const iaisRadar = iaisRadarData(parseFloat(iaisGov), parseFloat(iaisStrategy), parseFloat(iaisRisk), parseFloat(iaisDisc));

  const trigNum = parseFloat(triggerVal);
  const exitNum = parseFloat(exitVal);
  const maxNum = parseFloat(maxPayout);
  const payoutCurve = parametricPayout(Math.min(trigNum, exitNum), Math.max(trigNum, exitNum), maxNum, indexType);

  const pmlChart = pmlData(natCatCountry, natCatPeril, rcpScenario);
  const pml100 = pmlChart.find(d => d.rp === '1-in-100')?.pml ?? 0;
  const pml250 = pmlChart.find(d => d.rp === '1-in-250')?.pml ?? 0;
  const expBn = parseFloat(totalExposure);
  const aalPct = (seed(COUNTRIES_15.indexOf(natCatCountry) + 400) * 1.5 + 0.3).toFixed(2);
  const climateLoading = ({ rcp26: 5, rcp45: 18, rcp85: 38 }[rcpScenario] ?? 15);

  const physBn = parseFloat(physExp);
  const transBn = parseFloat(transLiab);
  const lifeBn = parseFloat(lifeExp);
  const varDecomp = climatVarDecomp(physBn, transBn, lifeBn);

  const avgGap = (pgData.reduce((a, b) => a + (b.protection_gap ?? 0), 0) / pgData.length).toFixed(1);
  const highestGap = pgData.reduce((a, b) => (b.protection_gap ?? 0) > (a.protection_gap ?? 0) ? b : a, pgData[0]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Climate Insurance</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>IAIS climate compliance · Parametric design · NatCat loss · Climate VaR · Protection gap · E79</p>
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

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}
      {loading && <div style={{ color: '#059669', marginBottom: 12, fontSize: 14 }}>Loading...</div>}

      {/* TAB 1 — IAIS */}
      {tab === 0 && (
        <div>
          <Section title="IAIS Climate Risk Assessment Inputs">
            <Row>
              <Inp label="Insurer Name" value={insurerName} onChange={setInsurerName} placeholder="ClimateRe Ltd" />
              <Sel label="Insurer Type" value={insurerType} onChange={setInsurerType} options={INSURER_TYPES} />
            </Row>
            <Row>
              <Inp label="Total Assets ($bn)" value={totalAssets} onChange={setTotalAssets} type="number" />
              <Inp label="NatCat Exposure ($bn)" value={natCatExp} onChange={setNatCatExp} type="number" />
            </Row>
            <Row>
              <Inp label="Governance Score (0–100)" value={iaisGov} onChange={setIaisGov} type="number" />
              <Inp label="Strategy Score (0–100)" value={iaisStrategy} onChange={setIaisStrategy} type="number" />
            </Row>
            <Row>
              <Inp label="Risk Management Score (0–100)" value={iaisRisk} onChange={setIaisRisk} type="number" />
              <Inp label="Disclosure Score (0–100)" value={iaisDisc} onChange={setIaisDisc} type="number" />
            </Row>
            <Btn onClick={() => call('/api/v1/climate-insurance/iais-compliance', {
              insurer_name: insurerName, insurer_type: insurerType,
              total_assets_bn: parseFloat(totalAssets), nat_cat_exposure_bn: parseFloat(natCatExp),
              governance_score: parseFloat(iaisGov), strategy_score: parseFloat(iaisStrategy),
              risk_mgmt_score: parseFloat(iaisRisk), disclosure_score: parseFloat(iaisDisc),
            }, setIaisResult)}>Run IAIS Assessment</Btn>
          </Section>

          <Section title="IAIS Summary">
            <Row gap={12}>
              <KpiCard label="IAIS Overall Score" value={`${iaisResult?.overall_score ?? iaisOverall}/100`} />
              <KpiCard label="Status" value={
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 18,
                  background: iaisStatus === 'Compliant' ? '#d1fae5' : iaisStatus === 'Amber' ? '#fef3c7' : '#fee2e2',
                  color: iaisStatus === 'Compliant' ? '#065f46' : iaisStatus === 'Amber' ? '#92400e' : '#991b1b',
                }}>{iaisResult?.status ?? iaisStatus}</span>
              } />
              <KpiCard label="Governance" value={`${iaisGov}/100`} />
              <KpiCard label="Risk Management" value={`${iaisRisk}/100`} />
            </Row>
          </Section>

          <Section title="IAIS Climate Pillar Radar">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={iaisRadar}>
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

      {/* TAB 2 — Parametric */}
      {tab === 1 && (
        <div>
          <Section title="Parametric Product Design">
            <Row>
              <Sel label="Index Type" value={indexType} onChange={setIndexType} options={INDEX_TYPES} />
              <Sel label="Peril" value={peril} onChange={setPeril} options={PERILS} />
            </Row>
            <Row>
              <Inp label="Trigger Threshold" value={triggerVal} onChange={setTriggerVal} type="number" placeholder="200" />
              <Inp label="Exit Threshold" value={exitVal} onChange={setExitVal} type="number" placeholder="50" />
            </Row>
            <Row>
              <Inp label="Maximum Payout (USD)" value={maxPayout} onChange={setMaxPayout} type="number" />
              <Sel label="Country" value={paramCountry} onChange={setParamCountry} options={COUNTRIES_15.map(c => ({ value: c, label: c }))} />
            </Row>
            <Btn onClick={() => call('/api/v1/climate-insurance/parametric-design', {
              index_type: indexType, trigger_threshold: trigNum, exit_threshold: exitNum,
              max_payout_usd: maxNum, country_code: paramCountry, peril,
            }, setParamResult)}>Design Product</Btn>
          </Section>

          <Section title="Parametric KPIs">
            <Row gap={12}>
              <KpiCard label="Annual Premium (USD)" value={(paramResult?.annual_premium ?? Math.round(maxNum * (0.04 + seed(500) * 0.06))).toLocaleString()} />
              <KpiCard label="Basis Risk Score" value={`${paramResult?.basis_risk_score ?? Math.round(20 + seed(501) * 40)}/100`} sub="Lower is better" />
              <KpiCard label="Expected Annual Payout" value={(paramResult?.expected_annual_payout ?? Math.round(maxNum * (0.02 + seed(502) * 0.05))).toLocaleString()} />
              <KpiCard label="Loss Ratio" value={`${(paramResult?.loss_ratio ?? (40 + seed(503) * 30)).toFixed(1)}%`} />
            </Row>
          </Section>

          <Section title="Payout Curve (Index Value → USD Payout)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={payoutCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: 'Index Value', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="payout" fill="#059669" name="Payout (USD)" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 3 — NatCat Loss */}
      {tab === 2 && (
        <div>
          <Section title="NatCat Loss Inputs">
            <Row>
              <Sel label="Country" value={natCatCountry} onChange={setNatCatCountry} options={COUNTRIES_15.map(c => ({ value: c, label: c }))} />
              <Sel label="Peril" value={natCatPeril} onChange={setNatCatPeril} options={PERILS} />
            </Row>
            <Row>
              <Inp label="Total Exposure ($bn)" value={totalExposure} onChange={setTotalExposure} type="number" />
              <Sel label="RCP Scenario" value={rcpScenario} onChange={setRcpScenario} options={RCP_SCENARIOS} />
            </Row>
            <Btn onClick={() => call('/api/v1/climate-insurance/natcat-loss', {
              country_code: natCatCountry, peril: natCatPeril,
              total_exposure_bn: parseFloat(totalExposure), rcp_scenario: rcpScenario,
            }, setNatCatResult)}>Calculate NatCat Loss</Btn>
          </Section>

          <Section title="NatCat Results">
            <Row gap={12}>
              <KpiCard label="AAL (% of Exposure)" value={`${natCatResult?.aal_pct ?? aalPct}%`} sub="Average Annual Loss" />
              <KpiCard label="PML 1-in-100 ($bn)" value={`$${natCatResult?.pml_100 ?? (pml100 / 100 * expBn).toFixed(2)}bn`} />
              <KpiCard label="PML 1-in-250 ($bn)" value={`$${natCatResult?.pml_250 ?? (pml250 / 100 * expBn).toFixed(2)}bn`} />
              <KpiCard label="Climate Loading (%)" value={`+${natCatResult?.climate_loading ?? climateLoading}%`} sub={`vs RCP 2.6 baseline`} />
            </Row>
          </Section>

          <Section title="PML by Return Period (% of Exposure)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pmlChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rp" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="pml" fill="#059669" name="PML (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 4 — Climate VaR */}
      {tab === 3 && (
        <div>
          <Section title="Climate VaR Inputs">
            <Row>
              <Sel label="Portfolio Type" value={portType} onChange={setPortType} options={PORTFOLIO_TYPES} />
              <Inp label="Physical Exposure ($bn)" value={physExp} onChange={setPhysExp} type="number" />
            </Row>
            <Row>
              <Inp label="Transition Liability ($bn)" value={transLiab} onChange={setTransLiab} type="number" />
              <Inp label="Life Exposure ($bn)" value={lifeExp} onChange={setLifeExp} type="number" />
            </Row>
            <Btn onClick={() => call('/api/v1/climate-insurance/climate-var', {
              portfolio_type: portType, physical_exposure_bn: physBn,
              transition_liability_bn: transBn, life_exposure_bn: lifeBn,
            }, setVarResult)}>Calculate Climate VaR</Btn>
          </Section>

          <Section title="Climate VaR Results">
            <Row gap={12}>
              <KpiCard label="Physical VaR ($bn)" value={`$${varResult?.physical_var ?? (physBn * 0.14).toFixed(2)}bn`} />
              <KpiCard label="Transition VaR ($bn)" value={`$${varResult?.transition_var ?? (transBn * 0.12).toFixed(2)}bn`} />
              <KpiCard label="Liability VaR ($bn)" value={`$${varResult?.liability_var ?? (lifeBn * 0.07).toFixed(2)}bn`} />
              <KpiCard label="Total Climate VaR ($bn)" value={`$${varResult?.total_climate_var ?? (physBn * 0.14 + transBn * 0.12 + lifeBn * 0.07).toFixed(2)}bn`} />
            </Row>
          </Section>

          <Section title="Climate VaR Decomposition by Scenario ($bn)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={varDecomp}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="physical" stackId="1" stroke="#059669" fill="#d1fae5" name="Physical VaR" />
                <Area type="monotone" dataKey="transition" stackId="1" stroke="#3b82f6" fill="#dbeafe" name="Transition VaR" />
                <Area type="monotone" dataKey="liability" stackId="1" stroke="#f59e0b" fill="#fef3c7" name="Liability VaR" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Protection Gap */}
      {tab === 4 && (
        <div>
          {pgLoading && <div style={{ color: '#059669', marginBottom: 12, fontSize: 14 }}>Loading protection gap data...</div>}

          <Section title="Global Protection Gap Summary">
            <Row gap={12}>
              <KpiCard label="Avg Global Gap (%)" value={`${avgGap}%`} sub="Across 15 countries" />
              <KpiCard label="Highest Gap Country" value={highestGap?.country ?? '—'} sub={`${highestGap?.protection_gap ?? 0}% gap`} />
              <KpiCard label="Climate Gap 2030 Projection" value={`+${Math.round(parseFloat(avgGap) * 0.12).toFixed(0)} pts`} sub="Estimated increase" />
              <KpiCard label="Countries >70% Gap" value={pgData.filter(d => (d.protection_gap ?? 0) > 70).length} sub="High-vulnerability" />
            </Row>
          </Section>

          <Section title="Protection Gap by Country">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Country', 'Total Economic Loss ($bn)', 'Insured Loss ($bn)', 'Protection Gap (%)', 'Insured Ratio (%)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pgData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{r.country}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.econ_loss}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.insured_loss}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: (r.protection_gap ?? 0) > 70 ? '#fee2e2' : (r.protection_gap ?? 0) > 40 ? '#fef3c7' : '#d1fae5',
                        color: (r.protection_gap ?? 0) > 70 ? '#991b1b' : (r.protection_gap ?? 0) > 40 ? '#92400e' : '#065f46',
                      }}>{r.protection_gap}%</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.insured_ratio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Protection Gap % by Country">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pgData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="protection_gap" fill="#059669" name="Protection Gap (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
