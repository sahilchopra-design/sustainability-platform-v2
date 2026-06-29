import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

const BOND_TYPES = [
  { type: 'Green Sovereign', color: T.sage, description: 'Proceeds finance green expenditure (renewables, transport, buildings)' },
  { type: 'Sustainability Bond', color: T.teal, description: 'Dual-use: green + social projects; SBG aligned' },
  { type: 'Climate Bond', color: T.navy, description: 'CBI-certified; strict climate criteria applied to use of proceeds' },
  { type: 'Blue Bond', color: '#06b6d4', description: 'Ocean economy, fisheries, marine conservation; TNC structure' },
  { type: 'Transition Bond', color: T.amber, description: 'Transition sectors: shipping, steel, cement, emerging economies' },
  { type: 'SDG Bond', color: T.gold, description: 'SDG-linked: KPIs tied to coupon step-up/down structure' },
  { type: 'Debt-for-Nature', color: T.green, description: 'Sovereign debt restructured; proceeds to nature conservation' },
];

const ISSUERS = [
  { country: 'Germany', region: 'Europe', rating: 'AAA', type: 'Green Sovereign', outstanding: 62.5, yield: 2.41, spread: -4, greenPct: 100, sdg: [7, 11, 13, 15], verifier: 'CICERO', framework: 'German Green Bond Framework', renewTarget: 80, climateScore: 94, maturity: '2033', issued: 2020, couponPct: 0, liquidity: 'Very High', creditOutlook: 'Stable', debtGdp: 66.1 },
  { country: 'France', region: 'Europe', rating: 'AA', type: 'Green Sovereign', outstanding: 55.1, yield: 2.88, spread: 48, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'Vigeo Eiris', framework: 'OAT Verte Framework', renewTarget: 40, climateScore: 88, maturity: '2044', issued: 2017, couponPct: 1.75, liquidity: 'Very High', creditOutlook: 'Stable', debtGdp: 111.8 },
  { country: 'Netherlands', region: 'Europe', rating: 'AAA', type: 'Green Sovereign', outstanding: 21.3, yield: 2.52, spread: 8, greenPct: 100, sdg: [7, 11, 13, 14], verifier: 'CICERO', framework: 'Dutch State Green Bond Framework', renewTarget: 70, climateScore: 92, maturity: '2040', issued: 2019, couponPct: 0.5, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 51.7 },
  { country: 'Sweden', region: 'Europe', rating: 'AAA', type: 'Climate Bond', outstanding: 8.4, yield: 2.18, spread: -9, greenPct: 100, sdg: [7, 13, 15], verifier: 'CICERO', framework: 'Swedish Green Bond Framework', renewTarget: 90, climateScore: 96, maturity: '2030', issued: 2020, couponPct: 0, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 31.5 },
  { country: 'UK', region: 'Europe', rating: 'AA', type: 'Green Sovereign', outstanding: 31.5, yield: 4.12, spread: 3, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'Sustainalytics', framework: 'UK Green Financing Framework', renewTarget: 95, climateScore: 86, maturity: '2033', issued: 2021, couponPct: 0.875, liquidity: 'Very High', creditOutlook: 'Stable', debtGdp: 103.8 },
  { country: 'Italy', region: 'Europe', rating: 'BBB+', type: 'Green Sovereign', outstanding: 27.0, yield: 3.82, spread: 142, greenPct: 100, sdg: [7, 9, 13, 15], verifier: 'DNV', framework: 'Italian Green Bond Framework', renewTarget: 65, climateScore: 78, maturity: '2035', issued: 2021, couponPct: 1.5, liquidity: 'High', creditOutlook: 'Negative', debtGdp: 144.7 },
  { country: 'Spain', region: 'Europe', rating: 'A', type: 'Sustainability Bond', outstanding: 16.2, yield: 3.44, spread: 104, greenPct: 70, sdg: [7, 9, 11, 13], verifier: 'ISS ESG', framework: 'Kingdom of Spain Sovereign Green Bond Framework', renewTarget: 74, climateScore: 82, maturity: '2034', issued: 2021, couponPct: 0.5, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 113.2 },
  { country: 'Belgium', region: 'Europe', rating: 'AA-', type: 'Sustainability Bond', outstanding: 9.8, yield: 2.91, spread: 51, greenPct: 65, sdg: [3, 7, 13, 15], verifier: 'Vigeo Eiris', framework: 'Belgian OLO Green/Social Framework', renewTarget: 55, climateScore: 83, maturity: '2033', issued: 2018, couponPct: 1.25, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 107.4 },
  { country: 'Japan', region: 'Asia-Pacific', rating: 'A+', type: 'Climate Bond', outstanding: 11.2, yield: 1.08, spread: 6, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'JCR', framework: 'Japan Green Bond Framework', renewTarget: 36, climateScore: 72, maturity: '2032', issued: 2022, couponPct: 0.1, liquidity: 'Very High', creditOutlook: 'Stable', debtGdp: 261.3 },
  { country: 'South Korea', region: 'Asia-Pacific', rating: 'AA-', type: 'Green Sovereign', outstanding: 5.5, yield: 3.52, spread: 58, greenPct: 100, sdg: [7, 9, 13], verifier: 'KCGS', framework: 'Korea Green Bond Framework', renewTarget: 30, climateScore: 70, maturity: '2031', issued: 2022, couponPct: 2.75, liquidity: 'Medium', creditOutlook: 'Stable', debtGdp: 53.8 },
  { country: 'Australia', region: 'Asia-Pacific', rating: 'AAA', type: 'Green Sovereign', outstanding: 7.2, yield: 4.25, spread: 15, greenPct: 100, sdg: [7, 11, 13, 14], verifier: 'CICERO', framework: 'AOFM Green Bond Framework', renewTarget: 82, climateScore: 75, maturity: '2034', issued: 2023, couponPct: 4.0, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 49.6 },
  { country: 'Indonesia', region: 'Asia-Pacific', rating: 'BBB', type: 'Sustainability Bond', outstanding: 6.8, yield: 6.44, spread: 264, greenPct: 60, sdg: [7, 14, 15, 13], verifier: 'Sustainalytics', framework: 'SDG Bond Framework', renewTarget: 23, climateScore: 58, maturity: '2030', issued: 2018, couponPct: 3.75, liquidity: 'Medium', creditOutlook: 'Stable', debtGdp: 40.2 },
  { country: 'India', region: 'Asia-Pacific', rating: 'BBB-', type: 'Green Sovereign', outstanding: 4.5, yield: 7.1, spread: 310, greenPct: 100, sdg: [7, 11, 13], verifier: 'CARE', framework: 'Government Green Bond Framework', renewTarget: 50, climateScore: 62, maturity: '2028', issued: 2023, couponPct: 7.1, liquidity: 'Medium', creditOutlook: 'Positive', debtGdp: 84.1 },
  { country: 'Chile', region: 'Latin America', rating: 'A-', type: 'Sustainability Bond', outstanding: 14.5, yield: 4.72, spread: 132, greenPct: 65, sdg: [7, 9, 13, 14], verifier: 'CICERO', framework: 'Chile Social and Sustainability Bond Framework', renewTarget: 60, climateScore: 76, maturity: '2042', issued: 2019, couponPct: 2.45, liquidity: 'Medium', creditOutlook: 'Stable', debtGdp: 37.6 },
  { country: 'Mexico', region: 'Latin America', rating: 'BBB-', type: 'SDG Bond', outstanding: 7.6, yield: 6.22, spread: 282, greenPct: 50, sdg: [3, 7, 11, 13], verifier: 'Sustainalytics', framework: 'Mexico SDG Sovereign Bond Framework', renewTarget: 35, climateScore: 60, maturity: '2031', issued: 2020, couponPct: 3.75, liquidity: 'Medium', creditOutlook: 'Stable', debtGdp: 52.3 },
  { country: 'Brazil', region: 'Latin America', rating: 'BB', type: 'Sustainability Bond', outstanding: 5.0, yield: 6.85, spread: 345, greenPct: 55, sdg: [13, 14, 15], verifier: 'Vigeo Eiris', framework: 'Brazil National Sustainability Bond Framework', renewTarget: 45, climateScore: 55, maturity: '2030', issued: 2023, couponPct: 6.0, liquidity: 'Low', creditOutlook: 'Stable', debtGdp: 88.6 },
  { country: 'Egypt', region: 'Africa', rating: 'B-', type: 'Green Sovereign', outstanding: 1.5, yield: 10.4, spread: 700, greenPct: 100, sdg: [7, 9, 13], verifier: 'DNV', framework: 'Egypt Green Sovereign Framework', renewTarget: 42, climateScore: 48, maturity: '2027', issued: 2020, couponPct: 5.25, liquidity: 'Low', creditOutlook: 'Negative', debtGdp: 95.8 },
  { country: 'South Africa', region: 'Africa', rating: 'BB-', type: 'Transition Bond', outstanding: 2.5, yield: 9.2, spread: 580, greenPct: 40, sdg: [7, 8, 13], verifier: 'Sustainalytics', framework: 'SA Transition Framework (JET)', renewTarget: 35, climateScore: 50, maturity: '2030', issued: 2022, couponPct: 7.0, liquidity: 'Low', creditOutlook: 'Stable', debtGdp: 72.2 },
  { country: 'Belize', region: 'Latin America', rating: 'B', type: 'Debt-for-Nature', outstanding: 0.55, yield: 5.0, spread: 200, greenPct: 100, sdg: [14, 15], verifier: 'TNC', framework: 'Blue Bond for Ocean Conservation', renewTarget: 100, climateScore: 72, maturity: '2041', issued: 2021, couponPct: 4.9, liquidity: 'Very Low', creditOutlook: 'Stable', debtGdp: 55.4 },
  { country: 'Ecuador', region: 'Latin America', rating: 'B-', type: 'Debt-for-Nature', outstanding: 0.65, yield: 5.45, spread: 245, greenPct: 100, sdg: [14, 15], verifier: 'TNC', framework: 'Galapagos Debt-for-Nature', renewTarget: 100, climateScore: 70, maturity: '2041', issued: 2023, couponPct: 5.4, liquidity: 'Very Low', creditOutlook: 'Stable', debtGdp: 63.5 },
  { country: 'Canada', region: 'North America', rating: 'AAA', type: 'Green Sovereign', outstanding: 7.0, yield: 3.55, spread: -5, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'CICERO', framework: 'Canada Green Bond Framework', renewTarget: 90, climateScore: 85, maturity: '2029', issued: 2022, couponPct: 2.75, liquidity: 'Very High', creditOutlook: 'Stable', debtGdp: 106.4 },
  { country: 'Denmark', region: 'Europe', rating: 'AAA', type: 'Climate Bond', outstanding: 6.7, yield: 2.28, spread: -13, greenPct: 100, sdg: [7, 13, 14], verifier: 'CICERO', framework: 'Denmark Green Government Bond Framework', renewTarget: 100, climateScore: 97, maturity: '2031', issued: 2022, couponPct: 0.25, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 28.3 },
  { country: 'Norway', region: 'Europe', rating: 'AAA', type: 'Green Sovereign', outstanding: 5.3, yield: 2.62, spread: 18, greenPct: 100, sdg: [7, 14, 15], verifier: 'CICERO', framework: 'Norway Green Bond Framework', renewTarget: 98, climateScore: 95, maturity: '2032', issued: 2023, couponPct: 2.75, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 43.7 },
  { country: 'Poland', region: 'Europe', rating: 'A-', type: 'Green Sovereign', outstanding: 12.0, yield: 4.44, spread: 104, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'CICERO', framework: 'Poland Green Bond Framework (first sovereign)', renewTarget: 32, climateScore: 64, maturity: '2026', issued: 2016, couponPct: 0.5, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 54.1 },
  { country: 'Portugal', region: 'Europe', rating: 'BBB+', type: 'Green Sovereign', outstanding: 6.5, yield: 2.98, spread: 58, greenPct: 100, sdg: [7, 9, 13, 14], verifier: 'DNV', framework: 'Portugal Green OT Framework', renewTarget: 80, climateScore: 80, maturity: '2037', issued: 2021, couponPct: 0.5, liquidity: 'Medium', creditOutlook: 'Positive', debtGdp: 113.9 },
  { country: 'Austria', region: 'Europe', rating: 'AA+', type: 'Green Sovereign', outstanding: 4.5, yield: 2.55, spread: 15, greenPct: 100, sdg: [7, 11, 13], verifier: 'ISS ESG', framework: 'Republic of Austria Green Finance Framework', renewTarget: 78, climateScore: 89, maturity: '2049', issued: 2022, couponPct: 0.85, liquidity: 'Medium', creditOutlook: 'Stable', debtGdp: 77.8 },
  { country: 'Hong Kong', region: 'Asia-Pacific', rating: 'AA+', type: 'Green Sovereign', outstanding: 22.5, yield: 4.55, spread: 65, greenPct: 100, sdg: [7, 9, 11, 13], verifier: 'Sustainalytics', framework: 'HK Green Bond Framework', renewTarget: 50, climateScore: 74, maturity: '2030', issued: 2019, couponPct: 2.0, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 6.7 },
  { country: 'Singapore', region: 'Asia-Pacific', rating: 'AAA', type: 'Sustainability Bond', outstanding: 3.5, yield: 3.15, spread: 25, greenPct: 80, sdg: [7, 11, 13, 9], verifier: 'CICERO', framework: 'Singapore SGS (Green) Framework', renewTarget: 30, climateScore: 80, maturity: '2032', issued: 2022, couponPct: 2.875, liquidity: 'Medium', creditOutlook: 'Stable', debtGdp: 134.2 },
  { country: 'Malaysia', region: 'Asia-Pacific', rating: 'A-', type: 'SDG Bond', outstanding: 1.8, yield: 4.02, spread: 112, greenPct: 55, sdg: [7, 9, 13], verifier: 'RAM', framework: 'Malaysia Sustainability Sukuk Framework', renewTarget: 40, climateScore: 65, maturity: '2030', issued: 2021, couponPct: 3.58, liquidity: 'Low', creditOutlook: 'Stable', debtGdp: 68.0 },
  { country: 'California (US)', region: 'North America', rating: 'AA', type: 'Climate Bond', outstanding: 9.5, yield: 3.38, spread: -2, greenPct: 100, sdg: [7, 11, 13], verifier: 'CBI', framework: 'California Green Bond Framework', renewTarget: 100, climateScore: 90, maturity: '2035', issued: 2022, couponPct: 2.5, liquidity: 'High', creditOutlook: 'Stable', debtGdp: 18.4 },
];

