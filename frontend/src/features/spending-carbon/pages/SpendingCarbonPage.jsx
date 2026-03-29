/**
 * EP-Z4 — Spending Pattern Carbon Analyzer
 * Sprint Z — Consumer Carbon Intelligence
 *
 * Analyzes spending patterns to reveal the "carbon economy" — where every
 * dollar has a carbon weight. Identifies highest-carbon spending habits
 * and suggests transitions.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area,
  AreaChart, ScatterChart, Scatter, ZAxis,
} from 'recharts';

/* ── Theme ── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8',
  borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a',
  goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c',
  textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a',
  amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── Transition Recommendations ── */
const TRANSITION_PATHS = [
  { from: 'Beef 2x/week', to: 'Chicken 2x/week', carbon_save_annual_kg: 1050, cost_save_annual_usd: 200, difficulty: 'Easy', health_impact: 'Neutral', category: 'Food' },
  { from: 'Beef 2x/week', to: 'Plant-based 2x/week', carbon_save_annual_kg: 1310, cost_save_annual_usd: 350, difficulty: 'Medium', health_impact: 'Positive', category: 'Food' },
  { from: 'Cow milk (1L/day)', to: 'Oat milk (1L/day)', carbon_save_annual_kg: 822, cost_save_annual_usd: -120, difficulty: 'Easy', health_impact: 'Neutral', category: 'Food' },
  { from: 'Drive to work (20km)', to: 'Train to work (20km)', carbon_save_annual_kg: 835, cost_save_annual_usd: 1500, difficulty: 'Medium', health_impact: 'Positive', category: 'Transport' },
  { from: 'Fast fashion (12 items/yr)', to: 'Quality (4 items/yr) + secondhand', carbon_save_annual_kg: 150, cost_save_annual_usd: 200, difficulty: 'Easy', health_impact: 'Neutral', category: 'Shopping' },
  { from: 'New smartphone every 2yr', to: 'Refurbished + 4yr lifecycle', carbon_save_annual_kg: 28, cost_save_annual_usd: 250, difficulty: 'Easy', health_impact: 'Neutral', category: 'Shopping' },
  { from: '2 short-haul flights/yr', to: '2 train trips/yr', carbon_save_annual_kg: 340, cost_save_annual_usd: -50, difficulty: 'Medium', health_impact: 'Neutral', category: 'Transport' },
  { from: 'Hot water wash (weekly)', to: 'Cold wash', carbon_save_annual_kg: 21, cost_save_annual_usd: 40, difficulty: 'Very Easy', health_impact: 'Neutral', category: 'Home' },
  { from: '2hr daily streaming', to: '1hr streaming + 1hr offline', carbon_save_annual_kg: 16, cost_save_annual_usd: 0, difficulty: 'Easy', health_impact: 'Positive', category: 'Home' },
  { from: 'Single-use plastic bags', to: 'Reusable bags', carbon_save_annual_kg: 5, cost_save_annual_usd: 30, difficulty: 'Very Easy', health_impact: 'Neutral', category: 'Shopping' },
];

/* ── Peer Benchmarks (country averages) ── */
const PEER_BENCHMARKS = {
  'USA':        { avg_annual_tonnes: 14.7, avg_intensity: 0.92 },
  'UK':         { avg_annual_tonnes: 5.6, avg_intensity: 0.65 },
  'Germany':    { avg_annual_tonnes: 8.1, avg_intensity: 0.71 },
  'India':      { avg_annual_tonnes: 1.9, avg_intensity: 0.45 },
  'Japan':      { avg_annual_tonnes: 8.5, avg_intensity: 0.74 },
  'Australia':  { avg_annual_tonnes: 15.3, avg_intensity: 0.95 },
  'France':     { avg_annual_tonnes: 4.6, avg_intensity: 0.55 },
  'Canada':     { avg_annual_tonnes: 14.2, avg_intensity: 0.88 },
  'Brazil':     { avg_annual_tonnes: 2.2, avg_intensity: 0.38 },
  'Global Avg': { avg_annual_tonnes: 4.7, avg_intensity: 0.58 },
};

/* ── Seasonal Patterns ── */
const SEASONAL_LABELS = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };

/* ── Analyze ── */
function analyzeSpendingPatterns(transactions) {
  const byCategory = {};
  transactions.forEach(t => {
    const cat = t.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { total_usd: 0, total_carbon: 0, count: 0, items: [] };
    byCategory[cat].total_usd += t.amount_usd || 0;
    byCategory[cat].total_carbon += t.carbon_kg || 0;
    byCategory[cat].count++;
    byCategory[cat].items.push(t);
  });
  Object.values(byCategory).forEach(cat => {
    cat.intensity = cat.total_usd > 0 ? cat.total_carbon / cat.total_usd : 0;
  });
  const byMonth = {};
  transactions.forEach(t => {
    const month = t.date?.substring(0, 7) || 'unknown';
    if (!byMonth[month]) byMonth[month] = { usd: 0, carbon: 0, count: 0 };
    byMonth[month].usd += t.amount_usd || 0;
    byMonth[month].carbon += t.carbon_kg || 0;
    byMonth[month].count++;
  });
  return { byCategory, byMonth };
}

/* ── Colors ── */
const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.amber, T.red, T.sageL, T.goldL, '#6366f1', '#ec4899'];
const diffColors = { 'Very Easy': T.green, 'Easy': T.sage, 'Medium': T.amber, 'Hard': T.red };

