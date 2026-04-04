import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c',
  gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d',
  teal: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Static Data ───────────────────────────────────────────────────────────────

const SIGNALS = [
  { id: 'esg_mom',    name: 'ESG Momentum',           desc: 'Change in ESG score over trailing 12M — long top quintile',                        color: T.sage,   ic: 0.142, sharpe: 1.18, status: 'Active'  },
  { id: 'cont_rev',   name: 'Controversy Reversal',   desc: 'Companies with recent controversy + improving sentiment — contrarian long',          color: T.amber,  ic: 0.097, sharpe: 0.74, status: 'Active'  },
  { id: 'disc_up',    name: 'Disclosure Quality',     desc: 'Companies moving from low → high disclosure quality',                                color: T.blue,   ic: 0.118, sharpe: 0.91, status: 'Active'  },
  { id: 'gw_rev',     name: 'Greenwashing Reversal',  desc: 'High GW score companies that reduce it YoY — sentiment improvement',                 color: T.orange, ic: 0.083, sharpe: 0.61, status: 'Paused' },
  { id: 'sbti_init',  name: 'SBTi Initiator',         desc: 'Companies newly committing to SBTi — early-mover alpha',                            color: T.purple, ic: 0.165, sharpe: 1.34, status: 'Active'  },
  { id: 'narr_tone',  name: 'Narrative Tone Shift',   desc: 'Positive shift in 12M rolling narrative sentiment (NLP-derived)',                   color: T.navy,   ic: 0.109, sharpe: 0.88, status: 'Active'  },
];

const SECTORS = ['Energy', 'Financials', 'Industrials', 'Technology', 'Consumer'];
const RAW_COMPANIES = [
  { ticker: 'XOM',  name: 'ExxonMobil',        sector: 'Energy',      mcap: 492 },
  { ticker: 'CVX',  name: 'Chevron',            sector: 'Energy',      mcap: 298 },
  { ticker: 'BP',   name: 'BP plc',             sector: 'Energy',      mcap: 104 },
  { ticker: 'SHEL', name: 'Shell',              sector: 'Energy',      mcap: 218 },
  { ticker: 'TTE',  name: 'TotalEnergies',      sector: 'Energy',      mcap: 147 },
  { ticker: 'JPM',  name: 'JPMorgan Chase',     sector: 'Financials',  mcap: 562 },
  { ticker: 'BAC',  name: 'Bank of America',    sector: 'Financials',  mcap: 311 },
  { ticker: 'GS',   name: 'Goldman Sachs',      sector: 'Financials',  mcap: 154 },
  { ticker: 'MS',   name: 'Morgan Stanley',     sector: 'Financials',  mcap: 148 },
  { ticker: 'BLK',  name: 'BlackRock',          sector: 'Financials',  mcap: 116 },
  { ticker: 'GE',   name: 'GE Aerospace',       sector: 'Industrials', mcap: 176 },
  { ticker: 'HON',  name: 'Honeywell',          sector: 'Industrials', mcap: 132 },
  { ticker: 'MMM',  name: '3M Company',         sector: 'Industrials', mcap: 68  },
  { ticker: 'CAT',  name: 'Caterpillar',        sector: 'Industrials', mcap: 162 },
  { ticker: 'ABB',  name: 'ABB Ltd',            sector: 'Industrials', mcap: 89  },
  { ticker: 'MSFT', name: 'Microsoft',          sector: 'Technology',  mcap: 3100 },
  { ticker: 'GOOGL',name: 'Alphabet',           sector: 'Technology',  mcap: 2100 },
  { ticker: 'AAPL', name: 'Apple',              sector: 'Technology',  mcap: 3400 },
  { ticker: 'NVDA', name: 'NVIDIA',             sector: 'Technology',  mcap: 2900 },
  { ticker: 'IBM',  name: 'IBM',                sector: 'Technology',  mcap: 198  },
  { ticker: 'UL',   name: 'Unilever',           sector: 'Consumer',    mcap: 134  },
  { ticker: 'NESN', name: 'Nestlé',             sector: 'Consumer',    mcap: 291  },
  { ticker: 'PG',   name: 'Procter & Gamble',   sector: 'Consumer',    mcap: 402  },
  { ticker: 'KO',   name: 'Coca-Cola',          sector: 'Consumer',    mcap: 268  },
  { ticker: 'NKE',  name: 'Nike',               sector: 'Consumer',    mcap: 82   },
];

function buildCompanies() {
  return RAW_COMPANIES.map((c, i) => {
    const signals = {};
    SIGNALS.forEach((sig, si) => {
      const seed = i * 100 + si * 7;
      const score = Math.round(sr(seed) * 80 + 10);
      const ret1m = (sr(seed + 1) - 0.45) * 0.08;
      const ret3m = (sr(seed + 2) - 0.44) * 0.18;
      const ret6m = (sr(seed + 3) - 0.43) * 0.28;
      signals[sig.id] = {
        score,
        direction: score > 60 ? 'long' : score < 35 ? 'short' : 'neutral',
        ret1m, ret3m, ret6m,
        esgScore: Math.round(sr(seed + 5) * 60 + 25),
      };
    });
    return { ...c, signals };
  });
}

