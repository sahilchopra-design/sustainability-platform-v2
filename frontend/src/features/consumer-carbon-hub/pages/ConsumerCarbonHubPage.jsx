import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── Local Storage Helpers ──────────────────────────────────────────── */
const LS_WALLET = 'ra_carbon_wallet_v1';
const LS_CART = 'ra_carbon_cart_v1';
const LS_RECEIPTS = 'ra_receipt_history_v1';
const LS_CONFIG = 'ra_carbon_wallet_config_v1';

const readLS = (key, fallback = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

/* ── Static Data ────────────────────────────────────────────────────── */
const CARBON_TIPS = [
  'Switching from a beef burger to a veggie burger saves 2.9 kg CO2e per meal.',
  'Air-drying clothes instead of using a dryer saves ~2.4 kg CO2e per load.',
  'Taking the train instead of driving saves 80% of carbon per km.',
  'Buying refurbished electronics saves 70-90% of manufacturing carbon.',
  'Eating seasonal, local produce cuts food transport emissions by 50%.',
  'A 5-minute shower instead of 8 minutes saves 0.9 kg CO2e each time.',
  'LED bulbs use 75% less energy than incandescent bulbs.',
  'Meal planning reduces food waste (and carbon) by up to 25%.',
  'Video calls emit 96% less carbon than business flights.',
  'One tree absorbs roughly 22 kg CO2 per year.',
  'Cycling to work produces zero direct emissions vs 4.2 kg for a 20km drive.',
  'Washing clothes at 30C instead of 60C cuts energy use by 57%.',
  'Keeping your car tyres properly inflated improves fuel efficiency by 3%.',
  'A vegan diet produces 2.5x less carbon than a meat-heavy diet.',
  'Streaming in standard definition uses 7x less energy than 4K.',
  'Composting food waste prevents methane emissions from landfill.',
  'Public transport is 6-10x more carbon efficient per passenger-km.',
  'Reusable bags need only 5 uses to offset their manufacturing carbon.',
  'Working from home 3 days/week saves about 0.5 tonnes CO2 per year.',
  'Drinking tap water is 300x less carbon intensive than bottled water.',
  'Insulating your home can reduce heating emissions by 40%.',
  'Electric kettles are 80% efficient vs 40% for stovetop kettles.',
  'Buying clothes second-hand saves 25 kg CO2 per garment on average.',
  'Replacing a gas boiler with a heat pump cuts heating carbon by 75%.',
  'A laptop uses 80% less energy than a desktop computer.',
  'Batch cooking saves 30% of cooking energy compared to daily cooking.',
  'Carpooling with one person halves your commute emissions.',
  'Keeping your freezer full improves energy efficiency by 25%.',
  'Using a pressure cooker saves 70% of cooking energy.',
  'Renewable electricity is 50x less carbon intensive than coal power.',
  'One kg of beef = 27 kg CO2e. One kg of lentils = 0.9 kg CO2e.',
  'Turning off standby devices saves 50-100 kg CO2e per year.',
  'A reusable water bottle saves 83g of CO2 per use vs a plastic bottle.',
  'Taking stairs instead of an elevator saves 0.01 kg CO2e per floor.',
  'Shopping local reduces food miles and supports lower-carbon supply chains.',
  'Proper recycling of aluminium saves 95% of manufacturing energy.',
  'A well-maintained car emits 10-15% less carbon than a neglected one.',
  'Slow fashion (buying less, better quality) reduces textile carbon by 60%.',
  'Growing your own herbs saves ~0.5 kg CO2e per month of transport emissions.',
  'Sharing a Netflix account is more carbon efficient than individual streaming.',
  'E-books have a 28x lower carbon footprint than printed books over time.',
  'Planting native trees is 30% more effective for carbon capture than non-native.',
  'Reducing red meat to once a week saves ~600 kg CO2e per year.',
  'Solar panels pay back their manufacturing carbon in 1-3 years.',
  'Choosing a hybrid car over petrol saves 2.5 tonnes CO2e per year.',
  'A fully loaded dishwasher uses less water and energy than hand washing.',
  'Switching to oat milk saves 0.9 kg CO2e per litre vs cow milk.',
  'Home composting saves 0.1 kg CO2e per kg of food waste.',
  'Double-glazed windows reduce heating carbon by 20%.',
  'A carbon-conscious diet is one of the top 3 personal climate actions.',
];

const CARBON_FACTS = [
  'A single email with an attachment = 0.05 kg CO2e.',
  'The average flight seat = your entire 1.5C annual budget (2.3 tonnes).',
  'Global internet use generates 3.7% of all greenhouse gas emissions.',
  'Bitcoin mining uses more electricity than some small countries.',
  'The fashion industry produces 10% of global carbon emissions.',
  'Concrete production alone accounts for 8% of global CO2.',
  'Food waste, if it were a country, would be the 3rd largest emitter.',
  'A Google search emits about 0.2 g CO2e.',
  'Shipping one online package emits about 1 kg CO2e.',
  'An average smartphone charges for 1.5 kg CO2e per year.',
];

const MODULE_CARDS = [
  { key: 'calculator', title: 'Carbon Calculator', desc: "What's the carbon cost of any product or activity?", path: '/carbon-calculator', color: T.navy, icon: 'calc' },
  { key: 'wallet', title: 'Carbon Wallet', desc: 'Track your personal carbon footprint over time.', path: '/carbon-wallet', color: T.sage, icon: 'wallet' },
  { key: 'invoice', title: 'Invoice Parser', desc: 'Upload receipts to extract carbon data automatically.', path: '/carbon-invoice-parser', color: T.gold, icon: 'receipt' },
  { key: 'analyzer', title: 'Spending Analyzer', desc: 'Understand your carbon spending patterns.', path: '/carbon-spending-analyzer', color: T.navyL, icon: 'chart' },
  { key: 'economy', title: 'Carbon Economy', desc: 'The big picture: what if carbon was a currency?', path: '/carbon-economy', color: T.red, icon: 'globe' },
];

const ONBOARDING_STEPS = [
  { step: 1, title: 'Calculate', desc: 'Search for any product or activity to see its carbon footprint.' },
  { step: 2, title: 'Log', desc: 'Add purchases to your wallet to track daily carbon spending.' },
  { step: 3, title: 'Analyze', desc: 'View patterns, trends, and category breakdowns.' },
  { step: 4, title: 'Reduce', desc: 'Get personalized recommendations to lower your footprint.' },
];

const CARBON_MILESTONES = [
  { threshold: 100, title: 'Carbon Curious', desc: 'Logged your first 100 kg of carbon data.' },
  { threshold: 500, title: 'Carbon Tracker', desc: 'Tracked 500 kg — you know where your carbon goes.' },
  { threshold: 1000, title: 'Carbon Aware', desc: '1 tonne tracked. You understand your footprint.' },
  { threshold: 2300, title: 'Budget Master', desc: 'Tracked a full 1.5C annual budget (2.3t).' },
  { threshold: 5000, title: 'Carbon Veteran', desc: '5 tonnes of data. A true carbon accountant.' },
];

const WEEKLY_CHALLENGES = [
  { week: 'This Week', challenge: 'Meat-Free Monday to Friday', target_save_kg: 15, difficulty: 'Medium' },
  { week: 'Next Week', challenge: 'Walk or cycle all commutes', target_save_kg: 20, difficulty: 'Hard' },
  { week: 'Week 3', challenge: 'No new clothing purchases', target_save_kg: 6, difficulty: 'Easy' },
  { week: 'Week 4', challenge: 'Cold wash all laundry', target_save_kg: 3, difficulty: 'Easy' },
];

const CARBON_GLOSSARY = [
  { term: 'CO2e', definition: 'Carbon dioxide equivalent — a standard unit for measuring all greenhouse gases in terms of CO2 impact.' },
  { term: 'Scope 1', definition: 'Direct emissions from sources you own or control (e.g., your car, gas heating).' },
  { term: 'Scope 2', definition: 'Indirect emissions from purchased electricity, steam, heating, and cooling.' },
  { term: 'Scope 3', definition: 'All other indirect emissions in your value chain (e.g., products you buy, flights).' },
  { term: 'Carbon Budget', definition: 'The maximum amount of CO2 that can be emitted while still limiting warming to a specific level.' },
  { term: 'Carbon Offset', definition: 'A reduction in CO2 elsewhere to compensate for emissions you produce.' },
  { term: 'Net Zero', definition: 'When carbon emissions are balanced by carbon removal, resulting in no net increase.' },
  { term: 'LCA', definition: 'Life Cycle Assessment — measuring environmental impacts from raw materials to disposal.' },
];

const IMPACT_COMPARISONS = [
  { amount_kg: 1, equivalent: 'Driving 4.76 km in a petrol car' },
  { amount_kg: 10, equivalent: 'One month of daily showers (8 min each)' },
  { amount_kg: 100, equivalent: 'About 2 weeks of average UK living' },
  { amount_kg: 1000, equivalent: 'One return flight London to Rome' },
  { amount_kg: 2300, equivalent: 'Your entire 1.5C annual carbon budget' },
  { amount_kg: 15500, equivalent: 'One year of average US consumption' },
];

const COMMUNITY_LEADERBOARD = [
  { rank: 1, name: 'EcoWarrior', score: 92, streak: 45 },
  { rank: 2, name: 'GreenLiving', score: 88, streak: 38 },
  { rank: 3, name: 'CarbonZero', score: 85, streak: 32 },
  { rank: 4, name: 'PlantPowered', score: 81, streak: 27 },
  { rank: 5, name: 'SustainableMe', score: 78, streak: 22 },
  { rank: 6, name: 'TreeHugger', score: 75, streak: 19 },
  { rank: 7, name: 'LowFootprint', score: 72, streak: 15 },
  { rank: 8, name: 'EarthFirst', score: 69, streak: 12 },
  { rank: 9, name: 'You', score: 65, streak: 8, isUser: true },
  { rank: 10, name: 'ClimateAware', score: 61, streak: 5 },
];

const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.red, T.amber, '#8b5cf6', '#ec4899'];

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n, d=1) => n >= 1000 ? (n/1000).toFixed(d)+'k' : Number(n).toFixed(d);

