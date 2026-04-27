import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart, ReferenceLine, ScatterChart, Scatter,
} from 'recharts';

/* ==========================================================================
   THEME
   ========================================================================== */
const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d', teal: '#2a9d8f',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};
const COLORS = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, T.red, T.amber, T.green, '#7c3aed'];
const REGIME_COLORS = { Normal: T.green, Elevated: T.amber, Critical: T.red, Extreme: '#7c2d12' };

/* ==========================================================================
   HELPERS
   ========================================================================== */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const fmt1 = (n) => Number(n).toFixed(1);
const fmt2 = (n) => Number(n).toFixed(2);
const fmt0 = (n) => Number(n).toFixed(0);
const fmtPct = (n) => `${Number(n).toFixed(2)}%`;
const fmtBps = (n) => `${Number(n).toFixed(0)} bps`;
const fmtM = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const scoreColor = (v) => v >= 70 ? T.green : v >= 45 ? T.amber : T.red;
const regimeColor = (r) => REGIME_COLORS[r] || T.textMut;

/* ==========================================================================
   MATH ENGINE (exact port from DmeRiskEnginePage)
   ========================================================================== */
function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return 0.5 * (1.0 + sign * y);
}

/* Branch A — Exponential real-time */
function pdExponential(pdBase, alpha, velocityT) {
  return pdBase * Math.exp(alpha * velocityT);
}

/* Branch B — Merton Distance-to-Default */
function pdMertonDD(assetValue, totalDebt, riskFreeRate, volatility, timeHorizon, strandedHaircut) {
  const adj = assetValue * (1 - strandedHaircut);
  if (adj <= 0 || totalDebt <= 0 || volatility <= 0 || timeHorizon <= 0) return { dd: 0, pd: 0.5 };
  const d1 = (Math.log(adj / totalDebt) + (riskFreeRate + 0.5 * volatility * volatility) * timeHorizon) / (volatility * Math.sqrt(timeHorizon));
  const d2 = d1 - volatility * Math.sqrt(timeHorizon);
  return { dd: d2, pd: clamp(normalCDF(-d2), 0.001, 0.95) };
}

/* Branch C — Tabular ESG band */
function pdTabular(pdBase, esgBand) {
  const mult = { low: 1.05, medium: 1.30, high: 2.00, severe: 3.25 };
  return pdBase * (mult[esgBand] || 1.0);
}

/* Branch D — Monte-Carlo multi-factor (deterministic via sr()) */
function pdMonteCarlo(pdBase, alphaT, velT, betaP, velP, entitySeed) {
  const trials = 500;
  let hits = 0;
  for (let k = 0; k < trials; k++) {
    const shock = -3 + sr(entitySeed + k * 7) * 6;
    const simPD = pdBase * Math.exp(alphaT * velT + betaP * velP + 0.05 * shock);
    if (simPD > 0.05) hits++;
  }
  return hits / trials;
}

/* WACC */
function waccAdjusted(wE, cE, esgEqPrem, wD, cD, esgDebtSpread, taxRate) {
  const wacc = wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);
  const baseline = wE * cE + wD * cD * (1 - taxRate);
  return { wacc: wacc * 100, bpsChange: (wacc - baseline) * 10000 };
}

/* DMI */
function calculateDMI(finScore, esgScore, velocityScore) {
  return finScore * 0.40 + esgScore * 0.40 + velocityScore * 0.20;
}

/* ECL */
function calculateECL(pd, lgd, ead, isLifetime) {
  return pd * lgd * ead * (isLifetime ? 3.2 : 1.0);
}

/* ==========================================================================
   SECTOR COEFFICIENTS
   ========================================================================== */
const SECTOR_COEFF = {
  Energy:       { alphaT: 0.18, betaP: 0.14, baseVol: 0.35, haircut: 0.25, lgd: 0.55 },
  Materials:    { alphaT: 0.14, betaP: 0.11, baseVol: 0.28, haircut: 0.18, lgd: 0.48 },
  Utilities:    { alphaT: 0.15, betaP: 0.10, baseVol: 0.22, haircut: 0.20, lgd: 0.45 },
  Industrials:  { alphaT: 0.10, betaP: 0.09, baseVol: 0.25, haircut: 0.12, lgd: 0.42 },
  Financials:   { alphaT: 0.09, betaP: 0.12, baseVol: 0.24, haircut: 0.10, lgd: 0.50 },
  Technology:   { alphaT: 0.07, betaP: 0.06, baseVol: 0.32, haircut: 0.05, lgd: 0.35 },
  Healthcare:   { alphaT: 0.06, betaP: 0.06, baseVol: 0.22, haircut: 0.06, lgd: 0.38 },
  Consumer:     { alphaT: 0.08, betaP: 0.07, baseVol: 0.26, haircut: 0.08, lgd: 0.40 },
  'Real Estate':{ alphaT: 0.12, betaP: 0.10, baseVol: 0.20, haircut: 0.15, lgd: 0.52 },
  Comms:        { alphaT: 0.06, betaP: 0.05, baseVol: 0.26, haircut: 0.06, lgd: 0.38 },
};
const DEF_COEFF = { alphaT: 0.08, betaP: 0.07, baseVol: 0.25, haircut: 0.10, lgd: 0.42 };

/* ==========================================================================
   40 COMPANIES
   ========================================================================== */
const SECTORS_LIST = ['Energy', 'Materials', 'Utilities', 'Industrials', 'Financials', 'Technology', 'Healthcare', 'Consumer', 'Real Estate', 'Comms'];
const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Middle East', 'Africa'];
const REGIMES = ['Normal', 'Elevated', 'Critical', 'Extreme'];
const ESG_BANDS = ['low', 'medium', 'high', 'severe'];
const NGFS_SCENARIOS = ['Orderly 1.5°C', 'Disorderly 1.8°C', 'Hot House 3.0°C', 'Delayed Trans.', 'Divergent NZ', 'Too Little Too Late'];
const DISCLOSURES = ['Annual Report 2024', 'Sustainability Report 2024', 'TCFD Disclosure Q4-2024', 'CSRD Pilot Filing 2024'];