const COMPANIES = buildCompanies();

function buildBacktest(sigId, sigIdx) {
  const months = [];
  const years  = [2020, 2021, 2022, 2023, 2024, 2025];
  const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let longCum = 1, shortCum = 1, lsCum = 1, benchCum = 1;
  const heatmap = {};
  years.forEach(y => { heatmap[y] = {}; });

  years.forEach(yr => {
    for (let m = 0; m < 12; m++) {
      const seed = sigIdx * 1000 + (yr - 2020) * 12 + m;
      const benchRet  = (sr(seed) - 0.48) * 0.06;
      const longRet   = benchRet + (sr(seed + 1) - 0.42) * 0.04 + 0.003;
      const shortRet  = -(benchRet + (sr(seed + 2) - 0.52) * 0.03);
      const lsRet     = longRet + shortRet;
      longCum  *= (1 + longRet);
      shortCum *= (1 + shortRet);
      lsCum    *= (1 + lsRet);
      benchCum *= (1 + benchRet);
      heatmap[yr][mNames[m]] = lsRet;
      months.push({
        date: `${yr}-${String(m + 1).padStart(2, '0')}`,
        label: `${mNames[m]} ${yr}`,
        longCum:  +((longCum - 1) * 100).toFixed(2),
        shortCum: +((shortCum - 1) * 100).toFixed(2),
        lsCum:    +((lsCum - 1) * 100).toFixed(2),
        benchCum: +((benchCum - 1) * 100).toFixed(2),
        lsRet:    +(lsRet * 100).toFixed(3),
        drawdown: +(Math.min(0, (lsCum - 1) * 100 - ((lsCum - 1) * 100 + Math.abs((sr(seed + 4) * 5)))).toFixed(2)),
      });
    }
  });

  const lsReturns = months.map(m => m.lsRet / 100);
  const mean  = lsReturns.reduce((a, b) => a + b, 0) / lsReturns.length;
  const std   = Math.sqrt(lsReturns.map(r => (r - mean) ** 2).reduce((a, b) => a + b, 0) / lsReturns.length);
  const ann   = mean * 12;
  const annS  = std * Math.sqrt(12);
  const neg   = lsReturns.filter(r => r < 0);
  const sortS = neg.length ? std / (Math.sqrt(neg.map(r => r ** 2).reduce((a, b) => a + b, 0) / neg.length) * Math.sqrt(12)) : 0;
  const wins  = lsReturns.filter(r => r > 0).length;
  const maxDD = -Math.abs((sr(sigIdx * 3 + 1) * 0.12 + 0.05));

  return {
    months,
    heatmap,
    stats: {
      annReturn: +(ann * 100).toFixed(2),
      sharpe:    +((ann / annS) || 0).toFixed(2),
      sortino:   +sortS.toFixed(2),
      maxDD:     +(maxDD * 100).toFixed(2),
      calmar:    +((ann / Math.abs(maxDD)) || 0).toFixed(2),
      winRate:   +((wins / lsReturns.length) * 100).toFixed(1),
      avgWin:    +(lsReturns.filter(r => r > 0).reduce((a, b) => a + b, 0) / (wins || 1) * 100).toFixed(3),
      avgLoss:   +(lsReturns.filter(r => r < 0).reduce((a, b) => a + b, 0) / (lsReturns.length - wins || 1) * 100).toFixed(3),
    }
  };
}

const BACKTESTS = SIGNALS.map((sig, i) => buildBacktest(sig.id, i));

const IC_HORIZONS = [5, 10, 21, 63, 126, 252];
function buildICDecay() {
  return SIGNALS.map((sig, si) => {
    const peak = IC_HORIZONS.findIndex(h => h === 21);
    return IC_HORIZONS.reduce((acc, h, hi) => {
      const decay = hi <= peak
        ? sig.ic * (0.6 + 0.4 * (hi / peak))
        : sig.ic * Math.exp(-0.015 * (h - 21) * (0.5 + sr(si * 10 + hi) * 0.5));
      acc[h] = +decay.toFixed(4);
      return acc;
    }, { signal: sig.name, color: sig.color });
  });
}
const IC_DECAY = buildICDecay();

const FF5_FACTORS = ['Market (Rm-Rf)', 'Size (SMB)', 'Value (HML)', 'Profit (RMW)', 'Invest (CMA)'];
function buildFF5() {
  return SIGNALS.map((sig, si) => {
    const loadings = FF5_FACTORS.map((f, fi) => ({
      factor: f,
      beta: +((sr(si * 50 + fi) - 0.5) * 1.4).toFixed(3),
      tstat: +((sr(si * 50 + fi + 30) * 3.5 + 0.5)).toFixed(2),
    }));
    const alpha = +((sig.ic * 0.8 + sr(si * 3) * 0.04) * 100).toFixed(2);
    const alphaTstat = +((sr(si * 7 + 1) * 2 + 1.5)).toFixed(2);
    return { signal: sig.name, color: sig.color, loadings, alpha, alphaTstat };
  });
}
const FF5 = buildFF5();

// ─── Sub-components ────────────────────────────────────────────────────────────

const card = (extra = {}) => ({
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: 20, ...extra
});

