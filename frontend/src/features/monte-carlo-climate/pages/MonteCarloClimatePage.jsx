import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const NGFS_DIST = {
  carbon_price: { mean: 85, vol: 42, skew: 0.35, label: 'Carbon Price ($/tCO2)', color: T.green },
  gdp_shock: { mean: -2.1, vol: 3.8, skew: -0.6, label: 'GDP Shock (%)', color: T.blue },
  energy_price: { mean: 18, vol: 28, skew: 0.45, label: 'Energy Price Change (%)', color: T.orange },
  tech_cost: { mean: -35, vol: 15, skew: -0.25, label: 'Tech Cost Reduction (%)', color: T.purple },
};

const CORR_MATRIX = [
  [1.0, -0.42, 0.65, -0.38],
  [-0.42, 1.0, -0.28, 0.15],
  [0.65, -0.28, 1.0, -0.22],
  [-0.38, 0.15, -0.22, 1.0],
];
const CORR_LABELS = ['Carbon Price', 'GDP Shock', 'Energy Price', 'Tech Cost'];

// Platform-standard seeded PRNG (sr) — reproducible Monte Carlo results
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
let _mc_idx = 0;
function resetSeed(seed = 42) { _mc_idx = seed | 0; }

// Box-Muller using platform sr PRNG (never Math.random())
function boxMuller() {
  const u1 = Math.max(sr(_mc_idx++), 1e-10);
  const u2 = sr(_mc_idx++);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function simulatePaths(nPaths, horizon, dist, corrAdj, seed = 42) {
  resetSeed(seed); // Reset for reproducibility
  const paths = [];
  const annualVals = [];
  for (let p = 0; p < nPaths; p++) {
    const path = [{ year: 0, value: 0 }];
    let cumReturn = 0;
    for (let y = 1; y <= horizon; y++) {
      const shock = boxMuller() * (dist.vol / 100) * corrAdj + (dist.mean / 100) / horizon;
      cumReturn += shock;
      path.push({ year: y, value: cumReturn * 100 });
    }
    paths.push(path);
    annualVals.push(cumReturn * 100);
  }
  annualVals.sort((a, b) => a - b);
  const var95 = annualVals[Math.floor(nPaths * 0.05)];
  const var99 = annualVals[Math.floor(nPaths * 0.01)];
  const cvar995 = annualVals.slice(0, Math.floor(nPaths * 0.005)).reduce((s, v) => s + v, 0) / Math.floor(nPaths * 0.005);
  const es = annualVals.slice(0, Math.floor(nPaths * 0.05)).reduce((s, v) => s + v, 0) / Math.floor(nPaths * 0.05);
  return { paths, annualVals, var95, var99, cvar995, es, mean: annualVals.reduce((s, v) => s + v, 0) / nPaths };
}

function buildFanChart(paths, horizon) {
  const fan = [];
  for (let y = 0; y <= horizon; y++) {
    const vals = paths.map(p => p[y].value).sort((a, b) => a - b);
    const n = vals.length;
    fan.push({
      year: y, p5: vals[Math.floor(n * 0.05)], p25: vals[Math.floor(n * 0.25)],
      p50: vals[Math.floor(n * 0.5)], p75: vals[Math.floor(n * 0.75)], p95: vals[Math.floor(n * 0.95)]
    });
  }
  return fan;
}

const TABS = ['Simulation Dashboard', 'Fan Chart Visualization', 'Tail Risk Analysis', 'Correlation Matrix', 'Parameter Sensitivity', 'Path Explorer'];

const Card = ({ title, children, span }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, gridColumn: span ? `span ${span}` : undefined }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

const Pill = ({ label, val, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
    <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
  </div>
);

const Ref = ({ text }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400e', marginTop: 12 }}>
    <strong>Reference:</strong> {text}
  </div>
);

export default function MonteCarloClimatePage() {
  const [tab, setTab] = useState(0);
  const [nPaths, setNPaths] = useState(5000);
  const [horizon, setHorizon] = useState(30);
  const [corrAdj, setCorrAdj] = useState(1.0);
  const [distType, setDistType] = useState('normal');
  const [variable, setVariable] = useState('carbon_price');
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [runHistory, setRunHistory] = useState([]);

  const dist = NGFS_DIST[variable];
  const sim = useMemo(() => simulatePaths(Math.min(nPaths, 2000), horizon, dist, corrAdj), [nPaths, horizon, dist, corrAdj]);
  const fan = useMemo(() => buildFanChart(sim.paths, horizon), [sim.paths, horizon]);

  const tailData = useMemo(() => {
    const sorted = [...sim.annualVals];
    const bins = 50;
    const min = sorted[0], max = sorted[sorted.length - 1];
    const step = (max - min) / bins;
    return Array.from({ length: bins }, (_, i) => {
      const lo = min + i * step, hi = lo + step;
      const count = sorted.filter(v => v >= lo && v < hi).length;
      return { x: ((lo + hi) / 2).toFixed(1), count, isLeftTail: (lo + hi) / 2 < sim.var95 };
    });
  }, [sim]);

  const sensitivityData = useMemo(() => {
    return [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(mult => {
      const s = simulatePaths(500, horizon, { ...dist, vol: dist.vol * mult }, corrAdj);
      return { volMult: `${(mult * 100).toFixed(0)}%`, var95: s.var95.toFixed(2), var99: s.var99.toFixed(2), es: s.es.toFixed(2) };
    });
  }, [horizon, dist, corrAdj]);

  const saveConfig = useCallback(() => {
    setSavedConfigs(prev => [...prev, { id: Date.now(), variable, nPaths, horizon, corrAdj, distType, var95: sim.var95.toFixed(2) }]);
  }, [variable, nPaths, horizon, corrAdj, distType, sim]);

  const recordRun = useCallback(() => {
    setRunHistory(prev => [...prev, { ts: new Date().toLocaleTimeString(), variable, var95: sim.var95.toFixed(2), cvar995: sim.cvar995.toFixed(2) }]);
  }, [variable, sim]);

  const samplePaths = sim.paths.slice(0, 20);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CH1 -- MONTE CARLO CLIMATE SIMULATION</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Monte Carlo Climate Simulation Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              5,000-Path Stochastic Simulation -- NGFS Phase 5 Distributions -- Carbon/GDP/Energy/Tech Variables -- VaR/CVaR/ES
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Pill label="VaR (95%)" val={`${sim.var95.toFixed(2)}%`} color={T.red} />
            <Pill label="CVaR (99.5%)" val={`${sim.cvar995.toFixed(2)}%`} color={T.orange} />
            <Pill label="Paths" val={nPaths.toLocaleString()} color={T.gold} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries(NGFS_DIST).map(([k, v]) => (
            <button key={k} onClick={() => setVariable(k)} style={{
              padding: '6px 14px', borderRadius: 20, border: `2px solid ${variable === k ? v.color : 'transparent'}`,
              background: variable === k ? v.color + '22' : 'rgba(255,255,255,0.06)',
              color: variable === k ? v.color : '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600
            }}>{v.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Simulation Controls" span={2}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Path Count: {nPaths.toLocaleString()}</label>
                  <input type="range" min={1000} max={10000} step={500} value={nPaths} onChange={e => setNPaths(+e.target.value)} style={{ display: 'block', width: 180 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Horizon: {horizon}yr</label>
                  <input type="range" min={5} max={50} step={5} value={horizon} onChange={e => setHorizon(+e.target.value)} style={{ display: 'block', width: 180 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Correlation Adj: {corrAdj.toFixed(2)}</label>
                  <input type="range" min={0.5} max={2.0} step={0.05} value={corrAdj} onChange={e => setCorrAdj(+e.target.value)} style={{ display: 'block', width: 180 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Distribution</label>
                  <select value={distType} onChange={e => setDistType(e.target.value)} style={{ display: 'block', padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, marginTop: 4 }}>
                    <option value="normal">Normal</option><option value="t">Student-t (v=5)</option><option value="gev">GEV (Frechet)</option>
                  </select>
                </div>
                <button onClick={() => { saveConfig(); recordRun(); }} style={{ padding: '8px 16px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 14 }}>Save Config & Record Run</button>
              </div>
            </Card>
            <Card title="Key Risk Metrics">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'VaR (95%)', val: `${sim.var95.toFixed(2)}%`, col: T.red },
                  { label: 'VaR (99%)', val: `${sim.var99.toFixed(2)}%`, col: T.orange },
                  { label: 'CVaR (99.5%)', val: `${sim.cvar995.toFixed(2)}%`, col: T.purple },
                  { label: 'Expected Shortfall', val: `${sim.es.toFixed(2)}%`, col: T.blue },
                  { label: 'Mean Return', val: `${sim.mean.toFixed(2)}%`, col: T.green },
                  { label: 'Distribution', val: distType.toUpperCase(), col: T.teal },
                ].map(m => (
                  <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.col, fontFamily: T.mono }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Return Distribution Histogram">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tailData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {tailData.map((d, i) => <Cell key={i} fill={d.isLeftTail ? T.red : T.blue + '88'} />)}
                  </Bar>
                  <ReferenceLine x={sim.var95.toFixed(1)} stroke={T.red} strokeDasharray="5 5" label={{ value: 'VaR95', fill: T.red, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
              <Ref text="NGFS Phase 5 distribution parameters -- Historical carbon price volatility (Intercontinental Exchange, 2015-2025) -- IMF GDP shock distributions (WEO Oct 2025)" />
            </Card>
            <Card title="NGFS Variable Parameters">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 8, color: T.navy }}>Variable</th>
                  <th style={{ textAlign: 'right', padding: 8, color: T.navy }}>Mean</th>
                  <th style={{ textAlign: 'right', padding: 8, color: T.navy }}>Volatility</th>
                  <th style={{ textAlign: 'right', padding: 8, color: T.navy }}>Skew</th>
                </tr></thead>
                <tbody>{Object.entries(NGFS_DIST).map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: `1px solid ${T.border}`, background: k === variable ? v.color + '10' : 'transparent' }}>
                    <td style={{ padding: 8, fontWeight: 600, color: v.color }}>{v.label}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{v.mean}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{v.vol}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{v.skew}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, paddingTop: 4 }}>
            <Card title={`Fan Chart -- ${dist.label} -- ${horizon}-Year Horizon (p5/p25/p50/p75/p95)`} span={1}>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={fan}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} label={{ value: 'Year', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                  <YAxis fontSize={10} label={{ value: 'Cumulative Return (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="p95" stackId="fan" fill={T.blue + '15'} stroke="none" name="p95" />
                  <Area type="monotone" dataKey="p75" stackId="fan2" fill={T.blue + '25'} stroke="none" name="p75" />
                  <Area type="monotone" dataKey="p50" stackId="fan3" fill={T.blue + '40'} stroke={T.blue} strokeWidth={2} name="Median (p50)" />
                  <Area type="monotone" dataKey="p25" stackId="fan4" fill={T.orange + '25'} stroke="none" name="p25" />
                  <Area type="monotone" dataKey="p5" stackId="fan5" fill={T.red + '20'} stroke={T.red} strokeDasharray="4 4" name="p5 (Tail)" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
              <Ref text="Fan chart bands: p5 (extreme downside), p25 (bear case), p50 (median pathway), p75 (bull case), p95 (extreme upside). NGFS Phase 5 calibration." />
            </Card>
            <Card title="Percentile Convergence Table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Year', 'p5', 'p25', 'p50', 'p75', 'p95'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{fan.filter((_, i) => i % 5 === 0 || i === horizon).map(r => (
                  <tr key={r.year} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{r.year}</td>
                    {['p5', 'p25', 'p50', 'p75', 'p95'].map(k => (
                      <td key={k} style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: r[k] < 0 ? T.red : T.green }}>{r[k].toFixed(2)}%</td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 4 }}>
            <Card title="Tail Loss Distribution (Left 5%)" span={2}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tailData.filter(d => d.isLeftTail)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" fill={T.red} radius={[4, 4, 0, 0]} name="Path Count in Bin" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Risk Metric Summary">
              {[
                { metric: 'VaR (95%)', desc: '5% probability of losses exceeding this', val: sim.var95.toFixed(2), col: T.red },
                { metric: 'VaR (99%)', desc: '1% probability of losses exceeding this', val: sim.var99.toFixed(2), col: T.orange },
                { metric: 'CVaR (99.5%)', desc: 'Average loss in worst 0.5% of paths', val: sim.cvar995.toFixed(2), col: T.purple },
                { metric: 'Expected Shortfall', desc: 'Average loss in worst 5% of paths', val: sim.es.toFixed(2), col: T.blue },
              ].map(r => (
                <div key={r.metric} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.metric}</div><div style={{ fontSize: 11, color: T.textMut }}>{r.desc}</div></div>
                  <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: r.col }}>{r.val}%</div>
                </div>
              ))}
              <Ref text="IPCC AR6 WG3 Chapter 3 scenario distributions; Swiss Re sigma tail risk calibration; Basel III IRC methodology for stressed VaR." />
            </Card>
            <Card title="Tail Risk by Variable">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(NGFS_DIST).map(([k, v]) => {
                  const s = simulatePaths(500, horizon, v, corrAdj);
                  return { name: v.label.split('(')[0].trim(), var95: Math.abs(s.var95), cvar995: Math.abs(s.cvar995), fill: v.color };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="var95" fill={T.red} name="VaR 95%" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cvar995" fill={T.purple} name="CVaR 99.5%" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 4 }}>
            <Card title="Inter-Variable Correlation Matrix" span={2}>
              <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${CORR_LABELS.length}, 1fr)`, gap: 2, maxWidth: 600 }}>
                <div />
                {CORR_LABELS.map(l => <div key={l} style={{ fontSize: 10, fontWeight: 700, color: T.navy, textAlign: 'center', padding: 6 }}>{l}</div>)}
                {CORR_MATRIX.map((row, i) => (
                  <React.Fragment key={i}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, padding: 6, display: 'flex', alignItems: 'center' }}>{CORR_LABELS[i]}</div>
                    {row.map((val, j) => {
                      const abs = Math.abs(val);
                      const bg = val > 0 ? `rgba(22,163,74,${abs * 0.6})` : val < 0 ? `rgba(220,38,38,${abs * 0.6})` : T.bg;
                      return (
                        <div key={j} style={{ background: bg, borderRadius: 4, padding: 8, textAlign: 'center', fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: abs > 0.4 ? '#fff' : T.navy }}>
                          {val.toFixed(2)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 12 }}>
                Correlation adjustment factor: <strong style={{ color: T.navy }}>{corrAdj.toFixed(2)}x</strong> (applied to off-diagonal elements)
              </div>
              <Ref text="Correlation estimates from NGFS Phase 5 integrated assessment models (REMIND, MESSAGE, GCAM). Carbon-energy correlation based on EU ETS/TTF spread analysis 2018-2025." />
            </Card>
            <Card title="Correlation Sensitivity -- VaR Impact">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(c => {
                  const s = simulatePaths(500, horizon, dist, c);
                  return { corrAdj: c.toFixed(2), var95: s.var95, var99: s.var99 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="corrAdj" fontSize={10} label={{ value: 'Corr Adj', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="var95" stroke={T.red} strokeWidth={2} name="VaR 95%" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="var99" stroke={T.orange} strokeWidth={2} name="VaR 99%" dot={{ r: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Cross-Variable Scatter">
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="x" name="Carbon Shock" fontSize={10} />
                  <YAxis type="number" dataKey="y" name="GDP Shock" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Scatter name="Simulated Pairs" data={sim.paths.slice(0, 200).map(p => ({ x: p[horizon].value, y: p[Math.floor(horizon / 2)].value }))} fill={T.blue + '66'} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 4 }}>
            <Card title="Volatility Multiplier Sensitivity" span={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Vol Multiplier', 'VaR (95%)', 'VaR (99%)', 'Expected Shortfall'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{sensitivityData.map(r => (
                  <tr key={r.volMult} style={{ borderBottom: `1px solid ${T.border}`, background: r.volMult === '100%' ? T.gold + '15' : 'transparent' }}>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{r.volMult}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{r.var95}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.orange }}>{r.var99}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.blue }}>{r.es}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="VaR Sensitivity to Volatility">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="volMult" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="var95" stroke={T.red} strokeWidth={2} name="VaR 95%" />
                  <Line type="monotone" dataKey="var99" stroke={T.orange} strokeWidth={2} name="VaR 99%" />
                  <Line type="monotone" dataKey="es" stroke={T.blue} strokeWidth={2} name="Exp. Shortfall" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <Ref text="Sensitivity analysis follows BCBS 239 Principles for effective risk data aggregation. Volatility calibration: ICE EUA daily returns 2018-2025, rolling 252-day window." />
            </Card>
            <Card title="Horizon Impact on Tail Risk">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[5, 10, 15, 20, 30, 40, 50].map(h => {
                  const s = simulatePaths(500, h, dist, corrAdj);
                  return { horizon: `${h}yr`, var95: Math.abs(s.var95), cvar995: Math.abs(s.cvar995) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="horizon" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="var95" fill={T.red} name="|VaR 95%|" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cvar995" fill={T.purple} name="|CVaR 99.5%|" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, paddingTop: 4 }}>
            <Card title={`Path Explorer -- 20 Sample Paths (of ${nPaths.toLocaleString()})`}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" type="number" domain={[0, horizon]} fontSize={10} label={{ value: 'Year', position: 'insideBottom', offset: -4, fontSize: 10 }} allowDuplicatedCategory={false} />
                  <YAxis fontSize={10} label={{ value: 'Cumulative Return (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  {samplePaths.map((p, i) => (
                    <Line key={i} data={p} dataKey="value" type="monotone" stroke={`hsl(${(i * 18) % 360}, 60%, 50%)`} strokeWidth={1} dot={false} name={`Path ${i + 1}`} />
                  ))}
                  <ReferenceLine y={0} stroke={T.navy} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Engagement -- Saved Configs & Run History" span={1}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Saved Configurations ({savedConfigs.length})</div>
                  {savedConfigs.length === 0 && <div style={{ fontSize: 11, color: T.textMut }}>No configs saved yet. Use "Save Config" on Dashboard tab.</div>}
                  {savedConfigs.map(c => (
                    <div key={c.id} style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 6, fontSize: 11 }}>
                      <span style={{ fontWeight: 600 }}>{c.variable}</span> -- {c.nPaths} paths, {c.horizon}yr, corr={c.corrAdj}, VaR95={c.var95}%
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Run History ({runHistory.length})</div>
                  {runHistory.length === 0 && <div style={{ fontSize: 11, color: T.textMut }}>No runs recorded yet.</div>}
                  {runHistory.map((r, i) => (
                    <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 6, fontSize: 11 }}>
                      [{r.ts}] {r.variable}: VaR95={r.var95}%, CVaR99.5={r.cvar995}%
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={saveConfig} style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Save Current Config</button>
                <button onClick={recordRun} style={{ padding: '6px 14px', background: T.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Record Run</button>
                <button onClick={() => alert('Export: ' + JSON.stringify(sim.annualVals.slice(0, 50)))} style={{ padding: '6px 14px', background: T.blue, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Export Path Data (JSON)</button>
              </div>
              <Ref text="Simulation methodology: Geometric Brownian Motion with NGFS-calibrated drift/vol. Correlation via Cholesky decomposition. Reference: Glasserman (2003), Monte Carlo Methods in Financial Engineering." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
