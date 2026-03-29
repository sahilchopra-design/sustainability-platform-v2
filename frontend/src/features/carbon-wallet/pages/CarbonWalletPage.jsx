import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, Line, ComposedChart, RadialBarChart, RadialBar } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ─── Carbon Budget Framework ─── */
const CARBON_BUDGETS = {
  paris_1_5: { annual_tonnes:2.3, daily_kg:6.3, label:'1.5\°C pathway', color:'#16a34a', description:'To limit warming to 1.5\°C, each person on Earth gets 2.3 tonnes CO\₂e per year' },
  paris_2_0: { annual_tonnes:4.0, daily_kg:11.0, label:'2\°C pathway', color:'#d97706' },
  global_avg: { annual_tonnes:4.7, daily_kg:12.9, label:'Global average', color:'#6b7280' },
  india_avg: { annual_tonnes:1.9, daily_kg:5.2, label:'India average', color:'#2563eb' },
  usa_avg: { annual_tonnes:15.5, daily_kg:42.5, label:'USA average', color:'#dc2626' },
  eu_avg: { annual_tonnes:6.8, daily_kg:18.6, label:'EU average', color:'#7c3aed' },
};

/* ─── Spending Category Carbon Intensity ─── */
const SPENDING_CARBON_INTENSITY = {
  groceries: { carbon_per_usd:0.75, icon:'\🛒', category:'Food', mcc:['5411','5422','5441','5451','5462'] },
  restaurants: { carbon_per_usd:0.68, icon:'\🍽\️', category:'Food', mcc:['5812','5813','5814'] },
  fuel: { carbon_per_usd:2.31, icon:'\⛽', category:'Transport', mcc:['5541','5542'] },
  public_transport: { carbon_per_usd:0.25, icon:'\🚇', category:'Transport', mcc:['4111','4112','4131'] },
  airlines: { carbon_per_usd:1.85, icon:'\✈\️', category:'Transport', mcc:['3000-3350','4511'] },
  electricity: { carbon_per_usd:1.42, icon:'\⚡', category:'Home', mcc:['4900'] },
  clothing: { carbon_per_usd:0.45, icon:'\👕', category:'Fashion', mcc:['5611','5621','5631','5641','5651','5661'] },
  electronics: { carbon_per_usd:0.35, icon:'\📱', category:'Electronics', mcc:['5732','5734','5946'] },
  home_improvement: { carbon_per_usd:0.55, icon:'\🏠', category:'Home', mcc:['5200','5211','5231'] },
  healthcare: { carbon_per_usd:0.22, icon:'\🏥', category:'Services', mcc:['8011','8021','8031'] },
  entertainment: { carbon_per_usd:0.15, icon:'\🎬', category:'Services', mcc:['7832','7841','7922','7929','7941'] },
  subscriptions: { carbon_per_usd:0.08, icon:'\📺', category:'Digital', mcc:['4899','5815','5816','5818'] },
};

const CATEGORY_COLORS = { Food:'#dc2626', Transport:'#2563eb', Home:'#16a34a', Fashion:'#7c3aed', Electronics:'#0891b2', Services:'#d97706', Digital:'#6366f1' };
const PIE_COLORS = ['#dc2626','#2563eb','#16a34a','#7c3aed','#0891b2','#d97706','#6366f1','#be185d'];

const OFFSET_PRICE_PER_TONNE = 15; // USD

const BADGES = [
  { id:'first_week', name:'First Week Under Budget', icon:'\🌟', check: (txs, cfg) => { const week = txs.filter(t => Date.now() - new Date(t.date).getTime() < 7*86400000); return week.length > 0 && week.reduce((s,t) => s + t.carbon_kg, 0) < cfg.daily_kg * 7; }},
  { id:'100_txns', name:'100 Transactions Logged', icon:'\💯', check: (txs) => txs.length >= 100 },
  { id:'50_txns', name:'50 Transactions Logged', icon:'\🏅', check: (txs) => txs.length >= 50 },
  { id:'10_txns', name:'10 Transactions Logged', icon:'\🏃', check: (txs) => txs.length >= 10 },
  { id:'low_carbon_day', name:'Ultra-Low Carbon Day (<2 kg)', icon:'\🌿', check: (txs) => { const today = new Date().toISOString().slice(0,10); return txs.filter(t => t.date.slice(0,10) === today).reduce((s,t) => s + t.carbon_kg, 0) < 2; }},
  { id:'no_transport', name:'Car-Free Week', icon:'\🚲', check: (txs) => { const week = txs.filter(t => Date.now() - new Date(t.date).getTime() < 7*86400000); return week.length > 0 && !week.some(t => ['fuel','airlines'].includes(t.category)); }},
  { id:'first_txn', name:'Carbon Tracker Activated', icon:'\🚀', check: (txs) => txs.length >= 1 },
];

const SAVINGS_TIPS = [
  { tip:'Switch cow milk to oat milk', saving_kg:2.25, unit:'per litre', icon:'\🥛' },
  { tip:'Take train instead of short-haul flight', saving_kg:115, unit:'per 1000km trip', icon:'\🚂' },
  { tip:'Buy second-hand clothing', saving_kg:15, unit:'per item avg', icon:'\👕' },
  { tip:'Choose refurbished smartphone', saving_kg:63, unit:'per device', icon:'\📱' },
  { tip:'Cold wash your laundry', saving_kg:0.4, unit:'per load', icon:'\🧺' },
  { tip:'Replace beef with plant-based', saving_kg:25.1, unit:'per kg', icon:'\🥗' },
  { tip:'Use LED instead of incandescent', saving_kg:22.5, unit:'per bulb lifetime', icon:'\💡' },
  { tip:'Cycle 5km commute vs drive', saving_kg:1.03, unit:'per trip', icon:'\🚴' },
];

function getWallet() { try { return JSON.parse(localStorage.getItem('ra_carbon_wallet_v1') || '[]'); } catch { return []; } }
function saveWallet(w) { localStorage.setItem('ra_carbon_wallet_v1', JSON.stringify(w)); }
function getConfig() { try { return JSON.parse(localStorage.getItem('ra_carbon_wallet_config_v1') || '{}'); } catch { return {}; } }
function saveConfig(c) { localStorage.setItem('ra_carbon_wallet_config_v1', JSON.stringify(c)); }

