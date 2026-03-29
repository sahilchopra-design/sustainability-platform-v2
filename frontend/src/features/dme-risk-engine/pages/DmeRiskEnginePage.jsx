import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =========================================================================
   THEME
   ========================================================================= */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af'];
const REGIME_COLORS = { Normal:'#16a34a', Elevated:'#d97706', Critical:'#dc2626', Extreme:'#7c2d12' };

/* =========================================================================
   HELPERS
   ========================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const fmt = (n, d=1) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : '---';
const fmtPct = (n) => typeof n === 'number' ? `${n.toFixed(2)}%` : '---';
const fmtBps = (n) => typeof n === 'number' ? `${n.toFixed(0)} bps` : '---';
const fmtUsd = (n) => typeof n === 'number' ? `$${n.toFixed(1)}M` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* =========================================================================
   DME VELOCITY ENGINE (ported from dme-platform/src/lib/calculations.ts)
   ========================================================================= */
function calculateVelocity(current, previous, deltaT) {
  return deltaT > 0 ? (current - previous) / deltaT : 0;
}
function calculateAcceleration(currentVel, prevVel, deltaT) {
  return deltaT > 0 ? (currentVel - prevVel) / deltaT : 0;
}
function emaSmooth(rawValue, prevEma, alpha) {
  return alpha * rawValue + (1 - alpha) * prevEma;
}
function calculateZScore(value, mean, stdDev) {
  return stdDev > 0 ? (value - mean) / stdDev : 0;
}
function classifyRegime(zScore) {
  if (zScore <= 1.0) return 'Normal';
  if (zScore <= 2.0) return 'Elevated';
  if (zScore <= 3.0) return 'Critical';
  return 'Extreme';
}

/* Normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(x) {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-z*z);
  return 0.5 * (1.0 + sign * y);
}

/* =========================================================================
   FOUR-BRANCH PD STRATEGY (exact port)
   ========================================================================= */

/* Branch A: Exponential (real-time monitoring) */
function pdExponential(pdBase, alpha, velocityTransition) {
  return pdBase * Math.exp(alpha * velocityTransition);
}

/* Branch B: Merton Distance-to-Default (IFRS 9) */
function pdMertonDD(assetValue, totalDebt, riskFreeRate, volatility, timeHorizon, strandedHaircut) {
  const adjustedAsset = assetValue * (1 - strandedHaircut);
  if (adjustedAsset <= 0 || totalDebt <= 0 || volatility <= 0 || timeHorizon <= 0) {
    return { dd: 0, pd: 0.5 };
  }
  const d1 = (Math.log(adjustedAsset / totalDebt) + (riskFreeRate + 0.5 * volatility * volatility) * timeHorizon) / (volatility * Math.sqrt(timeHorizon));
  const d2 = d1 - volatility * Math.sqrt(timeHorizon);
  const dd = d2;
  const pd = normalCDF(-dd);
  return { dd, pd };
}

/* Branch C: Tabular (ESG band-based) */
function pdTabular(pdBase, esgBand) {
  const multipliers = { low: 1.05, medium: 1.30, high: 2.00, severe: 3.25 };
  return pdBase * (multipliers[esgBand] || 1.0);
}

/* Branch D: Multi-factor (portfolio aggregation) */
function pdMultifactor(pdBase, alphaT, velT, betaP, velP, gammaS, velS) {
  return pdBase * Math.exp(alphaT * velT + betaP * velP + gammaS * velS);
}

/* =========================================================================
   VaR, WACC, LCR, DMI, EL CALCULATIONS (exact port)
   ========================================================================= */
function varRealtime(varBase, exposure, betaRep, accelRep) {
  return varBase + exposure * betaRep * accelRep;
}

function waccAdjusted(wE, cE, esgEqPrem, wD, cD, esgDebtSpread, taxRate) {
  const wacc = wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);
  const baseline = wE * cE + wD * cD * (1 - taxRate);
  return { wacc, bpsChange: (wacc - baseline) * 10000 };
}

function calculateDMI(impactScore, riskScore, opportunityScore, weights = { impact: 0.40, risk: 0.40, opportunity: 0.20 }) {
  return impactScore * weights.impact + riskScore * weights.risk + opportunityScore * weights.opportunity;
}

function calculateEL(pd, lgd, ead) {
  return pd * lgd * ead;
}

/* LCR = HQLA / (Net Cash Outflows * stress_mult) */
function lcrAdjusted(hqla, netOutflows, esgStressMult) {
  if (netOutflows <= 0) return 999;
  return (hqla / (netOutflows * esgStressMult)) * 100;
}

/* =========================================================================
   SECTOR RISK COEFFICIENTS
   ========================================================================= */
const SECTOR_COEFFICIENTS = {
  Energy:                 { alphaT: 0.18, betaP: 0.14, gammaS: 0.08, baseVol: 0.35, haircut: 0.25, lgd: 0.55 },
  Materials:              { alphaT: 0.14, betaP: 0.11, gammaS: 0.07, baseVol: 0.28, haircut: 0.18, lgd: 0.48 },
  Utilities:              { alphaT: 0.15, betaP: 0.10, gammaS: 0.06, baseVol: 0.22, haircut: 0.20, lgd: 0.45 },
  Industrials:            { alphaT: 0.10, betaP: 0.09, gammaS: 0.06, baseVol: 0.25, haircut: 0.12, lgd: 0.42 },
  'Consumer Discretionary':{ alphaT: 0.08, betaP: 0.07, gammaS: 0.05, baseVol: 0.28, haircut: 0.08, lgd: 0.40 },
  'Consumer Staples':     { alphaT: 0.05, betaP: 0.05, gammaS: 0.04, baseVol: 0.18, haircut: 0.05, lgd: 0.35 },
  'Health Care':          { alphaT: 0.06, betaP: 0.06, gammaS: 0.05, baseVol: 0.22, haircut: 0.06, lgd: 0.38 },
  Financials:             { alphaT: 0.09, betaP: 0.12, gammaS: 0.07, baseVol: 0.24, haircut: 0.10, lgd: 0.50 },
  'Information Technology':{ alphaT: 0.07, betaP: 0.06, gammaS: 0.04, baseVol: 0.32, haircut: 0.05, lgd: 0.35 },
  'Communication Services':{ alphaT: 0.06, betaP: 0.05, gammaS: 0.04, baseVol: 0.26, haircut: 0.06, lgd: 0.38 },
  'Real Estate':          { alphaT: 0.12, betaP: 0.10, gammaS: 0.06, baseVol: 0.20, haircut: 0.15, lgd: 0.52 },
};
const DEFAULT_COEFF = { alphaT: 0.08, betaP: 0.07, gammaS: 0.05, baseVol: 0.25, haircut: 0.10, lgd: 0.42 };

/* =========================================================================
   CROSS-PILLAR AMPLIFICATION MULTIPLIERS
   ========================================================================= */
