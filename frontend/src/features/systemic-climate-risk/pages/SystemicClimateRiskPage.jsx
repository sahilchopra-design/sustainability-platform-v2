import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, ComposedChart,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ─────────────────────────────── SECTOR DATA ─────────────────────────────── */
const SECTOR_NAMES = [
  'Energy','Financials','Utilities','Materials','Consumer','Industrials',
  'Healthcare','Technology','Real Estate','Transportation',
  'Pharma','Aerospace','Shipping','Mining','Telecoms',
  'Media','Professional Services','Agri & Food','Chemicals','Automotive',
];
const SECTORS = SECTOR_NAMES.map((name, i) => ({
  id: i, name,
  gdpWeight:            +(0.02 + sr(i * 7)  * 0.10).toFixed(4),
  systRiskIndex:        +(20   + sr(i * 11) * 75).toFixed(1),
  contagionScore:       +(10   + sr(i * 13) * 70).toFixed(1),
  physRisk:             +(10   + sr(i * 17) * 80).toFixed(1),
  transRisk:            +(10   + sr(i * 19) * 80).toFixed(1),
  leverageRatio:        +(1.0  + sr(i * 23) * 7.0).toFixed(2),
  liquidityBuffer:      +(0.05 + sr(i * 29) * 0.45).toFixed(3),
  interconnectedness:   +(20   + sr(i * 31) * 70).toFixed(1),
  greenRevenuePct:      +(sr(i * 37) * 40).toFixed(1),
  fossilDependency:     +(sr(i * 41) * 60).toFixed(1),
  adaptationScore:      +(10   + sr(i * 47) * 80).toFixed(1),
  tippingProximity:     +(10   + sr(i * 53) * 80).toFixed(1),
  sectorPD:             +(0.001 + sr(i * 59) * 0.059).toFixed(4),
  sectorLGD:            +(0.3   + sr(i * 61) * 0.4).toFixed(3),
  capitalBuffer:        +(0.01  + sr(i * 67) * 0.11).toFixed(3),
  debtToEquity:         +(0.5   + sr(i * 71) * 7.5).toFixed(2),
  refinancingRisk:      +(10    + sr(i * 73) * 80).toFixed(1),
  carbonLockIn:         +(sr(i * 79) * 80).toFixed(1),
  crossBorderScore:     +(10    + sr(i * 83) * 70).toFixed(1),
  policyVulnerability:  +(10    + sr(i * 43) * 80).toFixed(1),
}));

/* ─────────────────────────── NETWORK CONTAGION ──────────────────────────── */
const NETWORK = SECTORS.map((_, i) =>
  SECTORS.map((_, j) => i === j ? 1.0 : +(sr(i * 20 + j) * 0.65).toFixed(3))
);

/* ──────────────────────────── SCENARIO DATA ─────────────────────────────── */
const NGFS_SCENARIOS = [
  { id: 0, name: 'Orderly',              color: T.green,  baseMult: 1.0 },
  { id: 1, name: 'Disorderly',           color: T.amber,  baseMult: 1.4 },
  { id: 2, name: 'Hot House World',      color: T.red,    baseMult: 2.2 },
  { id: 3, name: 'Below 2°C',            color: T.teal,   baseMult: 1.2 },
  { id: 4, name: 'Nationally Determined',color: T.blue,   baseMult: 1.7 },
];
const TIME_POINTS = [2025, 2030, 2035, 2040, 2045, 2050, 2055];

const SCENARIO_SERIES = NGFS_SCENARIOS.map(sc =>
  TIME_POINTS.map((yr, ti) => ({
    year: yr,
    sriLevel: +(40 + sc.baseMult * (5 + ti * 3.8) + sr(sc.id * 7 + ti) * 8).toFixed(2),
  }))
);

// Per-scenario per-sector risk index (5 × 20 pre-computed)
const SCENARIO_SECTOR_RISK = NGFS_SCENARIOS.map((sc, si) =>
  SECTORS.map((sec, i) => ({
    name: sec.name,
    riskIndex: +(sec.systRiskIndex * sc.baseMult * (0.8 + sr(si * 20 + i) * 0.4)).toFixed(1),
  }))
);

/* ──────────────────────────── CB INDICATORS ─────────────────────────────── */
const CB_INDICATORS = [
  { id: 0,  domain: 'Credit Risk',   name: 'Climate Credit Risk Index',          threshold: 65 },
  { id: 1,  domain: 'Credit Risk',   name: 'Carbon Loan Exposure Ratio',          threshold: 30 },
  { id: 2,  domain: 'Credit Risk',   name: 'Stranded Asset Credit Loss',          threshold: 40 },
  { id: 3,  domain: 'Systemic',      name: 'Systemic Climate Amplification',      threshold: 70 },
  { id: 4,  domain: 'Systemic',      name: 'Network Contagion Intensity',         threshold: 55 },
  { id: 5,  domain: 'Systemic',      name: 'Climate Leverage Amplifier',          threshold: 45 },
  { id: 6,  domain: 'Liquidity',     name: 'Climate Liquidity Risk Score',        threshold: 50 },
  { id: 7,  domain: 'Liquidity',     name: 'Insurance Protection Gap',            threshold: 60 },
  { id: 8,  domain: 'Macro',         name: 'GDP Climate Sensitivity',             threshold: 40 },
  { id: 9,  domain: 'Macro',         name: 'Climate Policy Uncertainty VIX',      threshold: 35 },
  { id: 10, domain: 'Transition',    name: 'Carbon Lock-In Systemic Score',       threshold: 55 },
  { id: 11, domain: 'Transition',    name: 'Green Transition Acceleration Index', threshold: 70, higherBetter: true },
  { id: 12, domain: 'Transition',    name: 'Fossil Fuel Exposure Ratio',          threshold: 25 },
  { id: 13, domain: 'Physical',      name: 'Physical Risk Composite Index',       threshold: 60 },
  { id: 14, domain: 'Physical',      name: 'Climate Bail-Out Risk',               threshold: 45 },
  { id: 15, domain: 'Physical',      name: 'Natural Disaster Loss Index',         threshold: 50 },
  { id: 16, domain: 'Disclosure',    name: 'TCFD Adoption Rate',                  threshold: 80, higherBetter: true },
  { id: 17, domain: 'Disclosure',    name: 'Net-Zero Credibility Index',          threshold: 70, higherBetter: true },
  { id: 18, domain: 'Disclosure',    name: 'Scenario Analysis Coverage',          threshold: 65, higherBetter: true },
  { id: 19, domain: 'Contagion',     name: 'Stranded Asset Cascade Risk',         threshold: 55 },
  { id: 20, domain: 'Contagion',     name: 'Tipping Point Proximity Index',       threshold: 50 },
  { id: 21, domain: 'Contagion',     name: 'Climate Contagion Shock Multiplier',  threshold: 40 },
  { id: 22, domain: 'Amplifier',     name: 'Debt-Climate Amplification',          threshold: 60 },
  { id: 23, domain: 'Amplifier',     name: 'Climate-Credit Spiral Risk',          threshold: 50 },
  { id: 24, domain: 'Amplifier',     name: 'Systemic Feedback Loop Score',        threshold: 65 },
].map((ind, i) => ({
  ...ind,
  value: +(20 + sr(i * 17) * 75).toFixed(1),
  trend: sr(i * 23) > 0.5 ? 'up' : 'down',
  // 12-month history
  history: Array.from({ length: 12 }, (_, m) => +(20 + sr(i * 17 + m * 3) * 75).toFixed(1)),
}));

const CB_DOMAINS = ['All', ...Array.from(new Set(CB_INDICATORS.map(x => x.domain)))];

