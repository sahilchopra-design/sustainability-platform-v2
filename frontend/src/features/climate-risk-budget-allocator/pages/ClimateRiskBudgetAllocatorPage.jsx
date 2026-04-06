import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Cell, CartesianGrid,
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

function sr(seed) { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; }; }

const TABS = ['Risk Budget Dashboard', 'Factor Decomposition', 'Marginal Contributions', 'What-If Scenarios', 'Budget Utilization'];
const SECTORS = ['Energy', 'Utilities', 'Materials', 'Industrials', 'Financials', 'Tech', 'Healthcare', 'Real Estate'];
const FACTORS = ['Carbon Price', 'Stranded Asset', 'Tech Disruption', 'Regulatory Change', 'Physical Acute', 'Physical Chronic', 'Litigation'];
const GEOS = ['US', 'EU', 'APAC', 'EM'];
const MONTHS = ['Apr 25','May 25','Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26'];

/* ── seed data ──────────────────────────────────────────────── */
const r1 = sr(42);
const sectorBudgets = SECTORS.map(s => ({
  sector: s,
  transition: +(2 + r1() * 5).toFixed(2),
  physical: +(0.8 + r1() * 2.5).toFixed(2),
  litigation: +(0.2 + r1() * 1.2).toFixed(2),
}));
sectorBudgets.forEach(s => { s.total = +(s.transition + s.physical + s.litigation).toFixed(2); });

const r2 = sr(77);
const factorData = FACTORS.map(f => ({
  factor: f,
  contribution: +(2 + r2() * 8).toFixed(2),
  volatility: +(8 + r2() * 22).toFixed(1),
}));

const r3 = sr(101);
const corrMatrix = FACTORS.map((_, i) => FACTORS.map((_, j) => {
  if (i === j) return 1;
  const v = +(r3() * 1.4 - 0.3).toFixed(2);
  return Math.max(-1, Math.min(1, v));
}));

const HOLDINGS = [
  'ExxonMobil','Chevron','NextEra Energy','Duke Energy','Rio Tinto',
  'BHP Group','Caterpillar','Siemens Energy','JPMorgan Chase','HSBC',
  'Microsoft','Apple','Pfizer','Prologis','TotalEnergies','Shell',
];
const r4 = sr(200);
const holdings = HOLDINGS.map(name => {
  const wt = +(1.5 + r4() * 8).toFixed(2);
  const cvar = +(0.3 + r4() * 5.5).toFixed(2);
  const mctr = +(cvar / wt * (0.8 + r4() * 0.5)).toFixed(3);
  const rr = +(0.4 + r4() * 1.8).toFixed(2);
  const pct = +(cvar / 38.2 * 100).toFixed(1);
  return { name, wt, cvar, mctr, rr, pct };
}).sort((a, b) => b.mctr - a.mctr);

const r5 = sr(303);
const factorVol = MONTHS.map(m => {
  const row = { month: m };
  FACTORS.forEach(f => { row[f] = +(5 + r5() * 25).toFixed(1); });
  return row;
});

const r6 = sr(404);
const utilHistory = MONTHS.map(m => ({
  month: m,
  utilized: +(30 + r6() * 12).toFixed(1),
  budget: 45,
}));

const breaches = [
  { date: '2025-08-12', factor: 'Carbon Price', over: 2.3, resolution: 'Reduced energy weight by 3%' },
  { date: '2025-10-05', factor: 'Physical Acute', over: 1.1, resolution: 'Hedged via cat bonds' },
  { date: '2025-12-19', factor: 'Litigation', over: 0.7, resolution: 'Divested high-risk names' },
  { date: '2026-02-28', factor: 'Stranded Asset', over: 1.8, resolution: 'Swapped fossil exposure to renewables' },
];

const r7 = sr(505);
const geoUtil = GEOS.map(g => ({
  geo: g,
  utilized: +(5 + r7() * 15).toFixed(1),
  budget: +(8 + r7() * 8).toFixed(1),
}));

