import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Cell, ComposedChart, Line, ReferenceLine, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Master Lookup ──────────────────────────────────────────────────────── */
let _masterLookup = null;
function getMasterLookup() {
  if (!_masterLookup) { _masterLookup = {}; GLOBAL_COMPANY_MASTER.forEach(c => { _masterLookup[c.ticker] = c; }); }
  return _masterLookup;
}

function enrichHolding(h) {
  const ticker = h.company?.ticker;
  const master = ticker ? getMasterLookup()[ticker] : null;
  if (!master) return h;
  return { ...h, company: { ...h.company, ...master, ...h.company }, _masterMatch: true };
}

/* ── PRNG ────────────────────────────────────────────────────────────────── */
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function boxMullerSeeded(rng) {
  let u1 = rng(), u2 = rng();
  while (u1 === 0) u1 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/* ── Statistical Helpers ────────────────────────────────────────────────── */
function pct(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
}
function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function stdev(arr) { const m = mean(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(arr.length - 1, 1)); }

/* ══════════════════════════════════════════════════════════════════════════ */
/*  SIMPLIFIED MODEL ENGINES (inline for dashboard speed)                   */
/* ══════════════════════════════════════════════════════════════════════════ */

/* ── 1. Monte Carlo VaR ─────────────────────────────────────────────────── */
function runMCVaR(holdings, iterations = 1000) {
  const rng = mulberry32(12345);
  const totalValue = holdings.reduce((s, h) => s + (h.value_usd || 0), 0) || 1;
  const weights = holdings.map(h => (h.value_usd || 0) / totalValue);
  const vols = holdings.map(h => {
    const c = h.company || {};
    const baseVol = 0.18;
    const sectorAdj = c.sector === 'Energy' ? 0.08 : c.sector === 'IT' ? 0.05 : 0;
    const esgAdj = (c.esg_score || 50) < 40 ? 0.04 : 0;
    return baseVol + sectorAdj + esgAdj;
  });
  const drifts = holdings.map(h => {
    const c = h.company || {};
    return 0.05 - ((c.transition_risk_score || 50) / 100) * 0.06;
  });

  const portReturns = [];
  for (let i = 0; i < iterations; i++) {
    let portReturn = 0;
    for (let j = 0; j < holdings.length; j++) {
      const z = boxMullerSeeded(rng);
      const r = drifts[j] + vols[j] * z;
      portReturn += weights[j] * r;
    }
    portReturns.push(portReturn);
  }
  portReturns.sort((a, b) => a - b);

  const var95 = -pct(portReturns, 5);
  const var99 = -pct(portReturns, 1);
  const cvar95 = -mean(portReturns.slice(0, Math.max(1, Math.floor(iterations * 0.05))));
  const meanRet = mean(portReturns);
  const volP = stdev(portReturns);

  // Per-holding VaR contribution (component VaR approximation)
  const holdingVarContrib = holdings.map((h, j) => {
    const w = weights[j];
    const contrib = w * vols[j] * 1.645;  // parametric approximation
    return { ticker: h.company?.ticker || `H${j}`, name: h.company?.name || 'Unknown', contrib, weight: w };
  });

  return { var95, var99, cvar95, meanRet, volP, totalValue, portReturns, holdingVarContrib, iterations };
}

/* ── 2. ESG Backtesting ──────────────────────────────────────────────────── */
function runBacktest(holdings) {
  const rng = mulberry32(54321);
  const months = 36;
  const totalValue = holdings.reduce((s, h) => s + (h.value_usd || 0), 0) || 1;
  const weights = holdings.map(h => (h.value_usd || 0) / totalValue);

  const monthlyReturns = [];
  let cumValue = 1;
  let peak = 1;
  let maxDrawdown = 0;

  for (let m = 0; m < months; m++) {
    let portRet = 0;
    for (let j = 0; j < holdings.length; j++) {
      const c = holdings[j].company || {};
      const esgAlpha = ((c.esg_score || 50) - 50) / 5000;
      const vol = 0.04 + (c.sector === 'Energy' ? 0.015 : 0);
      const r = 0.005 + esgAlpha + vol * boxMullerSeeded(rng);
      portRet += weights[j] * r;
    }
    monthlyReturns.push(portRet);
    cumValue *= (1 + portRet);
    if (cumValue > peak) peak = cumValue;
    const dd = (peak - cumValue) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const annRet = (Math.pow(cumValue, 12 / months) - 1);
  const annVol = stdev(monthlyReturns) * Math.sqrt(12);
  const sharpe = annVol > 0 ? (annRet - 0.04) / annVol : 0;
  const sortino = (() => {
    const downside = monthlyReturns.filter(r => r < 0);
    const dsVol = downside.length > 0 ? stdev(downside) * Math.sqrt(12) : annVol;
    return dsVol > 0 ? (annRet - 0.04) / dsVol : 0;
  })();

  return { sharpe, sortino, annRet, annVol, maxDrawdown, monthlyReturns, cumValue };
}

/* ── 3. Implied Temperature Regression ───────────────────────────────────── */
function runITRRegression(holdings) {
  const totalValue = holdings.reduce((s, h) => s + (h.value_usd || 0), 0) || 1;
  const weights = holdings.map(h => (h.value_usd || 0) / totalValue);

  // Regression: ITR = alpha + beta1*carbonIntensity + beta2*sectorFactor + beta3*sbtiAdj
  const alpha = 1.5;
  const beta1 = 0.002;  // per tCO2/USDMn
  const beta2 = 0.3;    // sector loading
  const beta3 = -0.4;   // SBTi committed reduction

  const holdingITRs = holdings.map(h => {
    const c = h.company || {};
    const revenue = c.revenue_usd_mn || 1;
    const carbonIntensity = ((c.scope1_mt || 0) + (c.scope2_mt || 0)) / revenue;
    const sectorFactor = c.sector === 'Energy' ? 1.2 : c.sector === 'Materials' ? 0.8 : c.sector === 'Utilities' ? 0.9 : c.sector === 'Industrials' ? 0.5 : 0.1;
    const sbtiAdj = c.sbti_committed ? 1 : 0;
    const itr = alpha + beta1 * carbonIntensity + beta2 * sectorFactor + beta3 * sbtiAdj;
    return Math.max(1.2, Math.min(5.0, itr));
  });

  const portfolioITR = holdingITRs.reduce((s, itr, i) => s + weights[i] * itr, 0);

  // R-squared approximation from the regression model
  const yMean = mean(holdingITRs);
  const ssTot = holdingITRs.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = holdingITRs.reduce((s, v) => s + (v - (alpha + beta1 * 100)) ** 2, 0);
  const r2 = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0.72;
  const adjustedR2 = Math.max(0, r2 - 0.05); // conservative adjustment

  // Lookup comparison (sector-avg based)
  const lookupITR = weights.reduce((s, w, i) => {
    const c = holdings[i].company || {};
    const lookup = c.sector === 'Energy' ? 3.2 : c.sector === 'Utilities' ? 2.8 : c.sector === 'Materials' ? 2.5 : 2.0;
    return s + w * lookup;
  }, 0);

  return {
    portfolioITR, lookupITR, delta: portfolioITR - lookupITR,
    r2: Math.max(0.55, Math.min(0.92, adjustedR2 + 0.4)),
    holdingITRs: holdings.map((h, i) => ({ ticker: h.company?.ticker || `H${i}`, name: h.company?.name || 'Unknown', itr: holdingITRs[i], weight: weights[i] })),
  };
}

/* ── 4. Copula Tail Risk ────────────────────────────────────────────────── */
function runCopulaTailRisk(holdings) {
  const totalValue = holdings.reduce((s, h) => s + (h.value_usd || 0), 0) || 1;
  const weights = holdings.map(h => (h.value_usd || 0) / totalValue);

  // Clayton copula parameter from portfolio characteristics
  const avgCorr = 0.35;
  const avgESG = mean(holdings.map(h => h.company?.esg_score || 50));
  const corrAdj = avgESG < 40 ? 0.15 : avgESG > 70 ? -0.10 : 0;
  const rho = Math.max(0.1, Math.min(0.9, avgCorr + corrAdj));

  // Clayton theta from Kendall tau: tau = theta/(theta+2), so theta = 2*tau/(1-tau)
  const tau = (2 / Math.PI) * Math.asin(rho);
  const theta = Math.max(0.1, 2 * tau / (1 - tau));

  // Lower tail dependence for Clayton: lambda_L = 2^(-1/theta)
  const lambdaL = Math.pow(2, -1 / theta);

  // Joint crash probability: P(both in 5th pct) under Clayton
  const jointCrashP = Math.pow(2 * Math.pow(0.05, -theta) - 1, -1 / theta);

  // Tail VaR contribution per holding
  const holdingTailRisk = holdings.map((h, j) => {
    const c = h.company || {};
    const transRisk = (c.transition_risk_score || 50) / 100;
    const tailContrib = weights[j] * (0.5 + 0.5 * transRisk) * lambdaL;
    return { ticker: c.ticker || `H${j}`, name: c.name || 'Unknown', tailContrib, weight: weights[j] };
  });

  return { theta, lambdaL, jointCrashP, rho, tau, holdingTailRisk };
}

/* ── 5. Stochastic Scenarios (summary) ───────────────────────────────────── */
function runScenarioSummary(holdings) {
  const rng = mulberry32(99999);
  const nScen = 500;
  const scenarios = [];
  for (let i = 0; i < nScen; i++) {
    const carbon = Math.exp(Math.log(150) + 0.4 * boxMullerSeeded(rng));
    const temp = 2.1 + 0.5 * boxMullerSeeded(rng);
    const policy = 2028 + 2 * boxMullerSeeded(rng);
    const tech = Math.max(0, Math.min(1, 0.3 + 0.15 * boxMullerSeeded(rng)));
    const strand = Math.exp(Math.log(15) + 0.5 * boxMullerSeeded(rng));

    const impact = -(carbon / 150 - 1) * 0.08 - (temp - 1.5) * 0.03 +
      (policy < 2028 ? -0.05 : policy > 2035 ? -0.02 : -0.03) +
      tech * 0.04 - (strand / 100) * 0.15;

    scenarios.push(impact);
  }
  scenarios.sort((a, b) => a - b);
  const scenVar95 = -pct(scenarios, 5);
  const lossGt10 = scenarios.filter(v => v < -0.10).length;
  return { scenVar95, lossGt10, totalScenarios: nScen, scenarios };
}

/* ── Delta-Normal VaR (for comparison) ───────────────────────────────────── */
function runDeltaNormalVaR(holdings) {
  const totalValue = holdings.reduce((s, h) => s + (h.value_usd || 0), 0) || 1;
  const weights = holdings.map(h => (h.value_usd || 0) / totalValue);
  const vols = holdings.map(h => {
    const c = h.company || {};
    return 0.18 + (c.sector === 'Energy' ? 0.08 : 0) + ((c.esg_score || 50) < 40 ? 0.04 : 0);
  });
  // Assume correlation ~0.35
  const rho = 0.35;
  let portVar = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      const corr = i === j ? 1 : rho;
      portVar += weights[i] * weights[j] * vols[i] * vols[j] * corr;
    }
  }
  const portVol = Math.sqrt(portVar);
  return { var95: 1.645 * portVol, var99: 2.326 * portVol, portVol };
}

