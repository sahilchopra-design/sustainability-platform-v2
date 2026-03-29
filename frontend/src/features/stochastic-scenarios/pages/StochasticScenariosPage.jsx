import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Default Scenario Parameters ─────────────────────────────────────── */
const DEFAULT_PARAMS = {
  carbonPrice:     { mean: 150, vol: 80, min: 10, max: 800, unit: 'USD/tCO\u2082e by 2030', distribution: 'lognormal', label: 'Carbon Price' },
  temperature:     { mean: 2.1, vol: 0.5, min: 1.2, max: 4.0, unit: '\u00b0C by 2100', distribution: 'normal', label: 'Temperature Rise' },
  policyTiming:    { mean: 2028, vol: 2, min: 2025, max: 2040, unit: 'Year of major policy shift', distribution: 'normal', label: 'Policy Timing' },
  techBreakthrough:{ mean: 0.3, vol: 0.15, min: 0, max: 1, unit: 'Probability of clean tech breakthrough', distribution: 'beta', label: 'Tech Breakthrough' },
  physicalDamage:  { mean: 2.5, vol: 1.5, min: 0.5, max: 12, unit: '% GDP annual damages by 2050', distribution: 'lognormal', label: 'Physical Damage' },
  stranding:       { mean: 15, vol: 10, min: 0, max: 50, unit: '% fossil fuel assets stranded by 2035', distribution: 'lognormal', label: 'Asset Stranding' },
};

const DIST_OPTIONS = ['normal', 'lognormal', 'beta'];
const SCENARIO_COUNTS = [100, 500, 1000, 5000];

/* ── PRNG with seed support ──────────────────────────────────────────── */
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

let _bmSeed=7000;
function boxMuller() {
  let u1 = sr(_bmSeed++), u2 = sr(_bmSeed++);
  while (u1 === 0) u1 = sr(_bmSeed++);
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/* ── Scenario Impact Model ───────────────────────────────────────────── */
function computeScenarioImpact(scenario) {
  const carbonImpact = -(scenario.carbonPrice / 150 - 1) * 0.08;
  const tempImpact = -(scenario.temperature - 1.5) * 0.03;
  const policyImpact = scenario.policyTiming < 2028 ? -0.05 : scenario.policyTiming > 2035 ? -0.02 : -0.03;
  const techImpact = scenario.techBreakthrough * 0.04;
  const strandingImpact = -(scenario.stranding / 100) * 0.15;
  const physicalImpact = -(scenario.physicalDamage / 100) * 0.12;
  return carbonImpact + tempImpact + policyImpact + techImpact + strandingImpact + physicalImpact;
}

/* ── Scenario Generator ──────────────────────────────────────────────── */
function generateScenarios(params, numScenarios, seed) {
  const rng = seed != null ? mulberry32(seed) : null;
  const normal = () => rng ? boxMullerSeeded(rng) : boxMuller();
  const scenarios = [];
  for (let i = 0; i < numScenarios; i++) {
    const scenario = { id: i + 1 };
    for (const [key, config] of Object.entries(params)) {
      let value;
      if (config.distribution === 'normal') {
        value = config.mean + config.vol * normal();
      } else if (config.distribution === 'lognormal') {
        const sigma2 = Math.log(1 + Math.pow(config.vol / Math.max(config.mean, 0.001), 2));
        const logMean = Math.log(Math.max(config.mean, 0.001)) - 0.5 * sigma2;
        const logVol = Math.sqrt(sigma2);
        value = Math.exp(logMean + logVol * normal());
      } else if (config.distribution === 'beta') {
        value = config.mean + config.vol * normal();
      }
      scenario[key] = Math.max(config.min, Math.min(config.max, value));
    }
    scenario.portfolioImpact = computeScenarioImpact(scenario);
    scenarios.push(scenario);
  }
  return scenarios;
}

/* ── Statistical Helpers ─────────────────────────────────────────────── */
function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function stdev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(arr.length - 1, 1));
}

function buildHistogram(values, bins = 25) {
  if (!values.length) return [];
  const mn = Math.min(...values), mx = Math.max(...values);
  const step = (mx - mn) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    binStart: mn + i * step, binEnd: mn + (i + 1) * step, count: 0, label: (mn + (i + 0.5) * step).toFixed(1),
  }));
  values.forEach(v => {
    let idx = Math.floor((v - mn) / step);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    buckets[idx].count++;
  });
  return buckets;
}

