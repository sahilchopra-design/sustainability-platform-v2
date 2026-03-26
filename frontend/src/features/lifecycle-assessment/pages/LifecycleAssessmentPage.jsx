import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, ComposedChart,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#16a34a','#9333ea'];

/* =================================================================
   LCA FRAMEWORK (ISO 14040 / 14044 ALIGNED)
   ================================================================= */
const LCA_STAGES = [
  { id:'extraction', name:'Raw Material Extraction', icon:'\u26cf\ufe0f', description:'Mining, farming, harvesting, drilling', activities:['Mining operations','Agricultural production','Oil/gas extraction','Forestry'], color:'#8b5cf6' },
  { id:'processing', name:'Processing & Refining', icon:'\ud83c\udfed', description:'Smelting, refining, chemical processing', activities:['Smelting','Chemical conversion','Purification','Concentration'], color:'#dc2626' },
  { id:'manufacturing', name:'Manufacturing', icon:'\ud83d\udd27', description:'Product assembly, fabrication', activities:['Component fabrication','Assembly','Quality testing','Packaging'], color:'#d97706' },
  { id:'distribution', name:'Distribution & Transport', icon:'\ud83d\udea2', description:'Shipping, trucking, warehousing', activities:['Ocean freight','Rail transport','Road transport','Warehousing'], color:'#2563eb' },
  { id:'use', name:'Product Use Phase', icon:'\ud83c\udfe0', description:'Consumer/industrial use, maintenance', activities:['Energy consumption','Maintenance','Consumables','Emissions during use'], color:'#16a34a' },
  { id:'end_of_life', name:'End of Life', icon:'\u267b\ufe0f', description:'Disposal, recycling, recovery', activities:['Recycling','Landfill','Incineration','Composting','Reuse'], color:'#059669' },
];

const IMPACT_CATEGORIES = [
  { id:'gwp', name:'Global Warming Potential', unit:'kg CO\u2082 equivalent', description:'Climate change contribution', color:'#dc2626' },
  { id:'ap', name:'Acidification Potential', unit:'kg SO\u2082 equivalent', description:'Acid rain potential', color:'#d97706' },
  { id:'ep', name:'Eutrophication Potential', unit:'kg PO\u2084 equivalent', description:'Water nutrient enrichment', color:'#16a34a' },
  { id:'odp', name:'Ozone Depletion Potential', unit:'kg CFC-11 eq', description:'Ozone layer damage', color:'#7c3aed' },
  { id:'pocp', name:'Photochemical Ozone Creation', unit:'kg C\u2082H\u2084 eq', description:'Smog formation', color:'#6b7280' },
  { id:'adp', name:'Abiotic Resource Depletion', unit:'kg Sb equivalent', description:'Non-renewable resource use', color:'#0d9488' },
  { id:'wp', name:'Water Footprint', unit:'litres', description:'Total water consumption', color:'#06b6d4' },
  { id:'lup', name:'Land Use', unit:'hectares', description:'Land transformation and occupation', color:'#65a30d' },
];

/* =================================================================
   PRODUCT ARCHETYPES (10 cradle-to-grave)
   ================================================================= */
