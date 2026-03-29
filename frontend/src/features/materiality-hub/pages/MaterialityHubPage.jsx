/**
 * EP-T6 — Dynamic Materiality Intelligence Dashboard (Hub)
 * Sprint T — Dynamic Materiality Engine
 *
 * Central hub aggregating all 5 Sprint T modules: Double Materiality, Stakeholder Impact,
 * Materiality Trends, Controversy Materiality, and Scenario Simulator.
 * Reads: ra_portfolio_v1, ra_materiality_assessment_v1, ra_custom_materiality_scenario_v1
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Seed helpers ──────────────────────────────────────────────────────────── */
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = seed => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, off = 0) => seededRandom(seed + off);

/* ── localStorage ──────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_ASSESSMENT = 'ra_materiality_assessment_v1';
const LS_CUSTOM_SCENARIO = 'ra_custom_materiality_scenario_v1';
const readLS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

/* ── ESRS Topics ───────────────────────────────────────────────────────────── */
const ESRS_TOPICS = [
  { id: 'E1', label: 'Climate Change', pillar: 'E' },
  { id: 'E2', label: 'Pollution', pillar: 'E' },
  { id: 'E3', label: 'Water & Marine Resources', pillar: 'E' },
  { id: 'E4', label: 'Biodiversity & Ecosystems', pillar: 'E' },
  { id: 'E5', label: 'Circular Economy', pillar: 'E' },
  { id: 'S1', label: 'Own Workforce', pillar: 'S' },
  { id: 'S2', label: 'Value Chain Workers', pillar: 'S' },
  { id: 'S3', label: 'Affected Communities', pillar: 'S' },
  { id: 'S4', label: 'Consumers & End-users', pillar: 'S' },
  { id: 'G1', label: 'Business Conduct', pillar: 'G' },
];

const MATERIAL_THRESHOLD = 60;
const classify = (fin, imp) => {
  if (fin >= MATERIAL_THRESHOLD && imp >= MATERIAL_THRESHOLD) return 'Double Material';
  if (fin >= MATERIAL_THRESHOLD) return 'Financial Material';
  if (imp >= MATERIAL_THRESHOLD) return 'Impact Material';
  return 'Not Material';
};

/* ── Sprint T Modules ──────────────────────────────────────────────────────── */
const MODULES = [
  { id: 'double', name: 'Double Materiality', path: '/double-materiality', icon: '\uD83D\uDD0D', color: T.navy, description: 'ESRS-aligned double materiality assessment with financial & impact scoring' },
  { id: 'stakeholder', name: 'Stakeholder Impact', path: '/stakeholder-impact', icon: '\uD83D\uDC65', color: T.sage, description: 'Stakeholder-weighted materiality with engagement tracking & influence mapping' },
  { id: 'trends', name: 'Materiality Trends', path: '/materiality-trends', icon: '\uD83D\uDCC8', color: T.gold, description: 'Temporal analysis of materiality evolution with driver decomposition' },
  { id: 'controversy', name: 'Controversy Link', path: '/controversy-materiality', icon: '\u26A0\uFE0F', color: T.amber, description: 'Links real-world controversies to materiality validation & gap detection' },
  { id: 'scenarios', name: 'Scenario Simulator', path: '/materiality-scenarios', icon: '\uD83C\uDFAF', color: T.red, description: 'What-if analysis under 4 macro scenarios with custom scenario builder' },
];

/* ── Frameworks ────────────────────────────────────────────────────────────── */
const FRAMEWORKS = [
  { name: 'CSRD / ESRS', alignment: 94, path: '/csrd-reporting', topics: ['E1','E2','E3','E4','E5','S1','S2','S3','S4','G1'], status: 'Active' },
  { name: 'ISSB / IFRS S1-S2', alignment: 88, path: '/issb-materiality', topics: ['E1','S1','G1'], status: 'Active' },
  { name: 'SFDR PAIs', alignment: 82, path: '/sfdr-classification', topics: ['E1','E2','E4','S1','G1'], status: 'Active' },
  { name: 'GRI Standards', alignment: 91, path: '/gri-reporting', topics: ['E1','E2','E3','E4','E5','S1','S2','S3','S4','G1'], status: 'Active' },
  { name: 'TNFD LEAP', alignment: 76, path: '/tnfd-reporting', topics: ['E3','E4','E5'], status: 'Beta' },
];

/* ── Stakeholder Groups ────────────────────────────────────────────────────── */
const STAKEHOLDER_GROUPS = [
  { name: 'Investors & Shareholders', weight: 0.25, topConcerns: ['E1', 'G1', 'E4'], impactScore: 82 },
  { name: 'Employees & Workers', weight: 0.20, topConcerns: ['S1', 'S2', 'G1'], impactScore: 76 },
  { name: 'Regulators & Government', weight: 0.18, topConcerns: ['E1', 'E2', 'G1'], impactScore: 88 },
  { name: 'Local Communities', weight: 0.12, topConcerns: ['S3', 'E3', 'E4'], impactScore: 71 },
  { name: 'Customers & Consumers', weight: 0.15, topConcerns: ['S4', 'E5', 'E1'], impactScore: 68 },
  { name: 'Supply Chain Partners', weight: 0.10, topConcerns: ['S2', 'E5', 'E2'], impactScore: 63 },
];

