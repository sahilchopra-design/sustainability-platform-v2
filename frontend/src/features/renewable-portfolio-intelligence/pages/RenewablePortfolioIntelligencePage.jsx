import React, { useState, useMemo, useCallback } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceDot,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E',
  solar: '#D97706', navy: '#1A1A2E', gold: '#B8860B',
};

const TECHS = ['Solar PV', 'Wind Onshore', 'Wind Offshore', 'Hydro', 'Geothermal'];
const TECH_COLORS = ['#D97706', '#4F46E5', '#0F766E', '#1E40AF', '#065F46'];
const GEOS = ['US', 'Europe', 'APAC', 'LatAm', 'MENA'];
const VINTAGES = ['2018', '2019', '2020', '2021', '2022', '2023'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BASE_CORR = [
  [1.00, 0.20, 0.18, 0.05, 0.10],
  [0.20, 1.00, 0.55, 0.08, 0.12],
  [0.18, 0.55, 1.00, 0.10, 0.15],
  [0.05, 0.08, 0.10, 1.00, 0.25],
  [0.10, 0.12, 0.15, 0.25, 1.00],
];

function buildAssets(n) {
  const assets = [];
  for (let i = 0; i < n; i++) {
    const tech = TECHS[Math.floor(sr(i * 7) * TECHS.length)];
    const geo = GEOS[Math.floor(sr(i * 7 + 1) * GEOS.length)];
    const vintage = VINTAGES[Math.floor(sr(i * 7 + 2) * VINTAGES.length)];
    const capMW = Math.round(50 + sr(i * 7 + 4) * 450);
    const capexPerW = 0.65 + sr(i * 7 + 5) * 0.75;
    const capex = capMW * 1e6 * capexPerW;
    const cf = tech === 'Solar PV' ? 0.22 + sr(i * 7 + 6) * 0.08
      : tech === 'Wind Onshore' ? 0.30 + sr(i * 7 + 6) * 0.12
      : tech === 'Wind Offshore' ? 0.40 + sr(i * 7 + 6) * 0.15
      : tech === 'Hydro' ? 0.45 + sr(i * 7 + 6) * 0.15
      : 0.85 + sr(i * 7 + 6) * 0.10;
    const ppaPrice = 35 + sr(i * 7 + 8) * 40;
    const annualRevM = capMW * cf * 8760 / 1e6 * ppaPrice;
    const debtPct = 0.55 + sr(i * 7 + 9) * 0.20;
    const debtService = capex * debtPct * 0.075;
    const ebitda = annualRevM * 1e6 * 0.75;
    const dscr = debtService > 0 ? ebitda / debtService : 1.5;
    const irr = 0.08 + sr(i * 7 + 10) * 0.10;
    const scope1 = tech === 'Geothermal' ? 40 + sr(i * 7 + 11) * 30 : sr(i * 7 + 11) * 5;
    const taxAlign = tech === 'Solar PV' || tech === 'Wind Onshore' || tech === 'Wind Offshore'
      ? 0.90 + sr(i * 7 + 13) * 0.10 : 0.75 + sr(i * 7 + 13) * 0.20;
    assets.push({
      id: i, name: `${tech.split(' ')[0]}-${geo}-${i + 1}`, tech, geo, vintage,
      capMW, capex, capexPerW, cf, ppaPrice, annualRevM,
      debtPct, dscr: Math.max(0.8, Math.min(3.5, dscr)),
      irr, scope1, taxAlign,
      lcoe: capexPerW * 100 + 10 + sr(i * 7 + 14) * 20,
      waci: scope1 * 1000 / Math.max(1, annualRevM),
      moic: 1.5 + sr(i * 7 + 12) * 2.0,
    });
  }
  return assets;
}

function portfolioVariance(weights, sigmas, corrMatrix) {
  let v = 0;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      v += weights[i] * weights[j] * sigmas[i] * sigmas[j] * corrMatrix[i][j];
    }
  }
  return v;
}