const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const hdr = Object.keys(rows[0]).join(',');
  const body = rows.map(r => Object.values(r).join(',')).join('\n');
  const blob = new Blob([hdr+'\n'+body], { type:'text/csv' });
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
};
const downloadJSON = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
};

/* ── Styles ──────────────────────────────────────────────────────────── */
const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 28, marginBottom: 24 };
const sectionTitle = { fontSize: 22, fontWeight: 700, color: T.navy, margin: '0 0 8px 0', fontFamily: T.font };
const sectionSub = { fontSize: 14, color: T.textSec, margin: '0 0 20px 0', lineHeight: 1.5 };
const badge = (bg, color) => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:bg, color });
const btnPrimary = { padding:'10px 22px', borderRadius:10, border:'none', background:T.navy, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font };
const btnOutline = { ...btnPrimary, background:'transparent', border:`1.5px solid ${T.border}`, color:T.navy };
const grid = (cols, gap=20) => ({ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap });
const kpiBox = { background: T.surfaceH, borderRadius: 10, padding: '16px 20px', textAlign: 'center' };

/* ── Component ──────────────────────────────────────────────────────── */
export default function ConsumerCarbonHubPage() {
  const nav = useNavigate();

  /* ── Read localStorage ─────────────────────────────────────────── */
  const wallet = useMemo(() => readLS(LS_WALLET, { transactions: [], balance_kg: 0, budget_kg: 2300 }), []);
  const cart = useMemo(() => readLS(LS_CART, { items: [] }), []);
  const receipts = useMemo(() => readLS(LS_RECEIPTS, { parsed: [] }), []);
  const config = useMemo(() => readLS(LS_CONFIG, { daily_budget_kg: 6.3, country: 'USA' }), []);

  const hasData = wallet.transactions && wallet.transactions.length > 0;

  /* ── Derived KPIs ──────────────────────────────────────────────── */
  const txns = wallet.transactions || [];
  const totalCarbonYTD = useMemo(() => txns.reduce((s, t) => s + (t.carbon_kg || 0), 0), [txns]);
  const dailyAvg = txns.length > 0 ? (totalCarbonYTD / Math.max(1, new Set(txns.map(t => (t.date || '').slice(0, 10))).size)) : 0;
  const budgetUsedPct = wallet.budget_kg ? (totalCarbonYTD / wallet.budget_kg * 100) : 0;
  const topCategory = useMemo(() => {
    const cats = {};
    txns.forEach(t => { cats[t.category || 'Other'] = (cats[t.category || 'Other'] || 0) + (t.carbon_kg || 0); });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : 'N/A';
  }, [txns]);
  const carbonPerDollar = useMemo(() => {
    const totalSpend = txns.reduce((s, t) => s + (t.amount || 0), 0);
    return totalSpend > 0 ? (totalCarbonYTD / totalSpend).toFixed(3) : '0.000';
  }, [txns, totalCarbonYTD]);
  const bestMonth = useMemo(() => {
    const months = {};
    txns.forEach(t => { const m = (t.date || '').slice(0, 7); months[m] = (months[m] || 0) + (t.carbon_kg || 0); });
    const sorted = Object.entries(months).sort((a, b) => a[1] - b[1]);
    return sorted[0] ? sorted[0][0] : 'N/A';
  }, [txns]);
  const carbonSaved = useMemo(() => txns.reduce((s, t) => s + (t.saved_kg || 0), 0), [txns]);
  const treesToOffset = totalCarbonYTD > 0 ? Math.ceil(totalCarbonYTD / 22) : 0;
  const carbonScore = Math.max(0, Math.min(100, Math.round(100 - budgetUsedPct)));
  const streak = useMemo(() => {
    if (!txns.length) return 0;
    const dates = [...new Set(txns.map(t => (t.date || '').slice(0, 10)))].sort().reverse();
    let s = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diff = Math.round((today - d) / 86400000);
      if (diff <= i + 1) s++; else break;
    }
    return s;
  }, [txns]);

  /* ── Monthly trend ─────────────────────────────────────────────── */
  const monthlyData = useMemo(() => {
    const months = {};
    txns.forEach(t => { const m = (t.date || '').slice(0, 7); months[m] = (months[m] || 0) + (t.carbon_kg || 0); });
    return Object.entries(months).sort().map(([m, v]) => ({ month: m, carbon_kg: Math.round(v), budget: Math.round((wallet.budget_kg || 2300) / 12) }));
  }, [txns, wallet.budget_kg]);

  /* ── Category pie ──────────────────────────────────────────────── */
  const categoryData = useMemo(() => {
    const cats = {};
    txns.forEach(t => { cats[t.category || 'Other'] = (cats[t.category || 'Other'] || 0) + (t.carbon_kg || 0); });
    return Object.entries(cats).map(([k, v]) => ({ name: k, value: Math.round(v) })).sort((a, b) => b.value - a.value);
  }, [txns]);

  /* ── Tip of the day ────────────────────────────────────────────── */
  const tipOfDay = CARBON_TIPS[new Date().getDate() % CARBON_TIPS.length];

  /* ── Rotating fact ─────────────────────────────────────────────── */
  const [factIdx, setFactIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFactIdx(p => (p + 1) % CARBON_FACTS.length), 8000);
    return () => clearInterval(t);
  }, []);

  /* ── Quick actions ─────────────────────────────────────────────── */
  const [quickSearch, setQuickSearch] = useState('');
  const [quickItem, setQuickItem] = useState('');
  const [quickCarbon, setQuickCarbon] = useState('');
  const [quickReceipt, setQuickReceipt] = useState('');

  const handleQuickLog = useCallback(() => {
    if (!quickItem || !quickCarbon) return;
    const existing = readLS(LS_WALLET, { transactions: [], balance_kg: 0, budget_kg: 2300 });
    existing.transactions.push({ item: quickItem, carbon_kg: parseFloat(quickCarbon), date: new Date().toISOString(), category: 'Quick Log' });
    existing.balance_kg = (existing.balance_kg || 0) + parseFloat(quickCarbon);
    localStorage.setItem(LS_WALLET, JSON.stringify(existing));
    setQuickItem(''); setQuickCarbon('');
  }, [quickItem, quickCarbon]);

  /* ── Transition recommendations ────────────────────────────────── */
  const recommendations = [
    { from: 'Beef burgers 3x/week', to: 'Plant-based burgers', save_kg: 450, save_pct: 76 },
    { from: 'Daily car commute (20km)', to: 'Cycle + train 3 days/wk', save_kg: 655, save_pct: 60 },
    { from: '2 fast-fashion items/month', to: 'Second-hand clothing', save_kg: 240, save_pct: 80 },
  ];

  /* ── Exports ───────────────────────────────────────────────────── */
  const handleExportCSV = useCallback(() => {
    const rows = txns.map(t => ({ Date: t.date, Item: t.item || t.description || '', Carbon_kg: t.carbon_kg, Category: t.category || '', Amount: t.amount || '' }));
    if (!rows.length) { rows.push({ Date: '', Item: 'No data', Carbon_kg: 0, Category: '', Amount: '' }); }
    downloadCSV(rows, 'personal_carbon_report.csv');
  }, [txns]);

  const handleExportJSON = useCallback(() => {
    downloadJSON({ score: carbonScore, totalCarbonYTD, dailyAvg, streak, topCategory, treesToOffset, country: config.country, generatedAt: new Date().toISOString() }, 'carbon_score.json');
  }, [carbonScore, totalCarbonYTD, dailyAvg, streak, topCategory, treesToOffset, config.country]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '32px 40px 60px' }}>

      {/* ── 1. Hero Header ───────────────────────────────────────────── */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${T.sage} 0%, ${T.sageL} 50%, ${T.gold} 100%)`, color: '#fff', textAlign: 'center', padding: '56px 40px' }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: '0 0 12px 0' }}>Your Personal Carbon Intelligence</h1>
        <p style={{ fontSize: 16, opacity: 0.9, margin: '0 auto', maxWidth: 560 }}>
          Understand, track, and reduce your carbon footprint. Every purchase tells a climate story.
        </p>
      </div>

      {/* ── 2. Module Cards ──────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <h2 style={sectionTitle}>Explore Modules</h2>
        <p style={sectionSub}>Five tools to understand and manage your personal carbon impact.</p>
        <div style={grid(5, 16)}>
          {MODULE_CARDS.map(m => (
            <div key={m.key} onClick={() => nav(m.path)} style={{ background: T.surfaceH, borderRadius: 12, padding: 22, cursor: 'pointer', transition: 'box-shadow 0.2s', border: `1px solid ${T.borderL}` }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: m.color, opacity: 0.15, marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Personal Dashboard (if wallet has data) ────────────────── */}
      {hasData && (
        <div style={card}>
          <h2 style={sectionTitle}>Personal Dashboard</h2>
          <p style={sectionSub}>Your carbon snapshot based on {txns.length} logged transactions.</p>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {/* Carbon balance gauge */}
            <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
              <div style={{ width: 160, height: 160, borderRadius: '50%', border: `8px solid ${budgetUsedPct > 100 ? T.red : budgetUsedPct > 75 ? T.amber : T.green}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{fmt(totalCarbonYTD, 0)}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>kg CO2e YTD</div>
              </div>
              <div style={{ fontSize: 12, color: T.textMut, marginTop: 8 }}>{budgetUsedPct.toFixed(0)}% of annual budget</div>
            </div>
            {/* Quick stats */}
            <div style={{ flex: 1, ...grid(3, 12) }}>
              <div style={kpiBox}><div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{dailyAvg.toFixed(1)} kg</div><div style={{ fontSize: 12, color: T.textSec }}>Daily Average</div></div>
              <div style={kpiBox}><div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{topCategory}</div><div style={{ fontSize: 12, color: T.textSec }}>Top Category</div></div>
              <div style={kpiBox}><div style={{ fontSize: 22, fontWeight: 800, color: carbonScore >= 70 ? T.green : carbonScore >= 40 ? T.amber : T.red }}>{carbonScore}</div><div style={{ fontSize: 12, color: T.textSec }}>Carbon Score</div></div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. 12 KPI Cards ──────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Your Carbon KPIs</h2>
        <p style={sectionSub}>{hasData ? 'Based on your logged data.' : 'Start logging to see your personalized metrics.'}</p>
        <div style={grid(4, 14)}>
          {[
            { label: 'Total Carbon (YTD)', value: `${fmt(totalCarbonYTD, 0)} kg`, color: T.navy },
            { label: 'Daily Average', value: `${dailyAvg.toFixed(1)} kg`, color: T.navyL },
            { label: 'Budget Status', value: `${budgetUsedPct.toFixed(0)}%`, color: budgetUsedPct > 100 ? T.red : T.green },
            { label: 'Transactions', value: txns.length, color: T.navy },
            { label: 'Top Category', value: topCategory, color: T.gold },
            { label: 'Carbon/Dollar', value: `${carbonPerDollar} kg/$`, color: T.navyL },
            { label: 'Best Month', value: bestMonth, color: T.sage },
            { label: 'Carbon Saved', value: `${fmt(carbonSaved, 0)} kg`, color: T.green },
            { label: 'Trees to Offset', value: treesToOffset, color: T.sage },
            { label: 'Carbon Score', value: carbonScore, color: carbonScore >= 70 ? T.green : T.amber },
            { label: 'Streak', value: `${streak} days`, color: T.gold },
            { label: 'Wallet Balance', value: `${fmt(wallet.balance_kg || 0, 0)} kg`, color: T.navy },
          ].map((k, i) => (
            <div key={i} style={kpiBox}>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Quick Actions ─────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Quick Actions</h2>
        <div style={grid(3, 20)}>
          {/* Calculate a product */}
          <div style={{ background: T.surfaceH, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>Calculate a Product</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={quickSearch} onChange={e => setQuickSearch(e.target.value)} placeholder="Search product or activity..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font }} />
              <button onClick={() => nav(`/carbon-calculator?q=${encodeURIComponent(quickSearch)}`)} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Go</button>
            </div>
          </div>
          {/* Log a purchase */}
          <div style={{ background: T.surfaceH, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>Log a Purchase</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={quickItem} onChange={e => setQuickItem(e.target.value)} placeholder="Item name" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font }} />
              <input value={quickCarbon} onChange={e => setQuickCarbon(e.target.value)} placeholder="kg CO2" type="number" style={{ width: 80, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font }} />
            </div>
            <button onClick={handleQuickLog} style={{ ...btnPrimary, width: '100%', padding: '8px 16px', fontSize: 13 }}>Log</button>
          </div>
          {/* Parse receipt */}
          <div style={{ background: T.surfaceH, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>Parse Receipt</div>
            <textarea value={quickReceipt} onChange={e => setQuickReceipt(e.target.value)} placeholder="Paste receipt text..." rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, resize: 'none', boxSizing: 'border-box' }} />
            <button onClick={() => nav(`/carbon-invoice-parser?text=${encodeURIComponent(quickReceipt)}`)} style={{ ...btnPrimary, width: '100%', padding: '8px 16px', fontSize: 13, marginTop: 8 }}>Parse</button>
          </div>
        </div>
      </div>

      {/* ── 6. Carbon Tip of the Day ──────────────────────────────────── */}
      <div style={{ ...card, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>T</div>
          <div>
            <div style={{ fontWeight: 700, color: T.green, fontSize: 14, marginBottom: 4 }}>Carbon Tip of the Day</div>
            <div style={{ fontSize: 14, color: T.navy, lineHeight: 1.5 }}>{tipOfDay}</div>
          </div>
        </div>
      </div>

      {/* ── 7. Recent Activity Feed ──────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Recent Activity</h2>
        <p style={sectionSub}>Last 10 wallet transactions and receipt parses.</p>
        {txns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>No transactions yet. Use Quick Actions above to start logging.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr>{['Date', 'Item', 'Category', 'Carbon (kg)', 'Amount'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {txns.slice(-10).reverse().map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : '#fff' }}>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec }}>{(t.date || '').slice(0, 10)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: T.navy, fontWeight: 600 }}>{t.item || t.description || '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec }}>{t.category || '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: T.navy }}>{(t.carbon_kg || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec }}>{t.amount ? `$${t.amount}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 8. Monthly Progress Chart ────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Monthly Progress</h2>
        <p style={sectionSub}>Your carbon footprint month-by-month with budget line.</p>
        {monthlyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>Start logging to see monthly trends.</div>
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Area type="monotone" dataKey="carbon_kg" fill={T.navyL} fillOpacity={0.15} stroke={T.navy} strokeWidth={2} name="Carbon (kg)" />
                <Area type="monotone" dataKey="budget" fill="transparent" stroke={T.green} strokeWidth={2} strokeDasharray="6 4" name="Monthly Budget" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 9. Category Distribution PieChart ────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Category Distribution</h2>
        <p style={sectionSub}>Where your carbon goes by spending category.</p>
        {categoryData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>No category data yet.</div>
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value} kg`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `${v} kg`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 10. Transition Opportunities ──────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Transition Opportunities</h2>
        <p style={sectionSub}>Top 3 personalized recommendations to lower your footprint.</p>
        <div style={grid(3, 16)}>
          {recommendations.map((r, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 22 }}>
              <div style={{ fontSize: 13, color: T.red, fontWeight: 600, marginBottom: 6 }}>Switch from:</div>
              <div style={{ fontSize: 14, color: T.navy, fontWeight: 600, marginBottom: 12 }}>{r.from}</div>
              <div style={{ fontSize: 13, color: T.green, fontWeight: 600, marginBottom: 6 }}>Switch to:</div>
              <div style={{ fontSize: 14, color: T.navy, fontWeight: 600, marginBottom: 12 }}>{r.to}</div>
              <div style={{ height: 1, background: T.borderL, margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ ...badge('#f0fdf4', T.green) }}>Save {r.save_kg} kg/yr</span>
                <span style={{ ...badge('#f0fdf4', T.green) }}>-{r.save_pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 11. Community Leaderboard ─────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Community Leaderboard</h2>
        <p style={sectionSub}>See how you compare with the community (simulated benchmark).</p>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
          <thead>
            <tr>{['Rank', 'User', 'Carbon Score', 'Streak (days)'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {COMMUNITY_LEADERBOARD.map((u, i) => (
              <tr key={i} style={{ background: u.isUser ? '#eff6ff' : (i % 2 === 0 ? T.surfaceH : '#fff') }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: u.rank <= 3 ? T.gold : T.textSec, fontSize: 16 }}>{u.rank}</td>
                <td style={{ padding: '8px 12px', fontSize: 14, color: T.navy, fontWeight: u.isUser ? 800 : 600 }}>{u.name}{u.isUser ? ' (you)' : ''}</td>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 100, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${u.score}%`, height: '100%', background: u.score >= 80 ? T.green : u.score >= 60 ? T.amber : T.red, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{u.score}</span>
                  </div>
                </td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec }}>{u.streak} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 12. Carbon Facts (rotating) ───────────────────────────────── */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginBottom: 8 }}>Did You Know?</div>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {CARBON_FACTS[factIdx]}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {CARBON_FACTS.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === factIdx ? T.gold : 'rgba(255,255,255,0.3)', cursor: 'pointer' }} onClick={() => setFactIdx(i)} />
          ))}
        </div>
      </div>

      {/* ── 13. Getting Started Guide ─────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Getting Started</h2>
        <p style={sectionSub}>New here? Follow these 4 steps to start your carbon intelligence journey.</p>
        <div style={grid(4, 16)}>
          {ONBOARDING_STEPS.map(s => (
            <div key={s.step} style={{ background: T.surfaceH, borderRadius: 12, padding: 22, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.navy, color: '#fff', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{s.step}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Milestones & Achievements ────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Milestones & Achievements</h2>
        <p style={sectionSub}>Track your progress and unlock achievements as you log more carbon data.</p>
        <div style={grid(5, 14)}>
          {CARBON_MILESTONES.map((m, i) => {
            const unlocked = totalCarbonYTD >= m.threshold;
            return (
              <div key={i} style={{ background: unlocked ? '#f0fdf4' : T.surfaceH, borderRadius: 12, padding: 18, textAlign: 'center', opacity: unlocked ? 1 : 0.55, border: unlocked ? `2px solid ${T.green}` : `1px solid ${T.borderL}` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: unlocked ? T.green : T.textMut, color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  {unlocked ? '\u2713' : i + 1}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{m.desc}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>{m.threshold.toLocaleString()} kg threshold</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Weekly Challenges ─────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Weekly Carbon Challenges</h2>
        <p style={sectionSub}>Take on weekly challenges to reduce your carbon footprint step by step.</p>
        <div style={grid(4, 14)}>
          {WEEKLY_CHALLENGES.map((c, i) => (
            <div key={i} style={{ background: i === 0 ? '#eff6ff' : T.surfaceH, borderRadius: 12, padding: 20, border: i === 0 ? `2px solid ${T.navyL}` : `1px solid ${T.borderL}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ ...badge(i === 0 ? '#dbeafe' : T.surfaceH, T.navy), fontSize: 11 }}>{c.week}</span>
                <span style={{ ...badge(c.difficulty === 'Hard' ? '#fef2f2' : c.difficulty === 'Medium' ? '#fffbeb' : '#f0fdf4', c.difficulty === 'Hard' ? T.red : c.difficulty === 'Medium' ? T.amber : T.green) }}>{c.difficulty}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.challenge}</div>
              <div style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>Potential saving: {c.target_save_kg} kg CO2e</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Impact Comparisons ────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Impact Scale</h2>
        <p style={sectionSub}>Putting carbon numbers into perspective with real-world equivalents.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {IMPACT_COMPARISONS.map((ic, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: i % 2 === 0 ? T.surfaceH : '#fff', borderRadius: 10 }}>
              <div style={{ minWidth: 100, textAlign: 'right' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{ic.amount_kg >= 1000 ? `${(ic.amount_kg/1000).toFixed(1)}t` : `${ic.amount_kg} kg`}</span>
              </div>
              <div style={{ width: 2, height: 24, background: T.border, flexShrink: 0 }} />
              <div style={{ fontSize: 14, color: T.textSec }}>{ic.equivalent}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Carbon Glossary ───────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Glossary</h2>
        <p style={sectionSub}>Key terms to help you understand carbon metrics and climate language.</p>
        <div style={grid(2, 16)}>
          {CARBON_GLOSSARY.map((g, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{g.term}</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{g.definition}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Carbon Score Breakdown ────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Your Carbon Score Breakdown</h2>
        <p style={sectionSub}>How your Carbon Score of <strong style={{ color: carbonScore >= 70 ? T.green : carbonScore >= 40 ? T.amber : T.red }}>{carbonScore}/100</strong> is calculated.</p>
        <div style={grid(4, 14)}>
          {[
            { factor: 'Budget Adherence', weight: 40, score: Math.max(0, Math.min(100, 100 - budgetUsedPct)), desc: 'Staying within your annual carbon budget' },
            { factor: 'Consistency', weight: 20, score: Math.min(100, streak * 10), desc: 'Daily logging streak' },
            { factor: 'Category Diversity', weight: 20, score: Math.min(100, categoryData.length * 20), desc: 'Tracking across multiple categories' },
            { factor: 'Improvement Trend', weight: 20, score: carbonSaved > 0 ? Math.min(100, carbonSaved / 10) : 50, desc: 'Reducing carbon over time' },
          ].map((f, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{f.factor}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${f.score}%`, height: '100%', background: f.score >= 70 ? T.green : f.score >= 40 ? T.amber : T.red, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{f.score.toFixed(0)}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>{f.desc}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Weight: {f.weight}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Platform Statistics ───────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Platform at a Glance</h2>
        <p style={sectionSub}>Aggregated statistics from the consumer carbon intelligence platform.</p>
        <div style={grid(4, 14)}>
          {[
            { label: 'Active Users', value: '12,847', color: T.navy },
            { label: 'Carbon Tracked (t)', value: '28,450', color: T.sage },
            { label: 'Receipts Parsed', value: '156,300', color: T.gold },
            { label: 'Trees Planted Equiv.', value: '1,293', color: T.green },
            { label: 'Avg Score', value: '68', color: T.navyL },
            { label: 'Top Challenge', value: 'Meat-Free', color: T.amber },
            { label: 'Countries', value: '42', color: T.navy },
            { label: 'Carbon Saved (t)', value: '4,820', color: T.green },
          ].map((s, i) => (
            <div key={i} style={kpiBox}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Carbon Budget Planner ────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Budget Planner</h2>
        <p style={sectionSub}>Plan your monthly carbon spending across categories to stay within the 1.5C budget.</p>
        <div style={grid(3, 16)}>
          {[
            { category: 'Transport', suggested_kg: 48, icon: 'car', desc: 'Commute, errands, travel' },
            { category: 'Food & Drink', suggested_kg: 38, icon: 'food', desc: 'Groceries, eating out, drinks' },
            { category: 'Home Energy', suggested_kg: 50, icon: 'home', desc: 'Heating, cooling, electricity' },
            { category: 'Shopping', suggested_kg: 25, icon: 'bag', desc: 'Clothes, electronics, goods' },
            { category: 'Services', suggested_kg: 20, icon: 'wrench', desc: 'Healthcare, finance, digital' },
            { category: 'Buffer', suggested_kg: 11, icon: 'shield', desc: 'Unexpected emissions' },
          ].map((c, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{c.category}</div>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>{c.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: T.sage }}>{c.suggested_kg} kg</span>
                <span style={{ fontSize: 12, color: T.textMut }}>per month</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ width: `${(c.suggested_kg / 192) * 100}%`, height: '100%', background: T.sage, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4, textAlign: 'right' }}>{((c.suggested_kg / 192) * 100).toFixed(0)}% of monthly budget</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, background: T.surfaceH, borderRadius: 10, fontSize: 13, color: T.textSec }}>
          Monthly budget: <strong style={{ color: T.navy }}>192 kg CO2e</strong> (2,300 kg / 12 months for a 1.5C pathway). Adjust based on your country and lifestyle.
        </div>
      </div>

      {/* ── Seasonal Carbon Insights ──────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Seasonal Carbon Insights</h2>
        <p style={sectionSub}>Carbon footprints vary by season. Winter heating and summer cooling are major drivers.</p>
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={[
              { season: 'Spring (Mar-May)', home: 35, transport: 50, food: 38, goods: 20 },
              { season: 'Summer (Jun-Aug)', home: 45, transport: 55, food: 35, goods: 22 },
              { season: 'Autumn (Sep-Nov)', home: 40, transport: 48, food: 40, goods: 30 },
              { season: 'Winter (Dec-Feb)', home: 70, transport: 42, food: 42, goods: 35 },
            ]} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="season" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend />
              <Bar dataKey="home" stackId="a" fill={T.navy} name="Home Energy (kg)" />
              <Bar dataKey="transport" stackId="a" fill={T.navyL} name="Transport (kg)" />
              <Bar dataKey="food" stackId="a" fill={T.gold} name="Food (kg)" />
              <Bar dataKey="goods" stackId="a" fill={T.sage} name="Goods (kg)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Offset Marketplace Preview ────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Offset Options</h2>
        <p style={sectionSub}>Understand offset pricing and quality tiers. Offsets are a last resort after reducing emissions.</p>
        <div style={grid(3, 16)}>
          {[
            { type: 'Tree Planting', price_per_t: 8, quality: 'Basic', permanence: '20-50 years', rating: 2 },
            { type: 'Renewable Energy Credits', price_per_t: 15, quality: 'Standard', permanence: 'N/A (avoidance)', rating: 3 },
            { type: 'Verified Carbon Standard (VCS)', price_per_t: 25, quality: 'Good', permanence: '30-100 years', rating: 4 },
            { type: 'Gold Standard Projects', price_per_t: 40, quality: 'High', permanence: '50+ years', rating: 5 },
            { type: 'Direct Air Capture', price_per_t: 600, quality: 'Premium', permanence: '1000+ years', rating: 5 },
            { type: 'Enhanced Weathering', price_per_t: 150, quality: 'High', permanence: '10,000+ years', rating: 4 },
          ].map((o, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{o.type}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: T.textSec }}>Price</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.gold }}>${o.price_per_t}/tonne</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: T.textSec }}>Quality</span>
                <span style={{ ...badge(o.rating >= 4 ? '#f0fdf4' : '#fffbeb', o.rating >= 4 ? T.green : T.amber) }}>{o.quality}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: T.textSec }}>Permanence</span>
                <span style={{ fontSize: 13, color: T.navy, fontWeight: 600 }}>{o.permanence}</span>
              </div>
              <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} style={{ width: 16, height: 4, borderRadius: 2, background: j < o.rating ? T.green : '#e5e7eb' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: 12, background: '#fffbeb', borderRadius: 8, fontSize: 13, color: T.amber, fontWeight: 600 }}>
          Important: Offsets should only supplement genuine emission reductions. Reduce first, offset what remains.
        </div>
      </div>

      {/* ── Frequently Asked Questions ────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Frequently Asked Questions</h2>
        <p style={sectionSub}>Common questions about personal carbon tracking.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'How accurate are the carbon estimates?', a: 'We use peer-reviewed emission factors from DEFRA, IPCC, and lifecycle databases. Individual estimates may vary by 10-20% depending on local grid mix and supply chains.' },
            { q: 'What is a carbon budget?', a: 'The maximum CO2 each person can emit annually to limit warming to 1.5C. Currently about 2.3 tonnes per person per year.' },
            { q: 'Is my data shared with anyone?', a: 'No. All data is stored in your browser localStorage. Nothing is sent to any server.' },
            { q: 'How do I improve my Carbon Score?', a: 'Log consistently, stay within budget, track multiple categories, and show improvement over time.' },
            { q: 'Can I export my data?', a: 'Yes! Use the export buttons to download CSV reports or JSON data at any time.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 14. Data Privacy Notice ───────────────────────────────────── */}
      <div style={{ ...card, background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: T.navyL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>P</div>
          <div>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 4 }}>Data Privacy</div>
            <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5 }}>
              Your data stays on your device (localStorage). We do not track, collect, or share your carbon data. All calculations happen locally in your browser.
            </div>
          </div>
        </div>
      </div>

      {/* ── 15. Browser Extension Teaser ──────────────────────────────── */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${T.gold}22, ${T.goldL}22)`, borderColor: T.gold }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...badge(`${T.gold}33`, T.gold), marginBottom: 10 }}>Coming Soon</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Browser Extension</div>
            <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5 }}>
              See the carbon cost of your Amazon, Flipkart, or any e-commerce cart in real-time. Get carbon labels on every product as you browse.
            </div>
          </div>
          <div style={{ width: 120, height: 80, background: T.surfaceH, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            <span role="img" aria-label="extension" style={{ filter: 'grayscale(0.3)' }}>&#128268;</span>
          </div>
        </div>
      </div>

      {/* ── Carbon Savings Calculator ────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Savings Potential</h2>
        <p style={sectionSub}>If you adopted all three recommended transitions, here's the total annual impact.</p>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ flex: 1, background: T.surfaceH, borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Total Carbon Saved</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: T.green }}>{recommendations.reduce((s, r) => s + r.save_kg, 0)} kg</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>per year from 3 simple swaps</div>
          </div>
          <div style={{ flex: 1, background: T.surfaceH, borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Equivalent Trees</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: T.sage }}>{Math.ceil(recommendations.reduce((s, r) => s + r.save_kg, 0) / 22)}</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>trees absorbing CO2 for a year</div>
          </div>
          <div style={{ flex: 1, background: T.surfaceH, borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Money Saved at $100/t</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: T.gold }}>${(recommendations.reduce((s, r) => s + r.save_kg, 0) * 0.1).toFixed(0)}</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>in avoided carbon costs</div>
          </div>
        </div>
      </div>

      {/* ── Data Health Check ─────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Data Health Check</h2>
        <p style={sectionSub}>How complete and useful is your carbon tracking data?</p>
        <div style={grid(4, 14)}>
          {[
            { metric: 'Wallet Transactions', value: txns.length, target: 50, unit: 'entries' },
            { metric: 'Receipts Parsed', value: (receipts.parsed || []).length, target: 20, unit: 'receipts' },
            { metric: 'Cart Items', value: (cart.items || []).length, target: 10, unit: 'items' },
            { metric: 'Categories Tracked', value: categoryData.length, target: 5, unit: 'categories' },
          ].map((d, i) => {
            const pct = Math.min(100, (d.value / d.target) * 100);
            return (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{d.metric}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: pct >= 100 ? T.green : pct >= 50 ? T.amber : T.red }}>{d.value}</div>
                <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, margin: '8px 0', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? T.green : pct >= 50 ? T.amber : T.red, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>Target: {d.target} {d.unit}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 16. Export & Navigation ───────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Export & Navigate</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={handleExportCSV} style={btnPrimary}>Export Personal Report (CSV)</button>
          <button onClick={handleExportJSON} style={btnOutline}>Export Carbon Score (JSON)</button>
          <button onClick={handlePrint} style={btnOutline}>Print Dashboard</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Navigate Sprint Z Modules</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Carbon Calculator', path: '/carbon-calculator' },
            { label: 'Carbon Wallet', path: '/carbon-wallet' },
            { label: 'Invoice Parser', path: '/carbon-invoice-parser' },
            { label: 'Spending Analyzer', path: '/carbon-spending-analyzer' },
            { label: 'Carbon Economy', path: '/carbon-economy' },
            { label: 'Product Anatomy', path: '/product-anatomy' },
            { label: 'EPD Database', path: '/epd-database' },
          ].map(n => (
            <button key={n.path} onClick={() => nav(n.path)} style={{ ...btnOutline, fontSize: 13, padding: '8px 16px' }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
