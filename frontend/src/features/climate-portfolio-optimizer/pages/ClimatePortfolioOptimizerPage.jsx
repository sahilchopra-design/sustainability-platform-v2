import React, { useState } from 'react';
import {
  ScatterChart, Scatter, BarChart, Bar, AreaChart, Area, PieChart, Pie,
  LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

/* ── Theme ─────────────────────────────────────────────────────────── */
const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

/* ── Seeded RNG ────────────────────────────────────────────────────── */
function sr(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

/* ── Data Generation ───────────────────────────────────────────────── */
const r = sr(20260405);
const TABS = ['Portfolio Optimization', 'Efficient Frontier', 'Carbon Constraints', 'Sector Allocation', 'Scenario Analysis'];

const SECTORS = ['Technology', 'Financials', 'Healthcare', 'Energy', 'Industrials', 'Utilities', 'Materials', 'Consumer Disc', 'Consumer Staples', 'Real Estate', 'Telecom'];
const GEOS = ['North America', 'Europe', 'Asia Pacific', 'Emerging Markets', 'Japan'];
const ASSET_CLASSES = ['Equities', 'Fixed Income', 'Green Bonds', 'Infrastructure', 'Real Assets'];

const HOLDINGS = [
  'MSFT', 'AAPL', 'NVDA', 'JPM', 'JNJ', 'XOM', 'NEE', 'CAT', 'AMZN', 'UNH',
  'BHP', 'TSLA', 'PG', 'V', 'LIN', 'ENPH', 'ORSTED', 'VESTAS',
].map((tk, i) => {
  const sec = SECTORS[i % SECTORS.length];
  const currW = +(2 + r() * 9).toFixed(2);
  const optW = +(currW + (r() - 0.5) * 4).toFixed(2);
  const expRet = +(4 + r() * 14).toFixed(2);
  const vol = +(8 + r() * 22).toFixed(2);
  const carbon = +(20 + r() * 380).toFixed(0);
  const trans = +(30 + r() * 65).toFixed(0);
  return { ticker: tk, sector: sec, currWeight: Math.max(0.5, currW), optWeight: Math.max(0.3, Math.abs(optW)), expReturn: expRet, volatility: vol, carbonIntensity: +carbon, transitionScore: +trans };
});

const totalCurrW = HOLDINGS.reduce((s, h) => s + h.currWeight, 0);
const totalOptW = HOLDINGS.reduce((s, h) => s + h.optWeight, 0);
HOLDINGS.forEach(h => { h.currWeight = +(h.currWeight / totalCurrW * 100).toFixed(2); h.optWeight = +(h.optWeight / totalOptW * 100).toFixed(2); });

const FRONTIER = Array.from({ length: 24 }, (_, i) => {
  const vol = 6 + i * 1.1;
  const ret = 2.8 + Math.sqrt(vol - 5) * 3.2 + (r() - 0.5) * 0.6;
  const retC = ret - 0.15 * i * 0.08 - r() * 0.3;
  const carbon = +(80 + i * 12 + r() * 20).toFixed(0);
  return { vol: +vol.toFixed(2), ret: +ret.toFixed(2), retCarbon: +Math.max(retC, 2).toFixed(2), carbon };
});

const CARBON_SECTORS = SECTORS.map(s => {
  const budget = +(40 + r() * 120).toFixed(0);
  const actual = +(budget * (0.5 + r() * 0.7)).toFixed(0);
  return { sector: s, budget, actual, utilization: +((actual / budget) * 100).toFixed(1) };
});

const CARBON_PRICES = [25, 50, 75, 100, 150];
const CARBON_PRICE_IMPACT = CARBON_PRICES.map(p => ({
  price: p,
  portfolioCost: +(0.12 * p + r() * 0.04 * p).toFixed(2),
  returnDrag: +(0.008 * p + r() * 0.003 * p).toFixed(2),
  sharpeImpact: +(-(0.002 * p + r() * 0.001 * p)).toFixed(3),
}));

const MACC_DATA = [
  { measure: 'LED Lighting', cost: -45, abatement: 12 },
  { measure: 'Building Insulation', cost: -20, abatement: 18 },
  { measure: 'EV Fleet', cost: 5, abatement: 35 },
  { measure: 'Solar PV', cost: 15, abatement: 48 },
  { measure: 'Wind Onshore', cost: 22, abatement: 30 },
  { measure: 'Heat Pumps', cost: 38, abatement: 22 },
  { measure: 'Green H2', cost: 85, abatement: 15 },
  { measure: 'DACCS', cost: 180, abatement: 8 },
].map((m, i) => ({ ...m, fill: m.cost < 0 ? T.green : m.cost < 50 ? T.amber : T.red }));

const SECTOR_ALLOC = SECTORS.map(s => {
  const target = +(4 + r() * 14).toFixed(1);
  const actual = +(target + (r() - 0.5) * 6).toFixed(1);
  const carbonInt = +(30 + r() * 350).toFixed(0);
  const bmkW = +(target + (r() - 0.5) * 3).toFixed(1);
  return { sector: s, target, actual: Math.max(0.5, actual), deviation: +(actual - target).toFixed(1), carbonIntensity: +carbonInt, benchmarkWeight: Math.max(0.5, bmkW) };
});

const GEO_ALLOC = GEOS.map(g => {
  const val = +(10 + r() * 35).toFixed(1);
  return { name: g, value: +val };
});
const geoTotal = GEO_ALLOC.reduce((s, g) => s + g.value, 0);
GEO_ALLOC.forEach(g => { g.value = +((g.value / geoTotal) * 100).toFixed(1); });

const AC_ALLOC = ASSET_CLASSES.map(a => ({ name: a, value: +(8 + r() * 30).toFixed(1) }));
const acTotal = AC_ALLOC.reduce((s, a) => s + a.value, 0);
AC_ALLOC.forEach(a => { a.value = +((a.value / acTotal) * 100).toFixed(1); });

const SCENARIOS = [
  { name: 'Net Zero 2050', tempTarget: '1.5°C', carbonPrice2030: 130, carbonPrice2050: 250 },
  { name: 'Below 2°C', tempTarget: '<2.0°C', carbonPrice2030: 80, carbonPrice2050: 175 },
  { name: 'Delayed Transition', tempTarget: '1.8°C', carbonPrice2030: 25, carbonPrice2050: 350 },
  { name: 'Current Policies', tempTarget: '>3.0°C', carbonPrice2030: 15, carbonPrice2050: 30 },
].map(sc => ({
  ...sc,
  portReturn: +(5 + r() * 8).toFixed(2),
  portVol: +(10 + r() * 12).toFixed(2),
  sharpe: +(0.3 + r() * 0.8).toFixed(3),
  maxDrawdown: +(-(8 + r() * 18)).toFixed(1),
  carbonReduction: +(15 + r() * 60).toFixed(0),
  trackingError: +(1.2 + r() * 3.5).toFixed(2),
}));

const STRESS_TESTS = [
  'Carbon Tax Shock +$100/t', 'Oil Price Spike +80%', 'Green Tech Rally +40%',
  'Regulatory Tightening', 'Stranded Asset Write-down', 'Physical Climate Event',
].map(st => ({
  test: st,
  returnImpact: +((r() - 0.6) * 12).toFixed(2),
  volImpact: +(r() * 8).toFixed(2),
  carbonImpact: +((r() - 0.3) * 30).toFixed(0),
}));

const TORNADO_PARAMS = [
  'Carbon Price', 'Discount Rate', 'Tech Innovation', 'Policy Stringency',
  'Physical Risk', 'Stranded Asset Prob', 'Green Premium', 'Regulatory Timing',
].map(p => {
  const base = 7.2;
  const low = +(base - 1 - r() * 4).toFixed(2);
  const high = +(base + 1 + r() * 4).toFixed(2);
  return { param: p, low, high, base, range: +(high - low).toFixed(2) };
}).sort((a, b) => b.range - a.range);

const PIE_COLORS = [T.navy, T.gold, T.teal, T.blue, T.purple, T.green, T.amber, T.red, '#6366f1', '#ec4899', '#14b8a6'];

/* ── Styles ────────────────────────────────────────────────────────── */
const S = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.navy, padding: '0 0 40px' },
  header: { background: T.navy, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.gold}` },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 0.5 },
  headerSub: { color: T.gold, fontSize: 12, fontFamily: T.mono, letterSpacing: 1 },
  tabBar: { display: 'flex', gap: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 20px' },
  tab: (active) => ({
    padding: '12px 22px', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
    color: active ? T.navy : T.textSec, borderBottom: active ? `3px solid ${T.gold}` : '3px solid transparent',
    background: 'transparent', transition: 'all 0.15s', fontFamily: T.font,
  }),
  grid: { display: 'grid', gap: 16, padding: '20px 24px' },
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px' },
  cardTitle: { fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  kpi: { textAlign: 'center', padding: '14px 10px' },
  kpiVal: { fontSize: 22, fontWeight: 700, fontFamily: T.mono },
  kpiLabel: { fontSize: 11, color: T.textSec, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.navy}`, fontSize: 11, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 },
  thR: { textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${T.navy}`, fontSize: 11, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.6 },
  td: { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12 },
  tdR: { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12, textAlign: 'right', fontFamily: T.mono },
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700,
    background: color + '18', color, fontFamily: T.mono,
  }),
  slider: { width: '100%', accentColor: T.gold },
  gauge: (pct) => ({
    height: 10, borderRadius: 5, background: T.border, position: 'relative', overflow: 'hidden',
  }),
  gaugeFill: (pct, color) => ({
    height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 5, transition: 'width 0.4s',
  }),
};

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmt = (v, d = 2) => typeof v === 'number' ? v.toFixed(d) : v;
const pct = v => `${fmt(v, 1)}%`;
const delta = v => v >= 0 ? `+${fmt(v)}` : fmt(v);
const colorDelta = v => v >= 0 ? T.green : T.red;

/* ── KPI Card ──────────────────────────────────────────────────────── */
const Kpi = ({ label, value, color, sub }) => (
  <div style={S.kpi}>
    <div style={{ ...S.kpiVal, color: color || T.navy }}>{value}</div>
    <div style={S.kpiLabel}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2, fontFamily: T.mono }}>{sub}</div>}
  </div>
);

/* ── Main Component ────────────────────────────────────────────────── */
export default function ClimatePortfolioOptimizerPage() {
  const [tab, setTab] = useState(0);
  const [targetReturn, setTargetReturn] = useState(8.5);
  const [maxCarbon, setMaxCarbon] = useState(120);
  const [maxPosition, setMaxPosition] = useState(10);

  const portCarbon = +(HOLDINGS.reduce((s, h) => s + h.currWeight * h.carbonIntensity / 100, 0)).toFixed(1);
  const optCarbon = +(HOLDINGS.reduce((s, h) => s + h.optWeight * h.carbonIntensity / 100, 0)).toFixed(1);
  const portReturn = +(HOLDINGS.reduce((s, h) => s + h.currWeight * h.expReturn / 100, 0)).toFixed(2);
  const optReturn = +(HOLDINGS.reduce((s, h) => s + h.optWeight * h.expReturn / 100, 0)).toFixed(2);
  const portVol = 14.32;
  const optVol = 12.87;
  const sharpe = +((optReturn - 4.5) / optVol).toFixed(3);
  const trackErr = 2.41;
  const totalBudget = CARBON_SECTORS.reduce((s, c) => s + c.budget, 0);
  const totalActual = CARBON_SECTORS.reduce((s, c) => s + c.actual, 0);

  /* ── Tab 0: Portfolio Optimization ─────────────────────────────── */
  const renderOptimization = () => (
    <div style={{ ...S.grid, gridTemplateColumns: '1fr' }}>
      {/* KPI Row */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <Kpi label="Optimized Return" value={`${optReturn}%`} color={T.green} sub={`vs ${portReturn}% current`} />
        <Kpi label="Portfolio Vol" value={`${optVol}%`} color={T.blue} sub={`vs ${portVol}% current`} />
        <Kpi label="Sharpe Ratio" value={sharpe} color={T.navy} sub="risk-free 4.5%" />
        <Kpi label="Carbon Intensity" value={`${optCarbon}`} color={optCarbon < portCarbon ? T.green : T.red} sub={`tCO\u2082/$M (vs ${portCarbon})`} />
        <Kpi label="Tracking Error" value={`${trackErr}%`} color={T.amber} sub="vs MSCI ACWI" />
      </div>

      {/* Controls */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 6, textTransform: 'uppercase' }}>
            Target Return: <span style={{ color: T.navy, fontFamily: T.mono }}>{targetReturn}%</span>
          </div>
          <input type="range" min={4} max={16} step={0.5} value={targetReturn} onChange={e => setTargetReturn(+e.target.value)} style={S.slider} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 6, textTransform: 'uppercase' }}>
            Max Carbon Budget: <span style={{ color: T.navy, fontFamily: T.mono }}>{maxCarbon} tCO₂/$M</span>
          </div>
          <input type="range" min={40} max={300} step={5} value={maxCarbon} onChange={e => setMaxCarbon(+e.target.value)} style={S.slider} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 6, textTransform: 'uppercase' }}>
            Max Single Position: <span style={{ color: T.navy, fontFamily: T.mono }}>{maxPosition}%</span>
          </div>
          <input type="range" min={3} max={20} step={0.5} value={maxPosition} onChange={e => setMaxPosition(+e.target.value)} style={S.slider} />
        </div>
      </div>

      {/* Holdings Table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Holdings Comparison: Current vs Optimized</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Ticker</th><th style={S.th}>Sector</th>
                <th style={S.thR}>Curr Wt%</th><th style={S.thR}>Opt Wt%</th><th style={S.thR}>Delta</th>
                <th style={S.thR}>Exp Ret%</th><th style={S.thR}>Vol%</th>
                <th style={S.thR}>Carbon tCO₂/$M</th><th style={S.thR}>Trans Score</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h, i) => {
                const d = +(h.optWeight - h.currWeight).toFixed(2);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                    <td style={{ ...S.td, fontWeight: 700 }}>{h.ticker}</td>
                    <td style={{ ...S.td, color: T.textSec, fontSize: 11 }}>{h.sector}</td>
                    <td style={S.tdR}>{fmt(h.currWeight)}</td>
                    <td style={S.tdR}>{fmt(h.optWeight)}</td>
                    <td style={{ ...S.tdR, color: colorDelta(d), fontWeight: 600 }}>{delta(d)}</td>
                    <td style={S.tdR}>{fmt(h.expReturn)}</td>
                    <td style={S.tdR}>{fmt(h.volatility)}</td>
                    <td style={S.tdR}>
                      <span style={S.badge(h.carbonIntensity > 200 ? T.red : h.carbonIntensity > 80 ? T.amber : T.green)}>
                        {h.carbonIntensity}
                      </span>
                    </td>
                    <td style={S.tdR}>
                      <span style={S.badge(h.transitionScore > 60 ? T.green : h.transitionScore > 40 ? T.amber : T.red)}>
                        {h.transitionScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ── Tab 1: Efficient Frontier ─────────────────────────────────── */
  const renderFrontier = () => (
    <div style={{ ...S.grid, gridTemplateColumns: '1fr' }}>
      <div style={S.card}>
        <div style={S.cardTitle}>Mean-Variance Efficient Frontier with Carbon Constraint</div>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="vol" name="Volatility" unit="%" tick={{ fontSize: 11, fontFamily: T.mono }} label={{ value: 'Volatility (%)', position: 'bottom', fontSize: 12 }} />
            <YAxis dataKey="ret" name="Return" unit="%" tick={{ fontSize: 11, fontFamily: T.mono }} label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
            <Tooltip formatter={(v) => `${fmt(v)}%`} contentStyle={{ fontFamily: T.mono, fontSize: 12, borderColor: T.border }} />
            <Legend />
            <Scatter name="Unconstrained Frontier" data={FRONTIER.map(f => ({ vol: f.vol, ret: f.ret }))} fill={T.navy} line={{ strokeWidth: 2 }} lineType="fitting" />
            <Scatter name="Carbon-Constrained" data={FRONTIER.map(f => ({ vol: f.vol, ret: f.retCarbon }))} fill={T.green} line={{ strokeWidth: 2 }} lineType="fitting" />
            <Scatter name="Current Portfolio" data={[{ vol: portVol, ret: portReturn }]} fill={T.red}>
              <Cell key="curr" />
            </Scatter>
            <Scatter name="Min-Variance" data={[{ vol: FRONTIER[0].vol, ret: FRONTIER[0].ret }]} fill={T.blue}>
              <Cell key="minv" />
            </Scatter>
            <Scatter name="Max-Sharpe" data={[{ vol: FRONTIER[10].vol, ret: FRONTIER[10].ret }]} fill={T.gold}>
              <Cell key="maxs" />
            </Scatter>
            <Scatter name="Carbon-Optimal" data={[{ vol: FRONTIER[8].vol, ret: FRONTIER[8].retCarbon }]} fill={T.purple}>
              <Cell key="copt" />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Frontier Portfolio Metrics</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.thR}>#</th><th style={S.thR}>Vol %</th><th style={S.thR}>Ret %</th>
              <th style={S.thR}>Ret (Carbon) %</th><th style={S.thR}>Carbon tCO₂</th><th style={S.thR}>Sharpe</th>
            </tr>
          </thead>
          <tbody>
            {FRONTIER.map((f, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={S.tdR}>{i + 1}</td>
                <td style={S.tdR}>{fmt(f.vol)}</td>
                <td style={S.tdR}>{fmt(f.ret)}</td>
                <td style={{ ...S.tdR, color: T.green }}>{fmt(f.retCarbon)}</td>
                <td style={S.tdR}>{f.carbon}</td>
                <td style={S.tdR}>{fmt((f.ret - 4.5) / f.vol, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Tab 2: Carbon Constraints ─────────────────────────────────── */
  const renderCarbon = () => (
    <div style={{ ...S.grid, gridTemplateColumns: '1fr 1fr' }}>
      {/* Budget Gauge */}
      <div style={S.card}>
        <div style={S.cardTitle}>Total Carbon Budget Utilization</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 700, fontFamily: T.mono, color: totalActual / totalBudget > 0.85 ? T.red : T.navy }}>
            {fmt(totalActual / totalBudget * 100, 1)}%
          </span>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{totalActual} / {totalBudget} tCO₂ consumed</div>
        </div>
        <div style={S.gauge(totalActual / totalBudget * 100)}>
          <div style={S.gaugeFill(totalActual / totalBudget * 100, totalActual / totalBudget > 0.85 ? T.red : totalActual / totalBudget > 0.65 ? T.amber : T.green)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
          <Kpi label="Budget Remaining" value={`${totalBudget - totalActual}`} color={T.green} sub="tCO₂" />
          <Kpi label="Avg Intensity" value={fmt(totalActual / 18, 1)} color={T.navy} sub="tCO₂/$M" />
          <Kpi label="YoY Reduction" value="-12.3%" color={T.green} sub="vs prior year" />
        </div>
      </div>

      {/* Sector Budget */}
      <div style={S.card}>
        <div style={S.cardTitle}>Per-Sector Carbon Allowance vs Actual</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CARBON_SECTORS} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} />
            <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={75} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 12, borderColor: T.border }} />
            <Legend />
            <Bar dataKey="budget" name="Budget" fill={T.navy} opacity={0.3} barSize={14} />
            <Bar dataKey="actual" name="Actual" barSize={14}>
              {CARBON_SECTORS.map((c, i) => (
                <Cell key={i} fill={c.utilization > 90 ? T.red : c.utilization > 70 ? T.amber : T.green} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Carbon Price Sensitivity */}
      <div style={S.card}>
        <div style={S.cardTitle}>Carbon Price Sensitivity Analysis</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.thR}>Price $/tCO₂</th><th style={S.thR}>Portfolio Cost ($M)</th>
              <th style={S.thR}>Return Drag (bps)</th><th style={S.thR}>Sharpe Impact</th>
            </tr>
          </thead>
          <tbody>
            {CARBON_PRICE_IMPACT.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ ...S.tdR, fontWeight: 700 }}>${c.price}</td>
                <td style={S.tdR}>{fmt(c.portfolioCost)}</td>
                <td style={{ ...S.tdR, color: T.red }}>{fmt(c.returnDrag)}</td>
                <td style={{ ...S.tdR, color: T.red }}>{c.sharpeImpact}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ResponsiveContainer width="100%" height={200} style={{ marginTop: 12 }}>
          <LineChart data={CARBON_PRICE_IMPACT}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="price" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: '$/tCO₂', position: 'bottom', fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, borderColor: T.border }} />
            <Line dataKey="portfolioCost" name="Cost $M" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
            <Line dataKey="returnDrag" name="Return Drag bps" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MACC */}
      <div style={S.card}>
        <div style={S.cardTitle}>Marginal Abatement Cost Curve (MACC)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={MACC_DATA} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="measure" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, borderColor: T.border }} />
            <ReferenceLine y={0} stroke={T.navy} strokeWidth={1.5} />
            <Bar dataKey="cost" name="Abatement Cost $/tCO₂" barSize={36}>
              {MACC_DATA.map((m, i) => <Cell key={i} fill={m.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
          Abatement volume (ktCO₂): {MACC_DATA.map(m => `${m.measure}: ${m.abatement}`).join(' | ')}
        </div>
      </div>
    </div>
  );

  /* ── Tab 3: Sector Allocation ──────────────────────────────────── */
  const renderSectorAlloc = () => (
    <div style={{ ...S.grid, gridTemplateColumns: '1fr 1fr' }}>
      {/* Target vs Actual */}
      <div style={{ ...S.card, gridColumn: '1 / -1' }}>
        <div style={S.cardTitle}>Target vs Actual Sector Weights with Deviation</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SECTOR_ALLOC} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, borderColor: T.border }} />
            <Legend />
            <Bar dataKey="target" name="Target %" fill={T.navy} opacity={0.4} barSize={18} />
            <Bar dataKey="actual" name="Actual %" barSize={18}>
              {SECTOR_ALLOC.map((s, i) => (
                <Cell key={i} fill={Math.abs(s.deviation) > 3 ? T.red : Math.abs(s.deviation) > 1.5 ? T.amber : T.green} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Geographic Allocation */}
      <div style={S.card}>
        <div style={S.cardTitle}>Geographic Allocation</div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={GEO_ALLOC} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, value }) => `${name}: ${value}%`} labelLine={{ strokeWidth: 1 }} style={{ fontSize: 10 }}>
              {GEO_ALLOC.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => `${v}%`} contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Class Breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>Asset Class Breakdown</div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={AC_ALLOC} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={95} label={({ name, value }) => `${name}: ${value}%`} labelLine={{ strokeWidth: 1 }} style={{ fontSize: 10 }}>
              {AC_ALLOC.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => `${v}%`} contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Carbon Intensity */}
      <div style={S.card}>
        <div style={S.cardTitle}>Sector Carbon Intensity (tCO₂/$M Revenue)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={SECTOR_ALLOC} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, borderColor: T.border }} />
            <Bar dataKey="carbonIntensity" name="tCO₂/$M" barSize={22}>
              {SECTOR_ALLOC.map((s, i) => (
                <Cell key={i} fill={s.carbonIntensity > 200 ? T.red : s.carbonIntensity > 100 ? T.amber : T.green} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tilt Analysis */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Tilt Analysis: Over/Underweight vs Benchmark</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Sector</th><th style={S.thR}>Bmk Wt%</th><th style={S.thR}>Port Wt%</th>
              <th style={S.thR}>Tilt (bps)</th><th style={S.thR}>Carbon Int.</th><th style={S.th}>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {SECTOR_ALLOC.map((s, i) => {
              const tilt = +((s.actual - s.benchmarkWeight) * 100).toFixed(0);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{s.sector}</td>
                  <td style={S.tdR}>{fmt(s.benchmarkWeight, 1)}</td>
                  <td style={S.tdR}>{fmt(s.actual, 1)}</td>
                  <td style={{ ...S.tdR, color: colorDelta(tilt), fontWeight: 600 }}>{tilt > 0 ? '+' : ''}{tilt}</td>
                  <td style={S.tdR}>{s.carbonIntensity}</td>
                  <td style={{ ...S.td, fontSize: 10, color: T.textSec }}>
                    {tilt > 100 ? 'OW: Low carbon, high transition' : tilt < -100 ? 'UW: High emission, stranded risk' : 'Neutral: Within tracking bounds'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Tab 4: Scenario Analysis ──────────────────────────────────── */
  const renderScenarios = () => (
    <div style={{ ...S.grid, gridTemplateColumns: '1fr' }}>
      {/* NGFS Scenario Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {SCENARIOS.map((sc, i) => (
          <div key={i} style={{ ...S.card, borderTop: `3px solid ${[T.green, T.blue, T.amber, T.red][i]}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{sc.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Target: {sc.tempTarget} | C-Price '30: ${sc.carbonPrice2030}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Kpi label="Return" value={`${sc.portReturn}%`} color={T.navy} />
              <Kpi label="Vol" value={`${sc.portVol}%`} color={T.blue} />
              <Kpi label="Sharpe" value={sc.sharpe} color={T.gold} />
              <Kpi label="Max DD" value={`${sc.maxDrawdown}%`} color={T.red} />
              <Kpi label="CO₂ Red." value={`${sc.carbonReduction}%`} color={T.green} />
              <Kpi label="TE" value={`${sc.trackingError}%`} color={T.amber} />
            </div>
          </div>
        ))}
      </div>

      {/* Scenario Return Comparison */}
      <div style={S.card}>
        <div style={S.cardTitle}>Scenario Return / Risk Comparison</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={SCENARIOS} margin={{ top: 10, right: 30, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, borderColor: T.border }} />
            <Legend />
            <Bar dataKey="portReturn" name="Return %" fill={T.green} barSize={20} />
            <Bar dataKey="portVol" name="Volatility %" fill={T.blue} barSize={20} />
            <Bar dataKey="trackingError" name="Track. Error %" fill={T.amber} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stress Tests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>Stress Test Results</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Stress Test</th><th style={S.thR}>Return %</th>
                <th style={S.thR}>Vol Impact %</th><th style={S.thR}>Carbon Impact</th>
              </tr>
            </thead>
            <tbody>
              {STRESS_TESTS.map((st, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ ...S.td, fontWeight: 600, fontSize: 11 }}>{st.test}</td>
                  <td style={{ ...S.tdR, color: colorDelta(st.returnImpact), fontWeight: 600 }}>{delta(st.returnImpact)}</td>
                  <td style={{ ...S.tdR, color: T.red }}>+{fmt(st.volImpact)}</td>
                  <td style={{ ...S.tdR, color: colorDelta(st.carbonImpact) }}>{delta(st.carbonImpact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tornado Chart */}
        <div style={S.card}>
          <div style={S.cardTitle}>Sensitivity Tornado: Portfolio Return (%)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={TORNADO_PARAMS} layout="vertical" margin={{ left: 100, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} domain={['dataMin - 1', 'dataMax + 1']} />
              <YAxis type="category" dataKey="param" tick={{ fontSize: 10 }} width={95} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11, borderColor: T.border }} />
              <ReferenceLine x={7.2} stroke={T.navy} strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Base: 7.2%', fontSize: 10, fill: T.navy }} />
              <Bar dataKey="low" name="Downside" fill={T.red} barSize={16} />
              <Bar dataKey="high" name="Upside" fill={T.green} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────────── */
  const panels = [renderOptimization, renderFrontier, renderCarbon, renderSectorAlloc, renderScenarios];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Climate-Aware Portfolio Optimizer</div>
          <div style={S.headerSub}>EP-CZ1 / MARKOWITZ MVO + CARBON BUDGET CONSTRAINT</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono }}>HOLDINGS: {HOLDINGS.length}</div>
          <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono }}>SECTORS: {SECTORS.length}</div>
          <div style={{ fontSize: 11, color: '#fff', fontFamily: T.mono, background: T.green + '30', padding: '3px 10px', borderRadius: 3 }}>LIVE</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map((t, i) => (
          <div key={i} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>
        ))}
      </div>

      {/* Active Panel */}
      {panels[tab]()}

      {/* Footer */}
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, fontFamily: T.mono, borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
        <span>Climate Portfolio Optimizer v2.1 | Markowitz MVO + Carbon Budget | NGFS Scenarios</span>
        <span>Last optimization: {new Date().toISOString().slice(0, 16)} UTC | Data: Demo (seeded RNG)</span>
      </div>
    </div>
  );
}
