import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine, ComposedChart, Area
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const COUNTRIES = [
  { iso: 'US', name: 'United States', region: 'North America', ndGain: 67.4, fossilPct: 1.2, rating: 'AAA', spread: 0, itr: 2.8, population: 331, gdp: 25462, co2PerCapita: 14.7 },
  { iso: 'CN', name: 'China', region: 'East Asia', ndGain: 54.8, fossilPct: 1.8, rating: 'A+', spread: 68, itr: 3.2, population: 1412, gdp: 17963, co2PerCapita: 8.0 },
  { iso: 'IN', name: 'India', region: 'South Asia', ndGain: 42.6, fossilPct: 2.1, rating: 'BBB-', spread: 145, itr: 3.5, population: 1408, gdp: 3385, co2PerCapita: 1.9 },
  { iso: 'DE', name: 'Germany', region: 'Europe', ndGain: 70.1, fossilPct: 0.3, rating: 'AAA', spread: 2, itr: 2.1, population: 83, gdp: 4072, co2PerCapita: 8.1 },
  { iso: 'GB', name: 'United Kingdom', region: 'Europe', ndGain: 72.3, fossilPct: 0.8, rating: 'AA', spread: 15, itr: 2.0, population: 67, gdp: 3070, co2PerCapita: 5.2 },
  { iso: 'JP', name: 'Japan', region: 'East Asia', ndGain: 69.5, fossilPct: 0.1, rating: 'A+', spread: 32, itr: 2.4, population: 125, gdp: 4231, co2PerCapita: 8.6 },
  { iso: 'SA', name: 'Saudi Arabia', region: 'Middle East', ndGain: 45.2, fossilPct: 38.5, rating: 'A', spread: 82, itr: 4.1, population: 35, gdp: 1108, co2PerCapita: 16.3 },
  { iso: 'RU', name: 'Russia', region: 'Eurasia', ndGain: 50.3, fossilPct: 18.2, rating: 'BBB-', spread: 450, itr: 3.9, population: 144, gdp: 2240, co2PerCapita: 11.4 },
  { iso: 'NG', name: 'Nigeria', region: 'Sub-Saharan Africa', ndGain: 32.8, fossilPct: 8.5, rating: 'B-', spread: 680, itr: 3.7, population: 218, gdp: 477, co2PerCapita: 0.6 },
  { iso: 'NO', name: 'Norway', region: 'Europe', ndGain: 78.2, fossilPct: 14.2, rating: 'AAA', spread: 0, itr: 1.8, population: 5, gdp: 579, co2PerCapita: 7.5 },
  { iso: 'BR', name: 'Brazil', region: 'Latin America', ndGain: 48.9, fossilPct: 2.6, rating: 'BB-', spread: 235, itr: 2.9, population: 215, gdp: 1920, co2PerCapita: 2.2 },
  { iso: 'AU', name: 'Australia', region: 'Oceania', ndGain: 71.8, fossilPct: 8.8, rating: 'AAA', spread: 5, itr: 2.6, population: 26, gdp: 1675, co2PerCapita: 15.0 },
  { iso: 'ZA', name: 'South Africa', region: 'Sub-Saharan Africa', ndGain: 44.1, fossilPct: 6.2, rating: 'BB-', spread: 310, itr: 3.4, population: 60, gdp: 405, co2PerCapita: 6.7 },
  { iso: 'CA', name: 'Canada', region: 'North America', ndGain: 73.9, fossilPct: 5.4, rating: 'AAA', spread: 3, itr: 2.3, population: 39, gdp: 2139, co2PerCapita: 14.3 },
  { iso: 'AE', name: 'UAE', region: 'Middle East', ndGain: 52.4, fossilPct: 26.1, rating: 'AA', spread: 55, itr: 3.8, population: 9, gdp: 507, co2PerCapita: 20.7 },
  { iso: 'ID', name: 'Indonesia', region: 'Southeast Asia', ndGain: 43.7, fossilPct: 3.8, rating: 'BBB', spread: 120, itr: 3.3, population: 274, gdp: 1319, co2PerCapita: 2.3 },
  { iso: 'MX', name: 'Mexico', region: 'Latin America', ndGain: 48.2, fossilPct: 4.1, rating: 'BBB', spread: 155, itr: 3.1, population: 130, gdp: 1322, co2PerCapita: 3.6 },
  { iso: 'KR', name: 'South Korea', region: 'East Asia', ndGain: 66.8, fossilPct: 0.2, rating: 'AA', spread: 28, itr: 2.5, population: 52, gdp: 1665, co2PerCapita: 11.6 },
  { iso: 'FR', name: 'France', region: 'Europe', ndGain: 71.0, fossilPct: 0.1, rating: 'AA', spread: 8, itr: 1.9, population: 68, gdp: 2783, co2PerCapita: 4.7 },
  { iso: 'IT', name: 'Italy', region: 'Europe', ndGain: 65.2, fossilPct: 0.3, rating: 'BBB', spread: 95, itr: 2.2, population: 59, gdp: 2010, co2PerCapita: 5.3 },
  { iso: 'TR', name: 'Turkey', region: 'Europe', ndGain: 52.7, fossilPct: 0.5, rating: 'B+', spread: 385, itr: 3.1, population: 85, gdp: 906, co2PerCapita: 4.8 },
  { iso: 'PL', name: 'Poland', region: 'Europe', ndGain: 60.4, fossilPct: 1.2, rating: 'A-', spread: 72, itr: 2.7, population: 38, gdp: 688, co2PerCapita: 7.9 },
  { iso: 'EG', name: 'Egypt', region: 'North Africa', ndGain: 36.5, fossilPct: 5.8, rating: 'B', spread: 520, itr: 3.6, population: 104, gdp: 476, co2PerCapita: 2.4 },
  { iso: 'CL', name: 'Chile', region: 'Latin America', ndGain: 60.1, fossilPct: 1.1, rating: 'A', spread: 88, itr: 2.4, population: 19, gdp: 301, co2PerCapita: 4.5 },
  { iso: 'TH', name: 'Thailand', region: 'Southeast Asia', ndGain: 52.0, fossilPct: 0.6, rating: 'BBB+', spread: 98, itr: 3.0, population: 72, gdp: 536, co2PerCapita: 3.8 },
  { iso: 'MY', name: 'Malaysia', region: 'Southeast Asia', ndGain: 55.3, fossilPct: 7.2, rating: 'A-', spread: 75, itr: 3.2, population: 33, gdp: 407, co2PerCapita: 7.6 },
  { iso: 'PH', name: 'Philippines', region: 'Southeast Asia', ndGain: 38.2, fossilPct: 0.2, rating: 'BBB+', spread: 105, itr: 3.1, population: 114, gdp: 404, co2PerCapita: 1.3 },
  { iso: 'CO', name: 'Colombia', region: 'Latin America', ndGain: 46.8, fossilPct: 5.5, rating: 'BB+', spread: 245, itr: 2.8, population: 52, gdp: 343, co2PerCapita: 1.8 },
  { iso: 'PE', name: 'Peru', region: 'Latin America', ndGain: 44.5, fossilPct: 1.8, rating: 'BBB', spread: 135, itr: 2.9, population: 34, gdp: 242, co2PerCapita: 1.5 },
  { iso: 'BD', name: 'Bangladesh', region: 'South Asia', ndGain: 31.4, fossilPct: 0.3, rating: 'BB-', spread: 380, itr: 3.4, population: 170, gdp: 460, co2PerCapita: 0.6 },
  { iso: 'VN', name: 'Vietnam', region: 'Southeast Asia', ndGain: 45.9, fossilPct: 1.1, rating: 'BB', spread: 190, itr: 3.2, population: 99, gdp: 408, co2PerCapita: 3.5 },
  { iso: 'PK', name: 'Pakistan', region: 'South Asia', ndGain: 30.2, fossilPct: 0.4, rating: 'CCC+', spread: 850, itr: 3.6, population: 230, gdp: 376, co2PerCapita: 0.9 },
  { iso: 'KE', name: 'Kenya', region: 'Sub-Saharan Africa', ndGain: 36.0, fossilPct: 0.0, rating: 'B', spread: 590, itr: 3.3, population: 54, gdp: 113, co2PerCapita: 0.4 },
  { iso: 'GH', name: 'Ghana', region: 'Sub-Saharan Africa', ndGain: 37.5, fossilPct: 4.8, rating: 'CCC+', spread: 720, itr: 3.5, population: 33, gdp: 72, co2PerCapita: 0.7 },
  { iso: 'IQ', name: 'Iraq', region: 'Middle East', ndGain: 33.1, fossilPct: 42.5, rating: 'B-', spread: 580, itr: 4.2, population: 42, gdp: 264, co2PerCapita: 4.1 },
  { iso: 'KW', name: 'Kuwait', region: 'Middle East', ndGain: 47.8, fossilPct: 52.3, rating: 'A+', spread: 48, itr: 4.0, population: 4, gdp: 184, co2PerCapita: 21.6 },
  { iso: 'QA', name: 'Qatar', region: 'Middle East', ndGain: 49.0, fossilPct: 45.8, rating: 'AA', spread: 42, itr: 4.3, population: 3, gdp: 236, co2PerCapita: 32.8 },
  { iso: 'AZ', name: 'Azerbaijan', region: 'Eurasia', ndGain: 44.0, fossilPct: 35.2, rating: 'BB+', spread: 280, itr: 3.9, population: 10, gdp: 78, co2PerCapita: 3.3 },
  { iso: 'DZ', name: 'Algeria', region: 'North Africa', ndGain: 40.8, fossilPct: 19.5, rating: 'B+', spread: 420, itr: 3.7, population: 45, gdp: 187, co2PerCapita: 3.7 },
  { iso: 'KZ', name: 'Kazakhstan', region: 'Central Asia', ndGain: 49.5, fossilPct: 20.8, rating: 'BBB-', spread: 175, itr: 3.6, population: 19, gdp: 220, co2PerCapita: 12.8 },
  { iso: 'LY', name: 'Libya', region: 'North Africa', ndGain: 34.2, fossilPct: 55.0, rating: 'NR', spread: 900, itr: 4.5, population: 7, gdp: 42, co2PerCapita: 8.1 },
  { iso: 'AO', name: 'Angola', region: 'Sub-Saharan Africa', ndGain: 29.8, fossilPct: 30.2, rating: 'B-', spread: 700, itr: 3.8, population: 35, gdp: 107, co2PerCapita: 1.1 },
  { iso: 'SE', name: 'Sweden', region: 'Europe', ndGain: 77.5, fossilPct: 0.1, rating: 'AAA', spread: 1, itr: 1.7, population: 10, gdp: 585, co2PerCapita: 3.4 },
  { iso: 'DK', name: 'Denmark', region: 'Europe', ndGain: 76.8, fossilPct: 1.5, rating: 'AAA', spread: 0, itr: 1.8, population: 6, gdp: 395, co2PerCapita: 4.4 },
  { iso: 'NZ', name: 'New Zealand', region: 'Oceania', ndGain: 74.1, fossilPct: 0.5, rating: 'AAA', spread: 4, itr: 2.0, population: 5, gdp: 247, co2PerCapita: 6.2 },
  { iso: 'SG', name: 'Singapore', region: 'Southeast Asia', ndGain: 68.5, fossilPct: 0.0, rating: 'AAA', spread: 0, itr: 2.3, population: 6, gdp: 466, co2PerCapita: 8.0 },
  { iso: 'IL', name: 'Israel', region: 'Middle East', ndGain: 64.2, fossilPct: 0.3, rating: 'A+', spread: 65, itr: 2.5, population: 9, gdp: 522, co2PerCapita: 6.9 },
  { iso: 'AR', name: 'Argentina', region: 'Latin America', ndGain: 50.5, fossilPct: 4.8, rating: 'CCC', spread: 1200, itr: 3.0, population: 46, gdp: 632, co2PerCapita: 3.9 },
  { iso: 'EC', name: 'Ecuador', region: 'Latin America', ndGain: 42.3, fossilPct: 8.2, rating: 'B-', spread: 650, itr: 3.2, population: 18, gdp: 115, co2PerCapita: 2.3 },
  { iso: 'TT', name: 'Trinidad & Tobago', region: 'Caribbean', ndGain: 51.0, fossilPct: 32.5, rating: 'BBB-', spread: 195, itr: 3.8, population: 1, gdp: 27, co2PerCapita: 22.4 },
];

