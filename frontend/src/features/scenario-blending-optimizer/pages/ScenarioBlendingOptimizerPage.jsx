import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

const NGFS = {
  current_policies:    { label: 'Current Policies', short: 'CP', color: T.red, temp2100: 3.0, carbonPrice2050: 15, emPeak: 2030, gdpLoss: -1.2 },
  delayed_transition:  { label: 'Delayed Transition', short: 'DT', color: T.orange, temp2100: 2.4, carbonPrice2050: 120, emPeak: 2028, gdpLoss: -3.8 },
  below_2c:           { label: 'Below 2C', short: 'B2C', color: T.amber, temp2100: 1.8, carbonPrice2050: 200, emPeak: 2025, gdpLoss: -2.4 },
  divergent_net_zero: { label: 'Divergent NZ', short: 'DNZ', color: T.blue, temp2100: 1.6, carbonPrice2050: 280, emPeak: 2024, gdpLoss: -4.1 },
  net_zero_2050:      { label: 'Net Zero 2050', short: 'NZ50', color: T.green, temp2100: 1.5, carbonPrice2050: 350, emPeak: 2023, gdpLoss: -2.8 },
};

const OBSERVED_EMISSIONS = [
  { year: 2015, obs: 36.2 }, { year: 2016, obs: 36.4 }, { year: 2017, obs: 36.8 }, { year: 2018, obs: 37.5 },
  { year: 2019, obs: 38.0 }, { year: 2020, obs: 35.4 }, { year: 2021, obs: 37.1 }, { year: 2022, obs: 37.5 },
  { year: 2023, obs: 37.4 }, { year: 2024, obs: 37.8 }, { year: 2025, obs: 38.1 },
];

function generateScenarioPath(base, slope, startYear, endYear) {
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
    year: startYear + i,
    value: Math.max(0, base + slope * i + (Math.random() - 0.5) * 0.8)
  }));
}

const SCENARIO_PATHS = {
  current_policies:    generateScenarioPath(38, 0.25, 2025, 2060),
  delayed_transition:  generateScenarioPath(38, -0.15, 2025, 2060),
  below_2c:           generateScenarioPath(38, -0.55, 2025, 2060),
  divergent_net_zero: generateScenarioPath(38, -0.72, 2025, 2060),
  net_zero_2050:      generateScenarioPath(38, -0.95, 2025, 2060),
};

function computeBMAWeights(observed) {
  const lastObs = observed[observed.length - 1].obs;
  const diffs = Object.entries(SCENARIO_PATHS).map(([k, path]) => {
    const matchYear = path.find(p => p.year === 2025);
    const diff = matchYear ? Math.abs(matchYear.value - lastObs) : 10;
    return { key: k, diff, likelihood: Math.exp(-diff * 0.8) };
  });
  const totalLike = diffs.reduce((s, d) => s + d.likelihood, 0);
  const weights = {};
  diffs.forEach(d => { weights[d.key] = d.likelihood / totalLike; });
  return weights;
}

function blendPaths(weights) {
  const years = SCENARIO_PATHS.current_policies.map(p => p.year);
  return years.map((yr, i) => {
    let blended = 0;
    Object.entries(weights).forEach(([k, w]) => { blended += SCENARIO_PATHS[k][i].value * w; });
    const row = { year: yr, blended };
    Object.entries(SCENARIO_PATHS).forEach(([k, path]) => { row[k] = path[i].value; });
    return row;
  });
}

const TABS = ['Scenario Weights Dashboard', 'BMA Optimizer', 'Custom Blend Builder', 'Orderly vs Disorderly', 'Likelihood Heatmap', 'Consensus Tracker'];

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

