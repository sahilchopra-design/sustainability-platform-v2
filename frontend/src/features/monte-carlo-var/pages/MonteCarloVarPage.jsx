import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, Cell, AreaChart, Area, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ============================================================================
   MATHEMATICAL ENGINE
   ============================================================================ */

/** Box-Muller transform: generate standard normal random variable (deterministic) */
let _bmSeed=7000;
function boxMuller() {
  let u1 = sr(_bmSeed++), u2 = sr(_bmSeed++);
  while (u1 === 0) u1 = sr(_bmSeed++);
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/** Cholesky decomposition of a positive-definite matrix */
function cholesky(matrix) {
  const n = matrix.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        const diag = matrix[i][i] - sum;
        L[i][j] = diag > 0 ? Math.sqrt(diag) : 0;
      } else {
        L[i][j] = L[j][j] !== 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
      }
    }
  }
  return L;
}

/** 11x11 GICS sector climate-shock correlation matrix */
const SECTOR_CORRELATIONS = {
  sectors: ['Energy','Materials','Industrials','ConsDisc','ConsStaples','HealthCare','Financials','IT','CommServices','Utilities','RealEstate'],
  labels:  ['Energy','Materials','Industrials','Cons Disc','Cons Staples','Health Care','Financials','IT','Comm Svcs','Utilities','Real Estate'],
  matrix: [
    [1.00, 0.72, 0.45, 0.30, 0.20, 0.15, 0.35,-0.10,-0.05, 0.68, 0.40],
    [0.72, 1.00, 0.55, 0.35, 0.25, 0.18, 0.30,-0.05, 0.00, 0.58, 0.45],
    [0.45, 0.55, 1.00, 0.40, 0.30, 0.22, 0.38, 0.10, 0.15, 0.42, 0.48],
    [0.30, 0.35, 0.40, 1.00, 0.50, 0.25, 0.42, 0.35, 0.40, 0.28, 0.38],
    [0.20, 0.25, 0.30, 0.50, 1.00, 0.35, 0.30, 0.15, 0.20, 0.22, 0.25],
    [0.15, 0.18, 0.22, 0.25, 0.35, 1.00, 0.28, 0.20, 0.18, 0.15, 0.20],
    [0.35, 0.30, 0.38, 0.42, 0.30, 0.28, 1.00, 0.25, 0.30, 0.32, 0.55],
    [-0.10,-0.05, 0.10, 0.35, 0.15, 0.20, 0.25, 1.00, 0.65,-0.08, 0.12],
    [-0.05, 0.00, 0.15, 0.40, 0.20, 0.18, 0.30, 0.65, 1.00,-0.02, 0.15],
    [0.68, 0.58, 0.42, 0.28, 0.22, 0.15, 0.32,-0.08,-0.02, 1.00, 0.38],
    [0.40, 0.45, 0.48, 0.38, 0.25, 0.20, 0.55, 0.12, 0.15, 0.38, 1.00],
  ],
};

/** Scenario-specific mean annual shocks and volatilities per sector */
const SCENARIO_PARAMS = {
  transition: {
    means: [-0.25,-0.18,-0.12,-0.08,-0.04, 0.02,-0.06, 0.08, 0.05,-0.20,-0.15],
    vols:  [ 0.15, 0.12, 0.10, 0.08, 0.06, 0.05, 0.08, 0.10, 0.08, 0.14, 0.12],
  },
  physical: {
    means: [-0.10,-0.14,-0.16,-0.12,-0.10,-0.05,-0.08,-0.02,-0.03,-0.18,-0.22],
    vols:  [ 0.12, 0.14, 0.13, 0.10, 0.08, 0.06, 0.10, 0.07, 0.06, 0.16, 0.18],
  },
  combined: {
    means: [-0.30,-0.28,-0.22,-0.16,-0.10,-0.02,-0.12, 0.04, 0.02,-0.32,-0.30],
    vols:  [ 0.18, 0.16, 0.14, 0.11, 0.08, 0.07, 0.11, 0.12, 0.09, 0.18, 0.20],
  },
};

/** Map sector strings to SECTOR_CORRELATIONS index */
const SECTOR_MAP = {};
SECTOR_CORRELATIONS.sectors.forEach((s, i) => { SECTOR_MAP[s] = i; });
// Friendly-name fallbacks
const SECTOR_ALIASES = {
  'Consumer Discretionary':'ConsDisc', 'Consumer Staples':'ConsStaples',
  'Health Care':'HealthCare', 'Communication Services':'CommServices',
  'Real Estate':'RealEstate', 'Information Technology':'IT',
};
function sectorIndex(sector) {
  if (!sector) return 6; // default Financials
  const clean = sector.replace(/\s+/g, '');
  if (SECTOR_MAP[clean] !== undefined) return SECTOR_MAP[clean];
  const alias = SECTOR_ALIASES[sector];
  if (alias && SECTOR_MAP[alias] !== undefined) return SECTOR_MAP[alias];
  return 6;
}