/* ── Fan Chart Builder ───────────────────────────────────────────────── */
function buildFanChart(scenarios) {
  const years = [];
  for (let y = 2025; y <= 2050; y++) years.push(y);
  const baseValue = 100;
  return years.map(year => {
    const t = (year - 2025) / 25;
    const projectedImpacts = scenarios.map(s => {
      const annualized = s.portfolioImpact * t;
      return baseValue * (1 + annualized);
    });
    return {
      year,
      p5: percentile(projectedImpacts, 5),
      p25: percentile(projectedImpacts, 25),
      p50: percentile(projectedImpacts, 50),
      p75: percentile(projectedImpacts, 75),
      p95: percentile(projectedImpacts, 95),
    };
  });
}

/* ── Scenario Clustering ─────────────────────────────────────────────── */
function clusterScenarios(scenarios) {
  const clusters = {
    greenAcceleration: { name: 'Green Acceleration', color: T.green, scenarios: [], description: 'Low temperature, high tech breakthrough, early policy' },
    orderlyTransition: { name: 'Orderly Transition', color: T.sage, scenarios: [], description: 'Moderate outcomes across all parameters' },
    delayedChaos:      { name: 'Delayed Chaos',      color: T.amber, scenarios: [], description: 'High carbon price, late policy, high stranding' },
    hotHouse:          { name: 'Hot House World',     color: T.red,   scenarios: [], description: 'High temperature, high physical damage, low policy action' },
  };
  scenarios.forEach(s => {
    if (s.temperature < 1.8 && s.techBreakthrough > 0.4 && s.policyTiming < 2029) {
      clusters.greenAcceleration.scenarios.push(s);
    } else if (s.temperature > 3.0 && s.physicalDamage > 4 && s.policyTiming > 2034) {
      clusters.hotHouse.scenarios.push(s);
    } else if (s.carbonPrice > 250 && s.policyTiming > 2032 && s.stranding > 20) {
      clusters.delayedChaos.scenarios.push(s);
    } else {
      clusters.orderlyTransition.scenarios.push(s);
    }
  });
  return Object.values(clusters).map(cl => ({
    ...cl,
    count: cl.scenarios.length,
    probability: cl.scenarios.length / Math.max(scenarios.length, 1),
    avgImpact: mean(cl.scenarios.map(s => s.portfolioImpact)),
    avgCarbon: mean(cl.scenarios.map(s => s.carbonPrice)),
    avgTemp: mean(cl.scenarios.map(s => s.temperature)),
    avgPolicy: mean(cl.scenarios.map(s => s.policyTiming)),
    avgTech: mean(cl.scenarios.map(s => s.techBreakthrough)),
    avgDamage: mean(cl.scenarios.map(s => s.physicalDamage)),
    avgStranding: mean(cl.scenarios.map(s => s.stranding)),
  }));
}

/* ── Sensitivity Tornado ─────────────────────────────────────────────── */
function computeSensitivity(params) {
  const base = {};
  for (const [k, v] of Object.entries(params)) base[k] = v.mean;
  const baseImpact = computeScenarioImpact(base);
  return Object.entries(params).map(([key, config]) => {
    const up = { ...base, [key]: Math.min(config.max, config.mean + config.vol) };
    const dn = { ...base, [key]: Math.max(config.min, config.mean - config.vol) };
    const impactUp = computeScenarioImpact(up);
    const impactDn = computeScenarioImpact(dn);
    return {
      param: config.label || key,
      upside: (impactUp - baseImpact) * 100,
      downside: (impactDn - baseImpact) * 100,
      range: Math.abs(impactUp - impactDn) * 100,
    };
  }).sort((a, b) => b.range - a.range);
}

