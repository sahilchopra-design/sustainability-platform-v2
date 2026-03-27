import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, Cell, Legend,
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c',
  gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  card: '0 1px 4px rgba(27,58,92,0.06)',
  cardH: '0 4px 16px rgba(27,58,92,0.1)',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Holdings Data ────────────────────────────────────────────────────────────
const HOLDINGS = [
  { name: 'Apple',      ticker: 'AAPL', sector: 'Technology',   wCur: 6.2, wOpt: 7.1, esg: 72, ci: 28,  ret: 13.4, vol: 22.1 },
  { name: 'Tesla',      ticker: 'TSLA', sector: 'Auto/EV',      wCur: 3.8, wOpt: 5.2, esg: 68, ci: 45,  ret: 18.1, vol: 41.3 },
  { name: 'Shell',      ticker: 'SHEL', sector: 'Energy',       wCur: 4.9, wOpt: 1.2, esg: 31, ci: 620, ret: 9.2,  vol: 19.8 },
  { name: 'HSBC',       ticker: 'HSBC', sector: 'Banking',      wCur: 3.1, wOpt: 2.8, esg: 58, ci: 42,  ret: 7.8,  vol: 18.4 },
  { name: 'Tata Steel', ticker: 'TATASTEEL', sector: 'Materials', wCur: 2.4, wOpt: 1.1, esg: 44, ci: 890, ret: 10.2, vol: 28.7 },
  { name: 'Reliance',   ticker: 'RELI', sector: 'Conglomerate', wCur: 3.6, wOpt: 2.9, esg: 49, ci: 310, ret: 11.8, vol: 24.3 },
  { name: 'Toyota',     ticker: 'TM',   sector: 'Auto',         wCur: 4.1, wOpt: 4.8, esg: 64, ci: 185, ret: 8.9,  vol: 17.6 },
  { name: 'Unilever',   ticker: 'UL',   sector: 'Consumer',     wCur: 3.7, wOpt: 4.9, esg: 79, ci: 62,  ret: 8.2,  vol: 14.2 },
  { name: 'BHP',        ticker: 'BHP',  sector: 'Mining',       wCur: 3.3, wOpt: 1.4, esg: 38, ci: 740, ret: 10.6, vol: 22.9 },
  { name: 'NextEra',    ticker: 'NEE',  sector: 'Utilities',    wCur: 3.9, wOpt: 6.8, esg: 88, ci: 22,  ret: 10.1, vol: 15.7 },
  { name: 'Enel',       ticker: 'ENEL', sector: 'Utilities',    wCur: 2.8, wOpt: 5.1, esg: 84, ci: 35,  ret: 9.7,  vol: 16.3 },
  { name: 'BASF',       ticker: 'BAS',  sector: 'Chemicals',    wCur: 2.2, wOpt: 1.3, esg: 52, ci: 520, ret: 7.4,  vol: 20.1 },
  { name: 'Amazon',     ticker: 'AMZN', sector: 'Technology',   wCur: 5.1, wOpt: 5.9, esg: 65, ci: 38,  ret: 14.2, vol: 26.4 },
  { name: 'Walmart',    ticker: 'WMT',  sector: 'Retail',       wCur: 3.4, wOpt: 3.8, esg: 61, ci: 88,  ret: 8.6,  vol: 13.1 },
  { name: 'Samsung',    ticker: 'SMSN', sector: 'Technology',   wCur: 4.2, wOpt: 4.6, esg: 67, ci: 72,  ret: 11.3, vol: 24.8 },
  { name: 'BlackRock',  ticker: 'BLK',  sector: 'Finance',      wCur: 2.9, wOpt: 3.2, esg: 70, ci: 18,  ret: 9.8,  vol: 17.9 },
  { name: 'JP Morgan',  ticker: 'JPM',  sector: 'Banking',      wCur: 4.4, wOpt: 3.7, esg: 55, ci: 24,  ret: 10.4, vol: 20.3 },
  { name: 'Nestle',     ticker: 'NESN', sector: 'Consumer',     wCur: 3.8, wOpt: 4.4, esg: 77, ci: 55,  ret: 7.9,  vol: 12.8 },
  { name: 'Rio Tinto',  ticker: 'RIO',  sector: 'Mining',       wCur: 2.7, wOpt: 1.2, esg: 41, ci: 680, ret: 9.4,  vol: 21.7 },
  { name: 'Vestas',     ticker: 'VWS',  sector: 'Renewables',   wCur: 2.1, wOpt: 5.4, esg: 91, ci: 12,  ret: 12.8, vol: 28.2 },
  { name: 'Orsted',     ticker: 'ORSTED', sector: 'Renewables', wCur: 1.8, wOpt: 5.8, esg: 93, ci: 8,   ret: 11.6, vol: 25.9 },
  { name: 'Siemens',    ticker: 'SIE',  sector: 'Industrial',   wCur: 3.2, wOpt: 4.1, esg: 73, ci: 95,  ret: 9.3,  vol: 16.8 },
  { name: 'LVMH',       ticker: 'MC',   sector: 'Luxury',       wCur: 2.6, wOpt: 3.1, esg: 66, ci: 48,  ret: 10.7, vol: 19.5 },
  { name: 'Alibaba',    ticker: 'BABA', sector: 'Technology',   wCur: 3.8, wOpt: 2.2, esg: 48, ci: 55,  ret: 12.1, vol: 32.6 },
];

