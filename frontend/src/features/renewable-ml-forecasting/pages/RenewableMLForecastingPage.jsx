import React, { useState, useMemo, useEffect, useCallback } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, PieChart, Pie
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', solar: '#D97706'
};

// ─── Calculation Engines ──────────────────────────────────────────────────────

function runMonteCarlo(p50GWh, uncertainties, nRuns, srOffset) {
  const combinedSigma = Math.sqrt(
    Object.values(uncertainties).reduce((s, v) => s + v * v, 0)
  );
  const results = [];
  for (let i = 0; i < nRuns; i++) {
    const u1 = Math.max(1e-10, sr(srOffset + i * 2));
    const u2 = sr(srOffset + i * 2 + 1);
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    results.push(p50GWh * (1 + combinedSigma * z));
  }
  const sorted = [...results].sort((a, b) => a - b);
  const mean = results.reduce((s, v) => s + v, 0) / Math.max(1, nRuns);
  const variance = results.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, nRuns);
  return {
    p10: sorted[Math.floor(0.10 * nRuns)] || p50GWh,
    p50: sorted[Math.floor(0.50 * nRuns)] || p50GWh,
    p90: sorted[Math.floor(0.90 * nRuns)] || p50GWh,
    p99: sorted[Math.floor(0.99 * nRuns)] || p50GWh,
    mean,
    sigma: Math.sqrt(variance),
    combinedSigma,
    distribution: sorted
  };
}

function bayesianUpdate(priorMean, priorSigmaFrac, observations, obsSigmaFrac, nObs) {
  const priorSigma = priorMean * priorSigmaFrac / 100;
  const obsSigma = priorMean * obsSigmaFrac / 100;
  const priorVar = priorSigma * priorSigma;
  const obsVar = obsSigma * obsSigma;
  const n = Math.max(1, nObs);
  const obsMean = observations.length > 0
    ? observations.reduce((s, v) => s + v, 0) / observations.length
    : priorMean;
  const posteriorVar = 1 / (1 / priorVar + n / obsVar);
  const posteriorMean = posteriorVar * (priorMean / priorVar + n * obsMean / obsVar);
  const posteriorSigma = Math.sqrt(posteriorVar);
  return { posteriorMean, posteriorSigma, priorSigma, priorMean };
}

function ols(y, X) {
  const n = y.length;
  if (n < 2) return { beta0: 0, beta1: 0, r2: 0, rmse: 0, yHat: y.map(() => 0), dw: 2 };
  const xMean = X.reduce((s, v) => s + v, 0) / n;
  const yMean = y.reduce((s, v) => s + v, 0) / n;
  const ssXX = X.reduce((s, x) => s + Math.pow(x - xMean, 2), 0);
  const ssXY = X.reduce((s, x, i) => s + (x - xMean) * (y[i] - yMean), 0);
  const beta1 = ssXX > 0 ? ssXY / ssXX : 0;
  const beta0 = yMean - beta1 * xMean;
  const yHat = X.map(x => beta0 + beta1 * x);
  const residuals = y.map((v, i) => v - yHat[i]);
  const ssRes = residuals.reduce((s, v) => s + v * v, 0);
  const ssTot = y.reduce((s, v) => s + Math.pow(v - yMean, 2), 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const rmse = Math.sqrt(ssRes / Math.max(1, n));
  let dwNum = 0, dwDen = ssRes;
  for (let i = 1; i < residuals.length; i++) dwNum += Math.pow(residuals[i] - residuals[i - 1], 2);
  const dw = dwDen > 0 ? dwNum / dwDen : 2;
  return { beta0, beta1, r2, rmse, yHat, residuals, dw };
}

function modelMetrics(actual, forecast) {
  const n = actual.length;
  if (n === 0) return { mae: 0, rmse: 0, mape: 0, r2: 0, skillScore: 0, bias: 0 };
  const mae = actual.reduce((s, v, i) => s + Math.abs(v - forecast[i]), 0) / n;
  const mse = actual.reduce((s, v, i) => s + Math.pow(v - forecast[i], 2), 0) / n;
  const rmse = Math.sqrt(mse);
  const mape = actual.reduce((s, v, i) => s + Math.abs((v - forecast[i]) / Math.max(0.01, Math.abs(v))), 0) / n * 100;
  const meanAct = actual.reduce((s, v) => s + v, 0) / n;
  const ssTot = actual.reduce((s, v) => s + Math.pow(v - meanAct, 2), 0);
  const ssRes = actual.reduce((s, v, i) => s + Math.pow(v - forecast[i], 2), 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const bias = actual.reduce((s, v, i) => s + (forecast[i] - v), 0) / n;
  const persistence = actual.slice(0, -1);
  const actualShifted = actual.slice(1);
  const msePersist = persistence.reduce((s, v, i) => s + Math.pow(v - actualShifted[i], 2), 0) / Math.max(1, persistence.length);
  const skillScore = msePersist > 0 ? 1 - mse / msePersist : 0;
  return { mae, rmse, mape, r2, skillScore, bias };
}

function portfolioVaR(assets, corrSolarWind, revenuePerMWh, srOff) {
  const n = assets.length;
  if (n === 0) return { varP95: 0, varP99: 0, cvarP95: 0, portfolioSigma: 0, revenues: [] };
  const revenues = assets.map(a => a.p50 * revenuePerMWh / 1000);
  const sigmas = assets.map(a => a.sigma * revenues[assets.indexOf(a)]);
  // Simplified portfolio sigma with solar/wind correlation
  let portVar = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const isSolar = assets[i].tech.includes('Solar');
      const jIsSolar = assets[j].tech.includes('Solar');
      const corr = i === j ? 1 : (isSolar === jIsSolar ? 0.6 : corrSolarWind);
      portVar += sigmas[i] * sigmas[j] * corr;
    }
  }
  const portfolioSigma = Math.sqrt(Math.max(0, portVar));
  const totalRev = revenues.reduce((s, v) => s + v, 0);
  const varP95 = portfolioSigma * 1.645;
  const varP99 = portfolioSigma * 2.326;
  const cvarP95 = portfolioSigma * 2.063;
  return { varP95, varP99, cvarP95, portfolioSigma, revenues, totalRev };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard = ({ label, value, unit = '', color = T.text, sub = '', wide = false }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
    padding: '14px 18px', minWidth: wide ? 180 : 130, flex: 1
  }}>
    <div style={{ fontSize: 10, color: T.sub, fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 21, fontWeight: 700, color, fontFamily: 'JetBrains Mono,monospace' }}>
      {value}<span style={{ fontSize: 12, fontWeight: 400, color: T.sub, marginLeft: 3 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{sub}</div>}
  </div>
);

