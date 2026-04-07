import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, Cell, ComposedChart, Line,
  ReferenceLine, LineChart,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Utilities', 'Financials', 'Real Estate', 'Materials', 'Industrials', 'Consumer', 'Technology', 'Healthcare', 'Agriculture', 'Transport', 'Infrastructure'];
const GDP_WEIGHTS = [0.15, 0.08, 0.20, 0.12, 0.06, 0.10, 0.09, 0.07, 0.04, 0.03, 0.04, 0.02];

const AMPLIFIER_CHANNELS = [
  { name: 'Fire-Sale Dynamics', score: sr(0) * 60 + 20, description: 'Forced asset liquidation amplifying climate price corrections', threshold: 50 },
  { name: 'Credit Crunch', score: sr(1) * 55 + 25, description: 'Tightening credit conditions for high-carbon borrowers', threshold: 50 },
  { name: 'Demand Shock', score: sr(2) * 65 + 15, description: 'Aggregate demand reduction from physical climate damages', threshold: 50 },
  { name: 'Regulatory Contagion', score: sr(3) * 50 + 30, description: 'Cross-border transmission of climate regulatory actions', threshold: 50 },
];

const CB_INDICATOR_NAMES = [
  'Climate Stress Index', 'Green Asset Ratio', 'Carbon Stranding Beta', 'Fossil Loan Concentration',
  'Climate Sentiment Index', 'SLR Exposure Ratio', 'Physical Risk Premium', 'Transition Credit Spread',
  'Climate Default Correlation', 'Green Bond Issuance Growth', 'Policy Uncertainty Index',
  'Climate Systemic VaR', 'Contagion Amplification Factor', 'Climate Tail Risk', 'Macro Climate Score',
];

const CB_INDICATORS = CB_INDICATOR_NAMES.map((name, i) => ({
  name,
  value: +(sr(i * 13) * 80 + 10).toFixed(1),
  threshold: 60,
  direction: i % 2 === 0 ? 'higher_worse' : 'lower_worse',
  trend: [+(sr(i * 17) * 10 - 5).toFixed(2), +(sr(i * 19) * 10 - 5).toFixed(2), +(sr(i * 23) * 10 - 5).toFixed(2)],
}));

// Sector physical/transition risk scores
const SECTOR_RISKS = SECTORS.map((s, i) => ({
  sector: s,
  physRisk: +(sr(i * 7 + 1) * 70 + 15).toFixed(1),
  transRisk: +(sr(i * 11 + 2) * 65 + 20).toFixed(1),
}));

// 12×12 network matrix
const NETWORK_MATRIX = Array.from({ length: 12 }, (_, i) =>
  Array.from({ length: 12 }, (_, j) => i === j ? 1.0 : sr(i * 12 + j) * 0.8)
);

// NGFS time series 2025-2050 (6 points)
const YEARS = [2025, 2030, 2035, 2040, 2045, 2050];
const SCENARIO_LABELS = ['Orderly', 'Disorderly', 'Hot House'];
const SCENARIO_BASES = [38, 45, 62];
const SCENARIO_GROWTHS = [0.8, 1.6, 2.9];

const SYSTEMIC_TIMESERIES = YEARS.map((yr, yi) => {
  const obj = { year: yr };
  SCENARIO_LABELS.forEach((sc, si) => {
    obj[sc] = +(SCENARIO_BASES[si] + SCENARIO_GROWTHS[si] * yi * yi * 0.5 + sr(si * 100 + yi * 13) * 4).toFixed(1);
  });
  return obj;
});

const SCENARIO_COLORS = { Orderly: T.green, Disorderly: T.amber, 'Hot House': T.red };

