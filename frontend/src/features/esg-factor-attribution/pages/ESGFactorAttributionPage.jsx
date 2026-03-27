import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PURPLE = '#7c3aed';
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const FACTORS = [
  { factor: 'ESG Momentum',       return1Y: 4.82,  sharpe: 1.21, information_ratio: 0.91, t_stat: 3.42, crowding: 71, exposure: 0.38, active_weight: 0.12 },
  { factor: 'Green Revenue',      return1Y: 3.57,  sharpe: 0.98, information_ratio: 0.74, t_stat: 2.87, crowding: 58, exposure: 0.29, active_weight: 0.09 },
  { factor: 'Carbon Efficiency',  return1Y: 2.91,  sharpe: 0.84, information_ratio: 0.68, t_stat: 2.54, crowding: 63, exposure: 0.33, active_weight: 0.11 },
  { factor: 'Governance Quality', return1Y: 2.14,  sharpe: 0.76, information_ratio: 0.61, t_stat: 2.31, crowding: 44, exposure: 0.25, active_weight: 0.07 },
  { factor: 'Social Capital',     return1Y: 1.68,  sharpe: 0.62, information_ratio: 0.49, t_stat: 1.92, crowding: 39, exposure: 0.21, active_weight: 0.06 },
  { factor: 'Controversy Filter', return1Y: -0.43, sharpe: 0.31, information_ratio: -0.18, t_stat: -0.71, crowding: 27, exposure: 0.15, active_weight: -0.02 },
  { factor: 'SDG Alignment',      return1Y: 3.22,  sharpe: 0.91, information_ratio: 0.72, t_stat: 2.76, crowding: 55, exposure: 0.31, active_weight: 0.10 },
  { factor: 'Transition Leader',  return1Y: 5.41,  sharpe: 1.34, information_ratio: 1.02, t_stat: 3.89, crowding: 78, exposure: 0.44, active_weight: 0.15 },
];

const ATTRIBUTION_DATA = [
  { sector: 'Technology',      esgContrib: 48, carbonContrib: 22, govContrib: 14, socialContrib: 9,  total: 93  },
  { sector: 'Utilities',       esgContrib: 31, carbonContrib: 41, govContrib: 8,  socialContrib: 5,  total: 85  },
  { sector: 'Industrials',     esgContrib: 22, carbonContrib: 18, govContrib: 11, socialContrib: 7,  total: 58  },
  { sector: 'Financials',      esgContrib: 19, carbonContrib: 6,  govContrib: 23, socialContrib: 12, total: 60  },
  { sector: 'Materials',       esgContrib: 14, carbonContrib: 29, govContrib: 7,  socialContrib: 3,  total: 53  },
  { sector: 'Healthcare',      esgContrib: 18, carbonContrib: 5,  govContrib: 9,  socialContrib: 21, total: 53  },
  { sector: 'Consumer Disc.',  esgContrib: 12, carbonContrib: 8,  govContrib: 10, socialContrib: 15, total: 45  },
  { sector: 'Real Estate',     esgContrib: -4, carbonContrib: -9, govContrib: 3,  socialContrib: 2,  total: -8  },
  { sector: 'Energy',          esgContrib: -11,carbonContrib: -18,govContrib: 5,  socialContrib: 4,  total: -20 },
  { sector: 'Consumer Stap.',  esgContrib: 9,  carbonContrib: 4,  govContrib: 7,  socialContrib: 11, total: 31  },
];

const ALPHA_TREND = Array.from({ length: 24 }, (_, i) => {
  const base = i * 8.2 + sr(i * 7) * 18 - 4;
  return {
    month: i + 1,
    label: `M${i + 1}`,
    esgAlpha: +Math.max(0, base + sr(i * 3) * 12).toFixed(1),
    benchmark: +(i * 1.1 + sr(i * 11) * 6).toFixed(1),
    rollingIR: +(0.5 + sr(i * 5) * 0.7).toFixed(2),
  };
});