/** Core Monte Carlo simulation engine */
function runMonteCarlo(holdings, config) {
  const { iterations, confidenceLevel, horizon, scenario } = config;
  const params = SCENARIO_PARAMS[scenario] || SCENARIO_PARAMS.transition;

  // Aggregate sector exposures
  const sectorExposures = {};
  holdings.forEach(h => {
    const sec = h.company?.sector || 'Financials';
    const idx = sectorIndex(sec);
    sectorExposures[idx] = (sectorExposures[idx] || 0) + (h.exposure_usd_mn || h.weight || 0);
  });

  const totalExposure = Object.values(sectorExposures).reduce((s, v) => s + v, 0) || 1;

  // Cholesky decomposition of correlation matrix
  const L = cholesky(SECTOR_CORRELATIONS.matrix);

  // Run simulations
  const portfolioLosses = new Float64Array(iterations);
  const sectorLossAccum = Array.from({ length: 11 }, () => 0);

  for (let sim = 0; sim < iterations; sim++) {
    // Independent standard normals
    const z = [];
    for (let k = 0; k < 11; k++) z.push(boxMuller());

    // Correlated via Cholesky: correlatedZ = L * z
    const correlatedZ = L.map((row, i) => {
      let val = 0;
      for (let j = 0; j <= i; j++) val += row[j] * z[j];
      return val;
    });

    // Portfolio return for this path
    let portfolioReturn = 0;
    for (const [idxStr, exposure] of Object.entries(sectorExposures)) {
      const idx = parseInt(idxStr);
      const mean = params.means[idx] * horizon;
      const vol = params.vols[idx] * Math.sqrt(horizon);
      const sectorReturn = mean + vol * correlatedZ[idx];
      const wt = exposure / totalExposure;
      portfolioReturn += wt * sectorReturn;
      sectorLossAccum[idx] += (-sectorReturn * exposure);
    }

    portfolioLosses[sim] = -portfolioReturn * totalExposure;
  }

  // Sort losses descending (largest loss first)
  const sortedLosses = Array.from(portfolioLosses).sort((a, b) => b - a);

  // VaR at various confidence levels
  const varAtLevel = (level) => sortedLosses[Math.floor(iterations * (1 - level))] || 0;
  const var90 = varAtLevel(0.90);
  const var95 = varAtLevel(0.95);
  const var99 = varAtLevel(0.99);
  const var995 = varAtLevel(0.995);

  // CVaR (Expected Shortfall) at 95%
  const tailCount95 = Math.max(1, Math.floor(iterations * 0.05));
  const cvar95 = sortedLosses.slice(0, tailCount95).reduce((s, v) => s + v, 0) / tailCount95;

  // Mean and standard deviation
  let sumLoss = 0, sumSq = 0;
  for (let i = 0; i < iterations; i++) {
    sumLoss += portfolioLosses[i];
    sumSq += portfolioLosses[i] * portfolioLosses[i];
  }
  const meanLoss = sumLoss / iterations;
  const variance = sumSq / iterations - meanLoss * meanLoss;
  const stdLoss = Math.sqrt(Math.max(0, variance));

  const maxLoss = sortedLosses[0];
  const minLoss = sortedLosses[iterations - 1];

  // Histogram (50 bins)
  const bins = 50;
  const binWidth = (maxLoss - minLoss) / bins || 1;
  const histogram = Array.from({ length: bins }, (_, i) => ({
    bin: parseFloat((minLoss + i * binWidth).toFixed(2)),
    binLabel: (minLoss + (i + 0.5) * binWidth).toFixed(1),
    count: 0,
    midpoint: minLoss + (i + 0.5) * binWidth,
  }));
  for (let i = 0; i < iterations; i++) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((portfolioLosses[i] - minLoss) / binWidth)));
    histogram[idx].count++;
  }

  // CDF data
  const cdfData = [];
  for (let i = 0; i < sortedLosses.length; i += Math.max(1, Math.floor(iterations / 200))) {
    cdfData.push({ loss: parseFloat(sortedLosses[i].toFixed(2)), percentile: parseFloat(((i + 1) / iterations * 100).toFixed(2)) });
  }

  // Sector contributions to VaR
  const sectorVarContrib = SECTOR_CORRELATIONS.sectors.map((sec, idx) => ({
    sector: SECTOR_CORRELATIONS.labels[idx],
    exposure: sectorExposures[idx] || 0,
    avgLoss: iterations > 0 ? sectorLossAccum[idx] / iterations : 0,
    pctOfTotal: totalExposure > 0 ? ((sectorExposures[idx] || 0) / totalExposure * 100) : 0,
  })).filter(s => s.exposure > 0).sort((a, b) => b.avgLoss - a.avgLoss);

  // Convergence data: VaR95 estimate at increasing N
  const convergence = [];
  const checkpoints = [100, 250, 500, 1000, 2000, 3000, 5000, 7500, 10000, 25000, 50000].filter(n => n <= iterations);
  const tempArr = [];
  for (let i = 0; i < iterations; i++) {
    tempArr.push(portfolioLosses[i]);
    if (checkpoints.includes(i + 1)) {
      const sorted = [...tempArr].sort((a, b) => b - a);
      const idx95 = Math.floor((i + 1) * 0.05);
      convergence.push({ n: i + 1, var95: parseFloat(sorted[idx95].toFixed(2)) });
    }
  }

  return {
    var90, var95, var99, var995, cvar95, meanLoss, stdLoss, maxLoss, minLoss,
    histogram, cdfData, sectorVarContrib, convergence, iterations,
    totalExposure, sectorExposures,
  };
}

