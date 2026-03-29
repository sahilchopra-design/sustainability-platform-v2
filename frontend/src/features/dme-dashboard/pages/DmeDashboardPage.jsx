import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];
const REGIME_COLORS = { Normal:'#16a34a', Elevated:'#d97706', Critical:'#dc2626', Extreme:'#7c2d12' };

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORT = 'ra_portfolio_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Primitives ───────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? T.gold : T.border}`, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${accent || T.gold}`, fontFamily: T.font }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 600, background: T.surfaceH, color: T.textSec, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small, color }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, cursor: 'pointer', background: active ? T.navy : color || T.surface, color: active ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: T.font, transition: 'all 0.15s' }}>{children}</button>
);
const Badge = ({ label, color }) => {
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, sage: { bg: '#dcfce7', text: '#166534' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

/* ═══════════════════════════════════════════════════════════════════════════
   DATA ENRICHMENT
   ═══════════════════════════════════════════════════════════════════════════ */
function enrichEntity(c, idx) {
  const s = seed(c.company_name || idx);
  const dmi = c.dmi_score || clamp(15 + sRand(s) * 80, 5, 98);
  const regime = dmi > 80 ? 'Extreme' : dmi > 60 ? 'Critical' : dmi > 35 ? 'Elevated' : 'Normal';
  return {
    ...c,
    dmi: Math.round(dmi * 10) / 10,
    regime,
    esg_score: c.esg_score || Math.round(25 + sRand(s + 1) * 65),
    ghg_intensity: c.ghg_intensity_tco2e_per_mn || Math.round(10 + sRand(s + 2) * 800),
    transition_risk: c.transition_risk_score || Math.round(10 + sRand(s + 3) * 70),
    pd_1y: clamp(0.1 + sRand(s + 4) * 8, 0.01, 15),
    var_95: clamp(2 + sRand(s + 5) * 20, 0.5, 30),
    wacc_spread: clamp(50 + sRand(s + 6) * 300, 20, 500),
    lcr: clamp(80 + sRand(s + 7) * 80, 50, 200),
    implied_temp: c.implied_temp_rise || clamp(1.2 + sRand(s + 8) * 2.8, 1.2, 4.5),
    market_cap: c.market_cap_usd_mn || Math.round(100 + sRand(s + 9) * 50000),
  };
}

/* Lazy init to avoid TDZ issues with module initialization order */
let _ENTITIES_CACHE = null;
function getEntities() { if (!_ENTITIES_CACHE) _ENTITIES_CACHE = GLOBAL_COMPANY_MASTER.map((c, i) => enrichEntity(c, i)); return _ENTITIES_CACHE; }

/* ── NGFS Scenarios ───────────────────────────────────────────────────────── */
const NGFS_SCENARIOS = [
  { id: 'nz2050', name: 'Net Zero 2050', temp: 1.5, category: 'Orderly', color: '#16a34a' },
  { id: 'below2', name: 'Below 2\u00b0C', temp: 1.7, category: 'Orderly', color: '#22c55e' },
  { id: 'diverg', name: 'Divergent Net Zero', temp: 1.5, category: 'Disorderly', color: '#d97706' },
  { id: 'delay', name: 'Delayed Transition', temp: 1.8, category: 'Disorderly', color: '#f59e0b' },
  { id: 'ndcs', name: 'NDCs', temp: 2.5, category: 'Hot house', color: '#dc2626' },
  { id: 'curpol', name: 'Current Policies', temp: 3.0, category: 'Hot house', color: '#991b1b' },
];

/* ── Regulatory deadlines ────────────────────────────────────────────────── */
const REGULATORY_DEADLINES = [
  { date: '2026-06-30', regulation: 'CSRD First Filing (Large)', status: 'Upcoming', severity: 'red' },
  { date: '2026-09-30', regulation: 'SFDR PAI Statement', status: 'Upcoming', severity: 'amber' },
  { date: '2026-12-31', regulation: 'EU Taxonomy Reporting', status: 'Upcoming', severity: 'amber' },
  { date: '2027-01-15', regulation: 'CSDDD Due Diligence Plan', status: 'Upcoming', severity: 'red' },
  { date: '2027-06-30', regulation: 'ISSB S1/S2 Alignment', status: 'Planned', severity: 'gold' },
];

/* ── Alert types ─────────────────────────────────────────────────────────── */
const ALERT_TIERS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ALERT_PILLARS = ['E', 'S', 'G', 'P', 'X'];

function generateAlerts(entities) {
  const alerts = [];
  entities.slice(0, 40).forEach((e, idx) => {
    const s = seed(e.company_name + 'alert');
    if (e.regime === 'Critical' || e.regime === 'Extreme') {
      alerts.push({
        id: `ALR-${String(idx).padStart(4, '0')}`,
        entity: e.company_name,
        tier: e.regime === 'Extreme' ? 'CRITICAL' : 'HIGH',
        pillar: ALERT_PILLARS[Math.floor(sRand(s) * 5)],
        message: e.regime === 'Extreme' ? `Extreme DMI regime detected (${e.dmi})` : `Critical regime threshold breach (${e.dmi})`,
        timestamp: new Date(Date.now() - Math.floor(sRand(s + 1) * 7 * 24 * 3600000)).toISOString(),
      });
    }
    if (e.pd_1y > 5) {
      alerts.push({
        id: `ALR-PD-${String(idx).padStart(4, '0')}`,
        entity: e.company_name,
        tier: 'HIGH',
        pillar: 'P',
        message: `PD > 5% (${e.pd_1y.toFixed(2)}%)`,
        timestamp: new Date(Date.now() - Math.floor(sRand(s + 2) * 5 * 24 * 3600000)).toISOString(),
      });
    }
  });
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 DME MODULES
   ═══════════════════════════════════════════════════════════════════════════ */
const DME_MODULES = [
  { id: 'risk', name: 'DME Risk Engine', path: '/dme-risk', desc: 'Multi-pillar risk scoring (E/S/G/P/X)', icon: '\u26a0\ufe0f' },
  { id: 'entity', name: 'Entity Deep-Dive', path: '/dme-entity', desc: '360\u00b0 entity-level analysis', icon: '\ud83d\udd0d' },
  { id: 'scenarios', name: 'NGFS Scenarios', path: '/ngfs-scenarios', desc: '6 NGFS climate pathways', icon: '\ud83c\udf0d' },
  { id: 'alerts', name: 'Alert Center', path: '/dme-alerts', desc: 'Real-time regime breach alerts', icon: '\ud83d\udea8' },
  { id: 'contagion', name: 'Contagion Network', path: '/dme-contagion', desc: 'Sectoral spillover analysis', icon: '\ud83d\udd17' },
  { id: 'portfolio', name: 'Portfolio Analytics', path: '/dme-portfolio', desc: 'DMI/HHI/PCAF portfolio view', icon: '\ud83d\udcca' },
  { id: 'competitive', name: 'Competitive Intel', path: '/dme-competitive', desc: '5-dimension peer benchmarking', icon: '\ud83c\udfc6' },
  { id: 'dashboard', name: 'Intelligence Hub', path: '/dme-dashboard', desc: 'This executive dashboard', icon: '\ud83c\udfdb\ufe0f' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DmeDashboardPage() {
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState('dmi');
  const [sortDir, setSortDir] = useState('desc');

  /* ── Load portfolio from localStorage ──────────────────────────────────── */
  const portfolioHoldings = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_PORT);
      if (!raw) return [];
      const outer = JSON.parse(raw);
      if (outer && typeof outer === 'object' && outer.portfolios) {
        return outer.portfolios?.[outer.activePortfolio]?.holdings || [];
      }
      return [];
    } catch { return []; }
  }, []);

  /* ── Hero metrics ──────────────────────────────────────────────────────── */
  const totalAUM = useMemo(() => {
    const sum = getEntities().reduce((s, e) => s + (e.market_cap || 0), 0);
    return Math.round(sum / 1000);
  }, []);

  const portfolioDMI = useMemo(() => {
    const n = Math.min(getEntities().length, 50);
    const subset = getEntities().slice(0, n);
    return Math.round(subset.reduce((s, e) => s + e.dmi, 0) / n * 10) / 10;
  }, []);

  const criticalCount = useMemo(() => getEntities().filter(e => e.regime === 'Critical' || e.regime === 'Extreme').length, []);

  const alerts = useMemo(() => generateAlerts(getEntities()), []);

  /* ── Regime distribution ───────────────────────────────────────────────── */
  const regimeDistribution = useMemo(() => {
    const map = { Normal: 0, Elevated: 0, Critical: 0, Extreme: 0 };
    getEntities().forEach(e => { map[e.regime] = (map[e.regime] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value, fill: REGIME_COLORS[name] }));
  }, []);

  /* ── Pillar risk scores ────────────────────────────────────────────────── */
  const pillarScores = useMemo(() => {
    const n = Math.min(getEntities().length, 100);
    const subset = getEntities().slice(0, n);
    return [
      { pillar: 'E', label: 'Environmental', score: Math.round(subset.reduce((s, e) => s + (e.ghg_intensity || 0) / 10, 0) / n * 10) / 10 },
      { pillar: 'S', label: 'Social', score: Math.round(subset.reduce((s, e) => s + (100 - (e.esg_score || 50)) * 0.3, 0) / n * 10) / 10 },
      { pillar: 'G', label: 'Governance', score: Math.round(subset.reduce((s, e) => s + (100 - (e.esg_score || 50)) * 0.25, 0) / n * 10) / 10 },
      { pillar: 'P', label: 'Physical Risk', score: Math.round(subset.reduce((s, e) => s + (e.transition_risk || 0) * 0.4, 0) / n * 10) / 10 },
      { pillar: 'X', label: 'Transition Risk', score: Math.round(subset.reduce((s, e) => s + (e.transition_risk || 0) * 0.5, 0) / n * 10) / 10 },
    ];
  }, []);

  /* ── Risk traffic light ────────────────────────────────────────────────── */
  const riskChannels = useMemo(() => {
    const n = Math.min(getEntities().length, 100);
    const subset = getEntities().slice(0, n);
    const avgPD = subset.reduce((s, e) => s + e.pd_1y, 0) / n;
    const avgVaR = subset.reduce((s, e) => s + e.var_95, 0) / n;
    const avgWACC = subset.reduce((s, e) => s + e.wacc_spread, 0) / n;
    const avgLCR = subset.reduce((s, e) => s + e.lcr, 0) / n;
    const opRisk = subset.filter(e => e.regime === 'Critical' || e.regime === 'Extreme').length / n * 100;
    const signal = (val, green, amber) => val <= green ? 'green' : val <= amber ? 'amber' : 'red';
    return [
      { channel: 'Credit (PD)', value: `${avgPD.toFixed(2)}%`, signal: signal(avgPD, 2, 5), threshold: '<2% / <5%' },
      { channel: 'Market (VaR)', value: `${avgVaR.toFixed(1)}%`, signal: signal(avgVaR, 8, 15), threshold: '<8% / <15%' },
      { channel: 'Valuation (WACC)', value: `${Math.round(avgWACC)} bps`, signal: signal(avgWACC, 150, 300), threshold: '<150 / <300 bps' },
      { channel: 'Liquidity (LCR)', value: `${Math.round(avgLCR)}%`, signal: avgLCR >= 120 ? 'green' : avgLCR >= 100 ? 'amber' : 'red', threshold: '>120% / >100%' },
      { channel: 'Operational', value: `${opRisk.toFixed(1)}% critical`, signal: signal(opRisk, 10, 25), threshold: '<10% / <25%' },
    ];
  }, []);

  /* ── Top 10 entities by DMI ────────────────────────────────────────────── */
  const top10 = useMemo(() => {
    const arr = [...getEntities()];
    arr.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr.slice(0, 10);
  }, [sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Module KPIs ───────────────────────────────────────────────────────── */
  const moduleKPIs = useMemo(() => ({
    risk: `${getEntities().length} entities scored`,
    entity: `${getEntities().filter(e => e.regime === 'Critical' || e.regime === 'Extreme').length} critical`,
    scenarios: '6 NGFS pathways',
    alerts: `${alerts.length} active alerts`,
    contagion: `${new Set(getEntities().map(e => e.sector)).size} sectors mapped`,
    portfolio: `${portfolioHoldings.length || 25} holdings`,
    competitive: `${getEntities().length} companies benchmarked`,
    dashboard: 'Executive hub',
  }), [alerts, portfolioHoldings]);

  /* ── Sector breakdown ───────────────────────────────────────────────────── */
  const sectorBreakdown = useMemo(() => {
    const map = {};
    getEntities().forEach(e => {
      if (!map[e.sector]) map[e.sector] = { sector: e.sector, count: 0, avgDMI: 0, avgESG: 0, critCount: 0, totalCap: 0 };
      const m = map[e.sector];
      m.count += 1;
      m.avgDMI += e.dmi;
      m.avgESG += e.esg_score;
      m.totalCap += e.market_cap;
      if (e.regime === 'Critical' || e.regime === 'Extreme') m.critCount += 1;
    });
    return Object.values(map).map(m => ({
      ...m,
      avgDMI: Math.round(m.avgDMI / m.count * 10) / 10,
      avgESG: Math.round(m.avgESG / m.count),
      critPct: Math.round(m.critCount / m.count * 100),
      totalCap: Math.round(m.totalCap),
    })).sort((a, b) => b.avgDMI - a.avgDMI);
  }, []);

  /* ── Coverage stats ────────────────────────────────────────────────────── */
  const coverageStats = useMemo(() => {
    const hasESG = getEntities().filter(e => e.esg_score > 0).length;
    const hasEmissions = getEntities().filter(e => e.ghg_intensity > 0).length;
    const hasTemp = getEntities().filter(e => e.implied_temp > 0).length;
    const hasPD = getEntities().filter(e => e.pd_1y > 0).length;
    return [
      { metric: 'ESG Score Coverage', covered: hasESG, total: getEntities().length, pct: Math.round(hasESG / getEntities().length * 100) },
      { metric: 'GHG Emissions Coverage', covered: hasEmissions, total: getEntities().length, pct: Math.round(hasEmissions / getEntities().length * 100) },
      { metric: 'Temperature Alignment', covered: hasTemp, total: getEntities().length, pct: Math.round(hasTemp / getEntities().length * 100) },
      { metric: 'Credit Risk (PD)', covered: hasPD, total: getEntities().length, pct: Math.round(hasPD / getEntities().length * 100) },
    ];
  }, []);

  /* ── Risk vs return quadrant data ──────────────────────────────────────── */
  const riskReturnQuadrant = useMemo(() => {
    return getEntities().slice(0, 50).map(e => ({
      name: e.company_name,
      risk: e.dmi,
      return: e.esg_score,
      regime: e.regime,
      sector: e.sector,
    }));
  }, []);

  /* ── System health ─────────────────────────────────────────────────────── */
  const systemHealth = useMemo(() => [
    { module: 'Data Ingestion', status: 'Operational', latency: '120ms', lastSync: '2 min ago', uptime: '99.98%' },
    { module: 'Risk Computation', status: 'Operational', latency: '340ms', lastSync: '5 min ago', uptime: '99.95%' },
    { module: 'Alert Engine', status: 'Operational', latency: '85ms', lastSync: '1 min ago', uptime: '99.99%' },
    { module: 'NGFS Scenario Runner', status: 'Operational', latency: '2.1s', lastSync: '15 min ago', uptime: '99.90%' },
    { module: 'PCAF Calculator', status: 'Operational', latency: '450ms', lastSync: '10 min ago', uptime: '99.96%' },
  ], []);

  /* ── DMI Trend (simulated 12-month) ────────────────────────────────────── */
  const dmiTrend = useMemo(() => {
    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    return months.map((m, i) => {
      const drift = (i - 6) * 0.25 + sRand(seed(m + 'dash')) * 3;
      return { month: m, dmi: Math.round((portfolioDMI + drift) * 10) / 10, benchmark: 50 };
    });
  }, [portfolioDMI]);

  /* ── ESG score distribution ──────────────────────────────────────────── */
  const esgDistribution = useMemo(() => {
    const buckets = [
      { label: '0-20', count: 0 }, { label: '21-40', count: 0 },
      { label: '41-60', count: 0 }, { label: '61-80', count: 0 },
      { label: '81-100', count: 0 },
    ];
    const ranges = [[0, 20], [21, 40], [41, 60], [61, 80], [81, 100]];
    getEntities().forEach(e => {
      const idx = ranges.findIndex(r => e.esg_score >= r[0] && e.esg_score <= r[1]);
      if (idx >= 0) buckets[idx].count += 1;
    });
    return buckets;
  }, []);

  /* ── Temperature distribution ──────────────────────────────────────────── */
  const tempDistribution = useMemo(() => {
    const ranges = [
      { label: '< 1.5\u00b0C', min: 0, max: 1.5, count: 0, fill: T.sage },
      { label: '1.5-2.0\u00b0C', min: 1.5, max: 2.0, count: 0, fill: T.green },
      { label: '2.0-2.5\u00b0C', min: 2.0, max: 2.5, count: 0, fill: T.amber },
      { label: '2.5-3.0\u00b0C', min: 2.5, max: 3.0, count: 0, fill: '#f97316' },
      { label: '> 3.0\u00b0C', min: 3.0, max: 99, count: 0, fill: T.red },
    ];
    getEntities().forEach(e => {
      const r = ranges.find(r => e.implied_temp >= r.min && e.implied_temp < r.max);
      if (r) r.count += 1;
    });
    return ranges;
  }, []);

  /* ── Platform metrics ──────────────────────────────────────────────────── */
  const platformMetrics = useMemo(() => ({
    entities: getEntities().length,
    sectors: new Set(getEntities().map(e => e.sector)).size,
    exchanges: new Set(getEntities().map(e => e.exchange).filter(Boolean)).size,
    avgESG: Math.round(getEntities().reduce((s, e) => s + e.esg_score, 0) / getEntities().length),
    avgDMI: Math.round(getEntities().reduce((s, e) => s + e.dmi, 0) / getEntities().length * 10) / 10,
    medianDMI: (() => { const sorted = [...getEntities()].sort((a, b) => a.dmi - b.dmi); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid].dmi : Math.round((sorted[mid - 1].dmi + sorted[mid].dmi) / 2 * 10) / 10; })(),
    pctAboveBenchmark: Math.round(getEntities().filter(e => e.dmi > 50).length / getEntities().length * 100),
    pctParisAligned: Math.round(getEntities().filter(e => e.implied_temp <= 2).length / getEntities().length * 100),
  }), []);

  /* ── Portfolio quick stats ─────────────────────────────────────────────── */
  const quickStats = useMemo(() => {
    const sectors = new Set(getEntities().map(e => e.sector).filter(Boolean));
    const exchanges = new Set(getEntities().map(e => e.exchange).filter(Boolean));
    const avgTemp = getEntities().slice(0, 50).reduce((s, e) => s + (e.implied_temp || 2), 0) / 50;
    const avgIntensity = getEntities().slice(0, 50).reduce((s, e) => s + (e.ghg_intensity || 0), 0) / 50;
    return { holdings: getEntities().length, sectors: sectors.size, exchanges: exchanges.size, waci: Math.round(avgIntensity), temp: Math.round(avgTemp * 100) / 100 };
  }, []);

  /* ── Exports ───────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const headers = ['Entity','Sector','DMI','Regime','ESG','GHGIntensity','PD','VaR','ImpliedTemp','MarketCap'];
    const rows = getEntities().slice(0, 200).map(e => [e.company_name, e.sector, e.dmi, e.regime, e.esg_score, e.ghg_intensity, e.pd_1y.toFixed(2), e.var_95.toFixed(1), e.implied_temp.toFixed(2), e.market_cap].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dme_dashboard_export.csv'; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback(() => {
    const payload = { generated: new Date().toISOString(), hero: { aum: totalAUM, dmi: portfolioDMI, critical: criticalCount, alerts: alerts.length }, risk_channels: riskChannels, regime_distribution: regimeDistribution, pillar_scores: pillarScores, top10: top10.map(e => ({ name: e.company_name, sector: e.sector, dmi: e.dmi, regime: e.regime })), quick_stats: quickStats };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dme_dashboard_export.json'; a.click(); URL.revokeObjectURL(url);
  }, [totalAUM, portfolioDMI, criticalCount, alerts, riskChannels, regimeDistribution, pillarScores, top10, quickStats]);

  const exportAlerts = useCallback(() => {
    const headers = ['ID','Entity','Tier','Pillar','Message','Timestamp'];
    const rows = alerts.map(a => [a.id, a.entity, a.tier, a.pillar, `"${a.message}"`, a.timestamp].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dme_alerts_export.csv'; a.click(); URL.revokeObjectURL(url);
  }, [alerts]);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>DME Intelligence Dashboard</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['Executive View','Real-Time Risk','8 Modules'].map(b => <Badge key={b} label={b} color="navy" />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={exportAlerts}>Export Alerts</Btn>
        </div>
      </div>

      {/* ── 4 HERO METRICS ───────────────────────────────────────────────────── */}
      <Section title="Platform Overview" badge="Key Metrics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total AUM" value={`$${fmt(totalAUM)}B`} sub={`${getEntities().length} entities`} accent={T.navy} />
          <KpiCard label="Portfolio DMI" value={fmt(portfolioDMI)} sub={portfolioDMI > 50 ? 'Above benchmark' : 'Below benchmark'} accent={portfolioDMI > 60 ? T.red : T.gold} />
          <KpiCard label="Critical Alerts" value={alerts.length} sub={`${alerts.filter(a => a.tier === 'CRITICAL').length} critical tier`} accent={T.red} />
          <KpiCard label="Critical/Extreme Entities" value={criticalCount} sub={`${(criticalCount / getEntities().length * 100).toFixed(1)}% of portfolio`} accent={criticalCount > 50 ? T.red : T.amber} />
        </div>
      </Section>

      {/* ── RISK TRAFFIC LIGHT ───────────────────────────────────────────────── */}
      <Section title="Risk Traffic Light" badge="5 channels">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {riskChannels.map(rc => {
            const signalColors = { green: { bg: '#dcfce7', dot: '#16a34a' }, amber: { bg: '#fef3c7', dot: '#d97706' }, red: { bg: '#fee2e2', dot: '#dc2626' } };
            const sc = signalColors[rc.signal];
            return (
              <div key={rc.channel} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, borderTop: `3px solid ${sc.dot}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: sc.dot, boxShadow: `0 0 6px ${sc.dot}` }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{rc.channel}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{rc.value}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>Thresholds: {rc.threshold}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 8 MODULE STATUS CARDS ────────────────────────────────────────────── */}
      <Section title="Module Status" badge="8 DME modules">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {DME_MODULES.map(mod => (
            <div key={mod.id} onClick={() => navigate(mod.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s', borderLeft: `3px solid ${T.gold}` }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{mod.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{mod.name}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2, marginBottom: 6 }}>{mod.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.sage }}>{moduleKPIs[mod.id]}</div>
              <div style={{ fontSize: 11, color: T.navyL, fontWeight: 600, marginTop: 6 }}>Explore {'\u2192'}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── REGIME DISTRIBUTION PIE ──────────────────────────────────────────── */}
      <Section title="Entity Regime Distribution" badge={`${getEntities().length} entities`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={regimeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`} labelLine style={{ fontSize: 11 }}>
                {regimeDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── PILLAR RISK SCORES BAR ───────────────────────────────────────────── */}
      <Section title="Pillar Risk Scores" badge="E / S / G / P / X avg z-scores">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pillarScores}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {pillarScores.map((p, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── TOP 10 getEntities() BY DMI ───────────────────────────────────────────── */}
      <Section title="Top 10 Entities by Risk" badge="Sortable">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{ key: 'company_name', label: 'Entity' }, { key: 'sector', label: 'Sector' }, { key: 'dmi', label: 'DMI' }, { key: 'regime', label: 'Regime' }, { key: 'esg_score', label: 'ESG' }, { key: 'pd_1y', label: 'PD(1Y)' }, { key: 'var_95', label: 'VaR(95)' }, { key: 'implied_temp', label: 'Temp' }].map(c => (
                  <th key={c.key} style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort(c.key)}>
                    {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top10.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{e.company_name}</td>
                  <td style={td}>{e.sector}</td>
                  <td style={{ ...td, fontWeight: 700, color: e.dmi > 60 ? T.red : e.dmi > 35 ? T.amber : T.sage }}>{fmt(e.dmi)}</td>
                  <td style={td}><Badge label={e.regime} color={e.regime === 'Normal' ? 'green' : e.regime === 'Elevated' ? 'amber' : 'red'} /></td>
                  <td style={td}>{e.esg_score}</td>
                  <td style={td}>{e.pd_1y.toFixed(2)}%</td>
                  <td style={td}>{e.var_95.toFixed(1)}%</td>
                  <td style={td}>{e.implied_temp.toFixed(2)}{'\u00b0C'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── ACTIVE ALERTS FEED ───────────────────────────────────────────────── */}
      <Section title="Active Alerts Feed" badge={`${alerts.length} alerts`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          {alerts.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <Badge label={a.tier} color={a.tier === 'CRITICAL' ? 'red' : a.tier === 'HIGH' ? 'amber' : 'blue'} />
              <Badge label={a.pillar} color="navy" />
              <span style={{ flex: 1, fontSize: 12, color: T.text }}><strong>{a.entity}</strong>: {a.message}</span>
              <span style={{ fontSize: 10, color: T.textMut, whiteSpace: 'nowrap' }}>{new Date(a.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── NGFS SCENARIO SUMMARY ────────────────────────────────────────────── */}
      <Section title="NGFS Scenario Summary" badge="6 climate pathways">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {NGFS_SCENARIOS.map(sc => (
            <div key={sc.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${sc.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{sc.name}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>{sc.category}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: sc.color, marginTop: 4 }}>{sc.temp}{'\u00b0C'}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── REGULATORY DEADLINE TIMELINE ──────────────────────────────────────── */}
      <Section title="Regulatory Deadline Timeline" badge="Next 5 deadlines">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          {REGULATORY_DEADLINES.map((rd, i) => {
            const daysUntil = Math.ceil((new Date(rd.date) - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < REGULATORY_DEADLINES.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ width: 80, fontSize: 12, fontWeight: 600, color: T.navy }}>{rd.date}</div>
                <Badge label={rd.status} color={rd.severity} />
                <div style={{ flex: 1, fontSize: 12, color: T.text }}>{rd.regulation}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: daysUntil < 100 ? T.red : T.textSec }}>{daysUntil}d remaining</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── PLATFORM METRICS ─────────────────────────────────────────────────── */}
      <Section title="Platform Metrics" badge="Aggregate intelligence">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          <KpiCard label="Avg ESG Score" value={platformMetrics.avgESG} sub={`${getEntities().length} entities`} />
          <KpiCard label="Avg DMI" value={fmt(platformMetrics.avgDMI)} sub={`Median: ${fmt(platformMetrics.medianDMI)}`} />
          <KpiCard label="Above Benchmark" value={`${platformMetrics.pctAboveBenchmark}%`} sub="DMI > 50" accent={platformMetrics.pctAboveBenchmark > 50 ? T.red : T.sage} />
          <KpiCard label="Paris-Aligned" value={`${platformMetrics.pctParisAligned}%`} sub="Implied temp \u2264 2\u00b0C" accent={platformMetrics.pctParisAligned > 50 ? T.sage : T.red} />
        </div>
      </Section>

      {/* ── ESG DISTRIBUTION ─────────────────────────────────────────────────── */}
      <Section title="ESG Score Distribution" badge="Entity histogram">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={esgDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.navyL} radius={[6, 6, 0, 0]} name="Entities" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── TEMPERATURE DISTRIBUTION ─────────────────────────────────────────── */}
      <Section title="Implied Temperature Distribution" badge="Paris alignment">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tempDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {tempDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 10 }}>
            {tempDistribution.map(td => (
              <div key={td.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: td.fill }}>{td.count}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{td.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PORTFOLIO QUICK STATS ────────────────────────────────────────────── */}
      <Section title="Portfolio Quick Stats" badge="Aggregate view">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <KpiCard label="Total Holdings" value={fmt(quickStats.holdings)} />
          <KpiCard label="Sectors" value={quickStats.sectors} />
          <KpiCard label="Exchanges" value={quickStats.exchanges} />
          <KpiCard label="WACI" value={`${fmt(quickStats.waci)} tCO2e/$M`} />
          <KpiCard label="Implied Temperature" value={`${quickStats.temp}\u00b0C`} accent={quickStats.temp > 2 ? T.red : T.sage} />
        </div>
      </Section>

      {/* ── EXCHANGE COVERAGE ────────────────────────────────────────────────── */}
      <Section title="Exchange Coverage" badge={`${quickStats.exchanges} exchanges`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {(() => {
              const exMap = {};
              getEntities().forEach(e => { const ex = e.exchange || 'Other'; exMap[ex] = (exMap[ex] || 0) + 1; });
              return Object.entries(exMap).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([ex, count], i) => (
                <div key={ex} style={{ padding: 10, borderRadius: 8, background: T.surfaceH, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{ex}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS[i % COLORS.length], marginTop: 2 }}>{count}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{Math.round(count / getEntities().length * 100)}% coverage</div>
                </div>
              ));
            })()}
          </div>
        </div>
      </Section>

      {/* ── REGIME TRANSITION MATRIX ─────────────────────────────────────────── */}
      <Section title="Regime Severity Distribution" badge="By sector">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Sector</th>
                {['Normal','Elevated','Critical','Extreme'].map(r => <th key={r} style={{ ...th, textAlign: 'center' }}>{r}</th>)}
                <th style={{ ...th, textAlign: 'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const matrix = {};
                getEntities().forEach(e => {
                  if (!matrix[e.sector]) matrix[e.sector] = { Normal: 0, Elevated: 0, Critical: 0, Extreme: 0, total: 0 };
                  matrix[e.sector][e.regime] = (matrix[e.sector][e.regime] || 0) + 1;
                  matrix[e.sector].total += 1;
                });
                return Object.entries(matrix).sort((a, b) => (b[1].Critical + b[1].Extreme) - (a[1].Critical + a[1].Extreme)).slice(0, 10).map(([sector, data], i) => (
                  <tr key={sector} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...td, fontWeight: 600 }}>{sector}</td>
                    <td style={{ ...td, textAlign: 'center', color: T.sage }}>{data.Normal}</td>
                    <td style={{ ...td, textAlign: 'center', color: T.amber }}>{data.Elevated}</td>
                    <td style={{ ...td, textAlign: 'center', color: T.red, fontWeight: data.Critical > 0 ? 700 : 400 }}>{data.Critical}</td>
                    <td style={{ ...td, textAlign: 'center', color: '#7c2d12', fontWeight: data.Extreme > 0 ? 700 : 400 }}>{data.Extreme}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{data.total}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── KEY RISK INDICATORS ──────────────────────────────────────────────── */}
      <Section title="Key Risk Indicators" badge="Threshold monitoring">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { kri: 'Entities with PD > 5%', value: getEntities().filter(e => e.pd_1y > 5).length, threshold: '< 20', breached: getEntities().filter(e => e.pd_1y > 5).length > 20 },
            { kri: 'Entities with VaR > 15%', value: getEntities().filter(e => e.var_95 > 15).length, threshold: '< 30', breached: getEntities().filter(e => e.var_95 > 15).length > 30 },
            { kri: 'Extreme Regime Count', value: getEntities().filter(e => e.regime === 'Extreme').length, threshold: '< 10', breached: getEntities().filter(e => e.regime === 'Extreme').length > 10 },
            { kri: 'Avg Implied Temp > 2.5\u00b0C', value: `${Math.round(getEntities().filter(e => e.implied_temp > 2.5).length / getEntities().length * 100)}%`, threshold: '< 25%', breached: getEntities().filter(e => e.implied_temp > 2.5).length / getEntities().length > 0.25 },
            { kri: 'Low ESG (< 30) Count', value: getEntities().filter(e => e.esg_score < 30).length, threshold: '< 15', breached: getEntities().filter(e => e.esg_score < 30).length > 15 },
            { kri: 'High GHG Intensity (>500)', value: getEntities().filter(e => e.ghg_intensity > 500).length, threshold: '< 25', breached: getEntities().filter(e => e.ghg_intensity > 500).length > 25 },
          ].map(kri => (
            <div key={kri.kri} style={{ background: T.surface, border: `1px solid ${kri.breached ? T.red : T.border}`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${kri.breached ? T.red : T.sage}` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{kri.kri}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: kri.breached ? T.red : T.sage }}>{kri.value}</span>
                <span style={{ fontSize: 11, color: T.textMut }}>Threshold: {kri.threshold}</span>
              </div>
              {kri.breached && <Badge label="BREACHED" color="red" />}
              {!kri.breached && <Badge label="OK" color="green" />}
            </div>
          ))}
        </div>
      </Section>

      {/* ── DMI TREND AREA CHART ─────────────────────────────────────────────── */}
      <Section title="Portfolio DMI Trend" badge="12-month simulated">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dmiTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={['auto', 'auto']} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={50} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'Benchmark', position: 'right', fontSize: 10 }} />
              <Area type="monotone" dataKey="dmi" stroke={T.navy} fill={T.navyL} fillOpacity={0.15} strokeWidth={2} name="Portfolio DMI" />
              <Area type="monotone" dataKey="benchmark" stroke={T.gold} fill="none" strokeWidth={1} strokeDasharray="4 4" name="Benchmark" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── SECTOR BREAKDOWN ─────────────────────────────────────────────────── */}
      <Section title="Sector Risk Breakdown" badge={`${sectorBreakdown.length} sectors`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Sector','Entities','Avg DMI','Avg ESG','Critical%','Total Mkt Cap ($M)'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sectorBreakdown.slice(0, 12).map((sb, i) => (
                <tr key={i} style={{ background: sb.critPct > 30 ? '#fef2f2' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{sb.sector}</td>
                  <td style={td}>{sb.count}</td>
                  <td style={{ ...td, fontWeight: 700, color: sb.avgDMI > 60 ? T.red : sb.avgDMI > 35 ? T.amber : T.sage }}>{fmt(sb.avgDMI)}</td>
                  <td style={td}>{sb.avgESG}</td>
                  <td style={td}><Badge label={`${sb.critPct}%`} color={sb.critPct > 25 ? 'red' : sb.critPct > 10 ? 'amber' : 'green'} /></td>
                  <td style={td}>${fmt(sb.totalCap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── DATA COVERAGE ────────────────────────────────────────────────────── */}
      <Section title="Data Coverage" badge="Quality metrics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {coverageStats.map(cs => (
            <div key={cs.metric} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>{cs.metric}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: cs.pct > 80 ? T.sage : cs.pct > 50 ? T.amber : T.red }}>{cs.pct}%</span>
                <span style={{ fontSize: 11, color: T.textMut }}>{cs.covered}/{cs.total}</span>
              </div>
              <div style={{ marginTop: 6, background: T.surfaceH, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${cs.pct}%`, height: '100%', background: cs.pct > 80 ? T.sage : cs.pct > 50 ? T.amber : T.red, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TOP MOVERS ────────────────────────────────────────────────────── */}
      <Section title="Top Movers (30-day)" badge="Largest DMI changes">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 10 }}>Largest DMI Increases (Deteriorating)</div>
            {getEntities().slice(0, 5).map((e, i) => {
              const change = Math.round((5 + sRand(seed(e.company_name + 'mov')) * 15) * 10) / 10;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{e.company_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>+{change}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 10 }}>Largest DMI Decreases (Improving)</div>
            {getEntities().slice(5, 10).map((e, i) => {
              const change = Math.round((3 + sRand(seed(e.company_name + 'imp')) * 12) * 10) / 10;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{e.company_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.sage }}>-{change}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── SYSTEM HEALTH ────────────────────────────────────────────────────── */}
      <Section title="System Health" badge="Platform status">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Module','Status','Latency','Last Sync','Uptime'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {systemHealth.map((sh, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{sh.module}</td>
                  <td style={td}><Badge label={sh.status} color="green" /></td>
                  <td style={td}>{sh.latency}</td>
                  <td style={td}>{sh.lastSync}</td>
                  <td style={{ ...td, fontWeight: 600, color: T.sage }}>{sh.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── RISK APPETITE STATEMENT ───────────────────────────────────────── */}
      <Section title="Risk Appetite Framework" badge="Governance">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { metric: 'Portfolio DMI', current: portfolioDMI, limit: 60, unit: '', desc: 'Maximum weighted average DMI across all holdings' },
              { metric: 'Critical/Extreme Weight', current: Math.round(getEntities().filter(e => e.regime === 'Critical' || e.regime === 'Extreme').length / getEntities().length * 100), limit: 25, unit: '%', desc: 'Maximum portfolio weight in distressed regimes' },
              { metric: 'WACI', current: quickStats.waci, limit: 500, unit: ' tCO2e/$M', desc: 'Maximum weighted average carbon intensity' },
              { metric: 'Implied Temperature', current: quickStats.temp, limit: 2.5, unit: '\u00b0C', desc: 'Maximum portfolio implied temperature rise' },
              { metric: 'Single Name Concentration', current: (() => { const maxCap = Math.max(...getEntities().slice(0, 50).map(e => e.market_cap)); return Math.round(maxCap / getEntities().slice(0, 50).reduce((s, e) => s + e.market_cap, 0) * 100); })(), limit: 10, unit: '%', desc: 'Maximum weight in any single entity' },
              { metric: 'Average PD', current: Math.round(getEntities().slice(0, 50).reduce((s, e) => s + e.pd_1y, 0) / 50 * 100) / 100, limit: 5, unit: '%', desc: 'Maximum average 1-year probability of default' },
            ].map(ra => {
              const utilization = ra.current / ra.limit * 100;
              const breached = utilization > 100;
              const warning = utilization > 80;
              return (
                <div key={ra.metric} style={{ padding: 12, borderRadius: 8, border: `1px solid ${breached ? T.red : warning ? T.amber : T.border}`, background: breached ? '#fef2f2' : T.surface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{ra.metric}</span>
                    {breached ? <Badge label="BREACH" color="red" /> : warning ? <Badge label="WARNING" color="amber" /> : <Badge label="OK" color="green" />}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{ra.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: breached ? T.red : T.navy }}>{ra.current}{ra.unit}</span>
                    <span style={{ fontSize: 11, color: T.textMut }}>/ {ra.limit}{ra.unit} limit</span>
                  </div>
                  <div style={{ marginTop: 6, background: T.surfaceH, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(utilization, 100)}%`, height: '100%', background: breached ? T.red : warning ? T.amber : T.sage, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{Math.round(utilization)}% utilization</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── RECENT ACTIVITY LOG ──────────────────────────────────────────────── */}
      <Section title="Recent Activity Log" badge="Last 24h">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          {[
            { time: '14:32', action: 'Portfolio rebalancing completed', module: 'Portfolio Analytics', severity: 'blue' },
            { time: '13:15', action: 'NGFS scenario run (Net Zero 2050) finished', module: 'Scenarios', severity: 'green' },
            { time: '12:48', action: '3 new critical regime alerts generated', module: 'Alert Center', severity: 'red' },
            { time: '11:22', action: 'Entity deep-dive report exported for 5 entities', module: 'Entity Analysis', severity: 'blue' },
            { time: '10:05', action: 'PCAF financed emissions recalculated', module: 'Portfolio Analytics', severity: 'green' },
            { time: '09:30', action: 'Competitive benchmarking updated for Energy sector', module: 'Competitive Intel', severity: 'blue' },
            { time: '08:45', action: 'Data ingestion: 42 new entity records processed', module: 'Data Pipeline', severity: 'green' },
            { time: '08:00', action: 'Scheduled risk computation batch completed', module: 'Risk Engine', severity: 'green' },
          ].map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMut, width: 50, fontVariantNumeric: 'tabular-nums' }}>{log.time}</span>
              <Badge label={log.module} color={log.severity} />
              <span style={{ flex: 1, fontSize: 12, color: T.text }}>{log.action}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────────── */}
      <Section title="Quick Actions" badge="Navigate to modules">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'DME Risk Engine', path: '/dme-risk' },
            { label: 'Entity Deep-Dive', path: '/dme-entity' },
            { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
            { label: 'Alert Center', path: '/dme-alerts' },
            { label: 'Contagion Network', path: '/dme-contagion' },
            { label: 'Portfolio Analytics', path: '/dme-portfolio' },
            { label: 'Competitive Intel', path: '/dme-competitive' },
            { label: 'SFDR PAI', path: '/sfdr-pai' },
            { label: 'Regulatory Gap', path: '/regulatory-gap' },
            { label: 'Double Materiality', path: '/double-materiality' },
            { label: 'Portfolio Suite', path: '/portfolio-climate-var' },
            { label: 'Stranded Assets', path: '/stranded-assets' },
          ].map(n => <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>)}
        </div>
      </Section>
    </div>
  );
}