const AMPLIFICATION = {
  'G_to_E': { label: 'Governance failures amplify Environmental risk', mult: 2.5 },
  'X_to_EL': { label: 'Cross-pillar cascade amplifies Expected Loss', mult: 4.3 },
  'E_to_S': { label: 'Environmental damage amplifies Social risk', mult: 1.8 },
  'S_to_G': { label: 'Social unrest amplifies Governance risk', mult: 1.5 },
  'Regulatory_lag': { label: 'Regulatory compliance lag compounds risk', mult: 2.1 },
};

/* =========================================================================
   RISK TRAFFIC LIGHT CHANNELS
   ========================================================================= */
const RISK_CHANNELS = [
  { id: 'credit', label: 'Credit Risk', icon: 'C' },
  { id: 'market', label: 'Market Risk', icon: 'M' },
  { id: 'valuation', label: 'Valuation Risk', icon: 'V' },
  { id: 'liquidity', label: 'Liquidity Risk', icon: 'L' },
  { id: 'operational', label: 'Operational Risk', icon: 'O' },
];

/* =========================================================================
   ASSESS SINGLE ENTITY
   ========================================================================= */
function assessEntity(company, weight = 1) {
  const s = seed(company.company_name || company.ticker || 'X');
  const coeff = SECTOR_COEFFICIENTS[company.sector] || DEFAULT_COEFF;

  /* Derive inputs from GLOBAL_COMPANY_MASTER */
  const mcap = company.market_cap_usd_mn || 5000;
  const debt = company.total_debt_usd_mn || mcap * 0.3;
  const assetValue = mcap + debt;
  const esgScore = company.esg_score || 50;
  const transRisk = company.transition_risk_score || 50;
  const scope1 = company.scope1_mt || 0;
  const scope2 = company.scope2_mt || 0;
  const totalEmissions = scope1 + scope2;
  const revenue = company.revenue_usd_mn || mcap * 0.4;
  const carbonIntensity = revenue > 0 ? (totalEmissions * 1e6) / revenue : 0;

  /* ESG band classification */
  const esgBand = esgScore >= 70 ? 'low' : esgScore >= 50 ? 'medium' : esgScore >= 30 ? 'high' : 'severe';

  /* Base PD from credit proxy (higher transition risk = higher PD) */
  const pdBase = clamp(0.005 + (transRisk / 100) * 0.04 + sRand(s + 1) * 0.01, 0.001, 0.15);

  /* Velocity simulation (deterministic from seed) */
  const velT = (sRand(s + 10) - 0.3) * 0.5;   // transition velocity
  const velP = (sRand(s + 20) - 0.3) * 0.3;   // physical velocity
  const velS = (sRand(s + 30) - 0.3) * 0.2;   // social velocity
  const accel = calculateAcceleration(velT, velT * 0.8, 1);

  /* Branch A: Exponential PD */
  const pdA = pdExponential(pdBase, coeff.alphaT, velT);

  /* Branch B: Merton DD */
  const riskFreeRate = 0.045;
  const timeHorizon = 1;
  const strandedHaircut = coeff.haircut * (transRisk / 100);
  const merton = pdMertonDD(assetValue, debt, riskFreeRate, coeff.baseVol, timeHorizon, strandedHaircut);

  /* Branch C: Tabular PD */
  const pdC = pdTabular(pdBase, esgBand);

  /* Branch D: Multi-factor */
  const pdD = pdMultifactor(pdBase, coeff.alphaT, velT, coeff.betaP, velP, coeff.gammaS, velS);

  /* Select primary PD (highest of branches = conservative) */
  const branches = [
    { branch: 'A', label: 'Exponential', pd: pdA },
    { branch: 'B', label: 'Merton DD', pd: merton.pd },
    { branch: 'C', label: 'Tabular ESG', pd: pdC },
    { branch: 'D', label: 'Multi-factor', pd: pdD },
  ];
  branches.sort((a, b) => b.pd - a.pd);
  const primaryPD = branches[0].pd;
  const primaryBranch = branches[0];

  /* VaR */
  const exposure = mcap * (weight / 100);
  const varBase = exposure * coeff.baseVol * 1.645 * Math.sqrt(1 / 252) * 0.01;
  const betaRep = coeff.betaP;
  const adjVaR = varRealtime(varBase, exposure, betaRep, Math.abs(accel));

  /* WACC */
  const wE = 0.65, wD = 0.35;
  const cE = 0.09 + sRand(s + 40) * 0.04;
  const cD = 0.04 + sRand(s + 50) * 0.02;
  const esgEqPrem = esgBand === 'severe' ? 0.035 : esgBand === 'high' ? 0.020 : esgBand === 'medium' ? 0.008 : 0.002;
  const esgDebtSpread = esgEqPrem * 0.6;
  const taxRate = 0.25;
  const waccResult = waccAdjusted(wE, cE, esgEqPrem, wD, cD, esgDebtSpread, taxRate);

  /* LCR */
  const hqla = mcap * 0.15;
  const netOutflows = mcap * 0.08;
  const esgStressMult = esgBand === 'severe' ? 1.35 : esgBand === 'high' ? 1.20 : esgBand === 'medium' ? 1.08 : 1.02;
  const lcr = lcrAdjusted(hqla, netOutflows, esgStressMult);

  /* DMI */
  const impactScore = clamp(totalEmissions * 10 + transRisk * 0.3 + sRand(s + 60) * 20, 0, 100);
  const riskScore = clamp(primaryPD * 1000 + transRisk * 0.4 + sRand(s + 70) * 15, 0, 100);
  const opportunityScore = clamp(esgScore * 0.6 + (100 - transRisk) * 0.3 + sRand(s + 80) * 10, 0, 100);
  const dmi = calculateDMI(impactScore, riskScore, opportunityScore);

  /* Z-Score & Regime */
  const mean = 45, stdDev = 18;
  const zScore = calculateZScore(dmi, mean, stdDev);
  const regime = classifyRegime(Math.abs(zScore));

  /* IFRS 9 Stage */
  const ifrs9Stage = primaryPD > 0.05 ? 3 : primaryPD > 0.015 ? 2 : 1;

  /* Expected Loss */
  const ead = exposure > 0 ? exposure : mcap * 0.01;
  const el = calculateEL(primaryPD, coeff.lgd, ead);

  /* Risk channel scores */
  const channelScores = {
    credit:      { baseline: pdBase * 10000, adjusted: primaryPD * 10000, delta: (primaryPD - pdBase) * 10000 },
    market:      { baseline: varBase, adjusted: adjVaR, delta: adjVaR - varBase },
    valuation:   { baseline: waccResult.wacc * 100 - waccResult.bpsChange / 100, adjusted: waccResult.wacc * 100, delta: waccResult.bpsChange / 100 },
    liquidity:   { baseline: (hqla / netOutflows) * 100, adjusted: lcr, delta: lcr - (hqla / netOutflows) * 100 },
    operational: { baseline: transRisk * 0.5, adjusted: transRisk * 0.5 * esgStressMult, delta: transRisk * 0.5 * (esgStressMult - 1) },
  };

  return {
    company, weight, mcap, debt, assetValue, esgScore, esgBand, transRisk,
    scope1, scope2, totalEmissions, revenue, carbonIntensity,
    pdBase, pdA, pdB: merton.pd, pdC, pdD, dd: merton.dd,
    branches, primaryPD, primaryBranch,
    varBase, adjVaR, exposure,
    waccResult, lcr,
    impactScore, riskScore, opportunityScore, dmi, zScore, regime,
    ifrs9Stage, el, ead, lgd: coeff.lgd,
    channelScores, coeff, velT, velP, velS, accel,
  };
}

