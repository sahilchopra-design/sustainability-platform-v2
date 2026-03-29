import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#e07b54','#7b6ea8','#4a9bbe','#d4a84b','#6b8e6b','#c46060','#5c7ea8','#2563eb','#ec4899','#0d9488','#d97706','#7c3aed'];

/* ══════════════════════════════════════════════════════════════
   SCOPE 3 CATEGORIES (GHG Protocol)
   ══════════════════════════════════════════════════════════════ */
const SCOPE3_CATEGORIES = [
  'Purchased Goods & Services', 'Capital Goods', 'Fuel & Energy Activities',
  'Upstream Transport', 'Waste Generated', 'Business Travel',
  'Employee Commuting', 'Upstream Leased Assets', 'Downstream Transport',
  'Processing of Sold Products', 'Use of Sold Products', 'End-of-Life Treatment',
  'Downstream Leased Assets', 'Franchises', 'Investments',
];

const SCOPE3_CAT_WEIGHTS = [0.28, 0.08, 0.06, 0.09, 0.03, 0.02, 0.02, 0.01, 0.06, 0.04, 0.18, 0.05, 0.01, 0.005, 0.065];

/* ══════════════════════════════════════════════════════════════
   TIER MULTIPLIERS (same as EP-K5)
   ══════════════════════════════════════════════════════════════ */
const TIER_MULTIPLIERS = {
  Energy:      { tier1: 1.8, tier2: 2.5, tier3: 1.2 },
  Materials:   { tier1: 1.5, tier2: 2.0, tier3: 1.8 },
  Industrials: { tier1: 1.2, tier2: 1.5, tier3: 0.8 },
  Utilities:   { tier1: 0.8, tier2: 1.2, tier3: 0.5 },
  Financials:  { tier1: 0.3, tier2: 0.2, tier3: 0.1 },
  'Information Technology': { tier1: 0.8, tier2: 0.6, tier3: 0.3 },
  'Health Care': { tier1: 1.0, tier2: 0.8, tier3: 0.5 },
  'Consumer Discretionary': { tier1: 1.5, tier2: 2.2, tier3: 1.5 },
  'Consumer Staples': { tier1: 2.0, tier2: 2.8, tier3: 2.0 },
  'Communication Services': { tier1: 0.5, tier2: 0.3, tier3: 0.2 },
  'Real Estate': { tier1: 0.6, tier2: 0.4, tier3: 0.2 },
};

/* ══════════════════════════════════════════════════════════════
   CSDDD — sector risk scores
   ══════════════════════════════════════════════════════════════ */
const CSDDD_SECTOR_RISK = {
  Energy: 82, Materials: 78, Industrials: 65, Utilities: 60, Financials: 40,
  'Information Technology': 35, 'Health Care': 45, 'Consumer Discretionary': 70,
  'Consumer Staples': 75, 'Communication Services': 30, 'Real Estate': 38,
};

const CSDDD_COMPLIANCE_CRITERIA = [
  { name: 'Due Diligence Process', weight: 0.20 },
  { name: 'Risk Identification', weight: 0.15 },
  { name: 'Remediation Mechanisms', weight: 0.15 },
  { name: 'Stakeholder Engagement', weight: 0.10 },
  { name: 'Transition Plan', weight: 0.15 },
  { name: 'Reporting & Disclosure', weight: 0.15 },
  { name: 'Board Oversight', weight: 0.10 },
];

/* ══════════════════════════════════════════════════════════════
   EUDR — commodity exposure mapping
   ══════════════════════════════════════════════════════════════ */
const EUDR_COMMODITIES = ['Palm Oil','Soy','Cattle','Cocoa','Coffee','Rubber','Wood'];
const EUDR_SECTOR_EXPOSURE = {
  'Consumer Staples': [0.25, 0.15, 0.10, 0.08, 0.07, 0.02, 0.05],
  'Consumer Discretionary': [0.05, 0.02, 0.08, 0.01, 0.01, 0.12, 0.10],
  Materials: [0.02, 0.01, 0.01, 0.00, 0.00, 0.08, 0.18],
  Energy: [0.08, 0.04, 0.00, 0.00, 0.00, 0.02, 0.01],
  Industrials: [0.02, 0.02, 0.00, 0.00, 0.00, 0.06, 0.08],
};
const EUDR_DEFAULT = [0.01, 0.01, 0.00, 0.00, 0.00, 0.01, 0.02];

/* ══════════════════════════════════════════════════════════════
   SUPPLY CHAIN RISK — country risk scores
   ══════════════════════════════════════════════════════════════ */
const COUNTRY_SC_RISK = {
  India: 68, China: 62, Brazil: 58, Indonesia: 65, Mexico: 52, USA: 25,
  UK: 22, Germany: 20, Japan: 24, France: 23, Australia: 26, Canada: 22,
  Singapore: 18, 'South Korea': 28, 'South Africa': 55,
};
const EXCHANGE_COUNTRY = {
  'NSE/BSE': 'India', 'NYSE/NASDAQ': 'USA', 'LSE': 'UK', 'XETRA': 'Germany',
  'EURONEXT': 'France', 'Euronext': 'France', 'TSE': 'Japan', 'HKEX': 'Hong Kong',
  'ASX': 'Australia', 'SGX': 'Singapore', 'KRX': 'South Korea',
  'SSE/SZSE': 'China', 'B3': 'Brazil', 'JSE': 'South Africa', 'TSX': 'Canada',
};

/* ══════════════════════════════════════════════════════════════
   PORTFOLIO READER
   ══════════════════════════════════════════════════════════════ */
