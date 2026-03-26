import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

// ─── Normal CDF (Abramowitz & Stegun approximation) ──────────────────────────
function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1.0 / (1.0 + p * Math.abs(x));
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1.0 + sign * y);
}

// ─── Normal Inverse CDF (Beasley-Springer-Moro) ─────────────────────────────
function normalInvCDF(p) {
  if (p <= 0) return -8; if (p >= 1) return 8;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const p_low = 0.02425, p_high = 1 - p_low;
  let q, r;
  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= p_high) {
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

// ─── Copula Functions ────────────────────────────────────────────────────────

// Gaussian Copula density (bivariate)
function gaussianCopulaCDF(u1, u2, rho) {
  const x1 = normalInvCDF(Math.max(1e-8, Math.min(1 - 1e-8, u1)));
  const x2 = normalInvCDF(Math.max(1e-8, Math.min(1 - 1e-8, u2)));
  // Bivariate normal CDF approximation via product + correction
  const phi1 = normalCDF(x1);
  const phi2 = normalCDF(x2);
  // First-order approximation
  const correction = rho * Math.exp(-(x1 * x1 + x2 * x2 - 2 * rho * x1 * x2) / (2 * (1 - rho * rho))) / (2 * Math.PI * Math.sqrt(1 - rho * rho));
  return Math.max(0, Math.min(1, phi1 * phi2 + correction * 0.1));
}

// Clayton Copula
function claytonCopulaCDF(u1, u2, theta) {
  if (theta < 0.01) return u1 * u2; // independence
  const val = Math.pow(Math.max(1e-10, u1), -theta) + Math.pow(Math.max(1e-10, u2), -theta) - 1;
  return Math.pow(Math.max(1e-10, val), -1 / theta);
}

function claytonLowerTailDep(theta) {
  if (theta <= 0) return 0;
  return Math.pow(2, -1 / theta);
}

// Gumbel Copula
function gumbelCopulaCDF(u1, u2, theta) {
  if (theta < 1.01) return u1 * u2;
  const lu1 = -Math.log(Math.max(1e-10, u1));
  const lu2 = -Math.log(Math.max(1e-10, u2));
  const A = Math.pow(lu1, theta) + Math.pow(lu2, theta);
  return Math.exp(-Math.pow(A, 1 / theta));
}

function gumbelUpperTailDep(theta) {
  if (theta <= 1) return 0;
  return 2 - Math.pow(2, 1 / theta);
}

// Frank Copula
function frankCopulaCDF(u1, u2, theta) {
  if (Math.abs(theta) < 0.01) return u1 * u2;
  const num = (Math.exp(-theta * u1) - 1) * (Math.exp(-theta * u2) - 1);
  const den = Math.exp(-theta) - 1;
  return -Math.log(1 + num / den) / theta;
}

// ─── Copula Types ────────────────────────────────────────────────────────────
const COPULA_TYPES = [
  { id: 'gaussian', name: 'Gaussian Copula', description: 'Symmetric dependence, no tail dependence', color: '#3b82f6' },
  { id: 'clayton', name: 'Clayton Copula', description: 'Lower tail dependence \u2014 captures joint crash risk', color: '#dc2626' },
  { id: 'gumbel', name: 'Gumbel Copula', description: 'Upper tail dependence \u2014 captures joint recovery', color: '#16a34a' },
  { id: 'frank', name: 'Frank Copula', description: 'Symmetric, moderate tail dependence', color: '#7c3aed' },
];

// ─── Tail risk computation ───────────────────────────────────────────────────
function computeCopulaJoint(u1, u2, copulaType, theta) {
  switch (copulaType) {
    case 'gaussian': return gaussianCopulaCDF(u1, u2, Math.min(0.99, theta / 10));
    case 'clayton': return claytonCopulaCDF(u1, u2, theta);
    case 'gumbel': return gumbelCopulaCDF(u1, u2, Math.max(1, theta));
    case 'frank': return frankCopulaCDF(u1, u2, theta);
    default: return u1 * u2;
  }
}

function computeTailDependence(copulaType, theta) {
  let lambdaL = 0, lambdaU = 0;
  switch (copulaType) {
    case 'gaussian':
      // Gaussian has no tail dependence unless rho=1
      const rho = Math.min(0.99, theta / 10);
      lambdaL = 0;
      lambdaU = 0;
      break;
    case 'clayton':
      lambdaL = claytonLowerTailDep(theta);
      lambdaU = 0;
      break;
    case 'gumbel':
      lambdaL = 0;
      lambdaU = gumbelUpperTailDep(Math.max(1, theta));
      break;
    case 'frank':
      lambdaL = 0; // Frank has no tail dependence
      lambdaU = 0;
      break;
    default: break;
  }
  return { lambdaL, lambdaU };
}

// Monte Carlo simulation for portfolio tail VaR
function simulatePortfolioLoss(sectorWeights, sectorVols, copulaType, theta, nSim) {
  const rng = seedRandom(42);
  const sectors = Object.keys(sectorWeights);
  const losses = [];

  for (let sim = 0; sim < nSim; sim++) {
    // Generate correlated uniform variates via copula
    const uniforms = sectors.map(() => rng());
    // Apply copula correlation to first two sectors (primary pair)
    if (sectors.length >= 2) {
      const u1 = uniforms[0];
      const u2 = uniforms[1];
      const joint = computeCopulaJoint(u1, u2, copulaType, theta);
      // Adjust second uniform to be conditional
      const condU2 = joint > 0 ? Math.min(1 - 1e-8, joint / Math.max(1e-8, u1)) : u2;
      uniforms[1] = Math.max(1e-8, Math.min(1 - 1e-8, condU2));
    }

    // Convert uniforms to losses via inverse CDF (normal marginals)
    let portfolioLoss = 0;
    sectors.forEach((sec, i) => {
      const z = normalInvCDF(uniforms[i]);
      const vol = sectorVols[sec] || 0.20;
      const sectorLoss = -z * vol; // positive = loss
      portfolioLoss += (sectorWeights[sec] || 0) * sectorLoss;
    });
    losses.push(portfolioLoss);
  }

  losses.sort((a, b) => b - a); // descending (worst first)
  return losses;
}

// Seeded PRNG (Mulberry32)
function seedRandom(seed) {
  let s = seed;
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── Stress scenarios ────────────────────────────────────────────────────────
const STRESS_SCENARIOS = [
  { id: 'carbon_shock', name: 'Coordinated Carbon Shock', description: 'All sectors experience simultaneous carbon price surge', shocks: { Energy: -0.45, Materials: -0.30, Industrials: -0.20, Utilities: -0.35, Financials: -0.10, IT: -0.05, 'Health Care': -0.03, 'Consumer Discretionary': -0.15, 'Consumer Staples': -0.08, 'Real Estate': -0.20, 'Communication Services': -0.05 } },
  { id: 'green_collapse', name: 'Green Premium Collapse', description: 'IT/HealthCare green bubble bursts while Energy recovers', shocks: { Energy: 0.10, Materials: -0.05, Industrials: -0.08, Utilities: 0.05, Financials: -0.12, IT: -0.35, 'Health Care': -0.25, 'Consumer Discretionary': -0.10, 'Consumer Staples': -0.03, 'Real Estate': -0.05, 'Communication Services': -0.20 } },
  { id: 'physical_catastrophe', name: 'Physical Catastrophe', description: 'Extreme weather destroys infrastructure and supply chains', shocks: { Energy: -0.25, Materials: -0.20, Industrials: -0.30, Utilities: -0.40, Financials: -0.15, IT: -0.05, 'Health Care': -0.10, 'Consumer Discretionary': -0.18, 'Consumer Staples': -0.12, 'Real Estate': -0.45, 'Communication Services': -0.08 } },
  { id: 'greenwashing', name: 'Greenwashing Scandal', description: 'Systemic ESG fraud triggers reputation-driven selloff', shocks: { Energy: -0.30, Materials: -0.15, Industrials: -0.10, Utilities: -0.20, Financials: -0.35, IT: -0.08, 'Health Care': -0.05, 'Consumer Discretionary': -0.12, 'Consumer Staples': -0.06, 'Real Estate': -0.15, 'Communication Services': -0.10 } },
  { id: 'policy_whiplash', name: 'Policy Whiplash', description: 'Abrupt policy reversal creates cross-sector chaos', shocks: { Energy: 0.15, Materials: -0.25, Industrials: -0.15, Utilities: -0.30, Financials: -0.20, IT: -0.10, 'Health Care': -0.05, 'Consumer Discretionary': -0.18, 'Consumer Staples': -0.10, 'Real Estate': -0.22, 'Communication Services': -0.08 } },
];

const ALL_SECTORS = ['Energy', 'Materials', 'Industrials', 'Utilities', 'Financials', 'IT', 'Health Care', 'Consumer Discretionary', 'Consumer Staples', 'Real Estate', 'Communication Services'];

// ─── Portfolio reader ────────────────────────────────────────────────────────
function readPortfolio() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return null;
    const outer = JSON.parse(raw);
    if (!outer || !outer.portfolios) return null;
    const pid = outer.activePortfolio || Object.keys(outer.portfolios)[0];
    const p = outer.portfolios[pid];
    if (!p || !p.holdings || !p.holdings.length) return null;
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { lookup[c.isin] = c; });
    const holdings = p.holdings.map(h => {
      const company = lookup[h.isin] || GLOBAL_COMPANY_MASTER.find(c => c.company_name === h.name);
      if (!company) return null;
      return { ...h, company, weight: h.weight_pct || h.weight || 0, exposure_usd_mn: h.exposure_usd_mn || 0 };
    }).filter(Boolean);
    return { name: p.name || pid, holdings };
  } catch { return null; }
}

