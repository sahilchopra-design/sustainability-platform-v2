import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, ComposedChart, Treemap,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#16a34a','#9333ea','#64748b','#0891b2'];

/* =================================================================
   SPRINT Y MODULES
   ================================================================= */
const MODULES = [
  { id:'intel', name:'Commodity Intelligence', path:'/commodity-intelligence', icon:'\u{1F4CA}', color:'#0284c7', metrics:{ commodities:50, models:8, accuracy:'94%' }, description:'50-commodity intelligence engine with ML forecasting & geopolitical risk' },
  { id:'inventory', name:'Global Inventory', path:'/commodity-inventory', icon:'\u{1F30D}', color:'#7c3aed', metrics:{ warehouses:240, tracked:'$2.4T', alerts:18 }, description:'Real-time global commodity inventory tracking & supply chain visibility' },
  { id:'lca', name:'LCA Engine', path:'/lifecycle-assessment', icon:'\u{267B}', color:'#16a34a', metrics:{ products:320, categories:14, scope:'Cradle-to-Grave' }, description:'ISO 14040/14044 lifecycle assessment for commodity products' },
  { id:'financial', name:'Financial Flow', path:'/financial-flow', icon:'\u{1F4B0}', color:'#d97706', metrics:{ flows:'$890Bn', externalities:'$142Bn', coverage:'95%' }, description:'Commodity financial flow mapping with externality pricing' },
  { id:'esgvc', name:'ESG Value Chain', path:'/esg-value-chain', icon:'\u{1F331}', color:'#5a8a6a', metrics:{ chains:85, tiers:5, risks:342 }, description:'Multi-tier ESG value chain analysis & CSDDD compliance' },
  { id:'climate', name:'Climate/Nature Repo', path:'/climate-nature-repo', icon:'\u{2603}', color:'#0d9488', metrics:{ ghgMt:1240, waterGl:85, biodiversity:'42 species' }, description:'Climate & nature impact repository: GHG, water, biodiversity' },
  { id:'mfi', name:'Multi-Factor Integration', path:'/multi-factor-integration', icon:'\u{1F9E9}', color:'#dc2626', metrics:{ factors:12, signals:890, alpha:'2.8%' }, description:'Integrated commodity factor model: Financial x ESG x Climate' },
];

/* =================================================================
   REGULATORY FRAMEWORK
   ================================================================= */
const REGS = [
  { name:'EU Taxonomy', articles:['6 Env. Objectives','DNSH','Minimum Safeguards'], coverage:'EU', commodity:'Screening criteria for commodity-linked activities' },
  { name:'CBAM', articles:['Carbon Border Tax','Embedded Emissions','Certificate Purchase'], coverage:'EU', commodity:'Steel, aluminum, cement, fertilizers, hydrogen, electricity' },
  { name:'EUDR', articles:['Zero-Deforestation','Due Diligence','Traceability'], coverage:'EU', commodity:'Palm oil, soy, cocoa, coffee, rubber, cattle, wood' },
  { name:'CSDDD', articles:['Value Chain Due Diligence','Environmental Impact','Remediation'], coverage:'EU', commodity:'All commodities in corporate value chains' },
  { name:'CSRD/ESRS', articles:['E1 Climate','E2 Pollution','E4 Biodiversity','E5 Resources'], coverage:'EU', commodity:'Commodity-linked environmental disclosures' },
];

/* =================================================================
   CRITICAL MINERALS
   ================================================================= */
const CRITICAL_MINERALS = [
  { mineral:'Lithium', use:'EV Batteries', topProducer:'Australia (52%)', geoRisk:78, supplyConc:82, demandGrowth:'+28%/yr', price:14200, unit:'$/mt' },
  { mineral:'Cobalt', use:'Battery Cathodes', topProducer:'DRC (74%)', geoRisk:92, supplyConc:95, demandGrowth:'+15%/yr', price:28500, unit:'$/mt' },
  { mineral:'Rare Earths', use:'Magnets/Electronics', topProducer:'China (70%)', geoRisk:88, supplyConc:90, demandGrowth:'+12%/yr', price:380, unit:'$/kg' },
  { mineral:'Graphite', use:'Battery Anodes', topProducer:'China (65%)', geoRisk:82, supplyConc:85, demandGrowth:'+22%/yr', price:680, unit:'$/mt' },
  { mineral:'Nickel', use:'Stainless/Batteries', topProducer:'Indonesia (48%)', geoRisk:62, supplyConc:68, demandGrowth:'+8%/yr', price:17200, unit:'$/mt' },
  { mineral:'Manganese', use:'Steel/Batteries', topProducer:'South Africa (37%)', geoRisk:55, supplyConc:62, demandGrowth:'+6%/yr', price:4.8, unit:'$/kg' },
  { mineral:'Vanadium', use:'Steel/VRFB', topProducer:'China (55%)', geoRisk:72, supplyConc:78, demandGrowth:'+10%/yr', price:32, unit:'$/kg' },
];

/* =================================================================
   CARBON MARKETS
   ================================================================= */
const CARBON_MKTS = [
  { id:'EUA', name:'EU ETS (EUA)', price:68, trend:-22.5, coverage:'40% EU emissions', region:'EU' },
  { id:'CCA', name:'California CCA', price:38, trend:8.2, coverage:'85% CA emissions', region:'US-CA' },
  { id:'RGGI', name:'RGGI (US NE)', price:14, trend:5.5, coverage:'Power sector', region:'US-NE' },
  { id:'UKA', name:'UK ETS', price:42, trend:-8.2, coverage:'25% UK emissions', region:'UK' },
  { id:'NZU', name:'NZ ETS', price:52, trend:-15.5, coverage:'50% NZ emissions', region:'NZ' },
  { id:'KCCER', name:'Korean ETS', price:8, trend:12.5, coverage:'70% KR emissions', region:'KR' },
];

/* =================================================================
   SUPPLY CHAIN ALERTS
   ================================================================= */