/* ── Demo data generator ── */
function generateDemoTransactions() {
  const cats = ['Food', 'Transport', 'Home', 'Shopping', 'Entertainment'];
  const descs = {
    Food: ['Grocery run', 'Restaurant dinner', 'Coffee beans', 'Farmers market', 'Takeaway lunch'],
    Transport: ['Fuel top-up', 'Train ticket', 'Uber ride', 'Parking fee', 'Bus pass'],
    Home: ['Electricity bill', 'Gas bill', 'Water bill', 'Cleaning supplies', 'Light bulbs'],
    Shopping: ['Clothing', 'Electronics', 'Books', 'Home decor', 'Personal care'],
    Entertainment: ['Cinema tickets', 'Streaming sub', 'Concert', 'Museum pass', 'Game purchase'],
  };
  const txns = [];
  for (let m = 1; m <= 12; m++) {
    const month = String(m).padStart(2, '0');
    const count = 8 + Math.floor(sr(_sc++) * 8);
    for (let i = 0; i < count; i++) {
      const cat = cats[Math.floor(sr(_sc++) * cats.length)];
      const desc = descs[cat][Math.floor(sr(_sc++) * descs[cat].length)];
      const amt = +(5 + sr(_sc++) * 150).toFixed(2);
      const carbonBase = cat === 'Food' ? 0.8 : cat === 'Transport' ? 1.2 : cat === 'Home' ? 0.5 : cat === 'Shopping' ? 0.3 : 0.15;
      const carbon = +(amt * carbonBase * (0.5 + sr(_sc++))).toFixed(2);
      txns.push({
        id: `demo-${m}-${i}`,
        date: `2024-${month}-${String(1 + Math.floor(sr(_sc++) * 28)).padStart(2, '0')}`,
        description: desc, category: cat, amount_usd: amt, carbon_kg: carbon, source: 'demo',
      });
    }
  }
  return txns;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function SpendingCarbonPage() {
  const navigate = useNavigate();

  /* ── Load wallet ── */
  const [transactions, setTransactions] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_carbon_wallet_v1') || '[]');
      return raw.length > 0 ? raw : generateDemoTransactions();
    } catch { return generateDemoTransactions(); }
  });
  const [peerCountry, setPeerCountry] = useState('USA');
  const [forecastYears, setForecastYears] = useState(1);

  /* What-If sliders */
  const [beefReduction, setBeefReduction] = useState(0);
  const [transportSwitch, setTransportSwitch] = useState(0);
  const [energyReduction, setEnergyReduction] = useState(0);
  const [shoppingReduction, setShoppingReduction] = useState(0);

  const isDemo = useMemo(() => transactions.length > 0 && transactions[0]?.source === 'demo', [transactions]);
  const loadRealData = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_carbon_wallet_v1') || '[]');
      if (raw.length > 0) setTransactions(raw);
    } catch {}
  }, []);

  /* ── Analysis ── */
  const { byCategory, byMonth } = useMemo(() => analyzeSpendingPatterns(transactions), [transactions]);
  const totalSpend = useMemo(() => transactions.reduce((s, t) => s + (t.amount_usd || 0), 0), [transactions]);
  const totalCarbon = useMemo(() => transactions.reduce((s, t) => s + (t.carbon_kg || 0), 0), [transactions]);
  const carbonPerDollar = totalSpend > 0 ? totalCarbon / totalSpend : 0;

  /* Category arrays */
  const categoryData = useMemo(() =>
    Object.entries(byCategory)
      .map(([name, d]) => ({ name, totalCarbon: +d.total_carbon.toFixed(2), totalUsd: +d.total_usd.toFixed(2), intensity: +d.intensity.toFixed(3), count: d.count }))
      .sort((a, b) => b.intensity - a.intensity),
  [byCategory]);
  const pieData = useMemo(() => categoryData.map(c => ({ name: c.name, value: c.totalCarbon })), [categoryData]);

  /* Monthly trend */
  const monthlyData = useMemo(() =>
    Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({ month, usd: +d.usd.toFixed(0), carbon: +d.carbon.toFixed(1), count: d.count, intensity: d.usd > 0 ? +(d.carbon / d.usd).toFixed(3) : 0 })),
  [byMonth]);

  /* Best / Worst month */
  const bestMonth = useMemo(() => monthlyData.reduce((best, m) => (!best || m.intensity < best.intensity) ? m : best, null), [monthlyData]);
  const worstMonth = useMemo(() => monthlyData.reduce((worst, m) => (!worst || m.intensity > worst.intensity) ? m : worst, null), [monthlyData]);

  const highestCat = categoryData.length > 0 ? categoryData[0] : null;
  const lowestCat = categoryData.length > 1 ? categoryData[categoryData.length - 1] : null;

  /* Scatter data */
  const scatterData = useMemo(() => transactions.map(t => ({
    x: t.amount_usd || 0, y: t.carbon_kg || 0, z: 1, name: t.description,
  })), [transactions]);

  /* Carbon Rich / Lean */
  const sortedByIntensity = useMemo(() =>
    transactions.filter(t => t.amount_usd > 0).map(t => ({ ...t, intensity: t.carbon_kg / t.amount_usd })).sort((a, b) => b.intensity - a.intensity),
  [transactions]);
  const carbonRich = sortedByIntensity.slice(0, 10);
  const carbonLean = [...sortedByIntensity].reverse().slice(0, 10);

  /* Seasonal */
  const seasonalData = useMemo(() => {
    const byM = {};
    transactions.forEach(t => {
      const mm = t.date?.substring(5, 7) || '01';
      if (!byM[mm]) byM[mm] = { carbon: 0, count: 0 };
      byM[mm].carbon += t.carbon_kg || 0;
      byM[mm].count++;
    });
    return Object.entries(byM).sort(([a], [b]) => a.localeCompare(b)).map(([mm, d]) => ({
      month: SEASONAL_LABELS[mm] || mm, carbon: +d.carbon.toFixed(1),
    }));
  }, [transactions]);

  /* Carbon velocity (rate of change) */
  const velocityData = useMemo(() => {
    if (monthlyData.length < 2) return [];
    return monthlyData.map((m, i) => ({
      month: m.month,
      carbon: m.carbon,
      change: i > 0 ? +(m.carbon - monthlyData[i - 1].carbon).toFixed(1) : 0,
    }));
  }, [monthlyData]);

  /* What-If savings */
  const whatIfSaving = useMemo(() => {
    const beefSave = (beefReduction / 100) * 1310;
    const transportSave = (transportSwitch / 100) * 835;
    const energySave = (energyReduction / 100) * 500;
    const shopSave = (shoppingReduction / 100) * 178;
    return +(beefSave + transportSave + energySave + shopSave).toFixed(0);
  }, [beefReduction, transportSwitch, energyReduction, shoppingReduction]);

  /* Forecast */
  const annualCarbon = totalCarbon; // approximate from data period
  const forecastCarbon = annualCarbon * forecastYears;
  const budget15C = 2300; // kg CO2e per person for 1.5C pathway annual
  const reductionNeeded = annualCarbon > budget15C ? (((annualCarbon - budget15C) / annualCarbon) * 100).toFixed(0) : 0;

  /* Peer benchmark */
  const peerData = PEER_BENCHMARKS[peerCountry] || PEER_BENCHMARKS['Global Avg'];

  /* Potential savings */
  const potentialSavings = TRANSITION_PATHS.reduce((s, t) => s + t.carbon_save_annual_kg, 0);

  /* KPIs */
  const kpis = [
    { label: 'Total Spend', value: `$${totalSpend.toFixed(0)}`, color: T.navy },
    { label: 'Total Carbon', value: `${totalCarbon.toFixed(1)} kg`, color: T.red },
    { label: 'Carbon / Dollar', value: `${carbonPerDollar.toFixed(3)} kg/$`, color: carbonPerDollar < 0.5 ? T.green : carbonPerDollar < 1 ? T.amber : T.red },
    { label: 'Highest Carbon Category', value: highestCat?.name || '-', color: T.red },
    { label: 'Lowest Carbon Category', value: lowestCat?.name || '-', color: T.green },
    { label: 'Monthly Trend', value: monthlyData.length > 1 ? (monthlyData[monthlyData.length - 1].carbon > monthlyData[monthlyData.length - 2].carbon ? 'Rising' : 'Falling') : '-', color: T.amber },
    { label: 'Best Month', value: bestMonth ? `${bestMonth.month} (${bestMonth.intensity})` : '-', color: T.green },
    { label: 'Worst Month', value: worstMonth ? `${worstMonth.month} (${worstMonth.intensity})` : '-', color: T.red },
    { label: 'Transitions Available', value: TRANSITION_PATHS.length, color: T.sage },
    { label: 'Potential Savings', value: `${potentialSavings.toLocaleString()} kg/yr`, color: T.green },
  ];

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const header = 'Date,Description,Category,Amount_USD,Carbon_kg,Intensity\n';
    const rows = transactions.map(t => `${t.date},"${t.description}",${t.category},${t.amount_usd},${t.carbon_kg},${t.amount_usd > 0 ? (t.carbon_kg / t.amount_usd).toFixed(3) : ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `spending_carbon_${Date.now()}.csv`; a.click();
  }, [transactions]);
  const exportJSON = useCallback(() => {
    const data = { totalSpend, totalCarbon, carbonPerDollar, categories: categoryData, transitions: TRANSITION_PATHS, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `transition_plan_${Date.now()}.json`; a.click();
  }, [totalSpend, totalCarbon, carbonPerDollar, categoryData]);
  const handlePrint = useCallback(() => window.print(), []);

  /* ── Styles ── */
  const sCard = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const sBtn = (bg = T.navy, color = '#fff') => ({
    background: bg, color, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
    fontFamily: T.font, fontWeight: 600, fontSize: 14, transition: 'opacity .2s',
  });
  const sBadge = (bg, color) => ({
    display: 'inline-block', background: bg, color, borderRadius: 20, padding: '3px 12px',
    fontSize: 11, fontWeight: 600, marginLeft: 6,
  });

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── 1. Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>Spending Pattern Carbon Analyzer</h1>
            <span style={sBadge(T.gold + '22', T.gold)}>EP-Z4</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            Your Carbon Economy &middot; Every Dollar Has a Carbon Weight
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isDemo && <button onClick={loadRealData} style={sBtn(T.amber, '#fff')}>Load Real Wallet Data</button>}
          <button onClick={() => navigate('/carbon-wallet')} style={sBtn(T.sage)}>Wallet</button>
          <button onClick={() => navigate('/carbon-calculator')} style={sBtn(T.navyL)}>Calculator</button>
          <button onClick={() => navigate('/invoice-parser')} style={sBtn(T.gold, T.navy)}>Invoice Parser</button>
        </div>
      </div>

      {isDemo && (
        <div style={{ background: T.amber + '12', border: `1px solid ${T.amber}30`, borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 13, color: T.amber }}>
          Showing demo data. Add transactions via Carbon Wallet or Invoice Parser to see your real spending analysis.
        </div>
      )}

      {/* ── 2. Hero: Carbon Intensity Gauge ── */}
      <div style={{ ...sCard, textAlign: 'center', background: `linear-gradient(135deg, ${T.navy}06, ${T.sage}08)` }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: T.textSec }}>Your Average Carbon Intensity</h2>
        <div style={{ fontSize: 56, fontWeight: 800, color: carbonPerDollar < 0.5 ? T.green : carbonPerDollar < 1.0 ? T.amber : T.red }}>
          {carbonPerDollar.toFixed(3)}
        </div>
        <div style={{ fontSize: 16, color: T.textSec, marginBottom: 14 }}>kg CO2e per dollar spent</div>
        {/* Gauge bar */}
        <div style={{ maxWidth: 400, margin: '0 auto', height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${T.green}, ${T.amber}, ${T.red})`, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: -4, left: `${Math.min(carbonPerDollar / 2 * 100, 100)}%`,
            width: 22, height: 22, borderRadius: '50%', background: T.surface, border: `3px solid ${T.navy}`, transform: 'translateX(-50%)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400, margin: '6px auto 0', fontSize: 11, color: T.textMut }}>
          <span>Green (&lt;0.5)</span><span>Moderate (0.5-1.0)</span><span>High (&gt;1.0)</span>
        </div>
      </div>

      {/* ── 3. KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...sCard, marginBottom: 0, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── 4. Category Carbon Intensity Ranking (Horizontal Bar) ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Category Carbon Intensity Ranking</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>kg CO2e per dollar spent — lower is better.</p>
        <ResponsiveContainer width="100%" height={Math.max(200, categoryData.length * 48)}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 100, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 12 }} label={{ value: 'kg CO2e / $', position: 'bottom', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fontWeight: 600 }} width={95} />
            <Tooltip formatter={v => `${v} kg/$`} />
            <Bar dataKey="intensity" fill={T.navy} radius={[0, 8, 8, 0]}>
              {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 5. Spending vs Carbon Scatter ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Spending vs Carbon Scatter</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>Each dot = one transaction. Top-left = carbon expensive. Bottom-right = carbon lean.</p>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" name="Amount ($)" unit="$" tick={{ fontSize: 12 }} label={{ value: 'Amount ($)', position: 'bottom', offset: 10, fontSize: 11 }} />
            <YAxis dataKey="y" name="Carbon (kg)" unit=" kg" tick={{ fontSize: 12 }} label={{ value: 'Carbon (kg)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <ZAxis range={[30, 30]} />
            <Tooltip formatter={(v, name) => name === 'Amount ($)' ? `$${v}` : `${v} kg`} />
            <Scatter data={scatterData} fill={T.navy} fillOpacity={0.5} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── 6. Monthly Carbon Trend (ComposedChart) ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Monthly Carbon Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'USD ($)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Carbon (kg)', angle: 90, position: 'insideRight', fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="usd" fill={T.navy + '60'} name="Spending ($)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="carbon" stroke={T.red} strokeWidth={2} name="Carbon (kg)" dot={{ r: 4 }} />
            <Line yAxisId="right" dataKey="intensity" stroke={T.sage} strokeWidth={1.5} strokeDasharray="5 5" name="Intensity (kg/$)" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── 7. Carbon Composition PieChart ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon Composition</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>What percentage of your carbon comes from each category?</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => `${v} kg CO2e`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── 8 & 9. Carbon Rich & Carbon Lean ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Carbon Rich */}
        <div style={{ ...sCard, marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: T.red }}>Carbon Rich Purchases (Highest kg/$)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'Description', '$ Spent', 'Carbon', 'Intensity'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px', color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {carbonRich.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px' }}>{i + 1}</td>
                    <td style={{ padding: '6px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ padding: '6px' }}>${t.amount_usd?.toFixed(2)}</td>
                    <td style={{ padding: '6px', fontWeight: 700, color: T.red }}>{t.carbon_kg?.toFixed(2)} kg</td>
                    <td style={{ padding: '6px', fontWeight: 700, color: T.red }}>{t.intensity?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Carbon Lean */}
        <div style={{ ...sCard, marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: T.green }}>Carbon Lean Purchases (Lowest kg/$)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'Description', '$ Spent', 'Carbon', 'Intensity'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px', color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {carbonLean.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px' }}>{i + 1}</td>
                    <td style={{ padding: '6px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ padding: '6px' }}>${t.amount_usd?.toFixed(2)}</td>
                    <td style={{ padding: '6px', fontWeight: 700, color: T.green }}>{t.carbon_kg?.toFixed(2)} kg</td>
                    <td style={{ padding: '6px', fontWeight: 700, color: T.green }}>{t.intensity?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 10. Transition Pathways ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Transition Pathways</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Actionable switches with annual carbon saving, cost impact, and difficulty rating.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
          {TRANSITION_PATHS.map((tp, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={sBadge(T.navy + '15', T.navy)}>{tp.category}</span>
                <span style={{
                  ...sBadge((diffColors[tp.difficulty] || T.amber) + '18', diffColors[tp.difficulty] || T.amber),
                  marginLeft: 0,
                }}>{tp.difficulty}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: T.red, fontWeight: 600, fontSize: 13 }}>{tp.from}</span>
                <span style={{ color: T.textMut, fontSize: 18 }}>{'\u2192'}</span>
                <span style={{ color: T.green, fontWeight: 600, fontSize: 13 }}>{tp.to}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <div>
                  <div style={{ color: T.textMut }}>Carbon Saved</div>
                  <div style={{ fontWeight: 700, color: T.green }}>{tp.carbon_save_annual_kg.toLocaleString()} kg/yr</div>
                </div>
                <div>
                  <div style={{ color: T.textMut }}>Cost Impact</div>
                  <div style={{ fontWeight: 700, color: tp.cost_save_annual_usd >= 0 ? T.green : T.red }}>
                    {tp.cost_save_annual_usd >= 0 ? '+' : ''}{tp.cost_save_annual_usd >= 0 ? 'Save' : 'Cost'} ${Math.abs(tp.cost_save_annual_usd)}/yr
                  </div>
                </div>
                {tp.health_impact && (
                  <div>
                    <div style={{ color: T.textMut }}>Health</div>
                    <div style={{ fontWeight: 600, color: tp.health_impact === 'Positive' ? T.green : T.textSec }}>{tp.health_impact}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 11. What-If Simulator ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>What-If Simulator</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 18px' }}>
          Adjust the sliders to see how lifestyle changes could reduce your annual carbon footprint.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {[
            { label: 'Reduce beef consumption', value: beefReduction, setter: setBeefReduction, maxSave: 1310, unit: '%' },
            { label: 'Switch to public transport', value: transportSwitch, setter: setTransportSwitch, maxSave: 835, unit: '%' },
            { label: 'Reduce home energy use', value: energyReduction, setter: setEnergyReduction, maxSave: 500, unit: '%' },
            { label: 'Reduce shopping / fast fashion', value: shoppingReduction, setter: setShoppingReduction, maxSave: 178, unit: '%' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</label>
                <span style={{ fontSize: 13, color: T.sage, fontWeight: 700 }}>{s.value}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={s.value}
                onChange={e => s.setter(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: T.sage }}
              />
              <div style={{ fontSize: 11, color: T.textMut }}>Max annual save: {s.maxSave.toLocaleString()} kg CO2e</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: T.green + '08', borderRadius: 12 }}>
          <div style={{ fontSize: 14, color: T.textSec, marginBottom: 4 }}>Estimated Annual Carbon Saving</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: T.green }}>{whatIfSaving.toLocaleString()} kg</div>
          <div style={{ fontSize: 13, color: T.textSec }}>
            That is equivalent to {(whatIfSaving / 22).toFixed(0)} trees absorbing CO2 for a year
          </div>
        </div>
      </div>

      {/* ── 12. Carbon Velocity ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon Velocity</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>Is your carbon spend accelerating or decelerating? Positive = increasing emissions.</p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={velocityData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="change" stroke={T.navy} fill={T.navy + '30'} name="Change (kg)" />
            <Line type="monotone" dataKey="carbon" stroke={T.red} strokeWidth={1.5} dot={false} name="Total (kg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 13. Seasonal Analysis ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Seasonal Analysis</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>Do you emit more carbon in winter (heating) or summer (flights, AC)?</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={seasonalData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={v => `${v} kg CO2e`} />
            <Bar dataKey="carbon" fill={T.gold} radius={[6, 6, 0, 0]} name="Carbon (kg)">
              {seasonalData.map((d, i) => (
                <Cell key={i} fill={d.carbon > (totalCarbon / 12) * 1.2 ? T.red : d.carbon < (totalCarbon / 12) * 0.8 ? T.green : T.gold} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 14. Peer Benchmark ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Peer Benchmark</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>How does your carbon economy compare to the average in your country?</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {Object.keys(PEER_BENCHMARKS).map(c => (
            <button key={c} onClick={() => setPeerCountry(c)} style={{
              ...sBtn(peerCountry === c ? T.navy : T.surfaceH, peerCountry === c ? '#fff' : T.text),
              padding: '6px 14px', fontSize: 12, borderRadius: 20,
              border: peerCountry === c ? 'none' : `1px solid ${T.border}`,
            }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          <div style={{ padding: 18, background: T.navy + '08', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>Your Annual Carbon</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{(annualCarbon / 1000).toFixed(1)} t</div>
          </div>
          <div style={{ padding: 18, background: T.surfaceH, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>{peerCountry} Average</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.textSec }}>{peerData.avg_annual_tonnes} t</div>
          </div>
          <div style={{ padding: 18, background: (annualCarbon / 1000) < peerData.avg_annual_tonnes ? T.green + '10' : T.red + '10', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>vs {peerCountry}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: (annualCarbon / 1000) < peerData.avg_annual_tonnes ? T.green : T.red }}>
              {(annualCarbon / 1000) < peerData.avg_annual_tonnes ? 'Below' : 'Above'} Avg
            </div>
            <div style={{ fontSize: 12, color: T.textMut }}>
              {Math.abs((annualCarbon / 1000) - peerData.avg_annual_tonnes).toFixed(1)} tonnes {(annualCarbon / 1000) < peerData.avg_annual_tonnes ? 'less' : 'more'}
            </div>
          </div>
          <div style={{ padding: 18, background: T.surfaceH, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>Your Intensity vs Avg</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: carbonPerDollar < peerData.avg_intensity ? T.green : T.red }}>
              {carbonPerDollar < peerData.avg_intensity ? 'Better' : 'Worse'}
            </div>
            <div style={{ fontSize: 12, color: T.textMut }}>
              You: {carbonPerDollar.toFixed(3)} vs Avg: {peerData.avg_intensity}
            </div>
          </div>
        </div>
      </div>

      {/* ── 15. Carbon Forecast ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon Forecast</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Forecast period:</label>
          {[1, 3, 5, 10].map(y => (
            <button key={y} onClick={() => setForecastYears(y)} style={{
              ...sBtn(forecastYears === y ? T.navy : T.surfaceH, forecastYears === y ? '#fff' : T.text),
              padding: '6px 14px', fontSize: 12, borderRadius: 20,
              border: forecastYears === y ? 'none' : `1px solid ${T.border}`,
            }}>{y} yr{y > 1 ? 's' : ''}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          <div style={{ padding: 20, background: T.red + '08', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>Projected Footprint ({forecastYears}yr)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.red }}>{(forecastCarbon / 1000).toFixed(1)} t CO2e</div>
          </div>
          <div style={{ padding: 20, background: T.green + '08', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>1.5C Budget ({forecastYears}yr)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.green }}>{((budget15C * forecastYears) / 1000).toFixed(1)} t CO2e</div>
          </div>
          <div style={{ padding: 20, background: T.amber + '08', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>Reduction Needed</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: reductionNeeded > 0 ? T.red : T.green }}>
              {reductionNeeded > 0 ? `${reductionNeeded}%` : 'On Track'}
            </div>
            <div style={{ fontSize: 12, color: T.textMut }}>
              {reductionNeeded > 0 ? `Cut ${((annualCarbon - budget15C) / 1000).toFixed(1)}t annually` : 'You are within budget!'}
            </div>
          </div>
        </div>
        {reductionNeeded > 0 && (
          <div style={{ marginTop: 14, padding: 14, background: T.amber + '10', borderRadius: 10, fontSize: 13, color: T.textSec }}>
            At your current rate, your annual footprint is {(annualCarbon / 1000).toFixed(1)} tonnes. The 1.5C pathway budget is approximately {(budget15C / 1000).toFixed(1)} tonnes per person per year. You would need to reduce by {reductionNeeded}% to align with climate targets. Check the Transition Pathways above for actionable steps.
          </div>
        )}
      </div>

      {/* ── Spending Habits Deep Dive ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Spending Habits Deep Dive</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Detailed breakdown of your transaction patterns and carbon distribution.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {categoryData.map((cat, i) => {
            const catTxns = transactions.filter(t => t.category === cat.name);
            const avgTxn = catTxns.length > 0 ? (cat.totalUsd / catTxns.length).toFixed(2) : 0;
            const avgCarbon = catTxns.length > 0 ? (cat.totalCarbon / catTxns.length).toFixed(2) : 0;
            const pct = totalCarbon > 0 ? ((cat.totalCarbon / totalCarbon) * 100).toFixed(1) : 0;
            const monthlyAvg = monthlyData.length > 0 ? (cat.totalCarbon / monthlyData.length).toFixed(1) : 0;
            return (
              <div key={i} style={{
                background: T.surface, borderRadius: 12, padding: 18,
                border: `1px solid ${T.border}`, borderLeft: `4px solid ${PIE_COLORS[i % PIE_COLORS.length]}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {cat.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>Transactions</span>
                    <span style={{ fontWeight: 700 }}>{cat.count}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>Total Spend</span>
                    <span style={{ fontWeight: 700 }}>${cat.totalUsd.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>Total Carbon</span>
                    <span style={{ fontWeight: 700, color: T.red }}>{cat.totalCarbon} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>Intensity</span>
                    <span style={{ fontWeight: 700, color: cat.intensity > 1 ? T.red : cat.intensity > 0.5 ? T.amber : T.green }}>
                      {cat.intensity} kg/$
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>Avg per Transaction</span>
                    <span style={{ fontWeight: 600 }}>${avgTxn} / {avgCarbon} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>Monthly Average</span>
                    <span style={{ fontWeight: 600 }}>{monthlyAvg} kg/mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.textSec }}>% of Footprint</span>
                    <span style={{ fontWeight: 700 }}>{pct}%</span>
                  </div>
                  {/* Mini bar */}
                  <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{
                      height: '100%', borderRadius: 3, width: `${pct}%`,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Carbon Budget Tracker ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon Budget Tracker</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Track your progress against recommended monthly carbon budgets by category.
        </p>
        {(() => {
          const budgets = [
            { category: 'Food', monthly_budget_kg: 150, icon: '\uD83C\uDF3D' },
            { category: 'Transport', monthly_budget_kg: 120, icon: '\uD83D\uDE8C' },
            { category: 'Home', monthly_budget_kg: 100, icon: '\uD83C\uDFE0' },
            { category: 'Shopping', monthly_budget_kg: 50, icon: '\uD83D\uDECD\uFE0F' },
            { category: 'Entertainment', monthly_budget_kg: 30, icon: '\uD83C\uDFAC' },
          ];
          const monthCount = Math.max(monthlyData.length, 1);
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {budgets.map((b, i) => {
                const catData = byCategory[b.category];
                const monthlyActual = catData ? catData.total_carbon / monthCount : 0;
                const pct = (monthlyActual / b.monthly_budget_kg) * 100;
                const isOver = pct > 100;
                return (
                  <div key={i} style={{
                    padding: 18, borderRadius: 12, textAlign: 'center',
                    background: isOver ? T.red + '08' : T.green + '08',
                    border: `1px solid ${isOver ? T.red + '25' : T.green + '25'}`,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.category}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isOver ? T.red : T.green }}>
                      {monthlyActual.toFixed(0)} / {b.monthly_budget_kg}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut }}>kg CO2e / month</div>
                    <div style={{ height: 8, borderRadius: 4, background: T.border, overflow: 'hidden', marginTop: 10 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${Math.min(pct, 100)}%`,
                        background: isOver ? T.red : pct > 75 ? T.amber : T.green,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: isOver ? T.red : T.green, fontWeight: 600, marginTop: 4 }}>
                      {isOver ? `${(pct - 100).toFixed(0)}% over budget` : `${(100 - pct).toFixed(0)}% remaining`}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── Weekly Pattern ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Weekly Spending Pattern</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Which days of the week do you generate the most carbon?
        </p>
        {(() => {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const byDay = {};
          dayNames.forEach(d => { byDay[d] = { carbon: 0, spend: 0, count: 0 }; });
          transactions.forEach(t => {
            if (!t.date) return;
            const d = new Date(t.date);
            if (isNaN(d.getTime())) return;
            const name = dayNames[d.getDay()];
            byDay[name].carbon += t.carbon_kg || 0;
            byDay[name].spend += t.amount_usd || 0;
            byDay[name].count++;
          });
          const dayData = dayNames.map(name => ({
            day: name,
            carbon: +byDay[name].carbon.toFixed(1),
            spend: +byDay[name].spend.toFixed(0),
            count: byDay[name].count,
          }));
          return (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dayData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fontSize: 13, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, name) => name === 'spend' ? `$${v}` : `${v} kg`} />
                <Legend />
                <Bar dataKey="carbon" fill={T.navy} name="Carbon (kg)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spend" fill={T.gold} name="Spend ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── Transition Impact Summary ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Transition Impact Summary</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          If you adopted all recommended transitions, here is the combined impact.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
          {[
            { label: 'Total Carbon Saved', value: `${potentialSavings.toLocaleString()} kg/yr`, color: T.green, desc: 'Annual reduction' },
            { label: 'Total Cost Impact', value: `$${TRANSITION_PATHS.reduce((s, t) => s + t.cost_save_annual_usd, 0).toLocaleString()}/yr`, color: T.sage, desc: 'Net annual saving' },
            { label: 'Trees Equivalent', value: `${(potentialSavings / 22).toFixed(0)} trees`, color: T.sageL, desc: 'Annual CO2 absorption' },
            { label: 'Driving Equivalent', value: `${(potentialSavings / 0.21).toFixed(0)} km`, color: T.navy, desc: 'Less driving needed' },
            { label: '% of Your Footprint', value: `${totalCarbon > 0 ? ((potentialSavings / totalCarbon) * 100).toFixed(0) : 0}%`, color: T.gold, desc: 'Reduction potential' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 18, background: s.color + '08', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Methodology ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600, color: T.textSec }}>Methodology & Data Sources</h3>
        <div style={{ fontSize: 12, color: T.textMut, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 6px' }}>Carbon intensity (kg CO2e per dollar) is calculated by dividing the total carbon emissions of each transaction or category by the dollar amount spent. This metric allows direct comparison across different spending categories.</p>
          <p style={{ margin: '0 0 6px' }}>Transition pathway savings are annualized estimates based on average consumption patterns from DEFRA, EPA, and academic lifecycle analysis studies. Actual savings will vary based on individual circumstances, location, and energy grid mix.</p>
          <p style={{ margin: '0 0 6px' }}>The 1.5C carbon budget of ~2.3 tonnes per person per year is derived from IPCC AR6 remaining carbon budget estimates divided by global population, representing an equitable per-capita share of remaining emissions space.</p>
          <p style={{ margin: 0 }}>Peer benchmarks represent national per-capita averages from the Global Carbon Project and World Bank data. Individual footprints may differ significantly based on lifestyle, income, and local infrastructure.</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {[
            { title: 'Parse a Receipt', desc: 'Upload a shopping receipt to auto-calculate its carbon footprint.', nav: '/invoice-parser', btn: 'Go to Parser', color: T.navy },
            { title: 'Log a Transaction', desc: 'Manually add a carbon transaction to your wallet for tracking.', nav: '/carbon-wallet', btn: 'Open Wallet', color: T.sage },
            { title: 'Calculate Footprint', desc: 'Use the calculator for detailed carbon footprint estimation.', nav: '/carbon-calculator', btn: 'Calculator', color: T.gold },
            { title: 'Set Carbon Goals', desc: 'Review transition pathways above and pick your first change.', nav: '#', btn: 'View Transitions', color: T.navyL },
          ].map((a, i) => (
            <div key={i} style={{ background: a.color + '08', borderRadius: 12, padding: 18, border: `1px solid ${a.color}20` }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: a.color }}>{a.title}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, lineHeight: 1.5 }}>{a.desc}</div>
              <button onClick={() => a.nav !== '#' && navigate(a.nav)} style={sBtn(a.color, '#fff')}>{a.btn}</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Carbon Milestones ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon Milestones</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Track your progress and celebrate achievements along the way.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
          {[
            { milestone: 'First Receipt Parsed', target: 1, current: transactions.length, icon: '\uD83C\uDFC1', desc: 'You started tracking!' },
            { milestone: '50 Transactions Logged', target: 50, current: transactions.length, icon: '\uD83D\uDCCA', desc: 'Building a habit' },
            { milestone: 'Under 100kg Monthly', target: 100, current: monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.carbon || 0 : 0, icon: '\uD83C\uDF1F', desc: 'Monthly carbon under 100kg', invert: true },
            { milestone: 'Intensity Under 0.5', target: 0.5, current: carbonPerDollar, icon: '\uD83D\uDCA1', desc: 'Carbon lean spending', invert: true },
            { milestone: '1 Tonne Tracked', target: 1000, current: totalCarbon, icon: '\uD83C\uDFAF', desc: 'Total carbon logged' },
            { milestone: '12 Months of Data', target: 12, current: monthlyData.length, icon: '\uD83D\uDCC5', desc: 'Full year insight' },
          ].map((m, i) => {
            const achieved = m.invert ? m.current <= m.target : m.current >= m.target;
            const progress = m.invert
              ? Math.max(0, Math.min(100, ((m.target - Math.max(m.current - m.target, 0)) / m.target) * 100))
              : Math.min(100, (m.current / m.target) * 100);
            return (
              <div key={i} style={{
                padding: 18, borderRadius: 12, textAlign: 'center',
                background: achieved ? T.green + '08' : T.surfaceH,
                border: `1px solid ${achieved ? T.green + '30' : T.border}`,
              }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: achieved ? T.green : T.navy }}>{m.milestone}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>{m.desc}</div>
                <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${progress}%`,
                    background: achieved ? T.green : T.amber, transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: achieved ? T.green : T.textMut }}>
                  {achieved ? 'Achieved!' : `${progress.toFixed(0)}% complete`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top Spending vs Carbon Mismatch ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Spending vs Carbon Mismatch</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Categories where your spending does not correlate with carbon output — revealing hidden carbon costs.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Category', '% of Spending', '% of Carbon', 'Mismatch', 'Interpretation'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textSec, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categoryData.map((cat, i) => {
                const spendPct = totalSpend > 0 ? (cat.totalUsd / totalSpend) * 100 : 0;
                const carbonPct = totalCarbon > 0 ? (cat.totalCarbon / totalCarbon) * 100 : 0;
                const mismatch = carbonPct - spendPct;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ padding: '8px' }}>{spendPct.toFixed(1)}%</td>
                    <td style={{ padding: '8px' }}>{carbonPct.toFixed(1)}%</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: mismatch > 5 ? T.red : mismatch < -5 ? T.green : T.textSec }}>
                      {mismatch > 0 ? '+' : ''}{mismatch.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', fontSize: 12, color: T.textSec }}>
                      {mismatch > 10 ? 'High hidden carbon cost' : mismatch > 5 ? 'Carbon exceeds spend share' : mismatch < -10 ? 'Carbon efficient spending' : mismatch < -5 ? 'Below average carbon' : 'Balanced'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQs ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Frequently Asked Questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'What is carbon intensity per dollar?', a: 'It measures how many kg of CO2e are emitted for every dollar you spend in a given category. Lower is better. A value under 0.5 kg/$ is considered "carbon lean".' },
            { q: 'Where does the transaction data come from?', a: 'Data is loaded from your Carbon Wallet (localStorage). You can add transactions manually, via receipt parsing, or through the Carbon Calculator.' },
            { q: 'How realistic are the transition pathways?', a: 'Each transition is based on published lifecycle analysis data. The savings are annualized estimates; your actual results depend on frequency, location, and personal circumstances.' },
            { q: 'What is the 1.5C carbon budget?', a: 'The IPCC estimates the remaining global carbon budget to limit warming to 1.5C. Divided equally per capita, this gives approximately 2.3 tonnes CO2e per person per year.' },
            { q: 'Can I compare myself to other countries?', a: 'Yes! The Peer Benchmark section compares your footprint to national averages from 9 countries and the global mean, sourced from the Global Carbon Project.' },
            { q: 'Is my data private?', a: 'Absolutely. All analysis runs locally in your browser. No data is transmitted to any server.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: T.navy }}>{faq.q}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 16. Exports & Cross-Nav ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Export & Navigate</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={sBtn(T.navy)}>Export Spending Analysis (CSV)</button>
          <button onClick={exportJSON} style={sBtn(T.sage)}>Export Transition Plan (JSON)</button>
          <button onClick={handlePrint} style={sBtn(T.gold, T.navy)}>Print Report</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('/carbon-wallet')} style={sBtn(T.navyL)}>Carbon Wallet</button>
          <button onClick={() => navigate('/carbon-calculator')} style={sBtn(T.sage)}>Carbon Calculator</button>
          <button onClick={() => navigate('/invoice-parser')} style={sBtn(T.gold, T.navy)}>Invoice Parser</button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '20px 0 8px', fontSize: 12, color: T.textMut }}>
        EP-Z4 Spending Pattern Carbon Analyzer &middot; Sprint Z Consumer Carbon Intelligence &middot; Data: DEFRA, EPA, IPCC emission factors
      </div>
    </div>
  );
}
