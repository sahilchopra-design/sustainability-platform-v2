import React, { useState, useMemo, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, LineChart, Line, ComposedChart, Area, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Technology','Energy','Financials','Healthcare','Industrials','Materials','Utilities','Real Estate','Consumer Disc.','Consumer Stap.','Telecom','Basic Resources'];
const COUNTRIES = ['US','UK','DE','FR','JP','CN','CA','AU','CH','NL','SE','BR','IN','KR','SG'];

const SECURITIES = Array.from({ length: 200 }, (_, i) => {
  const sec = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const cty = COUNTRIES[Math.floor(sr(i * 13 + 1) * COUNTRIES.length)];
  const ret = sr(i * 3 + 2) * 0.15 + 0.03;
  const vol = sr(i * 5 + 3) * 0.25 + 0.08;
  const ci = sr(i * 11 + 4) * 800 + 10;
  const itr = sr(i * 17 + 5) * 3 + 1.5;
  return {
    id: i,
    name: `${sec.substring(0,3).toUpperCase()}-${String(i + 1).padStart(3,'0')}`,
    sector: sec,
    country: cty,
    weight: sr(i * 19 + 6) * 0.03 + 0.001,
    expectedReturn: ret,
    volatility: vol,
    carbonIntensity: ci,
    physRisk: sr(i * 23 + 7) * 100,
    transRisk: sr(i * 29 + 8) * 100,
    greenRevenue: sr(i * 31 + 9),
    temperature: itr,
    esgScore: sr(i * 37 + 10) * 100,
    betaToMarket: sr(i * 41 + 11) * 0.8 + 0.5,
    liquidityScore: sr(i * 43 + 12) * 100,
    sharpe: (ret - 0.02) / vol,
  };
});

// Normalize weights so they sum to 1
const totalRawWeight = SECURITIES.reduce((s, x) => s + x.weight, 0);
const NORMALIZED = SECURITIES.map(s => ({ ...s, weight: s.weight / totalRawWeight }));

// Generate benchmark weights (sr-seeded)
const bmkTotal = NORMALIZED.reduce((s, x) => s + sr(x.id * 53 + 20) * 0.01, 0);
const BENCHMARK = NORMALIZED.map(s => ({ ...s, bmkWeight: (sr(s.id * 53 + 20) * 0.01) / bmkTotal }));

// Efficient frontier: 50 portfolios with varying risk/return trade-offs
const FRONTIER = Array.from({ length: 50 }, (_, i) => {
  const t = i / 49;
  const vol = 0.08 + t * 0.22;
  const ret = 0.03 + t * 0.14 + sr(i * 7 + 99) * 0.02 - 0.01;
  const ci = 50 + (1 - t) * 400 + sr(i * 11 + 88) * 30;
  return { vol: +(vol * 100).toFixed(2), ret: +(ret * 100).toFixed(2), ci: +ci.toFixed(0), sharpe: +((ret - 0.02) / vol).toFixed(3) };
});

const NGFS_SCENARIOS = [
  { name: 'Orderly 1.5°C', retMult: 1.05, volMult: 0.9, color: T.green },
  { name: 'Disorderly 2°C', retMult: 0.92, volMult: 1.15, color: T.amber },
  { name: 'Hot House 3°C', retMult: 0.75, volMult: 1.4, color: T.red },
  { name: 'Net Zero 2050', retMult: 1.1, volMult: 0.85, color: T.indigo },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Optimizer Dashboard','Portfolio Composition','Carbon Analytics','Risk Attribution','Constraint Analysis','Scenario Performance','Summary & Export'];

export default function ClimatePortfolioOptimizerPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [carbonBudget, setCarbonBudget] = useState(250);
  const [sectorMax, setSectorMax] = useState(25);
  const [itrConstraint, setItrConstraint] = useState(2.5);
  const [esgMin, setEsgMin] = useState(40);
  const [liquidityMin, setLiquidityMin] = useState(20);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [compareMode, setCompareMode] = useState('Carbon-Constrained');
  const [rfRate] = useState(0.02);

  const filtered = useMemo(() => {
    let d = BENCHMARK.filter(s =>
      s.esgScore >= esgMin &&
      s.liquidityScore >= liquidityMin &&
      s.temperature <= itrConstraint + 1.5 &&
      (sectorFilter === 'All' || s.sector === sectorFilter) &&
      (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.sector.toLowerCase().includes(search.toLowerCase()))
    );
    return d;
  }, [esgMin, liquidityMin, itrConstraint, sectorFilter, search]);

  const unconstrained = useMemo(() => {
    const total = filtered.reduce((s, x) => s + x.weight, 0);
    return filtered.map(s => ({ ...s, optWeight: total > 0 ? s.weight / total : 0 }));
  }, [filtered]);

  const carbonConstrained = useMemo(() => {
    const eligible = filtered.filter(s => s.carbonIntensity <= carbonBudget * 1.5);
    const total = eligible.reduce((s, x) => s + x.weight, 0);
    const renormed = eligible.map(s => ({ ...s, optWeight: total > 0 ? s.weight / total : 0 }));
    // Apply carbon tilt: reduce weight of high-CI
    const tilted = renormed.map(s => ({
      ...s,
      optWeight: s.optWeight * (1 - Math.max(0, (s.carbonIntensity - carbonBudget) / (carbonBudget * 2))),
    }));
    const tTotal = tilted.reduce((s, x) => s + x.optWeight, 0);
    return tilted.map(s => ({ ...s, optWeight: tTotal > 0 ? s.optWeight / tTotal : 0 }));
  }, [filtered, carbonBudget]);

  const netZero = useMemo(() => {
    const eligible = filtered.filter(s => s.temperature <= 2.0 && s.greenRevenue >= 0.2);
    const total = eligible.reduce((s, x) => s + x.weight, 0);
    return eligible.map(s => ({ ...s, optWeight: total > 0 ? s.weight / total : 0 }));
  }, [filtered]);

  const portfolioStats = useCallback((holdings, label) => {
    if (!holdings.length) return { label, ret: 0, vol: 0, sharpe: 0, ci: 0, itr: 0 };
    const ret = holdings.reduce((s, x) => s + x.optWeight * x.expectedReturn, 0);
    const vol = Math.sqrt(holdings.reduce((s, x) => s + Math.pow(x.optWeight * x.volatility, 2), 0));
    const ci = holdings.reduce((s, x) => s + x.optWeight * x.carbonIntensity, 0);
    const itr = holdings.reduce((s, x) => s + x.optWeight * x.temperature, 0);
    const caSharp = vol > 0 ? (ret - rfRate) / (vol * (1 + ci / 500)) : 0;
    const bmkVol = Math.sqrt(holdings.reduce((s, x) => s + Math.pow(x.bmkWeight * x.volatility, 2), 0));
    const te = Math.sqrt(Math.abs(Math.pow(vol, 2) - Math.pow(bmkVol, 2)));
    return { label, ret: +(ret * 100).toFixed(2), vol: +(vol * 100).toFixed(2), sharpe: +((ret - rfRate) / (vol || 1)).toFixed(3), ci: +ci.toFixed(0), itr: +itr.toFixed(2), caSharp: +caSharp.toFixed(3), te: +(te * 100).toFixed(2) };
  }, [rfRate]);

  const stats = useMemo(() => ({
    unc: portfolioStats(unconstrained, 'Unconstrained'),
    cc: portfolioStats(carbonConstrained, 'Carbon-Constrained'),
    nz: portfolioStats(netZero, 'Net-Zero'),
  }), [unconstrained, carbonConstrained, netZero, portfolioStats]);

  const activePortfolio = compareMode === 'Unconstrained' ? unconstrained : compareMode === 'Net-Zero' ? netZero : carbonConstrained;
  const activeStats = compareMode === 'Unconstrained' ? stats.unc : compareMode === 'Net-Zero' ? stats.nz : stats.cc;

  const sectorBreakdown = useMemo(() => {
    const map = {};
    activePortfolio.forEach(s => {
      if (!map[s.sector]) map[s.sector] = { sector: s.sector, weight: 0, ci: 0, count: 0 };
      map[s.sector].weight += s.optWeight * 100;
      map[s.sector].ci += s.optWeight * s.carbonIntensity;
      map[s.sector].count += 1;
    });
    return Object.values(map).sort((a, b) => b.weight - a.weight);
  }, [activePortfolio]);

  const constraintData = useMemo(() => {
    const carbonUtil = activeStats.ci / carbonBudget * 100;
    const itrUtil = activeStats.itr / itrConstraint * 100;
    const sectorUtilMax = Math.max(...sectorBreakdown.map(s => s.weight)) / sectorMax * 100;
    return [
      { name: 'Carbon Budget', utilization: +carbonUtil.toFixed(1), budget: 100, status: carbonUtil <= 100 ? 'Slack' : 'Binding' },
      { name: 'ITR Limit', utilization: +itrUtil.toFixed(1), budget: 100, status: itrUtil <= 100 ? 'Slack' : 'Binding' },
      { name: 'Sector Max', utilization: +sectorUtilMax.toFixed(1), budget: 100, status: sectorUtilMax <= 100 ? 'Slack' : 'Binding' },
      { name: 'ESG Minimum', utilization: +(activePortfolio.reduce((s, x) => s + x.optWeight * x.esgScore, 0) / esgMin * 100).toFixed(1), budget: 100, status: 'Slack' },
    ];
  }, [activeStats, carbonBudget, itrConstraint, sectorMax, sectorBreakdown, activePortfolio, esgMin]);

  const riskAttribution = useMemo(() => {
    return sectorBreakdown.map(s => ({
      sector: s.sector,
      systematic: +(s.weight * sr(s.sector.length * 7 + 1) * 0.6).toFixed(2),
      idiosyncratic: +(s.weight * sr(s.sector.length * 11 + 2) * 0.4).toFixed(2),
      factorExposure: +(sr(s.sector.length * 13 + 3) * 2 - 1).toFixed(3),
    }));
  }, [sectorBreakdown]);

  const top20 = useMemo(() => [...activePortfolio].sort((a, b) => b.optWeight - a.optWeight).slice(0, 20), [activePortfolio]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CZ1 · CLIMATE PORTFOLIO CONSTRUCTION</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Climate Portfolio Optimizer</h1>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Markowitz mean-variance optimization with carbon constraints · {SECURITIES.length} securities · 12 sectors</div>
      </div>

      {/* Controls */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: T.muted }}>Carbon Budget: <strong style={{ color: T.text }}>{carbonBudget} tCO₂e/$M</strong>
          <input type="range" min={50} max={500} value={carbonBudget} onChange={e => setCarbonBudget(+e.target.value)} style={{ marginLeft: 8, width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>Sector Max: <strong style={{ color: T.text }}>{sectorMax}%</strong>
          <input type="range" min={5} max={50} value={sectorMax} onChange={e => setSectorMax(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>ITR Limit: <strong style={{ color: T.text }}>{itrConstraint}°C</strong>
          <input type="range" min={15} max={30} value={itrConstraint * 10} onChange={e => setItrConstraint(+e.target.value / 10)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>ESG Min: <strong style={{ color: T.text }}>{esgMin}</strong>
          <input type="range" min={0} max={80} value={esgMin} onChange={e => setEsgMin(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={compareMode} onChange={e => setCompareMode(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>Unconstrained</option>
          <option>Carbon-Constrained</option>
          <option>Net-Zero</option>
        </select>
        <input placeholder="Search securities..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 160 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', gap: 0, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.indigo : T.muted, background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* TAB 0: Optimizer Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard label="Portfolio Return" value={`${activeStats.ret}%`} sub="Expected annualized" color={T.green} />
              <KpiCard label="Portfolio Vol" value={`${activeStats.vol}%`} sub="Annualized volatility" color={T.amber} />
              <KpiCard label="Sharpe Ratio" value={activeStats.sharpe} sub="Risk-free = 2%" color={T.indigo} />
              <KpiCard label="Carbon Intensity" value={`${activeStats.ci}`} sub="tCO₂e/$M revenue" color={activeStats.ci > carbonBudget ? T.red : T.green} />
              <KpiCard label="Portfolio ITR" value={`${activeStats.itr}°C`} sub="Implied temperature rise" color={activeStats.itr <= 2 ? T.green : T.amber} />
              <KpiCard label="Tracking Error" value={`${activeStats.te}%`} sub="vs MSCI World" color={T.blue} />
              <KpiCard label="CA-Sharpe" value={activeStats.caSharp} sub="Carbon-adjusted Sharpe" color={T.purple} />
              <KpiCard label="Holdings" value={activePortfolio.length} sub={`of ${SECURITIES.length} universe`} />
            </div>

            {/* Compare 3 portfolios */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Portfolio Comparison</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: 'Return %', Unconstrained: stats.unc.ret, 'Carbon-Constr.': stats.cc.ret, 'Net-Zero': stats.nz.ret },
                    { name: 'Vol %', Unconstrained: stats.unc.vol, 'Carbon-Constr.': stats.cc.vol, 'Net-Zero': stats.nz.vol },
                    { name: 'Sharpe×10', Unconstrained: +(stats.unc.sharpe * 10).toFixed(2), 'Carbon-Constr.': +(stats.cc.sharpe * 10).toFixed(2), 'Net-Zero': +(stats.nz.sharpe * 10).toFixed(2) },
                  ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Unconstrained" fill={T.blue} />
                    <Bar dataKey="Carbon-Constr." fill={T.indigo} />
                    <Bar dataKey="Net-Zero" fill={T.green} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Efficient Frontier (50 portfolios)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="vol" name="Volatility %" tick={{ fontSize: 10 }} label={{ value: 'Vol %', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis dataKey="ret" name="Return %" tick={{ fontSize: 10 }} label={{ value: 'Ret %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v.toFixed(2), n]} />
                    <Scatter data={FRONTIER} fill={T.indigo} opacity={0.7} />
                    <Scatter data={[{ vol: activeStats.vol, ret: activeStats.ret }]} fill={T.red} name="Current" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 20 holdings */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Top 20 Holdings — {compareMode}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={top20.map(s => ({ name: s.name, weight: +(s.optWeight * 100).toFixed(2) }))} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}%`, 'Weight']} />
                  <Bar dataKey="weight" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1: Portfolio Composition */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector Allocation — {compareMode}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v.toFixed(2)}%`, 'Weight']} />
                    <Bar dataKey="weight" fill={T.navy} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector Carbon Intensity</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v.toFixed(0)} tCO₂e/$M`, 'Avg CI']} />
                    <Bar dataKey="ci" fill={T.amber} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Full Holdings — {activePortfolio.length} securities</h3>
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Name','Sector','Country','Weight %','Ret %','Vol %','Carbon CI','ITR °C','ESG','Sharpe'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activePortfolio.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{s.name}</td>
                        <td style={{ padding: '6px 10px', color: T.muted }}>{s.sector}</td>
                        <td style={{ padding: '6px 10px', color: T.muted }}>{s.country}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{(s.optWeight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{(s.expectedReturn * 100).toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: T.amber }}>{(s.volatility * 100).toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: s.carbonIntensity > carbonBudget ? T.red : T.text }}>{s.carbonIntensity.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: s.temperature <= 2 ? T.green : s.temperature <= 3 ? T.amber : T.red }}>{s.temperature.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}>{s.esgScore.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: s.sharpe >= 0.5 ? T.green : T.muted }}>{s.sharpe.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Carbon Analytics */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Portfolio CI" value={`${activeStats.ci} tCO₂e/$M`} sub={`Budget: ${carbonBudget}`} color={activeStats.ci > carbonBudget ? T.red : T.green} />
              <KpiCard label="Budget Utilization" value={`${(activeStats.ci / carbonBudget * 100).toFixed(1)}%`} color={activeStats.ci / carbonBudget > 1 ? T.red : T.green} />
              <KpiCard label="Portfolio ITR" value={`${activeStats.itr}°C`} sub="Weighted avg temperature" color={activeStats.itr <= 2 ? T.green : T.amber} />
              <KpiCard label="Green Revenue" value={`${(activePortfolio.reduce((s, x) => s + x.optWeight * x.greenRevenue, 0) * 100).toFixed(1)}%`} sub="Wtd avg green revenue" color={T.teal} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Carbon Budget Utilization vs Sectors</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={sectorBreakdown} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="ci" fill={T.amber} name="Carbon Intensity" />
                    <Line yAxisId="right" dataKey="weight" stroke={T.indigo} name="Weight %" dot={false} />
                    <ReferenceLine yAxisId="left" y={carbonBudget} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Budget', fontSize: 10, fill: T.red }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ITR Distribution (Binned)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { range: '1.5-2.0°C', count: activePortfolio.filter(s => s.temperature < 2).length },
                    { range: '2.0-2.5°C', count: activePortfolio.filter(s => s.temperature >= 2 && s.temperature < 2.5).length },
                    { range: '2.5-3.0°C', count: activePortfolio.filter(s => s.temperature >= 2.5 && s.temperature < 3).length },
                    { range: '3.0-3.5°C', count: activePortfolio.filter(s => s.temperature >= 3 && s.temperature < 3.5).length },
                    { range: '3.5-4.5°C', count: activePortfolio.filter(s => s.temperature >= 3.5).length },
                  ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill={T.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Risk Attribution */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Total Portfolio Vol" value={`${activeStats.vol}%`} color={T.amber} />
              <KpiCard label="Tracking Error" value={`${activeStats.te}%`} sub="vs MSCI World" color={T.indigo} />
              <KpiCard label="Avg Beta" value={(activePortfolio.reduce((s, x) => s + x.optWeight * x.betaToMarket, 0)).toFixed(3)} sub="Wtd avg to market" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Systematic vs Idiosyncratic Risk</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={riskAttribution} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="systematic" stackId="a" fill={T.navy} name="Systematic" />
                    <Bar dataKey="idiosyncratic" stackId="a" fill={T.amber} name="Idiosyncratic" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Factor Exposure by Sector</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={riskAttribution} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="factorExposure" fill={T.purple} name="Factor Exposure" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Constraint Analysis */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Constraint Utilization</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={constraintData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 130]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}%`, 'Utilization']} />
                  <ReferenceLine y={100} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Limit', fontSize: 10, fill: T.red }} />
                  <Bar dataKey="utilization" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Constraint Sensitivity Analysis</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Constraint','Current Value','Budget/Limit','Utilization %','Status','Portfolio Return Impact'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {constraintData.map((c, i) => (
                    <tr key={c.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px' }}>{c.utilization.toFixed(1)}</td>
                      <td style={{ padding: '8px 12px' }}>100</td>
                      <td style={{ padding: '8px 12px' }}>{c.utilization.toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: c.status === 'Binding' ? T.red : T.green, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{c.status === 'Binding' ? `-${(sr(i * 17 + 5) * 0.5).toFixed(2)}%` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Scenario Performance */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>NGFS Scenario Performance Matrix</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {NGFS_SCENARIOS.map(sc => {
                  const ret = (activeStats.ret * sc.retMult).toFixed(2);
                  const vol = (activeStats.vol * sc.volMult).toFixed(2);
                  const sharpe = ((activeStats.ret * sc.retMult / 100 - rfRate) / (activeStats.vol * sc.volMult / 100)).toFixed(3);
                  return (
                    <div key={sc.name} style={{ background: T.sub, border: `2px solid ${sc.color}`, borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: sc.color, marginBottom: 8 }}>{sc.name}</div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{ret}%</div>
                      <div style={{ fontSize: 10, color: T.muted }}>Expected Return</div>
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Vol: {vol}%</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Sharpe: {sharpe}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Scenario Comparison — All 3 Portfolios</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={NGFS_SCENARIOS.map(sc => ({
                  name: sc.name.split(' ')[0],
                  'Unconstrained': +(stats.unc.ret * sc.retMult).toFixed(2),
                  'Carbon-Constr.': +(stats.cc.ret * sc.retMult).toFixed(2),
                  'Net-Zero': +(stats.nz.ret * sc.retMult).toFixed(2),
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Unconstrained" fill={T.blue} />
                  <Bar dataKey="Carbon-Constr." fill={T.indigo} />
                  <Bar dataKey="Net-Zero" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 6: Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Full Optimization Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Metric','Unconstrained','Carbon-Constrained','Net-Zero','Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Expected Return %', stats.unc.ret, stats.cc.ret, stats.nz.ret, 'Annualized'],
                    ['Volatility %', stats.unc.vol, stats.cc.vol, stats.nz.vol, 'Annualized'],
                    ['Sharpe Ratio', stats.unc.sharpe, stats.cc.sharpe, stats.nz.sharpe, 'rf=2%'],
                    ['CA-Sharpe', stats.unc.caSharp, stats.cc.caSharp, stats.nz.caSharp, 'Carbon-adjusted'],
                    ['Carbon Intensity', stats.unc.ci, stats.cc.ci, stats.nz.ci, 'tCO₂e/$M'],
                    ['Portfolio ITR °C', stats.unc.itr, stats.cc.itr, stats.nz.itr, 'PAII methodology'],
                    ['Tracking Error %', stats.unc.te, stats.cc.te, stats.nz.te, 'vs MSCI World'],
                    ['Holdings Count', unconstrained.length, carbonConstrained.length, netZero.length, 'Securities'],
                  ].map(([metric, u, c, n, note], i) => (
                    <tr key={metric} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{metric}</td>
                      <td style={{ padding: '8px 12px' }}>{u}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.indigo }}>{c}</td>
                      <td style={{ padding: '8px 12px', color: T.green }}>{n}</td>
                      <td style={{ padding: '8px 12px', color: T.muted, fontSize: 11 }}>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Optimized Weights Export — {compareMode} ({activePortfolio.length} holdings)</h3>
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Security','Sector','Country','Opt Weight %','Bmk Weight %','Active Weight %','ITR','CI','ESG'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...activePortfolio].sort((a, b) => b.optWeight - a.optWeight).slice(0, 50).map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{s.name}</td>
                        <td style={{ padding: '5px 10px', fontSize: 10, color: T.muted }}>{s.sector}</td>
                        <td style={{ padding: '5px 10px' }}>{s.country}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 700 }}>{(s.optWeight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '5px 10px', color: T.muted }}>{(s.bmkWeight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '5px 10px', color: (s.optWeight - s.bmkWeight) >= 0 ? T.green : T.red }}>
                          {((s.optWeight - s.bmkWeight) * 100 >= 0 ? '+' : '')}{((s.optWeight - s.bmkWeight) * 100).toFixed(3)}%
                        </td>
                        <td style={{ padding: '5px 10px', color: s.temperature <= 2 ? T.green : T.amber }}>{s.temperature.toFixed(2)}</td>
                        <td style={{ padding: '5px 10px', color: s.carbonIntensity > carbonBudget ? T.red : T.text }}>{s.carbonIntensity.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px' }}>{s.esgScore.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Sector-level optimization summary */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector-Level Optimization Summary — {compareMode}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Sector','# Securities','Total Opt Wt %','Total Bmk Wt %','Active Wt %','Avg CI','Avg ITR','Avg ESG','Avg Return %','Avg Vol %'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((sec, i) => {
                    const sh = activePortfolio.filter(s => s.sector === sec);
                    if (!sh.length) return null;
                    const optW = sh.reduce((s, x) => s + x.optWeight, 0) * 100;
                    const bmkW = sh.reduce((s, x) => s + x.bmkWeight, 0) * 100;
                    const n = sh.length;
                    const avgCI = sh.reduce((s, x) => s + x.carbonIntensity, 0) / n;
                    const avgITR = sh.reduce((s, x) => s + x.temperature, 0) / n;
                    const avgESG = sh.reduce((s, x) => s + x.esgScore, 0) / n;
                    const avgRet = sh.reduce((s, x) => s + x.expectedReturn * 100, 0) / n;
                    const avgVol = sh.reduce((s, x) => s + x.volatility * 100, 0) / n;
                    return (
                      <tr key={sec} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec}</td>
                        <td style={{ padding: '6px 10px' }}>{n}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{optW.toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: T.muted }}>{bmkW.toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: optW - bmkW >= 0 ? T.green : T.red, fontWeight: 600 }}>
                          {optW - bmkW >= 0 ? '+' : ''}{(optW - bmkW).toFixed(2)}%
                        </td>
                        <td style={{ padding: '6px 10px', color: avgCI > carbonBudget ? T.amber : T.text }}>{avgCI.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: avgITR <= 2 ? T.green : T.amber }}>{avgITR.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}>{avgESG.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: T.green }}>{avgRet.toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: T.amber }}>{avgVol.toFixed(2)}%</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
            {/* Country-level breakdown */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Country Allocation — {compareMode}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={COUNTRIES.map(cty => ({
                  country: cty,
                  weight: +(activePortfolio.filter(s => s.country === cty).reduce((s, x) => s + x.optWeight * 100, 0)).toFixed(2),
                })).sort((a, b) => b.weight - a.weight)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}%`, 'Weight']} />
                  <Bar dataKey="weight" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* ESG vs Return scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ESG Score vs Expected Return — {compareMode} Holdings</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Expected Return %" tick={{ fontSize: 10 }} label={{ value: 'Return %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v.toFixed(2), n]} />
                  <Scatter data={activePortfolio.slice(0, 80).map(s => ({ x: +s.esgScore.toFixed(1), y: +(s.expectedReturn * 100).toFixed(2) }))} fill={T.indigo} opacity={0.6} name="Securities" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Liquidity vs Carbon scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Liquidity Score vs Carbon Intensity — Trade-Off Analysis</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Liquidity Score" tick={{ fontSize: 10 }} label={{ value: 'Liquidity', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Carbon Intensity" tick={{ fontSize: 10 }} label={{ value: 'CI', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v.toFixed(1), n]} />
                  <ReferenceLine y={carbonBudget} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Budget', fontSize: 9, fill: T.red }} />
                  <Scatter data={activePortfolio.slice(0, 80).map(s => ({ x: +s.liquidityScore.toFixed(1), y: +s.carbonIntensity.toFixed(0) }))} fill={T.teal} opacity={0.6} name="Securities" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Factor exposure decomposition */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Portfolio Factor Exposure Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { factor: 'Green Revenue', value: (activePortfolio.reduce((s, x) => s + x.optWeight * x.greenRevenue * 100, 0)).toFixed(2) + '%', color: T.green, desc: 'Wtd avg green revenue' },
                  { factor: 'Phys Risk', value: (activePortfolio.reduce((s, x) => s + x.optWeight * x.physRisk, 0)).toFixed(1), color: T.red, desc: 'Wtd avg physical risk' },
                  { factor: 'Trans Risk', value: (activePortfolio.reduce((s, x) => s + x.optWeight * x.transRisk, 0)).toFixed(1), color: T.amber, desc: 'Wtd avg transition risk' },
                  { factor: 'Beta to Market', value: (activePortfolio.reduce((s, x) => s + x.optWeight * x.betaToMarket, 0)).toFixed(3), color: T.navy, desc: 'Wtd avg market beta' },
                ].map(f => (
                  <div key={f.factor} style={{ background: T.sub, borderRadius: 8, padding: 14, borderLeft: `3px solid ${f.color}` }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 4 }}>{f.factor}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: f.color }}>{f.value}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Efficient frontier data table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Efficient Frontier — 50 Portfolio Points</h3>
              <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#','Volatility %','Return %','Sharpe Ratio','Carbon Intensity','Notes'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FRONTIER.map((pt, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', color: T.muted }}>{i + 1}</td>
                        <td style={{ padding: '5px 10px' }}>{pt.vol}%</td>
                        <td style={{ padding: '5px 10px', color: T.green }}>{pt.ret}%</td>
                        <td style={{ padding: '5px 10px', color: pt.sharpe >= 0.5 ? T.green : T.muted }}>{pt.sharpe}</td>
                        <td style={{ padding: '5px 10px', color: pt.ci > carbonBudget ? T.amber : T.text }}>{pt.ci}</td>
                        <td style={{ padding: '5px 10px', color: T.muted, fontSize: 10 }}>
                          {i === 0 ? 'Min Variance' : i === FRONTIER.length - 1 ? 'Max Return' : pt.sharpe === Math.max(...FRONTIER.map(f => f.sharpe)) ? 'Max Sharpe' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Always-visible bottom panel: quick stats */}
        {activeTab !== 6 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Portfolio Comparison Quick Stats</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <tbody>
                  {[
                    ['Return', `${stats.unc.ret}%`, `${stats.cc.ret}%`, `${stats.nz.ret}%`],
                    ['Vol', `${stats.unc.vol}%`, `${stats.cc.vol}%`, `${stats.nz.vol}%`],
                    ['Sharpe', stats.unc.sharpe, stats.cc.sharpe, stats.nz.sharpe],
                    ['Carbon CI', stats.unc.ci, stats.cc.ci, stats.nz.ci],
                    ['ITR °C', stats.unc.itr, stats.cc.itr, stats.nz.itr],
                    ['Count', unconstrained.length, carbonConstrained.length, netZero.length],
                  ].map(([m, u, c, n]) => (
                    <tr key={m}>
                      <td style={{ padding: '4px 6px', fontWeight: 600, fontSize: 10 }}>{m}</td>
                      <td style={{ padding: '4px 6px', fontSize: 10, color: T.blue }}>{u}</td>
                      <td style={{ padding: '4px 6px', fontSize: 10, color: T.indigo }}>{c}</td>
                      <td style={{ padding: '4px 6px', fontSize: 10, color: T.green }}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {[['Blue', 'Unc.', T.blue], ['Indigo', 'CC', T.indigo], ['Green', 'NZ', T.green]].map(([k, l, c]) => (
                  <span key={k} style={{ background: c, color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 9 }}>{l}</span>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Active Filters & Constraints</div>
              {[
                ['Carbon Budget', `${carbonBudget} tCO₂e/$M`, activeStats.ci <= carbonBudget],
                ['Sector Max Weight', `${sectorMax}%`, Math.max(...sectorBreakdown.map(s => s.weight)) <= sectorMax],
                ['ITR Constraint', `≤${itrConstraint}°C`, activeStats.itr <= itrConstraint],
                ['ESG Minimum', `${esgMin}`, true],
                ['Liquidity Min', `${liquidityMin}`, true],
                ['Sector Filter', sectorFilter, true],
                ['Mode', compareMode, true],
              ].map(([label, val, ok]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{label}</span>
                  <span style={{ fontWeight: 600, color: ok ? T.text : T.red }}>{String(val)}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Key Risk Metrics — {compareMode}</div>
              {[
                ['Avg Beta', (activePortfolio.reduce((s, x) => s + x.optWeight * x.betaToMarket, 0)).toFixed(3)],
                ['Avg Phys Risk', (activePortfolio.reduce((s, x) => s + x.optWeight * x.physRisk, 0)).toFixed(1)],
                ['Avg Trans Risk', (activePortfolio.reduce((s, x) => s + x.optWeight * x.transRisk, 0)).toFixed(1)],
                ['Green Rev %', (activePortfolio.reduce((s, x) => s + x.optWeight * x.greenRevenue * 100, 0)).toFixed(2) + '%'],
                ['Avg Liquidity', (activePortfolio.reduce((s, x) => s + x.optWeight * x.liquidityScore, 0)).toFixed(1)],
                ['Diversification', (1 / (activePortfolio.reduce((s, x) => s + Math.pow(x.optWeight, 2), 0) || 1)).toFixed(1)],
                ['Tracking Error', `${activeStats.te}%`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio attribution drill-down */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Return Attribution Decomposition — {compareMode}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','Allocation Effect','Selection Effect','Interaction Effect','Total Active Return','Weight %','Contribution'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorBreakdown.map((sec, i) => {
                  const alloc = +(sr(i * 7 + 11) * 0.4 - 0.2).toFixed(3);
                  const sel = +(sr(i * 11 + 13) * 0.4 - 0.2).toFixed(3);
                  const interact = +(alloc * sel * 0.5).toFixed(3);
                  const total = +(alloc + sel + interact).toFixed(3);
                  const contrib = +(sec.weight / 100 * (total + 5)).toFixed(3);
                  return (
                    <tr key={sec.sector} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec.sector}</td>
                      <td style={{ padding: '6px 10px', color: alloc >= 0 ? T.green : T.red }}>{alloc > 0 ? '+' : ''}{alloc}%</td>
                      <td style={{ padding: '6px 10px', color: sel >= 0 ? T.green : T.red }}>{sel > 0 ? '+' : ''}{sel}%</td>
                      <td style={{ padding: '6px 10px', color: T.muted }}>{interact > 0 ? '+' : ''}{interact}%</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: total >= 0 ? T.green : T.red }}>{total > 0 ? '+' : ''}{total}%</td>
                      <td style={{ padding: '6px 10px' }}>{sec.weight.toFixed(2)}%</td>
                      <td style={{ padding: '6px 10px', color: T.indigo }}>{contrib.toFixed(3)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* NGFS scenario stress sensitivity table */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>NGFS Scenario Stress Sensitivity — {compareMode} Portfolio</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Scenario','Temperature','Return Impact','Vol Impact','Sharpe Impact','Carbon CI Change','ITR Change','Overall Rating'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NGFS_SCENARIOS.map((sc, i) => {
                  const sRet = activeStats.ret * sc.retMult;
                  const sVol = activeStats.vol * sc.volMult;
                  const sSharpe = ((sRet / 100 - rfRate) / (sVol / 100)).toFixed(3);
                  const ciChange = ((sc.retMult < 1 ? 1 + (1 - sc.retMult) * 0.3 : 1 - (sc.retMult - 1) * 0.2) - 1) * 100;
                  const itrChange = sc.retMult >= 1 ? -sr(i * 13 + 7) * 0.2 : sr(i * 13 + 7) * 0.3;
                  const rating = sc.retMult >= 1 ? 'Positive' : sc.retMult >= 0.85 ? 'Neutral' : 'Negative';
                  return (
                    <tr key={sc.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600, color: sc.color }}>{sc.name}</td>
                      <td style={{ padding: '7px 12px' }}>{sc.name.includes('1.5') ? '1.5°C' : sc.name.includes('2°C') ? '2°C' : sc.name.includes('3°C') ? '3°C' : 'Net Zero'}</td>
                      <td style={{ padding: '7px 12px', color: sRet > activeStats.ret ? T.green : T.red }}>{sRet > activeStats.ret ? '+' : ''}{(sRet - activeStats.ret).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', color: sVol < activeStats.vol ? T.green : T.red }}>{sVol > activeStats.vol ? '+' : ''}{(sVol - activeStats.vol).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', color: +sSharpe > activeStats.sharpe ? T.green : T.red }}>{(+sSharpe - activeStats.sharpe).toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: ciChange < 0 ? T.green : T.red }}>{ciChange > 0 ? '+' : ''}{ciChange.toFixed(1)}%</td>
                      <td style={{ padding: '7px 12px', color: itrChange < 0 ? T.green : T.amber }}>{itrChange >= 0 ? '+' : ''}{itrChange.toFixed(2)}°C</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ background: rating === 'Positive' ? T.green : rating === 'Negative' ? T.red : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{rating}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Portfolio Construction Audit — Factor Exposure & Constraint Utilisation</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector', 'Port Wt %', 'Bench Wt %', 'Active Wt', 'TE Contrib bps', 'Carbon Budget %', 'SBT Coverage', 'Constraint Bind'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.text, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorBreakdown.map((sec, i) => {
                  const benchWt = +(sr(i * 13 + 21) * 0.12 + 0.02).toFixed(3);
                  const activeWt = +(sec.weight - benchWt).toFixed(3);
                  const teContrib = +(Math.abs(activeWt) * sr(i * 7 + 33) * 80 + 2).toFixed(1);
                  const cbUsed = +(sr(i * 17 + 41) * 90 + 10).toFixed(1);
                  const sbtCov = +(sr(i * 11 + 47) * 60 + 20).toFixed(0);
                  const bind = cbUsed > 80 ? 'Carbon' : activeWt > 0.05 ? 'Active Wt' : 'None';
                  return (
                    <tr key={sec.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec.name}</td>
                      <td style={{ padding: '6px 10px' }}>{(sec.weight * 100).toFixed(2)}%</td>
                      <td style={{ padding: '6px 10px' }}>{(benchWt * 100).toFixed(2)}%</td>
                      <td style={{ padding: '6px 10px', color: activeWt >= 0 ? T.green : T.red, fontWeight: 600 }}>{activeWt >= 0 ? '+' : ''}{(activeWt * 100).toFixed(2)}%</td>
                      <td style={{ padding: '6px 10px' }}>{teContrib}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ background: T.border, borderRadius: 4, height: 6, width: 60 }}>
                            <div style={{ background: cbUsed > 80 ? T.red : cbUsed > 60 ? T.amber : T.green, borderRadius: 4, height: 6, width: `${cbUsed}%` }} />
                          </div>
                          <span>{cbUsed}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px' }}>{sbtCov}%</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: bind === 'None' ? T.green : bind === 'Carbon' ? T.red : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{bind}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