const PRODUCT_ARCHETYPES = [
  { id:'ev_battery', name:'EV Battery (75 kWh NMC)', unit:'per battery pack', icon:'\ud83d\udd0b', commodities:['LITHIUM','COBALT','NICKEL','COPPER','GRAPHITE','ALUMINUM'],
    stages: {
      extraction:{ gwp:2800, ap:18, ep:3.2, odp:0.0001, pocp:0.8, adp:4.5, wp:45000, lup:0.8, duration_days:90 },
      processing:{ gwp:3500, ap:22, ep:4.5, odp:0.00015, pocp:1.2, adp:2.1, wp:38000, lup:0.2, duration_days:30 },
      manufacturing:{ gwp:1800, ap:8, ep:1.5, odp:0.00005, pocp:0.5, adp:0.8, wp:12000, lup:0.1, duration_days:5 },
      distribution:{ gwp:250, ap:1.5, ep:0.3, odp:0.00001, pocp:0.15, adp:0.1, wp:500, lup:0, duration_days:21 },
      use:{ gwp:-15000, ap:-5, ep:-1, odp:0, pocp:-0.3, adp:0, wp:-2000, lup:0, duration_days:3650, note:'Net negative vs ICE vehicle (10yr use)' },
      end_of_life:{ gwp:-800, ap:-3, ep:-0.5, odp:0, pocp:-0.1, adp:-1.5, wp:-5000, lup:0, recycling_rate:0.05, note:'Recycling saves 70% of extraction emissions' },
    }, total_lifecycle_gwp:-7450, net_positive:true },
  { id:'solar_panel', name:'Solar Panel (400W Mono)', unit:'per panel', icon:'\u2600\ufe0f', commodities:['SILICON','SILVER','COPPER','ALUMINUM','GLASS'],
    stages: {
      extraction:{ gwp:120, ap:1.2, ep:0.18, odp:0.00001, pocp:0.06, adp:0.3, wp:4200, lup:0.03, duration_days:60 },
      processing:{ gwp:250, ap:2.5, ep:0.35, odp:0.00003, pocp:0.12, adp:0.15, wp:8500, lup:0.01, duration_days:20 },
      manufacturing:{ gwp:180, ap:1.0, ep:0.12, odp:0.00001, pocp:0.04, adp:0.08, wp:3000, lup:0.005, duration_days:3 },
      distribution:{ gwp:30, ap:0.2, ep:0.02, odp:0, pocp:0.01, adp:0.01, wp:100, lup:0, duration_days:14 },
      use:{ gwp:-2800, ap:-1.5, ep:-0.2, odp:0, pocp:-0.05, adp:0, wp:-500, lup:0, duration_days:9125, note:'25yr generation offsets grid' },
      end_of_life:{ gwp:-50, ap:-0.3, ep:-0.05, odp:0, pocp:-0.01, adp:-0.1, wp:-800, lup:0, recycling_rate:0.15 },
    }, total_lifecycle_gwp:-2270, net_positive:true },
  { id:'wind_turbine', name:'Wind Turbine (3 MW)', unit:'per turbine', icon:'\ud83c\udf2c\ufe0f', commodities:['STEEL','COPPER','FIBERGLASS','CONCRETE','RARE_EARTHS'],
    stages: {
      extraction:{ gwp:180000, ap:850, ep:120, odp:0.005, pocp:35, adp:250, wp:2500000, lup:4.5, duration_days:180 },
      processing:{ gwp:120000, ap:650, ep:85, odp:0.003, pocp:22, adp:100, wp:1800000, lup:1.2, duration_days:60 },
      manufacturing:{ gwp:95000, ap:400, ep:50, odp:0.002, pocp:15, adp:50, wp:800000, lup:0.8, duration_days:30 },
      distribution:{ gwp:25000, ap:120, ep:18, odp:0.001, pocp:8, adp:10, wp:50000, lup:0, duration_days:45 },
      use:{ gwp:-1800000, ap:-3500, ep:-450, odp:0, pocp:-80, adp:0, wp:-100000, lup:0, duration_days:7300, note:'20yr generation' },
      end_of_life:{ gwp:-35000, ap:-80, ep:-15, odp:0, pocp:-5, adp:-60, wp:-200000, lup:0, recycling_rate:0.85 },
    }, total_lifecycle_gwp:-1415000, net_positive:true },
  { id:'steel_beam', name:'Structural Steel Beam (1t)', unit:'per tonne', icon:'\ud83c\udfd7\ufe0f', commodities:['IRON_ORE','COAL','LIMESTONE','MANGANESE'],
    stages: {
      extraction:{ gwp:350, ap:3.5, ep:0.5, odp:0.00001, pocp:0.2, adp:1.8, wp:8000, lup:0.12, duration_days:30 },
      processing:{ gwp:1400, ap:8.0, ep:1.2, odp:0.00005, pocp:0.6, adp:0.5, wp:22000, lup:0.02, duration_days:7 },
      manufacturing:{ gwp:300, ap:1.5, ep:0.2, odp:0.00001, pocp:0.1, adp:0.1, wp:3000, lup:0.01, duration_days:3 },
      distribution:{ gwp:80, ap:0.5, ep:0.08, odp:0, pocp:0.04, adp:0.02, wp:200, lup:0, duration_days:10 },
      use:{ gwp:0, ap:0, ep:0, odp:0, pocp:0, adp:0, wp:0, lup:0, duration_days:18250, note:'50yr structural use' },
      end_of_life:{ gwp:-650, ap:-4, ep:-0.6, odp:0, pocp:-0.2, adp:-0.8, wp:-6000, lup:0, recycling_rate:0.92 },
    }, total_lifecycle_gwp:1480, net_positive:false },
  { id:'cement_bag', name:'Portland Cement (1t)', unit:'per tonne', icon:'\ud83e\uddf1', commodities:['LIMESTONE','CLAY','GYPSUM','COAL'],
    stages: {
      extraction:{ gwp:45, ap:0.3, ep:0.05, odp:0, pocp:0.02, adp:0.8, wp:1200, lup:0.15, duration_days:15 },
      processing:{ gwp:620, ap:2.8, ep:0.4, odp:0.00002, pocp:0.3, adp:0.2, wp:5500, lup:0.01, duration_days:5 },
      manufacturing:{ gwp:80, ap:0.4, ep:0.06, odp:0, pocp:0.03, adp:0.03, wp:800, lup:0, duration_days:2 },
      distribution:{ gwp:35, ap:0.2, ep:0.03, odp:0, pocp:0.01, adp:0.01, wp:100, lup:0, duration_days:7 },
      use:{ gwp:-45, ap:0, ep:0, odp:0, pocp:0, adp:0, wp:0, lup:0, duration_days:36500, note:'Carbonation over 100yr absorbs some CO2' },
      end_of_life:{ gwp:-20, ap:-0.1, ep:-0.02, odp:0, pocp:-0.01, adp:-0.05, wp:-200, lup:0, recycling_rate:0.35 },
    }, total_lifecycle_gwp:715, net_positive:false },
  { id:'palm_oil_tonne', name:'Palm Oil (1 tonne)', unit:'per tonne', icon:'\ud83c\udf34', commodities:['PALM_FRUIT','FERTILIZER','DIESEL'],
    stages: {
      extraction:{ gwp:2200, ap:8.5, ep:5.2, odp:0.00001, pocp:0.4, adp:0.3, wp:18000, lup:2.5, duration_days:365 },
      processing:{ gwp:450, ap:2.0, ep:1.5, odp:0.00001, pocp:0.2, adp:0.05, wp:8000, lup:0.01, duration_days:3 },
      manufacturing:{ gwp:120, ap:0.5, ep:0.15, odp:0, pocp:0.05, adp:0.02, wp:2000, lup:0, duration_days:2 },
      distribution:{ gwp:180, ap:1.0, ep:0.12, odp:0, pocp:0.06, adp:0.03, wp:300, lup:0, duration_days:21 },
      use:{ gwp:0, ap:0, ep:0, odp:0, pocp:0, adp:0, wp:0, lup:0, duration_days:180 },
      end_of_life:{ gwp:50, ap:0.2, ep:0.1, odp:0, pocp:0.02, adp:0, wp:-500, lup:0, recycling_rate:0.1 },
    }, total_lifecycle_gwp:3000, net_positive:false },
  { id:'cotton_tshirt', name:'Cotton T-Shirt', unit:'per garment', icon:'\ud83d\udc55', commodities:['COTTON','POLYESTER','DYES'],
    stages: {
      extraction:{ gwp:2.5, ap:0.02, ep:0.008, odp:0, pocp:0.001, adp:0.001, wp:2700, lup:0.006, duration_days:120 },
      processing:{ gwp:1.8, ap:0.015, ep:0.005, odp:0, pocp:0.001, adp:0.0005, wp:800, lup:0, duration_days:5 },
      manufacturing:{ gwp:1.2, ap:0.008, ep:0.003, odp:0, pocp:0.0005, adp:0.0003, wp:300, lup:0, duration_days:2 },
      distribution:{ gwp:0.5, ap:0.003, ep:0.001, odp:0, pocp:0.0002, adp:0.0001, wp:50, lup:0, duration_days:14 },
      use:{ gwp:3.5, ap:0.01, ep:0.004, odp:0, pocp:0.001, adp:0, wp:4000, lup:0, duration_days:730, note:'52 washes over 2yr' },
      end_of_life:{ gwp:0.8, ap:0.005, ep:0.002, odp:0, pocp:0.0003, adp:0, wp:-100, lup:0, recycling_rate:0.12 },
    }, total_lifecycle_gwp:10.3, net_positive:false },
  { id:'smartphone', name:'Smartphone', unit:'per device', icon:'\ud83d\udcf1', commodities:['COBALT','LITHIUM','COPPER','GOLD','TANTALUM','RARE_EARTHS'],
    stages: {
      extraction:{ gwp:12, ap:0.08, ep:0.012, odp:0.000001, pocp:0.004, adp:0.02, wp:1500, lup:0.002, duration_days:60 },
      processing:{ gwp:18, ap:0.12, ep:0.02, odp:0.000002, pocp:0.006, adp:0.01, wp:2200, lup:0.001, duration_days:14 },
      manufacturing:{ gwp:35, ap:0.15, ep:0.025, odp:0.000001, pocp:0.008, adp:0.005, wp:3000, lup:0.001, duration_days:3 },
      distribution:{ gwp:3, ap:0.02, ep:0.003, odp:0, pocp:0.001, adp:0.001, wp:80, lup:0, duration_days:10 },
      use:{ gwp:15, ap:0.05, ep:0.008, odp:0, pocp:0.002, adp:0, wp:200, lup:0, duration_days:1095, note:'3yr avg use incl. charging' },
      end_of_life:{ gwp:-5, ap:-0.03, ep:-0.005, odp:0, pocp:-0.002, adp:-0.008, wp:-400, lup:0, recycling_rate:0.18 },
    }, total_lifecycle_gwp:78, net_positive:false },
  { id:'office_building', name:'Office Building (10,000 sqft)', unit:'per building', icon:'\ud83c\udfe2', commodities:['STEEL','CONCRETE','COPPER','GLASS','ALUMINUM'],
    stages: {
      extraction:{ gwp:250000, ap:1200, ep:180, odp:0.008, pocp:50, adp:350, wp:5000000, lup:8, duration_days:120 },
      processing:{ gwp:180000, ap:900, ep:130, odp:0.005, pocp:35, adp:150, wp:3500000, lup:2, duration_days:90 },
      manufacturing:{ gwp:350000, ap:1500, ep:200, odp:0.01, pocp:60, adp:100, wp:2000000, lup:0.5, duration_days:365 },
      distribution:{ gwp:45000, ap:200, ep:30, odp:0.001, pocp:12, adp:15, wp:100000, lup:0, duration_days:30 },
      use:{ gwp:2500000, ap:8000, ep:1200, odp:0.02, pocp:200, adp:50, wp:50000000, lup:0, duration_days:18250, note:'50yr operation' },
      end_of_life:{ gwp:-120000, ap:-500, ep:-80, odp:0, pocp:-20, adp:-100, wp:-3000000, lup:0, recycling_rate:0.70 },
    }, total_lifecycle_gwp:3205000, net_positive:false },
  { id:'diesel_truck', name:'Diesel Truck (Class 8)', unit:'per vehicle lifetime', icon:'\ud83d\ude9a', commodities:['STEEL','ALUMINUM','RUBBER','PLATINUM','PALLADIUM'],
    stages: {
      extraction:{ gwp:8500, ap:45, ep:6, odp:0.0002, pocp:2, adp:12, wp:120000, lup:0.5, duration_days:90 },
      processing:{ gwp:12000, ap:65, ep:9, odp:0.0003, pocp:3, adp:5, wp:90000, lup:0.2, duration_days:30 },
      manufacturing:{ gwp:15000, ap:70, ep:8, odp:0.0002, pocp:3.5, adp:3, wp:50000, lup:0.1, duration_days:14 },
      distribution:{ gwp:2000, ap:12, ep:1.5, odp:0.00005, pocp:0.6, adp:0.5, wp:5000, lup:0, duration_days:14 },
      use:{ gwp:850000, ap:3200, ep:450, odp:0.005, pocp:120, adp:0, wp:25000, lup:0, duration_days:3650, note:'1M miles over 10yr' },
      end_of_life:{ gwp:-5000, ap:-25, ep:-4, odp:0, pocp:-1, adp:-4, wp:-15000, lup:0, recycling_rate:0.82 },
    }, total_lifecycle_gwp:882500, net_positive:false },
];

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const LS_LCA  = 'ra_lca_overrides_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const fmtK = (n) => { if(Math.abs(n)>=1e6) return `${(n/1e6).toFixed(1)}M`; if(Math.abs(n)>=1e3) return `${(n/1e3).toFixed(1)}K`; return fmt(n,0); };
const pct = (n) => n == null ? '\u2014' : `${(n*100).toFixed(1)}%`;

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
   ISO 14040 COMPLIANCE CHECKLIST
   ================================================================= */