const CROWDING_DATA = [
  { factor: 'Transition Leader',  crowding: 78, zScore: 1.84  },
  { factor: 'ESG Momentum',       crowding: 71, zScore: 1.52  },
  { factor: 'Carbon Efficiency',  crowding: 63, zScore: 1.11  },
  { factor: 'Green Revenue',      crowding: 58, zScore: 0.87  },
  { factor: 'SDG Alignment',      crowding: 55, zScore: 0.74  },
  { factor: 'Governance Quality', crowding: 44, zScore: 0.21  },
  { factor: 'Social Capital',     crowding: 39, zScore: -0.08 },
  { factor: 'Controversy Filter', crowding: 27, zScore: -0.62 },
];

const STYLE_PURITY = [
  { style: 'Environmental (E)', value: 41, color: T.green },
  { style: 'Social (S)',        value: 22, color: T.teal  },
  { style: 'Governance (G)',    value: 19, color: T.gold  },
  { style: 'Multi-Factor',      value: 18, color: PURPLE  },
];

const STYLE_DRIFT = Array.from({ length: 12 }, (_, i) => ({
  month: `M${i + 1}`,
  E: +(38 + sr(i * 2) * 8).toFixed(1),
  S:  +(21 + sr(i * 4) * 5).toFixed(1),
  G:  +(20 + sr(i * 6) * 4).toFixed(1),
  Multi: +(100 - (38 + sr(i * 2) * 8) - (21 + sr(i * 4) * 5) - (20 + sr(i * 6) * 4)).toFixed(1),
}));

const TABS = ['Overview', 'Factor Decomposition', 'ESG Alpha', 'Factor Crowding', 'Style Purity'];

