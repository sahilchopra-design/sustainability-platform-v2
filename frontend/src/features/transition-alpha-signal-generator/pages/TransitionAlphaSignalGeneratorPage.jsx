import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, Area, AreaChart,
  ComposedChart, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

function sr(seed) { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; }; }

const TABS = ['Signal Dashboard', 'Factor Model', 'Backtesting', 'Alpha Attribution', 'Signal Decay'];

const FACTORS = [
  { name: 'Carbon Momentum', desc: 'YoY carbon reduction leaders' },
  { name: 'Green CapEx Ratio', desc: 'R&D + green capex / total' },
  { name: 'Policy Sensitivity', desc: 'Regulatory beta exposure' },
  { name: 'Tech Adoption Score', desc: 'Clean tech adoption rate' },
  { name: 'Stranded Asset Exp.', desc: 'Inverse stranded asset risk' },
  { name: 'Engagement Quality', desc: 'Shareholder engagement score' },
];

const FF5 = ['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA'];
const SECTORS = ['Energy', 'Utilities', 'Industrials', 'Materials', 'Financials', 'Tech', 'Healthcare', 'Consumer'];
const GEOS = ['North America', 'Europe', 'Asia Pacific', 'Emerging Markets', 'UK & Ireland'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOLDING = ['1W', '2W', '1M', '2M', '3M', '6M', '12M'];

/* ── seed data generators ── */
function genSignals(r) {
  const signals = ['Strong Buy', 'Buy', 'Neutral', 'Sell'];
  return FACTORS.map(f => ({
    ...f,
    signal: signals[Math.floor(r() * 3.2)],
    zScore: +(r() * 3.2 - 0.8).toFixed(2),
    ret3m: +((r() - 0.35) * 8).toFixed(2),
    weight: +(8 + r() * 22).toFixed(1),
  }));
}

function genRegressionTable(r) {
  return [...FACTORS.map(f => f.name), ...FF5].map(name => {
    const coef = +((r() - 0.3) * 0.08).toFixed(4);
    const tStat = +(coef / (0.01 + r() * 0.02)).toFixed(2);
    return { name, coef, tStat, pVal: +(r() * 0.12).toFixed(4) };
  });
}

function genCorrelation(r) {
  const names = FACTORS.map(f => f.name);
  return names.map((row, i) => {
    const obj = { factor: row };
    names.forEach((col, j) => {
      obj[col] = i === j ? 1.0 : +((r() - 0.3) * 0.7).toFixed(2);
    });
    return obj;
  });
}

function genCumReturns(r) {
  let strat = 100, bench = 100;
  return Array.from({ length: 36 }, (_, i) => {
    strat *= 1 + (r() - 0.42) * 0.06;
    bench *= 1 + (r() - 0.45) * 0.04;
    return { month: `M${i + 1}`, strategy: +(strat - 100).toFixed(2), benchmark: +(bench - 100).toFixed(2) };
  });
}

function genMonthlyReturns(r) {
  return [2024, 2025, 2026].map(yr => {
    const row = { year: yr };
    MONTHS.forEach(m => { row[m] = +((r() - 0.42) * 6).toFixed(2); });
    return row;
  });
}

function genDrawdown(r) {
  let dd = 0;
  return Array.from({ length: 36 }, (_, i) => {
    dd = Math.min(0, dd + (r() - 0.55) * 2.5);
    if (r() > 0.85) dd = dd * 0.5;
    return { month: `M${i + 1}`, drawdown: +dd.toFixed(2) };
  });
}

function genRollingSharpe(r) {
  let sh = 0.7;
  return Array.from({ length: 30 }, (_, i) => {
    sh += (r() - 0.48) * 0.3;
    sh = Math.max(-0.2, Math.min(2.5, sh));
    return { month: `M${i + 7}`, sharpe: +sh.toFixed(2) };
  });
}

function genAlphaDecomp(r) {
  return MONTHS.map(m => {
    const obj = { month: m };
    FACTORS.forEach(f => { obj[f.name] = +((r() - 0.35) * 2).toFixed(2); });
    return obj;
  });
}

function genTopAlpha(r, n, isLong) {
  const names = isLong
    ? ['Vestas Wind', 'Orsted', 'NextEra Energy', 'Schneider Electric', 'Iberdrola', 'Enel', 'Plug Power', 'Enphase', 'First Solar', 'SolarEdge']
    : ['ExxonMobil', 'Chevron', 'BP', 'Shell', 'ConocoPhillips', 'TotalEnergies', 'Marathon Oil', 'Valero', 'Phillips 66', 'Peabody Energy'];
  return names.slice(0, n).map(name => ({
    name,
    alpha: +((isLong ? 0.5 : -0.3) + (r() - 0.4) * 3).toFixed(2),
    sector: SECTORS[Math.floor(r() * SECTORS.length)],
    weight: +(1 + r() * 4).toFixed(1),
  }));
}

function genSectorAlpha(r) {
  return SECTORS.map(s => ({ sector: s, alpha: +((r() - 0.4) * 3).toFixed(2) }));
}

function genGeoAlpha(r) {
  return GEOS.map(g => ({ geo: g, alpha: +((r() - 0.35) * 2.5).toFixed(2) }));
}

function genWaterfall(r) {
  let cum = 0;
  const items = FACTORS.map(f => {
    const v = +((r() - 0.3) * 1.5).toFixed(2);
    cum += v;
    return { name: f.name, value: v, cumulative: +cum.toFixed(2) };
  });
  items.push({ name: 'Total Alpha', value: +cum.toFixed(2), cumulative: +cum.toFixed(2), isTotal: true });
  return items;
}

function genICDecay(r) {
  return HOLDING.map((h, i) => {
    const obj = { period: h };
    FACTORS.forEach(f => {
      const base = 0.08 + r() * 0.12;
      obj[f.name] = +(base * Math.exp(-0.25 * i)).toFixed(3);
    });
    return obj;
  });
}

function genHalfLife(r) {
  return FACTORS.map(f => ({
    name: f.name, halfLife: +(2 + r() * 10).toFixed(1) + ' weeks',
    optRebal: ['Weekly', 'Bi-weekly', 'Monthly', 'Monthly', 'Bi-weekly', 'Weekly'][Math.floor(r() * 5)],
  }));
}

function genAutocorr(r) {
  return Array.from({ length: 12 }, (_, i) => {
    const obj = { lag: `Lag ${i + 1}` };
    FACTORS.forEach(f => { obj[f.name] = +(Math.exp(-0.15 * (i + 1)) * (0.7 + r() * 0.3)).toFixed(3); });
    return obj;
  });
}

function genTurnoverAlpha(r) {
  return Array.from({ length: 20 }, () => ({
    turnover: +(5 + r() * 55).toFixed(1),
    alpha: +(r() * 4 - 0.5 - (r() > 0.7 ? r() * 2 : 0)).toFixed(2),
  }));
}

function genFactorPerf(r) {
  return Array.from({ length: 12 }, (_, i) => {
    const obj = { month: MONTHS[i] };
    FACTORS.forEach(f => { obj[f.name] = +((r() - 0.4) * 4).toFixed(2); });
    return obj;
  });
}

/* ── style helpers ── */
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 12 };
const hdr = { fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10, letterSpacing: '-0.01em' };
const subhdr = { fontFamily: T.mono, fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };
const tbl = { width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 };
const th = { padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.navy}`, color: T.navy, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' };
const td = { padding: '5px 8px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontSize: 11 };

function sigColor(s) { return s === 'Strong Buy' ? T.green : s === 'Buy' ? T.teal : s === 'Sell' ? T.red : T.textMut; }
function retColor(v) { return v >= 0 ? T.green : T.red; }
function pColor(p) { return p < 0.01 ? T.green : p < 0.05 ? T.amber : T.red; }
function heatColor(v) {
  if (v > 2) return '#dcfce7';
  if (v > 0) return '#f0fdf4';
  if (v > -2) return '#fef2f2';
  return '#fecaca';
}

const FACTOR_COLORS = [T.navy, T.gold, T.teal, T.blue, T.purple, T.amber];

/* ── KPI card ── */
function KPI({ label, value, sub, color }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 130, textAlign: 'center' }}>
      <div style={subhdr}>{label}</div>
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: color || T.navy }}>{value}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ══════════ MAIN COMPONENT ══════════ */
export default function TransitionAlphaSignalGeneratorPage() {
  const [tab, setTab] = useState(0);
  const r = sr(42);
  const signals = genSignals(r);
  const regression = genRegressionTable(sr(99));
  const corr = genCorrelation(sr(77));
  const cumRet = genCumReturns(sr(55));
  const monthly = genMonthlyReturns(sr(33));
  const drawdown = genDrawdown(sr(44));
  const rollSharpe = genRollingSharpe(sr(66));
  const alphaDecomp = genAlphaDecomp(sr(88));
  const topLong = genTopAlpha(sr(11), 10, true);
  const topShort = genTopAlpha(sr(22), 10, false);
  const sectorAlpha = genSectorAlpha(sr(13));
  const geoAlpha = genGeoAlpha(sr(14));
  const waterfall = genWaterfall(sr(15));
  const icDecay = genICDecay(sr(16));
  const halfLife = genHalfLife(sr(17));
  const autocorr = genAutocorr(sr(18));
  const turnoverAlpha = genTurnoverAlpha(sr(19));
  const factorPerf = genFactorPerf(sr(20));

  const perfMetrics = [
    { metric: 'Annualized Return', strategy: '11.4%', benchmark: '7.2%' },
    { metric: 'Volatility', strategy: '9.8%', benchmark: '12.1%' },
    { metric: 'Sharpe Ratio', strategy: '1.16', benchmark: '0.60' },
    { metric: 'Sortino Ratio', strategy: '1.74', benchmark: '0.82' },
    { metric: 'Max Drawdown', strategy: '-4.2%', benchmark: '-8.7%' },
    { metric: 'Calmar Ratio', strategy: '2.71', benchmark: '0.83' },
    { metric: 'Win Rate', strategy: '58%', benchmark: '51%' },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>EP-CZ6</div>
          <h1 style={{ fontFamily: T.font, fontSize: 20, fontWeight: 800, color: T.navy, margin: '2px 0 0' }}>Transition Alpha Signal Generator</h1>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
          Last signal refresh: 2026-04-05 08:30 UTC | Model v3.2
        </div>
      </div>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${T.gold}, transparent)`, marginBottom: 14 }} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 16 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            fontFamily: T.mono, fontSize: 11, fontWeight: tab === i ? 700 : 400, padding: '8px 16px',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            background: 'none', color: tab === i ? T.navy : T.textMut, cursor: 'pointer',
            letterSpacing: '0.02em', marginBottom: -2, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB 0: Signal Dashboard ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <KPI label="Active Signals" value="6" sub="of 6 factors" />
            <KPI label="Portfolio Alpha" value="+2.4%" sub="vs benchmark" color={T.green} />
            <KPI label="Information Ratio" value="0.85" sub="12M rolling" color={T.navy} />
            <KPI label="Hit Rate" value="58%" sub="monthly win rate" color={T.teal} />
            <KPI label="Max Drawdown" value="-4.2%" sub="trailing 36M" color={T.red} />
          </div>

          <div style={card}>
            <div style={hdr}>Transition Alpha Factor Signals</div>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Factor</th><th style={th}>Description</th><th style={th}>Signal</th>
                  <th style={{ ...th, textAlign: 'right' }}>Z-Score</th>
                  <th style={{ ...th, textAlign: 'right' }}>Weight %</th>
                  <th style={{ ...th, textAlign: 'right' }}>3M Return Attr.</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                    <td style={{ ...td, color: T.navy, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ ...td, fontFamily: T.font, fontSize: 10, color: T.textMut }}>{s.desc}</td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10,
                        fontWeight: 700, background: sigColor(s.signal) + '18', color: sigColor(s.signal),
                      }}>{s.signal}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: s.zScore >= 0 ? T.green : T.red, fontWeight: 600 }}>
                      {s.zScore > 0 ? '+' : ''}{s.zScore}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>{s.weight}%</td>
                    <td style={{ ...td, textAlign: 'right', color: retColor(s.ret3m), fontWeight: 600 }}>
                      {s.ret3m > 0 ? '+' : ''}{s.ret3m}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={card}>
            <div style={hdr}>Factor Signal Strength</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signals} layout="vertical" margin={{ left: 110, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <YAxis type="category" dataKey="name" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textSec }} width={105} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10, border: `1px solid ${T.border}` }} />
                <Bar dataKey="zScore" radius={[0, 3, 3, 0]}>
                  {signals.map((s, i) => <Cell key={i} fill={s.zScore >= 0 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB 1: Factor Model ── */}
      {tab === 1 && (
        <div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={hdr}>Multi-Factor Regression Results</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.navy }}>
                R<sup>2</sup> = 0.42 | Adj R<sup>2</sup> = 0.38 | F-stat = 8.74
              </div>
            </div>
            <div style={subhdr}>Dependent Variable: Monthly Stock Returns | Sample: 36 months</div>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Factor</th>
                  <th style={{ ...th, textAlign: 'right' }}>Coefficient</th>
                  <th style={{ ...th, textAlign: 'right' }}>t-Statistic</th>
                  <th style={{ ...th, textAlign: 'right' }}>p-Value</th>
                  <th style={th}>Significance</th>
                </tr>
              </thead>
              <tbody>
                {regression.map((r, i) => {
                  const isCli = i < FACTORS.length;
                  return (
                    <tr key={i} style={{ background: isCli ? (i % 2 === 0 ? T.surface : T.bg) : '#f8f6f2' }}>
                      <td style={{ ...td, color: isCli ? T.navy : T.textSec, fontWeight: isCli ? 600 : 400 }}>{r.name}</td>
                      <td style={{ ...td, textAlign: 'right', color: r.coef >= 0 ? T.green : T.red }}>{r.coef > 0 ? '+' : ''}{r.coef}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: Math.abs(r.tStat) > 2 ? 700 : 400 }}>{r.tStat}</td>
                      <td style={{ ...td, textAlign: 'right', color: pColor(r.pVal) }}>{r.pVal.toFixed(4)}</td>
                      <td style={td}>{r.pVal < 0.01 ? '***' : r.pVal < 0.05 ? '**' : r.pVal < 0.1 ? '*' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Factor Exposures</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={regression.slice(0, 6)} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontFamily: T.mono, fontSize: 8, fill: T.textMut }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                  <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                  <ReferenceLine y={0} stroke={T.textMut} />
                  <Bar dataKey="coef" name="Coefficient" radius={[3, 3, 0, 0]}>
                    {regression.slice(0, 6).map((r, i) => <Cell key={i} fill={r.coef >= 0 ? T.teal : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Factor Correlation Matrix</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...tbl, fontSize: 9 }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, fontSize: 8 }}></th>
                      {FACTORS.map((f, i) => <th key={i} style={{ ...th, fontSize: 7, padding: '4px 3px', maxWidth: 60 }}>{f.name.split(' ')[0]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {corr.map((row, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontSize: 8, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{FACTORS[i].name.split(' ')[0]}</td>
                        {FACTORS.map((f, j) => {
                          const v = row[f.name];
                          return (
                            <td key={j} style={{
                              ...td, textAlign: 'center', fontSize: 9, fontWeight: i === j ? 700 : 400,
                              background: i === j ? T.navy + '15' : v > 0.3 ? T.green + '15' : v < -0.3 ? T.red + '15' : 'transparent',
                            }}>{v.toFixed(2)}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={hdr}>Rolling 12-Month Factor Performance</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={factorPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 9 }} />
                <ReferenceLine y={0} stroke={T.textMut} strokeDasharray="4 4" />
                {FACTORS.map((f, i) => (
                  <Line key={f.name} type="monotone" dataKey={f.name} stroke={FACTOR_COLORS[i]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB 2: Backtesting ── */}
      {tab === 2 && (
        <div>
          <div style={card}>
            <div style={hdr}>Cumulative Return: Long-Short Transition Strategy vs Benchmark (36M)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cumRet}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontFamily: T.mono, fontSize: 9, fill: T.textMut }} interval={5} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                <ReferenceLine y={0} stroke={T.textMut} />
                <Area type="monotone" dataKey="strategy" stroke={T.navy} fill={T.navy + '20'} strokeWidth={2} name="L/S Strategy" />
                <Area type="monotone" dataKey="benchmark" stroke={T.textMut} fill={T.textMut + '10'} strokeWidth={1.5} strokeDasharray="4 4" name="Benchmark" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Performance Summary</div>
              <table style={tbl}>
                <thead>
                  <tr><th style={th}>Metric</th><th style={{ ...th, textAlign: 'right' }}>Strategy</th><th style={{ ...th, textAlign: 'right' }}>Benchmark</th></tr>
                </thead>
                <tbody>
                  {perfMetrics.map((m, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{m.metric}</td>
                      <td style={{ ...td, textAlign: 'right', color: T.green, fontWeight: 600 }}>{m.strategy}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{m.benchmark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ ...card, flex: 2 }}>
              <div style={hdr}>Monthly Returns Heatmap</div>
              <table style={tbl}>
                <thead>
                  <tr><th style={th}>Year</th>{MONTHS.map(m => <th key={m} style={{ ...th, textAlign: 'center', fontSize: 8, padding: '4px 2px' }}>{m}</th>)}</tr>
                </thead>
                <tbody>
                  {monthly.map((row, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight: 700, color: T.navy }}>{row.year}</td>
                      {MONTHS.map(m => (
                        <td key={m} style={{
                          ...td, textAlign: 'center', fontSize: 9, fontWeight: 600,
                          background: heatColor(row[m]), color: row[m] >= 0 ? T.green : T.red,
                        }}>{row[m] > 0 ? '+' : ''}{row[m]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Drawdown Profile</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={drawdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontFamily: T.mono, fontSize: 9, fill: T.textMut }} interval={5} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} formatter={v => `${v}%`} />
                  <Area type="monotone" dataKey="drawdown" stroke={T.red} fill={T.red + '25'} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Rolling 6M Sharpe Ratio</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={rollSharpe}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontFamily: T.mono, fontSize: 9, fill: T.textMut }} interval={5} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                  <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                  <ReferenceLine y={1} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Target', fill: T.gold, fontSize: 9 }} />
                  <Line type="monotone" dataKey="sharpe" stroke={T.navy} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Alpha Attribution ── */}
      {tab === 3 && (
        <div>
          <div style={card}>
            <div style={hdr}>Monthly Alpha Decomposition by Factor</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={alphaDecomp} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 9 }} />
                <ReferenceLine y={0} stroke={T.textMut} />
                {FACTORS.map((f, i) => (
                  <Bar key={f.name} dataKey={f.name} stackId="a" fill={FACTOR_COLORS[i]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Sector Alpha Contribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sectorAlpha} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="sector" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textSec }} width={75} />
                  <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                  <ReferenceLine x={0} stroke={T.textMut} />
                  <Bar dataKey="alpha" radius={[0, 3, 3, 0]} name="Alpha %">
                    {sectorAlpha.map((s, i) => <Cell key={i} fill={s.alpha >= 0 ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Geographic Alpha Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={geoAlpha} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="geo" tick={{ fontFamily: T.mono, fontSize: 8, fill: T.textMut }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                  <ReferenceLine y={0} stroke={T.textMut} />
                  <Bar dataKey="alpha" radius={[3, 3, 0, 0]} name="Alpha %">
                    {geoAlpha.map((g, i) => <Cell key={i} fill={g.alpha >= 0 ? T.teal : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Top 10 Alpha Generators (Long)</div>
              <table style={tbl}>
                <thead><tr><th style={th}>Name</th><th style={th}>Sector</th><th style={{ ...th, textAlign: 'right' }}>Weight %</th><th style={{ ...th, textAlign: 'right' }}>Alpha %</th></tr></thead>
                <tbody>
                  {topLong.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{s.name}</td>
                      <td style={{ ...td, fontSize: 10 }}>{s.sector}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{s.weight}</td>
                      <td style={{ ...td, textAlign: 'right', color: T.green, fontWeight: 600 }}>+{Math.abs(s.alpha).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Top 10 Alpha Detractors (Short)</div>
              <table style={tbl}>
                <thead><tr><th style={th}>Name</th><th style={th}>Sector</th><th style={{ ...th, textAlign: 'right' }}>Weight %</th><th style={{ ...th, textAlign: 'right' }}>Alpha %</th></tr></thead>
                <tbody>
                  {topShort.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{s.name}</td>
                      <td style={{ ...td, fontSize: 10 }}>{s.sector}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{s.weight}</td>
                      <td style={{ ...td, textAlign: 'right', color: T.red, fontWeight: 600 }}>{s.alpha.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={card}>
            <div style={hdr}>Alpha Waterfall: Total Build-Up</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={waterfall} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontFamily: T.mono, fontSize: 8, fill: T.textMut }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
                <ReferenceLine y={0} stroke={T.textMut} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {waterfall.map((w, i) => (
                    <Cell key={i} fill={w.isTotal ? T.navy : w.value >= 0 ? T.green : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB 4: Signal Decay ── */}
      {tab === 4 && (
        <div>
          <div style={card}>
            <div style={hdr}>Information Coefficient (IC) Decay by Holding Period</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={icDecay}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="period" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 9 }} />
                <ReferenceLine y={0.05} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Significance', fill: T.gold, fontSize: 9 }} />
                {FACTORS.map((f, i) => (
                  <Line key={f.name} type="monotone" dataKey={f.name} stroke={FACTOR_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Signal Half-Life & Optimal Rebalancing</div>
              <table style={tbl}>
                <thead>
                  <tr><th style={th}>Signal</th><th style={{ ...th, textAlign: 'right' }}>Half-Life</th><th style={th}>Optimal Rebalance</th></tr>
                </thead>
                <tbody>
                  {halfLife.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy }}>{h.name}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{h.halfLife}</td>
                      <td style={td}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                          background: h.optRebal === 'Weekly' ? T.red + '15' : h.optRebal === 'Monthly' ? T.green + '15' : T.amber + '15',
                          color: h.optRebal === 'Weekly' ? T.red : h.optRebal === 'Monthly' ? T.green : T.amber,
                        }}>{h.optRebal}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ ...card, flex: 1 }}>
              <div style={hdr}>Turnover vs Alpha Trade-Off</div>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="turnover" name="Turnover %" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                  <YAxis type="number" dataKey="alpha" name="Alpha %" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                  <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} formatter={(v, n) => [`${v}%`, n]} />
                  <ReferenceLine y={0} stroke={T.textMut} strokeDasharray="4 4" />
                  <Scatter data={turnoverAlpha} fill={T.navy}>
                    {turnoverAlpha.map((d, i) => <Cell key={i} fill={d.alpha >= 0 ? T.teal : T.red} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <div style={hdr}>Signal Autocorrelation (Lags 1-12)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={autocorr}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lag" tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 10, fill: T.textMut }} domain={[0, 1]} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontFamily: T.mono, fontSize: 9 }} />
                <ReferenceLine y={0.2} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Noise Floor', fill: T.amber, fontSize: 9 }} />
                {FACTORS.map((f, i) => (
                  <Line key={f.name} type="monotone" dataKey={f.name} stroke={FACTOR_COLORS[i]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, padding: '8px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut }}>
          TRANSITION ALPHA SIGNAL GENERATOR v3.2 | 6 climate factors + FF5 controls | L/S strategy since Jan 2024
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut }}>
          Data as of 2026-04-05 | Backtest hypothetical — not investment advice
        </div>
      </div>
    </div>
  );
}