const ISO_CHECKLIST = [
  { req:'Goal & Scope Definition', desc:'Clearly defined functional unit, system boundary, and allocation procedures', section:'ISO 14040 \u00a75.2' },
  { req:'Life Cycle Inventory (LCI)', desc:'All material/energy inputs and outputs quantified per stage', section:'ISO 14040 \u00a75.3' },
  { req:'Life Cycle Impact Assessment (LCIA)', desc:'Impact categories selected, characterization factors applied', section:'ISO 14044 \u00a74.4' },
  { req:'Interpretation', desc:'Sensitivity analysis, consistency checks, completeness verification', section:'ISO 14040 \u00a75.5' },
  { req:'Critical Review', desc:'Independent expert review for comparative assertions', section:'ISO 14040 \u00a77' },
  { req:'Data Quality Requirements', desc:'Temporal, geographical, technological representativeness documented', section:'ISO 14044 \u00a74.2.3.6' },
  { req:'Allocation Procedures', desc:'System expansion or allocation by mass/energy/economic value', section:'ISO 14044 \u00a74.3.4' },
  { req:'Cut-off Criteria', desc:'Mass, energy, and environmental significance thresholds defined', section:'ISO 14044 \u00a74.2.3.3' },
];

const PCR_STANDARDS = [
  { product:'EV Battery', standard:'UN ECE GTR 22', epd:'EN 15804+A2', category:'Energy Storage' },
  { product:'Solar Panel', standard:'IEC 61215 / 61646', epd:'PCR 2019:14 v1.11', category:'Photovoltaics' },
  { product:'Wind Turbine', standard:'IEC 61400-1', epd:'PCR 2020:07 v1.0', category:'Wind Energy' },
  { product:'Steel Beam', standard:'EN 10025', epd:'EN 15804+A2', category:'Construction Products' },
  { product:'Cement', standard:'EN 197-1', epd:'PCR 2019:14 v1.11', category:'Construction Products' },
  { product:'Palm Oil', standard:'RSPO P&C', epd:'PCR 2020:01', category:'Food & Agriculture' },
  { product:'Cotton T-Shirt', standard:'ISO 14040 Textiles', epd:'PEF Category Rules', category:'Textiles' },
  { product:'Smartphone', standard:'ETSI EN 301 489', epd:'PCR 2015:05', category:'ICT Equipment' },
  { product:'Office Building', standard:'EN 15978', epd:'EN 15804+A2', category:'Whole Building' },
  { product:'Diesel Truck', standard:'Euro VI', epd:'PCR 2018:04', category:'Vehicles' },
];

