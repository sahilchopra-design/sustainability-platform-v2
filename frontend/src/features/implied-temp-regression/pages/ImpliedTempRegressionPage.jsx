import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

// ─── IPCC Carbon Budgets (from 2025, GtCO2) ─────────────────────────────────
const CARBON_BUDGETS = {
  '1.5': { remaining_gt: 400, peak_year: 2025, net_zero_year: 2050 },
  '1.8': { remaining_gt: 700, peak_year: 2027, net_zero_year: 2055 },
  '2.0': { remaining_gt: 1150, peak_year: 2030, net_zero_year: 2070 },
  '2.5': { remaining_gt: 2200, peak_year: 2035, net_zero_year: 2080 },
  '3.0': { remaining_gt: 3500, peak_year: 2040, net_zero_year: 2090 },
};

const GLOBAL_ANNUAL_MT = 40000; // Mt CO2/yr current global emissions

// ─── Per-company ITR computation ─────────────────────────────────────────────
function computeCompanyITR(company) {
  const c = company;
  const currentEmissions = (c.scope1_mt || 0) + (c.scope2_mt || 0); // Mt CO2e/yr
  const revenue = c.revenue_usd_mn || 1;
  const intensity = currentEmissions * 1e6 / revenue; // tCO2e per USD Mn

  const hasTarget = !!(c.sbti_committed && c.carbon_neutral_target_year);
  const nzYear = c.carbon_neutral_target_year || 2080;
  const yearsToNZ = Math.max(1, nzYear - 2025);

  // Annual reduction rate implied by target
  const impliedReduction = hasTarget
    ? (currentEmissions / yearsToNZ)
    : (currentEmissions * 0.01); // 1%/yr default

  // Cumulative emissions 2025-2100 under company trajectory
  let cumulativeEmissions = 0;
  for (let yr = 2025; yr <= 2100; yr++) {
    const yearEmissions = Math.max(0, currentEmissions - impliedReduction * (yr - 2025));
    cumulativeEmissions += yearEmissions;
  }

  // Company's share of global budget
  const companyShare = currentEmissions > 0 ? currentEmissions / GLOBAL_ANNUAL_MT : 1e-12;

  // Budget entries scaled to company share
  const budgetEntries = Object.entries(CARBON_BUDGETS).map(([temp, data]) => ({
    temp: parseFloat(temp),
    budget: data.remaining_gt * 1000 * companyShare, // in Mt
  }));

  let itr = 3.5; // default worst case
  for (let i = 0; i < budgetEntries.length - 1; i++) {
    if (cumulativeEmissions <= budgetEntries[i].budget) {
      itr = budgetEntries[i].temp;
      break;
    }
    if (cumulativeEmissions <= budgetEntries[i + 1].budget) {
      const frac = (cumulativeEmissions - budgetEntries[i].budget) /
        (budgetEntries[i + 1].budget - budgetEntries[i].budget);
      itr = budgetEntries[i].temp + frac * (budgetEntries[i + 1].temp - budgetEntries[i].temp);
      break;
    }
  }

  return {
    itr: Math.round(itr * 10) / 10,
    cumulativeEmissions,
    annualReduction: impliedReduction,
    intensity,
    yearsToNZ,
    hasTarget,
    overshoot: cumulativeEmissions - (CARBON_BUDGETS['1.5'].remaining_gt * 1000 * companyShare),
    currentEmissions,
    nzYear,
  };
}

// ─── Lookup-based ITR (for model comparison) ─────────────────────────────────
function lookupITR(company) {
  const waci = ((company.scope1_mt || 0) + (company.scope2_mt || 0)) * 1e6 / (company.revenue_usd_mn || 1);
  if (waci < 50) return 1.5;
  if (waci < 100) return 1.8;
  if (waci < 200) return 2.0;
  if (waci < 500) return 2.5;
  if (waci < 1000) return 3.0;
  return 3.5;
}

