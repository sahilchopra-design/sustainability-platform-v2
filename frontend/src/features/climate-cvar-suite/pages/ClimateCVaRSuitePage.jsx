import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine
} from 'recharts';

// ─── Module-level constants ────────────────────────────────────────────────

const ASSET_CLASSES = [
  'Corporate Bonds',
  'Listed Equity',
  'Real Estate',
  'Infrastructure',
  'Private Credit',
];

const NGFS_SCENARIOS = [
  {
    id: 0,
    name: 'Net Zero 2050',
    physLevel: 'Low',
    transLevel: 'High (early)',
    color: '#16a34a',
    physMult: 0.65,
    transMult: 1.35,
  },
  {
    id: 1,
    name: 'Below 2°C',
    physLevel: 'Medium',
    transLevel: 'Moderate',
    color: '#0369a1',
    physMult: 0.90,
    transMult: 1.10,
  },
  {
    id: 2,
    name: 'Delayed Transition',
    physLevel: 'Medium',
    transLevel: 'Very High (late)',
    color: '#d97706',
    physMult: 1.05,
    transMult: 1.55,
  },
  {
    id: 3,
    name: 'Hot House World',
    physLevel: 'Very High',
    transLevel: 'Low',
    color: '#dc2626',
    physMult: 1.75,
    transMult: 0.45,
  },
];

const HORIZONS = [2030, 2040, 2050];
const HORIZON_MULT = { 2030: 1.0, 2040: 1.35, 2050: 1.75 };

const RISK_DIMENSIONS = [
  'Physical Chronic',
  'Physical Acute',
  'Transition Policy',
  'Transition Tech',
  'Transition Market',
];

const TABS = [
  'CVaR Dashboard',
  'Scenario Comparison',
  'Asset Class Decomposition',
  'Time Horizon Analysis',
  'Risk Attribution',
];

// ─── Component ────────────────────────────────────────────────────────────

