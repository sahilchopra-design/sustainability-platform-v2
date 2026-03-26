import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area, ComposedChart,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#16a34a','#9333ea'];

/* =================================================================
   FINANCIAL FLOW MODEL
   ================================================================= */
const FINANCIAL_FLOWS = {
  ev_battery: {
    name: 'EV Battery Pack (75 kWh NMC811)', icon: '\ud83d\udd0b',
    stages: [
      { stage:'Raw Materials', cost_usd:3800, components:[
        { material:'Lithium', quantity_kg:8.9, price_per_kg:12.5, cost:111, commodity_id:'LITHIUM' },
        { material:'Cobalt', quantity_kg:4.4, price_per_kg:28.0, cost:123, commodity_id:'COBALT' },
        { material:'Nickel', quantity_kg:39.0, price_per_kg:16.2, cost:632, commodity_id:'NICKEL' },
        { material:'Graphite', quantity_kg:53.0, price_per_kg:0.65, cost:34, commodity_id:'GRAPHITE' },
        { material:'Copper', quantity_kg:22.0, price_per_kg:8.95, cost:197, commodity_id:'COPPER' },
        { material:'Aluminum', quantity_kg:35.0, price_per_kg:2.35, cost:82, commodity_id:'ALUMINUM' },
        { material:'Other (electrolyte, separator, casing)', quantity_kg:null, price_per_kg:null, cost:2621 },
      ]},
      { stage:'Cell Manufacturing', cost_usd:2200, value_add:2200, labor_pct:15, energy_pct:25, depreciation_pct:30, margin_pct:12 },
      { stage:'Pack Assembly', cost_usd:800, value_add:800, labor_pct:20, energy_pct:10, BMS_cost:350, margin_pct:8 },
      { stage:'Distribution & Logistics', cost_usd:400, value_add:400, shipping:250, insurance:50, warehousing:100, margin_pct:5 },
      { stage:'OEM Integration', cost_usd:1500, value_add:1500, margin_pct:18 },
    ],
    final_price_usd:8700, externality_cost_usd:1250, true_cost_usd:9950,
    end_of_life_value_usd:650, scrap_value_usd:120,
    gwp_total_kg:8350, water_total_l:88500,
  },
  solar_panel: {
    name: 'Solar Panel (400W Mono-Si)', icon: '\u2600\ufe0f',
    stages: [
      { stage:'Raw Materials', cost_usd:45, components:[
        { material:'Silicon Wafer', quantity_kg:1.8, price_per_kg:8.5, cost:15, commodity_id:'SILICON' },
        { material:'Silver Paste', quantity_kg:0.02, price_per_kg:850, cost:17, commodity_id:'SILVER' },
        { material:'Copper Ribbon', quantity_kg:0.15, price_per_kg:8.95, cost:1.3, commodity_id:'COPPER' },
        { material:'Aluminum Frame', quantity_kg:2.5, price_per_kg:2.35, cost:5.9, commodity_id:'ALUMINUM' },
        { material:'Glass', quantity_kg:8.0, price_per_kg:0.4, cost:3.2, commodity_id:'GLASS' },
        { material:'Other (EVA, backsheet, junction box)', quantity_kg:null, price_per_kg:null, cost:2.6 },
      ]},
      { stage:'Cell Manufacturing', cost_usd:35, value_add:35, labor_pct:12, energy_pct:35, depreciation_pct:28, margin_pct:10 },
      { stage:'Module Assembly', cost_usd:25, value_add:25, labor_pct:18, energy_pct:8, margin_pct:12 },
      { stage:'Distribution & Logistics', cost_usd:15, value_add:15, shipping:10, insurance:2, warehousing:3, margin_pct:6 },
      { stage:'Installation', cost_usd:80, value_add:80, labor_pct:55, margin_pct:15 },
    ],
    final_price_usd:200, externality_cost_usd:18, true_cost_usd:218,
    end_of_life_value_usd:8, scrap_value_usd:2,
    gwp_total_kg:580, water_total_l:15300,
  },
  steel_beam: {
    name: 'Structural Steel Beam (1 tonne)', icon: '\ud83c\udfd7\ufe0f',
    stages: [
      { stage:'Raw Materials', cost_usd:180, components:[
        { material:'Iron Ore', quantity_kg:1600, price_per_kg:0.08, cost:128, commodity_id:'IRON_ORE' },
        { material:'Coking Coal', quantity_kg:450, price_per_kg:0.09, cost:40.5, commodity_id:'COAL' },
        { material:'Limestone', quantity_kg:80, price_per_kg:0.02, cost:1.6, commodity_id:'LIMESTONE' },
        { material:'Manganese', quantity_kg:15, price_per_kg:0.45, cost:6.75, commodity_id:'MANGANESE' },
        { material:'Other (alloys, scrap)', quantity_kg:null, price_per_kg:null, cost:3.15 },
      ]},
      { stage:'Steelmaking (BF-BOF)', cost_usd:280, value_add:280, labor_pct:10, energy_pct:40, depreciation_pct:25, margin_pct:8 },
      { stage:'Rolling & Finishing', cost_usd:120, value_add:120, labor_pct:15, energy_pct:20, margin_pct:10 },
      { stage:'Distribution', cost_usd:65, value_add:65, shipping:45, insurance:8, warehousing:12, margin_pct:7 },
      { stage:'Construction Integration', cost_usd:155, value_add:155, labor_pct:35, margin_pct:14 },
    ],
    final_price_usd:800, externality_cost_usd:95, true_cost_usd:895,
    end_of_life_value_usd:280, scrap_value_usd:180,
    gwp_total_kg:2130, water_total_l:33200,
  },
  palm_oil_tonne: {
    name: 'Crude Palm Oil (1 tonne)', icon: '\ud83c\udf34',
    stages: [
      { stage:'Plantation & Harvest', cost_usd:220, components:[
        { material:'Fresh Fruit Bunches', quantity_kg:5000, price_per_kg:0.035, cost:175, commodity_id:'PALM_FRUIT' },
        { material:'Fertilizer', quantity_kg:120, price_per_kg:0.30, cost:36, commodity_id:'FERTILIZER' },
        { material:'Diesel (machinery)', quantity_kg:15, price_per_kg:0.60, cost:9, commodity_id:'DIESEL' },
      ]},
      { stage:'Milling & Extraction', cost_usd:85, value_add:85, labor_pct:20, energy_pct:30, margin_pct:10 },
      { stage:'Refining', cost_usd:65, value_add:65, labor_pct:10, energy_pct:25, depreciation_pct:20, margin_pct:12 },
      { stage:'Shipping & Trade', cost_usd:130, value_add:130, shipping:95, insurance:15, warehousing:20, margin_pct:8 },
      { stage:'Food Processing', cost_usd:200, value_add:200, labor_pct:15, margin_pct:18 },
    ],
    final_price_usd:700, externality_cost_usd:420, true_cost_usd:1120,
    end_of_life_value_usd:25, scrap_value_usd:5,
    gwp_total_kg:3000, water_total_l:28300,
  },
  cotton_tshirt: {
    name: 'Cotton T-Shirt', icon: '\ud83d\udc55',
    stages: [
      { stage:'Raw Cotton', cost_usd:1.20, components:[
        { material:'Raw Cotton', quantity_kg:0.25, price_per_kg:2.80, cost:0.70, commodity_id:'COTTON' },
        { material:'Polyester Thread', quantity_kg:0.02, price_per_kg:1.50, cost:0.03, commodity_id:'POLYESTER' },
        { material:'Dyes & Chemicals', quantity_kg:0.03, price_per_kg:12.0, cost:0.36, commodity_id:'DYES' },
        { material:'Other (buttons, labels)', quantity_kg:null, price_per_kg:null, cost:0.11 },
      ]},
      { stage:'Spinning & Weaving', cost_usd:1.80, value_add:1.80, labor_pct:25, energy_pct:20, margin_pct:8 },
      { stage:'Dyeing & Finishing', cost_usd:1.50, value_add:1.50, labor_pct:20, energy_pct:30, depreciation_pct:15, margin_pct:10 },
      { stage:'Garment Assembly', cost_usd:2.50, value_add:2.50, labor_pct:60, margin_pct:5 },
      { stage:'Brand/Retail Markup', cost_usd:18.00, value_add:18.00, labor_pct:5, margin_pct:55 },
    ],
    final_price_usd:25.00, externality_cost_usd:4.50, true_cost_usd:29.50,
    end_of_life_value_usd:0.15, scrap_value_usd:0.02,
    gwp_total_kg:10.3, water_total_l:7750,
  },
  smartphone: {
    name: 'Smartphone (Mid-Range)', icon: '\ud83d\udcf1',
    stages: [
      { stage:'Raw Materials', cost_usd:38, components:[
        { material:'Cobalt (battery)', quantity_kg:0.008, price_per_kg:28, cost:0.22, commodity_id:'COBALT' },
        { material:'Lithium (battery)', quantity_kg:0.003, price_per_kg:12.5, cost:0.04, commodity_id:'LITHIUM' },
        { material:'Copper (PCB)', quantity_kg:0.015, price_per_kg:8.95, cost:0.13, commodity_id:'COPPER' },
        { material:'Gold (connectors)', quantity_kg:0.00003, price_per_kg:65000, cost:1.95, commodity_id:'GOLD' },
        { material:'Tantalum (capacitors)', quantity_kg:0.0004, price_per_kg:280, cost:0.11, commodity_id:'TANTALUM' },
        { material:'Rare Earths', quantity_kg:0.001, price_per_kg:45, cost:0.05, commodity_id:'RARE_EARTHS' },
        { material:'Other (silicon, glass, plastics)', quantity_kg:null, price_per_kg:null, cost:35.50 },
      ]},
      { stage:'Component Manufacturing', cost_usd:85, value_add:85, labor_pct:8, energy_pct:15, depreciation_pct:40, margin_pct:15 },
      { stage:'Device Assembly', cost_usd:22, value_add:22, labor_pct:55, energy_pct:5, margin_pct:6 },
      { stage:'Distribution & Retail', cost_usd:55, value_add:55, shipping:12, insurance:3, warehousing:8, margin_pct:25 },
      { stage:'Brand Premium', cost_usd:200, value_add:200, margin_pct:65 },
    ],
    final_price_usd:400, externality_cost_usd:28, true_cost_usd:428,
    end_of_life_value_usd:12, scrap_value_usd:1.50,
    gwp_total_kg:78, water_total_l:6980,
  },
};

