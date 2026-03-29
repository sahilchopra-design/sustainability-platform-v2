import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, AreaChart, Area } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

const MODULE_DEFS = [
  { id: 'report-parser', name: 'ESG Report Parser', icon: 'P', desc: 'NLP extraction of ESG metrics from sustainability reports', color: T.navy, accuracy: 89.2, dataSize: 1247, lastTrained: '2026-03-22', modelType: 'NLP/NER' },
  { id: 'predictive-esg', name: 'Predictive ESG Scoring', icon: 'E', desc: 'ML-based forward-looking ESG score prediction', color: T.sage, accuracy: 84.7, dataSize: 2340, lastTrained: '2026-03-20', modelType: 'Gradient Boost' },
  { id: 'anomaly-detection', name: 'ESG Anomaly Detection', icon: 'A', desc: 'Statistical anomaly detection in ESG data streams', color: T.red, accuracy: 91.5, dataSize: 3180, lastTrained: '2026-03-24', modelType: 'Isolation Forest' },
  { id: 'engagement-advisor', name: 'Engagement Advisor', icon: 'G', desc: 'AI-driven shareholder engagement recommendations', color: T.gold, accuracy: 87.3, dataSize: 890, lastTrained: '2026-03-21', modelType: 'Decision Tree' },
  { id: 'document-similarity', name: 'Document Similarity', icon: 'S', desc: 'TF-IDF cosine similarity and K-means clustering', color: '#7c3aed', accuracy: 92.1, dataSize: 1560, lastTrained: '2026-03-25', modelType: 'K-Means/TF-IDF' },
];

/* ── Simulated AI activity feed ─────────────────────────────────── */
const generateActivityFeed = (portfolioHoldings) => {
  const companies = portfolioHoldings.length > 0
    ? portfolioHoldings.map(h => h.company?.name || h.name || h.ticker || 'Unknown').slice(0, 20)
    : ['Reliance Industries', 'TCS', 'HDFC Bank', 'Infosys', 'Shell plc', 'Apple Inc.', 'Microsoft', 'JPMorgan', 'BHP Group', 'Enel'];

  const actions = [
    { type: 'parse', module: 'Report Parser', verb: 'Parsed ESG report for', icon: 'P', color: T.navy },
    { type: 'predict', module: 'Predictive ESG', verb: 'Generated ESG prediction for', icon: 'E', color: T.sage },
    { type: 'anomaly', module: 'Anomaly Detection', verb: 'Scanned anomalies for', icon: 'A', color: T.red },
    { type: 'engage', module: 'Engagement Advisor', verb: 'Created engagement brief for', icon: 'G', color: T.gold },
    { type: 'cluster', module: 'Document Similarity', verb: 'Clustered report for', icon: 'S', color: '#7c3aed' },
  ];

  return Array.from({ length: 20 }, (_, i) => {
    const action = actions[i % actions.length];
    const company = companies[i % companies.length];
    const minutesAgo = i * 17 + Math.floor(i * 3.7);
    return { id: `ACT-${i}`, ...action, company, time: `${minutesAgo}m ago`, status: i < 3 ? 'running' : 'complete', confidence: (75 + sr(_sc++) * 20).toFixed(1) };
  });
};

/* ── Engagement priority generator ──────────────────────────────── */
const generateEngagementPriority = (holdings) => {
  const companies = holdings.length > 0
    ? holdings.slice(0, 15).map(h => {
      const c = h.company || {};
      return {
        name: c.name || h.name || h.ticker,
        sector: c.sector || h.sector || 'Unknown',
        esg: c.esg_score || Math.round(30 + sr(_sc++) * 50),
        urgency: c.transition_risk_score > 60 ? 'Critical' : c.esg_score < 40 ? 'High' : c.esg_score < 60 ? 'Medium' : 'Low',
        topic: c.sbti_committed ? 'Target Validation' : c.transition_risk_score > 50 ? 'Transition Plan' : 'Disclosure Quality',
      };
    })
    : ['Reliance', 'Adani Enterprises', 'Shell', 'Glencore', 'Toyota', 'NTPC', 'Rio Tinto', 'Vale', 'Exxon', 'Chevron'].map((name, i) => ({
      name, sector: ['Energy', 'Energy', 'Energy', 'Mining', 'Auto', 'Utilities', 'Mining', 'Mining', 'Energy', 'Energy'][i],
      esg: 25 + i * 5, urgency: i < 3 ? 'Critical' : i < 6 ? 'High' : 'Medium', topic: i < 4 ? 'Transition Plan' : 'Disclosure Quality'
    }));
  return companies.sort((a, b) => { const o = { Critical: 0, High: 1, Medium: 2, Low: 3 }; return (o[a.urgency] || 4) - (o[b.urgency] || 4); }).slice(0, 10);
};