/* ─────────────────────────── MACRO-PRUDENTIAL TOOLS ────────────────────── */
const MACRO_TOOLS = [
  { id: 0, name: 'Counter-Cyclical Capital Buffer (CCyB)', currentLevel: 1.5, min: 0, max: 5, unit: '%', gdpImpactPerUnit: -0.08, creditImpactPerUnit: -0.4, riskReductionPerUnit: 0.6, color: T.indigo },
  { id: 1, name: 'Sectoral Capital Buffer',               currentLevel: 2.0, min: 0, max: 8, unit: '%', gdpImpactPerUnit: -0.05, creditImpactPerUnit: -0.3, riskReductionPerUnit: 0.5, color: T.blue   },
  { id: 2, name: 'LTV Cap',                               currentLevel: 80,  min: 50, max: 100, unit: '%', gdpImpactPerUnit: -0.02, creditImpactPerUnit: -0.2, riskReductionPerUnit: 0.3, color: T.teal  },
  { id: 3, name: 'Margin Requirements',                   currentLevel: 15,  min: 5, max: 40,  unit: '%', gdpImpactPerUnit: -0.03, creditImpactPerUnit: -0.25, riskReductionPerUnit: 0.4, color: T.amber  },
  { id: 4, name: 'Carbon Tax',                            currentLevel: 65,  min: 0, max: 300, unit: '$/tCO2', gdpImpactPerUnit: -0.004, creditImpactPerUnit: -0.05, riskReductionPerUnit: 0.15, color: T.green  },
  { id: 5, name: 'Green Supporting Factor',               currentLevel: 0.75, min: 0.5, max: 1.0, unit: 'x', gdpImpactPerUnit: 0.06, creditImpactPerUnit: 0.3, riskReductionPerUnit: 0.2, color: T.purple },
];

/* ─────────────────────────── CROSS-BORDER MATRIX ────────────────────────── */
const REGIONS = ['UK', 'EU', 'US', 'Canada', 'APAC', 'EM', 'Japan', 'Australia'];
const CROSS_BORDER_MATRIX = REGIONS.map((_, i) =>
  REGIONS.map((_, j) => i === j ? 0 : +(sr(i * 8 + j) * 200 + 50).toFixed(1))
);

/* ──────────────────────── MONTE CARLO SYSTEMIC LOSSES ──────────────────── */
const MC_SYSTEMIC_LOSSES = Array.from({ length: 1000 }, (_, i) => {
  const base = 5 + sr(i * 3 + 7) * 40;
  const fatTail = sr(i * 3 + 8) > 0.92 ? sr(i * 3 + 9) * 60 : 0;
  return +(base + fatTail).toFixed(2);
});

/* ──────────────────────────── AMPLIFIER CHANNELS ────────────────────────── */
const AMPLIFIER_CHANNELS = [
  { id: 0, name: 'Credit & Leverage',   desc: 'Carbon loan exposure × leverage amplification — drives fire-sale dynamics in stressed portfolios', color: T.indigo, baseScore: 58 },
  { id: 1, name: 'Liquidity & Funding', desc: 'Climate flight-to-quality + collateral haircuts — amplifies funding gaps in brown asset holders',   color: T.blue,   baseScore: 44 },
  { id: 2, name: 'Confidence & Market', desc: 'Climate sentiment shock + repricing cascade — non-linear loss of market confidence in transition',   color: T.amber,  baseScore: 67 },
  { id: 3, name: 'Policy & Regulatory', desc: 'Carbon tax shocks + stranded asset regulation — sudden policy tightening multiplies credit losses',  color: T.red,    baseScore: 52 },
];

/* ──────────────────────── FSOC EARLY WARNING INDICATORS ────────────────── */
const FSOC_EW = [
  { name: 'Climate VIX', value: +(28 + sr(101) * 22).toFixed(1), threshold: 35, label: 'Implied Climate Volatility' },
  { name: 'Stranded Asset Ratio', value: +(18 + sr(102) * 25).toFixed(1), threshold: 30, label: '% of loan book at risk' },
  { name: 'Sovereign Spread Stress', value: +(45 + sr(103) * 40).toFixed(1), threshold: 60, label: 'Climate-adjusted spread bps' },
  { name: 'Bank Capital Adequacy', value: +(10 + sr(104) * 8).toFixed(1), threshold: 8, label: 'CET1 climate-adjusted %', higherBetter: true },
  { name: 'Green Finance Momentum', value: +(55 + sr(105) * 30).toFixed(1), threshold: 60, label: 'Issuance growth YoY %', higherBetter: true },
  { name: 'Cross-Border Contagion', value: +(20 + sr(106) * 35).toFixed(1), threshold: 40, label: 'Bilateral exposure stress index' },
];

/* ───────────────────────────────── HELPERS ─────────────────────────────── */
const KpiCard = ({ label, value, color = T.text, sub = '', width = 'auto' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: width }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Swatch = ({ color, size = 10 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 2, background: color, marginRight: 5, verticalAlign: 'middle' }} />
);

const ragColor = (v, threshold, higherBetter = false) => {
  if (higherBetter) return v >= threshold ? T.green : v >= threshold * 0.75 ? T.amber : T.red;
  return v <= threshold * 0.7 ? T.green : v <= threshold ? T.amber : T.red;
};

const ragLabel = (v, threshold, higherBetter = false) => {
  if (higherBetter) return v >= threshold ? 'GREEN' : v >= threshold * 0.75 ? 'AMBER' : 'RED';
  return v <= threshold * 0.7 ? 'GREEN' : v <= threshold ? 'AMBER' : 'RED';
};

