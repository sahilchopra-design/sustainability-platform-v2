import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area, ReferenceLine, ScatterChart, Scatter,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SIGNAL_NAMES = [
  'Carbon Efficiency', 'Green Rev Growth', 'Capex Alignment',
  'Regulatory Risk', 'Phys Risk Mgmt', 'Engagement Score',
  'Disclosure Quality', 'Supply Chain Risk',
];
const SIGNAL_KEYS = ['carbonEff','greenRevGrowth','capexAlign','regulatoryRisk','physRiskMgmt','engagementScore','disclosureQuality','supplyChainRisk'];
const SIGNAL_COLORS = [T.amber, T.green, T.teal, T.red, T.blue, T.purple, T.indigo, T.orange];

const TA_SECTORS = ['Energy','Technology','Financials','Industrials','Materials','Utilities','Consumer Disc.','Healthcare','Real Estate'];
const COUNTRIES_TA = ['US','UK','DE','FR','JP','CN','CA','AU','SE','NL'];

const SECURITIES = Array.from({ length: 150 }, (_, i) => {
  const sec = TA_SECTORS[Math.floor(sr(i * 7 + 1) * TA_SECTORS.length)];
  const signals = SIGNAL_KEYS.map((k, si) => +(sr(i * (si + 3) + si * 11 + 2) * 100).toFixed(1));
  const alpha = signals.reduce((s, x) => s + x, 0) / signals.length;
  const prevAlpha = signals.reduce((s, x, si) => s + sr(i * (si + 5) + si * 13 + 3) * 100, 0) / signals.length;
  const btRet = sr(i * 31 + 15) * 0.12 - 0.04;
  const tStat = sr(i * 37 + 17) * 3 + 0.5;
  const ir = sr(i * 41 + 19) * 0.8 + 0.1;
  const halfLife = Math.floor(sr(i * 43 + 21) * 21 + 3);
  return {
    id: i,
    name: `${sec.substring(0, 3).toUpperCase()}-T${String(i + 1).padStart(3, '0')}`,
    sector: sec,
    country: COUNTRIES_TA[Math.floor(sr(i * 47 + 22) * COUNTRIES_TA.length)],
    weight: sr(i * 53 + 23) * 0.015 + 0.001,
    carbonEff: signals[0],
    greenRevGrowth: signals[1],
    capexAlign: signals[2],
    regulatoryRisk: signals[3],
    physRiskMgmt: signals[4],
    engagementScore: signals[5],
    disclosureQuality: signals[6],
    supplyChainRisk: signals[7],
    alphaScore: +alpha.toFixed(2),
    prevAlpha: +prevAlpha.toFixed(2),
    momentum6M: +(alpha - prevAlpha).toFixed(2),
    backtestedReturn: +btRet.toFixed(4),
    tStatistic: +tStat.toFixed(3),
    informationRatio: +ir.toFixed(3),
    halfLife,
    mktCap: sr(i * 59 + 24) * 200 + 0.5,
  };
});

// IC per signal (sr seeded, 0.02–0.18)
const SIGNAL_IC = SIGNAL_KEYS.map((k, i) => +(sr(i * 13 + 77) * 0.16 + 0.02).toFixed(4));
// Signal half-lives
const SIGNAL_HALF_LIFE = SIGNAL_KEYS.map((k, i) => Math.floor(sr(i * 17 + 88) * 21 + 3));

// Signal decay curves
const DECAY_CURVES = SIGNAL_KEYS.map((k, ki) => {
  const hl = SIGNAL_HALF_LIFE[ki];
  return Array.from({ length: 24 }, (_, m) => ({
    month: m + 1,
    ic: +(SIGNAL_IC[ki] * Math.pow(0.5, m / hl)).toFixed(4),
  }));
});

// Backtesting cumulative alpha 2020-2025
const BACKTEST_DATA = (() => {
  let cumAlpha = 0;
  let maxAlpha = 0;
  return Array.from({ length: 60 }, (_, i) => {
    const yr = 2020 + Math.floor(i / 12);
    const mo = i % 12 + 1;
    const monthly = sr(i * 7 + 3) * 0.03 - 0.008;
    cumAlpha += monthly;
    if (cumAlpha > maxAlpha) maxAlpha = cumAlpha;
    const dd = +(cumAlpha - maxAlpha).toFixed(4);
    return {
      period: `${yr}-${String(mo).padStart(2, '0')}`,
      cumAlpha: +(cumAlpha * 100).toFixed(2),
      monthlyAlpha: +(monthly * 100).toFixed(2),
      drawdown: +(dd * 100).toFixed(2),
    };
  });
})();

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Signal Dashboard','Security Rankings','Factor Analysis','Portfolio Construction','Backtesting Results','Signal Decay Analysis','Summary & Export'];

export default function TransitionAlphaSignalGeneratorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [signalWeights, setSignalWeights] = useState(() => SIGNAL_KEYS.map(() => 12.5));
  const [sectorFilter, setSectorFilter] = useState('All');
  const [signalThreshold, setSignalThreshold] = useState(40);
  const [backtestPeriod, setBacktestPeriod] = useState('5Y');
  const [longShortToggle, setLongShortToggle] = useState(false);
  const [mktCapMin, setMktCapMin] = useState(0);
  const [irMin, setIrMin] = useState(0);

  // Normalize signal weights
  const normWeights = useMemo(() => {
    const sum = signalWeights.reduce((s, w) => s + w, 0);
    return sum > 0 ? signalWeights.map(w => w / sum) : signalWeights.map(() => 1 / SIGNAL_KEYS.length);
  }, [signalWeights]);

  // Compute composite alpha for each security given current weights
  const scoredSecurities = useMemo(() => {
    return SECURITIES.map(s => {
      const signals = SIGNAL_KEYS.map(k => s[k]);
      const composite = signals.reduce((acc, v, i) => acc + normWeights[i] * v, 0);
      return { ...s, compositeAlpha: +composite.toFixed(2) };
    });
  }, [normWeights]);

  const filtered = useMemo(() => {
    return scoredSecurities.filter(s =>
      (sectorFilter === 'All' || s.sector === sectorFilter) &&
      s.compositeAlpha >= signalThreshold &&
      s.mktCap >= mktCapMin &&
      s.informationRatio >= irMin
    );
  }, [scoredSecurities, sectorFilter, signalThreshold, mktCapMin, irMin]);

  // Quartile splits
  const sorted = useMemo(() => [...scoredSecurities].sort((a, b) => b.compositeAlpha - a.compositeAlpha), [scoredSecurities]);
  const q1 = sorted.slice(0, Math.floor(sorted.length / 4));
  const q4 = sorted.slice(Math.floor(sorted.length * 3 / 4));

  // Alpha distribution histogram
  const alphaDist = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));
    scoredSecurities.forEach(s => {
      const b = Math.min(9, Math.floor(s.compositeAlpha / 10));
      bins[b].count += 1;
    });
    return bins;
  }, [scoredSecurities]);

  // IC-weighted composite
  const icTotalWeight = SIGNAL_IC.reduce((s, x) => s + x, 0);
  const icCompositeScore = useMemo(() => {
    if (!filtered.length) return 0;
    return filtered.reduce((sum, s) => {
      const ic_score = SIGNAL_KEYS.reduce((acc, k, i) => acc + (SIGNAL_IC[i] / (icTotalWeight || 1)) * s[k], 0);
      return sum + ic_score / filtered.length;
    }, 0);
  }, [filtered]);

  // Signal correlation matrix (8×8)
  const signalCorr = useMemo(() => {
    const n = 8;
    const m = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      m[i][i] = 1;
      for (let j = i + 1; j < n; j++) {
        const v = sr(i * 19 + j * 11 + 5) * 0.6 - 0.2;
        m[i][j] = v; m[j][i] = v;
      }
    }
    return m;
  }, []);

  // Long/short portfolio construction
  const longPortfolio = useMemo(() => {
    const tw = q1.reduce((s, x) => s + x.weight, 0);
    return q1.map(s => ({ ...s, portWeight: tw > 0 ? s.weight / tw : 0 }));
  }, [q1]);

  const shortPortfolio = useMemo(() => {
    const tw = q4.reduce((s, x) => s + x.weight, 0);
    return q4.map(s => ({ ...s, portWeight: tw > 0 ? -s.weight / tw : 0 }));
  }, [q4]);

  const lsPortfolio = useMemo(() => longShortToggle ? [...longPortfolio, ...shortPortfolio] : longPortfolio, [longShortToggle, longPortfolio, shortPortfolio]);

  const sectorTilts = useMemo(() => {
    return TA_SECTORS.map(sec => {
      const lw = lsPortfolio.filter(s => s.sector === sec).reduce((s, x) => s + x.portWeight, 0);
      const bw = SECURITIES.filter(s => s.sector === sec).length / SECURITIES.length;
      return { sector: sec.substring(0, 8), longWeight: +(lw * 100).toFixed(2), benchWeight: +(bw * 100).toFixed(2), active: +((lw - bw) * 100).toFixed(2) };
    });
  }, [lsPortfolio]);

  const btPeriods = { '1Y': 12, '3Y': 36, '5Y': 60 };
  const btSlice = BACKTEST_DATA.slice(Math.max(0, BACKTEST_DATA.length - (btPeriods[backtestPeriod] || 60)));

  const btMetrics = useMemo(() => {
    if (!btSlice.length) return { sharpe: 0, ir: 0, maxDd: 0, cumAlpha: 0 };
    const returns = btSlice.map(d => d.monthlyAlpha / 100);
    const mean = returns.reduce((s, x) => s + x, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (returns.length || 1));
    const sharpe = std > 0 ? mean / std * Math.sqrt(12) : 0;
    const maxDd = Math.min(...btSlice.map(d => d.drawdown));
    return {
      sharpe: +sharpe.toFixed(3),
      ir: +(sharpe * (sr(99) * 0.3 + 0.7)).toFixed(3),
      maxDd: +maxDd.toFixed(2),
      cumAlpha: btSlice.length > 0 ? btSlice[btSlice.length - 1].cumAlpha : 0,
    };
  }, [btSlice]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CZ6 · TRANSITION ALPHA SIGNAL GENERATOR</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Transition Alpha Signal Generator</h1>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>150 securities · 8 climate signals · IC-weighted composite · Signal decay analysis · Backtesting 2020–2025</div>
      </div>

      {/* Controls */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Sectors</option>
          {TA_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={{ fontSize: 12, color: T.muted }}>Signal Min: <strong style={{ color: T.text }}>{signalThreshold}</strong>
          <input type="range" min={0} max={90} value={signalThreshold} onChange={e => setSignalThreshold(+e.target.value)} style={{ marginLeft: 8, width: 90 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>Min IR: <strong style={{ color: T.text }}>{irMin.toFixed(2)}</strong>
          <input type="range" min={0} max={8} step={0.1} value={irMin * 10} onChange={e => setIrMin(+e.target.value / 10)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>Min Mkt Cap: <strong style={{ color: T.text }}>${mktCapMin}Bn</strong>
          <input type="range" min={0} max={100} value={mktCapMin} onChange={e => setMktCapMin(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <select value={backtestPeriod} onChange={e => setBacktestPeriod(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="1Y">1Y</option>
          <option value="3Y">3Y</option>
          <option value="5Y">5Y</option>
        </select>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={longShortToggle} onChange={e => setLongShortToggle(e.target.checked)} />
          Long/Short Mode
        </label>
      </div>

      {/* Signal weight sliders */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '10px 32px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {SIGNAL_NAMES.map((name, i) => (
          <label key={name} style={{ fontSize: 11, color: T.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontWeight: 600, color: SIGNAL_COLORS[i], fontSize: 10 }}>{name.substring(0, 10)}</span>
            <span>{signalWeights[i].toFixed(0)}</span>
            <input type="range" min={0} max={100} value={signalWeights[i]} onChange={e => setSignalWeights(prev => prev.map((w, j) => j === i ? +e.target.value : w))} style={{ width: 70 }} />
            <span style={{ fontSize: 9, color: T.muted }}>{(normWeights[i] * 100).toFixed(1)}% norm</span>
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

        {/* TAB 0: Signal Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Top Quartile Avg" value={q1.length ? (q1.reduce((s, x) => s + x.compositeAlpha, 0) / q1.length).toFixed(1) : 0} sub="Composite score" color={T.green} />
              <KpiCard label="Bottom Quartile Avg" value={q4.length ? (q4.reduce((s, x) => s + x.compositeAlpha, 0) / q4.length).toFixed(1) : 0} sub="Composite score" color={T.red} />
              <KpiCard label="Active Securities" value={filtered.length} sub={`of 150 universe`} color={T.indigo} />
              <KpiCard label="IC-Wtd Score" value={icCompositeScore.toFixed(2)} sub="IC-weighted composite" color={T.teal} />
              <KpiCard label="Avg IR" value={filtered.length ? (filtered.reduce((s, x) => s + x.informationRatio, 0) / filtered.length).toFixed(3) : 0} sub="Information ratio" color={T.purple} />
              <KpiCard label="Best Signal" value={SIGNAL_NAMES[SIGNAL_IC.indexOf(Math.max(...SIGNAL_IC))].substring(0, 12)} sub={`IC: ${Math.max(...SIGNAL_IC).toFixed(4)}`} color={T.gold} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Composite Alpha Score Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={alphaDist} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} securities`, 'Count']} />
                    <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Signal Weights (Normalized)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={SIGNAL_NAMES.map((n, i) => ({ signal: n.substring(0, 10), weight: +(normWeights[i] * 100).toFixed(1), ic: +(SIGNAL_IC[i] * 100).toFixed(2) }))} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                    <YAxis type="category" dataKey="signal" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="weight" fill={T.indigo} name="User Weight %" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="ic" fill={T.teal} name="IC×100" radius={[0, 4, 4, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Security Rankings */}
        {activeTab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>All 150 Securities — Ranked by Composite Alpha</h3>
              <div style={{ overflowX: 'auto', maxHeight: 540, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub, position: 'sticky', top: 0 }}>
                      {['#','Name','Sector','Country','Composite','C.Eff','GRG','CapEx','Reg Risk','PhysRisk','Engage','Disclose','SC Risk','6M Mom','IR'].map(h => (
                        <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...scoredSecurities].sort((a, b) => b.compositeAlpha - a.compositeAlpha).map((s, i) => (
                      <tr key={s.id} style={{ background: i < 37 ? '#dcfce740' : i >= 112 ? '#fee2e240' : (i % 2 === 0 ? T.card : T.sub) }}>
                        <td style={{ padding: '5px 8px', color: T.muted, fontSize: 10 }}>{i + 1}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{s.name}</td>
                        <td style={{ padding: '5px 8px', color: T.muted, fontSize: 9 }}>{s.sector}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.country}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: s.compositeAlpha >= 75 ? T.green : s.compositeAlpha <= 30 ? T.red : T.text }}>{s.compositeAlpha.toFixed(1)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.carbonEff.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.greenRevGrowth.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.capexAlign.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: s.regulatoryRisk > 70 ? T.red : T.text }}>{s.regulatoryRisk.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.physRiskMgmt.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.engagementScore.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.disclosureQuality.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.supplyChainRisk.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: s.momentum6M >= 0 ? T.green : T.red }}>
                          {s.momentum6M >= 0 ? '+' : ''}{s.momentum6M.toFixed(1)}
                        </td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: s.informationRatio >= 0.5 ? T.green : T.muted }}>{s.informationRatio.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Factor Analysis */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {SIGNAL_KEYS.map((k, i) => (
                <div key={k} style={{ background: T.card, border: `1px solid ${SIGNAL_COLORS[i]}`, borderRadius: 8, padding: '10px 14px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: SIGNAL_COLORS[i], fontWeight: 700 }}>{SIGNAL_NAMES[i]}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>IC: {SIGNAL_IC[i].toFixed(4)}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>HL: {SIGNAL_HALF_LIFE[i]}mo</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Information Coefficient by Signal</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={SIGNAL_NAMES.map((n, i) => ({ signal: n.substring(0, 10), ic: SIGNAL_IC[i] }))} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="signal" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [v.toFixed(4), 'IC']} />
                    <Bar dataKey="ic" fill={T.indigo} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>8×8 Signal Correlation Heatmap</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
                    <thead><tr>
                      <td></td>
                      {SIGNAL_NAMES.map((n, i) => <td key={i} style={{ padding: '3px 5px', fontWeight: 700, color: T.muted, textAlign: 'center', fontSize: 8 }}>{n.substring(0, 4)}</td>)}
                    </tr></thead>
                    <tbody>
                      {SIGNAL_NAMES.map((rowN, i) => (
                        <tr key={i}>
                          <td style={{ padding: '3px 5px', fontWeight: 700, color: T.muted, fontSize: 8, whiteSpace: 'nowrap' }}>{rowN.substring(0, 5)}</td>
                          {SIGNAL_NAMES.map((colN, j) => {
                            const v = signalCorr[i][j];
                            const bg = v >= 0 ? `rgba(79,70,229,${0.1 + Math.abs(v) * 0.7})` : `rgba(220,38,38,${0.1 + Math.abs(v) * 0.7})`;
                            return <td key={j} style={{ padding: '5px', textAlign: 'center', background: bg, color: Math.abs(v) > 0.5 ? '#fff' : T.text, fontWeight: 600, border: `1px solid ${T.border}`, minWidth: 38 }}>{v.toFixed(2)}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Portfolio Construction */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Long Portfolio" value={longPortfolio.length} sub="Top quartile" color={T.green} />
              <KpiCard label="Short Portfolio" value={shortPortfolio.length} sub="Bottom quartile" color={T.red} />
              <KpiCard label="Avg Long Alpha" value={longPortfolio.length ? (longPortfolio.reduce((s, x) => s + x.compositeAlpha, 0) / longPortfolio.length).toFixed(1) : 0} color={T.green} />
              <KpiCard label="Avg Short Alpha" value={shortPortfolio.length ? (shortPortfolio.reduce((s, x) => s + x.compositeAlpha, 0) / shortPortfolio.length).toFixed(1) : 0} color={T.red} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector Tilts ({longShortToggle ? 'L/S' : 'Long Only'})</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorTilts} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="longWeight" fill={T.indigo} name="Signal Portfolio %" />
                    <Bar dataKey="benchWeight" fill={T.muted} name="Benchmark %" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Active Sector Tilts (Signal - Benchmark)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorTilts} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v > 0 ? '+' : ''}${v}%`, 'Active Tilt']} />
                    <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                    <Bar dataKey="active" fill={T.teal} radius={[4, 4, 0, 0]} name="Active Weight %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Backtesting Results */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Sharpe Ratio" value={btMetrics.sharpe} sub={`${backtestPeriod} period`} color={btMetrics.sharpe > 0.5 ? T.green : T.amber} />
              <KpiCard label="Information Ratio" value={btMetrics.ir} color={btMetrics.ir > 0.4 ? T.green : T.amber} />
              <KpiCard label="Max Drawdown" value={`${btMetrics.maxDd}%`} color={btMetrics.maxDd > -5 ? T.green : T.red} />
              <KpiCard label="Cumulative Alpha" value={`${btMetrics.cumAlpha}%`} sub={`over ${backtestPeriod}`} color={btMetrics.cumAlpha > 0 ? T.green : T.red} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Cumulative Alpha — {backtestPeriod}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={btSlice} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 8 }} interval={Math.floor(btSlice.length / 8)} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cumAlpha" fill={`${T.indigo}20`} stroke={T.indigo} strokeWidth={2.5} name="Cum Alpha %" fillOpacity={1} />
                  <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Drawdown</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={btSlice} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 8 }} interval={Math.floor(btSlice.length / 8)} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v.toFixed(2)}%`, 'Drawdown']} />
                  <Bar dataKey="drawdown" fill={T.red} opacity={0.7} name="Drawdown %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 5: Signal Decay Analysis */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Shortest Half-Life" value={`${Math.min(...SIGNAL_HALF_LIFE)}mo`} sub={SIGNAL_NAMES[SIGNAL_HALF_LIFE.indexOf(Math.min(...SIGNAL_HALF_LIFE))].substring(0, 12)} color={T.red} />
              <KpiCard label="Longest Half-Life" value={`${Math.max(...SIGNAL_HALF_LIFE)}mo`} sub={SIGNAL_NAMES[SIGNAL_HALF_LIFE.indexOf(Math.max(...SIGNAL_HALF_LIFE))].substring(0, 12)} color={T.green} />
              <KpiCard label="Avg Half-Life" value={`${(SIGNAL_HALF_LIFE.reduce((s, x) => s + x, 0) / SIGNAL_HALF_LIFE.length).toFixed(1)}mo`} color={T.teal} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>IC Decay Curves — All 8 Signals (24 months)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" type="number" domain={[1, 24]} tick={{ fontSize: 10 }} label={{ value: 'Months', position: 'insideBottom', offset: -5, fontSize: 10 }} allowDuplicatedCategory={false} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {SIGNAL_NAMES.map((name, i) => (
                    <Line key={name} data={DECAY_CURVES[i]} type="monotone" dataKey="ic" stroke={SIGNAL_COLORS[i]} strokeWidth={1.5} name={name.substring(0, 10)} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Signal Decay Summary Table</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Signal','Initial IC','6M IC','12M IC','24M IC','Half-Life (mo)','Recommended Rebalance'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {SIGNAL_NAMES.map((name, i) => {
                    const hl = SIGNAL_HALF_LIFE[i];
                    const ic0 = SIGNAL_IC[i];
                    const ic6 = +(ic0 * Math.pow(0.5, 6 / hl)).toFixed(4);
                    const ic12 = +(ic0 * Math.pow(0.5, 12 / hl)).toFixed(4);
                    const ic24 = +(ic0 * Math.pow(0.5, 24 / hl)).toFixed(4);
                    const rebFreq = hl <= 6 ? 'Monthly' : hl <= 12 ? 'Quarterly' : 'Semi-Annual';
                    return (
                      <tr key={name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: SIGNAL_COLORS[i] }}>{name}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>{ic0.toFixed(4)}</td>
                        <td style={{ padding: '8px 12px' }}>{ic6}</td>
                        <td style={{ padding: '8px 12px' }}>{ic12}</td>
                        <td style={{ padding: '8px 12px', color: T.muted }}>{ic24}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: hl <= 6 ? T.red : hl <= 12 ? T.amber : T.green }}>{hl}</td>
                        <td style={{ padding: '8px 12px' }}><span style={{ background: hl <= 6 ? T.red : hl <= 12 ? T.amber : T.green, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{rebFreq}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Transition Alpha Signal Generator — Full Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Metric','Value','Benchmark/Target','Status','Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    ['Universe Coverage', `${filtered.length}/150`, '>50', filtered.length >= 50 ? 'PASS' : 'FAIL'],
                    ['Backtest Sharpe', `${btMetrics.sharpe}`, '>0.5', btMetrics.sharpe > 0.5 ? 'PASS' : 'FAIL'],
                    ['Information Ratio', `${btMetrics.ir}`, '>0.4', btMetrics.ir > 0.4 ? 'PASS' : 'FAIL'],
                    ['Max Drawdown', `${btMetrics.maxDd}%`, '>-5%', btMetrics.maxDd > -5 ? 'PASS' : 'FAIL'],
                    ['Cumulative Alpha', `${btMetrics.cumAlpha}%`, '>0%', btMetrics.cumAlpha > 0 ? 'PASS' : 'FAIL'],
                    ['Top IC Signal', `${SIGNAL_NAMES[SIGNAL_IC.indexOf(Math.max(...SIGNAL_IC))]}`, 'IC>0.1', Math.max(...SIGNAL_IC) > 0.1 ? 'PASS' : 'WARN'],
                    ['Avg Signal HL', `${(SIGNAL_HALF_LIFE.reduce((s, x) => s + x, 0) / SIGNAL_HALF_LIFE.length).toFixed(1)}mo`, '>6mo', SIGNAL_HALF_LIFE.reduce((s, x) => s + x, 0) / SIGNAL_HALF_LIFE.length > 6 ? 'PASS' : 'WARN'],
                    ['IC-Weighted Score', `${icCompositeScore.toFixed(2)}`, '>50', icCompositeScore > 50 ? 'PASS' : 'FAIL'],
                  ].map(([m, v, t, s], i) => (
                    <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{v}</td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{t}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: s === 'PASS' ? T.green : s === 'FAIL' ? T.red : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{s}</span></td>
                      <td style={{ padding: '8px 12px', color: T.muted, fontSize: 11 }}>Fama-French 3-factor alpha</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Top 50 Securities — Signal Portfolio Export</h3>
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.sub }}>
                    {['#','Name','Sector','Composite','CE','GRG','CA','RR','PM','ES','DQ','SC','6M Mom','BT Ret','T-Stat','IR'].map(h => (
                      <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...scoredSecurities].sort((a, b) => b.compositeAlpha - a.compositeAlpha).slice(0, 50).map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 8px', color: T.muted, fontSize: 10 }}>{i + 1}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{s.name}</td>
                        <td style={{ padding: '5px 8px', color: T.muted, fontSize: 9 }}>{s.sector}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: T.green }}>{s.compositeAlpha.toFixed(1)}</td>
                        {[s.carbonEff, s.greenRevGrowth, s.capexAlign, s.regulatoryRisk, s.physRiskMgmt, s.engagementScore, s.disclosureQuality, s.supplyChainRisk].map((v, si) => (
                          <td key={si} style={{ padding: '5px 8px', fontSize: 10 }}>{v.toFixed(0)}</td>
                        ))}
                        <td style={{ padding: '5px 8px', fontSize: 10, color: s.momentum6M >= 0 ? T.green : T.red }}>{s.momentum6M >= 0 ? '+' : ''}{s.momentum6M.toFixed(1)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: s.backtestedReturn >= 0 ? T.green : T.red }}>{(s.backtestedReturn * 100).toFixed(2)}%</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{s.tStatistic.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: s.informationRatio >= 0.5 ? T.green : T.muted }}>{s.informationRatio.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Sector alpha scores */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector-Level Alpha Statistics</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Sector','# Securities','Avg Alpha','Max Alpha','Min Alpha','Avg IR','Avg BT Return %','Avg T-Stat','Avg Momentum'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TA_SECTORS.map((sec, i) => {
                    const sh = scoredSecurities.filter(s => s.sector === sec);
                    if (!sh.length) return null;
                    const avgA = sh.reduce((s, x) => s + x.compositeAlpha, 0) / sh.length;
                    const maxA = Math.max(...sh.map(x => x.compositeAlpha));
                    const minA = Math.min(...sh.map(x => x.compositeAlpha));
                    const avgIR2 = sh.reduce((s, x) => s + x.informationRatio, 0) / sh.length;
                    const avgBT = sh.reduce((s, x) => s + x.backtestedReturn, 0) / sh.length * 100;
                    const avgT = sh.reduce((s, x) => s + x.tStatistic, 0) / sh.length;
                    const avgMom = sh.reduce((s, x) => s + x.momentum6M, 0) / sh.length;
                    return (
                      <tr key={sec} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec}</td>
                        <td style={{ padding: '6px 10px' }}>{sh.length}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: avgA >= 60 ? T.green : avgA <= 40 ? T.red : T.text }}>{avgA.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{maxA.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: T.red }}>{minA.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: avgIR2 >= 0.5 ? T.green : T.muted }}>{avgIR2.toFixed(3)}</td>
                        <td style={{ padding: '6px 10px', color: avgBT >= 0 ? T.green : T.red }}>{avgBT >= 0 ? '+' : ''}{avgBT.toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px' }}>{avgT.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: avgMom >= 0 ? T.green : T.red }}>{avgMom >= 0 ? '+' : ''}{avgMom.toFixed(1)}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
            {/* Momentum distribution */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>6-Month Alpha Momentum Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Array.from({ length: 10 }, (_, i) => ({
                  range: `${(-50 + i * 10).toFixed(0)} to ${(-40 + i * 10).toFixed(0)}`,
                  count: scoredSecurities.filter(s => s.momentum6M >= -50 + i * 10 && s.momentum6M < -40 + i * 10).length,
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} securities`, 'Count']} />
                  <ReferenceLine x="0 to 10" stroke={T.green} strokeDasharray="5 5" />
                  <Bar dataKey="count" fill={T.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* T-stat vs IR scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>T-Statistic vs Information Ratio — Signal Strength</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="T-Statistic" tick={{ fontSize: 10 }} label={{ value: 'T-Statistic', position: 'insideBottom', offset: -5, fontSize: 10 }} domain={[0.5, 3.5]} />
                  <YAxis dataKey="y" name="Info Ratio" tick={{ fontSize: 10 }} label={{ value: 'IR', angle: -90, position: 'insideLeft', fontSize: 10 }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v.toFixed(3), n]} />
                  <ReferenceLine x={2} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'T>2', fontSize: 9, fill: T.amber }} />
                  <ReferenceLine y={0.5} stroke={T.green} strokeDasharray="5 5" label={{ value: 'IR>0.5', fontSize: 9, fill: T.green }} />
                  <Scatter data={scoredSecurities.slice(0, 100).map(s => ({ x: +s.tStatistic.toFixed(3), y: +s.informationRatio.toFixed(3) }))} fill={T.indigo} opacity={0.6} name="Securities" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Signal weight sensitivity */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Signal Weight Sensitivity — Portfolio Alpha Impact</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Signal','Current Weight','IC','Half-Life (mo)','Alpha Contribution','If Weight +10%','If Weight -10%','Recommendation'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIGNAL_NAMES.map((name, i) => {
                    const w = normWeights[i];
                    const ic = SIGNAL_IC[i];
                    const hl = SIGNAL_HALF_LIFE[i];
                    const contrib = filtered.length > 0 ? w * filtered.reduce((s, x) => s + x[SIGNAL_KEYS[i]], 0) / filtered.length : 0;
                    const plus10 = contrib * (1 + 0.1 / (w || 0.001));
                    const minus10 = contrib * (1 - 0.1 / (w || 0.001));
                    const rec = ic >= 0.12 && hl >= 12 ? 'Increase' : ic <= 0.05 || hl <= 4 ? 'Decrease' : 'Hold';
                    return (
                      <tr key={name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: SIGNAL_COLORS[i] }}>{name}</td>
                        <td style={{ padding: '6px 10px' }}>{(w * 100).toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: ic >= 0.1 ? T.green : ic <= 0.05 ? T.red : T.text }}>{ic.toFixed(4)}</td>
                        <td style={{ padding: '6px 10px', color: hl <= 6 ? T.red : hl >= 12 ? T.green : T.amber }}>{hl}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{contrib.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{plus10.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: T.red }}>{minus10.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}><span style={{ background: rec === 'Increase' ? T.green : rec === 'Decrease' ? T.red : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{rec}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom panel */}
        {activeTab !== 6 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Signal IC Summary</div>
              {SIGNAL_NAMES.map((name, i) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: SIGNAL_COLORS[i], fontWeight: 600 }}>{name.substring(0, 12)}</span>
                  <span>IC: {SIGNAL_IC[i].toFixed(4)} | HL: {SIGNAL_HALF_LIFE[i]}mo</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Portfolio Stats</div>
              {[
                ['Universe', '150 securities'],
                ['Filtered', `${filtered.length} securities`],
                ['Top Quartile', `${q1.length} securities`],
                ['Bottom Quartile', `${q4.length} securities`],
                ['L/S Mode', longShortToggle ? 'On' : 'Off'],
                ['Backtest Period', backtestPeriod],
                ['Sector Filter', sectorFilter],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Backtesting Performance ({backtestPeriod})</div>
              {[
                ['Sharpe Ratio', btMetrics.sharpe, btMetrics.sharpe > 0.5],
                ['Information Ratio', btMetrics.ir, btMetrics.ir > 0.4],
                ['Max Drawdown', `${btMetrics.maxDd}%`, btMetrics.maxDd > -5],
                ['Cum Alpha', `${btMetrics.cumAlpha}%`, btMetrics.cumAlpha > 0],
                ['Avg Monthly Alpha', `${btSlice.length ? (btSlice.reduce((s, d) => s + d.monthlyAlpha, 0) / btSlice.length).toFixed(3) : 0}%`, true],
              ].map(([l, v, ok]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600, color: ok ? T.green : T.amber }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IC×IR quadrant table */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>IC × Information Ratio Quadrant Classification</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'High IC + High IR (Best)', desc: 'Highest conviction signals', condition: (s) => s.informationRatio >= 0.5 && SIGNAL_IC.some((ic, i) => ic >= 0.1 && s[SIGNAL_KEYS[i]] >= 60), color: T.green },
                { label: 'High IC + Low IR (Mixed)', desc: 'Strong signal but low consistency', condition: (s) => s.informationRatio < 0.5 && s.compositeAlpha >= 60, color: T.amber },
                { label: 'Low IC + High IR (Consistent)', desc: 'Weak signal but persistent', condition: (s) => s.informationRatio >= 0.5 && s.compositeAlpha < 60, color: T.blue },
                { label: 'Low IC + Low IR (Avoid)', desc: 'Noise, low conviction', condition: (s) => s.informationRatio < 0.5 && s.compositeAlpha < 60, color: T.red },
              ].map(q => {
                const matching = scoredSecurities.filter(q.condition);
                return (
                  <div key={q.label} style={{ background: T.sub, borderRadius: 8, padding: 14, borderLeft: `4px solid ${q.color}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: q.color, marginBottom: 4 }}>{q.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{q.desc}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: q.color }}>{matching.length}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>securities ({(matching.length / SECURITIES.length * 100).toFixed(1)}%)</div>
                    {matching.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 10, color: T.muted }}>
                        Avg Alpha: {(matching.reduce((s, x) => s + x.compositeAlpha, 0) / matching.length).toFixed(1)} |
                        Avg IR: {(matching.reduce((s, x) => s + x.informationRatio, 0) / matching.length).toFixed(3)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alpha score vs backtested return scatter */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Composite Alpha Score vs Backtested Return — Predictive Validity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Alpha Score" tick={{ fontSize: 10 }} label={{ value: 'Composite Alpha Score', position: 'insideBottom', offset: -5, fontSize: 10 }} domain={[0, 100]} />
                <YAxis dataKey="y" name="BT Return %" tick={{ fontSize: 10 }} label={{ value: 'BT Return %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v.toFixed(3), n]} />
                <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                <ReferenceLine x={signalThreshold} stroke={T.indigo} strokeDasharray="5 5" label={{ value: 'Min', fontSize: 9, fill: T.indigo }} />
                <Scatter data={scoredSecurities.slice(0, 100).map(s => ({ x: +s.compositeAlpha.toFixed(1), y: +(s.backtestedReturn * 100).toFixed(3) }))} fill={T.teal} opacity={0.6} name="Securities" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sector alpha momentum table */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Signal Effectiveness by Sector — Top 3 Signals</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','Best Signal','Best IC','2nd Signal','2nd IC','3rd Signal','3rd IC','Sector Alpha','Recommendation'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TA_SECTORS.map((sec, i) => {
                  const sh = scoredSecurities.filter(s => s.sector === sec);
                  if (!sh.length) return null;
                  const signalCorrs = SIGNAL_KEYS.map((k, si) => ({
                    name: SIGNAL_NAMES[si], key: k, ic: SIGNAL_IC[si],
                    avgVal: sh.reduce((s, x) => s + x[k], 0) / sh.length,
                  })).sort((a, b) => b.ic - a.ic);
                  const avgAlpha = sh.reduce((s, x) => s + x.compositeAlpha, 0) / sh.length;
                  return (
                    <tr key={sec} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec}</td>
                      <td style={{ padding: '6px 10px', color: T.green, fontSize: 10 }}>{signalCorrs[0]?.name.substring(0, 10)}</td>
                      <td style={{ padding: '6px 10px', color: T.green }}>{signalCorrs[0]?.ic.toFixed(4)}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10 }}>{signalCorrs[1]?.name.substring(0, 10)}</td>
                      <td style={{ padding: '6px 10px' }}>{signalCorrs[1]?.ic.toFixed(4)}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10, color: T.muted }}>{signalCorrs[2]?.name.substring(0, 10)}</td>
                      <td style={{ padding: '6px 10px', color: T.muted }}>{signalCorrs[2]?.ic.toFixed(4)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: avgAlpha >= 60 ? T.green : avgAlpha <= 40 ? T.red : T.text }}>{avgAlpha.toFixed(1)}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: avgAlpha >= 60 ? T.green : avgAlpha >= 50 ? T.amber : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{avgAlpha >= 60 ? 'Overweight' : avgAlpha >= 50 ? 'Neutral' : 'Underweight'}</span></td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Fama-French 3-Factor Alpha Decomposition — Climate Signal Residual Analysis</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Signal', 'Raw IC', 'Mkt-Adj α', 'SMB Load', 'HML Load', 'Momentum Load', 'Residual α', 'Adj R²', 'Contribution'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.text, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIGNAL_NAMES.map((sig, si) => {
                  const rawIC = SIGNAL_IC[si];
                  const mktAdj = +(rawIC * (0.6 + sr(si * 7 + 3) * 0.3)).toFixed(4);
                  const smb = +(sr(si * 11 + 7) * 0.4 - 0.2).toFixed(3);
                  const hml = +(sr(si * 13 + 11) * 0.4 - 0.2).toFixed(3);
                  const mom = +(sr(si * 17 + 13) * 0.3 - 0.1).toFixed(3);
                  const resid = +(mktAdj - smb * 0.1 - hml * 0.1).toFixed(4);
                  const r2 = +(sr(si * 9 + 19) * 0.5 + 0.3).toFixed(3);
                  const contrib = resid > 0.01 ? 'Positive' : resid < -0.005 ? 'Drag' : 'Neutral';
                  return (
                    <tr key={sig} style={{ background: si % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 10 }}>{sig}</td>
                      <td style={{ padding: '6px 10px', color: rawIC > 0.1 ? T.green : T.amber }}>{rawIC.toFixed(4)}</td>
                      <td style={{ padding: '6px 10px', color: mktAdj > 0 ? T.green : T.red, fontWeight: 600 }}>{mktAdj.toFixed(4)}</td>
                      <td style={{ padding: '6px 10px', color: smb >= 0 ? T.text : T.muted }}>{smb.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', color: hml >= 0 ? T.text : T.muted }}>{hml.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px' }}>{mom.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px', color: resid > 0 ? T.green : T.red, fontWeight: 700 }}>{resid.toFixed(4)}</td>
                      <td style={{ padding: '6px 10px' }}>{r2.toFixed(3)}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: contrib === 'Positive' ? T.green : contrib === 'Drag' ? T.red : T.muted, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{contrib}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>Signal Decay Half-Life Sensitivity — IC Retention by Horizon</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[1, 3, 6, 12].map((horizon, hi) => {
                const retentions = SIGNAL_NAMES.map((_, si) => {
                  const hl = SIGNAL_HALF_LIFE[si];
                  return hl > 0 ? SIGNAL_IC[si] * Math.pow(0.5, horizon / hl) : 0;
                });
                const avgRet = retentions.length > 0 ? retentions.reduce((a, b) => a + b, 0) / retentions.length : 0;
                const best = SIGNAL_NAMES[retentions.indexOf(Math.max(...retentions))];
                const worst = SIGNAL_NAMES[retentions.indexOf(Math.min(...retentions))];
                return (
                  <div key={horizon} style={{ background: T.sub, borderRadius: 8, padding: 14, borderTop: `3px solid ${T.purple}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>T+{horizon}M</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.purple, marginTop: 4 }}>{(avgRet * 100).toFixed(2)}%</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Avg IC Retained</div>
                    <div style={{ fontSize: 10, color: T.green, marginTop: 6 }}>Best: {best.substring(0, 12)}</div>
                    <div style={{ fontSize: 10, color: T.red }}>Worst: {worst.substring(0, 12)}</div>
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
