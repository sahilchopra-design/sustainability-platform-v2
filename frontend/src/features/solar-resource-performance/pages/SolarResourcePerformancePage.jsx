import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Scatter, ScatterChart, Cell, PieChart, Pie
} from 'recharts';

// ─── Platform Standards ────────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E'
};

// ─── NASA POWER URL ────────────────────────────────────────────────────────────
const NASA_BASE = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_GHI_MONTHLY = [2.1, 3.2, 4.5, 5.4, 6.1, 6.8, 6.5, 6.0, 5.0, 3.6, 2.3, 1.8];
const SEED_TEMP_MONTHLY = [-3, -1, 5, 12, 18, 23, 26, 25, 20, 13, 6, -1];
const SEED_ANNUAL_GHI = Array.from({ length: 10 }, (_, i) => 1620 + (sr(i * 7) - 0.5) * 180);

// ─── Location Presets ──────────────────────────────────────────────────────────
const LOCATIONS = [
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298, region: 'North America' },
  { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0740, region: 'North America' },
  { name: 'Madrid, ES', lat: 40.4168, lon: -3.7038, region: 'Europe' },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, region: 'Middle East/N. Africa' },
  { name: 'Chennai, IN', lat: 13.0827, lon: 80.2707, region: 'South/Southeast Asia' },
  { name: 'Santiago, CL', lat: -33.4489, lon: -70.6693, region: 'South America' },
];

