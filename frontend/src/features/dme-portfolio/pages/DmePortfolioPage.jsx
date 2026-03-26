import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
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
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 10 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.surface, color: T.text, fontFamily: T.font }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

/* ═══════════════════════════════════════════════════════════════════════════
   PORTFOLIO AGGREGATION FUNCTIONS (ported from dme-platform)
   ═══════════════════════════════════════════════════════════════════════════ */
function portfolioWeightedDMI(holdings) {
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100;
  return holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.dmi || 50), 0);
}
function portfolioHHI(holdings) {
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100;
  return holdings.reduce((s, h) => s + Math.pow((h.weight / totalWeight) * 100, 2), 0);
}
function portfolioRegime(holdings) {
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100;
  const regimeScores = { Normal: 1, Elevated: 2, Critical: 3, Extreme: 4 };
  const weighted = holdings.reduce((s, h) => s + (h.weight / totalWeight) * (regimeScores[h.regime] || 1), 0);
  if (weighted >= 3.5) return 'Extreme';
  if (weighted >= 2.5) return 'Critical';
  if (weighted >= 1.5) return 'Elevated';
  return 'Normal';
}
function marginalContribution(holdingDMI, portfolioDMI, holdingWeight, benchmarkWeight, benchmarkDMI) {
  const selection = (holdingDMI - benchmarkDMI) * holdingWeight;
  const allocation = (holdingWeight - benchmarkWeight) * (benchmarkDMI - portfolioDMI);
  const interaction = (holdingWeight - benchmarkWeight) * (holdingDMI - benchmarkDMI);
  return { selection, allocation, interaction, total: selection + allocation + interaction };
}
function attributionFactor(outstandingAmount, evic) { return evic > 0 ? outstandingAmount / evic : 0; }
function financedEmissions(af, scope1, scope2, scope3) { return af * (scope1 + scope2 + (scope3 || 0)); }

