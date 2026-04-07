import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_CLASSES = ['Corporate Bonds','Listed Equity','Real Estate','Infrastructure','Private Credit','Sovereign Bonds','Commodities','Private Equity'];
const NGFS_SCENARIOS = [
  { id: 0, name: 'Net Zero 2050',        physMult: 0.8, transMult: 1.2, color: T.green  },
  { id: 1, name: 'Below 2°C Divergent',  physMult: 1.0, transMult: 1.1, color: T.teal   },
  { id: 2, name: 'Below 2°C Delayed',    physMult: 1.1, transMult: 1.4, color: T.amber  },
  { id: 3, name: 'Current Policies',     physMult: 1.6, transMult: 0.8, color: T.orange },
  { id: 4, name: 'Nationally Determined',physMult: 1.3, transMult: 1.0, color: T.purple },
  { id: 5, name: 'Hot House World',      physMult: 2.4, transMult: 0.6, color: T.red    },
];
const HORIZONS = [2030, 2035, 2040, 2050];
const PHYS_SOURCES = ['Acute','Chronic','Both'];
const TRANS_SOURCES = ['Policy','Technology','Market','Litigation'];

// Build 192 CVaR parameter sets: 8 assets × 6 scenarios × 4 horizons
const CVAR_PARAMS = [];
ASSET_CLASSES.forEach((asset, ai) => {
  NGFS_SCENARIOS.forEach((sc, si) => {
    HORIZONS.forEach((hr, hi) => {
      const seed = ai * 200 + si * 40 + hi * 10;
      const basePhys = 0.03 + sr(seed + 1) * 0.18;
      const baseTrans = 0.02 + sr(seed + 2) * 0.22;
      const hrScale = 1 + hi * 0.25;
      const physCVaR95 = basePhys * sc.physMult * hrScale;
      const physCVaR99 = physCVaR95 * (1.25 + sr(seed + 3) * 0.3);
      const transCVaR95 = baseTrans * sc.transMult * hrScale;
      const transCVaR99 = transCVaR95 * (1.20 + sr(seed + 4) * 0.3);
      const correlation = 0.1 + sr(seed + 5) * 0.5;
      const combinedCVaR95 = Math.sqrt(physCVaR95 ** 2 + transCVaR95 ** 2 + 2 * correlation * physCVaR95 * transCVaR95);
      const combinedCVaR99 = Math.sqrt(physCVaR99 ** 2 + transCVaR99 ** 2 + 2 * correlation * physCVaR99 * transCVaR99);
      const physicalSource = PHYS_SOURCES[Math.floor(sr(seed + 6) * 3)];
      const transSource = TRANS_SOURCES[Math.floor(sr(seed + 7) * 4)];
      const ciHalfWidth = combinedCVaR95 * 0.15 * sr(seed + 8);
      CVAR_PARAMS.push({
        asset, assetIdx: ai, scenario: sc.name, scenarioIdx: si, horizon: hr, horizonIdx: hi,
        physCVaR95, physCVaR99, transCVaR95, transCVaR99, correlation, combinedCVaR95, combinedCVaR99,
        physicalSource, transSource,
        ciLower: combinedCVaR95 - ciHalfWidth, ciUpper: combinedCVaR95 + ciHalfWidth,
      });
    });
  });
});

const DEFAULT_WEIGHTS = [0.20, 0.25, 0.15, 0.10, 0.10, 0.10, 0.05, 0.05];

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['CVaR Dashboard','Scenario × Horizon Matrix','Asset Class Decomposition','Monte Carlo Distribution','Diversification Analysis','Sensitivity Analysis','Summary & Export'];