/* ── Correlation Matrix ──────────────────────────────────────────────── */
function computeCorrelationMatrix(scenarios, keys) {
  const n = scenarios.length;
  if (n < 3) return [];
  const stats = {};
  keys.forEach(k => {
    const vals = scenarios.map(s => s[k]);
    const m = mean(vals);
    const sd = stdev(vals) || 1;
    stats[k] = { mean: m, sd };
  });
  const matrix = [];
  keys.forEach(k1 => {
    const row = { param: DEFAULT_PARAMS[k1]?.label || k1 };
    keys.forEach(k2 => {
      let cov = 0;
      scenarios.forEach(s => {
        cov += ((s[k1] - stats[k1].mean) / stats[k1].sd) * ((s[k2] - stats[k2].mean) / stats[k2].sd);
      });
      row[k2] = cov / (n - 1);
    });
    // Also add correlation with portfolioImpact
    let covImpact = 0;
    const impactVals = scenarios.map(s => s.portfolioImpact);
    const impactMean = mean(impactVals);
    const impactSd = stdev(impactVals) || 1;
    scenarios.forEach(s => {
      covImpact += ((s[k1] - stats[k1].mean) / stats[k1].sd) * ((s.portfolioImpact - impactMean) / impactSd);
    });
    row.portfolioImpact = covImpact / (n - 1);
    matrix.push(row);
  });
  return matrix;
}

