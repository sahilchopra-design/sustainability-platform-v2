import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart, ScatterChart, Scatter, ReferenceLine,
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
const ALERT_COLORS = { INFO: T.teal, WARN: T.amber, CRITICAL: T.red, EMERGENCY: '#7c2d12' };

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
const alertColor = (a) => ALERT_COLORS[a] || T.textMut;

/* Normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return 0.5 * (1.0 + sign * y);
}

/* ==========================================================================
   SECTOR COEFFICIENTS
   ========================================================================== */
const SECTOR_COEFF = {
  Energy:       { alphaT: 0.18, baseVol: 0.35, haircut: 0.25, lgd: 0.55 },
  Materials:    { alphaT: 0.14, baseVol: 0.28, haircut: 0.18, lgd: 0.48 },
  Utilities:    { alphaT: 0.15, baseVol: 0.22, haircut: 0.20, lgd: 0.45 },
  Industrials:  { alphaT: 0.10, baseVol: 0.25, haircut: 0.12, lgd: 0.42 },
  Financials:   { alphaT: 0.09, baseVol: 0.24, haircut: 0.10, lgd: 0.50 },
  Technology:   { alphaT: 0.07, baseVol: 0.32, haircut: 0.05, lgd: 0.35 },
  Healthcare:   { alphaT: 0.06, baseVol: 0.22, haircut: 0.06, lgd: 0.38 },
  Consumer:     { alphaT: 0.08, baseVol: 0.26, haircut: 0.08, lgd: 0.40 },
  'Real Estate':{ alphaT: 0.12, baseVol: 0.20, haircut: 0.15, lgd: 0.52 },
  Comms:        { alphaT: 0.06, baseVol: 0.26, haircut: 0.06, lgd: 0.38 },
};
const DEF_COEFF = { alphaT: 0.08, baseVol: 0.25, haircut: 0.10, lgd: 0.42 };

/* ==========================================================================
   GENERATE 40 ENTITIES WITH FULL DME PROFILES
   ========================================================================== */
const SECTORS = ['Energy', 'Materials', 'Utilities', 'Industrials', 'Financials', 'Technology', 'Healthcare', 'Consumer', 'Real Estate', 'Comms'];
const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Middle East', 'Africa'];
const REGIMES = ['Normal', 'Elevated', 'Critical', 'Extreme'];
const ALERT_TIERS = ['INFO', 'WARN', 'CRITICAL', 'EMERGENCY'];
const PILLARS = ['Financial', 'ESG', 'Regulatory', 'Market', 'Credit'];
const NGFS_SCENARIOS = ['Orderly 1.5°C', 'Disorderly 1.8°C', 'Hot House 3.0°C', 'Delayed Trans.', 'Divergent NZ', 'Too Little Too Late'];
const MODULES = ['Risk Engine', 'Entity Profiler', 'Scenario Engine', 'Alert Engine', 'Contagion Map', 'Portfolio Mgr', 'Competitive Intel', 'NLP Sentiment', 'ML Materiality', 'NGFS Scenarios'];

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

function generateEntities() {
  return COMPANY_NAMES.map((name, i) => {
    const s = (k) => sr(hashStr(name) % 9973 + i * 37 + k);
    const sector = SECTORS[i % SECTORS.length];
    const coeff = SECTOR_COEFF[sector] || DEF_COEFF;
    const pdBase = 0.01 + s(3) * 0.12;
    const velocityT = -0.3 + s(7) * 0.6;
    const pdExp = clamp(pdBase * Math.exp(coeff.alphaT * velocityT), 0.001, 0.85);
    const assetV = 500 + s(11) * 4500;
    const debt = assetV * (0.2 + s(13) * 0.6);
    const vol = coeff.baseVol + s(17) * 0.1;
    const d1 = (Math.log(assetV * (1 - coeff.haircut) / debt) + (0.04 + 0.5 * vol * vol) * 1) / (vol * 1);
    const d2 = d1 - vol;
    const pdMerton = clamp(normalCDF(-d2), 0.001, 0.90);
    const pdConsensus = (pdExp * 0.35 + pdMerton * 0.35 + (pdBase * (1 + s(19) * 0.5)) * 0.30);
    const zScore = s(23) * 4.2;
    const regime = zScore <= 1.0 ? 'Normal' : zScore <= 2.0 ? 'Elevated' : zScore <= 3.0 ? 'Critical' : 'Extreme';
    const esgScore = 20 + s(29) * 70;
    const envScore = 20 + s(31) * 70;
    const socScore = 20 + s(37) * 70;
    const govScore = 20 + s(41) * 70;
    const dmi = esgScore * 0.40 + (100 - pdConsensus * 300) * 0.40 + (50 + s(43) * 50) * 0.20;
    const var95 = assetV * (0.03 + s(47) * 0.12);
    const var99 = var95 * (1.15 + s(53) * 0.25);
    const cvar = var99 * (1.1 + s(59) * 0.2);
    const wacc = 0.05 + s(61) * 0.12;
    const alertCount = Math.floor(s(67) * 18);
    const nlpSentiment = -1 + s(71) * 2;
    const mlScore = 20 + s(73) * 75;
    const contagionCentrality = s(79) * 0.85;
    const coverage = 60 + s(83) * 40;
    const stage = pdConsensus < 0.03 ? 'S1' : pdConsensus < 0.15 ? 'S2' : 'S3';
    return {
      id: i, name, sector, region: REGIONS[Math.floor(s(89) * REGIONS.length)],
      pdBase, pdExp, pdMerton, pdConsensus: clamp(pdConsensus, 0.001, 0.90),
      zScore, regime, esgScore, envScore, socScore, govScore,
      dmi: clamp(dmi, 10, 95), var95, var99, cvar,
      wacc: wacc * 100, alertCount, nlpSentiment, mlScore,
      contagionCentrality, coverage, stage,
      assetValue: assetV, totalDebt: debt, volatility: vol,
      lcr: 80 + s(91) * 80, nsfr: 90 + s(97) * 60,
      greenwashFlag: s(101) > 0.72,
    };
  });
}