/* =================================================================
   EXTERNALITY PRICING
   ================================================================= */
const EXTERNALITY_PRICES = {
  carbon: { price: 51, unit: 'USD/tonne CO\u2082e', source: 'EPA Social Cost of Carbon (2024)', color: '#dc2626' },
  water: { price: 2.5, unit: 'USD/megalitre', source: 'Shadow price in stressed regions', color: '#06b6d4' },
  air_pollution: { price: 8.5, unit: 'USD/tonne SOx/NOx', source: 'WHO health cost estimates', color: '#d97706' },
  biodiversity: { price: 15, unit: 'USD/hectare-year', source: 'Ecosystem service valuation (TEEB)', color: '#16a34a' },
  child_labor: { price: null, unit: 'Incalculable', source: 'ILO flagged \u2014 not monetized', color: '#7c3aed' },
  deforestation: { price: 500, unit: 'USD/hectare', source: 'Carbon + biodiversity loss', color: '#65a30d' },
};

const GREEN_PREMIUMS = [
  { product:'Green Steel (H2-DRI)', conventional:'Steel Beam', premium_pct:25, co2_reduction_pct:90, status:'Pilot (SSAB, H2GS)' },
  { product:'Organic Cotton T-Shirt', conventional:'Cotton T-Shirt', premium_pct:40, co2_reduction_pct:46, status:'Available' },
  { product:'Recycled Li-ion Battery', conventional:'EV Battery', premium_pct:12, co2_reduction_pct:70, status:'Scaling (Redwood, Li-Cycle)' },
  { product:'Recycled Solar Panel', conventional:'Solar Panel', premium_pct:8, co2_reduction_pct:35, status:'Emerging' },
  { product:'RSPO Certified Palm Oil', conventional:'Palm Oil', premium_pct:15, co2_reduction_pct:55, status:'Available' },
  { product:'Fairphone (Modular)', conventional:'Smartphone', premium_pct:35, co2_reduction_pct:30, status:'Available' },
];

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const LS_FF   = 'ra_financial_flow_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const fmtUSD = (n) => n == null ? '\u2014' : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;
const pct = (n) => n == null ? '\u2014' : `${(n).toFixed(1)}%`;

