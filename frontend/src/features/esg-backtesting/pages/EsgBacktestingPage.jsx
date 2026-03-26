import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, Cell, AreaChart, Area, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ============================================================================
   BACKTESTING ENGINE
   ============================================================================ */

/** Box-Muller: standard normal variate */
function boxMuller() {
  let u1 = Math.random(), u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/** Factor definitions with historical characteristics */
const FACTORS = [
  { id:'esg_quality',       name:'ESG Quality',       annualReturn:0.021,  annualVol:0.08,  autoCorrelation:0.10, color:'#16a34a', description:'Long high-ESG, short low-ESG' },
  { id:'carbon_transition',  name:'Carbon Transition',  annualReturn:-0.015, annualVol:0.12,  autoCorrelation:0.15, color:'#dc2626', description:'Impact of carbon pricing on high-emitters' },
  { id:'esg_momentum',       name:'ESG Momentum',       annualReturn:0.012,  annualVol:0.06,  autoCorrelation:0.20, color:'#2563eb', description:'Companies with improving ESG scores' },
  { id:'green_innovation',   name:'Green Innovation',   annualReturn:0.035,  annualVol:0.18,  autoCorrelation:0.05, color:'#0d9488', description:'Clean tech and green patent holders' },
  { id:'governance_quality', name:'Governance Quality', annualReturn:0.010,  annualVol:0.05,  autoCorrelation:0.10, color:'#7c3aed', description:'Strong board, transparency, anti-corruption' },
  { id:'social_impact',      name:'Social Impact',      annualReturn:0.008,  annualVol:0.07,  autoCorrelation:0.10, color:'#d97706', description:'Labor practices, community engagement' },
  { id:'market',             name:'Market (Benchmark)', annualReturn:0.082,  annualVol:0.16,  autoCorrelation:0.08, color:'#9ca3af', description:'MSCI ACWI benchmark return' },
];

const FACTOR_MAP = {};
FACTORS.forEach(f => { FACTOR_MAP[f.id] = f; });

/** Factor cross-correlation matrix (7x7) */
const FACTOR_CORR = [
  /*               ESG_Q  CARB   MOM    GREEN  GOV    SOC    MKT   */
  /* ESG_Q   */ [  1.00,  -0.30,  0.45,  0.35,  0.55,  0.40,  0.15],
  /* CARB    */ [ -0.30,   1.00, -0.20, -0.40, -0.15, -0.10,  0.25],
  /* MOM     */ [  0.45,  -0.20,  1.00,  0.30,  0.25,  0.20,  0.10],
  /* GREEN   */ [  0.35,  -0.40,  0.30,  1.00,  0.20,  0.25, -0.05],
  /* GOV     */ [  0.55,  -0.15,  0.25,  0.20,  1.00,  0.35,  0.20],
  /* SOC     */ [  0.40,  -0.10,  0.20,  0.25,  0.35,  1.00,  0.15],
  /* MKT     */ [  0.15,   0.25,  0.10, -0.05,  0.20,  0.15,  1.00],
];

/** Generate factor returns with autocorrelation (AR(1) process) */
function generateFactorReturns(factorConfig, periods) {
  const monthlyReturn = factorConfig.annualReturn / 12;
  const monthlyVol = factorConfig.annualVol / Math.sqrt(12);
  const returns = [];
  let prev = 0;
  for (let t = 0; t < periods; t++) {
    const innovation = boxMuller() * monthlyVol;
    const ret = monthlyReturn + factorConfig.autoCorrelation * prev + innovation;
    returns.push(ret);
    prev = ret - monthlyReturn;
  }
  return returns;
}

/** Compute maximum drawdown from a cumulative return series */
function computeMaxDrawdown(cumulativeValues) {
  let peak = -Infinity;
  let maxDD = 0;
  const ddSeries = [];
  for (let i = 0; i < cumulativeValues.length; i++) {
    if (cumulativeValues[i] > peak) peak = cumulativeValues[i];
    const dd = peak > 0 ? (cumulativeValues[i] - peak) / peak : 0;
    maxDD = Math.min(maxDD, dd);
    ddSeries.push(dd);
  }
  return { maxDD, ddSeries };
}

/** Core backtest engine */
function runBacktest(selectedFactors, weights, lookbackYears, rebalanceFreq) {
  const periods = lookbackYears * 12;

  // Generate all factor returns
  const factorReturns = {};
  FACTORS.forEach(f => {
    factorReturns[f.id] = generateFactorReturns(f, periods);
  });

  // Normalize weights
  const totalWeight = selectedFactors.reduce((s, fId) => s + (weights[fId] || 0), 0) || 1;
  const normWeights = {};
  selectedFactors.forEach(fId => { normWeights[fId] = (weights[fId] || 0) / totalWeight; });

  // Rebalance periods (monthly=1, quarterly=3, annual=12)
  const rebalPeriod = rebalanceFreq === 'quarterly' ? 3 : rebalanceFreq === 'annual' ? 12 : 1;

  // Portfolio return = weighted sum of selected factor returns
  const portfolioReturns = [];
  let driftWeights = { ...normWeights };

  for (let t = 0; t < periods; t++) {
    // Rebalance check
    if (t > 0 && t % rebalPeriod === 0) {
      driftWeights = { ...normWeights };
    }

    let ret = 0;
    selectedFactors.forEach(fId => {
      ret += (driftWeights[fId] || 0) * factorReturns[fId][t];
    });
    portfolioReturns.push(ret);

    // Drift weights based on returns (multiplicative)
    if (rebalPeriod > 1) {
      let sumDW = 0;
      selectedFactors.forEach(fId => {
        driftWeights[fId] = (driftWeights[fId] || 0) * (1 + factorReturns[fId][t]);
        sumDW += driftWeights[fId];
      });
      if (sumDW > 0) selectedFactors.forEach(fId => { driftWeights[fId] /= sumDW; });
    }
  }

  // Benchmark = market factor
  const benchmarkReturns = factorReturns['market'];

  // Cumulative returns
  const cumulativePortfolio = [1];
  const cumulativeBenchmark = [1];
  for (let t = 0; t < periods; t++) {
    cumulativePortfolio.push(cumulativePortfolio[t] * (1 + portfolioReturns[t]));
    cumulativeBenchmark.push(cumulativeBenchmark[t] * (1 + benchmarkReturns[t]));
  }

  // Performance metrics
  const finalPortfolio = cumulativePortfolio[periods];
  const finalBenchmark = cumulativeBenchmark[periods];
  const annualizedReturn = Math.pow(finalPortfolio, 12 / periods) - 1;
  const annualizedBenchReturn = Math.pow(finalBenchmark, 12 / periods) - 1;

  // Annualized volatility
  const meanRet = portfolioReturns.reduce((s, r) => s + r, 0) / periods;
  const variance = portfolioReturns.reduce((s, r) => s + (r - meanRet) ** 2, 0) / (periods - 1);
  const annualizedVol = Math.sqrt(variance) * Math.sqrt(12);

  // Sharpe ratio (Rf = 4% annual = 0.333% monthly)
  const rf = 0.04;
  const sharpeRatio = annualizedVol > 0 ? (annualizedReturn - rf) / annualizedVol : 0;

  // Max drawdown
  const { maxDD: maxDrawdown, ddSeries } = computeMaxDrawdown(cumulativePortfolio);

  // Tracking error and information ratio
  const activeReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
  const meanActive = activeReturns.reduce((s, r) => s + r, 0) / periods;
  const activeVariance = activeReturns.reduce((s, r) => s + (r - meanActive) ** 2, 0) / (periods - 1);
  const trackingError = Math.sqrt(activeVariance) * Math.sqrt(12);
  const alpha = annualizedReturn - annualizedBenchReturn;
  const infoRatio = trackingError > 0 ? alpha / trackingError : 0;

  // Win rate
  const winRate = portfolioReturns.filter(r => r > 0).length / periods * 100;

  // Monthly chart data with factor attribution
  const monthLabels = [];
  const startYear = 2026 - lookbackYears;
  for (let t = 0; t <= periods; t++) {
    const yr = startYear + Math.floor(t / 12);
    const mo = (t % 12);
    monthLabels.push(`${yr}-${String(mo + 1).padStart(2, '0')}`);
  }

  const chartData = monthLabels.map((label, t) => {
    const row = { month: label, portfolio: parseFloat(cumulativePortfolio[t].toFixed(4)), benchmark: parseFloat(cumulativeBenchmark[t].toFixed(4)), drawdown: t < ddSeries.length ? parseFloat((ddSeries[t] * 100).toFixed(2)) : 0 };
    // Factor contributions for this month (t-1 because returns are 0-indexed)
    if (t > 0) {
      selectedFactors.forEach(fId => {
        row[`contrib_${fId}`] = parseFloat((normWeights[fId] * factorReturns[fId][t - 1] * 100).toFixed(3));
      });
    }
    return row;
  });

  // Rolling 12-month Sharpe
  const rollingSharpe = [];
  const monthlyRf = rf / 12;
  for (let t = 12; t <= periods; t++) {
    const window = portfolioReturns.slice(t - 12, t);
    const wMean = window.reduce((s, r) => s + r, 0) / 12;
    const wVar = window.reduce((s, r) => s + (r - wMean) ** 2, 0) / 11;
    const wVol = Math.sqrt(wVar) * Math.sqrt(12);
    const wRet = Math.pow(window.reduce((p, r) => p * (1 + r), 1), 1) - 1;
    const annRet = Math.pow(1 + wRet, 1) - 1; // already 12-month
    const rSharpe = wVol > 0 ? ((wMean - monthlyRf) * Math.sqrt(12)) / (Math.sqrt(wVar) * Math.sqrt(12)) : 0;
    rollingSharpe.push({ month: monthLabels[t], sharpe: parseFloat(rSharpe.toFixed(3)) });
  }

  // Annual returns breakdown
  const annualReturns = [];
  for (let y = 0; y < lookbackYears; y++) {
    const startIdx = y * 12;
    const endIdx = Math.min((y + 1) * 12, periods);
    const pRet = cumulativePortfolio[endIdx] / cumulativePortfolio[startIdx] - 1;
    const bRet = cumulativeBenchmark[endIdx] / cumulativeBenchmark[startIdx] - 1;
    annualReturns.push({
      year: startYear + y,
      portfolio: parseFloat((pRet * 100).toFixed(2)),
      benchmark: parseFloat((bRet * 100).toFixed(2)),
      alpha: parseFloat(((pRet - bRet) * 100).toFixed(2)),
    });
  }

  // Per-factor performance
  const factorPerformance = FACTORS.map(f => {
    const rets = factorReturns[f.id];
    const cumul = [1];
    for (let t = 0; t < periods; t++) cumul.push(cumul[t] * (1 + rets[t]));
    const fAnnRet = Math.pow(cumul[periods], 12 / periods) - 1;
    const fMean = rets.reduce((s, r) => s + r, 0) / periods;
    const fVar = rets.reduce((s, r) => s + (r - fMean) ** 2, 0) / (periods - 1);
    const fVol = Math.sqrt(fVar) * Math.sqrt(12);
    const fSharpe = fVol > 0 ? (fAnnRet - rf) / fVol : 0;
    const { maxDD: fDD } = computeMaxDrawdown(cumul);
    // Correlation to market
    const mRets = factorReturns['market'];
    const mMean = mRets.reduce((s, r) => s + r, 0) / periods;
    let cov = 0, mVar2 = 0, fVar2 = 0;
    for (let t = 0; t < periods; t++) {
      cov += (rets[t] - fMean) * (mRets[t] - mMean);
      mVar2 += (mRets[t] - mMean) ** 2;
      fVar2 += (rets[t] - fMean) ** 2;
    }
    const corrToMarket = (mVar2 > 0 && fVar2 > 0) ? cov / Math.sqrt(mVar2 * fVar2) : 0;

    return {
      ...f,
      annReturn: parseFloat((fAnnRet * 100).toFixed(2)),
      annVol: parseFloat((fVol * 100).toFixed(2)),
      sharpe: parseFloat(fSharpe.toFixed(3)),
      maxDD: parseFloat((fDD * 100).toFixed(2)),
      corrToMarket: parseFloat(corrToMarket.toFixed(3)),
      selected: selectedFactors.includes(f.id),
      weight: normWeights[f.id] || 0,
    };
  });

  // Sensitivity: what happens to Sharpe when changing each factor weight +/- 10%
  const sensitivity = selectedFactors.map(fId => {
    const baseW = normWeights[fId];
    const results = [];
    for (const delta of [-0.10, -0.05, 0, 0.05, 0.10]) {
      const adjWeights = { ...normWeights };
      adjWeights[fId] = Math.max(0, baseW + delta);
      // Re-normalize
      const tW = Object.values(adjWeights).reduce((s, v) => s + v, 0) || 1;
      Object.keys(adjWeights).forEach(k => { adjWeights[k] /= tW; });
      // Quick Sharpe estimate
      let pRet = 0, pVar = 0;
      for (let t = 0; t < periods; t++) {
        let r = 0;
        selectedFactors.forEach(id => { r += adjWeights[id] * factorReturns[id][t]; });
        pRet += r;
        pVar += r * r;
      }
      pRet /= periods;
      pVar = pVar / periods - pRet * pRet;
      const aRet = pRet * 12;
      const aVol = Math.sqrt(Math.max(0, pVar)) * Math.sqrt(12);
      const s = aVol > 0 ? (aRet - rf) / aVol : 0;
      results.push({ delta: `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`, sharpe: parseFloat(s.toFixed(3)) });
    }
    return { factorId: fId, name: FACTOR_MAP[fId].name, results };
  });

  // Risk-return scatter data
  const scatterData = factorPerformance.filter(f => f.id !== 'market').map(f => ({
    name: f.name, x: f.annVol, y: f.annReturn, sharpe: f.sharpe, color: f.color, size: Math.max(20, Math.abs(f.sharpe) * 200),
  }));

  return {
    annualizedReturn, annualizedVol, sharpeRatio, maxDrawdown, trackingError, infoRatio, alpha, winRate,
    chartData, rollingSharpe, annualReturns, factorPerformance, sensitivity, scatterData,
    portfolioReturns, benchmarkReturns, periods, factorReturns, normWeights,
  };
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
const masterLookup = {};
GLOBAL_COMPANY_MASTER.forEach(c => { masterLookup[c.ticker] = c; });

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
    const v = r[h]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const fmt = (v, d = 2) => v != null ? v.toFixed(d) : '--';
const fmtPct = (v) => v != null ? `${(v * 100).toFixed(2)}%` : '--';

/** Correlation heatmap color */
function corrColor(val) {
  if (val >= 0.4) return '#16a34a';
  if (val >= 0.2) return '#86efac';
  if (val >= -0.1) return '#e5e7eb';
  if (val >= -0.3) return '#fca5a5';
  return '#dc2626';
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
function EsgBacktestingPage() {
  const navigate = useNavigate();

  // Portfolio from localStorage
  const [portfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const rawHoldings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  const isDemo = rawHoldings.length === 0;

  // Controls
  const [selectedFactors, setSelectedFactors] = useState(['esg_quality', 'carbon_transition', 'esg_momentum', 'green_innovation', 'governance_quality', 'social_impact']);
  const [weights, setWeights] = useState({
    esg_quality: 25, carbon_transition: 15, esg_momentum: 20, green_innovation: 20, governance_quality: 10, social_impact: 10,
  });
  const [lookback, setLookback] = useState(5);
  const [rebalance, setRebalance] = useState('monthly');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  // Table sorts
  const [factorSort, setFactorSort] = useState('annReturn');
  const [factorSortDir, setFactorSortDir] = useState('desc');

  // Toggle factor
  const toggleFactor = useCallback((fId) => {
    setSelectedFactors(prev => {
      if (prev.includes(fId)) return prev.filter(id => id !== fId);
      return [...prev, fId];
    });
  }, []);

  // Set weight
  const setFactorWeight = useCallback((fId, val) => {
    setWeights(prev => ({ ...prev, [fId]: Math.max(0, Math.min(100, val)) }));
  }, []);

  // Normalized weights display
  const normalizedWeights = useMemo(() => {
    const total = selectedFactors.reduce((s, id) => s + (weights[id] || 0), 0) || 1;
    const nw = {};
    selectedFactors.forEach(id => { nw[id] = ((weights[id] || 0) / total * 100); });
    return nw;
  }, [selectedFactors, weights]);

  // Run backtest
  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const normalizedW = {};
      const total = selectedFactors.reduce((s, id) => s + (weights[id] || 0), 0) || 1;
      selectedFactors.forEach(id => { normalizedW[id] = (weights[id] || 0) / total; });
      const res = runBacktest(selectedFactors, normalizedW, lookback, rebalance);
      setResults(res);
      setIsRunning(false);
    }, 50);
  }, [selectedFactors, weights, lookback, rebalance]);

  // Sorted factor performance
  const sortedFactorPerf = useMemo(() => {
    if (!results) return [];
    return [...results.factorPerformance].sort((a, b) => {
      const va = a[factorSort], vb = b[factorSort];
      return factorSortDir === 'desc' ? (vb || 0) - (va || 0) : (va || 0) - (vb || 0);
    });
  }, [results, factorSort, factorSortDir]);

  // Exports
  const handleExportCSV = useCallback(() => {
    if (!results) return;
    downloadCSV('esg_backtest_results.csv', results.annualReturns);
  }, [results]);
  const handleExportJSON = useCallback(() => {
    if (!results) return;
    downloadJSON('esg_backtest_config.json', {
      selectedFactors, weights, lookback, rebalance,
      annualizedReturn: results.annualizedReturn, sharpeRatio: results.sharpeRatio,
      maxDrawdown: results.maxDrawdown, trackingError: results.trackingError,
      timestamp: new Date().toISOString(),
    });
  }, [results, selectedFactors, weights, lookback, rebalance]);
  const handlePrint = useCallback(() => { window.print(); }, []);

  // === STYLES ===
  const sty = {
    page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '24px 32px' },
    header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
    h1: { fontSize:28, fontWeight:700, color:T.navy, margin:0, letterSpacing:'-0.02em' },
    badge: { display:'inline-block', background:`${T.gold}18`, color:T.gold, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20, marginLeft:12, letterSpacing:'0.03em' },
    subtitle: { fontSize:13, color:T.textSec, marginTop:4 },
    card: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'20px 24px', marginBottom:20 },
    sectionTitle: { fontSize:16, fontWeight:700, color:T.navy, marginBottom:14 },
    kpiRow: { display:'flex', gap:14, flexWrap:'wrap', marginBottom:20 },
    kpi: { flex:'1 1 140px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 18px', minWidth:140 },
    kpiLabel: { fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 },
    kpiVal: { fontSize:22, fontWeight:700, color:T.navy },
    kpiSub: { fontSize:11, color:T.textSec, marginTop:2 },
    controlRow: { display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap', marginBottom:16 },
    controlGroup: { display:'flex', flexDirection:'column', gap:4 },
    controlLabel: { fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.05em' },
    select: { padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.surface, cursor:'pointer' },
    btn: { padding:'10px 24px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font, transition:'all 0.2s' },
    btnPrimary: { background:T.navy, color:'#fff' },
    btnSec: { background:T.surfaceH, color:T.navy, border:`1px solid ${T.border}` },
    btnGold: { background:`${T.gold}20`, color:T.gold, border:`1px solid ${T.gold}40` },
    table: { width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font },
    th: { padding:'10px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer', userSelect:'none' },
    td: { padding:'9px 12px', borderBottom:`1px solid ${T.border}`, color:T.text },
    demoBar: { background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:10, padding:'12px 18px', marginBottom:20, fontSize:13, color:'#92400e' },
    navRow: { display:'flex', gap:10, flexWrap:'wrap', marginTop:8 },
    navBtn: { padding:'6px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surfaceH, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:T.font, color:T.navy },
    progress: { display:'inline-block', width:16, height:16, border:`3px solid ${T.border}`, borderTop:`3px solid ${T.navy}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', marginRight:8, verticalAlign:'middle' },
    mono: { fontFamily:'monospace', fontSize:12 },
    checkbox: { width:16, height:16, cursor:'pointer', accentColor:T.navy },
    slider: { width:120, cursor:'pointer', accentColor:T.navy },
    factorCard: (selected, color) => ({
      background: selected ? `${color}08` : T.surface,
      border: `2px solid ${selected ? color : T.border}`,
      borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.2s',
    }),
  };

  return (
    <div style={sty.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media print { body { -webkit-print-color-adjust: exact; } }`}</style>

      {/* ── S1: Header ──────────────────────────────────────────────────── */}
      <div style={sty.header}>
        <div>
          <h1 style={sty.h1}>
            ESG Factor Backtesting Engine
            <span style={sty.badge}>7 Factors - Sharpe - Drawdown - {lookback}yr</span>
          </h1>
          <div style={sty.subtitle}>Multi-factor ESG backtest with AR(1) return generation, rolling analytics, and sensitivity analysis</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportCSV} disabled={!results}>Export CSV</button>
          <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportJSON} disabled={!results}>Export JSON</button>
          <button style={{ ...sty.btn, ...sty.btnGold }} onClick={handlePrint}>Print</button>
        </div>
      </div>

      {isDemo && <div style={sty.demoBar}>Factor-level backtest does not require portfolio holdings. Simulation uses synthetic factor return series calibrated to historical ESG factor characteristics.</div>}

      {/* ── S2: Factor Selection Panel ──────────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Factor Selection & Weights</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12, marginBottom:16 }}>
          {FACTORS.filter(f => f.id !== 'market').map(f => {
            const isSelected = selectedFactors.includes(f.id);
            return (
              <div key={f.id} style={sty.factorCard(isSelected, f.color)} onClick={() => toggleFactor(f.id)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleFactor(f.id)} style={sty.checkbox} onClick={e => e.stopPropagation()} />
                    <span style={{ fontWeight:700, fontSize:13, color: isSelected ? f.color : T.textSec }}>{f.name}</span>
                  </div>
                  <span style={{ fontSize:11, color:T.textMut }}>{f.annualReturn > 0 ? '+' : ''}{(f.annualReturn * 100).toFixed(1)}% / {(f.annualVol * 100).toFixed(0)}% vol</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>{f.description}</div>
                {isSelected && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize:11, fontWeight:600, color:T.textMut, minWidth:45 }}>Weight:</span>
                    <input type="range" min={0} max={100} value={weights[f.id] || 0} onChange={e => setFactorWeight(f.id, Number(e.target.value))} style={sty.slider} />
                    <span style={{ ...sty.mono, minWidth:40, textAlign:'right' }}>{weights[f.id] || 0}%</span>
                    <span style={{ fontSize:10, color:T.textMut }}>(eff: {fmt(normalizedWeights[f.id] || 0, 1)}%)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={sty.controlRow}>
          <div style={sty.controlGroup}>
            <span style={sty.controlLabel}>Lookback Period</span>
            <select style={sty.select} value={lookback} onChange={e => setLookback(Number(e.target.value))}>
              <option value={1}>1 Year</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
            </select>
          </div>
          <div style={sty.controlGroup}>
            <span style={sty.controlLabel}>Rebalancing</span>
            <select style={sty.select} value={rebalance} onChange={e => setRebalance(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <button
            style={{ ...sty.btn, ...sty.btnPrimary, opacity: isRunning ? 0.6 : 1 }}
            onClick={handleRun}
            disabled={isRunning || selectedFactors.length === 0}
          >
            {isRunning ? <><span style={sty.progress} /> Running...</> : 'Run Backtest'}
          </button>
          <div style={{ fontSize:11, color:T.textMut, alignSelf:'center' }}>
            {selectedFactors.length} factors selected | {lookback * 12} monthly periods
          </div>
        </div>
      </div>

      {/* ── S3: KPI Cards ───────────────────────────────────────────────── */}
      {results && (
        <div style={sty.kpiRow}>
          {[
            { label:'Annualized Return', value:`${fmt(results.annualizedReturn * 100, 2)}%`, color: results.annualizedReturn >= 0 ? T.green : T.red, sub:'Factor-weighted portfolio' },
            { label:'Annualized Vol', value:`${fmt(results.annualizedVol * 100, 2)}%`, color:T.navy, sub:'Portfolio volatility' },
            { label:'Sharpe Ratio', value: fmt(results.sharpeRatio, 3), color: results.sharpeRatio > 0.5 ? T.green : results.sharpeRatio > 0 ? T.amber : T.red, sub:'Risk-adjusted return (Rf=4%)' },
            { label:'Max Drawdown', value:`${fmt(results.maxDrawdown * 100, 2)}%`, color:T.red, sub:'Largest peak-to-trough' },
            { label:'Tracking Error', value:`${fmt(results.trackingError * 100, 2)}%`, color:T.textSec, sub:'Active risk vs benchmark' },
            { label:'Information Ratio', value: fmt(results.infoRatio, 3), color: results.infoRatio > 0.5 ? T.green : T.amber, sub:'Alpha per unit tracking error' },
            { label:'Alpha', value:`${results.alpha >= 0 ? '+' : ''}${fmt(results.alpha * 100, 2)}%`, color: results.alpha >= 0 ? T.green : T.red, sub:'Excess return vs MSCI ACWI' },
            { label:'Win Rate', value:`${fmt(results.winRate, 1)}%`, color: results.winRate > 55 ? T.green : T.amber, sub:'% of positive months' },
          ].map((k, i) => (
            <div key={i} style={sty.kpi}>
              <div style={sty.kpiLabel}>{k.label}</div>
              <div style={{ ...sty.kpiVal, color: k.color }}>{k.value}</div>
              <div style={sty.kpiSub}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── S4: Cumulative Performance ──────────────────────────────────── */}
      {results && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Cumulative Performance: Portfolio vs Benchmark</div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={results.chartData} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize:9, fill:T.textMut }} interval={Math.max(1, Math.floor(results.chartData.length / 12))} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Growth of $1', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }} formatter={(v, name) => [v.toFixed(4), name === 'portfolio' ? 'Portfolio' : 'Benchmark']} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Area type="monotone" dataKey="portfolio" stroke={T.navy} fill={`${T.navy}15`} strokeWidth={2} name="Portfolio" />
              <Area type="monotone" dataKey="benchmark" stroke={T.textMut} fill={`${T.textMut}10`} strokeWidth={1.5} strokeDasharray="4 3" name="Benchmark" />
              <ReferenceLine y={1} stroke={T.border} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── S5: Drawdown Chart ─────────────────────────────────────────── */}
      {results && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Drawdown from Peak</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={results.chartData} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize:9, fill:T.textMut }} interval={Math.max(1, Math.floor(results.chartData.length / 12))} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Drawdown %', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }} formatter={(v) => [`${v.toFixed(2)}%`, 'Drawdown']} />
              <Area type="monotone" dataKey="drawdown" stroke={T.red} fill={`${T.red}20`} strokeWidth={1.5} />
              <ReferenceLine y={results.maxDrawdown * 100} stroke={T.red} strokeDasharray="6 3" label={{ value:`Max DD: ${fmt(results.maxDrawdown * 100, 1)}%`, fill:T.red, fontSize:10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── S6: Factor Return Attribution ──────────────────────────────── */}
      {results && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Monthly Factor Return Attribution (Stacked)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results.chartData.filter((_, i) => i > 0 && i % Math.max(1, Math.floor(results.chartData.length / 36)) === 0)} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize:8, fill:T.textMut }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Contribution (bps)', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:10 }} />
              <ReferenceLine y={0} stroke={T.border} />
              {selectedFactors.map(fId => (
                <Bar key={fId} dataKey={`contrib_${fId}`} stackId="a" fill={FACTOR_MAP[fId].color} name={FACTOR_MAP[fId].name} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Sampled monthly data points. Each bar segment shows factor contribution in basis points.</div>
        </div>
      )}

      {/* ── S7: Rolling Sharpe Ratio ───────────────────────────────────── */}
      {results && results.rollingSharpe.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Rolling 12-Month Sharpe Ratio</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={results.rollingSharpe} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize:9, fill:T.textMut }} interval={Math.max(1, Math.floor(results.rollingSharpe.length / 12))} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Sharpe', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }} formatter={(v) => [v.toFixed(3), 'Rolling Sharpe']} />
              <ReferenceLine y={0} stroke={T.border} strokeDasharray="3 3" />
              <ReferenceLine y={results.sharpeRatio} stroke={T.gold} strokeDasharray="6 3" label={{ value:`Avg: ${fmt(results.sharpeRatio, 2)}`, fill:T.gold, fontSize:10 }} />
              <Area type="monotone" dataKey="sharpe" stroke={T.navy} fill={`${T.navy}15`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── S8: Factor Correlation Matrix ──────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Factor Cross-Correlation Matrix</div>
        <div style={{ overflowX:'auto' }}>
          <table style={sty.table}>
            <thead>
              <tr>
                <th style={{ ...sty.th, minWidth:100 }}></th>
                {FACTORS.map(f => (
                  <th key={f.id} style={{ ...sty.th, fontSize:9, textAlign:'center', minWidth:70 }}>{f.name.split(' ').slice(0, 2).join(' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTOR_CORR.map((row, i) => (
                <tr key={i}>
                  <td style={{ ...sty.td, fontWeight:600, fontSize:11, color:FACTORS[i].color }}>{FACTORS[i].name}</td>
                  {row.map((val, j) => (
                    <td key={j} style={{ ...sty.td, textAlign:'center', background: corrColor(val), color: Math.abs(val) > 0.35 ? '#fff' : T.text, fontSize:10, fontWeight: i === j ? 700 : 400, padding:'6px 4px' }}>
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Green = positive factor correlation. Red = negative correlation (diversification benefit).</div>
      </div>

      {/* ── S9: Annual Returns Table ───────────────────────────────────── */}
      {results && results.annualReturns.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Annual Returns Breakdown</div>
          <table style={sty.table}>
            <thead>
              <tr>
                <th style={sty.th}>Year</th>
                <th style={{ ...sty.th, textAlign:'right' }}>Portfolio</th>
                <th style={{ ...sty.th, textAlign:'right' }}>Benchmark</th>
                <th style={{ ...sty.th, textAlign:'right' }}>Alpha</th>
                <th style={sty.th}>Relative Performance</th>
              </tr>
            </thead>
            <tbody>
              {results.annualReturns.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...sty.td, fontWeight:700 }}>{row.year}</td>
                  <td style={{ ...sty.td, textAlign:'right', color: row.portfolio >= 0 ? T.green : T.red, fontWeight:600, ...sty.mono }}>{row.portfolio >= 0 ? '+' : ''}{fmt(row.portfolio, 2)}%</td>
                  <td style={{ ...sty.td, textAlign:'right', ...sty.mono }}>{row.benchmark >= 0 ? '+' : ''}{fmt(row.benchmark, 2)}%</td>
                  <td style={{ ...sty.td, textAlign:'right', color: row.alpha >= 0 ? T.green : T.red, fontWeight:600, ...sty.mono }}>{row.alpha >= 0 ? '+' : ''}{fmt(row.alpha, 2)}%</td>
                  <td style={sty.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:100, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden', position:'relative' }}>
                        <div style={{ position:'absolute', left:'50%', top:0, width:1, height:'100%', background:T.border }} />
                        <div style={{
                          position:'absolute',
                          left: row.alpha >= 0 ? '50%' : `${50 + row.alpha * 2}%`,
                          width:`${Math.min(50, Math.abs(row.alpha) * 2)}%`,
                          height:'100%',
                          background: row.alpha >= 0 ? T.green : T.red,
                          borderRadius:3,
                        }} />
                      </div>
                      <span style={{ fontSize:10, color:T.textMut }}>{row.alpha >= 0 ? 'Outperform' : 'Underperform'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── S10: Risk-Return Scatter ───────────────────────────────────── */}
      {results && results.scatterData.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Factor Risk-Return Scatter (Bubble = |Sharpe|)</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top:20, right:40, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" type="number" name="Volatility" tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Annualized Vol (%)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
              <YAxis dataKey="y" type="number" name="Return" tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Annualized Return (%)', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <ZAxis dataKey="size" range={[40, 400]} />
              <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }} formatter={(v, name) => {
                if (name === 'Volatility') return [`${v.toFixed(2)}%`, 'Vol'];
                if (name === 'Return') return [`${v.toFixed(2)}%`, 'Return'];
                return [v, name];
              }} />
              <ReferenceLine y={0} stroke={T.border} strokeDasharray="3 3" />
              <Scatter data={results.scatterData}>
                {results.scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:8 }}>
            {results.scatterData.map((d, i) => (
              <span key={i} style={{ fontSize:11, color:d.color, fontWeight:600 }}>
                {d.name}: {d.y >= 0 ? '+' : ''}{fmt(d.y, 1)}% ret / {fmt(d.x, 1)}% vol / SR {fmt(d.sharpe, 2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── S11: Factor Performance Ranking Table ─────────────────────── */}
      {results && sortedFactorPerf.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Factor Performance Ranking</div>
          <div style={{ overflowX:'auto' }}>
            <table style={sty.table}>
              <thead>
                <tr>
                  {[
                    { key:'name', label:'Factor' },
                    { key:'annReturn', label:'Ann. Return (%)' },
                    { key:'annVol', label:'Ann. Vol (%)' },
                    { key:'sharpe', label:'Sharpe Ratio' },
                    { key:'maxDD', label:'Max Drawdown (%)' },
                    { key:'corrToMarket', label:'Corr to Market' },
                    { key:'weight', label:'Portfolio Weight' },
                  ].map(col => (
                    <th key={col.key} style={sty.th} onClick={() => {
                      if (factorSort === col.key) setFactorSortDir(d => d === 'desc' ? 'asc' : 'desc');
                      else { setFactorSort(col.key); setFactorSortDir('desc'); }
                    }}>
                      {col.label} {factorSort === col.key ? (factorSortDir === 'desc' ? ' v' : ' ^') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedFactorPerf.map((f, i) => (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...sty.td, fontWeight:700 }}>
                      <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:f.color, marginRight:8 }} />
                      {f.name}
                    </td>
                    <td style={{ ...sty.td, textAlign:'right', color: f.annReturn >= 0 ? T.green : T.red, fontWeight:600, ...sty.mono }}>
                      {f.annReturn >= 0 ? '+' : ''}{fmt(f.annReturn, 2)}%
                    </td>
                    <td style={{ ...sty.td, textAlign:'right', ...sty.mono }}>{fmt(f.annVol, 2)}%</td>
                    <td style={{ ...sty.td, textAlign:'right', fontWeight:600, color: f.sharpe > 0.5 ? T.green : f.sharpe > 0 ? T.amber : T.red, ...sty.mono }}>{fmt(f.sharpe, 3)}</td>
                    <td style={{ ...sty.td, textAlign:'right', color:T.red, ...sty.mono }}>{fmt(f.maxDD, 2)}%</td>
                    <td style={{ ...sty.td, textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6 }}>
                        <div style={{ width:50, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${Math.min(100, Math.abs(f.corrToMarket) * 100)}%`, height:'100%', background: f.corrToMarket > 0 ? T.sage : T.red, borderRadius:3 }} />
                        </div>
                        <span style={sty.mono}>{fmt(f.corrToMarket, 3)}</span>
                      </div>
                    </td>
                    <td style={{ ...sty.td, textAlign:'right', ...sty.mono }}>
                      {f.selected ? `${fmt(f.weight * 100, 1)}%` : <span style={{ color:T.textMut }}>--</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── S12: Sensitivity Analysis ─────────────────────────────────── */}
      {results && results.sensitivity.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Sensitivity Analysis: Sharpe vs Factor Weight Change</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            {results.sensitivity.map(s => (
              <div key={s.factorId} style={{ background:T.surfaceH, borderRadius:10, padding:'14px 16px', border:`1px solid ${T.border}` }}>
                <div style={{ fontWeight:700, fontSize:13, color:FACTOR_MAP[s.factorId].color, marginBottom:10 }}>{s.name}</div>
                <table style={{ ...sty.table, fontSize:11 }}>
                  <thead>
                    <tr>
                      <th style={{ ...sty.th, padding:'6px 8px', fontSize:10 }}>Weight Delta</th>
                      <th style={{ ...sty.th, padding:'6px 8px', fontSize:10, textAlign:'right' }}>Sharpe</th>
                      <th style={{ ...sty.th, padding:'6px 8px', fontSize:10, textAlign:'right' }}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.results.map((r, i) => {
                      const baseSharpe = s.results.find(x => x.delta === '+0%')?.sharpe || 0;
                      const diff = r.sharpe - baseSharpe;
                      return (
                        <tr key={i} style={{ background: r.delta === '+0%' ? `${T.gold}15` : 'transparent' }}>
                          <td style={{ ...sty.td, padding:'5px 8px', fontWeight: r.delta === '+0%' ? 700 : 400 }}>{r.delta}</td>
                          <td style={{ ...sty.td, padding:'5px 8px', textAlign:'right', ...sty.mono, fontWeight:600 }}>{fmt(r.sharpe, 3)}</td>
                          <td style={{ ...sty.td, padding:'5px 8px', textAlign:'right', color: diff > 0 ? T.green : diff < 0 ? T.red : T.textMut, ...sty.mono }}>
                            {r.delta === '+0%' ? 'Base' : `${diff >= 0 ? '+' : ''}${fmt(diff, 4)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.textMut, marginTop:10 }}>
            Shows the portfolio Sharpe ratio sensitivity when each factor weight is adjusted by +/- 5% and +/- 10% (before re-normalization).
            Factors with positive sensitivity improvement are candidates for increased allocation.
          </div>
        </div>
      )}

      {/* ── S13: Cross-Navigation & Exports ─────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Navigation & Exports</div>
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={sty.navRow}>
            <button style={sty.navBtn} onClick={() => navigate('/risk-attribution')}>Risk Attribution</button>
            <button style={sty.navBtn} onClick={() => navigate('/portfolio-optimizer')}>Portfolio Optimizer</button>
            <button style={sty.navBtn} onClick={() => navigate('/monte-carlo-var')}>Monte Carlo VaR</button>
            <button style={sty.navBtn} onClick={() => navigate('/scenario-stress-test')}>Stress Testing</button>
            <button style={sty.navBtn} onClick={() => navigate('/portfolio-dashboard')}>Portfolio Dashboard</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportCSV} disabled={!results}>CSV Results</button>
            <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportJSON} disabled={!results}>JSON Config</button>
            <button style={{ ...sty.btn, ...sty.btnGold }} onClick={handlePrint}>Print Report</button>
          </div>
        </div>
      </div>

      {/* Prompt to run */}
      {!results && !isRunning && (
        <div style={{ ...sty.card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:18, fontWeight:600, color:T.navy, marginBottom:8 }}>Select factors, set weights, and click "Run Backtest"</div>
          <div style={{ fontSize:13, color:T.textSec }}>
            The engine will generate {lookback * 12} months of AR(1) autocorrelated factor returns,
            compute cumulative performance, rolling Sharpe, drawdowns, and sensitivity analysis
            across {selectedFactors.length} selected factors.
          </div>
        </div>
      )}
    </div>
  );
}

export default EsgBacktestingPage;