// ─── Linear regression ───────────────────────────────────────────────────────
function linearRegression(x, y) {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
  const sumX2 = x.reduce((s, v) => s + v * v, 0);
  const sumY2 = y.reduce((s, v) => s + v * v, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: sumY / n, r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const ssRes = x.reduce((s, v, i) => s + Math.pow(y[i] - (slope * v + intercept), 2), 0);
  const ssTot = y.reduce((s, v) => s + Math.pow(v - sumY / n, 2), 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

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

// ─── Demo data ───────────────────────────────────────────────────────────────
function demoHoldings() {
  const sample = GLOBAL_COMPANY_MASTER.filter(c => c.scope1_mt > 0 && c.revenue_usd_mn > 0).slice(0, 25);
  const w = 100 / sample.length;
  return sample.map(c => ({ isin: c.isin, name: c.company_name, company: c, weight: w, exposure_usd_mn: c.market_cap_usd_mn ? c.market_cap_usd_mn * 0.01 : 50 }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, d = 2) { if (n == null || isNaN(n)) return '\u2014'; return n.toFixed(d); }
function fmtK(n) { if (n == null || isNaN(n)) return '\u2014'; if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return n.toFixed(1); }
function itrColor(itr) { if (itr <= 1.5) return T.green; if (itr <= 2.0) return T.sage; if (itr <= 2.5) return T.amber; return T.red; }
function itrLabel(itr) { if (itr <= 1.5) return 'Paris-Aligned (1.5C)'; if (itr <= 2.0) return 'Below 2C'; if (itr <= 2.5) return 'Above 2C'; return 'Hot House (>2.5C)'; }

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

// ─── Reusable sub-components ─────────────────────────────────────────────────
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
          <span style={{ fontWeight: 600, color: T.navy }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ImpliedTempRegressionPage() {
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState('itr');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState(0);
  const [sensitivityNZYear, setSensitivityNZYear] = useState(2050);
  const [sensitivityReductionMult, setSensitivityReductionMult] = useState(1.0);
  const [activeExport, setActiveExport] = useState(null);

  // ─── Load portfolio ──────────────────────────────────────────────────────
  const { portfolioName, holdings } = useMemo(() => {
    const p = readPortfolio();
    if (p && p.holdings.length > 0) return { portfolioName: p.name, holdings: p.holdings };
    return { portfolioName: 'Demo Portfolio (25 holdings)', holdings: demoHoldings() };
  }, []);

  const totalWeight = useMemo(() => holdings.reduce((s, h) => s + h.weight, 0), [holdings]);

  // ─── Company-level ITR computation ───────────────────────────────────────
  const holdingResults = useMemo(() => {
    return holdings.map(h => {
      const result = computeCompanyITR(h.company);
      const lookupResult = lookupITR(h.company);
      return { ...h, ...result, lookupITR: lookupResult, delta: result.itr - lookupResult };
    });
  }, [holdings]);

  // ─── Portfolio-level aggregates ──────────────────────────────────────────
  const portfolioITR = useMemo(() => {
    if (!holdingResults.length || totalWeight === 0) return 0;
    return holdingResults.reduce((sum, h) => sum + (h.weight / totalWeight) * h.itr, 0);
  }, [holdingResults, totalWeight]);

  const stats = useMemo(() => {
    const on15 = holdingResults.filter(h => h.itr <= 1.5).length;
    const on20 = holdingResults.filter(h => h.itr > 1.5 && h.itr <= 2.0).length;
    const above30 = holdingResults.filter(h => h.itr > 3.0).length;
    const avgOvershoot = holdingResults.reduce((s, h) => s + h.overshoot, 0) / holdingResults.length;
    const wtdReduction = holdingResults.reduce((s, h) => {
      const rate = h.currentEmissions > 0 ? (h.annualReduction / h.currentEmissions) * 100 : 0;
      return s + (h.weight / totalWeight) * rate;
    }, 0);
    const sbtiCount = holdingResults.filter(h => h.company.sbti_committed).length;
    const dataConf = holdingResults.filter(h => (h.company.scope1_mt || 0) > 0 && h.company.revenue_usd_mn > 0).length / holdingResults.length * 100;
    return { on15, on20, above30, avgOvershoot, wtdReduction, sbtiCount, sbtiPct: sbtiCount / holdingResults.length * 100, dataConf };
  }, [holdingResults, totalWeight]);

  // ─── Distribution histogram data ─────────────────────────────────────────
  const histogramData = useMemo(() => {
    const bins = [
      { bin: '<1.5', min: 0, max: 1.5, count: 0, color: T.green },
      { bin: '1.5-1.8', min: 1.5, max: 1.8, count: 0, color: '#10b981' },
      { bin: '1.8-2.0', min: 1.8, max: 2.0, count: 0, color: T.sage },
      { bin: '2.0-2.5', min: 2.0, max: 2.5, count: 0, color: T.amber },
      { bin: '2.5-3.0', min: 2.5, max: 3.0, count: 0, color: '#ea580c' },
      { bin: '>3.0', min: 3.0, max: 99, count: 0, color: T.red },
    ];
    holdingResults.forEach(h => {
      for (const b of bins) { if (h.itr >= b.min && (h.itr < b.max || (b.max === 99 && h.itr >= b.min))) { b.count++; break; } }
    });
    return bins;
  }, [holdingResults]);

  // ─── Regression: ITR vs Intensity ────────────────────────────────────────
  const regressionData = useMemo(() => {
    const xVals = holdingResults.map(h => h.intensity);
    const yVals = holdingResults.map(h => h.itr);
    const reg = linearRegression(xVals, yVals);
    const points = holdingResults.map(h => ({
      name: h.company.company_name?.substring(0, 15) || 'N/A',
      intensity: Math.round(h.intensity),
      itr: h.itr,
      predicted: Math.round((reg.slope * h.intensity + reg.intercept) * 10) / 10,
      weight: h.weight,
      sector: h.company.sector || 'Unknown',
    }));
    return { points, reg };
  }, [holdingResults]);

  // ─── SBTi comparison ─────────────────────────────────────────────────────
  const sbtiComparison = useMemo(() => {
    const committed = holdingResults.filter(h => h.company.sbti_committed);
    const notCommitted = holdingResults.filter(h => !h.company.sbti_committed);
    const avgC = committed.length > 0 ? committed.reduce((s, h) => s + h.itr, 0) / committed.length : 0;
    const avgNC = notCommitted.length > 0 ? notCommitted.reduce((s, h) => s + h.itr, 0) / notCommitted.length : 0;
    return [
      { group: 'SBTi Committed', avgITR: +avgC.toFixed(2), count: committed.length, color: T.green },
      { group: 'Not Committed', avgITR: +avgNC.toFixed(2), count: notCommitted.length, color: T.red },
    ];
  }, [holdingResults]);

  // ─── Emissions trajectory for selected company ───────────────────────────
  const selectedHolding = holdingResults[selectedCompanyIdx] || holdingResults[0];
  const trajectoryData = useMemo(() => {
    if (!selectedHolding) return [];
    const c = selectedHolding.company;
    const curr = selectedHolding.currentEmissions;
    const reduction = selectedHolding.annualReduction;
    const companyShare = curr > 0 ? curr / GLOBAL_ANNUAL_MT : 1e-12;
    const budget15 = CARBON_BUDGETS['1.5'].remaining_gt * 1000 * companyShare;
    const budget15Annual = budget15 / 25; // spread over 25 years
    const data = [];
    for (let yr = 2025; yr <= 2100; yr += 5) {
      const t = yr - 2025;
      const companyE = Math.max(0, curr - reduction * t);
      const budgetE = t < 25 ? Math.max(0, curr * (1 - t / 25)) : 0;
      data.push({ year: yr, company: +companyE.toFixed(4), budget_15: +budgetE.toFixed(4) });
    }
    return data;
  }, [selectedHolding]);

  // ─── Sensitivity analysis ────────────────────────────────────────────────
  const sensitivityResult = useMemo(() => {
    if (!selectedHolding) return null;
    const c = selectedHolding.company;
    const curr = selectedHolding.currentEmissions;
    const yearsToNZ = Math.max(1, sensitivityNZYear - 2025);
    const reduction = (curr / yearsToNZ) * sensitivityReductionMult;
    let cumul = 0;
    for (let yr = 2025; yr <= 2100; yr++) {
      cumul += Math.max(0, curr - reduction * (yr - 2025));
    }
    const companyShare = curr > 0 ? curr / GLOBAL_ANNUAL_MT : 1e-12;
    const budgetEntries = Object.entries(CARBON_BUDGETS).map(([temp, data]) => ({
      temp: parseFloat(temp), budget: data.remaining_gt * 1000 * companyShare,
    }));
    let itr = 3.5;
    for (let i = 0; i < budgetEntries.length - 1; i++) {
      if (cumul <= budgetEntries[i].budget) { itr = budgetEntries[i].temp; break; }
      if (cumul <= budgetEntries[i + 1].budget) {
        const frac = (cumul - budgetEntries[i].budget) / (budgetEntries[i + 1].budget - budgetEntries[i].budget);
        itr = budgetEntries[i].temp + frac * (budgetEntries[i + 1].temp - budgetEntries[i].temp);
        break;
      }
    }
    return { itr: Math.round(itr * 10) / 10, cumul, reduction };
  }, [selectedHolding, sensitivityNZYear, sensitivityReductionMult]);

  // ─── Sector averages ─────────────────────────────────────────────────────
  const sectorAvgData = useMemo(() => {
    const map = {};
    holdingResults.forEach(h => {
      const sec = h.company.sector || 'Unknown';
      if (!map[sec]) map[sec] = { sum: 0, count: 0 };
      map[sec].sum += h.itr;
      map[sec].count++;
    });
    return Object.entries(map).map(([sector, v]) => ({
      sector, avgITR: +(v.sum / v.count).toFixed(2), count: v.count,
    })).sort((a, b) => b.avgITR - a.avgITR);
  }, [holdingResults]);

  // ─── Sorted table data ───────────────────────────────────────────────────
  const sortedHoldings = useMemo(() => {
    const arr = [...holdingResults];
    arr.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'name': va = a.company.company_name || ''; vb = b.company.company_name || ''; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'itr': va = a.itr; vb = b.itr; break;
        case 'intensity': va = a.intensity; vb = b.intensity; break;
        case 'cumulative': va = a.cumulativeEmissions; vb = b.cumulativeEmissions; break;
        case 'reduction': va = a.annualReduction; vb = b.annualReduction; break;
        case 'nzYear': va = a.nzYear; vb = b.nzYear; break;
        case 'overshoot': va = a.overshoot; vb = b.overshoot; break;
        case 'weight': va = a.weight; vb = b.weight; break;
        case 'delta': va = a.delta; vb = b.delta; break;
        default: va = a.itr; vb = b.itr;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [holdingResults, sortCol, sortDir]);

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }
  function sortIcon(col) { return sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''; }

  // ─── Regression diagnostics ──────────────────────────────────────────────
  const diagnostics = useMemo(() => {
    const { reg, points } = regressionData;
    const residuals = points.map(p => ({ name: p.name, residual: +(p.itr - (reg.slope * p.intensity + reg.intercept)).toFixed(3) }));
    const n = points.length;
    const k = 1; // single predictor
    const adjR2 = n > 2 ? 1 - (1 - reg.r2) * (n - 1) / (n - k - 1) : reg.r2;
    // F-statistic proxy
    const fStat = reg.r2 > 0 && n > 2 ? (reg.r2 / k) / ((1 - reg.r2) / (n - k - 1)) : 0;
    return { residuals, adjR2, fStat, equation: `ITR = ${reg.slope.toFixed(6)} x Intensity + ${reg.intercept.toFixed(3)}` };
  }, [regressionData]);

  // ─── Model comparison data ───────────────────────────────────────────────
  const modelComparisonData = useMemo(() => {
    return holdingResults.map(h => ({
      name: (h.company.company_name || 'N/A').substring(0, 12),
      regressionITR: h.itr,
      lookupITR: h.lookupITR,
      delta: h.delta,
    }));
  }, [holdingResults]);

  // ─── Export handlers ─────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = sortedHoldings.map(h => ({
      company: h.company.company_name, isin: h.company.isin, sector: h.company.sector || '',
      itr: h.itr, lookupITR: h.lookupITR, delta: h.delta, intensity_tCO2e_per_USDMn: Math.round(h.intensity),
      cumulative_mt: +h.cumulativeEmissions.toFixed(4), annual_reduction_mt: +h.annualReduction.toFixed(6),
      nz_year: h.nzYear, overshoot_mt: +h.overshoot.toFixed(4), sbti: h.hasTarget ? 'Yes' : 'No', weight_pct: +h.weight.toFixed(2),
    }));
    downloadCSV('implied_temp_regression.csv', rows);
  }
  function handleExportJSON() {
    downloadJSON('implied_temp_regression.json', {
      portfolio: portfolioName, portfolioITR: +portfolioITR.toFixed(2),
      regression: { equation: diagnostics.equation, r2: regressionData.reg.r2, adjR2: diagnostics.adjR2 },
      holdings: sortedHoldings.map(h => ({ company: h.company.company_name, itr: h.itr, intensity: Math.round(h.intensity), cumulative: h.cumulativeEmissions })),
    });
  }
  function handleExportPDF() { window.print(); }

  // ─── Gauge arc helper ─────────────────────────────────────────────────────
  function renderGauge(value, min, max, label, color) {
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = -90 + pct * 180;
    const rad = (angle * Math.PI) / 180;
    const r = 70;
    const cx = 90, cy = 85;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    // Arc path for background
    const arcBg = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    // Arc path for value
    const largeArc = pct > 0.5 ? 1 : 0;
    const xVal = cx + r * Math.cos((-90 + pct * 180) * Math.PI / 180);
    const yVal = cy + r * Math.sin((-90 + pct * 180) * Math.PI / 180);
    const arcVal = `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${xVal} ${yVal}`;
    return (
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path d={arcBg} fill="none" stroke={T.border} strokeWidth="14" strokeLinecap="round" />
        <path d={arcVal} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>{value.toFixed(1)}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill={T.textSec}>{label}</text>
      </svg>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
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
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.navy }}>Implied Temperature Regression Model</h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: T.navy + '10', color: T.navyL, fontSize: 11, fontWeight: 700 }}>IPCC Budget &middot; Regression &middot; Company-Level ITR</span>
          </div>
          <div style={{ fontSize: 14, color: T.textSec }}>Portfolio: <strong>{portfolioName}</strong> &middot; {holdingResults.length} holdings &middot; Regression-based ITR using IPCC carbon budget interpolation</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportCSV} style={btnStyle(false)}>Export CSV</button>
          <button onClick={handleExportJSON} style={btnStyle(false)}>Export JSON</button>
          <button onClick={handleExportPDF} style={btnStyle(false)}>Print/PDF</button>
        </div>
      </div>

      {/* ── Section 2: Portfolio ITR Gauge ────────────────────────────────────── */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ textAlign: 'center' }}>
          {renderGauge(portfolioITR, 1.0, 4.0, 'Portfolio ITR', itrColor(portfolioITR))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: itrColor(portfolioITR), marginBottom: 4 }}>{portfolioITR.toFixed(2)}&deg;C</div>
          <div style={{ fontSize: 14, color: T.textSec, marginBottom: 8 }}>{itrLabel(portfolioITR)}</div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: T.textSec }}>
            <span>Paris target: <strong style={{ color: T.green }}>1.5&deg;C</strong></span>
            <span>Delta: <strong style={{ color: portfolioITR > 1.5 ? T.red : T.green }}>{portfolioITR > 1.5 ? '+' : ''}{(portfolioITR - 1.5).toFixed(2)}&deg;C</strong></span>
            <span>SBTi coverage: <strong>{fmt(stats.sbtiPct, 0)}%</strong></span>
          </div>
          <div style={{ marginTop: 12, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden', maxWidth: 400 }}>
            <div style={{ height: '100%', width: `${Math.min(100, ((portfolioITR - 1.0) / 3.0) * 100)}%`, background: `linear-gradient(90deg, ${T.green}, ${T.amber}, ${T.red})`, borderRadius: 4 }} />
          </div>
        </div>
      </div>

      {/* ── Section 3: 8 KPI Cards ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard icon="\uD83C\uDF21\uFE0F" label="Portfolio ITR" value={`${portfolioITR.toFixed(2)}\u00B0C`} valueColor={itrColor(portfolioITR)} sub="Weighted avg" />
        <KpiCard icon="\u2705" label="On 1.5\u00B0C Track" value={stats.on15} valueColor={T.green} sub={`${((stats.on15 / holdingResults.length) * 100).toFixed(0)}% of holdings`} />
        <KpiCard icon="\uD83D\uDFE1" label="On 2\u00B0C Track" value={stats.on20} valueColor={T.sage} sub="1.5-2.0\u00B0C range" />
        <KpiCard icon="\uD83D\uDD34" label="Above 3\u00B0C" value={stats.above30} valueColor={T.red} sub="Hot house trajectory" />
        <KpiCard icon="\uD83D\uDCC8" label="Avg Overshoot" value={`${fmtK(stats.avgOvershoot)} Mt`} valueColor={stats.avgOvershoot > 0 ? T.red : T.green} sub="vs 1.5\u00B0C budget" />
        <KpiCard icon="\u2935\uFE0F" label="Wtd Reduction Rate" value={`${fmt(stats.wtdReduction, 1)}%/yr`} valueColor={stats.wtdReduction > 4 ? T.green : T.amber} sub="Portfolio weighted" />
        <KpiCard icon="\uD83C\uDFAF" label="SBTi Coverage" value={`${fmt(stats.sbtiPct, 0)}%`} valueColor={stats.sbtiPct > 50 ? T.green : T.amber} sub={`${stats.sbtiCount} / ${holdingResults.length}`} />
        <KpiCard icon="\uD83D\uDD0D" label="Data Confidence" value={`${fmt(stats.dataConf, 0)}%`} valueColor={stats.dataConf > 80 ? T.green : T.amber} sub="Emissions + revenue" />
      </div>

      {/* ── Section 4: Distribution Histogram ────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Company ITR Distribution" sub="Number of holdings in each temperature bin" />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bin" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Holdings" radius={[6, 6, 0, 0]}>
                {histogramData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 5: ITR vs Intensity Scatter ──────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="ITR vs GHG Intensity Regression" sub={`${diagnostics.equation}  |  R\u00B2 = ${regressionData.reg.r2.toFixed(4)}  |  Adj R\u00B2 = ${diagnostics.adjR2.toFixed(4)}`} />
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regressionData.points.sort((a, b) => a.intensity - b.intensity)} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="intensity" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Intensity (tCO\u2082e/USD Mn)', position: 'bottom', offset: -2, fontSize: 12, fill: T.textSec }} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'ITR (\u00B0C)', angle: -90, position: 'left', offset: 0, fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="itr" name="Company ITR" fill={T.navyL} radius={[4, 4, 0, 0]} opacity={0.7}>
                {regressionData.points.map((p, i) => <Cell key={i} fill={itrColor(p.itr)} />)}
              </Bar>
              <Bar dataKey="predicted" name="Regression Fit" fill={T.gold} radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 6: SBTi Comparison ───────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="ITR by SBTi Status" sub="Average ITR for SBTi-committed vs non-committed holdings" />
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ height: 240, flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sbtiComparison} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="group" tick={{ fontSize: 13, fill: T.textSec }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 12, fill: T.textSec }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avgITR" name="Avg ITR (\u00B0C)" radius={[8, 8, 0, 0]}>
                  {sbtiComparison.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
                <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="5 5" label={{ value: '1.5\u00B0C', fill: T.green, fontSize: 11 }} />
                <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="5 5" label={{ value: '2.0\u00B0C', fill: T.amber, fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ minWidth: 200 }}>
            {sbtiComparison.map((d, i) => (
              <div key={i} style={{ marginBottom: 16, padding: '12px 16px', background: d.color + '10', borderRadius: 10, border: `1px solid ${d.color}30` }}>
                <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{d.group}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: d.color }}>{d.avgITR}&deg;C</div>
                <div style={{ fontSize: 12, color: T.textMut }}>{d.count} holdings</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 7: Emissions Trajectory ──────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <SectionHeader title="Emissions Trajectory vs 1.5\u00B0C Budget" sub={`${selectedHolding?.company.company_name || 'N/A'} \u2014 projected emissions path`} />
          <select
            value={selectedCompanyIdx}
            onChange={e => setSelectedCompanyIdx(+e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text, background: T.surface }}
          >
            {holdingResults.map((h, i) => (
              <option key={i} value={i}>{h.company.company_name?.substring(0, 30) || `Holding ${i + 1}`}</option>
            ))}
          </select>
        </div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'Mt CO\u2082e', angle: -90, position: 'left', fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="company" name="Company Trajectory" fill={T.red + '30'} stroke={T.red} strokeWidth={2} />
              <Area type="monotone" dataKey="budget_15" name="1.5\u00B0C Budget Path" fill={T.green + '20'} stroke={T.green} strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {selectedHolding && (
          <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 13, color: T.textSec }}>
            <span>Current emissions: <strong>{fmt(selectedHolding.currentEmissions, 4)} Mt</strong></span>
            <span>ITR: <strong style={{ color: itrColor(selectedHolding.itr) }}>{selectedHolding.itr}&deg;C</strong></span>
            <span>Net-zero year: <strong>{selectedHolding.nzYear}</strong></span>
            <span>Overshoot: <strong style={{ color: selectedHolding.overshoot > 0 ? T.red : T.green }}>{fmt(selectedHolding.overshoot, 4)} Mt</strong></span>
          </div>
        )}
      </div>

      {/* ── Section 8: Sensitivity Analysis ──────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="ITR Sensitivity Analysis" sub={`Adjust parameters for ${selectedHolding?.company.company_name || 'selected company'}`} />
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: T.textSec, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Net-Zero Target Year: <strong style={{ color: T.navy }}>{sensitivityNZYear}</strong>
              </label>
              <input type="range" min={2030} max={2090} step={5} value={sensitivityNZYear}
                onChange={e => setSensitivityNZYear(+e.target.value)}
                style={{ width: '100%', accentColor: T.navy }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}><span>2030</span><span>2050</span><span>2070</span><span>2090</span></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: T.textSec, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Reduction Rate Multiplier: <strong style={{ color: T.navy }}>{sensitivityReductionMult.toFixed(1)}x</strong>
              </label>
              <input type="range" min={0.5} max={3.0} step={0.1} value={sensitivityReductionMult}
                onChange={e => setSensitivityReductionMult(+e.target.value)}
                style={{ width: '100%', accentColor: T.navy }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}><span>0.5x (slower)</span><span>1x (base)</span><span>2x</span><span>3x (aggressive)</span></div>
            </div>
          </div>
          {sensitivityResult && (
            <div style={{ minWidth: 260, padding: 24, background: itrColor(sensitivityResult.itr) + '10', borderRadius: 12, border: `1px solid ${itrColor(sensitivityResult.itr)}30`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Adjusted ITR</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: itrColor(sensitivityResult.itr) }}>{sensitivityResult.itr}&deg;C</div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 8 }}>
                vs base: <strong style={{ color: selectedHolding?.itr !== sensitivityResult.itr ? T.amber : T.green }}>
                  {selectedHolding ? `${selectedHolding.itr}\u00B0C \u2192 ${sensitivityResult.itr}\u00B0C` : '\u2014'}
                </strong>
              </div>
              <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>Cumulative: {fmtK(sensitivityResult.cumul)} Mt</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 9: Sector Average ITR ────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Sector Average ITR" sub="Mean implied temperature rise by GICS sector" />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorAvgData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 12, fill: T.textSec }} width={110} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avgITR" name="Avg ITR (\u00B0C)" radius={[0, 6, 6, 0]}>
                {sectorAvgData.map((d, i) => <Cell key={i} fill={itrColor(d.avgITR)} />)}
              </Bar>
              <ReferenceLine x={1.5} stroke={T.green} strokeDasharray="5 5" />
              <ReferenceLine x={2.0} stroke={T.amber} strokeDasharray="5 5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 10: Holdings Table ───────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Holdings Detail" sub="Sortable table of all holdings with ITR, intensity, trajectory metrics" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={thStyle} onClick={() => toggleSort('name')}>Company{sortIcon('name')}</th>
                <th style={thStyle} onClick={() => toggleSort('itr')}>ITR{sortIcon('itr')}</th>
                <th style={thStyle} onClick={() => toggleSort('intensity')}>Intensity{sortIcon('intensity')}</th>
                <th style={thStyle} onClick={() => toggleSort('cumulative')}>Cumul. (Mt){sortIcon('cumulative')}</th>
                <th style={thStyle} onClick={() => toggleSort('reduction')}>Reduction{sortIcon('reduction')}</th>
                <th style={thStyle} onClick={() => toggleSort('nzYear')}>NZ Year{sortIcon('nzYear')}</th>
                <th style={thStyle} onClick={() => toggleSort('overshoot')}>Overshoot{sortIcon('overshoot')}</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>SBTi</th>
                <th style={thStyle} onClick={() => toggleSort('weight')}>Weight{sortIcon('weight')}</th>
                <th style={thStyle} onClick={() => toggleSort('delta')}>Delta{sortIcon('delta')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company.company_name || 'N/A'}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: itrColor(h.itr), display: 'inline-block' }} />
                      <strong style={{ color: itrColor(h.itr) }}>{h.itr}&deg;C</strong>
                    </span>
                  </td>
                  <td style={tdStyle}>{fmtK(h.intensity)}</td>
                  <td style={tdStyle}>{fmt(h.cumulativeEmissions, 4)}</td>
                  <td style={tdStyle}>{h.annualReduction.toExponential(2)}</td>
                  <td style={tdStyle}>{h.nzYear}</td>
                  <td style={{ ...tdStyle, color: h.overshoot > 0 ? T.red : T.green }}>{fmt(h.overshoot, 4)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: h.hasTarget ? T.green + '15' : T.red + '10', color: h.hasTarget ? T.green : T.red }}>
                      {h.hasTarget ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={tdStyle}>{fmt(h.weight, 1)}%</td>
                  <td style={{ ...tdStyle, color: Math.abs(h.delta) > 0.3 ? T.amber : T.textSec, fontWeight: Math.abs(h.delta) > 0.3 ? 700 : 400 }}>
                    {h.delta > 0 ? '+' : ''}{fmt(h.delta, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 11: Regression Diagnostics ───────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Regression Diagnostics" sub="Statistical quality of the ITR ~ Intensity linear model" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}><strong>Equation:</strong> {diagnostics.equation}</div>
              <div style={{ marginBottom: 6 }}><strong>R&sup2;:</strong> {regressionData.reg.r2.toFixed(4)} &middot; <strong>Adj R&sup2;:</strong> {diagnostics.adjR2.toFixed(4)}</div>
              <div style={{ marginBottom: 6 }}><strong>F-Statistic:</strong> {diagnostics.fStat.toFixed(2)}</div>
              <div style={{ marginBottom: 6 }}><strong>Slope:</strong> {regressionData.reg.slope.toExponential(4)} &middot; <strong>Intercept:</strong> {regressionData.reg.intercept.toFixed(4)}</div>
              <div><strong>N:</strong> {holdingResults.length} observations</div>
            </div>
            <div style={{ padding: 16, background: regressionData.reg.r2 > 0.5 ? T.green + '10' : T.amber + '10', borderRadius: 10, border: `1px solid ${regressionData.reg.r2 > 0.5 ? T.green : T.amber}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: regressionData.reg.r2 > 0.5 ? T.green : T.amber }}>
                {regressionData.reg.r2 > 0.7 ? 'Strong fit' : regressionData.reg.r2 > 0.4 ? 'Moderate fit' : 'Weak fit'} &mdash; R&sup2; explains {(regressionData.reg.r2 * 100).toFixed(1)}% of variance
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMut, marginBottom: 8, textTransform: 'uppercase' }}>Residual Distribution</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diagnostics.residuals.slice(0, 25)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke={T.navy} />
                  <Bar dataKey="residual" name="Residual">
                    {diagnostics.residuals.slice(0, 25).map((d, i) => <Cell key={i} fill={d.residual > 0 ? T.red + '80' : T.green + '80'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 12: Model Comparison ──────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Model Comparison: Regression vs Lookup" sub="Delta between IPCC budget regression ITR and simple WACI-based lookup ITR" />
        <div style={{ height: 300, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelComparisonData.slice(0, 25)} margin={{ top: 10, right: 30, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" height={60} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="regressionITR" name="Regression ITR" fill={T.navyL} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lookupITR" name="Lookup ITR" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {(() => {
            const avgDelta = modelComparisonData.reduce((s, d) => s + Math.abs(d.delta), 0) / modelComparisonData.length;
            const maxDelta = Math.max(...modelComparisonData.map(d => Math.abs(d.delta)));
            const agreement = modelComparisonData.filter(d => Math.abs(d.delta) < 0.3).length;
            return (
              <>
                <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Avg Absolute Delta</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.navy }}>{avgDelta.toFixed(2)}&deg;C</div>
                </div>
                <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Max Delta</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.red }}>{maxDelta.toFixed(2)}&deg;C</div>
                </div>
                <div style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase' }}>Agreement (&lt;0.3&deg;C)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.green }}>{agreement} / {modelComparisonData.length}</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Section 13: Carbon Budget Waterfall ─────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Carbon Budget Consumption Waterfall" sub="How each sector contributes to total budget consumption vs 1.5\u00B0C pathway" />
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(() => {
                const sectorMap = {};
                holdingResults.forEach(h => {
                  const sec = h.company.sector || 'Unknown';
                  if (!sectorMap[sec]) sectorMap[sec] = { cumEmissions: 0, budget: 0, count: 0 };
                  sectorMap[sec].cumEmissions += h.cumulativeEmissions;
                  sectorMap[sec].budget += CARBON_BUDGETS['1.5'].remaining_gt * 1000 * (h.currentEmissions > 0 ? h.currentEmissions / GLOBAL_ANNUAL_MT : 0);
                  sectorMap[sec].count++;
                });
                return Object.entries(sectorMap).map(([sec, d]) => ({
                  sector: sec,
                  cumulative: +d.cumEmissions.toFixed(4),
                  budget: +d.budget.toFixed(4),
                  overshoot: +Math.max(0, d.cumEmissions - d.budget).toFixed(4),
                })).sort((a, b) => b.overshoot - a.overshoot);
              })()}
              margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} label={{ value: 'Mt CO\u2082e', angle: -90, position: 'left', fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="cumulative" name="Cumulative Emissions" fill={T.red} radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="budget" name="1.5\u00B0C Budget" fill={T.green} radius={[4, 4, 0, 0]} opacity={0.5} />
              <Bar dataKey="overshoot" name="Overshoot" fill={T.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 14: Multi-predictor Regression Summary ────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Multi-Factor Regression Summary" sub="ITR predictors: Intensity, SBTi status, NZ year, ESG score" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 12 }}>Predictor Correlations with ITR</div>
            {(() => {
              const predictors = [
                { name: 'GHG Intensity', vals: holdingResults.map(h => h.intensity) },
                { name: 'NZ Year', vals: holdingResults.map(h => h.nzYear) },
                { name: 'ESG Score', vals: holdingResults.map(h => h.company.esg_score || 50) },
                { name: 'Revenue (log)', vals: holdingResults.map(h => Math.log10(Math.max(1, h.company.revenue_usd_mn || 1))) },
                { name: 'SBTi (binary)', vals: holdingResults.map(h => h.hasTarget ? 1 : 0) },
              ];
              const itrs = holdingResults.map(h => h.itr);
              return predictors.map((pred, idx) => {
                const reg = linearRegression(pred.vals, itrs);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: idx % 2 === 0 ? T.surface : T.surfaceH, borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.navy }}>{pred.name}</div>
                    <div style={{ width: 100 }}>
                      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, reg.r2 * 100)}%`, background: reg.r2 > 0.3 ? T.green : reg.r2 > 0.1 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: reg.r2 > 0.3 ? T.green : T.textSec, minWidth: 60, textAlign: 'right' }}>R\u00B2 {reg.r2.toFixed(3)}</div>
                    <div style={{ fontSize: 11, color: T.textMut, minWidth: 80 }}>\u03B2 = {reg.slope.toFixed(4)}</div>
                  </div>
                );
              });
            })()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 12 }}>ITR by ESG Score Quartile</div>
            {(() => {
              const sorted = [...holdingResults].sort((a, b) => (a.company.esg_score || 50) - (b.company.esg_score || 50));
              const q = Math.floor(sorted.length / 4);
              const quartiles = [
                { label: 'Q1 (Low ESG)', data: sorted.slice(0, q) },
                { label: 'Q2', data: sorted.slice(q, q * 2) },
                { label: 'Q3', data: sorted.slice(q * 2, q * 3) },
                { label: 'Q4 (High ESG)', data: sorted.slice(q * 3) },
              ];
              return (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quartiles.map(qr => ({
                      quartile: qr.label,
                      avgITR: qr.data.length > 0 ? +(qr.data.reduce((s, h) => s + h.itr, 0) / qr.data.length).toFixed(2) : 0,
                      count: qr.data.length,
                    }))} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="quartile" tick={{ fontSize: 11, fill: T.textSec }} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: T.textSec }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="avgITR" name="Avg ITR" radius={[6, 6, 0, 0]}>
                        {quartiles.map((_, i) => <Cell key={i} fill={[T.red, T.amber, T.sage, T.green][i]} />)}
                      </Bar>
                      <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="5 5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Section 15: Top/Bottom Holdings ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <SectionHeader title="Best Performing (Lowest ITR)" sub="Top 5 holdings most aligned with Paris goals" />
          {[...holdingResults].sort((a, b) => a.itr - b.itr).slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i % 2 === 0 ? T.surface : T.surfaceH, borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.green + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.green }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{(h.company.company_name || 'N/A').substring(0, 25)}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{h.company.sector || 'Unknown'} &middot; Wt: {fmt(h.weight, 1)}%</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{h.itr}&deg;C</div>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <SectionHeader title="Worst Performing (Highest ITR)" sub="Top 5 holdings furthest from Paris alignment" />
          {[...holdingResults].sort((a, b) => b.itr - a.itr).slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i % 2 === 0 ? T.surface : T.surfaceH, borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.red + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.red }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{(h.company.company_name || 'N/A').substring(0, 25)}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{h.company.sector || 'Unknown'} &middot; Wt: {fmt(h.weight, 1)}%</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>{h.itr}&deg;C</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 16: Portfolio Composition by ITR Band ─────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Portfolio Weight by ITR Band" sub="Percentage of portfolio AUM in each temperature alignment band" />
        <div style={{ display: 'flex', gap: 4, height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          {(() => {
            const bands = [
              { label: '\u22641.5\u00B0C', min: 0, max: 1.5, color: T.green },
              { label: '1.5-2.0\u00B0C', min: 1.5, max: 2.0, color: T.sage },
              { label: '2.0-2.5\u00B0C', min: 2.0, max: 2.5, color: T.amber },
              { label: '2.5-3.0\u00B0C', min: 2.5, max: 3.0, color: '#ea580c' },
              { label: '>3.0\u00B0C', min: 3.0, max: 99, color: T.red },
            ];
            const tw = totalWeight || 1;
            return bands.map((b, i) => {
              const wt = holdingResults.filter(h => h.itr >= b.min && (h.itr < b.max || (b.max === 99 && h.itr >= b.min))).reduce((s, h) => s + h.weight, 0);
              const pct = (wt / tw) * 100;
              if (pct < 0.5) return null;
              return (
                <div key={i} style={{ flex: pct, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, minWidth: pct > 5 ? 0 : 0 }}>
                  {pct > 8 ? `${b.label} ${pct.toFixed(0)}%` : pct > 4 ? `${pct.toFixed(0)}%` : ''}
                </div>
              );
            });
          })()}
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, color: T.textSec }}>
          {[
            { label: '\u22641.5\u00B0C', color: T.green },
            { label: '1.5-2.0\u00B0C', color: T.sage },
            { label: '2.0-2.5\u00B0C', color: T.amber },
            { label: '2.5-3.0\u00B0C', color: '#ea580c' },
            { label: '>3.0\u00B0C', color: T.red },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: b.color }} />
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 17: Data Quality Matrix ───────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Data Quality Matrix" sub="Availability of key inputs for ITR computation per holding" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Scope 1 Data', count: holdingResults.filter(h => (h.company.scope1_mt || 0) > 0).length },
            { label: 'Scope 2 Data', count: holdingResults.filter(h => (h.company.scope2_mt || 0) > 0).length },
            { label: 'Revenue Data', count: holdingResults.filter(h => (h.company.revenue_usd_mn || 0) > 0).length },
            { label: 'SBTi Status', count: holdingResults.filter(h => h.company.sbti_committed !== undefined).length },
            { label: 'NZ Target Year', count: holdingResults.filter(h => h.company.carbon_neutral_target_year && h.company.carbon_neutral_target_year > 2024).length },
            { label: 'ESG Score', count: holdingResults.filter(h => (h.company.esg_score || 0) > 0).length },
          ].map((d, i) => {
            const pct = holdingResults.length > 0 ? (d.count / holdingResults.length) * 100 : 0;
            return (
              <div key={i} style={{ padding: '14px 16px', background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, marginBottom: 6 }}>{d.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: pct > 80 ? T.green : pct > 50 ? T.amber : T.red }}>{pct.toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{d.count}/{holdingResults.length}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 18: Budget Alignment Summary ─────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Paris Alignment Summary" sub="Portfolio alignment status across key climate benchmarks" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {Object.entries(CARBON_BUDGETS).map(([temp, data]) => {
            const aligned = holdingResults.filter(h => h.itr <= parseFloat(temp)).length;
            const pct = (aligned / holdingResults.length) * 100;
            const colors = { '1.5': T.green, '1.8': '#10b981', '2.0': T.sage, '2.5': T.amber, '3.0': T.red };
            return (
              <div key={temp} style={{ padding: 20, background: T.surfaceH, borderRadius: 12, textAlign: 'center', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: colors[temp] || T.navy }}>{temp}&deg;C</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 4, marginBottom: 8 }}>Budget: {data.remaining_gt} Gt &middot; NZ {data.net_zero_year}</div>
                <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: colors[temp] || T.navy, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{aligned} / {holdingResults.length}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{pct.toFixed(0)}% aligned</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 19: Reduction Rate Distribution ───────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader title="Annual Reduction Rate Distribution" sub="Implied emissions reduction rate across holdings (% of current emissions per year)" />
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(() => {
                const rates = holdingResults.map(h => h.currentEmissions > 0 ? (h.annualReduction / h.currentEmissions) * 100 : 0);
                const bins = [
                  { bin: '<1%', min: 0, max: 1, count: 0, color: T.red },
                  { bin: '1-2%', min: 1, max: 2, count: 0, color: '#ea580c' },
                  { bin: '2-3%', min: 2, max: 3, count: 0, color: T.amber },
                  { bin: '3-4%', min: 3, max: 4, count: 0, color: T.gold },
                  { bin: '4-5%', min: 4, max: 5, count: 0, color: T.sage },
                  { bin: '>5%', min: 5, max: 100, count: 0, color: T.green },
                ];
                rates.forEach(r => { for (const b of bins) { if (r >= b.min && r < b.max) { b.count++; break; } } });
                return bins;
              })()}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bin" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Holdings" radius={[6, 6, 0, 0]}>
                {[T.red, '#ea580c', T.amber, T.gold, T.sage, T.green].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
              <ReferenceLine x="4-5%" stroke={T.green} strokeDasharray="5 5" label={{ value: 'SBTi 1.5C rate', fill: T.green, fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Cross Navigation ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/carbon-budget')} style={btnStyle(false)}>Carbon Budget Analysis &rarr;</button>
        <button onClick={() => navigate('/scenario-stress-test')} style={btnStyle(false)}>Scenario Stress Test &rarr;</button>
        <button onClick={() => navigate('/copula-tail-risk')} style={btnStyle(false)}>Copula Tail Risk &rarr;</button>
      </div>

      {/* ── Methodology Panel ────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, background: T.surfaceH }}>
        <SectionHeader title="Methodology & Limitations" />
        <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.8, columns: 2, columnGap: 40 }}>
          <p style={{ margin: '0 0 8px' }}><strong>IPCC Carbon Budget Approach:</strong> This model computes each company's implied temperature rise by projecting cumulative emissions 2025&ndash;2100 under their stated (or default) reduction trajectory, then mapping that cumulative total to the IPCC carbon budget thresholds via linear interpolation.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Company Share:</strong> Each company's &ldquo;share&rdquo; of the global carbon budget is proportional to their current emissions as a fraction of global annual emissions (~40 Gt CO&#8322;/yr).</p>
          <p style={{ margin: '0 0 8px' }}><strong>Reduction Trajectories:</strong> Companies with SBTi commitments and net-zero targets use a linear reduction path. Companies without targets default to 1% annual reduction.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Regression Analysis:</strong> A simple OLS linear regression of ITR on carbon intensity is shown for diagnostic purposes. This is descriptive, not causal.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Limitations:</strong> Scope 3 not included in base calculation. Linear reduction assumption oversimplifies real trajectories. Budget interpolation uses 5 anchor points. Company data quality varies.</p>
          <p style={{ margin: '0 0 8px' }}><strong>Data Sources:</strong> IPCC AR6 WG3 carbon budgets. Company emissions from reported/estimated Scope 1+2. SBTi commitment status from public registry.</p>
        </div>
      </div>
    </div>
  );
}