export default function ClimateCVaRSuitePage() {
  const T = {
    bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
    sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
    green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
    navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
  };

  const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

  const [activeTab, setActiveTab] = useState(0);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [selectedHorizon, setSelectedHorizon] = useState(2030);
  const [weights, setWeights] = useState([30, 25, 20, 15, 10]);

  const selectedScenario = NGFS_SCENARIOS[selectedScenarioIdx];

  // ── Generate 60 CVaR parameter entries: 4 scenarios × 5 asset classes × 3 horizons ──
  const cvarParams = useMemo(() => {
    const entries = [];
    let i = 0;
    for (const scenario of NGFS_SCENARIOS) {
      for (const assetClass of ASSET_CLASSES) {
        for (const horizon of HORIZONS) {
          const physCVaR95 = sr(i * 11) * 15 + 2;
          const transCVaR95 = sr(i * 17) * 20 + 3;
          const physCVaR99 = physCVaR95 * 1.4;
          const transCVaR99 = transCVaR95 * 1.45;
          const correlation = sr(i * 23) * 0.4 + 0.1;
          const pAdj = physCVaR95 * scenario.physMult * HORIZON_MULT[horizon];
          const tAdj = transCVaR95 * scenario.transMult * HORIZON_MULT[horizon];
          const pAdj99 = physCVaR99 * scenario.physMult * HORIZON_MULT[horizon];
          const tAdj99 = transCVaR99 * scenario.transMult * HORIZON_MULT[horizon];
          const combinedCVaR95 = Math.sqrt(pAdj * pAdj + tAdj * tAdj + 2 * correlation * pAdj * tAdj);
          const combinedCVaR99 = Math.sqrt(pAdj99 * pAdj99 + tAdj99 * tAdj99 + 2 * correlation * pAdj99 * tAdj99);
          entries.push({
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            assetClass,
            horizon,
            physCVaR95: pAdj,
            transCVaR95: tAdj,
            physCVaR99: pAdj99,
            transCVaR99: tAdj99,
            correlation,
            combinedCVaR95,
            combinedCVaR99,
          });
          i++;
        }
      }
    }
    return entries;
  }, []);

  // ── Filter params for selected scenario + horizon ─────────────────────
  const filteredParams = useMemo(() => {
    return cvarParams.filter(p => p.scenarioId === selectedScenarioIdx && p.horizon === selectedHorizon);
  }, [cvarParams, selectedScenarioIdx, selectedHorizon]);

  // ── Weighted portfolio CVaR ────────────────────────────────────────────
  const portfolioCVaR = useMemo(() => {
    if (!filteredParams.length) return { cvar95: 0, cvar99: 0, diversificationBenefit: 0, standaloneSum95: 0 };
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    if (totalWeight === 0) return { cvar95: 0, cvar99: 0, diversificationBenefit: 0, standaloneSum95: 0 };
    const weightedCVaR95 = filteredParams.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR95, 0) / totalWeight;
    const weightedCVaR99 = filteredParams.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR99, 0) / totalWeight;
    const standaloneSum95 = filteredParams.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR95, 0) / totalWeight;
    // Diversification benefit = simple correlation-adjusted reduction
    const avgCorr = filteredParams.reduce((s, p) => s + p.correlation, 0) / filteredParams.length;
    const diversificationBenefit = standaloneSum95 * (1 - avgCorr) * 0.15;
    return { cvar95: weightedCVaR95, cvar99: weightedCVaR99, diversificationBenefit, standaloneSum95 };
  }, [filteredParams, weights]);

  // ── Loss distribution (50 scenarios) ─────────────────────────────────
  const lossDistribution = useMemo(() => {
    if (!filteredParams.length) return [];
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    if (totalWeight === 0) return [];
    const portfolioCVaR99 = filteredParams.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR99, 0) / totalWeight;
    const losses = Array.from({ length: 50 }, (_, j) => {
      const loss = sr(j * 7 + selectedScenarioIdx * 50) * portfolioCVaR99 * 2;
      return loss;
    }).sort((a, b) => a - b);
    const var95 = losses[Math.floor(50 * 0.95)];
    const var99 = losses[Math.floor(50 * 0.99)];
    return losses.map((loss, j) => ({ bin: j + 1, loss: +loss.toFixed(2), var95, var99 }));
  }, [filteredParams, selectedScenarioIdx, weights]);

  // ── Scenario comparison data ──────────────────────────────────────────
  const scenarioComparisonData = useMemo(() => {
    return NGFS_SCENARIOS.map(sc => {
      const params = cvarParams.filter(p => p.scenarioId === sc.id && p.horizon === selectedHorizon);
      if (!params.length) return { scenario: sc.name, physCVaR95: 0, transCVaR95: 0, combinedCVaR95: 0, color: sc.color };
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      const avgPhys = totalWeight > 0 ? params.reduce((s, p, idx) => s + (weights[idx] || 0) * p.physCVaR95, 0) / totalWeight : 0;
      const avgTrans = totalWeight > 0 ? params.reduce((s, p, idx) => s + (weights[idx] || 0) * p.transCVaR95, 0) / totalWeight : 0;
      const avgCombined = totalWeight > 0 ? params.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR95, 0) / totalWeight : 0;
      return {
        scenario: sc.name,
        physCVaR95: +avgPhys.toFixed(2),
        transCVaR95: +avgTrans.toFixed(2),
        combinedCVaR95: +avgCombined.toFixed(2),
        color: sc.color,
      };
    });
  }, [cvarParams, selectedHorizon, weights]);

  // ── Time horizon data ─────────────────────────────────────────────────
  const horizonData = useMemo(() => {
    return HORIZONS.map(h => {
      const row = { horizon: h.toString() };
      for (const sc of NGFS_SCENARIOS) {
        const params = cvarParams.filter(p => p.scenarioId === sc.id && p.horizon === h);
        if (!params.length) { row[sc.name] = 0; continue; }
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        const avg = totalWeight > 0 ? params.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR95, 0) / totalWeight : 0;
        row[sc.name] = +avg.toFixed(2);
      }
      return row;
    });
  }, [cvarParams, weights]);

  // ── Radar / risk attribution data ────────────────────────────────────
  const radarData = useMemo(() => {
    if (!filteredParams.length) return RISK_DIMENSIONS.map(d => ({ dimension: d, value: 0 }));
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    if (totalWeight === 0) return RISK_DIMENSIONS.map(d => ({ dimension: d, value: 0 }));
    const avgPhys = filteredParams.reduce((s, p, idx) => s + (weights[idx] || 0) * p.physCVaR95, 0) / totalWeight;
    const avgTrans = filteredParams.reduce((s, p, idx) => s + (weights[idx] || 0) * p.transCVaR95, 0) / totalWeight;
    return [
      { dimension: 'Physical Chronic', value: +(avgPhys * 0.55).toFixed(2) },
      { dimension: 'Physical Acute', value: +(avgPhys * 0.45).toFixed(2) },
      { dimension: 'Transition Policy', value: +(avgTrans * 0.40).toFixed(2) },
      { dimension: 'Transition Tech', value: +(avgTrans * 0.35).toFixed(2) },
      { dimension: 'Transition Market', value: +(avgTrans * 0.25).toFixed(2) },
    ];
  }, [filteredParams, weights]);

  // ── Marginal CVaR contributions ──────────────────────────────────────
  const marginalCVaR = useMemo(() => {
    if (!filteredParams.length) return [];
    const totalCVaR95 = portfolioCVaR.cvar95;
    return filteredParams.map((p, idx) => {
      const w = weights[idx] || 0;
      const totalWeight = weights.reduce((s, ww) => s + ww, 0);
      const standalone = totalWeight > 0 ? (w * p.combinedCVaR95) / totalWeight : 0;
      const marginal = totalCVaR95 > 0 ? (standalone / totalCVaR95) * 100 : 0;
      return {
        assetClass: p.assetClass,
        standalone: +standalone.toFixed(2),
        marginalPct: +marginal.toFixed(1),
        weight: w,
        physCVaR: +p.physCVaR95.toFixed(2),
        transCVaR: +p.transCVaR95.toFixed(2),
        combinedCVaR: +p.combinedCVaR95.toFixed(2),
      };
    });
  }, [filteredParams, portfolioCVaR, weights]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const handleWeightChange = (idx, val) => {
    const newWeights = [...weights];
    newWeights[idx] = Math.min(60, Math.max(0, +val));
    setWeights(newWeights);
  };

  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const styles = {
    page: { background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text },
    header: { marginBottom: '24px' },
    title: { fontSize: '22px', fontWeight: 700, color: T.navy, margin: 0 },
    subtitle: { fontSize: '13px', color: T.muted, marginTop: '4px' },
    tabBar: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `2px solid ${T.border}`, paddingBottom: '0' },
    tab: (active) => ({
      padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 400,
      background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted,
      borderRadius: '6px 6px 0 0', transition: 'all 0.15s',
    }),
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
    kpiCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '18px 20px' },
    kpiLabel: { fontSize: '11px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' },
    kpiValue: { fontSize: '26px', fontWeight: 700, color: T.navy, margin: '6px 0 2px' },
    kpiSub: { fontSize: '12px', color: T.muted },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' },
    cardTitle: { fontSize: '14px', fontWeight: 600, color: T.navy, marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '8px 12px', background: T.sub, color: T.muted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: `1px solid ${T.border}` },
    td: { padding: '9px 12px', borderBottom: `1px solid ${T.border}`, color: T.text },
    select: { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: '6px', background: T.card, color: T.text, fontSize: '13px' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
    sliderLabel: { fontSize: '13px', color: T.text, width: '140px', flexShrink: 0 },
    sliderValue: { fontSize: '13px', fontWeight: 600, color: T.indigo, width: '36px', textAlign: 'right' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>EP-DB2 — Climate CVaR Quantification Suite</h1>
        <p style={styles.subtitle}>
          Physical & Transition Climate Value-at-Risk · NGFS Phase IV scenarios · 5 asset classes · 3 time horizons · 95th & 99th percentiles
        </p>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {TABS.map((t, i) => (
          <button key={t} style={styles.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: CVaR Dashboard ── */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>NGFS Scenario:</label>
              <select style={styles.select} value={selectedScenarioIdx} onChange={e => setSelectedScenarioIdx(+e.target.value)}>
                {NGFS_SCENARIOS.map((sc, i) => <option key={sc.name} value={i}>{sc.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>Horizon:</label>
              <select style={styles.select} value={selectedHorizon} onChange={e => setSelectedHorizon(+e.target.value)}>
                {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ fontSize: '12px', color: T.muted, background: T.sub, padding: '6px 12px', borderRadius: '6px', border: `1px solid ${T.border}` }}>
              Portfolio weight total: <strong style={{ color: totalWeight === 100 ? T.green : T.red }}>{totalWeight}%</strong>
            </div>
          </div>

          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Portfolio CVaR (95%)</div>
              <div style={{ ...styles.kpiValue, color: T.amber }}>{portfolioCVaR.cvar95.toFixed(2)}%</div>
              <div style={styles.kpiSub}>{selectedScenario.name} · {selectedHorizon}</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Portfolio CVaR (99%)</div>
              <div style={{ ...styles.kpiValue, color: T.red }}>{portfolioCVaR.cvar99.toFixed(2)}%</div>
              <div style={styles.kpiSub}>Tail risk measure</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Diversification Benefit</div>
              <div style={{ ...styles.kpiValue, color: T.green }}>{portfolioCVaR.diversificationBenefit.toFixed(2)}%</div>
              <div style={styles.kpiSub}>CVaR reduction vs standalone</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Scenarios Analysed</div>
              <div style={styles.kpiValue}>{NGFS_SCENARIOS.length}</div>
              <div style={styles.kpiSub}>NGFS Phase IV · 3 horizons</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Portfolio Loss Distribution — {selectedScenario.name} · {selectedHorizon}</div>
            {lossDistribution.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={lossDistribution} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="bin" tick={{ fontSize: 10 }} label={{ value: 'Scenario (ranked by loss)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                  <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, 'Loss']} />
                  <ReferenceLine y={lossDistribution[0]?.var95 || 0} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'VaR 95%', fill: T.amber, fontSize: 11 }} />
                  <ReferenceLine y={lossDistribution[0]?.var99 || 0} stroke={T.red} strokeDasharray="5 5" label={{ value: 'VaR 99%', fill: T.red, fontSize: 11 }} />
                  <defs>
                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={selectedScenario.color} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={selectedScenario.color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="loss" name="Scenario Loss %" fill="url(#lossGrad)" stroke={selectedScenario.color} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>CVaR Summary by Asset Class</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Asset Class', 'Weight (%)', 'Physical CVaR 95%', 'Trans. CVaR 95%', 'Combined CVaR 95%', 'Combined CVaR 99%', 'Correlation'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredParams.map((p, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : T.sub }}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{p.assetClass}</td>
                      <td style={styles.td}>{weights[idx] || 0}%</td>
                      <td style={{ ...styles.td, color: T.blue }}>{p.physCVaR95.toFixed(2)}%</td>
                      <td style={{ ...styles.td, color: T.orange }}>{p.transCVaR95.toFixed(2)}%</td>
                      <td style={{ ...styles.td, color: T.amber, fontWeight: 600 }}>{p.combinedCVaR95.toFixed(2)}%</td>
                      <td style={{ ...styles.td, color: T.red, fontWeight: 600 }}>{p.combinedCVaR99.toFixed(2)}%</td>
                      <td style={styles.td}>{p.correlation.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Scenario Comparison ── */}
      {activeTab === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>Time Horizon:</label>
            <select style={styles.select} value={selectedHorizon} onChange={e => setSelectedHorizon(+e.target.value)}>
              {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Physical vs Transition CVaR by NGFS Scenario (95th Percentile, {selectedHorizon})</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={scenarioComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                <Legend />
                <Bar dataKey="physCVaR95" name="Physical CVaR 95%" fill={T.blue} />
                <Bar dataKey="transCVaR95" name="Transition CVaR 95%" fill={T.orange} />
                <Line type="monotone" dataKey="combinedCVaR95" name="Combined CVaR 95%" stroke={T.red} strokeWidth={2.5} dot={{ r: 5, fill: T.red }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>All Scenarios × Horizons — Full CVaR Matrix</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Scenario</th>
                    <th style={styles.th}>Physical Level</th>
                    <th style={styles.th}>Transition Level</th>
                    {HORIZONS.map(h => (
                      <React.Fragment key={h}>
                        <th style={styles.th}>{h} CVaR 95%</th>
                        <th style={styles.th}>{h} CVaR 99%</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NGFS_SCENARIOS.map((sc, si) => (
                    <tr key={sc.id} style={{ background: si % 2 === 0 ? '#fff' : T.sub }}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: sc.color, marginRight: '6px' }} />
                        {sc.name}
                      </td>
                      <td style={styles.td}>{sc.physLevel}</td>
                      <td style={styles.td}>{sc.transLevel}</td>
                      {HORIZONS.map(h => {
                        const params = cvarParams.filter(p => p.scenarioId === sc.id && p.horizon === h);
                        const totalWeight = weights.reduce((s, w) => s + w, 0);
                        const avg95 = (params.length && totalWeight > 0) ? params.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR95, 0) / totalWeight : 0;
                        const avg99 = (params.length && totalWeight > 0) ? params.reduce((s, p, idx) => s + (weights[idx] || 0) * p.combinedCVaR99, 0) / totalWeight : 0;
                        return (
                          <React.Fragment key={h}>
                            <td style={{ ...styles.td, color: T.amber, fontWeight: 600 }}>{avg95.toFixed(2)}%</td>
                            <td style={{ ...styles.td, color: T.red, fontWeight: 600 }}>{avg99.toFixed(2)}%</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Asset Class Decomposition ── */}
      {activeTab === 2 && (
        <div>
          <div style={styles.row2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Portfolio Weights</div>
              {ASSET_CLASSES.map((ac, idx) => (
                <div key={ac} style={styles.sliderRow}>
                  <span style={styles.sliderLabel}>{ac}</span>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={weights[idx]}
                    onChange={e => handleWeightChange(idx, e.target.value)}
                    style={{ flex: 1, accentColor: T.indigo }}
                  />
                  <span style={styles.sliderValue}>{weights[idx]}%</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', fontSize: '13px', color: totalWeight === 100 ? T.green : T.amber, fontWeight: 600 }}>
                Total: {totalWeight}% {totalWeight !== 100 && '(adjust to reach 100%)'}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Physical vs Transition CVaR by Asset Class</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={filteredParams.map(p => ({
                    name: p.assetClass.replace('Corporate ', 'Corp ').replace('Infrastructure', 'Infra'),
                    physCVaR: +p.physCVaR95.toFixed(2),
                    transCVaR: +p.transCVaR95.toFixed(2),
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                  <Legend />
                  <Bar dataKey="physCVaR" stackId="a" name="Physical CVaR 95%" fill={T.blue} />
                  <Bar dataKey="transCVaR" stackId="a" name="Transition CVaR 95%" fill={T.orange} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Weighted CVaR Contributions by Asset Class</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={marginalCVaR}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="assetClass" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                <Tooltip formatter={(v, n) => [`${typeof v === 'number' ? v.toFixed(2) : v}%`, n]} />
                <Legend />
                <Bar dataKey="physCVaR" name="Physical CVaR 95%" fill={T.blue} />
                <Bar dataKey="transCVaR" name="Transition CVaR 95%" fill={T.orange} />
                <Bar dataKey="combinedCVaR" name="Combined CVaR 95%" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 3: Time Horizon Analysis ── */}
      {activeTab === 3 && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Combined CVaR 95% Over Time Horizons by NGFS Scenario</div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={horizonData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="horizon" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                <Legend />
                {NGFS_SCENARIOS.map(sc => (
                  <Area
                    key={sc.name}
                    type="monotone"
                    dataKey={sc.name}
                    stroke={sc.color}
                    fill={sc.color}
                    fillOpacity={0.08}
                    strokeWidth={2}
                    dot={{ r: 5, fill: sc.color }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Horizon Scaling Factors (NGFS Phase IV Multipliers)</div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {Object.entries(HORIZON_MULT).map(([h, m]) => (
                <div key={h} style={{ ...styles.kpiCard, flex: '1 1 150px', textAlign: 'center' }}>
                  <div style={styles.kpiLabel}>Horizon {h}</div>
                  <div style={{ ...styles.kpiValue, fontSize: '22px' }}>{m.toFixed(2)}×</div>
                  <div style={styles.kpiSub}>{h === '2030' ? 'Near-term' : h === '2040' ? 'Mid-term' : 'Long-term'}</div>
                </div>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Scenario</th>
                    {HORIZONS.map(h => <th key={h} style={styles.th}>{h} CVaR 95%</th>)}
                    <th style={styles.th}>2030→2050 Increase</th>
                  </tr>
                </thead>
                <tbody>
                  {NGFS_SCENARIOS.map((sc, si) => {
                    const row = horizonData;
                    const v2030 = row.find(r => r.horizon === '2030')?.[sc.name] || 0;
                    const v2040 = row.find(r => r.horizon === '2040')?.[sc.name] || 0;
                    const v2050 = row.find(r => r.horizon === '2050')?.[sc.name] || 0;
                    const increase = v2030 > 0 ? ((v2050 - v2030) / v2030 * 100).toFixed(1) : '—';
                    return (
                      <tr key={sc.id} style={{ background: si % 2 === 0 ? '#fff' : T.sub }}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>
                          <span style={{ color: sc.color }}>{sc.name}</span>
                        </td>
                        <td style={styles.td}>{v2030.toFixed(2)}%</td>
                        <td style={styles.td}>{v2040.toFixed(2)}%</td>
                        <td style={{ ...styles.td, color: T.red, fontWeight: 600 }}>{v2050.toFixed(2)}%</td>
                        <td style={{ ...styles.td, color: T.orange, fontWeight: 600 }}>+{increase}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Risk Attribution ── */}
      {activeTab === 4 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>Scenario:</label>
              <select style={styles.select} value={selectedScenarioIdx} onChange={e => setSelectedScenarioIdx(+e.target.value)}>
                {NGFS_SCENARIOS.map((sc, i) => <option key={sc.name} value={i}>{sc.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>Horizon:</label>
              <select style={styles.select} value={selectedHorizon} onChange={e => setSelectedHorizon(+e.target.value)}>
                {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.row2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Risk Dimensions Radar — Portfolio CVaR Attribution</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: T.muted }} />
                  <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                  <Radar name="CVaR %" dataKey="value" stroke={selectedScenario.color} fill={selectedScenario.color} fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Risk Dimension Breakdown</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Dimension</th>
                    <th style={styles.th}>CVaR (%)</th>
                    <th style={styles.th}>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {radarData.map((d, i) => {
                    const total = radarData.reduce((s, r) => s + r.value, 0);
                    const pct = total > 0 ? (d.value / total * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.sub }}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{d.dimension}</td>
                        <td style={{ ...styles.td, color: T.amber, fontWeight: 600 }}>{d.value.toFixed(2)}%</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ height: '6px', width: `${pct}%`, maxWidth: '80px', background: selectedScenario.color, borderRadius: '3px' }} />
                            <span>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Marginal CVaR Contributions — Asset Class Level</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Asset Class', 'Weight (%)', 'Physical CVaR 95%', 'Transition CVaR 95%', 'Combined CVaR 95%', 'Standalone CVaR', 'Marginal Contrib. (%)'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marginalCVaR.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.sub }}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{row.assetClass}</td>
                      <td style={styles.td}>{row.weight}%</td>
                      <td style={{ ...styles.td, color: T.blue }}>{row.physCVaR.toFixed(2)}%</td>
                      <td style={{ ...styles.td, color: T.orange }}>{row.transCVaR.toFixed(2)}%</td>
                      <td style={{ ...styles.td, color: T.amber, fontWeight: 600 }}>{row.combinedCVaR.toFixed(2)}%</td>
                      <td style={styles.td}>{row.standalone.toFixed(2)}%</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ height: '6px', width: `${Math.min(row.marginalPct, 100)}%`, maxWidth: '70px', background: T.indigo, borderRadius: '3px' }} />
                          <span style={{ fontWeight: 600, color: T.indigo }}>{row.marginalPct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
