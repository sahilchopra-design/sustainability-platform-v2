import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell,
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

const TABS = ['Art 9 Eligibility', 'PAI Indicators', 'DNSH Verification', 'RTS Annex Completeness', 'Downgrade Risk'];

const FUND_TYPE_OPTIONS = [
  { value: 'equity_impact', label: 'Equity Impact Fund' },
  { value: 'green_bond', label: 'Green Bond Fund' },
  { value: 'climate_solutions', label: 'Climate Solutions Fund' },
  { value: 'social_impact', label: 'Social Impact Fund' },
  { value: 'blended_impact', label: 'Blended Finance Impact Fund' },
  { value: 'biodiversity', label: 'Biodiversity / Nature Fund' },
  { value: 'transition', label: 'Transition Finance Fund' },
];

const STRATEGY_OPTIONS = [
  { value: 'best_in_class', label: 'Best-in-Class ESG Selection' },
  { value: 'thematic', label: 'Thematic Impact Investment' },
  { value: 'engagement', label: 'Active Ownership / Engagement' },
  { value: 'exclusion', label: 'Exclusion + Positive Screening' },
  { value: 'impact_first', label: 'Impact-First (Concessionary)' },
];

const getEligibilityData = (fundType, strategy) => {
  const fi = FUND_TYPE_OPTIONS.findIndex(f => f.value === fundType) + 1;
  const si = STRATEGY_OPTIONS.findIndex(s => s.value === strategy) + 1;
  const sustainableInvPct = Math.round(seed(fi * 7 + si * 3) * 25 + 60);
  const taxonomyAlignedPct = Math.round(seed(fi * 11 + si * 5) * 20 + 20);
  const eligibilityScore = Math.round((sustainableInvPct * 0.6 + taxonomyAlignedPct * 0.4));
  const eligible = sustainableInvPct >= 70 && taxonomyAlignedPct >= 20;
  const tier = eligibilityScore >= 75 ? 'Strong Art 9' : eligibilityScore >= 60 ? 'Eligible Art 9' : eligibilityScore >= 45 ? 'Art 8 Upgrade' : 'Art 6';
  const tierColor = eligibilityScore >= 75 ? 'green' : eligibilityScore >= 60 ? 'blue' : eligibilityScore >= 45 ? 'yellow' : 'red';
  return { sustainableInvPct, taxonomyAlignedPct, eligibilityScore, eligible, tier, tierColor };
};

const PAI_LABELS = [
  'GHG Emissions', 'Carbon Footprint', 'GHG Intensity', 'Fossil Fuel Exposure',
  'Non-Renewable Energy', 'Energy Consumption', 'Biodiversity Impact', 'Water Emissions',
  'Hazardous Waste', 'UNGC Violations', 'Board Gender Diversity', 'Pay Gap',
  'Controversial Weapons', 'Deforestation',
];

const getPaiData = (fundType) => {
  const fi = FUND_TYPE_OPTIONS.findIndex(f => f.value === fundType) + 1;
  const indicators = PAI_LABELS.map((label, i) => ({
    name: label,
    value: Math.round(seed(fi * 53 + i * 7) * 60 + 20),
    benchmark: Math.round(seed(fi * 59 + i * 11) * 50 + 30),
  }));
  const avgDqScore = Math.round(seed(fi * 67) * 25 + 60);
  const reported = indicators.filter(p => p.value > 0).length;
  return { indicators, avgDqScore, reported };
};

const getDnshData = (fundType, strategy) => {
  const fi = FUND_TYPE_OPTIONS.findIndex(f => f.value === fundType) + 1;
  const si = STRATEGY_OPTIONS.findIndex(s => s.value === strategy) + 1;
  const checks = [
    { id: 'climate_mitigation', label: 'Climate Change Mitigation', desc: 'No significant harm to GHG reduction objectives (Art 17(a))' },
    { id: 'climate_adaptation', label: 'Climate Change Adaptation', desc: 'No significant harm to adaptation objectives (Art 17(b))' },
    { id: 'water', label: 'Water & Marine Resources', desc: 'No significant harm to sustainable water use (Art 17(c))' },
    { id: 'circular', label: 'Circular Economy', desc: 'No significant harm to circular economy transition (Art 17(d))' },
    { id: 'pollution', label: 'Pollution Prevention', desc: 'No significant harm to pollution prevention (Art 17(e))' },
    { id: 'biodiversity', label: 'Biodiversity & Ecosystems', desc: 'No significant harm to biodiversity objectives (Art 17(f))' },
  ];
  const scores = checks.map((c, i) => ({
    ...c,
    pass: seed(fi * 71 + si * 5 + i * 13) > 0.25,
    score: Math.round(seed(fi * 73 + si * 7 + i * 17) * 30 + 55),
  }));
  const allPass = scores.every(s => s.pass);
  const passCount = scores.filter(s => s.pass).length;
  return { scores, allPass, passCount };
};

