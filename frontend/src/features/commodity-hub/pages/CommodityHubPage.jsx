import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, ComposedChart, Treemap, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#16a34a','#9333ea','#64748b','#0891b2'];

/* =================================================================
   SPRINT Y MODULES (10 total)
   ================================================================= */
const MODULES = [
  { id:'intel', name:'Commodity Intelligence', path:'/commodity-intelligence', icon:'📊', color:'#0284c7', metrics:{ commodities:50, models:8, accuracy:'94%' }, description:'50-commodity intelligence engine with ML forecasting & geopolitical risk', dataFlows:['Price feeds','Geo-signals','Demand data'], outputsTo:['Hub','MFI','Financial Flow'] },
  { id:'inventory', name:'Global Inventory', path:'/commodity-inventory', icon:'🌍', color:'#7c3aed', metrics:{ warehouses:240, tracked:'$2.4T', alerts:18 }, description:'Real-time global commodity inventory tracking & supply chain visibility', dataFlows:['Warehouse data','Shipping','Satellite'], outputsTo:['Hub','ESG VC','Supply Chain'] },
  { id:'lca', name:'LCA Engine', path:'/lifecycle-assessment', icon:'♻', color:'#16a34a', metrics:{ products:320, categories:14, scope:'Cradle-to-Grave' }, description:'ISO 14040/14044 lifecycle assessment for commodity products', dataFlows:['EPD database','Process LCA','Emission factors'], outputsTo:['Hub','Climate/Nature','EPD Database'] },
  { id:'financial', name:'Financial Flow', path:'/financial-flow', icon:'💰', color:'#d97706', metrics:{ flows:'$890Bn', externalities:'$142Bn', coverage:'95%' }, description:'Commodity financial flow mapping with externality pricing', dataFlows:['Trade data','Price signals','Carbon markets'], outputsTo:['Hub','MFI','Intelligence'] },
  { id:'esgvc', name:'ESG Value Chain', path:'/esg-value-chain', icon:'🌱', color:'#5a8a6a', metrics:{ chains:85, tiers:5, risks:342 }, description:'Multi-tier ESG value chain analysis & CSDDD compliance', dataFlows:['Supplier data','ESG ratings','Due diligence'], outputsTo:['Hub','Climate/Nature','Inventory'] },
  { id:'climate', name:'Climate/Nature Repo', path:'/climate-nature-repo', icon:'☃', color:'#0d9488', metrics:{ ghgMt:1240, waterGl:85, biodiversity:'42 species' }, description:'Climate & nature impact repository: GHG, water, biodiversity', dataFlows:['GHG inventories','Water data','Biodiversity DB'], outputsTo:['Hub','LCA','ESG VC'] },
  { id:'mfi', name:'Multi-Factor Integration', path:'/multi-factor-integration', icon:'🧩', color:'#dc2626', metrics:{ factors:12, signals:890, alpha:'2.8%' }, description:'Integrated commodity factor model: Financial x ESG x Climate', dataFlows:['Factor signals','Alpha models','Risk premia'], outputsTo:['Hub','Intelligence','Financial Flow'] },
  { id:'critical', name:'Critical Minerals', path:'/critical-minerals', icon:'⛏', color:'#8b5cf6', metrics:{ minerals:22, regions:35, supplyChains:48 }, description:'Critical mineral supply chain mapping & geopolitical risk assessment', dataFlows:['Mining data','Trade flows','Reserve estimates'], outputsTo:['Hub','Intelligence','Inventory'] },
  { id:'product', name:'Product Anatomy', path:'/product-anatomy', icon:'🔬', color:'#0891b2', metrics:{ products:180, components:'2.4K', materials:'850' }, description:'Product-level material decomposition & circular economy scoring', dataFlows:['BOM data','Material DB','Recycling rates'], outputsTo:['Hub','LCA','EPD Database'] },
  { id:'dpp', name:'Digital Product Passport', path:'/digital-product-passport', icon:'📱', color:'#ec4899', metrics:{ passports:420, compliant:'96%', blockchain:'Active' }, description:'EU DPP-compliant digital product passports for supply chain transparency', dataFlows:['Product specs','Compliance data','QR/blockchain'], outputsTo:['Hub','ESG VC','Product Anatomy'] },
];

/* =================================================================
   REGULATORY FRAMEWORK
   ================================================================= */
const REGS = [
  { name:'EU Taxonomy', articles:['6 Env. Objectives','DNSH','Minimum Safeguards'], coverage:'EU', commodity:'Screening criteria for commodity-linked activities', deadline:'2026 Q1', impactScore:85 },
  { name:'CBAM', articles:['Carbon Border Tax','Embedded Emissions','Certificate Purchase'], coverage:'EU', commodity:'Steel, aluminum, cement, fertilizers, hydrogen, electricity', deadline:'2026 Q1 (transitional)', impactScore:92 },
  { name:'EUDR', articles:['Zero-Deforestation','Due Diligence','Traceability'], coverage:'EU', commodity:'Palm oil, soy, cocoa, coffee, rubber, cattle, wood', deadline:'2025 Dec 30', impactScore:88 },
  { name:'CSDDD', articles:['Value Chain Due Diligence','Environmental Impact','Remediation'], coverage:'EU', commodity:'All commodities in corporate value chains', deadline:'2027', impactScore:78 },
  { name:'CSRD/ESRS', articles:['E1 Climate','E2 Pollution','E4 Biodiversity','E5 Resources'], coverage:'EU', commodity:'Commodity-linked environmental disclosures', deadline:'2025 (large)', impactScore:82 },
  { name:'SEC Climate', articles:['GHG Disclosure','Climate Risk','Scenario Analysis'], coverage:'US', commodity:'Material climate-related risks from commodity exposure', deadline:'2026 (phased)', impactScore:72 },
  { name:'ISSB S1/S2', articles:['General Sustainability','Climate-Related'], coverage:'Global', commodity:'Scope 1-3 GHG, transition & physical risk from commodities', deadline:'2025+', impactScore:80 },
];

/* =================================================================
   CRITICAL MINERALS
   ================================================================= */
const CRITICAL_MINERALS = [
  { mineral:'Lithium', use:'EV Batteries', topProducer:'Australia (52%)', geoRisk:78, supplyConc:82, demandGrowth:'+28%/yr', price:14200, unit:'$/mt', reserveYears:17, recyclingRate:5 },
  { mineral:'Cobalt', use:'Battery Cathodes', topProducer:'DRC (74%)', geoRisk:92, supplyConc:95, demandGrowth:'+15%/yr', price:28500, unit:'$/mt', reserveYears:12, recyclingRate:32 },
  { mineral:'Rare Earths', use:'Magnets/Electronics', topProducer:'China (70%)', geoRisk:88, supplyConc:90, demandGrowth:'+12%/yr', price:380, unit:'$/kg', reserveYears:880, recyclingRate:1 },
  { mineral:'Graphite', use:'Battery Anodes', topProducer:'China (65%)', geoRisk:82, supplyConc:85, demandGrowth:'+22%/yr', price:680, unit:'$/mt', reserveYears:25, recyclingRate:3 },
  { mineral:'Nickel', use:'Stainless/Batteries', topProducer:'Indonesia (48%)', geoRisk:62, supplyConc:68, demandGrowth:'+8%/yr', price:17200, unit:'$/mt', reserveYears:40, recyclingRate:68 },
  { mineral:'Manganese', use:'Steel/Batteries', topProducer:'South Africa (37%)', geoRisk:55, supplyConc:62, demandGrowth:'+6%/yr', price:4.8, unit:'$/kg', reserveYears:50, recyclingRate:37 },
  { mineral:'Vanadium', use:'Steel/VRFB', topProducer:'China (55%)', geoRisk:72, supplyConc:78, demandGrowth:'+10%/yr', price:32, unit:'$/kg', reserveYears:30, recyclingRate:44 },
  { mineral:'Copper', use:'Wiring/Motors', topProducer:'Chile (27%)', geoRisk:48, supplyConc:52, demandGrowth:'+4%/yr', price:8800, unit:'$/mt', reserveYears:42, recyclingRate:45 },
  { mineral:'Platinum', use:'Catalysts/Hydrogen', topProducer:'South Africa (72%)', geoRisk:65, supplyConc:88, demandGrowth:'+7%/yr', price:980, unit:'$/oz', reserveYears:200, recyclingRate:25 },
  { mineral:'Silicon', use:'Solar/Semiconductors', topProducer:'China (75%)', geoRisk:75, supplyConc:85, demandGrowth:'+18%/yr', price:2.5, unit:'$/kg', reserveYears:999, recyclingRate:12 },
];

/* =================================================================
   CARBON MARKETS
   ================================================================= */
const CARBON_MKTS = [
  { id:'EUA', name:'EU ETS (EUA)', price:68, trend:-22.5, coverage:'40% EU emissions', region:'EU', volume:'8.9 Bt', phase:'Phase 4' },
  { id:'CCA', name:'California CCA', price:38, trend:8.2, coverage:'85% CA emissions', region:'US-CA', volume:'380 Mt', phase:'4th compliance' },
  { id:'RGGI', name:'RGGI (US NE)', price:14, trend:5.5, coverage:'Power sector', region:'US-NE', volume:'86 Mt', phase:'Control period 4' },
  { id:'UKA', name:'UK ETS', price:42, trend:-8.2, coverage:'25% UK emissions', region:'UK', volume:'120 Mt', phase:'Phase 1' },
  { id:'NZU', name:'NZ ETS', price:52, trend:-15.5, coverage:'50% NZ emissions', region:'NZ', volume:'35 Mt', phase:'Transitional' },
  { id:'KCCER', name:'Korean ETS', price:8, trend:12.5, coverage:'70% KR emissions', region:'KR', volume:'590 Mt', phase:'Phase 3' },
  { id:'CN_PILOT', name:'China National ETS', price:11, trend:35.0, coverage:'Power sector', region:'CN', volume:'5.0 Bt', phase:'Phase 1' },
  { id:'VCM', name:'Voluntary (VCM)', price:6, trend:-40.0, coverage:'Global voluntary', region:'Global', volume:'250 Mt', phase:'Post-integrity' },
];

/* =================================================================
   COMMODITY RISK HEATMAP — 25 Commodities x 3 Dimensions x 6 Stages
   ================================================================= */