const MARKET_TREND = Array.from({ length: 7 }, (_, i) => ({
  year: `${2019 + i}`,
  'Green Sovereign': Math.round(50 + i * 50 + sr(i * 7) * 20),
  'Sustainability Bond': Math.round(20 + i * 35 + sr(i * 11) * 15),
  'Blue Bond': +(0.5 + i * 0.6 + sr(i * 13) * 0.3).toFixed(1),
  'Transition Bond': Math.round(5 + i * 10 + sr(i * 17) * 4),
  'SDG Bond': Math.round(10 + i * 22 + sr(i * 19) * 10),
  'Debt-for-Nature': +(0.1 + i * 0.25 + sr(i * 23) * 0.1).toFixed(2),
}));

const YIELD_CURVE = ['2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'].map((t, i) => ({
  tenor: t,
  'AAA Green': +(1.8 + i * 0.22 + sr(i * 7) * 0.08).toFixed(2),
  'AA Green': +(2.1 + i * 0.25 + sr(i * 11) * 0.09).toFixed(2),
  'A Green': +(2.6 + i * 0.28 + sr(i * 13) * 0.12).toFixed(2),
  'BBB Green': +(3.4 + i * 0.30 + sr(i * 17) * 0.15).toFixed(2),
  'BB & Below': +(5.8 + i * 0.35 + sr(i * 21) * 0.20).toFixed(2),
}));

