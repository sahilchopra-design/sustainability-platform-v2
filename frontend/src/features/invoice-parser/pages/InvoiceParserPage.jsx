/**
 * EP-Z3 — Invoice & Receipt Carbon Parser
 * Sprint Z — Consumer Carbon Intelligence
 *
 * Parses shopping receipts/invoices to auto-calculate carbon footprint
 * of each line item. User pastes receipt text or enters items manually.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ── Theme ── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8',
  borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a',
  goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c',
  textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a',
  amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

/* ── Receipt Keywords (50+) ── */
const RECEIPT_KEYWORDS = {
  // Food
  'beef':       { carbon_per_unit: 27.0, unit: 'kg', category: 'Food', match_confidence: 0.9 },
  'steak':      { carbon_per_unit: 27.0, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'ground beef':{ carbon_per_unit: 27.0, unit: 'kg', category: 'Food', match_confidence: 0.9 },
  'lamb':       { carbon_per_unit: 24.0, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'pork':       { carbon_per_unit: 7.6, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'bacon':      { carbon_per_unit: 7.6, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'chicken':    { carbon_per_unit: 6.9, unit: 'kg', category: 'Food', match_confidence: 0.9 },
  'turkey':     { carbon_per_unit: 5.5, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'milk':       { carbon_per_unit: 3.15, unit: 'litre', category: 'Food', match_confidence: 0.85 },
  'bread':      { carbon_per_unit: 0.8, unit: 'loaf', category: 'Food', match_confidence: 0.8 },
  'rice':       { carbon_per_unit: 2.7, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'eggs':       { carbon_per_unit: 4.5, unit: 'dozen', category: 'Food', match_confidence: 0.85 },
  'cheese':     { carbon_per_unit: 13.5, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'butter':     { carbon_per_unit: 11.5, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'cream':      { carbon_per_unit: 8.5, unit: 'litre', category: 'Food', match_confidence: 0.75 },
  'coffee':     { carbon_per_unit: 8.0, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'tea':        { carbon_per_unit: 1.9, unit: 'kg', category: 'Food', match_confidence: 0.7 },
  'chocolate':  { carbon_per_unit: 19.0, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'salmon':     { carbon_per_unit: 5.1, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'tuna':       { carbon_per_unit: 6.1, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'shrimp':     { carbon_per_unit: 12.0, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'banana':     { carbon_per_unit: 0.7, unit: 'kg', category: 'Food', match_confidence: 0.9 },
  'apple':      { carbon_per_unit: 0.4, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'orange':     { carbon_per_unit: 0.5, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'avocado':    { carbon_per_unit: 1.3, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'potato':     { carbon_per_unit: 0.3, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'tomato':     { carbon_per_unit: 1.4, unit: 'kg', category: 'Food', match_confidence: 0.75 },
  'onion':      { carbon_per_unit: 0.3, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'carrot':     { carbon_per_unit: 0.3, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'lettuce':    { carbon_per_unit: 0.5, unit: 'kg', category: 'Food', match_confidence: 0.75 },
  'broccoli':   { carbon_per_unit: 0.9, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'yogurt':     { carbon_per_unit: 2.5, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'pasta':      { carbon_per_unit: 1.3, unit: 'kg', category: 'Food', match_confidence: 0.85 },
  'cereal':     { carbon_per_unit: 1.2, unit: 'kg', category: 'Food', match_confidence: 0.75 },
  'sugar':      { carbon_per_unit: 1.0, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'flour':      { carbon_per_unit: 0.7, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'oil':        { carbon_per_unit: 3.5, unit: 'litre', category: 'Food', match_confidence: 0.6 },
  'olive oil':  { carbon_per_unit: 5.4, unit: 'litre', category: 'Food', match_confidence: 0.8 },
  'wine':       { carbon_per_unit: 1.2, unit: 'bottle', category: 'Food', match_confidence: 0.8 },
  'beer':       { carbon_per_unit: 0.5, unit: 'bottle', category: 'Food', match_confidence: 0.8 },
  'juice':      { carbon_per_unit: 0.8, unit: 'litre', category: 'Food', match_confidence: 0.7 },
  'soda':       { carbon_per_unit: 0.4, unit: 'litre', category: 'Food', match_confidence: 0.7 },
  'ice cream':  { carbon_per_unit: 4.2, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  'nuts':       { carbon_per_unit: 2.3, unit: 'kg', category: 'Food', match_confidence: 0.7 },
  'almond':     { carbon_per_unit: 2.3, unit: 'kg', category: 'Food', match_confidence: 0.8 },
  // Transport / Fuel
  'petrol':     { carbon_per_unit: 2.31, unit: 'litre', category: 'Transport', match_confidence: 0.95 },
  'diesel':     { carbon_per_unit: 2.68, unit: 'litre', category: 'Transport', match_confidence: 0.95 },
  'gasoline':   { carbon_per_unit: 2.31, unit: 'litre', category: 'Transport', match_confidence: 0.95 },
  'fuel':       { carbon_per_unit: 2.31, unit: 'litre', category: 'Transport', match_confidence: 0.8 },
  'uber':       { carbon_per_unit: 0.21, unit: 'km', category: 'Transport', match_confidence: 0.7 },
  'taxi':       { carbon_per_unit: 0.21, unit: 'km', category: 'Transport', match_confidence: 0.7 },
  'parking':    { carbon_per_unit: 0.5, unit: 'hour', category: 'Transport', match_confidence: 0.5 },
  // Household
  'electricity':{ carbon_per_unit: 0.42, unit: 'kWh', category: 'Home', match_confidence: 0.9 },
  'gas bill':   { carbon_per_unit: 2.0, unit: 'm\u00B3', category: 'Home', match_confidence: 0.8 },
  'natural gas':{ carbon_per_unit: 2.0, unit: 'm\u00B3', category: 'Home', match_confidence: 0.85 },
  'water':      { carbon_per_unit: 0.3, unit: 'm\u00B3', category: 'Home', match_confidence: 0.5 },
  'detergent':  { carbon_per_unit: 1.5, unit: 'kg', category: 'Home', match_confidence: 0.7 },
  'paper towel':{ carbon_per_unit: 1.1, unit: 'roll', category: 'Home', match_confidence: 0.7 },
  'tissue':     { carbon_per_unit: 0.7, unit: 'box', category: 'Home', match_confidence: 0.6 },
};

const KEYWORD_LIST = Object.keys(RECEIPT_KEYWORDS);

/* ── Merchant Category Auto-Detection ── */
const MERCHANT_CATEGORIES = {
  'walmart': 'Grocery', 'tesco': 'Grocery', 'aldi': 'Grocery', 'lidl': 'Grocery',
  'costco': 'Grocery', 'kroger': 'Grocery', 'safeway': 'Grocery', 'whole foods': 'Grocery',
  'target': 'General', 'amazon': 'General', 'shell': 'Fuel Station', 'bp': 'Fuel Station',
  'exxon': 'Fuel Station', 'chevron': 'Fuel Station', 'total': 'Fuel Station',
  'starbucks': 'Restaurant', 'mcdonalds': 'Restaurant', 'subway': 'Restaurant',
  'ikea': 'Home Goods', 'home depot': 'Home Goods',
};

/* ── Multi-Currency ── */
const CURRENCY_SYMBOLS = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '\u20AC', rate: 1.08 },
  GBP: { symbol: '\u00A3', rate: 1.27 },
  INR: { symbol: '\u20B9', rate: 0.012 },
  JPY: { symbol: '\u00A5', rate: 0.0067 },
};

/* ── Parser ── */
function parseReceipt(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const items = [];
  const unmatched = [];
  lines.forEach((line, idx) => {
    const priceMatch = line.match(/[$\u20AC\u00A3\u20B9\u00A5]?\s*(\d+[.,]\d{2})/);
    const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(x|\u00D7|pcs?|kg|g|lb|l|ml|doz|gal)/i);
    const amount = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;
    const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
    const lower = line.toLowerCase();
    let matched = false;
    for (const keyword of KEYWORD_LIST) {
      if (lower.includes(keyword)) {
        const data = RECEIPT_KEYWORDS[keyword];
        items.push({
          id: `item-${idx}-${Date.now()}`,
          line: line.trim(),
          matched_keyword: keyword,
          quantity: qty,
          amount,
          carbon_kg: +(data.carbon_per_unit * qty).toFixed(3),
          category: data.category,
          confidence: data.match_confidence,
          unit: data.unit,
          carbon_per_unit: data.carbon_per_unit,
        });
        matched = true;
        break;
      }
    }
    if (!matched && line.trim().length > 2) {
      unmatched.push({ id: `um-${idx}`, line: line.trim(), amount });
    }
  });
  return { items, unmatched };
}

function detectMerchant(text) {
  const lower = text.toLowerCase();
  for (const [name, cat] of Object.entries(MERCHANT_CATEGORIES)) {
    if (lower.includes(name)) return { name, category: cat };
  }
  return null;
}

/* ── Samples ── */
const SAMPLE_RECEIPTS = [
  { label: 'Grocery', icon: '\uD83D\uDED2', text: `Walmart Supercenter\nChicken Breast 2kg   $11.99\nWhole Milk 1L        $3.49\nBananas 1kg          $1.29\nEggs 1 doz           $4.99\nBread Wheat Loaf     $2.89\nCheddar Cheese 500g  $5.49\nPasta Penne 1kg      $1.99\nOlive Oil 750ml      $7.49\nYogurt Greek 1kg     $4.29\nRice Basmati 2kg     $6.99\nBroccoli 500g        $2.49\nApple Gala 1kg       $3.99\nButter Unsalted 250g $3.29\n---\nTotal:              $60.42` },
  { label: 'Fuel', icon: '\u26FD', text: `Shell Station #4521\nDate: 2024-03-15\nPetrol Unleaded 95\n45.2 litres\nPrice/L: $1.65\nTotal: $74.58\nPayment: Visa ***4821` },
  { label: 'Restaurant', icon: '\uD83C\uDF7D', text: `The Golden Fork Restaurant\nBeef Tenderloin       $32.00\nSalmon Grilled        $28.00\nWine Cabernet 1 bottle $45.00\nChocolate Lava Cake   $12.00\nCoffee Espresso x2    $8.00\nSubtotal:            $125.00\nTax:                  $10.00\nTotal:               $135.00` },
  { label: 'Online Order', icon: '\uD83D\uDCE6', text: `Amazon.com Order #112-3456789\nOrganic Coffee Beans 1kg    $14.99\nDark Chocolate 70% 500g     $8.99\nAlmond Butter 400g          $9.49\nGreen Tea Matcha 200g       $12.99\nShipping:                    $5.99\nTotal:                      $52.45` },
  { label: 'Utility Bill', icon: '\uD83D\uDCA1', text: `City Energy Co. — Monthly Statement\nElectricity Usage: 420 kWh\nRate: $0.14/kWh\nElectricity Charge:  $58.80\nNatural Gas: 35 m\u00B3\nGas Charge:          $24.50\nService Fee:          $8.00\nTotal Due:           $91.30` },
];

/* ── Carbon Equivalences ── */
function carbonEquivalences(kg) {
  return [
    { label: 'Driving (km)', value: (kg / 0.21).toFixed(0), icon: '\uD83D\uDE97' },
    { label: 'Flights (hrs)', value: (kg / 90).toFixed(2), icon: '\u2708\uFE0F' },
    { label: 'Trees to absorb (1yr)', value: (kg / 22).toFixed(1), icon: '\uD83C\uDF33' },
    { label: 'Smartphone charges', value: (kg / 0.008).toFixed(0), icon: '\uD83D\uDD0B' },
  ];
}

/* ── Colors for Charts ── */
const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.amber, T.red, T.sageL, T.goldL];
const confColor = c => c >= 0.9 ? T.green : c >= 0.7 ? T.amber : T.red;
const confLabel = c => c >= 0.9 ? 'High' : c >= 0.7 ? 'Medium' : 'Low';

/* ── Swap Suggestions ── */
const SWAP_MAP = {
  beef:    { alt: 'Chicken', save_pct: 74, alt_carbon: 6.9 },
  steak:   { alt: 'Plant-based steak', save_pct: 90, alt_carbon: 2.5 },
  lamb:    { alt: 'Turkey', save_pct: 77, alt_carbon: 5.5 },
  cheese:  { alt: 'Plant-based cheese', save_pct: 70, alt_carbon: 4.0 },
  milk:    { alt: 'Oat milk', save_pct: 68, alt_carbon: 1.0 },
  butter:  { alt: 'Margarine', save_pct: 65, alt_carbon: 4.0 },
  shrimp:  { alt: 'Tofu', save_pct: 83, alt_carbon: 2.0 },
  chocolate:{ alt: 'Carob bar', save_pct: 60, alt_carbon: 7.5 },
  coffee:  { alt: 'Chicory blend', save_pct: 50, alt_carbon: 4.0 },
  salmon:  { alt: 'Sardines', save_pct: 41, alt_carbon: 3.0 },
  cream:   { alt: 'Coconut cream', save_pct: 55, alt_carbon: 3.8 },
  petrol:  { alt: 'Public transport trip', save_pct: 80, alt_carbon: 0.46 },
  diesel:  { alt: 'EV equivalent', save_pct: 75, alt_carbon: 0.67 },
};

/* ════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════ */
export default function InvoiceParserPage() {
  const navigate = useNavigate();

  /* ── State ── */
  const [receiptText, setReceiptText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [unmatchedItems, setUnmatchedItems] = useState([]);
  const [detectedMerchant, setDetectedMerchant] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_receipt_history_v1') || '[]'); } catch { return []; }
  });
  const [walletMsg, setWalletMsg] = useState('');

  /* Manual entry */
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualCarbon, setManualCarbon] = useState('');
  const [manualCategory, setManualCategory] = useState('Food');

  /* Custom carbon for unmatched */
  const [customCarbonMap, setCustomCarbonMap] = useState({});

  /* ── Parse Action ── */
  const handleParse = useCallback(() => {
    if (!receiptText.trim()) return;
    const { items, unmatched } = parseReceipt(receiptText);
    setParsedItems(items);
    setUnmatchedItems(unmatched);
    setDetectedMerchant(detectMerchant(receiptText));
    // Save to history
    const entry = { id: Date.now(), date: new Date().toISOString().slice(0, 10), itemCount: items.length, totalCarbon: items.reduce((s, i) => s + i.carbon_kg, 0), snippet: receiptText.slice(0, 80) };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem('ra_receipt_history_v1', JSON.stringify(updated)); } catch {}
  }, [receiptText, history]);

  /* ── Manual Add ── */
  const handleManualAdd = useCallback(() => {
    if (!manualName.trim() || !manualCarbon) return;
    const item = {
      id: `manual-${Date.now()}`,
      line: manualName,
      matched_keyword: manualName.toLowerCase(),
      quantity: parseFloat(manualQty) || 1,
      amount: null,
      carbon_kg: parseFloat(manualCarbon) * (parseFloat(manualQty) || 1),
      category: manualCategory,
      confidence: 1.0,
      unit: 'unit',
      carbon_per_unit: parseFloat(manualCarbon),
    };
    setParsedItems(prev => [...prev, item]);
    setManualName(''); setManualQty('1'); setManualCarbon('');
  }, [manualName, manualQty, manualCarbon, manualCategory]);

  /* ── Assign custom carbon to unmatched ── */
  const assignUnmatched = useCallback((umId, carbonKg, category) => {
    const um = unmatchedItems.find(u => u.id === umId);
    if (!um) return;
    const item = {
      id: um.id + '-assigned',
      line: um.line,
      matched_keyword: 'custom',
      quantity: 1,
      amount: um.amount,
      carbon_kg: parseFloat(carbonKg) || 0,
      category: category || 'Other',
      confidence: 0.5,
      unit: 'unit',
      carbon_per_unit: parseFloat(carbonKg) || 0,
    };
    setParsedItems(prev => [...prev, item]);
    setUnmatchedItems(prev => prev.filter(u => u.id !== umId));
  }, [unmatchedItems]);

  /* ── Add to Carbon Wallet ── */
  const addToWallet = useCallback(() => {
    if (parsedItems.length === 0) return;
    try {
      const existing = JSON.parse(localStorage.getItem('ra_carbon_wallet_v1') || '[]');
      const newTxns = parsedItems.map(it => ({
        id: `wallet-${it.id}-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        description: it.line,
        category: it.category,
        carbon_kg: it.carbon_kg,
        amount_usd: it.amount ? it.amount * (CURRENCY_SYMBOLS[currency]?.rate || 1) : null,
        source: 'receipt-parser',
      }));
      localStorage.setItem('ra_carbon_wallet_v1', JSON.stringify([...newTxns, ...existing]));
      setWalletMsg(`Added ${newTxns.length} items to your Carbon Wallet!`);
      setTimeout(() => setWalletMsg(''), 4000);
    } catch {}
  }, [parsedItems, currency]);

  /* ── Derived ── */
  const totalCarbon = useMemo(() => parsedItems.reduce((s, i) => s + i.carbon_kg, 0), [parsedItems]);
  const categoryBreakdown = useMemo(() => {
    const map = {};
    parsedItems.forEach(i => {
      if (!map[i.category]) map[i.category] = 0;
      map[i.category] += i.carbon_kg;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [parsedItems]);
  const barData = useMemo(() =>
    [...parsedItems].sort((a, b) => b.carbon_kg - a.carbon_kg).slice(0, 15).map(i => ({
      name: i.matched_keyword.length > 12 ? i.matched_keyword.slice(0, 12) + '...' : i.matched_keyword,
      carbon: +i.carbon_kg.toFixed(2),
    })),
  [parsedItems]);
  const swapSuggestions = useMemo(() =>
    parsedItems.filter(i => SWAP_MAP[i.matched_keyword]).map(i => ({ ...i, swap: SWAP_MAP[i.matched_keyword] })),
  [parsedItems]);
  const equivs = useMemo(() => carbonEquivalences(totalCarbon), [totalCarbon]);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const header = 'Line,Keyword,Qty,Amount,Carbon_kg,Category,Confidence\n';
    const rows = parsedItems.map(i => `"${i.line}","${i.matched_keyword}",${i.quantity},${i.amount ?? ''},${i.carbon_kg},${i.category},${i.confidence}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `receipt_carbon_${Date.now()}.csv`; a.click();
  }, [parsedItems]);
  const exportJSON = useCallback(() => {
    const data = { total_carbon_kg: totalCarbon, categories: categoryBreakdown, items: parsedItems, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `carbon_summary_${Date.now()}.json`; a.click();
  }, [totalCarbon, categoryBreakdown, parsedItems]);
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
  const sInput = {
    width: '100%', padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 8,
    fontFamily: T.font, fontSize: 14, background: T.surface, color: T.text, outline: 'none',
    boxSizing: 'border-box',
  };

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* ── 1. Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>Invoice & Receipt Carbon Parser</h1>
            <span style={sBadge(T.gold + '22', T.gold)}>EP-Z3</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            Paste Receipt &middot; Auto-Match &middot; 50+ Products &middot; Instant Carbon Footprint
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...sInput, width: 90, padding: '8px 10px' }}>
            {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c].symbol})</option>)}
          </select>
          <button onClick={() => navigate('/carbon-calculator')} style={sBtn(T.sage)}>Calculator</button>
          <button onClick={() => navigate('/carbon-wallet')} style={sBtn(T.navyL)}>Wallet</button>
          <button onClick={() => navigate('/spending-carbon')} style={sBtn(T.gold, T.navy)}>Spending Analyzer</button>
        </div>
      </div>

      {/* ── 2. Receipt Input Panel ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 600 }}>Paste Your Receipt or Invoice</h3>
        <textarea
          value={receiptText}
          onChange={e => setReceiptText(e.target.value)}
          placeholder="Paste your receipt text here...\nE.g.:\nChicken Breast 2kg  $11.99\nWhole Milk 1L       $3.49\nBananas 1kg         $1.29"
          style={{ ...sInput, height: 180, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
          <button onClick={handleParse} style={sBtn(T.navy)}>Parse Receipt</button>
          <button onClick={() => { setReceiptText(''); setParsedItems([]); setUnmatchedItems([]); setDetectedMerchant(null); }} style={sBtn(T.textMut, '#fff')}>Clear</button>
          {parsedItems.length > 0 && (
            <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>
              {parsedItems.length} items matched &middot; {totalCarbon.toFixed(2)} kg CO2e
            </span>
          )}
        </div>

        {/* Manual entry */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: T.textSec }}>Or Add Items Manually</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, color: T.textMut, display: 'block', marginBottom: 3 }}>Item Name</label>
              <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="e.g. Beef steak" style={{ ...sInput, width: 180 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textMut, display: 'block', marginBottom: 3 }}>Qty</label>
              <input value={manualQty} onChange={e => setManualQty(e.target.value)} type="number" min="0.1" step="0.1" style={{ ...sInput, width: 70 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textMut, display: 'block', marginBottom: 3 }}>Carbon (kg/unit)</label>
              <input value={manualCarbon} onChange={e => setManualCarbon(e.target.value)} type="number" min="0" step="0.1" placeholder="kg CO2e" style={{ ...sInput, width: 120 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textMut, display: 'block', marginBottom: 3 }}>Category</label>
              <select value={manualCategory} onChange={e => setManualCategory(e.target.value)} style={{ ...sInput, width: 120, padding: '10px 8px' }}>
                {['Food', 'Transport', 'Home', 'Shopping', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={handleManualAdd} style={sBtn(T.sage)}>+ Add</button>
          </div>
        </div>
      </div>

      {/* ── 3. Sample Receipts ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 600 }}>Sample Receipts</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>Try one of these pre-loaded receipts to see the parser in action.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {SAMPLE_RECEIPTS.map((s, i) => (
            <button key={i} onClick={() => setReceiptText(s.text)} style={{
              ...sBtn(T.surface, T.navy), border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 12. Merchant Category Auto-Detection ── */}
      {detectedMerchant && (
        <div style={{ ...sCard, background: T.sage + '10', borderColor: T.sage + '40' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\uD83C\uDFEA'}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Merchant Detected: <span style={{ color: T.sage }}>{detectedMerchant.name}</span></div>
              <div style={{ fontSize: 13, color: T.textSec }}>Category: {detectedMerchant.category}</div>
            </div>
          </div>
        </div>
      )}

      {parsedItems.length > 0 && (
        <>
          {/* ── 4. Parsed Results Table ── */}
          <div style={sCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Parsed Results ({parsedItems.length} items)</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addToWallet} style={sBtn(T.sage)}>Add to Carbon Wallet</button>
              </div>
            </div>
            {walletMsg && <div style={{ background: T.green + '15', color: T.green, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{walletMsg}</div>}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['#', 'Original Text', 'Matched Product', 'Qty', 'Price', 'Carbon (kg)', 'Category', 'Confidence'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: T.textSec, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((it, i) => (
                    <tr key={it.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '9px 8px' }}>{i + 1}</td>
                      <td style={{ padding: '9px 8px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.line}</td>
                      <td style={{ padding: '9px 8px', fontWeight: 600, color: T.navy }}>{it.matched_keyword}</td>
                      <td style={{ padding: '9px 8px' }}>{it.quantity} {it.unit}</td>
                      <td style={{ padding: '9px 8px' }}>{it.amount != null ? `${CURRENCY_SYMBOLS[currency].symbol}${it.amount.toFixed(2)}` : '-'}</td>
                      <td style={{ padding: '9px 8px', fontWeight: 700, color: it.carbon_kg > 10 ? T.red : it.carbon_kg > 3 ? T.amber : T.green }}>
                        {it.carbon_kg.toFixed(2)}
                      </td>
                      <td style={{ padding: '9px 8px' }}><span style={sBadge(T.navy + '15', T.navy)}>{it.category}</span></td>
                      <td style={{ padding: '9px 8px' }}>
                        <span style={sBadge(confColor(it.confidence) + '18', confColor(it.confidence))}>
                          {confLabel(it.confidence)} ({(it.confidence * 100).toFixed(0)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 5. Receipt Carbon Summary ── */}
          <div style={sCard}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600 }}>Receipt Carbon Summary</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Total */}
              <div style={{ textAlign: 'center', padding: '20px 30px', background: T.navy + '08', borderRadius: 12 }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: T.navy }}>{totalCarbon.toFixed(2)}</div>
                <div style={{ fontSize: 13, color: T.textSec, fontWeight: 600 }}>kg CO2e Total</div>
              </div>
              {/* Pie */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                      {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `${v} kg`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Equivalences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {equivs.map((eq, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surfaceH, borderRadius: 8, padding: '8px 14px' }}>
                    <span style={{ fontSize: 20 }}>{eq.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{eq.value}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{eq.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 9. Carbon by Line Item BarChart ── */}
          <div style={sCard}>
            <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon by Line Item</h3>
            <ResponsiveContainer width="100%" height={Math.max(250, barData.length * 32)}>
              <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={75} />
                <Tooltip formatter={v => `${v} kg CO2e`} />
                <Bar dataKey="carbon" fill={T.navy} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── 10. Swap & Save ── */}
          {swapSuggestions.length > 0 && (
            <div style={sCard}>
              <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Swap & Save for This Receipt</h3>
              <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>Lower-carbon alternatives for your highest-impact items.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
                {swapSuggestions.map((s, i) => {
                  const savedKg = s.carbon_kg - (s.swap.alt_carbon * s.quantity);
                  return (
                    <div key={i} style={{ background: T.green + '08', borderRadius: 10, border: `1px solid ${T.green}30`, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{s.matched_keyword}</span>
                        <span style={{ fontSize: 12, color: T.textMut }}>{s.carbon_kg.toFixed(2)} kg</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: T.red, fontWeight: 600 }}>{s.matched_keyword}</span>
                        <span style={{ color: T.textMut }}>{'\u2192'}</span>
                        <span style={{ color: T.green, fontWeight: 600 }}>{s.swap.alt}</span>
                      </div>
                      <div style={{ fontSize: 13, color: T.textSec }}>
                        Save <strong style={{ color: T.green }}>{savedKg > 0 ? savedKg.toFixed(2) : '0.00'} kg CO2e</strong> ({s.swap.save_pct}% reduction)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 6. Unmatched Items ── */}
      {unmatchedItems.length > 0 && (
        <div style={sCard}>
          <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600, color: T.amber }}>Unmatched Items ({unmatchedItems.length})</h3>
          <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
            These lines could not be matched to a product. You can manually assign a carbon value.
          </p>
          {unmatchedItems.map(um => (
            <div key={um.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontSize: 13, minWidth: 200 }}>{um.line}</span>
              {um.amount != null && <span style={{ fontSize: 12, color: T.textMut }}>{CURRENCY_SYMBOLS[currency].symbol}{um.amount.toFixed(2)}</span>}
              <input
                placeholder="Carbon (kg)"
                type="number" min="0" step="0.1"
                value={customCarbonMap[um.id] || ''}
                onChange={e => setCustomCarbonMap(prev => ({ ...prev, [um.id]: e.target.value }))}
                style={{ ...sInput, width: 110, padding: '6px 10px' }}
              />
              <select style={{ ...sInput, width: 100, padding: '6px 8px' }} id={`cat-${um.id}`} defaultValue="Other">
                {['Food', 'Transport', 'Home', 'Shopping', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
              <button
                onClick={() => {
                  const catEl = document.getElementById(`cat-${um.id}`);
                  assignUnmatched(um.id, customCarbonMap[um.id] || 0, catEl?.value || 'Other');
                }}
                style={sBtn(T.sage, '#fff')}
              >Assign</button>
            </div>
          ))}
        </div>
      )}

      {/* ── 7. Add to Carbon Wallet (prominent CTA when items exist) ── */}
      {parsedItems.length > 0 && (
        <div style={{ ...sCard, background: `linear-gradient(135deg, ${T.navy}08, ${T.sage}10)`, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Add to Your Carbon Wallet</h3>
          <p style={{ fontSize: 14, color: T.textSec, margin: '0 0 16px' }}>
            One click to save all {parsedItems.length} parsed items ({totalCarbon.toFixed(2)} kg CO2e) to your wallet for ongoing tracking.
          </p>
          <button onClick={addToWallet} style={{ ...sBtn(T.sage), fontSize: 16, padding: '14px 36px', borderRadius: 12 }}>
            Add {parsedItems.length} Items to Carbon Wallet
          </button>
          {walletMsg && <div style={{ marginTop: 10, color: T.green, fontWeight: 600, fontSize: 14 }}>{walletMsg}</div>}
        </div>
      )}

      {/* ── 8. Receipt History ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Receipt History</h3>
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: T.textMut }}>No receipts parsed yet. Paste a receipt above to get started.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'Date', 'Items', 'Total Carbon (kg)', 'Preview'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textSec, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px' }}>{i + 1}</td>
                    <td style={{ padding: '8px' }}>{h.date}</td>
                    <td style={{ padding: '8px' }}>{h.itemCount}</td>
                    <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{h.totalCarbon?.toFixed(2)}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: T.textMut, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.snippet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 11. Receipt Photo Placeholder ── */}
      <div style={sCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: T.gold + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {'\uD83D\uDCF7'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Receipt Photo Scanner</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSec }}>
              Coming Soon: Take a photo of your receipt and we will auto-extract items using OCR technology.
            </p>
          </div>
          <span style={sBadge(T.amber + '18', T.amber)}>Coming Soon</span>
        </div>
      </div>

      {/* ── 13. Multi-Currency Info ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Multi-Currency Support</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          Prices on receipts are parsed in the selected currency. Carbon calculations are currency-independent (based on item weight/quantity).
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(CURRENCY_SYMBOLS).map(([code, { symbol, rate }]) => (
            <div key={code} style={{
              padding: '10px 18px', borderRadius: 10, background: currency === code ? T.navy + '10' : T.surfaceH,
              border: `1px solid ${currency === code ? T.navy + '40' : T.border}`, cursor: 'pointer',
            }} onClick={() => setCurrency(code)}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{symbol}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>{code}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>1 USD = {(1 / rate).toFixed(2)} {code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Product Reference ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Product Carbon Reference ({KEYWORD_LIST.length} Products)</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          These are the products the parser can automatically detect and assign carbon values to.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
          {KEYWORD_LIST.sort().map(kw => {
            const d = RECEIPT_KEYWORDS[kw];
            return (
              <div key={kw} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: T.surfaceH, fontSize: 12 }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{kw}</span>
                <span style={{ color: d.carbon_per_unit > 10 ? T.red : d.carbon_per_unit > 3 ? T.amber : T.green, fontWeight: 700 }}>
                  {d.carbon_per_unit} kg/{d.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Carbon Impact Comparison ── */}
      {parsedItems.length > 0 && (
        <div style={sCard}>
          <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Carbon Impact Comparison</h3>
          <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
            See how your receipt items compare to common daily activities.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {parsedItems.slice(0, 8).map((it, i) => {
              const drivingKm = (it.carbon_kg / 0.21).toFixed(1);
              const phoneDays = (it.carbon_kg / 0.008 / 365).toFixed(2);
              const showerMins = (it.carbon_kg / 0.037).toFixed(0);
              return (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: T.navy, textTransform: 'capitalize' }}>
                    {it.matched_keyword} ({it.carbon_kg.toFixed(2)} kg)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>Equivalent driving</span>
                      <span style={{ fontWeight: 600 }}>{drivingKm} km</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>Phone charging days</span>
                      <span style={{ fontWeight: 600 }}>{phoneDays} days</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>Shower minutes</span>
                      <span style={{ fontWeight: 600 }}>{showerMins} min</span>
                    </div>
                    {/* Impact bar */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${Math.min((it.carbon_kg / 30) * 100, 100)}%`,
                          background: it.carbon_kg > 15 ? T.red : it.carbon_kg > 5 ? T.amber : T.green,
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category Breakdown Stats ── */}
      {parsedItems.length > 0 && (
        <div style={sCard}>
          <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Category Breakdown Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {categoryBreakdown.map((cat, i) => {
              const catItems = parsedItems.filter(p => p.category === cat.name);
              const avgCarbon = catItems.length > 0 ? (cat.value / catItems.length).toFixed(2) : 0;
              const maxItem = catItems.reduce((m, c) => c.carbon_kg > (m?.carbon_kg || 0) ? c : m, null);
              const pct = totalCarbon > 0 ? ((cat.value / totalCarbon) * 100).toFixed(1) : 0;
              return (
                <div key={i} style={{
                  background: T.surface, borderRadius: 12, padding: 18,
                  border: `1px solid ${T.border}`, borderLeft: `4px solid ${PIE_COLORS[i % PIE_COLORS.length]}`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: PIE_COLORS[i % PIE_COLORS.length] }}>{cat.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>Total Carbon</span>
                      <span style={{ fontWeight: 700 }}>{cat.value} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>% of Total</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>Items</span>
                      <span style={{ fontWeight: 600 }}>{catItems.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: T.textSec }}>Avg per Item</span>
                      <span style={{ fontWeight: 600 }}>{avgCarbon} kg</span>
                    </div>
                    {maxItem && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: T.textSec }}>Highest</span>
                        <span style={{ fontWeight: 600, color: T.red, textTransform: 'capitalize' }}>{maxItem.matched_keyword}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confidence Distribution ── */}
      {parsedItems.length > 0 && (() => {
        const highConf = parsedItems.filter(i => i.confidence >= 0.9).length;
        const medConf = parsedItems.filter(i => i.confidence >= 0.7 && i.confidence < 0.9).length;
        const lowConf = parsedItems.filter(i => i.confidence < 0.7).length;
        const confData = [
          { name: 'High (90%+)', value: highConf, fill: T.green },
          { name: 'Medium (70-89%)', value: medConf, fill: T.amber },
          { name: 'Low (<70%)', value: lowConf, fill: T.red },
        ].filter(d => d.value > 0);
        return (
          <div style={sCard}>
            <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Match Confidence Distribution</h3>
            <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
              How confident are we in the carbon calculations for each matched item?
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={confData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label>
                    {confData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {confData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: d.fill }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}: {d.value} items</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: T.textMut, marginTop: 6 }}>
                  Higher confidence means the keyword exactly matched a known product.
                  Lower confidence items may benefit from manual verification.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Quick Tips ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Tips for Better Parsing</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {[
            { title: 'Include Quantities', desc: 'Adding "2kg" or "3x" next to items helps calculate accurate totals. E.g., "Chicken 2kg $11.99".' },
            { title: 'One Item Per Line', desc: 'The parser works best when each product is on its own line, mimicking a real receipt format.' },
            { title: 'Use Common Names', desc: 'Use simple product names like "beef", "milk", "eggs". Avoid brand names that may not be recognized.' },
            { title: 'Include Prices', desc: 'Adding prices ($, EUR, GBP, INR, JPY) helps track spending alongside carbon for intensity analysis.' },
            { title: 'Store Names Help', desc: 'Including the store name (e.g., Walmart, Shell) enables automatic merchant category detection.' },
            { title: 'Assign Unmatched', desc: 'Items that are not auto-matched can be manually assigned a carbon value for complete tracking.' },
          ].map((tip, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: T.navy }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Receipt Statistics (when history exists) ── */}
      {history.length >= 2 && (
        <div style={sCard}>
          <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Your Parsing Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
            {[
              { label: 'Receipts Parsed', value: history.length, color: T.navy },
              { label: 'Total Items Tracked', value: history.reduce((s, h) => s + h.itemCount, 0), color: T.sage },
              { label: 'Total Carbon Tracked', value: `${history.reduce((s, h) => s + (h.totalCarbon || 0), 0).toFixed(1)} kg`, color: T.red },
              { label: 'Avg Items/Receipt', value: (history.reduce((s, h) => s + h.itemCount, 0) / history.length).toFixed(1), color: T.gold },
              { label: 'Avg Carbon/Receipt', value: `${(history.reduce((s, h) => s + (h.totalCarbon || 0), 0) / history.length).toFixed(1)} kg`, color: T.amber },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 16, background: s.color + '08', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── How It Works ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>How It Works</h3>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {[
            { step: '1', title: 'Paste Receipt', desc: 'Paste your receipt text or enter items manually into the input panel.' },
            { step: '2', title: 'Auto-Match', desc: 'Our parser scans each line against 50+ product keywords with carbon emission data.' },
            { step: '3', title: 'Review Results', desc: 'See matched items with carbon values, confidence scores, and category assignments.' },
            { step: '4', title: 'Handle Unmatched', desc: 'Manually assign carbon values to items that were not automatically recognized.' },
            { step: '5', title: 'Save to Wallet', desc: 'Add all parsed items to your Carbon Wallet for ongoing spending & carbon tracking.' },
          ].map((s, i) => (
            <div key={i} style={{ flex: '1 1 180px', minWidth: 160, textAlign: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: T.navy, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                fontWeight: 800, fontSize: 18,
              }}>{s.step}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Sources ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600, color: T.textSec }}>Data Sources & Methodology</h3>
        <div style={{ fontSize: 12, color: T.textMut, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 6px' }}>Carbon emission factors sourced from DEFRA (UK Department for Environment, Food & Rural Affairs), EPA (US Environmental Protection Agency), and IPCC (Intergovernmental Panel on Climate Change) guidelines.</p>
          <p style={{ margin: '0 0 6px' }}>Food emission factors represent cradle-to-retail lifecycle assessments including production, processing, and distribution. Transport factors include direct combustion emissions. Home energy factors are based on national grid averages.</p>
          <p style={{ margin: 0 }}>Match confidence reflects keyword specificity: exact product matches score higher than general category matches. All values are estimates for consumer guidance and should not be used for regulatory compliance.</p>
        </div>
      </div>

      {/* ── Frequently Asked Questions ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Frequently Asked Questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'How accurate are the carbon calculations?', a: 'Our emission factors come from peer-reviewed sources (DEFRA, EPA, IPCC). They represent average lifecycle emissions for each product category. Actual emissions may vary by region, production method, and supply chain.' },
            { q: 'Can I parse receipts from any store?', a: 'Yes! The parser works with plain text from any receipt. It matches product keywords regardless of store format. For best results, ensure each item is on a separate line.' },
            { q: 'What happens to my data?', a: 'All data is stored locally in your browser (localStorage). Nothing is sent to external servers. You own your data completely.' },
            { q: 'Why are some items unmatched?', a: 'The parser recognizes 50+ common product keywords. Brand names, store-specific codes, or unusual items may not match. You can manually assign carbon values to any unmatched item.' },
            { q: 'How does "Add to Wallet" work?', a: 'It saves each parsed item as an individual transaction in your Carbon Wallet (ra_carbon_wallet_v1). This enables long-term tracking and spending analysis in the Spending Carbon Analyzer.' },
            { q: 'Are currency conversions accurate?', a: 'Currency rates are approximate and used for display purposes. Carbon calculations are based on product quantity, not price, so currency does not affect the carbon footprint results.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: T.navy }}>{faq.q}</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Carbon Products Leaderboard ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Top Carbon Products Leaderboard</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 14px' }}>
          The highest carbon-intensity products in our database. Know what to watch out for on your next shopping trip.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          {KEYWORD_LIST
            .map(kw => ({ keyword: kw, ...RECEIPT_KEYWORDS[kw] }))
            .sort((a, b) => b.carbon_per_unit - a.carbon_per_unit)
            .slice(0, 12)
            .map((p, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 10, textAlign: 'center',
                background: i < 3 ? T.red + '08' : i < 6 ? T.amber + '08' : T.surfaceH,
                border: `1px solid ${i < 3 ? T.red + '20' : T.border}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: i < 3 ? T.red : i < 6 ? T.amber : T.navy }}>
                  #{i + 1}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize', marginTop: 4 }}>{p.keyword}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.red, marginTop: 4 }}>{p.carbon_per_unit}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>kg CO2e / {p.unit}</div>
              </div>
            ))}
        </div>
      </div>

      {/* ── 14. Exports & Cross-Nav ── */}
      <div style={sCard}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Export & Navigate</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} disabled={parsedItems.length === 0} style={{ ...sBtn(T.navy), opacity: parsedItems.length === 0 ? 0.4 : 1 }}>Export Parsed Receipt (CSV)</button>
          <button onClick={exportJSON} disabled={parsedItems.length === 0} style={{ ...sBtn(T.sage), opacity: parsedItems.length === 0 ? 0.4 : 1 }}>Export Carbon Summary (JSON)</button>
          <button onClick={handlePrint} style={sBtn(T.gold, T.navy)}>Print Report</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('/carbon-calculator')} style={sBtn(T.navyL)}>Carbon Calculator</button>
          <button onClick={() => navigate('/carbon-wallet')} style={sBtn(T.sage)}>Carbon Wallet</button>
          <button onClick={() => navigate('/spending-carbon')} style={sBtn(T.gold, T.navy)}>Spending Analyzer</button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '20px 0 8px', fontSize: 12, color: T.textMut }}>
        EP-Z3 Invoice & Receipt Carbon Parser &middot; Sprint Z Consumer Carbon Intelligence &middot; Data: DEFRA, EPA, IPCC emission factors
      </div>
    </div>
  );
}
