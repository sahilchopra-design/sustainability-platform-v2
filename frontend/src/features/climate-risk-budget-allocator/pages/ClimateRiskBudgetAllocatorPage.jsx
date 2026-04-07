import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, LineChart, ReferenceLine, ScatterChart, Scatter,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_CLASSES = [
  'Equities - DM', 'Equities - EM', 'Corp Bonds IG', 'Corp Bonds HY',
  'Sovereign Bonds', 'Real Assets', 'Private Credit', 'Infrastructure',
];

const BASE_ASSETS = ASSET_CLASSES.map((name, i) => {
  const w = sr(i * 7 + 1) * 0.2 + 0.05;
  const ret = sr(i * 11 + 2) * 0.12 + 0.03;
  const carbonBeta = sr(i * 13 + 3) * 1.5 - 0.5;
  const greenBeta = sr(i * 17 + 4) * 1.5 - 0.5;
  const physBeta = sr(i * 19 + 5) * 1.2 - 0.2;
  const transBeta = sr(i * 23 + 6) * 1.5 - 0.5;
  const totalVaR = sr(i * 29 + 7) * 800 + 100;
  const physVaR = totalVaR * (sr(i * 31 + 8) * 0.4 + 0.1);
  const transVaR = totalVaR - physVaR;
  return {
    id: i,
    name,
    weight: w,
    expectedReturn: ret,
    totalClimateVaR: totalVaR,
    physRiskVaR: physVaR,
    transRiskVaR: transVaR,
    carbonBeta,
    greenBeta,
    physicalBeta: physBeta,
    transitionBeta: transBeta,
    liquidityDiscount: sr(i * 37 + 9) * 50,
    carbonIntensity: sr(i * 41 + 10) * 400 + 10,
    hedgingCostBps: sr(i * 43 + 11) * 30 + 5,
  };
});

// Normalize weights
const totalW = BASE_ASSETS.reduce((s, x) => s + x.weight, 0);
const ASSETS = BASE_ASSETS.map(a => ({ ...a, weight: a.weight / totalW }));

// 8×8 sr-seeded correlation matrix (symmetric, diagonal = 1)
const buildCorrMatrix = () => {
  const n = 8;
  const m = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const v = sr(i * 13 + j * 7 + 3) * 0.8 - 0.1;
      m[i][j] = v;
      m[j][i] = v;
    }
  }
  return m;
};
const CORR_MATRIX = buildCorrMatrix();

const FACTORS = ['Carbon', 'Green', 'Physical', 'Transition'];
const FACTOR_COLORS = [T.amber, T.green, T.red, T.purple];

// Factor variances (sr seeded)
const FACTOR_VARIANCE = FACTORS.map((_, i) => sr(i * 17 + 5) * 0.04 + 0.01);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Risk Budget Dashboard','Factor Attribution','Budget Optimization','Covariance Analysis','Hedging Analysis','Sensitivity Analysis','Summary & Export'];

export default function ClimateRiskBudgetAllocatorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [totalBudget, setTotalBudget] = useState(400);
  const [assetBudgets, setAssetBudgets] = useState(() => ASSETS.map(a => Math.round(a.totalClimateVaR * a.weight)));
  const [factorEnabled, setFactorEnabled] = useState([true, true, true, true]);
  const [hedgingOverlay, setHedgingOverlay] = useState(false);
  const [rebalFreq, setRebalFreq] = useState('Monthly');
  const [weights, setWeights] = useState(() => ASSETS.map(a => +(a.weight * 100).toFixed(1)));

  const normalizedWeights = useMemo(() => {
    const sum = weights.reduce((s, w) => s + w, 0);
    return sum > 0 ? weights.map(w => w / sum) : weights.map(() => 1 / weights.length);
  }, [weights]);

  // Portfolio variance using correlation matrix and individual volatilities
  const assetVols = useMemo(() => ASSETS.map(a => a.totalClimateVaR / 10000), []);

  const portfolioVaR = useMemo(() => {
    const n = 8;
    let pVar = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        pVar += normalizedWeights[i] * normalizedWeights[j] * CORR_MATRIX[i][j] * assetVols[i] * assetVols[j];
      }
    }
    return Math.sqrt(Math.max(0, pVar)) * 10000;
  }, [normalizedWeights, assetVols]);

  // Euler decomposition (marginal risk contribution)
  const mrc = useMemo(() => {
    const n = 8;
    const pVol = portfolioVaR / 10000;
    return ASSETS.map((a, i) => {
      let cov_i = 0;
      for (let j = 0; j < n; j++) {
        cov_i += normalizedWeights[j] * CORR_MATRIX[i][j] * assetVols[i] * assetVols[j];
      }
      const ec = pVol > 0 ? normalizedWeights[i] * cov_i / pVol * 10000 : 0;
      const budget = assetBudgets[i] || 1;
      return {
        name: a.name.substring(0, 12),
        fullName: a.name,
        mrc: +ec.toFixed(1),
        budget: budget,
        utilization: budget > 0 ? +(ec / budget * 100).toFixed(1) : 0,
        pctOfTotal: pVol > 0 ? +(normalizedWeights[i] * cov_i / (pVol * pVol || 1) * 100).toFixed(1) : 0,
      };
    });
  }, [portfolioVaR, normalizedWeights, assetVols, assetBudgets]);

  const totalBudgetUsed = useMemo(() => mrc.reduce((s, x) => s + x.mrc, 0), [mrc]);
  const budgetUtilization = useMemo(() => totalBudget > 0 ? totalBudgetUsed / totalBudget * 100 : 0, [totalBudgetUsed, totalBudget]);

  // Factor attribution: risk = sum(beta^2 * factor_variance * weight^2 + cross terms)
  const factorAttribution = useMemo(() => {
    return ASSETS.map((a, i) => {
      const betas = [a.carbonBeta, a.greenBeta, a.physicalBeta, a.transitionBeta];
      const contributions = FACTORS.map((f, fi) =>
        factorEnabled[fi] ? Math.abs(normalizedWeights[i] * betas[fi] * FACTOR_VARIANCE[fi]) * 1000 : 0
      );
      const idio = normalizedWeights[i] * a.totalClimateVaR * 0.3;
      return {
        name: a.name.substring(0, 12),
        carbon: +contributions[0].toFixed(1),
        green: +contributions[1].toFixed(1),
        physical: +contributions[2].toFixed(1),
        transition: +contributions[3].toFixed(1),
        idiosyncratic: +idio.toFixed(1),
      };
    });
  }, [normalizedWeights, factorEnabled]);

  // Optimal allocation: redistribute from over-budget to under-budget
  const optimalMRC = useMemo(() => {
    const perAssetBudget = totalBudget / ASSETS.length;
    return mrc.map((m, i) => ({
      ...m,
      optimal: +Math.max(0, m.mrc + (perAssetBudget - m.mrc) * 0.4).toFixed(1),
      excess: +(m.mrc - m.budget).toFixed(1),
    }));
  }, [mrc, totalBudget]);

  // Eigenvalue decomposition (simulated — sr seeded)
  const eigenvalues = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => +(sr(i * 17 + 99) * 3 + 0.1).toFixed(3)).sort((a, b) => b - a),
  []);

  // Hedging analysis
  const hedgingData = useMemo(() => {
    return ASSETS.map((a, i) => ({
      name: a.name.substring(0, 12),
      costBps: a.hedgingCostBps,
      riskReduction: +(sr(i * 13 + 7) * 40 + 5).toFixed(1),
      optimalHedgeRatio: +(sr(i * 17 + 8) * 0.8 + 0.1).toFixed(3),
    }));
  }, []);

  // Sensitivity: ±5% weight shift impact on VaR
  const sensitivityData = useMemo(() => {
    return ASSETS.map((a, i) => {
      const base = portfolioVaR;
      const newWPls = [...normalizedWeights];
      const newWMns = [...normalizedWeights];
      const delta = 0.05;
      newWPls[i] = Math.min(1, normalizedWeights[i] + delta);
      newWMns[i] = Math.max(0, normalizedWeights[i] - delta);
      // Simplified VaR impact
      const impactPls = mrc[i] > 0 ? +(mrc[i] * delta / (normalizedWeights[i] || 0.001) * 10).toFixed(1) : 0;
      return {
        name: a.name.substring(0, 12),
        currentWeight: +(normalizedWeights[i] * 100).toFixed(1),
        varImpactPls5: +impactPls.toFixed(1),
        varImpactMns5: +(-impactPls * 0.85).toFixed(1),
        baseVaR: +base.toFixed(1),
      };
    });
  }, [portfolioVaR, normalizedWeights, mrc]);

  const corrColors = ['#1e3a5f','#0369a1','#0f766e','#16a34a','#b8860b','#d97706','#dc2626','#7c3aed'];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CZ5 · CLIMATE RISK BUDGET ALLOCATOR</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Climate Risk Budget Allocator</h1>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Euler MRC decomposition · 4-factor climate model · 8×8 covariance · Hedging overlay</div>
      </div>

      {/* Controls */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: T.muted }}>Total VaR Budget: <strong style={{ color: T.text }}>{totalBudget} bps</strong>
          <input type="range" min={100} max={1000} step={10} value={totalBudget} onChange={e => setTotalBudget(+e.target.value)} style={{ marginLeft: 8, width: 120 }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {FACTORS.map((f, fi) => (
            <label key={f} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: FACTOR_COLORS[fi] }}>
              <input type="checkbox" checked={factorEnabled[fi]} onChange={e => setFactorEnabled(prev => prev.map((x, i) => i === fi ? e.target.checked : x))} />
              {f}
            </label>
          ))}
        </div>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={hedgingOverlay} onChange={e => setHedgingOverlay(e.target.checked)} />
          Hedging Overlay
        </label>
        <select value={rebalFreq} onChange={e => setRebalFreq(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {['Daily','Weekly','Monthly','Quarterly'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      {/* Per-asset weight sliders */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '10px 32px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {ASSETS.map((a, i) => (
          <label key={a.name} style={{ fontSize: 11, color: T.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontWeight: 600, color: T.text, fontSize: 10 }}>{a.name.substring(0, 10)}</span>
            <span style={{ color: T.indigo }}>{(normalizedWeights[i] * 100).toFixed(1)}%</span>
            <input type="range" min={0} max={50} step={0.5} value={weights[i]} onChange={e => setWeights(prev => prev.map((w, j) => j === i ? +e.target.value : w))} style={{ width: 70 }} />
          </label>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '12px 16px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.indigo : T.muted, background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* TAB 0: Risk Budget Dashboard */}
        {activeTab === 0 && (
          <div>
            {/* Budget gauge */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ background: T.card, border: `3px solid ${budgetUtilization > 100 ? T.red : budgetUtilization > 80 ? T.amber : T.green}`, borderRadius: 12, padding: '16px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em' }}>BUDGET UTILIZATION</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: budgetUtilization > 100 ? T.red : budgetUtilization > 80 ? T.amber : T.green }}>{budgetUtilization.toFixed(1)}%</div>
                <div style={{ fontSize: 11, color: T.muted }}>{totalBudgetUsed.toFixed(0)} / {totalBudget} bps VaR</div>
              </div>
              <KpiCard label="Portfolio VaR" value={`${portfolioVaR.toFixed(0)} bps`} sub="1-year 95% climate VaR" color={T.amber} />
              <KpiCard label="Total Budget" value={`${totalBudget} bps`} sub="Total risk allocation" color={T.navy} />
              <KpiCard label="Over-Budget Assets" value={mrc.filter(m => m.utilization > 100).length} sub="of 8 asset classes" color={mrc.filter(m => m.utilization > 100).length > 0 ? T.red : T.green} />
              <KpiCard label="Diversification Ratio" value={(ASSETS.reduce((s, a, i) => s + normalizedWeights[i] * a.totalClimateVaR, 0) / (portfolioVaR || 1)).toFixed(3)} sub="Wtd avg VaR / Portfolio VaR" color={T.teal} />
              <KpiCard label="Rebalancing" value={rebalFreq} color={T.indigo} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Marginal Risk Contribution vs Budget (bps)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={mrc} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mrc" fill={T.indigo} name="Euler MRC (bps)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="budget" stroke={T.red} strokeDasharray="5 5" name="Budget" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1: Factor Attribution */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {FACTORS.map((f, fi) => (
                <KpiCard key={f} label={`${f} Risk`} value={`${factorAttribution.reduce((s, x) => s + (fi === 0 ? x.carbon : fi === 1 ? x.green : fi === 2 ? x.physical : x.transition), 0).toFixed(1)}`} sub="bps total" color={FACTOR_COLORS[fi]} />
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Factor Risk Contribution by Asset Class</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={factorAttribution} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {factorEnabled[0] && <Bar dataKey="carbon" stackId="a" fill={T.amber} name="Carbon" />}
                  {factorEnabled[1] && <Bar dataKey="green" stackId="a" fill={T.green} name="Green" />}
                  {factorEnabled[2] && <Bar dataKey="physical" stackId="a" fill={T.red} name="Physical" />}
                  {factorEnabled[3] && <Bar dataKey="transition" stackId="a" fill={T.purple} name="Transition" />}
                  <Bar dataKey="idiosyncratic" stackId="a" fill={T.muted} name="Idiosyncratic" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Factor Betas by Asset Class</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Asset Class','Carbon β','Green β','Physical β','Transition β','Hedging Cost (bps)','Carbon CI'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {ASSETS.map((a, i) => (
                    <tr key={a.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '7px 12px', color: a.carbonBeta > 0 ? T.red : T.green }}>{a.carbonBeta.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: a.greenBeta > 0 ? T.green : T.amber }}>{a.greenBeta.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: a.physicalBeta > 0.5 ? T.red : T.text }}>{a.physicalBeta.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: a.transitionBeta > 0.5 ? T.amber : T.text }}>{a.transitionBeta.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px' }}>{a.hedgingCostBps.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px' }}>{a.carbonIntensity.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Budget Optimization */}
        {activeTab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Current vs Optimal Budget Allocation (bps)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={optimalMRC} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="mrc" fill={T.indigo} name="Euler MRC" />
                  <Bar dataKey="budget" fill={T.amber} name="Allocated Budget" opacity={0.7} />
                  <Line type="monotone" dataKey="optimal" stroke={T.green} strokeWidth={2.5} name="Optimal Budget" dot={{ fill: T.green, r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Budget Excess/Deficit Table</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Asset Class','Euler MRC','Budget','Excess/(Deficit)','Utilization %','Optimal Budget','Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {optimalMRC.map((m, i) => (
                    <tr key={m.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m.fullName}</td>
                      <td style={{ padding: '8px 12px' }}>{m.mrc.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px' }}>{m.budget.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px', color: m.excess > 0 ? T.red : T.green, fontWeight: 600 }}>{m.excess > 0 ? '+' : ''}{m.excess.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ background: T.border, borderRadius: 4, height: 6, width: 80 }}>
                            <div style={{ background: m.utilization > 100 ? T.red : m.utilization > 80 ? T.amber : T.green, borderRadius: 4, height: 6, width: `${Math.min(100, m.utilization)}%` }} />
                          </div>
                          <span>{m.utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.teal, fontWeight: 600 }}>{m.optimal.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: m.excess > 10 ? T.red : m.excess < -10 ? T.green : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>
                          {m.excess > 10 ? 'Reduce' : m.excess < -10 ? 'Increase' : 'Hold'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Covariance Analysis */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>8×8 Correlation Heatmap (Climate VaR)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr>
                        <td style={{ padding: '4px 6px' }}></td>
                        {ASSETS.map((a, i) => (
                          <td key={i} style={{ padding: '4px 6px', fontWeight: 700, color: T.muted, whiteSpace: 'nowrap', fontSize: 9, textAlign: 'center' }}>{a.name.substring(0, 6)}</td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ASSETS.map((rowA, i) => (
                        <tr key={i}>
                          <td style={{ padding: '4px 6px', fontWeight: 700, color: T.muted, whiteSpace: 'nowrap', fontSize: 9 }}>{rowA.name.substring(0, 6)}</td>
                          {ASSETS.map((colA, j) => {
                            const v = CORR_MATRIX[i][j];
                            const intensity = Math.abs(v);
                            const bg = v >= 0
                              ? `rgba(79, 70, 229, ${0.1 + intensity * 0.7})`
                              : `rgba(220, 38, 38, ${0.1 + intensity * 0.7})`;
                            return (
                              <td key={j} style={{ padding: '6px', textAlign: 'center', background: bg, color: intensity > 0.5 ? '#fff' : T.text, fontWeight: 600, border: `1px solid ${T.border}`, minWidth: 52 }}>
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
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, minWidth: 240 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Eigenvalue Decomposition</h3>
                {eigenvalues.map((ev, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>PC{i + 1}</span>
                      <span style={{ color: T.indigo, fontWeight: 600 }}>{ev.toFixed(3)}</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 6, marginTop: 3 }}>
                      <div style={{ background: T.indigo, borderRadius: 4, height: 6, width: `${(ev / eigenvalues[0]) * 100}%` }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>{(ev / eigenvalues.reduce((s, x) => s + x, 0) * 100).toFixed(1)}% variance explained</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Hedging Analysis */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Avg Hedge Cost" value={`${(hedgingData.reduce((s, x) => s + x.costBps, 0) / hedgingData.length).toFixed(1)} bps`} color={T.amber} />
              <KpiCard label="Avg Risk Reduction" value={`${(hedgingData.reduce((s, x) => s + x.riskReduction, 0) / hedgingData.length).toFixed(1)}%`} color={T.green} />
              <KpiCard label="Overlay Status" value={hedgingOverlay ? 'Active' : 'Inactive'} color={hedgingOverlay ? T.green : T.muted} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Cost vs Risk Reduction</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="costBps" name="Cost (bps)" tick={{ fontSize: 10 }} label={{ value: 'Hedging Cost (bps)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis dataKey="riskReduction" name="Risk Red. %" tick={{ fontSize: 10 }} label={{ value: 'Risk Reduction %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} />
                    <Scatter data={hedgingData} fill={T.teal} name="Asset Classes" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Optimal Hedge Ratio by Asset Class</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hedgingData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [v.toFixed(3), 'Hedge Ratio']} />
                    <Bar dataKey="optimalHedgeRatio" fill={T.indigo} radius={[4, 4, 0, 0]} name="Optimal Hedge Ratio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Sensitivity Analysis */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>What-If: ±5% Weight Change → VaR Impact (bps)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sensitivityData} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                  <Bar dataKey="varImpactPls5" fill={T.red} name="+5% weight" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="varImpactMns5" fill={T.green} name="-5% weight" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sensitivity Table</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Asset Class','Current Weight %','+5% VaR Impact','-5% VaR Impact','Asymmetry','Base Portfolio VaR'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sensitivityData.map((s, i) => (
                    <tr key={s.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ASSETS[i].name}</td>
                      <td style={{ padding: '8px 12px' }}>{s.currentWeight}%</td>
                      <td style={{ padding: '8px 12px', color: T.red, fontWeight: 600 }}>+{s.varImpactPls5}</td>
                      <td style={{ padding: '8px 12px', color: T.green, fontWeight: 600 }}>{s.varImpactMns5}</td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{Math.abs(s.varImpactPls5 + s.varImpactMns5).toFixed(1)}</td>
                      <td style={{ padding: '8px 12px' }}>{s.baseVaR.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Risk Budget Allocation Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Metric','Value','Target','Status','Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    ['Total Portfolio VaR', `${portfolioVaR.toFixed(0)} bps`, `≤${totalBudget} bps`, portfolioVaR <= totalBudget ? 'PASS' : 'FAIL'],
                    ['Budget Utilization', `${budgetUtilization.toFixed(1)}%`, '80-100%', budgetUtilization >= 80 && budgetUtilization <= 100 ? 'OPTIMAL' : budgetUtilization < 80 ? 'UNDER' : 'OVER'],
                    ['Over-Budget Assets', mrc.filter(m => m.utilization > 100).length, '0', mrc.filter(m => m.utilization > 100).length === 0 ? 'PASS' : 'FAIL'],
                    ['Active Factors', factorEnabled.filter(Boolean).length, '4', factorEnabled.filter(Boolean).length === 4 ? 'FULL' : 'PARTIAL'],
                    ['Hedging Overlay', hedgingOverlay ? 'Active' : 'Inactive', 'Active', hedgingOverlay ? 'PASS' : 'WARN'],
                    ['Diversification Ratio', (ASSETS.reduce((s, a, i) => s + normalizedWeights[i] * a.totalClimateVaR, 0) / (portfolioVaR || 1)).toFixed(3), '>1.2', (ASSETS.reduce((s, a, i) => s + normalizedWeights[i] * a.totalClimateVaR, 0) / (portfolioVaR || 1)) > 1.2 ? 'PASS' : 'FAIL'],
                    ['Top Eigenvalue Share', `${(eigenvalues[0] / eigenvalues.reduce((s, x) => s + x, 0) * 100).toFixed(1)}%`, '<50%', eigenvalues[0] / eigenvalues.reduce((s, x) => s + x, 0) < 0.5 ? 'PASS' : 'WARN'],
                    ['Rebalancing Freq', rebalFreq, 'Monthly', rebalFreq === 'Monthly' ? 'PASS' : 'INFO'],
                  ].map(([m, v, t, s], i) => (
                    <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{v}</td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{t}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: s === 'PASS' || s === 'FULL' || s === 'OPTIMAL' ? T.green : s === 'FAIL' || s === 'OVER' ? T.red : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{s}</span></td>
                      <td style={{ padding: '8px 12px', color: T.muted, fontSize: 11 }}>Euler MRC framework</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Per-Asset Risk Budget Detail</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Asset Class','Weight %','Phys VaR','Trans VaR','Total CI VaR','Euler MRC','Budget','Util %','Optimal','Hedge Cost','Action'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {ASSETS.map((a, i) => (
                    <tr key={a.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '7px 10px' }}>{(normalizedWeights[i] * 100).toFixed(1)}%</td>
                      <td style={{ padding: '7px 10px', color: T.red }}>{a.physRiskVaR.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px', color: T.amber }}>{a.transRiskVaR.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{a.totalClimateVaR.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px', color: T.indigo, fontWeight: 600 }}>{mrc[i]?.mrc.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px' }}>{assetBudgets[i]}</td>
                      <td style={{ padding: '7px 10px', color: mrc[i]?.utilization > 100 ? T.red : T.green }}>{mrc[i]?.utilization.toFixed(0)}%</td>
                      <td style={{ padding: '7px 10px', color: T.teal }}>{optimalMRC[i]?.optimal.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px' }}>{a.hedgingCostBps.toFixed(1)} bps</td>
                      <td style={{ padding: '7px 10px' }}><span style={{ background: optimalMRC[i]?.excess > 10 ? T.red : optimalMRC[i]?.excess < -10 ? T.green : T.amber, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{optimalMRC[i]?.excess > 10 ? 'Reduce' : optimalMRC[i]?.excess < -10 ? 'Increase' : 'Hold'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Factor variance table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Climate Factor Model Parameters</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Factor','Variance','Std Dev','Status','VaR Contribution (enabled)'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FACTORS.map((f, fi) => (
                    <tr key={f} style={{ background: fi % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600, color: FACTOR_COLORS[fi] }}>{f}</td>
                      <td style={{ padding: '7px 12px' }}>{FACTOR_VARIANCE[fi].toFixed(4)}</td>
                      <td style={{ padding: '7px 12px' }}>{Math.sqrt(FACTOR_VARIANCE[fi]).toFixed(4)}</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: factorEnabled[fi] ? T.green : T.muted, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{factorEnabled[fi] ? 'Enabled' : 'Disabled'}</span></td>
                      <td style={{ padding: '7px 12px', color: factorEnabled[fi] ? T.text : T.muted }}>
                        {factorEnabled[fi] ? `${(factorAttribution.reduce((s, x) => s + (fi === 0 ? x.carbon : fi === 1 ? x.green : fi === 2 ? x.physical : x.transition), 0)).toFixed(1)} bps` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Portfolio VaR timeline */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>VaR Evolution Under Rebalancing Scenarios (Simulated)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={Array.from({ length: 12 }, (_, i) => ({
                  period: `M${i + 1}`,
                  monthly: +(portfolioVaR * (1 + sr(i * 7 + 3) * 0.1 - 0.05)).toFixed(0),
                  quarterly: +(portfolioVaR * (1 + sr(i * 11 + 5) * 0.12 - 0.06)).toFixed(0),
                  annual: +(portfolioVaR * (1 + sr(i * 13 + 7) * 0.18 - 0.08)).toFixed(0),
                }))} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={totalBudget} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Budget', fontSize: 9, fill: T.red }} />
                  <Line type="monotone" dataKey="monthly" stroke={T.green} strokeWidth={2} name="Monthly Rebal" dot={false} />
                  <Line type="monotone" dataKey="quarterly" stroke={T.amber} strokeWidth={2} name="Quarterly Rebal" dot={false} />
                  <Line type="monotone" dataKey="annual" stroke={T.red} strokeWidth={2} name="Annual Rebal" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Asset class cross-correlation table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Asset Class Carbon Intensity & Risk Profile</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Asset Class','Weight %','Carbon β','Green β','CI (tCO₂e/$M)','Liq. Discount','Total CI VaR','Phys VaR','Trans VaR','Hedge Cost'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ASSETS.map((a, i) => (
                    <tr key={a.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '6px 10px' }}>{(normalizedWeights[i] * 100).toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', color: a.carbonBeta > 0 ? T.red : T.green }}>{a.carbonBeta.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', color: a.greenBeta > 0 ? T.green : T.amber }}>{a.greenBeta.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', color: a.carbonIntensity > 200 ? T.amber : T.text }}>{a.carbonIntensity.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: a.liquidityDiscount > 30 ? T.red : T.text }}>{a.liquidityDiscount.toFixed(1)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.totalClimateVaR.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: T.red }}>{a.physRiskVaR.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: T.amber }}>{a.transRiskVaR.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px' }}>{a.hedgingCostBps.toFixed(1)} bps</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom panel */}
        {activeTab !== 6 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Risk Budget Status</div>
              {ASSETS.map((a, i) => {
                const util = mrc[i]?.utilization || 0;
                return (
                  <div key={a.name} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600 }}>{a.name.substring(0, 14)}</span>
                      <span style={{ color: util > 100 ? T.red : T.green }}>{util.toFixed(0)}%</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 5 }}>
                      <div style={{ background: util > 100 ? T.red : util > 80 ? T.amber : T.green, borderRadius: 4, height: 5, width: `${Math.min(100, util)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Factor Settings</div>
              {FACTORS.map((f, fi) => (
                <div key={f} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: FACTOR_COLORS[fi], fontWeight: 600 }}>{f}</span>
                  <span style={{ color: factorEnabled[fi] ? T.green : T.muted }}>{factorEnabled[fi] ? `IC: ${FACTOR_VARIANCE[fi].toFixed(4)}` : 'Disabled'}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                {[
                  ['Total Budget', `${totalBudget} bps`],
                  ['Used', `${totalBudgetUsed.toFixed(0)} bps`],
                  ['Utilization', `${budgetUtilization.toFixed(1)}%`],
                  ['Portfolio VaR', `${portfolioVaR.toFixed(0)} bps`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                    <span style={{ color: T.muted }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Weight Allocation</div>
              {ASSETS.map((a, i) => (
                <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{a.name.substring(0, 12)}</span>
                  <span style={{ fontWeight: 600 }}>{(normalizedWeights[i] * 100).toFixed(1)}%</span>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 10, color: T.muted }}>Sum: {(normalizedWeights.reduce((s, w) => s + w, 0) * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Per-asset MRC table with full factor decomposition */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Full Euler MRC Decomposition by Asset Class</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Asset Class','Weight %','Euler MRC (bps)','% of Total','MRC Budget','Utilization','Carbon β','Green β','Phys β','Trans β','Status'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((a, i) => {
                  const m = mrc[i];
                  const totalMRC = mrc.reduce((s, x) => s + x.mrc, 0);
                  const pctOfTotal = totalMRC > 0 ? (m.mrc / totalMRC * 100).toFixed(1) : 0;
                  return (
                    <tr key={a.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '6px 10px' }}>{(normalizedWeights[i] * 100).toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: T.indigo }}>{m.mrc.toFixed(1)}</td>
                      <td style={{ padding: '6px 10px' }}>{pctOfTotal}%</td>
                      <td style={{ padding: '6px 10px' }}>{m.budget.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: m.utilization > 100 ? T.red : T.green }}>{m.utilization.toFixed(0)}%</td>
                      <td style={{ padding: '6px 10px', color: a.carbonBeta > 0 ? T.red : T.green }}>{a.carbonBeta.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', color: a.greenBeta > 0 ? T.green : T.amber }}>{a.greenBeta.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px' }}>{a.physicalBeta.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px' }}>{a.transitionBeta.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: m.utilization > 100 ? T.red : m.utilization > 80 ? T.amber : T.green, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{m.utilization > 100 ? 'OVER' : m.utilization > 80 ? 'HIGH' : 'OK'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pairwise correlation highlights */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Highest Climate Risk Correlations — Top 10 Pairs</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Asset A','Asset B','Correlation','VaR Covariance','Joint Contribution','Diversification Effect','Action'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const pairs = [];
                  for (let i = 0; i < 8; i++) {
                    for (let j = i + 1; j < 8; j++) {
                      pairs.push({ i, j, corr: CORR_MATRIX[i][j] });
                    }
                  }
                  return [...pairs].sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr)).slice(0, 10).map((p, idx) => {
                    const covar = p.corr * assetVols[p.i] * assetVols[p.j] * 10000;
                    const joint = normalizedWeights[p.i] * normalizedWeights[p.j] * covar * 2;
                    const diverEffect = joint > 0 ? 'Risk Adding' : 'Diversifying';
                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 10 }}>{ASSETS[p.i].name.substring(0, 12)}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 10 }}>{ASSETS[p.j].name.substring(0, 12)}</td>
                        <td style={{ padding: '6px 10px', color: p.corr > 0.5 ? T.red : p.corr < -0.3 ? T.green : T.text, fontWeight: 600 }}>{p.corr.toFixed(3)}</td>
                        <td style={{ padding: '6px 10px' }}>{covar.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: joint > 0 ? T.red : T.green }}>{joint > 0 ? '+' : ''}{joint.toFixed(3)}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: joint > 0 ? T.red : T.green, color: '#fff', padding: '2px 6px', borderRadius: 8, fontSize: 9 }}>{diverEffect}</span></td>
                        <td style={{ padding: '6px 10px', fontSize: 10, color: T.muted }}>{joint > 0.1 ? 'Reduce concentration' : 'Maintain'}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Factor contribution pie breakdown */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Total Factor Risk Decomposition</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {[
                { label: 'Carbon', key: 'carbon', color: T.amber },
                { label: 'Green', key: 'green', color: T.green },
                { label: 'Physical', key: 'physical', color: T.red },
                { label: 'Transition', key: 'transition', color: T.purple },
                { label: 'Idiosyncratic', key: 'idiosyncratic', color: T.muted },
              ].map(f => {
                const total = factorAttribution.reduce((s, x) => s + (x[f.key] || 0), 0);
                const grandTotal = factorAttribution.reduce((s, x) => s + x.carbon + x.green + x.physical + x.transition + x.idiosyncratic, 0);
                const pct = grandTotal > 0 ? (total / grandTotal * 100).toFixed(1) : 0;
                return (
                  <div key={f.label} style={{ background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center', borderLeft: `3px solid ${f.color}` }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: f.color }}>{total.toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>bps ({pct}%)</div>
                    <div style={{ background: T.border, borderRadius: 4, height: 4, marginTop: 6 }}>
                      <div style={{ background: f.color, borderRadius: 4, height: 4, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hedging overlay impact */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Hedging Overlay Impact — Cost vs Risk Reduction Table</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Asset Class','Hedge Cost (bps)','Risk Reduction %','Net Benefit','Optimal Hedge Ratio','VaR Before Hedge','VaR After Hedge','Recommendation'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hedgingData.map((h, i) => {
                  const a = ASSETS[i];
                  const varBefore = a.totalClimateVaR * normalizedWeights[i] * 10000;
                  const varAfter = varBefore * (1 - h.riskReduction / 100);
                  const netBenefit = (varBefore - varAfter) - h.costBps;
                  const rec = netBenefit > 0 && hedgingOverlay ? 'Implement' : netBenefit > 0 ? 'Consider' : 'Pass';
                  return (
                    <tr key={h.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{ASSETS[i].name}</td>
                      <td style={{ padding: '6px 10px' }}>{h.costBps.toFixed(1)}</td>
                      <td style={{ padding: '6px 10px', color: T.green }}>{h.riskReduction.toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', color: netBenefit > 0 ? T.green : T.red, fontWeight: 600 }}>{netBenefit > 0 ? '+' : ''}{netBenefit.toFixed(1)} bps</td>
                      <td style={{ padding: '6px 10px' }}>{h.optimalHedgeRatio.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px' }}>{varBefore.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: T.green }}>{varAfter.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: rec === 'Implement' ? T.green : rec === 'Consider' ? T.amber : T.muted, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{rec}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Factor Model Calibration Parameters — Climate Factor Sensitivity & Stress-Implied Vol</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Factor', 'Factor Vol %', 'Avg Beta', 'Expl. Variance', 'Stress Shock 1σ', 'Stress Shock 2σ', 'Tail Corr', 'Review Freq'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.text, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Carbon Price Risk', 'Green Revenue Factor', 'Physical Hazard Factor', 'Policy Transition Factor'].map((f, fi) => {
                  const fVol = +(sr(fi * 9 + 11) * 15 + 5).toFixed(1);
                  const avgBeta = +(sr(fi * 13 + 17) * 0.8 + 0.2).toFixed(3);
                  const expl = +(sr(fi * 7 + 23) * 20 + 5).toFixed(1);
                  const shock1 = +(fVol * avgBeta).toFixed(1);
                  const shock2 = +(fVol * avgBeta * 2).toFixed(1);
                  const tailCorr = +(sr(fi * 17 + 31) * 0.6 + 0.2).toFixed(3);
                  const freq = ['Monthly', 'Quarterly', 'Quarterly', 'Monthly'][fi];
                  return (
                    <tr key={f} style={{ background: fi % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{f}</td>
                      <td style={{ padding: '6px 10px' }}>{fVol}%</td>
                      <td style={{ padding: '6px 10px', color: T.indigo, fontWeight: 600 }}>{avgBeta}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ background: T.border, borderRadius: 4, height: 6, width: 70 }}>
                            <div style={{ background: T.blue, borderRadius: 4, height: 6, width: `${Math.min(100, expl * 4)}%` }} />
                          </div>
                          <span>{expl}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px', color: T.amber }}>{shock1} bps</td>
                      <td style={{ padding: '6px 10px', color: T.red, fontWeight: 600 }}>{shock2} bps</td>
                      <td style={{ padding: '6px 10px' }}>{tailCorr}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: freq === 'Monthly' ? T.teal : T.indigo, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{freq}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>Rebalancing Cost Analysis — Turnover vs Risk Reduction Trade-off</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'].map((freq, fi) => {
                const turnover = +(sr(fi * 11 + 9) * 15 + 2).toFixed(1);
                const costBps = +(turnover * (sr(fi * 7 + 3) * 8 + 3)).toFixed(0);
                const varRedn = +(sr(fi * 13 + 5) * 10 + 1).toFixed(1);
                const netBenefit = +(varRedn * 2 - costBps * 0.01).toFixed(2);
                return (
                  <div key={freq} style={{ background: T.sub, borderRadius: 8, padding: 14, borderLeft: `3px solid ${netBenefit > 0 ? T.green : T.red}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>{freq}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>Turnover: <strong style={{ color: T.text }}>{turnover}%</strong></div>
                    <div style={{ fontSize: 11, color: T.muted }}>Cost: <strong style={{ color: T.amber }}>{costBps} bps</strong></div>
                    <div style={{ fontSize: 11, color: T.muted }}>VaR ↓: <strong style={{ color: T.green }}>{varRedn} bps</strong></div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: netBenefit > 0 ? T.green : T.red, marginTop: 8 }}>{netBenefit > 0 ? '+' : ''}{netBenefit}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Net Benefit (bps)</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