function generateDemoTransactions() {
  const cats = Object.keys(SPENDING_CARBON_INTENSITY);
  const descs = { groceries:['Whole Foods groceries','Trader Joe\'s run','Farmers market','Weekly shop'], restaurants:['Lunch at cafe','Dinner out','Pizza delivery','Sushi takeaway'], fuel:['Gas station fill-up','Shell petrol','BP diesel'], public_transport:['Metro pass','Bus fare','Train ticket'], airlines:['Flight to Mumbai','Domestic flight','Weekend getaway flight'], electricity:['Monthly electricity bill','Quarterly power bill'], clothing:['New jeans','T-shirt purchase','Shoes online','Winter coat'], electronics:['USB-C cable','Earbuds','Phone case'], home_improvement:['Paint supplies','Light fixtures','Garden tools'], healthcare:['Doctor visit copay','Pharmacy'], entertainment:['Movie tickets','Concert','Museum visit'], subscriptions:['Netflix','Spotify','Cloud storage'] };
  const txns = [];
  for (let i = 0; i < 45; i++) {
    const cat = cats[Math.floor(sr(_sc++) * cats.length)];
    const info = SPENDING_CARBON_INTENSITY[cat];
    const amount = +(5 + sr(_sc++) * 120).toFixed(2);
    const daysAgo = Math.floor(sr(_sc++) * 180);
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    const descArr = descs[cat] || ['Purchase'];
    txns.push({
      id: `TXN-${Date.now()}-${i}`,
      date: d.toISOString(),
      description: descArr[Math.floor(sr(_sc++) * descArr.length)],
      amount_usd: amount,
      category: cat,
      carbon_kg: +(amount * info.carbon_per_usd).toFixed(1),
      method: ['manual','card_import','calculator'][Math.floor(sr(_sc++) * 3)],
      items: [],
      offset: false,
      notes: '',
    });
  }
  return txns.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function CarbonWalletPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState(() => { const w = getWallet(); return w.length > 0 ? w : generateDemoTransactions(); });
  const [config, setConfig] = useState(() => ({ budget: 'paris_1_5', country: 'India', ...getConfig() }));
  const [timeframe, setTimeframe] = useState('monthly');
  const [tab, setTab] = useState('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Form state
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fDesc, setFDesc] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fCategory, setFCategory] = useState('groceries');
  const [fCarbonOverride, setFCarbonOverride] = useState('');

  useEffect(() => { saveWallet(transactions); }, [transactions]);
  useEffect(() => { saveConfig(config); }, [config]);

  const budget = CARBON_BUDGETS[config.budget] || CARBON_BUDGETS.paris_1_5;

  /* ─── Computed metrics ─── */
  const now = new Date();
  const periodFilter = useCallback((t) => {
    const d = new Date(t.date);
    if (timeframe === 'daily') return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    if (timeframe === 'weekly') return (now - d) < 7 * 86400000;
    if (timeframe === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  }, [timeframe]);

  const periodTxns = useMemo(() => transactions.filter(periodFilter), [transactions, periodFilter]);
  const totalCarbon = useMemo(() => periodTxns.reduce((s, t) => s + t.carbon_kg, 0), [periodTxns]);
  const totalSpend = useMemo(() => periodTxns.reduce((s, t) => s + t.amount_usd, 0), [periodTxns]);
  const daysInPeriod = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : timeframe === 'monthly' ? 30 : 365;
  const dailyAvg = periodTxns.length > 0 ? totalCarbon / Math.max(daysInPeriod, 1) : 0;
  const periodBudget = budget.daily_kg * daysInPeriod;
  const budgetUsedPct = periodBudget > 0 ? (totalCarbon / periodBudget * 100) : 0;
  const budgetRemaining = Math.max(0, periodBudget - totalCarbon);
  const carbonPerUsd = totalSpend > 0 ? totalCarbon / totalSpend : 0;
  const treesNeeded = totalCarbon / 22;

  // Top category
  const catBreakdown = useMemo(() => {
    const map = {};
    periodTxns.forEach(t => {
      const info = SPENDING_CARBON_INTENSITY[t.category];
      const cat = info?.category || 'Other';
      if (!map[cat]) map[cat] = { name: cat, carbon: 0, spend: 0, count: 0 };
      map[cat].carbon += t.carbon_kg;
      map[cat].spend += t.amount_usd;
      map[cat].count++;
    });
    return Object.values(map).sort((a, b) => b.carbon - a.carbon);
  }, [periodTxns]);

  const topCategory = catBreakdown[0]?.name || 'N/A';

  // Streak calc
  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dayTotal = transactions.filter(t => t.date.slice(0, 10) === ds).reduce((s, t) => s + t.carbon_kg, 0);
      if (dayTotal > 0 && dayTotal <= budget.daily_kg) count++;
      else if (dayTotal > budget.daily_kg) break;
      else if (i > 0) break;
    }
    return count;
  }, [transactions, budget]);

  // Carbon score
  const carbonScore = useMemo(() => {
    let score = 50;
    if (budgetUsedPct < 80) score += 20;
    else if (budgetUsedPct < 100) score += 10;
    else score -= 10;
    if (streak > 7) score += 10;
    if (streak > 30) score += 10;
    if (carbonPerUsd < 0.5) score += 10;
    return Math.min(100, Math.max(0, Math.round(score)));
  }, [budgetUsedPct, streak, carbonPerUsd]);

  // Timeline data
  const timelineData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const thisYear = sorted.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
    const byMonth = {};
    thisYear.forEach(t => {
      const m = new Date(t.date).toLocaleString('default', { month: 'short' });
      if (!byMonth[m]) byMonth[m] = { month: m, carbon: 0, budget: budget.daily_kg * 30 };
      byMonth[m].carbon += t.carbon_kg;
    });
    return Object.values(byMonth);
  }, [transactions, budget]);

  // Monthly comparison
  const monthlyComparison = useMemo(() => {
    const map = {};
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() || (d.getFullYear() === now.getFullYear() - 1 && d.getMonth() >= now.getMonth());
    }).forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { key, label, carbon: 0 };
      map[key].carbon += t.carbon_kg;
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
  }, [transactions]);

  // Carbon intensity by category
  const intensityData = useMemo(() => {
    return Object.entries(SPENDING_CARBON_INTENSITY).map(([k, v]) => ({
      name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      intensity: v.carbon_per_usd,
      icon: v.icon,
    })).sort((a, b) => b.intensity - a.intensity);
  }, []);

  // Carbon Rich vs Lean
  const richLean = useMemo(() => {
    const withRatio = periodTxns.filter(t => t.amount_usd > 0).map(t => ({ ...t, ratio: t.carbon_kg / t.amount_usd }));
    const sorted = [...withRatio].sort((a, b) => b.ratio - a.ratio);
    return { rich: sorted.slice(0, 5), lean: sorted.slice(-5).reverse() };
  }, [periodTxns]);

  // Peer benchmark (simulated)
  const peerPercentile = useMemo(() => {
    const annualRate = totalCarbon / Math.max(daysInPeriod, 1) * 365;
    if (annualRate < 2.3) return 95;
    if (annualRate < 4.7) return 75;
    if (annualRate < 6.8) return 55;
    if (annualRate < 10) return 35;
    return 15;
  }, [totalCarbon, daysInPeriod]);

  // Earned badges
  const earnedBadges = useMemo(() => BADGES.filter(b => b.check(transactions, budget)), [transactions, budget]);

  // Annual summary
  const annualSummary = useMemo(() => {
    const yearTxns = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
    const total = yearTxns.reduce((s, t) => s + t.carbon_kg, 0);
    const byMonth = {};
    yearTxns.forEach(t => {
      const m = new Date(t.date).getMonth();
      byMonth[m] = (byMonth[m] || 0) + t.carbon_kg;
    });
    const months = Object.entries(byMonth);
    const best = months.length > 0 ? months.reduce((a, b) => a[1] < b[1] ? a : b) : null;
    const worst = months.length > 0 ? months.reduce((a, b) => a[1] > b[1] ? a : b) : null;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return { total, count: yearTxns.length, bestMonth: best ? monthNames[best[0]] : 'N/A', bestVal: best ? best[1].toFixed(1) : 0, worstMonth: worst ? monthNames[worst[0]] : 'N/A', worstVal: worst ? worst[1].toFixed(1) : 0 };
  }, [transactions]);

  /* ─── Actions ─── */
  const addTransaction = useCallback(() => {
    const cat = SPENDING_CARBON_INTENSITY[fCategory];
    const amt = parseFloat(fAmount) || 0;
    const carbon = fCarbonOverride ? parseFloat(fCarbonOverride) : +(amt * (cat?.carbon_per_usd || 0.5)).toFixed(1);
    const txn = { id: `TXN-${Date.now()}`, date: new Date(fDate).toISOString(), description: fDesc || 'Purchase', amount_usd: amt, category: fCategory, carbon_kg: carbon, method: 'manual', items: [], offset: false, notes: '' };
    setTransactions(prev => [txn, ...prev]);
    setFDesc(''); setFAmount(''); setFCarbonOverride(''); setShowAddForm(false);
  }, [fDate, fDesc, fAmount, fCategory, fCarbonOverride]);

  const deleteTransaction = useCallback((id) => setTransactions(prev => prev.filter(t => t.id !== id)), []);

  const importSpending = useCallback(() => {
    if (!importText.trim()) return;
    const lines = importText.trim().split('\n').filter(l => l.trim());
    const newTxns = [];
    lines.forEach(line => {
      const parts = line.split(/[,\t]+/).map(s => s.trim());
      if (parts.length >= 3) {
        const [dateStr, desc, amtStr] = parts;
        const amt = parseFloat(amtStr.replace(/[^0-9.-]/g, '')) || 0;
        let matchedCat = 'groceries';
        const descLower = desc.toLowerCase();
        if (descLower.match(/gas|fuel|petrol|shell|bp/)) matchedCat = 'fuel';
        else if (descLower.match(/uber|lyft|taxi|airline|flight/)) matchedCat = 'airlines';
        else if (descLower.match(/restaurant|cafe|pizza|sushi|mcdon|starbuck/)) matchedCat = 'restaurants';
        else if (descLower.match(/electric|power|utility/)) matchedCat = 'electricity';
        else if (descLower.match(/amazon|best buy|apple store/)) matchedCat = 'electronics';
        else if (descLower.match(/zara|h&m|nike|clothing|fashion/)) matchedCat = 'clothing';
        else if (descLower.match(/netflix|spotify|hulu|disney/)) matchedCat = 'subscriptions';
        else if (descLower.match(/metro|bus|train|transit/)) matchedCat = 'public_transport';
        else if (descLower.match(/hospital|pharmacy|doctor|medical/)) matchedCat = 'healthcare';
        const info = SPENDING_CARBON_INTENSITY[matchedCat];
        newTxns.push({
          id: `TXN-${Date.now()}-${sr(_sc++).toString(36).slice(2, 6)}`,
          date: new Date(dateStr).toISOString() || new Date().toISOString(),
          description: desc,
          amount_usd: amt,
          category: matchedCat,
          carbon_kg: +(amt * info.carbon_per_usd).toFixed(1),
          method: 'card_import',
          items: [],
          offset: false,
          notes: '',
        });
      }
    });
    if (newTxns.length > 0) {
      setTransactions(prev => [...newTxns, ...prev]);
      setImportText('');
      setShowImport(false);
      alert(`Imported ${newTxns.length} transactions!`);
    }
  }, [importText]);

  const exportCSV = useCallback(() => {
    const hdr = 'Date,Description,Amount (USD),Category,Carbon (kg CO2e),Method\n';
    const rows = transactions.map(t => `"${new Date(t.date).toLocaleDateString()}","${t.description}",${t.amount_usd},"${t.category}",${t.carbon_kg},"${t.method}"`).join('\n');
    const blob = new Blob([hdr + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'carbon_wallet_transactions.csv'; a.click(); URL.revokeObjectURL(url);
  }, [transactions]);

  const exportJSON = useCallback(() => {
    const report = { generated: new Date().toISOString(), budget: config.budget, annualSummary, transactions: transactions.length, totalCarbon: annualSummary.total };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'carbon_annual_report.json'; a.click(); URL.revokeObjectURL(url);
  }, [transactions, config, annualSummary]);

  const printPage = useCallback(() => window.print(), []);

  // Sorted transaction table
  const sortedTxns = useMemo(() => {
    const arr = [...periodTxns];
    arr.sort((a, b) => {
      let va, vb;
      if (sortCol === 'date') { va = new Date(a.date); vb = new Date(b.date); }
      else if (sortCol === 'carbon') { va = a.carbon_kg; vb = b.carbon_kg; }
      else if (sortCol === 'amount') { va = a.amount_usd; vb = b.amount_usd; }
      else { va = a[sortCol] || ''; vb = b[sortCol] || ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [periodTxns, sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ─── Styles ─── */
  const sPage = { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 80px' };
  const sContainer = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };
  const sCard = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const sInput = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, outline: 'none', background: '#fff' };
  const sBtn = (bg, c) => ({ padding: '10px 20px', borderRadius: 10, border: 'none', background: bg, color: c || '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: T.font });
  const sBtnSm = (bg, c) => ({ ...sBtn(bg, c), padding: '6px 14px', fontSize: 12 });
  const sBadge = (bg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: bg, color: '#fff', fontSize: 11, fontWeight: 700, marginRight: 6 });
  const sTab = (active) => ({ padding: '10px 20px', borderRadius: '10px 10px 0 0', border: 'none', background: active ? T.surface : T.surfaceH, color: active ? T.navy : T.textSec, fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer', fontFamily: T.font, borderBottom: active ? `3px solid ${T.gold}` : 'none' });
  const sGrid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 });
  const sKpi = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', textAlign: 'center' };

  const budgetColor = budgetUsedPct > 100 ? T.red : budgetUsedPct > 75 ? T.amber : T.green;

  return (
    <div style={sPage}>
      {/* 1. Carbon Balance Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, color: '#fff', padding: '40px 32px 32px' }}>
        <div style={sContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>💳 Your Carbon Balance</div>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{(totalCarbon / 1000).toFixed(2)} <span style={{ fontSize: 18, opacity: 0.7 }}>tonnes CO\₂e</span></div>
              <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : timeframe === 'monthly' ? 'This Month' : 'This Year'}
                {' \· '}Budget: {budget.label}
              </div>
            </div>
            {/* Gauge */}
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
                <circle cx="80" cy="80" r="70" fill="none" stroke={budgetColor} strokeWidth="12"
                  strokeDasharray={`${Math.min(budgetUsedPct, 100) / 100 * 440} 440`}
                  strokeLinecap="round" transform="rotate(-90 80 80)" style={{ transition: 'stroke-dasharray 0.8s' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{budgetUsedPct.toFixed(0)}%</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>budget used</div>
              </div>
            </div>
          </div>

          {/* 2. Timeframe Toggle */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {['daily', 'weekly', 'monthly', 'annual'].map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', background: timeframe === tf ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: timeframe === tf ? 700 : 400, fontFamily: T.font }}>
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
            <select value={config.budget} onChange={e => setConfig(prev => ({ ...prev, budget: e.target.value }))} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontFamily: T.font }}>
              {Object.entries(CARBON_BUDGETS).map(([k, v]) => <option key={k} value={k} style={{ color: '#000' }}>{v.label} ({v.annual_tonnes}t/yr)</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={sContainer}>
        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: 4, marginTop: 24, flexWrap: 'wrap' }}>
          {[{ k:'dashboard', l:'\📊 Dashboard' }, { k:'transactions', l:'\📋 Transactions' }, { k:'insights', l:'\💡 Insights' }, { k:'achievements', l:'\🏆 Achievements' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={sTab(tab === t.k)}>{t.l}</button>
          ))}
        </div>

        {/* ─── DASHBOARD TAB ─── */}
        {tab === 'dashboard' && (
          <div>
            {/* 3. KPI Cards */}
            <div style={{ ...sGrid(window.innerWidth < 768 ? 2 : 5), marginTop: 20 }}>
              {[
                { label:'Total Carbon', value:`${totalCarbon.toFixed(1)} kg`, icon:'\🌍', color: budgetColor },
                { label:'Daily Average', value:`${dailyAvg.toFixed(1)} kg`, icon:'\📅', color: dailyAvg > budget.daily_kg ? T.red : T.green },
                { label:'Budget Used', value:`${budgetUsedPct.toFixed(0)}%`, icon:'\🎯', color: budgetColor },
                { label:'Budget Remaining', value:`${budgetRemaining.toFixed(0)} kg`, icon:'\✅', color: T.green },
                { label:'Transactions', value: periodTxns.length, icon:'\📝', color: T.navyL },
                { label:'Top Category', value: topCategory, icon: catBreakdown[0] ? (CATEGORY_COLORS[catBreakdown[0].name] ? '\🔥' : '\📁') : '\📁', color: T.amber },
                { label:'Carbon/USD', value:`${carbonPerUsd.toFixed(2)} kg`, icon:'\💰', color: carbonPerUsd > 1 ? T.red : T.green },
                { label:'Carbon Score', value:`${carbonScore}/100`, icon:'\⭐', color: carbonScore > 70 ? T.green : carbonScore > 40 ? T.amber : T.red },
                { label:'Streak', value:`${streak} days`, icon:'\🔥', color: T.gold },
                { label:'Trees to Offset', value: treesNeeded.toFixed(1), icon:'\🌳', color: T.sage },
              ].map((k, i) => (
                <div key={i} style={sKpi}>
                  <div style={{ fontSize: 22 }}>{k.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.color, margin: '4px 0' }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* 4. Carbon Timeline AreaChart */}
            <div style={{ ...sCard, marginTop: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📈 Carbon Timeline ({now.getFullYear()})</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="carbon" fill={T.navyL} fillOpacity={0.15} stroke={T.navyL} strokeWidth={2} name="Carbon (kg)" />
                  <Line type="monotone" dataKey="budget" stroke={T.red} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Monthly Budget" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 5. Category Breakdown PieChart */}
            <div style={{ ...sCard }}>
              <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📊 Category Breakdown</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <ResponsiveContainer width={280} height={250}>
                  <PieChart>
                    <Pie data={catBreakdown.map(c => ({ ...c, value: +c.carbon.toFixed(1) }))} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}kg`} labelLine={false} fontSize={10}>
                      {catBreakdown.map((c, i) => <Cell key={i} fill={CATEGORY_COLORS[c.name] || PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {catBreakdown.map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[c.name] || PIE_COLORS[i] }} />
                        <span style={{ color: T.navy, fontWeight: 600 }}>{c.name}</span>
                      </div>
                      <div><strong>{c.carbon.toFixed(1)} kg</strong> <span style={{ color: T.textMut }}>({(c.carbon / totalCarbon * 100 || 0).toFixed(0)}%)</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. Budget Tracker */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 8px' }}>\🎯 Budget Tracker</h3>
              <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Monthly budget for {budget.label}: <strong>{(budget.daily_kg * 30).toFixed(0)} kg</strong></p>
              <div style={{ height: 28, background: T.surfaceH, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${Math.min(budgetUsedPct, 100)}%`, background: budgetColor, borderRadius: 14, transition: 'width 0.6s' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 12, fontWeight: 700, color: budgetUsedPct > 50 ? '#fff' : T.navy }}>{budgetUsedPct.toFixed(0)}% used</div>
              </div>
              {(() => {
                const ratePerDay = totalCarbon / Math.max(daysInPeriod, 1);
                const projected = ratePerDay * 365 / 1000;
                return (
                  <div style={{ marginTop: 10, fontSize: 13, color: T.textSec }}>
                    At this rate, you'll use <strong style={{ color: projected > budget.annual_tonnes ? T.red : T.green }}>{projected.toFixed(1)} tonnes</strong> this year
                    (budget: {budget.annual_tonnes}t)
                    {projected > budget.annual_tonnes && <span style={{ color: T.red }}> \— {((projected - budget.annual_tonnes) / budget.annual_tonnes * 100).toFixed(0)}% over budget!</span>}
                  </div>
                );
              })()}
            </div>

            {/* 12. Peer Comparison */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 8px' }}>\👥 Peer Comparison</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: peerPercentile > 60 ? T.green : peerPercentile > 30 ? T.amber : T.red }}>
                  {peerPercentile}%
                </div>
                <div style={{ fontSize: 14, color: T.textSec }}>
                  You're doing better than <strong>{peerPercentile}% of users</strong> based on your carbon footprint rate.
                  {peerPercentile > 70 && ' Great job! Keep it up!'}
                  {peerPercentile < 30 && ' There\'s room for improvement. Check the Savings Tips below.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TRANSACTIONS TAB ─── */}
        {tab === 'transactions' && (
          <div>
            {/* 6. Add Transaction Form */}
            <div style={{ ...sCard, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddForm ? 16 : 0 }}>
                <h3 style={{ color: T.navy, margin: 0 }}>\➕ Add Transaction</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAddForm(!showAddForm)} style={sBtn(T.sage, '#fff')}>{showAddForm ? 'Cancel' : 'Manual Entry'}</button>
                  <button onClick={() => setShowImport(!showImport)} style={sBtnSm(T.navyL, '#fff')}>\📄 Import CSV</button>
                </div>
              </div>
              {showAddForm && (
                <div style={{ ...sGrid(window.innerWidth < 768 ? 1 : 3), gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Date</label>
                    <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={sInput} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Description</label>
                    <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Grocery shopping, flight, etc." style={sInput} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Amount (USD)</label>
                    <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="85.50" style={sInput} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Category</label>
                    <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={sInput}>
                      {Object.entries(SPENDING_CARBON_INTENSITY).map(([k, v]) => <option key={k} value={k}>{v.icon} {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ({v.carbon_per_usd} kg/$)</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Carbon Override (optional, kg)</label>
                    <input type="number" value={fCarbonOverride} onChange={e => setFCarbonOverride(e.target.value)} placeholder={`Auto: ${((parseFloat(fAmount) || 0) * (SPENDING_CARBON_INTENSITY[fCategory]?.carbon_per_usd || 0)).toFixed(1)} kg`} style={sInput} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={addTransaction} style={{ ...sBtn(T.gold, '#fff'), width: '100%' }}>\➕ Add Transaction</button>
                  </div>
                </div>
              )}
              {/* Quick-add buttons */}
              {!showAddForm && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {[{ l:'\☕ Coffee ($5)', cat:'restaurants', amt:5 }, { l:'\⛽ Gas ($40)', cat:'fuel', amt:40 }, { l:'\🛒 Groceries ($60)', cat:'groceries', amt:60 }, { l:'\🚇 Metro ($3)', cat:'public_transport', amt:3 }, { l:'\🍽\️ Dinner ($35)', cat:'restaurants', amt:35 }].map((q, i) => (
                    <button key={i} onClick={() => { const info = SPENDING_CARBON_INTENSITY[q.cat]; setTransactions(prev => [{ id: `TXN-${Date.now()}`, date: new Date().toISOString(), description: q.l.split(' ').slice(1).join(' ').replace(/\(.*\)/, '').trim(), amount_usd: q.amt, category: q.cat, carbon_kg: +(q.amt * info.carbon_per_usd).toFixed(1), method: 'manual', items: [], offset: false, notes: '' }, ...prev]); }} style={sBtnSm(T.surfaceH, T.navy)}>{q.l}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Import */}
            {showImport && (
              <div style={sCard}>
                <h3 style={{ color: T.navy, margin: '0 0 8px' }}>\📄 Import Spending Data</h3>
                <p style={{ color: T.textSec, fontSize: 13, marginBottom: 12 }}>Paste bank statement data (CSV format: Date, Description, Amount). One transaction per line.</p>
                <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={6} placeholder={'2024-03-01, Whole Foods groceries, 85.50\n2024-03-02, Shell gas station, 42.00\n2024-03-03, Netflix subscription, 15.99'} style={{ ...sInput, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={importSpending} style={sBtn(T.sage, '#fff')}>\✅ Import & Categorize</button>
                  <button onClick={() => setShowImport(false)} style={sBtnSm(T.textMut, '#fff')}>Cancel</button>
                </div>
              </div>
            )}

            {/* 7. Transaction History Table */}
            <div style={sCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ color: T.navy, margin: 0 }}>\📋 Transaction History ({sortedTxns.length})</h3>
              </div>
              {sortedTxns.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>No transactions in this period.</div>}
              {sortedTxns.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                        {[{ k:'date', l:'Date' }, { k:'description', l:'Description' }, { k:'amount', l:'Amount ($)' }, { k:'category', l:'Category' }, { k:'carbon', l:'CO\₂e (kg)' }, { k:'method', l:'Method' }].map(h => (
                          <th key={h.k} onClick={() => toggleSort(h.k)} style={{ textAlign: h.k === 'amount' || h.k === 'carbon' ? 'right' : 'left', padding: '8px 10px', color: T.textSec, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                            {h.l} {sortCol === h.k ? (sortDir === 'asc' ? '\▲' : '\▼') : ''}
                          </th>
                        ))}
                        <th style={{ padding: '8px 10px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTxns.slice(0, 50).map(t => {
                        const info = SPENDING_CARBON_INTENSITY[t.category];
                        return (
                          <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{new Date(t.date).toLocaleDateString()}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{t.description}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>${t.amount_usd.toFixed(2)}</td>
                            <td style={{ padding: '8px 10px' }}>{info?.icon || '\📁'} {t.category.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: t.carbon_kg > 10 ? T.red : t.carbon_kg > 3 ? T.amber : T.green }}>{t.carbon_kg.toFixed(1)}</td>
                            <td style={{ padding: '8px 10px' }}><span style={sBadge(t.method === 'calculator' ? T.sage : t.method === 'card_import' ? T.navyL : T.textMut)}>{t.method}</span></td>
                            <td style={{ padding: '8px 10px' }}><button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, fontSize: 14 }}>\🗑\️</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {sortedTxns.length > 50 && <div style={{ textAlign: 'center', padding: 12, color: T.textMut, fontSize: 12 }}>Showing 50 of {sortedTxns.length} transactions</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── INSIGHTS TAB ─── */}
        {tab === 'insights' && (
          <div>
            {/* 9. Carbon Intensity by Category */}
            <div style={{ ...sCard, marginTop: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px' }}>\📊 Carbon Intensity by Spending Category</h3>
              <p style={{ color: T.textSec, fontSize: 13, marginBottom: 12 }}>How much CO\₂e per dollar spent? Higher = more carbon-intensive.</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intensityData} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={140} fontSize={11} />
                  <Tooltip formatter={(v) => `${v} kg CO2e/$`} />
                  <Bar dataKey="intensity" radius={[0, 6, 6, 0]} name="kg CO2e per $">
                    {intensityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 10. Carbon Rich vs Lean */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\💡 Carbon Rich vs Carbon Lean Purchases</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.red, fontSize: 14, marginBottom: 8 }}>\🔥 Most Carbon-Intensive (per $)</div>
                  {richLean.rich.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span style={{ color: T.navy }}>{t.description}</span>
                      <strong style={{ color: T.red }}>{t.ratio.toFixed(2)} kg/$</strong>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: T.green, fontSize: 14, marginBottom: 8 }}>\🌿 Least Carbon-Intensive (per $)</div>
                  {richLean.lean.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span style={{ color: T.navy }}>{t.description}</span>
                      <strong style={{ color: T.green }}>{t.ratio.toFixed(2)} kg/$</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 11. Monthly Comparison */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📊 Monthly Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyComparison}>
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="carbon" radius={[6, 6, 0, 0]} name="kg CO2e">
                    {monthlyComparison.map((m, i) => <Cell key={i} fill={m.carbon > budget.daily_kg * 30 ? T.red : T.navyL} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 13. Carbon Savings Actions */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\💡 Carbon Savings Tips</h3>
              <div style={sGrid(window.innerWidth < 768 ? 1 : 2)}>
                {SAVINGS_TIPS.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: T.surfaceH, borderRadius: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 28 }}>{tip.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: T.navy, fontSize: 14 }}>{tip.tip}</div>
                      <div style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>Save {tip.saving_kg} kg CO\₂e {tip.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 14. Offset Calculator */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 8px' }}>\🌳 Offset Calculator</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 13, color: T.textSec }}>Your annual carbon footprint</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{annualSummary.total.toFixed(0)} kg <span style={{ fontSize: 14, color: T.textSec }}>({(annualSummary.total / 1000).toFixed(2)} tonnes)</span></div>
                </div>
                <div style={{ fontSize: 28 }}>=</div>
                <div>
                  <div style={{ fontSize: 13, color: T.textSec }}>Cost to offset</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.sage }}>${(annualSummary.total / 1000 * OFFSET_PRICE_PER_TONNE).toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>at ${OFFSET_PRICE_PER_TONNE}/tonne (certified projects)</div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[{ l:'Reforestation', e:'\🌲' }, { l:'Renewable Energy', e:'\☀\️' }, { l:'Clean Cookstoves', e:'\🍳' }, { l:'Direct Air Capture', e:'\💨' }].map((p, i) => (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: '8px 14px', fontSize: 12 }}>{p.e} {p.l}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── ACHIEVEMENTS TAB ─── */}
        {tab === 'achievements' && (
          <div>
            {/* 15. Carbon Score */}
            <div style={{ ...sCard, marginTop: 20, textAlign: 'center' }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px' }}>\⭐ Your Carbon Score</h3>
              <div style={{ display: 'inline-block', position: 'relative', width: 180, height: 180 }}>
                <svg viewBox="0 0 180 180" style={{ width: 180, height: 180 }}>
                  <circle cx="90" cy="90" r="78" fill="none" stroke={T.surfaceH} strokeWidth="14" />
                  <circle cx="90" cy="90" r="78" fill="none" stroke={carbonScore > 70 ? T.green : carbonScore > 40 ? T.amber : T.red} strokeWidth="14"
                    strokeDasharray={`${carbonScore / 100 * 490} 490`} strokeLinecap="round" transform="rotate(-90 90 90)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: T.navy }}>{carbonScore}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>out of 100</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: T.textSec }}>
                {carbonScore > 80 ? 'Excellent! You\'re a carbon champion.' : carbonScore > 60 ? 'Good job! You\'re on the right track.' : carbonScore > 40 ? 'Decent. Small changes can make a big difference.' : 'Room for improvement. Check the savings tips!'}
              </div>
            </div>

            {/* 16. Achievement Badges */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 16px' }}>\🏆 Achievement Badges</h3>
              <div style={sGrid(window.innerWidth < 768 ? 2 : 4)}>
                {BADGES.map(b => {
                  const earned = earnedBadges.find(e => e.id === b.id);
                  return (
                    <div key={b.id} style={{ ...sKpi, opacity: earned ? 1 : 0.4, border: earned ? `2px solid ${T.gold}` : `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 36 }}>{b.icon}</div>
                      <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginTop: 4 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: earned ? T.green : T.textMut, marginTop: 2 }}>{earned ? '\✅ Earned!' : '\🔒 Locked'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 17. Annual Summary */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📅 {now.getFullYear()} Annual Summary</h3>
              <div style={sGrid(window.innerWidth < 768 ? 2 : 4)}>
                {[
                  { l: 'Total Carbon', v: `${annualSummary.total.toFixed(0)} kg`, icon: '\🌍' },
                  { l: 'Transactions', v: annualSummary.count, icon: '\📝' },
                  { l: 'Best Month', v: `${annualSummary.bestMonth} (${annualSummary.bestVal} kg)`, icon: '\🏆' },
                  { l: 'Worst Month', v: `${annualSummary.worstMonth} (${annualSummary.worstVal} kg)`, icon: '\🔥' },
                  { l: 'Budget', v: `${budget.annual_tonnes}t (${budget.label})`, icon: '\🎯' },
                  { l: 'vs Budget', v: `${(annualSummary.total / 1000 / budget.annual_tonnes * 100).toFixed(0)}%`, icon: '\📊' },
                  { l: 'Trees to Offset', v: (annualSummary.total / 22).toFixed(1), icon: '\🌳' },
                  { l: 'Offset Cost', v: `$${(annualSummary.total / 1000 * OFFSET_PRICE_PER_TONNE).toFixed(2)}`, icon: '\💰' },
                ].map((k, i) => (
                  <div key={i} style={sKpi}>
                    <div style={{ fontSize: 22 }}>{k.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 4 }}>{k.v}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{k.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── WEEKLY CARBON HEATMAP ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🗓\️ Weekly Carbon Heatmap</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Which days of the week are your highest carbon days?</p>
          {(() => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayTotals = [0, 0, 0, 0, 0, 0, 0];
            const dayCounts = [0, 0, 0, 0, 0, 0, 0];
            transactions.forEach(t => {
              const dow = new Date(t.date).getDay();
              dayTotals[dow] += t.carbon_kg;
              dayCounts[dow]++;
            });
            const dayAvg = dayTotals.map((total, i) => ({
              day: dayNames[i],
              avg: dayCounts[i] > 0 ? +(total / dayCounts[i]).toFixed(1) : 0,
              total: +total.toFixed(0),
            }));
            return (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dayAvg}>
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="avg" radius={[6, 6, 0, 0]} name="Avg Daily Carbon (kg)">
                      {dayAvg.map((d, i) => (
                        <Cell key={i} fill={d.avg > budget.daily_kg ? T.red : d.avg > budget.daily_kg * 0.7 ? T.amber : T.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                  {dayAvg.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: T.navy }}>{d.day}</div>
                      <div style={{ color: d.avg > budget.daily_kg ? T.red : T.textSec }}>{d.avg} kg avg</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ─── CARBON VELOCITY ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🚀 Carbon Velocity</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>How fast you are spending your annual carbon budget. At your current rate:</p>
          {(() => {
            const ratePerDay = totalCarbon / Math.max(daysInPeriod, 1);
            const daysToExhaust = ratePerDay > 0 ? (budget.annual_tonnes * 1000) / ratePerDay : Infinity;
            const exhaustDate = new Date();
            exhaustDate.setDate(exhaustDate.getDate() + Math.min(daysToExhaust, 365));
            const projectedAnnual = ratePerDay * 365 / 1000;
            return (
              <div style={sGrid(window.innerWidth < 768 ? 1 : 3)}>
                <div style={sKpi}>
                  <div style={{ fontSize: 22 }}>\⏱\️</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ratePerDay > budget.daily_kg ? T.red : T.green }}>{ratePerDay.toFixed(1)} kg/day</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Current Burn Rate</div>
                </div>
                <div style={sKpi}>
                  <div style={{ fontSize: 22 }}>\📅</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: daysToExhaust < 365 ? T.red : T.green }}>
                    {daysToExhaust < 365 ? `${Math.round(daysToExhaust)} days` : 'Under budget!'}
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Until Budget Exhausted</div>
                </div>
                <div style={sKpi}>
                  <div style={{ fontSize: 22 }}>\📊</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: projectedAnnual > budget.annual_tonnes ? T.red : T.green }}>{projectedAnnual.toFixed(2)}t</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Projected Annual Total</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ─── SPENDING EFFICIENCY ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\💵 Spending Carbon Efficiency</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>How carbon-efficient is each dollar you spend by category? Lower is better.</p>
          {(() => {
            const catSpending = {};
            periodTxns.forEach(t => {
              if (!catSpending[t.category]) catSpending[t.category] = { spend: 0, carbon: 0 };
              catSpending[t.category].spend += t.amount_usd;
              catSpending[t.category].carbon += t.carbon_kg;
            });
            const effData = Object.entries(catSpending)
              .filter(([_, v]) => v.spend > 0)
              .map(([k, v]) => ({
                name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                efficiency: +(v.carbon / v.spend).toFixed(2),
                spend: +v.spend.toFixed(0),
                carbon: +v.carbon.toFixed(0),
                icon: SPENDING_CARBON_INTENSITY[k]?.icon || '\📁',
              }))
              .sort((a, b) => b.efficiency - a.efficiency);
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Category</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>Spend ($)</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>Carbon (kg)</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>kg CO\₂e/$</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effData.map((d, i) => (
                      <tr key={d.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{d.icon} {d.name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>${d.spend}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{d.carbon}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: d.efficiency > 1 ? T.red : d.efficiency > 0.5 ? T.amber : T.green }}>{d.efficiency}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={sBadge(d.efficiency > 1 ? T.red : d.efficiency > 0.5 ? T.amber : T.green)}>
                            {d.efficiency > 1 ? 'High' : d.efficiency > 0.5 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* ─── CUMULATIVE CARBON AREA CHART ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\📈 Cumulative Carbon Over Time</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Running total of your carbon emissions this year with budget line.</p>
          {(() => {
            const yearTxns = [...transactions].filter(t => new Date(t.date).getFullYear() === now.getFullYear()).sort((a, b) => new Date(a.date) - new Date(b.date));
            let cumul = 0;
            const dataPoints = [];
            const seen = {};
            yearTxns.forEach(t => {
              cumul += t.carbon_kg;
              const dateKey = new Date(t.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
              if (!seen[dateKey]) {
                seen[dateKey] = true;
                const dayOfYear = Math.floor((new Date(t.date) - new Date(new Date(t.date).getFullYear(), 0, 0)) / 86400000);
                dataPoints.push({
                  date: dateKey,
                  cumulative: +cumul.toFixed(0),
                  budgetLine: +(budget.daily_kg * dayOfYear).toFixed(0),
                });
              } else {
                const last = dataPoints[dataPoints.length - 1];
                if (last) last.cumulative = +cumul.toFixed(0);
              }
            });
            return (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={dataPoints.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cumulative" fill={T.navyL} fillOpacity={0.1} stroke={T.navyL} strokeWidth={2} name="Your Carbon (kg)" />
                  <Line type="monotone" dataKey="budgetLine" stroke={T.red} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Budget Pace" />
                </ComposedChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* ─── TRANSACTION CATEGORY DISTRIBUTION OVER TIME ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\📊 Category Trends Over Time</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>How your spending across categories has shifted month to month.</p>
          {(() => {
            const monthCatMap = {};
            transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()).forEach(t => {
              const m = new Date(t.date).toLocaleString('default', { month: 'short' });
              const info = SPENDING_CARBON_INTENSITY[t.category];
              const cat = info?.category || 'Other';
              if (!monthCatMap[m]) monthCatMap[m] = { month: m };
              monthCatMap[m][cat] = (monthCatMap[m][cat] || 0) + t.carbon_kg;
            });
            const trendData = Object.values(monthCatMap);
            const allCats = [...new Set(trendData.flatMap(d => Object.keys(d).filter(k => k !== 'month')))];
            return (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend fontSize={10} />
                  {allCats.map((cat, i) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat] || PIE_COLORS[i % PIE_COLORS.length]} name={cat} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* ─── GLOBAL COMPARISON ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🌍 How Do You Compare Globally?</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Your annual carbon rate compared to country averages and climate targets.</p>
          {(() => {
            const yourRate = totalCarbon / Math.max(daysInPeriod, 1) * 365 / 1000;
            const compData = [
              { name: 'You', tonnes: +yourRate.toFixed(1), color: T.gold },
              ...Object.entries(CARBON_BUDGETS).map(([_, v]) => ({ name: v.label, tonnes: v.annual_tonnes, color: v.color })),
            ].sort((a, b) => b.tonnes - a.tonnes);
            return (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={compData} layout="vertical">
                  <XAxis type="number" fontSize={12} unit=" t" />
                  <YAxis type="category" dataKey="name" width={130} fontSize={11} />
                  <Tooltip formatter={(v) => `${v} tonnes/year`} />
                  <Bar dataKey="tonnes" radius={[0, 6, 6, 0]} name="tonnes CO2e/year">
                    {compData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* ─── CARBON FOOTPRINT MILESTONES ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🎯 Carbon Milestones</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Track your journey toward sustainability with these milestones.</p>
          <div style={sGrid(window.innerWidth < 768 ? 1 : 2)}>
            {[
              { name: 'First Transaction Logged', target: 1, current: transactions.length, unit: 'transactions', icon: '\📝' },
              { name: 'Under Monthly Budget', target: budget.daily_kg * 30, current: totalCarbon, unit: 'kg (lower is better)', icon: '\🎯', inverse: true },
              { name: '7-Day Under Budget Streak', target: 7, current: streak, unit: 'days', icon: '\🔥' },
              { name: '30-Day Under Budget Streak', target: 30, current: streak, unit: 'days', icon: '\🌟' },
              { name: 'Score Above 80', target: 80, current: carbonScore, unit: 'points', icon: '\⭐' },
              { name: 'Carbon/$ Below 0.50', target: 0.5, current: carbonPerUsd, unit: 'kg/$', icon: '\💰', inverse: true },
            ].map((m, i) => {
              const progress = m.inverse
                ? (m.current <= m.target ? 100 : Math.max(0, (1 - (m.current - m.target) / m.target) * 100))
                : Math.min(100, (m.current / m.target) * 100);
              const achieved = m.inverse ? m.current <= m.target : m.current >= m.target;
              return (
                <div key={i} style={{ display: 'flex', gap: 14, padding: 14, background: achieved ? '#ecfdf5' : T.surfaceH, borderRadius: 12, border: achieved ? `1px solid #bbf7d0` : `1px solid ${T.border}`, alignItems: 'center' }}>
                  <div style={{ fontSize: 28 }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
                    <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: achieved ? T.green : T.amber, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>
                      {achieved ? '\✅ Achieved!' : `${progress.toFixed(0)}% complete`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── CARBON REDUCTION PLAN ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\📝 Personalized Carbon Reduction Plan</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Based on your spending patterns, here are the top actions that would have the biggest impact.</p>
          {(() => {
            const topCats = [...catBreakdown].sort((a, b) => b.carbon - a.carbon).slice(0, 3);
            const suggestions = topCats.map(cat => {
              if (cat.name === 'Transport') return { cat: cat.name, icon: '\🚗', action: 'Switch to public transport or carpooling for daily commute', potential: (cat.carbon * 0.5).toFixed(0) };
              if (cat.name === 'Food') return { cat: cat.name, icon: '\🥗', action: 'Reduce red meat to 1x/week and switch to plant-based alternatives', potential: (cat.carbon * 0.35).toFixed(0) };
              if (cat.name === 'Home') return { cat: cat.name, icon: '\🏠', action: 'Switch to a renewable energy provider or install solar', potential: (cat.carbon * 0.6).toFixed(0) };
              if (cat.name === 'Fashion') return { cat: cat.name, icon: '\👕', action: 'Buy second-hand and extend garment life by 2x', potential: (cat.carbon * 0.45).toFixed(0) };
              return { cat: cat.name, icon: '\🌿', action: `Look for lower-carbon alternatives in ${cat.name}`, potential: (cat.carbon * 0.3).toFixed(0) };
            });
            return (
              <div>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', background: i % 2 === 0 ? T.surfaceH : '#fff', borderRadius: 10, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 28 }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: T.navy, fontSize: 14 }}>{s.action}</div>
                      <div style={{ fontSize: 12, color: T.textSec }}>Based on your {s.cat} spending</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>-{s.potential} kg</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>potential saving</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: '12px 16px', background: '#ecfdf5', borderRadius: 10, fontSize: 13, color: T.green, fontWeight: 600 }}>
                  \🌿 Total potential savings: {suggestions.reduce((s, x) => s + parseFloat(x.potential), 0).toFixed(0)} kg CO\₂e this period
                </div>
              </div>
            );
          })()}
        </div>

        {/* ─── EXPORTS & CROSS-NAV ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📥 Export & Navigate</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={exportCSV} style={sBtn(T.navy, '#fff')}>\💾 Export Transactions (CSV)</button>
            <button onClick={exportJSON} style={sBtn(T.navyL, '#fff')}>\📄 Annual Report (JSON)</button>
            <button onClick={printPage} style={sBtn(T.textSec, '#fff')}>\🖨\️ Print</button>
            <button onClick={() => navigate('/carbon-calculator')} style={sBtn(T.sage, '#fff')}>\🧪 Carbon Calculator</button>
            <button onClick={() => navigate('/carbon-wallet')} style={sBtn(T.gold, '#fff')}>💳 Refresh Wallet</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0 16px', color: T.textMut, fontSize: 12 }}>
          Carbon Wallet &middot; Personal Footprint Tracker &middot; Version 1.0
        </div>
      </div>
    </div>
  );
}