const Stat = ({ label, value, sub, color }) => (
  <div style={{ textAlign: 'center', minWidth: 90 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{
    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
    background: color + '18', color, border: `1px solid ${color}40`, fontFamily: T.mono
  }}>{text}</span>
);

// ─── Tab 1: Signal Dashboard ───────────────────────────────────────────────────

function Tab1({ companies }) {
  const [selSig, setSelSig] = useState(0);
  const sig = SIGNALS[selSig];

  const sorted = useMemo(() =>
    [...companies].sort((a, b) => b.signals[sig.id].score - a.signals[sig.id].score),
    [sig.id, companies]
  );
  const longPort  = sorted.slice(0, 10);
  const shortPort = sorted.slice(-10).reverse();
  const totalLongWt  = longPort.reduce((s, c)  => s + c.signals[sig.id].score, 0);
  const totalShortWt = shortPort.reduce((s, c) => s + (100 - c.signals[sig.id].score), 0);

  const histogram = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({ bin: `${i * 10}-${i * 10 + 10}`, count: 0 }));
    companies.forEach(c => {
      const s = c.signals[sig.id].score;
      bins[Math.min(Math.floor(s / 10), 9)].count++;
    });
    return bins;
  }, [sig.id, companies]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Signal cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {SIGNALS.map((s, i) => (
          <div key={s.id} onClick={() => setSelSig(i)} style={{
            ...card(), cursor: 'pointer', borderColor: selSig === i ? s.color : T.border,
            borderLeftWidth: 4, borderLeftColor: s.color, transition: 'all .15s',
            background: selSig === i ? s.color + '08' : T.surface
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{s.name}</div>
              <Badge text={s.status} color={s.status === 'Active' ? T.green : T.amber} />
            </div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10, lineHeight: 1.5 }}>{s.desc}</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div><div style={{ fontSize: 10, color: T.textMut }}>IC (21d)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: T.mono }}>{s.ic.toFixed(3)}</div></div>
              <div><div style={{ fontSize: 10, color: T.textMut }}>Sharpe</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{s.sharpe.toFixed(2)}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ ...card(), display: 'flex', justifyContent: 'space-around', padding: 16 }}>
        <Stat label="Gross Exposure" value="198%" />
        <Stat label="Net Exposure" value={`${Math.round(sr(selSig * 4) * 20 - 10)}%`} />
        <Stat label="L/S Ratio" value="1.02" />
        <Stat label="Active Longs" value="10" color={T.green} />
        <Stat label="Active Shorts" value="10" color={T.red} />
        <Stat label="Avg ESG Floor" value="42" />
      </div>

      {/* Long / Short tables + histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 12 }}>LONG PORTFOLIO — Top 10</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Ticker','Score','Wt%','3M Ret'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: T.textMut, padding: '4px 6px', textAlign: 'right', fontFamily: T.mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {longPort.map(c => {
                const sig_data = c.signals[sig.id];
                const wt = ((sig_data.score / totalLongWt) * 100).toFixed(1);
                return (
                  <tr key={c.ticker} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ fontSize: 11, fontWeight: 600, color: T.navy, padding: '5px 6px', fontFamily: T.mono }}>{c.ticker}</td>
                    <td style={{ fontSize: 11, textAlign: 'right', color: T.text, padding: '5px 6px', fontFamily: T.mono }}>{sig_data.score}</td>
                    <td style={{ fontSize: 11, textAlign: 'right', color: T.text, padding: '5px 6px', fontFamily: T.mono }}>{wt}%</td>
                    <td style={{ fontSize: 11, textAlign: 'right', color: sig_data.ret3m > 0 ? T.green : T.red, padding: '5px 6px', fontFamily: T.mono }}>
                      {(sig_data.ret3m * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 12 }}>SHORT PORTFOLIO — Bottom 10</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Ticker','Score','Wt%','3M Ret'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: T.textMut, padding: '4px 6px', textAlign: 'right', fontFamily: T.mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shortPort.map(c => {
                const sig_data = c.signals[sig.id];
                const wt = (((100 - sig_data.score) / totalShortWt) * 100).toFixed(1);
                return (
                  <tr key={c.ticker} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ fontSize: 11, fontWeight: 600, color: T.navy, padding: '5px 6px', fontFamily: T.mono }}>{c.ticker}</td>
                    <td style={{ fontSize: 11, textAlign: 'right', color: T.red, padding: '5px 6px', fontFamily: T.mono }}>{sig_data.score}</td>
                    <td style={{ fontSize: 11, textAlign: 'right', color: T.text, padding: '5px 6px', fontFamily: T.mono }}>{wt}%</td>
                    <td style={{ fontSize: 11, textAlign: 'right', color: sig_data.ret3m > 0 ? T.green : T.red, padding: '5px 6px', fontFamily: T.mono }}>
                      {(sig_data.ret3m * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>SIGNAL SCORE DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="bin" tick={{ fontSize: 9, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: T.mono }} />
              <Bar dataKey="count" fill={sig.color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 6 }}>Factor Correlation Risk</div>
            {FF5_FACTORS.slice(0, 3).map((f, fi) => {
              const corr = (sr(selSig * 20 + fi) - 0.3) * 0.8;
              return (
                <div key={f} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: T.textMut }}>{f}</span>
                  <span style={{ fontSize: 10, fontFamily: T.mono, color: Math.abs(corr) > 0.3 ? T.amber : T.green }}>
                    ρ={corr.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Backtest Performance ───────────────────────────────────────────────

function Tab2() {
  const [selSig, setSelSig] = useState(0);
  const bt = BACKTESTS[selSig];
  const sig = SIGNALS[selSig];
  const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years  = [2020, 2021, 2022, 2023, 2024, 2025];

  const heatMax = useMemo(() => {
    let mx = 0;
    years.forEach(y => mNames.forEach(m => { if (bt.heatmap[y]?.[m] !== undefined) mx = Math.max(mx, Math.abs(bt.heatmap[y][m])); }));
    return mx || 0.01;
  }, [bt]);

  const benchComp = [
    { metric: 'Ann. Return', signal: bt.stats.annReturn, sp500: +(sr(selSig * 3) * 8 + 4).toFixed(2), msciEsg: +(sr(selSig * 3 + 1) * 6 + 5).toFixed(2), msci: +(sr(selSig * 3 + 2) * 5 + 4.5).toFixed(2) },
    { metric: 'Sharpe',      signal: bt.stats.sharpe,    sp500: +(sr(selSig * 5) * 0.5 + 0.5).toFixed(2), msciEsg: +(sr(selSig * 5 + 1) * 0.4 + 0.6).toFixed(2), msci: +(sr(selSig * 5 + 2) * 0.3 + 0.55).toFixed(2) },
    { metric: 'Max DD',      signal: bt.stats.maxDD,     sp500: -+(sr(selSig * 7) * 15 + 10).toFixed(2), msciEsg: -+(sr(selSig * 7 + 1) * 12 + 8).toFixed(2), msci: -+(sr(selSig * 7 + 2) * 14 + 9).toFixed(2) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Signal selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SIGNALS.map((s, i) => (
          <button key={s.id} onClick={() => setSelSig(i)} style={{
            padding: '6px 14px', borderRadius: 20, border: `1px solid ${selSig === i ? s.color : T.border}`,
            background: selSig === i ? s.color + '18' : T.surface, color: selSig === i ? s.color : T.textSec,
            fontSize: 12, fontWeight: selSig === i ? 700 : 400, cursor: 'pointer', fontFamily: T.font
          }}>{s.name}</button>
        ))}
      </div>

      {/* Cumulative return chart */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>
          Cumulative Return — {sig.name}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={bt.months.filter((_, i) => i % 3 === 0)}>
            <defs>
              {[['long', T.green], ['ls', T.navy], ['bench', T.textMut]].map(([k, c]) => (
                <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: T.mono }} />
            <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ fontSize: 11, fontFamily: T.mono }} formatter={v => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="longCum"  name="Long"       stroke={T.green}   fill={`url(#grad_long)`}  strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="shortCum" name="Short"      stroke={T.red}     fill="none"               strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Area type="monotone" dataKey="lsCum"    name="Long/Short" stroke={T.navy}    fill={`url(#grad_ls)`}    strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="benchCum" name="Benchmark"  stroke={T.textMut} fill={`url(#grad_bench)`} strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats + heatmap row */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>PERFORMANCE METRICS</div>
          {[
            ['Ann. Return', `${bt.stats.annReturn}%`, bt.stats.annReturn > 0 ? T.green : T.red],
            ['Sharpe Ratio', bt.stats.sharpe, bt.stats.sharpe > 1 ? T.green : T.amber],
            ['Sortino Ratio', bt.stats.sortino, T.navy],
            ['Max Drawdown', `${bt.stats.maxDD}%`, T.red],
            ['Calmar Ratio', bt.stats.calmar, T.navy],
            ['Win Rate', `${bt.stats.winRate}%`, T.blue],
            ['Avg Win', `${bt.stats.avgWin}%`, T.green],
            ['Avg Loss', `${bt.stats.avgLoss}%`, T.red],
          ].map(([label, value, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
              <span style={{ fontSize: 12, color: T.textSec }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.mono }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>MONTHLY EXCESS RETURN HEATMAP</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ fontSize: 10, color: T.textMut, width: 40, textAlign: 'left', fontFamily: T.mono }}>Year</th>
                {mNames.map(m => <th key={m} style={{ fontSize: 9, color: T.textMut, textAlign: 'center', fontFamily: T.mono, padding: 2 }}>{m.slice(0,1)}</th>)}
              </tr>
            </thead>
            <tbody>
              {years.map(yr => (
                <tr key={yr}>
                  <td style={{ fontSize: 10, fontWeight: 600, color: T.navy, fontFamily: T.mono, padding: '2px 4px' }}>{yr}</td>
                  {mNames.map(m => {
                    const v = bt.heatmap[yr]?.[m] ?? 0;
                    const intensity = Math.min(1, Math.abs(v) / heatMax);
                    const bg = v > 0 ? `rgba(22,163,74,${0.15 + intensity * 0.55})` : `rgba(220,38,38,${0.15 + intensity * 0.55})`;
                    return (
                      <td key={m} title={`${yr} ${m}: ${(v * 100).toFixed(2)}%`} style={{
                        background: bg, textAlign: 'center', padding: '3px 1px',
                        fontSize: 8, fontFamily: T.mono, color: T.navy,
                        border: `1px solid ${T.border}`, borderRadius: 2
                      }}>{(v * 100).toFixed(1)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark comparison */}
      <div style={card()}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>BENCHMARK COMPARISON</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={benchComp}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: T.font }} />
            <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} />
            <Tooltip contentStyle={{ fontSize: 11, fontFamily: T.mono }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="signal"  name={sig.name}     fill={sig.color} radius={[3,3,0,0]} />
            <Bar dataKey="sp500"   name="S&P 500"      fill={T.textMut} radius={[3,3,0,0]} />
            <Bar dataKey="msciEsg" name="MSCI ESG"     fill={T.sage}    radius={[3,3,0,0]} />
            <Bar dataKey="msci"    name="MSCI World"   fill={T.borderL} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 3: Factor Attribution ─────────────────────────────────────────────────

function Tab3() {
  const rollingAlpha = useMemo(() => {
    const months = Array.from({ length: 60 }, (_, i) => {
      const yr = 2020 + Math.floor((i + 12) / 12);
      const mo = ((i + 12) % 12);
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return {
        date: `${yr}-${String(mo + 1).padStart(2,'0')}`,
        ...SIGNALS.slice(0, 3).reduce((acc, sig, si) => {
          acc[sig.id] = +((sr(si * 200 + i) - 0.45) * 0.08 + sig.ic * 0.4).toFixed(4);
          return acc;
        }, {})
      };
    });
    return months;
  }, []);

  const factorExposure = useMemo(() => {
    return FF5_FACTORS.map((factor, fi) => {
      const row = { factor };
      SIGNALS.forEach((sig, si) => { row[sig.id] = FF5[si].loadings[fi].beta; });
      return row;
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* FF5 table */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
          FAMA-FRENCH 5-FACTOR REGRESSION — All Signals
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ fontSize: 11, color: T.textSec, padding: '8px 12px', textAlign: 'left', fontFamily: T.font, fontWeight: 600 }}>Factor</th>
                {SIGNALS.map(s => (
                  <th key={s.id} colSpan={2} style={{ fontSize: 11, color: s.color, padding: '8px 8px', textAlign: 'center', fontFamily: T.font, fontWeight: 700 }}>
                    {s.name}
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ fontSize: 10, color: T.textMut, padding: '4px 12px', textAlign: 'left', fontFamily: T.mono }}></th>
                {SIGNALS.map(s => (
                  <React.Fragment key={s.id}>
                    <th style={{ fontSize: 9, color: T.textMut, textAlign: 'center', fontFamily: T.mono }}>β</th>
                    <th style={{ fontSize: 9, color: T.textMut, textAlign: 'center', fontFamily: T.mono }}>t</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {FF5_FACTORS.map((factor, fi) => (
                <tr key={factor} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ fontSize: 11, color: T.textSec, padding: '7px 12px', fontFamily: T.font }}>{factor}</td>
                  {FF5.map((s, si) => {
                    const l = s.loadings[fi];
                    const sig = Math.abs(l.tstat) > 1.96;
                    return (
                      <React.Fragment key={si}>
                        <td style={{ fontSize: 11, textAlign: 'center', fontFamily: T.mono, color: l.beta > 0 ? T.navy : T.red, fontWeight: sig ? 700 : 400, padding: '7px 6px' }}>{l.beta}</td>
                        <td style={{ fontSize: 10, textAlign: 'center', fontFamily: T.mono, color: sig ? T.amber : T.textMut, padding: '7px 6px' }}>{l.tstat}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              <tr style={{ borderTop: `2px solid ${T.border}`, background: T.surfaceH }}>
                <td style={{ fontSize: 11, fontWeight: 700, color: T.navy, padding: '8px 12px', fontFamily: T.font }}>Alpha (α) %ann.</td>
                {FF5.map((s, si) => (
                  <React.Fragment key={si}>
                    <td style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', fontFamily: T.mono, color: T.green, padding: '8px 6px' }}>{s.alpha}%</td>
                    <td style={{ fontSize: 10, textAlign: 'center', fontFamily: T.mono, color: T.amber, padding: '8px 6px' }}>{s.alphaTstat}</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Factor exposure + rolling alpha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>FACTOR EXPOSURE — All Signals</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={factorExposure}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="factor" tick={{ fontSize: 8, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ fontSize: 10, fontFamily: T.mono }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <ReferenceLine y={0} stroke={T.border} />
              {SIGNALS.map(s => <Bar key={s.id} dataKey={s.id} name={s.name} fill={s.color} radius={[2,2,0,0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>ROLLING 12M ALPHA — Top 3 Signals</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rollingAlpha.filter((_, i) => i % 2 === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} tickFormatter={v => `${(v * 100).toFixed(1)}%`} />
              <Tooltip contentStyle={{ fontSize: 10, fontFamily: T.mono }} formatter={v => `${(v * 100).toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke={T.border} />
              {SIGNALS.slice(0, 3).map(s => (
                <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Crowding risk */}
      <div style={card()}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>CROWDING RISK — ESG ETF Overlap</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {SIGNALS.map((s, si) => {
            const overlap = +(sr(si * 13 + 3) * 50 + 20).toFixed(1);
            const level = overlap > 55 ? T.red : overlap > 40 ? T.amber : T.green;
            return (
              <div key={s.id} style={{ padding: 12, background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${level}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{s.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textMut }}>ETF overlap</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: level, fontFamily: T.mono }}>{overlap}%</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>
                  {overlap > 55 ? 'High crowding — alpha dilution risk' : overlap > 40 ? 'Moderate — monitor' : 'Low crowding — alpha preserved'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: IC Decay & Signal Quality ─────────────────────────────────────────

function Tab4() {
  const icDecayData = useMemo(() =>
    IC_HORIZONS.map((h, hi) => {
      const row = { horizon: `${h}d` };
      IC_DECAY.forEach((s, si) => { row[SIGNALS[si].id] = s[h]; });
      return row;
    }), []);

  const icStability = useMemo(() => {
    return SIGNALS.map((sig, si) => {
      const monthly = Array.from({ length: 72 }, (_, i) => ({
        month: i,
        ic: +((sr(si * 500 + i) - 0.45) * sig.ic * 4 + sig.ic * 0.8).toFixed(4)
      }));
      const mean = monthly.reduce((s, r) => s + r.ic, 0) / 72;
      const std  = Math.sqrt(monthly.reduce((s, r) => s + (r.ic - mean) ** 2, 0) / 72);
      return { signal: sig.name, color: sig.color, icMean: mean.toFixed(4), icStd: std.toFixed(4), icRankIC: (mean * 0.9 + sr(si * 3) * 0.02).toFixed(4), turnover: +(sr(si * 7 + 2) * 25 + 10).toFixed(1) };
    });
  }, []);

  const tcImpact = useMemo(() =>
    SIGNALS.map((sig, si) => {
      const grossSharpe = sig.sharpe;
      return {
        signal: sig.name,
        color:  sig.color,
        gross:  grossSharpe,
        net5:   +(grossSharpe - icStability[si].turnover * 0.0005 * 12).toFixed(2),
        net10:  +(grossSharpe - icStability[si].turnover * 0.001 * 12).toFixed(2),
        net20:  +(grossSharpe - icStability[si].turnover * 0.002 * 12).toFixed(2),
      };
    }), [icStability]);

  const comboCurves = useMemo(() => {
    const ic1 = SIGNALS[0].ic, ic2 = SIGNALS[2].ic, ic3 = SIGNALS[4].ic;
    const corrs = [0.1, 0.2, 0.3, 0.4, 0.5];
    return corrs.map(rho => ({
      corr: rho,
      combo2: +Math.sqrt((ic1 ** 2 + ic2 ** 2 + 2 * rho * ic1 * ic2) / (1 + rho)).toFixed(4),
      combo3: +Math.sqrt((ic1 ** 2 + ic2 ** 2 + ic3 ** 2 + 2 * rho * (ic1 * ic2 + ic1 * ic3 + ic2 * ic3)) / (1 + 2 * rho)).toFixed(4),
    }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* IC decay chart */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>IC DECAY — All Signals vs Holding Horizon</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={icDecayData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="horizon" tick={{ fontSize: 10, fontFamily: T.mono }} />
            <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} domain={[0, 0.2]} />
            <Tooltip contentStyle={{ fontSize: 10, fontFamily: T.mono }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {SIGNALS.map(s => (
              <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 4, fill: s.color }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* IC quality table */}
      <div style={card()}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>SIGNAL QUALITY — IC Statistics & Turnover</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
              {['Signal', 'IC (Pearson)', 'Rank IC (Spearman)', 'IC Std Dev', 'IC/Std', 'Turnover %/mo', 'Divergence'].map(h => (
                <th key={h} style={{ fontSize: 10, color: T.textSec, padding: '8px 12px', textAlign: h === 'Signal' ? 'left' : 'right', fontFamily: T.font }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {icStability.map((row, i) => {
              const icRatio = (row.icMean / row.icStd).toFixed(2);
              const div = Math.abs(row.icMean - row.icRankIC);
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ fontSize: 12, fontWeight: 700, color: row.color, padding: '8px 12px', fontFamily: T.font }}>{row.signal}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: T.navy, padding: '8px 12px' }}>{row.icMean}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: T.navy, padding: '8px 12px' }}>{row.icRankIC}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: T.textSec, padding: '8px 12px' }}>{row.icStd}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: parseFloat(icRatio) > 0.5 ? T.green : T.amber, padding: '8px 12px' }}>{icRatio}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: row.turnover > 25 ? T.red : T.navy, padding: '8px 12px' }}>{row.turnover}%</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: div > 0.01 ? T.amber : T.green, padding: '8px 12px' }}>{div.toFixed(4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TC impact + signal combo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>TRANSACTION COST IMPACT — Net Sharpe</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Signal', 'Gross', '5bps', '10bps', '20bps'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: T.textMut, padding: '6px 8px', textAlign: 'right', fontFamily: T.mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tcImpact.map(row => (
                <tr key={row.signal} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ fontSize: 11, fontWeight: 600, color: row.color, padding: '6px 8px', fontFamily: T.font }}>{row.signal}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: T.navy, padding: '6px 8px' }}>{row.gross}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: row.net5 > 0.5 ? T.green : T.amber, padding: '6px 8px' }}>{row.net5}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: row.net10 > 0.5 ? T.green : T.amber, padding: '6px 8px' }}>{row.net10}</td>
                  <td style={{ fontSize: 11, textAlign: 'right', fontFamily: T.mono, color: row.net20 > 0.3 ? T.amber : T.red, padding: '6px 8px' }}>{row.net20}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>SIGNAL COMBINATION — IC Improvement</div>
          <div style={{ fontSize: 10, color: T.textMut, marginBottom: 12 }}>Theoretical IC vs cross-signal correlation (ESG Mom + Disc Quality + SBTi)</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={comboCurves}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="corr" tick={{ fontSize: 9, fontFamily: T.mono }} tickFormatter={v => `ρ=${v}`} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} domain={[0.05, 0.25]} />
              <Tooltip contentStyle={{ fontSize: 10, fontFamily: T.mono }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="combo2" name="2-Signal Combo" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="combo3" name="3-Signal Combo" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
              <ReferenceLine y={SIGNALS[0].ic} stroke={T.sage} strokeDasharray="4 2" label={{ value: 'Single IC', fontSize: 9, fill: T.sage }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: Portfolio Constructor ──────────────────────────────────────────────

function Tab5({ companies }) {
  const [weights, setWeights]     = useState({ esg_mom: 30, sbti_init: 30, disc_up: 20, narr_tone: 20, cont_rev: 0, gw_rev: 0 });
  const [sectorNeutral, setSectorNeutral] = useState(false);
  const [esgFloor, setEsgFloor]   = useState(40);
  const [maxSingle, setMaxSingle] = useState(5);

  const totalWt = Object.values(weights).reduce((s, v) => s + v, 0);

  const compositeScores = useMemo(() => {
    return companies
      .filter(c => {
        const avgEsg = Object.values(c.signals).reduce((s, sig) => s + sig.esgScore, 0) / SIGNALS.length;
        return avgEsg >= esgFloor;
      })
      .map(c => {
        let score = 0;
        SIGNALS.forEach(sig => {
          const wt = (weights[sig.id] || 0) / (totalWt || 1);
          score += wt * c.signals[sig.id].score;
        });
        const avgEsg = Object.values(c.signals).reduce((s, sig) => s + sig.esgScore, 0) / SIGNALS.length;
        return { ...c, compositeScore: +score.toFixed(1), avgEsg: Math.round(avgEsg) };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [companies, weights, totalWt, esgFloor]);

  const longList  = compositeScores.slice(0, 8);
  const shortList = compositeScores.slice(-8).reverse();

  const longTotal  = longList.reduce((s, c) => s + c.compositeScore, 0);
  const shortTotal = shortList.reduce((s, c) => s + (100 - c.compositeScore), 0);

  const portfolio = useMemo(() => {
    const positions = [
      ...longList.map(c => ({
        ...c,
        direction: 'long',
        wt: Math.min(maxSingle, +((c.compositeScore / longTotal) * 50).toFixed(1))
      })),
      ...shortList.map(c => ({
        ...c,
        direction: 'short',
        wt: -Math.min(maxSingle, +(((100 - c.compositeScore) / shortTotal) * 50).toFixed(1))
      }))
    ];
    return positions;
  }, [longList, shortList, longTotal, shortTotal, maxSingle]);

  const portStats = useMemo(() => {
    const diversRatio = +(1.2 + Object.values(weights).filter(w => w > 0).length * 0.15).toFixed(2);
    const expSharpe = +(SIGNALS.reduce((s, sig) => s + (weights[sig.id] || 0) / 100 * sig.sharpe, 0) * 1.1).toFixed(2);
    const riskContrib = SIGNALS.map(sig => ({
      signal: sig.name,
      color:  sig.color,
      contrib: +((weights[sig.id] || 0) / (totalWt || 1) * 100).toFixed(1),
    })).filter(r => r.contrib > 0);
    return { diversRatio, expSharpe, riskContrib };
  }, [weights, totalWt]);

  const handleWeight = (sigId, val) => {
    const newVal = Math.max(0, Math.min(100, parseInt(val) || 0));
    setWeights(prev => ({ ...prev, [sigId]: newVal }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Signal weight sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>SIGNAL WEIGHTS</div>
            <Badge text={`Total: ${totalWt}%`} color={Math.abs(totalWt - 100) < 1 ? T.green : T.amber} />
          </div>
          {SIGNALS.map(sig => (
            <div key={sig.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: sig.color }}>{sig.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{weights[sig.id]}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={weights[sig.id]}
                onChange={e => handleWeight(sig.id, e.target.value)}
                style={{ width: '100%', accentColor: sig.color, cursor: 'pointer' }} />
            </div>
          ))}
        </div>

        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>CONSTRAINTS & PORTFOLIO STATS</div>
          {/* Constraints */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Constraints</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <input type="checkbox" checked={sectorNeutral} onChange={e => setSectorNeutral(e.target.checked)} id="sn" />
              <label htmlFor="sn" style={{ fontSize: 12, color: T.text, cursor: 'pointer' }}>Sector Neutral Portfolio</label>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max single-name weight: <b style={{ fontFamily: T.mono }}>{maxSingle}%</b></div>
              <input type="range" min={2} max={15} step={1} value={maxSingle} onChange={e => setMaxSingle(+e.target.value)}
                style={{ width: '100%', accentColor: T.navy, cursor: 'pointer' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>ESG floor score: <b style={{ fontFamily: T.mono }}>{esgFloor}</b></div>
              <input type="range" min={0} max={80} step={5} value={esgFloor} onChange={e => setEsgFloor(+e.target.value)}
                style={{ width: '100%', accentColor: T.sage, cursor: 'pointer' }} />
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <Stat label="Exp. Sharpe"    value={portStats.expSharpe} color={T.green} />
            <Stat label="Divers. Ratio"  value={portStats.diversRatio} />
            <Stat label="Max Name Wt"    value={`${maxSingle}%`} color={T.amber} />
          </div>
          {/* Risk contribution bar */}
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Risk Attribution by Signal</div>
          {portStats.riskContrib.map(r => (
            <div key={r.signal} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: r.color }}>{r.signal}</span>
                <span style={{ fontSize: 10, fontFamily: T.mono, color: T.navy }}>{r.contrib}%</span>
              </div>
              <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${r.contrib}%`, height: '100%', background: r.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position table */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
          EXPORT-READY POSITION TABLE ({portfolio.length} positions | {compositeScores.length} eligible after ESG floor ≥{esgFloor})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                {['Ticker', 'Company', 'Sector', 'Direction', 'Composite Score', 'Weight', 'ESG Score'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: T.textSec, padding: '8px 12px', textAlign: h === 'Ticker' || h === 'Company' || h === 'Sector' || h === 'Direction' ? 'left' : 'right', fontFamily: T.font }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.map((pos, i) => (
                <tr key={pos.ticker + i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ fontSize: 12, fontWeight: 700, color: T.navy, padding: '7px 12px', fontFamily: T.mono }}>{pos.ticker}</td>
                  <td style={{ fontSize: 11, color: T.text, padding: '7px 12px' }}>{pos.name}</td>
                  <td style={{ fontSize: 11, color: T.textSec, padding: '7px 12px' }}>{pos.sector}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <Badge text={pos.direction.toUpperCase()} color={pos.direction === 'long' ? T.green : T.red} />
                  </td>
                  <td style={{ fontSize: 12, textAlign: 'right', fontFamily: T.mono, color: T.navy, padding: '7px 12px', fontWeight: 700 }}>{pos.compositeScore}</td>
                  <td style={{ fontSize: 12, textAlign: 'right', fontFamily: T.mono, color: Math.abs(pos.wt) > maxSingle * 0.9 ? T.amber : T.navy, padding: '7px 12px' }}>{pos.wt}%</td>
                  <td style={{ fontSize: 12, textAlign: 'right', fontFamily: T.mono, color: pos.avgEsg >= 60 ? T.green : pos.avgEsg >= 40 ? T.amber : T.red, padding: '7px 12px' }}>{pos.avgEsg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SentimentAlphaEnginePage() {
  const [tab, setTab] = useState(0);
  const companies = useMemo(() => COMPANIES, []);

  const TABS = [
    { label: 'Signal Dashboard',     idx: 0 },
    { label: 'Backtest Performance', idx: 1 },
    { label: 'Factor Attribution',   idx: 2 },
    { label: 'IC Decay & Quality',   idx: 3 },
    { label: 'Portfolio Constructor',idx: 4 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 11, fontFamily: T.mono, color: T.gold, letterSpacing: 2 }}>EP-BZ2</div>
            <div style={{ width: 1, height: 20, background: T.gold + '40' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>Sentiment Alpha Engine</div>
            <div style={{ fontSize: 11, color: T.gold + 'aa', fontFamily: T.mono }}>ESG Signals → Investable Alpha</div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Stat label="Active Signals" value="5" color={T.gold} />
            <Stat label="Avg IC (21d)" value="0.119" color={T.goldL} />
            <Stat label="Best Sharpe" value="1.34" color={T.goldL} />
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.idx} onClick={() => setTab(t.idx)} style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font,
              background: tab === t.idx ? T.gold : 'transparent',
              color: tab === t.idx ? T.navy : T.gold + 'aa',
              fontWeight: tab === t.idx ? 700 : 400,
              borderRadius: '4px 4px 0 0',
              transition: 'all .15s'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
        {tab === 0 && <Tab1 companies={companies} />}
        {tab === 1 && <Tab2 />}
        {tab === 2 && <Tab3 />}
        {tab === 3 && <Tab4 />}
        {tab === 4 && <Tab5 companies={companies} />}
      </div>

      {/* Status bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.navy, borderTop: `1px solid ${T.gold}40`, padding: '4px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: T.mono, color: T.gold }}>EP-BZ2</span>
        <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut }}>SENTIMENT ALPHA ENGINE</span>
        <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut }}>6 signals · 25 companies · 72M backtest · FF5 attribution</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: T.mono, color: T.gold }}>LIVE — 2026-04-04</span>
      </div>
    </div>
  );
}