/* ── Generate module scores ────────────────────────────────────────────────── */
const buildTopicScores = () => {
  return ESRS_TOPICS.map((t, i) => {
    const s = sr(hashStr(t.id), i);
    const financial = Math.round(35 + s * 55);
    const impact = Math.round(30 + sr(hashStr(t.id), i + 10) * 60);
    const stakeholder = Math.round(40 + sr(hashStr(t.id), i + 20) * 50);
    const trend = +((-5 + sr(hashStr(t.id), i + 30) * 20).toFixed(1));
    const controversy = Math.round(sr(hashStr(t.id), i + 40) * 3);
    const scenarioMax = Math.round(5 + sr(hashStr(t.id), i + 50) * 25);
    const cls = classify(financial, impact);
    const validated = sr(hashStr(t.id), i + 60) > 0.3;
    return { id: t.id, label: t.label, pillar: t.pillar, financial, impact, stakeholder, trend, controversy, scenarioMax, cls, validated, combined: Math.round((financial * 0.35 + impact * 0.35 + stakeholder * 0.3)) };
  });
};

/* ── Shared UI Components ──────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent || T.border}`, borderRadius: 10, padding: '14px 16px', borderTop: accent ? `3px solid ${accent}` : undefined }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color: T.navy, marginTop: 4, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 3, fontFamily: T.font }}>{sub}</div>}
  </div>
);

const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${T.gold}` }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</span>
      {badge && <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, background: T.gold + '22', color: T.gold, fontWeight: 700, fontFamily: T.font }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const SortableTable = ({ columns, data, onSort, sortCol, sortDir }) => (
  <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 13 }}>
      <thead>
        <tr style={{ background: T.surfaceH }}>
          {columns.map(c => (
            <th key={c.key} onClick={() => onSort && onSort(c.key)} style={{ padding: '10px 12px', textAlign: c.align || 'left', color: T.navy, fontWeight: 700, cursor: onSort ? 'pointer' : 'default', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', userSelect: 'none', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {c.label}{sortCol === c.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
            {columns.map(c => (
              <td key={c.key} style={{ padding: '10px 12px', textAlign: c.align || 'left', color: T.text }}>{c.render ? c.render(row) : row[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pill = ({ label, color, bg }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: bg || (color + '18'), color, fontFamily: T.font }}>{label}</span>
);

const NavBtn = ({ label, path, nav, primary }) => (
  <button onClick={() => nav(path)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${primary ? T.gold : T.border}`, background: primary ? T.gold : T.surface, color: primary ? '#fff' : T.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s' }}
    onMouseEnter={e => { e.target.style.background = T.gold; e.target.style.color = '#fff'; e.target.style.borderColor = T.gold; }}
    onMouseLeave={e => { e.target.style.background = primary ? T.gold : T.surface; e.target.style.color = primary ? '#fff' : T.navy; e.target.style.borderColor = primary ? T.gold : T.border; }}>
    {label} \u2192
  </button>
);

const ProgressBar = ({ value, max = 100, color }) => (
  <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
    <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color || T.sage, borderRadius: 3 }} />
  </div>
);

const clsColor = cls => cls === 'Double Material' ? T.red : cls === 'Financial Material' ? T.amber : cls === 'Impact Material' ? T.sage : T.textMut;

/* ════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ════════════════════════════════════════════════════════════════════════════ */
const MaterialityHubPage = () => {
  const navigate = useNavigate();
  const portfolio = useMemo(() => readLS(LS_PORTFOLIO) || [], []);
  const assessment = useMemo(() => readLS(LS_ASSESSMENT) || {}, []);
  const customScenario = useMemo(() => readLS(LS_CUSTOM_SCENARIO) || {}, []);
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 120), []);

  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  /* topic scores */
  const topicScores = useMemo(() => buildTopicScores(), []);

  /* sorting */
  const handleSort = col => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortCol(col);
  };
  const sortFn = useCallback((data, col, dir) => {
    return [...data].sort((a, b) => {
      const av = a[col], bv = b[col];
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
      return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, []);

  /* KPI computation */
  const kpis = useMemo(() => {
    const materialFin = topicScores.filter(t => t.financial >= MATERIAL_THRESHOLD).length;
    const materialImp = topicScores.filter(t => t.impact >= MATERIAL_THRESHOLD).length;
    const doubly = topicScores.filter(t => t.cls === 'Double Material').length;
    const netImpact = topicScores.reduce((s, t) => s + t.impact, 0);
    const trendDrivers = topicScores.filter(t => Math.abs(t.trend) > 5).length;
    const emerging = topicScores.filter(t => t.financial < MATERIAL_THRESHOLD && t.trend > 8).length;
    const controversyLinked = topicScores.reduce((s, t) => s + t.controversy, 0);
    const validated = topicScores.filter(t => t.validated).length;
    const scenarioReclass = topicScores.filter(t => t.scenarioMax > 15).length;
    const completeness = Math.round((validated / 10) * 100);
    const engagementPriority = topicScores.filter(t => t.combined > 65).length;
    return { materialFin, materialImp, doubly, stakeholderGroups: STAKEHOLDER_GROUPS.length, netImpact, trendDrivers, emerging, controversyLinked, validated, scenarioReclass, completeness, engagementPriority, forecastHorizon: '2024-2030', dataCoverage: `${Math.round(82 + sr(42) * 15)}%` };
  }, [topicScores]);

  /* module status */
  const moduleStatus = useMemo(() => {
    return MODULES.map((m, i) => {
      const coverage = Math.round(70 + sr(hashStr(m.id), i) * 28);
      const issues = Math.round(sr(hashStr(m.id), i + 5) * 4);
      return { ...m, coverage, issues, status: coverage > 90 ? 'Complete' : coverage > 70 ? 'In Progress' : 'Needs Attention' };
    });
  }, []);

  /* scatter data for combined matrix */
  const scatterData = useMemo(() => topicScores.map(t => ({
    ...t, x: t.financial, y: t.impact,
    trendArrow: t.trend > 3 ? 'up' : t.trend < -3 ? 'down' : 'stable',
  })), [topicScores]);

  /* cross-module consistency */
  const consistency = useMemo(() => {
    return [
      { framework: 'ISSB (EP-Q3)', aligned: topicScores.filter(t => ['E1','S1','G1'].includes(t.id) && t.financial >= MATERIAL_THRESHOLD).length, total: 3, path: '/issb-materiality' },
      { framework: 'GRI (EP-Q4)', aligned: topicScores.filter(t => t.impact >= MATERIAL_THRESHOLD).length, total: 10, path: '/gri-reporting' },
      { framework: 'SFDR (EP-Q2)', aligned: topicScores.filter(t => ['E1','E2','E4','S1','G1'].includes(t.id) && t.combined >= MATERIAL_THRESHOLD).length, total: 5, path: '/sfdr-classification' },
      { framework: 'CSRD (EP-Q1)', aligned: topicScores.filter(t => t.cls !== 'Not Material').length, total: 10, path: '/csrd-reporting' },
    ];
  }, [topicScores]);

  /* emerging alerts */
  const emergingAlerts = useMemo(() => {
    return topicScores.filter(t => t.trend > 5 || (t.scenarioMax > 15 && t.financial < MATERIAL_THRESHOLD)).map(t => ({
      ...t,
      reason: t.trend > 8 ? 'Strong upward trend' : t.scenarioMax > 20 ? 'High scenario sensitivity' : 'Moderate trend + scenario risk',
      urgency: t.trend > 8 ? 'High' : 'Medium',
    }));
  }, [topicScores]);

  /* action prioritization */
  const actions = useMemo(() => {
    const items = [];
    topicScores.filter(t => t.cls === 'Double Material' && !t.validated).forEach(t => {
      items.push({ priority: 'Critical', action: `Validate ${t.label} materiality through stakeholder engagement`, module: 'Stakeholder', topic: t.id });
    });
    topicScores.filter(t => t.controversy > 2).forEach(t => {
      items.push({ priority: 'High', action: `Address ${t.controversy} linked controversies for ${t.label}`, module: 'Controversy', topic: t.id });
    });
    topicScores.filter(t => t.scenarioMax > 20).forEach(t => {
      items.push({ priority: 'High', action: `Prepare contingency for ${t.label} under adverse scenario (+${t.scenarioMax})`, module: 'Scenarios', topic: t.id });
    });
    emergingAlerts.forEach(a => {
      items.push({ priority: a.urgency === 'High' ? 'High' : 'Medium', action: `Monitor ${a.label} (emerging: ${a.reason})`, module: 'Trends', topic: a.id });
    });
    items.push({ priority: 'Medium', action: 'Update CSRD report templates with latest materiality assessment', module: 'Reporting', topic: '-' });
    items.push({ priority: 'Low', action: 'Schedule quarterly materiality review with stakeholder panel', module: 'Governance', topic: '-' });
    return items;
  }, [topicScores, emergingAlerts]);

  /* exports */
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const exportMarkdown = () => {
    let md = `# Dynamic Materiality Intelligence Report\n\n`;
    md += `## Summary\n- Material Topics (Financial): ${kpis.materialFin}\n- Material Topics (Impact): ${kpis.materialImp}\n- Doubly Material: ${kpis.doubly}\n\n`;
    md += `## Topic Scores\n| Topic | Financial | Impact | Stakeholder | Trend | Classification |\n|---|---|---|---|---|---|\n`;
    topicScores.forEach(t => {
      md += `| ${t.label} | ${t.financial} | ${t.impact} | ${t.stakeholder} | ${t.trend > 0 ? '+' : ''}${t.trend} | ${t.cls} |\n`;
    });
    md += `\n## Actions\n`;
    actions.forEach(a => { md += `- [${a.priority}] ${a.action}\n`; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'materiality-intelligence-report.md'; a.click(); URL.revokeObjectURL(url);
  };

  /* Materiality-to-Action flow steps */
  const flowSteps = [
    { label: 'Materiality Assessment', icon: '\uD83D\uDD0D', color: T.navy },
    { label: 'Material Topics', icon: '\uD83C\uDFAF', color: T.gold },
    { label: 'Disclosure Requirements', icon: '\uD83D\uDCCB', color: T.sage },
    { label: 'Reporting Modules', icon: '\uD83D\uDCCA', color: T.amber },
    { label: 'Client Deliverables', icon: '\uD83D\uDCE4', color: T.red },
  ];

  /* ── RENDER ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh', fontFamily: T.font }}>

      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Dynamic Materiality Intelligence</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['Hub', 'Double Materiality', 'Trends', 'Stakeholders', 'Scenarios'].map(b => (
              <span key={b} style={{ padding: '3px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: T.gold + '22', color: T.gold }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportCSV(topicScores.map(t => ({ id: t.id, label: t.label, financial: t.financial, impact: t.impact, stakeholder: t.stakeholder, trend: t.trend, controversy: t.controversy, classification: t.cls })), 'materiality-hub-scores.csv')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>Export CSV</button>
          <button onClick={() => exportJSON({ topics: topicScores, kpis, actions, frameworks: FRAMEWORKS, timestamp: new Date().toISOString() }, 'materiality-hub.json')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>Export JSON</button>
          <button onClick={exportMarkdown} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.gold}`, background: T.gold, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>Export Report</button>
        </div>
      </div>

      {/* 2. Module Status Cards */}
      <Section title="Sprint T Module Status" badge="5 Modules">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {moduleStatus.map(m => (
            <div key={m.id} onClick={() => navigate(m.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s', borderTop: `3px solid ${m.color}` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 12px ${m.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <Pill label={m.status} color={m.status === 'Complete' ? T.green : m.status === 'In Progress' ? T.amber : T.red} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10, lineHeight: 1.4 }}>{m.description}</div>
              <ProgressBar value={m.coverage} color={m.color} />
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{m.coverage}% complete {m.issues > 0 ? `\u00B7 ${m.issues} issues` : ''}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. 14 KPI Cards (2 rows) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12, marginBottom: 28 }}>
        <KpiCard label="Material (Financial)" value={kpis.materialFin} sub="Topics >= 60 financial" accent={T.navy} icon="\uD83D\uDCB0" />
        <KpiCard label="Material (Impact)" value={kpis.materialImp} sub="Topics >= 60 impact" accent={T.sage} icon="\uD83C\uDF0D" />
        <KpiCard label="Doubly Material" value={kpis.doubly} sub="Both dimensions" accent={T.red} icon="\u26A1" />
        <KpiCard label="Stakeholder Groups" value={kpis.stakeholderGroups} sub="Active groups" accent={T.gold} icon="\uD83D\uDC65" />
        <KpiCard label="Net Impact Score" value={kpis.netImpact} sub="Sum across topics" accent={T.sage} icon="\uD83D\uDCCA" />
        <KpiCard label="Trend Drivers" value={kpis.trendDrivers} sub="Significant shift" accent={T.amber} icon="\uD83D\uDCC8" />
        <KpiCard label="Emerging Topics" value={kpis.emerging} sub="Approaching material" accent={T.gold} icon="\uD83D\uDCA1" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12, marginBottom: 28 }}>
        <KpiCard label="Controversies Linked" value={kpis.controversyLinked} sub="Across all topics" accent={T.amber} icon="\u26A0\uFE0F" />
        <KpiCard label="Validated %" value={`${kpis.completeness}%`} sub={`${kpis.validated}/10 topics`} accent={kpis.completeness >= 80 ? T.green : T.amber} icon="\u2705" />
        <KpiCard label="Scenario Reclass" value={kpis.scenarioReclass} sub="High scenario risk" accent={T.red} icon="\uD83C\uDFAF" />
        <KpiCard label="Completeness" value={`${kpis.completeness}%`} sub="Assessment coverage" accent={T.sage} icon="\uD83D\uDCCB" />
        <KpiCard label="Engagement Priority" value={kpis.engagementPriority} sub="Topics needing action" accent={T.navy} icon="\uD83D\uDCE3" />
        <KpiCard label="Forecast Horizon" value={kpis.forecastHorizon} sub="Projection window" accent={T.gold} icon="\uD83D\uDD2E" />
        <KpiCard label="Data Coverage" value={kpis.dataCoverage} sub="Of portfolio holdings" accent={T.sage} icon="\uD83D\uDCC2" />
      </div>

      {/* 4. Materiality Summary Matrix */}
      <Section title="Materiality Summary Matrix" badge="Double materiality with trend arrows">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="Financial" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Financial Materiality', position: 'bottom', offset: 0, style: { fontSize: 12, fill: T.textSec } }} />
              <YAxis type="number" dataKey="y" name="Impact" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Impact Materiality', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: T.textSec } }} />
              <ReferenceLine x={MATERIAL_THRESHOLD} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'Threshold', position: 'top', style: { fontSize: 10, fill: T.amber } }} />
              <ReferenceLine y={MATERIAL_THRESHOLD} stroke={T.amber} strokeDasharray="5 5" />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 12, fontFamily: T.font, minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{d.id} — {d.label}</div>
                  <div>Financial: <b>{d.financial}</b> | Impact: <b>{d.impact}</b></div>
                  <div>Stakeholder: <b>{d.stakeholder}</b> | Trend: <b>{d.trend > 0 ? '+' : ''}{d.trend}</b></div>
                  <div style={{ color: clsColor(d.cls), fontWeight: 600, marginTop: 4 }}>{d.cls}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>Direction: {d.trendArrow === 'up' ? '\u2191 Rising' : d.trendArrow === 'down' ? '\u2193 Falling' : '\u2194 Stable'}</div>
                </div>);
              }} />
              <Scatter data={scatterData}>
                {scatterData.map((d, i) => <Cell key={i} fill={clsColor(d.cls)} r={9} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
            {[{ label: 'Double Material', color: T.red }, { label: 'Financial Material', color: T.amber }, { label: 'Impact Material', color: T.sage }, { label: 'Not Material', color: T.textMut }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textSec }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. Framework Alignment */}
      <Section title="Framework Alignment" badge="5 frameworks">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {FRAMEWORKS.map(fw => (
            <div key={fw.name} onClick={() => navigate(fw.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{fw.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: fw.alignment >= 90 ? T.green : fw.alignment >= 80 ? T.gold : T.amber, marginBottom: 8 }}>{fw.alignment}%</div>
              <ProgressBar value={fw.alignment} color={fw.alignment >= 90 ? T.green : fw.alignment >= 80 ? T.gold : T.amber} />
              <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                {fw.topics.map(t => <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: T.surfaceH, color: T.textSec, fontWeight: 600 }}>{t}</span>)}
              </div>
              <Pill label={fw.status} color={fw.status === 'Active' ? T.green : T.amber} />
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Quick Actions */}
      <Section title="Quick Actions" badge="Navigate to sub-modules">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => navigate(m.path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = m.color + '12'; e.currentTarget.style.borderColor = m.color; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* 7. Materiality-to-Action Flow */}
      <Section title="Materiality-to-Action Flow" badge="End-to-end pipeline">
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: T.surface, borderRadius: 12, padding: '24px 20px', border: `1px solid ${T.border}` }}>
          {flowSteps.map((step, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: step.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 22 }}>{step.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{step.label}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{ width: 40, height: 2, background: T.gold, flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* 8. Stakeholder Impact Summary */}
      <Section title="Stakeholder Impact Summary" badge="Top 3 groups">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {STAKEHOLDER_GROUPS.slice(0, 3).map((sg, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{sg.name}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: sg.impactScore >= 80 ? T.red : T.gold }}>{sg.impactScore}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Weight: {(sg.weight * 100).toFixed(0)}% | Top concerns:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {sg.topConcerns.map(tc => <Pill key={tc} label={tc} color={T.navy} />)}
              </div>
              <div style={{ marginTop: 10 }}><ProgressBar value={sg.impactScore} color={sg.impactScore >= 80 ? T.red : T.gold} /></div>
            </div>
          ))}
        </div>
      </Section>

      {/* 9. Controversy Validation Summary */}
      <Section title="Controversy Validation Summary" badge="Validated vs gaps">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {topicScores.map(t => (
            <div key={t.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{t.id}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.controversy > 2 ? T.red : t.controversy > 0 ? T.amber : T.sage }}>{t.controversy}</div>
              <div style={{ fontSize: 10, color: T.textMut }}>controversies</div>
              <div style={{ marginTop: 6 }}>
                <Pill label={t.validated ? 'Validated' : 'Gap'} color={t.validated ? T.green : T.red} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 10. Emerging Materiality Alerts */}
      <Section title="Emerging Materiality Alerts" badge={`${emergingAlerts.length} topics trending`}>
        {emergingAlerts.length === 0 ? (
          <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, textAlign: 'center', color: T.textSec, fontSize: 14 }}>
            No topics currently trending toward materiality threshold. Assessment stable.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {emergingAlerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.surface, borderRadius: 10, padding: '12px 18px', border: `1px solid ${T.amber}30`, borderLeft: `4px solid ${T.amber}` }}>
                <div style={{ width: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.navy }}>{a.id}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>+{a.trend}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{a.reason} | Current financial: {a.financial} (threshold: {MATERIAL_THRESHOLD})</div>
                </div>
                <Pill label={a.urgency} color={a.urgency === 'High' ? T.red : T.amber} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 11. Cross-Module Consistency */}
      <Section title="Cross-Module Consistency" badge="Framework alignment check">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {consistency.map((c, i) => {
            const pct = Math.round((c.aligned / c.total) * 100);
            return (
              <div key={i} onClick={() => navigate(c.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.framework}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: pct >= 80 ? T.green : pct >= 60 ? T.gold : T.red }}>{pct}%</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{c.aligned}/{c.total} topics aligned</div>
                <ProgressBar value={pct} color={pct >= 80 ? T.green : pct >= 60 ? T.gold : T.red} />
              </div>
            );
          })}
        </div>
      </Section>

      {/* 12. Action Prioritization */}
      <Section title="Action Prioritization" badge={`${actions.length} actions from all modules`}>
        <div style={{ display: 'grid', gap: 8 }}>
          {actions.slice(0, 10).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.surface, borderRadius: 10, padding: '10px 16px', border: `1px solid ${T.border}`, borderLeft: `4px solid ${a.priority === 'Critical' ? T.red : a.priority === 'High' ? T.amber : a.priority === 'Medium' ? T.gold : T.sage}` }}>
              <Pill label={a.priority} color={a.priority === 'Critical' ? T.red : a.priority === 'High' ? T.amber : a.priority === 'Medium' ? T.gold : T.sage} />
              <div style={{ flex: 1, fontSize: 13, color: T.text }}>{a.action}</div>
              <Pill label={a.module} color={T.navy} />
              {a.topic !== '-' && <span style={{ fontSize: 11, fontWeight: 700, color: T.textMut }}>{a.topic}</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* 12b. Materiality Heatmap by Pillar */}
      <Section title="Materiality Heatmap by Pillar" badge="E / S / G breakdown">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {['E', 'S', 'G'].map(pillar => {
            const pts = topicScores.filter(t => t.pillar === pillar);
            const pillarLabel = pillar === 'E' ? 'Environmental' : pillar === 'S' ? 'Social' : 'Governance';
            const pillarColor = pillar === 'E' ? T.sage : pillar === 'S' ? T.gold : T.navy;
            const avgFin = Math.round(pts.reduce((s, t) => s + t.financial, 0) / pts.length);
            const avgImp = Math.round(pts.reduce((s, t) => s + t.impact, 0) / pts.length);
            const avgCombined = Math.round(pts.reduce((s, t) => s + t.combined, 0) / pts.length);
            return (
              <div key={pillar} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, borderTop: `3px solid ${pillarColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{pillarLabel}</span>
                  <Pill label={`${pts.length} topics`} color={pillarColor} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center', padding: 8, background: T.surfaceH, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Financial</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: avgFin >= MATERIAL_THRESHOLD ? T.red : T.navy }}>{avgFin}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 8, background: T.surfaceH, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Impact</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: avgImp >= MATERIAL_THRESHOLD ? T.red : T.navy }}>{avgImp}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 8, background: T.surfaceH, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Combined</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: avgCombined >= 65 ? T.red : T.navy }}>{avgCombined}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {pts.map(t => {
                    const pct = t.combined;
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 26, fontSize: 11, fontWeight: 700, color: T.navy }}>{t.id}</span>
                        <div style={{ flex: 1, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 65 ? T.red : pct >= 50 ? T.gold : T.sage, borderRadius: 4 }} />
                        </div>
                        <span style={{ width: 30, textAlign: 'right', fontSize: 11, fontWeight: 700, color: pct >= 65 ? T.red : T.text }}>{pct}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 12c. Radar Overview */}
      <Section title="Multi-Dimension Radar" badge="Financial vs Impact vs Stakeholder">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={topicScores.map(t => ({ topic: t.id, financial: t.financial, impact: t.impact, stakeholder: t.stakeholder }))}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: T.navy, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
              <Radar name="Financial" dataKey="financial" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Impact" dataKey="impact" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Stakeholder" dataKey="stakeholder" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 12d. Data Freshness & Coverage */}
      <Section title="Data Freshness & Coverage" badge="Assessment quality metrics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label: 'Financial Scores', coverage: 92, lastUpdated: '2 days ago', source: 'Annual reports + SFDR PAI data' },
            { label: 'Impact Scores', coverage: 87, lastUpdated: '5 days ago', source: 'Stakeholder surveys + CSRD DMA' },
            { label: 'Trend Data', coverage: 78, lastUpdated: '1 week ago', source: 'Regulatory tracker + news NLP' },
            { label: 'Controversy Links', coverage: 84, lastUpdated: '3 days ago', source: 'Controversy monitor + RepRisk' },
          ].map((d, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{d.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: d.coverage >= 90 ? T.green : d.coverage >= 80 ? T.gold : T.amber }}>{d.coverage}%</span>
                <span style={{ fontSize: 11, color: T.textMut }}>coverage</span>
              </div>
              <ProgressBar value={d.coverage} color={d.coverage >= 90 ? T.green : d.coverage >= 80 ? T.gold : T.amber} />
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Updated: {d.lastUpdated}</div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{d.source}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 12e. Reporting Readiness by Framework */}
      <Section title="Reporting Readiness" badge="Disclosure gap analysis">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {FRAMEWORKS.map((fw, i) => {
              const topicCoverage = fw.topics.map(tid => {
                const t = topicScores.find(ts => ts.id === tid);
                return { id: tid, validated: t?.validated || false, financial: t?.financial || 0, cls: t?.cls || 'Not Material' };
              });
              const validatedPct = Math.round((topicCoverage.filter(tc => tc.validated).length / topicCoverage.length) * 100);
              const materialPct = Math.round((topicCoverage.filter(tc => tc.cls !== 'Not Material').length / topicCoverage.length) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: T.surfaceH, borderRadius: 10 }}>
                  <div style={{ width: 160, fontSize: 13, fontWeight: 700, color: T.navy }}>{fw.name}</div>
                  <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                    {topicCoverage.map(tc => (
                      <div key={tc.id} style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', background: tc.validated ? T.green : tc.cls !== 'Not Material' ? T.amber : T.textMut }}>{tc.id}</div>
                    ))}
                  </div>
                  <div style={{ width: 80, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: validatedPct >= 80 ? T.green : T.amber }}>{validatedPct}%</div>
                    <div style={{ fontSize: 9, color: T.textMut }}>Validated</div>
                  </div>
                  <div style={{ width: 80, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: materialPct >= 80 ? T.green : T.amber }}>{materialPct}%</div>
                    <div style={{ fontSize: 9, color: T.textMut }}>Material</div>
                  </div>
                  <Pill label={fw.status} color={fw.status === 'Active' ? T.green : T.amber} />
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 12f. Custom Scenario Integration */}
      {customScenario?.adjustments && (
        <Section title="Custom Scenario Status" badge="From Scenario Simulator">
          <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{customScenario.name || 'Custom Scenario'}</div>
                <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>Last saved: {customScenario.timestamp ? new Date(customScenario.timestamp).toLocaleString() : 'Unknown'}</div>
              </div>
              <NavBtn label="Open Simulator" path="/materiality-scenarios" nav={navigate} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 6 }}>
              {ESRS_TOPICS.map(t => {
                const adj = customScenario.adjustments?.[t.id] || 0;
                return (
                  <div key={t.id} style={{ textAlign: 'center', padding: 8, background: T.surfaceH, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{t.id}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: adj > 0 ? T.red : adj < 0 ? T.sage : T.textMut }}>
                      {adj > 0 ? '+' : ''}{adj}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* 13. Sortable Combined Table */}
      <Section title="Combined Materiality Scorecard" badge="All 10 ESRS topics across 5 modules">
        <SortableTable
          columns={[
            { key: 'id', label: 'ID', render: r => <span style={{ fontWeight: 700 }}>{r.id}</span> },
            { key: 'label', label: 'Topic' },
            { key: 'pillar', label: 'Pillar', align: 'center', render: r => <Pill label={r.pillar} color={r.pillar === 'E' ? T.sage : r.pillar === 'S' ? T.gold : T.navy} /> },
            { key: 'financial', label: 'Financial', align: 'center', render: r => <span style={{ fontWeight: 700, color: r.financial >= MATERIAL_THRESHOLD ? T.red : T.text }}>{r.financial}</span> },
            { key: 'impact', label: 'Impact', align: 'center', render: r => <span style={{ fontWeight: 700, color: r.impact >= MATERIAL_THRESHOLD ? T.red : T.text }}>{r.impact}</span> },
            { key: 'stakeholder', label: 'Stakeholder', align: 'center' },
            { key: 'trend', label: 'Trend', align: 'center', render: r => <span style={{ fontWeight: 700, color: r.trend > 5 ? T.red : r.trend < -5 ? T.sage : T.textSec }}>{r.trend > 0 ? '+' : ''}{r.trend}</span> },
            { key: 'controversy', label: 'Controv.', align: 'center', render: r => <span style={{ fontWeight: 700, color: r.controversy > 2 ? T.red : T.text }}>{r.controversy}</span> },
            { key: 'scenarioMax', label: 'Scenario\u0394', align: 'center', render: r => <span style={{ color: r.scenarioMax > 15 ? T.red : T.text }}>+{r.scenarioMax}</span> },
            { key: 'combined', label: 'Combined', align: 'center', render: r => <span style={{ fontWeight: 800, color: r.combined >= 65 ? T.red : r.combined >= 50 ? T.gold : T.text }}>{r.combined}</span> },
            { key: 'cls', label: 'Class', render: r => <Pill label={r.cls} color={clsColor(r.cls)} /> },
            { key: 'validated', label: 'Valid.', align: 'center', render: r => r.validated ? <span style={{ color: T.green, fontWeight: 700 }}>\u2713</span> : <span style={{ color: T.red, fontWeight: 700 }}>\u2717</span> },
          ]}
          data={sortFn(topicScores, sortCol, sortDir)}
          onSort={handleSort}
          sortCol={sortCol}
          sortDir={sortDir}
        />
      </Section>

      {/* 13b. Stakeholder Engagement Tracker */}
      <Section title="Stakeholder Engagement Tracker" badge="All 6 groups">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {STAKEHOLDER_GROUPS.map((sg, i) => {
              const engagementLevel = sg.impactScore > 80 ? 'Active' : sg.impactScore > 65 ? 'Periodic' : 'Planned';
              const lastEngagement = `${Math.round(3 + sr(hashStr(sg.name), i) * 25)} days ago`;
              const nextAction = sg.impactScore > 80 ? 'Quarterly review scheduled' : sg.impactScore > 65 ? 'Annual survey pending' : 'Initial outreach planned';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: i % 2 === 0 ? T.surface : T.surfaceH, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 180, fontSize: 13, fontWeight: 700, color: T.navy }}>{sg.name}</div>
                  <div style={{ width: 70, textAlign: 'center' }}>
                    <Pill label={engagementLevel} color={engagementLevel === 'Active' ? T.green : engagementLevel === 'Periodic' ? T.gold : T.textMut} />
                  </div>
                  <div style={{ width: 60, textAlign: 'center', fontSize: 18, fontWeight: 800, color: sg.impactScore >= 80 ? T.red : T.gold }}>{sg.impactScore}</div>
                  <div style={{ width: 70, textAlign: 'center', fontSize: 12, color: T.textSec }}>{(sg.weight * 100).toFixed(0)}%</div>
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    {sg.topConcerns.map(tc => <Pill key={tc} label={tc} color={T.navy} />)}
                  </div>
                  <div style={{ width: 100, fontSize: 11, color: T.textMut, textAlign: 'right' }}>{lastEngagement}</div>
                  <div style={{ width: 180, fontSize: 11, color: T.textSec }}>{nextAction}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 13c. Assessment Completeness Matrix */}
      <Section title="Assessment Completeness Matrix" badge="Gap identification">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 14 }}>
            Coverage of each assessment dimension across all 10 ESRS topics. Green = complete, amber = partial, red = missing.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>TOPIC</th>
                  {['Financial Score', 'Impact Score', 'Stakeholder View', 'Trend Analysis', 'Controversy Link', 'Scenario Test', 'IRO Registry', 'Disclosure Map'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'center', color: T.navy, fontWeight: 700, borderBottom: `2px solid ${T.border}`, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topicScores.map((t, ri) => {
                  const dims = [
                    t.financial > 0, t.impact > 0, t.stakeholder > 0, Math.abs(t.trend) > 0,
                    t.controversy > 0, t.scenarioMax > 0, sr(hashStr(t.id), 70) > 0.3, sr(hashStr(t.id), 80) > 0.25
                  ];
                  return (
                    <tr key={t.id} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{t.id} — {t.label}</td>
                      {dims.map((complete, di) => (
                        <td key={di} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, background: complete ? T.green : T.red + '40', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                            {complete ? '\u2713' : '\u2717'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 13d. Portfolio-Level Materiality Overview */}
      <Section title="Portfolio-Level Materiality" badge="Holdings integration">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top Holdings by Materiality Exposure</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {companies.slice(0, 8).map((c, i) => {
                  const name = c.company_name || c.name || `Company ${i + 1}`;
                  const seed = hashStr(name);
                  const exposure = Math.round(40 + sr(seed, 5) * 55);
                  const weight = +(1.5 + sr(seed, 8) * 7).toFixed(1);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: T.surfaceH, borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.navy }}>{name}</span>
                      <span style={{ fontSize: 11, color: T.textMut }}>{weight}%</span>
                      <div style={{ width: 80, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${exposure}%`, background: exposure >= 70 ? T.red : exposure >= 50 ? T.gold : T.sage, borderRadius: 3 }} />
                      </div>
                      <span style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 700, color: exposure >= 70 ? T.red : T.text }}>{exposure}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Portfolio Materiality by Pillar</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={['E', 'S', 'G'].map(p => {
                  const pts = topicScores.filter(t => t.pillar === p);
                  return {
                    pillar: p === 'E' ? 'Environmental' : p === 'S' ? 'Social' : 'Governance',
                    financial: Math.round(pts.reduce((s, t) => s + t.financial, 0) / pts.length),
                    impact: Math.round(pts.reduce((s, t) => s + t.impact, 0) / pts.length),
                    combined: Math.round(pts.reduce((s, t) => s + t.combined, 0) / pts.length),
                  };
                })} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="pillar" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="financial" name="Financial" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="impact" name="Impact" fill={T.sage} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="combined" name="Combined" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Section>

      {/* 14. Cross-Navigation */}
      <Section title="Navigation" badge="Sprint T + Cross-Sprint">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <NavBtn label="Double Materiality" path="/double-materiality" nav={navigate} primary />
          <NavBtn label="Stakeholder Impact" path="/stakeholder-impact" nav={navigate} primary />
          <NavBtn label="Materiality Trends" path="/materiality-trends" nav={navigate} primary />
          <NavBtn label="Controversy Materiality" path="/controversy-materiality" nav={navigate} primary />
          <NavBtn label="Scenario Simulator" path="/materiality-scenarios" nav={navigate} primary />
          <NavBtn label="ISSB Materiality" path="/issb-materiality" nav={navigate} />
          <NavBtn label="GRI Reporting" path="/gri-reporting" nav={navigate} />
          <NavBtn label="SFDR Classification" path="/sfdr-classification" nav={navigate} />
          <NavBtn label="CSRD Reporting" path="/csrd-reporting" nav={navigate} />
          <NavBtn label="Report Studio" path="/advanced-report-studio" nav={navigate} />
          <NavBtn label="TNFD Reporting" path="/tnfd-reporting" nav={navigate} />
        </div>
      </Section>

    </div>
  );
};

export default MaterialityHubPage;
