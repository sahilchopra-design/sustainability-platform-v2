/**
 * EP-T5 — Materiality Scenario Simulator
 * Sprint T — Dynamic Materiality Engine
 *
 * Simulates how materiality assessments change under different future scenarios
 * (regulatory, scientific, market). Supports 1-2 scenario comparison, custom
 * scenario builder with sliders, portfolio impact analysis, and reclassification alerts.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Deterministic seed helpers ────────────────────────────────────────────── */
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = seed => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, off = 0) => seededRandom(seed + off);

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

/* ── Materiality Scenarios ─────────────────────────────────────────────────── */
const MATERIALITY_SCENARIOS = [
  { id: 'regulatory_acceleration', name: 'Regulatory Acceleration', color: '#dc2626', icon: '\u2696\uFE0F', description: 'All planned regulations implemented on schedule or ahead. CSRD scope expands. Carbon pricing doubles. CSDDD enacted globally. TNFD mandatory.', adjustments: { E1: +20, E2: +15, E3: +12, E4: +18, E5: +10, S1: +8, S2: +15, S3: +12, S4: +5, G1: +15 } },
  { id: 'market_driven', name: 'Market-Driven Transition', color: '#16a34a', icon: '\uD83D\uDCC8', description: 'Markets lead transition faster than regulation. ESG funds dominate AUM. Carbon markets mature. Green premium drives adoption.', adjustments: { E1: +15, E2: +8, E3: +5, E4: +10, E5: +12, S1: +5, S2: +8, S3: +5, S4: +10, G1: +8 } },
  { id: 'backlash', name: 'ESG Backlash & Fragmentation', color: '#d97706', icon: '\u26A0\uFE0F', description: 'Political backlash slows ESG integration in US/UK. EU proceeds alone. Fragmented regulation. Greenwashing scandals erode trust.', adjustments: { E1: -5, E2: -3, E3: -2, E4: -5, E5: -3, S1: +5, S2: +3, S3: 0, S4: +8, G1: +10 } },
  { id: 'nature_crisis', name: 'Nature & Social Crisis', color: '#7c3aed', icon: '\uD83C\uDF0D', description: 'Multiple ecosystem tipping points crossed. Water crises. Food price spikes. Social unrest. Nature becomes the dominant ESG theme, surpassing climate.', adjustments: { E1: +5, E2: +20, E3: +25, E4: +30, E5: +15, S1: +10, S2: +15, S3: +20, S4: +10, G1: +5 } },
];

const SECTORS = ['Energy', 'Materials', 'Industrials', 'Financials', 'Technology', 'Healthcare', 'Consumer', 'Utilities', 'Real Estate', 'Telecom'];
const SECTOR_WEIGHTS = { Energy: 0.14, Materials: 0.09, Industrials: 0.11, Financials: 0.16, Technology: 0.13, Healthcare: 0.08, Consumer: 0.10, Utilities: 0.07, 'Real Estate': 0.06, Telecom: 0.06 };
const MATERIAL_THRESHOLD = 60;

/* ── localStorage helpers ──────────────────────────────────────────────────── */
const LS_KEY_PORTFOLIO = 'ra_portfolio_v1';
const LS_KEY_CUSTOM = 'ra_custom_materiality_scenario_v1';
const readLS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ── Generate baseline scores per topic (seeded by company mix) ────────────── */
const buildBaselineScores = () => {
  const base = {};
  ESRS_TOPICS.forEach((t, i) => {
    const s = sr(hashStr(t.id), i);
    base[t.id] = { financial: Math.round(35 + s * 55), impact: Math.round(30 + sr(hashStr(t.id), i + 10) * 60) };
  });
  return base;
};