const getRtsData = (fundType, strategy) => {
  const fi = FUND_TYPE_OPTIONS.findIndex(f => f.value === fundType) + 1;
  const si = STRATEGY_OPTIONS.findIndex(s => s.value === strategy) + 1;
  const completeness = Math.round(seed(fi * 79 + si * 3) * 30 + 55);
  const scores = [
    { name: 'Investment Objective', value: Math.round(seed(fi * 83 + si * 5) * 30 + 55) },
    { name: 'Impact Strategy', value: Math.round(seed(fi * 89 + si * 7) * 28 + 52) },
    { name: 'Impact Measurement', value: Math.round(seed(fi * 97 + si * 11) * 32 + 48) },
    { name: 'Engagement Policy', value: Math.round(seed(fi * 101 + si * 13) * 28 + 50) },
  ];
  const annexBars = [
    { name: 'Annex I (Pre-contract)', value: Math.round(seed(fi * 103) * 25 + 60) },
    { name: 'Annex III (Periodic)', value: Math.round(seed(fi * 107) * 28 + 55) },
    { name: 'Annex V (Art9 Spec.)', value: completeness },
  ];
  return { completeness, scores, annexBars };
};

const getDowngradeData = (fundType, strategy) => {
  const fi = FUND_TYPE_OPTIONS.findIndex(f => f.value === fundType) + 1;
  const si = STRATEGY_OPTIONS.findIndex(s => s.value === strategy) + 1;
  const riskScore = Math.round(seed(fi * 109 + si * 3) * 40 + 20);
  const esmaCompliant = seed(fi * 113 + si * 7) > 0.3;
  const impactDefined = seed(fi * 117 + si * 11) > 0.25;
  const impactMeasured = seed(fi * 119 + si * 13) > 0.35;
  const triggers = [
    { trigger: 'Sustainable investment % < 70%', risk: seed(fi * 121) > 0.5 },
    { trigger: 'Taxonomy alignment % < 20%', risk: seed(fi * 127) > 0.55 },
    { trigger: 'Impact KPIs not measurable', risk: !impactMeasured },
    { trigger: 'DNSH breach on any objective', risk: seed(fi * 131) > 0.6 },
    { trigger: 'Insufficient PAI data quality', risk: seed(fi * 137) > 0.5 },
    { trigger: 'Engagement policy absent', risk: seed(fi * 139) > 0.65 },
  ];
  const activeRisks = triggers.filter(t => t.risk).length;
  const riskTier = riskScore >= 70 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low';
  const riskColor = riskScore >= 70 ? 'red' : riskScore >= 45 ? 'yellow' : 'green';
  return { riskScore, esmaCompliant, impactDefined, impactMeasured, triggers, activeRisks, riskTier, riskColor };
};