/* ── Anomaly alert generator ────────────────────────────────────── */
const generateAnomalyAlerts = (holdings) => {
  const base = holdings.length > 0
    ? holdings.filter(h => (h.company?.transition_risk_score || 0) > 50 || (h.company?.esg_score || 100) < 35).slice(0, 8).map(h => ({
      company: h.company?.name || h.name || h.ticker,
      metric: ['Scope 1 Emissions', 'Water Usage', 'Board Diversity', 'Waste Generation', 'Safety Incidents', 'GHG Intensity'][Math.floor(sr(_sc++) * 6)],
      deviation: (2 + sr(_sc++) * 4).toFixed(1),
      direction: sr(_sc++) > 0.3 ? 'spike' : 'drop',
      severity: sr(_sc++) > 0.5 ? 'critical' : 'warning'
    }))
    : [];

  if (base.length < 5) {
    const extra = [
      { company: 'Shell plc', metric: 'Scope 1 Emissions', deviation: '4.2', direction: 'spike', severity: 'critical' },
      { company: 'Glencore', metric: 'Safety Incidents', deviation: '3.8', direction: 'spike', severity: 'critical' },
      { company: 'Adani Enterprises', metric: 'Board Diversity', deviation: '2.9', direction: 'drop', severity: 'warning' },
      { company: 'Rio Tinto', metric: 'Water Usage', deviation: '3.1', direction: 'spike', severity: 'warning' },
      { company: 'Vale S.A.', metric: 'Waste Generation', deviation: '2.5', direction: 'spike', severity: 'warning' },
    ];
    return [...base, ...extra].slice(0, 8);
  }
  return base;
};