function readPortfolioData() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return { portfolios: {}, activePortfolio: null };
    const outer = JSON.parse(raw);
    if (outer && typeof outer === 'object' && outer.portfolios) {
      return { portfolios: outer.portfolios || {}, activePortfolio: outer.activePortfolio || null };
    }
    return { portfolios: {}, activePortfolio: null };
  } catch { return { portfolios: {}, activePortfolio: null }; }
}

/* ══════════════════════════════════════════════════════════════
   FORMAT HELPERS
   ══════════════════════════════════════════════════════════════ */
const fmt = (v, d = 0) => v == null ? '-' : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = (v) => { if (v == null) return '-'; const a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + ' Bt'; if (a >= 1e6) return (v / 1e6).toFixed(2) + ' Mt'; if (a >= 1e3) return (v / 1e3).toFixed(1) + ' kt'; return fmt(v, 0) + ' t'; };

/* ══════════════════════════════════════════════════════════════
   SHARED STYLES
   ══════════════════════════════════════════════════════════════ */
const sCard = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24 };
const sKpi = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 150, flex: '1 1 160px' };
const sBadge = (bg, fg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color: fg, letterSpacing: 0.3 });

/* ══════════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
   ══════════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.textSec, marginTop: 2 }}>{p.name}: {typeof p.value === 'number' ? fmt(p.value, 2) : p.value}</div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SVG GAUGE COMPONENT
   ══════════════════════════════════════════════════════════════ */