const Stat = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, letterSpacing: '-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Badge = ({ v }) => {
  const col = v >= 70 ? T.red : v >= 50 ? T.amber : T.green;
  return <span style={{ background: col + '18', color: col, border: `1px solid ${col}40`, borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{v}</span>;
};

const IRBadge = ({ v }) => {
  const col = v >= 0.7 ? T.green : v >= 0.4 ? T.amber : T.red;
  return <span style={{ background: col + '18', color: col, border: `1px solid ${col}40`, borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{v.toFixed(2)}</span>;
};

export default function ESGFactorAttributionPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PURPLE }} />
            <span style={{ fontSize: 11, color: T.textMut, letterSpacing: '0.08em', textTransform: 'uppercase' }}>EP-AB4 · ESG Factor Attribution</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0, letterSpacing: '-0.5px' }}>ESG Factor Attribution Engine</h1>
          <p style={{ fontSize: 13, color: T.textSec, margin: '4px 0 0' }}>Decompose portfolio returns into systematic ESG factor exposures — momentum, carbon, governance, social, and transition signals.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Rerun Model', 'Export Report'].map(lbl => (
            <button key={lbl} style={{ background: lbl === 'Rerun Model' ? PURPLE : T.surface, color: lbl === 'Rerun Model' ? '#fff' : T.text, border: `1px solid ${lbl === 'Rerun Model' ? PURPLE : T.border}`, borderRadius: 7, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: tab === i ? 700 : 500, color: tab === i ? PURPLE : T.textSec, borderBottom: tab === i ? `2px solid ${PURPLE}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <Stat label="ESG Alpha YTD" value="+187 bps" sub="vs. cap-weighted benchmark" color={T.green} />
            <Stat label="Information Ratio" value="0.84" sub="12-month trailing" color={PURPLE} />
            <Stat label="Active ESG Factors" value="8" sub="systematic + style" />
            <Stat label="Factor Crowding" value="62nd pct" sub="portfolio-weighted avg" color={T.amber} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Factor Returns Bar */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Factor 1Y Return Contribution (%)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={FACTORS} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: T.textSec }} width={120} />
                  <Tooltip contentStyle={tip} formatter={v => [`${v}%`, 'Return']} />
                  <Bar dataKey="return1Y" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {FACTORS.map((f, i) => (
                      <Cell key={i} fill={f.return1Y >= 0 ? PURPLE : T.red} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attribution by Sector Table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Attribution by Sector (bps)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Sector', 'ESG', 'Carbon', 'Gov', 'Social', 'Total'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Sector' ? 'left' : 'right', color: T.textMut, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ATTRIBUTION_DATA.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.bg }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.text }}>{row.sector}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: row.esgContrib >= 0 ? T.green : T.red }}>{row.esgContrib > 0 ? '+' : ''}{row.esgContrib}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: row.carbonContrib >= 0 ? T.teal : T.red }}>{row.carbonContrib > 0 ? '+' : ''}{row.carbonContrib}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textSec }}>{row.govContrib > 0 ? '+' : ''}{row.govContrib}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textSec }}>{row.socialContrib > 0 ? '+' : ''}{row.socialContrib}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: row.total >= 0 ? PURPLE : T.red }}>{row.total > 0 ? '+' : ''}{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Factor Decomposition ── */}
      {tab === 1 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Factor Metrics — Full Decomposition</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Factor', '1Y Return', 'Sharpe', 'Info Ratio', 'T-Stat', 'Crowding', 'Exposure', 'Active Wt'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Factor' ? 'left' : 'right', color: T.textMut, fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FACTORS.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.bg }}>
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: T.navy }}>{f.factor}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: f.return1Y >= 0 ? T.green : T.red, fontWeight: 600 }}>{f.return1Y > 0 ? '+' : ''}{f.return1Y.toFixed(2)}%</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: T.textSec }}>{f.sharpe.toFixed(2)}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right' }}><IRBadge v={f.information_ratio} /></td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: Math.abs(f.t_stat) >= 2 ? T.green : T.amber, fontWeight: 600 }}>{f.t_stat.toFixed(2)}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right' }}><Badge v={f.crowding} /></td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: T.textSec }}>{f.exposure.toFixed(2)}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: f.active_weight >= 0 ? PURPLE : T.red }}>{f.active_weight > 0 ? '+' : ''}{(f.active_weight * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Factor Exposure Profile</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={FACTORS} margin={{ left: 10, right: 20, top: 4, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="factor" tick={{ fontSize: 9, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[0, 0.6]} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="exposure" name="Exposure" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {FACTORS.map((_, i) => (
                    <Cell key={i} fill={PURPLE} fillOpacity={0.7 + i * 0.04} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── ESG Alpha ── */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Cumulative ESG Alpha vs Benchmark (bps)</div>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>24-month rolling window — portfolio vs. cap-weighted index</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={ALPHA_TREND} margin={{ left: 5, right: 10, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="alphGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="bmkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.textMut} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={T.textMut} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.textMut }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}`} />
                <Tooltip contentStyle={tip} formatter={v => [`${v} bps`]} />
                <Area type="monotone" dataKey="benchmark" name="Benchmark" stroke={T.textMut} strokeWidth={1.5} fill="url(#bmkGrad)" strokeDasharray="4 3" />
                <Area type="monotone" dataKey="esgAlpha" name="ESG Alpha" stroke={PURPLE} strokeWidth={2} fill="url(#alphGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Rolling 12-Month Information Ratio</div>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>IR above 0.50 signals statistically consistent ESG alpha generation</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ALPHA_TREND} margin={{ left: 5, right: 10, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.textMut }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[0, 1.4]} />
                <Tooltip contentStyle={tip} formatter={v => [v.toFixed(2), 'IR']} />
                <Line type="monotone" dataKey="rollingIR" name="Rolling IR" stroke={T.teal} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
              {[['Current IR', '0.84'], ['Peak IR', '1.18'], ['Avg IR', '0.76'], ['Months IR>0.5', '19 / 24']].map(([lbl, val]) => (
                <div key={lbl} style={{ flex: 1, background: T.bg, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textMut }}>{lbl}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.teal }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Factor Crowding ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <Stat label="Portfolio Crowding" value="62nd pct" sub="Elevated — monitor closely" color={T.amber} />
            <Stat label="Most Crowded Factor" value="Transition" sub="78th pct crowding score" color={T.red} />
            <Stat label="Least Crowded" value="Controversy" sub="27th pct — contrarian signal" color={T.green} />
            <Stat label="High Crowding Flags" value="2 factors" sub="Above 70th percentile" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Crowding Score by Factor (0–100)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={CROWDING_DATA} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: T.textSec }} width={130} />
                  <Tooltip contentStyle={tip} formatter={v => [v, 'Crowding Score']} />
                  <Bar dataKey="crowding" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {CROWDING_DATA.map((d, i) => (
                      <Cell key={i} fill={d.crowding >= 70 ? T.red : d.crowding >= 50 ? T.amber : T.green} fillOpacity={0.82} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Crowding Risk Flags</div>
              {CROWDING_DATA.map((d, i) => {
                const flag = d.crowding >= 70 ? 'HIGH' : d.crowding >= 50 ? 'MODERATE' : 'LOW';
                const col = d.crowding >= 70 ? T.red : d.crowding >= 50 ? T.amber : T.green;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < CROWDING_DATA.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{d.factor}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>z-score: {d.zScore > 0 ? '+' : ''}{d.zScore.toFixed(2)}</div>
                    </div>
                    <span style={{ background: col + '18', color: col, border: `1px solid ${col}40`, borderRadius: 5, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>{flag}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Style Purity ── */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>ESG Style Exposure Breakdown</div>
              {STYLE_PURITY.map((s, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.style}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}%</span>
                  </div>
                  <div style={{ height: 10, background: T.border, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 6, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '10px 14px', background: T.bg, borderRadius: 8, fontSize: 11, color: T.textSec }}>
                <strong style={{ color: T.text }}>Style Purity Score: 78 / 100</strong> — Portfolio maintains clear E-led tilt with well-diversified ESG factor mix. No significant style drift detected over the last 3 months.
              </div>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Style Drift Analysis — 12-Month Rolling (%)</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 14 }}>Tracks month-to-month shift in E / S / G / Multi-Factor allocation</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={STYLE_DRIFT} margin={{ left: 5, right: 10, top: 4, bottom: 4 }}>
                  <defs>
                    {[['E', T.green], ['S', T.teal], ['G', T.gold], ['Multi', PURPLE]].map(([k, c]) => (
                      <linearGradient key={k} id={`sg${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={c} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => `${v}%`} domain={[0, 55]} />
                  <Tooltip contentStyle={tip} formatter={v => [`${v}%`]} />
                  <Area type="monotone" dataKey="E" name="Environmental" stroke={T.green} strokeWidth={2} fill="url(#sgE)" />
                  <Area type="monotone" dataKey="S" name="Social" stroke={T.teal} strokeWidth={2} fill="url(#sgS)" />
                  <Area type="monotone" dataKey="G" name="Governance" stroke={T.gold} strokeWidth={2} fill="url(#sgG)" />
                  <Area type="monotone" dataKey="Multi" name="Multi-Factor" stroke={PURPLE} strokeWidth={2} fill="url(#sgMulti)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Style Drift Risk Assessment</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'E-Factor Drift', value: '±2.1%', status: 'Stable', color: T.green },
                { label: 'S-Factor Drift', value: '±1.4%', status: 'Stable', color: T.green },
                { label: 'G-Factor Drift', value: '±1.8%', status: 'Stable', color: T.green },
                { label: 'Multi-Factor Drift', value: '±3.2%', status: 'Watch', color: T.amber },
              ].map((item, i) => (
                <div key={i} style={{ background: T.bg, borderRadius: 9, padding: '12px 14px', borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: item.color, fontWeight: 600, marginTop: 3 }}>{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