const calcPortfolioStats = (holdings, weightKey) => {
  const total = holdings.reduce((s, h) => s + h[weightKey], 0);
  const esg = holdings.reduce((s, h) => s + (h[weightKey] / total) * h.esg, 0);
  const waci = holdings.reduce((s, h) => s + (h[weightKey] / total) * h.ci, 0);
  const ret = holdings.reduce((s, h) => s + (h[weightKey] / total) * h.ret, 0);
  const vol = Math.sqrt(holdings.reduce((s, h) => s + Math.pow((h[weightKey] / total) * h.vol, 2), 0));
  return { esg, waci, ret, vol };
};

const curStats = calcPortfolioStats(HOLDINGS, 'wCur');
const optStats = calcPortfolioStats(HOLDINGS, 'wOpt');

// ─── Efficient Frontier Data ──────────────────────────────────────────────────
const ESG_LEVELS = [
  { label: 'Unconstrained', floor: 0,  color: T.textMut },
  { label: 'ESG ≥ 40',      floor: 40, color: T.amber },
  { label: 'ESG ≥ 60',      floor: 60, color: T.navyL },
  { label: 'ESG ≥ 70',      floor: 70, color: T.sage },
  { label: 'ESG ≥ 80',      floor: 80, color: T.green },
];

const FRONTIER_POINTS = Array.from({ length: 40 }, (_, i) => {
  const levelIdx = Math.floor(sr(i * 7) * ESG_LEVELS.length);
  const level = ESG_LEVELS[levelIdx];
  const esgPenalty = level.floor * 0.002;
  const risk = 8 + sr(i * 3) * 12;
  const ret = 6 + sr(i * 5) * 8 - esgPenalty - (risk < 12 ? (12 - risk) * 0.15 : 0);
  return { risk: +risk.toFixed(2), ret: +Math.max(5, ret).toFixed(2), esgFloor: level.floor, label: level.label, color: level.color };
});

const FRONTIER_SUMMARY = [
  { esgFloor: 40, ret: 12.8, risk: 15.2, waci: 210 },
  { esgFloor: 60, ret: 12.1, risk: 14.8, waci: 165 },
  { esgFloor: 70, ret: 11.6, risk: 14.3, waci: 138 },
  { esgFloor: 80, ret: 10.9, risk: 13.7, waci: 98  },
];