const ALERT_TYPES = [
  { type:'EUDR Non-Compliance', count:12, severity:'Critical', commodities:'Palm Oil, Soy, Cocoa, Coffee', color:T.red },
  { type:'Child Labor Exposure', count:8, severity:'Critical', commodities:'Cobalt, Cocoa, Coffee, Cotton', color:'#7c3aed' },
  { type:'Water Stress', count:15, severity:'High', commodities:'Cotton, Rice, Aluminum, Copper', color:'#0284c7' },
  { type:'Deforestation Risk', count:9, severity:'High', commodities:'Palm Oil, Soy, Rubber, Cattle', color:'#16a34a' },
  { type:'Stranded Asset Risk', count:6, severity:'Medium', commodities:'Coal, Oil, Gas', color:T.amber },
];

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const LS_SUPPLY = 'ra_commodity_supply_chains_v1';
const LS_INTEL = 'ra_commodity_intel_v1';
const LS_INV = 'ra_commodity_inventory_v1';
const LS_LCA = 'ra_lca_assessment_v1';
const LS_FINFLOW = 'ra_financial_flow_v1';
const LS_ESGVC = 'ra_esg_value_chain_v1';
const LS_CLIMATE = 'ra_climate_nature_v1';
const LS_MFI = 'ra_multi_factor_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const pct = (n) => n == null ? '\u2014' : `${Math.round(n)}%`;
const fmtMn = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;
const fmtK = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${Math.round(n)}`;

/* =================================================================
   ENRICHMENT — Wraps portfolio with commodity lifecycle intelligence
   ================================================================= */
const enrichCommodityHub = (c, i) => {
  const s = i + 1;
  const commodityExposurePct = Math.round(5 + seed(s * 11) * 35);
  const topCommodity = ['Oil & Gas','Metals','Agriculture','Chemicals','Mining','Energy','Materials','Tech Metals'][Math.floor(seed(s * 13) * 8)];
  const supplyChainsMapped = Math.ceil(seed(s * 17) * 12 + 2);
  const lcaProducts = Math.ceil(seed(s * 19) * 8 + 1);
  const financialFlowMn = Math.round(seed(s * 23) * 500 + 50);
  const externalityCostMn = Math.round(seed(s * 29) * 80 + 5);
  const esgVCScore = Math.round(25 + seed(s * 31) * 65);
  const lifecycleGHG = Math.round(seed(s * 37) * 200000 + 5000);
  const waterFootprint = Math.round(seed(s * 41) * 5000 + 200);
  const biodiversityImpact = Math.round(seed(s * 43) * 50 + 2);
  const circularScore = Math.round(15 + seed(s * 47) * 70);
  const eudrCompliance = Math.round(40 + seed(s * 53) * 55);
  const childLaborRisk = seed(s * 59) > 0.7 ? 'High' : seed(s * 61) > 0.4 ? 'Medium' : 'Low';
  const carbonExposure = Math.round(seed(s * 67) * 45 + 5);
  const strandedAssetRisk = Math.round(seed(s * 71) * 40);
  const compositeRisk = Math.round(20 + seed(s * 73) * 60);
  const mlConfidence = Math.round(75 + seed(s * 79) * 22);
  const dimensionFinancial = Math.round(30 + seed(s * 83) * 60);
  const dimensionESG = Math.round(20 + seed(s * 87) * 70);
  const dimensionClimate = Math.round(25 + seed(s * 89) * 65);
  return {
    ...c,
    company_name: c.company_name || c.company || `Company ${i+1}`,
    sector: c.sector || 'Diversified',
    weight: c.weight || 1,
    commodityExposurePct, topCommodity, supplyChainsMapped, lcaProducts,
    financialFlowMn, externalityCostMn, esgVCScore, lifecycleGHG,
    waterFootprint, biodiversityImpact, circularScore, eudrCompliance,
    childLaborRisk, carbonExposure, strandedAssetRisk, compositeRisk,
    mlConfidence, dimensionFinancial, dimensionESG, dimensionClimate,
  };
};

/* =================================================================
   STYLED MINI-COMPONENTS
   ================================================================= */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:20, cursor:onClick?'pointer':'default', transition:'box-shadow .2s, transform .15s', ...style }} onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(27,58,92,.10)';if(onClick)e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
    {children}
  </div>
);
const Badge = ({ children, bg, color }) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:bg||T.gold+'22', color:color||T.gold, letterSpacing:.3 }}>{children}</span>
);
const KPICard = ({ label, value, sub, color }) => (
  <Card style={{ textAlign:'center', minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </Card>
);
const SectionTitle = ({ children, badge }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:32, marginBottom:16 }}>
    <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:T.navy }}>{children}</h2>
    {badge && <Badge>{badge}</Badge>}
  </div>
);
const RiskBadge = ({ level }) => {
  const colors = { 'Very High':'#dc2626', High:'#d97706', Medium:'#ca8a04', Low:'#16a34a', Positive:'#0d9488', 'N/A':'#9aa3ae' };
  return <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600, background:(colors[level]||'#64748b')+'18', color:colors[level]||'#64748b' }}>{level}</span>;
};

/* =================================================================
   SORTABLE TABLE
   ================================================================= */
const SortableTable = ({ columns, data, maxRows=10 }) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const toggle = (key) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc'); } };
  const sorted = useMemo(() => {
    if (!sortKey) return data.slice(0, maxRows);
    return [...data].sort((a, b) => { const av = a[sortKey], bv = b[sortKey]; if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av; return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); }).slice(0, maxRows);
  }, [data, sortKey, sortDir, maxRows]);
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead><tr>{columns.map(c => (
          <th key={c.key} onClick={() => toggle(c.key)} style={{ padding:'8px 10px', textAlign:c.align||'left', borderBottom:`2px solid ${T.border}`, cursor:'pointer', fontWeight:600, color:T.navy, whiteSpace:'nowrap', userSelect:'none', fontSize:11 }}>
            {c.label} {sortKey === c.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
          </th>
        ))}</tr></thead>
        <tbody>{sorted.map((row, ri) => (
          <tr key={ri} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
            {columns.map(c => <td key={c.key} style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:c.align||'left', color:T.text }}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function CommodityHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [riskSlider, setRiskSlider] = useState(50);
  const [dimFilter, setDimFilter] = useState('all');

  /* ── Load portfolio WRAPPED ────────────────────────────────────── */
  const portfolio = useMemo(() => {
    const raw = loadLS(LS_PORT);
    const base = raw && Array.isArray(raw.holdings) ? raw.holdings : raw && Array.isArray(raw) ? raw : GLOBAL_COMPANY_MASTER.slice(0, 30);
    return base.map((c, i) => enrichCommodityHub(c, i));
  }, []);

  /* ── Aggregate KPIs ────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const n = portfolio.length;
    const totalCommodityExp = portfolio.reduce((a, c) => a + c.commodityExposurePct, 0) / n;
    const totalExternalityMn = portfolio.reduce((a, c) => a + c.externalityCostMn, 0);
    const totalFinFlowMn = portfolio.reduce((a, c) => a + c.financialFlowMn, 0);
    const avgESGVC = portfolio.reduce((a, c) => a + c.esgVCScore, 0) / n;
    const totalGHG = portfolio.reduce((a, c) => a + c.lifecycleGHG, 0);
    const totalWater = portfolio.reduce((a, c) => a + c.waterFootprint, 0);
    const totalBio = portfolio.reduce((a, c) => a + c.biodiversityImpact, 0);
    const avgCircular = portfolio.reduce((a, c) => a + c.circularScore, 0) / n;
    const avgEUDR = portfolio.reduce((a, c) => a + c.eudrCompliance, 0) / n;
    const childLabHigh = portfolio.filter(c => c.childLaborRisk === 'High').length;
    const totalSC = portfolio.reduce((a, c) => a + c.supplyChainsMapped, 0);
    const totalLCA = portfolio.reduce((a, c) => a + c.lcaProducts, 0);
    const avgML = portfolio.reduce((a, c) => a + c.mlConfidence, 0) / n;
    const worstCommodity = portfolio.reduce((w, c) => c.esgVCScore < (w?.esgVCScore || 100) ? c : w, null);
    const bestLCA = portfolio.reduce((b, c) => c.circularScore > (b?.circularScore || 0) ? c : b, null);
    const worstLCA = portfolio.reduce((w, c) => c.circularScore < (w?.circularScore || 100) ? c : w, null);
    return {
      commoditiesTracked: 50, supplyChains: totalSC, lcaProducts: totalLCA,
      financialFlows: totalFinFlowMn, esgValueChains: Math.round(avgESGVC),
      climateImpacts: Math.round(totalGHG / 1000), carbonPriceEUA: 68,
      oilWTI: 78.5, lithiumPrice: 14200, commodityExposure: Math.round(totalCommodityExp),
      externalityGap: totalExternalityMn, circularScore: Math.round(avgCircular),
      eudrCompliance: Math.round(avgEUDR), childLaborExposure: Math.round((childLabHigh / n) * 100),
      bestPerformer: bestLCA?.company_name || 'N/A', mlR2: Math.round(avgML),
      totalFinFlowMn, totalExternalityMn, avgESGVC, worstCommodity,
      totalGHG, totalWater, totalBio, bestLCA, worstLCA,
    };
  }, [portfolio]);

  /* ── Category chart data ───────────────────────────────────────── */
  const categoryData = useMemo(() => {
    const cats = ['Energy','Metals','Agriculture','Chemicals','Mining','Materials','Tech Metals','Diversified'];
    return cats.map((cat, i) => {
      const members = portfolio.filter(c => c.topCommodity === cat || (i === 7 && !cats.slice(0,7).includes(c.topCommodity)));
      return {
        category: cat,
        exposure: Math.round(members.reduce((a, c) => a + c.commodityExposurePct * (c.weight || 1), 0) / Math.max(1, members.length)),
        sustainability: Math.round(members.reduce((a, c) => a + c.esgVCScore, 0) / Math.max(1, members.length)),
        count: members.length,
      };
    }).filter(c => c.count > 0);
  }, [portfolio]);

  /* ── Top 10 Commodity Risks ────────────────────────────────────── */
  const topRisks = useMemo(() =>
    [...portfolio].sort((a, b) => b.compositeRisk - a.compositeRisk).slice(0, 10)
  , [portfolio]);

  /* ── Cross-module consistency ──────────────────────────────────── */
  const consistency = useMemo(() => {
    const fin = [...portfolio].sort((a, b) => b.dimensionFinancial - a.dimensionFinancial).slice(0, 10).map(c => c.company_name);
    const esg = [...portfolio].sort((a, b) => b.dimensionESG - a.dimensionESG).slice(0, 10).map(c => c.company_name);
    const clm = [...portfolio].sort((a, b) => b.dimensionClimate - a.dimensionClimate).slice(0, 10).map(c => c.company_name);
    const overlap = fin.filter(n => esg.includes(n) && clm.includes(n));
    return { finTop:fin, esgTop:esg, climateTop:clm, agreementPct:Math.round((overlap.length / 10) * 100), overlap };
  }, [portfolio]);

  /* ── ML model performance ──────────────────────────────────────── */
  const mlModels = useMemo(() => [
    { model:'Price Forecast (LSTM)', module:'Intelligence', r2:0.94, mae:2.8, features:42, updated:'2026-03-22' },
    { model:'Supply Disruption (XGBoost)', module:'Inventory', r2:0.88, mae:5.2, features:28, updated:'2026-03-20' },
    { model:'LCA Impact (Random Forest)', module:'LCA Engine', r2:0.91, mae:3.5, features:35, updated:'2026-03-21' },
    { model:'Externality Pricing (GBM)', module:'Financial Flow', r2:0.86, mae:6.1, features:22, updated:'2026-03-19' },
    { model:'ESG Value Chain (Neural Net)', module:'ESG VC', r2:0.89, mae:4.2, features:38, updated:'2026-03-22' },
    { model:'Climate Impact (Ensemble)', module:'Climate/Nature', r2:0.92, mae:3.1, features:45, updated:'2026-03-21' },
    { model:'Multi-Factor Alpha (Ridge)', module:'MFI', r2:0.85, mae:7.2, features:52, updated:'2026-03-22' },
    { model:'Geopolitical Risk (BERT)', module:'Intelligence', r2:0.82, mae:8.5, features:18, updated:'2026-03-18' },
  ], []);

  /* ── Exports ───────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const headers = ['Company','Sector','Commodity Exposure %','Top Commodity','Supply Chains','LCA Products','Financial Flow $Mn','Externality $Mn','ESG VC Score','Lifecycle GHG tCO2','Water m3','Biodiversity','Circular Score','EUDR Compliance %','Child Labor Risk','Composite Risk'];
    const rows = portfolio.map(c => [c.company_name, c.sector, c.commodityExposurePct, c.topCommodity, c.supplyChainsMapped, c.lcaProducts, c.financialFlowMn, c.externalityCostMn, c.esgVCScore, c.lifecycleGHG, c.waterFootprint, c.biodiversityImpact, c.circularScore, c.eudrCompliance, c.childLaborRisk, c.compositeRisk]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commodity_hub_summary_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [portfolio]);

  const exportJSON = useCallback(() => {
    const report = { generated: new Date().toISOString(), kpis, modules: MODULES.map(m => ({ ...m })), portfolio: portfolio.map(c => ({ company:c.company_name, sector:c.sector, commodityExposurePct:c.commodityExposurePct, topCommodity:c.topCommodity, compositeRisk:c.compositeRisk, esgVCScore:c.esgVCScore, lifecycleGHG:c.lifecycleGHG, circularScore:c.circularScore })), categoryBreakdown: categoryData, topRisks: topRisks.map(c => ({ company:c.company_name, risk:c.compositeRisk })), mlModels, consistency, carbonMarkets: CARBON_MKTS, criticalMinerals: CRITICAL_MINERALS, alerts: ALERT_TYPES, regulations: REGS };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commodity_hub_full_report_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [portfolio, kpis, categoryData, topRisks, mlModels, consistency]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Filter portfolio by risk slider ───────────────────────────── */
  const filteredPortfolio = useMemo(() =>
    portfolio.filter(c => c.compositeRisk >= riskSlider)
  , [portfolio, riskSlider]);

  /* ── Sector breakdown for treemap ──────────────────────────────── */
  const sectorBreakdown = useMemo(() => {
    const map = {};
    portfolio.forEach(c => {
      const s = c.sector || 'Other';
      if (!map[s]) map[s] = { name:s, exposure:0, count:0, avgRisk:0, totalGHG:0, totalExt:0 };
      map[s].exposure += c.commodityExposurePct;
      map[s].count += 1;
      map[s].avgRisk += c.compositeRisk;
      map[s].totalGHG += c.lifecycleGHG;
      map[s].totalExt += c.externalityCostMn;
    });
    return Object.values(map).map(s => ({
      ...s,
      exposure: Math.round(s.exposure / s.count),
      avgRisk: Math.round(s.avgRisk / s.count),
    })).sort((a,b) => b.totalExt - a.totalExt);
  }, [portfolio]);

  /* ── Dimension distribution for radar ──────────────────────────── */
  const dimensionRadar = useMemo(() => {
    const labels = ['Financial Risk','ESG Exposure','Climate Impact','Supply Chain','Circular Economy','Regulatory'];
    return labels.map((label, i) => {
      const vals = portfolio.map(c => {
        switch(i) {
          case 0: return c.dimensionFinancial;
          case 1: return c.dimensionESG;
          case 2: return c.dimensionClimate;
          case 3: return c.supplyChainsMapped * 8;
          case 4: return c.circularScore;
          case 5: return c.eudrCompliance;
          default: return 50;
        }
      });
      return { dimension:label, value: Math.round(vals.reduce((a,v)=>a+v,0) / vals.length) };
    });
  }, [portfolio]);

  /* ── Top commodity exposures sorted ────────────────────────────── */
  const commodityExposureRanked = useMemo(() => {
    const map = {};
    portfolio.forEach(c => {
      const tc = c.topCommodity;
      if (!map[tc]) map[tc] = { commodity:tc, companies:0, avgExposure:0, totalFlowMn:0, avgESG:0 };
      map[tc].companies += 1;
      map[tc].avgExposure += c.commodityExposurePct;
      map[tc].totalFlowMn += c.financialFlowMn;
      map[tc].avgESG += c.esgVCScore;
    });
    return Object.values(map).map(m => ({
      ...m,
      avgExposure: Math.round(m.avgExposure / m.companies),
      avgESG: Math.round(m.avgESG / m.companies),
    })).sort((a,b) => b.totalFlowMn - a.totalFlowMn);
  }, [portfolio]);

  /* ── Externality breakdown by type ─────────────────────────────── */
  const externalityBreakdown = useMemo(() => {
    const total = kpis.totalExternalityMn;
    return [
      { type:'Carbon Emissions', share:32, amount:Math.round(total * 0.32), color:T.red },
      { type:'Water Pollution', share:18, amount:Math.round(total * 0.18), color:'#0284c7' },
      { type:'Biodiversity Loss', share:15, amount:Math.round(total * 0.15), color:T.sage },
      { type:'Health Impacts', share:12, amount:Math.round(total * 0.12), color:'#7c3aed' },
      { type:'Soil Degradation', share:10, amount:Math.round(total * 0.10), color:T.amber },
      { type:'Deforestation', share:8, amount:Math.round(total * 0.08), color:'#16a34a' },
      { type:'Other', share:5, amount:Math.round(total * 0.05), color:T.textMut },
    ];
  }, [kpis.totalExternalityMn]);

  /* ── Lifecycle GHG distribution ────────────────────────────────── */
  const ghgDistribution = useMemo(() => {
    const buckets = [
      { range:'0-10K', min:0, max:10000, count:0 },
      { range:'10K-50K', min:10000, max:50000, count:0 },
      { range:'50K-100K', min:50000, max:100000, count:0 },
      { range:'100K-200K', min:100000, max:200000, count:0 },
      { range:'200K+', min:200000, max:Infinity, count:0 },
    ];
    portfolio.forEach(c => {
      const b = buckets.find(b => c.lifecycleGHG >= b.min && c.lifecycleGHG < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [portfolio]);

  /* ── Water stress by commodity ─────────────────────────────────── */
  const waterStressData = useMemo(() => {
    return commodityExposureRanked.slice(0, 8).map(c => {
      const members = portfolio.filter(p => p.topCommodity === c.commodity);
      return {
        commodity: c.commodity,
        avgWater: Math.round(members.reduce((a, p) => a + p.waterFootprint, 0) / Math.max(1, members.length)),
        companies: c.companies,
      };
    });
  }, [commodityExposureRanked, portfolio]);

  /* ── Dimension filter logic ────────────────────────────────────── */
  const dimFilteredPortfolio = useMemo(() => {
    if (dimFilter === 'all') return filteredPortfolio;
    return [...filteredPortfolio].sort((a,b) => {
      if (dimFilter === 'financial') return b.dimensionFinancial - a.dimensionFinancial;
      if (dimFilter === 'esg') return b.dimensionESG - a.dimensionESG;
      return b.dimensionClimate - a.dimensionClimate;
    });
  }, [filteredPortfolio, dimFilter]);

  /* ── localStorage persist settings ─────────────────────────────── */
  useEffect(() => {
    try { localStorage.setItem('ra_commodity_hub_settings_v1', JSON.stringify({ riskSlider, dimFilter, activeTab })); } catch {}
  }, [riskSlider, dimFilter, activeTab]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ra_commodity_hub_settings_v1'));
      if (saved) {
        if (saved.riskSlider != null) setRiskSlider(saved.riskSlider);
        if (saved.dimFilter) setDimFilter(saved.dimFilter);
        if (saved.activeTab) setActiveTab(saved.activeTab);
      }
    } catch {}
  }, []);

  /* =================================================================
     RENDER
     ================================================================= */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px 60px' }}>

      {/* ── 1. HEADER ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:28 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.navy, letterSpacing:-.5 }}>Commodity Lifecycle Intelligence</h1>
            <Badge bg={T.navy+'14'} color={T.navy}>Hub</Badge>
            <Badge bg={T.gold+'22'} color={T.gold}>50 Commodities</Badge>
            <Badge bg={T.sage+'22'} color={T.sage}>3 Dimensions</Badge>
          </div>
          <p style={{ margin:0, fontSize:13, color:T.textSec }}>Finance x ESG x Climate \u2014 Central executive view aggregating all Sprint Y modules</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCSV} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy }}>Export CSV</button>
          <button onClick={exportJSON} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy }}>Full Report JSON</button>
          <button onClick={exportPrint} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy }}>Print</button>
        </div>
      </div>

      {/* ── 2. MODULE STATUS CARDS (7) ────────────────────────────── */}
      <SectionTitle badge="7 Modules">Sprint Y Module Status</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12, marginBottom:24 }}>
        {MODULES.map(m => (
          <Card key={m.id} onClick={() => navigate(m.path)} style={{ borderLeft:`4px solid ${m.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{m.icon} {m.name}</span>
              <Badge bg={m.color+'18'} color={m.color}>Active</Badge>
            </div>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:8, lineHeight:1.4 }}>{m.description}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.entries(m.metrics).map(([k, v]) => (
                <span key={k} style={{ fontSize:10, color:T.textMut, background:T.surfaceH, padding:'2px 6px', borderRadius:4 }}>{k}: <b style={{ color:T.navy }}>{v}</b></span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* ── 3. KPI CARDS (16, 2 rows) ─────────────────────────────── */}
      <SectionTitle badge="16 KPIs">Key Performance Indicators</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:8 }}>
        <KPICard label="Commodities Tracked" value={kpis.commoditiesTracked} sub="50 universe" color={T.navy} />
        <KPICard label="Supply Chains Mapped" value={fmtK(kpis.supplyChains)} sub={`${portfolio.length} companies`} color={T.navyL} />
        <KPICard label="Products Assessed (LCA)" value={fmtK(kpis.lcaProducts)} sub="Cradle-to-grave" color={T.sage} />
        <KPICard label="Financial Flows" value={fmtMn(kpis.financialFlows)} sub="Modeled" color={T.gold} />
        <KPICard label="ESG Value Chains" value={`${kpis.esgValueChains}/100`} sub="Avg score" color={T.sage} />
        <KPICard label="Climate Impacts" value={`${fmtK(kpis.climateImpacts)}K tCO\u2082`} sub="Total lifecycle" color='#0d9488' />
        <KPICard label="Carbon Price (EUA)" value={`\u20AC${kpis.carbonPriceEUA}`} sub="EU ETS" color={T.navyL} />
        <KPICard label="Oil Price (WTI)" value={`$${kpis.oilWTI}`} sub="$/bbl" color={T.red} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:28 }}>
        <KPICard label="Lithium Price" value={`$${fmtK(kpis.lithiumPrice)}`} sub="$/mt" color='#7c3aed' />
        <KPICard label="Commodity Exposure" value={`${kpis.commodityExposure}%`} sub="Portfolio avg" color={T.amber} />
        <KPICard label="Externality Gap" value={fmtMn(kpis.externalityGap)} sub="Hidden costs" color={T.red} />
        <KPICard label="Circular Economy" value={`${kpis.circularScore}/100`} sub="Avg score" color={T.sage} />
        <KPICard label="EUDR Compliance" value={`${kpis.eudrCompliance}%`} sub="Portfolio avg" color={T.green} />
        <KPICard label="Child Labor Exposure" value={`${kpis.childLaborExposure}%`} sub="High-risk cos" color={T.red} />
        <KPICard label="Best Performer" value={kpis.bestPerformer?.slice(0,12)} sub="Lifecycle score" color={T.green} />
        <KPICard label="ML Model R\u00B2" value={`${kpis.mlR2}%`} sub="Avg accuracy" color={T.navyL} />
      </div>

      {/* ── 4. THREE-DIMENSION SUMMARY ────────────────────────────── */}
      <SectionTitle badge="3 Pillars">Finance x ESG x Climate Dimensions</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:28 }}>
        <Card onClick={() => navigate('/financial-flow')} style={{ borderTop:`4px solid ${T.gold}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Financial Dimension</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.textSec }}>Total Commodity Exposure</span>
            <span style={{ fontSize:14, fontWeight:700, color:T.gold }}>{fmtMn(kpis.totalFinFlowMn)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.textSec }}>Externality Gap</span>
            <span style={{ fontSize:14, fontWeight:700, color:T.red }}>{fmtMn(kpis.totalExternalityMn)}</span>
          </div>
          <div style={{ fontSize:11, color:T.textMut }}>Commodity financial flows modeled across {portfolio.length} companies</div>
        </Card>
        <Card onClick={() => navigate('/esg-value-chain')} style={{ borderTop:`4px solid ${T.sage}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>ESG Dimension</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.textSec }}>Avg Value Chain Score</span>
            <span style={{ fontSize:14, fontWeight:700, color:T.sage }}>{Math.round(kpis.avgESGVC)}/100</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.textSec }}>Worst Commodity</span>
            <span style={{ fontSize:14, fontWeight:700, color:T.red }}>{kpis.worstCommodity?.company_name?.slice(0,16) || 'N/A'}</span>
          </div>
          <div style={{ fontSize:11, color:T.textMut }}>Multi-tier ESG analysis across 5 supply chain tiers</div>
        </Card>
        <Card onClick={() => navigate('/climate-nature-repo')} style={{ borderTop:`4px solid #0d9488` }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Climate / Nature Dimension</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.textSec }}>Total Lifecycle GHG</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#0d9488' }}>{fmtK(kpis.totalGHG)} tCO\u2082</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:T.textSec }}>Water / Biodiversity</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#0284c7' }}>{fmtK(kpis.totalWater)} m\u00B3 / {kpis.totalBio} sp.</span>
          </div>
          <div style={{ fontSize:11, color:T.textMut }}>Full lifecycle: GHG, water footprint, biodiversity impact</div>
        </Card>
      </div>

      {/* ── 5. COMMODITY CATEGORY BAR CHART ───────────────────────── */}
      <SectionTitle badge="8 Categories">Portfolio Exposure by Commodity Category</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={categoryData} margin={{ top:10, right:30, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="category" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis yAxisId="left" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Exposure %', angle:-90, position:'insideLeft', style:{ fontSize:11, fill:T.textMut } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Sustainability', angle:90, position:'insideRight', style:{ fontSize:11, fill:T.textMut } }} />
            <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:`1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Bar yAxisId="left" dataKey="exposure" name="Portfolio Exposure %" fill={T.navy} radius={[4,4,0,0]}>
              {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Bar>
            <Line yAxisId="right" dataKey="sustainability" name="Sustainability Score" stroke={T.gold} strokeWidth={2} dot={{ r:4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 5b. DIMENSION RADAR ─────────────────────────────────── */}
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:'0 0 320px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Portfolio Risk Radar</div>
            <ResponsiveContainer width={320} height={260}>
              <RadarChart data={dimensionRadar}>
                <PolarGrid stroke={T.borderL} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize:10, fill:T.textSec }} />
                <PolarRadiusAxis tick={{ fontSize:9 }} domain={[0, 100]} />
                <Radar name="Portfolio Avg" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Dimension Filter</div>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {[{id:'all',label:'All'},{id:'financial',label:'Financial'},{id:'esg',label:'ESG'},{id:'climate',label:'Climate'}].map(d => (
                <button key={d.id} onClick={() => setDimFilter(d.id)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${dimFilter===d.id?T.navy:T.border}`, background:dimFilter===d.id?T.navy:T.surface, color:dimFilter===d.id?'#fff':T.navy, fontSize:11, fontWeight:600, cursor:'pointer' }}>{d.label}</button>
              ))}
            </div>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>Filtered: <b>{dimFilteredPortfolio.length}</b> companies above risk threshold {riskSlider}</div>
            <div style={{ fontSize:11, color:T.textMut }}>
              {dimensionRadar.map(d => (
                <div key={d.dimension} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:`1px solid ${T.borderL}` }}>
                  <span>{d.dimension}</span>
                  <span style={{ fontWeight:600, color:d.value > 60 ? T.red : d.value > 40 ? T.amber : T.green }}>{d.value}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 5c. SECTOR EXTERNALITY BREAKDOWN ──────────────────────── */}
      <SectionTitle badge={`${sectorBreakdown.length} Sectors`}>Sector Externality Breakdown</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'name', label:'Sector' },
            { key:'count', label:'Companies', align:'right' },
            { key:'exposure', label:'Avg Exposure %', align:'right' },
            { key:'avgRisk', label:'Avg Risk', align:'right', render:v => <span style={{ fontWeight:700, color:v>60?T.red:v>40?T.amber:T.green }}>{v}</span> },
            { key:'totalGHG', label:'Total GHG tCO\u2082', align:'right', render:v => fmtK(v) },
            { key:'totalExt', label:'Externality $Mn', align:'right', render:v => <span style={{ fontWeight:700, color:T.red }}>${v}</span> },
          ]}
          data={sectorBreakdown}
          maxRows={12}
        />
      </Card>

      {/* ── 5d. EXTERNALITY TYPE PIE ─────────────────────────────── */}
      <SectionTitle badge="7 Types">Externality Cost Breakdown</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
          <ResponsiveContainer width={300} height={260}>
            <PieChart>
              <Pie data={externalityBreakdown} dataKey="share" nameKey="type" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({type,share})=>`${type} ${share}%`} labelLine={{ stroke:T.borderL }} style={{ fontSize:10 }}>
                {externalityBreakdown.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize:11, borderRadius:8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex:1, minWidth:200 }}>
            {externalityBreakdown.map(e => (
              <div key={e.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${T.borderL}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:e.color }} />
                  <span style={{ fontSize:12, color:T.text }}>{e.type}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>${e.amount}Mn</span>
                  <span style={{ fontSize:10, color:T.textMut, marginLeft:6 }}>({e.share}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── 5e. GHG DISTRIBUTION HISTOGRAM ───────────────────────── */}
      <SectionTitle badge="Distribution">Lifecycle GHG Distribution</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ghgDistribution} margin={{ top:5, right:20, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="range" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Companies', angle:-90, position:'insideLeft', style:{ fontSize:11, fill:T.textMut } }} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
            <Bar dataKey="count" name="Companies" fill="#0d9488" radius={[4,4,0,0]}>
              {ghgDistribution.map((_, i) => <Cell key={i} fill={['#16a34a','#65a30d','#d97706','#dc2626','#7c2d12'][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 5f. WATER STRESS BY COMMODITY ─────────────────────────── */}
      <SectionTitle badge="Water">Water Stress by Commodity Exposure</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={waterStressData} layout="vertical" margin={{ top:5, right:30, left:80, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Avg Water Footprint (m\u00B3)', position:'insideBottom', style:{ fontSize:10, fill:T.textMut } }} />
            <YAxis dataKey="commodity" type="category" tick={{ fontSize:11, fill:T.textSec }} width={75} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
            <Bar dataKey="avgWater" name="Avg Water (m\u00B3)" fill="#0284c7" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 5g. COMMODITY EXPOSURE RANKING ────────────────────────── */}
      <SectionTitle badge="Ranked">Commodity Exposure Ranking</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'commodity', label:'Commodity Category' },
            { key:'companies', label:'Companies', align:'right' },
            { key:'avgExposure', label:'Avg Exposure %', align:'right' },
            { key:'totalFlowMn', label:'Total Flow $Mn', align:'right', render:v => fmtMn(v) },
            { key:'avgESG', label:'Avg ESG Score', align:'right', render:v => <span style={{ fontWeight:700, color:v>60?T.green:v>40?T.amber:T.red }}>{v}/100</span> },
          ]}
          data={commodityExposureRanked}
          maxRows={10}
        />
      </Card>

      {/* ── 6. QUICK ACTIONS (7) ──────────────────────────────────── */}
      <SectionTitle badge="Navigate">Quick Actions</SectionTitle>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:28 }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => navigate(m.path)} style={{ padding:'10px 18px', borderRadius:10, border:`1px solid ${m.color}44`, background:m.color+'0D', color:m.color, fontWeight:600, fontSize:12, cursor:'pointer', transition:'all .2s' }} onMouseEnter={e => e.currentTarget.style.background=m.color+'22'} onMouseLeave={e => e.currentTarget.style.background=m.color+'0D'}>
            {m.icon} {m.name}
          </button>
        ))}
      </div>

      {/* ── 7. TOP 10 COMMODITY RISKS ─────────────────────────────── */}
      <SectionTitle badge="Combined Ranking">Top 10 Commodity Risks</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:12, color:T.textSec }}>Risk threshold: {riskSlider}</span>
          <input type="range" min={0} max={100} value={riskSlider} onChange={e => setRiskSlider(Number(e.target.value))} style={{ width:200, accentColor:T.navy }} />
        </div>
        <SortableTable
          columns={[
            { key:'company_name', label:'Company' },
            { key:'sector', label:'Sector' },
            { key:'topCommodity', label:'Top Commodity' },
            { key:'compositeRisk', label:'Composite Risk', align:'right', render:v => <span style={{ fontWeight:700, color:v>70?T.red:v>50?T.amber:T.green }}>{v}</span> },
            { key:'dimensionFinancial', label:'Financial', align:'right' },
            { key:'dimensionESG', label:'ESG', align:'right' },
            { key:'dimensionClimate', label:'Climate', align:'right' },
            { key:'commodityExposurePct', label:'Exposure %', align:'right' },
          ]}
          data={topRisks}
          maxRows={10}
        />
      </Card>

      {/* ── 8. SUPPLY CHAIN ALERT SUMMARY ─────────────────────────── */}
      <SectionTitle badge={`${ALERT_TYPES.reduce((a,t)=>a+t.count,0)} Alerts`}>Supply Chain Alert Summary</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginBottom:28 }}>
        {ALERT_TYPES.map(al => (
          <Card key={al.type} style={{ borderLeft:`4px solid ${al.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{al.type}</span>
              <Badge bg={al.color+'18'} color={al.color}>{al.severity}</Badge>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:al.color, marginBottom:4 }}>{al.count}</div>
            <div style={{ fontSize:11, color:T.textMut }}>{al.commodities}</div>
          </Card>
        ))}
      </div>

      {/* ── 9. LIFECYCLE IMPACT SUMMARY ───────────────────────────── */}
      <SectionTitle badge="LCA">Lifecycle Impact Summary</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
        <Card style={{ borderTop:`3px solid ${T.green}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:8 }}>Best Lifecycle Performer</div>
          <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{kpis.bestLCA?.company_name || 'N/A'}</div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Circular Score: <b>{kpis.bestLCA?.circularScore || 0}/100</b></div>
          <div style={{ fontSize:11, color:T.textMut }}>Sector: {kpis.bestLCA?.sector || 'N/A'} | GHG: {fmtK(kpis.bestLCA?.lifecycleGHG || 0)} tCO\u2082</div>
        </Card>
        <Card style={{ borderTop:`3px solid ${T.red}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:8 }}>Worst Lifecycle Performer</div>
          <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{kpis.worstLCA?.company_name || 'N/A'}</div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Circular Score: <b>{kpis.worstLCA?.circularScore || 0}/100</b></div>
          <div style={{ fontSize:11, color:T.textMut }}>Sector: {kpis.worstLCA?.sector || 'N/A'} | GHG: {fmtK(kpis.worstLCA?.lifecycleGHG || 0)} tCO\u2082</div>
        </Card>
      </div>

      {/* ── 10. EXTERNALITY DASHBOARD ─────────────────────────────── */}
      <SectionTitle badge="Hidden Cost">Externality Dashboard</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:40, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:4 }}>Portfolio Market Value (Commodity-linked)</div>
            <div style={{ fontSize:24, fontWeight:800, color:T.navy }}>{fmtMn(kpis.totalFinFlowMn)}</div>
            <div style={{ fontSize:12, color:T.textSec, marginTop:12, marginBottom:4 }}>Total Externality Cost</div>
            <div style={{ fontSize:24, fontWeight:800, color:T.red }}>{fmtMn(kpis.totalExternalityMn)}</div>
            <div style={{ fontSize:12, color:T.textSec, marginTop:12, marginBottom:4 }}>Externality as % of Value</div>
            <div style={{ fontSize:20, fontWeight:700, color:T.amber }}>{fmt(kpis.totalExternalityMn / Math.max(1, kpis.totalFinFlowMn) * 100, 1)}%</div>
          </div>
          <div style={{ flex:1, minWidth:250 }}>
            <div style={{ fontSize:12, color:T.textMut, fontWeight:600, marginBottom:8 }}>Hidden Cost Gauge</div>
            <div style={{ background:T.surfaceH, borderRadius:12, height:32, position:'relative', overflow:'hidden' }}>
              <div style={{ background:`linear-gradient(90deg, ${T.green}, ${T.amber}, ${T.red})`, height:'100%', width:`${Math.min(100, kpis.totalExternalityMn / Math.max(1, kpis.totalFinFlowMn) * 100 * 3)}%`, borderRadius:12, transition:'width .5s' }} />
              <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', lineHeight:'32px', fontSize:12, fontWeight:700, color:T.navy }}>
                {fmt(kpis.totalExternalityMn / Math.max(1, kpis.totalFinFlowMn) * 100, 1)}% Hidden Cost
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut, marginTop:4 }}>
              <span>0% (Fully Priced)</span><span>33%+ (Severe Gap)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 11. CARBON MARKET SUMMARY ─────────────────────────────── */}
      <SectionTitle badge="6 Markets">Carbon Market Summary</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:28 }}>
        {CARBON_MKTS.map(cm => (
          <Card key={cm.id}>
            <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{cm.name}</div>
            <div style={{ fontSize:20, fontWeight:800, color:T.navy }}>{cm.id === 'EUA' || cm.id === 'UKA' ? '\u20AC' : '$'}{cm.price}</div>
            <div style={{ fontSize:12, color:cm.trend >= 0 ? T.green : T.red, fontWeight:600 }}>{cm.trend >= 0 ? '+' : ''}{cm.trend}% YoY</div>
            <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>{cm.coverage}</div>
            <div style={{ fontSize:10, color:T.textMut }}>{cm.region}</div>
          </Card>
        ))}
      </div>

      {/* ── 12. CRITICAL MINERAL SUPPLY RISK ──────────────────────── */}
      <SectionTitle badge="7 Minerals">Critical Mineral Supply Risk</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'mineral', label:'Mineral' },
            { key:'use', label:'Primary Use' },
            { key:'topProducer', label:'Top Producer' },
            { key:'geoRisk', label:'Geopolitical Risk', align:'right', render:v => <span style={{ fontWeight:700, color:v>80?T.red:v>60?T.amber:T.green }}>{v}/100</span> },
            { key:'supplyConc', label:'Supply Concentration', align:'right', render:v => <span style={{ fontWeight:700, color:v>80?T.red:v>60?T.amber:T.green }}>{v}%</span> },
            { key:'demandGrowth', label:'Demand Growth', align:'right' },
            { key:'price', label:'Price', align:'right', render:(v,r) => `${r.unit === '$/mt' ? '$' : '$'}${v.toLocaleString()} ${r.unit.replace('$/','')}` },
          ]}
          data={CRITICAL_MINERALS}
          maxRows={7}
        />
      </Card>

      {/* ── 13. CROSS-MODULE CONSISTENCY ───────────────────────────── */}
      <SectionTitle badge={`${consistency.agreementPct}% Agreement`}>Cross-Module Consistency</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Do Financial, ESG, and Climate modules agree on top 10 commodity risk rankings?</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {[{ label:'Financial Top 10', data:consistency.finTop, color:T.gold }, { label:'ESG Top 10', data:consistency.esgTop, color:T.sage }, { label:'Climate Top 10', data:consistency.climateTop, color:'#0d9488' }].map(dim => (
            <div key={dim.label}>
              <div style={{ fontSize:12, fontWeight:700, color:dim.color, marginBottom:6 }}>{dim.label}</div>
              {dim.data.slice(0, 5).map((name, j) => (
                <div key={j} style={{ fontSize:11, padding:'3px 0', color:consistency.overlap.includes(name) ? T.navy : T.textMut, fontWeight:consistency.overlap.includes(name) ? 700 : 400 }}>
                  {j + 1}. {name?.slice(0, 20)}{consistency.overlap.includes(name) ? ' \u2713' : ''}
                </div>
              ))}
              <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>+{dim.data.length - 5} more</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16, padding:'10px 14px', background:consistency.agreementPct > 50 ? T.green+'12' : T.amber+'12', borderRadius:8, fontSize:12 }}>
          <b>Consistency Score: {consistency.agreementPct}%</b> \u2014 {consistency.overlap.length} companies appear in all 3 dimension top-10 lists.
          {consistency.agreementPct < 50 ? ' Low consistency suggests divergent risk signals across dimensions.' : ' Moderate-to-high agreement across Financial, ESG, and Climate risk dimensions.'}
        </div>
      </Card>

      {/* ── 14. ML MODEL PERFORMANCE SUMMARY ──────────────────────── */}
      <SectionTitle badge={`${mlModels.length} Models`}>ML Model Performance Summary</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'model', label:'Model' },
            { key:'module', label:'Module' },
            { key:'r2', label:'R\u00B2', align:'right', render:v => <span style={{ fontWeight:700, color:v>0.9?T.green:v>0.85?T.amber:T.red }}>{(v * 100).toFixed(0)}%</span> },
            { key:'mae', label:'MAE %', align:'right' },
            { key:'features', label:'Features', align:'right' },
            { key:'updated', label:'Last Updated' },
          ]}
          data={mlModels}
          maxRows={10}
        />
        <div style={{ marginTop:12, fontSize:11, color:T.textMut }}>Average R\u00B2 across all models: <b style={{ color:T.navy }}>{fmt(mlModels.reduce((a,m) => a + m.r2, 0) / mlModels.length * 100, 1)}%</b></div>
      </Card>

      {/* ── 15. REGULATORY IMPACT ─────────────────────────────────── */}
      <SectionTitle badge="5 Frameworks">Regulatory Impact on Commodity Lifecycle</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {REGS.map(r => (
            <div key={r.name} style={{ padding:12, borderRadius:10, border:`1px solid ${T.borderL}`, background:T.surfaceH }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{r.name}</span>
                <Badge>{r.coverage}</Badge>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{r.articles.join(' \u00B7 ')}</div>
              <div style={{ fontSize:11, color:T.gold, fontWeight:600 }}>{r.commodity}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 16. CROSS-NAVIGATION ──────────────────────────────────── */}
      <SectionTitle badge="Platform">Cross-Navigation</SectionTitle>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:32 }}>
        {[
          { label:'Supply Chain Carbon', path:'/supply-chain-carbon' },
          { label:'Supply Chain Map', path:'/supply-chain-map' },
          { label:'Deforestation Monitor', path:'/deforestation-monitor' },
          { label:'TNFD Assessment', path:'/tnfd-assessment' },
          { label:'IWA Classification', path:'/iwa-classification' },
          { label:'Macro Transition', path:'/macro-transition' },
          { label:'Climate Nature Repo', path:'/climate-nature-repo' },
          { label:'Stranded Assets', path:'/stranded-assets' },
          { label:'NGFS Scenarios', path:'/ngfs-scenarios' },
          { label:'Portfolio Climate VaR', path:'/portfolio-climate-var' },
        ].map(nav => (
          <button key={nav.path} onClick={() => navigate(nav.path)} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:11, fontWeight:600, color:T.navyL, transition:'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = T.navy} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            {nav.label} \u2192
          </button>
        ))}
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <div style={{ textAlign:'center', padding:'16px 0', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textMut }}>
        Commodity Lifecycle Intelligence Hub \u00B7 Sprint Y \u00B7 50 Commodities \u00B7 3 Dimensions \u00B7 {portfolio.length} Companies \u00B7 v6.0
      </div>
    </div>
  );
}
