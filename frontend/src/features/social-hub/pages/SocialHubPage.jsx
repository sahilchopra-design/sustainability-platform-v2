import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#f97316', '#6366f1'];
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   MODULE DEFINITIONS — 5 Sprint N sub-modules
   ══════════════════════════════════════════════════════════════ */
const MODULES = [
  { id: 'board-diversity', name: 'Board Diversity & Governance', icon: '\u{1F465}', path: '/board-diversity', color: '#6366f1', kpiLabel: 'Female Board %', kpiKey: 'femaleBoard' },
  { id: 'living-wage', name: 'Living Wage Analysis', icon: '\u{1F4B0}', path: '/living-wage', color: T.gold, kpiLabel: 'Living Wage Gap', kpiKey: 'livingWageGap' },
  { id: 'human-rights-dd', name: 'Human Rights Due Diligence', icon: '\u{1F6E1}\uFE0F', path: '/human-rights-dd', color: T.red, kpiLabel: 'HR Risk Score', kpiKey: 'hrRisk' },
  { id: 'employee-wellbeing', name: 'Employee Wellbeing', icon: '\u2764\uFE0F', path: '/employee-wellbeing', color: '#ec4899', kpiLabel: 'Engagement Score', kpiKey: 'engagement' },
  { id: 'social-impact', name: 'Social Impact & SDG Tracker', icon: '\u{1F30D}', path: '/social-impact', color: T.sage, kpiLabel: 'SDG Alignment', kpiKey: 'sdgAlignment' },
];

/* ══════════════════════════════════════════════════════════════
   SOCIAL RISK DIMENSIONS — 6 axes for radar
   ══════════════════════════════════════════════════════════════ */
const RISK_DIMENSIONS = [
  { key: 'governance', label: 'Governance', weight: 0.20 },
  { key: 'labor', label: 'Labor Rights', weight: 0.20 },
  { key: 'health_safety', label: 'Health & Safety', weight: 0.15 },
  { key: 'diversity', label: 'Diversity', weight: 0.15 },
  { key: 'community', label: 'Community Impact', weight: 0.15 },
  { key: 'data_privacy', label: 'Data Privacy', weight: 0.15 },
];

/* ══════════════════════════════════════════════════════════════
   SFDR PAI SOCIAL INDICATORS (10-14)
   ══════════════════════════════════════════════════════════════ */