// ─── Factor Data ─────────────────────────────────────────────────────────────
const FACTORS = [
  { name: 'Value',        cur: 0.28,  opt: 0.19,  bench: 0.22,  tstat: -2.1 },
  { name: 'Momentum',     cur: 0.31,  opt: 0.35,  bench: 0.28,  tstat: 1.4  },
  { name: 'Quality',      cur: 0.42,  opt: 0.58,  bench: 0.38,  tstat: 3.2  },
  { name: 'Size',         cur: -0.12, opt: -0.08, bench: -0.05, tstat: 1.1  },
  { name: 'Low Vol',      cur: 0.18,  opt: 0.31,  bench: 0.20,  tstat: 2.6  },
  { name: 'ESG Score',    cur: 0.12,  opt: 0.68,  bench: 0.25,  tstat: 8.4  },
  { name: 'Carbon Beta',  cur: 0.45,  opt: 0.18,  bench: 0.35,  tstat: -5.7 },
  { name: 'Green Revenue',cur: 0.14,  opt: 0.52,  bench: 0.18,  tstat: 6.1  },
];

// ─── Backtesting Data ─────────────────────────────────────────────────────────
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
const ANNUAL_RETURNS = [
  { year: 2018, esgOpt: -6.2,  unconstrained: -8.1,  benchmark: -9.4  },
  { year: 2019, esgOpt: 24.8,  unconstrained: 26.2,  benchmark: 26.6  },
  { year: 2020, esgOpt: 18.4,  unconstrained: 14.1,  benchmark: 16.2  },
  { year: 2021, esgOpt: 17.2,  unconstrained: 19.8,  benchmark: 18.5  },
  { year: 2022, esgOpt: -11.3, unconstrained: -14.8, benchmark: -18.4 },
  { year: 2023, esgOpt: 22.6,  unconstrained: 20.1,  benchmark: 22.2  },
  { year: 2024, esgOpt: 14.8,  unconstrained: 12.4,  benchmark: 14.1  },
];

const buildCumulative = () => {
  let esgV = 100, uncV = 100, bmkV = 100;
  const pts = [];
  YEARS.forEach(y => {
    const row = ANNUAL_RETURNS.find(r => r.year === y);
    // generate ~12 monthly points per year
    for (let m = 1; m <= 12; m++) {
      const seed = y * 100 + m;
      const noise = (sr(seed) - 0.5) * 0.02;
      const esgM = (1 + (row.esgOpt / 100) / 12 + noise);
      const uncM = (1 + (row.unconstrained / 100) / 12 + (sr(seed + 1) - 0.5) * 0.02);
      const bmkM = (1 + (row.benchmark / 100) / 12 + (sr(seed + 2) - 0.5) * 0.02);
      esgV *= esgM; uncV *= uncM; bmkV *= bmkM;
      pts.push({ label: `${y}-${String(m).padStart(2,'0')}`, esgOpt: +esgV.toFixed(1), unconstrained: +uncV.toFixed(1), benchmark: +bmkV.toFixed(1) });
    }
  });
  return pts;
};
const CUMULATIVE = buildCumulative();

const BACKTEST_STATS = [
  { label: 'Ann. Return',   esgOpt: '11.2%',  unc: '10.1%',  bmk: '9.8%'  },
  { label: 'Volatility',    esgOpt: '13.8%',  unc: '15.2%',  bmk: '14.9%' },
  { label: 'Sharpe Ratio',  esgOpt: '0.94',   unc: '0.82',   bmk: '0.79'  },
  { label: 'Max Drawdown',  esgOpt: '-18.4%', unc: '-22.1%', bmk: '-24.8%'},
  { label: 'ESG Avg Score', esgOpt: '71.3',   unc: '52.1',   bmk: '58.4'  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: T.card, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, borderBottom: `2px solid ${T.gold}`, paddingBottom: 6, display: 'inline-block' }}>
    {children}
  </div>
);