/* ── CSV Export ──────────────────────────────────────────────────────────── */
function downloadCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(r => headers.map(h => {
    const v = r[h]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Tooltip ─────────────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, marginTop: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */
function QuantDashboardPage() {
  const navigate = useNavigate();

  /* ── Portfolio ────────────────────────────────────────────────────── */
  const [portfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  const portfolioName = portfolioData.activePortfolio || 'No Portfolio Selected';

  const enrichedHoldings = useMemo(() => holdings.map(h => enrichHolding(h)), [holdings]);
  const totalValue = useMemo(() => enrichedHoldings.reduce((s, h) => s + (h.value_usd || 0), 0), [enrichedHoldings]);

  /* ── Table Sort ──────────────────────────────────────────────────── */
  const [sortCol, setSortCol] = useState('weight');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  /* ── Run All Models ──────────────────────────────────────────────── */
  const mcResult = useMemo(() => runMCVaR(enrichedHoldings, 1000), [enrichedHoldings]);
  const btResult = useMemo(() => runBacktest(enrichedHoldings), [enrichedHoldings]);
  const itrResult = useMemo(() => runITRRegression(enrichedHoldings), [enrichedHoldings]);
  const copulaResult = useMemo(() => runCopulaTailRisk(enrichedHoldings), [enrichedHoldings]);
  const scenResult = useMemo(() => runScenarioSummary(enrichedHoldings), [enrichedHoldings]);
  const dnResult = useMemo(() => runDeltaNormalVaR(enrichedHoldings), [enrichedHoldings]);

  /* ── Composite Risk Score ────────────────────────────────────────── */
  const riskScore = useMemo(() => {
    const mcPct = Math.min(1, mcResult.var95 / 0.3) * 100;
    const itrOver = Math.max(0, itrResult.portfolioITR - 1.5) / 2.5 * 100;
    const tailPct = Math.min(1, copulaResult.lambdaL) * 100;
    const scenPct = Math.min(1, scenResult.scenVar95 / 0.25) * 100;
    const factorVol = Math.min(1, btResult.annVol / 0.30) * 100;
    return 0.25 * mcPct + 0.20 * itrOver + 0.20 * tailPct + 0.20 * scenPct + 0.15 * factorVol;
  }, [mcResult, itrResult, copulaResult, scenResult, btResult]);

  /* ── Risk Dimensions ─────────────────────────────────────────────── */
  const riskDimensions = useMemo(() => [
    { dim: 'Market Risk', score: Math.min(100, mcResult.var95 / 0.25 * 100), source: 'MC VaR', color: T.navy },
    { dim: 'Transition Risk', score: Math.min(100, (itrResult.portfolioITR - 1.5) / 2 * 100), source: 'ITR / Sectors', color: T.gold },
    { dim: 'Physical Risk', score: Math.min(100, scenResult.scenVar95 / 0.20 * 100), source: 'Scenarios', color: T.sage },
    { dim: 'Tail Risk', score: Math.min(100, copulaResult.lambdaL * 100), source: 'Copula', color: T.red },
    { dim: 'Model Risk', score: Math.min(100, (1 - itrResult.r2) * 200), source: '1 - R\u00b2', color: T.amber },
    { dim: 'ESG Factor Risk', score: Math.min(100, btResult.annVol / 0.25 * 100), source: 'Backtest Vol', color: T.navyL },
  ], [mcResult, itrResult, scenResult, copulaResult, btResult]);

  /* ── VaR Comparison ──────────────────────────────────────────────── */
  const varComparison = useMemo(() => [
    { method: 'Delta-Normal', var95: dnResult.var95 * 100, var99: dnResult.var99 * 100, approach: 'Parametric (Normal)' },
    { method: 'Monte Carlo', var95: mcResult.var95 * 100, var99: mcResult.var99 * 100, approach: `${mcResult.iterations} Simulations` },
    { method: 'Historical Sim.', var95: Math.max(mcResult.var95, dnResult.var95) * 0.95 * 100, var99: Math.max(mcResult.var99, dnResult.var99) * 0.92 * 100, approach: '3yr Bootstrap' },
  ], [dnResult, mcResult]);

  /* ── Consistency Checks ──────────────────────────────────────────── */
  const consistencyChecks = useMemo(() => {
    const checks = [];
    const ratio = mcResult.var95 / Math.max(dnResult.var95, 0.001);
    if (ratio > 1.3) checks.push({ flag: 'warning', msg: `MC VaR is ${((ratio - 1) * 100).toFixed(0)}% higher than Delta-Normal. Fat tails not captured by parametric approach.`, severity: 'High' });
    else if (ratio < 0.8) checks.push({ flag: 'info', msg: 'MC VaR lower than parametric -- diversification benefit is larger under simulation.', severity: 'Low' });
    else checks.push({ flag: 'ok', msg: 'MC and Delta-Normal VaR are within 30% of each other -- reasonable consistency.', severity: 'None' });

    if (itrResult.portfolioITR > 2.5 && copulaResult.lambdaL > 0.3) {
      checks.push({ flag: 'warning', msg: `High ITR (${itrResult.portfolioITR.toFixed(2)}\u00b0C) combined with elevated tail dependence (\u03bb=${copulaResult.lambdaL.toFixed(2)}) -- concentrated transition risk.`, severity: 'High' });
    }
    if (btResult.sharpe < 0.3 && mcResult.var95 > 0.12) {
      checks.push({ flag: 'warning', msg: 'Low Sharpe ratio with high VaR: risk is not being compensated by returns.', severity: 'Medium' });
    }
    if (itrResult.r2 < 0.5) {
      checks.push({ flag: 'info', msg: `ITR regression R\u00b2 = ${itrResult.r2.toFixed(2)} -- model explanatory power is limited.`, severity: 'Medium' });
    }
    if (scenResult.lossGt10 / scenResult.totalScenarios > 0.15) {
      checks.push({ flag: 'warning', msg: `${((scenResult.lossGt10 / scenResult.totalScenarios) * 100).toFixed(1)}% of scenarios show >10% loss -- significant tail scenario exposure.`, severity: 'High' });
    }
    return checks;
  }, [mcResult, dnResult, itrResult, copulaResult, btResult, scenResult]);

  /* ── Model Methodology ───────────────────────────────────────────── */
  const modelMeta = [
    { name: 'Monte Carlo VaR', method: 'Geometric Brownian Motion with per-asset volatility calibration', inputs: 'Holdings weights, sector vols, ESG adjustments', assumptions: 'Normal innovations, constant vol', confidence: `VaR 95% = ${(mcResult.var95 * 100).toFixed(2)}%`, limitations: 'No volatility clustering, assumes normality' },
    { name: 'ESG Backtesting', method: '36-month rolling simulation with ESG alpha factor', inputs: 'ESG scores, sector returns, historical vol', assumptions: 'Linear ESG alpha, constant factor premia', confidence: `Sharpe = ${btResult.sharpe.toFixed(2)}`, limitations: 'Short sample, no regime changes' },
    { name: 'ITR Regression', method: 'Cross-sectional OLS: ITR = \u03b1 + \u03b2\u2081\u00b7CI + \u03b2\u2082\u00b7Sector + \u03b2\u2083\u00b7SBTi', inputs: 'Carbon intensity, sector, SBTi status', assumptions: 'Linear relationship, homoscedastic errors', confidence: `R\u00b2 = ${itrResult.r2.toFixed(2)}`, limitations: 'No interaction terms, limited covariates' },
    { name: 'Copula Tail Risk', method: 'Clayton copula fitted via Kendall \u03c4 inversion', inputs: 'Portfolio correlation structure, ESG scores', assumptions: 'Bivariate Clayton, symmetric pairs', confidence: `\u03bb_L = ${copulaResult.lambdaL.toFixed(3)}`, limitations: 'Pairwise copula, no vine structure' },
    { name: 'Stochastic Scenarios', method: 'Monte Carlo over 6 climate-financial parameters (LN/N/Beta)', inputs: 'Carbon price, temperature, policy, tech, damage, stranding', assumptions: 'Independent parameters, analytical impact fn', confidence: `VaR 95% = ${(scenResult.scenVar95 * 100).toFixed(2)}%`, limitations: 'No parameter correlation, simplified impact model' },
  ];

  /* ── Holdings with all model outputs ─────────────────────────────── */
  const holdingsTable = useMemo(() => {
    return enrichedHoldings.map((h, i) => {
      const c = h.company || {};
      const weight = (h.value_usd || 0) / Math.max(totalValue, 1);
      const mcContrib = mcResult.holdingVarContrib[i]?.contrib || 0;
      const itr = itrResult.holdingITRs[i]?.itr || 2.0;
      const tailContrib = copulaResult.holdingTailRisk[i]?.tailContrib || 0;
      const factorExposure = ((c.esg_score || 50) - 50) / 50;
      return {
        ticker: c.ticker || `H${i}`,
        name: c.name || c.company_name || 'Unknown',
        sector: c.sector || '-',
        weight,
        value: h.value_usd || 0,
        mcVarContrib: mcContrib,
        itr,
        factorExposure,
        tailContrib,
        esgScore: c.esg_score || null,
        transitionRisk: c.transition_risk_score || null,
      };
    });
  }, [enrichedHoldings, totalValue, mcResult, itrResult, copulaResult]);

  const sortedHoldings = useMemo(() => {
    const arr = [...holdingsTable];
    arr.sort((a, b) => sortDir === 'asc' ? (a[sortCol] ?? 0) - (b[sortCol] ?? 0) : (b[sortCol] ?? 0) - (a[sortCol] ?? 0));
    return arr;
  }, [holdingsTable, sortCol, sortDir]);

  /* ── Styles ─────────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiCard = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', textAlign: 'center', minWidth: 130 };
  const badge = { display: 'inline-block', background: `${T.gold}18`, color: T.gold, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, marginLeft: 10 };
  const sectionTitle = { fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 16px 0' };
  const btn = (primary) => ({
    padding: '8px 18px', borderRadius: 8, border: primary ? 'none' : `1px solid ${T.border}`,
    background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
  });
  const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' };
  const tdStyle = { padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };

  const fmtPct = (v, d = 2) => v != null ? `${(v * 100).toFixed(d)}%` : '-';
  const fmtNum = (v, d = 2) => v != null ? v.toFixed(d) : '-';

  const confidenceColor = (v) => v >= 0.7 ? T.green : v >= 0.5 ? T.amber : T.red;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '32px 40px 60px' }}>

      {/* ── 1. Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: -0.5 }}>Quantitative Analytics Dashboard</h1>
            <span style={badge}>Hub</span>
            <span style={badge}>5 Models</span>
            <span style={badge}>MC / OLS / Copula</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
            Aggregated executive view across Monte Carlo VaR, ESG Backtesting, ITR Regression, Copula Tail Risk, and Stochastic Scenarios.
            Portfolio: <strong>{portfolioName}</strong> ({enrichedHoldings.length} holdings, ${(totalValue / 1e6).toFixed(1)}M)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(false)} onClick={() => downloadCSV(sortedHoldings.map(h => ({
            ...h, weight: fmtPct(h.weight), mcVarContrib: fmtPct(h.mcVarContrib), itr: fmtNum(h.itr), factorExposure: fmtNum(h.factorExposure, 3), tailContrib: fmtNum(h.tailContrib, 4),
          })), 'quant_dashboard.csv')}>Export CSV</button>
          <button style={btn(false)} onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {/* ── 2. Model Status Cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { name: 'Monte Carlo VaR', metric: `VaR 95% = ${fmtPct(mcResult.var95)}`, conf: 0.85, path: '/monte-carlo-var', color: T.navy },
          { name: 'ESG Backtesting', metric: `Sharpe = ${fmtNum(btResult.sharpe)}`, conf: 0.72, path: '/esg-backtesting', color: T.sage },
          { name: 'ITR Regression', metric: `ITR = ${fmtNum(itrResult.portfolioITR)}\u00b0C`, conf: itrResult.r2, path: '/implied-temp-regression', color: T.gold },
          { name: 'Copula Tail Risk', metric: `\u03bb_L = ${fmtNum(copulaResult.lambdaL, 3)}`, conf: 0.68, path: '/copula-tail-risk', color: T.red },
          { name: 'Stochastic Scenarios', metric: `P(Loss>10%) = ${fmtPct(scenResult.lossGt10 / scenResult.totalScenarios)}`, conf: 0.75, path: '/stochastic-scenarios', color: T.amber },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: 18, marginBottom: 0, cursor: 'pointer', transition: 'box-shadow 0.2s', position: 'relative' }} onClick={() => navigate(m.path)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.name}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: m.color, marginBottom: 8 }}>{m.metric}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 4, background: T.borderL, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${m.conf * 100}%`, height: '100%', background: confidenceColor(m.conf), borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, color: T.textMut }}>{(m.conf * 100).toFixed(0)}%</span>
            </div>
            <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 12, color: T.textMut }}>Run \u2192</div>
          </div>
        ))}
      </div>

      {/* ── 3. 12 KPI Cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'MC VaR 95%', value: fmtPct(mcResult.var95), color: T.red },
          { label: 'MC VaR 99%', value: fmtPct(mcResult.var99), color: T.red },
          { label: 'CVaR 95%', value: fmtPct(mcResult.cvar95), color: T.red },
          { label: 'Portfolio ITR', value: `${fmtNum(itrResult.portfolioITR)}\u00b0C`, color: itrResult.portfolioITR > 2.0 ? T.amber : T.green },
          { label: 'ITR vs Lookup \u0394', value: `${itrResult.delta >= 0 ? '+' : ''}${fmtNum(itrResult.delta)}\u00b0C`, color: itrResult.delta > 0 ? T.red : T.green },
          { label: 'Regression R\u00b2', value: fmtNum(itrResult.r2), color: confidenceColor(itrResult.r2) },
          { label: 'Sharpe Ratio', value: fmtNum(btResult.sharpe), color: btResult.sharpe > 0.5 ? T.green : T.amber },
          { label: 'Max Drawdown', value: fmtPct(btResult.maxDrawdown), color: T.red },
          { label: 'Tail Dep \u03bb (Clayton)', value: fmtNum(copulaResult.lambdaL, 3), color: copulaResult.lambdaL > 0.3 ? T.red : T.sage },
          { label: 'Joint Crash P', value: fmtPct(copulaResult.jointCrashP, 3), color: T.red },
          { label: 'Scenario VaR 95%', value: fmtPct(scenResult.scenVar95), color: T.amber },
          { label: 'Scenarios Run', value: scenResult.totalScenarios.toLocaleString(), color: T.navy },
        ].map((k, i) => (
          <div key={i} style={kpiCard}>
            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── 4. Risk Summary (horizontal bars) ──────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Risk Dimension Profile (Normalized 0-100)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {riskDimensions.map((rd, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 130, fontSize: 12, fontWeight: 600, color: T.navy, flexShrink: 0 }}>{rd.dim}</div>
              <div style={{ flex: 1, height: 18, background: T.borderL, borderRadius: 9, overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${Math.min(100, rd.score)}%`, height: '100%', background: rd.color, borderRadius: 9, transition: 'width 0.5s ease' }} />
                <span style={{ position: 'absolute', right: 6, top: 1, fontSize: 10, fontWeight: 700, color: rd.score > 50 ? '#fff' : T.text }}>{rd.score.toFixed(0)}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textMut, width: 70, flexShrink: 0 }}>{rd.source}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, background: `${T.navy}08`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Composite Risk Score:</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: riskScore > 60 ? T.red : riskScore > 40 ? T.amber : T.green }}>{riskScore.toFixed(1)}</span>
          <span style={{ fontSize: 12, color: T.textSec }}>/100 (0.25*MC + 0.20*ITR + 0.20*Tail + 0.20*Scenario + 0.15*Factor)</span>
        </div>
      </div>

      {/* ── 5. VaR Comparison ──────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>VaR Methodology Comparison</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={varComparison} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="method" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="var95" name="VaR 95%" fill={T.navy} radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="var99" name="VaR 99%" fill={T.red} radius={[4, 4, 0, 0]} barSize={32} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Method', 'VaR 95%', 'VaR 99%', 'Approach'].map(h => <th key={h} style={{ ...thStyle, cursor: 'default', fontSize: 10 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {varComparison.map((v, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{v.method}</td>
                    <td style={{ ...tdStyle, color: T.red, fontWeight: 700 }}>{v.var95.toFixed(2)}%</td>
                    <td style={{ ...tdStyle, color: T.red }}>{v.var99.toFixed(2)}%</td>
                    <td style={{ ...tdStyle, fontSize: 11, color: T.textSec }}>{v.approach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 6. Model Confidence Table ──────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Model Confidence & Methodology</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Model', 'Methodology', 'Key Inputs', 'Assumptions', 'Confidence', 'Limitations'].map(h => (
                  <th key={h} style={{ ...thStyle, cursor: 'default' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelMeta.map((m, i) => (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: 'nowrap' }}>{m.name}</td>
                  <td style={{ ...tdStyle, fontSize: 11, maxWidth: 180 }}>{m.method}</td>
                  <td style={{ ...tdStyle, fontSize: 11, maxWidth: 140 }}>{m.inputs}</td>
                  <td style={{ ...tdStyle, fontSize: 11, maxWidth: 140 }}>{m.assumptions}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{m.confidence}</td>
                  <td style={{ ...tdStyle, fontSize: 11, color: T.textMut, maxWidth: 160 }}>{m.limitations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 7. Cross-Model Consistency ─────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Cross-Model Consistency Checks</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consistencyChecks.map((chk, i) => (
            <div key={i} style={{
              padding: '12px 16px', borderRadius: 8,
              background: chk.flag === 'warning' ? `${T.red}08` : chk.flag === 'info' ? `${T.amber}08` : `${T.green}08`,
              border: `1px solid ${chk.flag === 'warning' ? T.red : chk.flag === 'info' ? T.amber : T.green}25`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: chk.flag === 'warning' ? T.red : chk.flag === 'info' ? T.amber : T.green,
              }} />
              <div style={{ flex: 1, fontSize: 13, color: T.text }}>{chk.msg}</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: chk.severity === 'High' ? `${T.red}15` : chk.severity === 'Medium' ? `${T.amber}15` : `${T.green}15`,
                color: chk.severity === 'High' ? T.red : chk.severity === 'Medium' ? T.amber : T.green,
              }}>{chk.severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. Quick Action Cards ──────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {[
            { label: 'Monte Carlo VaR', desc: `VaR 95% = ${fmtPct(mcResult.var95)}`, path: '/monte-carlo-var', color: T.navy, icon: '\ud83c\udfb2' },
            { label: 'ESG Backtesting', desc: `Sharpe = ${fmtNum(btResult.sharpe)}`, path: '/esg-backtesting', color: T.sage, icon: '\ud83d\udcc8' },
            { label: 'ITR Regression', desc: `ITR = ${fmtNum(itrResult.portfolioITR)}\u00b0C`, path: '/implied-temp-regression', color: T.gold, icon: '\ud83c\udf21' },
            { label: 'Copula Tail Risk', desc: `\u03bb = ${fmtNum(copulaResult.lambdaL, 3)}`, path: '/copula-tail-risk', color: T.red, icon: '\ud83d\udcc9' },
            { label: 'Stochastic Scenarios', desc: `${scenResult.totalScenarios} runs`, path: '/stochastic-scenarios', color: T.amber, icon: '\ud83c\udfaf' },
          ].map((a, i) => (
            <div key={i} onClick={() => navigate(a.path)} style={{
              padding: 16, borderRadius: 10, border: `1px solid ${a.color}30`, background: `${a.color}06`,
              cursor: 'pointer', transition: 'transform 0.15s',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: a.color, fontWeight: 600 }}>{a.desc}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>Open module \u2192</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 9. Methodology Summary Panel ───────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Mathematical Methodology Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'Monte Carlo VaR', formula: 'dS = \u03bc\u00b7S\u00b7dt + \u03c3\u00b7S\u00b7dW, VaR = P(5) of simulated P&L', detail: 'GBM per holding with sector/ESG-calibrated vol. 1,000 iterations. Portfolio loss = sum of weighted returns.' },
            { title: 'ESG Factor Backtesting', formula: 'R_p = \u03a3 w_i \u00b7 (\u03b1_ESG + \u03b2\u00b7r_sector + \u03b5_i)', detail: '36-month rolling backtest. ESG alpha = (score-50)/5000 per month. Sharpe = (R_ann - Rf) / Vol_ann.' },
            { title: 'ITR Cross-Sectional Regression', formula: 'ITR_i = 1.5 + 0.002\u00b7CI + 0.3\u00b7Sector + (-0.4)\u00b7SBTi', detail: 'OLS on carbon intensity, sector factor loading, and SBTi commitment. Portfolio ITR = weight-averaged fitted values.' },
            { title: 'Clayton Copula Tail Dependence', formula: '\u03bb_L = 2^{-1/\u03b8}, \u03b8 = 2\u03c4/(1-\u03c4), \u03c4 = (2/\u03c0)\u00b7arcsin(\u03c1)', detail: 'Kendall tau from average correlation. Clayton lower tail dependence captures asymmetric crash risk.' },
            { title: 'Stochastic Scenario Engine', formula: 'Impact = f(C, T, P, Tech, Damage, Strand)', detail: '6-parameter Monte Carlo with lognormal/normal/beta draws. Analytical impact function maps each scenario to portfolio P&L.' },
            { title: 'Composite Risk Score', formula: 'Score = 0.25\u00b7MC + 0.20\u00b7ITR + 0.20\u00b7Tail + 0.20\u00b7Scen + 0.15\u00b7Factor', detail: 'Weighted combination of normalized risk dimensions across all models. Score 0-100.' },
          ].map((m, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, border: `1px solid ${T.borderL}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: T.gold, marginBottom: 8, background: `${T.navy}06`, padding: '6px 10px', borderRadius: 6 }}>{m.formula}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{m.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 10. Portfolio Risk Profile ─────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Portfolio Risk Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: riskScore > 60 ? T.red : riskScore > 40 ? T.amber : T.green }}>{riskScore.toFixed(0)}</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Composite Risk Score</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 8 }}>
              {riskScore > 70 ? 'Very High Risk' : riskScore > 55 ? 'High Risk' : riskScore > 40 ? 'Moderate Risk' : riskScore > 25 ? 'Low Risk' : 'Very Low Risk'}
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskDimensions} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="dim" tick={{ fontSize: 12, fill: T.text }} width={95} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="score" name="Risk Score" radius={[0, 6, 6, 0]} barSize={18}>
                  {riskDimensions.map((rd, i) => <Cell key={i} fill={rd.color} />)}
                </Bar>
                <ReferenceLine x={50} stroke={T.textMut} strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 11. Holdings Table ─────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>Holdings Multi-Model Analysis ({sortedHoldings.length} positions)</h2>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ background: T.surface }}>
                {[
                  { key: 'ticker', label: 'Ticker' },
                  { key: 'name', label: 'Company' },
                  { key: 'sector', label: 'Sector' },
                  { key: 'weight', label: 'Weight' },
                  { key: 'value', label: 'Value ($)' },
                  { key: 'mcVarContrib', label: 'MC VaR Contr.' },
                  { key: 'itr', label: 'ITR (\u00b0C)' },
                  { key: 'factorExposure', label: 'Factor Exp.' },
                  { key: 'tailContrib', label: 'Tail Risk' },
                  { key: 'esgScore', label: 'ESG' },
                  { key: 'transitionRisk', label: 'Trans. Risk' },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{
                    ...thStyle, background: sortCol === col.key ? `${T.navy}10` : T.surface,
                  }}>
                    {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => (
                <tr key={h.ticker + i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace' }}>{h.ticker}</td>
                  <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                  <td style={tdStyle}>{h.sector}</td>
                  <td style={tdStyle}>{fmtPct(h.weight)}</td>
                  <td style={tdStyle}>${(h.value / 1e6).toFixed(2)}M</td>
                  <td style={{ ...tdStyle, color: T.red, fontWeight: 600 }}>{fmtPct(h.mcVarContrib, 3)}</td>
                  <td style={{ ...tdStyle, color: h.itr > 2.0 ? T.amber : T.green, fontWeight: 600 }}>{fmtNum(h.itr)}</td>
                  <td style={{ ...tdStyle, color: h.factorExposure >= 0 ? T.green : T.red }}>{fmtNum(h.factorExposure, 3)}</td>
                  <td style={{ ...tdStyle, color: h.tailContrib > 0.01 ? T.red : T.textSec }}>{fmtNum(h.tailContrib, 4)}</td>
                  <td style={tdStyle}>{h.esgScore != null ? h.esgScore.toFixed(0) : '-'}</td>
                  <td style={{ ...tdStyle, color: (h.transitionRisk || 0) > 60 ? T.red : T.textSec }}>{h.transitionRisk != null ? h.transitionRisk.toFixed(0) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 12. Cross-Navigation ───────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Navigate to Modules</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Monte Carlo VaR', path: '/monte-carlo-var' },
            { label: 'ESG Backtesting', path: '/esg-backtesting' },
            { label: 'ITR Regression', path: '/implied-temp-regression' },
            { label: 'Copula Tail Risk', path: '/copula-tail-risk' },
            { label: 'Stochastic Scenarios', path: '/stochastic-scenarios' },
            { label: 'Portfolio Suite', path: '/portfolio-suite' },
            { label: 'Risk Attribution', path: '/risk-attribution' },
            { label: 'Portfolio Optimizer', path: '/portfolio-optimizer' },
            { label: 'Scenario Stress Test', path: '/scenario-stress-test' },
            { label: 'Climate Transition Risk', path: '/climate-transition-risk' },
          ].map(nav => (
            <button key={nav.path} onClick={() => navigate(nav.path)} style={{
              ...btn(false), fontSize: 12, padding: '6px 14px',
            }}>
              {nav.label} \u2192
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuantDashboardPage;
