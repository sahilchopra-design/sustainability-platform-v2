/* EP-DD1: Climate WACC Engine — Sprint DD — v2 */
import React, { useState, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Utilities', 'Industrials', 'Materials', 'Technology', 'Financials', 'Healthcare', 'Consumer'];
const COUNTRIES = ['USA', 'UK', 'Germany', 'France', 'Japan', 'Canada', 'Australia', 'Netherlands'];
const RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];
const OUTLOOKS = ['Positive', 'Stable', 'Negative'];

const COMPANIES = Array.from({ length: 80 }, (_, i) => {
  const sec = SECTORS[i % 8];
  const baseWacc = 0.06 + sr(i * 7) * 0.06;
  const climateRiskPremium = (sec === 'Energy' || sec === 'Utilities' || sec === 'Materials') ? sr(i * 11) * 0.025 + 0.01 : sr(i * 11) * 0.012;
  const greenDiscount = sr(i * 13) * 0.015;
  const esgScore = 30 + sr(i * 17) * 60;
  const beta = 0.7 + sr(i * 19) * 1.3;
  const marketCap = 2 + sr(i * 23) * 198;
  const taxRate = 0.18 + sr(i * 29) * 0.12;
  const debtWeight = 0.2 + sr(i * 31) * 0.4;
  const equityWeight = 1 - debtWeight;
  const equityCost = baseWacc * 1.3 + climateRiskPremium;
  const debtCost = baseWacc * 0.6 + sr(i * 37) * 0.02;
  const carbonIntensity = sec === 'Energy' ? 200 + sr(i * 41) * 800 : sec === 'Materials' ? 100 + sr(i * 41) * 400 : 10 + sr(i * 41) * 190;
  return {
    id: i + 1,
    name: `${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'][i % 10]} ${sec} ${['Corp', 'Group', 'Holdings', 'Ltd', 'AG', 'SA', 'Plc', 'Inc'][i % 8]}`,
    ticker: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}${String.fromCharCode(65 + ((i * 7) % 26))}`,
    sector: sec,
    country: COUNTRIES[i % 8],
    marketCap: +marketCap.toFixed(1),
    baseWacc: +baseWacc.toFixed(4),
    equityCost: +equityCost.toFixed(4),
    debtCost: +debtCost.toFixed(4),
    taxRate: +taxRate.toFixed(3),
    debtWeight: +debtWeight.toFixed(3),
    equityWeight: +equityWeight.toFixed(3),
    beta: +beta.toFixed(2),
    climateRiskPremium: +climateRiskPremium.toFixed(4),
    greenDiscount: +greenDiscount.toFixed(4),
    physicalRiskAdj: +(sr(i * 43) * 0.01).toFixed(4),
    transitionRiskAdj: +(sr(i * 47) * 0.015).toFixed(4),
    adjustedWacc: +(baseWacc + climateRiskPremium - greenDiscount).toFixed(4),
    esgScore: +esgScore.toFixed(1),
    carbonIntensity: +carbonIntensity.toFixed(0),
    sbtiAligned: sr(i * 53) > 0.45,
    nzTarget: sr(i * 59) > 0.55,
    spread: +(80 + sr(i * 61) * 320).toFixed(0),
    rating: RATINGS[Math.floor(sr(i * 67) * 6)],
    creditOutlook: OUTLOOKS[Math.floor(sr(i * 71) * 3)],
  };
});

const SECTOR_COLORS = { Energy: '#dc2626', Utilities: '#2563eb', Industrials: '#d97706', Materials: '#7c3aed', Technology: '#059669', Financials: '#0891b2', Healthcare: '#db2777', Consumer: '#65a30d' };
const TABS = ['WACC Dashboard', 'Equity Cost Model', 'Debt Cost Model', 'Sector Analysis', 'Scenario Comparison', 'Peer Benchmarking', 'Capital Optimizer', 'ESG-CAPM'];

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
export default function ClimateWaccEnginePage() {

  const [tab, setTab] = useState(0);
  const [selectedSector, setSelectedSector] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );

  const filtered = useMemo(() => selectedSector === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === selectedSector), [selectedSector]);

  const avgAdjWacc = filtered.length ? (filtered.reduce((s, c) => s + c.adjustedWacc, 0) / filtered.length * 100) : 0;
  const avgBaseWacc = filtered.length ? (filtered.reduce((s, c) => s + c.baseWacc, 0) / filtered.length * 100) : 0;
  const avgEsg = filtered.length ? (filtered.reduce((s, c) => s + c.esgScore, 0) / filtered.length) : 0;
  const avgCarbonIntensity = filtered.length ? (filtered.reduce((s, c) => s + c.carbonIntensity, 0) / filtered.length) : 0;
  const sbtiCount = filtered.filter(c => c.sbtiAligned).length;

  const sectorSummary = useMemo(() => SECTORS.map(sec => {
    const arr = COMPANIES.filter(c => c.sector === sec);
    return {
      sector: sec,
      baseWacc: arr.length ? +(arr.reduce((s, c) => s + c.baseWacc * 100, 0) / arr.length).toFixed(2) : 0,
      adjustedWacc: arr.length ? +(arr.reduce((s, c) => s + c.adjustedWacc * 100, 0) / arr.length).toFixed(2) : 0,
      climatePremium: arr.length ? +(arr.reduce((s, c) => s + c.climateRiskPremium * 100, 0) / arr.length).toFixed(2) : 0,
      greenDiscount: arr.length ? +(arr.reduce((s, c) => s + c.greenDiscount * 100, 0) / arr.length).toFixed(2) : 0,
      esgScore: arr.length ? +(arr.reduce((s, c) => s + c.esgScore, 0) / arr.length).toFixed(1) : 0,
    };
  }), []);

  const carbonAdjustedWacc = useMemo(() => filtered.map(c => ({
    name: c.ticker,
    base: +(c.baseWacc * 100).toFixed(2),
    adjusted: +(c.adjustedWacc * 100).toFixed(2),
    carbonAdj: +(c.adjustedWacc * 100 + (c.carbonIntensity / 1000) * (carbonPrice / 150) * 0.5).toFixed(2),
  })).slice(0, 20), [filtered, carbonPrice]);

  const scatterData = useMemo(() => filtered.map(c => ({
    x: c.esgScore,
    y: +(c.adjustedWacc * 100).toFixed(2),
    z: c.marketCap,
    name: c.ticker,
    sector: c.sector,
  })), [filtered]);

  const waterfallData = useMemo(() => {
    const c = selectedCompany;
    return [
      { name: 'Risk-Free Rate', value: +(c.baseWacc * 0.4 * 100).toFixed(2), fill: T.blue },
      { name: 'Market Premium', value: +(c.baseWacc * 0.35 * 100).toFixed(2), fill: T.indigo },
      { name: 'Credit Spread', value: +(c.debtCost * c.debtWeight * 100).toFixed(2), fill: T.teal },
      { name: 'Climate Risk', value: +(c.climateRiskPremium * 100).toFixed(2), fill: T.red },
      { name: 'Green Discount', value: -(c.greenDiscount * 100).toFixed(2), fill: T.green },
      { name: 'Physical Adj', value: +(c.physicalRiskAdj * 100).toFixed(2), fill: T.amber },
      { name: 'Final WACC', value: +(c.adjustedWacc * 100).toFixed(2), fill: T.gold },
    ];
  }, [selectedCompany, T]);

  const ngfsScenarios = [
    { scenario: 'Net Zero 2050', waccDelta: -0.8, carbonPrice: 200 },
    { scenario: 'Below 2°C', waccDelta: -0.3, carbonPrice: 120 },
    { scenario: 'NDC Scenario', waccDelta: 0.2, carbonPrice: 75 },
    { scenario: 'Current Policies', waccDelta: 0.9, carbonPrice: 30 },
    { scenario: 'Divergent NZ', waccDelta: 0.5, carbonPrice: 150 },
  ];

  const scenarioData = ngfsScenarios.map(s => ({
    scenario: s.scenario,
    baseWacc: +avgBaseWacc.toFixed(2),
    adjustedWacc: +(avgBaseWacc + s.waccDelta).toFixed(2),
    carbonPrice: s.carbonPrice,
  }));

  const capmData = useMemo(() => filtered.slice(0, 30).map(c => ({
    name: c.ticker,
    climateBeta: +(c.beta * (1 + c.climateRiskPremium * 10)).toFixed(2),
    standardBeta: c.beta,
    equityCost: +(c.equityCost * 100).toFixed(2),
    esgScore: c.esgScore,
  })), [filtered]);

  const capitalOptData = useMemo(() => {
    const cp = carbonPrice;
    return filtered.slice(0, 15).map(c => {
      const carbonLiability = c.carbonIntensity * cp / 1000000;
      const optDebt = Math.min(0.7, c.debtWeight + carbonLiability * 0.3);
      const optEquity = 1 - optDebt;
      const optWacc = optEquity * c.equityCost + optDebt * c.debtCost * (1 - c.taxRate);
      return {
        name: c.ticker,
        currentWacc: +(c.adjustedWacc * 100).toFixed(2),
        optimalWacc: +(optWacc * 100).toFixed(2),
        saving: +((c.adjustedWacc - optWacc) * 100).toFixed(2),
      };
    });
  }, [filtered, carbonPrice]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DD1 · CORPORATE FINANCE & CAPITAL MARKETS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Climate WACC Engine</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>80 companies · 8 sectors · Climate-adjusted cost of capital · NGFS scenario overlay · ESG-CAPM integration</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Carbon Price: ${carbonPrice}/tCO₂</span>
          <input type="range" min={0} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <select value={selectedCompany.id} onChange={e => setSelectedCompany(COMPANIES.find(c => c.id === +e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          {COMPANIES.slice(0, 20).map(c => <option key={c.id} value={c.id}>{c.ticker} — {c.name.split(' ')[0]}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Adjusted WACC" value={`${avgAdjWacc.toFixed(2)}%`} sub="Climate-adjusted" color={T.navy} />
        <KpiCard label="Avg Base WACC" value={`${avgBaseWacc.toFixed(2)}%`} sub="Pre-climate" color={T.indigo} />
        <KpiCard label="Climate Premium" value={`+${(avgAdjWacc - avgBaseWacc).toFixed(2)}%`} sub="Avg uplift" color={T.red} />
        <KpiCard label="Avg ESG Score" value={avgEsg.toFixed(0)} sub="Out of 100" color={T.green} />
        <KpiCard label="SBTi Aligned" value={`${sbtiCount}/${filtered.length}`} sub="Companies" color={T.teal} />
        <KpiCard label="Avg Carbon Intensity" value={avgCarbonIntensity.toFixed(0)} sub="tCO₂/$Mn revenue" color={T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: WACC Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WACC Waterfall — {selectedCompany.ticker}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="value" name="bps">
                    {waterfallData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Base vs Adjusted WACC (Top 20 Companies)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={carbonAdjustedWacc}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  <Bar dataKey="base" name="Base WACC" fill={T.blue} />
                  <Bar dataKey="adjusted" name="Adjusted WACC" fill={T.navy} />
                  <Bar dataKey="carbonAdj" name="Carbon-Adj WACC" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Company WACC Summary</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Ticker', 'Company', 'Sector', 'Base WACC', 'Climate Premium', 'Green Discount', 'Adj WACC', 'ESG', 'SBTi'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.navy, fontWeight: 700 }}>{c.ticker}</td>
                      <td style={{ padding: '7px 12px', color: T.textPri }}>{c.name.substring(0, 24)}</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: SECTOR_COLORS[c.sector] + '22', color: SECTOR_COLORS[c.sector], padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{c.sector}</span></td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{(c.baseWacc * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.red }}>+{(c.climateRiskPremium * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>-{(c.greenDiscount * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{(c.adjustedWacc * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ color: c.esgScore > 60 ? T.green : c.esgScore > 40 ? T.amber : T.red }}>{c.esgScore.toFixed(0)}</span></td>
                      <td style={{ padding: '7px 12px' }}><span style={{ color: c.sbtiAligned ? T.green : T.textSec }}>{c.sbtiAligned ? '✓' : '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Equity Cost Model */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Equity Cost Distribution by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  <Bar dataKey="adjustedWacc" name="Adjusted WACC %" fill={T.navy} />
                  <Bar dataKey="climatePremium" name="Climate Premium %" fill={T.red} />
                  <Bar dataKey="greenDiscount" name="Green Discount %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Beta Distribution (Standard vs Climate-Adjusted)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="standardBeta" name="Standard Beta" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Standard β', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="climateBeta" name="Climate Beta" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Climate β', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <ZAxis dataKey="esgScore" range={[40, 200]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v.toFixed(2), n]} />
                  <Scatter data={capmData} fill={T.indigo} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Equity Cost Model Detail</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Ticker', 'Sector', 'Beta', 'Equity Cost', 'Equity Weight', 'Physical Adj', 'Transition Adj', 'Carbon Intensity', 'NZ Target'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.navy, fontWeight: 700 }}>{c.ticker}</td>
                      <td style={{ padding: '7px 12px', color: T.textPri }}>{c.sector}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{c.beta.toFixed(2)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.red }}>{(c.equityCost * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{(c.equityWeight * 100).toFixed(1)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.amber }}>+{(c.physicalRiskAdj * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.amber }}>+{(c.transitionRiskAdj * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{c.carbonIntensity}</td>
                      <td style={{ padding: '7px 12px', color: c.nzTarget ? T.green : T.textSec }}>{c.nzTarget ? '✓ 2050' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Debt Cost Model */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Debt Cost by Rating</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={RATINGS.map(r => {
                  const arr = COMPANIES.filter(c => c.rating === r);
                  return { rating: r, debtCost: arr.length ? +(arr.reduce((s, c) => s + c.debtCost * 100, 0) / arr.length).toFixed(2) : 0, spread: arr.length ? +(arr.reduce((s, c) => s + c.spread, 0) / arr.length).toFixed(0) : 0 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}bps`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="debtCost" name="Debt Cost %" fill={T.indigo} />
                  <Bar yAxisId="r" dataKey="spread" name="Spread (bps)" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Debt Weight Distribution</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorSummary.map(s => ({ ...s, debtWeight: +(COMPANIES.filter(c => c.sector === s.sector).reduce((a, c) => a + c.debtWeight, 0) / Math.max(1, COMPANIES.filter(c => c.sector === s.sector).length) * 100).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="debtWeight" name="Avg Debt Weight %" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Debt Cost & Capital Structure</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Ticker', 'Rating', 'Outlook', 'Debt Cost', 'Spread (bps)', 'Debt Weight', 'Tax Rate', 'Tax Shield', 'After-Tax Debt'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.navy, fontWeight: 700 }}>{c.ticker}</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ fontFamily: T.fontMono, color: c.rating.startsWith('A') ? T.green : c.rating === 'BBB' ? T.amber : T.red }}>{c.rating}</span></td>
                      <td style={{ padding: '7px 12px', color: c.creditOutlook === 'Positive' ? T.green : c.creditOutlook === 'Negative' ? T.red : T.textSec, fontSize: 11 }}>{c.creditOutlook}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{(c.debtCost * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{c.spread}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{(c.debtWeight * 100).toFixed(1)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{(c.taxRate * 100).toFixed(1)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>{(c.debtCost * c.taxRate * 100).toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.teal }}>{(c.debtCost * (1 - c.taxRate) * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sector Analysis */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector WACC Heatmap</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {sectorSummary.map(s => (
                  <div key={s.sector} style={{ background: SECTOR_COLORS[s.sector] + '22', border: `1px solid ${SECTOR_COLORS[s.sector]}44`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: SECTOR_COLORS[s.sector], fontWeight: 700 }}>{s.sector}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: '6px 0' }}>{s.adjustedWacc.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>Climate +{s.climatePremium.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: T.green }}>Green -{s.greenDiscount.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>ESG: {s.esgScore.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Climate Premium vs Green Discount</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorSummary} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={80} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend />
                  <Bar dataKey="climatePremium" name="Climate Risk %" fill={T.red} />
                  <Bar dataKey="greenDiscount" name="Green Discount %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Scenario Comparison */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>NGFS Scenario WACC Impact</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend />
                <Bar dataKey="baseWacc" name="Base WACC" fill={T.blue} />
                <Bar dataKey="adjustedWacc" name="Scenario-Adj WACC" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {scenarioData.map(s => (
              <div key={s.scenario} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{s.scenario}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.adjustedWacc > s.baseWacc ? T.red : T.green }}>{s.adjustedWacc.toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: T.textSec }}>WACC delta: {s.adjustedWacc > s.baseWacc ? '+' : ''}{(s.adjustedWacc - s.baseWacc).toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: T.textSec }}>Carbon: ${s.carbonPrice}/tCO₂</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Peer Benchmarking */}
      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WACC vs ESG Score — Peer Scatter</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="ESG Score" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'ESG Score', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="Adj WACC %" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} label={{ value: 'Adj WACC %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <ZAxis dataKey="z" range={[40, 300]} />
                <Tooltip content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 10, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>ESG: {payload[0].payload.x.toFixed(0)}</div>
                    <div>WACC: {payload[0].payload.y}%</div>
                    <div>Sector: {payload[0].payload.sector}</div>
                  </div>
                ) : null} />
                {SECTORS.map(sec => (
                  <Scatter key={sec} name={sec} data={scatterData.filter(d => d.sector === sec)} fill={SECTOR_COLORS[sec]} fillOpacity={0.75} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 6: Capital Optimizer */}
      {tab === 6 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Carbon Price Sensitivity: ${carbonPrice}/tCO₂</div>
            <input type="range" min={0} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: '100%', marginBottom: 16 }} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={capitalOptData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend />
                <Bar dataKey="currentWacc" name="Current WACC %" fill={T.amber} />
                <Bar dataKey="optimalWacc" name="Optimal WACC %" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Capital Optimizer Results</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Ticker', 'Current WACC', 'Optimal WACC', 'WACC Saving', 'Recommendation'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {capitalOptData.map((c, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{c.currentWacc}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>{c.optimalWacc}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: c.saving > 0 ? T.green : T.red }}>{c.saving > 0 ? `-${c.saving}%` : `+${Math.abs(c.saving)}%`}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: T.textSec }}>{c.saving > 0.3 ? 'Rebalance toward equity + green bonds' : c.saving > 0 ? 'Minor optimization available' : 'Hold current structure'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: ESG-CAPM */}
      {tab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ESG-CAPM: Climate Beta vs Equity Cost</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="climateBeta" name="Climate Beta" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Climate Beta', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="equityCost" name="Equity Cost" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} label={{ value: 'Equity Cost %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <ZAxis dataKey="esgScore" range={[40, 200]} />
                  <Tooltip formatter={(v, n) => [n === 'Equity Cost' ? `${v}%` : v.toFixed(2), n]} />
                  <Scatter data={capmData} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ESG Score vs WACC Reduction</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'ESG Score', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="y" name="WACC Adj" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip />
                  <Scatter data={filtered.slice(0, 30).map(c => ({ esgScore: c.esgScore, y: +(c.greenDiscount * 100).toFixed(2), name: c.ticker }))} fill={T.green} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ESG-CAPM Factor Attribution</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Ticker', 'ESG Score', 'Standard Beta', 'Climate Beta', 'ESG Premium', 'Climate Adj Re', 'vs Base Re'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {capmData.slice(0, 12).map((c, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '7px 12px' }}><span style={{ color: c.esgScore > 60 ? T.green : c.esgScore > 40 ? T.amber : T.red }}>{c.esgScore.toFixed(0)}</span></td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{c.standardBeta.toFixed(2)}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.amber }}>{c.climateBeta.toFixed(2)}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: c.esgScore > 60 ? T.green : T.textSec }}>{c.esgScore > 60 ? '-0.' + Math.floor((c.esgScore - 60) / 10) : '+0.1'}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.navy, fontWeight: 700 }}>{c.equityCost.toFixed(2)}%</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>-{(c.climateBeta - c.standardBeta).toFixed(2)}β</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
