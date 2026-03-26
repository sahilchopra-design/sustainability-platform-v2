import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area, ReferenceLine } from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES } from '../../../data/globalCompanyMaster';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Master lookup ─────────────────────────────────────────────────────────── */
const masterLookup = {};
GLOBAL_COMPANY_MASTER.forEach(c => { masterLookup[c.ticker] = c; });

function enrichFromMaster(holding) {
  const ticker = holding.company?.ticker;
  const master = ticker ? masterLookup[ticker] : null;
  if (!master) return holding;
  return { ...holding, company: { ...holding.company, ...master, ...holding.company }, _masterMatch: true };
}

/* ── 4 Transition Risk Channels ───────────────────────────────────────────── */
const RISK_CHANNELS = [
  { id: 'policy', name: 'Policy & Legal Risk', icon: '\u2696\uFE0F', color: '#dc2626', description: 'Carbon pricing, emissions caps, fossil fuel phase-out regulations, litigation risk' },
  { id: 'technology', name: 'Technology Risk', icon: '\u26A1', color: '#f97316', description: 'Clean energy disruption, stranded technology, R&D obsolescence, electrification pace' },
  { id: 'market', name: 'Market & Demand Risk', icon: '\uD83D\uDCC9', color: '#d97706', description: 'Demand shifts away from high-carbon products, commodity price volatility, consumer preference' },
  { id: 'reputation', name: 'Reputation Risk', icon: '\uD83D\uDCE2', color: '#7c3aed', description: 'ESG rating downgrades, divestment campaigns, greenwashing allegations, social license erosion' },
];

/* ── Sector Transition Risk Scores ────────────────────────────────────────── */
const SECTOR_TRANSITION_RISK = {
  Energy:       { policy: 92, technology: 85, market: 88, reputation: 80, carbonPrice_sensitivity: 0.95, stranding_pct: 35 },
  Utilities:    { policy: 85, technology: 78, market: 72, reputation: 65, carbonPrice_sensitivity: 0.80, stranding_pct: 25 },
  Materials:    { policy: 75, technology: 62, market: 68, reputation: 55, carbonPrice_sensitivity: 0.70, stranding_pct: 18 },
  Industrials:  { policy: 58, technology: 55, market: 52, reputation: 42, carbonPrice_sensitivity: 0.45, stranding_pct: 10 },
  'Consumer Discretionary': { policy: 42, technology: 48, market: 55, reputation: 50, carbonPrice_sensitivity: 0.30, stranding_pct: 5 },
  'Consumer Staples': { policy: 35, technology: 30, market: 38, reputation: 45, carbonPrice_sensitivity: 0.25, stranding_pct: 3 },
  'Real Estate': { policy: 52, technology: 45, market: 42, reputation: 38, carbonPrice_sensitivity: 0.40, stranding_pct: 12 },
  Financials:   { policy: 30, technology: 22, market: 28, reputation: 55, carbonPrice_sensitivity: 0.15, stranding_pct: 2 },
  IT:           { policy: 18, technology: 15, market: 12, reputation: 20, carbonPrice_sensitivity: 0.08, stranding_pct: 1 },
  'Health Care': { policy: 15, technology: 12, market: 10, reputation: 18, carbonPrice_sensitivity: 0.05, stranding_pct: 0 },
  'Communication Services': { policy: 12, technology: 10, market: 8, reputation: 15, carbonPrice_sensitivity: 0.05, stranding_pct: 0 },
};

/* ── Carbon Price Scenarios ───────────────────────────────────────────────── */
const CARBON_PRICE_SCENARIOS = [
  { id: 'current', name: 'Current Policies', price2025: 25, price2030: 45, price2040: 80, price2050: 120, color: '#9ca3af' },
  { id: 'paris', name: 'Paris-Aligned (2\u00B0C)', price2025: 50, price2030: 130, price2040: 250, price2050: 400, color: '#3b82f6' },
  { id: 'netzero', name: 'Net Zero 2050 (1.5\u00B0C)', price2025: 75, price2030: 250, price2040: 500, price2050: 800, color: '#10b981' },
  { id: 'delayed', name: 'Delayed Action', price2025: 15, price2030: 60, price2040: 350, price2050: 1200, color: '#f97316' },
];