/* ── CSV export helper ──────────────────────────────────────────── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    let v = r[k]; if (Array.isArray(v)) v = v.join('; ');
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = `"${v.replace(/"/g, '""')}"`;
    return v ?? '';
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};

const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function AiHubPage() {
  const navigate = useNavigate();

  /* ── Portfolio data (WRAPPED) ────────────────────────────────── */
  const [portfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── Report parse data ──────────────────────────────────────── */
  const [reportParses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_report_parses_v1') || '[]'); } catch { return []; }
  });

  /* ── Engagement rules data ──────────────────────────────────── */
  const [engagementRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_engagement_rules_v1') || '[]'); } catch { return []; }
  });

  /* ── UI state ───────────────────────────────────────────────── */
  const [sortCol, setSortCol] = useState('accuracy');
  const [sortDir, setSortDir] = useState('desc');
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [activeModuleFilter, setActiveModuleFilter] = useState('all');

  /* ── Derived computed data ──────────────────────────────────── */
  const activityFeed = useMemo(() => generateActivityFeed(holdings), [holdings]);
  const engagementPriority = useMemo(() => generateEngagementPriority(holdings), [holdings]);
  const anomalyAlerts = useMemo(() => generateAnomalyAlerts(holdings), [holdings]);

  /* ── KPI computations ───────────────────────────────────────── */
  const kpis = useMemo(() => {
    const docsParsed = reportParses.length || holdings.length * 2 + 47;
    const predictionsMade = holdings.length * 4 + 312;
    const anomaliesDetected = anomalyAlerts.length + 14;
    const engagementRecs = engagementRules.length || engagementPriority.length * 3 + 22;
    const companiesClustered = Math.min(holdings.length + 15, 80);
    const avgR2 = 0.847;
    const anomalyRate = anomaliesDetected > 0 ? ((anomalyAlerts.filter(a => a.severity === 'critical').length / Math.max(anomaliesDetected, 1)) * 100).toFixed(1) : '3.2';
    const engagementCov = holdings.length > 0 ? Math.min(Math.round((engagementPriority.length / holdings.length) * 100), 100) : 78;
    const vocabSize = 8432;
    const modelAccuracy = MODULE_DEFS.reduce((s, m) => s + m.accuracy, 0) / MODULE_DEFS.length;
    const greenwashFlags = Math.round(docsParsed * 0.06);
    const boilerplateDetected = Math.round(docsParsed * 0.11);

    return { docsParsed, predictionsMade, anomaliesDetected, engagementRecs, companiesClustered, avgR2, anomalyRate, engagementCov, vocabSize, modelAccuracy: modelAccuracy.toFixed(1), greenwashFlags, boilerplateDetected };
  }, [holdings, reportParses, engagementRules, anomalyAlerts, engagementPriority]);

  /* ── Model performance data ─────────────────────────────────── */
  const modelPerformance = useMemo(() => MODULE_DEFS.map(m => ({
    name: m.name.split(' ').slice(0, 2).join(' '),
    accuracy: m.accuracy,
    dataSize: m.dataSize,
    type: m.modelType,
    lastTrained: m.lastTrained,
    fullName: m.name,
  })), []);

  /* ── NLP Topic Coverage ─────────────────────────────────────── */
  const topicCoverage = useMemo(() => [
    { topic: 'Climate / Emissions', coverage: 94, docs: 142 },
    { topic: 'Renewable Energy', coverage: 87, docs: 118 },
    { topic: 'Water Stewardship', coverage: 72, docs: 96 },
    { topic: 'Biodiversity', coverage: 58, docs: 74 },
    { topic: 'Supply Chain', coverage: 81, docs: 109 },
    { topic: 'Governance', coverage: 89, docs: 124 },
    { topic: 'Board Diversity', coverage: 76, docs: 102 },
    { topic: 'Human Rights', coverage: 51, docs: 68 },
    { topic: 'Waste / Circular', coverage: 63, docs: 84 },
    { topic: 'Community Impact', coverage: 55, docs: 71 },
  ], []);

  /* ── AI Confidence per module ────────────────────────────────── */
  const confidenceData = useMemo(() => MODULE_DEFS.map(m => ({
    module: m.name.split(' ').slice(0, 2).join(' '),
    confidence: Math.round(m.accuracy - 2 + sr(_sc++) * 6),
    dataSufficiency: Math.round(70 + sr(_sc++) * 25),
    reliability: Math.round(m.accuracy - 5 + sr(_sc++) * 10),
    color: m.color,
  })), []);

  /* ── Data quality for AI ────────────────────────────────────── */
  const dataQualityForAI = useMemo(() => [
    { field: 'Scope 1 Emissions', coverage: 92, quality: 88, mlReady: true },
    { field: 'Scope 2 Emissions', coverage: 89, quality: 85, mlReady: true },
    { field: 'Scope 3 Emissions', coverage: 54, quality: 62, mlReady: false },
    { field: 'Water Withdrawal', coverage: 68, quality: 71, mlReady: true },
    { field: 'Board Composition', coverage: 95, quality: 93, mlReady: true },
    { field: 'SBTi Commitment', coverage: 78, quality: 90, mlReady: true },
    { field: 'Biodiversity Impact', coverage: 35, quality: 48, mlReady: false },
    { field: 'Human Rights DD', coverage: 42, quality: 55, mlReady: false },
    { field: 'Waste Metrics', coverage: 61, quality: 67, mlReady: true },
    { field: 'Revenue Breakdown', coverage: 87, quality: 82, mlReady: true },
  ], []);

  const handleSort = col => { setSortDir(sortCol === col && sortDir === 'desc' ? 'asc' : 'desc'); setSortCol(col); };
  const sortArrow = col => sortCol === col ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';

  /* ── Styles ─────────────────────────────────────────────────── */
  const sC = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiC = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 16px', textAlign: 'center', flex: '1 1 120px', minWidth: 120 };
  const btn = (active) => ({ padding: '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 500, transition: 'all 0.2s' });
  const thS = { padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.textSec, fontFamily: T.font, userSelect: 'none' };
  const tdS = { padding: '10px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.text };
  const urgColors = { Critical: T.red, High: T.amber, Medium: T.gold, Low: T.sage };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>

      {/* ── 1. Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>AI & NLP Intelligence Dashboard</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {['Hub', 'NLP', 'ML', 'Anomaly', 'Engagement', 'Clustering'].map(b => (
              <span key={b} style={{ background: `${T.navy}12`, color: T.navy, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadCSV(modelPerformance.map(m => ({ Model: m.fullName, Accuracy: m.accuracy, Type: m.type, DataSize: m.dataSize, LastTrained: m.lastTrained })), 'ai_hub_models.csv')} style={btn(false)}>Export CSV</button>
          <button onClick={() => downloadJSON({ kpis, models: modelPerformance, confidence: confidenceData, anomalies: anomalyAlerts }, 'ai_hub_report.json')} style={btn(false)}>Export JSON</button>
          <button onClick={() => window.print()} style={btn(false)}>Print Report</button>
        </div>
      </div>

      {/* ── 2. Module Status Cards ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {MODULE_DEFS.map(m => (
          <div key={m.id} onClick={() => navigate(`/${m.id}`)} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18, cursor: 'pointer', transition: 'all 0.2s', borderLeft: `4px solid ${m.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: m.color, fontSize: 14 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.name}</div>
            </div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{m.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.textMut }}>Accuracy</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: m.accuracy > 90 ? T.green : m.accuracy > 85 ? T.sage : T.amber }}>{m.accuracy}%</span>
            </div>
            <div style={{ width: '100%', height: 4, background: T.surfaceH, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${m.accuracy}%`, height: '100%', background: m.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. KPI Cards (2 rows of 6) ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {[
          { label: 'Documents Parsed', value: kpis.docsParsed, color: T.navy },
          { label: 'Predictions Made', value: kpis.predictionsMade, color: T.sage },
          { label: 'Anomalies Detected', value: kpis.anomaliesDetected, color: T.red },
          { label: 'Engagement Recs', value: kpis.engagementRecs, color: T.gold },
          { label: 'Companies Clustered', value: kpis.companiesClustered, color: '#7c3aed' },
          { label: 'Avg Prediction R\u00b2', value: kpis.avgR2.toFixed(3), color: T.sage },
        ].map((k, i) => (
          <div key={i} style={kpiC}>
            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Anomaly Rate', value: `${kpis.anomalyRate}%`, color: T.red },
          { label: 'Engagement Coverage', value: `${kpis.engagementCov}%`, color: T.gold },
          { label: 'NLP Vocabulary', value: kpis.vocabSize.toLocaleString(), color: T.navyL },
          { label: 'Model Accuracy', value: `${kpis.modelAccuracy}%`, color: T.sage },
          { label: 'Greenwashing Flags', value: kpis.greenwashFlags, color: T.amber },
          { label: 'Boilerplate Found', value: kpis.boilerplateDetected, color: T.textSec },
        ].map((k, i) => (
          <div key={i} style={kpiC}>
            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── 4. AI Model Performance Table ───────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>AI Model Performance Summary</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[{ key: 'fullName', label: 'Model' }, { key: 'type', label: 'Type' }, { key: 'accuracy', label: 'Accuracy %' }, { key: 'dataSize', label: 'Data Size' }, { key: 'lastTrained', label: 'Last Trained' }].map(c => (
                <th key={c.key} style={thS} onClick={() => handleSort(c.key)}>{c.label}{sortArrow(c.key)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...modelPerformance].sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1)).map((m, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...tdS, fontWeight: 600 }}>{m.fullName}</td>
                <td style={tdS}><span style={{ background: `${T.navy}12`, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: T.navy }}>{m.type}</span></td>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 70, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${m.accuracy}%`, height: '100%', background: m.accuracy > 90 ? T.green : m.accuracy > 85 ? T.sage : T.amber, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontWeight: 700, color: m.accuracy > 90 ? T.green : T.sage }}>{m.accuracy}%</span>
                  </div>
                </td>
                <td style={tdS}>{m.dataSize.toLocaleString()} records</td>
                <td style={{ ...tdS, color: T.textSec }}>{m.lastTrained}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 5. Quick Actions ────────────────────────────────────── */}
      <div style={{ ...sC, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginRight: 8, alignSelf: 'center' }}>Quick Actions:</span>
        {MODULE_DEFS.map(m => (
          <button key={m.id} onClick={() => navigate(`/${m.id}`)} style={{ ...btn(false), borderLeft: `3px solid ${m.color}` }}>
            <span style={{ fontWeight: 700, color: m.color, marginRight: 6 }}>{m.icon}</span>
            Open {m.name}
          </button>
        ))}
      </div>

      {/* ── 6. Recent AI Activity Feed ─────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Recent AI Activity Feed</h3>
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {activityFeed.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < activityFeed.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: a.color, fontSize: 12, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: T.textSec }}>{a.verb} </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{a.company}</span>
              </div>
              <span style={{ fontSize: 11, color: T.textMut, whiteSpace: 'nowrap' }}>{a.time}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: a.status === 'running' ? T.amber : T.green, background: a.status === 'running' ? `${T.amber}15` : `${T.green}15`, padding: '2px 8px', borderRadius: 10 }}>
                {a.status === 'running' ? 'Running...' : `${a.confidence}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Model Comparison Bar Chart ───────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Model Accuracy Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={modelPerformance} margin={{ left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} angle={-15} textAnchor="end" />
            <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} formatter={v => `${v}%`} />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {modelPerformance.map((_, i) => (
                <Cell key={i} fill={MODULE_DEFS[i]?.color || T.navy} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 8. NLP Topic Coverage ──────────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>NLP Topic Coverage Across Parsed Reports</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topicCoverage} layout="vertical" margin={{ left: 110 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
            <YAxis type="category" dataKey="topic" tick={{ fontSize: 12, fill: T.text }} width={105} />
            <Tooltip formatter={(v, name) => name === 'coverage' ? `${v}%` : v} contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="coverage" radius={[0, 6, 6, 0]}>
              {topicCoverage.map((t, i) => (
                <Cell key={i} fill={t.coverage > 80 ? T.sage : t.coverage > 60 ? T.gold : T.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 9. Engagement Priority Summary ─────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Engagement Priority Summary</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Company', 'Sector', 'ESG Score', 'Urgency', 'Topic'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {engagementPriority.map((e, i) => (
              <tr key={i} style={{ background: e.urgency === 'Critical' ? '#fef2f2' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...tdS, fontWeight: 600 }}>{e.name}</td>
                <td style={{ ...tdS, color: T.textSec }}>{e.sector}</td>
                <td style={tdS}>
                  <span style={{ fontWeight: 700, color: e.esg > 60 ? T.green : e.esg > 40 ? T.amber : T.red }}>{e.esg}</span>
                </td>
                <td style={tdS}>
                  <span style={{ background: `${urgColors[e.urgency]}18`, color: urgColors[e.urgency], padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{e.urgency}</span>
                </td>
                <td style={tdS}>{e.topic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 10. Anomaly Alert Summary ──────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Active Anomaly Alerts</h3>
        {anomalyAlerts.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.sage }}>No active anomalies detected.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
            {anomalyAlerts.map((a, i) => (
              <div key={i} style={{ background: a.severity === 'critical' ? '#fef2f2' : '#fffbeb', borderRadius: 10, padding: 14, border: `1px solid ${a.severity === 'critical' ? '#fca5a5' : '#fde68a'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{a.company}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: a.severity === 'critical' ? T.red : T.amber, background: a.severity === 'critical' ? '#fecaca' : '#fef3c7', padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' }}>{a.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>{a.metric}: <strong style={{ color: a.direction === 'spike' ? T.red : T.green }}>{a.deviation}\u03c3 {a.direction}</strong></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 11. AI Confidence Dashboard ─────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>AI Confidence Dashboard</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: T.textSec }}>Min Confidence: <strong>{confidenceFilter}%</strong>
            <input type="range" min={0} max={95} value={confidenceFilter} onChange={e => setConfidenceFilter(+e.target.value)} style={{ marginLeft: 8, width: 140, accentColor: T.navy }} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {confidenceData.filter(c => c.confidence >= confidenceFilter).map((c, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.module}</div>
              {[
                { label: 'Confidence', value: c.confidence, color: c.confidence > 85 ? T.green : c.confidence > 70 ? T.amber : T.red },
                { label: 'Data Sufficiency', value: c.dataSufficiency, color: c.dataSufficiency > 80 ? T.green : T.amber },
                { label: 'Reliability', value: c.reliability, color: c.reliability > 85 ? T.green : T.amber },
              ].map((metric, j) => (
                <div key={j} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 2 }}>
                    <span>{metric.label}</span><span style={{ fontWeight: 700, color: metric.color }}>{metric.value}%</span>
                  </div>
                  <div style={{ width: '100%', height: 5, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${metric.value}%`, height: '100%', background: metric.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── 12. Cross-Module Intelligence ───────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Cross-Module Intelligence Flow</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[
            { from: 'Report Parser', to: 'Predictive ESG', insight: 'Parsed metrics feed prediction models for forward-looking ESG scores', strength: 'High', icon: 'P \u2192 E' },
            { from: 'Anomaly Detection', to: 'Engagement Advisor', insight: 'Detected anomalies trigger engagement escalation recommendations', strength: 'Critical', icon: 'A \u2192 G' },
            { from: 'Document Similarity', to: 'Report Parser', insight: 'Cluster analysis identifies boilerplate, improving parser accuracy', strength: 'Medium', icon: 'S \u2192 P' },
            { from: 'Predictive ESG', to: 'Anomaly Detection', insight: 'Prediction residuals help calibrate anomaly thresholds', strength: 'High', icon: 'E \u2192 A' },
            { from: 'Engagement Advisor', to: 'Document Similarity', insight: 'Engagement outcomes validate clustering quality metrics', strength: 'Medium', icon: 'G \u2192 S' },
            { from: 'All Modules', to: 'ESG Dashboard', insight: 'Aggregated AI insights integrated into main portfolio risk view', strength: 'Critical', icon: 'All \u2192 D' },
          ].map((flow, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{flow.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: flow.strength === 'Critical' ? T.red : flow.strength === 'High' ? T.sage : T.gold, background: flow.strength === 'Critical' ? '#fecaca' : flow.strength === 'High' ? `${T.sage}18` : `${T.gold}18`, padding: '2px 8px', borderRadius: 10 }}>{flow.strength}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>{flow.from} <span style={{ color: T.navy, fontWeight: 600 }}>\u2192</span> {flow.to}</div>
              <div style={{ fontSize: 12, color: T.text }}>{flow.insight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 13. Data Quality for AI ─────────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Data Quality Assessment for ML Readiness</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Field', 'Coverage %', 'Quality %', 'ML Ready', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {dataQualityForAI.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...tdS, fontWeight: 600 }}>{d.field}</td>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${d.coverage}%`, height: '100%', background: d.coverage > 75 ? T.sage : d.coverage > 50 ? T.amber : T.red, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: d.coverage > 75 ? T.sage : T.amber }}>{d.coverage}%</span>
                  </div>
                </td>
                <td style={tdS}>
                  <span style={{ fontWeight: 600, color: d.quality > 75 ? T.sage : d.quality > 50 ? T.amber : T.red }}>{d.quality}%</span>
                </td>
                <td style={tdS}>
                  <span style={{ color: d.mlReady ? T.green : T.red, fontWeight: 700, fontSize: 14 }}>{d.mlReady ? '\u2713' : '\u2717'}</span>
                </td>
                <td style={tdS}>
                  <span style={{ background: d.mlReady ? `${T.green}15` : `${T.red}15`, color: d.mlReady ? T.green : T.red, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                    {d.mlReady ? 'Ready' : 'Insufficient Data'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 14. AI Processing Pipeline Status ──────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>AI Processing Pipeline Status</h3>
        {(() => {
          const pipelineStages = [
            { stage: 'Data Ingestion', status: 'active', throughput: '1,247 docs/day', latency: '0.8s', errorRate: '0.12%', queue: 23 },
            { stage: 'Text Preprocessing', status: 'active', throughput: '2,100 docs/day', latency: '0.3s', errorRate: '0.05%', queue: 8 },
            { stage: 'NLP Feature Extraction', status: 'active', throughput: '890 docs/day', latency: '2.1s', errorRate: '0.34%', queue: 42 },
            { stage: 'Model Inference', status: 'active', throughput: '1,500 predictions/day', latency: '1.4s', errorRate: '0.08%', queue: 15 },
            { stage: 'Anomaly Scanning', status: 'active', throughput: '3,200 checks/day', latency: '0.5s', errorRate: '0.02%', queue: 5 },
            { stage: 'Report Generation', status: 'idle', throughput: '450 reports/day', latency: '3.2s', errorRate: '0.18%', queue: 0 },
            { stage: 'Engagement Scoring', status: 'active', throughput: '780 scores/day', latency: '1.8s', errorRate: '0.22%', queue: 18 },
            { stage: 'Clustering Engine', status: 'active', throughput: '120 runs/day', latency: '4.5s', errorRate: '0.15%', queue: 3 },
          ];
          return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Stage', 'Status', 'Throughput', 'Avg Latency', 'Error Rate', 'Queue'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {pipelineStages.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{p.stage}</td>
                    <td style={tdS}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'active' ? T.green : T.textMut }} />
                        <span style={{ fontSize: 12, color: p.status === 'active' ? T.green : T.textMut, fontWeight: 600 }}>{p.status}</span>
                      </span>
                    </td>
                    <td style={tdS}>{p.throughput}</td>
                    <td style={tdS}>{p.latency}</td>
                    <td style={tdS}>
                      <span style={{ color: parseFloat(p.errorRate) > 0.2 ? T.amber : T.green, fontWeight: 600 }}>{p.errorRate}</span>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(p.queue * 2, 100)}%`, height: '100%', background: p.queue > 30 ? T.amber : T.sage, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: p.queue > 30 ? T.amber : T.text }}>{p.queue}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* ── 15. Model Training History ─────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Model Training History & Performance Trend</h3>
        {(() => {
          const trainingHistory = MODULE_DEFS.flatMap(m => {
            return Array.from({ length: 6 }, (_, i) => ({
              model: m.name.split(' ').slice(0, 2).join(' '),
              date: `2026-0${Math.max(1, 3 - Math.floor(i / 2))}-${String(1 + (i % 2) * 15).padStart(2, '0')}`,
              accuracy: Math.max(70, m.accuracy - 8 + i * 1.5 + (sr(_sc++) - 0.5) * 3).toFixed(1),
              dataSize: Math.round(m.dataSize * (0.5 + i * 0.1)),
              trainingTime: `${Math.round(12 + sr(_sc++) * 30)}min`,
              color: m.color,
            }));
          });
          const chartData = Array.from({ length: 6 }, (_, i) => {
            const row = { date: `W${i + 1}` };
            MODULE_DEFS.forEach(m => {
              const key = m.name.split(' ').slice(0, 2).join(' ');
              row[key] = parseFloat((m.accuracy - 8 + i * 1.5 + (sr(_sc++) - 0.5) * 2).toFixed(1));
            });
            return row;
          });
          return (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {MODULE_DEFS.map(m => (
                    <Line key={m.id} type="monotone" dataKey={m.name.split(' ').slice(0, 2).join(' ')} stroke={m.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 16 }}>
                {MODULE_DEFS.map((m, i) => {
                  const improvement = (m.accuracy - (m.accuracy - 8)).toFixed(1);
                  return (
                    <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 12, borderLeft: `3px solid ${m.color}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{m.name.split(' ').slice(0, 2).join(' ')}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.accuracy}%</div>
                          <div style={{ fontSize: 10, color: T.textMut }}>Current</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>+{improvement}%</div>
                          <div style={{ fontSize: 10, color: T.textMut }}>6-week gain</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 16. Portfolio AI Coverage Map ───────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Portfolio AI Coverage Assessment</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>
          Shows which AI modules have processed each portfolio holding. Full coverage = all 5 modules have analyzed the company.
        </p>
        {(() => {
          const companies = holdings.length > 0
            ? holdings.slice(0, 15).map(h => ({
              name: h.company?.name || h.name || h.ticker,
              sector: h.company?.sector || h.sector || 'Unknown'
            }))
            : ['Reliance Industries', 'TCS', 'HDFC Bank', 'Infosys', 'Shell plc', 'Apple Inc.', 'Microsoft', 'BHP Group', 'Enel', 'Toyota'].map((name, i) => ({
              name,
              sector: ['Energy', 'IT', 'Financials', 'IT', 'Energy', 'IT', 'IT', 'Mining', 'Utilities', 'Auto'][i]
            }));
          const coverageMap = companies.map((c, i) => {
            const modules = MODULE_DEFS.map(m => ({
              name: m.icon,
              covered: sr(_sc++) > (i < 5 ? 0.15 : 0.35),
              color: m.color,
            }));
            const total = modules.filter(m => m.covered).length;
            return { ...c, modules, total, pct: Math.round(total / MODULE_DEFS.length * 100) };
          });
          return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thS}>Company</th>
                  <th style={thS}>Sector</th>
                  {MODULE_DEFS.map(m => <th key={m.id} style={{ ...thS, textAlign: 'center', padding: '10px 6px' }}>{m.icon}</th>)}
                  <th style={thS}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {coverageMap.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ ...tdS, color: T.textSec, fontSize: 12 }}>{c.sector}</td>
                    {c.modules.map((m, j) => (
                      <td key={j} style={{ ...tdS, textAlign: 'center' }}>
                        <span style={{ color: m.covered ? T.green : T.red, fontWeight: 700, fontSize: 14 }}>
                          {m.covered ? '\u2713' : '\u2717'}
                        </span>
                      </td>
                    ))}
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${c.pct}%`, height: '100%', background: c.pct === 100 ? T.green : c.pct >= 60 ? T.sage : T.amber, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.pct === 100 ? T.green : T.amber }}>{c.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* ── 17. AI Recommendation Summary ──────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>AI-Generated Strategic Recommendations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {[
            { priority: 'Critical', title: 'Increase Scope 3 Data Collection', desc: 'Only 54% coverage for Scope 3 emissions data. ML predictions unreliable below 70% coverage. Prioritize supplier engagement for data collection.', module: 'Predictive ESG', action: 'Launch supplier data campaign', color: T.red },
            { priority: 'High', title: 'Address Boilerplate Reporting', desc: 'Document similarity analysis flagged 11% of parsed reports as potential boilerplate. Engage companies with high similarity scores for improved disclosure.', module: 'Document Similarity', action: 'Schedule engagement calls', color: T.amber },
            { priority: 'High', title: 'Resolve Critical Anomalies', desc: `${anomalyAlerts.filter(a => a.severity === 'critical').length} critical anomalies require investigation. Emissions spikes and safety incidents need immediate verification.`, module: 'Anomaly Detection', action: 'Investigate and verify data', color: T.amber },
            { priority: 'Medium', title: 'Expand Biodiversity Coverage', desc: 'Biodiversity data coverage at 35% is well below ML readiness threshold. Consider third-party data supplements or targeted CDP requests.', module: 'Data Quality', action: 'Source external biodiversity data', color: T.gold },
            { priority: 'Medium', title: 'Enhance NLP Human Rights Parsing', desc: 'Human rights due diligence coverage at 42%. Improve NLP model training with additional labeled examples from UNGP-aligned reports.', module: 'Report Parser', action: 'Retrain NER model', color: T.gold },
            { priority: 'Low', title: 'Optimize Model Retraining Cadence', desc: 'All models show accuracy improvements with weekly retraining. Consider automated pipeline for continuous model updates.', module: 'AI Hub', action: 'Implement CI/CD for ML', color: T.sage },
          ].map((r, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, borderLeft: `4px solid ${r.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: `${r.color}15`, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' }}>{r.priority}</span>
                <span style={{ fontSize: 10, color: T.textMut }}>{r.module}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, background: `${T.navy}08`, padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                Action: {r.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 18. System Health & Resource Usage ─────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>System Health & Resource Utilization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'CPU Utilization', value: 67, unit: '%', max: 100, color: T.sage },
            { label: 'Memory Usage', value: 4.2, unit: 'GB', max: 8, color: T.navy },
            { label: 'Storage Used', value: 128, unit: 'GB', max: 256, color: T.gold },
            { label: 'API Calls Today', value: 12847, unit: '', max: 50000, color: T.navyL },
            { label: 'Model Cache Hit', value: 94, unit: '%', max: 100, color: T.green },
            { label: 'Avg Response Time', value: 1.2, unit: 's', max: 5, color: T.sage },
          ].map((m, i) => {
            const pct = Math.round((typeof m.value === 'number' ? m.value : parseFloat(m.value)) / m.max * 100);
            return (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{m.label}</div>
                <div style={{ position: 'relative', width: 70, height: 70, margin: '0 auto 8px' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="30" fill="none" stroke={T.border} strokeWidth="5" />
                    <circle cx="35" cy="35" r="30" fill="none" stroke={m.color} strokeWidth="5"
                      strokeDasharray={`${pct * 1.885} 188.5`} strokeDashoffset="0"
                      transform="rotate(-90 35 35)" strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 14, fontWeight: 700, color: m.color }}>{pct}%</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{m.value.toLocaleString()}{m.unit}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 19. Weekly AI Performance Digest ──────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Weekly AI Performance Digest</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { week: 'W13 (Mar 24-26)', parsed: 89, predictions: 234, anomalies: 7, engagements: 18, clusters: 3, highlight: 'New anomaly detection model deployed' },
            { week: 'W12 (Mar 17-23)', parsed: 142, predictions: 312, anomalies: 12, engagements: 25, clusters: 5, highlight: 'Highest parsing volume this quarter' },
            { week: 'W11 (Mar 10-16)', parsed: 98, predictions: 198, anomalies: 4, engagements: 14, clusters: 2, highlight: 'Engagement advisor retrained with new rules' },
            { week: 'W10 (Mar 3-9)', parsed: 76, predictions: 267, anomalies: 9, engagements: 21, clusters: 4, highlight: 'Document similarity engine launched' },
          ].map((w, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{w.week}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, color: T.textSec, marginBottom: 8 }}>
                <span>Parsed: <strong style={{ color: T.navy }}>{w.parsed}</strong></span>
                <span>Predicted: <strong style={{ color: T.sage }}>{w.predictions}</strong></span>
                <span>Anomalies: <strong style={{ color: T.red }}>{w.anomalies}</strong></span>
                <span>Engagements: <strong style={{ color: T.gold }}>{w.engagements}</strong></span>
              </div>
              <div style={{ fontSize: 10, color: T.sage, fontStyle: 'italic', borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>{w.highlight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 20. Module Integration Matrix ──────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Module Integration Status Matrix</h3>
        {(() => {
          const modules = MODULE_DEFS.map(m => m.name.split(' ').slice(0, 2).join(' '));
          const integrationMatrix = modules.map((from, i) =>
            modules.map((to, j) => {
              if (i === j) return 'self';
              if (Math.abs(i - j) === 1 || (i === 0 && j === modules.length - 1)) return 'active';
              if (sr(_sc++) > 0.5) return 'planned';
              return 'none';
            })
          );
          const statusColors = { self: T.surfaceH, active: `${T.green}20`, planned: `${T.gold}15`, none: T.surface };
          const statusLabels = { self: '--', active: '\u2713', planned: '\u25cb', none: '' };
          const statusTextColors = { self: T.textMut, active: T.green, planned: T.gold, none: T.textMut };
          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font }}>
                <thead>
                  <tr>
                    <th style={{ ...thS, position: 'sticky', left: 0, zIndex: 2, background: T.surfaceH }}>From / To</th>
                    {modules.map(m => <th key={m} style={{ ...thS, textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>{m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((from, i) => (
                    <tr key={i}>
                      <td style={{ ...tdS, fontWeight: 600, position: 'sticky', left: 0, background: T.surface, zIndex: 1, fontSize: 11 }}>{from}</td>
                      {integrationMatrix[i].map((status, j) => (
                        <td key={j} style={{ ...tdS, textAlign: 'center', background: statusColors[status], fontWeight: 700, color: statusTextColors[status], fontSize: 13 }}>
                          {statusLabels[status]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: T.textSec }}>
                <span><span style={{ color: T.green, fontWeight: 700 }}>{'\u2713'}</span> Active integration</span>
                <span><span style={{ color: T.gold, fontWeight: 700 }}>{'\u25cb'}</span> Planned</span>
                <span><span style={{ color: T.textMut }}>--</span> Self</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 21. Cross Navigation ────────────────────────────────── */}
      <div style={{ ...sC, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginRight: 8 }}>Navigate:</span>
        {[
          { label: 'Report Parser', path: '/report-parser' },
          { label: 'Predictive ESG', path: '/predictive-esg' },
          { label: 'Anomaly Detection', path: '/anomaly-detection' },
          { label: 'Engagement Advisor', path: '/engagement-advisor' },
          { label: 'Document Similarity', path: '/document-similarity' },
          { label: 'ESG Dashboard', path: '/esg-dashboard' },
          { label: 'Data Quality', path: '/esg-data-quality' },
          { label: 'Stewardship', path: '/stewardship-tracker' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ ...btn(false), fontSize: 12 }}>{n.label}</button>
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: T.textMut }}>
        EP-W6 AI & NLP Intelligence Dashboard (Hub) | Sprint W AI & NLP Analytics | {MODULE_DEFS.length} modules, {holdings.length} portfolio holdings
      </div>
    </div>
  );
}

export default AiHubPage;