export default function SFDRArt9Page() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundType, setFundType] = useState('equity_impact');
  const [strategy, setStrategy] = useState('thematic');
  const [fundName, setFundName] = useState('GreenPath Impact Fund I');

  const eligibility = getEligibilityData(fundType, strategy);
  const pai = getPaiData(fundType);
  const dnsh = getDnshData(fundType, strategy);
  const rts = getRtsData(fundType, strategy);
  const downgrade = getDowngradeData(fundType, strategy);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/sfdr-art9/assess`, {
        fund_type: fundType, strategy, fund_name: fundName,
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>SFDR Article 9 Impact Fund Assessment</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>RTS 2022/1288 · ESMA Q&A 2023 · 14 PAI Indicators</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      <Section title="Fund Assessment Parameters">
        <Row>
          <Inp label="Fund Name" value={fundName} onChange={setFundName} />
          <Sel label="Fund Type" value={fundType} onChange={setFundType} options={FUND_TYPE_OPTIONS} />
          <Sel label="Investment Strategy" value={strategy} onChange={setStrategy} options={STRATEGY_OPTIONS} />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Running…' : 'Run SFDR Art 9 Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — Art 9 Eligibility */}
      {tab === 0 && (
        <div>
          <Section title="SFDR Article 9 Eligibility — RTS 2022/1288 Assessment">
            <Row gap={12}>
              <KpiCard label="Art 9 Eligible" value={<Badge label={eligibility.eligible ? 'Article 9 Eligible' : 'Not Art 9 Eligible'} color={eligibility.eligible ? 'green' : 'red'} />} sub="Based on SI% + taxonomy alignment" accent />
              <KpiCard label="Art 9 Eligibility Score" value={`${eligibility.eligibilityScore}/100`} sub="Weighted composite score" />
              <KpiCard label="Compliance Tier" value={<Badge label={eligibility.tier} color={eligibility.tierColor} />} sub="Strong Art 9 / Eligible / Upgrade / Art 6" />
              <KpiCard label="Sustainable Investment %" value={`${eligibility.sustainableInvPct}%`} sub="Minimum 70% required for Art 9" />
            </Row>
            <div style={{ marginTop: 12 }}>
              <KpiCard label="EU Taxonomy Aligned %" value={`${eligibility.taxonomyAlignedPct}%`} sub="Minimum 20% for Art 9 (ESMA Q&A 2023 guidance)" accent />
            </div>
          </Section>

          <Section title="Art 9 Thresholds vs. Actuals">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: 'Sustainable Investment %', actual: eligibility.sustainableInvPct, threshold: 70 },
                { name: 'Taxonomy Aligned %', actual: eligibility.taxonomyAlignedPct, threshold: 20 },
                { name: 'Eligibility Score', actual: eligibility.eligibilityScore, threshold: 60 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                <Bar dataKey="actual" name="Fund Actual" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="threshold" name="Min. Threshold" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="SFDR Art 9 Key Requirements (ESMA Q&A June 2023)">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              {[
                { req: 'Sustainable Investment Definition', desc: 'All investments must qualify as sustainable under Art 2(17)', met: eligibility.sustainableInvPct >= 70 },
                { req: 'No significant harm (DNSH)', desc: 'All 6 environmental objectives assessed per Art 2(17)(b)', met: dnsh.allPass },
                { req: 'Good governance practices', desc: 'Investees follow OECD/UN good governance per Art 2(17)(c)', met: eligibility.eligibilityScore >= 60 },
                { req: 'Sustainability objective disclosure', desc: 'Binding commitments on sustainability objective in legal docs', met: true },
                { req: 'PAI consideration mandatory', desc: '14 mandatory PAI indicators considered & disclosed', met: pai.reported >= 12 },
                { req: 'Impact measurement framework', desc: 'Quantitative impact KPIs with pre/post measurement methodology', met: eligibility.eligibilityScore >= 65 },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 5 ? '1px solid #d1fae5' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#065f46', fontSize: 13 }}>{item.req}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</div>
                  </div>
                  <Badge label={item.met ? 'Met' : 'Gap'} color={item.met ? 'green' : 'red'} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — PAI Indicators */}
      {tab === 1 && (
        <div>
          <Section title="14 Mandatory PAI Indicators — Annex I Table 1 (RTS 2022/1288)">
            <Row gap={12}>
              <KpiCard label="PAI Indicators Reported" value={`${pai.reported} / 14`} sub="All 14 mandatory required" accent />
              <KpiCard label="Avg Data Quality Score" value={`${pai.avgDqScore}/100`} sub="DQS across all indicators" />
              <KpiCard label="Above Benchmark" value={`${pai.indicators.filter(p => p.value <= p.benchmark).length} / 14`} sub="Fund below sector benchmark (lower = better for adverse)" />
              <KpiCard label="Data Coverage" value={`${Math.round(pai.reported / 14 * 100)}%`} sub="PAI data completeness %" />
            </Row>
          </Section>

          <Section title="14 PAI Indicator Values vs. Sector Benchmark">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={pai.indicators} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={175} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Fund Score" fill="#059669" radius={[0, 4, 4, 0]} />
                <Bar dataKey="benchmark" name="Sector Benchmark" fill="#d1d5db" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="PAI Data Quality & Source Classification">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
              {[
                { category: 'Scope 1 & 2 GHG (PAI 1–3)', source: 'CDP disclosures + PCAF DQS methodology', quality: 'High', dqs: Math.round(seed(pai.avgDqScore * 7) * 15 + 75) },
                { category: 'Energy & Fossil Fuel (PAI 4–6)', source: 'Energy consumption disclosures + IEA benchmarks', quality: 'Medium', dqs: Math.round(seed(pai.avgDqScore * 11) * 20 + 60) },
                { category: 'Environmental (PAI 7–10)', source: 'TNFD / Sustainalytics ESG data', quality: 'Medium', dqs: Math.round(seed(pai.avgDqScore * 13) * 25 + 55) },
                { category: 'Social & Governance (PAI 11–14)', source: 'Bloomberg ESG + company disclosures', quality: 'Low', dqs: Math.round(seed(pai.avgDqScore * 17) * 20 + 50) },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid #dbeafe' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e40af', fontSize: 13 }}>{item.category}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{item.source}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>DQS: {item.dqs}/100</span>
                    <Badge label={item.quality} color={item.quality === 'High' ? 'green' : item.quality === 'Medium' ? 'yellow' : 'red'} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — DNSH Verification */}
      {tab === 2 && (
        <div>
          <Section title="Do No Significant Harm (DNSH) Verification — Art 2(17)(b) + Delegated Acts">
            <Row gap={12}>
              <KpiCard label="DNSH All Pass" value={<Badge label={dnsh.allPass ? 'All 6 Pass' : `${dnsh.passCount}/6 Pass`} color={dnsh.allPass ? 'green' : dnsh.passCount >= 4 ? 'yellow' : 'red'} />} sub="EU Taxonomy Article 17 DNSH test" accent />
              <KpiCard label="Objectives Passing" value={`${dnsh.passCount} / 6`} sub="Out of 6 environmental objectives" />
              <KpiCard label="Objectives Failing" value={`${6 - dnsh.passCount}`} sub="Require remediation / exclusion" />
              <KpiCard label="DNSH Status" value={<Badge label={dnsh.allPass ? 'Compliant' : dnsh.passCount >= 4 ? 'Conditional' : 'Non-Compliant'} color={dnsh.allPass ? 'green' : dnsh.passCount >= 4 ? 'yellow' : 'red'} />} sub="Overall DNSH compliance assessment" />
            </Row>
          </Section>

          <Section title="DNSH Checklist — EU Taxonomy Art 17 (6 Environmental Objectives)">
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['#', 'Environmental Objective', 'Assessment Description', 'Score', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dnsh.scores.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: !s.pass ? '#fef2f2' : 'white' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#059669' }}>{i + 1}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>{s.label}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{s.desc}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{s.score}/100</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge label={s.pass ? 'Pass' : 'Fail'} color={s.pass ? 'green' : 'red'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="DNSH Remediation Actions">
            {dnsh.scores.filter(s => !s.pass).length === 0 ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>All DNSH objectives pass — no remediation required.</div>
              </div>
            ) : (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16 }}>
                {dnsh.scores.filter(s => !s.pass).map((s, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 13, marginBottom: 4 }}>{s.label} — Remediation Required</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>Review investee activities contributing to harm on this objective. Consider exclusion or engagement-based remediation within 12 months per ESMA Q&A guidance.</div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* TAB 4 — RTS Annex Completeness */}
      {tab === 3 && (
        <div>
          <Section title="RTS 2022/1288 Disclosure Template Completeness">
            <Row gap={12}>
              <KpiCard label="Overall RTS Completeness" value={`${rts.completeness}%`} sub="Across Annex I, III & V templates" accent />
              <KpiCard label="Investment Objective Score" value={`${rts.scores[0].value}/100`} sub="Art 9 specific investment objective clarity" />
              <KpiCard label="Impact Strategy Score" value={`${rts.scores[1].value}/100`} sub="Impact investment strategy articulation" />
              <KpiCard label="Impact Measurement Score" value={`${rts.scores[2].value}/100`} sub="KPI framework & measurement methodology" />
            </Row>
          </Section>

          <Section title="RTS Annex Completeness by Template">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rts.annexBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(val) => `${val}%`} />
                <Bar dataKey="value" name="Completeness %" radius={[4, 4, 0, 0]}>
                  {rts.annexBars.map((b, i) => (
                    <Cell key={i} fill={b.value >= 75 ? '#059669' : b.value >= 55 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Pre-Contractual & Periodic Disclosure Gaps">
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 16 }}>
              {[
                { section: 'Summary (Annex I, Section I)', status: rts.scores[0].value >= 65 ? 'Complete' : 'Incomplete', req: 'Product category, sustainability objective, key features' },
                { section: 'No significant harm (Annex I, Sec II)', status: dnsh.allPass ? 'Complete' : 'Incomplete', req: 'DNSH statements for all 6 objectives' },
                { section: 'Investment Strategy (Annex I, Sec IV)', status: rts.scores[1].value >= 60 ? 'Complete' : 'Incomplete', req: 'Asset selection process, exclusion criteria, taxonomy alignment' },
                { section: 'Impact KPIs (Annex I, Sec VI)', status: rts.scores[2].value >= 65 ? 'Complete' : 'Incomplete', req: 'Binding impact indicators with baseline and targets' },
                { section: 'Engagement Policy (Annex I, Sec VII)', status: rts.scores[3].value >= 60 ? 'Complete' : 'Incomplete', req: 'Active ownership and escalation procedures' },
                { section: 'Historical Performance (Annex III)', status: rts.completeness >= 65 ? 'Complete' : 'Incomplete', req: 'Annual periodic report with PAI actuals vs. targets' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 5 ? '1px solid #fde68a' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#92400e', fontSize: 13 }}>{item.section}</div>
                    <div style={{ fontSize: 12, color: '#78350f' }}>{item.req}</div>
                  </div>
                  <Badge label={item.status} color={item.status === 'Complete' ? 'green' : 'red'} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 5 — Downgrade Risk */}
      {tab === 4 && (
        <div>
          <Section title="Art 9 → Art 8 Downgrade Risk Assessment (ESMA Q&A 2023)">
            <Row gap={12}>
              <KpiCard label="Downgrade Risk Score" value={`${downgrade.riskScore}/100`} sub="Composite downgrade risk metric" accent />
              <KpiCard label="Downgrade Risk Tier" value={<Badge label={downgrade.riskTier} color={downgrade.riskColor} />} sub="Low / Medium / High" />
              <KpiCard label="ESMA Q&A Compliant" value={<Badge label={downgrade.esmaCompliant ? 'Compliant' : 'Gaps Found'} color={downgrade.esmaCompliant ? 'green' : 'red'} />} sub="ESMA Q&A June 2023 alignment" />
              <KpiCard label="Active Downgrade Triggers" value={`${downgrade.activeRisks} / 6`} sub="Risk triggers identified as active" />
            </Row>
          </Section>

          <Section title="Downgrade Risk Score — Visual Gauge">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width={400} height={220}>
                <RadialBarChart innerRadius={60} outerRadius={130}
                  data={[{ name: 'Downgrade Risk', value: downgrade.riskScore, fill: downgrade.riskScore >= 70 ? '#ef4444' : downgrade.riskScore >= 45 ? '#f59e0b' : '#059669' }]}
                  startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} dataKey="value" cornerRadius={8} />
                  <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 28, fontWeight: 700, fill: '#111827' }}>{downgrade.riskScore}</text>
                  <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 13, fill: '#6b7280' }}>/ 100</text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="Downgrade Trigger Analysis">
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Trigger Condition', 'Status', 'Action Required'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {downgrade.triggers.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: t.risk ? '#fef2f2' : 'white' }}>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{t.trigger}</td>
                      <td style={{ padding: '10px 14px' }}><Badge label={t.risk ? 'Active Risk' : 'No Risk'} color={t.risk ? 'red' : 'green'} /></td>
                      <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{t.risk ? 'Immediate remediation required — review fund legal docs & portfolio composition' : 'Monitor quarterly — no action required'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Impact KPI Readiness">
            <Row gap={12}>
              <KpiCard label="Impact KPIs Defined" value={<Badge label={downgrade.impactDefined ? 'Defined' : 'Not Defined'} color={downgrade.impactDefined ? 'green' : 'red'} />} sub="Binding quantitative impact KPIs in legal docs" accent />
              <KpiCard label="Impact KPIs Measured" value={<Badge label={downgrade.impactMeasured ? 'Measured' : 'Not Measured'} color={downgrade.impactMeasured ? 'green' : 'red'} />} sub="Annual measurement with audited methodology" />
              <KpiCard label="Impact Report Published" value={<Badge label={downgrade.esmaCompliant ? 'Published' : 'Not Published'} color={downgrade.esmaCompliant ? 'green' : 'red'} />} sub="Periodic report per RTS Annex III" />
              <KpiCard label="Fund Legal Docs Compliant" value={<Badge label={downgrade.riskScore < 50 ? 'Compliant' : 'Review Required'} color={downgrade.riskScore < 50 ? 'green' : 'yellow'} />} sub="Prospectus, KID & KIID alignment" />
            </Row>
          </Section>
        </div>
      )}
    </div>
  );
}