/* ── Policy Milestones ────────────────────────────────────────────────────── */
const POLICY_MILESTONES = [
  { year: 2025, event: 'EU CBAM full implementation', risk: 'Carbon border adjustment on imports', sector: 'Materials, Energy' },
  { year: 2025, event: 'CSRD first reporting cycle', risk: 'Mandatory transition plan disclosure', sector: 'All' },
  { year: 2026, event: 'SEC Climate Rule Phase 1', risk: 'Large accelerated filer GHG disclosure', sector: 'All (US listed)' },
  { year: 2027, event: 'EU ETS Phase 5 begins', risk: 'Free allocation reduction accelerates', sector: 'Energy, Materials, Utilities' },
  { year: 2030, event: 'EU Fit for 55 targets', risk: '55% GHG reduction vs 1990', sector: 'All EU' },
  { year: 2030, event: 'IEA NZE coal phase-out (advanced)', risk: 'Unabated coal closure deadline', sector: 'Energy, Utilities' },
  { year: 2035, event: 'EU ICE vehicle ban', risk: 'No new petrol/diesel car sales', sector: 'Consumer Discretionary (auto)' },
  { year: 2040, event: 'IEA NZE oil demand peak', risk: 'Global oil demand declines YoY', sector: 'Energy' },
  { year: 2050, event: 'Net Zero target year (NZAM, NZAOA)', risk: 'Portfolio must achieve net zero', sector: 'All' },
];

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function linearInterpolate(yr, scenario) {
  const pts = [
    { y: 2025, p: scenario.price2025 },
    { y: 2030, p: scenario.price2030 },
    { y: 2040, p: scenario.price2040 },
    { y: 2050, p: scenario.price2050 },
  ];
  if (yr <= pts[0].y) return pts[0].p;
  if (yr >= pts[pts.length - 1].y) return pts[pts.length - 1].p;
  for (let i = 0; i < pts.length - 1; i++) {
    if (yr >= pts[i].y && yr <= pts[i + 1].y) {
      const frac = (yr - pts[i].y) / (pts[i + 1].y - pts[i].y);
      return pts[i].p + frac * (pts[i + 1].p - pts[i].p);
    }
  }
  return pts[0].p;
}

function riskLevel(score) {
  if (score >= 75) return { label: 'Critical', color: '#991b1b', bg: '#fef2f2' };
  if (score >= 50) return { label: 'High', color: '#dc2626', bg: '#fef2f2' };
  if (score >= 30) return { label: 'Medium', color: '#d97706', bg: '#fffbeb' };
  return { label: 'Low', color: '#16a34a', bg: '#f0fdf4' };
}