const SDG_ALLOCATION = [
  { sdg: 'SDG 7: Clean Energy', pct: 38, count: 22, amount: 145 },
  { sdg: 'SDG 13: Climate Action', pct: 28, count: 28, amount: 107 },
  { sdg: 'SDG 11: Sustainable Cities', pct: 12, count: 14, amount: 46 },
  { sdg: 'SDG 9: Industry & Infra', pct: 10, count: 12, amount: 38 },
  { sdg: 'SDG 15: Life on Land', pct: 6, count: 8, amount: 23 },
  { sdg: 'SDG 14: Life Below Water', pct: 4, count: 5, amount: 15 },
  { sdg: 'SDG 3: Good Health', pct: 2, count: 3, amount: 8 },
];

const GREENIUM_DATA = ISSUERS.filter(b => b.rating.startsWith('AA') || b.rating.startsWith('AAA')).slice(0, 14).map((b, i) => ({
  country: b.country,
  greenium: -(Math.round(sr(i * 7) * 8 + 1)),
  yield: b.yield,
  outstanding: b.outstanding,
}));

const REGULATORY_STANDARDS = [
  { name: 'EU Green Bond Standard (EU GBS)', body: 'European Commission', status: 'Final Regulation 2024', scope: 'EU sovereign + corporate bonds', key: 'Must align proceeds with EU Taxonomy; EGS Registration required; Annual allocation + impact reporting', label: 'Gold standard for European green bonds' },
  { name: 'ICMA Green Bond Principles', body: 'ICMA', status: 'Voluntary', scope: 'Global bonds', key: 'Use of Proceeds; Process for Project Evaluation; Management of Proceeds; Reporting', label: 'Market baseline — 95%+ adoption globally' },
  { name: 'Climate Bonds Initiative (CBI)', body: 'CBI', status: 'Voluntary', scope: 'Global sector-specific', key: 'Science-based; sector-specific criteria; Pre/post issuance certification; Dark/Medium/Light Green', label: 'Science-based certification framework' },
  { name: 'ASEAN Green Bond Standards', body: 'ASEAN Capital Markets Forum', status: 'Voluntary', scope: 'ASEAN issuers', key: 'Based on ICMA GBP; ASEAN-specific economic context; Cross-border harmonisation', label: 'Regional framework for SE Asia' },
  { name: 'India SEBI Green Bond', body: 'SEBI', status: 'Regulatory', scope: 'India listed entities', key: 'Mandatory for listed green bonds; Nine eligible categories; Annual impact disclosure required', label: 'India\'s sovereign green bond regulation' },
  { name: 'UN SDG Sovereign Bond Framework', body: 'UNDP', status: 'Voluntary', scope: 'Sovereign EM issuers', key: 'SDG alignment mapping; National Development Plans; Impact KPIs; Transparency', label: 'Emerging market sovereign standard' },
];