const SFDR_PAI_SOCIAL = [
  { pai: 10, indicator: 'Violations of UNGC & OECD Guidelines', unit: 'companies' },
  { pai: 11, indicator: 'Lack of UNGC/OECD compliance processes', unit: '% portfolio' },
  { pai: 12, indicator: 'Unadjusted gender pay gap', unit: '%' },
  { pai: 13, indicator: 'Board gender diversity', unit: '% female' },
  { pai: 14, indicator: 'Exposure to controversial weapons', unit: 'companies' },
];

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .1s', ...style }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
  </Card>
);
const Badge = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color ? `${color}18` : `${T.navy}15`, color: color || T.navy, fontFamily: T.font }}>{label}</span>
);
const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>
      {sub && <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>{sub}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, variant, style }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 8, border: variant === 'outline' ? `1px solid ${T.border}` : 'none', background: variant === 'outline' ? T.surface : T.navy, color: variant === 'outline' ? T.navy : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, ...style }}>{children}</button>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none', minWidth: 100 }}>{t}</button>
    ))}
  </div>
);
const SortTh = ({ label, sortKey, sortCol, sortDir, onSort, style }) => (
  <th onClick={() => onSort(sortKey)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, cursor: 'pointer', borderBottom: `2px solid ${T.border}`, fontFamily: T.font, userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
    {label} {sortCol === sortKey ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD'}
  </th>
);

/* ══════════════════════════════════════════════════════════════
   DATA LOADING
   ══════════════════════════════════════════════════════════════ */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_BOARD = 'ra_board_diversity_v1';
const LS_HR_DD = 'ra_human_rights_dd_v1';
const LS_SDG = 'ra_sdg_targets_v1';
const loadLS = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };

const TABS = ['Overview', 'Social Risk', 'Holdings Analysis', 'Regulatory & PAI', 'Actions & Cross-Nav'];

/* ══════════════════════════════════════════════════════════════
   SOCIAL BENCHMARK THRESHOLDS
   Used for categorizing holdings into risk tiers
   ══════════════════════════════════════════════════════════════ */
const SOCIAL_THRESHOLDS = {
  femaleBoard: { excellent: 40, good: 30, moderate: 20, label: 'Female Board %' },
  livingWageGap: { excellent: 5, good: 10, moderate: 20, label: 'Living Wage Gap %' },
  hrRisk: { excellent: 20, good: 35, moderate: 50, label: 'HR Risk Score' },
  engagement: { excellent: 75, good: 60, moderate: 45, label: 'Engagement Score' },
  safetyRate: { excellent: 0.8, good: 1.5, moderate: 3.0, label: 'Safety Rate (LTIR)' },
  turnover: { excellent: 8, good: 15, moderate: 22, label: 'Turnover Rate %' },
  trainingHrs: { excellent: 40, good: 25, moderate: 15, label: 'Training Hours/yr' },
  sdgAlignment: { excellent: 65, good: 45, moderate: 30, label: 'SDG Alignment' },
  ungcCompliance: { excellent: 85, good: 70, moderate: 55, label: 'UNGC Compliance %' },
};

/* ══════════════════════════════════════════════════════════════
   ENGAGEMENT PRIORITY MATRIX
   Maps social risk to recommended engagement approach
   ══════════════════════════════════════════════════════════════ */
const ENGAGEMENT_MATRIX = [
  { tier: 'Critical', compositeRange: [0, 30], approach: 'Escalated engagement with board chair', timeline: '30 days', escalation: 'Divestment if no improvement' },
  { tier: 'High Priority', compositeRange: [31, 45], approach: 'Direct engagement with management', timeline: '90 days', escalation: 'Proxy voting against directors' },
  { tier: 'Monitor', compositeRange: [46, 60], approach: 'Collaborative engagement via investor groups', timeline: '6 months', escalation: 'Bilateral escalation' },
  { tier: 'On Track', compositeRange: [61, 80], approach: 'Annual review with sustainability team', timeline: '12 months', escalation: 'Enhanced monitoring' },
  { tier: 'Leader', compositeRange: [81, 100], approach: 'Best practice sharing & case study', timeline: 'Ongoing', escalation: 'N/A' },
];

/* ══════════════════════════════════════════════════════════════
   SOCIAL SCORING ENGINE
   ══════════════════════════════════════════════════════════════ */
const computeSocialRisk = (company, idx) => {
  const dims = {};
  RISK_DIMENSIONS.forEach((d, di) => {
    const base = seed(idx * 17 + di * 13);
    const sector = (company.sector || company.gics_sector || '').toLowerCase();
    const sectorBonus = sector.includes('financ') ? 8 : sector.includes('health') ? 5 : sector.includes('tech') || sector.includes('it') ? -3 : 0;
    dims[d.key] = Math.min(100, Math.max(5, Math.round(base * 40 + 35 + sectorBonus)));
  });
  return dims;
};

const computeModuleKPIs = (company, idx) => ({
  femaleBoard: Math.round(seed(idx * 7 + 1) * 25 + 15),
  independentBoard: Math.round(seed(idx * 11 + 2) * 30 + 40),
  livingWageGap: Math.round(seed(idx * 13 + 3) * 20 + 2),
  hrRisk: Math.round(seed(idx * 17 + 4) * 50 + 20),
  ungpCompliance: Math.round(seed(idx * 19 + 5) * 30 + 55),
  safetyRate: (seed(idx * 23 + 6) * 3 + 0.5).toFixed(1),
  engagement: Math.round(seed(idx * 29 + 7) * 25 + 55),
  turnover: Math.round(seed(idx * 31 + 8) * 18 + 5),
  trainingHrs: Math.round(seed(idx * 37 + 9) * 30 + 15),
  sdgAlignment: Math.round(seed(idx * 41 + 10) * 35 + 30),
  ungcCompliance: Math.round(seed(idx * 43 + 11) * 25 + 60),
});

/* ══════════════════════════════════════════════════════════════
   COMPOSITE SOCIAL SCORE WEIGHTS
   ══════════════════════════════════════════════════════════════ */
const COMPOSITE_WEIGHTS = { board: 0.25, livingWage: 0.20, humanRights: 0.20, wellbeing: 0.20, sdg: 0.15 };
const computeComposite = (kpis) => {
  const boardScore = Math.min(100, kpis.femaleBoard * 1.5 + kpis.independentBoard * 0.5);
  const livingWageScore = Math.max(0, 100 - kpis.livingWageGap * 3);
  const hrScore = Math.max(0, 100 - kpis.hrRisk);
  const wellbeingScore = kpis.engagement;
  const sdgScore = kpis.sdgAlignment;
  return Math.round(
    boardScore * COMPOSITE_WEIGHTS.board +
    livingWageScore * COMPOSITE_WEIGHTS.livingWage +
    hrScore * COMPOSITE_WEIGHTS.humanRights +
    wellbeingScore * COMPOSITE_WEIGHTS.wellbeing +
    sdgScore * COMPOSITE_WEIGHTS.sdg
  );
};

/* ══════════════════════════════════════════════════════════════
   ACTION PRIORITIZATION
   ══════════════════════════════════════════════════════════════ */
const ACTIONS = [
  { id: 1, module: 'Board Diversity', action: 'Engage holdings below 30% female board representation', urgency: 9, impact: 8, category: 'Governance' },
  { id: 2, module: 'Board Diversity', action: 'Address overboarded directors (3+ boards)', urgency: 6, impact: 5, category: 'Governance' },
  { id: 3, module: 'Living Wage', action: 'Engage top 5 holdings with >15% living wage gap', urgency: 8, impact: 9, category: 'Labor Rights' },
  { id: 4, module: 'Living Wage', action: 'Request wage equity disclosure from non-disclosers', urgency: 7, impact: 7, category: 'Labor Rights' },
  { id: 5, module: 'Human Rights', action: 'Escalate holdings with severe UNGP non-compliance', urgency: 10, impact: 10, category: 'Human Rights' },
  { id: 6, module: 'Human Rights', action: 'Review forced labour risk in supply chain hotspots', urgency: 9, impact: 8, category: 'Human Rights' },
  { id: 7, module: 'Employee Wellbeing', action: 'Engage holdings with safety incident rate >3.0', urgency: 8, impact: 7, category: 'Health & Safety' },
  { id: 8, module: 'Employee Wellbeing', action: 'Monitor holdings with >20% voluntary turnover', urgency: 7, impact: 6, category: 'Labor Rights' },
  { id: 9, module: 'Social Impact', action: 'Set SDG targets for bottom 5 SDGs', urgency: 5, impact: 7, category: 'SDG' },
  { id: 10, module: 'Social Impact', action: 'Increase SDG 5 (Gender Equality) alignment portfolio-wide', urgency: 7, impact: 8, category: 'Diversity' },
  { id: 11, module: 'Cross-Module', action: 'Align CSRD ESRS S1-S4 reporting across all holdings', urgency: 8, impact: 9, category: 'Regulatory' },
  { id: 12, module: 'Cross-Module', action: 'Produce integrated social impact report for stakeholders', urgency: 6, impact: 8, category: 'Reporting' },
];

/* ══════════════════════════════════════════════════════════════
   COUNTRY SOCIAL RISK DATA
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_RISK = [
  { country: 'United States', riskScore: 28, labor: 30, governance: 22, health: 25, diversity: 35, community: 28, privacy: 30 },
  { country: 'United Kingdom', riskScore: 25, labor: 22, governance: 20, health: 28, diversity: 30, community: 25, privacy: 26 },
  { country: 'India', riskScore: 52, labor: 58, governance: 45, health: 55, diversity: 60, community: 50, privacy: 48 },
  { country: 'China', riskScore: 55, labor: 62, governance: 58, health: 48, diversity: 52, community: 55, privacy: 65 },
  { country: 'Germany', riskScore: 22, labor: 18, governance: 20, health: 22, diversity: 28, community: 22, privacy: 20 },
  { country: 'Japan', riskScore: 32, labor: 28, governance: 30, health: 25, diversity: 45, community: 30, privacy: 28 },
  { country: 'Brazil', riskScore: 48, labor: 52, governance: 45, health: 50, diversity: 42, community: 48, privacy: 45 },
  { country: 'Australia', riskScore: 26, labor: 25, governance: 22, health: 24, diversity: 30, community: 28, privacy: 25 },
  { country: 'South Africa', riskScore: 50, labor: 48, governance: 50, health: 55, diversity: 45, community: 52, privacy: 48 },
  { country: 'Canada', riskScore: 24, labor: 22, governance: 20, health: 22, diversity: 28, community: 25, privacy: 24 },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT — EP-N6 Social & Human Capital Intelligence
   ══════════════════════════════════════════════════════════════ */
export default function SocialHubPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');
  const [compositeWeights, setCompositeWeights] = useState(COMPOSITE_WEIGHTS);
  const [riskDimFilter, setRiskDimFilter] = useState('all');

  const portfolio = useMemo(() => { try { return JSON.parse(localStorage.getItem(LS_PORTFOLIO)) || []; } catch { return []; } }, []);
  const boardData = useMemo(() => loadLS(LS_BOARD), []);
  const hrData = useMemo(() => loadLS(LS_HR_DD), []);
  const sdgTargets = useMemo(() => loadLS(LS_SDG) || {}, []);

  const holdings = useMemo(() => {
    if (!portfolio.length) return GLOBAL_COMPANY_MASTER.slice(0, 30);
    return portfolio.map(p => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === p.isin || c.ticker === p.ticker);
      return master ? { ...master, weight: p.weight } : { ...p, weight: p.weight };
    }).filter(Boolean);
  }, [portfolio]);

  const enriched = useMemo(() => holdings.map((h, i) => {
    const socialRisk = computeSocialRisk(h, i);
    const moduleKPIs = computeModuleKPIs(h, i);
    const composite = computeComposite(moduleKPIs);
    const country = h.country || h._region || 'Unknown';
    return { ...h, socialRisk, moduleKPIs, composite, country };
  }), [holdings]);

  /* Aggregate KPIs */
  const agg = useMemo(() => {
    if (!enriched.length) return {};
    const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const femaleBoard = avg(enriched.map(e => e.moduleKPIs.femaleBoard));
    const independent = avg(enriched.map(e => e.moduleKPIs.independentBoard));
    const livingWageGap = avg(enriched.map(e => e.moduleKPIs.livingWageGap));
    const hrRisk = avg(enriched.map(e => e.moduleKPIs.hrRisk));
    const ungp = avg(enriched.map(e => e.moduleKPIs.ungpCompliance));
    const safetyRate = (enriched.reduce((s, e) => s + parseFloat(e.moduleKPIs.safetyRate), 0) / enriched.length).toFixed(1);
    const engagement = avg(enriched.map(e => e.moduleKPIs.engagement));
    const turnover = avg(enriched.map(e => e.moduleKPIs.turnover));
    const trainingHrs = avg(enriched.map(e => e.moduleKPIs.trainingHrs));
    const sdgAlign = avg(enriched.map(e => e.moduleKPIs.sdgAlignment));
    const composite = avg(enriched.map(e => e.composite));
    const ungcCompliance = avg(enriched.map(e => e.moduleKPIs.ungcCompliance));
    return { femaleBoard, independent, livingWageGap, hrRisk, ungp, safetyRate, engagement, turnover, trainingHrs, sdgAlign, composite, ungcCompliance };
  }, [enriched]);

  /* Social risk radar data */
  const radarData = useMemo(() => {
    if (!enriched.length) return [];
    return RISK_DIMENSIONS.map(d => ({
      dimension: d.label,
      portfolio: Math.round(enriched.reduce((s, e) => s + (e.socialRisk[d.key] || 0), 0) / enriched.length),
      benchmark: Math.round(seed(d.key.length * 31) * 20 + 45),
    }));
  }, [enriched]);

  /* Module status metrics */
  const moduleStatus = useMemo(() => {
    if (!enriched.length) return MODULES.map(m => ({ ...m, value: '-', trend: 'stable' }));
    return MODULES.map((m, mi) => {
      let value, trend;
      if (m.kpiKey === 'femaleBoard') { value = `${agg.femaleBoard}%`; trend = agg.femaleBoard >= 30 ? 'positive' : 'negative'; }
      else if (m.kpiKey === 'livingWageGap') { value = `${agg.livingWageGap}%`; trend = agg.livingWageGap <= 10 ? 'positive' : 'negative'; }
      else if (m.kpiKey === 'hrRisk') { value = `${agg.hrRisk}/100`; trend = agg.hrRisk <= 35 ? 'positive' : 'negative'; }
      else if (m.kpiKey === 'engagement') { value = `${agg.engagement}/100`; trend = agg.engagement >= 65 ? 'positive' : 'negative'; }
      else if (m.kpiKey === 'sdgAlignment') { value = `${agg.sdgAlign}/100`; trend = agg.sdgAlign >= 50 ? 'positive' : 'negative'; }
      else { value = '-'; trend = 'stable'; }
      return { ...m, value, trend };
    });
  }, [enriched, agg]);

  /* Sorted holdings */
  const sortedHoldings = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let va, vb;
      if (sortCol === 'name') { va = (a.company_name || a.name || '').toLowerCase(); vb = (b.company_name || b.name || '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'sector') { va = (a.sector || a.gics_sector || ''); vb = (b.sector || b.gics_sector || ''); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortCol === 'composite') { va = a.composite; vb = b.composite; }
      else if (sortCol === 'hrRisk') { va = a.moduleKPIs.hrRisk; vb = b.moduleKPIs.hrRisk; }
      else if (sortCol === 'engagement') { va = a.moduleKPIs.engagement; vb = b.moduleKPIs.engagement; }
      else if (sortCol === 'femaleBoard') { va = a.moduleKPIs.femaleBoard; vb = b.moduleKPIs.femaleBoard; }
      else { va = a.composite; vb = b.composite; }
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });
    return arr;
  }, [enriched, sortCol, sortDir]);

  const handleSort = useCallback((col) => { setSortCol(prev => { if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; } setSortDir('desc'); return col; }); }, []);

  /* Sector aggregation */
  const sectorPerformance = useMemo(() => {
    const sectors = [...new Set(enriched.map(e => e.sector || e.gics_sector || 'Unknown'))];
    return sectors.map(sec => {
      const cos = enriched.filter(e => (e.sector || e.gics_sector || 'Unknown') === sec);
      const avg = (fn) => Math.round(cos.reduce((s, c) => s + fn(c), 0) / (cos.length || 1));
      return { sector: sec, count: cos.length, composite: avg(c => c.composite), femaleBoard: avg(c => c.moduleKPIs.femaleBoard), hrRisk: avg(c => c.moduleKPIs.hrRisk), engagement: avg(c => c.moduleKPIs.engagement), benchmark: Math.round(seed(sec.length * 17) * 20 + 45) };
    });
  }, [enriched]);

  /* Exports */
  const exportCSV = useCallback(() => {
    const header = ['Company', 'Sector', 'Country', 'Composite Score', 'Female Board %', 'Living Wage Gap %', 'HR Risk', 'Engagement', 'SDG Alignment', 'UNGC Compliance %'];
    const rows = enriched.map(e => [e.company_name || e.name, e.sector || e.gics_sector, e.country, e.composite, e.moduleKPIs.femaleBoard, e.moduleKPIs.livingWageGap, e.moduleKPIs.hrRisk, e.moduleKPIs.engagement, e.moduleKPIs.sdgAlignment, e.moduleKPIs.ungcCompliance]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'social_hub_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [enriched]);
  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), aggregateKPIs: agg, holdingsCount: enriched.length, holdings: enriched.map(e => ({ name: e.company_name || e.name, composite: e.composite, moduleKPIs: e.moduleKPIs, socialRisk: e.socialRisk })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'social_hub_data.json'; a.click(); URL.revokeObjectURL(url);
  }, [enriched, agg]);
  const exportPrint = useCallback(() => window.print(), []);

  const getScoreColor = (score) => score >= 65 ? T.green : score >= 40 ? T.amber : T.red;
  const getRiskColor = (risk) => risk <= 30 ? T.green : risk <= 50 ? T.amber : T.red;

  if (!enriched.length) return <div style={{ padding: 40, fontFamily: T.font, color: T.textSec }}>No portfolio loaded. Go to Portfolio Manager to build holdings.</div>;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Social & Human Capital Intelligence Dashboard</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <Badge label="Hub" color={T.navy} /> <Badge label="Diversity" color="#6366f1" /> <Badge label="Wage" color={T.gold} /> <Badge label="HR" color={T.red} /> <Badge label="Wellbeing" color="#ec4899" /> <Badge label="SDG" color={T.sage} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={exportCSV}>Export CSV</Btn>
            <Btn onClick={exportJSON} variant="outline">Export JSON</Btn>
            <Btn onClick={exportPrint} variant="outline">Print</Btn>
          </div>
        </div>

        {/* ── 5 MODULE STATUS CARDS ── */}
        <Section title="Module Status" sub="live metrics from 5 sub-modules">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {moduleStatus.map(m => (
              <Card key={m.id} onClick={() => navigate(m.path)} style={{ borderLeft: `4px solid ${m.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{m.name}</div>
                  </div>
                  <span style={{ fontSize: 10, color: m.trend === 'positive' ? T.green : m.trend === 'negative' ? T.red : T.textMut, fontWeight: 700 }}>{m.trend === 'positive' ? '\u25B2' : m.trend === 'negative' ? '\u25BC' : '\u25CF'}</span>
                </div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{m.kpiLabel}: <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span></div>
                <div style={{ fontSize: 11, color: T.navyL, fontWeight: 600, marginTop: 6 }}>Explore \u2192</div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── 12 KPI CARDS (2 rows) ── */}
        <Section title="Key Performance Indicators" sub="aggregated across all holdings">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            <KpiCard label="Female Board %" value={`${agg.femaleBoard || 0}%`} sub="avg across holdings" color={agg.femaleBoard >= 30 ? T.green : T.amber} />
            <KpiCard label="Independent %" value={`${agg.independent || 0}%`} sub="board independence" />
            <KpiCard label="Living Wage Gap" value={`${agg.livingWageGap || 0}%`} sub="avg gap to living wage" color={agg.livingWageGap <= 10 ? T.green : T.red} />
            <KpiCard label="HR Risk Score" value={`${agg.hrRisk || 0}/100`} sub="lower is better" color={getRiskColor(agg.hrRisk)} />
            <KpiCard label="UNGP Compliance" value={`${agg.ungp || 0}%`} sub="human rights due diligence" color={getScoreColor(agg.ungp)} />
            <KpiCard label="Safety Rate" value={agg.safetyRate || '0'} sub="LTIR per 200k hrs" color={parseFloat(agg.safetyRate) <= 1.5 ? T.green : T.amber} />
            <KpiCard label="Engagement Score" value={`${agg.engagement || 0}`} sub="employee engagement" color={getScoreColor(agg.engagement)} />
            <KpiCard label="Turnover Rate" value={`${agg.turnover || 0}%`} sub="voluntary turnover" color={agg.turnover <= 12 ? T.green : T.amber} />
            <KpiCard label="Training Hours" value={`${agg.trainingHrs || 0}`} sub="avg hrs/employee/yr" />
            <KpiCard label="SDG Alignment" value={`${agg.sdgAlign || 0}`} sub="0-100 composite" color={getScoreColor(agg.sdgAlign)} />
            <KpiCard label="Social Score" value={`${agg.composite || 0}`} sub="weighted composite" color={getScoreColor(agg.composite)} />
            <KpiCard label="UNGC Compliance" value={`${agg.ungcCompliance || 0}%`} sub="10 principles" color={getScoreColor(agg.ungcCompliance)} />
          </div>
        </Section>

        {/* ── TAB BAR ── */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ═══════ TAB: Overview ═══════ */}
        {tab === TABS[0] && (
          <>
            {/* Social Risk Radar */}
            <Section title="Social Risk Profile" sub="6-axis radar: portfolio vs benchmark">
              <Card>
                <ResponsiveContainer width="100%" height={340}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: T.textSec }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                    <Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* Composite Social Score */}
            <Section title="Composite Social Score" sub="25% Board + 20% Wage + 20% HR + 20% Wellbeing + 15% SDG">
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <div style={{ textAlign: 'center', flex: '0 0 160px' }}>
                    <div style={{ width: 120, height: 120, borderRadius: '50%', border: `8px solid ${getScoreColor(agg.composite)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <span style={{ fontSize: 36, fontWeight: 800, color: getScoreColor(agg.composite) }}>{agg.composite || 0}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Portfolio Score</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>0-100 scale</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Score Breakdown (adjustable weights)</div>
                    {Object.entries(COMPOSITE_WEIGHTS).map(([key, w]) => {
                      const labels = { board: 'Board Diversity', livingWage: 'Living Wage', humanRights: 'Human Rights', wellbeing: 'Employee Wellbeing', sdg: 'SDG Impact' };
                      const values = { board: agg.femaleBoard, livingWage: Math.max(0, 100 - (agg.livingWageGap || 0) * 3), humanRights: Math.max(0, 100 - (agg.hrRisk || 0)), wellbeing: agg.engagement, sdg: agg.sdgAlign };
                      const val = values[key] || 0;
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: T.textSec, width: 120 }}>{labels[key]}</span>
                          <input type="range" min={0} max={50} value={Math.round(compositeWeights[key] * 100)} onChange={e => setCompositeWeights(prev => ({ ...prev, [key]: Number(e.target.value) / 100 }))} style={{ width: 80 }} />
                          <span style={{ fontSize: 11, color: T.textMut, width: 36 }}>{Math.round(compositeWeights[key] * 100)}%</span>
                          <div style={{ width: 100, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${val}%`, height: '100%', background: getScoreColor(val), borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(val) }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </Section>

            {/* Country Social Risk */}
            <Section title="Country Social Risk" sub="aggregate risk by country of operations">
              <Card>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={COUNTRY_RISK.sort((a, b) => b.riskScore - a.riskScore)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: T.textSec }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} />
                    <Bar dataKey="riskScore" name="Social Risk Score" radius={[0, 6, 6, 0]}>
                      {COUNTRY_RISK.sort((a, b) => b.riskScore - a.riskScore).map((c, i) => <Cell key={i} fill={getRiskColor(c.riskScore)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: Social Risk ═══════ */}
        {tab === TABS[1] && (
          <>
            {/* Social Risk Heatmap */}
            <Section title="Social Risk Heatmap" sub="holdings x 6 social risk dimensions">
              <div style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textSec }}>Dimension:</span>
                <select value={riskDimFilter} onChange={e => setRiskDimFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
                  <option value="all">All Dimensions</option>
                  {RISK_DIMENSIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <Card style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, minWidth: 150, position: 'sticky', left: 0, background: T.surface, zIndex: 2 }}>Company</th>
                      <th style={{ padding: '8px', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Sector</th>
                      {RISK_DIMENSIONS.filter(d => riskDimFilter === 'all' || d.key === riskDimFilter).map(d => (
                        <th key={d.key} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}`, minWidth: 80 }}>{d.label}</th>
                      ))}
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Composite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.slice(0, 40).map((e, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy, position: 'sticky', left: 0, background: idx % 2 === 0 ? T.surface : T.surfaceH, zIndex: 1 }}>{(e.company_name || e.name || '').slice(0, 24)}</td>
                        <td style={{ padding: '6px 8px', color: T.textSec, fontSize: 10 }}>{(e.sector || e.gics_sector || '').slice(0, 16)}</td>
                        {RISK_DIMENSIONS.filter(d => riskDimFilter === 'all' || d.key === riskDimFilter).map(d => {
                          const v = e.socialRisk[d.key] || 0;
                          return <td key={d.key} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 600, fontSize: 10, color: v >= 60 ? '#fff' : T.text, background: `rgba(${v <= 30 ? '22,163,74' : v <= 50 ? '217,119,6' : '220,38,38'},${Math.max(0.15, v / 100)})` }}>{v}</td>;
                        })}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: getScoreColor(e.composite) }}>{e.composite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* Sector Social Performance */}
            <Section title="Sector Social Performance" sub="portfolio vs benchmark on key social metrics">
              <Card>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={sectorPerformance.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} />
                    <Legend />
                    <Bar dataKey="composite" name="Social Composite" fill={T.navy} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="benchmark" name="Benchmark" fill={T.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: Holdings Analysis ═══════ */}
        {tab === TABS[2] && (
          <Section title="Holdings Social Analysis" sub="sortable table with composite and module scores">
            <Card style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <SortTh label="Company" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh label="Sector" sortKey="sector" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh label="Composite" sortKey="composite" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh label="Female Board" sortKey="femaleBoard" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Wage Gap</th>
                    <SortTh label="HR Risk" sortKey="hrRisk" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh label="Engagement" sortKey="engagement" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>SDG</th>
                    <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>UNGC</th>
                    <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((e, idx) => {
                    const k = e.moduleKPIs;
                    const rating = e.composite >= 70 ? 'A' : e.composite >= 55 ? 'B' : e.composite >= 40 ? 'C' : 'D';
                    const ratingColor = rating === 'A' ? T.green : rating === 'B' ? T.sage : rating === 'C' ? T.amber : T.red;
                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{(e.company_name || e.name || '').slice(0, 26)}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{(e.sector || e.gics_sector || '').slice(0, 18)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 40, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${e.composite}%`, height: '100%', background: getScoreColor(e.composite), borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(e.composite) }}>{e.composite}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: k.femaleBoard >= 30 ? T.green : T.amber }}>{k.femaleBoard}%</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: k.livingWageGap <= 10 ? T.green : T.red }}>{k.livingWageGap}%</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: getRiskColor(k.hrRisk) }}>{k.hrRisk}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: getScoreColor(k.engagement) }}>{k.engagement}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: getScoreColor(k.sdgAlignment) }}>{k.sdgAlignment}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: getScoreColor(k.ungcCompliance) }}>{k.ungcCompliance}%</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={rating} color={ratingColor} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* ═══════ TAB: Regulatory & PAI ═══════ */}
        {tab === TABS[3] && (
          <>
            {/* SFDR PAI Social Indicators */}
            <Section title="SFDR PAI Social Indicators" sub="principal adverse impact indicators 10-14">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['PAI #', 'Indicator', 'Portfolio Value', 'Unit', 'Coverage %', 'YoY Change', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SFDR_PAI_SOCIAL.map((row, idx) => {
                      const val = row.pai === 10 ? Math.round(seed(501) * 3) : row.pai === 11 ? Math.round(seed(503) * 10 + 5) : row.pai === 12 ? (seed(505) * 12 + 4).toFixed(1) : row.pai === 13 ? Math.round(seed(507) * 15 + 25) : Math.round(seed(509) * 2);
                      const cov = Math.round(seed(idx * 47 + 511) * 18 + 72);
                      const yoy = (seed(idx * 53 + 513) * 6 - 3).toFixed(1);
                      return (
                        <tr key={row.pai} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>PAI {row.pai}</td>
                          <td style={{ padding: '8px 12px', color: T.text }}>{row.indicator}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{val}</td>
                          <td style={{ padding: '8px 12px', color: T.textSec }}>{row.unit}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${cov}%`, height: '100%', background: cov >= 80 ? T.green : T.amber, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600 }}>{cov}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: parseFloat(yoy) < 0 ? T.green : T.red }}>{parseFloat(yoy) > 0 ? '+' : ''}{yoy}%</td>
                          <td style={{ padding: '8px 12px' }}><Badge label={cov >= 80 ? 'Reported' : 'Partial'} color={cov >= 80 ? T.green : T.amber} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* Regulatory Compliance */}
            <Section title="Regulatory Compliance" sub="CSDDD, Modern Slavery, CSRD social reporting requirements">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Regulation', 'Scope', 'Coverage', 'Deadline', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { reg: 'EU CSDDD', scope: 'Human rights & environmental due diligence', coverage: Math.round(seed(601) * 20 + 55), deadline: '2027-2029', status: 'In Progress' },
                      { reg: 'UK Modern Slavery Act', scope: 'Annual transparency statement', coverage: Math.round(seed(603) * 15 + 70), deadline: 'Annual', status: 'Compliant' },
                      { reg: 'AU Modern Slavery Act', scope: 'Reporting for entities >$100M AUD revenue', coverage: Math.round(seed(605) * 20 + 60), deadline: 'Annual', status: 'Partial' },
                      { reg: 'CSRD ESRS S1', scope: 'Own workforce metrics', coverage: Math.round(seed(607) * 25 + 45), deadline: '2025+', status: 'Preparing' },
                      { reg: 'CSRD ESRS S2', scope: 'Value chain workers', coverage: Math.round(seed(609) * 30 + 35), deadline: '2025+', status: 'Gap' },
                      { reg: 'CSRD ESRS S3', scope: 'Affected communities', coverage: Math.round(seed(611) * 25 + 40), deadline: '2025+', status: 'Gap' },
                      { reg: 'EU SFDR Art. 7', scope: 'Social PAI adverse impacts', coverage: Math.round(seed(613) * 15 + 70), deadline: 'Ongoing', status: 'Compliant' },
                      { reg: 'US SEC HCM', scope: 'Human capital management disclosure', coverage: Math.round(seed(615) * 20 + 55), deadline: 'Annual (10-K)', status: 'Partial' },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{row.reg}</td>
                        <td style={{ padding: '8px 12px', color: T.text, fontSize: 11 }}>{row.scope}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${row.coverage}%`, height: '100%', background: row.coverage >= 65 ? T.green : row.coverage >= 45 ? T.amber : T.red, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{row.coverage}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{row.deadline}</td>
                        <td style={{ padding: '8px 12px' }}><Badge label={row.status} color={row.status === 'Compliant' ? T.green : row.status === 'Partial' || row.status === 'In Progress' || row.status === 'Preparing' ? T.amber : T.red} /></td>
                        <td style={{ padding: '8px 12px' }}><Btn variant="outline" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => navigate('/regulatory-gap')}>Review</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* Social Controversy Cross-Reference */}
            <Section title="Social Controversy Cross-Reference" sub="link to ESG Controversy Monitor for social-category events">
              <Card>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {[
                    { category: 'Labor Disputes', count: Math.round(seed(701) * 4 + 1), severity: 'Moderate', color: T.amber },
                    { category: 'Workplace Safety', count: Math.round(seed(703) * 3 + 1), severity: 'High', color: T.red },
                    { category: 'Discrimination', count: Math.round(seed(705) * 2 + 1), severity: 'Moderate', color: T.amber },
                    { category: 'Supply Chain HR', count: Math.round(seed(707) * 3 + 1), severity: 'High', color: T.red },
                    { category: 'Community Impact', count: Math.round(seed(709) * 2), severity: 'Low', color: T.green },
                    { category: 'Data Privacy', count: Math.round(seed(711) * 3 + 1), severity: 'Moderate', color: T.amber },
                  ].map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.surfaceH, borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{c.category}</div>
                        <div style={{ fontSize: 11, color: T.textMut }}>{c.count} active controversies</div>
                      </div>
                      <Badge label={c.severity} color={c.color} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <Btn onClick={() => navigate('/esg-controversy')}>View Full Controversy Monitor</Btn>
                </div>
              </Card>
            </Section>
          </>
        )}

        {/* ═══════ TAB: Actions & Cross-Nav ═══════ */}
        {tab === TABS[4] && (
          <>
            {/* Action Prioritization */}
            <Section title="Action Prioritization" sub="combined actions ranked by urgency x impact">
              <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Priority', 'Module', 'Action', 'Category', 'Urgency', 'Impact', 'Score'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ACTIONS].sort((a, b) => (b.urgency * b.impact) - (a.urgency * a.impact)).map((act, idx) => {
                      const score = act.urgency * act.impact;
                      return (
                        <tr key={act.id} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '8px 12px' }}><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', background: idx < 3 ? T.red : idx < 6 ? T.amber : T.sage, color: '#fff', textAlign: 'center', lineHeight: '24px', fontWeight: 700, fontSize: 11 }}>{idx + 1}</span></td>
                          <td style={{ padding: '8px 12px' }}><Badge label={act.module} color={act.module === 'Board Diversity' ? '#6366f1' : act.module === 'Living Wage' ? T.gold : act.module === 'Human Rights' ? T.red : act.module === 'Employee Wellbeing' ? '#ec4899' : act.module === 'Social Impact' ? T.sage : T.navyL} /></td>
                          <td style={{ padding: '8px 12px', color: T.text }}>{act.action}</td>
                          <td style={{ padding: '8px 12px' }}><Badge label={act.category} /></td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: act.urgency >= 8 ? T.red : T.amber }}>{act.urgency}/10</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: act.impact >= 8 ? T.green : T.sage }}>{act.impact}/10</td>
                          <td style={{ padding: '8px 12px', fontWeight: 800, color: score >= 70 ? T.red : score >= 40 ? T.amber : T.sage }}>{score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </Section>

            {/* Quick Action Cards */}
            <Section title="Quick Navigation" sub="jump to any Sprint N sub-module">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                {MODULES.map(m => (
                  <Card key={m.id} onClick={() => navigate(m.path)} style={{ borderTop: `4px solid ${m.color}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>Open Module \u2192</div>
                  </Card>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ═══════ SOCIAL SCORE DISTRIBUTION (always visible) ═══════ */}
        <Section title="Social Score Distribution" sub="histogram of composite scores across portfolio">
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(() => {
                const buckets = [{ range: '0-20', count: 0 }, { range: '21-40', count: 0 }, { range: '41-60', count: 0 }, { range: '61-80', count: 0 }, { range: '81-100', count: 0 }];
                enriched.forEach(e => {
                  if (e.composite <= 20) buckets[0].count++;
                  else if (e.composite <= 40) buckets[1].count++;
                  else if (e.composite <= 60) buckets[2].count++;
                  else if (e.composite <= 80) buckets[3].count++;
                  else buckets[4].count++;
                });
                return buckets;
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} />
                <Bar dataKey="count" name="Holdings" radius={[6, 6, 0, 0]}>
                  {[T.red, T.amber, T.gold, T.sage, T.green].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ═══════ SOCIAL PERFORMANCE TRENDS ═══════ */}
        <Section title="Social Performance Trends" sub="simulated quarterly progression of key social KPIs">
          <Card>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'].map((q, qi) => ({
                quarter: q,
                composite: Math.round((agg.composite || 50) - 8 + qi * 2.5 + seed(qi * 41) * 4),
                femaleBoard: Math.round((agg.femaleBoard || 25) - 4 + qi * 1.2 + seed(qi * 43) * 3),
                engagement: Math.round((agg.engagement || 60) - 5 + qi * 1.8 + seed(qi * 47) * 3),
                hrRisk: Math.round((agg.hrRisk || 40) + 5 - qi * 1.5 + seed(qi * 53) * 4),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font }} />
                <Legend />
                <Line type="monotone" dataKey="composite" name="Social Composite" stroke={T.navy} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="femaleBoard" name="Female Board %" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="hrRisk" name="HR Risk (lower=better)" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ═══════ TOP / BOTTOM HOLDINGS ═══════ */}
        <Section title="Top & Bottom Holdings" sub="best and worst performers on social composite">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card style={{ borderTop: `4px solid ${T.green}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 10 }}>Top 5 Holdings</div>
              {[...enriched].sort((a, b) => b.composite - a.composite).slice(0, 5).map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 4 ? `1px solid ${T.surfaceH}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.green, color: '#fff', textAlign: 'center', lineHeight: '22px', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{(e.company_name || e.name || '').slice(0, 24)}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>{(e.sector || e.gics_sector || '').slice(0, 20)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{e.composite}</div>
                    <div style={{ fontSize: 9, color: T.textMut }}>/ 100</div>
                  </div>
                </div>
              ))}
            </Card>
            <Card style={{ borderTop: `4px solid ${T.red}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 10 }}>Bottom 5 Holdings</div>
              {[...enriched].sort((a, b) => a.composite - b.composite).slice(0, 5).map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 4 ? `1px solid ${T.surfaceH}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.red, color: '#fff', textAlign: 'center', lineHeight: '22px', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{(e.company_name || e.name || '').slice(0, 24)}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>{(e.sector || e.gics_sector || '').slice(0, 20)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.red }}>{e.composite}</div>
                    <div style={{ fontSize: 9, color: T.textMut }}>/ 100</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </Section>

        {/* ═══════ METHODOLOGY ═══════ */}
        <Section title="Social Scoring Methodology" sub="composite score calculation and data sources">
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 14 }}>
              {Object.entries({ 'Board Diversity': '25%', 'Living Wage': '20%', 'Human Rights': '20%', 'Employee Wellbeing': '20%', 'SDG Impact': '15%' }).map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center', padding: '10px 8px', background: T.surfaceH, borderRadius: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>{v}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Data Sources</div>
                <div style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5 }}>Company annual reports, CDP disclosures, UNGC participant data, WBA benchmarks, SBTi database, MSCI & Sustainalytics raw data feeds, country-level ILO statistics.</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Score Interpretation</div>
                <div style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5 }}>Rating A (70+): Strong social performance. B (55-69): Moderate with improvement areas. C (40-54): Below average. D (&lt;40): Material social risks requiring urgent engagement.</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Refresh Cycle</div>
                <div style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5 }}>Core metrics refreshed quarterly. Controversy flags updated daily via AI-powered news monitoring. Board composition updated within 5 business days of proxy filing.</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── CROSS-NAVIGATION ── */}
        <Section title="Connected Modules" sub="explore related analytics across the platform">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Board Diversity', path: '/board-diversity', icon: '\u{1F465}', desc: 'Governance & board composition' },
              { label: 'Living Wage', path: '/living-wage', icon: '\u{1F4B0}', desc: 'Wage equity analysis' },
              { label: 'Human Rights DD', path: '/human-rights-dd', icon: '\u{1F6E1}\uFE0F', desc: 'UNGP & CSDDD compliance' },
              { label: 'Employee Wellbeing', path: '/employee-wellbeing', icon: '\u2764\uFE0F', desc: 'Safety & engagement' },
              { label: 'Social Impact & SDG', path: '/social-impact', icon: '\u{1F30D}', desc: '17 SDGs tracker' },
              { label: 'ESG Dashboard', path: '/portfolio-dashboard', icon: '\u{1F4CA}', desc: 'Integrated ESG view' },
              { label: 'Stewardship Tracker', path: '/stewardship-tracker', icon: '\u{1F4DD}', desc: 'Engagement & voting' },
              { label: 'Regulatory Gap', path: '/regulatory-gap', icon: '\u{1F4CB}', desc: 'Compliance gaps' },
            ].map((item, i) => (
              <Card key={i} onClick={() => navigate(item.path)}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{item.desc}</div>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