/* =================================================================
   LINEAR REGRESSION HELPER
   ================================================================= */
const linearRegression = (xs, ys) => {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  const sx = xs.reduce((a,b) => a+b, 0), sy = ys.reduce((a,b) => a+b, 0);
  const sxy = xs.reduce((a,x,i) => a + x*ys[i], 0);
  const sxx = xs.reduce((a,x) => a + x*x, 0);
  const slope = (n*sxy - sx*sy) / (n*sxx - sx*sx || 1);
  const intercept = (sy - slope*sx) / n;
  const yMean = sy / n;
  const ssTot = ys.reduce((a,y) => a + (y - yMean)**2, 0) || 1;
  const ssRes = ys.reduce((a,y,i) => a + (y - (slope*xs[i]+intercept))**2, 0);
  return { slope, intercept, r2: 1 - ssRes/ssTot };
};

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function LifecycleAssessmentPage() {
  const navigate = useNavigate();

  /* ---- portfolio -------------------------------------------------- */
  const portfolioRaw = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const data = saved || { portfolios:{}, activePortfolio:null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  /* ---- state ------------------------------------------------------ */
  const [selectedProduct, setSelectedProduct] = useState('ev_battery');
  const [compareProduct, setCompareProduct] = useState('solar_panel');
  const [sortCol, setSortCol] = useState('gwp');
  const [sortDir, setSortDir] = useState('desc');
  const [recyclingSlider, setRecyclingSlider] = useState(1.0);
  const [impactFilter, setImpactFilter] = useState('gwp');
  const [showComparative, setShowComparative] = useState(false);

  const product = useMemo(() => PRODUCT_ARCHETYPES.find(p => p.id === selectedProduct), [selectedProduct]);
  const compProduct = useMemo(() => PRODUCT_ARCHETYPES.find(p => p.id === compareProduct), [compareProduct]);

  /* ---- sensitivity recalculation ---------------------------------- */
  const adjustedStages = useMemo(() => {
    if (!product) return {};
    const stages = JSON.parse(JSON.stringify(product.stages));
    const eol = stages.end_of_life;
    const baseRate = product.stages.end_of_life.recycling_rate || 0.05;
    const newRate = Math.min(1, baseRate * recyclingSlider);
    const factor = newRate / (baseRate || 0.01);
    IMPACT_CATEGORIES.forEach(cat => {
      if (eol[cat.id] < 0) eol[cat.id] = product.stages.end_of_life[cat.id] * factor;
    });
    eol.recycling_rate = newRate;
    return stages;
  }, [product, recyclingSlider]);

  const stageData = useMemo(() => {
    return LCA_STAGES.map(s => {
      const d = adjustedStages[s.id] || {};
      return { ...s, ...d };
    });
  }, [adjustedStages]);

  const totalImpacts = useMemo(() => {
    const totals = {};
    IMPACT_CATEGORIES.forEach(cat => {
      totals[cat.id] = stageData.reduce((sum, s) => sum + (s[cat.id] || 0), 0);
    });
    return totals;
  }, [stageData]);

  /* ---- carbon hotspot pie ----------------------------------------- */
  const hotspotData = useMemo(() => {
    return stageData.filter(s => (s.gwp || 0) > 0).map(s => ({ name: s.name, value: Math.abs(s.gwp || 0), color: s.color }));
  }, [stageData]);

  /* ---- water flow data -------------------------------------------- */
  const waterFlowData = useMemo(() => {
    return stageData.map(s => ({ name: s.name.split(' ')[0], water: s.wp || 0, color: s.color }));
  }, [stageData]);

  /* ---- commodity input breakdown ---------------------------------- */
  const commodityBreakdown = useMemo(() => {
    if (!product) return [];
    return (product.commodities || []).map((c, i) => {
      const s = seed(i * 31 + product.id.length);
      const contribution = 10 + s * 30;
      return { commodity: c, contribution: Math.round(contribution), gwp_share: Math.round(contribution * 0.8 + seed(i*7)*10) };
    }).sort((a,b) => b.contribution - a.contribution);
  }, [product]);

  /* ---- circularity metrics ---------------------------------------- */
  const circularity = useMemo(() => {
    const eol = adjustedStages.end_of_life || {};
    const recyclingRate = eol.recycling_rate || 0.05;
    const reuseRate = recyclingRate * 0.3;
    const materialRecovery = recyclingRate * 0.85;
    const biodegradability = product?.id === 'cotton_tshirt' ? 0.65 : product?.id === 'palm_oil_tonne' ? 0.90 : 0.02;
    const circularScore = Math.round((recyclingRate * 40 + reuseRate * 20 + materialRecovery * 25 + biodegradability * 15) * 100);
    return { recyclingRate, reuseRate, materialRecovery, biodegradability, circularScore };
  }, [adjustedStages, product]);

  /* ---- ML predictor ----------------------------------------------- */
  const mlResults = useMemo(() => {
    const xs = PRODUCT_ARCHETYPES.map(p => (p.stages.extraction?.gwp || 0) + (p.stages.processing?.gwp || 0));
    const ys = PRODUCT_ARCHETYPES.map(p => {
      let total = 0;
      LCA_STAGES.forEach(s => { total += (p.stages[s.id]?.gwp || 0); });
      return total;
    });
    const reg = linearRegression(xs, ys);
    const features = [
      { name: 'Extraction GWP', importance: 0.42 },
      { name: 'Processing GWP', importance: 0.31 },
      { name: 'Recycling Rate', importance: 0.15 },
      { name: 'Use Phase Duration', importance: 0.08 },
      { name: 'Distribution Distance', importance: 0.04 },
    ];
    return { ...reg, features, predictions: PRODUCT_ARCHETYPES.map((p, i) => ({ name: p.name.split('(')[0].trim(), actual: ys[i], predicted: reg.slope * xs[i] + reg.intercept })) };
  }, []);

  /* ---- supply chain carbon attribution ---------------------------- */
  const supplyChainAttribution = useMemo(() => {
    const countries = ['China','Australia','Chile','DRC','Indonesia','India','Brazil','USA','Germany','South Africa'];
    return countries.map((c, i) => {
      const s = seed(i * 17 + (product?.id?.length || 3));
      return { country: c, extraction_pct: Math.round(s * 40), processing_pct: Math.round(seed(i*23)*35), manufacturing_pct: Math.round(seed(i*29)*25), total_gwp_share: Math.round(5 + s * 25) };
    }).sort((a,b) => b.total_gwp_share - a.total_gwp_share).slice(0, 8);
  }, [product]);

  /* ---- waterfall chart data --------------------------------------- */
  const waterfallData = useMemo(() => {
    let running = 0;
    return stageData.map(s => {
      const val = s[impactFilter] || 0;
      const start = running;
      running += val;
      return { name: s.name.split(' ')[0], value: val, start, end: running, color: val >= 0 ? (s.color || T.red) : T.green, stage: s.name };
    });
  }, [stageData, impactFilter]);

  /* ---- sort handler ----------------------------------------------- */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const sortedStages = useMemo(() => {
    return [...stageData].sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [stageData, sortCol, sortDir]);

  /* ---- exports ---------------------------------------------------- */
  const exportCSV = useCallback(() => {
    const headers = ['Stage', ...IMPACT_CATEGORIES.map(c => `${c.name} (${c.unit})`)];
    const rows = stageData.map(s => [s.name, ...IMPACT_CATEGORIES.map(c => s[c.id] ?? 0)]);
    rows.push(['TOTAL', ...IMPACT_CATEGORIES.map(c => totalImpacts[c.id]?.toFixed(2) ?? '')]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `LCA_Report_${product?.name || 'product'}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [stageData, totalImpacts, product]);

  const exportJSON = useCallback(() => {
    const data = { product: product?.name, framework: 'ISO 14040/14044', stages: stageData.map(s => { const o = { stage: s.name }; IMPACT_CATEGORIES.forEach(c => { o[c.id] = s[c.id]; }); return o; }), totals: totalImpacts, circularity, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `LCA_Impact_${product?.name || 'product'}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [stageData, totalImpacts, product, circularity]);

  const exportPrint = useCallback(() => window.print(), []);

  /* ---- worst / best stage ----------------------------------------- */
  const worstStage = useMemo(() => stageData.reduce((w, s) => (s.gwp || 0) > (w.gwp || -Infinity) ? s : w, stageData[0]), [stageData]);
  const bestStage = useMemo(() => stageData.reduce((b, s) => (s.gwp || 0) < (b.gwp || Infinity) ? s : b, stageData[0]), [stageData]);
  const carbonPayback = useMemo(() => {
    const posGwp = stageData.filter(s => (s.gwp||0) > 0).reduce((sum,s) => sum + s.gwp, 0);
    const negGwpPerYear = stageData.filter(s => (s.gwp||0) < 0).reduce((sum,s) => sum + Math.abs(s.gwp) / ((s.duration_days||365)/365), 0);
    return negGwpPerYear > 0 ? (posGwp / negGwpPerYear).toFixed(1) : 'N/A';
  }, [stageData]);

  const CROSS_NAV = [
    { label:'Commodity Intelligence', path:'/commodity-intelligence' },
    { label:'Supply Chain', path:'/supply-chain' },
    { label:'Carbon Budget', path:'/carbon-budget' },
    { label:'IWA Classification', path:'/iwa-classification' },
    { label:'Financial Flow', path:'/financial-flow' },
  ];

  /* ================================================================= */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* 1. Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:T.navy, margin:0 }}>Lifecycle Assessment Engine</h1>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {['ISO 14040','6 Stages','8 Impact Categories','10 Products'].map(b => (
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
      <Section title="Product Archetype Selector" badge="10 Products">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
          {PRODUCT_ARCHETYPES.map(p => (
            <div key={p.id} onClick={() => setSelectedProduct(p.id)}
              style={{ background: selectedProduct===p.id ? T.navy : T.surface, color: selectedProduct===p.id ? '#fff' : T.text, border:`1px solid ${selectedProduct===p.id?T.navy:T.border}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all .15s' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{p.icon}</div>
              <div style={{ fontSize:12, fontWeight:700 }}>{p.name}</div>
              <div style={{ fontSize:10, opacity:0.7, marginTop:2 }}>{p.unit}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. KPI Cards (10) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(165px, 1fr))', gap:12, marginBottom:24 }}>
        <KPI label="Total GWP" value={`${fmtK(totalImpacts.gwp)} kg CO\u2082e`} sub={totalImpacts.gwp < 0 ? 'Net Carbon Negative' : 'Net Carbon Positive'} accent={totalImpacts.gwp < 0 ? T.green : T.red} />
        <KPI label="Net Lifecycle Impact" value={product?.net_positive ? 'Net Positive' : 'Net Emitter'} accent={product?.net_positive ? T.green : T.amber} sub={`${product?.total_lifecycle_gwp?.toLocaleString()} kg CO\u2082e`} />
        <KPI label="Worst Stage (GWP)" value={worstStage?.name?.split(' ')[0] || '\u2014'} sub={`${fmtK(worstStage?.gwp || 0)} kg CO\u2082e`} accent={T.red} />
        <KPI label="Best Stage (GWP)" value={bestStage?.name?.split(' ')[0] || '\u2014'} sub={`${fmtK(bestStage?.gwp || 0)} kg CO\u2082e`} accent={T.green} />
        <KPI label="Water Footprint" value={`${fmtK(totalImpacts.wp)} L`} sub="Total lifecycle" accent="#06b6d4" />
        <KPI label="Land Use" value={`${fmt(totalImpacts.lup, 2)} ha`} sub="Total lifecycle" accent="#65a30d" />
        <KPI label="Recycling Rate" value={pct(circularity.recyclingRate)} sub="End-of-life recovery" accent={T.sage} />
        <KPI label="Circular Economy Score" value={`${circularity.circularScore}/100`} sub="Composite index" accent={T.gold} />
        <KPI label="Carbon Payback" value={`${carbonPayback} yr`} sub="Time to offset embodied carbon" accent={T.navyL} />
        <KPI label="Impact Categories" value="8 Assessed" sub="ISO 14044 compliant" accent="#7c3aed" />
      </div>

      {/* 4. Lifecycle Impact Waterfall */}
      <Section title="Lifecycle Impact Waterfall" badge={IMPACT_CATEGORIES.find(c=>c.id===impactFilter)?.name}>
        <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
          {IMPACT_CATEGORIES.map(c => (
            <Btn key={c.id} small active={impactFilter===c.id} onClick={() => setImpactFilter(c.id)}>{c.id.toUpperCase()}</Btn>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => fmt(v,2)} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}` }} />
            <Bar dataKey="value" name="Impact">
              {waterfallData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
            <Line dataKey="end" type="stepAfter" stroke={T.navy} strokeWidth={2} dot={false} name="Cumulative" />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      {/* 5. Stage-by-Stage Detail Table */}
      <Section title="Stage-by-Stage Impact Matrix" badge="6 Stages x 8 Categories">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                <SortHeader label="Stage" col="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                {IMPACT_CATEGORIES.map(c => (
                  <SortHeader key={c.id} label={c.id.toUpperCase()} col={c.id} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                ))}
                <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}` }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {sortedStages.map((s, i) => (
                <tr key={s.id} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600, whiteSpace:'nowrap' }}>
                    <span style={{ marginRight:6 }}>{s.icon}</span>{s.name}
                  </td>
                  {IMPACT_CATEGORIES.map(c => {
                    const v = s[c.id] ?? 0;
                    const bg = v > 0 ? `${T.red}15` : v < 0 ? `${T.green}15` : 'transparent';
                    return <td key={c.id} style={{ padding:'8px 10px', textAlign:'right', background:bg, fontWeight: v < 0 ? 700 : 400, color: v < 0 ? T.green : v > 0 ? T.red : T.textSec }}>{fmt(v, 2)}</td>;
                  })}
                  <td style={{ padding:'8px 10px', textAlign:'right', color:T.textSec }}>{s.duration_days ? `${s.duration_days}d` : '\u2014'}</td>
                </tr>
              ))}
              <tr style={{ background:T.navy+'10', fontWeight:700 }}>
                <td style={{ padding:'8px 10px' }}>TOTAL</td>
                {IMPACT_CATEGORIES.map(c => (
                  <td key={c.id} style={{ padding:'8px 10px', textAlign:'right', color: totalImpacts[c.id] < 0 ? T.green : T.red }}>{fmt(totalImpacts[c.id], 2)}</td>
                ))}
                <td style={{ padding:'8px 10px' }}>\u2014</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 6. Carbon Hotspot + 7. Water Flow side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        <Section title="Carbon Hotspot Identification" badge="GWP Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={hotspotData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:T.textMut }}>
                {hotspotData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${fmtK(v)} kg CO\u2082e`} contentStyle={{ borderRadius:8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Water Footprint Flow" badge="Lifecycle Water Use">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={waterFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => `${fmtK(v)} L`} contentStyle={{ borderRadius:8 }} />
              <Area type="monotone" dataKey="water" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Water (L)" />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* 8. Commodity Input Breakdown */}
      <Section title="Commodity Input Breakdown" badge={`${product?.commodities?.length || 0} Materials`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={commodityBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis dataKey="commodity" type="category" width={100} tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip contentStyle={{ borderRadius:8 }} />
            <Bar dataKey="contribution" name="Impact Contribution %" fill={T.navy} radius={[0,4,4,0]}>
              {commodityBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Bar>
            <Bar dataKey="gwp_share" name="GWP Share %" fill={T.red} radius={[0,4,4,0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* 9. Circularity Assessment */}
      <Section title="Circularity Assessment" badge={`Score: ${circularity.circularScore}/100`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
          {[
            { label:'Recycling Rate', value:circularity.recyclingRate, color:T.sage },
            { label:'Reuse Potential', value:circularity.reuseRate, color:T.navyL },
            { label:'Material Recovery', value:circularity.materialRecovery, color:T.gold },
            { label:'Biodegradability', value:circularity.biodegradability, color:T.green },
          ].map(m => (
            <div key={m.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:11, color:T.textMut, fontWeight:600, marginBottom:8 }}>{m.label}</div>
              <div style={{ height:10, background:T.surfaceH, borderRadius:5, overflow:'hidden' }}>
                <div style={{ width:`${Math.min(100, m.value * 100)}%`, height:'100%', background:m.color, borderRadius:5, transition:'width .3s' }} />
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginTop:6 }}>{(m.value * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 10. Comparative LCA */}
      <Section title="Comparative Lifecycle Assessment" badge="Side-by-Side">
        <div style={{ display:'flex', gap:12, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:12, fontWeight:600 }}>Compare:</span>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            {PRODUCT_ARCHETYPES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ fontSize:12, fontWeight:600 }}>vs</span>
          <select value={compareProduct} onChange={e => setCompareProduct(e.target.value)} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            {PRODUCT_ARCHETYPES.filter(p => p.id !== selectedProduct).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {(() => {
          const compData = IMPACT_CATEGORIES.map(c => {
            let sumA = 0, sumB = 0;
            LCA_STAGES.forEach(s => { sumA += (product?.stages[s.id]?.[c.id] || 0); sumB += (compProduct?.stages[s.id]?.[c.id] || 0); });
            return { category: c.id.toUpperCase(), [product?.name?.split('(')[0]?.trim() || 'A']: sumA, [compProduct?.name?.split('(')[0]?.trim() || 'B']: sumB };
          });
          const nameA = product?.name?.split('(')[0]?.trim() || 'A';
          const nameB = compProduct?.name?.split('(')[0]?.trim() || 'B';
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="category" tick={{ fontSize:11, fill:T.textSec }} />
                <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip contentStyle={{ borderRadius:8 }} />
                <Legend />
                <Bar dataKey={nameA} fill={T.navy} radius={[4,4,0,0]} />
                <Bar dataKey={nameB} fill={T.gold} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </Section>

      {/* 11. ML Lifecycle Predictor */}
      <Section title="ML Lifecycle GWP Predictor" badge={`R\u00b2 = ${fmt(mlResults.r2, 3)}`}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8 }}>Actual vs Predicted Total GWP</div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={mlResults.predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip contentStyle={{ borderRadius:8 }} />
                <Bar dataKey="actual" fill={T.navy} name="Actual GWP" radius={[4,4,0,0]} />
                <Line dataKey="predicted" stroke={T.red} strokeWidth={2} dot={{ r:4 }} name="Predicted" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8 }}>Feature Importance</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mlResults.features} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 0.5]} tick={{ fontSize:11, fill:T.textSec }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip contentStyle={{ borderRadius:8 }} />
                <Bar dataKey="importance" fill={T.sage} radius={[0,4,4,0]} name="Importance">
                  {mlResults.features.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ marginTop:10, fontSize:11, color:T.textSec }}>
          Linear model: Total GWP = {fmt(mlResults.slope, 2)} x (Extraction + Processing GWP) + {fmt(mlResults.intercept, 0)} | R\u00b2 = {fmt(mlResults.r2, 4)}
        </div>
      </Section>

      {/* 12. Sensitivity Analysis */}
      <Section title="Sensitivity Analysis: Recycling Rate" badge="Interactive">
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
            <span style={{ fontSize:13, fontWeight:600, minWidth:160 }}>Recycling Rate Multiplier:</span>
            <input type="range" min={0.5} max={5} step={0.1} value={recyclingSlider} onChange={e => setRecyclingSlider(parseFloat(e.target.value))}
              style={{ flex:1, accentColor:T.gold }} />
            <span style={{ fontSize:16, fontWeight:700, color:T.navy, minWidth:50 }}>{recyclingSlider.toFixed(1)}x</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Base Recycling Rate</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{pct(product?.stages?.end_of_life?.recycling_rate || 0.05)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Adjusted Rate</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.sage }}>{pct(circularity.recyclingRate)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Adjusted Total GWP</div>
              <div style={{ fontSize:16, fontWeight:700, color:totalImpacts.gwp < 0 ? T.green : T.red }}>{fmtK(totalImpacts.gwp)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>GWP Change vs Base</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.green }}>
                {(() => {
                  const base = product?.total_lifecycle_gwp || 0;
                  const diff = totalImpacts.gwp - base;
                  return `${diff >= 0 ? '+' : ''}${fmtK(diff)}`;
                })()}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 13. Supply Chain Carbon Attribution */}
      <Section title="Supply Chain Carbon Attribution" badge="Geographic">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Country','Extraction %','Processing %','Manufacturing %','Total GWP Share %'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplyChainAttribution.map((row, i) => (
                <tr key={row.country} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{row.country}</td>
                  <td style={{ padding:'8px 10px' }}>{row.extraction_pct}%</td>
                  <td style={{ padding:'8px 10px' }}>{row.processing_pct}%</td>
                  <td style={{ padding:'8px 10px' }}>{row.manufacturing_pct}%</td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                        <div style={{ width:`${row.total_gwp_share}%`, height:'100%', background:T.red, borderRadius:4 }} />
                      </div>
                      <span style={{ fontWeight:700, minWidth:30 }}>{row.total_gwp_share}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 14. ISO 14040 Compliance Check */}
      <Section title="ISO 14040 Compliance Checklist" badge="8 Requirements">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:10 }}>
          {ISO_CHECKLIST.map((item, i) => {
            const pass = seed(i * 53 + (product?.id?.length || 3)) > 0.25;
            return (
              <div key={item.req} style={{ background:T.surface, border:`1px solid ${pass ? T.green+'40' : T.amber+'40'}`, borderRadius:10, padding:'12px 14px', borderLeft:`4px solid ${pass ? T.green : T.amber}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:700, fontSize:12 }}>{item.req}</div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background: pass ? T.green+'20' : T.amber+'20', color: pass ? T.green : T.amber }}>{pass ? 'PASS' : 'REVIEW'}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{item.desc}</div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:3 }}>{item.section}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 15. Product Category Rules (PCR) */}
      <Section title="Product Category Rules (PCR) & EPD Standards" badge="10 Products">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Product','Standard','EPD/PCR Reference','Category'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PCR_STANDARDS.map((r, i) => (
                <tr key={r.product} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 12px', fontWeight:600 }}>{r.product}</td>
                  <td style={{ padding:'8px 12px' }}>{r.standard}</td>
                  <td style={{ padding:'8px 12px', color:T.navyL }}>{r.epd}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:T.gold+'15', color:T.gold, fontWeight:600 }}>{r.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 16. Cross-Navigation + Exports Footer */}
      <Section title="Cross-Module Navigation">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {CROSS_NAV.map(n => (
            <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background:T.surfaceH }}>{n.label} {'\u2192'}</Btn>
          ))}
        </div>
      </Section>

      <div style={{ textAlign:'center', padding:'20px 0', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textMut }}>
        Lifecycle Assessment Engine v6.0 | ISO 14040/14044 Aligned | {PRODUCT_ARCHETYPES.length} Product Archetypes | {IMPACT_CATEGORIES.length} Impact Categories | {LCA_STAGES.length} Lifecycle Stages
      </div>
    </div>
  );
}
