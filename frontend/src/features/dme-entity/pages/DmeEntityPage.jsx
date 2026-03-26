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
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
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
   DME CALCULATION ENGINE (ported from dme-platform/src/lib/calculations.ts)
   ========================================================================= */
function calculateVelocity(current, previous, deltaT) { return deltaT > 0 ? (current - previous) / deltaT : 0; }
function calculateAcceleration(currentVel, prevVel, deltaT) { return deltaT > 0 ? (currentVel - prevVel) / deltaT : 0; }
function emaSmooth(rawValue, prevEma, alpha) { return alpha * rawValue + (1 - alpha) * prevEma; }
function calculateZScore(value, mean, stdDev) { return stdDev > 0 ? (value - mean) / stdDev : 0; }
function classifyRegime(zScore) {
  if (zScore <= 1.0) return 'Normal';
  if (zScore <= 2.0) return 'Elevated';
  if (zScore <= 3.0) return 'Critical';
  return 'Extreme';
}

function normalCDF(x) {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-z*z);
  return 0.5 * (1.0 + sign * y);
}

function pdExponential(pdBase, alpha, velocityTransition) { return pdBase * Math.exp(alpha * velocityTransition); }
function pdMertonDD(assetValue, totalDebt, riskFreeRate, volatility, timeHorizon, strandedHaircut) {
  const adjustedAsset = assetValue * (1 - strandedHaircut);
  if (adjustedAsset <= 0 || totalDebt <= 0 || volatility <= 0 || timeHorizon <= 0) return { dd: 0, pd: 0.5 };
  const d1 = (Math.log(adjustedAsset / totalDebt) + (riskFreeRate + 0.5 * volatility * volatility) * timeHorizon) / (volatility * Math.sqrt(timeHorizon));
  const d2 = d1 - volatility * Math.sqrt(timeHorizon);
  return { dd: d2, pd: normalCDF(-d2) };
}
function pdTabular(pdBase, esgBand) {
  const multipliers = { low: 1.05, medium: 1.30, high: 2.00, severe: 3.25 };
  return pdBase * (multipliers[esgBand] || 1.0);
}
function pdMultifactor(pdBase, alphaT, velT, betaP, velP, gammaS, velS) {
  return pdBase * Math.exp(alphaT * velT + betaP * velP + gammaS * velS);
}
function varRealtime(varBase, exposure, betaRep, accelRep) { return varBase + exposure * betaRep * accelRep; }
function waccAdjusted(wE, cE, esgEqPrem, wD, cD, esgDebtSpread, taxRate) {
  const wacc = wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);
  const baseline = wE * cE + wD * cD * (1 - taxRate);
  return { wacc, bpsChange: (wacc - baseline) * 10000 };
}
function calculateDMI(impactScore, riskScore, opportunityScore, weights = { impact: 0.40, risk: 0.40, opportunity: 0.20 }) {
  return impactScore * weights.impact + riskScore * weights.risk + opportunityScore * weights.opportunity;
}
function lcrAdjusted(hqla, netOutflows, esgStressMult) {
  if (netOutflows <= 0) return 999;
  return (hqla / (netOutflows * esgStressMult)) * 100;
}

/* =========================================================================
   SECTOR COEFFICIENTS
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
   SASB MATERIALITY MATRIX (sector -> material topics)
   ========================================================================= */
const SASB_MATRIX = {
  Energy:                  ['GHG Emissions','Air Quality','Water Management','Ecological Impacts','Business Ethics','Reserves Valuation','Physical Impacts of Climate'],
  Materials:               ['GHG Emissions','Air Quality','Energy Management','Water Management','Waste Management','Ecological Impacts','Employee H&S'],
  Utilities:               ['GHG Emissions','Air Quality','Water Management','Coal Ash Management','Nuclear Safety','Grid Resiliency','Energy Affordability'],
  Industrials:             ['Energy Management','Employee H&S','Product Quality & Safety','Materials Sourcing','Business Ethics','Competitive Behavior'],
  'Consumer Discretionary':['Product Quality & Safety','Chemical Safety','Supply Chain Management','Labour Practices','Data Security'],
  'Consumer Staples':      ['Water Management','Food Safety','Product Labelling','Supply Chain Management','Packaging & Waste','Environmental Footprint'],
  'Health Care':           ['Drug Safety','Access to Medicines','Ethical Marketing','Clinical Trial Standards','Data Security','Waste Management'],
  Financials:              ['Systemic Risk Management','Data Security','Business Ethics','Lending Practices','Financial Inclusion','ESG Integration'],
  'Information Technology':['Data Security','Customer Privacy','Energy Management','Employee Diversity','Intellectual Property','Supply Chain Management'],
  'Communication Services':['Data Security','Customer Privacy','Content Governance','Employee Diversity','Environmental Footprint'],
  'Real Estate':           ['Energy Management','Water Management','Tenant H&S','Climate Adaptation','Green Building Certification'],
};

/* SBTi Sector Targets (proxy reduction pathways % per year) */
const SBTI_TARGETS = {
  Energy: { annual_reduction: 4.2, pathway: '1.5C', base_year: 2020, target_year: 2030, absolute_target: -42 },
  Materials: { annual_reduction: 3.8, pathway: '1.5C', base_year: 2020, target_year: 2030, absolute_target: -38 },
  Utilities: { annual_reduction: 4.0, pathway: '1.5C', base_year: 2020, target_year: 2030, absolute_target: -40 },
  Industrials: { annual_reduction: 3.0, pathway: 'WB2C', base_year: 2020, target_year: 2030, absolute_target: -30 },
  'Consumer Discretionary': { annual_reduction: 2.5, pathway: 'WB2C', base_year: 2020, target_year: 2030, absolute_target: -25 },
  'Consumer Staples': { annual_reduction: 2.5, pathway: 'WB2C', base_year: 2020, target_year: 2030, absolute_target: -25 },
  'Health Care': { annual_reduction: 2.0, pathway: 'WB2C', base_year: 2020, target_year: 2030, absolute_target: -20 },
  Financials: { annual_reduction: 2.8, pathway: 'WB2C', base_year: 2020, target_year: 2030, absolute_target: -28 },
  'Information Technology': { annual_reduction: 3.5, pathway: '1.5C', base_year: 2020, target_year: 2030, absolute_target: -35 },
  'Communication Services': { annual_reduction: 2.5, pathway: 'WB2C', base_year: 2020, target_year: 2030, absolute_target: -25 },
  'Real Estate': { annual_reduction: 3.2, pathway: '1.5C', base_year: 2020, target_year: 2030, absolute_target: -32 },
};