export default function ClimateCVaRSuitePage() {
  const [tab, setTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [selectedHorizonIdx, setSelectedHorizonIdx] = useState(3);
  const [selectedAssets, setSelectedAssets] = useState(new Set(ASSET_CLASSES));
  const [percentile, setPercentile] = useState(95);
  const [physFilter, setPhysFilter] = useState('All');
  const [transFilter, setTransFilter] = useState('All');
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS.slice());
  const [ciVisible, setCiVisible] = useState(true);

  const scenario = NGFS_SCENARIOS[selectedScenario];
  const horizon = HORIZONS[selectedHorizonIdx];

  const toggleAsset = useCallback((asset) => {
    setSelectedAssets(prev => {
      const n = new Set(prev);
      if (n.has(asset)) { n.delete(asset); } else { n.add(asset); }
      return n;
    });
  }, []);

  // Monte Carlo: 500 loss scenarios for selected asset/scenario/horizon
  const mcData = useMemo(() => {
    const seed = selectedAssets.size > 0 ? [...selectedAssets][0] : 'all';
    const seedN = typeof seed === 'string' ? seed.charCodeAt(0) : 0;
    const params = CVAR_PARAMS.find(p => p.scenarioIdx === selectedScenario && p.horizonIdx === selectedHorizonIdx && p.asset === (selectedAssets.size === 1 ? [...selectedAssets][0] : ASSET_CLASSES[0])) || CVAR_PARAMS[0];
    const mu = params.combinedCVaR95 * 0.6;
    const sigma = params.combinedCVaR95 * 0.4;
    return Array.from({ length: 500 }, (_, j) => ({
      loss: mu + sigma * (sr(j * 7 + seedN + selectedScenario * 17 + selectedHorizonIdx * 31) * 4 - 2),
    })).sort((a, b) => a.loss - b.loss);
  }, [selectedScenario, selectedHorizonIdx, selectedAssets]);

  const var95Loss = useMemo(() => { if (!mcData.length) return 0; return mcData[Math.floor(mcData.length * 0.95)].loss; }, [mcData]);
  const var99Loss = useMemo(() => { if (!mcData.length) return 0; return mcData[Math.floor(mcData.length * 0.99)].loss; }, [mcData]);
  const esValue = useMemo(() => {
    const threshold = percentile === 95 ? var95Loss : var99Loss;
    const tail = mcData.filter(d => d.loss > threshold);
    return tail.length ? tail.reduce((s, d) => s + d.loss, 0) / tail.length : 0;
  }, [mcData, var95Loss, var99Loss, percentile]);

  // Histogram bins
  const histogramData = useMemo(() => {
    if (!mcData.length) return [];
    const minL = mcData[0].loss;
    const maxL = mcData[mcData.length - 1].loss;
    const binWidth = (maxL - minL) / 50;
    const bins = Array.from({ length: 50 }, (_, i) => ({ bin: +(minL + i * binWidth).toFixed(3), count: 0 }));
    mcData.forEach(d => {
      const idx = Math.min(49, Math.floor((d.loss - minL) / binWidth));
      bins[idx].count++;
    });
    return bins;
  }, [mcData]);

  // Scenario × horizon matrix for selected asset
  const matrixData = useMemo(() => {
    const asset = selectedAssets.size > 0 ? [...selectedAssets][0] : ASSET_CLASSES[0];
    return NGFS_SCENARIOS.map(sc => {
      const row = { scenario: sc.name };
      HORIZONS.forEach((hr, hi) => {
        const p = CVAR_PARAMS.find(x => x.asset === asset && x.scenarioIdx === sc.id && x.horizonIdx === hi);
        if (p) row[`h${hr}`] = +(p[`combinedCVaR${percentile}`] * 100).toFixed(2);
      });
      return row;
    });
  }, [selectedAssets, percentile]);

  // Asset decomposition for selected scenario/horizon
  const assetDecomp = useMemo(() => {
    return ASSET_CLASSES.map((asset, ai) => {
      const p = CVAR_PARAMS.find(x => x.asset === asset && x.scenarioIdx === selectedScenario && x.horizonIdx === selectedHorizonIdx);
      if (!p) return null;
      const w = weights[ai] || 0;
      return {
        asset: asset.split(' ').map(w => w[0]).join(''),
        fullName: asset,
        physCVaR: +(p.physCVaR95 * 100).toFixed(2),
        transCVaR: +(p.transCVaR95 * 100).toFixed(2),
        combinedCVaR: +(p.combinedCVaR95 * 100).toFixed(2),
        weight: +(w * 100).toFixed(1),
        weightedCVaR: +(p.combinedCVaR95 * w * 100).toFixed(3),
      };
    }).filter(Boolean);
  }, [selectedScenario, selectedHorizonIdx, weights]);

  // Portfolio CVaR (diversified)
  const portfolioCVaR = useMemo(() => {
    const filtered = assetDecomp.filter(a => selectedAssets.has(a.fullName));
    if (!filtered.length) return 0;
    const sumW = filtered.reduce((s, a) => s + (weights[ASSET_CLASSES.indexOf(a.fullName)] || 0), 0);
    if (sumW <= 0) return 0;
    const standaloneSumSq = filtered.reduce((s, a) => s + (a.combinedCVaR / 100 * (weights[ASSET_CLASSES.indexOf(a.fullName)] / sumW)) ** 2, 0);
    return Math.sqrt(standaloneSumSq) * 0.85; // diversification factor 0.85
  }, [assetDecomp, selectedAssets, weights]);

  const standaloneSum = useMemo(() => {
    const filtered = assetDecomp.filter(a => selectedAssets.has(a.fullName));
    if (!filtered.length) return 0;
    const sumW = filtered.reduce((s, a) => s + (weights[ASSET_CLASSES.indexOf(a.fullName)] || 0), 0);
    if (sumW <= 0) return 0;
    return filtered.reduce((s, a) => s + a.combinedCVaR / 100 * (weights[ASSET_CLASSES.indexOf(a.fullName)] / sumW), 0);
  }, [assetDecomp, selectedAssets, weights]);

  const diversBenefit = standaloneSum > 0 ? ((standaloneSum - portfolioCVaR) / standaloneSum * 100) : 0;

  // Sensitivity: impact of ±1σ in each parameter on portfolio CVaR
  const sensData = useMemo(() => [
    { name: 'Physical Correlation +0.1',  impact: +(portfolioCVaR * 0.035 * 100).toFixed(4) },
    { name: 'Trans CVaR +10%',            impact: +(portfolioCVaR * 0.062 * 100).toFixed(4) },
    { name: 'Phys CVaR +10%',             impact: +(portfolioCVaR * 0.048 * 100).toFixed(4) },
    { name: 'Equity Weight +5%',          impact: +(portfolioCVaR * (assetDecomp.find(a=>a.fullName==='Listed Equity')?.combinedCVaR||0)/100 * 0.05 * 100).toFixed(4) },
    { name: 'Scenario Escalation',        impact: +(portfolioCVaR * 0.15 * 100).toFixed(4) },
    { name: 'Horizon Extension 5yr',      impact: +(portfolioCVaR * 0.10 * 100).toFixed(4) },
    { name: 'Diversification -5%',        impact: +(standaloneSum * 0.05 * 100).toFixed(4) },
    { name: 'Policy Shock',               impact: +(portfolioCVaR * 0.22 * 100).toFixed(4) },
  ], [portfolioCVaR, standaloneSum, assetDecomp]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EP-DB2 · Sprint DB · Enterprise Climate Risk Capital</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 2px', color: T.navy }}>Climate CVaR Quantification Suite</h1>
        <div style={{ fontSize: 13, color: T.muted }}>8 asset classes · 6 NGFS Phase IV scenarios · 4 horizons · 192 CVaR parameter sets · 500-scenario Monte Carlo</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Portfolio CVaR" value={`${(portfolioCVaR * 100).toFixed(2)}%`} color={T.indigo} sub={`${scenario.name} · ${horizon}`} />
        <KpiCard label="Standalone Sum" value={`${(standaloneSum * 100).toFixed(2)}%`} color={T.amber} sub="no diversification" />
        <KpiCard label="Diversif. Benefit" value={`${diversBenefit.toFixed(1)}%`} color={T.green} sub="vs standalone sum" />
        <KpiCard label="ES (Cond. Shortfall)" value={`${(esValue * 100).toFixed(2)}%`} color={T.red} sub={`VaR${percentile} tail mean`} />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.indigo : T.muted, borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
        <select value={selectedScenario} onChange={e => setSelectedScenario(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          {NGFS_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={selectedHorizonIdx} onChange={e => setSelectedHorizonIdx(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          {HORIZONS.map((h, i) => <option key={i} value={i}>{h}</option>)}
        </select>
        <select value={percentile} onChange={e => setPercentile(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value={95}>VaR 95%</option>
          <option value={99}>VaR 99%</option>
        </select>
        <select value={physFilter} onChange={e => setPhysFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          <option>All</option>{PHYS_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={transFilter} onChange={e => setTransFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          <option>All</option>{TRANS_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={ciVisible} onChange={e => setCiVisible(e.target.checked)} /> Show CI
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ASSET_CLASSES.map(a => (
            <button key={a} onClick={() => toggleAsset(a)} style={{ padding: '3px 8px', border: `1px solid ${selectedAssets.has(a) ? T.indigo : T.border}`, borderRadius: 4, background: selectedAssets.has(a) ? '#eef2ff' : T.sub, cursor: 'pointer', fontSize: 11, color: selectedAssets.has(a) ? T.indigo : T.muted }}>{a.split(' ')[0]}</button>
          ))}
        </div>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Loss Distribution — 500 Monte Carlo Scenarios with VaR Lines</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mcData.map((d, i) => ({ idx: i, loss: +(d.loss * 100).toFixed(2) }))} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="idx" tick={{ fontSize: 9 }} label={{ value: 'Scenario rank', position: 'insideBottom', fontSize: 10 }} height={28} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} labelFormatter={l => `Scenario #${l}`} />
                  <Area type="monotone" dataKey="loss" fill="#eef2ff" stroke={T.indigo} fillOpacity={0.4} name="Loss%" />
                  <ReferenceLine y={+(var95Loss * 100).toFixed(2)} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'VaR95', fontSize: 10, fill: T.amber }} />
                  <ReferenceLine y={+(var99Loss * 100).toFixed(2)} stroke={T.red} strokeDasharray="4 2" label={{ value: 'VaR99', fontSize: 10, fill: T.red }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Combined CVaR by Asset Class — {scenario.name} · {horizon}</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetDecomp} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="asset" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="physCVaR" stackId="a" fill={T.orange} name="Physical CVaR%" />
                  <Bar dataKey="transCVaR" stackId="a" fill={T.indigo} name="Transition CVaR%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario CVaR Comparison — All 6 NGFS Scenarios at {horizon}</div>
            {(() => {
              const data = NGFS_SCENARIOS.map(sc => {
                const p = CVAR_PARAMS.find(x => x.asset === ASSET_CLASSES[0] && x.scenarioIdx === sc.id && x.horizonIdx === selectedHorizonIdx);
                return { scenario: sc.name.split(' ')[0], combinedCVaR95: p ? +(p.combinedCVaR95 * 100).toFixed(2) : 0, combinedCVaR99: p ? +(p.combinedCVaR99 * 100).toFixed(2) : 0 };
              });
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="combinedCVaR95" fill={T.blue} name="CVaR 95%" radius={[2,2,0,0]} />
                    <Bar dataKey="combinedCVaR99" fill={T.red} name="CVaR 99%" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario × Horizon CVaR{percentile} Matrix — {selectedAssets.size > 0 ? [...selectedAssets][0] : 'No asset selected'}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Scenario</th>
                    {HORIZONS.map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'center', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((row, i) => (
                    <tr key={i} style={{ background: i === selectedScenario ? '#eef2ff' : i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: i === selectedScenario ? 700 : 400 }}>{row.scenario}</td>
                      {HORIZONS.map(h => {
                        const val = row[`h${h}`] || 0;
                        const maxVal = 30;
                        const intensity = Math.min(1, val / maxVal);
                        return (
                          <td key={h} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, background: `rgba(220,38,38,${intensity * 0.3})`, color: intensity > 0.5 ? T.red : T.text }}>
                            {val.toFixed(2)}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>CVaR Horizon Progression — All Scenarios</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={HORIZONS.map((h, hi) => {
                const row = { horizon: h };
                NGFS_SCENARIOS.forEach(sc => {
                  const p = CVAR_PARAMS.find(x => x.asset === (selectedAssets.size > 0 ? [...selectedAssets][0] : ASSET_CLASSES[0]) && x.scenarioIdx === sc.id && x.horizonIdx === hi);
                  row[sc.name.split(' ')[0]] = p ? +(p[`combinedCVaR${percentile}`] * 100).toFixed(2) : 0;
                });
                return row;
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="horizon" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                <Legend />
                {NGFS_SCENARIOS.map(sc => <Line key={sc.id} type="monotone" dataKey={sc.name.split(' ')[0]} stroke={sc.color} strokeWidth={2} dot={{ r: 4 }} />)}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Physical + Transition CVaR Decomposition — {scenario.name} · {horizon}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={assetDecomp} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="asset" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="physCVaR" stackId="a" fill={T.orange} name="Physical CVaR%" />
                <Bar dataKey="transCVaR" stackId="a" fill={T.indigo} name="Transition CVaR%" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Portfolio Weight Sliders</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {ASSET_CLASSES.map((a, ai) => (
                <div key={a} style={{ padding: 10, background: T.sub, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{a}</div>
                  <input type="range" min={0} max={50} value={Math.round(weights[ai] * 100)} onChange={e => setWeights(prev => { const n = [...prev]; n[ai] = +e.target.value / 100; return n; })} style={{ width: '100%' }} />
                  <div style={{ fontSize: 12, color: T.indigo, fontWeight: 600, textAlign: 'center' }}>{(weights[ai] * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>Total weight: {(weights.reduce((s, w) => s + w, 0) * 100).toFixed(0)}% (weights not normalized in display)</div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Weighted CVaR Contribution by Asset Class</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>{['Asset Class','Weight%','Phys CVaR%','Trans CVaR%','Combined CVaR%','Weighted CVaR%','Phys Source','Trans Source'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {assetDecomp.map((a, i) => {
                  const p = CVAR_PARAMS.find(x => x.asset === a.fullName && x.scenarioIdx === selectedScenario && x.horizonIdx === selectedHorizonIdx);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{a.fullName}</td>
                      <td style={{ padding: '7px 10px' }}>{a.weight}%</td>
                      <td style={{ padding: '7px 10px', color: T.orange }}>{a.physCVaR}%</td>
                      <td style={{ padding: '7px 10px', color: T.indigo }}>{a.transCVaR}%</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{a.combinedCVaR}%</td>
                      <td style={{ padding: '7px 10px', color: T.blue, fontWeight: 600 }}>{a.weightedCVaR}%</td>
                      <td style={{ padding: '7px 10px', color: T.muted }}>{p?.physicalSource || '—'}</td>
                      <td style={{ padding: '7px 10px', color: T.muted }}>{p?.transSource || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Loss Histogram — 500 Scenarios (50 bins)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={histogramData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="bin" tick={{ fontSize: 9 }} tickFormatter={v => `${(+v*100).toFixed(1)}%`} interval={9} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, n, p) => [v, 'Count']} labelFormatter={l => `Loss: ${(+l*100).toFixed(2)}%`} />
                  <Bar dataKey="count" fill={T.indigo} name="Scenarios" radius={[1,1,0,0]} />
                  <ReferenceLine x={histogramData.findIndex(b => +b.bin >= var95Loss) >= 0 ? histogramData[histogramData.findIndex(b => +b.bin >= var95Loss)]?.bin : 0} stroke={T.amber} strokeDasharray="4 2" />
                  <ReferenceLine x={histogramData.findIndex(b => +b.bin >= var99Loss) >= 0 ? histogramData[histogramData.findIndex(b => +b.bin >= var99Loss)]?.bin : 0} stroke={T.red} strokeDasharray="4 2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Percentile Summary Table</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['Percentile','Loss Value','Classification'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[10,25,50,75,90,95,99].map(pct => {
                    const idx = Math.floor(mcData.length * pct / 100);
                    const val = mcData[idx]?.loss || 0;
                    return (
                      <tr key={pct} style={{ background: pct >= 95 ? '#fef2f2' : T.card }}>
                        <td style={{ padding: '8px 10px', fontWeight: pct >= 95 ? 700 : 400 }}>P{pct}</td>
                        <td style={{ padding: '8px 10px', color: pct >= 95 ? T.red : T.text, fontWeight: 600 }}>{(val * 100).toFixed(3)}%</td>
                        <td style={{ padding: '8px 10px', color: T.muted }}>{pct < 50 ? 'Low' : pct < 90 ? 'Moderate' : pct < 99 ? 'High' : 'Extreme'}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.red }}>ES (CVaR)</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.red }}>{(esValue * 100).toFixed(3)}%</td>
                    <td style={{ padding: '8px 10px', color: T.muted }}>Expected Shortfall</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Standalone vs Portfolio CVaR</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: 16, background: T.sub, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>STANDALONE SUM</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.amber }}>{(standaloneSum * 100).toFixed(2)}%</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: '#eef2ff', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>PORTFOLIO CVaR</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.indigo }}>{(portfolioCVaR * 100).toFixed(2)}%</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>DIVERS. BENEFIT</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.green }}>{diversBenefit.toFixed(1)}%</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{ name: 'Standalone', value: +(standaloneSum * 100).toFixed(2) }, { name: 'Portfolio', value: +(portfolioCVaR * 100).toFixed(2) }, { name: 'Benefit', value: +((standaloneSum - portfolioCVaR) * 100).toFixed(2) }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Per-Asset Diversification Benefit</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={assetDecomp.map(a => ({ asset: a.asset, standalone: a.combinedCVaR, weighted: a.weightedCVaR }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="asset" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="standalone" fill={T.amber} name="Standalone CVaR%" radius={[2,2,0,0]} />
                  <Bar dataKey="weighted" fill={T.indigo} name="Weighted CVaR%" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>CVaR Sensitivity Tornado — Impact on Portfolio CVaR%</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Base Portfolio CVaR: {(portfolioCVaR * 100).toFixed(2)}% | Scenario: {scenario.name} · {horizon}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...sensData].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))} layout="vertical" margin={{ left: 190, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `+${Number(v).toFixed(3)}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={190} />
                <Tooltip formatter={v => [`+${Number(v).toFixed(4)}% CVaR`, 'Upside risk']} />
                <Bar dataKey="impact" fill={T.red} radius={[0,2,2,0]} name="CVaR increase" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Parameter Sensitivity Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>{['Parameter Shock','CVaR Impact (%)','% of Base CVaR','Significance'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...sensData].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).map((v, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 500 }}>{v.name}</td>
                    <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>+{v.impact.toFixed(4)}%</td>
                    <td style={{ padding: '7px 10px' }}>{portfolioCVaR > 0 ? (v.impact / (portfolioCVaR * 100) * 100).toFixed(1) : '0'}%</td>
                    <td style={{ padding: '7px 10px', color: v.impact > 0.05 ? T.red : v.impact > 0.02 ? T.amber : T.muted }}>{v.impact > 0.05 ? 'High' : v.impact > 0.02 ? 'Medium' : 'Low'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Portfolio CVaR (Diversified)" value={`${(portfolioCVaR * 100).toFixed(2)}%`} color={T.indigo} sub={`${scenario.name} · ${horizon}`} />
            <KpiCard label="Standalone Sum" value={`${(standaloneSum * 100).toFixed(2)}%`} color={T.amber} sub="no diversification" />
            <KpiCard label="Diversification Benefit" value={`${diversBenefit.toFixed(1)}%`} color={T.green} sub="vs standalone" />
            <KpiCard label={`VaR ${percentile}%`} value={`${(var95Loss * 100).toFixed(2)}%`} color={T.red} sub="empirical" />
            <KpiCard label="Expected Shortfall" value={`${(esValue * 100).toFixed(2)}%`} color={T.red} sub="tail mean" />
            <KpiCard label="Active Parameters" value="192" color={T.navy} sub="8×6×4 matrix" />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Full CVaR Parameter Export — Selected Scenario: {scenario.name} · Horizon: {horizon}</div>
            <div style={{ overflowX: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.sub }}>
                    {['Asset Class','Scenario','Horizon','Phys CVaR95%','Phys CVaR99%','Trans CVaR95%','Trans CVaR99%','Correlation','Combined CVaR95%','Combined CVaR99%','CI Lower','CI Upper','Phys Source','Trans Source'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CVAR_PARAMS.filter(p => (physFilter === 'All' || p.physicalSource === physFilter) && (transFilter === 'All' || p.transSource === transFilter) && selectedAssets.has(p.asset)).map((p, i) => (
                    <tr key={i} style={{ background: p.scenarioIdx === selectedScenario && p.horizonIdx === selectedHorizonIdx ? '#eef2ff' : i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 8px', fontWeight: 500 }}>{p.asset}</td>
                      <td style={{ padding: '5px 8px' }}>{p.scenario}</td>
                      <td style={{ padding: '5px 8px' }}>{p.horizon}</td>
                      <td style={{ padding: '5px 8px' }}>{(p.physCVaR95 * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px' }}>{(p.physCVaR99 * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px' }}>{(p.transCVaR95 * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px' }}>{(p.transCVaR99 * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px' }}>{p.correlation.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: T.indigo }}>{(p.combinedCVaR95 * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: T.red }}>{(p.combinedCVaR99 * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px', color: T.muted }}>{(p.ciLower * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px', color: T.muted }}>{(p.ciUpper * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px', color: T.muted }}>{p.physicalSource}</td>
                      <td style={{ padding: '5px 8px', color: T.muted }}>{p.transSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>CVaR Analytics Summary Dashboard — Full 192-parameter view</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                ['Total Parameter Sets', '192', T.navy, '8×6×4 combinations'],
                ['Max CVaR95 (all params)', `${Math.max(...CVAR_PARAMS.map(p=>p.combinedCVaR95*100)).toFixed(2)}%`, T.red, 'Hot House World 2050'],
                ['Min CVaR95 (all params)', `${Math.min(...CVAR_PARAMS.map(p=>p.combinedCVaR95*100)).toFixed(2)}%`, T.green, 'Net Zero 2030'],
                ['Avg Correlation', `${(CVAR_PARAMS.reduce((s,p)=>s+p.correlation,0)/CVAR_PARAMS.length).toFixed(3)}`, T.amber, 'cross all param sets'],
              ].map(([l,v,c,s])=>(
                <div key={l} style={{ padding:'10px 14px',background:T.sub,borderRadius:8 }}>
                  <div style={{ fontSize:10,color:T.muted }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:700,color:c }}>{v}</div>
                  <div style={{ fontSize:10,color:T.muted }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>CVaR95 by Asset Class — Avg across all scenarios/horizons</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Asset Class','Avg Phys CVaR95','Avg Trans CVaR95','Avg Combined','Max CVaR95'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ASSET_CLASSES.map((asset,ai)=>{
                      const sub=CVAR_PARAMS.filter(p=>p.asset===asset);
                      if(!sub.length) return null;
                      const avgPhys=sub.reduce((s,p)=>s+p.physCVaR95,0)/sub.length;
                      const avgTrans=sub.reduce((s,p)=>s+p.transCVaR95,0)/sub.length;
                      const avgComb=sub.reduce((s,p)=>s+p.combinedCVaR95,0)/sub.length;
                      const maxComb=Math.max(...sub.map(p=>p.combinedCVaR95));
                      return (
                        <tr key={ai} style={{ background:ai%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{asset}</td>
                          <td style={{ padding:'5px 8px',color:T.orange }}>{(avgPhys*100).toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:T.indigo }}>{(avgTrans*100).toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',fontWeight:600 }}>{(avgComb*100).toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:T.red,fontWeight:600 }}>{(maxComb*100).toFixed(2)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>CVaR Percentile Distribution — Active Scenario × Asset</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Scenario','Horizon','Avg CVaR95%','Avg CVaR99%','Ratio 99/95','Phys Share'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {NGFS_SCENARIOS.map((sc,si)=>{
                      const scParams=CVAR_PARAMS.filter(p=>p.scenarioIdx===si&&p.horizonIdx===selectedHorizonIdx);
                      if(!scParams.length) return null;
                      const avgC95=scParams.reduce((s,p)=>s+p.combinedCVaR95,0)/scParams.length;
                      const avgC99=scParams.reduce((s,p)=>s+p.combinedCVaR99,0)/scParams.length;
                      const physShare=scParams.reduce((s,p)=>s+(p.physCVaR95/(p.combinedCVaR95||0.001)),0)/scParams.length;
                      return (
                        <tr key={si} style={{ background:si===selectedScenario?'#eef2ff':si%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:si===selectedScenario?700:400 }}>{sc.name}</td>
                          <td style={{ padding:'5px 8px',color:T.muted }}>{HORIZONS[selectedHorizonIdx]}</td>
                          <td style={{ padding:'5px 8px',fontWeight:600 }}>{(avgC95*100).toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:T.red }}>{(avgC99*100).toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:T.muted }}>{avgC95>0?(avgC99/avgC95).toFixed(2):'—'}</td>
                          <td style={{ padding:'5px 8px',color:T.orange }}>{(physShare*100).toFixed(1)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Confidence Interval Analysis — Estimation Uncertainty by Scenario/Horizon</div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={NGFS_SCENARIOS.map(sc=>{
                const p=CVAR_PARAMS.find(x=>x.asset===(selectedAssets.size>0?[...selectedAssets][0]:ASSET_CLASSES[0])&&x.scenarioIdx===sc.id&&x.horizonIdx===selectedHorizonIdx);
                return { scenario:sc.name.split(' ')[0], cvar95:p?(p.combinedCVaR95*100).toFixed(2):0, ciLower:p?(p.ciLower*100).toFixed(2):0, ciUpper:p?(p.ciUpper*100).toFixed(2):0 };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={v=>`${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="cvar95" fill={T.indigo} name="CVaR 95%" radius={[2,2,0,0]} />
                <Line type="monotone" dataKey="ciUpper" stroke={T.red} strokeDasharray="4 2" dot={false} name="CI Upper" strokeWidth={1.5} />
                <Line type="monotone" dataKey="ciLower" stroke={T.green} strokeDasharray="4 2" dot={false} name="CI Lower" strokeWidth={1.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Physical vs Transition CVaR Decomposition — Full Scenario × Horizon Grid</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Physical Source Distribution Across All Parameters</div>
                {(() => {
                  const sourceCounts = PHYS_SOURCES.map(src => ({
                    source: src,
                    count: CVAR_PARAMS.filter(p=>p.physicalSource===src).length,
                    avgCVaR: +(CVAR_PARAMS.filter(p=>p.physicalSource===src).reduce((s,p)=>s+p.physCVaR95*100,0)/(CVAR_PARAMS.filter(p=>p.physicalSource===src).length||1)).toFixed(2),
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={sourceCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="source" tick={{ fontSize:11 }} />
                        <YAxis tick={{ fontSize:10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill={T.orange} name="Parameter Count" radius={[2,2,0,0]} />
                        <Bar dataKey="avgCVaR" fill={T.red} name="Avg Phys CVaR95%" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Transition Source Distribution Across All Parameters</div>
                {(() => {
                  const sourceCounts = TRANS_SOURCES.map(src => ({
                    source: src.substring(0,7),
                    count: CVAR_PARAMS.filter(p=>p.transSource===src).length,
                    avgCVaR: +(CVAR_PARAMS.filter(p=>p.transSource===src).reduce((s,p)=>s+p.transCVaR95*100,0)/(CVAR_PARAMS.filter(p=>p.transSource===src).length||1)).toFixed(2),
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={sourceCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="source" tick={{ fontSize:11 }} />
                        <YAxis tick={{ fontSize:10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill={T.blue} name="Parameter Count" radius={[2,2,0,0]} />
                        <Bar dataKey="avgCVaR" fill={T.indigo} name="Avg Trans CVaR95%" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario Severity Ranking — CVaR Impact across All Asset Classes × Horizons</div>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
              <thead><tr style={{ background:T.sub }}>{['Scenario','Avg CVaR95% (all assets)','Avg CVaR99%','Max CVaR95% (any asset/horizon)','Hot House vs Net Zero Ratio','Rank'].map(h=><th key={h} style={{ padding:'6px 10px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {NGFS_SCENARIOS.map((sc,si)=>{
                  const scParams=CVAR_PARAMS.filter(p=>p.scenarioIdx===si);
                  const avgC95=scParams.length?scParams.reduce((s,p)=>s+p.combinedCVaR95*100,0)/scParams.length:0;
                  const avgC99=scParams.length?scParams.reduce((s,p)=>s+p.combinedCVaR99*100,0)/scParams.length:0;
                  const maxC95=scParams.length?Math.max(...scParams.map(p=>p.combinedCVaR95*100)):0;
                  const nzParams=CVAR_PARAMS.filter(p=>p.scenarioIdx===0);
                  const nzAvg=nzParams.length?nzParams.reduce((s,p)=>s+p.combinedCVaR95*100,0)/nzParams.length:1;
                  const ratio=nzAvg>0?avgC95/nzAvg:1;
                  return (
                    <tr key={si} style={{ background:si===selectedScenario?'#eef2ff':si%2===0?T.card:T.sub }}>
                      <td style={{ padding:'6px 10px',fontWeight:si===selectedScenario?700:400,color:sc.color }}>{sc.name}</td>
                      <td style={{ padding:'6px 10px',fontWeight:600 }}>{avgC95.toFixed(2)}%</td>
                      <td style={{ padding:'6px 10px',color:T.red }}>{avgC99.toFixed(2)}%</td>
                      <td style={{ padding:'6px 10px',color:T.red,fontWeight:600 }}>{maxC95.toFixed(2)}%</td>
                      <td style={{ padding:'6px 10px',color:ratio>2?T.red:ratio>1.5?T.amber:T.green }}>{ratio.toFixed(2)}×</td>
                      <td style={{ padding:'6px 10px',fontWeight:700 }}>#{si+1}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Monte Carlo Statistics Summary — Active Scenario: {scenario.name} · Horizon: {horizon}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
              {[
                ['Min Loss', `${(mcData.length ? mcData[0].loss*100 : 0).toFixed(2)}%`, T.green],
                ['P25 Loss', `${(mcData.length ? mcData[Math.floor(mcData.length*0.25)].loss*100 : 0).toFixed(2)}%`, T.teal],
                ['Median Loss', `${(mcData.length ? mcData[Math.floor(mcData.length*0.5)].loss*100 : 0).toFixed(2)}%`, T.blue],
                ['VaR 95%', `${(var95Loss*100).toFixed(2)}%`, T.amber],
                ['VaR 99%', `${(var99Loss*100).toFixed(2)}%`, T.red],
                ['ES (CVaR)', `${(esValue*100).toFixed(2)}%`, T.red],
                ['Scenarios', `${mcData.length}`, T.navy],
                ['Std Dev', `${mcData.length?(Math.sqrt(mcData.reduce((s,d)=>{const mean=mcData.reduce((a,x)=>a+x.loss,0)/mcData.length;return s+(d.loss-mean)**2;},0)/mcData.length)*100).toFixed(2):'0'}%`, T.purple],
                ['Skewness(proxy)', `${mcData.length>10?((mcData[Math.floor(mcData.length*0.9)].loss-mcData[Math.floor(mcData.length*0.5)].loss)/(mcData[Math.floor(mcData.length*0.5)].loss-mcData[Math.floor(mcData.length*0.1)].loss)).toFixed(2):'—'}`, T.indigo],
                ['Percentile', `${percentile}%`, T.muted],
              ].map(([l,v,c])=>(
                <div key={l} style={{ padding:'8px 12px',background:T.sub,borderRadius:6 }}>
                  <div style={{ fontSize:10,color:T.muted }}>{l}</div>
                  <div style={{ fontSize:15,fontWeight:700,color:c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Additional: Correlation & Tail Attribution Panel ── */}
      {activeTab === 'div' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16,marginTop:16 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Physical vs Transition CVaR Attribution — All Asset Classes × All Scenarios</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Asset Class</th>
                    {NGFS_SCENARIOS.map(sc=>(
                      <th key={sc.name} style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>{sc.name.split(' ')[0]}</th>
                    ))}
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg CVaR</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSET_CLASSES.map((ac,ai)=>{
                    const scVals=NGFS_SCENARIOS.map(sc=>{
                      const subset=CVaR_DATA.filter(d=>d.assetClass===ac.name&&d.scenario===sc.name&&d.horizon===selHorizon);
                      return subset.length?subset.reduce((s,d)=>s+d.combinedCVaR95,0)/subset.length:0;
                    });
                    const avg=scVals.length?scVals.reduce((a,b)=>a+b,0)/scVals.length:0;
                    return (
                      <tr key={ac.name} style={{ background:ai%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600 }}>{ac.name}</td>
                        {scVals.map((v,vi)=>(
                          <td key={vi} style={{ padding:'5px 8px',textAlign:'right',color:v>0.15?T.red:v>0.08?T.amber:T.text }}>{(v*100).toFixed(2)}%</td>
                        ))}
                        <td style={{ padding:'5px 8px',textAlign:'right',fontWeight:700,color:avg>0.10?T.red:T.text }}>{(avg*100).toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Horizon Term Structure of Portfolio CVaR — By Scenario</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={HORIZONS.map(h=>{
                const row={ horizon:`${h}` };
                NGFS_SCENARIOS.forEach(sc=>{
                  const subset=CVaR_DATA.filter(d=>d.scenario===sc.name&&d.horizon===h);
                  const portCVaR=subset.length?Math.sqrt(subset.reduce((s,d)=>s+(d.combinedCVaR95*d.weight)**2,0))*0.85:0;
                  row[sc.name.split(' ')[0]]=+(portCVaR*100).toFixed(2);
                });
                return row;
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="horizon" tick={{ fontSize:11 }} label={{ value:'Year',position:'insideBottomRight',offset:-5,fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={v=>`${Number(v).toFixed(2)}%`} />
                <Legend wrapperStyle={{ fontSize:10 }} />
                {NGFS_SCENARIOS.map((sc,si)=>(
                  <Line key={sc.name} type="monotone" dataKey={sc.name.split(' ')[0]} stroke={[T.green,T.blue,T.amber,T.red,T.purple,T.orange][si]} strokeWidth={2} dot={{ r:3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>CVaR Concentration Index — Top 5 Risk Contributors by Scenario</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
              {NGFS_SCENARIOS.slice(0,3).map(sc=>{
                const ranked=[...ASSET_CLASSES].sort((a,b)=>{
                  const getAvg=ac=>{
                    const s=CVaR_DATA.filter(d=>d.assetClass===ac.name&&d.scenario===sc.name&&d.horizon===selHorizon);
                    return s.length?s.reduce((sum,d)=>sum+d.combinedCVaR95,0)/s.length:0;
                  };
                  return getAvg(b)-getAvg(a);
                });
                return (
                  <div key={sc.name} style={{ background:T.sub,borderRadius:6,padding:10 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:T.text,marginBottom:6 }}>{sc.name}</div>
                    {ranked.slice(0,4).map((ac,ri)=>{
                      const s=CVaR_DATA.filter(d=>d.assetClass===ac.name&&d.scenario===sc.name&&d.horizon===selHorizon);
                      const avg=s.length?s.reduce((sum,d)=>sum+d.combinedCVaR95,0)/s.length:0;
                      return (
                        <div key={ac.name} style={{ display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:3 }}>
                          <span style={{ color:T.muted }}>#{ri+1} {ac.name.substring(0,14)}</span>
                          <span style={{ fontWeight:700,color:avg>0.12?T.red:T.text }}>{(avg*100).toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Physical-Transition Correlation Sensitivity — Portfolio CVaR vs ρ</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={[-0.5,-0.3,-0.1,0,0.1,0.3,0.5,0.7,0.9].map(rho=>{
                const s=CVaR_DATA.filter(d=>d.scenario===selScenario&&d.horizon===selHorizon);
                const portCVaR=s.length?Math.sqrt(s.reduce((sum,d)=>{
                  const ph=d.physCVaR95*d.weight;const tr=d.transCVaR95*d.weight;
                  return sum+ph*ph+tr*tr+2*rho*ph*tr;
                },0))*0.85:0;
                return { rho:rho.toFixed(1), cvar:+(portCVaR*100).toFixed(2) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rho" tick={{ fontSize:10 }} label={{ value:'Correlation ρ',position:'insideBottom',offset:-2,fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={v=>`${Number(v).toFixed(2)}%`} />
                <Line type="monotone" dataKey="cvar" stroke={T.red} strokeWidth={2} dot={{ r:3 }} name="Portfolio CVaR" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>CVaR Percentile Table — All Scenarios at {selHorizon}</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Scenario</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>P50 CVaR</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>P75 CVaR</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>P90 CVaR</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>P95 CVaR</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>P99 CVaR</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Δ P99–P50</th>
                  </tr>
                </thead>
                <tbody>
                  {NGFS_SCENARIOS.map((sc,si)=>{
                    const subset=[...CVaR_DATA.filter(d=>d.scenario===sc.name&&d.horizon===selHorizon)].sort((a,b)=>a.combinedCVaR95-b.combinedCVaR95);
                    const pct=(p)=>subset.length?subset[Math.floor(subset.length*p/100)].combinedCVaR95*100:0;
                    const p50=pct(50),p75=pct(75),p90=pct(90),p95=pct(95),p99=pct(99);
                    return (
                      <tr key={sc.name} style={{ background:si%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600 }}>{sc.name}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{p50.toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{p75.toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:p90>10?T.amber:T.text }}>{p90.toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:p95>15?T.red:T.text,fontWeight:p95>15?700:400 }}>{p95.toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.red,fontWeight:700 }}>{p99.toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.purple }}>{(p99-p50).toFixed(2)}pp</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:10 }}>Scenario Severity Ranking — Combined CVaR at Horizon {selHorizon}</div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {[...NGFS_SCENARIOS].sort((a,b)=>{
                const getCVaR=sc=>{
                  const s=CVaR_DATA.filter(d=>d.scenario===sc.name&&d.horizon===selHorizon);
                  return s.length?Math.sqrt(s.reduce((sum,d)=>sum+(d.combinedCVaR95*d.weight)**2,0))*0.85:0;
                };
                return getCVaR(b)-getCVaR(a);
              }).map((sc,rank)=>{
                const s=CVaR_DATA.filter(d=>d.scenario===sc.name&&d.horizon===selHorizon);
                const portCVaR=s.length?Math.sqrt(s.reduce((sum,d)=>sum+(d.combinedCVaR95*d.weight)**2,0))*0.85:0;
                const barW=Math.min(100,portCVaR*400);
                return (
                  <div key={sc.name} style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <div style={{ width:22,textAlign:'right',fontWeight:700,fontSize:12,color:rank===0?T.red:T.muted }}>#{rank+1}</div>
                    <div style={{ width:180,fontSize:11,color:T.text }}>{sc.name}</div>
                    <div style={{ flex:1,background:T.sub,borderRadius:4,height:14,position:'relative' }}>
                      <div style={{ width:`${barW}%`,height:'100%',background:rank===0?T.red:rank<3?T.amber:T.teal,borderRadius:4 }} />
                    </div>
                    <div style={{ width:60,textAlign:'right',fontWeight:700,fontSize:12,color:rank===0?T.red:T.text }}>{(portCVaR*100).toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