/** Run all 3 scenarios for comparison */
function runScenarioComparison(holdings, baseConfig) {
  const scenarios = ['transition', 'physical', 'combined'];
  return scenarios.map(sc => {
    const result = runMonteCarlo(holdings, { ...baseConfig, scenario: sc, iterations: Math.min(baseConfig.iterations, 5000) });
    return { scenario: sc, label: sc.charAt(0).toUpperCase() + sc.slice(1), var95: result.var95, var99: result.var99, cvar95: result.cvar95, meanLoss: result.meanLoss };
  });
}

/* ── Portfolio helpers ──────────────────────────────────────────────────── */
let _masterLookup = null;
function getMasterLookup() {
  if (!_masterLookup) { _masterLookup = {}; GLOBAL_COMPANY_MASTER.forEach(c => { _masterLookup[c.ticker] = c; }); }
  return _masterLookup;
}

function enrichHolding(h) {
  const ticker = h.company?.ticker;
  const master = ticker ? getMasterLookup()[ticker] : null;
  if (!master) return h;
  return { ...h, company: { ...h.company, ...master, ...h.company } };
}

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
const fmtM = (v) => v != null ? `$${Math.abs(v).toFixed(1)}M` : '--';
const fmtPct = (v) => v != null ? `${(v * 100).toFixed(2)}%` : '--';