/* =================================================================
   UI COMPONENTS
   ================================================================= */
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${accent||T.border}`, borderRadius:10, padding:'14px 16px', borderTop:`3px solid ${accent||T.gold}` }}>
    <div style={{ fontSize:10, color:T.textMut, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:3, fontFamily:T.font }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:T.font }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style:sx }) => (
  <button onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:8, border:`1px solid ${active?T.navy:T.border}`, background:active?T.navy:T.surface, color:active?'#fff':T.text, fontWeight:600, fontSize:small?12:13, cursor:'pointer', fontFamily:T.font, transition:'all .15s', ...sx }}>{children}</button>
);

const Section = ({ title, children, badge }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${T.gold}` }}>
      <span style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</span>
      {badge && <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:T.gold+'22', color:T.gold, fontWeight:700, fontFamily:T.font }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const SortHeader = ({ label, col, sortCol, sortDir, onSort }) => (
  <th onClick={() => onSort(col)} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, cursor:'pointer', userSelect:'none', borderBottom:`2px solid ${T.gold}`, textAlign:'left', fontFamily:T.font, whiteSpace:'nowrap' }}>
    {label} {sortCol === col ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : '\u25bd'}
  </th>
);

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function FinancialFlowPage() {
  const navigate = useNavigate();

  /* ---- portfolio -------------------------------------------------- */
  const portfolioRaw = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const data = saved || { portfolios:{}, activePortfolio:null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({
      ...c, company_name: c.company_name || c.company || `Company ${i+1}`,
      sector: c.sector || 'Diversified', weight: c.weight || 1,
      commodity_sensitivity: Math.round(5 + seed(i*31) * 35),
      revenue_mn: Math.round(500 + seed(i*37) * 9500),
    }));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return { ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, weight: h.weight || 1,
        commodity_sensitivity: Math.round(5 + seed(i*31) * 35), revenue_mn: Math.round(500 + seed(i*37) * 9500) };
    });
  }, [portfolioRaw]);

  /* ---- state ------------------------------------------------------ */
  const [selectedProduct, setSelectedProduct] = useState('ev_battery');
  const [sortCol, setSortCol] = useState('cost');
  const [sortDir, setSortDir] = useState('desc');
  const [priceSliders, setPriceSliders] = useState({});

  const flow = useMemo(() => FINANCIAL_FLOWS[selectedProduct], [selectedProduct]);

  /* ---- commodity price sensitivity -------------------------------- */
  const adjustedBOM = useMemo(() => {
    if (!flow) return [];
    const rawStage = flow.stages.find(s => s.components);
    if (!rawStage) return [];
    return rawStage.components.map(c => {
      const slider = priceSliders[c.commodity_id] ?? 0;
      const factor = 1 + slider / 100;
      const newPrice = c.price_per_kg ? c.price_per_kg * factor : null;
      const newCost = c.price_per_kg ? c.quantity_kg * newPrice : c.cost;
      return { ...c, adjusted_price: newPrice, adjusted_cost: newCost, change_pct: slider };
    });
  }, [flow, priceSliders]);

  const adjustedRawTotal = useMemo(() => adjustedBOM.reduce((s, c) => s + (c.adjusted_cost || 0), 0), [adjustedBOM]);
  const originalRawTotal = useMemo(() => flow?.stages?.[0]?.cost_usd || 0, [flow]);
  const rawDelta = adjustedRawTotal - originalRawTotal;
  const adjustedFinalPrice = useMemo(() => (flow?.final_price_usd || 0) + rawDelta, [flow, rawDelta]);

  /* ---- waterfall chart data --------------------------------------- */
  const waterfallData = useMemo(() => {
    if (!flow) return [];
    let running = 0;
    const bars = flow.stages.map((s, i) => {
      const val = i === 0 ? adjustedRawTotal : s.cost_usd;
      const start = running;
      running += val;
      return { name: s.stage, value: val, start, end: running, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
    bars.push({ name: 'Final Price', value: adjustedFinalPrice, start: 0, end: adjustedFinalPrice, color: T.navy });
    return bars;
  }, [flow, adjustedRawTotal, adjustedFinalPrice]);

  /* ---- value-add distribution ------------------------------------- */
  const valueAddData = useMemo(() => {
    if (!flow) return [];
    return flow.stages.filter(s => s.value_add || s.components).map(s => ({
      name: s.stage, materials: s.components ? adjustedRawTotal : 0,
      labor: (s.value_add || 0) * (s.labor_pct || 0) / 100,
      energy: (s.value_add || 0) * (s.energy_pct || 0) / 100,
      capital: (s.value_add || 0) * (s.depreciation_pct || 0) / 100,
      margin: (s.value_add || 0) * (s.margin_pct || 0) / 100,
    }));
  }, [flow, adjustedRawTotal]);

  /* ---- externality breakdown -------------------------------------- */
  const externalityBreakdown = useMemo(() => {
    if (!flow) return [];
    const gwp = flow.gwp_total_kg || 0;
    const water = flow.water_total_l || 0;
    return [
      { category: 'Carbon (CO\u2082e)', cost: (gwp / 1000) * EXTERNALITY_PRICES.carbon.price, color: EXTERNALITY_PRICES.carbon.color },
      { category: 'Water Use', cost: (water / 1e6) * EXTERNALITY_PRICES.water.price * 1000, color: EXTERNALITY_PRICES.water.color },
      { category: 'Air Pollution', cost: (gwp / 1000) * 0.15 * EXTERNALITY_PRICES.air_pollution.price, color: EXTERNALITY_PRICES.air_pollution.color },
      { category: 'Biodiversity', cost: EXTERNALITY_PRICES.biodiversity.price * (selectedProduct === 'palm_oil_tonne' ? 8 : 0.5), color: EXTERNALITY_PRICES.biodiversity.color },
      { category: 'Deforestation', cost: selectedProduct === 'palm_oil_tonne' ? 250 : selectedProduct === 'cotton_tshirt' ? 0.5 : 2, color: EXTERNALITY_PRICES.deforestation.color },
    ].map(e => ({ ...e, cost: Math.round(e.cost * 100) / 100 }));
  }, [flow, selectedProduct]);

  const totalExternality = useMemo(() => externalityBreakdown.reduce((s, e) => s + e.cost, 0), [externalityBreakdown]);

  /* ---- margin by country ------------------------------------------ */
  const marginByCountry = useMemo(() => {
    const countries = ['China','Australia','Chile','Indonesia','India','Germany','USA','Japan','South Korea','Brazil'];
    return countries.map((c, i) => {
      const s = seed(i * 19 + (selectedProduct?.length || 3));
      return {
        country: c,
        extraction_margin: Math.round(s * 12 + 3),
        processing_margin: Math.round(seed(i*23)*15 + 5),
        manufacturing_margin: Math.round(seed(i*29)*18 + 8),
        total_value_capture_pct: Math.round(3 + s * 22),
      };
    }).sort((a, b) => b.total_value_capture_pct - a.total_value_capture_pct).slice(0, 8);
  }, [selectedProduct]);

  /* ---- portfolio commodity sensitivity ---------------------------- */
  const portfolioSensitivity = useMemo(() => {
    return holdings.slice(0, 15).map((h, i) => ({
      company: h.company_name,
      sector: h.sector,
      sensitivity: h.commodity_sensitivity,
      revenue_mn: h.revenue_mn,
      impact_mn: Math.round(h.revenue_mn * h.commodity_sensitivity / 1000),
      top_commodity: ['Lithium','Copper','Nickel','Steel','Palm Oil','Cotton','Gold','Cobalt','Aluminum','Silver'][i % 10],
    }));
  }, [holdings]);

  /* ---- sort handler ----------------------------------------------- */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const sortedBOM = useMemo(() => {
    return [...adjustedBOM].sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [adjustedBOM, sortCol, sortDir]);

  /* ---- exports ---------------------------------------------------- */
  const exportCSV = useCallback(() => {
    const headers = ['Stage','Cost USD','Value Add','Labor %','Energy %','Margin %'];
    const rows = flow.stages.map(s => [s.stage, s.cost_usd, s.value_add||'', s.labor_pct||'', s.energy_pct||'', s.margin_pct||'']);
    rows.push(['FINAL PRICE', adjustedFinalPrice,'','','','']);
    rows.push(['EXTERNALITY COST', totalExternality,'','','','']);
    rows.push(['TRUE COST', adjustedFinalPrice + totalExternality,'','','','']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Financial_Flow_${flow?.name || 'product'}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [flow, adjustedFinalPrice, totalExternality]);

  const exportJSON = useCallback(() => {
    const data = { product: flow?.name, stages: flow?.stages, adjustedBOM, finalPrice: adjustedFinalPrice, externalityCost: totalExternality, trueCost: adjustedFinalPrice + totalExternality, endOfLifeValue: flow?.end_of_life_value_usd, scrapValue: flow?.scrap_value_usd, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `True_Cost_${flow?.name || 'product'}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [flow, adjustedBOM, adjustedFinalPrice, totalExternality]);

  const exportPrint = useCallback(() => window.print(), []);

  /* ---- derived KPIs ----------------------------------------------- */
  const trueCostGap = useMemo(() => {
    const gap = totalExternality;
    const pctGap = flow ? (gap / flow.final_price_usd * 100) : 0;
    return { gap, pctGap };
  }, [flow, totalExternality]);

  const CROSS_NAV = [
    { label:'Commodity Intelligence', path:'/commodity-intelligence' },
    { label:'Lifecycle Assessment', path:'/lifecycle-assessment' },
    { label:'Supply Chain', path:'/supply-chain' },
    { label:'IWA Classification', path:'/iwa-classification' },
    { label:'Carbon Budget', path:'/carbon-budget' },
  ];

  const PRODUCT_KEYS = Object.keys(FINANCIAL_FLOWS);

  /* ================================================================= */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* 1. Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:T.navy, margin:0 }}>Financial Flow Analyzer</h1>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {['Price \u2192 Value-Add \u2192 Retail \u2192 Scrap','Externalities','True Cost Accounting'].map(b => (
              <span key={b} style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:T.gold+'20', color:T.gold, fontWeight:700 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* 2. Product Selector */}
      <Section title="Product Financial Flow Selector" badge={`${PRODUCT_KEYS.length} Products`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
          {PRODUCT_KEYS.map(k => {
            const f = FINANCIAL_FLOWS[k];
            return (
              <div key={k} onClick={() => { setSelectedProduct(k); setPriceSliders({}); }}
                style={{ background: selectedProduct===k ? T.navy : T.surface, color: selectedProduct===k ? '#fff' : T.text, border:`1px solid ${selectedProduct===k?T.navy:T.border}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{f.icon}</div>
                <div style={{ fontSize:12, fontWeight:700 }}>{f.name}</div>
                <div style={{ fontSize:11, opacity:0.7, marginTop:2 }}>Final: {fmtUSD(f.final_price_usd)}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. KPI Cards (8) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))', gap:12, marginBottom:24 }}>
        <KPI label="Raw Material Cost" value={fmtUSD(adjustedRawTotal)} sub={`${((adjustedRawTotal/(adjustedFinalPrice||1))*100).toFixed(0)}% of final price`} accent={T.navy} />
        <KPI label="Total Value-Add" value={fmtUSD(adjustedFinalPrice - adjustedRawTotal)} sub="Processing through retail" accent={T.gold} />
        <KPI label="Final Market Price" value={fmtUSD(adjustedFinalPrice)} sub={rawDelta !== 0 ? `${rawDelta > 0 ? '+' : ''}${fmtUSD(rawDelta)} from base` : 'At base price'} accent={T.sage} />
        <KPI label="True Cost (w/ Externalities)" value={fmtUSD(adjustedFinalPrice + totalExternality)} sub="Market + environmental costs" accent={T.red} />
        <KPI label="Externality Cost" value={fmtUSD(totalExternality)} sub={`${trueCostGap.pctGap.toFixed(1)}% hidden cost`} accent={T.amber} />
        <KPI label="End-of-Life Value" value={fmtUSD(flow?.end_of_life_value_usd)} sub="Recycled material recovery" accent={T.green} />
        <KPI label="Scrap Value" value={fmtUSD(flow?.scrap_value_usd)} sub="If landfilled" accent={T.textMut} />
        <KPI label="True Cost Gap" value={`${trueCostGap.pctGap.toFixed(1)}%`} sub="Price vs true cost delta" accent={T.red} />
      </div>

      {/* 4. Financial Flow Waterfall */}
      <Section title="Financial Flow Waterfall" badge="Cost Build-Up">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}` }} />
            <Bar dataKey="value" name="Cost (USD)">
              {waterfallData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
            <Line dataKey="end" type="stepAfter" stroke={T.red} strokeWidth={2} dot={false} name="Cumulative" />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Externality overlay bar */}
        <div style={{ display:'flex', gap:12, marginTop:10, alignItems:'center' }}>
          <div style={{ height:12, flex:`0 0 ${Math.min(80, trueCostGap.pctGap * 2)}%`, background:`${T.red}30`, borderRadius:6, border:`1px solid ${T.red}40`, position:'relative' }}>
            <div style={{ position:'absolute', right:8, top:-1, fontSize:10, fontWeight:700, color:T.red }}>+{fmtUSD(totalExternality)} externalities</div>
          </div>
        </div>
      </Section>

      {/* 5. Bill of Materials Table */}
      <Section title="Bill of Materials" badge={`${adjustedBOM.length} Components`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                <SortHeader label="Material" col="material" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Qty (kg)" col="quantity_kg" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Unit Price ($/kg)" col="price_per_kg" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Adj. Price" col="adjusted_price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Cost (USD)" col="adjusted_cost" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}` }}>% of Total</th>
                <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}` }}>Commodity</th>
              </tr>
            </thead>
            <tbody>
              {sortedBOM.map((c, i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{c.material}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{c.quantity_kg ? fmt(c.quantity_kg, 3) : '\u2014'}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{c.price_per_kg ? fmtUSD(c.price_per_kg) : '\u2014'}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color: c.change_pct > 0 ? T.red : c.change_pct < 0 ? T.green : T.text }}>
                    {c.adjusted_price ? fmtUSD(c.adjusted_price) : '\u2014'}
                    {c.change_pct !== 0 && <span style={{ fontSize:9, marginLeft:4 }}>({c.change_pct > 0 ? '+' : ''}{c.change_pct}%)</span>}
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{fmtUSD(c.adjusted_cost)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{(c.adjusted_cost / adjustedRawTotal * 100).toFixed(1)}%</td>
                  <td style={{ padding:'8px 10px' }}>
                    {c.commodity_id ? <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{c.commodity_id}</span> : '\u2014'}
                  </td>
                </tr>
              ))}
              <tr style={{ background:T.navy+'10', fontWeight:700 }}>
                <td style={{ padding:'8px 10px' }}>TOTAL RAW MATERIALS</td>
                <td colSpan={3}></td>
                <td style={{ padding:'8px 10px', textAlign:'right', color: rawDelta > 0 ? T.red : rawDelta < 0 ? T.green : T.navy }}>{fmtUSD(adjustedRawTotal)}</td>
                <td style={{ padding:'8px 10px', textAlign:'right' }}>100%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 6. Commodity Price Sensitivity Sliders */}
      <Section title="Commodity Price Sensitivity" badge="Interactive Sliders">
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:14 }}>Adjust commodity prices to see impact on final product cost:</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {adjustedBOM.filter(c => c.commodity_id).map(c => (
              <div key={c.commodity_id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:600, minWidth:80 }}>{c.material.split('(')[0].trim()}</span>
                <input type="range" min={-50} max={50} step={5} value={priceSliders[c.commodity_id] ?? 0}
                  onChange={e => setPriceSliders(prev => ({ ...prev, [c.commodity_id]: parseInt(e.target.value) }))}
                  style={{ flex:1, accentColor:T.gold }} />
                <span style={{ fontSize:12, fontWeight:700, minWidth:45, textAlign:'right', color: (priceSliders[c.commodity_id]??0) > 0 ? T.red : (priceSliders[c.commodity_id]??0) < 0 ? T.green : T.textSec }}>
                  {(priceSliders[c.commodity_id]??0) > 0 ? '+' : ''}{priceSliders[c.commodity_id] ?? 0}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Original Price</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{fmtUSD(flow?.final_price_usd)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Adjusted Price</div>
              <div style={{ fontSize:16, fontWeight:700, color: rawDelta > 0 ? T.red : rawDelta < 0 ? T.green : T.navy }}>{fmtUSD(adjustedFinalPrice)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Price Delta</div>
              <div style={{ fontSize:16, fontWeight:700, color: rawDelta > 0 ? T.red : rawDelta < 0 ? T.green : T.textSec }}>{rawDelta > 0 ? '+' : ''}{fmtUSD(rawDelta)}</div>
            </div>
          </div>
          <div style={{ marginTop:10, textAlign:'right' }}>
            <Btn small onClick={() => setPriceSliders({})}>Reset All Sliders</Btn>
          </div>
        </div>
      </Section>

      {/* 7. Value-Add Distribution PieChart */}
      <Section title="Value-Add Distribution" badge="Where Margin Is Captured">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={(() => {
                const totals = { Materials:0, Labor:0, Energy:0, Capital:0, Margin:0 };
                valueAddData.forEach(v => { totals.Materials += v.materials; totals.Labor += v.labor; totals.Energy += v.energy; totals.Capital += v.capital; totals.Margin += v.margin; });
                return Object.entries(totals).filter(([,v]) => v > 0).map(([k, v]) => ({ name:k, value:Math.round(v*100)/100 }));
              })()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:T.textMut }}>
                {[T.navy, T.gold, T.red, T.sage, T.amber].map((c,i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={valueAddData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
              <Legend />
              <Bar dataKey="labor" stackId="a" fill={T.gold} name="Labor" />
              <Bar dataKey="energy" stackId="a" fill={T.red} name="Energy" />
              <Bar dataKey="capital" stackId="a" fill={T.sage} name="Capital" />
              <Bar dataKey="margin" stackId="a" fill={T.navy} name="Margin" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 8. Externality Cost Breakdown */}
      <Section title="Externality Cost Breakdown" badge={`Total: ${fmtUSD(totalExternality)}`}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={externalityBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis dataKey="category" type="category" width={120} tick={{ fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
              <Bar dataKey="cost" name="Externality Cost (USD)" radius={[0,4,4,0]}>
                {externalityBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Externality Price References</div>
            {Object.entries(EXTERNALITY_PRICES).map(([key, ep]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.borderL}`, fontSize:12 }}>
                <span style={{ fontWeight:600, textTransform:'capitalize' }}>{key.replace('_', ' ')}</span>
                <span style={{ color:T.textSec }}>{ep.price !== null ? `${fmtUSD(ep.price)} ${ep.unit}` : ep.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 9. True Cost Accounting */}
      <Section title="True Cost Accounting" badge="Market + Hidden Costs">
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:2, marginBottom:16 }}>
            {[
              { label:'Market Price', value:adjustedFinalPrice, color:T.navy, width:((adjustedFinalPrice/(adjustedFinalPrice+totalExternality))*100) },
              { label:'+ Externalities', value:totalExternality, color:T.red, width:((totalExternality/(adjustedFinalPrice+totalExternality))*100) },
            ].map(b => null)}
          </div>
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', height:36, marginBottom:12 }}>
            <div style={{ width:`${(adjustedFinalPrice/(adjustedFinalPrice+totalExternality))*100}%`, background:T.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
              Market: {fmtUSD(adjustedFinalPrice)}
            </div>
            <div style={{ width:`${(totalExternality/(adjustedFinalPrice+totalExternality))*100}%`, background:T.red, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
              Hidden: {fmtUSD(totalExternality)}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center', borderLeft:`4px solid ${T.navy}` }}>
              <div style={{ fontSize:10, color:T.textMut }}>Market Price</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{fmtUSD(adjustedFinalPrice)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center', borderLeft:`4px solid ${T.red}` }}>
              <div style={{ fontSize:10, color:T.textMut }}>Externality Cost</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.red }}>{fmtUSD(totalExternality)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center', borderLeft:`4px solid ${T.amber}` }}>
              <div style={{ fontSize:10, color:T.textMut }}>TRUE COST</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.amber }}>{fmtUSD(adjustedFinalPrice + totalExternality)}</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 10. End-of-Life Value Analysis */}
      <Section title="End-of-Life Value Analysis" badge="Recycle vs Landfill">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PRODUCT_KEYS.map(k => {
                const f = FINANCIAL_FLOWS[k];
                return { name: f.name.split('(')[0].trim(), recycle: f.end_of_life_value_usd, landfill: f.scrap_value_usd };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
                <Legend />
                <Bar dataKey="recycle" fill={T.green} name="Recycle Value" radius={[4,4,0,0]} />
                <Bar dataKey="landfill" fill={T.textMut} name="Landfill/Scrap" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Selected: {flow?.name}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ background:T.green+'15', borderRadius:10, padding:16, textAlign:'center', border:`1px solid ${T.green}30` }}>
                <div style={{ fontSize:10, color:T.textMut }}>Recycled Value</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.green }}>{fmtUSD(flow?.end_of_life_value_usd)}</div>
                <div style={{ fontSize:10, color:T.textSec, marginTop:4 }}>{((flow?.end_of_life_value_usd / flow?.final_price_usd) * 100).toFixed(1)}% of original</div>
              </div>
              <div style={{ background:T.textMut+'15', borderRadius:10, padding:16, textAlign:'center', border:`1px solid ${T.textMut}30` }}>
                <div style={{ fontSize:10, color:T.textMut }}>Landfill Scrap</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.textMut }}>{fmtUSD(flow?.scrap_value_usd)}</div>
                <div style={{ fontSize:10, color:T.textSec, marginTop:4 }}>{((flow?.scrap_value_usd / flow?.final_price_usd) * 100).toFixed(2)}% of original</div>
              </div>
            </div>
            <div style={{ marginTop:12, fontSize:12, color:T.green, fontWeight:700, background:T.green+'10', padding:'8px 12px', borderRadius:8, textAlign:'center' }}>
              Recycling premium: {fmtUSD((flow?.end_of_life_value_usd || 0) - (flow?.scrap_value_usd || 0))} (+{(((flow?.end_of_life_value_usd || 1) / (flow?.scrap_value_usd || 1) - 1) * 100).toFixed(0)}%)
            </div>
          </div>
        </div>
      </Section>

      {/* 11. Supply Chain Margin Analysis */}
      <Section title="Supply Chain Margin Analysis" badge="Country x Stage">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Country','Extraction Margin %','Processing Margin %','Manufacturing Margin %','Total Value Capture %'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marginByCountry.map((row, i) => (
                <tr key={row.country} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{row.country}</td>
                  <td style={{ padding:'8px 10px' }}>{row.extraction_margin}%</td>
                  <td style={{ padding:'8px 10px' }}>{row.processing_margin}%</td>
                  <td style={{ padding:'8px 10px' }}>{row.manufacturing_margin}%</td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                        <div style={{ width:`${row.total_value_capture_pct * 3}%`, height:'100%', background:T.gold, borderRadius:4 }} />
                      </div>
                      <span style={{ fontWeight:700, minWidth:30 }}>{row.total_value_capture_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 12. Portfolio Commodity Price Sensitivity */}
      <Section title="Commodity Price Impact on Portfolio Revenue" badge={`${portfolioSensitivity.length} Holdings`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Company','Sector','Top Commodity','Sensitivity %','Revenue ($Mn)','Estimated Impact ($Mn)'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioSensitivity.map((h, i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{h.company}</td>
                  <td style={{ padding:'8px 10px', color:T.textSec }}>{h.sector}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{h.top_commodity}</span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:80, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${h.sensitivity * 2}%`, height:'100%', background: h.sensitivity > 25 ? T.red : h.sensitivity > 15 ? T.amber : T.green, borderRadius:3 }} />
                      </div>
                      <span style={{ fontWeight:600, color: h.sensitivity > 25 ? T.red : h.sensitivity > 15 ? T.amber : T.green }}>{h.sensitivity}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>${h.revenue_mn.toLocaleString()}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:T.red }}>${h.impact_mn.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 13. Green Premium Calculator */}
      <Section title="Green Premium Calculator" badge="Sustainable Alternatives">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
          {GREEN_PREMIUMS.map(gp => (
            <div key={gp.product} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:16, borderLeft:`4px solid ${T.green}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.navy }}>{gp.product}</div>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background: gp.status==='Available' ? T.green+'20' : T.amber+'20', color: gp.status==='Available' ? T.green : T.amber, fontWeight:600 }}>{gp.status}</span>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>vs {gp.conventional}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ background:T.amber+'10', borderRadius:6, padding:8, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut }}>Green Premium</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.amber }}>+{gp.premium_pct}%</div>
                </div>
                <div style={{ background:T.green+'10', borderRadius:6, padding:8, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut }}>CO\u2082 Reduction</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.green }}>-{gp.co2_reduction_pct}%</div>
                </div>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:T.textSec }}>
                Cost/tonne CO\u2082 avoided: ~${Math.round(gp.premium_pct * 10 / (gp.co2_reduction_pct / 100))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 14. Cross-Navigation + Exports Footer */}
      <Section title="Cross-Module Navigation">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {CROSS_NAV.map(n => (
            <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background:T.surfaceH }}>{n.label} {'\u2192'}</Btn>
          ))}
        </div>
      </Section>

      <div style={{ textAlign:'center', padding:'20px 0', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textMut }}>
        Financial Flow Analyzer v6.0 | {PRODUCT_KEYS.length} Product Flows | Externality Pricing (EPA SCC) | True Cost Accounting | Green Premium Analysis
      </div>
    </div>
  );
}