/* =========================================================================
   UI PRIMITIVES
   ========================================================================= */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? accent : T.border}`, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${accent || T.gold}`, fontFamily: T.font }}>
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
  const map = { green:{ bg:'#dcfce7', text:'#166534' }, red:{ bg:'#fee2e2', text:'#991b1b' }, amber:{ bg:'#fef3c7', text:'#92400e' }, blue:{ bg:'#dbeafe', text:'#1e40af' }, navy:{ bg:'#e0e7ff', text:'#1b3a5c' }, gold:{ bg:'#fef3c7', text:'#92400e' }, sage:{ bg:'#dcfce7', text:'#166534' }, gray:{ bg:'#f3f4f6', text:'#374151' }, purple:{ bg:'#ede9fe', text:'#5b21b6' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

const regimeColor = (r) => REGIME_COLORS[r] || T.textMut;
const stageColor = (s) => s === 1 ? T.green : s === 2 ? T.amber : T.red;
const channelColor = (delta) => delta <= 0 ? T.green : delta < 5 ? T.amber : T.red;

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function DmeRiskEnginePage() {
  const navigate = useNavigate();

  /* Portfolio from localStorage */
  const portfolio = useMemo(() => {
    const raw = loadLS(LS_PORT);
    if (!raw || !Array.isArray(raw.holdings)) return [];
    return raw.holdings.map(h => {
      const co = GLOBAL_COMPANY_MASTER.find(c => c.ticker === h.ticker || c.company_name === h.company_name || c.id === h.id);
      return co ? { ...co, weight: h.weight || h.weight_pct || 2 } : null;
    }).filter(Boolean);
  }, []);

  const [selectedId, setSelectedId] = useState(null);
  const [sortCol, setSortCol] = useState('primaryPD');
  const [sortDir, setSortDir] = useState('desc');
  const [tab, setTab] = useState('overview');

  /* Assess all holdings */
  const allAssessments = useMemo(() => {
    return portfolio.map(co => assessEntity(co, co.weight));
  }, [portfolio]);

  /* Selected entity assessment */
  const selectedAssessment = useMemo(() => {
    if (!selectedId) return null;
    const co = portfolio.find(c => (c.ticker || c.id) === selectedId);
    return co ? assessEntity(co, co.weight) : null;
  }, [selectedId, portfolio]);

  /* Portfolio aggregates */
  const portfolioStats = useMemo(() => {
    if (allAssessments.length === 0) return null;
    const n = allAssessments.length;
    const avgPD = allAssessments.reduce((s, a) => s + a.primaryPD, 0) / n;
    const totalVaR = allAssessments.reduce((s, a) => s + a.adjVaR, 0);
    const weightedWACC = allAssessments.reduce((s, a) => s + a.waccResult.wacc * (a.weight / 100), 0) / allAssessments.reduce((s, a) => s + a.weight / 100, 0);
    const avgLCR = allAssessments.reduce((s, a) => s + a.lcr, 0) / n;
    const criticalCount = allAssessments.filter(a => a.regime === 'Critical' || a.regime === 'Extreme').length;
    const totalEL = allAssessments.reduce((s, a) => s + a.el, 0);
    const avgDMI = allAssessments.reduce((s, a) => s + a.dmi, 0) / n;
    const regimeDist = { Normal: 0, Elevated: 0, Critical: 0, Extreme: 0 };
    allAssessments.forEach(a => { regimeDist[a.regime] = (regimeDist[a.regime] || 0) + 1; });
    const dominantRegime = Object.entries(regimeDist).sort((a, b) => b[1] - a[1])[0][0];
    return { avgPD, totalVaR, weightedWACC, avgLCR, criticalCount, totalEL, avgDMI, regimeDist, dominantRegime, n };
  }, [allAssessments]);

  /* Sorted table data */
  const sortedAssessments = useMemo(() => {
    const arr = [...allAssessments];
    arr.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'name': av = a.company.company_name || ''; bv = b.company.company_name || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'primaryPD': av = a.primaryPD; bv = b.primaryPD; break;
        case 'adjVaR': av = a.adjVaR; bv = b.adjVaR; break;
        case 'wacc': av = a.waccResult.wacc; bv = b.waccResult.wacc; break;
        case 'dmi': av = a.dmi; bv = b.dmi; break;
        case 'zScore': av = Math.abs(a.zScore); bv = Math.abs(b.zScore); break;
        case 'el': av = a.el; bv = b.el; break;
        default: av = a.primaryPD; bv = b.primaryPD;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [allAssessments, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const sortArrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' ^' : ' v') : '';

  /* Z-Score timeline (simulated 12-month for portfolio) */
  const zTimeline = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((m, i) => {
      const base = portfolioStats ? portfolioStats.avgDMI : 45;
      const drift = Math.sin(i * 0.5) * 8 + sRand(i * 137) * 12;
      const val = clamp(base + drift, 10, 95);
      const z = calculateZScore(val, 45, 18);
      return { month: m, dmi: +val.toFixed(1), zScore: +z.toFixed(2) };
    });
  }, [portfolioStats]);

  /* DMI Heatmap data */
  const heatmapData = useMemo(() => {
    return allAssessments.slice(0, 20).map(a => ({
      name: (a.company.company_name || a.company.ticker || '').substring(0, 18),
      impact: +a.impactScore.toFixed(1),
      risk: +a.riskScore.toFixed(1),
      opportunity: +a.opportunityScore.toFixed(1),
    }));
  }, [allAssessments]);

  /* Regime pie data */
  const regimePie = useMemo(() => {
    if (!portfolioStats) return [];
    return Object.entries(portfolioStats.regimeDist).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [portfolioStats]);

  /* Exports */
  const exportCSV = useCallback(() => {
    const header = 'Company,Sector,PD_bps,VaR_USD_Mn,WACC_pct,LCR_pct,DMI,Z_Score,Regime,IFRS9_Stage,EL_USD_Mn,Branch\n';
    const rows = allAssessments.map(a =>
      `"${a.company.company_name}","${a.company.sector}",${(a.primaryPD * 10000).toFixed(0)},${a.adjVaR.toFixed(2)},${(a.waccResult.wacc * 100).toFixed(2)},${a.lcr.toFixed(1)},${a.dmi.toFixed(1)},${a.zScore.toFixed(2)},${a.regime},${a.ifrs9Stage},${a.el.toFixed(3)},${a.primaryBranch.label}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dme_risk_assessment.csv'; a.click();
  }, [allAssessments]);

  const exportJSON = useCallback(() => {
    const data = allAssessments.map(a => ({
      company: a.company.company_name, sector: a.company.sector,
      pd_branches: a.branches.map(b => ({ branch: b.branch, label: b.label, pd: +b.pd.toFixed(6) })),
      primary_pd: +a.primaryPD.toFixed(6), dd: +a.dd.toFixed(3),
      var_usd_mn: +a.adjVaR.toFixed(3), wacc: +a.waccResult.wacc.toFixed(4),
      lcr: +a.lcr.toFixed(2), dmi: +a.dmi.toFixed(2), z_score: +a.zScore.toFixed(3), regime: a.regime,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dme_pd_details.json'; a.click();
  }, [allAssessments]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  /* ========================================================================= */
  /*  RENDER                                                                   */
  /* ========================================================================= */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>

      {/* ── 1. HEADER ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>DME Financial Risk Engine</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {['4-Branch PD','VaR','WACC','LCR','IFRS 9','DMI'].map(b => (
              <span key={b} style={{ fontSize: 10, fontWeight: 600, color: T.gold, background: `${T.gold}18`, border: `1px solid ${T.gold}44`, borderRadius: 4, padding: '2px 8px' }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={handlePrint}>Print</Btn>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[{ k:'overview', l:'Portfolio Risk Dashboard' }, { k:'entity', l:'Entity Risk Assessment' }, { k:'heatmap', l:'DMI Heatmap' }, { k:'traffic', l:'Risk Traffic Light' }, { k:'ifrs9', l:'IFRS 9 Staging' }, { k:'coefficients', l:'Sector Coefficients' }].map(t => (
          <Btn key={t.k} small active={tab === t.k} onClick={() => setTab(t.k)}>{t.l}</Btn>
        ))}
      </div>

      {/* Cross-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
          { label: 'Stranded Assets', path: '/stranded-assets' },
          { label: 'Climate VaR', path: '/portfolio-climate-var' },
          { label: 'Stress Test', path: '/scenario-stress-test' },
          { label: 'Entity Deep-Dive', path: '/dme-entity' },
          { label: 'Double Materiality', path: '/double-materiality' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ fontSize: 11, color: T.navyL, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: T.font }}>
            {n.label} &rarr;
          </button>
        ))}
      </div>

      {portfolio.length === 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>Build a portfolio in the Portfolio Manager to run DME risk assessment.</div>
          <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
        </div>
      )}

      {/* ── 2. ENTITY SELECTOR & ASSESSMENT ─────────────────────────────── */}
      {tab === 'entity' && portfolio.length > 0 && (
        <>
          <Section title="Entity Risk Assessment" badge="Select holding to assess">
            <div style={{ marginBottom: 16 }}>
              <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value || null)} style={{ width: '100%', maxWidth: 420, padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.surface, color: T.text, fontFamily: T.font }}>
                <option value="">-- Select a portfolio holding --</option>
                {portfolio.map(co => <option key={co.ticker || co.id} value={co.ticker || co.id}>{co.company_name} ({co.sector})</option>)}
              </select>
            </div>

            {selectedAssessment && (() => {
              const a = selectedAssessment;
              return (
                <>
                  {/* 6 KPI cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
                    <KpiCard label="Adjusted PD" value={fmtBps(a.primaryPD * 10000)} sub={`Branch ${a.primaryBranch.branch}: ${a.primaryBranch.label}`} accent={a.primaryPD > 0.03 ? T.red : a.primaryPD > 0.015 ? T.amber : T.green} />
                    <KpiCard label="Value-at-Risk" value={fmtUsd(a.adjVaR)} sub={`Base: ${fmtUsd(a.varBase)}`} accent={T.navyL} />
                    <KpiCard label="WACC" value={fmtPct(a.waccResult.wacc * 100)} sub={`+${a.waccResult.bpsChange.toFixed(0)} bps ESG adj`} accent={T.gold} />
                    <KpiCard label="LCR" value={`${a.lcr.toFixed(1)}%`} sub={a.lcr >= 100 ? 'Compliant' : 'Below 100% threshold'} accent={a.lcr >= 100 ? T.green : T.red} />
                    <KpiCard label="IFRS 9 Stage" value={`Stage ${a.ifrs9Stage}`} sub={a.ifrs9Stage === 1 ? '12-month ECL' : a.ifrs9Stage === 2 ? 'Lifetime ECL (SICR)' : 'Credit-impaired'} accent={stageColor(a.ifrs9Stage)} />
                    <KpiCard label="Regime" value={a.regime} sub={`Z-Score: ${a.zScore.toFixed(2)} | DMI: ${a.dmi.toFixed(1)}`} accent={regimeColor(a.regime)} />
                  </div>

                  {/* Risk Channel Table */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Risk Channel Decomposition</div>
                    <table style={tbl}><thead><tr>
                      <th style={th}>Channel</th><th style={th}>Baseline</th><th style={th}>ESG-Adjusted</th><th style={th}>Delta</th><th style={th}>Status</th>
                    </tr></thead><tbody>
                      {RISK_CHANNELS.map(ch => {
                        const sc = a.channelScores[ch.id];
                        return (
                          <tr key={ch.id}>
                            <td style={td}><span style={{ fontWeight: 600 }}>{ch.label}</span></td>
                            <td style={td}>{fmt(sc.baseline, 2)}</td>
                            <td style={td}>{fmt(sc.adjusted, 2)}</td>
                            <td style={{ ...td, color: channelColor(sc.delta), fontWeight: 600 }}>{sc.delta >= 0 ? '+' : ''}{fmt(sc.delta, 2)}</td>
                            <td style={td}><Badge label={sc.delta <= 0 ? 'Low' : sc.delta < 5 ? 'Medium' : 'High'} color={sc.delta <= 0 ? 'green' : sc.delta < 5 ? 'amber' : 'red'} /></td>
                          </tr>
                        );
                      })}
                    </tbody></table>
                  </div>

                  {/* PD Branch Audit Trail */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>PD Branch Methodology Audit Trail</div>
                    <table style={tbl}><thead><tr>
                      <th style={th}>Branch</th><th style={th}>Method</th><th style={th}>PD (bps)</th><th style={th}>Primary</th><th style={th}>Rationale</th>
                    </tr></thead><tbody>
                      {a.branches.map(b => (
                        <tr key={b.branch} style={{ background: b.branch === a.primaryBranch.branch ? `${T.gold}10` : 'transparent' }}>
                          <td style={{ ...td, fontWeight: 700 }}>Branch {b.branch}</td>
                          <td style={td}>{b.label}</td>
                          <td style={{ ...td, fontWeight: 600 }}>{(b.pd * 10000).toFixed(0)}</td>
                          <td style={td}>{b.branch === a.primaryBranch.branch ? <Badge label="PRIMARY" color="navy" /> : ''}</td>
                          <td style={{ ...td, fontSize: 11, color: T.textSec }}>
                            {b.branch === 'A' && `Exponential: alpha=${a.coeff.alphaT}, vel=${a.velT.toFixed(3)}`}
                            {b.branch === 'B' && `Merton DD: d2=${a.dd.toFixed(3)}, haircut=${(a.coeff.haircut * a.transRisk / 100).toFixed(3)}`}
                            {b.branch === 'C' && `Tabular: ESG band=${a.esgBand}, mult=${({ low: 1.05, medium: 1.30, high: 2.00, severe: 3.25 })[a.esgBand]}`}
                            {b.branch === 'D' && `Multi-factor: alpha*velT + beta*velP + gamma*velS`}
                          </td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>

                  {/* Expected Loss */}
                  <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Expected Loss Calculation</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>
                      EL = PD x LGD x EAD = {(a.primaryPD * 100).toFixed(2)}% x {(a.lgd * 100).toFixed(0)}% x ${a.ead.toFixed(1)}M = <span style={{ fontWeight: 700, color: T.navy }}>${a.el.toFixed(3)}M</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </Section>
        </>
      )}

      {/* ── 3. PORTFOLIO RISK DASHBOARD ────────────────────────────────── */}
      {tab === 'overview' && portfolioStats && (
        <>
          <Section title="Portfolio Risk Dashboard" badge={`${portfolioStats.n} holdings assessed`}>
            {/* 8 KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Avg PD" value={fmtBps(portfolioStats.avgPD * 10000)} accent={T.navyL} />
              <KpiCard label="Portfolio VaR" value={fmtUsd(portfolioStats.totalVaR)} accent={T.red} />
              <KpiCard label="Weighted WACC" value={fmtPct(portfolioStats.weightedWACC * 100)} accent={T.gold} />
              <KpiCard label="Avg LCR" value={`${portfolioStats.avgLCR.toFixed(1)}%`} accent={portfolioStats.avgLCR >= 100 ? T.green : T.amber} />
              <KpiCard label="Critical Holdings" value={portfolioStats.criticalCount} sub="Critical + Extreme" accent={portfolioStats.criticalCount > 0 ? T.red : T.green} />
              <KpiCard label="Total Expected Loss" value={fmtUsd(portfolioStats.totalEL)} accent={T.red} />
              <KpiCard label="Avg DMI" value={portfolioStats.avgDMI.toFixed(1)} accent={T.sage} />
              <KpiCard label="Portfolio Regime" value={portfolioStats.dominantRegime} accent={regimeColor(portfolioStats.dominantRegime)} />
            </div>

            {/* Regime Distribution Pie */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Regime Distribution</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={regimePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {regimePie.map((d, i) => <Cell key={d.name} fill={REGIME_COLORS[d.name]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Z-Score Timeline */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Z-Score Timeline (12M)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={zTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="dmi" fill={`${T.sage}30`} stroke={T.sage} name="DMI" />
                    <Line yAxisId="right" type="monotone" dataKey="zScore" stroke={T.red} strokeWidth={2} dot={false} name="Z-Score" />
                    <ReferenceLine yAxisId="right" y={2} stroke={T.amber} strokeDasharray="3 3" label="Elevated" />
                    <ReferenceLine yAxisId="right" y={3} stroke={T.red} strokeDasharray="3 3" label="Critical" />
                    <Legend />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Holdings Risk Table */}
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Holdings Risk Table</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead><tr>
                  {[
                    { k:'name', l:'Company' }, { k:'sector', l:'Sector' }, { k:'primaryPD', l:'PD (bps)' },
                    { k:'adjVaR', l:'VaR ($M)' }, { k:'wacc', l:'WACC' }, { k:'dmi', l:'DMI' },
                    { k:'zScore', l:'Z-Score' }, { k:'regime', l:'Regime' }, { k:'ifrs9', l:'IFRS 9' }, { k:'el', l:'EL ($M)' },
                  ].map(c => (
                    <th key={c.k} style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort(c.k)}>{c.l}{sortArrow(c.k)}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sortedAssessments.map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH, cursor: 'pointer' }} onClick={() => { setSelectedId(a.company.ticker || a.company.id); setTab('entity'); }}>
                      <td style={{ ...td, fontWeight: 600 }}>{(a.company.company_name || '').substring(0, 25)}</td>
                      <td style={{ ...td, fontSize: 11 }}>{a.company.sector}</td>
                      <td style={{ ...td, fontWeight: 600, color: a.primaryPD > 0.03 ? T.red : a.primaryPD > 0.015 ? T.amber : T.green }}>{(a.primaryPD * 10000).toFixed(0)}</td>
                      <td style={td}>{a.adjVaR.toFixed(2)}</td>
                      <td style={td}>{(a.waccResult.wacc * 100).toFixed(2)}%</td>
                      <td style={{ ...td, fontWeight: 600 }}>{a.dmi.toFixed(1)}</td>
                      <td style={td}>{a.zScore.toFixed(2)}</td>
                      <td style={td}><Badge label={a.regime} color={a.regime === 'Normal' ? 'green' : a.regime === 'Elevated' ? 'amber' : 'red'} /></td>
                      <td style={td}><span style={{ fontWeight: 600, color: stageColor(a.ifrs9Stage) }}>Stage {a.ifrs9Stage}</span></td>
                      <td style={td}>{a.el.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {/* ── 4. DMI HEATMAP ─────────────────────────────────────────────── */}
      {tab === 'heatmap' && allAssessments.length > 0 && (
        <Section title="DMI Heatmap" badge="Impact x Risk x Opportunity">
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Company</th>
                <th style={{ ...th, background: '#dcfce7' }}>Impact (40%)</th>
                <th style={{ ...th, background: '#fee2e2' }}>Risk (40%)</th>
                <th style={{ ...th, background: '#dbeafe' }}>Opportunity (20%)</th>
                <th style={th}>DMI</th>
              </tr></thead>
              <tbody>
                {heatmapData.map((d, i) => {
                  const cellBg = (v) => {
                    if (v >= 75) return '#fee2e2';
                    if (v >= 50) return '#fef3c7';
                    if (v >= 25) return '#dcfce7';
                    return '#f0fdf4';
                  };
                  const dmiVal = d.impact * 0.4 + d.risk * 0.4 + d.opportunity * 0.2;
                  return (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight: 600 }}>{d.name}</td>
                      <td style={{ ...td, background: cellBg(d.impact), fontWeight: 600 }}>{d.impact.toFixed(1)}</td>
                      <td style={{ ...td, background: cellBg(d.risk), fontWeight: 600 }}>{d.risk.toFixed(1)}</td>
                      <td style={{ ...td, background: cellBg(d.opportunity), fontWeight: 600 }}>{d.opportunity.toFixed(1)}</td>
                      <td style={{ ...td, fontWeight: 700, color: T.navy }}>{dmiVal.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Heatmap bar chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="impact" stackId="a" fill={T.sage} name="Impact (40%)" />
                <Bar dataKey="risk" stackId="a" fill={T.red} name="Risk (40%)" />
                <Bar dataKey="opportunity" stackId="a" fill={T.navyL} name="Opportunity (20%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ── 5. RISK TRAFFIC LIGHT ──────────────────────────────────────── */}
      {tab === 'traffic' && portfolioStats && (
        <>
          <Section title="Risk Traffic Light" badge="5 Channels">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
              {RISK_CHANNELS.map(ch => {
                const avgDelta = allAssessments.reduce((s, a) => s + (a.channelScores[ch.id]?.delta || 0), 0) / allAssessments.length;
                const status = avgDelta <= 0 ? 'green' : avgDelta < 5 ? 'amber' : 'red';
                const bg = status === 'green' ? '#dcfce7' : status === 'amber' ? '#fef3c7' : '#fee2e2';
                const txt = status === 'green' ? '#166534' : status === 'amber' ? '#92400e' : '#991b1b';
                return (
                  <div key={ch.id} style={{ background: bg, border: `2px solid ${txt}40`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: txt, marginBottom: 4 }}>{ch.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: txt }}>{ch.label}</div>
                    <div style={{ fontSize: 11, color: txt, marginTop: 6 }}>Avg delta: {avgDelta >= 0 ? '+' : ''}{avgDelta.toFixed(2)}</div>
                    <div style={{ marginTop: 8 }}><Badge label={status === 'green' ? 'Low' : status === 'amber' ? 'Elevated' : 'Critical'} color={status} /></div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Cross-Pillar Amplification */}
          <Section title="Cross-Pillar Amplification" badge="Cascade multipliers">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
              {Object.entries(AMPLIFICATION).map(([k, v]) => (
                <div key={k} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>{k.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: v.mult >= 3 ? T.red : v.mult >= 2 ? T.amber : T.navy }}>{v.mult}x</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{v.label}</div>
                  <div style={{ marginTop: 8, background: `${T.red}10`, borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${Math.min(v.mult / 5 * 100, 100)}%`, height: '100%', borderRadius: 4, background: v.mult >= 3 ? T.red : v.mult >= 2 ? T.amber : T.sage }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── 6. IFRS 9 STAGING ──────────────────────────────────────────── */}
      {tab === 'ifrs9' && allAssessments.length > 0 && (
        <Section title="IFRS 9 Expected Credit Loss Staging" badge="SICR-triggered classification">
          {/* Stage summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[1, 2, 3].map(stage => {
              const holdings = allAssessments.filter(a => a.ifrs9Stage === stage);
              const labels = { 1: { name: 'Stage 1 — 12-Month ECL', desc: 'No significant increase in credit risk', color: T.green },
                2: { name: 'Stage 2 — Lifetime ECL', desc: 'SICR triggered; PD > 150 bps', color: T.amber },
                3: { name: 'Stage 3 — Credit Impaired', desc: 'Default or near-default; PD > 500 bps', color: T.red } };
              const l = labels[stage];
              return (
                <div key={stage} style={{ background: T.surface, border: `2px solid ${l.color}40`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${l.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: l.color }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{l.desc}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, marginTop: 8 }}>{holdings.length}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>holdings | EL: ${holdings.reduce((s, a) => s + a.el, 0).toFixed(2)}M</div>
                </div>
              );
            })}
          </div>

          {/* Detailed table */}
          <table style={tbl}>
            <thead><tr>
              <th style={th}>Company</th><th style={th}>Sector</th><th style={th}>PD (bps)</th>
              <th style={th}>Stage</th><th style={th}>SICR Trigger</th><th style={th}>LGD</th>
              <th style={th}>EAD ($M)</th><th style={th}>EL ($M)</th>
            </tr></thead>
            <tbody>
              {allAssessments.sort((a, b) => b.ifrs9Stage - a.ifrs9Stage || b.primaryPD - a.primaryPD).map((a, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{(a.company.company_name || '').substring(0, 25)}</td>
                  <td style={{ ...td, fontSize: 11 }}>{a.company.sector}</td>
                  <td style={{ ...td, fontWeight: 600, color: a.primaryPD > 0.03 ? T.red : T.text }}>{(a.primaryPD * 10000).toFixed(0)}</td>
                  <td style={td}><span style={{ fontWeight: 700, color: stageColor(a.ifrs9Stage) }}>Stage {a.ifrs9Stage}</span></td>
                  <td style={{ ...td, fontSize: 11 }}>{a.ifrs9Stage === 1 ? 'None' : a.ifrs9Stage === 2 ? 'PD > 150 bps' : 'PD > 500 bps (default)'}</td>
                  <td style={td}>{(a.lgd * 100).toFixed(0)}%</td>
                  <td style={td}>{a.ead.toFixed(1)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{a.el.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* EL waterfall chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Expected Loss by Stage</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[1, 2, 3].map(stage => ({
                stage: `Stage ${stage}`,
                el: allAssessments.filter(a => a.ifrs9Stage === stage).reduce((s, a) => s + a.el, 0),
                count: allAssessments.filter(a => a.ifrs9Stage === stage).length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(3)}M`} />
                <Bar dataKey="el" name="Expected Loss ($M)">
                  {[T.green, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ── 7. SECTOR RISK COEFFICIENTS ────────────────────────────────── */}
      {tab === 'coefficients' && (
        <Section title="Sector Risk Coefficients" badge="Alpha / Beta / Gamma per sector">
          <table style={tbl}>
            <thead><tr>
              <th style={th}>Sector</th><th style={th}>Alpha (T)</th><th style={th}>Beta (P)</th>
              <th style={th}>Gamma (S)</th><th style={th}>Base Vol</th><th style={th}>Stranded Haircut</th><th style={th}>LGD</th>
            </tr></thead>
            <tbody>
              {Object.entries(SECTOR_COEFFICIENTS).map(([sector, c], i) => (
                <tr key={sector} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ ...td, fontWeight: 600 }}>{sector}</td>
                  <td style={td}>{c.alphaT.toFixed(2)}</td>
                  <td style={td}>{c.betaP.toFixed(2)}</td>
                  <td style={td}>{c.gammaS.toFixed(2)}</td>
                  <td style={td}>{(c.baseVol * 100).toFixed(0)}%</td>
                  <td style={td}>{(c.haircut * 100).toFixed(0)}%</td>
                  <td style={td}>{(c.lgd * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Coefficient radar */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Sector Coefficient Radar</div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={Object.entries(SECTOR_COEFFICIENTS).slice(0, 8).map(([s, c]) => ({
                sector: s.substring(0, 12), alphaT: c.alphaT * 100, betaP: c.betaP * 100, gammaS: c.gammaS * 100, lgd: c.lgd * 100,
              }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="sector" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Alpha" dataKey="alphaT" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                <Radar name="Beta" dataKey="betaP" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
                <Radar name="Gamma" dataKey="gammaS" stroke={T.sage} fill={T.sage} fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ── 8. VELOCITY ENGINE DASHBOARD ──────────────────────────── */}
      {tab === 'overview' && portfolioStats && (
        <Section title="Velocity Engine Dashboard" badge="EMA Smoothing + Acceleration">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Transition Velocity Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={allAssessments.slice(0, 15).map(a => ({
                  name: (a.company.company_name || a.company.ticker || '').substring(0, 12),
                  velT: +a.velT.toFixed(3),
                  velP: +a.velP.toFixed(3),
                  velS: +a.velS.toFixed(3),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="velT" fill={T.navy} name="Transition Vel" />
                  <Bar dataKey="velP" fill={T.sage} name="Physical Vel" />
                  <Bar dataKey="velS" fill={T.gold} name="Social Vel" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Acceleration Heat Map</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                {allAssessments.slice(0, 25).map((a, i) => {
                  const absAccel = Math.abs(a.accel);
                  const bg = absAccel > 0.15 ? '#fee2e2' : absAccel > 0.08 ? '#fef3c7' : '#dcfce7';
                  const textC = absAccel > 0.15 ? '#991b1b' : absAccel > 0.08 ? '#92400e' : '#166534';
                  return (
                    <div key={i} style={{ background: bg, borderRadius: 4, padding: '6px 4px', textAlign: 'center', fontSize: 9 }}>
                      <div style={{ fontWeight: 600, color: textC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(a.company.company_name || '').substring(0, 8)}</div>
                      <div style={{ fontWeight: 700, color: textC, fontSize: 11 }}>{a.accel.toFixed(3)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: T.textMut }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#dcfce7', display: 'inline-block' }} /> Low</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#fef3c7', display: 'inline-block' }} /> Medium</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#fee2e2', display: 'inline-block' }} /> High</span>
              </div>
            </div>
          </div>

          {/* Velocity Engine formulas reference */}
          <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Velocity Engine Formulas</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[
                { name: 'Velocity', formula: 'v(t) = (current - previous) / dt', desc: 'Rate of change in risk signal' },
                { name: 'Acceleration', formula: 'a(t) = (v(t) - v(t-1)) / dt', desc: 'Rate of change of velocity' },
                { name: 'EMA Smooth', formula: 'EMA = alpha*raw + (1-alpha)*prev', desc: 'Exponential moving average' },
                { name: 'Z-Score', formula: 'z = (value - mean) / stdDev', desc: 'Standard deviations from mean' },
              ].map((f, i) => (
                <div key={i} style={{ background: T.surface, borderRadius: 6, padding: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: T.gold, fontFamily: 'monospace', marginTop: 2 }}>{f.formula}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── 9. SORTABLE FULL RESULTS TABLE WITH EXPORT ─────────────── */}
      {tab === 'overview' && allAssessments.length > 0 && (
        <Section title="Full Risk Assessment Results" badge={`${allAssessments.length} holdings | Export-ready`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Btn small onClick={exportCSV}>Download CSV</Btn>
            <Btn small onClick={exportJSON}>Download JSON (PD Details)</Btn>
            <Btn small onClick={handlePrint}>Print Report</Btn>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tbl}>
              <thead><tr>
                {[
                  { k:'name', l:'Company' }, { k:'sector', l:'Sector' }, { k:'primaryPD', l:'PD (bps)' },
                  { k:'branch', l:'Branch' }, { k:'adjVaR', l:'VaR ($M)' }, { k:'wacc', l:'WACC (%)' },
                  { k:'lcr', l:'LCR (%)' }, { k:'dmi', l:'DMI' }, { k:'zScore', l:'|Z|' },
                  { k:'regime', l:'Regime' }, { k:'ifrs9', l:'IFRS 9' }, { k:'el', l:'EL ($M)' },
                  { k:'esg', l:'ESG' }, { k:'trans', l:'Trans Risk' }, { k:'emissions', l:'Emissions (Mt)' },
                ].map(c => (
                  <th key={c.k} style={{ ...th, cursor: ['name','primaryPD','adjVaR','wacc','dmi','zScore','el'].includes(c.k) ? 'pointer' : 'default', fontSize: 10 }}
                    onClick={() => ['name','primaryPD','adjVaR','wacc','dmi','zScore','el'].includes(c.k) && toggleSort(c.k)}>
                    {c.l}{['name','primaryPD','adjVaR','wacc','dmi','zScore','el'].includes(c.k) ? sortArrow(c.k) : ''}
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {sortedAssessments.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH, cursor: 'pointer' }}
                    onClick={() => { setSelectedId(a.company.ticker || a.company.id); setTab('entity'); }}>
                    <td style={{ ...td, fontWeight: 600, fontSize: 11 }}>{(a.company.company_name || '').substring(0, 22)}</td>
                    <td style={{ ...td, fontSize: 10 }}>{(a.company.sector || '').substring(0, 14)}</td>
                    <td style={{ ...td, fontWeight: 700, color: a.primaryPD > 0.03 ? T.red : a.primaryPD > 0.015 ? T.amber : T.green, fontSize: 11 }}>
                      {(a.primaryPD * 10000).toFixed(0)}
                    </td>
                    <td style={{ ...td, fontSize: 10 }}>{a.primaryBranch.branch}</td>
                    <td style={{ ...td, fontSize: 11 }}>{a.adjVaR.toFixed(2)}</td>
                    <td style={{ ...td, fontSize: 11 }}>{(a.waccResult.wacc * 100).toFixed(2)}</td>
                    <td style={{ ...td, fontSize: 11, color: a.lcr < 100 ? T.red : T.text }}>{a.lcr.toFixed(1)}</td>
                    <td style={{ ...td, fontWeight: 600, fontSize: 11 }}>{a.dmi.toFixed(1)}</td>
                    <td style={{ ...td, fontSize: 11 }}>{Math.abs(a.zScore).toFixed(2)}</td>
                    <td style={td}><Badge label={a.regime} color={a.regime === 'Normal' ? 'green' : a.regime === 'Elevated' ? 'amber' : 'red'} /></td>
                    <td style={td}><span style={{ fontWeight: 600, color: stageColor(a.ifrs9Stage), fontSize: 11 }}>S{a.ifrs9Stage}</span></td>
                    <td style={{ ...td, fontSize: 11 }}>{a.el.toFixed(3)}</td>
                    <td style={{ ...td, fontSize: 11 }}>{a.esgScore}</td>
                    <td style={{ ...td, fontSize: 11 }}>{a.transRisk}</td>
                    <td style={{ ...td, fontSize: 11 }}>{a.totalEmissions.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 10. PORTFOLIO EXPECTED LOSS SUMMARY ────────────────────── */}
      {tab === 'overview' && portfolioStats && (
        <Section title="Expected Loss Summary" badge="EL = PD x LGD x EAD">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Total Portfolio EL</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{fmtUsd(portfolioStats.totalEL)}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Sum of PD x LGD x EAD across all holdings</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Avg PD Weighted</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{fmtBps(portfolioStats.avgPD * 10000)}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Portfolio probability of default</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', marginBottom: 4 }}>Stage 3 Holdings</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: allAssessments.filter(a => a.ifrs9Stage === 3).length > 0 ? T.red : T.green }}>
                {allAssessments.filter(a => a.ifrs9Stage === 3).length}
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Credit-impaired positions</div>
            </div>
          </div>

          {/* EL distribution by sector */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Expected Loss by Sector</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(() => {
                const sectorEL = {};
                allAssessments.forEach(a => {
                  const sec = a.company.sector || 'Other';
                  sectorEL[sec] = (sectorEL[sec] || 0) + a.el;
                });
                return Object.entries(sectorEL).map(([sector, el]) => ({ sector: sector.substring(0, 14), el: +el.toFixed(3) })).sort((a, b) => b.el - a.el);
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(3)}M`} />
                <Bar dataKey="el" fill={T.red} name="Expected Loss ($M)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ── 11. PD BRANCH DISTRIBUTION ─────────────────────────────── */}
      {tab === 'overview' && allAssessments.length > 0 && (
        <Section title="PD Branch Distribution" badge="Which branch drives each holding">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Primary Branch Allocation</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={(() => {
                    const dist = { A: 0, B: 0, C: 0, D: 0 };
                    allAssessments.forEach(a => { dist[a.primaryBranch.branch]++; });
                    return Object.entries(dist).map(([k, v]) => ({
                      name: `Branch ${k}`,
                      value: v,
                      label: k === 'A' ? 'Exponential' : k === 'B' ? 'Merton DD' : k === 'C' ? 'Tabular ESG' : 'Multi-factor',
                    })).filter(d => d.value > 0);
                  })()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {[T.navy, T.sage, T.gold, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Branch Methodology Reference</div>
              {[
                { branch: 'A', name: 'Exponential', formula: 'PD = PD_base x exp(alpha x vel_T)', useCase: 'Real-time monitoring with velocity-driven escalation' },
                { branch: 'B', name: 'Merton Distance-to-Default', formula: 'PD = N(-d2) where d2 from BSM model', useCase: 'IFRS 9 compliant, structural credit model with stranded asset haircut' },
                { branch: 'C', name: 'Tabular ESG', formula: 'PD = PD_base x ESG_multiplier', useCase: 'Band-based approach: low (1.05x), medium (1.30x), high (2.00x), severe (3.25x)' },
                { branch: 'D', name: 'Multi-factor', formula: 'PD = PD_base x exp(aT*vT + bP*vP + gS*vS)', useCase: 'Portfolio aggregation with transition, physical, and social velocity factors' },
              ].map((b, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>Branch {b.branch}: {b.name}</span>
                    <span style={{ fontSize: 10, color: T.textMut, fontFamily: 'monospace' }}>{b.formula}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{b.useCase}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── 12. WACC DECOMPOSITION ──────────────────────────────────── */}
      {tab === 'overview' && allAssessments.length > 0 && (
        <Section title="WACC ESG Decomposition" badge="Equity premium + Debt spread">
          <div style={{ overflowX: 'auto' }}>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Company</th><th style={th}>WACC (%)</th>
                <th style={th}>ESG Eq Premium</th><th style={th}>ESG Debt Spread</th>
                <th style={th}>BPS Change</th><th style={th}>ESG Band</th>
              </tr></thead>
              <tbody>
                {sortedAssessments.slice(0, 20).map((a, i) => {
                  const eqPrem = a.esgBand === 'severe' ? 350 : a.esgBand === 'high' ? 200 : a.esgBand === 'medium' ? 80 : 20;
                  const debtSpread = Math.round(eqPrem * 0.6);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ ...td, fontWeight: 600, fontSize: 11 }}>{(a.company.company_name || '').substring(0, 22)}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{(a.waccResult.wacc * 100).toFixed(2)}%</td>
                      <td style={td}>+{eqPrem} bps</td>
                      <td style={td}>+{debtSpread} bps</td>
                      <td style={{ ...td, fontWeight: 600, color: a.waccResult.bpsChange > 50 ? T.red : a.waccResult.bpsChange > 20 ? T.amber : T.green }}>
                        +{a.waccResult.bpsChange.toFixed(0)} bps
                      </td>
                      <td style={td}><Badge label={a.esgBand} color={a.esgBand === 'low' ? 'green' : a.esgBand === 'medium' ? 'amber' : 'red'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12, marginTop: 10, fontSize: 11, color: T.textSec }}>
            <strong>WACC Formula:</strong> WACC = wE x (cE + ESG_eq_premium) + wD x (cD + ESG_debt_spread) x (1 - tax_rate)
            | wE = 65%, wD = 35%, Tax = 25%
            | ESG premium bands: low (+20bps eq), medium (+80bps), high (+200bps), severe (+350bps)
          </div>
        </Section>
      )}

      {/* ── 13. LCR COMPLIANCE DASHBOARD ─────────────────────────── */}
      {tab === 'overview' && allAssessments.length > 0 && (
        <Section title="LCR Compliance Dashboard" badge="HQLA / (Net Outflows x ESG Stress)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Above 100%', count: allAssessments.filter(a => a.lcr >= 100).length, color: T.green, desc: 'Compliant' },
              { label: '80-100%', count: allAssessments.filter(a => a.lcr >= 80 && a.lcr < 100).length, color: T.amber, desc: 'Watch' },
              { label: 'Below 80%', count: allAssessments.filter(a => a.lcr < 80).length, color: T.red, desc: 'Critical' },
            ].map((b, i) => (
              <div key={i} style={{ background: T.surface, border: `2px solid ${b.color}40`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${b.color}` }}>
                <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{b.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: b.color }}>{b.count}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{b.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedAssessments.slice(0, 20).map(a => ({
                name: (a.company.company_name || '').substring(0, 12),
                lcr: +a.lcr.toFixed(1),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <ReferenceLine y={100} stroke={T.green} strokeDasharray="3 3" label="100%" />
                <Bar dataKey="lcr" name="LCR (%)">
                  {sortedAssessments.slice(0, 20).map((a, i) => (
                    <Cell key={i} fill={a.lcr >= 100 ? T.green : a.lcr >= 80 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, borderTop: `1px solid ${T.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
        <span>DME Financial Risk Engine v1.0 | 4-Branch PD Strategy | {allAssessments.length} entities assessed</span>
        <span>Port from dme-platform/src/lib/calculations.ts | Velocity Engine + Merton DD + IFRS 9</span>
      </div>
    </div>
  );
}