function riskCellColor(score) {
  if (score >= 75) return '#fecaca';
  if (score >= 50) return '#fed7aa';
  if (score >= 30) return '#fef08a';
  return '#bbf7d0';
}

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
    const v = r[h];
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const fmt = (n, d = 1) => n != null ? n.toFixed(d) : '--';
const fmtM = n => n != null ? (n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(1)}M`) : '--';

const BADGE = (label, color) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>{label}</span>
);

/* ── Per-Holding Transition Risk Calculation ──────────────────────────────── */
function computeHoldingTransitionRisk(holding) {
  const c = holding.company || {};
  const sectorRisk = SECTOR_TRANSITION_RISK[c.sector] || { policy: 30, technology: 25, market: 20, reputation: 20, carbonPrice_sensitivity: 0.20, stranding_pct: 5 };

  const esgAdj = c.esg_score ? (100 - c.esg_score) / 100 : 0.5;
  const sbtiAdj = c.sbti_committed ? 0.7 : 1.0;
  const carbonAdj = c.scope1_mt ? Math.min(2.0, (c.scope1_mt * 1000000 / (c.revenue_usd_mn || 1)) / 200) : 1.0;
  const nzAdj = c.carbon_neutral_target_year && c.carbon_neutral_target_year <= 2050 ? 0.8 : 1.0;

  const channelScores = {
    policy: Math.min(100, sectorRisk.policy * carbonAdj * sbtiAdj * nzAdj),
    technology: Math.min(100, sectorRisk.technology * esgAdj * sbtiAdj),
    market: Math.min(100, sectorRisk.market * carbonAdj * nzAdj),
    reputation: Math.min(100, sectorRisk.reputation * esgAdj * (c.sbti_committed ? 0.6 : 1.0)),
  };

  const compositeTransitionRisk = channelScores.policy * 0.35 + channelScores.technology * 0.25 + channelScores.market * 0.25 + channelScores.reputation * 0.15;

  const annualEmissions = ((c.scope1_mt || 0) + (c.scope2_mt || 0)) * (holding.weight || 0) / 100;
  const carbonCost = {};
  CARBON_PRICE_SCENARIOS.forEach(s => {
    carbonCost[s.id] = {
      cost2030: annualEmissions * s.price2030,
      cost2050: annualEmissions * s.price2050,
    };
  });

  const strandingExposure = (holding.exposure_usd_mn || 0) * (sectorRisk.stranding_pct / 100) * carbonAdj;

  // Raw risk without mitigants
  const rawChannelScores = {
    policy: Math.min(100, sectorRisk.policy * carbonAdj),
    technology: Math.min(100, sectorRisk.technology * 0.5),
    market: Math.min(100, sectorRisk.market * carbonAdj),
    reputation: Math.min(100, sectorRisk.reputation * 0.5),
  };
  const rawComposite = rawChannelScores.policy * 0.35 + rawChannelScores.technology * 0.25 + rawChannelScores.market * 0.25 + rawChannelScores.reputation * 0.15;

  const sbtiDiscount = rawComposite - (rawChannelScores.policy * 0.35 * sbtiAdj + rawChannelScores.technology * 0.25 * sbtiAdj + rawChannelScores.market * 0.25 + rawChannelScores.reputation * 0.15 * (c.sbti_committed ? 0.6 : 1.0));
  const nzDiscount = rawComposite - (rawChannelScores.policy * 0.35 * nzAdj + rawChannelScores.technology * 0.25 + rawChannelScores.market * 0.25 * nzAdj + rawChannelScores.reputation * 0.15);
  const esgDiscount = rawComposite - (rawChannelScores.policy * 0.35 + rawChannelScores.technology * 0.25 * esgAdj + rawChannelScores.market * 0.25 + rawChannelScores.reputation * 0.15 * esgAdj);

  // Transition Readiness Score
  const trs =
    (c.sbti_committed ? 25 : 0) +
    (c.carbon_neutral_target_year && c.carbon_neutral_target_year <= 2050 ? 20 : 0) +
    (c.esg_score && c.esg_score > 65 ? 20 : 0) +
    (compositeTransitionRisk < 50 ? 20 : 0) +
    (c.scope1_mt && c.revenue_usd_mn && (c.scope1_mt / c.revenue_usd_mn) < 0.5 ? 15 : 0);

  return {
    ...holding, channelScores, compositeTransitionRisk, carbonCost, strandingExposure, sectorRisk,
    rawComposite, sbtiDiscount: Math.max(0, sbtiDiscount), nzDiscount: Math.max(0, nzDiscount), esgDiscount: Math.max(0, esgDiscount), trs,
  };
}

/* ── Card / Section style helpers ─────────────────────────────────────────── */
const sectionStyle = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 28, marginBottom: 22 };
const kpiCard = (label, value, sub, color) => (
  <div style={{ flex: '1 1 180px', background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '18px 20px', minWidth: 170 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: 12, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' };

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
function ClimateTransitionRiskPage() {
  const navigate = useNavigate();

  /* ── Portfolio from localStorage ──────────────────────────────────────── */
  const [portfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── State ────────────────────────────────────────────────────────────── */
  const [selectedScenario, setSelectedScenario] = useState('paris');
  const [sortCol, setSortCol] = useState('compositeTransitionRisk');
  const [sortDir, setSortDir] = useState('desc');
  const [strandSort, setStrandSort] = useState('strandingExposure');
  const [strandDir, setStrandDir] = useState('desc');

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  /* ── Enrich & compute transition risk ─────────────────────────────────── */
  const enrichedHoldings = useMemo(() => {
    return holdings.map(h => {
      const enriched = enrichFromMaster(h);
      return computeHoldingTransitionRisk(enriched);
    });
  }, [holdings]);

  /* ── Portfolio-level aggregations ─────────────────────────────────────── */
  const totalWeight = useMemo(() => enrichedHoldings.reduce((s, h) => s + (h.weight || 0), 0) || 1, [enrichedHoldings]);

  const portfolioMetrics = useMemo(() => {
    if (!enrichedHoldings.length) return { composite: 0, policy: 0, technology: 0, market: 0, reputation: 0, carbonCost2030: 0, strandingExposure: 0, sbtiPct: 0, trs: 0 };
    const w = (arr, fn) => arr.reduce((s, h) => s + fn(h) * (h.weight || 0), 0) / totalWeight;
    const sbtiCount = enrichedHoldings.filter(h => h.company?.sbti_committed).reduce((s, h) => s + (h.weight || 0), 0);
    return {
      composite: w(enrichedHoldings, h => h.compositeTransitionRisk),
      policy: w(enrichedHoldings, h => h.channelScores.policy),
      technology: w(enrichedHoldings, h => h.channelScores.technology),
      market: w(enrichedHoldings, h => h.channelScores.market),
      reputation: w(enrichedHoldings, h => h.channelScores.reputation),
      carbonCost2030: enrichedHoldings.reduce((s, h) => s + (h.carbonCost[selectedScenario]?.cost2030 || 0), 0),
      strandingExposure: enrichedHoldings.reduce((s, h) => s + h.strandingExposure, 0),
      sbtiPct: (sbtiCount / totalWeight) * 100,
      trs: w(enrichedHoldings, h => h.trs),
    };
  }, [enrichedHoldings, totalWeight, selectedScenario]);

  /* ── Sorted holdings ──────────────────────────────────────────────────── */
  const sortedHoldings = useMemo(() => {
    const arr = [...enrichedHoldings];
    arr.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'company': av = (a.company?.name || ''); bv = (b.company?.name || ''); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'sector': av = (a.company?.sector || ''); bv = (b.company?.sector || ''); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'weight': av = a.weight || 0; bv = b.weight || 0; break;
        case 'policy': av = a.channelScores.policy; bv = b.channelScores.policy; break;
        case 'technology': av = a.channelScores.technology; bv = b.channelScores.technology; break;
        case 'market': av = a.channelScores.market; bv = b.channelScores.market; break;
        case 'reputation': av = a.channelScores.reputation; bv = b.channelScores.reputation; break;
        case 'compositeTransitionRisk': av = a.compositeTransitionRisk; bv = b.compositeTransitionRisk; break;
        case 'carbonCost': av = a.carbonCost[selectedScenario]?.cost2030 || 0; bv = b.carbonCost[selectedScenario]?.cost2030 || 0; break;
        case 'strandingExposure': av = a.strandingExposure; bv = b.strandingExposure; break;
        case 'trs': av = a.trs; bv = b.trs; break;
        default: av = a.compositeTransitionRisk; bv = b.compositeTransitionRisk;
      }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return 0;
    });
    return arr;
  }, [enrichedHoldings, sortCol, sortDir, selectedScenario]);

  /* ── Stacked bar data for risk channel decomposition ──────────────────── */
  const stackedBarData = useMemo(() => {
    return [...enrichedHoldings]
      .sort((a, b) => b.compositeTransitionRisk - a.compositeTransitionRisk)
      .slice(0, 25)
      .map(h => ({
        ticker: h.company?.ticker || h.holding_id || '?',
        policy: parseFloat(h.channelScores.policy.toFixed(1)),
        technology: parseFloat(h.channelScores.technology.toFixed(1)),
        market: parseFloat(h.channelScores.market.toFixed(1)),
        reputation: parseFloat(h.channelScores.reputation.toFixed(1)),
      }));
  }, [enrichedHoldings]);

  /* ── Carbon price trajectory ─────────────────────────────────────────── */
  const trajectoryData = useMemo(() => {
    const totalEmissions = enrichedHoldings.reduce((sum, h) => sum + ((h.company?.scope1_mt || 0) + (h.company?.scope2_mt || 0)) * ((h.weight || 0) / 100), 0);
    return [2025, 2030, 2035, 2040, 2045, 2050].map(yr => {
      const point = { year: yr };
      CARBON_PRICE_SCENARIOS.forEach(s => {
        const price = linearInterpolate(yr, s);
        point[s.id] = parseFloat((totalEmissions * price).toFixed(2));
      });
      return point;
    });
  }, [enrichedHoldings]);

  /* ── Sector heatmap ──────────────────────────────────────────────────── */
  const sectorHeatmap = useMemo(() => {
    const sectorWeights = {};
    enrichedHoldings.forEach(h => {
      const sec = h.company?.sector || 'Other';
      sectorWeights[sec] = (sectorWeights[sec] || 0) + (h.weight || 0);
    });
    return Object.entries(SECTOR_TRANSITION_RISK)
      .filter(([sec]) => sectorWeights[sec] > 0)
      .map(([sec, data]) => {
        const composite = data.policy * 0.35 + data.technology * 0.25 + data.market * 0.25 + data.reputation * 0.15;
        return { sector: sec, ...data, composite: parseFloat(composite.toFixed(1)), portfolioWeight: parseFloat((sectorWeights[sec] || 0).toFixed(2)) };
      })
      .sort((a, b) => b.composite - a.composite);
  }, [enrichedHoldings]);

  /* ── Stranded asset breakdown by sector ─────────────────────────────── */
  const strandingSectorData = useMemo(() => {
    const sectorMap = {};
    enrichedHoldings.forEach(h => {
      const sec = h.company?.sector || 'Other';
      sectorMap[sec] = (sectorMap[sec] || 0) + h.strandingExposure;
    });
    return Object.entries(sectorMap)
      .filter(([, v]) => v > 0)
      .map(([sector, exposure]) => ({ sector, exposure: parseFloat(exposure.toFixed(2)) }))
      .sort((a, b) => b.exposure - a.exposure);
  }, [enrichedHoldings]);

  const topStrandingHoldings = useMemo(() =>
    [...enrichedHoldings].sort((a, b) => b.strandingExposure - a.strandingExposure).slice(0, 5),
    [enrichedHoldings]
  );

  const totalExposure = enrichedHoldings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0);
  const strandingPct = totalExposure > 0 ? (portfolioMetrics.strandingExposure / totalExposure) * 100 : 0;

  /* ── Mitigation comparison ──────────────────────────────────────────── */
  const mitigationBarData = useMemo(() => {
    if (!enrichedHoldings.length) return [];
    const rawAvg = enrichedHoldings.reduce((s, h) => s + h.rawComposite * (h.weight || 0), 0) / totalWeight;
    return [
      { label: 'Without Mitigants', value: parseFloat(rawAvg.toFixed(1)), color: T.red },
      { label: 'With All Mitigants', value: parseFloat(portfolioMetrics.composite.toFixed(1)), color: T.green },
    ];
  }, [enrichedHoldings, portfolioMetrics.composite, totalWeight]);

  /* ── Export CSV ──────────────────────────────────────────────────────── */
  const handleExport = () => {
    const rows = enrichedHoldings.map(h => ({
      company: h.company?.name || '',
      ticker: h.company?.ticker || '',
      sector: h.company?.sector || '',
      weight_pct: (h.weight || 0).toFixed(2),
      policy_risk: h.channelScores.policy.toFixed(1),
      technology_risk: h.channelScores.technology.toFixed(1),
      market_risk: h.channelScores.market.toFixed(1),
      reputation_risk: h.channelScores.reputation.toFixed(1),
      composite_risk: h.compositeTransitionRisk.toFixed(1),
      carbon_cost_2030_usd_mn: (h.carbonCost[selectedScenario]?.cost2030 || 0).toFixed(2),
      carbon_cost_2050_usd_mn: (h.carbonCost[selectedScenario]?.cost2050 || 0).toFixed(2),
      stranding_exposure_usd_mn: h.strandingExposure.toFixed(2),
      sbti: h.company?.sbti_committed ? 'Yes' : 'No',
      nz_year: h.company?.carbon_neutral_target_year || '',
      esg_score: h.company?.esg_score || '',
      transition_readiness: h.trs,
      risk_level: riskLevel(h.compositeTransitionRisk).label,
      scenario: selectedScenario,
    }));
    downloadCSV(`transition_risk_${selectedScenario}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  /* ── Render empty state ─────────────────────────────────────────────── */
  if (!holdings.length) {
    return (
      <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 32 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>Climate Transition Risk Engine</div>
            {BADGE('NGFS \u00B7 TCFD \u00B7 4 Channels \u00B7 Carbon Pricing', T.navy)}
          </div>
          <div style={{ ...sectionStyle, textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDF0D'}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
            <div style={{ fontSize: 14, color: T.textSec, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
              Build a portfolio in the Portfolio Manager to analyse transition risk decomposition across policy, technology, market, and reputation channels.
            </div>
            <button onClick={() => navigate('/portfolio-manager')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Go to Portfolio Manager
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* ── 1. Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>Climate Transition Risk Engine</div>
            {BADGE('NGFS \u00B7 TCFD \u00B7 4 Channels \u00B7 Carbon Pricing', T.navy)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Export Transition Risk Report
            </button>
          </div>
        </div>

        {/* ── 2. Carbon Price Scenario Selector ──────────────────────────────── */}
        <div style={{ ...sectionStyle, padding: '18px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Carbon Price Scenario</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CARBON_PRICE_SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setSelectedScenario(s.id)}
                style={{
                  padding: '10px 18px', borderRadius: 8, border: `2px solid ${selectedScenario === s.id ? s.color : T.border}`,
                  background: selectedScenario === s.id ? `${s.color}14` : T.surface,
                  color: selectedScenario === s.id ? s.color : T.textSec,
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div>{s.name}</div>
                <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                  2030: ${s.price2030}/t &middot; 2050: ${s.price2050}/t
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. Portfolio KPIs (2 rows x 4) ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          {kpiCard('Composite Transition Risk', fmt(portfolioMetrics.composite, 1), 'Weighted avg (0\u2013100)', riskLevel(portfolioMetrics.composite).color)}
          {kpiCard('Policy Risk', fmt(portfolioMetrics.policy, 1), 'Regulatory & legal channel', RISK_CHANNELS[0].color)}
          {kpiCard('Technology Risk', fmt(portfolioMetrics.technology, 1), 'Clean tech disruption', RISK_CHANNELS[1].color)}
          {kpiCard('Market Risk', fmt(portfolioMetrics.market, 1), 'Demand shift channel', RISK_CHANNELS[2].color)}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          {kpiCard('Reputation Risk', fmt(portfolioMetrics.reputation, 1), 'Social license channel', RISK_CHANNELS[3].color)}
          {kpiCard('Carbon Cost 2030', fmtM(portfolioMetrics.carbonCost2030), CARBON_PRICE_SCENARIOS.find(s => s.id === selectedScenario)?.name || '', T.amber)}
          {kpiCard('Stranded Asset Exposure', fmtM(portfolioMetrics.strandingExposure), 'USD Mn at risk', T.red)}
          {kpiCard('SBTi Coverage', `${fmt(portfolioMetrics.sbtiPct, 1)}%`, 'Mitigates transition risk', T.green)}
        </div>

        {/* ── 4. Risk Channel Decomposition (Stacked Bar) ────────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Risk Channel Decomposition</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Stacked risk scores by holding (top 25 by composite risk, sorted descending)</div>
          {stackedBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={stackedBarData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ticker" angle={-45} textAnchor="end" tick={{ fontSize: 10, fill: T.textSec }} interval={0} height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="policy" stackId="a" name="Policy" fill={RISK_CHANNELS[0].color} />
                <Bar dataKey="technology" stackId="a" name="Technology" fill={RISK_CHANNELS[1].color} />
                <Bar dataKey="market" stackId="a" name="Market" fill={RISK_CHANNELS[2].color} />
                <Bar dataKey="reputation" stackId="a" name="Reputation" fill={RISK_CHANNELS[3].color} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>No data to display</div>
          )}
        </div>

        {/* ── 5. Carbon Price Impact Trajectory (Area Chart) ─────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Carbon Price Impact Trajectory</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Projected annual portfolio carbon cost (USD Mn) under 4 scenarios, 2025\u20132050</div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={trajectoryData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Carbon Cost (USD Mn)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textSec } }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(val) => [`$${val.toFixed(2)}M`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {CARBON_PRICE_SCENARIOS.map(s => (
                <Area key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} fill={s.color} fillOpacity={selectedScenario === s.id ? 0.3 : 0.08} strokeWidth={selectedScenario === s.id ? 3 : 1.5} />
              ))}
              <ReferenceLine x={2030} stroke={T.textMut} strokeDasharray="4 4" label={{ value: '2030', position: 'top', fontSize: 10, fill: T.textMut }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 6. Sector Transition Risk Heatmap ──────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Sector Transition Risk Heatmap</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Sector-level risk scores with portfolio weight exposure (only represented sectors)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Sector', 'Policy', 'Technology', 'Market', 'Reputation', 'Composite', 'Carbon Sensitivity', 'Stranding %', 'Portfolio Wt %'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorHeatmap.map((row, i) => (
                  <tr key={row.sector} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: T.navy }}>{row.sector}</td>
                    <td style={{ ...tdStyle, background: riskCellColor(row.policy), textAlign: 'center', fontWeight: 600 }}>{row.policy}</td>
                    <td style={{ ...tdStyle, background: riskCellColor(row.technology), textAlign: 'center', fontWeight: 600 }}>{row.technology}</td>
                    <td style={{ ...tdStyle, background: riskCellColor(row.market), textAlign: 'center', fontWeight: 600 }}>{row.market}</td>
                    <td style={{ ...tdStyle, background: riskCellColor(row.reputation), textAlign: 'center', fontWeight: 600 }}>{row.reputation}</td>
                    <td style={{ ...tdStyle, background: riskCellColor(row.composite), textAlign: 'center', fontWeight: 700 }}>{row.composite}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{(row.carbonPrice_sensitivity * 100).toFixed(0)}%</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{row.stranding_pct}%</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{row.portfolioWeight.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 7. Holding-Level Transition Risk Table (Sortable) ───────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Holding-Level Transition Risk</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Click column headers to sort. Risk levels: Low (&lt;30) / Medium (30-50) / High (50-75) / Critical (75+)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {[
                    { key: 'company', label: 'Company' }, { key: 'sector', label: 'Sector' }, { key: 'weight', label: 'Wt%' },
                    { key: 'policy', label: 'Policy' }, { key: 'technology', label: 'Tech' }, { key: 'market', label: 'Market' },
                    { key: 'reputation', label: 'Reptn' }, { key: 'compositeTransitionRisk', label: 'Composite' },
                    { key: 'carbonCost', label: 'Carbon Cost 2030' }, { key: 'strandingExposure', label: 'Stranding $' },
                    { key: 'sbti', label: 'SBTi' }, { key: 'nz', label: 'NZ Year' }, { key: 'trs', label: 'TRS' }, { key: 'level', label: 'Risk Level' },
                  ].map(col => (
                    <th key={col.key} style={{ ...thStyle, background: sortCol === col.key ? `${T.navy}10` : 'transparent' }}
                      onClick={() => handleSort(col.key)}>
                      {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                  ))}
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h, i) => {
                  const rl = riskLevel(h.compositeTransitionRisk);
                  return (
                    <tr key={h.holding_id || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: T.navy, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.company?.name || h.holding_id || '--'}</td>
                      <td style={tdStyle}>{h.company?.sector || '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{(h.weight || 0).toFixed(2)}</td>
                      <td style={{ ...tdStyle, background: riskCellColor(h.channelScores.policy), textAlign: 'center', fontWeight: 600 }}>{h.channelScores.policy.toFixed(1)}</td>
                      <td style={{ ...tdStyle, background: riskCellColor(h.channelScores.technology), textAlign: 'center', fontWeight: 600 }}>{h.channelScores.technology.toFixed(1)}</td>
                      <td style={{ ...tdStyle, background: riskCellColor(h.channelScores.market), textAlign: 'center', fontWeight: 600 }}>{h.channelScores.market.toFixed(1)}</td>
                      <td style={{ ...tdStyle, background: riskCellColor(h.channelScores.reputation), textAlign: 'center', fontWeight: 600 }}>{h.channelScores.reputation.toFixed(1)}</td>
                      <td style={{ ...tdStyle, background: riskCellColor(h.compositeTransitionRisk), textAlign: 'center', fontWeight: 800 }}>{h.compositeTransitionRisk.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtM(h.carbonCost[selectedScenario]?.cost2030 || 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtM(h.strandingExposure)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{h.company?.sbti_committed ? BADGE('Yes', T.green) : BADGE('No', T.textMut)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{h.company?.carbon_neutral_target_year || '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{h.trs}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: rl.color, background: rl.bg, border: `1px solid ${rl.color}33`, borderRadius: 4, padding: '2px 8px' }}>{rl.label}</span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => navigate('/holdings-deep-dive', { state: { ticker: h.company?.ticker } })}
                          style={{ fontSize: 10, color: T.navyL, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>
                          Deep-Dive &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 8. Stranded Asset Analysis ──────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 16 }}>Stranded Asset Analysis</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            {kpiCard('Total Stranding Exposure', fmtM(portfolioMetrics.strandingExposure), 'USD Mn at risk of stranding', T.red)}
            {kpiCard('Portfolio % Exposed', `${fmt(strandingPct, 1)}%`, 'of total portfolio exposure', T.amber)}
            {kpiCard('Stranding-Adjusted Value', fmtM(totalExposure - portfolioMetrics.strandingExposure), 'Total exposure minus stranding', T.sage)}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Sector breakdown bar */}
            <div style={{ flex: '1 1 400px', minWidth: 300 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Stranding Exposure by Sector</div>
              {strandingSectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={strandingSectorData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'USD Mn', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: T.textSec } }} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={120} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${v.toFixed(2)}M`, 'Exposure']} />
                    <Bar dataKey="exposure" fill={T.red} radius={[0, 4, 4, 0]}>
                      {strandingSectorData.map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? T.red : idx === 1 ? T.amber : T.gold} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: T.textMut, fontSize: 12 }}>No stranding exposure</div>
              )}
            </div>

            {/* Top 5 stranded holdings */}
            <div style={{ flex: '1 1 400px', minWidth: 300 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Top 5 Stranding Risk Holdings</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Company</th>
                    <th style={thStyle}>Sector</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Exposure $M</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Stranding $M</th>
                  </tr>
                </thead>
                <tbody>
                  {topStrandingHoldings.map((h, i) => (
                    <tr key={h.holding_id || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: T.navy }}>{h.company?.name || '--'}</td>
                      <td style={tdStyle}>{h.company?.sector || '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtM(h.exposure_usd_mn || 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: T.red }}>{fmtM(h.strandingExposure)}</td>
                    </tr>
                  ))}
                  {topStrandingHoldings.length === 0 && (
                    <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: T.textMut }}>No stranding exposure detected</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 9. Mitigation Factor Analysis ───────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Mitigation Factor Analysis</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Impact of SBTi, Net Zero targets, and ESG scores on reducing transition risk</div>

          {/* Comparison bar chart */}
          <div style={{ marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={mitigationBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: T.text, fontWeight: 600 }} width={150} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v.toFixed(1), 'Risk Score']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {mitigationBarData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Holding-level mitigants table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Company', 'Raw Risk', 'SBTi Discount', 'NZ Discount', 'ESG Discount', 'Net Risk', 'Reduction'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...enrichedHoldings].sort((a, b) => b.rawComposite - a.rawComposite).slice(0, 15).map((h, i) => {
                  const reduction = h.rawComposite - h.compositeTransitionRisk;
                  const reductionPct = h.rawComposite > 0 ? (reduction / h.rawComposite) * 100 : 0;
                  return (
                    <tr key={h.holding_id || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: T.navy }}>{h.company?.name || '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{h.rawComposite.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: h.sbtiDiscount > 0 ? T.green : T.textMut }}>{h.sbtiDiscount > 0 ? `-${h.sbtiDiscount.toFixed(1)}` : '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: h.nzDiscount > 0 ? T.green : T.textMut }}>{h.nzDiscount > 0 ? `-${h.nzDiscount.toFixed(1)}` : '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: h.esgDiscount > 0 ? T.green : T.textMut }}>{h.esgDiscount > 0 ? `-${h.esgDiscount.toFixed(1)}` : '--'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, background: riskCellColor(h.compositeTransitionRisk) }}>{h.compositeTransitionRisk.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: reductionPct > 0 ? T.green : T.textMut, fontWeight: 600 }}>
                        {reductionPct > 0 ? `-${reductionPct.toFixed(1)}%` : '0%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 10. Policy Timeline ─────────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Regulatory & Policy Timeline</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 20 }}>Key policy milestones driving transition risk from 2025 to 2050</div>
          <div style={{ position: 'relative', paddingLeft: 40 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${T.green}, ${T.amber}, ${T.red})`, borderRadius: 2 }} />
            {POLICY_MILESTONES.map((m, i) => {
              const urgency = m.year <= 2027 ? T.red : m.year <= 2035 ? T.amber : T.textSec;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, position: 'relative' }}>
                  {/* Year dot */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: urgency, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, position: 'relative', zIndex: 1, flexShrink: 0,
                  }}>{m.year}</div>
                  <div style={{ background: T.surfaceH, borderRadius: 10, padding: '12px 18px', flex: 1, border: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: T.navy, marginBottom: 2 }}>{m.event}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{m.risk}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {m.sector.split(',').map(s => (
                        <span key={s.trim()} style={{ fontSize: 10, fontWeight: 600, color: urgency, background: `${urgency}12`, border: `1px solid ${urgency}30`, borderRadius: 4, padding: '1px 6px' }}>
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 11. Transition Readiness Score ──────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Transition Readiness Score (TRS)</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 20 }}>
            Composite readiness metric (0\u2013100): SBTi (+25) + Net Zero Target (+20) + ESG&gt;65 (+20) + Low T-Risk (+20) + Low Carbon Intensity (+15)
          </div>

          {/* Portfolio-level gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke={T.border} strokeWidth="12" />
                <circle cx="70" cy="70" r="58" fill="none"
                  stroke={portfolioMetrics.trs >= 60 ? T.green : portfolioMetrics.trs >= 35 ? T.amber : T.red}
                  strokeWidth="12"
                  strokeDasharray={`${(portfolioMetrics.trs / 100) * 364.4} 364.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)" />
                <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="900" fill={T.navy}>{fmt(portfolioMetrics.trs, 0)}</text>
                <text x="70" y="84" textAnchor="middle" fontSize="10" fill={T.textSec} fontWeight="600">/ 100</text>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>Portfolio Weighted TRS</div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
                {portfolioMetrics.trs >= 60 ? 'Good transition readiness. Most holdings have credible decarbonisation commitments.'
                  : portfolioMetrics.trs >= 35 ? 'Moderate readiness. Some holdings lack SBTi or net zero targets.'
                  : 'Low readiness. Significant transition gaps across the portfolio.'}
              </div>
            </div>
          </div>

          {/* Per-holding progress bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
            {[...enrichedHoldings].sort((a, b) => b.trs - a.trs).map((h, i) => {
              const barColor = h.trs >= 60 ? T.green : h.trs >= 35 ? T.amber : T.red;
              return (
                <div key={h.holding_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surfaceH, borderRadius: 8, padding: '8px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {h.company?.ticker || h.holding_id || '--'}
                  </div>
                  <div style={{ flex: 1, height: 14, background: T.border, borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${h.trs}%`, height: '100%', background: barColor, borderRadius: 7, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: barColor, width: 34, textAlign: 'right', flexShrink: 0 }}>{h.trs}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 13. Cross-Module Links ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          {[
            { label: 'View Physical Risk', path: '/climate-physical-risk', icon: '\uD83C\uDF0A' },
            { label: 'View Scenario Stress Test', path: '/scenario-stress-test', icon: '\uD83D\uDCC8' },
            { label: 'Optimize Portfolio', path: '/portfolio-optimizer', icon: '\u2699\uFE0F' },
          ].map(link => (
            <button key={link.path} onClick={() => navigate(link.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px',
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
                color: T.navy, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
              <span>{link.icon}</span>
              <span>{link.label} &rarr;</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

export default ClimateTransitionRiskPage;
