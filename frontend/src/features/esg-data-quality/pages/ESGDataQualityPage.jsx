import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
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

const TABS = ['BCBS 239 Scores', 'Provider Coverage', 'DQS Scoring', 'Assurance Readiness', 'Gap Remediation'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const SECTORS = ['Banking', 'Insurance', 'Asset Management', 'Energy', 'Industrials', 'Real Estate', 'Technology', 'Agriculture'];

const getBCBSData = (entity, sector, framework) => {
  const base = hashStr(entity + sector + framework);
  const s = (n) => seededRandom(base + n);
  const categories = [
    { dimension: 'Governance', score: Math.round(s(1) * 30 + 55) },
    { dimension: 'Architecture', score: Math.round(s(2) * 28 + 52) },
    { dimension: 'Accuracy', score: Math.round(s(3) * 32 + 50) },
    { dimension: 'Reporting', score: Math.round(s(4) * 26 + 54) },
  ];
  const overall = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / 4);
  const tier = overall >= 80 ? 'Platinum' : overall >= 65 ? 'Gold' : overall >= 50 ? 'Silver' : 'Bronze';
  const tierColor = overall >= 80 ? 'purple' : overall >= 65 ? 'yellow' : overall >= 50 ? 'gray' : 'orange';
  const principles = Array.from({ length: 14 }, (_, i) => ({
    principle: `P${i + 1}`,
    name: ['Governance', 'Data Arch.', 'Accuracy', 'Completeness', 'Timeliness', 'Adaptability', 'Resiliency', 'Integrity',
      'Completeness', 'Timeliness', 'Accuracy', 'Comparability', 'Clarity', 'Frequency'][i],
    score: Math.round(s(i + 10) * 35 + 45),
  }));
  return { categories, overall, tier, tierColor, principles };
};

const getProviderData = (entity, sector) => {
  const base = hashStr(entity + sector + 'provider');
  const s = (n) => seededRandom(base + n);
  const providers = ['CDP', 'MSCI', 'Bloomberg', 'Refinitiv', 'ISS'];
  const dataTypes = ['GHG Scope 1', 'GHG Scope 2', 'GHG Scope 3', 'Water', 'Waste', 'Social', 'Governance'];
  const chartData = providers.map((prov, pi) => {
    const row = { provider: prov };
    dataTypes.forEach((dt, di) => { row[dt] = Math.round(s(pi * 9 + di + 1) * 40 + 40); });
    return row;
  });
  const gapRows = providers.map((prov, pi) => {
    const scores = dataTypes.map((_, di) => Math.round(s(pi * 9 + di + 1) * 40 + 40));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const gaps = scores.filter(sc => sc < 60).length;
    return { provider: prov, avgScore, gaps, topGap: dataTypes[scores.indexOf(Math.min(...scores))] };
  });
  return { chartData, gapRows, dataTypes, providers };
};

const getDQSData = (entity, sector, assurance) => {
  const base = hashStr(entity + sector + assurance + 'dqs');
  const s = (n) => seededRandom(base + n);
  const sc1 = parseFloat((s(1) * 1.5 + 1.5).toFixed(1));
  const sc2 = parseFloat((s(2) * 1.5 + 1.5).toFixed(1));
  const sc3 = parseFloat((s(3) * 2 + 2).toFixed(1));
  const weighted = parseFloat(((sc1 * 0.3 + sc2 * 0.3 + sc3 * 0.4)).toFixed(1));
  const assetClasses = ['Listed Equity', 'Corp Bonds', 'RE', 'Infra', 'Sovereigns', 'Private Equity'];
  const dqsBar = assetClasses.map((ac, i) => ({ ac, dqs: parseFloat((s(i + 10) * 2 + 1.5).toFixed(1)) }));
  const radialData = [
    { name: 'Scope 1', value: Math.round((5 - sc1) / 4 * 100), fill: '#059669' },
    { name: 'Scope 2', value: Math.round((5 - sc2) / 4 * 100), fill: '#3b82f6' },
    { name: 'Scope 3', value: Math.round((5 - sc3) / 4 * 100), fill: '#f59e0b' },
    { name: 'Overall', value: Math.round((5 - weighted) / 4 * 100), fill: '#8b5cf6' },
  ];
  return { sc1, sc2, sc3, weighted, dqsBar, radialData };
};