/* NGFS scenario definitions for entity scenario table */
const NGFS_SCENARIOS = [
  { id: 'nz2050', name: 'Net Zero 2050', temp: '1.5C', transition: 'High', physical: 'Low' },
  { id: 'below2c', name: 'Below 2C', temp: '<2C', transition: 'Medium-High', physical: 'Low-Med' },
  { id: 'delayed', name: 'Delayed Transition', temp: '1.8C', transition: 'Very High', physical: 'Medium' },
  { id: 'divergent', name: 'Divergent Net Zero', temp: '1.5C', transition: 'High (uneven)', physical: 'Low' },
  { id: 'ndc', name: 'Nationally Determined', temp: '>2.5C', transition: 'Low', physical: 'High' },
  { id: 'current', name: 'Current Policies', temp: '>3C', transition: 'Very Low', physical: 'Very High' },
];

/* =========================================================================
   FULL ENTITY ASSESSMENT
   ========================================================================= */
function assessEntity(company) {
  const s = seed(company.company_name || company.ticker || 'X');
  const coeff = SECTOR_COEFFICIENTS[company.sector] || DEFAULT_COEFF;

  const mcap = company.market_cap_usd_mn || 5000;
  const debt = company.total_debt_usd_mn || mcap * 0.3;
  const assetValue = mcap + debt;
  const esgScore = company.esg_score || 50;
  const transRisk = company.transition_risk_score || 50;
  const scope1 = company.scope1_mt || 0;
  const scope2 = company.scope2_mt || 0;
  const scope3est = (scope1 + scope2) * (3.5 + sRand(s + 99) * 2); // estimated scope 3
  const totalEmissions = scope1 + scope2;
  const revenue = company.revenue_usd_mn || mcap * 0.4;
  const carbonIntensity = revenue > 0 ? (totalEmissions * 1e6) / revenue : 0;

  const esgBand = esgScore >= 70 ? 'low' : esgScore >= 50 ? 'medium' : esgScore >= 30 ? 'high' : 'severe';
  const pdBase = clamp(0.005 + (transRisk / 100) * 0.04 + sRand(s + 1) * 0.01, 0.001, 0.15);

  const velT = (sRand(s + 10) - 0.3) * 0.5;
  const velP = (sRand(s + 20) - 0.3) * 0.3;
  const velS = (sRand(s + 30) - 0.3) * 0.2;
  const accel = calculateAcceleration(velT, velT * 0.8, 1);

  const pdA = pdExponential(pdBase, coeff.alphaT, velT);
  const merton = pdMertonDD(assetValue, debt, 0.045, coeff.baseVol, 1, coeff.haircut * (transRisk / 100));
  const pdC = pdTabular(pdBase, esgBand);
  const pdD = pdMultifactor(pdBase, coeff.alphaT, velT, coeff.betaP, velP, coeff.gammaS, velS);

  const branches = [
    { branch: 'A', label: 'Exponential', pd: pdA },
    { branch: 'B', label: 'Merton DD', pd: merton.pd },
    { branch: 'C', label: 'Tabular ESG', pd: pdC },
    { branch: 'D', label: 'Multi-factor', pd: pdD },
  ].sort((a, b) => b.pd - a.pd);
  const primaryPD = branches[0].pd;
  const primaryBranch = branches[0];

  const exposure = mcap * 0.02;
  const varBase = exposure * coeff.baseVol * 1.645 * Math.sqrt(1 / 252) * 0.01;
  const adjVaR = varRealtime(varBase, exposure, coeff.betaP, Math.abs(accel));

  const wE = 0.65, wD = 0.35;
  const cE = 0.09 + sRand(s + 40) * 0.04;
  const cD = 0.04 + sRand(s + 50) * 0.02;
  const esgEqPrem = esgBand === 'severe' ? 0.035 : esgBand === 'high' ? 0.020 : esgBand === 'medium' ? 0.008 : 0.002;
  const esgDebtSpread = esgEqPrem * 0.6;
  const waccResult = waccAdjusted(wE, cE, esgEqPrem, wD, cD, esgDebtSpread, 0.25);

  const hqla = mcap * 0.15;
  const netOutflows = mcap * 0.08;
  const esgStressMult = esgBand === 'severe' ? 1.35 : esgBand === 'high' ? 1.20 : esgBand === 'medium' ? 1.08 : 1.02;
  const lcr = lcrAdjusted(hqla, netOutflows, esgStressMult);

  const impactScore = clamp(totalEmissions * 10 + transRisk * 0.3 + sRand(s + 60) * 20, 0, 100);
  const riskScore = clamp(primaryPD * 1000 + transRisk * 0.4 + sRand(s + 70) * 15, 0, 100);
  const opportunityScore = clamp(esgScore * 0.6 + (100 - transRisk) * 0.3 + sRand(s + 80) * 10, 0, 100);
  const dmi = calculateDMI(impactScore, riskScore, opportunityScore);

  const zScore = calculateZScore(dmi, 45, 18);
  const regime = classifyRegime(Math.abs(zScore));
  const ifrs9Stage = primaryPD > 0.05 ? 3 : primaryPD > 0.015 ? 2 : 1;
  const ead = exposure > 0 ? exposure : mcap * 0.01;
  const el = primaryPD * coeff.lgd * ead;

  /* Credit rating proxy */
  const creditRating = primaryPD < 0.003 ? 'AA' : primaryPD < 0.008 ? 'A' : primaryPD < 0.015 ? 'BBB' : primaryPD < 0.03 ? 'BB' : primaryPD < 0.06 ? 'B' : 'CCC';

  /* Active alerts (generated from threshold breaches) */
  const alerts = [];
  if (primaryPD > 0.03) alerts.push({ level: 'Critical', msg: `PD exceeds 300 bps (${(primaryPD * 10000).toFixed(0)} bps)`, ts: '2026-03-25T14:30Z' });
  if (Math.abs(zScore) > 2) alerts.push({ level: 'Warning', msg: `Z-Score ${zScore.toFixed(2)} indicates ${regime} regime`, ts: '2026-03-25T10:15Z' });
  if (lcr < 100) alerts.push({ level: 'Critical', msg: `LCR below 100% threshold (${lcr.toFixed(1)}%)`, ts: '2026-03-24T16:00Z' });
  if (waccResult.bpsChange > 50) alerts.push({ level: 'Warning', msg: `WACC ESG adjustment +${waccResult.bpsChange.toFixed(0)} bps`, ts: '2026-03-24T09:20Z' });
  if (transRisk > 70) alerts.push({ level: 'Info', msg: `High transition risk score (${transRisk})`, ts: '2026-03-23T11:45Z' });
  if (scope1 > 1) alerts.push({ level: 'Info', msg: `Scope 1 emissions ${scope1.toFixed(2)} Mt CO2e`, ts: '2026-03-22T08:00Z' });

  /* Competitive percentile (deterministic from seed) */
  const competitivePercentile = clamp(Math.round(esgScore * 0.7 + (100 - transRisk) * 0.2 + sRand(s + 90) * 20), 5, 95);

  /* Scenario results */
  const scenarioResults = NGFS_SCENARIOS.map((sc, idx) => {
    const scenMultPD = 1 + (idx * 0.15) + sRand(s + 100 + idx) * 0.3;
    const scenPD = primaryPD * scenMultPD;
    const scenVaR = adjVaR * (1 + idx * 0.1 + sRand(s + 200 + idx) * 0.2);
    const scenWACC = waccResult.wacc * (1 + idx * 0.02);
    const scenEL = scenPD * coeff.lgd * ead;
    const strandProb = clamp(transRisk / 100 * (0.3 + idx * 0.1) + sRand(s + 300 + idx) * 0.15, 0, 0.95);
    const tempAlign = 1.5 + idx * 0.3 + sRand(s + 400 + idx) * 0.3;
    return {
      ...sc, pd: scenPD, var: scenVaR, wacc: scenWACC, el: scenEL,
      strandProb, tempAlign: +tempAlign.toFixed(1),
    };
  });

  return {
    company, mcap, debt, assetValue, esgScore, esgBand, transRisk,
    scope1, scope2, scope3est, totalEmissions, revenue, carbonIntensity,
    pdBase, branches, primaryPD, primaryBranch, dd: merton.dd,
    varBase, adjVaR, exposure, waccResult, lcr,
    impactScore, riskScore, opportunityScore, dmi, zScore, regime,
    ifrs9Stage, el, ead, lgd: coeff.lgd, creditRating, alerts,
    competitivePercentile, scenarioResults, velT, velP, velS, accel, coeff,
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
const Btn = ({ children, onClick, active, small }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, cursor: 'pointer', background: active ? T.navy : T.surface, color: active ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: T.font, transition: 'all 0.15s' }}>{children}</button>
);
const Badge = ({ label, color }) => {
  const map = { green:{ bg:'#dcfce7', text:'#166534' }, red:{ bg:'#fee2e2', text:'#991b1b' }, amber:{ bg:'#fef3c7', text:'#92400e' }, blue:{ bg:'#dbeafe', text:'#1e40af' }, navy:{ bg:'#e0e7ff', text:'#1b3a5c' }, gold:{ bg:'#fef3c7', text:'#92400e' }, gray:{ bg:'#f3f4f6', text:'#374151' }, purple:{ bg:'#ede9fe', text:'#5b21b6' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

const regimeColor = (r) => REGIME_COLORS[r] || T.textMut;
const stageColor = (s) => s === 1 ? T.green : s === 2 ? T.amber : T.red;

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function DmeEntityPage() {
  const navigate = useNavigate();

  /* All companies from GLOBAL_COMPANY_MASTER that are in portfolio */
  const portfolio = useMemo(() => {
    const raw = loadLS(LS_PORT);
    if (!raw || !Array.isArray(raw.holdings)) return [];
    return raw.holdings.map(h => {
      const co = GLOBAL_COMPANY_MASTER.find(c => c.ticker === h.ticker || c.company_name === h.company_name || c.id === h.id);
      return co ? { ...co, weight: h.weight || h.weight_pct || 2 } : null;
    }).filter(Boolean);
  }, []);

  /* Also allow selecting from full GLOBAL_COMPANY_MASTER */
  const allCompanies = useMemo(() => {
    const portIds = new Set(portfolio.map(c => c.ticker || c.id));
    const others = GLOBAL_COMPANY_MASTER.filter(c => !portIds.has(c.ticker) && !portIds.has(c.id)).slice(0, 200);
    return [...portfolio, ...others];
  }, [portfolio]);

  const [selectedId, setSelectedId] = useState(portfolio.length > 0 ? (portfolio[0].ticker || portfolio[0].id) : null);

  const selectedCompany = useMemo(() => {
    if (!selectedId) return null;
    return allCompanies.find(c => (c.ticker || c.id) === selectedId) || null;
  }, [selectedId, allCompanies]);

  const assessment = useMemo(() => {
    if (!selectedCompany) return null;
    return assessEntity(selectedCompany);
  }, [selectedCompany]);

  /* Velocity & Z-Score timeline (simulated 12 months) */
  const velocityTimeline = useMemo(() => {
    if (!assessment) return [];
    const s = seed(assessment.company.company_name || 'X');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let prevVel = 0, prevEma = assessment.dmi;
    return months.map((m, i) => {
      const raw = clamp(assessment.dmi + Math.sin(i * 0.7) * 12 + (sRand(s + i * 33) - 0.4) * 15, 10, 95);
      const ema = emaSmooth(raw, prevEma, 0.3);
      const vel = calculateVelocity(raw, prevEma, 1);
      const z = calculateZScore(raw, 45, 18);
      prevEma = ema;
      prevVel = vel;
      return { month: m, dmi: +raw.toFixed(1), ema: +ema.toFixed(1), velocity: +vel.toFixed(2), zScore: +z.toFixed(2) };
    });
  }, [assessment]);

  /* Emissions breakdown */
  const emissionsData = useMemo(() => {
    if (!assessment) return [];
    return [
      { category: 'Scope 1', value: +assessment.scope1.toFixed(3) },
      { category: 'Scope 2', value: +assessment.scope2.toFixed(3) },
      { category: 'Scope 3 (est)', value: +assessment.scope3est.toFixed(3) },
    ];
  }, [assessment]);

  /* Peer companies for competitive ranking */
  const sectorPeers = useMemo(() => {
    if (!assessment) return [];
    return allCompanies.filter(c => c.sector === assessment.company.sector && (c.ticker || c.id) !== selectedId)
      .slice(0, 8).map(c => {
        const a = assessEntity(c);
        return { name: (c.company_name || c.ticker || '').substring(0, 16), dmi: +a.dmi.toFixed(1), esg: a.esgScore, pd: +(a.primaryPD * 10000).toFixed(0) };
      });
  }, [assessment, selectedId, allCompanies]);

  /* DMI decomposition radar */
  const radarData = useMemo(() => {
    if (!assessment) return [];
    return [
      { axis: 'Impact (40%)', value: +assessment.impactScore.toFixed(1), max: 100 },
      { axis: 'Risk (40%)', value: +assessment.riskScore.toFixed(1), max: 100 },
      { axis: 'Opportunity (20%)', value: +assessment.opportunityScore.toFixed(1), max: 100 },
      { axis: 'ESG Score', value: assessment.esgScore, max: 100 },
      { axis: 'Transition Risk', value: assessment.transRisk, max: 100 },
      { axis: 'Carbon Intensity', value: clamp(assessment.carbonIntensity / 100, 0, 100), max: 100 },
    ];
  }, [assessment]);

  /* Portfolios holding this entity */
  const portfolioExposure = useMemo(() => {
    if (!assessment) return [];
    const raw = loadLS(LS_PORT);
    if (!raw) return [];
    const match = (raw.holdings || []).find(h => h.ticker === selectedId || h.id === selectedId || h.company_name === assessment.company.company_name);
    if (!match) return [];
    return [{ name: raw.name || 'Primary Portfolio', weight: match.weight || match.weight_pct || 2, value: (assessment.mcap * (match.weight || 2) / 100) }];
  }, [assessment, selectedId]);

  /* Exports */
  const exportCSV = useCallback(() => {
    if (!assessment) return;
    const a = assessment;
    const lines = [
      'Field,Value',
      `Company,"${a.company.company_name}"`, `Sector,${a.company.sector}`, `Country,${a.company.countryCode || a.company._region || ''}`,
      `Market Cap USD Mn,${a.mcap}`, `Regime,${a.regime}`, `DMI,${a.dmi.toFixed(2)}`,
      `Primary PD bps,${(a.primaryPD * 10000).toFixed(0)}`, `VaR USD Mn,${a.adjVaR.toFixed(3)}`,
      `WACC pct,${(a.waccResult.wacc * 100).toFixed(2)}`, `LCR pct,${a.lcr.toFixed(1)}`,
      `IFRS9 Stage,${a.ifrs9Stage}`, `Credit Rating,${a.creditRating}`,
      `Expected Loss USD Mn,${a.el.toFixed(4)}`, `Z-Score,${a.zScore.toFixed(3)}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = `dme_entity_${(a.company.ticker || 'entity').replace(/\s/g, '_')}.csv`; el.click();
  }, [assessment]);

  const exportJSON = useCallback(() => {
    if (!assessment) return;
    const blob = new Blob([JSON.stringify({
      entity: assessment.company.company_name, sector: assessment.company.sector,
      pd_branches: assessment.branches, primary_pd: assessment.primaryPD,
      var_usd_mn: assessment.adjVaR, wacc: assessment.waccResult.wacc,
      lcr: assessment.lcr, dmi: assessment.dmi, regime: assessment.regime,
      scenarios: assessment.scenarioResults,
    }, null, 2)], { type: 'application/json' });
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = `dme_entity_${(assessment.company.ticker || 'entity').replace(/\s/g, '_')}.json`; el.click();
  }, [assessment]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  /* ========================================================================= */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>

      {/* ── 1. HEADER ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>DME Entity Intelligence Deep-Dive</h1>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Comprehensive risk profile for any portfolio holding or tracked entity</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={handlePrint}>Print</Btn>
        </div>
      </div>

      {/* Cross-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Risk Engine', path: '/dme-risk-engine' },
          { label: 'NGFS Scenarios', path: '/ngfs-scenarios' },
          { label: 'Climate VaR', path: '/portfolio-climate-var' },
          { label: 'Stranded Assets', path: '/stranded-assets' },
          { label: 'Portfolio Dashboard', path: '/portfolio-dashboard' },
          { label: 'Double Materiality', path: '/double-materiality' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ fontSize: 11, color: T.navyL, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: T.font }}>{n.label} &rarr;</button>
        ))}
      </div>

      {/* Entity Selector */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Select Entity</div>
        <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value || null)} style={{ width: '100%', maxWidth: 500, padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.surface, color: T.text, fontFamily: T.font }}>
          <option value="">-- Choose an entity --</option>
          {portfolio.length > 0 && <optgroup label="Portfolio Holdings">
            {portfolio.map(co => <option key={co.ticker || co.id} value={co.ticker || co.id}>{co.company_name} ({co.sector})</option>)}
          </optgroup>}
          <optgroup label="All Companies">
            {allCompanies.filter(c => !portfolio.find(p => (p.ticker || p.id) === (c.ticker || c.id))).slice(0, 100).map(co =>
              <option key={co.ticker || co.id} value={co.ticker || co.id}>{co.company_name} ({co.sector})</option>
            )}
          </optgroup>
        </select>
      </div>

      {!assessment && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Select an entity above to view its risk profile</div>
        </div>
      )}

      {assessment && (() => {
        const a = assessment;
        return (
          <>
            {/* ── Entity Header ─────────────────────────────────────────── */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>{a.company.company_name}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
                  {a.company.sector} | {a.company.countryCode || a.company._region || 'N/A'} | {a.company._displayExchange || 'N/A'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge label={a.regime} color={a.regime === 'Normal' ? 'green' : a.regime === 'Elevated' ? 'amber' : 'red'} />
                <div style={{ background: T.navy, color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 14, fontWeight: 700 }}>DMI {a.dmi.toFixed(1)}</div>
              </div>
            </div>

            {/* ── 2. 6 KPI CARDS ────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 24 }}>
              <KpiCard label="Market Cap" value={fmtUsd(a.mcap)} sub={`Debt: ${fmtUsd(a.debt)}`} accent={T.navyL} />
              <KpiCard label="Credit Rating" value={a.creditRating} sub={`PD: ${fmtBps(a.primaryPD * 10000)}`} accent={a.creditRating.startsWith('A') ? T.green : a.creditRating.startsWith('B') ? T.amber : T.red} />
              <KpiCard label="Baseline PD" value={fmtBps(a.pdBase * 10000)} sub={`ESG Band: ${a.esgBand}`} accent={T.gold} />
              <KpiCard label="Total Emissions" value={`${a.totalEmissions.toFixed(2)} Mt`} sub={`S1: ${a.scope1.toFixed(2)} | S2: ${a.scope2.toFixed(2)}`} accent={a.totalEmissions > 1 ? T.red : T.sage} />
              <KpiCard label="Carbon Intensity" value={`${fmt(a.carbonIntensity, 0)}`} sub="tCO2e / USD Mn rev" accent={T.amber} />
              <KpiCard label="Active Alerts" value={a.alerts.length} sub={a.alerts.length > 0 ? a.alerts[0].level : 'None'} accent={a.alerts.length > 2 ? T.red : a.alerts.length > 0 ? T.amber : T.green} />
            </div>

            {/* ── 3. FINANCIAL RISK PANEL ────────────────────────────────── */}
            <Section title="Financial Risk Panel" badge={`Method: ${a.primaryBranch.label}`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Adjusted PD</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{fmtBps(a.primaryPD * 10000)}</div>
                  <div style={{ fontSize: 11, color: T.red }}>+{((a.primaryPD - a.pdBase) * 10000).toFixed(0)} bps vs baseline</div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>VaR (1D, 95%)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{fmtUsd(a.adjVaR)}</div>
                  <div style={{ fontSize: 11, color: T.red }}>+{fmtUsd(a.adjVaR - a.varBase)} ESG impact</div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>WACC</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{fmtPct(a.waccResult.wacc * 100)}</div>
                  <div style={{ fontSize: 11, color: T.amber }}>+{a.waccResult.bpsChange.toFixed(0)} bps ESG premium</div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>LCR</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: a.lcr >= 100 ? T.green : T.red }}>{a.lcr.toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{a.lcr >= 100 ? 'Compliant' : 'Below 100%'}</div>
                </div>
              </div>
            </Section>

            {/* ── 4. EMISSIONS BREAKDOWN ─────────────────────────────────── */}
            <Section title="Emissions Breakdown" badge="Scope 1 + 2 + 3 (est)">
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={emissionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <Tooltip formatter={(v) => `${v.toFixed(3)} Mt`} />
                    <Bar dataKey="value" name="Emissions (Mt CO2e)">
                      <Cell fill={T.sage} />
                      <Cell fill={T.navyL} />
                      <Cell fill={T.gold} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            {/* ── 5. VELOCITY & Z-SCORE TIMELINE ────────────────────────── */}
            <Section title="Velocity & Z-Score Timeline" badge="12-month simulated">
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={velocityTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'DMI / EMA', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'Z-Score / Velocity', angle: 90, position: 'insideRight', style: { fontSize: 9 } }} />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="dmi" fill={`${T.sage}30`} stroke={T.sage} name="DMI" />
                    <Line yAxisId="left" type="monotone" dataKey="ema" stroke={T.gold} strokeWidth={2} dot={false} name="EMA" />
                    <Line yAxisId="right" type="monotone" dataKey="zScore" stroke={T.red} strokeWidth={2} dot={false} name="Z-Score" />
                    <Line yAxisId="right" type="monotone" dataKey="velocity" stroke={T.navyL} strokeDasharray="5 5" dot={false} name="Velocity" />
                    <ReferenceLine yAxisId="right" y={2} stroke={T.amber} strokeDasharray="3 3" label="Elevated" />
                    <ReferenceLine yAxisId="right" y={3} stroke={T.red} strokeDasharray="3 3" label="Critical" />
                    <Legend />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Section>

            {/* ── 6. SCENARIO RESULTS TABLE ──────────────────────────────── */}
            <Section title="NGFS Scenario Results" badge="6 scenarios">
              <div style={{ overflowX: 'auto' }}>
                <table style={tbl}>
                  <thead><tr>
                    <th style={th}>Scenario</th><th style={th}>Temp</th><th style={th}>PD (bps)</th>
                    <th style={th}>VaR ($M)</th><th style={th}>WACC</th><th style={th}>EL ($M)</th>
                    <th style={th}>Stranding Prob</th><th style={th}>Temp Align</th>
                  </tr></thead>
                  <tbody>
                    {a.scenarioResults.map((sc, i) => (
                      <tr key={sc.id} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                        <td style={{ ...td, fontWeight: 600 }}>{sc.name}</td>
                        <td style={td}><Badge label={sc.temp} color={sc.temp.includes('1.5') ? 'green' : sc.temp.includes('2') ? 'amber' : 'red'} /></td>
                        <td style={{ ...td, fontWeight: 600 }}>{(sc.pd * 10000).toFixed(0)}</td>
                        <td style={td}>{sc.var.toFixed(2)}</td>
                        <td style={td}>{(sc.wacc * 100).toFixed(2)}%</td>
                        <td style={td}>{sc.el.toFixed(3)}</td>
                        <td style={{ ...td, color: sc.strandProb > 0.3 ? T.red : T.text }}>{(sc.strandProb * 100).toFixed(1)}%</td>
                        <td style={{ ...td, fontWeight: 600, color: sc.tempAlign > 2.5 ? T.red : sc.tempAlign > 2 ? T.amber : T.green }}>{sc.tempAlign}C</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── 7. PORTFOLIO EXPOSURE ──────────────────────────────────── */}
            <Section title="Portfolio Exposure" badge="Where this entity is held">
              {portfolioExposure.length === 0 ? (
                <div style={{ fontSize: 12, color: T.textSec, padding: 12, background: T.surfaceH, borderRadius: 8 }}>This entity is not currently in any tracked portfolio.</div>
              ) : (
                <table style={tbl}>
                  <thead><tr><th style={th}>Portfolio</th><th style={th}>Weight (%)</th><th style={th}>Exposure ($M)</th></tr></thead>
                  <tbody>
                    {portfolioExposure.map((p, i) => (
                      <tr key={i}><td style={{ ...td, fontWeight: 600 }}>{p.name}</td><td style={td}>{p.weight.toFixed(1)}%</td><td style={td}>{fmtUsd(p.value)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* ── 8. SASB MATERIALITY ISSUES ─────────────────────────────── */}
            <Section title="SASB Materiality Issues" badge={a.company.sector}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(SASB_MATRIX[a.company.sector] || ['No SASB mapping available']).map((topic, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 500, color: T.navy }}>
                    <span style={{ color: T.gold, fontWeight: 700, marginRight: 4 }}>{i + 1}.</span> {topic}
                  </div>
                ))}
              </div>
            </Section>

            {/* ── 9. SBTi SECTOR TARGETS ─────────────────────────────────── */}
            <Section title="SBTi Sector Targets" badge={a.company.sector}>
              {(() => {
                const target = SBTI_TARGETS[a.company.sector];
                if (!target) return <div style={{ fontSize: 12, color: T.textSec }}>No SBTi target data for this sector</div>;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Pathway</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{target.pathway}</div>
                    </div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Annual Reduction</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.sage }}>-{target.annual_reduction}%</div>
                    </div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Base Year</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{target.base_year}</div>
                    </div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Target Year</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{target.target_year}</div>
                    </div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>Absolute Target</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.red }}>{target.absolute_target}%</div>
                    </div>
                  </div>
                );
              })()}
              <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>
                SBTi committed: <span style={{ fontWeight: 700, color: a.company.sbti_committed ? T.green : T.red }}>{a.company.sbti_committed ? 'Yes' : 'No'}</span>
                {a.company.carbon_neutral_target_year && <span> | Carbon neutral target: {a.company.carbon_neutral_target_year}</span>}
              </div>
            </Section>

            {/* ── 10. COMPETITIVE SCORE ──────────────────────────────────── */}
            <Section title="Competitive ESG Score" badge={`${a.competitivePercentile}th percentile`}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: a.competitivePercentile >= 70 ? T.green : a.competitivePercentile >= 40 ? T.amber : T.red }}>{a.competitivePercentile}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Percentile vs sector peers</div>
                  <div style={{ marginTop: 10, background: T.surfaceH, borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${a.competitivePercentile}%`, height: '100%', borderRadius: 4, background: a.competitivePercentile >= 70 ? T.green : a.competitivePercentile >= 40 ? T.amber : T.red }} />
                  </div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Sector Peer Comparison</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[{ name: (a.company.company_name || '').substring(0, 14), dmi: +a.dmi.toFixed(1) }, ...sectorPeers]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="dmi" name="DMI Score">
                        {[a, ...sectorPeers.map(() => null)].map((_, i) => <Cell key={i} fill={i === 0 ? T.gold : COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            {/* ── 11. ALERT HISTORY ─────────────────────────────────────── */}
            <Section title="Alert History" badge={`${a.alerts.length} active`}>
              {a.alerts.length === 0 ? (
                <div style={{ fontSize: 12, color: T.textSec, padding: 12, background: T.surfaceH, borderRadius: 8 }}>No active alerts for this entity.</div>
              ) : (
                <table style={tbl}>
                  <thead><tr><th style={th}>Level</th><th style={th}>Alert</th><th style={th}>Timestamp</th></tr></thead>
                  <tbody>
                    {a.alerts.map((al, i) => (
                      <tr key={i} style={{ background: al.level === 'Critical' ? '#fee2e220' : 'transparent' }}>
                        <td style={td}><Badge label={al.level} color={al.level === 'Critical' ? 'red' : al.level === 'Warning' ? 'amber' : 'blue'} /></td>
                        <td style={{ ...td, fontWeight: 500 }}>{al.msg}</td>
                        <td style={{ ...td, fontSize: 11, color: T.textMut }}>{al.ts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* ── 12. ESG RATINGS CROSS-REFERENCE ───────────────────────── */}
            <Section title="ESG Ratings Cross-Reference" badge="External providers">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { provider: 'MSCI ESG', rating: a.esgScore >= 70 ? 'AA' : a.esgScore >= 55 ? 'A' : a.esgScore >= 40 ? 'BBB' : 'BB', color: T.sage },
                  { provider: 'Sustainalytics', rating: `${clamp(100 - a.esgScore + Math.round(sRand(seed(a.company.company_name) + 500) * 10), 10, 50)} Risk`, color: T.navyL },
                  { provider: 'S&P Global ESG', rating: `${clamp(a.esgScore + Math.round(sRand(seed(a.company.company_name) + 600) * 10 - 5), 20, 95)}/100`, color: T.gold },
                  { provider: 'CDP Climate', rating: a.esgScore >= 65 ? 'B+' : a.esgScore >= 45 ? 'C' : 'D', color: T.amber },
                ].map((r, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, textAlign: 'center', borderTop: `3px solid ${r.color}` }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase' }}>{r.provider}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{r.rating}</div>
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>Reference only</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── 13. DMI DECOMPOSITION RADAR ────────────────────────────── */}
            <Section title="DMI Decomposition" badge="Impact 40% + Risk 40% + Opportunity 20%">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                      <Radar name="Entity" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ marginBottom: 12 }}>
                    {[
                      { label: 'Impact Score (40%)', value: a.impactScore, color: T.sage },
                      { label: 'Risk Score (40%)', value: a.riskScore, color: T.red },
                      { label: 'Opportunity Score (20%)', value: a.opportunityScore, color: T.navyL },
                    ].map((dim, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: T.navy }}>{dim.label}</span>
                          <span style={{ fontWeight: 700, color: dim.color }}>{dim.value.toFixed(1)}</span>
                        </div>
                        <div style={{ background: T.surfaceH, borderRadius: 4, height: 10 }}>
                          <div style={{ width: `${clamp(dim.value, 0, 100)}%`, height: '100%', borderRadius: 4, background: dim.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12, marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Weighted DMI Calculation:</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
                      ({a.impactScore.toFixed(1)} x 0.40) + ({a.riskScore.toFixed(1)} x 0.40) + ({a.opportunityScore.toFixed(1)} x 0.20) = <span style={{ fontSize: 16, color: T.gold }}>{a.dmi.toFixed(1)}</span>
                    </div>
                  </div>
                  <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12, marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: T.textSec }}>Z-Score: <span style={{ fontWeight: 700, color: T.navy }}>{a.zScore.toFixed(3)}</span> | Regime: <span style={{ fontWeight: 700, color: regimeColor(a.regime) }}>{a.regime}</span></div>
                  </div>
                </div>
              </div>
            </Section>
            {/* ── 14. PD BRANCH AUDIT TRAIL ─────────────────────────── */}
            <Section title="PD Branch Audit Trail" badge="4-branch comparison">
              <table style={tbl}>
                <thead><tr>
                  <th style={th}>Branch</th><th style={th}>Method</th><th style={th}>PD (bps)</th>
                  <th style={th}>Primary</th><th style={th}>Key Parameters</th>
                </tr></thead>
                <tbody>
                  {a.branches.map(b => (
                    <tr key={b.branch} style={{ background: b.branch === a.primaryBranch.branch ? `${T.gold}10` : 'transparent' }}>
                      <td style={{ ...td, fontWeight: 700 }}>Branch {b.branch}</td>
                      <td style={td}>{b.label}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{(b.pd * 10000).toFixed(0)}</td>
                      <td style={td}>{b.branch === a.primaryBranch.branch ? <Badge label="PRIMARY" color="navy" /> : ''}</td>
                      <td style={{ ...td, fontSize: 10, color: T.textSec, fontFamily: 'monospace' }}>
                        {b.branch === 'A' && `alpha=${a.coeff.alphaT}, velT=${a.velT.toFixed(3)}`}
                        {b.branch === 'B' && `DD=${a.dd.toFixed(3)}, vol=${a.coeff.baseVol}, haircut=${(a.coeff.haircut * a.transRisk / 100).toFixed(3)}`}
                        {b.branch === 'C' && `band=${a.esgBand}, mult=${({ low: 1.05, medium: 1.30, high: 2.00, severe: 3.25 })[a.esgBand]}`}
                        {b.branch === 'D' && `aT=${a.coeff.alphaT}*${a.velT.toFixed(2)} + bP=${a.coeff.betaP}*${a.velP.toFixed(2)} + gS=${a.coeff.gammaS}*${a.velS.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PD comparison bar chart */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={a.branches.map(b => ({ branch: `Branch ${b.branch}: ${b.label}`, pd: +(b.pd * 10000).toFixed(0) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'PD (bps)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <Tooltip formatter={(v) => `${v} bps`} />
                    <Bar dataKey="pd" name="PD (bps)">
                      {a.branches.map((b, i) => <Cell key={i} fill={b.branch === a.primaryBranch.branch ? T.gold : COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            {/* ── 15. EXPECTED LOSS DETAIL ──────────────────────────────── */}
            <Section title="Expected Loss Calculation" badge="IFRS 9">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EL = PD x LGD x EAD</div>
                  {[
                    { label: 'Probability of Default (PD)', value: `${(a.primaryPD * 100).toFixed(2)}%`, sub: `${(a.primaryPD * 10000).toFixed(0)} bps` },
                    { label: 'Loss Given Default (LGD)', value: `${(a.lgd * 100).toFixed(0)}%`, sub: `Sector: ${a.company.sector}` },
                    { label: 'Exposure at Default (EAD)', value: fmtUsd(a.ead), sub: `2% of market cap` },
                    { label: 'Expected Loss', value: fmtUsd(a.el), sub: `${(a.primaryPD * 100).toFixed(2)}% x ${(a.lgd * 100).toFixed(0)}% x ${a.ead.toFixed(1)}M` },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{row.label}</div>
                        <div style={{ fontSize: 10, color: T.textMut }}>{row.sub}</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: i === 3 ? T.red : T.navy }}>{row.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>IFRS 9 Classification</div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: stageColor(a.ifrs9Stage) }}>Stage {a.ifrs9Stage}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>
                      {a.ifrs9Stage === 1 && '12-month Expected Credit Loss'}
                      {a.ifrs9Stage === 2 && 'Lifetime ECL - Significant Increase in Credit Risk'}
                      {a.ifrs9Stage === 3 && 'Credit-Impaired - Default or Near-Default'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>
                    <strong>SICR Thresholds:</strong> Stage 1 &lt; 150 bps | Stage 2: 150-500 bps | Stage 3 &gt; 500 bps
                  </div>
                  <div style={{ marginTop: 12, background: T.surfaceH, borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.navy }}>Credit Rating Proxy: {a.creditRating}</div>
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>
                      Derived from PD: AA (&lt;30bps) | A (30-80) | BBB (80-150) | BB (150-300) | B (300-600) | CCC (&gt;600)
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── 16. RISK CHANNEL SUMMARY ──────────────────────────────── */}
            <Section title="Risk Channel Summary" badge="5 channels">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { label: 'Credit', baseline: a.pdBase * 10000, adjusted: a.primaryPD * 10000, unit: 'bps' },
                  { label: 'Market', baseline: a.varBase, adjusted: a.adjVaR, unit: '$M' },
                  { label: 'Valuation', baseline: (a.waccResult.wacc * 100 - a.waccResult.bpsChange / 100), adjusted: a.waccResult.wacc * 100, unit: '%' },
                  { label: 'Liquidity', baseline: (a.mcap * 0.15) / (a.mcap * 0.08) * 100, adjusted: a.lcr, unit: '%' },
                  { label: 'Operational', baseline: a.transRisk * 0.5, adjusted: a.transRisk * 0.5 * (a.esgBand === 'severe' ? 1.35 : a.esgBand === 'high' ? 1.20 : a.esgBand === 'medium' ? 1.08 : 1.02), unit: 'pts' },
                ].map((ch, i) => {
                  const delta = ch.adjusted - ch.baseline;
                  const status = delta <= 0 ? 'green' : delta < (ch.unit === 'bps' ? 50 : 5) ? 'amber' : 'red';
                  return (
                    <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{ch.label}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>Base: {ch.baseline.toFixed(1)} {ch.unit}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, margin: '4px 0' }}>{ch.adjusted.toFixed(1)} {ch.unit}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: status === 'green' ? T.green : status === 'amber' ? T.amber : T.red }}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)} {ch.unit}
                      </div>
                      <div style={{ marginTop: 6 }}><Badge label={status === 'green' ? 'Low' : status === 'amber' ? 'Elevated' : 'High'} color={status} /></div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── 17. SECTOR COEFFICIENT REFERENCE ──────────────────────── */}
            <Section title="Applied Sector Coefficients" badge={a.company.sector}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Alpha (Transition)', value: a.coeff.alphaT, desc: 'Transition risk velocity sensitivity' },
                  { label: 'Beta (Physical)', value: a.coeff.betaP, desc: 'Physical risk velocity sensitivity' },
                  { label: 'Gamma (Social)', value: a.coeff.gammaS, desc: 'Social risk velocity sensitivity' },
                  { label: 'Base Volatility', value: a.coeff.baseVol, desc: 'Sector asset return volatility' },
                  { label: 'Stranded Haircut', value: a.coeff.haircut, desc: 'Max stranded asset impairment' },
                  { label: 'Loss Given Default', value: a.coeff.lgd, desc: 'Expected recovery rate = 1 - LGD' },
                ].map((c, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{c.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.navy, marginTop: 4 }}>{(c.value * 100).toFixed(0)}%</div>
                    <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── 18. TRANSITION VELOCITY DETAIL ────────────────────────── */}
            <Section title="Velocity Components" badge="Transition + Physical + Social">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Transition Velocity', value: a.velT, color: T.navy },
                  { label: 'Physical Velocity', value: a.velP, color: T.sage },
                  { label: 'Social Velocity', value: a.velS, color: T.gold },
                ].map((v, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{v.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: v.color, marginTop: 4 }}>{v.value.toFixed(4)}</div>
                    <div style={{ marginTop: 8, background: T.surfaceH, borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${clamp((v.value + 0.5) * 100, 5, 95)}%`, height: '100%', borderRadius: 4, background: v.color }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>
                      Direction: {v.value >= 0 ? 'Increasing risk' : 'Decreasing risk'} | Magnitude: {Math.abs(v.value) > 0.2 ? 'High' : Math.abs(v.value) > 0.1 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Acceleration</div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  Current acceleration: <span style={{ fontWeight: 700, color: Math.abs(a.accel) > 0.1 ? T.red : T.navy }}>{a.accel.toFixed(4)}</span>
                  {' '} | Interpretation: {Math.abs(a.accel) > 0.15 ? 'Rapidly changing velocity - regime shift possible' :
                    Math.abs(a.accel) > 0.08 ? 'Moderate acceleration - monitor closely' : 'Stable velocity - no immediate concern'}
                </div>
              </div>
            </Section>

            {/* ── 19. CROSS-PILLAR AMPLIFICATION FOR ENTITY ──────────── */}
            <Section title="Cross-Pillar Amplification" badge="Entity-specific cascade risk">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                {[
                  { path: 'G to E', mult: 2.5, label: 'Governance failures amplify environmental risk', applicable: a.esgBand === 'high' || a.esgBand === 'severe' },
                  { path: 'Cross-Pillar to EL', mult: 4.3, label: 'Multi-pillar cascade amplifies expected loss', applicable: Math.abs(a.zScore) > 2 },
                  { path: 'E to S', mult: 1.8, label: 'Environmental damage drives social risk', applicable: a.totalEmissions > 1 },
                  { path: 'Regulatory Lag', mult: 2.1, label: 'Non-compliance compounds over time', applicable: a.transRisk > 60 },
                ].map((amp, i) => (
                  <div key={i} style={{ background: amp.applicable ? '#fee2e210' : T.surface, border: `1px solid ${amp.applicable ? T.red + '40' : T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{amp.path}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: amp.applicable ? T.red : T.textMut }}>{amp.mult}x</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{amp.label}</div>
                    <div style={{ marginTop: 6 }}>
                      <Badge label={amp.applicable ? 'ACTIVE' : 'Inactive'} color={amp.applicable ? 'red' : 'gray'} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        );
      })()}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, borderTop: `1px solid ${T.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
        <span>DME Entity Intelligence v1.0 | Velocity Engine + 4-Branch PD + NGFS Scenarios</span>
        <span>Port from dme-platform | GLOBAL_COMPANY_MASTER: {GLOBAL_COMPANY_MASTER.length} entities</span>
      </div>
    </div>
  );
}