const HEATMAP_COMMODITIES = [
  { name:'Crude Oil', dim_financial:85, dim_esg:72, dim_climate:95, stages:{extraction:92,processing:78,transport:65,storage:42,trading:88,endUse:95} },
  { name:'Natural Gas', dim_financial:78, dim_esg:58, dim_climate:82, stages:{extraction:75,processing:62,transport:55,storage:38,trading:80,endUse:85} },
  { name:'Thermal Coal', dim_financial:92, dim_esg:88, dim_climate:98, stages:{extraction:95,processing:82,transport:60,storage:35,trading:72,endUse:98} },
  { name:'Iron Ore', dim_financial:55, dim_esg:48, dim_climate:62, stages:{extraction:72,processing:68,transport:52,storage:28,trading:55,endUse:60} },
  { name:'Steel', dim_financial:62, dim_esg:55, dim_climate:78, stages:{extraction:45,processing:85,transport:48,storage:25,trading:58,endUse:72} },
  { name:'Aluminum', dim_financial:58, dim_esg:52, dim_climate:72, stages:{extraction:65,processing:82,transport:42,storage:22,trading:52,endUse:55} },
  { name:'Copper', dim_financial:48, dim_esg:45, dim_climate:55, stages:{extraction:62,processing:58,transport:38,storage:20,trading:48,endUse:45} },
  { name:'Lithium', dim_financial:72, dim_esg:62, dim_climate:48, stages:{extraction:78,processing:72,transport:35,storage:28,trading:65,endUse:25} },
  { name:'Cobalt', dim_financial:82, dim_esg:92, dim_climate:45, stages:{extraction:95,processing:72,transport:42,storage:32,trading:68,endUse:22} },
  { name:'Palm Oil', dim_financial:55, dim_esg:95, dim_climate:88, stages:{extraction:92,processing:55,transport:45,storage:35,trading:62,endUse:42} },
  { name:'Soybeans', dim_financial:42, dim_esg:78, dim_climate:68, stages:{extraction:82,processing:45,transport:38,storage:28,trading:52,endUse:35} },
  { name:'Cocoa', dim_financial:65, dim_esg:88, dim_climate:62, stages:{extraction:85,processing:55,transport:48,storage:32,trading:72,endUse:28} },
  { name:'Coffee', dim_financial:58, dim_esg:72, dim_climate:55, stages:{extraction:78,processing:52,transport:45,storage:30,trading:68,endUse:25} },
  { name:'Cotton', dim_financial:45, dim_esg:75, dim_climate:58, stages:{extraction:82,processing:65,transport:35,storage:22,trading:48,endUse:42} },
  { name:'Rubber', dim_financial:42, dim_esg:72, dim_climate:55, stages:{extraction:78,processing:52,transport:38,storage:25,trading:45,endUse:38} },
  { name:'Wheat', dim_financial:35, dim_esg:38, dim_climate:45, stages:{extraction:52,processing:35,transport:28,storage:22,trading:42,endUse:25} },
  { name:'Rice', dim_financial:38, dim_esg:42, dim_climate:58, stages:{extraction:55,processing:38,transport:25,storage:20,trading:38,endUse:35} },
  { name:'Gold', dim_financial:32, dim_esg:68, dim_climate:42, stages:{extraction:82,processing:55,transport:22,storage:15,trading:38,endUse:18} },
  { name:'Cement', dim_financial:45, dim_esg:48, dim_climate:85, stages:{extraction:52,processing:92,transport:48,storage:18,trading:35,endUse:72} },
  { name:'Timber', dim_financial:38, dim_esg:62, dim_climate:45, stages:{extraction:75,processing:42,transport:38,storage:22,trading:35,endUse:28} },
  { name:'Cattle/Beef', dim_financial:52, dim_esg:85, dim_climate:92, stages:{extraction:95,processing:72,transport:48,storage:35,trading:55,endUse:45} },
  { name:'Nickel', dim_financial:55, dim_esg:52, dim_climate:58, stages:{extraction:68,processing:62,transport:35,storage:22,trading:52,endUse:42} },
  { name:'Rare Earths', dim_financial:78, dim_esg:72, dim_climate:48, stages:{extraction:85,processing:75,transport:42,storage:28,trading:72,endUse:22} },
  { name:'Hydrogen', dim_financial:68, dim_esg:28, dim_climate:35, stages:{extraction:15,processing:72,transport:58,storage:65,trading:55,endUse:18} },
  { name:'Fertilizers', dim_financial:48, dim_esg:58, dim_climate:72, stages:{extraction:52,processing:75,transport:42,storage:28,trading:45,endUse:68} },
];

/* =================================================================
   SUPPLY CHAIN ALERTS
   ================================================================= */
const ALERT_TYPES = [
  { type:'EUDR Non-Compliance', count:12, severity:'Critical', commodities:'Palm Oil, Soy, Cocoa, Coffee', color:T.red, trend:'+3 this week' },
  { type:'Child Labor Exposure', count:8, severity:'Critical', commodities:'Cobalt, Cocoa, Coffee, Cotton', color:'#7c3aed', trend:'Stable' },
  { type:'Water Stress', count:15, severity:'High', commodities:'Cotton, Rice, Aluminum, Copper', color:'#0284c7', trend:'+5 seasonal' },
  { type:'Deforestation Risk', count:9, severity:'High', commodities:'Palm Oil, Soy, Rubber, Cattle', color:'#16a34a', trend:'-2 since Q4' },
  { type:'Stranded Asset Risk', count:6, severity:'Medium', commodities:'Coal, Oil, Gas', color:T.amber, trend:'Stable' },
  { type:'Price Volatility Spike', count:11, severity:'High', commodities:'Lithium, Nickel, Cocoa, Coffee', color:'#dc2626', trend:'+4 this month' },
  { type:'ESG Downgrade', count:7, severity:'Medium', commodities:'Oil & Gas, Mining, Agriculture', color:'#9333ea', trend:'+2 this quarter' },
  { type:'Supply Chain Disruption', count:4, severity:'Critical', commodities:'Rare Earths, Cobalt, Graphite', color:'#0d9488', trend:'New' },
  { type:'Regulatory Change', count:9, severity:'Medium', commodities:'CBAM-covered: Steel, Aluminum, Cement, Fertilizers', color:'#64748b', trend:'+3 CBAM Phase-in' },
  { type:'Sanctions/Trade Barrier', count:3, severity:'High', commodities:'Rare Earths, Nickel, Palladium', color:'#1b3a5c', trend:'Geopolitical' },
];

/* =================================================================
   SCENARIO BUILDER PRESETS
   ================================================================= */