const NGFS_SCENARIOS = ['Current Policies', 'Delayed Transition', 'Below 2C', 'Net Zero 2050'];
const SCENARIO_COLORS = { 'Current Policies': T.red, 'Delayed Transition': T.orange, 'Below 2C': T.amber, 'Net Zero 2050': T.green };

function computeStrandedRevenue(fossilPct, gdp, scenario) {
  const factors = { 'Current Policies': 0.05, 'Delayed Transition': 0.18, 'Below 2C': 0.35, 'Net Zero 2050': 0.55 };
  return (fossilPct / 100) * gdp * factors[scenario];
}

function computeClimateSpread(base, ndGain, fossilPct, scenario) {
  const scenarioMult = { 'Current Policies': 1.0, 'Delayed Transition': 1.3, 'Below 2C': 1.6, 'Net Zero 2050': 2.0 };
  const vulnAdj = Math.max(0, (60 - ndGain) * 3.5);
  const fossilAdj = fossilPct * 4.2;
  return Math.round(base + (vulnAdj + fossilAdj) * scenarioMult[scenario]);
}

const TABS = ['Sovereign Risk Map', 'Climate Vulnerability Index', 'Fossil Export Dependency', 'Sovereign Stranded Revenue', 'Credit Spread Sensitivity', 'ITR for Sovereigns'];