const COMPANY_NAMES = [
  'Atlas Energy Corp', 'Meridian Materials', 'Nova Utilities', 'Apex Industrials', 'Sterling Financials',
  'Quantum Technology', 'Summit Healthcare', 'Crest Consumer', 'Pinnacle Real Estate', 'Vertex Comms',
  'Solara Energy', 'Titan Materials', 'Cascade Utilities', 'Ironwood Industrials', 'Horizon Financials',
  'Nexus Technology', 'Beacon Healthcare', 'Orbit Consumer', 'Redwood Real Estate', 'Pulse Comms',
  'Vanguard Energy', 'Cobalt Materials', 'Arden Utilities', 'Stratus Industrials', 'Citadel Financials',
  'Helix Technology', 'Clarity Healthcare', 'Zenith Consumer', 'Landmark Real Estate', 'Signal Comms',
  'Ember Energy', 'Quartz Materials', 'Tempest Utilities', 'Forge Industrials', 'Bastion Financials',
  'Cipher Technology', 'Elara Healthcare', 'Haven Consumer', 'Crown Real Estate', 'Synapse Comms',
];

function buildEntity(name, i) {
  const s = (k) => sr(hashStr(name) % 9973 + i * 37 + k);
  const sector = SECTORS_LIST[i % SECTORS_LIST.length];
  const coeff = SECTOR_COEFF[sector] || DEF_COEFF;
  const pdBase = 0.01 + s(3) * 0.12;
  const velocityT = -0.3 + s(7) * 0.6;
  const velP = -0.2 + s(9) * 0.4;
  const pdExp = clamp(pdExponential(pdBase, coeff.alphaT, velocityT), 0.001, 0.85);
  const assetV = 500 + s(11) * 4500;
  const debt = assetV * (0.2 + s(13) * 0.6);
  const vol = coeff.baseVol + s(17) * 0.1;
  const { dd, pd: pdMerton } = pdMertonDD(assetV, debt, 0.04, vol, 1, coeff.haircut);
  const esgBand = ESG_BANDS[Math.floor(s(19) * 4)];
  const pdTab = clamp(pdTabular(pdBase, esgBand), 0.001, 0.90);
  const pdMC = clamp(pdMonteCarlo(pdBase, coeff.alphaT, velocityT, coeff.betaP, velP, hashStr(name) % 9973), 0.001, 0.90);
  const pdConsensus = clamp(pdExp * 0.30 + pdMerton * 0.30 + pdTab * 0.20 + pdMC * 0.20, 0.001, 0.90);
  const zScore = s(23) * 4.2;
  const regime = zScore <= 1.0 ? 'Normal' : zScore <= 2.0 ? 'Elevated' : zScore <= 3.0 ? 'Critical' : 'Extreme';
  const esgScore = 20 + s(29) * 70;
  const envScore = 20 + s(31) * 70;
  const socScore = 20 + s(37) * 70;
  const govScore = 20 + s(41) * 70;
  const finScore = 20 + s(43) * 70;
  const velScore = 30 + s(45) * 60;
  const dmi = clamp(calculateDMI(finScore, esgScore, velScore), 10, 95);
  const ead = assetV * (0.3 + s(47) * 0.5);
  const ecl12 = calculateECL(pdConsensus, coeff.lgd, ead, false);
  const eclLife = calculateECL(pdConsensus, coeff.lgd, ead, true);
  const climateFactor = 1 + coeff.alphaT * (velocityT > 0 ? velocityT : 0);
  const var95 = assetV * (0.03 + s(49) * 0.12);
  const var99 = var95 * (1.15 + s(53) * 0.25);
  const cvar = var99 * (1.10 + s(57) * 0.20);
  const wE = 0.4 + s(59) * 0.4;
  const wD = 1 - wE;
  const cE = 0.08 + s(61) * 0.10;
  const cD = 0.04 + s(63) * 0.06;
  const esgEqPrem = coeff.alphaT * (1 + s(65) * 0.5) * 0.01;
  const esgDebtSpread = coeff.betaP * (1 + s(67) * 0.5) * 0.01;
  const { wacc, bpsChange } = waccAdjusted(wE, cE, esgEqPrem, wD, cD, esgDebtSpread, 0.21);
  const climateBeta = 0.5 + s(69) * 1.5;
  const strandedHaircut = coeff.haircut * (1 + s(71) * 0.5);
  const alertCount = Math.floor(s(73) * 18);
  const nlpSentiment = -1 + s(75) * 2;
  const greenwashFlag = s(77) > 0.72;
  const mlScore = 20 + s(79) * 75;
  const mlCluster = mlScore > 75 ? 'High Risk' : mlScore > 55 ? 'Elevated' : mlScore > 35 ? 'Moderate' : 'Low Risk';
  const anomalyScore = s(81) * 0.95;
  const contagionCentrality = s(83) * 0.85;
  const stage = pdConsensus < 0.03 ? 'S1' : pdConsensus < 0.15 ? 'S2' : 'S3';
  const coveragePct = 60 + s(85) * 39;
  const dmiHistory = Array.from({ length: 12 }, (_, m) => ({ month: m + 1, dmi: clamp(dmi + (-15 + sr(i * 37 + m * 7) * 30), 10, 95) }));
  const plDist = Array.from({ length: 20 }, (_, k) => ({ bin: -var99 + k * (var99 * 2.5 / 20), freq: Math.floor(10 + sr(i * 37 + k * 11) * 80) }));
  return {
    id: i, name, sector, region: REGIONS[Math.floor(s(89) * REGIONS.length)],
    pdBase, pdExp, pdMerton, pdTab, pdMC, pdConsensus,
    dd, esgBand, zScore, regime,
    esgScore, envScore, socScore, govScore, finScore, velScore, dmi,
    ead, ecl12, eclLife, climateFactor,
    var95, var99, cvar,
    wE, wD, cE, cD, esgEqPrem, esgDebtSpread, wacc, bpsChange, climateBeta, strandedHaircut,
    assetValue: assetV, totalDebt: debt, volatility: vol, coeff,
    alertCount, nlpSentiment, greenwashFlag, mlScore, mlCluster, anomalyScore,
    contagionCentrality, stage, coveragePct,
    dmiHistory, plDist, velocityT, velP,
  };
}

const ENTITIES = COMPANY_NAMES.map((n, i) => buildEntity(n, i));

/* ==========================================================================
   STYLES
   ========================================================================== */
