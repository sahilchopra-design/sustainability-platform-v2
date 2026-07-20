import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from 'recharts';

// Backend E105 ESG Data Quality & Assurance engine (BCBS 239 / PCAF DQS /
// ESG provider coverage / ISAE 3000-3410 / ISSA 5000 / AA1000AS v3).
// See backend/services/esg_data_quality_assurance_engine.py +
// backend/api/v1/routes/esg_data_quality_assurance.py
const API = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:8001';
const DQ_API = `${API}/api/v1/esg-data-quality`;

const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; } return Math.abs(h); };
const seededRandom = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

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
const Chk = ({ label, checked, onChange }) => (
  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} id={label} />
    <label htmlFor={label} style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>{label}</label>
  </div>
);
const Section = ({ title, children, right }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c' }}>{title}</div>
      {right}
    </div>
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
// Live/Demo status badge — same convention as AIGovernancePage (E77):
// gray "Connecting…" while loading, green "● Live — computed by <engine>" on
// success, amber "○ Demo Data — API unavailable" fallback on failure.
const StatusBadge = ({ status, liveLabel, demoLabel }) => {
  if (status === 'loading') return <Badge label="Connecting…" color="gray" />;
  if (status === 'live') return <Badge label={`● Live — ${liveLabel}`} color="green" />;
  return <Badge label={`○ Demo Data — ${demoLabel}`} color="yellow" />;
};

const TABS = ['BCBS 239 Scores', 'Provider Coverage', 'DQS Scoring', 'Assurance Readiness', 'Gap Remediation'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const SECTORS = ['Banking', 'Insurance', 'Asset Management', 'Energy', 'Industrials', 'Real Estate', 'Technology', 'Agriculture'];

// Frontend sector labels -> backend ESG_PROVIDER_COVERAGE sector keys (E105).
const FRONTEND_TO_BACKEND_SECTOR = {
  Banking: 'Financials', Insurance: 'Financials', 'Asset Management': 'Financials',
  Energy: 'Energy', Industrials: 'Industrials', 'Real Estate': 'Real_Estate',
  Technology: 'Information_Technology', Agriculture: 'Materials',
};

const STANDARD_KEYS = ['ISAE_3000', 'ISAE_3410', 'ISSA_5000', 'AA1000AS_v3'];
const STANDARD_LABELS = { ISAE_3000: 'ISAE 3000', ISAE_3410: 'ISAE 3410', ISSA_5000: 'ISSA 5000', AA1000AS_v3: 'AA1000AS v3' };
const parseCostMid = (str) => {
  if (!str) return 0;
  const nums = String(str).replace(/,/g, '').match(/\d+/g);
  if (!nums || !nums.length) return 0;
  const vals = nums.map(Number);
  return vals.length > 1 ? Math.round((vals[0] + vals[1]) / 2) : vals[0];
};

// ── Demo (seeded) generators — only rendered as an explicit fallback when the
// live E105 engine is unreachable. Clearly badged "Demo Data" in the UI. ──
const getBCBSDataDemo = (entity, sector, framework) => {
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

const getProviderDataDemo = (entity, sector) => {
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

const getDQSDataDemo = (entity, sector, assurance) => {
  const base = hashStr(entity + sector + assurance + 'dqs');
  const s = (n) => seededRandom(base + n);
  const sc1 = parseFloat((s(1) * 1.5 + 1.5).toFixed(1));
  const sc2 = parseFloat((s(2) * 1.5 + 1.5).toFixed(1));
  const sc3 = parseFloat((s(3) * 2 + 2).toFixed(1));
  const weighted = parseFloat(((sc1 * 0.3 + sc2 * 0.3 + sc3 * 0.4)).toFixed(1));
  const dqsBar = [
    { ac: 'Scope 1', dqs: sc1 }, { ac: 'Scope 2', dqs: sc2 }, { ac: 'Scope 3', dqs: sc3 },
  ];
  const radialData = [
    { name: 'Scope 1', value: Math.round((5 - sc1) / 4 * 100), fill: '#059669' },
    { name: 'Scope 2', value: Math.round((5 - sc2) / 4 * 100), fill: '#3b82f6' },
    { name: 'Scope 3', value: Math.round((5 - sc3) / 4 * 100), fill: '#f59e0b' },
    { name: 'Overall', value: Math.round((5 - weighted) / 4 * 100), fill: '#8b5cf6' },
  ];
  return { sc1, sc2, sc3, weighted, dqsBar, radialData };
};

const getAssuranceDataDemo = (entity, framework) => {
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
  const costChartData = [
    { standard: 'ISAE3000', limited: Math.round(s(1) * 30000 + 30000), reasonable: Math.round(s(2) * 80000 + 100000) },
    { standard: 'ISSA5000', limited: Math.round(s(3) * 40000 + 60000), reasonable: Math.round(s(4) * 150000 + 200000) },
    { standard: 'AA1000AS', limited: Math.round(s(5) * 20000 + 20000), reasonable: Math.round(s(6) * 60000 + 80000) },
  ];
  return { rows, standards, costChartData };
};

const getGapDataDemo = (entity, sector, reportingYear) => {
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
  const [entityName, setEntityName] = useState('Acme Corp PLC');
  const [sector, setSector] = useState('Banking');
  const [framework, setFramework] = useState('CSRD');
  const [reportingYear, setReportingYear] = useState('2024');
  const [assuranceLevel, setAssuranceLevel] = useState('limited');
  const [scope1, setScope1] = useState(true);
  const [scope2, setScope2] = useState(true);
  const [scope3, setScope3] = useState(false);
  const [disclosedCount, setDisclosedCount] = useState(10);

  // --- Live backend wiring (E105 ESG Data Quality & Assurance Engine) ------
  const [liveResult, setLiveResult] = useState(null);
  const [liveStatus, setLiveStatus] = useState('loading'); // 'loading' | 'live' | 'demo'

  const buildDisclosedFields = useCallback(() => {
    const arr = [];
    if (scope1) arr.push('ghg_scope1');
    if (scope2) arr.push('ghg_scope2');
    if (scope3) arr.push('ghg_scope3');
    for (let i = 0; i < disclosedCount; i++) arr.push(`esg_indicator_${i}`);
    return arr;
  }, [scope1, scope2, scope3, disclosedCount]);

  const runAssess = useCallback(async (signal) => {
    setLiveStatus('loading');
    try {
      const { data } = await axios.post(`${DQ_API}/assess`, {
        entity_id: entityName || 'ENTITY-001',
        framework,
        reporting_year: parseInt(reportingYear, 10),
        disclosed_fields: buildDisclosedFields(),
        assurance_level: assuranceLevel,
      }, { timeout: 10000, signal });
      setLiveResult(data);
      setLiveStatus('live');
    } catch (e) {
      if (axios.isCancel && axios.isCancel(e)) return;
      setLiveStatus('demo');
    }
  }, [entityName, framework, reportingYear, assuranceLevel, buildDisclosedFields]);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => runAssess(controller.signal), 350);
    return () => { clearTimeout(t); controller.abort(); };
  }, [runAssess]);

  // --- Live: ESG provider coverage reference (GET /ref/provider-coverage) --
  const [providerLive, setProviderLive] = useState(null);
  const [providerStatus, setProviderStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setProviderStatus('loading');
    axios.get(`${DQ_API}/ref/provider-coverage`, { timeout: 10000 })
      .then(({ data }) => {
        if (cancelled) return;
        if (data && data.coverage_data) { setProviderLive(data); setProviderStatus('live'); }
        else setProviderStatus('demo');
      })
      .catch(() => { if (!cancelled) setProviderStatus('demo'); });
    return () => { cancelled = true; };
  }, []);

  // --- Live: assurance standards comparison (GET /ref/assurance-standards) -
  const [assuranceLive, setAssuranceLive] = useState(null);
  const [assuranceStatus, setAssuranceStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setAssuranceStatus('loading');
    axios.get(`${DQ_API}/ref/assurance-standards`, { timeout: 10000 })
      .then(({ data }) => { if (!cancelled && data && data.standards) { setAssuranceLive(data); setAssuranceStatus('live'); } else if (!cancelled) setAssuranceStatus('demo'); })
      .catch(() => { if (!cancelled) setAssuranceStatus('demo'); });
    return () => { cancelled = true; };
  }, []);

  // ── Section 1: BCBS 239 (live from /assess, demo fallback) ──────────────
  const bcbsDemo = getBCBSDataDemo(entityName, sector, framework);
  const bcbs = (liveStatus === 'live' && liveResult) ? (() => {
    const categories = Object.entries(liveResult.bcbs239_category_scores).map(([dimension, score]) => ({ dimension, score: Math.round(score / 5 * 100), raw: score }));
    const overall = Math.round(liveResult.bcbs239_overall_score / 5 * 100);
    const rawOverall = liveResult.bcbs239_overall_score;
    const tier = rawOverall >= 4.5 ? 'Optimising' : rawOverall >= 3.5 ? 'Quantitatively Managed' : rawOverall >= 2.5 ? 'Defined' : rawOverall >= 1.5 ? 'Managed' : 'Initial';
    const tierColor = rawOverall >= 4.5 ? 'purple' : rawOverall >= 3.5 ? 'green' : rawOverall >= 2.5 ? 'yellow' : rawOverall >= 1.5 ? 'orange' : 'red';
    const principles = liveResult.bcbs239_principle_detail.map(p => ({ principle: p.principle_id, name: p.name, score: Math.round(p.maturity_score / 5 * 100), maturityLevel: p.maturity_level }));
    return { categories, overall, tier, tierColor, principles, rawOverall, gapVsExpectation: liveResult.bcbs239_gap_vs_expectation, expectedMaturity: liveResult.framework_expected_maturity };
  })() : bcbsDemo;

  // ── Section 2: Provider Coverage (live ref data, demo fallback) ─────────
  const providerDemo = getProviderDataDemo(entityName, sector);
  const backendSector = FRONTEND_TO_BACKEND_SECTOR[sector] || 'Industrials';
  const provider = (providerStatus === 'live' && providerLive && providerLive.coverage_data[backendSector]) ? (() => {
    const cov = providerLive.coverage_data[backendSector];
    const providers = providerLive.providers; // ['CDP','MSCI','Bloomberg','Refinitiv','ISS']
    const dataTypes = providerLive.data_types;  // ['GHG','water','waste','diversity','board','remuneration','controversy']
    const chartData = providers.map(prov => {
      const row = { provider: prov };
      dataTypes.forEach(dt => { row[dt] = Math.round((cov[dt]?.[prov] || 0) * 100); });
      return row;
    });
    const gapRows = providers.map(prov => {
      const scores = dataTypes.map(dt => Math.round((cov[dt]?.[prov] || 0) * 100));
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const gaps = scores.filter(sc => sc < 60).length;
      return { provider: prov, avgScore, gaps, topGap: dataTypes[scores.indexOf(Math.min(...scores))] };
    });
    return { chartData, gapRows, dataTypes, providers };
  })() : providerDemo;

  // ── Section 3: DQS Scoring (live from /assess, demo fallback) ───────────
  const dqsDemo = getDQSDataDemo(entityName, sector, assuranceLevel);
  const dqs = (liveStatus === 'live' && liveResult) ? (() => {
    const { scope1: sc1, scope2: sc2, scope3: sc3 } = liveResult.pcaf_dqs_by_scope;
    const weighted = liveResult.pcaf_weighted_dqs;
    const dqsBar = [{ ac: 'Scope 1', dqs: sc1 }, { ac: 'Scope 2', dqs: sc2 }, { ac: 'Scope 3', dqs: sc3 }];
    const radialData = [
      { name: 'Scope 1', value: Math.round((5 - sc1) / 4 * 100), fill: '#059669' },
      { name: 'Scope 2', value: Math.round((5 - sc2) / 4 * 100), fill: '#3b82f6' },
      { name: 'Scope 3', value: Math.round((5 - sc3) / 4 * 100), fill: '#f59e0b' },
      { name: 'Overall', value: Math.round((5 - weighted) / 4 * 100), fill: '#8b5cf6' },
    ];
    return { sc1, sc2, sc3, weighted, dqsBar, radialData, tier: liveResult.overall_quality_tier };
  })() : dqsDemo;

  // ── Section 4: Assurance Readiness (live ref data, demo fallback) ───────
  const assuranceDemo = getAssuranceDataDemo(entityName, framework);
  const assurance = (assuranceStatus === 'live' && assuranceLive) ? (() => {
    const cm = assuranceLive.comparison_matrix;
    const costs = assuranceLive.cost_comparison_usd;
    const labels = STANDARD_KEYS.map(k => STANDARD_LABELS[k]);
    const rows = [
      { req: 'Issuer', vals: STANDARD_KEYS.map(k => cm[k]?.issuer || '—') },
      { req: 'Scope', vals: STANDARD_KEYS.map(k => cm[k]?.scope || '—') },
      { req: 'Mandatory for', vals: STANDARD_KEYS.map(k => cm[k]?.mandatory_for || '—') },
      { req: 'Cost — Limited (USD)', vals: STANDARD_KEYS.map(k => costs[`${k}_limited`] || costs[`${k}_type1`] || 'n/a') },
      { req: 'Cost — Reasonable (USD)', vals: STANDARD_KEYS.map(k => costs[`${k}_reasonable`] || costs[`${k}_type2`] || 'n/a') },
    ];
    const costChartData = STANDARD_KEYS.map(k => ({
      standard: STANDARD_LABELS[k],
      limited: parseCostMid(costs[`${k}_limited`] || costs[`${k}_type1`]),
      reasonable: parseCostMid(costs[`${k}_reasonable`] || costs[`${k}_type2`]),
    }));
    return { rows, standards: labels, costChartData, csrdPhasing: assuranceLive.csrd_phasing };
  })() : assuranceDemo;

  // ── Section 5: Gap Remediation (live from /assess, demo fallback) ───────
  const gapDemo = getGapDataDemo(entityName, sector, reportingYear);
  const gap = (liveStatus === 'live' && liveResult) ? (() => {
    const riskCounts = {};
    liveResult.gap_analysis.forEach(g => { riskCounts[g.gap_risk] = (riskCounts[g.gap_risk] || 0) + 1; });
    const pieData = Object.entries(riskCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    const priorityLabel = (p) => (p === 'P0' || p === 'P1') ? 'High' : p === 'P2' ? 'Medium' : 'Low';
    const gaps = liveResult.gap_analysis.map(g => {
      const rem = liveResult.remediation_plan.find(r => r.field === g.field);
      return {
        gap: g.field.replace(/_/g, ' '),
        impact: Math.round(g.materiality_weight * 100),
        effort: rem ? Math.min(100, Math.round(rem.timeline_weeks * 3)) : (g.remediation_priority === 'P0' ? 90 : g.remediation_priority === 'P1' ? 70 : 50),
        priority: priorityLabel(g.remediation_priority),
        notes: g.notes,
      };
    }).sort((a, b) => b.impact - a.impact);
    const barData = gaps.map(g => ({ gap: g.gap.split(' ').slice(0, 3).join(' '), impact: g.impact }));
    return { pieData, gaps, barData };
  })() : gapDemo;

  const inputPanel = (
    <Section title="ESG Data Quality Inputs" right={<StatusBadge status={liveStatus} liveLabel="scored by /api/v1/esg-data-quality/assess (BCBS 239 + PCAF DQS)" demoLabel="ESG Data Quality API unavailable, showing seeded illustrative figures" />}>
      <Row>
        <Inp label="Entity ID / Name" value={entityName} onChange={setEntityName} />
        <Sel label="Sector" value={sector} onChange={setSector} options={SECTORS.map(s => ({ value: s, label: s }))} />
        <Sel label="Framework" value={framework} onChange={setFramework} options={['CSRD', 'ISSB', 'TCFD', 'SFDR', 'GRI', 'CDP', 'EU_TAX', 'PCAF'].map(f => ({ value: f, label: f }))} />
        <Sel label="Reporting Year" value={reportingYear} onChange={setReportingYear} options={['2023', '2024', '2025'].map(y => ({ value: y, label: y }))} />
        <Sel label="Assurance Level" value={assuranceLevel} onChange={setAssuranceLevel} options={[
          { value: 'none', label: 'None' }, { value: 'limited', label: 'Limited' }, { value: 'reasonable', label: 'Reasonable' },
        ]} />
      </Row>
      <Row gap={12}>
        <Chk label="Scope 1 disclosed" checked={scope1} onChange={setScope1} />
        <Chk label="Scope 2 disclosed" checked={scope2} onChange={setScope2} />
        <Chk label="Scope 3 disclosed" checked={scope3} onChange={setScope3} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Other Disclosed Indicators: {disclosedCount}</div>
          <input type="range" min={0} max={30} value={disclosedCount} onChange={e => setDisclosedCount(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
        </div>
      </Row>
      <Btn onClick={() => runAssess()}>{liveStatus === 'loading' ? 'Assessing…' : 'Re-run Assessment'}</Btn>
    </Section>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>ESG Data Quality Engine</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>BCBS 239 Principles · Provider Coverage · PCAF DQS · Assurance Readiness · Gap Remediation</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {/* TAB 1 — BCBS 239 Scores */}
      {tab === 0 && (
        <div>
          {inputPanel}
          <Section title="BCBS 239 Summary">
            <Row gap={12}>
              <KpiCard label="Overall BCBS 239 Score" value={`${bcbs.overall}/100`} sub={liveStatus === 'live' ? `Maturity ${bcbs.rawOverall.toFixed(1)}/5 · 14-principle weighted composite` : '14-principle weighted composite'} accent />
              <KpiCard label="Overall Tier" value={<Badge label={bcbs.tier} color={bcbs.tierColor} />} sub={liveStatus === 'live' ? 'CMMI-style maturity level' : 'Platinum / Gold / Silver / Bronze'} />
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
          <Section title="Provider × Data Type Coverage Scores (%)" right={<StatusBadge status={providerStatus} liveLabel={`GET /ref/provider-coverage (${backendSector})`} demoLabel="Provider Coverage API unavailable" />}>
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
              <KpiCard label="Weighted DQS" value={dqs.weighted} sub={liveStatus === 'live' ? `Quality tier: ${dqs.tier}` : 'Blended portfolio-level score'} />
            </Row>
          </Section>
          <Row>
            <Section title={liveStatus === 'live' ? 'DQS by GHG Scope' : 'DQS by Asset Class'}>
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
          <Section title="Assurance Standard Comparison" right={<StatusBadge status={assuranceStatus} liveLabel="GET /ref/assurance-standards (ISAE 3000/3410, ISSA 5000, AA1000AS v3)" demoLabel="Assurance Standards API unavailable" />}>
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
                    {r.vals.map((v, vi) => <td key={vi} style={{ padding: '8px 12px', color: '#6b7280' }}>{typeof v === 'number' ? `$${v.toLocaleString()}` : v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Assurance Cost Comparison (USD, midpoint of typical range)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assurance.costChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="standard" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => `$${Number(val).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="limited" name="Limited Assurance" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reasonable" name="Reasonable Assurance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Gap Remediation */}
      {tab === 4 && (
        <div>
          {inputPanel}
          <Row>
            <Section title={liveStatus === 'live' ? 'Gap Risk Distribution' : 'Gap Type Distribution'}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={gap.pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {gap.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} ${liveStatus === 'live' ? 'fields' : 'data points'}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Top Gaps by Impact Score">
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
                    <td style={{ padding: '8px 12px', color: '#1b3a5c' }}>{g.impact}/100</td>
                    <td style={{ padding: '8px 12px', color: '#1b3a5c' }}>{g.effort}/100</td>
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
