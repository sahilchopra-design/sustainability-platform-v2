import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const BOND_TYPES = [
  { type: 'Green Sovereign', color: T.sage, description: 'Proceeds finance green expenditure (renewables, transport, buildings)' },
  { type: 'Sustainability Bond', color: T.teal, description: 'Dual-use: green + social projects; SBG aligned' },
  { type: 'Climate Bond', color: T.navy, description: 'CBI-certified; strict climate criteria' },
  { type: 'Blue Bond', color: '#06b6d4', description: 'Ocean economy, fisheries, marine conservation' },
  { type: 'Transition Bond', color: T.amber, description: 'Transition sectors: shipping, steel, cement' },
  { type: 'SDG Bond', color: T.gold, description: 'SDG-linked: KPIs tied to coupon step-up/down' },
];

const ISSUERS = [
  { country: 'Germany', region: 'Europe', rating: 'AAA', type: 'Green Sovereign', outstanding: 62.5, yield: 2.41, spread: -4, greenPct: 100, sdg: [7, 11, 13, 15], verifier: 'CICERO', framework: 'German Green Bond Framework', renewTarget: 80, climateScore: 94, maturity: '2033', issued: 2020, couponPct: 0 },
  { country: 'France', region: 'Europe', rating: 'AA', type: 'Green Sovereign', outstanding: 55.1, yield: 2.88, spread: 48, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'Vigeo Eiris', framework: 'OAT Verte Framework', renewTarget: 40, climateScore: 88, maturity: '2044', issued: 2017, couponPct: 1.75 },
  { country: 'Netherlands', region: 'Europe', rating: 'AAA', type: 'Green Sovereign', outstanding: 21.3, yield: 2.52, spread: 8, greenPct: 100, sdg: [7, 11, 13, 14], verifier: 'CICERO', framework: 'Dutch State Green Bond Framework', renewTarget: 70, climateScore: 92, maturity: '2040', issued: 2019, couponPct: 0.5 },
  { country: 'Sweden', region: 'Europe', rating: 'AAA', type: 'Climate Bond', outstanding: 8.4, yield: 2.18, spread: -9, greenPct: 100, sdg: [7, 13, 15], verifier: 'CICERO', framework: 'Swedish Green Bond Framework', renewTarget: 90, climateScore: 96, maturity: '2030', issued: 2020, couponPct: 0 },
  { country: 'UK', region: 'Europe', rating: 'AA', type: 'Green Sovereign', outstanding: 31.5, yield: 4.12, spread: 3, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'Sustainalytics', framework: 'UK Green Financing Framework', renewTarget: 95, climateScore: 86, maturity: '2033', issued: 2021, couponPct: 0.875 },
  { country: 'Italy', region: 'Europe', rating: 'BBB+', type: 'Green Sovereign', outstanding: 27.0, yield: 3.82, spread: 142, greenPct: 100, sdg: [7, 9, 13, 15], verifier: 'DNV', framework: 'Italian Green Bond Framework', renewTarget: 65, climateScore: 78, maturity: '2035', issued: 2021, couponPct: 1.5 },
  { country: 'Spain', region: 'Europe', rating: 'A', type: 'Sustainability Bond', outstanding: 16.2, yield: 3.44, spread: 104, greenPct: 70, sdg: [7, 9, 11, 13], verifier: 'ISS ESG', framework: 'Kingdom of Spain Sovereign Green Bond Framework', renewTarget: 74, climateScore: 82, maturity: '2034', issued: 2021, couponPct: 0.5 },
  { country: 'Belgium', region: 'Europe', rating: 'AA-', type: 'Sustainability Bond', outstanding: 9.8, yield: 2.91, spread: 51, greenPct: 65, sdg: [3, 7, 13, 15], verifier: 'Vigeo Eiris', framework: 'Belgian OLO Green/Social Framework', renewTarget: 55, climateScore: 83, maturity: '2033', issued: 2018, couponPct: 1.25 },
  { country: 'Japan', region: 'Asia-Pacific', rating: 'A+', type: 'Climate Bond', outstanding: 11.2, yield: 1.08, spread: 6, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'JCR', framework: 'Japan Green Bond Framework', renewTarget: 36, climateScore: 72, maturity: '2032', issued: 2022, couponPct: 0.1 },
  { country: 'South Korea', region: 'Asia-Pacific', rating: 'AA-', type: 'Green Sovereign', outstanding: 5.5, yield: 3.52, spread: 58, greenPct: 100, sdg: [7, 9, 13], verifier: 'KCGS', framework: 'Korea Green Bond Framework', renewTarget: 30, climateScore: 70, maturity: '2031', issued: 2022, couponPct: 2.75 },
  { country: 'Australia', region: 'Asia-Pacific', rating: 'AAA', type: 'Green Sovereign', outstanding: 7.2, yield: 4.25, spread: 15, greenPct: 100, sdg: [7, 11, 13, 14], verifier: 'CICERO', framework: 'AOFM Green Bond Framework', renewTarget: 82, climateScore: 75, maturity: '2034', issued: 2023, couponPct: 4.0 },
  { country: 'Indonesia', region: 'Asia-Pacific', rating: 'BBB', type: 'Sustainability Bond', outstanding: 6.8, yield: 6.44, spread: 264, greenPct: 60, sdg: [7, 14, 15, 13], verifier: 'Sustainalytics', framework: 'SDG Bond Framework', renewTarget: 23, climateScore: 58, maturity: '2030', issued: 2018, couponPct: 3.75 },
  { country: 'India', region: 'Asia-Pacific', rating: 'BBB-', type: 'Green Sovereign', outstanding: 4.5, yield: 7.1, spread: 310, greenPct: 100, sdg: [7, 11, 13], verifier: 'CARE', framework: 'Government Green Bond Framework', renewTarget: 50, climateScore: 62, maturity: '2028', issued: 2023, couponPct: 7.1 },
  { country: 'Chile', region: 'Latin America', rating: 'A-', type: 'Sustainability Bond', outstanding: 14.5, yield: 4.72, spread: 132, greenPct: 65, sdg: [7, 9, 13, 14], verifier: 'CICERO', framework: 'Chile Social and Sustainability Bond Framework', renewTarget: 60, climateScore: 76, maturity: '2042', issued: 2019, couponPct: 2.45 },
  { country: 'Mexico', region: 'Latin America', rating: 'BBB-', type: 'SDG Bond', outstanding: 7.6, yield: 6.22, spread: 282, greenPct: 50, sdg: [3, 7, 11, 13], verifier: 'Sustainalytics', framework: 'Mexico SDG Sovereign Bond Framework', renewTarget: 35, climateScore: 60, maturity: '2031', issued: 2020, couponPct: 3.75 },
  { country: 'Brazil', region: 'Latin America', rating: 'BB', type: 'Sustainability Bond', outstanding: 5.0, yield: 6.85, spread: 345, greenPct: 55, sdg: [13, 14, 15], verifier: 'Vigeo Eiris', framework: 'Brazil National Sustainability Bond Framework', renewTarget: 45, climateScore: 55, maturity: '2030', issued: 2023, couponPct: 6.0 },
  { country: 'Egypt', region: 'Africa', rating: 'B-', type: 'Green Sovereign', outstanding: 1.5, yield: 10.4, spread: 700, greenPct: 100, sdg: [7, 9, 13], verifier: 'DNV', framework: 'Egypt Green Sovereign Framework', renewTarget: 42, climateScore: 48, maturity: '2027', issued: 2020, couponPct: 5.25 },
  { country: 'South Africa', region: 'Africa', rating: 'BB-', type: 'Transition Bond', outstanding: 2.5, yield: 9.2, spread: 580, greenPct: 40, sdg: [7, 8, 13], verifier: 'Sustainalytics', framework: 'SA Transition Framework', renewTarget: 35, climateScore: 50, maturity: '2030', issued: 2022, couponPct: 7.0 },
  { country: 'Belize', region: 'Latin America', rating: 'B', type: 'Blue Bond', outstanding: 0.55, yield: 5.0, spread: 200, greenPct: 100, sdg: [14, 15], verifier: 'TNC', framework: 'Blue Bond for Ocean Conservation', renewTarget: 100, climateScore: 72, maturity: '2041', issued: 2021, couponPct: 4.9 },
  { country: 'Ecuador', region: 'Latin America', rating: 'B-', type: 'Blue Bond', outstanding: 0.65, yield: 5.45, spread: 245, greenPct: 100, sdg: [14, 15], verifier: 'TNC', framework: 'Galapagos Debt-for-Nature', renewTarget: 100, climateScore: 70, maturity: '2041', issued: 2023, couponPct: 5.4 },
  { country: 'Canada', region: 'North America', rating: 'AAA', type: 'Green Sovereign', outstanding: 7.0, yield: 3.55, spread: -5, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'CICERO', framework: 'Canada Green Bond Framework', renewTarget: 90, climateScore: 85, maturity: '2029', issued: 2022, couponPct: 2.75 },
  { country: 'Denmark', region: 'Europe', rating: 'AAA', type: 'Climate Bond', outstanding: 6.7, yield: 2.28, spread: -13, greenPct: 100, sdg: [7, 13, 14], verifier: 'CICERO', framework: 'Denmark Green Government Bond Framework', renewTarget: 100, climateScore: 97, maturity: '2031', issued: 2022, couponPct: 0.25 },
  { country: 'Norway', region: 'Europe', rating: 'AAA', type: 'Green Sovereign', outstanding: 5.3, yield: 2.62, spread: 18, greenPct: 100, sdg: [7, 14, 15], verifier: 'CICERO', framework: 'Norway Green Bond Framework', renewTarget: 98, climateScore: 95, maturity: '2032', issued: 2023, couponPct: 2.75 },
  { country: 'Poland', region: 'Europe', rating: 'A-', type: 'Green Sovereign', outstanding: 12.0, yield: 4.44, spread: 104, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'CICERO', framework: 'Poland Green Bond Framework (first sovereign)', renewTarget: 32, climateScore: 64, maturity: '2026', issued: 2016, couponPct: 0.5 },
  { country: 'Portugal', region: 'Europe', rating: 'BBB+', type: 'Green Sovereign', outstanding: 6.5, yield: 2.98, spread: 58, greenPct: 100, sdg: [7, 9, 13, 14], verifier: 'DNV', framework: 'Portugal Green OT Framework', renewTarget: 80, climateScore: 80, maturity: '2037', issued: 2021, couponPct: 0.5 },
  { country: 'Austria', region: 'Europe', rating: 'AA+', type: 'Green Sovereign', outstanding: 4.5, yield: 2.55, spread: 15, greenPct: 100, sdg: [7, 11, 13], verifier: 'ISS ESG', framework: 'Republic of Austria Green Finance Framework', renewTarget: 78, climateScore: 89, maturity: '2049', issued: 2022, couponPct: 0.85 },
  { country: 'Hong Kong', region: 'Asia-Pacific', rating: 'AA+', type: 'Green Sovereign', outstanding: 22.5, yield: 4.55, spread: 65, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'Sustainalytics', framework: 'HK Green Bond Framework', renewTarget: 50, climateScore: 74, maturity: '2030', issued: 2019, couponPct: 2.0 },
  { country: 'Singapore', region: 'Asia-Pacific', rating: 'AAA', type: 'Sustainability Bond', outstanding: 3.5, yield: 3.15, spread: 25, greenPct: 80, sdg: [7, 11, 13, 9], verifier: 'CICERO', framework: 'Singapore SGS (Green) Framework', renewTarget: 30, climateScore: 80, maturity: '2032', issued: 2022, couponPct: 2.875 },
  { country: 'Malaysia', region: 'Asia-Pacific', rating: 'A-', type: 'SDG Bond', outstanding: 1.8, yield: 4.02, spread: 112, greenPct: 55, sdg: [7, 9, 13], verifier: 'RAM', framework: 'Malaysia Sustainability Sukuk Framework', renewTarget: 40, climateScore: 65, maturity: '2030', issued: 2021, couponPct: 3.58 },
  { country: 'US State of CA', region: 'North America', rating: 'AA', type: 'Climate Bond', outstanding: 9.5, yield: 3.38, spread: -2, greenPct: 100, sdg: [7, 11, 13], verifier: 'CBI', framework: 'California Green Bond Framework', renewTarget: 100, climateScore: 90, maturity: '2035', issued: 2022, couponPct: 2.5 },
];