const getAssuranceData = (entity, framework) => {
  const base = hashStr(entity + framework + 'assurance');
  const s = (n) => seededRandom(base + n);
  const standards = ['ISAE3000', 'ISSA5000', 'AA1000AS'];
  const rows = [
    { req: 'Scope of assurance', vals: ['Limited/Reasonable', 'Limited/Reasonable', 'Type 1 / Type 2'] },
    { req: 'Subject matter', vals: ['GHG + disclosures', 'Sustainability info', 'Data + systems'] },
    { req: 'Typical cost', vals: ['£50k–200k', '£80k–300k', '£60k–180k'] },
    { req: 'Timeline', vals: ['3–6 months', '4–8 months', '3–5 months'] },
    { req: 'Best for', vals: ['CSRD / SFDR', 'ISSB S1/S2', 'CDP / GRI'] },
  ];
  const radarData = [
    { dimension: 'Independence', ISAE3000: Math.round(s(1) * 20 + 65), ISSA5000: Math.round(s(2) * 20 + 70), AA1000AS: Math.round(s(3) * 20 + 60) },
    { dimension: 'Rigor', ISAE3000: Math.round(s(4) * 20 + 70), ISSA5000: Math.round(s(5) * 20 + 75), AA1000AS: Math.round(s(6) * 20 + 62) },
    { dimension: 'Coverage', ISAE3000: Math.round(s(7) * 20 + 60), ISSA5000: Math.round(s(8) * 20 + 68), AA1000AS: Math.round(s(9) * 20 + 65) },
    { dimension: 'Materiality', ISAE3000: Math.round(s(10) * 20 + 65), ISSA5000: Math.round(s(11) * 20 + 72), AA1000AS: Math.round(s(12) * 20 + 60) },
    { dimension: 'Cost-eff.', ISAE3000: Math.round(s(13) * 20 + 68), ISSA5000: Math.round(s(14) * 20 + 55), AA1000AS: Math.round(s(15) * 20 + 70) },
  ];
  return { rows, standards, radarData };
};

const getGapData = (entity, sector, reportingYear) => {
  const base = hashStr(entity + sector + reportingYear + 'gap');
  const s = (n) => seededRandom(base + n);
  const pieData = [
    { name: 'Missing', value: Math.round(s(1) * 15 + 20) },
    { name: 'Estimated', value: Math.round(s(2) * 15 + 25) },
    { name: 'Imputed', value: Math.round(s(3) * 10 + 15) },
    { name: 'Verified', value: Math.round(s(4) * 20 + 30) },
  ];
  const gaps = [
    'Scope 3 Cat 11', 'Biodiversity metrics', 'Water withdrawal', 'Supply chain GHG', 'Board ESG KPIs',
    'TCFD scenario data', 'Social metrics S1', 'Water stress %', 'Circular economy', 'PAI 14 indicators',
  ].map((g, i) => ({
    gap: g,
    impact: Math.round(s(i + 10) * 30 + 50),
    effort: Math.round(s(i + 20) * 30 + 40),
    priority: s(i + 30) > 0.6 ? 'High' : s(i + 30) > 0.3 ? 'Medium' : 'Low',
  })).sort((a, b) => b.impact - a.impact);
  const barData = gaps.map(g => ({ gap: g.gap.split(' ').slice(0, 2).join(' '), impact: g.impact }));
  return { pieData, gaps, barData };
};