const KpiCard = ({ label, cur, opt, unit = '', better = 'higher', fmt }) => {
  const improved = better === 'higher' ? opt > cur : opt < cur;
  const fmtVal = v => fmt ? fmt(v) : v.toFixed(1);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: T.card }}>
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: T.textMut, marginBottom: 2 }}>Current</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{fmtVal(cur)}<span style={{ fontSize: 13, color: T.textSec }}>{unit}</span></div>
        </div>
        <div style={{ fontSize: 18, color: T.textMut, marginBottom: 4 }}>→</div>
        <div>
          <div style={{ fontSize: 10, color: T.textMut, marginBottom: 2 }}>Optimized</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: improved ? T.green : T.red }}>{fmtVal(opt)}<span style={{ fontSize: 13 }}>{unit}</span></div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: improved ? T.green : T.red, fontWeight: 600 }}>
        {improved ? '▲' : '▼'} {Math.abs(opt - cur).toFixed(1)}{unit} {improved ? 'Improved' : 'Declined'}
      </div>
    </div>
  );
};

const StatusPill = ({ label, ok }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: ok ? '#dcfce7' : '#fee2e2', color: ok ? T.green : T.red, fontSize: 12, fontWeight: 600, marginRight: 8 }}>
    {ok ? '✓' : '✗'} {label}
  </span>
);