const CREDIT_RISK_DATA = ISSUERS.slice(0, 20).map((b, i) => ({
  country: b.country,
  creditScore: Math.round(30 + sr(i * 7) * 70),
  debtGdp: b.debtGdp || Math.round(sr(i * 11) * 200 + 20),
  fiscalBalance: +((sr(i * 13) - 0.6) * 8).toFixed(1),
  cds5y: Math.round(sr(i * 17) * 300 + 10),
  rating: b.rating,
}));

const TABS = ['Overview', 'Bond Screener', 'Country Assessment', 'SDG Alignment', 'Yield Analysis', 'Greenium', 'Market Trends', 'Portfolio Builder', 'Liquidity Analysis', 'Credit Risk', 'Regulatory Standards'];
const REGIONS = ['All', 'Europe', 'Asia-Pacific', 'Latin America', 'Africa', 'North America'];
const TYPES_F = ['All', ...BOND_TYPES.map(b => b.type)];
const RATINGS = ['All', 'AAA', 'AA', 'A', 'BBB', 'BB & Below'];

export default function ClimateSovereignBondsPage() {
  const [tab, setTab] = useState('Overview');
  const [regionF, setRegionF] = useState('All');
  const [typeF, setTypeF] = useState('All');
  const [ratingF, setRatingF] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [pfBudget, setPfBudget] = useState(100);
  const [pfMaxSpread, setPfMaxSpread] = useState(200);
  const [pfMinScore, setPfMinScore] = useState(60);
  const [pfMinRating, setPfMinRating] = useState('BBB');
  const [liquidityF, setLiquidityF] = useState('All');

  const ratingGroup = r => {
    if (r.startsWith('AAA')) return 'AAA';
    if (r.startsWith('AA')) return 'AA';
    if (r.startsWith('A') && !r.startsWith('AA')) return 'A';
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

  const pfHoldings = useMemo(() => {
    const ratingRank = { 'AAA': 5, 'AA': 4, 'A': 3, 'BBB': 2, 'BB & Below': 1 };
    const minRank = ratingRank[pfMinRating] || 1;
    return ISSUERS.filter(b => b.spread <= pfMaxSpread && b.climateScore >= pfMinScore && ratingRank[ratingGroup(b.rating)] >= minRank);
  }, [pfMaxSpread, pfMinScore, pfMinRating]);

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

  const pfStats = useMemo(() => {
    const n = Math.max(1, pfHoldings.length);
    const wt = pfBudget / n;
    return {
      count: pfHoldings.length,
      totalAlloc: pfBudget,
      avgYield: (pfHoldings.reduce((s, b) => s + b.yield, 0) / n).toFixed(2),
      avgSpread: Math.round(pfHoldings.reduce((s, b) => s + b.spread, 0) / n),
      avgScore: Math.round(pfHoldings.reduce((s, b) => s + b.climateScore, 0) / n),
      avgDur: (7.5 + sr(pfHoldings.length * 3) * 3).toFixed(1),
    };
  }, [pfHoldings, pfBudget]);

  const typeColor = t => BOND_TYPES.find(b => b.type === t)?.color || T.navy;

  const tabBtn = t => ({
    padding: '7px 14px', border: `1px solid ${tab === t ? T.navy : T.border}`,
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

  const exportCSV = useCallback((data, fn) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Climate Sovereign Bonds</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>30 sovereign issuers · 7 bond types · portfolio builder · liquidity · credit risk · regulatory standards — EP-DI4</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search country..." style={inpS} />
        <select value={regionF} onChange={e => setRegionF(e.target.value)} style={selS}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={selS}>{TYPES_F.map(t => <option key={t}>{t}</option>)}</select>
        <select value={ratingF} onChange={e => setRatingF(e.target.value)} style={selS}>{RATINGS.map(r => <option key={r}>{r}</option>)}</select>
        <button onClick={() => exportCSV(filtered, 'sovereign_bonds.csv')} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, background: T.surface, color: T.text, cursor: 'pointer' }}>Export</button>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{kpis.count} bonds · ${ kpis.total}Bn</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Total Outstanding" value={`$${kpis.total}Bn`} sub="filtered universe" />
        <KpiCard label="Avg Yield" value={`${kpis.avgYield}%`} color={T.amber} />
        <KpiCard label="Avg Climate Score" value={`${kpis.avgScore}/100`} color={T.sage} />
        <KpiCard label="Avg Spread (bps)" value={kpis.avgSpread} color={kpis.avgSpread < 0 ? T.green : T.amber} sub="vs conventional" />
        <KpiCard label="Sovereign Issuers" value={kpis.count} />
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Outstanding by Bond Type ($Bn)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeAlloc}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="outstanding" radius={[4, 4, 0, 0]} name="Outstanding ($Bn)">
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {BOND_TYPES.map(b => (
                <div key={b.type} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${b.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.type}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{b.description}</div>
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
              <tr>{['Country', 'Region', 'Type', 'Rating', 'Outstanding($Bn)', 'Yield%', 'Spread(bps)', 'Climate Score', 'Renew Target%', 'Verifier', 'Maturity', 'Coupon%'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
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
                  <td style={{ ...tdS, fontFamily: T.mono, color: b.spread < 0 ? T.green : b.spread < 150 ? T.amber : T.red }}>{b.spread}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 48, height: 5, background: T.border, borderRadius: 3 }}>
                        <div style={{ width: `${b.climateScore}%`, height: '100%', background: b.climateScore > 80 ? T.sage : b.climateScore > 60 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T.textSec }}>{b.climateScore}</span>
                    </div>
                  </td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{b.renewTarget}%</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{b.verifier}</td>
                  <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10 }}>{b.maturity}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{b.couponPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selected && (
            <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.surfaceH }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{selected.country} — {selected.type}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {[['Rating', selected.rating], ['Outstanding', `$${selected.outstanding}Bn`], ['Yield', `${selected.yield}%`], ['Spread', `${selected.spread}bps`], ['Climate Score', `${selected.climateScore}/100`], ['Verifier', selected.verifier], ['Renew Target', `${selected.renewTarget}%`], ['Maturity', selected.maturity], ['Coupon', `${selected.couponPct}%`], ['Issued', selected.issued], ['Liquidity', selected.liquidity || 'N/A'], ['Debt/GDP', `${selected.debtGdp}%`]].map(([k, v], j) => (
                  <div key={j} style={{ background: T.surface, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}><strong style={{ color: T.text }}>Framework:</strong> {selected.framework}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: T.textSec }}><strong style={{ color: T.text }}>SDG Alignment:</strong> SDGs {selected.sdg.join(', ')}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'Country Assessment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Climate Score by Country (Top 20)</div>
            <ResponsiveContainer width="100%" height={380}>
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
            <ResponsiveContainer width="100%" height={380}>
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
      )}

      {tab === 'SDG Alignment' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Proceeds Allocated by SDG (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SDG_ALLOCATION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="sdg" tick={{ fontSize: 9, fill: T.textSec }} width={160} />
                  <Tooltip {...tip} />
                  <Bar dataKey="pct" fill={T.navy} radius={[0, 4, 4, 0]} name="Allocation %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>SDG Proceeds Amount ($Bn)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SDG_ALLOCATION}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sdg" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={50} tickFormatter={v => v.split(':')[0]} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="amount" fill={T.teal} radius={[4, 4, 0, 0]} name="Amount ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>SDG Alignment by Issuer</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {filtered.slice(0, 16).map((b, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{b.country}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {b.sdg.map(s => (
                      <span key={s} style={{ background: T.navy + '30', color: T.navy, padding: '2px 5px', borderRadius: 4, fontSize: 10, fontFamily: T.mono }}>SDG {s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Yield Analysis' && (
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
                <Line type="monotone" dataKey="BB & Below" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Yield vs Spread Scatter</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Yield %" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Yield %', position: 'bottom', fill: T.textSec, fontSize: 9 }} />
                <YAxis dataKey="y" name="Spread bps" tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Scatter data={filtered.map(b => ({ name: b.country, x: b.yield, y: b.spread }))} fill={T.gold} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Yield Spread by Rating Category (bps)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={RATINGS.filter(r => r !== 'All').map(r => ({
                rating: r,
                avgSpread: Math.round(filtered.filter(b => ratingGroup(b.rating) === r).reduce((s, b) => s + b.spread, 0) / Math.max(1, filtered.filter(b => ratingGroup(b.rating) === r).length)),
                count: filtered.filter(b => ratingGroup(b.rating) === r).length,
              })).filter(d => d.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="avgSpread" radius={[4, 4, 0, 0]} name="Avg Spread (bps)">
                  {RATINGS.filter(r => r !== 'All').map((r, i) => <Cell key={i} fill={r === 'AAA' || r === 'AA' ? T.green : r === 'A' ? T.sage : r === 'BBB' ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Climate Score vs Yield</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Climate Score" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis dataKey="y" name="Yield %" tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Scatter data={filtered.map(b => ({ name: b.country, x: b.climateScore, y: b.yield }))} fill={T.teal} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Greenium' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
              The <strong style={{ color: T.text }}>greenium</strong> is the yield premium investors accept for certified sovereign green bonds vs equivalent conventional bonds.
              Empirical range: <strong style={{ color: T.sage }}>−1 to −13 bps</strong> for investment-grade sovereigns.
              <span style={{ color: T.textMut }}> (ECB Working Paper 2021; ICMA GBP studies 2023)</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Greenium by Country (bps vs conventional)</div>
              <ResponsiveContainer width="100%" height={340}>
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
                { driver: 'Strong ESG/Climate credentials', impact: 'High', detail: 'Sweden, Denmark: −8 to −13 bps; CICERO Dark Green' },
                { driver: 'Large liquid benchmark size', impact: 'High', detail: '>€10Bn outstanding reduces illiquidity premium' },
                { driver: 'CICERO Dark Green certification', impact: 'High', detail: 'Dark Green shade commands deepest greenium' },
                { driver: 'Strong investor ESG mandate demand', impact: 'Medium', detail: 'ESG-mandated AUM drives green premium bid' },
                { driver: 'Regulatory tailwinds (Basel/EBA)', impact: 'Medium', detail: 'Green HQLA treatment proposals in progress' },
                { driver: 'EM issuer risk premium', impact: 'Negative', detail: 'EM credit spread offsets any potential greenium' },
                { driver: 'Small issuance size / illiquidity', impact: 'Negative', detail: 'Sub-€5Bn issuances show positive spread vs conventional' },
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Sovereign Green Bond Issuance ($Bn, stacked)</div>
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
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Blue Bond & Debt-for-Nature Issuance ($Bn)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MARKET_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="Blue Bond" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Debt-for-Nature" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cS, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Market Milestones</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { year: '2016', event: 'Poland issues first sovereign green bond (€750M)', color: T.navy },
                { year: '2017', event: 'France OAT Verte — first large sovereign (€7Bn)', color: T.sage },
                { year: '2019', event: 'Netherlands AAA green; greenium documented', color: T.gold },
                { year: '2021', event: 'UK inaugural £10Bn gilt-green; EU NGEU €12Bn', color: T.teal },
                { year: '2021', event: 'Belize Blue Bond ($553M) — first debt-for-nature swap', color: '#06b6d4' },
                { year: '2022', event: 'Australia, Canada, Denmark debut; $500Bn record year', color: T.amber },
                { year: '2023', event: 'Ecuador Galapagos swap ($656M); India SGrB', color: T.navy },
                { year: '2024', event: 'EU GBS enters force; pipeline >$800Bn (ICMA)', color: T.sage },
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

      {tab === 'Portfolio Builder' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Portfolio Holdings" value={pfStats.count} />
            <KpiCard label="Avg Yield" value={`${pfStats.avgYield}%`} color={T.gold} />
            <KpiCard label="Avg Spread" value={`${pfStats.avgSpread} bps`} color={pfStats.avgSpread < 0 ? T.green : T.amber} />
            <KpiCard label="Avg Climate Score" value={`${pfStats.avgScore}/100`} color={T.sage} />
            <KpiCard label="Portfolio Budget" value={`$${pfBudget}Mn`} />
          </div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Portfolio Construction Constraints</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Budget ($Mn): <strong style={{ color: T.text }}>{pfBudget}</strong></div>
                <input type="range" min={10} max={1000} step={10} value={pfBudget} onChange={e => setPfBudget(+e.target.value)} style={{ width: '100%', accentColor: T.navy }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max Spread (bps): <strong style={{ color: T.text }}>{pfMaxSpread}</strong></div>
                <input type="range" min={-20} max={800} step={10} value={pfMaxSpread} onChange={e => setPfMaxSpread(+e.target.value)} style={{ width: '100%', accentColor: T.teal }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Climate Score: <strong style={{ color: T.text }}>{pfMinScore}</strong></div>
                <input type="range" min={0} max={100} step={5} value={pfMinScore} onChange={e => setPfMinScore(+e.target.value)} style={{ width: '100%', accentColor: T.sage }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>Min Rating</div>
                <select value={pfMinRating} onChange={e => setPfMinRating(e.target.value)} style={{ ...selS, width: '100%' }}>
                  {['AAA', 'AA', 'A', 'BBB', 'BB & Below'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Country', 'Type', 'Rating', 'Yield%', 'Spread', 'Climate Score', 'SDG Count', 'Maturity', 'Coupon%', 'Alloc ($Mn)'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {pfHoldings.map((b, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{b.country}</td>
                    <td style={{ ...tdS, fontSize: 11 }}><span style={{ color: typeColor(b.type) }}>{b.type}</span></td>
                    <td style={tdS}><span style={{ color: ratingColor(b.rating), fontWeight: 600 }}>{b.rating}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{b.yield}%</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: b.spread < 0 ? T.green : b.spread < 150 ? T.amber : T.red }}>{b.spread}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: b.climateScore > 80 ? T.sage : b.climateScore > 60 ? T.amber : T.red }}>{b.climateScore}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{b.sdg.length}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10 }}>{b.maturity}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{b.couponPct}%</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.gold }}>{(pfBudget / Math.max(1, pfHoldings.length)).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Liquidity Analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Liquidity Profile by Outstanding Size</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Outstanding ($Bn)" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Outstanding ($Bn)', position: 'bottom', fill: T.textSec, fontSize: 9 }} />
                <YAxis dataKey="y" name="Climate Score" tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                    <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                    <div style={{ color: T.textSec }}>Size: ${payload[0]?.payload?.x}Bn | Score: {payload[0]?.payload?.y}</div>
                  </div>
                ) : null} />
                <Scatter data={filtered.map(b => ({ name: b.country, x: b.outstanding, y: b.climateScore }))} fill={T.navy} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Liquidity Tier Distribution</div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={['Very High', 'High', 'Medium', 'Low', 'Very Low'].map(l => ({
                  name: l,
                  value: ISSUERS.filter(b => b.liquidity === l).length,
                })).filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {[T.green, T.sage, T.amber, T.red, '#a855f7'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip {...tip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cS, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Top Issuers by Outstanding ($Bn) with Spread</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...ISSUERS].sort((a, b) => b.outstanding - a.outstanding).slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="outstanding" fill={T.navy} radius={[4, 4, 0, 0]} name="Outstanding ($Bn)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Credit Risk' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Debt/GDP vs Yield (Credit Stress)</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Debt/GDP %" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Debt/GDP %', position: 'bottom', fill: T.textSec, fontSize: 9 }} />
                <YAxis dataKey="y" name="Yield %" tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                    <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                    <div style={{ color: T.textSec }}>Debt/GDP: {payload[0]?.payload?.x}% | Yield: {payload[0]?.payload?.y}%</div>
                  </div>
                ) : null} />
                <Scatter data={ISSUERS.map(b => ({ name: b.country, x: b.debtGdp || 60, y: b.yield }))} fill={T.red} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>CDS 5Y Proxy vs Spread (bps)</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="CDS 5Y" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis dataKey="y" name="Bond Spread" tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Scatter data={CREDIT_RISK_DATA.map(c => ({ name: c.country, x: c.cds5y, y: ISSUERS.find(b => b.country === c.country)?.spread || 0 }))} fill={T.amber} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cS, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Credit Rating Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={['AAA', 'AA', 'A', 'BBB', 'BB & Below'].map(r => ({
                rating: r,
                count: ISSUERS.filter(b => ratingGroup(b.rating) === r).length,
                avgYield: (ISSUERS.filter(b => ratingGroup(b.rating) === r).reduce((s, b) => s + b.yield, 0) / Math.max(1, ISSUERS.filter(b => ratingGroup(b.rating) === r).length)).toFixed(2),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Issuers">
                  {['AAA', 'AA', 'A', 'BBB', 'BB & Below'].map((r, i) => <Cell key={i} fill={ratingColor(r)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Regulatory Standards' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {REGULATORY_STANDARDS.map((s, i) => (
              <div key={i} style={{ ...cS, borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.name}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: T.navy, background: T.navy + '20', padding: '2px 7px', borderRadius: 4 }}>{s.body}</span>
                  <span style={{ fontSize: 10, color: s.status === 'Voluntary' ? T.amber : T.green, background: (s.status === 'Voluntary' ? T.amber : T.green) + '20', padding: '2px 7px', borderRadius: 4 }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}><strong style={{ color: T.text }}>Scope:</strong> {s.scope}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}><strong style={{ color: T.text }}>Key Requirements:</strong> {s.key}</div>
                <div style={{ fontSize: 11, color: COLORS[i % COLORS.length], fontStyle: 'italic' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Standards Comparison Matrix</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Standard', 'Use of Proceeds', 'EU Taxonomy', 'Science-Based', 'Biodiversity', 'Impact Reporting', 'Third Party Verify', 'EM-Suitable'].map(h => (
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'EU GBS', uop: true, taxon: true, science: true, bio: false, impact: true, tpv: true, em: false },
                    { name: 'ICMA GBP', uop: true, taxon: false, science: false, bio: false, impact: true, tpv: false, em: true },
                    { name: 'CBI Standard', uop: true, taxon: false, science: true, bio: false, impact: true, tpv: true, em: true },
                    { name: 'ASEAN GBS', uop: true, taxon: false, science: false, bio: false, impact: true, tpv: false, em: true },
                    { name: 'India SEBI', uop: true, taxon: false, science: false, bio: false, impact: true, tpv: true, em: true },
                    { name: 'UN SDG Sfwk', uop: false, taxon: false, science: false, bio: true, impact: true, tpv: false, em: true },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{row.name}</td>
                      {['uop', 'taxon', 'science', 'bio', 'impact', 'tpv', 'em'].map(k => (
                        <td key={k} style={{ ...tdS, textAlign: 'center', color: row[k] ? T.green : T.textMut }}>{row[k] ? '✓' : '–'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