const MARKET_TREND = Array.from({ length: 7 }, (_, i) => ({
  year: `${2019 + i}`,
  'Green Sovereign': Math.round(50 + i * 45 + sr(i * 7) * 20),
  'Sustainability Bond': Math.round(20 + i * 30 + sr(i * 11) * 15),
  'Blue Bond': +(0.5 + i * 0.5 + sr(i * 13) * 0.3).toFixed(1),
  'Transition Bond': Math.round(5 + i * 8 + sr(i * 17) * 4),
  'SDG Bond': Math.round(10 + i * 20 + sr(i * 19) * 10),
}));

const YIELD_CURVE = ['2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'].map((t, i) => ({
  tenor: t,
  'AAA Green': +(1.8 + i * 0.22 + sr(i * 7) * 0.08).toFixed(2),
  'AA Green': +(2.1 + i * 0.25 + sr(i * 11) * 0.09).toFixed(2),
  'A Green': +(2.6 + i * 0.28 + sr(i * 13) * 0.12).toFixed(2),
  'BBB Green': +(3.4 + i * 0.30 + sr(i * 17) * 0.15).toFixed(2),
}));

const SDG_ALLOCATION = [
  { sdg: 'SDG 7: Clean Energy', pct: 38, count: 22 },
  { sdg: 'SDG 13: Climate Action', pct: 28, count: 28 },
  { sdg: 'SDG 11: Sustainable Cities', pct: 12, count: 14 },
  { sdg: 'SDG 9: Industry & Infra', pct: 10, count: 12 },
  { sdg: 'SDG 15: Life on Land', pct: 6, count: 8 },
  { sdg: 'SDG 14: Life Below Water', pct: 4, count: 5 },
  { sdg: 'SDG 3: Good Health', pct: 2, count: 3 },
];