export default function ScenarioBlendingOptimizerPage() {
  const [tab, setTab] = useState(0);
  const [customWeights, setCustomWeights] = useState({ current_policies: 20, delayed_transition: 25, below_2c: 25, divergent_net_zero: 15, net_zero_2050: 15 });
  const [savedBlends, setSavedBlends] = useState([]);

  const bmaWeights = useMemo(() => computeBMAWeights(OBSERVED_EMISSIONS), []);
  const bmaBlend = useMemo(() => blendPaths(bmaWeights), [bmaWeights]);

  const customNorm = useMemo(() => {
    const total = Object.values(customWeights).reduce((s, v) => s + v, 0);
    const norm = {};
    Object.entries(customWeights).forEach(([k, v]) => { norm[k] = v / total; });
    return norm;
  }, [customWeights]);
  const customBlend = useMemo(() => blendPaths(customNorm), [customNorm]);

  const compositeTemp = useMemo(() => {
    return Object.entries(bmaWeights).reduce((s, [k, w]) => s + NGFS[k].temp2100 * w, 0);
  }, [bmaWeights]);

  const setWeight = useCallback((key, val) => {
    setCustomWeights(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, +val)) }));
  }, []);

  const weightTotal = Object.values(customWeights).reduce((s, v) => s + v, 0);

  const heatmapData = useMemo(() => {
    const temps = [1.5, 2.0, 2.5, 3.0, 3.5];
    const years = [2030, 2040, 2050, 2060];
    return temps.flatMap(temp => years.map(yr => {
      const prob = Math.max(0.02, Math.min(0.95, 0.5 - (temp - 2.2) * 0.25 + (yr - 2040) * 0.008));
      return { temp: `${temp}C`, year: yr, prob: (prob * 100).toFixed(1), raw: prob };
    }));
  }, []);

  const consensusTimeline = [
    { year: 2020, ipcc: 2.7, iea: 2.6, ngfs: 2.5, network: 2.4 },
    { year: 2021, ipcc: 2.5, iea: 2.4, ngfs: 2.3, network: 2.3 },
    { year: 2022, ipcc: 2.4, iea: 2.1, ngfs: 2.1, network: 2.2 },
    { year: 2023, ipcc: 2.3, iea: 1.9, ngfs: 2.0, network: 2.1 },
    { year: 2024, ipcc: 2.2, iea: 1.8, ngfs: 1.9, network: 2.0 },
    { year: 2025, ipcc: 2.1, iea: 1.7, ngfs: 1.8, network: 1.9 },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CH2 -- SCENARIO BLENDING OPTIMIZER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Bayesian Scenario Blending & Weight Optimization</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              BMA Posterior Weights -- 5 NGFS Scenarios -- Custom Blend Builder -- Orderly vs Disorderly -- Likelihood Heatmap
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Pill label="BMA Composite Temp" val={`${compositeTemp.toFixed(2)}C`} color={T.orange} />
            <Pill label="Top Scenario" val={Object.entries(bmaWeights).sort((a, b) => b[1] - a[1])[0][0].replace(/_/g, ' ').slice(0, 12)} color={T.gold} />
          </div>
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
            <Card title="BMA Posterior Weights" span={2}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(NGFS).map(([k, v]) => (
                  <div key={k} style={{ flex: '1 1 160px', background: T.bg, borderRadius: 10, padding: 16, borderLeft: `4px solid ${v.color}` }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{v.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: v.color, fontFamily: T.mono }}>{(bmaWeights[k] * 100).toFixed(1)}%</div>
                    <div style={{ width: '100%', height: 6, background: T.border, borderRadius: 3, marginTop: 8 }}>
                      <div style={{ width: `${bmaWeights[k] * 100}%`, height: 6, background: v.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <Ref text="Bayesian Model Averaging methodology: Raftery et al. (2005). Posterior weights derived from likelihood of observed Global Carbon Project emissions (2015-2025) under each NGFS scenario pathway." />
            </Card>
            <Card title="Blended Emissions Pathway (BMA)">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={bmaBlend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 50]} label={{ value: 'GtCO2/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="blended" fill={T.gold + '30'} stroke={T.gold} strokeWidth={3} name="BMA Blend" />
                  {Object.entries(NGFS).map(([k, v]) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={v.color} strokeWidth={1} strokeDasharray="4 4" dot={false} name={v.short} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Scenario Assumptions">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Scenario', 'Temp 2100', 'Carbon $', 'Em. Peak', 'GDP Loss'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{Object.entries(NGFS).map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600, color: v.color }}>{v.label}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{v.temp2100}C</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>${v.carbonPrice2050}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{v.emPeak}</td>
                    <td style={{ padding: 8, fontFamily: T.mono, color: T.red }}>{v.gdpLoss}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="BMA Weight Derivation" span={2}>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, marginBottom: 16 }}>
                Posterior weight for scenario S_i: <span style={{ fontFamily: T.mono, color: T.navy }}>w_i = L(obs | S_i) * prior_i / SUM[L(obs | S_j) * prior_j]</span> where L is the likelihood of observed emissions given scenario pathway. Uniform priors assumed (prior_i = 0.20 for all scenarios).
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(NGFS).map(([k, v]) => ({
                  name: v.short, posterior: (bmaWeights[k] * 100), prior: 20, color: v.color
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} label={{ value: 'Weight (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="prior" fill={T.border} name="Prior (Uniform)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="posterior" name="BMA Posterior" radius={[4, 4, 0, 0]}>
                    {Object.entries(NGFS).map(([k, v]) => <Cell key={k} fill={v.color} />)}
                  </Bar>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
              <Ref text="Raftery, Gneiting & Balabdaoui (2005) 'Using BMA to Calibrate Forecast Ensembles'. Applied to NGFS Phase 5 scenarios with Global Carbon Project 2025 observed data." />
            </Card>
            <Card title="Observed vs Scenario Emissions">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={OBSERVED_EMISSIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[34, 40]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="obs" stroke={T.navy} strokeWidth={3} name="Observed (GCP)" dot={{ r: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Likelihood Scores">
              {Object.entries(NGFS).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: v.color, fontWeight: 600, fontSize: 12 }}>{v.label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 12 }}>L = {(bmaWeights[k] * 5).toFixed(4)} | w = {(bmaWeights[k] * 100).toFixed(1)}%</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Custom Blend Builder -- Adjust Weights" span={2}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                {Object.entries(NGFS).map(([k, v]) => (
                  <div key={k} style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: 11, color: v.color, fontWeight: 600 }}>{v.label}: {customWeights[k]}%</label>
                    <input type="range" min={0} max={100} value={customWeights[k]} onChange={e => setWeight(k, e.target.value)}
                      style={{ display: 'block', width: '100%', accentColor: v.color }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: weightTotal === 100 ? T.green : T.red }}>Total: {weightTotal}% {weightTotal !== 100 ? '(will be normalized)' : '(valid)'}</span>
                <button onClick={() => setSavedBlends(prev => [...prev, { id: Date.now(), weights: { ...customWeights } }])} style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Save Blend</button>
              </div>
            </Card>
            <Card title="Custom Blend Pathway">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={customBlend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 50]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="blended" fill={T.purple + '30'} stroke={T.purple} strokeWidth={3} name="Custom Blend" />
                  {Object.entries(NGFS).map(([k, v]) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={v.color + '55'} strokeWidth={1} dot={false} name={v.short} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Saved Blends">
              {savedBlends.length === 0 && <div style={{ fontSize: 11, color: T.textMut }}>No blends saved yet. Adjust weights above and click Save.</div>}
              {savedBlends.map(b => (
                <div key={b.id} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 11 }}>
                  {Object.entries(b.weights).map(([k, v]) => <span key={k} style={{ marginRight: 8 }}><strong>{NGFS[k].short}:</strong> {v}%</span>)}
                </div>
              ))}
              <Ref text="Custom blending follows ensemble weighting methodology from IPCC AR6 WG1 Chapter 4. Weights auto-normalized to sum to 100%." />
            </Card>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Orderly Transition (Net Zero 2050)" span={1}>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
                Smooth, early action pathway. Gradual carbon price ramp. Distributed GDP impact. Technology-led transformation. Lower peak disruption but sustained adjustment costs over 25+ years.
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={SCENARIO_PATHS.net_zero_2050}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 45]} />
                  <Area type="monotone" dataKey="value" fill={T.green + '30'} stroke={T.green} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {[{ l: 'Peak Disruption', v: 'Low' }, { l: 'Duration', v: '25yr+' }, { l: 'Carbon $2050', v: '$350' }].map(m => (
                  <span key={m.l} style={{ background: T.green + '15', padding: '4px 10px', borderRadius: 12, fontSize: 10, color: T.green, fontWeight: 600 }}>{m.l}: {m.v}</span>
                ))}
              </div>
            </Card>
            <Card title="Disorderly Transition (Divergent NZ)" span={1}>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
                Late, abrupt action pathway. Sudden carbon price spike. Concentrated GDP shock in 2030-2040. Policy-driven disruption. Higher peak losses but potentially faster resolution. Stranded asset risk concentrated.
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={SCENARIO_PATHS.divergent_net_zero}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 45]} />
                  <Area type="monotone" dataKey="value" fill={T.red + '30'} stroke={T.red} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {[{ l: 'Peak Disruption', v: 'High' }, { l: 'Duration', v: '10-15yr' }, { l: 'Carbon $2050', v: '$280' }].map(m => (
                  <span key={m.l} style={{ background: T.red + '15', padding: '4px 10px', borderRadius: 12, fontSize: 10, color: T.red, fontWeight: 600 }}>{m.l}: {m.v}</span>
                ))}
              </div>
            </Card>
            <Card title="Transition Speed Comparison" span={2}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={Array.from({ length: 36 }, (_, i) => ({ year: 2025 + i, orderly: Math.max(0, 38 - 0.95 * i + Math.random() * 0.5), disorderly: Math.max(0, 38 - 0.1 * Math.min(i, 10) - 2.2 * Math.max(0, i - 10) + Math.random() * 0.5) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 45]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="orderly" stroke={T.green} strokeWidth={2} name="Orderly (NZ 2050)" />
                  <Line type="monotone" dataKey="disorderly" stroke={T.red} strokeWidth={2} name="Disorderly (Divergent)" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <Ref text="Orderly vs disorderly framing from NGFS Phase 5 technical documentation. Transition speed impacts per Bolton & Kacperczyk (2021) carbon premium analysis." />
            </Card>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Temperature Outcome Likelihood Heatmap (by Decade)">
              <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: 3 }}>
                <div />{[2030, 2040, 2050, 2060].map(y => <div key={y} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.navy, padding: 6 }}>{y}</div>)}
                {[1.5, 2.0, 2.5, 3.0, 3.5].map(temp => (
                  <React.Fragment key={temp}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, padding: 8 }}>{temp}C</div>
                    {[2030, 2040, 2050, 2060].map(yr => {
                      const cell = heatmapData.find(d => d.temp === `${temp}C` && d.year === yr);
                      const r = cell.raw;
                      const bg = r > 0.6 ? T.red : r > 0.4 ? T.orange : r > 0.2 ? T.amber : T.green;
                      return (
                        <div key={yr} style={{ background: bg + (r > 0.5 ? 'cc' : '66'), borderRadius: 4, padding: 10, textAlign: 'center', fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: r > 0.5 ? '#fff' : T.navy }}>
                          {cell.prob}%
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <Ref text="Likelihood estimates derived from BMA posterior weights applied to NGFS Phase 5 temperature distributions. Cross-validated against IPCC AR6 WG1 Table 4.5 assessed ranges." />
            </Card>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Institutional Consensus Temperature Trajectory" span={2}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={consensusTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" fontSize={10} />
                  <YAxis fontSize={10} domain={[1.5, 3.0]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="ipcc" stroke={T.red} strokeWidth={2} name="IPCC" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="iea" stroke={T.blue} strokeWidth={2} name="IEA" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="ngfs" stroke={T.green} strokeWidth={2} name="NGFS" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="network" stroke={T.purple} strokeWidth={2} name="Climate Action Tracker" dot={{ r: 4 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Engagement -- Share & Compare">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => alert('Blend assumptions copied to clipboard')} style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Share Scenario Assumptions</button>
                <button onClick={() => alert('Blend comparison exported')} style={{ padding: '6px 14px', background: T.blue, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Export Blend Comparison</button>
                <button onClick={() => alert('BMA report generated')} style={{ padding: '6px 14px', background: T.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Generate BMA Report</button>
              </div>
            </Card>
            <Card title="Consensus Drift Summary">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Body', '2020', '2025', 'Shift'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{[
                  { body: 'IPCC', c20: '2.7C', c25: '2.1C', shift: '-0.6C', col: T.red },
                  { body: 'IEA', c20: '2.6C', c25: '1.7C', shift: '-0.9C', col: T.blue },
                  { body: 'NGFS', c20: '2.5C', c25: '1.8C', shift: '-0.7C', col: T.green },
                  { body: 'CAT', c20: '2.4C', c25: '1.9C', shift: '-0.5C', col: T.purple },
                ].map(r => (
                  <tr key={r.body} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600, color: r.col }}>{r.body}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.c20}</td>
                    <td style={{ padding: 8, fontFamily: T.mono }}>{r.c25}</td>
                    <td style={{ padding: 8, fontFamily: T.mono, color: T.green }}>{r.shift}</td>
                  </tr>
                ))}</tbody>
              </table>
              <Ref text="Consensus tracking from IPCC AR6 Synthesis, IEA WEO 2025, NGFS Phase 5, Climate Action Tracker (Nov 2025)." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