const fmtPct = v => `${v.toFixed(1)}%`;
const fmtNum = (v, d = 1) => v.toFixed(d);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${T.gold}`, display: 'inline-block' }}>
    {children}
  </div>
);

const TABS = [
  'SCRI Dashboard',
  'Sector Risk Monitor',
  'Network Contagion',
  'Amplifier Channels',
  'Scenario Propagation',
  'FSOC / ESRB Indicators',
  'Macro-Prudential Toolkit',
  'Tipping Points & Cascades',
  'Cross-Border Contagion',
  'Summary & Export',
];

/* ════════════════════════════════ COMPONENT ════════════════════════════════ */
export default function SystemicClimateRiskPage() {
  const [tab, setTab] = useState(0);

  /* ── Tab 1 ── */
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [horizonIdx, setHorizonIdx]   = useState(1);
  const [ragThreshold, setRagThreshold] = useState(55);

  /* ── Tab 2 ── */
  const [sectorSearch, setSectorSearch]       = useState('');
  const [sectorSortCol, setSectorSortCol]     = useState('systRiskIndex');
  const [sectorSortDir, setSectorSortDir]     = useState(-1);
  const [selectedSector, setSelectedSector]   = useState(null);

  /* ── Tab 3 ── */
  const [contagionSource, setContagionSource] = useState(0);
  const [contagionThresh, setContagionThresh] = useState(0.3);
  const [cascadeDepth, setCascadeDepth]       = useState(2);

  /* ── Tab 4 ── */
  const [ampIntensity, setAmpIntensity]       = useState([1.0, 1.0, 1.0, 1.0]);
  const [showFeedback, setShowFeedback]       = useState(true);

  /* ── Tab 5 ── */
  const [scenA, setScenA]           = useState(0);
  const [scenB, setScenB]           = useState(2);
  const [compareMode, setCompareMode] = useState(false);
  const [timeSlider, setTimeSlider]   = useState(3);
  const [sectorFocus, setSectorFocus] = useState('All');

  /* ── Tab 6 ── */
  const [indDomainFilter, setIndDomainFilter] = useState('All');
  const [breachOnly, setBreachOnly]           = useState(false);
  const [thresholdOverride, setThresholdOverride] = useState({}); // id → value

  /* ── Tab 7 ── */
  const [toolLevels, setToolLevels]     = useState(MACRO_TOOLS.map(t => t.currentLevel));
  const [showCombined, setShowCombined] = useState(true);

  /* ── Tab 8 ── */
  const [tipThreshold, setTipThreshold]   = useState(60);
  const [showMCDist, setShowMCDist]       = useState(true);
  const [sectorFocusTip, setSectorFocusTip] = useState(0);

  /* ── Tab 9 ── */
  const [regionA, setRegionA]           = useState(0);
  const [regionB, setRegionB]           = useState(1);
  const [expThreshold, setExpThreshold] = useState(80);
  const [showFX, setShowFX]             = useState(true);

  /* ── Tab 10 ── */
  const [showRecs, setShowRecs]       = useState(true);
  const [reportFormat, setReportFormat] = useState('board');

  /* ──────────── DERIVED DATA ──────────── */
  const gdpWeightedSRI = useMemo(() => {
    const totalW = SECTORS.reduce((s, x) => s + x.gdpWeight, 0);
    if (totalW <= 0) return 0;
    return +(SECTORS.reduce((s, x) => s + x.systRiskIndex * x.gdpWeight, 0) / totalW).toFixed(1);
  }, []);

  const networkDensity = useMemo(() => {
    let count = 0, total = 0;
    SECTORS.forEach((_, i) => SECTORS.forEach((_, j) => {
      if (i !== j) { if (NETWORK[i][j] > 0.3) count++; total++; }
    }));
    return total > 0 ? +(count / total * 100).toFixed(1) : 0;
  }, []);

  const breachCount = useMemo(() =>
    CB_INDICATORS.filter(ind => {
      const thr = thresholdOverride[ind.id] ?? ind.threshold;
      return ind.higherBetter ? ind.value < thr : ind.value > thr;
    }).length
  , [thresholdOverride]);

  const topSector = useMemo(() =>
    [...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex)[0]
  , []);

  const ampFactor = useMemo(() => {
    const scores = AMPLIFIER_CHANNELS.map((ch, ci) => ch.baseScore * ampIntensity[ci]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return +(1 + avg / 100).toFixed(3);
  }, [ampIntensity]);

  const scriTrend = useMemo(() =>
    TIME_POINTS.map((yr, ti) => ({
      year: yr,
      scri: +(gdpWeightedSRI * NGFS_SCENARIOS[scenarioIdx].baseMult * (1 + ti * 0.04) + sr(scenarioIdx * 7 + ti) * 5).toFixed(1),
    }))
  , [scenarioIdx, gdpWeightedSRI]);

  const filteredSectors = useMemo(() => {
    let d = SECTORS.filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase()));
    return [...d].sort((a, b) => sectorSortDir * ((a[sectorSortCol] || 0) - (b[sectorSortCol] || 0)));
  }, [sectorSearch, sectorSortCol, sectorSortDir]);

  const selectedSectorRadar = useMemo(() => {
    if (!selectedSector) return [];
    const s = SECTORS[selectedSector];
    return [
      { axis: 'Phys Risk',    value: s.physRisk },
      { axis: 'Trans Risk',   value: s.transRisk },
      { axis: 'Contagion',    value: s.contagionScore },
      { axis: 'Leverage',     value: Math.min(100, s.leverageRatio * 10) },
      { axis: 'Carbon Lock',  value: s.carbonLockIn },
      { axis: 'Tipping Prox', value: s.tippingProximity },
    ];
  }, [selectedSector]);

  const contagionAffected = useMemo(() => {
    const row = NETWORK[contagionSource];
    return SECTORS
      .map((s, i) => ({ name: s.name, intensity: row[i], systRisk: s.systRiskIndex }))
      .filter((s, i) => i !== contagionSource && s.intensity >= contagionThresh)
      .sort((a, b) => b.intensity - a.intensity);
  }, [contagionSource, contagionThresh]);

  const cascadeChain = useMemo(() => {
    const visited = new Set([contagionSource]);
    const layers = [[contagionSource]];
    for (let d = 1; d < cascadeDepth; d++) {
      const next = [];
      for (const src of layers[d - 1]) {
        SECTORS.forEach((_, j) => {
          if (!visited.has(j) && NETWORK[src][j] >= contagionThresh) {
            visited.add(j); next.push(j);
          }
        });
      }
      if (next.length === 0) break;
      layers.push(next);
    }
    return layers;
  }, [contagionSource, contagionThresh, cascadeDepth]);

  const amplifierWaterfall = useMemo(() =>
    AMPLIFIER_CHANNELS.map((ch, ci) => ({
      name: ch.name.split(' ')[0],
      score: +(ch.baseScore * ampIntensity[ci]).toFixed(1),
      color: ch.color,
    }))
  , [ampIntensity]);

  const scenarioTimeData = useMemo(() => {
    const serA = SCENARIO_SERIES[scenA];
    const serB = SCENARIO_SERIES[scenB];
    return TIME_POINTS.map((yr, ti) => ({
      year: yr,
      scenA: serA[ti].sriLevel,
      ...(compareMode ? { scenB: serB[ti].sriLevel } : {}),
    }));
  }, [scenA, scenB, compareMode]);

  const scenarioSectorData = useMemo(() => {
    const data = SCENARIO_SECTOR_RISK[scenA];
    const filt = sectorFocus === 'All' ? data : data.filter(d => d.name === sectorFocus);
    return filt.slice(0, 10);
  }, [scenA, sectorFocus]);

  const filteredIndicators = useMemo(() => {
    let d = CB_INDICATORS;
    if (indDomainFilter !== 'All') d = d.filter(x => x.domain === indDomainFilter);
    if (breachOnly) d = d.filter(ind => {
      const thr = thresholdOverride[ind.id] ?? ind.threshold;
      return ind.higherBetter ? ind.value < thr : ind.value > thr;
    });
    return d;
  }, [indDomainFilter, breachOnly, thresholdOverride]);

  const domainRadarData = useMemo(() => {
    const domains = Array.from(new Set(CB_INDICATORS.map(x => x.domain)));
    return domains.map(dom => {
      const inds = CB_INDICATORS.filter(x => x.domain === dom);
      const avg = inds.length ? inds.reduce((s, x) => s + x.value, 0) / inds.length : 0;
      return { domain: dom, avgScore: +avg.toFixed(1) };
    });
  }, []);

  const toolEffectiveness = useMemo(() =>
    MACRO_TOOLS.map((t, i) => {
      const delta = toolLevels[i] - t.currentLevel;
      const gdpImpact = +(t.gdpImpactPerUnit * delta).toFixed(3);
      const creditImpact = +(t.creditImpactPerUnit * delta).toFixed(3);
      const riskReduction = +(t.riskReductionPerUnit * Math.abs(delta)).toFixed(2);
      return { ...t, level: toolLevels[i], gdpImpact, creditImpact, riskReduction };
    })
  , [toolLevels]);

  const totalRiskReduction = useMemo(() =>
    +(toolEffectiveness.reduce((s, t) => s + t.riskReduction, 0)).toFixed(2)
  , [toolEffectiveness]);

  const tippingData = useMemo(() =>
    [...SECTORS].sort((a, b) => b.tippingProximity - a.tippingProximity)
  , []);

  const mcBins = useMemo(() => {
    const bins = Array.from({ length: 20 }, (_, i) => ({ bin: `${i * 5}-${(i + 1) * 5}`, count: 0 }));
    MC_SYSTEMIC_LOSSES.forEach(loss => {
      const bi = Math.min(19, Math.floor(loss / 5));
      bins[bi].count++;
    });
    return bins;
  }, []);

  const mcStats = useMemo(() => {
    const sorted = [...MC_SYSTEMIC_LOSSES].sort((a, b) => a - b);
    const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const var95 = sorted[Math.floor(sorted.length * 0.95)];
    const es99 = sorted.slice(Math.floor(sorted.length * 0.99)).reduce((s, v) => s + v, 0) /
      Math.max(1, sorted.length - Math.floor(sorted.length * 0.99));
    const probEvent = sorted.filter(v => v > 40).length / sorted.length;
    return { mean: +mean.toFixed(2), var95: +var95.toFixed(2), es99: +es99.toFixed(2), probEvent: +(probEvent * 100).toFixed(1) };
  }, []);

  const cascadeSim = useMemo(() => {
    const s = SECTORS[sectorFocusTip];
    return Array.from({ length: 10 }, (_, step) => ({
      step,
      loss: +(s.tippingProximity * (1 + step * 0.15) * (1 + sr(sectorFocusTip * 10 + step) * 0.3)).toFixed(1),
    }));
  }, [sectorFocusTip]);

  const crossBorderPairs = useMemo(() => {
    const pairs = [];
    REGIONS.forEach((r1, i) => REGIONS.forEach((r2, j) => {
      if (i < j) pairs.push({ from: r1, to: r2, exposure: CROSS_BORDER_MATRIX[i][j] });
    }));
    return [...pairs].sort((a, b) => b.exposure - a.exposure).filter(p => p.exposure >= expThreshold).slice(0, 15);
  }, [expThreshold]);

  const fxAmplification = useMemo(() =>
    REGIONS.map((r, i) => ({
      region: r,
      fxStress: +(10 + sr(i * 13 + 200) * 40).toFixed(1),
      capitalFlowRisk: +(20 + sr(i * 17 + 200) * 50).toFixed(1),
    }))
  , []);

  const bilateralAB = CROSS_BORDER_MATRIX[regionA][regionB];

  const top10Risks = useMemo(() =>
    [...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex).slice(0, 10)
      .map((s, rank) => ({ rank: rank + 1, sector: s.name, scri: s.systRiskIndex, tipping: s.tippingProximity, contagion: s.contagionScore }))
  , []);

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, color: '#fff', padding: '18px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Goldman Sachs / FSOC / ESRB Grade
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Systemic Climate Risk Intelligence Platform
        </div>
        <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>
          Real-time composite systemic risk monitoring · 20-sector network · 25 early warning indicators · MC simulation
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 2, padding: '0 32px', background: T.sub, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 400,
            color: tab === i ? T.indigo : T.muted, background: 'none', border: 'none',
            borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.02em',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ═══════════════════════ TAB 0 — SCRI DASHBOARD ═══════════════════════ */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <SectionTitle>Systemic Climate Risk Index (SCRI) — Composite Dashboard</SectionTitle>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={scenarioIdx} onChange={e => setScenarioIdx(+e.target.value)} style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                  {NGFS_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={horizonIdx} onChange={e => setHorizonIdx(+e.target.value)} style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                  {TIME_POINTS.map((yr, i) => <option key={i} value={i}>{yr}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>RAG Threshold:</span>
                  <input type="range" min={30} max={80} value={ragThreshold} onChange={e => setRagThreshold(+e.target.value)} style={{ width: 90 }} />
                  <span style={{ fontWeight: 700, color: T.red }}>{ragThreshold}</span>
                </div>
              </div>
            </div>

            {/* 5 KPI Cards */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <KpiCard label="SCRI Score" value={gdpWeightedSRI.toFixed(1)} color={gdpWeightedSRI > ragThreshold ? T.red : gdpWeightedSRI > ragThreshold * 0.75 ? T.amber : T.green} sub="GDP-weighted composite (0-100)" />
              <KpiCard label="Indicator Breaches" value={breachCount} color={breachCount > 10 ? T.red : breachCount > 5 ? T.amber : T.green} sub={`of 25 FSOC/ESRB indicators`} />
              <KpiCard label="Network Density" value={`${networkDensity}%`} color={T.indigo} sub="Contagion links > 0.30 threshold" />
              <KpiCard label="Top Systemic Sector" value={topSector.name} color={T.navy} sub={`SRI: ${topSector.systRiskIndex.toFixed(1)}`} />
              <KpiCard label="Amplification Factor" value={ampFactor.toFixed(3)}x color={ampFactor > 1.5 ? T.red : T.amber} sub="Combined channel multiplier" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* SCRI Trend */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>SCRI Trend Projection 2025–2055 ({NGFS_SCENARIOS[scenarioIdx].name})</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={scriTrend}>
                    <defs>
                      <linearGradient id="scri_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.red} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={T.red} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <ReferenceLine y={ragThreshold} stroke={T.red} strokeDasharray="4 2" label={{ value: 'RAG', position: 'right', fontSize: 10, fill: T.red }} />
                    <Area type="monotone" dataKey="scri" stroke={T.red} fill="url(#scri_grad)" strokeWidth={2} name="SCRI" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 At-Risk Sectors */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 5 At-Risk Sectors — Systemic Risk Index</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex).slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <ReferenceLine x={ragThreshold} stroke={T.red} strokeDasharray="4 2" />
                    <Bar dataKey="systRiskIndex" name="SRI" radius={[0, 3, 3, 0]}>
                      {[...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex).slice(0, 5).map((s, i) => (
                        <Cell key={i} fill={s.systRiskIndex > ragThreshold ? T.red : s.systRiskIndex > ragThreshold * 0.75 ? T.amber : T.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FSOC Early Warning Traffic Lights */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, color: T.navy }}>FSOC Early Warning Indicators — Traffic Light Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {FSOC_EW.map((ind, i) => {
                  const col = ragColor(ind.value, ind.threshold, ind.higherBetter);
                  return (
                    <div key={i} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px', borderLeft: `4px solid ${col}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ind.name}</div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{ind.label}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: col }}>{ind.value}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: 'uppercase' }}>{ragLabel(ind.value, ind.threshold, ind.higherBetter)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 1 — SECTOR RISK MONITOR ═══════════════════ */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <SectionTitle>Sector Risk Monitor — 20 Sectors</SectionTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Search sector..." value={sectorSearch} onChange={e => setSectorSearch(e.target.value)}
                  style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, width: 160 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedSector !== null ? '1fr 340px' : '1fr', gap: 20 }}>
              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy, color: '#fff' }}>
                      {[
                        ['name', 'Sector'], ['systRiskIndex', 'SRI'], ['contagionScore', 'Contagion'],
                        ['physRisk', 'Phys Risk'], ['transRisk', 'Trans Risk'], ['leverageRatio', 'Leverage'],
                        ['liquidityBuffer', 'Liquidity'], ['interconnectedness', 'Interconn.'],
                        ['greenRevenuePct', 'Green Rev%'], ['fossilDependency', 'Fossil%'],
                        ['adaptationScore', 'Adapt.'], ['tippingProximity', 'Tipping'],
                      ].map(([col, lbl]) => (
                        <th key={col} onClick={() => { setSectorSortCol(col); setSectorSortDir(sectorSortCol === col ? -sectorSortDir : -1); }}
                          style={{ padding: '8px 10px', textAlign: col === 'name' ? 'left' : 'right', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', fontWeight: 600 }}>
                          {lbl}{sectorSortCol === col ? (sectorSortDir === -1 ? ' ▼' : ' ▲') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSectors.map((s, ri) => (
                      <tr key={s.id} onClick={() => setSelectedSector(selectedSector === s.id ? null : s.id)}
                        style={{ background: selectedSector === s.id ? '#eef2ff' : ri % 2 === 0 ? T.card : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{s.name}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: s.systRiskIndex > 65 ? T.red : s.systRiskIndex > 45 ? T.amber : T.green, fontWeight: 600 }}>{s.systRiskIndex.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.contagionScore.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.physRisk.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.transRisk.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.leverageRatio.toFixed(2)}x</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{(s.liquidityBuffer * 100).toFixed(1)}%</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.interconnectedness.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: T.green }}>{s.greenRevenuePct.toFixed(1)}%</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{s.fossilDependency.toFixed(1)}%</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.adaptationScore.toFixed(1)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: s.tippingProximity > 65 ? T.red : T.amber }}>{s.tippingProximity.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Radar Panel */}
              {selectedSector !== null && (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: T.navy }}>{SECTORS[selectedSector].name} — Risk Profile</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>SRI: {SECTORS[selectedSector].systRiskIndex.toFixed(1)} | PD: {(SECTORS[selectedSector].sectorPD * 100).toFixed(3)}% | LGD: {(SECTORS[selectedSector].sectorLGD * 100).toFixed(0)}%</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={selectedSectorRadar}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar dataKey="value" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12, fontSize: 11, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      ['D/E Ratio', `${SECTORS[selectedSector].debtToEquity.toFixed(2)}x`],
                      ['Capital Buffer', `${(SECTORS[selectedSector].capitalBuffer * 100).toFixed(1)}%`],
                      ['Carbon Lock-In', `${SECTORS[selectedSector].carbonLockIn.toFixed(1)}`],
                      ['Refi Risk', `${SECTORS[selectedSector].refinancingRisk.toFixed(1)}`],
                      ['Cross-Border', `${SECTORS[selectedSector].crossBorderScore.toFixed(1)}`],
                      ['Policy Vuln.', `${SECTORS[selectedSector].policyVulnerability.toFixed(1)}`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: T.sub, borderRadius: 4, padding: '4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: T.muted }}>{k}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 2 — NETWORK CONTAGION ═════════════════════ */}
        {tab === 2 && (
          <div>
            <SectionTitle>Network Contagion — 20×20 Sector Linkage Matrix</SectionTitle>
            <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ color: T.muted }}>Source Sector:</span>
                <select value={contagionSource} onChange={e => setContagionSource(+e.target.value)}
                  style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                  {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ color: T.muted }}>Contagion Threshold:</span>
                <input type="range" min={0.2} max={0.8} step={0.05} value={contagionThresh} onChange={e => setContagionThresh(+e.target.value)} style={{ width: 110 }} />
                <span style={{ fontWeight: 700 }}>{contagionThresh.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ color: T.muted }}>Cascade Depth:</span>
                <input type="range" min={1} max={5} step={1} value={cascadeDepth} onChange={e => setCascadeDepth(+e.target.value)} style={{ width: 90 }} />
                <span style={{ fontWeight: 700 }}>{cascadeDepth}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
              {/* 20×20 Heat Grid */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: T.navy }}>Bilateral Contagion Intensity (0.0 – 1.0)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '3px 6px', background: T.sub }}></th>
                        {SECTORS.map(s => (
                          <th key={s.id} style={{ padding: '3px 5px', background: T.navy, color: '#fff', whiteSpace: 'nowrap', writingMode: 'vertical-lr', transform: 'rotate(180deg)', maxHeight: 80, height: 80, fontWeight: 500, fontSize: 9 }}>
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SECTORS.map((row, i) => (
                        <tr key={i}>
                          <td style={{ padding: '3px 6px', fontWeight: 600, background: i === contagionSource ? T.navy : T.sub, color: i === contagionSource ? '#fff' : T.text, whiteSpace: 'nowrap', fontSize: 9 }}>{row.name}</td>
                          {SECTORS.map((_, j) => {
                            const v = NETWORK[i][j];
                            const alpha = i === j ? 0.15 : v;
                            const cellColor = i === j ? T.muted : v > 0.5 ? T.red : v > 0.3 ? T.amber : T.green;
                            return (
                              <td key={j} style={{
                                padding: '3px 5px', textAlign: 'center',
                                background: i === contagionSource && j !== i && v >= contagionThresh ? `${T.red}44` :
                                  i === j ? '#f0f0f0' : `rgba(220,38,38,${(alpha * 0.35).toFixed(2)})`,
                                color: cellColor, fontWeight: v > 0.5 ? 700 : 400, minWidth: 30,
                              }}>
                                {i === j ? '—' : v.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Affected sectors */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: T.navy }}>
                    Sectors Affected by {SECTORS[contagionSource].name} Shock
                  </div>
                  {contagionAffected.length === 0 ? (
                    <div style={{ fontSize: 12, color: T.muted, padding: '8px 0' }}>No sectors above threshold {contagionThresh.toFixed(2)}</div>
                  ) : (
                    contagionAffected.map((s, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span style={{ color: T.red, fontWeight: 700 }}>{s.intensity.toFixed(3)}</span>
                        </div>
                        <div style={{ background: T.sub, borderRadius: 3, height: 6 }}>
                          <div style={{ width: `${s.intensity * 100}%`, height: 6, background: s.intensity > 0.5 ? T.red : T.amber, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cascade chain */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: T.navy }}>
                    Cascade Chain (depth {cascadeDepth})
                  </div>
                  {cascadeChain.map((layer, d) => (
                    <div key={d} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                        Layer {d} {d === 0 ? '(Source)' : `(Hop ${d})`}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {layer.map(idx => (
                          <span key={idx} style={{ background: d === 0 ? T.red : d === 1 ? T.amber : T.gold, color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
                            {SECTORS[idx].name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 3 — AMPLIFIER CHANNELS ════════════════════ */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionTitle>Amplifier Channels — Systemic Risk Multipliers</SectionTitle>
              <button onClick={() => setShowFeedback(!showFeedback)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: showFeedback ? T.indigo : T.card, color: showFeedback ? '#fff' : T.text, cursor: 'pointer' }}>
                {showFeedback ? 'Hide Feedback Loops' : 'Show Feedback Loops'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {AMPLIFIER_CHANNELS.map((ch, ci) => {
                const score = +(ch.baseScore * ampIntensity[ci]).toFixed(1);
                return (
                  <div key={ci} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, borderLeft: `4px solid ${ch.color}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{ch.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>{ch.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: T.muted, minWidth: 60 }}>Intensity:</span>
                      <input type="range" min={0} max={2} step={0.05} value={ampIntensity[ci]}
                        onChange={e => {
                          const next = [...ampIntensity]; next[ci] = +e.target.value; setAmpIntensity(next);
                        }} style={{ flex: 1 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, minWidth: 36, color: ch.color }}>{ampIntensity[ci].toFixed(2)}×</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.muted }}>Current Magnitude</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: score > 80 ? T.red : score > 55 ? T.amber : T.green }}>{score}</div>
                      </div>
                      {showFeedback && (
                        <div style={{ fontSize: 11, textAlign: 'right', color: T.muted }}>
                          <div style={{ color: ch.color, fontWeight: 600, marginBottom: 2 }}>Feedback Loop</div>
                          <div>{'→'.repeat(Math.min(5, Math.ceil(ampIntensity[ci] * 3)))} amplification</div>
                          <div style={{ color: score > 70 ? T.red : T.green }}>{score > 70 ? 'RUNAWAY' : 'CONTAINED'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Net Amplification Score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Net Amplification Score</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: ampFactor > 1.8 ? T.red : ampFactor > 1.4 ? T.amber : T.green, textAlign: 'center', padding: '12px 0' }}>
                  {ampFactor.toFixed(3)}×
                </div>
                <div style={{ fontSize: 11, color: T.muted, textAlign: 'center' }}>Combined systemic amplification multiplier</div>
                <div style={{ marginTop: 12, padding: '8px 12px', background: ampFactor > 1.6 ? '#fef2f2' : '#f0fdf4', borderRadius: 6, fontSize: 11, color: ampFactor > 1.6 ? T.red : T.green, fontWeight: 600, textAlign: 'center' }}>
                  {ampFactor > 1.8 ? 'CRITICAL — Immediate macro-prudential intervention required' :
                   ampFactor > 1.4 ? 'ELEVATED — Monitor closely; consider targeted buffers' :
                   'CONTAINED — Amplification within historical bounds'}
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Amplification Waterfall</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={amplifierWaterfall}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 140]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <Bar dataKey="score" name="Amplification Score" radius={[3, 3, 0, 0]}>
                      {amplifierWaterfall.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 4 — SCENARIO PROPAGATION ══════════════════ */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <SectionTitle>Scenario Propagation — NGFS Climate Scenarios</SectionTitle>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Scenario A:</span>
                  <select value={scenA} onChange={e => setScenA(+e.target.value)}
                    style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                    {NGFS_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button onClick={() => setCompareMode(!compareMode)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: compareMode ? T.indigo : T.card, color: compareMode ? '#fff' : T.text, cursor: 'pointer' }}>
                  {compareMode ? 'Compare ON' : 'Compare OFF'}
                </button>
                {compareMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ color: T.muted }}>vs:</span>
                    <select value={scenB} onChange={e => setScenB(+e.target.value)}
                      style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                      {NGFS_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Sector:</span>
                  <select value={sectorFocus} onChange={e => setSectorFocus(e.target.value)}
                    style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                    <option value="All">All</option>
                    {SECTORS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Time evolution */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>SRI Evolution 2025–2055</div>
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>Time horizon:</span>
                  <input type="range" min={0} max={6} value={timeSlider} onChange={e => setTimeSlider(+e.target.value)} style={{ width: 120 }} />
                  <span style={{ fontWeight: 700, color: T.indigo }}>{TIME_POINTS[timeSlider]}</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={scenarioTimeData}>
                    <defs>
                      <linearGradient id="sa_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={NGFS_SCENARIOS[scenA].color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={NGFS_SCENARIOS[scenA].color} stopOpacity={0.02} />
                      </linearGradient>
                      {compareMode && (
                        <linearGradient id="sb_grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={NGFS_SCENARIOS[scenB].color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={NGFS_SCENARIOS[scenB].color} stopOpacity={0.02} />
                        </linearGradient>
                      )}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis domain={[30, 110]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <Legend />
                    <ReferenceLine x={TIME_POINTS[timeSlider]} stroke={T.gold} strokeDasharray="4 2" />
                    <ReferenceLine y={75} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Cascade Threshold', position: 'right', fontSize: 9, fill: T.red }} />
                    <Area type="monotone" dataKey="scenA" stroke={NGFS_SCENARIOS[scenA].color} fill="url(#sa_grad)" strokeWidth={2} name={NGFS_SCENARIOS[scenA].name} />
                    {compareMode && <Area type="monotone" dataKey="scenB" stroke={NGFS_SCENARIOS[scenB].color} fill="url(#sb_grad)" strokeWidth={2} name={NGFS_SCENARIOS[scenB].name} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sector risk by scenario */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>
                  Top-10 Sector Risk — {NGFS_SCENARIOS[scenA].name}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scenarioSectorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 140]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <ReferenceLine x={75} stroke={T.red} strokeDasharray="4 2" />
                    <Bar dataKey="riskIndex" name="Risk Index" radius={[0, 3, 3, 0]}>
                      {scenarioSectorData.map((d, i) => (
                        <Cell key={i} fill={d.riskIndex > 80 ? T.red : d.riskIndex > 55 ? T.amber : T.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* All 5 scenarios grouped bar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>All-Scenario SCRI Trajectory Comparison</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={TIME_POINTS.map((yr, ti) => {
                  const obj = { year: yr };
                  NGFS_SCENARIOS.forEach(sc => { obj[sc.name] = SCENARIO_SERIES[sc.id][ti].sriLevel; });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[30, 120]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v.toFixed(1)} />
                  <Legend />
                  <ReferenceLine y={75} stroke={T.red} strokeDasharray="4 2" />
                  {NGFS_SCENARIOS.map(sc => (
                    <Line key={sc.id} type="monotone" dataKey={sc.name} stroke={sc.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 5 — FSOC/ESRB INDICATORS ══════════════════ */}
        {tab === 5 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <SectionTitle>FSOC / ESRB Early Warning Indicators</SectionTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={indDomainFilter} onChange={e => setIndDomainFilter(e.target.value)}
                  style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                  {CB_DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={() => setBreachOnly(!breachOnly)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: breachOnly ? T.red : T.card, color: breachOnly ? '#fff' : T.text, cursor: 'pointer' }}>
                  {breachOnly ? 'Breach Only ✓' : 'Show Breaches'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              {/* Indicator table */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy, color: '#fff' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Domain</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Indicator</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Value</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Threshold</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Trend</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIndicators.map((ind, ri) => {
                      const thr = thresholdOverride[ind.id] ?? ind.threshold;
                      const col = ragColor(ind.value, thr, ind.higherBetter);
                      const lbl = ragLabel(ind.value, thr, ind.higherBetter);
                      return (
                        <tr key={ind.id} style={{ background: ri % 2 === 0 ? T.card : T.sub, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 10px', color: T.muted, fontSize: 11 }}>{ind.domain}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 500 }}>{ind.name}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: col }}>{ind.value.toFixed(1)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: T.muted }}>{thr.toFixed(0)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <span style={{ background: col, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{lbl}</span>
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 14, color: ind.trend === 'up' ? T.red : T.green }}>{ind.trend === 'up' ? '↑' : '↓'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                            <input type="number" min={0} max={100} value={thresholdOverride[ind.id] ?? ind.threshold}
                              onChange={e => setThresholdOverride(prev => ({ ...prev, [ind.id]: +e.target.value }))}
                              style={{ width: 56, padding: '2px 6px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 3, textAlign: 'right' }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Domain radar */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Domain Average Score Radar</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={domainRadarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar dataKey="avgScore" stroke={T.red} fill={T.red} fillOpacity={0.2} name="Avg Score" />
                    <Tooltip formatter={v => v.toFixed(1)} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 10 }}>
                  {domainRadarData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ color: T.muted }}>{d.domain}</span>
                      <span style={{ fontWeight: 600, color: d.avgScore > 60 ? T.red : d.avgScore > 40 ? T.amber : T.green }}>{d.avgScore.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 6 — MACRO-PRUDENTIAL TOOLKIT ══════════════ */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <SectionTitle>Macro-Prudential Toolkit — Policy Calibration</SectionTitle>
              <button onClick={() => setShowCombined(!showCombined)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: showCombined ? T.teal : T.card, color: showCombined ? '#fff' : T.text, cursor: 'pointer' }}>
                {showCombined ? 'Combined View ✓' : 'Individual View'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
              {MACRO_TOOLS.map((t, i) => (
                <div key={t.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, borderTop: `3px solid ${t.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 12 }}>Range: {t.min}{t.unit} – {t.max}{t.unit}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <input type="range" min={t.min} max={t.max} step={(t.max - t.min) / 100} value={toolLevels[i]}
                      onChange={e => { const nl = [...toolLevels]; nl[i] = +e.target.value; setToolLevels(nl); }}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: t.color, minWidth: 52, fontSize: 13 }}>{toolLevels[i].toFixed(2)}{t.unit}</span>
                  </div>
                  {showCombined && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                      {[
                        ['GDP Δ', `${toolEffectiveness[i].gdpImpact > 0 ? '+' : ''}${toolEffectiveness[i].gdpImpact.toFixed(3)}%`, toolEffectiveness[i].gdpImpact >= 0 ? T.green : T.red],
                        ['Credit Δ', `${toolEffectiveness[i].creditImpact > 0 ? '+' : ''}${toolEffectiveness[i].creditImpact.toFixed(3)}%`, toolEffectiveness[i].creditImpact >= 0 ? T.green : T.amber],
                        ['Risk↓', `${toolEffectiveness[i].riskReduction.toFixed(2)}`, T.indigo],
                      ].map(([lbl, val, col]) => (
                        <div key={lbl} style={{ background: T.sub, borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: T.muted }}>{lbl}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total effectiveness bar + chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: T.navy }}>Policy Effectiveness Score</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: totalRiskReduction > 10 ? T.green : totalRiskReduction > 5 ? T.amber : T.red, textAlign: 'center', padding: '10px 0' }}>
                  {totalRiskReduction.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: T.muted, textAlign: 'center' }}>Total systemic risk reduction score</div>
                <div style={{ marginTop: 16 }}>
                  {toolEffectiveness.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' }}>
                      <span style={{ color: T.muted }}>{t.name.split(' ')[0]} {t.name.split(' ')[1] || ''}</span>
                      <span style={{ fontWeight: 600, color: t.color }}>{t.riskReduction.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>GDP Impact vs Risk Reduction — Policy Matrix</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="gdpImpact" name="GDP Impact %" tick={{ fontSize: 11 }} label={{ value: 'GDP Impact %', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                    <YAxis dataKey="riskReduction" name="Risk Reduction" tick={{ fontSize: 11 }} label={{ value: 'Risk Reduction', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v.toFixed(3), n]} />
                    <Scatter data={toolEffectiveness.map((t, i) => ({ ...t, gdpImpact: t.gdpImpact, riskReduction: t.riskReduction, fill: MACRO_TOOLS[i].color }))} name="Policy Tools">
                      {toolEffectiveness.map((t, i) => <Cell key={i} fill={MACRO_TOOLS[i].color} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 7 — TIPPING POINTS & CASCADES ═════════════ */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <SectionTitle>Tipping Points & Cascade Simulation</SectionTitle>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Tip Threshold:</span>
                  <input type="range" min={0} max={100} value={tipThreshold} onChange={e => setTipThreshold(+e.target.value)} style={{ width: 100 }} />
                  <span style={{ fontWeight: 700, color: T.red }}>{tipThreshold}</span>
                </div>
                <button onClick={() => setShowMCDist(!showMCDist)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: showMCDist ? T.purple : T.card, color: showMCDist ? '#fff' : T.text, cursor: 'pointer' }}>
                  {showMCDist ? 'MC Dist ON' : 'MC Dist OFF'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Sector Focus:</span>
                  <select value={sectorFocusTip} onChange={e => setSectorFocusTip(+e.target.value)}
                    style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                    {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Tipping proximity bar */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Tipping Point Proximity — All Sectors</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tippingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={115} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <ReferenceLine x={tipThreshold} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Threshold', position: 'top', fontSize: 9, fill: T.red }} />
                    <Bar dataKey="tippingProximity" name="Tipping Proximity" radius={[0, 3, 3, 0]}>
                      {tippingData.map((s, i) => <Cell key={i} fill={s.tippingProximity > tipThreshold ? T.red : s.tippingProximity > tipThreshold * 0.75 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cascade simulation for selected sector */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: T.navy }}>
                  Cascade Simulation — {SECTORS[sectorFocusTip].name}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
                  Tipping proximity: {SECTORS[sectorFocusTip].tippingProximity.toFixed(1)} · 10-step cascade loss path
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cascadeSim}>
                    <defs>
                      <linearGradient id="casc_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.red} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={T.red} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="step" tick={{ fontSize: 11 }} label={{ value: 'Cascade Step', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toFixed(1)} />
                    <Area type="monotone" dataKey="loss" stroke={T.red} fill="url(#casc_grad)" strokeWidth={2} name="Systemic Loss" />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  {[
                    ['Beyond Threshold', `${tippingData.filter(s => s.tippingProximity > tipThreshold).length} / 20`, T.red],
                    ['Cascade Steps', cascadeSim.length, T.amber],
                    ['Peak Loss', `${cascadeSim[cascadeSim.length - 1].loss.toFixed(1)}`, T.red],
                  ].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ background: T.sub, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 90 }}>
                      <div style={{ fontSize: 10, color: T.muted }}>{lbl}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: col }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MC Distribution */}
            {showMCDist && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>
                    Monte Carlo Systemic Loss Distribution (n=1,000 paths)
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={mcBins}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="bin" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <ReferenceLine x={`${Math.floor(mcStats.var95 / 5) * 5}-${Math.floor(mcStats.var95 / 5) * 5 + 5}`} stroke={T.amber} strokeDasharray="4 2" />
                      <Bar dataKey="count" name="Frequency" radius={[2, 2, 0, 0]}>
                        {mcBins.map((d, i) => {
                          const midVal = (i + 0.5) * 5;
                          return <Cell key={i} fill={midVal > mcStats.var95 ? T.red : midVal > mcStats.mean ? T.amber : T.green} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, color: T.navy }}>Tail Risk Statistics</div>
                  {[
                    ['Mean Loss', `${mcStats.mean.toFixed(2)}`, T.text],
                    ['VaR (95%)', `${mcStats.var95.toFixed(2)}`, T.amber],
                    ['ES (99%)', `${mcStats.es99.toFixed(2)}`, T.red],
                    ['P(Systemic Event)', `${mcStats.probEvent.toFixed(1)}%`, T.red],
                  ].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.muted }}>{lbl}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: col }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: '8px 12px', background: mcStats.probEvent > 15 ? '#fef2f2' : '#f0fdf4', borderRadius: 6, fontSize: 11, color: mcStats.probEvent > 15 ? T.red : T.green, fontWeight: 600 }}>
                    {mcStats.probEvent > 20 ? 'HIGH systemic tail risk — FSOC notification threshold breached' :
                     mcStats.probEvent > 10 ? 'MODERATE tail risk — ESRB watch list elevated' :
                     'CONTAINED — tail risk within normal bounds'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ TAB 8 — CROSS-BORDER CONTAGION ══════════════════ */}
        {tab === 8 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <SectionTitle>Cross-Border Contagion — 8-Region Bilateral Exposure</SectionTitle>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Region A:</span>
                  <select value={regionA} onChange={e => setRegionA(+e.target.value)}
                    style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                    {REGIONS.map((r, i) => <option key={i} value={i}>{r}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Region B:</span>
                  <select value={regionB} onChange={e => setRegionB(+e.target.value)}
                    style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                    {REGIONS.map((r, i) => <option key={i} value={i}>{r}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: T.muted }}>Exp. Floor ($BN):</span>
                  <input type="range" min={50} max={220} value={expThreshold} onChange={e => setExpThreshold(+e.target.value)} style={{ width: 100 }} />
                  <span style={{ fontWeight: 700 }}>${expThreshold}BN</span>
                </div>
                <button onClick={() => setShowFX(!showFX)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: showFX ? T.teal : T.card, color: showFX ? '#fff' : T.text, cursor: 'pointer' }}>
                  {showFX ? 'FX Channel ON' : 'FX Channel OFF'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* 8×8 Heat Matrix */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Bilateral Exposure Heat Map ($BN)</div>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 6px', background: T.sub }}></th>
                      {REGIONS.map((r, j) => (
                        <th key={j} style={{ padding: '4px 6px', background: j === regionB ? T.indigo : T.navy, color: '#fff', fontWeight: 600, textAlign: 'center' }}>{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REGIONS.map((r, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 6px', fontWeight: 600, background: i === regionA ? T.indigo : T.sub, color: i === regionA ? '#fff' : T.text }}>{r}</td>
                        {REGIONS.map((_, j) => {
                          const v = CROSS_BORDER_MATRIX[i][j];
                          const isSelected = (i === regionA && j === regionB) || (i === regionB && j === regionA);
                          return (
                            <td key={j} style={{
                              padding: '5px 8px', textAlign: 'right', fontWeight: isSelected ? 700 : 400,
                              background: i === j ? '#f0f0f0' : isSelected ? '#eef2ff' : `rgba(79,70,229,${Math.min(0.5, v / 250).toFixed(2)})`,
                              color: isSelected ? T.indigo : i === j ? T.muted : v > 180 ? T.red : v > 130 ? T.amber : T.text,
                              border: isSelected ? `2px solid ${T.indigo}` : undefined,
                            }}>
                              {i === j ? '—' : v.toFixed(0)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#eef2ff', borderRadius: 6, fontSize: 12, color: T.indigo, fontWeight: 600 }}>
                  {REGIONS[regionA]} ↔ {REGIONS[regionB]}: ${bilateralAB.toFixed(1)}BN bilateral exposure
                </div>
              </div>

              {/* Strongest pairs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Highest-Risk Cross-Border Pairs (≥${expThreshold}BN)</div>
                  {crossBorderPairs.length === 0 ? (
                    <div style={{ fontSize: 12, color: T.muted }}>No pairs above ${expThreshold}BN threshold.</div>
                  ) : (
                    crossBorderPairs.slice(0, 8).map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{p.from} ↔ {p.to}</span>
                        <span style={{ fontWeight: 700, color: p.exposure > 180 ? T.red : p.exposure > 130 ? T.amber : T.text }}>${p.exposure.toFixed(0)}BN</span>
                      </div>
                    ))
                  )}
                </div>

                {showFX && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: T.navy }}>FX Amplification Channel</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={fxAmplification}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="fxStress" name="FX Stress" fill={T.amber} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="capitalFlowRisk" name="Capital Flow Risk" fill={T.red} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB 9 — SUMMARY & EXPORT ═══════════════════════ */}
        {tab === 9 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <SectionTitle>Summary Report & Regulatory Export</SectionTitle>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button onClick={() => setShowRecs(!showRecs)} style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: showRecs ? T.indigo : T.card, color: showRecs ? '#fff' : T.text, cursor: 'pointer' }}>
                  {showRecs ? 'Recommendations ON' : 'Recommendations OFF'}
                </button>
                <select value={reportFormat} onChange={e => setReportFormat(e.target.value)}
                  style={{ padding: '5px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card }}>
                  <option value="board">Board-Level Report</option>
                  <option value="technical">Technical Report</option>
                </select>
              </div>
            </div>

            {/* SCRI composite summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
              <KpiCard label="SCRI Composite" value={gdpWeightedSRI.toFixed(1)} color={gdpWeightedSRI > 55 ? T.red : gdpWeightedSRI > 40 ? T.amber : T.green} sub="GDP-weighted systemic index" />
              <KpiCard label="Indicator Breaches" value={`${breachCount} / 25`} color={breachCount > 10 ? T.red : T.amber} sub="FSOC/ESRB threshold violations" />
              <KpiCard label="Amplification" value={`${ampFactor.toFixed(3)}×`} color={ampFactor > 1.6 ? T.red : T.amber} sub="Combined channel multiplier" />
              <KpiCard label="P(Systemic Event)" value={`${mcStats.probEvent}%`} color={mcStats.probEvent > 15 ? T.red : T.green} sub="MC VaR-derived probability" />
            </div>

            {/* Top 10 risks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 10 Systemic Risks — Ranked by SRI</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Sector</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>SRI</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Tipping</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Contagion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10Risks.map(r => (
                      <tr key={r.rank} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', color: r.rank <= 3 ? T.red : T.muted, fontWeight: 700 }}>{r.rank}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.sector}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: r.scri > 65 ? T.red : T.amber, fontWeight: 600 }}>{r.scri.toFixed(1)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.tipping.toFixed(1)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.contagion.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* FSOC Recommendations */}
                {showRecs && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>
                      {reportFormat === 'board' ? 'Board-Level' : 'Technical'} FSOC/ESRB Regulatory Recommendations
                    </div>
                    {[
                      { priority: 'P0', label: 'Activate Climate CCyB', detail: reportFormat === 'board' ? `Raise counter-cyclical capital buffer to 2.5% for top-${tippingData.filter(s => s.tippingProximity > tipThreshold).length} tipping-point sectors immediately` : `CCyB activation via ESRB Article 136 CRD IV mechanism; sector-specific buffers per EBA RTS §58. Trigger: SCRI > ${ragThreshold}. Affected: ${tippingData.filter(s => s.tippingProximity > tipThreshold).length} sectors.`, color: T.red },
                      { priority: 'P0', label: 'Mandatory Stranded Asset Stress Tests', detail: reportFormat === 'board' ? `All G-SIBs must submit climate stress test results using NGFS Hot House World scenario within 90 days` : `Supervisory stress test per ECB/EBA joint methodology 2024. Scenarios: NGFS 1.5°C Orderly + 3°C Disorderly. Horizon: 2030, 2050. Reporting: COREP template extension.`, color: T.red },
                      { priority: 'P1', label: 'Cross-Border Exposure Reporting Enhancement', detail: reportFormat === 'board' ? `Enhance bilateral climate-adjusted exposure reporting between ${REGIONS[regionA]} and ${REGIONS[regionB]} given $${bilateralAB.toFixed(0)}BN exposure` : `BCBS climate RWA reporting enhancements: bilateral climate-stress EAD capture per BCBS d530. Quarterly climate-adjusted COREP amendment required for exposures > $50BN.`, color: T.amber },
                      { priority: 'P1', label: 'Network Contagion Circuit Breaker', detail: reportFormat === 'board' ? `Deploy network-level circuit breakers for the ${contagionAffected.length} sectors showing contagion intensity above ${contagionThresh.toFixed(2)} from a ${SECTORS[contagionSource].name} shock` : `Macroprudential circuit breaker implementation per FSB 2024 guidance on non-bank financial intermediation (NBFI) contagion controls. Dynamic threshold recalibration quarterly.`, color: T.amber },
                      { priority: 'P2', label: 'Green Supporting Factor Recalibration', detail: reportFormat === 'board' ? `Recalibrate green supporting factor to 0.75× across qualifying taxonomy-aligned assets to channel credit toward low-carbon transition` : `EU Taxonomy Regulation Article 10 green supporting factor at 0.75× for taxonomy-aligned Capex > 50% of total. CET1 capital relief capped at 150bps. EBA review Q3 2025.`, color: T.green },
                    ].map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ background: rec.color, color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 10, fontWeight: 700, height: 18, whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: 2 }}>{rec.priority}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{rec.label}</div>
                          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{rec.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Macro-prudential summary */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: T.navy }}>Macro-Prudential Policy Recommendations</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {MACRO_TOOLS.map((t, i) => {
                  const recommended = t.id === 0 ? Math.min(t.max, toolLevels[i] + 1.0) :
                                      t.id === 1 ? Math.min(t.max, toolLevels[i] + 0.5) :
                                      t.id === 4 ? Math.min(t.max, toolLevels[i] + 25) :
                                      toolLevels[i];
                  return (
                    <div key={t.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px', borderLeft: `3px solid ${t.color}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{t.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: T.muted }}>Current:</span>
                        <span style={{ fontWeight: 600 }}>{toolLevels[i].toFixed(2)}{t.unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: T.muted }}>Recommended:</span>
                        <span style={{ fontWeight: 700, color: recommended !== toolLevels[i] ? T.green : T.muted }}>{recommended.toFixed(2)}{t.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Export simulation */}
            <div style={{ background: T.sub, borderRadius: 8, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: T.muted, flex: 1 }}>
                Export simulation: SCRI = {gdpWeightedSRI.toFixed(1)} · Breaches = {breachCount}/25 · Amplification = {ampFactor.toFixed(3)}× · P(Event) = {mcStats.probEvent}% · Format: {reportFormat === 'board' ? 'Board Report' : 'Technical Annex'}
              </div>
              {['CSV Export', 'XBRL Package', 'FSOC Report', 'ESRB Notification'].map(btn => (
                <button key={btn} style={{ padding: '7px 16px', fontSize: 11, fontWeight: 600, border: `1px solid ${T.indigo}`, borderRadius: 4, background: T.card, color: T.indigo, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {btn}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