const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const kpi = (label, value, sub, color = T.navy) => (
  <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 145, flex: 1 }}>
    <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SovereignClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [region, setRegion] = useState('All');
  const [scenario, setScenario] = useState('Net Zero 2050');
  const [sortBy, setSortBy] = useState('ndGain');
  const [basket, setBasket] = useState(['US', 'CN', 'SA', 'NO', 'NG']);
  const [watchlist, setWatchlist] = useState(['SA', 'RU', 'NG', 'IQ']);
  const [searchTerm, setSearchTerm] = useState('');

  const regions = ['All', ...new Set(COUNTRIES.map(c => c.region))];

  const filtered = useMemo(() => {
    let list = COUNTRIES;
    if (region !== 'All') list = list.filter(c => c.region === region);
    if (searchTerm) list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return [...list].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [region, sortBy, searchTerm]);

  const fossilExporters = COUNTRIES.filter(c => c.fossilPct > 5).sort((a, b) => b.fossilPct - a.fossilPct);

  const strandedData = useMemo(() =>
    fossilExporters.slice(0, 15).map(c => ({
      name: c.iso,
      ...Object.fromEntries(NGFS_SCENARIOS.map(s => [s, +(computeStrandedRevenue(c.fossilPct, c.gdp, s)).toFixed(1)]))
    })), []);

  const spreadData = useMemo(() =>
    filtered.slice(0, 20).map(c => ({
      name: c.iso,
      base: c.spread,
      climateAdj: computeClimateSpread(c.spread, c.ndGain, c.fossilPct, scenario),
    })), [filtered, scenario]);

  const itrData = useMemo(() =>
    filtered.map(c => ({ name: c.iso, itr: c.itr, target: 1.5, gap: +(c.itr - 1.5).toFixed(1), ndGain: c.ndGain })),
    [filtered]);

  const basketCountries = COUNTRIES.filter(c => basket.includes(c.iso));

  const vulnRadar = useMemo(() => {
    const dims = ['Readiness', 'Exposure', 'Sensitivity', 'Adaptive Cap.', 'Fiscal Space'];
    return dims.map(d => {
      const row = { dimension: d };
      basketCountries.forEach(c => {
        row[c.iso] = d === 'Readiness' ? c.ndGain : d === 'Exposure' ? 100 - c.ndGain + c.fossilPct * 0.5 :
          d === 'Sensitivity' ? 100 - c.ndGain * 0.8 : d === 'Adaptive Cap.' ? c.ndGain * 1.1 :
          Math.min(100, 100 - c.spread * 0.05);
      });
      return row;
    });
  }, [basketCountries]);

  const ratingColor = r => r?.startsWith('AAA') ? T.green : r?.startsWith('AA') ? T.teal : r?.startsWith('A') ? T.blue :
    r?.startsWith('BBB') ? T.amber : r?.startsWith('BB') ? T.orange : T.red;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CI1 . SOVEREIGN CLIMATE RISK</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Sovereign Climate Risk Scoring</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              50 Countries . ND-GAIN Vulnerability . Fossil Export Dependency . Stranded Revenue . Climate-Adjusted Spreads . Sovereign ITR
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={region} onChange={e => setRegion(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
              {regions.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
              {NGFS_SCENARIOS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
              background: tab === i ? T.bg : 'transparent', color: tab === i ? T.navy : '#94a3b8',
              border: 'none', borderRadius: '8px 8px 0 0', fontFamily: T.font, borderBottom: tab === i ? `2px solid ${T.gold}` : 'none'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {kpi('Countries Covered', '50', '6 continents')}
          {kpi('Avg ND-GAIN', (COUNTRIES.reduce((s, c) => s + c.ndGain, 0) / COUNTRIES.length).toFixed(1), 'vulnerability index')}
          {kpi('Fossil Exporters', COUNTRIES.filter(c => c.fossilPct > 5).length, '>5% GDP from fossil', T.red)}
          {kpi('Avg Sovereign ITR', (COUNTRIES.reduce((s, c) => s + c.itr, 0) / COUNTRIES.length).toFixed(1) + 'C', 'implied temp rise', T.amber)}
          {kpi('Watchlist', watchlist.length, 'countries flagged', T.orange)}
        </div>

        {/* Tab 0: Sovereign Risk Map */}
        {tab === 0 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sovereign Climate Risk Scatter - ND-GAIN vs Fossil Dependency</h3>
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="ndGain" name="ND-GAIN" domain={[25, 82]} label={{ value: 'ND-GAIN Score', position: 'bottom', fontSize: 11 }} tick={{ fontSize: 10 }} />
                  <YAxis type="number" dataKey="fossilPct" name="Fossil %" label={{ value: 'Fossil Export % GDP', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 10 }} />
                  <Tooltip content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.name} ({d.iso})</div>
                      <div>ND-GAIN: {d.ndGain} | Fossil: {d.fossilPct}% GDP</div>
                      <div>Rating: {d.rating} | ITR: {d.itr}C</div>
                      <div>Spread: {d.spread} bps</div>
                    </div>);
                  }} />
                  <ReferenceLine y={5} stroke={T.red} strokeDasharray="3 3" label={{ value: 'High fossil threshold', fontSize: 10 }} />
                  <ReferenceLine x={50} stroke={T.amber} strokeDasharray="3 3" label={{ value: 'Vulnerability threshold', fontSize: 10 }} />
                  <Scatter data={filtered} fill={T.navy}>
                    {filtered.map((c, i) => (
                      <Cell key={i} fill={c.fossilPct > 15 ? T.red : c.ndGain < 40 ? T.orange : c.ndGain > 65 ? T.green : T.blue} r={Math.max(5, Math.min(14, c.gdp / 2000))} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Country Risk Table</h3>
              <input placeholder="Search countries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 240, marginBottom: 12 }} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Country', 'Region', 'ND-GAIN', 'Fossil %', 'Rating', 'Spread', 'ITR', 'Watchlist'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec, cursor: 'pointer' }}
                          onClick={() => h === 'ND-GAIN' ? setSortBy('ndGain') : h === 'Fossil %' ? setSortBy('fossilPct') : h === 'Spread' ? setSortBy('spread') : h === 'ITR' ? setSortBy('itr') : null}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 30).map(c => (
                      <tr key={c.iso} style={{ borderBottom: `1px solid ${T.border}`, background: watchlist.includes(c.iso) ? '#fef3c7' : 'transparent' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '8px 6px', color: T.textSec }}>{c.region}</td>
                        <td style={{ padding: '8px 6px' }}><span style={{ color: c.ndGain > 60 ? T.green : c.ndGain > 45 ? T.amber : T.red, fontWeight: 600 }}>{c.ndGain}</span></td>
                        <td style={{ padding: '8px 6px' }}><span style={{ color: c.fossilPct > 15 ? T.red : c.fossilPct > 5 ? T.orange : T.green, fontWeight: 600 }}>{c.fossilPct}%</span></td>
                        <td style={{ padding: '8px 6px' }}><span style={{ background: `${ratingColor(c.rating)}18`, color: ratingColor(c.rating), padding: '2px 6px', borderRadius: 4, fontFamily: T.mono, fontSize: 11 }}>{c.rating}</span></td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{c.spread} bps</td>
                        <td style={{ padding: '8px 6px' }}><span style={{ color: c.itr > 3 ? T.red : c.itr > 2.5 ? T.amber : T.green, fontWeight: 600 }}>{c.itr}C</span></td>
                        <td style={{ padding: '8px 6px' }}>
                          <button onClick={() => setWatchlist(w => w.includes(c.iso) ? w.filter(x => x !== c.iso) : [...w, c.iso])}
                            style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${watchlist.includes(c.iso) ? T.orange : T.border}`, background: watchlist.includes(c.iso) ? '#fef3c7' : T.surface, cursor: 'pointer', fontSize: 10 }}>
                            {watchlist.includes(c.iso) ? 'Remove' : 'Add'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Climate Vulnerability Index */}
        {tab === 1 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ND-GAIN Climate Vulnerability Index - Top & Bottom 20</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={[...COUNTRIES].sort((a, b) => b.ndGain - a.ndGain).slice(0, 20)} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 85]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="iso" tick={{ fontSize: 10 }} width={40} />
                  <Tooltip formatter={v => v.toFixed(1)} />
                  <Bar dataKey="ndGain" name="ND-GAIN Score" radius={[0, 4, 4, 0]}>
                    {[...COUNTRIES].sort((a, b) => b.ndGain - a.ndGain).slice(0, 20).map((c, i) => (
                      <Cell key={i} fill={c.ndGain > 70 ? T.green : c.ndGain > 55 ? T.blue : c.ndGain > 42 ? T.amber : T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Country Basket Comparison (Radar)</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {COUNTRIES.slice(0, 20).map(c => (
                  <button key={c.iso} onClick={() => setBasket(b => b.includes(c.iso) ? b.filter(x => x !== c.iso) : b.length < 6 ? [...b, c.iso] : b)}
                    style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${basket.includes(c.iso) ? T.navy : T.border}`, background: basket.includes(c.iso) ? '#e0e7ff' : T.surface, cursor: 'pointer', fontSize: 10, fontFamily: T.mono }}>{c.iso}</button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={vulnRadar}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  {basketCountries.map((c, i) => (
                    <Radar key={c.iso} name={c.iso} dataKey={c.iso} stroke={[T.navy, T.red, T.green, T.amber, T.purple, T.teal][i]} fill={[T.navy, T.red, T.green, T.amber, T.purple, T.teal][i]} fillOpacity={0.15} />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Fossil Export Dependency */}
        {tab === 2 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Fossil Fuel Export as % of GDP - Top Exporters</h3>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={fossilExporters.slice(0, 18)} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="iso" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: '% GDP', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.name}</div>
                      <div>Fossil Export: {d.fossilPct}% of GDP</div>
                      <div>GDP: ${d.gdp}B | Rating: {d.rating}</div>
                    </div>);
                  }} />
                  <Bar dataKey="fossilPct" name="Fossil Export % GDP" radius={[4, 4, 0, 0]}>
                    {fossilExporters.slice(0, 18).map((c, i) => (
                      <Cell key={i} fill={c.fossilPct > 30 ? T.red : c.fossilPct > 15 ? T.orange : T.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Concentration Risk</h3>
              <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Countries with {'>'}30% GDP from fossil exports face extreme transition risk under orderly scenarios</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {fossilExporters.filter(c => c.fossilPct > 15).map(c => (
                  <div key={c.iso} style={{ ...card, background: '#fef2f2', padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 18, color: T.red, fontWeight: 700 }}>{c.fossilPct}%</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>GDP: ${c.gdp}B | Rating: {c.rating}</div>
                    <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>Revenue at risk (NZ2050): ${computeStrandedRevenue(c.fossilPct, c.gdp, 'Net Zero 2050').toFixed(0)}B</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Sovereign Stranded Revenue */}
        {tab === 3 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sovereign Stranded Revenue by NGFS Scenario ($B)</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={strandedData} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: '$B Lost Revenue', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v.toFixed(1)}B`} />
                  <Legend />
                  {NGFS_SCENARIOS.map(s => (
                    <Bar key={s} dataKey={s} fill={SCENARIO_COLORS[s]} name={s} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Scenario: {scenario}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Country', 'Fossil %', 'GDP ($B)', 'Revenue at Risk', '% of GDP at Risk'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {fossilExporters.map(c => {
                    const stranded = computeStrandedRevenue(c.fossilPct, c.gdp, scenario);
                    return (
                      <tr key={c.iso} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{c.fossilPct}%</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>${c.gdp}B</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono, color: T.red, fontWeight: 600 }}>${stranded.toFixed(1)}B</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{(stranded / c.gdp * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Credit Spread Sensitivity */}
        {tab === 4 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate-Adjusted Sovereign Spreads (bps) - {scenario}</h3>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={spreadData} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="base" fill={T.blue} name="Base Spread" opacity={0.5} />
                  <Bar dataKey="climateAdj" fill={T.red} name="Climate-Adjusted" opacity={0.7} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Spread Sensitivity Across Scenarios</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px', color: T.textSec }}>Country</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px', color: T.textSec }}>Base</th>
                    {NGFS_SCENARIOS.map(s => <th key={s} style={{ textAlign: 'left', padding: '8px 6px', color: SCENARIO_COLORS[s], fontWeight: 600 }}>{s}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 25).map(c => (
                      <tr key={c.iso} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '8px 6px', fontFamily: T.mono }}>{c.spread}</td>
                        {NGFS_SCENARIOS.map(s => {
                          const adj = computeClimateSpread(c.spread, c.ndGain, c.fossilPct, s);
                          return <td key={s} style={{ padding: '8px 6px', fontFamily: T.mono, color: adj > c.spread * 2 ? T.red : T.navy }}>{adj}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: ITR for Sovereigns */}
        {tab === 5 && (
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Implied Temperature Rise from NDC Commitments</h3>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={itrData.slice(0, 30)} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} label={{ value: 'C', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}C`} />
                  <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="5 5" label={{ value: '1.5C Target', fontSize: 10, fill: T.green }} />
                  <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="5 5" label={{ value: '2C Limit', fontSize: 10, fill: T.amber }} />
                  <Bar dataKey="itr" name="Sovereign ITR" radius={[4, 4, 0, 0]}>
                    {itrData.slice(0, 30).map((c, i) => (
                      <Cell key={i} fill={c.itr > 3.5 ? T.red : c.itr > 2.5 ? T.orange : c.itr > 2.0 ? T.amber : T.green} />
                    ))}
                  </Bar>
                  <Line dataKey="target" stroke={T.green} dot={false} name="1.5C Target" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>ITR Gap Analysis & Watchlist</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                {itrData.filter(c => c.itr > 3).sort((a, b) => b.itr - a.itr).map(c => (
                  <div key={c.name} style={{ ...card, padding: 12, background: '#fef2f2' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 20, color: T.red, fontWeight: 700 }}>{c.itr}C</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Gap: +{c.gap}C above 1.5C target</div>
                    <div style={{ width: '100%', height: 4, background: T.border, borderRadius: 2, marginTop: 6 }}>
                      <div style={{ width: `${Math.min(100, (c.itr / 4.5) * 100)}%`, height: 4, background: T.red, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reference & Engagement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Reference Data</h4>
            {[
              'ND-GAIN Country Index (Notre Dame)', 'World Bank Climate Change Portal', 'IMF Fiscal Monitor & Art. IV Data',
              'NDC Registry (UNFCCC)', "Moody's / S&P Sovereign Credit Ratings", 'IEA World Energy Outlook', 'NGFS Climate Scenarios v4'
            ].map(r => <div key={r} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>{r}</div>)}
          </div>
          <div style={card}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Engagement Tools</h4>
            {[
              'Country comparison tool (basket of up to 6)',
              'Custom country basket builder with radar',
              'Sovereign climate watchlist with alerts',
              'Credit spread sensitivity calculator',
              'Rating change alert system',
              'ITR gap tracker vs NDC commitments'
            ].map(e => <div key={e} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: T.gold, display: 'inline-block' }} />{e}
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