/* ── style helpers ──────────────────────────────────────────── */
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16 };
const kpiBox = { ...card, textAlign: 'center', flex: 1, minWidth: 140 };
const label = { fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 };
const val = (c) => ({ fontSize: 22, fontWeight: 700, color: c || T.navy, fontFamily: T.mono, margin: '6px 0 2px' });
const tblHd = { fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', padding: '8px 10px', borderBottom: `2px solid ${T.border}`, textAlign: 'left' };
const tblTd = { fontSize: 13, fontFamily: T.font, padding: '7px 10px', borderBottom: `1px solid ${T.border}` };
const badge = (c) => ({ display: 'inline-block', fontSize: 10, fontFamily: T.mono, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: c + '18', color: c });

/* ── utilization color ────────────────────────────────── */
function utilColor(pct) { return pct > 95 ? T.red : pct > 80 ? T.amber : T.green; }

/* ── gauge component ──────────────────────────────────── */
function Gauge({ pct }) {
  const c = utilColor(pct);
  const r = 54, cx = 64, cy = 64, sw = 10;
  const circ = 2 * Math.PI * r;
  const dashFull = circ * 0.75;
  const dashUsed = dashFull * (pct / 100);
  return (
    <svg width={128} height={100} viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={sw}
        strokeDasharray={`${dashFull} ${circ}`} strokeDashoffset={0}
        transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={sw}
        strokeDasharray={`${dashUsed} ${circ}`} strokeDashoffset={0}
        transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={20} fontWeight={700}
        fontFamily={T.mono} fill={c}>{pct}%</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize={9} fill={T.textMut}
        fontFamily={T.mono}>UTILIZED</text>
    </svg>
  );
}

/* ── correlation heatmap ──────────────────────────────── */
function CorrHeatmap() {
  const sz = 38;
  const hc = (v) => {
    if (v >= 0.6) return T.red;
    if (v >= 0.3) return T.amber;
    if (v >= 0) return '#fef3c7';
    if (v >= -0.3) return '#dbeafe';
    return T.blue;
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block' }}>
        <div style={{ display: 'flex', marginLeft: 80 }}>
          {FACTORS.map(f => <div key={f} style={{ width: sz, fontSize: 8, fontFamily: T.mono, color: T.textMut, textAlign: 'center', transform: 'rotate(-45deg)', transformOrigin: 'bottom left', whiteSpace: 'nowrap', marginBottom: 4 }}>{f}</div>)}
        </div>
        {FACTORS.map((f, i) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 80, fontSize: 9, fontFamily: T.mono, color: T.textSec, textAlign: 'right', paddingRight: 6, whiteSpace: 'nowrap' }}>{f}</div>
            {corrMatrix[i].map((v, j) => (
              <div key={j} style={{ width: sz, height: sz, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hc(v), fontSize: 8, fontFamily: T.mono, fontWeight: 600, color: v > 0.5 || v < -0.2 ? '#fff' : T.navy, border: `0.5px solid ${T.border}` }}>
                {v.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── TAB 1: Risk Budget Dashboard ─────────────────────── */
function DashboardTab() {
  const totalBudget = 45, utilized = 38.2, pct = 84.9;
  const kpis = [
    { label: 'Total Climate VaR Budget', val: '$45.0M', color: T.navy },
    { label: 'Utilized', val: `$${utilized}M`, sub: `${pct}%`, color: utilColor(pct) },
    { label: 'Transition Risk Budget', val: '$28.0M', color: T.blue },
    { label: 'Physical Risk Budget', val: '$12.0M', color: T.teal },
    { label: 'Litigation Risk Budget', val: '$5.0M', color: T.purple },
  ];
  const overBudget = sectorBudgets.filter(s => s.total > totalBudget / SECTORS.length * 1.25);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {kpis.map(k => (
          <div key={k.label} style={kpiBox}>
            <div style={label}>{k.label}</div>
            <div style={val(k.color)}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 12, fontFamily: T.mono, color: k.color }}>{k.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 2, minWidth: 420 }}>
          <div style={label}>Budget Allocation by Sector & Risk Type ($M)</div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={sectorBudgets} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
              <Bar dataKey="transition" stackId="a" fill={T.blue} name="Transition" />
              <Bar dataKey="physical" stackId="a" fill={T.teal} name="Physical" />
              <Bar dataKey="litigation" stackId="a" fill={T.purple} name="Litigation" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={label}>Overall Utilization</div>
          <Gauge pct={pct} />
          <div style={{ fontSize: 12, fontFamily: T.mono, color: utilColor(pct), fontWeight: 600, marginTop: 4 }}>
            {pct > 95 ? 'CRITICAL' : pct > 80 ? 'ELEVATED' : 'NORMAL'}
          </div>
        </div>
      </div>
      {overBudget.length > 0 && (
        <div style={{ ...card, borderLeft: `3px solid ${T.red}` }}>
          <div style={{ ...label, color: T.red, marginBottom: 6 }}>Sectors Exceeding Budget Threshold</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Sector','Total ($M)','Threshold ($M)','Excess ($M)','Status'].map(h => <th key={h} style={tblHd}>{h}</th>)}
            </tr></thead>
            <tbody>{overBudget.map(s => {
              const thresh = +(totalBudget / SECTORS.length * 1.25).toFixed(2);
              return (
                <tr key={s.sector}>
                  <td style={tblTd}>{s.sector}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono }}>{s.total}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono }}>{thresh}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono, color: T.red }}>+{(s.total - thresh).toFixed(2)}</td>
                  <td style={tblTd}><span style={badge(T.red)}>OVER BUDGET</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── TAB 2: Factor Decomposition ──────────────────────── */
function FactorTab() {
  const totalContrib = factorData.reduce((s, f) => s + f.contribution, 0);
  const enriched = factorData.map(f => ({ ...f, pct: +(f.contribution / totalContrib * 100).toFixed(1) }));
  const colors = [T.blue, T.amber, T.teal, T.purple, T.red, '#ea580c', T.navy];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <div style={label}>Factor Contribution to Climate VaR ($M)</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={enriched} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="factor" tick={{ fontSize: 9, fontFamily: T.mono }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Bar dataKey="contribution" name="VaR Contribution ($M)">
              {enriched.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 320 }}>
          <div style={label}>Factor Correlation Matrix</div>
          <div style={{ marginTop: 8 }}><CorrHeatmap /></div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 320 }}>
          <div style={label}>Factor Volatility Time Series (%)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={factorVol} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 8, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 10 }} />
              {FACTORS.map((f, i) => <Line key={f} type="monotone" dataKey={f} stroke={colors[i]} dot={false} strokeWidth={1.5} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card}>
        <div style={label}>Factor Breakdown Table</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>
            {['Factor','Contribution ($M)','% of Total','Volatility (%)','Risk Rating'].map(h => <th key={h} style={tblHd}>{h}</th>)}
          </tr></thead>
          <tbody>{enriched.map((f, i) => (
            <tr key={f.factor}>
              <td style={tblTd}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: colors[i], marginRight: 6 }} />{f.factor}</td>
              <td style={{ ...tblTd, fontFamily: T.mono }}>{f.contribution}</td>
              <td style={{ ...tblTd, fontFamily: T.mono }}>{f.pct}%</td>
              <td style={{ ...tblTd, fontFamily: T.mono }}>{f.volatility}%</td>
              <td style={tblTd}><span style={badge(f.volatility > 20 ? T.red : f.volatility > 14 ? T.amber : T.green)}>{f.volatility > 20 ? 'HIGH' : f.volatility > 14 ? 'MEDIUM' : 'LOW'}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ── TAB 3: Marginal Contributions ────────────────────── */
function MarginalTab() {
  const top10 = holdings.slice(0, 10);
  const divBenefit = 4.7;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={kpiBox}><div style={label}>Portfolio Climate VaR</div><div style={val(T.navy)}>$38.2M</div></div>
        <div style={kpiBox}><div style={label}>Sum Component VaR</div><div style={val(T.textSec)}>$42.9M</div></div>
        <div style={kpiBox}><div style={label}>Diversification Benefit</div><div style={val(T.green)}>-${divBenefit}M</div><div style={{ fontSize: 11, fontFamily: T.mono, color: T.green }}>10.9% reduction</div></div>
        <div style={kpiBox}><div style={label}>Top Contributor</div><div style={val(T.red)}>{holdings[0].name}</div><div style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut }}>MCTR {holdings[0].mctr}</div></div>
      </div>
      <div style={card}>
        <div style={label}>Top 10 Marginal Risk Contributors ($M)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={top10} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono }} width={85} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Bar dataKey="cvar" name="Climate VaR ($M)">
              {top10.map((h, i) => <Cell key={i} fill={i < 3 ? T.red : i < 6 ? T.amber : T.blue} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={label}>Holdings Risk Detail</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
            <thead><tr>
              {['#','Name','Weight %','Climate VaR ($M)','MCTR','Risk/Return','% Total Budget'].map(h => <th key={h} style={tblHd}>{h}</th>)}
            </tr></thead>
            <tbody>{holdings.map((h, i) => (
              <tr key={h.name} style={i < 3 ? { background: T.red + '08' } : {}}>
                <td style={{ ...tblTd, fontFamily: T.mono, color: T.textMut }}>{i + 1}</td>
                <td style={{ ...tblTd, fontWeight: i < 3 ? 700 : 400 }}>{h.name}</td>
                <td style={{ ...tblTd, fontFamily: T.mono }}>{h.wt}%</td>
                <td style={{ ...tblTd, fontFamily: T.mono, color: h.cvar > 4 ? T.red : T.navy }}>{h.cvar}</td>
                <td style={{ ...tblTd, fontFamily: T.mono, fontWeight: 600, color: h.mctr > 0.5 ? T.red : T.navy }}>{h.mctr}</td>
                <td style={{ ...tblTd, fontFamily: T.mono }}>{h.rr}</td>
                <td style={{ ...tblTd, fontFamily: T.mono }}>{h.pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── TAB 4: What-If Scenarios ─────────────────────────── */
function WhatIfTab() {
  const top10 = holdings.slice(0, 10);
  const [adj, setAdj] = useState(() => Object.fromEntries(top10.map(h => [h.name, 0])));
  const baseVaR = 38.2;
  const baseBudget = 45;

  const newVaR = +(baseVaR + Object.entries(adj).reduce((s, [name, d]) => {
    const h = top10.find(x => x.name === name);
    return s + (h ? d * h.mctr * 2.5 : 0);
  }, 0)).toFixed(2);
  const newUtil = +(newVaR / baseBudget * 100).toFixed(1);
  const delta = +(newVaR - baseVaR).toFixed(2);

  const pathData = [];
  for (let i = 0; i <= 10; i++) {
    const frac = i / 10;
    pathData.push({ step: i, var: +(baseVaR + delta * frac).toFixed(2), util: +(84.9 + (newUtil - 84.9) * frac).toFixed(1) });
  }

  const trades = top10.filter(h => adj[h.name] !== 0).map(h => ({
    name: h.name,
    action: adj[h.name] > 0 ? 'BUY' : 'SELL',
    delta: adj[h.name],
    newWt: +(h.wt + adj[h.name]).toFixed(2),
    varImpact: +(adj[h.name] * h.mctr * 2.5).toFixed(3),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={kpiBox}><div style={label}>Base Climate VaR</div><div style={val(T.navy)}>${baseVaR}M</div></div>
        <div style={kpiBox}><div style={label}>Adjusted Climate VaR</div><div style={val(delta > 0 ? T.red : T.green)}>${newVaR}M</div></div>
        <div style={kpiBox}><div style={label}>Delta</div><div style={val(delta > 0 ? T.red : delta < 0 ? T.green : T.navy)}>{delta > 0 ? '+' : ''}{delta}M</div></div>
        <div style={kpiBox}><div style={label}>Budget Utilization</div><div style={val(utilColor(newUtil))}>{newUtil}%</div></div>
      </div>
      <div style={{ ...card }}>
        <div style={label}>Adjust Holdings Weight (drag sliders +/- 5%)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280, 1fr))', gap: 10, marginTop: 10 }}>
          {top10.map(h => (
            <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: T.mono, width: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
              <input type="range" min={-5} max={5} step={0.5} value={adj[h.name]}
                onChange={e => setAdj(p => ({ ...p, [h.name]: +e.target.value }))}
                style={{ flex: 1, accentColor: T.gold }} />
              <span style={{ fontSize: 11, fontFamily: T.mono, width: 42, textAlign: 'right', color: adj[h.name] > 0 ? T.red : adj[h.name] < 0 ? T.green : T.textMut }}>
                {adj[h.name] > 0 ? '+' : ''}{adj[h.name]}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 360 }}>
          <div style={label}>Efficient Rebalancing Path</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pathData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="step" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Step', fontSize: 9, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Line type="monotone" dataKey="var" stroke={T.navy} strokeWidth={2} dot={{ r: 3, fill: T.navy }} name="Climate VaR ($M)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 360 }}>
          <div style={label}>Before / After Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead><tr>{['Metric','Before','After','Change'].map(h => <th key={h} style={tblHd}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Climate VaR ($M)', baseVaR, newVaR, delta],
                ['Budget Utilization (%)', 84.9, newUtil, +(newUtil - 84.9).toFixed(1)],
                ['Headroom ($M)', +(baseBudget - baseVaR).toFixed(1), +(baseBudget - newVaR).toFixed(1), +(-delta).toFixed(1)],
              ].map(([m, b, a, c]) => (
                <tr key={m}>
                  <td style={tblTd}>{m}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono }}>{b}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono, fontWeight: 600 }}>{a}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono, color: c > 0 ? T.red : c < 0 ? T.green : T.textMut }}>{c > 0 ? '+' : ''}{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {trades.length > 0 && (
        <div style={card}>
          <div style={label}>Suggested Trade List</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead><tr>{['Holding','Action','Weight Delta','New Weight %','VaR Impact ($M)'].map(h => <th key={h} style={tblHd}>{h}</th>)}</tr></thead>
            <tbody>{trades.map(t => (
              <tr key={t.name}>
                <td style={tblTd}>{t.name}</td>
                <td style={tblTd}><span style={badge(t.action === 'BUY' ? T.red : T.green)}>{t.action}</span></td>
                <td style={{ ...tblTd, fontFamily: T.mono }}>{t.delta > 0 ? '+' : ''}{t.delta}%</td>
                <td style={{ ...tblTd, fontFamily: T.mono }}>{t.newWt}%</td>
                <td style={{ ...tblTd, fontFamily: T.mono, color: t.varImpact > 0 ? T.red : T.green }}>{t.varImpact > 0 ? '+' : ''}{t.varImpact}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── TAB 5: Budget Utilization ────────────────────────── */
function UtilizationTab() {
  const lastUtil = utilHistory[utilHistory.length - 1].utilized;
  const lastPct = +(lastUtil / 45 * 100).toFixed(1);
  const trend = +(lastUtil - utilHistory[utilHistory.length - 4].utilized).toFixed(1);
  const r8 = sr(606);
  const forecast = [
    ...utilHistory.slice(-3).map(m => ({ month: m.month, utilized: m.utilized, type: 'actual' })),
    { month: 'Apr 26', utilized: +(lastUtil + 0.5 + r8() * 1.2).toFixed(1), type: 'forecast' },
    { month: 'May 26', utilized: +(lastUtil + 1.0 + r8() * 1.5).toFixed(1), type: 'forecast' },
    { month: 'Jun 26', utilized: +(lastUtil + 1.5 + r8() * 1.8).toFixed(1), type: 'forecast' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={kpiBox}><div style={label}>Current Utilization</div><div style={val(utilColor(lastPct))}>{lastPct}%</div></div>
        <div style={kpiBox}><div style={label}>Utilized / Budget</div><div style={val(T.navy)}>${lastUtil}M / $45M</div></div>
        <div style={kpiBox}><div style={label}>3M Trend</div><div style={val(trend > 0 ? T.red : T.green)}>{trend > 0 ? '+' : ''}{trend}M</div></div>
        <div style={kpiBox}><div style={label}>Breach Count (12M)</div><div style={val(T.amber)}>{breaches.length}</div></div>
      </div>
      <div style={card}>
        <div style={label}>Historical Budget Utilization ($M) — 12 Month</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={utilHistory} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: T.mono }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[0, 50]} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Bar dataKey="utilized" name="Utilized ($M)">
              {utilHistory.map((m, i) => {
                const p = m.utilized / 45 * 100;
                return <Cell key={i} fill={utilColor(p)} />;
              })}
            </Bar>
            <Line type="monotone" dataKey="budget" stroke={T.navy} strokeDasharray="5 3" strokeWidth={1.5} dot={false} name="Budget" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10, fontFamily: T.mono }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: T.green, borderRadius: 2, marginRight: 4 }} />&lt;80% Normal</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: T.amber, borderRadius: 2, marginRight: 4 }} />80-95% Elevated</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: T.red, borderRadius: 2, marginRight: 4 }} />&gt;95% Critical</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 340 }}>
          <div style={label}>Utilization by Geography</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead><tr>{['Region','Utilized ($M)','Budget ($M)','Utilization %','Status'].map(h => <th key={h} style={tblHd}>{h}</th>)}</tr></thead>
            <tbody>{geoUtil.map(g => {
              const pct = +(g.utilized / g.budget * 100).toFixed(1);
              return (
                <tr key={g.geo}>
                  <td style={{ ...tblTd, fontWeight: 600 }}>{g.geo}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono }}>{g.utilized}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono }}>{g.budget}</td>
                  <td style={{ ...tblTd, fontFamily: T.mono, color: utilColor(pct) }}>{pct}%</td>
                  <td style={tblTd}><span style={badge(utilColor(pct))}>{pct > 95 ? 'CRITICAL' : pct > 80 ? 'ELEVATED' : 'NORMAL'}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 340 }}>
          <div style={label}>Forecasted Utilization ($M)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecast} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} domain={[30, 50]} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Line type="monotone" dataKey="utilized" stroke={T.navy} strokeWidth={2} dot={{ r: 3, fill: T.navy }}
                strokeDasharray={undefined} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>Dashed = forecast based on 3M rolling trajectory</div>
        </div>
      </div>
      <div style={{ ...card, borderLeft: `3px solid ${T.amber}` }}>
        <div style={label}>Breach Incident Log (12 Month)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead><tr>{['Date','Factor','Over Budget ($M)','Resolution','Status'].map(h => <th key={h} style={tblHd}>{h}</th>)}</tr></thead>
          <tbody>{breaches.map((b, i) => (
            <tr key={i}>
              <td style={{ ...tblTd, fontFamily: T.mono }}>{b.date}</td>
              <td style={tblTd}>{b.factor}</td>
              <td style={{ ...tblTd, fontFamily: T.mono, color: T.red }}>+{b.over}</td>
              <td style={{ ...tblTd, fontSize: 12 }}>{b.resolution}</td>
              <td style={tblTd}><span style={badge(T.green)}>RESOLVED</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ────────────────────────────────────────── */
export default function ClimateRiskBudgetAllocatorPage() {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 32px' }}>
      {/* header */}
      <div style={{ background: T.navy, padding: '18px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>Climate Risk Budget Allocator</div>
          <div style={{ fontSize: 11, fontFamily: T.mono, color: T.gold, marginTop: 2 }}>EP-CZ5 | Portfolio Climate VaR Budget Management & Optimization</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.gold, background: T.gold + '22', padding: '3px 8px', borderRadius: 3 }}>LIVE</span>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: '#fff', opacity: 0.5 }}>{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>
      <div style={{ height: 2, background: T.gold }} />

      {/* tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, background: T.surface, padding: '0 24px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{
              padding: '10px 18px', fontSize: 12, fontFamily: T.mono, fontWeight: tab === i ? 700 : 400,
              color: tab === i ? T.navy : T.textMut, background: 'none', border: 'none',
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* content */}
      <div style={{ padding: '16px 24px', maxWidth: 1280, margin: '0 auto' }}>
        {tab === 0 && <DashboardTab />}
        {tab === 1 && <FactorTab />}
        {tab === 2 && <MarginalTab />}
        {tab === 3 && <WhatIfTab />}
        {tab === 4 && <UtilizationTab />}
      </div>

      {/* footer */}
      <div style={{ margin: '16px 24px 0', padding: '8px 12px', background: T.navy + '08', borderRadius: 4, display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
        <span>Climate Risk Budget Allocator v1.0 | Risk-adjusted VaR methodology | 95th percentile | 1Y horizon</span>
        <span>Last rebalance: 2026-03-28 | Next review: 2026-04-15</span>
      </div>
    </div>
  );
}