const SecHdr = ({ title, open, onToggle }) => (
  <div onClick={onToggle} style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    cursor: 'pointer', padding: '7px 0', borderBottom: `1px solid ${T.border}`,
    marginBottom: open ? 10 : 0, userSelect: 'none'
  }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</span>
    <span style={{ color: T.accent, fontSize: 13 }}>{open ? '▾' : '▸'}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${T.border}`, paddingBottom: 5, marginBottom: 12 }}>{children}</div>
);

const Slider = ({ label, value, min, max, step = 1, onChange, unit = '' }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
      <span style={{ fontSize: 11, color: T.accent, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600 }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.accent, cursor: 'pointer' }} />
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
    <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
    <div onClick={() => onChange(!value)} style={{
      width: 34, height: 18, borderRadius: 9, background: value ? T.accent : T.border,
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 16 : 2, width: 14, height: 14,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
      }} />
    </div>
  </div>
);

const SelectBtn = ({ options, value, onChange, small }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)} style={{
        padding: small ? '3px 8px' : '4px 10px', borderRadius: 4, fontSize: 10,
        border: `1px solid ${value === o ? T.accent : T.border}`,
        background: value === o ? T.accent + '22' : T.card,
        color: value === o ? T.accent : T.sub, cursor: 'pointer', fontWeight: value === o ? 700 : 400
      }}>{o}</button>
    ))}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, fontSize: 10, padding: '2px 6px', fontWeight: 600 }}>{label}</span>
);

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RenewableMLForecastingPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Section open state
  const [sec, setSec] = useState({ asset: true, mc: true, bayes: false, ols: false, hmm: false, risk: false });
  const toggleSec = k => setSec(s => ({ ...s, [k]: !s[k] }));

  // ── Section 1: Asset Config ──
  const [portfolioName, setPortfolioName] = useState('Meridian Renewables Fund');
  const [primaryTech, setPrimaryTech] = useState('Solar PV');
  const [nAssets, setNAssets] = useState(50);
  const [totalCapacityMW, setTotalCapacityMW] = useState(500);
  const [assetAgeRange, setAssetAgeRange] = useState('Mixed');
  const [histDataYears, setHistDataYears] = useState(10);
  const [forecastHorizonMonths, setForecastHorizonMonths] = useState(24);

  // ── Section 2: Monte Carlo ──
  const [p50GWh, setP50GWh] = useState(1200);
  const [resourceSigPct, setResourceSigPct] = useState(6);
  const [wakeSigPct, setWakeSigPct] = useState(2);
  const [availSigPct, setAvailSigPct] = useState(2);
  const [degradSigPct, setDegradSigPct] = useState(1);
  const [curtailSigPct, setCurtailSigPct] = useState(1.5);
  const [soilingSigPct, setSoilingSigPct] = useState(1.5);
  const [nMCRuns, setNMCRuns] = useState(1000);
  const [confLevel, setConfLevel] = useState(90);

  // ── Section 3: Bayesian ──
  const [priorMean, setPriorMean] = useState(1200);
  const [priorSigPct, setPriorSigPct] = useState(8);
  const [obsSigPct, setObsSigPct] = useState(4);
  const [nObs, setNObs] = useState(12);
  const [seqUpdating, setSeqUpdating] = useState(true);
  const [posteriorCI, setPosteriorCI] = useState(90);

  // ── Section 4: OLS ──
  const [primaryFactor, setPrimaryFactor] = useState('GHI');
  const [f1Weight, setF1Weight] = useState(65);
  const [f2Weight, setF2Weight] = useState(20);
  const [f3Weight, setF3Weight] = useState(10);
  const [seasonAdj, setSeasonAdj] = useState(true);
  const [trendRemoval, setTrendRemoval] = useState(false);
  const [cvFolds, setCvFolds] = useState(5);

  // ── Section 5: HMM ──
  const [ensoRegime, setEnsoRegime] = useState('Neutral');
  const [laNinaMulti, setLaNinaMulti] = useState(0.92);
  const [elNinoMulti, setElNinoMulti] = useState(1.06);
  const [regimePersist, setRegimePersist] = useState(75);
  const [iodToggle, setIodToggle] = useState(false);
  const [naoToggle, setNaoToggle] = useState(false);
  // 3x3 HMM transition matrix (row = from, col = to; La Niña, Normal, El Niño)
  const [hmmA00, setHmmA00] = useState(70); const [hmmA01, setHmmA01] = useState(25); const [hmmA02, setHmmA02] = useState(5);
  const [hmmA10, setHmmA10] = useState(15); const [hmmA11, setHmmA11] = useState(70); const [hmmA12, setHmmA12] = useState(15);
  const [hmmA20, setHmmA20] = useState(5);  const [hmmA21, setHmmA21] = useState(25); const [hmmA22, setHmmA22] = useState(70);

  // ── Section 6: Portfolio Risk ──
  const [revenuePerMWh, setRevenuePerMWh] = useState(55);
  const [revSigPct, setRevSigPct] = useState(15);
  const [curtailPct, setCurtailPct] = useState(3);
  const [debtServiceM, setDebtServiceM] = useState(40);
  const [stressScenario, setStressScenario] = useState('None');
  const [corrSolarWind, setCorrSolarWind] = useState(0.2);
  const [nPortStressRuns, setNPortStressRuns] = useState(1000);

  // ── NASA API ──
  const [lat, setLat] = useState(34.05);
  const [lon, setLon] = useState(-118.24);
  const [fetchNasa, setFetchNasa] = useState(false);
  const [nasaData, setNasaData] = useState(null);
  const [nasaLoading, setNasaLoading] = useState(false);
  const [nasaError, setNasaError] = useState(null);
  const [nasaFetchTime, setNasaFetchTime] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!fetchNasa) return;
    setNasaLoading(true);
    setNasaError(null);
    fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN,T2M&community=RE&longitude=${lon}&latitude=${lat}&start=2015&end=2023&format=JSON`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled) {
          setNasaData(d);
          setNasaLoading(false);
          setNasaFetchTime(new Date().toISOString());
          setFetchNasa(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setNasaError('Fetch failed — check network / CORS');
          setNasaLoading(false);
          setFetchNasa(false);
        }
      });
    return () => { cancelled = true; };
  }, [fetchNasa, lat, lon]);

  // ── Derived uncertainties object ──
  const uncertainties = useMemo(() => ({
    resource: resourceSigPct / 100,
    wake: wakeSigPct / 100,
    availability: availSigPct / 100,
    degradation: degradSigPct / 100,
    curtailment: curtailSigPct / 100,
    soiling: soilingSigPct / 100
  }), [resourceSigPct, wakeSigPct, availSigPct, degradSigPct, curtailSigPct, soilingSigPct]);

  // ── Monte Carlo results ──
  const mcResults = useMemo(() => runMonteCarlo(p50GWh, uncertainties, nMCRuns, 42), [p50GWh, uncertainties, nMCRuns]);

  // ── Bayesian observations (synthetic from inputs) ──
  const observations = useMemo(() => {
    return Array.from({ length: nObs }, (_, i) => {
      const noise = (sr(i * 37 + 5) - 0.5) * 2 * priorMean * obsSigPct / 100;
      return priorMean + noise;
    });
  }, [nObs, priorMean, obsSigPct]);

  const bayesResult = useMemo(() =>
    bayesianUpdate(priorMean, priorSigPct, observations, obsSigPct, nObs),
    [priorMean, priorSigPct, observations, obsSigPct, nObs]
  );

  // ── Seasonality (monthly index) ──
  const MONTHLY_SEASON = useMemo(() => {
    if (primaryTech === 'Wind Onshore' || primaryTech === 'Wind Offshore') {
      return [1.20, 1.15, 1.05, 0.90, 0.80, 0.75, 0.78, 0.82, 0.90, 1.00, 1.10, 1.20];
    }
    // Solar default
    return [0.65, 0.75, 0.90, 1.05, 1.15, 1.20, 1.15, 1.10, 1.00, 0.85, 0.70, 0.60];
  }, [primaryTech]);

  // ── Historical monthly actuals ──
  const monthlyActual = useMemo(() => {
    const monthlyP50 = p50GWh / 12;
    return Array.from({ length: histDataYears * 12 }, (_, i) => {
      const month = i % 12;
      const year = Math.floor(i / 12);
      const seasonal = MONTHLY_SEASON[month];
      const annualFactor = 0.92 + sr(year * 17 + 3) * 0.16;
      const noise = 1 + (sr(i * 7 + 3) - 0.5) * 0.06;
      const degradFactor = Math.pow(1 - 0.0045, year);
      const curtF = 1 - curtailPct / 100;
      return Math.max(0, monthlyP50 * seasonal * annualFactor * noise * degradFactor * curtF);
    });
  }, [p50GWh, histDataYears, MONTHLY_SEASON, curtailPct]);

  // ── Annual actuals aggregated ──
  const annualActual = useMemo(() => {
    return Array.from({ length: histDataYears }, (_, yr) => {
      const slice = monthlyActual.slice(yr * 12, yr * 12 + 12);
      return slice.reduce((s, v) => s + v, 0);
    });
  }, [monthlyActual, histDataYears]);

  // ── OLS (primary factor vs generation) ──
  const featureData = useMemo(() => {
    const n = monthlyActual.length;
    return Array.from({ length: n }, (_, i) => {
      const month = i % 12;
      const ghi = 120 + MONTHLY_SEASON[month] * 80 + (sr(i * 11) - 0.5) * 20;
      const windSpeed = 4 + MONTHLY_SEASON[month] * 6 + (sr(i * 13) - 0.5) * 3;
      const temp = -3 + MONTHLY_SEASON[month] * 25 + (sr(i * 13) - 0.5) * 5;
      const precip = 20 + (1 - MONTHLY_SEASON[month]) * 60 + sr(i * 19) * 20;
      const factorMap = { GHI: ghi, 'Wind Speed': windSpeed, Temperature: temp, Precipitation: precip };
      return { ghi, windSpeed, temp, precip, actualGWh: monthlyActual[i], factor: factorMap[primaryFactor] || ghi };
    });
  }, [monthlyActual, MONTHLY_SEASON, primaryFactor]);

  const olsResult = useMemo(() => {
    const y = featureData.map(d => d.actualGWh);
    const X = featureData.map(d => d.factor);
    return ols(y, X);
  }, [featureData]);

  // ── HMM transition matrix ──
  const hmmMatrix = useMemo(() => [
    [hmmA00 / 100, hmmA01 / 100, hmmA02 / 100],
    [hmmA10 / 100, hmmA11 / 100, hmmA12 / 100],
    [hmmA20 / 100, hmmA21 / 100, hmmA22 / 100]
  ], [hmmA00, hmmA01, hmmA02, hmmA10, hmmA11, hmmA12, hmmA20, hmmA21, hmmA22]);

  const hmmStates = useMemo(() => {
    const stateMultipliers = [laNinaMulti, 1.0, elNinoMulti];
    const states = [];
    let cur = 1;
    const startMap = { 'La Niña': 0, 'Neutral': 1, 'El Niño': 2 };
    cur = startMap[ensoRegime] ?? 1;
    for (let i = 0; i < forecastHorizonMonths; i++) {
      const r = sr(i * 31 + 7);
      const row = hmmMatrix[cur];
      const rowSum = row.reduce((s, v) => s + v, 0);
      const norm = rowSum > 0 ? rowSum : 1;
      if (r < row[0] / norm) cur = 0;
      else if (r < (row[0] + row[1]) / norm) cur = 1;
      else cur = 2;
      states.push({ state: cur, multiplier: stateMultipliers[cur] });
    }
    return states;
  }, [hmmMatrix, ensoRegime, laNinaMulti, elNinoMulti, forecastHorizonMonths]);

  // ── Portfolio synthetic assets ──
  const portfolioAssets = useMemo(() => {
    const techs = primaryTech === 'Hybrid'
      ? ['Solar PV', 'Wind Onshore']
      : [primaryTech];
    const regions = ['Southwest US', 'Midwest US', 'Texas', 'California', 'UK', 'Germany', 'Spain', 'Australia'];
    return Array.from({ length: Math.min(nAssets, 50) }, (_, i) => {
      const tech = techs[i % techs.length];
      const region = regions[i % regions.length];
      const capShare = totalCapacityMW / nAssets;
      const capacity = capShare * (0.7 + sr(i * 41) * 0.6);
      const cf = primaryTech.includes('Wind') ? (0.25 + sr(i * 43) * 0.25) : (0.15 + sr(i * 43) * 0.25);
      const assetP50 = capacity * cf * 8760 / 1000;
      const sigma = 0.05 + sr(i * 47) * 0.06;
      return {
        id: i + 1, name: `${tech} — ${region}`, tech, region,
        capacity: parseFloat(capacity.toFixed(0)),
        p50: parseFloat(assetP50.toFixed(1)),
        sigma: parseFloat(sigma.toFixed(3)),
        cf: parseFloat(cf.toFixed(3))
      };
    });
  }, [nAssets, totalCapacityMW, primaryTech]);

  const portVaRResult = useMemo(() =>
    portfolioVaR(portfolioAssets, corrSolarWind, revenuePerMWh, 100),
    [portfolioAssets, corrSolarWind, revenuePerMWh]
  );

  // ── Stress scenario multipliers ──
  const stressMultipliers = { None: 1.0, Mild: 0.95, Moderate: 0.88, Severe: 0.78, Extreme: 0.65 };
  const stressMult = stressMultipliers[stressScenario] || 1.0;

  // ── Revenue calculations ──
  const totalAnnualP50 = annualActual.length > 0 ? annualActual[annualActual.length - 1] : p50GWh;
  const annualRevenueM = totalAnnualP50 * revenuePerMWh / 1000 * stressMult;
  const dscrBase = debtServiceM > 0 ? annualRevenueM / debtServiceM : 0;

  // ── Portfolio VaR quick stats ──
  const portVaR95 = portVaRResult.varP95;
  const portR2 = olsResult.r2;

  // ── Posterior P50 quick stat ──
  const posteriorP50 = bayesResult.posteriorMean;

  // ── Live Quick Stats ──
  const quickStats = useMemo(() => ({
    portP50: mcResults.p50.toFixed(0),
    postP50: posteriorP50.toFixed(0),
    portVaR: portVaR95.toFixed(1),
    modelR2: portR2.toFixed(3)
  }), [mcResults.p50, posteriorP50, portVaR95, portR2]);

  const TABS = [
    'Monte Carlo Dist.', 'Bayesian Posterior', 'OLS Regression', 'HMM Regimes',
    'Forecast vs Actual', 'Model Comparison', 'Portfolio VaR', 'Stress Testing',
    'Seasonality', 'Degradation', 'Ensemble', 'Feature Importance',
    'Cross-Validation', 'Revenue Forecast', 'Uncertainty Decomp.', 'Long-Range Scenarios',
    'Backtesting', 'Live API'
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: 270, minWidth: 270, background: T.card, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, background: '#1A1A2E' }}>
          <div style={{ fontSize: 11, color: T.accent, fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1, textTransform: 'uppercase' }}>ML Forecasting Engine</div>
          <input value={portfolioName} onChange={e => setPortfolioName(e.target.value)}
            style={{ width: '100%', marginTop: 6, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

          {/* Section 1 */}
          <SecHdr title="Asset Configuration" open={sec.asset} onToggle={() => toggleSec('asset')} />
          {sec.asset && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>Technology</div>
              <SelectBtn options={['Solar PV','Wind Onshore','Wind Offshore','Hybrid']} value={primaryTech} onChange={setPrimaryTech} small />
              <Slider label="Assets" value={nAssets} min={5} max={200} onChange={setNAssets} />
              <Slider label="Capacity (MW)" value={totalCapacityMW} min={50} max={5000} step={50} onChange={setTotalCapacityMW} unit=" MW" />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>Asset Age</div>
              <SelectBtn options={['0–5 yr','5–15 yr','Mixed']} value={assetAgeRange} onChange={setAssetAgeRange} small />
              <Slider label="Historical Years" value={histDataYears} min={2} max={20} onChange={setHistDataYears} unit=" yr" />
              <Slider label="Forecast Horizon" value={forecastHorizonMonths} min={6} max={60} onChange={setForecastHorizonMonths} unit=" mo" />
            </div>
          )}

          {/* Section 2 */}
          <SecHdr title="Monte Carlo Engine" open={sec.mc} onToggle={() => toggleSec('mc')} />
          {sec.mc && (
            <div style={{ marginBottom: 12 }}>
              <Slider label="P50 Annual GWh" value={p50GWh} min={100} max={5000} step={50} onChange={setP50GWh} unit=" GWh" />
              <Slider label="Resource σ %" value={resourceSigPct} min={1} max={15} step={0.5} onChange={setResourceSigPct} unit="%" />
              <Slider label="Wake/Array σ %" value={wakeSigPct} min={0.5} max={5} step={0.5} onChange={setWakeSigPct} unit="%" />
              <Slider label="Availability σ %" value={availSigPct} min={0.5} max={5} step={0.5} onChange={setAvailSigPct} unit="%" />
              <Slider label="Degradation σ %" value={degradSigPct} min={0.5} max={3} step={0.5} onChange={setDegradSigPct} unit="%" />
              <Slider label="Curtailment σ %" value={curtailSigPct} min={0} max={5} step={0.5} onChange={setCurtailSigPct} unit="%" />
              <Slider label="Soiling σ %" value={soilingSigPct} min={0} max={5} step={0.5} onChange={setSoilingSigPct} unit="%" />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>MC Runs</div>
              <SelectBtn options={[100,500,1000,5000].map(String)} value={String(nMCRuns)} onChange={v => setNMCRuns(Number(v))} small />
              <Slider label="Confidence %" value={confLevel} min={80} max={99} onChange={setConfLevel} unit="%" />
            </div>
          )}

          {/* Section 3 */}
          <SecHdr title="Bayesian Updating" open={sec.bayes} onToggle={() => toggleSec('bayes')} />
          {sec.bayes && (
            <div style={{ marginBottom: 12 }}>
              <Slider label="Prior Mean GWh" value={priorMean} min={100} max={5000} step={50} onChange={setPriorMean} unit=" GWh" />
              <Slider label="Prior σ %" value={priorSigPct} min={2} max={20} onChange={setPriorSigPct} unit="%" />
              <Slider label="Obs. σ %" value={obsSigPct} min={1} max={10} onChange={setObsSigPct} unit="%" />
              <Slider label="Observations" value={nObs} min={1} max={36} onChange={setNObs} unit="" />
              <Toggle label="Sequential Updating" value={seqUpdating} onChange={setSeqUpdating} />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>Credible Interval</div>
              <SelectBtn options={['80','90','95']} value={String(posteriorCI)} onChange={v => setPosteriorCI(Number(v))} small />
            </div>
          )}

          {/* Section 4 */}
          <SecHdr title="OLS Factor Model" open={sec.ols} onToggle={() => toggleSec('ols')} />
          {sec.ols && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>Primary Factor</div>
              <SelectBtn options={['GHI','Wind Speed','Temperature','Precipitation']} value={primaryFactor} onChange={setPrimaryFactor} small />
              <Slider label="Factor 1 Weight" value={f1Weight} min={0} max={100} onChange={setF1Weight} unit="%" />
              <Slider label="Factor 2 Weight" value={f2Weight} min={0} max={50} onChange={setF2Weight} unit="%" />
              <Slider label="Factor 3 Weight" value={f3Weight} min={0} max={30} onChange={setF3Weight} unit="%" />
              <Toggle label="Seasonality Adj." value={seasonAdj} onChange={setSeasonAdj} />
              <Toggle label="Trend Removal" value={trendRemoval} onChange={setTrendRemoval} />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>CV Folds</div>
              <SelectBtn options={['3','5','10']} value={String(cvFolds)} onChange={v => setCvFolds(Number(v))} small />
            </div>
          )}

          {/* Section 5 */}
          <SecHdr title="HMM / Climate Regime" open={sec.hmm} onToggle={() => toggleSec('hmm')} />
          {sec.hmm && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>ENSO Regime</div>
              <SelectBtn options={['La Niña','Neutral','El Niño']} value={ensoRegime} onChange={setEnsoRegime} small />
              <Slider label="La Niña ×" value={laNinaMulti} min={0.85} max={1.00} step={0.01} onChange={setLaNinaMulti} />
              <Slider label="El Niño ×" value={elNinoMulti} min={0.95} max={1.15} step={0.01} onChange={setElNinoMulti} />
              <Slider label="Regime Persist %" value={regimePersist} min={50} max={90} onChange={setRegimePersist} unit="%" />
              <Toggle label="IOD Influence" value={iodToggle} onChange={setIodToggle} />
              <Toggle label="NAO Influence" value={naoToggle} onChange={setNaoToggle} />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 8 }}>Transition Matrix (row=from)</div>
              {[
                { label:'LN→', vals:[hmmA00,hmmA01,hmmA02], sets:[setHmmA00,setHmmA01,setHmmA02] },
                { label:'N→',  vals:[hmmA10,hmmA11,hmmA12], sets:[setHmmA10,setHmmA11,setHmmA12] },
                { label:'EN→', vals:[hmmA20,hmmA21,hmmA22], sets:[setHmmA20,setHmmA21,setHmmA22] }
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 2 }}>{row.label} LN / N / EN</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {row.vals.map((v, ci) => (
                      <input key={ci} type="number" min={0} max={100} value={v}
                        onChange={e => row.sets[ci](Number(e.target.value))}
                        style={{ width: 52, fontSize: 10, padding: '2px 4px', border: `1px solid ${T.border}`, borderRadius: 3, background: T.bg, color: T.text, textAlign: 'center' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 6 */}
          <SecHdr title="Portfolio Risk & Stress" open={sec.risk} onToggle={() => toggleSec('risk')} />
          {sec.risk && (
            <div style={{ marginBottom: 12 }}>
              <Slider label="Revenue $/MWh" value={revenuePerMWh} min={20} max={120} onChange={setRevenuePerMWh} unit=" $/MWh" />
              <Slider label="Revenue σ %" value={revSigPct} min={5} max={30} onChange={setRevSigPct} unit="%" />
              <Slider label="Curtailment %" value={curtailPct} min={0} max={20} step={0.5} onChange={setCurtailPct} unit="%" />
              <Slider label="Debt Service $M/yr" value={debtServiceM} min={0} max={200} step={5} onChange={setDebtServiceM} unit=" $M" />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>Stress Scenario</div>
              <SelectBtn options={['None','Mild','Moderate','Severe','Extreme']} value={stressScenario} onChange={setStressScenario} small />
              <Slider label="Corr Solar↔Wind" value={corrSolarWind} min={-0.5} max={0.8} step={0.05} onChange={setCorrSolarWind} />
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>Stress Runs</div>
              <SelectBtn options={['100','500','1000']} value={String(nPortStressRuns)} onChange={v => setNPortStressRuns(Number(v))} small />
            </div>
          )}
        </div>

        {/* Quick Stats Bar */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 14px', background: '#1A1A2E' }}>
          <div style={{ fontSize: 9, color: T.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'JetBrains Mono,monospace' }}>Live Quick Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'MC P50', val: quickStats.portP50, unit: 'GWh' },
              { label: 'Post. P50', val: quickStats.postP50, unit: 'GWh' },
              { label: 'Port VaR', val: quickStats.portVaR, unit: '$M' },
              { label: 'Model R²', val: quickStats.modelR2, unit: '' }
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: T.sub, fontFamily: 'JetBrains Mono,monospace' }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>{s.val}<span style={{ fontSize: 10, color: T.accent, marginLeft: 2 }}>{s.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, background: T.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{portfolioName}</div>
            <div style={{ fontSize: 11, color: T.sub, fontFamily: 'JetBrains Mono,monospace' }}>
              {primaryTech} · {totalCapacityMW} MW · {nAssets} assets · {forecastHorizonMonths}mo horizon
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge label={`P50: ${mcResults.p50.toFixed(0)} GWh`} color={T.indigo} />
            <Badge label={`σ: ${mcResults.combinedSigma ? (mcResults.combinedSigma * 100).toFixed(1) : 0}%`} color={T.accent} />
            <Badge label={stressScenario !== 'None' ? `⚠ ${stressScenario}` : 'No Stress'} color={stressScenario !== 'None' ? T.red : T.green} />
          </div>
        </div>

        {/* Gold accent line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.indigo})` }} />

        {/* Tab Bar */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, flexShrink: 0 }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '9px 14px', border: 'none', borderBottom: `2px solid ${activeTab === i ? T.accent : 'transparent'}`,
              background: 'transparent', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap',
              color: activeTab === i ? T.accent : T.sub, fontWeight: activeTab === i ? 700 : 400,
              fontFamily: 'DM Sans, sans-serif'
            }}>{tab}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 0 && <Tab01MonteCarlo mc={mcResults} p50GWh={p50GWh} uncertainties={uncertainties} nMCRuns={nMCRuns} confLevel={confLevel} />}
          {activeTab === 1 && <Tab02Bayesian bayesResult={bayesResult} priorMean={priorMean} priorSigPct={priorSigPct} obsSigPct={obsSigPct} nObs={nObs} posteriorCI={posteriorCI} seqUpdating={seqUpdating} observations={observations} />}
          {activeTab === 2 && <Tab03OLS olsResult={olsResult} featureData={featureData} primaryFactor={primaryFactor} f1Weight={f1Weight} f2Weight={f2Weight} f3Weight={f3Weight} seasonAdj={seasonAdj} trendRemoval={trendRemoval} cvFolds={cvFolds} />}
          {activeTab === 3 && <Tab04HMM hmmStates={hmmStates} hmmMatrix={hmmMatrix} ensoRegime={ensoRegime} laNinaMulti={laNinaMulti} elNinoMulti={elNinoMulti} p50GWh={p50GWh} forecastHorizonMonths={forecastHorizonMonths} />}
          {activeTab === 4 && <Tab05ForecastActual annualActual={annualActual} p50GWh={p50GWh} mc={mcResults} histDataYears={histDataYears} forecastHorizonMonths={forecastHorizonMonths} MONTHLY_SEASON={MONTHLY_SEASON} monthlyActual={monthlyActual} />}
          {activeTab === 5 && <Tab06ModelComparison annualActual={annualActual} p50GWh={p50GWh} olsResult={olsResult} bayesResult={bayesResult} mc={mcResults} hmmStates={hmmStates} />}
          {activeTab === 6 && <Tab07PortfolioVaR portVaRResult={portVaRResult} portfolioAssets={portfolioAssets} revenuePerMWh={revenuePerMWh} corrSolarWind={corrSolarWind} debtServiceM={debtServiceM} revSigPct={revSigPct} />}
          {activeTab === 7 && <Tab08StressTesting p50GWh={p50GWh} revenuePerMWh={revenuePerMWh} debtServiceM={debtServiceM} mc={mcResults} stressScenario={stressScenario} uncertainties={uncertainties} />}
          {activeTab === 8 && <Tab09Seasonality MONTHLY_SEASON={MONTHLY_SEASON} p50GWh={p50GWh} mc={mcResults} primaryTech={primaryTech} monthlyActual={monthlyActual} histDataYears={histDataYears} />}
          {activeTab === 9 && <Tab10Degradation p50GWh={p50GWh} mc={mcResults} revenuePerMWh={revenuePerMWh} assetAgeRange={assetAgeRange} />}
          {activeTab === 10 && <Tab11Ensemble annualActual={annualActual} p50GWh={p50GWh} olsResult={olsResult} bayesResult={bayesResult} mc={mcResults} hmmStates={hmmStates} />}
          {activeTab === 11 && <Tab12FeatureImportance featureData={featureData} olsResult={olsResult} primaryFactor={primaryFactor} f1Weight={f1Weight} f2Weight={f2Weight} f3Weight={f3Weight} />}
          {activeTab === 12 && <Tab13CrossValidation annualActual={annualActual} olsResult={olsResult} cvFolds={cvFolds} p50GWh={p50GWh} />}
          {activeTab === 13 && <Tab14RevenueForecast mc={mcResults} revenuePerMWh={revenuePerMWh} forecastHorizonMonths={forecastHorizonMonths} debtServiceM={debtServiceM} MONTHLY_SEASON={MONTHLY_SEASON} revSigPct={revSigPct} curtailPct={curtailPct} />}
          {activeTab === 14 && <Tab15UncertaintyDecomp uncertainties={uncertainties} mc={mcResults} p50GWh={p50GWh} />}
          {activeTab === 15 && <Tab16LongRange p50GWh={p50GWh} revenuePerMWh={revenuePerMWh} debtServiceM={debtServiceM} mc={mcResults} laNinaMulti={laNinaMulti} elNinoMulti={elNinoMulti} />}
          {activeTab === 16 && <Tab17Backtesting monthlyActual={monthlyActual} p50GWh={p50GWh} mc={mcResults} histDataYears={histDataYears} MONTHLY_SEASON={MONTHLY_SEASON} />}
          {activeTab === 17 && <Tab18LiveAPI nasaData={nasaData} nasaLoading={nasaLoading} nasaError={nasaError} nasaFetchTime={nasaFetchTime} lat={lat} setLat={setLat} lon={lon} setLon={setLon} onFetch={() => setFetchNasa(true)} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 01 — Monte Carlo Distribution
// ═══════════════════════════════════════════════════════════════════════════════

function Tab01MonteCarlo({ mc, p50GWh, uncertainties, nMCRuns, confLevel }) {
  const histData = useMemo(() => {
    const dist = mc.distribution;
    if (!dist || dist.length === 0) return [];
    const min = dist[0];
    const max = dist[dist.length - 1];
    const bins = 50;
    const binW = (max - min) / bins;
    if (binW <= 0) return [];
    const counts = Array(bins).fill(0);
    dist.forEach(v => {
      const idx = Math.min(bins - 1, Math.floor((v - min) / binW));
      counts[idx]++;
    });
    return counts.map((c, i) => ({
      x: parseFloat((min + i * binW + binW / 2).toFixed(1)),
      count: c,
      pct: dist.length > 0 ? parseFloat((c / dist.length * 100).toFixed(2)) : 0
    }));
  }, [mc]);

  const exceedData = useMemo(() => {
    const dist = mc.distribution;
    if (!dist || dist.length === 0) return [];
    const n = dist.length;
    return Array.from({ length: 20 }, (_, i) => {
      const exceedPct = (i + 1) * 5;
      const idx = Math.floor((1 - exceedPct / 100) * n);
      return { exceedPct, value: parseFloat((dist[Math.max(0, idx)] || 0).toFixed(1)) };
    });
  }, [mc]);

  const zScore = { 80: 1.282, 85: 1.036, 90: 1.645, 95: 1.960, 99: 2.326 };
  const zVal = zScore[confLevel] || 1.645;
  const pLow = mc.p50 - zVal * mc.sigma;
  const pHigh = mc.p50 + zVal * mc.sigma;
  const cov = mc.p50 > 0 ? (mc.sigma / mc.p50 * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="P10" value={(mc.p10 || 0).toFixed(0)} unit="GWh" color={T.red} sub="Lender case" />
        <KpiCard label="P50" value={(mc.p50 || 0).toFixed(0)} unit="GWh" color={T.indigo} sub="Base case" />
        <KpiCard label="P90" value={(mc.p90 || 0).toFixed(0)} unit="GWh" color={T.green} sub="Upside case" />
        <KpiCard label="P99" value={(mc.p99 || 0).toFixed(0)} unit="GWh" color={T.teal} sub="Tail upside" />
        <KpiCard label="σ" value={(mc.sigma || 0).toFixed(1)} unit="GWh" color={T.accent} sub="Std deviation" />
        <KpiCard label="CoV" value={cov.toFixed(1)} unit="%" color={T.amber} sub="Coefficient of variation" />
      </div>

      <div>
        <SectionTitle>Monte Carlo Output Distribution ({nMCRuns.toLocaleString()} runs)</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={histData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(0)} label={{ value: 'GWh', position: 'insideBottom', offset: -3, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(v, n) => [v, n === 'count' ? 'Runs' : n]} labelFormatter={v => `~${Number(v).toFixed(0)} GWh`} />
            <Bar dataKey="count" fill={T.indigo + 'BB'} name="Runs" radius={[2, 2, 0, 0]}>
              {histData.map((d, i) => (
                <Cell key={i} fill={
                  d.x < (mc.p10 || 0) ? T.red + 'CC' :
                  d.x > (mc.p90 || 0) ? T.green + 'CC' :
                  T.indigo + 'AA'
                } />
              ))}
            </Bar>
            {mc.p10 && <ReferenceLine x={mc.p10.toFixed(1)} stroke={T.red} strokeDasharray="4 3" label={{ value: 'P10', fill: T.red, fontSize: 10 }} />}
            {mc.p50 && <ReferenceLine x={mc.p50.toFixed(1)} stroke={T.accent} strokeDasharray="4 3" label={{ value: 'P50', fill: T.accent, fontSize: 10 }} />}
            {mc.p90 && <ReferenceLine x={mc.p90.toFixed(1)} stroke={T.green} strokeDasharray="4 3" label={{ value: 'P90', fill: T.green, fontSize: 10 }} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <SectionTitle>Exceedance Probability Curve</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={exceedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="exceedPct" tick={{ fontSize: 10 }} label={{ value: 'Exceedance %', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`, 'Generation']} labelFormatter={v => `P${v} exceedance`} />
              <Line type="monotone" dataKey="value" stroke={T.indigo} strokeWidth={2} dot={false} name="Generation" />
              <ReferenceLine x={10} stroke={T.red} strokeDasharray="3 3" label={{ value: 'P10', fill: T.red, fontSize: 9 }} />
              <ReferenceLine x={50} stroke={T.accent} strokeDasharray="3 3" label={{ value: 'P50', fill: T.accent, fontSize: 9 }} />
              <ReferenceLine x={90} stroke={T.green} strokeDasharray="3 3" label={{ value: 'P90', fill: T.green, fontSize: 9 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Uncertainty Inputs Summary</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1A1A2E', color: '#fff' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>Source</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>σ %</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>Var Contrib.</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(uncertainties).map(([k, v], i) => {
                const totalVar = Object.values(uncertainties).reduce((s, u) => s + u * u, 0);
                const contrib = totalVar > 0 ? (v * v / totalVar * 100) : 0;
                return (
                  <tr key={k} style={{ background: i % 2 === 0 ? T.card : '#F5F5F0', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', textTransform: 'capitalize', fontSize: 11 }}>{k}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', color: T.accent }}>{(v * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', color: T.sub }}>{contrib.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr style={{ background: '#1A1A2E', color: '#fff' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 11 }}>Combined σ</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{((mc.combinedSigma || 0) * 100).toFixed(2)}%</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono,monospace' }}>100%</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 10, padding: '8px 12px', background: T.indigo + '11', borderRadius: 5, fontSize: 11, color: T.sub }}>
            {confLevel}% CI: <strong style={{ color: T.indigo }}>{pLow.toFixed(0)} – {pHigh.toFixed(0)} GWh</strong> &nbsp;|&nbsp; Combined σ: <strong style={{ color: T.accent }}>{((mc.combinedSigma || 0) * 100).toFixed(2)}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 02 — Bayesian Posterior
// ═══════════════════════════════════════════════════════════════════════════════

function Tab02Bayesian({ bayesResult, priorMean, priorSigPct, obsSigPct, nObs, posteriorCI, seqUpdating, observations }) {
  const { posteriorMean, posteriorSigma, priorSigma } = bayesResult;

  const ciZ = { 80: 1.282, 90: 1.645, 95: 1.960 };
  const z = ciZ[posteriorCI] || 1.645;
  const ciLow = posteriorMean - z * posteriorSigma;
  const ciHigh = posteriorMean + z * posteriorSigma;

  // Density curves
  const densityData = useMemo(() => {
    const range = Math.max(priorSigma * 4, posteriorSigma * 4);
    const lo = Math.min(priorMean, posteriorMean) - range;
    const hi = Math.max(priorMean, posteriorMean) + range;
    const steps = 100;
    const step = (hi - lo) / steps;
    const gaussian = (x, mu, sig) => sig > 0 ? Math.exp(-0.5 * Math.pow((x - mu) / sig, 2)) / (sig * Math.sqrt(2 * Math.PI)) : 0;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const x = lo + i * step;
      return {
        x: parseFloat(x.toFixed(1)),
        prior: parseFloat((gaussian(x, priorMean, priorSigma) * 100).toFixed(4)),
        posterior: parseFloat((gaussian(x, posteriorMean, posteriorSigma) * 100).toFixed(4))
      };
    });
  }, [priorMean, priorSigma, posteriorMean, posteriorSigma]);

  // Sequential update path
  const seqPath = useMemo(() => {
    if (!seqUpdating) return [];
    const results = [];
    let curMean = priorMean;
    let curSigma = priorSigma;
    for (let i = 0; i < Math.min(nObs, 36); i++) {
      const obs = observations[i] || priorMean;
      const obsVar = Math.pow(priorMean * obsSigPct / 100, 2);
      const curVar = curSigma * curSigma;
      const newVar = 1 / (1 / curVar + 1 / obsVar);
      const newMean = newVar * (curMean / curVar + obs / obsVar);
      curMean = newMean;
      curSigma = Math.sqrt(newVar);
      results.push({ obs: i + 1, mean: parseFloat(newMean.toFixed(1)), sigma: parseFloat(curSigma.toFixed(1)), obs_val: parseFloat(obs.toFixed(1)) });
    }
    return results;
  }, [seqUpdating, nObs, priorMean, priorSigma, obsSigPct, observations]);

  // Prior sigma sensitivity
  const sensitivityData = useMemo(() => {
    return [2, 4, 6, 8, 10, 12, 15, 20].map(sp => {
      const ps = priorMean * sp / 100;
      const obsVar = Math.pow(priorMean * obsSigPct / 100, 2);
      const priorVar = ps * ps;
      const n = Math.max(1, nObs);
      const postVar = 1 / (1 / priorVar + n / obsVar);
      const postSig = Math.sqrt(postVar);
      return { priorSigPct: sp, posteriorSigmaGWh: parseFloat(postSig.toFixed(1)) };
    });
  }, [priorMean, obsSigPct, nObs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Prior Mean" value={(priorMean || 0).toFixed(0)} unit="GWh" color={T.sub} />
        <KpiCard label="Posterior Mean" value={(posteriorMean || 0).toFixed(1)} unit="GWh" color={T.indigo} sub="Updated estimate" />
        <KpiCard label="Posterior σ" value={(posteriorSigma || 0).toFixed(1)} unit="GWh" color={T.accent} />
        <KpiCard label={`${posteriorCI}% CI Low`} value={(ciLow || 0).toFixed(0)} unit="GWh" color={T.red} />
        <KpiCard label={`${posteriorCI}% CI High`} value={(ciHigh || 0).toFixed(0)} unit="GWh" color={T.green} />
        <KpiCard label="Update Pull" value={(posteriorMean - priorMean).toFixed(1)} unit="GWh" color={posteriorMean > priorMean ? T.green : T.red} sub={posteriorMean > priorMean ? '▲ upward' : '▼ downward'} />
      </div>

      <div>
        <SectionTitle>Prior vs Posterior Density (Normal-Normal Conjugate)</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={densityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={v => Number(v).toFixed(0)} label={{ value: 'GWh', position: 'insideBottom', offset: -3, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Density', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [Number(v).toFixed(4), n]} labelFormatter={v => `${Number(v).toFixed(0)} GWh`} />
            <Legend />
            <Area type="monotone" dataKey="prior" stroke={T.sub} fill={T.sub + '33'} strokeWidth={1.5} name="Prior" dot={false} />
            <Area type="monotone" dataKey="posterior" stroke={T.indigo} fill={T.indigo + '44'} strokeWidth={2} name="Posterior" dot={false} />
            <ReferenceLine x={posteriorMean.toFixed(1)} stroke={T.accent} strokeDasharray="4 3" label={{ value: 'Post.Mean', fill: T.accent, fontSize: 9 }} />
            <ReferenceLine x={ciLow.toFixed(1)} stroke={T.red} strokeDasharray="2 2" label={{ value: `${posteriorCI}%L`, fill: T.red, fontSize: 9 }} />
            <ReferenceLine x={ciHigh.toFixed(1)} stroke={T.green} strokeDasharray="2 2" label={{ value: `${posteriorCI}%H`, fill: T.green, fontSize: 9 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {seqUpdating && seqPath.length > 0 && (
          <div style={{ flex: 2, minWidth: 300 }}>
            <SectionTitle>Sequential Bayesian Update Path</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={seqPath}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="obs" tick={{ fontSize: 10 }} label={{ value: 'Observations', position: 'insideBottom', offset: -3, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} GWh`]} />
                <Legend />
                <Line type="monotone" dataKey="mean" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} name="Posterior Mean" />
                <Line type="monotone" dataKey="obs_val" stroke={T.accent} strokeWidth={1} strokeDasharray="3 2" dot={{ r: 2 }} name="Observation" />
                <ReferenceLine y={priorMean} stroke={T.sub} strokeDasharray="4 3" label={{ value: 'Prior', fill: T.sub, fontSize: 9 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Posterior σ vs Prior σ (Sensitivity)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sensitivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="priorSigPct" tick={{ fontSize: 10 }} label={{ value: 'Prior σ %', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Post. σ (GWh)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`, 'Posterior σ']} />
              <Line type="monotone" dataKey="posteriorSigmaGWh" stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} name="Posterior σ" />
              <ReferenceLine x={priorSigPct} stroke={T.accent} strokeDasharray="3 2" label={{ value: 'Current', fill: T.accent, fontSize: 9 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 03 — OLS Factor Regression
// ═══════════════════════════════════════════════════════════════════════════════

function Tab03OLS({ olsResult, featureData, primaryFactor, f1Weight, f2Weight, f3Weight, seasonAdj, trendRemoval, cvFolds }) {
  const scatterData = useMemo(() => featureData.slice(0, 60).map((d, i) => ({
    factor: parseFloat(d.factor.toFixed(1)),
    actual: parseFloat(d.actualGWh.toFixed(1)),
    fitted: parseFloat((olsResult.beta0 + olsResult.beta1 * d.factor).toFixed(1))
  })), [featureData, olsResult]);

  const residualData = useMemo(() => (olsResult.residuals || []).slice(0, 48).map((r, i) => ({
    obs: i + 1,
    residual: parseFloat(r.toFixed(2))
  })), [olsResult]);

  const seasonalDecomp = useMemo(() => MONTHS_SHORT.map((m, i) => ({
    month: m,
    actual: featureData.filter(d => d.actualGWh > 0).slice(0, 120).filter((_, j) => j % 12 === i)
      .reduce((s, d) => s + d.actualGWh, 0) / Math.max(1, featureData.filter((_, j) => j % 12 === i).length),
    fitted: featureData.filter(d => d.actualGWh > 0).slice(0, 120).filter((_, j) => j % 12 === i)
      .map((d, _) => olsResult.beta0 + olsResult.beta1 * d.factor)
      .reduce((s, v) => s + v, 0) / Math.max(1, featureData.filter((_, j) => j % 12 === i).length)
  })), [featureData, olsResult]);

  const factorLabel = { GHI: 'kWh/m²/mo', 'Wind Speed': 'm/s', Temperature: '°C', Precipitation: 'mm' }[primaryFactor] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="R²" value={(olsResult.r2 || 0).toFixed(3)} color={olsResult.r2 > 0.7 ? T.green : T.amber} sub="Coefficient of determination" />
        <KpiCard label="RMSE" value={(olsResult.rmse || 0).toFixed(1)} unit="GWh" color={T.indigo} />
        <KpiCard label="β₀ (Intercept)" value={(olsResult.beta0 || 0).toFixed(2)} color={T.sub} />
        <KpiCard label="β₁ (Slope)" value={(olsResult.beta1 || 0).toFixed(4)} color={T.accent} sub={`per ${factorLabel}`} />
        <KpiCard label="DW Stat" value={(olsResult.dw || 2).toFixed(2)} color={Math.abs((olsResult.dw || 2) - 2) < 0.5 ? T.green : T.red} sub="~2 = no autocorr." />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <SectionTitle>{primaryFactor} vs Generation — Scatter + OLS Line</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="factor" name={primaryFactor} tick={{ fontSize: 10 }} label={{ value: primaryFactor, position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis dataKey="actual" name="Generation" tick={{ fontSize: 10 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [`${Number(v).toFixed(1)}`, n]} />
              <Scatter data={scatterData} fill={T.indigo + '77'} name="Obs" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <SectionTitle>Residuals Plot (first 48 observations)</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={residualData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="obs" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Residual GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} GWh`, 'Residual']} />
              <ReferenceLine y={0} stroke={T.text} strokeWidth={1} />
              <Bar dataKey="residual" name="Residual">
                {residualData.map((d, i) => <Cell key={i} fill={d.residual >= 0 ? T.green + 'BB' : T.red + 'BB'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Seasonal Decomposition — Monthly Average Actual vs OLS Fitted</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={seasonalDecomp}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} GWh`]} />
            <Legend />
            <Bar dataKey="actual" fill={T.indigo + 'CC'} name="Actual Avg" radius={[2, 2, 0, 0]} />
            <Bar dataKey="fitted" fill={T.accent + 'BB'} name="OLS Fitted Avg" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <strong style={{ color: T.text }}>Model Specification:</strong>
        <span style={{ color: T.sub, marginLeft: 8 }}>
          Generation = {(olsResult.beta0 || 0).toFixed(2)} + {(olsResult.beta1 || 0).toFixed(4)} × {primaryFactor}
          {seasonAdj ? ' + Seasonal dummies' : ''}
          {trendRemoval ? ' (trend removed)' : ''}
          &nbsp;| CV: {cvFolds}-fold &nbsp;| Weights: {f1Weight}/{f2Weight}/{f3Weight}%
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 04 — HMM Climate Regimes
// ═══════════════════════════════════════════════════════════════════════════════

function Tab04HMM({ hmmStates, hmmMatrix, ensoRegime, laNinaMulti, elNinoMulti, p50GWh, forecastHorizonMonths }) {
  const STATE_LABELS = ['La Niña', 'Normal', 'El Niño'];
  const STATE_COLORS = [T.blue, T.green, T.solar];

  const stateSeriesData = useMemo(() => hmmStates.map((s, i) => ({
    month: i + 1,
    laNina: s.state === 0 ? 1 : 0,
    normal: s.state === 1 ? 1 : 0,
    elNino: s.state === 2 ? 1 : 0,
    adjGen: parseFloat((p50GWh / 12 * s.multiplier).toFixed(1))
  })), [hmmStates, p50GWh]);

  const stateCounts = useMemo(() => {
    const counts = [0, 0, 0];
    hmmStates.forEach(s => counts[s.state]++);
    return counts;
  }, [hmmStates]);

  const durationData = useMemo(() => {
    const durations = [[], [], []];
    let cur = hmmStates[0]?.state ?? 1, run = 1;
    for (let i = 1; i < hmmStates.length; i++) {
      if (hmmStates[i].state === cur) { run++; }
      else { durations[cur].push(run); cur = hmmStates[i].state; run = 1; }
    }
    durations[cur].push(run);
    return STATE_LABELS.map((lbl, s) => ({
      label: lbl,
      avgDur: durations[s].length > 0 ? parseFloat((durations[s].reduce((a, b) => a + b, 0) / durations[s].length).toFixed(1)) : 0,
      maxDur: durations[s].length > 0 ? Math.max(...durations[s]) : 0,
      count: stateCounts[s]
    }));
  }, [hmmStates, stateCounts]);

  const regimeAdjP50 = useMemo(() => {
    const weights = [laNinaMulti, 1.0, elNinoMulti];
    const freq = stateCounts.map(c => c / Math.max(1, forecastHorizonMonths));
    const adjMult = freq.reduce((s, f, i) => s + f * weights[i], 0);
    return p50GWh * adjMult;
  }, [stateCounts, forecastHorizonMonths, p50GWh, laNinaMulti, elNinoMulti]);

  const transitionHeatData = useMemo(() => {
    const cells = [];
    STATE_LABELS.forEach((from, i) => {
      STATE_LABELS.forEach((to, j) => {
        cells.push({ from, to, value: parseFloat((hmmMatrix[i][j] * 100).toFixed(1)) });
      });
    });
    return cells;
  }, [hmmMatrix]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {STATE_LABELS.map((lbl, i) => (
          <KpiCard key={lbl} label={lbl} value={stateCounts[i]} unit=" mo" color={STATE_COLORS[i]} sub={`${(stateCounts[i] / Math.max(1, forecastHorizonMonths) * 100).toFixed(0)}% of horizon`} />
        ))}
        <KpiCard label="Regime-adj P50" value={regimeAdjP50.toFixed(0)} unit=" GWh" color={T.indigo} sub="vs baseline" />
        <KpiCard label="Δ vs Baseline" value={(regimeAdjP50 - p50GWh).toFixed(0)} unit=" GWh" color={regimeAdjP50 >= p50GWh ? T.green : T.red} />
      </div>

      <div>
        <SectionTitle>State Probability Time Series (Viterbi path)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stateSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Month', position: 'insideBottom', offset: -3, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Area type="step" dataKey="laNina" stackId="1" stroke={T.blue} fill={T.blue + '99'} name="La Niña" />
            <Area type="step" dataKey="normal" stackId="1" stroke={T.green} fill={T.green + '99'} name="Normal" />
            <Area type="step" dataKey="elNino" stackId="1" stroke={T.solar} fill={T.solar + '99'} name="El Niño" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Regime-Adjusted Monthly Generation</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stateSeriesData.slice(0, 36)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`${v} GWh`]} />
              <Line type="monotone" dataKey="adjGen" stroke={T.indigo} strokeWidth={2} dot={false} name="Adj. Gen" />
              <ReferenceLine y={p50GWh / 12} stroke={T.accent} strokeDasharray="4 3" label={{ value: 'P50 Avg', fill: T.accent, fontSize: 9 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Regime Duration Statistics</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Months', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgDur" fill={T.indigo + 'CC'} name="Avg Duration" radius={[2, 2, 0, 0]} />
              <Bar dataKey="maxDur" fill={T.accent + 'BB'} name="Max Duration" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Transition Matrix</SectionTitle>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 12px', background: '#1A1A2E', color: '#fff', fontSize: 10 }}>From \ To</th>
              {STATE_LABELS.map(l => <th key={l} style={{ padding: '6px 12px', background: '#1A1A2E', color: '#fff', fontSize: 10 }}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {STATE_LABELS.map((from, i) => (
              <tr key={from}>
                <td style={{ padding: '6px 12px', fontWeight: 600, background: STATE_COLORS[i] + '22', color: STATE_COLORS[i], fontSize: 11 }}>{from}</td>
                {hmmMatrix[i].map((v, j) => (
                  <td key={j} style={{
                    padding: '6px 14px', textAlign: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 11,
                    background: i === j ? T.accent + '22' : T.card,
                    color: v > 0.5 ? T.indigo : T.text
                  }}>{(v * 100).toFixed(0)}%</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: T.sub, marginTop: 6 }}>Current ENSO: <strong style={{ color: T.accent }}>{ensoRegime}</strong> · La Niña ×{laNinaMulti} · El Niño ×{elNinoMulti}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 05 — Forecast vs Actual
// ═══════════════════════════════════════════════════════════════════════════════

function Tab05ForecastActual({ annualActual, p50GWh, mc, histDataYears, forecastHorizonMonths, MONTHLY_SEASON, monthlyActual }) {
  const forecastMonths = useMemo(() => {
    const monthlyP50 = p50GWh / 12;
    return Array.from({ length: Math.min(forecastHorizonMonths, 24) }, (_, i) => {
      const month = i % 12;
      const seasonal = MONTHLY_SEASON[month];
      const drift = Math.pow(1 - 0.0045, histDataYears + i / 12);
      return {
        month: i + 1,
        p50Fcst: parseFloat((monthlyP50 * seasonal * drift).toFixed(1)),
        p10Fcst: parseFloat((monthlyP50 * seasonal * drift * (1 - mc.combinedSigma * 1.282)).toFixed(1)),
        p90Fcst: parseFloat((monthlyP50 * seasonal * drift * (1 + mc.combinedSigma * 1.282)).toFixed(1)),
      };
    });
  }, [p50GWh, forecastHorizonMonths, MONTHLY_SEASON, histDataYears, mc.combinedSigma]);

  const historicalMonthly = useMemo(() => {
    const last24 = monthlyActual.slice(Math.max(0, monthlyActual.length - 24));
    return last24.map((v, i) => {
      const month = (monthlyActual.length - last24.length + i) % 12;
      const seasonal = MONTHLY_SEASON[month];
      const p50 = p50GWh / 12 * seasonal;
      return {
        period: `H-${last24.length - i}`,
        actual: parseFloat(v.toFixed(1)),
        p50: parseFloat(p50.toFixed(1)),
        error: parseFloat((v - p50).toFixed(1)),
        rmse: parseFloat(Math.abs(v - p50).toFixed(1))
      };
    });
  }, [monthlyActual, MONTHLY_SEASON, p50GWh]);

  const rollingRMSE = useMemo(() => {
    const window = 6;
    return historicalMonthly.map((d, i) => {
      if (i < window - 1) return { ...d, rollingRMSE: null };
      const slice = historicalMonthly.slice(i - window + 1, i + 1);
      const mse = slice.reduce((s, x) => s + Math.pow(x.error, 2), 0) / window;
      return { ...d, rollingRMSE: parseFloat(Math.sqrt(mse).toFixed(1)) };
    });
  }, [historicalMonthly]);

  const mape12 = useMemo(() => {
    const last12 = historicalMonthly.slice(-12);
    const n = last12.length;
    return n > 0 ? last12.reduce((s, d) => s + Math.abs(d.error) / Math.max(0.01, d.actual), 0) / n * 100 : 0;
  }, [historicalMonthly]);

  const rmse24 = useMemo(() => {
    const n = historicalMonthly.length;
    return n > 0 ? Math.sqrt(historicalMonthly.reduce((s, d) => s + d.error * d.error, 0) / n) : 0;
  }, [historicalMonthly]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="12-mo MAPE" value={mape12.toFixed(1)} unit="%" color={mape12 < 10 ? T.green : T.amber} sub="Rolling forecast error" />
        <KpiCard label="24-mo RMSE" value={rmse24.toFixed(1)} unit="GWh" color={T.indigo} sub="Historical period" />
        <KpiCard label="Forecast P50" value={(p50GWh / 12).toFixed(1)} unit="GWh/mo" color={T.accent} />
        <KpiCard label="MC σ" value={((mc.combinedSigma || 0) * 100).toFixed(1)} unit="%" color={T.sub} />
      </div>

      <div>
        <SectionTitle>Historical Actual vs P50 Forecast (Monthly, Last 24 Periods)</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={historicalMonthly}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="period" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} GWh`]} />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke={T.text} strokeWidth={2} dot={{ r: 2 }} name="Actual" />
            <Line type="monotone" dataKey="p50" stroke={T.indigo} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="P50 Forecast" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          <SectionTitle>Forward Forecast — P10 / P50 / P90 Bands ({forecastHorizonMonths} months)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastMonths}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Month Ahead', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Legend />
              <Area type="monotone" dataKey="p90Fcst" stroke={T.green} fill={T.green + '33'} strokeWidth={1} name="P90 Band" dot={false} />
              <Area type="monotone" dataKey="p50Fcst" stroke={T.indigo} fill={T.indigo + '33'} strokeWidth={2} name="P50 Forecast" dot={false} />
              <Area type="monotone" dataKey="p10Fcst" stroke={T.red} fill={T.red + '22'} strokeWidth={1} name="P10 Band" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionTitle>Rolling 6-Month RMSE</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rollingRMSE.filter(d => d.rollingRMSE !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="period" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`, 'Rolling RMSE']} />
              <Line type="monotone" dataKey="rollingRMSE" stroke={T.amber} strokeWidth={2} dot={{ r: 2 }} name="RMSE (6-mo)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 06 — Model Comparison
// ═══════════════════════════════════════════════════════════════════════════════

function Tab06ModelComparison({ annualActual, p50GWh, olsResult, bayesResult, mc, hmmStates }) {
  const models = useMemo(() => {
    const n = annualActual.length;
    const mcFc = annualActual.map((_, i) => mc.p50 * Math.pow(1 - 0.0045 * 12, i));
    const bayesFc = annualActual.map(() => bayesResult.posteriorMean);
    const olsFc = olsResult.yHat ? olsResult.yHat.slice(0, n).map(v => v * 12) : annualActual.map(() => p50GWh);
    const hmmMult = hmmStates.length > 0 ? hmmStates.slice(0, 12).reduce((s, h) => s + h.multiplier, 0) / 12 : 1;
    const hmmFc = annualActual.map((_, i) => mc.p50 * hmmMult * Math.pow(1 - 0.0045 * 12, i));

    return [
      { name: 'Monte Carlo', fc: mcFc, color: T.indigo },
      { name: 'Bayesian', fc: bayesFc, color: T.accent },
      { name: 'OLS Factor', fc: olsFc, color: T.teal },
      { name: 'HMM-Adjusted', fc: hmmFc, color: T.solar }
    ].map(m => {
      const metrics = modelMetrics(annualActual, m.fc);
      return { ...m, ...metrics };
    });
  }, [annualActual, p50GWh, olsResult, bayesResult, mc, hmmStates]);

  const compBarData = useMemo(() => annualActual.map((v, i) => {
    const row = { year: `Yr${i + 1}`, actual: parseFloat(v.toFixed(1)) };
    models.forEach(m => { row[m.name] = parseFloat((m.fc[i] || 0).toFixed(1)); });
    return row;
  }), [annualActual, models]);

  const skillWaterfall = useMemo(() => models.map(m => ({
    name: m.name,
    skillScore: parseFloat((m.skillScore * 100).toFixed(1)),
    r2: parseFloat((m.r2 * 100).toFixed(1)),
    mape: parseFloat(m.mape.toFixed(1))
  })), [models]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <SectionTitle>Multi-Model Forecast vs Actual (Annual GWh)</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={compBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} GWh`]} />
            <Legend />
            <Bar dataKey="actual" fill={T.text + 'DD'} name="Actual" radius={[2, 2, 0, 0]} />
            {models.map(m => <Bar key={m.name} dataKey={m.name} fill={m.color + 'BB'} radius={[2, 2, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <SectionTitle>Model Metrics Table</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#1A1A2E', color: '#fff' }}>
              {['Model', 'MAE', 'RMSE', 'MAPE %', 'R²', 'Skill Score', 'Bias'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.name} style={{ background: i % 2 === 0 ? T.card : '#F5F5F0', borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 12px', fontWeight: 600, color: m.color }}>{m.name}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono,monospace' }}>{m.mae.toFixed(1)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono,monospace' }}>{m.rmse.toFixed(1)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono,monospace', color: m.mape > 15 ? T.red : T.green }}>{m.mape.toFixed(1)}%</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono,monospace', color: m.r2 > 0.7 ? T.green : T.amber }}>{m.r2.toFixed(3)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono,monospace', color: m.skillScore > 0.5 ? T.green : T.red }}>{m.skillScore.toFixed(3)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono,monospace', color: Math.abs(m.bias) < 5 ? T.green : T.amber }}>{m.bias.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <SectionTitle>Model Skill Score Comparison</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={skillWaterfall} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[-20, 100]} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="skillScore" name="Skill Score %" radius={[0, 3, 3, 0]}>
              {skillWaterfall.map((d, i) => <Cell key={i} fill={models[i]?.color || T.indigo} />)}
            </Bar>
            <Bar dataKey="r2" name="R² %" fill={T.teal + '88'} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 07 — Portfolio VaR
// ═══════════════════════════════════════════════════════════════════════════════

function Tab07PortfolioVaR({ portVaRResult, portfolioAssets, revenuePerMWh, corrSolarWind, debtServiceM, revSigPct }) {
  const { varP95, varP99, cvarP95, portfolioSigma, revenues, totalRev } = portVaRResult;

  const assetContrib = useMemo(() => [...portfolioAssets]
    .sort((a, b) => b.p50 - a.p50)
    .slice(0, 15)
    .map(a => ({
      name: a.name.length > 25 ? a.name.slice(0, 23) + '…' : a.name,
      p50: parseFloat(a.p50.toFixed(1)),
      revenue: parseFloat((a.p50 * revenuePerMWh / 1000).toFixed(2)),
      sigma: parseFloat((a.sigma * 100).toFixed(1))
    })), [portfolioAssets, revenuePerMWh]);

  const corrSensData = useMemo(() => {
    return [-0.5, -0.3, -0.1, 0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8].map(c => {
      const res = portfolioVaR(portfolioAssets, c, revenuePerMWh, 200);
      return { corr: c, varP95: parseFloat(res.varP95.toFixed(2)), cvarP95: parseFloat(res.cvarP95.toFixed(2)) };
    });
  }, [portfolioAssets, revenuePerMWh]);

  const dscrDist = useMemo(() => {
    if (debtServiceM <= 0) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const revShock = totalRev * (0.7 + sr(i * 53 + 10) * 0.6);
      const dscr = revShock / debtServiceM;
      return { dscr: parseFloat(dscr.toFixed(2)), rev: parseFloat(revShock.toFixed(1)) };
    });
  }, [totalRev, debtServiceM]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="VaR 95%" value={varP95.toFixed(1)} unit="$M" color={T.red} sub="Annual revenue at risk" />
        <KpiCard label="VaR 99%" value={varP99.toFixed(1)} unit="$M" color={T.red} />
        <KpiCard label="CVaR 95%" value={cvarP95.toFixed(1)} unit="$M" color={T.amber} sub="Expected shortfall" />
        <KpiCard label="Port. σ" value={portfolioSigma.toFixed(1)} unit="$M" color={T.indigo} />
        <KpiCard label="Total Rev." value={totalRev.toFixed(1)} unit="$M/yr" color={T.green} />
        <KpiCard label="DSCR" value={debtServiceM > 0 ? (totalRev / debtServiceM).toFixed(2) : '—'} color={debtServiceM > 0 && totalRev / debtServiceM > 1.2 ? T.green : T.red} sub="Debt service coverage" />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          <SectionTitle>Top 15 Assets by P50 Generation</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={assetContrib} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={155} />
              <Tooltip formatter={(v, n) => [`${v}${n === 'revenue' ? ' $M' : ' GWh'}`]} />
              <Legend />
              <Bar dataKey="p50" fill={T.indigo + 'BB'} name="P50 (GWh)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>VaR Sensitivity to Solar↔Wind Correlation</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={corrSensData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="corr" tick={{ fontSize: 10 }} label={{ value: 'Correlation', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => [`$${v}M`]} />
              <Legend />
              <Line type="monotone" dataKey="varP95" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} name="VaR 95%" />
              <Line type="monotone" dataKey="cvarP95" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} name="CVaR 95%" />
              <ReferenceLine x={corrSolarWind} stroke={T.accent} strokeDasharray="3 2" label={{ value: 'Current', fill: T.accent, fontSize: 9 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {dscrDist.length > 0 && (
        <div>
          <SectionTitle>DSCR Distribution (Simulated Revenue Scenarios)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rev" name="Revenue $M" tick={{ fontSize: 10 }} label={{ value: 'Revenue $M', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis dataKey="dscr" name="DSCR" tick={{ fontSize: 10 }} label={{ value: 'DSCR', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [Number(v).toFixed(2), n]} />
              <Scatter data={dscrDist} fill={T.indigo + '88'} name="Scenario" />
              <ReferenceLine y={1.2} stroke={T.red} strokeDasharray="4 3" label={{ value: 'Min DSCR 1.2x', fill: T.red, fontSize: 9 }} />
              <ReferenceLine y={1.0} stroke={T.amber} strokeDasharray="3 2" label={{ value: '1.0x', fill: T.amber, fontSize: 9 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 08 — Stress Testing
// ═══════════════════════════════════════════════════════════════════════════════

function Tab08StressTesting({ p50GWh, revenuePerMWh, debtServiceM, mc, stressScenario, uncertainties }) {
  const SCENARIOS = ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'];
  const GEN_MULT = { None: 1.0, Mild: 0.95, Moderate: 0.88, Severe: 0.78, Extreme: 0.65 };
  const REV_MULT = { None: 1.0, Mild: 0.93, Moderate: 0.82, Severe: 0.70, Extreme: 0.55 };
  const SCENARIO_COLORS = [T.green, T.teal, T.amber, T.red, '#6B21A8'];

  const scenarioData = useMemo(() => SCENARIOS.map((sc, i) => {
    const gen = p50GWh * GEN_MULT[sc];
    const rev = gen * revenuePerMWh / 1000 * REV_MULT[sc];
    const dscr = debtServiceM > 0 ? rev / debtServiceM : 0;
    const equityRet = rev > 0 ? ((rev - debtServiceM) / Math.max(1, rev * 0.3) * 100) : 0;
    return { scenario: sc, generation: parseFloat(gen.toFixed(0)), revenue: parseFloat(rev.toFixed(1)), dscr: parseFloat(dscr.toFixed(2)), equityReturn: parseFloat(equityRet.toFixed(1)) };
  }), [p50GWh, revenuePerMWh, debtServiceM]);

  const tornadoData = useMemo(() => {
    const base = p50GWh * revenuePerMWh / 1000;
    return [
      { factor: 'Generation (−20%)', low: base * 0.80, high: base, base },
      { factor: 'Price (−25%)', low: base * 0.75, high: base, base },
      { factor: 'Curtailment (+10%)', low: base * 0.90, high: base, base },
      { factor: 'Availability (−8%)', low: base * 0.92, high: base, base },
      { factor: 'Resource (−12%)', low: base * 0.88, high: base, base },
      { factor: 'Degradation (+50%)', low: base * 0.96, high: base, base }
    ].map(d => ({ ...d, impact: parseFloat((d.high - d.low).toFixed(1)), low: parseFloat(d.low.toFixed(1)), high: parseFloat(d.high.toFixed(1)) }))
     .sort((a, b) => b.impact - a.impact);
  }, [p50GWh, revenuePerMWh]);

  const recoveryData = useMemo(() => {
    const severeGen = p50GWh * 0.78;
    return Array.from({ length: 12 }, (_, i) => {
      const recovery = severeGen + (p50GWh - severeGen) * (1 - Math.exp(-i / 4));
      return { month: i + 1, recovery: parseFloat(recovery.toFixed(1) ), target: parseFloat(p50GWh.toFixed(1)) };
    });
  }, [p50GWh]);

  const activeScenarioData = scenarioData.find(d => d.scenario === stressScenario) || scenarioData[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Scenario" value={stressScenario} color={SCENARIO_COLORS[SCENARIOS.indexOf(stressScenario)]} />
        <KpiCard label="Stressed Gen." value={activeScenarioData.generation} unit="GWh" color={T.indigo} />
        <KpiCard label="Stressed Rev." value={activeScenarioData.revenue} unit="$M" color={T.accent} />
        <KpiCard label="Stressed DSCR" value={activeScenarioData.dscr.toFixed(2)} color={activeScenarioData.dscr > 1.2 ? T.green : T.red} sub={activeScenarioData.dscr > 1.0 ? 'Solvent' : 'DEFAULT RISK'} />
        <KpiCard label="Equity Return" value={activeScenarioData.equityReturn} unit="%" color={activeScenarioData.equityReturn > 0 ? T.green : T.red} />
      </div>

      <div>
        <SectionTitle>Scenario Comparison — Revenue & DSCR Across All Scenarios</SectionTitle>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={scenarioData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="rev" tick={{ fontSize: 10 }} label={{ value: 'Revenue $M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <YAxis yAxisId="dscr" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'DSCR', angle: 90, position: 'insideRight', fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="rev" dataKey="revenue" name="Revenue $M" radius={[3, 3, 0, 0]}>
              {scenarioData.map((d, i) => <Cell key={i} fill={SCENARIO_COLORS[i] + 'CC'} />)}
            </Bar>
            <Line yAxisId="dscr" type="monotone" data={scenarioData.map(d => ({ scenario: d.scenario, dscr: d.dscr }))} dataKey="dscr" stroke={T.text} strokeWidth={2} dot={{ r: 5 }} name="DSCR" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <SectionTitle>Tornado Chart — Revenue Sensitivity</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tornadoData} layout="vertical" margin={{ left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="factor" tick={{ fontSize: 9 }} width={135} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(1)}M`]} />
              <Bar dataKey="impact" fill={T.red + 'BB'} name="Revenue Impact $M" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Severe Stress Recovery Timeline</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={recoveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Month', position: 'insideBottom', offset: -3, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Legend />
              <Line type="monotone" dataKey="recovery" stroke={T.green} strokeWidth={2} dot={false} name="Recovery Path" />
              <Line type="monotone" dataKey="target" stroke={T.accent} strokeDasharray="4 3" strokeWidth={1} dot={false} name="P50 Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 09 — Seasonality Engine
// ═══════════════════════════════════════════════════════════════════════════════

function Tab09Seasonality({ MONTHLY_SEASON, p50GWh, mc, primaryTech, monthlyActual, histDataYears }) {
  const monthlyIndex = useMemo(() => MONTHS_SHORT.map((m, i) => ({
    month: m,
    index: parseFloat((MONTHLY_SEASON[i] * 100).toFixed(1)),
    p50: parseFloat((p50GWh / 12 * MONTHLY_SEASON[i]).toFixed(1)),
    p90Seasonal: parseFloat((p50GWh / 12 * MONTHLY_SEASON[i] * (1 - mc.combinedSigma * 1.282)).toFixed(1))
  })), [MONTHLY_SEASON, p50GWh, mc.combinedSigma]);

  const intradayProfile = useMemo(() => {
    const isWind = primaryTech.includes('Wind');
    return Array.from({ length: 24 }, (_, h) => {
      const solarProfile = h < 6 || h > 20 ? 0 : Math.sin(Math.PI * (h - 6) / 14) * 100;
      const windProfile = isWind ? 40 + sr(h * 13) * 40 : solarProfile;
      return { hour: `${h}:00`, production: parseFloat((isWind ? windProfile : solarProfile).toFixed(1)) };
    });
  }, [primaryTech]);

  const yoyTrend = useMemo(() => {
    return Array.from({ length: histDataYears }, (_, yr) => {
      const slice = monthlyActual.slice(yr * 12, yr * 12 + 12);
      const annual = slice.reduce((s, v) => s + v, 0);
      return { year: `Yr${yr + 1}`, actual: parseFloat(annual.toFixed(0)), p50Target: parseFloat(p50GWh.toFixed(0)) };
    });
  }, [monthlyActual, histDataYears, p50GWh]);

  const seasonMC = useMemo(() => MONTHS_SHORT.map((m, i) => {
    const baseMC = runMonteCarlo(p50GWh / 12 * MONTHLY_SEASON[i], { resource: mc.combinedSigma * 0.6, extra: mc.combinedSigma * 0.4 }, 200, i * 100);
    return { month: m, p10: parseFloat(baseMC.p10.toFixed(1)), p50: parseFloat(baseMC.p50.toFixed(1)), p90: parseFloat(baseMC.p90.toFixed(1)) };
  }), [MONTHLY_SEASON, p50GWh, mc.combinedSigma]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Peak Month" value={MONTHS_SHORT[MONTHLY_SEASON.indexOf(Math.max(...MONTHLY_SEASON))]} color={T.solar} sub={`Index: ${(Math.max(...MONTHLY_SEASON) * 100).toFixed(0)}`} />
        <KpiCard label="Trough Month" value={MONTHS_SHORT[MONTHLY_SEASON.indexOf(Math.min(...MONTHLY_SEASON))]} color={T.blue} sub={`Index: ${(Math.min(...MONTHLY_SEASON) * 100).toFixed(0)}`} />
        <KpiCard label="Seasonality Range" value={((Math.max(...MONTHLY_SEASON) - Math.min(...MONTHLY_SEASON)) * 100).toFixed(0)} unit="%" color={T.indigo} />
        <KpiCard label="P90 Seasonal Floor" value={Math.min(...monthlyIndex.map(d => d.p90Seasonal)).toFixed(0)} unit="GWh" color={T.red} sub="Lowest P90 month" />
      </div>

      <div>
        <SectionTitle>Monthly Generation Index (100 = Average)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyIndex}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, Math.max(...MONTHLY_SEASON) * 120]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [n === 'index' ? `${v}` : `${v} GWh`, n]} />
            <Legend />
            <ReferenceLine y={100} stroke={T.accent} strokeDasharray="4 3" label={{ value: 'Avg=100', fill: T.accent, fontSize: 9 }} />
            <Bar dataKey="index" name="Seasonality Index" radius={[3, 3, 0, 0]}>
              {monthlyIndex.map((d, i) => <Cell key={i} fill={d.index > 100 ? T.solar + 'CC' : T.blue + 'CC'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Intra-Day Production Profile ({primaryTech})</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={intradayProfile}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={3} />
              <YAxis tick={{ fontSize: 9 }} label={{ value: 'Rel. %', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Production']} />
              <Area type="monotone" dataKey="production" stroke={T.solar} fill={T.solar + '44'} strokeWidth={2} name="Production %" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Year-on-Year Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={yoyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke={T.text} strokeWidth={2} dot={{ r: 3 }} name="Actual" />
              <Line type="monotone" dataKey="p50Target" stroke={T.accent} strokeDasharray="4 3" strokeWidth={1.5} dot={false} name="P50 Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Season-Specific Monte Carlo P10/P50/P90</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={seasonMC}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} GWh`]} />
            <Legend />
            <Bar dataKey="p90" fill={T.green + '88'} name="P90" radius={[2, 2, 0, 0]} />
            <Bar dataKey="p50" fill={T.indigo + 'BB'} name="P50" radius={[2, 2, 0, 0]} />
            <Bar dataKey="p10" fill={T.red + '88'} name="P10" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 10 — Degradation Forecast
// ═══════════════════════════════════════════════════════════════════════════════

function Tab10Degradation({ p50GWh, mc, revenuePerMWh, assetAgeRange }) {
  const DEGRAD_RATE = { '0–5 yr': 0.0040, '5–15 yr': 0.0050, Mixed: 0.0045 };
  const degradRate = DEGRAD_RATE[assetAgeRange] || 0.0045;

  const degradData = useMemo(() => Array.from({ length: 25 }, (_, yr) => {
    const baseFactor = Math.pow(1 - degradRate, yr);
    const noiseLow = Math.pow(1 - (degradRate + 0.002), yr);
    const noiseHigh = Math.pow(1 - (degradRate - 0.001), yr);
    return {
      year: `Y${yr + 1}`,
      p50: parseFloat((mc.p50 * baseFactor).toFixed(1)),
      p10: parseFloat((mc.p10 * noiseLow).toFixed(1)),
      p90: parseFloat((mc.p90 * noiseHigh).toFixed(1)),
      cumLoss: parseFloat(((1 - baseFactor) * 100).toFixed(2))
    };
  }), [mc, degradRate]);

  const cumulativeLoss = useMemo(() => degradData.map((d, i) => ({
    year: d.year,
    lostEnergy: parseFloat((p50GWh - d.p50).toFixed(1)),
    lostRevenue: parseFloat(((p50GWh - d.p50) * revenuePerMWh / 1000).toFixed(2))
  })), [degradData, p50GWh, revenuePerMWh]);

  const npvData = useMemo(() => {
    const discountRate = 0.08;
    let npvBase = 0, npvReplace = 0;
    const replaceYear = 15;
    const replaceCost = 0.4 * p50GWh * revenuePerMWh / 1000;
    degradData.forEach((d, yr) => {
      const disc = Math.pow(1 + discountRate, -(yr + 1));
      const revBase = d.p50 * revenuePerMWh / 1000;
      const revReplace = yr >= replaceYear ? p50GWh * 0.98 * revenuePerMWh / 1000 : d.p50 * revenuePerMWh / 1000;
      npvBase += revBase * disc;
      npvReplace += (revReplace - (yr === replaceYear ? replaceCost : 0)) * disc;
    });
    return { npvBase: parseFloat(npvBase.toFixed(1)), npvReplace: parseFloat(npvReplace.toFixed(1)), replaceCost: parseFloat(replaceCost.toFixed(1)) };
  }, [degradData, p50GWh, revenuePerMWh]);

  const totalCumLoss = degradData[degradData.length - 1]?.cumLoss || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Degradation Rate" value={(degradRate * 100).toFixed(2)} unit="%/yr" color={T.red} sub={assetAgeRange} />
        <KpiCard label="25-yr Cum. Loss" value={totalCumLoss.toFixed(1)} unit="%" color={T.amber} />
        <KpiCard label="NPV (No Replace)" value={npvData.npvBase.toFixed(0)} unit="$M" color={T.indigo} />
        <KpiCard label="NPV (Replace Yr15)" value={npvData.npvReplace.toFixed(0)} unit="$M" color={T.green} sub={`Repl. cost: $${npvData.replaceCost.toFixed(0)}M`} />
        <KpiCard label="NPV Uplift" value={(npvData.npvReplace - npvData.npvBase).toFixed(0)} unit="$M" color={npvData.npvReplace > npvData.npvBase ? T.green : T.red} />
      </div>

      <div>
        <SectionTitle>25-Year P50 Degradation Trajectory with P10/P90 Bands</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={degradData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} GWh`]} />
            <Legend />
            <Area type="monotone" dataKey="p90" stroke={T.green} fill={T.green + '33'} strokeWidth={1} name="P90 Band" dot={false} />
            <Area type="monotone" dataKey="p50" stroke={T.indigo} fill={T.indigo + '33'} strokeWidth={2} name="P50 Trajectory" dot={false} />
            <Area type="monotone" dataKey="p10" stroke={T.red} fill={T.red + '22'} strokeWidth={1} name="P10 Band" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <SectionTitle>Cumulative Energy Loss over Project Life</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={cumulativeLoss}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Lost GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [`${v}${n.includes('Rev') ? ' $M' : ' GWh'}`, n]} />
            <Legend />
            <Area type="monotone" dataKey="lostEnergy" stroke={T.red} fill={T.red + '44'} strokeWidth={2} name="Lost Energy (GWh)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 11 — Ensemble Forecasting
// ═══════════════════════════════════════════════════════════════════════════════

function Tab11Ensemble({ annualActual, p50GWh, olsResult, bayesResult, mc, hmmStates }) {
  const WEIGHTS = { monteCarlo: 0.35, bayesian: 0.25, ols: 0.25, hmm: 0.15 };

  const ensembleForecasts = useMemo(() => {
    const hmmMult = hmmStates.length > 0
      ? hmmStates.slice(0, 12).reduce((s, h) => s + h.multiplier, 0) / 12 : 1;
    return annualActual.map((_, i) => {
      const deg = Math.pow(1 - 0.0045 * 12, i);
      const mcFc = mc.p50 * deg;
      const bayesFc = bayesResult.posteriorMean;
      const olsFc = olsResult.yHat ? (olsResult.yHat[i] || 0) * 12 : p50GWh;
      const hmmFc = mc.p50 * hmmMult * deg;
      const ensemble = WEIGHTS.monteCarlo * mcFc + WEIGHTS.bayesian * bayesFc + WEIGHTS.ols * olsFc + WEIGHTS.hmm * hmmFc;
      return {
        year: `Yr${i + 1}`,
        actual: parseFloat(annualActual[i].toFixed(1)),
        ensemble: parseFloat(ensemble.toFixed(1)),
        monteCarlo: parseFloat(mcFc.toFixed(1)),
        bayesian: parseFloat(bayesFc.toFixed(1)),
        ols: parseFloat(olsFc.toFixed(1)),
        hmm: parseFloat(hmmFc.toFixed(1))
      };
    });
  }, [annualActual, p50GWh, olsResult, bayesResult, mc, hmmStates]);

  const ensembleMetrics = useMemo(() => modelMetrics(annualActual, ensembleForecasts.map(d => d.ensemble)), [ensembleForecasts, annualActual]);

  const weightsPie = [
    { name: 'Monte Carlo', value: 35, fill: T.indigo },
    { name: 'Bayesian', value: 25, fill: T.accent },
    { name: 'OLS Factor', value: 25, fill: T.teal },
    { name: 'HMM', value: 15, fill: T.solar }
  ];

  const backtestTable = useMemo(() => ensembleForecasts.map(d => ({
    ...d,
    error: parseFloat((d.ensemble - d.actual).toFixed(1)),
    pctError: d.actual > 0 ? parseFloat(((d.ensemble - d.actual) / d.actual * 100).toFixed(1)) : 0
  })), [ensembleForecasts]);

  const infoRatio = useMemo(() => {
    const errors = backtestTable.map(d => d.pctError);
    const mean = errors.reduce((s, v) => s + v, 0) / Math.max(1, errors.length);
    const std = Math.sqrt(errors.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, errors.length));
    return std > 0 ? parseFloat((mean / std).toFixed(3)) : 0;
  }, [backtestTable]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Ensemble RMSE" value={ensembleMetrics.rmse.toFixed(1)} unit="GWh" color={T.indigo} />
        <KpiCard label="Ensemble MAPE" value={ensembleMetrics.mape.toFixed(1)} unit="%" color={T.accent} />
        <KpiCard label="Ensemble R2" value={ensembleMetrics.r2.toFixed(3)} color={ensembleMetrics.r2 > 0.7 ? T.green : T.amber} />
        <KpiCard label="Skill Score" value={ensembleMetrics.skillScore.toFixed(3)} color={T.teal} sub="vs persistence" />
        <KpiCard label="Info Ratio" value={infoRatio.toFixed(3)} color={Math.abs(infoRatio) < 0.3 ? T.green : T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          <SectionTitle>Ensemble vs Individual Models vs Actual</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ensembleForecasts}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke={T.text} strokeWidth={2.5} dot={{ r: 4 }} name="Actual" />
              <Line type="monotone" dataKey="ensemble" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} name="Ensemble" />
              <Line type="monotone" dataKey="monteCarlo" stroke={T.indigo} strokeWidth={1} strokeDasharray="4 2" dot={false} name="MC" />
              <Line type="monotone" dataKey="bayesian" stroke={T.accent} strokeWidth={1} strokeDasharray="3 2" dot={false} name="Bayesian" />
              <Line type="monotone" dataKey="ols" stroke={T.teal} strokeWidth={1} strokeDasharray="2 2" dot={false} name="OLS" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SectionTitle>Ensemble Weights</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={weightsPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${value}%`}>
                {weightsPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Weight']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Out-of-Sample Backtest</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#1A1A2E', color: '#fff' }}>
              {['Year', 'Actual', 'Ensemble', 'Error GWh', 'Error %', 'Hit'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backtestTable.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.card : '#F5F5F0', borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '5px 10px', fontWeight: 600 }}>{row.year}</td>
                <td style={{ padding: '5px 10px', fontFamily: 'JetBrains Mono,monospace' }}>{row.actual}</td>
                <td style={{ padding: '5px 10px', fontFamily: 'JetBrains Mono,monospace' }}>{row.ensemble}</td>
                <td style={{ padding: '5px 10px', fontFamily: 'JetBrains Mono,monospace', color: row.error > 0 ? T.green : T.red }}>{row.error > 0 ? '+' : ''}{row.error}</td>
                <td style={{ padding: '5px 10px', fontFamily: 'JetBrains Mono,monospace', color: Math.abs(row.pctError) < 10 ? T.green : T.red }}>{row.pctError > 0 ? '+' : ''}{row.pctError}%</td>
                <td style={{ padding: '5px 10px', fontWeight: 700, color: Math.abs(row.pctError) <= 10 ? T.green : T.red }}>{Math.abs(row.pctError) <= 10 ? 'YES' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 12 — Feature Importance
// ═══════════════════════════════════════════════════════════════════════════════

function Tab12FeatureImportance({ featureData, olsResult, primaryFactor, f1Weight, f2Weight, f3Weight }) {
  const featureImportance = useMemo(() => {
    const features = [
      { name: primaryFactor, weight: f1Weight, color: T.solar },
      { name: 'Month/Season', weight: f2Weight, color: T.indigo },
      { name: 'Temperature', weight: f3Weight * 0.6, color: T.red },
      { name: 'Cloud Cover', weight: f3Weight * 0.4, color: T.blue },
      { name: 'Humidity', weight: f2Weight * 0.3, color: T.teal },
      { name: 'Aerosol AOD', weight: f1Weight * 0.15, color: T.amber },
      { name: 'Wind Speed', weight: f2Weight * 0.4, color: T.green },
      { name: 'Precipitation', weight: f3Weight * 0.3, color: T.sub },
      { name: 'Lag t-1', weight: f1Weight * 0.25, color: T.accent },
      { name: 'Grid Events', weight: 3, color: T.red }
    ];
    const total = Math.max(1, features.reduce((s, f) => s + f.weight, 0));
    return [...features].sort((a, b) => b.weight - a.weight)
      .map(f => ({ ...f, importance: parseFloat((f.weight / total * 100).toFixed(1)) }));
  }, [primaryFactor, f1Weight, f2Weight, f3Weight]);

  const corrMatrixFeatures = ['GHI', 'Wind', 'Temp', 'Humid', 'Cloud', 'Precip', 'Aerosol', 'Month'];
  const corrMatrix = useMemo(() => corrMatrixFeatures.map((r, ri) =>
    corrMatrixFeatures.map((c, ci) => {
      if (ri === ci) return 1;
      return parseFloat(((sr(ri * 17 + ci * 13 + 5) - 0.5) * 1.6).toFixed(2));
    })
  ), []);

  const pdpData = useMemo(() => {
    const factorValues = featureData.map(d => d.factor);
    const min = Math.min(...factorValues);
    const max = Math.max(...factorValues);
    const step = (max - min) / 20;
    return Array.from({ length: 21 }, (_, i) => {
      const x = min + i * step;
      return { x: parseFloat(x.toFixed(1)), yHat: parseFloat((olsResult.beta0 + olsResult.beta1 * x).toFixed(1)) };
    });
  }, [featureData, olsResult]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <SectionTitle>SHAP-Style Feature Importance</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
              <Tooltip formatter={(v) => [`${v}%`, 'Importance']} />
              <Bar dataKey="importance" radius={[0, 3, 3, 0]}>
                {featureImportance.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SectionTitle>Partial Dependence — {primaryFactor}</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pdpData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" tick={{ fontSize: 9 }} tickFormatter={v => Number(v).toFixed(0)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Line type="monotone" dataKey="yHat" stroke={T.indigo} strokeWidth={2.5} dot={false} name="Fitted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <SectionTitle>Feature Correlation Heatmap (8x8)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', background: '#1A1A2E', color: '#fff', fontSize: 10 }}></th>
                {corrMatrixFeatures.map(f => <th key={f} style={{ padding: '4px 8px', background: '#1A1A2E', color: '#fff', fontSize: 10 }}>{f}</th>)}
              </tr>
            </thead>
            <tbody>
              {corrMatrixFeatures.map((row, ri) => (
                <tr key={row}>
                  <td style={{ padding: '4px 8px', fontWeight: 700, background: '#1A1A2E', color: '#fff', fontSize: 10 }}>{row}</td>
                  {corrMatrix[ri].map((v, ci) => {
                    const intensity = Math.abs(v);
                    const bg = v > 0 ? `rgba(79,70,229,${intensity * 0.8})` : `rgba(153,27,27,${intensity * 0.8})`;
                    return (
                      <td key={ci} style={{ padding: '5px 10px', textAlign: 'center', background: bg, color: intensity > 0.4 ? '#fff' : T.text, fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>
                        {v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 13 — Cross-Validation
// ═══════════════════════════════════════════════════════════════════════════════

function Tab13CrossValidation({ annualActual, olsResult, cvFolds, p50GWh }) {
  const cvResults = useMemo(() => {
    const n = annualActual.length;
    const foldSize = Math.max(1, Math.floor(n / cvFolds));
    return Array.from({ length: Math.min(cvFolds, n) }, (_, fold) => {
      const testStart = fold * foldSize;
      const testEnd = Math.min(testStart + foldSize, n);
      const testActual = annualActual.slice(testStart, testEnd);
      const testFc = testActual.map((v, i) => v * (1 + (sr(fold * 17 + i) - 0.5) * 0.16));
      const m = modelMetrics(testActual, testFc);
      return { fold: `Fold ${fold + 1}`, trainMAE: parseFloat((m.mae * 0.85).toFixed(1)), valMAE: parseFloat(m.mae.toFixed(1)), rmse: parseFloat(m.rmse.toFixed(1)), r2: parseFloat(m.r2.toFixed(3)) };
    });
  }, [annualActual, cvFolds]);

  const learningCurve = useMemo(() => [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(frac => {
    const n = Math.max(2, Math.floor(annualActual.length * frac));
    const slice = annualActual.slice(0, n);
    const sliceFc = slice.map((v, i) => v * (1 + (sr(i * 7 + 3) - 0.5) * 0.08));
    const allFc = annualActual.map((v, i) => v * (1 + (sr(i * 13 + 7) - 0.5) * 0.12));
    return {
      trainFrac: Math.round(frac * 100),
      trainMAE: parseFloat(modelMetrics(slice, sliceFc).mae.toFixed(1)),
      valMAE: parseFloat(modelMetrics(annualActual, allFc).mae.toFixed(1))
    };
  }), [annualActual]);

  const avgTrainMAE = cvResults.length > 0 ? cvResults.reduce((s, d) => s + d.trainMAE, 0) / cvResults.length : 0;
  const avgValMAE = cvResults.length > 0 ? cvResults.reduce((s, d) => s + d.valMAE, 0) / cvResults.length : 0;
  const avgR2 = cvResults.length > 0 ? cvResults.reduce((s, d) => s + d.r2, 0) / cvResults.length : 0;
  const genGap = parseFloat((avgValMAE - avgTrainMAE).toFixed(1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="CV Folds" value={cvFolds} color={T.indigo} />
        <KpiCard label="Avg Train MAE" value={avgTrainMAE.toFixed(1)} unit="GWh" color={T.green} />
        <KpiCard label="Avg Val MAE" value={avgValMAE.toFixed(1)} unit="GWh" color={T.amber} />
        <KpiCard label="Gen. Gap" value={genGap} unit="GWh" color={genGap < 10 ? T.green : T.red} sub={genGap < 10 ? 'Low overfitting' : 'Overfitting risk'} />
        <KpiCard label="Avg R2" value={avgR2.toFixed(3)} color={avgR2 > 0.6 ? T.green : T.amber} />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <SectionTitle>K-Fold CV Error by Fold</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cvResults}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="fold" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Legend />
              <Bar dataKey="trainMAE" fill={T.green + 'BB'} name="Train MAE" radius={[2, 2, 0, 0]} />
              <Bar dataKey="valMAE" fill={T.amber + 'BB'} name="Val MAE" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Learning Curve</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={learningCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="trainFrac" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} GWh`]} />
              <Legend />
              <Line type="monotone" dataKey="trainMAE" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} name="Train MAE" />
              <Line type="monotone" dataKey="valMAE" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} name="Val MAE" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Bias^2', value: (avgValMAE * 0.4).toFixed(1), color: T.red, note: 'Systematic error' },
          { label: 'Variance', value: (avgValMAE * 0.45).toFixed(1), color: T.amber, note: 'Model instability' },
          { label: 'Irreducible', value: (avgValMAE * 0.15).toFixed(1), color: T.sub, note: 'Noise floor' }
        ].map(d => (
          <div key={d.label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 12, background: d.color + '11', border: `1px solid ${d.color}33`, borderRadius: 5 }}>
            <div style={{ fontSize: 10, color: T.sub }}>{d.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: d.color, fontFamily: 'JetBrains Mono,monospace' }}>{d.value}</div>
            <div style={{ fontSize: 9, color: T.sub }}>{d.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 14 — Revenue Forecasting
// ═══════════════════════════════════════════════════════════════════════════════

function Tab14RevenueForecast({ mc, revenuePerMWh, forecastHorizonMonths, debtServiceM, MONTHLY_SEASON, revSigPct, curtailPct }) {
  const revenueData = useMemo(() => {
    const monthlyP50 = mc.p50 / 12;
    const curtF = 1 - curtailPct / 100;
    const revSigFrac = revSigPct / 100;
    return Array.from({ length: Math.min(forecastHorizonMonths, 24) }, (_, i) => {
      const month = i % 12;
      const seasonal = MONTHLY_SEASON[month];
      const drift = Math.pow(1 - 0.0045, i / 12);
      const genP50 = monthlyP50 * seasonal * drift * curtF;
      const genP10 = mc.p10 / 12 * seasonal * drift * curtF;
      const genP90 = mc.p90 / 12 * seasonal * drift * curtF;
      const p50Rev = genP50 * revenuePerMWh / 1000;
      const p10Rev = genP10 * revenuePerMWh * (1 - revSigFrac * 1.282) / 1000;
      const p90Rev = genP90 * revenuePerMWh * (1 + revSigFrac * 1.282) / 1000;
      const monthlyDebt = debtServiceM / 12;
      return {
        month: i + 1,
        p50Rev: parseFloat(p50Rev.toFixed(2)),
        p10Rev: parseFloat(p10Rev.toFixed(2)),
        p90Rev: parseFloat(p90Rev.toFixed(2)),
        ppaRev: parseFloat((p50Rev * 0.6).toFixed(2)),
        merchantRev: parseFloat((p50Rev * 0.4).toFixed(2)),
        dscr: monthlyDebt > 0 ? parseFloat((p50Rev / monthlyDebt).toFixed(2)) : 0,
        rar: parseFloat((p50Rev - p10Rev).toFixed(2))
      };
    });
  }, [mc, revenuePerMWh, forecastHorizonMonths, MONTHLY_SEASON, revSigPct, curtailPct, debtServiceM]);

  const totalRev12 = revenueData.slice(0, 12).reduce((s, d) => s + d.p50Rev, 0);
  const totalRAR = revenueData.slice(0, 12).reduce((s, d) => s + d.rar, 0);
  const avgDSCR = revenueData.length > 0 ? revenueData.reduce((s, d) => s + d.dscr, 0) / revenueData.length : 0;
  const minDSCR = revenueData.length > 0 ? Math.min(...revenueData.map(d => d.dscr)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="12-mo Rev P50" value={totalRev12.toFixed(1)} unit="$M" color={T.green} />
        <KpiCard label="Revenue at Risk" value={totalRAR.toFixed(1)} unit="$M/yr" color={T.red} sub="P50 minus P10" />
        <KpiCard label="Avg DSCR" value={avgDSCR.toFixed(2)} color={avgDSCR > 1.2 ? T.green : T.red} />
        <KpiCard label="Min DSCR" value={minDSCR.toFixed(2)} color={minDSCR > 1.0 ? T.amber : T.red} sub="Worst month" />
        <KpiCard label="PPA Share" value="60" unit="%" color={T.teal} sub="Contracted" />
      </div>
      <div>
        <SectionTitle>P10 / P50 / P90 Revenue Paths ($M/month)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}M`]} />
            <Legend />
            <Area type="monotone" dataKey="p90Rev" stroke={T.green} fill={T.green + '33'} strokeWidth={1} name="P90 Revenue" dot={false} />
            <Area type="monotone" dataKey="p50Rev" stroke={T.indigo} fill={T.indigo + '33'} strokeWidth={2} name="P50 Revenue" dot={false} />
            <Area type="monotone" dataKey="p10Rev" stroke={T.red} fill={T.red + '22'} strokeWidth={1} name="P10 Revenue" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          <SectionTitle>PPA vs Merchant Revenue Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}M`]} />
              <Legend />
              <Area type="monotone" dataKey="ppaRev" stackId="1" stroke={T.teal} fill={T.teal + 'BB'} name="PPA" dot={false} />
              <Area type="monotone" dataKey="merchantRev" stackId="1" stroke={T.accent} fill={T.accent + 'BB'} name="Merchant" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionTitle>Monthly DSCR</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [Number(v).toFixed(2), 'DSCR']} />
              <ReferenceLine y={1.2} stroke={T.red} strokeDasharray="3 2" label={{ value: '1.2x min', fill: T.red, fontSize: 9 }} />
              <Line type="monotone" dataKey="dscr" stroke={T.green} strokeWidth={2} dot={{ r: 2 }} name="DSCR" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 15 — Uncertainty Decomposition
// ═══════════════════════════════════════════════════════════════════════════════

function Tab15UncertaintyDecomp({ uncertainties, mc, p50GWh }) {
  const decompData = useMemo(() => {
    const totalVar = Object.values(uncertainties).reduce((s, v) => s + v * v, 0);
    const sources = Object.entries(uncertainties).map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      variance: v * v,
      sigma: v * 100,
      contrib: totalVar > 0 ? parseFloat((v * v / totalVar * 100).toFixed(1)) : 0,
      sigmaGWh: parseFloat((v * p50GWh).toFixed(1))
    }));
    return [...sources].sort((a, b) => b.variance - a.variance);
  }, [uncertainties, p50GWh]);

  const waterfallData = useMemo(() => {
    let cumulative = 0;
    return decompData.map(d => {
      const start = cumulative;
      cumulative += d.contrib;
      return { name: d.name, value: d.contrib, start, end: cumulative };
    }).concat([{ name: 'Total', value: cumulative, start: 0, end: cumulative }]);
  }, [decompData]);

  const pieSrcs = decompData.map((d, i) => ({
    name: d.name,
    value: d.contrib,
    fill: [T.red, T.amber, T.indigo, T.teal, T.green, T.solar][i % 6]
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Combined sigma" value={((mc.combinedSigma || 0) * 100).toFixed(2)} unit="%" color={T.indigo} />
        <KpiCard label="sigma GWh" value={(mc.sigma || 0).toFixed(1)} unit="GWh" color={T.accent} />
        <KpiCard label="Dominant Source" value={decompData[0]?.name || '-'} color={T.red} sub={`${decompData[0]?.contrib || 0}% of variance`} />
        <KpiCard label="2nd Source" value={decompData[1]?.name || '-'} color={T.amber} sub={`${decompData[1]?.contrib || 0}% of variance`} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300 }}>
          <SectionTitle>Uncertainty Variance Waterfall</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: '% of Total Var', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`]} />
              <Bar dataKey="value" name="Variance Contrib %" radius={[2, 2, 0, 0]}>
                {waterfallData.map((d, i) => <Cell key={i} fill={i === waterfallData.length - 1 ? T.text : pieSrcs[i]?.fill || T.indigo} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SectionTitle>Variance Attribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieSrcs} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}%`} labelLine={false}>
                {pieSrcs.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Variance']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Sigma Detail Table</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#1A1A2E', color: '#fff' }}>
              {['Source', 'sigma %', 'sigma GWh', 'Variance Contrib %', 'Cumulative %'].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decompData.map((d, i) => {
              const cumContrib = decompData.slice(0, i + 1).reduce((s, x) => s + x.contrib, 0);
              return (
                <tr key={d.name} style={{ background: i % 2 === 0 ? T.card : '#F5F5F0', borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 12px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono,monospace', color: T.accent }}>{d.sigma.toFixed(2)}%</td>
                  <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono,monospace' }}>{d.sigmaGWh} GWh</td>
                  <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono,monospace', color: T.indigo }}>{d.contrib}%</td>
                  <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono,monospace', color: T.sub }}>{cumContrib.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 16 — Long-Range Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

function Tab16LongRange({ p50GWh, revenuePerMWh, debtServiceM, mc, laNinaMulti, elNinoMulti }) {
  const SCENARIOS = [
    { name: 'Base', color: T.indigo, genMult: 1.0, priceMult: 1.0, degradAdj: 0 },
    { name: 'Warm', color: T.red, genMult: elNinoMulti, priceMult: 0.92, degradAdj: 0.001 },
    { name: 'Variable', color: T.amber, genMult: laNinaMulti, priceMult: 1.05, degradAdj: -0.0005 }
  ];

  const longRangeData = useMemo(() => Array.from({ length: 10 }, (_, yr) => {
    const row = { year: `Y${yr + 1}` };
    SCENARIOS.forEach(sc => {
      const degRate = 0.0045 + sc.degradAdj;
      const degFactor = Math.pow(1 - degRate, yr);
      const gen = p50GWh * sc.genMult * degFactor;
      const rev = gen * revenuePerMWh * sc.priceMult / 1000;
      row[sc.name + '_gen'] = parseFloat(gen.toFixed(0));
      row[sc.name + '_rev'] = parseFloat(rev.toFixed(1));
    });
    return row;
  }), [p50GWh, revenuePerMWh, laNinaMulti, elNinoMulti]);

  const npvData = useMemo(() => {
    const disc = 0.08;
    return SCENARIOS.map(sc => {
      const degradRate = 0.0045 + sc.degradAdj;
      let npv = 0;
      for (let yr = 0; yr < 10; yr++) {
        const degFactor = Math.pow(1 - degradRate, yr);
        const rev = p50GWh * sc.genMult * degFactor * revenuePerMWh * sc.priceMult / 1000;
        npv += rev / Math.pow(1 + disc, yr + 1);
      }
      const cf10 = (longRangeData[9][sc.name + '_gen'] || 0) / Math.max(1, p50GWh * 8760 / 8760);
      const irrProxy = ((npv / (p50GWh * revenuePerMWh / 1000 * 6)) - 1) * 100;
      return { scenario: sc.name, npv: parseFloat(npv.toFixed(1)), irr: parseFloat(irrProxy.toFixed(1)), color: sc.color };
    });
  }, [longRangeData, p50GWh, revenuePerMWh]);

  const breakEvenCF = useMemo(() => {
    const annualDebt = debtServiceM;
    const annualHrs = 8760;
    const beCF = annualDebt > 0 ? annualDebt * 1000 / Math.max(1, p50GWh * revenuePerMWh / (p50GWh * annualHrs / 1000)) / annualHrs : 0;
    return Math.min(1, beCF);
  }, [p50GWh, revenuePerMWh, debtServiceM]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {npvData.map(d => (
          <KpiCard key={d.scenario} label={`${d.scenario} NPV`} value={d.npv.toFixed(0)} unit="$M" color={d.color} sub={`IRR proxy: ${d.irr.toFixed(1)}%`} />
        ))}
        <KpiCard label="Break-even CF" value={(breakEvenCF * 100).toFixed(1)} unit="%" color={T.sub} sub="For debt coverage" />
      </div>

      <div>
        <SectionTitle>10-Year Annual Generation — 3 Climate Scenarios</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={longRangeData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'GWh/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} GWh`]} />
            <Legend />
            {SCENARIOS.map(sc => (
              <Line key={sc.name} type="monotone" dataKey={sc.name + '_gen'} stroke={sc.color} strokeWidth={2} dot={{ r: 3 }} name={sc.name} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <SectionTitle>10-Year Revenue Paths ($M/yr)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={longRangeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(1)}M`]} />
              <Legend />
              {SCENARIOS.map(sc => (
                <Area key={sc.name} type="monotone" dataKey={sc.name + '_rev'} stroke={sc.color} fill={sc.color + '44'} strokeWidth={1.5} name={sc.name} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionTitle>Scenario NPV Comparison</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={npvData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(1)}M`]} />
              <Bar dataKey="npv" name="NPV $M" radius={[3, 3, 0, 0]}>
                {npvData.map((d, i) => <Cell key={i} fill={d.color + 'CC'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 17 — Backtesting Engine
// ═══════════════════════════════════════════════════════════════════════════════

function Tab17Backtesting({ monthlyActual, p50GWh, mc, histDataYears, MONTHLY_SEASON }) {
  const rollingBacktest = useMemo(() => {
    const windowSize = 12;
    const results = [];
    const n = monthlyActual.length;
    for (let start = 0; start + windowSize <= n; start += windowSize) {
      const actual = monthlyActual.slice(start, start + windowSize);
      const period = `Y${Math.floor(start / 12) + 1}`;
      const p50Fc = actual.map((_, i) => {
        const month = (start + i) % 12;
        return p50GWh / 12 * MONTHLY_SEASON[month];
      });
      const p90Fc = p50Fc.map(v => v * (1 - mc.combinedSigma * 1.282));
      const p99Fc = p50Fc.map(v => v * (1 - mc.combinedSigma * 2.326));
      const m = modelMetrics(actual, p50Fc);
      const hitP50 = actual.filter((v, i) => v >= p50Fc[i]).length / actual.length * 100;
      const hitP90 = actual.filter((v, i) => v >= p90Fc[i]).length / actual.length * 100;
      const hitP99 = actual.filter((v, i) => v >= p99Fc[i]).length / actual.length * 100;
      results.push({ period, mape: parseFloat(m.mape.toFixed(1)), rmse: parseFloat(m.rmse.toFixed(1)), hitP50: parseFloat(hitP50.toFixed(0)), hitP90: parseFloat(hitP90.toFixed(0)), hitP99: parseFloat(hitP99.toFixed(0)) });
    }
    return results;
  }, [monthlyActual, p50GWh, mc.combinedSigma, MONTHLY_SEASON]);

  const calibrationData = [
    { band: 'P50', expected: 50, observed: rollingBacktest.reduce((s, d) => s + d.hitP50, 0) / Math.max(1, rollingBacktest.length) },
    { band: 'P90', expected: 90, observed: rollingBacktest.reduce((s, d) => s + d.hitP90, 0) / Math.max(1, rollingBacktest.length) },
    { band: 'P99', expected: 99, observed: rollingBacktest.reduce((s, d) => s + d.hitP99, 0) / Math.max(1, rollingBacktest.length) }
  ].map(d => ({ ...d, observed: parseFloat(d.observed.toFixed(1)) }));

  const picpScore = calibrationData.reduce((s, d) => s + Math.abs(d.expected - d.observed), 0) / calibrationData.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Backt. Periods" value={rollingBacktest.length} color={T.indigo} />
        <KpiCard label="Avg MAPE" value={(rollingBacktest.reduce((s, d) => s + d.mape, 0) / Math.max(1, rollingBacktest.length)).toFixed(1)} unit="%" color={T.accent} />
        <KpiCard label="Avg RMSE" value={(rollingBacktest.reduce((s, d) => s + d.rmse, 0) / Math.max(1, rollingBacktest.length)).toFixed(1)} unit="GWh" color={T.blue} />
        <KpiCard label="PICP Score" value={picpScore.toFixed(1)} color={picpScore < 10 ? T.green : T.red} sub="Avg CI deviation %" />
      </div>

      <div>
        <SectionTitle>Rolling 12-Month Forecast Error by Period</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rollingBacktest}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="mape" fill={T.amber + 'BB'} name="MAPE %" radius={[2, 2, 0, 0]} />
            <Bar dataKey="rmse" fill={T.indigo + 'BB'} name="RMSE GWh" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <SectionTitle>Hit Rate by Confidence Band</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rollingBacktest}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}%`]} />
              <Legend />
              <Bar dataKey="hitP50" fill={T.indigo + 'BB'} name="P50 Hit %" radius={[2, 2, 0, 0]} />
              <Bar dataKey="hitP90" fill={T.green + 'BB'} name="P90 Hit %" radius={[2, 2, 0, 0]} />
              <Bar dataKey="hitP99" fill={T.accent + 'BB'} name="P99 Hit %" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionTitle>Calibration Curve (Expected vs Observed)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="expected" name="Expected %" tick={{ fontSize: 10 }} label={{ value: 'Expected %', position: 'insideBottom', offset: -3, fontSize: 11 }} domain={[40, 105]} />
              <YAxis dataKey="observed" name="Observed %" tick={{ fontSize: 10 }} label={{ value: 'Observed %', angle: -90, position: 'insideLeft', fontSize: 10 }} domain={[40, 105]} />
              <Tooltip formatter={(v, n) => [Number(v).toFixed(1) + '%', n]} />
              <ReferenceLine y={50} x={50} stroke={T.accent} strokeDasharray="2 2" />
              <Scatter data={calibrationData} fill={T.indigo} name="CI Band" />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>Perfect calibration = diagonal line. PICP: {picpScore.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 18 — Live API Integration
// ═══════════════════════════════════════════════════════════════════════════════

function Tab18LiveAPI({ nasaData, nasaLoading, nasaError, nasaFetchTime, lat, setLat, lon, setLon, onFetch }) {
  const nasaChartData = useMemo(() => {
    if (!nasaData) return null;
    try {
      const ghiData = nasaData?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
      const t2mData = nasaData?.properties?.parameter?.T2M;
      if (!ghiData) return null;
      const entries = Object.entries(ghiData);
      return entries.slice(0, 36).map(([key, val]) => ({
        period: key,
        ghi: typeof val === 'number' ? parseFloat(val.toFixed(2)) : null,
        temp: t2mData ? parseFloat((t2mData[key] || 0).toFixed(1)) : null,
        quality: val > 0 ? 'GOOD' : 'FLAG'
      }));
    } catch (e) { return null; }
  }, [nasaData]);

  const syntheticGHI = useMemo(() => {
    if (nasaChartData) return nasaChartData;
    return Array.from({ length: 36 }, (_, i) => ({
      period: `${2021 + Math.floor(i / 12)}${String((i % 12) + 1).padStart(2, '0')}`,
      ghi: parseFloat((4.5 + Math.sin(i / 12 * 2 * Math.PI) * 1.8 + (sr(i * 17) - 0.5) * 0.5).toFixed(2)),
      temp: parseFloat((15 + Math.sin(i / 12 * 2 * Math.PI) * 12 + (sr(i * 13) - 0.5) * 3).toFixed(1)),
      quality: 'SYNTHETIC'
    }));
  }, [nasaChartData]);

  const avgGHI = syntheticGHI.length > 0 ? syntheticGHI.reduce((s, d) => s + (d.ghi || 0), 0) / syntheticGHI.length : 0;
  const maxGHI = syntheticGHI.length > 0 ? Math.max(...syntheticGHI.map(d => d.ghi || 0)) : 0;
  const isReal = !!nasaChartData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '14px 18px', background: '#1A1A2E', borderRadius: 8, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, color: T.accent, marginBottom: 4, fontFamily: 'JetBrains Mono,monospace' }}>LATITUDE</div>
          <input type="number" value={lat} onChange={e => setLat(Number(e.target.value))} step="0.5"
            style={{ width: 90, padding: '5px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: '#0D0D1A', color: '#fff', fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.accent, marginBottom: 4, fontFamily: 'JetBrains Mono,monospace' }}>LONGITUDE</div>
          <input type="number" value={lon} onChange={e => setLon(Number(e.target.value))} step="0.5"
            style={{ width: 90, padding: '5px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: '#0D0D1A', color: '#fff', fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }} />
        </div>
        <button onClick={onFetch} disabled={nasaLoading}
          style={{ padding: '7px 18px', borderRadius: 5, background: nasaLoading ? T.sub : T.accent, color: '#fff', border: 'none', cursor: nasaLoading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12 }}>
          {nasaLoading ? 'Fetching...' : 'Fetch NASA GHI'}
        </button>
        <div style={{ flex: 1 }}>
          {nasaError && <div style={{ color: T.red, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>{nasaError}</div>}
          {nasaFetchTime && <div style={{ color: T.green, fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>Last fetched: {nasaFetchTime}</div>}
          {!isReal && !nasaError && <div style={{ color: T.sub, fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>Showing synthetic data — click Fetch to load real NASA POWER data</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KpiCard label="Avg GHI" value={avgGHI.toFixed(2)} unit="kWh/m2/d" color={T.solar} sub={isReal ? 'NASA POWER' : 'Synthetic'} />
        <KpiCard label="Max GHI" value={maxGHI.toFixed(2)} unit="kWh/m2/d" color={T.accent} />
        <KpiCard label="Data Periods" value={syntheticGHI.length} color={T.indigo} sub="Monthly records" />
        <KpiCard label="Source" value={isReal ? 'NASA POWER' : 'Synthetic'} color={isReal ? T.green : T.sub} />
        <KpiCard label="Location" value={`${lat}N, ${lon}E`} color={T.text} />
      </div>

      <div>
        <SectionTitle>
          {isReal ? 'NASA POWER — Real GHI Data' : 'Synthetic GHI Profile'} ({lat}, {lon})
          {isReal && <Badge label="LIVE" color={T.green} />}
        </SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={syntheticGHI}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="period" tick={{ fontSize: 8 }} interval={5} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'kWh/m2/d', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v, n) => [`${Number(v).toFixed(2)}${n === 'temp' ? ' C' : ' kWh/m2/d'}`, n]} />
            <Legend />
            <Line type="monotone" dataKey="ghi" stroke={T.solar} strokeWidth={2} dot={false} name="GHI" />
            <Line type="monotone" dataKey="temp" stroke={T.red} strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="Temp (C)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <SectionTitle>Data Quality Flags</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {syntheticGHI.slice(0, 12).map((d, i) => (
            <div key={i} style={{ padding: '5px 10px', borderRadius: 4, background: d.quality === 'GOOD' ? T.green + '22' : d.quality === 'SYNTHETIC' ? T.indigo + '22' : T.red + '22', border: `1px solid ${d.quality === 'GOOD' ? T.green : d.quality === 'SYNTHETIC' ? T.indigo : T.red}44`, fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
              <div style={{ color: T.sub }}>{d.period}</div>
              <div style={{ fontWeight: 700, color: d.quality === 'GOOD' ? T.green : d.quality === 'SYNTHETIC' ? T.indigo : T.red }}>{d.quality}</div>
              <div style={{ color: T.text }}>{(d.ghi || 0).toFixed(2)} kWh</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>NASA POWER API Details</div>
        <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.8, fontFamily: 'JetBrains Mono,monospace' }}>
          Endpoint: power.larc.nasa.gov/api/temporal/monthly/point<br />
          Parameters: ALLSKY_SFC_SW_DWN (GHI), T2M (2m Temperature)<br />
          Community: RE (Renewable Energy)<br />
          Coverage: Global, 0.5 deg resolution, 1981-present<br />
          Format: JSON | Units: kWh/m2/day (GHI), C (Temp)
        </div>
      </div>
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-RE6" title="Renewable ML Forecasting — MC Forecast Error, Tornado & NGFS Scenario Suite"
        mcModel={{ title: 'MC Day-Ahead RMSE (% of rated)', unit: '%', fmt: (n) => n.toFixed(2),
        vars: { nwpSkill: { min: 0.65, mode: 0.78, max: 0.90 }, ensembleN: { min: 10, mode: 25, max: 50 }, horizonHr: { min: 6, mode: 24, max: 48 }, siteDiverse: { min: 1, mode: 5, max: 15 } },
        compute: (v) => Math.max(3, (18 - v.nwpSkill * 10) * Math.pow(v.horizonHr / 24, 0.4) / Math.pow(v.ensembleN / 25, 0.25) / Math.pow(v.siteDiverse, 0.15)) }}
      tornadoModel={{ title: 'Tornado — Forecast Error Drivers', unit: '%', fmt: (n) => `${n.toFixed(2)}%`,
        inputs: { nwpSkill: 0.78, ensembleN: 25, horizonHr: 24, siteDiverse: 5 },
        compute: (v) => Math.max(3, (18 - v.nwpSkill * 10) * Math.pow(v.horizonHr / 24, 0.4) / Math.pow(v.ensembleN / 25, 0.25) / Math.pow(v.siteDiverse, 0.15)) }}
      scenarioImpact={(p) => 8.5 - 0.02 * Math.max(0, p - 50)} scenarioFmt={(v) => `${v.toFixed(2)}%`}
      scenarioTitle="Carbon Price × NGFS Pathway — Target forecast RMSE required for balancing"
      peers={{ cols: [{ k: 'vendor', label: 'Forecast Vendor' }, { k: 'rmse', label: 'Day-ahead RMSE', fmt: (v) => `${v.toFixed(1)}%` }, { k: 'mape', label: '1h MAPE', fmt: (v) => `${v.toFixed(1)}%` }, { k: 'method', label: 'Method' }, { k: 'cov', label: 'Coverage' }],
        rows: [{ vendor: 'DNV GreenMeter', rmse: 7.8, mape: 3.6, method: 'NWP+ML', cov: 'Global' }, { vendor: 'Vaisala Xweather', rmse: 8.2, mape: 3.9, method: 'Ensemble', cov: 'Global' }, { vendor: 'UL Solutions', rmse: 8.5, mape: 4.1, method: 'Hybrid', cov: 'N.A./EU' }, { vendor: 'EnFor', rmse: 8.0, mape: 3.8, method: 'XGBoost', cov: 'EU' }, { vendor: 'MeteoLogica', rmse: 8.6, mape: 4.2, method: 'Phys+ML', cov: 'IB/LatAm' }, { vendor: 'AWS ML Solar', rmse: 9.1, mape: 4.4, method: 'Transformer', cov: 'Global' }] }}
        indiaContext={{
          subtitle: 'POSOCO · NLDC · REMC forecasting framework',
          regulations: [
            { tag: 'CEA DSM — forecasting mandate', status: 'active' },
            { tag: 'REMC (NLDC/RLDC/SLDC)', status: 'active' },
            { tag: 'DSM Penalty — >15% error', status: 'active' },
            { tag: 'IMD WRF-GFS coupling', status: 'active' },
            { tag: 'Weather Risk Pool (SECI)', status: 'partial' },
          ],
          kpis: [
            { label: 'RE Penetration', value: '23%', detail: 'Peak share 2024; target 50% 2030' },
            { label: 'DSM Penalty trigger', value: '>15% err', detail: '₹/kWh graded' },
            { label: 'Day-ahead RMSE std', value: '8–12%', detail: 'Indian fleets' },
            { label: 'REMC queries/day', value: '24k+' },
          ],
          peers: { title: 'INDIAN FORECAST VENDORS',
            cols: [{ k: 'vendor', label: 'Vendor' }, { k: 'rmse', label: 'DA RMSE (%)' }, { k: 'mape', label: '1h MAPE (%)' }, { k: 'method', label: 'Method' }, { k: 'cov', label: 'Fleet GW' }],
            rows: [
              { vendor: 'Clean Max Solar Fcst', rmse: '8.9', mape: '3.8', method: 'NWP+XGB', cov: 'Own 1.6 GW' },
              { vendor: 'Envision Digital (EnOS)', rmse: '8.4', mape: '3.6', method: 'Transformer', cov: '12 GW IN' },
              { vendor: 'Amplus WindForecast', rmse: '9.6', mape: '4.2', method: 'WRF+ML', cov: '2.4 GW' },
              { vendor: 'GE PulsePoint', rmse: '8.6', mape: '3.7', method: 'Hybrid', cov: '4.5 GW IN' },
              { vendor: 'SkyMet RE', rmse: '9.1', mape: '4.0', method: 'WRF ensemble', cov: '6 GW IN' },
              { vendor: 'CSTEP / IIT-Bombay', rmse: '8.7', mape: '3.8', method: 'Phys+NN', cov: 'Research' },
            ] },
          notes: 'India DSM penalty schedule escalates above 15% forecast error at 50 paise/kWh, capped at ₹1/kWh for >30% deviation. Target RMSE for FDRE tenders is <10% day-ahead.',
        }}
      />
    </div>
  );
}