/* ── Correlation heatmap color ─────────────────────────────────────────── */
function corrColor(val) {
  if (val >= 0.6) return '#dc2626';
  if (val >= 0.3) return '#f97316';
  if (val >= 0.1) return '#facc15';
  if (val >= -0.1) return '#e5e7eb';
  if (val >= -0.3) return '#93c5fd';
  return '#3b82f6';
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
function MonteCarloVarPage() {
  const navigate = useNavigate();

  // Portfolio from localStorage
  const [portfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const rawHoldings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  const holdings = useMemo(() => rawHoldings.map(h => enrichHolding(h)), [rawHoldings]);

  // Controls
  const [iterations, setIterations] = useState(10000);
  const [confidence, setConfidence] = useState(0.95);
  const [horizon, setHorizon] = useState(1);
  const [scenario, setScenario] = useState('transition');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [scenarioComp, setScenarioComp] = useState(null);

  // Table sorts
  const [holdingSort, setHoldingSort] = useState('componentVar');
  const [holdingSortDir, setHoldingSortDir] = useState('desc');

  // Determine whether to use portfolio or demo data
  const effectiveHoldings = useMemo(() => {
    if (holdings.length > 0) return holdings;
    // Demo portfolio for empty state
    return [
      { company: { ticker:'RELIANCE.NS', name:'Reliance Industries', sector:'Energy' }, weight:12, exposure_usd_mn:120 },
      { company: { ticker:'TCS.NS', name:'Tata Consultancy', sector:'IT' }, weight:10, exposure_usd_mn:100 },
      { company: { ticker:'HDFCBANK.NS', name:'HDFC Bank', sector:'Financials' }, weight:9, exposure_usd_mn:90 },
      { company: { ticker:'INFY.NS', name:'Infosys', sector:'IT' }, weight:8, exposure_usd_mn:80 },
      { company: { ticker:'ICICIBANK.NS', name:'ICICI Bank', sector:'Financials' }, weight:7, exposure_usd_mn:70 },
      { company: { ticker:'HINDUNILVR.NS', name:'Hindustan Unilever', sector:'ConsStaples' }, weight:6, exposure_usd_mn:60 },
      { company: { ticker:'ITC.NS', name:'ITC', sector:'ConsStaples' }, weight:5, exposure_usd_mn:50 },
      { company: { ticker:'BHARTIARTL.NS', name:'Bharti Airtel', sector:'CommServices' }, weight:5, exposure_usd_mn:50 },
      { company: { ticker:'SBIN.NS', name:'State Bank of India', sector:'Financials' }, weight:4.5, exposure_usd_mn:45 },
      { company: { ticker:'LT.NS', name:'Larsen & Toubro', sector:'Industrials' }, weight:4, exposure_usd_mn:40 },
      { company: { ticker:'BAJFINANCE.NS', name:'Bajaj Finance', sector:'Financials' }, weight:3.5, exposure_usd_mn:35 },
      { company: { ticker:'TATAMOTORS.NS', name:'Tata Motors', sector:'ConsDisc' }, weight:3, exposure_usd_mn:30 },
      { company: { ticker:'NTPC.NS', name:'NTPC', sector:'Utilities' }, weight:3, exposure_usd_mn:30 },
      { company: { ticker:'POWERGRID.NS', name:'Power Grid Corp', sector:'Utilities' }, weight:2.5, exposure_usd_mn:25 },
      { company: { ticker:'ADANIENT.NS', name:'Adani Enterprises', sector:'Materials' }, weight:2.5, exposure_usd_mn:25 },
      { company: { ticker:'COALINDIA.NS', name:'Coal India', sector:'Energy' }, weight:2, exposure_usd_mn:20 },
      { company: { ticker:'ULTRACEMCO.NS', name:'UltraTech Cement', sector:'Materials' }, weight:2, exposure_usd_mn:20 },
      { company: { ticker:'SUNPHARMA.NS', name:'Sun Pharma', sector:'HealthCare' }, weight:2, exposure_usd_mn:20 },
      { company: { ticker:'WIPRO.NS', name:'Wipro', sector:'IT' }, weight:1.5, exposure_usd_mn:15 },
      { company: { ticker:'DLF.NS', name:'DLF', sector:'RealEstate' }, weight:1.5, exposure_usd_mn:15 },
    ].map(h => enrichHolding(h));
  }, [holdings]);

  const isDemo = holdings.length === 0;

  // Run simulation handler
  const handleRun = useCallback(() => {
    setIsRunning(true);
    // Use setTimeout to allow UI to update with running state
    setTimeout(() => {
      const config = { iterations, confidenceLevel: confidence, horizon, scenario };
      const res = runMonteCarlo(effectiveHoldings, config);
      const comp = runScenarioComparison(effectiveHoldings, config);
      setResults(res);
      setScenarioComp(comp);
      setIsRunning(false);
    }, 50);
  }, [effectiveHoldings, iterations, confidence, horizon, scenario]);

  // Per-holding VaR contribution (marginal/component VaR approximation)
  const holdingVarData = useMemo(() => {
    if (!results) return [];
    const totalVar = results.var95;
    const totalExp = results.totalExposure;
    return effectiveHoldings.map(h => {
      const c = h.company || {};
      const exp = h.exposure_usd_mn || h.weight || 0;
      const idx = sectorIndex(c.sector || 'Financials');
      const params = SCENARIO_PARAMS[scenario] || SCENARIO_PARAMS.transition;
      const sectorMean = Math.abs(params.means[idx]) * horizon;
      const sectorVol = params.vols[idx] * Math.sqrt(horizon);
      // Marginal VaR approximation: sector vol * exposure * z-score
      const zScore = confidence === 0.99 ? 2.326 : confidence === 0.995 ? 2.576 : confidence === 0.90 ? 1.282 : 1.645;
      const marginalVar = sectorVol * zScore * exp;
      const componentVar = totalExp > 0 ? (exp / totalExp) * totalVar : 0;
      const pctOfTotal = totalVar > 0 ? (componentVar / totalVar * 100) : 0;
      return {
        name: c.name || c.ticker || 'Unknown',
        ticker: c.ticker || '',
        sector: SECTOR_CORRELATIONS.labels[idx] || c.sector || '',
        exposure: exp,
        marginalVar: parseFloat(marginalVar.toFixed(2)),
        componentVar: parseFloat(componentVar.toFixed(2)),
        pctOfTotal: parseFloat(pctOfTotal.toFixed(2)),
        sectorMean: parseFloat((sectorMean * 100).toFixed(2)),
      };
    }).sort((a, b) => holdingSortDir === 'desc' ? b[holdingSort] - a[holdingSort] : a[holdingSort] - b[holdingSort]);
  }, [results, effectiveHoldings, scenario, horizon, confidence, holdingSort, holdingSortDir]);

  // Exports
  const handleExportCSV = useCallback(() => {
    if (!results) return;
    const rows = results.histogram.map(h => ({ bin_start: h.bin, frequency: h.count, midpoint: h.midpoint }));
    downloadCSV('monte_carlo_var_histogram.csv', rows);
  }, [results]);

  const handleExportJSON = useCallback(() => {
    if (!results) return;
    downloadJSON('monte_carlo_var_config.json', {
      iterations, confidenceLevel: confidence, horizon, scenario,
      var95: results.var95, var99: results.var99, cvar95: results.cvar95,
      meanLoss: results.meanLoss, stdLoss: results.stdLoss,
      sectorContributions: results.sectorVarContrib,
      timestamp: new Date().toISOString(),
    });
  }, [results, iterations, confidence, horizon, scenario]);

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
  };

  return (
    <div style={sty.page}>
      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media print { body { -webkit-print-color-adjust: exact; } }`}</style>

      {/* ── S1: Header ──────────────────────────────────────────────────── */}
      <div style={sty.header}>
        <div>
          <h1 style={sty.h1}>
            Monte Carlo Climate VaR Simulator
            <span style={sty.badge}>Cholesky - Correlated - N={iterations.toLocaleString()}</span>
          </h1>
          <div style={sty.subtitle}>Correlated multi-sector climate loss simulation using Box-Muller transforms and Cholesky-decomposed correlation structure</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportCSV} disabled={!results}>Export CSV</button>
          <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportJSON} disabled={!results}>Export JSON</button>
          <button style={{ ...sty.btn, ...sty.btnGold }} onClick={handlePrint}>Print</button>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && <div style={sty.demoBar}>Demo Mode: Displaying simulation with a 20-holding sample portfolio. Upload your portfolio via Portfolio Manager for live analysis.</div>}

      {/* ── S2: Control Panel ───────────────────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Simulation Parameters</div>
        <div style={sty.controlRow}>
          <div style={sty.controlGroup}>
            <span style={sty.controlLabel}>Iterations</span>
            <select style={sty.select} value={iterations} onChange={e => setIterations(Number(e.target.value))}>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
              <option value={50000}>50,000</option>
            </select>
          </div>
          <div style={sty.controlGroup}>
            <span style={sty.controlLabel}>Confidence Level</span>
            <select style={sty.select} value={confidence} onChange={e => setConfidence(Number(e.target.value))}>
              <option value={0.90}>90%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
              <option value={0.995}>99.5%</option>
            </select>
          </div>
          <div style={sty.controlGroup}>
            <span style={sty.controlLabel}>Horizon</span>
            <select style={sty.select} value={horizon} onChange={e => setHorizon(Number(e.target.value))}>
              <option value={1/12}>1 Month</option>
              <option value={0.25}>3 Months</option>
              <option value={1}>1 Year</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
            </select>
          </div>
          <div style={sty.controlGroup}>
            <span style={sty.controlLabel}>Scenario</span>
            <select style={sty.select} value={scenario} onChange={e => setScenario(e.target.value)}>
              <option value="transition">Transition Only</option>
              <option value="physical">Physical Only</option>
              <option value="combined">Combined</option>
            </select>
          </div>
          <button
            style={{ ...sty.btn, ...sty.btnPrimary, opacity: isRunning ? 0.6 : 1 }}
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? <><span style={sty.progress} /> Running...</> : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* ── S3: KPI Cards ───────────────────────────────────────────────── */}
      {results && (
        <div style={sty.kpiRow}>
          {[
            { label: `VaR (${(confidence*100).toFixed(0)}%)`, value: fmtM(results.var95), sub:'Loss not exceeded at confidence', color:T.red },
            { label: 'VaR (99%)', value: fmtM(results.var99), sub:'Extreme tail risk', color:T.red },
            { label: 'CVaR / Expected Shortfall (95%)', value: fmtM(results.cvar95), sub:'Average loss beyond VaR', color:'#dc2626' },
            { label: 'Mean Loss', value: fmtM(results.meanLoss), sub:'Expected climate loss', color:T.amber },
            { label: 'Std Dev', value: fmtM(results.stdLoss), sub:'Loss volatility', color:T.textSec },
            { label: 'Max Loss', value: fmtM(results.maxLoss), sub:'Worst simulation path', color:T.red },
            { label: 'Min Loss', value: fmtM(results.minLoss), sub: results.minLoss < 0 ? 'Best case = gain' : 'Best simulation path', color:T.green },
            { label: 'Iterations Run', value: results.iterations.toLocaleString(), sub:`${effectiveHoldings.length} holdings, ${Object.keys(results.sectorExposures).length} sectors`, color:T.navy },
          ].map((k, i) => (
            <div key={i} style={sty.kpi}>
              <div style={sty.kpiLabel}>{k.label}</div>
              <div style={{ ...sty.kpiVal, color: k.color }}>{k.value}</div>
              <div style={sty.kpiSub}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── S4: Loss Distribution Histogram ────────────────────────────── */}
      {results && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Loss Distribution Histogram (50 bins)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={results.histogram} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="binLabel" tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Loss ($M)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} interval={4} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Frequency', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => [v, 'Count']} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Bar dataKey="count" radius={[2,2,0,0]}>
                {results.histogram.map((entry, i) => (
                  <Cell key={i} fill={entry.midpoint > results.var95 ? T.red : entry.midpoint > results.var90 ? T.amber : T.navyL} fillOpacity={0.8} />
                ))}
              </Bar>
              <ReferenceLine x={results.histogram.findIndex(h => h.midpoint >= results.var95)} stroke={T.red} strokeWidth={2} strokeDasharray="6 3" label={{ value:`VaR 95%: $${results.var95.toFixed(1)}M`, fill:T.red, fontSize:10, position:'top' }} />
              <ReferenceLine x={results.histogram.findIndex(h => h.midpoint >= results.var99)} stroke="#7c3aed" strokeWidth={2} strokeDasharray="6 3" label={{ value:`VaR 99%: $${results.var99.toFixed(1)}M`, fill:'#7c3aed', fontSize:10, position:'top' }} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Red bars indicate losses exceeding VaR(95%). Dashed lines mark VaR at 95% and 99% confidence.</div>
        </div>
      )}

      {/* ── S5: Cumulative Loss Distribution (CDF) ─────────────────────── */}
      {results && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Cumulative Loss Distribution (CDF)</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={results.cdfData} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="loss" tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Loss ($M)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} domain={[0,100]} label={{ value:'Cumulative %', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v, name) => [name === 'percentile' ? `${v}%` : `$${v}M`, name === 'percentile' ? 'CDF' : 'Loss']} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Area type="monotone" dataKey="percentile" stroke={T.navy} fill={`${T.navy}20`} strokeWidth={2} />
              <ReferenceLine y={95} stroke={T.red} strokeDasharray="4 4" label={{ value:'95%', fill:T.red, fontSize:10 }} />
              <ReferenceLine y={99} stroke="#7c3aed" strokeDasharray="4 4" label={{ value:'99%', fill:'#7c3aed', fontSize:10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── S6: Sector Contribution to VaR ─────────────────────────────── */}
      {results && results.sectorVarContrib.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Sector Contribution to VaR</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results.sectorVarContrib} margin={{ top:10, right:30, left:20, bottom:50 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Average Loss ($M)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
              <YAxis type="category" dataKey="sector" width={90} tick={{ fontSize:11, fill:T.text }} />
              <Tooltip formatter={(v) => [`$${v.toFixed(2)}M`, 'Avg Loss']} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Bar dataKey="avgLoss" radius={[0,4,4,0]}>
                {results.sectorVarContrib.map((_, i) => (
                  <Cell key={i} fill={[T.red, '#f97316', T.amber, T.gold, T.sage, T.navyL, '#7c3aed', '#0d9488', '#2563eb', '#6366f1', '#ec4899'][i % 11]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── S7: Correlation Heatmap ─────────────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Sector Climate Shock Correlation Matrix (11x11)</div>
        <div style={{ overflowX:'auto' }}>
          <table style={sty.table}>
            <thead>
              <tr>
                <th style={{ ...sty.th, minWidth:90 }}></th>
                {SECTOR_CORRELATIONS.labels.map((s, i) => (
                  <th key={i} style={{ ...sty.th, fontSize:9, textAlign:'center', minWidth:55, writingMode:'vertical-rl', transform:'rotate(180deg)', height:90 }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTOR_CORRELATIONS.matrix.map((row, i) => (
                <tr key={i}>
                  <td style={{ ...sty.td, fontWeight:600, fontSize:11 }}>{SECTOR_CORRELATIONS.labels[i]}</td>
                  {row.map((val, j) => (
                    <td key={j} style={{ ...sty.td, textAlign:'center', background: corrColor(val), color: Math.abs(val) > 0.4 ? '#fff' : T.text, fontSize:10, fontWeight: i === j ? 700 : 400, padding:'6px 4px' }}>
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Red = high positive correlation (climate shocks move together). Blue = negative correlation (natural hedge).</div>
      </div>

      {/* ── S8: Convergence Chart ──────────────────────────────────────── */}
      {results && results.convergence.length > 1 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>VaR(95%) Convergence by Iteration Count</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={results.convergence} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="n" tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Iterations', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'VaR 95% ($M)', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => [`$${v}M`, 'VaR(95%)']} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Area type="monotone" dataKey="var95" stroke={T.navy} fill={`${T.navy}15`} strokeWidth={2} dot={{ r:4, fill:T.navy }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:T.textMut }}>Shows VaR estimate stabilization as simulation count increases. Stable plateau indicates sufficient iterations.</div>
        </div>
      )}

      {/* ── S9: Scenario Comparison ─────────────────────────────────────── */}
      {scenarioComp && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Scenario Comparison</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {scenarioComp.map((sc, i) => (
              <div key={i} style={{ flex:'1 1 220px', background:T.surfaceH, borderRadius:12, padding:'18px 20px', border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>{sc.label}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <div style={sty.kpiLabel}>VaR (95%)</div>
                    <div style={{ fontSize:18, fontWeight:700, color:T.red }}>{fmtM(sc.var95)}</div>
                  </div>
                  <div>
                    <div style={sty.kpiLabel}>VaR (99%)</div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#7c3aed' }}>{fmtM(sc.var99)}</div>
                  </div>
                  <div>
                    <div style={sty.kpiLabel}>CVaR (95%)</div>
                    <div style={{ fontSize:16, fontWeight:600, color:T.amber }}>{fmtM(sc.cvar95)}</div>
                  </div>
                  <div>
                    <div style={sty.kpiLabel}>Mean Loss</div>
                    <div style={{ fontSize:16, fontWeight:600, color:T.textSec }}>{fmtM(sc.meanLoss)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260} style={{ marginTop:16 }}>
            <BarChart data={scenarioComp} margin={{ top:10, right:30, left:20, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize:12, fill:T.text }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} label={{ value:'Loss ($M)', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => [`$${v.toFixed(2)}M`]} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="var95" name="VaR 95%" fill={T.red} radius={[4,4,0,0]} />
              <Bar dataKey="var99" name="VaR 99%" fill="#7c3aed" radius={[4,4,0,0]} />
              <Bar dataKey="cvar95" name="CVaR 95%" fill={T.amber} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── S10: Per-Holding VaR Contribution Table ─────────────────────── */}
      {results && holdingVarData.length > 0 && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Per-Holding VaR Contribution ({holdingVarData.length} holdings)</div>
          <div style={{ overflowX:'auto' }}>
            <table style={sty.table}>
              <thead>
                <tr>
                  {[
                    { key:'name', label:'Company' },
                    { key:'sector', label:'Sector' },
                    { key:'exposure', label:'Exposure ($M)' },
                    { key:'sectorMean', label:'Sector Shock (%)' },
                    { key:'marginalVar', label:'Marginal VaR ($M)' },
                    { key:'componentVar', label:'Component VaR ($M)' },
                    { key:'pctOfTotal', label:'% of Total VaR' },
                  ].map(col => (
                    <th key={col.key} style={sty.th} onClick={() => {
                      if (holdingSort === col.key) setHoldingSortDir(d => d === 'desc' ? 'asc' : 'desc');
                      else { setHoldingSort(col.key); setHoldingSortDir('desc'); }
                    }}>
                      {col.label} {holdingSort === col.key ? (holdingSortDir === 'desc' ? ' v' : ' ^') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdingVarData.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...sty.td, fontWeight:600 }}>{row.name}</td>
                    <td style={sty.td}>{row.sector}</td>
                    <td style={{ ...sty.td, textAlign:'right', ...sty.mono }}>{fmt(row.exposure, 1)}</td>
                    <td style={{ ...sty.td, textAlign:'right', color: row.sectorMean > 15 ? T.red : T.text, ...sty.mono }}>{fmt(row.sectorMean, 1)}%</td>
                    <td style={{ ...sty.td, textAlign:'right', ...sty.mono }}>{fmt(row.marginalVar, 2)}</td>
                    <td style={{ ...sty.td, textAlign:'right', fontWeight:600, ...sty.mono }}>{fmt(row.componentVar, 2)}</td>
                    <td style={{ ...sty.td, textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6 }}>
                        <div style={{ width:60, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${Math.min(100, row.pctOfTotal)}%`, height:'100%', background: row.pctOfTotal > 10 ? T.red : T.navyL, borderRadius:3 }} />
                        </div>
                        <span style={sty.mono}>{fmt(row.pctOfTotal, 1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── S11: Risk Metrics Summary ──────────────────────────────────── */}
      {results && (
        <div style={sty.card}>
          <div style={sty.sectionTitle}>Risk Metrics Summary</div>
          <table style={sty.table}>
            <thead>
              <tr>
                <th style={sty.th}>Metric</th>
                <th style={{ ...sty.th, textAlign:'right' }}>Value</th>
                <th style={{ ...sty.th, textAlign:'right' }}>% of Portfolio</th>
                <th style={sty.th}>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric:'VaR (90%)', val: results.var90, interp:`90% confidence: losses will not exceed $${fmt(results.var90,1)}M` },
                { metric:'VaR (95%)', val: results.var95, interp:`95% confidence: standard regulatory threshold` },
                { metric:'VaR (99%)', val: results.var99, interp:`99% confidence: stress scenario measure` },
                { metric:'VaR (99.5%)', val: results.var995, interp:`99.5% confidence: extreme tail risk` },
                { metric:'CVaR / ES (95%)', val: results.cvar95, interp:`Average loss in worst 5% of scenarios` },
                { metric:'Mean Loss', val: results.meanLoss, interp:`Expected value of climate-adjusted portfolio loss` },
                { metric:'Std Dev of Loss', val: results.stdLoss, interp:`Dispersion of simulation outcomes` },
                { metric:'Maximum Drawdown', val: results.maxLoss, interp:`Worst single simulation path outcome` },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...sty.td, fontWeight:600 }}>{row.metric}</td>
                  <td style={{ ...sty.td, textAlign:'right', fontWeight:700, color: row.val > results.var95 ? T.red : T.navy, ...sty.mono }}>{fmtM(row.val)}</td>
                  <td style={{ ...sty.td, textAlign:'right', ...sty.mono }}>{results.totalExposure > 0 ? fmt(row.val / results.totalExposure * 100, 2) + '%' : '--'}</td>
                  <td style={{ ...sty.td, fontSize:11, color:T.textSec }}>{row.interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── S12: Methodology Notes ─────────────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Methodology Notes</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6, color:T.navy }}>Box-Muller Transform</div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
              Generates pairs of independent standard normal random variables from uniform random numbers.
              Given U1, U2 ~ Uniform(0,1): Z = sqrt(-2 ln U1) * cos(2*pi*U2). This provides the
              Gaussian innovations driving each sector shock in every simulation path.
            </div>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6, color:T.navy }}>Cholesky Decomposition</div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
              The 11x11 sector correlation matrix Sigma is decomposed as Sigma = L * L^T where L is lower-triangular.
              Independent normals Z are transformed via X = L * Z to produce correlated sector shocks
              that respect the empirical correlation structure between climate impacts.
            </div>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6, color:T.navy }}>VaR & CVaR Computation</div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
              Value-at-Risk is the loss quantile at the specified confidence level from the empirical distribution
              of simulated portfolio losses. CVaR (Conditional VaR / Expected Shortfall) is the mean of losses
              exceeding VaR, providing a coherent risk measure that captures tail severity.
            </div>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6, color:T.navy }}>Limitations & Assumptions</div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
              Sector correlations are calibrated to historical climate-related market shocks (not general equity correlations).
              Mean shock parameters reflect stylized NGFS-aligned scenarios, not precise model outputs.
              Intra-sector company-level dispersion is not modeled. Results are indicative, not predictive.
              Non-linear tail dependencies (copula) are not captured by the Gaussian correlation structure.
            </div>
          </div>
        </div>
      </div>

      {/* ── S13: Cross-Navigation & Exports ─────────────────────────────── */}
      <div style={sty.card}>
        <div style={sty.sectionTitle}>Navigation & Exports</div>
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={sty.navRow}>
            <button style={sty.navBtn} onClick={() => navigate('/risk-attribution')}>Risk Attribution</button>
            <button style={sty.navBtn} onClick={() => navigate('/portfolio-optimizer')}>Portfolio Optimizer</button>
            <button style={sty.navBtn} onClick={() => navigate('/esg-backtesting')}>ESG Backtesting</button>
            <button style={sty.navBtn} onClick={() => navigate('/scenario-stress-test')}>Stress Testing</button>
            <button style={sty.navBtn} onClick={() => navigate('/portfolio-climate-var')}>Climate VaR Dashboard</button>
            <button style={sty.navBtn} onClick={() => navigate('/portfolio-suite')}>Portfolio Dashboard</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportCSV} disabled={!results}>CSV Results</button>
            <button style={{ ...sty.btn, ...sty.btnSec }} onClick={handleExportJSON} disabled={!results}>JSON Config</button>
            <button style={{ ...sty.btn, ...sty.btnGold }} onClick={handlePrint}>Print Report</button>
          </div>
        </div>
      </div>

      {/* Prompt to run if no results yet */}
      {!results && !isRunning && (
        <div style={{ ...sty.card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:18, fontWeight:600, color:T.navy, marginBottom:8 }}>Configure parameters above and click "Run Simulation"</div>
          <div style={{ fontSize:13, color:T.textSec }}>
            The engine will generate {iterations.toLocaleString()} correlated simulation paths across {Object.keys(
              effectiveHoldings.reduce((acc, h) => { acc[sectorIndex(h.company?.sector)] = true; return acc; }, {})
            ).length} sectors using Cholesky-decomposed correlation structure.
          </div>
        </div>
      )}
    </div>
  );
}

export default MonteCarloVarPage;