/* ── NGFS Scenarios ───────────────────────────────────────────────────────── */
const NGFS_SCENARIOS = [
  { id: 'nz2050', name: 'Net Zero 2050', temp: 1.5, category: 'Orderly', color: '#16a34a' },
  { id: 'below2', name: 'Below 2\u00b0C', temp: 1.7, category: 'Orderly', color: '#22c55e' },
  { id: 'diverg', name: 'Divergent Net Zero', temp: 1.5, category: 'Disorderly', color: '#d97706' },
  { id: 'delay', name: 'Delayed Transition', temp: 1.8, category: 'Disorderly', color: '#f59e0b' },
  { id: 'ndcs', name: 'NDCs', temp: 2.5, category: 'Hot house', color: '#dc2626' },
  { id: 'curpol', name: 'Current Policies', temp: 3.0, category: 'Hot house', color: '#991b1b' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ENRICH HOLDINGS FROM GLOBAL_COMPANY_MASTER
   ═══════════════════════════════════════════════════════════════════════════ */
function enrichHoldings(rawHoldings) {
  const lookup = {};
  GLOBAL_COMPANY_MASTER.forEach(c => { lookup[c.company_name] = c; if (c.ticker) lookup[c.ticker] = c; });
  return rawHoldings.map((h, i) => {
    const master = lookup[h.name] || lookup[h.ticker] || GLOBAL_COMPANY_MASTER[i % GLOBAL_COMPANY_MASTER.length] || {};
    const s = seed(h.name || i);
    const dmi = master.dmi_score || clamp(40 + sRand(s) * 50, 10, 98);
    const regime = dmi > 80 ? 'Extreme' : dmi > 60 ? 'Critical' : dmi > 35 ? 'Elevated' : 'Normal';
    const velocity = (sRand(s + 1) - 0.5) * 20;
    const classification = velocity > 3 ? 'DECLINER' : velocity < -3 ? 'IMPROVER' : 'STABLE';
    const scope1 = master.ghg_scope1_tco2e || Math.round(5000 + sRand(s + 2) * 500000);
    const scope2 = master.ghg_scope2_tco2e || Math.round(2000 + sRand(s + 3) * 200000);
    const scope3 = master.ghg_scope3_tco2e || Math.round(10000 + sRand(s + 4) * 2000000);
    const evic = master.market_cap_usd_mn ? master.market_cap_usd_mn * 1e6 : (50 + sRand(s + 5) * 5000) * 1e6;
    const weight = h.weight || parseFloat(h.allocation) || (100 / Math.max(rawHoldings.length, 1));
    const outstandingAmt = evic * weight / 100;
    const af = attributionFactor(outstandingAmt, evic);
    const finEm = financedEmissions(af, scope1, scope2, scope3);
    return {
      ...h,
      name: h.name || master.company_name || `Holding ${i + 1}`,
      sector: h.sector || master.sector || 'Industrials',
      weight,
      dmi: Math.round(dmi * 10) / 10,
      regime,
      velocity: Math.round(velocity * 10) / 10,
      classification,
      esg_score: master.esg_score || Math.round(30 + sRand(s + 6) * 60),
      scope1, scope2, scope3,
      evic,
      af: Math.round(af * 10000) / 10000,
      financed_emissions: Math.round(finEm),
      ghg_intensity: master.ghg_intensity_tco2e_per_mn || Math.round(scope1 / (evic / 1e6)),
      temperature: master.implied_temp_rise || clamp(1.2 + sRand(s + 7) * 2.5, 1.2, 4.5),
      transition_risk_score: master.transition_risk_score || Math.round(20 + sRand(s + 8) * 60),
      taxonomy_alignment: Math.round(sRand(s + 9) * 80),
    };
  });
}

function buildDefaultPortfolio() {
  const sample = GLOBAL_COMPANY_MASTER.slice(0, 25);
  const w = 100 / sample.length;
  return sample.map(c => ({
    name: c.company_name,
    ticker: c.ticker,
    sector: c.sector,
    weight: Math.round(w * 100) / 100,
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DmePortfolioPage() {
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState('weight');
  const [sortDir, setSortDir] = useState('desc');
  const [activeScenario, setActiveScenario] = useState('nz2050');

  /* ── Load portfolios from localStorage ─────────────────────────────────── */
  const { portfolioNames, activePortfolio, allPortfolios } = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_PORT);
      if (!raw) return { portfolioNames: ['Default Portfolio'], activePortfolio: 'Default Portfolio', allPortfolios: {} };
      const outer = JSON.parse(raw);
      if (outer && typeof outer === 'object' && outer.portfolios) {
        const names = Object.keys(outer.portfolios);
        return { portfolioNames: names.length ? names : ['Default Portfolio'], activePortfolio: outer.activePortfolio || names[0] || 'Default Portfolio', allPortfolios: outer.portfolios };
      }
      return { portfolioNames: ['Default Portfolio'], activePortfolio: 'Default Portfolio', allPortfolios: {} };
    } catch { return { portfolioNames: ['Default Portfolio'], activePortfolio: 'Default Portfolio', allPortfolios: {} }; }
  }, []);

  const [selectedPortfolio, setSelectedPortfolio] = useState(activePortfolio);

  const holdings = useMemo(() => {
    const raw = allPortfolios[selectedPortfolio]?.holdings || [];
    if (raw.length === 0) return enrichHoldings(buildDefaultPortfolio());
    return enrichHoldings(raw);
  }, [selectedPortfolio, allPortfolios]);

  /* ── Portfolio-level aggregations ──────────────────────────────────────── */
  const portDMI = useMemo(() => Math.round(portfolioWeightedDMI(holdings) * 10) / 10, [holdings]);
  const portHHI = useMemo(() => Math.round(portfolioHHI(holdings)), [holdings]);
  const portRegime = useMemo(() => portfolioRegime(holdings), [holdings]);
  const totalWeight = useMemo(() => holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100, [holdings]);

  const waci = useMemo(() => {
    return Math.round(holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.ghg_intensity || 0), 0));
  }, [holdings, totalWeight]);

  const impliedTemp = useMemo(() => {
    const t = holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.temperature || 2.0), 0);
    return Math.round(t * 100) / 100;
  }, [holdings, totalWeight]);

  const portfolioVaR = useMemo(() => {
    const baseVaR = portDMI * 0.15 + portHHI * 0.002;
    return Math.round(baseVaR * 100) / 100;
  }, [portDMI, portHHI]);

  const expectedLoss = useMemo(() => {
    return Math.round(portfolioVaR * 0.4 * 100) / 100;
  }, [portfolioVaR]);

  /* ── Sector allocation ─────────────────────────────────────────────────── */
  const sectorAllocation = useMemo(() => {
    const map = {};
    holdings.forEach(h => { map[h.sector] = (map[h.sector] || 0) + h.weight; });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  /* ── Regime distribution ───────────────────────────────────────────────── */
  const regimeDistribution = useMemo(() => {
    const map = { Normal: 0, Elevated: 0, Critical: 0, Extreme: 0 };
    holdings.forEach(h => { map[h.regime] = (map[h.regime] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count, fill: REGIME_COLORS[name] }));
  }, [holdings]);

  /* ── Classification counts ─────────────────────────────────────────────── */
  const classificationCounts = useMemo(() => {
    const map = { IMPROVER: 0, STABLE: 0, DECLINER: 0 };
    holdings.forEach(h => { map[h.classification] = (map[h.classification] || 0) + 1; });
    return map;
  }, [holdings]);

  /* ── Sorted holdings ───────────────────────────────────────────────────── */
  const sortedHoldings = useMemo(() => {
    const arr = [...holdings];
    arr.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [holdings, sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Scenario results ──────────────────────────────────────────────────── */
  const scenarioResults = useMemo(() => {
    return NGFS_SCENARIOS.map(sc => {
      const s = seed(sc.id);
      const dmiShift = sc.temp < 2 ? -5 + sRand(s) * 3 : 5 + sRand(s + 1) * 15;
      const varShift = sc.temp < 2 ? -2 + sRand(s + 2) * 2 : 3 + sRand(s + 3) * 10;
      return { ...sc, portfolio_dmi: Math.round((portDMI + dmiShift) * 10) / 10, portfolio_var: Math.round((portfolioVaR + varShift) * 100) / 100, waci_change: Math.round((sc.temp < 2 ? -15 : 10) + sRand(s + 4) * 20), temp_aligned: impliedTemp <= sc.temp };
    });
  }, [portDMI, portfolioVaR, impliedTemp]);

  /* ── Taxonomy alignment ────────────────────────────────────────────────── */
  const avgTaxonomy = useMemo(() => {
    const sum = holdings.reduce((s, h) => s + (h.taxonomy_alignment || 0), 0);
    return Math.round(sum / holdings.length);
  }, [holdings]);

  /* ── Marginal risk contribution ────────────────────────────────────────── */
  const marginalContributions = useMemo(() => {
    const benchDMI = 50;
    const equalWeight = 100 / holdings.length;
    return holdings.map(h => {
      const mc = marginalContribution(h.dmi, portDMI, h.weight / 100, equalWeight / 100, benchDMI);
      return { name: h.name, sector: h.sector, weight: h.weight, dmi: h.dmi, selection: Math.round(mc.selection * 100) / 100, allocation: Math.round(mc.allocation * 100) / 100, interaction: Math.round(mc.interaction * 100) / 100, total: Math.round(mc.total * 100) / 100 };
    }).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [holdings, portDMI]);

  /* ── PCAF Financed Emissions ───────────────────────────────────────────── */
  const pcafData = useMemo(() => {
    const totalFinanced = holdings.reduce((s, h) => s + (h.financed_emissions || 0), 0);
    return holdings.map(h => ({
      name: h.name, sector: h.sector, af: h.af, financed_s1s2: Math.round(h.af * (h.scope1 + h.scope2)),
      financed_total: h.financed_emissions, pct_of_total: totalFinanced > 0 ? Math.round(h.financed_emissions / totalFinanced * 1000) / 10 : 0,
      intensity: h.ghg_intensity,
    })).sort((a, b) => b.financed_total - a.financed_total);
  }, [holdings]);

  const totalFinancedEmissions = useMemo(() => pcafData.reduce((s, p) => s + p.financed_total, 0), [pcafData]);

  /* ── SFDR Classification ───────────────────────────────────────────────── */
  const sfdrClassification = useMemo(() => {
    const avgESG = holdings.reduce((s, h) => s + (h.esg_score || 0), 0) / holdings.length;
    const pctImprover = classificationCounts.IMPROVER / holdings.length * 100;
    if (avgTaxonomy > 70 && avgESG > 70) return { article: 'Article 9', label: 'Dark Green', color: 'green', desc: 'Sustainable investment objective' };
    if (avgTaxonomy > 40 && avgESG > 55) return { article: 'Article 8+', label: 'Light Green+', color: 'sage', desc: 'E/S characteristics with sustainable investments' };
    if (pctImprover > 30 || avgESG > 45) return { article: 'Article 8', label: 'Light Green', color: 'blue', desc: 'Promotes E/S characteristics' };
    return { article: 'Article 6', label: 'Standard', color: 'gray', desc: 'No sustainability claim' };
  }, [holdings, avgTaxonomy, classificationCounts]);

  /* ── DMI Trend (simulated 12-month) ────────────────────────────────────── */
  const dmiTrend = useMemo(() => {
    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    return months.map((m, i) => {
      const drift = (i - 6) * 0.3 + sRand(seed(m)) * 4;
      return { month: m, dmi: Math.round((portDMI + drift) * 10) / 10, benchmark: 50 };
    });
  }, [portDMI]);

  /* ── Sector risk heatmap data ──────────────────────────────────────────── */
  const sectorRiskHeatmap = useMemo(() => {
    const map = {};
    holdings.forEach(h => {
      if (!map[h.sector]) map[h.sector] = { sector: h.sector, count: 0, totalDMI: 0, totalWeight: 0, maxDMI: 0, critical: 0, scope1Sum: 0, scope2Sum: 0, avgTemp: 0 };
      const m = map[h.sector];
      m.count += 1;
      m.totalDMI += h.dmi;
      m.totalWeight += h.weight;
      m.maxDMI = Math.max(m.maxDMI, h.dmi);
      if (h.regime === 'Critical' || h.regime === 'Extreme') m.critical += 1;
      m.scope1Sum += h.scope1 || 0;
      m.scope2Sum += h.scope2 || 0;
      m.avgTemp += h.temperature || 0;
    });
    return Object.values(map).map(m => ({
      ...m,
      avgDMI: Math.round(m.totalDMI / m.count * 10) / 10,
      avgTemp: Math.round(m.avgTemp / m.count * 100) / 100,
      totalWeight: Math.round(m.totalWeight * 100) / 100,
      criticalPct: Math.round(m.critical / m.count * 100),
      totalEmissions: m.scope1Sum + m.scope2Sum,
    })).sort((a, b) => b.avgDMI - a.avgDMI);
  }, [holdings]);

  /* ── Concentration risk analysis ───────────────────────────────────────── */
  const concentrationAnalysis = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => b.weight - a.weight);
    const top5Weight = sorted.slice(0, 5).reduce((s, h) => s + h.weight, 0);
    const top10Weight = sorted.slice(0, 10).reduce((s, h) => s + h.weight, 0);
    const sectorConc = {};
    holdings.forEach(h => { sectorConc[h.sector] = (sectorConc[h.sector] || 0) + h.weight; });
    const maxSectorWeight = Math.max(...Object.values(sectorConc));
    const maxSectorName = Object.entries(sectorConc).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
    const regimeConc = {};
    holdings.forEach(h => { regimeConc[h.regime] = (regimeConc[h.regime] || 0) + h.weight; });
    const criticalWeight = (regimeConc.Critical || 0) + (regimeConc.Extreme || 0);
    return {
      hhi: portHHI,
      hhiLabel: portHHI > 2500 ? 'Highly Concentrated' : portHHI > 1500 ? 'Moderate' : 'Diversified',
      top5Weight: Math.round(top5Weight * 10) / 10,
      top10Weight: Math.round(top10Weight * 10) / 10,
      maxSectorWeight: Math.round(maxSectorWeight * 10) / 10,
      maxSectorName,
      criticalWeight: Math.round(criticalWeight * 10) / 10,
      singleNameLimit: sorted[0]?.weight > 10,
      topHolding: sorted[0]?.name || '---',
      topHoldingWeight: sorted[0]?.weight || 0,
    };
  }, [holdings, portHHI]);

  /* ── Temperature pathway analysis ──────────────────────────────────────── */
  const temperaturePathway = useMemo(() => {
    const ranges = [
      { label: '< 1.5\u00b0C', min: 0, max: 1.5, color: T.sage, count: 0, weight: 0 },
      { label: '1.5-2.0\u00b0C', min: 1.5, max: 2.0, color: T.green, count: 0, weight: 0 },
      { label: '2.0-2.5\u00b0C', min: 2.0, max: 2.5, color: T.amber, count: 0, weight: 0 },
      { label: '2.5-3.0\u00b0C', min: 2.5, max: 3.0, color: '#f97316', count: 0, weight: 0 },
      { label: '> 3.0\u00b0C', min: 3.0, max: 99, color: T.red, count: 0, weight: 0 },
    ];
    holdings.forEach(h => {
      const r = ranges.find(r => h.temperature >= r.min && h.temperature < r.max);
      if (r) { r.count += 1; r.weight += h.weight; }
    });
    return ranges.map(r => ({ ...r, weight: Math.round(r.weight * 10) / 10 }));
  }, [holdings]);

  /* ── Emissions attribution by scope ────────────────────────────────────── */
  const emissionsByScope = useMemo(() => {
    const totalS1 = holdings.reduce((s, h) => s + (h.scope1 || 0), 0);
    const totalS2 = holdings.reduce((s, h) => s + (h.scope2 || 0), 0);
    const totalS3 = holdings.reduce((s, h) => s + (h.scope3 || 0), 0);
    const total = totalS1 + totalS2 + totalS3;
    return [
      { scope: 'Scope 1', value: totalS1, pct: total > 0 ? Math.round(totalS1 / total * 1000) / 10 : 0, fill: T.navy },
      { scope: 'Scope 2', value: totalS2, pct: total > 0 ? Math.round(totalS2 / total * 1000) / 10 : 0, fill: T.gold },
      { scope: 'Scope 3', value: totalS3, pct: total > 0 ? Math.round(totalS3 / total * 1000) / 10 : 0, fill: T.sage },
    ];
  }, [holdings]);

  /* ── ESG score distribution ────────────────────────────────────────────── */
  const esgDistribution = useMemo(() => {
    const buckets = [
      { label: '0-20', min: 0, max: 20, count: 0 },
      { label: '21-40', min: 21, max: 40, count: 0 },
      { label: '41-60', min: 41, max: 60, count: 0 },
      { label: '61-80', min: 61, max: 80, count: 0 },
      { label: '81-100', min: 81, max: 100, count: 0 },
    ];
    holdings.forEach(h => {
      const b = buckets.find(b => h.esg_score >= b.min && h.esg_score <= b.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [holdings]);

  /* ── Risk-return scatter data ──────────────────────────────────────────── */
  const riskReturnData = useMemo(() => {
    return holdings.map(h => ({
      name: h.name,
      x: h.dmi,
      y: 100 - h.transition_risk_score,
      sector: h.sector,
      weight: h.weight,
    }));
  }, [holdings]);

  /* ── Exports ───────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const headers = ['Entity','Sector','Weight%','DMI','Regime','Classification','Scope1','Scope2','Scope3','AF','FinancedEmissions','GHGIntensity','Temperature','TaxonomyAlignment'];
    const rows = holdings.map(h => [h.name, h.sector, h.weight, h.dmi, h.regime, h.classification, h.scope1, h.scope2, h.scope3, h.af, h.financed_emissions, h.ghg_intensity, h.temperature, h.taxonomy_alignment].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dme_portfolio_${selectedPortfolio}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [holdings, selectedPortfolio]);

  const exportJSON = useCallback(() => {
    const payload = { portfolio: selectedPortfolio, generated: new Date().toISOString(), aggregates: { dmi: portDMI, hhi: portHHI, regime: portRegime, waci, implied_temp: impliedTemp, var: portfolioVaR, expected_loss: expectedLoss, sfdr: sfdrClassification.article, taxonomy_pct: avgTaxonomy, total_financed_emissions: totalFinancedEmissions }, holdings, scenarios: scenarioResults, marginal_contributions: marginalContributions.slice(0, 10) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dme_portfolio_${selectedPortfolio}.json`; a.click(); URL.revokeObjectURL(url);
  }, [holdings, selectedPortfolio, portDMI, portHHI, portRegime, waci, impliedTemp, portfolioVaR, expectedLoss, sfdrClassification, avgTaxonomy, totalFinancedEmissions, scenarioResults, marginalContributions]);

  const exportPCAF = useCallback(() => {
    const headers = ['Entity','Sector','AttributionFactor','FinancedS1S2','FinancedTotal','PctOfTotal','GHGIntensity'];
    const rows = pcafData.map(p => [p.name, p.sector, p.af, p.financed_s1s2, p.financed_total, p.pct_of_total, p.intensity].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dme_pcaf_${selectedPortfolio}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [pcafData, selectedPortfolio]);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>DME Portfolio Analytics</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['DMI','HHI','Regime','PCAF','Attribution'].map(b => <Badge key={b} label={b} color="navy" />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={exportPCAF}>Export PCAF</Btn>
        </div>
      </div>

      {/* ── PORTFOLIO SELECTOR ───────────────────────────────────────────────── */}
      <Section title="Portfolio Selector" badge={`${portfolioNames.length} portfolios`}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'end' }}>
          <Sel label="Active Portfolio" value={selectedPortfolio} onChange={setSelectedPortfolio} options={portfolioNames.map(n => ({ value: n, label: n }))} />
          <div style={{ fontSize: 12, color: T.textSec }}>{holdings.length} holdings | SFDR: <Badge label={sfdrClassification.article} color={sfdrClassification.color} /></div>
        </div>
      </Section>

      {/* ── 6 KPI CARDS ──────────────────────────────────────────────────────── */}
      <Section title="Portfolio Risk Summary" badge="6 KPIs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          <KpiCard label="Portfolio DMI" value={fmt(portDMI)} sub={`Regime: ${portRegime}`} accent={portDMI > 60 ? T.red : portDMI > 35 ? T.amber : T.sage} />
          <KpiCard label="WACI" value={`${fmt(waci)} tCO2e/$M`} sub="Weighted Average Carbon Intensity" />
          <KpiCard label="Implied Temperature" value={`${impliedTemp}\u00b0C`} sub={impliedTemp > 2 ? 'Above Paris target' : 'Paris-aligned'} accent={impliedTemp > 2 ? T.red : T.sage} />
          <KpiCard label="HHI Concentration" value={fmt(portHHI)} sub={portHHI > 2500 ? 'Highly concentrated' : portHHI > 1500 ? 'Moderately concentrated' : 'Diversified'} accent={portHHI > 2500 ? T.red : T.gold} />
          <KpiCard label="Portfolio VaR (95%)" value={`${fmt(portfolioVaR)}%`} sub="1-year climate VaR" />
          <KpiCard label="Expected Loss" value={`${fmt(expectedLoss)}%`} sub="VaR * 40% recovery" accent={T.red} />
        </div>
      </Section>

      {/* ── SECTOR ALLOCATION PIE ────────────────────────────────────────────── */}
      <Section title="Sector Allocation" badge={`${sectorAllocation.length} sectors`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sectorAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => `${name} ${value.toFixed(1)}%`} labelLine style={{ fontSize: 10 }}>
                {sectorAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── REGIME DISTRIBUTION BAR ──────────────────────────────────────────── */}
      <Section title="Regime Distribution" badge="Normal / Elevated / Critical / Extreme">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {regimeDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── HOLDING CLASSIFICATION ───────────────────────────────────────────── */}
      <Section title="Holding Classification" badge="DMI Velocity">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[{ label: 'IMPROVER', count: classificationCounts.IMPROVER, color: T.sage, desc: 'Improving DMI trajectory' },
            { label: 'STABLE', count: classificationCounts.STABLE, color: T.gold, desc: 'Stable DMI trajectory' },
            { label: 'DECLINER', count: classificationCounts.DECLINER, color: T.red, desc: 'Worsening DMI trajectory' }].map(c => (
            <div key={c.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, borderTop: `3px solid ${c.color}`, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.count}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginTop: 4 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── HOLDINGS TABLE (SORTABLE) ────────────────────────────────────────── */}
      <Section title="Holdings Detail" badge={`${holdings.length} entities`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{ key: 'name', label: 'Entity' }, { key: 'sector', label: 'Sector' }, { key: 'weight', label: 'Weight%' }, { key: 'dmi', label: 'DMI' }, { key: 'regime', label: 'Regime' }, { key: 'classification', label: 'Class' }, { key: 'scope1', label: 'S1 tCO2e' }, { key: 'scope2', label: 'S2 tCO2e' }, { key: 'temperature', label: 'Temp' }].map(c => (
                  <th key={c.key} style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort(c.key)}>
                    {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                  <td style={td}>{h.sector}</td>
                  <td style={td}>{pct(h.weight)}</td>
                  <td style={{ ...td, fontWeight: 600, color: h.dmi > 60 ? T.red : h.dmi > 35 ? T.amber : T.sage }}>{fmt(h.dmi)}</td>
                  <td style={td}><Badge label={h.regime} color={h.regime === 'Normal' ? 'green' : h.regime === 'Elevated' ? 'amber' : 'red'} /></td>
                  <td style={td}><Badge label={h.classification} color={h.classification === 'IMPROVER' ? 'green' : h.classification === 'STABLE' ? 'gold' : 'red'} /></td>
                  <td style={td}>{fmt(h.scope1)}</td>
                  <td style={td}>{fmt(h.scope2)}</td>
                  <td style={td}>{h.temperature.toFixed(2)}{'\u00b0C'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── SCENARIO RESULTS ─────────────────────────────────────────────────── */}
      <Section title="NGFS Scenario Analysis" badge="6 scenarios">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {scenarioResults.map(sc => (
            <div key={sc.id} onClick={() => setActiveScenario(sc.id)} style={{ background: activeScenario === sc.id ? T.surfaceH : T.surface, border: `1px solid ${activeScenario === sc.id ? T.navy : T.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', borderLeft: `4px solid ${sc.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{sc.name}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{sc.category} | {sc.temp}{'\u00b0C'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                <div><span style={{ color: T.textMut }}>DMI:</span> <strong>{sc.portfolio_dmi}</strong></div>
                <div><span style={{ color: T.textMut }}>VaR:</span> <strong>{sc.portfolio_var}%</strong></div>
                <div><span style={{ color: T.textMut }}>WACI {'\u0394'}:</span> <strong style={{ color: sc.waci_change > 0 ? T.red : T.green }}>{sc.waci_change > 0 ? '+' : ''}{sc.waci_change}%</strong></div>
                <div><span style={{ color: T.textMut }}>Aligned:</span> {sc.temp_aligned ? <Badge label="Yes" color="green" /> : <Badge label="No" color="red" />}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TAXONOMY ALIGNMENT PROGRESS ──────────────────────────────────────── */}
      <Section title="Taxonomy Alignment Progress" badge={`${avgTaxonomy}% avg`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1, background: T.surfaceH, borderRadius: 8, height: 24, overflow: 'hidden' }}>
              <div style={{ width: `${avgTaxonomy}%`, height: '100%', background: `linear-gradient(90deg, ${T.sage}, ${T.gold})`, borderRadius: 8, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{avgTaxonomy}%</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[{ label: 'Eligible', pct: Math.min(avgTaxonomy + 15, 100) }, { label: 'Aligned', pct: avgTaxonomy }, { label: 'Transitional', pct: Math.round(avgTaxonomy * 0.3) }, { label: 'Enabling', pct: Math.round(avgTaxonomy * 0.2) }].map(t => (
              <div key={t.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{t.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── MARGINAL RISK CONTRIBUTION ───────────────────────────────────────── */}
      <Section title="Marginal Risk Contribution" badge="Selection + Allocation + Interaction">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={marginalContributions.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="selection" stackId="a" fill={T.navy} name="Selection" />
              <Bar dataKey="allocation" stackId="a" fill={T.gold} name="Allocation" />
              <Bar dataKey="interaction" stackId="a" fill={T.sage} name="Interaction" />
            </BarChart>
          </ResponsiveContainer>
          <table style={{ ...tbl, marginTop: 12 }}>
            <thead>
              <tr>
                {['Entity','Sector','Weight','DMI','Selection','Allocation','Interaction','Total'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {marginalContributions.slice(0, 10).map((mc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{mc.name}</td>
                  <td style={td}>{mc.sector}</td>
                  <td style={td}>{pct(mc.weight)}</td>
                  <td style={td}>{fmt(mc.dmi)}</td>
                  <td style={{ ...td, color: mc.selection > 0 ? T.red : T.green }}>{mc.selection.toFixed(2)}</td>
                  <td style={{ ...td, color: mc.allocation > 0 ? T.red : T.green }}>{mc.allocation.toFixed(2)}</td>
                  <td style={{ ...td, color: mc.interaction > 0 ? T.red : T.green }}>{mc.interaction.toFixed(2)}</td>
                  <td style={{ ...td, fontWeight: 700, color: mc.total > 0 ? T.red : T.green }}>{mc.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── PCAF FINANCED EMISSIONS ──────────────────────────────────────────── */}
      <Section title="PCAF Financed Emissions" badge={`Total: ${fmt(totalFinancedEmissions)} tCO2e`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Entity','Sector','Attribution Factor','Financed S1+S2','Financed Total','% of Total','GHG Intensity'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pcafData.slice(0, 15).map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                  <td style={td}>{p.sector}</td>
                  <td style={td}>{p.af.toFixed(4)}</td>
                  <td style={td}>{fmt(p.financed_s1s2)}</td>
                  <td style={td}>{fmt(p.financed_total)}</td>
                  <td style={td}>{p.pct_of_total}%</td>
                  <td style={td}>{fmt(p.intensity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── SECTOR RISK HEATMAP ────────────────────────────────────────────── */}
      <Section title="Sector Risk Heatmap" badge={`${sectorRiskHeatmap.length} sectors`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {['Sector','Holdings','Weight%','Avg DMI','Max DMI','Critical%','S1+S2 tCO2e','Avg Temp'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sectorRiskHeatmap.map((sr, i) => (
                <tr key={i} style={{ background: sr.criticalPct > 40 ? '#fef2f2' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{sr.sector}</td>
                  <td style={td}>{sr.count}</td>
                  <td style={td}>{pct(sr.totalWeight)}</td>
                  <td style={{ ...td, fontWeight: 700, color: sr.avgDMI > 60 ? T.red : sr.avgDMI > 35 ? T.amber : T.sage }}>{fmt(sr.avgDMI)}</td>
                  <td style={{ ...td, color: sr.maxDMI > 75 ? T.red : T.text }}>{fmt(sr.maxDMI)}</td>
                  <td style={td}><Badge label={`${sr.criticalPct}%`} color={sr.criticalPct > 30 ? 'red' : sr.criticalPct > 10 ? 'amber' : 'green'} /></td>
                  <td style={td}>{fmt(sr.totalEmissions)}</td>
                  <td style={td}>{sr.avgTemp.toFixed(2)}{'\u00b0C'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── CONCENTRATION RISK ANALYSIS ──────────────────────────────────────── */}
      <Section title="Concentration Risk Analysis" badge={concentrationAnalysis.hhiLabel}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          <KpiCard label="HHI Index" value={fmt(concentrationAnalysis.hhi)} sub={concentrationAnalysis.hhiLabel} accent={concentrationAnalysis.hhi > 2500 ? T.red : T.gold} />
          <KpiCard label="Top 5 Weight" value={pct(concentrationAnalysis.top5Weight)} sub={concentrationAnalysis.top5Weight > 50 ? 'Concentrated' : 'Diversified'} />
          <KpiCard label="Top 10 Weight" value={pct(concentrationAnalysis.top10Weight)} sub={`Top holding: ${concentrationAnalysis.topHolding}`} />
          <KpiCard label="Max Sector" value={pct(concentrationAnalysis.maxSectorWeight)} sub={concentrationAnalysis.maxSectorName} />
        </div>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Critical/Extreme Weight</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: concentrationAnalysis.criticalWeight > 30 ? T.red : T.amber, marginTop: 4 }}>{pct(concentrationAnalysis.criticalWeight)}</div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Weight in distressed regimes</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Single Name Limit Breach</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: concentrationAnalysis.singleNameLimit ? T.red : T.sage, marginTop: 4 }}>{concentrationAnalysis.singleNameLimit ? 'YES' : 'NO'}</div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Threshold: 10% per entity</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Effective Diversification</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, marginTop: 4 }}>{Math.round(10000 / portHHI * 10) / 10}</div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Equivalent # of equal-weight holdings</div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── TEMPERATURE PATHWAY ──────────────────────────────────────────────── */}
      <Section title="Temperature Pathway Alignment" badge={`Implied: ${impliedTemp}\u00b0C`}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={temperaturePathway}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Holdings', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {temperaturePathway.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12 }}>
            {temperaturePathway.map(tp => (
              <div key={tp.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut }}>{tp.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tp.color }}>{tp.count} entities</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{pct(tp.weight)} weight</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── EMISSIONS BY SCOPE ───────────────────────────────────────────────── */}
      <Section title="Portfolio Emissions by Scope" badge="S1 + S2 + S3">
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emissionsByScope} dataKey="value" nameKey="scope" cx="50%" cy="50%" outerRadius={80} label={({ scope, pct: p }) => `${scope}`}>
                  {emissionsByScope.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v) + ' tCO2e'} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
            {emissionsByScope.map(es => (
              <div key={es.scope} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: es.fill }} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.navy }}>{es.scope}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{fmt(es.value)} tCO2e</div>
                <div style={{ fontSize: 12, color: T.textSec, width: 60, textAlign: 'right' }}>{es.pct}%</div>
                <div style={{ flex: 2, background: T.surfaceH, borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${es.pct}%`, height: '100%', background: es.fill, borderRadius: 4 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 12, color: T.textSec }}>
              <strong>Total Absolute Emissions:</strong> {fmt(emissionsByScope.reduce((s, e) => s + e.value, 0))} tCO2e |{' '}
              <strong>Financed (PCAF):</strong> {fmt(totalFinancedEmissions)} tCO2e
            </div>
          </div>
        </div>
      </Section>

      {/* ── ESG SCORE DISTRIBUTION ───────────────────────────────────────────── */}
      <Section title="ESG Score Distribution" badge="Holdings histogram">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={esgDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.navyL} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── SFDR CLASSIFICATION ──────────────────────────────────────────────── */}
      <Section title="SFDR Classification" badge={sfdrClassification.article}>
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[{ art: 'Article 6', desc: 'Standard', threshold: 'No ESG promotion' },
              { art: 'Article 8', desc: 'Light Green', threshold: 'ESG > 45% or Improvers > 30%' },
              { art: 'Article 8+', desc: 'Light Green+', threshold: 'Taxonomy > 40%, ESG > 55%' },
              { art: 'Article 9', desc: 'Dark Green', threshold: 'Taxonomy > 70%, ESG > 70%' }].map(a => (
              <div key={a.art} style={{ padding: 14, borderRadius: 10, border: `2px solid ${sfdrClassification.article === a.art ? T.navy : T.border}`, background: sfdrClassification.article === a.art ? T.surfaceH : T.surface }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{a.art}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{a.desc}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>{a.threshold}</div>
                {sfdrClassification.article === a.art && <Badge label="CURRENT" color="navy" />}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: T.textSec }}>
            <strong>Rationale:</strong> {sfdrClassification.desc}. Avg taxonomy alignment: {avgTaxonomy}%, Avg ESG: {Math.round(holdings.reduce((s, h) => s + h.esg_score, 0) / holdings.length)}, Improver %: {Math.round(classificationCounts.IMPROVER / holdings.length * 100)}%
          </div>
        </div>
      </Section>

      {/* ── DMI TREND ────────────────────────────────────────────────────────── */}
      <Section title="Portfolio DMI Trend" badge="12-month">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dmiTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={['auto', 'auto']} />
              <Tooltip />
              <ReferenceLine y={50} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'Benchmark', position: 'right', fontSize: 10 }} />
              <Area type="monotone" dataKey="dmi" stroke={T.navy} fill={T.navyL} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── RISK-RETURN PROFILE ────────────────────────────────────────────── */}
      <Section title="Risk-Return Profile" badge="DMI vs Transition Readiness">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Entity</th>
                    <th style={th}>DMI (Risk)</th>
                    <th style={th}>Transition Score</th>
                    <th style={th}>Sector</th>
                  </tr>
                </thead>
                <tbody>
                  {riskReturnData.sort((a, b) => b.x - a.x).slice(0, 10).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ ...td, color: r.x > 60 ? T.red : r.x > 35 ? T.amber : T.sage, fontWeight: 700 }}>{fmt(r.x)}</td>
                      <td style={td}>{fmt(r.y)}</td>
                      <td style={td}>{r.sector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Portfolio Risk Quadrants</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: 10, borderRadius: 8, background: '#dcfce7', fontSize: 11 }}>
                  <strong style={{ color: '#166534' }}>Low Risk / High Ready</strong><br />
                  {holdings.filter(h => h.dmi < 35 && h.transition_risk_score < 40).length} holdings
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#fef3c7', fontSize: 11 }}>
                  <strong style={{ color: '#92400e' }}>High Risk / High Ready</strong><br />
                  {holdings.filter(h => h.dmi >= 35 && h.transition_risk_score < 40).length} holdings
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#dbeafe', fontSize: 11 }}>
                  <strong style={{ color: '#1e40af' }}>Low Risk / Low Ready</strong><br />
                  {holdings.filter(h => h.dmi < 35 && h.transition_risk_score >= 40).length} holdings
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#fee2e2', fontSize: 11 }}>
                  <strong style={{ color: '#991b1b' }}>High Risk / Low Ready</strong><br />
                  {holdings.filter(h => h.dmi >= 35 && h.transition_risk_score >= 40).length} holdings
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.textSec }}>
                <strong>Portfolio weighted transition risk:</strong> {Math.round(holdings.reduce((s, h) => s + (h.weight / totalWeight) * h.transition_risk_score, 0) * 10) / 10}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── PORTFOLIO SUMMARY CARD ───────────────────────────────────────────── */}
      <Section title="Portfolio Summary" badge="Executive overview">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 12, color: T.textSec }}>
            <div>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 8 }}>Risk Profile</div>
              <div style={{ marginBottom: 4 }}>Portfolio DMI: <strong style={{ color: T.navy }}>{fmt(portDMI)}</strong></div>
              <div style={{ marginBottom: 4 }}>Regime: <Badge label={portRegime} color={portRegime === 'Normal' ? 'green' : portRegime === 'Elevated' ? 'amber' : 'red'} /></div>
              <div style={{ marginBottom: 4 }}>VaR (95%): <strong>{fmt(portfolioVaR)}%</strong></div>
              <div>Expected Loss: <strong>{fmt(expectedLoss)}%</strong></div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 8 }}>Climate Profile</div>
              <div style={{ marginBottom: 4 }}>WACI: <strong>{fmt(waci)} tCO2e/$M</strong></div>
              <div style={{ marginBottom: 4 }}>Implied Temp: <strong>{impliedTemp}{'\u00b0C'}</strong></div>
              <div style={{ marginBottom: 4 }}>Taxonomy: <strong>{avgTaxonomy}%</strong> aligned</div>
              <div>Financed Emissions: <strong>{fmt(totalFinancedEmissions)} tCO2e</strong></div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 8 }}>Composition</div>
              <div style={{ marginBottom: 4 }}>Holdings: <strong>{holdings.length}</strong></div>
              <div style={{ marginBottom: 4 }}>Sectors: <strong>{sectorAllocation.length}</strong></div>
              <div style={{ marginBottom: 4 }}>HHI: <strong>{fmt(portHHI)}</strong> ({concentrationAnalysis.hhiLabel})</div>
              <div>SFDR: <Badge label={sfdrClassification.article} color={sfdrClassification.color} /></div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── CROSS-NAV ────────────────────────────────────────────────────────── */}
      <Section title="Cross-Navigation" badge="DME Suite">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'DME Dashboard', path: '/dme-dashboard' },
            { label: 'DME Risk Engine', path: '/dme-risk' },
            { label: 'Entity Deep-Dive', path: '/dme-entity' },
            { label: 'Competitive Intel', path: '/dme-competitive' },
            { label: 'Contagion Network', path: '/dme-contagion' },
            { label: 'Alert Center', path: '/dme-alerts' },
            { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
            { label: 'SFDR PAI', path: '/sfdr-pai' },
            { label: 'Regulatory Gap', path: '/regulatory-gap' },
          ].map(n => <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>)}
        </div>
      </Section>
    </div>
  );
}