const GREENIUM_DATA = ISSUERS.filter(b => b.rating.startsWith('AA') || b.rating.startsWith('AAA')).slice(0, 12).map((b, i) => ({
  country: b.country,
  greenium: -(Math.round(sr(i * 7) * 8 + 1)),
  yield: b.yield,
}));

const TABS = ['Overview', 'Bond Screener', 'Country Assessment', 'SDG Alignment', 'Yield Analysis', 'Greenium', 'Market Trends'];
const REGIONS = ['All', 'Europe', 'Asia-Pacific', 'Latin America', 'Africa', 'North America'];
const TYPES_F = ['All', ...BOND_TYPES.map(b => b.type)];
const RATINGS = ['All', 'AAA', 'AA', 'A', 'BBB', 'BB & Below'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

export default function ClimateSovereignBondsPage() {
  const [tab, setTab] = useState('Overview');
  const [regionF, setRegionF] = useState('All');
  const [typeF, setTypeF] = useState('All');
  const [ratingF, setRatingF] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const ratingGroup = r => {
    if (r.startsWith('AAA')) return 'AAA';
    if (r.startsWith('AA')) return 'AA';
    if (r.startsWith('A')) return 'A';
    if (r.startsWith('BBB')) return 'BBB';
    return 'BB & Below';
  };

  const filtered = useMemo(() => ISSUERS.filter(b => {
    const byRegion = regionF === 'All' || b.region === regionF;
    const byType = typeF === 'All' || b.type === typeF;
    const byRating = ratingF === 'All' || ratingGroup(b.rating) === ratingF;
    const bySearch = !search || b.country.toLowerCase().includes(search.toLowerCase());
    return byRegion && byType && byRating && bySearch;
  }), [regionF, typeF, ratingF, search]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const total = filtered.reduce((s, b) => s + b.outstanding, 0);
    return {
      total: total.toFixed(1),
      avgYield: (filtered.reduce((s, b) => s + b.yield, 0) / n).toFixed(2),
      avgScore: Math.round(filtered.reduce((s, b) => s + b.climateScore, 0) / n),
      avgSpread: Math.round(filtered.reduce((s, b) => s + b.spread, 0) / n),
      count: filtered.length,
    };
  }, [filtered]);

  const typeAlloc = useMemo(() => {
    const m = {};
    filtered.forEach(b => { m[b.type] = (m[b.type] || 0) + b.outstanding; });
    return Object.entries(m).map(([type, v]) => ({ type, outstanding: +v.toFixed(1) })).sort((a, b) => b.outstanding - a.outstanding);
  }, [filtered]);

  const regionAlloc = useMemo(() => {
    const m = {};
    filtered.forEach(b => { m[b.region] = (m[b.region] || 0) + b.outstanding; });
    return Object.entries(m).map(([region, v]) => ({ region, outstanding: +v.toFixed(1) })).sort((a, b) => b.outstanding - a.outstanding);
  }, [filtered]);

  const typeColor = t => BOND_TYPES.find(b => b.type === t)?.color || T.navy;

  const tabBtn = t => ({
    padding: '7px 16px', border: `1px solid ${tab === t ? T.navy : T.border}`,
    borderRadius: 6, fontSize: 12, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? T.navy : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 180 };
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };

  const ratingColor = r => {
    const g = ratingGroup(r);
    if (g === 'AAA' || g === 'AA') return T.green;
    if (g === 'A') return T.sage;
    if (g === 'BBB') return T.amber;
    return T.red;
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Climate Sovereign Bonds</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>30 sovereign issuers · Green / Sustainability / Blue / Transition · $380Bn+ outstanding</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search country..." style={inpS} />
        <select value={regionF} onChange={e => setRegionF(e.target.value)} style={selS}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={selS}>{TYPES_F.map(t => <option key={t}>{t}</option>)}</select>
        <select value={ratingF} onChange={e => setRatingF(e.target.value)} style={selS}>{RATINGS.map(r => <option key={r}>{r}</option>)}</select>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{kpis.count} bonds</span>
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Total Outstanding" value={`$${kpis.total}Bn`} sub="filtered universe" />
            <KpiCard label="Avg Yield" value={`${kpis.avgYield}%`} color={T.amber} />
            <KpiCard label="Avg Climate Score" value={`${kpis.avgScore}/100`} color={T.sage} />
            <KpiCard label="Avg Spread (bps)" value={kpis.avgSpread} color={kpis.avgSpread < 0 ? T.green : T.amber} sub="vs conventional" />
            <KpiCard label="Sovereign Issuers" value={kpis.count} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Outstanding by Bond Type ($Bn)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeAlloc}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={42} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="outstanding" radius={[4, 4, 0, 0]}>
                    {typeAlloc.map((e, i) => <Cell key={i} fill={typeColor(e.type)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Outstanding by Region ($Bn)</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={regionAlloc} cx="50%" cy="50%" outerRadius={95} dataKey="outstanding" nameKey="region" label={({ region, outstanding }) => `${region}: $${outstanding}Bn`}>
                    {regionAlloc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Bond Type Reference</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {BOND_TYPES.map(b => (
                <div key={b.type} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${b.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.type}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{b.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Bond Screener' && (
        <div style={{ ...cS, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Country', 'Region', 'Type', 'Rating', 'Outstanding($Bn)', 'Yield%', 'Spread(bps)', 'Climate Score', 'Verifier', 'Maturity'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={i} onClick={() => setSelected(selected?.country === b.country ? null : b)}
                  style={{ cursor: 'pointer', background: selected?.country === b.country ? T.surfaceH : 'transparent' }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{b.country}</td>
                  <td style={tdS}>{b.region}</td>
                  <td style={tdS}><span style={{ color: typeColor(b.type), fontSize: 11 }}>{b.type}</span></td>
                  <td style={tdS}><span style={{ color: ratingColor(b.rating), fontWeight: 600 }}>{b.rating}</span></td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{b.outstanding}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{b.yield}%</td>
                  <td style={{ ...tdS, fontFamily: T.mono, color: b.spread < 0 ? T.green : b.spread < 100 ? T.amber : T.red }}>{b.spread}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 5, background: T.border, borderRadius: 3 }}>
                        <div style={{ width: `${b.climateScore}%`, height: '100%', background: b.climateScore > 80 ? T.sage : b.climateScore > 60 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T.textSec }}>{b.climateScore}</span>
                    </div>
                  </td>
                  <td style={{ ...tdS, fontSize: 10 }}>{b.verifier}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{b.maturity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Country Assessment' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Climate Score by Country (Top 20)</div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={[...filtered].sort((a, b) => b.climateScore - a.climateScore).slice(0, 20)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} width={90} />
                  <Tooltip {...tip} />
                  <Bar dataKey="climateScore" radius={[0, 4, 4, 0]}>
                    {[...filtered].sort((a, b) => b.climateScore - a.climateScore).slice(0, 20).map((e, i) => (
                      <Cell key={i} fill={e.climateScore > 85 ? T.sage : e.climateScore > 70 ? T.teal : e.climateScore > 55 ? T.amber : T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Renewable Target vs Climate Score</div>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Renew%" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Renewable Target %', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Score" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                      <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                      <div style={{ color: T.textSec }}>Renew: {payload[0]?.payload?.x}% | Score: {payload[0]?.payload?.y}</div>
                    </div>
                  ) : null} />
                  <Scatter data={filtered.map(b => ({ name: b.country, x: b.renewTarget, y: b.climateScore }))} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          {selected && (
            <div style={{ ...cS, marginTop: 16, borderLeft: `3px solid ${typeColor(selected.type)}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>{selected.country} — {selected.type}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[['Rating', selected.rating], ['Outstanding', `$${selected.outstanding}Bn`], ['Yield', `${selected.yield}%`], ['Spread', `${selected.spread}bps`], ['Climate Score', `${selected.climateScore}/100`], ['Verifier', selected.verifier], ['Renew Target', `${selected.renewTarget}%`], ['Maturity', selected.maturity], ['Coupon', `${selected.couponPct}%`], ['Issued', selected.issued]].map(([k, v], j) => (
                  <div key={j} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.textSec }}><strong style={{ color: T.text }}>Framework:</strong> {selected.framework}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: T.textSec }}><strong style={{ color: T.text }}>SDG Alignment:</strong> SDGs {selected.sdg.join(', ')}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'SDG Alignment' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Proceeds Allocated by SDG (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SDG_ALLOCATION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="sdg" tick={{ fontSize: 9, fill: T.textSec }} width={160} />
                  <Tooltip {...tip} />
                  <Bar dataKey="pct" fill={T.navy} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>SDG Coverage by Bond Count</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={SDG_ALLOCATION} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="sdg">
                    {SDG_ALLOCATION.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend formatter={v => <span style={{ fontSize: 10, color: T.textSec }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ ...cS, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>SDG Alignment by Issuer</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {filtered.slice(0, 12).map((b, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{b.country}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {b.sdg.map(s => (
                      <span key={s} style={{ background: T.navy + '30', color: T.navy, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontFamily: T.mono }}>SDG {s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Yield Analysis' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Green Sovereign Yield Curve by Rating</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={YIELD_CURVE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tenor" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line type="monotone" dataKey="AAA Green" stroke={T.sage} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="AA Green" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="A Green" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="BBB Green" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Yield vs Spread by Country</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Yield %" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Spread bps" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Scatter data={filtered.map(b => ({ name: b.country, x: b.yield, y: b.spread }))} fill={T.gold} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Greenium' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
              The <strong style={{ color: T.text }}>greenium</strong> is the yield premium investors accept for certified sovereign green bonds vs equivalent conventional bonds.
              Empirical range: <strong style={{ color: T.sage }}>−1 to −9 bps</strong> for investment-grade sovereigns (ECB Working Paper 2021; ICMA Green Bond Principles).
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Greenium by Country (bps)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={GREENIUM_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} width={90} />
                  <Tooltip {...tip} />
                  <Bar dataKey="greenium" fill={T.sage} radius={[0, 4, 4, 0]} name="Greenium (bps)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Greenium Drivers</div>
              {[
                { driver: 'Strong ESG/Climate credentials', impact: 'High', detail: 'Sweden, Denmark, Germany: −6 to −9 bps' },
                { driver: 'Large liquid benchmark size', impact: 'High', detail: '>€10Bn outstanding reduces illiquidity premium' },
                { driver: 'CICERO/CBI Dark Green certification', impact: 'Medium', detail: 'Dark Green shade = stronger investor demand' },
                { driver: 'Regulatory tailwinds (Basel VI)', impact: 'Medium', detail: 'Green HQLA treatment proposals by EBA/BIS' },
                { driver: 'EM issuer risk premium', impact: 'Negative', detail: 'EM sovereigns show zero or positive green spread' },
              ].map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{d.driver}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{d.detail}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.impact === 'High' ? T.sage : d.impact === 'Medium' ? T.amber : T.red, fontFamily: T.mono }}>{d.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Market Trends' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Sovereign Green Bond Issuance Trend ($Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MARKET_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Area type="monotone" dataKey="Green Sovereign" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="Sustainability Bond" stackId="1" stroke={T.teal} fill={T.teal} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="Transition Bond" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="SDG Bond" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Blue Bond Issuance 2019–2025 ($Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MARKET_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="Blue Bond" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ ...cS, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Market Milestones</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { year: '2016', event: 'Poland issues first sovereign green bond (€750M)', color: T.navy },
                { year: '2017', event: 'France OAT Verte — first large-scale sovereign (€7Bn)', color: T.sage },
                { year: '2017', event: 'Fiji issues first EM climate bond ($50M)', color: T.teal },
                { year: '2019', event: 'Netherlands AAA sovereign green bond; greenium documented', color: T.gold },
                { year: '2021', event: 'EU NGEU — first supranational green bond (€12Bn)', color: T.amber },
                { year: '2021', event: 'UK inaugural £10Bn gilt-green; Belize Blue Bond ($553M)', color: T.navy },
                { year: '2022', event: 'Australia, Canada sovereign debuts; record $500Bn annual issuance', color: T.sage },
                { year: '2023', event: 'Ecuador Galapagos debt-for-nature swap ($656M blue bond)', color: T.teal },
                { year: '2024', event: 'Green sovereign pipeline >$800Bn (ICMA estimate)', color: T.gold },
              ].map((m, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '8px 12px', borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{m.year}</div>
                  <div style={{ fontSize: 11, color: T.text, marginTop: 3 }}>{m.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