const cardS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 };
const kpiBoxS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, textAlign: 'center', flex: 1, minWidth: 120 };
const kpiVal = { fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.navy };
const kpiLab = { fontFamily: T.font, fontSize: 11, color: T.textMut, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const btnS = (a) => ({ fontFamily: T.font, fontSize: 13, fontWeight: a ? 700 : 500, padding: '8px 18px', border: `1px solid ${a ? T.gold : T.border}`, borderRadius: 6, background: a ? T.gold : T.surface, color: a ? '#fff' : T.text, cursor: 'pointer' });
const badgeS = (bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: T.mono, background: bg + '22', color: bg });
const labelS = { fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 };
const tdS = { fontFamily: T.font, fontSize: 13, color: T.text, padding: '10px 12px', borderBottom: `1px solid ${T.borderL}` };
const thS = { fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.textSec, padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' };

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: T.font, fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

const TABS = [
  'Entity Summary', '4-Branch PD', 'IFRS 9 & ECL', 'VaR & CVaR',
  'WACC & Capital', 'DMI Score', 'Alert History', 'Scenario Analysis',
  'NLP Disclosures', 'ML Materiality', 'Contagion Risk', 'Peer Benchmark',
];

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function DmeEntityPage() {
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState(0);

  const entity = useMemo(() => ENTITIES[selectedId] || ENTITIES[0], [selectedId]);

  /* Sector peers */
  const peers = useMemo(() => ENTITIES.filter(e => e.sector === entity.sector && e.id !== entity.id), [entity]);
  const sectorMedian = (key) => {
    const vals = [...peers.map(e => e[key]), entity[key]].sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    return vals.length ? (vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2) : 0;
  };

  /* NGFS scenario impacts for selected entity */
  const ngfsEntityData = useMemo(() => {
    return NGFS_SCENARIOS.map((sc, i) => {
      const mult = 1 + i * 0.3 + sr(entity.id * 13 + i * 7) * 0.5;
      return {
        scenario: sc.length > 18 ? sc.slice(0, 16) + '..' : sc,
        pdShift: +(entity.pdConsensus * mult * 100 - entity.pdConsensus * 100).toFixed(2),
        varShift: +(entity.var95 * (mult - 1) * 0.8).toFixed(1),
        waccBps: +((entity.wacc * (mult - 1) * 0.5) * 100).toFixed(0),
        alignPct: clamp(100 - i * 15 - sr(entity.id * 13 + i * 7 + 3) * 15, 5, 95).toFixed(0),
      };
    });
  }, [entity]);

  /* Historical simulation P&L */
  const histSimData = useMemo(() => {
    return Array.from({ length: 252 }, (_, k) => {
      const ret = (-entity.var99 * 0.8 + sr(entity.id * 7 + k * 3) * entity.var99 * 1.6);
      return { day: k + 1, pnl: +ret.toFixed(1) };
    });
  }, [entity]);

  /* Alert history 90 days for entity */
  const alertHistory = useMemo(() => {
    return Array.from({ length: 12 }, (_, w) => ({
      week: `W${w + 1}`,
      INFO: Math.floor(sr(entity.id * 11 + w * 7 + 1) * 4),
      WARN: Math.floor(sr(entity.id * 11 + w * 7 + 3) * 3),
      CRITICAL: Math.floor(sr(entity.id * 11 + w * 7 + 5) * 2),
      EMERGENCY: sr(entity.id * 11 + w * 7 + 9) > 0.85 ? 1 : 0,
    }));
  }, [entity]);

  /* Peer benchmark dimensions */
  const BENCH_DIMS = [
    { key: 'dmi', label: 'DMI Score', scale: 100 },
    { key: 'esgScore', label: 'ESG Score', scale: 100 },
    { key: 'coveragePct', label: 'Coverage %', scale: 100 },
    { key: 'mlScore', label: 'ML Score', scale: 100 },
    { key: 'govScore', label: 'Gov Score', scale: 100 },
    { key: 'envScore', label: 'Env Score', scale: 100 },
    { key: 'socScore', label: 'Soc Score', scale: 100 },
    { key: 'finScore', label: 'Fin Score', scale: 100 },
  ];

  const radarBenchData = useMemo(() => {
    return BENCH_DIMS.map(d => {
      const allVals = [...peers.map(e => e[d.key]), entity[d.key]].sort((a, b) => a - b);
      const n = allVals.length;
      const p25 = allVals[Math.floor(n * 0.25)] || 0;
      const p75 = allVals[Math.floor(n * 0.75)] || 0;
      const median = allVals[Math.floor(n / 2)] || 0;
      return { axis: d.label, entity: entity[d.key], median, p25, p75 };
    });
  }, [entity, peers]);

  /* Feature contributions for ML */
  const mlFeatures = useMemo(() => {
    const features = [
      { name: 'ESG Score', contribution: entity.esgScore * 0.25 },
      { name: 'PD Consensus', contribution: entity.pdConsensus * 300 },
      { name: 'Velocity', contribution: Math.abs(entity.velocityT) * 40 },
      { name: 'Governance', contribution: entity.govScore * 0.15 },
      { name: 'Disclosure Q.', contribution: entity.coveragePct * 0.10 },
    ];
    const total = features.reduce((a, f) => a + f.contribution, 0) || 1;
    return features.map(f => ({ ...f, pct: +(f.contribution / total * 100).toFixed(1) }));
  }, [entity]);

  /* Counterfactual for ML */
  const counterfactual = useMemo(() => {
    const improved = {
      esgScore: Math.min(100, entity.esgScore + 15),
      pdConsensus: Math.max(0.001, entity.pdConsensus * 0.7),
      velocityT: entity.velocityT * 0.5,
    };
    const improvedScore = clamp(entity.mlScore * (entity.esgScore / improved.esgScore) * (improved.pdConsensus / entity.pdConsensus + 0.5), 10, 100);
    return { current: entity.mlScore, improved: +improvedScore.toFixed(1), delta: +(improvedScore - entity.mlScore).toFixed(1) };
  }, [entity]);

  /* Contagion exposure links */
  const contagionLinks = useMemo(() => {
    return [...ENTITIES]
      .filter(e => e.id !== entity.id)
      .sort((a, b) => sr(entity.id * 7 + b.id * 3) - sr(entity.id * 7 + a.id * 3))
      .slice(0, 8)
      .map(e => ({
        name: e.name,
        sector: e.sector,
        exposureType: sr(entity.id * 7 + e.id * 3) > 0.5 ? 'Direct' : 'Indirect',
        strength: +(entity.contagionCentrality * e.contagionCentrality * sr(entity.id * 7 + e.id) * 100).toFixed(1),
        pd: e.pdConsensus,
      }));
  }, [entity]);

  /* ==========================================================================
     TAB 0 — ENTITY SELECTOR + SUMMARY
     ========================================================================== */
  const renderEntitySummary = () => (
    <>
      {/* Selector */}
      <div style={{ ...cardS, borderLeft: `4px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={labelS}>Select Entity</div>
            <select
              style={{ fontFamily: T.mono, fontSize: 13, padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, color: T.navy, minWidth: 260 }}
              value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}>
              {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name} — {e.sector}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={badgeS(regimeColor(entity.regime))}>{entity.regime}</span>
            <span style={badgeS(entity.stage === 'S3' ? T.red : entity.stage === 'S2' ? T.amber : T.green)}>IFRS 9 {entity.stage}</span>
            <span style={badgeS(entity.greenwashFlag ? T.red : T.green)}>{entity.greenwashFlag ? 'GREENWASH FLAGGED' : 'CLEAN'}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textSec }}>{entity.sector} · {entity.region}</span>
          </div>
        </div>
      </div>
      {/* KPI Strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'PD Consensus', val: fmtPct(entity.pdConsensus * 100), color: entity.pdConsensus > 0.10 ? T.red : entity.pdConsensus > 0.04 ? T.amber : T.green },
          { label: 'Z-Score', val: fmt2(entity.zScore), color: entity.zScore > 2 ? T.red : entity.zScore > 1 ? T.amber : T.green },
          { label: 'DMI Score', val: fmt1(entity.dmi), color: scoreColor(entity.dmi) },
          { label: 'VaR 95%', val: fmtM(entity.var95), color: T.navy },
          { label: 'WACC', val: `${fmt2(entity.wacc)}%`, color: T.navy },
          { label: 'NLP Sentiment', val: fmt2(entity.nlpSentiment), color: entity.nlpSentiment < -0.2 ? T.red : T.green },
          { label: 'ML Mat. Score', val: fmt1(entity.mlScore), color: scoreColor(entity.mlScore) },
          { label: 'Alert Count', val: entity.alertCount, color: entity.alertCount > 12 ? T.red : entity.alertCount > 7 ? T.amber : T.green },
        ].map((k, i) => (
          <div key={i} style={kpiBoxS}>
            <div style={{ ...kpiVal, color: k.color }}>{k.val}</div>
            <div style={kpiLab}>{k.label}</div>
          </div>
        ))}
      </div>
      {/* Profile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Entity Profile</div>
          {[
            ['Asset Value', fmtM(entity.assetValue)],
            ['Total Debt', fmtM(entity.totalDebt)],
            ['Debt/Asset', `${(entity.totalDebt / entity.assetValue * 100).toFixed(0)}%`],
            ['Asset Volatility', fmtPct(entity.volatility * 100)],
            ['Stranded Haircut', fmtPct(entity.strandedHaircut * 100)],
            ['Contagion Centrality', `${(entity.contagionCentrality * 100).toFixed(1)}%`],
            ['ESG Band', entity.esgBand.toUpperCase()],
            ['Coverage %', `${entity.coveragePct.toFixed(0)}%`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.font, fontSize: 13 }}>
              <span style={{ color: T.textSec }}>{k}</span>
              <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={cardS}>
          <div style={labelS}>E / S / G Radar</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={[
              { axis: 'Environment', val: entity.envScore },
              { axis: 'Social', val: entity.socScore },
              { axis: 'Governance', val: entity.govScore },
              { axis: 'Financial', val: entity.finScore },
              { axis: 'DMI', val: entity.dmi },
              { axis: 'ML Score', val: entity.mlScore },
            ]}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name={entity.name.split(' ')[0]} dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  /* ==========================================================================
     TAB 1 — 4-BRANCH PD ANALYSIS
     ========================================================================== */
  const renderPdAnalysis = () => {
    const branches = [
      { name: 'Exponential', pd: entity.pdExp, desc: 'PD = PD_base × exp(α × velocity_T)', color: T.navy },
      { name: 'Merton-DD', pd: entity.pdMerton, desc: `d2 = ${fmt2(entity.dd)} → N(-d2)`, color: T.gold },
      { name: 'Tabular (ESG)', pd: entity.pdTab, desc: `ESG band: ${entity.esgBand.toUpperCase()} × multiplier`, color: T.sage },
      { name: 'Monte-Carlo', pd: entity.pdMC, desc: '500 trials, deterministic via sr()', color: '#7c3aed' },
    ];
    const pdHistoryData = Array.from({ length: 12 }, (_, m) => ({
      month: `M${m + 1}`,
      pdExp: clamp(entity.pdExp + (-0.02 + sr(entity.id * 13 + m * 7 + 1) * 0.04), 0.001, 0.95),
      pdMerton: clamp(entity.pdMerton + (-0.02 + sr(entity.id * 13 + m * 7 + 3) * 0.04), 0.001, 0.95),
      pdConsensus: clamp(entity.pdConsensus + (-0.015 + sr(entity.id * 13 + m * 7 + 5) * 0.03), 0.001, 0.95),
    }));
    return (
      <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {branches.map((b, i) => (
            <div key={i} style={{ ...kpiBoxS, borderTop: `3px solid ${b.color}` }}>
              <div style={{ ...kpiVal, color: b.color, fontSize: 20 }}>{fmtPct(b.pd * 100)}</div>
              <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.navy, marginTop: 4 }}>{b.name}</div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, marginTop: 4 }}>{b.desc}</div>
            </div>
          ))}
          <div style={{ ...kpiBoxS, borderTop: `3px solid ${T.red}` }}>
            <div style={{ ...kpiVal, color: T.red, fontSize: 20 }}>{fmtPct(entity.pdConsensus * 100)}</div>
            <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.navy, marginTop: 4 }}>Consensus PD</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, marginTop: 4 }}>30/30/20/20 weighted avg</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>4-Branch PD Comparison</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={branches.map(b => ({ name: b.name, pd: +(b.pd * 100).toFixed(3) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<CT />} />
                <ReferenceLine y={entity.pdConsensus * 100} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Consensus', position: 'right', fontSize: 10, fill: T.red }} />
                <Bar dataKey="pd" name="PD %" radius={[4, 4, 0, 0]}>
                  {branches.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>PD Trend — 12 Months (3 Branches)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={pdHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(1)}%`} />
                <Tooltip content={<CT />} />
                <Legend />
                <Line type="monotone" dataKey="pdExp" name="Exponential" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pdMerton" name="Merton-DD" stroke={T.gold} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pdConsensus" name="Consensus" stroke={T.red} strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Calculation Parameters</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              [['PD Base', fmtPct(entity.pdBase * 100)], ['Alpha (sector)', fmt2(entity.coeff.alphaT)], ['Velocity T', fmt2(entity.velocityT)], ['PD Exponential', fmtPct(entity.pdExp * 100)]],
              [['Asset Value', fmtM(entity.assetValue)], ['Total Debt', fmtM(entity.totalDebt)], ['Asset Vol', fmtPct(entity.volatility * 100)], ['Distance-to-Default', fmt2(entity.dd)], ['PD Merton', fmtPct(entity.pdMerton * 100)]],
              [['ESG Band', entity.esgBand.toUpperCase()], ['PD Tabular', fmtPct(entity.pdTab * 100)], ['MC Trials', '500'], ['PD Monte-Carlo', fmtPct(entity.pdMC * 100)], ['Consensus PD', fmtPct(entity.pdConsensus * 100)]],
            ].map((group, gi) => (
              <div key={gi}>
                {group.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 13 }}>
                    <span style={{ color: T.textSec }}>{k}</span>
                    <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  /* ==========================================================================
     TAB 2 — IFRS 9 STAGE & ECL
     ========================================================================== */
  const renderIfrs9 = () => {
    const eclTimeline = Array.from({ length: 12 }, (_, m) => ({
      month: `M${m + 1}`,
      ecl12: +(entity.ecl12 * (1 + (-0.05 + sr(entity.id * 11 + m * 5 + 1) * 0.1))).toFixed(2),
      eclLife: +(entity.eclLife * (1 + (-0.05 + sr(entity.id * 11 + m * 5 + 3) * 0.1))).toFixed(2),
    }));
    return (
      <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'IFRS 9 Stage', val: entity.stage, color: entity.stage === 'S3' ? T.red : entity.stage === 'S2' ? T.amber : T.green },
            { label: '12-Month ECL', val: fmtM(entity.ecl12), color: T.navy },
            { label: 'Lifetime ECL', val: fmtM(entity.eclLife), color: entity.stage !== 'S1' ? T.red : T.navy },
            { label: 'Climate Adj Factor', val: fmt2(entity.climateFactor), color: entity.climateFactor > 1.2 ? T.red : T.amber },
            { label: 'LGD', val: fmtPct(entity.coeff.lgd * 100), color: T.navy },
            { label: 'EAD', val: fmtM(entity.ead), color: T.navy },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>ECL Timeline — 12 Months</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={eclTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Legend />
                <Line type="monotone" dataKey="ecl12" name="12-Month ECL ($M)" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="eclLife" name="Lifetime ECL ($M)" stroke={T.red} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>IFRS 9 Stage Classification Logic</div>
            <div style={{ padding: '12px 0' }}>
              {[
                { stage: 'S1', label: 'Performing', threshold: 'PD < 3%', active: entity.stage === 'S1', color: T.green },
                { stage: 'S2', label: 'Underperforming', threshold: '3% ≤ PD < 15%', active: entity.stage === 'S2', color: T.amber },
                { stage: 'S3', label: 'Credit-Impaired', threshold: 'PD ≥ 15%', active: entity.stage === 'S3', color: T.red },
              ].map(s => (
                <div key={s.stage} style={{ background: s.active ? s.color + '18' : T.surfaceH, border: `1px solid ${s.active ? s.color : T.borderL}`, borderRadius: 6, padding: '12px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: s.color }}>{s.stage} — {s.label}</span>
                    {s.active && <span style={badgeS(s.color)}>ACTIVE</span>}
                  </div>
                  <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec, marginTop: 4 }}>Threshold: {s.threshold}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textMut, marginTop: 2 }}>ECL basis: {s.stage === 'S1' ? '12-Month' : 'Lifetime'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Climate Adjustment Factor Decomposition</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[['PD Consensus', fmtPct(entity.pdConsensus * 100)], ['LGD', fmtPct(entity.coeff.lgd * 100)], ['EAD', fmtM(entity.ead)], ['Climate Factor', fmt2(entity.climateFactor)], ['Climate-adj ECL 12m', fmtM(entity.ecl12 * entity.climateFactor)], ['Climate-adj ECL Life', fmtM(entity.eclLife * entity.climateFactor)]].map(([k, v]) => (
              <div key={k} style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{k}</div>
                <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.navy, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  /* ==========================================================================
     TAB 3 — VaR & CVaR
     ========================================================================== */
  const renderVarCvar = () => (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'VaR 95% (1-day)', val: fmtM(entity.var95), color: T.navy },
          { label: 'VaR 99% (1-day)', val: fmtM(entity.var99), color: T.amber },
          { label: 'CVaR (ES)', val: fmtM(entity.cvar), color: T.red },
          { label: 'Stressed VaR', val: fmtM(entity.var99 * 1.4), color: '#7c2d12' },
          { label: 'VaR / Asset', val: fmtPct(entity.var95 / entity.assetValue * 100), color: T.navy },
        ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>P&L Distribution — 252-Day Historical Simulation</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={histSimData.slice(0, 60)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <ReferenceLine y={-entity.var95} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'VaR 95%', position: 'right', fontSize: 9 }} />
              <ReferenceLine y={-entity.var99} stroke={T.red} strokeDasharray="4 4" label={{ value: 'VaR 99%', position: 'right', fontSize: 9 }} />
              <Area type="monotone" dataKey="pnl" stroke={T.navy} fill={T.navy} fillOpacity={0.1} name="P&L ($M)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>P&L Loss Histogram</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={entity.plDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="bin" tickFormatter={v => v.toFixed(0)} tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="freq" name="Frequency" radius={[2, 2, 0, 0]}>
                {entity.plDist.map((e, i) => <Cell key={i} fill={e.bin < 0 ? T.red : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Scenario-Stressed VaR</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Scenario', 'VaR 95%', 'VaR 99%', 'CVaR', 'Δ vs Base'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {ngfsEntityData.map((d, i) => (
              <tr key={i}>
                <td style={{ ...tdS, fontWeight: 600 }}>{NGFS_SCENARIOS[i]}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtM(entity.var95 * (1 + d.pdShift / 20))}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtM(entity.var99 * (1 + d.pdShift / 18))}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtM(entity.cvar * (1 + d.pdShift / 15))}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: T.red }}>+{fmtPct(d.pdShift / 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ==========================================================================
     TAB 4 — WACC & CAPITAL
     ========================================================================== */
  const renderWacc = () => {
    const waccComponents = [
      { name: 'Base Ke', value: +(entity.cE * entity.wE * 100).toFixed(2) },
      { name: 'ESG Eq Prem', value: +(entity.esgEqPrem * entity.wE * 100).toFixed(2) },
      { name: 'Base Kd (AT)', value: +(entity.cD * entity.wD * (1 - 0.21) * 100).toFixed(2) },
      { name: 'ESG Debt Spr', value: +(entity.esgDebtSpread * entity.wD * (1 - 0.21) * 100).toFixed(2) },
    ];
    return (
      <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Adjusted WACC', val: `${fmt2(entity.wacc)}%`, color: T.navy },
            { label: 'WACC Δ (bps)', val: fmtBps(entity.bpsChange), color: entity.bpsChange > 50 ? T.red : T.amber },
            { label: 'Climate Beta', val: fmt2(entity.climateBeta), color: entity.climateBeta > 1.5 ? T.red : T.amber },
            { label: 'Stranded Haircut', val: fmtPct(entity.strandedHaircut * 100), color: entity.strandedHaircut > 0.2 ? T.red : T.amber },
            { label: 'Equity Weight', val: fmtPct(entity.wE * 100), color: T.navy },
            { label: 'Debt Weight', val: fmtPct(entity.wD * 100), color: T.navy },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>WACC Decomposition Waterfall</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={waccComponents}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<CT />} />
                <Bar dataKey="value" name="WACC Component %" radius={[4, 4, 0, 0]}>
                  {waccComponents.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Capital Efficiency Parameters</div>
            {[
              ['Cost of Equity (Ke)', fmtPct(entity.cE * 100)],
              ['ESG Equity Premium', fmtPct(entity.esgEqPrem * 100)],
              ['Cost of Debt (Kd)', fmtPct(entity.cD * 100)],
              ['ESG Debt Spread', fmtPct(entity.esgDebtSpread * 100)],
              ['Tax Rate', '21.0%'],
              ['Stranded Asset Haircut', fmtPct(entity.strandedHaircut * 100)],
              ['Climate Beta', fmt2(entity.climateBeta)],
              ['Sector Alpha', fmt2(entity.coeff.alphaT)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 13 }}>
                <span style={{ color: T.textSec }}>{k}</span>
                <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  /* ==========================================================================
     TAB 5 — DMI SCORE
     ========================================================================== */
  const renderDmiScore = () => {
    const components = [
      { name: 'Financial Score', val: entity.finScore, weight: 40, contribution: entity.finScore * 0.40 },
      { name: 'ESG Score', val: entity.esgScore, weight: 40, contribution: entity.esgScore * 0.40 },
      { name: 'Velocity Score', val: entity.velScore, weight: 20, contribution: entity.velScore * 0.20 },
    ];
    return (
      <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'DMI Score', val: fmt1(entity.dmi), color: scoreColor(entity.dmi) },
            { label: 'Financial (40%)', val: fmt1(entity.finScore), color: scoreColor(entity.finScore) },
            { label: 'ESG (40%)', val: fmt1(entity.esgScore), color: scoreColor(entity.esgScore) },
            { label: 'Velocity (20%)', val: fmt1(entity.velScore), color: scoreColor(entity.velScore) },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>DMI Score History — 12 Months</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={entity.dmiHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="month" tickFormatter={m => `M${m}`} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <ReferenceLine y={70} stroke={T.green} strokeDasharray="4 4" />
                <ReferenceLine y={45} stroke={T.amber} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="dmi" name="DMI Score" stroke={T.navy} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Component Waterfall</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={components}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="val" name="Raw Score" fill={T.navyL} radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="contribution" name="Weighted Contribution" radius={[4, 4, 0, 0]}>
                  {components.map((c, i) => <Cell key={i} fill={scoreColor(c.val)} />)}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>DMI Formula: 40% Financial + 40% ESG + 20% Velocity</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {components.map(c => (
              <div key={c.name} style={{ background: T.surfaceH, borderRadius: 6, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{c.name}</div>
                <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: scoreColor(c.val), margin: '8px 0' }}>{fmt1(c.val)}</div>
                <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec }}>Weight: {c.weight}% → Contribution: {fmt1(c.contribution)}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: scoreColor(entity.dmi) }}>
            DMI = {fmt1(entity.dmi)}
          </div>
        </div>
      </>
    );
  };

  /* ==========================================================================
     TAB 6 — ALERT HISTORY
     ========================================================================== */
  const renderAlertHistory = () => {
    const totalAlerts = alertHistory.reduce((a, w) => a + w.INFO + w.WARN + w.CRITICAL + w.EMERGENCY, 0);
    const resolvedRate = +(55 + sr(entity.id * 7 + 1) * 40).toFixed(0);
    return (
      <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Total Alerts (90d)', val: totalAlerts, color: T.navy },
            { label: 'Critical/Emergency', val: alertHistory.reduce((a, w) => a + w.CRITICAL + w.EMERGENCY, 0), color: T.red },
            { label: 'Resolution Rate', val: `${resolvedRate}%`, color: resolvedRate > 70 ? T.green : T.amber },
            { label: 'Current Count', val: entity.alertCount, color: entity.alertCount > 12 ? T.red : T.amber },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>Alert Trend — 12 Weeks (90 Days)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={alertHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Legend />
                <Bar dataKey="INFO" stackId="a" fill={T.teal} />
                <Bar dataKey="WARN" stackId="a" fill={T.amber} />
                <Bar dataKey="CRITICAL" stackId="a" fill={T.red} />
                <Bar dataKey="EMERGENCY" stackId="a" fill="#7c2d12" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Alert Tier Breakdown</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={['INFO', 'WARN', 'CRITICAL', 'EMERGENCY'].map(t => ({
                  name: t,
                  value: alertHistory.reduce((a, w) => a + w[t], 0),
                }))} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {[T.teal, T.amber, T.red, '#7c2d12'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  /* ==========================================================================
     TAB 7 — SCENARIO ANALYSIS
     ========================================================================== */
  const renderScenarioAnalysis = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>PD Shift by NGFS Scenario</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ngfsEntityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="pdShift" name="PD Δ %" radius={[4, 4, 0, 0]}>
                {ngfsEntityData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>VaR Shift by NGFS Scenario</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ngfsEntityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="varShift" name="VaR Δ ($M)" radius={[4, 4, 0, 0]}>
                {ngfsEntityData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Full NGFS Impact Table — {entity.name}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Scenario', 'PD Shift (%)', 'VaR Shift ($M)', 'WACC Δ (bps)', 'Alignment %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {ngfsEntityData.map((d, i) => (
              <tr key={i}>
                <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{NGFS_SCENARIOS[i]}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: d.pdShift > 4 ? T.red : d.pdShift > 2 ? T.amber : T.green }}>+{fmt2(d.pdShift)}%</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtM(d.varShift)}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtBps(d.waccBps)}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: scoreColor(Number(d.alignPct)) }}>{d.alignPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ==========================================================================
     TAB 8 — NLP DISCLOSURES
     ========================================================================== */
  const renderNlpDisclosures = () => {
    const docScores = DISCLOSURES.map((doc, i) => ({
      doc, sentiment: +(entity.nlpSentiment * 0.8 + (-0.3 + sr(entity.id * 17 + i * 7) * 0.6)).toFixed(2),
      quality: +(entity.coveragePct * (0.8 + sr(entity.id * 17 + i * 7 + 3) * 0.4)).toFixed(0),
      topics: Math.floor(5 + sr(entity.id * 17 + i * 7 + 5) * 10),
      greenwash: sr(entity.id * 17 + i * 7 + 9) > 0.70,
    }));
    const topicData = [
      { topic: 'Climate Transition', score: +(40 + sr(entity.id * 7 + 1) * 55).toFixed(0) },
      { topic: 'Net Zero Target', score: +(30 + sr(entity.id * 7 + 3) * 60).toFixed(0) },
      { topic: 'Physical Risk', score: +(25 + sr(entity.id * 7 + 5) * 65).toFixed(0) },
      { topic: 'Governance', score: +(35 + sr(entity.id * 7 + 7) * 55).toFixed(0) },
      { topic: 'Supply Chain', score: +(20 + sr(entity.id * 7 + 9) * 70).toFixed(0) },
      { topic: 'Biodiversity', score: +(15 + sr(entity.id * 7 + 11) * 60).toFixed(0) },
    ];
    return (
      <>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Avg Sentiment', val: fmt2(entity.nlpSentiment), color: entity.nlpSentiment < -0.2 ? T.red : entity.nlpSentiment > 0.2 ? T.green : T.amber },
            { label: 'Disclosure Quality', val: `${entity.coveragePct.toFixed(0)}%`, color: scoreColor(entity.coveragePct) },
            { label: 'Greenwash Flag', val: entity.greenwashFlag ? 'YES' : 'NO', color: entity.greenwashFlag ? T.red : T.green },
            { label: 'Documents Scanned', val: DISCLOSURES.length, color: T.navy },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>Topic Scores</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="topic" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="score" name="Topic Score" radius={[0, 4, 4, 0]}>
                  {topicData.map((e, i) => <Cell key={i} fill={scoreColor(e.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Document Sentiment</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={docScores.map(d => ({ doc: d.doc.split(' ')[0], sentiment: d.sentiment }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="doc" tick={{ fontSize: 9 }} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke={T.borderL} />
                <Tooltip content={<CT />} />
                <Bar dataKey="sentiment" name="Sentiment" radius={[4, 4, 0, 0]}>
                  {docScores.map((e, i) => <Cell key={i} fill={e.sentiment < -0.1 ? T.red : e.sentiment > 0.1 ? T.green : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Document Registry</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Document', 'Sentiment', 'Quality Score', 'Topics', 'Greenwash Flag'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {docScores.map((d, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{d.doc}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, color: d.sentiment < -0.1 ? T.red : d.sentiment > 0.1 ? T.green : T.amber }}>{fmt2(d.sentiment)}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, color: scoreColor(d.quality) }}>{d.quality}%</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{d.topics}</td>
                  <td style={tdS}><span style={badgeS(d.greenwash ? T.red : T.green)}>{d.greenwash ? 'FLAGGED' : 'CLEAN'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  /* ==========================================================================
     TAB 9 — ML MATERIALITY
     ========================================================================== */
  const renderMlMateriality = () => (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'ML Score', val: fmt1(entity.mlScore), color: scoreColor(entity.mlScore) },
          { label: 'Cluster', val: entity.mlCluster, color: entity.mlScore > 75 ? T.red : entity.mlScore > 55 ? T.amber : T.green },
          { label: 'Anomaly Score', val: fmt2(entity.anomalyScore), color: entity.anomalyScore > 0.6 ? T.red : T.amber },
          { label: 'Model Confidence', val: `${fmt0(80 + sr(entity.id * 7 + 1) * 18)}%`, color: T.green },
        ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Feature Contributions</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mlFeatures} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="pct" name="Contribution %" radius={[0, 4, 4, 0]}>
                {mlFeatures.map((f, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>Counterfactual Analysis</div>
          <div style={{ padding: '16px 0' }}>
            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 20, marginBottom: 12 }}>
              <div style={labelS}>Current State</div>
              <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: scoreColor(entity.mlScore) }}>{fmt1(entity.mlScore)}</div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec, marginTop: 4 }}>Cluster: {entity.mlCluster}</div>
            </div>
            <div style={{ background: T.green + '18', border: `1px solid ${T.green}`, borderRadius: 6, padding: 20 }}>
              <div style={labelS}>Improved Counterfactual</div>
              <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: T.green }}>{fmt1(counterfactual.improved)}</div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSec, marginTop: 4 }}>
                Δ: {counterfactual.delta > 0 ? '+' : ''}{fmt1(counterfactual.delta)} · Actions: ESG +15pts, PD -30%, Velocity reduction
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /* ==========================================================================
     TAB 10 — CONTAGION & SYSTEMIC RISK
     ========================================================================== */
  const renderContagion = () => (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'Centrality Score', val: `${(entity.contagionCentrality * 100).toFixed(1)}%`, color: entity.contagionCentrality > 0.6 ? T.red : T.amber },
          { label: 'Direct Links', val: Math.floor(3 + entity.contagionCentrality * 8), color: T.navy },
          { label: 'Indirect Links', val: Math.floor(entity.contagionCentrality * 12), color: T.navy },
          { label: 'Systemic Contribution', val: `${(entity.contagionCentrality * entity.pdConsensus * 100).toFixed(2)}%`, color: T.red },
        ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Exposure Links — Strength Score</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={contagionLinks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 9 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="strength" name="Exposure Strength" radius={[0, 4, 4, 0]}>
                {contagionLinks.map((e, i) => <Cell key={i} fill={e.exposureType === 'Direct' ? T.red : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>Propagation Path</div>
          <div style={{ padding: '12px 0' }}>
            {contagionLinks.slice(0, 5).map((link, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, minWidth: 20 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.navy }}>{link.name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textSec }}>{link.sector} · {link.exposureType}</div>
                </div>
                <span style={badgeS(link.exposureType === 'Direct' ? T.red : T.amber)}>{link.exposureType}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Full Exposure Link Table</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Linked Entity', 'Sector', 'Exposure Type', 'Link Strength', 'PD'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {contagionLinks.map((link, i) => (
              <tr key={i}>
                <td style={{ ...tdS, fontWeight: 600 }}>{link.name}</td>
                <td style={tdS}>{link.sector}</td>
                <td style={tdS}><span style={badgeS(link.exposureType === 'Direct' ? T.red : T.amber)}>{link.exposureType}</span></td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{link.strength.toFixed(1)}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: link.pd > 0.10 ? T.red : link.pd > 0.04 ? T.amber : T.green }}>{fmtPct(link.pd * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ==========================================================================
     TAB 11 — PEER BENCHMARKING
     ========================================================================== */
  const renderPeerBenchmark = () => {
    const benchTableData = BENCH_DIMS.map(d => {
      const allVals = [...peers.map(e => e[d.key]), entity[d.key]].sort((a, b) => a - b);
      const n = allVals.length;
      const p25 = n ? allVals[Math.floor(n * 0.25)] : 0;
      const p75 = n ? allVals[Math.floor(n * 0.75)] : 0;
      const med = n ? allVals[Math.floor(n / 2)] : 0;
      const rank = allVals.indexOf(entity[d.key]) + 1;
      return { dimension: d.label, entity: +entity[d.key].toFixed(1), median: +med.toFixed(1), p25: +p25.toFixed(1), p75: +p75.toFixed(1), rank, total: n };
    });
    return (
      <>
        <div style={{ marginBottom: 12, fontFamily: T.font, fontSize: 13, color: T.textSec }}>
          Benchmarking <strong style={{ color: T.navy }}>{entity.name}</strong> vs {peers.length} sector peers in <strong>{entity.sector}</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>Radar — Entity vs Sector Median</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarBenchData}>
                <PolarGrid stroke={T.borderL} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name={entity.name.split(' ')[0]} dataKey="entity" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                <Radar name="Sector Median" dataKey="median" stroke={T.gold} fill={T.gold} fillOpacity={0.10} strokeDasharray="5 3" />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Percentile Band Chart</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={benchTableData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="dimension" type="category" width={90} tick={{ fontSize: 9 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="p25" name="P25" fill={T.borderL} stackId="band" radius={[0, 0, 0, 0]} />
                <Bar dataKey="median" name="Median" fill={T.gold} stackId="single" radius={[0, 4, 4, 0]} />
                <Scatter data={benchTableData.map(d => ({ dimension: d.dimension, entity: d.entity }))} dataKey="entity" fill={T.red} name="Entity" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Benchmark Detail Table</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Dimension', 'Entity', 'P25', 'Median', 'P75', 'Rank', 'vs Median'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {benchTableData.map((row, i) => {
                const delta = row.entity - row.median;
                return (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{row.dimension}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontWeight: 700, color: scoreColor(row.entity) }}>{row.entity}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{row.p25}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{row.median}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{row.p75}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{row.rank} / {row.total}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: delta >= 0 ? T.green : T.red }}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  /* ==========================================================================
     ROOT RENDER
     ========================================================================== */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20, borderBottom: `3px solid ${T.gold}`, paddingBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 2 }}>EP-U2 · DME SUITE</div>
              <h1 style={{ fontFamily: T.font, fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Entity DME Deep Dive</h1>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textSec, marginTop: 2 }}>
                Full risk profile · 4-Branch PD · IFRS 9 · VaR · WACC · Contagion · Peer Benchmark
              </p>
            </div>
            <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
              <div>ENTITY: <span style={{ color: T.navy, fontWeight: 700 }}>{entity.name}</span></div>
              <div>SECTOR: <span style={{ color: T.navy }}>{entity.sector}</span></div>
              <div>REGIME: <span style={{ color: regimeColor(entity.regime), fontWeight: 700 }}>{entity.regime}</span></div>
            </div>
          </div>
        </div>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 8 }}>
          {TABS.map((t, i) => (
            <button key={i} style={btnS(tab === i)} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
        {/* Tab Content */}
        {tab === 0 && renderEntitySummary()}
        {tab === 1 && renderPdAnalysis()}
        {tab === 2 && renderIfrs9()}
        {tab === 3 && renderVarCvar()}
        {tab === 4 && renderWacc()}
        {tab === 5 && renderDmiScore()}
        {tab === 6 && renderAlertHistory()}
        {tab === 7 && renderScenarioAnalysis()}
        {tab === 8 && renderNlpDisclosures()}
        {tab === 9 && renderMlMateriality()}
        {tab === 10 && renderContagion()}
        {tab === 11 && renderPeerBenchmark()}
      </div>
    </div>
  );
}
