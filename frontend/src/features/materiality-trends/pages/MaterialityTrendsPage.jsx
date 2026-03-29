import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORT = 'ra_portfolio_v1';
const LS_PREFS = 'ra_materiality_trends_prefs_v1';
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const sr = (seed, off = 0) => { let x = Math.sin(Math.abs(seed + off) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const fmt1 = v => v.toFixed(1);
const CHART_COLORS = [T.navy, T.gold, T.sage, '#2563eb', '#9333ea', '#ea580c', '#0d9488', T.red, '#6366f1', '#0284c7'];
const STRENGTH_MAP = { very_high: 5, high: 3, medium: 2, low: 1 };
const STRENGTH_LABEL = { very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low' };
const STRENGTH_COLOR = { very_high: T.red, high: '#ea580c', medium: T.amber, low: T.sage };
const TREND_ICON = { increasing: '\u2191', decreasing: '\u2193', stable: '\u2192' };
const TREND_COLOR_MAP = { increasing: T.green, decreasing: T.red, stable: T.amber };

/* ══════════════════════════════════════════════════════════════
   ESRS TOPICS
   ══════════════════════════════════════════════════════════════ */
const ESRS_TOPICS = [
  { id: 'E1', label: 'Climate Change', category: 'Environment', baseScore: 78 },
  { id: 'E2', label: 'Pollution', category: 'Environment', baseScore: 52 },
  { id: 'E3', label: 'Water & Marine Resources', category: 'Environment', baseScore: 55 },
  { id: 'E4', label: 'Biodiversity & Ecosystems', category: 'Environment', baseScore: 48 },
  { id: 'E5', label: 'Circular Economy', category: 'Environment', baseScore: 38 },
  { id: 'S1', label: 'Own Workforce', category: 'Social', baseScore: 65 },
  { id: 'S2', label: 'Value Chain Workers', category: 'Social', baseScore: 45 },
  { id: 'S3', label: 'Affected Communities', category: 'Social', baseScore: 40 },
  { id: 'S4', label: 'Consumers & End-users', category: 'Social', baseScore: 42 },
  { id: 'G1', label: 'Business Conduct', category: 'Governance', baseScore: 70 },
];

/* ══════════════════════════════════════════════════════════════
   TREND DRIVERS
   ══════════════════════════════════════════════════════════════ */
const TREND_DRIVERS = {
  regulatory: [
    { id: 'REG01', driver: 'CSRD/ESRS mandatory reporting (2025-2028)', impact_topics: ['E1','E2','E3','E4','E5','S1','S2','S3','S4','G1'], trend: 'increasing', strength: 'very_high', timeline: '2025-2028', category: 'regulatory' },
    { id: 'REG02', driver: 'EU CBAM carbon border adjustment (2026)', impact_topics: ['E1'], trend: 'increasing', strength: 'high', timeline: '2026', category: 'regulatory' },
    { id: 'REG03', driver: 'CSDDD supply chain due diligence (2027-2029)', impact_topics: ['S2','S3','G1'], trend: 'increasing', strength: 'high', timeline: '2027-2029', category: 'regulatory' },
    { id: 'REG04', driver: 'ISSB S2 mandatory adoption (global, 2025-2027)', impact_topics: ['E1'], trend: 'increasing', strength: 'very_high', timeline: '2025-2027', category: 'regulatory' },
    { id: 'REG05', driver: 'EU Deforestation Regulation (2025)', impact_topics: ['E4'], trend: 'increasing', strength: 'high', timeline: '2025', category: 'regulatory' },
    { id: 'REG06', driver: 'Nature Restoration Law (EU, 2024)', impact_topics: ['E4','E3'], trend: 'increasing', strength: 'medium', timeline: '2025-2030', category: 'regulatory' },
    { id: 'REG07', driver: 'Plastics Treaty (UNEP, 2025)', impact_topics: ['E2','E5'], trend: 'increasing', strength: 'medium', timeline: '2025-2027', category: 'regulatory' },
  ],
  scientific: [
    { id: 'SCI01', driver: 'IPCC AR7 (expected 2027-2028)', impact_topics: ['E1'], trend: 'increasing', strength: 'high', timeline: '2027-2028', category: 'scientific' },
    { id: 'SCI02', driver: 'Planetary boundaries \u2014 6 of 9 exceeded', impact_topics: ['E3','E4','E2'], trend: 'increasing', strength: 'very_high', timeline: '2025+', category: 'scientific' },
    { id: 'SCI03', driver: 'Water scarcity acceleration (2030+)', impact_topics: ['E3'], trend: 'increasing', strength: 'high', timeline: '2030+', category: 'scientific' },
    { id: 'SCI04', driver: 'Biodiversity tipping points (coral, Amazon)', impact_topics: ['E4'], trend: 'increasing', strength: 'very_high', timeline: '2025+', category: 'scientific' },
    { id: 'SCI05', driver: 'AI/automation workforce disruption', impact_topics: ['S1','S4'], trend: 'increasing', strength: 'medium', timeline: '2025-2035', category: 'scientific' },
  ],
  market: [
    { id: 'MKT01', driver: 'Net zero commitments ($150T AUM under GFANZ)', impact_topics: ['E1'], trend: 'increasing', strength: 'very_high', timeline: '2025-2050', category: 'market' },
    { id: 'MKT02', driver: 'ESG fund flows recovery (2024-2025)', impact_topics: ['E1','S1','G1'], trend: 'increasing', strength: 'medium', timeline: '2024-2025', category: 'market' },
    { id: 'MKT03', driver: 'Anti-ESG political backlash (US)', impact_topics: ['E1','S1'], trend: 'decreasing', strength: 'medium', timeline: '2024-2026', category: 'market' },
    { id: 'MKT04', driver: 'Insurance retreat from climate-exposed areas', impact_topics: ['E1','E3'], trend: 'increasing', strength: 'high', timeline: '2025-2030', category: 'market' },
    { id: 'MKT05', driver: 'Circular economy market growth (8%/yr)', impact_topics: ['E5'], trend: 'increasing', strength: 'medium', timeline: '2025-2035', category: 'market' },
  ],
};

const ALL_DRIVERS = [...TREND_DRIVERS.regulatory, ...TREND_DRIVERS.scientific, ...TREND_DRIVERS.market];

/* ══════════════════════════════════════════════════════════════
   SECTOR SENSITIVITY
   ══════════════════════════════════════════════════════════════ */
const SECTOR_SENSITIVITY = {
  Energy:        { E1: 1.8, E2: 1.3, E3: 1.2, E4: 1.1, E5: 0.8, S1: 1.0, S2: 1.1, S3: 1.3, S4: 0.7, G1: 1.0 },
  Materials:     { E1: 1.4, E2: 1.5, E3: 1.3, E4: 1.2, E5: 1.3, S1: 1.0, S2: 1.2, S3: 1.1, S4: 0.8, G1: 1.0 },
  Industrials:   { E1: 1.2, E2: 1.1, E3: 0.9, E4: 0.8, E5: 1.1, S1: 1.2, S2: 1.0, S3: 0.9, S4: 1.0, G1: 1.1 },
  Financials:    { E1: 1.1, E2: 0.5, E3: 0.6, E4: 0.7, E5: 0.5, S1: 1.0, S2: 0.8, S3: 0.9, S4: 1.2, G1: 1.5 },
  IT:            { E1: 0.9, E2: 0.6, E3: 0.7, E4: 0.5, E5: 0.8, S1: 1.3, S2: 0.9, S3: 0.7, S4: 1.4, G1: 1.2 },
  'Consumer':    { E1: 0.8, E2: 1.0, E3: 0.9, E4: 1.0, E5: 1.4, S1: 1.1, S2: 1.5, S3: 1.0, S4: 1.3, G1: 1.0 },
  Utilities:     { E1: 1.6, E2: 1.2, E3: 1.5, E4: 1.1, E5: 0.9, S1: 1.0, S2: 0.8, S3: 1.2, S4: 1.1, G1: 1.0 },
  'Health Care': { E1: 0.7, E2: 1.1, E3: 0.8, E4: 0.6, E5: 1.0, S1: 1.1, S2: 1.0, S3: 0.9, S4: 1.6, G1: 1.2 },
};

/* ══════════════════════════════════════════════════════════════
   FORECAST MODEL
   ══════════════════════════════════════════════════════════════ */
function forecastMateriality(topicId, currentScore, drivers, yearsForward, regMultiplier = 1.0) {
  let adjustment = 0;
  drivers.forEach(d => {
    if (d.impact_topics.includes(topicId)) {
      const base = STRENGTH_MAP[d.strength] || 0;
      const multiplied = d.category === 'regulatory' ? base * regMultiplier : base;
      const direction = d.trend === 'increasing' ? 1 : -1;
      adjustment += direction * multiplied * (yearsForward / 5);
    }
  });
  return Math.max(0, Math.min(100, currentScore + adjustment));
}

/* ══════════════════════════════════════════════════════════════
   MINI COMPONENTS
   ══════════════════════════════════════════════════════════════ */
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, margin: '4px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => {
  const colors = { navy: { bg: '#dbeafe', text: T.navy }, gold: { bg: '#fef3c7', text: '#92400e' }, sage: { bg: '#d1fae5', text: '#065f46' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, green: { bg: '#d1fae5', text: '#065f46' }, blue: { bg: '#dbeafe', text: '#1e40af' }, purple: { bg: '#ede9fe', text: '#6b21a8' }, gray: { bg: '#f3f4f6', text: '#374151' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{label}</span>;
};

const Btn = ({ children, onClick, active, sm, color }) => (
  <button onClick={onClick} style={{
    background: active ? T.navy : color === 'gold' ? T.gold : color === 'sage' ? T.sage : T.surface,
    color: active ? '#fff' : T.text, border: `1px solid ${active ? T.navy : T.border}`, borderRadius: 6,
    padding: sm ? '5px 12px' : '8px 18px', fontSize: sm ? 11 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
  }}>{children}</button>
);

const Section = ({ title, sub, children }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
    {children}
  </div>
);

const SortHeader = ({ label, field, sortField, sortDir, onSort, style }) => (
  <th onClick={() => onSort(field)} style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', userSelect: 'none', borderBottom: `2px solid ${T.border}`, textAlign: 'left', whiteSpace: 'nowrap', ...style }}>
    {label} {sortField === field ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
  </th>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function MaterialityTrendsPage() {
  const navigate = useNavigate();

  /* ── Portfolio from localStorage ── */
  const portfolio = useMemo(() => {
    const raw = loadLS(LS_PORT);
    if (raw && raw.portfolios && raw.activePortfolio && raw.portfolios[raw.activePortfolio]) {
      return raw.portfolios[raw.activePortfolio].holdings || [];
    }
    if (Array.isArray(raw) && raw.length) return raw;
    return GLOBAL_COMPANY_MASTER.slice(0, 20).map(c => ({ ...c, weight: 5.0 }));
  }, []);

  const holdings = useMemo(() => {
    return portfolio.map(h => {
      const match = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.ticker === h.ticker || c.company_name === h.company_name);
      return { ...h, ...match, weight: h.weight || h.portfolio_weight || 5 };
    }).filter(h => h.company_name);
  }, [portfolio]);

  /* ── State ── */
  const [regMultiplier, setRegMultiplier] = useState(1.0);
  const [forecastYear, setForecastYear] = useState(2030);
  const [sortField, setSortField] = useState('delta2035');
  const [sortDir, setSortDir] = useState('desc');
  const [driverFilter, setDriverFilter] = useState('all');
  const [selectedSector, setSelectedSector] = useState('Energy');
  const [tab, setTab] = useState('overview');

  /* ── Save prefs ── */
  useEffect(() => { saveLS(LS_PREFS, { regMultiplier, forecastYear, selectedSector }); }, [regMultiplier, forecastYear, selectedSector]);
  useEffect(() => {
    const p = loadLS(LS_PREFS);
    if (p) { if (p.regMultiplier) setRegMultiplier(p.regMultiplier); if (p.selectedSector) setSelectedSector(p.selectedSector); }
  }, []);

  /* ── Compute forecasts ── */
  const topicForecasts = useMemo(() => {
    return ESRS_TOPICS.map(t => {
      const y2025 = t.baseScore;
      const y2027 = forecastMateriality(t.id, y2025, ALL_DRIVERS, 2, regMultiplier);
      const y2030 = forecastMateriality(t.id, y2025, ALL_DRIVERS, 5, regMultiplier);
      const y2035 = forecastMateriality(t.id, y2025, ALL_DRIVERS, 10, regMultiplier);
      const delta2035 = y2035 - y2025;
      const trend = delta2035 > 3 ? 'increasing' : delta2035 < -3 ? 'decreasing' : 'stable';
      const driverCount = ALL_DRIVERS.filter(d => d.impact_topics.includes(t.id)).length;
      const keyDrivers = ALL_DRIVERS.filter(d => d.impact_topics.includes(t.id)).sort((a, b) => STRENGTH_MAP[b.strength] - STRENGTH_MAP[a.strength]).slice(0, 3);
      const emerging = y2025 < 50 && y2035 >= 50;
      return { ...t, y2025, y2027, y2030, y2035, delta2035, trend, driverCount, keyDrivers, emerging };
    });
  }, [regMultiplier]);

  /* ── Area chart data (year series) ── */
  const areaChartData = useMemo(() => {
    const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
    return years.map(y => {
      const row = { year: y };
      ESRS_TOPICS.forEach(t => {
        row[t.id] = parseFloat(forecastMateriality(t.id, t.baseScore, ALL_DRIVERS, y - 2025, regMultiplier).toFixed(1));
      });
      return row;
    });
  }, [regMultiplier]);

  /* ── KPI computations ── */
  const kpiData = useMemo(() => {
    const increasing = topicForecasts.filter(t => t.trend === 'increasing').length;
    const decreasing = topicForecasts.filter(t => t.trend === 'decreasing').length;
    const avgStrength = (ALL_DRIVERS.reduce((s, d) => s + STRENGTH_MAP[d.strength], 0) / ALL_DRIVERS.length).toFixed(1);
    const mostDynamic = topicForecasts.sort((a, b) => Math.abs(b.delta2035) - Math.abs(a.delta2035))[0];
    const emergingCount = topicForecasts.filter(t => t.emerging).length;
    return { increasing, decreasing, avgStrength, mostDynamic, emergingCount };
  }, [topicForecasts]);

  /* ── Driver impact heatmap data ── */
  const heatmapData = useMemo(() => {
    return ALL_DRIVERS.map(d => {
      const row = { driver: d.id, driverLabel: d.driver.substring(0, 40), category: d.category };
      ESRS_TOPICS.forEach(t => {
        row[t.id] = d.impact_topics.includes(t.id) ? STRENGTH_MAP[d.strength] * (d.trend === 'increasing' ? 1 : -1) : 0;
      });
      return row;
    });
  }, []);

  /* ── Filtered drivers ── */
  const filteredDrivers = useMemo(() => {
    if (driverFilter === 'all') return ALL_DRIVERS;
    return TREND_DRIVERS[driverFilter] || ALL_DRIVERS;
  }, [driverFilter]);

  /* ── Sector trends ── */
  const sectorTrendData = useMemo(() => {
    const sens = SECTOR_SENSITIVITY[selectedSector] || SECTOR_SENSITIVITY.Energy;
    return ESRS_TOPICS.map(t => {
      const mult = sens[t.id] || 1.0;
      const adjusted = Math.min(100, t.baseScore * mult);
      const y2035 = forecastMateriality(t.id, adjusted, ALL_DRIVERS, 10, regMultiplier);
      return { topic: t.id, label: t.label, current: parseFloat(adjusted.toFixed(1)), forecast2035: parseFloat(y2035.toFixed(1)), sensitivity: mult };
    });
  }, [selectedSector, regMultiplier]);

  /* ── Portfolio trajectory ── */
  const portfolioTrajectory = useMemo(() => {
    const years = [2025, 2027, 2030, 2033, 2035];
    return years.map(y => {
      const row = { year: y };
      ESRS_TOPICS.forEach(t => {
        let weightedScore = 0, totalW = 0;
        holdings.forEach(h => {
          const sKey = Object.keys(SECTOR_SENSITIVITY).find(s => (h.sector || '').includes(s)) || 'Financials';
          const sens = SECTOR_SENSITIVITY[sKey] || {};
          const mult = sens[t.id] || 1.0;
          const base = Math.min(100, t.baseScore * mult);
          const score = forecastMateriality(t.id, base, ALL_DRIVERS, y - 2025, regMultiplier);
          weightedScore += score * (h.weight || 5);
          totalW += (h.weight || 5);
        });
        row[t.id] = totalW > 0 ? parseFloat((weightedScore / totalW).toFixed(1)) : 0;
      });
      return row;
    });
  }, [holdings, regMultiplier]);

  /* ── Tipping points ── */
  const tippingAlerts = useMemo(() => {
    return topicForecasts.filter(t => t.y2025 < 55 && t.y2035 >= 55).map(t => ({
      ...t,
      crossYear: [2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].find(y =>
        forecastMateriality(t.id, t.baseScore, ALL_DRIVERS, y - 2025, regMultiplier) >= 55
      ) || 2035,
    }));
  }, [topicForecasts, regMultiplier]);

  /* ── Historical comparison ── */
  const historicalComparison = useMemo(() => {
    return ESRS_TOPICS.map(t => ({
      topic: t.id, label: t.label,
      score2020: Math.max(10, t.baseScore - 15 - Math.floor(sr(hashStr(t.id), 99) * 10)),
      score2025: t.baseScore,
      score2035: topicForecasts.find(f => f.id === t.id)?.y2035 || t.baseScore,
    }));
  }, [topicForecasts]);

  /* ── Sort handler ── */
  const handleSort = useCallback((field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }, [sortField]);

  const sorted = useMemo(() => {
    return [...topicForecasts].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [topicForecasts, sortField, sortDir]);

  /* ── Export helpers ── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'object' ? `"${JSON.stringify(v)}"` : `"${v}"`; }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback((data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportMarkdown = useCallback(() => {
    let md = '# Materiality Trend Analysis Report\n\n';
    md += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
    md += `Regulatory Multiplier: ${regMultiplier}x\n\n`;
    md += '## Topic Forecasts\n\n';
    md += '| Topic | 2025 | 2027 | 2030 | 2035 | Trend |\n|---|---|---|---|---|---|\n';
    topicForecasts.forEach(t => { md += `| ${t.id} ${t.label} | ${fmt1(t.y2025)} | ${fmt1(t.y2027)} | ${fmt1(t.y2030)} | ${fmt1(t.y2035)} | ${t.trend} |\n`; });
    md += '\n## Active Drivers\n\n';
    ALL_DRIVERS.forEach(d => { md += `- **${d.id}**: ${d.driver} (${d.strength}, ${d.trend})\n`; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'materiality-trends-report.md'; a.click(); URL.revokeObjectURL(url);
  }, [topicForecasts, regMultiplier]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Materiality Trend Analyzer</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
            Track how materiality of sustainability topics evolves over time due to regulation, science, and market shifts
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label="7 Regulatory Drivers" color="navy" />
            <Badge label="5 Scientific Drivers" color="purple" />
            <Badge label="5 Market Drivers" color="gold" />
            <Badge label="2025-2035 Forecast" color="sage" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn onClick={() => exportCSV(topicForecasts.map(t => ({ topic: t.id, label: t.label, y2025: t.y2025, y2027: t.y2027, y2030: t.y2030, y2035: t.y2035, trend: t.trend, driverCount: t.driverCount })), 'materiality-trends.csv')} sm>Export CSV</Btn>
          <Btn onClick={() => exportJSON({ forecasts: topicForecasts, drivers: ALL_DRIVERS, settings: { regMultiplier } }, 'materiality-trends.json')} sm>Export JSON</Btn>
          <Btn onClick={exportMarkdown} sm>Export MD</Btn>
        </div>
      </div>

      {/* ── 8 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Topics Tracked" value={ESRS_TOPICS.length} sub="10 ESRS topics" />
        <KpiCard label="Drivers Active" value={ALL_DRIVERS.length} sub="Reg + Sci + Mkt" color={T.navy} />
        <KpiCard label="Topics Increasing" value={kpiData.increasing} sub="by 2035" color={T.green} />
        <KpiCard label="Topics Decreasing" value={kpiData.decreasing} sub="by 2035" color={T.red} />
        <KpiCard label="Avg Driver Strength" value={kpiData.avgStrength} sub="out of 5.0" color={T.gold} />
        <KpiCard label="Forecast Horizon" value="2035" sub="10-year outlook" />
        <KpiCard label="Most Dynamic" value={kpiData.mostDynamic?.id || 'N/A'} sub={kpiData.mostDynamic ? `\u0394 ${fmt1(kpiData.mostDynamic.delta2035)}pts` : ''} color={T.sage} />
        <KpiCard label="Emerging Topics" value={kpiData.emergingCount} sub="crossing threshold" color={T.amber} />
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {['overview','drivers','sectors','portfolio','methodology'].map(t => (
          <Btn key={t} onClick={() => setTab(t)} active={tab === t} sm>{t.charAt(0).toUpperCase() + t.slice(1)}</Btn>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
         SECTION 3 — Materiality Trend Area Chart
         ════════════════════════════════════════════════ */}
      <Section title="Materiality Trend Projection (2025\u20132035)" sub="Area chart showing projected materiality score trajectories for all 10 ESRS topics">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={areaChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {ESRS_TOPICS.map((t, i) => (
              <Area key={t.id} type="monotone" dataKey={t.id} name={`${t.id} ${t.label}`} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.08} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 4 — Trend Driver Dashboard
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'drivers') && (
        <Section title="Trend Driver Dashboard" sub="Three categories of drivers shaping materiality">
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {['all','regulatory','scientific','market'].map(f => (
              <Btn key={f} onClick={() => setDriverFilter(f)} active={driverFilter === f} sm>
                {f === 'all' ? 'All Drivers' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Btn>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {Object.entries(TREND_DRIVERS).filter(([cat]) => driverFilter === 'all' || cat === driverFilter).map(([cat, drivers]) => (
              <div key={cat} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, background: T.surfaceH }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10, textTransform: 'capitalize' }}>{cat} ({drivers.length})</div>
                {drivers.map(d => (
                  <div key={d.id} style={{ marginBottom: 10, padding: 10, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec }}>{d.id}</span>
                      <span style={{ fontSize: 11, color: STRENGTH_COLOR[d.strength], fontWeight: 700 }}>{STRENGTH_LABEL[d.strength]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.text, marginBottom: 6 }}>{d.driver}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {d.impact_topics.map(tid => <Badge key={tid} label={tid} color={d.trend === 'increasing' ? 'green' : 'red'} />)}
                      <span style={{ fontSize: 10, color: T.textMut, alignSelf: 'center', marginLeft: 4 }}>{d.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 5 — Topic Forecast Table (Sortable)
         ════════════════════════════════════════════════ */}
      <Section title="Topic Forecast Table" sub="Sortable projections with trend direction and key drivers">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <SortHeader label="Topic" field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="2025" field="y2025" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <SortHeader label="2027" field="y2027" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <SortHeader label="2030" field="y2030" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <SortHeader label="2035" field="y2035" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <SortHeader label="\u0394 2035" field="delta2035" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <SortHeader label="Trend" field="trend" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="# Drivers" field="driverCount" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>Key Drivers</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{t.id} {t.label}</td>
                  <td style={{ padding: '10px 8px' }}><Badge label={t.category} color={t.category === 'Environment' ? 'green' : t.category === 'Social' ? 'blue' : 'gold'} /></td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt1(t.y2025)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt1(t.y2027)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt1(t.y2030)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt1(t.y2035)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: t.delta2035 > 0 ? T.green : t.delta2035 < 0 ? T.red : T.amber }}>
                    {t.delta2035 > 0 ? '+' : ''}{fmt1(t.delta2035)}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ color: TREND_COLOR_MAP[t.trend], fontWeight: 700 }}>{TREND_ICON[t.trend]} {t.trend}</span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{t.driverCount}</td>
                  <td style={{ padding: '10px 8px', maxWidth: 220 }}>
                    {t.keyDrivers.map(d => <span key={d.id} style={{ display: 'inline-block', marginRight: 4, marginBottom: 2 }}><Badge label={d.id} color="gray" /></span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 6 — Emerging Materiality Radar
         ════════════════════════════════════════════════ */}
      <Section title="Emerging Materiality Radar" sub="Topics currently below materiality threshold but trending upward toward material status">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={topicForecasts.map(t => ({ topic: t.id, current: t.y2025, forecast: t.y2035, threshold: 55 }))}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Current (2025)" dataKey="current" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Forecast (2035)" dataKey="forecast" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Threshold" dataKey="threshold" stroke={T.red} fill="none" strokeWidth={1} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Emerging Topics (Crossing Threshold by 2035)</div>
            {topicForecasts.filter(t => t.emerging).length === 0 && (
              <div style={{ fontSize: 12, color: T.textMut, padding: 16 }}>No topics are currently emerging toward the materiality threshold.</div>
            )}
            {topicForecasts.filter(t => t.emerging).map(t => (
              <div key={t.id} style={{ padding: 12, marginBottom: 8, border: `1px solid ${T.gold}`, borderRadius: 8, background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t.id} {t.label}</span>
                  <Badge label="Emerging" color="amber" />
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                  Score: {fmt1(t.y2025)} (2025) &rarr; {fmt1(t.y2035)} (2035) | {t.driverCount} active drivers
                </div>
              </div>
            ))}
            {topicForecasts.filter(t => !t.emerging && t.y2025 < 55).map(t => (
              <div key={t.id} style={{ padding: 10, marginBottom: 6, border: `1px solid ${T.border}`, borderRadius: 8, background: T.surface }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{t.id} {t.label}</span>
                  <Badge label="Below Threshold" color="gray" />
                </div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>Score: {fmt1(t.y2025)} &rarr; {fmt1(t.y2035)}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 7 — Driver Impact Heatmap
         ════════════════════════════════════════════════ */}
      <Section title="Driver Impact Heatmap" sub={`${ALL_DRIVERS.length} drivers x ${ESRS_TOPICS.length} topics \u2014 color intensity reflects impact strength`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, minWidth: 120 }}>Driver</th>
                {ESRS_TOPICS.map(t => (
                  <th key={t.id} style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, minWidth: 44 }}>{t.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, ri) => (
                <tr key={row.driver}>
                  <td style={{ padding: '6px', fontSize: 10, fontWeight: 600, color: T.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: ri % 2 ? T.surfaceH : T.surface }}>
                    <span style={{ color: T.textMut, marginRight: 4 }}>{row.driver}</span>
                    {row.driverLabel}
                  </td>
                  {ESRS_TOPICS.map(t => {
                    const v = row[t.id];
                    const abs = Math.abs(v);
                    const bg = v === 0 ? T.surface : v > 0
                      ? `rgba(22,163,74,${abs * 0.18})`
                      : `rgba(220,38,38,${abs * 0.18})`;
                    return (
                      <td key={t.id} style={{ padding: '6px 4px', textAlign: 'center', background: bg, fontSize: 10, fontWeight: abs >= 3 ? 700 : 400, color: v === 0 ? T.textMut : v > 0 ? T.green : T.red, borderRight: `1px solid ${T.border}` }}>
                        {v === 0 ? '\u00B7' : (v > 0 ? '+' : '') + v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 8 — Forecast Sensitivity Slider
         ════════════════════════════════════════════════ */}
      <Section title="Forecast Sensitivity Analysis" sub="Adjust regulatory strength multiplier to see impact on forecasts">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.navy, minWidth: 200 }}>
            Regulatory Strength Multiplier: <strong style={{ color: T.gold }}>{regMultiplier.toFixed(1)}x</strong>
          </label>
          <input type="range" min={0.5} max={3.0} step={0.1} value={regMultiplier}
            onChange={e => setRegMultiplier(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: T.navy, cursor: 'pointer' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.5, 1.0, 1.5, 2.0, 3.0].map(v => (
              <Btn key={v} onClick={() => setRegMultiplier(v)} active={regMultiplier === v} sm>{v}x</Btn>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topicForecasts.map(t => ({
            topic: t.id,
            baseline: t.y2025,
            forecast: t.y2035,
            delta: t.delta2035,
          }))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="baseline" name="2025 Score" fill={T.navy} barSize={12} radius={[0, 4, 4, 0]} />
            <Bar dataKey="forecast" name={`2035 @ ${regMultiplier}x`} fill={T.gold} barSize={12} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 9 — Sector-Specific Trends
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'sectors') && (
        <Section title="Sector-Specific Materiality Trends" sub="How trend impacts vary by sector sensitivity">
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.keys(SECTOR_SENSITIVITY).map(s => (
              <Btn key={s} onClick={() => setSelectedSector(s)} active={selectedSector === s} sm>{s}</Btn>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sectorTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="current" name={`${selectedSector} Current`} fill={T.navy} radius={[4, 4, 0, 0]} />
              <Bar dataKey="forecast2035" name={`${selectedSector} 2035`} fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 16 }}>
            {sectorTrendData.filter(d => d.sensitivity > 1.2).map(d => (
              <div key={d.topic} style={{ padding: 10, border: `1px solid ${T.gold}`, borderRadius: 8, background: '#fffbeb' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: T.navy }}>{d.topic} {d.label}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>Sensitivity: {d.sensitivity}x | {fmt1(d.current)} &rarr; {fmt1(d.forecast2035)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 10 — Portfolio Materiality Trajectory
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'portfolio') && (
        <Section title="Portfolio Materiality Trajectory" sub={`Weighted portfolio materiality scores over time (${holdings.length} holdings)`}>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={portfolioTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {ESRS_TOPICS.map((t, i) => (
                <Line key={t.id} type="monotone" dataKey={t.id} name={`${t.id} ${t.label}`} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, fontSize: 11, color: T.textSec }}>
            Portfolio-weighted scores account for sector sensitivity multipliers applied to each holding's sector classification.
          </div>
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 11 — Tipping Point Alerts
         ════════════════════════════════════════════════ */}
      <Section title="Tipping Point Alerts" sub="Topics approaching or crossing the materiality threshold (score 55) from below">
        {tippingAlerts.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.textMut, fontSize: 13 }}>
            No topics are currently approaching the materiality threshold from below at the current regulatory multiplier ({regMultiplier}x).
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {tippingAlerts.map(t => (
              <div key={t.id} style={{ padding: 16, border: `2px solid ${T.amber}`, borderRadius: 10, background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{t.id} {t.label}</span>
                  <Badge label={`Crosses ~${t.crossYear}`} color="amber" />
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>2025</div><div style={{ fontSize: 18, fontWeight: 700 }}>{fmt1(t.y2025)}</div></div>
                  <div style={{ fontSize: 20, color: T.amber, alignSelf: 'center' }}>&rarr;</div>
                  <div><div style={{ fontSize: 10, color: T.textMut }}>2035</div><div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{fmt1(t.y2035)}</div></div>
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  {t.driverCount} active drivers | Key: {t.keyDrivers.map(d => d.id).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 12 — Historical Materiality Comparison
         ════════════════════════════════════════════════ */}
      <Section title="Historical Materiality Comparison" sub="How materiality landscape has evolved from 2020 to projected 2035">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={historicalComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="score2020" name="2020 (est.)" fill={T.textMut} radius={[4, 4, 0, 0]} />
            <Bar dataKey="score2025" name="2025 (current)" fill={T.navy} radius={[4, 4, 0, 0]} />
            <Bar dataKey="score2035" name="2035 (forecast)" fill={T.gold} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, marginTop: 16 }}>
          {historicalComparison.map(h => {
            const delta5yr = h.score2025 - h.score2020;
            const delta10yr = h.score2035 - h.score2025;
            return (
              <div key={h.topic} style={{ padding: 10, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{h.topic} {h.label}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                  2020&rarr;2025: <span style={{ color: delta5yr > 0 ? T.green : T.red, fontWeight: 700 }}>{delta5yr > 0 ? '+' : ''}{delta5yr.toFixed(0)}</span>
                  {' | '}2025&rarr;2035: <span style={{ color: delta10yr > 0 ? T.green : T.red, fontWeight: 700 }}>{delta10yr > 0 ? '+' : ''}{fmt1(delta10yr)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 13 — Methodology Notes
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'methodology') && (
        <Section title="Methodology Notes" sub="Approach to materiality trend scoring, driver weights, and forecast limitations">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Trend Scoring Method</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                Each ESRS topic starts with a base materiality score (0-100) reflecting current regulatory requirements, scientific consensus, and market expectations. The forecast model applies driver-specific adjustments based on:
              </div>
              <ul style={{ fontSize: 12, color: T.textSec, paddingLeft: 20, marginTop: 8 }}>
                <li><strong>Driver Strength:</strong> Very High (5), High (3), Medium (2), Low (1)</li>
                <li><strong>Direction:</strong> Increasing (+1) or Decreasing (-1)</li>
                <li><strong>Time Horizon:</strong> Adjustments are normalized to a 5-year horizon</li>
                <li><strong>Regulatory Multiplier:</strong> Adjustable via sensitivity slider (default 1.0x)</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Limitations</div>
              <ul style={{ fontSize: 12, color: T.textSec, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Forecasts are illustrative, not predictive. Actual materiality depends on many context-specific factors.</li>
                <li>Driver strength ratings are based on expert judgment and may not reflect future developments.</li>
                <li>Sector sensitivity multipliers are approximations and should be validated for specific companies.</li>
                <li>The model assumes linear trajectory; real-world materiality shifts often occur in step-functions around regulatory deadlines.</li>
                <li>Anti-ESG backlash impact is difficult to quantify and may be overstated or understated.</li>
              </ul>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginTop: 16, marginBottom: 8 }}>Data Sources</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                EFRAG ESRS Standards, ISSB IFRS S1/S2, EU regulatory timeline, IPCC AR6/AR7 schedule, GFANZ progress reports, PRI signatory data, academic literature on planetary boundaries.
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 14 — Cross-Navigation
         ════════════════════════════════════════════════ */}
      <Section title="Cross-Module Navigation" sub="Navigate to related modules for deeper analysis">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { label: 'Double Materiality Assessment', path: '/double-materiality', desc: 'Full ESRS materiality matrix with financial & impact dimensions' },
            { label: 'ISSB Materiality Engine', path: '/issb-materiality', desc: 'SASB/ISSB topic materiality and cross-framework mapping' },
            { label: 'Regulatory Calendar', path: '/regulatory-calendar', desc: 'Upcoming regulatory deadlines and compliance tracker' },
            { label: 'Scenario Stress Test', path: '/scenario-stress-test', desc: 'Climate scenario analysis and portfolio impact modeling' },
            { label: 'Controversy Monitor', path: '/controversy-monitor', desc: 'Real-time ESG controversy tracking and severity scoring' },
            { label: 'Controversy-Materiality Linkage', path: '/controversy-materiality', desc: 'Link ESG controversies to materiality topics for validation' },
          ].map(n => (
            <div key={n.path} onClick={() => navigate(n.path)} style={{
              padding: 16, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer',
              background: T.surface, transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{n.label}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{n.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: T.textMut }}>
        Materiality Trend Analyzer &mdash; Sprint T: Dynamic Materiality Engine &mdash; {ALL_DRIVERS.length} drivers, {ESRS_TOPICS.length} topics, 2025-2035 horizon
      </div>
    </div>
  );
}