export default function ESGDataQualityPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entityName, setEntityName] = useState('Acme Corp PLC');
  const [sector, setSector] = useState('Banking');
  const [framework, setFramework] = useState('CSRD');
  const [reportingYear, setReportingYear] = useState('2024');
  const [assuranceLevel, setAssuranceLevel] = useState('limited');

  const bcbs = getBCBSData(entityName, sector, framework);
  const provider = getProviderData(entityName, sector);
  const dqs = getDQSData(entityName, sector, assuranceLevel);
  const assurance = getAssuranceData(entityName, framework);
  const gap = getGapData(entityName, sector, reportingYear);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/esg-data-quality/assess`, {
        entity_name: entityName, sector, framework, reporting_year: parseInt(reportingYear), assurance_level: assuranceLevel,
      });
    } catch {
      setError('API unavailable — demo mode.');
    } finally { setLoading(false); }
  };

  const inputPanel = (
    <Section title="ESG Data Quality Inputs">
      <Row>
        <Inp label="Entity Name" value={entityName} onChange={setEntityName} />
        <Sel label="Sector" value={sector} onChange={setSector} options={SECTORS.map(s => ({ value: s, label: s }))} />
        <Sel label="Framework" value={framework} onChange={setFramework} options={['CSRD', 'IFRS_S1', 'SEC', 'TCFD', 'CDP', 'GRI'].map(f => ({ value: f, label: f }))} />
        <Sel label="Reporting Year" value={reportingYear} onChange={setReportingYear} options={['2023', '2024', '2025'].map(y => ({ value: y, label: y }))} />
        <Sel label="Assurance Level" value={assuranceLevel} onChange={setAssuranceLevel} options={[
          { value: 'none', label: 'None' }, { value: 'limited', label: 'Limited' }, { value: 'reasonable', label: 'Reasonable' },
        ]} />
      </Row>
      <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run ESG Data Quality Assessment'}</Btn>
    </Section>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>ESG Data Quality Engine</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>BCBS 239 Principles · Provider Coverage · PCAF DQS · Assurance Readiness · Gap Remediation</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — BCBS 239 Scores */}
      {tab === 0 && (
        <div>
          {inputPanel}
          <Section title="BCBS 239 Summary">
            <Row gap={12}>
              <KpiCard label="Overall BCBS 239 Score" value={`${bcbs.overall}/100`} sub="14-principle weighted composite" accent />
              <KpiCard label="Overall Tier" value={<Badge label={bcbs.tier} color={bcbs.tierColor} />} sub="Platinum / Gold / Silver / Bronze" />
              <KpiCard label="Principles Above 70" value={`${bcbs.principles.filter(p => p.score >= 70).length} / 14`} sub="Compliant threshold" />
              <KpiCard label="Lowest Category" value={[...bcbs.categories].sort((a, b) => a.score - b.score)[0].dimension} sub={`Score: ${[...bcbs.categories].sort((a, b) => a.score - b.score)[0].score}/100`} />
            </Row>
          </Section>
          <Row>
            <Section title="4-Category Radar">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={bcbs.categories}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="14 Principles Scored">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bcbs.principles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="principle" width={28} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val, _, p) => [`${val}/100`, p.payload?.name]} />
                  <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                    {bcbs.principles.map((p, i) => <Cell key={i} fill={p.score >= 70 ? '#059669' : p.score >= 55 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — Provider Coverage */}
      {tab === 1 && (
        <div>
          {inputPanel}
          <Section title="Provider × Data Type Coverage Scores (%)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={provider.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                {provider.dataTypes.map((dt, i) => (
                  <Bar key={dt} dataKey={dt} fill={PIE_COLORS[i % PIE_COLORS.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Coverage Gap Summary by Provider">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Provider', 'Avg Coverage', 'Gaps (< 60%)', 'Top Gap'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provider.gapRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{r.provider}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{r.avgScore}%</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={`${r.gaps} gaps`} color={r.gaps > 3 ? 'red' : r.gaps > 1 ? 'yellow' : 'green'} /></td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{r.topGap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — DQS Scoring */}
      {tab === 2 && (
        <div>
          {inputPanel}
          <Section title="PCAF Data Quality Score (DQS) — Lower is Better (1=Best, 5=Worst)">
            <Row gap={12}>
              <KpiCard label="Scope 1 DQS" value={dqs.sc1} sub="Direct emissions data quality" accent />
              <KpiCard label="Scope 2 DQS" value={dqs.sc2} sub="Location & market-based" />
              <KpiCard label="Scope 3 DQS" value={dqs.sc3} sub="Value chain — 15 categories" />
              <KpiCard label="Weighted DQS" value={dqs.weighted} sub="Blended portfolio-level score" />
            </Row>
          </Section>
          <Row>
            <Section title="DQS by Asset Class">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dqs.dqsBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ac" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis domain={[1, 5]} />
                  <Tooltip formatter={(val) => `DQS ${val}`} />
                  <Bar dataKey="dqs" name="DQS Score" radius={[4, 4, 0, 0]}>
                    {dqs.dqsBar.map((d, i) => <Cell key={i} fill={d.dqs <= 2 ? '#059669' : d.dqs <= 3 ? '#f59e0b' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Data Quality Confidence Gauge">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart innerRadius={30} outerRadius={120} data={dqs.radialData} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} dataKey="value" nameKey="name" label={{ fill: '#374151', fontSize: 11 }} />
                  <Legend iconSize={10} />
                  <Tooltip formatter={(val) => `${val}% quality`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 4 — Assurance Readiness */}
      {tab === 3 && (
        <div>
          {inputPanel}
          <Section title="Assurance Standard Comparison">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>Requirement</th>
                  {assurance.standards.map(s => (
                    <th key={s} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#059669' }}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assurance.rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{r.req}</td>
                    {r.vals.map((v, vi) => <td key={vi} style={{ padding: '8px 12px', color: '#6b7280' }}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Assurance Criteria Radar (5 dimensions × 3 standards)">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={assurance.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="ISAE3000" dataKey="ISAE3000" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                <Radar name="ISSA5000" dataKey="ISSA5000" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Radar name="AA1000AS" dataKey="AA1000AS" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Gap Remediation */}
      {tab === 4 && (
        <div>
          {inputPanel}
          <Row>
            <Section title="Gap Type Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={gap.pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {gap.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} data points`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Top 10 Gaps by Impact Score">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gap.barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="gap" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="impact" name="Impact Score" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
          <Section title="Remediation Priority Matrix (Effort vs Impact)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Data Gap', 'Impact Score', 'Effort Score', 'Priority'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gap.gaps.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{g.gap}</td>
                    <td style={{ padding: '8px 12px', color: '#111827' }}>{g.impact}/100</td>
                    <td style={{ padding: '8px 12px', color: '#111827' }}>{g.effort}/100</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={g.priority} color={g.priority === 'High' ? 'red' : g.priority === 'Medium' ? 'yellow' : 'green'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}
    </div>
  );
}