const ENTITIES = generateEntities();

/* ==========================================================================
   GENERATE MONTHLY ALERT TREND (12 months)
   ========================================================================== */
const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
const alertTrendData = MONTHS.map((m, i) => ({
  month: m,
  INFO:      Math.floor(12 + sr(i * 7 + 1) * 20),
  WARN:      Math.floor(6  + sr(i * 7 + 3) * 14),
  CRITICAL:  Math.floor(2  + sr(i * 7 + 5) * 8),
  EMERGENCY: Math.floor(sr(i * 7 + 9) * 3),
}));

const regimeTrendData = MONTHS.map((m, i) => ({
  month: m,
  Normal:   Math.floor(15 + sr(i * 11 + 1) * 10),
  Elevated: Math.floor(10 + sr(i * 11 + 3) * 10),
  Critical: Math.floor(4  + sr(i * 11 + 5) * 8),
  Extreme:  Math.floor(sr(i * 11 + 9) * 5),
}));

/* ==========================================================================
   NGFS SCENARIO IMPACT DATA
   ========================================================================== */
const ngfsImpactData = NGFS_SCENARIOS.map((sc, i) => ({
  scenario: sc.length > 18 ? sc.slice(0, 16) + '..' : sc,
  pdChange: +(0.5 + sr(i * 13 + 1) * 8.5).toFixed(2),
  varShift: +(3 + sr(i * 13 + 3) * 22).toFixed(1),
  alignPct: +(20 + sr(i * 13 + 5) * 65).toFixed(1),
  waccBps:  Math.floor(15 + sr(i * 13 + 7) * 120),
}));

/* ==========================================================================
   CONTAGION HUB DATA
   ========================================================================== */
const contagionHubs = [...ENTITIES]
  .sort((a, b) => b.contagionCentrality - a.contagionCentrality)
  .slice(0, 5)
  .map((e) => ({
    name: e.name.split(' ')[0],
    centrality: +(e.contagionCentrality * 100).toFixed(1),
    links: Math.floor(3 + e.contagionCentrality * 12),
    sector: e.sector,
  }));

/* ==========================================================================
   STYLES
   ========================================================================== */
const cardS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 };
const kpiBoxS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, textAlign: 'center', flex: 1, minWidth: 130 };
const kpiVal = { fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: T.navy };
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

/* ==========================================================================
   TABS
   ========================================================================== */