const SCENARIO_PRESETS = [
  { id:'oil50', name:'Oil +50%', description:'WTI rises from $78 to $117/bbl due to Middle East escalation', commodity:'Crude Oil', priceChange:50, portfolioImpact:-2.8, carbonImpact:'+12% cost via CBAM', esgImpact:'Stranded asset risk increases for 14 holdings' },
  { id:'eudr_enforce', name:'EUDR Full Enforcement', description:'EU Deforestation Regulation fully enforced with penalties', commodity:'Palm Oil, Soy, Cocoa', priceChange:15, portfolioImpact:-1.2, carbonImpact:'Supply chain restructuring costs', esgImpact:'EUDR compliance scores improve 20%' },
  { id:'lithium_crash', name:'Lithium -40%', description:'Oversupply from new Chilean/Australian mines crashes lithium', commodity:'Lithium', priceChange:-40, portfolioImpact:0.8, carbonImpact:'EV cost parity accelerated 2yr', esgImpact:'Mining expansion ESG concerns' },
  { id:'cbam_full', name:'CBAM Full Phase-in', description:'EU CBAM at full rates: embedded carbon fully priced at border', commodity:'Steel, Aluminum, Cement', priceChange:8, portfolioImpact:-1.5, carbonImpact:'+$68/tCO2e border adjustment', esgImpact:'EU-compliant producers gain competitive advantage' },
  { id:'china_export_ban', name:'China RE Export Ban', description:'China restricts rare earth exports (gallium, germanium precedent)', commodity:'Rare Earths', priceChange:120, portfolioImpact:-0.9, carbonImpact:'Clean energy transition delayed 18mo', esgImpact:'Supply chain concentration risk critical' },
  { id:'drought_asia', name:'Asian Drought', description:'Multi-year drought in SE Asia impacts rice, rubber, palm oil production', commodity:'Rice, Rubber, Palm Oil', priceChange:35, portfolioImpact:-0.6, carbonImpact:'Deforestation pressure increases', esgImpact:'Food security risk for 2.1B people' },
  { id:'green_steel', name:'Green Steel Breakthrough', description:'H2-DRI steel reaches cost parity with conventional BOF route', commodity:'Steel', priceChange:-5, portfolioImpact:0.4, carbonImpact:'-78% per tonne embodied carbon', esgImpact:'Major positive: 7% global emissions addressable' },
  { id:'carbon100', name:'Carbon Price $100', description:'EU ETS reaches $100/tCO2 with global carbon floor', commodity:'All fossil-linked', priceChange:0, portfolioImpact:-3.2, carbonImpact:'All Scope 1+2 costs repriced', esgImpact:'Massive reallocation to low-carbon assets' },
];

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const pct = (n) => n == null ? '\u2014' : `${Math.round(n)}%`;
const fmtMn = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;
const fmtK = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${Math.round(n)}`;
const riskColor = (v) => v > 70 ? T.red : v > 50 ? T.amber : v > 30 ? '#ca8a04' : T.green;

/* =================================================================
   ENRICHMENT - Wraps portfolio with commodity lifecycle intelligence
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
  const cbamExposure = Math.round(seed(s * 91) * 50);
  const oilPriceSens = Math.round(-5 + seed(s * 97) * 10);
  const waterStressScore = Math.round(10 + seed(s * 101) * 80);
  const dataCompletenessScore = Math.round(55 + seed(s * 103) * 40);
  const productPassportCoverage = Math.round(20 + seed(s * 107) * 75);
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
    cbamExposure, oilPriceSens, waterStressScore, dataCompletenessScore,
    productPassportCoverage,
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
const KPICard = ({ label, value, sub, color, trend }) => (
  <Card style={{ textAlign:'center', minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
    {trend && <div style={{ fontSize:10, color:trend.startsWith('+') ? T.green : trend.startsWith('-') ? T.red : T.textMut, marginTop:2 }}>{trend}</div>}
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
const HeatCell = ({ value, size=32 }) => {
  const bg = value > 80 ? '#dc262644' : value > 60 ? '#d9770644' : value > 40 ? '#ca8a0433' : value > 20 ? '#16a34a33' : '#16a34a18';
  const txt = value > 80 ? '#dc2626' : value > 60 ? '#d97706' : value > 40 ? '#92400e' : '#16a34a';
  return <div style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, background:bg, fontSize:10, fontWeight:700, color:txt }}>{value}</div>;
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
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [heatmapDim, setHeatmapDim] = useState('dim_financial');
  const [alertFilter, setAlertFilter] = useState('all');
  const [drilldownCompany, setDrilldownCompany] = useState(null);

  /* -- Load portfolio WRAPPED ---------------------------------------- */
  const portfolio = useMemo(() => {
    const raw = loadLS(LS_PORT);
    const base = raw && Array.isArray(raw.holdings) ? raw.holdings : raw && Array.isArray(raw) ? raw : GLOBAL_COMPANY_MASTER.slice(0, 30);
    return base.map((c, i) => enrichCommodityHub(c, i));
  }, []);

  /* -- Aggregate KPIs ------------------------------------------------ */
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
    const avgCBAM = portfolio.reduce((a, c) => a + c.cbamExposure, 0) / n;
    const avgDataComp = portfolio.reduce((a, c) => a + c.dataCompletenessScore, 0) / n;
    const avgDPP = portfolio.reduce((a, c) => a + c.productPassportCoverage, 0) / n;
    const avgWaterStress = portfolio.reduce((a, c) => a + c.waterStressScore, 0) / n;
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
      avgCBAM: Math.round(avgCBAM), avgDataComp: Math.round(avgDataComp),
      avgDPP: Math.round(avgDPP), avgWaterStress: Math.round(avgWaterStress),
      n, totalSC, totalLCA,
    };
  }, [portfolio]);

  /* -- Category chart data ------------------------------------------- */
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

  /* -- Top 10 Commodity Risks ---------------------------------------- */
  const topRisks = useMemo(() =>
    [...portfolio].sort((a, b) => b.compositeRisk - a.compositeRisk).slice(0, 10)
  , [portfolio]);

  /* -- Cross-module consistency -------------------------------------- */
  const consistency = useMemo(() => {
    const fin = [...portfolio].sort((a, b) => b.dimensionFinancial - a.dimensionFinancial).slice(0, 10).map(c => c.company_name);
    const esg = [...portfolio].sort((a, b) => b.dimensionESG - a.dimensionESG).slice(0, 10).map(c => c.company_name);
    const clm = [...portfolio].sort((a, b) => b.dimensionClimate - a.dimensionClimate).slice(0, 10).map(c => c.company_name);
    const overlap = fin.filter(n => esg.includes(n) && clm.includes(n));
    return { finTop:fin, esgTop:esg, climateTop:clm, agreementPct:Math.round((overlap.length / 10) * 100), overlap };
  }, [portfolio]);

  /* -- ML model performance ------------------------------------------ */
  const mlModels = useMemo(() => [
    { model:'Price Forecast (LSTM)', module:'Intelligence', r2:0.94, mae:2.8, features:42, updated:'2026-03-22', drift:0.02, retrainDue:'2026-04-05' },
    { model:'Supply Disruption (XGBoost)', module:'Inventory', r2:0.88, mae:5.2, features:28, updated:'2026-03-20', drift:0.04, retrainDue:'2026-04-01' },
    { model:'LCA Impact (Random Forest)', module:'LCA Engine', r2:0.91, mae:3.5, features:35, updated:'2026-03-21', drift:0.01, retrainDue:'2026-04-10' },
    { model:'Externality Pricing (GBM)', module:'Financial Flow', r2:0.86, mae:6.1, features:22, updated:'2026-03-19', drift:0.05, retrainDue:'2026-03-30' },
    { model:'ESG Value Chain (Neural Net)', module:'ESG VC', r2:0.89, mae:4.2, features:38, updated:'2026-03-22', drift:0.03, retrainDue:'2026-04-08' },
    { model:'Climate Impact (Ensemble)', module:'Climate/Nature', r2:0.92, mae:3.1, features:45, updated:'2026-03-21', drift:0.02, retrainDue:'2026-04-12' },
    { model:'Multi-Factor Alpha (Ridge)', module:'MFI', r2:0.85, mae:7.2, features:52, updated:'2026-03-22', drift:0.06, retrainDue:'2026-03-28' },
    { model:'Geopolitical Risk (BERT)', module:'Intelligence', r2:0.82, mae:8.5, features:18, updated:'2026-03-18', drift:0.08, retrainDue:'2026-03-26' },
    { model:'Mineral Supply (Prophet)', module:'Critical Minerals', r2:0.87, mae:5.8, features:24, updated:'2026-03-20', drift:0.03, retrainDue:'2026-04-06' },
    { model:'Product Decomp (CNN)', module:'Product Anatomy', r2:0.90, mae:4.0, features:60, updated:'2026-03-22', drift:0.02, retrainDue:'2026-04-15' },
    { model:'DPP Compliance (Logistic)', module:'Digital Passport', r2:0.93, mae:2.2, features:15, updated:'2026-03-23', drift:0.01, retrainDue:'2026-04-20' },
    { model:'Circular Economy (GNN)', module:'Product Anatomy', r2:0.84, mae:6.8, features:32, updated:'2026-03-19', drift:0.05, retrainDue:'2026-04-02' },
  ], []);

  /* -- Data completeness per module ---------------------------------- */
  const dataCompleteness = useMemo(() => MODULES.map((m, i) => ({
    module: m.name.slice(0, 18),
    coverage: Math.round(65 + seed(i * 131) * 30),
    freshness: Math.round(70 + seed(i * 137) * 28),
    quality: Math.round(60 + seed(i * 139) * 35),
    totalScore: Math.round(65 + seed(i * 143) * 30),
  })), []);

  /* -- Executive narrative insights ---------------------------------- */
  const narrativeInsights = useMemo(() => {
    const insights = [];
    if (kpis.childLaborExposure > 20) insights.push({ severity:'Critical', text:`${kpis.childLaborExposure}% of portfolio has high child labor risk exposure via cobalt and cocoa supply chains. Recommend immediate due diligence escalation.` });
    if (kpis.eudrCompliance < 70) insights.push({ severity:'High', text:`Average EUDR compliance at ${kpis.eudrCompliance}%. ${portfolio.filter(c => c.eudrCompliance < 50).length} companies below 50% threshold face enforcement risk by Dec 2025.` });
    if (kpis.avgCBAM > 25) insights.push({ severity:'Medium', text:`CBAM exposure averaging ${kpis.avgCBAM}% across portfolio. Steel and aluminum holdings face $${Math.round(kpis.avgCBAM * 0.68)}M/yr additional costs at full phase-in.` });
    const highRiskCount = portfolio.filter(c => c.compositeRisk > 70).length;
    if (highRiskCount > 3) insights.push({ severity:'High', text:`${highRiskCount} holdings exceed 70/100 composite commodity risk. Top concern: ${topRisks[0]?.company_name} at ${topRisks[0]?.compositeRisk}/100.` });
    insights.push({ severity:'Info', text:`Portfolio tracks ${kpis.commoditiesTracked} commodities across ${kpis.n} holdings. ${kpis.totalSC} supply chains mapped, ${kpis.totalLCA} products assessed via LCA. ML models averaging ${kpis.mlR2}% R\u00B2 accuracy.` });
    insights.push({ severity:'Info', text:`Data completeness: ${kpis.avgDataComp}% average across all modules. Digital Product Passport coverage: ${kpis.avgDPP}%. Water stress score: ${kpis.avgWaterStress}/100.` });
    if (kpis.totalExternalityMn > 500) insights.push({ severity:'High', text:`Total hidden externality costs of ${fmtMn(kpis.totalExternalityMn)} represent ${fmt(kpis.totalExternalityMn / Math.max(1, kpis.totalFinFlowMn) * 100, 1)}% of commodity financial flows. Carbon emissions account for 32%.` });
    return insights;
  }, [kpis, portfolio, topRisks]);

  /* -- Scenario builder combined impact ------------------------------ */
  const scenarioImpact = useMemo(() => {
    if (selectedScenarios.length === 0) return null;
    const active = SCENARIO_PRESETS.filter(s => selectedScenarios.includes(s.id));
    const totalPortfolioImpact = active.reduce((a, s) => a + s.portfolioImpact, 0);
    return { scenarios: active, totalPortfolioImpact, count: active.length };
  }, [selectedScenarios]);

  /* -- Portfolio drilldown ------------------------------------------- */
  const drilldownData = useMemo(() => {
    if (!drilldownCompany) return null;
    const co = portfolio.find(c => c.company_name === drilldownCompany);
    if (!co) return null;
    const commodityMapping = HEATMAP_COMMODITIES.slice(0, 5).map(hc => ({
      commodity: hc.name,
      exposure: Math.round(co.commodityExposurePct * (0.3 + seed(co.company_name?.charCodeAt(0) * hc.dim_financial) * 0.7)),
      riskScore: Math.round((hc.dim_financial + hc.dim_esg + hc.dim_climate) / 3),
    })).sort((a, b) => b.exposure - a.exposure);
    return { company: co, commodityMapping };
  }, [drilldownCompany, portfolio]);

  /* -- Filtered alerts ----------------------------------------------- */
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return ALERT_TYPES;
    return ALERT_TYPES.filter(a => a.severity === alertFilter);
  }, [alertFilter]);

  /* -- Exports ------------------------------------------------------- */
  const exportCSV = useCallback(() => {
    const headers = ['Company','Sector','Commodity Exposure %','Top Commodity','Supply Chains','LCA Products','Financial Flow $Mn','Externality $Mn','ESG VC Score','Lifecycle GHG tCO2','Water m3','Biodiversity','Circular Score','EUDR Compliance %','Child Labor Risk','Composite Risk','CBAM Exposure','Data Completeness','DPP Coverage'];
    const rows = portfolio.map(c => [c.company_name, c.sector, c.commodityExposurePct, c.topCommodity, c.supplyChainsMapped, c.lcaProducts, c.financialFlowMn, c.externalityCostMn, c.esgVCScore, c.lifecycleGHG, c.waterFootprint, c.biodiversityImpact, c.circularScore, c.eudrCompliance, c.childLaborRisk, c.compositeRisk, c.cbamExposure, c.dataCompletenessScore, c.productPassportCoverage]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commodity_hub_summary_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [portfolio]);

  const exportJSON = useCallback(() => {
    const report = { generated: new Date().toISOString(), kpis, modules: MODULES.map(m => ({ ...m })), portfolio: portfolio.map(c => ({ company:c.company_name, sector:c.sector, commodityExposurePct:c.commodityExposurePct, topCommodity:c.topCommodity, compositeRisk:c.compositeRisk, esgVCScore:c.esgVCScore, lifecycleGHG:c.lifecycleGHG, circularScore:c.circularScore, cbamExposure:c.cbamExposure, dataCompletenessScore:c.dataCompletenessScore })), categoryBreakdown: categoryData, topRisks: topRisks.map(c => ({ company:c.company_name, risk:c.compositeRisk })), mlModels, consistency, carbonMarkets: CARBON_MKTS, criticalMinerals: CRITICAL_MINERALS, alerts: ALERT_TYPES, regulations: REGS, heatmap: HEATMAP_COMMODITIES, scenarios: SCENARIO_PRESETS, dataCompleteness, narrativeInsights };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commodity_hub_full_report_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [portfolio, kpis, categoryData, topRisks, mlModels, consistency, dataCompleteness, narrativeInsights]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* -- Filter portfolio by risk slider ------------------------------- */
  const filteredPortfolio = useMemo(() =>
    portfolio.filter(c => c.compositeRisk >= riskSlider)
  , [portfolio, riskSlider]);

  /* -- Sector breakdown for treemap ---------------------------------- */
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

  /* -- Dimension distribution for radar ------------------------------ */
  const dimensionRadar = useMemo(() => {
    const labels = ['Financial Risk','ESG Exposure','Climate Impact','Supply Chain','Circular Economy','Regulatory','Water Stress','Data Quality'];
    return labels.map((label, i) => {
      const vals = portfolio.map(c => {
        switch(i) {
          case 0: return c.dimensionFinancial;
          case 1: return c.dimensionESG;
          case 2: return c.dimensionClimate;
          case 3: return c.supplyChainsMapped * 8;
          case 4: return c.circularScore;
          case 5: return c.eudrCompliance;
          case 6: return c.waterStressScore;
          case 7: return c.dataCompletenessScore;
          default: return 50;
        }
      });
      return { dimension:label, value: Math.round(vals.reduce((a,v)=>a+v,0) / vals.length) };
    });
  }, [portfolio]);

  /* -- Top commodity exposures sorted -------------------------------- */
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

  /* -- Externality breakdown by type --------------------------------- */
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

  /* -- Lifecycle GHG distribution ------------------------------------ */
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

  /* -- Water stress by commodity ------------------------------------- */
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

  /* -- Dimension filter logic ---------------------------------------- */
  const dimFilteredPortfolio = useMemo(() => {
    if (dimFilter === 'all') return filteredPortfolio;
    return [...filteredPortfolio].sort((a,b) => {
      if (dimFilter === 'financial') return b.dimensionFinancial - a.dimensionFinancial;
      if (dimFilter === 'esg') return b.dimensionESG - a.dimensionESG;
      return b.dimensionClimate - a.dimensionClimate;
    });
  }, [filteredPortfolio, dimFilter]);

  /* -- Heatmap data for selected dimension --------------------------- */
  const heatmapData = useMemo(() => {
    return HEATMAP_COMMODITIES.map(c => ({
      name: c.name,
      value: c[heatmapDim],
      ...c.stages,
    }));
  }, [heatmapDim]);

  /* -- localStorage persist settings --------------------------------- */
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

      {/* -- 1. HEADER ------------------------------------------------ */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:28 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.navy, letterSpacing:-.5 }}>Commodity Lifecycle Intelligence</h1>
            <Badge bg={T.navy+'14'} color={T.navy}>Hub</Badge>
            <Badge bg={T.gold+'22'} color={T.gold}>50 Commodities</Badge>
            <Badge bg={T.sage+'22'} color={T.sage}>3 Dimensions</Badge>
            <Badge bg={'#7c3aed22'} color={'#7c3aed'}>10 Modules</Badge>
          </div>
          <p style={{ margin:0, fontSize:13, color:T.textSec }}>Finance x ESG x Climate \u2014 Central executive view aggregating all Sprint Y modules across {portfolio.length} holdings</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCSV} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy }}>Export CSV</button>
          <button onClick={exportJSON} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy }}>Full Report JSON</button>
          <button onClick={exportPrint} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:12, fontWeight:600, color:T.navy }}>Print</button>
        </div>
      </div>

      {/* -- 2. EXECUTIVE SUMMARY PANEL -------------------------------- */}
      <SectionTitle badge="Auto-Generated">Executive Summary & Narrative Insights</SectionTitle>
      <Card style={{ marginBottom:24, borderLeft:`4px solid ${T.navy}` }}>
        {narrativeInsights.map((ins, i) => {
          const sevColors = { Critical:T.red, High:T.amber, Medium:'#ca8a04', Info:T.navyL };
          return (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'8px 0', borderBottom:i < narrativeInsights.length - 1 ? `1px solid ${T.borderL}` : 'none' }}>
              <span style={{ display:'inline-block', minWidth:65, padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:(sevColors[ins.severity]||T.textMut)+'18', color:sevColors[ins.severity]||T.textMut, textAlign:'center' }}>{ins.severity}</span>
              <span style={{ fontSize:12, color:T.text, lineHeight:1.5 }}>{ins.text}</span>
            </div>
          );
        })}
      </Card>

      {/* -- 3. MODULE STATUS CARDS (10) ------------------------------- */}
      <SectionTitle badge="10 Modules">Sprint Y Module Status</SectionTitle>
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

      {/* -- 3b. CROSS-MODULE DATA FLOW -------------------------------- */}
      <SectionTitle badge="Data Flow">Cross-Module Data Flow Visualization</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>How data flows between all 10 Sprint Y modules. Each module consumes and produces data for the Hub aggregation layer.</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {MODULES.map(m => (
            <div key={m.id} style={{ padding:10, borderRadius:8, border:`2px solid ${m.color}44`, background:m.color+'08', textAlign:'center' }}>
              <div style={{ fontSize:18 }}>{m.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color:m.color, marginBottom:4 }}>{m.name.slice(0,16)}</div>
              <div style={{ fontSize:9, color:T.textMut }}>In: {m.dataFlows?.slice(0,2).join(', ')}</div>
              <div style={{ fontSize:9, color:T.sage }}>Out: {m.outputsTo?.slice(0,2).join(', ')}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:T.textMut }}>All modules feed into the Hub aggregation layer. Data refresh: Real-time for prices, daily for ESG/climate metrics, weekly for LCA updates.</div>
      </Card>

      {/* -- 4. KPI CARDS (20, 2.5 rows) ------------------------------ */}
      <SectionTitle badge="20 KPIs">Key Performance Indicators</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:8 }}>
        <KPICard label="Commodities Tracked" value={kpis.commoditiesTracked} sub="50 universe" color={T.navy} />
        <KPICard label="Supply Chains Mapped" value={fmtK(kpis.supplyChains)} sub={`${portfolio.length} companies`} color={T.navyL} />
        <KPICard label="Products Assessed (LCA)" value={fmtK(kpis.lcaProducts)} sub="Cradle-to-grave" color={T.sage} />
        <KPICard label="Financial Flows" value={fmtMn(kpis.financialFlows)} sub="Modeled" color={T.gold} />
        <KPICard label="ESG Value Chains" value={`${kpis.esgValueChains}/100`} sub="Avg score" color={T.sage} />
        <KPICard label="Climate Impacts" value={`${fmtK(kpis.climateImpacts)}K tCO\u2082`} sub="Total lifecycle" color='#0d9488' />
        <KPICard label="Carbon Price (EUA)" value={`\u20AC${kpis.carbonPriceEUA}`} sub="EU ETS" color={T.navyL} trend="-22.5% YoY" />
        <KPICard label="Oil Price (WTI)" value={`$${kpis.oilWTI}`} sub="$/bbl" color={T.red} trend="-8.3% YoY" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:8 }}>
        <KPICard label="Lithium Price" value={`$${fmtK(kpis.lithiumPrice)}`} sub="$/mt" color='#7c3aed' trend="-65% from peak" />
        <KPICard label="Commodity Exposure" value={`${kpis.commodityExposure}%`} sub="Portfolio avg" color={T.amber} />
        <KPICard label="Externality Gap" value={fmtMn(kpis.externalityGap)} sub="Hidden costs" color={T.red} />
        <KPICard label="Circular Economy" value={`${kpis.circularScore}/100`} sub="Avg score" color={T.sage} />
        <KPICard label="EUDR Compliance" value={`${kpis.eudrCompliance}%`} sub="Portfolio avg" color={T.green} />
        <KPICard label="Child Labor Exposure" value={`${kpis.childLaborExposure}%`} sub="High-risk cos" color={T.red} />
        <KPICard label="Best Performer" value={kpis.bestPerformer?.slice(0,12)} sub="Lifecycle score" color={T.green} />
        <KPICard label="ML Model R\u00B2" value={`${kpis.mlR2}%`} sub="Avg accuracy" color={T.navyL} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:28 }}>
        <KPICard label="CBAM Exposure" value={`${kpis.avgCBAM}%`} sub="Avg portfolio" color={T.amber} />
        <KPICard label="Data Completeness" value={`${kpis.avgDataComp}%`} sub="All modules" color={T.navyL} />
        <KPICard label="DPP Coverage" value={`${kpis.avgDPP}%`} sub="Product passports" color={'#ec4899'} />
        <KPICard label="Water Stress" value={`${kpis.avgWaterStress}/100`} sub="Portfolio avg" color={'#0284c7'} />
      </div>

      {/* -- 5. THREE-DIMENSION SUMMARY -------------------------------- */}
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
          <div style={{ fontSize:11, color:T.textMut }}>Commodity financial flows modeled across {portfolio.length} companies. CBAM avg: {kpis.avgCBAM}%.</div>
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
          <div style={{ fontSize:11, color:T.textMut }}>Multi-tier ESG analysis across 5 supply chain tiers. Child labor: {kpis.childLaborExposure}% high-risk.</div>
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
          <div style={{ fontSize:11, color:T.textMut }}>Full lifecycle: GHG, water footprint, biodiversity impact. Water stress: {kpis.avgWaterStress}/100.</div>
        </Card>
      </div>

      {/* -- 6. COMMODITY RISK HEATMAP --------------------------------- */}
      <SectionTitle badge="25 x 3 x 6">Commodity Risk Heatmap</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[{id:'dim_financial',label:'Financial'},{id:'dim_esg',label:'ESG'},{id:'dim_climate',label:'Climate'}].map(d => (
            <button key={d.id} onClick={() => setHeatmapDim(d.id)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${heatmapDim===d.id?T.navy:T.border}`, background:heatmapDim===d.id?T.navy:T.surface, color:heatmapDim===d.id?'#fff':T.navy, fontSize:11, fontWeight:600, cursor:'pointer' }}>{d.label}</button>
          ))}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr>
                <th style={{ padding:'6px 8px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:10, fontWeight:700, color:T.navy }}>Commodity</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, fontWeight:700, color:T.navy }}>Score</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, color:T.textMut }}>Extraction</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, color:T.textMut }}>Processing</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, color:T.textMut }}>Transport</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, color:T.textMut }}>Storage</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, color:T.textMut }}>Trading</th>
                <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:10, color:T.textMut }}>End Use</th>
              </tr>
            </thead>
            <tbody>
              {HEATMAP_COMMODITIES.slice(0, 15).map((c, ri) => (
                <tr key={c.name} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'5px 8px', fontSize:11, fontWeight:600, color:T.navy }}>{c.name}</td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c[heatmapDim]} /></td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c.stages.extraction} size={28} /></td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c.stages.processing} size={28} /></td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c.stages.transport} size={28} /></td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c.stages.storage} size={28} /></td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c.stages.trading} size={28} /></td>
                  <td style={{ padding:'5px 8px', textAlign:'center' }}><HeatCell value={c.stages.endUse} size={28} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10, color:T.textMut, marginTop:8 }}>Showing 15 of 25 commodities. Color scale: Green (&lt;30) Low risk | Yellow (30-60) Medium | Orange (60-80) High | Red (&gt;80) Critical. 6 lifecycle stages per commodity.</div>
      </Card>

      {/* -- 7. SCENARIO BUILDER --------------------------------------- */}
      <SectionTitle badge="8 Scenarios">Scenario Builder - Combined Portfolio Impact</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Select multiple scenarios to see combined portfolio impact. Toggle scenarios to model compounding risk effects.</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10, marginBottom:16 }}>
          {SCENARIO_PRESETS.map(s => {
            const isActive = selectedScenarios.includes(s.id);
            return (
              <div key={s.id} onClick={() => setSelectedScenarios(prev => isActive ? prev.filter(x => x !== s.id) : [...prev, s.id])} style={{ padding:12, borderRadius:10, border:`2px solid ${isActive ? T.navy : T.border}`, background:isActive ? T.navy+'08' : T.surface, cursor:'pointer', transition:'all .2s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{s.name}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:s.portfolioImpact > 0 ? T.green : T.red }}>{s.portfolioImpact > 0 ? '+' : ''}{s.portfolioImpact}%</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>{s.description}</div>
                <div style={{ fontSize:10, color:T.textMut }}>Commodities: {s.commodity}</div>
                <div style={{ fontSize:10, color:T.textMut }}>Carbon: {s.carbonImpact}</div>
              </div>
            );
          })}
        </div>
        {scenarioImpact && (
          <div style={{ padding:16, borderRadius:10, background:scenarioImpact.totalPortfolioImpact > 0 ? T.green+'12' : T.red+'12', border:`1px solid ${scenarioImpact.totalPortfolioImpact > 0 ? T.green : T.red}33` }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:8 }}>Combined Impact: {scenarioImpact.count} scenarios active</div>
            <div style={{ fontSize:22, fontWeight:800, color:scenarioImpact.totalPortfolioImpact > 0 ? T.green : T.red }}>{scenarioImpact.totalPortfolioImpact > 0 ? '+' : ''}{fmt(scenarioImpact.totalPortfolioImpact, 1)}% portfolio impact</div>
            <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
              {scenarioImpact.scenarios.map(s => (
                <div key={s.id} style={{ fontSize:11, color:T.textSec }}>
                  <b>{s.name}</b>: {s.portfolioImpact > 0 ? '+' : ''}{s.portfolioImpact}% | ESG: {s.esgImpact?.slice(0,40)}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* -- 8. ALERT SYSTEM ------------------------------------------- */}
      <SectionTitle badge={`${ALERT_TYPES.reduce((a,t)=>a+t.count,0)} Alerts`}>Alert System - Multi-Category Monitoring</SectionTitle>
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {['all','Critical','High','Medium'].map(f => (
          <button key={f} onClick={() => setAlertFilter(f)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${alertFilter===f?T.navy:T.border}`, background:alertFilter===f?T.navy:T.surface, color:alertFilter===f?'#fff':T.navy, fontSize:11, fontWeight:600, cursor:'pointer' }}>{f === 'all' ? 'All' : f} {f === 'all' ? `(${ALERT_TYPES.reduce((a,t)=>a+t.count,0)})` : `(${ALERT_TYPES.filter(a=>a.severity===f).reduce((a,t)=>a+t.count,0)})`}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginBottom:28 }}>
        {filteredAlerts.map(al => (
          <Card key={al.type} style={{ borderLeft:`4px solid ${al.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{al.type}</span>
              <Badge bg={al.color+'18'} color={al.color}>{al.severity}</Badge>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:al.color, marginBottom:4 }}>{al.count}</div>
            <div style={{ fontSize:11, color:T.textMut }}>{al.commodities}</div>
            <div style={{ fontSize:10, color:T.textSec, marginTop:4 }}>Trend: {al.trend}</div>
          </Card>
        ))}
      </div>

      {/* -- 9. PORTFOLIO COMMODITY DRILLDOWN -------------------------- */}
      <SectionTitle badge="Interactive">Portfolio Commodity Exposure Drill-Down</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
          <span style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Select holding:</span>
          <select value={drilldownCompany || ''} onChange={e => setDrilldownCompany(e.target.value || null)} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, minWidth:200 }}>
            <option value="">-- Choose a company --</option>
            {portfolio.slice(0, 20).map(c => <option key={c.company_name} value={c.company_name}>{c.company_name}</option>)}
          </select>
        </div>
        {drilldownData && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
              <KPICard label="Commodity Exp %" value={`${drilldownData.company.commodityExposurePct}%`} color={T.amber} />
              <KPICard label="Top Commodity" value={drilldownData.company.topCommodity?.slice(0,10)} color={T.navy} />
              <KPICard label="Supply Chains" value={drilldownData.company.supplyChainsMapped} color={T.navyL} />
              <KPICard label="Composite Risk" value={`${drilldownData.company.compositeRisk}/100`} color={riskColor(drilldownData.company.compositeRisk)} />
              <KPICard label="EUDR" value={`${drilldownData.company.eudrCompliance}%`} color={drilldownData.company.eudrCompliance > 70 ? T.green : T.amber} />
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:8 }}>Commodity Mapping for {drilldownData.company.company_name}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8 }}>
              {drilldownData.commodityMapping.map(cm => (
                <div key={cm.commodity} style={{ padding:10, borderRadius:8, border:`1px solid ${T.borderL}`, background:T.surfaceH }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{cm.commodity}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>Exposure: <b>{cm.exposure}%</b></div>
                  <div style={{ fontSize:11, color:T.textSec }}>Risk: <span style={{ fontWeight:700, color:riskColor(cm.riskScore) }}>{cm.riskScore}/100</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!drilldownData && <div style={{ fontSize:12, color:T.textMut, padding:20, textAlign:'center' }}>Select a company above to see its commodity exposure breakdown, supply chain risks, and regulatory impact.</div>}
      </Card>

      {/* -- 10. CATEGORY BAR CHART ------------------------------------ */}
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

      {/* -- 10b. DIMENSION RADAR -------------------------------------- */}
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:'0 0 320px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Portfolio Risk Radar (8 Dimensions)</div>
            <ResponsiveContainer width={320} height={280}>
              <RadarChart data={dimensionRadar}>
                <PolarGrid stroke={T.borderL} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize:9, fill:T.textSec }} />
                <PolarRadiusAxis tick={{ fontSize:9 }} domain={[0, 100]} />
                <Radar name="Portfolio Avg" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Dimension Filter</div>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
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

      {/* -- 11. SECTOR EXTERNALITY BREAKDOWN -------------------------- */}
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

      {/* -- 12. EXTERNALITY TYPE PIE ---------------------------------- */}
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

      {/* -- 13. GHG DISTRIBUTION + WATER STRESS ----------------------- */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
        <div>
          <SectionTitle badge="Distribution">Lifecycle GHG Distribution</SectionTitle>
          <Card>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ghgDistribution} margin={{ top:5, right:20, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="range" tick={{ fontSize:11, fill:T.textSec }} />
                <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${T.border}` }} />
                <Bar dataKey="count" name="Companies" fill="#0d9488" radius={[4,4,0,0]}>
                  {ghgDistribution.map((_, i) => <Cell key={i} fill={['#16a34a','#65a30d','#d97706','#dc2626','#7c2d12'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <div>
          <SectionTitle badge="Water">Water Stress by Commodity</SectionTitle>
          <Card>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={waterStressData} layout="vertical" margin={{ top:5, right:20, left:60, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
                <YAxis dataKey="commodity" type="category" tick={{ fontSize:10, fill:T.textSec }} width={55} />
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                <Bar dataKey="avgWater" name="Avg Water (m\u00B3)" fill="#0284c7" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* -- 14. DATA COMPLETENESS DASHBOARD --------------------------- */}
      <SectionTitle badge="10 Modules">Data Completeness Dashboard</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Module</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Coverage %</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Freshness %</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Quality %</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Total Score</th>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Progress</th>
            </tr></thead>
            <tbody>
              {dataCompleteness.map((dc, ri) => (
                <tr key={dc.module} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontWeight:600, color:T.navy }}>{dc.module}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', color:dc.coverage > 80 ? T.green : dc.coverage > 60 ? T.amber : T.red, fontWeight:700 }}>{dc.coverage}%</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', color:dc.freshness > 80 ? T.green : dc.freshness > 60 ? T.amber : T.red, fontWeight:700 }}>{dc.freshness}%</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', color:dc.quality > 80 ? T.green : dc.quality > 60 ? T.amber : T.red, fontWeight:700 }}>{dc.quality}%</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', fontWeight:800, color:dc.totalScore > 80 ? T.green : dc.totalScore > 60 ? T.amber : T.red }}>{dc.totalScore}%</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}` }}>
                    <div style={{ background:T.surfaceH, borderRadius:6, height:14, overflow:'hidden' }}>
                      <div style={{ background:dc.totalScore > 80 ? T.green : dc.totalScore > 60 ? T.amber : T.red, height:'100%', width:`${dc.totalScore}%`, borderRadius:6, transition:'width .5s' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* -- 15. TOP 10 COMMODITY RISKS -------------------------------- */}
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
            { key:'cbamExposure', label:'CBAM %', align:'right' },
          ]}
          data={topRisks}
          maxRows={10}
        />
      </Card>

      {/* -- 16. EXTERNALITY DASHBOARD --------------------------------- */}
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

      {/* -- 17. CARBON MARKET SUMMARY --------------------------------- */}
      <SectionTitle badge="8 Markets">Carbon Market Summary</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:28 }}>
        {CARBON_MKTS.map(cm => (
          <Card key={cm.id}>
            <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{cm.name}</div>
            <div style={{ fontSize:20, fontWeight:800, color:T.navy }}>{cm.id === 'EUA' || cm.id === 'UKA' ? '\u20AC' : '$'}{cm.price}</div>
            <div style={{ fontSize:12, color:cm.trend >= 0 ? T.green : T.red, fontWeight:600 }}>{cm.trend >= 0 ? '+' : ''}{cm.trend}% YoY</div>
            <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>{cm.coverage}</div>
            <div style={{ fontSize:10, color:T.textMut }}>Volume: {cm.volume} | {cm.phase}</div>
          </Card>
        ))}
      </div>

      {/* -- 18. CRITICAL MINERAL SUPPLY RISK -------------------------- */}
      <SectionTitle badge="10 Minerals">Critical Mineral Supply Risk</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'mineral', label:'Mineral' },
            { key:'use', label:'Primary Use' },
            { key:'topProducer', label:'Top Producer' },
            { key:'geoRisk', label:'Geo Risk', align:'right', render:v => <span style={{ fontWeight:700, color:v>80?T.red:v>60?T.amber:T.green }}>{v}/100</span> },
            { key:'supplyConc', label:'Supply Conc.', align:'right', render:v => <span style={{ fontWeight:700, color:v>80?T.red:v>60?T.amber:T.green }}>{v}%</span> },
            { key:'demandGrowth', label:'Demand', align:'right' },
            { key:'reserveYears', label:'Reserve Yrs', align:'right' },
            { key:'recyclingRate', label:'Recycling %', align:'right', render:v => <span style={{ color:v>40?T.green:v>15?T.amber:T.red, fontWeight:600 }}>{v}%</span> },
          ]}
          data={CRITICAL_MINERALS}
          maxRows={10}
        />
      </Card>

      {/* -- 19. ML MODEL PERFORMANCE ---------------------------------- */}
      <SectionTitle badge={`${mlModels.length} Models`}>ML Model Performance Summary</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'model', label:'Model' },
            { key:'module', label:'Module' },
            { key:'r2', label:'R\u00B2', align:'right', render:v => <span style={{ fontWeight:700, color:v>0.9?T.green:v>0.85?T.amber:T.red }}>{(v * 100).toFixed(0)}%</span> },
            { key:'mae', label:'MAE %', align:'right' },
            { key:'features', label:'Features', align:'right' },
            { key:'drift', label:'Drift', align:'right', render:v => <span style={{ fontWeight:600, color:v>0.05?T.red:v>0.03?T.amber:T.green }}>{(v*100).toFixed(1)}%</span> },
            { key:'updated', label:'Updated' },
            { key:'retrainDue', label:'Retrain Due' },
          ]}
          data={mlModels}
          maxRows={12}
        />
        <div style={{ marginTop:12, fontSize:11, color:T.textMut }}>Average R\u00B2 across all {mlModels.length} models: <b style={{ color:T.navy }}>{fmt(mlModels.reduce((a,m) => a + m.r2, 0) / mlModels.length * 100, 1)}%</b>. Models with drift &gt;5% flagged for retraining.</div>
      </Card>

      {/* -- 20. CROSS-MODULE CONSISTENCY ------------------------------ */}
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

      {/* -- 21. REGULATORY IMPACT ------------------------------------- */}
      <SectionTitle badge="7 Frameworks">Regulatory Impact on Commodity Lifecycle</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {REGS.map(r => (
            <div key={r.name} style={{ padding:12, borderRadius:10, border:`1px solid ${T.borderL}`, background:T.surfaceH }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{r.name}</span>
                <Badge>{r.coverage}</Badge>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{r.articles.join(' \u00B7 ')}</div>
              <div style={{ fontSize:11, color:T.gold, fontWeight:600, marginBottom:4 }}>{r.commodity}</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut }}>
                <span>Deadline: {r.deadline}</span>
                <span>Impact: <b style={{ color:r.impactScore > 80 ? T.red : r.impactScore > 60 ? T.amber : T.green }}>{r.impactScore}/100</b></span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* -- 22. LIFECYCLE IMPACT SUMMARY ------------------------------ */}
      <SectionTitle badge="LCA">Lifecycle Impact Summary</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
        <Card style={{ borderTop:`3px solid ${T.green}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:8 }}>Best Lifecycle Performer</div>
          <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{kpis.bestLCA?.company_name || 'N/A'}</div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Circular Score: <b>{kpis.bestLCA?.circularScore || 0}/100</b></div>
          <div style={{ fontSize:11, color:T.textMut }}>Sector: {kpis.bestLCA?.sector || 'N/A'} | GHG: {fmtK(kpis.bestLCA?.lifecycleGHG || 0)} tCO\u2082 | DPP: {kpis.bestLCA?.productPassportCoverage || 0}%</div>
        </Card>
        <Card style={{ borderTop:`3px solid ${T.red}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:8 }}>Worst Lifecycle Performer</div>
          <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{kpis.worstLCA?.company_name || 'N/A'}</div>
          <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>Circular Score: <b>{kpis.worstLCA?.circularScore || 0}/100</b></div>
          <div style={{ fontSize:11, color:T.textMut }}>Sector: {kpis.worstLCA?.sector || 'N/A'} | GHG: {fmtK(kpis.worstLCA?.lifecycleGHG || 0)} tCO\u2082 | DPP: {kpis.worstLCA?.productPassportCoverage || 0}%</div>
        </Card>
      </div>

      {/* -- 23. COMMODITY EXPOSURE RANKING ----------------------------- */}
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

      {/* -- 24. QUICK ACTIONS ----------------------------------------- */}
      <SectionTitle badge="Navigate">Quick Actions</SectionTitle>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:28 }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => navigate(m.path)} style={{ padding:'10px 18px', borderRadius:10, border:`1px solid ${m.color}44`, background:m.color+'0D', color:m.color, fontWeight:600, fontSize:12, cursor:'pointer', transition:'all .2s' }} onMouseEnter={e => e.currentTarget.style.background=m.color+'22'} onMouseLeave={e => e.currentTarget.style.background=m.color+'0D'}>
            {m.icon} {m.name}
          </button>
        ))}
      </div>

      {/* -- 25. PORTFOLIO FULL TABLE ------------------------------------- */}
      <SectionTitle badge={`${dimFilteredPortfolio.length} Companies`}>Full Portfolio Commodity Analysis</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <SortableTable
          columns={[
            { key:'company_name', label:'Company' },
            { key:'sector', label:'Sector' },
            { key:'commodityExposurePct', label:'Exp %', align:'right' },
            { key:'topCommodity', label:'Top Commodity' },
            { key:'supplyChainsMapped', label:'SC Maps', align:'right' },
            { key:'lcaProducts', label:'LCA Prod', align:'right' },
            { key:'financialFlowMn', label:'Fin Flow $Mn', align:'right', render:v => fmtMn(v) },
            { key:'externalityCostMn', label:'Ext $Mn', align:'right', render:v => <span style={{ color:T.red, fontWeight:700 }}>${v}</span> },
            { key:'esgVCScore', label:'ESG VC', align:'right', render:v => <span style={{ fontWeight:700, color:v>60?T.green:v>40?T.amber:T.red }}>{v}</span> },
            { key:'lifecycleGHG', label:'GHG tCO2', align:'right', render:v => fmtK(v) },
            { key:'waterFootprint', label:'Water m3', align:'right', render:v => fmtK(v) },
            { key:'circularScore', label:'Circular', align:'right', render:v => <span style={{ fontWeight:700, color:v>60?T.green:v>40?T.amber:T.red }}>{v}</span> },
            { key:'eudrCompliance', label:'EUDR %', align:'right', render:v => <span style={{ color:v>70?T.green:v>50?T.amber:T.red, fontWeight:600 }}>{v}%</span> },
            { key:'childLaborRisk', label:'Child Lab.', render:v => <RiskBadge level={v} /> },
            { key:'compositeRisk', label:'Risk', align:'right', render:v => <span style={{ fontWeight:700, color:riskColor(v) }}>{v}</span> },
            { key:'dataCompletenessScore', label:'Data %', align:'right', render:v => <span style={{ color:v>80?T.green:v>60?T.amber:T.red, fontWeight:600 }}>{v}%</span> },
          ]}
          data={dimFilteredPortfolio}
          maxRows={20}
        />
      </Card>

      {/* -- 26. COMMODITY PRICE TRACKER -------------------------------- */}
      <SectionTitle badge="Live">Commodity Price Dashboard</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {[
            { name:'WTI Crude', price:'$78.50', change:'-1.2%', unit:'$/bbl', color:T.red },
            { name:'Brent Crude', price:'$82.30', change:'-0.8%', unit:'$/bbl', color:T.red },
            { name:'Natural Gas', price:'$2.85', change:'+3.4%', unit:'$/MMBtu', color:T.green },
            { name:'Gold', price:'$3,052', change:'+0.5%', unit:'$/oz', color:T.gold },
            { name:'Silver', price:'$34.20', change:'+1.1%', unit:'$/oz', color:T.textMut },
            { name:'Copper', price:'$8,820', change:'+2.3%', unit:'$/mt', color:'#dc6834' },
            { name:'Aluminum', price:'$2,480', change:'-0.3%', unit:'$/mt', color:T.textSec },
            { name:'Lithium Carb.', price:'$14,200', change:'-4.5%', unit:'$/mt', color:'#7c3aed' },
            { name:'Nickel', price:'$17,200', change:'+1.8%', unit:'$/mt', color:'#0891b2' },
            { name:'Cobalt', price:'$28,500', change:'-2.1%', unit:'$/mt', color:'#8b5cf6' },
            { name:'Palm Oil', price:'$860', change:'+5.2%', unit:'$/mt', color:T.sage },
            { name:'Soy', price:'$390', change:'+0.7%', unit:'$/bu', color:T.green },
            { name:'Wheat', price:'$5.80', change:'-1.5%', unit:'$/bu', color:T.amber },
            { name:'Coffee', price:'$4.25', change:'+8.2%', unit:'$/lb', color:'#92400e' },
            { name:'Cocoa', price:'$7,850', change:'+12.5%', unit:'$/mt', color:'#7c2d12' },
            { name:'Cotton', price:'$0.68', change:'-0.4%', unit:'$/lb', color:T.navyL },
            { name:'Iron Ore', price:'$105', change:'+1.4%', unit:'$/mt', color:'#64748b' },
            { name:'Steel HRC', price:'$620', change:'-2.8%', unit:'$/mt', color:'#374151' },
            { name:'Rare Earths', price:'$380', change:'+6.3%', unit:'$/kg NdPr', color:'#dc2626' },
            { name:'Hydrogen (Grn)', price:'$5.20', change:'-8.5%', unit:'$/kg', color:'#0d9488' },
          ].map(c => (
            <div key={c.name} style={{ padding:10, borderRadius:8, border:`1px solid ${T.borderL}`, background:T.surface }}>
              <div style={{ fontSize:11, fontWeight:600, color:T.navy }}>{c.name}</div>
              <div style={{ fontSize:18, fontWeight:800, color:T.navy }}>{c.price}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontSize:10, color:c.change.startsWith('+') ? T.green : T.red, fontWeight:700 }}>{c.change}</span>
                <span style={{ fontSize:9, color:T.textMut }}>{c.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* -- 27. TRANSITION READINESS ---------------------------------- */}
      <SectionTitle badge="Transition">Portfolio Transition Readiness Assessment</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
          {[
            { label:'Green Revenue Share', value:`${Math.round(25 + kpis.circularScore * 0.3)}%`, target:'50% by 2030', color:T.green, progress:Math.round(25 + kpis.circularScore * 0.3) },
            { label:'Science-Based Targets', value:`${Math.round(portfolio.filter(c=>c.esgVCScore>55).length / portfolio.length * 100)}%`, target:'100% by 2027', color:T.sage, progress:Math.round(portfolio.filter(c=>c.esgVCScore>55).length / portfolio.length * 100) },
            { label:'CBAM Preparedness', value:`${100 - kpis.avgCBAM}%`, target:'95% by 2026', color:T.navyL, progress:100 - kpis.avgCBAM },
            { label:'Circular Economy', value:`${kpis.circularScore}/100`, target:'70/100 by 2028', color:'#0d9488', progress:kpis.circularScore },
            { label:'Supply Chain Visibility', value:`${Math.round(kpis.totalSC / portfolio.length * 8)}%`, target:'90% by 2027', color:'#7c3aed', progress:Math.round(kpis.totalSC / portfolio.length * 8) },
            { label:'Product Passport Coverage', value:`${kpis.avgDPP}%`, target:'80% by 2027', color:'#ec4899', progress:kpis.avgDPP },
          ].map(item => (
            <div key={item.label} style={{ padding:14, borderRadius:10, border:`1px solid ${T.borderL}`, background:T.surfaceH }}>
              <div style={{ fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:.3, marginBottom:6 }}>{item.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:item.color }}>{item.value}</div>
              <div style={{ background:T.surface, borderRadius:6, height:8, overflow:'hidden', marginTop:8, marginBottom:4 }}>
                <div style={{ background:item.color, height:'100%', width:`${Math.min(100, item.progress)}%`, borderRadius:6 }} />
              </div>
              <div style={{ fontSize:10, color:T.textMut }}>Target: {item.target}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* -- 28. GEOPOLITICAL RISK MAP --------------------------------- */}
      <SectionTitle badge="Geopolitical">Regional Supply Chain Risk Assessment</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Region</th>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Key Commodities</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Geo Risk</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Supply Conc.</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Regulatory</th>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.navy }}>Key Risk</th>
            </tr></thead>
            <tbody>
              {[
                { region:'China', commodities:'Rare Earths, Graphite, Silicon, Steel', geo:85, supply:88, reg:72, risk:'Export restrictions, geopolitical tension' },
                { region:'DRC (Congo)', commodities:'Cobalt, Copper, Tantalum', geo:92, supply:95, reg:35, risk:'Conflict minerals, child labor, instability' },
                { region:'Australia', commodities:'Lithium, Iron Ore, Coal, LNG', geo:25, supply:52, reg:88, risk:'Distance, drought, export policy changes' },
                { region:'Brazil', commodities:'Soy, Iron Ore, Coffee, Cattle', geo:42, supply:45, reg:55, risk:'Deforestation, EUDR compliance' },
                { region:'Indonesia', commodities:'Nickel, Palm Oil, Coal, Rubber', geo:55, supply:68, reg:48, risk:'Processing ban, deforestation, labor' },
                { region:'Chile', commodities:'Copper, Lithium, Molybdenum', geo:38, supply:35, reg:75, risk:'Water scarcity, mining royalties' },
                { region:'Russia', commodities:'Palladium, Nickel, Gas, Aluminum', geo:95, supply:42, reg:22, risk:'Sanctions, unreliable supply, currency' },
                { region:'Middle East', commodities:'Oil, Gas, Petrochemicals', geo:78, supply:55, reg:45, risk:'Conflict, transition risk, OPEC policy' },
                { region:'EU', commodities:'Steel (recycled), Chemicals, Autos', geo:18, supply:22, reg:95, risk:'High regulation (CBAM, EUDR, CSRD)' },
                { region:'India', commodities:'Steel, Cotton, Rice, Iron Ore', geo:35, supply:38, reg:62, risk:'Water stress, monsoon, labor standards' },
              ].map((r, ri) => (
                <tr key={r.region} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontWeight:700, color:T.navy }}>{r.region}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontSize:11, color:T.textSec }}>{r.commodities}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center' }}><HeatCell value={r.geo} /></td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center' }}><HeatCell value={r.supply} /></td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center' }}><HeatCell value={r.reg} /></td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontSize:11, color:T.textMut }}>{r.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* -- 29. SUSTAINABILITY SCORES SCATTER -------------------------- */}
      <SectionTitle badge="Scatter">Risk vs Sustainability (Portfolio)</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top:10, right:20, bottom:20, left:20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="compositeRisk" name="Composite Risk" tick={{ fontSize:10 }} label={{ value:'Composite Risk Score', position:'insideBottom', offset:-10, style:{ fontSize:11, fill:T.textMut } }} />
            <YAxis dataKey="esgVCScore" name="ESG VC Score" tick={{ fontSize:10 }} label={{ value:'ESG Value Chain Score', angle:-90, position:'insideLeft', style:{ fontSize:11, fill:T.textMut } }} />
            <ZAxis dataKey="commodityExposurePct" range={[30, 300]} name="Exposure %" />
            <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11, borderRadius:8 }} formatter={(v, name) => [v, name]} labelFormatter={() => ''} />
            <Scatter data={portfolio.slice(0, 25).map(c => ({ compositeRisk:c.compositeRisk, esgVCScore:c.esgVCScore, commodityExposurePct:c.commodityExposurePct, company:c.company_name }))} fill={T.navy} fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ fontSize:11, color:T.textMut, marginTop:6 }}>Bubble size represents commodity exposure %. Ideal quadrant: low risk (left) + high ESG score (top). Companies in bottom-right need urgent attention.</div>
      </Card>

      {/* -- 30. COMMODITY LIFECYCLE TIMELINE --------------------------- */}
      <SectionTitle badge="Timeline">Commodity Lifecycle Value Chain</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', gap:4, justifyContent:'space-between' }}>
          {['Extraction','Processing','Manufacturing','Distribution','Use Phase','End of Life'].map((stage, i) => (
            <div key={stage} style={{ flex:1, textAlign:'center', padding:12, borderRadius:8, background:[T.red+'12',T.amber+'12',T.gold+'12',T.navyL+'12',T.sage+'12',T.green+'12'][i], border:`1px solid ${[T.red,T.amber,T.gold,T.navyL,T.sage,T.green][i]}33`, position:'relative' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{['\u26CF','\u2699','🏭','🚚','👤','\u267B'][i]}</div>
              <div style={{ fontSize:11, fontWeight:700, color:T.navy }}>{stage}</div>
              <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>Impact: {['Very High','High','Medium','Low','Variable','Medium'][i]}</div>
              <div style={{ fontSize:9, color:T.textSec, marginTop:2 }}>{['Raw material, mining, farming','Refining, smelting, milling','Assembly, construction','Logistics, warehousing','Consumer/industrial use','Recycling, disposal'][i]}</div>
              {i < 5 && <div style={{ position:'absolute', right:-12, top:'50%', transform:'translateY(-50%)', fontSize:16, color:T.textMut, zIndex:1 }}>\u2192</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:10, background:T.surfaceH, borderRadius:8, fontSize:11, color:T.textSec }}>
          Hub integrates data from all 6 lifecycle stages across {HEATMAP_COMMODITIES.length} commodities. Extraction and end-use typically carry highest environmental burden. Circular economy strategies aim to minimize waste by looping materials from end-of-life back to manufacturing.
        </div>
      </Card>

      {/* -- 31. MODULE INTERCONNECTION MATRIX -------------------------- */}
      <SectionTitle badge="Matrix">Module Interconnection Matrix</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', fontSize:10 }}>
            <thead><tr>
              <th style={{ padding:6, borderBottom:`2px solid ${T.border}`, fontSize:9, color:T.navy }}>From \ To</th>
              {MODULES.slice(0,7).map(m => <th key={m.id} style={{ padding:6, borderBottom:`2px solid ${T.border}`, fontSize:9, color:m.color, writingMode:'vertical-rl', transform:'rotate(180deg)', height:80 }}>{m.name.slice(0,14)}</th>)}
            </tr></thead>
            <tbody>
              {MODULES.slice(0,7).map((mFrom, ri) => (
                <tr key={mFrom.id} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:6, fontWeight:700, color:mFrom.color, fontSize:9, borderBottom:`1px solid ${T.borderL}`, whiteSpace:'nowrap' }}>{mFrom.name.slice(0,14)}</td>
                  {MODULES.slice(0,7).map((mTo, ci) => {
                    const connected = ri !== ci && (mFrom.outputsTo?.some(o => mTo.name.includes(o)) || Math.abs(ri-ci) <= 2);
                    return <td key={mTo.id} style={{ padding:6, textAlign:'center', borderBottom:`1px solid ${T.borderL}`, background:ri===ci ? T.navy+'12' : connected ? T.green+'12' : 'transparent' }}>
                      {ri === ci ? '\u2014' : connected ? <span style={{ color:T.green, fontWeight:700 }}>\u2713</span> : <span style={{ color:T.textMut }}>\u00B7</span>}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10, color:T.textMut, marginTop:8 }}>Green checkmarks indicate data flows between modules. The Hub aggregates all module outputs into the central executive view.</div>
      </Card>

      {/* -- 32. HISTORICAL TRENDS ------------------------------------- */}
      <SectionTitle badge="12 Months">Key Commodity Price Trends</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={[
            { month:'Apr 25', oil:82, carbon:88, lithium:18500, copper:8200 },
            { month:'May 25', oil:79, carbon:85, lithium:17200, copper:8400 },
            { month:'Jun 25', oil:75, carbon:78, lithium:16800, copper:8600 },
            { month:'Jul 25', oil:72, carbon:72, lithium:16200, copper:8500 },
            { month:'Aug 25', oil:74, carbon:70, lithium:15800, copper:8300 },
            { month:'Sep 25', oil:76, carbon:68, lithium:15500, copper:8450 },
            { month:'Oct 25', oil:78, carbon:65, lithium:15200, copper:8550 },
            { month:'Nov 25', oil:80, carbon:66, lithium:14800, copper:8650 },
            { month:'Dec 25', oil:77, carbon:64, lithium:14500, copper:8700 },
            { month:'Jan 26', oil:76, carbon:66, lithium:14400, copper:8750 },
            { month:'Feb 26', oil:78, carbon:67, lithium:14250, copper:8800 },
            { month:'Mar 26', oil:78.5, carbon:68, lithium:14200, copper:8820 },
          ]} margin={{ top:10, right:30, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="month" tick={{ fontSize:10, fill:T.textSec }} />
            <YAxis yAxisId="left" tick={{ fontSize:10, fill:T.textSec }} label={{ value:'Oil ($/bbl) & Carbon (\u20AC/t)', angle:-90, position:'insideLeft', style:{ fontSize:9, fill:T.textMut } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
            <Legend wrapperStyle={{ fontSize:10 }} />
            <Line yAxisId="left" type="monotone" dataKey="oil" name="WTI Oil ($/bbl)" stroke={T.red} strokeWidth={2} dot={{ r:3 }} />
            <Line yAxisId="left" type="monotone" dataKey="carbon" name="EU ETS (\u20AC/t)" stroke={T.navy} strokeWidth={2} dot={{ r:3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* -- 33. STRANDED ASSET RISK TABLE ------------------------------ */}
      <SectionTitle badge="Fossil Exposure">Stranded Asset Risk Assessment</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:16 }}>
          {[
            { label:'Fossil Fuel Holdings', value:`${portfolio.filter(c => ['Oil & Gas','Energy','Mining'].includes(c.topCommodity)).length}`, sub:'Direct exposure', color:T.red },
            { label:'Avg Stranded Risk', value:`${Math.round(portfolio.reduce((a,c) => a + c.strandedAssetRisk, 0) / portfolio.length)}/100`, sub:'Portfolio average', color:T.amber },
            { label:'Carbon Price Sensitivity', value:`-${fmt(kpis.totalFinFlowMn * 0.032, 0)}Mn`, sub:'Per +$10/tCO2', color:T.red },
            { label:'Transition-Ready', value:`${portfolio.filter(c => c.strandedAssetRisk < 15).length}`, sub:'Low stranding risk', color:T.green },
          ].map(item => (
            <KPICard key={item.label} label={item.label} value={item.value} sub={item.sub} color={item.color} />
          ))}
        </div>
        <SortableTable
          columns={[
            { key:'company_name', label:'Company' },
            { key:'topCommodity', label:'Primary Commodity' },
            { key:'strandedAssetRisk', label:'Stranded Risk', align:'right', render:v => <span style={{ fontWeight:700, color:v>30?T.red:v>15?T.amber:T.green }}>{v}/100</span> },
            { key:'carbonExposure', label:'Carbon Exposure %', align:'right', render:v => <span style={{ color:v>30?T.red:v>15?T.amber:T.green, fontWeight:600 }}>{v}%</span> },
            { key:'dimensionClimate', label:'Climate Risk', align:'right', render:v => <span style={{ fontWeight:600, color:riskColor(v) }}>{v}</span> },
            { key:'cbamExposure', label:'CBAM %', align:'right' },
          ]}
          data={[...portfolio].sort((a,b) => b.strandedAssetRisk - a.strandedAssetRisk)}
          maxRows={10}
        />
      </Card>

      {/* -- 34. SCENARIO IMPACT DEEP ANALYSIS ------------------------- */}
      <SectionTitle badge="Deep Analysis">Scenario Impact by Sector</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead><tr>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy }}>Scenario</th>
              {['Energy','Metals','Agriculture','Chemicals','Mining'].map(s => (
                <th key={s} style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:10 }}>{s}</th>
              ))}
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy }}>Net Impact</th>
            </tr></thead>
            <tbody>
              {SCENARIO_PRESETS.map((sc, ri) => {
                const impacts = [
                  Math.round(-5 + seed(ri * 211) * 10),
                  Math.round(-3 + seed(ri * 223) * 6),
                  Math.round(-2 + seed(ri * 229) * 4),
                  Math.round(-4 + seed(ri * 233) * 8),
                  Math.round(-6 + seed(ri * 239) * 12),
                ];
                return (
                  <tr key={sc.id} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontWeight:600, color:T.navy }}>{sc.name}</td>
                    {impacts.map((imp, ci) => (
                      <td key={ci} style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', fontWeight:700, color:imp > 0 ? T.green : imp < -3 ? T.red : T.amber }}>{imp > 0 ? '+' : ''}{imp}%</td>
                    ))}
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', fontWeight:800, color:sc.portfolioImpact > 0 ? T.green : T.red }}>{sc.portfolioImpact > 0 ? '+' : ''}{sc.portfolioImpact}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:10, fontSize:10, color:T.textMut }}>Sector-level impact estimates derived from commodity price sensitivity models. Net impact is the weighted average across portfolio commodity exposures.</div>
      </Card>

      {/* -- 35. SUPPLY CHAIN TRACEABILITY ------------------------------ */}
      <SectionTitle badge="Traceability">Supply Chain Traceability Status</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
          {[
            { tier:'Tier 1 Direct Suppliers', coverage:92, verified:85, count:Math.round(kpis.totalSC * 0.3), risk:'Low', color:T.green },
            { tier:'Tier 2 Component Suppliers', coverage:68, verified:52, count:Math.round(kpis.totalSC * 0.4), risk:'Medium', color:T.amber },
            { tier:'Tier 3 Raw Material Suppliers', coverage:35, verified:18, count:Math.round(kpis.totalSC * 0.2), risk:'High', color:T.red },
            { tier:'Tier 4+ Deep Supply Chain', coverage:12, verified:5, count:Math.round(kpis.totalSC * 0.1), risk:'Very High', color:'#7c2d12' },
          ].map(t => (
            <div key={t.tier} style={{ padding:14, borderRadius:10, border:`1px solid ${T.borderL}`, borderTop:`4px solid ${t.color}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>{t.tier}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:T.textSec }}>Mapped</span>
                <span style={{ fontSize:14, fontWeight:700, color:t.color }}>{t.coverage}%</span>
              </div>
              <div style={{ background:T.surfaceH, borderRadius:4, height:8, overflow:'hidden', marginBottom:8 }}>
                <div style={{ background:t.color, height:'100%', width:`${t.coverage}%`, borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:T.textMut }}>Verified: {t.verified}% | Entities: {t.count} | Risk: <span style={{ fontWeight:600, color:t.color }}>{t.risk}</span></div>
            </div>
          ))}
        </div>
      </Card>

      {/* -- 36. ESG MOMENTUM TRACKER ---------------------------------- */}
      <SectionTitle badge="Momentum">ESG Score Momentum (3-Month)</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={portfolio.slice(0, 15).map(c => ({
            company: c.company_name?.slice(0, 12),
            current: c.esgVCScore,
            change: Math.round(-8 + seed(c.esgVCScore * 127) * 16),
          }))} margin={{ top:10, right:20, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="company" tick={{ fontSize:9, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
            <Legend wrapperStyle={{ fontSize:10 }} />
            <Bar dataKey="current" name="Current ESG VC Score" fill={T.sage}>
              {portfolio.slice(0, 15).map((_, i) => <Cell key={i} fill={T.sage} />)}
            </Bar>
            <Bar dataKey="change" name="3-Month Change" fill={T.gold}>
              {portfolio.slice(0, 15).map((c, i) => {
                const chg = Math.round(-8 + seed(c.esgVCScore * 127) * 16);
                return <Cell key={i} fill={chg > 0 ? T.green : chg < -3 ? T.red : T.amber} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>ESG Value Chain scores over the past 3 months. Green bars = improving, Red = deteriorating. Factors: disclosure quality, controversy events, supply chain audits, regulatory compliance changes.</div>
      </Card>

      {/* -- 37. GLOSSARY AND METHODOLOGY ------------------------------ */}
      <SectionTitle badge="Reference">Methodology & Glossary</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {[
            { term:'Composite Risk Score', def:'Weighted average of Financial (35%), ESG (35%), and Climate (30%) dimension scores. Scale 0-100.' },
            { term:'Externality Gap', def:'Unpriced environmental and social costs not reflected in market value. Includes carbon, water, health, biodiversity.' },
            { term:'EUDR Compliance', def:'EU Deforestation Regulation compliance score based on traceability, due diligence, and certification status.' },
            { term:'Circular Economy Score', def:'Material recyclability, take-back programs, recycled content, and product longevity assessment. Scale 0-100.' },
            { term:'CBAM Exposure', def:'Estimated cost impact from EU Carbon Border Adjustment Mechanism on imported goods with embedded carbon.' },
            { term:'ML Model R-squared', def:'Coefficient of determination for predictive models. Values >90% indicate strong predictive accuracy.' },
            { term:'Supply Chain Tier', def:'Tier 1 = direct suppliers, Tier 2 = component suppliers, Tier 3 = raw materials, Tier 4+ = deep supply chain.' },
            { term:'Data Completeness', def:'Percentage of required data fields populated across all modules. Coverage x Freshness x Quality composite.' },
            { term:'Carbon Payback', def:'Years for renewable energy to offset its manufacturing carbon footprint through avoided grid emissions.' },
            { term:'Stranded Asset Risk', def:'Probability that assets become uneconomic due to climate policy, technology shifts, or demand changes.' },
          ].map(item => (
            <div key={item.term} style={{ padding:12, borderRadius:8, border:`1px solid ${T.borderL}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{item.term}</div>
              <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>{item.def}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* -- 38. CIRCULAR ECONOMY SCOREBOARD ----------------------------- */}
      <SectionTitle badge="Circular">Portfolio Circular Economy Scoreboard</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={portfolio.slice(0, 15).map(c => ({
            company: c.company_name?.slice(0, 14),
            circular: c.circularScore,
            dpp: c.productPassportCoverage,
            eudr: c.eudrCompliance,
          }))} margin={{ top:10, right:30, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="company" tick={{ fontSize:9, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} domain={[0, 100]} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
            <Legend wrapperStyle={{ fontSize:10 }} />
            <Bar dataKey="circular" name="Circular Score" fill={T.sage} radius={[4,4,0,0]} />
            <Line type="monotone" dataKey="dpp" name="DPP Coverage %" stroke={'#ec4899'} strokeWidth={2} dot={{ r:3 }} />
            <Line type="monotone" dataKey="eudr" name="EUDR Compliance %" stroke={T.green} strokeWidth={2} dot={{ r:3 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>Circular Economy Score measures material recyclability, take-back programs, recycled content, and product design for disassembly. DPP = Digital Product Passport coverage under EU DPP regulation.</div>
      </Card>

      {/* -- 39. WEEKLY MARKET MOVERS ---------------------------------- */}
      <SectionTitle badge="This Week">Weekly Commodity Market Movers</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:10 }}>Top Gainers</div>
            {[
              { name:'Cocoa', change:'+12.5%', reason:'West Africa production deficit', price:'$7,850/mt' },
              { name:'Coffee', change:'+8.2%', reason:'Brazilian drought impacts', price:'$4.25/lb' },
              { name:'Rare Earths (NdPr)', change:'+6.3%', reason:'China export quota tightening', price:'$380/kg' },
              { name:'Palm Oil', change:'+5.2%', reason:'EUDR inventory build', price:'$860/mt' },
              { name:'Natural Gas', change:'+3.4%', reason:'Cold snap demand', price:'$2.85/MMBtu' },
            ].map(g => (
              <div key={g.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.borderL}` }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{g.name}</span>
                  <span style={{ fontSize:10, color:T.textMut, marginLeft:8 }}>{g.reason}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:14, fontWeight:800, color:T.green }}>{g.change}</span>
                  <div style={{ fontSize:10, color:T.textMut }}>{g.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:10 }}>Top Decliners</div>
            {[
              { name:'Lithium Carbonate', change:'-4.5%', reason:'Oversupply from new mines', price:'$14,200/mt' },
              { name:'Steel HRC', change:'-2.8%', reason:'Weak construction demand', price:'$620/mt' },
              { name:'EU Carbon (EUA)', change:'-2.2%', reason:'Mild winter, lower demand', price:'\u20AC68/t' },
              { name:'Cobalt', change:'-2.1%', reason:'LFP battery shift reduces demand', price:'$28,500/mt' },
              { name:'Wheat', change:'-1.5%', reason:'Favorable harvest outlook', price:'$5.80/bu' },
            ].map(d => (
              <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.borderL}` }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{d.name}</span>
                  <span style={{ fontSize:10, color:T.textMut, marginLeft:8 }}>{d.reason}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:14, fontWeight:800, color:T.red }}>{d.change}</span>
                  <div style={{ fontSize:10, color:T.textMut }}>{d.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* -- 40. PLATFORM VERSION AND AUDIT LOG ------------------------- */}
      <SectionTitle badge="System">Platform Audit & Version Info</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {[
            { label:'Platform Version', value:'v6.0.0', sub:'Sprint Y Release', color:T.navy },
            { label:'Data Last Refreshed', value:'2026-03-26', sub:'09:15 UTC', color:T.sage },
            { label:'Total Modules', value:'10', sub:'All active', color:T.green },
            { label:'Portfolio Holdings', value:`${portfolio.length}`, sub:'WRAPPED from localStorage', color:T.navyL },
            { label:'ML Models Active', value:`${mlModels.length}`, sub:`Avg R\u00B2: ${kpis.mlR2}%`, color:T.amber },
            { label:'Alerts Active', value:`${ALERT_TYPES.reduce((a,t)=>a+t.count,0)}`, sub:`${ALERT_TYPES.filter(a=>a.severity==='Critical').length} critical`, color:T.red },
            { label:'Heatmap Coverage', value:'25 x 3 x 6', sub:'Commodities x Dims x Stages', color:'#7c3aed' },
            { label:'Scenario Presets', value:`${SCENARIO_PRESETS.length}`, sub:'Combinable scenarios', color:T.gold },
            { label:'Regulations Tracked', value:`${REGS.length}`, sub:'EU + US + Global', color:'#0d9488' },
            { label:'Carbon Markets', value:`${CARBON_MKTS.length}`, sub:'ETS + voluntary', color:T.navyL },
          ].map(item => (
            <div key={item.label} style={{ padding:10, borderRadius:8, background:T.surfaceH }}>
              <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:.3 }}>{item.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:item.color, marginTop:4 }}>{item.value}</div>
              {item.sub && <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* -- 41. CLIMATE EXPOSURE BY COMMODITY TYPE --------------------- */}
      <SectionTitle badge="Climate">Climate Exposure by Commodity Type</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={commodityExposureRanked.slice(0, 8).map(c => ({
            commodity: c.commodity,
            avgExposure: c.avgExposure,
            avgESG: c.avgESG,
            companies: c.companies,
          }))} margin={{ top:10, right:30, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="commodity" tick={{ fontSize:10, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} domain={[0, 100]} />
            <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
            <Legend wrapperStyle={{ fontSize:10 }} />
            <Bar dataKey="avgExposure" name="Avg Exposure %" fill={T.navy} radius={[4,4,0,0]} />
            <Bar dataKey="avgESG" name="Avg ESG Score" fill={T.sage} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* -- 42. SECTOR-COMMODITY MATRIX -------------------------------- */}
      <SectionTitle badge="Matrix">Sector-Commodity Exposure Matrix</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
            <thead><tr>
              <th style={{ padding:'6px 8px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:10, fontWeight:700, color:T.navy }}>Sector</th>
              {['Oil & Gas','Metals','Agriculture','Chemicals','Mining','Energy','Materials','Tech Metals'].map(c => (
                <th key={c} style={{ padding:'6px 8px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontSize:9, fontWeight:600, color:T.navy }}>{c}</th>
              ))}
            </tr></thead>
            <tbody>
              {sectorBreakdown.slice(0, 8).map((sec, ri) => (
                <tr key={sec.name} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'5px 8px', fontWeight:700, color:T.navy, fontSize:10, borderBottom:`1px solid ${T.borderL}` }}>{sec.name}</td>
                  {['Oil & Gas','Metals','Agriculture','Chemicals','Mining','Energy','Materials','Tech Metals'].map(c => {
                    const count = portfolio.filter(p => (p.sector || 'Other') === sec.name && p.topCommodity === c).length;
                    return <td key={c} style={{ padding:'5px 8px', textAlign:'center', borderBottom:`1px solid ${T.borderL}` }}>
                      {count > 0 ? <span style={{ display:'inline-block', width:24, height:24, lineHeight:'24px', borderRadius:'50%', background:count > 3 ? T.red+'22' : count > 1 ? T.amber+'22' : T.green+'22', color:count > 3 ? T.red : count > 1 ? T.amber : T.green, fontSize:10, fontWeight:700 }}>{count}</span> : <span style={{ color:T.textMut }}>\u00B7</span>}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>Cell values show number of portfolio companies in each sector-commodity intersection. Larger circles indicate concentration risk.</div>
      </Card>

      {/* -- 43. PORTFOLIO SUMMARY STATS -------------------------------- */}
      <SectionTitle badge="Summary">Portfolio Summary Statistics</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {[
            { label:'Total Holdings', value:portfolio.length, color:T.navy },
            { label:'Sectors Covered', value:sectorBreakdown.length, color:T.navyL },
            { label:'Commodity Categories', value:commodityExposureRanked.length, color:T.gold },
            { label:'Supply Chains Total', value:fmtK(kpis.totalSC), color:T.sage },
            { label:'LCA Products Total', value:fmtK(kpis.totalLCA), color:T.green },
            { label:'Financial Flows', value:fmtMn(kpis.totalFinFlowMn), color:T.gold },
            { label:'Externality Total', value:fmtMn(kpis.totalExternalityMn), color:T.red },
            { label:'Lifecycle GHG Total', value:`${fmtK(kpis.totalGHG)} tCO\u2082`, color:'#0d9488' },
            { label:'Water Footprint', value:`${fmtK(kpis.totalWater)} m\u00B3`, color:'#0284c7' },
            { label:'Biodiversity Impact', value:`${kpis.totalBio} species`, color:T.sage },
          ].map(item => (
            <div key={item.label} style={{ padding:12, borderRadius:8, background:T.surfaceH, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:.3 }}>{item.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:item.color, marginTop:6 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* -- 44. DATA REFRESH & API STATUS ------------------------------- */}
      <SectionTitle badge="Status">Data Refresh & Integration Status</SectionTitle>
      <Card style={{ marginBottom:28 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11 }}>Data Feed</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11 }}>Status</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11 }}>Frequency</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11 }}>Last Sync</th>
              <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11 }}>Latency</th>
              <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontWeight:700, color:T.navy, fontSize:11 }}>Coverage</th>
            </tr></thead>
            <tbody>
              {[
                { feed:'Commodity Prices (Reuters)', status:'Active', freq:'Real-time', sync:'2026-03-26 09:14', latency:'<1s', coverage:'50 commodities' },
                { feed:'Carbon Markets (ICAP)', status:'Active', freq:'15-min', sync:'2026-03-26 09:00', latency:'2s', coverage:'8 ETS markets' },
                { feed:'ESG Ratings (MSCI/Sust.)', status:'Active', freq:'Daily', sync:'2026-03-26 06:00', latency:'4hr', coverage:'Portfolio holdings' },
                { feed:'Geopolitical Risk (BERT NLP)', status:'Active', freq:'Hourly', sync:'2026-03-26 08:00', latency:'15min', coverage:'Global news feeds' },
                { feed:'Satellite Imagery (Sentinel)', status:'Active', freq:'Weekly', sync:'2026-03-22', latency:'48hr', coverage:'Deforestation, inventory' },
                { feed:'Supply Chain (Bloomberg)', status:'Active', freq:'Daily', sync:'2026-03-26 07:00', latency:'6hr', coverage:'Tier 1-2 suppliers' },
                { feed:'EPD International API', status:'Active', freq:'On-demand', sync:'2026-03-25', latency:'120ms', coverage:'6,200+ EPDs' },
                { feed:'EC3 Construction DB', status:'Active', freq:'On-demand', sync:'2026-03-24', latency:'200ms', coverage:'100K+ materials' },
                { feed:'Regulatory Calendar', status:'Active', freq:'Weekly', sync:'2026-03-24', latency:'24hr', coverage:'7 frameworks' },
                { feed:'ML Model Predictions', status:'Active', freq:'Daily retrain', sync:'2026-03-26 05:00', latency:'2hr', coverage:'12 models' },
              ].map((f, ri) => (
                <tr key={f.feed} style={{ background:ri%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontWeight:600, color:T.navy }}>{f.feed}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center' }}><Badge bg={T.green+'18'} color={T.green}>{f.status}</Badge></td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', fontSize:11, color:T.textSec }}>{f.freq}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', fontSize:11, color:T.textMut }}>{f.sync}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, textAlign:'center', fontSize:11, fontWeight:600, color:T.navyL }}>{f.latency}</td>
                  <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderL}`, fontSize:11, color:T.textSec }}>{f.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* -- 45. CROSS-NAVIGATION -------------------------------------- */}
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
          { label:'EPD/LCA Database', path:'/epd-lca-database' },
          { label:'Digital Product Passport', path:'/digital-product-passport' },
        ].map(nav => (
          <button key={nav.path} onClick={() => navigate(nav.path)} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface, cursor:'pointer', fontSize:11, fontWeight:600, color:T.navyL, transition:'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = T.navy} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            {nav.label} \u2192
          </button>
        ))}
      </div>

      {/* -- FOOTER ---------------------------------------------------- */}
      <div style={{ textAlign:'center', padding:'16px 0', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textMut }}>
        Commodity Lifecycle Intelligence Hub \u00B7 EP-Y8 \u00B7 Sprint Y \u00B7 50 Commodities \u00B7 25 Heatmap \u00B7 3 Dimensions \u00B7 10 Modules \u00B7 {portfolio.length} Companies \u00B7 {mlModels.length} ML Models \u00B7 v6.0
      </div>
    </div>
  );
}