/* ── CSV/JSON Export ─────────────────────────────────────────────────── */
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

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Tooltip ─────────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, marginTop: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                           */
/* ══════════════════════════════════════════════════════════════════════ */
function StochasticScenariosPage() {
  const navigate = useNavigate();
  const printRef = useRef(null);

  /* ── Portfolio ───────────────────────────────────────────────────── */
  const [portfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      return saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];
  const portfolioName = portfolioData.activePortfolio || 'No Portfolio Selected';

  /* ── Parameter State ────────────────────────────────────────────── */
  const [params, setParams] = useState(() => JSON.parse(JSON.stringify(DEFAULT_PARAMS)));
  const [numScenarios, setNumScenarios] = useState(1000);
  const [useSeed, setUseSeed] = useState(false);
  const [seed, setSeed] = useState(42);

  /* ── Generated Scenarios ────────────────────────────────────────── */
  const [scenarios, setScenarios] = useState(() => generateScenarios(DEFAULT_PARAMS, 1000, null));
  const [isGenerating, setIsGenerating] = useState(false);

  /* ── Table Sort ─────────────────────────────────────────────────── */
  const [sortCol, setSortCol] = useState('portfolioImpact');
  const [sortDir, setSortDir] = useState('asc');
  const [tableExpanded, setTableExpanded] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateScenarios(params, numScenarios, useSeed ? seed : null);
      setScenarios(result);
      setIsGenerating(false);
    }, 50);
  }, [params, numScenarios, useSeed, seed]);

  const updateParam = useCallback((key, field, value) => {
    setParams(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }, []);

  /* ── Derived Analytics ──────────────────────────────────────────── */
  const impacts = useMemo(() => scenarios.map(s => s.portfolioImpact), [scenarios]);
  const kpis = useMemo(() => {
    const sorted = [...impacts].sort((a, b) => a - b);
    return {
      mean: mean(impacts),
      var95: percentile(impacts, 5),
      var99: percentile(impacts, 1),
      cvar95: mean(sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)))),
      best: Math.max(...impacts),
      worst: Math.min(...impacts),
      lossGt10: impacts.filter(v => v < -0.10).length,
      positive: impacts.filter(v => v > 0).length,
      medianCarbon: percentile(scenarios.map(s => s.carbonPrice), 50),
      medianTemp: percentile(scenarios.map(s => s.temperature), 50),
      stdev: stdev(impacts),
      skewness: (() => {
        const m = mean(impacts); const sd = stdev(impacts) || 1;
        return impacts.reduce((s, v) => s + ((v - m) / sd) ** 3, 0) / impacts.length;
      })(),
    };
  }, [impacts, scenarios]);

  const fanData = useMemo(() => buildFanChart(scenarios), [scenarios]);
  const carbonHist = useMemo(() => buildHistogram(scenarios.map(s => s.carbonPrice), 30), [scenarios]);
  const impactHist = useMemo(() => buildHistogram(impacts, 30), [impacts]);

  const scatterData = useMemo(() =>
    scenarios.slice(0, 2000).map(s => ({
      temp: +s.temperature.toFixed(2),
      impact: +(s.portfolioImpact * 100).toFixed(2),
      carbon: +s.carbonPrice.toFixed(0),
    })),
  [scenarios]);

  const clusters = useMemo(() => clusterScenarios(scenarios), [scenarios]);

  const paramKeys = Object.keys(DEFAULT_PARAMS);
  const corrMatrix = useMemo(() => computeCorrelationMatrix(scenarios, paramKeys), [scenarios, paramKeys]);
  const sensitivity = useMemo(() => computeSensitivity(params), [params]);

  const sortedScenarios = useMemo(() => {
    const arr = [...scenarios];
    arr.sort((a, b) => sortDir === 'asc' ? (a[sortCol] ?? 0) - (b[sortCol] ?? 0) : (b[sortCol] ?? 0) - (a[sortCol] ?? 0));
    return arr;
  }, [scenarios, sortCol, sortDir]);

  const extremes = useMemo(() => {
    const sorted = [...scenarios].sort((a, b) => a.portfolioImpact - b.portfolioImpact);
    return { worst10: sorted.slice(0, 10), best10: sorted.slice(-10).reverse() };
  }, [scenarios]);

  const handleSort = (col) => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  /* ── Styles ─────────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiCard = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', textAlign: 'center', minWidth: 140 };
  const badge = { display: 'inline-block', background: `${T.gold}18`, color: T.gold, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, marginLeft: 10 };
  const sectionTitle = { fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 16px 0' };
  const btn = (primary) => ({
    padding: '8px 18px', borderRadius: 8, border: primary ? 'none' : `1px solid ${T.border}`,
    background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
  });
  const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' };
  const tdStyle = { padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };

  const fmtPct = v => v != null ? `${(v * 100).toFixed(2)}%` : '-';
  const fmtNum = (v, d = 1) => v != null ? v.toFixed(d) : '-';

  return (
    <div ref={printRef} style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '32px 40px 60px' }}>
      {/* ── 1. Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: -0.5 }}>Stochastic Scenario Generator</h1>
            <span style={badge}>6 Parameters</span>
            <span style={badge}>N={scenarios.length.toLocaleString()}</span>
            <span style={badge}>LN / N / Beta</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
            Monte Carlo scenario generation with configurable distributional assumptions across 6 climate-financial risk parameters.
            Portfolio: <strong>{portfolioName}</strong> ({holdings.length} holdings)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(false)} onClick={() => downloadCSV(scenarios.map(s => ({ ...s, portfolioImpact: (s.portfolioImpact * 100).toFixed(4) + '%' })), 'stochastic_scenarios.csv')}>Export CSV</button>
          <button style={btn(false)} onClick={() => downloadJSON({ params, numScenarios, seed: useSeed ? seed : null, generated: new Date().toISOString() }, 'scenario_config.json')}>Export Config</button>
          <button style={btn(false)} onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {/* ── 2. Parameter Configuration Panel ────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Parameter Configuration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Object.entries(params).map(([key, config]) => (
            <div key={key} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, border: `1px solid ${T.borderL}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{config.label}</span>
                <select
                  value={config.distribution}
                  onChange={e => updateParam(key, 'distribution', e.target.value)}
                  style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font }}
                >
                  {DIST_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 10 }}>{config.unit}</div>

              {/* Mean slider */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 2 }}>
                  <span>Mean</span><span style={{ fontWeight: 600 }}>{fmtNum(config.mean, key === 'techBreakthrough' ? 2 : 1)}</span>
                </div>
                <input
                  type="range" min={config.min} max={config.max} step={(config.max - config.min) / 200}
                  value={config.mean}
                  onChange={e => updateParam(key, 'mean', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: T.navy }}
                />
              </div>

              {/* Volatility slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 2 }}>
                  <span>Volatility (\u03c3)</span><span style={{ fontWeight: 600 }}>{fmtNum(config.vol, key === 'techBreakthrough' ? 3 : 1)}</span>
                </div>
                <input
                  type="range" min={0} max={(config.max - config.min) / 2} step={(config.max - config.min) / 400}
                  value={config.vol}
                  onChange={e => updateParam(key, 'vol', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: T.gold }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, marginTop: 6 }}>
                <span>Min: {config.min}</span><span>Max: {config.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Generate Controls ────────────────────────────────────── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Iterations:</span>
          {SCENARIO_COUNTS.map(n => (
            <button key={n} onClick={() => setNumScenarios(n)} style={{
              ...btn(n === numScenarios), padding: '6px 14px', fontSize: 12,
            }}>{n.toLocaleString()}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={useSeed} onChange={e => setUseSeed(e.target.checked)} />
            Seed:
          </label>
          {useSeed && (
            <input type="number" value={seed} onChange={e => setSeed(parseInt(e.target.value) || 0)}
              style={{ width: 60, fontSize: 12, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font }} />
          )}
        </div>
        <button onClick={handleGenerate} disabled={isGenerating} style={{
          ...btn(true), padding: '10px 28px', fontSize: 14,
          opacity: isGenerating ? 0.6 : 1,
        }}>
          {isGenerating ? 'Generating...' : `Generate ${numScenarios.toLocaleString()} Scenarios`}
        </button>
        <button onClick={() => { setParams(JSON.parse(JSON.stringify(DEFAULT_PARAMS))); }} style={btn(false)}>Reset Defaults</button>
      </div>

      {/* ── 4. KPI Cards ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Mean Impact', value: fmtPct(kpis.mean), color: kpis.mean >= 0 ? T.green : T.red },
          { label: 'VaR 95%', value: fmtPct(kpis.var95), color: T.red },
          { label: 'CVaR 95%', value: fmtPct(kpis.cvar95), color: T.red },
          { label: 'VaR 99%', value: fmtPct(kpis.var99), color: T.red },
          { label: 'Best Case', value: fmtPct(kpis.best), color: T.green },
          { label: 'Worst Case', value: fmtPct(kpis.worst), color: T.red },
          { label: 'Scenarios >10% Loss', value: kpis.lossGt10.toLocaleString(), color: T.amber },
          { label: 'Positive Impact', value: kpis.positive.toLocaleString(), color: T.green },
          { label: 'Median Carbon Price', value: `$${fmtNum(kpis.medianCarbon, 0)}`, color: T.navy },
          { label: 'Median Temperature', value: `${fmtNum(kpis.medianTemp, 2)}\u00b0C`, color: T.amber },
          { label: 'Impact Std Dev', value: fmtPct(kpis.stdev), color: T.navyL },
          { label: 'Skewness', value: fmtNum(kpis.skewness, 3), color: kpis.skewness < 0 ? T.red : T.green },
        ].map((k, i) => (
          <div key={i} style={kpiCard}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── 5. Scenario Fan Chart ───────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Portfolio Value Cone of Uncertainty (2025-2050)</h2>
        <p style={{ fontSize: 12, color: T.textMut, marginTop: -10, marginBottom: 16 }}>
          Percentile bands (P5/P25/P50/P75/P95) based on {scenarios.length.toLocaleString()} simulated climate-financial scenarios. Base = 100.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={fanData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="p95" stackId="1" stroke="none" fill={`${T.sage}15`} name="P95" />
            <Area type="monotone" dataKey="p75" stackId="2" stroke="none" fill={`${T.sage}25`} name="P75" />
            <Area type="monotone" dataKey="p50" stackId="3" stroke={T.sage} strokeWidth={2} fill={`${T.sage}40`} name="P50 (Median)" />
            <Area type="monotone" dataKey="p25" stackId="4" stroke="none" fill={`${T.gold}25`} name="P25" />
            <Area type="monotone" dataKey="p5" stackId="5" stroke="none" fill={`${T.red}15`} name="P5" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 6. Carbon Price Distribution ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={card}>
          <h2 style={sectionTitle}>Carbon Price Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={carbonHist} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textSec }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Frequency" radius={[3, 3, 0, 0]}>
                {carbonHist.map((_, i) => <Cell key={i} fill={`${T.navy}${Math.min(255, 80 + Math.floor(i * 6)).toString(16).padStart(2, '0')}`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>Portfolio Impact Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={impactHist} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textSec }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Frequency" radius={[3, 3, 0, 0]}>
                {impactHist.map((entry, i) => <Cell key={i} fill={parseFloat(entry.label) < 0 ? `${T.red}90` : `${T.green}90`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 7. Temperature vs Portfolio Impact Scatter ──────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Temperature vs Portfolio Impact</h2>
        <p style={{ fontSize: 12, color: T.textMut, marginTop: -10, marginBottom: 16 }}>
          Each dot is one simulated scenario. Color intensity reflects carbon price level.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="temp" name="Temperature" unit="\u00b0C" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Temperature (\u00b0C)', position: 'bottom', offset: -2, style: { fontSize: 11, fill: T.textSec } }} />
            <YAxis dataKey="impact" name="Portfolio Impact" unit="%" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textSec } }} />
            <ZAxis dataKey="carbon" range={[20, 120]} name="Carbon Price" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
            <Scatter data={scatterData} fill={T.navy} fillOpacity={0.35} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── 8. Parameter Correlation Matrix ─────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Parameter Correlation Matrix</h2>
        <p style={{ fontSize: 12, color: T.textMut, marginTop: -10, marginBottom: 16 }}>
          Pearson correlation between each parameter and portfolio impact. Independent draws should show near-zero cross-correlations.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, cursor: 'default' }}>Parameter</th>
                {paramKeys.map(k => <th key={k} style={{ ...thStyle, cursor: 'default', textAlign: 'center' }}>{(DEFAULT_PARAMS[k]?.label || k).slice(0, 10)}</th>)}
                <th style={{ ...thStyle, cursor: 'default', textAlign: 'center', color: T.navy, fontWeight: 800 }}>Impact \u03c1</th>
              </tr>
            </thead>
            <tbody>
              {corrMatrix.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ ...tdStyle, fontWeight: 600, fontSize: 12 }}>{row.param}</td>
                  {paramKeys.map(k => {
                    const v = row[k] || 0;
                    const intensity = Math.min(1, Math.abs(v));
                    const bg = v > 0.05 ? `rgba(22,163,74,${intensity * 0.3})` : v < -0.05 ? `rgba(220,38,38,${intensity * 0.3})` : 'transparent';
                    return <td key={k} style={{ ...tdStyle, textAlign: 'center', background: bg, fontWeight: Math.abs(v) > 0.5 ? 700 : 400 }}>{v.toFixed(2)}</td>;
                  })}
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: (row.portfolioImpact || 0) < 0 ? T.red : T.green }}>
                    {(row.portfolioImpact || 0).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 9. Scenario Clustering ──────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Scenario Clustering</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {clusters.map((cl, i) => (
            <div key={i} style={{ background: `${cl.color}08`, border: `1px solid ${cl.color}30`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cl.color }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{cl.name}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 10 }}>{cl.description}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: cl.color }}>{cl.count}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>scenarios ({(cl.probability * 100).toFixed(1)}%)</div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, lineHeight: 1.7 }}>
                Avg Impact: <strong style={{ color: cl.avgImpact >= 0 ? T.green : T.red }}>{fmtPct(cl.avgImpact)}</strong><br />
                Avg Carbon: <strong>${fmtNum(cl.avgCarbon, 0)}</strong><br />
                Avg Temp: <strong>{fmtNum(cl.avgTemp, 2)}\u00b0C</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 10. Cluster Summary Table ───────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Cluster Summary Comparison</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Cluster', 'Count', 'Probability', 'Avg Impact', 'Avg Carbon ($)', 'Avg Temp (\u00b0C)', 'Avg Policy Yr', 'Avg Tech P', 'Avg Damage (%)', 'Avg Strand (%)'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clusters.map((cl, i) => (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: cl.color }} /><strong>{cl.name}</strong></div></td>
                  <td style={tdStyle}>{cl.count}</td>
                  <td style={tdStyle}>{(cl.probability * 100).toFixed(1)}%</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: cl.avgImpact >= 0 ? T.green : T.red }}>{fmtPct(cl.avgImpact)}</td>
                  <td style={tdStyle}>${fmtNum(cl.avgCarbon, 0)}</td>
                  <td style={tdStyle}>{fmtNum(cl.avgTemp, 2)}</td>
                  <td style={tdStyle}>{fmtNum(cl.avgPolicy, 1)}</td>
                  <td style={tdStyle}>{fmtNum(cl.avgTech, 2)}</td>
                  <td style={tdStyle}>{fmtNum(cl.avgDamage, 1)}</td>
                  <td style={tdStyle}>{fmtNum(cl.avgStranding, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 11. Extreme Scenarios ───────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Extreme Scenarios</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Top 10 Worst-Case', data: extremes.worst10, color: T.red },
            { title: 'Top 10 Best-Case', data: extremes.best10, color: T.green },
          ].map(({ title, data, color }) => (
            <div key={title}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{title}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {['#', 'Impact', 'Carbon', 'Temp', 'Policy', 'Tech', 'Damage', 'Strand'].map(h => (
                        <th key={h} style={{ ...thStyle, fontSize: 10, padding: '6px 8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((s, i) => (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>{s.id}</td>
                        <td style={{ ...tdStyle, padding: '5px 8px', fontWeight: 700, color }}>{fmtPct(s.portfolioImpact)}</td>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>${fmtNum(s.carbonPrice, 0)}</td>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>{fmtNum(s.temperature, 2)}\u00b0C</td>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>{fmtNum(s.policyTiming, 0)}</td>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>{fmtNum(s.techBreakthrough, 2)}</td>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>{fmtNum(s.physicalDamage, 1)}%</td>
                        <td style={{ ...tdStyle, padding: '5px 8px' }}>{fmtNum(s.stranding, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 12. Sensitivity Tornado Chart ───────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Sensitivity Tornado (\u00b11\u03c3 Impact on Portfolio)</h2>
        <p style={{ fontSize: 12, color: T.textMut, marginTop: -10, marginBottom: 16 }}>
          Shows which parameter creates the largest portfolio outcome swing when varied by one standard deviation around its mean.
        </p>
        <ResponsiveContainer width="100%" height={Math.max(200, sensitivity.length * 48)}>
          <BarChart data={sensitivity} layout="vertical" margin={{ top: 5, right: 40, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
            <YAxis type="category" dataKey="param" tick={{ fontSize: 12, fill: T.text }} width={110} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine x={0} stroke={T.navy} strokeWidth={1.5} />
            <Bar dataKey="upside" name="Upside (+1\u03c3)" fill={T.green} radius={[0, 4, 4, 0]} barSize={16} />
            <Bar dataKey="downside" name="Downside (-1\u03c3)" fill={T.red} radius={[4, 0, 0, 4]} barSize={16} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 13. Full Scenario Table ─────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>All Generated Scenarios</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: T.textMut }}>Showing {tableExpanded ? sortedScenarios.length : Math.min(50, sortedScenarios.length)} of {sortedScenarios.length}</span>
            <button onClick={() => setTableExpanded(e => !e)} style={btn(false)}>
              {tableExpanded ? 'Show Less' : 'Show All'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: tableExpanded ? 600 : 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ background: T.surface }}>
                {[
                  { key: 'id', label: '#' },
                  { key: 'portfolioImpact', label: 'Impact' },
                  { key: 'carbonPrice', label: 'Carbon ($)' },
                  { key: 'temperature', label: 'Temp (\u00b0C)' },
                  { key: 'policyTiming', label: 'Policy Yr' },
                  { key: 'techBreakthrough', label: 'Tech P' },
                  { key: 'physicalDamage', label: 'Damage (%)' },
                  { key: 'stranding', label: 'Strand (%)' },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{
                    ...thStyle,
                    background: sortCol === col.key ? `${T.navy}10` : T.surface,
                  }}>
                    {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tableExpanded ? sortedScenarios : sortedScenarios.slice(0, 50)).map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={tdStyle}>{s.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: s.portfolioImpact >= 0 ? T.green : T.red }}>{fmtPct(s.portfolioImpact)}</td>
                  <td style={tdStyle}>${fmtNum(s.carbonPrice, 0)}</td>
                  <td style={tdStyle}>{fmtNum(s.temperature, 2)}</td>
                  <td style={tdStyle}>{fmtNum(s.policyTiming, 0)}</td>
                  <td style={tdStyle}>{fmtNum(s.techBreakthrough, 3)}</td>
                  <td style={tdStyle}>{fmtNum(s.physicalDamage, 1)}</td>
                  <td style={tdStyle}>{fmtNum(s.stranding, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 14. Cross-Navigation ────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Related Modules</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Quant Dashboard', path: '/quant-dashboard' },
            { label: 'Monte Carlo VaR', path: '/monte-carlo-var' },
            { label: 'ESG Backtesting', path: '/esg-backtesting' },
            { label: 'ITR Regression', path: '/implied-temp-regression' },
            { label: 'Copula Tail Risk', path: '/copula-tail-risk' },
            { label: 'Portfolio Suite', path: '/portfolio-suite' },
            { label: 'Scenario Stress Test', path: '/scenario-stress-test' },
            { label: 'Risk Attribution', path: '/risk-attribution' },
          ].map(nav => (
            <button key={nav.path} onClick={() => navigate(nav.path)} style={{
              ...btn(false), fontSize: 12, padding: '6px 14px',
              borderColor: T.borderL,
            }}>
              {nav.label} \u2192
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StochasticScenariosPage;