const TABS = [
  'Overview', 'Regime Dashboard', 'Alert Summary', 'PD Intelligence',
  'Financial Risk', 'NLP & Sentiment', 'ML Materiality', 'NGFS Scenarios',
  'Contagion Risk', 'Module Health',
];

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function DmeDashboardPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const filtered = useMemo(() => {
    let d = ENTITIES;
    if (sectorFilter !== 'All') d = d.filter(e => e.sector === sectorFilter);
    if (regionFilter !== 'All') d = d.filter(e => e.region === regionFilter);
    return d;
  }, [sectorFilter, regionFilter]);

  /* ---- Portfolio-level KPIs ---- */
  const kpis = useMemo(() => {
    const n = filtered.length;
    if (!n) return { avgDmi: 0, critPct: 0, alertTotal: 0, avgPd: 0, avgVar95: 0, avgWacc: 0, avgSentiment: 0, avgMl: 0 };
    const avgDmi = filtered.reduce((a, e) => a + e.dmi, 0) / n;
    const critPct = (filtered.filter(e => e.regime === 'Critical' || e.regime === 'Extreme').length / n) * 100;
    const alertTotal = filtered.reduce((a, e) => a + e.alertCount, 0);
    const avgPd = filtered.reduce((a, e) => a + e.pdConsensus, 0) / n;
    const avgVar95 = filtered.reduce((a, e) => a + e.var95, 0) / n;
    const avgWacc = filtered.reduce((a, e) => a + e.wacc, 0) / n;
    const avgSentiment = filtered.reduce((a, e) => a + e.nlpSentiment, 0) / n;
    const avgMl = filtered.reduce((a, e) => a + e.mlScore, 0) / n;
    return { avgDmi, critPct, alertTotal, avgPd, avgVar95, avgWacc, avgSentiment, avgMl };
  }, [filtered]);

  /* ---- Sector heat-map ---- */
  const sectorHeat = useMemo(() => {
    const m = {};
    filtered.forEach(e => {
      if (!m[e.sector]) m[e.sector] = { sector: e.sector, count: 0, dmi: 0, pd: 0, var95: 0 };
      m[e.sector].count++;
      m[e.sector].dmi += e.dmi;
      m[e.sector].pd += e.pdConsensus;
      m[e.sector].var95 += e.var95;
    });
    return Object.values(m).map(s => ({
      ...s,
      avgDmi: s.count ? s.dmi / s.count : 0,
      avgPd: s.count ? (s.pd / s.count) * 100 : 0,
      avgVar95: s.count ? s.var95 / s.count : 0,
    }));
  }, [filtered]);

  /* ---- Top 5 risk entities ---- */
  const top5 = useMemo(() => [...filtered].sort((a, b) => b.pdConsensus - a.pdConsensus).slice(0, 5), [filtered]);

  /* ---- Regime distribution ---- */
  const regimeDist = useMemo(() => {
    const n = filtered.length;
    return REGIMES.map(r => ({
      regime: r,
      count: filtered.filter(e => e.regime === r).length,
      pct: n ? (filtered.filter(e => e.regime === r).length / n * 100) : 0,
    }));
  }, [filtered]);

  /* ---- Regime transition matrix ---- */
  const transMatrix = useMemo(() => {
    return REGIMES.map((from, fi) =>
      REGIMES.map((to, ti) => {
        const v = sr(fi * 4 + ti + 7);
        if (fi === ti) return +(45 + v * 35).toFixed(0);
        const diff = Math.abs(fi - ti);
        return +(diff === 1 ? 15 + v * 20 : 2 + v * 10).toFixed(0);
      })
    );
  }, []);

  /* ---- Alert breakdown ---- */
  const alertBreakdown = useMemo(() => {
    const n = filtered.length || 1;
    return ALERT_TIERS.map((tier, i) => ({
      tier,
      count: filtered.reduce((a, e) => a + Math.floor(e.alertCount * sr(e.id * 7 + i * 3 + 1) * 0.5), 0),
    }));
  }, [filtered]);

  const pillarBreakdown = useMemo(() => {
    return PILLARS.map((p, i) => ({
      pillar: p,
      count: filtered.reduce((a, e) => a + Math.floor(e.alertCount * sr(e.id * 11 + i * 5 + 3) * 0.4), 0),
    }));
  }, [filtered]);

  /* ---- IFRS 9 stage allocation ---- */
  const stageAlloc = useMemo(() => ({
    S1: filtered.filter(e => e.stage === 'S1').length,
    S2: filtered.filter(e => e.stage === 'S2').length,
    S3: filtered.filter(e => e.stage === 'S3').length,
  }), [filtered]);

  /* ---- PD distribution buckets ---- */
  const pdBuckets = useMemo(() => {
    const buckets = [
      { label: '0-2%', min: 0, max: 0.02 },
      { label: '2-5%', min: 0.02, max: 0.05 },
      { label: '5-10%', min: 0.05, max: 0.10 },
      { label: '10-20%', min: 0.10, max: 0.20 },
      { label: '>20%', min: 0.20, max: 1 },
    ];
    return buckets.map(b => ({
      ...b,
      count: filtered.filter(e => e.pdConsensus >= b.min && e.pdConsensus < b.max).length,
    }));
  }, [filtered]);

  /* ---- Z-score heatmap by sector ---- */
  const zHeatBySector = useMemo(() => {
    const m = {};
    filtered.forEach(e => {
      if (!m[e.sector]) m[e.sector] = { sector: e.sector, zSum: 0, count: 0 };
      m[e.sector].zSum += e.zScore;
      m[e.sector].count++;
    });
    return Object.values(m).map(s => ({ sector: s.sector.length > 10 ? s.sector.slice(0, 10) : s.sector, avgZ: s.count ? s.zSum / s.count : 0 }));
  }, [filtered]);

  /* ---- NLP sector sentiment ---- */
  const sectorSentiment = useMemo(() => {
    const m = {};
    filtered.forEach(e => {
      if (!m[e.sector]) m[e.sector] = { sector: e.sector, sum: 0, count: 0 };
      m[e.sector].sum += e.nlpSentiment;
      m[e.sector].count++;
    });
    return Object.values(m).map(s => ({ sector: s.sector.length > 10 ? s.sector.slice(0, 10) : s.sector, sentiment: s.count ? +(s.sum / s.count).toFixed(2) : 0 }));
  }, [filtered]);

  /* ---- ML cluster distribution ---- */
  const mlClusters = useMemo(() => {
    const clusters = ['Low Risk', 'Moderate', 'Elevated', 'High Risk', 'Anomaly'];
    return clusters.map((c, i) => ({
      cluster: c,
      count: filtered.filter(e => {
        const band = Math.floor(e.mlScore / 20);
        return band === i || (i === 4 && band >= 5);
      }).length,
    }));
  }, [filtered]);

  /* ---- Module health ---- */
  const moduleHealth = useMemo(() => {
    return MODULES.map((m, i) => {
      const staleness = Math.floor(sr(i * 13 + 1) * 48);
      const coverage = 60 + sr(i * 13 + 3) * 39;
      const status = staleness > 36 ? 'WARNING' : staleness > 42 ? 'ERROR' : 'OK';
      return { module: m, lastRefresh: `${staleness}h ago`, staleness, coverage: +coverage.toFixed(0), modelVersion: `v${1 + i % 3}.${Math.floor(sr(i * 13 + 7) * 9)}.0`, status };
    });
  }, []);

  /* ---- NGFS radar data ---- */
  const ngfsRadarData = useMemo(() => {
    return ngfsImpactData.map(d => ({ subject: d.scenario, pdChange: d.pdChange, varShift: d.varShift / 3, waccBps: d.waccBps / 15, alignPct: d.alignPct }));
  }, []);

  /* ---- SHARED FILTER BAR ---- */
  const renderFilters = () => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      <select style={{ fontFamily: T.mono, fontSize: 12, padding: '7px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, color: T.text }}
        value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
        <option value="All">All Sectors</option>
        {SECTORS.map(s => <option key={s}>{s}</option>)}
      </select>
      <select style={{ fontFamily: T.mono, fontSize: 12, padding: '7px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, color: T.text }}
        value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
        <option value="All">All Regions</option>
        {REGIONS.map(r => <option key={r}>{r}</option>)}
      </select>
      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMut, alignSelf: 'center' }}>
        {filtered.length} / {ENTITIES.length} entities
      </span>
    </div>
  );

  /* ---- KPI STRIP ---- */
  const renderKPIs = () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      {[
        { label: 'Avg DMI Score', val: fmt1(kpis.avgDmi), color: scoreColor(kpis.avgDmi) },
        { label: 'Crit/Extreme %', val: `${fmt1(kpis.critPct)}%`, color: kpis.critPct > 25 ? T.red : T.amber },
        { label: 'Total Alerts', val: fmt0(kpis.alertTotal), color: T.navy },
        { label: 'Wtd Avg PD', val: fmtPct(kpis.avgPd * 100), color: kpis.avgPd > 0.10 ? T.red : kpis.avgPd > 0.04 ? T.amber : T.green },
        { label: 'Avg VaR 95%', val: fmtM(kpis.avgVar95), color: T.navy },
        { label: 'Avg WACC', val: `${fmt2(kpis.avgWacc)}%`, color: T.navy },
        { label: 'NLP Sentiment', val: fmt2(kpis.avgSentiment), color: kpis.avgSentiment < -0.2 ? T.red : kpis.avgSentiment > 0.2 ? T.green : T.amber },
        { label: 'ML Mat. Score', val: fmt1(kpis.avgMl), color: scoreColor(kpis.avgMl) },
      ].map((k, i) => (
        <div key={i} style={kpiBoxS}>
          <div style={{ ...kpiVal, fontSize: 22, color: k.color }}>{k.val}</div>
          <div style={kpiLab}>{k.label}</div>
        </div>
      ))}
    </div>
  );

  /* ============================================================
     TAB 0 — OVERVIEW
     ============================================================ */
  const renderOverview = () => (
    <>
      {renderFilters()}
      {renderKPIs()}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Sector Risk Heat-Map — Avg DMI Score</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorHeat}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="avgDmi" name="Avg DMI" radius={[4, 4, 0, 0]}>
                {sectorHeat.map((e, i) => <Cell key={i} fill={scoreColor(e.avgDmi)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>Regime Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={regimeDist} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="count" label={({ regime, pct }) => `${regime} ${pct.toFixed(0)}%`}>
                {regimeDist.map((e, i) => <Cell key={i} fill={REGIME_COLORS[e.regime]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Top 5 Highest-PD Entities</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Entity', 'Sector', 'Region', 'PD Consensus', 'Regime', 'DMI Score', 'VaR 95%', 'IFRS 9 Stage'].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top5.map(e => (
              <tr key={e.id}>
                <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{e.name}</td>
                <td style={tdS}>{e.sector}</td>
                <td style={tdS}>{e.region}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: e.pdConsensus > 0.1 ? T.red : T.amber }}>{fmtPct(e.pdConsensus * 100)}</td>
                <td style={tdS}><span style={badgeS(regimeColor(e.regime))}>{e.regime}</span></td>
                <td style={{ ...tdS, fontFamily: T.mono, color: scoreColor(e.dmi) }}>{fmt1(e.dmi)}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtM(e.var95)}</td>
                <td style={tdS}><span style={badgeS(e.stage === 'S3' ? T.red : e.stage === 'S2' ? T.amber : T.green)}>{e.stage}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ============================================================
     TAB 1 — REGIME DASHBOARD
     ============================================================ */
  const renderRegimeDashboard = () => (
    <>
      {renderFilters()}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Regime Distribution — Current</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regimeDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="regime" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" name="Entities" radius={[0, 4, 4, 0]}>
                {regimeDist.map((e, i) => <Cell key={i} fill={REGIME_COLORS[e.regime]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>Regime History — 12 Months</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={regimeTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Legend />
              <Area type="monotone" dataKey="Normal" stackId="1" stroke={T.green} fill={T.green} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Elevated" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Critical" stackId="1" stroke={T.red} fill={T.red} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Extreme" stackId="1" stroke="#7c2d12" fill="#7c2d12" fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Regime Transition Matrix (%) — Probability of Moving From Row → Column</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thS}>From \ To</th>
                {REGIMES.map(r => <th key={r} style={{ ...thS, color: REGIME_COLORS[r] }}>{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {REGIMES.map((from, fi) => (
                <tr key={from}>
                  <td style={{ ...tdS, fontWeight: 700, color: REGIME_COLORS[from] }}>{from}</td>
                  {transMatrix[fi].map((p, ti) => (
                    <td key={ti} style={{ ...tdS, fontFamily: T.mono, background: fi === ti ? T.surfaceH : 'transparent', fontWeight: fi === ti ? 700 : 400 }}>{p}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Z-Score by Sector (Avg)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={zHeatBySector}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CT />} />
            <ReferenceLine y={1} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Elevated', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={2} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Critical', position: 'right', fontSize: 10 }} />
            <Bar dataKey="avgZ" name="Avg Z-Score" radius={[4, 4, 0, 0]}>
              {zHeatBySector.map((e, i) => <Cell key={i} fill={e.avgZ > 2 ? T.red : e.avgZ > 1 ? T.amber : T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  /* ============================================================
     TAB 2 — ALERT SUMMARY
     ============================================================ */
  const renderAlertSummary = () => (
    <>
      {renderFilters()}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {alertBreakdown.map(a => (
          <div key={a.tier} style={{ ...kpiBoxS, borderLeft: `4px solid ${alertColor(a.tier)}` }}>
            <div style={{ ...kpiVal, color: alertColor(a.tier) }}>{a.count}</div>
            <div style={kpiLab}>{a.tier}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Alert Trend — 12 Months</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alertTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
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
          <div style={labelS}>5-Pillar Alert Breakdown</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pillarBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="pillar" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" name="Alerts" radius={[0, 4, 4, 0]}>
                {pillarBreakdown.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>All Entities — Alert Overview</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Entity', 'Sector', 'Alert Count', 'Regime', 'PD', 'Greenwash Flag'].map(h => <th key={h} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.alertCount - a.alertCount).slice(0, 12).map(e => (
                <tr key={e.id}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, color: e.alertCount > 12 ? T.red : e.alertCount > 7 ? T.amber : T.green }}>{e.alertCount}</td>
                  <td style={tdS}><span style={badgeS(regimeColor(e.regime))}>{e.regime}</span></td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{fmtPct(e.pdConsensus * 100)}</td>
                  <td style={tdS}><span style={badgeS(e.greenwashFlag ? T.red : T.green)}>{e.greenwashFlag ? 'FLAGGED' : 'CLEAN'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* ============================================================
     TAB 3 — PD INTELLIGENCE
     ============================================================ */
  const renderPdIntelligence = () => (
    <>
      {renderFilters()}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'Stage 1 (S1)', val: stageAlloc.S1, color: T.green },
          { label: 'Stage 2 (S2)', val: stageAlloc.S2, color: T.amber },
          { label: 'Stage 3 (S3)', val: stageAlloc.S3, color: T.red },
          { label: 'Avg PD (Consensus)', val: fmtPct(kpis.avgPd * 100), color: T.navy },
        ].map((k, i) => (
          <div key={i} style={kpiBoxS}>
            <div style={{ ...kpiVal, color: k.color }}>{k.val}</div>
            <div style={kpiLab}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>PD Distribution — Bucket Count</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pdBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                {pdBuckets.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>IFRS 9 Stage Allocation</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={[{ name: 'S1', value: stageAlloc.S1 }, { name: 'S2', value: stageAlloc.S2 }, { name: 'S3', value: stageAlloc.S3 }]}
                cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill={T.green} />
                <Cell fill={T.amber} />
                <Cell fill={T.red} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>PD Detail — 4-Branch Comparison (Top 10 by Consensus PD)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Entity', 'Sector', 'PD Exponential', 'PD Merton-DD', 'PD Consensus', 'Z-Score', 'Regime', 'IFRS 9'].map(h => <th key={h} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.pdConsensus - a.pdConsensus).slice(0, 10).map(e => (
                <tr key={e.id}>
                  <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{fmtPct(e.pdExp * 100)}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{fmtPct(e.pdMerton * 100)}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, fontWeight: 700, color: e.pdConsensus > 0.10 ? T.red : e.pdConsensus > 0.04 ? T.amber : T.green }}>{fmtPct(e.pdConsensus * 100)}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{fmt2(e.zScore)}</td>
                  <td style={tdS}><span style={badgeS(regimeColor(e.regime))}>{e.regime}</span></td>
                  <td style={tdS}><span style={badgeS(e.stage === 'S3' ? T.red : e.stage === 'S2' ? T.amber : T.green)}>{e.stage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* ============================================================
     TAB 4 — FINANCIAL RISK SNAPSHOT
     ============================================================ */
  const renderFinancialRisk = () => {
    const varData = [...filtered].sort((a, b) => b.var95 - a.var95).slice(0, 10).map(e => ({
      name: e.name.split(' ')[0],
      var95: +e.var95.toFixed(1),
      var99: +e.var99.toFixed(1),
      cvar: +e.cvar.toFixed(1),
    }));
    const waccData = [...filtered].map(e => ({ name: e.name.split(' ')[0], wacc: +e.wacc.toFixed(2) })).sort((a, b) => b.wacc - a.wacc).slice(0, 10);
    const liqData = [...filtered].slice(0, 8).map(e => ({ name: e.name.split(' ')[0], lcr: +e.lcr.toFixed(0), nsfr: +e.nsfr.toFixed(0) }));
    return (
      <>
        {renderFilters()}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>VaR 95% / 99% / CVaR — Top 10 Entities by VaR</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={varData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Legend />
                <Bar dataKey="var95" name="VaR 95%" fill={T.navyL} radius={[4, 4, 0, 0]} />
                <Bar dataKey="var99" name="VaR 99%" fill={T.amber} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cvar" name="CVaR" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Liquidity — LCR vs NSFR</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="lcr" name="LCR %" tick={{ fontSize: 10 }} label={{ value: 'LCR%', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="nsfr" name="NSFR %" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>{d?.name}</div>
                    <div>LCR: {d?.lcr}% | NSFR: {d?.nsfr}%</div>
                  </div>;
                }} />
                <Scatter data={liqData} fill={T.navy} />
                <ReferenceLine x={100} stroke={T.amber} strokeDasharray="4 4" />
                <ReferenceLine y={100} stroke={T.amber} strokeDasharray="4 4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>WACC — Top 10 by Adjusted WACC</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waccData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 'auto']} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="wacc" name="WACC%" fill={T.gold} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  };

  /* ============================================================
     TAB 5 — NLP & SENTIMENT
     ============================================================ */
  const renderNlpSentiment = () => {
    const keywords = [
      'climate transition', 'stranded assets', 'greenwashing', 'scope 3 emissions',
      'regulatory penalty', 'biodiversity', 'water stress', 'carbon pricing',
      'TCFD disclosure', 'net zero target', 'social license', 'supply chain risk',
    ].map((k, i) => ({ keyword: k, score: +(0.3 + sr(i * 17 + 3) * 0.7).toFixed(2), trend: sr(i * 17 + 7) > 0.5 ? 'Rising' : 'Stable' }));
    const disclosureQuality = sectorHeat.map(s => ({ sector: s.sector.length > 10 ? s.sector.slice(0, 10) : s.sector, quality: +(50 + sr(hashStr(s.sector) % 997 + 1) * 45).toFixed(0) }));
    const gwRate = filtered.length ? (filtered.filter(e => e.greenwashFlag).length / filtered.length * 100) : 0;
    return (
      <>
        {renderFilters()}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Avg Sentiment', val: fmt2(kpis.avgSentiment), color: kpis.avgSentiment < 0 ? T.red : T.green },
            { label: 'Greenwash Flag Rate', val: `${gwRate.toFixed(0)}%`, color: gwRate > 30 ? T.red : T.amber },
            { label: 'Negative Entities', val: filtered.filter(e => e.nlpSentiment < -0.2).length, color: T.red },
            { label: 'Positive Entities', val: filtered.filter(e => e.nlpSentiment > 0.2).length, color: T.green },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>NLP Sentiment by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorSentiment}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <ReferenceLine y={0} stroke={T.borderL} />
                <Bar dataKey="sentiment" name="Sentiment" radius={[4, 4, 0, 0]}>
                  {sectorSentiment.map((e, i) => <Cell key={i} fill={e.sentiment < -0.1 ? T.red : e.sentiment > 0.1 ? T.green : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Disclosure Quality by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={disclosureQuality} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="sector" type="category" width={90} tick={{ fontSize: 10 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="quality" name="Quality Score" radius={[0, 4, 4, 0]}>
                  {disclosureQuality.map((e, i) => <Cell key={i} fill={scoreColor(e.quality)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Emerging Risk Keywords</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {keywords.map((k, i) => (
              <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.borderL}`, borderRadius: 6, padding: '8px 14px' }}>
                <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.navy }}>{k.keyword}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>Relevance: {k.score} · <span style={{ color: k.trend === 'Rising' ? T.red : T.green }}>{k.trend}</span></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  /* ============================================================
     TAB 6 — ML MATERIALITY
     ============================================================ */
  const renderMlMateriality = () => {
    const top5ml = [...filtered].sort((a, b) => b.mlScore - a.mlScore).slice(0, 5);
    const anomalies = filtered.filter(e => e.mlScore > 85).length;
    return (
      <>
        {renderFilters()}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Avg ML Score', val: fmt1(kpis.avgMl), color: scoreColor(kpis.avgMl) },
            { label: 'Anomaly Count', val: anomalies, color: anomalies > 5 ? T.red : T.amber },
            { label: 'High-Mat. (>75)', val: filtered.filter(e => e.mlScore > 75).length, color: T.red },
            { label: 'Model Confidence', val: '87.3%', color: T.green },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>ML Cluster Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={mlClusters} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="count" label={({ cluster, percent }) => `${cluster} ${(percent * 100).toFixed(0)}%`}>
                  {mlClusters.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>ML Score Distribution — All Entities</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { range: '0-20', count: filtered.filter(e => e.mlScore < 20).length },
                { range: '20-40', count: filtered.filter(e => e.mlScore >= 20 && e.mlScore < 40).length },
                { range: '40-60', count: filtered.filter(e => e.mlScore >= 40 && e.mlScore < 60).length },
                { range: '60-80', count: filtered.filter(e => e.mlScore >= 60 && e.mlScore < 80).length },
                { range: '80-100', count: filtered.filter(e => e.mlScore >= 80).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                  {[T.green, T.sageL, T.amber, T.gold, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Top 5 High-Materiality Entities</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Entity', 'Sector', 'ML Score', 'Cluster', 'Regime', 'Anomaly Score', 'Confidence'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {top5ml.map(e => (
                <tr key={e.id}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{e.name}</td>
                  <td style={tdS}>{e.sector}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, color: scoreColor(e.mlScore), fontWeight: 700 }}>{fmt1(e.mlScore)}</td>
                  <td style={tdS}><span style={badgeS(e.mlScore > 75 ? T.red : e.mlScore > 50 ? T.amber : T.green)}>{e.mlScore > 75 ? 'High Risk' : e.mlScore > 50 ? 'Elevated' : 'Moderate'}</span></td>
                  <td style={tdS}><span style={badgeS(regimeColor(e.regime))}>{e.regime}</span></td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{fmt2(e.zScore / 4)}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{fmt0(80 + sr(e.id * 7 + 1) * 18)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  /* ============================================================
     TAB 7 — NGFS SCENARIOS
     ============================================================ */
  const renderNgfsScenarios = () => (
    <>
      {renderFilters()}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>PD Change by NGFS Scenario (%)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ngfsImpactData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="pdChange" name="PD Δ %" radius={[4, 4, 0, 0]}>
                {ngfsImpactData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>NGFS Multi-Metric Radar</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={[
              { axis: 'PD Δ', ...Object.fromEntries(ngfsImpactData.map(d => [d.scenario.slice(0, 10), d.pdChange])) },
              { axis: 'VaR Shift', ...Object.fromEntries(ngfsImpactData.map(d => [d.scenario.slice(0, 10), d.varShift / 3])) },
              { axis: 'WACC bps', ...Object.fromEntries(ngfsImpactData.map(d => [d.scenario.slice(0, 10), d.waccBps / 15])) },
              { axis: 'Align %', ...Object.fromEntries(ngfsImpactData.map(d => [d.scenario.slice(0, 10), d.alignPct / 7])) },
            ]}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              {ngfsImpactData.slice(0, 4).map((d, i) => (
                <Radar key={i} name={d.scenario.slice(0, 12)} dataKey={d.scenario.slice(0, 10)} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Full NGFS Impact Table</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Scenario', 'Portfolio PD Δ (%)', 'VaR Shift ($M)', 'WACC Δ (bps)', 'Alignment %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {ngfsImpactData.map((d, i) => (
              <tr key={i}>
                <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{NGFS_SCENARIOS[i]}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: d.pdChange > 5 ? T.red : d.pdChange > 2 ? T.amber : T.green }}>+{fmt2(d.pdChange)}%</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtM(d.varShift)}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{fmtBps(d.waccBps)}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: scoreColor(d.alignPct) }}>{fmt1(d.alignPct)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ============================================================
     TAB 8 — CONTAGION RISK MAP
     ============================================================ */
  const renderContagionRisk = () => {
    const propVelocity = +(0.3 + sr(17) * 0.5).toFixed(2);
    const sysRiskIdx = +(filtered.reduce((a, e) => a + e.contagionCentrality, 0) / (filtered.length || 1) * 100).toFixed(1);
    const contagionByRegime = REGIMES.map(r => ({
      regime: r,
      avgCentrality: +(filtered.filter(e => e.regime === r).reduce((a, e) => a + e.contagionCentrality, 0) / (filtered.filter(e => e.regime === r).length || 1) * 100).toFixed(1),
    }));
    return (
      <>
        {renderFilters()}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Systemic Risk Index', val: `${sysRiskIdx}`, color: sysRiskIdx > 50 ? T.red : T.amber },
            { label: 'Propagation Velocity', val: propVelocity, color: T.navy },
            { label: 'High Centrality (>60)', val: filtered.filter(e => e.contagionCentrality > 0.6).length, color: T.red },
            { label: 'Contagion Hubs', val: contagionHubs.length, color: T.amber },
          ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardS}>
            <div style={labelS}>Top 5 Contagion Hubs — Centrality Score</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={contagionHubs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="centrality" name="Centrality Score" radius={[0, 4, 4, 0]}>
                  {contagionHubs.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={labelS}>Avg Centrality by Regime</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={contagionByRegime}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="regime" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="avgCentrality" name="Avg Centrality" radius={[4, 4, 0, 0]}>
                  {contagionByRegime.map((e, i) => <Cell key={i} fill={REGIME_COLORS[e.regime]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cardS}>
          <div style={labelS}>Full Contagion Profile — Top 15 by Centrality</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Entity', 'Sector', 'Centrality Score', 'Direct Links', 'Regime', 'PD Consensus', 'Systemic Contribution'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {[...filtered].sort((a, b) => b.contagionCentrality - a.contagionCentrality).slice(0, 15).map(e => (
                  <tr key={e.id}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{e.name}</td>
                    <td style={tdS}>{e.sector}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: e.contagionCentrality > 0.6 ? T.red : T.amber }}>{(e.contagionCentrality * 100).toFixed(1)}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{Math.floor(3 + e.contagionCentrality * 12)}</td>
                    <td style={tdS}><span style={badgeS(regimeColor(e.regime))}>{e.regime}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{fmtPct(e.pdConsensus * 100)}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{(e.contagionCentrality * e.pdConsensus * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  /* ============================================================
     TAB 9 — MODULE HEALTH
     ============================================================ */
  const renderModuleHealth = () => (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'Modules OK', val: moduleHealth.filter(m => m.status === 'OK').length, color: T.green },
          { label: 'Modules WARN', val: moduleHealth.filter(m => m.status === 'WARNING').length, color: T.amber },
          { label: 'Modules ERROR', val: moduleHealth.filter(m => m.status === 'ERROR').length, color: T.red },
          { label: 'Avg Coverage', val: `${(moduleHealth.reduce((a, m) => a + m.coverage, 0) / moduleHealth.length).toFixed(0)}%`, color: T.navy },
        ].map((k, i) => <div key={i} style={kpiBoxS}><div style={{ ...kpiVal, color: k.color }}>{k.val}</div><div style={kpiLab}>{k.label}</div></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardS}>
          <div style={labelS}>Module Coverage %</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moduleHealth} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="module" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip content={<CT />} />
              <ReferenceLine x={80} stroke={T.amber} strokeDasharray="4 4" />
              <Bar dataKey="coverage" name="Coverage %" radius={[0, 4, 4, 0]}>
                {moduleHealth.map((m, i) => <Cell key={i} fill={m.coverage >= 80 ? T.green : m.coverage >= 60 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={labelS}>Data Staleness by Module (hours)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moduleHealth} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="module" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip content={<CT />} />
              <ReferenceLine x={24} stroke={T.amber} strokeDasharray="4 4" />
              <Bar dataKey="staleness" name="Staleness (h)" radius={[0, 4, 4, 0]}>
                {moduleHealth.map((m, i) => <Cell key={i} fill={m.staleness > 36 ? T.red : m.staleness > 24 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={cardS}>
        <div style={labelS}>Module Registry</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Module', 'Last Refresh', 'Staleness', 'Coverage %', 'Model Version', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {moduleHealth.map((m, i) => (
              <tr key={i}>
                <td style={{ ...tdS, fontWeight: 600 }}>{m.module}</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{m.lastRefresh}</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: m.staleness > 36 ? T.red : m.staleness > 24 ? T.amber : T.green }}>{m.staleness}h</td>
                <td style={{ ...tdS, fontFamily: T.mono }}>{m.coverage}%</td>
                <td style={{ ...tdS, fontFamily: T.mono, color: T.textSec }}>{m.modelVersion}</td>
                <td style={tdS}><span style={badgeS(m.status === 'OK' ? T.green : m.status === 'WARNING' ? T.amber : T.red)}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ============================================================
     ROOT RENDER
     ============================================================ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20, borderBottom: `3px solid ${T.gold}`, paddingBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 2 }}>EP-U8 · DME SUITE</div>
              <h1 style={{ fontFamily: T.font, fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>DME Command Dashboard</h1>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textSec, marginTop: 2 }}>
                Executive aggregation across {ENTITIES.length} entities · {MODULES.length} modules · Real-time risk intelligence
              </p>
            </div>
            <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
              <div>ENTITIES: <span style={{ color: T.navy, fontWeight: 700 }}>{ENTITIES.length}</span></div>
              <div>MODULES: <span style={{ color: T.navy, fontWeight: 700 }}>{MODULES.length}</span></div>
              <div>BUILD: <span style={{ color: T.green }}>CLEAN</span></div>
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
        {tab === 0 && renderOverview()}
        {tab === 1 && renderRegimeDashboard()}
        {tab === 2 && renderAlertSummary()}
        {tab === 3 && renderPdIntelligence()}
        {tab === 4 && renderFinancialRisk()}
        {tab === 5 && renderNlpSentiment()}
        {tab === 6 && renderMlMateriality()}
        {tab === 7 && renderNgfsScenarios()}
        {tab === 8 && renderContagionRisk()}
        {tab === 9 && renderModuleHealth()}
      </div>
    </div>
  );
}