// Policy response table
const POLICY_ACTIONS = [
  { riskLevel: 'Low (< 30)', indicator: 'No breaches', mpPolicy: 'Standard surveillance', cbAction: 'Maintain current stance', urgency: 'Routine' },
  { riskLevel: 'Moderate (30–50)', indicator: '1–4 breaches', mpPolicy: 'Enhanced reporting', cbAction: 'Climate stress test', urgency: 'Elevated' },
  { riskLevel: 'High (50–70)', indicator: '5–9 breaches', mpPolicy: 'Sectoral capital buffers', cbAction: 'Targeted lending restrictions', urgency: 'Urgent' },
  { riskLevel: 'Systemic (> 70)', indicator: '10+ breaches', mpPolicy: 'Emergency macro-pru tools', cbAction: 'System-wide circuit breaker', urgency: 'Critical' },
];

const SECTOR_COLORS = [T.orange, T.blue, T.indigo, T.teal, T.amber, T.navy, T.purple, T.green, T.red, T.gold, T.orange, T.teal];

const tipStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text };

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.muted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TAB_LABELS = ['Systemic Risk Dashboard', 'Amplifier Channels', 'Network Contagion Map', 'Central Bank Indicators', 'Macro-Prudential Scenarios'];

export default function SystemicClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [breachFilter, setBreachFilter] = useState('All');

  // Compute systemic risk index per sector
  const sectorData = useMemo(() => SECTORS.map((sec, i) => {
    const concentrationFactor = NETWORK_MATRIX[i].reduce((s, v) => s + v, 0);
    const sysRisk = SECTOR_RISKS[i].physRisk * 0.4 + SECTOR_RISKS[i].transRisk * 0.3 + concentrationFactor * 0.3;
    return {
      sector: sec,
      idx: i,
      physRisk: SECTOR_RISKS[i].physRisk,
      transRisk: SECTOR_RISKS[i].transRisk,
      concentrationFactor: +concentrationFactor.toFixed(2),
      systemicRisk: +sysRisk.toFixed(2),
      gdpWeight: GDP_WEIGHTS[i],
    };
  }), []);

  // Weighted overall systemic risk index
  const overallSRI = useMemo(() => {
    const totalW = GDP_WEIGHTS.reduce((s, w) => s + w, 0);
    return totalW > 0 ? sectorData.reduce((s, d) => s + d.systemicRisk * d.gdpWeight, 0) / totalW : 0;
  }, [sectorData]);

  // Contagion scores
  const contagionData = useMemo(() => sectorData.map((d, i) => {
    const sum = SECTORS.reduce((s, _, j) => j !== i ? s + NETWORK_MATRIX[i][j] * sectorData[j].systemicRisk : s, 0);
    const contagion = sum / 11;
    return { ...d, contagionScore: +contagion.toFixed(2) };
  }), [sectorData]);

  // Top 5 contagion pairs
  const top5Pairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        if (i !== j) {
          pairs.push({
            from: SECTORS[i],
            to: SECTORS[j],
            score: +(NETWORK_MATRIX[i][j] * sectorData[j].systemicRisk).toFixed(2),
            link: +(NETWORK_MATRIX[i][j]).toFixed(3),
          });
        }
      }
    }
    return [...pairs].sort((a, b) => b.score - a.score).slice(0, 5);
  }, [sectorData]);

  // pct indicators breaching
  const breachingCount = useMemo(() => CB_INDICATORS.filter(ind => {
    return ind.direction === 'higher_worse' ? ind.value > ind.threshold : ind.value < ind.threshold;
  }).length, []);
  const pctBreaching = (breachingCount / CB_INDICATORS.length * 100).toFixed(1);

  // Top contagion sector
  const topContagionSector = useMemo(() => [...contagionData].sort((a, b) => b.contagionScore - a.contagionScore)[0]?.sector || '-', [contagionData]);

  // Amplification factor (product normalized)
  const amplificationFactor = useMemo(() => {
    const prod = AMPLIFIER_CHANNELS.reduce((p, c) => p * (c.score / 10), 1);
    return +(prod / 10000 * 100).toFixed(3);
  }, []);

  // Filtered sector data
  const filteredSectors = useMemo(() => sectorFilter === 'All' ? contagionData : contagionData.filter(d => d.sector === sectorFilter), [sectorFilter, contagionData]);

  // Channel × scenario data
  const channelScenarioData = useMemo(() => AMPLIFIER_CHANNELS.map((ch, ci) => ({
    name: ch.name.replace(' Dynamics', '').replace(' Contagion', ''),
    score: +ch.score.toFixed(1),
    Orderly: +(ch.score * 0.75).toFixed(1),
    Disorderly: +(ch.score * 1.15).toFixed(1),
    'Hot House': +(ch.score * 1.55).toFixed(1),
    threshold: 50,
  })), []);

  // CB indicators filtered
  const filteredIndicators = useMemo(() => {
    const withBreach = CB_INDICATORS.map(ind => ({
      ...ind,
      isBreaching: ind.direction === 'higher_worse' ? ind.value > ind.threshold : ind.value < ind.threshold,
      trendDir: ind.trend[2] > ind.trend[0] ? 'up' : ind.trend[2] < ind.trend[0] ? 'down' : 'flat',
    }));
    if (breachFilter === 'All') return withBreach;
    if (breachFilter === 'Breaching') return withBreach.filter(i => i.isBreaching);
    return withBreach.filter(i => !i.isBreaching);
  }, [breachFilter]);

  // Scenario conditional impacts table
  const scenarioImpacts = useMemo(() => SCENARIO_LABELS.map((sc, si) => {
    const finalSRI = SYSTEMIC_TIMESERIES[5][sc];
    const bankingLoss = +(sr(si * 7 + 100) * 8 + 3 + si * 4).toFixed(1);
    const creditSpreads = +(sr(si * 11 + 200) * 150 + 50 + si * 80).toFixed(0);
    const gdpImpact = +(sr(si * 13 + 300) * 3 + 0.5 + si * 2).toFixed(1);
    return { scenario: sc, finalSRI, bankingLoss, creditSpreads, gdpImpact };
  }), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 32px', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 4, height: 32, background: T.red, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, letterSpacing: '-0.3px' }}>Systemic Climate Risk Monitor</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>EP-DB6 — BIS/NGFS Macro-Prudential Framework | Network Contagion & Amplifier Channels</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: overallSRI > 70 ? T.red : overallSRI > 50 ? T.amber : T.green }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: overallSRI > 70 ? T.red : overallSRI > 50 ? T.amber : T.green }}>
                {overallSRI > 70 ? 'SYSTEMIC ALERT' : overallSRI > 50 ? 'ELEVATED' : 'MONITORED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TAB_LABELS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '9px 16px', fontSize: 12, fontWeight: tab === i ? 700 : 500, color: tab === i ? T.red : T.muted, background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.red}` : '2px solid transparent', marginBottom: -2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Systemic Risk Dashboard ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="Overall Systemic Risk Index" value={overallSRI.toFixed(2)} sub="GDP-weighted across 12 sectors" color={overallSRI > 60 ? T.red : overallSRI > 40 ? T.amber : T.green} />
            <Kpi label="Indicators Breaching" value={`${pctBreaching}%`} sub={`${breachingCount} of 15 CB indicators above threshold`} color={breachingCount > 8 ? T.red : breachingCount > 4 ? T.amber : T.green} />
            <Kpi label="Top Contagion Sector" value={topContagionSector} sub={`Score: ${contagionData.find(d => d.sector === topContagionSector)?.contagionScore.toFixed(2) || '-'}`} color={T.orange} />
            <Kpi label="Amplification Factor" value={amplificationFactor.toFixed(3)} sub="Normalized channel product" color={amplificationFactor > 5 ? T.red : T.amber} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Systemic Risk Index 2025–2050</div>
                <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.text }}>
                  <option>All</option>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={SYSTEMIC_TIMESERIES} margin={{ top: 4, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} domain={[0, 120]} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={70} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Systemic Threshold', fontSize: 9, fill: T.red }} />
                  {SCENARIO_LABELS.map(sc => (
                    <Line key={sc} type="monotone" dataKey={sc} stroke={SCENARIO_COLORS[sc]} strokeWidth={2.5} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Sector Systemic Risk Index</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filteredSectors} margin={{ top: 4, right: 10, left: 0, bottom: 40 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.muted }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.muted }} width={80} />
                  <Tooltip contentStyle={tipStyle} formatter={v => [v.toFixed(2), 'Systemic Risk Index']} />
                  <ReferenceLine x={70} stroke={T.red} strokeDasharray="4 4" />
                  <Bar dataKey="systemicRisk" name="Systemic Risk Index" radius={[0, 4, 4, 0]}>
                    {filteredSectors.map((d, i) => <Cell key={i} fill={d.systemicRisk > 70 ? T.red : d.systemicRisk > 55 ? T.amber : T.indigo} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: Amplifier Channels ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {AMPLIFIER_CHANNELS.map((ch, i) => (
              <Kpi key={ch.name} label={ch.name} value={ch.score.toFixed(1)} sub={ch.description.substring(0, 44) + '…'} color={ch.score > ch.threshold ? T.red : T.amber} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Amplifier Channel Scores vs Threshold</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={AMPLIFIER_CHANNELS} margin={{ top: 4, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} domain={[0, 100]} />
                  <Tooltip contentStyle={tipStyle} />
                  <ReferenceLine y={50} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Risk Threshold (50)', fontSize: 10, fill: T.red }} />
                  <Bar dataKey="score" name="Channel Score" radius={[4, 4, 0, 0]}>
                    {AMPLIFIER_CHANNELS.map((ch, i) => <Cell key={i} fill={ch.score > 50 ? T.red : T.amber} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Channel Scores × NGFS Scenario</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={channelScenarioData} margin={{ top: 4, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} domain={[0, 110]} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={50} stroke={T.red} strokeDasharray="4 4" />
                  <Bar dataKey="Orderly" fill={T.green} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Disorderly" fill={T.amber} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Hot House" fill={T.red} radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Amplifier Channel Risk Narrative</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Channel', 'Score', 'Status', 'Mechanism', 'Key Indicator', 'Policy Response'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { ch: 'Fire-Sale Dynamics', mech: 'Illiquid climate assets repriced under stress', key: 'Carbon-intensive asset LTV', policy: 'Liquidity buffer requirements' },
                  { ch: 'Credit Crunch', mech: 'Banks reduce lending to carbon-intensive sectors', key: 'Fossil loan % tier-1 capital', policy: 'Targeted credit facilities' },
                  { ch: 'Demand Shock', mech: 'Physical damages reduce output and consumption', key: 'GDP exposure to climate hazards', policy: 'Fiscal stabilization fund' },
                  { ch: 'Regulatory Contagion', mech: 'Uncoordinated policy creates cross-border spillovers', key: 'Policy divergence index', policy: 'NGFS coordination protocol' },
                ].map((r, i) => {
                  const ch = AMPLIFIER_CHANNELS[i];
                  return (
                    <tr key={r.ch} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{r.ch}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: ch.score > 50 ? '#fee2e2' : '#fef3c7', color: ch.score > 50 ? T.red : T.amber }}>
                          {ch.score.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: ch.score > 50 ? T.red : T.amber }}>{ch.score > 50 ? 'Active' : 'Latent'}</td>
                      <td style={{ padding: '8px 10px', color: T.muted, fontSize: 11 }}>{r.mech}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{r.key}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, fontStyle: 'italic', color: T.indigo }}>{r.policy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Network Contagion Map ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="Max Contagion Score" value={Math.max(...contagionData.map(d => d.contagionScore)).toFixed(2)} sub={[...contagionData].sort((a, b) => b.contagionScore - a.contagionScore)[0]?.sector || '-'} color={T.red} />
            <Kpi label="Min Contagion Score" value={Math.min(...contagionData.map(d => d.contagionScore)).toFixed(2)} sub={[...contagionData].sort((a, b) => a.contagionScore - b.contagionScore)[0]?.sector || '-'} color={T.green} />
            <Kpi label="Avg Contagion" value={(contagionData.reduce((s, d) => s + d.contagionScore, 0) / (contagionData.length || 1)).toFixed(2)} sub="Mean across 12 sectors" color={T.indigo} />
            <Kpi label="Network Density" value={(SECTORS.length * (SECTORS.length - 1) > 0 ? (NETWORK_MATRIX.flat().filter(v => v < 1).reduce((s, v) => s + v, 0) / (SECTORS.length * (SECTORS.length - 1))).toFixed(3) : '0')} sub="Mean off-diagonal transmission" color={T.navy} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Contagion Scores by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contagionData} margin={{ top: 4, right: 10, left: 0, bottom: 50 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.muted }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.muted }} width={85} />
                  <Tooltip contentStyle={tipStyle} formatter={v => [v.toFixed(3), 'Contagion Score']} />
                  <Bar dataKey="contagionScore" name="Contagion Score" radius={[0, 4, 4, 0]}>
                    {contagionData.map((d, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Systemic Risk vs Contagion Score</div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Each point = one sector; color = sector</div>
              <ResponsiveContainer width="100%" height={270}>
                <ScatterChart margin={{ top: 4, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="systemicRisk" name="Systemic Risk" type="number" tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Systemic Risk Index', position: 'insideBottom', offset: -5, fontSize: 10, fill: T.muted }} />
                  <YAxis dataKey="contagionScore" name="Contagion Score" type="number" tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Contagion Score', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} content={({ payload }) => payload && payload[0] ? (
                    <div style={{ ...tipStyle, padding: '8px 12px' }}>
                      <div style={{ fontWeight: 700 }}>{payload[0].payload.sector}</div>
                      <div>Systemic Risk: {payload[0].payload.systemicRisk.toFixed(2)}</div>
                      <div>Contagion: {payload[0].payload.contagionScore.toFixed(3)}</div>
                    </div>
                  ) : null} />
                  <Scatter data={contagionData}>
                    {contagionData.map((d, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Top 5 Contagion Transmission Pairs</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Rank', 'Source Sector', 'Target Sector', 'Transmission Score', 'Link Strength', 'Risk Level'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top5Pairs.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.muted }}>#{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{p.from}</td>
                    <td style={{ padding: '8px 10px', color: T.indigo }}>{p.to}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: T.red }}>{p.score.toFixed(3)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{p.link.toFixed(3)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: i < 2 ? '#fee2e2' : i < 4 ? '#fef3c7' : '#f3f4f6', color: i < 2 ? T.red : i < 4 ? T.amber : T.muted }}>
                        {i < 2 ? 'Critical' : i < 4 ? 'High' : 'Elevated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Central Bank Indicators ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <Kpi label="Total Indicators" value={CB_INDICATORS.length} sub="BIS/NGFS macro-prudential" color={T.navy} />
            <Kpi label="Breaching Threshold" value={breachingCount} sub={`${pctBreaching}% of indicators`} color={breachingCount > 8 ? T.red : T.amber} />
            <Kpi label="Avg Indicator Value" value={(CB_INDICATORS.reduce((s, i) => s + i.value, 0) / CB_INDICATORS.length).toFixed(1)} sub="Mean value across 15" color={T.indigo} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.muted }}>Filter:</span>
              {['All', 'Breaching', 'Compliant'].map(f => (
                <button key={f} onClick={() => setBreachFilter(f)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: breachFilter === f ? 700 : 500, color: breachFilter === f ? T.card : T.muted, background: breachFilter === f ? T.red : T.card, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Indicator Values vs Threshold (60)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={filteredIndicators} margin={{ top: 4, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.muted }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} domain={[0, 110]} />
                  <Tooltip contentStyle={tipStyle} />
                  <ReferenceLine y={60} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Threshold', fontSize: 10, fill: T.red }} />
                  <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                    {filteredIndicators.map((ind, i) => <Cell key={i} fill={ind.isBreaching ? T.red : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Indicator Detail Table</div>
              <div style={{ overflowY: 'auto', maxHeight: 320 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Indicator', 'Value', 'Threshold', 'Status', 'Trend'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', position: 'sticky', top: 0, background: T.card }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIndicators.map((ind, i) => (
                      <tr key={ind.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                        <td style={{ padding: '6px 8px', fontWeight: 500, maxWidth: 160 }}>{ind.name}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: ind.isBreaching ? T.red : T.green }}>{ind.value.toFixed(1)}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.muted }}>60.0</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: ind.isBreaching ? '#fee2e2' : '#dcfce7', color: ind.isBreaching ? T.red : T.green }}>
                            {ind.isBreaching ? 'BREACH' : 'OK'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: 13, color: ind.trendDir === 'up' ? T.red : ind.trendDir === 'down' ? T.green : T.muted }}>
                          {ind.trendDir === 'up' ? '▲' : ind.trendDir === 'down' ? '▼' : '─'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Macro-Prudential Scenarios ── */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {scenarioImpacts.map((s, i) => (
              <Kpi key={s.scenario} label={`${s.scenario} — 2050 SRI`} value={s.finalSRI.toFixed(1)} sub={`Banking losses: ${s.bankingLoss}% | GDP: -${s.gdpImpact}%`} color={[T.green, T.amber, T.red][i]} />
            ))}
            <Kpi label="Forecast Horizon" value="2050" sub="NGFS 6-point 5yr steps" color={T.navy} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Systemic Risk Index Forecast 2025–2050 — NGFS Scenarios</div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={SYSTEMIC_TIMESERIES} margin={{ top: 4, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradOrderly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.green} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradDisorderly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.amber} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.amber} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradHot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.red} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.red} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.muted }} />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} domain={[0, 130]} />
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={70} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Systemic Threshold', fontSize: 9, fill: T.red }} />
                <Area type="monotone" dataKey="Orderly" stroke={T.green} strokeWidth={2.5} fill="url(#gradOrderly)" />
                <Area type="monotone" dataKey="Disorderly" stroke={T.amber} strokeWidth={2.5} fill="url(#gradDisorderly)" />
                <Area type="monotone" dataKey="Hot House" stroke={T.red} strokeWidth={2.5} fill="url(#gradHot)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Scenario-Conditional Macro Impacts</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Scenario', '2050 SRI', 'Banking Loss', 'Credit Spreads', 'GDP Impact'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 8px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenarioImpacts.map((s, i) => (
                    <tr key={s.scenario} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                      <td style={{ padding: '8px 8px', fontWeight: 700, color: [T.green, T.amber, T.red][i] }}>{s.scenario}</td>
                      <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontWeight: 700, color: [T.green, T.amber, T.red][i] }}>{s.finalSRI.toFixed(1)}</td>
                      <td style={{ padding: '8px 8px', color: T.red }}>{s.bankingLoss}%</td>
                      <td style={{ padding: '8px 8px', fontFamily: 'monospace' }}>+{s.creditSpreads}bps</td>
                      <td style={{ padding: '8px 8px', color: T.red }}>-{s.gdpImpact}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Macro-Prudential Policy Response Matrix</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Risk Level', 'Indicator Signal', 'MP Policy', 'CB Action', 'Urgency'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {POLICY_ACTIONS.map((r, i) => (
                    <tr key={r.riskLevel} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: [T.green, T.amber, T.orange, T.red][i] }}>{r.riskLevel}</td>
                      <td style={{ padding: '7px 8px', color: T.muted }}>{r.indicator}</td>
                      <td style={{ padding: '7px 8px', fontSize: 10 }}>{r.mpPolicy}</td>
                      <td style={{ padding: '7px 8px', fontSize: 10, color: T.navy }}>{r.cbAction}</td>
                      <td style={{ padding: '7px 8px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: ['#dcfce7', '#fef3c7', '#ffedd5', '#fee2e2'][i], color: [T.green, T.amber, T.orange, T.red][i] }}>
                          {r.urgency}
                        </span>
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