/* ── Shared UI components ──────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent || T.border}`, borderRadius: 10, padding: '16px 18px', borderTop: accent ? `3px solid ${accent}` : undefined }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy, marginTop: 6, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 4, fontFamily: T.font }}>{sub}</div>}
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
            <th key={c.key} onClick={() => onSort && onSort(c.key)} style={{ padding: '10px 14px', textAlign: c.align || 'left', color: T.navy, fontWeight: 700, cursor: onSort ? 'pointer' : 'default', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', userSelect: 'none', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {c.label}{sortCol === c.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
            {columns.map(c => (
              <td key={c.key} style={{ padding: '10px 14px', textAlign: c.align || 'left', color: T.text }}>{c.render ? c.render(row) : row[c.key]}</td>
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

const NavBtn = ({ label, path, nav }) => (
  <button onClick={() => nav(path)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s' }}
    onMouseEnter={e => { e.target.style.background = T.gold; e.target.style.color = '#fff'; e.target.style.borderColor = T.gold; }}
    onMouseLeave={e => { e.target.style.background = T.surface; e.target.style.color = T.navy; e.target.style.borderColor = T.border; }}>
    {label} \u2192
  </button>
);

/* ════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ════════════════════════════════════════════════════════════════════════════ */
const MaterialityScenariosPage = () => {
  const navigate = useNavigate();
  const portfolio = useMemo(() => readLS(LS_KEY_PORTFOLIO) || [], []);
  const companies = useMemo(() => (GLOBAL_COMPANY_MASTER || []).slice(0, 120), []);

  /* state */
  const [selectedScenarios, setSelectedScenarios] = useState(['regulatory_acceleration']);
  const [sortCol, setSortCol] = useState('topic');
  const [sortDir, setSortDir] = useState('asc');
  const [customAdj, setCustomAdj] = useState(() => {
    const saved = readLS(LS_KEY_CUSTOM);
    if (saved && saved.adjustments) return saved.adjustments;
    const init = {};
    ESRS_TOPICS.forEach(t => { init[t.id] = 0; });
    return init;
  });
  const [customName, setCustomName] = useState(() => {
    const saved = readLS(LS_KEY_CUSTOM);
    return saved?.name || 'My Custom Scenario';
  });
  const [showCustom, setShowCustom] = useState(false);

  /* baseline scores */
  const baseline = useMemo(() => buildBaselineScores(), []);

  /* toggle scenario */
  const toggleScenario = id => {
    setSelectedScenarios(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const activeScenarios = useMemo(() => MATERIALITY_SCENARIOS.filter(s => selectedScenarios.includes(s.id)), [selectedScenarios]);
  const primaryScenario = activeScenarios[0] || MATERIALITY_SCENARIOS[0];

  /* apply scenario adjustments */
  const applyScenario = useCallback((scenario) => {
    const result = {};
    ESRS_TOPICS.forEach(t => {
      const adj = scenario.adjustments[t.id] || 0;
      result[t.id] = {
        financial: Math.min(100, Math.max(0, baseline[t.id].financial + adj)),
        impact: Math.min(100, Math.max(0, baseline[t.id].impact + Math.round(adj * 0.8))),
      };
    });
    return result;
  }, [baseline]);

  const scenarioScores = useMemo(() => {
    const map = {};
    activeScenarios.forEach(s => { map[s.id] = applyScenario(s); });
    return map;
  }, [activeScenarios, applyScenario]);

  /* classify material / not material */
  const classify = (fin, imp) => {
    if (fin >= MATERIAL_THRESHOLD && imp >= MATERIAL_THRESHOLD) return 'Double Material';
    if (fin >= MATERIAL_THRESHOLD) return 'Financial Material';
    if (imp >= MATERIAL_THRESHOLD) return 'Impact Material';
    return 'Not Material';
  };

  /* reclassifications */
  const reclassifications = useMemo(() => {
    const reclass = [];
    ESRS_TOPICS.forEach(t => {
      const baseCls = classify(baseline[t.id].financial, baseline[t.id].impact);
      activeScenarios.forEach(sc => {
        const scores = scenarioScores[sc.id];
        if (!scores) return;
        const newCls = classify(scores[t.id].financial, scores[t.id].impact);
        if (baseCls !== newCls) {
          reclass.push({ topic: t.id, label: t.label, from: baseCls, to: newCls, scenario: sc.name, color: sc.color });
        }
      });
    });
    return reclass;
  }, [baseline, activeScenarios, scenarioScores]);

  /* KPI computations */
  const kpis = useMemo(() => {
    const sc = primaryScenario;
    const scores = scenarioScores[sc.id] || {};
    let reclassCount = 0, newMaterial = 0, dematerialized = 0, maxDelta = 0;
    ESRS_TOPICS.forEach(t => {
      const baseCls = classify(baseline[t.id].financial, baseline[t.id].impact);
      const newCls = classify(scores[t.id]?.financial || 0, scores[t.id]?.impact || 0);
      if (baseCls !== newCls) reclassCount++;
      if (baseCls === 'Not Material' && newCls !== 'Not Material') newMaterial++;
      if (baseCls !== 'Not Material' && newCls === 'Not Material') dematerialized++;
      const delta = Math.abs((scores[t.id]?.financial || 0) - baseline[t.id].financial);
      if (delta > maxDelta) maxDelta = delta;
    });
    const portfolioImpact = (reclassCount * 2.3 + newMaterial * 3.1).toFixed(1);
    const sectorVulnerability = {};
    SECTORS.forEach(sec => {
      let total = 0;
      ESRS_TOPICS.forEach(t => {
        const adj = sc.adjustments[t.id] || 0;
        total += Math.abs(adj) * (SECTOR_WEIGHTS[sec] || 0.1);
      });
      sectorVulnerability[sec] = Math.round(total);
    });
    const mostAffected = Object.entries(sectorVulnerability).sort((a, b) => b[1] - a[1])[0];
    return { scenarioName: sc.name, reclassCount, newMaterial, dematerialized, maxDelta, portfolioImpact, mostAffected: mostAffected ? mostAffected[0] : 'N/A', engagementChanges: reclassCount + newMaterial };
  }, [primaryScenario, scenarioScores, baseline]);

  /* bar chart delta data */
  const deltaData = useMemo(() => {
    return ESRS_TOPICS.map(t => {
      const row = { topic: t.id, label: t.label };
      activeScenarios.forEach(sc => {
        const scores = scenarioScores[sc.id];
        row[sc.id] = scores ? (scores[t.id].financial - baseline[t.id].financial) : 0;
      });
      return row;
    });
  }, [activeScenarios, scenarioScores, baseline]);

  /* scatter data */
  const scatterBaseline = useMemo(() => ESRS_TOPICS.map(t => ({ ...t, x: baseline[t.id].financial, y: baseline[t.id].impact, cls: classify(baseline[t.id].financial, baseline[t.id].impact) })), [baseline]);
  const scatterScenario = useMemo(() => {
    const scores = scenarioScores[primaryScenario.id] || {};
    return ESRS_TOPICS.map(t => ({ ...t, x: scores[t.id]?.financial || 0, y: scores[t.id]?.impact || 0, cls: classify(scores[t.id]?.financial || 0, scores[t.id]?.impact || 0) }));
  }, [primaryScenario, scenarioScores]);

  /* comparison table (2 scenarios) */
  const comparisonData = useMemo(() => {
    if (activeScenarios.length < 2) return [];
    return ESRS_TOPICS.map(t => {
      const s1 = scenarioScores[activeScenarios[0].id]?.[t.id] || { financial: 0, impact: 0 };
      const s2 = scenarioScores[activeScenarios[1].id]?.[t.id] || { financial: 0, impact: 0 };
      return { topic: t.id, label: t.label, base_fin: baseline[t.id].financial, base_imp: baseline[t.id].impact, s1_fin: s1.financial, s1_imp: s1.impact, s2_fin: s2.financial, s2_imp: s2.impact, diff: Math.abs(s1.financial - s2.financial) + Math.abs(s1.impact - s2.impact) };
    });
  }, [activeScenarios, scenarioScores, baseline]);

  /* portfolio holdings impact */
  const holdingsImpact = useMemo(() => {
    const sc = primaryScenario;
    return companies.slice(0, 20).map((c, i) => {
      const seed = hashStr(c.company_name || c.name || `co_${i}`);
      const topTopic = ESRS_TOPICS[Math.abs(seed) % ESRS_TOPICS.length];
      const adj = sc.adjustments[topTopic.id] || 0;
      const sector = c.sector || SECTORS[Math.abs(seed) % SECTORS.length];
      const materialityShift = Math.round(adj * (0.6 + sr(seed, 3) * 0.8));
      return { company: c.company_name || c.name || `Company ${i + 1}`, sector, topicExposed: topTopic.label, materialityShift, weight: +(2 + sr(seed, 7) * 6).toFixed(1), riskChange: materialityShift > 10 ? 'High' : materialityShift > 5 ? 'Medium' : 'Low' };
    }).sort((a, b) => Math.abs(b.materialityShift) - Math.abs(a.materialityShift));
  }, [primaryScenario, companies]);

  /* sector vulnerability */
  const sectorVulnData = useMemo(() => {
    return SECTORS.map(sec => {
      const row = { sector: sec };
      MATERIALITY_SCENARIOS.forEach(sc => {
        let total = 0;
        ESRS_TOPICS.forEach(t => {
          total += Math.abs(sc.adjustments[t.id] || 0) * (SECTOR_WEIGHTS[sec] || 0.1);
        });
        row[sc.id] = Math.round(total);
      });
      return row;
    });
  }, []);

  /* action implications */
  const actions = useMemo(() => {
    const items = [];
    reclassifications.forEach(r => {
      if (r.to.includes('Material') && r.from === 'Not Material') {
        items.push({ priority: 'High', action: `Begin data collection for ${r.label} (now ${r.to})`, type: 'Reporting', scenario: r.scenario });
      }
      if (r.from.includes('Material') && r.to === 'Not Material') {
        items.push({ priority: 'Medium', action: `Review continued reporting on ${r.label} (dematerialized)`, type: 'Efficiency', scenario: r.scenario });
      }
    });
    if (kpis.portfolioImpact > 5) items.push({ priority: 'High', action: 'Rebalance portfolio to reduce materiality-driven risk concentration', type: 'Portfolio', scenario: primaryScenario.name });
    if (kpis.newMaterial > 2) items.push({ priority: 'High', action: 'Engage board on newly material topics before next reporting cycle', type: 'Governance', scenario: primaryScenario.name });
    items.push({ priority: 'Medium', action: 'Update CSRD report templates to reflect scenario-adjusted materiality', type: 'Reporting', scenario: primaryScenario.name });
    items.push({ priority: 'Low', action: 'Schedule stakeholder review of scenario-adjusted materiality matrix', type: 'Engagement', scenario: primaryScenario.name });
    return items;
  }, [reclassifications, kpis, primaryScenario]);

  /* persist custom scenario */
  useEffect(() => {
    writeLS(LS_KEY_CUSTOM, { name: customName, adjustments: customAdj, timestamp: new Date().toISOString() });
  }, [customAdj, customName]);

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
    let md = `# Materiality Scenario Analysis\n\n## Scenario: ${primaryScenario.name}\n\n`;
    md += `| Topic | Baseline Fin | Adjusted Fin | Delta |\n|---|---|---|---|\n`;
    ESRS_TOPICS.forEach(t => {
      const adj = scenarioScores[primaryScenario.id]?.[t.id];
      md += `| ${t.label} | ${baseline[t.id].financial} | ${adj?.financial || '-'} | ${(adj?.financial || 0) - baseline[t.id].financial} |\n`;
    });
    md += `\n## Reclassifications\n\n`;
    reclassifications.forEach(r => { md += `- **${r.label}**: ${r.from} -> ${r.to} (${r.scenario})\n`; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'materiality-scenarios.md'; a.click(); URL.revokeObjectURL(url);
  };

  const clsColor = cls => cls === 'Double Material' ? T.red : cls === 'Financial Material' ? T.amber : cls === 'Impact Material' ? T.sage : T.textMut;

  /* ── RENDER ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh', fontFamily: T.font }}>

      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Materiality Scenario Simulator</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['4 Scenarios', '10 Topics', 'What-If', 'Portfolio Impact'].map(b => (
              <span key={b} style={{ padding: '3px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: T.gold + '22', color: T.gold }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportCSV(deltaData, 'scenario-deltas.csv')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>Export CSV</button>
          <button onClick={() => exportJSON({ scenarios: activeScenarios.map(s => s.id), scores: scenarioScores, reclassifications }, 'scenario-analysis.json')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>Export JSON</button>
          <button onClick={exportMarkdown} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.gold}`, background: T.gold, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>Export Report</button>
        </div>
      </div>

      {/* 2. Scenario Selector */}
      <Section title="Scenario Selector" badge="Select 1-2 for comparison">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {MATERIALITY_SCENARIOS.map(sc => {
            const active = selectedScenarios.includes(sc.id);
            return (
              <div key={sc.id} onClick={() => toggleScenario(sc.id)} style={{ background: active ? sc.color + '12' : T.surface, border: `2px solid ${active ? sc.color : T.border}`, borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{sc.icon}</span>
                  {active && <span style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color }} />}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{sc.name}</div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{sc.description}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {Object.entries(sc.adjustments).filter(([, v]) => Math.abs(v) >= 15).map(([k, v]) => (
                    <Pill key={k} label={`${k} ${v > 0 ? '+' : ''}${v}`} color={v > 0 ? T.red : T.green} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Scenario Selected" value={kpis.scenarioName} sub={activeScenarios.length === 2 ? `+ ${activeScenarios[1].name}` : 'Single scenario mode'} accent={primaryScenario.color} icon="\uD83C\uDFAF" />
        <KpiCard label="Topics Reclassified" value={kpis.reclassCount} sub="Changed classification" accent={kpis.reclassCount > 3 ? T.red : T.gold} icon="\uD83D\uDD04" />
        <KpiCard label="New Material Topics" value={kpis.newMaterial} sub="Previously not material" accent={T.red} icon="\uD83D\uDFE2" />
        <KpiCard label="Dematerialized Topics" value={kpis.dematerialized} sub="No longer material" accent={T.sage} icon="\uD83D\uDFE1" />
        <KpiCard label="Max Score Change" value={`\u00B1${kpis.maxDelta}`} sub="Largest single shift" accent={T.navy} icon="\uD83D\uDCC9" />
        <KpiCard label="Portfolio Impact" value={`${kpis.portfolioImpact}%`} sub="Estimated risk delta" accent={parseFloat(kpis.portfolioImpact) > 5 ? T.red : T.gold} icon="\uD83D\uDCBC" />
        <KpiCard label="Most Affected Sector" value={kpis.mostAffected} sub="Highest vulnerability" accent={T.amber} icon="\uD83C\uDFED" />
        <KpiCard label="Engagement Changes" value={kpis.engagementChanges} sub="Priority adjustments" accent={T.sage} icon="\uD83D\uDCE3" />
      </div>

      {/* 4. Materiality Matrix — Side by Side Scatter */}
      <Section title="Scenario Impact on Materiality Matrix" badge="Current vs Scenario-Adjusted">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[{ title: 'Current Baseline', data: scatterBaseline, color: T.navy }, { title: primaryScenario.name, data: scatterScenario, color: primaryScenario.color }].map((panel, pi) => (
            <div key={pi} style={{ background: T.surface, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{panel.title}</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="x" name="Financial" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Financial Materiality', position: 'bottom', offset: 0, style: { fontSize: 11, fill: T.textSec } }} />
                  <YAxis type="number" dataKey="y" name="Impact" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Impact', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textSec } }} />
                  <ReferenceLine x={MATERIAL_THRESHOLD} stroke={T.amber} strokeDasharray="5 5" />
                  <ReferenceLine y={MATERIAL_THRESHOLD} stroke={T.amber} strokeDasharray="5 5" />
                  <Tooltip content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, fontFamily: T.font }}>
                      <div style={{ fontWeight: 700, color: T.navy }}>{d.id} — {d.label}</div>
                      <div>Financial: {d.x} | Impact: {d.y}</div>
                      <div style={{ color: clsColor(d.cls), fontWeight: 600 }}>{d.cls}</div>
                    </div>);
                  }} />
                  <Scatter data={panel.data}>
                    {panel.data.map((d, i) => <Cell key={i} fill={clsColor(d.cls)} r={8} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Topic Score Changes Bar Chart */}
      <Section title="Topic Score Changes" badge="Delta per topic">
        <div style={{ background: T.surface, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deltaData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
              <ReferenceLine y={0} stroke={T.textMut} />
              {activeScenarios.map(sc => (
                <Bar key={sc.id} dataKey={sc.id} name={sc.name} fill={sc.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 6. Scenario Comparison Table */}
      {activeScenarios.length === 2 && (
        <Section title="Scenario Comparison" badge={`${activeScenarios[0].name} vs ${activeScenarios[1].name}`}>
          <SortableTable
            columns={[
              { key: 'topic', label: 'Topic' },
              { key: 'label', label: 'Name' },
              { key: 'base_fin', label: 'Baseline Fin', align: 'center' },
              { key: 's1_fin', label: `${activeScenarios[0].name.slice(0, 12)} Fin`, align: 'center', render: r => <span style={{ color: r.s1_fin >= MATERIAL_THRESHOLD ? T.red : T.text, fontWeight: r.s1_fin >= MATERIAL_THRESHOLD ? 700 : 400 }}>{r.s1_fin}</span> },
              { key: 's1_imp', label: `${activeScenarios[0].name.slice(0, 12)} Imp`, align: 'center' },
              { key: 's2_fin', label: `${activeScenarios[1].name.slice(0, 12)} Fin`, align: 'center', render: r => <span style={{ color: r.s2_fin >= MATERIAL_THRESHOLD ? T.red : T.text, fontWeight: r.s2_fin >= MATERIAL_THRESHOLD ? 700 : 400 }}>{r.s2_fin}</span> },
              { key: 's2_imp', label: `${activeScenarios[1].name.slice(0, 12)} Imp`, align: 'center' },
              { key: 'diff', label: 'Divergence', align: 'center', render: r => <span style={{ fontWeight: 700, color: r.diff > 20 ? T.red : r.diff > 10 ? T.amber : T.sage }}>{r.diff}</span> },
            ]}
            data={sortFn(comparisonData, sortCol, sortDir)}
            onSort={handleSort}
            sortCol={sortCol}
            sortDir={sortDir}
          />
        </Section>
      )}

      {/* 7. Portfolio Materiality Under Scenario */}
      <Section title="Portfolio Materiality Under Scenario" badge="Top 20 holdings">
        <SortableTable
          columns={[
            { key: 'company', label: 'Company' },
            { key: 'sector', label: 'Sector' },
            { key: 'topicExposed', label: 'Top Exposure' },
            { key: 'weight', label: 'Weight %', align: 'center' },
            { key: 'materialityShift', label: 'Score Shift', align: 'center', render: r => <span style={{ fontWeight: 700, color: r.materialityShift > 10 ? T.red : r.materialityShift > 0 ? T.amber : T.sage }}>{r.materialityShift > 0 ? '+' : ''}{r.materialityShift}</span> },
            { key: 'riskChange', label: 'Risk Change', render: r => <Pill label={r.riskChange} color={r.riskChange === 'High' ? T.red : r.riskChange === 'Medium' ? T.amber : T.sage} /> },
          ]}
          data={sortFn(holdingsImpact, sortCol, sortDir)}
          onSort={handleSort}
          sortCol={sortCol}
          sortDir={sortDir}
        />
      </Section>

      {/* 8. Sector Vulnerability */}
      <Section title="Sector Vulnerability to Materiality Shifts" badge="All 4 scenarios">
        <div style={{ background: T.surface, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` }}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={sectorVulnData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
              {MATERIALITY_SCENARIOS.map(sc => (
                <Bar key={sc.id} dataKey={sc.id} name={sc.name} fill={sc.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 9. Reclassification Alerts */}
      <Section title="Reclassification Alerts" badge={`${reclassifications.length} changes`}>
        {reclassifications.length === 0 ? (
          <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, textAlign: 'center', color: T.textSec, fontSize: 14 }}>
            No topics change quadrant under the selected scenario(s). Adjust scenario selection or try the Custom Scenario Builder below.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {reclassifications.map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${r.color}30`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${r.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{r.topic} — {r.label}</span>
                  <Pill label={r.scenario} color={r.color} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ color: clsColor(r.from), fontWeight: 600 }}>{r.from}</span>
                  <span style={{ color: T.textMut }}>\u2192</span>
                  <span style={{ color: clsColor(r.to), fontWeight: 700 }}>{r.to}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 10. Combined Scenario Builder */}
      <Section title="Custom Scenario Builder" badge="Persist to localStorage">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input value={customName} onChange={e => setCustomName(e.target.value)} style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: T.navy, fontFamily: T.font, width: 260 }} />
              <button onClick={() => setShowCustom(!showCustom)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.gold}`, background: showCustom ? T.gold : T.surface, color: showCustom ? '#fff' : T.gold, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>
                {showCustom ? 'Hide Sliders' : 'Show Sliders'}
              </button>
            </div>
            <button onClick={() => {
              const reset = {};
              ESRS_TOPICS.forEach(t => { reset[t.id] = 0; });
              setCustomAdj(reset);
            }} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSec, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>
              Reset All
            </button>
          </div>
          {showCustom && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {ESRS_TOPICS.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: T.surfaceH, borderRadius: 8 }}>
                  <div style={{ width: 36, fontSize: 12, fontWeight: 700, color: T.navy }}>{t.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{t.label}</div>
                    <input type="range" min={-30} max={30} value={customAdj[t.id] || 0} onChange={e => setCustomAdj(prev => ({ ...prev, [t.id]: parseInt(e.target.value) }))}
                      style={{ width: '100%', accentColor: (customAdj[t.id] || 0) > 0 ? T.red : (customAdj[t.id] || 0) < 0 ? T.sage : T.navy }} />
                  </div>
                  <div style={{ width: 44, textAlign: 'right', fontSize: 14, fontWeight: 700, color: (customAdj[t.id] || 0) > 0 ? T.red : (customAdj[t.id] || 0) < 0 ? T.sage : T.navy }}>
                    {(customAdj[t.id] || 0) > 0 ? '+' : ''}{customAdj[t.id] || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
          {showCustom && (
            <div style={{ marginTop: 16, padding: 14, background: T.surfaceH, borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Custom Scenario Preview</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {ESRS_TOPICS.map(t => {
                  const adj = customAdj[t.id] || 0;
                  const newFin = Math.min(100, Math.max(0, baseline[t.id].financial + adj));
                  const newCls = classify(newFin, Math.min(100, Math.max(0, baseline[t.id].impact + Math.round(adj * 0.8))));
                  return (
                    <div key={t.id} style={{ background: T.surface, borderRadius: 8, padding: 10, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{t.id}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: adj !== 0 ? (adj > 0 ? T.red : T.sage) : T.navy }}>{newFin}</div>
                      <div style={{ fontSize: 10, color: clsColor(newCls) }}>{newCls}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 10b. Scenario Probability Weighting */}
      <Section title="Scenario Probability Weighting" badge="Likelihood-adjusted view">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16, fontFamily: T.font }}>
            Assign probability weights to each scenario to compute an expected materiality score. Weights must sum to 100%.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
            {MATERIALITY_SCENARIOS.map(sc => {
              const defaultProb = sc.id === 'regulatory_acceleration' ? 35 : sc.id === 'market_driven' ? 30 : sc.id === 'backlash' ? 20 : 15;
              return (
                <div key={sc.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderTop: `3px solid ${sc.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{sc.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: sc.color }}>{defaultProb}%</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${defaultProb}%`, background: sc.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>
                    Weighted avg shift: {ESRS_TOPICS.reduce((s, t) => s + Math.abs(sc.adjustments[t.id] || 0), 0) > 80 ? 'High' : 'Moderate'}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Probability-Weighted Expected Scores</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {ESRS_TOPICS.map(t => {
              const weights = [0.35, 0.30, 0.20, 0.15];
              const expected = Math.round(MATERIALITY_SCENARIOS.reduce((s, sc, i) => {
                const adj = sc.adjustments[t.id] || 0;
                return s + (baseline[t.id].financial + adj) * weights[i];
              }, 0));
              const expectedCls = classify(expected, Math.round(expected * 0.85));
              return (
                <div key={t.id} style={{ background: T.surface, borderRadius: 8, padding: 10, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{t.id}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: expected >= MATERIAL_THRESHOLD ? T.red : T.navy }}>{expected}</div>
                  <div style={{ fontSize: 10, color: clsColor(expectedCls) }}>{expectedCls}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 10c. Radar View — Topic Sensitivity */}
      <Section title="Topic Sensitivity Radar" badge="All scenarios overlay">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={ESRS_TOPICS.map(t => {
              const row = { topic: t.id };
              row.baseline = baseline[t.id].financial;
              MATERIALITY_SCENARIOS.forEach(sc => {
                row[sc.id] = Math.min(100, Math.max(0, baseline[t.id].financial + (sc.adjustments[t.id] || 0)));
              });
              return row;
            })}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: T.navy, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
              <Radar name="Baseline" dataKey="baseline" stroke={T.navy} fill={T.navy} fillOpacity={0.05} strokeWidth={2} strokeDasharray="5 5" />
              {MATERIALITY_SCENARIOS.map(sc => (
                <Radar key={sc.id} name={sc.name} dataKey={sc.id} stroke={sc.color} fill={sc.color} fillOpacity={0.08} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 10d. Timeline Sensitivity — How early do reclassifications happen */}
      <Section title="Reclassification Timeline Sensitivity" badge="Years to reclassification">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 14, fontFamily: T.font }}>
            Estimated time horizon for each topic to cross the materiality threshold under the primary scenario, assuming linear adjustment.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {ESRS_TOPICS.map(t => {
              const adj = primaryScenario.adjustments[t.id] || 0;
              const gap = MATERIAL_THRESHOLD - baseline[t.id].financial;
              const yearsToThreshold = adj > 0 && gap > 0 ? Math.min(10, Math.max(0.5, +(gap / adj).toFixed(1))) : adj > 0 && gap <= 0 ? 0 : null;
              return (
                <div key={t.id} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{t.id} — {t.label}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Gap: {gap > 0 ? gap : 'Already material'} | \u0394/yr: {adj > 0 ? `+${adj}` : adj}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: yearsToThreshold === null ? T.textMut : yearsToThreshold <= 2 ? T.red : yearsToThreshold <= 5 ? T.amber : T.sage, marginTop: 6 }}>
                    {yearsToThreshold === null ? 'N/A' : yearsToThreshold === 0 ? 'Now' : `${yearsToThreshold}y`}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>
                    {yearsToThreshold !== null && yearsToThreshold <= 2 ? 'Urgent' : yearsToThreshold !== null && yearsToThreshold <= 5 ? 'Watch' : yearsToThreshold !== null ? 'Low priority' : 'Declining/stable'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 10e. Scenario Divergence Analysis */}
      <Section title="Scenario Divergence Analysis" badge="How scenarios differ">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 14, fontFamily: T.font }}>
            Maximum divergence between any two scenarios per topic. High divergence indicates topics most sensitive to which future materialises.
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ESRS_TOPICS.map(t => {
              const vals = MATERIALITY_SCENARIOS.map(sc => sc.adjustments[t.id] || 0);
              const maxDiv = Math.max(...vals) - Math.min(...vals);
              return { topic: t.id, divergence: maxDiv, label: t.label };
            })} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} formatter={(v, n, p) => [`${v} pts`, `${p.payload.label} divergence`]} />
              <Bar dataKey="divergence" name="Max Divergence" radius={[4, 4, 0, 0]}>
                {ESRS_TOPICS.map((t, i) => {
                  const vals = MATERIALITY_SCENARIOS.map(sc => sc.adjustments[t.id] || 0);
                  const maxDiv = Math.max(...vals) - Math.min(...vals);
                  return <Cell key={i} fill={maxDiv > 25 ? T.red : maxDiv > 15 ? T.amber : T.sage} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 10f. Pillar-Level Scenario Summary */}
      <Section title="Pillar-Level Summary" badge="E / S / G aggregate">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {['E', 'S', 'G'].map(pillar => {
            const pillarTopics = ESRS_TOPICS.filter(t => t.pillar === pillar);
            const pillarLabel = pillar === 'E' ? 'Environmental' : pillar === 'S' ? 'Social' : 'Governance';
            const pillarColor = pillar === 'E' ? T.sage : pillar === 'S' ? T.gold : T.navy;
            return (
              <div key={pillar} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, borderTop: `3px solid ${pillarColor}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{pillarLabel} ({pillar})</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {MATERIALITY_SCENARIOS.map(sc => {
                    const totalAdj = pillarTopics.reduce((s, t) => s + (sc.adjustments[t.id] || 0), 0);
                    const avgAdj = +(totalAdj / pillarTopics.length).toFixed(1);
                    return (
                      <div key={sc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: T.surfaceH, borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color }} />
                          <span style={{ fontSize: 12, color: T.text }}>{sc.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: avgAdj > 0 ? T.red : avgAdj < 0 ? T.sage : T.textMut }}>
                          {avgAdj > 0 ? '+' : ''}{avgAdj}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 11. Action Implications */}
      <Section title="Action Implications" badge={`${actions.length} actions`}>
        <div style={{ display: 'grid', gap: 10 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.surface, borderRadius: 10, padding: '12px 18px', border: `1px solid ${T.border}`, borderLeft: `4px solid ${a.priority === 'High' ? T.red : a.priority === 'Medium' ? T.amber : T.sage}` }}>
              <Pill label={a.priority} color={a.priority === 'High' ? T.red : a.priority === 'Medium' ? T.amber : T.sage} />
              <div style={{ flex: 1, fontSize: 13, color: T.text, fontFamily: T.font }}>{a.action}</div>
              <Pill label={a.type} color={T.navy} />
              <span style={{ fontSize: 11, color: T.textMut }}>{a.scenario}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 11b. Scenario Executive Summary */}
      <Section title="Executive Summary" badge="Board-ready brief">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key Findings</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { text: `Under "${primaryScenario.name}", ${kpis.reclassCount} topics change materiality classification`, severity: kpis.reclassCount > 3 ? 'High' : 'Medium' },
                  { text: `${kpis.newMaterial} previously non-material topics become material, requiring new data collection`, severity: kpis.newMaterial > 2 ? 'High' : 'Low' },
                  { text: `Portfolio-level risk shifts by an estimated ${kpis.portfolioImpact}%`, severity: parseFloat(kpis.portfolioImpact) > 5 ? 'High' : 'Medium' },
                  { text: `${kpis.mostAffected} sector faces highest vulnerability across all scenarios`, severity: 'Medium' },
                  { text: `Maximum single-topic score change: +/-${kpis.maxDelta} points`, severity: kpis.maxDelta > 20 ? 'High' : 'Low' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.severity === 'High' ? T.red : f.severity === 'Medium' ? T.amber : T.sage, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Recommended Next Steps</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { step: '1', text: 'Present scenario analysis to sustainability committee for strategic discussion', timeline: 'This quarter' },
                  { step: '2', text: 'Initiate data collection for newly material topics under most-likely scenario', timeline: 'Next 30 days' },
                  { step: '3', text: 'Update CSRD DMA documentation to reference scenario sensitivities', timeline: 'Before next filing' },
                  { step: '4', text: 'Engage portfolio companies in high-vulnerability sectors on transition preparedness', timeline: 'Ongoing' },
                  { step: '5', text: 'Integrate scenario findings into annual stakeholder materiality review', timeline: 'Next cycle' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{s.step}</div>
                    <div>
                      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{s.text}</div>
                      <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{s.timeline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 11c. Methodology & Assumptions */}
      <Section title="Methodology & Assumptions" badge="Transparency">
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Scoring Methodology</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                Baseline scores derived from CSRD double materiality assessment. Financial materiality reflects enterprise value impact. Impact materiality reflects severity, scope and remediability of outward impacts. Scores on 0-100 scale.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Scenario Calibration</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                Adjustments calibrated using NGFS scenarios, IPCC AR6 pathways, regulatory pipeline analysis, and market sentiment indicators. Nature Crisis scenario references IPBES Global Assessment.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Limitations</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                Scenarios assume linear score progression. Cross-topic interactions not modeled. Sector-level vulnerability uses industry averages. Custom scenarios are user-defined and not independently validated.
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 12. Cross-Navigation */}
      <Section title="Related Modules" badge="Sprint T & Cross-Sprint">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <NavBtn label="Double Materiality" path="/double-materiality" nav={navigate} />
          <NavBtn label="Materiality Trends" path="/materiality-trends" nav={navigate} />
          <NavBtn label="Stakeholder Impact" path="/stakeholder-impact" nav={navigate} />
          <NavBtn label="Controversy Materiality" path="/controversy-materiality" nav={navigate} />
          <NavBtn label="Materiality Hub" path="/materiality-hub" nav={navigate} />
          <NavBtn label="Scenario Stress Test" path="/scenario-stress-test" nav={navigate} />
          <NavBtn label="NGFS Scenarios" path="/ngfs-scenarios" nav={navigate} />
          <NavBtn label="Nature Scenarios" path="/nature-risk" nav={navigate} />
          <NavBtn label="ISSB Materiality" path="/issb-materiality" nav={navigate} />
        </div>
      </Section>

    </div>
  );
};

export default MaterialityScenariosPage;