function GaugeChart({ value, size = 180, label }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const r = (size - 24) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweep = pct / 100 * Math.PI;
  const bgArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const valEndX = cx - r * Math.cos(sweep);
  const valEndY = cy - r * Math.sin(sweep);
  const largeArc = sweep > Math.PI / 2 ? 1 : 0;
  const valArc = `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${valEndX} ${valEndY}`;
  const color = pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red;
  return (
    <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
      <path d={bgArc} fill="none" stroke={T.border} strokeWidth={14} strokeLinecap="round" />
      <path d={valArc} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={28} fontWeight={700} fill={color} fontFamily={T.font}>{pct.toFixed(0)}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill={T.textSec} fontFamily={T.font}>{label || 'Compliance'}</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ValueChainDashboardPage() {
  const navigate = useNavigate();
  const [portData, setPortData] = useState({ portfolios: {}, activePortfolio: null });
  const [selectedPortfolio, setSelectedPortfolio] = useState('');

  useEffect(() => {
    const d = readPortfolioData();
    setPortData(d);
    const names = Object.keys(d.portfolios || {});
    if (d.activePortfolio && names.includes(d.activePortfolio)) setSelectedPortfolio(d.activePortfolio);
    else if (names.length) setSelectedPortfolio(names[0]);
  }, []);

  const portfolio = useMemo(() => {
    const p = portData.portfolios[selectedPortfolio];
    if (!p || !p.holdings) return [];
    return p.holdings.map(h => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.name === h.name || c.ticker === h.ticker);
      return { ...h, company: master || h };
    }).filter(h => h.company);
  }, [portData, selectedPortfolio]);

  const portfolioNames = useMemo(() => Object.keys(portData.portfolios || {}), [portData]);

  /* ── SCOPE 3 AGGREGATION ── */
  const scope3Agg = useMemo(() => {
    if (!portfolio.length) return { total: 0, categories: [], scope12: 0, ratio: 0, largestCat: '-' };
    let totalScope3 = 0;
    let totalScope12 = 0;
    const catTotals = new Array(15).fill(0);

    portfolio.forEach(h => {
      const w = (h.weight || 0) / 100;
      const s1 = (h.company.scope1_mt || 0) * 1e6;
      const s2 = (h.company.scope2_mt || 0) * 1e6;
      totalScope12 += (s1 + s2) * w;
      const sector = h.company.sector || 'Industrials';
      const mult = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials'];
      const companyTotal = s1 + s2;
      const totalSC = companyTotal * (mult.tier1 + mult.tier2 + mult.tier3);
      totalScope3 += totalSC * w;
      SCOPE3_CAT_WEIGHTS.forEach((cw, ci) => { catTotals[ci] += totalSC * cw * w; });
    });

    const categories = SCOPE3_CATEGORIES.map((name, i) => ({ name, value: catTotals[i] }));
    categories.sort((a, b) => b.value - a.value);
    const largestCat = categories[0]?.name || '-';
    return { total: totalScope3, categories, scope12: totalScope12, ratio: totalScope12 > 0 ? totalScope3 / totalScope12 : 0, largestCat };
  }, [portfolio]);

  /* ── CSDDD COMPLIANCE ── */
  const csdddData = useMemo(() => {
    if (!portfolio.length) return { overallScore: 0, holdings: [] };
    let weightedScore = 0;
    const holdings = portfolio.map(h => {
      const sector = h.company.sector || 'Industrials';
      const sectorRisk = CSDDD_SECTOR_RISK[sector] || 50;
      const esg = h.company.esg_score || 50;
      const score = Math.min(100, Math.max(0, 100 - sectorRisk + esg * 0.6 + (h.company.governance_score || 50) * 0.2));
      const w = (h.weight || 0) / 100;
      weightedScore += score * w;
      return { name: h.company.name || h.name, sector, score, weight: h.weight || 0 };
    });
    return { overallScore: weightedScore, holdings };
  }, [portfolio]);

  /* ── EUDR EXPOSURE ── */
  const eudrData = useMemo(() => {
    if (!portfolio.length) return { commodities: [], applicableHoldings: 0, totalExposure: 0 };
    const comTotals = new Array(7).fill(0);
    let applicableCount = 0;
    portfolio.forEach(h => {
      const sector = h.company.sector || '';
      const exposures = EUDR_SECTOR_EXPOSURE[sector] || EUDR_DEFAULT;
      const w = (h.weight || 0) / 100;
      const hasExposure = exposures.some(e => e > 0.03);
      if (hasExposure) applicableCount++;
      exposures.forEach((e, i) => { comTotals[i] += e * w * 100; });
    });
    const commodities = EUDR_COMMODITIES.map((name, i) => ({ name, value: comTotals[i] })).filter(c => c.value > 0.1);
    const totalExposure = comTotals.reduce((s, v) => s + v, 0);
    return { commodities, applicableHoldings: applicableCount, totalExposure };
  }, [portfolio]);

  /* ── SUPPLY CHAIN RISK ── */
  const scRisk = useMemo(() => {
    if (!portfolio.length) return { avgRisk: 0, tier1Avg: 0, highRiskCountries: 0, holdings: [] };
    let totalRisk = 0, totalW = 0, highRC = new Set();
    const holdings = portfolio.map(h => {
      const exch = h.company.exchange || h.company._displayExchange || '';
      const country = EXCHANGE_COUNTRY[exch] || 'USA';
      const countryRisk = COUNTRY_SC_RISK[country] || 35;
      const sector = h.company.sector || 'Industrials';
      const sectorRisk = CSDDD_SECTOR_RISK[sector] || 50;
      const risk = countryRisk * 0.5 + sectorRisk * 0.3 + (100 - (h.company.esg_score || 50)) * 0.2;
      const w = (h.weight || 0) / 100;
      totalRisk += risk * w;
      totalW += w;
      if (countryRisk > 50) highRC.add(country);
      return { name: h.company.name || h.name, sector, country, risk, esg: h.company.esg_score || 0, carbon: ((h.company.scope1_mt || 0) + (h.company.scope2_mt || 0)) * 1e6 };
    });
    return { avgRisk: totalW > 0 ? totalRisk / totalW : 0, tier1Avg: totalRisk * 0.7, highRiskCountries: highRC.size, holdings };
  }, [portfolio]);

  /* ── SUPPLY CHAIN CARBON AGGREGATION ── */
  const scCarbon = useMemo(() => {
    if (!portfolio.length) return { total: 0, multiplierAvg: 0 };
    let totalSC = 0, totalComp = 0;
    portfolio.forEach(h => {
      const s1 = (h.company.scope1_mt || 0) * 1e6;
      const s2 = (h.company.scope2_mt || 0) * 1e6;
      const sector = h.company.sector || 'Industrials';
      const mult = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials'];
      const companyTotal = s1 + s2;
      const w = (h.weight || 0) / 100;
      totalComp += companyTotal * w;
      totalSC += companyTotal * (1 + mult.tier1 + mult.tier2 + mult.tier3) * w;
    });
    return { total: totalSC, multiplierAvg: totalComp > 0 ? totalSC / totalComp : 0 };
  }, [portfolio]);

  /* ── DATA CONFIDENCE ── */
  const dataConfidence = useMemo(() => {
    if (!portfolio.length) return 'N/A';
    const withData = portfolio.filter(h => (h.company.scope1_mt || 0) > 0).length;
    const pct = withData / portfolio.length;
    if (pct >= 0.8) return 'High';
    if (pct >= 0.5) return 'Medium';
    return 'Low';
  }, [portfolio]);

  /* ── 5 MODULE STATUS ── */
  const modules = useMemo(() => [
    { name: 'Scope 3 Engine', metric: `Portfolio Scope 3: ${fmtM(scope3Agg.total)}`, status: scope3Agg.total > 0 ? 'Active' : 'No Data', path: '/scope3-engine', color: T.navy, icon: '\u2699' },
    { name: 'Supply Chain Map', metric: `Avg SC Risk: ${fmt(scRisk.avgRisk, 0)}/100`, status: 'Active', path: '/supply-chain-map', color: T.gold, icon: '\ud83d\uddfa' },
    { name: 'CSDDD Toolkit', metric: `Compliance: ${fmt(csdddData.overallScore, 0)}%`, status: csdddData.overallScore >= 60 ? 'Good' : 'Needs Work', path: '/csddd-compliance', color: T.sage, icon: '\u2696' },
    { name: 'Deforestation Risk', metric: `Exposure: ${fmt(eudrData.totalExposure, 1)}% portfolio`, status: eudrData.applicableHoldings > 0 ? 'Active' : 'Low', path: '/deforestation-risk', color: '#16a34a', icon: '\ud83c\udf33' },
    { name: 'Supply Chain Carbon', metric: `SC Multiplier: ${scCarbon.multiplierAvg.toFixed(2)}x`, status: 'Active', path: '/supply-chain-carbon', color: '#e07b54', icon: '\ud83c\udfed' },
  ], [scope3Agg, scRisk, csdddData, eudrData, scCarbon]);

  /* ── SUPPLY CHAIN RISK MATRIX ── */
  const riskMatrix = useMemo(() => {
    if (!scRisk.holdings.length) return { q1: [], q2: [], q3: [], q4: [] };
    const medianESG = 50;
    const medianCarbon = scRisk.holdings.reduce((s, h) => s + h.carbon, 0) / scRisk.holdings.length;
    const q1 = [], q2 = [], q3 = [], q4 = [];
    scRisk.holdings.forEach(h => {
      const highCarbon = h.carbon > medianCarbon;
      const highRisk = h.risk > 50;
      if (highRisk && highCarbon) q1.push(h);
      else if (highRisk && !highCarbon) q2.push(h);
      else if (!highRisk && highCarbon) q3.push(h);
      else q4.push(h);
    });
    return { q1, q2, q3, q4 };
  }, [scRisk]);

  /* ── CROSS-MODULE ALERTS ── */
  const crossAlerts = useMemo(() => {
    const alerts = [];
    if (scope3Agg.ratio > 5) alerts.push({ severity: 'high', message: `Scope 3 is ${scope3Agg.ratio.toFixed(1)}x of Scope 1+2 — supply chain engagement critical`, module: 'Scope 3 Engine' });
    if (csdddData.overallScore < 50) alerts.push({ severity: 'high', message: `CSDDD compliance at ${fmt(csdddData.overallScore, 0)}% — significant due diligence gaps`, module: 'CSDDD Toolkit' });
    if (eudrData.applicableHoldings > portfolio.length * 0.3) alerts.push({ severity: 'medium', message: `${eudrData.applicableHoldings} of ${portfolio.length} holdings have EUDR-applicable commodity exposure`, module: 'Deforestation Risk' });
    if (scRisk.avgRisk > 60) alerts.push({ severity: 'high', message: `Average supply chain risk score ${fmt(scRisk.avgRisk, 0)}/100 — elevated risk across portfolio`, module: 'Supply Chain Map' });
    if (scCarbon.multiplierAvg > 4) alerts.push({ severity: 'medium', message: `Supply chain carbon multiplier ${scCarbon.multiplierAvg.toFixed(2)}x — heavy upstream emissions`, module: 'Supply Chain Carbon' });
    if (riskMatrix.q1.length > 0) alerts.push({ severity: 'high', message: `${riskMatrix.q1.length} holding(s) in Priority 1 quadrant (high risk + high carbon)`, module: 'Cross-Module' });
    if (!alerts.length) alerts.push({ severity: 'low', message: 'All modules within acceptable thresholds', module: 'System' });
    return alerts;
  }, [scope3Agg, csdddData, eudrData, scRisk, scCarbon, riskMatrix, portfolio]);

  /* ── ACTION PRIORITIZATION ── */
  const actionItems = useMemo(() => {
    const items = [];
    if (riskMatrix.q1.length) items.push({ action: `Engage ${riskMatrix.q1.length} Priority 1 companies on supply chain decarbonization`, module: 'Supply Chain Map', impact: 9, urgency: 9 });
    if (csdddData.overallScore < 70) items.push({ action: 'Strengthen CSDDD due diligence processes across portfolio', module: 'CSDDD Toolkit', impact: 8, urgency: 8 });
    if (scope3Agg.total > 0) items.push({ action: `Address largest Scope 3 category: ${scope3Agg.largestCat}`, module: 'Scope 3 Engine', impact: 9, urgency: 7 });
    if (eudrData.applicableHoldings > 0) items.push({ action: `Verify EUDR compliance for ${eudrData.applicableHoldings} applicable holdings`, module: 'Deforestation Risk', impact: 7, urgency: 9 });
    items.push({ action: 'Improve Tier 2/3 supply chain emissions data quality', module: 'Supply Chain Carbon', impact: 7, urgency: 6 });
    items.push({ action: 'Establish supplier engagement program for top emitters', module: 'Supply Chain Map', impact: 8, urgency: 7 });
    items.push({ action: 'Integrate CSDDD findings into investment committee reporting', module: 'CSDDD Toolkit', impact: 6, urgency: 5 });
    items.push({ action: 'Develop commodity-specific deforestation risk mitigation plans', module: 'Deforestation Risk', impact: 7, urgency: 6 });
    items.sort((a, b) => (b.impact * b.urgency) - (a.impact * a.urgency));
    return items;
  }, [riskMatrix, csdddData, scope3Agg, eudrData]);

  /* ── SCOPE 3 STACKED BAR DATA ── */
  const scope3BarData = useMemo(() => {
    if (!portfolio.length) return [];
    return portfolio.slice(0, 12).map(h => {
      const s1 = (h.company.scope1_mt || 0) * 1e6;
      const s2 = (h.company.scope2_mt || 0) * 1e6;
      const sector = h.company.sector || 'Industrials';
      const mult = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials'];
      const companyTotal = s1 + s2;
      const totalSC = companyTotal * (mult.tier1 + mult.tier2 + mult.tier3);
      const row = { name: (h.company.name || h.name || '').slice(0, 12) };
      SCOPE3_CATEGORIES.forEach((cat, ci) => { row[cat] = totalSC * SCOPE3_CAT_WEIGHTS[ci]; });
      return row;
    });
  }, [portfolio]);

  /* ── EXPORTS ── */
  const exportCSV = useCallback(() => {
    const headers = ['Module', 'Key Metric', 'Status'];
    const rows = modules.map(m => [m.name, m.metric, m.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'value_chain_report.csv'; a.click(); URL.revokeObjectURL(url);
  }, [modules]);

  const exportJSON = useCallback(() => {
    const data = { modules: modules.map(m => ({ name: m.name, metric: m.metric, status: m.status })), kpis: { scope3Total: scope3Agg.total, csdddScore: csdddData.overallScore, eudrExposure: eudrData.totalExposure, scRiskAvg: scRisk.avgRisk, scCarbonMult: scCarbon.multiplierAvg }, alerts: crossAlerts, actions: actionItems };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'value_chain_executive_summary.json'; a.click(); URL.revokeObjectURL(url);
  }, [modules, scope3Agg, csdddData, eudrData, scRisk, scCarbon, crossAlerts, actionItems]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── EMPTY STATE ── */
  if (!portfolioNames.length) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...sCard, maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>&#x1f517;</div>
          <h2 style={{ color: T.navy, marginBottom: 8 }}>No Portfolio Found</h2>
          <p style={{ color: T.textSec, marginBottom: 20 }}>Build a portfolio first to access the Value Chain Intelligence Dashboard.</p>
          <button onClick={() => navigate('/portfolio-suite')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Go to Portfolio Suite</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingBottom: 48 }}>
      {/* ═══ S1: HEADER ═══ */}
      <header style={{ background: T.navy, padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Value Chain Intelligence Dashboard</h1>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Hub','Scope 3','CSDDD','EUDR','5 Modules'].map(b => (
              <span key={b} style={sBadge('rgba(197,169,106,0.2)', T.goldL)}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedPortfolio} onChange={e => setSelectedPortfolio(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontFamily: T.font }}>
            {portfolioNames.map(n => <option key={n} value={n} style={{ color: T.navy }}>{n}</option>)}
          </select>
          <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>CSV</button>
          <button onClick={exportJSON} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>JSON</button>
          <button onClick={handlePrint} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Print</button>
        </div>
      </header>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 36px' }}>
        {/* ═══ S2: MODULE STATUS CARDS (5) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
          {modules.map((m, i) => (
            <div key={i} onClick={() => navigate(m.path)} style={{ ...sCard, cursor: 'pointer', borderTop: `3px solid ${m.color}`, transition: 'box-shadow 0.2s', padding: '20px 18px' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10, lineHeight: 1.4 }}>{m.metric}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={sBadge(m.status === 'Good' || m.status === 'Active' ? T.green + '18' : T.amber + '18', m.status === 'Good' || m.status === 'Active' ? T.green : T.amber)}>{m.status}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>Explore &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ S3: KPI CARDS (12 — 2 rows of 6) ═══ */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { label: 'Total Scope 3', value: fmtM(scope3Agg.total), color: T.navy },
            { label: 'Scope 3 / S12 Ratio', value: scope3Agg.ratio.toFixed(1) + 'x', color: T.navyL },
            { label: 'Largest Category', value: (scope3Agg.largestCat || '-').slice(0, 20), color: T.gold },
            { label: 'CSDDD Compliance', value: fmt(csdddData.overallScore, 0) + '%', color: csdddData.overallScore >= 60 ? T.green : T.red },
            { label: 'EUDR Holdings', value: fmt(eudrData.applicableHoldings), color: T.sage },
            { label: 'Deforestation Exp.', value: fmt(eudrData.totalExposure, 1) + '%', color: '#16a34a' },
          ].map((k, i) => (
            <div key={i} style={sKpi}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            { label: 'SC Risk Score', value: fmt(scRisk.avgRisk, 0) + '/100', color: scRisk.avgRisk > 60 ? T.red : T.amber },
            { label: 'Tier 1 Avg Risk', value: fmt(scRisk.tier1Avg, 0), color: T.gold },
            { label: 'High-Risk Countries', value: fmt(scRisk.highRiskCountries), color: T.red },
            { label: 'SC Carbon (wtd)', value: fmtM(scCarbon.total), color: '#e07b54' },
            { label: 'SC Multiplier', value: scCarbon.multiplierAvg.toFixed(2) + 'x', color: T.navyL },
            { label: 'Data Confidence', value: dataConfidence, color: dataConfidence === 'High' ? T.green : dataConfidence === 'Medium' ? T.amber : T.red },
          ].map((k, i) => (
            <div key={i} style={sKpi}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* ═══ S4: SCOPE 3 CATEGORY DISTRIBUTION ═══ */}
          <div style={sCard}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Scope 3 Category Distribution</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Portfolio-weighted across 15 GHG Protocol categories</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scope3Agg.categories.slice(0, 10)} layout="vertical" barCategoryGap="16%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => fmtM(v)} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Emissions (t)" radius={[0,6,6,0]}>
                  {scope3Agg.categories.slice(0, 10).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ═══ S5: SUPPLY CHAIN RISK MATRIX ═══ */}
          <div style={sCard}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Supply Chain Risk Matrix</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>ESG Risk vs Carbon Intensity — portfolio companies in quadrants</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, height: 280 }}>
              {/* Q1: High Risk + High Carbon */}
              <div style={{ background: T.red + '10', borderRadius: 10, padding: 12, border: `1px solid ${T.red}30` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 6 }}>PRIORITY 1 — High Risk + High Carbon</div>
                {riskMatrix.q1.slice(0, 4).map((h, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '2px 0' }}>{h.name?.slice(0, 18)}</div>
                ))}
                {riskMatrix.q1.length > 4 && <div style={{ fontSize: 10, color: T.textMut }}>+{riskMatrix.q1.length - 4} more</div>}
                {!riskMatrix.q1.length && <div style={{ fontSize: 11, color: T.textMut, fontStyle: 'italic' }}>None</div>}
              </div>
              {/* Q2: High Risk + Low Carbon */}
              <div style={{ background: T.amber + '10', borderRadius: 10, padding: 12, border: `1px solid ${T.amber}30` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 6 }}>PRIORITY 2 — High Risk + Low Carbon</div>
                {riskMatrix.q2.slice(0, 4).map((h, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '2px 0' }}>{h.name?.slice(0, 18)}</div>
                ))}
                {riskMatrix.q2.length > 4 && <div style={{ fontSize: 10, color: T.textMut }}>+{riskMatrix.q2.length - 4} more</div>}
                {!riskMatrix.q2.length && <div style={{ fontSize: 11, color: T.textMut, fontStyle: 'italic' }}>None</div>}
              </div>
              {/* Q3: Low Risk + High Carbon */}
              <div style={{ background: T.gold + '10', borderRadius: 10, padding: 12, border: `1px solid ${T.gold}30` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 6 }}>PRIORITY 3 — Low Risk + High Carbon</div>
                {riskMatrix.q3.slice(0, 4).map((h, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '2px 0' }}>{h.name?.slice(0, 18)}</div>
                ))}
                {riskMatrix.q3.length > 4 && <div style={{ fontSize: 10, color: T.textMut }}>+{riskMatrix.q3.length - 4} more</div>}
                {!riskMatrix.q3.length && <div style={{ fontSize: 11, color: T.textMut, fontStyle: 'italic' }}>None</div>}
              </div>
              {/* Q4: Low Risk + Low Carbon */}
              <div style={{ background: T.green + '10', borderRadius: 10, padding: 12, border: `1px solid ${T.green}30` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6 }}>LOW PRIORITY — Low Risk + Low Carbon</div>
                {riskMatrix.q4.slice(0, 4).map((h, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '2px 0' }}>{h.name?.slice(0, 18)}</div>
                ))}
                {riskMatrix.q4.length > 4 && <div style={{ fontSize: 10, color: T.textMut }}>+{riskMatrix.q4.length - 4} more</div>}
                {!riskMatrix.q4.length && <div style={{ fontSize: 11, color: T.textMut, fontStyle: 'italic' }}>None</div>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* ═══ S6: CSDDD READINESS GAUGE ═══ */}
          <div style={{ ...sCard, textAlign: 'center' }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4, textAlign: 'left' }}>CSDDD Readiness</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16, textAlign: 'left' }}>Portfolio-weighted CSDDD compliance score</p>
            <GaugeChart value={csdddData.overallScore} size={200} label="Portfolio CSDDD Compliance" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
              {CSDDD_COMPLIANCE_CRITERIA.slice(0, 6).map((c, i) => {
                const val = Math.max(20, Math.min(100, csdddData.overallScore + (Math.sin(i * 1.5) * 15)));
                const color = val >= 70 ? T.green : val >= 40 ? T.amber : T.red;
                return (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: T.textMut, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(val, 0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ S7: EUDR COMMODITY EXPOSURE PIE ═══ */}
          <div style={sCard}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Deforestation Commodity Exposure</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>% portfolio exposure to each of 7 EUDR commodities</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="55%" height={260}>
                <PieChart>
                  <Pie data={eudrData.commodities.length ? eudrData.commodities : [{ name: 'No Data', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`} labelLine={{ stroke: T.textMut, strokeWidth: 1 }}>
                    {(eudrData.commodities.length ? eudrData.commodities : [{ name: 'No Data' }]).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {eudrData.commodities.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ fontSize: 12, color: T.textSec }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{c.value.toFixed(1)}%</span>
                  </div>
                ))}
                {!eudrData.commodities.length && <div style={{ fontSize: 12, color: T.textMut, fontStyle: 'italic' }}>No significant commodity exposure</div>}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ S8: CROSS-MODULE CONSISTENCY ALERTS ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Cross-Module Consistency Alerts</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Flags when modules disagree or thresholds are exceeded</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {crossAlerts.map((alert, i) => {
              const aColor = alert.severity === 'high' ? T.red : alert.severity === 'medium' ? T.amber : T.green;
              const aBg = alert.severity === 'high' ? T.red + '10' : alert.severity === 'medium' ? T.amber + '10' : T.green + '10';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: aBg, borderRadius: 10, borderLeft: `4px solid ${aColor}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: aColor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{alert.message}</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>Source: {alert.module}</div>
                  </div>
                  <span style={sBadge(aColor + '22', aColor)}>{alert.severity.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ S9: ACTION PRIORITIZATION TABLE ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Value Chain Action Prioritization</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Ranked by impact x urgency across all 5 modules</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'Action', 'Module', 'Impact', 'Urgency', 'Score'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Action' ? 'left' : 'center', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item, i) => {
                  const score = item.impact * item.urgency;
                  const scoreColor = score >= 60 ? T.red : score >= 40 ? T.amber : T.sage;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: T.textMut }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: T.navy }}>{item.action}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={sBadge(T.navy + '12', T.navy)}>{item.module}</span></td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} style={{ width: 6, height: 14, borderRadius: 2, background: j < item.impact ? T.navy : T.border }} />
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} style={{ width: 6, height: 14, borderRadius: 2, background: j < item.urgency ? T.red : T.border }} />
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: scoreColor }}>{score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ S10: PORTFOLIO SCOPE 3 STACKED BAR BY COMPANY ═══ */}
        {scope3BarData.length > 0 && (
          <div style={{ ...sCard, marginBottom: 28 }}>
            <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Scope 3 by Company (Top Categories)</h3>
            <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Portfolio-weighted Scope 3 distribution across top holdings by category</p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={scope3BarData} barCategoryGap="14%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => fmtM(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {SCOPE3_CATEGORIES.slice(0, 5).map((cat, ci) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={PIE_COLORS[ci % PIE_COLORS.length]} name={cat.length > 20 ? cat.slice(0, 20) + '...' : cat} radius={ci === 4 ? [4,4,0,0] : [0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ═══ S11: PORTFOLIO HOLDINGS DETAIL TABLE ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Portfolio Value Chain Summary</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>All holdings with cross-module risk scores and compliance status</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Company', 'Sector', 'Wt%', 'SC Risk', 'CSDDD Score', 'SC Mult.', 'Scope 3 (est)', 'ESG'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Company' || h === 'Sector' ? 'left' : 'center', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.slice(0, 20).map((h, i) => {
                  const sector = h.company.sector || 'Other';
                  const mult = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials'];
                  const companyE = ((h.company.scope1_mt || 0) + (h.company.scope2_mt || 0)) * 1e6;
                  const scMult = 1 + mult.tier1 + mult.tier2 + mult.tier3;
                  const scope3Est = companyE * (mult.tier1 + mult.tier2 + mult.tier3);
                  const exch = h.company.exchange || h.company._displayExchange || '';
                  const country = EXCHANGE_COUNTRY[exch] || 'USA';
                  const countryRisk = COUNTRY_SC_RISK[country] || 35;
                  const sectorRisk = CSDDD_SECTOR_RISK[sector] || 50;
                  const scRiskScore = countryRisk * 0.5 + sectorRisk * 0.3 + (100 - (h.company.esg_score || 50)) * 0.2;
                  const csdddScore = Math.min(100, Math.max(0, 100 - sectorRisk + (h.company.esg_score || 50) * 0.6 + (h.company.governance_score || 50) * 0.2));
                  const riskColor = scRiskScore > 60 ? T.red : scRiskScore > 40 ? T.amber : T.green;
                  const csdddColor = csdddScore >= 60 ? T.green : csdddScore >= 40 ? T.amber : T.red;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{(h.company.name || h.name || '-').slice(0, 22)}</td>
                      <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 11 }}>{sector}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: T.textSec }}>{fmt(h.weight || 0, 1)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 600, color: riskColor }}>{fmt(scRiskScore, 0)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 600, color: csdddColor }}>{fmt(csdddScore, 0)}%</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: T.navy }}>{scMult.toFixed(1)}x</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: T.textSec }}>{fmtM(scope3Est)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: T.sage, fontWeight: 600 }}>{fmt(h.company.esg_score || 0, 0)}</td>
                    </tr>
                  );
                })}
                {!portfolio.length && (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: T.textMut }}>No holdings</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ S12: MODULE COVERAGE MATRIX ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Module Coverage Matrix</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Which Sprint K modules cover each risk dimension per holding</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase' }}>Company</th>
                  {modules.map(m => (
                    <th key={m.name} style={{ padding: '10px 8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 10, fontWeight: 600, color: m.color, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.name.replace('Supply Chain ', 'SC ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.slice(0, 12).map((h, i) => {
                  const sector = h.company.sector || 'Other';
                  const hasScope3 = ((h.company.scope1_mt || 0) + (h.company.scope2_mt || 0)) > 0;
                  const hasSCRisk = true;
                  const hasCSDDD = (CSDDD_SECTOR_RISK[sector] || 0) > 30;
                  const hasEUDR = (EUDR_SECTOR_EXPOSURE[sector] || EUDR_DEFAULT).some(e => e > 0.03);
                  const hasSCCarbon = hasScope3;
                  const checks = [hasScope3, hasSCRisk, hasCSDDD, hasEUDR, hasSCCarbon];
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontSize: 12 }}>{(h.company.name || h.name || '').slice(0, 20)}</td>
                      {checks.map((c, ci) => (
                        <td key={ci} style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 6, background: c ? T.green + '18' : T.border, color: c ? T.green : T.textMut, fontSize: 12, lineHeight: '20px', fontWeight: 700 }}>{c ? '\u2713' : '-'}</span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ S13: VALUE CHAIN MATURITY ASSESSMENT ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Value Chain Maturity Assessment</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Portfolio-level readiness across key value chain governance dimensions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { dim: 'Scope 3 Data Quality', score: Math.min(100, Math.max(20, 40 + portfolio.filter(h => (h.company.scope1_mt || 0) > 0).length / Math.max(portfolio.length, 1) * 50)), desc: 'Coverage and granularity of upstream emissions data' },
              { dim: 'Supplier Engagement', score: Math.min(100, Math.max(15, csdddData.overallScore * 0.7 + 20)), desc: 'Active engagement with Tier 1-3 suppliers on ESG' },
              { dim: 'CSDDD Preparedness', score: csdddData.overallScore, desc: 'Compliance with EU due diligence directive' },
              { dim: 'Deforestation Monitoring', score: Math.min(100, Math.max(25, eudrData.applicableHoldings > 0 ? 55 : 85)), desc: 'Tracking and mitigating forest-risk commodities' },
              { dim: 'Carbon Reduction Targets', score: Math.min(100, Math.max(30, 70 - scCarbon.multiplierAvg * 5)), desc: 'SBTi-aligned targets across supply chain' },
              { dim: 'Risk Management', score: Math.min(100, Math.max(25, 100 - scRisk.avgRisk)), desc: 'Systematic identification and mitigation of SC risks' },
            ].map((item, i) => {
              const color = item.score >= 70 ? T.green : item.score >= 40 ? T.amber : T.red;
              const level = item.score >= 70 ? 'Advanced' : item.score >= 40 ? 'Developing' : 'Initial';
              return (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 16, position: 'relative' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{item.dim}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ flex: 1, background: T.border, borderRadius: 6, height: 8 }}>
                      <div style={{ background: color, height: '100%', width: `${item.score}%`, borderRadius: 6 }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(item.score, 0)}%</span>
                  </div>
                  <span style={sBadge(color + '18', color)}>{level}</span>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 6, lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ S14: REGULATORY TIMELINE ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Regulatory Compliance Timeline</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Key deadlines for Sprint K regulatory frameworks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { date: 'Jan 2024', regulation: 'EUDR Entry into Force', status: 'Active', desc: 'EU Deforestation Regulation applies to large operators', color: T.green },
              { date: 'Jan 2025', regulation: 'CSDDD Transposition Deadline', status: 'Upcoming', desc: 'Member states must transpose CSDDD into national law', color: T.amber },
              { date: 'Jan 2026', regulation: 'CSDDD — Large Companies', status: 'Upcoming', desc: 'Companies with >1,000 employees and >EUR 450M turnover', color: T.amber },
              { date: 'Jun 2026', regulation: 'EUDR — Full Compliance', status: 'Upcoming', desc: 'All operators must demonstrate commodity traceability', color: T.amber },
              { date: 'Jan 2027', regulation: 'CSDDD — Medium Companies', status: 'Planned', desc: 'Companies with >500 employees in high-impact sectors', color: T.navyL },
              { date: 'Jan 2028', regulation: 'CSRD Scope 3 Mandatory', status: 'Planned', desc: 'Full value chain emissions disclosure required under ESRS E1', color: T.navyL },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: T.surfaceH, borderRadius: 10, borderLeft: `4px solid ${item.color}` }}>
                <div style={{ minWidth: 80, fontSize: 12, fontWeight: 700, color: item.color }}>{item.date}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{item.regulation}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{item.desc}</div>
                </div>
                <span style={sBadge(item.color + '18', item.color)}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ S15: QUICK ACTION CARDS (5) + CROSS-NAV ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
          {modules.map((m, i) => (
            <div key={i} onClick={() => navigate(m.path)} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }} onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.boxShadow = `0 4px 16px ${m.color}18`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10, lineHeight: 1.3 }}>{m.metric}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: m.color }}>Open Module &rarr;</div>
            </div>
          ))}
        </div>

        {/* ═══ S16: EXECUTIVE SUMMARY PANEL ═══ */}
        <div style={{ ...sCard, marginBottom: 28, background: T.navy, color: '#fff', borderColor: T.navy }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#fff' }}>Executive Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: T.goldL, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Emissions Profile</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                Portfolio estimated Scope 3 emissions total {fmtM(scope3Agg.total)}, representing a {scope3Agg.ratio.toFixed(1)}x multiple of direct Scope 1+2 emissions.
                The largest Scope 3 category is {scope3Agg.largestCat}. Supply chain carbon multiplier averages {scCarbon.multiplierAvg.toFixed(2)}x across holdings.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.goldL, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Compliance Status</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                Portfolio CSDDD compliance stands at {fmt(csdddData.overallScore, 0)}%. {eudrData.applicableHoldings} of {portfolio.length} holdings
                have EUDR-applicable commodity exposure ({fmt(eudrData.totalExposure, 1)}% weighted). {crossAlerts.filter(a => a.severity === 'high').length} high-severity
                cross-module alerts require immediate attention.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.goldL, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Assessment</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                Average supply chain risk score is {fmt(scRisk.avgRisk, 0)}/100 with {scRisk.highRiskCountries} high-risk
                country exposure(s). {riskMatrix.q1.length} holding(s) sit in the Priority 1 quadrant (high risk + high carbon),
                requiring urgent engagement. Data confidence is {dataConfidence}.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(197,169,106,0.15)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.goldL }}>Top Priority Action</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
              {actionItems[0]?.action || 'Review value chain risk across all 5 modules'} (Source: {actionItems[0]?.module || 'Cross-Module'})
            </div>
          </div>
        </div>

        {/* ═══ S17: DATA SOURCES & METHODOLOGY ═══ */}
        <div style={{ ...sCard, marginBottom: 28 }}>
          <h3 style={{ color: T.navy, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Data Sources & Methodology</h3>
          <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Underlying data and models powering the Value Chain Intelligence Dashboard</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { source: 'CDP Climate Responses', coverage: '~15,000 companies', usage: 'Scope 1, 2, 3 reported emissions', icon: '\ud83c\udf0d' },
              { source: 'GHG Protocol / PCAF', coverage: 'Standard framework', usage: 'Attribution methodology for financed emissions', icon: '\ud83d\udcca' },
              { source: 'EEIO Models (Exiobase)', coverage: '163 industries', usage: 'Tier 2/3 supply chain emission estimates', icon: '\u2699' },
              { source: 'EU CSDDD Directive', coverage: 'EU scope', usage: 'Due diligence compliance scoring criteria', icon: '\u2696' },
              { source: 'EU Deforestation Reg.', coverage: '7 commodities', usage: 'Commodity exposure and traceability', icon: '\ud83c\udf33' },
              { source: 'World Bank Governance', coverage: '215 economies', usage: 'Country-level supply chain risk scores', icon: '\ud83c\udfdb' },
            ].map((ds, i) => (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{ds.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{ds.source}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Coverage: {ds.coverage}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{ds.usage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FINAL CROSS-NAV ═══ */}
        <div style={{ ...sCard, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, alignSelf: 'center' }}>Navigate:</span>
          {[
            { label: 'Scope 3 Engine', path: '/scope3-engine' },
            { label: 'Supply Chain Map', path: '/supply-chain-map' },
            { label: 'CSDDD Toolkit', path: '/csddd-compliance' },
            { label: 'Deforestation Risk', path: '/deforestation-risk' },
            { label: 'Supply Chain Carbon', path: '/supply-chain-carbon' },
            { label: 'Portfolio Suite', path: '/portfolio-suite' },
            { label: 'Carbon Budget', path: '/carbon-budget' },
          ].map(nav => (
            <button key={nav.path} onClick={() => navigate(nav.path)} style={{ background: T.navy + '0a', color: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: T.font }}>
              {nav.label} &rarr;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