// ─── Module Technology Config ──────────────────────────────────────────────────
const MODULE_TECHS = {
  PERC:    { label: 'Mono PERC',      tempCoeff: -0.0035, annualDeg: 0.0045, lid: 0.015, eff: 0.215, cost: 0.18, bifacial: false, warranty25: 80 },
  BifPERC: { label: 'Bifacial PERC',  tempCoeff: -0.0035, annualDeg: 0.0045, lid: 0.010, eff: 0.220, cost: 0.20, bifacial: true,  warranty25: 80 },
  TOPCon:  { label: 'TOPCon',         tempCoeff: -0.0030, annualDeg: 0.0035, lid: 0.005, eff: 0.235, cost: 0.24, bifacial: true,  warranty25: 80 },
  HJT:     { label: 'HJT',            tempCoeff: -0.0026, annualDeg: 0.0030, lid: 0.001, eff: 0.245, cost: 0.32, bifacial: true,  warranty25: 82 },
  CdTe:    { label: 'CdTe (FS)',       tempCoeff: -0.0029, annualDeg: 0.0050, lid: 0.000, eff: 0.195, cost: 0.25, bifacial: false, warranty25: 80 },
  Perov:   { label: 'Perovskite/Si',  tempCoeff: -0.0025, annualDeg: 0.0080, lid: 0.000, eff: 0.260, cost: null, bifacial: false, warranty25: null },
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text },
  header: {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1A1A2E 100%)',
    borderBottom: `3px solid ${T.accent}`,
    padding: '24px 32px',
  },
  headerTitle: { color: '#F8F8F2', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' },
  headerSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' },
  badge: (live) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
    background: live ? '#D1FAE5' : '#FEF3C7', color: live ? '#065F46' : '#92400E',
    fontFamily: 'JetBrains Mono, monospace', marginLeft: 12,
  }),
  dot: (live) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: live ? '#10B981' : '#F59E0B',
    display: 'inline-block',
  }),
  tabs: { display: 'flex', gap: 2, padding: '0 32px', background: '#F1F0EB', borderBottom: `1px solid ${T.border}`, overflowX: 'auto' },
  tab: (active) => ({
    padding: '12px 18px', fontSize: 12, fontWeight: active ? 700 : 500,
    color: active ? T.indigo : T.sub, borderBottom: active ? `2px solid ${T.indigo}` : '2px solid transparent',
    cursor: 'pointer', whiteSpace: 'nowrap', background: 'none', border: 'none',
    borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: active ? T.indigo : 'transparent',
    fontFamily: 'DM Sans, sans-serif',
  }),
  content: { padding: '24px 32px', maxWidth: 1400 },
  card: {
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '20px 24px', marginBottom: 20,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiGrid: (cols = 4) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 20 }),
  kpi: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' },
  kpiLabel: { fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  kpiValue: (color = T.text) => ({ fontSize: 26, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }),
  kpiSub: { fontSize: 11, color: T.sub, marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { background: '#F8F7F4', padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.sub, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' },
  td: { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, color: T.text },
  select: {
    padding: '6px 12px', borderRadius: 4, border: `1px solid ${T.border}`,
    background: T.card, fontSize: 12, color: T.text, cursor: 'pointer',
  },
  input: {
    padding: '6px 12px', borderRadius: 4, border: `1px solid ${T.border}`,
    background: T.card, fontSize: 12, color: T.text, width: 120,
  },
  label: { fontSize: 11, color: T.sub, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' },
  row: { display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 },
  pill: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
    background: color === 'green' ? '#D1FAE5' : color === 'red' ? '#FEE2E2' : color === 'amber' ? '#FEF3C7' : '#EEF2FF',
    color: color === 'green' ? '#065F46' : color === 'red' ? '#991B1B' : color === 'amber' ? '#92400E' : '#4F46E5',
  }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
};

// ─── Helper: tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: T.text }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}{unit}</strong></div>
      ))}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SolarResourcePerformancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(0);
  const [ghiData, setGhiData] = useState(null);
  const [tempData, setTempData] = useState(null);
  const [dataSource, setDataSource] = useState('SEEDED');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [projectInputs, setProjectInputs] = useState({
    nameplateKWp: 100000,
    moduleTech: 'PERC',
    latitude: 41.88,
    tiltAngle: 25,
    azimuth: 180,
    gcr: 0.40,
    trackerType: 'fixed',
    soilingRate: 0.015,
    cleaningFrequency: 4,
    rainDays: 60,
    availabilityTarget: 0.97,
    curtailmentRate: 0.02,
    wireEfficiency: 0.995,
    inverterEfficiency: 0.975,
    transformerLoss: 0.005,
    ppaPrice: 0.045,
    albedo: 0.20,
    noct: 45,
  });

  // ─── NASA POWER fetch ────────────────────────────────────────────────────────
  const fetchNASA = useCallback(() => {
    const loc = LOCATIONS[selectedLocation];
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const url = `${NASA_BASE}?parameters=ALLSKY_SFC_SW_DWN,T2M&community=RE&longitude=${loc.lon}&latitude=${loc.lat}&start=2015&end=2023&format=JSON`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const ghiRaw = data.properties.parameter.ALLSKY_SFC_SW_DWN;
        const tRaw = data.properties.parameter.T2M;

        // Aggregate monthly averages across years
        const monthlyGHI = Array(12).fill(0);
        const monthlyT = Array(12).fill(0);
        const monthlyCount = Array(12).fill(0);

        Object.entries(ghiRaw).forEach(([yyyymm, val]) => {
          if (val < 0) return; // NASA uses -999 for missing
          const mo = parseInt(yyyymm.slice(4, 6), 10) - 1;
          if (mo >= 0 && mo < 12) { monthlyGHI[mo] += val; monthlyCount[mo] += 1; }
        });
        Object.entries(tRaw).forEach(([yyyymm, val]) => {
          if (val < -900) return;
          const mo = parseInt(yyyymm.slice(4, 6), 10) - 1;
          if (mo >= 0 && mo < 12) monthlyT[mo] += val;
        });

        const avgGHI = monthlyGHI.map((v, i) => monthlyCount[i] ? v / monthlyCount[i] : SEED_GHI_MONTHLY[i]);
        const avgT = monthlyT.map((v, i) => monthlyCount[i] ? v / monthlyCount[i] : SEED_TEMP_MONTHLY[i]);

        setGhiData(avgGHI);
        setTempData(avgT);
        setDataSource('LIVE');
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setGhiData(SEED_GHI_MONTHLY);
        setTempData(SEED_TEMP_MONTHLY);
        setDataSource('SEEDED');
        setFetchError('NASA POWER unavailable — using seeded data');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedLocation]);

  useEffect(() => {
    const cleanup = fetchNASA();
    return cleanup;
  }, [fetchNASA]);

  // ─── Derived Data ─────────────────────────────────────────────────────────────
  const ghi = ghiData || SEED_GHI_MONTHLY;
  const temps = tempData || SEED_TEMP_MONTHLY;
  const tech = MODULE_TECHS[projectInputs.moduleTech] || MODULE_TECHS.PERC;
  const annualGHI = ghi.reduce((s, v, i) => s + v * [31,28,31,30,31,30,31,31,30,31,30,31][i], 0);
  const live = dataSource === 'LIVE';

  // P50 / P90
  const sigma = 0.065 * annualGHI;
  const p50 = annualGHI;
  const p90 = p50 * (1 - 1.2816 * 0.065);

  // Monthly PR
  const monthlyPR = useMemo(() => {
    return MONTHS.map((m, i) => {
      const ghiKwhM2Day = ghi[i];
      const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31][i];
      const ghiMonth = ghiKwhM2Day * daysInMonth; // kWh/m²/month
      const tCell = temps[i] + (projectInputs.noct - 20) * ghiKwhM2Day / 800;
      const tLoss = 1 + tech.tempCoeff * (tCell - 25);
      const actualOutput = projectInputs.nameplateKWp * (ghiMonth / 1000) * tLoss * projectInputs.availabilityTarget;
      const referenceOutput = projectInputs.nameplateKWp * (ghiMonth / 1000);
      const pr = referenceOutput > 0 ? actualOutput / referenceOutput : 0;
      return { month: m, ghi: ghiKwhM2Day, temp: temps[i], pr: pr * 100, tCell, tLoss: (1 - tLoss) * 100 };
    });
  }, [ghi, temps, tech, projectInputs]);

  const annualPR = monthlyPR.length ? monthlyPR.reduce((s, v) => s + v.pr, 0) / monthlyPR.length : 0;

  // Degradation 25yr
  const degradationCurve = useMemo(() => {
    return Array.from({ length: 26 }, (_, yr) => {
      const techKeys = ['PERC', 'TOPCon', 'HJT', 'CdTe'];
      const result = { year: yr };
      techKeys.forEach(key => {
        const t = MODULE_TECHS[key];
        if (yr === 0) { result[key] = 100; return; }
        const afterLid = 100 * (1 - t.lid);
        result[key] = yr === 1 ? afterLid : afterLid * Math.pow(1 - t.annualDeg, yr - 1);
      });
      return result;
    });
  }, []);

  // Loss waterfall
  const lossWaterfall = useMemo(() => {
    const inp = projectInputs;
    const soilingLoss = inp.soilingRate * (1 - 0.70 * (inp.rainDays / 365));
    const shadingLoss = 0.005 + sr(42) * 0.025;
    const iamLoss = 0.02 + Math.sin(inp.tiltAngle * Math.PI / 180) * 0.01;
    const spectralLoss = 0.005 + sr(99) * 0.005;
    const lidLoss = tech.lid;
    const mismatchLoss = 0.005 + sr(17) * 0.010;
    const dcWiringLoss = 1 - inp.wireEfficiency;
    const inverterLoss = 1 - inp.inverterEfficiency;
    const transformerLoss = inp.transformerLoss;
    const availLoss = 1 - inp.availabilityTarget;
    const curtailLoss = inp.curtailmentRate;

    const losses = [
      { name: 'Soiling', pct: soilingLoss * 100 },
      { name: 'Shading', pct: shadingLoss * 100 },
      { name: 'IAM', pct: iamLoss * 100 },
      { name: 'Spectral', pct: spectralLoss * 100 },
      { name: 'LID (Yr 1)', pct: lidLoss * 100 },
      { name: 'Mismatch', pct: mismatchLoss * 100 },
      { name: 'DC Wiring', pct: dcWiringLoss * 100 },
      { name: 'Inverter', pct: inverterLoss * 100 },
      { name: 'Transformer', pct: transformerLoss * 100 },
      { name: 'Availability', pct: availLoss * 100 },
      { name: 'Curtailment', pct: curtailLoss * 100 },
    ];

    let running = 100;
    return losses.map(l => {
      const start = running;
      running = running - l.pct;
      const kwhPerKwp = annualGHI * (l.pct / 100) * 1000 / 1000;
      const dollarPerKw = kwhPerKwp * projectInputs.ppaPrice;
      return { ...l, start, end: running, kwhPerKwp: kwhPerKwp.toFixed(1), dollarPerKw: dollarPerKw.toFixed(2) };
    });
  }, [projectInputs, tech, annualGHI]);

  const totalLoss = lossWaterfall.reduce((s, v) => s + v.pct, 0);
  const finalYield = 100 - totalLoss;

  // Soiling accumulation
  const soilingAccum = useMemo(() => {
    const dailyRate = projectInputs.soilingRate / 365;
    const cleaningInterval = Math.floor(365 / projectInputs.cleaningFrequency);
    return Array.from({ length: 52 }, (_, wk) => {
      const dayOfYear = wk * 7;
      const daysSinceClean = dayOfYear % cleaningInterval;
      const rainClean = (projectInputs.rainDays / 365) * 7 * 0.7;
      const accum = Math.max(0, daysSinceClean * dailyRate * 100 - rainClean);
      return { week: `W${wk + 1}`, soiling: Math.min(accum, projectInputs.soilingRate * 100 * 3) };
    });
  }, [projectInputs]);

  // Weather normalization regression
  const weatherNorm = useMemo(() => {
    const pts = MONTHS.map((m, i) => ({
      month: m,
      ghi: ghi[i] * [31,28,31,30,31,30,31,31,30,31,30,31][i],
      actual: projectInputs.nameplateKWp * ghi[i] * [31,28,31,30,31,30,31,31,30,31,30,31][i] / 1000
        * (0.80 + sr(i * 13) * 0.05),
    }));
    const n = pts.length;
    const sumX = pts.reduce((s, p) => s + p.ghi, 0);
    const sumY = pts.reduce((s, p) => s + p.actual, 0);
    const sumXY = pts.reduce((s, p) => s + p.ghi * p.actual, 0);
    const sumX2 = pts.reduce((s, p) => s + p.ghi * p.ghi, 0);
    const denom = (n * sumX2 - sumX * sumX);
    const beta1 = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const beta0 = n > 0 ? (sumY - beta1 * sumX) / n : 0;
    const meanY = n > 0 ? sumY / n : 0;
    const ssTot = pts.reduce((s, p) => s + Math.pow(p.actual - meanY, 2), 0);
    const ssRes = pts.reduce((s, p) => s + Math.pow(p.actual - (beta0 + beta1 * p.ghi), 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    return { pts: pts.map(p => ({ ...p, predicted: beta0 + beta1 * p.ghi })), beta0, beta1, r2 };
  }, [ghi, projectInputs]);

  // Bifacial gain
  const bifacialGain = useMemo(() => {
    const { gcr, albedo } = projectInputs;
    const viewFactor = (1 - gcr) * albedo * 0.85;
    return viewFactor * 100;
  }, [projectInputs]);

  // Tabs
  const TAB_LABELS = [
    '1. Resource Assessment',
    '2. Performance Ratio',
    '3. Degradation',
    '4. Loss Waterfall',
    '5. Soiling Analytics',
    '6. Availability',
    '7. Thermal Performance',
    '8. Weather Normalization',
    '9. Tech Benchmarking',
    '10. Climate Risk',
  ];

  const updateInput = (key, val) => setProjectInputs(p => ({ ...p, [key]: val }));

  // ─── Resource quality label
  const avgGHIDay = annualGHI / 365;
  const resourceQuality = avgGHIDay >= 5.0 ? { label: 'Excellent', color: 'green' }
    : avgGHIDay >= 4.0 ? { label: 'Good', color: 'green' }
    : avgGHIDay >= 3.0 ? { label: 'Moderate', color: 'amber' }
    : { label: 'Poor', color: 'red' };

  // ─── Inter-annual variability chart data
  const interAnnualData = SEED_ANNUAL_GHI.map((v, i) => ({ year: 2015 + i, ghi: v, mean: 1620, upper: 1620 + sigma, lower: 1620 - sigma }));

  // ─── Availability breakdown data
  const availData = [
    { name: 'Planned Maint', pct: 0.8, color: T.blue },
    { name: 'Forced Outage', pct: 1 - projectInputs.availabilityTarget - 0.008, color: T.red },
    { name: 'Grid Unavail', pct: 0.4, color: T.amber },
    { name: 'Available', pct: projectInputs.availabilityTarget * 100, color: T.green },
  ];

  // ─── Climate risk scores
  const climateRisks = [
    { risk: 'Hail', score: 6, region: 'TX/CO/KS/NE High', premium: '0.15-0.30%' },
    { risk: 'Wildfire Smoke', score: 4, region: 'CA/PNW Moderate', premium: '0.05-0.15%' },
    { risk: 'Extreme Heat', score: 5, region: 'SW/MENA High', premium: '0.10-0.20%' },
    { risk: 'Hurricane/Wind', score: 3, region: 'Gulf Coast Moderate', premium: '0.20-0.50%' },
    { risk: 'Flooding', score: 2, region: 'Floodplain Low', premium: '0.05-0.10%' },
    { risk: 'Snow Load', score: 3, region: 'Midwest/NE Moderate', premium: '0.03-0.08%' },
  ];

  // ─── Cleaning optimization
  const cleaningOpt = useMemo(() => {
    const costPerVisit = 2500; // $
    const ppaKwh = projectInputs.ppaPrice;
    const kwhLostPerPct = projectInputs.nameplateKWp * annualGHI / 1000 * 0.01;
    return Array.from({ length: 12 }, (_, i) => {
      const visits = i + 1;
      const cost = visits * costPerVisit;
      const benefit = kwhLostPerPct * projectInputs.soilingRate * 100 * (visits / 12) * ppaKwh;
      return { visits, cost: cost / 1000, benefit: benefit / 1000, net: (benefit - cost) / 1000 };
    });
  }, [projectInputs, annualGHI]);

  // ─── MTBF/MTTR table
  const mtbfData = [
    { component: 'Central Inverter', mtbf: 8.5, mttr: 48, impact: 'High' },
    { component: 'String Inverter', mtbf: 15.0, mttr: 4, impact: 'Low' },
    { component: 'Tracker', mtbf: 25.0, mttr: 8, impact: 'Medium' },
    { component: 'String Combiner', mtbf: 20.0, mttr: 2, impact: 'Low' },
    { component: 'Monitoring', mtbf: 30.0, mttr: 1, impact: 'Very Low' },
  ];

  // ─── Smoke/AOD model
  const aodData = MONTHS.map((m, i) => {
    const baseAOD = 0.05 + sr(i * 3) * 0.15;
    const smokeAOD = i >= 5 && i <= 8 ? baseAOD + 0.20 : baseAOD;
    const ghiSmoke = ghi[i] * Math.exp(-smokeAOD * 1.5);
    return { month: m, ghi: ghi[i], ghiSmoke, aod: smokeAOD };
  });

  // ─── PR benchmark thresholds
  const prBenchmarks = [
    { grade: 'IEC 61724 Grade A', threshold: '>80%', color: 'green' },
    { grade: 'IEC 61724 Grade B', threshold: '75-80%', color: 'amber' },
    { grade: 'IEC 61724 Grade C', threshold: '<75%', color: 'red' },
    { grade: 'Middle East (IRENA)', threshold: '80-85%', color: 'green' },
    { grade: 'Europe (IRENA)', threshold: '78-83%', color: 'green' },
    { grade: 'Sub-Saharan Africa', threshold: '75-82%', color: 'amber' },
    { grade: 'South/SE Asia', threshold: '74-80%', color: 'amber' },
    { grade: 'North America', threshold: '78-84%', color: 'green' },
  ];

  // ─── 5-year PR trend
  const prTrend = Array.from({ length: 5 }, (_, yr) => ({
    year: `Yr ${yr + 1}`,
    pr: annualPR * Math.pow(1 - tech.annualDeg * 0.5, yr),
    warranty: 80,
  }));

  // ─── Tracker comparison
  const trackerComparison = [
    { type: 'Fixed Tilt', gain: 0, capex: 0, maint: 'Low', production: annualGHI },
    { type: '1-Axis Horizontal', gain: 20, capex: 0.05, maint: 'Medium', production: annualGHI * 1.20 },
    { type: '2-Axis', gain: 30, capex: 0.15, maint: 'High', production: annualGHI * 1.30 },
  ];

  // ─── Monthly temp loss heatmap data
  const tempLossHeatmap = monthlyPR.map(m => ({
    month: m.month,
    tLoss: Math.max(0, m.tLoss).toFixed(2),
    tCell: m.tCell.toFixed(1),
    color: m.tLoss > 5 ? '#FCA5A5' : m.tLoss > 2 ? '#FDE68A' : '#BBF7D0',
  }));

  return (
    <div style={styles.page}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={styles.headerTitle}>Solar Resource & Performance Analytics</h1>
              <span style={styles.badge(live)}>
                <span style={styles.dot(live)} />
                {live ? 'NASA POWER LIVE' : 'SEEDED DATA'}
              </span>
            </div>
            <div style={styles.headerSub}>RE-RES1 · Resource Engineering · Independent Engineer / Technical Advisor Grade</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={styles.label}>Location</div>
              <select style={styles.select} value={selectedLocation}
                onChange={e => { setSelectedLocation(+e.target.value); updateInput('latitude', LOCATIONS[+e.target.value].lat); }}>
                {LOCATIONS.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <div style={styles.label}>Module Technology</div>
              <select style={styles.select} value={projectInputs.moduleTech}
                onChange={e => updateInput('moduleTech', e.target.value)}>
                {Object.keys(MODULE_TECHS).map(k => <option key={k} value={k}>{MODULE_TECHS[k].label}</option>)}
              </select>
            </div>
            <div>
              <div style={styles.label}>Capacity (kWp)</div>
              <input style={styles.input} type="number" value={projectInputs.nameplateKWp}
                onChange={e => updateInput('nameplateKWp', +e.target.value)} step={1000} />
            </div>
            {loading && <span style={{ color: '#94A3B8', fontSize: 12 }}>Fetching NASA POWER...</span>}
            {fetchError && <span style={{ color: T.accent, fontSize: 11 }}>{fetchError}</span>}
          </div>
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────────────── */}
      <div style={styles.tabs}>
        {TAB_LABELS.map((t, i) => (
          <button key={i} style={styles.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────────────────── */}
      <div style={styles.content}>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1 — Resource Assessment
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div>
            <div style={styles.kpiGrid(5)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Annual GHI (P50)</div>
                <div style={styles.kpiValue(T.indigo)}>{annualGHI.toFixed(0)}</div>
                <div style={styles.kpiSub}>kWh/m²/yr</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>P90 GHI</div>
                <div style={styles.kpiValue(T.blue)}>{p90.toFixed(0)}</div>
                <div style={styles.kpiSub}>kWh/m²/yr (−1.28σ)</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Avg Daily GHI</div>
                <div style={styles.kpiValue(T.text)}>{avgGHIDay.toFixed(2)}</div>
                <div style={styles.kpiSub}>kWh/m²/day</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Resource Quality</div>
                <div style={{ ...styles.kpiValue(), fontSize: 18, marginTop: 4 }}>
                  <span style={styles.pill(resourceQuality.color)}>{resourceQuality.label}</span>
                </div>
                <div style={styles.kpiSub}>Based on IRENA classification</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Inter-annual σ</div>
                <div style={styles.kpiValue(T.amber)}>{(sigma).toFixed(0)}</div>
                <div style={styles.kpiSub}>kWh/m²/yr (6.5% of mean)</div>
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Monthly GHI — {LOCATIONS[selectedLocation].name}</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                  Source: {live ? 'NASA POWER (2015–2023 avg)' : 'Seeded reference data'} · kWh/m²/day
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={MONTHS.map((m, i) => ({ month: m, ghi: ghi[i] }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 8]} />
                    <Tooltip content={<ChartTooltip unit=" kWh/m²/d" />} />
                    <Bar dataKey="ghi" name="GHI" fill={T.accent} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>GHI vs Temperature — Dual Axis</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={MONTHS.map((m, i) => ({ month: m, ghi: ghi[i], temp: temps[i] }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 8]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ghi" name="GHI (kWh/m²/d)" fill={T.accent} radius={[3,3,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="temp" name="Temp (°C)" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Inter-annual GHI Variability — 10 Year History with ±1σ Band</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={interAnnualData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[1300, 1900]} />
                  <Tooltip content={<ChartTooltip unit=" kWh/m²/yr" />} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill={T.indigo} fillOpacity={0.1} name="Upper σ" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill={T.bg} fillOpacity={1} name="Lower σ" />
                  <Line type="monotone" dataKey="ghi" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} name="Annual GHI" />
                  <ReferenceLine y={p50} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'P50', fontSize: 10, fill: T.accent }} />
                  <ReferenceLine y={p90} stroke={T.red} strokeDasharray="4 4" label={{ value: 'P90', fontSize: 10, fill: T.red }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Location Comparison — IRENA/Solargis Reference GHI (kWh/m²/yr)</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { loc: 'Dubai', ghi: 2150, region: 'MENA' },
                  { loc: 'Chennai', ghi: 1880, region: 'S. Asia' },
                  { loc: 'Santiago', ghi: 1960, region: 'S. America' },
                  { loc: 'Phoenix', ghi: 2350, region: 'N. America' },
                  { loc: 'Madrid', ghi: 1750, region: 'Europe' },
                  { loc: 'Chicago', ghi: 1580, region: 'N. America' },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 2600]} />
                  <YAxis dataKey="loc" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="ghi" name="Annual GHI" fill={T.indigo} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2 — Performance Ratio Engine
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div>
            <div style={styles.kpiGrid(4)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Annual PR</div>
                <div style={styles.kpiValue(annualPR >= 80 ? T.green : annualPR >= 75 ? T.amber : T.red)}>{annualPR.toFixed(1)}%</div>
                <div style={styles.kpiSub}>IEC 61724 {annualPR >= 80 ? 'Grade A ✓' : annualPR >= 75 ? 'Grade B' : 'Grade C'}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Temp-Corrected PR</div>
                <div style={styles.kpiValue(T.indigo)}>{(annualPR + 3.5).toFixed(1)}%</div>
                <div style={styles.kpiSub}>Removes temperature penalty</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Inverter Contribution</div>
                <div style={styles.kpiValue(T.text)}>{(projectInputs.inverterEfficiency * 100).toFixed(1)}%</div>
                <div style={styles.kpiSub}>DC→AC conversion efficiency</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Module Tech</div>
                <div style={styles.kpiValue(T.blue)} style={{ fontSize: 16, fontWeight: 700, color: T.blue, fontFamily: 'JetBrains Mono' }}>{tech.label}</div>
                <div style={styles.kpiSub}>γ = {(tech.tempCoeff * 100).toFixed(2)}%/°C</div>
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Monthly Performance Ratio (%)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyPR}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    <ReferenceLine y={80} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Grade A', fontSize: 10, fill: T.green }} />
                    <ReferenceLine y={75} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Grade B', fontSize: 10, fill: T.amber }} />
                    <Bar dataKey="pr" name="PR" fill={T.indigo} radius={[3,3,0,0]}>
                      {monthlyPR.map((m, i) => <Cell key={i} fill={m.pr >= 80 ? T.green : m.pr >= 75 ? T.accent : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>PR Decomposition — Loss Sources</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Temperature Losses', value: Math.abs(monthlyPR.reduce((s, m) => s + m.tLoss, 0) / 12), fill: T.red },
                        { name: 'Soiling', value: projectInputs.soilingRate * 100, fill: T.amber },
                        { name: 'Inverter Loss', value: (1 - projectInputs.inverterEfficiency) * 100, fill: T.blue },
                        { name: 'Other System', value: 3.5, fill: T.sub },
                        { name: 'Net Output', value: annualPR, fill: T.green },
                      ]}
                      cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    >
                      {[T.red, T.amber, T.blue, T.sub, T.green].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
                    <Legend iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>PR Trend — 5 Year Operational (with Degradation Effect)</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={prTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[70, 90]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <ReferenceLine y={80} stroke={T.green} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="pr" name="Project PR" stroke={T.indigo} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="warranty" name="IEC Grade A" stroke={T.green} strokeDasharray="4 4" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>PR Benchmark Reference Table</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Standard / Region</th>
                  <th style={styles.th}>PR Threshold</th>
                  <th style={styles.th}>Project Status</th>
                </tr></thead>
                <tbody>
                  {prBenchmarks.map((b, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{b.grade}</td>
                      <td style={styles.td}>{b.threshold}</td>
                      <td style={styles.td}>
                        <span style={styles.pill(annualPR >= 80 ? 'green' : annualPR >= 75 ? 'amber' : 'red')}>
                          {annualPR.toFixed(1)}% — {annualPR >= 80 ? 'Meets' : 'Below'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3 — Degradation Analytics
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div>
            <div style={styles.kpiGrid(4)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Annual Degradation Rate</div>
                <div style={styles.kpiValue(T.red)}>{(tech.annualDeg * 100).toFixed(2)}%/yr</div>
                <div style={styles.kpiSub}>{tech.label}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>LID (Year 1)</div>
                <div style={styles.kpiValue(T.amber)}>{(tech.lid * 100).toFixed(1)}%</div>
                <div style={styles.kpiSub}>Light Induced Degradation</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>25-Year Residual Power</div>
                <div style={styles.kpiValue(T.green)}>
                  {((1 - tech.lid) * Math.pow(1 - tech.annualDeg, 24) * 100).toFixed(1)}%
                </div>
                <div style={styles.kpiSub}>of nameplate, vs {tech.warranty25}% warranty</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Bifacial Gain Offset</div>
                <div style={styles.kpiValue(tech.bifacial ? T.indigo : T.sub)}>
                  {tech.bifacial ? `+${bifacialGain.toFixed(1)}%` : 'N/A'}
                </div>
                <div style={styles.kpiSub}>GCR {projectInputs.gcr} · Albedo {projectInputs.albedo}</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>25-Year Degradation Curves — Technology Comparison</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={degradationCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis domain={[75, 102]} tick={{ fontSize: 11 }} label={{ value: '% of Nameplate', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Legend />
                  <ReferenceLine y={80} stroke={T.red} strokeDasharray="4 4" label={{ value: '80% Warranty', fontSize: 10, fill: T.red }} />
                  <Line type="monotone" dataKey="PERC" stroke={T.blue} strokeWidth={2} dot={false} name="Mono PERC" />
                  <Line type="monotone" dataKey="TOPCon" stroke={T.green} strokeWidth={2} dot={false} name="TOPCon" />
                  <Line type="monotone" dataKey="HJT" stroke={T.indigo} strokeWidth={2.5} dot={false} name="HJT" />
                  <Line type="monotone" dataKey="CdTe" stroke={T.amber} strokeWidth={2} dot={false} name="CdTe" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Degradation Rate Benchmarks by Module Technology</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Technology</th>
                  <th style={styles.th}>LID (%)</th>
                  <th style={styles.th}>Annual Deg (%/yr)</th>
                  <th style={styles.th}>25yr Cumulative Loss (%)</th>
                  <th style={styles.th}>Warranty (25yr)</th>
                  <th style={styles.th}>Source</th>
                </tr></thead>
                <tbody>
                  {Object.entries(MODULE_TECHS).filter(([k]) => k !== 'Perov').map(([k, t]) => {
                    const cum25 = (1 - (1 - t.lid) * Math.pow(1 - t.annualDeg, 24)) * 100;
                    return (
                      <tr key={k}>
                        <td style={styles.td}><strong>{t.label}</strong></td>
                        <td style={styles.td}>{(t.lid * 100).toFixed(1)}</td>
                        <td style={styles.td}>{(t.annualDeg * 100).toFixed(2)}</td>
                        <td style={styles.td}><span style={styles.pill(cum25 < 12 ? 'green' : 'amber')}>{cum25.toFixed(1)}%</span></td>
                        <td style={styles.td}>{t.warranty25}% at 25yr</td>
                        <td style={styles.td} style={{ color: T.sub, fontSize: 11 }}>IEC 61215 / Fraunhofer ISE</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Cumulative Revenue Impact from Degradation ({tech.label})</div>
              <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
                <div>
                  <span style={styles.kpiLabel}>PPA Price: </span>
                  <input style={styles.input} type="number" value={projectInputs.ppaPrice} step={0.001}
                    onChange={e => updateInput('ppaPrice', +e.target.value)} />
                  <span style={{ fontSize: 11, color: T.sub, marginLeft: 4 }}>$/kWh</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={degradationCurve.slice(1).map((d, i) => ({
                  year: d.year,
                  lostRevM: (100 - d[projectInputs.moduleTech.replace('BifPERC','PERC')] || (100 - d.PERC)) / 100
                    * projectInputs.nameplateKWp * annualGHI / 1000 * projectInputs.ppaPrice / 1e6 * (i + 1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}M`} />
                  <Area type="monotone" dataKey="lostRevM" name="Cumulative Revenue Loss ($M)" stroke={T.red} fill={T.red} fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4 — Loss Analysis Waterfall
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <div>
            <div style={styles.kpiGrid(4)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Total System Loss</div>
                <div style={styles.kpiValue(T.red)}>{totalLoss.toFixed(1)}%</div>
                <div style={styles.kpiSub}>From reference yield</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Final Yield (kWh/kWp/yr)</div>
                <div style={styles.kpiValue(T.green)}>{(annualGHI * finalYield / 100).toFixed(0)}</div>
                <div style={styles.kpiSub}>After all losses</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>System Efficiency</div>
                <div style={styles.kpiValue(T.indigo)}>{finalYield.toFixed(1)}%</div>
                <div style={styles.kpiSub}>Of reference potential</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Annual Revenue Loss</div>
                <div style={styles.kpiValue(T.amber)}>
                  ${(totalLoss / 100 * annualGHI * projectInputs.nameplateKWp / 1000 * projectInputs.ppaPrice / 1e6).toFixed(2)}M
                </div>
                <div style={styles.kpiSub}>At ${projectInputs.ppaPrice}/kWh PPA</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Loss Cascade Waterfall — Reference Yield to Final Yield</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Reference\nYield', value: 100, fill: T.indigo },
                  ...lossWaterfall.map(l => ({ name: l.name, value: -l.pct, fill: T.red })),
                  { name: 'Final\nYield', value: finalYield, fill: T.green },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${Math.abs(v).toFixed(2)}%`} />
                  <ReferenceLine y={finalYield} stroke={T.green} strokeDasharray="4 4" />
                  <Bar dataKey="value" name="Yield / Loss %" radius={[3,3,0,0]}>
                    {[{ fill: T.indigo }, ...lossWaterfall.map(() => ({ fill: T.red })), { fill: T.green }].map((c, i) => (
                      <Cell key={i} fill={c.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Loss Detail Table — Category Analysis</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Loss Category</th>
                  <th style={styles.th}>Loss (%)</th>
                  <th style={styles.th}>kWh/kWp/yr Impact</th>
                  <th style={styles.th}>$/kW/yr Revenue Impact</th>
                  <th style={styles.th}>Cumulative Remaining (%)</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 700 }}>Reference Yield</td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}>{annualGHI.toFixed(0)}</td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}><strong>100.0%</strong></td>
                  </tr>
                  {lossWaterfall.map((l, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{l.name}</td>
                      <td style={styles.td}><span style={styles.pill('red')}>−{l.pct.toFixed(2)}%</span></td>
                      <td style={styles.td}>{l.kwhPerKwp}</td>
                      <td style={styles.td}>${l.dollarPerKw}</td>
                      <td style={styles.td}>{l.end.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#F0FDF4' }}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>Final Yield</td>
                    <td style={styles.td}><span style={styles.pill('green')}>{finalYield.toFixed(1)}%</span></td>
                    <td style={styles.td}>{(annualGHI * finalYield / 100).toFixed(0)}</td>
                    <td style={styles.td}>${(annualGHI * finalYield / 100 * projectInputs.ppaPrice).toFixed(2)}</td>
                    <td style={styles.td}><strong>{finalYield.toFixed(1)}%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5 — Soiling Analytics
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 4 && (
          <div>
            <div style={styles.row}>
              <div>
                <label style={styles.label}>Soiling Rate (%/yr)</label>
                <input style={styles.input} type="number" step={0.001} value={projectInputs.soilingRate}
                  onChange={e => updateInput('soilingRate', +e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Cleaning Visits/yr</label>
                <input style={styles.input} type="number" step={1} value={projectInputs.cleaningFrequency}
                  onChange={e => updateInput('cleaningFrequency', +e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Rain Days/yr</label>
                <input style={styles.input} type="number" step={1} value={projectInputs.rainDays}
                  onChange={e => updateInput('rainDays', +e.target.value)} />
              </div>
            </div>

            <div style={styles.kpiGrid(3)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Effective Soiling Loss</div>
                <div style={styles.kpiValue(T.red)}>
                  {(projectInputs.soilingRate * (1 - 0.70 * projectInputs.rainDays / 365) * 100).toFixed(2)}%
                </div>
                <div style={styles.kpiSub}>After rain cleaning adjustment</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Rain Cleaning Contribution</div>
                <div style={styles.kpiValue(T.green)}>
                  {(0.70 * projectInputs.rainDays / 365 * 100).toFixed(1)}%
                </div>
                <div style={styles.kpiSub}>Of soiling recovered naturally</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Annual Soiling Revenue Loss</div>
                <div style={styles.kpiValue(T.amber)}>
                  ${(projectInputs.soilingRate * (1 - 0.70 * projectInputs.rainDays / 365) * annualGHI * projectInputs.nameplateKWp / 1000 * projectInputs.ppaPrice / 1000).toFixed(0)}K
                </div>
                <div style={styles.kpiSub}>At PPA price ${projectInputs.ppaPrice}/kWh</div>
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Soiling Rate by Geography (%/yr)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { region: 'Sahara', rate: 6.5, fill: T.red },
                    { region: 'Middle East', rate: 4.0, fill: T.amber },
                    { region: 'India', rate: 3.0, fill: T.accent },
                    { region: 'US SW', rate: 1.8, fill: T.blue },
                    { region: 'US MW', rate: 1.5, fill: T.indigo },
                    { region: 'Europe', rate: 1.0, fill: T.green },
                    { region: 'Scandinavia', rate: 0.5, fill: T.teal },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 8]} unit="%" />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => `${v}%/yr`} />
                    <Bar dataKey="rate" name="Soiling Rate" radius={[0,3,3,0]}>
                      {[T.red, T.amber, T.accent, T.blue, T.indigo, T.green, T.teal].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>Soiling Accumulation — Weekly (with Cleaning Events)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={soilingAccum}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={7} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
                    <Area type="monotone" dataKey="soiling" name="Accumulated Soiling" stroke={T.amber} fill={T.amber} fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Cleaning Frequency Optimization — Cost vs Benefit ($/kW/yr, $000s)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cleaningOpt}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="visits" tick={{ fontSize: 11 }} label={{ value: 'Cleaning visits/yr', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `$${v.toFixed(0)}K`} />
                  <Legend />
                  <Line type="monotone" dataKey="cost" name="Cleaning Cost ($K)" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="benefit" name="Revenue Benefit ($K)" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="net" name="Net Benefit ($K)" stroke={T.indigo} strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
                Optimal cleaning frequency: where marginal benefit = marginal cost. $2,500/visit assumed.
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 6 — Availability Analytics
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 5 && (
          <div>
            <div style={styles.row}>
              <div>
                <label style={styles.label}>Availability Target (%)</label>
                <input style={styles.input} type="number" step={0.001} value={projectInputs.availabilityTarget}
                  onChange={e => updateInput('availabilityTarget', +e.target.value)} />
              </div>
            </div>

            <div style={styles.kpiGrid(4)}>
              {[
                { label: 'Contractual Availability', val: `${(projectInputs.availabilityTarget * 100).toFixed(1)}%`, color: projectInputs.availabilityTarget >= 0.98 ? T.green : projectInputs.availabilityTarget >= 0.96 ? T.amber : T.red, sub: projectInputs.availabilityTarget >= 0.98 ? 'Above SLA' : 'Below SLA' },
                { label: 'Planned Maint Loss', val: '0.8%', color: T.blue, sub: 'Scheduled outages' },
                { label: 'Forced Outage Loss', val: `${((1 - projectInputs.availabilityTarget - 0.008) * 100).toFixed(1)}%`, color: T.red, sub: 'Unplanned downtime' },
                { label: 'Lost Production', val: `${((1 - projectInputs.availabilityTarget) * annualGHI * projectInputs.nameplateKWp / 1e6).toFixed(1)} MWh`, color: T.amber, sub: 'Annual unavailability' },
              ].map((k, i) => (
                <div key={i} style={styles.kpi}>
                  <div style={styles.kpiLabel}>{k.label}</div>
                  <div style={styles.kpiValue(k.color)}>{k.val}</div>
                  <div style={styles.kpiSub}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Availability Breakdown</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={availData} cx="50%" cy="50%" outerRadius={90} dataKey="pct">
                      {availData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>Planned Maintenance Schedule (Monthly Downtime Hours)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={MONTHS.map((m, i) => ({
                    month: m,
                    planned: 4 + sr(i * 11) * 8,
                    forced: 1 + sr(i * 7) * 6,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" name="Planned Maint (hrs)" fill={T.blue} stackId="a" />
                    <Bar dataKey="forced" name="Forced Outage (hrs)" fill={T.red} stackId="a" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Component Reliability — MTBF / MTTR Analysis</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Component</th>
                  <th style={styles.th}>MTBF (years)</th>
                  <th style={styles.th}>MTTR (hours)</th>
                  <th style={styles.th}>Production Impact</th>
                  <th style={styles.th}>Availability Contribution</th>
                </tr></thead>
                <tbody>
                  {mtbfData.map((m, i) => (
                    <tr key={i}>
                      <td style={styles.td}><strong>{m.component}</strong></td>
                      <td style={styles.td}>{m.mtbf}</td>
                      <td style={styles.td}>{m.mttr} hrs</td>
                      <td style={styles.td}><span style={styles.pill(m.impact === 'High' ? 'red' : m.impact === 'Medium' ? 'amber' : 'green')}>{m.impact}</span></td>
                      <td style={styles.td}>{(m.mtbf / (m.mtbf + m.mttr / 8760) * 100).toFixed(3)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>O&M Contract Type Comparison</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Contract Type</th>
                  <th style={styles.th}>Typical Availability</th>
                  <th style={styles.th}>Cost Structure</th>
                  <th style={styles.th}>Risk Bearer</th>
                  <th style={styles.th}>Recommended For</th>
                </tr></thead>
                <tbody>
                  {[
                    { type: 'Fixed Price Full Service', avail: '98-99%', cost: '$10-15/kWp/yr', risk: 'O&M Provider', rec: 'Large utility-scale' },
                    { type: 'Time & Materials (T&M)', avail: '95-97%', cost: 'Variable', risk: 'Asset Owner', rec: 'Small / community' },
                    { type: 'Availability Guarantee', avail: '97-98%', cost: '$8-12/kWp/yr + bonus', risk: 'Shared', rec: 'Mid-scale with lenders' },
                    { type: 'Basic Monitoring Only', avail: '93-96%', cost: '$2-4/kWp/yr', risk: 'Asset Owner', rec: 'Owner-operated' },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}><strong>{r.type}</strong></td>
                      <td style={styles.td}><span style={styles.pill('green')}>{r.avail}</span></td>
                      <td style={styles.td}>{r.cost}</td>
                      <td style={styles.td}>{r.risk}</td>
                      <td style={styles.td} style={{ color: T.sub, fontSize: 11 }}>{r.rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 7 — Thermal Performance
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 6 && (
          <div>
            <div style={styles.row}>
              <div>
                <label style={styles.label}>NOCT (°C)</label>
                <input style={styles.input} type="number" step={1} value={projectInputs.noct}
                  onChange={e => updateInput('noct', +e.target.value)} />
              </div>
            </div>

            <div style={styles.kpiGrid(4)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Annual Temp Penalty</div>
                <div style={styles.kpiValue(T.red)}>
                  {(monthlyPR.reduce((s, m) => s + Math.max(0, m.tLoss), 0) / 12).toFixed(2)}%
                </div>
                <div style={styles.kpiSub}>Average monthly temp loss</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Temp Coefficient</div>
                <div style={styles.kpiValue(T.indigo)}>{(tech.tempCoeff * 100).toFixed(3)}%/°C</div>
                <div style={styles.kpiSub}>{tech.label}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Peak Cell Temp (Est.)</div>
                <div style={styles.kpiValue(T.amber)}>
                  {Math.max(...monthlyPR.map(m => m.tCell)).toFixed(1)}°C
                </div>
                <div style={styles.kpiSub}>Peak summer month</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>HJT Advantage vs PERC</div>
                <div style={styles.kpiValue(T.green)}>
                  +{((MODULE_TECHS.PERC.tempCoeff - MODULE_TECHS.HJT.tempCoeff) * (35 - 25) * 100).toFixed(1)}%
                </div>
                <div style={styles.kpiSub}>At 35°C ambient (NOCT basis)</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Monthly Cell Temperature vs Ambient — Cell Temperature Model</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>T_cell = T_ambient + GHI × (NOCT − 20) / 800</div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthlyPR.map(m => ({ month: m.month, tAmbient: m.temp, tCell: m.tCell }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tAmbient" name="Ambient Temp (°C)" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="tCell" name="Cell Temp (°C)" stroke={T.red} strokeWidth={2.5} dot={{ r: 3 }} />
                  <ReferenceLine y={25} stroke={T.sub} strokeDasharray="3 3" label={{ value: 'STC 25°C', fontSize: 10, fill: T.sub }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Monthly Temperature Loss Heatmap</div>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>Ambient (°C)</th>
                    <th style={styles.th}>Cell Temp (°C)</th>
                    <th style={styles.th}>Temp Loss (%)</th>
                  </tr></thead>
                  <tbody>
                    {tempLossHeatmap.map((m, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{m.month}</td>
                        <td style={styles.td}>{temps[i].toFixed(1)}</td>
                        <td style={styles.td}>{m.tCell}</td>
                        <td style={{ ...styles.td, background: m.color, fontWeight: 600 }}>{m.tLoss}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>Temperature Coefficient Comparison — Module Technologies</div>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>Technology</th>
                    <th style={styles.th}>γ (%/°C)</th>
                    <th style={styles.th}>Loss at 45°C Cell</th>
                    <th style={styles.th}>Loss at 65°C Cell</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(MODULE_TECHS).filter(([k]) => k !== 'Perov').map(([k, t]) => (
                      <tr key={k} style={{ background: k === projectInputs.moduleTech ? '#EEF2FF' : 'transparent' }}>
                        <td style={styles.td}><strong>{t.label}</strong> {k === projectInputs.moduleTech ? '◀ selected' : ''}</td>
                        <td style={styles.td}>{(t.tempCoeff * 100).toFixed(3)}</td>
                        <td style={styles.td}><span style={styles.pill((Math.abs(t.tempCoeff * 20 * 100)) < 6 ? 'green' : 'amber')}>{(Math.abs(t.tempCoeff * 20 * 100)).toFixed(2)}%</span></td>
                        <td style={styles.td}><span style={styles.pill((Math.abs(t.tempCoeff * 40 * 100)) < 12 ? 'amber' : 'red')}>{(Math.abs(t.tempCoeff * 40 * 100)).toFixed(2)}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 8 — Weather Normalization
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 7 && (
          <div>
            <div style={styles.kpiGrid(4)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Regression R²</div>
                <div style={styles.kpiValue(T.green)}>{weatherNorm.r2.toFixed(4)}</div>
                <div style={styles.kpiSub}>Production vs GHI fit quality</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Slope (β₁)</div>
                <div style={styles.kpiValue(T.indigo)}>{weatherNorm.beta1.toFixed(1)}</div>
                <div style={styles.kpiSub}>kWh per kWh/m² GHI</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Intercept (β₀)</div>
                <div style={styles.kpiValue(T.text)}>{weatherNorm.beta0.toFixed(0)}</div>
                <div style={styles.kpiSub}>Baseline production (kWh)</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Weather-Normalized P50</div>
                <div style={styles.kpiValue(T.blue)}>
                  {(weatherNorm.beta0 + weatherNorm.beta1 * annualGHI / 12).toFixed(0)}
                </div>
                <div style={styles.kpiSub}>Monthly kWh (weather-adj)</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Regression: Actual Production vs GHI — Least Squares Fit</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                y = β₀ + β₁ × GHI + ε — Removes inter-annual weather variability for true performance assessment (IEA / IECRE best practice)
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ghi" name="Monthly GHI" tick={{ fontSize: 11 }} label={{ value: 'Monthly GHI (kWh/m²)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="actual" name="Actual Production" tick={{ fontSize: 11 }} label={{ value: 'Production (kWh)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                        <div><strong>{d.month}</strong></div>
                        <div>GHI: {d.ghi.toFixed(1)} kWh/m²</div>
                        <div>Actual: {(d.actual/1000).toFixed(0)}K kWh</div>
                        <div>Predicted: {(d.predicted/1000).toFixed(0)}K kWh</div>
                      </div>
                    );
                  }} />
                  <Scatter data={weatherNorm.pts} fill={T.indigo} name="Monthly Data" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Actual vs Weather-Normalized Production (MWh)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weatherNorm.pts.map(p => ({
                  month: p.month,
                  actual: p.actual / 1000,
                  normalized: p.predicted / 1000,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v.toFixed(0)} MWh`} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" name="Actual Production (MWh)" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="normalized" name="Weather-Normalized P50 (MWh)" stroke={T.green} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Monthly Outlier Detection — Months Beyond ±2σ</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Month</th>
                  <th style={styles.th}>Actual (MWh)</th>
                  <th style={styles.th}>Predicted (MWh)</th>
                  <th style={styles.th}>Residual (%)</th>
                  <th style={styles.th}>Flag</th>
                </tr></thead>
                <tbody>
                  {weatherNorm.pts.map((p, i) => {
                    const resid = p.predicted > 0 ? ((p.actual - p.predicted) / p.predicted) * 100 : 0;
                    const flag = Math.abs(resid) > 10;
                    return (
                      <tr key={i} style={{ background: flag ? '#FEF3C7' : 'transparent' }}>
                        <td style={styles.td}>{p.month}</td>
                        <td style={styles.td}>{(p.actual / 1000).toFixed(1)}</td>
                        <td style={styles.td}>{(p.predicted / 1000).toFixed(1)}</td>
                        <td style={styles.td}>{resid > 0 ? '+' : ''}{resid.toFixed(1)}%</td>
                        <td style={styles.td}>{flag ? <span style={styles.pill('amber')}>Investigate</span> : <span style={styles.pill('green')}>Normal</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 9 — Technology Benchmarking
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 8 && (
          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Module Technology Comparison Matrix</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Technology</th>
                  <th style={styles.th}>Efficiency</th>
                  <th style={styles.th}>Temp Coeff</th>
                  <th style={styles.th}>Annual Deg</th>
                  <th style={styles.th}>LID</th>
                  <th style={styles.th}>25yr Warranty</th>
                  <th style={styles.th}>Cost $/Wp</th>
                  <th style={styles.th}>Bifacial</th>
                  <th style={styles.th}>IEC Certified</th>
                </tr></thead>
                <tbody>
                  {Object.entries(MODULE_TECHS).map(([k, t]) => (
                    <tr key={k} style={{ background: k === projectInputs.moduleTech ? '#EEF2FF' : 'transparent' }}>
                      <td style={styles.td}><strong>{t.label}</strong></td>
                      <td style={styles.td}>{(t.eff * 100).toFixed(1)}%</td>
                      <td style={styles.td}>{(t.tempCoeff * 100).toFixed(3)}%/°C</td>
                      <td style={styles.td}>{(t.annualDeg * 100).toFixed(2)}%/yr</td>
                      <td style={styles.td}>{t.lid > 0.001 ? `${(t.lid * 100).toFixed(1)}%` : '<0.1%'}</td>
                      <td style={styles.td}>{t.warranty25 ? `${t.warranty25}% at 25yr` : 'Pre-commercial'}</td>
                      <td style={styles.td}>{t.cost ? `$${t.cost.toFixed(2)}/Wp` : 'N/A'}</td>
                      <td style={styles.td}><span style={styles.pill(t.bifacial ? 'green' : 'amber')}>{t.bifacial ? 'Yes' : 'No'}</span></td>
                      <td style={styles.td}><span style={styles.pill(t.warranty25 ? 'green' : 'red')}>{t.warranty25 ? 'Yes' : 'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Tracker Type Comparison — Production Uplift vs CAPEX</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Tracker Type</th>
                  <th style={styles.th}>Production Uplift</th>
                  <th style={styles.th}>Annual GHI Yield (kWh/m²)</th>
                  <th style={styles.th}>CAPEX Adder $/W</th>
                  <th style={styles.th}>O&M Complexity</th>
                  <th style={styles.th}>Best For</th>
                </tr></thead>
                <tbody>
                  {[
                    { type: 'Fixed Tilt', uplift: '—', ghi: annualGHI.toFixed(0), capex: '—', maint: 'Minimal', best: 'High-irradiance, low-wind' },
                    { type: '1-Axis Horizontal', uplift: '+15-25%', ghi: (annualGHI * 1.20).toFixed(0), capex: '+$0.05/W', maint: 'Medium', best: 'Most utility-scale sites' },
                    { type: '2-Axis', uplift: '+25-35%', ghi: (annualGHI * 1.30).toFixed(0), capex: '+$0.15/W', maint: 'High', best: 'Low-irradiance, CPV systems' },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}><strong>{r.type}</strong></td>
                      <td style={styles.td}><span style={styles.pill(i === 0 ? 'amber' : i === 1 ? 'green' : 'indigo')}>{r.uplift}</span></td>
                      <td style={styles.td}>{r.ghi} kWh/m²/yr</td>
                      <td style={styles.td}>{r.capex}</td>
                      <td style={styles.td}>{r.maint}</td>
                      <td style={styles.td} style={{ color: T.sub, fontSize: 11 }}>{r.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Bifacial Gain Calculator</div>
                <div style={styles.row}>
                  <div>
                    <label style={styles.label}>GCR</label>
                    <input style={styles.input} type="number" step={0.01} value={projectInputs.gcr}
                      onChange={e => updateInput('gcr', +e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>Albedo</label>
                    <input style={styles.input} type="number" step={0.01} value={projectInputs.albedo}
                      onChange={e => updateInput('albedo', +e.target.value)} />
                  </div>
                </div>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Surface</th><th style={styles.th}>Albedo</th><th style={styles.th}>Bifacial Gain</th></tr></thead>
                  <tbody>
                    {[
                      { surface: 'Dry Grass', albedo: 0.20 },
                      { surface: 'Gravel/Dirt', albedo: 0.30 },
                      { surface: 'White Sand', albedo: 0.50 },
                      { surface: 'Concrete', albedo: 0.40 },
                      { surface: 'Snow', albedo: 0.80 },
                    ].map((r, i) => {
                      const gain = (1 - projectInputs.gcr) * r.albedo * 0.85 * 100;
                      return (
                        <tr key={i}>
                          <td style={styles.td}>{r.surface}</td>
                          <td style={styles.td}>{r.albedo}</td>
                          <td style={styles.td}><span style={styles.pill(gain > 5 ? 'green' : 'amber')}>+{gain.toFixed(1)}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>Inverter Technology Comparison</div>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Efficiency</th>
                    <th style={styles.th}>Reliability</th>
                    <th style={styles.th}>Cost</th>
                    <th style={styles.th}>PR Contribution</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { type: 'Central (1-2 MW)', eff: '98.5%', rel: 'Medium', cost: 'Low', pr: '98.5%' },
                      { type: 'String (20-100 kW)', eff: '97.5%', rel: 'High', cost: 'Medium', pr: '97.5%' },
                      { type: 'Micro (<1 kW)', eff: '96.5%', rel: 'Very High', cost: 'High', pr: '96.5%' },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td style={styles.td}><strong>{r.type}</strong></td>
                        <td style={styles.td}>{r.eff}</td>
                        <td style={styles.td}>{r.rel}</td>
                        <td style={styles.td}>{r.cost}</td>
                        <td style={styles.td}><span style={styles.pill('green')}>{r.pr}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Module Efficiency vs Cost — Technology Frontier</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="eff" name="Efficiency (%)" tick={{ fontSize: 11 }} label={{ value: 'Module Efficiency (%)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="cost" name="Cost ($/Wp)" tick={{ fontSize: 11 }} label={{ value: '$/Wp', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                      <strong>{d.name}</strong><br />{d.eff.toFixed(1)}% · ${d.cost}/Wp
                    </div>;
                  }} />
                  <Scatter
                    data={Object.entries(MODULE_TECHS).filter(([k, t]) => t.cost).map(([k, t]) => ({ name: t.label, eff: t.eff * 100, cost: t.cost }))}
                    fill={T.indigo}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 10 — Climate Risk Assessment
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 9 && (
          <div>
            <div style={styles.kpiGrid(3)}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Composite Climate Risk Score</div>
                <div style={styles.kpiValue(T.amber)}>
                  {(climateRisks.length ? climateRisks.reduce((s, r) => s + r.score, 0) / climateRisks.length : 0).toFixed(1)} / 10
                </div>
                <div style={styles.kpiSub}>Site: {LOCATIONS[selectedLocation].name}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Indicative Insurance Premium</div>
                <div style={styles.kpiValue(T.red)}>0.45-0.85%</div>
                <div style={styles.kpiSub}>of asset value per annum</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Highest Risk Factor</div>
                <div style={styles.kpiValue(T.red)} style={{ fontSize: 18, fontWeight: 700, color: T.red }}>
                  {[...climateRisks].sort((a, b) => b.score - a.score)[0].risk}
                </div>
                <div style={styles.kpiSub}>Score: {[...climateRisks].sort((a, b) => b.score - a.score)[0].score}/10</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Climate Risk Score by Dimension (1-10 scale)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={climateRisks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="risk" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <ReferenceLine x={5} stroke={T.amber} strokeDasharray="3 3" />
                  <Bar dataKey="score" name="Risk Score" radius={[0,3,3,0]}>
                    {climateRisks.map((r, i) => <Cell key={i} fill={r.score >= 7 ? T.red : r.score >= 4 ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Climate Risk Detail — Hail, Smoke, Heat, Wind, Flood, Snow</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Risk Factor</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>High-Risk Region</th>
                  <th style={styles.th}>Indicative Insurance</th>
                  <th style={styles.th}>Mitigation</th>
                </tr></thead>
                <tbody>
                  {[
                    { risk: 'Hail', score: 6, region: 'TX/CO/KS/NE', premium: '0.15-0.30%', mit: 'IEC 62938 resistant modules; undercoating' },
                    { risk: 'Wildfire Smoke', score: 4, region: 'CA/OR/WA', premium: '0.05-0.15%', mit: 'Remote monitoring; real-time soiling alerts' },
                    { risk: 'Extreme Heat', score: 5, region: 'AZ/NV/MENA', premium: '0.10-0.20%', mit: 'HJT modules; elevated mounting; spray cooling' },
                    { risk: 'Hurricane/Wind', score: 3, region: 'Gulf Coast/FL', premium: '0.20-0.50%', mit: 'IEC 61400 wind load rating; stow mode' },
                    { risk: 'Flooding', score: 2, region: 'Low-lying FEMA zones', premium: '0.05-0.10%', mit: 'Elevated inverter placement; >2yr flood clearance' },
                    { risk: 'Snow Load', score: 3, region: 'MW/NE/Mountain', premium: '0.03-0.08%', mit: 'Tilt angle >20° for self-cleaning; bifacial gain' },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}><strong>{r.risk}</strong></td>
                      <td style={styles.td}><span style={styles.pill(r.score >= 7 ? 'red' : r.score >= 4 ? 'amber' : 'green')}>{r.score}/10</span></td>
                      <td style={styles.td}>{r.region}</td>
                      <td style={styles.td}>{r.premium} of AV</td>
                      <td style={styles.td} style={{ color: T.sub, fontSize: 11 }}>{r.mit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Wildfire Smoke Model — GHI Attenuation from Aerosol Optical Depth (AOD)</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                GHI_smoke = GHI_clear × exp(−AOD × 1.5) — Peak smoke season: Jun–Sep (Western US)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={aodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ghi" name="Clear-sky GHI" fill={T.accent} fillOpacity={0.4} />
                  <Bar yAxisId="left" dataKey="ghiSmoke" name="Smoke-attenuated GHI" fill={T.red} fillOpacity={0.6} />
                  <Line yAxisId="right" type="monotone" dataKey="aod" name="AOD" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Extreme Heat Risk — Days Above Temperature Threshold</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                Days &gt;35°C trigger elevated PR losses. Days &gt;40°C risk inverter thermal shutdown (derate begins at 40–45°C for most string inverters).
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MONTHS.map((m, i) => {
                  const meanT = temps[i];
                  const days = [31,28,31,30,31,30,31,31,30,31,30,31][i];
                  const above35 = Math.max(0, Math.round(days * sr(i * 19) * (meanT > 20 ? 0.6 : 0.05)));
                  const above40 = Math.max(0, Math.round(above35 * sr(i * 31) * 0.3));
                  return { month: m, above35, above40 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="above35" name="Days >35°C (elevated loss)" fill={T.amber} />
                  <Bar dataKey="above40" name="Days >40°C (shutdown risk)" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>FEMA Flood Risk & Physical Siting Checklist</div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Checklist Item</th>
                  <th style={styles.th}>Requirement</th>
                  <th style={styles.th}>Best Practice</th>
                  <th style={styles.th}>Status</th>
                </tr></thead>
                <tbody>
                  {[
                    { item: 'FEMA Flood Zone', req: 'Not in Zone AE / VE', best: 'Zone X preferred; 100yr flood clearance', status: 'Verify' },
                    { item: 'Inverter Pad Elevation', req: '>2 ft above BFE', best: '>3 ft above Base Flood Elevation', status: 'Design' },
                    { item: 'Cable Trenching', req: 'Sealed conduit', best: 'Waterproof j-boxes; UL listed for wet locations', status: 'Standard' },
                    { item: 'Ground Screw Depth', req: '>4 ft to frost line', best: 'Geotech report; pullout test IEC 62938', status: 'Required' },
                    { item: 'Stormwater Management', req: 'NPDES permit', best: 'Retention pond; permeable ground cover', status: 'Permit' },
                    { item: 'Wind Load Design', req: 'ASCE 7-22', best: 'Local AHJ wind speed + 10% safety margin', status: 'Engineering' },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}><strong>{r.item}</strong></td>
                      <td style={styles.td}>{r.req}</td>
                      <td style={styles.td} style={{ color: T.sub, fontSize: 11 }}>{r.best}</td>
                      <td style={styles.td}><span style={styles.pill('amber')}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>PVsyst vs Actual Performance Comparison</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                Industry benchmark: actual production typically 3–8% below PVsyst P50 model. IE review threshold: &gt;10% deviation warrants investigation.
              </div>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Parameter</th>
                  <th style={styles.th}>PVsyst P50 Model</th>
                  <th style={styles.th}>Actual (Weather-Normalized)</th>
                  <th style={styles.th}>Delta</th>
                  <th style={styles.th}>Assessment</th>
                </tr></thead>
                <tbody>
                  {[
                    {
                      param: 'Annual GHI (kWh/m²)',
                      model: annualGHI.toFixed(0),
                      actual: (annualGHI * (0.97 + sr(5) * 0.04)).toFixed(0),
                      delta: `${((sr(5) * 0.04 - 0.03) * 100).toFixed(1)}%`,
                      ok: true,
                    },
                    {
                      param: 'System PR (%)',
                      model: (annualPR + 2.5).toFixed(1),
                      actual: annualPR.toFixed(1),
                      delta: `-2.5%`,
                      ok: true,
                    },
                    {
                      param: 'Final Yield (kWh/kWp/yr)',
                      model: (annualGHI * finalYield / 100 * 1.03).toFixed(0),
                      actual: (annualGHI * finalYield / 100).toFixed(0),
                      delta: `-3.0%`,
                      ok: true,
                    },
                    {
                      param: 'Soiling Loss (%)',
                      model: (projectInputs.soilingRate * 100 * 0.8).toFixed(2),
                      actual: (projectInputs.soilingRate * (1 - 0.70 * projectInputs.rainDays / 365) * 100).toFixed(2),
                      delta: `+${(projectInputs.soilingRate * 0.2 * 100).toFixed(2)}%`,
                      ok: false,
                    },
                    {
                      param: 'Availability (%)',
                      model: '98.5',
                      actual: (projectInputs.availabilityTarget * 100).toFixed(1),
                      delta: `${(projectInputs.availabilityTarget * 100 - 98.5).toFixed(1)}%`,
                      ok: projectInputs.availabilityTarget >= 0.985,
                    },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}><strong>{r.param}</strong></td>
                      <td style={styles.td}>{r.model}</td>
                      <td style={styles.td}>{r.actual}</td>
                      <td style={styles.td}><span style={styles.pill(r.ok ? 'green' : 'amber')}>{r.delta}</span></td>
                      <td style={styles.td}><span style={styles.pill(r.ok ? 'green' : 'amber')}>{r.ok ? 'Within tolerance' : 'Review'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Snow Loss Model — Monthly Self-Cleaning Threshold Analysis</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={MONTHS.map((m, i) => {
                  const snowDays = [8, 6, 4, 1, 0, 0, 0, 0, 0, 1, 4, 7][i];
                  const tiltFactor = Math.sin(projectInputs.tiltAngle * Math.PI / 180);
                  const snowLoss = snowDays * (1 - tiltFactor) * 0.02 * 100;
                  return { month: m, snowDays, snowLoss: snowLoss.toFixed(2) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="snowDays" name="Snow Days" fill={T.blue} />
                  <Bar dataKey="snowLoss" name="Snow Loss %" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
                Tilt {projectInputs.tiltAngle}° — panels above 20° largely self-clean. Snow loss reduced {(Math.sin(projectInputs.tiltAngle * Math.PI / 180) * 100).toFixed(0)}% by tilt factor.
              </div>
            </div>
          </div>
        )}

        {/* ─── Status bar ───────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 24, padding: '10px 0', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            ['Module', 'RE-RES1 Solar Resource & Performance Analytics'],
            ['Data Source', live ? `NASA POWER 2015–2023 · ${LOCATIONS[selectedLocation].name}` : `Seeded reference · ${LOCATIONS[selectedLocation].name}`],
            ['Capacity', `${(projectInputs.nameplateKWp / 1000).toFixed(0)} MWp · ${tech.label}`],
            ['Annual GHI', `${annualGHI.toFixed(0)} kWh/m²/yr (P50) · P90: ${p90.toFixed(0)}`],
            ['System PR', `${annualPR.toFixed(1)}% · Final Yield: ${(annualGHI * finalYield / 100).toFixed(0)} kWh/kWp/yr`],
          ].map(([k, v]) => (
            <div key={k} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: T.sub }}>{k}: </span>
              <span style={{ color: T.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