function demoHoldings() {
  const sample = GLOBAL_COMPANY_MASTER.filter(c => c.scope1_mt > 0 && c.revenue_usd_mn > 0).slice(0, 25);
  const w = 100 / sample.length;
  return sample.map(c => ({ isin: c.isin, name: c.company_name, company: c, weight: w, exposure_usd_mn: c.market_cap_usd_mn ? c.market_cap_usd_mn * 0.01 : 50 }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, d = 2) { if (n == null || isNaN(n)) return '\u2014'; return n.toFixed(d); }
function fmtPct(n) { if (n == null || isNaN(n)) return '\u2014'; return (n * 100).toFixed(2) + '%'; }
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function KpiCard({ label, value, valueColor, sub, icon }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: valueColor || T.navy, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color || p.fill }} />
          <span style={{ color: T.textSec }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: T.navy }}>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function CopulaTailRiskPage() {
  const navigate = useNavigate();
  const [selectedCopula, setSelectedCopula] = useState('clayton');
  const [theta, setTheta] = useState(3);
  const [sortCol, setSortCol] = useState('tailContrib');
  const [sortDir, setSortDir] = useState('desc');

  // ─── Load portfolio ──────────────────────────────────────────────────────
  const { portfolioName, holdings } = useMemo(() => {
    const p = readPortfolio();
    if (p && p.holdings.length > 0) return { portfolioName: p.name, holdings: p.holdings };
    return { portfolioName: 'Demo Portfolio (25 holdings)', holdings: demoHoldings() };
  }, []);

  const totalWeight = useMemo(() => holdings.reduce((s, h) => s + h.weight, 0), [holdings]);

  // ─── Sector weights & volatilities ───────────────────────────────────────
  const sectorData = useMemo(() => {
    const weights = {};
    const vols = {};
    holdings.forEach(h => {
      const sec = h.company.sector || 'Unknown';
      weights[sec] = (weights[sec] || 0) + (h.weight / totalWeight);
    });
    // Implied volatilities based on carbon intensity
    ALL_SECTORS.forEach(sec => {
      const sectorHoldings = holdings.filter(h => (h.company.sector || 'Unknown') === sec);
      const avgIntensity = sectorHoldings.length > 0
        ? sectorHoldings.reduce((s, h) => s + ((h.company.scope1_mt || 0) + (h.company.scope2_mt || 0)) * 1e6 / (h.company.revenue_usd_mn || 1), 0) / sectorHoldings.length
        : 100;
      vols[sec] = Math.min(0.50, 0.10 + avgIntensity * 0.0003); // higher intensity = higher vol
    });
    return { weights, vols };
  }, [holdings, totalWeight]);

  // ─── Top 2 sector exposures ──────────────────────────────────────────────
  const topSectors = useMemo(() => {
    return Object.entries(sectorData.weights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name, weight]) => name);
  }, [sectorData]);

  // ─── Tail dependence for current copula ──────────────────────────────────
  const tailDeps = useMemo(() => computeTailDependence(selectedCopula, theta), [selectedCopula, theta]);

  // ─── Monte Carlo simulation ──────────────────────────────────────────────
  const simResults = useMemo(() => {
    const nSim = 5000;
    const losses = simulatePortfolioLoss(sectorData.weights, sectorData.vols, selectedCopula, theta, nSim);
    const n = losses.length;
    const var95 = losses[Math.floor(n * 0.05)] || 0;
    const var99 = losses[Math.floor(n * 0.01)] || 0;
    const var995 = losses[Math.floor(n * 0.005)] || 0;
    // Expected shortfall = average of losses beyond VaR
    const tail1pct = losses.slice(0, Math.floor(n * 0.01));
    const es99 = tail1pct.length > 0 ? tail1pct.reduce((s, v) => s + v, 0) / tail1pct.length : 0;
    const maxLoss = losses[0] || 0;
    // Joint crash probability (both top sectors lose > 2 sigma)
    const jointCrashProb = computeCopulaJoint(normalCDF(-2), normalCDF(-2), selectedCopula, theta);
    // Diversification benefit: independent VaR vs copula VaR
    const indepLosses = simulatePortfolioLoss(sectorData.weights, sectorData.vols, 'frank', 0.01, nSim);
    const indepVar99 = indepLosses.sort((a, b) => b - a)[Math.floor(nSim * 0.01)] || 0;
    const divBenefit = indepVar99 > 0 ? 1 - var99 / indepVar99 : 0;
    // Tail correlation: correlation of losses in tail
    const tailLosses = losses.slice(0, Math.floor(n * 0.05));
    const tailCorr = tailLosses.length > 2 ? computeSimpleCorrelation(tailLosses) : 0;

    return { losses, var95, var99, var995, es99, maxLoss, jointCrashProb, divBenefit, tailCorr };
  }, [sectorData, selectedCopula, theta]);

  function computeSimpleCorrelation(arr) {
    const n = arr.length;
    if (n < 3) return 0;
    const half = Math.floor(n / 2);
    const a = arr.slice(0, half);
    const b = arr.slice(half, half * 2);
    const meanA = a.reduce((s, v) => s + v, 0) / a.length;
    const meanB = b.reduce((s, v) => s + v, 0) / b.length;
    let cov = 0, varA = 0, varB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      cov += (a[i] - meanA) * (b[i] - meanB);
      varA += (a[i] - meanA) * (a[i] - meanA);
      varB += (b[i] - meanB) * (b[i] - meanB);
    }
    const denom = Math.sqrt(varA * varB);
    return denom > 0 ? cov / denom : 0;
  }

  // ─── KPI values ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    jointCrash: simResults.jointCrashProb,
    lambdaL: tailDeps.lambdaL,
    lambdaU: tailDeps.lambdaU,
    tailVaR: simResults.var995,
    es: simResults.es99,
    maxJointLoss: simResults.maxLoss,
    divBenefit: simResults.divBenefit,
    tailCorr: simResults.tailCorr,
  }), [simResults, tailDeps]);

  // ─── Joint distribution heatmap ──────────────────────────────────────────
  const heatmapData = useMemo(() => {
    const gridSize = 15;
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
      const row = [];
      for (let j = 0; j < gridSize; j++) {
        const u1 = (i + 0.5) / gridSize;
        const u2 = (j + 0.5) / gridSize;
        const joint = computeCopulaJoint(u1, u2, selectedCopula, theta);
        const indep = u1 * u2;
        const density = joint > 0 ? joint / Math.max(1e-10, indep) : 1;
        row.push({ u1: u1.toFixed(2), u2: u2.toFixed(2), density: +density.toFixed(3), joint: +joint.toFixed(4) });
      }
      grid.push(row);
    }
    return grid;
  }, [selectedCopula, theta]);

  // ─── Tail dep by copula comparison ───────────────────────────────────────
  const tailDepComparison = useMemo(() => {
    return COPULA_TYPES.map(ct => {
      const td = computeTailDependence(ct.id, theta);
      return { name: ct.name, lambdaL: +td.lambdaL.toFixed(4), lambdaU: +td.lambdaU.toFixed(4), color: ct.color };
    });
  }, [theta]);

  // ─── Exceedance probability curve ────────────────────────────────────────
  const exceedanceData = useMemo(() => {
    const losses = [...simResults.losses];
    const n = losses.length;
    const points = [];
    const thresholds = [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15, 0.18, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50];
    thresholds.forEach(x => {
      const exceed = losses.filter(l => l > x).length / n;
      points.push({ threshold: +(x * 100).toFixed(1), probability: +exceed.toFixed(4) });
    });
    return points;
  }, [simResults]);

  // ─── Copula comparison: loss distributions ───────────────────────────────
  const copulaComparisonData = useMemo(() => {
    const bins = Array.from({ length: 20 }, (_, i) => ({ loss: (i * 2.5).toFixed(1) + '%' }));
    COPULA_TYPES.forEach(ct => {
      const losses = simulatePortfolioLoss(sectorData.weights, sectorData.vols, ct.id, theta, 3000);
      const n = losses.length;
      bins.forEach((bin, i) => {
        const lo = i * 0.025;
        const hi = (i + 1) * 0.025;
        bin[ct.id] = +(losses.filter(l => l >= lo && l < hi).length / n).toFixed(4);
      });
    });
    return bins;
  }, [sectorData, theta]);

  // ─── Sector pair analysis ────────────────────────────────────────────────
  const sectorPairs = useMemo(() => {
    const activeSectors = Object.keys(sectorData.weights).filter(s => sectorData.weights[s] > 0.01);
    const pairs = [];
    for (let i = 0; i < activeSectors.length && i < 8; i++) {
      for (let j = i + 1; j < activeSectors.length && j < 8; j++) {
        const s1 = activeSectors[i], s2 = activeSectors[j];
        const v1 = sectorData.vols[s1] || 0.20, v2 = sectorData.vols[s2] || 0.20;
        const rho = Math.min(0.95, 0.3 + (v1 + v2) * 0.5); // rough correlation from vol similarity
        const gaussianTD = computeTailDependence('gaussian', rho * 10);
        const claytonTD = computeTailDependence('clayton', theta);
        const jointCrash = computeCopulaJoint(normalCDF(-2), normalCDF(-2), selectedCopula, theta);
        pairs.push({
          pair: `${s1} / ${s2}`,
          s1, s2,
          correlation: +rho.toFixed(3),
          gaussianLambdaL: +gaussianTD.lambdaL.toFixed(4),
          claytonLambdaL: +claytonTD.lambdaL.toFixed(4),
          jointCrashProb: +jointCrash.toFixed(6),
          combinedWeight: +((sectorData.weights[s1] || 0) + (sectorData.weights[s2] || 0)).toFixed(3),
        });
      }
    }
    return pairs.sort((a, b) => b.combinedWeight - a.combinedWeight).slice(0, 15);
  }, [sectorData, selectedCopula, theta]);

  // ─── Stress scenario results ─────────────────────────────────────────────
  const stressResults = useMemo(() => {
    return STRESS_SCENARIOS.map(scenario => {
      const copulaResults = {};
      COPULA_TYPES.forEach(ct => {
        let loss = 0;
        Object.entries(sectorData.weights).forEach(([sec, wt]) => {
          const shock = scenario.shocks[sec] || 0;
          // Amplify shocks by tail dependence
          const td = computeTailDependence(ct.id, theta);
          const amplifier = 1 + (td.lambdaL || td.lambdaU || 0) * 0.5;
          loss += wt * Math.abs(shock) * amplifier;
        });
        copulaResults[ct.id] = +loss.toFixed(4);
      });
      return { ...scenario, copulaResults };
    });
  }, [sectorData, theta]);

  // ─── Holdings with tail risk contribution ────────────────────────────────
  const holdingsWithTail = useMemo(() => {
    return holdings.map(h => {
      const sec = h.company.sector || 'Unknown';
      const vol = sectorData.vols[sec] || 0.20;
      const wt = h.weight / totalWeight;
      const marginalTailRisk = wt * vol * (1 + tailDeps.lambdaL * 0.5);
      const intensity = ((h.company.scope1_mt || 0) + (h.company.scope2_mt || 0)) * 1e6 / (h.company.revenue_usd_mn || 1);
      return { ...h, tailContrib: marginalTailRisk, vol, intensity, sector: sec };
    });
  }, [holdings, sectorData, totalWeight, tailDeps]);

  // ─── Sorted holdings ─────────────────────────────────────────────────────
  const sortedHoldings = useMemo(() => {
    const arr = [...holdingsWithTail];
    arr.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'name': va = a.company.company_name || ''; vb = b.company.company_name || ''; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'tailContrib': va = a.tailContrib; vb = b.tailContrib; break;
        case 'vol': va = a.vol; vb = b.vol; break;
        case 'weight': va = a.weight; vb = b.weight; break;
        case 'intensity': va = a.intensity; vb = b.intensity; break;
        default: va = a.tailContrib; vb = b.tailContrib;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [holdingsWithTail, sortCol, sortDir]);

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }
  function sortIcon(col) { return sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''; }

  // ─── Exports ─────────────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = sortedHoldings.map(h => ({
      company: h.company.company_name, sector: h.sector, weight_pct: +h.weight.toFixed(2),
      tail_risk_contrib: +h.tailContrib.toFixed(6), vol: +h.vol.toFixed(4), intensity: Math.round(h.intensity),
    }));
    downloadCSV('copula_tail_risk.csv', rows);
  }
  function handleExportJSON() {
    downloadJSON('copula_tail_risk.json', {
      portfolio: portfolioName, copula: selectedCopula, theta,
      kpis, sectorPairs: sectorPairs.slice(0, 10),
      stressResults: stressResults.map(s => ({ name: s.name, losses: s.copulaResults })),
    });
  }

  // ─── Heatmap color ───────────────────────────────────────────────────────
  function densityColor(density) {
    if (density > 2.5) return '#7f1d1d';
    if (density > 2.0) return '#dc2626';
    if (density > 1.5) return '#f97316';
    if (density > 1.2) return '#fbbf24';
    if (density > 0.8) return '#a3e635';
    return '#22c55e';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  const cardStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, marginBottom: 24 };
  const btnStyle = (active) => ({
    padding: '8px 16px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : T.surface, color: active ? '#fff' : T.textSec,
    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
  });
  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' };
  const tdStyle = { padding: '10px 14px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '32px 40px' }}>
      {/* ── Section 1: Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.navy }}>Copula-Based Tail Risk Analyzer</h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: T.red + '10', color: T.red, fontSize: 11, fontWeight: 700 }}>Clayton &middot; Gaussian &middot; Tail Dependence &middot; Joint Crash</span>
          </div>
          <div style={{ fontSize: 14, color: T.textSec }}>Portfolio: <strong>{portfolioName}</strong> &middot; {holdings.length} holdings &middot; Monte Carlo: 5,000 simulations</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportCSV} style={btnStyle(false)}>Export CSV</button>
          <button onClick={handleExportJSON} style={btnStyle(false)}>Export JSON</button>
          <button onClick={() => window.print()} style={btnStyle(false)}>Print/PDF</button>
        </div>
      </div>

      {/* ── Section 2: Copula Selector ───────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Select Copula Model" sub="Choose the dependence structure for tail risk modeling" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {COPULA_TYPES.map(ct => (
            <button
              key={ct.id}
              onClick={() => setSelectedCopula(ct.id)}
              style={{
                padding: '16px 20px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                border: selectedCopula === ct.id ? `2px solid ${ct.color}` : `1px solid ${T.border}`,
                background: selectedCopula === ct.id ? ct.color + '10' : T.surface,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: selectedCopula === ct.id ? ct.color : T.navy, marginBottom: 4 }}>{ct.name}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4 }}>{ct.description}</div>
              {selectedCopula === ct.id && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: ct.color }}>ACTIVE</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 3: Theta Slider ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Dependence Parameter (\u03B8)" sub="Controls the strength of tail dependence" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <input type="range" min={1} max={10} step={0.5} value={theta}
              onChange={e => setTheta(+e.target.value)}
              style={{ width: '100%', accentColor: COPULA_TYPES.find(c => c.id === selectedCopula)?.color || T.navy }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut, marginTop: 4 }}>
              <span>1 (weak)</span><span>3</span><span>5 (moderate)</span><span>7</span><span>10 (strong)</span>
            </div>
          </div>
          <div style={{ minWidth: 100, textAlign: 'center', padding: '12px 20px', background: T.surfaceH, borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{theta}</div>
            <div style={{ fontSize: 11, color: T.textMut }}>\u03B8 value</div>
          </div>
        </div>
      </div>

      {/* ── Section 4: 8 KPI Cards ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard icon="\uD83D\uDCA5" label="Joint Crash Prob" value={fmtPct(kpis.jointCrash)} valueColor={T.red} sub="Both top sectors > 2\u03C3 loss" />
        <KpiCard icon="\u2B07\uFE0F" label="Lower Tail Dep \u03BB_L" value={fmt(kpis.lambdaL, 4)} valueColor={kpis.lambdaL > 0.3 ? T.red : T.sage} sub="Joint crash clustering" />
        <KpiCard icon="\u2B06\uFE0F" label="Upper Tail Dep \u03BB_U" value={fmt(kpis.lambdaU, 4)} valueColor={T.green} sub="Joint recovery clustering" />
        <KpiCard icon="\uD83D\uDCC9" label="Tail VaR (99.5%)" value={fmtPct(kpis.tailVaR)} valueColor={T.red} sub="Portfolio loss at 99.5th pctl" />
        <KpiCard icon="\u26A0\uFE0F" label="Expected Shortfall" value={fmtPct(kpis.es)} valueColor={T.red} sub="Avg loss beyond 99% VaR" />
        <KpiCard icon="\uD83D\uDCC8" label="Max Joint Loss" value={fmtPct(kpis.maxJointLoss)} valueColor={T.red} sub="Worst simulated outcome" />
        <KpiCard icon="\uD83D\uDD00" label="Diversification Benefit" value={fmtPct(Math.abs(kpis.divBenefit))} valueColor={kpis.divBenefit > 0 ? T.green : T.red} sub="vs independent assumption" />
        <KpiCard icon="\uD83D\uDD17" label="Tail Correlation" value={fmt(kpis.tailCorr, 3)} valueColor={Math.abs(kpis.tailCorr) > 0.5 ? T.amber : T.sage} sub="Correlation in tail events" />
      </div>

      {/* ── Section 5: Joint Distribution Heatmap ────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Joint Distribution Heatmap" sub={`Copula density ratio C(u1,u2)/(u1*u2) for ${topSectors[0] || 'Sector 1'} vs ${topSectors[1] || 'Sector 2'}`} />
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ width: 40, textAlign: 'right', fontSize: 10, color: T.textMut, paddingBottom: 4, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 100 }}>
              {topSectors[1] || 'Sector 2'} loss quantile
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${heatmapData[0]?.length || 15}, 28px)`, gap: 1 }}>
                {heatmapData.map((row, ri) =>
                  row.map((cell, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      style={{
                        width: 28, height: 28, background: densityColor(cell.density),
                        borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, color: cell.density > 1.5 ? '#fff' : T.text, fontWeight: 600,
                      }}
                      title={`u1=${cell.u1}, u2=${cell.u2}, density ratio=${cell.density}`}
                    >
                      {cell.density > 1.8 ? cell.density.toFixed(1) : ''}
                    </div>
                  ))
                )}
              </div>
              <div style={{ textAlign: 'center', fontSize: 10, color: T.textMut, marginTop: 4 }}>
                {topSectors[0] || 'Sector 1'} loss quantile &rarr;
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 12, fontSize: 10 }}>
              {[{ v: 2.5, l: 'Extreme' }, { v: 2.0, l: 'High' }, { v: 1.5, l: 'Elevated' }, { v: 1.0, l: 'Normal' }, { v: 0.5, l: 'Low' }].map(({ v, l }) => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 2, background: densityColor(v) }} />
                  <span style={{ color: T.textSec }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 6: Tail Dep by Copula ────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Tail Dependence by Copula Type" sub={`Comparing \u03BB_L (lower) and \u03BB_U (upper) at \u03B8 = ${theta}`} />
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tailDepComparison} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="lambdaL" name="\u03BB_L (Lower Tail)" fill={T.red} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lambdaU" name="\u03BB_U (Upper Tail)" fill={T.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 7: Exceedance Probability ────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Exceedance Probability Curve" sub="P(Portfolio Loss > x) under selected copula" />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={exceedanceData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="threshold" tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'Loss Threshold (%)', position: 'bottom', offset: -2, fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'Probability', angle: -90, position: 'left', fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="probability" name="P(Loss > x)" fill={T.red + '30'} stroke={T.red} strokeWidth={2} />
              <ReferenceLine x={simResults.var99 * 100} stroke={T.navy} strokeDasharray="5 5" label={{ value: '99% VaR', fill: T.navy, fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 8: Sector Pair Analysis ───────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Sector Pair Tail Analysis" sub="Pairwise dependence and joint crash probabilities" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={thStyle}>Sector Pair</th>
                <th style={thStyle}>Correlation</th>
                <th style={thStyle}>Gaussian \u03BB_L</th>
                <th style={thStyle}>Clayton \u03BB_L</th>
                <th style={thStyle}>Joint Crash P</th>
                <th style={thStyle}>Combined Wt</th>
              </tr>
            </thead>
            <tbody>
              {sectorPairs.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{p.pair}</td>
                  <td style={tdStyle}>{p.correlation.toFixed(3)}</td>
                  <td style={tdStyle}>{p.gaussianLambdaL.toFixed(4)}</td>
                  <td style={{ ...tdStyle, color: p.claytonLambdaL > 0.3 ? T.red : T.textSec, fontWeight: p.claytonLambdaL > 0.3 ? 700 : 400 }}>{p.claytonLambdaL.toFixed(4)}</td>
                  <td style={{ ...tdStyle, color: T.red }}>{(p.jointCrashProb * 100).toFixed(4)}%</td>
                  <td style={tdStyle}>{(p.combinedWeight * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 9: Extreme Stress Scenarios ──────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Extreme Event Scenarios" sub="Portfolio loss under each copula for 5 tail scenarios" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ ...thStyle, minWidth: 180 }}>Scenario</th>
                <th style={thStyle}>Description</th>
                {COPULA_TYPES.map(ct => (
                  <th key={ct.id} style={{ ...thStyle, color: ct.color }}>{ct.name.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stressResults.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: T.navy }}>{s.name}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: T.textSec, maxWidth: 200 }}>{s.description}</td>
                  {COPULA_TYPES.map(ct => {
                    const loss = s.copulaResults[ct.id];
                    return (
                      <td key={ct.id} style={{ ...tdStyle, fontWeight: 700, color: loss > 0.15 ? T.red : loss > 0.08 ? T.amber : T.textSec }}>
                        -{(loss * 100).toFixed(2)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 10: Copula Comparison Chart ──────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Portfolio Loss Distribution by Copula" sub="Comparing tail shape across all 4 copula models" />
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={copulaComparisonData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="loss" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Loss Bin', position: 'bottom', offset: -2, fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'Density', angle: -90, position: 'left', fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              {COPULA_TYPES.map(ct => (
                <Area key={ct.id} type="monotone" dataKey={ct.id} name={ct.name} fill={ct.color + '20'} stroke={ct.color} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 11: Holdings Table ───────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Holdings with Tail Risk Contribution" sub="Marginal tail risk contribution per holding under selected copula" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={thStyle} onClick={() => toggleSort('name')}>Company{sortIcon('name')}</th>
                <th style={thStyle}>Sector</th>
                <th style={thStyle} onClick={() => toggleSort('weight')}>Weight{sortIcon('weight')}</th>
                <th style={thStyle} onClick={() => toggleSort('vol')}>Vol{sortIcon('vol')}</th>
                <th style={thStyle} onClick={() => toggleSort('intensity')}>GHG Intensity{sortIcon('intensity')}</th>
                <th style={thStyle} onClick={() => toggleSort('tailContrib')}>Tail Risk Contrib{sortIcon('tailContrib')}</th>
                <th style={thStyle}>Tail Risk Bar</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => {
                const maxTC = Math.max(...holdingsWithTail.map(x => x.tailContrib));
                const barPct = maxTC > 0 ? (h.tailContrib / maxTC) * 100 : 0;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company.company_name || 'N/A'}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{h.sector}</td>
                    <td style={tdStyle}>{fmt(h.weight, 1)}%</td>
                    <td style={tdStyle}>{fmtPct(h.vol)}</td>
                    <td style={tdStyle}>{Math.round(h.intensity).toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: h.tailContrib > 0.02 ? T.red : T.textSec }}>{(h.tailContrib * 100).toFixed(4)}%</td>
                    <td style={{ ...tdStyle, width: 150 }}>
                      <div style={{ height: 10, background: T.border, borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: barPct > 60 ? T.red : barPct > 30 ? T.amber : T.sage, borderRadius: 5 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 12: Sector Risk Contribution Breakdown ─────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Sector Risk Contribution" sub="Portfolio weight vs tail risk contribution by sector" />
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(() => {
                const map = {};
                holdingsWithTail.forEach(h => {
                  const sec = h.sector;
                  if (!map[sec]) map[sec] = { weight: 0, tailRisk: 0, count: 0 };
                  map[sec].weight += h.weight / totalWeight;
                  map[sec].tailRisk += h.tailContrib;
                  map[sec].count++;
                });
                return Object.entries(map).map(([sector, d]) => ({
                  sector,
                  weight: +(d.weight * 100).toFixed(1),
                  tailRisk: +(d.tailRisk * 100).toFixed(4),
                  ratio: d.weight > 0 ? +(d.tailRisk / d.weight).toFixed(3) : 0,
                  count: d.count,
                })).sort((a, b) => b.tailRisk - a.tailRisk);
              })()}
              margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="weight" name="Portfolio Weight (%)" fill={T.navyL} radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="tailRisk" name="Tail Risk Contrib (%)" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 13: VaR Sensitivity to Theta ─────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="VaR Sensitivity to Dependence Parameter" sub="How tail VaR changes as \u03B8 increases from 1 to 10" />
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={(() => {
                const points = [];
                for (let t = 1; t <= 10; t += 0.5) {
                  const losses = simulatePortfolioLoss(sectorData.weights, sectorData.vols, selectedCopula, t, 2000);
                  const sorted = losses.sort((a, b) => b - a);
                  const n = sorted.length;
                  points.push({
                    theta: t,
                    var95: +(sorted[Math.floor(n * 0.05)] * 100).toFixed(2),
                    var99: +(sorted[Math.floor(n * 0.01)] * 100).toFixed(2),
                    var995: +(sorted[Math.floor(n * 0.005)] * 100).toFixed(2),
                  });
                }
                return points;
              })()}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="theta" tick={{ fontSize: 12, fill: T.textSec }} label={{ value: '\u03B8', position: 'bottom', offset: -2, fontSize: 13, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'VaR (%)', angle: -90, position: 'left', fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="var95" name="VaR 95%" fill={T.amber + '20'} stroke={T.amber} strokeWidth={2} />
              <Area type="monotone" dataKey="var99" name="VaR 99%" fill={T.red + '20'} stroke={T.red} strokeWidth={2} />
              <Area type="monotone" dataKey="var995" name="VaR 99.5%" fill={'#7f1d1d20'} stroke={'#7f1d1d'} strokeWidth={2} />
              <ReferenceLine x={theta} stroke={T.navy} strokeDasharray="5 5" label={{ value: 'Current \u03B8', fill: T.navy, fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 14: Tail Concentration Analysis ───────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Tail Concentration Analysis" sub="Top risk contributors in the portfolio tail" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 12 }}>Top 5 Tail Risk Contributors</div>
            {[...holdingsWithTail].sort((a, b) => b.tailContrib - a.tailContrib).slice(0, 5).map((h, i) => {
              const maxTC = Math.max(...holdingsWithTail.map(x => x.tailContrib));
              const barPct = maxTC > 0 ? (h.tailContrib / maxTC) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i % 2 === 0 ? T.surface : T.surfaceH, borderRadius: 8, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.red + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.red }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{(h.company.company_name || 'N/A').substring(0, 22)}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{h.sector} &middot; Vol: {fmtPct(h.vol)}</div>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: T.red, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.red, minWidth: 60, textAlign: 'right' }}>{(h.tailContrib * 100).toFixed(3)}%</div>
                </div>
              );
            })}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 12 }}>Risk Concentration Metrics</div>
            {(() => {
              const sorted = [...holdingsWithTail].sort((a, b) => b.tailContrib - a.tailContrib);
              const totalTR = sorted.reduce((s, h) => s + h.tailContrib, 0);
              const top3Share = sorted.slice(0, 3).reduce((s, h) => s + h.tailContrib, 0) / (totalTR || 1);
              const top5Share = sorted.slice(0, 5).reduce((s, h) => s + h.tailContrib, 0) / (totalTR || 1);
              const hhi = sorted.reduce((s, h) => s + Math.pow(h.tailContrib / (totalTR || 1), 2), 0);
              const effectiveN = hhi > 0 ? 1 / hhi : sorted.length;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Top 3 Share</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: top3Share > 0.5 ? T.red : T.amber }}>{(top3Share * 100).toFixed(1)}%</div>
                  </div>
                  <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Top 5 Share</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: top5Share > 0.7 ? T.red : T.amber }}>{(top5Share * 100).toFixed(1)}%</div>
                  </div>
                  <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>HHI (Tail Risk)</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{(hhi * 10000).toFixed(0)}</div>
                  </div>
                  <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Effective N</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: effectiveN > 10 ? T.green : T.amber }}>{effectiveN.toFixed(1)}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Section 15: Copula Parameter Diagnostics ──────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Copula Parameter Diagnostics" sub="Tail dependence characteristics across \u03B8 parameter range" />
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(() => {
                const points = [];
                for (let t = 1; t <= 10; t += 1) {
                  const ctd = computeTailDependence('clayton', t);
                  const gtd = computeTailDependence('gumbel', Math.max(1, t));
                  points.push({
                    theta: `\u03B8=${t}`,
                    claytonLambdaL: +ctd.lambdaL.toFixed(4),
                    gumbelLambdaU: +gtd.lambdaU.toFixed(4),
                    jointCrash: +(computeCopulaJoint(normalCDF(-2), normalCDF(-2), 'clayton', t) * 100).toFixed(4),
                  });
                }
                return points;
              })()}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="theta" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="claytonLambdaL" name="Clayton \u03BB_L" fill={T.red} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gumbelLambdaU" name="Gumbel \u03BB_U" fill={T.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="jointCrash" name="Joint Crash %" fill={T.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 16: Diversification Impact ────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Diversification Impact by Copula" sub="How much diversification benefit is lost under each copula vs independence" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {COPULA_TYPES.map(ct => {
            const losses = simulatePortfolioLoss(sectorData.weights, sectorData.vols, ct.id, theta, 2000);
            const sorted = losses.sort((a, b) => b - a);
            const n = sorted.length;
            const copulaVaR = sorted[Math.floor(n * 0.01)] || 0;
            const indepLosses = simulatePortfolioLoss(sectorData.weights, sectorData.vols, 'frank', 0.01, 2000);
            const indepSorted = indepLosses.sort((a, b) => b - a);
            const indepVaR = indepSorted[Math.floor(n * 0.01)] || 0;
            const benefit = indepVaR > 0 ? ((indepVaR - copulaVaR) / indepVaR) * 100 : 0;
            const td = computeTailDependence(ct.id, theta);
            return (
              <div key={ct.id} style={{ padding: 20, background: ct.color + '08', borderRadius: 12, border: `1px solid ${ct.color}30`, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ct.color, marginBottom: 8 }}>{ct.name}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>99% VaR</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{(copulaVaR * 100).toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Div. Benefit</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: benefit > 0 ? T.green : T.red }}>{benefit > 0 ? '' : '+'}{benefit.toFixed(1)}%</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>\u03BB_L: {td.lambdaL.toFixed(3)} | \u03BB_U: {td.lambdaU.toFixed(3)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 17: Scenario Impact Comparison ─────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Scenario Impact: Clayton vs Gaussian" sub="Difference in estimated portfolio loss between copula models for each stress scenario" />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stressResults.map(s => ({
                scenario: s.name.substring(0, 18),
                clayton: +((s.copulaResults.clayton || 0) * 100).toFixed(2),
                gaussian: +((s.copulaResults.gaussian || 0) * 100).toFixed(2),
                delta: +(((s.copulaResults.clayton || 0) - (s.copulaResults.gaussian || 0)) * 100).toFixed(2),
              }))}
              margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'Loss (%)', angle: -90, position: 'left', fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="clayton" name="Clayton Loss (%)" fill={T.red} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gaussian" name="Gaussian Loss (%)" fill={T.navyL} radius={[4, 4, 0, 0]} />
              <Bar dataKey="delta" name="Delta (%)" fill={T.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 18: Sector Volatility Profile ─────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Implied Sector Volatility Profile" sub="Carbon-intensity-derived volatility estimates per sector" />
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.entries(sectorData.vols).filter(([s]) => (sectorData.weights[s] || 0) > 0.01).map(([sector, vol]) => ({
                sector,
                vol: +(vol * 100).toFixed(2),
                weight: +((sectorData.weights[sector] || 0) * 100).toFixed(1),
              })).sort((a, b) => b.vol - a.vol)}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 12, fill: T.textSec }} width={110} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="vol" name="Implied Vol (%)" fill={T.red} radius={[0, 6, 6, 0]} opacity={0.7} />
              <Bar dataKey="weight" name="Portfolio Weight (%)" fill={T.navyL} radius={[0, 4, 4, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 19: Methodology ──────────────────────────────────────────── */}
      <div style={{ ...cardStyle, background: T.surfaceH }}>
        <SectionHeader title="Methodology & Limitations" />
        <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.8, columns: 2, columnGap: 40 }}>
          <p style={{ margin: '0 0 8px' }}><strong>Copula Theory:</strong> Copulas separate the dependence structure from marginal distributions. This allows modeling non-linear tail dependence that standard correlation matrices miss.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Clayton Copula:</strong> Exhibits lower tail dependence (\u03BB_L = 2^(-1/\u03B8)). This is critical for climate risk: when one sector crashes from transition risk, correlated sectors tend to crash simultaneously.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Gaussian Copula:</strong> Assumes symmetric dependence with zero tail dependence. It underestimates joint crash risk, a key lesson from the 2008 financial crisis.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Gumbel Copula:</strong> Upper tail dependence captures joint recovery scenarios. Useful for green transition upside correlation.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Frank Copula:</strong> Symmetric with no tail dependence. Useful as a moderate baseline between Gaussian and Clayton.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Monte Carlo:</strong> 5,000 simulations with Mulberry32 seeded PRNG for reproducibility. Sector volatilities are derived from carbon intensity as a proxy for transition risk exposure.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Limitations:</strong> Bivariate copula approximation applied pairwise; full multivariate copula would require vine copulas. Marginal distributions assumed normal. Theta parameter is user-selected, not calibrated to historical data. Sector correlations are approximated from volatility similarity.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Key Insight:</strong> The choice of copula dramatically affects tail risk estimates. Clayton copula typically shows 2-5x higher joint crash probability than Gaussian, highlighting the importance of tail dependence modeling for climate-aware portfolios.</p>
        </div>
      </div>

      {/* ── Cross Navigation ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/implied-temp-regression')} style={btnStyle(false)}>Implied Temperature Regression &rarr;</button>
        <button onClick={() => navigate('/carbon-budget')} style={btnStyle(false)}>Carbon Budget Analysis &rarr;</button>
        <button onClick={() => navigate('/scenario-stress-test')} style={btnStyle(false)}>Scenario Stress Test &rarr;</button>
      </div>
    </div>
  );
}