// ─── Tab 1: Optimization Dashboard ───────────────────────────────────────────
const Tab1Dashboard = () => {
  const top12 = [...HOLDINGS].sort((a, b) => Math.max(b.wCur, b.wOpt) - Math.max(a.wCur, a.wOpt)).slice(0, 12);
  const chartData = top12.map(h => ({ name: h.ticker, Current: h.wCur, Optimized: h.wOpt }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <KpiCard label="Portfolio ESG Score" cur={curStats.esg} opt={optStats.esg} better="higher" />
        <KpiCard label="WACI (tCO2e/$M rev)" cur={curStats.waci} opt={optStats.waci} better="lower" />
        <KpiCard label="Expected Return" cur={curStats.ret} opt={optStats.ret} unit="%" better="higher" />
        <KpiCard label="Portfolio Volatility" cur={curStats.vol} opt={optStats.vol} unit="%" better="lower" />
      </div>

      <div style={{ marginBottom: 4 }}>
        <StatusPill label="ESG Improved" ok={optStats.esg > curStats.esg} />
        <StatusPill label="Carbon Reduced" ok={optStats.waci < curStats.waci} />
        <StatusPill label="Return Enhanced" ok={optStats.ret >= curStats.ret} />
      </div>

      <Card>
        <SectionTitle>Current vs Optimized Weights — Top 12 Holdings</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip formatter={(v) => `${v.toFixed(2)}%`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            <Legend />
            <Bar dataKey="Current" name="Current Weight" fill={T.navyL} radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={T.navyL} />)}
            </Bar>
            <Bar dataKey="Optimized" name="Optimized Weight" fill={T.sage} radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>All 24 Holdings</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Company','Ticker','Sector','ESG Score','Carbon Int.','Cur Wt%','Opt Wt%','Exp Ret%','Vol%'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h, i) => {
                const wChange = h.wOpt - h.wCur;
                return (
                  <tr key={h.ticker} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{h.name}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec, fontFamily: 'monospace' }}>{h.ticker}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{h.sector}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ color: h.esg >= 70 ? T.green : h.esg >= 50 ? T.amber : T.red, fontWeight: 700 }}>{h.esg}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: h.ci > 400 ? T.red : h.ci > 150 ? T.amber : T.green, fontWeight: 600 }}>{h.ci}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{h.wCur.toFixed(1)}%</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ color: wChange > 0 ? T.green : wChange < 0 ? T.red : T.textSec, fontWeight: 700 }}>{h.wOpt.toFixed(1)}%</span>
                      <span style={{ fontSize: 10, color: wChange > 0 ? T.green : T.red, marginLeft: 4 }}>{wChange > 0 ? '▲' : '▼'}{Math.abs(wChange).toFixed(1)}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: T.text }}>{h.ret.toFixed(1)}%</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{h.vol.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─── Tab 2: Efficient Frontier ────────────────────────────────────────────────
const Tab2Frontier = () => {
  const curPoint = { risk: +curStats.vol.toFixed(2), ret: +curStats.ret.toFixed(2) };
  const optPoint = { risk: +optStats.vol.toFixed(2), ret: +optStats.ret.toFixed(2) };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>ESG-Constrained Efficient Frontier</SectionTitle>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
          Each point represents a portfolio on the mean-variance frontier under different ESG score floor constraints. Stars mark current and optimized portfolio positions.
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="risk" name="Risk" tickFormatter={v => `${v}%`} label={{ value: 'Portfolio Risk (%)', position: 'insideBottom', offset: -12, fill: T.textSec, fontSize: 12 }} tick={{ fontSize: 11, fill: T.textSec }} domain={[7, 22]} />
            <YAxis dataKey="ret" name="Return" tickFormatter={v => `${v}%`} label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 12 }} tick={{ fontSize: 11, fill: T.textSec }} domain={[4, 16]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{d?.label || 'Portfolio'}</div>
                  <div>Risk: {d?.risk}% | Return: {d?.ret}%</div>
                </div>
              );
            }} />
            {ESG_LEVELS.map(lvl => (
              <Scatter
                key={lvl.floor}
                name={lvl.label}
                data={FRONTIER_POINTS.filter(p => p.esgFloor === lvl.floor)}
                fill={lvl.color}
                opacity={0.75}
              />
            ))}
            <Scatter name="Current Portfolio" data={[curPoint]} fill={T.red} shape="star" />
            <Scatter name="Optimized Portfolio" data={[optPoint]} fill={T.gold} shape="star" />
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Frontier Summary by ESG Floor</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['ESG Floor', 'Max Return', 'Risk', 'WACI'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRONTIER_SUMMARY.map((r, i) => (
                <tr key={r.esgFloor} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '7px 10px', color: T.sage, fontWeight: 700 }}>≥ {r.esgFloor}</td>
                  <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{r.ret}%</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{r.risk}%</td>
                  <td style={{ padding: '7px 10px', color: r.waci > 200 ? T.amber : T.green, fontWeight: 600 }}>{r.waci}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <SectionTitle>ESG Penalty Analysis</SectionTitle>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Return sacrificed vs unconstrained frontier</div>
          {FRONTIER_SUMMARY.map(r => {
            const penalty = (13.4 - r.ret).toFixed(1);
            const pct = (penalty / 13.4 * 100).toFixed(0);
            return (
              <div key={r.esgFloor} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>ESG ≥ {r.esgFloor}</span>
                  <span style={{ fontSize: 12, color: T.red }}>-{penalty}% pa</span>
                </div>
                <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: T.red, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};

// ─── Tab 3: ESG Constraint Builder ───────────────────────────────────────────
const CONSTRAINTS_INIT = [
  { key: 'minEsg',      label: 'Min Portfolio ESG Score', val: 65, min: 0, max: 100, unit: '', portfolioVal: optStats.esg },
  { key: 'maxWaci',     label: 'Max WACI (tCO2e/$M)',     val: 180, min: 0, max: 1000, unit: '', portfolioVal: optStats.waci },
  { key: 'maxFossil',   label: 'Max Fossil Fuel Exposure', val: 5, min: 0, max: 50, unit: '%', portfolioVal: 3.1 },
  { key: 'minGreen',    label: 'Min Green Revenue',        val: 20, min: 0, max: 100, unit: '%', portfolioVal: 28.4 },
  { key: 'maxSingle',   label: 'Max Single Holding Wt',   val: 8, min: 0, max: 20, unit: '%', portfolioVal: 7.1 },
  { key: 'minHoldings', label: 'Min Holdings Count',       val: 20, min: 5, max: 50, unit: '', portfolioVal: 24 },
];

const RADAR_DIMS = ['ESG Score', 'Carbon', 'Fossil Fuel', 'Green Rev', 'Diversification', 'Liquidity'];
const RADAR_DATA = RADAR_DIMS.map((dim, i) => ({
  dim,
  portfolio: [78, 82, 88, 74, 85, 70][i],
  constraint: [65, 75, 95, 60, 80, 60][i],
}));

const Tab3Constraints = () => {
  const [constraints, setConstraints] = useState(CONSTRAINTS_INIT);

  const update = (key, val) => setConstraints(prev => prev.map(c => c.key === key ? { ...c, val } : c));

  const isBinding = (c) => {
    if (c.key === 'minEsg') return c.portfolioVal < c.val * 1.1;
    if (c.key === 'maxWaci') return c.portfolioVal > c.val * 0.9;
    if (c.key === 'maxFossil') return c.portfolioVal > c.val * 0.8;
    if (c.key === 'minGreen') return c.portfolioVal < c.val * 1.2;
    if (c.key === 'maxSingle') return c.portfolioVal > c.val * 0.9;
    if (c.key === 'minHoldings') return c.portfolioVal < c.val * 1.1;
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {constraints.map(c => {
          const binding = isBinding(c);
          const margin = c.key.startsWith('max')
            ? ((c.val - c.portfolioVal) / c.val * 100).toFixed(1)
            : ((c.portfolioVal - c.val) / c.val * 100).toFixed(1);
          return (
            <Card key={c.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>Portfolio: <strong>{c.portfolioVal.toFixed(1)}{c.unit}</strong></div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: binding ? '#fef3c7' : '#f0fdf4', color: binding ? T.amber : T.green }}>
                  {binding ? `⚡ Binding (${margin}% margin)` : `✓ Slack`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range" min={c.min} max={c.max} value={c.val}
                  onChange={e => update(c.key, Number(e.target.value))}
                  style={{ flex: 1, accentColor: binding ? T.amber : T.sage }}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: T.navy, minWidth: 50, textAlign: 'right' }}>{c.val}{c.unit}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle>Portfolio vs Constraints Radar</SectionTitle>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={120}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: T.textSec }} />
              <Radar name="Portfolio" dataKey="portfolio" stroke={T.sage} fill={T.sage} fillOpacity={0.35} />
              <Radar name="Constraint Floor" dataKey="constraint" stroke={T.amber} fill={T.amber} fillOpacity={0.15} strokeDasharray="4 2" />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

// ─── Tab 4: Factor Decomposition ─────────────────────────────────────────────
const Tab4Factors = () => {
  const chartData = FACTORS.map(f => ({ name: f.name, Current: f.cur, Optimized: f.opt, Benchmark: f.bench }));
  const esgContrib = 48;
  const tradContrib = 52;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Factor Loadings — Current vs Optimized vs Benchmark</SectionTitle>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            <Legend />
            <Bar dataKey="Current" fill={T.navyL} radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={T.navyL} />)}
            </Bar>
            <Bar dataKey="Optimized" fill={T.sage} radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={T.sage} />)}
            </Bar>
            <Bar dataKey="Benchmark" fill={T.gold} radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={T.gold} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Factor Detail Table</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Factor', 'Current', 'Optimized', 'Benchmark', 'Change', 'T-Stat'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((f, i) => {
                const chg = f.opt - f.cur;
                const isESG = f.name === 'ESG Score' || f.name === 'Green Revenue';
                const isCarbon = f.name === 'Carbon Beta';
                return (
                  <tr key={f.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: isESG ? T.green : isCarbon ? T.red : T.text }}>{f.name}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{f.cur.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{f.opt.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', color: T.textMut }}>{f.bench.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', color: chg > 0 ? T.green : T.red, fontWeight: 600 }}>
                      {chg > 0 ? '+' : ''}{chg.toFixed(2)}
                    </td>
                    <td style={{ padding: '7px 10px', color: Math.abs(f.tstat) > 3 ? T.navy : T.textSec, fontWeight: Math.abs(f.tstat) > 3 ? 700 : 400 }}>
                      {f.tstat > 0 ? '+' : ''}{f.tstat.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Active Risk Decomposition</SectionTitle>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Share of active risk by factor type</div>
          {[
            { label: 'ESG Factors', pct: esgContrib, color: T.sage },
            { label: 'Traditional Factors', pct: tradContrib, color: T.navyL },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.pct}%</span>
              </div>
              <div style={{ height: 10, background: T.surfaceH, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 5 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 12, background: T.surfaceH, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Key Shifts</div>
            <div style={{ fontSize: 12, color: T.green, marginBottom: 4 }}>▲ ESG Score: 0.12 → 0.68 (+0.56)</div>
            <div style={{ fontSize: 12, color: T.green, marginBottom: 4 }}>▲ Green Rev: 0.14 → 0.52 (+0.38)</div>
            <div style={{ fontSize: 12, color: T.red }}>▼ Carbon Beta: 0.45 → 0.18 (−0.27)</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Tab 5: Rebalancing Engine ────────────────────────────────────────────────
const Tab5Rebalancing = () => {
  const trades = HOLDINGS.map(h => {
    const tradeSz = h.wOpt - h.wCur;
    const absSz = Math.abs(tradeSz);
    const txCost = +(2 + sr(h.ticker.charCodeAt(0)) * 8).toFixed(1);
    const impact = +(1 + sr(h.ticker.charCodeAt(0) + 5) * 5).toFixed(1);
    return { ...h, tradeSz: +tradeSz.toFixed(2), absSz: +absSz.toFixed(2), txCost, impact, dir: tradeSz > 0 ? 'BUY' : tradeSz < 0 ? 'SELL' : 'HOLD' };
  }).sort((a, b) => b.absSz - a.absSz);

  const totalTurnover = trades.reduce((s, t) => s + t.absSz, 0) / 2;
  const totalTxCost = trades.reduce((s, t) => s + t.absSz * t.txCost * 0.1, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total Turnover', val: `${totalTurnover.toFixed(1)}%`, note: 'Two-way' },
          { label: 'Est. Transaction Cost', val: `$${totalTxCost.toFixed(0)}k`, note: 'All-in' },
          { label: 'Impl. Shortfall Est.', val: `${(totalTxCost * 1.3).toFixed(0)} bps`, note: 'Market impact incl.' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.navy }}>{s.val}</div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{s.note}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Trade List — Sorted by Size</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Company', 'Dir', 'Cur Wt', 'Target Wt', 'Trade Size', 'Tx Cost (bps)', 'Mkt Impact'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.ticker} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: T.text }}>{t.name}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: t.dir === 'BUY' ? '#dcfce7' : t.dir === 'SELL' ? '#fee2e2' : '#f1f5f9', color: t.dir === 'BUY' ? T.green : t.dir === 'SELL' ? T.red : T.textMut }}>
                        {t.dir}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px', color: T.textSec }}>{t.wCur.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 600 }}>{t.wOpt.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: t.dir === 'BUY' ? T.green : T.red, fontWeight: 700 }}>
                      {t.tradeSz > 0 ? '+' : ''}{t.tradeSz.toFixed(2)}%
                    </td>
                    <td style={{ padding: '6px 10px', color: T.textSec }}>{t.txCost}</td>
                    <td style={{ padding: '6px 10px', color: T.textSec }}>{t.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle>Implementation Timeline</SectionTitle>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Recommended rebalancing approach</div>
          {[
            { phase: 'Immediate', pct: 40, color: T.sage, desc: 'Large buys (Vestas, Orsted, NextEra, Enel). Capitalize on current market prices.' },
            { phase: 'Month 1–2', pct: 35, color: T.navyL, desc: 'Sell fossil fuel positions (Shell, BHP, Rio Tinto) in tranches to minimize impact.' },
            { phase: 'Month 3', pct: 25, color: T.gold, desc: 'Fine-tune smaller positions and rebalance residual drift.' },
          ].map(p => (
            <div key={p.phase} style={{ marginBottom: 16, padding: 12, background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${p.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{p.phase} — {p.pct}% of trades</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{p.desc}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── Tab 6: Backtesting ───────────────────────────────────────────────────────
const Tab6Backtest = () => {
  const chartSample = CUMULATIVE.filter((_, i) => i % 3 === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Cumulative Return — 2018–2024 (Indexed to 100)</SectionTitle>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
          ESG-constrained optimization (min ESG 65) vs unconstrained MVO vs MSCI ACWI benchmark
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartSample} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textSec }} interval={11} />
            <YAxis tickFormatter={v => v.toFixed(0)} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} labelFormatter={l => `Date: ${l}`} />
            <Legend />
            <Line type="monotone" dataKey="esgOpt" name="ESG Optimized" stroke={T.sage} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="unconstrained" name="Unconstrained" stroke={T.navyL} strokeWidth={2} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="benchmark" name="MSCI ACWI" stroke={T.gold} strokeWidth={2} dot={false} strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Annual Returns by Strategy</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Year</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: T.sage, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>ESG Opt</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: T.navyL, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Unconst.</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: T.gold, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {ANNUAL_RETURNS.map((r, i) => (
                <tr key={r.year} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{r.year}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: r.esgOpt >= 0 ? T.green : T.red, fontWeight: 700 }}>{r.esgOpt > 0 ? '+' : ''}{r.esgOpt}%</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: r.unconstrained >= 0 ? T.green : T.red }}>{r.unconstrained > 0 ? '+' : ''}{r.unconstrained}%</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: r.benchmark >= 0 ? T.green : T.red }}>{r.benchmark > 0 ? '+' : ''}{r.benchmark}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Performance Statistics</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Metric</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: T.sage, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>ESG Opt</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: T.navyL, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Unconst.</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: T.gold, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {BACKTEST_STATS.map((s, i) => (
                <tr key={s.label} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontWeight: 600 }}>{s.label}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: T.sage }}>{s.esgOpt}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: T.navyL }}>{s.unc}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: T.gold }}>{s.bmk}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: `1px solid ${T.sage}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 6 }}>ESG Optimization Alpha</div>
            <div style={{ fontSize: 12, color: T.text }}>ESG-constrained strategy outperforms unconstrained by <strong>+1.1% pa</strong> and benchmark by <strong>+1.4% pa</strong> with superior risk-adjusted returns (Sharpe 0.94 vs 0.82 / 0.79).</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard',   label: 'Optimization Dashboard' },
  { id: 'frontier',    label: 'Efficient Frontier' },
  { id: 'constraints', label: 'ESG Constraint Builder' },
  { id: 'factors',     label: 'Factor Decomposition' },
  { id: 'rebalancing', label: 'Rebalancing Engine' },
  { id: 'backtest',    label: 'Backtesting' },
];

export default function EsgPortfolioOptimizerPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ background: T.gold, color: T.navy, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>EP-AF1</span>
            <span style={{ color: T.gold, fontSize: 11, fontWeight: 600 }}>AA Impact Risk Analytics Platform</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>ESG Portfolio Optimizer</h1>
          <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>MVO · ESG Constraints · 24 Holdings · Efficient Frontier</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {['MVO', 'ESG Constraints', '24 Holdings', 'Efficient Frontier'].map(b => (
            <span key={b} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? T.navy : T.textSec,
              borderBottom: activeTab === tab.id ? `2px solid ${T.gold}` : '2px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: T.font,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'dashboard'   && <Tab1Dashboard />}
        {activeTab === 'frontier'    && <Tab2Frontier />}
        {activeTab === 'constraints' && <Tab3Constraints />}
        {activeTab === 'factors'     && <Tab4Factors />}
        {activeTab === 'rebalancing' && <Tab5Rebalancing />}
        {activeTab === 'backtest'    && <Tab6Backtest />}
      </div>
    </div>
  );
}