function buildFrontier(assets, sigmas, corrMatrix) {
  const techReturns = TECHS.map((t, ti) => {
    const ta = assets.filter(a => a.tech === t);
    return ta.length ? ta.reduce((s, a) => s + a.irr, 0) / ta.length : 0.10 + ti * 0.01;
  });
  return Array.from({ length: 51 }, (_, idx) => {
    const alpha = idx / 50;
    const weights = TECHS.map((_, ti) => {
      const tilt = [-1, -0.5, 1, 0.3, 0.2][ti] * alpha * 0.30;
      return Math.max(0.02, Math.min(0.60, 0.20 + tilt));
    });
    const wSum = weights.reduce((s, w) => s + w, 0);
    const wN = weights.map(w => w / wSum);
    const ret = wN.reduce((s, w, ti) => s + w * techReturns[ti], 0);
    const variance = portfolioVariance(wN, sigmas, corrMatrix);
    return { sigma: +(Math.sqrt(Math.max(0, variance)) * 100).toFixed(2), ret: +(ret * 100).toFixed(2) };
  });
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionHdr({ title, expanded, onToggle, color }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', padding: '8px 12px', background: 'none', border: 'none',
      borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
    }}>
      <span style={{ fontWeight: 700, fontSize: 11, color: color || T.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</span>
      <span style={{ color: T.sub, fontSize: 12 }}>{expanded ? '▾' : '▸'}</span>
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }) {
  const f = fmt || (v => v);
  return (
    <div style={{ padding: '4px 12px 6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: T.sub }}>{label}</span>
        <span style={{ color: T.accent, fontWeight: 700, fontFamily: 'monospace' }}>{f(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent, height: 3 }} />
    </div>
  );
}

function Sel({ label, value, options, onChange }) {
  return (
    <div style={{ padding: '4px 12px 6px' }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '4px 6px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card, color: T.text }}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

const TABS = [
  'Overview', 'Efficient Frontier', 'Correlation Matrix', 'Asset Waterfall',
  'VaR Dashboard', 'Diversification', 'DSCR Heatmap', 'EU Taxonomy',
  'SFDR PAI', 'WACI Analysis', 'Peer Benchmark', 'Scenario Analysis',
  'Attribution', 'Liquidity Profile', 'ESG Scoring', 'Cash Flow Forecast',
  'Currency Exposure', 'Fund Performance',
];

export default function RenewablePortfolioIntelligencePage() {
  const [numAssets, setNumAssets] = useState(50);
  const [targetIRR, setTargetIRR] = useState(12);
  const [maxConc, setMaxConc] = useState(35);
  const [revSigma, setRevSigma] = useState(12);
  const [swCorr, setSwCorr] = useState(0.20);
  const [tailMult, setTailMult] = useState(1.5);
  const [hurdleRate, setHurdleRate] = useState(8);
  const [benchmarkIRR, setBenchmarkIRR] = useState(11.5);
  const [taxThresh, setTaxThresh] = useState(90);
  const [waciTarget, setWaciTarget] = useState(5);
  const [stress, setStress] = useState('Moderate');
  const [repCurrency, setRepCurrency] = useState('USD');
  const [fundLife, setFundLife] = useState(12);
  const [deployYr, setDeployYr] = useState(3);
  const [activeTab, setActiveTab] = useState(0);
  const [col, setCol] = useState({ build: false, risk: true, ret: true, esg: true, fund: true, fx: true });

  const toggle = useCallback(k => setCol(c => ({ ...c, [k]: !c[k] })), []);

  const assets = useMemo(() => buildAssets(Math.min(200, Math.max(5, numAssets))), [numAssets]);

  const corrMatrix = useMemo(() => {
    const m = BASE_CORR.map(r => [...r]);
    m[0][1] = m[1][0] = swCorr;
    m[0][2] = m[2][0] = swCorr * 0.85;
    return m;
  }, [swCorr]);

  const sigmas = useMemo(() => [
    revSigma * 0.011, revSigma * 0.013, revSigma * 0.014, revSigma * 0.008, revSigma * 0.007
  ], [revSigma]);

  const techW = useMemo(() => {
    const cnt = {}; TECHS.forEach(t => { cnt[t] = 0; });
    assets.forEach(a => { cnt[a.tech] = (cnt[a.tech] || 0) + 1; });
    return TECHS.map(t => ({ tech: t, pct: assets.length ? (cnt[t] || 0) / assets.length : 0 }));
  }, [assets]);

  const portW = useMemo(() => techW.map(tw => tw.pct), [techW]);
  const portVar = useMemo(() => portfolioVariance(portW, sigmas, corrMatrix), [portW, sigmas, corrMatrix]);
  const portSigma = useMemo(() => Math.sqrt(Math.max(0, portVar)), [portVar]);

  const totalRevM = useMemo(() => assets.reduce((s, a) => s + a.annualRevM, 0), [assets]);
  const totalCapexM = useMemo(() => assets.reduce((s, a) => s + a.capex / 1e6, 0), [assets]);
  const totalMW = useMemo(() => assets.reduce((s, a) => s + a.capMW, 0), [assets]);

  const portIRR = useMemo(() => {
    const w = assets.reduce((s, a) => s + a.irr * a.annualRevM, 0);
    return totalRevM > 0 ? w / totalRevM : 0;
  }, [assets, totalRevM]);

  const portDSCR = useMemo(() => {
    const w = assets.reduce((s, a) => s + a.dscr * a.capex / 1e6, 0);
    return totalCapexM > 0 ? w / totalCapexM : 0;
  }, [assets, totalCapexM]);

  const portWACI = useMemo(() => {
    const w = assets.reduce((s, a) => s + a.waci * a.annualRevM, 0);
    return totalRevM > 0 ? w / totalRevM : 0;
  }, [assets, totalRevM]);

  const var95 = useMemo(() => portSigma * 1.645 * totalRevM, [portSigma, totalRevM]);
  const var99 = useMemo(() => portSigma * 2.326 * totalRevM, [portSigma, totalRevM]);
  const cvar95 = useMemo(() => var95 * 1.15 * tailMult, [var95, tailMult]);
  const sharpe = useMemo(() => portSigma > 0 ? (portIRR - 0.04) / portSigma : 0, [portIRR, portSigma]);

  const taxAligned = useMemo(() => {
    const al = assets.reduce((s, a) => s + (a.taxAlign * 100 >= taxThresh ? a.annualRevM : 0), 0);
    return totalRevM > 0 ? al / totalRevM * 100 : 0;
  }, [assets, totalRevM, taxThresh]);

  const frontier = useMemo(() => buildFrontier(assets, sigmas, corrMatrix), [assets, sigmas, corrMatrix]);

  const stressMult = useMemo(() => ({ None: 1.0, Mild: 0.92, Moderate: 0.82, Severe: 0.68, Extreme: 0.50 }), []);

  const geoW = useMemo(() => {
    const cnt = {}; GEOS.forEach(g => { cnt[g] = 0; });
    assets.forEach(a => { cnt[a.geo] = (cnt[a.geo] || 0) + a.annualRevM; });
    return GEOS.map(g => ({ geo: g, revM: cnt[g] || 0, pct: totalRevM > 0 ? (cnt[g] || 0) / totalRevM * 100 : 0 }));
  }, [assets, totalRevM]);

  const vintW = useMemo(() => {
    const cnt = {}; VINTAGES.forEach(v => { cnt[v] = 0; });
    assets.forEach(a => { cnt[a.vintage] = (cnt[a.vintage] || 0) + a.annualRevM; });
    return VINTAGES.map(v => ({ vintage: v, pct: totalRevM > 0 ? (cnt[v] || 0) / totalRevM * 100 : 0 }));
  }, [assets, totalRevM]);

  const assetsByIRR = useMemo(() => [...assets].sort((a, b) => b.irr - a.irr), [assets]);

  const dscrBands = useMemo(() => [
    { band: '<1.20 Breach', count: assets.filter(a => a.dscr < 1.20).length, color: T.red },
    { band: '1.20-1.30 Watch', count: assets.filter(a => a.dscr >= 1.20 && a.dscr < 1.30).length, color: '#D97706' },
    { band: '>1.30 OK', count: assets.filter(a => a.dscr >= 1.30).length, color: T.green },
  ], [assets]);

  const scenarioData = useMemo(() => ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'].map(s => {
    const m = stressMult[s];
    return { scenario: s, revenue: +(totalRevM * m).toFixed(0), dscr: +(portDSCR * m + (1 - m) * 0.8).toFixed(2), irr: +(portIRR * m * 100).toFixed(1) };
  }), [totalRevM, portDSCR, portIRR, stressMult]);

  const paiData = useMemo(() => [
    { pai: 'PAI-1 WACI (tCO₂/$M)', value: +portWACI.toFixed(1), benchmark: 25 },
    { pai: 'PAI-2 Carbon Footprint', value: +(portWACI * 0.8).toFixed(1), benchmark: 20 },
    { pai: 'PAI-3 GHG Intensity', value: +(portWACI * 1.2).toFixed(1), benchmark: 30 },
    { pai: 'PAI-4 Fossil Fuel %', value: +((assets.filter(a => a.tech === 'Geothermal').length / Math.max(1, assets.length)) * 10).toFixed(1), benchmark: 5 },
    { pai: 'PAI-5 Non-Renew %', value: +((1 - taxAligned / 100) * 15).toFixed(1), benchmark: 10 },
    { pai: 'PAI-11 Board Gender %', value: +(28 + sr(99) * 20).toFixed(1), benchmark: 40 },
  ], [portWACI, assets, taxAligned]);

  const cfForecast = useMemo(() => Array.from({ length: fundLife }, (_, y) => {
    const mult = 1 - y * 0.005;
    const rev = totalRevM * mult;
    const cfads = rev * 0.75;
    const debt = totalCapexM * 0.065 * 0.65;
    return { year: `Y${y + 1}`, revenue: +rev.toFixed(0), cfads: +cfads.toFixed(0), equityCF: +Math.max(0, cfads - debt).toFixed(0) };
  }), [totalRevM, totalCapexM, fundLife]);

  const benchData = useMemo(() => [
    { name: 'This Portfolio', irr: +(portIRR * 100).toFixed(1), dscr: +portDSCR.toFixed(2), sharpe: +sharpe.toFixed(2) },
    { name: 'MSCI Infra RE', irr: 10.5, dscr: 1.38, sharpe: 0.95 },
    { name: 'EDHEC INFRA', irr: 11.2, dscr: 1.42, sharpe: 1.08 },
    { name: 'Preqin Median', irr: 12.1, dscr: 1.35, sharpe: 1.15 },
    { name: 'BNEF RE Index', irr: 9.8, dscr: 1.45, sharpe: 0.85 },
  ], [portIRR, portDSCR, sharpe]);

  const esgScores = useMemo(() => [
    { dim: 'Environmental', score: +(60 + taxAligned * 0.35) },
    { dim: 'Social', score: +(45 + sr(200) * 30) },
    { dim: 'Governance', score: +(50 + sr(201) * 35) },
    { dim: 'Climate Action', score: +(70 + taxAligned * 0.25) },
    { dim: 'Biodiversity', score: +(40 + sr(202) * 25) },
  ], [taxAligned]);

  const fxData = useMemo(() => geoW.map((g, i) => ({
    geo: g.geo,
    currency: ['USD', 'EUR', 'JPY/AUD', 'BRL/CLP', 'SAR/AED'][i],
    revM: g.revM,
    fxVaR: g.revM * [0, 0.05, 0.08, 0.12, 0.06][i],
  })), [geoW]);

  const dpi = useMemo(() => {
    const d = Math.min(1, deployYr / Math.max(1, fundLife));
    return +(d * portIRR * 2.5).toFixed(2);
  }, [deployYr, fundLife, portIRR]);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard label="Portfolio IRR" value={`${(portIRR * 100).toFixed(1)}%`} sub={`Target: ${targetIRR}%`} color={portIRR * 100 >= targetIRR ? T.green : T.red} />
            <KpiCard label="Total AUM" value={`$${(totalCapexM / 1000).toFixed(1)}Bn`} sub={`${totalMW.toLocaleString()} MW`} color={T.indigo} />
            <KpiCard label="VaR (95%)" value={`$${var95.toFixed(0)}M`} sub="Annual revenue at risk" color={T.amber} />
            <KpiCard label="EU Taxonomy" value={`${taxAligned.toFixed(1)}%`} sub="Art.10 aligned" color={T.teal} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Technology Allocation</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={techW.filter(tw => tw.pct > 0)} dataKey="pct" nameKey="tech" cx="50%" cy="50%" outerRadius={80}
                    label={({ tech, pct }) => `${tech.split(' ')[0]} ${(pct * 100).toFixed(0)}%`} labelLine={false}>
                    {techW.map((_, i) => <Cell key={i} fill={TECH_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => `${(v * 100).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>DSCR Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dscrBands}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="band" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Assets">
                    {dscrBands.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiCard label="Avg DSCR" value={`${portDSCR.toFixed(2)}×`} color={portDSCR >= 1.3 ? T.green : T.amber} />
            <KpiCard label="Portfolio σ" value={`${(portSigma * 100).toFixed(1)}%`} color={T.blue} />
            <KpiCard label="Sharpe" value={sharpe.toFixed(2)} color={sharpe >= 1 ? T.green : T.amber} />
            <KpiCard label="WACI" value={`${portWACI.toFixed(1)} tCO₂/$M`} color={portWACI <= waciTarget ? T.green : T.red} />
          </div>
        </div>
      );

      case 1: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Mean-Variance Efficient Frontier</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>50 portfolio allocations from min-variance to max-Sharpe. Current portfolio marked in gold.</div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sigma" name="Risk σ (%)" type="number" domain={['auto', 'auto']}
                  label={{ value: 'Portfolio σ (%)', position: 'insideBottom', offset: -15, fontSize: 11 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="ret" name="Return (%)" type="number" domain={['auto', 'auto']}
                  label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                <Scatter name="Efficient Frontier" data={frontier} fill={T.indigo} opacity={0.7} />
                <ReferenceDot x={+(portSigma * 100).toFixed(2)} y={+(portIRR * 100).toFixed(2)}
                  r={8} fill={T.accent} stroke={T.text} label={{ value: 'Portfolio', position: 'top', fontSize: 10, fill: T.accent }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="Current: σ" value={`${(portSigma * 100).toFixed(1)}%`} sub={`Return: ${(portIRR * 100).toFixed(1)}%`} color={T.accent} />
            <KpiCard label="Sharpe Ratio" value={sharpe.toFixed(2)} sub="Risk-adjusted return" color={sharpe >= 1 ? T.green : T.amber} />
            <KpiCard label="Min-Variance σ" value={`${frontier.reduce((m, p) => p.sigma < m.sigma ? p : m, frontier[0] || { sigma: 0 }).sigma.toFixed(2)}%`} sub="Lowest risk allocation" color={T.blue} />
          </div>
        </div>
      );

      case 2: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Technology Return Correlation Matrix</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr><th style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}></th>
                    {TECHS.map(t => <th key={t} style={{ padding: '8px 12px', fontSize: 10, color: T.sub }}>{t.split(' ')[0]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TECHS.map((t1, i) => (
                    <tr key={t1}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11, color: TECH_COLORS[i] }}>{t1}</td>
                      {TECHS.map((t2, j) => {
                        const v = corrMatrix[i][j];
                        const bg = v === 1 ? '#E5E7EB' : v > 0.4 ? `rgba(220,38,38,${v * 0.5})` : v > 0.2 ? `rgba(217,119,6,${v * 0.7})` : `rgba(6,95,70,${(0.3 - v) * 3})`;
                        return <td key={t2} style={{ padding: '8px 12px', textAlign: 'center', background: bg, fontSize: 12 }}>{v.toFixed(2)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Variance Contribution by Technology</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={techW.map((tw, i) => ({ tech: tw.tech.split(' ')[0], contrib: +(tw.pct * tw.pct * sigmas[i] * sigmas[i] * 10000).toFixed(3) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="contrib" name="Variance contribution (×10⁻⁴)">
                  {techW.map((_, i) => <Cell key={i} fill={TECH_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 3: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Asset IRR Waterfall (Top 30)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={assetsByIRR.slice(0, 30).map(a => ({ name: a.name, irr: +(a.irr * 100).toFixed(1), tech: a.tech }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={false} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ReferenceLine y={targetIRR} stroke={T.accent} strokeDasharray="4 4" label={{ value: `Target ${targetIRR}%`, fontSize: 9 }} />
                <Tooltip formatter={v => [`${v}%`, 'IRR']} />
                <Bar dataKey="irr">
                  {assetsByIRR.slice(0, 30).map((a, i) => <Cell key={i} fill={TECH_COLORS[TECHS.indexOf(a.tech)]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiCard label="Best IRR" value={`${(assetsByIRR[0]?.irr * 100 || 0).toFixed(1)}%`} sub={assetsByIRR[0]?.name} color={T.green} />
            <KpiCard label="Median IRR" value={`${(assetsByIRR[Math.floor(assetsByIRR.length / 2)]?.irr * 100 || 0).toFixed(1)}%`} sub="50th pct" color={T.blue} />
            <KpiCard label="Below Target" value={`${assets.filter(a => a.irr * 100 < targetIRR).length}`} sub={`of ${assets.length}`} color={T.amber} />
            <KpiCard label="Above Target" value={`${assets.filter(a => a.irr * 100 >= targetIRR).length}`} sub={`of ${assets.length}`} color={T.green} />
          </div>
        </div>
      );

      case 4: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="VaR (95%)" value={`$${var95.toFixed(0)}M`} sub="Annual revenue at risk" color={T.amber} />
            <KpiCard label="VaR (99%)" value={`$${var99.toFixed(0)}M`} sub="Tail risk" color={T.red} />
            <KpiCard label="CVaR (95%)" value={`$${cvar95.toFixed(0)}M`} sub={`Tail mult: ${tailMult}×`} color={T.red} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Revenue Distribution (Normal Approximation)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={Array.from({ length: 40 }, (_, i) => {
                const x = totalRevM * (1 + (i - 20) * portSigma * 0.15);
                const z = (i - 20) * 0.15;
                const dens = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
                return { revenue: Math.round(x), density: +dens.toFixed(4) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="revenue" tick={{ fontSize: 9 }} tickFormatter={v => `$${Math.round(v / 1000)}B`} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => [typeof v === 'number' ? v.toFixed(4) : v, 'Prob density']} />
                <Area type="monotone" dataKey="density" fill={T.indigo} fillOpacity={0.3} stroke={T.indigo} />
                <ReferenceLine x={Math.round(totalRevM - var95)} stroke={T.red} strokeDasharray="4 4" label={{ value: 'VaR95', fontSize: 9 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>VaR by Technology</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={TECHS.map((t, i) => ({ tech: t.split(' ')[0], var: +(portW[i] * var95 * 100 / Math.max(1, totalRevM)).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="var" name="VaR contribution %">
                    {TECHS.map((_, i) => <Cell key={i} fill={TECH_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Corr Sensitivity to Portfolio σ</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(c => {
                  const m = BASE_CORR.map(r => [...r]); m[0][1] = m[1][0] = c; m[0][2] = m[2][0] = c * 0.85;
                  const v = portfolioVariance(portW, sigmas, m);
                  return { corr: c.toFixed(1), sigma: +(Math.sqrt(Math.max(0, v)) * 100).toFixed(2) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="corr" tick={{ fontSize: 10 }} label={{ value: 'Solar-Wind ρ', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'σ (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip />
                  <Line dataKey="sigma" dot={false} stroke={T.indigo} strokeWidth={2} name="Portfolio σ" />
                  <ReferenceDot x={swCorr.toFixed(1)} y={+(portSigma * 100).toFixed(2)} r={5} fill={T.accent} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

      case 5: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Technology Mix (%)</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={techW.map((tw, i) => ({ subject: tw.tech.split(' ')[0], value: +(tw.pct * 100).toFixed(1), max: maxConc }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar name="Allocation %" dataKey="value" fill={T.indigo} fillOpacity={0.3} stroke={T.indigo} />
                  <Radar name="Max Limit" dataKey="max" fill="none" stroke={T.red} strokeDasharray="4 4" />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Geographic Revenue Split</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={geoW} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(0)}%`} />
                  <YAxis type="category" dataKey="geo" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Revenue']} />
                  <Bar dataKey="pct" fill={T.teal} name="Revenue %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Vintage Mix</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={vintW}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="vintage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Revenue %']} />
                  <Bar dataKey="pct" fill={T.blue} name="Revenue %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>HHI Concentration Index</div>
              {[
                { label: 'Technology HHI', v: techW.reduce((s, tw) => s + tw.pct * tw.pct, 0) },
                { label: 'Geography HHI', v: geoW.reduce((s, gw) => s + (gw.pct / 100) * (gw.pct / 100), 0) },
                { label: 'Vintage HHI', v: vintW.reduce((s, vw) => s + (vw.pct / 100) * (vw.pct / 100), 0) },
              ].map(h => (
                <div key={h.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: T.sub }}>{h.label}</span>
                    <span style={{ fontWeight: 700, color: h.v < 0.15 ? T.green : h.v < 0.25 ? '#D97706' : T.red }}>{h.v.toFixed(3)}</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                    <div style={{ width: `${Math.min(100, h.v * 400)}%`, height: '100%', background: h.v < 0.15 ? T.green : h.v < 0.25 ? '#D97706' : T.red, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: T.sub }}>HHI &lt;0.15 diversified · 0.15–0.25 moderate · &gt;0.25 concentrated</div>
            </div>
          </div>
        </div>
      );

      case 6: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>DSCR Heatmap — Technology × Geography</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 10px', color: T.sub, textAlign: 'left', fontSize: 11 }}>Technology</th>
                  {GEOS.map(g => <th key={g} style={{ padding: '6px 10px', color: T.sub, fontSize: 11 }}>{g}</th>)}
                  <th style={{ padding: '6px 10px', color: T.sub, fontSize: 11 }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {TECHS.map((tech, ti) => {
                  const gAvgs = GEOS.map(geo => {
                    const grp = assets.filter(a => a.tech === tech && a.geo === geo);
                    return grp.length ? grp.reduce((s, a) => s + a.dscr, 0) / grp.length : null;
                  });
                  const techAssets = assets.filter(a => a.tech === tech);
                  const avg = techAssets.length ? techAssets.reduce((s, a) => s + a.dscr, 0) / techAssets.length : 0;
                  return (
                    <tr key={tech}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: TECH_COLORS[ti], fontSize: 11 }}>{tech}</td>
                      {gAvgs.map((v, gi) => {
                        const bg = v === null ? T.bg : v < 1.20 ? 'rgba(153,27,27,0.2)' : v < 1.30 ? 'rgba(146,64,14,0.2)' : 'rgba(6,95,70,0.2)';
                        return <td key={gi} style={{ padding: '6px 10px', textAlign: 'center', background: bg, fontSize: 12 }}>{v ? v.toFixed(2) + '×' : '—'}</td>;
                      })}
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: avg < 1.25 ? T.red : T.green, fontSize: 12 }}>{avg.toFixed(2)}×</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{ label: 'Breach Risk (<1.20×)', filter: a => a.dscr < 1.20, color: T.red }, { label: 'Watch (1.20–1.30×)', filter: a => a.dscr >= 1.20 && a.dscr < 1.30, color: '#D97706' }].map(grp => (
              <div key={grp.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: grp.color, marginBottom: 8 }}>{grp.label} ({assets.filter(grp.filter).length})</div>
                <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                  {assets.filter(grp.filter).slice(0, 15).map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span>{a.name}</span>
                      <span style={{ fontFamily: 'monospace', color: grp.color, fontWeight: 700 }}>{a.dscr.toFixed(2)}×</span>
                    </div>
                  ))}
                  {assets.filter(grp.filter).length === 0 && <div style={{ color: T.sub, fontSize: 11 }}>None</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case 7: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Taxonomy Aligned" value={`${taxAligned.toFixed(1)}%`} sub="Art.10 revenue" color={taxAligned >= 90 ? T.green : T.amber} />
            <KpiCard label="DNSH Pass Rate" value={`${(taxAligned * 0.95).toFixed(1)}%`} sub="5 environmental obj" color={T.teal} />
            <KpiCard label="Threshold" value={`≥${taxThresh}%`} sub="Art.10 screening" color={T.accent} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Art.10 Alignment by Technology</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={TECHS.map((t, i) => {
                const ta = assets.filter(a => a.tech === t);
                const avg = ta.length ? ta.reduce((s, a) => s + a.taxAlign * 100, 0) / ta.length : 0;
                return { tech: t.split(' ')[0], aligned: +avg.toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <ReferenceLine y={taxThresh} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Threshold', fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="aligned" name="Aligned %">
                  {TECHS.map((_, i) => <Cell key={i} fill={TECH_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>DNSH Assessment</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {['Climate Mitigation', 'Adaptation', 'Water', 'Circular Economy', 'Biodiversity'].map((obj, i) => {
                const pass = taxAligned * [0.99, 0.97, 0.94, 0.91, 0.89][i] / 100;
                return (
                  <div key={obj} style={{ textAlign: 'center', padding: 10, background: T.bg, borderRadius: 6 }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{pass > 0.90 ? '✅' : '⚠️'}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}>{obj}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: pass > 0.90 ? T.green : '#D97706' }}>{(pass * 100).toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

      case 8: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>SFDR PAI Indicators (Annex I)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={paiData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="pai" tick={{ fontSize: 9 }} width={175} />
                <Tooltip />
                <Bar dataKey="value" fill={T.indigo} name="Portfolio" />
                <Bar dataKey="benchmark" fill={T.border} name="Benchmark" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {paiData.slice(0, 6).map(p => (
              <div key={p.pai} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>{p.pai}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: p.value <= p.benchmark ? T.green : T.red }}>{p.value}</div>
                <div style={{ fontSize: 10, color: T.sub }}>Benchmark: {p.benchmark}</div>
              </div>
            ))}
          </div>
        </div>
      );

      case 9: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Portfolio WACI" value={`${portWACI.toFixed(1)} tCO₂/$M`} color={portWACI <= waciTarget ? T.green : T.red} />
            <KpiCard label="WACI Target" value={`${waciTarget} tCO₂/$M`} color={T.accent} />
            <KpiCard label="vs Target" value={portWACI <= waciTarget ? `✓ Below by ${(waciTarget - portWACI).toFixed(1)}` : `Above by ${(portWACI - waciTarget).toFixed(1)}`} color={portWACI <= waciTarget ? T.green : T.red} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>WACI by Technology</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={TECHS.map((t, i) => {
                const ta = assets.filter(a => a.tech === t);
                const avg = ta.length ? ta.reduce((s, a) => s + a.waci, 0) / ta.length : 0;
                return { tech: t.split(' ')[0], waci: +avg.toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReferenceLine y={waciTarget} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Target', fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="waci" name="WACI tCO₂/$M">
                  {TECHS.map((_, i) => <Cell key={i} fill={TECH_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>WACI 3-Year Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={[{ year: '2022', waci: portWACI * 1.15 }, { year: '2023', waci: portWACI * 1.07 }, { year: '2024', waci: portWACI }, { year: '2025E', waci: portWACI * 0.90 }, { year: '2026E', waci: portWACI * 0.80 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReferenceLine y={waciTarget} stroke={T.accent} strokeDasharray="4 4" />
                <Tooltip />
                <Line dataKey="waci" dot stroke={T.indigo} strokeWidth={2} name="WACI" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 10: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Portfolio vs Peer Benchmarks</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Benchmark', 'IRR (%)', 'DSCR (×)', 'Sharpe'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.sub }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {benchData.map((b, i) => (
                  <tr key={b.name} style={{ background: i === 0 ? `${T.accent}12` : i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? T.accent : T.text }}>{b.name}</td>
                    <td style={{ padding: '8px 12px', color: i === 0 && b.irr >= benchmarkIRR ? T.green : i === 0 ? T.red : T.text, fontWeight: i === 0 ? 700 : 400 }}>{b.irr}</td>
                    <td style={{ padding: '8px 12px' }}>{b.dscr}</td>
                    <td style={{ padding: '8px 12px', color: i === 0 && b.sharpe >= 1 ? T.green : T.text }}>{b.sharpe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>IRR Comparison</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={benchData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} domain={[8, 15]} />
                <ReferenceLine y={benchmarkIRR} stroke={T.accent} strokeDasharray="4 4" />
                <Tooltip />
                <Bar dataKey="irr" name="IRR (%)">
                  {benchData.map((b, i) => <Cell key={i} fill={i === 0 ? T.accent : T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 11: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Revenue Under Stress Scenarios</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$M Revenue', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue $M">
                  {scenarioData.map((_, i) => <Cell key={i} fill={['#065F46', '#0F766E', '#D97706', '#92400E', '#991B1B'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>DSCR Under Stress</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0.8, 2.5]} />
                  <ReferenceLine y={1.25} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Min Covenant', fontSize: 9 }} />
                  <Tooltip />
                  <Line dataKey="dscr" dot stroke={T.indigo} strokeWidth={2} name="DSCR" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>IRR Under Stress</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReferenceLine y={hurdleRate} stroke={T.amber} strokeDasharray="4 4" />
                  <Tooltip />
                  <Bar dataKey="irr" name="IRR %">
                    {scenarioData.map((s, i) => <Cell key={i} fill={s.irr >= hurdleRate ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

      case 12: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>IRR Attribution by Technology</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TECHS.map((t, i) => {
                const ta = assets.filter(a => a.tech === t);
                const avg = ta.length ? ta.reduce((s, a) => s + a.irr * 100, 0) / ta.length : 0;
                return { tech: t.split(' ')[0], avgIRR: +avg.toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReferenceLine y={portIRR * 100} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Portfolio', fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="avgIRR" name="Avg IRR (%)">
                  {TECHS.map((_, i) => <Cell key={i} fill={TECH_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>IRR Attribution by Geography</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={GEOS.map(g => {
                const ga = assets.filter(a => a.geo === g);
                const avg = ga.length ? ga.reduce((s, a) => s + a.irr * 100, 0) / ga.length : 0;
                return { geo: g, avgIRR: +avg.toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="geo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="avgIRR" fill={T.blue} name="Avg IRR (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 13: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Monthly Revenue Schedule (Base vs Stressed)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHS.map((m, mi) => {
                const s = [0.92, 0.94, 0.98, 1.02, 1.06, 1.08, 1.05, 1.04, 1.00, 0.97, 0.93, 0.91][mi];
                return { month: m, revenue: +(totalRevM * s / 12).toFixed(1), stressed: +(totalRevM * (stressMult[stress] || 1) * s / 12).toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" fill={T.indigo} fillOpacity={0.2} stroke={T.indigo} name="Base $M" />
                <Area type="monotone" dataKey="stressed" fill={T.red} fillOpacity={0.1} stroke={T.red} strokeDasharray="4 4" name={`${stress} $M`} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="Re-contracting Risk" value={`${assets.filter(a => a.vintage <= '2020').length} assets`} sub="PPA expiry by 2033" color={T.amber} />
            <KpiCard label="Avg PPA Remaining" value="18.2 yr" sub="Weighted average" color={T.green} />
            <KpiCard label="Debt Maturity Peak" value="2031–2034" sub="Refinancing window" color={T.blue} />
          </div>
        </div>
      );

      case 14: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>ESG Score Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={esgScores}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9 }} />
                  <Radar name="ESG" dataKey="score" fill={T.green} fillOpacity={0.3} stroke={T.green} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>SDG Alignment</div>
              {[{ sdg: 'SDG 7 — Clean Energy', s: 95 }, { sdg: 'SDG 13 — Climate Action', s: taxAligned }, { sdg: 'SDG 8 — Decent Work', s: 62 }, { sdg: 'SDG 9 — Industry & Innovation', s: 71 }].map(x => (
                <div key={x.sdg} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: T.text }}>{x.sdg}</span>
                    <span style={{ fontWeight: 700, color: T.green }}>{x.s.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 5, background: T.border, borderRadius: 3 }}>
                    <div style={{ width: `${x.s}%`, height: '100%', background: T.green, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {esgScores.slice(0, 3).map(s => (
              <KpiCard key={s.dim} label={s.dim} value={`${s.score.toFixed(0)}/100`} color={s.score >= 70 ? T.green : s.score >= 50 ? '#D97706' : T.red} />
            ))}
          </div>
        </div>
      );

      case 15: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Portfolio Cash Flow Forecast ({fundLife} Years)</div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cfForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" fill={T.indigo} fillOpacity={0.1} stroke={T.indigo} name="Revenue $M" />
                <Area type="monotone" dataKey="cfads" fill={T.green} fillOpacity={0.2} stroke={T.green} name="CFADS $M" />
                <Area type="monotone" dataKey="equityCF" fill={T.amber} fillOpacity={0.3} stroke={T.accent} name="Equity CF $M" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="Cumulative Revenue" value={`$${cfForecast.reduce((s, r) => s + r.revenue, 0).toLocaleString()}M`} sub={`${fundLife} years`} color={T.indigo} />
            <KpiCard label="Cumulative CFADS" value={`$${cfForecast.reduce((s, r) => s + r.cfads, 0).toLocaleString()}M`} sub="After OPEX" color={T.green} />
            <KpiCard label="Cumulative Equity CF" value={`$${cfForecast.reduce((s, r) => s + r.equityCF, 0).toLocaleString()}M`} sub="After debt service" color={T.accent} />
          </div>
        </div>
      );

      case 16: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Currency Exposure by Geography</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Reporting: {repCurrency}</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fxData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="geo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="revM" fill={T.blue} name="Revenue $M" />
                <Bar dataKey="fxVaR" fill={T.red} name="FX VaR $M" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="Total FX VaR" value={`$${fxData.reduce((s, f) => s + f.fxVaR, 0).toFixed(0)}M`} sub="Annual at 95%" color={T.red} />
            <KpiCard label="USD Revenue" value={`${(geoW[0]?.pct || 0).toFixed(1)}%`} sub="No FX risk" color={T.green} />
            <KpiCard label="EM Exposure" value={`${((geoW[3]?.pct || 0) + (geoW[4]?.pct || 0)).toFixed(1)}%`} sub="LatAm + MENA" color={T.amber} />
          </div>
        </div>
      );

      case 17: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Gross IRR" value={`${(portIRR * 100).toFixed(1)}%`} sub="Fund-level" color={portIRR * 100 >= hurdleRate ? T.green : T.red} />
            <KpiCard label="Net IRR" value={`${(portIRR * 100 * 0.85).toFixed(1)}%`} sub="After fees (1.5%+20%)" color={T.indigo} />
            <KpiCard label="DPI" value={`${dpi.toFixed(2)}×`} sub="Distributions to paid-in" color={T.teal} />
            <KpiCard label="TVPI" value={`${(dpi + 0.8).toFixed(2)}×`} sub="Total value to paid-in" color={T.green} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>IRR Build-up vs Hurdle Rate</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={Array.from({ length: fundLife }, (_, y) => ({
                year: `Y${y + 1}`, irr: +(portIRR * 100 * (0.6 + y * 0.04)).toFixed(1), hurdle: hurdleRate,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReferenceLine y={hurdleRate} stroke={T.red} strokeDasharray="4 4" />
                <Tooltip />
                <Area type="monotone" dataKey="irr" fill={T.green} fillOpacity={0.2} stroke={T.green} name="Gross IRR" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="GP Carry (20%)" value={`$${(cfForecast.reduce((s, r) => s + r.equityCF, 0) * 0.20 * 0.3).toFixed(0)}M`} sub="Above hurdle rate" color={T.accent} />
            <KpiCard label="RVPI" value={`${(dpi * 0.4).toFixed(2)}×`} sub="Residual value" color={T.blue} />
            <KpiCard label="Fund Vintage" value="2022" sub={`Year ${deployYr} of ${fundLife}`} color={T.sub} />
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'DM Sans',system-ui,sans-serif", overflow: 'hidden' }}>

      {/* Left Panel */}
      <div style={{ width: 270, minWidth: 270, background: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '14px 12px', borderBottom: `2px solid ${T.accent}`, background: T.navy, flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: T.accent, letterSpacing: 2, marginBottom: 4 }}>RE-PORT1 · PORTFOLIO BUILDER</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Renewable Portfolio Intelligence</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>{numAssets} assets · {TECHS.length} technologies</div>
        </div>

        <SectionHdr title="Portfolio Construction" expanded={!col.build} onToggle={() => toggle('build')} color={T.indigo} />
        {!col.build && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Slider label="Number of Assets" value={numAssets} min={5} max={200} step={5} onChange={setNumAssets} fmt={v => `${v} assets`} />
          <Slider label="Max Concentration %" value={maxConc} min={10} max={60} step={5} onChange={setMaxConc} fmt={v => `${v}%`} />
        </div>}

        <SectionHdr title="Risk Parameters" expanded={!col.risk} onToggle={() => toggle('risk')} color={T.red} />
        {!col.risk && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Slider label="Revenue Volatility σ %" value={revSigma} min={4} max={30} step={1} onChange={setRevSigma} fmt={v => `${v}%`} />
          <Slider label="Solar-Wind Correlation ρ" value={swCorr} min={0} max={0.7} step={0.05} onChange={setSwCorr} fmt={v => v.toFixed(2)} />
          <Slider label="CVaR Tail Multiplier" value={tailMult} min={1.0} max={3.0} step={0.1} onChange={setTailMult} fmt={v => `${v.toFixed(1)}×`} />
          <Sel label="Stress Scenario" value={stress} options={['None', 'Mild', 'Moderate', 'Severe', 'Extreme']} onChange={setStress} />
        </div>}

        <SectionHdr title="Return Targets" expanded={!col.ret} onToggle={() => toggle('ret')} color={T.green} />
        {!col.ret && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Slider label="Target IRR %" value={targetIRR} min={6} max={20} step={0.5} onChange={setTargetIRR} fmt={v => `${v}%`} />
          <Slider label="Hurdle Rate %" value={hurdleRate} min={4} max={14} step={0.5} onChange={setHurdleRate} fmt={v => `${v}%`} />
          <Slider label="Benchmark IRR %" value={benchmarkIRR} min={7} max={16} step={0.5} onChange={setBenchmarkIRR} fmt={v => `${v}%`} />
        </div>}

        <SectionHdr title="ESG / Taxonomy" expanded={!col.esg} onToggle={() => toggle('esg')} color={T.teal} />
        {!col.esg && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Slider label="Taxonomy Threshold %" value={taxThresh} min={70} max={100} step={5} onChange={setTaxThresh} fmt={v => `${v}%`} />
          <Slider label="WACI Target (tCO₂/$M)" value={waciTarget} min={1} max={30} step={1} onChange={setWaciTarget} fmt={v => `${v}`} />
        </div>}

        <SectionHdr title="Fund Parameters" expanded={!col.fund} onToggle={() => toggle('fund')} color={T.amber} />
        {!col.fund && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Slider label="Fund Life (years)" value={fundLife} min={5} max={20} step={1} onChange={setFundLife} fmt={v => `${v} yr`} />
          <Slider label="Current Year" value={deployYr} min={1} max={fundLife} step={1} onChange={setDeployYr} fmt={v => `Yr ${v}`} />
        </div>}

        <SectionHdr title="Currency & FX" expanded={!col.fx} onToggle={() => toggle('fx')} color={T.blue} />
        {!col.fx && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Sel label="Reporting Currency" value={repCurrency} options={['USD', 'EUR', 'GBP']} onChange={setRepCurrency} />
        </div>}

        <div style={{ marginTop: 'auto', borderTop: `2px solid ${T.border}`, padding: '10px 12px', background: `${T.navy}08`, flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: T.accent, letterSpacing: 1, marginBottom: 6 }}>LIVE STATS</div>
          {[
            { l: 'Port IRR', v: `${(portIRR * 100).toFixed(1)}%`, ok: portIRR * 100 >= targetIRR },
            { l: 'VaR 95%', v: `$${var95.toFixed(0)}M` },
            { l: 'Taxonomy', v: `${taxAligned.toFixed(1)}%`, ok: taxAligned >= taxThresh },
            { l: 'WACI', v: `${portWACI.toFixed(1)} tCO₂/$M`, ok: portWACI <= waciTarget },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: T.sub }}>{s.l}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: s.ok === undefined ? T.text : s.ok ? T.green : T.red }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, flexShrink: 0 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', fontSize: 11.5,
              fontWeight: activeTab === i ? 700 : 400, background: activeTab === i ? T.bg : 'transparent',
              color: activeTab === i ? T.accent : T.sub,
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : '2px solid transparent',
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.border}`, background: T.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.accent, letterSpacing: 1 }}>RE-PORT1</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, marginLeft: 10 }}>{TABS[activeTab]}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
            <span style={{ padding: '3px 8px', background: `${T.green}15`, color: T.green, borderRadius: 4, fontWeight: 600 }}>{numAssets} Assets</span>
            <span style={{ padding: '3px 8px', background: `${T.indigo}15`, color: T.indigo, borderRadius: 4, fontWeight: 600 }}>${(totalCapexM / 1000).toFixed(1)}Bn AUM</span>
            <span style={{ padding: '3px 8px', background: `${T.amber}15`, color: T.amber, borderRadius: 4, fontWeight: 600 }}>{stress} Stress</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {renderTab()}
        </div>
      </div>
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-RE5" title="Renewable Portfolio Intelligence — MC Portfolio Cashflow, Tornado & NGFS Suite"
        mcModel={{ title: 'MC Portfolio EBITDA ($M) · 2.5 GW mixed-tech', unit: 'M', fmt: (n) => n.toFixed(0),
        vars: { solarTariff: { min: 0.030, mode: 0.045, max: 0.065 }, windTariff: { min: 0.035, mode: 0.050, max: 0.070 }, plfBlended: { min: 0.23, mode: 0.28, max: 0.33 }, merchantMix: { min: 0.10, mode: 0.25, max: 0.50 } },
        compute: (v) => { const gwh = 2500 * v.plfBlended * 8760 / 1000; const blended = v.solarTariff * 0.6 + v.windTariff * 0.4; const rev = gwh * 1000 * blended * (1 - v.merchantMix * 0.15); return (rev * 0.72) / 1e6; } }}
      tornadoModel={{ title: 'Tornado — Portfolio EBITDA Drivers', unit: 'M', fmt: (n) => `$${n.toFixed(0)}M`,
        inputs: { solarTariff: 0.045, windTariff: 0.050, plfBlended: 0.28, merchantMix: 0.25 },
        compute: (v) => { const gwh = 2500 * v.plfBlended * 8760 / 1000; const blended = v.solarTariff * 0.6 + v.windTariff * 0.4; const rev = gwh * 1000 * blended * (1 - v.merchantMix * 0.15); return (rev * 0.72) / 1e6; } }}
      scenarioImpact={(p) => 420 + 0.9 * Math.max(0, p - 40)} scenarioFmt={(v) => `$${v.toFixed(0)}M`}
      scenarioTitle="Carbon Price × NGFS Pathway — PPA repricing uplift ($M EBITDA)"
      peers={{ cols: [{ k: 'op', label: 'Operator' }, { k: 'mix', label: 'Tech mix' }, { k: 'gw', label: 'GW', fmt: (v) => `${v.toFixed(1)}` }, { k: 'ebitda', label: 'EBITDA ($M)', fmt: (v) => `$${v}` }, { k: 'mul', label: 'EV/EBITDA', fmt: (v) => `${v.toFixed(1)}x` }],
        rows: [{ op: 'Brookfield RE', mix: 'Hydro+Wind+Solar', gw: 33, ebitda: 2350, mul: 11.2 }, { op: 'Enel Green Power', mix: 'Solar+Wind+Geo', gw: 62, ebitda: 4180, mul: 10.1 }, { op: 'Iberdrola', mix: 'Wind+Solar+Hydro', gw: 42, ebitda: 3620, mul: 10.8 }, { op: 'EDF Renewables', mix: 'Solar+Wind', gw: 14, ebitda: 1100, mul: 10.4 }, { op: 'NextEra Resources', mix: 'Wind+Solar+Stor', gw: 35, ebitda: 3900, mul: 13.0 }, { op: 'RWE Renewables', mix: 'Offshore+Solar', gw: 12, ebitda: 980, mul: 9.8 }] }}
      />
    </div>
  );
}
