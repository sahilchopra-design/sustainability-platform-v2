/* EP-DD6: Climate Capital Markets — Sprint DD */
import React, { useState, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TYPES = ['Green Bond', 'Sustainability Bond', 'SLB', 'Blue Bond', 'Transition Bond', 'Social Bond'];
const SECTORS = ['Energy', 'Finance', 'Transport', 'Buildings', 'Water', 'Tech', 'Agri', 'Waste'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const RATINGS = ['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB'];
const SDG_TAGS = ['SDG 6', 'SDG 7', 'SDG 9', 'SDG 11', 'SDG 12', 'SDG 13', 'SDG 14', 'SDG 15'];
const TYPE_COLORS = { 'Green Bond': '#059669', 'Sustainability Bond': '#0891b2', 'SLB': '#2563eb', 'Blue Bond': '#0284c7', 'Transition Bond': '#d97706', 'Social Bond': '#7c3aed' };
const SECTOR_COLORS = { Energy: '#dc2626', Finance: '#2563eb', Transport: '#d97706', Buildings: '#0891b2', Water: '#0284c7', Tech: '#059669', Agri: '#65a30d', Waste: '#7c3aed' };

const INSTRUMENTS = Array.from({ length: 100 }, (_, i) => {
  const type = TYPES[i % 6];
  const sec = SECTORS[i % 8];
  const notional = 0.1 + sr(i * 7) * 4.9;
  const yield_ = 1.5 + sr(i * 11) * 4.5;
  const spread = 20 + sr(i * 13) * 200;
  const greenium = -(2 + sr(i * 17) * 22);
  const volume30d = 5 + sr(i * 19) * 995;
  const bidAskBps = 1 + sr(i * 23) * 15;
  const liquidityScore = 100 - bidAskBps * 4 - sr(i * 29) * 20;
  const impactScore = 40 + sr(i * 31) * 55;
  const sdgCount = 1 + Math.floor(sr(i * 37) * 4);
  return {
    id: i + 1,
    name: `${['Horizon', 'Vertex', 'Apex', 'Summit', 'Crest', 'Pinnacle'][i % 6]} ${type.split(' ')[0]} ${2025 + (i % 5)}`,
    issuer: `${['GreenCo', 'NatPower', 'ClimaBank', 'SustainRE', 'EcoTrans', 'BlueWater'][i % 6]} ${['Corp', 'AG', 'Plc', 'SA'][i % 4]}`,
    type,
    sector: sec,
    notional: +notional.toFixed(2),
    yield: +yield_.toFixed(2),
    spread: +spread.toFixed(0),
    greenium: +greenium.toFixed(1),
    rating: RATINGS[Math.floor(sr(i * 41) * 7)],
    region: REGIONS[i % 5],
    maturity: 2026 + Math.floor(sr(i * 43) * 12),
    volume30d: +volume30d.toFixed(0),
    bidAskBps: +bidAskBps.toFixed(1),
    liquidityScore: +Math.max(10, liquidityScore).toFixed(1),
    impactScore: +impactScore.toFixed(1),
    sdgTags: Array.from({ length: sdgCount }, (_, j) => SDG_TAGS[(i + j * 3) % 8]),
  };
});

const ESG_INDICES = [
  { name: 'Bloomberg MSCI Green Bond', aum: 285, ytdReturn: 4.2, greeniumAvg: -8.5, carbonIntensity: 28, vol: 6.2 },
  { name: 'FTSE World Govt Green Bond', aum: 142, ytdReturn: 3.8, greeniumAvg: -7.2, carbonIntensity: 32, vol: 5.8 },
  { name: 'S&P Green Bond Index', aum: 198, ytdReturn: 4.9, greeniumAvg: -9.1, carbonIntensity: 25, vol: 6.8 },
  { name: 'Barclays MSCI SRI Bond', aum: 87, ytdReturn: 5.1, greeniumAvg: -6.8, carbonIntensity: 41, vol: 7.2 },
  { name: 'ICE BofA Green Bond', aum: 156, ytdReturn: 4.4, greeniumAvg: -8.2, carbonIntensity: 30, vol: 6.0 },
  { name: 'JPM JESG EM', aum: 64, ytdReturn: 6.3, greeniumAvg: -11.2, carbonIntensity: 58, vol: 9.1 },
  { name: 'Solactive Green Bond', aum: 43, ytdReturn: 4.0, greeniumAvg: -7.8, carbonIntensity: 35, vol: 6.5 },
  { name: 'iBoxx MSCI ESG EUR', aum: 118, ytdReturn: 3.6, greeniumAvg: -7.0, carbonIntensity: 38, vol: 5.5 },
  { name: 'MSCI Climate Paris Algn', aum: 225, ytdReturn: 5.5, greeniumAvg: -10.1, carbonIntensity: 22, vol: 7.4 },
  { name: 'PIMCO Climate Bond', aum: 72, ytdReturn: 4.7, greeniumAvg: -8.9, carbonIntensity: 27, vol: 6.3 },
  { name: 'Vanguard ESG Corp', aum: 189, ytdReturn: 5.2, greeniumAvg: -9.5, carbonIntensity: 44, vol: 7.0 },
  { name: 'BlackRock Sust. Corp', aum: 312, ytdReturn: 4.8, greeniumAvg: -8.7, carbonIntensity: 38, vol: 6.7 },
  { name: 'Amundi Planet Green', aum: 95, ytdReturn: 4.3, greeniumAvg: -8.0, carbonIntensity: 33, vol: 6.1 },
  { name: 'DWS ESG Global Govt', aum: 58, ytdReturn: 3.9, greeniumAvg: -7.5, carbonIntensity: 29, vol: 5.9 },
  { name: 'LGIM Climate Corp', aum: 78, ytdReturn: 4.6, greeniumAvg: -8.3, carbonIntensity: 31, vol: 6.4 },
  { name: 'Nordea Responsible', aum: 49, ytdReturn: 4.1, greeniumAvg: -7.9, carbonIntensity: 36, vol: 6.2 },
  { name: 'AXA Climate Transition', aum: 67, ytdReturn: 5.0, greeniumAvg: -9.0, carbonIntensity: 26, vol: 6.9 },
  { name: 'Robeco SDG Credit', aum: 54, ytdReturn: 4.8, greeniumAvg: -8.5, carbonIntensity: 40, vol: 7.1 },
  { name: 'Schroders Global Green', aum: 83, ytdReturn: 4.5, greeniumAvg: -8.1, carbonIntensity: 34, vol: 6.6 },
  { name: 'Columbia Green Bond', aum: 38, ytdReturn: 3.7, greeniumAvg: -7.3, carbonIntensity: 37, vol: 5.7 },
];

const INVESTORS = Array.from({ length: 30 }, (_, i) => {
  const aum = 5 + sr(i * 7) * 495;
  const esgMandate = 40 + sr(i * 11) * 55;
  const greenAlloc = esgMandate * (0.1 + sr(i * 13) * 0.4);
  return {
    id: i + 1,
    name: `${['Sovereign', 'Pension', 'Insurance', 'Asset Mgr', 'Endowment', 'DFI'][i % 6]} Fund ${i + 1}`,
    type: ['Pension Fund', 'Insurance', 'Asset Manager', 'SWF', 'DFI', 'Endowment'][i % 6],
    country: ['USA', 'UK', 'Germany', 'Japan', 'Canada', 'Australia', 'Norway', 'Netherlands'][i % 8],
    aum: +aum.toFixed(0),
    esgMandate: +esgMandate.toFixed(1),
    greenAlloc: +greenAlloc.toFixed(1),
    prefType: TYPES[i % 6],
    prefRegion: REGIONS[i % 5],
    minRating: RATINGS[Math.floor(sr(i * 17) * 4)],
    impactRequired: sr(i * 19) > 0.5,
  };
});

const TABS = ['Market Overview', 'Flow Analytics', 'Pricing Intelligence', 'Issuance Pipeline', 'Investor Universe', 'ESG Index Engine', 'Alpha Signals', 'Intelligence Hub'];

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
export default function ClimateCapitalMarketsPage() {

  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [filterSector, setFilterSector] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [sortBy, setSortBy] = useState('greenium');

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );

  const filtered = useMemo(() => INSTRUMENTS.filter(d =>
    (filterType === 'All' || d.type === filterType) &&
    (filterSector === 'All' || d.sector === filterSector) &&
    (filterRegion === 'All' || d.region === filterRegion)
  ), [filterType, filterSector, filterRegion]);

  const totalIssuance = filtered.reduce((s, d) => s + d.notional, 0);
  const totalVolume = filtered.reduce((s, d) => s + d.volume30d, 0);
  const avgGreenium = filtered.length ? filtered.reduce((s, d) => s + d.greenium, 0) / filtered.length : 0;
  const avgImpact = filtered.length ? filtered.reduce((s, d) => s + d.impactScore, 0) / filtered.length : 0;
  const avgLiquidity = filtered.length ? filtered.reduce((s, d) => s + d.liquidityScore, 0) / filtered.length : 0;
  const totalIndexAum = ESG_INDICES.reduce((s, idx) => s + idx.aum, 0);

  const typeBreakdown = useMemo(() => TYPES.map(t => {
    const arr = INSTRUMENTS.filter(d => d.type === t);
    return {
      type: t,
      notional: +(arr.reduce((s, d) => s + d.notional, 0)).toFixed(1),
      count: arr.length,
      greenium: arr.length ? +(arr.reduce((s, d) => s + d.greenium, 0) / arr.length).toFixed(1) : 0,
      impactScore: arr.length ? +(arr.reduce((s, d) => s + d.impactScore, 0) / arr.length).toFixed(1) : 0,
    };
  }), []);

  const sectorFlows = useMemo(() => SECTORS.map(s => {
    const arr = INSTRUMENTS.filter(d => d.sector === s);
    return {
      sector: s,
      volume: +(arr.reduce((s2, d) => s2 + d.volume30d, 0) / 1000).toFixed(1),
      notional: +(arr.reduce((s2, d) => s2 + d.notional, 0)).toFixed(1),
    };
  }), []);

  const pricingCurve = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.yield - b.yield);
    return sorted.slice(0, 20).map(d => ({
      name: d.name.substring(0, 14),
      yield: d.yield,
      greenium: d.greenium,
      liquidityAdj: +(d.liquidityScore / 100 * d.impactScore).toFixed(1),
    }));
  }, [filtered]);

  const alphaSignals = useMemo(() => filtered.slice(0, 15).map(d => {
    const greeniumMomentum = d.greenium - (d.greenium * (1 + sr(d.id * 7) * 0.1 - 0.05));
    const ratingMig = sr(d.id * 13) > 0.75 ? 'Upgrade' : sr(d.id * 13) > 0.9 ? 'Downgrade' : 'Stable';
    const liquidityAlpha = d.liquidityScore > 70 ? +(d.impactScore * 0.05).toFixed(2) : 0;
    const signal = greeniumMomentum < -0.5 || ratingMig === 'Upgrade' ? 'BUY' : greeniumMomentum > 0.5 || ratingMig === 'Downgrade' ? 'SELL' : 'HOLD';
    return { name: d.name.substring(0, 18), type: d.type, greeniumMomentum: +greeniumMomentum.toFixed(1), ratingMig, liquidityAlpha, signal };
  }), [filtered]);

  const issuancePipeline = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const mn = i + 1;
    return {
      month: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} 2025`,
      expected: +(20 + sr(i * 7) * 30).toFixed(1),
      actual: i < 4 ? +(18 + sr(i * 11) * 28).toFixed(1) : null,
    };
  }), []);

  const indexPerformance = useMemo(() => [...ESG_INDICES].sort((a, b) => b.ytdReturn - a.ytdReturn).slice(0, 12), []);

  const intelligenceInsights = [
    { insight: 'Green Bond Market', detail: 'Q1 2025 issuance reached $185Bn, +24% YoY — driven by corporate RE and utility issuers', signal: 'Bullish', category: 'Market' },
    { insight: 'Greenium Compression', detail: 'EU benchmark greenium compressed to -7.2bps from -11.4bps — tightening supply/demand', signal: 'Watch', category: 'Pricing' },
    { insight: 'SLB Market', detail: 'SLBs with ambitious KPIs outperforming vanilla bonds by 18bps on avg — ESG momentum', signal: 'Opportunity', category: 'Flow' },
    { insight: 'Blue Bond Pipeline', detail: 'ASEAN blue bond pipeline $8.5Bn for H2 2025 — first mover advantage for early investors', signal: 'Bullish', category: 'Pipeline' },
    { insight: 'Rating Migration', detail: '12 issuers upgraded in Q1 2025 citing SBTi target alignment — ESG premium confirmed', signal: 'Bullish', category: 'Credit' },
    { insight: 'Transition Bonds', detail: 'Japanese transition bond framework announcement likely to unlock $30-50Bn market', signal: 'Bullish', category: 'Regulatory' },
    { insight: 'Liquidity Trends', detail: 'Bid/ask spreads widened 2.3bps in EM green bonds vs DM tightening 0.8bps — divergence', signal: 'Caution', category: 'Liquidity' },
    { insight: 'Alpha Signal', detail: 'Greenium momentum screen identifies 14 bonds with expanding greenium — potential mean reversion', signal: 'Tactical', category: 'Alpha' },
  ];

  const sortedInstruments = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'greenium') return arr.sort((a, b) => a.greenium - b.greenium);
    if (sortBy === 'impact') return arr.sort((a, b) => b.impactScore - a.impactScore);
    if (sortBy === 'liquidity') return arr.sort((a, b) => b.liquidityScore - a.liquidityScore);
    if (sortBy === 'yield') return arr.sort((a, b) => a.yield - b.yield);
    return arr;
  }, [filtered, sortBy]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DD6 · CORPORATE FINANCE & CAPITAL MARKETS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Climate Capital Markets</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>100 instruments · 20 ESG indices · 30 institutional investors · Flow analytics · Alpha signals</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="greenium">Sort: Greenium</option>
          <option value="impact">Sort: Impact Score</option>
          <option value="liquidity">Sort: Liquidity</option>
          <option value="yield">Sort: Yield</option>
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Issuance" value={`$${totalIssuance.toFixed(0)}Bn`} sub={`${filtered.length} instruments`} color={T.navy} />
        <KpiCard label="30D Volume" value={`$${totalVolume.toFixed(0)}Mn`} sub="Trading volume" color={T.blue} />
        <KpiCard label="Avg Greenium" value={`${avgGreenium.toFixed(1)}bps`} sub="Market-weighted" color={T.green} />
        <KpiCard label="Avg Impact Score" value={avgImpact.toFixed(0)} sub="Out of 100" color={T.teal} />
        <KpiCard label="Avg Liquidity" value={avgLiquidity.toFixed(0)} sub="Score / 100" color={T.indigo} />
        <KpiCard label="Total Index AUM" value={`$${totalIndexAum}Bn`} sub={`${ESG_INDICES.length} indices`} color={T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Market Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Issuance by Type ($Bn)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="notional" name="Notional $Bn">
                    {typeBreakdown.map((e, i) => <Cell key={i} fill={TYPE_COLORS[e.type]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Greenium by Instrument Type (bps)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}bps`} />
                  <Tooltip formatter={v => `${v}bps`} />
                  <Bar dataKey="greenium" name="Avg Greenium (bps)">
                    {typeBreakdown.map((e, i) => <Cell key={i} fill={T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Market Instrument Register</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Name', 'Type', 'Sector', 'Notional', 'Yield', 'Greenium', 'Spread', 'Rating', 'Liquidity', 'Impact'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedInstruments.slice(0, 15).map((d, i) => (
                    <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: TYPE_COLORS[d.type] + '22', color: TYPE_COLORS[d.type], padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{d.type}</span></td>
                      <td style={{ padding: '7px 12px', fontSize: 10, color: SECTOR_COLORS[d.sector] }}>{d.sector}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${d.notional}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.yield.toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>{d.greenium}bps</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>{d.spread}bps</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.teal }}>{d.rating}</td>
                      <td style={{ padding: '7px 12px', color: d.liquidityScore > 70 ? T.green : d.liquidityScore > 40 ? T.amber : T.red }}>{d.liquidityScore.toFixed(0)}</td>
                      <td style={{ padding: '7px 12px', color: d.impactScore > 70 ? T.green : d.impactScore > 50 ? T.amber : T.textSec }}>{d.impactScore.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Flow Analytics */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>30-Day Volume by Sector ($Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sectorFlows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="volume" name="30D Volume $Bn">
                    {sectorFlows.map((e, i) => <Cell key={i} fill={SECTOR_COLORS[e.sector]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Issuance vs Volume Correlation</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="notional" name="Notional $Bn" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Notional $Bn', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="volume" name="30D Volume $Bn" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '30D Vol $Bn', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip />
                  {SECTORS.map(s => (
                    <Scatter key={s} name={s} data={sectorFlows.filter(d => d.sector === s)} fill={SECTOR_COLORS[s]} fillOpacity={0.8} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pricing Intelligence */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Yield vs Greenium Efficiency Curve</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yield" name="Yield %" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Yield %', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="greenium" name="Greenium (bps)" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}bps`} />
                  <Tooltip formatter={(v, n) => [n === 'Yield %' ? `${v}%` : `${v}bps`, n]} />
                  <Scatter data={pricingCurve} fill={T.green} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Liquidity-Adjusted Impact Score</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pricingCurve.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                  <Tooltip />
                  <Bar dataKey="liquidityAdj" name="Liq-Adj Impact" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Issuance Pipeline */}
      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>2025 Issuance Pipeline ($Bn/month)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issuancePipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                <Tooltip formatter={v => v ? `$${v}Bn` : 'Pending'} />
                <Legend />
                <Bar dataKey="expected" name="Expected $Bn" fill={T.blue} fillOpacity={0.6} />
                <Bar dataKey="actual" name="Actual $Bn" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Investor Universe */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>AUM by Investor Type ($Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={['Pension Fund', 'Insurance', 'Asset Manager', 'SWF', 'DFI', 'Endowment'].map(t => {
                  const arr = INVESTORS.filter(i => i.type === t);
                  return { type: t.split(' ')[0], aum: +(arr.reduce((s, i) => s + i.aum, 0)).toFixed(0), esgMandate: arr.length ? +(arr.reduce((s, i) => s + i.esgMandate, 0) / arr.length).toFixed(1) : 0 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="aum" name="AUM $Bn" fill={T.navy} />
                  <Bar yAxisId="r" dataKey="esgMandate" name="ESG Mandate %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Investor Register</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Name', 'Type', 'AUM', 'ESG %', 'Green Alloc', 'Pref Type'].map(h => (
                        <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...INVESTORS].sort((a, b) => b.aum - a.aum).slice(0, 10).map((inv, i) => (
                      <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                        <td style={{ padding: '6px 8px', color: T.navy, fontWeight: 600 }}>{inv.name}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10 }}>{inv.type}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>${inv.aum}Bn</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>{inv.esgMandate.toFixed(0)}%</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: T.green }}>{inv.greenAlloc.toFixed(1)}%</td>
                        <td style={{ padding: '6px 8px', fontSize: 10, color: TYPE_COLORS[inv.prefType] }}>{inv.prefType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: ESG Index Engine */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ESG Index YTD Returns (%)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={indexPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} width={140} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="ytdReturn" name="YTD Return %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>AUM vs Carbon Intensity</div>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="aum" name="AUM $Bn" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'AUM $Bn', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="carbonIntensity" name="Carbon Intensity" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Carbon Intensity', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <ZAxis dataKey="ytdReturn" range={[40, 200]} />
                  <Tooltip content={({ payload }) => payload?.[0] ? (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 10, borderRadius: 6, fontSize: 11 }}>
                      <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                      <div>AUM: ${payload[0].payload.aum}Bn</div>
                      <div>Return: {payload[0].payload.ytdReturn}%</div>
                    </div>
                  ) : null} />
                  <Scatter data={ESG_INDICES} fill={T.indigo} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Alpha Signals */}
      {tab === 6 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Alpha Signal Generator — Greenium Momentum + Rating Migration</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Instrument', 'Type', 'Greenium Momentum', 'Rating Migration', 'Liquidity Alpha', 'Signal', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alphaSignals.map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                    <td style={{ padding: '7px 12px' }}><span style={{ background: TYPE_COLORS[d.type] + '22', color: TYPE_COLORS[d.type], padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{d.type}</span></td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.greeniumMomentum < 0 ? T.green : T.red }}>{d.greeniumMomentum > 0 ? '+' : ''}{d.greeniumMomentum}bps</td>
                    <td style={{ padding: '7px 12px', color: d.ratingMig === 'Upgrade' ? T.green : d.ratingMig === 'Downgrade' ? T.red : T.textSec }}>{d.ratingMig}</td>
                    <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.teal }}>{d.liquidityAlpha > 0 ? `+${d.liquidityAlpha}bps` : '—'}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 4, background: d.signal === 'BUY' ? T.green + '22' : d.signal === 'SELL' ? T.red + '22' : T.amber + '22', color: d.signal === 'BUY' ? T.green : d.signal === 'SELL' ? T.red : T.amber }}>{d.signal}</span>
                    </td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: T.textSec }}>{d.signal === 'BUY' ? 'Add to portfolio' : d.signal === 'SELL' ? 'Reduce exposure' : 'Monitor'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Intelligence Hub */}
      {tab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {intelligenceInsights.map((item, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{item.category}</div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{item.insight}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: item.signal === 'Bullish' ? T.green + '22' : item.signal === 'Caution' ? T.amber + '22' : item.signal === 'Opportunity' ? T.teal + '22' : T.blue + '22', color: item.signal === 'Bullish' ? T.green : item.signal === 'Caution' ? T.amber : item.signal === 'Opportunity' ? T.teal : T.blue, whiteSpace: 'nowrap' }}>{item.signal}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
